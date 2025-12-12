document.addEventListener('DOMContentLoaded', () => {
    const API_URL = (typeof Config !== 'undefined') ? Config.API_URL : '/api';

    // ==========================================
    // 1. Request Reset Link Logic
    // ==========================================
    const requestForm = document.getElementById('reset-request-form');
    if (requestForm) {
        const submitBtn = document.getElementById('submit-btn');

        function setRequestLoading(loading) {
            if (loading) {
                submitBtn.innerHTML = '<span class="spinner" style="margin: 0;"></span>';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';
                submitBtn.style.cursor = 'not-allowed';
            } else {
                submitBtn.innerHTML = 'Send Reset Link';
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
        }

        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            setRequestLoading(true);

            try {
                const res = await fetch(`${API_URL}/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();

                if (res.ok) {
                    Toast.success('Reset link sent! Please check your email.', 'Email Sent');
                    document.getElementById('email').value = '';
                } else {
                    Toast.error(data.error || 'Failed to send reset link');
                }
            } catch (err) {
                Toast.error('Network error: ' + err.message);
            } finally {
                setRequestLoading(false);
            }
        });
    }

    // ==========================================
    // 2. Update Password Logic
    // ==========================================
    const updateForm = document.getElementById('update-password-form');
    if (updateForm) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const updateFormContainer = document.getElementById('update-form-container');
        const successState = document.getElementById('success-state');
        const submitBtn = document.getElementById('submit-btn');

        function showState(el) {
            [loadingState, errorState, updateFormContainer, successState].forEach(s => s?.classList.add('hidden'));
            el?.classList.remove('hidden');
        }

        function setUpdateLoading(loading) {
            if (loading) {
                submitBtn.innerHTML = '<span class="spinner" style="margin: 0;"></span>';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';
                submitBtn.style.cursor = 'not-allowed';
            } else {
                submitBtn.innerHTML = 'Update Password';
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
        }

        // Check token and show appropriate state
        if (type === 'recovery' && accessToken) {
            showState(updateFormContainer);
        } else {
            showState(errorState);
        }

        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                Toast.error('Passwords do not match');
                return;
            }
            if (newPassword.length < 8) {
                Toast.warning('Password must be at least 8 characters');
                return;
            }

            // Strong password validation
            const hasLower = /[a-z]/.test(newPassword);
            const hasUpper = /[A-Z]/.test(newPassword);
            const hasDigit = /\d/.test(newPassword);
            const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

            if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
                Toast.warning('Password must include lowercase, uppercase, number, and symbol');
                return;
            }

            setUpdateLoading(true);
            try {
                const res = await fetch(`${API_URL}/reset-password/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: newPassword, accessToken })
                });
                const data = await res.json();

                if (res.ok) {
                    Toast.success('Password updated successfully!');
                    setTimeout(() => showState(successState), 1500);
                } else {
                    Toast.error(data.error || 'Failed to update password');
                }
            } catch (err) {
                Toast.error('Network error: ' + err.message);
            } finally {
                setUpdateLoading(false);
            }
        });
    }
});
