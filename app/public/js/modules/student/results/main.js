import { ResultsService } from './api.service.js';
import { ResultsUI } from './ui.renderer.js';
import * as Utils from './utils.js';

const DOM = {
    content: document.getElementById('gradesContent'),
    summary: document.getElementById('summarySection'),
    filter: document.getElementById('semesterFilter'),
    loading: document.getElementById('loadingMsg')
};

let state = {
    allData: [],
    isLoading: false,
    studentId: window.__APP__?.currentStudentId || window.currentStudentId || document.body.dataset.currentStudentId
};

async function loadData() {
    if (state.isLoading) return;
    if (!state.studentId) {
        ResultsUI.renderEmptyState(DOM.content, 'Không tìm thấy ID sinh viên', 'fa-exclamation-triangle');
        return;
    }

    state.isLoading = true;
    Utils.showLoading(DOM.loading);
    DOM.content.innerHTML = '';

    const semesterId = DOM.filter?.value || '';

    try {
        const data = await ResultsService.getEnrollments(state.studentId, semesterId);
        
        if (!state.allData.length) state.allData = data;
        if (!semesterId) ResultsUI.populateFilter(DOM.filter, data);

        if (!data || !data.length) {
            ResultsUI.renderEmptyState(DOM.content);
            if(DOM.summary) DOM.summary.style.display = 'none';
        } else {
            const grouped = data.reduce((acc, item) => {
                const code = item.semester?.semester_code || 'unknown';
                if (!acc[code]) acc[code] = { info: item.semester || {}, courses: [] };
                acc[code].courses.push(item);
                return acc;
            }, {});

            const sortedHTML = Object.entries(grouped)
                .sort((a, b) => (b[1].info.academic_year || '').localeCompare(a[1].info.academic_year || ''))
                .map(([code, group]) => ResultsUI.renderSemesterGroup(code, group))
                .join('');

            DOM.content.innerHTML = sortedHTML;
            ResultsUI.renderStats(data, DOM.summary);
        }

    } catch (err) {
        console.error(err);
        ResultsUI.renderEmptyState(DOM.content, err.message || 'Lỗi tải dữ liệu', 'fa-bug');
    } finally {
        state.isLoading = false;
        Utils.hideLoading(DOM.loading);
    }
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    if (DOM.filter) DOM.filter.addEventListener('change', loadData);

    const tabContainer = document.getElementById('study_result_content');
    if (tabContainer) {
        if (tabContainer.classList.contains('active')) {
            loadData();
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && tabContainer.classList.contains('active')) {
                    loadData();
                }
            });
        });
        observer.observe(tabContainer, { attributes: true });
    } else {
        loadData();
    }
    
    window.loadGrades = loadData;
});