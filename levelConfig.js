
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
        ],
        setup: (game, dungeonMap, { createMonster, MONSTER_TYPES }) => {
            let px, py;
            let attempts = 0;
            let found = false;
            let mx, my;
            
            // Simple Bresenham's Line Algorithm for LOS check
            const hasLineOfSight = (x0, y0, x1, y1) => {
                let dx = Math.abs(x1 - x0);
                let dy = Math.abs(y1 - y0);
                let sx = (x0 < x1) ? 1 : -1;
                let sy = (y0 < y1) ? 1 : -1;
                let err = dx - dy;
                
                let x = x0;
                let y = y0;
                
                while (true) {
                    if (dungeonMap[y][x] !== 0) return false; // Blocked
                    if (x === x1 && y === y1) break;
                    let e2 = 2 * err;
                    if (e2 > -dy) { err -= dy; x += sx; }
                    if (e2 < dx) { err += dx; y += sy; }
                }
                return true;
            };
    
            // Find a spot for player and a monster nearby (3-6 tiles away)
            while (!found && attempts < 5000) {
                px = Math.floor(Math.random() * game.dungeon.width);
                py = Math.floor(Math.random() * game.dungeon.height);
                
                if (dungeonMap[py][px] === 0) {
                    // Try to find a valid monster spot nearby
                    // Check random spots in a 3-6 radius
                    for (let i = 0; i < 20; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 3 + Math.random() * 3; // 3 to 6
                        const tx = Math.floor(px + Math.cos(angle) * dist);
                        const ty = Math.floor(py + Math.sin(angle) * dist);
                        
                        if (tx >= 1 && tx < game.dungeon.width - 1 && 
                            ty >= 1 && ty < game.dungeon.height - 1 && 
                            dungeonMap[ty][tx] === 0) {
                            
                            if (hasLineOfSight(px, py, tx, ty)) {
                                mx = tx;
                                my = ty;
                                found = true;
                                break;
                            }
                        }
                    }
                }
                attempts++;
            }
            
            if (found) {
                // Spawn the guide monster
                // Use SKELETON as it naturally carries a torch
                createMonster(mx, my, MONSTER_TYPES.SKELETON);
                
                // Ensure it has a torch (just in case)
                const monster = game.monsters[game.monsters.length - 1];
                if (monster) {
                    monster.hasTorch = true;
                    // Make it not aggressive initially so the player sees it? 
                    // User didn't ask for that, just "carrying a torch".
                    // But "spawned very near" might mean immediate combat.
                    // "Guide monster" implies it might lead somewhere or just be visible.
                    // I'll leave AI as is.
                }
                
                console.log("Spawned torch-bearing monster at", mx, my);
            } else {
                // Fallback
                 do {
                    px = Math.floor(Math.random() * game.dungeon.width);
                    py = Math.floor(Math.random() * game.dungeon.height);
                } while (dungeonMap[py][px] !== 0);
            }
    
            return { x: px, y: py, facing: 1 };
        }
    },
    5: {
        name: 'caves',
        title: 'The Deep Caves',
        description: 'The air is thick with moisture. A massive underground lake dominates the cavern, dark waters reflecting the pale bioluminescence of fungi.',
        theme: {
            wallBase: { r: 50, g: 45, b: 40 }, // Natural rock
            floorBase: '#2a2520',
            floorTile: '#3a3530',
            ceilingBase: '#2a2520',
            mossy: false,
            noTiles: true, // Natural cave look
            algorithm: 'cellular',
            fogColor: 0x000000, // Pitch black background
            fogDist: 40, // Increased visibility
            ambientLight: 0x113333, // Dim bioluminescent glow
            ambientIntensity: 0.3
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
            'stalactite', 'stalagmite', 'mushrooms', 'puddle', 'moss_patch'
        ],
        decorationProbabilities: {
            mushrooms: 0.15, // Much more common
            moss_patch: 0.15, // Abundant glow moss
            stalactite: 0.10,
            stalagmite: 0.10,
            puddle: 0.08
        },
        mapGeneration: (map, width, height) => {
            // Create a large underground lake in the North-East corner
            const lakeCenterX = width - 12; // Adjusted for better centering
            const lakeCenterY = 12;
            const lakeRadius = 9.0;
            const islandRadius = 3.0;

            // 1. Create the Lake (Water = 2)
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const dx = x - lakeCenterX;
                    const dy = y - lakeCenterY;
                    const distSq = dx*dx + dy*dy;
                    
                    // Create irregular lake shape
                    if (distSq < lakeRadius*lakeRadius + (Math.random() * 10)) {
                        map[y][x] = 2; // Water
                    }
                }
            }

            // 2. Create the Island (Land = 0)
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const dx = x - lakeCenterX;
                    const dy = y - lakeCenterY;
                    const distSq = dx*dx + dy*dy;
                    
                    if (distSq < islandRadius*islandRadius) {
                        map[y][x] = 0; // Land
                    }
                }
            }

            // 3. Create Natural Bridges (Land = 0)
            // Bridge to West (Safe approach)
            for (let x = lakeCenterX - Math.floor(lakeRadius) - 2; x < lakeCenterX; x++) {
                if (x > 0 && x < width) map[lakeCenterY][x] = 0;
                if (x > 0 && x < width && Math.random() > 0.5) map[lakeCenterY+1][x] = 0; // Widen randomly
            }
        },
        setup: (game, dungeonMap, helpers) => {
            const { createDecoration, DECORATION_TYPES } = helpers;
            const cellSize = game.dungeon.cellSize;
            
            // Special setup for Level 5 (The Awakening)
            // Place Wyrm in the center of the Island (North-East)
            const wx = game.dungeon.width - 12;
            const wy = 12;

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
            
            // Place player on the bridge (West of the Wyrm)
            let px = wx - 5;
            let py = wy;
            
            // Ensure player spot is valid
            if (dungeonMap[py][px] !== 0) {
                 // Search for valid spot nearby
                 let found = false;
                 for(let r=1; r<10; r++) {
                     for(let dx=-r; dx<=r; dx++) {
                         for(let dy=-r; dy<=r; dy++) {
                             const tx = px+dx;
                             const ty = py+dy;
                             if (tx>=0 && tx<game.dungeon.width && ty>=0 && ty<game.dungeon.height) {
                                 if(dungeonMap[ty][tx] === 0) {
                                     px = tx;
                                     py = ty;
                                     found = true;
                                     break;
                                 }
                             }
                         }
                         if(found) break;
                     }
                     if(found) break;
                 }
            }
            
            return { x: px, y: py, facing: 1 }; // 1 is East (Facing the Wyrm)
        }
    }
};
