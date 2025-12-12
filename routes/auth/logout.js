const express = require('express');
const router = express.Router();
const { supabase } = require('../../utils/supabaseClient');

// Logout - POST /api/logout
router.post('/', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No access token provided.' });
        }

        const accessToken = authHeader.split(' ')[1];

        if (!accessToken || accessToken.trim() === '') {
            return res.status(401).json({ error: 'Invalid access token format.' });
        }

        // Sign out the user from Supabase
        const { error } = await supabase.auth.admin.signOut(accessToken);

        if (error) {
            console.error('Failed to sign out user:', error);
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }

        res.json({ message: 'Logout successful!' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to logout.' });
    }
});

module.exports = router;
