// Test Chamber Generator
// Creates a simple, customizable environment for testing features
import { game, dungeonMap } from './state.js';
import { createMonster, MONSTER_TYPES } from './entities/monster.js';

export function generateTestChamber() {
    console.log("Generating Test Chamber");
    // Interior 7x7 requires 9x9 total (walls on outside)
    const width = 9;
    const height = 9;
    game.dungeon.width = width;
    game.dungeon.height = height;

    // Clear map
    dungeonMap.length = 0;
    for(let y=0; y<height; y++) {
        dungeonMap.push(new Array(width).fill(1));
    }

    // Hollow out 7x7 center (indices 1 to 7)
    for(let y=1; y<height-1; y++) {
        for(let x=1; x<width-1; x++) {
            dungeonMap[y][x] = 0;
        }
    }

    // Spawn one of each level 5 monster for testing
    // Place them spaced out in the chamber
    const testMonsters = [
        { type: MONSTER_TYPES.SALAMANDER, pos: [2, 2] },
        { type: MONSTER_TYPES.TROLL, pos: [6, 2] },
        { type: MONSTER_TYPES.MUSHROOM, pos: [2, 6] },
        { type: MONSTER_TYPES.IMP, pos: [6, 6] },
        { type: MONSTER_TYPES.SERPENT, pos: [4, 4] },
        { type: MONSTER_TYPES.GOBLIN, pos: [4, 2] }
    ];
    for (const m of testMonsters) {
        createMonster(m.pos[0], m.pos[1], m.type);
    }
}
