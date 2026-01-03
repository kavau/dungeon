import { game, dungeonMap } from '../state.js';
import { logMessage, updateWealthDisplay } from '../ui.js';
import { createTreasureVisuals } from '../visuals/itemRenderer.js';
import { LEVEL_CONFIG } from '../levelConfig.js';

export const TREASURE_TYPES = {
    CHEST: { name: 'chest', value: 100, color: 0x8B4513 },
    GOLD_COIN: { name: 'coin', value: 10, color: 0xFFD700 },
    GEM: { name: 'gem', value: 50, color: 0x00FFFF },
    TRINKET: { name: 'trinket', value: 25, color: 0xFF69B4 },
    TORCH: { name: 'torch', value: 0, color: 0xffaa00 }
};

export function createTreasure(gridX, gridY, type) {
    const cellSize = game.dungeon.cellSize;
    
    const treasureGroup = createTreasureVisuals(type);

    treasureGroup.position.x = gridX * cellSize + cellSize / 2;
    treasureGroup.position.y = 0.3;
    treasureGroup.position.z = gridY * cellSize + cellSize / 2;
    
    game.scene.add(treasureGroup);
    
    // Treasure data
    const treasure = {
        type: type,
        mesh: treasureGroup,
        gridX: gridX,
        gridY: gridY,
        collected: false,
        rotation: Math.random() * Math.PI * 2
    };
    
    game.treasures.push(treasure);
}

export { createTorch } from '../visuals/itemRenderer.js';

// Update treasures (animation and pickup)
export function updateTreasures(deltaTime) {
    for (let i = game.treasures.length - 1; i >= 0; i--) {
        const treasure = game.treasures[i];
        
        if (treasure.collected) continue;
        
        // Rotate and bob
        treasure.rotation += deltaTime * 2;
        treasure.mesh.rotation.y = treasure.rotation;
        treasure.mesh.position.y = 0.3 + Math.sin(treasure.rotation * 2) * 0.1;
        
        // Check if player is on the same grid square
        const playerGridX = Math.floor(game.player.position.x / game.dungeon.cellSize);
        const playerGridZ = Math.floor(game.player.position.z / game.dungeon.cellSize);
        
        if (playerGridX === treasure.gridX && playerGridZ === treasure.gridY) {
            // Collect treasure
            collectTreasure(treasure, i);
        }
    }
}

// Collect a treasure
export function collectTreasure(treasure, index) {
    treasure.collected = true;
    
    if (treasure.type.name === 'torch') {
        game.player.torch.turnsActive = 0; // Reset torch
        game.player.torch.intensityBase = 2.0; // Reset intensity (was 1.0)
        game.player.torch.rangeBase = 18; // Reset range (was 15)
        
        // Reset color
        game.player.torch.color.setHex(0xffaa00);
        game.player.light.color.setHex(0xffaa00);
        
        game.player.light.visible = true;
        logMessage(`You picked up a fresh torch! Your light is renewed.`, 'torch');
    } else {
        game.wealth += treasure.type.value;
        logMessage(`You picked up a ${treasure.type.name} worth ${treasure.type.value} gold!`, 'item');
        updateWealthDisplay();
    }

    // Play collection animation
    const startY = treasure.mesh.position.y;
    let animTime = 0;
    const animDuration = 0.3;
    
    const collectAnim = setInterval(() => {
        animTime += 0.016;
        const progress = animTime / animDuration;
        
        if (progress >= 1.0) {
            game.scene.remove(treasure.mesh);
            game.treasures.splice(index, 1);
            clearInterval(collectAnim);
        } else {
            treasure.mesh.position.y = startY + progress * 2;
            treasure.mesh.scale.setScalar(1 - progress);
        }
    }, 16);
    
    updateWealthDisplay();
}
export function spawnTreasures() {
    const cellSize = game.dungeon.cellSize;
    const numTreasures = 15;
    let spawned = 0;
    
    const types = Object.values(TREASURE_TYPES);
    
    // Try to spawn treasures in random walkable spaces
    for (let attempt = 0; attempt < 100 && spawned < numTreasures; attempt++) {
        const x = Math.floor(Math.random() * game.dungeon.width);
        const y = Math.floor(Math.random() * game.dungeon.height);
        
        // Check if space is walkable and not too close to player
        if (dungeonMap[y][x] === 0) {
            const worldX = x * cellSize + cellSize / 2;
            const worldZ = y * cellSize + cellSize / 2;
            const distToPlayer = Math.sqrt(
                Math.pow(worldX - game.player.position.x, 2) +
                Math.pow(worldZ - game.player.position.z, 2)
            );
            
            // Don't spawn too close to player
            if (distToPlayer > cellSize * 3) {
                // Weighted random selection based on level
                const rand = Math.random();
                let treasureType;
                const level = game.dungeon.level || 1;
                const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
                const probs = config.items;

                if (rand < probs.chest) {
                    treasureType = TREASURE_TYPES.CHEST;
                } else if (rand < probs.coin) {
                    treasureType = TREASURE_TYPES.GOLD_COIN;
                } else if (rand < probs.trinket) {
                    treasureType = TREASURE_TYPES.TRINKET;
                } else {
                    treasureType = TREASURE_TYPES.GEM;
                }
                
                createTreasure(x, y, treasureType);
                spawned++;
            }
        }
    }
}

