const monthYearElement = document.getElementById("monthYear");
const datesElement = document.getElementById("dates");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const refreshScheduleBtn = document.getElementById("refreshScheduleBtn");
const addScheduleBtn = document.getElementById("addScheduleBtn");
const todayBtn = document.getElementById("todayBtn");
const monthPicker = document.getElementById("monthPicker");
const pickerYearDisplay = document.getElementById("pickerYearDisplay");
const pickerPrevYear = document.getElementById("pickerPrevYear");
const pickerNextYear = document.getElementById("pickerNextYear");
const monthItems = document.querySelectorAll(".month-item");
const viewMonthBtn = document.getElementById("viewMonthBtn");
const viewWeekBtn = document.getElementById("viewWeekBtn");
const monthViewContainer = document.getElementById("monthViewContainer");
const weekViewContainer = document.getElementById("weekViewContainer");
const weekHeader = document.getElementById("weekHeader");
const weekGrid = document.getElementById("weekGrid");
const mainContainer = document.querySelector('.main-container');

const selectedDateElement = document.getElementById("selectedDate");
const scheduleListElement = document.getElementById("scheduleList");

const modal = document.getElementById("scheduleModal");
const modalTitle = document.getElementById("modalTitle");
const scheduleForm = document.getElementById("scheduleForm");
const closeModalBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

const actionModal = document.getElementById("actionModal");
const actionModalTitle = document.getElementById("actionModalTitle");
const actionModalMessage = document.getElementById("actionModalMessage");
const actionThisDay = document.getElementById("actionThisDay");
const actionAllDays = document.getElementById("actionAllDays");
const closeActionModal = document.getElementById("closeActionModal");

const classSelect = document.getElementById("classSelect");
const lecturerSelect = document.getElementById("lecturerSelect");
const roomInput = document.getElementById("scheduleRoom");
const buildingInput = document.getElementById("scheduleBuilding");
const campusInput = document.getElementById("scheduleCampus");
const scheduleTypeInput = document.getElementById("scheduleType");
const startTimeInput = document.getElementById("scheduleStartTime");
const endTimeInput = document.getElementById("scheduleEndTime");
const isRecurringCheckbox = document.getElementById("isRecurring");
const recurringOptions = document.getElementById("recurringOptions");
const singleDateInfo = document.getElementById("singleDateInfo");
const selectedDateText = document.getElementById("selectedDateText");
const effectiveFromInput = document.getElementById("effectiveFrom");
const effectiveToInput = document.getElementById("effectiveTo");
const dayOfWeekSelect = document.getElementById("dayOfWeek");
const isOnlineCheckbox = document.getElementById("isOnline");
const onlineMeetingUrlInput = document.getElementById("onlineMeetingUrl");
const onlineUrlGroup = document.getElementById("onlineUrlGroup");
const notesInput = document.getElementById("scheduleNotes");
const classFilterSelect = document.getElementById("classFilterSelect");
const courseFilterSelect = document.getElementById("courseFilterSelect");

const API_ENDPOINT = "/api/schedules";

const USER_ROLE = window.USER_ROLE || 'student';
const IS_ASSISTANT = USER_ROLE === 'assistant';

let cachedClasses = [];
let currentDate = new Date();
let selectedDate = new Date();
let schedules = {};
let allSchedules = [];
let isLoadingSchedules = false;
let editingScheduleId = null;
let editingOccurrenceDate = null;
let pendingAction = null;
let pendingSchedule = null;
let pendingDateKey = null;
let cachedLecturers = [];
let pickerCurrentYear = new Date().getFullYear();
let currentView = 'month';


const switchView = async (view) => {
    currentView = view;
    
    const mainContainer = document.querySelector('.main-container');
    // Tìm thanh công cụ để toggle class
    const controlsContainer = document.querySelector('.timetable-controls'); 

    if (view === 'month') {
        // --- Month Mode ---
        viewMonthBtn.classList.add("active");
        viewWeekBtn.classList.remove("active");
        
        monthViewContainer.style.display = "block";
        weekViewContainer.style.display = "none";
        
        // Thu nhỏ Main Container & Calendar
        if (mainContainer) mainContainer.classList.remove('full-week-mode');
        // Thu nhỏ Thanh công cụ (về 1010px)
        if (controlsContainer) controlsContainer.classList.remove('full-width');

        // Reset text
        const monthYearString = currentDate.toLocaleDateString("default", { month: "long", year: "numeric" });
        monthYearElement.textContent = monthYearString;
        
        // Hiện lại bảng chi tiết
        if(document.querySelector('.schedule-detail')) {
             document.querySelector('.schedule-detail').style.display = ''; 
        }

        await refreshSchedules();
    } else {
        // --- Week mode ---
        viewWeekBtn.classList.add("active");
        viewMonthBtn.classList.remove("active");
        
        monthViewContainer.style.display = "none";
        weekViewContainer.style.display = "flex";
        
        // Mở rộng Main Container & Calendar
        if (mainContainer) mainContainer.classList.add('full-week-mode');

        // Mở rộng Thanh công cụ (về 100%)
        if (controlsContainer) controlsContainer.classList.add('full-width');
        
        renderWeekView();
    }
};

const renderWeekView = () => {

    const dayOfWeek = currentDate.getDay(); 
    const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(diff);

    // Update Header Text
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    monthYearElement.textContent = `${startOfWeek.toLocaleDateString('en-US', {month:'short', day:'numeric'})} - ${endOfWeek.toLocaleDateString('en-US', {month:'short', day:'numeric'})}, ${endOfWeek.getFullYear()}`;

    // Update Header Row
    let headerHTML = `<div class="week-day-cell empty-corner" style="border-bottom: 1px solid #e0e0e0; background: #f8f9fa;"></div>`;
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDates.push(d);
        const isToday = d.toDateString() === new Date().toDateString();
        headerHTML += `<div class="week-day-cell ${isToday ? 'today' : ''}">
            ${d.toLocaleDateString('en-US', {weekday: 'short'})} ${d.getDate()}
        </div>`;
    }
    weekHeader.innerHTML = headerHTML;

    // Render Grid Empty
    let gridHTML = '';
    for(let i=0; i<7; i++) gridHTML += `<div class="week-col"></div>`;
    weekGrid.innerHTML = gridHTML;
    const cols = weekGrid.querySelectorAll('.week-col');

    // --- LỌC DỮ LIỆU ---
    const schedulesByDayCol = Array(7).fill(null).map(() => []);

    allSchedules.forEach(sch => {
        weekDates.forEach((date, colIndex) => {
            const dateKey = getDateKey(date);
            const dayOfW = getDayOfWeekValue(date);
            
            // Logic lọc cơ bản
            if ((sch.deleted_dates || []).includes(dateKey)) return;

            let isMatch = false;
            if (sch.effective_from && sch.effective_to && sch.effective_from === sch.effective_to) {
                if (sch.effective_from === dateKey) isMatch = true;
            } else {
                if (sch.day_of_week === dayOfW && dateKey >= sch.effective_from && (!sch.effective_to || dateKey <= sch.effective_to)) {
                    isMatch = true;
                }
            }
            
            const isException = (sch.cancelled_dates || []).includes(dateKey);
            const isActive = sch.is_active ? !isException : isException;

            if (isMatch && isActive) {
                // Thêm vào danh sách vẽ
                schedulesByDayCol[colIndex].push({
                    ...sch,
                    startMinutes: parseTimeToMinutes(sch.start_time),
                    endMinutes: parseTimeToMinutes(sch.end_time)
                });
            }
        });
    });

    schedulesByDayCol.forEach((daySchedules, colIndex) => {
        // [QUAN TRỌNG] Lọc trùng lặp dữ liệu (Duplicate Data Fix)
        // Nếu có 2 lịch giống hệt nhau về Giờ + Phòng + Tên môn -> Chỉ giữ 1 cái để vẽ
        const uniqueSchedules = [];
        const seen = new Set();
        
        daySchedules.forEach(item => {
            // Tạo key duy nhất để nhận diện bản sao
            const uniqueKey = `${item.start_time}-${item.end_time}-${item.room}-${item.course_name}`;
            if (!seen.has(uniqueKey)) {
                seen.add(uniqueKey);
                uniqueSchedules.push(item);
            }
        });

        uniqueSchedules.forEach(sch => {
            
            // [HÀM PHỤ] Giải mã: NULL nghĩa là ai?
            const getRealLecturerId = (scheduleItem) => {
                // Nếu có ID cụ thể -> Dùng luôn
                if (scheduleItem.lecturer_id) return String(scheduleItem.lecturer_id);
                
                // Nếu là NULL -> Tìm giảng viên chủ nhiệm của lớp đó trong cachedClasses
                const classInfo = cachedClasses.find(c => c.class_id === scheduleItem.class_id);
                // Trả về ID chủ nhiệm, hoặc 'unknown' nếu không tìm thấy
                return classInfo ? String(classInfo.lecturer_id) : 'unknown-' + scheduleItem.class_id;
            };

            const myLecturerId = getRealLecturerId(sch);

            // LOGIC CHECK CONFLICT
            const isConflict = uniqueSchedules.some(other => {
                if (String(other.schedule_id) === String(sch.schedule_id)) return false;

                const isTimeOverlap = (sch.startMinutes < other.endMinutes && other.startMinutes < sch.endMinutes);
                if (!isTimeOverlap) return false;

                // Check Role
                const isManagerCheck = (window.USER_ROLE === 'assistant' || window.IS_HEAD_LECTURER);

                if (isManagerCheck) {
                    // Check Phòng
                    const roomA = (sch.room || "").trim().toLowerCase();
                    const roomB = (other.room || "").trim().toLowerCase();              
                    const buildingA = (sch.building || "").trim().toLowerCase();
                    const buildingB = (other.building || "").trim().toLowerCase();

                    // Chỉ coi là trùng nếu: Tên phòng giống nhau VÀ Tòa nhà giống nhau
                    const isRoomConflict = (
                        roomA !== "" && 
                        roomB !== "" && 
                        roomA === roomB && 
                        buildingA === buildingB
                    );

                    // Check Giảng viên (Dùng ID ĐÃ GIẢI MÃ để so sánh)
                    const otherLecturerId = getRealLecturerId(other);
                    
                    // So sánh 2 ID thực sự (đã quy đổi từ Null ra ID nếu cần)
                    const isLecturerConflict = (myLecturerId !== 'unknown' && otherLecturerId !== 'unknown' && myLecturerId === otherLecturerId);

                    return isRoomConflict || isLecturerConflict;

                } else {
                    return true;
                }
            });

            // TÍNH TOÁN VỊ TRÍ (HTML của bạn bắt đầu từ 00:00 -> Mốc 0)
            const START_HOUR = 5; 
            const top = (sch.startMinutes - (START_HOUR * 60)); 
            const height = sch.endMinutes - sch.startMinutes;

            if (top >= 0) {
                const div = document.createElement('div');
                div.className = `event-block ${isConflict ? 'conflict' : ''}`;
                div.style.top = `${top}px`;
                div.style.height = `${height}px`;

                const typeDisplay = sch.schedule_type 
                    ? sch.schedule_type.charAt(0).toUpperCase() + sch.schedule_type.slice(1) 
                    : '';
                
                const timeStr = `${sch.start_time.substring(0, 5)} - ${sch.end_time.substring(0, 5)}`;
                const locationStr = sch.building ? `${sch.room} - ${sch.building}` : sch.room;
                let instructorName = sch.instructor_name || "TBA";
                
                div.innerHTML = `
                    <strong>${sch.class_code || ''} - ${sch.course_name}</strong>
                    <span style="font-weight: 700; font-size: 0.65rem; text-transform: uppercase; color: var(--primary-color); display:block; margin-bottom: 2px;">${typeDisplay}</span>
                    <span><i class="fa-regular fa-clock"></i> ${timeStr}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${locationStr}</span>
                    <span style="margin-top:auto;"><i class="fa-solid fa-user"></i> ${instructorName}</span>
                `;
                
                // Tooltip debug
                div.title = `ID: ${sch.schedule_id}\n${sch.course_name}\n${timeStr}`;

                div.onclick = (e) => { 
                    e.stopPropagation(); 
                    if (window.USER_ROLE === 'assistant') {
                        // Kiểm tra: Nếu là lịch lặp (Effective From != Effective To) -> Mở Edit Only
                        const isRecurring = sch.effective_from !== sch.effective_to;
                        
                        if (isRecurring) {
                            // Lấy ngày của cột hiện tại (weekDates[colIndex])
                            const colDateKey = getDateKey(weekDates[colIndex]);
                            // Mở modal chế độ Edit Only (tham số thứ 3 là ngày cụ thể)
                            openModal(true, sch, colDateKey);
                        } else {
                            // Lịch đơn -> Sửa bình thường
                            handleEditSchedule(sch.schedule_id);
                        }
                    } 
                    else {
                        alert(`Class: ${sch.course_name}\nRoom: ${sch.room}`);
                    }
                };

                cols[colIndex].appendChild(div);
            }
        });
    });
  if (window.USER_ROLE === 'assistant') {
        cols.forEach((col, index) => {
            col.onclick = (e) => {
                // Identify the clicked date
                const clickedDate = weekDates[index];
                const dateKey = getDateKey(clickedDate);

                // Calculate time based on Y-coordinate
                const rect = col.getBoundingClientRect();
                const clickY = e.clientY - rect.top; // Click position relative to the column top
                const colHeight = rect.height;
                
                const START_HOUR = 5; 
                const MINUTES_IN_DAY = 24 * 60; 
                
                // Calculate minutes
                const clickedMinutes = (clickY / colHeight) * MINUTES_IN_DAY + (START_HOUR * 60);

                // Round to the nearest 30 minutes
                const roundedMinutes = Math.floor(clickedMinutes / 30) * 30;

                // Calculate Start Time
                const startH = Math.floor(roundedMinutes / 60);
                const startM = roundedMinutes % 60;
                
                // Calculate End Time (Default + 60 minutes)
                const endMinutesTotal = roundedMinutes + 60; 
                const endH = Math.floor(endMinutesTotal / 60);
                const endM = endMinutesTotal % 60;

                // Format Time (HH:mm)
                const formatTime = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                const startTimeStr = formatTime(startH, startM);
                const endTimeStr = formatTime(endH, endM);

                // Open Modal and Pre-fill Data
                openModal(false); // false = Add Mode

                // Pre-fill Date
                if(effectiveFromInput) effectiveFromInput.value = dateKey;
                if(effectiveToInput) effectiveToInput.value = dateKey;
                
                // Pre-fill Time
                if(startTimeInput) startTimeInput.value = startTimeStr;
                if(endTimeInput) endTimeInput.value = endTimeStr;

                // Pre-fill Day of Week
                if(dayOfWeekSelect) dayOfWeekSelect.value = getDayOfWeekValue(clickedDate);

                // Switch to Single Day mode automatically
                if(isRecurringCheckbox) {
                    isRecurringCheckbox.checked = false;
                    toggleRecurringOptions();
                    selectedDate = clickedDate;
                    updateSelectedDateInfo();
                }
            };
        });
    }
};

// [Hàm phụ] Chuyển giờ "07:30" thành số phút (450)
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const showStatusMessage = (message, icon = "fa-regular fa-calendar") => {
  scheduleListElement.innerHTML = `
    <div class="no-schedule">
      <i class="${icon}"></i>
      <p>${message}</p>
    </div>
  `;
};

const showCalendarLoading = () => {
  datesElement.innerHTML = `
    <div class="no-schedule">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Loading calendar...</p>
    </div>
  `;
};

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getSchedulesForDate = (date) => {
  const key = getDateKey(date);
  return schedules[key] || [];
};

const getDayOfWeekValue = (date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload;
};

const fetchSchedulesFromApi = async () => {
  const selectedClassId = classFilterSelect ? classFilterSelect.value : "";
  const selectedCourseCode = courseFilterSelect ? courseFilterSelect.value : "";

  const params = new URLSearchParams({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    includeInactive: "true",
    ...(selectedClassId && { classId: selectedClassId }),
    ...(selectedCourseCode && { courseCode: selectedCourseCode })
  });

  const payload = await requestJson(`${API_ENDPOINT}?${params.toString()}`);
  let data = payload.data || [];

  // --- LOGIC LỌC: "CỦA AI TRẢ VỀ NGƯỜI ĐÓ" ---
  // Áp dụng: Lecturer thường (Không phải Head, Không phải Assistant)
  if (window.USER_ROLE === 'lecturer' && !window.IS_HEAD_LECTURER && window.CURRENT_USER_ID) {
      
      const myId = String(window.CURRENT_USER_ID); 

      data = data.filter(sch => {
          let realTeacherId = null;

          // ƯU TIÊN: Kiểm tra xem có ai được chỉ định dạy thay không?
          if (sch.lecturer_id) {
              // Có người dạy cụ thể (Override) -> Người đó là giáo viên
              realTeacherId = String(sch.lecturer_id);
          } 
          // MẶC ĐỊNH: Nếu không ai dạy thay -> Lấy giáo viên chủ nhiệm
          else {
              // Tìm thông tin lớp trong cache để biết ai là chủ nhiệm
              const classInfo = cachedClasses.find(c => String(c.class_id) === String(sch.class_id));
              if (classInfo && classInfo.lecturer_id) {
                  realTeacherId = String(classInfo.lecturer_id);
              }
          }
          return (realTeacherId === myId);
      });
  }

  return data;
};

const createScheduleRequest = (payload) =>
  requestJson(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

const updateScheduleRequest = (scheduleId, payload) =>
  requestJson(`${API_ENDPOINT}/${scheduleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

const deleteScheduleRequest = (scheduleId) =>
  requestJson(`${API_ENDPOINT}/${scheduleId}`, {
    method: "DELETE"
  });

const toggleScheduleRequest = (scheduleId, isActive, cancelledDate = null) => {
  const body = {};

  if (cancelledDate) {
    body.cancelled_date = cancelledDate;
  } else if (isActive !== null && isActive !== undefined) {
    body.is_active = isActive;
  }

  return requestJson(`${API_ENDPOINT}/${scheduleId}/cancel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

const editSingleOccurrenceRequest = (scheduleId, date, payload) =>
  requestJson(`${API_ENDPOINT}/${scheduleId}/occurrence/${date}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

const deleteSingleOccurrenceRequest = (scheduleId, date) =>
  requestJson(`${API_ENDPOINT}/${scheduleId}/occurrence/${date}`, {
    method: "DELETE"
  });

const getScheduleById = (scheduleId) =>
  allSchedules.find((schedule) => schedule.schedule_id === Number(scheduleId));

const buildCalendarSchedules = () => {
  schedules = {};
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = getDayOfWeekValue(date);
    const dateKey = getDateKey(date);

    const daySchedules = allSchedules.filter((schedule) => {
      const dateStr = dateKey;

      const deletedDates = schedule.deleted_dates || [];
      if (deletedDates.includes(dateStr)) {
        return false;
      }

      const effectiveFromStr = schedule.effective_from;
      const effectiveToStr = schedule.effective_to;

      if (effectiveFromStr && effectiveToStr && effectiveFromStr === effectiveToStr) {
        return dateStr === effectiveFromStr;
      }

      if (schedule.day_of_week !== dayOfWeek) {
        return false;
      }

      if (effectiveFromStr && dateStr < effectiveFromStr) {
        return false;
      }

      if (effectiveToStr && dateStr > effectiveToStr) {
        return false;
      }

      return true;
    });

    if (daySchedules.length > 0) {
      schedules[dateKey] = daySchedules.map((schedule) => ({ ...schedule }));
    }
  }
};

if (todayBtn) {
    todayBtn.addEventListener("click", async () => {
        const now = new Date();
        // Cập nhật biến toàn cục
        currentDate = new Date(); 
        selectedDate = new Date();
        
        // Gọi hàm refresh
        await refreshSchedules();
        
        // Hiệu ứng visual: focus vào ngày hôm nay
        const todayKey = getDateKey(now);
        const dates = document.querySelectorAll(".date");
        dates.forEach(d => d.classList.remove("selected"));
        const todayEl = document.querySelector(`.date[data-date="${todayKey}"]`);
        if(todayEl) todayEl.classList.add("selected");
    });
}

if (monthYearElement) {
    monthYearElement.addEventListener("click", () => {
        // Toggle hiển thị
        const isHidden = monthPicker.style.display === "none" || !monthPicker.classList.contains("active");
        
        if (isHidden) {
            // Mở lên
            monthPicker.classList.add("active");
            monthPicker.style.display = "flex";
            
            // Sync năm hiện tại vào picker
            pickerCurrentYear = currentDate.getFullYear();
            updatePickerUI();
        } else {
            // Đóng lại
            closePicker();
        }
    });
}

const closePicker = () => {
    monthPicker.classList.remove("active");
    monthPicker.style.display = "none";
};

const updatePickerUI = () => {
    pickerYearDisplay.textContent = pickerCurrentYear;
    
    // Highlight tháng hiện tại đang xem
    const viewingMonth = currentDate.getMonth(); 
    // (Lưu ý: Nếu pickerYear khác currentYear của lịch thì không highlight tháng, hoặc highlight theo logic tùy bạn)
    
    monthItems.forEach(item => {
        item.classList.remove("selected");
        // Chỉ highlight nếu năm của picker trùng năm đang xem lịch
        if (parseInt(item.dataset.month) === viewingMonth && pickerCurrentYear === currentDate.getFullYear()) {
            item.classList.add("selected");
        }
    });
};

if (pickerPrevYear) {
    pickerPrevYear.addEventListener("click", () => {
        pickerCurrentYear--;
        updatePickerUI();
    });
}
if (pickerNextYear) {
    pickerNextYear.addEventListener("click", () => {
        pickerCurrentYear++;
        updatePickerUI();
    });
}

monthItems.forEach(item => {
    item.addEventListener("click", async () => {
        const selectedMonth = parseInt(item.dataset.month);
        
        // Cập nhật currentDate sang tháng/năm mới chọn
        // Giữ ngày là 1 để tránh lỗi ngày 31 nhảy sang tháng sau
        currentDate = new Date(pickerCurrentYear, selectedMonth, 1);
        selectedDate = new Date(pickerCurrentYear, selectedMonth, 1); // Reset selected date về đầu tháng

        closePicker();
        await refreshSchedules();
    });
});

const updateSelectedDateInfo = () => {
  if (!selectedDateText) return;

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  selectedDateText.textContent = selectedDate.toLocaleDateString("en-US", options);
};

const toggleRecurringOptions = () => {
  const isRecurring = isRecurringCheckbox.checked;
  if (isRecurring) {
    recurringOptions.style.display = "block";
    singleDateInfo.style.display = "none";
    effectiveFromInput.required = true;
    effectiveToInput.required = true;
    dayOfWeekSelect.disabled = false;
  } else {
    recurringOptions.style.display = "none";
    singleDateInfo.style.display = "flex";
    effectiveFromInput.required = false;
    effectiveToInput.required = false;
    dayOfWeekSelect.value = getDayOfWeekValue(selectedDate);
    dayOfWeekSelect.disabled = true;
    updateSelectedDateInfo();
  }
};

const toggleOnlineUrlState = () => {
  const isOnline = isOnlineCheckbox.checked;

  if (onlineUrlGroup) {
    onlineUrlGroup.style.display = isOnline ? "block" : "none";
  }
  onlineMeetingUrlInput.disabled = !isOnline;

  if (!isOnline) {
    onlineMeetingUrlInput.value = "";
  }
};

const resetForm = () => {
  scheduleForm.reset();
  scheduleTypeInput.value = "lecture";

  dayOfWeekSelect.value = getDayOfWeekValue(selectedDate);
  effectiveFromInput.value = getDateKey(selectedDate);
  effectiveToInput.value = getDateKey(selectedDate);
  notesInput.value = "";
  isRecurringCheckbox.checked = false;
  isOnlineCheckbox.checked = false;
  onlineMeetingUrlInput.disabled = true;
  updateSelectedDateInfo();
  toggleRecurringOptions();
  toggleOnlineUrlState();
};

const handleScheduleTypeChange = () => {
    const type = scheduleTypeInput.value;
    // Nếu là Lecture hoặc Exam -> Bắt buộc dùng giáo viên chính (Default)
    const isLocked = (type === 'lecture' || type === 'exam');

    if (isLocked) {
        lecturerSelect.value = ""; // Reset về default
        lecturerSelect.disabled = true;
        lecturerSelect.style.backgroundColor = "#f5f5f5"; // Xám đi
    } else {
        lecturerSelect.disabled = false;
        lecturerSelect.style.backgroundColor = "#fff";
    }
};

const handleClassChange = () => {
    const selectedOption = classSelect.options[classSelect.selectedIndex];
    const defaultLecturerId = selectedOption.getAttribute('data-default-lecturer');

    lecturerSelect.value = "";
    handleScheduleTypeChange();
};

const populateFormForEdit = (schedule, occurrenceDate = null) => {
  classSelect.value = schedule.class_id;
  roomInput.value = schedule.room || "";
  buildingInput.value = schedule.building || "";
  campusInput.value = schedule.campus || "";
  scheduleTypeInput.value = schedule.schedule_type || "lecture";
  startTimeInput.value = schedule.start_time?.substring(0, 5) || "";
  endTimeInput.value = schedule.end_time?.substring(0, 5) || "";
  notesInput.value = schedule.notes || "";
  isOnlineCheckbox.checked = Boolean(schedule.is_online);
  onlineMeetingUrlInput.value = schedule.online_meeting_url || "";
  toggleOnlineUrlState();

  if (schedule.is_substitute && schedule.lecturer_id) {
      lecturerSelect.value = schedule.lecturer_id;
  } else {
      lecturerSelect.value = ""; 
  }
  handleScheduleTypeChange();

  if (occurrenceDate) {
    isRecurringCheckbox.checked = false;
    isRecurringCheckbox.disabled = true;

    effectiveFromInput.value = occurrenceDate;
    effectiveToInput.value = occurrenceDate;

    const [y, m, d] = occurrenceDate.split("-");
    selectedDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    updateSelectedDateInfo();
  } else {
    isRecurringCheckbox.disabled = false;

    const isSingleDay = Boolean(
      schedule.effective_from && schedule.effective_to && schedule.effective_from === schedule.effective_to
    );
    isRecurringCheckbox.checked = !isSingleDay;

    effectiveFromInput.value = schedule.effective_from || "";
    effectiveToInput.value = schedule.effective_to || schedule.effective_from || "";

    if (isSingleDay) {
      const [y, m, d] = schedule.effective_from.split("-");
      selectedDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      updateSelectedDateInfo();
    }
  }

  dayOfWeekSelect.value = schedule.day_of_week;
  toggleRecurringOptions();
};

const openModal = (isEdit = false, schedule = null, occurrenceDate = null) => {
  modal.classList.add("show");

  if (isEdit && schedule) {
    modalTitle.textContent = occurrenceDate ? "Edit Single Occurrence" : "Edit Schedule";
    saveBtn.textContent = "Update";
    editingScheduleId = schedule.schedule_id;
    editingOccurrenceDate = occurrenceDate;

    populateFormForEdit(schedule, occurrenceDate);
  } else {
    modalTitle.textContent = "Add new schedule";
    saveBtn.textContent = "Save";
    editingScheduleId = null;
    editingOccurrenceDate = null;
    resetForm();
  }
};

const closeModal = () => {
  modal.classList.remove("show");
  editingScheduleId = null;
  editingOccurrenceDate = null;

  if (isRecurringCheckbox) isRecurringCheckbox.disabled = false;
};

const openActionModal = (action, schedule, dateKey) => {
  if (!actionModal) return;

  pendingAction = action;
  pendingSchedule = schedule;
  pendingDateKey = dateKey;

  const date = new Date(dateKey);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  actionThisDay.style.display = 'flex';
  actionThisDay.className = 'btn-primary';
  actionAllDays.style.width = 'auto';

  if (action === 'edit') {
    actionModalTitle.textContent = 'Edit Schedule';
    actionModalMessage.textContent = `Do you want to edit only ${dateStr}, or all occurrences of this recurring schedule?`;
    actionThisDay.innerHTML = '<i class="fa-solid fa-calendar-day"></i> Edit this day';
    actionAllDays.innerHTML = '<i class="fa-solid fa-calendar-week"></i> Edit all';

  } else if (action === 'delete') {
    actionModalTitle.textContent = 'Delete Schedule';
    actionModalMessage.textContent = `Do you want to delete only ${dateStr}, or all occurrences of this recurring schedule?`;
    actionThisDay.className = 'btn-delete';
    actionThisDay.innerHTML = '<i class="fa-solid fa-calendar-day"></i> Delete this day';
    actionAllDays.innerHTML = '<i class="fa-solid fa-calendar-week"></i> Delete all';

  } else if (action === 'cancel') {
    actionModalTitle.textContent = 'Cancel Schedule';
    actionModalMessage.textContent = `Do you want to CANCEL only ${dateStr}, or all occurrences?`;
    actionThisDay.style.background = '#FF9800';
    actionThisDay.innerHTML = '<i class="fa-solid fa-calendar-day"></i> Cancel this day';
    actionAllDays.innerHTML = '<i class="fa-solid fa-calendar-week"></i> Cancel all';
  } else if (action === 'restore') {
    actionModalTitle.textContent = 'Restore Schedule';
    actionModalMessage.textContent = `This schedule is globally inactive. Restoring will re-activate ALL occurrences.`;

    actionThisDay.style.display = 'none';

    actionAllDays.style.width = '100%';
    actionAllDays.className = 'btn-restore';
    actionAllDays.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Restore All Occurrences';
  }

  actionModal.classList.add("show");
};

const closeActionModalFn = () => {
  if (!actionModal) return;
  actionModal.classList.remove("show");
  pendingAction = null;
  pendingSchedule = null;
  pendingDateKey = null;
};

const renderClassOptions = (filterByCourseCode = null) => {
    if (classSelect) {
        const currentValue = classSelect.value;
        
        let optionsHTML = '<option value="">-- Select a class --</option>';
        cachedClasses.forEach(cls => {
             const courseName = cls.course ? cls.course.course_name : '';
             
             optionsHTML += `<option value="${cls.class_id}" data-default-lecturer="${cls.lecturer_id}">
                ${cls.class_code} - ${courseName} - ${cls.class_name}
            </option>`;
        });
        classSelect.innerHTML = optionsHTML;
        
        // Restore value
        if (currentValue) classSelect.value = currentValue;
    }

    if (classFilterSelect) {
        let filterHTML = '<option value="">All Classes</option>';
        
        const filteredList = filterByCourseCode 
            ? cachedClasses.filter(cls => cls.course && cls.course.course_code === filterByCourseCode)
            : cachedClasses;

        filteredList.forEach(cls => {
            const courseName = cls.course ? cls.course.course_name : '';
            const code = cls.class_code || '';
            const name = cls.class_name || '';
            
            filterHTML += `<option value="${cls.class_id}">
                ${code} - ${courseName} - ${name}
            </option>`;
        });
        classFilterSelect.innerHTML = filterHTML;
    }
};

const fetchClassOptions = async () => {
  if (cachedClasses.length > 0) return;

  try {
    const payload = await requestJson('/api/schedules/options/classes');
    cachedClasses = payload.data || [];

    if (courseFilterSelect) {
        const courseMap = new Map();
        const uniqueCourses = [];

        cachedClasses.forEach(cls => {
            if (cls.course && cls.course.course_code && !courseMap.has(cls.course.course_code)) {
                courseMap.set(cls.course.course_code, true);
                uniqueCourses.push({
                    code: cls.course.course_code,
                    name: cls.course.course_name
                });
            }
        });
        
        uniqueCourses.sort((a, b) => a.code.localeCompare(b.code));

        let courseHTML = '<option value="">All Courses</option>';
        uniqueCourses.forEach(c => {
            courseHTML += `<option value="${c.code}">${c.code} - ${c.name}</option>`;
        });
        courseFilterSelect.innerHTML = courseHTML;
    }

    renderClassOptions(); 

  } catch (error) {
    console.error("Failed to load classes", error);
    if (classSelect) classSelect.innerHTML = '<option value="">Error loading classes</option>';
  }
};

const fetchLecturerOptions = async () => {
    try {
        const payload = await requestJson('/api/schedules/options/lecturers');
        cachedLecturers = payload.data || [];
        
        let html = '<option value="">-- Default (Class Lecturer) --</option>';
        cachedLecturers.forEach(lec => {
          const name = lec.user ? lec.user.full_name : lec.lecturer_code;
          html += `<option value="${lec.user_id}">${name} (${lec.lecturer_code})</option>`;
        });
        if(lecturerSelect) lecturerSelect.innerHTML = html;
    } catch (e) { console.error(e); }
};

const buildPayloadFromForm = () => {
  const isRecurring = isRecurringCheckbox.checked;
  
  let finalLecturerId = lecturerSelect.value;

  if (finalLecturerId === "" || lecturerSelect.disabled) {
      finalLecturerId = null; 
  }

  const payload = {
    class_id: classSelect.value,
    lecturer_id: finalLecturerId,
    room: roomInput.value,
    building: buildingInput.value,
    campus: campusInput.value,
    schedule_type: scheduleTypeInput.value,
    start_time: startTimeInput.value,
    end_time: endTimeInput.value,
    is_online: isOnlineCheckbox.checked,
    online_meeting_url: onlineMeetingUrlInput.value,
    notes: notesInput.value,
    is_single_day: !isRecurring,
  };

  if (isRecurring) {
    payload.day_of_week = dayOfWeekSelect.value;
    payload.effective_from = effectiveFromInput.value;
    payload.effective_to = effectiveToInput.value || null;
  } else {
    payload.single_date = effectiveFromInput.value;
  }

  return payload;
};

const displayScheduleDetail = (date) => {
  selectedDate = date;
  window.CURRENT_DATE_KEY = getDateKey(date);

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  selectedDateElement.textContent = date.toLocaleDateString("en-US", options);
  updateSelectedDateInfo();

  const daySchedules = getSchedulesForDate(date);

  if (daySchedules.length === 0) {
    showStatusMessage("No schedule for this day");
    return;
  }

  const currentDateKey = getDateKey(date);
  let schedulesHTML = "";

  daySchedules.forEach((schedule) => {
    const cancelledDates = schedule.cancelled_dates || [];
    const isException = cancelledDates.includes(currentDateKey);
    const isEffectiveActive = schedule.is_active ? !isException : isException;
    const cardClass = isEffectiveActive ? "" : "cancelled";
    const degree = schedule.lecturer_degree ? `${schedule.lecturer_degree}. ` : '';
    const emailStr = schedule.lecturer_email ? ` (${schedule.lecturer_email})` : '';
    const fullName = `${degree}${schedule.instructor_name}${emailStr}`;
    const classDisplay = schedule.class_code 
        ? `${schedule.class_code} - ${schedule.course_name} - ${schedule.class_name}`
        : schedule.course_name;

    let statusBadge = "";
    if (!isEffectiveActive) {
      statusBadge = '<span class="cancelled-badge">CANCELLED</span>';
    } else if (!schedule.is_active && isException) {
      statusBadge = '<span class="restored-badge">RESTORED</span>';
    }

    const timeDisplay = `${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}`;
    const locationDisplay = schedule.building ? `${schedule.room} - ${schedule.building}` : schedule.room;

    const isOnline = schedule.is_online && schedule.online_meeting_url;
    const locationOrOnlineDisplay = isOnline ?
      `<a href="${schedule.online_meeting_url}" target="_blank" class="online-meeting-link">${schedule.online_meeting_url}</a> <span class="online-badge">ONLINE</span>` :
      locationDisplay;

    const typeLabels = {
      lecture: "Lecture",
      lab: "Lab",
      tutorial: "Tutorial",
      exam: "Exam",
      review: "Review",
    };
    const typeBadge = `<span class="type-badge">${typeLabels[schedule.schedule_type] || schedule.schedule_type}</span>`;

    const isRecurring = !(schedule.effective_from && schedule.effective_to && schedule.effective_from === schedule.effective_to);
    const recurringBadge = isRecurring ?
      '<span class="recurring-badge"><i class="fa-solid fa-repeat"></i> Recurring</span>' :
      "";

    let actionButtons = '';

    if (IS_ASSISTANT) {
      const myDeptId = window.MY_DEPT_ID;
      const scheduleDeptId = schedule.department_id;
      const canEdit = myDeptId && scheduleDeptId && (Number(myDeptId) === Number(scheduleDeptId));
      if (canEdit) {
        if (isRecurring) {
          actionButtons = `
            <button class="btn-edit" onclick="handleEditRecurring(${schedule.schedule_id}, '${currentDateKey}')">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            
            <button class="${isEffectiveActive ? 'btn-cancel-schedule' : 'btn-restore'}" 
                    onclick="handleCancelRecurring(${schedule.schedule_id}, '${currentDateKey}')">
              ${isEffectiveActive 
                ? '<i class="fa-solid fa-ban"></i> Cancel' 
                : '<i class="fa-solid fa-rotate-left"></i> Restore'}
            </button>
            
            <button class="btn-delete" onclick="handleDeleteRecurring(${schedule.schedule_id}, '${currentDateKey}')">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          `;
        } else {
          actionButtons = `
            <button class="btn-edit" onclick="handleEditSchedule(${schedule.schedule_id})">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="${schedule.is_active ? 'btn-cancel-schedule' : 'btn-restore'}" 
                    onclick="handleToggleSchedule(${schedule.schedule_id})">
              ${schedule.is_active 
                ? '<i class="fa-solid fa-ban"></i> Cancel' 
                : '<i class="fa-solid fa-rotate-left"></i> Restore'}
            </button>
            <button class="btn-delete" onclick="handleDeleteSchedule(${schedule.schedule_id})">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          `;
        }
      }
    }

    schedulesHTML += `
      <div class="schedule-card ${cardClass}">
          <h4>${classDisplay}${typeBadge}${recurringBadge}${statusBadge}</h4>
          <div class="schedule-info">
              <div class="info-item">
                  <i class="fa-regular fa-clock"></i>
                  <span>${timeDisplay}</span>
              </div>
              <div class="info-item">
                  <i class="fa-solid fa-location-dot"></i>
                  <span>${locationOrOnlineDisplay}</span>
              </div>
              <div class="info-item">
                  <i class="fa-solid fa-user"></i>
                  <span>${fullName}</span>
              </div>
              
              ${schedule.notes ? `
              <div class="info-item">
                  <i class="fa-regular fa-note-sticky" style="margin-top: 3px;"></i>
                  <span>${schedule.notes}</span>
              </div>
              ` : ""}

              ${isRecurring ? `
              <div class="info-item date-range-info">
                  <i class="fa-solid fa-calendar-days"></i>
                  <span>${schedule.effective_from} --> ${schedule.effective_to}</span>
              </div>
              ` : ""}
          </div>
          ${actionButtons ? `<div class="schedule-actions">${actionButtons}</div>` : ''}
      </div>
    `;
  });

  scheduleListElement.innerHTML = schedulesHTML;
};

const updateCalendar = () => {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const firstDay = new Date(currentYear, currentMonth, 0);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = lastDay.getDate();
  const firstDayIndex = firstDay.getDay();
  const lastDayIndex = lastDay.getDay();

  const monthYearString = currentDate.toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });
  monthYearElement.textContent = monthYearString;

  buildCalendarSchedules();

  let datesHTML = "";

  for (let i = firstDayIndex; i > 0; i -= 1) {
    const prevDate = new Date(currentYear, currentMonth, 0 - i + 1);
    datesHTML += `<div class="date inactive">${prevDate.getDate()}</div>`;
  }

  for (let i = 1; i <= totalDays; i += 1) {
    const date = new Date(currentYear, currentMonth, i);
    const activeClass = date.toDateString() === new Date().toDateString() ? "active" : "";
    const daySchedules = getSchedulesForDate(date);

    let scheduleClass = "";
    if (daySchedules.length > 0) {
      const dateKey = getDateKey(date);

      let hasRealActive = false;
      let hasRealCancelled = false;

      daySchedules.forEach(sch => {
        const exc = (sch.cancelled_dates || []).includes(dateKey);
        const isEffActive = sch.is_active ? !exc : exc;
        if (isEffActive) hasRealActive = true;
        else hasRealCancelled = true;
      });

      if (hasRealActive) {
        scheduleClass = "has-schedule";
      } else if (hasRealCancelled) {
        scheduleClass = "has-cancelled";
      }
    }

    datesHTML += `<div class="date ${activeClass} ${scheduleClass}" data-date="${getDateKey(date)}">${i}</div>`;
  }

  for (let i = 1; i <= 7 - lastDayIndex; i += 1) {
    const nextDate = new Date(currentYear, currentMonth + 1, i);
    datesHTML += `<div class="date inactive">${nextDate.getDate()}</div>`;
  }

  datesElement.innerHTML = datesHTML;

  const dateElements = datesElement.querySelectorAll(".date:not(.inactive)");
  dateElements.forEach((dateEl) => {
    dateEl.addEventListener("click", () => {
      const dateKey = dateEl.getAttribute("data-date");
      const [year, month, day] = dateKey.split("-");
      const clickedDate = new Date(year, month - 1, day);
      displayScheduleDetail(clickedDate);

      dateElements.forEach((el) => el.classList.remove("selected"));
      dateEl.classList.add("selected");
    });
  });

  const selectedKey = getDateKey(selectedDate);
  const selectedEl = Array.from(dateElements).find((el) => el.getAttribute("data-date") === selectedKey);
  if (selectedEl) {
    selectedEl.classList.add("selected");
  }
};

// Thay thế toàn bộ hàm refreshSchedules cũ bằng hàm này
const refreshSchedules = async () => {
  if (isLoadingSchedules) return;

  isLoadingSchedules = true;
  showCalendarLoading();
  showStatusMessage("Loading schedule...");

  try {
    // Lấy dữ liệu mới từ Server (đã áp dụng bộ lọc)
    allSchedules = await fetchSchedulesFromApi();
    
    // [QUAN TRỌNG] Kiểm tra đang ở View nào thì vẽ lại View đó
    if (currentView === 'week') {
        renderWeekView(); // Vẽ lại lịch tuần
    } else {
        updateCalendar(); // Vẽ lại lịch tháng
    }
    
    // Nếu đang ở view tháng thì hiện chi tiết bên phải, view tuần thì thôi
    if (currentView === 'month') {
        displayScheduleDetail(selectedDate);
    }
    
  } catch (error) {
    console.error("Unable to load schedules", error);
    showStatusMessage("Unable to load schedules.", "fa-solid fa-triangle-exclamation");
  } finally {
    isLoadingSchedules = false;
  }
};

const navigateCalendar = async (delta) => {
    if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + delta);
        
        currentDate.setDate(1); // Reset về ngày 1 để tránh lỗi ngày 31 nhảy tháng
    } else {
        // Week View: Nhảy +/- 7 ngày
        currentDate.setDate(currentDate.getDate() + (delta * 7));
    }
    selectedDate = new Date(currentDate);
    await refreshSchedules();
};

// Gắn sự kiện mới
if (prevBtn) prevBtn.onclick = () => navigateCalendar(-1);
if (nextBtn) nextBtn.onclick = () => navigateCalendar(1);

// Sự kiện nút chuyển View
if(viewMonthBtn) viewMonthBtn.addEventListener("click", () => switchView('month'));
if(viewWeekBtn) viewWeekBtn.addEventListener("click", () => switchView('week'));

prevBtn.addEventListener("click", () => {
  moveMonth(-1);
});

nextBtn.addEventListener("click", () => {
  moveMonth(1);
});

refreshScheduleBtn.addEventListener("click", () => {
  refreshSchedules();
});

if (addScheduleBtn) {
  addScheduleBtn.addEventListener("click", () => {
    openModal(false);
  });
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", closeModal);
}

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}
if (scheduleTypeInput) {
    scheduleTypeInput.addEventListener("change", handleScheduleTypeChange);
}
if (classSelect) {
    classSelect.addEventListener("change", handleClassChange);
}

if (isRecurringCheckbox) {
  isRecurringCheckbox.addEventListener("change", toggleRecurringOptions);
}

if (isOnlineCheckbox) {
  isOnlineCheckbox.addEventListener("change", toggleOnlineUrlState);
}

if (closeActionModal) {
  closeActionModal.addEventListener("click", closeActionModalFn);
}

if (actionModal) {
  actionModal.addEventListener("click", (event) => {
    if (event.target === actionModal) {
      closeActionModalFn();
    }
  });
}

if (actionThisDay) {
  actionThisDay.addEventListener("click", async () => {
    const action = pendingAction;
    const schedule = pendingSchedule;
    const dateKey = pendingDateKey;

    closeActionModalFn();

    if (action === 'edit') {
      openModal(true, schedule, dateKey);

    } else if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete the schedule for ${dateKey} only?`)) return;

      try {
        await deleteSingleOccurrenceRequest(schedule.schedule_id, dateKey);
        await refreshSchedules();
      } catch (error) {
        alert(error.message || "Unable to delete single occurrence.");
      }

    } else if (action === 'cancel' || action === 'restore') {
      try {
        await toggleScheduleRequest(schedule.schedule_id, null, dateKey);
        await refreshSchedules();
      } catch (error) {
        alert(error.message || "Unable to update single occurrence.");
      }
    }
  });
}

if (actionAllDays) {
  actionAllDays.addEventListener("click", async () => {
    const action = pendingAction;
    const schedule = pendingSchedule;
    closeActionModalFn();

    if (action === 'edit') {
      openModal(true, schedule);
    } else if (action === 'delete') {
      handleDeleteSchedule(schedule.schedule_id);
    } else if (action === 'cancel') {
      handleToggleSchedule(schedule.schedule_id);
    } else if (action === 'restore') {
      await toggleScheduleRequest(schedule.schedule_id, true);
      await refreshSchedules();
    }
  });
}

window.handleEditSchedule = (scheduleId) => {
  const schedule = getScheduleById(scheduleId);
  if (!schedule) return;
  openModal(true, schedule);
};

window.handleEditRecurring = (scheduleId, dateKey) => {
  const schedule = getScheduleById(scheduleId);
  if (!schedule) return;
  openActionModal('edit', schedule, dateKey);
};

window.handleDeleteSchedule = async (scheduleId) => {
  if (!confirm("Are you sure you want to delete this schedule?")) return;
  try {
    await deleteScheduleRequest(scheduleId);
    await refreshSchedules();
  } catch (error) {
    alert(error.message || "Unable to delete schedule.");
  }
};

window.handleDeleteRecurring = (scheduleId, dateKey) => {
  const schedule = getScheduleById(scheduleId);
  if (!schedule) return;
  openActionModal('delete', schedule, dateKey);
};

window.handleToggleSchedule = async (scheduleId) => {
  const schedule = getScheduleById(scheduleId);
  if (!schedule) return;
  try {
    await toggleScheduleRequest(scheduleId, !schedule.is_active);
    await refreshSchedules();
  } catch (error) {
    alert(error.message || "Unable to update schedule status.");
  }
};

window.handleCancelRecurring = async (scheduleId, dateKey) => {
  const schedule = getScheduleById(scheduleId);
  if (!schedule) return;

  const cancelledDates = schedule.cancelled_dates || [];
  const isCancelledToday = cancelledDates.includes(dateKey);

  if (isCancelledToday) {
    try {
      await toggleScheduleRequest(scheduleId, null, dateKey);
      await refreshSchedules();
    } catch (error) {
      alert(error.message || "Unable to restore single occurrence.");
    }
    return;
  }

  if (!schedule.is_active) {
    try {
      await toggleScheduleRequest(scheduleId, null, dateKey);
      await refreshSchedules();
    } catch (error) {
      alert(error.message || "Unable to restore single occurrence.");
    }
    return;
  }

  openActionModal('cancel', schedule, dateKey);
};

if (courseFilterSelect) {
    courseFilterSelect.addEventListener("change", () => {
        const courseCode = courseFilterSelect.value;
        renderClassOptions(courseCode);
        refreshSchedules();
    });
}

// Sự kiện khi chọn Class -> Refresh Lịch
if (classFilterSelect) {
    classFilterSelect.addEventListener("change", () => {
        refreshSchedules();
    });
}

document.addEventListener("click", (e) => {
    // Nếu picker chưa mở thì thôi
    if (!monthPicker || !monthPicker.classList.contains("active")) return;
    // Kiểm tra xem click vào đâu
    const isClickInsidePicker = monthPicker.contains(e.target);
    const isClickOnToggle = monthYearElement.contains(e.target);
    // Nếu click RA NGOÀI (không trúng picker, không trúng nút mở) -> Đóng
    if (!isClickInsidePicker && !isClickOnToggle) {
        closePicker();
    }
});
const showNotification = (message) => {
    // Tạo thẻ div thông báo
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerHTML = `<i class="fa-solid fa-bell"></i> <span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        toast.classList.remove("show");
        // Xóa khỏi DOM sau khi ẩn xong
        setTimeout(() => toast.remove(), 500);
    }, 5000);
};

if (scheduleForm) {
    scheduleForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Khóa nút save để tránh bấm nhiều lần
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = "Saving...";
        }

        try {
            const payload = buildPayloadFromForm();

            // KIỂM TRA: Đang sửa 1 ngày (Edit Only) hay sửa hết?
            // (editingOccurrenceDate được gán khi ta gọi openModal với tham số ngày)
            if (editingScheduleId && editingOccurrenceDate) {
                // Case 1: Sửa 1 ngày cụ thể của chuỗi lặp
                await editSingleOccurrenceRequest(editingScheduleId, editingOccurrenceDate, payload);
            } 
            else if (editingScheduleId) {
                // Case 2: Sửa toàn bộ (hoặc lịch đơn)
                await updateScheduleRequest(editingScheduleId, payload);
            } 
            else {
                // Case 3: Tạo mới
                await createScheduleRequest(payload);
            }

            // Đóng modal và tải lại lịch ngay lập tức
            closeModal();
            await refreshSchedules();
            showNotification("Saved successfully!");

        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to save.");
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = editingScheduleId ? "Update" : "Save";
            }
        }
    });
}

const goToDate = async (targetDate) => {
    currentDate = new Date(targetDate);
    selectedDate = new Date(targetDate);
    
    if (currentView === 'month') {
        if(typeof pickerCurrentYear !== 'undefined') pickerCurrentYear = currentDate.getFullYear();
        if(typeof updatePickerUI === 'function') updatePickerUI();
    }
    
    await refreshSchedules();

    if (currentView === 'month') {
        const dateKey = getDateKey(targetDate);
        const dateEl = document.querySelector(`.date[data-date="${dateKey}"]`);
        
        document.querySelectorAll('.date').forEach(el => el.classList.remove('selected'));
        
        if (dateEl) {
            dateEl.classList.add('selected');
            dateEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        displayScheduleDetail(targetDate);
    } 
};

const checkUrlAndNavigate = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetDateStr = urlParams.get('targetDate'); 

    if (targetDateStr) {
        console.log("Navigating to requested date:", targetDateStr);
        const [y, m, d] = targetDateStr.split('-');
        const targetDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        
        await goToDate(targetDate);
    }
};

(async () => {
  await fetchClassOptions();
  await fetchLecturerOptions();
  await refreshSchedules();
  if (!IS_ASSISTANT) {
      await checkUrlAndNavigate();
  }
})();

