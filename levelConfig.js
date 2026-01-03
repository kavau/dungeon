
export const LEVEL_CONFIG = {
    1: {
        name: 'ruins',
        title: 'The Ruins',
        description: 'You are close to the surface. Roots break through the cracked stone walls. A faint breeze carries the scent of fresh air... and danger.',
        theme: {
            wallBase: { r: 74, g: 63, b: 53 }, // Brownish grey
            floorBase: '#2a2a2a',
            floorTile: 42,
            ceilingBase: '#4a4a4a',
            mossy: true,
            algorithm: 'rooms',
            fogColor: 0x000000,
            fogDist: 30
        },
        monsters: [
            'rat', 'bat', 'spider', 'bandit', 'plant', 'skeleton'
        ],
        items: {
            chest: 0.15,
            coin: 0.50, // Cumulative
            trinket: 0.75 // Cumulative
        },
        decorations: [
            'moss_patch', 'puddle', 'spider_web', 'bone_pile'
        ]
    },
    2: {
        name: 'sewers',
        title: 'The Sewers',
        description: 'The stench is overpowering. Green slime coats the walls and floor. You can hear the skittering of unseen creatures in the dark.',
        theme: {
            wallBase: { r: 40, g: 50, b: 40 }, // Dark green/grey
            floorBase: '#1a2a1a',
            floorTile: '#2a3a2a',
            ceilingBase: '#1a2a1a',
            mossy: true,
            algorithm: 'corridors',
            fogColor: 0x051005, // Very dark green
            fogDist: 25
        },
        monsters: [
            'rat', 'slime', 'jelly', 'serpent', 'zombie'
        ],
        items: {
            chest: 0.10,
            coin: 0.30,
            trinket: 0.80
        },
        decorations: [
            'puddle', 'moss_patch', 'spider_web'
        ]
    },
    3: {
        name: 'temple',
        title: 'The Sunken Temple',
        description: 'Golden ornaments glint in the shadows. This place was once holy, but now only echoes of dark rituals remain.',
        theme: {
            wallBase: { r: 180, g: 160, b: 120 }, // Sandstone
            floorBase: '#5a4a3a',
            floorTile: '#8a7a6a',
            ceilingBase: '#6a5a4a',
            mossy: false,
            algorithm: 'bsp',
            fogColor: 0x2a2010, // Dark gold/brown
            fogDist: 40
        },
        monsters: [
            'cultist', 'gargoyle', 'imp', 'mimic', 'eye_beast', 'wraith'
        ],
        items: {
            chest: 0.25,
            coin: 0.60,
            trinket: 0.70
        },
        decorations: [
            'wall_inscription', 'bone_pile', 'spider_web'
        ]
    },
    4: {
        name: 'catacombs',
        title: 'The Catacombs',
        description: 'Rows of silent tombs line the walls. The air is dry and smells of dust and decay. You feel like you are being watched.',
        theme: {
            wallBase: { r: 60, g: 60, b: 60 }, // Dark grey
            floorBase: '#202020',
            floorTile: '#303030',
            ceilingBase: '#202020',
            mossy: false,
            algorithm: 'maze',
            fogColor: 0x101010,
            fogDist: 20 // Claustrophobic
        },
        monsters: [
            'skeleton', 'zombie', 'ghost', 'wraith', 'shadow', 'miner'
        ],
        items: {
            chest: 0.15,
            coin: 0.35,
            trinket: 0.65
        },
        decorations: [
            'bone_pile', 'wall_inscription', 'spider_web', 'moss_patch'
        ]
    },
    5: {
        name: 'caves',
        title: 'The Deep Caves',
        description: 'The air is thick with moisture and the smell of ancient earth. Bioluminescent fungi provide the only light in this natural labyrinth.',
        theme: {
            wallBase: { r: 50, g: 45, b: 40 }, // Natural rock
            floorBase: '#2a2520',
            floorTile: '#3a3530',
            ceilingBase: '#2a2520',
            mossy: false,
            algorithm: 'cellular',
            fogColor: 0x000000,
            fogDist: 25
        },
        monsters: [
            'bat', 'salamander', 'troll', 'mushroom', 'scarab', 'cube'
        ],
        items: {
            chest: 0.05,
            coin: 0.20,
            trinket: 0.40
        },
        decorations: [
            'stalactite', 'stalagmite', 'mushrooms', 'puddle'
        ],
        setup: (game, dungeonMap, helpers) => {
            const { createDecoration, DECORATION_TYPES } = helpers;
            const cellSize = game.dungeon.cellSize;
            
            // Special setup for Level 5 (The Awakening)
            // Place Wyrm in the center of the cavern
            const wx = Math.floor(game.dungeon.width / 2);
            const wy = Math.floor(game.dungeon.height / 2);

            // Spawn Wyrm
            createDecoration(wx, wy, DECORATION_TYPES.WYRM_CARCASS);
            
            // Spawn Dead Adventurers around it
            const adventurerOffsets = [
                {x: 2, y: 1}, {x: -2, y: -1}, 
                {x: 1, y: -2}, {x: -1, y: 2},
                {x: 3, y: 0}, {x: -3, y: 0},
                {x: 0, y: 3}, {x: 0, y: -3}
            ];
            
            for (let offset of adventurerOffsets) {
                const ax = wx + offset.x;
                const ay = wy + offset.y;
                if (ax >= 0 && ax < game.dungeon.width && ay >= 0 && ay < game.dungeon.height) {
                    if (dungeonMap[ay][ax] === 0) {
                        createDecoration(ax, ay, DECORATION_TYPES.DEAD_ADVENTURER);
                    }
                }
            }
            
            // Place player south of the Wyrm
            let px = wx;
            let py = wy + 5;
            
            // Ensure player spot is valid
            if (dungeonMap[py][px] !== 0) {
                 let found = false;
                 for(let r=1; r<5; r++) {
                     for(let dx=-r; dx<=r; dx++) {
                         for(let dy=-r; dy<=r; dy++) {
                             if(dungeonMap[wy+dy][wx+dx] === 0) {
                                 px = wx+dx;
                                 py = wy+dy;
                                 found = true;
                                 break;
                             }
                         }
                         if(found) break;
                     }
                     if(found) break;
                 }
            }
            
            return { x: px, y: py, facing: 0 }; // 0 is North
        }
    }
};
