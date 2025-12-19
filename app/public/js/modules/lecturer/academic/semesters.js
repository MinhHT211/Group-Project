import * as Utils from './utils.js';

const API_BASE = '/lecturer/api';

const state = {
    page: 1,
    limit: 6,
    courseId: null,
    courseName: '',
    isHeadLecturer: false
};

/* --- API SERVICE --- */
const AcademicService = {
    getSemesters: async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/semesters?${query}`);
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
async function loadSemesters() {
    Utils.showLoading('semesterTableBody', 6);

    try {
        const params = {
            page: state.page,
            limit: state.limit,
            search: document.getElementById('semesterSearch')?.value.trim() || '',
            is_active: document.getElementById('semesterStatusFilter')?.value || '',
            courseId: state.courseId || ''
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

    html += `
        <i class="fa-solid fa-chevron-right"></i>
        <span class="breadcrumb-item active">
            <i class="fa-solid fa-calendar-alt"></i> Học kỳ
        </span>
    `;

    breadcrumb.innerHTML = html;
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
                                onclick="window.lecturerSemesterManager.goToClass(${semester.semester_id}, '${jsName}')" 
                                title="Xem lớp học">
                            <i class="fa-solid fa-chalkboard-user"></i>
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
                    onclick="window.lecturerSemesterManager.goToPage(${currentPage - 1})">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="page-info">Trang ${currentPage} / ${totalPages}</span>
            <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.lecturerSemesterManager.goToPage(${currentPage + 1})">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
}

/* --- EVENT LISTENERS --- */
function setupEventListeners() {
    document.getElementById('searchSemesterBtn')?.addEventListener('click', () => { 
        state.page = 1; 
        loadSemesters(); 
    });
    
    document.getElementById('semesterSearch')?.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') { 
            state.page = 1; 
            loadSemesters(); 
        } 
    });
    
    document.getElementById('semesterStatusFilter')?.addEventListener('change', () => { 
        state.page = 1; 
        loadSemesters(); 
    });
}

/* --- PUBLIC API --- */
const PublicAPI = {
    goToPage: (page) => {
        if (page < 1) return;
        state.page = page;
        loadSemesters();
    },
    goToClass: (semesterId, semesterName = '') => {
        const params = new URLSearchParams();
        params.set('semesterId', semesterId);
        params.set('semesterName', semesterName);

        // Truyền courseId và courseName nếu có
        if (state.courseId) {
            params.set('courseId', state.courseId);
            params.set('courseName', state.courseName);
        }

        window.location.href = `/lecturer/course/semester/class?${params.toString()}`;
    }
};

/* --- INIT --- */
document.addEventListener('DOMContentLoaded', async () => {
    window.lecturerSemesterManager = PublicAPI;
    
    // ĐỌC URL PARAMS
    const urlParams = new URLSearchParams(window.location.search);
    state.courseId = urlParams.get('courseId');
    state.courseName = urlParams.get('courseName') || '';

    // Nếu có courseId nhưng không có courseName, fetch thông tin
    if (state.courseId && !state.courseName) {
        const courseRes = await AcademicService.getCourseById(state.courseId);
        if (courseRes?.data) {
            state.courseName = courseRes.data.course_name;
        }
    }

    // Cập nhật breadcrumb
    updateBreadcrumb();
    
    // Check if head lecturer
    const headCheck = await AcademicService.checkHeadLecturer();
    state.isHeadLecturer = headCheck?.isHeadLecturer || false;
    
    // Hiển thị thông báo vai trò
    const pageHeader = document.querySelector('.page-header-block');
    if (pageHeader) {
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'margin-bottom: 15px;';
        
        if (state.isHeadLecturer) {
            infoDiv.innerHTML = `
                <div style="padding: 12px; background: #e3f2fd; border-left: 4px solid #1976d2; border-radius: 4px;">
                    <i class="fa-solid fa-info-circle"></i> 
                    <strong>Bạn là Trưởng khoa</strong> - Có thể xem tất cả học kỳ và lớp học trong khoa
                </div>
            `;
        }
        
        pageHeader.parentNode.insertBefore(infoDiv, pageHeader.nextSibling);
    }

    setupEventListeners();
    loadSemesters();
});