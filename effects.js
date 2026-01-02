import { game } from './state.js';
import { MONSTER_TYPES } from './entities/monster.js';

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
    const cellSize = game.dungeon.cellSize;
    
    // Create blood stain texture on canvas
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Random blood color variation (dark red to brownish)
    const colorVariation = Math.random();
    let bloodColor;
    if (colorVariation < 0.7) {
        bloodColor = '#4a0a0a'; // Dark red
    } else {
        bloodColor = '#3a1010'; // Brownish dark red
    }
    
    // Create irregular blood stain shape (affected by size multiplier)
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = (20 + Math.random() * 30) * Math.sqrt(sizeMultiplier); // Scale with square root for better visual
    
    // Main stain blob
    ctx.fillStyle = bloodColor;
    ctx.beginPath();
    const numPoints = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const radiusVariation = 0.5 + Math.random() * 0.8;
        const radius = baseRadius * radiusVariation;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
    
    // Add some splatter droplets around the main stain (more for larger creatures)
    const numSplatters = Math.floor((3 + Math.floor(Math.random() * 8)) * sizeMultiplier);
    for (let i = 0; i < numSplatters; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = baseRadius + Math.random() * 20 * Math.sqrt(sizeMultiplier);
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        const radius = (1 + Math.random() * 4) * Math.sqrt(sizeMultiplier);
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Sometimes add a streak from the splatter
        if (Math.random() < 0.4) {
            const streakLength = (3 + Math.random() * 8) * Math.sqrt(sizeMultiplier);
            const streakAngle = angle + (Math.random() - 0.5) * 0.5;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + Math.cos(streakAngle) * streakLength,
                y + Math.sin(streakAngle) * streakLength
            );
            ctx.lineWidth = (0.5 + Math.random() * 1.5) * Math.sqrt(sizeMultiplier);
            ctx.strokeStyle = bloodColor;
            ctx.stroke();
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create floor decal (size affected by multiplier)
    const stainSize = (0.8 + Math.random() * 0.7) * sizeMultiplier;
    const geometry = new THREE.PlaneGeometry(stainSize, stainSize);
    
    // Use Standard material so it reacts to light (dark in darkness)
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: 0.7 + Math.random() * 0.2,
        roughness: 0.2,
        metalness: 0.1,
        depthWrite: false
    });
    
    const stain = new THREE.Mesh(geometry, material);
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(worldX, 0.02, worldZ); // Slightly above floor to avoid z-fighting
    stain.rotation.z = Math.random() * Math.PI * 2; // Random rotation
    stain.receiveShadow = true; // Receive shadows so it doesn't glow in the dark/through walls
    
    game.scene.add(stain);
    
    // Store in decorations array for potential cleanup
    game.decorations.push({
        mesh: stain,
        type: 'blood_stain'
    });
    
    // Maybe also add wall splatter if near a wall (more likely for larger creatures)
    if (Math.random() < 0.3 * sizeMultiplier) {
        const gridX = Math.floor(worldX / cellSize);
        const gridY = Math.floor(worldZ / cellSize);
        
        // Check for nearby walls
        const walls = [
            { dx: 0, dy: -1, normal: 0 }, // North
            { dx: 1, dy: 0, normal: 1 },  // East
            { dx: 0, dy: 1, normal: 2 },  // South
            { dx: -1, dy: 0, normal: 3 }  // West
        ];
        
        for (let wall of walls) {
            const checkX = gridX + wall.dx;
            const checkY = gridY + wall.dy;
            
            if (checkX >= 0 && checkX < game.dungeon.gridWidth &&
                checkY >= 0 && checkY < game.dungeon.gridHeight &&
                game.dungeon.grid[checkY][checkX] === 1) {
                
                // Create smaller blood splatter on wall
                const wallCanvas = document.createElement('canvas');
                wallCanvas.width = 64;
                wallCanvas.height = 64;
                const wallCtx = wallCanvas.getContext('2d');
                
                // Create splatter pattern
                wallCtx.fillStyle = bloodColor;
                const numDrops = 3 + Math.floor(Math.random() * 5);
                for (let i = 0; i < numDrops; i++) {
                    const x = 32 + (Math.random() - 0.5) * 30;
                    const y = 20 + Math.random() * 20;
                    const radius = 1 + Math.random() * 3;
                    
                    wallCtx.beginPath();
                    wallCtx.arc(x, y, radius, 0, Math.PI * 2);
                    wallCtx.fill();
                    
                    // Add drip
                    if (Math.random() < 0.6) {
                        const dripLength = 5 + Math.random() * 15;
                        wallCtx.fillRect(x - 0.5, y, 1, dripLength);
                    }
                }
                
                const wallTexture = new THREE.CanvasTexture(wallCanvas);
                const wallGeometry = new THREE.PlaneGeometry(0.5, 0.5);
                const wallMaterial = new THREE.MeshBasicMaterial({
                    map: wallTexture,
                    transparent: true,
                    opacity: 0.6,
                    depthWrite: false
                });
                
                const wallSplatter = new THREE.Mesh(wallGeometry, wallMaterial);
                
                // Position on wall
                const wallCenterX = checkX * cellSize + cellSize / 2;
                const wallCenterZ = checkY * cellSize + cellSize / 2;
                
                switch(wall.normal) {
                    case 0: // North wall
                        wallSplatter.position.set(worldX, 0.3 + Math.random() * 0.5, wallCenterZ + cellSize / 2 * 0.85);
                        wallSplatter.rotation.y = 0;
                        break;
                    case 1: // East wall
                        wallSplatter.position.set(wallCenterX - cellSize / 2 * 0.85, 0.3 + Math.random() * 0.5, worldZ);
                        wallSplatter.rotation.y = -Math.PI / 2;
                        break;
                    case 2: // South wall
                        wallSplatter.position.set(worldX, 0.3 + Math.random() * 0.5, wallCenterZ - cellSize / 2 * 0.85);
                        wallSplatter.rotation.y = Math.PI;
                        break;
                    case 3: // West wall
                        wallSplatter.position.set(wallCenterX + cellSize / 2 * 0.85, 0.3 + Math.random() * 0.5, worldZ);
                        wallSplatter.rotation.y = Math.PI / 2;
                        break;
                }
                
                game.scene.add(wallSplatter);
                game.decorations.push({
                    mesh: wallSplatter,
                    type: 'blood_stain'
                });
                
                break; // Only add to one wall
            }
        }
    }
}
