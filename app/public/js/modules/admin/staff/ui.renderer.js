import { escapeHtml, getGenderText, getStatusBadge } from './utils.js';

export const StaffUI = {
    renderLecturersTable: (data, page = 1, limit = 8) => {
        if (!data || !data.length) {
            return '<tr><td colspan="13" class="text-center">Không có dữ liệu</td></tr>';
        }
        return data.map((item, index) => {
            const l = item.lecturer || {};
            const stt = (page - 1) * limit + index + 1;
            
            const isDeleted = item.is_deleted === true;
            const rowClass = isDeleted ? 'deleted-row' : '';
            const opacity = isDeleted ? 'opacity: 0.5;' : '';

            return `
                <tr class="${rowClass}" style="${opacity}">
                    <td class="text-center">${stt}</td>
                    <td class="fw-bold" style="color: var(--primary-color)">${escapeHtml(item.full_name || item.name)}</td>
                    <td><span class="code-badge">${escapeHtml(l.lecturer_code) || '-'}</span></td>
                    <td>${escapeHtml(item.email) || '-'}</td>
                    <td>${escapeHtml(item.phone) || '-'}</td>
                    <td>${getGenderText(item.gender)}</td>
                    <td>${escapeHtml(l.department_name) || '-'}</td>
                    <td>${escapeHtml(l.academic_rank) || '-'}</td>
                    <td>${escapeHtml(l.degree) || '-'}</td>
                    <td>${escapeHtml(l.office_room) || '-'}</td>
                    <td>${isDeleted ? '<span class="status-badge status-deleted">Đã xóa</span>' : getStatusBadge(l.is_active)}</td>
                    <td class="text-center">
                        ${isDeleted ? `
                            <div class="action-buttons">
                                <button type="button" class="btn-icon btn-restore" 
                                    onclick="window.staffManager.restoreItem('lecturer', ${item.user_id})" 
                                    title="Khôi phục">
                                    <i class="fa-solid fa-rotate-left"></i>
                                </button>
                            </div>
                        ` : `
                            <div class="action-buttons">
                                <button type="button" class="btn-icon btn-edit" 
                                    onclick="window.staffManager.openModal('lecturer', 'edit', ${item.user_id})" 
                                    title="Chỉnh sửa">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button type="button" class="btn-icon btn-delete" 
                                    onclick="window.staffManager.deleteItem('lecturer', ${item.user_id})" 
                                    title="Xóa">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        `}
                    </td>
                </tr>`;
        }).join('');
    },

    renderAssistantsTable: (data, page = 1, limit = 8) => {
        if (!data || !data.length) {
            return '<tr><td colspan="12" class="text-center">Không có dữ liệu</td></tr>';
        }
        return data.map((item, index) => {
            const a = item.assistant || {};
            const stt = (page - 1) * limit + index + 1;
            
            const isDeleted = item.is_deleted === true;
            const rowClass = isDeleted ? 'deleted-row' : '';
            const opacity = isDeleted ? 'opacity: 0.5;' : '';

            return `
                <tr class="${rowClass}" style="${opacity}">
                    <td class="text-center">${stt}</td>
                    <td class="fw-bold" style="color: var(--primary-color)">${escapeHtml(item.full_name || item.name)}</td>
                    <td><span class="code-badge">${escapeHtml(a.assistant_code) || '-'}</span></td>
                    <td>${escapeHtml(item.email) || '-'}</td>
                    <td>${escapeHtml(item.phone) || '-'}</td>
                    <td>${getGenderText(item.gender)}</td>
                    <td>${escapeHtml(a.department_name) || '-'}</td>
                    <td>${escapeHtml(a.academic_rank) || '-'}</td>
                    <td>${escapeHtml(a.degree) || '-'}</td>
                    <td>${escapeHtml(a.office_room) || '-'}</td>
                    <td>${isDeleted ? '<span class="status-badge status-deleted">Đã xóa</span>' : getStatusBadge(a.is_active)}</td>
                    <td class="text-center">
                        ${isDeleted ? `
                            <div class="action-buttons">
                                <button type="button" class="btn-icon btn-restore" 
                                    onclick="window.staffManager.restoreItem('assistant', ${item.user_id})" 
                                    title="Khôi phục">
                                    <i class="fa-solid fa-rotate-left"></i>
                                </button>
                            </div>
                        ` : `
                            <div class="action-buttons">
                                <button type="button" class="btn-icon btn-edit" 
                                    onclick="window.staffManager.openModal('assistant', 'edit', ${item.user_id})" 
                                    title="Chỉnh sửa">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button type="button" class="btn-icon btn-delete" 
                                    onclick="window.staffManager.deleteItem('assistant', ${item.user_id})" 
                                    title="Xóa">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        `}
                    </td>
                </tr>`;
        }).join('');
    },

    renderPagination: (totalPages, currentPage, type) => {
        if (!totalPages || totalPages <= 1) return '';
        
        return `
            <div class="pagination-controls">
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="window.staffManager.goTo('${type}', ${currentPage - 1})">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <span class="page-info">Trang ${currentPage} / ${totalPages}</span>
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.staffManager.goTo('${type}', ${currentPage + 1})">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        `;
    },

    renderDepartmentOptions: (departments) => {
        return '<option value="">-- Chọn khoa --</option>' +
            departments.map(d => {
                const id = d.department_id ?? d.id ?? '';
                const name = d.department_name ?? d.name ?? '';
                return `<option value="${escapeHtml(String(id))}">${escapeHtml(name)}</option>`;
            }).join('');
    },

    fillForm: (type, data) => {
        const prefix = type === 'lecturer' ? 'lec_' : 'asst_';
        const userFields = ['username', 'first_name', 'last_name', 'email', 'phone', 'address', 'gender'];
        userFields.forEach(field => {
            const el = document.getElementById(`${prefix}${field}`);
            if (el) el.value = data[field] || '';
        });
        if (data.date_of_birth) {
            const dobEl = document.getElementById(`${prefix}date_of_birth`);
            if (dobEl) dobEl.value = data.date_of_birth.split('T')[0];
        }
        const activeEl = document.getElementById(`${prefix}is_active`);
        if (activeEl) activeEl.value = data.is_active ? 'true' : 'false';
        const spec = type === 'lecturer' ? data.lecturer : data.assistant;
        if (spec) {
            const commonFields = ['department_id', 'academic_rank', 'degree', 'office_room', 'office_hours', 'bio'];
            commonFields.forEach(field => {
                const el = document.getElementById(`${prefix}${field}`);
                if (el && spec[field] !== undefined) el.value = spec[field] || '';
            });
            const codeField = type === 'lecturer' ? 'lecturer_code' : 'assistant_code';
            const codeEl = document.getElementById(`${prefix}${codeField}`);
            if (codeEl && spec[codeField]) codeEl.value = spec[codeField];
            if (type === 'assistant') {
                const posEl = document.getElementById(`${prefix}position`);
                if (posEl && spec.position) posEl.value = spec.position;
            }
        }
    }
};