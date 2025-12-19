import { AcademicService } from './api.service.js';
import * as Utils from './utils.js';
import { ConfirmModal } from '/js/components/confirm-modal.js';

const state = {
    page: 1,
    limit: 7,
    editingId: null,
    courseId: null,
    courseName: ''
};

/* --- DATA LOADING --- */

async function loadSemesters() {
    Utils.showLoading('semesterTableBody', 6);

    try {
        const params = {
            page: state.page,
            limit: state.limit,
            search: document.getElementById('semesterSearch')?.value.trim() || '',
            is_active: document.getElementById('semesterStatusFilter')?.value || ''
        };
        
        if (params.is_active === '') delete params.is_active;

        const res = await AcademicService.getSemesters(params);

        if (res && res.data) {
            const totalEl = document.getElementById('totalSemesters');
            if (totalEl) totalEl.textContent = res.total || res.data.length || 0;
            
            document.getElementById('semesterTableBody').innerHTML = renderSemestersTable(res.data);
            document.getElementById('pagination-semester').innerHTML = renderPagination(res.total_pages, res.current_page);
        } else {
            document.getElementById('semesterTableBody').innerHTML = '<tr><td colspan="6" class="text-center">Không có dữ liệu</td></tr>';
        }
    } catch (err) {
        console.error('loadSemesters error', err);
        Utils.showError('semesterTableBody', err.message, 6);
    }
}

/* --- RENDER TABLE --- */

function renderSemestersTable(data) {
    if (!data || !data.length) {
        return '<tr><td colspan="7" class="text-center">Không có dữ liệu</td></tr>';
    }
    
    return data.map((semester, index) => {
        const jsName = (semester.semester_name || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
        const enrollDate = semester.enrollment_date 
            ? new Date(semester.enrollment_date).toLocaleDateString('vi-VN') 
            : '-';
        const stt = (state.page - 1) * state.limit + index + 1;
        return `
            <tr>
                <td class="text-center">${stt}</td>
                <td><span class="code-badge">${Utils.escapeHtml(semester.semester_code)}</span></td>
                <td class="fw-bold" style="color: #1565c0">${Utils.escapeHtml(semester.semester_name)}</td>
                <td>${Utils.escapeHtml(semester.academic_year)}</td>
                <td>${enrollDate}</td>
                <td>${Utils.getStatusBadge(semester.is_active)}</td>
                <td class="text-center">
                    <div class="action-buttons">
                        <button type="button" class="btn-icon btn-view" 
                            onclick="window.semesterManager.goToClass(${semester.semester_id}, '${jsName}')" 
                            title="Xem lớp học">
                            <i class="fa-solid fa-chalkboard-user"></i>
                        </button>
                        <button type="button" class="btn-icon btn-edit" 
                            onclick="window.semesterManager.edit(${semester.semester_id})" 
                            title="Sửa thông tin học kỳ">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn-icon btn-delete" 
                            onclick="window.semesterManager.delete(${semester.semester_id})" 
                            title="Xóa học kỳ">
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
                    onclick="window.semesterManager.goToPage(${currentPage - 1})">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="page-info">Trang ${currentPage} / ${totalPages}</span>
            <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.semesterManager.goToPage(${currentPage + 1})">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
}

/* --- MODAL & FORM HANDLING --- */

function openModal(mode, data = null) {
    const modal = document.getElementById('semesterModal');
    const form = document.getElementById('semesterForm');
    const title = document.getElementById('semesterModalTitle');

    form.reset();

    if (mode === 'edit' && data) {
        state.editingId = data.semester_id;
        title.textContent = 'Cập nhật học kỳ';
        document.getElementById('semester_code').value = data.semester_code || '';
        document.getElementById('semester_name').value = data.semester_name || '';
        document.getElementById('academic_year').value = data.academic_year || '';
        if (data.enrollment_date) {
            document.getElementById('enrollment_date').value = new Date(data.enrollment_date).toISOString().split('T')[0];
        }
        document.getElementById('semester_is_active').value = data.is_active ? 'true' : 'false';
    } else {
        state.editingId = null;
        title.textContent = 'Thêm học kỳ mới';
        document.getElementById('semester_is_active').value = 'true';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('semesterModal').style.display = 'none';
    state.editingId = null;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.btn-save');
    const oldText = btn?.innerHTML;
    if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...'; btn.disabled = true; }

    try {
        const formData = new FormData(form);
        const body = {
            semester_code: formData.get('semester_code'),
            semester_name: formData.get('semester_name'),
            academic_year: formData.get('academic_year'),
            enrollment_date: formData.get('enrollment_date'),
            is_active: formData.get('is_active') === 'true'
        };

        let res;
        if (state.editingId) {
            res = await AcademicService.updateSemester(state.editingId, body);
        } else {
            res = await AcademicService.createSemester(body);
        }

        if (res && res.success) {
            if(state.editingId) {
                window.showToast('success', 'Cập nhật thành công!');
            } else {
                window.showToast('success', 'Thêm mới Thành công!');
            }
            closeModal();
            loadSemesters();
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

/* --- CRUD API --- */

async function editSemester(id) {
    try {
        const res = await AcademicService.getSemesterById(id);
        if (res && (res.data || res.semester_id)) {
            openModal('edit', res.data || res);
        } else {
            window.showToast('error', 'Không tìm thấy dữ liệu');
        }
    } catch (e) {
        window.showToast('error', 'Lỗi tải dữ liệu: ' + e.message);
    }
}

function deleteSemester(id) {
    ConfirmModal.show(
        'Bạn có chắc chắn muốn xóa học kỳ này không?',
        async () => {
            try {
                const res = await AcademicService.deleteSemester(id);
                if (res && res.success) {
                    window.showToast('success', 'Đã xóa thành công!');
                    loadSemesters();
                } else {
                    window.showToast('error', res.message || 'Xóa thất bại!');
                }
            } catch (e) {
                window.showToast('error', 'Lỗi mạng: ' + e.message);
            }
        },
        'Xóa', 'Xóa Học kỳ'
    );
}

/* --- EVENTS --- */

function setupEventListeners() {
    const addBtn = document.getElementById('addSemesterBtn');
    if (addBtn) addBtn.addEventListener('click', () => openModal('add'));

    document.getElementById('searchSemesterBtn')?.addEventListener('click', () => { state.page = 1; loadSemesters(); });
    document.getElementById('semesterSearch')?.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') { state.page = 1; loadSemesters(); } 
    });
    document.getElementById('semesterStatusFilter')?.addEventListener('change', () => { state.page = 1; loadSemesters(); });
    document.getElementById('semesterForm')?.addEventListener('submit', handleFormSubmit);   

    window.addEventListener('click', (e) => {
        if (e.target.classList?.contains('modal-overlay')) {
            const id = e.target.id;
            if (id === 'semesterModal') closeModal();
        }
    });

    document.querySelectorAll('.close-modal-btn, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.getAttribute('data-modal');
            if (modal === 'semester') closeModal();
            if (modal === 'confirm') closeConfirm();
        });
    });
}

/* --- PUBLIC API & INIT --- */

const PublicAPI = {
    edit: editSemester,
    delete: deleteSemester,
    goToPage: (page) => {
        if (page < 1) return;
        state.page = page;
        loadSemesters();
    },
    goToClass: (semesterId, semesterName = '') => {
        const params = new URLSearchParams();
        params.set('semesterId', semesterId);
        params.set('semesterName', semesterName);

        if (state.courseId) {
            params.set('courseId', state.courseId);
            params.set('courseName', state.courseName);
        }

        window.location.href = `/assistant/course/semester/class?${params.toString()}`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.semesterManager = PublicAPI;
    
    const urlParams = new URLSearchParams(window.location.search);
    state.courseId = urlParams.get('courseId');
    state.courseName = urlParams.get('courseName') || '';

    if (state.courseId || state.courseName) {
        const breadcrumb = document.querySelector('.breadcrumb-nav');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <span class="breadcrumb-item">
                    <i class="fa-solid fa-book"></i> Khóa học
                </span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="breadcrumb-item active">
                    <i class="fa-solid fa-calendar-alt"></i> ${Utils.escapeHtml(state.courseName || 'Học kỳ')}
                </span>
            `;
        }
    }

    setupEventListeners();
    loadSemesters();
});