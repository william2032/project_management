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
// register.ts
const REGISTER_API_URL = 'http://localhost:3000/auth';
document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                role: 'user'
            };
            try {
                const response = yield fetch(`${REGISTER_API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                    credentials: 'include' // Include if using cookies
                });
                if (!response.ok) {
                    const errorData = yield response.json();
                    throw new Error(errorData.message || 'Registration failed');
                }
                const result = yield response.json();
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            }
            catch (error) {
                console.error('Registration error:', error);
                alert(error instanceof Error ? error.message : 'Registration failed');
            }
        }));
    }
});
//# sourceMappingURL=register.js.map