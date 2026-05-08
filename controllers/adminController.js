const User = require('../models/user');
const JobPost = require('../models/JobPost');
const Application = require('../models/application');


exports.getPlatformStats = async (req, res, next) => {
  try {
    const [usersByRole, jobsByStatus, appsByStatus, topJobs] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),

      JobPost.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      Application.aggregate([
        { $group: { _id: '$job', applicationCount: { $sum: 1 } } },
        { $sort: { applicationCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'jobposts',
            localField: '_id',
            foreignField: '_id',
            as: 'job'
          }
        },
        { $unwind: '$job' },
        {
          $project: {
            _id: '$job._id',
            title: '$job.title',
            company: '$job.company',
            applicationCount: 1
          }
        }
      ])
    ]);

    const formatCounts = (arr) =>
        arr.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});

    res.status(200).json({
      success: true,
      stats: {
        usersByRole: formatCounts(usersByRole),
        jobsByStatus: formatCounts(jobsByStatus),
        appsByStatus: formatCounts(appsByStatus),
        topJobs
      }
    });
  } catch (error) {
    next(error);
  }
};