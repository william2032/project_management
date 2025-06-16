document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm') as HTMLFormElement;
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      
      const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
      const password = (document.getElementById('loginPassword') as HTMLInputElement).value;

      try {
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Logging in...';
        }

        const response = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include' // Include cookies in the request
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('Invalid email or password. Please try again.');
          } else if (response.status === 404) {
            throw new Error('User not found. Please register first.');
          } else {
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
          if (data.user?.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'user.html';
          }
        }, 1000);

      } catch (error) {
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

      } finally {
        // Reset button state
        const submitButton = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Login';
        }
      }
    });
  }
});