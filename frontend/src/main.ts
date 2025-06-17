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
  assignedAt: string;
  id: number;
  title: string;
  description: string;
  status: string;
  completedAt?: string;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt?: string;
  dueDate?: string;
}

// Global logout function
function handleLogout(e?: Event) {
  if (e) {
    e.preventDefault();
    e.stopPropagation(); // Add this to prevent any parent event handlers
  }
  
  // Clear all authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.clear();
  
  window.location.href = 'login.html';
}

// Initialize logout button when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logout') as HTMLButtonElement;
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
    console.log('Logout button initialized');
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

  // Clear existing content
  usersTable.innerHTML = '';

  // Create a container for user cards
  const usersContainer = document.createElement('div');
  usersContainer.className = 'users-container';

  // Populate container with user cards
  users.forEach(user => {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.innerHTML = `
      <div class="user-card-header">
        <div class="user-avatar">
          <i class="fa-regular fa-user"></i>
        </div>
        <div class="user-role ${user.role.toLowerCase()}">
          ${user.role}
        </div>
      </div>
      <div class="user-card-body">
        <h3 class="user-name">${user.name}</h3>
        <p class="user-email">
          <i class="fa-regular fa-envelope"></i>
          ${user.email}
        </p>
      </div>
      <div class="user-card-footer">
        <button class="view-profile-btn" data-user-id="${user.id}">
          <i class="fa-solid fa-eye"></i>
          View Profile
        </button>
      </div>
    `;

    // Add hover effect class
    card.classList.add('hover-effect');

    // Add click event for view profile
    const viewProfileBtn = card.querySelector('.view-profile-btn');
    if (viewProfileBtn) {
      viewProfileBtn.addEventListener('click', () => {
        viewUserProfile(user.id);
      });
    }

    usersContainer.appendChild(card);
  });

  // Add the container to the page
  usersTable.appendChild(usersContainer);
}

// Add function to view user profile
async function viewUserProfile(userId: number) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    const response = await fetch(`http://localhost:3000/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }

    const user = await response.json();

    // Create and show profile modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>User Profile</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="user-profile">
            <div class="profile-avatar">
              <i class="fa-regular fa-user"></i>
            </div>
            <div class="profile-info">
              <h3>${user.name}</h3>
              <p><i class="fa-regular fa-envelope"></i> ${user.email}</p>
              <p><i class="fa-solid fa-user-tag"></i> ${user.role}</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-close">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners for modal close
    const closeButtons = modal.querySelectorAll('.close-modal, .btn-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        modal.remove();
      });
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  } catch (error) {
    console.error('Error viewing user profile:', error);
    alert('Failed to load user profile. Please try again.');
  }
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
        <div class="timeline-info">
          <p><i class="fa-solid fa-calendar-plus"></i> Created: ${formatDate(project.createdAt || project.assignedAt)}</p>
          ${project.assignedAt ? `<p><i class="fa-regular fa-calendar"></i> Assigned: ${formatDate(project.assignedAt)}</p>` : ''}
          ${project.dueDate ? `<p><i class="fa-regular fa-clock"></i> Due: ${formatDate(project.dueDate)}</p>` : ''}
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
    
    // Reload all project-related data
    console.log('Reloading project data...');
    await Promise.all([
      loadProjects(),
      loadProjectsIntoSelect(),
      updateDashboardCounts()
    ]);
    
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
    console.error('No token found, redirecting to login');
    window.location.href = 'login.html';
    return;
  }

  try {
    console.log('1. Fetching projects...');
    const response = await fetch('http://localhost:3000/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    console.log('2. Response status:', response.status);
    console.log('3. Response ok:', response.ok);

    if (response.status === 401) {
      console.error('Unauthorized access, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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

    // Display regular projects
    const projectsList = document.getElementById('projectsList');
    if (!projectsList) {
      console.error('7. Projects list element not found');
      return;
    }

    // Filter active projects
    const activeProjects = projects.filter((project: Project) => project.status !== 'completed');
    console.log('8. Active projects:', activeProjects.length);

    projectsList.innerHTML = activeProjects
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

    console.log('9. Active projects rendered to DOM');

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

    // Display completed projects
    displayCompletedProjects(projects);

    // Update dashboard counts
    await updateDashboardCounts(projects);

    console.log('10. All projects loaded and displayed successfully');
    console.log('=== LOAD PROJECTS END ===');
  } catch (error) {
    console.error('=== LOAD PROJECTS ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Show error message to user
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.innerHTML = `
      <i class="fa-solid fa-exclamation-triangle"></i>
      <p>Failed to load projects. Please try again.</p>
      <button onclick="window.location.reload()">Refresh Page</button>
    `;
    document.body.appendChild(errorMessage);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
      errorMessage.remove();
    }, 5000);
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

// Update loadProjectsIntoSelect function to allow reassignment after completion
async function loadProjectsIntoSelect(): Promise<void> {
  console.log('Loading projects into select...');
  const token = localStorage.getItem('token');
  if (!token) {
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

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = 'login.html';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const projects = await response.json();
    console.log('Total projects loaded:', projects.length);
    
    const projectSelect = document.getElementById('projectSelect') as HTMLSelectElement;
    if (!projectSelect) {
      console.error('Project select element not found');
      return;
    }

    // Filter out only currently assigned projects (not completed ones)
    const availableProjects = projects.filter((project: Project) => {
      const isAvailable = !project.assignedTo || project.status === 'completed';
      console.log(`Project ${project.title}: assigned=${!!project.assignedTo}, status=${project.status}, available=${isAvailable}`);
      return isAvailable;
    });
    
    console.log('Available projects for assignment:', availableProjects.length);

    // Store current selection
    const currentValue = projectSelect.value;

    // Update options
    if (availableProjects.length === 0) {
      projectSelect.innerHTML = `
        <option value="">No available projects to assign</option>
      `;
      projectSelect.disabled = true;
    } else {
      projectSelect.innerHTML = `
        <option value="">Select a project...</option>
        ${availableProjects.map((project: Project) => `
          <option value="${project.id}">${project.title}</option>
        `).join('')}
      `;
      projectSelect.disabled = false;
    }

    // Restore selection if possible
    if (currentValue) {
      projectSelect.value = currentValue;
    }

    // Update project count in dashboard
    const projectCountElement = document.querySelector('.card-total:nth-child(1) h1');
    if (projectCountElement) {
      projectCountElement.textContent = projects.length.toString();
    }

    console.log('Projects loaded into select successfully');
  } catch (error) {
    console.error('Error loading projects into select:', error);
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

    // Filter out admin users - only show regular users
    const regularUsers = users.filter(user => user.role !== 'admin');
    
    userSelect.innerHTML = `
      <option value="">Select a user...</option>
      ${regularUsers
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

// Update initializeAdmin function
function initializeAdmin(): void {
  console.log('Initializing admin functionality');
  const token = localStorage.getItem('token');
  console.log('Current token in admin init:', token);

  if (!token) {
    console.error('No token found in admin init');
    window.location.href = 'login.html';
    return;
  }

  try {
    // Add form submit handler
    const assignProjectForm = document.getElementById('assignProjectForm');
    if (assignProjectForm) {
      console.log('Assign project form found, adding submit listener');
      assignProjectForm.addEventListener('submit', handleAssignProjectForm);
    } else {
      console.log('Assign project form not found');
    }

    // Initialize search functionality
    initializeSearch();

    // Load initial data
    console.log('Loading initial data...');
    loadProjects().catch(error => {
      console.error('Error loading projects:', error);
    });
    
    loadUsers().catch(error => {
      console.error('Error loading users:', error);
    });
    
    loadProjectsIntoSelect().catch(error => {
      console.error('Error loading projects into select:', error);
    });
    
    updateDashboardCounts().catch(error => {
      console.error('Error updating dashboard counts:', error);
    });
  } catch (error) {
    console.error('Error in initializeAdmin:', error);
  }
}

// Login functionality
async function handleLogin(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  
  const email = (form.querySelector('#loginEmail') as HTMLInputElement).value;
  const password = (form.querySelector('#loginPassword') as HTMLInputElement).value;

  try {
    console.log('Attempting login for:', email);
    
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Add this to handle cookies
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
    localStorage.setItem('user', JSON.stringify(data.user));

    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = 'Login successful! Redirecting...';
    document.body.appendChild(successMessage);

    // Redirect based on user role after a short delay
    setTimeout(() => {
      if (data.user?.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'user.html';
      }
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);
    
    // Show error message to user
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = error instanceof Error ? error.message : 'Login failed. Please try again.';
    document.body.appendChild(errorMessage);

    // Remove error message after 3 seconds
    setTimeout(() => {
      errorMessage.remove();
    }, 3000);
  }
}

// Update handleAssignProjectForm to refresh the select after assignment
async function handleAssignProjectForm(event: Event) {
  event.preventDefault();
  // console.log('=== ASSIGN PROJECT FORM SUBMIT ===');
  
  const projectSelect = document.getElementById('projectSelect') as HTMLSelectElement;
  const userSelect = document.getElementById('userSelect') as HTMLSelectElement;
  
  if (!projectSelect || !userSelect) {
    console.error('Form elements not found');
    return;
  }

  const projectId = parseInt(projectSelect.value);
  const userId = parseInt(userSelect.value);

  // console.log('1. Selected Project ID:', projectId);
  // console.log('2. Selected User ID:', userId);

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
    
    // Reload all project-related data
    console.log('7. Reloading project data...');
    await Promise.all([
      loadProjects(),
      loadProjectsIntoSelect(),
      updateDashboardCounts()
    ]);
    
    alert('Project assigned successfully!');
  } catch (error) {
    console.error('7. Assignment error:', error);
    alert('Failed to assign project. Please try again.');
  }
}

// Update the updateDashboardCounts function
async function updateDashboardCounts(projects?: Project[]): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    let projectsData: Project[] = [];
    if (!projects) {
      const response = await fetch('http://localhost:3000/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      projectsData = await response.json();
    } else {
      projectsData = projects;
    }
    
    // Update total projects count
    const totalProjectsElement = document.querySelector('.card-total:nth-child(1) h1');
    if (totalProjectsElement) {
      totalProjectsElement.textContent = projectsData.length.toString();
    }

    // Update assigned projects count
    const assignedProjects = projectsData.filter((project: Project) => project.assignedTo);
    const assignedProjectsElement = document.querySelector('.card-total:nth-child(3) h1');
    if (assignedProjectsElement) {
      assignedProjectsElement.textContent = assignedProjects.length.toString();
    }

    // Update completed projects count
    const completedProjects = projectsData.filter((project: Project) => project.status === 'completed');
    const completedProjectsElement = document.querySelector('.card-total:nth-child(4) h1');
    if (completedProjectsElement) {
      completedProjectsElement.textContent = completedProjects.length.toString();
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


function initializeUserDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Update the UI with user's name
  const userNameElement = document.querySelector('.right h4');
  if (userNameElement && user.name) {
    userNameElement.textContent = user.name;
  }

  // Load user-specific content
  if (user.id) {
    loadUserProjects(user.id);
  }
}

async function loadUserProjects(userId: number) {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch(`http://localhost:3000/users/${userId}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const projects = await response.json();
      // Display the projects in the user dashboard
      displayProjects(projects);
    }
  } catch (error) {
    console.error('Error loading user projects:', error);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  // Check which page we're on
  if (document.querySelector('.dashboard-section')) {
    // Admin dashboard
    initializeAdmin();
  } else if (document.querySelector('.content')) {
    // User dashboard
    initializeUserDashboard();
  }

  // Common initialization (login/register forms, etc.)
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin(e);
    });
  }
});

// Update displayCompletedProjects function to show more details
function displayCompletedProjects(projects: Project[]) {
  const completedProjectsList = document.getElementById('completedProjectsList');
  if (!completedProjectsList) return;

  // Filter completed projects
  const completedProjects = projects.filter(project => project.status === 'completed');
  console.log('Completed projects:', completedProjects.length);

  if (completedProjects.length === 0) {
    completedProjectsList.innerHTML = `
      <div class="no-projects">
        <i class="fa-regular fa-calendar-check"></i>
        <p>No completed projects yet</p>
      </div>
    `;
    return;
  }

  // Sort completed projects by completion date (newest first)
  completedProjects.sort((a, b) => {
    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return dateB - dateA;
  });

  completedProjectsList.innerHTML = completedProjects
    .map(
      (project: Project) => `
        <div class="project-card completed" data-project-id="${project.id}">
          <div class="project-header">
            <h3>${project.title}</h3>
            <span class="status completed">Completed</span>
          </div>
          <p class="description">${project.description}</p>
          <div class="project-details">
            <p><i class="fa-solid fa-user"></i> Completed by: ${project.assignedTo?.name || 'Unknown'}</p>
            <p><i class="fa-regular fa-calendar-check"></i> Completed on: ${formatDate(project.completedAt || '')}</p>
            <p><i class="fa-regular fa-calendar"></i> Assigned on: ${formatDate(project.assignedAt || '')}</p>
          </div>
          <div class="project-actions">
            <button class="view-btn" data-project-id="${project.id}">View Details</button>
          </div>
        </div>

      `    )
    .join('');

  // Add event listeners to view buttons
  completedProjectsList.querySelectorAll('.view-btn').forEach(button => {
    button.addEventListener('click', () => {
      const projectId = button.getAttribute('data-project-id');
      if (projectId) {
        viewCompletedProjectDetails(parseInt(projectId));
      }
    });
  });
}

// Add formatDate helper function if not already present
function formatDate(dateString: string): string {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Add function to view completed project details
async function viewCompletedProjectDetails(id: number) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You need to login first');
      window.location.href = 'login.html';
      return;
    }

    const response = await fetch(`http://localhost:3000/projects/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project details');
    }

    const project = await response.json();

    // Create and show details modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${project.title}</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="project-info">
            <div class="info-section">
              <h3>Description</h3>
              <p>${project.description}</p>
            </div>
            <div class="info-section">
              <h3>Status</h3>
              <span class="status completed">Completed</span>
            </div>
            <div class="info-section">
              <h3>Completion Details</h3>
              <div class="timeline-info">
                <p><i class="fa-solid fa-user"></i> Completed by: ${project.assignedTo?.name || 'Unknown'}</p>
                <p><i class="fa-regular fa-calendar-check"></i> Completed on: ${formatDate(project.completedAt || '')}</p>
                <p><i class="fa-regular fa-calendar"></i> Assigned on: ${formatDate(project.assignedAt || '')}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-close">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners for modal close
    const closeButtons = modal.querySelectorAll('.close-modal, .btn-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        modal.remove();
      });
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  } catch (error) {
    console.error('Error viewing completed project:', error);
    alert('Failed to load project details. Please try again.');
  }
}

// Add search functionality
function initializeSearch() {
  // User search
  const userSearch = document.getElementById('userSearch') as HTMLInputElement;
  if (userSearch) {
    userSearch.addEventListener('input', (e) => {
      const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
      const userCards = document.querySelectorAll('.user-card');
      
      userCards.forEach(card => {
        const userName = card.querySelector('.user-name')?.textContent?.toLowerCase() || '';
        const userEmail = card.querySelector('.user-email')?.textContent?.toLowerCase() || '';
        const userRole = card.querySelector('.user-role')?.textContent?.toLowerCase() || '';
        
        if (userName.includes(searchTerm) || userEmail.includes(searchTerm) || userRole.includes(searchTerm)) {
          (card as HTMLElement).style.display = 'block';
        } else {
          (card as HTMLElement).style.display = 'none';
        }
      });
    });
  }

  // Project search
  const projectSearch = document.getElementById('projectSearch') as HTMLInputElement;
  if (projectSearch) {
    projectSearch.addEventListener('input', (e) => {
      const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
      const projectCards = document.querySelectorAll('.project-card:not(.completed)');
      
      projectCards.forEach(card => {
        const projectTitle = card.querySelector('h3')?.textContent?.toLowerCase() || '';
        const projectDescription = card.querySelector('.description')?.textContent?.toLowerCase() || '';
        const projectStatus = card.querySelector('.status')?.textContent?.toLowerCase() || '';
        const assignedTo = card.querySelector('.assigned-user')?.textContent?.toLowerCase() || '';
        
        if (projectTitle.includes(searchTerm) || 
            projectDescription.includes(searchTerm) || 
            projectStatus.includes(searchTerm) || 
            assignedTo.includes(searchTerm)) {
          (card as HTMLElement).style.display = 'block';
        } else {
          (card as HTMLElement).style.display = 'none';
        }
      });
    });
  }

  // Completed project search
  const completedProjectSearch = document.getElementById('completedProjectSearch') as HTMLInputElement;
  if (completedProjectSearch) {
    completedProjectSearch.addEventListener('input', (e) => {
      const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
      const completedProjectCards = document.querySelectorAll('.project-card.completed');
      
      completedProjectCards.forEach(card => {
        const projectTitle = card.querySelector('h3')?.textContent?.toLowerCase() || '';
        const projectDescription = card.querySelector('.description')?.textContent?.toLowerCase() || '';
        const completedBy = card.querySelector('.project-details p:first-child')?.textContent?.toLowerCase() || '';
        const completedDate = card.querySelector('.project-details p:nth-child(2)')?.textContent?.toLowerCase() || '';
        
        if (projectTitle.includes(searchTerm) || 
            projectDescription.includes(searchTerm) || 
            completedBy.includes(searchTerm) || 
            completedDate.includes(searchTerm)) {
          (card as HTMLElement).style.display = 'block';
        } else {
          (card as HTMLElement).style.display = 'none';
        }
      });
    });
  }
}