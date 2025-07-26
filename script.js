import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, runTransaction, serverTimestamp, onDisconnect, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js"; 
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDuUsQjopuBXF5XWx7G4ltX0JHB8bG6Miw", 
    authDomain: "supervive-arena-draft.firebaseapp.com",
    databaseURL: "https://supervive-arena-draft-default-rtdb.firebaseio.com",
    projectId: "supervive-arena-draft",
    storageBucket: "supervive-arena-draft.firebasestorage.app",
    messagingSenderId: "104305383802",
    appId: "1:104305383802:web:53be19f7377e6e70a7dec3",
    measurementId: "G-HTSJCRZTB5"
};

const CHARACTERS = [
    {name: 'Beebo', icon: 'https://supervive.wiki.gg/images/thumb/a/af/PortBeebo.png/200px-PortBeebo.png'},
    {name: 'Bishop', icon: 'https://supervive.wiki.gg/images/thumb/b/be/PortBishop.png/200px-PortBishop.png'},
    {name: 'Brall', icon: 'https://supervive.wiki.gg/images/thumb/f/fd/PortBrall.png/200px-PortBrall.png'},
    {name: 'Carbine', icon: 'https://supervive.wiki.gg/images/thumb/4/46/PortCarbine.png/200px-PortCarbine.png'},
    {name: 'Celeste', icon: 'https://supervive.wiki.gg/images/thumb/5/53/PortCeleste.png/200px-PortCeleste.png'},
    {name: 'Crysta', icon: 'https://supervive.wiki.gg/images/thumb/f/fd/PortCrysta.png/200px-PortCrysta.png'},
    {name: 'Elluna', icon: 'https://supervive.wiki.gg/images/thumb/d/d3/PortElluna.png/200px-PortElluna.png'},
    {name: 'Eva', icon: 'https://supervive.wiki.gg/images/thumb/b/b2/PortEva.png/200px-PortEva.png'},
    {name: 'Felix', icon: 'https://supervive.wiki.gg/images/thumb/4/47/PortFelix.png/200px-PortFelix.png'},
    {name: 'Ghost', icon: 'https://supervive.wiki.gg/images/thumb/1/19/PortGhost.png/200px-PortGhost.png'},
    {name: 'Hudson', icon: 'https://supervive.wiki.gg/images/thumb/e/e6/PortHudson.png/200px-PortHudson.png'},
    {name: 'Jin', icon: 'https://supervive.wiki.gg/images/thumb/7/74/PortJin.png/200px-PortJin.png'},
    {name: 'Joule', icon: 'https://supervive.wiki.gg/images/thumb/4/46/PortJoule.png/200px-PortJoule.png'},
    {name: 'Kingpin', icon: 'https://supervive.wiki.gg/images/thumb/1/11/PortKingpin.png/200px-PortKingpin.png'},
    {name: 'Mercury', icon: 'https://supervive.wiki.gg/images/thumb/8/83/TX_MediumPortrait_Alchemist.png/200px-TX_MediumPortrait_Alchemist.png'},
    {name: 'Myth', icon: 'https://supervive.wiki.gg/images/thumb/c/c1/PortMyth.png/200px-PortMyth.png'},
    {name: 'Nyx', icon: 'https://yt3.googleusercontent.com/u845Q3y51AOLkMJhq6ft2ANEDxCJXHpMV7bmx3JM_LJaMNNL5ZlmtbTbXvBsp-RLu_lHk7E91OI=s160-c-k-c0x00ffffff-no-rj'},
    {name: 'Oath', icon: 'https://supervive.wiki.gg/images/thumb/2/2e/PortOath.png/200px-PortOath.png'},
    {name: 'Saros', icon: 'https://supervive.wiki.gg/images/5/53/PortSaros.png'},
    {name: 'Shiv', icon: 'https://supervive.wiki.gg/images/thumb/d/d6/PortShiv.png/200px-PortShiv.png'},
    {name: 'Shrike', icon: 'https://supervive.wiki.gg/images/thumb/4/40/PortShrike.png/200px-PortShrike.png'},
    {name: 'Tetra', icon: 'https://supervive.wiki.gg/images/thumb/e/e3/PortTetra.png/200px-PortTetra.png'},
    {name: 'Void', icon: 'https://supervive.wiki.gg/images/thumb/6/65/PortVoid.png/200px-PortVoid.png'},
    {name: 'Wukong', icon: 'https://supervive.wiki.gg/images/thumb/1/17/PortWukong.png/200px-PortWukong.png'},
    {name: 'Zeph', icon: 'https://supervive.wiki.gg/images/thumb/9/93/PortZeph.png/200px-PortZeph.png'}
];

// const CHARACTERS = [ // lighter weight for later maybe
//     {name: 'Brall', icon: 'https://supervive.wiki.gg/images/thumb/0/04/TX_CS_Portrait_Ronin.png/60px-TX_CS_Portrait_Ronin.png'},
//     {name: 'Crysta', icon: 'https://supervive.wiki.gg/images/thumb/4/45/TX_CS_Portrait_BurstCaster.png/60px-TX_CS_Portrait_BurstCaster.png'},
//     {name: 'Carbine', icon: 'https://supervive.wiki.gg/images/thumb/7/79/TX_CS_Portrait_BountyHunter.png/60px-TX_CS_Portrait_BountyHunter.png'},
//     {name: 'Ghost', icon: 'https://supervive.wiki.gg/images/thumb/d/d7/TX_CS_Portrait_Assault.png/60px-TX_CS_Portrait_Assault.png'},
//     {name: 'Jin', icon: 'https://supervive.wiki.gg/images/thumb/e/e5/TX_CS_Portrait_Stalker.png/60px-TX_CS_Portrait_Stalker.png'},
//     {name: 'Joule', icon: 'https://supervive.wiki.gg/images/thumb/2/2c/TX_CS_Portrait_Storm.png/60px-TX_CS_Portrait_Storm.png'},
//     {name: 'Myth', icon: 'https://supervive.wiki.gg/images/thumb/a/a2/TX_CS_Portrait_Huntress.png/60px-TX_CS_Portrait_Huntress.png'},
//     {name: 'Saros', icon: 'https://supervive.wiki.gg/images/thumb/c/cf/TX_CS_Portrait_Saros.png/60px-TX_CS_Portrait_Saros.png'},
//     {name: 'Shiv', icon: 'https://supervive.wiki.gg/images/thumb/b/b1/TX_CS_Portrait_Flex.png/60px-TX_CS_Portrait_Flex.png'},
//     {name: 'Shrike', icon: 'https://supervive.wiki.gg/images/thumb/c/c5/TX_CS_Portrait_Sniper.png/60px-TX_CS_Portrait_Sniper.png'},
//     {name: 'Bishop', icon: 'https://supervive.wiki.gg/images/thumb/8/81/TX_CS_Portrait_RocketJumper.png/60px-TX_CS_Portrait_RocketJumper.png'},
//     {name: 'Kingpin', icon: 'https://supervive.wiki.gg/images/thumb/8/86/TX_CS_Portrait_HookGuy.png/60px-TX_CS_Portrait_HookGuy.png'},
//     {name: 'Felix', icon: 'https://supervive.wiki.gg/images/thumb/3/3b/TX_CS_Portrait_Firefox.png/60px-TX_CS_Portrait_Firefox.png'},
//     {name: 'Oath', icon: 'https://supervive.wiki.gg/images/thumb/d/d9/TX_CS_Portrait_ShieldBot.png/60px-TX_CS_Portrait_ShieldBot.png'},
//     {name: 'Elluna', icon: 'https://supervive.wiki.gg/images/thumb/f/f3/TX_CS_Portrait_ResHealer.png/60px-TX_CS_Portrait_ResHealer.png'},
//     {name: 'Eva', icon: 'https://supervive.wiki.gg/images/thumb/f/fe/TX_CS_Portrait_Succubus.png/60px-TX_CS_Portrait_Succubus.png'},
//     {name: 'Zeph', icon: 'https://supervive.wiki.gg/images/thumb/8/8c/TX_CS_Portrait_BacklineHealer.png/60px-TX_CS_Portrait_BacklineHealer.png'},
//     {name: 'Beebo', icon: 'https://supervive.wiki.gg/images/thumb/9/9b/TX_CS_Portrait_Beebo.png/60px-TX_CS_Portrait_Beebo.png'},
//     {name: 'Celeste', icon: 'https://supervive.wiki.gg/images/thumb/e/ea/TX_CS_Portrait_Freeze.png/60px-TX_CS_Portrait_Freeze.png'},
//     {name: 'Hudson', icon: 'https://supervive.wiki.gg/images/thumb/c/cb/TX_CS_Portrait_Gunner.png/60px-TX_CS_Portrait_Gunner.png'},
//     {name: 'Void', icon: 'https://supervive.wiki.gg/images/thumb/5/54/TX_CS_Portrait_Void.png/60px-TX_CS_Portrait_Void.png'}
// ];

const TOTAL_PICKS_NEEDED = 8;
const DEFAULT_TIMER_DURATION_SECONDS = 30;

let fbApp, fbAuth, fbDb, fbAuthError = null;
try {
    fbApp = initializeApp(FIREBASE_CONFIG);
    fbAuth = getAuth(fbApp);
    fbDb = getDatabase(fbApp);
} catch (error) {
    console.error("Firebase initialization failed:", error);
    fbAuthError = error;
    setTimeout(() => {
        if (DOMElements.statusMessage) DOMElements.statusMessage.textContent = "Error connecting to services.";
    }, 0);
}

const appState = {
    isMultiplayerMode: false,
    currentUserId: null,
    authError: null, 
    mpDraftSubscription: null, 

    local: {
        currentPhase: 'setup', 
        currentTeam: 'A',
        teamAPicks: [],
        teamBPicks: [],
        bannedCharacters: [],
        matchHistory: [],
        maxBansPerTeam: 1,
        gameCounter: 0,
        draftActive: false,
        hunterExclusivity: true,
        draftOrderType: 'Snake',
        timerEnabled: false,
        timerDuration: DEFAULT_TIMER_DURATION_SECONDS,
        timerIntervalId: null,
        timerEndTime: null,
    },
    multiplayer: {
        currentDraftId: null,
        playerRole: null, 
        draftState: {}, // Raw state from Firebase, includes currentGameNumber and matchHistory object
        timerIntervalId: null,
        timerEndTime: null, 
    }
};

const DOMElements = {
    teamAHeading: document.getElementById('team-a-heading'),
    teamACaptain: document.getElementById('team-a-captain'),
    teamAPicks: document.getElementById('team-a-picks'),
    teamBHeading: document.getElementById('team-b-heading'),
    teamBCaptain: document.getElementById('team-b-captain'),
    teamBPicks: document.getElementById('team-b-picks'),
    statusMessage: document.getElementById('status-message'),
    timerDisplay: document.getElementById('timer-display'),
    notifications: document.getElementById('notifications'),
    characterPool: document.getElementById('character-pool'),
    gameCounterDisplay: document.getElementById('game-counter'),
    createRoomButton: document.getElementById('create-room-button'),
    joinRoomButton: document.getElementById('join-room-button'),
    reconnectButton: document.getElementById('reconnect-button'),
    cancelSessionButton: document.getElementById('cancel-session-button'),
    joinRoomInputContainer: document.getElementById('join-room-input-container'),
    roomCodeInput: document.getElementById('room-code-input'),
    joinRoomForm: document.getElementById('join-room-form'),
    configButton: document.getElementById('config-button'),
    readyButton: document.getElementById('ready-button'),
    skipBanButton: document.getElementById('skip-ban'),
    startDraftButton: document.getElementById('start-draft'),
    leaveRoomButton: document.getElementById('leave-room-button'),
    configPanel: document.getElementById('config'),
    hunterExclusivityCheckbox: document.getElementById('hunter-exclusivity'),
    banCountSelect: document.getElementById('ban-count'),
    draftOrderTypeSelect: document.getElementById('draft-order-type-select'),
    timerEnabledCheckbox: document.getElementById('timer-enabled'),
    timerDurationInput: document.getElementById('timer-duration'),
    matchHistoryContainer: document.getElementById('match-history-container'),
    matchHistoryDisplay: document.getElementById('match-history'),
    spectatorListContainer: document.getElementById('spectator-list-container'),
    spectatorListDisplay: document.getElementById('spectator-list'),
};

const UIUpdater = {
    setText(element, text) { if (element) element.textContent = text; },
    setHtml(element, html) { if (element) element.innerHTML = html; },
    show(element, displayType = 'inline-block') { if (element) { element.classList.remove('hidden'); element.style.display = displayType; }},
    hide(element) { if (element) { element.classList.add('hidden'); element.style.display = 'none'; }},
    enable(element, condition = true) { if (element) element.disabled = !condition; }, 
    disable(element, condition = true) { if (element) element.disabled = condition; },
    toggleClass(element, className, force) { if (element) element.classList.toggle(className, force); },
    setProperty(element, property, value) { if (element) element.style.setProperty(property, value); },

    notifyUser(message, duration = 2000) {
        UIUpdater.setText(DOMElements.notifications, message);
        DOMElements.notifications.className = 'notification';
        UIUpdater.show(DOMElements.notifications, 'block');
        setTimeout(() => {
            UIUpdater.setText(DOMElements.notifications, '');
            UIUpdater.hide(DOMElements.notifications);
        }, duration);
    },

    updateTimerDisplay() {
        const timerDisplay = DOMElements.timerDisplay;
        if (!timerDisplay) return;
        const modeState = appState.isMultiplayerMode ? appState.multiplayer : appState.local;
        const endTime = modeState.timerEndTime;
        const timerShouldBeActive = appState.isMultiplayerMode ?
            (modeState.draftState?.settings?.timerEnabled && modeState.draftState?.status === 'in_progress') :
            (appState.local.timerEnabled && appState.local.draftActive);

        if (endTime === null || !timerShouldBeActive) {
            UIUpdater.setText(timerDisplay, '');
            UIUpdater.toggleClass(timerDisplay, 'elapsed', false);
            UIUpdater.hide(timerDisplay);
            return;
        }
        UIUpdater.show(timerDisplay, 'block');
        const now = Date.now();
        const remainingSeconds = Math.round((endTime - now) / 1000);
        if (remainingSeconds >= 0) {
            UIUpdater.setText(timerDisplay, `${remainingSeconds}`);
            UIUpdater.toggleClass(timerDisplay, 'elapsed', false);
        } else {
            UIUpdater.setText(timerDisplay, `${remainingSeconds}`);
            UIUpdater.toggleClass(timerDisplay, 'elapsed', true);
        }
    },

    updateTeamPicksDisplay(teamAPicks = [], teamBPicks = []) {
        const characterMap = new Map(CHARACTERS.map(c => [c.name, c]));
        const createPickHtml = (charName) => {
            const char = characterMap.get(charName);
            const iconSrc = char?.icon || '';
            const altText = char?.name || 'Unknown';
            return `<div class="character picked"><img src="${iconSrc}" alt="${altText}" loading="lazy"><span>${altText}</span></div>`;
        };
        UIUpdater.setHtml(DOMElements.teamAPicks, teamAPicks.map(createPickHtml).join(''));
        UIUpdater.setHtml(DOMElements.teamBPicks, teamBPicks.map(createPickHtml).join(''));
    },

    updateCharacterPoolVisuals() {
        const pool = DOMElements.characterPool;
        if (!pool) return;
        let bans, picksA, picksB, exclusivity, currentTeam, currentPhase, draftStatus, myTurn, isSpectator;
        if (appState.isMultiplayerMode) {
            const data = appState.multiplayer.draftState;
            bans = data.bannedCharacters || []; picksA = data.teamAPicks || []; picksB = data.teamBPicks || [];
            exclusivity = data.settings?.hunterExclusivity ?? true; currentTeam = data.currentTeam; currentPhase = data.currentPhase;
            draftStatus = data.status || 'setup';
            const iAmCaptainA = appState.multiplayer.playerRole === 'captainA'; const iAmCaptainB = appState.multiplayer.playerRole === 'captainB';
            isSpectator = appState.multiplayer.playerRole === 'spectator';
            myTurn = !isSpectator && draftStatus === 'in_progress' && ((currentTeam === 'A' && iAmCaptainA) || (currentTeam === 'B' && iAmCaptainB));
        } else {
            const local = appState.local;
            bans = local.bannedCharacters; picksA = local.teamAPicks; picksB = local.teamBPicks; exclusivity = local.hunterExclusivity;
            currentTeam = local.currentTeam; currentPhase = local.currentPhase; draftStatus = local.draftActive ? 'in_progress' : 'setup';
            myTurn = true; isSpectator = false;
        }
        pool.childNodes.forEach(node => {
            if (node.nodeType !== Node.ELEMENT_NODE || !node.classList.contains('character')) return;
            const charDiv = node; const charName = charDiv.dataset.charName; if (!charName) return;
            charDiv.classList.remove('banned', 'selected', 'team-a-picked', 'team-b-picked', 'both-picked', 'selectable', 'not-selectable', 'team-a-turn', 'team-b-turn');
            charDiv.style.cursor = 'default';
            const isBanned = bans.includes(charName); const isPickedA = picksA.includes(charName); const isPickedB = picksB.includes(charName);
            let isSelectable = false; let isValidChoice = false; let mightBeSelectable = false;
            if (isBanned) charDiv.classList.add('banned');
            if (isPickedA) { if (exclusivity) charDiv.classList.add('selected'); charDiv.classList.add('team-a-picked');}
            if (isPickedB) { if (exclusivity) charDiv.classList.add('selected'); charDiv.classList.add('team-b-picked');}
            if (isPickedA && isPickedB) {if (!exclusivity) charDiv.classList.add('selected'); charDiv.classList.add('both-picked'); }
            if (draftStatus === 'in_progress') {
                isValidChoice = DraftLogic.isCharValidSelection(charName, currentPhase, currentTeam, picksA, picksB, bans, exclusivity);
                isSelectable = myTurn && isValidChoice;
                mightBeSelectable = !myTurn && isValidChoice;
                if (currentTeam) charDiv.classList.add(currentTeam === 'A' ? 'team-a-turn' : 'team-b-turn');
            }
            charDiv.classList.toggle('selectable', isSelectable);
            charDiv.classList.toggle('not-selectable', draftStatus === 'in_progress' && !isSelectable);
            if (isSelectable) charDiv.style.cursor = 'pointer';
            if (mightBeSelectable) charDiv.style.cursor = 'wait';
            else if (isBanned || (exclusivity && (isPickedA || isPickedB)) || draftStatus === 'complete' || isSpectator) charDiv.style.cursor = 'not-allowed';
        });
    },
    
    updateStatusMessageText() {
        const messageEl = DOMElements.statusMessage; if (!messageEl) return;
        if (appState.isMultiplayerMode) {
            const data = appState.multiplayer.draftState; const playerRole = appState.multiplayer.playerRole; const isSpectator = playerRole === 'spectator';
            if (!appState.multiplayer.currentDraftId) { messageEl.textContent = fbAuthError ? "Connection Error" : (appState.currentUserId ? "Select or Create Room" : "Connecting..."); return; }
            if (!data || !data.status) { if (appState.multiplayer.currentDraftId && Object.keys(data).length === 0 && !appState.mpDraftSubscription) { messageEl.textContent = `Room ${appState.multiplayer.currentDraftId} closed or not found.`; } else { messageEl.textContent = "Loading room data..."; } return; }
            switch (data.status) {
                case 'waiting':
                    const players = data.players || {}; let playerA = null, playerB = null;
                    for (const uid in players) { if (players[uid].role === 'captain') { if (players[uid].team === 'A') playerA = players[uid]; if (players[uid].team === 'B') playerB = players[uid];}}
                    let statusText = isSpectator ? 'Spectating - Waiting...' : 'Waiting...';
                    const capAConnected = playerA?.isConnected; const capBConnected = playerB?.isConnected; const capAReady = playerA?.isReady; const capBReady = playerB?.isReady;
                    if (playerA && playerB) {
                        if (capAReady && capBReady) statusText = (capAConnected && capBConnected) ? (isSpectator ? "Spectating - Both ready!" : "Both ready! Captain A can start.") : (isSpectator ? "Spectating - Both ready! Waiting for connection..." : "Both ready! Waiting for connection...");
                        else if (capAReady) statusText = isSpectator ? `Spectating - Captain A ready. Waiting for B...` : `Captain A ready. Captain B ${capBConnected ? 'not ready' : 'not connected'}...`;
                        else if (capBReady) statusText = isSpectator ? `Spectating - Captain B ready. Waiting for A...` : `Captain B ready. Captain A ${capAConnected ? 'not ready' : 'not connected'}...`;
                        else statusText = isSpectator ? `Spectating - Waiting for captains...` : `Waiting for captains ${capAConnected && capBConnected ? 'to ready up' : 'to connect'}...`;
                        if (data.teamASwapIntent && data.teamBSwapIntent) statusText += " Swap requested by both!";
                        else if (data.teamASwapIntent) statusText += ` S${data.teamAName || 'Team A'} requests swap.`;
                        else if (data.teamBSwapIntent) statusText += ` ${data.teamBName || 'Team B'} requests swap.`;
                    } else if (playerA) statusText = isSpectator ? "Spectating - Waiting for Captain B..." : "Waiting for Captain B to join...";
                    else if (playerB) statusText = isSpectator ? "Spectating - Waiting for Captain A..." : "Waiting for Captain A to join...";
                    else statusText = isSpectator ? "Spectating - Waiting for Captain A..." : "Waiting for Captain A...";
                    messageEl.textContent = statusText; break;
                case 'in_progress':
                    if (!data.currentTeam || !data.currentPhase) { messageEl.textContent = isSpectator ? 'Spectating - Draft Starting...' : 'Draft Starting...'; return; }
                    const teamName = data.currentTeam === 'A' ? (data.teamAName || 'Team A') : (data.teamBName || 'Team B');
                    const phaseText = data.currentPhase === 'ban' ? 'BAN' : 'PICK';
                    const iAmCaptainA = playerRole === 'captainA'; const iAmCaptainB = playerRole === 'captainB';
                    const turnPlayer = (data.currentTeam === 'A' && iAmCaptainA) || (data.currentTeam === 'B' && iAmCaptainB);
                    messageEl.textContent = `${isSpectator ? 'Spectating: ' : ''}${teamName} - ${phaseText}${turnPlayer ? ' (YOUR TURN)' : ''}`; break;
                case 'complete':
                    const draftNum = data.currentGameNumber || 1;
                    let completeStatus = `${isSpectator ? 'Spectating - ' : ''}Complete! Waiting next...`;
                    if (data.teamASwapIntent && data.teamBSwapIntent) completeStatus += " Swap requested by both!";
                    else if (data.teamASwapIntent) completeStatus += ` ${data.teamAName || 'Team A'} requests swap.`;
                    else if (data.teamBSwapIntent) completeStatus += ` ${data.teamBName || 'Team B'} requests swap.`;
                    messageEl.textContent = completeStatus; break;
                default: messageEl.textContent = `${isSpectator ? 'Spectating - ' : ''}Status: ${data.status || 'Unknown'}`; break;
            }
        } else { 
            if (!appState.local.draftActive) {
                const storedDraftId = sessionStorage.getItem('currentDraftId');
                if (!appState.currentUserId) messageEl.textContent = "Connecting...";
                else if (!storedDraftId) messageEl.textContent = 'Configure and start local or online draft';
                else messageEl.textContent = `Previous session detected`;
            } else {
                const teamId = appState.local.currentTeam.toLowerCase(); const teamHeading = DOMElements[`team${teamId}Heading`];
                const teamName = teamHeading?.firstChild?.textContent?.replace(/[🔄✎]/, '').trim() || `Team ${appState.local.currentTeam}`;
                const phaseText = appState.local.currentPhase === 'ban' ? 'BAN' : 'PICK';
                messageEl.textContent = `${teamName} - ${phaseText}`;
            }
        }
    },

    updateTeamNamesAndActionsUI() {
        const { teamAHeading, teamBHeading } = DOMElements; if (!teamAHeading || !teamBHeading) return;
        const setupButton = (button, isMyTeam, isMyCaptainRole, canPerformAction, isEditButton, otherTeamSwapIntent, myTeamSwapIntent) => {
            if (!button) return;
            button.className = ''; button.innerHTML = ''; button.onclick = null;
            UIUpdater.hide(button); UIUpdater.disable(button); button.style.cursor = 'default'; UIUpdater.toggleClass(button, 'swap-pending', false);
            if (canPerformAction && isMyCaptainRole) {
                UIUpdater.show(button); UIUpdater.enable(button, true); button.style.cursor = 'pointer';
                if (isEditButton && isMyTeam) {
                    button.innerHTML = '✎'; button.className = 'edit-team-name'; button.onclick = FirebaseOps.handleMultiplayerEditTeamName;
                } else if (!isEditButton && !isMyTeam) { // This is a swap button for the other team
                    button.innerHTML = '🔄'; button.className = 'swap-intent-button'; button.onclick = handleSwapIntentClick;
                    UIUpdater.toggleClass(button, 'swap-pending', !!myTeamSwapIntent);
                } else { UIUpdater.hide(button); }
            }
        };
        if (appState.isMultiplayerMode && appState.multiplayer.draftState?.players) {
            const data = appState.multiplayer.draftState; const teamAName = data.teamAName || 'Team A'; const teamBName = data.teamBName || 'Team B';
            const draftStatus = data.status || 'setup'; const canAction = (draftStatus === 'waiting' || draftStatus === 'complete');
            UIUpdater.updatePlayerStatusInTeamHeaders(data.players, draftStatus);
            const myPlayerData = data.players[appState.currentUserId]; const myTeam = myPlayerData?.team; const isMyCaptainRole = myPlayerData?.role === 'captain';
            
            const buttonA = teamAHeading.querySelector('button'); 
            if(teamAHeading.firstChild) teamAHeading.firstChild.textContent = teamAName + ' ';
            if (isMyCaptainRole && myTeam === 'A') setupButton(buttonA, true, true, canAction, true, data.teamBSwapIntent, data.teamASwapIntent); // Edit own
            else if (isMyCaptainRole && myTeam === 'B') setupButton(buttonA, false, true, canAction, false, data.teamASwapIntent, data.teamBSwapIntent); // Swap other
            else UIUpdater.hide(buttonA);

            const buttonB = teamBHeading.querySelector('button');
            if(teamBHeading.firstChild) teamBHeading.firstChild.textContent = teamBName + ' ';
            if (isMyCaptainRole && myTeam === 'B') setupButton(buttonB, true, true, canAction, true, data.teamASwapIntent, data.teamBSwapIntent); // Edit own
            else if (isMyCaptainRole && myTeam === 'A') setupButton(buttonB, false, true, canAction, false, data.teamBSwapIntent, data.teamASwapIntent); // Swap other
            else UIUpdater.hide(buttonB);

        } else { 
            const teamAHeadingSpan = teamAHeading.firstChild; const teamBHeadingSpan = teamBHeading.firstChild;
            const currentTeamAName = teamAHeadingSpan?.textContent?.replace(/[🔄✎]/, '').trim() || 'Team A';
            const currentTeamBName = teamBHeadingSpan?.textContent?.replace(/[🔄✎]/, '').trim() || 'Team B';
            if (teamAHeadingSpan) teamAHeadingSpan.textContent = currentTeamAName + ' '; if (teamBHeadingSpan) teamBHeadingSpan.textContent = currentTeamBName + ' ';
            UIUpdater.setText(DOMElements.teamACaptain, ''); UIUpdater.setText(DOMElements.teamBCaptain, '');
            const canEdit = !appState.local.draftActive;
            [teamAHeading.querySelector('button'), teamBHeading.querySelector('button')].forEach(btn => {
                if (btn) {
                    UIUpdater.show(btn); btn.innerHTML = '✎'; btn.className = 'edit-team-name'; btn.onclick = handleLocalEditTeamName;
                    UIUpdater.enable(btn, canEdit); btn.style.cursor = canEdit ? 'pointer' : 'not-allowed';
                    btn.style.opacity = canEdit ? 0.6 : 0.2; UIUpdater.toggleClass(btn, 'swap-pending', false);
                }
            });
        }
    },
    
    updatePlayerStatusInTeamHeaders(players = {}, draftStatus) {
        let captainA = null, captainB = null; const spectators = [];
        for (const uid in players) { const player = players[uid]; if (player.role === 'captain') { if (player.team === 'A') captainA = player; if (player.team === 'B') captainB = player; } else if (player.role === 'spectator' && player.isConnected) { spectators.push(player.displayName || `Spectator_${uid.substring(0,4)}`); }}
        const showReady = draftStatus === 'waiting' || draftStatus === 'complete';
        const readyIndicator = (player) => (player && showReady) ? (player.isReady ? '✔️' : '⏳') : '';
        const connectionIndicator = (player) => player ? (player.isConnected ? '🟢' : '🔴') : '';
        UIUpdater.setText(DOMElements.teamACaptain, captainA ? `${captainA.displayName || 'Captain A'} ${connectionIndicator(captainA)}${readyIndicator(captainA)}` : '(...)');
        UIUpdater.setText(DOMElements.teamBCaptain, captainB ? `${captainB.displayName || 'Captain B'} ${connectionIndicator(captainB)}${readyIndicator(captainB)}` : '(...)');
        if (spectators.length > 0) { UIUpdater.setText(DOMElements.spectatorListDisplay, spectators.join(', ')); UIUpdater.show(DOMElements.spectatorListDisplay, 'block'); UIUpdater.show(DOMElements.spectatorListContainer, 'flex'); }
        else { UIUpdater.setText(DOMElements.spectatorListDisplay, ''); UIUpdater.hide(DOMElements.spectatorListContainer); }
    },

    updateConfigInputsState(disabled, firebaseSettings = null) { 
        const { hunterExclusivityCheckbox, banCountSelect, timerEnabledCheckbox, timerDurationInput, draftOrderTypeSelect } = DOMElements;
        const elementsToUpdate = [hunterExclusivityCheckbox, banCountSelect, timerEnabledCheckbox, timerDurationInput, draftOrderTypeSelect];

        if (firebaseSettings) { 
            if (hunterExclusivityCheckbox) hunterExclusivityCheckbox.checked = firebaseSettings.hunterExclusivity ?? true;
            if (banCountSelect) banCountSelect.value = firebaseSettings.maxTotalBans?.toString() ?? "2"; 
            if (timerEnabledCheckbox) timerEnabledCheckbox.checked = firebaseSettings.timerEnabled ?? false;
            if (timerDurationInput) timerDurationInput.value = firebaseSettings.timerDuration ?? DEFAULT_TIMER_DURATION_SECONDS;
            if (draftOrderTypeSelect) draftOrderTypeSelect.value = firebaseSettings.draftOrderType || 'Snake';
        }
        elementsToUpdate.forEach(el => { if (el) el.disabled = disabled; });
    },
    
    resetUIForLocalMode() {
        UIUpdater.hide(DOMElements.leaveRoomButton); UIUpdater.hide(DOMElements.readyButton); UIUpdater.hide(DOMElements.joinRoomInputContainer);
        UIUpdater.setText(DOMElements.teamACaptain, ''); UIUpdater.setText(DOMElements.teamBCaptain, '');
        UIUpdater.hide(DOMElements.spectatorListContainer); UIUpdater.hide(DOMElements.reconnectButton); UIUpdater.hide(DOMElements.cancelSessionButton);
        UIUpdater.hide(DOMElements.gameCounterDisplay);
        UIUpdater.updateStatusMessageText(); UIUpdater.updateTeamPicksDisplay([], []); UIUpdater.setHtml(DOMElements.matchHistoryDisplay, '');
        UIUpdater.hide(DOMElements.skipBanButton); UIUpdater.hide(DOMElements.configPanel); UIUpdater.show(DOMElements.startDraftButton);
        UIUpdater.hide(DOMElements.timerDisplay); UIUpdater.show(DOMElements.configButton); UIUpdater.enable(DOMElements.configButton, true);
        UIUpdater.updateCharacterPoolVisuals(); UIUpdater.updateTeamNamesAndActionsUI();
    },

    resetUIForMultiplayerMode() {
        UIUpdater.updateCharacterPoolVisuals(); UIUpdater.updateTeamPicksDisplay([], []); UIUpdater.setText(DOMElements.statusMessage, 'Joining room...');
        UIUpdater.setHtml(DOMElements.matchHistoryDisplay, ''); UIUpdater.setText(DOMElements.teamACaptain, '(...)'); UIUpdater.setText(DOMElements.teamBCaptain, '(...)');
        UIUpdater.show(DOMElements.spectatorListContainer, 'flex'); UIUpdater.hide(DOMElements.timerDisplay); UIUpdater.hide(DOMElements.configPanel);
        UIUpdater.hide(DOMElements.skipBanButton); UIUpdater.show(DOMElements.configButton); UIUpdater.show(DOMElements.readyButton);
        UIUpdater.hide(DOMElements.reconnectButton); UIUpdater.hide(DOMElements.cancelSessionButton); UIUpdater.hide(DOMElements.startDraftButton);
        UIUpdater.show(DOMElements.gameCounterDisplay);
        UIUpdater.updateTeamNamesAndActionsUI();
    },

    updateMultiplayerButtonVisibility() {
        const { createRoomButton, joinRoomButton, leaveRoomButton, readyButton, joinRoomInputContainer, reconnectButton, cancelSessionButton, configButton, startDraftButton } = DOMElements;
        [createRoomButton, joinRoomButton, leaveRoomButton, readyButton, joinRoomInputContainer, reconnectButton, cancelSessionButton, startDraftButton].forEach(UIUpdater.hide);
        [createRoomButton, joinRoomButton, reconnectButton, cancelSessionButton, configButton, startDraftButton, readyButton, leaveRoomButton].forEach(btn => UIUpdater.disable(btn, true));
        if (appState.isMultiplayerMode) {
            UIUpdater.show(leaveRoomButton); UIUpdater.enable(leaveRoomButton, true);
            UIUpdater.show(configButton); UIUpdater.show(readyButton); UIUpdater.show(startDraftButton); // Actual enabled state by renderMultiplayerMainUI
        } else { 
            UIUpdater.show(configButton); UIUpdater.enable(configButton, !appState.local.draftActive);
            UIUpdater.show(startDraftButton); UIUpdater.enable(startDraftButton, !appState.local.draftActive);
            if (fbAuthError) {
                UIUpdater.show(createRoomButton); UIUpdater.setText(createRoomButton, "Create (Error)"); UIUpdater.disable(createRoomButton, true);
                UIUpdater.show(joinRoomButton); UIUpdater.setText(joinRoomButton, "Join (Error)"); UIUpdater.disable(joinRoomButton, true);
            } else if (!fbAuth || !appState.currentUserId) { 
                UIUpdater.show(createRoomButton); UIUpdater.disable(createRoomButton, true); UIUpdater.show(joinRoomButton); UIUpdater.disable(joinRoomButton, true);
            } else { 
                const storedDraftId = sessionStorage.getItem('currentDraftId');
                if (storedDraftId) { UIUpdater.show(reconnectButton); UIUpdater.enable(reconnectButton, true); UIUpdater.show(cancelSessionButton); UIUpdater.enable(cancelSessionButton, true); }
                else { UIUpdater.show(createRoomButton); UIUpdater.enable(createRoomButton, true); UIUpdater.setText(createRoomButton, "Create Room"); UIUpdater.show(joinRoomButton); UIUpdater.enable(joinRoomButton, true); UIUpdater.setText(joinRoomButton, "Join Room"); }
            }
        }
        UIUpdater.updateStatusMessageText();
    },

    renderMultiplayerMainUI(data) { 
        if (!appState.isMultiplayerMode || !data || Object.keys(data).length === 0) {
            UIUpdater.hide(DOMElements.startDraftButton); UIUpdater.hide(DOMElements.skipBanButton); UIUpdater.hide(DOMElements.readyButton);
            return;
        }
        UIUpdater.updateTeamNamesAndActionsUI(); 
        UIUpdater.updateStatusMessageText();
        UIUpdater.updateTeamPicksDisplay(data.teamAPicks, data.teamBPicks);
        UIUpdater.updateCharacterPoolVisuals();
        UIUpdater.setText(DOMElements.gameCounterDisplay, `Game #${data.currentGameNumber || 1}`);
        UIUpdater.show(DOMElements.gameCounterDisplay);

        if (data.matchHistory) {
             DOMElements.matchHistoryDisplay.innerHTML = ''; 
             const gameNumbers = Object.keys(data.matchHistory).map(Number).sort((a, b) => a - b);
             gameNumbers.forEach(gameNum => {
                 const historyArray = data.matchHistory[gameNum] ? Object.values(data.matchHistory[gameNum]) : [];
                 HistoryRender.renderMultiplayerHistory(historyArray, gameNum);
             });
        } else {
             DOMElements.matchHistoryDisplay.innerHTML = ''; // Clear if no history yet
        }


        const { startDraftButton, skipBanButton, readyButton, configButton, configPanel } = DOMElements;
        const draftStatus = data.status || 'setup';
        const playerRole = appState.multiplayer.playerRole;
        const iAmCaptainA = playerRole === 'captainA'; const iAmCaptainB = playerRole === 'captainB';
        const isSpectator = playerRole === 'spectator'; const isMyCaptainRole = iAmCaptainA || iAmCaptainB;
        let playerA = null, playerB = null;
        let myPlayerData = data.players?.[appState.currentUserId];
        let iAmReady = isMyCaptainRole && myPlayerData?.isReady === true;
        if (data.players) { for (const uid in data.players) { const p = data.players[uid]; if (p.role === 'captain') { if (p.team === 'A') playerA = p; if (p.team === 'B') playerB = p; }}}
        const bothConnected = playerA?.isConnected && playerB?.isConnected;
        const bothReady = playerA?.isReady && playerB?.isReady;
        const isDraftActive = draftStatus === 'in_progress';

        const canConfigure = !isDraftActive && iAmCaptainA && (draftStatus === 'waiting' || draftStatus === 'complete');
        canConfigure ? UIUpdater.show(configButton) : UIUpdater.hide(configButton);
        UIUpdater.enable(configButton, canConfigure);
        if (!canConfigure && !configPanel.classList.contains('hidden')) { // If config panel is open but conditions no longer met
            UIUpdater.hide(configPanel);
        }
        // Disable inputs if panel is hidden OR if cannot configure. Sync if panel is open & can configure.
        const disableConfigInputs = configPanel.classList.contains('hidden') || !canConfigure;
        UIUpdater.updateConfigInputsState(disableConfigInputs, data.settings);


        const showReadyButton = !isDraftActive && isMyCaptainRole && (draftStatus === 'waiting' || draftStatus === 'complete');
        showReadyButton ? UIUpdater.show(readyButton) : UIUpdater.hide(readyButton);
        if (showReadyButton) { UIUpdater.enable(readyButton, true); UIUpdater.setText(readyButton, iAmReady ? "Unready" : "Ready Up");}

        const showStartButton = (draftStatus === 'waiting' || draftStatus === 'complete') && iAmCaptainA;
        showStartButton ? UIUpdater.show(startDraftButton) : UIUpdater.hide(startDraftButton);
        if (showStartButton) { UIUpdater.enable(startDraftButton, bothConnected && bothReady); UIUpdater.setText(startDraftButton, "Start Draft");}
        
        const myTurnForAction = isDraftActive && ((data.currentTeam === 'A' && iAmCaptainA) || (data.currentTeam === 'B' && iAmCaptainB));
        const showSkip = isDraftActive && data.currentPhase === 'ban' && myTurnForAction && !isSpectator;
        showSkip ? UIUpdater.show(skipBanButton) : UIUpdater.hide(skipBanButton);
        UIUpdater.enable(skipBanButton, showSkip);
    }
};

const Timer = { 
    start(durationSeconds) { Timer.stop(); const modeState = appState.isMultiplayerMode ? appState.multiplayer : appState.local; modeState.timerEndTime = Date.now() + durationSeconds * 1000; modeState.timerIntervalId = setInterval(UIUpdater.updateTimerDisplay, 1000); UIUpdater.updateTimerDisplay(); },
    stop() { const local = appState.local; const mp = appState.multiplayer; if (local.timerIntervalId) { clearInterval(local.timerIntervalId); local.timerIntervalId = null; local.timerEndTime = null; } if (mp.timerIntervalId) { clearInterval(mp.timerIntervalId); mp.timerIntervalId = null; mp.timerEndTime = null; } UIUpdater.updateTimerDisplay(); },
    startMultiplayerTimerFromFirebaseState(stateData) { Timer.stop(); const timerEnabled = stateData?.settings?.timerEnabled ?? false; const timerDuration = stateData?.settings?.timerDuration ?? DEFAULT_TIMER_DURATION_SECONDS; const actionStartTime = stateData?.currentActionStartTime; if (timerEnabled && actionStartTime && stateData.status === 'in_progress') { const expectedEndTime = actionStartTime + (timerDuration * 1000); const now = Date.now(); const remainingMilliseconds = expectedEndTime - now; if (remainingMilliseconds > -60000) { appState.multiplayer.timerEndTime = expectedEndTime; appState.multiplayer.timerIntervalId = setInterval(UIUpdater.updateTimerDisplay, 1000); UIUpdater.updateTimerDisplay(); } else { appState.multiplayer.timerEndTime = expectedEndTime; UIUpdater.updateTimerDisplay(); } } else { UIUpdater.updateTimerDisplay(); } }
};

const DraftLogic = { 
    isCharValidSelection(charName, phase, currentTeam, teamAPicks = [], teamBPicks = [], bannedChars = [], hunterExclusivity) { if (bannedChars.some(b => b === charName)) return false; if (phase === 'ban') { return !teamAPicks.includes(charName) && !teamBPicks.includes(charName); } else if (phase === 'pick') { if (hunterExclusivity) { if ((currentTeam === 'A' && teamBPicks.includes(charName)) || (currentTeam === 'B' && teamAPicks.includes(charName))) { return false; } } const myPicks = currentTeam === 'A' ? teamAPicks : teamBPicks; return !myPicks.includes(charName); } return false; },
    determineNextTurn(currentPhase, currentTeam, bansMade, totalExpectedBans, picksMade, draftOrderType) { let nextTeam = currentTeam; let nextPhase = currentPhase; if (currentPhase === 'ban') { if (bansMade >= totalExpectedBans) { nextPhase = 'pick'; nextTeam = 'A'; } else { nextTeam = currentTeam === 'A' ? 'B' : 'A'; } } else if (currentPhase === 'pick') { if (picksMade >= TOTAL_PICKS_NEEDED) { return { phase: null, team: null, draftOver: true }; } if (draftOrderType === 'Alt') { if (picksMade === 1) nextTeam = 'B'; else if (picksMade === 2) nextTeam = 'B'; else if (picksMade === 3) nextTeam = 'A'; else if (picksMade === 4) nextTeam = 'B'; else if (picksMade === 5) nextTeam = 'A'; else if (picksMade === 6) nextTeam = 'A'; else if (picksMade === 7) nextTeam = 'B'; } else { const pickIndexJustMade = picksMade - 1; if (pickIndexJustMade === 0 || pickIndexJustMade === 1 || pickIndexJustMade === 4 || pickIndexJustMade === 5) { nextTeam = 'B'; } else { nextTeam = 'A'; } } } return { phase: nextPhase, team: nextTeam, draftOver: false }; }
};

const HistoryRender = {
    ensureGameHistoryContainer(gameNumber, isMultiplayer) {
        const historyDisplay = DOMElements.matchHistoryDisplay;
        if (!historyDisplay) return null;
        const draftDivId = `${isMultiplayer ? 'mp-' : ''}draft${gameNumber}`;
        let draftDiv = document.getElementById(draftDivId);
        if (!draftDiv) {
            draftDiv = document.createElement('div');
            draftDiv.id = draftDivId;
            draftDiv.className = 'match-entry';
            // Only clear for local mode, MP appends or replaces in renderMultiplayerMainUI
            if (!isMultiplayer) historyDisplay.innerHTML = ''; 
            historyDisplay.appendChild(draftDiv);
        }
        draftDiv.textContent = `Draft ${gameNumber}: `; // Set/reset the label
        return draftDiv;
    },

    recordAndDisplayLocalAction(team, phase, character, picksBeforeActionA = [], picksBeforeActionB = []) {
        const local = appState.local; if (!local.draftActive) return;
        let entryText = '';
        if (phase === 'ban') entryText = `${team}0 ${character || 'Null'}. `;
        else if (phase === 'pick') { const pickNumber = (team === 'A' ? picksBeforeActionA.length : picksBeforeActionB.length) + 1; entryText = `${team}${pickNumber} ${character}. `; }
        else return;
        local.matchHistory.push(entryText); 
        const draftDiv = HistoryRender.ensureGameHistoryContainer(local.gameCounter, false);
        if (draftDiv) { const actionSpan = document.createElement('span'); actionSpan.textContent = entryText; draftDiv.appendChild(actionSpan); }
    },

    renderMultiplayerHistory(historyList = [], gameNumber) { // Expect historyList to be an array of strings
        const draftDiv = HistoryRender.ensureGameHistoryContainer(gameNumber, true);
        if (!draftDiv) return;
        
        // History list is already ordered by push time in Firebase (when using push)
        // If using object keys, they need sorting first. Assuming array/list from push.
        let fullHistoryText = `Draft ${gameNumber}: ${historyList.join('')}`; // Join the array of strings
        draftDiv.textContent = fullHistoryText; 
    }
};

function resetLocalDraftState() {
    const local = appState.local; local.currentPhase = 'setup'; local.currentTeam = 'A';
    local.teamAPicks = []; local.teamBPicks = []; local.bannedCharacters = []; local.matchHistory = [];
    local.draftActive = false; Timer.stop();
}

function resetMultiplayerSessionState() {
    const mp = appState.multiplayer; mp.currentDraftId = null;
    if (appState.mpDraftSubscription) { try { appState.mpDraftSubscription(); } catch (e) { console.warn("Error unsubscribing from Firebase draft:", e); }}
    appState.mpDraftSubscription = null; mp.playerRole = null; mp.draftState = {}; Timer.stop();
    sessionStorage.removeItem('currentDraftId'); sessionStorage.removeItem('playerRole');
}

function updateApplicationMode(newIsMultiplayerMode) {
    const previousIsMultiplayerMode = appState.isMultiplayerMode; appState.isMultiplayerMode = newIsMultiplayerMode; Timer.stop();
    if (previousIsMultiplayerMode && !newIsMultiplayerMode) { resetMultiplayerSessionState(); resetLocalDraftState(); UIUpdater.resetUIForLocalMode(); UIUpdater.updateConfigInputsState(false); }
    else if (!previousIsMultiplayerMode && newIsMultiplayerMode) { resetLocalDraftState(); UIUpdater.resetUIForMultiplayerMode(); }
    else { if (!newIsMultiplayerMode) { UIUpdater.resetUIForLocalMode(); UIUpdater.updateConfigInputsState(appState.local.draftActive); } else { UIUpdater.resetUIForMultiplayerMode(); }}
    UIUpdater.updateMultiplayerButtonVisibility(); UIUpdater.updateCharacterPoolVisuals();
    UIUpdater.setHtml(DOMElements.matchHistoryDisplay, ''); UIUpdater.show(DOMElements.matchHistoryContainer);
    UIUpdater.hide(DOMElements.gameCounterDisplay);
}

function handleLocalStartDraft() {
    if (appState.local.draftActive || appState.isMultiplayerMode) return;
    const local = appState.local;
    local.hunterExclusivity = DOMElements.hunterExclusivityCheckbox.checked;
    local.maxBansPerTeam = parseInt(DOMElements.banCountSelect.value) / 2;
    local.timerEnabled = DOMElements.timerEnabledCheckbox.checked;
    local.timerDuration = parseInt(DOMElements.timerDurationInput.value) || DEFAULT_TIMER_DURATION_SECONDS;
    if (local.timerDuration <= 0) local.timerDuration = DEFAULT_TIMER_DURATION_SECONDS;
    local.draftOrderType = DOMElements.draftOrderTypeSelect.value;

    resetLocalDraftState(); 
    local.draftActive = true;
    local.currentPhase = local.maxBansPerTeam > 0 ? 'ban' : 'pick';
    local.currentTeam = 'A';
    local.gameCounter++; 

    UIUpdater.updateConfigInputsState(true); 
    UIUpdater.disable(DOMElements.configButton, true);
    UIUpdater.hide(DOMElements.configButton);
    UIUpdater.hide(DOMElements.configPanel);
    UIUpdater.disable(DOMElements.startDraftButton, true);
    UIUpdater.hide(DOMElements.startDraftButton);
    
    HistoryRender.ensureGameHistoryContainer(local.gameCounter, false); 
    UIUpdater.setText(DOMElements.gameCounterDisplay, `Game #${local.gameCounter}`);
    UIUpdater.show(DOMElements.gameCounterDisplay);

    UIUpdater.updateStatusMessageText(); UIUpdater.updateCharacterPoolVisuals();
    UIUpdater.updateTeamPicksDisplay([], []); UIUpdater.updateTeamNamesAndActionsUI(); 
    UIUpdater.setProperty(DOMElements.skipBanButton, 'display', (local.currentPhase === 'ban') ? 'inline-block' : 'none');
    if (local.timerEnabled) Timer.start(local.timerDuration);
}

function handleLocalSelect(charName) {
    const local = appState.local;
    if (!local.draftActive || appState.isMultiplayerMode || 
        !DraftLogic.isCharValidSelection(charName, local.currentPhase, local.currentTeam, local.teamAPicks, local.teamBPicks, local.bannedCharacters, local.hunterExclusivity)) {
        return;
    }
    const prevTeam = local.currentTeam; const prevPhase = local.currentPhase;
    const prevPicksA = [...local.teamAPicks]; const prevPicksB = [...local.teamBPicks];

    if (local.currentPhase === 'ban') local.bannedCharacters.push(charName);
    else if (local.currentPhase === 'pick') { if (local.currentTeam === 'A') local.teamAPicks.push(charName); else local.teamBPicks.push(charName); }
    
    HistoryRender.recordAndDisplayLocalAction(prevTeam, prevPhase, charName, prevPicksA, prevPicksB);
    UIUpdater.updateCharacterPoolVisuals();
    if (local.currentPhase === 'pick') UIUpdater.updateTeamPicksDisplay(local.teamAPicks, local.teamBPicks);
    advanceLocalPhase();
}

function handleLocalSkipBan() {
    const local = appState.local;
    if (!local.draftActive || local.currentPhase !== 'ban' || appState.isMultiplayerMode) return;
    const prevTeam = local.currentTeam; const prevPhase = local.currentPhase;
    const prevPicksA = [...local.teamAPicks]; const prevPicksB = [...local.teamBPicks];
    const placeholder = `_skipped_ban_${local.currentTeam}_${local.bannedCharacters.length + 1}`;
    local.bannedCharacters.push(placeholder);
    HistoryRender.recordAndDisplayLocalAction(prevTeam, prevPhase, null, prevPicksA, prevPicksB);
    advanceLocalPhase();
}

function advanceLocalPhase() {
    const local = appState.local; if (!local.draftActive) return;
    const totalBansMade = local.bannedCharacters.length; const totalExpectedBans = local.maxBansPerTeam * 2;
    const totalPicksMade = local.teamAPicks.length + local.teamBPicks.length;
    const { phase, team, draftOver } = DraftLogic.determineNextTurn(local.currentPhase, local.currentTeam, totalBansMade, totalExpectedBans, totalPicksMade, local.draftOrderType);
    if (draftOver) { endLocalDraft(); return; }
    local.currentPhase = phase; local.currentTeam = team;
    UIUpdater.updateStatusMessageText(); UIUpdater.updateCharacterPoolVisuals();
    UIUpdater.setProperty(DOMElements.skipBanButton, 'display', (local.draftActive && local.currentPhase === 'ban') ? 'inline-block' : 'none');
    if (local.timerEnabled) Timer.start(local.timerDuration);
}

function endLocalDraft() {
    appState.local.draftActive = false; Timer.stop(); UIUpdater.setText(DOMElements.statusMessage, 'Local Draft Complete!');
    UIUpdater.hide(DOMElements.skipBanButton); UIUpdater.updateConfigInputsState(false); UIUpdater.enable(DOMElements.startDraftButton, true);
    UIUpdater.enable(DOMElements.configButton);UIUpdater.show(DOMElements.configButton); UIUpdater.show(DOMElements.startDraftButton);
    UIUpdater.updateCharacterPoolVisuals(); UIUpdater.updateTeamNamesAndActionsUI();
}

function handleLocalEditTeamName(event) { 
    if (appState.isMultiplayerMode || appState.local.draftActive) { UIUpdater.notifyUser("Cannot change names now.", 1500); return; }
    const button = event.target; const headingDiv = button.closest('div.team-heading'); if (!headingDiv) return;
    const teamId = headingDiv.id.includes('team-a') ? 'A' : 'B'; const nameSpan = headingDiv.firstChild;
    const currentName = nameSpan?.textContent?.replace('✎', '').trim() || (teamId === 'A' ? 'Team A' : 'Team B');
    const newName = prompt(`Enter new name for Team ${teamId}:`, currentName);
    if (newName && newName.trim() !== "" && newName.trim().length <= 20) { if (nameSpan) nameSpan.textContent = newName.trim() + ' '; }
    else if (newName !== null) { UIUpdater.notifyUser("Invalid name (max 20 chars).", 2000); }
}

const FirebaseOps = {
    findCaptainUid(players, team) { 
        if (!players) return null; for (const uid in players) { if (players[uid].role === 'captain' && players[uid].team === team) return uid; } return null;
    },

    createRoom() {
        if (!fbAuth || !fbDb || !appState.currentUserId || appState.isMultiplayerMode) {
            UIUpdater.notifyUser('Cannot create room now.', 3000); return;
        }
        console.log("MP: Attempting to create room...");
        const now = new Date();
        const datePrefix = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}`;
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newDraftId = `${datePrefix}-${randomPart}`;

        const teamAName = DOMElements.teamAHeading?.firstChild?.textContent?.replace(/[🔄✎]/, '').trim() || "Team A";
        const teamBName = DOMElements.teamBHeading?.firstChild?.textContent?.replace(/[🔄✎]/, '').trim() || "Team B";
        let timerDuration = parseInt(DOMElements.timerDurationInput.value) || DEFAULT_TIMER_DURATION_SECONDS;
        if (timerDuration <= 0) timerDuration = DEFAULT_TIMER_DURATION_SECONDS;

        const initialDraftState = {
            settings: {
                maxTotalBans: parseInt(DOMElements.banCountSelect.value),
                hunterExclusivity: DOMElements.hunterExclusivityCheckbox.checked,
                timerEnabled: DOMElements.timerEnabledCheckbox.checked,
                timerDuration: timerDuration,
                draftOrderType: DOMElements.draftOrderTypeSelect.value,
                createdAt: serverTimestamp(),
            },
            currentGameNumber: 1, 
            matchHistory: { // Initialize history for game 1
                1: [] // Initialize as empty array
            },     
            status: 'waiting', teamAName, teamBName, teamASwapIntent: false, teamBSwapIntent: false,
            currentPhase: null, currentTeam: null, currentActionStartTime: null,
            pickOrderIndex: 0, teamAPicks: [], teamBPicks: [], bannedCharacters: [],
            players: {
                [appState.currentUserId]: {
                    displayName: `${appState.currentUserId.substring(0, 4)}`, team: 'A', role: 'captain',
                    isConnected: true, isReady: false
                }
            },
        };

        set(ref(fbDb, `drafts/${newDraftId}`), initialDraftState).then(() => {
            console.log(`MP: Room created: ${newDraftId}, Creator UID: ${appState.currentUserId}`);
            appState.multiplayer.currentDraftId = newDraftId;
            appState.multiplayer.playerRole = 'captainA';
            updateApplicationMode(true); 
            sessionStorage.setItem('currentDraftId', newDraftId);
            sessionStorage.setItem('playerRole', 'captainA');
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(newDraftId)
                    .then(() => UIUpdater.notifyUser(`Room Code copied to your clipboard!`, 2500))
                    .catch(err => { console.warn('Failed to copy room code:', err); UIUpdater.notifyUser(`Room Code copy to clipboard failed: ${newDraftId}`, 3000);});
            } else { UIUpdater.notifyUser(`Room Code: ${newDraftId} (manual copy)`, 3000); console.log(`Room Code for manual copy: ${newDraftId}`); }
            
            FirebaseOps.subscribeToDraftChanges(newDraftId);
            FirebaseOps.setupPresence(appState.currentUserId);
        }).catch(error => {
            console.error("MP: Failed to create room:", error);
            UIUpdater.notifyUser("Error creating room.", 3000);
            updateApplicationMode(false);
        });
    },

    joinRoom(roomCodeInput) { 
        if (!fbAuth || !fbDb || !appState.currentUserId || appState.isMultiplayerMode) { UIUpdater.notifyUser('Cannot join room now.', 3000); return; }
        const roomCode = roomCodeInput.trim().toUpperCase(); if (!roomCode) { UIUpdater.notifyUser('Please enter a room code.', 2000); return; }
        console.log(`MP: User ${appState.currentUserId} attempting to join room: ${roomCode}`);
        const draftRef = ref(fbDb, `drafts/${roomCode}`); let joinedAsRole = null;
        runTransaction(draftRef, (currentData) => {
            if (currentData === null) throw new Error(`Room ${roomCode} not found.`); currentData.players = currentData.players || {};
            const existingPlayer = currentData.players[appState.currentUserId];
            if (existingPlayer) { currentData.players[appState.currentUserId].isConnected = true; joinedAsRole = existingPlayer.role === 'captain' ? (existingPlayer.team === 'A' ? 'captainA' : 'captainB') : 'spectator';
            } else { const captainAUid = FirebaseOps.findCaptainUid(currentData.players, 'A'); const captainBUid = FirebaseOps.findCaptainUid(currentData.players, 'B'); let assignedTeam = null;
                if (!captainAUid) { assignedTeam = 'A'; joinedAsRole = 'captainA'; } else if (!captainBUid) { assignedTeam = 'B'; joinedAsRole = 'captainB'; } else { joinedAsRole = 'spectator'; }
                currentData.players[appState.currentUserId] = { displayName: `${appState.currentUserId.substring(0, 4)}`, team: assignedTeam, role: (assignedTeam ? 'captain' : 'spectator'), isConnected: true, isReady: false };
            } return currentData;
        }).then(() => {
            console.log(`MP: User ${appState.currentUserId} successfully joined ${roomCode} as ${joinedAsRole}`);
            appState.multiplayer.playerRole = joinedAsRole; appState.multiplayer.currentDraftId = roomCode;
            updateApplicationMode(true); sessionStorage.setItem('currentDraftId', roomCode); sessionStorage.setItem('playerRole', joinedAsRole);
            FirebaseOps.subscribeToDraftChanges(roomCode); FirebaseOps.setupPresence(appState.currentUserId);
        }).catch((error) => { console.error(`MP: Failed to join room ${roomCode}:`, error); UIUpdater.notifyUser(`Error joining: ${error.message || 'Unknown error.'}`, 3000); if (appState.isMultiplayerMode) FirebaseOps.leaveRoomCleanup(); else UIUpdater.updateMultiplayerButtonVisibility(); });
    },

    subscribeToDraftChanges(draftId) {
        if (!fbDb || !draftId) return;
        if (appState.mpDraftSubscription) try { appState.mpDraftSubscription(); } catch(e) { console.warn("Error unsubscribing:", e); }

        const draftRef = ref(fbDb, `drafts/${draftId}`);
        console.log(`MP: Subscribing to draft ${draftId}`);
        appState.mpDraftSubscription = onValue(draftRef, (snapshot) => {
            if (!appState.isMultiplayerMode || appState.multiplayer.currentDraftId !== draftId) {
                if (appState.mpDraftSubscription) try { appState.mpDraftSubscription(); } catch(e) {/*ignore*/}
                appState.mpDraftSubscription = null; return;
            }
            const data = snapshot.val();
            if (data) {
                const previousState = appState.multiplayer.draftState;
                appState.multiplayer.draftState = data; // Update local cache

                // Update player role
                const myPlayerData = data.players?.[appState.currentUserId];
                if (myPlayerData) {
                    const newPlayerRole = myPlayerData.role === 'captain' ? (myPlayerData.team === 'A' ? 'captainA' : 'captainB') : 'spectator';
                    if (appState.multiplayer.playerRole !== newPlayerRole) {
                        appState.multiplayer.playerRole = newPlayerRole; sessionStorage.setItem('playerRole', newPlayerRole);
                    }
                } else if (appState.multiplayer.playerRole !== null) {
                    appState.multiplayer.playerRole = null; sessionStorage.removeItem('playerRole');
                }
                
                // Check for new game start to clear picks display (history handled in render)
                const prevStatus = previousState?.status;
                const prevActionTime = previousState?.currentActionStartTime;
                if (data.status === 'in_progress' && (prevStatus === 'waiting' || prevStatus === 'complete') && data.currentActionStartTime !== prevActionTime) {
                    console.log(`MP: New game detected (Game #${data.currentGameNumber}). Clearing picks display.`);
                    UIUpdater.updateTeamPicksDisplay([], []); // Clear visual picks for new game
                    // History container creation/update is handled within renderMultiplayerMainUI
                }
                
                UIUpdater.renderMultiplayerMainUI(data); // This will render everything including history

                // Timer logic
                if (data.status === 'in_progress' && data.currentActionStartTime && data.currentActionStartTime !== prevActionTime) {
                    Timer.startMultiplayerTimerFromFirebaseState(data);
                } else if (data.status !== 'in_progress' && appState.multiplayer.timerIntervalId) {
                    Timer.stop();
                } else if (data.settings?.timerEnabled === false && appState.multiplayer.timerIntervalId) {
                    Timer.stop();
                } else if (data.settings?.timerEnabled && data.status === 'in_progress' && data.currentActionStartTime && !appState.multiplayer.timerIntervalId) {
                     Timer.startMultiplayerTimerFromFirebaseState(data); 
                }

            } else { 
                UIUpdater.notifyUser(`Room ${draftId} closed or not found.`, 3000);
                FirebaseOps.leaveRoomCleanup();
            }
        }, (error) => {
            console.error(`MP: Firebase subscription error for ${draftId}:`, error);
            UIUpdater.notifyUser("Connection error to draft. Refresh.", 3000);
            FirebaseOps.leaveRoomCleanup();
        });
    },

    leaveRoomCleanup() { 
        console.log("MP: Initiating leave room cleanup."); const leavingDraftId = appState.multiplayer.currentDraftId; const leavingUserId = appState.currentUserId;
        if (fbDb && leavingUserId && leavingDraftId) { const playerPath = `drafts/${leavingDraftId}/players/${leavingUserId}`; const updates = {}; updates[`${playerPath}/isConnected`] = false; const currentRole = appState.multiplayer.playerRole; if (currentRole === 'captainA' || currentRole === 'captainB') { updates[`${playerPath}/isReady`] = false; if (currentRole === 'captainA') updates[`drafts/${leavingDraftId}/teamASwapIntent`] = false; if (currentRole === 'captainB') updates[`drafts/${leavingDraftId}/teamBSwapIntent`] = false; } update(ref(fbDb), updates).catch(err => console.warn("MP: Minor error marking self offline/resetting intent:", err)); onDisconnect(ref(fbDb, playerPath)).cancel().catch(err => console.warn("MP: Minor error cancelling draft player disconnect hook:", err)); }
        resetMultiplayerSessionState(); updateApplicationMode(false); UIUpdater.updateStatusMessageText();
    },

    setupPresence(userId) { 
        if (!fbDb || !userId) { console.warn("Presence: Skipped, no DB or UID."); return; }
        const userStatusDatabaseRef = ref(fbDb, `/status/${userId}`); const connectedRef = ref(fbDb, '.info/connected'); console.log(`Presence: Setting up for UID ${userId}`);
        onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === false) { console.log("Presence: Not connected to Firebase RTDB."); return; }
            console.log("Presence: Connected. Setting online status and onDisconnect for global status.");
            onDisconnect(userStatusDatabaseRef).set({ state: 'offline', last_changed: serverTimestamp() }).then(() => set(userStatusDatabaseRef, { state: 'online', last_changed: serverTimestamp() }));
            const currentDraftId = appState.multiplayer.currentDraftId; const currentRole = appState.multiplayer.playerRole;
            if (appState.isMultiplayerMode && currentDraftId && userId) {
                console.log(`Presence: Setting up draft-specific onDisconnect for ${userId} in ${currentDraftId}, role: ${currentRole}`);
                const playerDraftPath = `drafts/${currentDraftId}/players/${userId}`; const onDisconnectUpdates = {}; onDisconnectUpdates[`${playerDraftPath}/isConnected`] = false;
                if (currentRole === 'captainA') { onDisconnectUpdates[`${playerDraftPath}/isReady`] = false; onDisconnectUpdates[`drafts/${currentDraftId}/teamASwapIntent`] = false; }
                else if (currentRole === 'captainB') { onDisconnectUpdates[`${playerDraftPath}/isReady`] = false; onDisconnectUpdates[`drafts/${currentDraftId}/teamBSwapIntent`] = false; }
                onDisconnect(ref(fbDb)).update(onDisconnectUpdates).then(() => { console.log(`Presence: Draft onDisconnect set for ${userId}. Now setting isConnected: true.`); update(ref(fbDb, playerDraftPath), { isConnected: true }); }).catch(err => console.error("MP Presence Error (draft specific onDisconnect):", err));
            } else { console.log("Presence: Not in MP mode or no draft ID, skipping draft-specific onDisconnect."); }
        });
    },
    
    handleMultiplayerSelectAction(charName, isSkip = false) {
        const mpState = appState.multiplayer;
        if (!fbDb || !appState.isMultiplayerMode || !appState.currentUserId || !mpState.currentDraftId || mpState.playerRole === 'spectator') {
            console.warn("MP Select/Skip: Conditions not met."); return;
        }
        const draftRef = ref(fbDb, `drafts/${mpState.currentDraftId}`);
        
        runTransaction(draftRef, (currentData) => {
            if (!currentData) { console.warn("MP TXN: No current data."); return; } 
            if (currentData.status !== 'in_progress') { console.log("MP TXN: Draft not in progress."); return; } 

            const myPlayerData = currentData.players?.[appState.currentUserId];
            if (!myPlayerData || myPlayerData.role !== 'captain' || currentData.currentTeam !== myPlayerData.team) {
                console.log("MP TXN: Not player's turn or not captain."); return;
            }

            if (!isSkip && !DraftLogic.isCharValidSelection(charName, currentData.currentPhase, myPlayerData.team, currentData.teamAPicks || [], currentData.teamBPicks || [], currentData.bannedCharacters || [], currentData.settings?.hunterExclusivity)) {
                console.log(`MP TXN: Invalid selection: ${charName}`); return; 
            }
            
            currentData.bannedCharacters = currentData.bannedCharacters || [];
            currentData.teamAPicks = currentData.teamAPicks || [];
            currentData.teamBPicks = currentData.teamBPicks || [];
            let actionTaken = false;
            let historyString = ""; // Simplified history entry

            // Determine pick number *before* modifying arrays
            let pickNumber = 0;
            if (currentData.currentPhase === 'pick' && !isSkip) {
                pickNumber = (myPlayerData.team === 'A' ? (currentData.teamAPicks?.length || 0) : (currentData.teamBPicks?.length || 0)) + 1;
            }

            if (currentData.currentPhase === 'ban') {
                if (isSkip) {
                    const placeholder = `_skipped_ban_${myPlayerData.team}_${currentData.bannedCharacters.length + 1}`;
                    currentData.bannedCharacters.push(placeholder);
                    historyString = `${myPlayerData.team}0 Null. `; 
                } else {
                    currentData.bannedCharacters.push(charName);
                    historyString = `${myPlayerData.team}0 ${charName}. `;
                }
                actionTaken = true;
            } else if (currentData.currentPhase === 'pick' && !isSkip) {
                if (myPlayerData.team === 'A') currentData.teamAPicks.push(charName);
                else currentData.teamBPicks.push(charName);
                historyString = `${myPlayerData.team}${pickNumber} ${charName}. `;
                actionTaken = true;
            }

            if (actionTaken) {
                // Record history string to Firebase using push
                const gameNum = currentData.currentGameNumber || 1;
                // Ensure the path exists and is an array before pushing
                currentData.matchHistory = currentData.matchHistory || {};
                currentData.matchHistory[gameNum] = currentData.matchHistory[gameNum] || []; 
                // Check if it's actually an array (might be object if corrupted)
                if (!Array.isArray(currentData.matchHistory[gameNum])) {
                    console.warn(`MP TXN: Match history for game ${gameNum} was not an array! Resetting.`);
                    currentData.matchHistory[gameNum] = []; // Reset to array if needed
                }
                currentData.matchHistory[gameNum].push(historyString); // Add the string

                const { phase, team, draftOver } = DraftLogic.determineNextTurn(
                    currentData.currentPhase, currentData.currentTeam,
                    currentData.bannedCharacters.length, currentData.settings.maxTotalBans,
                    currentData.teamAPicks.length + currentData.teamBPicks.length,
                    currentData.settings.draftOrderType
                );
                if (draftOver) {
                    currentData.status = 'complete'; currentData.currentTeam = null; currentData.currentPhase = null;
                    currentData.currentActionStartTime = null; currentData.teamASwapIntent = false; currentData.teamBSwapIntent = false;
                    Object.values(currentData.players).forEach(p => { if(p.role === 'captain') p.isReady = false; });
                } else {
                    currentData.currentPhase = phase; currentData.currentTeam = team;
                    currentData.currentActionStartTime = serverTimestamp(); 
                }
            }
            return currentData;
        }).catch(error => {
            console.error("MP Select/Skip transaction failed:", error);
            UIUpdater.notifyUser(`Action Error: ${error.message}`, 3000);
        });
    },

    handleMultiplayerReadyUp() { 
        const mpState = appState.multiplayer; if (!fbDb || !appState.isMultiplayerMode || !appState.currentUserId || !mpState.currentDraftId || !(mpState.playerRole === 'captainA' || mpState.playerRole === 'captainB')) return; if (mpState.draftState?.status !== 'waiting' && mpState.draftState?.status !== 'complete') return;
        const currentReadyState = mpState.draftState?.players?.[appState.currentUserId]?.isReady ?? false; const newReadyState = !currentReadyState; const updates = {}; updates[`/players/${appState.currentUserId}/isReady`] = newReadyState;
        if (!newReadyState) { if (mpState.playerRole === 'captainA') updates['/teamASwapIntent'] = false; if (mpState.playerRole === 'captainB') updates['/teamBSwapIntent'] = false; }
        update(ref(fbDb, `drafts/${mpState.currentDraftId}`), updates).catch(error => UIUpdater.notifyUser("Error setting ready status.", 2000));
    },

    handleMultiplayerStartDraft() {
        const mpState = appState.multiplayer;
        if (!fbDb || !appState.isMultiplayerMode || !appState.currentUserId || !mpState.currentDraftId || mpState.playerRole !== 'captainA') {
            UIUpdater.notifyUser("Only Team A captain can start.", 2000); return;
        }
        const draftRef = ref(fbDb, `drafts/${mpState.currentDraftId}`);
        runTransaction(draftRef, (currentData) => {
            if (!currentData) { console.warn("MP Start TXN: No data"); return; }
            if (currentData.status !== 'waiting' && currentData.status !== 'complete') {
                 console.log("MP Start TXN: Not in waiting or complete state."); return;
            }
            let playerA = null, playerB = null;
            if (currentData.players) { for (const uid in currentData.players) { const p = currentData.players[uid]; if (p.role === 'captain') { if (p.team === 'A') playerA = p; if (p.team === 'B') playerB = p; }}}
            if (!playerA || !playerB || !playerA.isConnected || !playerB.isConnected || !playerA.isReady || !playerB.isReady) {
                throw new Error("Both captains must be connected and ready.");
            }
            console.log("MP Start TXN: Resetting for new draft.");
            if (currentData.status === 'complete') { // If starting after a game was completed
                currentData.currentGameNumber = (currentData.currentGameNumber || 0) + 1;
            } 
            
            currentData.teamAPicks = []; currentData.teamBPicks = []; currentData.bannedCharacters = [];
            currentData.pickOrderIndex = 0; currentData.teamASwapIntent = false; currentData.teamBSwapIntent = false;
            Object.values(currentData.players).forEach(p => { if(p.role === 'captain') p.isReady = false; });
            // Ensure matchHistory for the new game number exists as an empty array
            currentData.matchHistory = currentData.matchHistory || {};
            currentData.matchHistory[currentData.currentGameNumber] = []; // Initialize as empty array

            currentData.status = 'in_progress';
            currentData.currentPhase = (currentData.settings?.maxTotalBans ?? 0) > 0 ? 'ban' : 'pick';
            currentData.currentTeam = 'A';
            currentData.currentActionStartTime = serverTimestamp();
            return currentData;
        }).catch(err => UIUpdater.notifyUser(`Failed to start draft: ${err.message}`, 3000));
    },

    handleMultiplayerConfigUpdate(settingName, value) { 
        const mpState = appState.multiplayer; if (!fbDb || !appState.isMultiplayerMode || !mpState.currentDraftId || mpState.playerRole !== 'captainA') { UIUpdater.updateConfigInputsState(true, mpState.draftState?.settings); return; } const draftStatus = mpState.draftState?.status; if (draftStatus !== 'waiting' && draftStatus !== 'complete') { UIUpdater.updateConfigInputsState(true, mpState.draftState?.settings); return; } let processedValue = value; if (settingName === 'maxTotalBans' || settingName === 'timerDuration') { processedValue = parseInt(value); if (isNaN(processedValue)) { UIUpdater.updateConfigInputsState(true, mpState.draftState?.settings); return; } } console.log(`MP: Captain A updating setting '${settingName}' to '${processedValue}'`); set(ref(fbDb, `drafts/${mpState.currentDraftId}/settings/${settingName}`), processedValue).catch(error => UIUpdater.notifyUser(`Error updating ${settingName}.`, 2000));
    },
    
    handleMultiplayerEditTeamName(event) { 
        const mpState = appState.multiplayer; if (!fbDb || !appState.isMultiplayerMode || !mpState.currentDraftId || !appState.currentUserId || !mpState.draftState) return; const button = event.target; const headingDiv = button.closest('div.team-heading'); if (!headingDiv) return; const teamId = headingDiv.id.includes('team-a') ? 'A' : 'B'; const myPlayerData = mpState.draftState.players?.[appState.currentUserId]; const draftStatus = mpState.draftState.status; if (!(myPlayerData?.role === 'captain' && myPlayerData?.team === teamId && (draftStatus === 'waiting' || draftStatus === 'complete'))) { UIUpdater.notifyUser("Can only edit your team's name before/after draft.", 2000); return; } const currentName = (teamId === 'A' ? mpState.draftState.teamAName : mpState.draftState.teamBName) || `Team ${teamId}`; const newName = prompt(`Enter new name for Team ${teamId}:`, currentName); if (newName && newName.trim() !== "" && newName.trim().length <= 20) { set(ref(fbDb, `drafts/${mpState.currentDraftId}/team${teamId}Name`), newName.trim()).catch(err => UIUpdater.notifyUser("Error updating name.", 2000)); } else if (newName !== null) { UIUpdater.notifyUser("Invalid name (max 20 chars).", 2000); }
    }
};

function setupAuthentication() { 
    if (!fbAuth || fbAuthError) { console.error("Auth setup skipped: Firebase Auth failed or unavailable.", fbAuthError); UIUpdater.updateMultiplayerButtonVisibility(); return; }
    onAuthStateChanged(fbAuth, (user) => {
        if (user) { console.log("Auth: User state changed. UID:", user.uid, "Current app UID:", appState.currentUserId); if (appState.currentUserId === user.uid && appState.currentUserId !== null) { console.log("Auth: UID matches existing."); if (appState.isMultiplayerMode && appState.multiplayer.currentDraftId) { FirebaseOps.setupPresence(user.uid); } UIUpdater.updateMultiplayerButtonVisibility(); return; } console.log(`Auth: New User/UID. Old: ${appState.currentUserId}, New: ${user.uid}`); appState.currentUserId = user.uid; appState.authError = null; FirebaseOps.setupPresence(user.uid); if (!appState.isMultiplayerMode) { UIUpdater.updateMultiplayerButtonVisibility(); UIUpdater.updateStatusMessageText(); } else { console.log("Auth: State changed while in MP mode."); UIUpdater.updateMultiplayerButtonVisibility(); if(appState.multiplayer.draftState && Object.keys(appState.multiplayer.draftState).length > 0) { UIUpdater.renderMultiplayerMainUI(appState.multiplayer.draftState); } else if (appState.multiplayer.currentDraftId) { FirebaseOps.subscribeToDraftChanges(appState.multiplayer.currentDraftId); } }
        } else { console.log("Auth: User signed out."); if (appState.isMultiplayerMode) FirebaseOps.leaveRoomCleanup(); appState.currentUserId = null; appState.authError = null; sessionStorage.removeItem('currentDraftId'); sessionStorage.removeItem('playerRole'); updateApplicationMode(false); UIUpdater.updateStatusMessageText(); }
    });
    signInAnonymously(fbAuth).catch((error) => { console.error("Anonymous sign-in failed:", error); appState.authError = error; fbAuthError = error; appState.currentUserId = null; UIUpdater.updateMultiplayerButtonVisibility(); UIUpdater.setText(DOMElements.statusMessage, "Authentication Failed."); });
}

function handleCharacterClick(charName) { 
    if (appState.isMultiplayerMode) { FirebaseOps.handleMultiplayerSelectAction(charName, false); } else { handleLocalSelect(charName); }
}

function handleConfigButtonClick() {
    const configPanel = DOMElements.configPanel;
    if (!configPanel) return;
    
    const isHidden = configPanel.classList.contains('hidden');

    if (appState.isMultiplayerMode) {
        const data = appState.multiplayer.draftState;
        const draftStatus = data?.status;
        // Only Captain A can toggle config, and only when waiting or complete
        const canToggle = appState.multiplayer.playerRole === 'captainA' && 
                          (draftStatus === 'waiting' || draftStatus === 'complete');
        
        if (canToggle) {
            if (isHidden) { // If opening panel
                UIUpdater.updateConfigInputsState(false, data.settings); // Enable and sync inputs
                UIUpdater.show(configPanel);
            } else { // If closing panel
                UIUpdater.hide(configPanel);
                // Keep inputs disabled after closing (will be re-enabled if opened again)
                 UIUpdater.updateConfigInputsState(true, data.settings); 
            }
        } else { // Conditions not met, ensure panel is hidden and inputs disabled
            UIUpdater.hide(configPanel);
            UIUpdater.updateConfigInputsState(true, data?.settings);
        }
    } else { // Local mode
        if (!appState.local.draftActive) {
            // Toggle visibility only if draft is not active
            if (isHidden) { 
                UIUpdater.show(configPanel); 
            } else { 
                UIUpdater.hide(configPanel);
            } 

        } else {
            // Ensure hidden if draft is active
            UIUpdater.hide(configPanel); 
        }
         // Update input disabled state based on panel visibility AND draft state
         UIUpdater.updateConfigInputsState(configPanel.classList.contains('hidden') || appState.local.draftActive);
    }
}


function handleSwapIntentClick(event) { 
    const mpState = appState.multiplayer; if (!fbDb || !appState.isMultiplayerMode || !appState.currentUserId || !mpState.currentDraftId || !mpState.draftState || !(mpState.playerRole === 'captainA' || mpState.playerRole === 'captainB')) { console.warn("Swap Intent: Conditions not met."); return; } const draftStatus = mpState.draftState.status; if (draftStatus !== 'waiting' && draftStatus !== 'complete') { console.log("Swap Intent: Can only swap in 'waiting' or 'complete'."); return; } const draftRef = ref(fbDb, `drafts/${mpState.currentDraftId}`); const myCurrentTeam = mpState.playerRole === 'captainA' ? 'A' : 'B'; console.log(`Swap Intent: Clicked by Captain ${myCurrentTeam}`);
    runTransaction(draftRef, (currentData) => {
        if (!currentData || (currentData.status !== 'waiting' && currentData.status !== 'complete')) return; const capAUid = FirebaseOps.findCaptainUid(currentData.players, 'A'); const capBUid = FirebaseOps.findCaptainUid(currentData.players, 'B');
        if ((capAUid && !capBUid) || (!capAUid && capBUid)) { const singleCapUid = capAUid || capBUid; if (singleCapUid === appState.currentUserId) { console.log(`Swap TXN: Single captain ${myCurrentTeam} initiating immediate swap.`); const tempName = currentData.teamAName; currentData.teamAName = currentData.teamBName; currentData.teamBName = tempName; if (currentData.status === 'complete') { const tempPicks = currentData.teamAPicks; currentData.teamAPicks = currentData.teamBPicks; currentData.teamBPicks = tempPicks; } if (currentData.players[singleCapUid]) currentData.players[singleCapUid].team = (currentData.players[singleCapUid].team === 'A' ? 'B' : 'A'); currentData.teamASwapIntent = false; currentData.teamBSwapIntent = false; if (currentData.players[singleCapUid]) currentData.players[singleCapUid].isReady = false; }}
        else if (capAUid && capBUid) { console.log(`Swap TXN: Both captains present. My team: ${myCurrentTeam}`); if (myCurrentTeam === 'A') currentData.teamASwapIntent = !currentData.teamASwapIntent; else currentData.teamBSwapIntent = !currentData.teamBSwapIntent; console.log(`Swap TXN: Intents - A: ${currentData.teamASwapIntent}, B: ${currentData.teamBSwapIntent}`); if (currentData.teamASwapIntent && currentData.teamBSwapIntent) { console.log("Swap TXN: Both intents true, performing swap!"); const tempName = currentData.teamAName; currentData.teamAName = currentData.teamBName; currentData.teamBName = tempName; if (currentData.status === 'complete') { const tempPicks = currentData.teamAPicks; currentData.teamAPicks = currentData.teamBPicks; currentData.teamBPicks = tempPicks; } if (currentData.players[capAUid] && currentData.players[capBUid]) { currentData.players[capAUid].team = 'B'; currentData.players[capBUid].team = 'A'; } currentData.teamASwapIntent = false; currentData.teamBSwapIntent = false; if (currentData.players[capAUid]) currentData.players[capAUid].isReady = false; if (currentData.players[capBUid]) currentData.players[capBUid].isReady = false; }} 
        return currentData;
    }).catch(error => { UIUpdater.notifyUser(`Swap Error: ${error.message}`, 3000); console.error("Swap Transaction Error:", error); });
}


function attachEventListeners() { 
    DOMElements.startDraftButton?.addEventListener('click', () => { appState.isMultiplayerMode ? FirebaseOps.handleMultiplayerStartDraft() : handleLocalStartDraft(); });
    DOMElements.skipBanButton?.addEventListener('click', () => { appState.isMultiplayerMode ? FirebaseOps.handleMultiplayerSelectAction(null, true) : handleLocalSkipBan(); });
    DOMElements.configButton?.addEventListener('click', handleConfigButtonClick);
    DOMElements.hunterExclusivityCheckbox?.addEventListener('change', (e) => { const val = e.target.checked; if (appState.isMultiplayerMode) FirebaseOps.handleMultiplayerConfigUpdate('hunterExclusivity', val); else if (!appState.local.draftActive) appState.local.hunterExclusivity = val; else e.target.checked = appState.local.hunterExclusivity; });
    DOMElements.banCountSelect?.addEventListener('change', (e) => { const val = parseInt(e.target.value); if (appState.isMultiplayerMode) FirebaseOps.handleMultiplayerConfigUpdate('maxTotalBans', val); else if (!appState.local.draftActive) appState.local.maxBansPerTeam = val / 2; else e.target.value = (appState.local.maxBansPerTeam * 2).toString(); });
    DOMElements.timerEnabledCheckbox?.addEventListener('change', (e) => { const val = e.target.checked; if (appState.isMultiplayerMode) FirebaseOps.handleMultiplayerConfigUpdate('timerEnabled', val); else if (!appState.local.draftActive) appState.local.timerEnabled = val; else e.target.checked = appState.local.timerEnabled; });
    DOMElements.timerDurationInput?.addEventListener('change', (e) => { let val = parseInt(e.target.value); if (isNaN(val) || val <= 0) { val = DEFAULT_TIMER_DURATION_SECONDS; e.target.value = val; } if (appState.isMultiplayerMode) FirebaseOps.handleMultiplayerConfigUpdate('timerDuration', val); else if (!appState.local.draftActive) appState.local.timerDuration = val; else e.target.value = appState.local.timerDuration; });
    DOMElements.draftOrderTypeSelect?.addEventListener('change', (e) => { const val = e.target.value; if (appState.isMultiplayerMode) FirebaseOps.handleMultiplayerConfigUpdate('draftOrderType', val); else if (!appState.local.draftActive) appState.local.draftOrderType = val; else e.target.value = appState.local.draftOrderType; });
    DOMElements.createRoomButton?.addEventListener('click', FirebaseOps.createRoom);
    DOMElements.joinRoomButton?.addEventListener('click', () => { if (appState.currentUserId && !appState.isMultiplayerMode) { UIUpdater.show(DOMElements.joinRoomInputContainer); DOMElements.roomCodeInput?.focus(); }});
    DOMElements.joinRoomForm?.addEventListener('submit', (event) => { event.preventDefault(); if (!appState.isMultiplayerMode && DOMElements.roomCodeInput?.value) { FirebaseOps.joinRoom(DOMElements.roomCodeInput.value); DOMElements.roomCodeInput.value = ''; UIUpdater.hide(DOMElements.joinRoomInputContainer); } else if (!DOMElements.roomCodeInput?.value) { UIUpdater.notifyUser("Please enter a room code.", 2000); }});
    DOMElements.leaveRoomButton?.addEventListener('click', FirebaseOps.leaveRoomCleanup);
    DOMElements.readyButton?.addEventListener('click', FirebaseOps.handleMultiplayerReadyUp);
    DOMElements.reconnectButton?.addEventListener('click', () => { const storedDraftId = sessionStorage.getItem('currentDraftId'); if (storedDraftId && appState.currentUserId && !appState.isMultiplayerMode) { FirebaseOps.joinRoom(storedDraftId); } else { UIUpdater.updateMultiplayerButtonVisibility(); }});
    DOMElements.cancelSessionButton?.addEventListener('click', () => { sessionStorage.removeItem('currentDraftId'); sessionStorage.removeItem('playerRole'); UIUpdater.notifyUser("Previous room session cancelled.", 2000); UIUpdater.updateMultiplayerButtonVisibility(); UIUpdater.updateStatusMessageText(); });
}

function initializeWebApp() {
    const pool = DOMElements.characterPool; if (pool && pool.children.length === 0) { CHARACTERS.forEach(char => { const charDiv = document.createElement('div'); charDiv.className = 'character'; charDiv.dataset.charName = char.name; const img = document.createElement('img'); img.src = char.icon; img.alt = char.name; img.loading = 'lazy'; charDiv.appendChild(img); const nameSpan = document.createElement('span'); nameSpan.textContent = char.name; charDiv.appendChild(nameSpan); charDiv.addEventListener('click', () => handleCharacterClick(char.name)); pool.appendChild(charDiv); });}
    appState.local.hunterExclusivity = DOMElements.hunterExclusivityCheckbox.checked;
    appState.local.maxBansPerTeam = parseInt(DOMElements.banCountSelect.value) / 2;
    appState.local.timerEnabled = DOMElements.timerEnabledCheckbox.checked;
    appState.local.timerDuration = parseInt(DOMElements.timerDurationInput.value) || DEFAULT_TIMER_DURATION_SECONDS;
    if (appState.local.timerDuration <= 0) appState.local.timerDuration = DEFAULT_TIMER_DURATION_SECONDS;
    appState.local.draftOrderType = DOMElements.draftOrderTypeSelect.value;
    UIUpdater.hide(DOMElements.gameCounterDisplay); 
    updateApplicationMode(false); 
    attachEventListeners();
    setupAuthentication();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWebApp);
} else {
    initializeWebApp();
}
