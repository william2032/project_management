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
// Initialize user dashboard
function initializeUserDashboard() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Initializing user dashboard');
        // Try to get user from localStorage first
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        if (!token || !(localUser === null || localUser === void 0 ? void 0 : localUser.id)) {
            console.log('No token or user found - redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        // Verify session with backend
        try {
            console.log('Verifying session with backend');
            const response = yield fetch('http://localhost:3000/users/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Include cookies in the request
            });
            console.log('Verification response status:', response.status);
            if (response.status === 401) {
                // Token expired or invalid
                console.log('Session invalid - clearing storage');
                localStorage.clear();
                document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                window.location.href = 'login.html';
                return;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const user = yield response.json();
            console.log('User verified:', user);
            // Update UI with user's information
            const userNameElement = document.querySelector('#usernameDisplay');
            const userRoleElement = document.querySelector('#userRole');
            const welcomeNameElement = document.querySelector('#welcomeName');
            // Use the name from the backend response, fallback to localStorage if needed
            const displayName = user.name || localUser.name;
            if (userNameElement && displayName) {
                userNameElement.textContent = displayName;
            }
            if (userRoleElement && user.role) {
                userRoleElement.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            }
            if (welcomeNameElement && displayName) {
                welcomeNameElement.textContent = displayName;
            }
            // Load user projects
            yield loadUserProjects(user.id);
        }
        catch (error) {
            console.error('Error initializing dashboard:', error);
            localStorage.clear();
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            window.location.href = 'login.html';
        }
    });
}
function initializeSidebarNavigation() {
    const sidebarItems = document.querySelectorAll('.sidebar li');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionToShow = item.getAttribute('data-section');
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.style.display = 'none';
            });
            // Show selected section
            const targetSection = document.querySelector(`.${sectionToShow}-section`);
            if (targetSection) {
                targetSection.style.display = 'block';
                // Reload projects if needed
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (user.id) {
                    loadUserProjects(user.id);
                }
            }
            // Update active state
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}
// Handle logout
function handleLogout() {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
// Load user projects from API
function loadUserProjects(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`[DEBUG] Loading projects for user ${userId}`);
            showLoadingSpinners();
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('[DEBUG] No token found - redirecting to login');
                window.location.href = 'login.html';
                return;
            }
            // Verify the user data first
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!(user === null || user === void 0 ? void 0 : user.id)) {
                console.error('[DEBUG] No user data found');
                throw new Error('User data not found');
            }
            console.log('[DEBUG] Making request to API');
            const response = yield fetch(`http://localhost:3000/users/${userId}/projects`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Important for cookies if using them
            });
            console.log('[DEBUG] Response status:', response.status);
            if (response.status === 401) {
                // Token might be expired - clear storage and redirect
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            if (!response.ok) {
                const errorText = yield response.text();
                console.error('[DEBUG] API Error:', errorText);
                throw new Error(errorText || 'Failed to load projects');
            }
            const projects = yield response.json();
            console.log('[DEBUG] Projects received:', projects);
            if (projects.length === 0) {
                displayNoProjectsMessage();
            }
            else {
                displayProjects(projects);
            }
        }
        catch (error) {
            console.error('[DEBUG] Error loading projects:', error);
            displayErrorMessage(error instanceof Error ? error.message : 'Failed to load projects');
            // Optional: Fallback to mock data in development
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('[DEBUG] Using mock data');
                displayProjects([
                    {
                        id: 'mock-1',
                        title: 'Sample Project',
                        description: 'This is mock data while debugging',
                        status: 'in_progress',
                        assignedAt: new Date().toISOString()
                    }
                ]);
            }
        }
        finally {
            hideLoadingSpinners();
        }
    });
}
function showLoadingSpinners() {
    const currentSpinner = document.getElementById('currentProjectsSpinner');
    const completedSpinner = document.getElementById('completedProjectsSpinner');
    if (currentSpinner)
        currentSpinner.style.display = 'block';
    if (completedSpinner)
        completedSpinner.style.display = 'block';
    // Clear containers while loading
    const currentContainer = document.getElementById('currentProjectsContainer');
    const completedContainer = document.getElementById('completedProjectsContainer');
    if (currentContainer)
        currentContainer.innerHTML = '';
    if (completedContainer)
        completedContainer.innerHTML = '';
}
function hideLoadingSpinners() {
    const currentSpinner = document.getElementById('currentProjectsSpinner');
    const completedSpinner = document.getElementById('completedProjectsSpinner');
    if (currentSpinner)
        currentSpinner.style.display = 'none';
    if (completedSpinner)
        completedSpinner.style.display = 'none';
}
function displayNoProjectsMessage() {
    const currentProjectsContainer = document.getElementById('currentProjectsContainer');
    const completedProjectsContainer = document.getElementById('completedProjectsContainer');
    if (currentProjectsContainer) {
        currentProjectsContainer.innerHTML = `
            <div class="no-projects">
                <i class="fa-regular fa-folder-open"></i>
                <p>No projects assigned</p>
            </div>
        `;
    }
    if (completedProjectsContainer) {
        completedProjectsContainer.innerHTML = `
            <div class="no-projects">
                <i class="fa-regular fa-calendar-check"></i>
                <p>No completed projects yet</p>
            </div>
        `;
    }
}
function displayErrorMessage(message) {
    const currentProjectsContainer = document.getElementById('currentProjectsContainer');
    const completedProjectsContainer = document.getElementById('completedProjectsContainer');
    const errorHtml = `
        <div class="error-message">
            <i class="fa-solid fa-exclamation-triangle"></i>
            <p>Error: ${message}</p>
        </div>
    `;
    if (currentProjectsContainer) {
        currentProjectsContainer.innerHTML = errorHtml;
    }
    if (completedProjectsContainer) {
        completedProjectsContainer.innerHTML = errorHtml;
    }
}
// Display projects in the UI
function displayProjects(projects) {
    const currentProjectsContainer = document.getElementById('currentProjectsContainer');
    const completedProjectsContainer = document.getElementById('completedProjectsContainer');
    if (!currentProjectsContainer || !completedProjectsContainer) {
        console.error('Project containers not found');
        return;
    }
    // Clear existing projects
    currentProjectsContainer.innerHTML = '';
    completedProjectsContainer.innerHTML = '';
    // Separate current and completed projects
    const currentProjects = projects.filter(p => p.status === 'in_progress');
    const completedProjects = projects.filter(p => p.status === 'completed');
    // Display current projects
    if (currentProjects.length > 0) {
        currentProjects.forEach(project => {
            const projectCard = createProjectCard(project);
            currentProjectsContainer.appendChild(projectCard);
        });
    }
    else {
        currentProjectsContainer.innerHTML = `
            <div class="no-projects">
                <i class="fa-regular fa-folder-open"></i>
                <p>No current projects assigned</p>
            </div>
        `;
    }
    // Display completed projects
    if (completedProjects.length > 0) {
        completedProjects.forEach(project => {
            const projectCard = createProjectCard(project, true);
            completedProjectsContainer.appendChild(projectCard);
        });
    }
    else {
        completedProjectsContainer.innerHTML = `
            <div class="no-projects">
                <i class="fa-regular fa-calendar-check"></i>
                <p>No completed projects yet</p>
            </div>
        `;
    }
    // Show current projects by default if not already shown
    const currentSection = document.querySelector('.current-projects-section');
    if (currentSection && window.getComputedStyle(currentSection).display === 'block') {
        return;
    }
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    if (currentSection) {
        currentSection.style.display = 'block';
    }
    // Set active tab
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    const currentTab = document.querySelector('.sidebar li[data-section="current-projects"]');
    if (currentTab)
        currentTab.classList.add('active');
}
// Create project card element
function createProjectCard(project, isCompleted = false) {
    const card = document.createElement('div');
    card.className = 'project-card';
    const statusClass = isCompleted ? 'status-completed' : 'status-in-progress';
    const statusText = isCompleted ? 'Completed' : 'In Progress';
    const assignedDate = formatDate(project.assignedAt);
    const dueDate = project.dueDate ? formatDate(project.dueDate) : null;
    card.innerHTML = `
        <h3>${project.title}</h3>
        <span class="status ${statusClass}">${statusText}</span>
        <p class="description">${project.description}</p>
        <p class="due-date">
            <i class="fa-solid fa-user-tie"></i> 
            Assigned by: ${project.assignedBy || 'Manager'} on ${assignedDate}
        </p>
        ${dueDate ? `
        <p class="due-date">
            <i class="fa-regular fa-calendar"></i> 
            Due: ${dueDate}
        </p>` : ''}
        <div class="actions">
            ${!isCompleted ? `<button class="btn btn-complete" data-project-id="${project.id}">
                <i class="fa-solid fa-check"></i> Mark Complete
            </button>` : ''}
            <button class="btn btn-view" data-project-id="${project.id}">
                <i class="fa-solid fa-eye"></i> View Details
            </button>
        </div>
    `;
    // Add event listeners
    if (!isCompleted) {
        const completeBtn = card.querySelector('.btn-complete');
        if (completeBtn) {
            completeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                markProjectComplete(project.id);
            });
        }
    }
    const viewBtn = card.querySelector('.btn-view');
    if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            viewProjectDetails(project.id);
        });
    }
    // Make entire card clickable if needed
    card.addEventListener('click', () => {
        viewProjectDetails(project.id);
    });
    return card;
}
// Format date for display
function formatDate(dateString) {
    try {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    catch (e) {
        console.error('Error formatting date:', e);
        return dateString; // Return raw string if formatting fails
    }
}
// View project details
function viewProjectDetails(projectId) {
    console.log(`Viewing details for project: ${projectId}`);
    // You can implement a modal, redirect to details page, or expand the card
    alert(`Project details for ${projectId} - Feature to be implemented`);
}
// Mark project as complete
function markProjectComplete(projectId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm('Are you sure you want to mark this project as complete?'))
            return;
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            const response = yield fetch(`http://localhost:3000/projects/${projectId}/complete`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Complete project response:', response.status);
            if (!response.ok) {
                const errorText = yield response.text();
                throw new Error(errorText || 'Failed to update project status');
            }
            // Reload projects
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
                loadUserProjects(user.id);
            }
        }
        catch (error) {
            console.error('Error completing project:', error);
            alert(error instanceof Error ? error.message : 'Failed to update project status');
        }
    });
}
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUserDashboard);
//# sourceMappingURL=user.js.map