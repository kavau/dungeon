import { game, dungeonMap } from './state.js';
import { logMessage, updateLevelName, updateHealthDisplay, updateMadnessDisplay } from './ui.js';
import { updateAmuletEffects } from './player.js';
import { spawnSingleMonster, spawnMonsters, createMonster, MONSTER_TYPES } from './entities/monster.js';
import { generateDungeon, spawnDoors, createStartingInscription, generateProceduralMap, clearDungeon, spawnLadder } from './dungeon.js';
import { spawnTreasures, createTreasure, TREASURE_TYPES } from './entities/items.js';
import { spawnDecorations, spawnFireflies, createDecoration, DECORATION_TYPES } from './entities/decoration.js';
import { spawnWaterCreatures } from './entities/waterCreatures.js';
import { LEVEL_CONFIG } from './levelConfig.js';

export function setupLevel() {
    // Set player starting position (find first open space)
    const cellSize = game.dungeon.cellSize;
    const level = game.dungeon.level || 1;
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
    
    updateLevelName(config.title || `Level ${level}`);

    // Spawn doors FIRST. They occupy grid cells (mark as 4) and we must avoid them
    spawnDoors();

    let px, py;
    let facing = 1; // Default East
    
    if (config.setup) {
        const result = config.setup(game, dungeonMap, { 
            createDecoration, DECORATION_TYPES, 
            createMonster, MONSTER_TYPES,
            createTreasure, TREASURE_TYPES
        });
        px = result.x;
        py = result.y;
        facing = result.facing;
    } else {
        // Normal random spawn for other levels
        let attempts = 0;
        do {
            px = Math.floor(Math.random() * game.dungeon.width);
            py = Math.floor(Math.random() * game.dungeon.height);
            attempts++;
        } while (dungeonMap[py][px] !== 0 && attempts < 1000);
        
        // Fallback if random fails
        if (dungeonMap[py][px] !== 0) {
            for(let y=0; y<game.dungeon.height; y++) {
                for(let x=0; x<game.dungeon.width; x++) {
                    if(dungeonMap[y][x] === 0) {
                        px = x;
                        py = y;
                        break;
                    }
                }
            }
        }
    }
    
    game.player.position.x = px * cellSize + cellSize / 2;
    game.player.position.z = py * cellSize + cellSize / 2;
    
    // Set initial rotation
    game.player.facing = facing;
    if (facing === 0) {
        game.player.rotation.y = 0; // North
    } else {
        game.player.rotation.y = -Math.PI / 2; // East
    }
    
    game.player.targetPosition.copy(game.player.position);
    game.player.startRotation = game.player.rotation.y;
    game.player.targetRotation = game.player.rotation.y;
    game.camera.position.copy(game.player.position);
    
    // Create special inscription on wall in front of player
    createStartingInscription(px, py, cellSize);

    // [spawnDoors moved to top]

    // Spawn monsters (should check for doors now)
    spawnMonsters();
    
    // Spawn treasures
    spawnTreasures();
    
    // Spawn ladder to next level (creates hole in ceiling, must be before decorations)
    spawnLadder();

    // Spawn decorations (respects doors and existing decorations)
    spawnDecorations();
    
    // Spawn fireflies
    spawnFireflies();

    // Spawn water creatures (fish, jellyfish)
    spawnWaterCreatures();
    
    if (game.started) {
        const theme = config; // config has name, title, description
        
        const titleEl = document.getElementById('level-title');
        const descEl = document.getElementById('level-desc');
        const screenEl = document.getElementById('level-screen');
        
        if (titleEl && descEl && screenEl) {
            console.log("Showing level screen for: " + theme.title);
            titleEl.textContent = theme.title;
            descEl.textContent = theme.description;
            screenEl.style.display = 'flex';
            game.showingLevelScreen = true;
            game.levelScreenShownTime = Date.now();
        } else {
            console.error("Level screen elements not found!");
        }
    } else {
        console.log("Game not started yet, skipping level screen");
        logMessage(`Welcome to Level ${game.dungeon.level}`);
    }
}

export function nextLevel() {
    if (game.isTransitioning) return;
    game.isTransitioning = true;

    console.log(`Current Level: ${game.dungeon.level}. Descending...`);
    game.dungeon.level--;
    console.log(`New Level: ${game.dungeon.level}`);
    
    if (game.dungeon.level < 1) {
        // Win condition
        console.log("Win condition met!");
        document.getElementById('win-screen').style.display = 'flex';
        game.won = true;
        return;
    }
    
    logMessage(`Descending to Level ${game.dungeon.level}...`);
    
    // Clear current level
    clearDungeon();
    
    // Generate new level
    generateProceduralMap();
    generateDungeon();
    
    setupLevel();
    
    // Small delay before allowing next transition
    setTimeout(() => {
        game.isTransitioning = false;
    }, 1000);
}

export function teleportToLevel(level) {
    logMessage(`Teleporting to Level ${level}...`, "combat");
    game.dungeon.level = level;
    
    // Clear current level
    clearDungeon();
    
    // Generate new level
    generateProceduralMap();
    generateDungeon();
    
    setupLevel();
}

export function checkCollision(position) {
    const playerRadius = 0.3;
    const cellSize = game.dungeon.cellSize;
    
    // Grid-based wall collision (O(1))
    // Check the cell the player is in, and neighbors if close to edge
    const minX = Math.floor((position.x - playerRadius) / cellSize);
    const maxX = Math.floor((position.x + playerRadius) / cellSize);
    const minZ = Math.floor((position.z - playerRadius) / cellSize);
    const maxZ = Math.floor((position.z + playerRadius) / cellSize);
    
    for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
            // Check bounds
            if (z >= 0 && z < game.dungeon.height && x >= 0 && x < game.dungeon.width) {
                const cellType = dungeonMap[z][x];
                // 1 = Wall, 2 = Water/Pit
                if (cellType === 1 || cellType === 2) {
                    // Precise AABB check against this wall/water cell
                    const wallX = x * cellSize + cellSize / 2;
                    const wallZ = z * cellSize + cellSize / 2;
                    const halfSize = cellSize / 2;
                    
                    if (Math.abs(position.x - wallX) < (halfSize + playerRadius) &&
                        Math.abs(position.z - wallZ) < (halfSize + playerRadius)) {
                        if (cellType === 2) return 'water';
                        return 'wall';
                    }
                }
            }
        }
    }
    
    // Check door collisions (only if door is closed)
    const playerGridX = Math.floor(position.x / cellSize);
    const playerGridZ = Math.floor(position.z / cellSize);
    
    for (let door of game.doors) {
        if (!door.isOpen && door.gridX === playerGridX && door.gridY === playerGridZ) {
            return 'door';
        }
    }
    
    // Check monster collisions
    for (let monster of game.monsters) {
        // Check if player is trying to move into the same grid cell as a monster
        if (playerGridX === monster.gridX && playerGridZ === monster.gridY) {
            return 'monster';
        }
        
        // Also check actual distance for smoother collision
        const dx = position.x - monster.mesh.position.x;
        const dz = position.z - monster.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const minDistance = 0.8; // Monster collision radius
        
        if (distance < minDistance) {
            return 'monster';
        }
    }
    
    return null;
}

// Update player movement
export function advanceTurn() {
    // Amulet Regeneration & Madness
    if (game.player.amuletActive) {
        if (game.player.health < game.player.maxHealth) {
            game.player.health = Math.min(game.player.maxHealth, game.player.health + 1);
            updateHealthDisplay();
            
            // Madness ONLY increases when healing occurs
            game.player.madness = (game.player.madness || 0) + 1;
            updateMadnessDisplay();
            updateAmuletEffects(); // Update fog intensity
            
            const m = game.player.madness;

            // Threshold Effects
            if (m === 20) {
                logMessage("The amulet feels uncomfortably warm against your chest.", "madness");
            } else if (m === 50) {
                logMessage("You hear faint whispers echoing in your mind...", "madness");
            } else if (m === 80) {
                logMessage("THE WHISPERS ARE SCREAMING.", "madness");
                const flash = document.getElementById('damage-flash');
                if (flash) {
                    flash.style.backgroundColor = 'rgba(100, 0, 200, 0.3)';
                    flash.style.opacity = 1;
                    setTimeout(() => flash.style.opacity = 0, 500);
                }
            } else if (m >= 100) {
                handleMadnessSubmission();
                return; // Stop processing turn
            }
        }
        
        // Random Madness Flavor (Chance scales with madness)
        // Occurs whenever amulet is active, regardless of healing
        const m = game.player.madness || 0;
        const whisperChance = (m > 20) ? (m / 400) : 0; // 5% at 20, 25% at 100
        
        if (Math.random() < whisperChance) {
            const whispers = [
                "The shadows are watching you...",
                "You hear the singing of lost souls.",
                "The walls are breathing.",
                "Something slithers in the darkness.",
                "Give in...",
                "They are waiting for you.",
                "Your light offends them.",
                "The amulet needs to feed.",
                "Look behind you...",
                "It's too late."
            ];
            logMessage(whispers[Math.floor(Math.random() * whispers.length)], "madness");
        }
        
        // Attraction (Spawns spectral enemies)
        if (m > 30) {
            const level = game.dungeon.level || 1;
            // Higher chance in spiritual levels (3=Temple, 4=Catacombs, 5=Caves/Deep)
            const isSpiritual = [3, 4, 5].includes(level);
            
            // Base chance: 0.5% at 30, up to 2.5% at 100
            let attractionChance = (m - 30) / 3500; 
            
            if (isSpiritual) attractionChance *= 2; // Double chance in spiritual areas
            
            if (Math.random() < attractionChance) {
                spawnSpectralEntity();
            }
        }
    }

    if (!game.player.torch) return;
    
    game.player.torch.turnsActive++;
    const t = game.player.torch;
    
    // Initialize fade factor if not present
    if (t.fadeFactor === undefined) t.fadeFactor = 1.0;
    
    if (t.turnsActive > t.maxTurns) {
        // Calculate how far into the fade we are (0.0 to 1.0)
        const fadeProgress = (t.turnsActive - t.maxTurns) / t.fadeTurns;
        
        if (fadeProgress >= 1.0) {
            // Torch burned out completely
            if (game.player.light.visible) {
                t.fadeFactor = 0.0;
                game.player.light.visible = false;
                logMessage('Your torch has burned out!', 'torch');
            }
        } else {
            // Gradual fading
            // Factor goes from 1.0 to 0.0
            t.fadeFactor = 1.0 - fadeProgress;
            
            // Color shifts from Orange (ffaa00) to Red (ff0000)
            const r = 1.0;
            const g = 0.66 * (1.0 - fadeProgress); // 0.66 is approx 0xaa / 0xff
            const b = 0;
            
            t.color.setRGB(r, g, b);
            game.player.light.color.copy(t.color);
            
            // Notify user when fading starts
            if (t.turnsActive === t.maxTurns + 1) {
                logMessage('Your torch is flickering and fading...', 'torch');
            }
        }
    } else {
        t.fadeFactor = 1.0;
    }
}

export function checkAndSpawnMonsters() {
    const minMonsters = 15; // Minimum number of monsters to maintain
    const maxMonsters = 24; // Maximum number of monsters
    
    if (game.monsters.length < minMonsters) {
        // Spawn multiple monsters to bring count back up
        const toSpawn = Math.min(maxMonsters - game.monsters.length, 5);
        for (let i = 0; i < toSpawn; i++) {
            spawnSingleMonster();
        }
    }
}



export function updateSceneLights() {
    if (!game.lightSettings) return;
    
    // Only update if settings changed or if it's the first run (undefined)
    if (game.needsLightUpdate === false) return;

    // 1. Decorations (Mushrooms, Moss)
    if (game.decorations) {
        for (let d of game.decorations) {
            if (d.mesh && d.mesh.userData.light) {
                const light = d.mesh.userData.light;
                
                // Initialize base values if needed
                if (light.userData.baseIntensity === undefined) light.userData.baseIntensity = light.intensity;
                if (light.userData.baseDistance === undefined) light.userData.baseDistance = light.distance;
                
                // Apply settings based on type
                let settings = null;
                
                // Check type name safely
                const typeName = d.type ? d.type.name : (d.mesh.userData.decorationType || '');
                
                if (typeName === 'mushrooms') {
                    settings = game.lightSettings.mushrooms;
                } else if (typeName === 'moss_patch') {
                    settings = game.lightSettings.moss;
                }
                
                if (settings) {
                    const isEnabled = settings.enabled !== false;
                    const intensity = isEnabled ? settings.intensity : 0;
                    const distance = isEnabled ? settings.distance : 0;

                    light.intensity = intensity;
                    light.distance = distance;
                    
                    // Update material glow (emissive intensity)
                    // Default intensities: Mushrooms ~1.5, Moss ~0.5
                    let defaultIntensity = 1.0;
                    if (typeName === 'mushrooms') defaultIntensity = 1.5;
                    else if (typeName === 'moss_patch') defaultIntensity = 0.5;
                    
                    const glowFactor = intensity / defaultIntensity;
                    
                    d.mesh.traverse((child) => {
                        if (child.isMesh && child.material && child.material.emissive) {
                            // Store base emissive intensity if not present
                            if (child.userData.baseEmissiveIntensity === undefined) {
                                child.userData.baseEmissiveIntensity = child.material.emissiveIntensity;
                            }
                            child.material.emissiveIntensity = child.userData.baseEmissiveIntensity * glowFactor;
                        }
                    });
                }
            }
        }
    }
    
    // 2. Fireflies
    if (game.critters) {
        const settings = game.lightSettings.firefly;
        if (settings) {
            const isEnabled = settings.enabled !== false;
            const intensity = isEnabled ? settings.intensity : 0;
            const distance = isEnabled ? settings.distance : 0;

            const defaultIntensity = 2.5;
            const glowFactor = intensity / defaultIntensity;
            
            for (let critter of game.critters) {
                if (critter.mesh) {
                    critter.mesh.traverse((child) => {
                        if (child.isLight) {
                            child.intensity = intensity;
                            child.distance = distance;
                        } else if (child.isMesh && child.material) {
                            // Update glow for Basic materials (Fireflies)
                            // Store base color if not present
                            if (child.userData.baseColor === undefined) {
                                child.userData.baseColor = child.material.color.clone();
                            }
                            // Scale color brightness
                            child.material.color.copy(child.userData.baseColor).multiplyScalar(Math.max(0, glowFactor));
                        }
                    });
                }
            }
        }
    }

    // 3. Monsters & Treasures (Keep default behavior or ignore)
    // We don't have sliders for these, so we leave them alone.
    
    // Reset flag
    game.needsLightUpdate = false;
}

export function handleMadnessSubmission() {
    logMessage("You lose control. The darkness consumes you.", "monster-die");
    
    // Fade to black
    const intro = document.getElementById('intro-screen');
    if (intro) {
        intro.style.display = 'flex';
        intro.style.backgroundColor = 'black'; // Ensure black
        intro.innerHTML = '<h1>Consumed</h1><p>The amulet has claimed your mind.</p>';
        
        setTimeout(() => {
            // Respawn at Level 5 start
            game.player.amuletActive = false;
            game.player.madness = 0;
            
            // Restore UI
            intro.style.display = 'none';
            // Restore Intro Content
            intro.innerHTML = `<h1>Awakening</h1>
            <p>You wake up in a cold, damp darkness. A throbbing pain pulses in your skull...</p>
            <p class="press-key">Press any key to begin</p>`;
            
            // Teleport
            teleportToLevel(5);
            logMessage("You wake up... again.", "door");
            
            // Restore visual fog if needed (teleport usually handles setupLevel which resets fog based on theme)
            // But we need to ensure amuletActive didn't leave purple fog
            // teleportToLevel calls setupLevel which sets fog from config
            
        }, 3000);
    }
}

function spawnSpectralEntity() {
    const spectralTypes = [MONSTER_TYPES.GHOST, MONSTER_TYPES.WRAITH, MONSTER_TYPES.SHADOW];
    const type = spectralTypes[Math.floor(Math.random() * spectralTypes.length)];
    
    // Attempt to spawn near player
    const px = Math.floor(game.player.position.x / game.dungeon.cellSize);
    const py = Math.floor(game.player.position.z / game.dungeon.cellSize);
    
    let spawned = false;
    let attempts = 0;
    
    while (!spawned && attempts < 10) {
        // Random spot 3-7 tiles away
        const angle = Math.random() * Math.PI * 2;
        const dist = 3 + Math.random() * 4;
        const tx = Math.floor(px + Math.cos(angle) * dist);
        const ty = Math.floor(py + Math.sin(angle) * dist);
        
        if (tx >= 1 && tx < game.dungeon.width - 1 && ty >= 1 && ty < game.dungeon.height - 1) {
            if (dungeonMap[ty][tx] === 0) { // Floor
               // Check if occupied by monster
               const occupied = game.monsters.some(m => Math.floor(m.position.x/game.dungeon.cellSize) === tx && Math.floor(m.position.z/game.dungeon.cellSize) === ty);
               
               if (!occupied) {
                   createMonster(tx, ty, type);
                   logMessage("The amulet beckons from the void...", "madness");
                   logMessage(`A ${type} manifests nearby!`, "combat");
                   spawned = true;
               }
            }
        }
        attempts++;
    }
}
