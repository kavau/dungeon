import { game, dungeonMap } from './state.js';
import { createDecoration, DECORATION_TYPES } from './entities/decoration.js';
import { clearWaterCreatures } from './entities/waterCreatures.js';
import { LEVEL_CONFIG } from './levelConfig.js';
import { 
    createDungeonVisuals, 
    createDoorVisuals, 
    createStartingInscriptionVisuals 
} from './visuals/dungeonRenderer.js';

export function generateDungeon() {
    const cellSize = game.dungeon.cellSize;
    const level = game.dungeon.level || 1;
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
    const theme = config.theme;
    
    console.log(`Generating Level ${level} with theme: ${config.name}`);

    // Update Fog
    if (game.scene.fog) {
        if (game.player.amuletActive) {
            game.scene.fog.color.setHex(0x220044); // Deep Purple
            game.scene.fog.far = 50;
        } else {
            game.scene.fog.color.setHex(theme.fogColor);
            game.scene.fog.far = theme.fogDist;
        }
    }

    // Update Ambient Light
    if (game.ambientLight) {
        const ambientColor = theme.ambientLight !== undefined ? theme.ambientLight : 0x000000;
        game.ambientLight.color.setHex(ambientColor);
        
        // Use user setting if available, otherwise theme default
        if (game.lightSettings && game.lightSettings.ambient !== undefined) {
            if (typeof game.lightSettings.ambient === 'object') {
                game.ambientLight.intensity = game.lightSettings.ambient.enabled ? game.lightSettings.ambient.intensity : 0;
            } else {
                game.ambientLight.intensity = game.lightSettings.ambient;
            }
        } else {
            const ambientIntensity = theme.ambientIntensity !== undefined ? theme.ambientIntensity : 0.0;
            game.ambientLight.intensity = ambientIntensity;
        }
    }

    // Create visuals
    const visuals = createDungeonVisuals(dungeonMap, theme, cellSize);
    
    // Add to scene
    game.scene.add(visuals.floor);
    game.scene.add(visuals.ceiling);
    visuals.walls.forEach(wall => game.scene.add(wall));
    
    // Store references
    game.dungeon.ceilingMesh = visuals.ceiling;
    game.dungeon.wallMeshes = visuals.walls;
    game.dungeon.walls = visuals.wallData;
    
    // Store grid for collision detection
    game.dungeon.grid = dungeonMap;
    game.dungeon.gridWidth = dungeonMap[0].length;
    game.dungeon.gridHeight = dungeonMap.length;
}

export function createDoor(gridX, gridY, orientation) {
    const cellSize = game.dungeon.cellSize;
    const worldX = gridX * cellSize + cellSize / 2;
    const worldZ = gridY * cellSize + cellSize / 2;
    
    const visuals = createDoorVisuals(gridX, gridY, orientation, cellSize);
    
    game.scene.add(visuals.mesh);

    // Mark specific cell as Door (4) to prevent other spawns
    dungeonMap[gridY][gridX] = 4;
    
    // Store door data
    const door = {
        gridX: gridX,
        gridY: gridY,
        orientation: orientation,
        isOpen: false,
        mesh: visuals.mesh,
        doorPanel: visuals.doorPanel,
        worldX: worldX,
        worldZ: worldZ
    };
    
    game.doors.push(door);
}

export function createStartingInscription(playerGridX, playerGridY, cellSize) {
    const inscription = createStartingInscriptionVisuals(playerGridX, playerGridY, cellSize, dungeonMap);
    
    if (inscription) {
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

export function clearDungeon() {
    // Remove walls
    for (let mesh of game.dungeon.wallMeshes) {
        game.scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
    }
    game.dungeon.walls = [];
    game.dungeon.wallMeshes = [];
    
    // Remove floor and ceiling (find them in scene)
    const toRemove = [];
    game.scene.traverse((child) => {
        if (child.isMesh && (child.geometry.type === 'PlaneGeometry')) {
            // Check if it's floor or ceiling (based on rotation/position)
            // Floor is rotated -PI/2, Ceiling PI/2
            if (Math.abs(child.rotation.x) > 1.0) {
                toRemove.push(child);
            }
        }
    });
    
    for (let child of toRemove) {
        game.scene.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    }
    
    // Remove doors
    for (let door of game.doors) {
        game.scene.remove(door.mesh);
        // doorPanel is a child of mesh (frameGroup), so removing mesh removes it too
        // But we can remove it explicitly if we want to be safe, though it's not strictly necessary if it's a child
        // However, looking at createDoor, doorPivot (doorPanel) is added to frameGroup.
        // So removing frameGroup (door.mesh) is enough.
    }
    game.doors = [];
    
    // Remove monsters
    for (let monster of game.monsters) {
        game.scene.remove(monster.mesh);
    }
    game.monsters = [];
    
    // Remove treasures
    for (let treasure of game.treasures) {
        game.scene.remove(treasure.mesh);
    }
    game.treasures = [];
    
    // Remove decorations
    for (let decoration of game.decorations) {
        game.scene.remove(decoration.mesh);
    }
    game.decorations = [];
    
    // Remove critters
    for (let critter of game.critters) {
        game.scene.remove(critter.mesh);
    }
    game.critters = [];

    clearWaterCreatures();
// No, better to add a clear function.
    
    // Remove ladder if exists
    if (game.ladderMesh) {
        game.scene.remove(game.ladderMesh);
        game.ladderMesh = null;
    }
    game.ladderPosition = null;

    // Remove sunlight effects if they exist
    if (game.sunlightBeam) {
        game.scene.remove(game.sunlightBeam);
        if (game.sunlightBeam.geometry) game.sunlightBeam.geometry.dispose();
        if (game.sunlightBeam.material) game.sunlightBeam.material.dispose();
        game.sunlightBeam = null;
    }
    if (game.sunlight) {
        game.scene.remove(game.sunlight);
        if (game.sunlight.target) game.scene.remove(game.sunlight.target);
        game.sunlight = null;
    }
}

export function generateProceduralMap(width = game.dungeon.width, height = game.dungeon.height) {
    const level = game.dungeon.level || 1;
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
    const theme = config.theme;
    
    // Initialize with walls
    const map = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            row.push(1);
        }
        map.push(row);
    }
    
    // Helper to carve a room
    const carveRect = (x, y, w, h) => {
        for (let ry = y; ry < y + h; ry++) {
            for (let rx = x; rx < x + w; rx++) {
                if (ry >= 1 && ry < height - 1 && rx >= 1 && rx < width - 1) {
                    map[ry][rx] = 0;
                }
            }
        }
    };

    if (theme.algorithm === 'rooms') {
        // === LEVEL 1: RUINS (Standard Rooms + Twisted Corridors) ===
        const rooms = [];
        const numRooms = 10 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < numRooms; i++) {
            const w = 3 + Math.floor(Math.random() * 4);
            const h = 3 + Math.floor(Math.random() * 4);
            const x = 1 + Math.floor(Math.random() * (width - w - 2));
            const y = 1 + Math.floor(Math.random() * (height - h - 2));
            
            let overlap = false;
            for (let room of rooms) {
                if (x < room.x + room.w + 2 && x + w + 2 > room.x &&
                    y < room.y + room.h + 2 && y + h + 2 > room.y) {
                    overlap = true;
                    break;
                }
            }
            
            if (!overlap) {
                rooms.push({ x, y, w, h });
                carveRect(x, y, w, h);
            }
        }
        
        // Connect rooms
        for (let i = 0; i < rooms.length - 1; i++) {
            const roomA = rooms[i];
            const roomB = rooms[i + 1];
            let cx = Math.floor(roomA.x + roomA.w / 2);
            let cy = Math.floor(roomA.y + roomA.h / 2);
            const tx = Math.floor(roomB.x + roomB.w / 2);
            const ty = Math.floor(roomB.y + roomB.h / 2);
            
            while (cx !== tx || cy !== ty) {
                const dx = tx - cx;
                const dy = ty - cy;
                let moveX = 0, moveY = 0;
                
                if (Math.random() < 0.7) {
                    if (Math.abs(dx) > Math.abs(dy)) moveX = Math.sign(dx);
                    else moveY = Math.sign(dy);
                } else {
                    if (Math.random() < 0.5) moveX = Math.random() < 0.5 ? 1 : -1;
                    else moveY = Math.random() < 0.5 ? 1 : -1;
                }
                
                cx += moveX;
                cy += moveY;
                cx = Math.max(1, Math.min(width - 2, cx));
                cy = Math.max(1, Math.min(height - 2, cy));
                map[cy][cx] = 0;
                
                if (Math.random() < 0.1) { // Occasional widening
                    if (moveX !== 0) {
                        if (cy > 1) map[cy-1][cx] = 0;
                        if (cy < height-2) map[cy+1][cx] = 0;
                    } else {
                        if (cx > 1) map[cy][cx-1] = 0;
                        if (cx < width-2) map[cy][cx+1] = 0;
                    }
                }
            }
        }

    } else if (theme.algorithm === 'corridors') {
        // === LEVEL 2: SEWERS (Long winding corridors, few rooms) ===
        let x = Math.floor(width / 2);
        let y = Math.floor(height / 2);
        let dir = Math.floor(Math.random() * 4); // 0:N, 1:E, 2:S, 3:W
        const steps = 400; // Total length of sewers
        
        for (let i = 0; i < steps; i++) {
            map[y][x] = 0;
            
            // Occasionally change direction
            if (Math.random() < 0.1) {
                dir = (dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
            }
            
            // Move
            if (dir === 0 && y > 1) y--;
            else if (dir === 1 && x < width - 2) x++;
            else if (dir === 2 && y < height - 2) y++;
            else if (dir === 3 && x > 1) x--;
            else {
                // Hit wall, change dir
                dir = Math.floor(Math.random() * 4);
            }
            
            // Occasionally create a small "cistern" room
            if (Math.random() < 0.02) {
                carveRect(x - 2, y - 2, 5, 5);
            }
        }

    } else if (theme.algorithm === 'bsp') {
        // === LEVEL 3: TEMPLE (Large rooms, wide corridors) ===
        // Simple BSP-like subdivision
        const splitContainer = (x, y, w, h, depth) => {
            if (depth > 3 || w < 10 || h < 10) {
                // Create room in center of container
                const roomW = Math.max(4, w - 4);
                const roomH = Math.max(4, h - 4);
                const roomX = x + Math.floor((w - roomW) / 2);
                const roomY = y + Math.floor((h - roomH) / 2);
                carveRect(roomX, roomY, roomW, roomH);
                return [{x: roomX + roomW/2, y: roomY + roomH/2}]; // Return center for connection
            }
            
            // Split
            const splitH = Math.random() < 0.5;
            let centers = [];
            
            if (splitH) {
                const splitY = Math.floor(h / 2 + (Math.random() * h * 0.2 - h * 0.1));
                centers = centers.concat(splitContainer(x, y, w, splitY, depth + 1));
                centers = centers.concat(splitContainer(x, y + splitY, w, h - splitY, depth + 1));
                
                // Connect the two halves
                if (centers.length >= 2) {
                    const c1 = centers[centers.length - 2];
                    const c2 = centers[centers.length - 1];
                    // Draw wide corridor
                    const cx = Math.floor(c1.x);
                    for (let cy = Math.floor(c1.y); cy <= Math.floor(c2.y); cy++) {
                        map[cy][cx] = 0;
                        map[cy][cx+1] = 0; // Wide
                    }
                }
            } else {
                const splitX = Math.floor(w / 2 + (Math.random() * w * 0.2 - w * 0.1));
                centers = centers.concat(splitContainer(x, y, splitX, h, depth + 1));
                centers = centers.concat(splitContainer(x + splitX, y, w - splitX, h, depth + 1));
                
                if (centers.length >= 2) {
                    const c1 = centers[centers.length - 2];
                    const c2 = centers[centers.length - 1];
                    const cy = Math.floor(c1.y);
                    for (let cx = Math.floor(c1.x); cx <= Math.floor(c2.x); cx++) {
                        map[cy][cx] = 0;
                        map[cy+1][cx] = 0; // Wide
                    }
                }
            }
            return centers;
        };
        
        splitContainer(1, 1, width - 2, height - 2, 0);

    } else if (theme.algorithm === 'maze') {
        // === LEVEL 4: CATACOMBS (Dense Maze) ===
        // Recursive Backtracker
        const stack = [];
        const startX = 1 + 2 * Math.floor(Math.random() * ((width-2)/2));
        const startY = 1 + 2 * Math.floor(Math.random() * ((height-2)/2));
        
        map[startY][startX] = 0;
        stack.push({x: startX, y: startY});
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];
            
            // Check neighbors (jump 2 cells)
            const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
            for (let d of dirs) {
                const nx = current.x + d[0];
                const ny = current.y + d[1];
                if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && map[ny][nx] === 1) {
                    neighbors.push({x: nx, y: ny, dx: d[0]/2, dy: d[1]/2});
                }
            }
            
            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                // Carve path
                map[next.y][next.x] = 0;
                map[current.y + next.dy][current.x + next.dx] = 0;
                stack.push({x: next.x, y: next.y});
            } else {
                stack.pop();
            }
        }
        
        // Add some loops to make it less frustrating
        // Increased connections to make navigation easier
        for (let i = 0; i < 250; i++) {
            const rx = 1 + Math.floor(Math.random() * (width - 2));
            const ry = 1 + Math.floor(Math.random() * (height - 2));
            if (map[ry][rx] === 1) {
                // Check if it connects two open spaces
                let openNeighbors = 0;
                if (map[ry-1][rx] === 0) openNeighbors++;
                if (map[ry+1][rx] === 0) openNeighbors++;
                if (map[ry][rx-1] === 0) openNeighbors++;
                if (map[ry][rx+1] === 0) openNeighbors++;
                
                if (openNeighbors >= 2) map[ry][rx] = 0;
            }
        }

    } else if (theme.algorithm === 'cellular') {
        // === LEVEL 5: CAVES (Cellular Automata) ===
        // Random fill
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                map[y][x] = Math.random() < 0.45 ? 1 : 0;
            }
        }
        
        // Smooth
        for (let i = 0; i < 5; i++) {
            const newMap = JSON.parse(JSON.stringify(map));
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    let walls = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (map[y+dy][x+dx] === 1) walls++;
                        }
                    }
                    if (walls > 4) newMap[y][x] = 1;
                    else if (walls < 4) newMap[y][x] = 0;
                }
            }
            // Copy back
            for(let y=0; y<height; y++) {
                for(let x=0; x<width; x++) {
                    map[y][x] = newMap[y][x];
                }
            }
        }
    }

    // Apply level-specific map modifications (e.g. central cavern)
    if (config.mapGeneration) {
        config.mapGeneration(map, width, height);
    }

    // === CONNECTIVITY CHECK ===
    // Ensure all open areas are connected
    const getRegions = () => {
        const regions = [];
        const visited = Array(height).fill().map(() => Array(width).fill(false));
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (map[y][x] === 0 && !visited[y][x]) {
                    const region = [];
                    const stack = [{x, y}];
                    visited[y][x] = true;
                    
                    while (stack.length > 0) {
                        const p = stack.pop();
                        region.push(p);
                        
                        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                        for (let d of dirs) {
                            const nx = p.x + d[0];
                            const ny = p.y + d[1];
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height && 
                                map[ny][nx] === 0 && !visited[ny][nx]) {
                                visited[ny][nx] = true;
                                stack.push({x: nx, y: ny});
                            }
                        }
                    }
                    regions.push(region);
                }
            }
        }
        return regions;
    };

    let regions = getRegions();
    
    if (regions.length > 1) {
        console.log(`Found ${regions.length} disconnected regions. Connecting...`);
        
        // Sort by size, largest first
        regions.sort((a, b) => b.length - a.length);
        
        // We will connect everything to the main (largest) region
        const mainRegion = regions[0];
        const connectedPoints = [...mainRegion];
        
        // Process other regions
        for (let i = 1; i < regions.length; i++) {
            const region = regions[i];
            
            // Find closest connection between this region and the connected set
            let minDst = Infinity;
            let pA = null; // in connected set
            let pB = null; // in current region
            
            // Optimization: Check a subset if too slow, but 40x40 is fast enough
            for (let p1 of connectedPoints) {
                for (let p2 of region) {
                    const dst = (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
                    if (dst < minDst) {
                        minDst = dst;
                        pA = p1;
                        pB = p2;
                    }
                }
            }
            
            if (pA && pB) {
                // Dig tunnel
                let cx = pB.x;
                let cy = pB.y;
                const tx = pA.x;
                const ty = pA.y;
                
                while (cx !== tx || cy !== ty) {
                    const dx = tx - cx;
                    const dy = ty - cy;
                    
                    // Move in the direction of larger distance difference first (more natural)
                    if (Math.abs(dx) > Math.abs(dy)) {
                        cx += Math.sign(dx);
                    } else {
                        cy += Math.sign(dy);
                    }
                    
                    map[cy][cx] = 0;
                    // Add some width to the tunnel
                    if (Math.random() < 0.5) {
                        if (cx > 1) map[cy][cx-1] = 0;
                        if (cx < width-2) map[cy][cx+1] = 0;
                        if (cy > 1) map[cy-1][cx] = 0;
                        if (cy < height-2) map[cy+1][cx] = 0;
                    }
                }
                
                // Add this region's points to connected set
                connectedPoints.push(...region);
            }
        }
    }
    
    // Update the global map
    // Ensure dungeonMap is large enough
    if (dungeonMap.length !== height || dungeonMap[0].length !== width) {
        // Resize dungeonMap
        dungeonMap.length = 0;
        for(let y=0; y<height; y++) {
            dungeonMap.push(new Array(width).fill(1));
        }
    }
    
    for(let y=0; y<height; y++) {
        for(let x=0; x<width; x++) {
            dungeonMap[y][x] = map[y][x];
        }
    }
}

export function spawnLadder() {
    const cellSize = game.dungeon.cellSize;
    
    // Find the furthest spot from the player
    let bestX = -1;
    let bestY = -1;
    let maxDist = -1;
    
    const playerGridX = Math.floor(game.player.position.x / cellSize);
    const playerGridY = Math.floor(game.player.position.z / cellSize);
    
    for (let y = 0; y < game.dungeon.height; y++) {
        for (let x = 0; x < game.dungeon.width; x++) {
            if (dungeonMap[y][x] === 0) {
                // Calculate distance
                const dx = x - playerGridX;
                const dy = y - playerGridY;
                const dist = dx*dx + dy*dy;
                
                if (dist > maxDist) {
                    maxDist = dist;
                    bestX = x;
                    bestY = y;
                }
            }
        }
    }
    
    if (bestX !== -1) {
        const x = bestX;
        const y = bestY;
        
        game.ladderPosition = { x, y };
        
        // Create ladder mesh
        const ladderGroup = new THREE.Group();
        
        // Rails
        const ladderHeight = 12;
        const railGeom = new THREE.CylinderGeometry(0.05, 0.05, ladderHeight, 8);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
        
        const leftRail = new THREE.Mesh(railGeom, railMat);
        leftRail.position.set(-0.4, ladderHeight / 2, 0);
        ladderGroup.add(leftRail);
        
        const rightRail = new THREE.Mesh(railGeom, railMat);
        rightRail.position.set(0.4, ladderHeight / 2, 0);
        ladderGroup.add(rightRail);
        
        // Rungs
        const rungGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
        const numRungs = Math.floor(ladderHeight * 2);
        for (let i = 0; i < numRungs; i++) {
            const rung = new THREE.Mesh(rungGeom, railMat);
            rung.rotation.z = Math.PI / 2;
            rung.position.set(0, 0.5 + i * 0.5, 0);
            ladderGroup.add(rung);
        }
        
        ladderGroup.position.x = x * cellSize + cellSize / 2;
        ladderGroup.position.z = y * cellSize + cellSize / 2;
        
        // Rotate to lean against a wall if possible
        // Reduced lean angle and offset to ensure ladder stays within the ceiling hole
        const leanAngle = 0.1; 
        const wallOffset = cellSize * 0.25;

        if (y > 0 && dungeonMap[y-1][x] === 1) {
            ladderGroup.position.z -= wallOffset;
            ladderGroup.rotation.x = -leanAngle;
        } else if (y < game.dungeon.height - 1 && dungeonMap[y+1][x] === 1) {
            ladderGroup.position.z += wallOffset;
            ladderGroup.rotation.x = leanAngle;
        } else if (x > 0 && dungeonMap[y][x-1] === 1) {
            ladderGroup.position.x -= wallOffset;
            ladderGroup.rotation.z = leanAngle;
            ladderGroup.rotation.y = Math.PI / 2;
        } else if (x < game.dungeon.width - 1 && dungeonMap[y][x+1] === 1) {
            ladderGroup.position.x += wallOffset;
            ladderGroup.rotation.z = -leanAngle;
            ladderGroup.rotation.y = Math.PI / 2;
        }
        
        game.scene.add(ladderGroup);
        game.ladderMesh = ladderGroup;
        
        // Spawn a glow mushroom at the ladder base to make it easier to find
        createDecoration(x, y, DECORATION_TYPES.MUSHROOMS);

        // Create hole in ceiling (on all levels)
        if (game.dungeon.ceilingMesh) {
            const mesh = game.dungeon.ceilingMesh;
            const positions = mesh.geometry.attributes.position;
            const ladderWorldX = x * cellSize + cellSize / 2;
            const ladderWorldZ = y * cellSize + cellSize / 2;
            const holeRadius = 3.0; // Increased radius to ensure ladder fits
            
            // Ceiling plane is rotated X = 90 deg
            // Local X = World X
            // Local Y = World Z
            // Local Z = World -Y (Up is negative Z)
            
            // Convert ladder world pos to local space relative to mesh center
            // Mesh is at (width*cellSize/2, height*cellSize/2) in X/Z
            const meshCenterX = mesh.position.x;
            const meshCenterZ = mesh.position.z;
            
            for (let i = 0; i < positions.count; i++) {
                const vx = positions.getX(i); // Local X
                const vy = positions.getY(i); // Local Y
                
                // Convert local vertex to world X/Z to compare with ladder
                // Since mesh rotation is 90 deg X, and position is set:
                // WorldX = vx + mesh.position.x (Wait, PlaneGeometry is centered at 0,0)
                // Actually, PlaneGeometry vertices are centered around 0,0.
                // So vx is offset from center.
                // WorldX = vx + mesh.position.x
                // WorldZ = vy + mesh.position.z
                
                const worldVx = vx + meshCenterX;
                const worldVz = vy + meshCenterZ;
                
                const dx = worldVx - ladderWorldX;
                const dz = worldVz - ladderWorldZ;
                const dist = Math.sqrt(dx*dx + dz*dz);
                
                if (dist < holeRadius) {
                    let currentZ = positions.getZ(i);
                    
                    const innerRadius = 1.5;
                    if (dist < innerRadius) {
                        // Push UP (negative Z in local space)
                        positions.setZ(i, currentZ - 12.0); 
                    } else {
                        // Interpolate
                        const t = (dist - innerRadius) / (holeRadius - innerRadius);
                        const offset = -12.0 * (1 - t);
                        positions.setZ(i, currentZ + offset);
                    }
                }
            }
            positions.needsUpdate = true;
            mesh.geometry.computeVertexNormals();
        }

        // Add sunlight effect if on Level 1
        if (game.dungeon.level === 1) {
            // Create a light beam
            const beamGeometry = new THREE.CylinderGeometry(1.5, 2.5, 20, 16, 1, true);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffcc,
                transparent: true,
                opacity: 0.08,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.set(
                x * cellSize + cellSize / 2,
                10, // Start high up
                y * cellSize + cellSize / 2
            );
            // Tilt slightly
            beam.rotation.x = 0.2;
            beam.rotation.z = 0.1;
            
            game.scene.add(beam);
            game.sunlightBeam = beam;

            // Add a spotlight to simulate the sun
            const sunLight = new THREE.SpotLight(0xffffee, 3, 40, 0.6, 0.5, 1);
            sunLight.position.set(
                x * cellSize + cellSize / 2 + 2,
                18,
                y * cellSize + cellSize / 2 + 2
            );
            sunLight.target.position.set(
                x * cellSize + cellSize / 2,
                0,
                y * cellSize + cellSize / 2
            );
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 512;
            sunLight.shadow.mapSize.height = 512;
            
            game.scene.add(sunLight);
            game.scene.add(sunLight.target);
            game.sunlight = sunLight;
        }

        console.log(`Spawned ladder at (${x}, ${y}), dist: ${Math.sqrt(maxDist).toFixed(1)}`);
    }
}
