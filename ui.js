import { game, dungeonMap } from './state.js';
import { 
    getDifficultyText, 
    isObjectVisible, 
    isObjectVisibleDebug, 
    get2DPosition 
} from './utils.js';
import { getMonsterName, MONSTER_TYPES } from './entities/monster.js';
import { JOURNAL_ENTRIES } from './journalData.js';

// Toggle Map View
export function toggleMap() {
    let mapContainer = document.getElementById('map-overlay');
    
    if (!mapContainer) {
        // Create map container if it doesn't exist
        mapContainer = document.createElement('div');
        mapContainer.id = 'map-overlay';
        mapContainer.style.position = 'fixed';
        mapContainer.style.top = '20px';
        mapContainer.style.right = '20px';
        mapContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        mapContainer.style.opacity = '0.7';
        mapContainer.style.border = '2px solid #444';
        mapContainer.style.padding = '10px';
        mapContainer.style.zIndex = '1000';
        mapContainer.style.display = 'none';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'map-canvas';
        canvas.width = 400;
        canvas.height = 400;
        mapContainer.appendChild(canvas);
        
        document.body.appendChild(mapContainer);
    }
    
    if (mapContainer.style.display === 'none') {
        mapContainer.style.display = 'block';
        drawMap();
    } else {
        mapContainer.style.display = 'none';
    }
}

function drawMap() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = game.dungeon.width;
    const height = game.dungeon.height;
    const cellSize = canvas.width / width;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw walls and floor
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (dungeonMap[y][x] === 1) {
                ctx.fillStyle = '#444'; // Wall
            } else if (dungeonMap[y][x] === 2) {
                ctx.fillStyle = '#0000aa'; // Water
            } else if (dungeonMap[y][x] === 4) {
                ctx.fillStyle = '#8B4513'; // Door (Brown)
            } else {
                ctx.fillStyle = '#111'; // Floor
            }
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
    
    // Draw Player
    const playerGridX = Math.floor(game.player.position.x / game.dungeon.cellSize);
    const playerGridY = Math.floor(game.player.position.z / game.dungeon.cellSize);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(playerGridX * cellSize + cellSize/2, playerGridY * cellSize + cellSize/2, cellSize/3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw Ladder
    if (game.ladderPosition) {
        ctx.fillStyle = '#ff0';
        ctx.fillRect(game.ladderPosition.x * cellSize + cellSize/4, game.ladderPosition.y * cellSize + cellSize/4, cellSize/2, cellSize/2);
    }
    
    // Draw Monsters
    ctx.fillStyle = '#f00';
    for (let monster of game.monsters) {
        ctx.beginPath();
        ctx.arc(monster.gridX * cellSize + cellSize/2, monster.gridY * cellSize + cellSize/2, cellSize/4, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function updateMap() {
    const mapContainer = document.getElementById('map-overlay');
    if (mapContainer && mapContainer.style.display !== 'none') {
        drawMap();
    }
}

export function updateFloatingLabels() {
    const labelsContainer = document.getElementById('floating-labels');
    if (!labelsContainer) return;
    
    // Clear existing labels
    labelsContainer.innerHTML = '';
    
    // Check for ladder proximity
    if (game.ladderPosition) {
        const playerGridX = Math.floor(game.player.position.x / game.dungeon.cellSize);
        const playerGridY = Math.floor(game.player.position.z / game.dungeon.cellSize);
        const ladderX = game.ladderPosition.x;
        const ladderY = game.ladderPosition.y;
        
        const dx = ladderX - playerGridX;
        const dy = ladderY - playerGridY;
        
        if (dx === 0 && dy === 0) {
            const label = document.createElement('div');
            label.className = 'floating-label';
            label.textContent = "Press E to Climb";
            label.style.position = 'absolute';
            label.style.left = '50%';
            label.style.top = '40%';
            label.style.transform = 'translate(-50%, -50%)';
            label.style.color = '#ffff00';
            label.style.fontSize = '24px';
            label.style.fontWeight = 'bold';
            label.style.textShadow = '0 0 5px #000';
            labelsContainer.appendChild(label);
        }
    }

    // Only show monster/item labels when Alt is pressed
    if (!game.controls.altPressed) {
        return;
    }
    
    // Add labels for visible monsters
    for (let monster of game.monsters) {
        if (isObjectVisible(monster.mesh.position)) {
            const labelPos = monster.mesh.position.clone();
            labelPos.y += 2.0; // Position above monster
            
            const screenPos = get2DPosition(labelPos);
            
            // Check if in front of camera and on screen
            if (screenPos.visible && screenPos.x >= 0 && screenPos.x <= window.innerWidth && 
                screenPos.y >= 0 && screenPos.y <= window.innerHeight) {
                const distance = Math.sqrt(
                    Math.pow(monster.mesh.position.x - game.player.position.x, 2) +
                    Math.pow(monster.mesh.position.z - game.player.position.z, 2)
                );
                
                const label = document.createElement('div');
                label.className = 'floating-label monster-label';
                label.style.left = screenPos.x + 'px';
                label.style.top = screenPos.y + 'px';
                label.textContent = `${getMonsterName(monster.type)} [${getDifficultyText(monster.difficulty)}]`;
                
                // Scale based on distance (closer = bigger)
                const scale = Math.max(0.5, Math.min(1.5, 10 / distance));
                label.style.transform = `translate(-50%, -100%) scale(${scale})`;
                
                // Fade based on distance
                const opacity = Math.max(0.5, 1 - distance / 25);
                label.style.opacity = opacity;
                
                labelsContainer.appendChild(label);
            }
        }
    }
    
    // Add labels for visible treasures
    for (let treasure of game.treasures) {
        if (!treasure.collected && isObjectVisible(treasure.mesh.position)) {
            const labelPos = treasure.mesh.position.clone();
            labelPos.y += 1.2; // Position above treasure
            
            const screenPos = get2DPosition(labelPos);
            
            // Check if in front of camera and on screen
            if (screenPos.visible && screenPos.x >= 0 && screenPos.x <= window.innerWidth && 
                screenPos.y >= 0 && screenPos.y <= window.innerHeight) {
                const distance = Math.sqrt(
                    Math.pow(treasure.mesh.position.x - game.player.position.x, 2) +
                    Math.pow(treasure.mesh.position.z - game.player.position.z, 2)
                );
                
                const label = document.createElement('div');
                label.className = 'floating-label treasure-label';
                label.style.left = screenPos.x + 'px';
                label.style.top = screenPos.y + 'px';
                const treasureName = treasure.type.name.charAt(0).toUpperCase() + treasure.type.name.slice(1);
                label.textContent = `${treasureName} (${treasure.type.value}g)`;
                
                // Scale based on distance (closer = bigger)
                const scale = Math.max(0.5, Math.min(1.5, 10 / distance));
                label.style.transform = `translate(-50%, -100%) scale(${scale})`;
                
                // Fade based on distance
                const opacity = Math.max(0.5, 1 - distance / 25);
                label.style.opacity = opacity;
                
                labelsContainer.appendChild(label);
            }
        }
    }
}

// Log a message to the screen
export function logMessage(text, type = 'normal') {
    const logElement = document.getElementById('message-log');
    if (!logElement) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = text;
    
    logElement.appendChild(entry);
    
    // Remove old messages if too many
    while (logElement.children.length > 8) {
        logElement.removeChild(logElement.firstChild);
    }
}

// Update health display
export function updateHealthDisplay() {
    const healthElement = document.getElementById('health');
    if (healthElement) {
        const healthPercent = (game.player.health / game.player.maxHealth) * 100;
        healthElement.textContent = `Health: ${game.player.health}/${game.player.maxHealth}`;
        
        // Color based on health
        if (healthPercent > 60) {
            healthElement.style.color = '#0f0';
        } else if (healthPercent > 30) {
            healthElement.style.color = '#ff0';
        } else {
            healthElement.style.color = '#f00';
        }
    }
}

// Update wealth display
export function updateWealthDisplay() {
    const wealthElement = document.getElementById('wealth');
    if (wealthElement) {
        wealthElement.textContent = `Wealth: ${game.wealth}`;
    }
}

// Game over
export function gameOver() {
    const gameOverElement = document.getElementById('game-over');
    if (gameOverElement) {
        gameOverElement.style.display = 'block';
    }
    game.player.canMove = false;
}

// Show descriptions of visible items and monsters
export function showDescriptions() {
    // This will be called each frame in the animation loop
}

// Hide descriptions
export function hideDescriptions() {
    const labelsContainer = document.getElementById('floating-labels');
    if (labelsContainer) {
        labelsContainer.innerHTML = '';
    }
}

// Update debug window
export function updateDebugWindow() {
    if (!game.controls.debugMode) return;
    
    const debugWindow = document.getElementById('debug-window');
    if (!debugWindow) return;
    
    let html = '<div class="debug-title">DEBUG INFO</div>';
    
    // Player info
    html += '<div class="debug-section">PLAYER:</div>';
    html += `<div class="debug-item">Position: (${game.player.position.x.toFixed(1)}, ${game.player.position.z.toFixed(1)})</div>`;
    html += `<div class="debug-item">Rotation Y: ${game.player.rotation.y.toFixed(2)} rad</div>`;
    html += `<div class="debug-item">Facing: ${game.player.facing} (${['North', 'East', 'South', 'West'][game.player.facing]})</div>`;
    html += `<div class="debug-item">Grid: (${Math.floor(game.player.position.x / game.dungeon.cellSize)}, ${Math.floor(game.player.position.z / game.dungeon.cellSize)})</div>`;
    
    // Visible monsters
    html += '<div class="debug-section">MONSTERS:</div>';
    html += `<div class="debug-item">Total Alive: ${game.monsters.length}</div>`;
    let monsterCount = 0;
    for (let monster of game.monsters) {
        const dx = monster.mesh.position.x - game.player.position.x;
        const dz = monster.mesh.position.z - game.player.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const angleToObject = Math.atan2(dx, dz);
        const playerAngle = game.player.rotation.y;
        let angleDiff = angleToObject - playerAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const visInfo = isObjectVisibleDebug(monster.mesh.position);
        
        if (distance < 15) { // Show nearby monsters
            html += `<div class="debug-item" style="color: ${visInfo.visible ? '#0f0' : '#f00'}">` +
                `${getMonsterName(monster.type)}: ` +
                `dx=${dx.toFixed(1)}, dz=${dz.toFixed(1)}, ` +
                `dist=${distance.toFixed(1)}, ` +
                `diff=${angleDiff.toFixed(2)}, ` +
                `aggro=${monster.isAggro ? 'YES' : 'NO'}, ` +
                `[${visInfo.reason}]</div>`;
            if (visInfo.visible) monsterCount++;
        }
    }
    html += `<div class="debug-item">Visible: ${monsterCount}</div>`;
    
    // Visible treasures
    html += '<div class="debug-section">TREASURES:</div>';
    let treasureCount = 0;
    for (let treasure of game.treasures) {
        if (treasure.collected) continue;
        
        const dx = treasure.mesh.position.x - game.player.position.x;
        const dz = treasure.mesh.position.z - game.player.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const angleToObject = Math.atan2(dx, dz);
        const playerAngle = game.player.rotation.y;
        let angleDiff = angleToObject - playerAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const visInfo = isObjectVisibleDebug(treasure.mesh.position);
        
        if (distance < 15) { // Show nearby treasures
            const treasureName = treasure.type.name.charAt(0).toUpperCase() + treasure.type.name.slice(1);
            html += `<div class="debug-item" style="color: ${visInfo.visible ? '#0f0' : '#f00'}">` +
                `${treasureName}: ` +
                `dx=${dx.toFixed(1)}, dz=${dz.toFixed(1)}, ` +
                `dist=${distance.toFixed(1)}, ` +
                `diff=${angleDiff.toFixed(2)}, ` +
                `[${visInfo.reason}]</div>`;
            if (visInfo.visible) treasureCount++;
        }
    }
    html += `<div class="debug-item">Visible: ${treasureCount}</div>`;
    
    // Decorations info
    html += '<div class="debug-section">DECORATIONS:</div>';
    const inscriptionCount = game.decorations.filter(d => 
        (d.type && d.type.name === 'wall_inscription') || d.type === 'wall_inscription'
    ).length;
    const bloodStainCount = game.decorations.filter(d => d.type === 'blood_stain').length;
    html += `<div class="debug-item">Total Inscriptions: ${inscriptionCount}</div>`;
    html += `<div class="debug-item">Blood Stains: ${bloodStainCount}</div>`;
    html += `<div class="debug-item">Total Decorations: ${game.decorations.length}</div>`;
    
    debugWindow.innerHTML = html;
}



export function updateDebugArrows() {
    for (let decoration of game.decorations) {
        if (decoration.debugArrow) {
            decoration.debugArrow.visible = game.controls.shiftPressed;
        }
    }
}

// Journal UI
export function toggleJournal() {
    const journalOverlay = document.getElementById('journal-overlay');
    
    if (journalOverlay.style.display === 'flex') {
        journalOverlay.style.display = 'none';
        game.player.canMove = true;
        game.paused = false;
    } else {
        updateJournalUI();
        journalOverlay.style.display = 'flex';
        game.player.canMove = false;
        game.paused = true;
    }
}

export function updateJournalUI() {
    const contentDiv = document.getElementById('journal-content');
    if (!contentDiv) return;
    
    // Sort collected pages by Date/Title
    let visibleEntries = [];
    if (game.cheatMode) {
        visibleEntries = [...JOURNAL_ENTRIES];
    } else {
        visibleEntries = JOURNAL_ENTRIES.filter(e => game.journal.collectedPages.includes(e.id));
    }
    
    // Sort logic: "Day X" -> X, "Last Words" -> 9999
    visibleEntries.sort((a, b) => {
        const getDay = (title) => {
            const match = title.match(/Day (-?\d+)/);
            if (match) return parseInt(match[1]);
            if (title.includes("Last Words")) return 9999;
            return 0; 
        };
        return getDay(a.title) - getDay(b.title);
    });
    
    if (visibleEntries.length === 0) {
        contentDiv.innerHTML = '<p style="text-align: center; font-style: italic; color: #888;">No pages found yet...</p>';
        return;
    }
    
    let html = '';
    
    // If cheat mode, maybe show a small indicator?
    if (game.cheatMode) {
        html += '<p style="text-align: center; color: #a44; font-size: 12px; margin-bottom: 20px;">[CHEAT MODE: ALL PAGES REVEALED]</p>';
    }
    
    for (const entry of visibleEntries) {
        const id = entry.id; // Used for deterministic seeding
        if (entry) {
            let decor = '';
            
            // Deterministic random for visuals based on ID
            const seed = id * 123.45;
            
            // Paper Rotation
            const rotation = (Math.sin(seed * 1.5) * 2).toFixed(1); // -2 to 2 deg
            
            // Paper Type
            const types = ['scrap-light', 'scrap-dark', 'scrap-worn'];
            const typeIndex = Math.floor(Math.abs(Math.sin(seed * 99)) * 3);
            const paperClass = types[typeIndex % 3];
            
            // Generate ragged edge clip-path
             // We want a polygon that is mostly a rectangle but has jittery edges
             // Polygon points: 
             // TL -> TR (jittering y)
             // TR -> BR (jittering x)
             // BR -> BL (jittering y)
             // BL -> TL (jittering x)
             
            // Simplified: just a few points to make it look torn
            const jitter = () => (Math.random() * 2 - 1).toFixed(1);
            // We use seed randomness
            const seededRandom = (s) => {
                const x = Math.sin(s) * 10000;
                return x - Math.floor(x);
            };
            
            let clipPoints = [];
            // Top edge (0% y)
            for(let i=0; i<=100; i+=5) {
                clipPoints.push(`${i}% ${0 + seededRandom(seed + i)*3}%`);
            }
            // Right edge (100% x)
            for(let i=0; i<=100; i+=5) {
                clipPoints.push(`${100 - seededRandom(seed + i + 200)*2}% ${i}%`);
            }
            // Bottom edge (100% y)
            for(let i=100; i>=0; i-=5) {
                clipPoints.push(`${i}% ${100 - seededRandom(seed + i + 400)*3}%`);
            }
            // Left edge (0% x)
            for(let i=100; i>=0; i-=5) {
                clipPoints.push(`${0 + seededRandom(seed + i + 600)*2}% ${i}%`);
            }
            
            const clipPath = `polygon(${clipPoints.join(',')})`;

            // Water Stains
            const hasWaterStain = (seededRandom(seed) > 0.5);
            if (hasWaterStain) {
                const left = 10 + seededRandom(seed * 2) * 80;
                const top = 10 + seededRandom(seed * 3) * 80;
                const size = 30 + seededRandom(seed * 4) * 50;
                decor += `<div class="water-stain" style="top: ${top}%; left: ${left}%; width: ${size}px; height: ${size}px;"></div>`;
            }
            
            // Blood Stains (Contextual)
            const hasBloodStain = entry.title.toLowerCase().includes('blood') || entry.title.toLowerCase().includes('death') || entry.title.toLowerCase().includes('madness');
            
            if (hasBloodStain) {
                const left = 80 + Math.sin(seed) * 10;
                const top = 10 + Math.cos(seed) * 10;
                decor += `<div class="blood-stain" style="top: ${top}%; left: ${left}%; width: 40px; height: 50px;"></div>`;
                // Splatters
                for(let i=0; i<3; i++) {
                     decor += `<div class="blood-splatter" style="top: ${top + Math.random()*40}%; left: ${left + Math.random()*30}%; width: ${3+Math.random()*4}px; height: ${3+Math.random()*4}px;"></div>`;
                }
            }
            
            // Holes
            const hasHole = seededRandom(seed + 50) > 0.7;
            if (hasHole) {
                 const left = 20 + seededRandom(seed * 5) * 60;
                 const top = 20 + seededRandom(seed * 6) * 60;
                 const size = 10 + seededRandom(seed * 7) * 15;
                 decor += `<div class="paper-hole" style="top: ${top}%; left: ${left}%; width: ${size}px; height: ${size}px;"></div>`;
            }
            
            // Burn Marks (Randomly on edges)
            const hasBurn = seededRandom(seed + 80) > 0.8;
            if (hasBurn) {
                 const isTop = seededRandom(seed) > 0.5;
                 const left = seededRandom(seed * 9) * 100;
                 const top = isTop ? -5 : 95;
                 decor += `<div class="burn-mark" style="top: ${top}%; left: ${left}%; width: 60px; height: 60px;"></div>`;
            }

            html += `
                <div class="journal-scrap ${paperClass}" style="transform: rotate(${rotation}deg); clip-path: ${clipPath}; -webkit-clip-path: ${clipPath};">
                    ${decor}
                    <h3 class="journal-title">${entry.title}</h3>
                    <p class="journal-text">${entry.text}</p>
                </div>
            `;
        }
    }
    
    contentDiv.innerHTML = html;
}

export function collectJournalPage(id) {
    if (!game.journal.collectedPages.includes(id)) {
        game.journal.collectedPages.push(id);
        logMessage("You found a journal page! Press 'J' to read.", "item");
        
        // Flash journal prompt
        const prompt = document.createElement('div');
        prompt.textContent = "New Journal Entry (Press J)";
        prompt.style.position = 'fixed';
        prompt.style.top = '20%';
        prompt.style.left = '50%';
        prompt.style.transform = 'translate(-50%, -50%)';
        prompt.style.color = '#ffeda0';
        prompt.style.fontSize = '24px';
        prompt.style.fontWeight = 'bold';
        prompt.style.textShadow = '0 0 10px #000';
        prompt.style.pointerEvents = 'none';
        prompt.style.zIndex = '1500';
        prompt.style.opacity = '0';
        prompt.style.transition = 'opacity 0.5s';
        
        document.body.appendChild(prompt);
        
        // Fade in
        requestAnimationFrame(() => prompt.style.opacity = '1');
        
        // Fade out
        setTimeout(() => {
            prompt.style.opacity = '0';
            setTimeout(() => document.body.removeChild(prompt), 500);
        }, 3000);
    }
}

export function initSettings() {
    const menu = document.getElementById('settings-menu');
    const brightnessSlider = document.getElementById('brightness-slider');
    const contrastSlider = document.getElementById('contrast-slider');
    const distanceSlider = document.getElementById('distance-slider');
    
    const exposureSlider = document.getElementById('exposure-slider');
    const autoExposureToggle = document.getElementById('auto-exposure-toggle');
    
    const ambientSlider = document.getElementById('ambient-slider');
    
    const torchBrightSlider = document.getElementById('torch-bright-slider');
    const torchRangeSlider = document.getElementById('torch-range-slider');
    
    const fireflyBrightSlider = document.getElementById('firefly-bright-slider');
    const fireflyRangeSlider = document.getElementById('firefly-range-slider');
    
    const shroomBrightSlider = document.getElementById('shroom-bright-slider');
    const shroomRangeSlider = document.getElementById('shroom-range-slider');
    
    const mossBrightSlider = document.getElementById('moss-bright-slider');
    const mossRangeSlider = document.getElementById('moss-range-slider');
    
    const brightnessVal = document.getElementById('brightness-val');
    const contrastVal = document.getElementById('contrast-val');
    const distanceVal = document.getElementById('distance-val');
    const exposureVal = document.getElementById('exposure-val');
    
    const ambientVal = document.getElementById('ambient-val');
    const ambientToggle = document.getElementById('ambient-toggle');
    
    const torchBrightVal = document.getElementById('torch-bright-val');
    const torchRangeVal = document.getElementById('torch-range-val');
    
    const fireflyBrightVal = document.getElementById('firefly-bright-val');
    const fireflyRangeVal = document.getElementById('firefly-range-val');
    
    const shroomBrightVal = document.getElementById('shroom-bright-val');
    const shroomRangeVal = document.getElementById('shroom-range-val');
    
    const mossBrightVal = document.getElementById('moss-bright-val');
    const mossRangeVal = document.getElementById('moss-range-val');
    
    const torchToggle = document.getElementById('torch-toggle');
    const fireflyToggle = document.getElementById('firefly-toggle');
    const shroomToggle = document.getElementById('shroom-toggle');
    const mossToggle = document.getElementById('moss-toggle');

    const resetButton = document.getElementById('reset-settings');
    
    if (!menu) return;

    // Initialize game settings object
    game.lightSettings = {
        // [Existing props]
        ambient: { intensity: 0.0, enabled: true },
        playerTorch: { intensity: 3.0, distance: 24, enabled: true },
        firefly: { intensity: 2.5, distance: 8.0, enabled: true },
        mushrooms: { intensity: 1.5, distance: 10, enabled: true },
        moss: { intensity: 0.5, distance: 5.0, enabled: true }
    };
    
    // Initialize Turn Mode Setting
    game.settings = game.settings || {};
    game.settings.turnMode = 'turnbased'; // Default to turn-based

    // Add Turn Mode UI dynamically
    const generalSettingsDiv = document.createElement('div');
    generalSettingsDiv.className = 'settings-row';
    generalSettingsDiv.style.marginBottom = '15px';
    generalSettingsDiv.innerHTML = `
        <div class="slider-container compact" style="width: 100%; flex-direction: column; align-items: flex-start;">
            <label style="margin-bottom: 5px; color: #ffeb3b;">Turn Mode</label>
            <div class="radio-group">
                <label class="radio-label">
                    <input type="radio" name="turn-mode" value="realtime">
                    <span class="radio-checkmark"></span>
                    Real-Time
                </label>
                <label class="radio-label">
                    <input type="radio" name="turn-mode" value="turnbased">
                    <span class="radio-checkmark"></span>
                    Turn-Based
                </label>
            </div>
        </div>
    `;
    
    // Insert BEFORE Visual Settings header
    const visualHeader = menu.querySelector('h2');
    if (visualHeader) {
        // Create Gameplay Settings Header
        const gameplayHeader = document.createElement('h2');
        gameplayHeader.textContent = "Gameplay Settings";
        
        // Insert Header then Content BEFORE the Visual Settings header
        menu.insertBefore(gameplayHeader, visualHeader);
        menu.insertBefore(generalSettingsDiv, visualHeader);
    }

    const modeRadios = document.getElementsByName('turn-mode');
    for(const radio of modeRadios) {
        if (radio.value === game.settings.turnMode) {
            radio.checked = true;
        }
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                game.settings.turnMode = e.target.value;
                console.log("Turn Mode changed to:", game.settings.turnMode);
                // Defocus
                e.target.blur();
            }
        });
    }

    // Set initial values from saved state (if we had saving)
    
    game.exposureSettings = {
        auto: true,
        level: 1.0
    };

    const updateVisuals = () => {
        const b = brightnessSlider.value;
        const c = contrastSlider.value;
        const d = distanceSlider.value;
        
        brightnessVal.textContent = b;
        contrastVal.textContent = c;
        distanceVal.textContent = d;
        
        // Apply CSS filters for brightness/contrast
        const appliedBrightness = b * 2.0;
        const appliedContrast = c * 1.1;
        
        if (game.renderer && game.renderer.domElement) {
            game.renderer.domElement.style.filter = `brightness(${appliedBrightness}) contrast(${appliedContrast})`;
        }
        
        // Apply fog distance
        if (game.scene && game.scene.fog) {
            game.scene.fog.far = parseFloat(d);
        }
        
        // Update Exposure Settings
        game.exposureSettings.auto = autoExposureToggle.checked;
        game.exposureSettings.level = parseFloat(exposureSlider.value);
        exposureVal.textContent = game.exposureSettings.level;
        
        // Visual feedback for disabled state
        exposureSlider.disabled = game.exposureSettings.auto;
        exposureSlider.parentElement.style.opacity = game.exposureSettings.auto ? '0.5' : '1.0';
    };
    
    const updateLights = () => {
        // Ambient
        game.lightSettings.ambient.intensity = parseFloat(ambientSlider.value);
        game.lightSettings.ambient.enabled = ambientToggle.checked;
        
        const effectiveAmbient = game.lightSettings.ambient.enabled ? game.lightSettings.ambient.intensity : 0;
        
        ambientVal.textContent = game.lightSettings.ambient.intensity;
        if (game.ambientLight) {
            game.ambientLight.intensity = effectiveAmbient;
        }
        
        // Player Torch
        game.lightSettings.playerTorch.intensity = parseFloat(torchBrightSlider.value);
        game.lightSettings.playerTorch.distance = parseFloat(torchRangeSlider.value);
        game.lightSettings.playerTorch.enabled = torchToggle.checked;
        torchBrightVal.textContent = game.lightSettings.playerTorch.intensity;
        torchRangeVal.textContent = game.lightSettings.playerTorch.distance;
        
        // Fireflies
        game.lightSettings.firefly.intensity = parseFloat(fireflyBrightSlider.value);
        game.lightSettings.firefly.distance = parseFloat(fireflyRangeSlider.value);
        game.lightSettings.firefly.enabled = fireflyToggle.checked;
        fireflyBrightVal.textContent = game.lightSettings.firefly.intensity;
        fireflyRangeVal.textContent = game.lightSettings.firefly.distance;
        
        // Mushrooms
        game.lightSettings.mushrooms.intensity = parseFloat(shroomBrightSlider.value);
        game.lightSettings.mushrooms.distance = parseFloat(shroomRangeSlider.value);
        game.lightSettings.mushrooms.enabled = shroomToggle.checked;
        shroomBrightVal.textContent = game.lightSettings.mushrooms.intensity;
        shroomRangeVal.textContent = game.lightSettings.mushrooms.distance;
        
        // Moss
        game.lightSettings.moss.intensity = parseFloat(mossBrightSlider.value);
        game.lightSettings.moss.distance = parseFloat(mossRangeSlider.value);
        game.lightSettings.moss.enabled = mossToggle.checked;
        mossBrightVal.textContent = game.lightSettings.moss.intensity;
        mossRangeVal.textContent = game.lightSettings.moss.distance;
        
        // Flag that lights need updating
        game.needsLightUpdate = true;
    };

    brightnessSlider.addEventListener('input', updateVisuals);
    contrastSlider.addEventListener('input', updateVisuals);
    distanceSlider.addEventListener('input', updateVisuals);
    
    exposureSlider.addEventListener('input', updateVisuals);
    autoExposureToggle.addEventListener('change', updateVisuals);
    
    ambientSlider.addEventListener('input', updateLights);
    ambientToggle.addEventListener('change', updateLights);
    
    torchBrightSlider.addEventListener('input', updateLights);
    torchRangeSlider.addEventListener('input', updateLights);
    
    fireflyBrightSlider.addEventListener('input', updateLights);
    fireflyRangeSlider.addEventListener('input', updateLights);
    
    shroomBrightSlider.addEventListener('input', updateLights);
    shroomRangeSlider.addEventListener('input', updateLights);
    
    mossBrightSlider.addEventListener('input', updateLights);
    mossRangeSlider.addEventListener('input', updateLights);
    
    torchToggle.addEventListener('change', updateLights);
    fireflyToggle.addEventListener('change', updateLights);
    shroomToggle.addEventListener('change', updateLights);
    mossToggle.addEventListener('change', updateLights);
    
    // Double click to reset
    const addReset = (slider, value, updateFn) => {
        slider.addEventListener('dblclick', () => {
            slider.value = value;
            updateFn();
        });
    };

    addReset(brightnessSlider, 1.0, updateVisuals);
    addReset(contrastSlider, 1.0, updateVisuals);
    addReset(distanceSlider, 40, updateVisuals);
    
    addReset(exposureSlider, 1.0, updateVisuals);
    
    addReset(ambientSlider, 0.0, updateLights);
    
    addReset(torchBrightSlider, 2.0, updateLights);
    addReset(torchRangeSlider, 18, updateLights);
    
    addReset(fireflyBrightSlider, 2.5, updateLights);
    addReset(fireflyRangeSlider, 8.0, updateLights);
    
    addReset(shroomBrightSlider, 1.5, updateLights);
    addReset(shroomRangeSlider, 10, updateLights);
    
    addReset(mossBrightSlider, 0.5, updateLights);
    addReset(mossRangeSlider, 5.0, updateLights);
    
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            brightnessSlider.value = 1.0;
            contrastSlider.value = 1.0;
            distanceSlider.value = 40;
            
            exposureSlider.value = 1.0;
            autoExposureToggle.checked = true;
            
            ambientSlider.value = 0.0;
            ambientToggle.checked = true;
            
            torchBrightSlider.value = 2.0;
            torchRangeSlider.value = 18;
            
            fireflyBrightSlider.value = 2.5;
            fireflyRangeSlider.value = 8.0;
            
            shroomBrightSlider.value = 1.5;
            shroomRangeSlider.value = 10;
            
            mossBrightSlider.value = 0.5;
            mossRangeSlider.value = 5.0;
            
            torchToggle.checked = true;
            fireflyToggle.checked = true;
            shroomToggle.checked = true;
            mossToggle.checked = true;
            
            updateVisuals();
            updateLights();
        });
    }
    
    // Apply initial settings
    updateVisuals();
    updateLights();
}

export function toggleSettings() {
    const menu = document.getElementById('settings-menu');
    if (menu) {
        if (menu.style.display === 'none') {
            menu.style.display = 'block';
            // Sync slider with current fog if needed
            if (game.scene && game.scene.fog) {
                const distanceSlider = document.getElementById('distance-slider');
                if (distanceSlider) {
                     distanceSlider.value = game.scene.fog.far;
                     const valDisplay = document.getElementById('distance-val');
                     if (valDisplay) valDisplay.textContent = Math.round(game.scene.fog.far);
                }
            }
        } else {
            menu.style.display = 'none';
        }
    }
}

export function toggleManual() {
    const manual = document.getElementById('manual-screen');
    if (manual) {
        if (manual.style.display === 'none') {
            manual.style.display = 'block';
        } else {
            manual.style.display = 'none';
        }
    }
}

export function updateLevelName(name) {
    const el = document.getElementById('current-level-name');
    if (el) {
        el.textContent = name;
    }
}

// Update madness display
export function updateMadnessDisplay() {
    const madnessElement = document.getElementById('madness');
    if (madnessElement) {
        if (game.player.madness > 0 || game.player.hasAmulet) {
             madnessElement.style.display = 'block';
             const curMadness = game.player.madness || 0;
             madnessElement.textContent = `Madness: ${curMadness}/100`;
             
             // Color shift from subtle to intense
             const intensity = Math.min(100, curMadness) / 100;
             // rgb(200, 100, 200) -> rgb(150, 0, 255)
             const r = Math.floor(200 - 50 * intensity);
             const g = Math.floor(100 - 100 * intensity);
             const b = Math.floor(200 + 55 * intensity);
             madnessElement.style.color = `rgb(${r}, ${g}, ${b})`;
             
             if (curMadness > 80) {
                 madnessElement.style.fontWeight = 'bold';
                 madnessElement.style.textShadow = '0 0 5px #f0f';
             } else {
                 madnessElement.style.fontWeight = 'normal';
                 madnessElement.style.textShadow = 'none';
             }
        } else {
             madnessElement.style.display = 'none';
        }
    }
}
