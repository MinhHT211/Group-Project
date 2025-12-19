import { StaffService } from './api.service.js';
import { StaffUI } from './ui.renderer.js';
import * as Utils from './utils.js';
import { ConfirmModal } from '/js/components/confirm-modal.js';

// State Management
const state = {
    lecturer: { page: 1, limit: 8 },
    assistant: { page: 1, limit: 8 },
    activeTab: 'lecturer'
};

// --- DATA LOADING ---
async function loadData(type) {
    const tableBodyId = `${type}TableBody`;
    Utils.showLoading(tableBodyId);

    const searchVal = document.getElementById('globalSearch')?.value.trim();
    const statusVal = document.getElementById('staffStatusFilter')?.value;

    const params = {
        page: state[type].page,
        limit: state[type].limit,
        search: searchVal || '',
    };
    if (statusVal) params.is_active = statusVal;

    try {
        let response;
        if (type === 'lecturer') response = await StaffService.getLecturers(params);
        else response = await StaffService.getAssistants(params);

        const data = response.data || [];
        const total = response.total || 0;
        const totalPages = response.total_pages || 1;
        const currentPage = response.current_page || 1;

        // Update UI
        const totalEl = document.getElementById(`total${type === 'lecturer' ? 'Lecturers' : 'Assistants'}`);
        if (totalEl) totalEl.innerText = total;

        const tbody = document.getElementById(tableBodyId);
        if (type === 'lecturer') {
            tbody.innerHTML = StaffUI.renderLecturersTable(data, currentPage, state[type].limit);
        } else {
            tbody.innerHTML = StaffUI.renderAssistantsTable(data, currentPage, state[type].limit);
        }

        // Pagination
        const pagDiv = document.getElementById(`pagination-${type}`);
        if (pagDiv) pagDiv.innerHTML = StaffUI.renderPagination(totalPages, currentPage, type);

    } catch (e) {
        console.error(e);
        Utils.showError(tableBodyId, e.message);
    }
}

async function loadDepartments() {
    const depts = await StaffService.getDepartments(true);
    const optionsHtml = StaffUI.renderDepartmentOptions(depts);

    ['lec_department_id', 'asst_department_id'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = optionsHtml;
    });
}

// --- MODAL & FORM HANDLING ---
function openModal(type, mode, id = null) {
    const dropdown = document.getElementById('addDropdown');
    if (dropdown) dropdown.style.display = 'none';

    setActiveTab(type);

    const modal = document.getElementById(`${type}Modal`);
    const form = document.getElementById(`${type}Form`);
    if (!modal || !form) return;

    form.reset();
    form.dataset.mode = mode;
    form.dataset.id = id || '';

    const prefix = type === 'lecturer' ? 'lec_' : 'asst_';
    const titleEl = document.getElementById(`${prefix}modalTitle`);
    const usernameInput = document.getElementById(`${prefix}username`);
    const passwordReq = document.getElementById(`${prefix}passwordRequired`);
    const passwordInput = document.getElementById(`${prefix}password`);

    if (mode === 'edit') {
        titleEl.textContent = `Cập nhật ${type === 'lecturer' ? 'Giảng viên' : 'Trợ lý'}`;
        if (usernameInput) usernameInput.readOnly = false;
        if (passwordReq) passwordReq.style.display = 'none';
        passwordInput.removeAttribute('required');

        (async () => {
            try {
                const res = type === 'lecturer'
                    ? await StaffService.getLecturerById(id)
                    : await StaffService.getAssistantById(id);

                if (res.success || res.data) {
                    StaffUI.fillForm(type, res.data || res);
                } else {
                    alert('Không thể tải dữ liệu: ' + (res.message || 'Lỗi không xác định'));
                }
            } catch (e) {
                alert('Lỗi tải dữ liệu: ' + e.message);
            }
        })();

    } else {
        titleEl.textContent = `Thêm mới ${type === 'lecturer' ? 'Giảng viên' : 'Trợ lý'}`;
        if (usernameInput) {
            usernameInput.readOnly = false;
            usernameInput.classList.remove('bg-read-only');
        }
        if (passwordReq) passwordReq.style.display = 'inline';
        passwordInput.setAttribute('required', 'required');
        loadDepartments();
    }

    modal.style.display = 'flex';
}

function closeModal(type) {
    const m = document.getElementById(`${type}Modal`);
    if (m) m.style.display = 'none';
}

// --- SUBMIT LOGIC ---
async function handleFormSubmit(e, type) {
    e.preventDefault();
    const form = e.target;
    const mode = form.dataset.mode;
    const id = form.dataset.id;
    const formData = new FormData(form);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        gender: formData.get('gender'),
        date_of_birth: formData.get('date_of_birth'),
        is_active: formData.get('is_active') === 'true'
    };

    const pwd = formData.get('password');
    if (pwd && pwd.trim()) userData.password = pwd.trim();
    else if (mode === 'add') {
        window.showToast('warning', 'Phải nhập mật khẩu!');
        return;
    }

    let payload = { userData };

    if (type === 'lecturer') {
        payload.lecturerData = {
            lecturer_code: formData.get('lecturer_code'),
            department_id: formData.get('department_id'),
            academic_rank: formData.get('academic_rank'),
            degree: formData.get('degree'),
            office_room: formData.get('office_room'),
            office_hours: formData.get('office_hours'),
            bio: formData.get('bio'),
            is_active: formData.get('is_active') === 'true'
        };
    } else {
        payload.assistantData = {
            assistant_code: formData.get('assistant_code'),
            department_id: formData.get('department_id'),
            academic_rank: formData.get('academic_rank'),
            degree: formData.get('degree'),
            office_room: formData.get('office_room'),
            office_hours: formData.get('office_hours'),
            bio: formData.get('bio'),
            is_active: formData.get('is_active') === 'true'
        };
    }

    try {
        let res;
        if (mode === 'add') {
            res = type === 'lecturer'
                ? await StaffService.createLecturer(payload)
                : await StaffService.createAssistant(payload);
        } else {
            res = type === 'lecturer'
                ? await StaffService.updateLecturer(id, payload)
                : await StaffService.updateAssistant(id, payload);
        }

        if (res.success || res.user_id) {
            window.showToast('success', 'Thành công!');
            closeModal(type);
            loadData(type);
        } else {
            window.showToast('error', res.message || 'Thất bại!');
        }
    } catch (e) {
        console.error(e);
        window.showToast('error', 'Lỗi hệ thống: ' + (e.message || e));
    }
}

function setActiveTab(type) {
    state.activeTab = type;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const btnId = type === 'lecturer' ? 'lecturerTab' : 'assistantTab';
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');

    const lecPane = document.getElementById('tab-lecturer');
    const asstPane = document.getElementById('tab-assistant');
    if (lecPane) lecPane.style.display = type === 'lecturer' ? 'block' : 'none';
    if (asstPane) asstPane.style.display = type === 'assistant' ? 'block' : 'none';
}

// --- PUBLIC API ---
const PublicAPI = {
    toggleDropdown: (e) => {
        if (e) e.stopPropagation();
        const dd = document.getElementById('addDropdown');
        if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    },
    
    switchTab: (type) => {
        setActiveTab(type);
        loadData(type);
    },
    
    performSearch: () => {
        state.lecturer.page = 1;
        state.assistant.page = 1;
        loadData('lecturer');
        loadData('assistant');
    },
    openModal,

    closeModal,
    
    deleteItem: (type, id) => {
        const title = type === 'lecturer' ? 'Xóa Giảng viên' : 'Xóa Trợ lý';
        const message = `Bạn có chắc chắn muốn xóa ${type === 'lecturer' ? 'giảng viên' : 'trợ lý'} này không?`;

        ConfirmModal.show(
            message,
            async () => {
                try {
                    const res = type === 'lecturer'
                        ? await StaffService.deleteLecturer(id)
                        : await StaffService.deleteAssistant(id);

                    if (res.success || res.message === 'Deleted successfully') {
                        window.showToast('success', 'Đã xóa thành công!');
                        loadData(type);
                    } else {
                        window.showToast('error', res.message || 'Đã xóa thất bại!');
                    }
                } catch (e) {
                    console.error(e);
                    window.showToast('error', 'Lỗi hệ thống: ' + (e.message || e));
                }
            },
            'Xóa',
            title
        );
    },
    
    restoreItem: (type, id) => {
        const title = type === 'lecturer' ? 'Khôi phục Giảng viên' : 'Khôi phục Trợ lý';
        const message = `Bạn có muốn khôi phục ${type === 'lecturer' ? 'giảng viên' : 'trợ lý'} này không?`;

        ConfirmModal.show(
            message,
            async () => {
                try {
                    const res = type === 'lecturer'
                        ? await StaffService.restoreLecturer(id)
                        : await StaffService.restoreAssistant(id);

                    if (res.success) {
                        window.showToast('success', 'Đã khôi phục thành công!');
                        loadData(type);
                    } else {
                        window.showToast('error', res.message || 'Khôi phục thất bại!');
                    }
                } catch (e) {
                    console.error(e);
                    window.showToast('error', 'Lỗi hệ thống: ' + (e.message || e));
                }
            },
            'Khôi phục',
            title
        );
    },
    goTo: (type, page) => {
        if (page < 1) return;
        state[type].page = page;
        loadData(type);
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    window.staffManager = PublicAPI;

    setupEventListeners();

    loadDepartments();
    loadData('lecturer');
    loadData('assistant');
});

function setupEventListeners() {
    const lecForm = document.getElementById('lecturerForm');
    const asstForm = document.getElementById('assistantForm');
    if (lecForm) lecForm.addEventListener('submit', (e) => handleFormSubmit(e, 'lecturer'));
    if (asstForm) asstForm.addEventListener('submit', (e) => handleFormSubmit(e, 'assistant'));

    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') PublicAPI.performSearch();
        });
    }

    const statusFilter = document.getElementById('staffStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            PublicAPI.performSearch();
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
        }
        if (!e.target.closest('.dropdown-toggle') && !e.target.closest('.dropdown-menu')) {
            const dd = document.getElementById('addDropdown');
            if (dd) dd.style.display = 'none';
        }
    });
}