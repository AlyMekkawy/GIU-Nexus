const User = require('../models/user');
const JobPost = require('../models/JobPost');
const Application = require('../models/application');

exports.getPlatformStats = async (req, res, next) => {
  try {
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const [usersByRole, jobsByStatus, appsByStatus, topJobs, appsPerWeek] = await Promise.all([
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
      ]),

      // Applications per week over the last 4 weeks
      Application.aggregate([
        { $match: { appliedAt: { $gte: fourWeeksAgo } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%U',
                date: '$appliedAt',
                timezone: 'UTC'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
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
        topJobs,
        appsPerWeek: appsPerWeek.map(({ _id, count }) => ({ week: _id, count }))
      }
    });
  } catch (error) {
    next(error);
  }
};