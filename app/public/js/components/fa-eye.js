document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("toggle-password");

if (passwordInput && togglePassword) {
    togglePassword.addEventListener("click", function () {
        const isPass = passwordInput.type === "password";
        passwordInput.type = isPass ? "text" : "password";
        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
    });
}

const confirmPasswordInput = document.getElementById("confirm-password");
const togglePassword1 = document.getElementById("toggle-password1");

if (confirmPasswordInput && togglePassword1) {
    togglePassword1.addEventListener("click", function () {
        const isPass = confirmPasswordInput.type === "password";
        confirmPasswordInput.type = isPass ? "text" : "password";
        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
    });
}

const btnContinue = document.getElementById("btnContinue");

if (btnContinue) {
    btnContinue.addEventListener("click", function () {
    window.location.href = "/auth/resetPassNewPass";
    });
    }

const btnContinue1 = document.getElementById("btnContinue1");

if (btnContinue1) {
    btnContinue1.addEventListener("click", function () {
    window.location.href = "/auth/reset-success";
    });
    }

});