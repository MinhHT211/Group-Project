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

export function getCourseTypeBadge(type) {
    const map = {
        'mandatory': '<span class="type-badge type-mandatory">Bắt buộc</span>',
        'elective': '<span class="type-badge type-elective">Tự chọn</span>',
        'general': '<span class="type-badge type-general">Đại cương</span>'
    };
    return map[type] || escapeHtml(type);
}

export function getLevelBadge(level) {
    const map = {
        'beginner': '<span class="level-badge level-beginner">Cơ bản</span>',
        'intermediate': '<span class="level-badge level-intermediate">Trung cấp</span>',
        'advanced': '<span class="level-badge level-advanced">Nâng cao</span>'
    };
    return map[level] || escapeHtml(level);
}

export function getClassTypeBadge(type) {
    const map = {
        'regular': '<span class="class-type-badge class-type-regular">Thông thường</span>',
        'online': '<span class="class-type-badge class-type-online">Trực tuyến</span>',
        'hybrid': '<span class="class-type-badge class-type-hybrid">Kết hợp</span>'
    };
    return map[type] || escapeHtml(type);
}

export function getClassStatusBadge(status) {
    const map = {
        'planning': '<span class="class-status-badge class-status-planning">Lên kế hoạch</span>',
        'open': '<span class="class-status-badge class-status-open">Mở đăng ký</span>',
        'in_progress': '<span class="class-status-badge class-status-in_progress">Đang học</span>',
        'completed': '<span class="class-status-badge class-status-completed">Hoàn thành</span>',
        'cancelled': '<span class="class-status-badge class-status-cancelled">Đã hủy</span>'
    };
    return map[status] || escapeHtml(status);
}

export function showLoading(elementId, colspan = 6) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = `<tr><td colspan="${colspan}" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>`;
}

export function showError(elementId, message, colspan = 6) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-red">Lỗi: ${escapeHtml(message)}</td></tr>`;
}