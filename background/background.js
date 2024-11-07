const apiKey = "AIzaSyBefi3BiUmpPtayHAh-63mOMWGEb4RVQ5Q";

let hasNotified = false; // Add a flag to track if notification has already been shown

function showNotification(tabId, url) {
    console.log("Attempting to send message to content script...");
    // Check if URL is valid and avoid pages with "chrome-error://"
    if (url && url.startsWith("http") && !url.startsWith("chrome-error://") && !url.startsWith("about:blank"))  {
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


// Listen for new downloads
chrome.downloads.onCreated.addListener(downloadItem => {
    console.log(`Download started for: ${downloadItem.url}`);
    checkFileWithVirusTotal(downloadItem.url);
    // Example of calling showCustomPopup for a notification
    showCustomPopup("Download Started", `The file from ${downloadItem.url} is being checked.`);
});

function checkFileWithVirusTotal(url) {
    const apiKey = 'fbfceee640690b79d72414bb481fa71f747e90d63fc1438d481a70a0931ae76f';
    const submitUrlApi = 'https://www.virustotal.com/api/v3/urls';

    // Encode the URL in Base64 (URL-safe encoding as required by VirusTotal)
    const encodedUrl = btoa(url).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    // Step 1: Submit the URL for analysis
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

        // Step 2: Check if the response contains a data object with an ID
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

    // Fetch the analysis report using the analysis ID
    fetch(fetchAnalysisUrl, {
        method: 'GET',
        headers: {
            'x-apikey': apiKey
        }
    })
    .then(response => response.json())
    .then(reportData => {
        console.log('VirusTotal Report Data:', reportData);

        // Process the report data
        if (reportData && reportData.data && reportData.data.attributes) {
            const status = reportData.data.attributes.status;
            if (status === 'completed') {
                const stats = reportData.data.attributes.stats;
                console.log(`Analysis Completed. Detection Stats - Malicious: ${stats.malicious}, Harmless: ${stats.harmless}, Suspicious: ${stats.suspicious}, Undetected: ${stats.undetected}`);

                // You can further inspect or act upon these stats
                if (stats.malicious > 0) {
                    console.log('Warning: Unsafe file detected.');
                    showCustomPopup("Security Alert", "The file you attempted to download may be harmful.");
                    //notifyUserOfInsecureDownload(url);
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

// Function to notify user of insecure downloads
// function notifyUserOfInsecureDownload(url) {
//     chrome.notifications.create({
//         type: 'basic',
//         iconUrl: chrome.runtime.getURL('asset/icon.png'),
//         title: 'Insecure Download Detected',
//         message: `The file from ${url} may be harmful.`,
//         buttons: [
//             { title: 'Cancel Download' },
//             { title: 'Continue Download' }
//         ],
//         priority: 2
//     }, notificationId => {
//         // Add click event listener if needed
//         chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
//             if (notifId === notificationId) {
//                 if (btnIdx === 0) {
//                     // User chose to cancel download
//                     chrome.downloads.cancel(downloadItem.id, () => {
//                         console.log('Download canceled.');
//                     });
//                 } else if (btnIdx === 1) {
//                     // User chose to continue download
//                     console.log('User opted to continue with the download.');
//                 }
//             }
//         });
//     });
// }

function showCustomPopup(title, message) {
    const popupUrl = chrome.runtime.getURL('popup/downloadpopup.html'); // Make sure 'popup.html' is in your extension directory
    chrome.windows.create({
        url: popupUrl,
        type: 'popup',
        width: 350,
        height: 200,
        focused: true
    });

    // Use `updatePopupContent` in `popup.js` to modify content dynamically if needed
    // (e.g., by passing data via query params or using `chrome.runtime.sendMessage`)
}

