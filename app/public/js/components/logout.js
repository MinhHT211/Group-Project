import { ConfirmModal } from '/js/components/confirm-modal.js';

document.addEventListener('DOMContentLoaded', () => {
    const logoutLinks = document.querySelectorAll('a[href="/auth/logout"]');

    logoutLinks.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const logoutUrl = btn.getAttribute('href');

            ConfirmModal.show(
                'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
                async () => {
                    try {
                        localStorage.removeItem('authToken');
                        sessionStorage.clear();
                        
                        window.location.href = logoutUrl;
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                },
                'Đăng xuất',
                'Xác nhận Đăng xuất'
            );
        });
    });
});