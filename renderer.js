const { ipcRenderer } = require('electron');
const axios = require('axios');

const API_BASE = 'http://127.0.0.1:5555/api';

// State
let isConnected = false;
let autoLockEnabled = false;
let currentMatchId = null;
let audioContext = null;
let myPuuid = null;
let selectedRegion = 'eu';
let selectedAgent = '';
let favoriteAgents = JSON.parse(localStorage.getItem('favoriteAgents') || '[]');
let performanceMode = localStorage.getItem('performanceMode') === 'true';

// DOM Elements
const initBtn = document.getElementById('initBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const autolockToggle = document.getElementById('autolockToggle');
const autolockText = document.getElementById('autolockText');
const matchView = document.getElementById('matchView');
const noMatchScreen = document.getElementById('noMatchScreen');
const matchHeader = document.getElementById('matchHeader');
const mapBackground = document.getElementById('mapBackground');
const mapName = document.getElementById('mapName');
const gameMode = document.getElementById('gameMode');
const sideIndicator = document.getElementById('sideIndicator');
const sideText = document.getElementById('sideText');
const alliedPlayers = document.getElementById('alliedPlayers');
const enemyPlayers = document.getElementById('enemyPlayers');
const alliedCount = document.getElementById('alliedCount');
const enemyCount = document.getElementById('enemyCount');
const historyContainer = document.getElementById('historyContainer');
const toggleControls = document.getElementById('toggleControls');
const controlsContent = document.getElementById('controlsContent');
const minimizeWindowBtn = document.getElementById('minimizeWindowBtn');
const maximizeWindowBtn = document.getElementById('maximizeWindowBtn');
const closeWindowBtn = document.getElementById('closeWindowBtn');
const controlPanel = document.querySelector('.control-panel');

// Custom dropdown elements
const regionSelectHeader = document.getElementById('regionSelectHeader');
const regionValue = document.getElementById('regionValue');
const regionDropdown = document.getElementById('regionDropdown');

// Modal elements
const agentModal = document.getElementById('agentModal');
const agentGrid = document.getElementById('agentGrid');
const selectAgentBtn = document.getElementById('selectAgentBtn');
const selectedAgentDisplay = document.getElementById('selectedAgentDisplay');
const closeModal = document.getElementById('closeModal');

// Performance mode elements
const performanceModeToggle = document.getElementById('performanceModeToggle');
const performanceModeText = document.getElementById('performanceModeText');

// Agent icons
const AGENT_ICONS = {
    "Astra": "https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png",
    "Breach": "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png",
    "Brimstone": "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png",
    "Chamber": "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png",
    "Clove": "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png",
    "Cypher": "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png",
    "Deadlock": "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png",
    "Fade": "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png",
    "Gekko": "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png",
    "Harbor": "https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png",
    "ISO": "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png",
    "Jett": "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png",
    "KAYO": "https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png",
    "Killjoy": "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png",
    "Neon": "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png",
    "Omen": "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png",
    "Phoenix": "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png",
    "Raze": "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png",
    "Reyna": "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png",
    "Sage": "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png",
    "Skye": "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png",
    "Sova": "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png",
    "Tejo": "https://media.valorant-api.com/agents/b444168c-4e35-8076-db47-ef9bf368f384/displayicon.png",
    "Veto": "https://media.valorant-api.com/agents/92eeef5d-43b5-1d4a-8d03-b3927a09034b/displayicon.png",
    "Viper": "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png",
    "Vyse": "https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png",
    "Waylay": "https://media.valorant-api.com/agents/df1cb487-4902-002e-5c17-d28e83e78588/displayicon.png",
    "Yoru": "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png"
};

// Agent card backgrounds
const AGENT_CARDS = {
    "Astra": "https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/fullportrait.png",
    "Breach": "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/fullportrait.png",
    "Brimstone": "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/fullportrait.png",
    "Chamber": "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/fullportrait.png",
    "Clove": "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/fullportrait.png",
    "Cypher": "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/fullportrait.png",
    "Deadlock": "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/fullportrait.png",
    "Fade": "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/fullportrait.png",
    "Gekko": "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/fullportrait.png",
    "Harbor": "https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/fullportrait.png",
    "ISO": "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/fullportrait.png",
    "Jett": "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/fullportrait.png",
    "KAYO": "https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/fullportrait.png",
    "Killjoy": "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/fullportrait.png",
    "Neon": "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/fullportrait.png",
    "Omen": "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/fullportrait.png",
    "Phoenix": "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/fullportrait.png",
    "Raze": "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/fullportrait.png",
    "Reyna": "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/fullportrait.png",
    "Sage": "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/fullportrait.png",
    "Skye": "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/fullportrait.png",
    "Sova": "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/fullportrait.png",
    "Tejo": "https://media.valorant-api.com/agents/b444168c-4e35-8076-db47-ef9bf368f384/fullportrait.png",
    "Veto": "https://media.valorant-api.com/agents/92eeef5d-43b5-1d4a-8d03-b3927a09034b/fullportrait.png",
    "Viper": "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/fullportrait.png",
    "Vyse": "https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/fullportrait.png",
    "Waylay": "https://media.valorant-api.com/agents/df1cb487-4902-002e-5c17-d28e83e78588/fullportrait.png",
    "Yoru": "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/fullportrait.png"
};

const MAP_IMAGES = {
    "Ascent": "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
    "Split": "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
    "Fracture": "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png",
    "Bind": "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
    "Breeze": "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
    "District": "https://media.valorant-api.com/maps/690b3ed2-4dff-945b-8223-6da834e30d24/splash.png",
    "Icebox": "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png",
    "Lotus": "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png",
    "Pearl": "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png",
    "Sunset": "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png",
    "Haven": "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png",
    "Abyss": "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png",
    "The Range": "https://media.valorant-api.com/maps/ee613ee9-28b7-4beb-9666-08db13bb2244/splash.png",
    "Bonsai": "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e50-804b-0046830f1f63/splash.png",
    "Drift": "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
    "Piazza": "https://media.valorant-api.com/maps/de28aa9b-4cbe-1003-320e-6cb3ec309557/splash.png",
    "Kasbah": "https://media.valorant-api.com/maps/12452a9d-48c3-0b02-e7eb-0381c3520404/splash.png",
    "Glitch": "https://media.valorant-api.com/maps/d6336a5a-428f-c591-98db-c8a291159134/splash.png",
    "Corrode": "https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/splash.png"
};

const RANK_NAMES = {
    0: "Unranked",
    3: "Iron 1", 4: "Iron 2", 5: "Iron 3",
    6: "Bronze 1", 7: "Bronze 2", 8: "Bronze 3",
    9: "Silver 1", 10: "Silver 2", 11: "Silver 3",
    12: "Gold 1", 13: "Gold 2", 14: "Gold 3",
    15: "Platinum 1", 16: "Platinum 2", 17: "Platinum 3",
    18: "Diamond 1", 19: "Diamond 2", 20: "Diamond 3",
    21: "Ascendant 1", 22: "Ascendant 2", 23: "Ascendant 3",
    24: "Immortal 1", 25: "Immortal 2", 26: "Immortal 3",
    27: "Radiant"
};

const AGENT_CODES = {
    "Astra": "41fb69c1-4189-7b37-f117-bcaf1e96f1bf",
    "Breach": "5f8d3a7f-467b-97f3-062c-13acf203c006",
    "Brimstone": "9f0d8ba9-4140-b941-57d3-a7ad57c6b417",
    "Chamber": "22697a3d-45bf-8dd7-4fec-84a9e28c69d7",
    "Clove": "1dbf2edd-4729-0984-3115-daa5eed44993",
    "Cypher": "117ed9e3-49f3-6512-3ccf-0cada7e3823b",
    "Deadlock": "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235",
    "Fade": "dade69b4-4f5a-8528-247b-219e5a1facd6",
    "Gekko": "e370fa57-4757-3604-3648-499e1f642d3f",
    "Harbor": "95b78ed7-4637-86d9-7e41-71ba8c293152",
    "ISO": "0e38b510-41a8-5780-5e8f-568b2a4f2d6c",
    "Jett": "add6443a-41bd-e414-f6ad-e58d267f4e95",
    "KAYO": "601dbbe7-43ce-be57-2a40-4abd24953621",
    "Killjoy": "1e58de9c-4950-5125-93e9-a0aee9f98746",
    "Neon": "bb2a4828-46eb-8cd1-e765-15848195d751",
    "Omen": "8e253930-4c05-31dd-1b6c-968525494517",
    "Phoenix": "eb93336a-449b-9c1b-0a54-a891f7921d69",
    "Raze": "f94c3b30-42be-e959-889c-5aa313dba261",
    "Reyna": "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc",
    "Sage": "569fdd95-4d10-43ab-ca70-79becc718b46",
    "Skye": "6f2a04ca-43e0-be17-7f36-b3908627744d",
    "Sova": "320b2a48-4d9b-a075-30f1-1f93a9b638fa",
    "Tejo": "b444168c-4e35-8076-db47-ef9bf368f384",
    "Veto": "92eeef5d-43b5-1d4a-8d03-b3927a09034b",
    "Viper": "707eab51-4836-f488-046a-cda6bf494859",
    "Vyse": "efba5359-4016-a1e5-7626-b1ae76895940",
    "Waylay": "df1cb487-4902-002e-5c17-d28e83e78588",
    "Yoru": "7f94d92c-4234-0a36-9646-3a87eb8b5c89"
};

// Helper functions
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.error('Audio not supported:', e);
    }
}

function playNotificationSound() {
    if (!audioContext) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error('Error playing sound:', e);
    }
}

function showNotification(title, body) {
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationBody = document.getElementById('notificationBody');

    notificationTitle.textContent = title;
    notificationBody.textContent = body;
    notification.classList.remove('hidden');

    playNotificationSound();

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}

function getAgentNameFromId(characterId) {
    for (const [name, id] of Object.entries(AGENT_CODES)) {
        if (id === characterId) {
            return name;
        }
    }
    return "Unknown";
}

// Initialize connection
async function initialize() {
    const region = selectedRegion;

    try {
        initBtn.disabled = true;
        initBtn.innerHTML = '<span class="loading-spinner"></span> Connecting...';

        const response = await axios.post(`${API_BASE}/init`, { region });

        if (response.data.success) {
            isConnected = true;
            myPuuid = response.data.puuid;
            statusText.textContent = `Connected (${region.toUpperCase()})`;
            statusText.classList.add('connected');
            statusIndicator.classList.add('connected');
            initBtn.textContent = 'Connected';
            autolockToggle.disabled = false;
            selectAgentBtn.disabled = false;

            await loadAgents();
            startPolling();

            showNotification('Connected', 'Successfully connected to Valorant client');
        }
    } catch (error) {
        console.error('Connection failed:', error);
        statusText.textContent = 'Connection Failed';
        initBtn.textContent = 'Retry';
        initBtn.disabled = false;
        showNotification('Error', 'Failed to connect to Valorant client. Make sure Valorant is running.');
    }
}

// Toggle agent favorite
function toggleFavorite(agentName) {
    const index = favoriteAgents.indexOf(agentName);
    if (index > -1) {
        favoriteAgents.splice(index, 1);
    } else {
        favoriteAgents.push(agentName);
    }
    localStorage.setItem('favoriteAgents', JSON.stringify(favoriteAgents));
    loadAgents(); // Reload to update order
}

// Load available agents
async function loadAgents() {
    try {
        // Show loading state
        agentGrid.innerHTML = '<div class="loading-overlay"><span class="loading-spinner large"></span> Loading agents...</div>';

        const response = await axios.get(`${API_BASE}/agents`);
        let agents = response.data;

        // Sort agents: favorites first, then alphabetically
        agents.sort((a, b) => {
            const aFav = favoriteAgents.includes(a);
            const bFav = favoriteAgents.includes(b);

            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return a.localeCompare(b);
        });

        agentGrid.innerHTML = '';
        agents.forEach(agent => {
            const agentCard = AGENT_CARDS[agent];
            const isFavorite = favoriteAgents.includes(agent);

            const card = document.createElement('div');
            card.className = 'agent-card-modal' + (isFavorite ? ' favorited' : '');
            card.dataset.agent = agent;

            if (agentCard) {
                card.style.backgroundImage = `url('${agentCard}')`;
            }

            card.innerHTML = `
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    ${isFavorite ? '★' : '☆'}
                </button>
                <div class="agent-card-name">${agent}</div>
            `;

            // Favorite button handler
            const favBtn = card.querySelector('.favorite-btn');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(agent);
            });

            // Agent selection handler
            card.addEventListener('click', () => {
                // Remove selected from all cards
                document.querySelectorAll('.agent-card-modal').forEach(c => {
                    c.classList.remove('selected');
                });

                // Select this card
                card.classList.add('selected');
                selectedAgent = agent;
                selectedAgentDisplay.textContent = agent;

                // Close modal after selection
                setTimeout(() => {
                    agentModal.classList.add('hidden');
                }, 300);
            });

            agentGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load agents:', error);
    }
}

// Toggle auto-lock
async function toggleAutoLock() {
    if (!selectedAgent && !autoLockEnabled) {
        showNotification('Warning', 'Please select an agent first');
        return;
    }

    autoLockEnabled = !autoLockEnabled;

    try {
        await axios.post(`${API_BASE}/autolock`, {
            enabled: autoLockEnabled,
            agent: selectedAgent
        });

        if (autoLockEnabled) {
            autolockText.textContent = 'Disable';
            autolockToggle.classList.add('active');
            showNotification('Auto-Lock Enabled', `Will auto-lock ${selectedAgent} when match starts`);
        } else {
            autolockText.textContent = 'Enable';
            autolockToggle.classList.remove('active');
            showNotification('Auto-Lock Disabled', 'Agent auto-lock has been disabled');
        }
    } catch (error) {
        console.error('Failed to toggle auto-lock:', error);
        autoLockEnabled = !autoLockEnabled;
    }
}

// Update match display
function updateMatchDisplay(data) {
    if (data.state === 'PREGAME' || data.state === 'INGAME') {
        // Show match view
        matchView.classList.remove('hidden');
        noMatchScreen.classList.add('hidden');
        matchHeader.classList.remove('hidden');

        // Auto-hide top bar and control panel when in match
        document.querySelector('.top-bar').classList.add('hidden');
        controlPanel.classList.add('in-game');

        // Update map background
        if (data.map_name && MAP_IMAGES[data.map_name]) {
            const imageUrl = MAP_IMAGES[data.map_name];
            mapBackground.style.background = '';
            mapBackground.style.backgroundImage = `url('${imageUrl}')`;
        } else {
            // Fallback to a default dark background
            mapBackground.style.backgroundImage = '';
            mapBackground.style.background = 'linear-gradient(135deg, #0f1923 0%, #1c2733 100%)';
        }

        // Update match info
        mapName.textContent = data.map_name || 'Unknown Map';
        gameMode.textContent = data.state;

        // Detect if this is Team Deathmatch or FFA mode
        const isTeamDeathmatch = data.map_name === 'The Range' || !data.side;

        // Update layout based on mode
        if (isTeamDeathmatch) {
            matchView.classList.add('deathmatch-mode');
        } else {
            matchView.classList.remove('deathmatch-mode');
        }

        // Update side indicator (only for pregame/competitive modes)
        if (data.side && data.pregame) {
            sideIndicator.classList.remove('hidden');
            sideText.textContent = data.side.toUpperCase();
            sideIndicator.className = 'side-indicator ' + data.side.toLowerCase();
        } else {
            sideIndicator.classList.add('hidden');
        }

        // Update players
        updatePlayers(data.players, data.pregame, isTeamDeathmatch);

        // Check for new match
        if (data.match_id && data.match_id !== currentMatchId) {
            currentMatchId = data.match_id;
            showNotification('Match Found', `Map: ${data.map_name}`);
            updateHistory();
        }
    } else {
        // Show no match screen
        matchView.classList.add('hidden');
        noMatchScreen.classList.remove('hidden');
        matchHeader.classList.add('hidden');
        currentMatchId = null;
        mapBackground.style.backgroundImage = '';

        // Show top bar and control panel when not in match
        document.querySelector('.top-bar').classList.remove('hidden');
        controlPanel.classList.remove('in-game');

        // Reset window to default size when not in match
        ipcRenderer.invoke('resize-window', 1400, 900);
    }
}

// Calculate and resize window based on player count
function resizeWindowForPlayers(playerCount, isDeathmatch) {
    const TITLE_BAR_HEIGHT = 32;
    const PLAYER_CARD_WIDTH = 360;
    const PLAYER_CARD_HEIGHT = 100;
    const PLAYER_CARD_GAP = 8;
    const CONTROL_PANEL_HEIGHT = 60;
    const PADDING_VERTICAL = 32; // 1rem top + 1rem bottom from match-view
    const PADDING_HORIZONTAL = 48; // 1.5rem left + 1.5rem right from match-view
    const TEAM_PANEL_PADDING = 32; // 1rem per team-panel
    const MAP_NAME_SPACE = 80; // Space for large map name text

    let maxPlayersPerColumn;
    let columns;

    if (isDeathmatch) {
        // Deathmatch mode: 2 columns in grid layout
        columns = 2;
        maxPlayersPerColumn = Math.ceil(playerCount / 2);
    } else {
        // Team mode: 2 teams side by side
        columns = 2;
        maxPlayersPerColumn = Math.ceil(playerCount / 2);
    }

    // Calculate width based on player cards
    const cardsWidth = columns * PLAYER_CARD_WIDTH;
    const totalPaddingWidth = PADDING_HORIZONTAL + (columns * TEAM_PANEL_PADDING);
    const totalWidth = cardsWidth + totalPaddingWidth;

    // Calculate height based on player cards
    const contentHeight = (maxPlayersPerColumn * (PLAYER_CARD_HEIGHT + PLAYER_CARD_GAP)) + PADDING_VERTICAL + MAP_NAME_SPACE;
    const totalHeight = TITLE_BAR_HEIGHT + CONTROL_PANEL_HEIGHT + contentHeight;

    // Clamp between min and max
    const minWidth = 800;
    const maxWidth = 1600;
    const minHeight = 600;
    const maxHeight = 1080;

    const finalWidth = Math.max(minWidth, Math.min(maxWidth, totalWidth));
    const finalHeight = Math.max(minHeight, Math.min(maxHeight, totalHeight));

    ipcRenderer.invoke('resize-window', finalWidth, finalHeight);
}

// Update players display
function updatePlayers(players, isPregame, isDeathmatch = false) {
    if (!players || players.length === 0) {
        alliedPlayers.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No player data</div>';
        enemyPlayers.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No player data</div>';
        return;
    }

    // Resize window based on player count
    resizeWindowForPlayers(players.length, isDeathmatch);

    // Separate teams
    const allied = [];
    const enemy = [];

    // Check if this is a team-based mode
    const hasTeams = players.some(p => p.team === 'Blue' || p.team === 'Red');

    if (hasTeams && !isDeathmatch) {
        // Find which team we're on
        const myPlayer = players.find(p => p.puuid === myPuuid);
        const myTeam = myPlayer ? myPlayer.team : null;

        players.forEach(player => {
            if (player.team === myTeam) {
                allied.push(player);
            } else {
                enemy.push(player);
            }
        });
    } else {
        // Deathmatch or FFA mode - all players in allied
        allied.push(...players);
    }

    // Render teams
    alliedPlayers.innerHTML = '';
    enemyPlayers.innerHTML = '';

    if (isDeathmatch) {
        alliedCount.textContent = `${players.length} Players`;
        enemyCount.textContent = '';
    } else {
        alliedCount.textContent = `${allied.length}`;
        enemyCount.textContent = `${enemy.length}`;
    }

    allied.forEach(player => {
        alliedPlayers.appendChild(createPlayerCard(player, isPregame));
    });

    enemy.forEach(player => {
        enemyPlayers.appendChild(createPlayerCard(player, isPregame));
    });

    // If no enemies (deathmatch), hide enemy panel
    if (enemy.length === 0 && !isDeathmatch) {
        enemyPlayers.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">Free For All Mode</div>';
    }
}

// Create player card
function createPlayerCard(player, isPregame) {
    const card = document.createElement('div');
    card.className = 'player-card';

    const agentName = getAgentNameFromId(player.character_id);
    const agentIcon = AGENT_ICONS[agentName] || '';
    const agentCard = AGENT_CARDS[agentName] || '';
    const rankName = RANK_NAMES[player.competitive_tier] || 'Unranked';
    const playerName = player.name || 'Unknown Player';

    // Lock status (only in pregame)
    let lockStatusHTML = '';
    if (isPregame && player.character_locked !== undefined) {
        if (player.character_locked) {
            lockStatusHTML = '<span class="lock-status locked">Locked</span>';
        } else if (player.character_id) {
            lockStatusHTML = '<span class="lock-status hovering">Hovering</span>';
        }
    }

    card.innerHTML = `
        <img src="${agentIcon}" alt="${agentName}" class="player-agent-icon" onerror="this.style.display='none'">
        <div class="player-info" style="background-image: url('${agentCard}');">
            <div class="player-name-row">
                <span class="player-name clickable-name" data-name="${playerName}" title="Click to copy name">${playerName}</span>
                ${lockStatusHTML}
            </div>
            <div class="player-agent-name">${agentName}</div>
            <div class="player-stats-row">
                <div class="stat-badge">
                    <span>Rank:</span>
                    <span class="stat-value">${rankName}</span>
                </div>
                <div class="stat-badge">
                    <span>Lvl:</span>
                    <span class="stat-value">${player.account_level || 0}</span>
                </div>
            </div>
        </div>
    `;

    // Add click handler for copying player name
    const playerNameEl = card.querySelector('.player-name');
    playerNameEl.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(playerName);

            // Visual feedback
            playerNameEl.classList.add('copied');
            const originalText = playerNameEl.textContent;
            playerNameEl.textContent = '✓ Copied!';

            setTimeout(() => {
                playerNameEl.textContent = originalText;
                playerNameEl.classList.remove('copied');
            }, 1500);

            showNotification('Copied', `Player name "${playerName}" copied to clipboard`);
        } catch (err) {
            console.error('Failed to copy:', err);
            showNotification('Error', 'Failed to copy player name');
        }
    });

    return card;
}

// Update match history
async function updateHistory() {
    try {
        // Show loading state
        historyContainer.innerHTML = '<div class="loading-overlay"><span class="loading-spinner"></span> Loading history...</div>';

        const response = await axios.get(`${API_BASE}/history`);
        const history = response.data;

        if (history.length === 0) {
            historyContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);">No matches yet</div>';
            return;
        }

        historyContainer.innerHTML = '';

        history.reverse().forEach(match => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const date = new Date(match.timestamp * 1000);
            const timeStr = date.toLocaleTimeString();

            item.innerHTML = `
                <div>
                    <div class="history-map">${match.map}</div>
                    <div class="history-time">${timeStr}</div>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-dim);">${match.state}</div>
            `;

            historyContainer.appendChild(item);
        });
    } catch (error) {
        console.error('Failed to fetch history:', error);
    }
}

// Poll for updates
let pollInterval;
function startPolling() {
    pollInterval = setInterval(async () => {
        try {
            const response = await axios.get(`${API_BASE}/match`);
            updateMatchDisplay(response.data);
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 3000);
}

// Custom dropdown handlers
regionSelectHeader.addEventListener('click', (e) => {
    e.stopPropagation();
    regionDropdown.classList.toggle('hidden');
});

// Region options
const regionOptions = regionDropdown.querySelectorAll('.select-option');
regionOptions.forEach(option => {
    option.addEventListener('click', () => {
        const value = option.dataset.value;
        const text = option.querySelector('span').textContent;
        selectedRegion = value;
        regionValue.textContent = text;
        regionDropdown.classList.add('hidden');

        // Update selected state
        regionOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
    });
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!regionSelectHeader.contains(e.target) && !regionDropdown.contains(e.target)) {
        regionDropdown.classList.add('hidden');
    }
});

// Agent selection modal handlers
selectAgentBtn.addEventListener('click', () => {
    if (isConnected) {
        agentModal.classList.remove('hidden');
    } else {
        showNotification('Warning', 'Please connect to Valorant first');
    }
});

closeModal.addEventListener('click', () => {
    agentModal.classList.add('hidden');
});

// Close modal when clicking overlay
agentModal.addEventListener('click', (e) => {
    if (e.target === agentModal) {
        agentModal.classList.add('hidden');
    }
});

// Event listeners
initBtn.addEventListener('click', initialize);
autolockToggle.addEventListener('click', toggleAutoLock);

minimizeWindowBtn.addEventListener('click', () => {
    ipcRenderer.invoke('minimize-window');
});

maximizeWindowBtn.addEventListener('click', () => {
    ipcRenderer.invoke('maximize-window');
});

closeWindowBtn.addEventListener('click', () => {
    ipcRenderer.invoke('close-window');
});

toggleControls.addEventListener('click', () => {
    controlsContent.classList.toggle('hidden');
});

// Performance Mode toggle
function togglePerformanceMode() {
    performanceMode = !performanceMode;
    localStorage.setItem('performanceMode', performanceMode);

    if (performanceMode) {
        document.body.classList.add('performance-mode');
        performanceModeText.textContent = 'Disable';
        performanceModeToggle.classList.add('active');
        showNotification('Performance Mode', 'Animations disabled for better performance');
    } else {
        document.body.classList.remove('performance-mode');
        performanceModeText.textContent = 'Enable';
        performanceModeToggle.classList.remove('active');
        showNotification('Performance Mode', 'Animations enabled');
    }
}

// Initialize performance mode on load
if (performanceMode) {
    document.body.classList.add('performance-mode');
    performanceModeText.textContent = 'Disable';
    performanceModeToggle.classList.add('active');
}

performanceModeToggle.addEventListener('click', togglePerformanceMode);

// Initialize
initAudio();
