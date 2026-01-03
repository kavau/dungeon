import { game, dungeonMap } from './state.js';
import { logMessage } from './ui.js';
import { spawnSingleMonster, spawnMonsters } from './entities/monster.js';
import { generateDungeon, spawnDoors, createStartingInscription, generateProceduralMap, clearDungeon, spawnLadder } from './dungeon.js';
import { spawnTreasures } from './entities/items.js';
import { spawnDecorations, spawnGlowWorms, createDecoration, DECORATION_TYPES } from './entities/decoration.js';
import { LEVEL_CONFIG } from './levelConfig.js';

export function setupLevel() {
    // Set player starting position (find first open space)
    const cellSize = game.dungeon.cellSize;
    const level = game.dungeon.level || 1;
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
    
    let px, py;
    let facing = 1; // Default East
    
    if (config.setup) {
        const result = config.setup(game, dungeonMap, { createDecoration, DECORATION_TYPES });
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
    
    // Spawn monsters
    spawnMonsters();
    
    // Spawn treasures
    spawnTreasures();
    
    // Spawn doors first (they block all decorations)
    spawnDoors();
    
    // Spawn decorations (respects doors and existing decorations)
    spawnDecorations();
    
    // Spawn glow worms
    spawnGlowWorms();
    
    // Spawn ladder to next level
    spawnLadder();
    
    if (game.started) {
        const theme = config; // config has name, title, description
        
        const titleEl = document.getElementById('level-title');
        const descEl = document.getElementById('level-desc');
        const screenEl = document.getElementById('level-screen');
        
        if (titleEl && descEl && screenEl) {
            titleEl.textContent = theme.title;
            descEl.textContent = theme.description;
            screenEl.style.display = 'flex';
            game.showingLevelScreen = true;
        }
    } else {
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
    
    // Check wall collisions
    for (let wall of game.dungeon.walls) {
        const dx = position.x - wall.position.x;
        const dz = position.z - wall.position.z;
        
        // Use wall width/height (assuming square walls for now based on cellSize)
        // wall.width is cellSize
        const halfSize = wall.width / 2;
        const minDistance = halfSize + playerRadius;
        
        // AABB collision check (Axis-Aligned Bounding Box)
        if (Math.abs(dx) < minDistance && Math.abs(dz) < minDistance) {
            return 'wall';
        }
    }
    
    // Check door collisions (only if door is closed)
    const cellSize = game.dungeon.cellSize;
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
    if (!game.player.torch) return;
    
    game.player.torch.turnsActive++;
    const t = game.player.torch;
    
    // Constants for full brightness
    const MAX_INTENSITY = 2.0;
    const MAX_RANGE = 18;
    
    if (t.turnsActive > t.maxTurns) {
        // Calculate how far into the fade we are (0.0 to 1.0)
        const fadeProgress = (t.turnsActive - t.maxTurns) / t.fadeTurns;
        
        if (fadeProgress >= 1.0) {
            // Torch burned out completely
            if (game.player.light.visible) {
                t.intensityBase = 0;
                t.rangeBase = 0;
                game.player.light.visible = false;
                logMessage('Your torch has burned out!', 'torch');
            }
        } else {
            // Gradual fading
            // Intensity goes from MAX to 0
            t.intensityBase = MAX_INTENSITY * (1.0 - fadeProgress);
            
            // Range goes from MAX to 5 (not 0, so you can still see a little bit until it dies)
            t.rangeBase = 5 + (MAX_RANGE - 5) * (1.0 - fadeProgress);
            
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
