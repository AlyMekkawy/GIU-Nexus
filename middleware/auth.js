const mongoose = require('mongoose');

/*
    THIS IS A TEMPORARY STUB THAT IS NOT MEANT TO REPLACE THE JWT AUTHENTICATION.
    THIS WILL BE REPLACED ONCE WE IMPLEMENT JWT AUTHENTICATION.
    THE PURPOSE OF THIS IS TO ALLOW US TO TEST THE PROTECTED ROUTES WITHOUT HAVING TO IMPLEMENT JWT FIRST.
    The middleware will check for a custom header 'x-demo-user-id' to simulate an authenticated user.
*/

const requireAuth = (req, res, next) => {
    // Temporary stub: attach a demo user id for local testing.
    const demoUserId = req.header('x-demo-user-id');
    if (!demoUserId) {
        return res.status(401).json({ success: false, message: 'Missing user id' });
    }
    req.user = { id: demoUserId };
    return next();
};

module.exports = requireAuth;
