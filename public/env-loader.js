/**
 * env-loader.js
 * Loads .env variables into window at runtime.
 * Sets window.VITE_SUPABASE_URL, window.VITE_SUPABASE_KEY,
 * and legacy aliases window.SUPA_URL / window.SUPA_KEY.
 */
window.env = {};

window.loadEnv = async function() {
    try {
        const response = await fetch('.env');
        if (!response.ok) {
            console.warn('No .env file found or could not be loaded.');
            return;
        }
        const text = await response.text();
        const lines = text.split('\n');

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                const cleanKey = key.trim();
                const cleanVal = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
                window.env[cleanKey] = cleanVal;
                window[cleanKey] = cleanVal; // e.g. window.VITE_SUPABASE_URL
            }
        });

        // Legacy aliases so components using window.SUPA_URL also work
        window.SUPA_URL = window.VITE_SUPABASE_URL || window.SUPA_URL;
        window.SUPA_KEY = window.VITE_SUPABASE_KEY || window.SUPA_KEY;

        console.log('[env-loader] Loaded:', Object.keys(window.env));
    } catch (error) {
        console.error('[env-loader] Error loading .env file:', error);
    }
};

// Auto-invoke immediately (fires async fetch; vars ready before user interaction)
window.loadEnv();
