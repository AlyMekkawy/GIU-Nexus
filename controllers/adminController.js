import User from '../models/User.js';
import JobPost from '../models/JobPost.js';
import Application from '../models/Application.js';

export const getPlatformStats = async (req, res, next) => {
  try {
    const [usersByRole, jobsByStatus, appsByStatus, topJobs] = await Promise.all([
      // Users grouped by role
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),

      // Jobs grouped by status
      JobPost.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Applications grouped by status
      Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Top jobs by application count
      Application.aggregate([
        { $group: { _id: '$jobPost', applicationCount: { $sum: 1 } } },
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

    // Reshape array results into flat objects
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