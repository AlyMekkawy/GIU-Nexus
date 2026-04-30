const mongoose = require('mongoose');
const User = require('../models/user');
  const bcrypt=require('bcryptjs');
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
          const { name, bio, profilePicture } = req.body;
          const updatedUser=await User.findByIdAndUpdate(
            req.user.id,
            {name,bio,profilePicture},{new: true, runValidators: true}

          ).select('-password');
           res.status(200).json({ success: true, user: updatedUser });
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
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 8 characters'
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

