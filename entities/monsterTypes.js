export const MONSTER_TYPES = {
    SKELETON: 'skeleton',
    SPIDER: 'spider',
    JELLY: 'jelly',
    RAT: 'rat',
    GHOST: 'ghost',
    PLANT: 'plant',
    BAT: 'bat',
    SALAMANDER: 'salamander',
    GOBLIN: 'goblin',
    CUBE: 'cube',
    ORC: 'orc',
    BANDIT: 'bandit',
    WRAITH: 'wraith',
    MIMIC: 'mimic',
    GARGOYLE: 'gargoyle',
    IMP: 'imp',
    TROLL: 'troll',
    SLIME: 'slime',
    ZOMBIE: 'zombie',
    SERPENT: 'serpent',
    MUSHROOM: 'mushroom',
    EYE_BEAST: 'eye_beast',
    SCARAB: 'scarab',
    SHADOW: 'shadow',
    CULTIST: 'cultist',
    MINER: 'miner'
};

// Aggressiveness values: 0.0 (passive) to 2.0 (very aggressive)
export const MONSTER_AGGRESSIVENESS = {
    [MONSTER_TYPES.RAT]: 0.6,           // Timid
    [MONSTER_TYPES.BAT]: 0.8,           // Somewhat timid
    [MONSTER_TYPES.SPIDER]: 1.0,        // Neutral
    [MONSTER_TYPES.JELLY]: 0.5,         // Slow to react
    [MONSTER_TYPES.CUBE]: 0.4,          // Very slow to react
    [MONSTER_TYPES.SLIME]: 0.5,         // Slow to react
    [MONSTER_TYPES.SKELETON]: 1.2,      // Aggressive
    [MONSTER_TYPES.ZOMBIE]: 1.3,        // Aggressive
    [MONSTER_TYPES.GOBLIN]: 1.4,        // Very aggressive
    [MONSTER_TYPES.ORC]: 1.6,           // Very aggressive
    [MONSTER_TYPES.TROLL]: 1.5,         // Very aggressive
    [MONSTER_TYPES.GHOST]: 1.1,         // Moderately aggressive
    [MONSTER_TYPES.WRAITH]: 1.4,        // Very aggressive
    [MONSTER_TYPES.SHADOW]: 1.3,        // Aggressive
    [MONSTER_TYPES.PLANT]: 0.3,         // Very passive (stationary)
    [MONSTER_TYPES.MUSHROOM]: 0.4,      // Very passive
    [MONSTER_TYPES.SALAMANDER]: 1.0,    // Neutral
    [MONSTER_TYPES.BANDIT]: 1.5,        // Very aggressive
    [MONSTER_TYPES.CULTIST]: 1.6,       // Very aggressive
    [MONSTER_TYPES.MIMIC]: 1.8,         // Extremely aggressive (when revealed)
    [MONSTER_TYPES.GARGOYLE]: 1.3,      // Aggressive
    [MONSTER_TYPES.IMP]: 1.5,           // Very aggressive
    [MONSTER_TYPES.SERPENT]: 1.4,       // Very aggressive
    [MONSTER_TYPES.EYE_BEAST]: 1.2,     // Aggressive
    [MONSTER_TYPES.SCARAB]: 1.1,        // Moderately aggressive
    [MONSTER_TYPES.MINER]: 0.7,         // Somewhat timid (confused, not hostile)
};

