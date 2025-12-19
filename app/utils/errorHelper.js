const parseErrorMessage = (error) => {
    if (!error) return 'Đã có lỗi xảy ra';
    
    const message = typeof error === 'string' ? error : error.message;
    
    const parts = message.split(':');
    return parts[parts.length - 1].trim();
};

module.exports = { parseErrorMessage };