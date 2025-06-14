"use strict";
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
    // Show dashboard by default
    document.querySelector('.dashboard-section').style.display =
        'block';
    document.querySelector('.sidebar li[data-section="dashboard"]').classList.add('active');
});
