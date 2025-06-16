interface Project {
    id: string;
    title: string;
    description: string;
    status: 'in_progress' | 'completed';
    dueDate?: string;
    assignedAt: string;
    assignedBy?: string;
}

// Initialize user dashboard
async function initializeUserDashboard() {
    console.log('Initializing user dashboard');

    // Try to get user from localStorage first
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token || !localUser?.id) {
        //   console.log('No token or user found - redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    // Verify session with backend
    try {
        const response = await fetch('http://localhost:3000/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Include cookies in the request
        });

        console.log('Verification response status:', response.status);

        if (response.status === 401) {
            localStorage.clear();
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const user = await response.json();
        //   console.log('User verified:', user);

        // Update UI with user's information
        const userNameElement = document.querySelector('#usernameDisplay') as HTMLElement;
        const userRoleElement = document.querySelector('#userRole') as HTMLElement;
        const welcomeNameElement = document.querySelector('#welcomeName') as HTMLElement;

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
        await loadUserProjects(user.id);

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        localStorage.clear();
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = 'login.html';
    }
}

// Show section function
function showSection(sectionName: string) {
    // Hide all sections first
    document.querySelectorAll('.section').forEach(section => {
        (section as HTMLElement).style.display = 'none';
    });

    // Show the requested section
    const targetSection = document.querySelector(`.${sectionName}-section`);
    if (targetSection) {
        (targetSection as HTMLElement).style.display = 'block';
    }
}

// Initialize sidebar navigation
function initializeSidebarNavigation() {
    console.log('[DEBUG] Initializing sidebar navigation');

    // Get sidebar elements
    const sidebarList = document.querySelector('.sidebar ul');
    const sidebarItems = document.querySelectorAll('.sidebar li');
    const sections = document.querySelectorAll('.section');

    if (!sidebarList) {
        console.error('[DEBUG] Sidebar list not found!');
        return;
    }

    console.log('[DEBUG] Found sidebar items:', sidebarItems.length);
    console.log('[DEBUG] Found sections:', sections.length);

    // Set default section
    sections.forEach(section => {
        (section as HTMLElement).style.display = 'none';
    });

    const defaultSection = document.querySelector('.current-projects-section');
    if (defaultSection) {
        (defaultSection as HTMLElement).style.display = 'block';
    }

    // Set default active state
    sidebarItems.forEach(item => item.classList.remove('active'));
    const defaultItem = document.querySelector('.sidebar li[data-section="current-projects"]');
    if (defaultItem) {
        defaultItem.classList.add('active');
    }

    // Add click handler to sidebar list
    sidebarList.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('li');
        if (!target) return;

        console.log('[DEBUG] Sidebar item clicked:', target);
        e.preventDefault();

        const section = target.getAttribute('data-section');
        if (!section) {
            console.error('[DEBUG] No data-section attribute found');
            return;
        }

        // Update active state
        sidebarItems.forEach(item => item.classList.remove('active'));
        target.classList.add('active');

        // Show selected section
        sections.forEach(section => {
            (section as HTMLElement).style.display = 'none';
        });

        const targetSection = document.querySelector(`.${section}-section`);
        if (targetSection) {
            (targetSection as HTMLElement).style.display = 'block';
            console.log('[DEBUG] Showing section:', section);
        }

        // Reload projects
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
            loadUserProjects(user.id).then(r => console.log('User loaded'));
        }
    });
}

// Initialize logout button
function initializeLogoutButton() {
    console.log('[DEBUG] Initializing logout button');

    const logoutButton = document.getElementById('logout') as HTMLElement;
    if (!logoutButton) {
        console.error('[DEBUG] Logout button not found!');
        return;
    }

    // Remove existing listeners by cloning
    const newLogoutButton = logoutButton.cloneNode(true);
    if (logoutButton.parentNode) {
        logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
    }

    // Add click handler
    newLogoutButton.addEventListener('click', async (e) => {
        console.log('[DEBUG] Logout button clicked');
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        await handleLogout();
    });

    // Add keyboard handler
    newLogoutButton.addEventListener('keydown', async (e) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
            console.log('[DEBUG] Logout keyboard trigger');
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling
            await handleLogout();
        }
    });
}

// Handle logout
async function handleLogout() {
    try {
        console.log('[DEBUG] Starting logout process');

        // Get the token before clearing storage
        const token = localStorage.getItem('token');
        console.log('[DEBUG] Token found:', !!token);

        // Clear all local storage
        localStorage.clear();
        console.log('[DEBUG] Local storage cleared');

        // Clear all cookies
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
        console.log('[DEBUG] Cookies cleared');

        // If we have a token, try to notify the backend about logout
        if (token) {
            try {
                console.log('[DEBUG] Notifying backend about logout');
                await fetch('http://localhost:3000/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                console.log('[DEBUG] Backend logout notification sent');
            } catch (error) {
                console.error('[DEBUG] Error notifying backend about logout:', error);
                // Continue with logout even if backend notification fails
            }
        }

        console.log('[DEBUG] Redirecting to login page');
        // Redirect to login page
        window.location.href = 'login.html';
    } catch (error) {
        console.error('[DEBUG] Error during logout:', error);
        // Force redirect to login page even if there's an error
        window.location.href = 'login.html';
    }
}

// Load user projects from API
async function loadUserProjects(userId: string) {
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
        const user = JSON.parse(localStorage.getItem('user') || '{ }');
        if (!user?.id) {
            console.error('[DEBUG] No user data found');
            throw new Error('User data not found');
        }

        console.log('[DEBUG] Making request to API');
        const response = await fetch(`http://localhost:3000/users/${userId}/projects`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        console.log('[DEBUG] Response status:', response.status);

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[DEBUG] API Error:', errorText);
            throw new Error(errorText || 'Failed to load projects');
        }

        const projects = await response.json();
        console.log('[DEBUG] Projects received:', projects);

        // Sort projects by status and date
        const sortedProjects = projects.sort((a: Project, b: Project) => {
            // First sort by status (in_progress first)
            if (a.status !== b.status) {
                return a.status === 'in_progress' ? -1 : 1;
            }
            // Then sort by assigned date (newest first)
            return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
        });

        // Get the active section
        const activeSection = document.querySelector('.sidebar li.active')?.getAttribute('data-section');
        console.log('[DEBUG] Active section:', activeSection);

        if (sortedProjects.length === 0) {
            displayNoProjectsMessage();
        } else {
            displayProjects(sortedProjects);
        }

        // Ensure the correct section is visible
        if (activeSection) {
            document.querySelectorAll('.section').forEach(section => {
                (section as HTMLElement).style.display = 'none';
            });
            const targetSection = document.querySelector(`.${activeSection}-section`);
            if (targetSection) {
                (targetSection as HTMLElement).style.display = 'block';
            }
        }

    } catch (error) {
        console.error('[DEBUG] Error loading projects:', error);
        displayErrorMessage(error instanceof Error ? error.message : 'Failed to load projects');
    } finally {
        hideLoadingSpinners();
    }
}

function showLoadingSpinners() {
    const currentSpinner = document.getElementById('currentProjectsSpinner');
    const completedSpinner = document.getElementById('completedProjectsSpinner');

    if (currentSpinner) currentSpinner.style.display = 'block';
    if (completedSpinner) completedSpinner.style.display = 'block';

    // Clear containers while loading
    const currentContainer = document.getElementById('currentProjectsContainer');
    const completedContainer = document.getElementById('completedProjectsContainer') as HTMLElement;
    if (currentContainer) currentContainer.innerHTML = '';
    if (completedContainer) completedContainer.innerHTML = '';
}

function hideLoadingSpinners() {
    const currentSpinner = document.getElementById('currentProjectsSpinner');
    const completedSpinner = document.getElementById('completedProjectsSpinner');

    if (currentSpinner) currentSpinner.style.display = 'none';
    if (completedSpinner) completedSpinner.style.display = 'none';
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

function displayErrorMessage(message: string) {
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
function displayProjects(projects: Project[]) {
    const currentProjectsContainer = document.getElementById('currentProjectsContainer');
    const completedProjectsContainer = document.getElementById('completedProjectsContainer');

    if (!currentProjectsContainer || !completedProjectsContainer) {
        // console.error('Project containers not found');
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
    } else {
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
    } else {
        completedProjectsContainer.innerHTML = `
            <div class="no-projects">
                <i class="fa-regular fa-calendar-check"></i>
                <p>No completed projects yet</p>
            </div>
        `;
    }

    // Update project counts
    const currentCount = document.getElementById('currentProjectsCount');
    const completedCount = document.getElementById('completedProjectsCount');

    if (currentCount) {
        currentCount.textContent = currentProjects.length.toString();
    }
    if (completedCount) {
        completedCount.textContent = completedProjects.length.toString();
    }
}

// Create project card element
function createProjectCard(project: Project, isCompleted = false): HTMLElement {
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
function formatDate(dateString: string): string {
    try {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
        // console.error('Error formatting date:', e);
        return dateString; // Return raw string if formatting fails
    }
}

// View project details
async function viewProjectDetails(projectId: string) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Show loading state in modal
        const modal = document.getElementById('projectModal') as HTMLElement;
        const modalBody = modal?.querySelector('.modal-body');
        if (modal && modalBody) {
            modal.classList.add('show');
            modalBody.innerHTML = `
                <div class="loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading project details...</p>
                </div>
            `;
        }

        // First try to get project from the projects list
        const projectCard = document.querySelector(`[data-project-id="${projectId}"]`)?.closest('.project-card');
        let project;

        if (projectCard) {
            // Extract project data from the card
            project = {
                id: projectId,
                title: projectCard.querySelector('h3')?.textContent || '',
                description: projectCard.querySelector('.description')?.textContent || '',
                status: projectCard.querySelector('.status')?.classList.contains('status-completed') ? 'completed' : 'in_progress',
                assignedBy: projectCard.querySelector('.due-date')?.textContent?.split('Assigned by: ')[1]?.split(' on ')[0] || 'Manager',
                assignedAt: new Date().toISOString(), // Use current date as fallback
                dueDate: projectCard.querySelector('.due-date:nth-child(2)')?.textContent?.split('Due: ')[1] || undefined
            };
        } else {
            // If not found in DOM, try to fetch from API
            const response = await fetch(`http://localhost:3000/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch project details');
            }

            project = await response.json();
        }

        // Update modal content
        if (modal && modalBody) {
            modalBody.innerHTML = `
                <div class="project-details">
                    <h2 id="modalProjectTitle">${project.title}</h2>
                    <span id="modalProjectStatus" class="status ${project.status === 'completed' ? 'status-completed' : 'status-in-progress'}">
                        ${project.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                    <p id="modalProjectDescription" class="description">${project.description}</p>
                    <div class="timeline-info">
                        <p><i class="fa-solid fa-user-tie"></i> Assigned by: <span id="modalProjectAssignedBy">${project.assignedBy || 'Manager'}</span></p>
                        <p><i class="fa-regular fa-calendar"></i> Assigned on: <span id="modalProjectAssignedDate">${formatDate(project.assignedAt)}</span></p>
                        ${project.dueDate ? `
                            <p><i class="fa-regular fa-calendar"></i> Due date: <span id="modalProjectDueDate">${formatDate(project.dueDate)}</span></p>
                        ` : ''}
                    </div>
                    ${project.status !== 'completed' ? `
                        <button id="modalCompleteBtn" class="btn btn-complete">
                            <i class="fa-solid fa-check"></i> Mark as Complete
                        </button>
                    ` : ''}
                </div>
            `;

            // Add event listener for complete button
            const completeBtn = document.getElementById('modalCompleteBtn');
            if (completeBtn) {
                completeBtn.onclick = () => {
                    markProjectComplete(projectId);
                    modal.classList.remove('show');
                };
            }
        }

        // Add event listeners for modal close buttons
        const closeButtons = modal?.querySelectorAll('.close-modal, .btn-close');
        closeButtons?.forEach(button => {
            button.addEventListener('click', () => {
                modal?.classList.remove('show');
            });
        });

        // Close modal when clicking outside
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });

    } catch (error) {
        console.error('Error fetching project details:', error);
        const modal = document.getElementById('projectModal');
        const modalBody = modal?.querySelector('.modal-body');
        if (modal && modalBody) {
            modalBody.innerHTML = `
                <div class="error-message">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <p>Error: ${error instanceof Error ? error.message : 'Failed to load project details'}</p>
                    <button class="btn btn-close close-modal">Close</button>
                </div>
            `;
        }
    }
}

// Mark project as complete
async function markProjectComplete(projectId: string) {
    if (!confirm('Are you sure you want to mark this project as complete?')) return;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Show loading state
        const projectCard = document.querySelector(`[data-project-id="${projectId}"]`)?.closest('.project-card');
        if (projectCard) {
            projectCard.classList.add('loading');
        }

        const response = await fetch(`http://localhost:3000/projects/${projectId}/complete`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Complete project response:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update project status');
        }

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <i class="fa-solid fa-check-circle"></i>
            <p>Project marked as complete successfully!</p>
        `;
        document.body.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);

        // Reload projects
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
            await loadUserProjects(user.id);

            // Switch to completed projects tab
            const completedTab = document.querySelector('.sidebar li[data-section="completed-projects"]');
            if (completedTab) {
                // Hide all sections
                document.querySelectorAll('.section').forEach(s => (s as HTMLElement).style.display = 'none');

                // Show completed projects section
                const completedSection = document.querySelector('.completed-projects-section');
                if (completedSection) {
                    (completedSection as HTMLElement).style.display = 'block';
                }

                // Update active tab
                document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
                completedTab.classList.add('active');
            }
        }
    } catch (error) {
        console.error('Error completing project:', error);
        // Show error message in a more user-friendly way
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <i class="fa-solid fa-exclamation-triangle"></i>
            <p>${error instanceof Error ? error.message : 'Failed to update project status'}</p>
        `;
        document.body.appendChild(errorMessage);
        setTimeout(() => errorMessage.remove(), 5000);
    } finally {
        // Remove loading state
        const projectCard = document.querySelector(`[data-project-id="${projectId}"]`)?.closest('.project-card');
        if (projectCard) {
            projectCard.classList.remove('loading');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOM fully loaded');

    // Initialize components
    initializeUserDashboard();
    initializeSidebarNavigation();
    initializeLogoutButton();

    // Add click handler for project cards
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const projectCard = target.closest('.project-card');

        if (projectCard) {
            const projectId = projectCard.getAttribute('data-project-id');
            if (projectId) {
                console.log('[DEBUG] Project card clicked:', projectId);
                viewProjectDetails(projectId);
            }
        }
    });

    // Add modal close handlers
    const modal = document.getElementById('projectModal');
    const closeButtons = modal?.querySelectorAll('.close-modal, .btn-close');

    closeButtons?.forEach(button => {
        button.addEventListener('click', () => {
            modal?.classList.remove('show');
        });
    });

    // Close modal when clicking outside
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});
