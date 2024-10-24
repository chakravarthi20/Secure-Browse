// popup/popup.js
document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('closeButton');
    const modal = document.getElementById('modal');

    // Show the modal (in case it's hidden initially)
    modal.style.display = 'flex';

    // Close the modal when the close button is clicked
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
});
