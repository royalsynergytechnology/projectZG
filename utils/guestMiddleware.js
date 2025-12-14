const guestMiddleware = (req, res, next) => {
    const token = req.cookies['sb-access-token'] ||
        (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        // No token? No problem. Proceed as guest.
        return next();
    }

    const { supabase } = require('./supabaseClient');

    supabase.auth.getUser(token).then(({ data, error }) => {
        if (!error && data.user) {
            req.user = data.user;
        }
        // Even if error/invalid, we proceed. 
        // We could log it, but for optional auth, failing back to guest is acceptable.
        next();
    }).catch(err => {
        console.error('Guest Auth Middleware Exception:', err);
        next();
    });
};

module.exports = guestMiddleware;
