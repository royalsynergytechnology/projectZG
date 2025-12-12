const express = require('express');
const router = express.Router();
const { supabase } = require('../../utils/supabaseClient');

router.get('/', async (req, res) => {
    const { code, error, error_description, state } = req.query;

    if (error) {
        const description = error_description || 'Unknown error';
        return res.redirect(`/auth?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(description)}`);
    }

    if (!code) {
        return res.redirect('/auth?error=no_code');
    }

    // CSRF Check: Validate state parameter
    const storedState = req.cookies['oauth_state'];
    if (!state || !storedState || state !== storedState) {
        console.error('CSRF Error: State mismatch or missing');
        return res.redirect('/auth?error=invalid_state');
    }

    // Clear the used state
    res.clearCookie('oauth_state');

    try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Code Exchange Error:', error);
            return res.redirect(`/auth?error=${encodeURIComponent(error.message)}`);
        }

        const { session } = data;

        // Set HttpOnly Cookies
        res.cookie('sb-access-token', session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: session.expires_in * 1000
        });

        res.cookie('sb-refresh-token', session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        // Redirect to Onboarding (or check if user exists)
        // For now, always go to onboarding which handles both new/existing logic
        res.redirect(302, '/auth/onboarding/');

    } catch (err) {
        console.error('Callback Error:', err);
        res.redirect('/auth?error=server_error');
    }
});

module.exports = router;
