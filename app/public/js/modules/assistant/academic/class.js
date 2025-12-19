import { AcademicService } from './api.service.js';
import * as Utils from './utils.js';
import { ConfirmModal } from '/js/components/confirm-modal.js';

const state = {
    page: 1,
    limit: 7,
    editingId: null,
    courseId: null,
    courseName: '',
    semesterId: null,
    semesterName: ''
};

/* --- DATA LOADING --- */

async function loadClasses() {
    Utils.showLoading('classTableBody', 9);
    
    try {
        const params = {
            page: state.page,
            limit: state.limit,
            search: document.getElementById('classSearch')?.value.trim() || '',
            class_status: document.getElementById('classStatusFilter')?.value || '',
            lecturer_id: document.getElementById('lecturerFilter')?.value || ''
        };

        if (state.courseId) params.course_id = parseInt(state.courseId);
        if (state.semesterId) params.semester_id = parseInt(state.semesterId);

        Object.keys(params).forEach(k => {
            const v = params[k];
            if (v === null || v === undefined || v === '' || Number.isNaN(v)) {
                delete params[k];
            }
        });

        const query = new URLSearchParams(params).toString();
        const res = await AcademicService.getClasses(query ? Object.fromEntries(new URLSearchParams(query)) : {});

        if (res && res.data) {
            const totalEl = document.getElementById('totalClasses');
            if (totalEl) totalEl.textContent = res.total || res.data.length || 0;
            
            document.getElementById('classTableBody').innerHTML = renderClassesTable(res.data);
            document.getElementById('pagination-class').innerHTML = renderPagination(res.total_pages, res.current_page);
        } else {
            document.getElementById('classTableBody').innerHTML = '<tr><td colspan="9" class="text-center">Không có dữ liệu</td></tr>';
        }
    } catch (err) {
        console.error('loadClasses error', err);
        Utils.showError('classTableBody', err.message, 9);
    }
}

async function loadLecturersForFilter() {
    try {
        const res = await AcademicService.getLecturersForSelect();
        const lecturers = Array.isArray(res) ? res : (res.data || []);
        
        const filterSelect = document.getElementById('lecturerFilter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Tất cả giảng viên</option>' +
                lecturers.map(l => {
                    const userId = l.user_id || l.id || '';
                    const code = l.lecturer_code || l.Lecturer?.lecturer_code || '';
                    const name = l.full_name || l.name || `${l.first_name || ''} ${l.last_name || ''}`.trim();
                    const label = code && name ? `${code} - ${name}` : (name || code);
                    return `<option value="${userId}">${Utils.escapeHtml(label)}</option>`;
                }).join('');
        }
    } catch (e) {
        console.error('Error loading lecturers for filter:', e);
    }
}

/* --- RENDER TABLE --- */

function renderClassesTable(data) {
    if (!data || !data.length) {
        return '<tr><td colspan="9" class="text-center">Không có dữ liệu</td></tr>';
    }

    return data.map((cls, index) => {
        const jsName = (cls.class_name || cls.class_code || '')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;'); 
            const stt = (state.page - 1) * state.limit + index + 1;

        return `
        <tr>
            <td class="text-center">${stt}</td>
            <td><span class="code-badge">${Utils.escapeHtml(cls.class_code)}</span></td>
            <td class="fw-bold" style="color: var(--primary-color)">
                ${Utils.escapeHtml(cls.class_name || cls.class_code)}
            </td>
            <td>${Utils.escapeHtml(cls.course?.course_code || '-')}</td>
            <td>${Utils.escapeHtml(cls.semester?.semester_name || '-')}</td>
            <td>${Utils.escapeHtml(cls.lecturer?.name || '-')}</td>
            <td class="text-center">
                <span class="enrollment-badge">
                    ${cls.enrollment?.current || 0}/${cls.enrollment?.max || 0}
                </span>
            </td>
            <td>${Utils.getClassTypeBadge(cls.class_type)}</td>
            <td>${Utils.getClassStatusBadge(cls.class_status)}</td>
            <td class="text-center">
                <div class="action-buttons">
                    <button type="button" class="btn-icon btn-view" 
                            onclick="window.classManager.viewStudents(${cls.class_id}, '${jsName}')" 
                            title="Quản lý học sinh">
                        <i class="fa-solid fa-users"></i>
                    </button>
                    <button type="button" class="btn-icon btn-edit" 
                            onclick="window.classManager.edit(${cls.class_id})" 
                            title="Chỉnh sửa">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="btn-icon btn-delete" 
                            onclick="window.classManager.delete(${cls.class_id})" 
                            title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderPagination(totalPages, currentPage) {
    if (!totalPages || totalPages <= 1) return '';
    return `
        <div class="pagination-controls">
            <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="window.classManager.goToPage(${currentPage - 1})">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="page-info">Trang ${currentPage} / ${totalPages}</span>
            <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.classManager.goToPage(${currentPage + 1})">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
}

/* --- MODAL HANDLING --- */

async function openModal(mode, data = null) {
    const modal = document.getElementById('classModal');
    const form = document.getElementById('classForm');
    const title = document.getElementById('classModalTitle');

    form.reset();
    state.editingId = data ? data.class_id : null;
    title.textContent = mode === 'edit' ? 'Cập nhật lớp học' : 'Thêm lớp học';

    const courseSelect = document.getElementById('class_course_id');
    const semesterSelect = document.getElementById('class_semester_id');
    
    if(courseSelect) courseSelect.disabled = false;
    if(semesterSelect) semesterSelect.disabled = false;

    // Load Dropdown Data
    try {
        const [lecturersRes, semestersRes, coursesRes] = await Promise.all([
            AcademicService.getLecturersForSelect(),
            AcademicService.getSemesters({ limit: 1000 }),
            AcademicService.getCourses({ limit: 1000 })
        ]);

        const lecturers = Array.isArray(lecturersRes) ? lecturersRes : (lecturersRes.data || []);
        document.getElementById('lecturer_id').innerHTML = '<option value="">-- Chọn --</option>' +
            lecturers.map(l => {
                const userId = l.user_id || l.id || '';
                const code = l.lecturer_code || l.Lecturer?.lecturer_code || '';
                const name = l.full_name || l.name || `${l.first_name || ''} ${l.last_name || ''}`.trim();
                const label = code && name ? `${code} - ${name}` : (name || code);
                return `<option value="${userId}">${Utils.escapeHtml(label)}</option>`;
            }).join('');

        semesterSelect.innerHTML = '<option value="">-- Chọn --</option>' +
            (semestersRes.data || []).map(s => 
                `<option value="${s.semester_id}">${Utils.escapeHtml(s.semester_name)}</option>`
            ).join('');

        courseSelect.innerHTML = '<option value="">-- Chọn --</option>' +
            (coursesRes.data || []).map(c => 
                `<option value="${c.course_id}">${Utils.escapeHtml(c.course_code)} - ${Utils.escapeHtml(c.course_name)}</option>`
            ).join('');

    } catch (e) {
        console.error('Error loading dropdowns:', e);
        if(window.showToast) window.showToast('warning', 'Không thể tải đầy đủ danh sách lựa chọn (Giảng viên/Học kỳ/Khóa học)');
    }

    // Fill Data (Edit Mode)
    try {
        if (mode === 'edit' && data) {
            document.getElementById('class_code').value = data.class_code || '';
            document.getElementById('class_name').value = data.class_name || '';
            
            const courseId = data.course?.course_id || data.course_id || '';
            const semesterId = data.semester?.semester_id || data.semester_id || '';
            const lecturerId = data.lecturer?.user_id || data.lecturer_id || '';

            document.getElementById('class_course_id').value = courseId;
            document.getElementById('class_semester_id').value = semesterId;
            document.getElementById('lecturer_id').value = lecturerId;
            
            // --- KHÓA KHÔNG CHO SỬA KHÓA HỌC VÀ HỌC KỲ KHI UPDATE ---
            if(courseSelect) courseSelect.disabled = true;
            if(semesterSelect) semesterSelect.disabled = true;

            document.getElementById('max_capacity').value = data.enrollment?.max || data.max_capacity || 50;
            document.getElementById('class_type').value = data.class_type || 'regular';
            document.getElementById('class_status').value = data.class_status || 'planning';
            
            const safeDate = (dateStr) => {
                if (!dateStr) return '';
                try {
                    return new Date(dateStr).toISOString().split('T')[0];
                } catch (err) {
                    console.warn('Invalid date:', dateStr);
                    return '';
                }
            };

            document.getElementById('start_date').value = safeDate(data.start_date);
            document.getElementById('end_date').value = safeDate(data.end_date);

            document.getElementById('syllabus_url').value = data.syllabus_url || '';
            document.getElementById('notes').value = data.notes || '';
        } else {
            // Chế độ thêm mới (ADD)
            if (state.courseId) {
                courseSelect.value = state.courseId;
                courseSelect.disabled = true;
            }
            if (state.semesterId) {
                semesterSelect.value = state.semesterId;
                semesterSelect.disabled = true;
            }
            
            document.getElementById('max_capacity').value = 50;
            document.getElementById('class_status').value = 'planning';
            document.getElementById('class_type').value = 'regular';
        }
    } catch (fillError) {
        console.error('Error filling form data:', fillError);
        window.showToast('error', 'Có lỗi khi hiển thị dữ liệu chi tiết');
        return;
    }

    modal.style.display = 'flex';
}

function closeModal(type = 'class') {
    document.getElementById(`${type}Modal`).style.display = 'none';
    if (type === 'class') state.editingId = null;
}

/* --- FORM SUBMIT (Updated to use Toast) --- */

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.btn-save');
    const oldText = btn?.innerHTML;
    if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Xử lý...'; btn.disabled = true; }

    try {
        const formData = new FormData(form);
        
        const getInt = (elementId) => {
            const el = document.getElementById(elementId);
            return (el && el.value) ? parseInt(el.value) : null;
        };

        let lecturerVal = formData.get('lecturer_id');
        if (!lecturerVal) lecturerVal = document.getElementById('lecturer_id')?.value;

        const body = {
            class_code: formData.get('class_code'),
            class_name: formData.get('class_name') || null,
            course_id: getInt('class_course_id'),
            semester_id: getInt('class_semester_id'),
            lecturer_id: lecturerVal ? parseInt(lecturerVal) : null,
            max_capacity: parseInt(formData.get('max_capacity')) || 50,
            class_type: formData.get('class_type'),
            class_status: formData.get('class_status'),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            syllabus_url: formData.get('syllabus_url') || null,
            notes: formData.get('notes') || null
        };

        if (!body.course_id) throw new Error("Vui lòng chọn Khóa học");
        if (!body.semester_id) throw new Error("Vui lòng chọn Học kỳ");
        if (!body.lecturer_id) throw new Error("Vui lòng chọn Giảng viên");

        let res;
        if (state.editingId) {
            res = await AcademicService.updateClass(state.editingId, body);
        } else {
            res = await AcademicService.createClass(body);
        }

        if (res && res.success) {
            window.showToast('success', state.editingId ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
            closeModal('class');
            loadClasses();
        } else {
            // Hiển thị lỗi chi tiết từ server
            window.showToast('error', res?.message || 'Có lỗi xảy ra từ server');
        }
    } catch (err) {
        console.error(err);
        window.showToast('error', 'Lỗi: ' + (err.message || err));
    } finally {
        if (btn) { btn.innerHTML = oldText; btn.disabled = false; }
    }
}

/* --- CRUD API (Updated to use Toast) --- */

async function editClass(id) {
    if (!id) {
        window.showToast('error', 'Lỗi: ID lớp học không hợp lệ.');
        return;
    }

    try {
        document.body.style.cursor = 'wait'; // UX: hiện con trỏ loading
        const res = await AcademicService.getClassById(id);
        document.body.style.cursor = 'default';

        let classData = null;

        if (res && res.data && (res.data.class_id || res.data.id)) {
            classData = res.data;
        } else if (res && (res.class_id || res.id)) {
            classData = res;
        } else if (res && res.result) {
            classData = res.result;
        }

        if (classData) {
            openModal('edit', classData);
        } else {
            const msg = res?.message || 'Dữ liệu không đúng cấu trúc.';
            window.showToast('error', `Không tìm thấy lớp học. ${msg}`);
        }

    } catch (e) {
        document.body.style.cursor = 'default';
        console.error('Lỗi khi gọi editClass:', e);
        
        if (e.message.includes('404')) {
            window.showToast('error', 'Lớp học này không còn tồn tại.');
            loadClasses();
        } else {
            window.showToast('error', 'Lỗi kết nối hoặc lỗi Server: ' + e.message);
        }
    }
}

function deleteClass(id) {
    ConfirmModal.show(
        'Bạn có chắc chắn muốn xóa lớp học này không?',
        async () => {
            try {
                const res = await AcademicService.deleteClass(id);
                if (res && res.success) {
                    window.showToast('success', 'Đã xóa lớp học thành công');
                    loadClasses();
                } else {
                    window.showToast('error', res?.message || 'Xóa thất bại');
                }
            } catch (e) {
                window.showToast('error', 'Lỗi mạng: ' + e.message);
            }
        },
        'Xóa', 'Xóa Lớp học'
    );
}

function viewStudents(classId, className) {
    const params = new URLSearchParams();
    params.set('classId', classId);
    params.set('className', className);
    window.location.href = `/assistant/course/semester/class/students?${params.toString()}`;
}

/* --- EVENT LISTENERS & INIT --- */

function setupEventListeners() {
    document.getElementById('addClassBtn')?.addEventListener('click', () => openModal('add'));
    document.getElementById('searchClassBtn')?.addEventListener('click', () => { state.page = 1; loadClasses(); });
    document.getElementById('classSearch')?.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') { state.page = 1; loadClasses(); } 
    });
    
    document.getElementById('classStatusFilter')?.addEventListener('change', () => { state.page = 1; loadClasses(); });
    document.getElementById('lecturerFilter')?.addEventListener('change', () => { state.page = 1; loadClasses(); });
    
    document.getElementById('classForm')?.addEventListener('submit', handleFormSubmit);
    
    window.addEventListener('click', (e) => {
        if (e.target.classList?.contains('modal-overlay')) {
            const id = e.target.id;
            if (id === 'classModal') closeModal('class');
            if (id === 'confirmModal') closeConfirm();
        }
    });

    document.querySelectorAll('.close-modal-btn, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.getAttribute('data-modal');
            if (modal) closeModal(modal === 'confirm' ? null : modal);
            if (modal === 'confirm') closeConfirm();
        });
    });
}

const PublicAPI = {
    edit: editClass,
    delete: deleteClass,
    viewStudents,
    goToPage: (page) => {
        if (page < 1) return;
        state.page = page;
        loadClasses();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.classManager = PublicAPI;

    const urlParams = new URLSearchParams(window.location.search);
    state.courseId = urlParams.get('courseId');
    state.courseName = urlParams.get('courseName') || '';
    state.semesterId = urlParams.get('semesterId');
    state.semesterName = urlParams.get('semesterName') || '';

    if (state.courseId || state.semesterId) {
        const breadcrumb = document.querySelector('.breadcrumb-nav');
        if (breadcrumb) {
            let html = `<span class="breadcrumb-item"><i class="fa-solid fa-book"></i> Khóa học</span>`;
            if (state.courseName) {
                html += `<i class="fa-solid fa-chevron-right"></i><span class="breadcrumb-item"><i class="fa-solid fa-calendar-alt"></i> ${Utils.escapeHtml(state.courseName)}</span>`;
            }
            if (state.semesterName) {
                html += `<i class="fa-solid fa-chevron-right"></i><span class="breadcrumb-item active"><i class="fa-solid fa-chalkboard"></i> ${Utils.escapeHtml(state.semesterName)}</span>`;
            } else {
                html += `<i class="fa-solid fa-chevron-right"></i><span class="breadcrumb-item active">Lớp học</span>`;
            }
            breadcrumb.innerHTML = html;
        }
    }

    setupEventListeners();
    loadLecturersForFilter();
    loadClasses();
});