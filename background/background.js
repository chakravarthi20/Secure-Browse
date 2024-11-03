const apiKey = "AIzaSyBefi3BiUmpPtayHAh-63mOMWGEb4RVQ5Q";

// Function to display a custom popup
function showNotification(url) {
    showPopup(url); // Opens the custom popup in the center of the screen
}

function showPopup(url) {
    chrome.windows.create({
        url: chrome.runtime.getURL("popup/popup.html"),
        type: "popup",
        width: 350,
        height: 200,
        focused: true
    });
}

// Listen only to main frame requests to avoid unnecessary hits
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        const url = details.url;
        console.log(`Visited URL: ${url}`);

        // Skip chrome-extension URLs to avoid invalid argument errors
        if (url.startsWith("chrome-extension://")) {
            console.log("Skipped checking internal extension URL:", url);
            return;
        }

        // Check if the site is potentially harmful or a phishing site
        if (isPhishingSite(url)) {
            chrome.tabs.sendMessage(details.tabId, { action: "phishingDetected" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Message sending error:", chrome.runtime.lastError.message);
                } else {
                    console.log("Message sent to content script:", response);
                }
            });
            console.log(`Phishing site detected: ${url}`);
        } else {
            checkUrlSafe(url);
        }
    },
    { urls: ["<all_urls>"], types: ["main_frame"] } // Restricting to main frame requests only
);

// Helper functions for Google search and phishing detection
function isGoogleSearch(url) {
    const googleSearchPattern = /^https?:\/\/(www\.)?google\.[a-z]+\/search\?.*q=/;
    return googleSearchPattern.test(url);
}

function isPhishingSite(url) {
    const phishingSites = ["phishing-site.com", "malicious-site.net"];
    return phishingSites.some(site => url.includes(site));
}

// Function to check URL safety using Safe Browsing API
function checkUrlSafe(url) {
    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    const requestBody = {
        client: {
            clientId: "secure-browsing-extension",
            clientVersion: "1.0.0"
        },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: url }]
        }
    };

    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    })
    .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
            console.error("Error response:", response.status, data);
            throw new Error(`API Error: ${response.statusText}`);
        }
        console.log("API Response:", data);
        if (data && data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
            console.log('Threats found:', data.matches);
            showNotification(url);
        } else {
            console.log('URL is safe:', url);
        }
    })
    .catch(error => {
        console.error('Error checking safe browsing API:', error);
    });
}
