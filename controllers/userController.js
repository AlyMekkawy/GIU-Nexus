const User = require('../models/user');
const JobPost = require('../models/JobPost');

const getUserByID = async (req,res,next)=>{
    try {
        const user = await User.findById(req.params.id);
        if(!user){
            return res.status(404).json({success:false, message:"User not found"})
        }
        else {
            res.status(200).json({
                success:true,
                user: {
                    _id: user._id,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                    email: user.email,
                },
            })
        }
    } catch (error) {
        next(error);

    }
};

const deleteUser = async (req,res,next) =>{
    try {
        // First, find the user to ensure they exist
        const user = await User.findById(req.params.id);
        if(!user) {
            return res.status(404).json({success:false, message:"User not found"})
        }

        // Delete all job posts created by this user
        // This ensures data integrity by removing orphaned records (jobpost)
        await JobPost.deleteMany({ createdBy: req.params.id });

        // Now delete the user
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success:true,
            message:"User deleted"
        })

    } catch (error) {
        next(error);
    }
};

module.exports = {getUserByID, deleteUser};
