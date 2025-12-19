const API_BASE = '/admin/api';

export const StaffService = {
    // === LECTURERS ===
    getLecturers: async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/lecturers?${query}`);
        return res.json();
    },

    getLecturerById: async (id) => {
        const res = await fetch(`${API_BASE}/lecturers/${id}`);
        return res.json();
    },

    createLecturer: async (data) => {
        // Controller yêu cầu body: { userData, lecturerData }
        const res = await fetch(`${API_BASE}/lecturers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    updateLecturer: async (id, data) => {
        const res = await fetch(`${API_BASE}/lecturers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteLecturer: async (id) => {
        const res = await fetch(`${API_BASE}/lecturers/${id}`, { method: 'DELETE' });
        return res.json();
    },

    restoreLecturer: async (id) => {
        const res = await fetch(`${API_BASE}/lecturers/${id}/restore`, { 
            method: 'POST' 
        });
        return res.json();
    },

    // === ASSISTANTS ===
    getAssistants: async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/assistants?${query}`);
        return res.json();
    },

    getAssistantById: async (id) => {
        const res = await fetch(`${API_BASE}/assistants/${id}`);
        return res.json();
    },

    createAssistant: async (data) => {
        const res = await fetch(`${API_BASE}/assistants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    updateAssistant: async (id, data) => {
        const res = await fetch(`${API_BASE}/assistants/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteAssistant: async (id) => {
        const res = await fetch(`${API_BASE}/assistants/${id}`, { method: 'DELETE' });
        return res.json();
    },

    restoreAssistant: async (id) => {
        const res = await fetch(`${API_BASE}/assistants/${id}/restore`, { 
            method: 'POST' 
        });
        return res.json();
    },

    // === DEPARTMENTS ===
    getDepartments: async (isActive) => {
        try {
            const params = isActive ? '?is_active=true' : '';
            let res = await fetch(`${API_BASE}/departments${params}`);
            
            if (!res.ok) {
                 res = await fetch(`${API_BASE}/departments/simple${params}`);
            }
            
            const json = await res.json();
            // Chuẩn hóa dữ liệu trả về thành mảng
            return Array.isArray(json) ? json : (json.data || []);
        } catch (error) {
            console.error('Failed to load departments', error);
            return [];
        }
    }
};