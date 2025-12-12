const express = require('express');
const router = express.Router();
const { supabase } = require('../../utils/supabaseClient');
const rateLimit = require('express-rate-limit');

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 requests per windowMs
    message: 'Too many password reset attempts, please try again later'
});

// Shared password reset logic
async function handlePasswordResetRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/reset-password/update`,
    });
    if (error) throw error;
}

// Shared handler for password reset request
const resetHandler = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        await handlePasswordResetRequest(email);
        res.json({ message: 'Password reset link sent to your email.' });
    } catch (err) {
        console.error('Password reset error:', err);
        res.status(400).json({ error: 'Failed to send password reset email. Please try again.' });
    }
};

// Request password reset - POST /api/reset-password
// This fixes the 404 error - frontend calls this endpoint directly
router.post('/', resetPasswordLimiter, resetHandler);

// Legacy route - kept for backwards compatibility
router.post('/request', resetPasswordLimiter, resetHandler);

// Update password - POST /api/reset-password/update
router.post('/update', async (req, res) => {
    const { password, accessToken } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'New password is required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (!accessToken) {
        return res.status(400).json({ error: 'Access token is required' });
    }


    try {
        // Set the session with the access token from the magic link
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: accessToken // For password recovery, access token works
        });

        if (sessionError) throw sessionError;

        // Update the user's password
        const { data, error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) throw error;

        res.json({ message: 'Password updated successfully!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
