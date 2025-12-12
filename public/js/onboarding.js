
document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const loadingOverlay = document.getElementById('loading-overlay');
    const API_URL = (typeof Config !== 'undefined') ? Config.API_URL : 'http://localhost:3000/api';

    // --- 1. Check Authentication ---
    let currentUser = null;

    try {
        const authRes = await fetch(`${API_URL}/auth/me`);
        if (!authRes.ok) throw new Error('Not authenticated');
        const authData = await authRes.json();
        currentUser = authData.user;
    } catch (e) {
        // Redirect back to auth if no session found
        setTimeout(() => {
            window.location.href = '../';
        }, 500);
        return;
    }

    // State
    let currentStep = 1;
    const totalSteps = 4;
    let formDataState = {
        username: '',
        gender: '',
        avatar: null,
        password: ''
    };

    // DOM Elements
    const steps = {
        1: document.getElementById('step-1'),
        2: document.getElementById('step-2'),
        3: document.getElementById('step-3'),
        4: document.getElementById('step-4')
    };

    // Initialize Step 1
    if (steps[1]) steps[1].classList.add('active');

    // --- Step 1: Username ---
    const usernameInput = document.getElementById('username');
    const step1Next = steps[1]?.querySelector('.next-btn');

    if (usernameInput && step1Next) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleStep1();
        });
        step1Next.addEventListener('click', handleStep1);
    }

    function handleStep1() {
        const val = usernameInput.value.trim();
        if (val.length < 3) {
            Toast.warning('Username must be at least 3 characters');
            return;
        }
        formDataState.username = val;
        goToStep(2);
    }


    // --- Step 2: Gender ---
    const genderOptions = document.querySelectorAll('.btn-option');

    genderOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            // Visual selection
            genderOptions.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Set state and auto-advance
            formDataState.gender = btn.dataset.value;

            // Small delay for visual feedback before swiping
            setTimeout(() => {
                goToStep(3);
            }, 300);
        });
    });


    // --- Step 3: Avatar ---
    const avatarTrigger = document.getElementById('avatar-trigger');
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const step3Next = steps[3]?.querySelector('.next-btn');
    const step3Skip = steps[3]?.querySelector('.skip-btn');

    if (avatarTrigger && avatarInput) {
        avatarTrigger.addEventListener('click', () => avatarInput.click());

        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                Toast.warning('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                Toast.warning('Image too large (max 5MB)');
                return;
            }

            formDataState.avatar = file;

            // Update Preview
            if (avatarPreview) {
                const reader = new FileReader();
                reader.onload = (e) => avatarPreview.src = e.target.result;
                reader.readAsDataURL(file);
            }
        });
    }

    if (step3Next) step3Next.addEventListener('click', () => goToStep(4));
    if (step3Skip) step3Skip.addEventListener('click', () => {
        formDataState.avatar = null;
        goToStep(4);
    });


    // --- Step 4: Password & Submit ---
    const submitBtn = document.getElementById('submit-btn');
    const passInput = document.getElementById('password');
    const confirmPassInput = document.getElementById('confirm-password');

    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmit);
    }

    async function handleSubmit() {
        const password = passInput.value;
        const confirm = confirmPassInput.value;

        if (!password || password.length < 8) {
            Toast.warning('Password is required (min 8 chars)');
            return;
        }
        if (password.length > 128) {
            Toast.warning('Password is too long (max 128 chars)');
            return;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            Toast.warning('Password must contain uppercase, lowercase, and numbers');
            return;
        }
        if (password !== confirm) {
            Toast.error('Passwords do not match');
            return;
        }

        formDataState.password = password;

        // Submit Data
        await submitProfile();
    }


    // --- Transitions (Anime.js) ---
    function goToStep(nextStep) {
        if (nextStep > totalSteps || nextStep < 1) return;

        const currentStepEl = steps[currentStep];
        const nextStepEl = steps[nextStep];

        if (!currentStepEl || !nextStepEl) return;

        // Animate Current OUT (to Left)
        anime({
            targets: currentStepEl,
            translateX: ['0%', '-100%'],
            opacity: [1, 0],
            easing: 'easeInOutQuad',
            duration: 500,
            complete: () => {
                currentStepEl.classList.remove('active');
            }
        });

        // Animate Next IN (from Right)
        nextStepEl.classList.add('active');
        anime({
            targets: nextStepEl,
            translateX: ['100%', '0%'],
            opacity: [0, 1],
            easing: 'easeInOutQuad',
            duration: 500
        });

        currentStep = nextStep;
    }


    // --- API Submission ---
    async function submitProfile() {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Setting up...';
        }

        const formData = new FormData();
        formData.append('username', formDataState.username);
        formData.append('gender', formDataState.gender);
        formData.append('password', formDataState.password);
        if (formDataState.avatar) {
            formData.append('avatar', formDataState.avatar);
        }

        // Validate HTTPS for security
        if (!API_URL.startsWith('https://') && !API_URL.includes('localhost')) {
            Toast.error('API must use HTTPS for security');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Complete Setup';
            }
            return;
        }

        try {
            const res = await fetch(`${API_URL}/onboarding`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to update profile');

            Toast.success('Welcome to ProjectZG!');

            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1000);

        } catch (err) {
            console.error(err);
            Toast.error(err.message);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Complete Setup';
            }
        }
    }
});
