const logger = require('../services/logger.service')
const session = require('express-session')

async function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        console.log("returning 401 from requireAuth");
        res.status(401).end('Unauthorized!');
        return;
    }
    next();
}

async function requireAdmin(req, res, next) {
    const user = req.session.user;
    if (!user.isAdmin) {
        res.status(403).end('Unauthorized Enough..');
        return;
    }
    next();
}


// module.exports = requireAuth;

module.exports = {
    requireAuth,
    requireAdmin
}