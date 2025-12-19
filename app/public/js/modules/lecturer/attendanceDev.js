// attendanceDev.js
(function(){ 
    // 1. Parse Config
    let config = {};
    try {
        const node = document.getElementById('attendance-config');
        if (node) {
            config = JSON.parse(node.textContent || '{}');
        }
    } catch (e) {
        console.warn('Failed to parse config', e);
    }

    // Normalize user ID
    if (config.currentUserId) config.currentUserId = Number(config.currentUserId);

    // 2. Helper: Toast Notification (Giống grades.js / studentmanage.js)
    const notify = (type, msg) => {
        if (window.showToast) {
            window.showToast(type, msg);
        } else {
            // Fallback nếu chưa load thư viện toast
            if (type === 'error') alert('Lỗi: ' + msg);
            else if (type === 'success') console.log('Success:', msg); // Success ko cần alert gây phiền
            else alert(msg);
        }
    };

    // 3. Styling Logic
    const STYLE_MAP = {
    'present': { bg: 'bg-green-50', text: 'text-green-700' }, // CSS mới đã override lại các class này để đẹp hơn
    'absent': { bg: 'bg-red-50', text: 'text-red-700' },
    'late': { bg: 'bg-orange-50', text: 'text-orange-700' },
    'excused': { bg: 'bg-blue-50', text: 'text-blue-700' }
};

    function updateSelectStyle(sel) {
    // Reset classes cũ
    const allClasses = [];
    Object.values(STYLE_MAP).forEach(s => allClasses.push(s.bg, s.text));
    sel.classList.remove(...allClasses);
    
    // Add classes mới
    const val = sel.value;
    const style = STYLE_MAP[val] || STYLE_MAP['present'];
    sel.classList.add(style.bg, style.text);

    // [New] Thêm animation nhỏ "pop"
    sel.style.transform = 'scale(0.95)';
    setTimeout(() => {
        sel.style.transform = 'scale(1)';
    }, 100);
}

    // Đánh dấu có thay đổi chưa lưu
    function markUnsaved() {
        const indicator = document.getElementById('unsaved-changes-indicator');
        if (indicator) indicator.classList.remove('hidden');
    }

    // 4. Load Session Data
    function loadSession(sessionNumber) {
        const url = new URL(`${config.apiBaseUrl}/${config.classId}/students/attendance`, window.location.origin);
        if (sessionNumber) url.searchParams.set('sessionNumber', sessionNumber);
        
        // UI Loading effect cho bảng
        const tableContainer = document.querySelector('.table-container');
        if(tableContainer) tableContainer.style.opacity = '0.5';

        fetch(url.toString(), { 
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } 
        })
        .then(r => r.json())
        .then(data => {
            if (!data || !data.success) return;
            const enrollments = data.data || [];
            
            enrollments.forEach(enrollment => {
                const studentId = enrollment.student_id;
                const recs = enrollment.attendance_all || enrollment.attendance_records || [];
                
                // Tìm record khớp sessionNumber
                let rec = null;
                if (sessionNumber && recs.length) {
                    rec = recs.find(a => String(a.session_number) === String(sessionNumber));
                }

                // Tìm DOM elements tương ứng
                const sel = document.querySelector(`.status-select[data-student-id="${studentId}"]`);
                if (sel) {
                    const row = sel.closest('tr');
                    const noteInput = row ? row.querySelector('.note-input') : null;

                    // Update UI
                    if (rec) {
                        sel.value = rec.status || 'present';
                        sel.setAttribute('data-attendance-id', rec.attendance_id || '');
                        if(noteInput) noteInput.value = rec.notes || '';
                    } else {
                        // Reset về mặc định nếu là buổi mới hoặc chưa có dữ liệu
                        sel.value = 'present';
                        sel.setAttribute('data-attendance-id', '');
                        if(noteInput) noteInput.value = '';
                    }
                    updateSelectStyle(sel);
                }
            });
        })
        .catch(err => {
            console.error('Error loading session:', err);
            notify('error', 'Không thể tải dữ liệu buổi học này.');
        })
        .finally(() => {
            if(tableContainer) tableContainer.style.opacity = '1';
        });
    }

    // 5. Main Event Listeners
    document.addEventListener('DOMContentLoaded', function(){
        // Init styles cho tất cả select box
        const selects = document.querySelectorAll('.status-select');
        selects.forEach(s => {
            updateSelectStyle(s);
            s.addEventListener('change', () => {
                updateSelectStyle(s);
                markUnsaved();
            });
        });

        // Track changes on notes
        const noteInputs = document.querySelectorAll('.note-input');
        noteInputs.forEach(inp => {
            inp.addEventListener('input', markUnsaved);
        });

        // Handle Session Dropdown Change
        const sessionSelect = document.getElementById('sessionSelect');
        if (sessionSelect) {
            sessionSelect.addEventListener('change', function(){
                const val = sessionSelect.value.trim();
                config.sessionNumber = val;
                loadSession(val || null);
            });
        }

        // Handle Save Button
        const saveBtn = document.getElementById('saveAttendanceBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function(e) {
                e.preventDefault();

                if (!config.currentUserId) {
                    notify('error', 'Phiên đăng nhập không hợp lệ. Vui lòng tải lại trang.');
                    return;
                }

                // UI Loading state
                const originalContent = saveBtn.innerHTML;
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Đang lưu...';

                // Collect Data
                const attendanceUpdates = [];
                const domSelects = document.querySelectorAll('.status-select');
                
                domSelects.forEach(function(sel) {
                    const row = sel.closest('tr');
                    const noteInput = row ? row.querySelector('.note-input') : null;
                    
                    attendanceUpdates.push({
                        student_id: parseInt(sel.getAttribute('data-student-id')),
                        status: sel.value,
                        notes: noteInput ? noteInput.value.trim() : ''
                    });
                });

                if (attendanceUpdates.length === 0) {
                    notify('warning', 'Không tìm thấy dữ liệu sinh viên để lưu.');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalContent;
                    return;
                }

                // Prepare Payload
                const payload = {
                    classId: parseInt(config.classId),
                    scheduleId: config.scheduleId ? Number(config.scheduleId) : null,
                    sessionNumber: config.sessionNumber || null, 
                    attendanceUpdates: attendanceUpdates
                };

                // API Call
                fetch('/lecturer/attendance/bulk-update', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(payload)
                })
                .then(r => {
                    if (!r.ok) throw new Error(`Lỗi server (${r.status})`);
                    return r.json();
                })
                .then(data => {
                    if (data.success) {
                        // Success UI
                        saveBtn.classList.remove('bg-primary', 'hover:bg-blue-700');
                        saveBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                        saveBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Đã lưu!';
                        
                        // Hide unsaved indicator
                        const indicator = document.getElementById('unsaved-changes-indicator');
                        if (indicator) indicator.classList.add('hidden');

                        // Show Toast Success
                        notify('success', 'Lưu điểm danh thành công!');

                        // Reload logic
                        setTimeout(() => {
                            if (!config.sessionNumber && data.session_number) {
                                // Nếu vừa tạo buổi mới (sessionNumber cũ là null), reload kèm session mới
                                const url = new URL(window.location.href);
                                url.searchParams.set('sessionNumber', data.session_number);
                                window.location.href = url.toString();
                            } else {
                                window.location.reload();
                            }
                        }, 1000);
                    } else {
                        throw new Error(data.message || 'Lỗi không xác định từ server');
                    }
                })
                .catch(err => {
                    console.error('Save error:', err);
                    notify('error', err.message || 'Không thể lưu điểm danh. Vui lòng thử lại.');
                    
                    // Reset button
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalContent;
                });
            });
        }
    });
})();