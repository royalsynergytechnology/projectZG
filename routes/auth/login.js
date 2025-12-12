const express = require('express');
const router = express.Router();
const { supabase } = require('../../utils/supabaseClient');

router.post('/', async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ error: 'Email/Username and password are required.' });
    }

    try {
        let emailToUse = identifier;

        // Simple check for username vs email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier)) {
            // Strict failure for username login without backend lookup implementation
            return res.status(400).json({ error: 'Login with Username not fully supported yet. Please use Email.' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password
        });
        if (error) throw error;

        // Set HttpOnly Cookies
        res.cookie('sb-access-token', data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: data.session.expires_in * 1000 // Supabase default is usually 1 hour
        });

        res.cookie('sb-refresh-token', data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Refresh token needs looser policy for some flows? Stick to strict if possible
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.json({ message: 'Login successful!', user: data.user });
    } catch (err) {
        // Log the actual error server-side for debugging
        console.error('Login error:', err);

        // Return safe, generic messages to client
        if (err.message?.includes('Invalid login credentials')) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Default to 500 for unexpected errors
        res.status(500).json({ error: 'An error occurred during login. Please try again later.' });
    }

});

module.exports = router;
