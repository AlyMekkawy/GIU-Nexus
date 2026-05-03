const User = require('../models/user');

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
                    email: user.email,
                    bio: user.bio,
                    skills: user.skills,
                    profilePicture: user.profilePicture,
                    role: user.role,
                    status: user.status,
                },
            })
        }
    } catch (error) {
        next(error);

    }
};

const deleteUser = async (req,res,next) =>{
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if(!user) {
            return res.status(404).json({success:false, message:"User not found"})
        }
        else {
            res.status(200).json({
                success:true,
                message:"User deleted successfully"
            })
        }

    } catch (error) {
        next(error);
    }
};

module.exports = {getUserByID, deleteUser};
