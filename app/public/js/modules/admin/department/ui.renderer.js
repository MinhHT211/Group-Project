import { escapeHtml, getStatusBadge, DEGREE_MAP } from './utils.js';

export const DepartmentUI = {
    renderDepartmentsTable: (data, page = 1, limit = 8) => {
        if (!data || !data.length) {
            return '<tr><td colspan="11" class="text-center">Không có dữ liệu</td></tr>';
        }
        return data.map((dept, index) => {
            const stt = (page - 1) * limit + index + 1;

            return `
            <tr class="department-row">
                <td class="text-center">${stt}</td>        
                <td><span class="code-badge">${escapeHtml(dept.department_code)}</span></td>
                <td class="fw-bold" style="color: var(--primary-color)">${escapeHtml(dept.department_name)}</td>
                <td>${dept.head_lecturer ? escapeHtml(dept.head_lecturer.name) : '-'}</td>
                <td>
                    ${dept.phone ? `<div class="contact-info"><i class="fa-solid fa-phone"></i>${escapeHtml(dept.phone)}</div>` : ''}
                    ${dept.email ? `<div class="contact-info"><i class="fa-solid fa-envelope"></i>${escapeHtml(dept.email)}</div>` : ''}
                    ${!dept.phone && !dept.email ? '-' : ''}
                </td>
                <td>${escapeHtml(dept.location) || '-'}</td>
                <td><span class="stat-badge">${dept.statistics?.lecturer_count || 0}</span></td>
                <td><span class="stat-badge">${dept.statistics?.assistant_count || 0}</span></td>
                <td><span class="stat-badge">${dept.statistics?.major_count || 0}</span></td>
                <td>${getStatusBadge(dept.is_active)}</td>
                <td class="text-center" onclick="event.stopPropagation()">
                    <div class="action-buttons">
                        <button type="button" class="btn-icon btn-view" onclick="window.departmentManager.selectDepartment(${dept.department_id}, '${escapeHtml(dept.department_name)}')" title="Xem chuyên ngành">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button type="button" class="btn-icon btn-edit" onclick="window.departmentManager.editDepartment(${dept.department_id})" title="Chỉnh sửa">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn-icon btn-delete" onclick="window.departmentManager.deleteDepartment(${dept.department_id})" title="Xóa">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    },

    renderMajorsTable: (data, page = 1, limit = 8) => {
        if (!data || !data.length) {
            return '<tr><td colspan="9" class="text-center">Không có dữ liệu</td></tr>';
        }
        return data.map((major, index) => {
            const stt = (page - 1) * limit + index + 1;

            return `
            <tr>
                <td class="text-center">${stt}</td>

                <td><span class="code-badge">${escapeHtml(major.major_code)}</span></td>
                <td class="fw-bold" style="color: var(--primary-color)">${escapeHtml(major.major_name)}</td>
                <td>${DEGREE_MAP[major.degree_type] || major.degree_type}</td>
                <td>${major.required_credits || '-'}</td>
                <td>${major.duration_years || '-'}</td>
                <td>${major.description ? (major.description.length > 50 ? escapeHtml(major.description.substring(0, 50)) + '...' : escapeHtml(major.description)) : '-'}</td>
                <td>${getStatusBadge(major.is_active)}</td>
                <td class="text-center">
                    <div class="action-buttons">
                        <button type="button" class="btn-icon btn-edit" onclick="window.departmentManager.editMajor(${major.major_id})" title="Chỉnh sửa">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn-icon btn-delete" onclick="window.departmentManager.deleteMajor(${major.major_id})" title="Xóa">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    },

    renderPagination: (type, totalPages, currentPage) => {
        if (!totalPages || totalPages <= 1) return '';
        return `
            <div class="pagination-controls">
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window.departmentManager.goTo('${type}', ${currentPage - 1})">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <span class="page-info">Trang ${currentPage} / ${totalPages}</span>
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.departmentManager.goTo('${type}', ${currentPage + 1})">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        `;
    },

    renderLecturerOptions: (lecturers) => {
        let html = '<option value="">-- Chọn trưởng khoa --</option>';
        if (Array.isArray(lecturers) && lecturers.length) {
            html += lecturers.map(l => {
                const value = l.user_id ?? l.id ?? '';
                const code = l.lecturer_code || l.lecturer?.lecturer_code || '';
                const name = l.full_name || l.name || '';
                const label = code && name ? `${code} - ${name}` : (code || name || '');
                return `<option value="${escapeHtml(String(value))}" data-lecturer-code="${escapeHtml(String(code))}" data-lecturer-name="${escapeHtml(String(name))}">${escapeHtml(String(label))}</option>`;
            }).join('');
        }
        return html;
    },

    fillForm: (type, data) => {
        if (type === 'department') {
            document.getElementById('department_code').value = data.department_code || '';
            document.getElementById('department_name').value = data.department_name || '';
            document.getElementById('description').value = data.description || '';
            document.getElementById('phone').value = data.phone || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('location').value = data.location || '';
            document.getElementById('head_lecturer_id').value = data.head_lecturer_id || '';
            document.getElementById('is_active').value = data.is_active ? 'true' : 'false';
        } else {
            document.getElementById('major_code').value = data.major_code || '';
            document.getElementById('major_name').value = data.major_name || '';
            document.getElementById('degree_type').value = data.degree_type || '';
            document.getElementById('required_credits').value = data.required_credits || '';
            document.getElementById('duration_years').value = data.duration_years || '';
            document.getElementById('major_description').value = data.description || '';
            document.getElementById('major_is_active').value = data.is_active ? 'true' : 'false';
        }
    }
};