var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Add debug logs at the start of the file
console.log('Script loaded successfully');
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
    // Redirect to login page
    window.location.href = 'login.html';
}
// Initialize logout button when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout');
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
    console.log('DOM Content Loaded');
    console.log('Checking for forms...');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
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
        console.log('Show users button initialized');
    }
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchAndDisplayUsers);
        console.log('Refresh button initialized');
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
            const response = yield fetch('http://localhost:3000/users', {
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
            const users = yield response.json();
            console.log('Users fetched:', users);
            displayUsers(users);
            updateUserCount(users.length);
        }
        catch (error) {
            console.error('Error fetching users:', error);
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
            console.error('Error fetching projects:', error);
            alert('Error fetching projects. Check console for details.');
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
            console.log('Project created:', data);
            // Clear form
            const titleInput = document.getElementById('title');
            const descriptionInput = document.getElementById('description');
            if (titleInput && descriptionInput) {
                titleInput.value = '';
                descriptionInput.value = '';
            }
            // Reload projects
            yield loadProjects();
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
            console.error('Error creating project:', error);
            alert('Failed to create project. Please try again.');
        }
    });
}
// Load projects functionality
function loadProjects() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=== LOAD PROJECTS START ===');
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        try {
            console.log('1. Fetching projects...');
            const response = yield fetch('http://localhost:3000/projects', {
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
                const errorText = yield response.text();
                console.error('4. Error response:', errorText);
                throw new Error(`Failed to load projects: ${errorText}`);
            }
            const projects = yield response.json();
            console.log('5. Projects loaded:', projects.length);
            console.log('6. Projects data:', JSON.stringify(projects, null, 2));
            const projectsList = document.getElementById('projectsList');
            if (!projectsList) {
                console.error('7. Projects list element not found');
                return;
            }
            projectsList.innerHTML = projects
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
        }
        catch (error) {
            console.error('=== LOAD PROJECTS ERROR ===');
            console.error('Error details:', error);
            alert('Failed to load projects. Please refresh the page.');
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
            const form = editForm.querySelector('#editProjectForm');
            const cancelBtn = editForm.querySelector('.cancel-btn');
            form.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
                e.preventDefault();
                const updatedProject = {
                    title: document.getElementById('editTitle').value,
                    description: document.getElementById('editDescription').value,
                    status: document.getElementById('editStatus').value
                };
                try {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (user.role !== 'admin') {
                        alert('You need admin privileges to update projects');
                        return;
                    }
                    console.log('Updating project with data:', updatedProject);
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
                        console.error('Update failed with response:', errorText);
                        throw new Error(`Failed to update project: ${errorText}`);
                    }
                    const updatedData = yield updateResponse.json();
                    console.log('Project updated successfully:', updatedData);
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
            console.error('Error editing project:', error);
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
            console.error('Error deleting project:', error);
            alert('Failed to delete project. Please try again.');
        }
    });
}
// Add function to load projects into select
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
            const projects = yield response.json();
            const projectSelect = document.getElementById('projectSelect');
            if (!projectSelect)
                return;
            // Filter out already assigned projects
            const unassignedProjects = projects.filter((project) => !project.assignedTo);
            projectSelect.innerHTML = `
      <option value="">Select a project...</option>
      ${unassignedProjects.map((project) => `
        <option value="${project.id}">${project.title}</option>
      `).join('')}
    `;
            // Update project count in dashboard
            const projectCountElement = document.querySelector('.card-total:nth-child(1) h1');
            if (projectCountElement) {
                projectCountElement.textContent = projects.length.toString();
            }
        }
        catch (error) {
            console.error('Error loading projects:', error);
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
// Update initializeAdmin function to add form submit handler
function initializeAdmin() {
    console.log('Initializing admin functionality');
    const token = localStorage.getItem('token');
    console.log('Current token in admin init:', token);
    // Add form submit handler
    const assignProjectForm = document.getElementById('assignProjectForm');
    if (assignProjectForm) {
        console.log('Assign project form found, adding submit listener');
        assignProjectForm.addEventListener('submit', handleAssignProjectForm);
    }
    else {
        console.log('Assign project form not found');
    }
    // Load initial data
    loadProjects();
    loadUsers();
    loadProjectsIntoSelect();
    updateDashboardCounts();
}
// Login functionality
function handleLogin(event) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
            });
            if (!response.ok) {
                const errorText = yield response.text();
                throw new Error('Login failed: ' + errorText);
            }
            const data = yield response.json();
            // Store the token and user data
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            // Redirect based on user role
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
    });
}
// Add function to handle assign project form submission
function handleAssignProjectForm(event) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        event.preventDefault();
        console.log('=== ASSIGN PROJECT FORM SUBMIT ===');
        const projectSelect = document.getElementById('projectSelect');
        const userSelect = document.getElementById('userSelect');
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
            const response = yield fetch(`http://localhost:3000/projects/${projectId}/assign/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('4. Response status:', response.status);
            if (!response.ok) {
                const errorData = yield response.json();
                console.error('5. Assignment failed:', errorData);
                if ((_a = errorData.message) === null || _a === void 0 ? void 0 : _a.includes('already assigned')) {
                    alert('This user is already assigned to another project. A user can only be assigned to one project at a time.');
                }
                else {
                    alert(`Failed to assign project: ${errorData.message || 'Unknown error'}`);
                }
                return;
            }
            const updatedProject = yield response.json();
            console.log('6. Project assigned successfully:', updatedProject);
            // Clear the form
            projectSelect.value = '';
            userSelect.value = '';
            // Reload projects and update counts
            yield loadProjects();
            yield updateDashboardCounts();
            alert('Project assigned successfully!');
        }
        catch (error) {
            console.error('7. Assignment error:', error);
            alert('Failed to assign project. Please try again.');
        }
    });
}
// Add function to update dashboard counts
function updateDashboardCounts() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = localStorage.getItem('token');
        if (!token)
            return;
        try {
            const response = yield fetch('http://localhost:3000/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }
            const projects = yield response.json();
            // Update total projects count
            const totalProjectsElement = document.querySelector('.card-total:nth-child(1) h1');
            if (totalProjectsElement) {
                totalProjectsElement.textContent = projects.length.toString();
            }
            // Update assigned projects count
            const assignedProjects = projects.filter((project) => project.assignedTo);
            const assignedProjectsElement = document.querySelector('.card-total:nth-child(3) h1');
            if (assignedProjectsElement) {
                assignedProjectsElement.textContent = assignedProjects.length.toString();
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
    console.log('DOM loaded, checking for forms');
    // Add form submit handler
    const addProjectForm = document.getElementById('addProjectForm');
    if (addProjectForm) {
        console.log('Add project form found, adding submit listener');
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
    // Initialize logout button - THIS IS THE CRUCIAL PART
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
        console.log('Logout button initialized'); // For debugging
    }
    else {
        console.error('Logout button not found'); // For debugging
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
export {};
//# sourceMappingURL=main.js.map