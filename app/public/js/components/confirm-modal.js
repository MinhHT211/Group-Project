let confirmCallback = null;

const modal = document.getElementById('globalConfirmModal');
const titleEl = document.getElementById('globalConfirmTitle');
const msgEl = document.getElementById('globalConfirmMessage');
const okBtn = document.getElementById('globalConfirmOkBtn');
const cancelBtn = document.getElementById('globalConfirmCancelBtn');

function hideModal() {
    if (modal) modal.style.display = 'none';
    confirmCallback = null;
}

if (okBtn) {
    okBtn.addEventListener('click', async () => {
        if (confirmCallback) {
            const oldText = okBtn.innerHTML;
            okBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Xử lý...';
            okBtn.disabled = true;

            try {
                await confirmCallback();
            } catch (error) {
                console.error(error);
            } finally {
                okBtn.innerHTML = oldText;
                okBtn.disabled = false;
                hideModal();
            }
        } else {
            hideModal();
        }
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', hideModal);
}

if (modal) {
    window.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });
}

export const ConfirmModal = {
    show: (message, onConfirm, confirmText = 'Xóa', title = 'Xác nhận') => {
        if (!modal) {
            console.error('Confirm Modal HTML not found in DOM');
            return;
        }

        if (msgEl) msgEl.textContent = message;
        if (titleEl) titleEl.textContent = title;
        if (okBtn) {
            okBtn.textContent = confirmText;
            if (confirmText === 'Xóa' || confirmText === 'Delete') {
                okBtn.className = 'btn-save btn-danger';
            } else {
                okBtn.className = 'btn-save';
            }

            const dangerKeywords = ['Xóa', 'Delete', 'Đăng xuất', 'Logout'];
            if (dangerKeywords.includes(confirmText)) {
                okBtn.className = 'btn-save btn-danger';
            } else {
                okBtn.className = 'btn-save';
            }
        }

        confirmCallback = onConfirm;

        modal.style.display = 'flex';
    },

    hide: hideModal
};