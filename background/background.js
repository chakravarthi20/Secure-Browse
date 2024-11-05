const apiKey = "AIzaSyBefi3BiUmpPtayHAh-63mOMWGEb4RVQ5Q";

function showNotification(tabId, url) {
    console.log("Attempting to send message to content script...");

    // Check if URL is valid and avoid pages with "chrome-error://"
    if (url && url.startsWith("http") && !url.startsWith("chrome-error://") && !url.startsWith("about:blank")) {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabId },
                files: ["common/content_script.js"]
            },
            () => {
                if (chrome.runtime.lastError) {
                    console.error("Script injection error:", chrome.runtime.lastError.message);
                } else {
                    chrome.tabs.sendMessage(tabId, { action: "checkLoginForm", url: url }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Message sending error:", chrome.runtime.lastError.message);
                        } else {
                            console.log("Message sent to content script:", response);
                        }
                    });
                }
            }
        );
    } else {
        console.warn("Skipping script injection due to error or unsupported page:", url);
    }
}

function showPopup() {
    chrome.windows.create({
        url: chrome.runtime.getURL("popup/popup.html"),
        type: "popup",
        width: 350,
        height: 200,
        focused: true
    });
}

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        const url = details.url;
        console.log(`Visited URL: ${url}`);

        if (url.startsWith("chrome-extension://")) {
            console.log("Skipped checking internal extension URL:", url);
            return;
        }

        if (isPhishingSite(url)) {
            console.log(`Phishing site detected: ${url}`);
            showPopup();
            console.log("Attempting to send message to content script...");
            showNotification(details.tabId, url);
        } else {
            checkUrlSafe(url, details.tabId);
        }
    },
    { urls: ["<all_urls>"], types: ["main_frame"] }
);

function isPhishingSite(url) {
    const phishingSites = ["phishing-site.com", "malicious-site.net", "the-internet.herokuapp.com/login"];
    return phishingSites.some(site => url.includes(site));
}

function checkUrlSafe(url, tabId) {
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
        console.log("HTTP Status:", response.status);
        console.log("API Response Data:", data);

        if (response.ok && data && data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
            console.log('Threats found:', data.matches);
            showPopup();
            console.log("Attempting to send message to content script...");
            showNotification(tabId, url);
        } else {
            console.log('URL is safe:', url);
        }
    })
    .catch(error => {
        console.error('Error checking safe browsing API:', error);
    });
}
