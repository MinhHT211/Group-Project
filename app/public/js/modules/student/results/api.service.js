// public/js/modules/student/results/api.service.js

export const ResultsService = {
    getEnrollments: async (studentId, semesterId = '') => {
        if (!studentId) throw new Error('Student ID is missing');
        
        const query = semesterId ? `?semesterId=${semesterId}` : '';
        const res = await fetch(`/student/api/${studentId}/enrollmentStudent${query}`);
        
        if (!res.ok) {
            const json = await res.json();
            throw new Error(json.message || 'Failed to fetch results');
        }
        
        const json = await res.json();
        return json.data || json; // Support both format
    }
};