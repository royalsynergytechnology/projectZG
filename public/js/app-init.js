/**
 * app-init.js
 * Initial authentication check for the main application.
 * Replaces legacy localStorage check with HttpOnly cookie validation via /api/auth/me.
 */
(async function () {
    try {
        const API_URL = (typeof Config !== 'undefined') ? Config.API_URL : '/api';
        const res = await fetch(`${API_URL}/auth/me`);

        if (!res.ok) {
            // Not authenticated, redirect to auth
            window.location.href = '/auth/';
        }
    } catch (e) {
        console.error('Auth check failed:', e);
        window.location.href = '/auth/';
    }
})();
