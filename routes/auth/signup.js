const express = require('express');
const router = express.Router();
const { supabase } = require('../../utils/supabaseClient');

router.post('/', async (req, res) => {
    const { email, password, username, fullName } = req.body;
    const trimmedEmail = email?.trim();
    const trimmedUsername = username?.trim();
    const trimmedFullName = fullName?.trim();

    if (!trimmedEmail || !password || !trimmedUsername) {
        return res.status(400).json({ error: 'Email, password, and username are required.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Username validation
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
        return res.status(400).json({ error: 'Username must be 3-30 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });
    }

    // Password validation
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
        return res.status(400).json({ error: 'Password must include lowercase, uppercase, number, and symbol.' });
    }

    // Full name validation
    if (trimmedFullName && trimmedFullName.length > 100) {
        return res.status(400).json({ error: 'Full name must be 100 characters or less.' });
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
                data: {
                    username: trimmedUsername,
                    full_name: trimmedFullName || ''
                }
            }
        });

        if (error) throw error;

        if (data.session) {
            res.cookie('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: data.session.expires_in * 1000
            });

            res.cookie('sb-refresh-token', data.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
        }

        res.json({ message: 'Sign up successful! Please check your email.', user: data.user });
    } catch (err) {
        console.error('Signup error:', err);

        // Return generic error or map known errors to safe messages
        const userFriendlyErrors = {
            'User already registered': 'An account with this email already exists.',
            'Invalid email': 'Please provide a valid email address.',
        };

        const errorMessage = userFriendlyErrors[err.message] || 'Sign up failed. Please try again later.';
        res.status(400).json({ error: errorMessage });
    }
});

module.exports = router;
