console.log("Content script successfully injected and running.");

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message in content script:", message);

    if (message.action === "checkLoginForm") {
        console.log("Starting form detection and injection process...");
        setTimeout(() => {
            detectAndInjectLoginForms();
            sendResponse({ status: "Form check initiated" });
        }, 500);
    }
    if (message.action === 'showAlert') {
        console.log("Displaying alert with message:", message.message); // Log for debugging
        alert(message.message); // Display the alert in the content script's context
        sendResponse({ status: 'alert displayed' });
    }
});


// Function to detect email input fields and trigger HIBP check
function detectAndCheckEmail() {
    const emailInputs = document.querySelectorAll("input[type='email'], input[type='text']");
    emailInputs.forEach(input => {
        input.addEventListener('change', () => {
            const emailValue = input.value.trim();
            if (validateEmail(emailValue)) {
                console.log(`Checking HIBP for email: ${emailValue}`);
                chrome.runtime.sendMessage({ action: 'checkHibpBreaches', query: emailValue });
            }
        });
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Function to detect and inject fake data
function detectAndInjectLoginForms() {
    const fakeEmail = "fakeuser@example.com";
    const fakePassword = "FakePassword123!";
    console.log("Attempting to find email or text input fields...");
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
    let passwordInjected = false;
    document.querySelectorAll("input[type='password']").forEach(input => {
        console.log("Injecting fake password:", fakePassword);
        input.value = fakePassword;
        passwordInjected = true;
    });
    if (!passwordInjected) {
        console.warn("No password fields found for injection.");
    }
    console.log("Form fields populated with fake data.");
    if (confirm("Form fields have been populated with fake data. Do you want to submit the form?")) {
        const form = document.querySelector("form");
        if (form) {
            console.log("Fake form submitted automatically!");
            form.submit();
            checkPageAfterSubmission();
        } else {
            console.log("No login form detected.");
        }
    } else {
        console.log("Form submission canceled by the user.");
    }
}

function checkPageAfterSubmission() {
    console.log("Checking page after submission for phishing indicators...");
    const pageText = document.body.innerText;
    if (pageText.includes("Invalid username or password") ||
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

// Initialize email detection on page load
detectAndCheckEmail();
