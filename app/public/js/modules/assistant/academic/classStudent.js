import { AcademicService } from './api.service.js';
import * as Utils from './utils.js';
import { ConfirmModal } from '/js/components/confirm-modal.js';

const state = {
    page: 1,
    limit: 7,
    classId: null,
    classData: null,
    availableStudents: [],
    filteredStudents: [],
    selectedStudents: new Set(),
    updateCallback: null,
    currentEnrollmentId: null,
    currentStudentId: null,
    filters: {
        search: '',
        major_id: null,
        admission_year: null
    },
    studentSearch: '',
    enrollmentTypeFilter: '',
    enrollmentStatusFilter: ''
};

/* --- DATA LOADING --- */

async function loadClassInfo() {
    try {
        const res = await AcademicService.getClassById(state.classId);
        
        if (res && res.data) {
            state.classData = res.data;
            displayClassInfo(res.data);
        }
    } catch (err) {
        console.error('Error loading class info:', err);
    }
}

function displayClassInfo(classData) {
    document.getElementById('classInfoName').textContent = 
        classData.class_name || classData.class_code;
    
    document.getElementById('classInfoCourse').textContent = 
        `${classData.course?.course_code || ''} - ${classData.course?.course_name || ''}`;
    
    document.getElementById('classInfoSemester').textContent = 
        classData.semester?.semester_name || '';
    
    document.getElementById('classInfoLecturer').textContent = 
        classData.lecturer?.name || classData.lecturer?.user?.full_name || '';
    
    document.getElementById('currentEnrollment').textContent = 
        classData.enrollment?.current || 0;
    
    document.getElementById('maxCapacity').textContent = 
        classData.enrollment?.max || 0;

    document.getElementById('currentClassBreadcrumb').textContent = 
        `${classData.class_name || classData.class_code}`;
}

async function loadClassStudents() {
    Utils.showLoading('studentsTableBody', 9);
    
    try {
        const res = await AcademicService.getClassStudents(state.classId);
        
        if (res && res.data) {
            // Apply filters
            let filteredData = res.data;
            
            // Search filter
            if (state.studentSearch) {
                const searchLower = state.studentSearch.toLowerCase();
                filteredData = filteredData.filter(enrollment => {
                    const student = enrollment.student || {};
                    const studentCode = (student.student_code || '').toLowerCase();
                    const fullName = (student.full_name || student.name || '').toLowerCase();
                    const email = (student.email || '').toLowerCase();
                    return studentCode.includes(searchLower) || 
                           fullName.includes(searchLower) || 
                           email.includes(searchLower);
                });
            }
            
            // Enrollment type filter
            if (state.enrollmentTypeFilter) {
                filteredData = filteredData.filter(enrollment => 
                    enrollment.enrollment_type === state.enrollmentTypeFilter
                );
            }
            
            // Enrollment status filter
            if (state.enrollmentStatusFilter) {
                filteredData = filteredData.filter(enrollment => 
                    enrollment.enrollment_status === state.enrollmentStatusFilter
                );
            }
            
            document.getElementById('studentsTableBody').innerHTML = 
                renderStudentsTable(filteredData);
        } else {
            document.getElementById('studentsTableBody').innerHTML = 
                '<tr><td colspan="9" class="text-center">Không có học sinh</td></tr>';
        }
    } catch (err) {
        console.error('Error loading students:', err);
        Utils.showError('studentsTableBody', err.message || 'Không thể tải danh sách', 9);
    }
}

async function loadAvailableStudents() {
    const listContainer = document.getElementById('availableStudentsList');
    listContainer.innerHTML = '<div class="empty-message"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>';
    
    try {
        const params = {
            search: state.filters.search || '',
            major_id: state.filters.major_id || '',
            admission_year: state.filters.admission_year || '',
            class_id: state.classId
        };

        Object.keys(params).forEach(key => {
            if (!params[key]) delete params[key];
        });

        const res = await AcademicService.getAvailableStudents(params);
        
        if (res && res.data) {
            state.availableStudents = res.data;
            state.filteredStudents = res.data;
            renderAvailableStudents(res.data);
        } else {
            listContainer.innerHTML = '<div class="empty-message">Không có sinh viên khả dụng</div>';
        }
    } catch (err) {
        console.error('Error loading available students:', err);
        listContainer.innerHTML = '<div class="empty-message" style="color: red;">Lỗi tải dữ liệu: ' + 
            Utils.escapeHtml(err.message || 'Unknown error') + '</div>';
    }
}

async function loadMajorsForFilter() {
    try {
        const res = await AcademicService.getMajors();
        
        if (res && res.data) {
            const select = document.getElementById('majorFilter');
            select.innerHTML = '<option value="">Tất cả</option>' +
                res.data.map(m => 
                    `<option value="${m.major_id}">${Utils.escapeHtml(m.major_name)}</option>`
                ).join('');
        }
    } catch (err) {
        console.error('Error loading majors:', err);
    }
}

async function loadAdmissionYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 10; i++) {
        years.push(currentYear - i);
    }

    const select = document.getElementById('admissionYearFilter');
    select.innerHTML = '<option value="">Tất cả</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join('');
}

/* --- RENDER --- */

function renderStudentsTable(students) {
    if (!students || students.length === 0) {
        return '<tr><td colspan="10" class="text-center">Không có học sinh</td></tr>';
    }

    return students.map((enrollment, index) => {
        const student = enrollment.student || {};
        const user_id = student.user_id || enrollment.student_id;
        const student_code = student.student_code || '';
        const full_name = student.full_name || student.name || '';
        const email = student.email || '';
        const major_name = student.major?.major_name || '';
        const admission_year = student.admission_year || '';
        
        const enrollDate = enrollment.enrollment_date 
            ? new Date(enrollment.enrollment_date).toLocaleDateString('vi-VN')
            : '-';
        
        const enrollStatus = enrollment.enrollment_status || 'enrolled';
        const enrollType = enrollment.enrollment_type || 'regular';
        const safeEnrollType = enrollType.replace(/'/g, "\\'");
        const safeEnrollStatus = enrollStatus.replace(/'/g, "\\'");
        const stt = (state.page - 1) * state.limit + index + 1;
        
        return `
            <tr>
                <td class="text-center">${stt}</td>
                <td><span class="code-badge">${Utils.escapeHtml(student_code)}</span></td>
                <td class="fw-bold">${Utils.escapeHtml(full_name)}</td>
                <td>${Utils.escapeHtml(email)}</td>
                <td>${Utils.escapeHtml(major_name)}</td>
                <td class="text-center">${admission_year || '-'}</td>
                <td>${getEnrollmentTypeBadge(enrollType)}</td>
                <td>${getEnrollmentStatusBadge(enrollStatus)}</td>
                <td>${enrollDate}</td>
                <td class="text-center">
                    <div class="action-buttons">
                        <button type="button" class="btn-icon btn-update" 
                                onclick="window.classStudentsManager.updateEnrollment(${enrollment.enrollment_id}, ${user_id}, '${safeEnrollType}', '${safeEnrollStatus}')" 
                                title="Cập nhật đăng ký">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-icon btn-delete" 
                                onclick="window.classStudentsManager.removeStudent(${enrollment.enrollment_id}, ${user_id})" 
                                title="Xóa khỏi lớp">
                            <i class="fa-solid fa-user-minus"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderAvailableStudents(students) {
    const container = document.getElementById('availableStudentsList');
    document.getElementById('availableCount').textContent = students.length;

    if (!students || students.length === 0) {
        container.innerHTML = '<div class="empty-message">Không có sinh viên khả dụng</div>';
        return;
    }

    container.innerHTML = students.map(student => {
        const user_id = student.user_id;
        if (!user_id) {
            console.error('Student missing user_id:', student);
            return '';
        }
        
        const isSelected = state.selectedStudents.has(user_id);
        const student_code = student.student_code || '';
        const name = student.full_name || student.name || '';
        const major_name = student.major?.major_name || '';
        const admission_year = student.admission_year || '';
        const email = student.email || '';
        
        return `
            <div class="student-item">
                <label class="student-checkbox">
                    <input type="checkbox" 
                           class="student-select-cb"
                           value="${user_id}" 
                           data-student-id="${user_id}"
                           ${isSelected ? 'checked' : ''}>
                    <div class="student-info">
                        <div class="student-name">
                            ${Utils.escapeHtml(name)}
                        </div>
                        <div class="student-details">
                            <span class="code-badge">${Utils.escapeHtml(student_code)}</span>
                            ${major_name ? `<span class="student-major">${Utils.escapeHtml(major_name)}</span>` : ''}
                            ${admission_year ? `<span class="student-year">K${admission_year}</span>` : ''}
                            ${email ? `<span class="student-detail-item"><i class="fa-solid fa-envelope"></i> ${Utils.escapeHtml(email)}</span>` : ''}
                        </div>
                    </div>
                </label>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.student-select-cb').forEach(cb => {
        cb.addEventListener('change', handleStudentSelection);
    });

    updateSelectedCount();
}

function getEnrollmentTypeBadge(type) {
    const map = {
        'regular': '<span class="enrollment-type-badge enrollment-type-regular">Thông thường</span>',
        'retake': '<span class="enrollment-type-badge enrollment-type-retake">Học lại</span>',
        'improve': '<span class="enrollment-type-badge enrollment-type-improve">Cải thiện</span>'
    };
    return map[type] || Utils.escapeHtml(type || 'regular');
}

function getEnrollmentStatusBadge(status) {
    const map = {
        'enrolled': '<span class="enrollment-status-badge enrollment-status-enrolled">Đang học</span>',
        'dropped': '<span class="enrollment-status-badge enrollment-status-dropped">Đã rút</span>',
        'completed': '<span class="enrollment-status-badge enrollment-status-completed">Hoàn thành</span>'
    };
    return map[status] || Utils.escapeHtml(status || 'enrolled');
}

/* --- STUDENT SELECTION --- */

function handleStudentSelection(e) {
    const studentIdStr = e.target.value;
    const studentId = parseInt(studentIdStr);
    
    if (!studentId || isNaN(studentId)) {
        console.error('Invalid student ID:', studentIdStr);
        return;
    }
    
    if (e.target.checked) {
        state.selectedStudents.add(studentId);
    } else {
        state.selectedStudents.delete(studentId);
    }

    updateSelectedCount();
    updateSelectAllCheckbox();
}

function updateSelectedCount() {
    const count = state.selectedStudents.size;
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('selectedCountBtn').textContent = count;
}

function updateSelectAllCheckbox() {
    const selectAllCb = document.getElementById('selectAllStudents');
    const totalAvailable = state.filteredStudents.length;
    const selectedCount = state.selectedStudents.size;

    if (totalAvailable === 0) {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = false;
    } else if (selectedCount === totalAvailable) {
        selectAllCb.checked = true;
        selectAllCb.indeterminate = false;
    } else if (selectedCount > 0) {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = true;
    } else {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = false;
    }
}

function handleSelectAll(e) {
    const checked = e.target.checked;
    
    if (checked) {
        state.filteredStudents.forEach(s => {
            if (s.user_id) {
                state.selectedStudents.add(s.user_id);
            }
        });
    } else {
        state.selectedStudents.clear();
    }

    renderAvailableStudents(state.filteredStudents);
}

/* --- MODAL --- */

async function openAddStudentsModal() {
    document.getElementById('addStudentsModal').style.display = 'flex';
    
    state.selectedStudents.clear();
    updateSelectedCount();
    
    await Promise.all([
        loadMajorsForFilter(),
        loadAdmissionYears(),
        loadAvailableStudents()
    ]);
}

function openUpdateEnrollmentModal(enrollmentId, studentId, currentType, currentStatus) {
    state.currentEnrollmentId = enrollmentId;
    state.currentStudentId = studentId;
    
    // Set values
    const typeSelect = document.getElementById('updateEnrollmentType');
    const statusSelect = document.getElementById('updateEnrollmentStatus');
    
    if (typeSelect) {
        typeSelect.value = currentType || 'regular';
    }
    
    if (statusSelect) {
        statusSelect.value = currentStatus || 'enrolled';
    }
    
    document.getElementById('updateEnrollmentModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(`${modalId}Modal`).style.display = 'none';
    
    if (modalId === 'addStudents') {
        state.selectedStudents.clear();
        state.filters = { search: '', major_id: null, admission_year: null };
        document.getElementById('availableStudentSearch').value = '';
        document.getElementById('majorFilter').value = '';
        document.getElementById('admissionYearFilter').value = '';
    }
    
    if (modalId === 'updateEnrollment') {
        state.currentEnrollmentId = null;
        state.currentStudentId = null;
    }
}

/* --- CRUD OPERATIONS --- */

async function handleAddStudents(e) {
    e.preventDefault();

    if (state.selectedStudents.size === 0) {
        window.showToast('error', 'Vui lòng chọn ít nhất 1 sinh viên!');
        return;
    }

    const enrollmentType = document.getElementById('enrollmentTypeSelect').value;
    const studentIds = Array.from(state.selectedStudents);

    const validIds = studentIds.filter(id => !isNaN(id) && id > 0);
    if (validIds.length === 0) {
        window.showToast('error', 'Không có ID học sinh hợp lệ để thêm!');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn?.innerHTML;
    
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang thêm...';
        }

        const res = await AcademicService.addStudentsToClass(state.classId, {
            student_ids: validIds,
            enrollment_type: enrollmentType
        });

        if (res && res.success) {
            const successCount = res.data?.success?.length || 0;
            const failCount = res.data?.failed?.length || 0;
            
            let message = `Đã thêm ${successCount} học sinh thành công`;
            let type = 'success';

            if (failCount > 0) {
                message += `. Thất bại: ${failCount}`;
                if(successCount === 0) type = 'error';
                else type = 'warning';
            }
            
            window.showToast(type, message);
            
            if (successCount > 0) {
                closeModal('addStudents');
                await Promise.all([
                    loadClassInfo(),
                    loadClassStudents()
                ]);
            }
        } else {
            window.showToast('error', res.message || 'Có lỗi xảy ra khi thêm sinh viên!');
        }
        
    } catch (err) {
        console.error('Error adding students:', err);
        window.showToast('error', 'Lỗi hệ thống: ' + (err.message || err));
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

async function handleUpdateEnrollment(e) {
    e.preventDefault();

    const newType = document.getElementById('updateEnrollmentType').value;
    const newStatus = document.getElementById('updateEnrollmentStatus').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn?.innerHTML;
    
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...';
        }

        const payload = {
            enrollment_type: newType,
            enrollment_status: newStatus
        };

        const res = await AcademicService.updateEnrollmentType(
            state.classId, 
            state.currentStudentId, 
            payload
        );

        if (res && res.success) {
            window.showToast('success', 'Cập nhật thành công!');
            closeModal('updateEnrollment');
            
            await Promise.all([
                loadClassInfo(),
                loadClassStudents()
            ]);
        } else {
            window.showToast('error', res.message || 'Cập nhật thất bại!');
        }
        
    } catch (err) {
        console.error('Error updating enrollment:', err);
        window.showToast('error', 'Lỗi hệ thống: ' + (err.message || err));
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

function removeStudent(enrollmentId, studentId) {
    if (!studentId || isNaN(studentId)) {
        window.showToast('error', 'ID học sinh không hợp lệ');
        return;
    }
    
    ConfirmModal.show(
        'Bạn có chắc chắn muốn xóa học sinh khỏi lớp?',
        async () => {
            try {
                const res = await AcademicService.removeStudentFromClass(state.classId, studentId);
                
                if (res && res.success) {
                    window.showToast('success', 'Đã xóa học sinh thành công');
                    await Promise.all([
                        loadClassInfo(),
                        loadClassStudents()
                    ]);
                } else {
                    window.showToast('error', res?.message || 'Lỗi khi xóa học sinh');
                }
            } catch (err) {
                console.error('Error removing student:', err);
                window.showToast('error', 'Lỗi mạng: ' + (err.message || 'Không thể kết nối server'));
            }
        },
        'Xóa', 'Xóa Học sinh'
    );
}

function goBack() {
    window.history.back();
}

/* --- SEARCH & FILTER --- */

function handleStudentSearch() {
    state.studentSearch = document.getElementById('studentSearch').value.trim();
    state.enrollmentTypeFilter = document.getElementById('enrollmentTypeFilter')?.value || '';
    state.enrollmentStatusFilter = document.getElementById('enrollmentStatusFilter')?.value || '';
    loadClassStudents();
}

function handleAvailableStudentsSearch() {
    state.filters.search = document.getElementById('availableStudentSearch').value.trim();
    state.filters.major_id = document.getElementById('majorFilter').value || null;
    state.filters.admission_year = document.getElementById('admissionYearFilter').value || null;

    loadAvailableStudents();
}

/* --- EVENT LISTENERS --- */

function setupEventListeners() {
    document.getElementById('addStudentsBtn')?.addEventListener('click', openAddStudentsModal);
    document.getElementById('searchStudentBtn')?.addEventListener('click', handleStudentSearch);
    document.getElementById('searchAvailableStudentsBtn')?.addEventListener('click', handleAvailableStudentsSearch);
    
    document.getElementById('studentSearch')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleStudentSearch();
        }
    });
    
    document.getElementById('enrollmentTypeFilter')?.addEventListener('change', handleStudentSearch);
    document.getElementById('enrollmentStatusFilter')?.addEventListener('change', handleStudentSearch);
    
    document.getElementById('availableStudentSearch')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAvailableStudentsSearch();
        }
    });

    document.getElementById('majorFilter')?.addEventListener('change', handleAvailableStudentsSearch);
    document.getElementById('admissionYearFilter')?.addEventListener('change', handleAvailableStudentsSearch);

    document.getElementById('selectAllStudents')?.addEventListener('change', handleSelectAll);
    document.getElementById('addStudentsForm')?.addEventListener('submit', handleAddStudents);
    document.getElementById('updateEnrollmentForm')?.addEventListener('submit', handleUpdateEnrollment);

    document.getElementById('backBtn')?.addEventListener('click', goBack);

    window.addEventListener('click', (e) => {
        if (e.target.classList?.contains('modal-overlay')) {
            const id = e.target.id;
            if (id === 'addStudentsModal') closeModal('addStudents');
            if (id === 'updateEnrollmentModal') closeModal('updateEnrollment');
            if (id === 'confirmModal') closeConfirm();
        }
    });

    document.querySelectorAll('.close-modal-btn, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.getAttribute('data-modal');
            if (modal === 'addStudents') closeModal('addStudents');
            if (modal === 'updateEnrollment') closeModal('updateEnrollment');
            if (modal === 'confirm') closeConfirm();
        });
    });
}

/* --- INIT --- */

function init() {
    const urlParams = new URLSearchParams(window.location.search);
    state.classId = urlParams.get('classId');

    if (!state.classId || isNaN(state.classId)) {
        if (window.showToast) {
            window.showToast('error', 'Không tìm thấy thông tin lớp học hợp lệ. Đang chuyển hướng...');
            setTimeout(() => {
                window.location.href = '/assistant/course/semester/class';
            }, 2000);
        } else {
            alert('Không tìm thấy thông tin lớp học hợp lệ');
            window.location.href = '/assistant/course/semester/class';
        }
        return;
    }

    state.classId = parseInt(state.classId);

    loadClassInfo();
    loadClassStudents();
    setupEventListeners();
}

/* --- PUBLIC API & EXPORT --- */

const PublicAPI = {
    removeStudent,
    updateEnrollment: openUpdateEnrollmentModal
};

window.classStudentsManager = PublicAPI;

document.addEventListener('DOMContentLoaded', () => {
    init();
});