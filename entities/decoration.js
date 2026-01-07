import { game, dungeonMap } from '../state.js';
import { createDecorationVisuals } from '../visuals/decorationRenderer.js';
import { LEVEL_CONFIG } from '../levelConfig.js';
import { createBloodStain } from '../effects.js';

export const DECORATION_TYPES = {
    PUDDLE: { name: 'puddle', probability: 0.05 },
    SPIDER_WEB: { name: 'spider_web', probability: 0.05 },
    STALACTITE: { name: 'stalactite', probability: 0.04 },
    STALAGMITE: { name: 'stalagmite', probability: 0.04 },
    BONE_PILE: { name: 'bone_pile', probability: 0.03 },
    MUSHROOMS: { name: 'mushrooms', probability: 0.03 },
    MOSS_PATCH: { name: 'moss_patch', probability: 0.04 },
    WALL_INSCRIPTION: { name: 'wall_inscription', probability: 0.02 },
    WYRM_CARCASS: { name: 'wyrm_carcass', probability: 0 }, // Special, spawned manually
    DEAD_ADVENTURER: { name: 'dead_adventurer', probability: 0 }, // Special
    LADDER: { name: 'ladder', probability: 0 } // Special
};

export function createDecoration(gridX, gridY, type) {
    const cellSize = game.dungeon.cellSize;
    const worldX = gridX * cellSize + cellSize / 2;
    const worldZ = gridY * cellSize + cellSize / 2;

    const result = createDecorationVisuals(type, gridX, gridY);
    
    if (result.isInscription) {
        game.decorations.push(result.data);
        return;
    }

    const decorationGroup = result.mesh;
    decorationGroup.position.x = worldX;
    decorationGroup.position.z = worldZ;
    game.scene.add(decorationGroup);

    const decoration = {
        type: type,
        mesh: decorationGroup,
        gridX: gridX,
        gridY: gridY,
        debugArrow: result.debugArrow
    };
    
    game.decorations.push(decoration);
    
    // Add blood for dead adventurers
    if (type.name === 'dead_adventurer') {
         createBloodStain(worldX, worldZ, 2.5); // Large pool for the large skeleton
    } else if (type.name === 'wyrm_carcass') {
         createBloodStain(worldX, worldZ, 5.0); // Massive pool for the Wyrm (clamped by environment)
    }
}

// Spawn decorations throughout the dungeon
export function spawnDecorations() {
    const cellSize = game.dungeon.cellSize;
    
    // Track cells that have decorations (for one-per-cell rule)
    const decoratedCells = new Set();
    
    // Populate with existing decorations (e.g. from setupLevel or spawnLadder)
    game.decorations.forEach(d => {
        decoratedCells.add(`${d.gridX},${d.gridY}`);
    });
    
    // Also mark ladder position as decorated/forbidden
    if (game.ladderPosition) {
        decoratedCells.add(`${game.ladderPosition.x},${game.ladderPosition.y}`);
    }

    // --- SPECIAL DECORATIONS ---
    // Handled in setupLevel() or dungeon.js
    // ---------------------------
    
    // Track cells with doors (no decorations allowed, including inscriptions)
    const doorCells = new Set();
    game.doors.forEach(door => {
        doorCells.add(`${door.gridX},${door.gridY}`);
    });
    
    // Helper function to check if a cell is adjacent to a wall
    const isNearWall = (x, y) => {
        // Check all 8 directions
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const checkY = y + dy;
                const checkX = x + dx;
                if (checkY >= 0 && checkY < game.dungeon.height && 
                    checkX >= 0 && checkX < game.dungeon.width) {
                    if (dungeonMap[checkY][checkX] === 1) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    
    // Decorations that prefer to be near walls
    const wallPreferringTypes = ['spider_web', 'puddle', 'stalactite', 'stalagmite', 'wall_inscription', 'bone_pile'];
    
    // Go through each walkable cell
    for (let y = 0; y < game.dungeon.height; y++) {
        for (let x = 0; x < game.dungeon.width; x++) {
            if (dungeonMap[y][x] === 0) {
                const cellKey = `${x},${y}`;
                const worldX = x * cellSize + cellSize / 2;
                const worldZ = y * cellSize + cellSize / 2;
                
                // Skip cells with doors (no decorations allowed at all)
                if (doorCells.has(cellKey)) {
                    continue;
                }
                
                // Check distance to player start
                const distToPlayer = Math.sqrt(
                    Math.pow(worldX - game.player.position.x, 2) +
                    Math.pow(worldZ - game.player.position.z, 2)
                );
                
                // Don't spawn decorations too close to player start
                if (distToPlayer > cellSize * 2) {
                    const nearWall = isNearWall(x, y);
                    const level = game.dungeon.level || 1;
                    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
                    const allowedDecorations = config.decorations;
                    const decorationProbabilities = config.decorationProbabilities || {};
                    
                    // Each decoration type has its own probability
                    for (const decorType of Object.values(DECORATION_TYPES)) {
                        // Skip if not allowed on this level
                        if (!allowedDecorations.includes(decorType.name)) continue;

                        const isInscription = decorType.name === 'wall_inscription';
                        
                        // Inscriptions ONLY spawn if there's a wall adjacent
                        if (isInscription && !nearWall) {
                            continue;
                        }
                        
                        // Only one non-inscription decoration per cell
                        if (!isInscription && decoratedCells.has(cellKey)) {
                            continue;
                        }
                        
                        // Level 5 Special Rule: No mushrooms on island or bridges
                        if (level === 5 && decorType.name === 'mushrooms') {
                             const lakeCenterX = game.dungeon.width - 12;
                             const lakeCenterY = 12;
                             
                             // 1. Check Island (Radius 4 safe zone)
                             const dx = x - lakeCenterX;
                             const dy = y - lakeCenterY;
                             if (dx*dx + dy*dy < 16) continue;

                             // 2. Check Bridges (approx 10 units long)
                             // West Bridge (y is around 12)
                             if (Math.abs(y - lakeCenterY) <= 2 && x < lakeCenterX && x > lakeCenterX - 11) continue;
                             
                             // South Bridge (x is around center)
                             if (Math.abs(x - lakeCenterX) <= 2 && y > lakeCenterY && y < lakeCenterY + 11) continue;
                        }

                        const prefersWall = wallPreferringTypes.includes(decorType.name);
                        
                        // Adjust probability based on wall proximity
                        let baseProbability = decorationProbabilities[decorType.name] !== undefined 
                            ? decorationProbabilities[decorType.name] 
                            : decorType.probability;

                        let adjustedProbability = baseProbability;
                        
                        // Special handling for moss_patch
                        if (decorType.name === 'moss_patch') {
                            if (nearWall) {
                                // Slightly higher chance near walls
                                adjustedProbability *= 1.5;
                            } else {
                                // Much lower chance in open areas (to avoid ceiling clutter)
                                adjustedProbability *= 0.2;
                            }
                        } else if (prefersWall) {
                            if (nearWall) {
                                // Much higher chance near walls (3x)
                                adjustedProbability *= 3.0;
                            } else {
                                // Much lower chance in open areas (10% chance)
                                adjustedProbability *= 0.1;
                            }
                        }
                        
                        if (Math.random() < adjustedProbability) {
                            createDecoration(x, y, decorType);
                            
                            // Mark cell as decorated (unless it's an inscription)
                            if (!isInscription) {
                                decoratedCells.add(cellKey);
                            }
                        }
                    }
                }
            }
        }
    }
    
    console.log(`Spawned ${game.decorations.length} decorations`);
}
export function updateDecorations() {
    const playerPos = game.player.position;
    // Use fog distance for culling, but cap at 30 for performance
    const fogDist = (game.scene && game.scene.fog) ? game.scene.fog.far : 30;
    const lightCullDistance = Math.min(fogDist, 30);

    for (let decoration of game.decorations) {
        // Light Culling
        if (decoration.mesh.userData.light) {
            const dx = decoration.mesh.position.x - playerPos.x;
            const dz = decoration.mesh.position.z - playerPos.z;
            const distSq = dx * dx + dz * dz;
            
            // Enable light only if close enough
            if (distSq < lightCullDistance * lightCullDistance) {
                decoration.mesh.userData.light.visible = true;
            } else {
                decoration.mesh.userData.light.visible = false;
            }
        }

        if (decoration.type.name === 'spider_web') {
            // Calculate distance from player
            const dx = decoration.mesh.position.x - playerPos.x;
            const dz = decoration.mesh.position.z - playerPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Scale opacity based on distance (fade out between 5 and 15 units)
            const minDistance = 5;
            const maxDistance = 15;
            let opacityScale = 1.0;
            
            if (distance > minDistance) {
                opacityScale = 1.0 - Math.min(1.0, (distance - minDistance) / (maxDistance - minDistance));
            }
            
            // Apply opacity to all materials in the web
            decoration.mesh.traverse((child) => {
                if (child.isMesh || child.isLine) {
                    if (child.material) {
                        // Store original opacity if not already stored
                        if (child.material.userData.originalOpacity === undefined) {
                            child.material.userData.originalOpacity = child.material.opacity || 1.0;
                        }
                        child.material.opacity = child.material.userData.originalOpacity * opacityScale;
                    }
                }
            });
        }
    }
}

export function spawnFireflies() {
    const cellSize = game.dungeon.cellSize;
    const numFireflies = 5 + Math.floor(Math.random() * 5); // Reduced to 5-10
    const level = game.dungeon.level || 1;
    
    for (let i = 0; i < numFireflies; i++) {
        // Find random empty spot
        let x, y;
        let attempts = 0;
        do {
            x = Math.floor(Math.random() * game.dungeon.width);
            y = Math.floor(Math.random() * game.dungeon.height);
            
            // Level 5 Special Rule: No fireflies in the lake area
            if (level === 5) {
                const lakeCenterX = game.dungeon.width - 12;
                const lakeCenterY = 12;
                const lakeRadius = 12.0; // Safe zone radius
                const dx = x - lakeCenterX;
                const dy = y - lakeCenterY;
                if (dx*dx + dy*dy < lakeRadius*lakeRadius) {
                    // Force retry
                    x = -1; 
                }
            }
            
            attempts++;
        } while ((x === -1 || dungeonMap[y][x] !== 0) && attempts < 100);
        
        if (x !== -1 && dungeonMap[y][x] === 0) {
            createFirefly(x, y);
        }
    }
}

// Create a single firefly
export function createFirefly(gridX, gridY) {
    const cellSize = game.dungeon.cellSize;
    const fireflyGroup = new THREE.Group();
    
    const bodyColor = 0xccff00; // Yellow-green
    
    // 1. Core bright sphere (white hot center)
    const coreGeom = new THREE.SphereGeometry(0.025, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    fireflyGroup.add(core);
    
    // 2. Inner Halo (colored)
    const haloGeom = new THREE.SphereGeometry(0.05, 8, 8);
    const haloMat = new THREE.MeshBasicMaterial({
        color: bodyColor,
        transparent: true,
        opacity: 0.6
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    fireflyGroup.add(halo);
    
    // 3. Outer Halo (faint)
    const outerHaloGeom = new THREE.SphereGeometry(0.1, 8, 8);
    const outerHaloMat = new THREE.MeshBasicMaterial({
        color: bodyColor,
        transparent: true,
        opacity: 0.2
    });
    const outerHalo = new THREE.Mesh(outerHaloGeom, outerHaloMat);
    fireflyGroup.add(outerHalo);
    
    // 4. Strong Light to illuminate surroundings
    // Increased intensity (2.5) and range (8.0)
    const light = new THREE.PointLight(bodyColor, 2.5, 8);
    light.castShadow = true;
    light.shadow.mapSize.width = 256;
    light.shadow.mapSize.height = 256;
    light.shadow.bias = -0.001;
    fireflyGroup.add(light);
    
    fireflyGroup.position.x = gridX * cellSize + cellSize / 2;
    fireflyGroup.position.z = gridY * cellSize + cellSize / 2;
    fireflyGroup.position.y = 1.5 + Math.random(); // Flying height
    
    game.scene.add(fireflyGroup);
    
    const firefly = {
        mesh: fireflyGroup,
        gridX: gridX,
        gridY: gridY,
        position: fireflyGroup.position.clone(),
        targetPosition: fireflyGroup.position.clone(),
        facing: Math.floor(Math.random() * 4),
        animating: false,
        animationProgress: 0,
        nextMoveTime: Math.random() * 1 + 0.5, // Move more often
        timeSinceLastMove: 0,
        speed: 0.15, // Faster movement (lower duration)
        moveChance: 0.8, // Move more frequently
        flightOffset: Math.random() * 100 // Random offset for flight bobbing
    };
    
    game.critters.push(firefly);
}

// Update critters (fireflies)
export function updateCritters(deltaTime) {
    const playerPos = game.player.position;
    const cullDistSq = 25 * 25;

    for (let critter of game.critters) {
        // Calculate base position (where the worm "should" be)
        const basePosition = new THREE.Vector3();
        
        // Update animation state
        if (critter.animating) {
            critter.animationProgress += deltaTime / critter.speed;
            
            if (critter.animationProgress >= 1.0) {
                critter.animationProgress = 1.0;
                critter.animating = false;
                critter.position.copy(critter.targetPosition);
            }
            
            // Linear movement for base position
            basePosition.lerpVectors(
                critter.position,
                critter.targetPosition,
                critter.animationProgress
            );
            
            // Banking while turning
            critter.mesh.rotation.z = Math.sin(critter.animationProgress * Math.PI) * 0.2 * (Math.random() > 0.5 ? 1 : -1);
            
        } else {
            // Idle state
            basePosition.copy(critter.position);
            critter.mesh.rotation.z = 0;
        }
        
        // Apply erratic flight movement (Zooming around!)
        // Slower time scale (0.002) but keeping larger offsets
        const time = Date.now() * 0.002 + critter.flightOffset;
        
        // Erratic X/Z movement (figure-eights and loops)
        // Reduced range slightly to prevent clipping into thicker walls
        critter.mesh.position.x = basePosition.x + Math.sin(time) * 1.0 + Math.cos(time * 2.3) * 0.5;
        critter.mesh.position.z = basePosition.z + Math.cos(time * 1.3) * 1.0 + Math.sin(time * 2.7) * 0.5;
        
        // Vertical bobbing
        critter.mesh.position.y = 1.5 + Math.sin(time * 1.5) * 0.5 + Math.cos(time * 0.9) * 0.3;
        
        // Random rotation to look like it's looking around
        critter.mesh.rotation.y = (critter.facing * Math.PI / 2) + Math.sin(time * 0.5) * 0.5;
        
        // Light Culling
        const dx = critter.mesh.position.x - playerPos.x;
        const dz = critter.mesh.position.z - playerPos.z;
        const distSq = dx * dx + dz * dz;
        
        critter.mesh.traverse(child => {
            if (child.isLight) {
                const settings = game.lightSettings && game.lightSettings.firefly;
                const enabledInSettings = settings ? (settings.enabled !== false) : true;
                child.visible = (distSq < cullDistSq) && enabledInSettings;
            }
        });

        // AI decision making
        if (!critter.animating) {
            critter.timeSinceLastMove += deltaTime;
            
            if (critter.timeSinceLastMove >= critter.nextMoveTime) {
                critter.timeSinceLastMove = 0;
                critter.nextMoveTime = Math.random() * 0.5 + 0.2; // Very frequent decisions
                
                // Random movement decision
                const action = Math.random();
                
                if (action < critter.moveChance) {
                    tryMoveCritter(critter);
                } else if (action < critter.moveChance + 0.15) {
                    critter.facing = (critter.facing - 1 + 4) % 4;
                } else {
                    critter.facing = (critter.facing + 1) % 4;
                }
            }
        }
    }
}

// Try to move critter forward (ignores collision with entities)
export function tryMoveCritter(critter) {
    const cellSize = game.dungeon.cellSize;
    let newGridX = critter.gridX;
    let newGridY = critter.gridY;
    
    switch(critter.facing) {
        case 0: newGridY--; break;
        case 1: newGridX++; break;
        case 2: newGridY++; break;
        case 3: newGridX--; break;
    }
    
    // Only check map bounds and walls
    if (newGridY >= 0 && newGridY < game.dungeon.height &&
        newGridX >= 0 && newGridX < game.dungeon.width &&
        dungeonMap[newGridY][newGridX] === 0) {
        
        // Check for closed doors
        let blockedByDoor = false;
        for (let door of game.doors) {
            if (!door.isOpen && door.gridX === newGridX && door.gridY === newGridY) {
                blockedByDoor = true;
                break;
            }
        }
        
        if (blockedByDoor) return;

        // Move critter
        critter.gridX = newGridX;
        critter.gridY = newGridY;
        critter.targetPosition.x = newGridX * cellSize + cellSize / 2;
        critter.targetPosition.z = newGridY * cellSize + cellSize / 2;
        critter.animating = true;
        critter.animationProgress = 0;
    }
}
