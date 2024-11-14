const apiKey = "AIzaSyBefi3BiUmpPtayHAh-63mOMWGEb4RVQ5Q";
const hibpApiKey = '0c5488315ced4dcd9ba5b13cc579f44f'; // HIBP API key

let hasNotified = false; // Add a flag to track if notification has already been shown

function showNotification(tabId, url) {
    console.log("Attempting to send message to content script...");
    // Check if URL is valid and avoid pages with "chrome-error://"
    if (url && url.startsWith("http") && !url.startsWith("chrome-error://") && !url.startsWith("about:blank")) {
        hasNotified = true; // Set flag to prevent repeated notifications
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
            console.log("Attempting to send message to content script 11...");
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
            console.log("Attempting to send message to content script 22...");
            showNotification(tabId, url);
        } else {
            console.log('URL is safe:', url);
        }
    })
    .catch(error => {
        console.error('Error checking safe browsing API:', error);
    });
}

function checkFileWithVirusTotal(url) {
    const apiKey = 'fbfceee640690b79d72414bb481fa71f747e90d63fc1438d481a70a0931ae76f';
    const submitUrlApi = 'https://www.virustotal.com/api/v3/urls';
    const encodedUrl = btoa(url).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    fetch(submitUrlApi, {
        method: 'POST',
        headers: {
            'x-apikey': apiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `url=${encodeURIComponent(url)}`
    })
    .then(response => response.json())
    .then(data => {
        console.log('URL analysis submitted:', data);

        if (data && data.data && data.data.id) {
            fetchVirusTotalAnalysisReport(data.data.id, url, apiKey);
        } else {
            console.log('Failed to submit URL for analysis or no analysis ID returned.');
        }
    })
    .catch(error => {
        console.error('Error checking file with VirusTotal:', error);
    });
}

function fetchVirusTotalAnalysisReport(analysisId, url, apiKey) {
    const fetchAnalysisUrl = `https://www.virustotal.com/api/v3/analyses/${analysisId}`;

    fetch(fetchAnalysisUrl, {
        method: 'GET',
        headers: {
            'x-apikey': apiKey
        }
    })
    .then(response => response.json())
    .then(reportData => {
        console.log('VirusTotal Report Data:', reportData);

        if (reportData && reportData.data && reportData.data.attributes) {
            const status = reportData.data.attributes.status;
            if (status === 'completed') {
                const stats = reportData.data.attributes.stats;
                console.log(`Analysis Completed. Detection Stats - Malicious: ${stats.malicious}, Harmless: ${stats.harmless}, Suspicious: ${stats.suspicious}, Undetected: ${stats.undetected}`);
                if (stats.malicious > 0) {
                    showCustomPopup("Security Alert", "The file you attempted to download may be harmful.");
                } else {
                    console.log('File appears to be safe.');
                }
            } else {
                console.log(`Analysis status is still pending or incomplete: ${status}`);
            }
        } else {
            console.log('No meaningful results found in the VirusTotal report.');
        }
    })
    .catch(error => {
        console.error('Error fetching VirusTotal report:', error);
    });
}

function showCustomPopup(title, message) {
    const popupUrl = chrome.runtime.getURL('popup/downloadpopup.html');
    chrome.windows.create({
        url: popupUrl,
        type: 'popup',
        width: 350,
        height: 200,
        focused: true
    });
}

function checkHibpForBreaches(email, callback) {
    const apiUrl = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=true`;

    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'hibp-api-key': hibpApiKey,
            'User-Agent': 'ChromeExtension'
        }
    })
    .then(response => {
        console.log(`Response Status for ${email}:`, response.status);
        if (response.status === 200) {
            return response.json().then(data => {
                console.log(`Breaches found for ${email}:`, data);
                callback({ breached: true, details: data });
            });
        } else if (response.status === 404) {
            console.log(`No breaches found for ${email}`);
            callback({ breached: false });
        } else {
            console.error(`Error checking breaches for ${email}:`, response.statusText);
            callback({ breached: false, error: response.statusText });
        }
    })
    .catch(error => {
        console.error('Error connecting to HIBP API:', error);
        callback({ breached: false, error });
    });
}

function handleEmailInput(email) {
    console.log(`Initiating HIBP check for email: ${email}`); // Log start of the function
    checkHibpForBreaches(email, result => {
        console.log(`Result callback for ${email}:`, result); // Log callback result

        if (result.breached) {
            console.log(`Breached result received for ${email}`); // Log if breaches are detected
            // Send a message to content_script.js to display a popup or alert
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    const activeTab = tabs[0];
                    chrome.tabs.sendMessage(activeTab.id, {
                        action: 'showAlert',
                        message: `Security Alert! The email ${email} has been found in breaches: ${result.details.map(b => b.Name).join(', ')}`
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Error sending message to content script:", chrome.runtime.lastError);
                        } else {
                            console.log("Message sent successfully to content script:", response);
                        }
                    });
                } else {
                    console.warn("No active tab found to send the alert message.");
                }
            });
        } else if (result.error) {
            console.error(`Error during HIBP check for ${email}:`, result.error); // Log any error encountered
        } else {
            console.log(`No breaches detected for ${email}`); // Log if no breaches are detected
        }
    });
}



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkHibpBreaches' && message.query) {
        handleEmailInput(message.query);
    }
});
