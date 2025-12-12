const authMiddleware = (req, res, next) => {
    const token = req.cookies['sb-access-token'];
    const refreshToken = req.cookies['sb-refresh-token'];

    if (token) {
        req.headers.authorization = `Bearer ${token}`;
    }
    if (refreshToken) {
        req.headers['x-refresh-token'] = refreshToken;
    }

    // Continue even if no token found (some routes might allow public access or handle 401 themselves)
    next();
};

module.exports = authMiddleware;
