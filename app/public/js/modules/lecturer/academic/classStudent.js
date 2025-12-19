import * as Utils from './utils.js';

const API_BASE = '/lecturer/api';

const state = {
    classId: null,
    classData: null,
    gradeWeights: {},
    studentSearch: '',
    enrollmentTypeFilter: '',
    enrollmentStatusFilter: ''
};

/* --- API SERVICE --- */
const AcademicService = {
    getClassById: async (id) => {
        const res = await fetch(`${API_BASE}/classes/${id}`);
        return res.json();
    },
    
    getClassStudents: async (classId) => {
        const res = await fetch(`${API_BASE}/classes/${classId}/students`);
        return res.json();
    },
    
    getGradeWeights: async (classId) => {
        try {
            const res = await fetch(`/lecturer/api/grade-weights/${classId}`);
            return res.json();
        } catch (e) {
            console.error('Error fetching grade weights:', e);
            return {
                attendance: 0,
                mini: 0,
                assignment: 0,
                lab: 0,
                midterm: 0,
                final: 0
            };
        }
    }
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

async function loadGradeWeights() {
    try {
        const weights = await AcademicService.getGradeWeights(state.classId);
        state.gradeWeights = weights || {
            attendance: 0,
            mini: 0,
            assignment: 0,
            lab: 0,
            midterm: 0,
            final: 0
        };
    } catch (err) {
        console.error('Error loading grade weights:', err);
        state.gradeWeights = {
            attendance: 0,
            mini: 0,
            assignment: 0,
            lab: 0,
            midterm: 0,
            final: 0
        };
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
    const tbody = document.getElementById('studentsTableBody');
    const thead = document.getElementById('studentsTableHead');
    
    // Show loading
    Utils.showLoading('studentsTableBody', 15);
    
    try {
        // Load students
        const res = await AcademicService.getClassStudents(state.classId);
        
        if (!res || !res.data) {
            tbody.innerHTML = '<tr><td colspan="15" class="text-center">Không có học sinh</td></tr>';
            return;
        }

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
        
        // Render table with grades
        renderTableHeaders(thead);
        tbody.innerHTML = renderStudentsTable(filteredData);
        
    } catch (err) {
        console.error('Error loading students:', err);
        Utils.showError('studentsTableBody', err.message || 'Không thể tải danh sách', 15);
    }
}

/* --- RENDER --- */
function renderTableHeaders(thead) {
    const weights = state.gradeWeights;
    
    let html = `
        <tr>
            <th style="width: 50px;">STT</th>
            <th style="width: 100px;">MSSV</th>
            <th style="width: 200px;">Họ và tên</th>
            <th style="width: 250px;">Email</th>
            <th style="width: 150px;">Chuyên ngành</th>
            <th style="width: 100px;" class="text-center">Năm nhập học</th>
            <th style="width: 100px;" class="text-center">Chuyên cần</th>
    `;
    
    if (weights.mini > 0) {
        html += `<th style="width: 100px;" class="text-center">Mini Test</th>`;
    }
    
    if (weights.assignment > 0) {
        html += `<th style="width: 100px;" class="text-center">Assignment</th>`;
    }
    
    if (weights.lab > 0) {
        html += `<th style="width: 100px;" class="text-center">Lab Work</th>`;
    }
    
    if (weights.midterm > 0) {
        html += `<th style="width: 100px;" class="text-center">Giữa kỳ</th>`;
    }
    
    if (weights.final > 0) {
        html += `<th style="width: 100px;" class="text-center">Cuối kỳ</th>`;
    }
    
    html += `
            <th style="width: 100px;" class="text-center">Trung bình</th>
            <th style="width: 80px;" class="text-center">Điểm chữ</th>
            <th style="width: 80px;" class="text-center">GPA</th>
            <th style="width: 120px;">Loại đăng ký</th>
            <th style="width: 120px;">Trạng thái</th>
        </tr>
    `;
    
    thead.innerHTML = html;
}

function renderStudentsTable(students) {
    if (!students || students.length === 0) {
        return '<tr><td colspan="16" class="text-center">Không có học sinh</td></tr>';
    }

    const weights = state.gradeWeights;

    return students.map((enrollment, index) => {
        const student = enrollment.student || {};
        const grades = enrollment.grades || {};
        
        const student_code = student.student_code || '';
        const full_name = student.full_name || student.name || '';
        const email = student.email || '';
        const major_name = student.major?.major_name || '';
        const admission_year = student.admission_year || '';
        
        const enrollStatus = enrollment.enrollment_status || 'enrolled';
        const enrollType = enrollment.enrollment_type || 'regular';

        // Calculate attendance score (20% of attendance_rate)
        const attendanceRate = enrollment.attendance_rate || 0;
        const attendanceScore = (attendanceRate * 0.2).toFixed(2);

        const stt = index + 1;

        let html = `
            <tr>
                <td class="text-center">${stt}</td>
                <td><span class="code-badge">${Utils.escapeHtml(student_code)}</span></td>
                <td class="fw-bold">${Utils.escapeHtml(full_name)}</td>
                <td>${Utils.escapeHtml(email)}</td>
                <td>${Utils.escapeHtml(major_name)}</td>
                <td class="text-center">${admission_year || '-'}</td>
                <td class="text-center">${attendanceScore}</td>
        `;
        
        // Dynamic grade columns
        if (weights.mini > 0) {
            html += `<td class="text-center">${grades.mini || '-'}</td>`;
        }
        
        if (weights.assignment > 0) {
            html += `<td class="text-center">${grades.assignment || '-'}</td>`;
        }
        
        if (weights.lab > 0) {
            html += `<td class="text-center">${grades.lab || '-'}</td>`;
        }
        
        if (weights.midterm > 0) {
            html += `<td class="text-center">${grades.midterm || '-'}</td>`;
        }
        
        if (weights.final > 0) {
            html += `<td class="text-center">${grades.final || '-'}</td>`;
        }
        
        html += `
                <td class="text-center fw-bold">${grades.total || '-'}</td>
                <td class="text-center fw-bold">${grades.letter || '-'}</td>
                <td class="text-center">${grades.gpa || '-'}</td>
                <td>${getEnrollmentTypeBadge(enrollType)}</td>
                <td>${getEnrollmentStatusBadge(enrollStatus)}</td>
            </tr>
        `;
        
        return html;
    }).join('');
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

/* --- SEARCH & FILTER --- */
function handleStudentSearch() {
    state.studentSearch = document.getElementById('studentSearch').value.trim();
    state.enrollmentTypeFilter = document.getElementById('enrollmentTypeFilter')?.value || '';
    state.enrollmentStatusFilter = document.getElementById('enrollmentStatusFilter')?.value || '';
    loadClassStudents();
}

/* --- EVENT LISTENERS --- */
function setupEventListeners() {
    document.getElementById('searchStudentBtn')?.addEventListener('click', handleStudentSearch);
    
    document.getElementById('studentSearch')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleStudentSearch();
        }
    });
    
    document.getElementById('enrollmentTypeFilter')?.addEventListener('change', handleStudentSearch);
    document.getElementById('enrollmentStatusFilter')?.addEventListener('change', handleStudentSearch);
}

/* --- INIT --- */
async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    state.classId = urlParams.get('classId');

    if (!state.classId || isNaN(state.classId)) {
        alert('Không tìm thấy thông tin lớp học hợp lệ');
        window.location.href = '/lecturer/course/semester/class';
        return;
    }

    state.classId = parseInt(state.classId);

    // Load data in parallel
    await Promise.all([
        loadClassInfo(),
        loadGradeWeights()
    ]);
    
    await loadClassStudents();
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});