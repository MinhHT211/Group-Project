document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('assistant-student-page');
  if (!root) return;

  // DOM Elements
  const tbody = root.querySelector('.student-table tbody');
  const searchInput = root.querySelector('.search-keyword-input');
  const searchBtn = root.querySelector('.search-btn-main');
  const specializationSelect = root.querySelector('.specialization-select');
  const prevBtn = root.querySelector('#prevPage');
  const nextBtn = root.querySelector('#nextPage');
  const pageInfo = root.querySelector('#pageInfo');
  const totalAllEl = root.querySelector('[data-total="all"]');

  const API_BASE = "/assistant/api/students";

  // State
  const state = {
    page: 1,
    limit: 10,
    search: "",
    major_code: "",
    totalPages: 1,
  };

  // --- Helpers ---
  const notify = (type, msg) => {
    if (window.showToast) window.showToast(type, msg);
    else alert(msg);
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toISOString().split('T')[0];
  };

  // --- Main Logic ---

  async function loadStudents() {
    try {
      if (tbody) tbody.style.opacity = '0.5';

      const params = new URLSearchParams({
        page: state.page,
        limit: state.limit,
        all_depts: 'true'
      });
      if (state.search) params.set("search", state.search);
      if (state.major_code) params.set("major_code", state.major_code);

      const res = await fetch(`${API_BASE}?${params.toString()}`, { credentials: "include" });
      
      if (!res.ok) {
        throw new Error(`Lỗi tải dữ liệu (${res.status})`);
      }

      const data = await res.json();
      
      // Update State
      const list = Array.isArray(data.data) ? data.data : [];
      state.page = data.current_page || 1;
      state.totalPages = data.total_pages || 1;
      
      renderTable(list);
      updatePagination();
      
      if (totalAllEl) {
        totalAllEl.textContent = data.total_items || data.total || list.length;
      }

    } catch (err) {
      console.error(err);
      notify('error', 'Không thể tải danh sách sinh viên: ' + err.message);
      renderTable([]); 
    } finally {
      if (tbody) tbody.style.opacity = '1';
    }
  }

  function renderTable(list) {
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="12" class="text-center py-4">Không tìm thấy dữ liệu</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((s, index) => {
      const stt = (state.page - 1) * state.limit + index + 1;
      const isDeleted = !!s.is_deleted;
      const id = s.student?.id || s.user_id || s.id;
      
      // Badge Status
      const status = (s.student?.student_status || '').toLowerCase();
      let badgeClass = 'badge-soft--gray';
      if (status === 'active') badgeClass = 'badge-soft--green';
      else if (status === 'suspended') badgeClass = 'badge-soft--amber';
      
      // Actions
      const actions = isDeleted
        ? `<button class="action-btn restore-btn" title="Khôi phục"><i class="fa-solid fa-rotate-left"></i></button>`
        : `<button class="action-btn edit-btn" title="Sửa"><i class="fa-regular fa-pen-to-square"></i></button>
           <button class="action-btn delete-btn" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>`;

      return `
        <tr data-id="${id}">
          <td class="text-center fw-bold">${stt}</td>
          <td>${s.full_name || '—'}</td>
          <td>${s.student?.student_code || '—'}</td>
          <td>${s.email || '—'}</td>
          <td>${formatDate(s.date_of_birth)}</td>
          <td>${s.gender || '—'}</td>
          <td>${s.phone || '—'}</td>
          <td>${s.student?.degree_type || '—'}</td>
          <td>${s.student?.admission_year || '—'}</td>
          <td>${s.student?.major_name || '—'}</td>
          <td><span class="badge-soft ${badgeClass}">${status || '—'}</span></td>
          <td>${actions}</td>
        </tr>
      `;
    }).join('');
  }

  function updatePagination() {
    if (pageInfo) pageInfo.textContent = `Trang ${state.page} / ${state.totalPages}`;
    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= state.totalPages;
  }

  // --- Actions: Delete / Restore ---

  async function handleAction(id, type) {
    const isDelete = type === 'delete';
    const msg = isDelete 
      ? "Bạn có chắc muốn xóa sinh viên này?" 
      : "Bạn có chắc muốn khôi phục sinh viên này?";
    
    if (!confirm(msg)) return;

    const url = isDelete ? `${API_BASE}/${id}` : `/assistant/api/student/${id}/restore`;
    const method = isDelete ? 'DELETE' : 'POST';

    try {
      const res = await fetch(url, { 
        method, 
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      
      const result = await res.json();

      if (result.success) {
        notify('success', result.message || (isDelete ? "Xóa thành công!" : "Khôi phục thành công!"));
        loadStudents();
      } else {
        notify('error', result.message || "Thao tác thất bại");
      }
    } catch (err) {
      console.error(err);
      notify('error', "Lỗi kết nối đến máy chủ");
    }
  }

  // --- Event Listeners ---

  // Create new button: navigate to create page
  const createBtn = root.querySelector('.create-new-btn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      window.location.href = '/assistant/students/create';
    });
  }

  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest(".action-btn");
      if (!btn) return;
      const row = btn.closest("tr");
      const id = row.dataset.id;
      if (!id) return;

      if (btn.classList.contains("edit-btn")) {
        window.location.href = `/assistant/students/${id}/edit`;
      } else if (btn.classList.contains("delete-btn")) {
        handleAction(id, 'delete');
      } else if (btn.classList.contains("restore-btn")) {
        handleAction(id, 'restore');
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      state.page = 1;
      state.search = searchInput ? searchInput.value.trim() : "";
      state.major_code = specializationSelect ? specializationSelect.value : "";
      loadStudents();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchBtn.click();
    });
  }

  if (prevBtn) prevBtn.onclick = () => { if (state.page > 1) { state.page--; loadStudents(); }};
  if (nextBtn) nextBtn.onclick = () => { if (state.page < state.totalPages) { state.page++; loadStudents(); }};

  // Init
  loadStudents();
});