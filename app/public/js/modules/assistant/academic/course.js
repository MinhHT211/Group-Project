import { AcademicService } from './api.service.js';
import * as Utils from './utils.js';
import { ConfirmModal } from '/js/components/confirm-modal.js';

const state = {
    page: 1,
    limit: 9,
    editingId: null,
};

/* --- DATA LOADING --- */

async function loadCourses() {
    Utils.showLoading('courseTableBody', 8);
    try {
        const params = {
            page: state.page,
            limit: state.limit,
            search: document.getElementById('courseSearch')?.value.trim() || '',
            course_type: document.getElementById('courseTypeFilter')?.value || '',
            is_active: document.getElementById('courseStatusFilter')?.value || ''
        };
        if (params.course_type === '') delete params.course_type;
        if (params.is_active === '') delete params.is_active;

        const res = await AcademicService.getCourses(params);
        
        if (res && res.data) {
            const totalEl = document.getElementById('totalCourses');
            if (totalEl) totalEl.textContent = res.total || res.data.length || 0;
            
            document.getElementById('courseTableBody').innerHTML = renderCoursesTable(res.data);
            document.getElementById('pagination-course').innerHTML = renderPagination(res.total_pages, res.current_page);
        } else {
            document.getElementById('courseTableBody').innerHTML = '<tr><td colspan="8" class="text-center">Không có dữ liệu</td></tr>';
        }
    } catch (err) {
        console.error('loadCourses error', err);
        Utils.showError('courseTableBody', err.message, 8);
    }
}

/* --- RENDER TABLE --- */

function renderCoursesTable(data) {
    if (!data || !data.length) {
        return '<tr><td colspan="9" class="text-center">Không có dữ liệu</td></tr>';
    }
    return data.map((course, index) => {
        const jsName = (course.course_name || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
        const stt = (state.page - 1) * state.limit + index + 1;

        return `
        <tr>
            <td class="text-center">${stt}</td>
            <td><span class="code-badge">${Utils.escapeHtml(course.course_code)}</span></td>
            <td class="fw-bold" style="color: #1565c0">
                ${Utils.escapeHtml(course.course_name)}
            </td>
            <td>${Utils.getCourseTypeBadge(course.course_type)}</td>
            <td class="text-center">${course.credits || 0}</td>
            <td class="text-center">${course.theory_hours || 0}</td>
            <td class="text-center">${course.practice_hours || 0}</td>
            <td>${Utils.getStatusBadge(course.is_active)}</td>
            <td class="text-center">
                <div class="action-buttons">
                    <button type="button" class="btn-icon btn-view" 
                            onclick="window.courseManager.goToSemester(${course.course_id}, '${jsName}')" 
                            title="Xem học kỳ">
                        <i class="fa-solid fa-calendar-alt"></i>
                    </button>
                    <button type="button" class="btn-icon btn-edit" 
                            onclick="window.courseManager.edit(${course.course_id})" 
                            title="Chỉnh sửa">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="btn-icon btn-delete" 
                            onclick="window.courseManager.delete(${course.course_id})" 
                            title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

function renderPagination(totalPages, currentPage) {
    if (!totalPages || totalPages <= 1) return '';
    return `
        <div class="pagination-controls">
            <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="window.courseManager.goToPage(${currentPage - 1})">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="page-info">Trang ${currentPage} / ${totalPages}</span>
            <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.courseManager.goToPage(${currentPage + 1})">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
}

/* --- MODAL --- */

function openModal(mode, data = null) {
    const modal = document.getElementById('courseModal');
    const form = document.getElementById('courseForm');
    const title = document.getElementById('courseModalTitle');

    form.reset();
    state.editingId = data ? data.course_id : null;

    title.textContent = mode === 'edit' ? 'Cập nhật khóa học' : 'Thêm khóa học';

    if (data) {
        document.getElementById('course_code').value = data.course_code || '';
        document.getElementById('course_name').value = data.course_name || '';
        document.getElementById('course_type').value = data.course_type || '';
        document.getElementById('level').value = data.level || '';
        document.getElementById('credits').value = data.credits || '';
        document.getElementById('theory_hours').value = data.theory_hours || 0;
        document.getElementById('practice_hours').value = data.practice_hours || 0;
        document.getElementById('course_is_active').value = data.is_active ? 'true' : 'false';
        document.getElementById('description').value = data.description || '';
        document.getElementById('learning_outcomes').value = data.learning_outcomes || '';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('courseModal').style.display = 'none';
    state.editingId = null;
}

/* --- CRUD --- */

async function editCourse(id) {
    try {
        const res = await AcademicService.getCourseById(id);
        if (res && (res.data || res.course_id)) {
            openModal('edit', res.data || res);
        }
    } catch (e) {
        window.showToast('error', 'Lỗi tải dữ liệu: ' + e.message);
    }
}

function deleteCourse(id) {
    ConfirmModal.show(
        'Bạn có chắc chắn muốn xóa khóa học này không?',
        async () => {
            try {
                const res = await AcademicService.deleteCourse(id);
                if (res && res.success) {
                    window.showToast('success', 'Xóa thành công!');
                    loadCourses();
                } else {
                    window.showToast('error', res.message || 'Xóa thất bại!');
                }
            } catch (e) {
                window.showToast('error', 'Lỗi hệ thống: ' + (e.message || e));
            }
        },
        'Xóa', 'Xóa Khóa học'
    );
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.btn-save');
    const oldText = btn?.innerHTML;
    if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Xử lý...'; btn.disabled = true; }

    try {
        const formData = new FormData(form);
        const body = {
            course_code: formData.get('course_code'),
            course_name: formData.get('course_name'),
            course_type: formData.get('course_type'),
            level: formData.get('level') || null,
            credits: parseInt(formData.get('credits')),
            theory_hours: parseInt(formData.get('theory_hours')) || 0,
            practice_hours: parseInt(formData.get('practice_hours')) || 0,
            description: formData.get('description') || null,
            learning_outcomes: formData.get('learning_outcomes') || null,
            is_active: formData.get('is_active') === 'true'
        };

        let res;
        if (state.editingId) {
            res = await AcademicService.updateCourse(state.editingId, body);
        } else {
            res = await AcademicService.createCourse(body);
        }

        if (res && res.success) {
            window.showToast('success', 'Thành công!');
            closeModal();
            loadCourses();
        } else {
            window.showToast('error', res.message || 'Thao tác thất bại!');
        }
    } catch (err) {
        console.error(err);
        window.showToast('error', 'Lỗi hệ thống: ' + (err.message || err));
    } finally {
        if (btn) { btn.innerHTML = oldText; btn.disabled = false; }
    }
}

/* --- EVENT LISTENERS --- */

function setupEventListeners() {
    document.getElementById('addCourseBtn')?.addEventListener('click', () => openModal('add'));
    document.getElementById('searchCourseBtn')?.addEventListener('click', () => { state.page = 1; loadCourses(); });
    document.getElementById('courseSearch')?.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') { state.page = 1; loadCourses(); } 
    });
    document.getElementById('courseTypeFilter')?.addEventListener('change', () => { state.page = 1; loadCourses(); });
    document.getElementById('courseStatusFilter')?.addEventListener('change', () => { state.page = 1; loadCourses(); });
    document.getElementById('courseForm')?.addEventListener('submit', handleFormSubmit);

    window.addEventListener('click', (e) => {
        if (e.target.classList?.contains('modal-overlay')) {
            const id = e.target.id;
            if (id === 'courseModal') closeModal();
            if (id === 'confirmModal') closeConfirm();
        }
    });

    document.querySelectorAll('.close-modal-btn, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.getAttribute('data-modal');
            if (modal === 'course') closeModal();
            if (modal === 'confirm') closeConfirm();
        });
    });
}

/* --- PUBLIC API --- */

const PublicAPI = {
    edit: editCourse,
    delete: deleteCourse,
    goToSemester: (courseId, courseName = '') => {
        window.location.href = `/assistant/course/semester?courseId=${courseId}&courseName=${encodeURIComponent(courseName)}`;
    },
    goToPage: (page) => {
        if (page < 1) return;
        state.page = page;
        loadCourses();
    }
};

/* --- INIT --- */

document.addEventListener('DOMContentLoaded', () => {
    window.courseManager = PublicAPI;
    setupEventListeners();
    loadCourses();
});