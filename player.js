import { game } from './state.js';
import { checkCollision, advanceTurn, checkAndSpawnMonsters } from './gameLoop.js';
import { logMessage, updateHealthDisplay } from './ui.js';
import { monsterShouldBleed, getMonsterBloodSize, createBloodStain } from './effects.js';
import { createTreasure, TREASURE_TYPES } from './items.js';

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
            
            return; // Only interact with one door
        }
    }
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
                        
        game.player.light.intensity = game.player.torch.intensityBase + flicker * game.player.torch.intensityVar;
        game.player.light.distance = game.player.torch.rangeBase + flicker * game.player.torch.rangeVar;
        
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

    // Check for win condition (Ladder)
    if (game.ladderPosition && !game.won) {
        const cellSize = game.dungeon.cellSize;
        const playerGridX = Math.floor(game.player.position.x / cellSize);
        const playerGridZ = Math.floor(game.player.position.z / cellSize);
        
        if (playerGridX === game.ladderPosition.x && playerGridZ === game.ladderPosition.y) {
            game.won = true;
            game.player.canMove = false;
            
            // Show win screen
            setTimeout(() => {
                const winScreen = document.getElementById('win-screen');
                if (winScreen) {
                    winScreen.style.display = 'flex';
                    
                    // Add key listener to reload
                    const reloadHandler = (e) => {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        location.reload();
                    };
                    
                    // Small delay before allowing reload to prevent accidental skips
                    setTimeout(() => {
                        document.addEventListener('keydown', reloadHandler, { once: true });
                        document.addEventListener('click', reloadHandler, { once: true });
                    }, 1000);
                }
            }, 500);
        }
    }
}
