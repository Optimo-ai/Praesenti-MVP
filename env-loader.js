/**
 * env-loader.js
 * A surgical-grade runtime loader for .env files in static HTML environments.
 */
window.env = {};

window.loadEnv = async function() {
    try {
        const response = await fetch('.env');
        if (!response.ok) {
            console.warn('No .env file found or could not be loaded. Falling back to defaults.');
            return;
        }
        const text = await response.text();
        const lines = text.split('\n');

        lines.forEach(line => {
            // Trim whitespace and ignore comments/empty lines
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim();
                // Remove optional quotes (single or double)
                window.env[key.trim()] = value.replace(/^['"]|['"]$/g, '');
            }
        });
        console.log('Environment variables loaded successfully.');
    } catch (error) {
        console.error('Error loading .env file:', error);
    }
};
