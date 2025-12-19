// document.addEventListener('DOMContentLoaded', () => {
//     const container = document.getElementById('toast-container');
//     if (!container || !window.__TOASTS__) return;

//     window.__TOASTS__.forEach((t) => {
//         const el = document.createElement('div');
//         el.className = `toast toast-${t.type}`;
//         el.textContent = t.message;
//         container.appendChild(el);

//         setTimeout(() => el.classList.add('show'), 50);
//         setTimeout(() => {
//         el.classList.remove('show');
//         setTimeout(() => el.remove(), 300);
//         }, 5000);
//     });
//     });

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // SSR toasts
        if (window.__TOASTS__) {
            window.__TOASTS__.forEach((t) => {
            const el = document.createElement('div');
            el.className = `toast toast-${t.type}`;
            el.textContent = t.message;
            container.appendChild(el);

            setTimeout(() => el.classList.add('show'), 50);
            setTimeout(() => {
                el.classList.remove('show');
                setTimeout(() => el.remove(), 300);
            }, 5000);
            });

        delete window.__TOASTS__;
    }

    // Client-side toast
    window.showToast = function (type, message, ttl = 5000) {
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.textContent = message;
        container.appendChild(el);

        setTimeout(() => el.classList.add('show'), 50);
        setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
        }, ttl);
    };
});

