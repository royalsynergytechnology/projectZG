const express = require('express');
const router = express.Router();
const { supabase } = require('../../utils/supabaseClient');
const authMiddleware = require('../../utils/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1]);

        if (error || !user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        res.json({ user });
    } catch (err) {
        console.error('Me endpoint error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
