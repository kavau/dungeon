// Test Chamber Generator
// Creates a simple, customizable environment for testing features
import { game, dungeonMap } from './state.js';
import { createMonster, MONSTER_TYPES } from './entities/monster.js';

export function generateTestChamber() {
    console.log("Generating Test Chamber");
    // Interior 5x5 requires 7x7 total (walls on outside)
    const width = 7;
    const height = 7;
    game.dungeon.width = width;
    game.dungeon.height = height;
    
    // Clear map
    dungeonMap.length = 0;
    for(let y=0; y<height; y++) {
        dungeonMap.push(new Array(width).fill(1));
    }
    
    // Hollow out 5x5 center (indices 1 to 5)
    for(let y=1; y<height-1; y++) {
        for(let x=1; x<width-1; x++) {
            dungeonMap[y][x] = 0;
        }
    }

    // Spawn two monsters
    // Player is at (3,3) in gameLoop but revised to (2,2) in previous turn? 
    // Let's check where the player spawns. 
    // Previous turn: gameLoop.js updated to spawn at 2,2.
    // So (2,2) is center of 5x5 interior?
    // Map is 7x7 (0-6). Walls at 0 and 6. Interior is 1-5.
    // Center is (3,3). 
    // Wait, the previous turn set player to (2,2). 
    // If the room is 1-5, (2,2) is upper-leftish from center (3,3).
    // Let's place monsters at (4,2) and (2,4) to be somewhat away.
    
    // Actually, createMonster checks dungeonMap for valid position, so we must ensure map is set first.
    // It is set above.
    
    // Using simple types for now
    createMonster(4, 2, MONSTER_TYPES.GOBLIN);
    createMonster(2, 4, MONSTER_TYPES.SKELETON);
}
