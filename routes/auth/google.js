const express = require('express');
const router = express.Router();
const { supabase } = require('../../utils/supabaseClient');

const crypto = require('crypto');

router.get('/', async (req, res) => {
    try {
        // Construct the base URL for redirection 
        // In local dev: http://localhost:3000
        // In prod: process.env.ALLOWED_ORIGIN or derived from req with whitelist check
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
        const requestOrigin = `${req.protocol}://${req.get('host')}`;
        const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

        if (!origin) {
            throw new Error('ALLOWED_ORIGIN or ALLOWED_ORIGINS environment variable must be set');
        }

        // Generate and store state for CSRF protection
        const state = crypto.randomBytes(16).toString('hex');
        res.cookie('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Must be lax for OAuth redirect
            maxAge: 5 * 60 * 1000 // 5 minutes
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${origin}/api/auth/callback`, // Redirect to backend callback
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                    state: state
                }
            }
        });

        if (error) throw error;

        if (data.url) {
            // Redirect the user to the Google OAuth consent page
            res.redirect(data.url);
        } else {
            res.status(500).json({ error: 'Failed to generate OAuth URL' });
        }

    } catch (err) {
        console.error('OAuth Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
