const express = require('express');
const router = express.Router();
const multer = require('multer');


// Configure Multer (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const { createAuthenticatedClient } = require('../../utils/supabaseClient');

const authMiddleware = require('../../utils/authMiddleware');

router.post('/', upload.single('avatar'), authMiddleware, async (req, res) => {
    try {
        // 1. Verify Authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Invalid Authorization scheme, Bearer expected' });
        }
        const token = authHeader.slice(7);
        const refreshToken = req.headers['x-refresh-token'];

        // Create Authenticated Client
        const supabase = await createAuthenticatedClient(token, refreshToken);

        // Verify validity of the token by getting the user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid or expired token', details: authError });
        }

        const userId = user.id;
        const { username, gender, password } = req.body;


        // 2. Validate Inputs
        if (!username || username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ error: 'Password is required (min 8 characters)' });
        }

        let avatarUrl = null;

        // 3. Handle Avatar Upload
        if (req.file) {
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedMimeTypes.includes(req.file.mimetype)) {
                return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
            }

            const fileExt = req.file.mimetype.split('/')[1] || 'img';
            const fileName = `avatar_${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            // Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true
                });

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                throw new Error('Failed to upload avatar');
            }

            // Get Public URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            avatarUrl = data.publicUrl;

            // Insert into Media Table
            const { error: mediaError } = await supabase.from('media').insert({
                user_id: userId,
                bucket_name: 'avatars',
                file_path: filePath,
                file_name: fileName,
                file_size: req.file.size,
                mime_type: req.file.mimetype,
                is_public: true
            });

            if (mediaError) {
                console.error('Media Insert Error:', mediaError);
                // Non-fatal? Maybe, but good to track.
            }
        }

        // 4. Update Profile
        const updates = {
            username: username,
            gender: gender,
            updated_at: new Date()
        };

        if (avatarUrl) {
            updates.avatar_url = avatarUrl;
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (profileError) {
            // Handle unique constraint violation for username
            if (profileError.code === '23505') {
                return res.status(409).json({ error: 'Username is already taken' });
            }
            throw profileError;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
            password: password
        });

        if (passwordError) {
            throw passwordError;
        }

        res.json({
            message: 'Profile completed successfully!',
            avatar_url: avatarUrl
        });

    } catch (err) {
        console.error('Onboarding Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
