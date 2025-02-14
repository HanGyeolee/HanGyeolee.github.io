// Smooth scroll function
function scrollToProjects() {
    const projectsSection = document.getElementById('projects-section');
    
    projectsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Add click event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Optional: Add scroll-to-top functionality when clicking the hero section
    document.getElementById('hero-section').addEventListener('click', function(e) {
        // Only trigger if clicking the background (not buttons or links)
        if (e.target === this || e.target.classList.contains('bg-gradient-to-br')) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
});