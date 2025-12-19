import * as Utils from './utils.js';

const API_BASE = '/lecturer/api';

const state = {
    page: 1,
    limit: 10,
    isHeadLecturer: false
};

/* --- API SERVICE --- */
const AcademicService = {
    getCourses: async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/courses?${query}`);
        return res.json();
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
                            onclick="window.lecturerCourseManager.goToSemester(${course.course_id}, '${jsName}')" 
                            title="Xem học kỳ">
                        <i class="fa-solid fa-calendar-alt"></i>
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
                    onclick="window.lecturerCourseManager.goToPage(${currentPage - 1})">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="page-info">Trang ${currentPage} / ${totalPages}</span>
            <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.lecturerCourseManager.goToPage(${currentPage + 1})">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
}

/* --- EVENT LISTENERS --- */
function setupEventListeners() {
    document.getElementById('searchCourseBtn')?.addEventListener('click', () => { 
        state.page = 1; 
        loadCourses(); 
    });
    
    document.getElementById('courseSearch')?.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') { 
            state.page = 1; 
            loadCourses(); 
        } 
    });
    
    document.getElementById('courseTypeFilter')?.addEventListener('change', () => { 
        state.page = 1; 
        loadCourses(); 
    });
    
    document.getElementById('courseStatusFilter')?.addEventListener('change', () => { 
        state.page = 1; 
        loadCourses(); 
    });
}

/* --- PUBLIC API --- */
const PublicAPI = {
    goToPage: (page) => {
        if (page < 1) return;
        state.page = page;
        loadCourses();
    },
    goToSemester: (courseId, courseName = '') => {
        window.location.href = `/lecturer/course/semester?courseId=${courseId}&courseName=${encodeURIComponent(courseName)}`;
    }
};

/* --- INIT --- */
document.addEventListener('DOMContentLoaded', async () => {
    window.lecturerCourseManager = PublicAPI;
    
    // Check if head lecturer
    const headCheck = await AcademicService.checkHeadLecturer();
    state.isHeadLecturer = headCheck?.isHeadLecturer || false;

    const pageHeader = document.querySelector('.page-header-block');
    if (pageHeader) {
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'margin-bottom: 15px;';
        
        if (state.isHeadLecturer) {
            infoDiv.innerHTML = `
                <div style="padding: 12px; background: #e3f2fd; border-left: 4px solid #1976d2; border-radius: 4px;">
                    <i class="fa-solid fa-info-circle"></i> 
                    <strong>Bạn là Trưởng khoa</strong> - Có thể xem tất cả khóa học trong khoa
                </div>
            `;
        }
        
        pageHeader.parentNode.insertBefore(infoDiv, pageHeader.nextSibling);
    }
    
    setupEventListeners();
    loadCourses();
});