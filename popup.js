document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const channelInput = document.getElementById('channelInput');
    const saveButton = document.getElementById('saveButton');
    const statusEl = document.getElementById('status');
    const channelList = document.getElementById('channelList');
    
    // Toggle Elements
    const toggleBlocking = document.getElementById('toggleBlocking');
    const toggleLabel = document.getElementById('toggleLabel');

    // --- Core Logic ---

    const updateToggleUI = (isEnabled) => {
        toggleBlocking.checked = isEnabled;
        toggleLabel.textContent = isEnabled ? "Blocking Enabled" : "Blocking Disabled";
        toggleLabel.style.color = isEnabled ? "#ffffff" : "#9ca3af";
    };

    const displayChannels = (channels = []) => {
        if (!channelList) return;
        channelList.innerHTML = ''; 
        
        const sortedChannels = channels.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

        sortedChannels.forEach(item => {
            const li = document.createElement('li');
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'channel-name';
            nameSpan.textContent = item.name;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => removeChannel(item.name);

            li.appendChild(nameSpan);
            li.appendChild(removeBtn);
            channelList.appendChild(li);
        });
    };

    const loadData = () => {
        // Fetch both the list and the toggle state (defaulting to true)
        chrome.storage.local.get({ blockedChannels: [], blockingEnabled: true }, (data) => {
            displayChannels(data.blockedChannels);
            updateToggleUI(data.blockingEnabled);
        });
    };

    const saveChannel = () => {
        if (!channelInput) return;
        const rawInput = channelInput.value.trim();
        
        if (!rawInput) {
            updateStatus('Please enter a name.', '#f56565');
            return;
        }

        chrome.storage.local.get({ blockedChannels: [] }, (data) => {
            const channels = data.blockedChannels;
            const alreadyExists = channels.some(ch => ch.name.toLowerCase() === rawInput.toLowerCase());

            if (!alreadyExists) {
                channels.push({ name: rawInput, dateAdded: new Date().toISOString() });
                chrome.storage.local.set({ blockedChannels: channels }, () => {
                    updateStatus('Channel blocked!', '#48bb78');
                    channelInput.value = '';
                    loadData();
                });
            } else {
                updateStatus('Channel already blocked.', '#f56565');
            }
        });
    };

    const removeChannel = (nameToRemove) => {
        chrome.storage.local.get({ blockedChannels: [] }, (data) => {
            const filtered = data.blockedChannels.filter(ch => ch.name !== nameToRemove);
            chrome.storage.local.set({ blockedChannels: filtered }, () => {
                loadData();
            });
        });
    };

    const updateStatus = (msg, color) => {
        if (statusEl) {
            statusEl.textContent = msg;
            statusEl.style.color = color;
            setTimeout(() => statusEl.textContent = '', 2000);
        }
    };

    // --- Event Listeners ---
    if (saveButton) saveButton.addEventListener('click', saveChannel);
    if (channelInput) {
        channelInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') saveChannel();
        });
    }

    // Toggle Listener
    if (toggleBlocking) {
        toggleBlocking.addEventListener('change', () => {
            const isEnabled = toggleBlocking.checked;
            updateToggleUI(isEnabled);
            chrome.storage.local.set({ blockingEnabled: isEnabled });
        });
    }

    // --- Initial Load ---
    loadData();
});