const User        = require('../models/user');
const JobPost     = require('../models/JobPost');
const Application = require('../models/application');
const hf          = require('../services/hfService');

// ── Intent detection ──────────────────────────────────────────────────────────
function detectIntent(message) {
  const msg = message.toLowerCase();
  if (/cover\s*letter/.test(msg))                               return 'cover_letter_help';
  if (/\b(job|jobs|recommend|apply|internship|opportunit)\b/.test(msg)) return 'find_jobs';
  if (/\b(profile|bio|skills|improve|strengthen)\b/.test(msg)) return 'profile_advice';
  if (/\b(market|trend|demand|popular skill|in.?demand)\b/.test(msg)) return 'market_trends';
  if (/\b(application|status|submitted|shortlist|rejected|applied)\b/.test(msg)) return 'application_summary';
  return 'general_help';
}

// ── Data fetchers ─────────────────────────────────────────────────────────────
async function fetchFindJobs(user) {
  const userSkills = (user.skills || []).map(s => s.toLowerCase());
  const jobs = await JobPost.find({ status: 'open' })
    .select('title company location type requirements category')
    .lean();

  if (!jobs.length) return { jobs: [], userSkillCount: userSkills.length };

  const scored = jobs.map(job => {
    const reqs = (job.requirements || []).map(r => r.toLowerCase());
    const matches = reqs.length > 0
      ? userSkills.filter(s => reqs.some(r => r.includes(s) || s.includes(r))).length
      : 0;
    return { ...job, _matchScore: reqs.length > 0 ? matches / reqs.length : 0 };
  });

  const top3 = scored
    .sort((a, b) => b._matchScore - a._matchScore)
    .slice(0, 3)
    .map(({ _id, title, company, location, type, category, requirements, _matchScore }) => ({
      _id,
      title,
      company,
      location: location || 'Not specified',
      type,
      category,
      requirements: (requirements || []).slice(0, 3),
      matchScore: Math.round(_matchScore * 100),
    }));

  return { jobs: top3, userSkillCount: userSkills.length };
}

async function fetchProfileAdvice(userId) {
  const user = await User.findById(userId)
    .select('name bio skills academicInformation')
    .lean();
  if (!user) return {};

  const missing = [];
  if (!user.bio || user.bio.trim().length < 40) missing.push('a professional bio');
  if (!user.skills || user.skills.length < 3)
    missing.push(`more skills (currently ${user.skills?.length || 0})`);
  const ai = user.academicInformation || {};
  if (!ai.university)     missing.push('university name');
  if (!ai.major)          missing.push('major / field of study');
  if (ai.gpa == null)     missing.push('GPA');
  if (!ai.graduationDate) missing.push('expected graduation date');

  return {
    name:         user.name,
    hasBio:       !!(user.bio && user.bio.trim().length >= 40),
    skillCount:   user.skills?.length || 0,
    missingFields: missing,
    university:   ai.university || null,
    major:        ai.major || null,
    gpa:          ai.gpa != null ? ai.gpa : null,
  };
}

async function fetchMarketTrends() {
  const jobs = await JobPost.find({ status: 'open' })
    .select('requirements category')
    .lean();

  const skillFreq = {};
  const catFreq   = {};
  for (const job of jobs) {
    catFreq[job.category || 'Other'] = (catFreq[job.category || 'Other'] || 0) + 1;
    for (const req of job.requirements || []) {
      const k = req.trim().toLowerCase();
      if (k) skillFreq[k] = (skillFreq[k] || 0) + 1;
    }
  }

  const topSkills = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([skill, count]) => ({ skill, count }));

  const topCategories = Object.entries(catFreq)
    .sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([category, count]) => ({ category, count }));

  return { jobCount: jobs.length, topSkills, topCategories };
}

async function fetchApplicationSummary(userId, role) {
  if (role !== 'jobSeeker') {
    return { note: 'Application summary in chat is for job seekers. Use the Applicants page for recruiter analytics.' };
  }

  const apps = await Application.find({ user: userId })
    .populate('job', 'title company')
    .select('status appliedAt job')
    .lean();

  const counts = { pending: 0, shortlisted: 0, rejected: 0 };
  apps.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

  const recent = apps
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
    .slice(0, 3)
    .map(a => ({
      jobTitle:  a.job?.title   || 'Unknown',
      company:   a.job?.company || '',
      status:    a.status,
      appliedAt: a.appliedAt,
    }));

  return { total: apps.length, counts, recentApplications: recent };
}

// ── Scripted fallbacks ────────────────────────────────────────────────────────
function scriptedFallback(intent, data) {
  switch (intent) {
    case 'find_jobs': {
      if (data.note) return data.note;
      if (!data.jobs || data.jobs.length === 0) {
        return "I couldn't find open jobs matching your profile right now. Make sure your skills are up to date in your profile — that's what I use for matching.";
      }
      const list = data.jobs
        .map((j, i) => `${i + 1}. **${j.title}** at ${j.company} (${j.location}) — ${j.matchScore}% match`)
        .join('\n');
      return `Based on your skills, here are your top matches:\n\n${list}\n\nHead to the Jobs page to explore all open roles and apply!`;
    }
    case 'profile_advice': {
      if (!data.missingFields || data.missingFields.length === 0) {
        return "Your profile is looking great! Keep your skills and bio updated as you grow — recruiters notice fresh profiles.";
      }
      return `Here's what you can add to strengthen your profile:\n\n• ${data.missingFields.join('\n• ')}\n\nVisit your Profile page to fill these in. A complete profile gets significantly more recruiter attention.`;
    }
    case 'market_trends': {
      if (!data.topSkills || data.topSkills.length === 0) {
        return "I couldn't pull market data right now. Check the Market Trends page for the latest insights.";
      }
      const skills = data.topSkills.slice(0, 4).map(s => s.skill).join(', ');
      const cats   = data.topCategories.slice(0, 3).map(c => c.category).join(', ');
      return `Across **${data.jobCount}** open roles on GIU Nexus, the most in-demand skills are **${skills}**. The hottest hiring categories are **${cats}**. Focus on these to maximize your chances!`;
    }
    case 'application_summary': {
      if (data.note) return data.note;
      if (data.total === 0) {
        return "You haven't submitted any applications yet. Head to the Jobs page and start applying — your profile looks ready!";
      }
      const { pending, shortlisted, rejected } = data.counts;
      return `You have **${data.total}** application${data.total !== 1 ? 's' : ''} total: **${shortlisted}** shortlisted, **${pending}** pending review, and **${rejected}** rejected. Keep applying — consistency is key!`;
    }
    case 'cover_letter_help':
      return "To generate a cover letter, open any job listing and click **Generate Cover Letter**. Nexi will write it based on your profile bio and the job requirements. Make sure your bio is detailed before generating!";
    default:
      return "I'm Nexi, your GIU Nexus career assistant! Here's what I can help with:\n\n• **Find jobs** that match your skills\n• **Improve your profile** for better recruiter visibility\n• **Check your applications** and their statuses\n• **Explore market trends** to know what to learn next\n• **Get cover letter help** for any job listing\n\nWhat would you like to do?";
  }
}

// ── HF response generator ─────────────────────────────────────────────────────
async function generateNexiResponse(message, intent, data) {
  if (!process.env.HF_TOKEN) return null;

  try {
    const dataStr = JSON.stringify(data, null, 2);
    const result  = await hf.chatCompletion({
      model: 'Qwen/Qwen2.5-7B-Instruct:fastest',
      messages: [
        {
          role: 'system',
          content:
            'You are Nexi, the AI career assistant inside GIU Nexus.\n\n' +
            "Answer the user's question using ONLY the provided platform data.\n\n" +
            'Rules:\n' +
            '1. Never invent jobs, applicants, salaries, application statuses, users, or skills.\n' +
            '2. If the data does not contain the answer, say you do not have enough information.\n' +
            '3. Keep the response concise, helpful, and action-oriented.\n' +
            '4. Use a friendly but professional tone.\n' +
            '5. Do not mention internal JSON, database queries, or implementation details.\n\n' +
            `User message:\n${message}\n\n` +
            `Detected intent:\n${intent}\n\n` +
            `Platform data:\n${dataStr}\n\n` +
            "Write Nexi's answer.",
        },
      ],
      max_new_tokens: 280,
      temperature:    0.5,
      top_p:          0.9,
    });

    const raw = result?.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== 'string' || !raw.trim()) return null;

    // Reject generic "please give me more details" responses — the model ignored the grounded data
    const generic = /\b(please (provide|give|share|tell)|if you (provide|give|share|tell)|could you (provide|share)|i (need|would need) (more )?(details|information|data|context))\b/i;
    if (generic.test(raw)) return null;

    return raw.trim();
  } catch (err) {
    console.error('[NexiChat] HF error:', err.message);
    return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
const nexiChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const userId  = req.user._id || req.user.id;
    const role    = req.user.role;
    const trimmed = message.trim();

    const intent = detectIntent(trimmed);

    let data = {};
    try {
      if (intent === 'find_jobs') {
        if (role === 'jobSeeker') {
          const user = await User.findById(userId).select('skills').lean();
          data = await fetchFindJobs(user || {});
        } else {
          data = { note: 'Job recommendations are available for job seekers.' };
        }
      } else if (intent === 'profile_advice') {
        data = await fetchProfileAdvice(userId);
      } else if (intent === 'market_trends') {
        data = await fetchMarketTrends();
      } else if (intent === 'application_summary') {
        data = await fetchApplicationSummary(userId, role);
      } else if (intent === 'cover_letter_help') {
        data = { feature: 'Cover letter generation is available on each job detail page.' };
      }
    } catch (dataErr) {
      console.error('[NexiChat] Data fetch error:', dataErr.message);
    }

    // For structured data intents, scripted response is always reliable;
    // only call HF for general/conversational intents.
    const useScripted = intent === 'application_summary' || intent === 'find_jobs';
    let answer = useScripted ? null : await generateNexiResponse(trimmed, intent, data);
    if (!answer) answer = scriptedFallback(intent, data);

    return res.status(200).json({ success: true, intent, answer, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { nexiChat };
