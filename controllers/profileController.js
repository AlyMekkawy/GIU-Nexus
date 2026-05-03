const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt=require('bcryptjs');
const uploadToCloudinary = require("../services/uploadToCloudinary");

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
      }

      const updatedUser=await User.findByIdAndUpdate(
        req.user.id,
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

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
};
