const edited = {};
const READ_ONLY_FIELDS = ["total_grade", "letter_grade", "gpa_value"];

document.addEventListener("DOMContentLoaded", function() {
  console.log("Grade management script loaded");
  
  const gradeTable = document.querySelector(".grade-table");
  
  if (gradeTable) {
    gradeTable.addEventListener("dblclick", handleCellEdit);
    console.log("Double-click listener attached to grade table");
  } else {
    console.error("Grade table not found!");
  }
});

function handleCellEdit(e) {
  const cell = e.target.closest(".editable");
  
  if (!cell) {
    console.log("Not an editable cell");
    return;
  }
  
  if (cell.querySelector("input, textarea")) {
    console.log("Cell already being edited");
    return;
  }

  if (READ_ONLY_FIELDS.includes(cell.dataset.field)) {
    console.log("Read-only field, cannot edit");
    return;
  }

  console.log("Editing cell:", cell.dataset.field);
  
  const isNotes = cell.dataset.field === "notes";
  const currentValue = cell.innerText.trim();
  
  const input = document.createElement(isNotes ? "textarea" : "input");
  
  if (!isNotes) {
    input.type = "number";
    input.step = "0.01";
    input.min = "0";
    input.max = "20";
  }

  input.value = currentValue;
  input.className = "form-control form-control-sm";
  
  cell.innerHTML = "";
  cell.appendChild(input);
  input.focus();
  
  if (!isNotes) {
    input.select();
  }

  const saveEdit = () => {
    let value = input.value.trim();
    if (typeof value === 'string') value = value.replace(',', '.');

    if (!isNotes && value !== '') {
      const n = parseFloat(value);
      if (!Number.isFinite(n) || n < 0 || n > 20) {
        if (window.showToast) window.showToast('error', 'Điểm phải nằm trong khoảng 0 đến 20');
        else alert("Điểm phải nằm trong khoảng 0 đến 20");
        cell.innerText = currentValue;
        return;
      }
      const display = Math.round(n * 100) / 100;
      cell.innerText = Number.isInteger(display) ? display.toString() : display.toFixed(2);
      value = display;
    } else {
      cell.innerText = value;
      value = value === '' ? null : value;
    }

    if (!edited[cell.dataset.id]) {
      edited[cell.dataset.id] = {};
    }
    edited[cell.dataset.id][cell.dataset.field] = value === null ? null : value;
    cell.classList.add("edited");
    
    console.log("Saved edit:", cell.dataset.field, "=", value);
    console.log("Current edited state:", edited);
  };

  input.addEventListener("blur", saveEdit);
  
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !isNotes) {
      e.preventDefault();
      saveEdit();
      input.blur();
    } else if (e.key === "Escape") {
      cell.innerText = currentValue;
      input.blur();
    }
  });
}

async function saveAll() {
  if (Object.keys(edited).length === 0) {
    alert("Không có thay đổi nào để lưu");
    return;
  }

  if (!confirm(`Bạn có chắc muốn lưu ${Object.keys(edited).length} thay đổi?`)) {
    return;
  }

  const pathParts = window.location.pathname.split('/');
  const classId = pathParts[pathParts.indexOf('grade') + 1];

  if (!classId) {
    alert("Không tìm thấy classId");
    return;
  }

  console.log("Saving all changes for class:", classId);
  console.log("Updates:", edited);

  try {
    for (const enrollmentId of Object.keys(edited)) {
      const row = edited[enrollmentId];
      for (const field of Object.keys(row)) {
        const v = row[field];
        if (v === null || v === '') continue;
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0 || n > 20) {
          if (window.showToast) {
            window.showToast('error', 'Có giá trị điểm không hợp lệ (phải trong khoảng 0-20). Vui lòng kiểm tra lại.');
          } else {
            alert("Có giá trị điểm không hợp lệ (phải trong khoảng 0-20). Vui lòng kiểm tra lại.");
          }
          return;
        }
      }
    }

    const response = await fetch("/assistant/grades/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: classId,
        updates: edited
      })
    });

    const result = await response.json();

    if (result.success) {
      if (window.showToast) {
        window.showToast('success', 'Lưu & tính lại điểm thành công!');
      } else {
        alert("Lưu & tính lại điểm thành công!");
        location.reload();
      }
    } else {
        window.showToast('success', 'Lưu & tính lại điểm thành công!');
    }
  } catch (error) {
    console.error("Error saving grades:", error);
    if (window.showToast) window.showToast('error', 'Đã xảy ra lỗi khi lưu điểm');
    else alert("Đã xảy ra lỗi khi lưu điểm");
  }
}

function openWeightModal() {
  const modal = document.getElementById("weightModal");
  if (modal) {
    modal.classList.add("show");
    updateTotalWeight();
  }
}

function closeWeightModal() {
  const modal = document.getElementById("weightModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

function updateTotalWeight() {
  const inputs = document.querySelectorAll(".weight-input");
  let total = 0;

  inputs.forEach((input) => {
    const value = parseFloat(input.value) || 0;
    total += value;
  });

  const totalElement = document.getElementById("totalWeight");
  if (totalElement) {
    totalElement.textContent = total.toFixed(0);
    
    if (Math.abs(total - 100) > 0.1) {
      totalElement.style.color = "#dc3545";
    } else {
      totalElement.style.color = "#28a745";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const weightInputs = document.querySelectorAll(".weight-input");
  weightInputs.forEach((input) => {
    input.addEventListener("input", updateTotalWeight);
  });
  
  console.log("Weight inputs initialized:", weightInputs.length);
});

function confirmSaveWeights() {
  if (!confirm("Bạn có chắc muốn lưu cấu hình trọng số điểm?")) {
    return;
  }
  saveWeights();
}

async function saveWeights() {
  const inputs = document.querySelectorAll(".weight-input");
  let sum = 0;
  const components = [];

  inputs.forEach((input) => {
    const weightPercent = parseFloat(input.value) || 0;
    const weight = weightPercent / 100;

    sum += weight;

    components.push({
      component_id: input.dataset.id,
      component_type: input.dataset.type,
      weight: weight
    });
  });

  if (Math.abs(sum - 1) > 0.01) {
    alert("Tổng trọng số phải bằng 100%");
    return;
  }

  const pathParts = window.location.pathname.split('/');
  const classId = pathParts[pathParts.indexOf('grade') + 1];

  if (!classId) {
    alert("Không tìm thấy classId");
    return;
  }

  console.log("Saving weights for class:", classId);
  console.log("Components:", components);

  try {
    const response = await fetch("/assistant/grades/weights/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: classId,
        components: components
      })
    });

    const result = await response.json();

    if (result.success) {
      if (window.showToast) window.showToast('success', 'Lưu trọng số & tính lại điểm thành công!');
      else alert("Lưu trọng số & tính lại điểm thành công!");
      closeWeightModal();
      location.reload();
    } else {
      if (window.showToast) window.showToast('error', result.message || "Cập nhật thất bại");
      else alert(result.message || "Cập nhật thất bại");
    }
  } catch (error) {
    console.error("Error saving weights:", error);
    if (window.showToast) window.showToast('error', 'Đã xảy ra lỗi khi lưu trọng số');
    else alert("Đã xảy ra lỗi khi lưu trọng số");
  }
}

document.addEventListener("click", (e) => {
  const modal = document.getElementById("weightModal");
  if (modal && e.target === modal) {
    closeWeightModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeWeightModal();
  }
});

console.log("Grade management script initialized");