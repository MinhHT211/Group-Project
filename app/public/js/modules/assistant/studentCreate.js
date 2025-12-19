document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('create-student-form');
  if (!form) return;

  const API_BASE = '/assistant/api/students';
  const submitBtn = form.querySelector('button[type="submit"]');

  // --- Helpers ---
  const notify = (type, msg) => {
    if (window.showToast) window.showToast(type, msg);
    else alert(type === 'error' ? `Lỗi: ${msg}` : msg);
  };

  const normalizePhone = (raw) => {
    if (!raw) return raw;
    let s = raw.trim().replace(/\s+/g, '');
    if (s.startsWith('84')) s = '+' + s;
    if (s.startsWith('0')) return s;
    return s;
  };

  // --- Load Majors ---
  async function loadMajors() {
    const majorSelect = form.elements['major_name'];
    const majorIdHidden = form.elements['major_id'];
    const degreeInput = form.elements['degree_type'];
    const deptInput = document.getElementById('current-department-id');
    const departmentId = deptInput ? deptInput.value : null;

    if (!departmentId || !majorSelect) return;

    try {
      const res = await fetch(`/assistant/api/department/${departmentId}/majors`, { credentials: 'include' });
      const json = await res.json();
      
      if (!json.success && !Array.isArray(json.data)) {
        console.warn("Không tải được danh sách ngành");
        return;
      }

      const list = json.data || [];
      majorSelect.innerHTML = '<option value="">-- Chọn chuyên ngành --</option>';

      list.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.major_id;
        opt.textContent = `${m.major_code} — ${m.major_name}`;
        opt.dataset.degree = m.degree_type || '';
        majorSelect.appendChild(opt);
      });

      majorSelect.addEventListener('change', () => {
        const selected = majorSelect.selectedOptions[0];
        if (majorIdHidden) majorIdHidden.value = selected ? selected.value : '';
        if (degreeInput) degreeInput.value = selected ? selected.dataset.degree : '';
      });

    } catch (err) {
      console.error("Lỗi load major:", err);
    }
  }
  loadMajors();

  // --- Validation ---
  function validate() {
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }

    const email = form.elements['email'].value.trim();
    if (!email.endsWith('.edu.vn')) {
      notify('error', 'Email phải kết thúc bằng .edu.vn');
      return false;
    }

    const adYear = Number(form.elements['admission_year']?.value);
    const gradYear = Number(form.elements['expected_graduation_year']?.value);

    if (adYear && gradYear && gradYear < adYear) {
      notify('error', 'Năm tốt nghiệp dự kiến phải lớn hơn hoặc bằng năm nhập học');
      return false;
    }

    if (!form.elements['major_id']?.value && !form.elements['major_name']?.value) {
      notify('error', 'Vui lòng chọn chuyên ngành');
      return false;
    }

    return true;
  }

  // --- Submit Handler ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // UI Loading
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Đang tạo...';

    // Build Payload
    const fd = new FormData(form);
    const payload = {
      userData: {
        username: fd.get('username')?.trim(),
        password: fd.get('password')?.trim(),
        first_name: fd.get('first_name')?.trim(),
        last_name: fd.get('last_name')?.trim(),
        email: fd.get('email')?.trim(),
        phone: normalizePhone(fd.get('phone')),
        date_of_birth: fd.get('date_of_birth'),
        gender: fd.get('gender')
      },
      studentData: {
        student_code: fd.get('student_code')?.trim(),
        major_id: Number(fd.get('major_id') || fd.get('major_name')),
        admission_year: Number(fd.get('admission_year')) || null,
        expected_graduation_year: Number(fd.get('expected_graduation_year')) || null,
        Duration_year: Number(fd.get('Duration_year')) || 4
      }
    };

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (result.success) {
        notify('success', 'Tạo sinh viên thành công!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        console.error("Server Error:", result);
        notify('error', result.message || 'Tạo thất bại do lỗi dữ liệu');
      }

    } catch (err) {
      console.error(err);
      notify('error', 'Lỗi kết nối đến máy chủ');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
});