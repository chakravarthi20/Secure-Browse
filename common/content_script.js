// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "phishingDetected") {
        injectFakeData();
        autoSubmitForm();
        sendResponse({ status: "Fake data submitted" });
    } else if (message.action === "displayThreat") {
        showInPagePopup(message.url);
        sendResponse({ status: "Popup displayed" });
    }
});

// Inject fake data into form fields
function injectFakeData() {
    const fakeEmail = "fakeuser@example.com";
    const fakePassword = "FakePassword123!";

    // Fill text and email input fields with fake data
    document.querySelectorAll("input[type='email'], input[type='text']").forEach(input => {
        input.value = fakeEmail;
    });

    // Fill password fields with fake data
    document.querySelectorAll("input[type='password']").forEach(input => {
        input.value = fakePassword;
    });

    console.log("Fake data injected!");
}

// Automatically submit the form
function autoSubmitForm() {
    const form = document.querySelector("form");
    if (form) {
        form.submit();
        console.log("Fake form submitted!");
    }
}

// Function to display an in-page popup for threat alerts
function showInPagePopup(url) {
    // Check if a popup already exists to avoid duplicates
    if (document.getElementById("threatPopupOverlay")) return;

    // Create overlay div
    const overlay = document.createElement("div");
    overlay.id = "threatPopupOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";

    // Create popup content
    const popup = document.createElement("div");
    popup.style.backgroundColor = "white";
    popup.style.padding = "20px";
    popup.style.borderRadius = "8px";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    popup.innerHTML = `
        <h2 style="color: red;">Threat Alert</h2>
        <p>The URL <strong>${url}</strong> has been identified as a potential threat.</p>
        <button id="closePopupBtn">OK</button>
    `;

    // Append popup to overlay
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Close popup on button click
    document.getElementById("closePopupBtn").addEventListener("click", () => {
        document.body.removeChild(overlay);
    });

    console.log("In-page threat alert popup displayed!");
}
