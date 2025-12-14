/**
 * config.js - Global Configuration
 * 
 * Handles environment-specific settings like API base URL.
 * Detects environment based on hostname.
 */

const Config = (function () {
    const hostname = window.location.hostname;

    // Determine API Base URL
    // If localhost/127.0.0.1, Development -> http://localhost:3000
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1';

    const API_BASE_URL = isDev ? 'http://localhost:3000' : (hostname === 'project-zg-community.vercel.app' ? 'https://project-zg-community.vercel.app' : 'https://projectzg.vercel.app');

    return {
        API_URL: `${API_BASE_URL}/api`,
        IS_DEV: isDev
    };
})();

// Freeze to prevent modification
Object.freeze(Config);
