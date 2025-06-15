// register.ts
const REGISTER_API_URL = 'http://localhost:3000/auth';

document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm') as HTMLFormElement;
  
  if (registerForm) {
    registerForm.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      
      const formData = new FormData(registerForm);
      const userData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        role: 'user'
      };

      try {
        const response = await fetch(`${REGISTER_API_URL}/register`, {
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
      } catch (error) {
        console.error('Registration error:', error);
        alert(error instanceof Error ? error.message : 'Registration failed');
      }
    });
  }
});