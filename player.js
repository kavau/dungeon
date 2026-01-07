import { game, dungeonMap } from './state.js';
import { checkCollision, advanceTurn, checkAndSpawnMonsters, nextLevel } from './gameLoop.js';
import { logMessage, updateHealthDisplay } from './ui.js';
import { monsterShouldBleed, getMonsterBloodSize, createBloodStain } from './effects.js';
import { createTreasure, TREASURE_TYPES } from './entities/items.js';
import { getFloorHeight } from './visuals/dungeonRenderer.js';

export function interact() {
    // Prevent rapid interaction
    const now = Date.now();
    if (game.lastInteractionTime && now - game.lastInteractionTime < 500) return;
    game.lastInteractionTime = now;

    // Try door first
    if (interactWithDoor()) return;
    
    // Try ladder
    interactWithLadder();
}

export function interactWithLadder() {
    if (!game.ladderPosition) return;
    
    const cellSize = game.dungeon.cellSize;
    const playerGridX = Math.floor(game.player.position.x / cellSize);
    const playerGridZ = Math.floor(game.player.position.z / cellSize);
    
    // Check if player is on the ladder or adjacent to it
    const dx = Math.abs(playerGridX - game.ladderPosition.x);
    const dz = Math.abs(playerGridZ - game.ladderPosition.y);
    
    if (dx === 0 && dz === 0) {
        logMessage("Climbing ladder...", "item");
        nextLevel();
    } else {
        logMessage("There is nothing to interact with here.");
    }
}

// Move player forward one grid square
// Interact with nearby door (open/close)
export function interactWithDoor() {
    const cellSize = game.dungeon.cellSize;
    const playerGridX = Math.floor(game.player.position.x / cellSize);
    const playerGridZ = Math.floor(game.player.position.z / cellSize);
    
    // Determine the cell in front of the player based on facing direction
    let targetX = playerGridX;
    let targetZ = playerGridZ;
    
    // game.player.facing: 0=north, 1=east, 2=south, 3=west
    switch(game.player.facing) {
        case 0: // north
            targetZ -= 1;
            break;
        case 2: // south
            targetZ += 1;
            break;
        case 1: // east
            targetX += 1;
            break;
        case 3: // west
            targetX -= 1;
            break;
    }
    
    // Check if there's a door in the cell the player is facing
    for (let door of game.doors) {
        if (door.gridX === targetX && door.gridY === targetZ) {
            advanceTurn();
            // Toggle door state
            door.isOpen = !door.isOpen;
            
            // Animate door - swing around hinge (left edge)
            if (door.isOpen) {
                // Swing door open 90 degrees
                door.doorPanel.rotation.y = Math.PI / 2;
                logMessage('You opened the door.', 'door');
            } else {
                // Close door
                door.doorPanel.rotation.y = 0;
                logMessage('You closed the door.', 'door');
            }
            
            return true; // Interaction successful
        }
    }
    return false;
}

export function movePlayerForward() {
    if (!game.player.canMove || game.player.animating) return;
    
    const cellSize = game.dungeon.cellSize;
    const newPosition = game.player.position.clone();
    
    // Calculate forward direction based on facing
    switch(game.player.facing) {
        case 0: // North (negative Z)
            newPosition.z -= cellSize;
            break;
        case 1: // East (positive X)
            newPosition.x += cellSize;
            break;
        case 2: // South (positive Z)
            newPosition.z += cellSize;
            break;
        case 3: // West (negative X)
            newPosition.x -= cellSize;
            break;
    }
    
    // Check collision before moving
    const collision = checkCollision(newPosition);
    if (!collision) {
        advanceTurn(); // Advance turn on successful move
        game.player.targetPosition.copy(newPosition);
        game.player.startRotation = game.player.rotation.y;
        game.player.targetRotation = game.player.rotation.y;
        game.player.animating = true;
        game.player.canMove = false;
        game.player.animationProgress = 0;
        logMessage("You move forward.");
    } else {
        if (collision === 'wall') logMessage("You bump into a wall.", 'combat');
        else if (collision === 'door') logMessage("The door is closed.", 'combat');
        else if (collision === 'monster') logMessage("A monster blocks your way.", 'combat');
        else if (collision === 'water') logMessage("The water is too deep to cross.", 'combat');
    }
}

// Move player backward one grid square
export function movePlayerBackward() {
    if (!game.player.canMove || game.player.animating) return;
    
    const cellSize = game.dungeon.cellSize;
    const newPosition = game.player.position.clone();
    
    // Calculate backward direction based on facing
    switch(game.player.facing) {
        case 0: // North (move south)
            newPosition.z += cellSize;
            break;
        case 1: // East (move west)
            newPosition.x -= cellSize;
            break;
        case 2: // South (move north)
            newPosition.z -= cellSize;
            break;
        case 3: // West (move east)
            newPosition.x += cellSize;
            break;
    }
    
    // Check collision before moving
    const collision = checkCollision(newPosition);
    if (!collision) {
        advanceTurn();
        game.player.targetPosition.copy(newPosition);
        game.player.startRotation = game.player.rotation.y;
        game.player.targetRotation = game.player.rotation.y;
        game.player.animating = true;
        game.player.canMove = false;
        game.player.animationProgress = 0;
        logMessage("You move backward.");
    } else {
        if (collision === 'wall') logMessage("You bump into a wall.", 'combat');
        else if (collision === 'door') logMessage("The door is closed.", 'combat');
        else if (collision === 'monster') logMessage("A monster blocks your way.", 'combat');
        else if (collision === 'water') logMessage("The water is too deep to cross.", 'combat');
    }
}

// Rotate player by 90 degrees
export function rotatePlayer(direction) {
    if (!game.player.canMove || game.player.animating) return;
    
    // Update facing direction (0=north, 1=east, 2=south, 3=west)
    game.player.facing = (game.player.facing + direction + 4) % 4;
    
    // Store start rotation for smooth interpolation
    game.player.startRotation = game.player.rotation.y;
    
    // Update target rotation (0=north, PI/2=west, PI=south, -PI/2=east)
    game.player.targetRotation = -game.player.facing * Math.PI / 2;
    
    game.player.animating = true;
    game.player.canMove = false;
    game.player.animationProgress = 0;
    
    if (direction === 1) logMessage("You turn right.");
    else logMessage("You turn left.");
}

// Wait/skip a turn
export function waitTurn() {
    if (!game.player.canMove || game.player.animating) return;
    
    logMessage("You wait a moment.");
    advanceTurn();
    game.player.canMove = false;
    
    // Just pause briefly to simulate passing time
    setTimeout(() => { 
        if (game.player.health > 0 && !game.won) {
            game.player.canMove = true; 
        }
    }, 200);
}

// Player attacks monster in front
// Interact with nearby door (open/close)
export function playerAttack() {
    if (!game.player.canMove || game.player.animating) return;
    
    advanceTurn();
    game.player.canMove = false;
    
    const cellSize = game.dungeon.cellSize;
    const playerGridX = Math.floor(game.player.position.x / cellSize);
    const playerGridZ = Math.floor(game.player.position.z / cellSize);
    
    // Calculate grid position in front of player
    let targetGridX = playerGridX;
    let targetGridZ = playerGridZ;
    
    switch(game.player.facing) {
        case 0: // North
            targetGridZ--;
            break;
        case 1: // East
            targetGridX++;
            break;
        case 2: // South
            targetGridZ++;
            break;
        case 3: // West
            targetGridX--;
            break;
    }
    
    // Check if there's a monster at that position
    let targetMonster = null;
    for (let monster of game.monsters) {
        if (monster.gridX === targetGridX && monster.gridY === targetGridZ) {
            targetMonster = monster;
            break;
        }
    }
    
    if (targetMonster) {
        // Deal damage
        targetMonster.health -= game.player.attackPower;
        targetMonster.isAggro = true;
        logMessage(`You hit the ${targetMonster.type} for ${game.player.attackPower} damage!`, 'combat');
        
        // Add blood stain at monster position (only for creatures that bleed)
        if (monsterShouldBleed(targetMonster.type)) {
            const monsterWorldX = targetMonster.gridX * cellSize + cellSize / 2;
            const monsterWorldZ = targetMonster.gridY * cellSize + cellSize / 2;
            const bloodSize = getMonsterBloodSize(targetMonster.type);
            createBloodStain(monsterWorldX, monsterWorldZ, bloodSize);
        }
        
        // Visual feedback - flash the monster
        const originalColor = targetMonster.body.material ? 
            targetMonster.body.material.color.getHex() : null;
        
        if (targetMonster.body.material) {
            targetMonster.body.material.color.setHex(0xffffff);
            setTimeout(() => {
                if (targetMonster.body.material) {
                    targetMonster.body.material.color.setHex(originalColor);
                }
            }, 100);
        }
        
        // Check if monster died
        if (targetMonster.health <= 0) {
            logMessage(`You killed the ${targetMonster.type}!`, 'monster-die');
            
            // Drop torch if monster had one
            if (targetMonster.hasTorch) {
                createTreasure(targetMonster.gridX, targetMonster.gridY, TREASURE_TYPES.TORCH);
                logMessage(`The ${targetMonster.type} dropped a torch!`, 'item');
            }
            // Drop treasure (30% chance)
            else if (Math.random() < 0.3) {
                const dropGridX = targetMonster.gridX;
                const dropGridY = targetMonster.gridY;
                
                // Determine treasure type based on random chance
                let treasureType;
                const roll = Math.random();
                if (roll < 0.15) {
                    treasureType = TREASURE_TYPES.CHEST; // 15% chance
                } else if (roll < 0.45) {
                    treasureType = TREASURE_TYPES.GEM; // 30% chance
                } else if (roll < 0.75) {
                    treasureType = TREASURE_TYPES.TRINKET; // 30% chance
                } else {
                    treasureType = TREASURE_TYPES.GOLD_COIN; // 25% chance
                }
                
                createTreasure(dropGridX, dropGridY, treasureType);
            }
            
            // Remove monster
            game.scene.remove(targetMonster.mesh);
            const index = game.monsters.indexOf(targetMonster);
            if (index > -1) {
                game.monsters.splice(index, 1);
            }
            
            // Check if we need to spawn more monsters
            checkAndSpawnMonsters();
        }
    }
    
    setTimeout(() => { 
        if (game.player.health > 0 && !game.won) {
            game.player.canMove = true;
        }
        updateHealthDisplay();
    }, 200);
}
export function updatePlayer(deltaTime) {
    // Handle smooth animation
    if (game.player.animating) {
        game.player.animationProgress += deltaTime / game.player.animationDuration;
        
        if (game.player.animationProgress >= 1.0) {
            // Animation complete
            game.player.animationProgress = 1.0;
            game.player.animating = false;
            
            // Only restore movement if player is alive and hasn't won
            if (game.player.health > 0 && !game.won) {
                game.player.canMove = true;
            }
            
            game.player.rotation.y = game.player.targetRotation;
        }
        
        // Smooth easing function (ease-in-out)
        const t = game.player.animationProgress;
        const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        
        // Interpolate position
        game.player.position.lerpVectors(
            game.player.position,
            game.player.targetPosition,
            easedT
        );
        
        // Interpolate rotation using shortest path
        const startRotation = game.player.startRotation;
        const targetRotation = game.player.targetRotation;
        
        // Calculate the shortest angular distance
        let angleDiff = targetRotation - startRotation;
        // Normalize to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        game.player.rotation.y = startRotation + angleDiff * easedT;
    }
    
    // Adjust player Y position to match floor height
    const floorHeight = getFloorHeight(game.player.position.x, game.player.position.z, dungeonMap);
    // Add small bobbing effect similar to monsters/items but subtler
    // Or just strictly follow floor. User asked "follow the floor height".
    // I will stick to strictly follow plus height.
    game.player.position.y = floorHeight + game.player.height;

    // Update camera position and rotation
    game.camera.position.copy(game.player.position);
    game.camera.rotation.order = 'YXZ';
    game.camera.rotation.y = game.player.rotation.y;
    game.camera.rotation.x = game.player.rotation.x;
    
    // Update player light position and flicker
    if (game.player.light && game.player.torch) {
        const time = Date.now() * 0.005 + game.player.torch.timeOffset;
        
        // Flicker intensity
        const flicker = Math.sin(time * 2.0) * 0.1 + 
                        Math.sin(time * 5.3) * 0.05 + 
                        Math.sin(time * 11.7) * 0.02;
                        
        // Get settings
        const settings = game.lightSettings ? game.lightSettings.playerTorch : { intensity: 2.0, distance: 18, enabled: true };
        const fadeFactor = game.player.torch.fadeFactor !== undefined ? game.player.torch.fadeFactor : 1.0;
        
        if (settings.enabled === false) {
            game.player.light.intensity = 0;
            game.player.light.distance = 0;
        } else {
            // Apply settings with fade and flicker
            game.player.light.intensity = (settings.intensity * fadeFactor) + (flicker * game.player.torch.intensityVar);
            game.player.light.distance = (settings.distance * fadeFactor) + (flicker * game.player.torch.rangeVar);
        }
        
        // Ensure non-negative
        game.player.light.intensity = Math.max(0, game.player.light.intensity);
        game.player.light.distance = Math.max(0, game.player.light.distance);
        
        // Slight position wobble to simulate holding it
        const wobbleX = Math.sin(time * 1.5) * 0.02;
        const wobbleY = Math.cos(time * 2.3) * 0.02;
        const wobbleZ = Math.sin(time * 3.7) * 0.02;
        
        // Update position relative to camera (base offset + wobble)
        game.player.light.position.set(
            0.3 + wobbleX, 
            -0.1 + wobbleY, 
            -0.2 + wobbleZ
        );
    }
    // No else block needed as light is attached to camera
}

// Strafe left
export function strafeLeft() {
    if (!game.player.canMove || game.player.animating) return;
    
    const cellSize = game.dungeon.cellSize;
    const newPosition = game.player.position.clone();
    
    // Calculate left direction based on facing
    switch(game.player.facing) {
        case 0: // North -> West
            newPosition.x -= cellSize;
            break;
        case 1: // East -> North
            newPosition.z -= cellSize;
            break;
        case 2: // South -> East
            newPosition.x += cellSize;
            break;
        case 3: // West -> South
            newPosition.z += cellSize;
            break;
    }
    
    // Check collision before moving
    const collision = checkCollision(newPosition);
    if (!collision) {
        advanceTurn();
        game.player.targetPosition.copy(newPosition);
        game.player.startRotation = game.player.rotation.y;
        game.player.targetRotation = game.player.rotation.y;
        game.player.animating = true;
        game.player.canMove = false;
        game.player.animationProgress = 0;
        logMessage("You strafe left.");
    } else {
        if (collision === 'wall') logMessage("You bump into a wall.", 'combat');
        else if (collision === 'door') logMessage("The door is closed.", 'combat');
        else if (collision === 'monster') logMessage("A monster blocks your way.", 'combat');
        else if (collision === 'water') logMessage("The water is too deep to cross.", 'combat');
    }
}

// Strafe right
export function strafeRight() {
    if (!game.player.canMove || game.player.animating) return;
    
    const cellSize = game.dungeon.cellSize;
    const newPosition = game.player.position.clone();
    
    // Calculate right direction based on facing
    switch(game.player.facing) {
        case 0: // North -> East
            newPosition.x += cellSize;
            break;
        case 1: // East -> South
            newPosition.z += cellSize;
            break;
        case 2: // South -> West
            newPosition.x -= cellSize;
            break;
        case 3: // West -> North
            newPosition.z -= cellSize;
            break;
    }
    
    // Check collision before moving
    const collision = checkCollision(newPosition);
    if (!collision) {
        advanceTurn();
        game.player.targetPosition.copy(newPosition);
        game.player.startRotation = game.player.rotation.y;
        game.player.targetRotation = game.player.rotation.y;
        game.player.animating = true;
        game.player.canMove = false;
        game.player.animationProgress = 0;
        logMessage("You strafe right.");
    } else {
        if (collision === 'wall') logMessage("You bump into a wall.", 'combat');
        else if (collision === 'door') logMessage("The door is closed.", 'combat');
        else if (collision === 'monster') logMessage("A monster blocks your way.", 'combat');
        else if (collision === 'water') logMessage("The water is too deep to cross.", 'combat');
    }
}
