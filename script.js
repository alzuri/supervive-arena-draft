const characters = [
    {name: 'Brall', icon: 'https://supervive.wiki.gg/images/thumb/f/fd/PortBrall.png/200px-PortBrall.png'},
    {name: 'Crysta', icon: 'https://supervive.wiki.gg/images/thumb/f/fd/PortCrysta.png/200px-PortCrysta.png'},
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
    {name: 'Zeph', icon: 'https://supervive.wiki.gg/images/thumb/9/93/PortZeph.png/200px-PortZeph.png'},
    {name: 'Beebo', icon: 'https://supervive.wiki.gg/images/thumb/a/af/PortBeebo.png/200px-PortBeebo.png'},
    {name: 'Celeste', icon: 'https://supervive.wiki.gg/images/thumb/5/53/PortCeleste.png/200px-PortCeleste.png'},
    {name: 'Hudson', icon: 'https://supervive.wiki.gg/images/thumb/e/e6/PortHudson.png/200px-PortHudson.png'},
    {name: 'Void', icon: 'https://supervive.wiki.gg/images/thumb/6/65/PortVoid.png/200px-PortVoid.png'}
];

let currentPhase = 'setup';
let currentTeam = 'A';
let timeLeft = 30;
let timer = null;
let teamAPicks = [];
let teamBPicks = [];
let bannedCharacters = [];
let matchHistory = [];
let gameMode = 'normal';
let maxBans = parseInt(document.getElementById('ban-count').value);
let gameCounter = 0;
let fearlessGameCounter = 0;
let draftActive = false;
let autoSelectedChars = new Set();
let hunterExclusivity = true;
let timerEnabled = false;

// Only used in Fearless mode
let teamAHistory = new Set();
let teamBHistory = new Set();

function initializeCharacterPool() {
    const pool = document.getElementById('character-pool');
    pool.innerHTML = '';
    characters.forEach(char => {
        const charDiv = document.createElement('div');
        charDiv.className = 'character';
        if (gameMode === 'fearless') {
            if (teamAHistory.has(char.name)) {
                charDiv.classList.add('team-a-previous');
            }
            if (teamBHistory.has(char.name)) {
                charDiv.classList.add('team-b-previous');
            }
        }
        
        const img = document.createElement('img');
        img.src = char.icon;
        img.alt = char.name;
        charDiv.appendChild(img);
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = char.name;
        charDiv.appendChild(nameSpan);
        
        charDiv.onclick = () => selectCharacter(char.name);
        pool.appendChild(charDiv);
    });

    document.querySelectorAll('.edit-team-name').forEach(button => {
        button.onclick = (e) => {
            const heading = e.target.parentElement;
            const team = heading.id.includes('a') ? 'A' : 'B';
            const currentName = heading.textContent.replace('✎', '').trim();
            const newName = prompt(`Enter new name for Team ${team}:`, currentName);
            if (newName) {
                heading.innerHTML = `${newName} <button class="edit-team-name">✎</button>`;
            }
        };
    });

    const skipBanBtn = document.getElementById('skip-ban');
    skipBanBtn.onclick = () => {
        if (currentPhase === 'ban') {
            bannedCharacters.push(null);
            nextPhase();
        }
    };

    document.getElementById('normal-mode').onclick = () => {
        gameMode = 'normal';
        document.getElementById('start-draft').disabled = false;
        document.querySelector('.mode-toggle').classList.remove('fearless');
        document.getElementById('game-counter').classList.add('hidden');
    };

    document.getElementById('fearless-mode').onclick = () => {
        gameMode = 'fearless';
        document.getElementById('start-draft').disabled = false;
        document.querySelector('.mode-toggle').classList.add('fearless');
        
        maxBans = 2;
    };

    document.getElementById('hunter-exclusivity').onchange = (e) => {
        if (!draftActive) {
            hunterExclusivity = e.target.checked;
        }
    };

    document.getElementById('enable-timer').onchange = (e) => {
        timerEnabled = e.target.checked;
        if (!timerEnabled) {
            clearInterval(timer);
            document.getElementById('team-a-timer').textContent = '';
            document.getElementById('team-b-timer').textContent = '';
        }
    };

    document.getElementById('config-button').onclick = () => {
        const config = document.getElementById('config');
                        config.classList.contains('hidden') 
                            ? config.classList.remove('hidden') 
                            : config.classList.add('hidden');
    };
}

function startTimer() {
    if (!timerEnabled) return;
    timeLeft = 30;
    updateTimerDisplay();
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (currentPhase === 'ban') {
                nextPhase();
            } else {
                autoSelect();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById(`team-${currentTeam.toLowerCase()}-timer`);
    timerElement.textContent = `Time: ${timeLeft}s`;
}

function autoSelect() {
    const availableCharacters = characters.filter(char => {
        const isAvailableThisRound = !bannedCharacters.includes(char.name);
        const isNotDoublePickedByTeam = currentTeam === 'A' ? 
            !teamAPicks.includes(char.name) : 
            !teamBPicks.includes(char.name);
        const isNotPickedByOtherTeam = hunterExclusivity ? 
            !teamAPicks.includes(char.name) && !teamBPicks.includes(char.name) : 
            true;
        
        if (gameMode === 'normal') return isAvailableThisRound && isNotDoublePickedByTeam && isNotPickedByOtherTeam;
        
        const isAvailableHistorically = currentTeam === 'A' ? 
            !teamAHistory.has(char.name) : 
            !teamBHistory.has(char.name);
        return isAvailableThisRound && isNotDoublePickedByTeam && isNotPickedByOtherTeam && isAvailableHistorically;
    });
    if (availableCharacters.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCharacters.length);
        const selectedChar = availableCharacters[randomIndex].name;
        autoSelectedChars.add(selectedChar);
        selectCharacter(selectedChar);
    }
}

function selectCharacter(char) {
    if (!draftActive) return;
    
    if (currentPhase === 'ban') {
        if (!bannedCharacters.includes(char)) {
            bannedCharacters.push(char);
            recordMatchHistory(currentTeam, currentPhase, char);
            updateCharacterPool();
            nextPhase();
        }
    } else if (currentPhase === 'pick') {
        let canSelect = true;
        if (gameMode === 'fearless') {
            canSelect = currentTeam === 'A' ? 
                !teamAHistory.has(char) : 
                !teamBHistory.has(char);
        }
        
        const isNotBanned = !bannedCharacters.includes(char);
        const isNotDoublePickedByTeam = currentTeam === 'A' ? 
            !teamAPicks.includes(char) : 
            !teamBPicks.includes(char);
        const isNotPickedByOtherTeam = hunterExclusivity ? 
            !teamAPicks.includes(char) && !teamBPicks.includes(char) : 
            true;
        
        if (isNotBanned && isNotDoublePickedByTeam && isNotPickedByOtherTeam && canSelect) {
            if (currentTeam === 'A') {
                teamAPicks.push(char);
                if (gameMode === 'fearless') teamAHistory.add(char);
            } else {
                teamBPicks.push(char);
                if (gameMode === 'fearless') teamBHistory.add(char);
            }
            recordMatchHistory(currentTeam, currentPhase, char);
            updateCharacterPool();
            updateTeamDisplay();
            nextPhase();
        }
    }
}

function createMatchHistory() {
    const draftId = gameMode === 'normal' ? `draft${gameCounter}` : `fdraft${fearlessGameCounter}`;
    const historyContainer = document.getElementById('match-history');
    
    const newDraftDiv = document.createElement('div');
    newDraftDiv.id = draftId;
    newDraftDiv.innerHTML = gameMode === 'normal' ? `Draft ${gameCounter}: ` : `FDraft ${fearlessGameCounter}: `;
    newDraftDiv.setAttribute('class', 'match')
    
    historyContainer.appendChild(newDraftDiv);
}

function recordMatchHistory(team, phase, character) {
    if (phase === 'ban') {
        matchHistory.push(`${team}0 ${character}. `);
    } else if (phase === 'pick') {
        const pickIndex = currentTeam === 'A' ? teamAPicks.length : teamBPicks.length;
        matchHistory.push(`${team}${pickIndex} ${character}. `);
    }
    updateMatchHistoryDisplay();
}

function updateMatchHistoryDisplay() {
    const draftId = gameMode === 'normal' ? `draft${gameCounter}` : `fdraft${fearlessGameCounter}`;
    const historyContainer = document.getElementById(`${draftId}`);
    historyContainer.innerHTML += `${matchHistory[matchHistory.length - 1]}`;
}

function updateCharacterPool() {
    const pool = document.getElementById('character-pool');
    pool.childNodes.forEach(charDiv => {
        const charName = charDiv.querySelector('span').textContent;
        charDiv.className = 'character';
        
        if (gameMode === 'fearless') {
            if (teamAHistory.has(charName)) {
                charDiv.classList.add('team-a-previous');
            }
            if (teamBHistory.has(charName)) {
                charDiv.classList.add('team-b-previous');
            }
        }
        
        if (bannedCharacters.includes(charName)) {
            charDiv.classList.add('banned');
        }
        if (teamAPicks.includes(charName)) {
            if (hunterExclusivity) {
                charDiv.classList.add('selected');
            }
            charDiv.classList.add('team-a-picked');
        }
        if (teamBPicks.includes(charName)) {
            if (hunterExclusivity) {
                charDiv.classList.add('selected');
            }
            charDiv.classList.add('team-b-picked');
        }
    });
}

function updateTeamDisplay() {
    const teamADiv = document.getElementById('team-a-picks');
    const teamBDiv = document.getElementById('team-b-picks');
    
    teamADiv.innerHTML = teamAPicks.map(charName => {
        const char = characters.find(c => c.name === charName);
        const autoSelectedClass = autoSelectedChars.has(charName) ? 'auto-selected' : '';
        return `<div class="character picked ${autoSelectedClass}">
            <img src="${char.icon}" alt="${char.name}">
            <span>${char.name}</span>
        </div>`;
    }).join('');
    
    teamBDiv.innerHTML = teamBPicks.map(charName => {
        const char = characters.find(c => c.name === charName);
        const autoSelectedClass = autoSelectedChars.has(charName) ? 'auto-selected' : '';
        return `<div class="character picked ${autoSelectedClass}">
            <img src="${char.icon}" alt="${char.name}">
            <span>${char.name}</span>
        </div>`;
    }).join('');
}

function nextPhase() {
    clearInterval(timer);
    if (currentPhase === 'ban') {
        if (bannedCharacters.length === maxBans) {
            currentPhase = 'pick';
            currentTeam = 'A';
        } else {
            currentTeam = currentTeam === 'A' ? 'B' : 'A';
        }
    } else if (currentPhase === 'pick') {
        const totalPicks = teamAPicks.length + teamBPicks.length;
        
        if (totalPicks === 8) { 
            endDraft();
            return;
        }
        
        if (totalPicks < 1) { // First pick goes to A
            currentTeam = 'A';
        } else if (totalPicks < 3) { // Next 2 picks go to B
            currentTeam = 'B';
        } else if (totalPicks < 5) { // Next 2 picks go to A
            currentTeam = 'A';
        } else if (totalPicks < 7) { // Next 2 picks go to B
            currentTeam = 'B';
        } else { // Last pick goes to A
            currentTeam = 'A';
        }
    }
    
    updateStatusMessage();
    startTimer();
    
    const skipBanBtn = document.getElementById('skip-ban');
    skipBanBtn.style.display = currentPhase === 'ban' ? 'inline-block' : 'none';
}

function updateStatusMessage() {
    const message = document.getElementById('status-message');
    const teamHeading = document.getElementById(`team-${currentTeam.toLowerCase()}-heading`);
    const teamName = teamHeading.textContent.replace('✎', '').trim();
    message.textContent = `${teamName} ${currentPhase}`;
}

function endDraft() {
    draftActive = false;
    const message = document.getElementById('status-message');
    message.textContent = 'Draft Complete!';
    document.getElementById('start-draft').disabled = false;
    document.getElementById('skip-ban').style.display = 'none';
    document.getElementById('normal-mode').disabled = false;
    document.getElementById('fearless-mode').disabled = false;
    document.getElementById('hunter-exclusivity').disabled = false;
    document.getElementById('enable-timer').disabled = false;
    document.getElementById('config-button').disabled = false;
}

document.getElementById('start-draft').onclick = () => {
    if (!gameMode) {
        alert('Please select a game mode first!');
        return;
    }
    
    if (gameMode === 'normal') {
        gameCounter++
        maxBans = parseInt(document.getElementById('ban-count').value);
    }
    if (gameMode === 'fearless') {
        fearlessGameCounter++;
        document.getElementById('game-counter').textContent = `Game #${fearlessGameCounter}`;
        document.getElementById('game-counter').classList.remove('hidden');
    }
    
    currentPhase = 'ban';
    currentTeam = 'A';
    teamAPicks = [];
    teamBPicks = [];
    bannedCharacters = [];
    matchHistory = [];
    autoSelectedChars = new Set();
    draftActive = true;
    document.getElementById('start-draft').disabled = true;
    document.getElementById('normal-mode').disabled = true;
    document.getElementById('fearless-mode').disabled = true;
    document.getElementById('hunter-exclusivity').disabled = true;
    document.getElementById('enable-timer').disabled = true;
    document.getElementById('config-button').disabled = true;
    document.getElementById('config').classList.add('hidden');
    updateStatusMessage();
    startTimer();
    updateCharacterPool();
    updateTeamDisplay();
    document.getElementById('skip-ban').style.display = 'inline-block';
    createMatchHistory();
};

initializeCharacterPool();