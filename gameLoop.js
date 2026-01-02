import { game, dungeonMap } from './state.js';
import { logMessage } from './ui.js';
import { spawnSingleMonster } from './entities/monster.js';

export function checkCollision(position) {
    const playerRadius = 0.3;
    
    // Check wall collisions
    for (let wall of game.dungeon.walls) {
        const dx = position.x - wall.position.x;
        const dz = position.z - wall.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const minDistance = wall.size / 2 + playerRadius;
        
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
