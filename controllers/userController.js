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
        // deleting jobposts of the user
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

const getUsers = async (req, res, next) => {
    try {
        const { role, status } = req.query
        const parsedPage = parseInt(req.query.page, 10)
        const parsedLimit = parseInt(req.query.limit, 10)
        const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1)
        const limit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 100)

        const filter = {}
        if (role) filter.role = role
        if (status) filter.status = status

        const skip = (page - 1) * limit
        const users = await User.find(filter).skip(skip).limit(limit).select('-password')
        const total = await User.countDocuments(filter)

        res.status(200).json({ success: true, total, page, users })
    } catch (error) {
        next(error)
    }
}

const updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body

        const allowedStatuses = ['approved', 'rejected', 'pending']
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value. Must be approved, rejected, or pending' })
        }

        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        if (user.role !== 'recruiter') {
            return res.status(400).json({ success: false, message: 'Status can only be updated for recruiters' })
        }

        user.status = status
        await user.save()

        res.status(200).json({ success: true, user })
    } catch (error) {
        next(error)
    }
}

const getAdminStats = async (req, res, next) => {
    try {
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const jobsPerWeek = await JobPost.aggregate([
            {
                $match: {
                    createdAt: { $gte: fourWeeksAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%U",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            jobsPerWeek
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { 
    getUsers, 
    updateUserStatus, 
    getUserByID, 
    deleteUser,
    getAdminStats
}
