document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin page loaded');
  const form = document.getElementById('addProjectForm');
  if (form) {
    console.log('Form found, adding submit listener');
    form.addEventListener('submit', addProject);
  } else {
    console.error('Form not found!');
  }
});

async function addProject(event) {
  event.preventDefault();
  console.log('Form submitted');
  
  const title = document.getElementById('projectTitle').value;
  const description = document.getElementById('projectDescription').value;
  const endDateInput = document.getElementById('endDate');
  const endDate = endDateInput.value;
  
  console.log('Form values:', {
    title,
    description,
    endDate,
    endDateInputType: endDateInput.type,
    endDateInputValue: endDateInput.value,
    endDateInputRequired: endDateInput.required
  });
  
  let formattedDate = null;
  if (endDate) {
    // Create date at midnight UTC
    const [year, month, day] = endDate.split('-').map(Number);
    formattedDate = new Date(Date.UTC(year, month - 1, day));
    console.log('Date parsing:', {
      rawEndDate: endDate,
      year,
      month,
      day,
      formattedDate,
      isoString: formattedDate.toISOString()
    });
  }

  const requestBody = {
    title,
    description,
    endDate: formattedDate ? formattedDate.toISOString() : null
  };
  console.log('Request body being sent:', requestBody);

  try {
    const response = await fetch('http://localhost:3000/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error:', errorData);
      throw new Error(errorData.message || 'Failed to add project');
    }

    // Clear form
    document.getElementById('projectTitle').value = '';
    document.getElementById('projectDescription').value = '';
    endDateInput.value = '';

    // Refresh projects list
    loadProjects();
  } catch (error) {
    console.error('Error adding project:', error);
    alert('Failed to add project. Please try again.');
  }
} 