import { DepartmentService } from './api.service.js';
import { DepartmentUI } from './ui.renderer.js';
import * as Utils from './utils.js';
import { ConfirmModal } from '/js/components/confirm-modal.js';

const state = {
    department: { page: 1, limit: 8 },
    major: { page: 1, limit: 8 },
    selectedDepartmentId: null,
    selectedDepartmentName: null,
    editingId: null,
};

/* --- Data Loading --- */

async function loadDepartments() {
    Utils.showLoading('departmentTableBody');
    try {
        const params = {
            page: state.department.page,
            limit: state.department.limit,
            search: document.getElementById('departmentSearch')?.value.trim() || '',
            is_active: document.getElementById('departmentStatusFilter')?.value || ''
        };
        if (params.is_active === '') delete params.is_active;

        const res = await DepartmentService.getDepartments(params);

        if (res && res.data) {
            document.getElementById('totalDepartments').textContent = res.total || 0;
            document.getElementById('departmentTableBody').innerHTML = DepartmentUI.renderDepartmentsTable(
                res.data, 
                state.department.page, 
                state.department.limit
            );
            document.getElementById('pagination-department').innerHTML = DepartmentUI.renderPagination('department', res.total_pages, res.current_page);

            // Highlight selected row if any
            markSelectedDepartmentRow();
        } else {
            document.getElementById('departmentTableBody').innerHTML = '<tr><td colspan="10" class="text-center">Không có dữ liệu</td></tr>';
        }
    } catch (err) {
        console.error('loadDepartments error', err);
        Utils.showError('departmentTableBody', err.message);
    }
}

async function loadMajors() {
    if (!state.selectedDepartmentId) return;
    Utils.showLoading('majorTableBody', 8);

    try {
        const params = {
            page: state.major.page,
            limit: state.major.limit,
            department_id: state.selectedDepartmentId,
            is_active: document.getElementById('majorStatusFilter')?.value || '',
            degree_type: document.getElementById('majorDegreeFilter')?.value || ''
        };
        if (params.is_active === '') delete params.is_active;
        if (params.degree_type === '') delete params.degree_type;

        const res = await DepartmentService.getMajors(params);

        if (res && res.data) {
            document.getElementById('totalMajors').textContent = res.total || 0;
            document.getElementById('majorTableBody').innerHTML = DepartmentUI.renderMajorsTable(
                res.data, 
                state.major.page, 
                state.major.limit
            );
            document.getElementById('pagination-major').innerHTML = DepartmentUI.renderPagination('major', res.total_pages, res.current_page);
        } else {
            document.getElementById('majorTableBody').innerHTML = '<tr><td colspan="8" class="text-center">Không có dữ liệu</td></tr>';
        }
    } catch (err) {
        console.error('loadMajors error', err);
        Utils.showError('majorTableBody', err.message, 8);
    }
}

/* --- Selection & Tabs --- */

function markSelectedDepartmentRow() {
    document.querySelectorAll('.department-row.selected').forEach(r => r.classList.remove('selected'));
    if (!state.selectedDepartmentId) return;
    const el = document.getElementById(`dept-row-${state.selectedDepartmentId}`);
    if (el) el.classList.add('selected');
}

function selectDepartment(deptId, deptName) {
    state.selectedDepartmentId = deptId;
    state.selectedDepartmentName = deptName;
    state.major.page = 1;

    const selNameEl = document.getElementById('selectedDepartmentName');
    if (selNameEl) selNameEl.textContent = deptName;

    const filterSection = document.getElementById('departmentFilterSection');
    if (filterSection) filterSection.style.display = 'none';

    document.getElementById('addDepartmentBtn').style.display = 'none';
    document.getElementById('addMajorBtn').style.display = 'flex';

    const deptTab = document.getElementById('departmentTab');
    const majorTab = document.getElementById('majorTab');

    majorTab.style.display = 'block'; 
    majorTab.classList.add('active'); 
    deptTab.classList.remove('active');

    document.getElementById('tab-department').style.display = 'none';
    document.getElementById('tab-major').style.display = 'block';

    markSelectedDepartmentRow();
    loadMajors();
}

function backToDepartments() {
    state.selectedDepartmentId = null;
    state.selectedDepartmentName = null;

    const filterSection = document.getElementById('departmentFilterSection');
    if (filterSection) filterSection.style.display = 'block';

    document.getElementById('addDepartmentBtn').style.display = 'flex';
    document.getElementById('addMajorBtn').style.display = 'none';

    const deptTab = document.getElementById('departmentTab');
    const majorTab = document.getElementById('majorTab');

    majorTab.style.display = 'none';
    majorTab.classList.remove('active');
    deptTab.classList.add('active');

    document.getElementById('tab-department').style.display = 'block';
    document.getElementById('tab-major').style.display = 'none';

    const majorBody = document.getElementById('majorTableBody');
    if (majorBody) majorBody.innerHTML = '<tr><td colspan="8" class="text-center">Chọn khoa để xem chuyên ngành</td></tr>';

    document.querySelectorAll('.department-row.selected').forEach(r => r.classList.remove('selected'));
}

function switchToDepartmentTab() {
    if (state.selectedDepartmentId) backToDepartments();
}

/* --- Modals & CRUD --- */

async function openModal(type, mode, data = null) {
    const modal = document.getElementById(`${type}Modal`);
    const form = document.getElementById(`${type}Form`);
    const title = document.getElementById(`${type}ModalTitle`);

    if (!modal || !form) return;

    form.reset();
    state.editingId = data ? (type === 'department' ? data.department_id : data.major_id) : null;

    if (type === 'department') {
        title.textContent = mode === 'edit' ? 'Cập nhật khoa' : 'Thêm khoa';
        try {
            const raw = await DepartmentService.getLecturersForSelect();
            // Normalize into { user_id, lecturer_code, full_name }
            const lecturers = (Array.isArray(raw) ? raw : (raw.data || raw || [])).map(item => {
                const user_id = item.user_id ?? item.id ?? item.user?.user_id ?? item.user?.id ?? item.lecturer?.user_id ?? item.lecturer?.userId;
                const lecturer_code = item.lecturer_code ?? item.lecturer?.lecturer_code ?? item.lecturer?.code ?? item.code ?? item.user?.lecturer_code ?? item.user?.code ?? '';
                const full_name = item.full_name ?? item.name ?? (item.user ? `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() : '') ?? '';
                return { user_id, lecturer_code, full_name };
            });

            const selectEl = document.getElementById('head_lecturer_id');
            if (selectEl) selectEl.innerHTML = DepartmentUI.renderLecturerOptions(lecturers);
        } catch (err) {
            console.error('Error loading lecturers for select', err);
            const selectEl = document.getElementById('head_lecturer_id');
            if (selectEl) selectEl.innerHTML = '<option value="">-- Select Head-lecturer --</option>';
        }
    } else {
        title.textContent = mode === 'edit' ? 'Cập nhật khoa' : 'Thêm khoa';
    }

    if (data) {
        DepartmentUI.fillForm(type, data);
    }

    modal.style.display = 'flex';
}

function closeModal(type) {
    const modal = document.getElementById(`${type}Modal`);
    if (modal) modal.style.display = 'none';
    state.editingId = null;
    state.deleteCallback = null;
}

async function editDepartment(deptId) {
    try {
        const res = await DepartmentService.getDepartmentById(deptId);
        if (res && res.data) {
            openModal('department', 'edit', res.data);
        } else if (res && res.department_id) {
            openModal('department', 'edit', res);
        }
    } catch (e) {
        window.showToast('error', 'Lỗi dữ liệu!');
    }
}

async function editMajor(majorId) {
    try {
        const res = await DepartmentService.getMajorById(majorId);
        if (res && res.data) openModal('major', 'edit', res.data);
        else if (res && res.major_id) openModal('major', 'edit', res);
    } catch (e) {
        alert('Lỗi Server: ' + e.message);
    }
}

function showConfirm(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    state.deleteCallback = callback;
    document.getElementById('confirmModal').style.display = 'flex';
}

function deleteDepartment(deptId) {
    ConfirmModal.show(
        'Bạn có chắc chắn muốn xóa khoa này?',
        async () => {
            try {
                const res = await DepartmentService.deleteDepartment(deptId);
                if (res && res.success) {
                    window.showToast('success', 'Xóa khoa thành công!');
                    loadDepartments();
                    if (state.selectedDepartmentId === deptId) backToDepartments();
                } else {
                    window.showToast('error', res.message || 'Xóa khoa thất bại!');
                }
            } catch (e) {
                window.showToast('error', 'Lỗi Server: ' + e.message);
            }
        },
        'Xóa',
        'Xóa Khoa'
    );
}

function deleteMajor(majorId) {
    ConfirmModal.show(
        'Bạn có chắc chắn muốn xóa chuyên ngành này?',
        async () => {
            try {
                const res = await DepartmentService.deleteMajor(majorId);
                if (res && res.success) {
                    window.showToast('success', 'Xóa chuyên ngành thành công');
                    loadMajors();
                } else {
                    window.showToast('error', res.message || 'Xóa chuyên ngành thất bại!');
                }
            } catch (e) {
                window.showToast('error', 'Lỗi Server: ' + e.message);
            }
        }
    );
}

async function handleFormSubmit(e, type) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.btn-save');
    const oldText = btn?.innerHTML;
    if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Xử lý...'; btn.disabled = true; }

    try {
        const formData = new FormData(form);
        let body = null;

        if (type === 'department') {
            body = {
                department_code: formData.get('department_code'),
                department_name: formData.get('department_name'),
                description: formData.get('description') || null,
                phone: formData.get('phone') || null,
                email: formData.get('email') || null,
                location: formData.get('location') || null,
                head_lecturer_id: formData.get('head_lecturer_id') ? parseInt(formData.get('head_lecturer_id')) : null,
                is_active: formData.get('is_active') === 'true'
            };
        } else {
            body = {
                major_code: formData.get('major_code'),
                major_name: formData.get('major_name'),
                degree_type: formData.get('degree_type'),
                required_credits: parseInt(formData.get('required_credits')) || 0,
                duration_years: parseFloat(formData.get('duration_years')) || 0,
                description: formData.get('description') || null,
                is_active: formData.get('is_active') === 'true',
                department_id: state.selectedDepartmentId
            };
        }

        let res;
        if (state.editingId) {
            res = type === 'department'
                ? await DepartmentService.updateDepartment(state.editingId, body)
                : await DepartmentService.updateMajor(state.editingId, body);
        } else {
            res = type === 'department'
                ? await DepartmentService.createDepartment(body)
                : await DepartmentService.createMajor(body);
        }

        if (res && res.success) {
            window.showToast('success', 'Thành công!');
            closeModal(type);
            if (type === 'department') loadDepartments(); else loadMajors();
        } else {
            window.showToast('error', res.message || 'Thao tác thất bại!');
        }
    } catch (err) {
        console.error(e);
        window.showToast('error', 'Lỗi hệ thống: ' + (e.message || e));
    } finally {
        if (btn) { btn.innerHTML = oldText; btn.disabled = false; }
    }
}

/* --- Event wiring --- */

function setupEventListeners() {
    document.getElementById('addDepartmentBtn')?.addEventListener('click', () => openModal('department', 'add'));
    document.getElementById('searchDepartmentBtn')?.addEventListener('click', () => { state.department.page = 1; loadDepartments(); });
    document.getElementById('departmentSearch')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { state.department.page = 1; loadDepartments(); } });
    document.getElementById('departmentStatusFilter')?.addEventListener('change', () => { state.department.page = 1; loadDepartments(); });

    document.getElementById('departmentTab')?.addEventListener('click', switchToDepartmentTab);

    document.getElementById('addMajorBtn')?.addEventListener('click', () => openModal('major', 'add'));
    document.getElementById('majorStatusFilter')?.addEventListener('change', () => { if (state.selectedDepartmentId) { state.major.page = 1; loadMajors(); } });
    document.getElementById('majorDegreeFilter')?.addEventListener('change', () => { if (state.selectedDepartmentId) { state.major.page = 1; loadMajors(); } });

    document.getElementById('departmentForm')?.addEventListener('submit', (e) => handleFormSubmit(e, 'department'));
    document.getElementById('majorForm')?.addEventListener('submit', (e) => handleFormSubmit(e, 'major'));

    // Close modals when clicking overlay
    window.addEventListener('click', (e) => {
        if (e.target.classList?.contains('modal-overlay')) {
            const id = e.target.id.replace('Modal', '');
            if (id === 'confirm') closeModal('confirm'); else closeModal(id);
        }
    });

    // Buttons that use data-modal attribute
    document.querySelectorAll('.close-modal-btn, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.getAttribute('data-modal');
            if (modal) closeModal(modal);
        });
    });

    document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
        if (state.deleteCallback) state.deleteCallback();
    });
}

/* --- Public API --- */

const PublicAPI = {
    selectDepartment,
    editDepartment,
    deleteDepartment,
    editMajor,
    deleteMajor,
    goTo: (type, page) => {
        if (page < 1) return;
        state[type].page = page;
        if (type === 'department') loadDepartments(); else loadMajors();
    },
    openModal,
    closeModal,
    switchTab: switchToDepartmentTab,
    backToDepartments,
    performDepartmentSearch: () => { state.department.page = 1; loadDepartments(); }
};

/* --- Init --- */

document.addEventListener('DOMContentLoaded', () => {
    window.departmentManager = PublicAPI;
    setupEventListeners();
    loadDepartments();
});