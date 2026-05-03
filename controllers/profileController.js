const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt=require('bcryptjs');

const uploadToCloudinary = require("../services/uploadToCloudinary");

const hf = require('../services/hfService');
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user id format' });
        }

        const user = await User.findById(userId).select('name email bio skills profilePicture role status');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        return next(error);
    }
};

const updateProfile=async(req,res,next)=>{
    try{
      const userId = req.user?.id;
      if (!userId) {
          return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ success: false, message: 'Invalid user id format' });
      }

      const { name, bio, profilePicture, skills } = req.body;
      
      // Build update object with only provided fields
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
      if (skills !== undefined) updateData.skills = skills;

      if (req.file?.path) {
          const uploadResult = await uploadToCloudinary(req.file.path, {
              folder: "profile-pictures",
              resource_type: "image",
          });
          updateData.profilePicture = uploadResult.url;
      if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      if (bio !== undefined && skills === undefined && bio && bio.trim()) {
          try {
              const extractedSkills = await extractSkillsFromBio(bio);
              if (extractedSkills.length > 0) updateData.skills = extractedSkills;
          } catch (error) {
              console.error('HuggingFace skill extraction failed:', error);
          }
      }

      const updatedUser=await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Return only the updated fields
      const updatedFields = {};
      Object.keys(updateData).forEach(key => {
        updatedFields[key] = updatedUser[key];
      });

      res.status(200).json({ 
        success: true, 
        message: 'Profile updated successfully',
        updatedFields 
      });
    }
    catch(err){
        next(err);
    }
};

const changePassword=async(req, res, next)=>{
    try{
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both current and new password'
            });
        }

        // Password strength validation (same rules as register/reset-password)
        const passwordErrors = [];
        if (newPassword.length < 8)             passwordErrors.push('at least 8 characters');
        if (!/[A-Z]/.test(newPassword))         passwordErrors.push('one uppercase letter');
        if (!/[a-z]/.test(newPassword))         passwordErrors.push('one lowercase letter');
        if (!/[0-9]/.test(newPassword))         passwordErrors.push('one digit');
        if (!/[^A-Za-z0-9]/.test(newPassword))  passwordErrors.push('one special character (!@#$%...)');

        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Password must contain: ${passwordErrors.join(', ')}`
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        const isMatch=await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        next(err);
    }
    };

const normalizeSkill = (word) => {
    if (!word || typeof word !== 'string') return '';

    return word
        .replace(/\s+/g, ' ')
        .trim();
};

const isAllowedEntity = (item) => {
    const tag = item.entity_group || item.entity;

    return new Set([
        'MISC',
        'ORG',
        'B-MISC',
        'I-MISC',
        'B-ORG',
    ]).has(tag);
};

const cleanToken = (word) => {
    if (!word || typeof word !== 'string') return '';
    return word.trim();
};

const mergeTokens = (items) => {
    const merged = [];
    let current = '';

    for (const item of items) {
        const tag = item.entity_group || item.entity;
        const word = cleanToken(item.word);

        if (!word) continue;

        if (word.startsWith('##')) {
            current += word.slice(2);
            continue;
        }

        if (tag?.startsWith('I-') && current) {
            current += ` ${word}`;
            continue;
        }

        if (current) merged.push(current);
        current = word;
    }

    if (current) merged.push(current);

    return merged;
};

const extractSkillsFromBio = async (bio) => {
    const result = await hf.tokenClassification({
        model: 'dslim/bert-base-NER',
        inputs: bio,
    });

    if (!Array.isArray(result)) return [];

    const filtered = result.filter(isAllowedEntity);
    const extracted = mergeTokens(filtered);

    const deduped = new Map();

    extracted.forEach(word => {
        const cleaned = normalizeSkill(word);
        if (!cleaned) return;

        const key = cleaned.toLowerCase();
        if (!deduped.has(key)) {
            deduped.set(key, cleaned);
        }
    });

    return Array.from(deduped.values());
};

const extractSkills = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user id format',
            });
        }

        const user = await User.findById(userId).select('bio skills');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (!user.bio || !user.bio.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Bio is empty. Update your profile first.',
            });
        }

        let cleanSkills;

        try {
            cleanSkills = await extractSkillsFromBio(user.bio);
        } catch (error) {
            console.error('HuggingFace skill extraction failed:', error);

            return res.status(200).json({
                success: true,
                message: 'Skill extraction unavailable. Existing skills returned.',
                skills: user.skills || [],
                extracted: [],
            });
        }

        user.skills = cleanSkills;
        await user.save();

        return res.status(200).json({
            success: true,
            skills: user.skills,
            extracted: cleanSkills,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    extractSkills,
};
