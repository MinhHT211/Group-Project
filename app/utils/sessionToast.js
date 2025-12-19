    'use strict';

    function pushToast(req, { type = 'info', title = '', message = '', ttlMs = 5000 } = {}) {
    if (!req.session) return;

    if (!Array.isArray(req.session.toasts)) req.session.toasts = [];

    req.session.toasts.push({
        id: Date.now() + Math.random().toString(16).slice(2),
        type,       
        title,
        message,
        ttlMs
    });
    }

    function consumeToasts(req) {
    if (!req.session) return [];
    const toasts = Array.isArray(req.session.toasts) ? req.session.toasts : [];
    req.session.toasts = [];
    return toasts;
    }

    module.exports = { pushToast, consumeToasts };