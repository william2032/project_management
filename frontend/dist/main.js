var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Global logout function
function handleLogout(e) {
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
            document.querySelectorAll('.section').forEach((section) => {
                section.style.display = 'none';
            });
            // Show the selected section
            const targetSection = document.querySelector(`.${sectionToShow}-section`);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
            // Removing active class from all sidebar items
            sidebarItems.forEach((i) => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
    // Show dashboard by default - WITH NULL CHECKS
    const dashboardSection = document.querySelector('.dashboard-section');
    const dashboardMenuItem = document.querySelector('.sidebar li[data-section="dashboard"]');
    if (dashboardSection) {
        dashboardSection.style.display = 'block';
    }
    else {
        console.warn('Dashboard section not found in DOM');
    }
    if (dashboardMenuItem) {
        dashboardMenuItem.classList.add('active');
    }
    else {
        console.warn('Dashboard menu item not found in DOM');
    }
});
//API Base URL
const API_URL = 'http://localhost:3000/users';
//show API responses
const responseDiv = document.getElementById('response');
function showResponse(message, isError = false) {
    if (responseDiv) {
        responseDiv.textContent = message;
        responseDiv.className = isError ? 'error' : 'success';
        responseDiv.classList.remove('hidden');
    }
}
document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    // Initialize dashboard if on admin page
    if (document.querySelector('.dashboard-section')) {
        fetchAndDisplayUsers();
    }
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Ensure this is called first
            handleLogin(e);
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const userData = {
                email: formData.get('email'),
                name: formData.get('name'),
                password: formData.get('password')
            };
            try {
                const response = yield fetch('http://localhost:3000/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                if (!response.ok) {
                    const errorData = yield response.json();
                    throw new Error(errorData.message || 'Registration failed');
                }
                const data = yield response.json();
                showResponse('Registration successful! Redirecting to login...', false);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
            catch (error) {
                console.error('Registration error:', error);
                showResponse(error instanceof Error ? error.message : 'Registration failed. Please try again.', true);
            }
        }));
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
    }
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchAndDisplayUsers);
    }
}
function fetchAndDisplayUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        // Check if token exists
        if (!token) {
            alert('You need to login first');
            window.location.href = 'login.html';
            return;
        }
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
            const response = yield fetch('http://localhost:3000/users', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
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
            const users = yield response.json();
            displayUsers(users);
            updateUserCount(users.length);
        }
        catch (error) {
            alert('Error fetching users. Check console for details.');
        }
    });
}
function updateUserCount(count) {
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
function displayUsers(users) {
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
function viewUserProfile(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
            const response = yield fetch(`http://localhost:3000/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }
            const user = yield response.json();
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
        }
        catch (error) {
            console.error('Error viewing user profile:', error);
            alert('Failed to load user profile. Please try again.');
        }
    });
}
// Project Management Functions
function fetchAndDisplayProjects() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You need to login first');
            window.location.href = 'login.html';
            return;
        }
        try {
            const response = yield fetch('http://localhost:3000/projects', {
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
            const projects = yield response.json();
            displayProjects(projects);
        }
        catch (error) {
            alert('Error fetching projects. Try logging In Again');
        }
    });
}
function displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    if (!projectsList)
        return;
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
function handleFormSubmit(e) {
    e.preventDefault();
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
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
function createProject(title, description) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('You need to login first');
                window.location.href = 'login.html';
                return;
            }
            const response = yield fetch('http://localhost:3000/projects', {
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
                const errorText = yield response.text();
                throw new Error(`Failed to create project: ${errorText}`);
            }
            const data = yield response.json();
            // Clear form
            const titleInput = document.getElementById('title');
            const descriptionInput = document.getElementById('description');
            if (titleInput && descriptionInput) {
                titleInput.value = '';
                descriptionInput.value = '';
            }
            // Reload all project-related data
            yield Promise.all([
                loadProjects(),
                loadProjectsIntoSelect(),
                updateDashboardCounts()
            ]);
            // Show success message
            alert('Project created successfully!');
            // Switch to projects section
            const projectsSection = document.querySelector('.projects-section');
            const addProjectSection = document.querySelector('.add-project-section');
            if (projectsSection && addProjectSection) {
                projectsSection.style.display = 'block';
                addProjectSection.style.display = 'none';
            }
        }
        catch (error) {
            alert('Failed to create project. Please try again.');
        }
    });
}
// Load projects functionality
function loadProjects() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        try {
            const response = yield fetch('http://localhost:3000/projects', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            if (!response.ok) {
                const errorText = yield response.text();
                throw new Error(`Failed to load projects: ${errorText}`);
            }
            const projects = yield response.json();
            // Display regular projects
            const projectsList = document.getElementById('projectsList');
            if (!projectsList) {
                return;
            }
            // Filter active projects
            const activeProjects = projects.filter((project) => project.status !== 'completed');
            projectsList.innerHTML = activeProjects
                .map((project) => `
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
        `)
                .join('');
            // Add event listeners to buttons
            projectsList.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const projectId = button.getAttribute('data-project-id');
                    if (projectId) {
                        editProject(projectId);
                    }
                });
            });
            projectsList.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const projectId = button.getAttribute('data-project-id');
                    if (projectId) {
                        deleteProject(projectId);
                    }
                });
            });
            // Display completed projects
            displayCompletedProjects(projects);
            // Update dashboard counts
            yield updateDashboardCounts(projects);
        }
        catch (error) {
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
    });
}
// Edit project functionality
function editProject(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('You need to login first');
                window.location.href = 'login.html';
                return;
            }
            // Get current project data
            const response = yield fetch(`http://localhost:3000/projects/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch project details');
            }
            const project = yield response.json();
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
            <p> status: ${project.status === 'in_progress' ? 'in_progress' : 'completed'}</p>
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
            const form = editForm.querySelector('#editProjectForm');
            const cancelBtn = editForm.querySelector('.cancel-btn');
            form.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
                e.preventDefault();
                const updatedProject = {
                    title: document.getElementById('editTitle').value,
                    description: document.getElementById('editDescription').value,
                };
                try {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (user.role !== 'admin') {
                        alert('You need admin privileges to update projects');
                        return;
                    }
                    const updateResponse = yield fetch(`http://localhost:3000/projects/${id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(updatedProject)
                    });
                    if (!updateResponse.ok) {
                        const errorText = yield updateResponse.text();
                        throw new Error(`Failed to update project: ${errorText}`);
                    }
                    const updatedData = yield updateResponse.json();
                    closeEditForm();
                    yield loadProjects();
                    alert('Project updated successfully!');
                }
                catch (error) {
                    console.error('Error updating project:', error);
                    alert('Failed to update project. Please try again.');
                }
            }));
            cancelBtn.addEventListener('click', closeEditForm);
        }
        catch (error) {
            alert('Failed to load project details. Please try again.');
        }
    });
}
// Close edit form
function closeEditForm() {
    const overlay = document.querySelector('.edit-form-overlay');
    if (overlay) {
        overlay.remove();
    }
}
// Delete project functionality
function deleteProject(id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm('Are you sure you want to delete this project?'))
            return;
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You need to login first');
            window.location.href = 'login.html';
            return;
        }
        try {
            const response = yield fetch(`http://localhost:3000/projects/${id}`, {
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
                const errorText = yield response.text();
                throw new Error(`Failed to delete project: ${errorText}`);
            }
            alert('Project deleted successfully!');
            yield loadProjects();
        }
        catch (error) {
            alert('Failed to delete project. Please try again.');
        }
    });
}
// Update loadProjectsIntoSelect function to allow reassignment after completion
function loadProjectsIntoSelect() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        try {
            const response = yield fetch('http://localhost:3000/projects', {
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
            const projects = yield response.json();
            const projectSelect = document.getElementById('projectSelect');
            if (!projectSelect) {
                return;
            }
            // Filter out only currently assigned projects (not completed ones)
            const availableProjects = projects.filter((project) => {
                const isAvailable = !project.assignedTo || project.status === 'completed';
                return isAvailable;
            });
            // Store current selection
            const currentValue = projectSelect.value;
            // Update options
            if (availableProjects.length === 0) {
                projectSelect.innerHTML = `
        <option value="">No available projects to assign</option>
      `;
                projectSelect.disabled = true;
            }
            else {
                projectSelect.innerHTML = `
        <option value="">Select a project...</option>
        ${availableProjects.map((project) => `
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
        }
        catch (error) {
            console.error('Error loading projects into select:', error);
        }
    });
}
// Add function to load users into select
function loadUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        try {
            const response = yield fetch('http://localhost:3000/users', {
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
            const users = yield response.json();
            const userSelect = document.getElementById('userSelect');
            if (!userSelect)
                return;
            userSelect.innerHTML = `
      <option value="">Select a user...</option>
      ${users
                .filter(user => user.role !== 'admin')
                .map((user) => `
          <option value="${user.id}">${user.name} (${user.email})</option>
        `)
                .join('')}
    `;
        }
        catch (error) {
            console.error('Error loading users:', error);
        }
    });
}
// Update initializeAdmin function
function initializeAdmin() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    try {
        // Add form submit handler
        const assignProjectForm = document.getElementById('assignProjectForm');
        if (assignProjectForm) {
            assignProjectForm.addEventListener('submit', handleAssignProjectForm);
        }
        else {
            throw new Error('Assign project form not found');
        }
        // Initialize search functionality
        initializeSearch();
        // Load initial data
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
    }
    catch (error) {
        console.error('Error in initializeAdmin:', error);
    }
}
// Login functionality
function handleLogin(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const form = event.target;
        const email = form.querySelector('#loginEmail').value;
        const password = form.querySelector('#loginPassword').value;
        try {
            const response = yield fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include' // Add this to handle cookies
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
            localStorage.setItem('user', JSON.stringify(data.user));
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Login successful! Redirecting...';
            document.body.appendChild(successMessage);
            // Redirect based on user role after a short delay
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
    });
}
// Update handleAssignProjectForm to refresh the select after assignment
function handleAssignProjectForm(event) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        event.preventDefault();
        const projectSelect = document.getElementById('projectSelect');
        const userSelect = document.getElementById('userSelect');
        if (!projectSelect || !userSelect) {
            console.error('Form elements not found');
            return;
        }
        const projectId = projectSelect.value;
        const userId = userSelect.value;
        console.log(projectId);

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
            const response = yield fetch(`http://localhost:3000/projects/${projectId}/assign/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = yield response.json();
                if ((_a = errorData.message) === null || _a === void 0 ? void 0 : _a.includes('already assigned')) {
                    alert('This user is already assigned to another project. A user can only be assigned to one project at a time.');
                }
                else {
                    alert(`Failed to assign project: ${errorData.message || 'Unknown error'}`);
                }
                return;
            }
            const updatedProject = yield response.json();
            // Clear the form
            projectSelect.value = '';
            userSelect.value = '';
            // Reload all project-related data
            yield Promise.all([
                loadProjects(),
                loadProjectsIntoSelect(),
                updateDashboardCounts()
            ]);
            alert('Project assigned successfully!');
        }
        catch (error) {
            alert('Failed to assign project. Please try again.');
        }
    });
}
// Update the updateDashboardCounts function
function updateDashboardCounts(projects) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = localStorage.getItem('token');
        if (!token)
            return;
        try {
            let projectsData = [];
            if (!projects) {
                const response = yield fetch('http://localhost:3000/projects', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch projects');
                }
                projectsData = yield response.json();
            }
            else {
                projectsData = projects;
            }
            // Update total projects count
            const totalProjectsElement = document.querySelector('.card-total:nth-child(1) h1');
            if (totalProjectsElement) {
                totalProjectsElement.textContent = projectsData.length.toString();
            }
            // Update assigned projects count
            const assignedProjects = projectsData.filter((project) => project.assignedTo);
            const assignedProjectsElement = document.querySelector('.card-total:nth-child(3) h1');
            if (assignedProjectsElement) {
                assignedProjectsElement.textContent = assignedProjects.length.toString();
            }
            // Update completed projects count
            const completedProjects = projectsData.filter((project) => project.status === 'completed');
            const completedProjectsElement = document.querySelector('.card-total:nth-child(4) h1');
            if (completedProjectsElement) {
                completedProjectsElement.textContent = completedProjects.length.toString();
            }
        }
        catch (error) {
            console.error('Error updating dashboard counts:', error);
        }
    });
}
// Add function to show assign dialog
function showAssignDialog(projectId) {
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
    // Add form submit handler
    const addProjectForm = document.getElementById('addProjectForm');
    if (addProjectForm) {
        addProjectForm.addEventListener('submit', handleFormSubmit);
    }
    else {
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
function loadUserProjects(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = localStorage.getItem('token');
            if (!token)
                return;
            const response = yield fetch(`http://localhost:3000/users/${userId}/projects`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const projects = yield response.json();
                // Display the projects in the user dashboard
                displayProjects(projects);
            }
        }
        catch (error) {
            console.error('Error loading user projects:', error);
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we're on
    if (document.querySelector('.dashboard-section')) {
        // Admin dashboard
        initializeAdmin();
    }
    else if (document.querySelector('.content')) {
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
function displayCompletedProjects(projects) {
    const completedProjectsList = document.getElementById('completedProjectsList');
    if (!completedProjectsList)
        return;
    // Filter completed projects
    const completedProjects = projects.filter(project => project.status === 'completed');
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
        .map((project) => {
        var _a;
        return `
        <div class="project-card completed" data-project-id="${project.id}">
          <div class="project-header">
            <h3>${project.title}</h3>
            <span class="status completed">Completed</span>
          </div>
          <p class="description">${project.description}</p>
          <div class="project-details">
            <p><i class="fa-solid fa-user"></i> Completed by: ${((_a = project.assignedTo) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown'}</p>
            <p><i class="fa-regular fa-calendar-check"></i> Completed on: ${formatDate(project.completedAt || '')}</p>
            <p><i class="fa-regular fa-calendar"></i> Assigned on: ${formatDate(project.assignedAt || '')}</p>
          </div>
          <div class="project-actions">
            <button class="view-btn" data-project-id="${project.id}">View Details</button>
          </div>
        </div>

      `;
    })
        .join('');
    // Add event listeners to view buttons
    completedProjectsList.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', () => {
            const projectId = button.getAttribute('data-project-id');
            if (projectId) {
                viewCompletedProjectDetails(projectId);
            }
        });
    });
}
// Add formatDate helper function if not already present
function formatDate(dateString) {
    if (!dateString)
        return 'Not available';
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
function viewCompletedProjectDetails(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('You need to login first');
                window.location.href = 'login.html';
                return;
            }
            const response = yield fetch(`http://localhost:3000/projects/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch project details');
            }
            const project = yield response.json();
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
                <p><i class="fa-solid fa-user"></i> Completed by: ${((_a = project.assignedTo) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown'}</p>
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
        }
        catch (error) {
            alert('Failed to load project details. Please try again.');
        }
    });
}
// Add search functionality
function initializeSearch() {
    // User search
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const userCards = document.querySelectorAll('.user-card');
            userCards.forEach(card => {
                var _a, _b, _c, _d, _e, _f;
                const userName = ((_b = (_a = card.querySelector('.user-name')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                const userEmail = ((_d = (_c = card.querySelector('.user-email')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
                const userRole = ((_f = (_e = card.querySelector('.user-role')) === null || _e === void 0 ? void 0 : _e.textContent) === null || _f === void 0 ? void 0 : _f.toLowerCase()) || '';
                if (userName.includes(searchTerm) || userEmail.includes(searchTerm) || userRole.includes(searchTerm)) {
                    card.style.display = 'block';
                }
                else {
                    card.style.display = 'none';
                }
            });
        });
    }
    // Project search
    const projectSearch = document.getElementById('projectSearch');
    if (projectSearch) {
        projectSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const projectCards = document.querySelectorAll('.project-card:not(.completed)');
            projectCards.forEach(card => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                const projectTitle = ((_b = (_a = card.querySelector('h3')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                const projectDescription = ((_d = (_c = card.querySelector('.description')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
                const projectStatus = ((_f = (_e = card.querySelector('.status')) === null || _e === void 0 ? void 0 : _e.textContent) === null || _f === void 0 ? void 0 : _f.toLowerCase()) || '';
                const assignedTo = ((_h = (_g = card.querySelector('.assigned-user')) === null || _g === void 0 ? void 0 : _g.textContent) === null || _h === void 0 ? void 0 : _h.toLowerCase()) || '';
                if (projectTitle.includes(searchTerm) ||
                    projectDescription.includes(searchTerm) ||
                    projectStatus.includes(searchTerm) ||
                    assignedTo.includes(searchTerm)) {
                    card.style.display = 'block';
                }
                else {
                    card.style.display = 'none';
                }
            });
        });
    }
    // Completed project search
    const completedProjectSearch = document.getElementById('completedProjectSearch');
    if (completedProjectSearch) {
        completedProjectSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const completedProjectCards = document.querySelectorAll('.project-card.completed');
            completedProjectCards.forEach(card => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                const projectTitle = ((_b = (_a = card.querySelector('h3')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                const projectDescription = ((_d = (_c = card.querySelector('.description')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
                const completedBy = ((_f = (_e = card.querySelector('.project-details p:first-child')) === null || _e === void 0 ? void 0 : _e.textContent) === null || _f === void 0 ? void 0 : _f.toLowerCase()) || '';
                const completedDate = ((_h = (_g = card.querySelector('.project-details p:nth-child(2)')) === null || _g === void 0 ? void 0 : _g.textContent) === null || _h === void 0 ? void 0 : _h.toLowerCase()) || '';
                if (projectTitle.includes(searchTerm) ||
                    projectDescription.includes(searchTerm) ||
                    completedBy.includes(searchTerm) ||
                    completedDate.includes(searchTerm)) {
                    card.style.display = 'block';
                }
                else {
                    card.style.display = 'none';
                }
            });
        });
    }
}
export {};
//# sourceMappingURL=main.js.map