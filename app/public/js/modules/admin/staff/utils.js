export function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[m]));
}

export function getStatusBadge(isActive) {
    return isActive
        ? '<span class="status-badge status-active">Hoạt động</span>'
        : '<span class="status-badge status-inactive">Ngừng</span>';
}

export function getGenderText(gender) {
    switch (gender) {
        case 'male': return 'Nam';
        case 'female': return 'Nữ';
        default: return 'Khác';
    }
}

export function showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<tr><td colspan="100%" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>';
}

export function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = `<tr><td colspan="100%" class="text-center text-danger">Lỗi: ${message}</td></tr>`;
}