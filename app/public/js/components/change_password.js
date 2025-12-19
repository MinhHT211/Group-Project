(() => {
    let msgTimeoutId = null;
    // Handle Internal Messages (Inline)
    const clearMessageAfterDelay = (delay = 4000) => {
        if (msgTimeoutId) clearTimeout(msgTimeoutId);

        msgTimeoutId = setTimeout(() => {
            const msg = document.getElementById("cpwMsg");
            if (msg) {
                msg.textContent = "";
                msg.className = "message";
            }
            msgTimeoutId = null;
        }, delay);
    };

    const showInline = (text, ok = false) => {
        const msg = document.getElementById("cpwMsg");
        if (!msg) return;

        msg.textContent = text;
        msg.className = ok ? "message success" : "message error";

        if (!ok) clearMessageAfterDelay();
    };
    
    // Toggle Password Visibility (Eye Icon)
    const setupPasswordToggle = (inputId, toggleId) => {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);

        if (!input || !toggle) return;

        toggle.addEventListener("click", () => {
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            toggle.classList.toggle("fa-eye");
            toggle.classList.toggle("fa-eye-slash");
        });
    };

    document.addEventListener("DOMContentLoaded", () => {
        setupPasswordToggle("oldPassword", "toggleOldPassword");
        setupPasswordToggle("newPassword", "toggleNewPassword");
        setupPasswordToggle("confirmPassword", "toggleConfirmPassword");
    });

    // Handle Form Submission
    const form = document.getElementById("changePwForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fd = new FormData(form);
        const nowEmail = fd.get("nowEmail");
        const oldPassword = fd.get("oldPassword");
        const newPassword = fd.get("newPassword");
        const confirm = fd.get("confirm");

        // Validate input data
        if (!nowEmail || !oldPassword || !newPassword) {
            return showInline("Please fill in all fields");
        }

        if (newPassword !== confirm) {
            return showInline("Confirm password does not match");
        }

        try {
            let res = await fetch("/auth/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword, newPassword, nowEmail }),
            });

            // If Access Token expired (401) -> Try refreshing token once
            if (res.status === 401) {
                const refresh = await fetch("/auth/refresh", { method: "POST" });
                
                if (!refresh.ok) {
                    // If refresh fails -> Force re-login
                    if (typeof showToast === 'function') {
                         showToast("error", "Session expired. Please log in again.");
                    }
                    return;
                }

                // Refresh successful -> Retry password change API call
                res = await fetch("/auth/password", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ oldPassword, newPassword, nowEmail }),
                });
            }

            // Handle API error response
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                if (typeof showToast === 'function') {
                    showToast("error", j.message || "Password change failed");
                }
                return;
            }

            // --- SUCCESS ---
            if (typeof showToast === 'function') {
                showToast("success", "Password changed successfully. Logging out...");
            }

            // Clear Access Token on Client (Cookie)
            document.cookie = "access_token=; Path=/; Max-Age=0; SameSite=Strict";

            // Redirect to login page after 4 seconds (to allow reading the toast)
            setTimeout(() => {
                window.location.href = "/auth/login";
            }, 4000);

        } catch (err) {
            console.error(err);
            if (typeof showToast === 'function') {
                showToast("error", "System error. Please try again later.");
            }
        }
    });
})();