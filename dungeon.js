import { game, dungeonMap } from './state.js';
import { 
    createFloorTexture, 
    createCeilingTexture, 
    createWallTexture, 
    createWoodTexture, 
    createFrameTexture, 
    createPanelTexture 
} from './utils.js';

export function generateDungeon() {
    const cellSize = game.dungeon.cellSize;
    
    // Create floor
    const floorTexture = createFloorTexture(game.dungeon.width, game.dungeon.height);
    const floorGeometry = new THREE.PlaneGeometry(
        game.dungeon.width * cellSize,
        game.dungeon.height * cellSize
    );
    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        color: 0xaaaaaa,
        roughness: 0.9,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.position.x = (game.dungeon.width * cellSize) / 2;
    floor.position.z = (game.dungeon.height * cellSize) / 2;
    floor.receiveShadow = true;
    game.scene.add(floor);
    
    // Create ceiling with natural rock structure
    const ceilingSegmentsX = game.dungeon.width * 6; 
    const ceilingSegmentsZ = game.dungeon.height * 6;
    const ceilingGeometry = new THREE.PlaneGeometry(
        game.dungeon.width * cellSize,
        game.dungeon.height * cellSize,
        ceilingSegmentsX,
        ceilingSegmentsZ
    );

    // Displace vertices to create rock shape
    const positionAttribute = ceilingGeometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i); // Corresponds to world Z
        
        // Create organic noise
        let z = 0;
        z += Math.sin(x * 0.1) * 0.5;
        z += Math.cos(y * 0.1) * 0.5;
        z += Math.sin(x * 0.3 + y * 0.2) * 0.3;
        z += Math.cos(y * 0.3 - x * 0.2) * 0.3;
        z += (Math.random() - 0.5) * 0.2;
        z -= 0.5; // Move up by default
        
        positionAttribute.setZ(i, z);
    }
    ceilingGeometry.computeVertexNormals();

    const ceilingTexture = createCeilingTexture(game.dungeon.width, game.dungeon.height);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        map: ceilingTexture,
        color: 0xaaaaaa,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4.0; // Base height at top of walls
    ceiling.position.x = (game.dungeon.width * cellSize) / 2;
    ceiling.position.z = (game.dungeon.height * cellSize) / 2;
    ceiling.receiveShadow = true;
    game.scene.add(ceiling);
    
    // Create walls based on map
    const wallTexture = createWallTexture();
    const wallGeometry = new THREE.BoxGeometry(cellSize * 1.1, 6, cellSize * 1.1);
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        color: 0xffffff,
        roughness: 0.95,
        metalness: 0.0
    });
    
    for (let y = 0; y < dungeonMap.length; y++) {
        for (let x = 0; x < dungeonMap[y].length; x++) {
            if (dungeonMap[y][x] === 1) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.x = x * cellSize + cellSize / 2;
                wall.position.y = 3; // Raised center to account for height 6 (0 to 6)
                wall.position.z = y * cellSize + cellSize / 2;
                wall.castShadow = true;
                wall.receiveShadow = true;
                game.scene.add(wall);
                game.dungeon.walls.push({
                    position: wall.position,
                    width: cellSize,
                    height: cellSize
                });
                game.dungeon.wallMeshes.push(wall);
            }
        }
    }
    
    // Store grid for collision detection
    game.dungeon.grid = dungeonMap;
    game.dungeon.gridWidth = dungeonMap[0].length;
    game.dungeon.gridHeight = dungeonMap.length;
}

export function createDoor(gridX, gridY, orientation) {
    const cellSize = game.dungeon.cellSize;
    const worldX = gridX * cellSize + cellSize / 2;
    const worldZ = gridY * cellSize + cellSize / 2;
    
    const doorOpeningWidth = 2.2;
    const doorOpeningHeight = 3.0;
    const frameDepth = 0.4;
    const doorThickness = 0.15;
    const ceilingHeight = 4.0;
    const corridorWidth = cellSize; // 4.0
    
    const frameGroup = new THREE.Group();
    
    const woodTexture = createWoodTexture();
    const frameTexture = createFrameTexture();
    const panelTexture = createPanelTexture();
    
    // Materials
    const frameMaterial = new THREE.MeshStandardMaterial({
        map: frameTexture,
        roughness: 0.85,
        metalness: 0.05
    });
    
    const wallPanelMaterial = new THREE.MeshStandardMaterial({
        map: panelTexture,
        roughness: 0.9,
        metalness: 0.05
    });
    
    const doorMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.9,
        metalness: 0.05
    });
    
    // === FRAME STRUCTURE (extends to walls) ===
    
    // Left vertical frame post
    const leftPost = new THREE.Mesh(
        new THREE.BoxGeometry(frameDepth, ceilingHeight, frameDepth),
        frameMaterial
    );
    leftPost.position.set(-doorOpeningWidth / 2 - frameDepth / 2, ceilingHeight / 2, 0);
    frameGroup.add(leftPost);
    
    // Right vertical frame post
    const rightPost = new THREE.Mesh(
        new THREE.BoxGeometry(frameDepth, ceilingHeight, frameDepth),
        frameMaterial
    );
    rightPost.position.set(doorOpeningWidth / 2 + frameDepth / 2, ceilingHeight / 2, 0);
    frameGroup.add(rightPost);
    
    // Top horizontal frame beam (above door opening)
    const topBeam = new THREE.Mesh(
        new THREE.BoxGeometry(doorOpeningWidth, frameDepth, frameDepth),
        frameMaterial
    );
    topBeam.position.set(0, doorOpeningHeight + frameDepth / 2, 0);
    frameGroup.add(topBeam);
    
    // === WALL PANELS (fill gaps to walls and ceiling) ===
    
    // Calculate gap from frame to walls
    const sideGapWidth = (corridorWidth - doorOpeningWidth - frameDepth * 2) / 2;
    
    if (sideGapWidth > 0.01) {
        // Left wall panel (full height)
        const leftWallPanel = new THREE.Mesh(
            new THREE.BoxGeometry(sideGapWidth, ceilingHeight, doorThickness),
            wallPanelMaterial
        );
        leftWallPanel.position.set(
            -doorOpeningWidth / 2 - frameDepth - sideGapWidth / 2,
            ceilingHeight / 2,
            0
        );
        frameGroup.add(leftWallPanel);
        
        // Right wall panel (full height)
        const rightWallPanel = new THREE.Mesh(
            new THREE.BoxGeometry(sideGapWidth, ceilingHeight, doorThickness),
            wallPanelMaterial
        );
        rightWallPanel.position.set(
            doorOpeningWidth / 2 + frameDepth + sideGapWidth / 2,
            ceilingHeight / 2,
            0
        );
        frameGroup.add(rightWallPanel);
    }
    
    // Top wall panel (fills space above door frame to ceiling)
    const topPanelHeight = ceilingHeight - doorOpeningHeight - frameDepth;
    if (topPanelHeight > 0.01) {
        const topWallPanel = new THREE.Mesh(
            new THREE.BoxGeometry(doorOpeningWidth, topPanelHeight, doorThickness),
            wallPanelMaterial
        );
        topWallPanel.position.set(
            0,
            doorOpeningHeight + frameDepth + topPanelHeight / 2,
            0
        );
        frameGroup.add(topWallPanel);
    }
    
    // === DOOR PANEL (fits inside frame opening) ===
    
    const actualDoorWidth = doorOpeningWidth - 0.05; // Slightly smaller than opening
    const actualDoorHeight = doorOpeningHeight - 0.05; // Slightly smaller than opening
    
    // Create pivot group for door rotation (at left edge of opening)
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-doorOpeningWidth / 2, 0, frameDepth / 2 + doorThickness / 2);
    
    // Create door mesh
    const doorGeom = new THREE.BoxGeometry(actualDoorWidth, actualDoorHeight, doorThickness);
    const doorMesh = new THREE.Mesh(doorGeom, doorMaterial);
    
    // Position door relative to pivot (extends to the right)
    doorMesh.position.set(actualDoorWidth / 2, actualDoorHeight / 2, 0);
    
    // Add wooden plank details (FRONT side)
    const plankCount = 5;
    for (let i = 0; i < plankCount; i++) {
        const plank = new THREE.Mesh(
            new THREE.BoxGeometry(actualDoorWidth * 0.9, 0.03, doorThickness + 0.01),
            new THREE.MeshStandardMaterial({ color: 0x4d3416, roughness: 0.9 })
        );
        // Position relative to doorMesh center (which is at actualDoorHeight/2 in world coords)
        const yPos = ((i + 0.5) / plankCount - 0.5) * actualDoorHeight;
        plank.position.set(0, yPos, doorThickness / 2 + 0.005);
        doorMesh.add(plank);
    }
    
    // Add wooden plank details (BACK side)
    for (let i = 0; i < plankCount; i++) {
        const plankBack = new THREE.Mesh(
            new THREE.BoxGeometry(actualDoorWidth * 0.9, 0.03, doorThickness + 0.01),
            new THREE.MeshStandardMaterial({ color: 0x4d3416, roughness: 0.9 })
        );
        const yPos = ((i + 0.5) / plankCount - 0.5) * actualDoorHeight;
        plankBack.position.set(0, yPos, -(doorThickness / 2 + 0.005));
        doorMesh.add(plankBack);
    }
    
    // Add metal bands
    const bandMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.4,
        metalness: 0.8
    });
    
    // Front top band
    const topBand = new THREE.Mesh(
        new THREE.BoxGeometry(actualDoorWidth, 0.12, doorThickness + 0.02),
        bandMaterial
    );
    topBand.position.set(0, actualDoorHeight * 0.3, 0);
    doorMesh.add(topBand);
    
    // Front bottom band
    const bottomBand = new THREE.Mesh(
        new THREE.BoxGeometry(actualDoorWidth, 0.12, doorThickness + 0.02),
        bandMaterial
    );
    bottomBand.position.set(0, -actualDoorHeight * 0.3, 0);
    doorMesh.add(bottomBand);
    
    // Handle (Ring)
    const ringGeom = new THREE.TorusGeometry(0.1, 0.02, 8, 16);
    const ring = new THREE.Mesh(ringGeom, bandMaterial);
    ring.position.set(actualDoorWidth * 0.35, 0, doorThickness / 2 + 0.02);
    ring.rotation.y = Math.PI / 2; // Flat against door
    // Let it hang
    ring.rotation.x = Math.PI / 2; 
    
    // Ring mount
    const mount = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        bandMaterial
    );
    mount.position.set(actualDoorWidth * 0.35, 0.08, doorThickness / 2 + 0.01);
    
    doorMesh.add(ring);
    doorMesh.add(mount);
    
    doorPivot.add(doorMesh);
    frameGroup.add(doorPivot);
    
    // Enable shadows for door parts
    frameGroup.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    // Position and rotate based on orientation
    frameGroup.position.set(worldX, 0, worldZ);
    if (orientation === 'horizontal') {
        frameGroup.rotation.y = Math.PI / 2;
    }
    
    game.scene.add(frameGroup);
    
    // Store door data
    const door = {
        gridX: gridX,
        gridY: gridY,
        orientation: orientation,
        isOpen: false,
        mesh: frameGroup,
        doorPanel: doorPivot,
        worldX: worldX,
        worldZ: worldZ
    };
    
    game.doors.push(door);
}

export function createStartingInscription(playerGridX, playerGridY, cellSize) {
    const message = "ABANDON ALL HOPE\nYE WHO ENTER HERE!";
    
    // Check for wall in front of player (north direction, -Z)
    const checkY = playerGridY - 1;
    const checkX = playerGridX;
    
    if (checkY >= 0 && dungeonMap[checkY][checkX] === 1) {
        // Wall found to the north
        const canvas = document.createElement('canvas');
        const size = 1024; // Larger canvas for better quality
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, size, size);
        
        // Blood-painted text - bright red with texture
        const lines = message.split('\n');
        const lineHeight = 100;
        const startY = (size / 2) - ((lines.length - 1) * lineHeight / 2);
        
        lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            
            // Paint blood texture with multiple layers
            ctx.font = 'bold 80px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Dark base layer (dried blood)
            ctx.fillStyle = '#5a0a0a';
            ctx.globalAlpha = 0.8;
            ctx.fillText(line, size / 2, y + 2);
            
            // Bright blood layer with irregular strokes
            ctx.fillStyle = '#c41010';
            for (let i = 0; i < 8; i++) {
                ctx.globalAlpha = 0.2 + Math.random() * 0.3;
                const offsetX = (Math.random() - 0.5) * 4;
                const offsetY = (Math.random() - 0.5) * 4;
                ctx.fillText(line, size / 2 + offsetX, y + offsetY);
            }
        });
        
        // Add blood splatters
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = 2 + Math.random() * 8;
            ctx.fillStyle = '#8a1010';
            ctx.globalAlpha = 0.3 + Math.random() * 0.4;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Splatter streaks
            for (let j = 0; j < 3; j++) {
                const angle = Math.random() * Math.PI * 2;
                const length = radius * (1 + Math.random() * 2);
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
                ctx.lineWidth = 1 + Math.random() * 2;
                ctx.strokeStyle = '#8a1010';
                ctx.globalAlpha = 0.2 + Math.random() * 0.3;
                ctx.stroke();
            }
        }
        
        // Large blood drips running down
        for (let i = 0; i < 8; i++) {
            const x = size * (0.1 + Math.random() * 0.8);
            const startY = size * (0.3 + Math.random() * 0.3);
            const dripLength = 50 + Math.random() * 150;
            
            ctx.fillStyle = '#8a1010';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.ellipse(x, startY + dripLength, 4, dripLength, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const inscriptionMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        
        // Create much larger plane for dramatic effect
        const planeGeom = new THREE.PlaneGeometry(2.5, 2.0);
        const inscription = new THREE.Mesh(planeGeom, inscriptionMat);
        
        // Position on north wall
        const worldX = playerGridX * cellSize + cellSize / 2;
        const worldZ = playerGridY * cellSize + cellSize / 2;
        
        inscription.position.x = worldX;
        inscription.position.z = worldZ - cellSize / 2 * 0.85; // North wall (moved closer to avoid being inside thicker wall)
        inscription.position.y = 1.8; // Eye level
        inscription.rotation.y = 0; // Face south (toward player)
        
        game.scene.add(inscription);
    }
}
export function spawnDoors() {
    const cellSize = game.dungeon.cellSize;
    
    // Find corridor segments where doors make sense
    for (let y = 1; y < dungeonMap.length - 1; y++) {
        for (let x = 1; x < dungeonMap[y].length - 1; x++) {
            if (dungeonMap[y][x] === 0) { // Walkable cell
                // Check if this is a corridor (walls on two opposite sides)
                const northWall = dungeonMap[y - 1][x] === 1;
                const southWall = dungeonMap[y + 1][x] === 1;
                const eastWall = dungeonMap[y][x + 1] === 1;
                const westWall = dungeonMap[y][x - 1] === 1;
                
                // Vertical corridor (walls east and west)
                if (eastWall && westWall && !northWall && !southWall) {
                    if (Math.random() < 0.15) { // 15% chance
                        createDoor(x, y, 'vertical');
                    }
                }
                // Horizontal corridor (walls north and south)
                else if (northWall && southWall && !eastWall && !westWall) {
                    if (Math.random() < 0.15) { // 15% chance
                        createDoor(x, y, 'horizontal');
                    }
                }
            }
        }
    }
    
    console.log(`Spawned ${game.doors.length} doors`);
}
