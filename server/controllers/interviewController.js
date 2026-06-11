const JobPost          = require('../models/JobPost');
const User             = require('../models/user');
const InterviewSession = require('../models/InterviewSession');
const hf               = require('../services/hfService');

const TOTAL_QUESTIONS = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeParseJson(text) {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(cleaned); } catch { return null; }
}

// Extract a JSON array / object from a larger text that might have prose around it
function extractJson(text) {
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) { const r = safeParseJson(arrMatch[0]); if (r) return r; }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) { const r = safeParseJson(objMatch[0]); if (r) return r; }
  return null;
}

async function callHF(systemPrompt, maxTokens = 600) {
  if (!process.env.HF_TOKEN) return null;
  try {
    const result = await hf.chatCompletion({
      model: 'Qwen/Qwen2.5-7B-Instruct:fastest',
      messages: [{ role: 'system', content: systemPrompt }],
      max_new_tokens: maxTokens,
      temperature: 0.6,
      top_p: 0.9,
    });
    return result?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('[Interview] HF error:', err.message);
    return null;
  }
}

// ── Question generation ───────────────────────────────────────────────────────

const CATEGORY_POOL = ['Technical', 'Scenario-Based', 'Problem-Solving', 'Behavioral', 'Skill-Gap'];

function scriptedQuestions(job, userSkills) {
  const title = job.title || 'Software Engineer';
  const reqs  = (job.requirements || []).slice(0, 4);
  const tech  = reqs[0] || 'your primary tech stack';
  const tech2 = reqs[1] || 'databases';

  return [
    { question: `Walk me through your experience with ${tech} and a project where you applied it.`, category: 'Technical' },
    { question: `You're asked to implement a feature in ${tech} but discover the requirements are unclear. How do you proceed?`, category: 'Scenario-Based' },
    { question: `Describe a time you encountered a difficult bug. How did you debug and resolve it?`, category: 'Problem-Solving' },
    { question: `Tell me about a time you collaborated with a team on a tight deadline. What was your role?`, category: 'Behavioral' },
    { question: `This role mentions ${tech2}. Can you explain your experience with it and areas you'd want to improve?`, category: 'Skill-Gap' },
    { question: `What do you think makes a ${title} successful in this kind of role, and how do you measure up?`, category: 'Behavioral' },
  ];
}

async function generateQuestions(job, user) {
  const prompt = `You are Nexi, an AI interview coach for GIU Nexus.
Generate exactly ${TOTAL_QUESTIONS} interview questions for a student applying to this job.

Job Title: ${job.title}
Company: ${job.company}
Category: ${job.category}
Description: ${job.description?.slice(0, 400)}
Requirements: ${(job.requirements || []).join(', ')}

Student Profile:
- Name: ${user.name}
- Skills: ${(user.skills || []).join(', ') || 'not specified'}
- Major: ${user.major || 'not specified'}
- Bio: ${user.bio?.slice(0, 200) || 'not provided'}

Question Rules:
- Cover these categories in order: Technical, Scenario-Based, Problem-Solving, Behavioral, Skill-Gap, Behavioral
- Tailor questions specifically to the technologies and requirements listed above
- Do NOT ask generic textbook definitions; ask practical and situational questions
- Vary difficulty: start medium, increase if the student seems strong
- Each question should feel like it comes from a real hiring manager

Respond with a JSON array ONLY (no prose):
[
  { "question": "...", "category": "Technical" },
  { "question": "...", "category": "Scenario-Based" },
  ...
]`;

  const raw = await callHF(prompt, 700);
  if (raw) {
    const parsed = extractJson(raw);
    if (Array.isArray(parsed) && parsed.length >= TOTAL_QUESTIONS) {
      return parsed.slice(0, TOTAL_QUESTIONS).map((q, i) => ({
        question: String(q.question || ''),
        category: CATEGORY_POOL[i] || 'General',
      })).filter(q => q.question.length > 10);
    }
  }
  return scriptedQuestions(job, user.skills || []);
}

// ── Answer evaluation ─────────────────────────────────────────────────────────

function scriptedFeedback(question, answer) {
  const len = (answer || '').trim().split(/\s+/).length;
  const base = Math.min(80, 50 + len * 0.5);
  return {
    score:             Math.round(base),
    technicalAccuracy: Math.round(base - 5 + Math.random() * 10),
    communication:     Math.round(base - 5 + Math.random() * 10),
    completeness:      Math.round(base - 5 + Math.random() * 10),
    strengths:         ['Attempted to address the question', 'Showed relevant knowledge'],
    improvements:      ['Provide more specific examples', 'Expand on technical depth'],
    suggestedAnswer:   'A strong answer would include concrete examples, clear reasoning, and specific technical details relevant to the role.',
    strongCandidateTips: ['Specific project examples', 'Quantified impact', 'Clear technical reasoning'],
  };
}

async function evaluateAnswer(question, answer, jobContext, questionIndex, previousScores) {
  const trend = previousScores.length > 0
    ? `Previous scores: ${previousScores.join(', ')}. Adjust difficulty expectation accordingly.`
    : 'This is the first answer — use a fair baseline.';

  const prompt = `You are Nexi, an AI interview evaluator for GIU Nexus.
Evaluate the student's answer to this interview question.

Job Context: ${jobContext}

Question (${questionIndex + 1}/${TOTAL_QUESTIONS}): ${question}
Student Answer: ${answer}

${trend}

Evaluation Criteria:
1. Technical Accuracy (0-100): correctness and depth of technical knowledge
2. Communication (0-100): clarity, structure, and articulation
3. Completeness (0-100): how fully the question was addressed

Respond with a JSON object ONLY (no prose):
{
  "score": <overall 0-100>,
  "technicalAccuracy": <0-100>,
  "communication": <0-100>,
  "completeness": <0-100>,
  "strengths": ["<specific strength>", "<specific strength>"],
  "improvements": ["<specific improvement>", "<specific improvement>"],
  "suggestedAnswer": "<1-2 sentences on the ideal answer>",
  "strongCandidateTips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}`;

  const raw = await callHF(prompt, 500);
  if (raw) {
    const parsed = extractJson(raw);
    if (parsed && typeof parsed.score === 'number') {
      return {
        score:             Math.max(0, Math.min(100, Math.round(parsed.score))),
        technicalAccuracy: Math.max(0, Math.min(100, Math.round(parsed.technicalAccuracy || parsed.score))),
        communication:     Math.max(0, Math.min(100, Math.round(parsed.communication    || parsed.score))),
        completeness:      Math.max(0, Math.min(100, Math.round(parsed.completeness     || parsed.score))),
        strengths:         Array.isArray(parsed.strengths)           ? parsed.strengths.slice(0, 3)           : [],
        improvements:      Array.isArray(parsed.improvements)        ? parsed.improvements.slice(0, 3)        : [],
        suggestedAnswer:   parsed.suggestedAnswer || '',
        strongCandidateTips: Array.isArray(parsed.strongCandidateTips) ? parsed.strongCandidateTips.slice(0, 4) : [],
      };
    }
  }
  return scriptedFeedback(question, answer);
}

// ── Final summary ─────────────────────────────────────────────────────────────

function computeFinalScores(questions) {
  const answered = questions.filter(q => q.feedback && q.feedback.score != null);
  if (!answered.length) return null;

  const avg = (key) =>
    Math.round(answered.reduce((s, q) => s + (q.feedback[key] || 0), 0) / answered.length);

  const allStrengths   = answered.flatMap(q => q.feedback.strengths   || []);
  const allWeaknesses  = answered.flatMap(q => q.feedback.improvements || []);
  const allSkillTips   = answered.flatMap(q => q.feedback.strongCandidateTips || []);

  // Deduplicate by taking first occurrence
  const unique = (arr) => [...new Map(arr.map(s => [s.toLowerCase().trim(), s])).values()];

  return {
    overall:           avg('score'),
    technicalAccuracy: avg('technicalAccuracy'),
    communication:     avg('communication'),
    completeness:      avg('completeness'),
    topStrengths:      unique(allStrengths).slice(0, 4),
    keyWeaknesses:     unique(allWeaknesses).slice(0, 4),
    recommendedSkills: unique(allSkillTips).slice(0, 5),
  };
}

// ── Route handlers ────────────────────────────────────────────────────────────

const startInterview = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId    = req.user._id || req.user.id;

    const [job, userDoc] = await Promise.all([
      JobPost.findById(jobId).lean(),
      User.findById(userId).select('name skills bio academicInformation').lean(),
    ]);

    if (!job)    return res.status(404).json({ success: false, message: 'Job not found.' });
    if (!userDoc) return res.status(404).json({ success: false, message: 'User not found.' });

    const userCtx = {
      name:   userDoc.name,
      skills: userDoc.skills || [],
      bio:    userDoc.bio    || '',
      major:  userDoc.academicInformation?.major || '',
      gpa:    userDoc.academicInformation?.gpa   || null,
    };

    const rawQuestions = await generateQuestions(job, userCtx);
    if (!rawQuestions || rawQuestions.length === 0) {
      return res.status(500).json({ success: false, message: 'Could not generate interview questions.' });
    }

    const session = await InterviewSession.create({
      user: userId,
      job:  jobId,
      jobSnapshot: {
        title:        job.title,
        company:      job.company,
        description:  job.description,
        requirements: job.requirements,
        category:     job.category,
      },
      userSnapshot: userCtx,
      questions:    rawQuestions.map(q => ({ question: q.question, category: q.category })),
      currentIndex: 0,
    });

    return res.status(201).json({
      success:   true,
      sessionId: session._id,
      question:  session.questions[0].question,
      category:  session.questions[0].category,
      questionNumber: 1,
      totalQuestions: TOTAL_QUESTIONS,
    });
  } catch (err) {
    next(err);
  }
};

const respondToInterview = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { answer }    = req.body;
    const userId        = req.user._id || req.user.id;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ success: false, message: 'Answer is required.' });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (String(session.user) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Interview already completed.' });
    }

    const idx      = session.currentIndex;
    const question = session.questions[idx];
    if (!question) {
      return res.status(400).json({ success: false, message: 'No active question.' });
    }

    // Collect previous scores for difficulty trend
    const previousScores = session.questions
      .slice(0, idx)
      .map(q => q.feedback?.score)
      .filter(s => s != null);

    const jobContext = `${session.jobSnapshot.title} at ${session.jobSnapshot.company} — requirements: ${(session.jobSnapshot.requirements || []).join(', ')}`;

    const feedback = await evaluateAnswer(
      question.question,
      answer.trim(),
      jobContext,
      idx,
      previousScores,
    );

    // Persist answer + feedback
    session.questions[idx].answer   = answer.trim();
    session.questions[idx].feedback = feedback;
    session.markModified('questions');

    const nextIdx = idx + 1;
    const isLast  = nextIdx >= session.questions.length;

    let finalScores   = null;
    let nextQuestion  = null;
    let nextCategory  = null;

    if (isLast) {
      finalScores = computeFinalScores(session.questions);
      session.finalScores  = finalScores;
      session.status       = 'completed';
      session.completedAt  = new Date();
    } else {
      session.currentIndex = nextIdx;
      nextQuestion = session.questions[nextIdx].question;
      nextCategory = session.questions[nextIdx].category;
    }

    await session.save();

    return res.status(200).json({
      success: true,
      feedback,
      nextQuestion,
      nextCategory,
      questionNumber: nextIdx + 1,
      totalQuestions: TOTAL_QUESTIONS,
      completed:    isLast,
      finalScores,
    });
  } catch (err) {
    next(err);
  }
};

const getInterviewSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId        = req.user._id || req.user.id;

    const session = await InterviewSession.findById(sessionId).lean();
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (String(session.user) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    return res.status(200).json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

module.exports = { startInterview, respondToInterview, getInterviewSession };
