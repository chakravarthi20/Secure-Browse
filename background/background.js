// const apiKey = "AIzaSyBefi3BiUmpPtayHAh-63mOMWGEb4RVQ5Q"

// chrome.webRequest.onBeforeRequest.addListener(
//     function(details) {
//         let url = details.url;
//         checkUrlSafe(url);
//     },
//     { urls: ["<all_urls>"]}
//     );

// function checkUrlSafe(url){
//     const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
//     const requestBody ={
//         client:{
//             clientId: "secure-browsing-extension",
//             clientVersion: "1.0.0"
//         },
//         threatInfo:{
//             threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
//             platformTypes: ["ANY_PLATFORM"],
//             threatEntryTypes: ["URL"],
//             threatEntries: [
//             {url:url}
//             ]   
//         }
//     };

// fetch(apiUrl,{
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//     },
//     body:JSON.stringify(requestBody)
// })
// .then(response => response.json())
// .then(data => {
//     if(data && data.matches && Array.isArray(data.matches) && data.matches.length > 0){
//         console.log('Threats found:', data.matches);
//         showNotification(url);
//     } else {
//         console.log('URL is safe:',url);
//     }
//     })
//     .catch(error =>{
//         console.error('Error checking safe browsing API:', error);
//     });
// }

// function showNotification(url) {
//     chrome.notifications.create({
//         type: "basic",
//         iconUrl: "../assets/icon.png",  
//         title: "Security Alert",
//         message: `The URL ${url} has been identified as a potential threat. Please exercise caution.`,
//         priority: 2
//     }, function (notificationId) {
//         if (chrome.runtime.lastError) {
//             console.error('Notification Error:', chrome.runtime.lastError);
//         } else {
//             console.log('Notification shown with ID:', notificationId);
//         }
//     });
// }
// function showPopupAlert(url) {
//     chrome.windows.create({
//         url: "popup/popup.html",  // Open the modal HTML
//         type: "popup",
//         width: 400,
//         height: 300,
//         focused: true
//     });
// }

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        const url = details.url;

        // Only proceed if the URL is a Google search query
        if (isGoogleSearch(url)) {
            console.log("Checking URL:", url);
            checkUrlSafe(url);
        }
    },
    { urls: ["<all_urls>"] }
);

// Helper function to identify Google search URLs
function isGoogleSearch(url) {
    const googleSearchPattern = /^https?:\/\/(www\.)?google\.[a-z]+\/search\?.*q=/;
    return googleSearchPattern.test(url);
}

function checkUrlSafe(url) {
    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    const requestBody = {
        client: {
            clientId: "secure-browsing-extension",
            clientVersion: "1.0.0"
        },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
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
        .then(response => response.json())
        .then(data => {
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

function showNotification(url) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "../assets/icon.png",
        title: "Security Alert",
        message: `The URL ${url} has been identified as a potential threat.`,
        priority: 2
    });
}
