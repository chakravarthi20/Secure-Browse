document.getElementById("popup-close-btn").addEventListener("click", () => {
    window.close(); // Close the popup window
});

// Function to update popup content dynamically (optional)
function updatePopupContent(title, message) {
    document.getElementById("popup-title").textContent = title;
    document.getElementById("popup-message").textContent = message;
}

// Example usage (optional, can be triggered when opening the popup)
updatePopupContent("Download Warning", "The file you attempted to download may be harmful.");