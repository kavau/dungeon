import { game, dungeonMap } from './state.js';
import { 
    getDifficultyText, 
    isObjectVisible, 
    isObjectVisibleDebug, 
    get2DPosition 
} from './utils.js';
import { getMonsterName, MONSTER_TYPES } from './entities/monster.js';

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
    
    const wormBrightSlider = document.getElementById('worm-bright-slider');
    const wormRangeSlider = document.getElementById('worm-range-slider');
    
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
    
    const wormBrightVal = document.getElementById('worm-bright-val');
    const wormRangeVal = document.getElementById('worm-range-val');
    
    const shroomBrightVal = document.getElementById('shroom-bright-val');
    const shroomRangeVal = document.getElementById('shroom-range-val');
    
    const mossBrightVal = document.getElementById('moss-bright-val');
    const mossRangeVal = document.getElementById('moss-range-val');
    
    const torchToggle = document.getElementById('torch-toggle');
    const wormToggle = document.getElementById('worm-toggle');
    const shroomToggle = document.getElementById('shroom-toggle');
    const mossToggle = document.getElementById('moss-toggle');

    const resetButton = document.getElementById('reset-settings');
    
    if (!menu) return;

    // Initialize game settings object
    game.lightSettings = {
        ambient: { intensity: 0.0, enabled: true },
        playerTorch: { intensity: 2.0, distance: 18, enabled: true },
        glowWorm: { intensity: 2.5, distance: 8.0, enabled: true },
        mushrooms: { intensity: 1.5, distance: 10, enabled: true },
        moss: { intensity: 0.5, distance: 5.0, enabled: true }
    };
    
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
        
        // Glow Worms
        game.lightSettings.glowWorm.intensity = parseFloat(wormBrightSlider.value);
        game.lightSettings.glowWorm.distance = parseFloat(wormRangeSlider.value);
        game.lightSettings.glowWorm.enabled = wormToggle.checked;
        wormBrightVal.textContent = game.lightSettings.glowWorm.intensity;
        wormRangeVal.textContent = game.lightSettings.glowWorm.distance;
        
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
    
    wormBrightSlider.addEventListener('input', updateLights);
    wormRangeSlider.addEventListener('input', updateLights);
    
    shroomBrightSlider.addEventListener('input', updateLights);
    shroomRangeSlider.addEventListener('input', updateLights);
    
    mossBrightSlider.addEventListener('input', updateLights);
    mossRangeSlider.addEventListener('input', updateLights);
    
    torchToggle.addEventListener('change', updateLights);
    wormToggle.addEventListener('change', updateLights);
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
    
    addReset(wormBrightSlider, 2.5, updateLights);
    addReset(wormRangeSlider, 8.0, updateLights);
    
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
            
            wormBrightSlider.value = 2.5;
            wormRangeSlider.value = 8.0;
            
            shroomBrightSlider.value = 1.5;
            shroomRangeSlider.value = 10;
            
            mossBrightSlider.value = 0.5;
            mossRangeSlider.value = 5.0;
            
            torchToggle.checked = true;
            wormToggle.checked = true;
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
