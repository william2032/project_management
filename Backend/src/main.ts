import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Admin functionality
interface Project {
  id: number;
  title: string;
  description: string;
  endDate: string | null;
  status: string;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

async function addProject(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  
  // Get form values
  const title = (form.querySelector('#title') as HTMLInputElement).value;
  const description = (form.querySelector('#description') as HTMLTextAreaElement).value;
  const endDateInput = form.querySelector('#endDate') as HTMLInputElement;
  
  console.log('Form values:', {
    title,
    description,
    endDate: {
      input: endDateInput,
      type: endDateInput.type,
      value: endDateInput.value,
      required: endDateInput.required
    }
  });

  // Parse end date
  let endDate: string | null = null;
  if (endDateInput.value) {
    const [year, month, day] = endDateInput.value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    endDate = date.toISOString();
    
    console.log('Date parsing:', {
      rawEndDate: endDateInput.value,
      year,
      month,
      day,
      formattedDate: date,
      isoString: endDate
    });
  }

  const requestBody = {
    title,
    description,
    endDate
  };

  console.log('Sending request with body:', requestBody);

  try {
    const response = await fetch('http://localhost:3000/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Project created:', data);
    form.reset();
    await loadProjects();
  } catch (error) {
    console.error('Error creating project:', error);
    alert('Failed to create project. Please try again.');
  }
}

async function loadProjects(): Promise<void> {
  try {
    const response = await fetch('http://localhost:3000/projects');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const projects: Project[] = await response.json();
    const projectsList = document.getElementById('projectsList');
    if (!projectsList) return;

    projectsList.innerHTML = projects
      .map(
        (project) => `
        <div class="project-card">
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <p>End Date: ${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}</p>
          <p>Status: ${project.status}</p>
          ${project.assignedTo ? `<p>Assigned to: ${project.assignedTo.name}</p>` : ''}
          <button onclick="assignProject(${project.id})">Assign Project</button>
        </div>
      `
      )
      .join('');
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

async function loadUsers(): Promise<void> {
  try {
    const response = await fetch('http://localhost:3000/users');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users: User[] = await response.json();
    const userSelect = document.getElementById('userSelect') as HTMLSelectElement;
    if (!userSelect) return;

    userSelect.innerHTML = users
      .map(
        (user) => `
        <option value="${user.id}">${user.name} (${user.email})</option>
      `
      )
      .join('');
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function assignProject(projectId: number): Promise<void> {
  const userSelect = document.getElementById('userSelect') as HTMLSelectElement;
  if (!userSelect) return;

  const userId = userSelect.value;
  if (!userId) {
    alert('Please select a user first');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/projects/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Project assigned:', data);
    await loadProjects();
  } catch (error) {
    console.error('Error assigning project:', error);
    alert('Failed to assign project. Please try again.');
  }
}

// Initialize admin functionality
function initializeAdmin(): void {
  const addProjectForm = document.getElementById('addProjectForm');
  if (addProjectForm) {
    addProjectForm.addEventListener('submit', addProject);
  }

  // Load initial data
  loadProjects();
  loadUsers();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
      'http://localhost:5500',
    ], //  frontend URL
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.listen(3000);
  
  // Initialize admin functionality after server starts
  initializeAdmin();
}
bootstrap();
