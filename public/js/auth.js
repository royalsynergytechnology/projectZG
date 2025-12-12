const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

// Desktop Overlay Toggles
if (signUpButton) {
    signUpButton.addEventListener('click', () => {
        container.classList.add("right-panel-active");
    });
}

if (signInButton) {
    signInButton.addEventListener('click', () => {
        container.classList.remove("right-panel-active");
    });
}

// Mobile Form Toggles
const mobileSignUpBtn = document.getElementById('mobileSignUp');
const mobileSignInBtn = document.getElementById('mobileSignIn');

if (mobileSignUpBtn) {
    mobileSignUpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        container.classList.add("right-panel-active");
    });
}

if (mobileSignInBtn) {
    mobileSignInBtn.addEventListener('click', (e) => {
        e.preventDefault();
        container.classList.remove("right-panel-active");
    });
}

// --- Backend Authentication ---

const API_URL = (typeof Config !== 'undefined') ? Config.API_URL : 'http://localhost:3000/api';

// 1. Sign Up (Email/Password)
const btnSignup = document.getElementById('btn-signup');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupUsername = document.getElementById('signup-username');
const signupName = document.getElementById('signup-name');

if (btnSignup) {
    btnSignup.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = signupEmail.value;
        const password = signupPassword.value;
        const username = signupUsername.value;
        const fullName = signupName ? signupName.value : '';

        if (!email || !password || !username) {
            Toast.warning("Please enter email, password, and username", "Missing Fields");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Toast.warning("Please enter a valid email address", "Invalid Email");
            return;
        }

        // Username validation
        if (username.length < 3 || username.length > 30) {
            Toast.warning("Username must be 3-30 characters", "Invalid Username");
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            Toast.warning("Username can only contain letters, numbers, and underscores", "Invalid Username");
            return;
        }

        // Password validation
        if (password.length < 8) {
            Toast.warning("Password must be at least 8 characters", "Weak Password");
            return;
        }
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
            Toast.warning("Password must include lowercase, uppercase, number, and symbol", "Weak Password");
            return;
        }

        // Validate HTTPS for security
        if (!API_URL.startsWith('https://') && !API_URL.includes('localhost')) {
            Toast.error('API must use HTTPS for security');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username, fullName })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Signup failed');

            Toast.success("Account created! Please check your email to verify.", "Welcome!");
            setTimeout(() => {
                window.location.href = "verify-email/";
            }, 1500);

        } catch (err) {
            Toast.error(err.message, "Signup Failed");
        }
    });
}

// 2. Sign In (Email/Username)
const btnSignin = document.getElementById('btn-signin');
const signinIdentifier = document.getElementById('signin-identifier');
const signinPassword = document.getElementById('signin-password');

if (btnSignin) {
    btnSignin.addEventListener('click', async (e) => {
        e.preventDefault();
        const identifier = signinIdentifier.value;
        const password = signinPassword.value;

        if (!identifier || !password) {
            Toast.warning("Please enter email/username and password", "Missing Fields");
            return;
        }

        // Validate HTTPS for security
        if (!API_URL.startsWith('https://') && !API_URL.includes('localhost')) {
            Toast.error('API must use HTTPS for security');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Login failed');

            // Store session
            // Tokens are now stored in HttpOnly cookies by the backend.
            // No need to save to localStorage.

            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user)); // Keep user info for UI if needed
            }

            Toast.success("Welcome back!", "Signed In");
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1000);
        } catch (err) {
            Toast.error(err.message, "Login Failed");
        }
    });
}

// 3. Social Auth (Backend Redirect)
async function signInWithProvider(provider) {
    if (provider === 'google') {
        Toast.info("Redirecting to Google...", "Please wait");

        // Redirect to backend OAuth initiation
        window.location.href = `${API_URL}/auth/google`;

    } else {
        Toast.info("Social Login is coming soon!", "Not Available");
    }
}

// Bind Social Buttons (Sign Up)
document.getElementById('signup-google')?.addEventListener('click', (e) => { e.preventDefault(); signInWithProvider('google'); });
document.getElementById('signup-facebook')?.addEventListener('click', (e) => { e.preventDefault(); signInWithProvider('facebook'); });

// Bind Social Buttons (Sign In)
document.getElementById('signin-google')?.addEventListener('click', (e) => { e.preventDefault(); signInWithProvider('google'); });
document.getElementById('signin-facebook')?.addEventListener('click', (e) => { e.preventDefault(); signInWithProvider('facebook'); });
