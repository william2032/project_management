document.addEventListener('DOMContentLoaded', () => {
  // Get all sidebar list items
  const sidebarItems = document.querySelectorAll('.sidebar li ');

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

  // Show dashboard by default
  (document.querySelector('.dashboard-section') as HTMLElement).style.display =
    'block';
  (
    document.querySelector(
      '.sidebar li[data-section="dashboard"]',
    ) as HTMLElement
  ).classList.add('active');
});
