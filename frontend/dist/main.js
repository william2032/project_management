// Add debug logs at the start of the file
console.log('Script loaded successfully');
// Global logout function
function handleLogout(e) {
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
        loginForm.addEventListener('submit', async (e) => {
            console.log('Login form submitted');
            e.preventDefault();
            const formData = new FormData(loginForm);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };
            console.log('=== LOGIN DEBUG START ===');
            console.log('1. Attempting login with email:', credentials.email);
            console.log('2. Password provided:', !!credentials.password);
            try {
                console.log('3. Sending request to backend...');
                const response = await fetch('http://localhost:3000/auth/login', {
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
                    }
                    else {
                        console.log('Redirecting to user panel...');
                        window.location.href = 'user.html';
                    }
                }
                else {
                    const error = await response.text();
                    console.error('LOGIN FAILED - Raw response:', error);
                    try {
                        const jsonError = JSON.parse(error);
                        console.error('LOGIN FAILED - Parsed error:', jsonError);
                        alert('Login failed: ' + (jsonError.message || 'Invalid credentials'));
                    }
                    catch {
                        console.error('LOGIN FAILED - Non-JSON response');
                        alert('Login failed: Server error');
                    }
                }
            }
            catch (error) {
                console.error('=== LOGIN NETWORK ERROR ===');
                console.error('Error details:', error);
                alert('Network error. Please try again.');
            }
        });
    }
    // MODIFIED: More lenient token verification for development
    function verifyToken(token) {
        try {
            // TEMPORARY: Accept placeholder token for development
            if (token === 'your-jwt-token') {
                console.warn('⚠️  Using placeholder token - this should be fixed in production!');
                return true; // Allow for development
            }
            // Proper JWT validation
            const parts = token.split('.');
            if (parts.length !== 3)
                return false;
            // Optional: Add expiration check
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                return false;
            }
            return true;
        }
        catch (e) {
            return false;
        }
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
    }
    catch (error) {
        console.error('Error fetching users:', error);
        alert('Error fetching users. Check console for details.');
    }
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
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        alert('Error fetching projects. Check console for details.');
    }
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
async function createProject(title, description) {
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
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');
        if (titleInput && descriptionInput) {
            titleInput.value = '';
            descriptionInput.value = '';
        }
        // Reload projects
        await loadProjects();
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
}
// Load projects functionality
async function loadProjects() {
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
        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load projects: ${errorText}`);
        }
        const projects = await response.json();
        const projectsList = document.getElementById('projectsList');
        if (!projectsList)
            return;
        projectsList.innerHTML = projects
            .map((project) => `
        <div class="project-card" data-project-id="${project.id}">
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <p>Status: ${project.status}</p>
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
    }
    catch (error) {
        console.error('Error loading projects:', error);
        alert('Failed to load projects. Please refresh the page.');
    }
}
// Edit project functionality
async function editProject(id) {
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
        const form = editForm.querySelector('#editProjectForm');
        const cancelBtn = editForm.querySelector('.cancel-btn');
        form.addEventListener('submit', async (e) => {
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
            }
            catch (error) {
                console.error('Error updating project:', error);
                alert('Failed to update project. Please try again.');
            }
        });
        cancelBtn.addEventListener('click', closeEditForm);
    }
    catch (error) {
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
async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?'))
        return;
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
    }
    catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
    }
}
async function loadUsers() {
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
        const users = await response.json();
        const userSelect = document.getElementById('userSelect');
        if (!userSelect)
            return;
        userSelect.innerHTML = users
            .map((user) => `
        <option value="${user.id}">${user.name} (${user.email})</option>
      `)
            .join('');
    }
    catch (error) {
        console.error('Error loading users:', error);
    }
}
// Initialize admin functionality
function initializeAdmin() {
    console.log('Initializing admin functionality');
    const token = localStorage.getItem('token');
    console.log('Current token in admin init:', token);
    // Load initial data
    loadProjects();
    loadUsers();
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
// Login functionality
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('#loginEmail').value;
    const password = form.querySelector('#loginPassword').value;
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
    }
    catch (error) {
        console.error('=== LOGIN DEBUG ERROR ===');
        console.error('Error details:', error);
        alert('Login failed. Please check your credentials.');
    }
}
export {};
