/**
 * Toast Notification System
 * Usage:
 *   1. Include toast.css in your HTML
 *   2. Include this script
 *   3. Add: <div id="toast-container" class="toast-container"></div>
 *   4. Call: Toast.success('Message'), Toast.error('Message'), etc.
 */
const Toast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(options) {
        if (!this.container) this.init();

        const { type = 'info', title, message, duration = 4000 } = options;
        const icons = { success: 'fa-check', error: 'fa-times', warning: 'fa-exclamation', info: 'fa-info' };
        const titles = { success: 'Success!', error: 'Error!', warning: 'Warning!', info: 'Info' };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        icon.innerHTML = `<i class="fas ${icons[type]}"></i>`;

        const content = document.createElement('div');
        content.className = 'toast-content';

        const titleEl = document.createElement('div');
        titleEl.className = 'toast-title';
        titleEl.textContent = title || titles[type];

        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';

        const progress = document.createElement('div');
        progress.className = 'toast-progress';
        progress.style.animationDuration = `${duration}ms`;

        content.appendChild(titleEl);
        content.appendChild(messageEl);
        toast.appendChild(icon);
        toast.appendChild(content);
        toast.appendChild(closeBtn);
        toast.appendChild(progress);

        toast.querySelector('.toast-close').onclick = () => this.close(toast);
        this.container.appendChild(toast);
        setTimeout(() => this.close(toast), duration);
        return toast;
    },

    close(toast) {
        if (toast && !toast.classList.contains('closing')) {
            toast.classList.add('closing');
            setTimeout(() => toast.remove(), 400);
        }
    },

    success(message, title) { return this.show({ type: 'success', title, message }); },
    error(message, title) { return this.show({ type: 'error', title, message }); },
    warning(message, title) { return this.show({ type: 'warning', title, message }); },
    info(message, title) { return this.show({ type: 'info', title, message }); }
};

// Auto-init if container exists
document.addEventListener('DOMContentLoaded', () => Toast.init());
