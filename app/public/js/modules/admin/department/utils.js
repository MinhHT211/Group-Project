export function escapeHtml(text) {
    if (!text && text !== 0) return '';
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

export function showLoading(elementId, colspan = 10) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = `<tr><td colspan="${colspan}" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>`;
}

export function showError(elementId, message, colspan = 10) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-red">Lỗi: ${message}</td></tr>`;
}

export const DEGREE_MAP = {
    'Bachelor': 'Cử nhân', 'bachelor': 'Cử nhân',
    'Master': 'Thạc sĩ',   'master': 'Thạc sĩ',
    'PhD': 'Tiến sĩ',      'doctoral': 'Tiến sĩ'
};