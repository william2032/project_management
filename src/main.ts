// Add debug logs at the start of the file
console.log('Script loaded successfully');

// Define User interface locally since Prisma client is not available in frontend
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  password?: string;
  profileImage?: string | null;
}

// Admin functionality
interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  };
}

// Global logout function
function handleLogout(e?: Event) {
  if (e) {
    e.preventDefault();
  }
  
  // Clear stored data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Optional: Clear session storage too
  sessionStorage.clear();
  
  // Redirect to login page
  window.location.href = 'login.html';
}

// Initialize logout button when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logout');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

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
  console.log('DOM Content Loaded');
  console.log('Checking for forms...');
  
  const registerForm = document.getElementById('registerForm') as HTMLFormElement;
  const loginForm = document.getElementById('loginForm') as HTMLFormElement;
  
  console.log('Register form found:', !!registerForm);
  console.log('Login form found:', !!loginForm);
  
  // Initialize dashboard if on admin page
  if (document.querySelector('.dashboard-section')) {
    console.log('Dashboard section found, initializing...');
    fetchAndDisplayUsers();
  }
  
  if (loginForm) {
    console.log('Adding login form submit listener');
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Ensure this is called first
      handleLogin(e);
    });
  }

  if (registerForm) {
    console.log('Adding register form submit listener');
    registerForm.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      const formData = new FormData(registerForm as HTMLFormElement);
      const userData = {
        email: formData.get('email'),
        name: formData.get('name'),
        password: formData.get('password')
      };

      try {
        const response = await fetch('http://localhost:3000/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Registration failed');
        }

        const data = await response.json();
        showResponse('Registration successful! Redirecting to login...', false);
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } catch (error) {
        console.error('Registration error:', error);
        showResponse(error instanceof Error ? error.message : 'Registration failed. Please try again.', true);
      }
    });
  }
  
  // Initialize admin functionality if on admin page
  if (document.querySelector('.dashboard-section')) {
    initializeAdmin();
  }
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

function displayProjects(projects: Project[]) {
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
        <div class="assignment-info">
          <strong>Assigned to:</strong> 
          <span class="assigned-user">${project.assignedTo ? project.assignedTo.name : 'Not assigned'}</span>
        </div>
      </div>
      <hr />
      <div class="btns">
        <button class="edit" onclick="editProject(${project.id})">Edit</button>
        <button class="delete" onclick="deleteProject(${project.id})">Delete</button>
      </div>
    `;
    projectsList.appendChild(card);
  });

  // Update assigned projects count
  const assignedProjects = projects.filter(project => project.assignedTo);
  const assignedProjectsElement = document.querySelector('.card-total:nth-child(3) h1');
  if (assignedProjectsElement) {
    assignedProjectsElement.textContent = assignedProjects.length.toString();
  }
}

// Handle form submission
function handleFormSubmit(e: Event) {
  e.preventDefault();
  
  const titleInput = document.getElementById('title') as HTMLInputElement;
  const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
  
  if (!titleInput || !descriptionInput) {
    console.error('Form elements not found');
    return;
  }

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  
  if (!title || !description) {
    alert('Please fill in all required fields');
    return;
  }

  // Call the async function
  createProject(title, description);
}

// Async function to create project
async function createProject(title: string, description: string) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You need to login first');
      window.location.href = 'login.html';
      return;
    }

    const response = await fetch('http://localhost:3000/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        description,
        status: 'in_progress'
      })
    });

    if (response.status === 401) {
      alert('Your session has expired. Please login again.');
      window.location.href = 'login.html';
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create project: ${errorText}`);
    }

    const data = await response.json();
    console.log('Project created:', data);
    
    // Clear form
    const titleInput = document.getElementById('title') as HTMLInputElement;
    const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
    if (titleInput && descriptionInput) {
      titleInput.value = '';
      descriptionInput.value = '';
    }
    
    // Reload projects
    await loadProjects();
    
    // Show success message
    alert('Project created successfully!');
    
    // Switch to projects section
    const projectsSection = document.querySelector('.projects-section') as HTMLElement;
    const addProjectSection = document.querySelector('.add-project-section') as HTMLElement;
    if (projectsSection && addProjectSection) {
      projectsSection.style.display = 'block';
      addProjectSection.style.display = 'none';
    }
  } catch (error) {
    console.error('Error creating project:', error);
    alert('Failed to create project. Please try again.');
  }
}

// Make functions available globally
export {};

declare global {
  interface Window {
    editProject: (id: number) => Promise<void>;
    deleteProject: (id: number) => Promise<void>;
    closeEditForm: () => void;
  }
}

// Load projects functionality
async function loadProjects(): Promise<void> {
  console.log('=== LOAD PROJECTS START ===');
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    console.log('1. Fetching projects...');
    const response = await fetch('http://localhost:3000/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('2. Response status:', response.status);
    console.log('3. Response ok:', response.ok);

    if (response.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('4. Error response:', errorText);
      throw new Error(`Failed to load projects: ${errorText}`);
    }

    const projects = await response.json();
    console.log('5. Projects loaded:', projects.length);
    console.log('6. Projects data:', JSON.stringify(projects, null, 2));

    const projectsList = document.getElementById('projectsList');
    if (!projectsList) {
      console.error('7. Projects list element not found');
      return;
    }

    projectsList.innerHTML = projects
      .map(
        (project: Project) => `
        <div class="project-card" data-project-id="${project.id}">
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <p>Status: ${project.assignedTo ? 'In Progress' : 'Not Assigned'}</p>
          <p>Assigned to: ${project.assignedTo ? project.assignedTo.name : 'Not assigned'}</p>
          <div class="project-actions">
            <button class="edit-btn" data-project-id="${project.id}">Edit</button>
            <button class="delete-btn" data-project-id="${project.id}">Delete</button>
          </div>
        </div>
      `
      )
      .join('');

    console.log('8. Projects rendered to DOM');

    // Add event listeners to buttons
    projectsList.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = button.getAttribute('data-project-id');
        if (projectId) {
          editProject(parseInt(projectId));
        }
      });
    });

    projectsList.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = button.getAttribute('data-project-id');
        if (projectId) {
          deleteProject(parseInt(projectId));
        }
      });
    });

    console.log('9. Event listeners added');
    console.log('=== LOAD PROJECTS END ===');
  } catch (error) {
    console.error('=== LOAD PROJECTS ERROR ===');
    console.error('Error details:', error);
    alert('Failed to load projects. Please refresh the page.');
  }
}

// Edit project functionality
async function editProject(id: number) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You need to login first');
      window.location.href = 'login.html';
      return;
    }

    // Get current project data
    const response = await fetch(`http://localhost:3000/projects/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project details');
    }

    const project = await response.json();

    // Create and show edit form
    const editForm = document.createElement('div');
    editForm.className = 'edit-form-overlay';
    editForm.innerHTML = `
      <div class="edit-form">
        <h2>Edit Project</h2>
        <form id="editProjectForm">
          <div class="form-group">
            <label for="editTitle">Title</label>
            <input type="text" id="editTitle" name="title" value="${project.title}" required>
          </div>
          <div class="form-group">
            <label for="editDescription">Description</label>
            <textarea id="editDescription" name="description" required>${project.description}</textarea>
          </div>
          <div class="form-group">
            <label for="editStatus">Status</label>
            <select id="editStatus" name="status">
              <option value="in_progress" ${project.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="save-btn">Save Changes</button>
            <button type="button" class="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(editForm);

    // Add event listeners
    const form = editForm.querySelector('#editProjectForm') as HTMLFormElement;
    const cancelBtn = editForm.querySelector('.cancel-btn') as HTMLButtonElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const updatedProject = {
        title: (document.getElementById('editTitle') as HTMLInputElement).value,
        description: (document.getElementById('editDescription') as HTMLTextAreaElement).value,
        status: (document.getElementById('editStatus') as HTMLSelectElement).value
      };

      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role !== 'admin') {
          alert('You need admin privileges to update projects');
          return;
        }

        console.log('Updating project with data:', updatedProject);
        const updateResponse = await fetch(`http://localhost:3000/projects/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedProject)
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('Update failed with response:', errorText);
          throw new Error(`Failed to update project: ${errorText}`);
        }

        const updatedData = await updateResponse.json();
        console.log('Project updated successfully:', updatedData);

        closeEditForm();
        await loadProjects();
        alert('Project updated successfully!');
      } catch (error) {
        console.error('Error updating project:', error);
        alert('Failed to update project. Please try again.');
      }
    });

    cancelBtn.addEventListener('click', closeEditForm);
  } catch (error) {
    console.error('Error editing project:', error);
    alert('Failed to load project details. Please try again.');
  }
}

// Close edit form
function closeEditForm() {
  const overlay = document.querySelector('.edit-form-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Delete project functionality
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
      alert('Your session has expired. Please login again.');
      window.location.href = 'login.html';
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete project: ${errorText}`);
    }

    alert('Project deleted successfully!');
    await loadProjects();
  } catch (error) {
    console.error('Error deleting project:', error);
    alert('Failed to delete project. Please try again.');
  }
}

// Add function to load projects into select
async function loadProjectsIntoSelect(): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = 'login.html';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const projects = await response.json();
    const projectSelect = document.getElementById('projectSelect') as HTMLSelectElement;
    if (!projectSelect) return;

    // Filter out already assigned projects
    const unassignedProjects = projects.filter((project: Project) => !project.assignedTo);

    projectSelect.innerHTML = `
      <option value="">Select a project...</option>
      ${unassignedProjects.map((project: Project) => `
        <option value="${project.id}">${project.title}</option>
      `).join('')}
    `;

    // Update project count in dashboard
    const projectCountElement = document.querySelector('.card-total:nth-child(1) h1');
    if (projectCountElement) {
      projectCountElement.textContent = projects.length.toString();
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Add function to load users into select
async function loadUsers(): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = 'login.html';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users: User[] = await response.json();
    const userSelect = document.getElementById('userSelect') as HTMLSelectElement;
    if (!userSelect) return;

    userSelect.innerHTML = `
      <option value="">Select a user...</option>
      ${users
        .map(
          (user) => `
          <option value="${user.id}">${user.name} (${user.email})</option>
        `
        )
        .join('')}
    `;
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Update initializeAdmin function to add form submit handler
function initializeAdmin(): void {
  console.log('Initializing admin functionality');
  const token = localStorage.getItem('token');
  console.log('Current token in admin init:', token);

  // Add form submit handler
  const assignProjectForm = document.getElementById('assignProjectForm');
  if (assignProjectForm) {
    console.log('Assign project form found, adding submit listener');
    assignProjectForm.addEventListener('submit', handleAssignProjectForm);
  } else {
    console.log('Assign project form not found');
  }

  // Load initial data
  loadProjects();
  loadUsers();
  loadProjectsIntoSelect();
  updateDashboardCounts();
}

// Login functionality
async function handleLogin(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  
  const email = (form.querySelector('#loginEmail') as HTMLInputElement).value;
  const password = (form.querySelector('#loginPassword') as HTMLInputElement).value;

  console.log('=== LOGIN DEBUG START ===');
  console.log('1. Attempting login with email:', email);
  console.log('2. Password provided:', !!password);

  try {
    console.log('3. Sending request to backend...');
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('4. Response status:', response.status);
    console.log('5. Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('6. Login failed with response:', errorText);
      throw new Error('Login failed: ' + errorText);
    }

    const data = await response.json();
    console.log('7. Login response:', data);
    console.log('8. User role:', data.user?.role);
    console.log('9. Access token exists:', !!data.access_token);
    console.log('10. Access token preview:', data.access_token ? data.access_token.substring(0, 20) + '...' : 'none');

    if (data.user?.role !== 'admin') {
      console.log('11. User is not an admin');
      alert('You need admin privileges to access this page');
      return;
    }

    // Store the token
    localStorage.setItem('token', data.access_token);
    console.log('12. Token stored in localStorage');
    
    // Store user info if needed
    localStorage.setItem('user', JSON.stringify(data.user));
    console.log('13. User info stored in localStorage');

    // Verify storage
    const storedToken = localStorage.getItem('token');
    console.log('14. Stored token matches:', storedToken === data.access_token);
    console.log('15. Stored token preview:', storedToken ? storedToken.substring(0, 20) + '...' : 'none');

    console.log('=== LOGIN DEBUG SUCCESS ===');
    
    // Redirect to admin page
    window.location.href = 'admin.html';
  } catch (error) {
    console.error('=== LOGIN DEBUG ERROR ===');
    console.error('Error details:', error);
    alert('Login failed. Please check your credentials.');
  }
}

// Add function to handle assign project form submission
async function handleAssignProjectForm(event: Event) {
  event.preventDefault();
  console.log('=== ASSIGN PROJECT FORM SUBMIT ===');
  
  const projectSelect = document.getElementById('projectSelect') as HTMLSelectElement;
  const userSelect = document.getElementById('userSelect') as HTMLSelectElement;
  
  if (!projectSelect || !userSelect) {
    console.error('Form elements not found');
    return;
  }

  const projectId = parseInt(projectSelect.value);
  const userId = parseInt(userSelect.value);

  console.log('1. Selected Project ID:', projectId);
  console.log('2. Selected User ID:', userId);

  if (!projectId || !userId) {
    alert('Please select both a project and a user');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    console.log('3. Sending assignment request...');
    const response = await fetch(`http://localhost:3000/projects/${projectId}/assign/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('4. Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('5. Assignment failed:', errorData);
      if (errorData.message?.includes('already assigned')) {
        alert('This user is already assigned to another project. A user can only be assigned to one project at a time.');
      } else {
        alert(`Failed to assign project: ${errorData.message || 'Unknown error'}`);
      }
      return;
    }

    const updatedProject = await response.json();
    console.log('6. Project assigned successfully:', updatedProject);

    // Clear the form
    projectSelect.value = '';
    userSelect.value = '';
    
    // Reload projects and update counts
    await loadProjects();
    await updateDashboardCounts();
    
    alert('Project assigned successfully!');
  } catch (error) {
    console.error('7. Assignment error:', error);
    alert('Failed to assign project. Please try again.');
  }
}

// Add function to update dashboard counts
async function updateDashboardCounts(): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('http://localhost:3000/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    const projects = await response.json();
    
    // Update total projects count
    const totalProjectsElement = document.querySelector('.card-total:nth-child(1) h1');
    if (totalProjectsElement) {
      totalProjectsElement.textContent = projects.length.toString();
    }

    // Update assigned projects count
    const assignedProjects = projects.filter((project: Project) => project.assignedTo);
    const assignedProjectsElement = document.querySelector('.card-total:nth-child(3) h1');
    if (assignedProjectsElement) {
      assignedProjectsElement.textContent = assignedProjects.length.toString();
    }
  } catch (error) {
    console.error('Error updating dashboard counts:', error);
  }
}

// Add function to show assign dialog
function showAssignDialog(projectId: number) {
  const dialog = document.createElement('div');
  dialog.className = 'assign-dialog';
  dialog.innerHTML = `
    <div class="assign-form">
      <h3>Assign Project</h3>
      <p class="assign-info">Note: A user can only be assigned to one project at a time.</p>
      <select id="userSelect">
        <option value="">Select a user...</option>
      </select>
      <div class="buttons">
        <button onclick="assignProject(${projectId})">Assign</button>
        <button onclick="closeAssignDialog()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  loadUsers(); // Load users into the select
}

// Add function to close assign dialog
function closeAssignDialog() {
  const dialog = document.querySelector('.assign-dialog');
  if (dialog) {
    dialog.remove();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, checking for forms');
  
  // Add form submit handler
  const addProjectForm = document.getElementById('addProjectForm');
  if (addProjectForm) {
    console.log('Add project form found, adding submit listener');
    addProjectForm.addEventListener('submit', handleFormSubmit);
  } else {
    console.log('Add project form not found');
  }
  
  // Initialize admin functionality
  initializeAdmin();
});




