// require('dotenv').config({ override: true }); // Handled by main.js
const { createClient } = require('@supabase/supabase-js');
const { createServerClient } = require('@supabase/ssr');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseAdmin = null;
let clientInitError = null;

if (!supabaseUrl || !supabaseKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseKey) missing.push('SUPABASE_ANON_KEY');
    clientInitError = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(`CRITICAL: ${clientInitError}`);
} else {
    try {
        // Singleton for generic server-side ops
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                flowType: 'pkce',
                detectSessionInUrl: false,
            }
        });

        // Admin Client (if key available)
        if (supabaseServiceKey) {
            supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
        }
    } catch (e) {
        clientInitError = `Supabase initialization failed: ${e.message}`;
        console.error(clientInitError);
    }
}

const createAuthenticatedClient = async (token) => {
    if (!supabase) return null; // Fail fast if init failed

    // Create a new client with the Auth header pre-set
    // This bypasses the need for setSession and refresh tokens
    const client = createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    });

    return client;
};

const createContextClient = (req, res) => {
    if (!supabaseUrl || !supabaseKey) return null;

    return createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return Object.keys(req.cookies).map((name) => ({ name, value: req.cookies[name] }));
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    const safeOptions = {
                        ...options,
                        sameSite: 'lax',
                        secure: process.env.VERCEL_ENV === 'production'
                    };
                    if (!res.headersSent) {
                        res.cookie(name, value, safeOptions);
                    } else {
                        console.warn(`[Supabase] Should set cookie ${name} but headers sent.`);
                    }
                });
            },
        },
    });
};

module.exports = { supabase, supabaseAdmin, createAuthenticatedClient, createContextClient };
