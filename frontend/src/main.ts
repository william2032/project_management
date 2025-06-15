// Define User interface locally since Prisma client is not available in frontend
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  password?: string;
  profileImage?: string | null;
}

document.addEventListener('DOMContentLoaded', () => {
  // Get all sidebar list items
  const sidebarItems = document.querySelectorAll('.sidebar li');

  // Add click event listeners to each sidebar item
  sidebarItems.forEach((item) => {
    item.addEventListener('click', () => {
      //  section to show from data attribute
      const sectionToShow = item.getAttribute('data-section');

      // Hiding all sections first
      document.querySelectorAll('.section').forEach((section) => {
        (section as HTMLElement).style.display = 'none';
      });

      // Show the selected section
      const targetSection = document.querySelector(`.${sectionToShow}-section`);
      if (targetSection) {
        (targetSection as HTMLElement).style.display = 'block';
      }

      // Removing active class from all sidebar items
      sidebarItems.forEach((i) =>
        (i as HTMLElement).classList.remove('active'),
      );
      (item as HTMLElement).classList.add('active');
    });
  });

  // Show dashboard by default - WITH NULL CHECKS
  const dashboardSection = document.querySelector('.dashboard-section') as HTMLElement;
  const dashboardMenuItem = document.querySelector('.sidebar li[data-section="dashboard"]') as HTMLElement;
  
  if (dashboardSection) {
    dashboardSection.style.display = 'block';
  } else {
    console.warn('Dashboard section not found in DOM');
  }
  
  if (dashboardMenuItem) {
    dashboardMenuItem.classList.add('active');
  } else {
    console.warn('Dashboard menu item not found in DOM');
  }
});

//API Base URL
const API_URL = 'http://localhost:3000/users';

//show API responses
const responseDiv = document.getElementById('response') as HTMLDivElement;
function showResponse(message: string, isError = false) {
  if (responseDiv) {
    responseDiv.textContent = message;
    responseDiv.className = isError ? 'error' : 'success';
    responseDiv.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm') as HTMLFormElement;
  const loginForm = document.getElementById('loginForm') as HTMLFormElement;
  
  // Initialize dashboard if on admin page
  if (document.querySelector('.dashboard-section')) {
    fetchAndDisplayUsers();
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const credentials = {
            email: formData.get('email') as string,
            password: formData.get('password') as string
        };
        
        console.log('=== LOGIN DEBUG START ===');
        console.log('1. Attempting login with email:', credentials.email);
        console.log('2. Password provided:', !!credentials.password);
        
        try {
            console.log('3. Sending request to backend...');
            const response = await fetch('http://localhost:3000/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });
            
            console.log('4. Response status:', response.status);
            console.log('5. Response ok:', response.ok);
            
            if (response.ok) {
                const result = await response.json();
                console.log('6. FULL BACKEND RESPONSE:', JSON.stringify(result, null, 2));
                console.log('7. Access token exists:', !!result.access_token);
                console.log('8. Access token value:', result.access_token);
                console.log('9. Access token type:', typeof result.access_token);
                console.log('10. Access token length:', result.access_token?.length);

                if (!result.access_token) {
                    console.error('ERROR: No access token in response!');
                    throw new Error('No access token received');
                }

                // Check if it's a real JWT (should have 3 parts separated by dots)
                const tokenParts = result.access_token.split('.');
                console.log('11. Token parts count:', tokenParts.length);
                console.log('12. Is valid JWT format:', tokenParts.length === 3);

                // TEMPORARY FIX: Accept the placeholder token for now
                // TODO: Fix backend to return real JWT
                if (result.access_token === 'your-jwt-token') {
                    console.warn('⚠️  WARNING: Backend returning placeholder token!');
                    console.warn('⚠️  This should be fixed in production!');
                }

                // Store the token and user info
                localStorage.setItem('token', result.access_token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                // Verify storage worked
                const storedToken = localStorage.getItem('token');
                console.log('13. Token stored successfully:', !!storedToken);
                console.log('14. Stored token matches:', storedToken === result.access_token);
                console.log('15. Stored token preview:', storedToken?.substring(0, 50) + '...');
                
                console.log('=== LOGIN DEBUG SUCCESS ===');
                alert('Login successful! Check console for debug info.');
                
                // Redirect based on role
                if (result.user && result.user.role === 'admin') {
                    console.log('Redirecting to admin panel...');
                    window.location.href = 'admin.html';
                } else {
                    console.log('Redirecting to user panel...');
                    window.location.href = 'user.html';
                }
            } else {
                const error = await response.text();
                console.error('LOGIN FAILED - Raw response:', error);
                try {
                    const jsonError = JSON.parse(error);
                    console.error('LOGIN FAILED - Parsed error:', jsonError);
                    alert('Login failed: ' + (jsonError.message || 'Invalid credentials'));
                } catch {
                    console.error('LOGIN FAILED - Non-JSON response');
                    alert('Login failed: Server error');
                }
            }
        } catch (error) {
            console.error('=== LOGIN NETWORK ERROR ===');
            console.error('Error details:', error);
            alert('Network error. Please try again.');
        }
    });
  }
  
  // MODIFIED: More lenient token verification for development
  function verifyToken(token: string): boolean {
    try {
      // TEMPORARY: Accept placeholder token for development
      if (token === 'your-jwt-token') {
        console.warn('⚠️  Using placeholder token - this should be fixed in production!');
        return true; // Allow for development
      }
      
      // Proper JWT validation
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Optional: Add expiration check
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  const logoutButton = document.getElementById('logout');
    
  if (logoutButton) {
    logoutButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Clear stored data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Optional: Clear session storage too
      sessionStorage.clear();
      
      alert('Logged out successfully!');
      
      // Redirect to login page
      window.location.href = 'login.html';
    });
  }

  // Initialize buttons and event listeners
  initializeButtons();
});

function initializeButtons() {
  const showUsersBtn = document.getElementById('showUsersBtn');
  const refreshBtn = document.getElementById('refreshUsers');
  
  if (showUsersBtn) {
    showUsersBtn.addEventListener('click', fetchAndDisplayUsers);
    console.log('Show users button initialized');
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', fetchAndDisplayUsers);
    console.log('Refresh button initialized');
  }
}

async function fetchAndDisplayUsers() {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Check if token exists
  if (!token) {
    alert('You need to login first');
    window.location.href = 'login.html';
    return;
  }

  // Debug: Check token contents
  console.log('Token exists:', !!token);
  console.log('Token preview:', token.substring(0, 50) + '...');

  // MODIFIED: More lenient token validation for development
  if (token !== 'your-jwt-token') {
    // Only validate if it's not the placeholder token
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format, but proceeding with request...');
    }
  }

  try {
    // Make the API request with proper headers
    const response = await fetch('http://localhost:3000/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    // Handle 401 specifically
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Session expired. Please login again.');
      window.location.href = 'login.html';
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const users = await response.json();
    console.log('Users fetched:', users);
    displayUsers(users);
    updateUserCount(users.length);
  } catch (error) {
    console.error('Error fetching users:', error);
    alert('Error fetching users. Check console for details.');
  }
}

function updateUserCount(count: number) {
  const userCountElement = document.querySelector('.card-total:nth-child(2) h1');
  if (userCountElement) {
    userCountElement.textContent = count.toString();
  }
}

function handleSessionExpired() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  alert('Session expired. Please login again.');
  window.location.href = 'login.html';
}

function displayUsers(users: User[]) {
  const usersTable = document.getElementById('usersTable');
  if (!usersTable) {
    console.error('Users table not found');
    return;
  }

  // Clear existing table rows
  usersTable.innerHTML = '';

  // Populate table with user data
  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
    `;
    usersTable.appendChild(row);
  });
}

// Project Management Functions
async function fetchAndDisplayProjects() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You need to login first');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const projects = await response.json();
    displayProjects(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    alert('Error fetching projects. Check console for details.');
  }
}

function displayProjects(projects: any[]) {
  const projectsList = document.getElementById('projectsList');
  if (!projectsList) return;

  projectsList.innerHTML = '';
  projects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="header">
        <h4>${project.title}</h4>
        <p>${project.status}</p>
      </div>
      <div class="description">
        <p>${project.description}</p>
        <p>Assigned to: ${project.assignedTo ? project.assignedTo.name : 'Not assigned'}</p>
      </div>
      <hr />
      <div class="btns">
        <button class="edit" onclick="editProject(${project.id})">Edit</button>
        <button class="delete" onclick="deleteProject(${project.id})">Delete</button>
        ${!project.assignedTo ? `<button class="assign" onclick="assignProject(${project.id})">Assign</button>` : ''}
      </div>
    `;
    projectsList.appendChild(card);
  });
}

async function addProject(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  
  const projectData = {
    title: formData.get('title'),
    description: formData.get('description')
  };

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You need to login first');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    alert('Project added successfully!');
    form.reset();
    fetchAndDisplayProjects();
  } catch (error) {
    console.error('Error adding project:', error);
    alert('Error adding project. Check console for details.');
  }
}

async function deleteProject(id: number) {
  if (!confirm('Are you sure you want to delete this project?')) return;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You need to login first');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    alert('Project deleted successfully!');
    fetchAndDisplayProjects();
  } catch (error) {
    console.error('Error deleting project:', error);
    alert('Error deleting project. Check console for details.');
  }
}

async function assignProject(projectId: number) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You need to login first');
    window.location.href = 'login.html';
    return;
  }

  try {
    // First fetch users to show in dropdown
    const usersResponse = await fetch('http://localhost:3000/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      throw new Error(`HTTP error! status: ${usersResponse.status}`);
    }

    const users = await usersResponse.json();
    const availableUsers = users.filter((user: any) => !user.project);

    if (availableUsers.length === 0) {
      alert('No available users to assign!');
      return;
    }

    const userId = prompt('Enter user ID to assign:');
    if (!userId) return;

    const response = await fetch('http://localhost:3000/projects/assign', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId,
        userId: parseInt(userId)
      })
    });

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign project');
    }

    alert('Project assigned successfully!');
    fetchAndDisplayProjects();
  } catch (error) {
    console.error('Error assigning project:', error);
    alert('Error assigning project. Check console for details.');
  }
}

// Initialize project form
const addProjectForm = document.getElementById('addProjectForm');
if (addProjectForm) {
  addProjectForm.addEventListener('submit', addProject);
}

// Fetch projects when projects section is shown
document.addEventListener('DOMContentLoaded', () => {
  const projectsSection = document.querySelector('.projects-section');
  if (projectsSection) {
    fetchAndDisplayProjects();
  }
});

