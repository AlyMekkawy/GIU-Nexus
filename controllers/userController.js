const User = require('../models/user')

const getUsers = async (req, res) => {
    const { role, status, page = 1, limit = 20 } = req.query

    const filter = {}
    if (role) filter.role = role
    if (status) filter.status = status

    const skip = (page - 1) * limit
    const users = await User.find(filter).skip(skip).limit(limit).select('-password')
    const total = await User.countDocuments(filter)

    res.status(200).json({ success: true, total, page: Number(page), users })
}

const updateUserStatus = async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'approved', 'rejected'];

    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status. Allowed values are pending, approved, rejected.'
        });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'recruiter') {
        return res.status(400).json({
            success: false,
            message: 'Status can only be updated for recruiter users.'
        });
    }

    user.status = status;
    await user.save();

    res.status(200).json({ success: true, user });
}

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
module.exports = { getUsers, updateUserStatus }