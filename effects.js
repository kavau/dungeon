import { game } from './state.js';
import { MONSTER_TYPES } from './entities/monster.js';
import { createBloodStainVisuals } from './visuals/effectsRenderer.js';

// Check if a monster type should leave blood stains
export function monsterShouldBleed(monsterType) {
    // Living creatures with blood
    const bleedingMonsters = [
        MONSTER_TYPES.RAT,
        MONSTER_TYPES.BAT,
        MONSTER_TYPES.SALAMANDER,
        MONSTER_TYPES.GOBLIN,
        MONSTER_TYPES.ORC,
        MONSTER_TYPES.BANDIT,
        MONSTER_TYPES.TROLL,
        MONSTER_TYPES.ZOMBIE, // Zombies still have some blood
        MONSTER_TYPES.SERPENT,
        MONSTER_TYPES.EYE_BEAST,
        MONSTER_TYPES.SPIDER, // Spiders have hemolymph but can leave stains
        MONSTER_TYPES.IMP, // Demons have blood
        MONSTER_TYPES.CULTIST,
        MONSTER_TYPES.MINER
    ];
    
    return bleedingMonsters.includes(monsterType);
}

// Get blood stain size multiplier based on monster size
export function getMonsterBloodSize(monsterType) {
    // Small creatures (0.5x - 0.8x)
    const smallCreatures = [MONSTER_TYPES.RAT, MONSTER_TYPES.BAT, MONSTER_TYPES.SALAMANDER, MONSTER_TYPES.IMP];
    // Medium creatures (1.0x - default)
    const mediumCreatures = [MONSTER_TYPES.GOBLIN, MONSTER_TYPES.BANDIT, MONSTER_TYPES.SPIDER, MONSTER_TYPES.ZOMBIE];
    // Large creatures (1.5x - 2.0x)
    const largeCreatures = [MONSTER_TYPES.ORC, MONSTER_TYPES.SERPENT, MONSTER_TYPES.EYE_BEAST];
    // Huge creatures (2.5x - 3.0x)
    const hugeCreatures = [MONSTER_TYPES.TROLL];
    
    if (smallCreatures.includes(monsterType)) {
        return 0.8 + Math.random() * 0.4; // 0.8-1.2x
    } else if (mediumCreatures.includes(monsterType)) {
        return 1.2 + Math.random() * 0.4; // 1.2-1.6x
    } else if (largeCreatures.includes(monsterType)) {
        return 2.0 + Math.random() * 0.8; // 2.0-2.8x
    } else if (hugeCreatures.includes(monsterType)) {
        return 3.5 + Math.random() * 1.0; // 3.5-4.5x
    }
    return 1.5; // Default
}

export function createBloodStain(worldX, worldZ, sizeMultiplier = 1.0) {
    const visuals = createBloodStainVisuals(
        worldX, 
        worldZ, 
        sizeMultiplier, 
        game.dungeon.cellSize, 
        game.dungeon.grid, 
        game.dungeon.gridWidth, 
        game.dungeon.gridHeight
    );
    
    if (visuals.floorStain) {
        game.scene.add(visuals.floorStain);
        game.decorations.push({
            mesh: visuals.floorStain,
            type: 'blood_stain'
        });
    }
    
    if (visuals.wallStain) {
        game.scene.add(visuals.wallStain);
        game.decorations.push({
            mesh: visuals.wallStain,
            type: 'blood_stain'
        });
    }
}
