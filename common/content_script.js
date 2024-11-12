// Use a unique global variable to prevent multiple injections
if (!window.__contentScriptInjected) {
    window.__contentScriptInjected = true; // Flag to avoid re-injecting or re-running the script
    console.log("Content script successfully injected and running.");

    // Listen for messages from background.js
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Received message in content script:", message);

        if (message.action === "checkLoginForm") {
            console.log("Starting form detection and injection process...");
            // Adding a slight delay to ensure the page elements are fully loaded
            setTimeout(() => {
                try {
                    detectAndInjectLoginForms();
                    sendResponse({ status: "Form check initiated" });
                } catch (error) {
                    console.error("Error during form detection and injection:", error);
                    sendResponse({ status: "Form check failed", error: error.message });
                }
            }, 500); // 500ms delay
        }
    });

    // Function to detect login forms and inject fake data
    function detectAndInjectLoginForms() {
        const fakeEmail = "fakeuser@example.com";
        const fakePassword = "FakePassword123!";

        console.log("Attempting to find email or text input fields...");

        // Find email or text fields and inject fake data
        let emailInjected = false;
        try {
            document.querySelectorAll("input[type='text'], input[type='email']").forEach(input => {
                if (!input.value) { // Ensure we don't overwrite existing values
                    console.log("Injecting fake email/text:", fakeEmail);
                    input.value = fakeEmail;
                    emailInjected = true;
                } else {
                    console.log("Skipping injection, field already has value:", input.value);
                }
            });
        } catch (error) {
            console.error("Error injecting email/text:", error);
        }

        if (!emailInjected) {
            console.warn("No email/text fields found for injection.");
        }

        console.log("Attempting to find password input fields...");

        // Find password fields and inject fake password
        let passwordInjected = false;
        try {
            document.querySelectorAll("input[type='password']").forEach(input => {
                if (!input.value) { // Ensure we don't overwrite existing values
                    console.log("Injecting fake password:", fakePassword);
                    input.value = fakePassword;
                    passwordInjected = true;
                } else {
                    console.log("Skipping injection, password field already has value.");
                }
            });
        } catch (error) {
            console.error("Error injecting password:", error);
        }

        if (!passwordInjected) {
            console.warn("No password fields found for injection.");
        }

        console.log("Form fields populated with fake data.");

        // Ask user to confirm form submission
        try {
            if (emailInjected || passwordInjected) {
                if (confirm("Form fields have been populated with fake data. Do you want to submit the form?")) {
                    const form = document.querySelector("form");
                    if (form) {
                        console.log("Fake form submitted automatically!");
                        form.submit();
                        localStorage.setItem("formSubmissionHandled", "true");
                        checkPageAfterSubmission();
                    } else {
                        console.log("No login form detected.");
                    }
                } else {
                    console.log("Form submission canceled by the user.");
                }
            } else {
                console.log("No form fields were modified, skipping form submission.");
            }
        } catch (error) {
            console.error("Error handling form submission confirmation:", error);
        }
    }

    // Function to check if the page after submission has phishing indicators
    function checkPageAfterSubmission() {
        console.log("Checking page after submission for phishing indicators...");

        const pageText = document.body.innerText;

        // Check for common phishing indicators
        if (
            pageText.includes("Invalid username or password") ||
            pageText.includes("Your username is invalid!") ||
            pageText.includes("Suspicious Activity") ||
            pageText.includes("Page Not Found") ||
            pageText.includes("Login failed") ||
            pageText.includes("Authentication failed") ||
            pageText.includes("Your account is locked") ||
            pageText.includes("Verify your account") ||
            pageText.includes("Account verification required") ||
            pageText.includes("Please complete the captcha") ||
            pageText.includes("Multi-factor authentication required") ||
            pageText.includes("Social Security Number") ||
            pageText.includes("Credit card number") ||
            pageText.includes("Security question") ||
            pageText.includes("Please update your payment information") ||
            pageText.includes("Credit card verification required")
        ) {
            alert("Warning: This site may be phishing. Fake login attempt failed.");
            console.log("Phishing warning displayed.");
        } else {
            console.log("No phishing indicators detected.");
        }
    }
} else {
    console.log("Content script was already injected, skipping re-injection.");
}
