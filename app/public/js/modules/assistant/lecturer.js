(function() {
    let currentPage = 1;
    let totalPages = 1;
    let totalRecordsCount = 0;
    const ITEMS_PER_PAGE = 10;

    // Read assistant department id from window (injected by EJS) with simple fallbacks.
    const ASSISTANT_DEPARTMENT_ID = (function() {
        try {
            if (typeof window !== 'undefined' && window.ASSISTANT_DEPARTMENT_ID != null) {
                return String(window.ASSISTANT_DEPARTMENT_ID);
            }
        } catch (e) {}

        try {
            const hidden = document.getElementById('assistantDepartmentId');
            if (hidden && hidden.value) return String(hidden.value);
        } catch (e) {}

        try {
            const meta = document.querySelector('meta[name="assistant-department-id"]');
            if (meta) return String(meta.getAttribute('content'));
        } catch (e) {}

        return null;
    })();

    document.addEventListener('DOMContentLoaded', async function() {
        await loadLecturers(1);
        setupEventListeners();
    });

    function setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performSearch();
                }
            });
        }

        const filterStatus = document.getElementById('filterStatus');
        if (filterStatus) {
            filterStatus.addEventListener('change', function() {
                loadLecturers(1);
            });
        }
    }

    async function loadLecturers(page) {
        if (typeof page === 'number') currentPage = page;
        const tbody = document.getElementById('lecturerTableBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="11" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';
        try {
            const params = buildQueryParams();
            const url = `/assistant/api/lecturers?${params}`;
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 403) {
                    const json = await safeJson(response);
                    tbody.innerHTML = `<tr><td colspan="11" class="text-center text-red">${escapeHtml(json?.message || 'Không có quyền truy cập dữ liệu')}</td></tr>`;
                    return;
                }
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            const result = await response.json();
            totalRecordsCount = result.total || 0;
            totalPages = result.total_pages || 1;
            renderTable(result.data || []);
            renderPagination();
            updateTableInfo();
        } catch (error) {
            console.error('Lỗi tải giảng viên:', error);
            tbody.innerHTML = `<tr><td colspan="11" class="text-center text-red">Không thể tải dữ liệu: ${escapeHtml(error.message || String(error))}</td></tr>`;
        }
    }

    function safeJson(response) {
        return response.text().then(text => {
            try { return JSON.parse(text); } catch (e) { return null; }
        });
    }

    function buildQueryParams() {
        const search = document.getElementById('searchInput')?.value?.trim() || '';
        const isActive = document.getElementById('filterStatus')?.value || '';
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());
        if (search) params.set('search', search);

        // Force department filter to assistant's department when available
        if (ASSISTANT_DEPARTMENT_ID) {
            params.set('department_id', ASSISTANT_DEPARTMENT_ID);
        }

        if (isActive) params.set('is_active', isActive);
        return params;
    }

    function getStatusBadge(isActive) {
        const active = (isActive === true || isActive === 'true' || isActive === 1 || isActive === '1');
        if (active) {
            return `<span class="status-badge status-active">Đang hoạt động</span>`;
        } else {
            return `<span class="status-badge status-inactive">Ngừng hoạt động</span>`;
        }
    }

    function renderTable(data) {
        const tbody = document.getElementById('lecturerTableBody');
        if (!tbody) return;
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="12" class="text-center">Không tìm thấy giảng viên nào</td></tr>';
            return;
        }
        tbody.innerHTML = data.map((item, index) => {
            const lec = item.lecturer || {};
            const gender = item.gender || '';
            const statusHtml = getStatusBadge(item.is_active);
            const stt = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

            return `
                <tr>
                    <td class="text-center">${stt}</td>
                    <td class="fw-bold">${escapeHtml(item.full_name || (item.last_name + ' ' + item.first_name) || '')}</td>
                    <td><span class="code-badge">${escapeHtml(lec.lecturer_code || '')}</span></td>
                    <td>${escapeHtml(item.email || '')}</td>
                    <td>${escapeHtml(item.date_of_birth ? (item.date_of_birth.split('T')[0]) : '')}</td>
                    <td>${escapeHtml(gender)}</td>
                    <td>${escapeHtml(item.phone || '')}</td>
                    <td>${escapeHtml(lec.degree || '')}</td>
                    <td>${escapeHtml(lec.academic_rank || '')}</td>
                    <td>${escapeHtml(lec.department_name || '')}</td>
                    <td>${statusHtml}</td>
                    <td>${escapeHtml(lec.office_room || '')}</td>
                </tr>
            `;
        }).join('');
    }

    function renderPagination() {
        const wrapper = document.getElementById('paginationWrapper');
        const controls = document.getElementById('paginationControls');
        if (!wrapper || !controls) return;
        if (totalPages <= 1) {
            wrapper.style.display = 'none';
            return;
        }
        wrapper.style.display = 'flex';
        let html = '';
        html += `<button type="button" class="page-btn" onclick="window.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>`;
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);
        if (startPage > 1) { html += `<button type="button" class="page-btn" onclick="window.goToPage(1)">1</button>`; if (startPage > 2) html += `<span class="page-dots">...</span>`; }
        for (let i = startPage; i <= endPage; i++) {
            html += `<button type="button" class="page-btn ${i === currentPage ? 'active' : ''}" onclick="window.goToPage(${i})">${i}</button>`;
        }
        if (endPage < totalPages) { if (endPage < totalPages - 1) html += `<span class="page-dots">...</span>`; html += `<button type="button" class="page-btn" onclick="window.goToPage(${totalPages})">${totalPages}</button>`; }
        html += `<button type="button" class="page-btn" onclick="window.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>`;
        controls.innerHTML = html;
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages) return;
        loadLecturers(page);
    }

    function updateTableInfo() {
        const start = totalRecordsCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
        const end = Math.min(currentPage * ITEMS_PER_PAGE, totalRecordsCount);
        const totalRecordsEl = document.getElementById('totalRecords');
        const paginationInfoEl = document.getElementById('paginationInfo');
        if (totalRecordsEl) totalRecordsEl.textContent = `Tổng: ${totalRecordsCount} giảng viên`;
        if (paginationInfoEl) paginationInfoEl.textContent = totalRecordsCount > 0 ? `Hiển thị ${start}-${end} của ${totalRecordsCount}` : '';
    }

    function performSearch() {
        loadLecturers(1);
    }

    function escapeHtml(text) {
        if (text === 0) return '0';
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.loadLecturers = loadLecturers;
    window.goToPage = goToPage;
    window.performSearch = performSearch;

})();