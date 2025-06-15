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
            var _a;
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                const response = yield fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include' // Include cookies in the request
                });
                if (!response.ok) {
                    throw new Error('Login failed');
                }
                const data = yield response.json();
                console.log('Login response:', data); // Debug log
                // Store the token and user data
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    role: data.user.role
                }));
                // Set a cookie with the token as well
                document.cookie = `token=${data.access_token}; path=/; secure; samesite=strict`;
                // Redirect based on role
                if (((_a = data.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin') {
                    window.location.href = 'admin.html';
                }
                else {
                    window.location.href = 'user.html';
                }
            }
            catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please check your credentials.');
            }
        }));
    }
});
//# sourceMappingURL=login.js.map