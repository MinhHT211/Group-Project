// public/js/modules/student/results/ui.renderer.js

import * as Utils from './utils.js';

export const ResultsUI = {
    renderEmptyState: (container, message = 'Chưa có dữ liệu', icon = 'fa-file-alt') => {
        container.innerHTML = `<div class="empty-state"><i class="fas ${icon}"></i><p>${message}</p></div>`;
    },

    renderSemesterGroup: (code, group) => {
        const rows = group.courses.map(item => {
            const { course: c = {}, lecturer: l = {}, grades: g = {}, attendance: a = {} } = item;
            return `
                <tr>
                    <td><strong>${c.course_code || '-'}</strong></td>
                    <td>${c.course_name || '-'}</td>
                    <td>${c.credits ?? '-'}</td>
                    <td>${l.name || '-'}</td>
                    <td>${Utils.getBadge(item.enrollment_type)}</td>
                    <td>${Utils.renderAttendance(a.rate)}</td>
                    <td>${Utils.formatNum(g.midterm)}</td>
                    <td>${Utils.formatNum(g.final)}</td>
                    <td>${Utils.formatNum(g.total)}</td>
                    <td class="${Utils.getGradeClass(g.letter)}">${g.letter || '-'}</td>
                    <td>${Utils.formatNum(g.gpa)}</td>
                    <td>${g.passed === true ? '<span class="badge bg-success">Đậu</span>' : (g.passed === false ? '<span class="badge bg-danger">Trượt</span>' : '-')}</td>
                </tr>`;
        }).join('');

        return `
            <div class="semester-group">
                <div class="semester-header" onclick="this.classList.toggle('collapsed'); this.nextElementSibling.classList.toggle('collapsed');">
                    <h5>${group.info.semester_name || 'Học kỳ'}</h5>
                    <i class="fas fa-chevron-down semester-toggle"></i>
                </div>
                <div class="semester-body">
                    <div class="table-responsive">
                        <table class="table table-hover grades-table">
                            <thead>
                                <tr>
                                    <th style="width: 8%">Mã môn</th>
                                    <th style="width: 20%">Tên môn</th> 
                                    <th style="width: 5%">TC</th>
                                    <th style="width: 12%">Giảng viên</th>
                                    <th style="width: 9%">Loại</th>
                                    <th style="width: 10%">Điểm danh</th>
                                    <th style="width: 5%">Giữa kì</th>
                                    <th style="width: 5%">Cuối kì</th>
                                    <th style="width: 5%">Tổng kết</th>
                                    <th style="width: 5%">Chữ</th>
                                    <th style="width: 5%">GPA</th>
                                    <th style="width: 8%">Kết quả</th>           
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    },

    renderStats: (data, summaryEl) => {
        if (!summaryEl) return;
        summaryEl.style.display = 'flex';

        const stats = Utils.calculateStats(data);
        const avgGPA = stats.gpaCount ? (stats.gpaSum / stats.gpaCount) : 0;
        const passRate = stats.resultCount ? (stats.passed / stats.resultCount * 100) : 0;

        // Cập nhật DOM (giả sử các ID này tồn tại trong HTML)
        const setText = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.textContent = val;
        };

        setText('totalCourses', stats.total);
        setText('totalCredits', stats.credits);
        setText('avgGPA', avgGPA.toFixed(2));
        setText('passRate', passRate.toFixed(0) + '%');
        
        // Cập nhật badge xếp hạng nếu có
        const elRanking = document.getElementById('rankingLevel');
        if(elRanking) {
            elRanking.textContent = avgGPA >= 3.6 ? 'Xuất sắc' : (avgGPA >= 3.2 ? 'Giỏi' : (avgGPA >= 2.5 ? 'Khá' : 'TB'));
        }
    },

    populateFilter: (filterEl, data) => {
        if (!filterEl || filterEl.options.length > 1) return;
        
        const semesters = new Map();
        data.forEach(d => d.semester && semesters.set(d.semester.semester_id, d.semester));
        
        [...semesters.values()]
            .sort((a, b) => (b.academic_year || '').localeCompare(a.academic_year || ''))
            .forEach(s => filterEl.add(new Option(s.semester_name, s.semester_id)));
    }
};