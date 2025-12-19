export const ENROLLMENT_TYPES = {
    'regular': { text: 'Học lần đầu', class: 'badge-normal' }, 
    'retake': { text: 'Học lại', class: 'badge-retake' },     
    'improvement': { text: 'Cải thiện', class: 'badge-improve' }
};

export function formatNum(num) {
    return (num != null && num !== '') ? Number(num).toFixed(2) : '-';
}

export function getBadge(type) {
    const config = ENROLLMENT_TYPES[type] || ENROLLMENT_TYPES['regular'];
    return `<span class="enrollment-badge ${config.class}">${config.text}</span>`;
}

export function getGradeClass(letter) {
    if (!letter) return '';
    // Convert A+ -> grade-A-plus for CSS mapping
    return `grade-${letter.replace('+', '-plus')}`;
}

export function renderAttendance(rate) {
    if (rate == null || rate === '') return '-';
    const r = Number(rate);
    const colorClass = r >= 80 ? 'high' : (r >= 60 ? 'medium' : 'low');
    return `
        <div class="attendance-progress">
            <div class="progress-bar-custom">
                <div class="progress-fill ${colorClass}" style="width: ${r}%"></div>
            </div>
            <span class="attendance-text">${r.toFixed(0)}%</span>
        </div>`;
}

export function calculateStats(data) {
    return data.reduce((acc, item) => {
        acc.total++;
        acc.credits += (item.course?.credits || 0);
        if (item.grades?.gpa != null) {
            acc.gpaSum += Number(item.grades.gpa);
            acc.gpaCount++;
        }
        if (item.grades?.passed === true) acc.passed++;
        if (item.grades?.passed != null) acc.resultCount++;
        return acc;
    }, { total: 0, credits: 0, gpaSum: 0, gpaCount: 0, passed: 0, resultCount: 0 });
}

export function showLoading(element) {
    if (element) element.style.display = 'block';
}

export function hideLoading(element) {
    if (element) element.style.display = 'none';
}