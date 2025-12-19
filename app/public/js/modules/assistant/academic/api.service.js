const API_BASE = '/assistant/api';

export const AcademicService = {
    // --- SEMESTERS ---
    getSemesters: async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/semesters?${query}`);
        return res.json();
    },

    getSemesterById: async (id) => {
        const res = await fetch(`${API_BASE}/semesters/${id}`);
        return res.json();
    },

    createSemester: async (data) => {
        const res = await fetch(`${API_BASE}/semesters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    updateSemester: async (id, data) => {
        const res = await fetch(`${API_BASE}/semesters/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteSemester: async (id) => {
        const res = await fetch(`${API_BASE}/semesters/${id}`, { method: 'DELETE' });
        return res.json();
    },

    // --- COURSES ---
    getCourses: async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/courses?${query}`);
        return res.json();
    },

    getCourseById: async (id) => {
        const res = await fetch(`${API_BASE}/courses/${id}`);
        return res.json();
    },

    createCourse: async (data) => {
        const res = await fetch(`${API_BASE}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    updateCourse: async (id, data) => {
        const res = await fetch(`${API_BASE}/courses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteCourse: async (id) => {
        const res = await fetch(`${API_BASE}/courses/${id}`, { method: 'DELETE' });
        return res.json();
    },

    // --- CLASSES ---
    getClasses: async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/classes?${query}`);
        return res.json();
    },

    getClassById: async (id) => {
        const res = await fetch(`${API_BASE}/classes/${id}`);
        return res.json();
    },

    createClass: async (data) => {
        const res = await fetch(`${API_BASE}/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    updateClass: async (id, data) => {
        const res = await fetch(`${API_BASE}/classes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteClass: async (id) => {
        const res = await fetch(`${API_BASE}/classes/${id}`, { method: 'DELETE' });
        return res.json();
    },

    // ---STUDENTS IN CLASS ---
    getClassStudents: async (classId) => {
        const res = await fetch(`${API_BASE}/classes/${classId}/students`);
        return res.json();
    },

    addStudentsToClass: async (classId, data) => {
        const res = await fetch(`${API_BASE}/classes/${classId}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    removeStudentFromClass: async (classId, studentId) => {
        const res = await fetch(`${API_BASE}/classes/${classId}/students/${studentId}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    updateEnrollmentType: async (classId, studentId, data) => {
        const res = await fetch(`${API_BASE}/classes/${classId}/students/${studentId}/enrollment`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    getAvailableStudents: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/students/available?${query}`);
        return res.json();
    },

    // --- LECTURERS ---
    getLecturersForSelect: async () => {
        try {
            const res = await fetch(`${API_BASE}/lecturers?limit=1000&is_active=true`);
            return res.json();
        } catch (e) {
            console.error('Error fetching lecturers:', e);
            return { data: [] };
        }
    },

    // --- MAJORS ---
    getMajors: async (params = {}) => {
        try {
            const query = new URLSearchParams(params).toString();
            const url = query ? `${API_BASE}/majors?${query}` : `${API_BASE}/majors`;
            const res = await fetch(url);
            return res.json();
        } catch (e) {
            console.error('Error fetching majors:', e);
            return { data: [] };
        }
    }
};