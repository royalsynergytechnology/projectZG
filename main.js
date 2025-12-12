require('dotenv').config();
const express = require('express');
const cors = require('cors');
const signupRoute = require('./routes/auth/signup');
const loginRoute = require('./routes/auth/login');
const resetPasswordRoute = require('./routes/auth/reset-password');
const onboardingRoute = require('./routes/auth/onboarding');
const googleRoute = require('./routes/auth/google');
const logoutRoute = require('./routes/auth/logout');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// CORS configuration - restrict to your domain in production
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGIN || 'https://project-zg-community.vercel.app'
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Content Security Policy
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' https://unpkg.com https://cdnjs.cloudflare.com", // Removed unsafe-inline
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co https://unpkg.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; '));

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
});

app.use(express.json());

// Serve static files from root
// Serve static files from 'public' directory
app.use(express.static('public'));

// Serve auth pages with clean URLs
const path = require('path');

// Reset password pages
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/auth/reset-password/index.html'));
});
app.get('/reset-password/update', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/auth/reset-password/update/index.html'));
});


// Auth page
app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/auth/index.html'));
});

// API Routes
app.use('/api/signup', signupRoute);
app.use('/api/login', loginRoute);
app.use('/api/auth/google', googleRoute);
app.use('/api/auth/callback', require('./routes/auth/callback'));
app.use('/api/auth/me', require('./routes/auth/me'));
app.use('/api/reset-password', resetPasswordRoute);
app.use('/api/onboarding', onboardingRoute);
app.use('/api/logout', logoutRoute);


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
