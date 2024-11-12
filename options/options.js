document.addEventListener('DOMContentLoaded', () => {
    const settingCheckbox = document.getElementById('example-setting');
    const saveButton = document.getElementById('save-btn');

    // Load settings on page load
    chrome.storage.sync.get(['exampleSetting'], (result) => {
        if (result.exampleSetting !== undefined) {
            settingCheckbox.checked = result.exampleSetting;
        }
    });

    // Save settings when the save button is clicked
    saveButton.addEventListener('click', () => {
        chrome.storage.sync.set({ exampleSetting: settingCheckbox.checked }, () => {
            alert('Settings saved!');
        });
    });
});
