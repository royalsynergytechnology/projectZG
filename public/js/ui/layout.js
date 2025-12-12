/**
 * layout.js - Self-contained Header & Footer for Auth Pages
 * 
 * This is a single file that provides both header and footer.
 * Just include this file - no need for separate header.js or footer.js.
 * 
 * Usage:
 *   1. Include header.css and footer.css in your HTML
 *   2. Include this script at the end of body
 *   3. It auto-initializes on DOMContentLoaded
 */

(function () {
    // Configuration
    let config = {
        basePath: '../',
        currentPage: 'signin'
    };

    // Detect current page from URL
    function detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('reset-password/update')) return 'update';
        if (path.includes('reset-password')) return 'reset';
        if (path.includes('verify-email')) return 'verify';
        if (path.includes('auth')) return 'signin';
        return 'signin';
    }

    // Detect basePath from script location
    function detectBasePath() {
        const scripts = document.querySelectorAll('script[src*="layout.js"]');
        if (scripts.length > 0) {
            const src = scripts[0].getAttribute('src');
            const depth = (src.match(/\.\.\//g) || []).length;
            return '../'.repeat(depth) || '../';
        }
        return '../';
    }

    // Create Header HTML
    function createHeader() {
        const page = config.currentPage;

        return `
        <header class="auth-header">
            <div class="auth-header-inner">
                <a href="${config.basePath}" class="auth-logo">
                    <img src="${config.basePath}favicon/icons8-dev-community-color-48.png" alt="ProjectZG Logo">
                    <span>ProjectZG</span>
                </a>
                <nav class="auth-nav">
                    <a href="${config.basePath}auth/" class="auth-nav-link ${page === 'signin' || page === 'signup' ? 'active' : ''}">Sign In</a>
                    <a href="${config.basePath}" class="auth-nav-link">Home</a>
                    <a href="#" class="auth-nav-link">About</a>
                </nav>
            </div>
        </header>
        `;
    }

    // Create Footer HTML
    function createFooter() {
        const year = new Date().getFullYear();

        return `
        <footer class="auth-footer">
            <div class="auth-footer-inner">
                <div class="auth-social-links">
                    <a href="https://github.com/CodeWithHafi" target="_blank" rel="noopener noreferrer" class="auth-social-link" title="GitHub">
                        <i class="fab fa-github"></i>
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="auth-social-link" title="Twitter">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="https://discord.com" target="_blank" rel="noopener noreferrer" class="auth-social-link" title="Discord">
                        <i class="fab fa-discord"></i>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="auth-social-link" title="LinkedIn">
                        <i class="fab fa-linkedin-in"></i>
                    </a>
                </div>
                <div class="auth-footer-links">
                    <a href="#" class="auth-footer-link">Privacy Policy</a>
                    <a href="#" class="auth-footer-link">Terms of Service</a>
                    <a href="#" class="auth-footer-link">Community Guidelines</a>
                    <a href="#" class="auth-footer-link">Help & Support</a>
                    <a href="#" class="auth-footer-link">Contact Us</a>
                </div>
                <p class="auth-footer-copyright">© ${year} ProjectZG. All rights reserved.</p>
            </div>
        </footer>
        `;
    }

    // Initialize layout
    function init() {
        config.basePath = detectBasePath();
        config.currentPage = detectCurrentPage();

        // Add class to body for padding adjustments
        document.body.classList.add('has-auth-layout');

        // Insert header at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', createHeader());

        // Insert footer before scripts
        const scripts = document.body.querySelectorAll('script');
        if (scripts.length > 0) {
            scripts[0].insertAdjacentHTML('beforebegin', createFooter());
        } else {
            document.body.insertAdjacentHTML('beforeend', createFooter());
        }
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
