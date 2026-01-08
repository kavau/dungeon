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

    // Spawn one mimic for testing
    createMonster(4, 3, MONSTER_TYPES.MIMIC);
}
