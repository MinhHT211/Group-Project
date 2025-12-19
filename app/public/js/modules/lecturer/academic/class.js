import * as Utils from './utils.js';

const API_BASE = '/lecturer/api';

const state = {
    page: 1,
    limit: 6,
    courseId: null,
    courseName: '',
    semesterId: null,
    semesterName: '',
    isHeadLecturer: false
};

/* --- API SERVICE --- */
const AcademicService = {
    getClasses: async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/classes?${query}`);
        return res.json();
    },
    
    getCourseById: async (courseId) => {
        try {
            const res = await fetch(`${API_BASE}/courses/${courseId}`);
            return res.json();
        } catch (e) {
            console.error('Error fetching course:', e);
            return null;
        }
    },
    
    getSemesterById: async (semesterId) => {
        try {
            const res = await fetch(`${API_BASE}/semesters/${semesterId}`);
            return res.json();
        } catch (e) {
            console.error('Error fetching semester:', e);
            return null;
        }
    },
    
    getLecturersForSelect: async () => {
        try {
            const res = await fetch(`${API_BASE}/lecturers?limit=1000&is_active=true`);
            return res.json();
        } catch (e) {
            console.error('Error fetching lecturers:', e);
            return { data: [] };
        }
    },
    
    checkHeadLecturer: async () => {
        try {
            const res = await fetch(`${API_BASE}/check-head-lecturer`);
            return res.json();
        } catch (e) {
            console.error('Error checking head lecturer:', e);
            return { success: false, isHeadLecturer: false };
        }
    }
};

/* --- DATA LOADING --- */
async function loadClasses() {
    Utils.showLoading('classTableBody', 9);
    
    try {
        const params = {
            page: state.page,
            limit: state.limit,
            search: document.getElementById('classSearch')?.value.trim() || '',
            class_status: document.getElementById('classStatusFilter')?.value || ''
        };

        // QUAN TRỌNG: Thêm courseId và semesterId vào params
        if (state.courseId) params.course_id = parseInt(state.courseId);
        if (state.semesterId) params.semester_id = parseInt(state.semesterId);

        // Chỉ thêm lecturer filter nếu là head lecturer VÀ có chọn
        if (state.isHeadLecturer) {
            const lecturerFilter = document.getElementById('lecturerFilter')?.value;
            if (lecturerFilter) {
                params.lecturer_id = lecturerFilter;
            }
        }

        // Xóa các params null/undefined/empty
        Object.keys(params).forEach(k => {
            const v = params[k];
            if (v === null || v === undefined || v === '' || Number.isNaN(v)) {
                delete params[k];
            }
        });

        // Backend sẽ tự động filter:
        // - Regular lecturer: chỉ thấy lớp của mình
        // - Head lecturer: thấy tất cả lớp trong khoa
        const res = await AcademicService.getClasses(params);

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
    // Chỉ hiện lecturer filter cho head-lecturers
    const filterItem = document.querySelector('.lecturer-filter-item');
    
    if (!state.isHeadLecturer) {
        if (filterItem) filterItem.style.display = 'none';
        return;
    }
    
    if (filterItem) filterItem.style.display = 'block';
    
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

function updateBreadcrumb() {
    const breadcrumb = document.querySelector('.breadcrumb-nav');
    if (!breadcrumb) return;

    let html = `
        <span class="breadcrumb-item">
            <i class="fa-solid fa-book"></i> Khóa học
        </span>
    `;

    // Nếu có courseId, thêm course name
    if (state.courseId && state.courseName) {
        html += `
            <i class="fa-solid fa-chevron-right"></i>
            <span class="breadcrumb-item">
                <i class="fa-solid fa-book"></i> ${Utils.escapeHtml(state.courseName)}
            </span>
        `;
    }

    // Nếu có semesterId, thêm semester name
    if (state.semesterId && state.semesterName) {
        html += `
            <i class="fa-solid fa-chevron-right"></i>
            <span class="breadcrumb-item">
                <i class="fa-solid fa-calendar-alt"></i> ${Utils.escapeHtml(state.semesterName)}
            </span>
        `;
    }

    html += `
        <i class="fa-solid fa-chevron-right"></i>
        <span class="breadcrumb-item active">Lớp học</span>
    `;

    breadcrumb.innerHTML = html;
}

function updateContextInfo() {
    const contextInfo = document.getElementById('contextInfo');
    const contextCourse = document.getElementById('contextCourse');
    const contextSemester = document.getElementById('contextSemester');
    const contextCourseName = document.getElementById('contextCourseName');
    const contextSemesterName = document.getElementById('contextSemesterName');

    if (!contextInfo) return;

    let hasContext = false;

    if (state.courseId && state.courseName) {
        contextCourse.style.display = 'block';
        contextCourseName.textContent = state.courseName;
        hasContext = true;
    } else {
        contextCourse.style.display = 'none';
    }

    if (state.semesterId && state.semesterName) {
        contextSemester.style.display = 'block';
        contextSemesterName.textContent = state.semesterName;
        hasContext = true;
    } else {
        contextSemester.style.display = 'none';
    }

    contextInfo.style.display = hasContext ? 'block' : 'none';
}

/* --- RENDER TABLE --- */
function renderClassesTable(data) {
    if (!data || !data.length) {
        return '<tr><td colspan="10" class="text-center">Không có dữ liệu</td></tr>';
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
                            onclick="window.lecturerClassManager.viewStudents(${cls.class_id}, '${jsName}')" 
                            title="Xem học sinh">
                        <i class="fa-solid fa-users"></i>
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
                    onclick="window.lecturerClassManager.goToPage(${currentPage - 1})">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="page-info">Trang ${currentPage} / ${totalPages}</span>
            <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.lecturerClassManager.goToPage(${currentPage + 1})">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
}

/* --- EVENT LISTENERS --- */
function setupEventListeners() {
    document.getElementById('searchClassBtn')?.addEventListener('click', () => { 
        state.page = 1; 
        loadClasses(); 
    });
    
    document.getElementById('classSearch')?.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') { 
            state.page = 1; 
            loadClasses(); 
        } 
    });
    
    document.getElementById('classStatusFilter')?.addEventListener('change', () => { 
        state.page = 1; 
        loadClasses(); 
    });
    
    document.getElementById('lecturerFilter')?.addEventListener('change', () => { 
        state.page = 1; 
        loadClasses(); 
    });
}

const PublicAPI = {
    goToPage: (page) => {
        if (page < 1) return;
        state.page = page;
        loadClasses();
    },
    viewStudents: (classId, className) => {
        const params = new URLSearchParams();
        params.set('classId', classId);
        params.set('className', className);
        window.location.href = `/lecturer/course/semester/class/students?${params.toString()}`;
    }
};

/* --- INIT --- */
document.addEventListener('DOMContentLoaded', async () => {
    window.lecturerClassManager = PublicAPI;

    // ĐỌC URL PARAMS
    const urlParams = new URLSearchParams(window.location.search);
    state.courseId = urlParams.get('courseId');
    state.courseName = urlParams.get('courseName') || '';
    state.semesterId = urlParams.get('semesterId');
    state.semesterName = urlParams.get('semesterName') || '';

    // Nếu có courseId hoặc semesterId, fetch thông tin đầy đủ nếu thiếu
    if (state.courseId && !state.courseName) {
        const courseRes = await AcademicService.getCourseById(state.courseId);
        if (courseRes?.data) {
            state.courseName = courseRes.data.course_name;
        }
    }

    if (state.semesterId && !state.semesterName) {
        const semesterRes = await AcademicService.getSemesterById(state.semesterId);
        if (semesterRes?.data) {
            state.semesterName = semesterRes.data.semester_name;
        }
    }

    // Cập nhật breadcrumb và context info
    updateBreadcrumb();
    updateContextInfo();

    // Check if head lecturer
    const headCheck = await AcademicService.checkHeadLecturer();
    state.isHeadLecturer = headCheck?.isHeadLecturer || false;
    
    // Hiển thị thông báo vai trò
    const infoDiv = document.getElementById('headLecturerInfo');
    if (infoDiv) {
        infoDiv.style.display = 'block';
        if (state.isHeadLecturer) {
            infoDiv.innerHTML = `
                <div style="padding: 12px; background: #e3f2fd; border-left: 4px solid #1976d2; border-radius: 4px; margin-bottom: 15px;">
                    <i class="fa-solid fa-info-circle"></i> 
                    <strong>Bạn là Trưởng khoa</strong> - Có thể xem tất cả lớp học trong khoa
                </div>
            `;
        }
    }

    // Load lecturer filter CHỈ cho head-lecturers
    if (state.isHeadLecturer) {
        await loadLecturersForFilter();
    } else {
        // Ẩn lecturer filter cho regular lecturers
        const filterItem = document.querySelector('.lecturer-filter-item');
        if (filterItem) filterItem.style.display = 'none';
    }

    setupEventListeners();
    loadClasses();
});