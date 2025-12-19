module.exports = (opts = {}) => {
    const { paramKey = 'userId', readFrom = 'params' } = opts;
    return (req, res, next) => {
        const me = String(req.user?.sub ?? req.user?.user_id ?? '');
        const requested = String(
        readFrom === 'query'
            ? (req.query?.[paramKey] ?? '')
            : (req.params?.[paramKey] ?? '')
        );
        if (!requested) {
        return res.status(400).json({ error: `Missing ${paramKey} in URL` });
        }
        if (requested !== me) {
        return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
};
