"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                // Show loading state
                const submitButton = loginForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = 'Logging in...';
                }
                const response = yield fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include' // Include cookies in the request
                });
                const data = yield response.json();
                if (!response.ok) {
                    // Handle specific error cases
                    if (response.status === 401) {
                        throw new Error('Invalid email or password. Please try again.');
                    }
                    else if (response.status === 404) {
                        throw new Error('User not found. Please register first.');
                    }
                    else {
                        throw new Error(data.message || 'Login failed. Please try again.');
                    }
                }
                // Store the token and user data
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    role: data.user.role
                }));
                // Set a cookie with the token
                document.cookie = `token=${data.access_token}; path=/; secure; samesite=strict`;
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Login successful! Redirecting...';
                document.body.appendChild(successMessage);
                // Redirect based on role after a short delay
                setTimeout(() => {
                    var _a;
                    if (((_a = data.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin') {
                        window.location.href = 'admin.html';
                    }
                    else {
                        window.location.href = 'user.html';
                    }
                }, 1000);
            }
            catch (error) {
                console.error('Login error:', error);
                // Show error message
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = error instanceof Error ? error.message : 'Login failed. Please try again.';
                document.body.appendChild(errorMessage);
                // Remove error message after 3 seconds
                setTimeout(() => {
                    errorMessage.remove();
                }, 3000);
            }
            finally {
                // Reset button state
                const submitButton = loginForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Login';
                }
            }
        }));
    }
});
//# sourceMappingURL=login.js.map