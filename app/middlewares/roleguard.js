module.exports = (allowed = [], { allowAdmin = true } = {}) => {
    const norm = (x) => String(x || '').toLowerCase();

    const allowSet = new Set(allowed.map(norm));
    return (req, res, next) => {
        const roles = Array.isArray(req.user?.roles) ? req.user.roles.map(norm) : [];
        if (allowAdmin && roles.includes('admin')) return next();

        const ok = roles.some(r => allowSet.has(r));
        if (!ok) return res.status(403).send('Forbidden');
        next();
    };
};
