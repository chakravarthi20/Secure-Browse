const apiKey = "AIzaSyBefi3BiUmpPtayHAh-63mOMWGEb4RVQ5Q";

function showNotification(tabId, url) {
    console.log("Attempting to send message to content script...");
    
    if (url && url.startsWith("http") && !url.startsWith("chrome-error://") && !url.startsWith("about:blank")) {
        chrome.tabs.sendMessage(tabId, { action: "checkLoginForm", url: url }, (response) => {
            if (chrome.runtime.lastError) {
                console.log("Content script not yet injected or not available, injecting now...");
                
                // Inject the content script
                chrome.scripting.executeScript(
                    {
                        target: { tabId: tabId },
                        files: ["common/content_script.js"]
                    },
                    () => {
                        if (chrome.runtime.lastError) {
                            console.error("Script injection error:", chrome.runtime.lastError.message);
                        } else {
                            // Retry sending the message after a short delay to ensure content script is ready
                            setTimeout(() => {
                                chrome.tabs.sendMessage(tabId, { action: "checkLoginForm", url: url }, (response) => {
                                    if (chrome.runtime.lastError) {
                                        console.error("Message sending error after injection:", chrome.runtime.lastError.message);
                                    } else {
                                        console.log("Message sent to content script after injection:", response);
                                    }
                                });
                            }, 500); // Delay to allow content script to initialize
                        }
                    }
                );
            } else {
                console.log("Message sent to content script:", response);
            }
        });
    } else {
        console.warn("Skipping script injection due to unsupported or invalid page:", url);
    }
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
    // Your safe browsing API logic here...
}
