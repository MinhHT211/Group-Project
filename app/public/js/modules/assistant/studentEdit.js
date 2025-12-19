document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('edit-student-form');
  if (!form) return;

  const API_BASE = '/assistant/api/students';
  const pathParts = window.location.pathname.split('/');
  const userId = pathParts[pathParts.length - 2];

  const STATUSES = ['active', 'suspended', 'graduated'];

  function renderStatusOptions(selectEl, current) {
    if (!selectEl) return;
    const cur = String(current || '').toLowerCase();
    selectEl.innerHTML = '';
    STATUSES.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st.charAt(0).toUpperCase() + st.slice(1);
      if (st === cur) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  // --- Helpers ---
  const notify = (type, msg) => {
    if (window.showToast) window.showToast(type, msg);
    else alert(type === 'error' ? `Lỗi: ${msg}` : msg);
  };

  const normalizePhone = (raw) => {
    if (!raw) return raw;
    let s = raw.trim().replace(/\s+/g, '');
    if (s.startsWith('84')) s = '+' + s;
    return s;
  };

  // --- Load Majors & Data ---
  async function initForm() {
    try {
      const resUser = await fetch(`${API_BASE}/${userId}`, { credentials: 'include' });
      const jsonUser = await resUser.json();
      
      if (!jsonUser.success && !jsonUser.data) {
        notify('error', 'Không tìm thấy dữ liệu sinh viên');
        return;
      }

      const s = jsonUser.data;
      const stu = s.student || {};

      const deptInput = document.getElementById('current-department-id');
      const deptId = deptInput ? deptInput.value : null;
      
      const majorSelect = form.elements['major_name'];
      
      if (deptId && majorSelect) {
        const resMajor = await fetch(`/assistant/api/department/${deptId}/majors`);
        const jsonMajor = await resMajor.json();
        
        majorSelect.innerHTML = '<option value="">-- Chọn ngành --</option>';
        (jsonMajor.data || []).forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.major_id;
          opt.textContent = `${m.major_code} — ${m.major_name}`;
          opt.dataset.degree = m.degree_type;
          if (m.major_id == stu.major_id) opt.selected = true;
          majorSelect.appendChild(opt);
        });

        // Event listener update degree type
        majorSelect.addEventListener('change', () => {
          const sel = majorSelect.selectedOptions[0];
          if (form.elements['degree_type']) form.elements['degree_type'].value = sel?.dataset.degree || '';
        });
      }

      const setVal = (name, val) => { if (form.elements[name]) form.elements[name].value = val || ''; };
      
      setVal('first_name', s.first_name);
      setVal('last_name', s.last_name);
      setVal('email', s.email);
      setVal('phone', s.phone);
      setVal('date_of_birth', s.date_of_birth ? s.date_of_birth.split('T')[0] : '');
      setVal('gender', (s.gender || '').toLowerCase());
      
      setVal('student_code', stu.student_code);
      setVal('admission_year', stu.admission_year);
      setVal('expected_graduation_year', stu.expected_graduation_year);
      setVal('Duration_year', stu.Duration_year || 4);
      setVal('student_status', stu.student_status);

      // Render status select so user can choose
      renderStatusOptions(form.elements['student_status'], stu.student_status);

    } catch (err) {
      console.error(err);
      notify('error', 'Lỗi khi tải dữ liệu ban đầu');
    }
  }

  initForm();

  // --- Submit Handler ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const email = form.elements['email'].value;
    if (!email.includes('@')) { notify('error', 'Email không hợp lệ'); return; }

    const submitBtn = form.querySelector('button[type="submit"]');
    const oldText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Đang lưu...';

    const fd = new FormData(form);
    
    const payload = {
      userData: {
        first_name: fd.get('first_name')?.trim(),
        last_name: fd.get('last_name')?.trim(),
        email: fd.get('email')?.trim(),
        phone: normalizePhone(fd.get('phone')),
        date_of_birth: fd.get('date_of_birth'),
        gender: fd.get('gender')
      },
      studentData: {
        student_code: fd.get('student_code')?.trim(),
        admission_year: Number(fd.get('admission_year')) || null,
        expected_graduation_year: Number(fd.get('expected_graduation_year')) || null,
        student_status: fd.get('student_status'),
        major_id: Number(fd.get('major_name'))
      }
    };

    try {
      const res = await fetch(`${API_BASE}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (result.success) {
        notify('success', 'Cập nhật thành công!');
        setTimeout(() => window.location.href = '/assistant/student', 1000);
      } else {
        console.error("Update failed:", result);
        notify('error', result.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại dữ liệu.');
      }
    } catch (err) {
      console.error(err);
      notify('error', 'Lỗi kết nối hệ thống');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = oldText;
    }
  });
});