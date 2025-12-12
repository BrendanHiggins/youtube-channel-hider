// Main Logic: Hides or Shows channels based on the blocked list and toggle state.

function processVideoCards() {
    chrome.storage.local.get({ blockedChannels: [], blockingEnabled: true }, (data) => {
        const isEnabled = data.blockingEnabled;
        const blockedChannels = data.blockedChannels;

        // --- 1. IF BLOCKING IS DISABLED: Unhide everything ---
        if (!isEnabled) {
            // Find all elements we previously hid (marked with our custom attribute)
            const hiddenElements = document.querySelectorAll('[data-yt-hider-hidden="true"]');
            hiddenElements.forEach(el => {
                el.style.display = ''; // Reset display
                el.removeAttribute('data-yt-hider-hidden'); // Remove marker
            });
            return; // Stop here
        }

        // --- 2. IF BLOCKING IS ENABLED: Hide matches ---
        if (blockedChannels.length === 0) return;

        const blockedNames = blockedChannels.map(c => c.name.toLowerCase());
        
        // Select all standard video card containers
        const videoCards = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer');

        videoCards.forEach(card => {
            // Optimization: If already hidden by us, skip checking text again
            if (card.getAttribute('data-yt-hider-hidden') === 'true') return;

            // Find links inside the card that usually contain the channel name
            const channelLinks = card.querySelectorAll('a[href^="/@"], a[href^="/channel/"], a[href^="/c/"], a[href^="/user/"]');

            let shouldHide = false;

            channelLinks.forEach(link => {
                const channelName = link.innerText.trim().toLowerCase();
                const channelHref = link.getAttribute('href').toLowerCase();

                blockedNames.forEach(blocked => {
                    if (channelName.includes(blocked) || channelHref.includes(blocked)) {
                        shouldHide = true;
                    }
                });
            });

            if (shouldHide) {
                // Hide it and mark it so we can unhide it later if the user toggles the switch
                card.style.display = 'none';
                card.setAttribute('data-yt-hider-hidden', 'true');
                console.log(`[YouTube Channel Hider] Hid video.`);
            }
        });
    });
}

// Specifically targets the structure of the sidebar
function processSidebarSuggestions() {
    chrome.storage.local.get({ blockedChannels: [], blockingEnabled: true }, (data) => {
        if (!data.blockingEnabled || data.blockedChannels.length === 0) return;

        const blockedNames = data.blockedChannels.map(c => c.name.toLowerCase());

        // Target the specific wrapper from your snippet
        const sidebarItems = document.querySelectorAll('yt-lockup-view-model');

        sidebarItems.forEach(item => {
            // Optimization: Skip if already hidden
            if (item.style.display === 'none') return;

            let foundText = [];

            // 1. Check the main Title (often in an H3 or A tag)
            const titles = item.querySelectorAll('[title], .yt-lockup-metadata-view-model__title');
            titles.forEach(t => {
                if (t.title) foundText.push(t.title.toLowerCase());
                if (t.innerText) foundText.push(t.innerText.toLowerCase());
                if (t.getAttribute('aria-label')) foundText.push(t.getAttribute('aria-label').toLowerCase());
            });

            // 2. Check the "Content Metadata" (Where "JunyTony - Songs and Stories" usually lives)
            const metadataText = item.querySelectorAll('.yt-content-metadata-view-model__metadata-text, .yt-core-attributed-string');
            metadataText.forEach(m => {
                foundText.push(m.innerText.trim().toLowerCase());
            });

            // 3. Check any links inside for channel handles
            const links = item.querySelectorAll('a[href]');
            links.forEach(l => {
                foundText.push(l.getAttribute('href').toLowerCase());
            });

            // Check for matches
            let shouldHide = false;
            for (const text of foundText) {
                for (const blocked of blockedNames) {
                    if (text.includes(blocked)) {
                        shouldHide = true;
                        break;
                    }
                }
                if (shouldHide) break;
            }

            if (shouldHide) {
                item.style.display = 'none';
                // We don't necessarily need the data-attribute here if we just check display, 
                // but it's good practice if you want to unhide them later.
                item.setAttribute('data-yt-hider-hidden', 'true');
                console.log('[YouTube Channel Hider] Hid sidebar suggestion.');
            }
        });
    });
}

// --- Dynamic Content Handling ---

const observer = new MutationObserver((mutations) => {
    let shouldRun = false;
    for (const m of mutations) {
        if (m.addedNodes.length > 0) {
            shouldRun = true;
            break;
        }
    }
    if (shouldRun) {
        // Run BOTH functions
        processVideoCards();
        processSidebarSuggestions();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        processVideoCards();
        processSidebarSuggestions();
    }
});

// Initial Run
processVideoCards();
processSidebarSuggestions();