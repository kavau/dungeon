import { game, dungeonMap } from '../state.js';
import { logMessage, updateHealthDisplay, gameOver } from '../ui.js';
import { createTorch } from './items.js';
import { createBloodStain } from '../effects.js';
import { MONSTER_TYPES, MONSTER_AGGRESSIVENESS } from './monsterTypes.js';
import { createMonsterVisuals } from '../visuals/monsterRenderer.js';
import { getFloorHeight } from '../visuals/dungeonRenderer.js';
import { LEVEL_CONFIG } from '../levelConfig.js';

export { MONSTER_TYPES };

export function getMonsterName(type) {
    switch(type) {
        case MONSTER_TYPES.SKELETON: return 'Skeleton';
        case MONSTER_TYPES.SPIDER: return 'Giant Spider';
        case MONSTER_TYPES.JELLY: return 'Jelly Blob';
        case MONSTER_TYPES.RAT: return 'Giant Rat';
        case MONSTER_TYPES.GHOST: return 'Ghost';
        case MONSTER_TYPES.PLANT: return 'Carnivorous Plant';
        case MONSTER_TYPES.BAT: return 'Bat';
        case MONSTER_TYPES.SALAMANDER: return 'Cave Salamander';
        case MONSTER_TYPES.GOBLIN: return 'Goblin';
        case MONSTER_TYPES.CUBE: return 'Gelatinous Cube';
        case MONSTER_TYPES.ORC: return 'Orc';
        case MONSTER_TYPES.BANDIT: return 'Bandit';
        case MONSTER_TYPES.WRAITH: return 'Wraith';
        case MONSTER_TYPES.MIMIC: return 'Mimic';
        case MONSTER_TYPES.GARGOYLE: return 'Gargoyle';
        case MONSTER_TYPES.IMP: return 'Imp';
        case MONSTER_TYPES.TROLL: return 'Troll';
        case MONSTER_TYPES.SLIME: return 'Acid Slime';
        case MONSTER_TYPES.ZOMBIE: return 'Zombie';
        case MONSTER_TYPES.SERPENT: return 'Giant Serpent';
        case MONSTER_TYPES.MUSHROOM: return 'Mushroom Monster';
        case MONSTER_TYPES.EYE_BEAST: return 'Eye Beast';
        case MONSTER_TYPES.SCARAB: return 'Scarab Swarm';
        case MONSTER_TYPES.SHADOW: return 'Living Shadow';
        case MONSTER_TYPES.CULTIST: return 'Dark Cultist';
        case MONSTER_TYPES.MINER: return 'Undead Miner';
        default: return 'Monster';
    }
}

export function getMonsterDifficulty(monsterType) {
    const difficulties = {
        // Trivial (1-2)
        [MONSTER_TYPES.RAT]: 1,
        [MONSTER_TYPES.BAT]: 1,
        [MONSTER_TYPES.SALAMANDER]: 2,
        [MONSTER_TYPES.SCARAB]: 2,
        
        // Easy (3-4)
        [MONSTER_TYPES.SPIDER]: 3,
        [MONSTER_TYPES.SLIME]: 3,
        [MONSTER_TYPES.MUSHROOM]: 3,
        [MONSTER_TYPES.SKELETON]: 4,
        
        // Medium (5-6)
        [MONSTER_TYPES.GOBLIN]: 5,
        [MONSTER_TYPES.BANDIT]: 5,
        [MONSTER_TYPES.ZOMBIE]: 5,
        [MONSTER_TYPES.IMP]: 6,
        [MONSTER_TYPES.JELLY]: 6,
        [MONSTER_TYPES.CULTIST]: 6,
        [MONSTER_TYPES.MINER]: 6,
        
        // Medium-Hard (7-8)
        [MONSTER_TYPES.ORC]: 7,
        [MONSTER_TYPES.WRAITH]: 7,
        [MONSTER_TYPES.PLANT]: 7,
        [MONSTER_TYPES.SERPENT]: 8,
        [MONSTER_TYPES.GHOST]: 8,
        
        // Hard (9-10)
        [MONSTER_TYPES.GARGOYLE]: 9,
        [MONSTER_TYPES.EYE_BEAST]: 9,
        [MONSTER_TYPES.MIMIC]: 10,
        [MONSTER_TYPES.CUBE]: 10,
        
        // Very Hard (11-12)
        [MONSTER_TYPES.TROLL]: 11,
        [MONSTER_TYPES.SHADOW]: 12
    };
    
    return difficulties[monsterType] || 5; // Default to medium difficulty
}

export function getMonsterStats(difficulty) {
    // Base health: 10 + (difficulty * 8) with some variation
    const baseHealth = 10 + (difficulty * 8);
    const health = Math.floor(baseHealth + (Math.random() - 0.5) * difficulty * 2);
    
    // Base damage: 5 + (difficulty * 2) with some variation
    const baseDamage = 5 + (difficulty * 2);
    const attackPower = Math.floor(baseDamage + (Math.random() - 0.5) * difficulty * 0.5);
    
    return {
        health: Math.max(5, health),
        maxHealth: Math.max(5, health),
        attackPower: Math.max(3, attackPower)
    };
}

export function createMonster(gridX, gridY, type) {
    const cellSize = game.dungeon.cellSize;
    
    const { mesh, body, speed, moveChance } = createMonsterVisuals(type);
    const monsterGroup = mesh;
    
    // Set position
    monsterGroup.position.x = gridX * cellSize + cellSize / 2;
    monsterGroup.position.z = gridY * cellSize + cellSize / 2;
    
    // Adjust height for 3D floor
    monsterGroup.position.y = getFloorHeight(monsterGroup.position.x, monsterGroup.position.z, dungeonMap);
    
    game.scene.add(monsterGroup);

    // Monster AI state
    const monster = {
        type: type,
        mesh: monsterGroup,
        body: body,
        gridX: gridX,
        gridY: gridY,
        position: monsterGroup.position.clone(),
        targetPosition: monsterGroup.position.clone(),
        facing: Math.floor(Math.random() * 4),
        animating: false,
        animationProgress: 0,
        nextMoveTime: Math.random() * 3 + 1,
        timeSinceLastMove: 0,
        speed: speed,
        moveChance: moveChance,
        health: 30,
        maxHealth: 30,
        attackPower: 10,
        difficulty: 5,
        isAggro: false,
        hasTorch: (type === MONSTER_TYPES.GOBLIN || type === MONSTER_TYPES.BANDIT || type === MONSTER_TYPES.ORC || type === MONSTER_TYPES.SKELETON || type === MONSTER_TYPES.CULTIST || type === MONSTER_TYPES.MINER)
    };
    
    // Get difficulty-based stats and update monster
    const difficulty = getMonsterDifficulty(type);
    const stats = getMonsterStats(difficulty);
    monster.health = stats.health;
    monster.maxHealth = stats.maxHealth;
    monster.attackPower = stats.attackPower;
    monster.difficulty = difficulty;
    
    game.monsters.push(monster);
}

function monsterAttackPlayer(monster) {
    const cellSize = game.dungeon.cellSize;
    const playerGridX = Math.floor(game.player.position.x / cellSize);
    const playerGridZ = Math.floor(game.player.position.z / cellSize);
    
    // Check if player is adjacent to monster
    const dx = Math.abs(playerGridX - monster.gridX);
    const dz = Math.abs(playerGridZ - monster.gridY);
    
    // Player must be exactly one cell away (not diagonal)
    if ((dx === 1 && dz === 0) || (dx === 0 && dz === 1)) {
        // Check if monster is facing the player
        let isFacing = false;
        
        switch(monster.facing) {
            case 0: // North (-Z)
                isFacing = (monster.gridY - 1 === playerGridZ && monster.gridX === playerGridX);
                break;
            case 1: // East (+X)
                isFacing = (monster.gridX + 1 === playerGridX && monster.gridY === playerGridZ);
                break;
            case 2: // South (+Z)
                isFacing = (monster.gridY + 1 === playerGridZ && monster.gridX === playerGridX);
                break;
            case 3: // West (-X)
                isFacing = (monster.gridX - 1 === playerGridX && monster.gridY === playerGridZ);
                break;
        }
        
        if (isFacing) {
            // Deal damage to player
            game.player.health = Math.max(0, game.player.health - monster.attackPower);
            logMessage(`The ${getMonsterName(monster.type)} hits you for ${monster.attackPower} damage!`, 'player-hit');
            
            // Add blood stain at player position
            createBloodStain(game.player.position.x, game.player.position.z);
            
            console.log(`Monster attacked! Player health: ${game.player.health}`);
            
            // Visual feedback - screen flash
            const flashOverlay = document.getElementById('damage-flash');
            if (flashOverlay) {
                flashOverlay.style.opacity = '0.5';
                setTimeout(() => {
                    flashOverlay.style.opacity = '0';
                }, 150);
            }
            
            updateHealthDisplay();
            
            // Check if player died
            if (game.player.health <= 0) {
                gameOver();
            }
            
            return true;
        }
    }
    
    return false;
}

// Update monster AI and movement
export function updateMonsters(deltaTime) {
    for (let monster of game.monsters) {
        // Flicker torch if monster has one
        if (monster.hasTorch) {
            // Find the light if we haven't cached it
            if (!monster.torchLight) {
                monster.body.traverse(child => {
                    if (child.userData.isTorch) {
                        monster.torchGroup = child;
                        monster.torchLight = child.userData.light;
                        monster.torchCore = child.userData.core;
                        monster.torchOuter = child.userData.outer;
                    }
                });
            }
            
            if (monster.torchLight) {
                const time = Date.now() * 0.005;
                const flicker = Math.sin(time * 10) * 0.1 + Math.cos(time * 23) * 0.1;
                
                // Flicker light intensity
                monster.torchLight.intensity = 1.5 + flicker;
                
                // Animate flame meshes
                if (monster.torchCore && monster.torchOuter) {
                    // Scale wobble
                    const scaleY = 1 + flicker * 0.5;
                    monster.torchCore.scale.set(1 - flicker * 0.2, scaleY, 1 - flicker * 0.2);
                    monster.torchOuter.scale.set(1 + flicker * 0.3, scaleY * 1.1, 1 + flicker * 0.3);
                    
                    // Position wobble (wind effect)
                    const wind = Math.sin(time * 3) * 0.02;
                    monster.torchCore.rotation.z = wind;
                    monster.torchOuter.rotation.z = wind * 1.5;
                }
            }
        }

        // Update animation
        if (monster.animating) {
            monster.animationProgress += deltaTime / monster.speed; // Type-specific speed
            
            if (monster.animationProgress >= 1.0) {
                monster.animationProgress = 1.0;
                monster.animating = false;
                monster.position.copy(monster.targetPosition);
            }
            
            // Smooth movement
            const t = monster.animationProgress;
            const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            
            // LERP X/Z
            const currentX = THREE.MathUtils.lerp(monster.position.x, monster.targetPosition.x, easedT);
            const currentZ = THREE.MathUtils.lerp(monster.position.z, monster.targetPosition.z, easedT);
            
            // Determine Floor Height at current position
            const floorH = getFloorHeight(currentX, currentZ, dungeonMap);
            
            monster.mesh.position.x = currentX;
            monster.mesh.position.z = currentZ;
            
            let baseY = 0.75; // Default
            switch(monster.type) {
                case MONSTER_TYPES.JELLY: baseY = 0.1; break;
                case MONSTER_TYPES.GHOST: baseY = 1.2; break;
                case MONSTER_TYPES.SPIDER: baseY = 0.3; break;
                case MONSTER_TYPES.RAT: baseY = 0.25; break;
                case MONSTER_TYPES.PLANT: baseY = 0.0; break;
                case MONSTER_TYPES.BAT: baseY = 1.5; break;
                case MONSTER_TYPES.SALAMANDER: baseY = 0.0; break;
                case MONSTER_TYPES.CUBE: baseY = 0.75; break;
                case MONSTER_TYPES.WRAITH: baseY = 1.3; break;
                case MONSTER_TYPES.MIMIC: baseY = 0.3; break;
            }
            
            monster.mesh.position.y = floorH + baseY + Math.sin(easedT * Math.PI) * 0.2; 

        } else {
            // Type-specific idle animation
            const baseTime = Date.now() * 0.002 + monster.gridX;
            // Apply aggro multiplier
            const aggroMult = monster.isAggro ? 2 : 1;
            const aggroAmp = monster.isAggro ? 2 : 1;
            const time = baseTime * aggroMult;
            
            // Recalculate floor height for idle in case it changed or for consistency
             const floorH = getFloorHeight(monster.mesh.position.x, monster.mesh.position.z, dungeonMap);
             
            switch(monster.type) {
                case MONSTER_TYPES.JELLY:
                    monster.mesh.position.y = floorH + 0.1 + Math.sin(time * 2) * (0.15 * aggroAmp); // Low + bob
                    monster.body.scale.y = 0.8 + Math.sin(time * 2) * 0.1;
                    break;
                case MONSTER_TYPES.GHOST:
                    monster.mesh.position.y = floorH + 1.2 + Math.sin(time) * (0.2 * aggroAmp);
                    break;
                case MONSTER_TYPES.SPIDER:
                    monster.mesh.position.y = floorH + 0.3 + Math.sin(time * 3) * (0.05 * aggroAmp);
                    break;
                case MONSTER_TYPES.RAT:
                    monster.mesh.position.y = floorH + 0.25 + Math.sin(time * 4) * (0.05 * aggroAmp);
                    break;
                case MONSTER_TYPES.PLANT:
                    // Plant sways
                    monster.body.rotation.z = Math.sin(time) * 0.1;
                    monster.mesh.position.y = floorH; // Grounded
                    break;
                case MONSTER_TYPES.BAT:
                    monster.mesh.position.y = floorH + 1.5 + Math.sin(time * 3) * (0.3 * aggroAmp);
                    break;
                case MONSTER_TYPES.SALAMANDER:
                    // Keep close to ground, slight breathing motion
                    monster.mesh.position.y = floorH + Math.abs(Math.sin(time * 2)) * (0.02 * aggroAmp); // Used to mean Y=0
                    break;
                case MONSTER_TYPES.CUBE:
                    monster.mesh.position.y = floorH + 0.75 + Math.sin(time) * (0.1 * aggroAmp);
                    monster.body.rotation.y += 0.01;
                    break;
                case MONSTER_TYPES.WRAITH:
                    monster.mesh.position.y = floorH + 1.3 + Math.sin(time) * (0.25 * aggroAmp);
                    break;
                case MONSTER_TYPES.MIMIC:
                    // Mimic stays still when disguised, bobs when aggressive
                    if (monster.isAggro) {
                        monster.mesh.position.y = floorH + 0.3 + Math.sin(time) * (0.1 * aggroAmp);
                    } else {
                        monster.mesh.position.y = floorH + 0.3;
                    }
                    break;
                default:
                    // Standard humanoid (stand height approx 0.75 + floor)
                    monster.mesh.position.y = floorH + 0.75 + Math.sin(time) * (0.1 * aggroAmp);
            }
        }
        
        // Rotate body slowly (except for some types) - but not if aggro
        if (monster.type !== MONSTER_TYPES.PLANT && 
            monster.type !== MONSTER_TYPES.RAT && 
            monster.type !== MONSTER_TYPES.SALAMANDER) {
            if (!monster.isAggro) {
                // Idle rotation
                monster.body.rotation.y += deltaTime * 0.5;
            } else {
                // Aggro: face toward player based on facing direction
                // 0=North, 1=East, 2=South, 3=West
                let targetRotation = 0;
                switch(monster.facing) {
                    case 0: // North
                        targetRotation = Math.PI;
                        break;
                    case 1: // East
                        targetRotation = Math.PI / 2;
                        break;
                    case 2: // South
                        targetRotation = 0;
                        break;
                    case 3: // West
                        targetRotation = -Math.PI / 2;
                        break;
                }
                
                // Smooth rotation (shortest path)
                let currentRot = monster.body.rotation.y;
                let diff = targetRotation - currentRot;
                
                // Normalize to [-PI, PI]
                while (diff > Math.PI) diff -= 2 * Math.PI;
                while (diff < -Math.PI) diff += 2 * Math.PI;
                
                // Lerp with speed factor
                const rotSpeed = 8.0; // radians per second
                const maxRotation = rotSpeed * deltaTime;
                const rotAmount = Math.max(-maxRotation, Math.min(maxRotation, diff));
                
                monster.body.rotation.y = currentRot + rotAmount;
            }
        }
        
        // Update mimic appearance based on aggro state
        if (monster.type === MONSTER_TYPES.MIMIC && monster.body.userData) {
            const eyesVisible = monster.isAggro;
            if (monster.body.userData.mimicEye1) {
                monster.body.userData.mimicEye1.visible = eyesVisible;
            }
            if (monster.body.userData.mimicEye2) {
                monster.body.userData.mimicEye2.visible = eyesVisible;
            }
            if (monster.body.userData.mimicMouth) {
                monster.body.userData.mimicMouth.visible = eyesVisible;
            }
        }
        
        // Animate mimic lid for aggro state (robust reference)
        if (monster.type === MONSTER_TYPES.MIMIC && monster.body.userData && monster.body.userData.mimicLid) {
            const mimicLid = monster.body.userData.mimicLid;
            const targetLidAngle = monster.isAggro ? -Math.PI / 3 : 0; // Open 60 degrees when aggro
            mimicLid.rotation.x += (targetLidAngle - mimicLid.rotation.x) * 0.2;
        }
        
        // Toggle mimic fangs visibility based on aggro state
        if (monster.type === MONSTER_TYPES.MIMIC && monster.body.userData) {
            const showFangs = monster.isAggro;
            if (monster.body.userData.mimicTopFangs) {
                monster.body.userData.mimicTopFangs.forEach(fang => fang.visible = showFangs);
            }
            if (monster.body.userData.mimicBottomFangs) {
                monster.body.userData.mimicBottomFangs.forEach(fang => fang.visible = showFangs);
            }
        }
        
        // Aggro monsters face the player
        if (monster.isAggro && !monster.animating) {
            const playerGridX = Math.floor(game.player.position.x / game.dungeon.cellSize);
            const playerGridZ = Math.floor(game.player.position.z / game.dungeon.cellSize);
            const dx = playerGridX - monster.gridX;
            const dy = playerGridZ - monster.gridY;
            
            // Determine facing direction toward player
            if (Math.abs(dx) > Math.abs(dy)) {
                monster.facing = dx > 0 ? 1 : 3; // East or West
            } else if (Math.abs(dy) > 0) {
                monster.facing = dy > 0 ? 2 : 0; // South or North
            }
        }
        
        // AI decision making
        if (!monster.animating) {
            
            // Check Turn Mode
            const isTurnBased = game.settings && game.settings.turnMode === 'turnbased';
            const canAct = isTurnBased ? monster.canAct : true;

            if (isTurnBased) {
                // In turn-based, only update if flagged to act
                if (!canAct) continue; 
            } else {
                // In real-time, use time accumulators
                monster.timeSinceLastMove += deltaTime;
                if (monster.timeSinceLastMove < monster.nextMoveTime) continue;
                
                monster.timeSinceLastMove = 0;
            }
            
            // --- ACTION START --- (Reset flag first thing for turn based)
            if (isTurnBased) monster.canAct = false;

                // Check distance to player (weighted distance where diagonals count as 1.5)
                const playerGridX = Math.floor(game.player.position.x / game.dungeon.cellSize);
                const playerGridZ = Math.floor(game.player.position.z / game.dungeon.cellSize);
                const dx = Math.abs(monster.gridX - playerGridX);
                const dy = Math.abs(monster.gridY - playerGridZ);
                // Diagonal-friendly distance: orthogonal=1, diagonal=1.5, knight's move=2.5
                const distToPlayer = Math.max(dx, dy) + 0.5 * Math.min(dx, dy);
                
                // If player is dead, lose aggro
                if (game.player.health <= 0) {
                    monster.isAggro = false;
                }
                // Chance to become aggro if close
                else if (!monster.isAggro) {
                    // Mimics only detect at radius 1.5, others at radius 5
                    const detectionRadius = monster.type === MONSTER_TYPES.MIMIC ? 1.5 : 5;
                    
                    if (distToPlayer <= detectionRadius) {
                        // Calculate distance-based probability (closer = higher chance)
                        const maxDist = detectionRadius;
                        const distanceFactor = (maxDist + 1 - distToPlayer) / maxDist;
                        
                        // Get monster aggressiveness (default 1.0 if not defined)
                        const aggressiveness = MONSTER_AGGRESSIVENESS[monster.type] || 1.0;
                        
                        // Combined probability: distance * aggressiveness * base
                        const aggroProbability = distanceFactor * aggressiveness * 0.2;
                        
                        const detected = Math.random() < aggroProbability;
                        if (game.isTestChamber) {
                            const mName = getMonsterName(monster.type);
                            logMessage(`[${mName}] Check: dist=${distToPlayer} prob=${(aggroProbability*100).toFixed(1)}% saw=${detected}`, "normal");
                        }
                        if (detected) monster.isAggro = true;
                    }
                }
                
                // Set next move time based on aggro state (faster if aggro)
                if (!isTurnBased) {
                    monster.nextMoveTime = monster.isAggro ? (Math.random() * 1 + 0.5) : (Math.random() * 4 + 2);
                }
                
                // Try to attack player if adjacent
                if (game.player.health > 0 && monsterAttackPlayer(monster)) {
                    // Attack successful, don't move
                    continue;
                }
                
                if (monster.isAggro) {
                    if (game.isTestChamber) {
                             logMessage(`[${getMonsterName(monster.type)}] Chasing!`, "combat");
                    }
                    // Move towards player
                    const dx = playerGridX - monster.gridX;
                    const dy = playerGridZ - monster.gridY;
                    
                    // Determine best direction - prefer larger absolute distance
                    let bestFacing = -1;
                    let secondaryFacing = -1;
                    
                    if (Math.abs(dx) > Math.abs(dy)) {
                        // Horizontal distance is greater
                        if (dx > 0) bestFacing = 1; // East
                        else bestFacing = 3; // West
                        
                        // Secondary direction
                        if (dy > 0) secondaryFacing = 2; // South
                        else if (dy < 0) secondaryFacing = 0; // North
                    } else if (Math.abs(dy) > Math.abs(dx)) {
                        // Vertical distance is greater
                        if (dy > 0) bestFacing = 2; // South
                        else bestFacing = 0; // North
                        
                        // Secondary direction
                        if (dx > 0) secondaryFacing = 1; // East
                        else if (dx < 0) secondaryFacing = 3; // West
                    } else {
                        // Distances are equal, pick randomly but consistently
                        if (Math.random() < 0.5) {
                            if (dx > 0) bestFacing = 1;
                            else bestFacing = 3;
                            
                            if (dy > 0) secondaryFacing = 2;
                            else if (dy < 0) secondaryFacing = 0;
                        } else {
                            if (dy > 0) bestFacing = 2;
                            else bestFacing = 0;
                            
                            if (dx > 0) secondaryFacing = 1;
                            else if (dx < 0) secondaryFacing = 3;
                        }
                    }
                    
                    monster.facing = bestFacing;
                    if (!tryMoveMonster(monster)) {
                        // If blocked, try the secondary direction
                        if (secondaryFacing !== -1) {
                            monster.facing = secondaryFacing;
                            tryMoveMonster(monster);
                        }
                    }
                } else {
                    if (game.isTestChamber) {
                         logMessage(`[${getMonsterName(monster.type)}] Wandering`, "normal");
                    }
                    // Random movement decision
                    const action = Math.random();
                    
                    if (action < monster.moveChance) {
                        // Try to move forward
                        tryMoveMonster(monster);
                    } else if (action < monster.moveChance + 0.2) {
                        // Turn left
                        monster.facing = (monster.facing - 1 + 4) % 4;
                    } else {
                        // Turn right
                        monster.facing = (monster.facing + 1) % 4;
                    }
                }
        }
    }
}

// Try to move monster forward
export function tryMoveMonster(monster) {
    const cellSize = game.dungeon.cellSize;
    let newGridX = monster.gridX;
    let newGridY = monster.gridY;
    
    // Calculate new grid position based on facing
    switch(monster.facing) {
        case 0: // North
            newGridY--;
            break;
        case 1: // East
            newGridX++;
            break;
        case 2: // South
            newGridY++;
            break;
        case 3: // West
            newGridX--;
            break;
    }
    
    // Check if new position is valid (within bounds and walkable)
    if (newGridY >= 0 && newGridY < game.dungeon.height &&
        newGridX >= 0 && newGridX < game.dungeon.width &&
        dungeonMap[newGridY][newGridX] === 0) {
        
        // Check for closed doors
        for (let door of game.doors) {
            if (!door.isOpen && door.gridX === newGridX && door.gridY === newGridY) {
                return false;
            }
        }

        // Check if player is in the target grid cell (check both current and target positions)
        const playerGridX = Math.floor(game.player.position.x / cellSize);
        const playerGridZ = Math.floor(game.player.position.z / cellSize);
        
        // Also check player's target position if they're currently moving
        const playerTargetGridX = game.player.animating ? 
            Math.floor(game.player.targetPosition.x / cellSize) : playerGridX;
        const playerTargetGridZ = game.player.animating ? 
            Math.floor(game.player.targetPosition.z / cellSize) : playerGridZ;
        
        if ((newGridX === playerGridX && newGridY === playerGridZ) ||
            (newGridX === playerTargetGridX && newGridY === playerTargetGridZ)) {
            // Player is in the way or moving there, don't move
            return false;
        }
        
        // Check if another monster is already in the target position OR moving there
        for (let otherMonster of game.monsters) {
            if (otherMonster !== monster) {
                // Check both current position and target position (for monsters currently animating)
                const otherTargetX = otherMonster.animating ? 
                    Math.floor(otherMonster.targetPosition.x / cellSize) : otherMonster.gridX;
                const otherTargetY = otherMonster.animating ? 
                    Math.floor(otherMonster.targetPosition.z / cellSize) : otherMonster.gridY;
                
                if ((otherMonster.gridX === newGridX && otherMonster.gridY === newGridY) ||
                    (otherTargetX === newGridX && otherTargetY === newGridY)) {
                    // Another monster is in the way or moving there
                    return false;
                }
            }
        }
        
        // Move monster
        monster.gridX = newGridX;
        monster.gridY = newGridY;
        monster.targetPosition.x = newGridX * cellSize + cellSize / 2;
        monster.targetPosition.z = newGridY * cellSize + cellSize / 2;
        monster.animating = true;
        monster.animationProgress = 0;
        return true;
    }
    return false;
}

// Spawn monsters
export function spawnMonsters() {
    const cellSize = game.dungeon.cellSize;
    const numMonsters = 24;
    let spawned = 0;
    
    const level = game.dungeon.level || 1;
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
    const allowedTypes = config.monsters;
    // Track cells with doors to prevent spawning inside them
    const doorCells = new Set();
    game.doors.forEach(door => {
        doorCells.add(`${door.gridX},${door.gridY}`);
    });
    
    // Try to spawn monsters in random walkable spaces
    for (let attempt = 0; attempt < 100 && spawned < numMonsters; attempt++) {
        const x = Math.floor(Math.random() * game.dungeon.width);
        const y = Math.floor(Math.random() * game.dungeon.height);
        
        // Skip if there's a door
        if (doorCells.has(`${x},${y}`)) continue;
        
        // Level 5 Special Rule: No monsters in the lake area
        if (level === 5) {
            const lakeCenterX = game.dungeon.width - 12;
            const lakeCenterY = 12;
            const lakeRadius = 12.0; // Safe zone radius
            const dx = x - lakeCenterX;
            const dy = y - lakeCenterY;
            if (dx*dx + dy*dy < lakeRadius*lakeRadius) {
                continue;
            }
        }

        // Check if space is walkable and not too close to player
        if (dungeonMap[y][x] === 0) {
            const worldX = x * cellSize + cellSize / 2;
            const worldZ = y * cellSize + cellSize / 2;
            const distToPlayer = Math.sqrt(
                Math.pow(worldX - game.player.position.x, 2) +
                Math.pow(worldZ - game.player.position.z, 2)
            );
            
            // Don't spawn too close to player
            if (distToPlayer > cellSize * 5) {
                const randomType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
                createMonster(x, y, randomType);
                spawned++;
            }
        }
    }
}

// Spawn a single new monster at a random location
export function spawnSingleMonster() {
    const cellSize = game.dungeon.cellSize;
    const level = game.dungeon.level || 1;
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
    const allowedTypes = config.monsters;
    
    // Track cells with doors to prevent spawning inside them
    const doorCells = new Set();
    game.doors.forEach(door => {
        doorCells.add(`${door.gridX},${door.gridY}`);
    });

    // Try to spawn a monster in a random walkable space
    for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * game.dungeon.width);
        const y = Math.floor(Math.random() * game.dungeon.height);
        
        // Skip if there's a door
        if (doorCells.has(`${x},${y}`)) continue;
        
        // Level 5 Special Rule: No monsters in the lake area
        if (level === 5) {
            const lakeCenterX = game.dungeon.width - 12;
            const lakeCenterY = 12;
            const lakeRadius = 12.0; // Safe zone radius
            const dx = x - lakeCenterX;
            const dy = y - lakeCenterY;
            if (dx*dx + dy*dy < lakeRadius*lakeRadius) {
                continue;
            }
        }

        // Check if space is walkable and not occupied
        if (dungeonMap[y][x] === 0) {
            const worldX = x * cellSize + cellSize / 2;
            const worldZ = y * cellSize + cellSize / 2;
            
            // Check distance to player
            const distToPlayer = Math.sqrt(
                Math.pow(worldX - game.player.position.x, 2) +
                Math.pow(worldZ - game.player.position.z, 2)
            );
            
            // Don't spawn too close to player (at least 5 cells away)
            if (distToPlayer > cellSize * 5) {
                // Check if space is occupied by another monster
                let occupied = false;
                for (let monster of game.monsters) {
                    if (monster.gridX === x && monster.gridY === y) {
                        occupied = true;
                        break;
                    }
                }
                
                if (!occupied) {
                    const randomType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
                    createMonster(x, y, randomType);
                    console.log(`Spawned new ${getMonsterName(randomType)} at (${x}, ${y})`);
                    return true;
                }
            }
        }
    }
    return false;
}

export function triggerMonsterTurns() {
    for (let monster of game.monsters) {
        monster.canAct = true;
    }
}

