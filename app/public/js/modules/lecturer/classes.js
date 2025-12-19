document.addEventListener('DOMContentLoaded', () => {
  const classGrid = document.getElementById('classGrid');
  const semesterFilter = document.getElementById('semesterFilter');
  const statusFilter = document.getElementById('statusFilter');
  const btnRefresh = document.getElementById('btnRefresh');
  const template = document.getElementById('classCardTemplate').innerHTML;

  function renderCard(data) {
    let html = template
      .replace('{{class_name}}', data.class_name || data.class_code)
      .replace('{{course_code}}', data.course?.course_code || '')
      .replace('{{semester_name}}', data.semester?.semester_name || '')
      .replace('{{credits}}', data.course?.credits || '')
      .replace('{{lecturer_name}}', data.lecturer?.user?.full_name || '')
      .replace('{{start_date}}', data.start_date ? new Date(data.start_date).toLocaleDateString() : '')
      .replace('{{end_date}}', data.end_date ? new Date(data.end_date).toLocaleDateString() : '');

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.firstElementChild;
  }

  async function fetchClasses() {
    const params = new URLSearchParams();
    if (semesterFilter.value) params.set('semester_id', semesterFilter.value);
    if (statusFilter.value) params.set('class_status', statusFilter.value);

    try {
      const res = await fetch(`/lecturer/api/lecturer/classes?${params.toString()}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Error fetching classes');

      classGrid.innerHTML = '';
      if (!result.data || result.data.length === 0) {
        classGrid.innerHTML = '<div class="empty">Không có lớp nào</div>';
        return;
      }

      result.data.forEach(c => {
        const card = renderCard(c);
        classGrid.appendChild(card);
      });
    } catch (err) {
      console.error('Error loading classes', err);
      classGrid.innerHTML = '<div class="empty">Lỗi khi tải danh sách lớp</div>';
    }
  }

  // Simple semester loader (if server API available, please replace)
  async function loadSemesters() {
    try {
      const res = await fetch('/api/semesters');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.data) {
        data.data.forEach(s => {
          const op = document.createElement('option');
          op.value = s.semester_id;
          op.textContent = s.semester_name;
          semesterFilter.appendChild(op);
        });
      }
    } catch (e) {
      // ignore, semesters optional
    }
  }

  btnRefresh.addEventListener('click', () => fetchClasses());
  semesterFilter.addEventListener('change', fetchClasses);
  statusFilter.addEventListener('change', fetchClasses);

  loadSemesters().then(fetchClasses);
});