// Import Firebase modules directly
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js"; // Firebase init function
import { getDatabase, ref, set, onValue, update, runTransaction, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
//import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDuUsQjopuBXF5XWx7G4ltX0JHB8bG6Miw", // Replace with your actual API key if necessary
    authDomain: "supervive-arena-draft.firebaseapp.com",
    databaseURL: "https://supervive-arena-draft-default-rtdb.firebaseio.com",
    projectId: "supervive-arena-draft",
    storageBucket: "supervive-arena-draft.firebasestorage.app", // Corrected bucket name if needed
    messagingSenderId: "104305383802",
    appId: "1:104305383802:web:53be19f7377e6e70a7dec3",
    measurementId: "G-HTSJCRZTB5" // Corrected measurement ID if needed
};


// --- Initialize Firebase ---
let app; // Firebase App instance
let auth; // Firebase Auth service
let db;   // Firebase RTDB service
let authError = null; // Track auth specific errors

try {
    // Use the imported initializeApp here
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    //analytics = getAnalytics(app);
} catch (error) {
    console.error("Firebase initialization failed:", error);
    authError = error; // Store error to prevent auth attempts
    // Use a timeout to ensure the element exists if initialization fails early
    setTimeout(() => {
        const statusMsg = document.getElementById('status-message');
        if (statusMsg) statusMsg.textContent = "Error connecting to services.";
    }, 0);
}


// --- Constants and Global Data ---
const CHARACTERS = [
    // Character array remains the same...
    {name: 'Brall', icon: 'https://supervive.wiki.gg/images/thumb/f/fd/PortBrall.png/200px-PortBrall.png'},
    {name: 'Crysta', icon: 'https://supervive.wiki.gg/images/thumb/f/fd/PortCrysta.png/200px-PortCrysta.png'},
    {name: 'Carbine', icon: 'https://supervive.wiki.gg/images/thumb/4/46/PortCarbine.png/200px-PortCarbine.png'},
    {name: 'Ghost', icon: 'https://supervive.wiki.gg/images/thumb/1/19/PortGhost.png/200px-PortGhost.png'},
    {name: 'Jin', icon: 'https://supervive.wiki.gg/images/thumb/7/74/PortJin.png/200px-PortJin.png'},
    {name: 'Joule', icon: 'https://supervive.wiki.gg/images/thumb/4/46/PortJoule.png/200px-PortJoule.png'},
    {name: 'Myth', icon: 'https://supervive.wiki.gg/images/thumb/c/c1/PortMyth.png/200px-PortMyth.png'},
    {name: 'Saros', icon: 'https://supervive.wiki.gg/images/5/53/PortSaros.png'},
    {name: 'Shiv', icon: 'https://supervive.wiki.gg/images/thumb/d/d6/PortShiv.png/200px-PortShiv.png'},
    {name: 'Shrike', icon: 'https://supervive.wiki.gg/images/thumb/4/40/PortShrike.png/200px-PortShrike.png'},
    {name: 'Bishop', icon: 'https://supervive.wiki.gg/images/thumb/b/be/PortBishop.png/200px-PortBishop.png'},
    {name: 'Kingpin', icon: 'https://supervive.wiki.gg/images/thumb/1/11/PortKingpin.png/200px-PortKingpin.png'},
    {name: 'Felix', icon: 'https://supervive.wiki.gg/images/thumb/4/47/PortFelix.png/200px-PortFelix.png'},
    {name: 'Oath', icon: 'https://supervive.wiki.gg/images/thumb/2/2e/PortOath.png/200px-PortOath.png'},
    {name: 'Elluna', icon: 'https://supervive.wiki.gg/images/thumb/d/d3/PortElluna.png/200px-PortElluna.png'},
    {name: 'Eva', icon: 'https://supervive.wiki.gg/images/thumb/b/b2/PortEva.png/200px-PortEva.png'},
    {name: 'Zeph', icon: 'https://supervive.wiki.gg/images/thumb/9/93/PortZeph.png/200px-PortZeph.png'},
    {name: 'Beebo', icon: 'https://supervive.wiki.gg/images/thumb/a/af/PortBeebo.png/200px-PortBeebo.png'},
    {name: 'Celeste', icon: 'https://supervive.wiki.gg/images/thumb/5/53/PortCeleste.png/200px-PortCeleste.png'},
    {name: 'Hudson', icon: 'https://supervive.wiki.gg/images/thumb/e/e6/PortHudson.png/200px-PortHudson.png'},
    {name: 'Void', icon: 'https://supervive.wiki.gg/images/thumb/6/65/PortVoid.png/200px-PortVoid.png'}
];
const TOTAL_PICKS_NEEDED = 8; // Total picks across both teams
const DEFAULT_TIMER_DURATION = 30; // Default timer duration in seconds

// --- State Variables ---
let isMultiplayerMode = false; // *** THE CORE MODE FLAG ***
let local_currentPhase = 'setup';
let local_currentTeam = 'A';
let local_teamAPicks = [];
let local_teamBPicks = [];
let local_bannedCharacters = [];
let local_matchHistory = []; // Array of strings for local history display
let local_maxBansPerTeam = 1; // Default bans per team
let local_gameCounter = 0;
let local_draftActive = false;
let local_hunterExclusivity = true;
// --- NEW: Timer State (Local) ---
let local_timerEnabled = false;
let local_timerDuration = DEFAULT_TIMER_DURATION;
let local_timerIntervalId = null;
let local_timerEndTime = null; // Timestamp when the current timer ends

// --- Multiplayer Mode State ---
let mp_currentUserId = null;
let mp_currentDraftId = null;
let mp_draftSubscription = null; // Function to unsubscribe
let mp_playerRole = null; // 'captainA', 'captainB', 'spectator', null
let mp_draftState = {}; // Holds the current state received from Firebase
let mp_matchHistory = []; // *** NEW: Array for client-side MP history ***
let mp_gameCounter = 0;   // *** NEW: Counter for client-side MP history divs ***
// --- NEW: Timer State (Multiplayer - Managed Client-Side based on Firebase State) ---
let mp_timerIntervalId = null;
let mp_timerEndTime = null; // Timestamp when the current timer ends (calculated from Firebase)


// ========================================================================= //
// ========================== TIMER FUNCTIONS ============================== //
// ========================================================================= //

function stopTimer(mode = 'local') {
    const timerDisplay = document.getElementById('timer-display');
    if (mode === 'local') {
        if (local_timerIntervalId) {
            clearInterval(local_timerIntervalId);
            local_timerIntervalId = null;
            local_timerEndTime = null;
        }
    } else { // multiplayer
        if (mp_timerIntervalId) {
            clearInterval(mp_timerIntervalId);
            mp_timerIntervalId = null;
            mp_timerEndTime = null;
        }
    }
     if (timerDisplay) {
        timerDisplay.textContent = ''; // Clear display
        timerDisplay.classList.remove('elapsed'); // Remove elapsed styling
        timerDisplay.style.display = 'none'; // Hide timer
    }
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;

    let endTime = isMultiplayerMode ? mp_timerEndTime : local_timerEndTime;
    if (endTime === null) {
        timerDisplay.textContent = '';
        timerDisplay.classList.remove('elapsed');
        timerDisplay.style.display = 'none';
        return;
    }

    const now = Date.now();
    const remainingSeconds = Math.round((endTime - now) / 1000);

    timerDisplay.style.display = 'block'; // Make sure timer is visible

    if (remainingSeconds >= 0) {
        timerDisplay.textContent = `${remainingSeconds}`;
        timerDisplay.classList.remove('elapsed');
    } else {
        timerDisplay.textContent = `${remainingSeconds}`; // Show negative count
        timerDisplay.classList.add('elapsed');
    }
}

function startTimer(durationSeconds, mode = 'local') {
    stopTimer(mode); // Ensure any existing timer is stopped

    const endTime = Date.now() + durationSeconds * 1000;

    if (mode === 'local') {
        local_timerEndTime = endTime;
        local_timerIntervalId = setInterval(() => {
            updateTimerDisplay();
            // Optional: Add logic here if something should happen exactly when local timer hits 0
            // if (Date.now() >= local_timerEndTime && !document.getElementById('timer-display').classList.contains('elapsed')) {
            //     // First moment it becomes elapsed
            // }
        }, 1000); // Update every second
    } else { // multiplayer
        mp_timerEndTime = endTime;
        mp_timerIntervalId = setInterval(() => {
            updateTimerDisplay();
            // Optional: Add logic here if something should happen exactly when MP timer hits 0
        }, 1000); // Update every second
    }

    updateTimerDisplay(); // Initial display update
}

// Specifically for multiplayer, starts the timer based on Firebase state
function startMultiplayerTimerFromState(state) {
    stopTimer('multiplayer'); // Stop any existing MP timer first

    const timerEnabled = state?.settings?.timerEnabled ?? false;
    const timerDuration = state?.settings?.timerDuration ?? DEFAULT_TIMER_DURATION;
    const actionStartTime = state?.currentActionStartTime; // Timestamp from Firebase

    const timerDisplay = document.getElementById('timer-display');

    if (timerEnabled && actionStartTime && state.status === 'in_progress') {
        // Calculate the theoretical end time based on when the action started and the duration
        const expectedEndTime = actionStartTime + (timerDuration * 1000);
        const now = Date.now(); // Use client's current time
        const remainingMilliseconds = expectedEndTime - now;

        if (remainingMilliseconds > -60000) { // Only start if not already > 1min elapsed
             mp_timerEndTime = expectedEndTime; // Store the calculated end time
             mp_timerIntervalId = setInterval(updateTimerDisplay, 1000);
             updateTimerDisplay(); // Initial update
        } else {
            // Timer already significantly elapsed, don't start interval, just show final state
            mp_timerEndTime = expectedEndTime;
            updateTimerDisplay();
        }
    } else {
         // Timer is disabled, action hasn't started, or draft not in progress
         if(timerDisplay) {
             timerDisplay.textContent = '';
             timerDisplay.style.display = 'none';
             timerDisplay.classList.remove('elapsed');
         }
    }
}


// ========================================================================= //
// ========================== UTILITY FUNCTIONS ============================ //
// ========================================================================= //

function resetLocalState() {
    local_currentPhase = 'setup';
    local_currentTeam = 'A';
    local_teamAPicks = [];
    local_teamBPicks = [];
    local_bannedCharacters = [];
    local_matchHistory = []; // Clear local history strings
    local_draftActive = false;
    stopTimer('local'); // Stop local timer
    // local_gameCounter is NOT reset here, only when a new game starts
    // Don't reset config options like maxBansPerTeam, hunterExclusivity, timerEnabled, timerDuration
}

function resetMultiplayerState() {
     mp_currentDraftId = null;
     if (mp_draftSubscription) {
         try {
             mp_draftSubscription(); // Call the unsubscribe function
             console.log("MP: Unsubscribed from previous draft.");
         } catch (e) {
             console.warn("MP: Error unsubscribing from draft:", e);
         }
         mp_draftSubscription = null;
     }
     mp_playerRole = null;
     mp_draftState = {}; // Clear the cached draft state
     mp_matchHistory = []; // *** NEW: Clear client-side MP history ***
     stopTimer('multiplayer'); // Stop multiplayer timer
     // mp_gameCounter is NOT reset here, only when a new game starts
     // Clear session storage related to multiplayer room
     sessionStorage.removeItem('currentDraftId');
     sessionStorage.removeItem('playerRole');
}

function updateMode(newMode) {
    const previousMode = isMultiplayerMode;
    isMultiplayerMode = newMode;
    const historyContainer = document.getElementById('match-history-container');
    stopTimer(previousMode ? 'multiplayer' : 'local'); // Stop timer for the mode we're leaving

    if (previousMode && !newMode) {
        // --- Switched FROM Multiplayer TO Local ---
        resetMultiplayerState(); // Clears MP state and unsubscribes, stops MP timer
        resetLocalState();       // Clears local draft progress (keeps settings), stops local timer
        resetUIToLocal();        // Resets UI elements for local view
        updateCharacterPoolVisuals(); // Update visuals for local state
        enableLocalDraftControls(); // Enable local config/start buttons
        updateMultiplayerButtonStates(); // Update MP buttons (should enable if auth'd)
        if (historyContainer) {
            historyContainer.style.display = 'block'; // Ensure history area is visible
            historyContainer.querySelector('#match-history').innerHTML = ''; // Clear display
        }
    } else if (!previousMode && newMode) {
        // --- Switched FROM Local TO Multiplayer ---
        resetLocalState();        // Clears local draft progress, stops local timer
        resetUIForMultiplayer();  // Sets up UI placeholders for MP
        updateCharacterPoolVisuals(); // Update visuals for MP state (likely empty initially)
        disableLocalDraftControls(); // Disable local config/start buttons
        disableMultiplayerJoinCreateButtons(); // Disable Create/Join as we are now IN MP mode
        if (historyContainer) {
             historyContainer.style.display = 'block'; // Ensure history area is visible
             historyContainer.querySelector('#match-history').innerHTML = ''; // Clear display
        }
    } else {
         // Initial Load or No Change
         if (!newMode) { // Initial load to local (or staying local)
             resetUIToLocal();
             enableLocalDraftControls();
             updateMultiplayerButtonStates(); // Update MP buttons based on auth state
             updateCharacterPoolVisuals(); // Update visuals for initial local state
             if (historyContainer) historyContainer.style.display = 'block'; // Show local history
         } else { // Initial load to MP (e.g., auto-rejoin) or staying MP
             resetUIForMultiplayer(); // Ensure MP UI is set up
             updateCharacterPoolVisuals(); // Update visuals for initial MP state
             disableLocalDraftControls();
             updateMultiplayerButtonStates(); // Ensure create/join stay disabled/hidden
             if (historyContainer) historyContainer.style.display = 'block'; // Show MP history
         }
    }
}

// Helper function for clipboard notification
function notifyUser(message, duration = 2000) {
    const notificationsEl = document.getElementById('notifications');
    notificationsEl.className = 'notification'; // Ensure CSS defines initial state
    notificationsEl.textContent = message;
    notificationsEl.style.display = 'block'; // Make sure the notification is visible

    setTimeout(() => {
        notificationsEl.textContent = ''; // Clear the text after the timeout
        notificationsEl.style.display = 'none'; // Hide the notification
    }, duration);
}

// Helper to find captain UID for a team
function findCaptainUid(players, team) {
    if (!players) return null;
    for (const uid in players) {
        if (players[uid].role === 'captain' && players[uid].team === team) {
            return uid;
        }
    }
    return null;
}

// ========================================================================= //
// ======================== UI UPDATE FUNCTIONS ============================ //
// ========================================================================= //

// Creates the character pool elements ONCE on initial load.
function createCharacterPoolElements() {
    const pool = document.getElementById('character-pool');
    if (!pool || pool.children.length > 0) {
        console.log("Character pool already initialized or element not found.");
        return; // Don't re-create if already populated or element missing
    }
    console.log("Creating character pool elements...");

    CHARACTERS.forEach(char => {
        const charDiv = document.createElement('div');
        charDiv.className = 'character';
        charDiv.dataset.charName = char.name; // Store name in data attribute

        const img = document.createElement('img');
        img.src = char.icon;
        img.alt = char.name;
        img.loading = 'lazy';
        charDiv.appendChild(img);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = char.name;
        charDiv.appendChild(nameSpan);

        // Add event listener using the central dispatcher
        charDiv.addEventListener('click', () => handleCharacterClick(char.name));
        pool.appendChild(charDiv);
    });
}


function updateCharacterPoolVisuals() {
    const pool = document.getElementById('character-pool');
    if (!pool) return;

    let bans = [];
    let picksA = [];
    let picksB = [];
    let exclusivity = true;
    let currentTeam = null;
    let currentPhase = null;
    let draftStatus = 'setup'; // 'setup', 'waiting', 'in_progress', 'complete'
    let myTurn = false;
    let isSpectator = false;

    if (isMultiplayerMode && mp_draftState) {
        const data = mp_draftState;
        bans = data.bannedCharacters || [];
        picksA = data.teamAPicks || [];
        picksB = data.teamBPicks || [];
        exclusivity = data.settings?.hunterExclusivity ?? true;
        currentTeam = data.currentTeam;
        currentPhase = data.currentPhase;
        draftStatus = data.status || 'setup'; // Default to 'setup' if missing
        const iAmCaptainA = mp_playerRole === 'captainA';
        const iAmCaptainB = mp_playerRole === 'captainB';
        isSpectator = mp_playerRole === 'spectator';
        myTurn = !isSpectator && draftStatus === 'in_progress' && ((currentTeam === 'A' && iAmCaptainA) || (currentTeam === 'B' && iAmCaptainB));
    } else if (!isMultiplayerMode) {
        bans = local_bannedCharacters;
        picksA = local_teamAPicks;
        picksB = local_teamBPicks;
        exclusivity = local_hunterExclusivity;
        currentTeam = local_currentTeam;
        currentPhase = local_currentPhase;
        draftStatus = local_draftActive ? 'in_progress' : 'setup';
        myTurn = true; // In local mode, it's always "your" turn
        isSpectator = false;
    }

    // Iterate through existing character elements in the pool
    pool.childNodes.forEach(node => {
        // Skip non-element nodes
        if (node.nodeType !== Node.ELEMENT_NODE || !node.classList.contains('character')) return;

        const charDiv = node;
        const charName = charDiv.dataset.charName;
        if (!charName) return;

        // Reset classes
        charDiv.classList.remove('banned', 'selected', 'team-a-picked', 'team-b-picked', 'selectable', 'not-selectable', 'team-a-turn', 'team-b-turn');

        const isBanned = bans.includes(charName);
        const isPickedA = picksA.includes(charName);
        const isPickedB = picksB.includes(charName);
        let isSelectable = false;
        let isValidChoice = false;

        if (isBanned) charDiv.classList.add('banned');
        if (isPickedA) {
            if (exclusivity) charDiv.classList.add('selected');
            charDiv.classList.add('team-a-picked');
        }
        if (isPickedB) {
            if (exclusivity) charDiv.classList.add('selected');
            charDiv.classList.add('team-b-picked');
        }

        // Determine validity and selectability
        if (draftStatus === 'in_progress') {
             if (isMultiplayerMode) {
                 isValidChoice = isCharValidSelectionMP(charName, mp_draftState);
                 isSelectable = myTurn && isValidChoice; // Spectators cannot select
             } else {
                 isValidChoice = isCharValidSelectionLocal(charName);
                 isSelectable = isValidChoice;
             }
             if (currentTeam) {
                 charDiv.classList.add(currentTeam === 'A' ? 'team-a-turn' : 'team-b-turn');
             }
        } else { // Setup, Waiting, Complete
             isSelectable = false;
             isValidChoice = false;
        }

        // Apply classes
        charDiv.classList.toggle('selectable', isSelectable);
        // Only mark as not-selectable if draft is running and it's not selectable
        charDiv.classList.toggle('not-selectable', draftStatus === 'in_progress' && !isSelectable);

        // Adjust cursor
        if (isSelectable) {
            charDiv.style.cursor = 'pointer';
        } else if (isBanned || (exclusivity && (isPickedA || isPickedB)) || draftStatus === 'complete' || isSpectator) {
            charDiv.style.cursor = 'not-allowed'; // Spectators also get not-allowed
        } else {
            charDiv.style.cursor = 'default';
        }
    });
}


function updateTeamDisplay() {
    const teamADiv = document.getElementById('team-a-picks');
    const teamBDiv = document.getElementById('team-b-picks');
    if (!teamADiv || !teamBDiv) return;

    let picksA = [];
    let picksB = [];

    if (isMultiplayerMode && mp_draftState) {
        picksA = mp_draftState.teamAPicks || [];
        picksB = mp_draftState.teamBPicks || [];
    } else if (!isMultiplayerMode) {
        picksA = local_teamAPicks;
        picksB = local_teamBPicks;
    }

    // Cache character lookups
    const characterMap = new Map(CHARACTERS.map(c => [c.name, c]));

    const createPickHtml = (charName) => {
         const char = characterMap.get(charName);
         const iconSrc = char?.icon || ''; // Default placeholder if needed
         const altText = char?.name || 'Unknown';
         return `<div class="character picked"><img src="${iconSrc}" alt="${altText}" loading="lazy"><span>${altText}</span></div>`;
    };

    teamADiv.innerHTML = picksA.map(createPickHtml).join('');
    teamBDiv.innerHTML = picksB.map(createPickHtml).join('');
}

function updateStatusMessage() {
     const messageEl = document.getElementById('status-message');
     if (!messageEl) return;

     if (isMultiplayerMode) {
         const data = mp_draftState;
         const isSpectator = mp_playerRole === 'spectator';

         // Handle connection/initial states
         if (!mp_currentDraftId) {
              messageEl.textContent = authError ? "Connection Error" : (mp_currentUserId ? "Select or Create Room" : "Connecting...");
              return;
         }
         if (!data || !data.status) {
             const roomCodeDisplay = document.getElementById('display-room-code'); // Element might not exist
             // Check if draft ID exists but data is missing/empty (room deleted or invalid)
             if (mp_currentDraftId && Object.keys(mp_draftState).length === 0 && !mp_draftSubscription) {
                 messageEl.textContent = `Room ${roomCodeDisplay?.textContent || mp_currentDraftId} closed or not found.`;
             } else {
                 messageEl.textContent = "Loading room data...";
             }
             return;
         }

         // Handle different draft statuses
         switch (data.status) {
              case 'waiting':
                   const players = data.players || {};
                   let playerA = null, playerB = null;
                   for (const uid in players) {
                       if (players[uid].role === 'captain') {
                           if (players[uid].team === 'A') playerA = players[uid];
                           if (players[uid].team === 'B') playerB = players[uid];
                       }
                   }
                   let statusText = isSpectator ? 'Spectating - Waiting...' : 'Waiting...';
                   const capAConnected = playerA?.isConnected;
                   const capBConnected = playerB?.isConnected;
                   const capAReady = playerA?.isReady;
                   const capBReady = playerB?.isReady;

                   if (playerA && playerB) {
                       if (capAReady && capBReady) {
                           statusText = (capAConnected && capBConnected) ? (isSpectator ? "Spectating - Both ready!" : "Both ready! Captain A can start.") : (isSpectator ? "Spectating - Both ready! Waiting for connection..." : "Both ready! Waiting for connection...");
                       } else if (capAReady) {
                           statusText = isSpectator ? `Spectating - Captain A ready. Waiting for B...` : `Captain A ready. Captain B ${capBConnected ? 'not ready' : 'not connect'}...`;
                       } else if (capBReady) {
                           statusText = isSpectator ? `Spectating - Captain B ready. Waiting for A...` : `Captain B ready. Captain A ${capAConnected ? 'not ready' : 'not connected'}...`;
                       } else {
                            statusText = isSpectator ? `Spectating - Waiting for captains...` : `Waiting for captains ${capAConnected && capBConnected ? 'to ready up' : 'to connect'}...`;
                       }
                       // Add swap intent status
                       if (data.teamASwapIntent && data.teamBSwapIntent) {
                           statusText += " Swap requested by both!";
                       } else if (data.teamASwapIntent) {
                            statusText += " Swap requested by A.";
                       } else if (data.teamBSwapIntent) {
                            statusText += " Swap requested by B.";
                       }
                   } else if (playerA) {
                       statusText = isSpectator ? "Spectating - Waiting for Captain B..." : "Waiting for Captain B to join...";
                   } else if (playerB) {
                       statusText = isSpectator ? "Spectating - Waiting for Captain A..." : "Waiting for Captain A to join...";
                   } else {
                       statusText = isSpectator ? "Spectating - Waiting for Captain A..." : "Waiting for Captain A...";
                   }
                   messageEl.textContent = statusText;
                   break;
              case 'in_progress':
                   if (!data.currentTeam || !data.currentPhase) {
                       messageEl.textContent = isSpectator ? 'Spectating - Draft Starting...' : 'Draft Starting...';
                       return;
                   }
                   const teamName = data.currentTeam === 'A' ? (data.teamAName || 'Team A') : (data.teamBName || 'Team B');
                   const phaseText = data.currentPhase === 'ban' ? 'BAN' : 'PICK';
                   const iAmCaptainA = mp_playerRole === 'captainA';
                   const iAmCaptainB = mp_playerRole === 'captainB';
                   const turnPlayer = (data.currentTeam === 'A' && iAmCaptainA) || (data.currentTeam === 'B' && iAmCaptainB);
                   messageEl.textContent = `${isSpectator ? 'Spectating: ' : ''}${teamName} - ${phaseText}${turnPlayer ? ' (YOUR TURN)' : ''}`;
                   break;
              case 'complete':
                   // Use the client-side game counter for display consistency
                   const draftNum = mp_gameCounter || 1;
                   let completeStatus = `${isSpectator ? 'Spectating - ' : ''}Draft ${draftNum} Complete! Waiting to start next...`;
                    // Add swap intent status
                    if (data.teamASwapIntent && data.teamBSwapIntent) {
                        completeStatus += " Swap requested by both!";
                    } else if (data.teamASwapIntent) {
                        completeStatus += ` Swap requested by ${data.teamAName}.`;
                    } else if (data.teamBSwapIntent) {
                        completeStatus += ` Swap requested by ${data.teamBName}.`;
                    }
                   messageEl.textContent = completeStatus;
                   break;
              default:
                   messageEl.textContent = `${isSpectator ? 'Spectating - ' : ''}Status: ${data.status || 'Unknown'}`;
                   break;
         }
     } else { // Local Mode
         if (!local_draftActive) {
             // Status message handled by updateMultiplayerButtonStates when previous session detected
             const storedDraftId = sessionStorage.getItem('currentDraftId');
             if (!mp_currentUserId) {
                 messageEl.textContent = "Connecting...";
             } else if (!storedDraftId) {
                 messageEl.textContent = '';
             } else {
                 messageEl.textContent = `Previous session detected`;
             }
         } else {
              const teamHeading = document.getElementById(`team-${local_currentTeam.toLowerCase()}-heading`);
              const teamName = teamHeading?.firstChild?.textContent?.replace('✎', '').trim() || `Team ${local_currentTeam}`;
              const phaseText = local_currentPhase === 'ban' ? 'BAN' : 'PICK';
              messageEl.textContent = `${teamName} - ${phaseText}`;
         }
     }
}


function updateTeamNamesUI() {
     const teamAHeadingDiv = document.getElementById('team-a-heading');
     const teamBHeadingDiv = document.getElementById('team-b-heading');
     const teamACaptainElement = document.getElementById('team-a-captain');
     const teamBCaptainElement = document.getElementById('team-b-captain');

     if (!teamAHeadingDiv || !teamBHeadingDiv) return;

     if (isMultiplayerMode && mp_draftState) {
         const data = mp_draftState;
         const teamAName = (data?.teamAName || 'Team A');
         const teamBName = (data?.teamBName || 'Team B');
         const draftStatus = data?.status || 'setup';
         const canSwapOrEdit = (draftStatus === 'waiting' || draftStatus === 'complete');

         updatePlayerStatusUI(data?.players || {}, draftStatus); // Pass draftStatus

         const myPlayerData = data.players?.[mp_currentUserId];
         const myTeam = myPlayerData?.team;
         const myRole = myPlayerData?.role;
         const iAmCaptain = myRole === 'captain';
         const isSpectator = myRole === 'spectator';

         // --- Team A Heading/Button ---
         const buttonA = teamAHeadingDiv.querySelector('button');
         if(buttonA) {
             buttonA.className = ''; // Clear existing classes
             buttonA.innerHTML = ''; // Clear content
             buttonA.onclick = null; // Remove previous listener
             buttonA.disabled = true;
             buttonA.style.cursor = 'default';
             buttonA.classList.remove('swap-pending'); // Ensure pending class is removed initially
             buttonA.style.display = 'none'; // Hide by default for MP

             if (canSwapOrEdit && iAmCaptain) { // Only show for captains when applicable
                 buttonA.style.display = 'inline-block'; // Make visible
                 if (myTeam === 'A') { // I am Captain A
                     buttonA.innerHTML = '✎'; // Edit own team name
                     buttonA.className = 'edit-team-name';
                     buttonA.onclick = handleMultiplayerEditTeamName;
                     buttonA.disabled = draftStatus !== 'waiting' && draftStatus !== 'complete'; // Allow edit in waiting or complete
                     buttonA.style.cursor = buttonA.disabled ? 'not-allowed' : 'pointer';
                 } else if (myTeam === 'B') { // I am Captain B, viewing Team A
                     buttonA.innerHTML = '🔄'; // Swap intent
                     buttonA.className = 'swap-intent-button';
                     buttonA.onclick = handleSwapIntentClick;
                     buttonA.disabled = false;
                     buttonA.style.cursor = 'pointer';
                     if (data.teamBSwapIntent) { // If *my* (B's) intent is set for swapping
                         buttonA.classList.add('swap-pending');
                     }
                 }
             }
             // Set team name (always)
             teamAHeadingDiv.firstChild.textContent = teamAName + ' '; // Ensure space before button
         } else {
             teamAHeadingDiv.firstChild.textContent = teamAName; // No button? Just show name
         }


         // --- Team B Heading/Button ---
         const buttonB = teamBHeadingDiv.querySelector('button');
          if(buttonB) {
             buttonB.className = ''; // Clear existing classes
             buttonB.innerHTML = ''; // Clear content
             buttonB.onclick = null; // Remove previous listener
             buttonB.disabled = true;
             buttonB.style.cursor = 'default';
             buttonB.classList.remove('swap-pending'); // Ensure pending class is removed initially
             buttonB.style.display = 'none'; // Hide by default for MP

             if (canSwapOrEdit && iAmCaptain) { // Only show for captains when applicable
                 buttonB.style.display = 'inline-block'; // Make visible
                 if (myTeam === 'B') { // I am Captain B
                     buttonB.innerHTML = '✎'; // Edit own team name
                     buttonB.className = 'edit-team-name';
                     buttonB.onclick = handleMultiplayerEditTeamName;
                     buttonB.disabled = draftStatus !== 'waiting' && draftStatus !== 'complete'; // Only allow edit in waiting
                     buttonB.style.cursor = buttonB.disabled ? 'not-allowed' : 'pointer';
                 } else if (myTeam === 'A') { // I am Captain A, viewing Team B
                     buttonB.innerHTML = '🔄'; // Swap intent
                     buttonB.className = 'swap-intent-button';
                     buttonB.onclick = handleSwapIntentClick;
                     buttonB.disabled = false;
                     buttonB.style.cursor = 'pointer';
                     if (data.teamASwapIntent) { // If *my* (A's) intent is set for swapping
                         buttonB.classList.add('swap-pending');
                         if (buttonA) buttonA.classList.add('swap-pending'); // Also mark A's button if A requested
                     }
                 }
             }
              // Set team name (always)
              teamBHeadingDiv.firstChild.textContent = teamBName + ' '; // Ensure space before button
         } else {
             teamBHeadingDiv.firstChild.textContent = teamBName; // No button? Just show name
         }

     } else { // Local Mode
          const teamAHeadingSpan = teamAHeadingDiv?.firstChild;
          const teamBHeadingSpan = teamBHeadingDiv?.firstChild;
          const currentTeamAName = teamAHeadingSpan?.textContent?.replace(/[🔄✎]/, '').trim() || 'Team A';
          const currentTeamBName = teamBHeadingSpan?.textContent?.replace(/[🔄✎]/, '').trim() || 'Team B';

          if(teamAHeadingSpan) teamAHeadingSpan.textContent = currentTeamAName + ' ';
          if(teamBHeadingSpan) teamBHeadingSpan.textContent = currentTeamBName + ' ';
          if (teamACaptainElement) teamACaptainElement.textContent = '';
          if (teamBCaptainElement) teamBCaptainElement.textContent = '';

          // Handle local edit buttons
          const canEdit = !local_draftActive;
          const buttonA = teamAHeadingDiv.querySelector('button');
          const buttonB = teamBHeadingDiv.querySelector('button');
          [buttonA, buttonB].forEach(btn => {
               if (btn) {
                   btn.style.display = 'inline-block'; // Ensure visible in local
                   btn.innerHTML = '✎';
                   btn.className = 'edit-team-name';
                   btn.onclick = handleLocalEditTeamName; // Assign local handler
                   btn.disabled = !canEdit;
                   btn.style.cursor = canEdit ? 'pointer' : 'not-allowed';
                   btn.style.opacity = canEdit ? 0.6 : 0.2;
                   btn.classList.remove('swap-pending');
               }
           });
     }
}


// Modified to accept draftStatus to control emoji visibility
function updatePlayerStatusUI(players, draftStatus) {
     const teamACaptainElement = document.getElementById('team-a-captain');
     const teamBCaptainElement = document.getElementById('team-b-captain');
     const spectatorListElement = document.getElementById('spectator-list'); // Assuming an element exists with this ID
     if (!teamACaptainElement || !teamBCaptainElement || !spectatorListElement) {
        console.warn("Player status UI elements not found.");
        return;
     }

     let captainA = null, captainB = null;
     const spectators = [];
     for (const uid in players) {
         const player = players[uid];
         if (player.role === 'captain') {
             if (player.team === 'A') captainA = player;
             if (player.team === 'B') captainB = player;
         } else if (player.role === 'spectator' && player.isConnected) {
             spectators.push(player.displayName || `Spectator_${uid.substring(0,4)}`);
         }
     }

     // Conditionally show ready indicator based on draft status
     const showReady = draftStatus === 'waiting' || draftStatus === 'complete';
     const readyIndicator = (player) => (player && showReady) ? (player.isReady ? '✔️' : '⏳') : '';
     const connectionIndicator = (player) => player ? (player.isConnected ? '🟢' : '🔴') : '';

     teamACaptainElement.textContent = captainA
         ? `${captainA.displayName || 'Captain A'} ${connectionIndicator(captainA)}${readyIndicator(captainA)}`
         : '(...)';
     teamBCaptainElement.textContent = captainB
         ? `${captainB.displayName || 'Captain B'} ${connectionIndicator(captainB)}${readyIndicator(captainB)}`
         : '(...)';

     // Update spectator list display
     if (spectators.length > 0) {
         spectatorListElement.textContent = `${spectators.join(', ')}`;
         spectatorListElement.style.display = 'block'; // Ensure visibility if spectators exist
         spectatorListElement.closest('details').style.display = 'block'; // Show the details container
     } else {
         spectatorListElement.textContent = '';
         // Don't hide the element itself, just clear content
         // Hiding the parent 'details' element might be better if desired
         spectatorListElement.closest('details').style.display = 'none'; // Hide the details container if empty
     }
}


// --- LOCAL MODE Match History ---
function createLocalMatchHistoryEntry() {
     const historyContainer = document.getElementById('match-history');
     if (!historyContainer || isMultiplayerMode) return; // Only for local mode

     local_gameCounter++;
     const draftId = `draft${local_gameCounter}`;
     const label = `Draft ${local_gameCounter}: `;

     // Check if div already exists (shouldn't happen if logic is correct)
     if (document.getElementById(draftId)) {
         console.warn("Attempted to create duplicate local history div:", draftId);
         return;
     }

     const newDraftDiv = document.createElement('div');
     newDraftDiv.id = draftId;
     newDraftDiv.className = 'match-entry'; // Add class for potential styling
     newDraftDiv.textContent = label;
     historyContainer.appendChild(newDraftDiv); // Append the new div
}

function recordAndDisplayLocalMatchHistory(team, phase, character) {
      if (isMultiplayerMode || !local_draftActive) return;

      let entryText = '';
      const currentPickNumber = (team === 'A' ? local_teamAPicks.length : local_teamBPicks.length); // Pick number before adding

      if (phase === 'ban') {
          entryText = `${team} BAN: ${character || 'Skipped'}. `;
      } else if (phase === 'pick') {
          // Pick number should be 1-based for display
          entryText = `${team} PICK ${currentPickNumber}: ${character}. `;
      } else {
          return;
      }

      local_matchHistory.push(entryText); // Add to internal history array (can be removed if not needed)

      const draftId = `draft${local_gameCounter}`;
      const historyDisplayDiv = document.getElementById(draftId);

      if (historyDisplayDiv) {
          historyDisplayDiv.textContent += entryText; // Append the new action text
      } else {
          console.warn("Could not find local match history display div:", draftId);
      }
}
// --- END LOCAL MODE Match History ---


// --- MULTIPLAYER CLIENT-SIDE Match History ---
function createMultiplayerMatchHistoryEntry() {
    const historyContainer = document.getElementById('match-history');
    if (!historyContainer || !isMultiplayerMode) return; // Only for MP mode

    mp_gameCounter++; // Use MP counter
    const draftId = `mp-draft${mp_gameCounter}`; // Use distinct ID prefix
    const label = `Draft ${mp_gameCounter}: `;

    // Check if div already exists
    if (document.getElementById(draftId)) {
        console.warn("Attempted to create duplicate multiplayer history div:", draftId);
        return;
    }

    const newDraftDiv = document.createElement('div');
    newDraftDiv.id = draftId;
    newDraftDiv.className = 'match-entry';
    newDraftDiv.textContent = label;
    historyContainer.appendChild(newDraftDiv);
}

function recordAndDisplayMultiplayerMatchHistory(team, phase, character, currentPicksA, currentPicksB) {
    // Called *after* the state update in Firebase but *before* the UI fully refreshes
    // It records the action based on the state *before* this action was applied locally.
    if (!isMultiplayerMode || mp_draftState?.status !== 'in_progress') return;

    let entryText = '';
    let pickIndex = 0;

    if (phase === 'ban') {
        entryText = `${team} BAN: ${character || 'Skipped'}. `;
    } else if (phase === 'pick') {
        // Calculate pick number based on the arrays *before* the current pick was added
        pickIndex = (team === 'A' ? currentPicksA.length : currentPicksB.length) + 1;
        entryText = `${team} PICK ${pickIndex}: ${character || 'Unknown'}. `;
    } else {
        return;
    }

    mp_matchHistory.push(entryText); // Store in client-side array (optional)

    const draftId = `mp-draft${mp_gameCounter}`; // Use MP div ID
    const historyDisplayDiv = document.getElementById(draftId);

    if (historyDisplayDiv) {
        historyDisplayDiv.textContent += entryText; // Append the new action text
    } else {
        console.warn("Could not find multiplayer match history display div:", draftId);
        // Optionally, try creating it if it's missing unexpectedly
        // createMultiplayerMatchHistoryEntry();
        // const newHistoryDisplayDiv = document.getElementById(draftId);
        // if (newHistoryDisplayDiv) newHistoryDisplayDiv.textContent += entryText;
    }
}
// --- END MULTIPLAYER CLIENT-SIDE Match History ---


function resetUIToLocal() {
    // Hide MP specific elements
    const leaveBtn = document.getElementById('leave-room-button');
    if (leaveBtn) leaveBtn.classList.add('hidden');
    const readyBtn = document.getElementById('ready-button');
    if (readyBtn) readyBtn.classList.add('hidden');
    const joinContainer = document.getElementById('join-room-input-container');
    if (joinContainer) joinContainer.classList.add('hidden');
    const capA = document.getElementById('team-a-captain');
    if (capA) capA.textContent = '';
    const capB = document.getElementById('team-b-captain');
    if (capB) capB.textContent = '';
    const specListContainer = document.getElementById('spectator-list-container'); // Target the container
    if (specListContainer) specListContainer.style.display = 'none'; // Hide spectator section
    const reconnectBtn = document.getElementById('reconnect-button');
    if (reconnectBtn) reconnectBtn.classList.add('hidden');
    const cancelSessionBtn = document.getElementById('cancel-session-button');
    if (cancelSessionBtn) cancelSessionBtn.classList.add('hidden');

    // Reset general UI elements
    const statusMsg = document.getElementById('status-message');
    if (statusMsg) statusMsg.textContent = 'Configure and start draft';
    const picksA = document.getElementById('team-a-picks');
    if (picksA) picksA.innerHTML = '';
    const picksB = document.getElementById('team-b-picks');
    if (picksB) picksB.innerHTML = '';
    const history = document.getElementById('match-history');
    if (history) history.innerHTML = ''; // Clear history display
    const skipBtn = document.getElementById('skip-ban');
    if (skipBtn) skipBtn.style.setProperty('display', 'none');
    const configPanel = document.getElementById('config');
    if (configPanel) configPanel.classList.add('hidden');
    const startBtn = document.getElementById('start-draft');
    if (startBtn) startBtn.style.display = 'inline-block';
    const timerDisplay = document.getElementById('timer-display');
    if(timerDisplay) timerDisplay.style.display = 'none'; // Hide timer
    const configButton = document.getElementById('config-button'); // Show config button
    if(configButton) configButton.style.display = 'inline-block';


    // Update visuals and names for local mode
    updateCharacterPoolVisuals();
    updateTeamNamesUI(); // This will reset buttons to local '✎' mode
}

function resetUIForMultiplayer() {
     updateCharacterPoolVisuals(); // Update visuals based on MP state

     const picksA = document.getElementById('team-a-picks');
     if (picksA) picksA.innerHTML = '';
     const picksB = document.getElementById('team-b-picks');
     if (picksB) picksB.innerHTML = '';

     const statusMsg = document.getElementById('status-message');
     if (statusMsg) statusMsg.textContent = 'Joining room...';

     const history = document.getElementById('match-history');
     if (history) history.innerHTML = ''; // Clear history display

     const capA = document.getElementById('team-a-captain');
     if (capA) capA.textContent = '(...)';
     const capB = document.getElementById('team-b-captain');
     if (capB) capB.textContent = '(...)';
     const specListContainer = document.getElementById('spectator-list-container'); // Target the container
     if (specListContainer) specListContainer.style.display = 'block'; // Show spectator section in MP
     const timerDisplay = document.getElementById('timer-display');
     if(timerDisplay) timerDisplay.style.display = 'none'; // Hide timer initially


     const configPanel = document.getElementById('config');
     if (configPanel) configPanel.classList.add('hidden');
     const skipBtn = document.getElementById('skip-ban');
     if (skipBtn) skipBtn.style.display = 'none';
     const configButton = document.getElementById('config-button'); // Show config button initially
     if(configButton) configButton.style.display = 'inline-block';
     const readyButton = document.getElementById('ready-button'); // Show ready button initially
     if(readyButton) readyButton.classList.remove('hidden');


     //const readyBtn = document.getElementById('ready-button');
     //if (readyBtn) readyBtn.classList.add('hidden'); // Visibility handled by renderMultiplayerUI

     const reconnectBtn = document.getElementById('reconnect-button');
     if (reconnectBtn) reconnectBtn.classList.add('hidden');
     const cancelSessionBtn = document.getElementById('cancel-session-button');
     if (cancelSessionBtn) cancelSessionBtn.classList.add('hidden');

     updateTeamNamesUI(); // Update names/status/buttons for MP
}

// Renamed for clarity
function updateConfigInputsState(disabled, syncFromFirebase = false) {
    const exclusivityCheck = document.getElementById('hunter-exclusivity');
    const banSelect = document.getElementById('ban-count');
    const timerEnabledCheck = document.getElementById('timer-enabled');
    const timerDurationInput = document.getElementById('timer-duration');

    const elements = [exclusivityCheck, banSelect, timerEnabledCheck, timerDurationInput];

    if (syncFromFirebase && isMultiplayerMode && mp_draftState?.settings) {
        // Update UI elements to match Firebase state before changing disabled status
        const settings = mp_draftState.settings;
        if (exclusivityCheck) exclusivityCheck.checked = settings.hunterExclusivity ?? true;
        if (banSelect) banSelect.value = settings.maxTotalBans?.toString() ?? "2";
        if (timerEnabledCheck) timerEnabledCheck.checked = settings.timerEnabled ?? false;
        if (timerDurationInput) timerDurationInput.value = settings.timerDuration ?? DEFAULT_TIMER_DURATION;
    }

    elements.forEach(el => {
        if (el) {
            el.disabled = disabled;
        }
    });
}


function enableLocalDraftControls() {
    const configBtn = document.getElementById('config-button');
    if (configBtn) configBtn.disabled = false; // Enable config button

    updateConfigInputsState(false); // Enable config inputs

    const startButton = document.getElementById('start-draft');
    if (startButton) {
        startButton.disabled = local_draftActive;
        startButton.textContent = "Start Draft";
        startButton.style.display = 'inline-block';
    }
    const readyButton = document.getElementById('ready-button');
    if (readyButton) readyButton.classList.add('hidden');
}

function disableLocalDraftControls() {
      const configBtn = document.getElementById('config-button');
      if (configBtn) configBtn.disabled = true; // Disable config button

      updateConfigInputsState(true); // Disable config inputs

      const startBtn = document.getElementById('start-draft');
      // Visibility/state handled by renderMultiplayerUI in MP mode
      if (startBtn && !isMultiplayerMode) {
          startBtn.disabled = true; // Disable start button
          startBtn.style.display = 'none';
      } else if (startBtn && isMultiplayerMode) {
          // Don't hide/disable here, let renderMultiplayerUI control it
      }

      const configPanel = document.getElementById('config');
      if (configPanel) configPanel.classList.add('hidden'); // Hide config panel
      const skipBtn = document.getElementById('skip-ban');
      if (skipBtn) skipBtn.style.display = 'none'; // Hide skip ban
}

function disableMultiplayerJoinCreateButtons() {
     const createBtn = document.getElementById('create-room-button');
     const joinBtn = document.getElementById('join-room-button');
     const joinContainer = document.getElementById('join-room-input-container');
     const reconnectBtn = document.getElementById('reconnect-button');
     const cancelSessionBtn = document.getElementById('cancel-session-button');

     if(createBtn) {
         createBtn.disabled = true;
         createBtn.classList.add('hidden');
     }
      if(joinBtn) {
         joinBtn.disabled = true;
         joinBtn.classList.add('hidden');
     }
     if(joinContainer) joinContainer.classList.add('hidden');
     if(reconnectBtn) reconnectBtn.classList.add('hidden');
     if(cancelSessionBtn) cancelSessionBtn.classList.add('hidden');
}

function updateMultiplayerButtonStates() {
    const createBtn = document.getElementById('create-room-button');
    const joinBtn = document.getElementById('join-room-button');
    const leaveBtn = document.getElementById('leave-room-button');
    const readyBtn = document.getElementById('ready-button');
    const joinInputContainer = document.getElementById('join-room-input-container');
    const reconnectBtn = document.getElementById('reconnect-button');
    const cancelSessionBtn = document.getElementById('cancel-session-button');
    const configBtn = document.getElementById('config-button'); // Get config button

    if (!createBtn || !joinBtn || !leaveBtn || !joinInputContainer || !readyBtn || !reconnectBtn || !cancelSessionBtn || !configBtn) {
        console.warn("One or more MP control buttons not found.");
        return;
    }

    // --- Default state: Hide/disable most things ---
    createBtn.classList.add('hidden'); createBtn.disabled = true;
    joinBtn.classList.add('hidden'); joinBtn.disabled = true;
    leaveBtn.classList.add('hidden');
    readyBtn.classList.add('hidden'); // Visibility controlled by renderMultiplayerUI
    joinInputContainer.classList.add('hidden');
    reconnectBtn.classList.add('hidden'); reconnectBtn.disabled = true;
    cancelSessionBtn.classList.add('hidden'); cancelSessionBtn.disabled = true;
    configBtn.classList.add('hidden'); configBtn.disabled = true; // Hide/disable config button by default

    // --- Scenario 1: Actively IN a multiplayer room ---
    if (isMultiplayerMode) {
        leaveBtn.classList.remove('hidden'); // Show Leave
        // Config and Ready button visibility/state are handled by renderMultiplayerUI
        configBtn.classList.remove('hidden'); // Make config button potentially visible
        readyBtn.classList.remove('hidden'); // Make ready button potentially visible
        return; // Exit, let renderMultiplayerUI handle the rest
    }

    // --- Scenario 2: NOT in Multiplayer Mode ---
    configBtn.classList.remove('hidden'); // Config button is visible in local mode
    configBtn.disabled = local_draftActive; // Disabled if local draft active

    // Leave and Ready buttons are always hidden when not in MP mode.
    if (authError) {
        // Show nothing interactable if auth failed
        createBtn.classList.remove('hidden'); createBtn.disabled = true; createBtn.textContent = "Create (Error)";
        joinBtn.classList.remove('hidden'); joinBtn.disabled = true; joinBtn.textContent = "Join (Error)";
    } else if (!auth || !mp_currentUserId) {
        // Show disabled state while connecting/authenticating
        createBtn.classList.remove('hidden'); createBtn.disabled = true;
        joinBtn.classList.remove('hidden'); joinBtn.disabled = true;
    } else if (mp_currentUserId) {
        // --- User is Authenticated, NOT in a room ---
        const storedDraftId = sessionStorage.getItem('currentDraftId');

        if (storedDraftId) {
            // *** Previous session detected ***
            console.log("MP Buttons: Previous session detected, showing Reconnect/Cancel.");
            reconnectBtn.classList.remove('hidden');
            reconnectBtn.disabled = false;

            cancelSessionBtn.classList.remove('hidden');
            cancelSessionBtn.disabled = false;
            // Hide standard Create/Join
            createBtn.classList.add('hidden');
            joinBtn.classList.add('hidden');
            joinInputContainer.classList.add('hidden'); // Ensure input is hidden
        } else {
            // *** No previous session, show standard Create/Join ***
            console.log("MP Buttons: Authenticated, no session, showing Create/Join.");
            createBtn.classList.remove('hidden');
            createBtn.disabled = false;

            joinBtn.classList.remove('hidden');
            joinBtn.disabled = false;
            // Hide Reconnect/Cancel
            reconnectBtn.classList.add('hidden');
            cancelSessionBtn.classList.add('hidden');
            // Note: The join input container visibility is handled by the join button's click listener
        }
    } else {
        // Fallback: Should not be reachable if logic above is correct
        console.log("MP Buttons: Fallback state, keeping controls hidden.");
        createBtn.classList.add('hidden'); createBtn.disabled = true;
        joinBtn.classList.add('hidden'); joinBtn.disabled = true;
    }
    // Update status message separately
    updateStatusMessage();
}


function updateUIAfterJoinCreate(draftId) {
     console.log("Joined/Created room:", draftId);

     const leaveButton = document.getElementById('leave-room-button');
     if (leaveButton) leaveButton.classList.remove('hidden');

     updateMultiplayerButtonStates(); // Hide create/join/reconnect/cancel, show Leave/Config/Ready
     updateTeamNamesUI(); // Update names based on initial state
     // Clear history display area for the new room
     const historyDisplay = document.getElementById('match-history');
     if (historyDisplay) historyDisplay.innerHTML = '';
}

// ========================================================================= //
// ======================= LOCAL MODE LOGIC ================================ //
// ========================================================================= //

function handleLocalStartDraft() {
    if (local_draftActive || isMultiplayerMode) return;

    // Read config values
    const exclusivityCheck = document.getElementById('hunter-exclusivity');
    const banSelect = document.getElementById('ban-count');
    const timerEnabledCheck = document.getElementById('timer-enabled');
    const timerDurationInput = document.getElementById('timer-duration');

    local_hunterExclusivity = exclusivityCheck ? exclusivityCheck.checked : true;
    const totalBans = banSelect ? parseInt(banSelect.value) : 2;
    local_maxBansPerTeam = totalBans / 2;
    local_timerEnabled = timerEnabledCheck ? timerEnabledCheck.checked : false;
    local_timerDuration = timerDurationInput ? parseInt(timerDurationInput.value) : DEFAULT_TIMER_DURATION;
    if (local_timerDuration <= 0) local_timerDuration = DEFAULT_TIMER_DURATION; // Ensure positive duration


    // Reset state for the new draft
    resetLocalState(); // Clears picks, bans, history, sets phase/team, stops timer
    local_draftActive = true;
    local_currentPhase = local_maxBansPerTeam > 0 ? 'ban' : 'pick'; // Set starting phase
    local_currentTeam = 'A'; // Team A starts

    disableLocalDraftControls(); // Disables config inputs etc.
    const configPanel = document.getElementById('config');
    if (configPanel) configPanel.classList.add('hidden');
    const startButton = document.getElementById('start-draft');
    if (startButton) startButton.disabled = true;


    createLocalMatchHistoryEntry(); // Create the container div for this draft's history

    updateStatusMessage();
    updateCharacterPoolVisuals();
    updateTeamDisplay();
    updateTeamNamesUI(); // Disables team name edit buttons

    const skipBanBtn = document.getElementById('skip-ban');
    if (skipBanBtn) {
        skipBanBtn.style.display = (local_currentPhase === 'ban') ? 'inline-block' : 'none';
    }

    // Start timer if enabled
    if (local_timerEnabled) {
        startTimer(local_timerDuration, 'local');
    }
}


function handleLocalSelect(charName) {
    if (!local_draftActive || isMultiplayerMode || !isCharValidSelectionLocal(charName)) {
        return;
    }

    const currentTeam = local_currentTeam; // Capture before potential change
    const currentPhase = local_currentPhase; // Capture before potential change
    const currentPicksA = [...local_teamAPicks]; // Capture picks *before* adding
    const currentPicksB = [...local_teamBPicks];

    if (local_currentPhase === 'ban') {
        local_bannedCharacters.push(charName);
        recordAndDisplayLocalMatchHistory(currentTeam, currentPhase, charName); // Use captured state
        updateCharacterPoolVisuals();
        nextLocalPhase();
    } else if (local_currentPhase === 'pick') {
        if (local_currentTeam === 'A') {
            local_teamAPicks.push(charName);
        } else {
            local_teamBPicks.push(charName);
        }
        // Pass the state *before* the pick to the history function
        recordAndDisplayLocalMatchHistory(currentTeam, currentPhase, charName);
        updateCharacterPoolVisuals();
        updateTeamDisplay();
        nextLocalPhase();
    }
}


function handleLocalSkipBan() {
    if (!local_draftActive || local_currentPhase !== 'ban' || isMultiplayerMode) return;

    const currentTeam = local_currentTeam; // Capture state
    const currentPhase = local_currentPhase;

    const placeholder = `_skipped_ban_${local_currentTeam}_${local_bannedCharacters.length + 1}`;
    local_bannedCharacters.push(placeholder); // Store placeholder

    recordAndDisplayLocalMatchHistory(currentTeam, currentPhase, null); // Record skip
    updateCharacterPoolVisuals(); // Update visuals (skipped ban doesn't directly affect pool)
    nextLocalPhase();
}


function isCharValidSelectionLocal(charName) {
    if (!local_draftActive) return false;

    // Check if banned (only actual names, not placeholders)
    if (local_bannedCharacters.some(b => b === charName)) {
        return false;
    }

    if (local_currentPhase === 'ban') {
        // Cannot ban if already picked by either team
        return !local_teamAPicks.includes(charName) && !local_teamBPicks.includes(charName);
    } else if (local_currentPhase === 'pick') {
        // Check exclusivity
        if (local_hunterExclusivity) {
            if ((local_currentTeam === 'A' && local_teamBPicks.includes(charName)) ||
                (local_currentTeam === 'B' && local_teamAPicks.includes(charName))) {
                return false;
            }
        }
        // Check self-picks
        const myPicks = local_currentTeam === 'A' ? local_teamAPicks : local_teamBPicks;
        return !myPicks.includes(charName);
    }
    return false;
}


function nextLocalPhase() {
    if (!local_draftActive) return;

    // Count actual bans (excluding placeholders) for phase logic if needed,
    // but length is fine for simple alternation
    const totalBansMade = local_bannedCharacters.length;
    const totalExpectedBans = local_maxBansPerTeam * 2; // Total bans across both teams
    const totalPicksMade = local_teamAPicks.length + local_teamBPicks.length;

    if (local_currentPhase === 'ban') {
        if (totalBansMade >= totalExpectedBans) {
            local_currentPhase = 'pick';
            local_currentTeam = 'A'; // Team A always starts pick phase
        } else {
            local_currentTeam = local_currentTeam === 'A' ? 'B' : 'A'; // Alternate bans
        }
    } else if (local_currentPhase === 'pick') {
        if (totalPicksMade >= TOTAL_PICKS_NEEDED) {
            endLocalDraft();
            return; // Exit early as draft is over
        } else {
            // Determine next picking team (A-BB-AA-BB-A order)
            const currentPickIndex = totalPicksMade - 1; // 0-based index of the pick just made
            // Indices where B picks next: 0 (after A's 1st), 1 (B's 2nd), 4 (after A's 3rd), 5 (B's 4th)
            // Indices where A picks next: 2 (after B's 2nd), 3 (A's 3rd), 6 (after B's 4th)
            if (currentPickIndex === 0 || currentPickIndex === 1 || currentPickIndex === 4 || currentPickIndex === 5) {
                 local_currentTeam = 'B';
            } else { // Indices 2, 3, 6
                 local_currentTeam = 'A';
            }
        }
    }

    updateStatusMessage();
    updateCharacterPoolVisuals();

    const skipBanBtn = document.getElementById('skip-ban');
    if (skipBanBtn) {
        skipBanBtn.style.display = (local_draftActive && local_currentPhase === 'ban') ? 'inline-block' : 'none';
    }

    // Restart timer for the new turn if enabled
    if (local_timerEnabled) {
        startTimer(local_timerDuration, 'local');
    }
}


function endLocalDraft() {
    local_draftActive = false;
    stopTimer('local'); // Stop the timer

    const statusMessage = document.getElementById('status-message');
    if (statusMessage) statusMessage.textContent = 'Local Draft Complete!';

    const skipBan = document.getElementById('skip-ban');
    if (skipBan) skipBan.style.display = 'none';

    enableLocalDraftControls(); // Re-enable config, start button etc.
    updateCharacterPoolVisuals(); // Update pool to show final state (not selectable)
}


function handleLocalEditTeamName(event) {
    if (isMultiplayerMode) {
        alert("Use the appropriate multiplayer action."); // Should not happen if UI is right
        return;
    }
    if (local_draftActive){
        alert("Cannot change names during local draft.");
        return;
    }

    const button = event.target;
    const headingDiv = button.closest('div[id$="-heading"]');
    if (!headingDiv) return;

    const teamId = headingDiv.id.includes('a') ? 'A' : 'B';
    const nameSpan = headingDiv.firstChild;
    const currentName = nameSpan?.textContent?.replace('✎', '').trim() || (teamId === 'A' ? 'Team A' : 'Team B');

    const newName = prompt(`Enter new name for Team ${teamId}:`, currentName);

    if (newName && newName.trim() !== "" && newName.trim().length <= 20) {
        if (nameSpan) nameSpan.textContent = newName.trim() + ' ';
        // Update local storage if needed, or just rely on UI state
    } else if (newName !== null) { // User entered something invalid (empty or too long)
        alert("Invalid name (max 20 chars).");
    }
}


// ========================================================================= //
// ==================== MULTIPLAYER MODE LOGIC ============================= //
// ========================================================================= //

function createRoom() {
    if (!auth || !db || !mp_currentUserId || isMultiplayerMode) {
        alert('Cannot create room: Check connection/auth or if already in a room.');
        return;
    }

    console.log("Attempting to create multiplayer room...");

    const datePrefix = `${new Date().getUTCMonth() + 1}${new Date().getUTCDate()}`;
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newDraftId = `${datePrefix}-${randomPart}`;

    // Read config values from UI (creator sets the initial config)
    const banSelect = document.getElementById('ban-count');
    const exclusivityCheck = document.getElementById('hunter-exclusivity');
    const timerEnabledCheck = document.getElementById('timer-enabled');
    const timerDurationInput = document.getElementById('timer-duration');

    const teamAHeading = document.getElementById('team-a-heading')?.firstChild;
    const teamBHeading = document.getElementById('team-b-heading')?.firstChild;
    const teamAName = teamAHeading?.textContent?.replace(/[🔄✎]/, '').trim() || "Team A";
    const teamBName = teamBHeading?.textContent?.replace(/[🔄✎]/, '').trim() || "Team B";
    // Total bans selected in dropdown
    const totalBans = banSelect ? parseInt(banSelect.value) : 2; // Default 2 total (1 per team)
    let timerDuration = timerDurationInput ? parseInt(timerDurationInput.value) : DEFAULT_TIMER_DURATION;
    if (timerDuration <= 0) timerDuration = DEFAULT_TIMER_DURATION; // Ensure positive

    const initialDraftState = {
        settings: {
            maxTotalBans: totalBans,
            hunterExclusivity: exclusivityCheck ? exclusivityCheck.checked : true,
            timerEnabled: timerEnabledCheck ? timerEnabledCheck.checked : false, // NEW
            timerDuration: timerDuration, // NEW
            createdAt: serverTimestamp(),
        },
        status: 'waiting', // Initial status
        teamAName: teamAName,
        teamBName: teamBName,
        teamASwapIntent: false,
        teamBSwapIntent: false,
        // Core draft state - will be reset when new draft starts
        currentPhase: null,
        currentTeam: null,
        currentActionStartTime: null, // NEW: Timestamp for timer start
        pickOrderIndex: 0, teamAPicks: [], teamBPicks: [], bannedCharacters: [],
        players: {
            [mp_currentUserId]: {
                displayName: `${mp_currentUserId.substring(0, 4)}`, // Simple display name
                team: 'A',
                role: 'captain',
                isConnected: true, // Presence updates this
                isReady: false     // Start as not ready
            }
        },
    };

    const draftRef = ref(db, `drafts/${newDraftId}`);

    set(draftRef, initialDraftState).then(() => {
        console.log("MP: Room created successfully:", newDraftId);

        mp_currentDraftId = newDraftId;
        mp_playerRole = 'captainA';
        updateMode(true); // Switch to MP mode UI

        sessionStorage.setItem('currentDraftId', newDraftId);
        sessionStorage.setItem('playerRole', mp_playerRole);

        // --- Copy to Clipboard ---
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(newDraftId).then(() => {
                notifyUser(`Room Code copied to clipboard`, 2000); // Notify user
            }).catch(err => {
                console.error('Failed to copy room code automatically: ', err);
                //notifyUser(`Room Code: ${newDraftId}`, 5000); // Show code anyway
            });
        } else {
            console.warn('Clipboard API not supported.');
            //notifyUser(`Room Code: ${newDraftId}`, 5000); // Show code anyway
        }

        updateUIAfterJoinCreate(newDraftId); // Update UI elements
        subscribeToDraft(newDraftId);       // Start listening
        setupPresence(mp_currentUserId);    // Set up online status

    }).catch(error => {
        console.error("MP: Failed to create room:", error);
        alert("Error creating room. Please try again.");
        updateMode(false); // Revert to local mode UI on failure
    });
}

function joinRoom(roomCodeInput) {
    if (!auth || !db || !mp_currentUserId || isMultiplayerMode) {
        alert('Cannot join room: Check connection/auth or if already in a room.');
        return;
    }

    const roomCode = roomCodeInput.trim().toUpperCase();
    if (!roomCode) {
        alert('Please enter a valid room code.');
        return;
    }

    console.log("Attempting to join multiplayer room:", roomCode);

    const draftRef = ref(db, `drafts/${roomCode}`);
    let joinedRole = null;
    let joinedTeam = null;

    runTransaction(draftRef, (currentData) => {
        if (currentData === null) {
            // Room doesn't exist or was deleted. Abort transaction by returning undefined.
            // We will throw an error in the .catch block later for user feedback.
            // return;
            throw new Error(`Room ${roomCode} not found or access denied.`);

        }

        currentData.players = currentData.players || {};
        const existingPlayer = currentData.players[mp_currentUserId];

        if (existingPlayer) {
            // --- REJOINING ---
            console.log(`MP Transaction: User ${mp_currentUserId} rejoining ${roomCode} as ${existingPlayer.role}.`);
            // Update connection status (presence also handles this but good for immediate effect)
            currentData.players[mp_currentUserId].isConnected = true;
            // DO NOT reset isReady on rejoin
            joinedRole = existingPlayer.role; // Could be captainA, captainB, or spectator
            joinedTeam = existingPlayer.team; // Store team (null for spectators)
        } else {
            // --- JOINING FIRST TIME ---
            console.log(`MP Transaction: User ${mp_currentUserId} joining ${roomCode} first time.`);

            const captainAUid = findCaptainUid(currentData.players, 'A');
            const captainBUid = findCaptainUid(currentData.players, 'B');

            // Assign to captain slots if available
            if (!captainAUid) {
                 console.log(`MP Transaction: Assigning User ${mp_currentUserId} as Captain A.`);
                 currentData.players[mp_currentUserId] = {
                     displayName: `${mp_currentUserId.substring(0, 4)}`,
                     team: 'A', role: 'captain', isConnected: true,
                     isReady: false // Start not ready
                 };
                 joinedRole = 'captainA';
                 joinedTeam = 'A';
            } else if (!captainBUid) {
                 console.log(`MP Transaction: Assigning User ${mp_currentUserId} as Captain B.`);
                 currentData.players[mp_currentUserId] = {
                     displayName: `${mp_currentUserId.substring(0, 4)}`,
                     team: 'B', role: 'captain', isConnected: true,
                     isReady: false // Start not ready
                 };
                 joinedRole = 'captainB';
                 joinedTeam = 'B';
            // *** START SPECTATOR CHANGE ***
            } else {
                 // If both captain slots are taken, join as spectator
                 console.log(`MP Transaction: Assigning User ${mp_currentUserId} as Spectator.`);
                 currentData.players[mp_currentUserId] = {
                     displayName: `${mp_currentUserId.substring(0, 4)}`,
                     role: 'spectator',
                     isConnected: true,
                     team: null // Spectators don't belong to a team
                 };
                 joinedRole = 'spectator';
                 // joinedTeam remains null
            // *** END SPECTATOR CHANGE ***
            }
        }
        return currentData; // Commit transaction

    }).then(() => {
        // --- Transaction Committed ---
        console.log("MP: Join room transaction successful for room:", roomCode);

        if (!joinedRole) { // Should not happen if logic above is correct
             throw new Error("Internal error joining room: Role not assigned.");
        }

        mp_playerRole = joinedRole; // Set role (captainA, captainB, or spectator)
        mp_currentDraftId = roomCode;
        updateMode(true); // Switch to MP mode UI

        sessionStorage.setItem('currentDraftId', mp_currentDraftId);
        sessionStorage.setItem('playerRole', mp_playerRole); // Store role including spectator
        updateUIAfterJoinCreate(mp_currentDraftId); // Update UI
        subscribeToDraft(mp_currentDraftId);      // Listen for updates
        setupPresence(mp_currentUserId);          // Set up presence

    }).catch((error) => {
        // --- Transaction Failed ---
        console.error(`MP: Failed to join room ${roomCode}:`, error);
        alert(`Error joining room: ${error.message || 'Unknown error.'}`);
        if (isMultiplayerMode) { // Revert UI if needed (e.g., failed rejoin attempt)
            leaveRoomCleanup();
        } else {
            // If join fails from the 'local' state (e.g. trying to rejoin a deleted room),
            // ensure the Reconnect/Cancel buttons are still shown if appropriate
            updateMultiplayerButtonStates();
        }
    });
}


function subscribeToDraft(draftId) {
    if (!db || !draftId) return;

    // Unsubscribe from previous listener
    if (mp_draftSubscription) {
        try { mp_draftSubscription(); } catch(e) { console.warn("Error unsubscribing:", e); }
        mp_draftSubscription = null;
    }

    const draftRef = ref(db, `drafts/${draftId}`);
    console.log(`MP: Subscribing to draft ${draftId}`);

    mp_draftSubscription = onValue(draftRef, (snapshot) => {
        // Check if still in this MP draft *before* processing
        if (!isMultiplayerMode || mp_currentDraftId !== draftId) {
            console.log(`MP: Received update for ${draftId}, but no longer in that draft. Ignoring & unsubscribing.`);
            if (mp_draftSubscription) {
                 try { mp_draftSubscription(); } catch(e) { /* ignore */ }
                 mp_draftSubscription = null;
            }
            return;
        }

        const data = snapshot.val();
        if (data) {
            // --- Data Received ---
            const previousStatus = mp_draftState?.status; // Get status before update
            const previousActionStartTime = mp_draftState?.currentActionStartTime; // Get previous start time
            mp_draftState = data; // Update local cache

            // Update local role based on data (in case of swap or if initially spectator)
            const myPlayerData = data.players?.[mp_currentUserId];
            if (myPlayerData) {
                 // Assign role based on data: captainA, captainB, or spectator
                 if (myPlayerData.role === 'captain') {
                     mp_playerRole = myPlayerData.team === 'A' ? 'captainA' : 'captainB';
                 } else if (myPlayerData.role === 'spectator') {
                     mp_playerRole = 'spectator';
                 } else {
                     mp_playerRole = null; // Unknown role
                 }
                 sessionStorage.setItem('playerRole', mp_playerRole); // Update session storage
            } else {
                 // Player data might be missing if kicked or state issue
                 console.warn(`MP: Player data for ${mp_currentUserId} not found in received state for ${draftId}.`);
                 // Consider leaving the room if player data is consistently missing?
                 // For now, just clear the role locally.
                 mp_playerRole = null;
                 sessionStorage.removeItem('playerRole');
            }

            renderMultiplayerUI(data); // Update the UI based on the new state

            // Start/Stop Multiplayer Timer based on state change
            if (data.status === 'in_progress' && data.currentActionStartTime && data.currentActionStartTime !== previousActionStartTime) {
                 // Timer should start or restart
                 startMultiplayerTimerFromState(data);
            } else if (data.status !== 'in_progress' && mp_timerIntervalId) {
                 // Draft ended or paused, stop timer
                 stopTimer('multiplayer');
            } else if (data.settings?.timerEnabled === false && mp_timerIntervalId) {
                // Timer was disabled while running
                stopTimer('multiplayer');
            } else if (data.settings?.timerEnabled && data.status === 'in_progress' && data.currentActionStartTime && !mp_timerIntervalId) {
                // Timer enabled, draft running, action started, but timer isn't running locally (e.g., after reconnect)
                startMultiplayerTimerFromState(data);
            }


        } else {
            // --- Data is Null (Room Deleted/Inaccessible) ---
            console.warn(`MP: Received null data for draft ${draftId}. Room deleted or inaccessible?`);
            if (isMultiplayerMode && mp_currentDraftId === draftId) {
                 alert(`Room ${draftId} closed or does not exist anymore.`);
                 leaveRoomCleanup(); // Go back to local mode
            }
            if (mp_draftSubscription) { // Clean up listener
                 try { mp_draftSubscription(); } catch(e) { /* ignore */ }
                 mp_draftSubscription = null;
            }
        }
    }, (error) => {
        // --- Subscription Error ---
        console.error(`MP: Firebase subscription error for ${draftId}:`, error);
        if (isMultiplayerMode && mp_currentDraftId === draftId) {
            alert("Connection error listening to draft. Check connection or refresh.");
            leaveRoomCleanup(); // Go back to local mode on critical error
        }
        if (mp_draftSubscription) { // Clean up listener
             try { mp_draftSubscription(); } catch(e) { /* ignore */ }
             mp_draftSubscription = null;
        }
    });
}


function leaveRoomCleanup() {
    const leavingDraftId = mp_currentDraftId;
    const leavingUserId = mp_currentUserId;

    console.log(`MP: Initiating leave cleanup for ${leavingUserId} from ${leavingDraftId}`);

    // --- 1. Update Firebase State (Mark disconnected, cancel disconnect hooks) ---
    if (db && leavingUserId && leavingDraftId) {
        const playerRef = ref(db, `drafts/${leavingDraftId}/players/${leavingUserId}`);
        const updates = {};
        updates[`/players/${leavingUserId}/isConnected`] = false;

        // Reset ready state only if they were a captain
        const currentRole = mp_playerRole; // Get role before clearing it
        if (currentRole === 'captainA' || currentRole === 'captainB') {
            updates[`/players/${leavingUserId}/isReady`] = false;
             // Also reset swap intent if leaving as captain
             if (currentRole === 'captainA') updates['/teamASwapIntent'] = false;
             if (currentRole === 'captainB') updates['/teamBSwapIntent'] = false;
        }

        // Update player status and potentially captain-specific fields
        update(ref(db, `drafts/${leavingDraftId}`), updates)
            .then(() => console.log(`MP: Marked ${leavingUserId} as disconnected (and potentially reset ready/intent) in ${leavingDraftId}.`))
            .catch(err => console.warn("MP: Minor error marking self offline/resetting state:", err));

        // Cancel the specific onDisconnect hook for this draft player object
        onDisconnect(playerRef).cancel()
             .then(() => console.log(`MP: Cancelled onDisconnect hook for draft ${leavingDraftId} player.`))
             .catch(err => console.warn("MP: Minor error cancelling draft player disconnect hook:", err));
    } else {
        console.log("MP: Skipping Firebase state update on leave (DB/User/DraftID missing).");
    }

    // --- 2. Reset Local Multiplayer State ---
    resetMultiplayerState(); // Clears IDs, role, state, subscription, session storage, mp_matchHistory, stops MP timer

    // --- 3. Switch Mode and Update UI ---
    updateMode(false); // Switches mode flag, resets UI to local, updates buttons, clears history display, stops local timer
    updateStatusMessage(); // Ensure status message reflects local mode
    console.log("MP: Leave cleanup complete. Switched to local mode.");
}


function renderMultiplayerUI(data) {
    if (!isMultiplayerMode || !data) return;

    // Update core UI elements based on new data
    updateTeamNamesUI(); // Includes player status/readiness/swap/edit button display (passes draftStatus)
    updateStatusMessage();
    updateTeamDisplay();
    updateCharacterPoolVisuals(); // Styles characters based on bans/picks/turn

    // Get references to dynamic buttons
    const startDraftBtn = document.getElementById('start-draft');
    const skipBanButton = document.getElementById('skip-ban');
    const leaveButton = document.getElementById('leave-room-button');
    const readyButton = document.getElementById('ready-button');
    const configButton = document.getElementById('config-button'); // Get config button
    const configPanel = document.getElementById('config');


    if (!startDraftBtn || !skipBanButton || !leaveButton || !readyButton || !configButton || !configPanel) {
        console.warn("MP renderMultiplayerUI: One or more control buttons or config panel missing.");
        return;
    }

    // Determine current state variables
    const draftStatus = data.status || 'setup'; // 'waiting', 'in_progress', 'complete'
    const iAmCaptainA = mp_playerRole === 'captainA';
    const iAmCaptainB = mp_playerRole === 'captainB';
    const isSpectator = mp_playerRole === 'spectator';
    const isMyCaptainRole = iAmCaptainA || iAmCaptainB;


    // Extract player info for easier access
    let playerA = null, playerB = null;
    let myPlayerData = null;
    let iAmReady = false;

    if (data.players) {
        myPlayerData = data.players[mp_currentUserId];
        for (const uid in data.players) {
            const p = data.players[uid];
            if (p.role === 'captain') {
                if (p.team === 'A') playerA = p;
                if (p.team === 'B') playerB = p;
            }
        }
        // Only captains can be ready
        iAmReady = isMyCaptainRole && myPlayerData?.isReady === true;
    }
    const bothConnected = playerA?.isConnected && playerB?.isConnected;
    const bothReady = playerA?.isReady && playerB?.isReady;


    // --- Button and Config Logic based on Draft Status ---

    const isDraftActive = draftStatus === 'in_progress';

    // Config Button & Panel Handling
    configButton.style.display = isDraftActive ? 'none' : 'inline-block'; // Hide during draft
    if (isDraftActive) {
        configPanel.classList.add('hidden'); // Ensure panel is hidden if draft starts while it's open
    }
    // Enable config button only for Captain A when draft is NOT active
    configButton.disabled = isDraftActive || !iAmCaptainA;
    // Disable config inputs if draft is active OR if user is not Captain A
    updateConfigInputsState(isDraftActive || !iAmCaptainA, true); // Disable/Enable inputs, sync values from Firebase

    // Ready Button
    const showReadyButton = !isDraftActive && !isSpectator && isMyCaptainRole;
    readyButton.style.display = showReadyButton ? 'inline-block' : 'none'; // Hide during draft or if spectator
    if (showReadyButton) {
        readyButton.disabled = false;
        readyButton.textContent = iAmReady ? "Unready" : "Ready Up";
    }

    // Start Draft Button (Visible for Captain A when draft NOT active)
    const showStartButton = !isDraftActive && iAmCaptainA;
    if (showStartButton) {
        startDraftBtn.style.display = 'inline-block';
        // Enable only if NOT active AND both captains are connected AND ready
        startDraftBtn.disabled = !(bothConnected && bothReady);
        startDraftBtn.textContent = "Start Draft";
    } else {
        startDraftBtn.style.display = 'none';
    }

    // Skip Ban Button (Visible and enabled for current captain during ban phase)
    const myTurn = (data.currentTeam === 'A' && iAmCaptainA) || (data.currentTeam === 'B' && iAmCaptainB);
    const showSkip = isDraftActive && data.currentPhase === 'ban' && myTurn && !isSpectator;
    skipBanButton.style.display = showSkip ? 'inline-block' : 'none';
    skipBanButton.disabled = !showSkip;

    // Leave Room Button (Always visible in MP mode)
    leaveButton.classList.remove('hidden');

    // Ensure Create/Join/Reconnect/Cancel remain hidden
    // Note: updateMultiplayerButtonStates handles the initial state when *entering* MP mode.
    // Here we ensure things stay hidden/disabled as needed based on the *current* MP state.
    disableMultiplayerJoinCreateButtons();
}


function handleMultiplayerSelect(charName) {
    if (!db || !isMultiplayerMode || !mp_currentUserId || !mp_currentDraftId || !mp_playerRole || mp_playerRole === 'spectator') {
        console.warn("MP Select cancelled: Conditions not met."); return;
    }
    const draftRef = ref(db, `drafts/${mp_currentDraftId}`);

    // --- Capture state *before* transaction for history ---
    const stateBeforeUpdate = JSON.parse(JSON.stringify(mp_draftState || {})); // Deep copy
    const teamBeforeUpdate = stateBeforeUpdate.currentTeam;
    const phaseBeforeUpdate = stateBeforeUpdate.currentPhase;
    const picksABeforeUpdate = [...(stateBeforeUpdate.teamAPicks || [])];
    const picksBBeforeUpdate = [...(stateBeforeUpdate.teamBPicks || [])];
    // --- End capture ---


    runTransaction(draftRef, (currentData) => {
        if (!currentData) { console.warn("MP Select TXN: Draft data null."); return; }
        if (currentData.status !== 'in_progress') { console.log("MP Select TXN: Draft not in progress."); return; }

        const myPlayerData = currentData.players?.[mp_currentUserId];
        // Check if player data exists and role is captain (already checked by initial guard, but good safety)
        if (!myPlayerData || myPlayerData.role !== 'captain') {
             console.log("MP Select TXN: Player data not found or not captain."); return;
        }
        const expectedTeam = myPlayerData.team;
        const isMyTurn = currentData.currentTeam === expectedTeam;

        if (!isMyTurn) { console.log("MP Select TXN: Not turn."); return; }
        if (!isCharValidSelectionMP(charName, currentData)) { console.log(`MP Select TXN: Invalid char ${charName}.`); return; }

        // Optional: Check timer elapsed if strict enforcement is needed serverside
        // const timerEnabled = currentData.settings?.timerEnabled ?? false;
        // const timerDuration = currentData.settings?.timerDuration ?? DEFAULT_TIMER_DURATION;
        // const actionStartTime = currentData.currentActionStartTime;
        // if (timerEnabled && actionStartTime && Date.now() > (actionStartTime + timerDuration * 1000)) {
        //      console.log("MP Select TXN: Timer elapsed. Action ignored.");
        //      // Optionally force skip the turn here? Needs more complex state management.
        //      return; // Abort transaction
        // }

        currentData.bannedCharacters = currentData.bannedCharacters || [];
        currentData.teamAPicks = currentData.teamAPicks || [];
        currentData.teamBPicks = currentData.teamBPicks || [];
        // REMOVED History update from Firebase state

        let updated = false;

        if (currentData.currentPhase === 'ban') {
            currentData.bannedCharacters.push(charName);
            updated = true;
        } else if (currentData.currentPhase === 'pick') {
            if (expectedTeam === 'A') {
                currentData.teamAPicks.push(charName);
            } else {
                currentData.teamBPicks.push(charName);
            }
            updated = true;
        }

        if (updated) {
            // --- Update client-side history immediately after confirming TXN will likely succeed ---
             recordAndDisplayMultiplayerMatchHistory(teamBeforeUpdate, phaseBeforeUpdate, charName, picksABeforeUpdate, picksBBeforeUpdate);
            // --- End client-side history update ---
            return calculateNextStateMP(currentData); // Calculate and return next state
        } else {
            console.warn("MP Select TXN: Update flag not set, phase invalid?");
            return; // Abort if no update occurred
        }
    }).catch((error) => {
        console.error("MP Select transaction failed:", error);
        // Consider if history needs rollback here? Unlikely needed as it reflects attempt.
        notifyUser(`Selection Error: ${error.message}`, 3000);
    });
}


function handleMultiplayerSkipBan() {
    if (!db || !isMultiplayerMode || !mp_currentUserId || !mp_currentDraftId || !mp_playerRole || mp_playerRole === 'spectator') {
         console.warn("MP Skip Ban cancelled: Conditions not met."); return;
    }
    const draftRef = ref(db, `drafts/${mp_currentDraftId}`);

    // --- Capture state *before* transaction for history ---
    const stateBeforeUpdate = JSON.parse(JSON.stringify(mp_draftState || {})); // Deep copy
    const teamBeforeUpdate = stateBeforeUpdate.currentTeam;
    const phaseBeforeUpdate = stateBeforeUpdate.currentPhase;
    const picksABeforeUpdate = [...(stateBeforeUpdate.teamAPicks || [])]; // Although not used for bans, maintain structure
    const picksBBeforeUpdate = [...(stateBeforeUpdate.teamBPicks || [])];
    // --- End capture ---

    runTransaction(draftRef, (currentData) => {
        if (!currentData) { console.warn("MP Skip Ban TXN: Draft data null."); return; }
        if (currentData.status !== 'in_progress' || currentData.currentPhase !== 'ban') { console.log("MP Skip Ban TXN: Not ban phase."); return; }

        const myPlayerData = currentData.players?.[mp_currentUserId];
        // Check if player data exists and role is captain
        if (!myPlayerData || myPlayerData.role !== 'captain') {
             console.log("MP Skip Ban TXN: Player data not found or not captain."); return;
        }
        const expectedTeam = myPlayerData.team;
        const isMyTurn = currentData.currentTeam === expectedTeam;

        if (!isMyTurn) { console.log("MP Skip Ban TXN: Not turn."); return; }

        // Optional: Check timer elapsed
        // const timerEnabled = currentData.settings?.timerEnabled ?? false;
        // const timerDuration = currentData.settings?.timerDuration ?? DEFAULT_TIMER_DURATION;
        // const actionStartTime = currentData.currentActionStartTime;
        // if (timerEnabled && actionStartTime && Date.now() > (actionStartTime + timerDuration * 1000)) {
        //     console.log("MP Skip TXN: Timer elapsed. Action ignored.");
        //     return; // Abort transaction
        // }

        currentData.bannedCharacters = currentData.bannedCharacters || [];
        const banIndex = currentData.bannedCharacters.length;
        const placeholder = `_skipped_ban_${expectedTeam}_${banIndex + 1}`;
        currentData.bannedCharacters.push(placeholder); // Add placeholder to bans array

        // REMOVED Firebase history recording
        // --- Update client-side history ---
         recordAndDisplayMultiplayerMatchHistory(teamBeforeUpdate, phaseBeforeUpdate, null, picksABeforeUpdate, picksBBeforeUpdate); // Pass null for skipped character
        // --- End client-side history update ---

        return calculateNextStateMP(currentData); // Calculate next state
    }).catch((error) => {
        console.error("MP Skip Ban transaction failed:", error);
        notifyUser(`Skip Ban Error: ${error.message}`, 3000);
    });
}

function handleMultiplayerReadyUp() {
    if (!db || !isMultiplayerMode || !mp_currentUserId || !mp_currentDraftId || !(mp_playerRole === 'captainA' || mp_playerRole === 'captainB')) {
         console.warn("MP Ready/Unready cancelled: Conditions not met."); return;
    }
    // Allow toggling ready only when waiting or complete
    if (mp_draftState?.status !== 'waiting' && mp_draftState?.status !== 'complete') {
        console.log("MP Ready/Unready: Can only change ready state when 'waiting' or 'complete'.");
        return;
    }

    const playerRef = ref(db, `drafts/${mp_currentDraftId}/players/${mp_currentUserId}`);
    const currentReadyState = mp_draftState?.players?.[mp_currentUserId]?.isReady ?? false;
    const newReadyState = !currentReadyState;

    console.log(`MP: Player ${mp_currentUserId} setting ready state to ${newReadyState}.`);

    // Also reset swap intent when changing ready state
    const updates = { isReady: newReadyState };
    if (mp_playerRole === 'captainA') updates['/teamASwapIntent'] = false;
    if (mp_playerRole === 'captainB') updates['/teamBSwapIntent'] = false;

    update(ref(db, `drafts/${mp_currentDraftId}`), {
        [`/players/${mp_currentUserId}/isReady`]: newReadyState,
        ...(mp_playerRole === 'captainA' ? { teamASwapIntent: false } : {}),
        ...(mp_playerRole === 'captainB' ? { teamBSwapIntent: false } : {}),
    })
        .then(() => {
            console.log(`MP: Player ${mp_currentUserId} ready state set to ${newReadyState} and swap intent reset.`);
            // UI update happens via onValue listener
        })
        .catch((error) => {
            console.error(`MP: Failed to update ready status/reset intent for ${mp_currentUserId}:`, error);
            alert("Error setting ready status. Please try again.");
        });
}


function handleMultiplayerStartDraft() {
    // Only Captain A can initiate
    if (!db || !isMultiplayerMode || !mp_currentUserId || !mp_currentDraftId || mp_playerRole !== 'captainA') {
         alert("Only Team A captain can start the draft when both are ready.");
         return;
    }
    const draftRef = ref(db, `drafts/${mp_currentDraftId}`);

    runTransaction(draftRef, (currentData) => {
        if (!currentData) { console.warn("MP Start Draft TXN: Draft data null."); return; }
        // Allow starting from 'waiting' or 'complete' state
        if (currentData.status !== 'waiting' && currentData.status !== 'complete') {
            console.log("MP Start Draft TXN: Can only start from 'waiting' or 'complete' status."); return;
        }

        // Check readiness and connection of BOTH captains
        let playerA = null, playerB = null;
        let playerAUid = null, playerBUid = null;
        if (currentData.players) {
             for (const uid in currentData.players) {
                const p = currentData.players[uid];
                if (p.role === 'captain') {
                    if (p.team === 'A') { playerA = p; playerAUid = uid;}
                    if (p.team === 'B') { playerB = p; playerBUid = uid;}
                }
             }
        }
        if (!playerA || !playerB || !playerA.isConnected || !playerB.isConnected || !playerA.isReady || !playerB.isReady) {
            throw new Error("Both captains must be connected and ready to start.");
        }

        // --- *** RESET LOGIC FOR STARTING A FRESH DRAFT *** ---
        console.log("MP Start Draft TXN: Resetting state for new draft.");
        currentData.teamAPicks = [];
        currentData.teamBPicks = [];
        currentData.bannedCharacters = [];
        currentData.pickOrderIndex = 0;
        currentData.teamASwapIntent = false; // Reset swap intents
        currentData.teamBSwapIntent = false;
        // Reset readiness for captains
        if (currentData.players) {
            if(playerAUid) currentData.players[playerAUid].isReady = false;
            if(playerBUid) currentData.players[playerBUid].isReady = false;
        }
        // --- *** END RESET LOGIC *** ---

        // --- Proceed with starting the draft ---
        currentData.status = 'in_progress';
        // Use total bans from settings
        const maxTotalBans = currentData.settings?.maxTotalBans ?? 0;
        const startPhase = maxTotalBans > 0 ? 'ban' : 'pick';
        currentData.currentPhase = startPhase;
        currentData.currentTeam = 'A'; // Team A always starts
        currentData.currentActionStartTime = serverTimestamp(); // NEW: Set timer start time

        // --- Setup Client-Side History for New Draft ---
        mp_matchHistory = []; // Clear previous client history array
        createMultiplayerMatchHistoryEntry(); // Creates the new div container
        // --- End Client-Side History Setup ---

        return currentData; // Commit the changes
    }).catch(err => {
        console.error("MP Failed to start draft transaction:", err);
        alert(`Failed to start draft: ${err.message}`);
    });
}


function handleMultiplayerEditTeamName(event) {
    if (!db || !isMultiplayerMode || !mp_currentDraftId || !mp_currentUserId || !mp_draftState) return;

    const button = event.target;
    const headingDiv = button.closest('div[id$="-heading"]');
    if (!headingDiv) return;
    const teamId = headingDiv.id.includes('team-a') ? 'A' : 'B'; // A or B
    const nameSpan = headingDiv.firstChild;
    const currentName = nameSpan?.textContent?.replace('✎', '').trim() || (teamId === 'A' ? 'Team A' : 'Team B');

    // Check permissions: Captain of team, and draft 'waiting' or 'complete'
    const myPlayerData = mp_draftState.players?.[mp_currentUserId];
    const draftStatus = mp_draftState.status;
    const canEdit = (myPlayerData?.role === 'captain' && myPlayerData?.team === teamId && (draftStatus === 'waiting' || draftStatus === 'complete'));

    if (!canEdit) {
        alert("Can only edit your team's name before the draft starts or after it completes."); return;
    }

    const newName = prompt(`Enter new name for Team ${teamId}:`, currentName);

    if (newName && newName.trim() !== "" && newName.trim().length <= 20) { // Increased limit back to 20
        const teamNameRef = ref(db, `drafts/${mp_currentDraftId}/team${teamId}Name`);
        set(teamNameRef, newName.trim())
            .then(() => console.log(`MP: Team ${teamId} name updated.`))
            .catch(err => { console.error("MP Failed to update team name:", err); alert("Error updating name."); });
    } else if (newName !== null) {
        alert("Invalid name (max 20 chars).");
    }
}

// --- NEW: Handle Multiplayer Config Update ---
function handleMultiplayerConfigUpdate(settingName, value) {
    if (!db || !isMultiplayerMode || !mp_currentDraftId || mp_playerRole !== 'captainA') {
         console.warn("MP Config Update cancelled: Conditions not met (not MP, no draft ID, or not Captain A).");
         // Revert UI optimistically - Firebase listener will correct if update fails
         updateConfigInputsState(false, true); // Sync from Firebase state
         return;
    }

    const draftStatus = mp_draftState?.status;
    if (draftStatus !== 'waiting' && draftStatus !== 'complete') {
         console.warn("MP Config Update cancelled: Can only change config when waiting or complete.");
          // Revert UI optimistically
         updateConfigInputsState(false, true); // Sync from Firebase state
         return;
    }

    console.log(`MP: Captain A updating setting '${settingName}' to '${value}'`);

    const settingRef = ref(db, `drafts/${mp_currentDraftId}/settings/${settingName}`);
    set(settingRef, value)
        .then(() => console.log(`MP: Setting '${settingName}' updated successfully.`))
        .catch((error) => {
            console.error(`MP: Failed to update setting '${settingName}':`, error);
            alert(`Error updating setting: ${settingName}. Please try again.`);
             // Revert UI optimistically on failure
             updateConfigInputsState(false, true); // Sync from Firebase state
        });
}


// --- NEW: Handle Swap Intent Click ---
function handleSwapIntentClick(event) {
    if (!db || !isMultiplayerMode || !mp_currentUserId || !mp_currentDraftId || !mp_draftState || !(mp_playerRole === 'captainA' || mp_playerRole === 'captainB')) {
        console.warn("Swap Intent Click Ignored: Conditions not met.");
        return;
    }

    const draftStatus = mp_draftState.status;
    if (draftStatus !== 'waiting' && draftStatus !== 'complete') {
        console.log("Swap Intent Click Ignored: Can only swap in 'waiting' or 'complete' status.");
        return;
    }

    const draftRef = ref(db, `drafts/${mp_currentDraftId}`);
    const myCurrentTeam = mp_playerRole === 'captainA' ? 'A' : 'B'; // Which team am I captain of?

    console.log(`Swap intent click by Captain ${myCurrentTeam}`);

    runTransaction(draftRef, (currentData) => {
        if (!currentData) {
             console.warn("Swap TXN: Draft data is null."); return;
        }
        if (currentData.status !== 'waiting' && currentData.status !== 'complete') {
             console.warn("Swap TXN: Status changed, aborting swap."); return;
        }

        const capAUid = findCaptainUid(currentData.players, 'A');
        const capBUid = findCaptainUid(currentData.players, 'B');
        const onlyOneCaptain = (capAUid && !capBUid) || (!capAUid && capBUid);
        const bothCaptains = capAUid && capBUid;

        // --- Scenario 1: Only one captain exists ---
        if (onlyOneCaptain) {
            const singleCaptainUid = capAUid || capBUid;
            const singleCaptainTeam = capAUid ? 'A' : 'B';

            // Check if the user clicking is the single captain
            if (singleCaptainUid === mp_currentUserId && myCurrentTeam === singleCaptainTeam) {
                console.log(`Swap TXN: Single captain ${singleCaptainTeam} initiating immediate swap.`);

                // Perform the swap directly
                // 1. Swap Team Names
                const tempName = currentData.teamAName;
                currentData.teamAName = currentData.teamBName;
                currentData.teamBName = tempName;

                // 2. Swap Team Picks (if complete)
                if (currentData.status === 'complete') {
                    const tempPicks = currentData.teamAPicks;
                    currentData.teamAPicks = currentData.teamBPicks;
                    currentData.teamBPicks = tempPicks;
                }

                // 3. Update the single captain's team
                if (currentData.players && currentData.players[singleCaptainUid]) {
                    currentData.players[singleCaptainUid].team = (singleCaptainTeam === 'A' ? 'B' : 'A'); // Assign to the other team
                } else {
                    console.error("Swap TXN Error: Single captain player data missing during swap!");
                    // Abort? For now, proceed but log error.
                }

                // 4. Reset Intents and Readiness
                currentData.teamASwapIntent = false;
                currentData.teamBSwapIntent = false;
                if (currentData.players && currentData.players[singleCaptainUid]) {
                    currentData.players[singleCaptainUid].isReady = false;
                }

            } else {
                // This case might occur if the clicker is not the captain, or state is inconsistent.
                console.warn("Swap TXN: Single captain exists, but clicker is not them or team mismatch. Aborting.");
                // Reset intents just in case state is weird
                currentData.teamASwapIntent = false;
                currentData.teamBSwapIntent = false;
            }

        // --- Scenario 2: Both captains exist ---
        } else if (bothCaptains) {
            console.log("Swap TXN: Both captains present, using intent logic.");

            // Toggle my team's intent
            if (myCurrentTeam === 'A') {
                currentData.teamASwapIntent = !currentData.teamASwapIntent;
            } else { // myCurrentTeam === 'B'
                currentData.teamBSwapIntent = !currentData.teamBSwapIntent;
            }

            console.log(`Swap TXN: Intent states - A: ${currentData.teamASwapIntent}, B: ${currentData.teamBSwapIntent}`);

            // Check if both intents are now true
            if (currentData.teamASwapIntent && currentData.teamBSwapIntent) {
                console.log("Swap TXN: Both intents true, performing swap!");

                // Perform the swap
                // 1. Swap Team Names
                const tempName = currentData.teamAName;
                currentData.teamAName = currentData.teamBName;
                currentData.teamBName = tempName;

                // 2. Swap Team Picks (if complete)
                if (currentData.status === 'complete') {
                    const tempPicks = currentData.teamAPicks;
                    currentData.teamAPicks = currentData.teamBPicks;
                    currentData.teamBPicks = tempPicks;
                }

                // 3. Swap Captain Assignments
                if (currentData.players && currentData.players[capAUid] && currentData.players[capBUid]) {
                    currentData.players[capAUid].team = 'B'; // Captain A moves to Team B
                    currentData.players[capBUid].team = 'A'; // Captain B moves to Team A
                } else {
                    console.error("Swap TXN Error: Captain player data missing during swap!");
                    // Abort transaction? Or proceed with partial swap? For now, proceed.
                }

                // 4. Reset Intents and Readiness
                currentData.teamASwapIntent = false;
                currentData.teamBSwapIntent = false;
                if (currentData.players) {
                    if (currentData.players[capAUid]) currentData.players[capAUid].isReady = false;
                    if (currentData.players[capBUid]) currentData.players[capBUid].isReady = false;
                }
            }
            // If only one intent is true after toggle, do nothing else, just commit the toggle

        // --- Scenario 3: No captains exist (or other weird state) ---
        } else {
            console.warn("Swap TXN: Neither single nor both captains found. Aborting swap logic.");
            // Reset intents for safety
            currentData.teamASwapIntent = false;
            currentData.teamBSwapIntent = false;
        }

        return currentData; // Commit changes (either intent toggle, full swap, or single swap)
    }).then(() => {
        console.log("Swap transaction completed.");
        // UI update will happen via onValue listener, including role update if swapped
    }).catch((error) => {
        console.error("MP Swap transaction failed:", error);
        notifyUser(`Swap Error: ${error.message || 'Unknown error.'}`, 3000);
        // Attempt to reset intent locally if the transaction fails badly
        // This tries to reset the user's *own* intent flag directly as a fallback.
        const draftRef = ref(db, `drafts/${mp_currentDraftId}`); // Need ref here too
        const fallbackIntentUpdate = {};
         if (mp_playerRole === 'captainA') fallbackIntentUpdate['teamASwapIntent'] = false;
         else if (mp_playerRole === 'captainB') fallbackIntentUpdate['teamBSwapIntent'] = false;
        if (Object.keys(fallbackIntentUpdate).length > 0) {
           update(draftRef, fallbackIntentUpdate).catch(err => console.warn("Failed to reset own swap intent after error:", err));
        }
    });
}


function isCharValidSelectionMP(charName, data) {
    if (!data || data.status !== 'in_progress' || !charName || !data.currentPhase || !data.currentTeam) return false;

    const phase = data.currentPhase;
    const team = data.currentTeam;
    const bans = data.bannedCharacters || [];
    const picksA = data.teamAPicks || [];
    const picksB = data.teamBPicks || [];
    const hunterExclusivity = data.settings?.hunterExclusivity ?? true;

    // Cannot select if banned (actual bans, ignore placeholders)
    if (bans.some(b => b === charName)) return false;

    if (phase === 'ban') {
        // Cannot ban if picked
        return !picksA.includes(charName) && !picksB.includes(charName);
    } else if (phase === 'pick') {
        // Check exclusivity
        if (hunterExclusivity && ((team === 'A' && picksB.includes(charName)) || (team === 'B' && picksA.includes(charName)))) return false;
        // Check self-picks
        const myPicks = team === 'A' ? picksA : picksB;
        return !myPicks.includes(charName);
    }
    return false;
}


function calculateNextStateMP(currentData) {
    currentData.settings = currentData.settings || {};
    const maxTotalBans = currentData.settings.maxTotalBans || 0; // Use total bans
    currentData.bannedCharacters = currentData.bannedCharacters || [];
    currentData.teamAPicks = currentData.teamAPicks || [];
    currentData.teamBPicks = currentData.teamBPicks || [];
    // pickOrderIndex might still be useful for other logic, keep it if needed
    // currentData.pickOrderIndex = (currentData.pickOrderIndex || 0) + 1;

    let phaseComplete = false;

    if (currentData.currentPhase === 'ban') {
        const bansMade = currentData.bannedCharacters.length;
        if (bansMade >= maxTotalBans) { // Compare with total bans
            currentData.currentPhase = 'pick';
            currentData.currentTeam = 'A'; // A starts pick
            phaseComplete = true;
        } else {
            currentData.currentTeam = currentData.currentTeam === 'A' ? 'B' : 'A'; // Alternate ban
            phaseComplete = true;
        }
    } else if (currentData.currentPhase === 'pick') {
        const totalPicksMade = currentData.teamAPicks.length + currentData.teamBPicks.length;
        if (totalPicksMade >= TOTAL_PICKS_NEEDED) {
            currentData.status = 'complete'; // Set status to complete
            currentData.currentTeam = null;
            currentData.currentPhase = null;
            currentData.currentActionStartTime = null; // Clear timer start time
            // Reset swap intents on completion
            currentData.teamASwapIntent = false;
            currentData.teamBSwapIntent = false;
            phaseComplete = true;
            // DO NOT reset picks/bans here, keep final state
            // DO NOT reset readiness here, allow ready up for next game
        } else {
             // Determine next picking team (A-BB-AA-BB-A)
             const currentPickIndex = totalPicksMade -1; // 0-based index of the pick just made
             // Indices where B picks next: 0, 1, 4, 5
             // Indices where A picks next: 2, 3, 6
            if (currentPickIndex === 0 || currentPickIndex === 1 || currentPickIndex === 4 || currentPickIndex === 5) {
                currentData.currentTeam = 'B';
            } else { // Indices 2, 3, 6
                currentData.currentTeam = 'A';
            }
            phaseComplete = true;
        }
    } else {
        console.error("MP calculateNextState: Invalid phase:", currentData.currentPhase);
    }

    // If the phase was completed (a valid ban/pick was made or draft finished), update the timer start time
    if (phaseComplete && currentData.status === 'in_progress') {
        currentData.currentActionStartTime = serverTimestamp();
    } else if (currentData.status !== 'in_progress') {
        currentData.currentActionStartTime = null; // Ensure it's null if draft isn't running
    }

    return currentData; // Return modified state
}


function setupPresence(userId) {
    if (!db || !userId) { console.warn("MP Presence setup skipped: DB/userId missing."); return; }

    const userStatusDatabaseRef = ref(db, `/status/${userId}`);
    const isOfflineForDatabase = { state: 'offline', last_changed: serverTimestamp() };
    const isOnlineForDatabase = { state: 'online', last_changed: serverTimestamp() };
    const connectedRef = ref(db, '.info/connected');

    onValue(connectedRef, (snapshot) => {
        const connected = snapshot.val();

        if (connected === false) {
            // Handled by global onDisconnect set below
            return;
        }

        // --- When Connected ---
        // 1. Set up global onDisconnect hook
        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            // 2. Set global status to online
            set(userStatusDatabaseRef, isOnlineForDatabase);

            // 3. Set up draft-specific presence *if* in MP mode
            const currentDraftIdForHook = mp_currentDraftId; // Capture current values
            const currentUserIdForHook = mp_currentUserId;
             const currentPlayerRoleForHook = mp_playerRole; // Capture current role

            if (isMultiplayerMode && currentDraftIdForHook && currentUserIdForHook) {
                 const playerRef = ref(db, `drafts/${currentDraftIdForHook}/players/${currentUserIdForHook}`);
                 const draftRootRef = ref(db, `drafts/${currentDraftIdForHook}`);

                 // a. Set up draft-specific onDisconnect (sets disconnected, resets captain ready/intent)
                 const onDisconnectUpdates = {
                     [`/players/${currentUserIdForHook}/isConnected`]: false,
                 };
                 // Only reset ready/intent if they are a captain on disconnect
                 if (currentPlayerRoleForHook === 'captainA') {
                     onDisconnectUpdates[`/players/${currentUserIdForHook}/isReady`] = false;
                     onDisconnectUpdates[`/teamASwapIntent`] = false;
                 } else if (currentPlayerRoleForHook === 'captainB') {
                     onDisconnectUpdates[`/players/${currentUserIdForHook}/isReady`] = false;
                     onDisconnectUpdates[`/teamBSwapIntent`] = false;
                 }
                 // Spectators just get marked as disconnected.

                 onDisconnect(draftRootRef).update(onDisconnectUpdates).then(() => {
                     // b. Set draft-specific status to connected (don't force ready state here)
                     update(playerRef, { isConnected: true })
                        .then(() => {/* console.log(`MP Presence: Draft ${currentDraftIdForHook} connected for ${userId}`); */})
                        .catch(err => console.warn(`MP Presence Error setting draft connected: ${err.message}`));
                 }).catch(err => console.error(`MP Presence Error setting draft onDisconnect:`, err));
            }
        }).catch(err => console.error("MP Presence Error setting global onDisconnect:", err));

    }, (error) => {
        console.error("MP Presence Error reading connection state:", error);
    });
}


// ========================================================================= //
// ==================== EVENT DISPATCHER & LISTENERS ======================= //
// ========================================================================= //

// Central handler for character clicks
function handleCharacterClick(charName) {
    if (isMultiplayerMode) handleMultiplayerSelect(charName);
    else handleLocalSelect(charName);
}

// NEW: Central handler for config button click
function handleConfigButtonClick() {
    const configPanel = document.getElementById('config');
    if (!configPanel) return;

    if (isMultiplayerMode) {
         // In MP mode, only Captain A can toggle when draft is not active
         const draftStatus = mp_draftState?.status;
         const canToggle = mp_playerRole === 'captainA' && (draftStatus === 'waiting' || draftStatus === 'complete');
         if (canToggle) {
            // Ensure inputs reflect current Firebase state before showing
             updateConfigInputsState(false, true); // Sync values, keep enabled
             configPanel.classList.toggle('hidden');
         } else {
             // If clicked by someone else or at the wrong time, ensure it's hidden
             configPanel.classList.add('hidden');
             // Optionally notify user? console.log("Config cannot be changed now / by you.");
         }
    } else {
        // In local mode, toggle if draft is not active
        if (!local_draftActive) {
            configPanel.classList.toggle('hidden');
        } else {
             configPanel.classList.add('hidden'); // Ensure hidden if draft active
        }
    }
}


function attachEventListeners() {
    // Start Draft Button (Local/MP)
    document.getElementById('start-draft')?.addEventListener('click', () => {
        if (isMultiplayerMode) handleMultiplayerStartDraft(); else handleLocalStartDraft();
    });

     // Skip Ban Button (Local/MP)
     document.getElementById('skip-ban')?.addEventListener('click', () => {
         if (isMultiplayerMode) handleMultiplayerSkipBan(); else handleLocalSkipBan();
     });

    // Edit Team Name / Swap Intent Buttons (Event delegation handled in updateTeamNamesUI by assigning onclick)
    // No direct listener needed here anymore as updateTeamNamesUI manages the button's behavior and handler.

    // Config Panel Toggle Button (Uses central handler)
    document.getElementById('config-button')?.addEventListener('click', handleConfigButtonClick);


    // --- Config Input Listeners (Handle Both Local and MP) ---
    document.getElementById('hunter-exclusivity')?.addEventListener('change', (e) => {
        const newValue = e.target.checked;
        if (isMultiplayerMode) {
            handleMultiplayerConfigUpdate('hunterExclusivity', newValue);
        } else if (!local_draftActive) {
            local_hunterExclusivity = newValue;
        } else {
            e.target.checked = local_hunterExclusivity; // Revert UI if changed inappropriately
        }
    });

    document.getElementById('ban-count')?.addEventListener('change', (e) => {
        const newValue = parseInt(e.target.value);
         if (isMultiplayerMode) {
             handleMultiplayerConfigUpdate('maxTotalBans', newValue);
         } else if (!local_draftActive) {
             local_maxBansPerTeam = newValue / 2; // Store per team locally
         } else {
             e.target.value = (local_maxBansPerTeam * 2).toString(); // Revert UI
         }
    });

    document.getElementById('timer-enabled')?.addEventListener('change', (e) => {
        const newValue = e.target.checked;
         if (isMultiplayerMode) {
             handleMultiplayerConfigUpdate('timerEnabled', newValue);
         } else if (!local_draftActive) {
             local_timerEnabled = newValue;
         } else {
             e.target.checked = local_timerEnabled; // Revert UI
         }
    });

    document.getElementById('timer-duration')?.addEventListener('change', (e) => {
         let newDuration = parseInt(e.target.value);
         if (isNaN(newDuration) || newDuration <= 0) {
             newDuration = DEFAULT_TIMER_DURATION; // Reset to default if invalid
             e.target.value = newDuration; // Correct the input display
         }

         if (isMultiplayerMode) {
             handleMultiplayerConfigUpdate('timerDuration', newDuration);
         } else if (!local_draftActive) {
             local_timerDuration = newDuration;
         } else {
              e.target.value = local_timerDuration; // Revert UI
         }
    });


    // --- Multiplayer Controls ---
    document.getElementById('create-room-button')?.addEventListener('click', createRoom);
    document.getElementById('join-room-button')?.addEventListener('click', () => {
        const joinContainer = document.getElementById('join-room-input-container');
        const roomInput = document.getElementById('room-code-input');
        if (mp_currentUserId && !isMultiplayerMode && joinContainer && roomInput) {
             joinContainer.classList.remove('hidden');
             roomInput.focus();
        }
    });
    document.getElementById('join-room-form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const roomInput = document.getElementById('room-code-input');
        const joinContainer = document.getElementById('join-room-input-container');
        if (!isMultiplayerMode && roomInput?.value) {
             joinRoom(roomInput.value);
             roomInput.value = '';
             if (joinContainer) joinContainer.classList.add('hidden');
        } else if (!roomInput?.value) {
             alert("Please enter a room code.");
        }
    });
    document.getElementById('leave-room-button')?.addEventListener('click', leaveRoomCleanup);
    document.getElementById('ready-button')?.addEventListener('click', () => {
         handleMultiplayerReadyUp();
    });

    // --- NEW LISTENERS for Reconnect/Cancel Session ---
    document.getElementById('reconnect-button')?.addEventListener('click', () => {
        const storedDraftId = sessionStorage.getItem('currentDraftId');
        if (storedDraftId && mp_currentUserId && !isMultiplayerMode) {
            console.log("Reconnect button clicked. Attempting to join room:", storedDraftId);
            joinRoom(storedDraftId);
        } else {
            console.warn("Reconnect button clicked but conditions not met (no stored ID, not auth'd, or already in MP mode).");
            updateMultiplayerButtonStates(); // Refresh buttons if state is weird
        }
    });

    document.getElementById('cancel-session-button')?.addEventListener('click', () => {
        console.log("Cancel Session button clicked. Clearing session storage.");
        sessionStorage.removeItem('currentDraftId');
        sessionStorage.removeItem('playerRole');
        notifyUser("Previous room session cancelled.", 2000);
        // Refresh the button states - should now show Create/Join
        updateMultiplayerButtonStates();
        updateStatusMessage(); // Update status message too
    });
    // --- END NEW LISTENERS ---
}

// ========================================================================= //
// ==================== AUTHENTICATION LOGIC ============================ //
// ========================================================================= //

function setupAuthentication() {
    if (!auth || authError) {
        console.error("Auth setup skipped: Firebase Auth failed or unavailable.", authError);
        updateMultiplayerButtonStates();
        return;
    }
    onAuthStateChanged(auth, handleAuthStateChange);
    signInAnonymously(auth)
        .catch((error) => {
            console.error("Anonymous sign-in failed:", error);
            authError = error;
            mp_currentUserId = null;
            updateMultiplayerButtonStates();
            const statusMsg = document.getElementById('status-message');
            if (statusMsg) statusMsg.textContent = "Authentication Failed.";
        });
}

function handleAuthStateChange(user) {
    if (user) { // Signed in
        console.log("handleAuthStateChange: Signed In. UID:", user.uid);
        if (mp_currentUserId === user.uid) { // Likely token refresh
            console.log("handleAuthStateChange: UID matches existing. Likely token refresh.");
            if (isMultiplayerMode) setupPresence(mp_currentUserId); // Ensure presence is active
            updateMultiplayerButtonStates(); // Refresh buttons (handles all states)
            return;
        }

        // --- New Sign-in or UID change ---
        console.log(`handleAuthStateChange: New User/UID. Old: ${mp_currentUserId}, New: ${user.uid}`);
        mp_currentUserId = user.uid;
        authError = null;
        setupPresence(mp_currentUserId); // Setup presence for new user

        // --- Auto-rejoin logic DISABLED - Now handled by manual Reconnect button ---
        if (!isMultiplayerMode) { // Only update buttons if not already in MP mode
            const storedDraftId = sessionStorage.getItem('currentDraftId');
            if (storedDraftId) {
                 console.log(`handleAuthStateChange: Found session ${storedDraftId}. Auto-rejoin disabled, showing manual buttons.`);
                 // No automatic joinRoom call here anymore
            } else {
                 console.log(`handleAuthStateChange: No session found. Showing standard Create/Join.`);
            }
            // *** ALWAYS update buttons after auth state change when not in MP mode ***
            // This will show Reconnect/Cancel OR Create/Join based on session storage check
            updateMultiplayerButtonStates();

        } else {
             console.log("handleAuthStateChange: Auth state changed while already in MP mode.");
             // If auth changes *while in a room*, we might need to rejoin or clean up.
             // For now, assume presence handles connection status, but a full rejoin might be needed.
             // Let's just refresh buttons for now. If they lose their captaincy/spectator status due to UID change,
             // the UI should reflect that after the next data update from Firebase.
             updateMultiplayerButtonStates();
             // We might want to trigger a UI update based on the current state if the role might have changed
             if (mp_draftState) {
                renderMultiplayerUI(mp_draftState);
             }
        }
    } else { // Signed out
        console.log("handleAuthStateChange: User signed out.");
        if (isMultiplayerMode) {
             console.log("Auth lost while in MP mode. Cleaning up.");
             leaveRoomCleanup(); // Resets state, unsubscribes, calls updateMode(false)
        } else {
             mp_currentUserId = null;
             authError = null;
             sessionStorage.removeItem('currentDraftId');
             sessionStorage.removeItem('playerRole');
             updateMultiplayerButtonStates(); // Disable MP buttons / show connecting
             enableLocalDraftControls(); // Ensure local usable
             updateStatusMessage(); // Set local message
        }
    }
}

// ========================================================================= //
// ========================= INITIALIZATION ================================ //
// ========================================================================= //

function initializeWebApp() {
    console.log("Initializing Web App...");
    createCharacterPoolElements();

    // Read initial local config values
    const exclusivityCheck = document.getElementById('hunter-exclusivity');
    const banSelect = document.getElementById('ban-count');
    const timerEnabledCheck = document.getElementById('timer-enabled');
    const timerDurationInput = document.getElementById('timer-duration');

    const totalBans = banSelect ? parseInt(banSelect.value) : 2;
    local_maxBansPerTeam = totalBans / 2;
    local_hunterExclusivity = exclusivityCheck ? exclusivityCheck.checked : true;
    local_timerEnabled = timerEnabledCheck ? timerEnabledCheck.checked : false; // Default false
    local_timerDuration = timerDurationInput ? parseInt(timerDurationInput.value) : DEFAULT_TIMER_DURATION;
    if (local_timerDuration <= 0) local_timerDuration = DEFAULT_TIMER_DURATION;

    console.log("Initial Local Config:", { local_maxBansPerTeam, local_hunterExclusivity, local_timerEnabled, local_timerDuration });

    // Ensure UI reflects default state
    if(timerEnabledCheck) timerEnabledCheck.checked = local_timerEnabled;
    if(timerDurationInput) timerDurationInput.value = local_timerDuration;


    // Set initial mode to local, update UI
    updateMode(false); // Starts in local mode, clears history display
    attachEventListeners();
    setupAuthentication(); // Start auth, may trigger UI update via handleAuthStateChange
    console.log("Initialization complete.");
}

// --- Start the initialization ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWebApp);
} else {
    initializeWebApp();
}