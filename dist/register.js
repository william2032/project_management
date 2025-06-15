"use strict";
// register.ts
const API_URL = 'http://localhost:3000/auth';
document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                role: 'user'
            };
            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                    credentials: 'include' // Include if using cookies
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Registration failed');
                }
                const result = await response.json();
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            }
            catch (error) {
                console.error('Registration error:', error);
                alert(error instanceof Error ? error.message : 'Registration failed');
            }
        });
    }
});
