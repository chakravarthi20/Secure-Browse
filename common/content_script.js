console.log("Content script successfully injected and running on https://the-internet.herokuapp.com/login");

// One-time injection flag
let hasInjected = false;

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message in content script:", message);

    if (message.action === "checkLoginForm" && !hasInjected) {
        console.log("Starting form detection and injection process...");
        hasInjected = true; // Set flag to true to prevent repeated injections

        // Adding a slight delay to ensure the page elements are fully loaded
        setTimeout(() => {
            detectAndInjectLoginForms();
            setTimeout(checkPageAfterSubmission, 3000); // Adjust delay as needed
            sendResponse({ status: "Form check initiated" });
        }, 500); // 500ms delay
    } else if (hasInjected) {
        console.log("Injection has already been performed on this page load.");
    }
});

// Function to detect login forms and inject fake data
function detectAndInjectLoginForms() {
    const fakeEmail = "fakeuser@example.com";
    const fakePassword = "FakePassword123!";

    console.log("Attempting to find email or text input fields...");

    // Find email or text fields and inject fake data
    let emailInjected = false;
    document.querySelectorAll("input[type='text']").forEach(input => {
        console.log("Injecting fake email/text:", fakeEmail);
        input.value = fakeEmail;
        emailInjected = true;
    });
    if (!emailInjected) {
        console.warn("No email/text fields found for injection.");
    }

    console.log("Attempting to find password input fields...");

    // Find password fields and inject fake password
    let passwordInjected = false;
    document.querySelectorAll("input[type='password']").forEach(input => {
        console.log("Injecting fake password:", fakePassword);
        input.value = fakePassword;
        passwordInjected = true;
    });
    if (!passwordInjected) {
        console.warn("No password fields found for injection.");
    }

    console.log("Form fields populated with fake data. Please submit the form manually.");
}

// Function to check if the page after submission has phishing indicators
function checkPageAfterSubmission() {
    console.log("Checking page after submission for phishing indicators...");
    
    // Look for common phishing indicators
    if (document.title.includes("Error") || 
        document.body.innerText.includes("Your username is invalid!") ||
        document.body.innerText.includes("Suspicious Activity") ||
        document.body.innerText.includes("Page Not Found")) {
        
        alert("Warning: This site may be phishing. Fake login attempt failed.");
        console.log("Phishing warning displayed.");
    } else {
        console.log("No phishing indicators detected.");
    }
}