import { 
    createFloorTexture, 
    createCeilingTexture, 
    createWallTexture, 
    createWoodTexture,
    createFrameTexture,
    createPanelTexture
} from './textureGenerator.js';

export function createDungeonVisuals(dungeonMap, theme, cellSize) {
    const width = dungeonMap[0].length;
    const height = dungeonMap.length;
    const visuals = {
        floor: null,
        ceiling: null,
        walls: [], // Array of meshes
        wallData: [] // Array of {position, width, height} for collision
    };

    // Create floor
    const floorTexture = createFloorTexture(width, height, theme);
    
    // Use higher segment count for natural caves to allow displacement
    const floorSegmentsX = theme.noTiles ? width * 4 : 1;
    const floorSegmentsZ = theme.noTiles ? height * 4 : 1;
    
    const floorGeometry = new THREE.PlaneGeometry(
        width * cellSize,
        height * cellSize,
        floorSegmentsX,
        floorSegmentsZ
    );
    
    // Displace floor vertices for natural look
    if (theme.noTiles) {
        const pos = floorGeometry.attributes.position;
        const totalWidth = width * cellSize;
        const totalHeight = height * cellSize;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i); // Local Y (World Z)
            
            // Calculate Grid Coordinates
            const wx = x + totalWidth / 2;
            const wy = -y + totalHeight / 2;
            
            const gridX = Math.floor(wx / cellSize);
            const gridY = Math.floor(wy / cellSize);
            
            let isWater = false;
            let isNearWater = false;
            
            // Check current cell
            if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
                const cellType = dungeonMap[gridY][gridX];
                if (cellType === 2) {
                    isWater = true;
                }
                
                // Check neighbors for proximity to water
                const localX = wx % cellSize;
                const localY = wy % cellSize;
                const margin = cellSize * 0.4; // Influence radius
                
                const checkNeighbor = (dx, dy) => {
                    if (gridX + dx >= 0 && gridX + dx < width && gridY + dy >= 0 && gridY + dy < height) {
                        const type = dungeonMap[gridY+dy][gridX+dx];
                        if (type === 2) return 'water';
                    }
                    return null;
                };

                const neighbors = [
                    { dx: -1, dy: 0, cond: localX < margin },
                    { dx: 1, dy: 0, cond: localX > cellSize - margin },
                    { dx: 0, dy: -1, cond: localY < margin },
                    { dx: 0, dy: 1, cond: localY > cellSize - margin },
                    // Diagonals
                    { dx: -1, dy: -1, cond: localX < margin && localY < margin },
                    { dx: 1, dy: -1, cond: localX > cellSize - margin && localY < margin },
                    { dx: -1, dy: 1, cond: localX < margin && localY > cellSize - margin },
                    { dx: 1, dy: 1, cond: localX > cellSize - margin && localY > cellSize - margin }
                ];

                for (const n of neighbors) {
                    if (n.cond) {
                        const type = checkNeighbor(n.dx, n.dy);
                        if (type === 'water') isNearWater = true;
                    }
                }
            }
            
            if (isWater) {
                // Deep seabed
                pos.setZ(i, -1.5);
            } else if (isNearWater) {
                // Shoreline - slope down
                // Use a lower height to ensure it goes under water
                // Add some noise but keep it low
                let z = -0.5 + (Math.random() * 0.2);
                pos.setZ(i, z);
            } else {
                // Land
                // Noise for uneven ground
                let z = 0;
                z += Math.sin(x * 0.2) * 0.15;
                z += Math.cos(y * 0.2) * 0.15;
                z += Math.sin(x * 0.5 + y * 0.5) * 0.05;
                z += (Math.random() - 0.5) * 0.05;
                
                pos.setZ(i, z);
            }
        }
        floorGeometry.computeVertexNormals();
    }

    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        color: 0xaaaaaa,
        roughness: 0.9,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.position.x = (width * cellSize) / 2;
    floor.position.z = (height * cellSize) / 2;
    floor.receiveShadow = true;
    visuals.floor = floor;
    
    // Create ceiling with natural rock structure
    const ceilingSegmentsX = width * 6; 
    const ceilingSegmentsZ = height * 6;
    const ceilingGeometry = new THREE.PlaneGeometry(
        width * cellSize,
        height * cellSize,
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

    const ceilingTexture = createCeilingTexture(width, height, theme);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        map: ceilingTexture,
        color: 0xaaaaaa,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4.0; // Base height at top of walls
    ceiling.position.x = (width * cellSize) / 2;
    ceiling.position.z = (height * cellSize) / 2;
    ceiling.receiveShadow = true;
    visuals.ceiling = ceiling;
    
    // Create walls based on map
    const wallTexture = createWallTexture(theme);
    
    // For natural caves, use more segments and displace vertices
    const wallSegments = theme.noTiles ? 4 : 1;
    const wallGeometry = new THREE.BoxGeometry(
        cellSize * 1.1, 
        6, 
        cellSize * 1.1,
        wallSegments,
        wallSegments,
        wallSegments
    );
    
    if (theme.noTiles) {
        const pos = wallGeometry.attributes.position;
        const center = new THREE.Vector3(); // Box center is 0,0,0
        
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            
            // Skip top and bottom faces to keep them flat-ish for stacking/ceiling
            if (Math.abs(y) > 2.9) continue;
            
            // Noise based on position
            const noise = (Math.sin(x * 2.0) + Math.cos(y * 1.5) + Math.sin(z * 2.0)) * 0.15;
            const random = (Math.random() - 0.5) * 0.1;
            
            // Push vertices out/in slightly along their normal (approximate)
            // Since it's a box centered at 0, normal is roughly direction from center
            // But for simple roughness, just adding to x/z is enough
            
            // We want "jagged" rock, so sharp changes
            if (Math.abs(x) > cellSize * 0.4) { // Side faces (East/West)
                pos.setX(i, x + noise + random);
            }
            if (Math.abs(z) > cellSize * 0.4) { // Front/Back faces (North/South)
                pos.setZ(i, z + noise + random);
            }
        }
        wallGeometry.computeVertexNormals();
    }

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        color: 0xffffff,
        roughness: 0.95,
        metalness: 0.0
    });
    
    // Count walls
    let wallCount = 0;
    for (let y = 0; y < dungeonMap.length; y++) {
        for (let x = 0; x < dungeonMap[y].length; x++) {
            if (dungeonMap[y][x] === 1) wallCount++;
        }
    }

    // Create InstancedMesh
    const wallMesh = new THREE.InstancedMesh(wallGeometry, wallMaterial, wallCount);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    
    const dummy = new THREE.Object3D();
    let index = 0;
    
    for (let y = 0; y < dungeonMap.length; y++) {
        for (let x = 0; x < dungeonMap[y].length; x++) {
            if (dungeonMap[y][x] === 1) {
                dummy.position.set(
                    x * cellSize + cellSize / 2,
                    3, // Raised center
                    y * cellSize + cellSize / 2
                );
                dummy.updateMatrix();
                wallMesh.setMatrixAt(index++, dummy.matrix);
                
                // Keep wallData for collision (though we should optimize collision too)
                visuals.wallData.push({
                    position: dummy.position.clone(),
                    width: cellSize,
                    height: cellSize
                });
            }
        }
    }
    
    visuals.walls = [wallMesh]; // Return as array containing single mesh for compatibility
    
    // Create Water (Type 2)
    const waterGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x004488,
        transparent: true,
        opacity: 0.5, // Reduced opacity to see fish
        roughness: 0.1,
        metalness: 0.8,
        emissive: 0x001133,
        emissiveIntensity: 0.2,
        depthWrite: false
    });
    
    // Create Seabed (to hide floor tiles and simulate depth)
    const seabedMaterial = new THREE.MeshBasicMaterial({
        color: 0x000510, // Very dark blue/black
    });

    // Count water tiles
    let waterCount = 0;
    for (let y = 0; y < dungeonMap.length; y++) {
        for (let x = 0; x < dungeonMap[y].length; x++) {
            if (dungeonMap[y][x] === 2) waterCount++;
        }
    }
    
    if (waterCount > 0) {
        // Water Surface
        const waterMesh = new THREE.InstancedMesh(waterGeometry, waterMaterial, waterCount);
        waterMesh.receiveShadow = true;
        
        // Seabed
        const seabedMesh = new THREE.InstancedMesh(waterGeometry, seabedMaterial, waterCount);

        let wIndex = 0;
        for (let y = 0; y < dungeonMap.length; y++) {
            for (let x = 0; x < dungeonMap[y].length; x++) {
                if (dungeonMap[y][x] === 2) {
                    // Water Surface
                    dummy.position.set(
                        x * cellSize + cellSize / 2,
                        0.2, // Slightly above floor
                        y * cellSize + cellSize / 2
                    );
                    dummy.rotation.set(-Math.PI / 2, 0, 0);
                    dummy.scale.set(1, 1, 1);
                    dummy.updateMatrix();
                    waterMesh.setMatrixAt(wIndex, dummy.matrix);
                    
                    // Seabed (just above floor to cover it)
                    // For natural caves (noTiles), the floor is displaced to -1.5 for water
                    // So we place the seabed just above that to avoid z-fighting but keep it deep
                    dummy.position.y = -1.45;
                    dummy.updateMatrix();
                    seabedMesh.setMatrixAt(wIndex, dummy.matrix);
                    
                    wIndex++;
                }
            }
        }
        // Reset rotation for other uses of dummy if any (none here but good practice)
        dummy.rotation.set(0, 0, 0);
        
        visuals.walls.push(seabedMesh); // Add seabed first
        visuals.walls.push(waterMesh); // Add water surface
    }


    // Reset rotation/scale of dummy
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);

    return visuals;
}

export function createDoorVisuals(gridX, gridY, orientation, cellSize) {
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

    return {
        mesh: frameGroup,
        doorPanel: doorPivot
    };
}

export function createStartingInscriptionVisuals(playerGridX, playerGridY, cellSize, dungeonMap) {
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
            ctx.fillStyle = '#2a0505';
            ctx.globalAlpha = 0.8;
            ctx.fillText(line, size / 2, y + 2);
            
            // Bright blood layer with irregular strokes
            ctx.fillStyle = '#4a0a0a';
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
            ctx.fillStyle = '#3a0808';
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
                ctx.strokeStyle = '#3a0808';
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
        
        return inscription;
    }
    return null;
}
