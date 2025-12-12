require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseKey) missing.push('SUPABASE_ANON_KEY');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
    }
});

const createAuthenticatedClient = async (token, refreshToken) => {
    const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
            flowType: 'pkce',
            detectSessionInUrl: false,
        }
    });

    if (token) {
        const { error } = await client.auth.setSession({
            access_token: token,
            refresh_token: refreshToken || '' // Refresh token might be needed for some ops
        });
        if (error) console.warn('createAuthenticatedClient session warning:', error);
    }

    return client;
};

module.exports = { supabase, createAuthenticatedClient };

