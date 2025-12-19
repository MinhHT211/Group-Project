const API_BASE = '/admin/api';

export const DepartmentService = {
    // === DEPARTMENTS ===
    getDepartments: async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/departments?${query}`);
        return res.json();
    },

    getDepartmentById: async (id) => {
        const res = await fetch(`${API_BASE}/departments/${id}`);
        return res.json();
    },

    createDepartment: async (data) => {
        const res = await fetch(`${API_BASE}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    updateDepartment: async (id, data) => {
        const res = await fetch(`${API_BASE}/departments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteDepartment: async (id) => {
        const res = await fetch(`${API_BASE}/departments/${id}`, { method: 'DELETE' });
        return res.json();
    },

    // === MAJORS ===
    getMajors: async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/majors?${query}`);
        return res.json();
    },

    getMajorById: async (id) => {
        const res = await fetch(`${API_BASE}/majors/${id}`);
        return res.json();
    },

    createMajor: async (data) => {
        const res = await fetch(`${API_BASE}/majors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    updateMajor: async (id, data) => {
        const res = await fetch(`${API_BASE}/majors/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteMajor: async (id) => {
        const res = await fetch(`${API_BASE}/majors/${id}`, { method: 'DELETE' });
        return res.json();
    },

    getLecturersForSelect: async () => {
        try {
            const res = await fetch(`${API_BASE}/lecturers?limit=1000&is_active=true`);
            return res.json();
        } catch (e) {
            console.error(e);
            return { data: [] };
        }
    }
};