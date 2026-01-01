// Game state
const game = {
    started: false,
    won: false,
    scene: null,
    camera: null,
    renderer: null,
    player: {
        position: new THREE.Vector3(0, 1.6, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        rotation: { x: 0, y: 0 },
        speed: 0.1,
        height: 1.6,
        canMove: true,
        facing: 0, // 0=north, 1=east, 2=south, 3=west
        animating: false,
        targetPosition: new THREE.Vector3(0, 1.6, 0),
        startRotation: 0,
        targetRotation: 0,
        animationProgress: 0,
        animationDuration: 0.3, // seconds
        health: 100,
        maxHealth: 100,
        attackPower: 20
    },
    controls: {
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        altPressed: false,
        shiftPressed: false,
        debugMode: false
    },
    dungeon: {
        width: 20,
        height: 20,
        cellSize: 4,
        walls: [],
        wallMeshes: []
    },
    doors: [],
    monsters: [],
    critters: [],
    treasures: [],
    decorations: [],
    wealth: 0,
    clock: new THREE.Clock(),
    raycaster: new THREE.Raycaster()
};

// Dungeon map (0 = walkable, 1 = wall)
const dungeonMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,1,1,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,0,0,0,0,1,1,1,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,1,1,1,1,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Initialize the game
function init() {
    // Create scene
    game.scene = new THREE.Scene();
    game.scene.fog = new THREE.Fog(0x000000, 0, 30);
    
    // Create camera
    game.camera = new THREE.PerspectiveCamera(
        90, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    game.camera.position.copy(game.player.position);
    
    // Create renderer
    game.renderer = new THREE.WebGLRenderer({ antialias: true });
    game.renderer.setSize(window.innerWidth, window.innerHeight);
    game.renderer.shadowMap.enabled = true;
    game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(game.renderer.domElement);
    
    // Add lighting
    // Removed ambient light for torch-only atmosphere
    const ambientLight = new THREE.AmbientLight(0x000000, 0.0);
    game.scene.add(ambientLight);
    game.ambientLight = ambientLight; // Store reference for toggling
    
    // Player light (torch effect)
    // Warmer, more orange color for fire
    const playerLight = new THREE.PointLight(0xffaa00, 2.0, 18);
    playerLight.position.copy(game.player.position);
    playerLight.castShadow = true;
    playerLight.shadow.bias = -0.001; // Reduce shadow acne
    game.scene.add(playerLight);
    game.player.light = playerLight;
    
    // Torch flicker properties
    game.player.torch = {
        intensityBase: 2.0,
        intensityVar: 0.3,
        rangeBase: 18,
        rangeVar: 1.0,
        timeOffset: Math.random() * 100,
        turnsActive: 0,
        maxTurns: 50,
        fadeTurns: 10,
        color: new THREE.Color(0xffaa00)
    };
    
    // Additional lights removed for torch-only atmosphere
    /*
    const light1 = new THREE.PointLight(0x0066ff, 0.8, 20);
    light1.position.set(10, 3, 10);
    game.scene.add(light1);
    game.light1 = light1;
    
    const light2 = new THREE.PointLight(0x00ff66, 0.8, 20);
    light2.position.set(50, 3, 50);
    game.scene.add(light2);
    game.light2 = light2;
    */
    
    // Generate dungeon
    generateDungeon();
    
    // Setup controls
    setupControls();
    
    // Initialize UI
    updateHealthDisplay();
    updateWealthDisplay();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

// Generate dungeon from map
function generateDungeon() {
    const cellSize = game.dungeon.cellSize;
    
    // Create floor texture using canvas
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const floorCtx = floorCanvas.getContext('2d');
    
    // Base stone color
    floorCtx.fillStyle = '#2a2a2a';
    floorCtx.fillRect(0, 0, 512, 512);
    
    // Add stone tiles with variation
    const tileSize = 64;
    for (let y = 0; y < 512; y += tileSize) {
        for (let x = 0; x < 512; x += tileSize) {
            // Slight color variation per tile
            const variation = Math.floor(Math.random() * 20 - 10);
            const baseColor = 42 + variation;
            floorCtx.fillStyle = `rgb(${baseColor}, ${baseColor}, ${baseColor})`;
            floorCtx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
            
            // Add cracks and texture
            for (let i = 0; i < 15; i++) {
                const px = x + Math.random() * tileSize;
                const py = y + Math.random() * tileSize;
                const size = 1 + Math.random() * 2;
                const darkness = Math.floor(Math.random() * 30);
                floorCtx.fillStyle = `rgb(${darkness}, ${darkness}, ${darkness})`;
                floorCtx.fillRect(px, py, size, size);
            }
            
            // Grout lines (darker)
            floorCtx.strokeStyle = '#1a1a1a';
            floorCtx.lineWidth = 2;
            floorCtx.strokeRect(x, y, tileSize, tileSize);
        }
    }
    
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(game.dungeon.width / 2, game.dungeon.height / 2);
    
    // Create floor
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
    // High segmentation for vertex displacement
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
        
        // Large undulations
        z += Math.sin(x * 0.1) * 0.5;
        z += Math.cos(y * 0.1) * 0.5;
        
        // Medium details
        z += Math.sin(x * 0.3 + y * 0.2) * 0.3;
        z += Math.cos(y * 0.3 - x * 0.2) * 0.3;
        
        // Small roughness
        z += (Math.random() - 0.5) * 0.2;
        
        // Bias upwards (negative Z in plane space because of rotation) to create vaulted feel
        // Rotation X = PI/2 maps Local Z+ to World Y-
        // So we want Negative Z to go UP in world space?
        // Let's verify: Plane is XY. Normal is Z+.
        // Rotated 90deg on X. Y+ becomes Z+. Z+ becomes Y-.
        // So Positive Z displacement moves DOWN.
        // Negative Z displacement moves UP.
        
        // We want the ceiling to be mostly above y=4, but dipping down occasionally
        z -= 0.5; // Move up by default
        
        positionAttribute.setZ(i, z);
    }
    ceilingGeometry.computeVertexNormals();

    // Create rock texture for ceiling
    const ceilingCanvas = document.createElement('canvas');
    ceilingCanvas.width = 512;
    ceilingCanvas.height = 512;
    const ceilingCtx = ceilingCanvas.getContext('2d');
    
    // Dark rock base - lighter than before
    ceilingCtx.fillStyle = '#4a4a4a';
    ceilingCtx.fillRect(0, 0, 512, 512);
    
    // Add noise texture
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = 2 + Math.random() * 6;
        const shade = Math.floor(Math.random() * 60 + 30); // Lighter noise
        ceilingCtx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.2)`;
        ceilingCtx.beginPath();
        ceilingCtx.arc(x, y, size, 0, Math.PI * 2);
        ceilingCtx.fill();
    }
    
    const ceilingTexture = new THREE.CanvasTexture(ceilingCanvas);
    ceilingTexture.wrapS = THREE.RepeatWrapping;
    ceilingTexture.wrapT = THREE.RepeatWrapping;
    ceilingTexture.repeat.set(game.dungeon.width / 2, game.dungeon.height / 2);

    const ceilingMaterial = new THREE.MeshStandardMaterial({
        map: ceilingTexture,
        color: 0xaaaaaa, // Lighter multiplier
        roughness: 0.8, // Slightly less rough to catch light
        metalness: 0.1
    });
    
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4.0; // Base height at top of walls
    ceiling.position.x = (game.dungeon.width * cellSize) / 2;
    ceiling.position.z = (game.dungeon.height * cellSize) / 2;
    ceiling.receiveShadow = true;
    game.scene.add(ceiling);
    
    // Create wall texture using canvas
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 512;
    wallCanvas.height = 512;
    const wallCtx = wallCanvas.getContext('2d');
    
    // Base stone wall color
    const baseWallColor = { r: 74, g: 63, b: 53 };
    wallCtx.fillStyle = `rgb(${baseWallColor.r}, ${baseWallColor.g}, ${baseWallColor.b})`;
    wallCtx.fillRect(0, 0, 512, 512);
    
    // Add rough stone blocks
    const blockSizes = [
        { w: 128, h: 64 },
        { w: 96, h: 48 },
        { w: 112, h: 56 }
    ];
    
    let currentY = 0;
    while (currentY < 512) {
        let currentX = 0;
        const rowHeight = blockSizes[Math.floor(Math.random() * blockSizes.length)].h;
        
        while (currentX < 512) {
            const block = blockSizes[Math.floor(Math.random() * blockSizes.length)];
            
            // Color variation for each block
            const variation = Math.floor(Math.random() * 30 - 15);
            wallCtx.fillStyle = `rgb(${baseWallColor.r + variation}, ${baseWallColor.g + variation}, ${baseWallColor.b + variation})`;
            wallCtx.fillRect(currentX + 2, currentY + 2, block.w - 4, rowHeight - 4);
            
            // Add texture detail - cracks and chips
            for (let i = 0; i < 25; i++) {
                const px = currentX + Math.random() * block.w;
                const py = currentY + Math.random() * rowHeight;
                const size = 1 + Math.random() * 3;
                const darkness = Math.floor(Math.random() * 40);
                wallCtx.fillStyle = `rgb(${darkness}, ${darkness}, ${darkness})`;
                wallCtx.beginPath();
                wallCtx.arc(px, py, size, 0, Math.PI * 2);
                wallCtx.fill();
            }
            
            // Mortar lines (darker gaps between stones)
            wallCtx.strokeStyle = '#252015';
            wallCtx.lineWidth = 3;
            wallCtx.strokeRect(currentX, currentY, block.w, rowHeight);
            
            currentX += block.w;
        }
        currentY += rowHeight;
    }
    
    // Add moss and weathering
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = 5 + Math.random() * 15;
        const gradient = wallCtx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, 'rgba(40, 60, 30, 0.3)');
        gradient.addColorStop(1, 'rgba(40, 60, 30, 0)');
        wallCtx.fillStyle = gradient;
        wallCtx.fillRect(x - size, y - size, size * 2, size * 2);
    }
    
    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    
    // Create walls based on map
    // Increased height to 6 to reach the uneven ceiling
    // Increased width/depth to 1.1 (10% overlap) to firmly seal all gaps
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
                    size: cellSize
                });
                game.dungeon.wallMeshes.push(wall);
            }
        }
    }
    
    // Set player starting position (find first open space)
    for (let y = 0; y < dungeonMap.length; y++) {
        for (let x = 0; x < dungeonMap[y].length; x++) {
            if (dungeonMap[y][x] === 0) {
                game.player.position.x = x * cellSize + cellSize / 2;
                game.player.position.z = y * cellSize + cellSize / 2;
                
                // Set initial rotation to East (90 degrees right)
                game.player.facing = 1; // East
                game.player.rotation.y = -Math.PI / 2;
                
                game.player.targetPosition.copy(game.player.position);
                game.player.startRotation = game.player.rotation.y;
                game.player.targetRotation = game.player.rotation.y;
                game.camera.position.copy(game.player.position);
                
                // Create special inscription on wall in front of player
                createStartingInscription(x, y, cellSize);
                
                // Spawn monsters
                spawnMonsters();
                
                // Spawn treasures
                spawnTreasures();
                
                // Spawn doors first (they block all decorations)
                spawnDoors();
                
                // Spawn decorations (respects doors and existing decorations)
                spawnDecorations();
                
                // Spawn glow worms
                spawnGlowWorms();
                return;
            }
        }
    }
}

// Spawn doors in corridors
function spawnDoors() {
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

// Create a door at a grid position
function createDoor(gridX, gridY, orientation) {
    const cellSize = game.dungeon.cellSize;
    const worldX = gridX * cellSize + cellSize / 2;
    const worldZ = gridY * cellSize + cellSize / 2;
    
    // Constants
    const corridorWidth = cellSize; // 4.0
    const ceilingHeight = 4.0;
    const doorOpeningWidth = 2.2; // Width of the door opening
    const doorOpeningHeight = 2.8; // Height of the door opening
    const doorThickness = 0.15;
    const frameDepth = 0.4; // How deep the frame extends
    
    const frameGroup = new THREE.Group();
    
    // Create wood texture for door
    const woodCanvas = document.createElement('canvas');
    woodCanvas.width = 512;
    woodCanvas.height = 512;
    const woodCtx = woodCanvas.getContext('2d');
    
    // Base wood color with gradient (very dark)
    const woodGradient = woodCtx.createLinearGradient(0, 0, woodCanvas.width, 0);
    woodGradient.addColorStop(0, '#2d1810');
    woodGradient.addColorStop(0.3, '#3d2418');
    woodGradient.addColorStop(0.6, '#2d1810');
    woodGradient.addColorStop(1, '#1d0808');
    woodCtx.fillStyle = woodGradient;
    woodCtx.fillRect(0, 0, woodCanvas.width, woodCanvas.height);
    
    // Add wood grain lines
    woodCtx.strokeStyle = 'rgba(20, 12, 8, 0.5)';
    for (let i = 0; i < 60; i++) {
        woodCtx.lineWidth = Math.random() * 2 + 0.5;
        woodCtx.beginPath();
        const y = Math.random() * woodCanvas.height;
        const waveHeight = Math.random() * 15 + 5;
        woodCtx.moveTo(0, y);
        for (let x = 0; x < woodCanvas.width; x += 10) {
            const wave = Math.sin(x * 0.02) * waveHeight;
            woodCtx.lineTo(x, y + wave);
        }
        woodCtx.stroke();
    }
    
    // Add wood knots
    for (let i = 0; i < 8; i++) {
        const knotX = Math.random() * woodCanvas.width;
        const knotY = Math.random() * woodCanvas.height;
        const knotSize = Math.random() * 20 + 10;
        
        const knotGradient = woodCtx.createRadialGradient(knotX, knotY, 0, knotX, knotY, knotSize);
        knotGradient.addColorStop(0, 'rgba(10, 6, 3, 0.8)');
        knotGradient.addColorStop(0.5, 'rgba(20, 12, 8, 0.6)');
        knotGradient.addColorStop(1, 'rgba(45, 28, 16, 0)');
        
        woodCtx.fillStyle = knotGradient;
        woodCtx.beginPath();
        woodCtx.arc(knotX, knotY, knotSize, 0, Math.PI * 2);
        woodCtx.fill();
        
        // Add rings around knot
        woodCtx.strokeStyle = 'rgba(20, 12, 8, 0.4)';
        woodCtx.lineWidth = 1;
        for (let ring = 1; ring < 4; ring++) {
            woodCtx.beginPath();
            woodCtx.arc(knotX, knotY, knotSize * 0.3 * ring, 0, Math.PI * 2);
            woodCtx.stroke();
        }
    }
    
    // Add scratches and wear marks
    for (let i = 0; i < 30; i++) {
        woodCtx.strokeStyle = `rgba(${15 + Math.random() * 15}, ${10 + Math.random() * 10}, ${5 + Math.random() * 8}, ${0.2 + Math.random() * 0.3})`;
        woodCtx.lineWidth = Math.random() * 1.5 + 0.3;
        woodCtx.beginPath();
        const startX = Math.random() * woodCanvas.width;
        const startY = Math.random() * woodCanvas.height;
        const length = Math.random() * 40 + 10;
        const angle = Math.random() * Math.PI * 2;
        woodCtx.moveTo(startX, startY);
        woodCtx.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
        woodCtx.stroke();
    }
    
    // Add darker patches (age/moisture damage)
    for (let i = 0; i < 15; i++) {
        const patchX = Math.random() * woodCanvas.width;
        const patchY = Math.random() * woodCanvas.height;
        const patchSize = Math.random() * 40 + 20;
        
        const patchGradient = woodCtx.createRadialGradient(patchX, patchY, 0, patchX, patchY, patchSize);
        patchGradient.addColorStop(0, 'rgba(10, 8, 5, 0.5)');
        patchGradient.addColorStop(1, 'rgba(10, 8, 5, 0)');
        
        woodCtx.fillStyle = patchGradient;
        woodCtx.beginPath();
        woodCtx.arc(patchX, patchY, patchSize, 0, Math.PI * 2);
        woodCtx.fill();
    }
    
    // Add damage from adventurer attacks (axe marks, sword cuts, bashing dents)
    // Deep axe cuts
    for (let i = 0; i < 8; i++) {
        const cutX = Math.random() * woodCanvas.width;
        const cutY = Math.random() * woodCanvas.height;
        const cutLength = 30 + Math.random() * 50;
        const cutAngle = (Math.random() - 0.5) * Math.PI * 0.6; // Mostly vertical cuts
        
        // Dark cut mark
        woodCtx.strokeStyle = 'rgba(8, 5, 3, 0.8)';
        woodCtx.lineWidth = 4 + Math.random() * 6;
        woodCtx.beginPath();
        woodCtx.moveTo(cutX, cutY);
        woodCtx.lineTo(cutX + Math.cos(cutAngle) * cutLength, cutY + Math.sin(cutAngle) * cutLength);
        woodCtx.stroke();
        
        // Lighter edge (wood splinters)
        woodCtx.strokeStyle = 'rgba(35, 25, 15, 0.5)';
        woodCtx.lineWidth = 2;
        woodCtx.beginPath();
        woodCtx.moveTo(cutX + 2, cutY);
        woodCtx.lineTo(cutX + 2 + Math.cos(cutAngle) * cutLength, cutY + Math.sin(cutAngle) * cutLength);
        woodCtx.stroke();
    }
    
    // Bash dents (circular impacts)
    for (let i = 0; i < 5; i++) {
        const dentX = Math.random() * woodCanvas.width;
        const dentY = Math.random() * woodCanvas.height;
        const dentSize = 15 + Math.random() * 25;
        
        // Dark center
        const dentGradient = woodCtx.createRadialGradient(dentX, dentY, 0, dentX, dentY, dentSize);
        dentGradient.addColorStop(0, 'rgba(5, 3, 2, 0.9)');
        dentGradient.addColorStop(0.6, 'rgba(15, 10, 6, 0.6)');
        dentGradient.addColorStop(1, 'rgba(25, 18, 12, 0)');
        
        woodCtx.fillStyle = dentGradient;
        woodCtx.beginPath();
        woodCtx.arc(dentX, dentY, dentSize, 0, Math.PI * 2);
        woodCtx.fill();
        
        // Add cracks radiating from impact
        for (let j = 0; j < 3; j++) {
            const crackAngle = (Math.random() * Math.PI * 2);
            const crackLength = dentSize + Math.random() * 15;
            woodCtx.strokeStyle = 'rgba(8, 5, 3, 0.7)';
            woodCtx.lineWidth = 1 + Math.random();
            woodCtx.beginPath();
            woodCtx.moveTo(dentX, dentY);
            woodCtx.lineTo(dentX + Math.cos(crackAngle) * crackLength, dentY + Math.sin(crackAngle) * crackLength);
            woodCtx.stroke();
        }
    }
    
    // Sword/knife scratches (thin, long cuts)
    for (let i = 0; i < 12; i++) {
        const scratchX = Math.random() * woodCanvas.width;
        const scratchY = Math.random() * woodCanvas.height;
        const scratchLength = 40 + Math.random() * 80;
        const scratchAngle = Math.random() * Math.PI * 2;
        
        woodCtx.strokeStyle = 'rgba(6, 4, 2, 0.7)';
        woodCtx.lineWidth = 1 + Math.random() * 2;
        woodCtx.beginPath();
        woodCtx.moveTo(scratchX, scratchY);
        
        // Slightly curved scratch
        for (let t = 0; t <= 1; t += 0.1) {
            const wobble = Math.sin(t * Math.PI * 4) * 2;
            const x = scratchX + Math.cos(scratchAngle) * scratchLength * t + Math.cos(scratchAngle + Math.PI/2) * wobble;
            const y = scratchY + Math.sin(scratchAngle) * scratchLength * t + Math.sin(scratchAngle + Math.PI/2) * wobble;
            woodCtx.lineTo(x, y);
        }
        woodCtx.stroke();
    }
    
    // Chipped/gouged areas
    for (let i = 0; i < 6; i++) {
        const chipX = Math.random() * woodCanvas.width;
        const chipY = Math.random() * woodCanvas.height;
        const chipSize = 8 + Math.random() * 15;
        
        // Irregular polygon for chip
        woodCtx.fillStyle = 'rgba(5, 3, 2, 0.8)';
        woodCtx.beginPath();
        const sides = 5 + Math.floor(Math.random() * 3);
        for (let j = 0; j < sides; j++) {
            const angle = (j / sides) * Math.PI * 2;
            const radius = chipSize * (0.7 + Math.random() * 0.6);
            const x = chipX + Math.cos(angle) * radius;
            const y = chipY + Math.sin(angle) * radius;
            if (j === 0) woodCtx.moveTo(x, y);
            else woodCtx.lineTo(x, y);
        }
        woodCtx.closePath();
        woodCtx.fill();
    }
    
    const woodTexture = new THREE.CanvasTexture(woodCanvas);
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    
    // Create dark frame wood texture (vertical grain)
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = 256;
    frameCanvas.height = 512;
    const frameCtx = frameCanvas.getContext('2d');
    
    // Base dark wood color with vertical gradient (darker)
    const frameGradient = frameCtx.createLinearGradient(0, 0, 0, frameCanvas.height);
    frameGradient.addColorStop(0, '#1d0808');
    frameGradient.addColorStop(0.2, '#2d1810');
    frameGradient.addColorStop(0.5, '#1d0808');
    frameGradient.addColorStop(0.8, '#0d0404');
    frameGradient.addColorStop(1, '#1d0808');
    frameCtx.fillStyle = frameGradient;
    frameCtx.fillRect(0, 0, frameCanvas.width, frameCanvas.height);
    
    // Add vertical grain lines
    frameCtx.strokeStyle = 'rgba(20, 12, 8, 0.5)';
    for (let i = 0; i < 80; i++) {
        frameCtx.lineWidth = Math.random() * 1.5 + 0.3;
        frameCtx.beginPath();
        const x = Math.random() * frameCanvas.width;
        frameCtx.moveTo(x, 0);
        for (let y = 0; y < frameCanvas.height; y += 10) {
            const wave = Math.sin(y * 0.03) * 3;
            frameCtx.lineTo(x + wave, y);
        }
        frameCtx.stroke();
    }
    
    // Add small knots
    for (let i = 0; i < 5; i++) {
        const knotX = Math.random() * frameCanvas.width;
        const knotY = Math.random() * frameCanvas.height;
        const knotSize = Math.random() * 10 + 5;
        
        const knotGradient = frameCtx.createRadialGradient(knotX, knotY, 0, knotX, knotY, knotSize);
        knotGradient.addColorStop(0, 'rgba(15, 10, 5, 0.7)');
        knotGradient.addColorStop(1, 'rgba(61, 40, 23, 0)');
        
        frameCtx.fillStyle = knotGradient;
        frameCtx.beginPath();
        frameCtx.arc(knotX, knotY, knotSize, 0, Math.PI * 2);
        frameCtx.fill();
    }
    
    const frameTexture = new THREE.CanvasTexture(frameCanvas);
    frameTexture.wrapS = THREE.RepeatWrapping;
    frameTexture.wrapT = THREE.RepeatWrapping;
    
    // Create wall panel texture (rough planks)
    const panelCanvas = document.createElement('canvas');
    panelCanvas.width = 512;
    panelCanvas.height = 512;
    const panelCtx = panelCanvas.getContext('2d');
    
    // Base dark wood color
    panelCtx.fillStyle = '#2d1810';
    panelCtx.fillRect(0, 0, panelCanvas.width, panelCanvas.height);
    
    // Add horizontal plank lines
    for (let y = 0; y < panelCanvas.height; y += 80) {
        panelCtx.strokeStyle = 'rgba(30, 20, 10, 0.6)';
        panelCtx.lineWidth = 2;
        panelCtx.beginPath();
        panelCtx.moveTo(0, y);
        panelCtx.lineTo(panelCanvas.width, y);
        panelCtx.stroke();
    }
    
    // Add wood grain (horizontal)
    panelCtx.strokeStyle = 'rgba(35, 25, 12, 0.4)';
    for (let i = 0; i < 40; i++) {
        panelCtx.lineWidth = Math.random() * 1.5 + 0.5;
        panelCtx.beginPath();
        const y = Math.random() * panelCanvas.height;
        panelCtx.moveTo(0, y);
        for (let x = 0; x < panelCanvas.width; x += 10) {
            const wave = Math.sin(x * 0.025) * 8;
            panelCtx.lineTo(x, y + wave);
        }
        panelCtx.stroke();
    }
    
    // Add nail holes
    for (let y = 40; y < panelCanvas.height; y += 80) {
        for (let i = 0; i < 3; i++) {
            const x = 50 + i * 200;
            panelCtx.fillStyle = 'rgba(20, 15, 10, 0.8)';
            panelCtx.beginPath();
            panelCtx.arc(x, y, 3, 0, Math.PI * 2);
            panelCtx.fill();
            
            // Rust ring around nail
            panelCtx.strokeStyle = 'rgba(80, 50, 30, 0.4)';
            panelCtx.lineWidth = 2;
            panelCtx.beginPath();
            panelCtx.arc(x, y, 5, 0, Math.PI * 2);
            panelCtx.stroke();
        }
    }
    
    // Add weathering
    for (let i = 0; i < 20; i++) {
        const patchX = Math.random() * panelCanvas.width;
        const patchY = Math.random() * panelCanvas.height;
        const patchSize = Math.random() * 30 + 15;
        
        const patchGradient = panelCtx.createRadialGradient(patchX, patchY, 0, patchX, patchY, patchSize);
        patchGradient.addColorStop(0, 'rgba(15, 10, 8, 0.6)');
        patchGradient.addColorStop(1, 'rgba(15, 10, 8, 0)');
        
        panelCtx.fillStyle = patchGradient;
        panelCtx.beginPath();
        panelCtx.arc(patchX, patchY, patchSize, 0, Math.PI * 2);
        panelCtx.fill();
    }
    
    const panelTexture = new THREE.CanvasTexture(panelCanvas);
    panelTexture.wrapS = THREE.RepeatWrapping;
    panelTexture.wrapT = THREE.RepeatWrapping;
    
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
    // Position at 80% of door height, relative to center
    topBand.position.set(0, (0.8 - 0.5) * actualDoorHeight, doorThickness / 2 + 0.01);
    doorMesh.add(topBand);
    
    // Front bottom band
    const bottomBand = new THREE.Mesh(
        new THREE.BoxGeometry(actualDoorWidth, 0.12, doorThickness + 0.02),
        bandMaterial
    );
    // Position at 20% of door height, relative to center
    bottomBand.position.set(0, (0.2 - 0.5) * actualDoorHeight, doorThickness / 2 + 0.01);
    doorMesh.add(bottomBand);
    
    // Back top band
    const topBandBack = new THREE.Mesh(
        new THREE.BoxGeometry(actualDoorWidth, 0.12, doorThickness + 0.02),
        bandMaterial
    );
    topBandBack.position.set(0, (0.8 - 0.5) * actualDoorHeight, -(doorThickness / 2 + 0.01));
    doorMesh.add(topBandBack);
    
    // Back bottom band
    const bottomBandBack = new THREE.Mesh(
        new THREE.BoxGeometry(actualDoorWidth, 0.12, doorThickness + 0.02),
        bandMaterial
    );
    bottomBandBack.position.set(0, (0.2 - 0.5) * actualDoorHeight, -(doorThickness / 2 + 0.01));
    doorMesh.add(bottomBandBack);
    
    // Add door handle (front)
    const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8),
        bandMaterial
    );
    handle.rotation.z = Math.PI / 2;
    // Position at 50% of door height, relative to center
    handle.position.set(actualDoorWidth * 0.35, 0, doorThickness / 2 + 0.08);
    doorMesh.add(handle);
    
    // Add door handle (back)
    const handleBack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8),
        bandMaterial
    );
    handleBack.rotation.z = Math.PI / 2;
    handleBack.position.set(actualDoorWidth * 0.35, 0, -(doorThickness / 2 + 0.08));
    doorMesh.add(handleBack);
    
    doorPivot.add(doorMesh);
    frameGroup.add(doorPivot);
    
    // Position and rotate based on orientation
    frameGroup.position.set(worldX, 0, worldZ);
    if (orientation === 'horizontal') {
        frameGroup.rotation.y = Math.PI / 2;
    }
    
    // Enable shadows for door parts
    frameGroup.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

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

// Create special inscription at player start
function createStartingInscription(playerGridX, playerGridY, cellSize) {
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

// Treasure type definitions
const TREASURE_TYPES = {
    CHEST: { name: 'chest', value: 100, color: 0x8B4513 },
    GOLD_COIN: { name: 'coin', value: 10, color: 0xFFD700 },
    GEM: { name: 'gem', value: 50, color: 0x00FFFF },
    TRINKET: { name: 'trinket', value: 25, color: 0xFF69B4 },
    TORCH: { name: 'torch', value: 0, color: 0xffaa00 }
};

// Decoration type definitions
const DECORATION_TYPES = {
    PUDDLE: { name: 'puddle', probability: 0.15 },
    SPIDER_WEB: { name: 'spider_web', probability: 0.10 },
    STALACTITE: { name: 'stalactite', probability: 0.08 },
    STALAGMITE: { name: 'stalagmite', probability: 0.08 },
    CRACKED_ROCK: { name: 'cracked_rock', probability: 0.12 },
    PEBBLES: { name: 'pebbles', probability: 0.20 },
    BONES: { name: 'bones', probability: 0.10 },
    BONE_PILE: { name: 'bone_pile', probability: 0.20 },
    MUSHROOMS: { name: 'mushrooms', probability: 0.08 },
    MOSS_PATCH: { name: 'moss_patch', probability: 0.80 },
    WALL_INSCRIPTION: { name: 'wall_inscription', probability: 0.067 },
    WYRM_CARCASS: { name: 'wyrm_carcass', probability: 0 },
    DEAD_ADVENTURER: { name: 'dead_adventurer', probability: 0 },
    LADDER: { name: 'ladder', probability: 0 }
};

// Monster type definitions
const MONSTER_TYPES = {
    SKELETON: 'skeleton',
    SPIDER: 'spider',
    JELLY: 'jelly',
    RAT: 'rat',
    GHOST: 'ghost',
    PLANT: 'plant',
    BAT: 'bat',
    SALAMANDER: 'salamander',
    GOBLIN: 'goblin',
    CUBE: 'cube',
    ORC: 'orc',
    BANDIT: 'bandit',
    WRAITH: 'wraith',
    MIMIC: 'mimic',
    GARGOYLE: 'gargoyle',
    IMP: 'imp',
    TROLL: 'troll',
    SLIME: 'slime',
    ZOMBIE: 'zombie',
    SERPENT: 'serpent',
    MUSHROOM: 'mushroom',
    EYE_BEAST: 'eye_beast',
    SCARAB: 'scarab',
    SHADOW: 'shadow',
    CULTIST: 'cultist',
    MINER: 'miner'
};

// Check if a monster type should leave blood stains
function monsterShouldBleed(monsterType) {
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
function getMonsterBloodSize(monsterType) {
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

// Get difficulty level for a monster type (1-12 scale)
function getMonsterDifficulty(monsterType) {
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

// Convert difficulty number to text label
function getDifficultyText(difficulty) {
    if (difficulty <= 2) return 'Trivial';
    if (difficulty <= 4) return 'Easy';
    if (difficulty <= 6) return 'Medium';
    if (difficulty <= 8) return 'Hard';
    if (difficulty <= 10) return 'Very Hard';
    return 'Extreme';
}

// Calculate monster stats based on difficulty
function getMonsterStats(difficulty) {
    // Base health: 10 + (difficulty * 8) with some variation
    // Difficulty 1: ~18 health
    // Difficulty 5: ~50 health  
    // Difficulty 10: ~90 health
    // Difficulty 12: ~106 health
    const baseHealth = 10 + (difficulty * 8);
    const health = Math.floor(baseHealth + (Math.random() - 0.5) * difficulty * 2);
    
    // Base damage: 5 + (difficulty * 2) with some variation
    // Difficulty 1: ~7 damage
    // Difficulty 5: ~15 damage
    // Difficulty 10: ~25 damage
    // Difficulty 12: ~29 damage
    const baseDamage = 5 + (difficulty * 2);
    const attackPower = Math.floor(baseDamage + (Math.random() - 0.5) * difficulty * 0.5);
    
    return {
        health: Math.max(5, health),
        maxHealth: Math.max(5, health),
        attackPower: Math.max(3, attackPower)
    };
}

// Spawn monsters in the dungeon
function spawnMonsters() {
    const cellSize = game.dungeon.cellSize;
    const numMonsters = 24;
    let spawned = 0;
    
    const types = Object.values(MONSTER_TYPES);
    
    // Try to spawn monsters in random walkable spaces
    for (let attempt = 0; attempt < 100 && spawned < numMonsters; attempt++) {
        const x = Math.floor(Math.random() * game.dungeon.width);
        const y = Math.floor(Math.random() * game.dungeon.height);
        
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
                const randomType = types[Math.floor(Math.random() * types.length)];
                createMonster(x, y, randomType);
                spawned++;
            }
        }
    }
}

// Spawn a single new monster at a random location
function spawnSingleMonster() {
    const cellSize = game.dungeon.cellSize;
    const types = Object.values(MONSTER_TYPES);
    
    // Try to spawn a monster in a random walkable space
    for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * game.dungeon.width);
        const y = Math.floor(Math.random() * game.dungeon.height);
        
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
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    createMonster(x, y, randomType);
                    console.log(`Spawned new ${getMonsterName(randomType)} at (${x}, ${y})`);
                    return true;
                }
            }
        }
    }
    return false;
}

// Check if we need to spawn more monsters and spawn them
function checkAndSpawnMonsters() {
    const minMonsters = 15; // Minimum number of monsters to maintain
    const maxMonsters = 24; // Maximum number of monsters
    
    if (game.monsters.length < minMonsters) {
        // Spawn multiple monsters to bring count back up
        const toSpawn = Math.min(maxMonsters - game.monsters.length, 5);
        for (let i = 0; i < toSpawn; i++) {
            spawnSingleMonster();
        }
    }
}

// Spawn a single new monster at a random location
function spawnSingleMonster() {
    const cellSize = game.dungeon.cellSize;
    const types = Object.values(MONSTER_TYPES);
    
    // Try to spawn a monster in a random walkable space
    for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * game.dungeon.width);
        const y = Math.floor(Math.random() * game.dungeon.height);
        
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
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    createMonster(x, y, randomType);
                    console.log(`Spawned new ${getMonsterName(randomType)} at (${x}, ${y})`);
                    return true;
                }
            }
        }
    }
    return false;
}

// Spawn treasures in the dungeon
function spawnTreasures() {
    const cellSize = game.dungeon.cellSize;
    const numTreasures = 15;
    let spawned = 0;
    
    const types = Object.values(TREASURE_TYPES);
    
    // Try to spawn treasures in random walkable spaces
    for (let attempt = 0; attempt < 100 && spawned < numTreasures; attempt++) {
        const x = Math.floor(Math.random() * game.dungeon.width);
        const y = Math.floor(Math.random() * game.dungeon.height);
        
        // Check if space is walkable and not too close to player
        if (dungeonMap[y][x] === 0) {
            const worldX = x * cellSize + cellSize / 2;
            const worldZ = y * cellSize + cellSize / 2;
            const distToPlayer = Math.sqrt(
                Math.pow(worldX - game.player.position.x, 2) +
                Math.pow(worldZ - game.player.position.z, 2)
            );
            
            // Don't spawn too close to player
            if (distToPlayer > cellSize * 3) {
                // Weighted random selection (more coins and trinkets, fewer chests)
                const rand = Math.random();
                let treasureType;
                if (rand < 0.15) {
                    treasureType = TREASURE_TYPES.CHEST;
                } else if (rand < 0.50) {
                    treasureType = TREASURE_TYPES.GOLD_COIN;
                } else if (rand < 0.75) {
                    treasureType = TREASURE_TYPES.TRINKET;
                } else {
                    treasureType = TREASURE_TYPES.GEM;
                }
                
                createTreasure(x, y, treasureType);
                spawned++;
            }
        }
    }
}

// Create a treasure at grid position
function createTreasure(gridX, gridY, type) {
    const cellSize = game.dungeon.cellSize;
    const treasureGroup = new THREE.Group();
    let mesh;
    
    switch(type.name) {
        case 'chest':
            // Treasure chest - detailed with metal bands and lock
            const chestBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.5, 0.5),
                new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.8 })
            );
            const chestLid = new THREE.Mesh(
                new THREE.BoxGeometry(0.65, 0.15, 0.55),
                new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.8 })
            );
            chestLid.position.y = 0.325;
            
            // Metal bands
            const bandMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9, roughness: 0.3 });
            for (let i = 0; i < 3; i++) {
                const band = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.05, 0.05), bandMaterial);
                band.position.set(0, -0.2 + i * 0.2, 0.28);
                treasureGroup.add(band);
            }
            
            // Front trim and lock
            const frontTrim = new THREE.Mesh(
                new THREE.BoxGeometry(0.7, 0.1, 0.05),
                new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 })
            );
            frontTrim.position.z = 0.28;
            
            // Lock
            const lock = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.2, 0.1),
                new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9, roughness: 0.2 })
            );
            lock.position.set(0, 0, 0.3);
            const keyhole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            keyhole.rotation.x = Math.PI / 2;
            keyhole.position.set(0, 0, 0.35);
            
            // Hinges on lid
            const hingeGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.08);
            const leftHinge = new THREE.Mesh(hingeGeometry, bandMaterial);
            leftHinge.position.set(-0.25, 0.25, -0.25);
            const rightHinge = new THREE.Mesh(hingeGeometry, bandMaterial);
            rightHinge.position.set(0.25, 0.25, -0.25);
            
            treasureGroup.add(chestBody);
            treasureGroup.add(chestLid);
            treasureGroup.add(frontTrim);
            treasureGroup.add(lock);
            treasureGroup.add(keyhole);
            treasureGroup.add(leftHinge);
            treasureGroup.add(rightHinge);
            break;
            
        case 'coin':
            // Stack of gold coins
            const coinMaterial = new THREE.MeshStandardMaterial({
                color: type.color,
                metalness: 0.9,
                roughness: 0.1,
                emissive: type.color,
                emissiveIntensity: 0.4
            });
            
            // Create a small stack of coins
            for (let i = 0; i < 5; i++) {
                const coin = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16),
                    coinMaterial
                );
                coin.position.y = i * 0.045;
                coin.rotation.y = Math.random() * Math.PI;
                
                // Add embossed edge detail
                const edgeDetail = new THREE.Mesh(
                    new THREE.TorusGeometry(0.16, 0.015, 8, 16),
                    new THREE.MeshStandardMaterial({ color: 0xFFAA00, metalness: 1, roughness: 0.2 })
                );
                edgeDetail.rotation.x = Math.PI / 2;
                edgeDetail.position.y = i * 0.045;
                coin.rotation.x = Math.PI / 2;
                
                treasureGroup.add(coin);
                treasureGroup.add(edgeDetail);
            }
            break;
            
        case 'gem':
            // Crystal cluster - multiple gems
            const gemMaterial = new THREE.MeshStandardMaterial({
                color: type.color,
                metalness: 0.3,
                roughness: 0.1,
                transparent: true,
                opacity: 0.8,
                emissive: type.color,
                emissiveIntensity: 0.4
            });
            
            // Main large crystal
            const mainCrystal = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.3, 0),
                gemMaterial
            );
            mainCrystal.position.y = 0.15;
            mainCrystal.scale.set(1, 1.5, 1);
            treasureGroup.add(mainCrystal);
            
            // Smaller surrounding crystals
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const smallCrystal = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.15, 0),
                    gemMaterial
                );
                smallCrystal.position.set(
                    Math.cos(angle) * 0.25,
                    Math.random() * 0.1,
                    Math.sin(angle) * 0.25
                );
                smallCrystal.scale.set(1, 1.2 + Math.random() * 0.5, 1);
                smallCrystal.rotation.y = Math.random() * Math.PI;
                treasureGroup.add(smallCrystal);
            }
            
            // Base rock
            const base = new THREE.Mesh(
                new THREE.SphereGeometry(0.35, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 })
            );
            base.scale.set(1.2, 0.4, 1.2);
            base.position.y = -0.05;
            treasureGroup.add(base);
            break;
            
        case 'trinket':
            // Magical artifact - complex ornate object
            // Only 20% of trinkets glow
            const isGlowingTrinket = Math.random() < 0.2;
            
            const trinketMaterial = new THREE.MeshStandardMaterial({
                color: type.color,
                metalness: 0.8,
                roughness: 0.2,
                emissive: type.color,
                emissiveIntensity: isGlowingTrinket ? 0.5 : 0
            });
            
            // Central sphere
            const center = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                trinketMaterial
            );
            treasureGroup.add(center);
            
            // Orbital rings
            for (let i = 0; i < 3; i++) {
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(0.22 + i * 0.05, 0.02, 8, 16),
                    trinketMaterial
                );
                ring.rotation.x = Math.PI / 2 + (i * Math.PI / 6);
                ring.rotation.y = (i * Math.PI / 3);
                treasureGroup.add(ring);
            }
            
            // Small orbs at cardinal points
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const orb = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05, 8, 8),
                    new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        emissive: type.color,
                        emissiveIntensity: 0.8
                    })
                );
                orb.position.set(Math.cos(angle) * 0.25, 0, Math.sin(angle) * 0.25);
                treasureGroup.add(orb);
            }
            
            // Decorative spikes
            const spikeGeometry = new THREE.ConeGeometry(0.03, 0.15, 4);
            for (let i = 0; i < 6; i++) {
                const spike = new THREE.Mesh(spikeGeometry, trinketMaterial);
                const angle = (i / 6) * Math.PI * 2;
                spike.position.set(Math.cos(angle) * 0.18, 0, Math.sin(angle) * 0.18);
                spike.rotation.z = -Math.atan2(Math.sin(angle), Math.cos(angle)) + Math.PI / 2;
                treasureGroup.add(spike);
            }
            break;

        case 'torch':
            // Dropped torch
            const torchHandle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.02, 0.4, 6),
                new THREE.MeshStandardMaterial({ color: 0x553311 })
            );
            torchHandle.rotation.z = Math.PI / 4;
            torchHandle.position.y = 0.1;
            treasureGroup.add(torchHandle);
            
            const torchHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff4400, emissiveIntensity: 0.8 })
            );
            torchHead.position.set(-0.15, 0.25, 0);
            treasureGroup.add(torchHead);
            
            // Add a small light to the dropped torch so it's visible
            const droppedLight = new THREE.PointLight(0xff6600, 0.5, 3);
            droppedLight.position.set(-0.15, 0.3, 0);
            treasureGroup.add(droppedLight);
            break;
    }
    
    // Enable shadows for treasures (except translucent ones)
    if (type !== 'gem') {
        treasureGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    treasureGroup.position.x = gridX * cellSize + cellSize / 2;
    treasureGroup.position.y = 0.3;
    treasureGroup.position.z = gridY * cellSize + cellSize / 2;
    
    game.scene.add(treasureGroup);
    
    // Treasure data
    const treasure = {
        type: type,
        mesh: treasureGroup,
        gridX: gridX,
        gridY: gridY,
        collected: false,
        rotation: Math.random() * Math.PI * 2
    };
    
    game.treasures.push(treasure);
}

// Update treasures (animation and pickup)
function updateTreasures(deltaTime) {
    for (let i = game.treasures.length - 1; i >= 0; i--) {
        const treasure = game.treasures[i];
        
        if (treasure.collected) continue;
        
        // Rotate and bob
        treasure.rotation += deltaTime * 2;
        treasure.mesh.rotation.y = treasure.rotation;
        treasure.mesh.position.y = 0.3 + Math.sin(treasure.rotation * 2) * 0.1;
        
        // Check if player is on the same grid square
        const playerGridX = Math.floor(game.player.position.x / game.dungeon.cellSize);
        const playerGridZ = Math.floor(game.player.position.z / game.dungeon.cellSize);
        
        if (playerGridX === treasure.gridX && playerGridZ === treasure.gridY) {
            // Collect treasure
            collectTreasure(treasure, i);
        }
    }
}

// Collect a treasure
function collectTreasure(treasure, index) {
    treasure.collected = true;
    
    if (treasure.type.name === 'torch') {
        game.player.torch.turnsActive = 0; // Reset torch
        game.player.torch.intensityBase = 2.0; // Reset intensity (was 1.0)
        game.player.torch.rangeBase = 18; // Reset range (was 15)
        
        // Reset color
        game.player.torch.color.setHex(0xffaa00);
        game.player.light.color.setHex(0xffaa00);
        
        game.player.light.visible = true;
        logMessage(`You picked up a fresh torch! Your light is renewed.`, 'torch');
    } else {
        game.wealth += treasure.type.value;
        logMessage(`You picked up a ${treasure.type.name} worth ${treasure.type.value} gold!`, 'item');
        updateWealthDisplay();
    }

    // Play collection animation
    const startY = treasure.mesh.position.y;
    let animTime = 0;
    const animDuration = 0.3;
    
    const collectAnim = setInterval(() => {
        animTime += 0.016;
        const progress = animTime / animDuration;
        
        if (progress >= 1.0) {
            game.scene.remove(treasure.mesh);
            game.treasures.splice(index, 1);
            clearInterval(collectAnim);
        } else {
            treasure.mesh.position.y = startY + progress * 2;
            treasure.mesh.scale.setScalar(1 - progress);
        }
    }, 16);
    
    updateWealthDisplay();
}

// Update decorations (adjust spider web opacity based on distance)
function updateDecorations() {
    for (let decoration of game.decorations) {
        if (decoration.type.name === 'spider_web') {
            // Calculate distance from player
            const dx = decoration.mesh.position.x - game.player.position.x;
            const dz = decoration.mesh.position.z - game.player.position.z;
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

// Update wealth display
function updateWealthDisplay() {
    const wealthElement = document.getElementById('wealth');
    if (wealthElement) {
        wealthElement.textContent = `Wealth: ${game.wealth} gold`;
    }
}

// Create decorative element at grid position
// Create blood stain decoration at a world position
function createBloodStain(worldX, worldZ, sizeMultiplier = 1.0) {
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

function createDecoration(gridX, gridY, type) {
    const cellSize = game.dungeon.cellSize;
    const decorationGroup = new THREE.Group();
    
    // Wall inscriptions need precise positioning, others get random offset
    let worldX, worldZ;
    if (type.name === 'wall_inscription' || type.name === 'wyrm_carcass' || type.name === 'ladder') {
        worldX = gridX * cellSize + cellSize / 2;
        worldZ = gridY * cellSize + cellSize / 2;
    } else {
        worldX = gridX * cellSize + cellSize / 2 + (Math.random() - 0.5) * cellSize * 0.6;
        worldZ = gridY * cellSize + cellSize / 2 + (Math.random() - 0.5) * cellSize * 0.6;
    }
    
    switch(type.name) {
        case 'puddle': {
            // Water puddle - highly irregular organic shape with extreme size variance
            const puddleGroup = new THREE.Group();
            
            // Much greater size variance: tiny droplets to large pools
            const sizeRoll = Math.random();
            let puddleSize;
            if (sizeRoll < 0.3) {
                // Small puddle/droplet (30% chance)
                puddleSize = 0.1 + Math.random() * 0.2;
            } else if (sizeRoll < 0.7) {
                // Medium puddle (40% chance)
                puddleSize = 0.3 + Math.random() * 0.4;
            } else {
                // Large pool (30% chance)
                puddleSize = 0.7 + Math.random() * 0.8;
            }
            
            // Create highly irregular shape using custom geometry
            const numPoints = 8 + Math.floor(Math.random() * 12);
            const points = [];
            const centerVariation = puddleSize * 0.2;
            
            // Generate irregular perimeter points
            for (let i = 0; i < numPoints; i++) {
                const angle = (Math.PI * 2 * i) / numPoints + (Math.random() - 0.5) * 0.6;
                const radius = puddleSize * (0.5 + Math.random() * 0.7); // High variation
                const x = Math.cos(angle) * radius + (Math.random() - 0.5) * centerVariation;
                const z = Math.sin(angle) * radius + (Math.random() - 0.5) * centerVariation;
                points.push(new THREE.Vector2(x, z));
            }
            
            // Create main puddle body using shape geometry
            const shape = new THREE.Shape(points);
            const puddleGeom = new THREE.ShapeGeometry(shape, 32);
            const puddleMat = new THREE.MeshPhongMaterial({ 
                color: 0x0d2a42,
                shininess: 120,
                transparent: true,
                opacity: 0.85,
                specular: 0x88ccff,
                side: THREE.DoubleSide
            });
            const puddle = new THREE.Mesh(puddleGeom, puddleMat);
            puddle.rotation.x = -Math.PI / 2;
            puddle.position.y = -0.005;
            puddle.receiveShadow = true;
            puddleGroup.add(puddle);
            
            // Add sub-puddles for extra irregularity (random tendrils/extensions)
            const numSubPuddles = Math.floor(Math.random() * 4);
            for (let i = 0; i < numSubPuddles; i++) {
                const subSize = puddleSize * (0.2 + Math.random() * 0.3);
                const angle = Math.random() * Math.PI * 2;
                const distance = puddleSize * (0.6 + Math.random() * 0.5);
                
                const subGeom = new THREE.CircleGeometry(subSize, 8 + Math.floor(Math.random() * 8));
                const subPuddle = new THREE.Mesh(subGeom, puddleMat);
                subPuddle.rotation.x = -Math.PI / 2;
                subPuddle.position.x = Math.cos(angle) * distance;
                subPuddle.position.z = Math.sin(angle) * distance;
                subPuddle.position.y = -0.004;
                subPuddle.scale.set(1, 0.8 + Math.random() * 0.4, 1); // Stretch irregularly
                subPuddle.receiveShadow = true;
                puddleGroup.add(subPuddle);
            }
            
            // Surface highlights (offset and irregular)
            if (puddleSize > 0.25) {
                const numHighlights = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < numHighlights; i++) {
                    const highlightSize = puddleSize * (0.2 + Math.random() * 0.4);
                    const highlightGeom = new THREE.CircleGeometry(highlightSize, 12);
                    const highlightMat = new THREE.MeshPhongMaterial({ 
                        color: 0x4a7d9a,
                        transparent: true,
                        opacity: 0.25 + Math.random() * 0.15,
                        emissive: 0x000000,
                        specular: 0x88ccff,
                        shininess: 100
                    });
                    const highlight = new THREE.Mesh(highlightGeom, highlightMat);
                    highlight.rotation.x = -Math.PI / 2;
                    highlight.position.y = 0.002;
                    highlight.position.x = (Math.random() - 0.5) * puddleSize * 0.5;
                    highlight.position.z = (Math.random() - 0.5) * puddleSize * 0.5;
                    highlight.scale.set(0.5 + Math.random() * 0.5, 0.7 + Math.random() * 0.6, 1);
                    puddleGroup.add(highlight);
                }
            }
            
            // Darker depth areas (random spots)
            const numDepths = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numDepths; i++) {
                const depthSize = puddleSize * (0.15 + Math.random() * 0.3);
                const depthGeom = new THREE.CircleGeometry(depthSize, 8);
                const depthMat = new THREE.MeshPhongMaterial({ 
                    color: 0x051015,
                    transparent: true,
                    opacity: 0.4 + Math.random() * 0.3,
                    shininess: 50
                });
                const depth = new THREE.Mesh(depthGeom, depthMat);
                depth.rotation.x = -Math.PI / 2;
                depth.position.y = -0.006;
                depth.position.x = (Math.random() - 0.5) * puddleSize * 0.6;
                depth.position.z = (Math.random() - 0.5) * puddleSize * 0.6;
                puddleGroup.add(depth);
            }
            
            // Ripples (only on medium and large puddles)
            if (puddleSize > 0.4 && Math.random() > 0.5) {
                const numRipples = 1 + Math.floor(Math.random() * 3);
                const rippleOriginX = (Math.random() - 0.5) * puddleSize * 0.4;
                const rippleOriginZ = (Math.random() - 0.5) * puddleSize * 0.4;
                
                for (let i = 0; i < numRipples; i++) {
                    const rippleGeom = new THREE.RingGeometry(
                        puddleSize * (0.2 + i * 0.15),
                        puddleSize * (0.23 + i * 0.15),
                        16
                    );
                    const rippleMat = new THREE.MeshPhongMaterial({ 
                        color: 0x2a5d7c,
                        transparent: true,
                        opacity: 0.3 - i * 0.08,
                        shininess: 100
                    });
                    const ripple = new THREE.Mesh(rippleGeom, rippleMat);
                    ripple.rotation.x = -Math.PI / 2;
                    ripple.position.y = 0.001;
                    ripple.position.x = rippleOriginX;
                    ripple.position.z = rippleOriginZ;
                    puddleGroup.add(ripple);
                }
            }
            
            // Rotate whole puddle randomly
            puddleGroup.rotation.y = Math.random() * Math.PI * 2;
            
            // Debug arrow for puddle (Blue)
            const arrowGroup = new THREE.Group();
            const shaftGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
            const arrowMat = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue
            const shaft = new THREE.Mesh(shaftGeom, arrowMat);
            shaft.rotation.x = Math.PI / 2;
            arrowGroup.add(shaft);
            
            const headGeom = new THREE.ConeGeometry(0.06, 0.15, 8);
            const head = new THREE.Mesh(headGeom, arrowMat);
            head.position.z = 0.15;
            head.rotation.x = -Math.PI / 2;
            arrowGroup.add(head);
            
            // Position above puddle pointing down
            arrowGroup.position.y = 1.0;
            arrowGroup.rotation.x = Math.PI / 2; // Point down (-Y)
            arrowGroup.visible = false;
            
            puddleGroup.add(arrowGroup);
            decorationGroup.userData.debugArrow = arrowGroup;
            
            decorationGroup.add(puddleGroup);
            break;
        }
        
        case 'spider_web': {
            // Realistic spider web with 3D structure
            const webGroup = new THREE.Group();
            const webSize = 0.5 + Math.random() * 0.3;
            
            // Silk material - Standard material to react properly to light (dark in darkness)
            const silkMat = new THREE.MeshStandardMaterial({ 
                color: 0xaaaaaa, // Darker grey base
                transparent: true,
                opacity: 0.4,
                roughness: 0.6,
                metalness: 0.1,
                side: THREE.DoubleSide
            });
            
            const thickSilkMat = new THREE.MeshStandardMaterial({ 
                color: 0xcccccc,
                transparent: true,
                opacity: 0.6,
                roughness: 0.7,
                metalness: 0.1
            });
            
            // Anchor points (where web attaches)
            const numAnchors = 5 + Math.floor(Math.random() * 3);
            const anchorPoints = [];
            for (let i = 0; i < numAnchors; i++) {
                const angle = (Math.PI * 2 * i) / numAnchors + (Math.random() - 0.5) * 0.3;
                const distance = webSize * (0.9 + Math.random() * 0.2);
                anchorPoints.push({
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance
                });
            }
            
            // Center point
            const centerX = (Math.random() - 0.5) * 0.1;
            const centerY = (Math.random() - 0.5) * 0.1;
            
            // Radial support strands (thicker, from center to anchors)
            for (let i = 0; i < anchorPoints.length; i++) {
                const anchor = anchorPoints[i];
                const length = Math.sqrt(
                    Math.pow(anchor.x - centerX, 2) + 
                    Math.pow(anchor.y - centerY, 2)
                );
                const angle = Math.atan2(anchor.y - centerY, anchor.x - centerX);
                
                const strandGeom = new THREE.CylinderGeometry(0.003, 0.002, length, 4);
                const strand = new THREE.Mesh(strandGeom, thickSilkMat);
                strand.rotation.z = -angle + Math.PI / 2;
                strand.position.x = (anchor.x + centerX) / 2;
                strand.position.y = (anchor.y + centerY) / 2;
                webGroup.add(strand);
            }
            
            // Spiral capture strands (thinner, sticky-looking)
            const numSpirals = 6 + Math.floor(Math.random() * 4);
            for (let i = 1; i <= numSpirals; i++) {
                const radius = (webSize * i) / (numSpirals + 2);
                const segments = Math.max(16, Math.floor(radius * 40));
                
                const points = [];
                for (let j = 0; j <= segments; j++) {
                    const angle = (Math.PI * 2 * j) / segments;
                    const r = radius * (0.95 + Math.random() * 0.1); // Slight irregularity
                    points.push(new THREE.Vector3(
                        Math.cos(angle) * r + centerX,
                        Math.sin(angle) * r + centerY,
                        (Math.random() - 0.5) * 0.02 // Slight depth variation
                    ));
                }
                
                const spiralGeom = new THREE.BufferGeometry().setFromPoints(points);
                // Darker color for lines so they don't appear to glow as much
                const spiralMat = new THREE.LineBasicMaterial({ 
                    color: 0x444444, 
                    transparent: true,
                    opacity: 0.5,
                    linewidth: 1
                });
                const spiral = new THREE.Line(spiralGeom, spiralMat);
                webGroup.add(spiral);
                
                // Add tiny droplets on some spirals
                if (i % 2 === 0 && Math.random() > 0.5) {
                    for (let j = 0; j < segments; j += 3) {
                        if (Math.random() > 0.6) {
                            const angle = (Math.PI * 2 * j) / segments;
                            const dropletGeom = new THREE.SphereGeometry(0.008, 4, 4);
                            const dropletMat = new THREE.MeshPhongMaterial({ 
                                color: 0xccffff,
                                transparent: true,
                                opacity: 0.7,
                                shininess: 100
                            });
                            const droplet = new THREE.Mesh(dropletGeom, dropletMat);
                            droplet.position.x = Math.cos(angle) * radius + centerX;
                            droplet.position.y = Math.sin(angle) * radius + centerY;
                            droplet.scale.y = 1.3;
                            webGroup.add(droplet);
                        }
                    }
                }
            }
            
            // Random connecting threads for realism
            for (let i = 0; i < 5; i++) {
                if (Math.random() > 0.5) {
                    const point1 = anchorPoints[Math.floor(Math.random() * anchorPoints.length)];
                    const point2 = anchorPoints[Math.floor(Math.random() * anchorPoints.length)];
                    if (point1 !== point2) {
                        const threadGeom = new THREE.BufferGeometry().setFromPoints([
                            new THREE.Vector3(point1.x, point1.y, 0),
                            new THREE.Vector3(point2.x, point2.y, 0)
                        ]);
                        // Darker color for connecting threads
                        const thread = new THREE.Line(threadGeom, new THREE.LineBasicMaterial({ 
                            color: 0x555555,
                            transparent: true,
                            opacity: 0.4
                        }));
                        webGroup.add(thread);
                    }
                }
            }
            
            // Position web in corner or against wall
            webGroup.position.y = 1.8 + Math.random() * 0.8;
            webGroup.rotation.x = Math.random() * 0.4 - 0.2; // Slight tilt
            webGroup.rotation.y = Math.random() * Math.PI * 2;
            webGroup.rotation.z = (Math.random() - 0.5) * 0.3;
            
            decorationGroup.add(webGroup);
            break;
        }
        
        case 'stalactite': {
            // Hanging from ceiling with irregular, layered structure
            const totalHeight = 0.5 + Math.random() * 0.8;
            const stalactiteGroup = new THREE.Group();
            
            const baseMat = new THREE.MeshPhongMaterial({ 
                color: 0x6a6a6a,
                flatShading: true
            });
            const darkMat = new THREE.MeshPhongMaterial({ 
                color: 0x4a4a4a,
                flatShading: true
            });
            
            // Build stalactite from multiple tapered segments
            const numSegments = 4 + Math.floor(Math.random() * 4);
            let currentY = 4;
            let currentRadius = 0.08 + Math.random() * 0.04;
            
            for (let i = 0; i < numSegments; i++) {
                const segmentHeight = totalHeight / numSegments;
                const nextRadius = currentRadius * (0.6 + Math.random() * 0.3);
                
                // Irregular cone segment
                const segGeom = new THREE.CylinderGeometry(
                    nextRadius,
                    currentRadius + (Math.random() - 0.5) * 0.02,
                    segmentHeight,
                    5 + Math.floor(Math.random() * 3),
                    1
                );
                
                // Randomize vertices for rough surface
                const positions = segGeom.attributes.position;
                for (let j = 0; j < positions.count; j++) {
                    const x = positions.getX(j);
                    const z = positions.getZ(j);
                    const noise = (Math.random() - 0.5) * 0.015;
                    positions.setX(j, x + noise);
                    positions.setZ(j, z + noise);
                }
                positions.needsUpdate = true;
                segGeom.computeVertexNormals();
                
                const segment = new THREE.Mesh(segGeom, i % 2 === 0 ? baseMat : darkMat);
                segment.position.y = currentY - segmentHeight / 2;
                stalactiteGroup.add(segment);
                
                // Add bumps and protrusions
                if (Math.random() > 0.6) {
                    const bumpGeom = new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 4, 4);
                    const bump = new THREE.Mesh(bumpGeom, darkMat);
                    const angle = Math.random() * Math.PI * 2;
                    const radius = currentRadius * 0.8;
                    bump.position.set(
                        Math.cos(angle) * radius,
                        currentY - segmentHeight * Math.random(),
                        Math.sin(angle) * radius
                    );
                    bump.scale.y = 0.5 + Math.random() * 0.5;
                    stalactiteGroup.add(bump);
                }
                
                currentY -= segmentHeight;
                currentRadius = nextRadius;
            }
            
            // Sharp drip tip
            const tipGeom = new THREE.ConeGeometry(currentRadius * 0.6, 0.08, 5);
            const tip = new THREE.Mesh(tipGeom, darkMat);
            tip.position.y = currentY - 0.04;
            stalactiteGroup.add(tip);
            
            // Water droplet at tip
            if (Math.random() > 0.5) {
                const dropletGeom = new THREE.SphereGeometry(0.015, 6, 6);
                const dropletMat = new THREE.MeshPhongMaterial({ 
                    color: 0x88ccff,
                    transparent: true,
                    opacity: 0.7,
                    shininess: 100
                });
                const droplet = new THREE.Mesh(dropletGeom, dropletMat);
                droplet.position.y = currentY - 0.08;
                droplet.scale.y = 1.4;
                stalactiteGroup.add(droplet);
            }
            
            decorationGroup.add(stalactiteGroup);
            break;
        }
        
        case 'stalagmite': {
            // Growing from floor with layered, ridged structure
            const totalHeight = 0.4 + Math.random() * 0.9;
            const stalagmiteGroup = new THREE.Group();
            
            const baseMat = new THREE.MeshPhongMaterial({ 
                color: 0x555555,
                flatShading: true
            });
            const lightMat = new THREE.MeshPhongMaterial({ 
                color: 0x656565,
                flatShading: true
            });
            
            // Build stalagmite from bottom up with growth layers
            const numLayers = 5 + Math.floor(Math.random() * 4);
            let currentY = 0;
            let currentRadius = 0.12 + Math.random() * 0.05;
            
            for (let i = 0; i < numLayers; i++) {
                const layerHeight = totalHeight / numLayers;
                const nextRadius = currentRadius * (0.7 + Math.random() * 0.2);
                
                // Create layer with irregular shape
                const layerGeom = new THREE.CylinderGeometry(
                    nextRadius,
                    currentRadius * (0.95 + Math.random() * 0.1),
                    layerHeight,
                    6 + Math.floor(Math.random() * 2),
                    1
                );
                
                // Add roughness to vertices
                const positions = layerGeom.attributes.position;
                for (let j = 0; j < positions.count; j++) {
                    const y = positions.getY(j);
                    const x = positions.getX(j);
                    const z = positions.getZ(j);
                    const noise = (Math.random() - 0.5) * 0.02;
                    positions.setX(j, x + noise);
                    positions.setZ(j, z + noise);
                    
                    // Add wave-like ridges
                    const angle = Math.atan2(z, x);
                    const ridge = Math.sin(angle * 3 + y * 5) * 0.01;
                    positions.setX(j, x + x * ridge);
                    positions.setZ(j, z + z * ridge);
                }
                positions.needsUpdate = true;
                layerGeom.computeVertexNormals();
                
                const layer = new THREE.Mesh(layerGeom, i % 3 === 0 ? lightMat : baseMat);
                layer.position.y = currentY + layerHeight / 2;
                stalagmiteGroup.add(layer);
                
                // Add mineral deposits
                if (Math.random() > 0.7) {
                    const depositGeom = new THREE.SphereGeometry(0.015 + Math.random() * 0.02, 4, 4);
                    const depositMat = new THREE.MeshPhongMaterial({ 
                        color: 0x7a6a5a,
                        flatShading: true
                    });
                    const deposit = new THREE.Mesh(depositGeom, depositMat);
                    const angle = Math.random() * Math.PI * 2;
                    const radius = currentRadius * 0.9;
                    deposit.position.set(
                        Math.cos(angle) * radius,
                        currentY + layerHeight * Math.random(),
                        Math.sin(angle) * radius
                    );
                    stalagmiteGroup.add(deposit);
                }
                
                currentY += layerHeight;
                currentRadius = nextRadius;
            }
            
            // Pointed tip
            const tipGeom = new THREE.ConeGeometry(currentRadius * 0.8, 0.1, 5);
            const tip = new THREE.Mesh(tipGeom, baseMat);
            tip.position.y = currentY + 0.05;
            stalagmiteGroup.add(tip);
            
            decorationGroup.add(stalagmiteGroup);
            
            // Add some smaller satellite stalagmites
            for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
                const smallHeight = totalHeight * (0.2 + Math.random() * 0.3);
                const smallGroup = new THREE.Group();
                
                const smallLayers = 2 + Math.floor(Math.random() * 3);
                let smallY = 0;
                let smallRadius = 0.04 + Math.random() * 0.03;
                
                for (let j = 0; j < smallLayers; j++) {
                    const smallLayerHeight = smallHeight / smallLayers;
                    const smallGeom = new THREE.ConeGeometry(
                        smallRadius * 0.7,
                        smallLayerHeight,
                        5
                    );
                    const smallLayer = new THREE.Mesh(smallGeom, baseMat);
                    smallLayer.position.y = smallY + smallLayerHeight / 2;
                    smallGroup.add(smallLayer);
                    smallY += smallLayerHeight;
                    smallRadius *= 0.7;
                }
                
                smallGroup.position.x = (Math.random() - 0.5) * 0.5;
                smallGroup.position.z = (Math.random() - 0.5) * 0.5;
                decorationGroup.add(smallGroup);
            }
            break;
        }
        
        case 'cracked_rock': {
            // Broken rock pieces
            const rockMat = new THREE.MeshPhongMaterial({ 
                color: 0x4a4a4a,
                flatShading: true
            });
            
            // Main rock
            const mainGeom = new THREE.DodecahedronGeometry(0.15 + Math.random() * 0.15, 0);
            const mainRock = new THREE.Mesh(mainGeom, rockMat);
            mainRock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            mainRock.position.y = 0.1;
            decorationGroup.add(mainRock);
            
            // Crack lines (darker color)
            const crackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            for (let i = 0; i < 3; i++) {
                const crackGeom = new THREE.BoxGeometry(0.02, 0.01, 0.2);
                const crack = new THREE.Mesh(crackGeom, crackMat);
                crack.position.y = 0.1;
                crack.rotation.y = (Math.PI * 2 * i) / 3;
                decorationGroup.add(crack);
            }
            
            // Scattered fragments
            for (let i = 0; i < 4; i++) {
                const fragGeom = new THREE.TetrahedronGeometry(0.04, 0);
                const frag = new THREE.Mesh(fragGeom, rockMat);
                frag.position.x = (Math.random() - 0.5) * 0.6;
                frag.position.z = (Math.random() - 0.5) * 0.6;
                frag.position.y = 0.02;
                frag.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                decorationGroup.add(frag);
            }
            break;
        }
        
        case 'pebbles': {
            // Small stones scattered on floor
            const pebbleMat = new THREE.MeshPhongMaterial({ 
                color: 0x666666,
                flatShading: true
            });
            
            for (let i = 0; i < 5 + Math.floor(Math.random() * 5); i++) {
                const size = 0.02 + Math.random() * 0.04;
                const pebbleGeom = new THREE.SphereGeometry(size, 4, 4);
                const pebble = new THREE.Mesh(pebbleGeom, pebbleMat);
                pebble.position.x = (Math.random() - 0.5) * 0.8;
                pebble.position.z = (Math.random() - 0.5) * 0.8;
                pebble.position.y = size * 0.5;
                pebble.scale.y = 0.6; // Flatten slightly
                decorationGroup.add(pebble);
            }
            break;
        }
        
        case 'bones': {
            // Skeleton remains
            const boneMat = new THREE.MeshPhongMaterial({ 
                color: 0xd4c5b0,
                shininess: 5
            });
            
            // Skull
            const skullGeom = new THREE.SphereGeometry(0.08, 8, 6);
            const skull = new THREE.Mesh(skullGeom, boneMat);
            skull.position.y = 0.06;
            skull.scale.set(1, 0.9, 1.1);
            decorationGroup.add(skull);
            
            // Eye sockets
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            for (let i = 0; i < 2; i++) {
                const eyeGeom = new THREE.SphereGeometry(0.015, 4, 4);
                const eye = new THREE.Mesh(eyeGeom, eyeMat);
                eye.position.set((i - 0.5) * 0.06, 0.08, 0.08);
                decorationGroup.add(eye);
            }
            
            // Scattered bones
            for (let i = 0; i < 3; i++) {
                const boneGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 6);
                const bone = new THREE.Mesh(boneGeom, boneMat);
                bone.position.x = (Math.random() - 0.5) * 0.4;
                bone.position.z = (Math.random() - 0.5) * 0.4;
                bone.position.y = 0.01;
                bone.rotation.z = Math.random() * Math.PI;
                bone.rotation.y = Math.random() * Math.PI * 2;
                decorationGroup.add(bone);
            }
            break;
        }

        case 'bone_pile': {
            // Adjust position to be near walls/corners
            const walls = [];
            if (gridY > 0 && dungeonMap[gridY-1][gridX] === 1) walls.push({x: 0, z: -1}); // North
            if (gridY < game.dungeon.height - 1 && dungeonMap[gridY+1][gridX] === 1) walls.push({x: 0, z: 1}); // South
            if (gridX > 0 && dungeonMap[gridY][gridX-1] === 1) walls.push({x: -1, z: 0}); // West
            if (gridX < game.dungeon.width - 1 && dungeonMap[gridY][gridX+1] === 1) walls.push({x: 1, z: 0}); // East
            
            if (walls.length > 0) {
                // Reset to center
                worldX = gridX * cellSize + cellSize / 2;
                worldZ = gridY * cellSize + cellSize / 2;
                
                let dirX = 0;
                let dirZ = 0;
                
                // Sum vectors to find corner direction
                for (let w of walls) {
                    dirX += w.x;
                    dirZ += w.z;
                }
                
                // If vectors cancel out (e.g. corridor), pick one random wall
                if (dirX === 0 && dirZ === 0) {
                    const w = walls[Math.floor(Math.random() * walls.length)];
                    dirX = w.x;
                    dirZ = w.z;
                }
                
                // Normalize
                const len = Math.sqrt(dirX*dirX + dirZ*dirZ);
                if (len > 0) {
                    dirX /= len;
                    dirZ /= len;
                }
                
                // Move towards wall(s)
                const offset = cellSize * 0.35;
                worldX += dirX * offset;
                worldZ += dirZ * offset;
                
                // Add some jitter
                worldX += (Math.random() - 0.5) * 0.5;
                worldZ += (Math.random() - 0.5) * 0.5;
            }

            // A larger pile of bones and skulls
            const pileGroup = new THREE.Group();
            const boneMat = new THREE.MeshStandardMaterial({ 
                color: 0xd4c5b0,
                roughness: 0.7,
                metalness: 0.1
            });
            const darkBoneMat = new THREE.MeshStandardMaterial({ 
                color: 0xa49580,
                roughness: 0.8,
                metalness: 0.1
            });

            // Base mound of debris/small bones
            const moundGeom = new THREE.SphereGeometry(0.3, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
            const mound = new THREE.Mesh(moundGeom, darkBoneMat);
            mound.scale.y = 0.3;
            mound.position.y = -0.02;
            pileGroup.add(mound);

            // Add multiple skulls
            const numSkulls = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numSkulls; i++) {
                const skullGroup = new THREE.Group();
                
                // Cranium
                const skullGeom = new THREE.SphereGeometry(0.08, 8, 6);
                const skull = new THREE.Mesh(skullGeom, boneMat);
                skull.scale.set(1, 0.9, 1.1);
                skullGroup.add(skull);
                
                // Eye sockets
                const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1.0 });
                for (let j = 0; j < 2; j++) {
                    const eyeGeom = new THREE.SphereGeometry(0.018, 4, 4);
                    const eye = new THREE.Mesh(eyeGeom, eyeMat);
                    eye.position.set((j - 0.5) * 0.06, 0.02, 0.075);
                    skullGroup.add(eye);
                }

                // Position skull on the pile
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.2;
                skullGroup.position.set(
                    Math.cos(angle) * radius,
                    0.05 + Math.random() * 0.15,
                    Math.sin(angle) * radius
                );
                skullGroup.rotation.set(
                    Math.random() * 0.5,
                    Math.random() * Math.PI * 2,
                    Math.random() * 0.5
                );
                pileGroup.add(skullGroup);
            }

            // Add long bones (femurs)
            const numLongBones = 4 + Math.floor(Math.random() * 5);
            for (let i = 0; i < numLongBones; i++) {
                const length = 0.2 + Math.random() * 0.15;
                const boneGeom = new THREE.CylinderGeometry(0.015, 0.015, length, 5);
                const bone = new THREE.Mesh(boneGeom, boneMat);
                
                // Ends of the bone (joints)
                const jointGeom = new THREE.SphereGeometry(0.025, 4, 4);
                const joint1 = new THREE.Mesh(jointGeom, boneMat);
                joint1.position.y = length / 2;
                bone.add(joint1);
                const joint2 = new THREE.Mesh(jointGeom, boneMat);
                joint2.position.y = -length / 2;
                bone.add(joint2);

                // Position randomly in pile
                bone.position.set(
                    (Math.random() - 0.5) * 0.4,
                    0.02 + Math.random() * 0.05,
                    (Math.random() - 0.5) * 0.4
                );
                // Lay flat-ish
                bone.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                bone.rotation.y = Math.random() * Math.PI * 2;
                bone.rotation.z = (Math.random() - 0.5) * 0.5;
                pileGroup.add(bone);
            }

            // Add rib cage fragments (curved tubes)
            const numRibs = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numRibs; i++) {
                const ribCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(-0.1, 0, 0),
                    new THREE.Vector3(-0.07, 0.05, 0),
                    new THREE.Vector3(0, 0.08, 0),
                    new THREE.Vector3(0.07, 0.05, 0),
                    new THREE.Vector3(0.1, 0, 0)
                ]);
                const ribGeom = new THREE.TubeGeometry(ribCurve, 8, 0.008, 4, false);
                const rib = new THREE.Mesh(ribGeom, boneMat);
                
                rib.position.set(
                    (Math.random() - 0.5) * 0.3,
                    0.02 + Math.random() * 0.05,
                    (Math.random() - 0.5) * 0.3
                );
                // Lay flat-ish
                rib.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 1.0;
                rib.rotation.y = Math.random() * Math.PI * 2;
                rib.rotation.z = (Math.random() - 0.5) * 0.5;
                pileGroup.add(rib);
            }

            decorationGroup.add(pileGroup);
            break;
        }
        
        case 'mushrooms': {
            // Cave mushrooms with variable glow
            const numMushrooms = 2 + Math.floor(Math.random() * 4);
            const isGlowing = Math.random() > 0.4; // 60% chance to glow
            
            for (let i = 0; i < numMushrooms; i++) {
                const mushroomGroup = new THREE.Group();
                
                // Stem
                const stemHeight = 0.05 + Math.random() * 0.08;
                const stemGeom = new THREE.CylinderGeometry(0.01, 0.015, stemHeight, 6);
                const stemMat = new THREE.MeshPhongMaterial({ color: 0xc4b5a0 });
                const stem = new THREE.Mesh(stemGeom, stemMat);
                stem.position.y = stemHeight / 2;
                mushroomGroup.add(stem);
                
                // Cap with conditional glow
                const capRadius = 0.04 + Math.random() * 0.05;
                const capGeom = new THREE.SphereGeometry(capRadius, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
                
                let capMat;
                if (isGlowing) {
                    // Glowing mushrooms - brighter colors
                    const glowIntensity = 0.5 + Math.random() * 0.5;
                    capMat = new THREE.MeshPhongMaterial({ 
                        color: 0x6a5aaa,
                        emissive: 0x4a3a8a,
                        emissiveIntensity: glowIntensity
                    });
                    
                    // Add point light for glowing mushrooms
                    // Increased intensity and range to illuminate surroundings
                    const mushroomLight = new THREE.PointLight(0x8a7acc, 1.5, 5);
                    mushroomLight.position.y = stemHeight + 0.1;
                    mushroomGroup.add(mushroomLight);
                } else {
                    // Regular mushrooms - muted colors
                    capMat = new THREE.MeshPhongMaterial({ 
                        color: 0x5a4a6a,
                        emissive: 0x000000,
                        emissiveIntensity: 0
                    });
                }
                
                const cap = new THREE.Mesh(capGeom, capMat);
                cap.position.y = stemHeight;
                mushroomGroup.add(cap);
                
                // Glow spots only on glowing mushrooms
                if (isGlowing) {
                    const numSpots = 3 + Math.floor(Math.random() * 3);
                    for (let j = 0; j < numSpots; j++) {
                        const spotGeom = new THREE.SphereGeometry(0.006 + Math.random() * 0.004, 4, 4);
                        const spotMat = new THREE.MeshBasicMaterial({ 
                            color: 0xaaccff,
                            transparent: true,
                            opacity: 0.9
                        });
                        const spot = new THREE.Mesh(spotGeom, spotMat);
                        const angle = (Math.PI * 2 * j) / numSpots + Math.random() * 0.5;
                        const radius = capRadius * (0.3 + Math.random() * 0.5);
                        spot.position.x = Math.cos(angle) * radius;
                        spot.position.z = Math.sin(angle) * radius;
                        spot.position.y = stemHeight + 0.01;
                        mushroomGroup.add(spot);
                    }
                }
                
                mushroomGroup.position.x = (Math.random() - 0.5) * 0.5;
                mushroomGroup.position.z = (Math.random() - 0.5) * 0.5;
                decorationGroup.add(mushroomGroup);
            }
            break;
        }
        
        case 'moss_patch': {
            // Moss patches that can grow on walls, floor, or ceiling
            const mossGroup = new THREE.Group();
            const isGlowMoss = Math.random() > 0.7; // 30% chance for glow moss
            
            // Check for available walls
            const map = dungeonMap;
            const walls = [];
            
            // Check bounds and walls
            if (gridY > 0 && map[gridY-1][gridX] === 1) walls.push('north');
            if (gridY < game.dungeon.height - 1 && map[gridY+1][gridX] === 1) walls.push('south');
            if (gridX > 0 && map[gridY][gridX-1] === 1) walls.push('west');
            if (gridX < game.dungeon.width - 1 && map[gridY][gridX+1] === 1) walls.push('east');
            
            // Determine surface (wall, floor, or ceiling)
            let surfaceType;
            if (walls.length > 0) {
                const rand = Math.random();
                if (rand < 0.4) surfaceType = 'wall';
                else if (rand < 0.7) surfaceType = 'floor';
                else surfaceType = 'ceiling';
            } else {
                surfaceType = Math.random() < 0.5 ? 'floor' : 'ceiling';
            }
            
            if (surfaceType === 'wall') {
                // Pick a random wall
                const wall = walls[Math.floor(Math.random() * walls.length)];
                const offset = 0.15; // Distance from wall (increased to prevent clipping)
                
                // Random height for wall moss
                const height = 0.5 + Math.random() * 2.0;
                mossGroup.position.y = height;
                
                if (wall === 'north') {
                    worldZ = gridY * cellSize + offset;
                    // worldX stays random within cell
                    mossGroup.rotation.y = 0; // Facing South (+Z)
                } else if (wall === 'south') {
                    worldZ = (gridY + 1) * cellSize - offset;
                    mossGroup.rotation.y = Math.PI; // Facing North (-Z)
                } else if (wall === 'west') {
                    worldX = gridX * cellSize + offset;
                    // worldZ stays random
                    mossGroup.rotation.y = Math.PI / 2; // Facing East (+X)
                } else if (wall === 'east') {
                    worldX = (gridX + 1) * cellSize - offset;
                    mossGroup.rotation.y = -Math.PI / 2; // Facing West (-X)
                }
            } else if (surfaceType === 'floor') {
                // Floor moss
                mossGroup.position.y = 0.05; // Increased height to prevent Z-fighting
                mossGroup.rotation.x = -Math.PI / 2; // Lay flat on floor
                mossGroup.rotation.z = Math.random() * Math.PI * 2;
            } else {
                // Ceiling moss
                mossGroup.position.y = 3.9; // Lowered from ceiling to prevent Z-fighting
                mossGroup.rotation.x = Math.PI / 2; // Lay flat on ceiling
                mossGroup.rotation.z = Math.random() * Math.PI * 2;
            }
            
            const patchSize = 0.15 + Math.random() * 0.35;
            
            // Create irregular moss shape
            const numBlobs = 3 + Math.floor(Math.random() * 5);
            
            for (let i = 0; i < numBlobs; i++) {
                const blobSize = patchSize * (0.4 + Math.random() * 0.6);
                const blobGeom = new THREE.CircleGeometry(blobSize, 8 + Math.floor(Math.random() * 8));
                
                let mossMat;
                if (isGlowMoss) {
                    // Glowing moss - cyan/green glow (darker)
                    const glowIntensity = 0.3 + Math.random() * 0.4;
                    mossMat = new THREE.MeshPhongMaterial({ 
                        color: 0x2a5a3a,
                        emissive: 0x1a4a2a,
                        emissiveIntensity: glowIntensity,
                        transparent: true,
                        opacity: 0.85,
                        side: THREE.DoubleSide
                    });
                } else {
                    // Regular moss - darker green, but with visible faint glow
                    mossMat = new THREE.MeshPhongMaterial({ 
                        color: 0x1a3a2a,
                        transparent: true,
                        opacity: 0.8,
                        side: THREE.DoubleSide,
                        emissive: 0x2a4a2a,
                        emissiveIntensity: 0.25
                    });
                }
                
                const blob = new THREE.Mesh(blobGeom, mossMat);
                
                // Position blobs relative to group center
                blob.position.x = (Math.random() - 0.5) * patchSize * 0.5;
                blob.position.y = (Math.random() - 0.5) * patchSize * 0.5;
                blob.position.z = 0; // Flat on the group's plane
                
                blob.scale.set(1, 0.8 + Math.random() * 0.4, 1);
                mossGroup.add(blob);
            }
            
            // Add glow points for glowing moss
            if (isGlowMoss) {
                const numGlowPoints = 2 + Math.floor(Math.random() * 4);
                for (let i = 0; i < numGlowPoints; i++) {
                    const glowGeom = new THREE.SphereGeometry(0.01 + Math.random() * 0.015, 4, 4);
                    const glowMat = new THREE.MeshBasicMaterial({ 
                        color: 0x6affaa,
                        transparent: true,
                        opacity: 0.9
                    });
                    const glow = new THREE.Mesh(glowGeom, glowMat);
                    
                    glow.position.x = (Math.random() - 0.5) * patchSize * 0.8;
                    glow.position.y = (Math.random() - 0.5) * patchSize * 0.8;
                    glow.position.z = 0.02; // Slightly in front
                    
                    mossGroup.add(glow);
                }
                
                // Add point light for glow moss
                // Increased intensity and range to illuminate surroundings
                const mossLight = new THREE.PointLight(0x4affaa, 1.2, 4);
                mossLight.position.z = 0.2;
                mossGroup.add(mossLight);
            }
            
            // Debug arrow for moss (Green)
            const arrowGroup = new THREE.Group();
            const shaftGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
            const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green
            const shaft = new THREE.Mesh(shaftGeom, arrowMat);
            shaft.rotation.x = Math.PI / 2;
            arrowGroup.add(shaft);
            
            const headGeom = new THREE.ConeGeometry(0.06, 0.15, 8);
            const head = new THREE.Mesh(headGeom, arrowMat);
            head.position.z = 0.15;
            head.rotation.x = -Math.PI / 2;
            arrowGroup.add(head);
            
            // Position in front of moss (local Z is normal)
            arrowGroup.position.z = 0.5;
            arrowGroup.rotation.y = Math.PI; // Point back at origin
            arrowGroup.visible = false;
            
            mossGroup.add(arrowGroup);
            decorationGroup.userData.debugArrow = arrowGroup;
            
            decorationGroup.add(mossGroup);
            break;
        }
        
        case 'wall_inscription': {
            // Wall inscriptions from previous adventurers
            // Array of possible messages
            const messages = [
                // Warnings
                "TURN BACK",
                "DANGER AHEAD",
                "BEWARE THE SHADOWS",
                "DON'T TRUST THE WALLS",
                "THEY'RE WATCHING",
                "NO ESCAPE",
                "CURSED PLACE",
                "DEATH AWAITS",
                "RUN WHILE YOU CAN",
                "THIS WAY LIES MADNESS",
                "THE DARKNESS HUNGERS",
                
                // Loss of companions
                "SARAH DIDN'T MAKE IT",
                "THEY TOOK PETER",
                "I'M THE LAST ONE",
                "THE OTHERS ARE GONE",
                "WE WERE TWELVE",
                "ELENA SCREAMED FOR HOURS",
                "DON'T LEAVE ME LIKE THEY DID",
                "HEARD THOMAS CALLING BUT CANT FIND HIM",
                "MY BROTHER TURNED BACK",
                "THE PARTY IS DEAD",
                
                // Physical deterioration
                "SO HUNGRY",
                "WATER... NEED WATER",
                "THE WOUND WONT STOP",
                "CAN'T FEEL MY LEGS",
                "POISON SPREADS",
                "FEVER DREAMS",
                "INFECTION SETTING IN",
                "CANT STOP SHAKING",
                "SOMETHING GROWING INSIDE",
                "THE MUSHROOMS WERE A MISTAKE",
                "STOMACH PAINS UNBEARABLE",
                "VISION FADING",
                
                // Madness and disorientation
                "I'M SORRY",
                "FORGIVE ME",
                "LOST... SO LOST",
                "3 DAYS... OR IS IT 30?",
                "WHICH DAY IS THIS?",
                "TIME MEANS NOTHING HERE",
                "WHICH WAY IS UP?",
                "I'VE BEEN HERE BEFORE",
                "THESE WALLS REPEAT",
                "AM I GOING IN CIRCLES?",
                "THE SAME CORRIDOR AGAIN",
                "I CAN'T REMEMBER MY NAME",
                "WHO AM I?",
                "WHERE DID I COME FROM?",
                "WHY DID I COME HERE?",
                "CANT REMEMBER THE SUN",
                "WAS THERE A WORLD ABOVE?",
                "DO I HAVE A FAMILY?",
                
                // Being hunted
                "THEY'RE FOLLOWING ME",
                "IT KNOWS IM HERE",
                "CANT HIDE FOREVER",
                "SOMETHING IN THE DARK",
                "FOOTSTEPS BEHIND ME",
                "IT MIMICS MY VOICE",
                "SURROUNDED",
                "THEY COME AT NIGHT",
                "NOWHERE LEFT TO RUN",
                "IT TOYS WITH ME",
                "PLAYING WITH ITS FOOD",
                
                // Paranoia and fear
                "THE EYES FOLLOW",
                "IT KNOWS MY NAME",
                "THE WALLS BREATHE",
                "DON'T LISTEN TO IT",
                "THE WHISPERS LIE",
                "CANT TRUST ANYTHING",
                "SHADOWS MOVE WRONG",
                "SOMETHING WATCHING",
                "I HEAR LAUGHTER",
                "THE STONES ARE ALIVE",
                "FACES IN THE WALLS",
                "IT SPEAKS WITH HER VOICE",
                
                // Desperation
                "HELP ME",
                "SO COLD",
                "CAN'T FIND THE WAY OUT",
                "SOMEBODY PLEASE",
                "IS ANYONE THERE?",
                "GOD HAS ABANDONED THIS PLACE",
                "NO ONE IS COMING",
                "FORGOTTEN BY THE WORLD",
                "PLEASE FIND MY BODY",
                "TELL THEM I TRIED",
                
                // Final moments
                "THIS IS THE END",
                "I WON'T MAKE IT",
                "TOO LATE FOR ME",
                "GOODBYE CRUEL WORLD",
                "AT LEAST ITS OVER",
                "FINALLY REST",
                "FORGIVE ME ANNA",
                "TO MY LOVE - IM SORRY",
                "MAMA I'M COMING HOME",
                "TELL MY SON I LOVED HIM",
                
                // Treasure hints
                "TREASURE IN THE EAST WING",
                "GOLD BEHIND FALSE WALL",
                "CHECK THE NORTH CORNERS",
                "RICHES BEYOND THE SPIDER",
                "THE GEM IS REAL",
                "WORTH MORE THAN MY LIFE",
                "THE TREASURE IS A LIE",
                "SHOULD HAVE STAYED POOR",
                
                // Cryptic/mysterious
                "KEEP COUNTING",
                "COUNT THE DOORS",
                "SEVEN TURNS LEFT",
                "THE PATTERN REPEATS",
                "FOLLOW THE BLOOD",
                "LISTEN TO THE RATS",
                "THE MUSHROOMS KNOW",
                "TRUST THE SPIDERS",
                
                // Names/tallies
                "JAMES WAS HERE",
                "MARCUS - DAY 7",
                "STILL ALIVE",
                "|| || || ||",
                "ARIA + THORN",
                "DAY 1: HOPEFUL",
                "DAY 14: GIVING UP",
                "|| || || || || || ||",
                "ELISABETH 1482",
                "JOHN THE LOST",
                
                // Practical advice
                "MARK YOUR PATH",
                "TRUST THE LIGHT",
                "STAY QUIET",
                "NEVER LOOK BACK",
                "KEEP MOVING",
                "SLEEP NEAR WATER",
                "AVOID THE MUSHROOMS",
                "DONT EAT THE RATS",
                
                // Horror references
                "NEVERMORE",
                "THE RATS IN THE WALLS",
                "I HAVE SEEN THE YELLOW SIGN",
                "THE KING IN YELLOW WAITS",
                "PH'NGLUI MGLW'NAFH",
                "NO CROSS NO CROWN",
                "REDRUM",
                "ALL WORK NO PLAY",
                
                // Existential dread
                "WHY DO WE EXIST?",
                "NOTHING MATTERS HERE",
                "WE ARE ALL DUST",
                "THE VOID CALLS",
                "EMBRACE THE DARKNESS",
                "BECOME ONE WITH IT",
                "LET GO",
                "STOP FIGHTING",
                
                // Acceptance
                "ITS NOT SO BAD",
                "LEARNED TO LOVE THE DARK",
                "THE MONSTERS ARE KIND",
                "I BELONG HERE NOW",
                "THIS IS HOME",
                "WHY WOULD I LEAVE?",
                
                // Warnings to specific people
                "MARCUS - DONT COME LOOKING",
                "IF YOU FIND THIS BROTHER FLEE",
                "SARAH TURN BACK NOW",
                "TO WHOEVER READS THIS - RUN"
            ];
            
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            // Find nearest wall
            const checkDirections = [
                { dx: 0, dz: -1, name: 'north', rotation: 0 },
                { dx: 1, dz: 0, name: 'east', rotation: Math.PI/2 },
                { dx: 0, dz: 1, name: 'south', rotation: Math.PI },
                { dx: -1, dz: 0, name: 'west', rotation: -Math.PI/2 }
            ];
            
            // Find which direction has a wall
            let wallDirection = null;
            for (const dir of checkDirections) {
                const checkX = gridX + dir.dx;
                const checkY = gridY + dir.dz;
                if (checkY >= 0 && checkY < game.dungeon.height && 
                    checkX >= 0 && checkX < game.dungeon.width) {
                    if (dungeonMap[checkY][checkX] === 1) {
                        wallDirection = dir;
                        break;
                    }
                }
            }
            
            if (wallDirection) {
                // Create text using canvas
                const canvas = document.createElement('canvas');
                const size = 256;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Clear canvas
                ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                ctx.fillRect(0, 0, size, size);
                
                // Text style - varied colors with reduced contrast
                const colorRoll = Math.random();
                let textColor;
                if (colorRoll < 0.3) {
                    textColor = '#b8a080'; // Softer tan
                } else if (colorRoll < 0.5) {
                    textColor = '#a89070'; // Darker tan
                } else if (colorRoll < 0.7) {
                    textColor = '#b44040'; // Softer red
                } else {
                    textColor = '#9a8878'; // Grayish brown
                }
                ctx.fillStyle = textColor;
                
                // Font variation
                const fontStyles = [
                    'serif',
                    'Georgia, serif',
                    'Times New Roman, serif',
                    'monospace',
                    'Courier New, monospace',
                    'sans-serif'
                ];
                const fontWeights = ['normal', 'bold', 'bold'];
                const fontStyle = fontStyles[Math.floor(Math.random() * fontStyles.length)];
                const fontWeight = fontWeights[Math.floor(Math.random() * fontWeights.length)];
                
                // Font size based on message length
                const fontSize = message.length > 20 ? 16 : message.length > 15 ? 20 : 24;
                ctx.font = `${fontWeight} ${fontSize}px ${fontStyle}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Split into lines
                const words = message.split(' ');
                const maxWordsPerLine = 3;
                const textLines = [];
                for (let i = 0; i < words.length; i += maxWordsPerLine) {
                    textLines.push(words.slice(i, i + maxWordsPerLine).join(' '));
                }
                
                const lineHeight = fontSize + 4;
                const startY = (size / 2) - ((textLines.length - 1) * lineHeight / 2);
                
                textLines.forEach((line, index) => {
                    const y = startY + index * lineHeight;
                    
                    // Add subtle dark outline
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.4;
                    ctx.strokeText(line, size / 2, y);
                    
                    // Draw main text with multiple passes for rough effect
                    ctx.fillStyle = textColor;
                    for (let i = 0; i < 3; i++) {
                        ctx.globalAlpha = 0.3 + Math.random() * 0.3;
                        const offsetX = (Math.random() - 0.5) * 2;
                        const offsetY = (Math.random() - 0.5) * 2;
                        ctx.fillText(line, size / 2 + offsetX, y + offsetY);
                    }
                });
                
                // Add scratch marks
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = textColor;
                ctx.lineWidth = 1;
                for (let i = 0; i < 10; i++) {
                    ctx.beginPath();
                    ctx.moveTo(Math.random() * size, Math.random() * size);
                    ctx.lineTo(Math.random() * size, Math.random() * size);
                    ctx.stroke();
                }
                
                // Create texture and material
                const texture = new THREE.CanvasTexture(canvas);
                const inscriptionMat = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.85, // Reduced from 0.95
                    side: THREE.DoubleSide
                });
                
                // Create plane - larger size
                const width = 1.3 + Math.random() * 0.7; // Increased: 1.3 to 2.0
                const height = width * 0.7; // 0.91 to 1.4
                const planeGeom = new THREE.PlaneGeometry(width, height);
                const inscription = new THREE.Mesh(planeGeom, inscriptionMat);
                
                // Calculate world position (same as Dante inscription)
                const worldPosX = gridX * cellSize + cellSize / 2;
                const worldPosZ = gridY * cellSize + cellSize / 2;
                
                // Position based on wall direction
                inscription.position.x = worldPosX;
                inscription.position.z = worldPosZ;
                inscription.position.y = 1.2 + Math.random() * 1.0;
                
                // Offset toward the wall and rotate to face outward
                // Rotations adjusted to prevent text reversal
                // Adjusted offset to 0.85 to prevent being hidden inside thicker walls (1.1x)
                if (wallDirection.name === 'north') {
                    inscription.position.z -= cellSize / 2 * 0.85;
                    inscription.rotation.y = 0; // Face south (into the room)
                } else if (wallDirection.name === 'south') {
                    inscription.position.z += cellSize / 2 * 0.85;
                    inscription.rotation.y = Math.PI; // Face north (into the room)
                } else if (wallDirection.name === 'east') {
                    inscription.position.x += cellSize / 2 * 0.85;
                    inscription.rotation.y = -Math.PI / 2; // Face west (into the room)
                } else if (wallDirection.name === 'west') {
                    inscription.position.x -= cellSize / 2 * 0.85;
                    inscription.rotation.y = Math.PI / 2; // Face east (into the room)
                }
                
                inscription.rotation.z = (Math.random() - 0.5) * 0.2;
                
                // Add directly to scene (like Dante inscription)
                game.scene.add(inscription);
                
                // Create debug arrow pointing at inscription
                const arrowGroup = new THREE.Group();
                
                // Arrow shaft
                const shaftGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
                const arrowMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
                const shaft = new THREE.Mesh(shaftGeom, arrowMat);
                shaft.rotation.x = Math.PI / 2;
                arrowGroup.add(shaft);
                
                // Arrow head
                const headGeom = new THREE.ConeGeometry(0.06, 0.15, 8);
                const head = new THREE.Mesh(headGeom, arrowMat);
                head.position.z = 0.15;
                head.rotation.x = -Math.PI / 2;
                arrowGroup.add(head);
                
                // Position arrow above inscription
                arrowGroup.position.copy(inscription.position);
                arrowGroup.position.y += 0.8;
                arrowGroup.rotation.y = wallDirection.rotation;
                arrowGroup.visible = false; // Hidden by default
                
                game.scene.add(arrowGroup);
                
                console.log(`Created inscription "${message}" at (${gridX}, ${gridY}) on ${wallDirection.name} wall, world pos: (${inscription.position.x.toFixed(2)}, ${inscription.position.y.toFixed(2)}, ${inscription.position.z.toFixed(2)})`);
                
                // Track in decorations with arrow reference
                game.decorations.push({
                    type: type,
                    mesh: inscription,
                    debugArrow: arrowGroup,
                    gridX: gridX,
                    gridY: gridY
                });
                
                // Return early since we added directly to scene
                return;
            }
            break;
        }

        case 'wyrm_carcass': {
            // Giant Wyrm Carcass - Freshly killed
            const wyrmGroup = new THREE.Group();
            
            // Materials
            const scaleMat = new THREE.MeshStandardMaterial({ 
                color: 0x2a3b2a, // Dark swampy green
                roughness: 0.4,
                metalness: 0.3,
                flatShading: true
            });
            const bellyMat = new THREE.MeshStandardMaterial({ 
                color: 0x8a9b7a, // Pale belly
                roughness: 0.6
            });
            const bloodMat = new THREE.MeshStandardMaterial({ 
                color: 0x880000, 
                roughness: 0.1,
                metalness: 0.1,
                emissive: 0x220000,
                emissiveIntensity: 0.2
            });
            const boneMat = new THREE.MeshStandardMaterial({ 
                color: 0xd4c5b0,
                roughness: 0.5
            });
            
            // Body - A long curved series of segments
            const spineCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-2, 0, -1),
                new THREE.Vector3(-1, 0.5, 0),
                new THREE.Vector3(0, 0.2, 1),
                new THREE.Vector3(1, 0.8, 0),
                new THREE.Vector3(2, 0, -1)
            ]);
            
            // Create segmented body for tapering effect
            const numSegments = 30;
            const points = spineCurve.getPoints(numSegments);
            
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i+1];
                const t = i / numSegments;
                
                // Tapering radius: thick in middle, thin at tail/neck
                let radius = 0.6 * Math.sin(t * Math.PI); // Simple hump shape
                if (t > 0.8) radius = 0.4; // Neck
                if (radius < 0.1) radius = 0.1;
                
                const segmentLength = p1.distanceTo(p2);
                const segmentGeom = new THREE.CylinderGeometry(radius, radius, segmentLength, 8);
                const segment = new THREE.Mesh(segmentGeom, scaleMat);
                
                // Position and orient
                const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
                segment.position.copy(center);
                segment.lookAt(p2);
                segment.rotateX(Math.PI / 2); // Cylinder aligns Y, we want Z
                
                wyrmGroup.add(segment);
                
                // Add dorsal spikes
                if (i % 2 === 0 && t > 0.1 && t < 0.9) {
                    const spikeGeom = new THREE.ConeGeometry(0.05, 0.4, 4);
                    const spike = new THREE.Mesh(spikeGeom, scaleMat);
                    spike.position.copy(center);
                    spike.position.y += radius * 0.8;
                    // Randomize angle slightly
                    spike.rotation.x = (Math.random() - 0.5) * 0.5;
                    spike.rotation.z = (Math.random() - 0.5) * 0.5;
                    wyrmGroup.add(spike);
                }
            }
            
            // Head - Massive fleshy head
            const skullGroup = new THREE.Group();
            
            // Main head shape
            const headGeom = new THREE.BoxGeometry(0.5, 0.4, 0.8);
            const head = new THREE.Mesh(headGeom, scaleMat);
            skullGroup.add(head);
            
            // Snout
            const snoutGeom = new THREE.BoxGeometry(0.4, 0.3, 0.6);
            const snout = new THREE.Mesh(snoutGeom, scaleMat);
            snout.position.z = 0.6;
            snout.position.y = -0.05;
            skullGroup.add(snout);
            
            // Jaw (hanging open)
            const jawGeom = new THREE.BoxGeometry(0.35, 0.1, 0.5);
            const jaw = new THREE.Mesh(jawGeom, bellyMat);
            jaw.position.z = 0.5;
            jaw.position.y = -0.3;
            jaw.rotation.x = 0.3; // Open
            skullGroup.add(jaw);
            
            // Teeth
            const toothGeom = new THREE.ConeGeometry(0.02, 0.1, 4);
            for(let i=0; i<4; i++) {
                const tooth = new THREE.Mesh(toothGeom, boneMat);
                tooth.position.set(0.15, -0.15, 0.4 + i*0.1);
                tooth.rotation.x = Math.PI;
                skullGroup.add(tooth);
                
                const toothL = new THREE.Mesh(toothGeom, boneMat);
                toothL.position.set(-0.15, -0.15, 0.4 + i*0.1);
                toothL.rotation.x = Math.PI;
                skullGroup.add(toothL);
            }

            // Horns
            const hornGeom = new THREE.ConeGeometry(0.08, 0.6, 8);
            const horn1 = new THREE.Mesh(hornGeom, boneMat);
            horn1.position.set(0.2, 0.3, -0.2);
            horn1.rotation.x = -Math.PI / 4;
            skullGroup.add(horn1);
            
            const horn2 = new THREE.Mesh(hornGeom, boneMat);
            horn2.position.set(-0.2, 0.3, -0.2);
            horn2.rotation.x = -Math.PI / 4;
            skullGroup.add(horn2);
            
            // Position head at end of spine
            skullGroup.position.copy(spineCurve.getPoint(1));
            skullGroup.lookAt(spineCurve.getPoint(0.9));
            // Adjust rotation to look dead (side flop)
            skullGroup.rotateZ(0.5);
            wyrmGroup.add(skullGroup);
            
            // Battle Damage & Blood
            // 1. Large pool of blood
            const poolGeom = new THREE.CircleGeometry(2.5, 16);
            const pool = new THREE.Mesh(poolGeom, bloodMat);
            pool.rotation.x = -Math.PI / 2;
            pool.position.y = 0.02;
            pool.position.x = 0.5;
            wyrmGroup.add(pool);
            
            // 2. Arrows sticking out
            const arrowShaftGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4);
            const arrowFeatherGeom = new THREE.BoxGeometry(0.05, 0.05, 0.01);
            const arrowMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
            
            for(let i=0; i<8; i++) {
                const arrowGroup = new THREE.Group();
                const shaft = new THREE.Mesh(arrowShaftGeom, arrowMat);
                shaft.position.y = 0.3;
                arrowGroup.add(shaft);
                
                // Use Standard material so feathers don't glow in the dark
                const feather = new THREE.Mesh(arrowFeatherGeom, new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    roughness: 0.8,
                    metalness: 0.0
                }));
                feather.position.y = 0.6;
                arrowGroup.add(feather);
                
                // Random position along spine
                const t = 0.2 + Math.random() * 0.7;
                const pos = spineCurve.getPoint(t);
                arrowGroup.position.copy(pos);
                
                // Random rotation
                arrowGroup.rotation.x = Math.random() * Math.PI;
                arrowGroup.rotation.z = Math.random() * Math.PI;
                
                wyrmGroup.add(arrowGroup);
            }
            
            // Scale up the wyrm to be "giant"
            wyrmGroup.scale.set(2.5, 2.5, 2.5);
            
            decorationGroup.add(wyrmGroup);
            break;
        }

        case 'dead_adventurer': {
            // Dead Adventurer - Skeleton with gear
            const bodyGroup = new THREE.Group();
            const boneMat = new THREE.MeshStandardMaterial({ color: 0xd4c5b0 });
            const armorMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.4 });
            
            // Torso (Ribcage)
            const torsoGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.3, 8);
            const torso = new THREE.Mesh(torsoGeom, armorMat); // Wearing armor
            torso.rotation.z = Math.PI / 2;
            torso.position.y = 0.1;
            bodyGroup.add(torso);
            
            // Skull
            const skullGeom = new THREE.SphereGeometry(0.08, 8, 8);
            const skull = new THREE.Mesh(skullGeom, boneMat);
            skull.position.set(0.25, 0.1, 0);
            bodyGroup.add(skull);
            
            // Limbs (scattered)
            const limbGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6);
            const leg1 = new THREE.Mesh(limbGeom, boneMat);
            leg1.position.set(-0.2, 0.05, 0.1);
            leg1.rotation.z = Math.PI / 2;
            leg1.rotation.y = 0.2;
            bodyGroup.add(leg1);
            
            const leg2 = new THREE.Mesh(limbGeom, boneMat);
            leg2.position.set(-0.2, 0.05, -0.1);
            leg2.rotation.z = Math.PI / 2;
            leg2.rotation.y = -0.2;
            bodyGroup.add(leg2);
            
            // Weapon nearby
            const swordGroup = new THREE.Group();
            const bladeGeom = new THREE.BoxGeometry(0.4, 0.02, 0.08);
            const blade = new THREE.Mesh(bladeGeom, armorMat);
            swordGroup.add(blade);
            const hiltGeom = new THREE.BoxGeometry(0.1, 0.02, 0.2);
            const hilt = new THREE.Mesh(hiltGeom, new THREE.MeshStandardMaterial({ color: 0x443322 }));
            hilt.position.x = -0.2;
            swordGroup.add(hilt);
            
            swordGroup.position.set(0, 0.05, 0.4);
            swordGroup.rotation.y = Math.random() * Math.PI;
            bodyGroup.add(swordGroup);
            
            decorationGroup.add(bodyGroup);
            break;
        }

        case 'ladder': {
            // Escape Ladder
            const ladderGroup = new THREE.Group();
            const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
            
            // Side rails
            const railGeom = new THREE.BoxGeometry(0.1, 4, 0.1);
            const leftRail = new THREE.Mesh(railGeom, woodMat);
            leftRail.position.set(-0.25, 2, 0);
            ladderGroup.add(leftRail);
            
            const rightRail = new THREE.Mesh(railGeom, woodMat);
            rightRail.position.set(0.25, 2, 0);
            ladderGroup.add(rightRail);
            
            // Rungs
            const rungGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
            for (let i = 0; i < 10; i++) {
                const rung = new THREE.Mesh(rungGeom, woodMat);
                rung.rotation.z = Math.PI / 2;
                rung.position.y = 0.4 + i * 0.4;
                ladderGroup.add(rung);
            }
            
            // Light from above (Exit)
            const exitLight = new THREE.PointLight(0xffffee, 2, 10);
            exitLight.position.set(0, 3.5, 0);
            ladderGroup.add(exitLight);
            
            // Glow effect at top
            const glowGeom = new THREE.SphereGeometry(0.5, 16, 16);
            const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffee, transparent: true, opacity: 0.3 });
            const glow = new THREE.Mesh(glowGeom, glowMat);
            glow.position.set(0, 3.8, 0);
            ladderGroup.add(glow);
            
            decorationGroup.add(ladderGroup);
            break;
        }
    }
    
    // Enable shadows for decorations (except translucent/flat ones)
    const noShadowDecorations = [
        DECORATION_TYPES.PUDDLE,
        DECORATION_TYPES.SPIDER_WEB,
        DECORATION_TYPES.MOSS_PATCH,
        DECORATION_TYPES.WALL_INSCRIPTION,
        DECORATION_TYPES.BLOOD_STAIN
    ];
    
    if (!noShadowDecorations.includes(type)) {
        decorationGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    decorationGroup.position.x = worldX;
    decorationGroup.position.z = worldZ;
    game.scene.add(decorationGroup);
    
    const decoration = {
        type: type,
        mesh: decorationGroup,
        gridX: gridX,
        gridY: gridY,
        debugArrow: decorationGroup.userData.debugArrow
    };
    
    game.decorations.push(decoration);
}

// Spawn decorations throughout the dungeon
function spawnDecorations() {
    const cellSize = game.dungeon.cellSize;
    
    // Track cells that have decorations (for one-per-cell rule)
    const decoratedCells = new Set();

    // --- SPECIAL DECORATIONS ---
    
    // 1. Wyrm Carcass in the center of the 5x5 room (top-left)
    // Room is x:1-5, y:1-5. Center is 3,3.
    createDecoration(3, 3, DECORATION_TYPES.WYRM_CARCASS);
    decoratedCells.add(`3,3`);
    
    // 2. Dead Adventurers around the Wyrm
    createDecoration(2, 3, DECORATION_TYPES.DEAD_ADVENTURER);
    decoratedCells.add(`2,3`);
    createDecoration(4, 3, DECORATION_TYPES.DEAD_ADVENTURER);
    decoratedCells.add(`4,3`);
    createDecoration(3, 4, DECORATION_TYPES.DEAD_ADVENTURER);
    decoratedCells.add(`3,4`);
    
    // 3. Escape Ladder in the bottom-right corner
    // Assuming walls are at width-1 and height-1, the last walkable cell is width-2, height-2
    // But let's check if it's a floor. If not, search nearby.
    let ladderX = game.dungeon.width - 2;
    let ladderY = game.dungeon.height - 2;
    
    // Ensure it's a floor tile
    while (dungeonMap[ladderY][ladderX] === 1 && ladderX > 0 && ladderY > 0) {
        if (ladderX > ladderY) ladderX--;
        else ladderY--;
    }
    
    createDecoration(ladderX, ladderY, DECORATION_TYPES.LADDER);
    decoratedCells.add(`${ladderX},${ladderY}`);
    
    // Store ladder position for win condition check
    game.ladderPosition = { x: ladderX, y: ladderY };
    
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
                    
                    // Each decoration type has its own probability
                    for (const decorType of Object.values(DECORATION_TYPES)) {
                        const isInscription = decorType.name === 'wall_inscription';
                        
                        // Inscriptions ONLY spawn if there's a wall adjacent
                        if (isInscription && !nearWall) {
                            continue;
                        }
                        
                        // Only one non-inscription decoration per cell
                        if (!isInscription && decoratedCells.has(cellKey)) {
                            continue;
                        }
                        
                        const prefersWall = wallPreferringTypes.includes(decorType.name);
                        
                        // Adjust probability based on wall proximity
                        let adjustedProbability = decorType.probability;
                        if (prefersWall) {
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

// Check if object is visible from player's position
function isObjectVisible(objectPos) {
    const result = isObjectVisibleDebug(objectPos);
    return result.visible;
}

// Debug version that returns detailed visibility info
function isObjectVisibleDebug(objectPos) {
    let maxDistance = 25; // Default fallback
    
    // Use torch range if available
    if (game.player.torch) {
        maxDistance = game.player.torch.rangeBase;
        // If torch is out/very low, visibility is minimal
        if (game.player.light && !game.player.light.visible) maxDistance = 0.5;
    }
    
    // Calculate distance
    const dx = objectPos.x - game.player.position.x;
    const dz = objectPos.z - game.player.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance > maxDistance) {
        return { visible: false, reason: 'too far', distance };
    }
    
    // Get the camera's forward direction vector
    const cameraDirection = new THREE.Vector3();
    game.camera.getWorldDirection(cameraDirection);
    
    // Direction from player to object
    const toObject = new THREE.Vector3(dx, 0, dz).normalize();
    
    // Calculate the dot product (cosine of angle between vectors)
    const dotProduct = cameraDirection.dot(toObject);
    
    // Convert to angle for debugging
    const angleDiff = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
    
    // Check field of view - dot product > 0 means less than 90 degrees
    // For ~100 degree FOV, we need cos(50 degrees) ≈ 0.64
    const minDotProduct = Math.cos(Math.PI / 1.8); // ~100 degree field of view
    if (dotProduct < minDotProduct) {
        return { visible: false, reason: 'outside FOV', distance, angleDiff, dotProduct };
    }
    
    // Check line of sight - raycast to see if blocked by walls
    const direction = new THREE.Vector3(dx, 0, dz).normalize();
    game.raycaster.set(game.player.position, direction);
    
    const intersects = game.raycaster.intersectObjects(game.dungeon.wallMeshes);
    
    // If there's an intersection closer than the object, it's blocked
    if (intersects.length > 0 && intersects[0].distance < distance - 0.5) {
        return { visible: false, reason: 'blocked by wall', distance, wallDistance: intersects[0].distance };
    }
    
    return { visible: true, reason: 'visible', distance, dotProduct };
}

// Convert 3D position to 2D screen coordinates
function get2DPosition(position3D) {
    const vector = position3D.clone();
    vector.project(game.camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    return { x, y, visible: vector.z < 1 };
}

// Get monster type name
function getMonsterName(type) {
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

// Show descriptions of visible items and monsters
function showDescriptions() {
    // This will be called each frame in the animation loop
}

// Update debug window
function updateDebugWindow() {
    if (!game.controls.debugMode) return;
    
    const debugWindow = document.getElementById('debug-window');
    if (!debugWindow) return;
    
    let html = '<div class="debug-title">DEBUG INFO</div>';
    
    // Player info
    html += '<div class="debug-section">PLAYER:</div>';
    html += `<div class="debug-item">Position: (${game.player.position.x.toFixed(1)}, ${game.player.position.z.toFixed(1)})</div>`;
    html += `<div class="debug-item">Rotation Y: ${game.player.rotation.y.toFixed(2)} rad</div>`;
    html += `<div class="debug-item">Facing: ${game.player.facing} (${['North', 'East', 'South', 'West'][game.player.facing]})</div>`;
    html += `<div class="debug-item">Grid: (${Math.floor(game.player.position.x / game.dungeon.cellSize)}, ${Math.floor(game.player.position.z / game.dungeon.cellSize)})</div>`;
    
    // Visible monsters
    html += '<div class="debug-section">MONSTERS:</div>';
    html += `<div class="debug-item">Total Alive: ${game.monsters.length}</div>`;
    let monsterCount = 0;
    for (let monster of game.monsters) {
        const dx = monster.mesh.position.x - game.player.position.x;
        const dz = monster.mesh.position.z - game.player.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const angleToObject = Math.atan2(dx, dz);
        const playerAngle = game.player.rotation.y;
        let angleDiff = angleToObject - playerAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const visInfo = isObjectVisibleDebug(monster.mesh.position);
        
        if (distance < 15) { // Show nearby monsters
            html += `<div class="debug-item" style="color: ${visInfo.visible ? '#0f0' : '#f00'}">` +
                `${getMonsterName(monster.type)}: ` +
                `dx=${dx.toFixed(1)}, dz=${dz.toFixed(1)}, ` +
                `dist=${distance.toFixed(1)}, ` +
                `diff=${angleDiff.toFixed(2)}, ` +
                `[${visInfo.reason}]</div>`;
            if (visInfo.visible) monsterCount++;
        }
    }
    html += `<div class="debug-item">Visible: ${monsterCount}</div>`;
    
    // Visible treasures
    html += '<div class="debug-section">TREASURES:</div>';
    let treasureCount = 0;
    for (let treasure of game.treasures) {
        if (treasure.collected) continue;
        
        const dx = treasure.mesh.position.x - game.player.position.x;
        const dz = treasure.mesh.position.z - game.player.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const angleToObject = Math.atan2(dx, dz);
        const playerAngle = game.player.rotation.y;
        let angleDiff = angleToObject - playerAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const visInfo = isObjectVisibleDebug(treasure.mesh.position);
        
        if (distance < 15) { // Show nearby treasures
            const treasureName = treasure.type.name.charAt(0).toUpperCase() + treasure.type.name.slice(1);
            html += `<div class="debug-item" style="color: ${visInfo.visible ? '#0f0' : '#f00'}">` +
                `${treasureName}: ` +
                `dx=${dx.toFixed(1)}, dz=${dz.toFixed(1)}, ` +
                `dist=${distance.toFixed(1)}, ` +
                `diff=${angleDiff.toFixed(2)}, ` +
                `[${visInfo.reason}]</div>`;
            if (visInfo.visible) treasureCount++;
        }
    }
    html += `<div class="debug-item">Visible: ${treasureCount}</div>`;
    
    // Decorations info
    html += '<div class="debug-section">DECORATIONS:</div>';
    const inscriptionCount = game.decorations.filter(d => 
        (d.type && d.type.name === 'wall_inscription') || d.type === 'wall_inscription'
    ).length;
    const bloodStainCount = game.decorations.filter(d => d.type === 'blood_stain').length;
    html += `<div class="debug-item">Total Inscriptions: ${inscriptionCount}</div>`;
    html += `<div class="debug-item">Blood Stains: ${bloodStainCount}</div>`;
    html += `<div class="debug-item">Total Decorations: ${game.decorations.length}</div>`;
    
    debugWindow.innerHTML = html;
}

// Update floating labels each frame
function updateFloatingLabels() {
    const labelsContainer = document.getElementById('floating-labels');
    if (!labelsContainer) return;
    
    // Only show labels when Alt is pressed
    if (!game.controls.altPressed) {
        labelsContainer.innerHTML = '';
        return;
    }
    
    // Clear existing labels
    labelsContainer.innerHTML = '';
    
    // Add labels for visible monsters
    for (let monster of game.monsters) {
        if (isObjectVisible(monster.mesh.position)) {
            const labelPos = monster.mesh.position.clone();
            labelPos.y += 2.0; // Position above monster
            
            const screenPos = get2DPosition(labelPos);
            
            // Check if in front of camera and on screen
            if (screenPos.visible && screenPos.x >= 0 && screenPos.x <= window.innerWidth && 
                screenPos.y >= 0 && screenPos.y <= window.innerHeight) {
                const distance = Math.sqrt(
                    Math.pow(monster.mesh.position.x - game.player.position.x, 2) +
                    Math.pow(monster.mesh.position.z - game.player.position.z, 2)
                );
                
                const label = document.createElement('div');
                label.className = 'floating-label monster-label';
                label.style.left = screenPos.x + 'px';
                label.style.top = screenPos.y + 'px';
                label.textContent = `${getMonsterName(monster.type)} [${getDifficultyText(monster.difficulty)}]`;
                
                // Scale based on distance (closer = bigger)
                const scale = Math.max(0.5, Math.min(1.5, 10 / distance));
                label.style.transform = `translate(-50%, -100%) scale(${scale})`;
                
                // Fade based on distance
                const opacity = Math.max(0.5, 1 - distance / 25);
                label.style.opacity = opacity;
                
                labelsContainer.appendChild(label);
            }
        }
    }
    
    // Add labels for visible treasures
    for (let treasure of game.treasures) {
        if (!treasure.collected && isObjectVisible(treasure.mesh.position)) {
            const labelPos = treasure.mesh.position.clone();
            labelPos.y += 1.2; // Position above treasure
            
            const screenPos = get2DPosition(labelPos);
            
            // Check if in front of camera and on screen
            if (screenPos.visible && screenPos.x >= 0 && screenPos.x <= window.innerWidth && 
                screenPos.y >= 0 && screenPos.y <= window.innerHeight) {
                const distance = Math.sqrt(
                    Math.pow(treasure.mesh.position.x - game.player.position.x, 2) +
                    Math.pow(treasure.mesh.position.z - game.player.position.z, 2)
                );
                
                const label = document.createElement('div');
                label.className = 'floating-label treasure-label';
                label.style.left = screenPos.x + 'px';
                label.style.top = screenPos.y + 'px';
                const treasureName = treasure.type.name.charAt(0).toUpperCase() + treasure.type.name.slice(1);
                label.textContent = `${treasureName} (${treasure.type.value}g)`;
                
                // Scale based on distance (closer = bigger)
                const scale = Math.max(0.5, Math.min(1.5, 10 / distance));
                label.style.transform = `translate(-50%, -100%) scale(${scale})`;
                
                // Fade based on distance
                const opacity = Math.max(0.5, 1 - distance / 25);
                label.style.opacity = opacity;
                
                labelsContainer.appendChild(label);
            }
        }
    }
}

// Hide descriptions
function hideDescriptions() {
    const labelsContainer = document.getElementById('floating-labels');
    if (labelsContainer) {
        labelsContainer.innerHTML = '';
    }
}

// Create a monster at grid position
function createTorch() {
    const torchGroup = new THREE.Group();
    
    // Handle
    const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.025, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a2511, roughness: 0.9 })
    );
    handle.castShadow = true;
    handle.receiveShadow = true;
    torchGroup.add(handle);
    
    // Metal cage/holder at top
    const holder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.03, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.5 })
    );
    holder.castShadow = true;
    holder.receiveShadow = true;
    holder.position.y = 0.25;
    torchGroup.add(holder);
    
    // Flame Group
    const flameGroup = new THREE.Group();
    flameGroup.position.y = 0.3;
    torchGroup.add(flameGroup);
    
    // Core flame (bright yellow/white)
    const core = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.25, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.9 })
    );
    core.position.y = 0.05;
    flameGroup.add(core);
    
    // Outer flame (orange)
    const outer = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.4, 8),
        new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })
    );
    outer.position.y = 0.05;
    flameGroup.add(outer);
    
    // Light
    const light = new THREE.PointLight(0xff6600, 1.5, 12);
    light.position.y = 0.3;
    torchGroup.add(light);
    
    // Add custom property to identify for animation
    torchGroup.userData.isTorch = true;
    torchGroup.userData.flameGroup = flameGroup;
    torchGroup.userData.light = light;
    torchGroup.userData.core = core;
    torchGroup.userData.outer = outer;
    
    return torchGroup;
}

function createMonster(gridX, gridY, type) {
    const cellSize = game.dungeon.cellSize;
    const monsterGroup = new THREE.Group();
    let body, speed, moveChance;
    
    switch(type) {
        case MONSTER_TYPES.SKELETON: {
            // Skeleton - detailed with ribs, limbs, and skull features
            body = new THREE.Group();
            
            // Torso/spine
            const skeletonBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.28, 1.0, 8),
                new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 })
            );
            skeletonBody.position.y = 0.1;
            body.add(skeletonBody);
            
            // Ribs
            const ribMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 });
            for (let i = 0; i < 6; i++) {
                const leftRib = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6),
                    ribMaterial
                );
                leftRib.position.set(-0.15, 0.5 - i * 0.12, 0);
                leftRib.rotation.z = Math.PI / 4;
                body.add(leftRib);
                
                const rightRib = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6),
                    ribMaterial
                );
                rightRib.position.set(0.15, 0.5 - i * 0.12, 0);
                rightRib.rotation.z = -Math.PI / 4;
                body.add(rightRib);
            }
            
            // Skull - detailed
            const skeletonHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 })
            );
            skeletonHead.position.y = 0.9;
            skeletonHead.scale.set(1, 1.2, 0.9);
            body.add(skeletonHead);
            
            // Jaw
            const jaw = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.1, 0.2),
                ribMaterial
            );
            jaw.position.set(0, 0.75, 0.05);
            body.add(jaw);
            
            // Eye sockets
            const socketGeometry = new THREE.SphereGeometry(0.06, 8, 8);
            const socketMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const leftSocket = new THREE.Mesh(socketGeometry, socketMaterial);
            leftSocket.position.set(-0.1, 0.95, 0.18);
            const rightSocket = new THREE.Mesh(socketGeometry, socketMaterial);
            rightSocket.position.set(0.1, 0.95, 0.18);
            body.add(leftSocket);
            body.add(rightSocket);
            
            // Glowing eyes
            const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000, 
                emissive: 0xff0000, 
                emissiveIntensity: 1.0 
            });
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.1, 0.95, 0.22);
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.1, 0.95, 0.22);
            body.add(leftEye);
            body.add(rightEye);
            
            // Arms
            const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
            const leftArm = new THREE.Mesh(armGeometry, ribMaterial);
            leftArm.position.set(-0.35, 0.4, 0);
            leftArm.rotation.z = Math.PI / 6;
            body.add(leftArm);
            
            const rightArm = new THREE.Mesh(armGeometry, ribMaterial);
            rightArm.position.set(0.35, 0.4, 0);
            rightArm.rotation.z = -Math.PI / 6;
            body.add(rightArm);
            
            // Hands (simple boxes)
            const handGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.12);
            const leftHand = new THREE.Mesh(handGeometry, ribMaterial);
            leftHand.position.set(-0.45, 0.05, 0);
            body.add(leftHand);
            
            const rightHand = new THREE.Mesh(handGeometry, ribMaterial);
            rightHand.position.set(0.45, 0.05, 0);
            body.add(rightHand);
            
            // Torch in right hand
            const torchGroup = createTorch();
            torchGroup.position.set(0.45, 0.05, 0.1);
            torchGroup.rotation.x = Math.PI / 6;
            body.add(torchGroup);
            
            // Pelvis
            const pelvis = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.15, 0.25),
                ribMaterial
            );
            pelvis.position.y = -0.4;
            body.add(pelvis);
            
            speed = 0.5;
            moveChance = 0.6;
            break;
        }
            
        case MONSTER_TYPES.SPIDER: {
            // Spider - detailed with segmented body, multiple eyes, and jointed legs
            body = new THREE.Group();
            
            // Abdomen (back part)
            const abdomen = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 })
            );
            abdomen.scale.set(1, 0.8, 1.4);
            abdomen.position.set(0, 0, -0.3);
            body.add(abdomen);
            
            // Thorax (front part)
            const thorax = new THREE.Mesh(
                new THREE.SphereGeometry(0.35, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 })
            );
            thorax.scale.set(1, 0.7, 1.2);
            thorax.position.set(0, 0, 0.3);
            body.add(thorax);
            
            // Head
            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
            );
            head.position.set(0, 0.05, 0.55);
            body.add(head);
            
            // Multiple eyes
            const eyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000, 
                emissive: 0x880000, 
                emissiveIntensity: 0.5 
            });
            const eyePositions = [
                [-0.08, 0.1, 0.65], [0.08, 0.1, 0.65],  // Main eyes
                [-0.12, 0.08, 0.62], [0.12, 0.08, 0.62],  // Side eyes
                [-0.06, 0.15, 0.63], [0.06, 0.15, 0.63],  // Top eyes
                [-0.14, 0.05, 0.58], [0.14, 0.05, 0.58]   // Outer eyes
            ];
            eyePositions.forEach(pos => {
                const eye = new THREE.Mesh(
                    new THREE.SphereGeometry(0.025, 8, 8),
                    eyeMaterial
                );
                eye.position.set(...pos);
                body.add(eye);
            });
            
            // Fangs
            const fangGeometry = new THREE.ConeGeometry(0.03, 0.15, 6);
            const fangMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const leftFang = new THREE.Mesh(fangGeometry, fangMaterial);
            leftFang.position.set(-0.06, -0.02, 0.65);
            leftFang.rotation.x = Math.PI;
            const rightFang = new THREE.Mesh(fangGeometry, fangMaterial);
            rightFang.position.set(0.06, -0.02, 0.65);
            rightFang.rotation.x = Math.PI;
            body.add(leftFang);
            body.add(rightFang);
            
            // 8 detailed jointed legs
            const legMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
            for (let i = 0; i < 8; i++) {
                const legGroup = new THREE.Group();
                const angle = (i / 8) * Math.PI * 2;
                const side = i < 4 ? 1 : -1;
                const offset = (i % 4) * 0.15 - 0.225;
                
                // Upper leg segment
                const upperLeg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.04, 0.03, 0.4),
                    legMaterial
                );
                upperLeg.position.set(Math.cos(angle) * 0.25, -0.1, offset);
                upperLeg.rotation.z = Math.cos(angle) * 0.8;
                upperLeg.rotation.x = Math.sin(angle) * 0.8;
                
                // Lower leg segment
                const lowerLeg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.03, 0.02, 0.35),
                    legMaterial
                );
                lowerLeg.position.set(
                    Math.cos(angle) * 0.45,
                    -0.35,
                    offset + Math.sin(angle) * 0.1
                );
                lowerLeg.rotation.z = Math.cos(angle) * 0.5;
                lowerLeg.rotation.x = Math.sin(angle) * 0.5;
                
                // Joint
                const joint = new THREE.Mesh(
                    new THREE.SphereGeometry(0.04, 6, 6),
                    legMaterial
                );
                joint.position.set(Math.cos(angle) * 0.35, -0.25, offset);
                
                body.add(upperLeg);
                body.add(lowerLeg);
                body.add(joint);
            }
            
            // Spinneret details on abdomen
            for (let i = 0; i < 3; i++) {
                const spinneret = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.01, 0.05, 6),
                    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
                );
                spinneret.position.set(
                    (i - 1) * 0.08,
                    -0.15,
                    -0.65
                );
                body.add(spinneret);
            }
            
            monsterGroup.position.y = 0.4;
            speed = 0.4;
            moveChance = 0.7;
            break;
        }
            
        case MONSTER_TYPES.JELLY: {
            // Jelly blob - bouncy, translucent
            body = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: 0x00ff88,
                    transparent: true,
                    opacity: 0.7,
                    roughness: 0.2,
                    metalness: 0.3
                })
            );
            body.scale.set(1, 0.8, 1);
            speed = 0.6;
            moveChance = 0.5;
            break;
        }
            
        case MONSTER_TYPES.RAT: {
            // Rat - detailed with tail, ears, whiskers
            body = new THREE.Group();
            
            // Body
            const ratBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.25, 0.6, 12),
                new THREE.MeshStandardMaterial({ color: 0x553322, roughness: 0.9 })
            );
            ratBody.rotation.z = Math.PI / 2;
            ratBody.scale.set(1, 1.3, 1);
            body.add(ratBody);
            
            // Head
            const ratHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.18, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x664433, roughness: 0.9 })
            );
            ratHead.position.set(0.4, 0, 0);
            ratHead.scale.set(1.3, 0.9, 0.9);
            body.add(ratHead);
            
            // Snout
            const snout = new THREE.Mesh(
                new THREE.ConeGeometry(0.08, 0.15, 8),
                new THREE.MeshStandardMaterial({ color: 0x886655, roughness: 0.8 })
            );
            snout.rotation.z = -Math.PI / 2;
            snout.position.set(0.52, 0, 0);
            body.add(snout);
            
            // Nose
            const nose = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0xff6699 })
            );
            nose.position.set(0.6, 0, 0);
            body.add(nose);
            
            // Ears
            const earGeometry = new THREE.CircleGeometry(0.12, 12);
            const earMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xcc9988, 
                roughness: 0.9,
                side: THREE.DoubleSide
            });
            const leftEar = new THREE.Mesh(earGeometry, earMaterial);
            leftEar.position.set(0.35, 0, -0.15);
            leftEar.rotation.y = Math.PI / 4;
            const rightEar = new THREE.Mesh(earGeometry, earMaterial);
            rightEar.position.set(0.35, 0, 0.15);
            rightEar.rotation.y = -Math.PI / 4;
            body.add(leftEar);
            body.add(rightEar);
            
            // Eyes
            const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(0.48, 0.05, -0.08);
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.48, 0.05, 0.08);
            body.add(leftEye);
            body.add(rightEye);
            
            // Whiskers
            const whiskerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            for (let i = 0; i < 3; i++) {
                const leftWhisker = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.005, 0.005, 0.25, 4),
                    whiskerMaterial
                );
                leftWhisker.rotation.z = Math.PI / 2;
                leftWhisker.position.set(0.55, (i - 1) * 0.03, -0.1);
                leftWhisker.rotation.y = -Math.PI / 8;
                body.add(leftWhisker);
                
                const rightWhisker = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.005, 0.005, 0.25, 4),
                    whiskerMaterial
                );
                rightWhisker.rotation.z = Math.PI / 2;
                rightWhisker.position.set(0.55, (i - 1) * 0.03, 0.1);
                rightWhisker.rotation.y = Math.PI / 8;
                body.add(rightWhisker);
            }
            
            // Tail - segmented
            const tailSegments = 8;
            for (let i = 0; i < tailSegments; i++) {
                const segment = new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        0.04 - (i * 0.004),
                        0.04 - ((i + 1) * 0.004),
                        0.12,
                        6
                    ),
                    new THREE.MeshStandardMaterial({ color: 0xcc8866, roughness: 0.9 })
                );
                segment.rotation.z = Math.PI / 2;
                segment.position.set(
                    -0.35 - (i * 0.11),
                    0.08 + (i * 0.02),
                    0
                );
                segment.rotation.y = i * 0.1;
                body.add(segment);
            }
            
            // Legs
            const legMaterial = new THREE.MeshStandardMaterial({ color: 0xcc9977, roughness: 0.8 });
            const legPositions = [[0.15, -0.1], [-0.05, -0.1], [0.15, 0.1], [-0.05, 0.1]];
            legPositions.forEach(([x, z]) => {
                const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.025, 0.02, 0.15, 6),
                    legMaterial
                );
                leg.position.set(x, -0.15, z);
                const foot = new THREE.Mesh(
                    new THREE.BoxGeometry(0.05, 0.02, 0.08),
                    legMaterial
                );
                foot.position.set(x, -0.23, z);
                body.add(leg);
                body.add(foot);
            });
            
            monsterGroup.position.y = 0.25;
            speed = 0.3;
            moveChance = 0.8;
            break;
        }
            
        case MONSTER_TYPES.GHOST: {
            // Ghost - floating, semi-transparent
            body = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: 0xccccff,
                    transparent: true,
                    opacity: 0.5,
                    emissive: 0x4444ff,
                    emissiveIntensity: 0.3
                })
            );
            body.scale.set(1, 1.3, 1);
            monsterGroup.position.y = 1.2;
            speed = 0.55;
            moveChance = 0.5;
            break;
        }
            
        case MONSTER_TYPES.PLANT: {
            // Carnivorous plant - green with red mouth
            body = new THREE.Group();
            const plantStem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8),
                new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 0.8 })
            );
            const plantHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0x339933, roughness: 0.7 })
            );
            plantHead.position.y = 0.6;
            const plantMouth = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.8 })
            );
            plantMouth.position.set(0, 0.6, 0.3);
            body.add(plantStem);
            body.add(plantHead);
            body.add(plantMouth);
            speed = 0.7;
            moveChance = 0.3;
            break;
        }
            
        case MONSTER_TYPES.BAT: {
            // Bat - detailed with fur, ears, and membrane wings
            body = new THREE.Group();
            
            // Main body
            const batBody = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
            );
            batBody.scale.set(1, 0.9, 1.2);
            body.add(batBody);
            
            // Head
            const batHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 })
            );
            batHead.position.set(0, 0, 0.22);
            body.add(batHead);
            
            // Ears
            const earGeometry = new THREE.ConeGeometry(0.06, 0.15, 8);
            const earMaterial = new THREE.MeshStandardMaterial({ color: 0x332222, roughness: 0.8 });
            const leftEar = new THREE.Mesh(earGeometry, earMaterial);
            leftEar.position.set(-0.08, 0.12, 0.25);
            const rightEar = new THREE.Mesh(earGeometry, earMaterial);
            rightEar.position.set(0.08, 0.12, 0.25);
            body.add(leftEar);
            body.add(rightEar);
            
            // Eyes (glowing)
            const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.8
            });
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.05, 0.05, 0.3);
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.05, 0.05, 0.3);
            body.add(leftEye);
            body.add(rightEye);
            
            // Detailed wings with membrane
            const wingMembraneMaterial = new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                roughness: 0.8,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            });
            
            // Left wing
            const leftWingGroup = new THREE.Group();
            // Wing bones
            for (let i = 0; i < 4; i++) {
                const bone = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.01, 0.008, 0.3 + i * 0.05),
                    new THREE.MeshStandardMaterial({ color: 0x443333 })
                );
                bone.rotation.z = Math.PI / 3 + i * 0.15;
                bone.position.set(-0.15 - i * 0.08, 0, 0);
                leftWingGroup.add(bone);
            }
            // Wing membrane
            const leftMembrane = new THREE.Mesh(
                new THREE.PlaneGeometry(0.5, 0.35),
                wingMembraneMaterial
            );
            leftMembrane.position.set(-0.25, 0, 0);
            leftWingGroup.add(leftMembrane);
            leftWingGroup.position.set(-0.15, 0, 0);
            body.add(leftWingGroup);
            
            // Right wing (mirrored)
            const rightWingGroup = new THREE.Group();
            for (let i = 0; i < 4; i++) {
                const bone = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.01, 0.008, 0.3 + i * 0.05),
                    new THREE.MeshStandardMaterial({ color: 0x443333 })
                );
                bone.rotation.z = -Math.PI / 3 - i * 0.15;
                bone.position.set(0.15 + i * 0.08, 0, 0);
                rightWingGroup.add(bone);
            }
            const rightMembrane = new THREE.Mesh(
                new THREE.PlaneGeometry(0.5, 0.35),
                wingMembraneMaterial
            );
            rightMembrane.position.set(0.25, 0, 0);
            rightWingGroup.add(rightMembrane);
            rightWingGroup.position.set(0.15, 0, 0);
            body.add(rightWingGroup);
            
            // Feet/claws
            const clawMaterial = new THREE.MeshStandardMaterial({ color: 0x554444 });
            const leftClaw = new THREE.Mesh(
                new THREE.ConeGeometry(0.02, 0.05, 4),
                clawMaterial
            );
            leftClaw.position.set(-0.08, -0.15, 0);
            leftClaw.rotation.x = Math.PI;
            const rightClaw = new THREE.Mesh(
                new THREE.ConeGeometry(0.02, 0.05, 4),
                clawMaterial
            );
            rightClaw.position.set(0.08, -0.15, 0);
            rightClaw.rotation.x = Math.PI;
            body.add(leftClaw);
            body.add(rightClaw);
            
            monsterGroup.position.y = 1.5;
            speed = 0.3;
            moveChance = 0.8;
            break;
        }
            
        case MONSTER_TYPES.SALAMANDER: {
            // Cave salamander - long, orange/red
            body = new THREE.Group();
            const salamanderBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.15, 1.0, 8),
                new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.7 })
            );
            salamanderBody.rotation.z = Math.PI / 2;
            const salamanderHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0xff4400, roughness: 0.7 })
            );
            salamanderHead.position.set(0.5, 0, 0);
            body.add(salamanderBody);
            body.add(salamanderHead);
            monsterGroup.position.y = 0.3;
            speed = 0.4;
            moveChance = 0.7;
            break;
        }
            
        case MONSTER_TYPES.GOBLIN: {
            // Goblin - detailed with armor pieces, weapon, and facial features
            body = new THREE.Group();
            
            // Torso
            const goblinBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.22, 0.28, 0.7, 8),
                new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.9 })
            );
            goblinBody.position.y = 0.1;
            body.add(goblinBody);
            
            // Head
            const goblinHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x559955, roughness: 0.9 })
            );
            goblinHead.position.y = 0.55;
            goblinHead.scale.set(1.1, 1, 1.2);
            body.add(goblinHead);
            
            // Large pointed ears
            const earGeometry = new THREE.ConeGeometry(0.08, 0.25, 6);
            const earMaterial = new THREE.MeshStandardMaterial({ color: 0x66aa66, roughness: 0.9 });
            const leftEar = new THREE.Mesh(earGeometry, earMaterial);
            leftEar.position.set(-0.22, 0.65, 0);
            leftEar.rotation.z = -Math.PI / 3;
            const rightEar = new THREE.Mesh(earGeometry, earMaterial);
            rightEar.position.set(0.22, 0.65, 0);
            rightEar.rotation.z = Math.PI / 3;
            body.add(leftEar);
            body.add(rightEar);
            
            // Nose (large and hooked)
            const nose = new THREE.Mesh(
                new THREE.ConeGeometry(0.06, 0.15, 6),
                new THREE.MeshStandardMaterial({ color: 0x558855, roughness: 0.9 })
            );
            nose.position.set(0, 0.52, 0.18);
            nose.rotation.x = Math.PI / 2;
            body.add(nose);
            
            // Eyes (yellow and menacing)
            const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffff00,
                emissive: 0x888800,
                emissiveIntensity: 0.3
            });
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.08, 0.58, 0.15);
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.08, 0.58, 0.15);
            body.add(leftEye);
            body.add(rightEye);
            
            // Pupils
            const pupilGeometry = new THREE.SphereGeometry(0.02, 8, 8);
            const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
            leftPupil.position.set(-0.08, 0.58, 0.18);
            const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
            rightPupil.position.set(0.08, 0.58, 0.18);
            body.add(leftPupil);
            body.add(rightPupil);
            
            // Mouth with teeth
            const mouth = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.04, 0.05),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            mouth.position.set(0, 0.45, 0.18);
            body.add(mouth);
            
            // Teeth
            const toothMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
            for (let i = 0; i < 5; i++) {
                const tooth = new THREE.Mesh(
                    new THREE.BoxGeometry(0.02, 0.03, 0.02),
                    toothMaterial
                );
                tooth.position.set(-0.05 + i * 0.025, 0.47, 0.2);
                body.add(tooth);
            }
            
            // Arms
            const armMaterial = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.9 });
            const leftArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.05, 0.5, 8),
                armMaterial
            );
            leftArm.position.set(-0.3, 0.15, 0);
            leftArm.rotation.z = Math.PI / 5;
            body.add(leftArm);
            
            const rightArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.05, 0.5, 8),
                armMaterial
            );
            rightArm.position.set(0.3, 0.15, 0);
            rightArm.rotation.z = -Math.PI / 5;
            body.add(rightArm);
            
            // Torch in right hand
            const torchGroup = createTorch();
            torchGroup.position.set(0.4, -0.05, 0.15);
            torchGroup.rotation.z = -Math.PI / 6;
            torchGroup.rotation.x = Math.PI / 6;
            body.add(torchGroup);
            
            // Crude weapon (club)
            const club = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.08, 0.4, 6),
                new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.95 })
            );
            club.position.set(-0.4, -0.05, 0.15);
            club.rotation.z = Math.PI / 3;
            body.add(club);
            
            // Crude armor (leather vest)
            const vest = new THREE.Mesh(
                new THREE.CylinderGeometry(0.24, 0.29, 0.6, 8),
                new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.95 })
            );
            vest.position.y = 0.1;
            body.add(vest);
            
            // Legs
            const legMaterial = new THREE.MeshStandardMaterial({ color: 0x665544, roughness: 0.9 });
            const leftLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.07, 0.4, 8),
                legMaterial
            );
            leftLeg.position.set(-0.1, -0.4, 0);
            const rightLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.07, 0.4, 8),
                legMaterial
            );
            rightLeg.position.set(0.1, -0.4, 0);
            body.add(leftLeg);
            body.add(rightLeg);
            
            monsterGroup.position.y = 0.6;
            speed = 0.35;
            moveChance = 0.7;
            break;
        }
            
        case MONSTER_TYPES.CUBE: {
            // Gelatinous cube - transparent cube
            body = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 0.9, 0.9),
                new THREE.MeshStandardMaterial({
                    color: 0x88ff88,
                    transparent: true,
                    opacity: 0.4,
                    roughness: 0.1,
                    metalness: 0.2
                })
            );
            speed = 0.8;
            moveChance = 0.4;
            break;
        }
            
        case MONSTER_TYPES.ORC: {
            // Orc - large, detailed with muscles, armor, and weapon
            body = new THREE.Group();
            
            // Muscular torso
            const orcBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.38, 0.42, 1.2, 12),
                new THREE.MeshStandardMaterial({ color: 0x336633, roughness: 0.9 })
            );
            orcBody.position.y = 0.2;
            body.add(orcBody);
            
            // Broad shoulders
            const shoulders = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 0.25, 0.35),
                new THREE.MeshStandardMaterial({ color: 0x2a552a, roughness: 0.9 })
            );
            shoulders.position.y = 0.7;
            body.add(shoulders);
            
            // Head
            const orcHead = new THREE.Mesh(
                new THREE.BoxGeometry(0.45, 0.48, 0.38),
                new THREE.MeshStandardMaterial({ color: 0x447744, roughness: 0.9 })
            );
            orcHead.position.y = 1.05;
            body.add(orcHead);
            
            // Heavy brow
            const brow = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.08, 0.15),
                new THREE.MeshStandardMaterial({ color: 0x335533, roughness: 0.95 })
            );
            brow.position.set(0, 1.15, 0.15);
            body.add(brow);
            
            // Tusks
            const tuskGeometry = new THREE.CylinderGeometry(0.04, 0.02, 0.25, 6);
            const tuskMaterial = new THREE.MeshStandardMaterial({ color: 0xffffee });
            const leftTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
            leftTusk.position.set(-0.12, 0.95, 0.22);
            leftTusk.rotation.x = Math.PI / 5;
            leftTusk.rotation.z = -Math.PI / 12;
            const rightTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
            rightTusk.position.set(0.12, 0.95, 0.22);
            rightTusk.rotation.x = Math.PI / 5;
            rightTusk.rotation.z = Math.PI / 12;
            body.add(leftTusk);
            body.add(rightTusk);
            
            // Eyes (red and angry)
            const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff3300,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            });
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.12, 1.12, 0.15);
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.12, 1.12, 0.15);
            body.add(leftEye);
            body.add(rightEye);
            
            // Nose (pig-like)
            const nose = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.12, 0.12),
                new THREE.MeshStandardMaterial({ color: 0x447744 })
            );
            nose.position.set(0, 1.0, 0.22);
            body.add(nose);
            
            // Nostrils
            const nostrilGeometry = new THREE.SphereGeometry(0.03, 6, 6);
            const nostrilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
            leftNostril.position.set(-0.04, 0.98, 0.27);
            const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
            rightNostril.position.set(0.04, 0.98, 0.27);
            body.add(leftNostril);
            body.add(rightNostril);
            
            // Muscular arms
            const armMaterial = new THREE.MeshStandardMaterial({ color: 0x336633, roughness: 0.9 });
            const leftUpperArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.1, 0.5, 10),
                armMaterial
            );
            leftUpperArm.position.set(-0.5, 0.5, 0);
            leftUpperArm.rotation.z = Math.PI / 6;
            body.add(leftUpperArm);
            
            const rightUpperArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.1, 0.5, 10),
                armMaterial
            );
            rightUpperArm.position.set(0.5, 0.5, 0);
            rightUpperArm.rotation.z = -Math.PI / 6;
            body.add(rightUpperArm);
            
            // Forearms
            const leftForearm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.09, 0.4, 10),
                armMaterial
            );
            leftForearm.position.set(-0.62, 0.15, 0.1);
            leftForearm.rotation.z = Math.PI / 4;
            body.add(leftForearm);
            
            const rightForearm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.09, 0.4, 10),
                armMaterial
            );
            rightForearm.position.set(0.62, 0.15, 0.1);
            rightForearm.rotation.z = -Math.PI / 4;
            body.add(rightForearm);
            
            // Large hands/fists
            const handGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.2);
            const leftHand = new THREE.Mesh(handGeometry, armMaterial);
            leftHand.position.set(-0.72, -0.05, 0.15);
            const rightHand = new THREE.Mesh(handGeometry, armMaterial);
            rightHand.position.set(0.72, -0.05, 0.15);
            body.add(leftHand);
            body.add(rightHand);
            
            // Crude metal armor plates
            const armorMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x666666,
                metalness: 0.7,
                roughness: 0.6
            });
            const chestPlate = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.5, 0.1),
                armorMaterial
            );
            chestPlate.position.set(0, 0.4, 0.25);
            body.add(chestPlate);
            
            // Shoulder pads
            const leftShoulder = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 8),
                armorMaterial
            );
            leftShoulder.position.set(-0.4, 0.75, 0);
            leftShoulder.scale.set(1.2, 0.8, 1);
            const rightShoulder = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 8),
                armorMaterial
            );
            rightShoulder.position.set(0.4, 0.75, 0);
            rightShoulder.scale.set(1.2, 0.8, 1);
            body.add(leftShoulder);
            body.add(rightShoulder);
            
            // Large weapon (axe)
            const axeHandle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8),
                new THREE.MeshStandardMaterial({ color: 0x4a2511, roughness: 0.95 })
            );
            axeHandle.position.set(0.8, 0, 0.15);
            axeHandle.rotation.z = Math.PI / 3;
            body.add(axeHandle);
            
            const axeBlade = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.25, 0.05),
                armorMaterial
            );
            axeBlade.position.set(0.95, 0.3, 0.15);
            body.add(axeBlade);
            
            // Torch in left hand
            const torchGroup = createTorch();
            torchGroup.position.set(-0.72, -0.05, 0.15);
            torchGroup.rotation.x = Math.PI / 6;
            body.add(torchGroup);
            
            // Legs
            const legMaterial = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9 });
            const leftLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.14, 0.7, 10),
                legMaterial
            );
            leftLeg.position.set(-0.15, -0.55, 0);
            const rightLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.14, 0.7, 10),
                legMaterial
            );
            rightLeg.position.set(0.15, -0.55, 0);
            body.add(leftLeg);
            body.add(rightLeg);
            
            // Boots
            const bootMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
            const leftBoot = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.12, 0.25),
                bootMaterial
            );
            leftBoot.position.set(-0.15, -0.92, 0.05);
            const rightBoot = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.12, 0.25),
                bootMaterial
            );
            rightBoot.position.set(0.15, -0.92, 0.05);
            body.add(leftBoot);
            body.add(rightBoot);
            
            monsterGroup.position.y = 1.0;
            speed = 0.55;
            moveChance = 0.6;
            break;
        }
            
        case MONSTER_TYPES.BANDIT: {
            // Bandit - detailed rogue with mask, daggers, and leather armor
            body = new THREE.Group();
            
            // Torso with leather vest
            const banditTorso = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.32, 1.1, 10),
                new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.85 })
            );
            banditTorso.position.y = 0.15;
            body.add(banditTorso);
            
            // Leather vest detail
            const vest = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.34, 0.9, 10),
                new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.8 })
            );
            vest.position.y = 0.15;
            body.add(vest);
            
            // Belt
            const belt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.33, 0.33, 0.1, 12),
                new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 })
            );
            belt.position.y = -0.25;
            body.add(belt);
            
            // Buckle
            const buckle = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.08, 0.05),
                new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 })
            );
            buckle.position.set(0, -0.25, 0.33);
            body.add(buckle);
            
            // Head
            const banditHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0xccaa88, roughness: 0.8 })
            );
            banditHead.position.y = 0.8;
            body.add(banditHead);
            
            // Face mask/bandana
            const mask = new THREE.Mesh(
                new THREE.BoxGeometry(0.24, 0.12, 0.22),
                new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
            );
            mask.position.set(0, 0.75, 0.05);
            body.add(mask);
            
            // Hood
            const banditHood = new THREE.Mesh(
                new THREE.ConeGeometry(0.28, 0.35, 10),
                new THREE.MeshStandardMaterial({ color: 0x221111, roughness: 0.9 })
            );
            banditHood.position.y = 1.05;
            body.add(banditHood);
            
            // Eyes (menacing)
            const banditEyeGeometry = new THREE.SphereGeometry(0.025, 8, 8);
            const banditEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const banditLeftEye = new THREE.Mesh(banditEyeGeometry, banditEyeMaterial);
            banditLeftEye.position.set(-0.08, 0.82, 0.18);
            const banditRightEye = new THREE.Mesh(banditEyeGeometry, banditEyeMaterial);
            banditRightEye.position.set(0.08, 0.82, 0.18);
            body.add(banditLeftEye);
            body.add(banditRightEye);
            
            // Arms
            const banditArmMaterial = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.85 });
            const banditLeftArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.06, 0.6, 8),
                banditArmMaterial
            );
            banditLeftArm.position.set(-0.35, 0.3, 0);
            banditLeftArm.rotation.z = Math.PI / 8;
            body.add(banditLeftArm);
            
            const banditRightArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.06, 0.6, 8),
                banditArmMaterial
            );
            banditRightArm.position.set(0.35, 0.3, 0);
            banditRightArm.rotation.z = -Math.PI / 8;
            body.add(banditRightArm);
            
            // Hands
            const banditHandGeometry = new THREE.SphereGeometry(0.06, 8, 8);
            const banditHandMaterial = new THREE.MeshStandardMaterial({ color: 0xccaa88, roughness: 0.8 });
            const banditLeftHand = new THREE.Mesh(banditHandGeometry, banditHandMaterial);
            banditLeftHand.position.set(-0.4, 0, 0);
            const banditRightHand = new THREE.Mesh(banditHandGeometry, banditHandMaterial);
            banditRightHand.position.set(0.4, 0, 0);
            body.add(banditLeftHand);
            body.add(banditRightHand);
            
            // Daggers
            const daggerMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 });
            const leftDagger = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.01, 0.3, 6),
                daggerMaterial
            );
            leftDagger.position.set(-0.45, 0, 0.1);
            leftDagger.rotation.z = Math.PI / 3;
            body.add(leftDagger);
            
            // Torch in right hand (replaces dagger)
            const torchGroup = createTorch();
            torchGroup.position.set(0.45, 0, 0.1);
            torchGroup.rotation.z = -Math.PI / 6;
            torchGroup.rotation.x = Math.PI / 6;
            body.add(torchGroup);
            
            // Dagger handles
            const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2511, roughness: 0.9 });
            const leftHandle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6),
                handleMaterial
            );
            leftHandle.position.set(-0.5, 0.05, 0.15);
            leftHandle.rotation.z = Math.PI / 3;
            body.add(leftHandle);
            
            const rightHandle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6),
                handleMaterial
            );
            rightHandle.position.set(0.5, 0.05, 0.15);
            rightHandle.rotation.z = -Math.PI / 3;
            body.add(rightHandle);
            
            // Legs with pants
            const banditLegMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.85 });
            const banditLeftLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.08, 0.6, 8),
                banditLegMaterial
            );
            banditLeftLeg.position.set(-0.12, -0.5, 0);
            const banditRightLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.08, 0.6, 8),
                banditLegMaterial
            );
            banditRightLeg.position.set(0.12, -0.5, 0);
            body.add(banditLeftLeg);
            body.add(banditRightLeg);
            
            // Boots
            const banditBootMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
            const banditLeftBoot = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.1, 0.18),
                banditBootMaterial
            );
            banditLeftBoot.position.set(-0.12, -0.82, 0.03);
            const banditRightBoot = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.1, 0.18),
                banditBootMaterial
            );
            banditRightBoot.position.set(0.12, -0.82, 0.03);
            body.add(banditLeftBoot);
            body.add(banditRightBoot);
            
            speed = 0.45;
            moveChance = 0.65;
            break;
        }
            
        case MONSTER_TYPES.WRAITH: {
            // Wraith - dark, ghostly, floating
            body = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.6, 1.5, 8),
                new THREE.MeshStandardMaterial({
                    color: 0x110033,
                    transparent: true,
                    opacity: 0.6,
                    emissive: 0x330066,
                    emissiveIntensity: 0.5
                })
            );
            monsterGroup.position.y = 1.3;
            speed = 0.5;
            moveChance = 0.5;
            break;
        }
            
        case MONSTER_TYPES.MIMIC: {
            // Mimic - looks like a treasure chest
            body = new THREE.Group();
            const mimicBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.5, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
            );
            const mimicLid = new THREE.Mesh(
                new THREE.BoxGeometry(0.65, 0.15, 0.55),
                new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
            );
            mimicLid.position.y = 0.325;
            const mimicTrim = new THREE.Mesh(
                new THREE.BoxGeometry(0.7, 0.1, 0.1),
                new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 })
            );
            mimicTrim.position.z = 0.25;
            // Eyes (to distinguish from real chests when close)
            const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
            const mimicEye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
            mimicEye1.position.set(-0.15, 0.35, 0.3);
            const mimicEye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
            mimicEye2.position.set(0.15, 0.35, 0.3);
            body.add(mimicBody);
            body.add(mimicLid);
            body.add(mimicTrim);
            body.add(mimicEye1);
            body.add(mimicEye2);
            monsterGroup.position.y = 0.3;
            speed = 0.6;
            moveChance = 0.2; // Mimics don't move much
            break;
        }
            
        case MONSTER_TYPES.GARGOYLE: {
            // Gargoyle - stone creature with wings and horns
            body = new THREE.Group();
            
            const stoneMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x555555, 
                roughness: 0.95,
                metalness: 0.1
            });
            
            // Body
            const gargoyleBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.4, 0.9, 8),
                stoneMaterial
            );
            gargoyleBody.position.y = 0.2;
            body.add(gargoyleBody);
            
            // Head with horns
            const gargoyleHead = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.45, 0.35),
                stoneMaterial
            );
            gargoyleHead.position.y = 0.75;
            body.add(gargoyleHead);
            
            // Horns
            const hornGeometry = new THREE.ConeGeometry(0.08, 0.3, 6);
            const leftHorn = new THREE.Mesh(hornGeometry, stoneMaterial);
            leftHorn.position.set(-0.15, 1.05, 0);
            leftHorn.rotation.z = -Math.PI / 8;
            const rightHorn = new THREE.Mesh(hornGeometry, stoneMaterial);
            rightHorn.position.set(0.15, 1.05, 0);
            rightHorn.rotation.z = Math.PI / 8;
            body.add(leftHorn);
            body.add(rightHorn);
            
            // Glowing eyes
            const gargoyleEyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const gargoyleEyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 1.0
            });
            const gargoyleLeftEye = new THREE.Mesh(gargoyleEyeGeometry, gargoyleEyeMaterial);
            gargoyleLeftEye.position.set(-0.1, 0.8, 0.2);
            const gargoyleRightEye = new THREE.Mesh(gargoyleEyeGeometry, gargoyleEyeMaterial);
            gargoyleRightEye.position.set(0.1, 0.8, 0.2);
            body.add(gargoyleLeftEye);
            body.add(gargoyleRightEye);
            
            // Stone wings
            const wingMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                roughness: 0.9
            });
            // Left wing
            for (let i = 0; i < 3; i++) {
                const wingSegment = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.4 + i * 0.1, 0.02),
                    wingMaterial
                );
                wingSegment.position.set(-0.4 - i * 0.15, 0.4, -0.1);
                wingSegment.rotation.y = -Math.PI / 4 - i * 0.1;
                wingSegment.rotation.z = Math.PI / 6;
                body.add(wingSegment);
            }
            // Right wing
            for (let i = 0; i < 3; i++) {
                const wingSegment = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.4 + i * 0.1, 0.02),
                    wingMaterial
                );
                wingSegment.position.set(0.4 + i * 0.15, 0.4, -0.1);
                wingSegment.rotation.y = Math.PI / 4 + i * 0.1;
                wingSegment.rotation.z = -Math.PI / 6;
                body.add(wingSegment);
            }
            
            // Clawed feet
            const clawMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            for (let i = 0; i < 2; i++) {
                const foot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.12, 8, 8),
                    stoneMaterial
                );
                foot.position.set((i - 0.5) * 0.3, -0.3, 0);
                foot.scale.set(1, 0.6, 1.3);
                body.add(foot);
                
                // Claws
                for (let j = 0; j < 3; j++) {
                    const claw = new THREE.Mesh(
                        new THREE.ConeGeometry(0.02, 0.1, 4),
                        clawMaterial
                    );
                    claw.position.set((i - 0.5) * 0.3 + (j - 1) * 0.06, -0.35, 0.12);
                    claw.rotation.x = Math.PI / 2;
                    body.add(claw);
                }
            }
            
            speed = 0.6;
            moveChance = 0.4;
            break;
        }
            
        case MONSTER_TYPES.IMP: {
            // Imp - small demon with horns, tail, and wings
            body = new THREE.Group();
            
            // Red demonic body
            const impBodyMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xcc0000,
                roughness: 0.8
            });
            
            const impBody = new THREE.Mesh(
                new THREE.SphereGeometry(0.18, 12, 12),
                impBodyMaterial
            );
            impBody.scale.set(1, 1.3, 0.9);
            body.add(impBody);
            
            // Head with evil grin
            const impHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 12, 12),
                impBodyMaterial
            );
            impHead.position.y = 0.28;
            body.add(impHead);
            
            // Pointed horns
            const impHornGeometry = new THREE.ConeGeometry(0.04, 0.2, 6);
            const impHornMaterial = new THREE.MeshStandardMaterial({ color: 0x330000 });
            const impLeftHorn = new THREE.Mesh(impHornGeometry, impHornMaterial);
            impLeftHorn.position.set(-0.1, 0.42, 0);
            impLeftHorn.rotation.z = -Math.PI / 6;
            const impRightHorn = new THREE.Mesh(impHornGeometry, impHornMaterial);
            impRightHorn.position.set(0.1, 0.42, 0);
            impRightHorn.rotation.z = Math.PI / 6;
            body.add(impLeftHorn);
            body.add(impRightHorn);
            
            // Yellow glowing eyes
            const impEyeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const impEyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.9
            });
            const impLeftEye = new THREE.Mesh(impEyeGeometry, impEyeMaterial);
            impLeftEye.position.set(-0.06, 0.3, 0.13);
            const impRightEye = new THREE.Mesh(impEyeGeometry, impEyeMaterial);
            impRightEye.position.set(0.06, 0.3, 0.13);
            body.add(impLeftEye);
            body.add(impRightEye);
            
            // Small bat-like wings
            const impWingMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x660000,
                roughness: 0.7
            });
            const impLeftWing = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.3, 0.02),
                impWingMaterial
            );
            impLeftWing.position.set(-0.2, 0.1, -0.1);
            impLeftWing.rotation.y = -Math.PI / 4;
            const impRightWing = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.3, 0.02),
                impWingMaterial
            );
            impRightWing.position.set(0.2, 0.1, -0.1);
            impRightWing.rotation.y = Math.PI / 4;
            body.add(impLeftWing);
            body.add(impRightWing);
            
            // Barbed tail
            const tailSegments = 6;
            for (let i = 0; i < tailSegments; i++) {
                const segment = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02 - i * 0.002, 0.025 - i * 0.003, 0.12, 6),
                    impBodyMaterial
                );
                segment.position.set(0, -0.15 - i * 0.08, -0.1 - i * 0.08);
                segment.rotation.x = -Math.PI / 4;
                body.add(segment);
            }
            
            // Tail barb
            const barb = new THREE.Mesh(
                new THREE.ConeGeometry(0.04, 0.12, 4),
                impHornMaterial
            );
            barb.position.set(0, -0.6, -0.55);
            barb.rotation.x = -Math.PI / 4;
            body.add(barb);
            
            monsterGroup.position.y = 1.0;
            speed = 0.4;
            moveChance = 0.75;
            break;
        }
            
        case MONSTER_TYPES.TROLL: {
            // Troll - large, hunched, regenerating creature
            body = new THREE.Group();
            
            const trollMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x556644,
                roughness: 0.95
            });
            
            // Massive hunched body
            const trollBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.55, 1.4, 10),
                trollMaterial
            );
            trollBody.position.y = 0.3;
            trollBody.rotation.z = Math.PI / 12;
            body.add(trollBody);
            
            // Large head
            const trollHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.35, 12, 12),
                trollMaterial
            );
            trollHead.position.set(-0.15, 1.0, 0.2);
            trollHead.scale.set(1.2, 1, 1.3);
            body.add(trollHead);
            
            // Huge nose
            const trollNose = new THREE.Mesh(
                new THREE.ConeGeometry(0.12, 0.2, 8),
                new THREE.MeshStandardMaterial({ color: 0x667755 })
            );
            trollNose.position.set(-0.15, 0.95, 0.4);
            trollNose.rotation.x = Math.PI / 2;
            body.add(trollNose);
            
            // Small eyes
            const trollEyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
            const trollEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const trollLeftEye = new THREE.Mesh(trollEyeGeometry, trollEyeMaterial);
            trollLeftEye.position.set(-0.25, 1.05, 0.38);
            const trollRightEye = new THREE.Mesh(trollEyeGeometry, trollEyeMaterial);
            trollRightEye.position.set(-0.05, 1.05, 0.38);
            body.add(trollLeftEye);
            body.add(trollRightEye);
            
            // Large mouth with teeth
            const mouth = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.08, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            mouth.position.set(-0.15, 0.85, 0.38);
            body.add(mouth);
            
            // Tusks
            const tuskMaterial = new THREE.MeshStandardMaterial({ color: 0xffffdd });
            for (let i = 0; i < 4; i++) {
                const tusk = new THREE.Mesh(
                    new THREE.BoxGeometry(0.04, 0.1, 0.04),
                    tuskMaterial
                );
                tusk.position.set(-0.22 + i * 0.08, 0.9, 0.42);
                body.add(tusk);
            }
            
            // Long arms
            const trollArmMaterial = new THREE.MeshStandardMaterial({ color: 0x667755, roughness: 0.95 });
            const trollLeftArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.12, 0.9, 10),
                trollArmMaterial
            );
            trollLeftArm.position.set(-0.6, 0.3, 0);
            trollLeftArm.rotation.z = Math.PI / 4;
            body.add(trollLeftArm);
            
            const trollRightArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.12, 0.9, 10),
                trollArmMaterial
            );
            trollRightArm.position.set(0.6, 0.3, 0);
            trollRightArm.rotation.z = -Math.PI / 4;
            body.add(trollRightArm);
            
            // Huge hands
            const trollHandGeometry = new THREE.SphereGeometry(0.18, 10, 10);
            const trollLeftHand = new THREE.Mesh(trollHandGeometry, trollArmMaterial);
            trollLeftHand.position.set(-0.9, -0.1, 0);
            trollLeftHand.scale.set(1.2, 0.8, 1.5);
            const trollRightHand = new THREE.Mesh(trollHandGeometry, trollArmMaterial);
            trollRightHand.position.set(0.9, -0.1, 0);
            trollRightHand.scale.set(1.2, 0.8, 1.5);
            body.add(trollLeftHand);
            body.add(trollRightHand);
            
            // Thick legs
            const trollLegMaterial = new THREE.MeshStandardMaterial({ color: 0x445533, roughness: 0.95 });
            const trollLeftLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.16, 0.6, 10),
                trollLegMaterial
            );
            trollLeftLeg.position.set(-0.2, -0.6, 0);
            const trollRightLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.16, 0.6, 10),
                trollLegMaterial
            );
            trollRightLeg.position.set(0.2, -0.6, 0);
            body.add(trollLeftLeg);
            body.add(trollRightLeg);
            
            monsterGroup.position.y = 0.9;
            speed = 0.65;
            moveChance = 0.5;
            break;
        }
            
        case MONSTER_TYPES.SLIME: {
            // Acid Slime - bubbling, corrosive ooze
            body = new THREE.Group();
            
            // Main slime body
            const slimeBody = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: 0x88ff00,
                    transparent: true,
                    opacity: 0.8,
                    roughness: 0.1,
                    emissive: 0x44aa00,
                    emissiveIntensity: 0.4
                })
            );
            slimeBody.scale.set(1, 0.7, 1);
            body.add(slimeBody);
            
            // Bubbles on surface
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const bubble = new THREE.Mesh(
                    new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 8, 8),
                    new THREE.MeshStandardMaterial({
                        color: 0xaaff22,
                        transparent: true,
                        opacity: 0.6,
                        emissive: 0x66cc00,
                        emissiveIntensity: 0.3
                    })
                );
                bubble.position.set(
                    Math.cos(angle) * 0.35,
                    Math.random() * 0.3 - 0.1,
                    Math.sin(angle) * 0.35
                );
                body.add(bubble);
            }
            
            // Core (nucleus)
            const core = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 12, 12),
                new THREE.MeshStandardMaterial({
                    color: 0x00ff00,
                    emissive: 0x00ff00,
                    emissiveIntensity: 0.8
                })
            );
            core.position.y = 0;
            body.add(core);
            
            speed = 0.5;
            moveChance = 0.6;
            break;
        }
            
        case MONSTER_TYPES.ZOMBIE: {
            // Zombie - undead humanoid with decay
            body = new THREE.Group();
            
            const zombieMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x667755,
                roughness: 0.9
            });
            const decayMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x334422,
                roughness: 0.95
            });
            
            // Torso
            const zombieBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.32, 1.1, 8),
                zombieMaterial
            );
            zombieBody.position.y = 0.1;
            zombieBody.rotation.z = Math.PI / 20; // Slight lean
            body.add(zombieBody);
            
            // Head (tilted)
            const zombieHead = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.4, 0.3),
                zombieMaterial
            );
            zombieHead.position.set(-0.05, 0.75, 0);
            zombieHead.rotation.z = Math.PI / 12;
            body.add(zombieHead);
            
            // Jaw (hanging open)
            const zombieJaw = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.12, 0.25),
                decayMaterial
            );
            zombieJaw.position.set(-0.05, 0.58, 0.05);
            body.add(zombieJaw);
            
            // Hollow eyes
            const zombieEyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
            const zombieEyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x000000,
                emissive: 0x004400,
                emissiveIntensity: 0.3
            });
            const zombieLeftEye = new THREE.Mesh(zombieEyeGeometry, zombieEyeMaterial);
            zombieLeftEye.position.set(-0.15, 0.78, 0.18);
            const zombieRightEye = new THREE.Mesh(zombieEyeGeometry, zombieEyeMaterial);
            zombieRightEye.position.set(0.05, 0.78, 0.18);
            body.add(zombieLeftEye);
            body.add(zombieRightEye);
            
            // Tattered clothes
            const clothMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x443322,
                roughness: 0.95
            });
            const shirt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.34, 0.8, 8),
                clothMaterial
            );
            shirt.position.y = 0.15;
            body.add(shirt);
            
            // Arms (one reaching forward, one hanging)
            const zombieLeftArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.06, 0.65, 8),
                zombieMaterial
            );
            zombieLeftArm.position.set(-0.35, 0.25, 0.3);
            zombieLeftArm.rotation.z = Math.PI / 6;
            zombieLeftArm.rotation.x = -Math.PI / 3;
            body.add(zombieLeftArm);
            
            const zombieRightArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.06, 0.65, 8),
                zombieMaterial
            );
            zombieRightArm.position.set(0.35, 0.1, 0);
            zombieRightArm.rotation.z = -Math.PI / 4;
            body.add(zombieRightArm);
            
            // Hands
            const zombieHandGeometry = new THREE.BoxGeometry(0.1, 0.12, 0.08);
            const zombieLeftHand = new THREE.Mesh(zombieHandGeometry, decayMaterial);
            zombieLeftHand.position.set(-0.45, 0.35, 0.55);
            const zombieRightHand = new THREE.Mesh(zombieHandGeometry, decayMaterial);
            zombieRightHand.position.set(0.48, -0.15, 0);
            body.add(zombieLeftHand);
            body.add(zombieRightHand);
            
            // Legs
            const zombieLegMaterial = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9 });
            const zombieLeftLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.08, 0.6, 8),
                zombieLegMaterial
            );
            zombieLeftLeg.position.set(-0.12, -0.5, 0);
            const zombieRightLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.08, 0.6, 8),
                zombieLegMaterial
            );
            zombieRightLeg.position.set(0.12, -0.5, 0);
            body.add(zombieLeftLeg);
            body.add(zombieRightLeg);
            
            speed = 0.7;
            moveChance = 0.55;
            break;
        }
            
        case MONSTER_TYPES.SERPENT: {
            // Giant Serpent - long coiled snake
            body = new THREE.Group();
            
            const serpentMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x225511,
                roughness: 0.6,
                metalness: 0.2
            });
            const scaleMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x336622,
                roughness: 0.5
            });
            
            // Serpent body - coiled segments
            const segments = 12;
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2 * 1.5;
                const radius = 0.3 + (i / segments) * 0.2;
                const segment = new THREE.Mesh(
                    new THREE.SphereGeometry(0.12 - (i * 0.006), 10, 10),
                    i % 2 === 0 ? serpentMaterial : scaleMaterial
                );
                segment.position.set(
                    Math.cos(angle) * radius,
                    0.1 + (i / segments) * 0.3,
                    Math.sin(angle) * radius
                );
                segment.scale.set(1, 0.8, 1.2);
                body.add(segment);
            }
            
            // Head
            const serpentHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.18, 12, 12),
                serpentMaterial
            );
            serpentHead.position.set(0.4, 0.45, 0);
            serpentHead.scale.set(1.3, 1, 1.5);
            body.add(serpentHead);
            
            // Snout
            const snout = new THREE.Mesh(
                new THREE.ConeGeometry(0.1, 0.15, 8),
                new THREE.MeshStandardMaterial({ color: 0x113300 })
            );
            snout.rotation.z = -Math.PI / 2;
            snout.position.set(0.52, 0.45, 0);
            body.add(snout);
            
            // Fangs
            const fangMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const serpentLeftFang = new THREE.Mesh(
                new THREE.ConeGeometry(0.02, 0.12, 6),
                fangMaterial
            );
            serpentLeftFang.position.set(0.55, 0.42, -0.06);
            serpentLeftFang.rotation.x = Math.PI;
            const serpentRightFang = new THREE.Mesh(
                new THREE.ConeGeometry(0.02, 0.12, 6),
                fangMaterial
            );
            serpentRightFang.position.set(0.55, 0.42, 0.06);
            serpentRightFang.rotation.x = Math.PI;
            body.add(serpentLeftFang);
            body.add(serpentRightFang);
            
            // Eyes
            const serpentEyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
            const serpentEyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffff00,
                emissive: 0xaaaa00,
                emissiveIntensity: 0.5
            });
            const serpentLeftEye = new THREE.Mesh(serpentEyeGeometry, serpentEyeMaterial);
            serpentLeftEye.position.set(0.48, 0.52, -0.12);
            const serpentRightEye = new THREE.Mesh(serpentEyeGeometry, serpentEyeMaterial);
            serpentRightEye.position.set(0.48, 0.52, 0.12);
            body.add(serpentLeftEye);
            body.add(serpentRightEye);
            
            // Forked tongue
            const tongue = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4),
                new THREE.MeshStandardMaterial({ color: 0xff0000 })
            );
            tongue.rotation.z = -Math.PI / 2;
            tongue.position.set(0.65, 0.45, 0);
            body.add(tongue);
            
            monsterGroup.position.y = 0.2;
            speed = 0.45;
            moveChance = 0.65;
            break;
        }
            
        case MONSTER_TYPES.MUSHROOM: {
            // Mushroom Monster - fungal creature
            body = new THREE.Group();
            
            // Mushroom cap
            const capMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xaa3344,
                roughness: 0.8
            });
            const mushroomCap = new THREE.Mesh(
                new THREE.SphereGeometry(0.45, 16, 16),
                capMaterial
            );
            mushroomCap.position.y = 0.6;
            mushroomCap.scale.set(1.2, 0.7, 1.2);
            body.add(mushroomCap);
            
            // White spots on cap
            const spotMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const spot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 8, 8),
                    spotMaterial
                );
                spot.position.set(
                    Math.cos(angle) * 0.35,
                    0.65 + Math.random() * 0.1,
                    Math.sin(angle) * 0.35
                );
                body.add(spot);
            }
            
            // Stem/stalk
            const stalkMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xddddcc,
                roughness: 0.9
            });
            const mushroomStalk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.25, 0.8, 16),
                stalkMaterial
            );
            mushroomStalk.position.y = 0.1;
            body.add(mushroomStalk);
            
            // Gills under cap
            const gillMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x886644,
                roughness: 0.85
            });
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const gill = new THREE.Mesh(
                    new THREE.BoxGeometry(0.02, 0.15, 0.3),
                    gillMaterial
                );
                gill.position.set(
                    Math.cos(angle) * 0.2,
                    0.4,
                    Math.sin(angle) * 0.2
                );
                gill.rotation.y = angle;
                body.add(gill);
            }
            
            // Face on stalk
            const mushroomEyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
            const mushroomEyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x000000,
                emissive: 0x440000,
                emissiveIntensity: 0.2
            });
            const mushroomLeftEye = new THREE.Mesh(mushroomEyeGeometry, mushroomEyeMaterial);
            mushroomLeftEye.position.set(-0.08, 0.25, 0.22);
            const mushroomRightEye = new THREE.Mesh(mushroomEyeGeometry, mushroomEyeMaterial);
            mushroomRightEye.position.set(0.08, 0.25, 0.22);
            body.add(mushroomLeftEye);
            body.add(mushroomRightEye);
            
            // Mouth
            const mouth = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.04, 0.05),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            mouth.position.set(0, 0.15, 0.23);
            body.add(mouth);
            
            // Root-like tendrils at base
            const rootMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x998877,
                roughness: 0.95
            });
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const root = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.03, 0.01, 0.2, 6),
                    rootMaterial
                );
                root.position.set(
                    Math.cos(angle) * 0.2,
                    -0.25,
                    Math.sin(angle) * 0.2
                );
                root.rotation.z = Math.cos(angle) * 0.5;
                root.rotation.x = Math.sin(angle) * 0.5;
                body.add(root);
            }
            
            speed = 0.55;
            moveChance = 0.4;
            break;
        }
            
        case MONSTER_TYPES.EYE_BEAST: {
            // Eye Beast - floating eyeball with tentacles
            body = new THREE.Group();
            
            // Large central eye
            const eyeball = new THREE.Mesh(
                new THREE.SphereGeometry(0.35, 20, 20),
                new THREE.MeshStandardMaterial({ 
                    color: 0xffffff,
                    roughness: 0.3,
                    metalness: 0.1
                })
            );
            body.add(eyeball);
            
            // Iris
            const iris = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 16, 16),
                new THREE.MeshStandardMaterial({ 
                    color: 0x4444ff,
                    roughness: 0.2
                })
            );
            iris.position.z = 0.18;
            body.add(iris);
            
            // Pupil
            const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 12, 12),
                new THREE.MeshStandardMaterial({ 
                    color: 0x000000,
                    emissive: 0x000044,
                    emissiveIntensity: 0.3
                })
            );
            pupil.position.z = 0.28;
            body.add(pupil);
            
            // Veins on eyeball
            const veinMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                emissive: 0x880000,
                emissiveIntensity: 0.2
            });
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const vein = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.008, 0.005, 0.3, 4),
                    veinMaterial
                );
                vein.position.set(
                    Math.cos(angle) * 0.25,
                    Math.sin(angle) * 0.25,
                    0.15
                );
                vein.rotation.y = angle;
                vein.rotation.x = Math.PI / 2;
                body.add(vein);
            }
            
            // Tentacles hanging below
            const tentacleMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8888cc,
                roughness: 0.7
            });
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2;
                const tentacleSegments = 5;
                
                for (let j = 0; j < tentacleSegments; j++) {
                    const segment = new THREE.Mesh(
                        new THREE.CylinderGeometry(
                            0.04 - j * 0.006,
                            0.04 - (j + 1) * 0.006,
                            0.15,
                            6
                        ),
                        tentacleMaterial
                    );
                    segment.position.set(
                        Math.cos(angle) * (0.25 + j * 0.03),
                        -0.35 - j * 0.14,
                        Math.sin(angle) * (0.25 + j * 0.03)
                    );
                    segment.rotation.x = Math.sin(angle) * 0.1;
                    segment.rotation.z = Math.cos(angle) * 0.1;
                    body.add(segment);
                }
            }
            
            // Small eyestalks around main eye
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
                const stalk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.025, 0.25, 6),
                    tentacleMaterial
                );
                stalk.position.set(
                    Math.cos(angle) * 0.3,
                    0.2,
                    Math.sin(angle) * 0.3
                );
                const smallEye = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05, 8, 8),
                    new THREE.MeshStandardMaterial({ 
                        color: 0xffaaaa,
                        emissive: 0xff0000,
                        emissiveIntensity: 0.4
                    })
                );
                smallEye.position.set(
                    Math.cos(angle) * 0.3,
                    0.35,
                    Math.sin(angle) * 0.3
                );
                body.add(stalk);
                body.add(smallEye);
            }
            
            monsterGroup.position.y = 1.2;
            speed = 0.5;
            moveChance = 0.6;
            break;
        }
            
        case MONSTER_TYPES.SCARAB: {
            // Scarab Swarm - cluster of beetles
            body = new THREE.Group();
            
            const scarabMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x221100,
                roughness: 0.4,
                metalness: 0.6
            });
            
            // Create multiple beetles in a swarm
            for (let i = 0; i < 12; i++) {
                const beetleGroup = new THREE.Group();
                
                // Beetle body
                const beetleBody = new THREE.Mesh(
                    new THREE.SphereGeometry(0.08, 8, 8),
                    scarabMaterial
                );
                beetleBody.scale.set(1, 0.7, 1.4);
                beetleGroup.add(beetleBody);
                
                // Wing shells
                const wingShellMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x443322,
                    metalness: 0.7,
                    roughness: 0.3
                });
                const leftShell = new THREE.Mesh(
                    new THREE.SphereGeometry(0.07, 8, 8),
                    wingShellMaterial
                );
                leftShell.scale.set(0.6, 0.5, 1.2);
                leftShell.position.set(-0.045, 0.02, 0);
                const rightShell = new THREE.Mesh(
                    new THREE.SphereGeometry(0.07, 8, 8),
                    wingShellMaterial
                );
                rightShell.scale.set(0.6, 0.5, 1.2);
                rightShell.position.set(0.045, 0.02, 0);
                beetleGroup.add(leftShell);
                beetleGroup.add(rightShell);
                
                // Head
                const beetleHead = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05, 8, 8),
                    new THREE.MeshStandardMaterial({ color: 0x110000 })
                );
                beetleHead.position.set(0, 0, 0.12);
                beetleGroup.add(beetleHead);
                
                // Position beetle in swarm
                const angle = (i / 12) * Math.PI * 2;
                const radius = 0.15 + (i % 3) * 0.12;
                const height = Math.sin((i / 12) * Math.PI * 4) * 0.15;
                beetleGroup.position.set(
                    Math.cos(angle) * radius,
                    height,
                    Math.sin(angle) * radius
                );
                beetleGroup.rotation.y = angle + Math.PI / 2;
                
                body.add(beetleGroup);
            }
            
            monsterGroup.position.y = 0.4;
            speed = 0.35;
            moveChance = 0.85;
            break;
        }
            
        case MONSTER_TYPES.SHADOW: {
            // Living Shadow - dark, shifting form
            body = new THREE.Group();
            
            const shadowMaterial = new THREE.MeshStandardMaterial({
                color: 0x0a0a0a,
                transparent: true,
                opacity: 0.8,
                emissive: 0x110033,
                emissiveIntensity: 0.4
            });
            
            // Main shadowy mass
            const shadowBody = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 12, 12),
                shadowMaterial
            );
            shadowBody.scale.set(1, 1.5, 1);
            body.add(shadowBody);
            
            // Wispy tendrils
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const tendrilSegments = 4;
                
                for (let j = 0; j < tendrilSegments; j++) {
                    const tendril = new THREE.Mesh(
                        new THREE.SphereGeometry(0.08 - j * 0.015, 8, 8),
                        new THREE.MeshStandardMaterial({
                            color: 0x1a1a2a,
                            transparent: true,
                            opacity: 0.6 - j * 0.1,
                            emissive: 0x220044,
                            emissiveIntensity: 0.3
                        })
                    );
                    tendril.position.set(
                        Math.cos(angle) * (0.3 + j * 0.15),
                        -0.2 - j * 0.1,
                        Math.sin(angle) * (0.3 + j * 0.15)
                    );
                    tendril.scale.set(1, 0.5, 1);
                    body.add(tendril);
                }
            }
            
            // Glowing eyes in the darkness
            const shadowEyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const shadowEyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 1.2
            });
            const shadowLeftEye = new THREE.Mesh(shadowEyeGeometry, shadowEyeMaterial);
            shadowLeftEye.position.set(-0.1, 0.15, 0.3);
            const shadowRightEye = new THREE.Mesh(shadowEyeGeometry, shadowEyeMaterial);
            shadowRightEye.position.set(0.1, 0.15, 0.3);
            body.add(shadowLeftEye);
            body.add(shadowRightEye);
            
            // Particle-like shadow fragments
            for (let i = 0; i < 15; i++) {
                const fragment = new THREE.Mesh(
                    new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 4, 4),
                    new THREE.MeshStandardMaterial({
                        color: 0x000000,
                        transparent: true,
                        opacity: 0.5,
                        emissive: 0x110022,
                        emissiveIntensity: 0.2
                    })
                );
                fragment.position.set(
                    (Math.random() - 0.5) * 0.8,
                    (Math.random() - 0.5) * 1.0,
                    (Math.random() - 0.5) * 0.8
                );
                body.add(fragment);
            }
            
            monsterGroup.position.y = 0.8;
            speed = 0.45;
            moveChance = 0.7;
            break;
        }

        case MONSTER_TYPES.CULTIST: {
            // Cultist - robed figure with hood and torch
            body = new THREE.Group();
            
            // Robe body
            const robe = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.35, 1.1, 10),
                new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.9 })
            );
            robe.position.y = 0.15;
            body.add(robe);
            
            // Head/Hood
            const hood = new THREE.Mesh(
                new THREE.ConeGeometry(0.28, 0.5, 10),
                new THREE.MeshStandardMaterial({ color: 0x220000, roughness: 0.9 })
            );
            hood.position.y = 0.9;
            body.add(hood);
            
            // Dark face inside hood
            const face = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            face.position.set(0, 0.8, 0.1);
            body.add(face);
            
            // Glowing eyes
            const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff00ff, 
                emissive: 0xff00ff, 
                emissiveIntensity: 1.0 
            });
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.06, 0.82, 0.22);
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.06, 0.82, 0.22);
            body.add(leftEye);
            body.add(rightEye);
            
            // Arms
            const armMaterial = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.9 });
            const leftArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.07, 0.5, 8),
                armMaterial
            );
            leftArm.position.set(-0.35, 0.3, 0);
            leftArm.rotation.z = Math.PI / 6;
            body.add(leftArm);
            
            const rightArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.07, 0.5, 8),
                armMaterial
            );
            rightArm.position.set(0.35, 0.3, 0);
            rightArm.rotation.z = -Math.PI / 6;
            body.add(rightArm);
            
            // Torch in right hand
            const torchGroup = createTorch();
            torchGroup.position.set(0.45, 0.05, 0.1);
            torchGroup.rotation.x = Math.PI / 6;
            body.add(torchGroup);
            
            monsterGroup.position.y = 0.6;
            speed = 0.35;
            moveChance = 0.6;
            break;
        }

        case MONSTER_TYPES.MINER: {
            // Undead Miner - ragged clothes, helmet, pickaxe, torch
            body = new THREE.Group();
            
            // Torso
            const minerBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.3, 1.0, 8),
                new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.9 })
            );
            minerBody.position.y = 0.1;
            body.add(minerBody);
            
            // Head
            const minerHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x889988, roughness: 0.8 }) // Pale skin
            );
            minerHead.position.y = 0.8;
            body.add(minerHead);
            
            // Helmet
            const helmet = new THREE.Mesh(
                new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.6 })
            );
            helmet.position.y = 0.85;
            body.add(helmet);
            
            // Eyes (hollow)
            const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.08, 0.82, 0.18);
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.08, 0.82, 0.18);
            body.add(leftEye);
            body.add(rightEye);
            
            // Arms
            const armMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.9 });
            const leftArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8),
                armMaterial
            );
            leftArm.position.set(-0.35, 0.3, 0);
            leftArm.rotation.z = Math.PI / 6;
            body.add(leftArm);
            
            const rightArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8),
                armMaterial
            );
            rightArm.position.set(0.35, 0.3, 0);
            rightArm.rotation.z = -Math.PI / 6;
            body.add(rightArm);
            
            // Pickaxe in right hand
            const pickaxeGroup = new THREE.Group();
            const handle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6),
                new THREE.MeshStandardMaterial({ color: 0x553311 })
            );
            pickaxeGroup.add(handle);
            
            const head = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.05, 0.05),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
            );
            head.position.y = 0.35;
            // Curve the head slightly
            const leftTip = new THREE.Mesh(
                new THREE.ConeGeometry(0.04, 0.2, 6),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
            );
            leftTip.position.set(-0.3, 0.3, 0);
            leftTip.rotation.z = Math.PI / 4;
            const rightTip = new THREE.Mesh(
                new THREE.ConeGeometry(0.04, 0.2, 6),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
            );
            rightTip.position.set(0.3, 0.3, 0);
            rightTip.rotation.z = -Math.PI / 4;
            
            pickaxeGroup.add(head);
            pickaxeGroup.add(leftTip);
            pickaxeGroup.add(rightTip);
            
            pickaxeGroup.position.set(0.45, 0.05, 0.1);
            pickaxeGroup.rotation.x = Math.PI / 2;
            pickaxeGroup.rotation.z = -Math.PI / 4;
            body.add(pickaxeGroup);
            
            // Torch in left hand
            const torchGroup = createTorch();
            torchGroup.position.set(-0.45, 0.05, 0.1);
            torchGroup.rotation.x = Math.PI / 6;
            body.add(torchGroup);
            
            monsterGroup.position.y = 0.6;
            speed = 0.3;
            moveChance = 0.5;
            break;
        }
    }
    
    // Enable shadows for monsters (except translucent ones)
    if (type !== MONSTER_TYPES.JELLY && type !== MONSTER_TYPES.GHOST && type !== MONSTER_TYPES.WRAITH && type !== MONSTER_TYPES.CUBE) {
        if (body) {
            body.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }
        monsterGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    } else {
        // Ensure translucent monsters don't cast shadows
        if (body) {
            body.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = false;
                }
            });
        }
    }

    monsterGroup.add(body);
    
    if (!monsterGroup.position.y) {
        monsterGroup.position.y = 0.75;
    }
    monsterGroup.position.x = gridX * cellSize + cellSize / 2;
    monsterGroup.position.z = gridY * cellSize + cellSize / 2;
    
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

// Update monster AI and movement
function updateMonsters(deltaTime) {
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
            monster.mesh.position.lerpVectors(
                monster.position,
                monster.targetPosition,
                easedT
            );
            
            // Bob up and down while moving
            monster.mesh.position.y = 0.75 + Math.sin(easedT * Math.PI) * 0.2;
        } else {
            // Type-specific idle animation
            const time = Date.now() * 0.002 + monster.gridX;
            switch(monster.type) {
                case MONSTER_TYPES.JELLY:
                    monster.mesh.position.y = 0.75 + Math.sin(time * 2) * 0.15;
                    monster.body.scale.y = 0.8 + Math.sin(time * 2) * 0.1;
                    break;
                case MONSTER_TYPES.GHOST:
                    monster.mesh.position.y = 1.2 + Math.sin(time) * 0.2;
                    break;
                case MONSTER_TYPES.SPIDER:
                    monster.mesh.position.y = 0.3 + Math.sin(time * 3) * 0.05;
                    break;
                case MONSTER_TYPES.RAT:
                    monster.mesh.position.y = 0.25 + Math.sin(time * 4) * 0.05;
                    break;
                case MONSTER_TYPES.PLANT:
                    // Plant sways
                    monster.body.rotation.z = Math.sin(time) * 0.1;
                    break;
                case MONSTER_TYPES.BAT:
                    monster.mesh.position.y = 1.5 + Math.sin(time * 3) * 0.3;
                    break;
                case MONSTER_TYPES.SALAMANDER:
                    monster.mesh.position.y = 0.3 + Math.sin(time * 2) * 0.05;
                    break;
                case MONSTER_TYPES.CUBE:
                    monster.mesh.position.y = 0.75 + Math.sin(time) * 0.1;
                    monster.body.rotation.y += 0.01;
                    break;
                case MONSTER_TYPES.WRAITH:
                    monster.mesh.position.y = 1.3 + Math.sin(time) * 0.25;
                    break;
                case MONSTER_TYPES.MIMIC:
                    // Mimic stays still unless close to player
                    monster.mesh.position.y = 0.3;
                    break;
                default:
                    monster.mesh.position.y = 0.75 + Math.sin(time) * 0.1;
            }
        }
        
        // Rotate body slowly (except for some types)
        if (monster.type !== MONSTER_TYPES.PLANT && monster.type !== MONSTER_TYPES.RAT) {
            monster.body.rotation.y += deltaTime * 0.5;
        }
        
        // AI decision making
        if (!monster.animating) {
            monster.timeSinceLastMove += deltaTime;
            
            if (monster.timeSinceLastMove >= monster.nextMoveTime) {
                monster.timeSinceLastMove = 0;
                
                // Check distance to player
                const playerGridX = Math.floor(game.player.position.x / game.dungeon.cellSize);
                const playerGridZ = Math.floor(game.player.position.z / game.dungeon.cellSize);
                const distToPlayer = Math.abs(monster.gridX - playerGridX) + Math.abs(monster.gridY - playerGridZ);
                
                // If player is dead, lose aggro
                if (game.player.health <= 0) {
                    monster.isAggro = false;
                }
                // Chance to become aggro if close
                else if (!monster.isAggro && distToPlayer <= 5) {
                    // 20% chance to notice player each move cycle if close
                    if (Math.random() < 0.2) monster.isAggro = true;
                }
                
                // Set next move time based on aggro state (faster if aggro)
                monster.nextMoveTime = monster.isAggro ? (Math.random() * 1 + 0.5) : (Math.random() * 4 + 2);
                
                // Try to attack player if adjacent
                if (game.player.health > 0 && monsterAttackPlayer(monster)) {
                    // Attack successful, don't move
                    continue;
                }
                
                if (monster.isAggro) {
                    // Move towards player
                    const dx = playerGridX - monster.gridX;
                    const dy = playerGridZ - monster.gridY;
                    
                    // Determine best direction
                    let bestFacing = -1;
                    
                    if (Math.abs(dx) > Math.abs(dy)) {
                        // Try horizontal first
                        if (dx > 0) bestFacing = 1; // East
                        else bestFacing = 3; // West
                    } else {
                        // Try vertical first
                        if (dy > 0) bestFacing = 2; // South
                        else bestFacing = 0; // North
                    }
                    
                    monster.facing = bestFacing;
                    if (!tryMoveMonster(monster)) {
                        // If blocked, try the other axis
                         if (Math.abs(dx) > Math.abs(dy)) {
                            // Was horizontal, try vertical
                            if (dy > 0) monster.facing = 2;
                            else monster.facing = 0;
                        } else {
                            // Was vertical, try horizontal
                            if (dx > 0) monster.facing = 1;
                            else monster.facing = 3;
                        }
                        tryMoveMonster(monster);
                    }
                } else {
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
}

// Try to move monster forward
function tryMoveMonster(monster) {
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

        // Check if player is in the target grid cell
        const playerGridX = Math.floor(game.player.position.x / cellSize);
        const playerGridZ = Math.floor(game.player.position.z / cellSize);
        
        if (newGridX === playerGridX && newGridY === playerGridZ) {
            // Player is in the way, don't move
            return false;
        }
        
        // Check if another monster is already in the target position
        for (let otherMonster of game.monsters) {
            if (otherMonster !== monster && 
                otherMonster.gridX === newGridX && 
                otherMonster.gridY === newGridY) {
                // Another monster is in the way
                return false;
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

// Spawn glow worms
function spawnGlowWorms() {
    const cellSize = game.dungeon.cellSize;
    const numWorms = 5 + Math.floor(Math.random() * 5); // Reduced to 5-10
    
    for (let i = 0; i < numWorms; i++) {
        // Find random empty spot
        let x, y;
        let attempts = 0;
        do {
            x = Math.floor(Math.random() * game.dungeon.width);
            y = Math.floor(Math.random() * game.dungeon.height);
            attempts++;
        } while (dungeonMap[y][x] !== 0 && attempts < 100);
        
        if (dungeonMap[y][x] === 0) {
            createGlowWorm(x, y);
        }
    }
}

// Create a single glow worm
function createGlowWorm(gridX, gridY) {
    const cellSize = game.dungeon.cellSize;
    const wormGroup = new THREE.Group();
    
    const bodyColor = 0xccff00; // Yellow-green
    
    // 1. Core bright sphere (white hot center)
    const coreGeom = new THREE.SphereGeometry(0.025, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    wormGroup.add(core);
    
    // 2. Inner Halo (colored)
    const haloGeom = new THREE.SphereGeometry(0.05, 8, 8);
    const haloMat = new THREE.MeshBasicMaterial({
        color: bodyColor,
        transparent: true,
        opacity: 0.6
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    wormGroup.add(halo);
    
    // 3. Outer Halo (faint)
    const outerHaloGeom = new THREE.SphereGeometry(0.1, 8, 8);
    const outerHaloMat = new THREE.MeshBasicMaterial({
        color: bodyColor,
        transparent: true,
        opacity: 0.2
    });
    const outerHalo = new THREE.Mesh(outerHaloGeom, outerHaloMat);
    wormGroup.add(outerHalo);
    
    // 4. Strong Light to illuminate surroundings
    // Increased intensity (2.5) and range (8.0)
    const light = new THREE.PointLight(bodyColor, 2.5, 8);
    light.castShadow = true;
    light.shadow.mapSize.width = 256;
    light.shadow.mapSize.height = 256;
    light.shadow.bias = -0.001;
    wormGroup.add(light);
    
    wormGroup.position.x = gridX * cellSize + cellSize / 2;
    wormGroup.position.z = gridY * cellSize + cellSize / 2;
    wormGroup.position.y = 1.5 + Math.random(); // Flying height
    
    game.scene.add(wormGroup);
    
    const worm = {
        mesh: wormGroup,
        gridX: gridX,
        gridY: gridY,
        position: wormGroup.position.clone(),
        targetPosition: wormGroup.position.clone(),
        facing: Math.floor(Math.random() * 4),
        animating: false,
        animationProgress: 0,
        nextMoveTime: Math.random() * 1 + 0.5, // Move more often
        timeSinceLastMove: 0,
        speed: 0.15, // Faster movement (lower duration)
        moveChance: 0.8, // Move more frequently
        flightOffset: Math.random() * 100 // Random offset for flight bobbing
    };
    
    game.critters.push(worm);
}

// Update critters (glow worms)
function updateCritters(deltaTime) {
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
function tryMoveCritter(critter) {
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

// Setup player controls
function setupControls() {
    // Keyboard controls - discrete movement
    document.addEventListener('keydown', (e) => {
        // Handle intro screen
        if (!game.started) {
            game.started = true;
            const introScreen = document.getElementById('intro-screen');
            if (introScreen) {
                introScreen.style.display = 'none';
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }

        if (!game.player.canMove) return;
        
        switch(e.code) {
            case 'ArrowUp':
                e.preventDefault();
                movePlayerForward();
                break;
            case 'ArrowDown':
                e.preventDefault();
                movePlayerBackward();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                rotatePlayer(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                rotatePlayer(1);
                break;
            case 'Space':
                e.preventDefault();
                waitTurn();
                break;
            case 'KeyA':
                e.preventDefault();
                playerAttack();
                break;
            case 'KeyE':
                e.preventDefault();
                interactWithDoor();
                break;
        }
    });
    
    // Alt key for showing descriptions
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Alt') {
            e.preventDefault();
            game.controls.altPressed = true;
            showDescriptions();
        }
        if (e.key === 'Shift') {
            e.preventDefault();
            game.controls.shiftPressed = true;
            updateDebugArrows();
        }
        if (e.key === 'd' || e.key === 'D') {
            game.controls.debugMode = !game.controls.debugMode;
            const debugWindow = document.getElementById('debug-window');
            if (debugWindow) {
                debugWindow.style.display = game.controls.debugMode ? 'block' : 'none';
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            e.preventDefault();
            game.controls.altPressed = false;
            hideDescriptions();
        }
        if (e.key === 'Shift') {
            e.preventDefault();
            game.controls.shiftPressed = false;
            updateDebugArrows();
        }
    });
}

// Update debug arrow visibility
function updateDebugArrows() {
    for (let decoration of game.decorations) {
        if (decoration.debugArrow) {
            decoration.debugArrow.visible = game.controls.shiftPressed;
        }
    }
}

// Move player forward one grid square
// Interact with nearby door (open/close)
function interactWithDoor() {
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

// Toggle ambient and player lights
// Light a new torch
// Advance game turn and update torch status
function advanceTurn() {
    if (!game.player.torch) return;
    
    game.player.torch.turnsActive++;
    const t = game.player.torch;
    
    // Constants for full brightness
    const MAX_INTENSITY = 2.0;
    const MAX_RANGE = 18;
    
    if (t.turnsActive > t.maxTurns) {
        // Calculate how far into the fade we are (0.0 to 1.0)
        const fadeProgress = (t.turnsActive - t.maxTurns) / t.fadeTurns;
        
        if (fadeProgress >= 1.0) {
            // Torch burned out completely
            if (game.player.light.visible) {
                t.intensityBase = 0;
                t.rangeBase = 0;
                game.player.light.visible = false;
                logMessage('Your torch has burned out!', 'torch');
            }
        } else {
            // Gradual fading
            // Intensity goes from MAX to 0
            t.intensityBase = MAX_INTENSITY * (1.0 - fadeProgress);
            
            // Range goes from MAX to 5 (not 0, so you can still see a little bit until it dies)
            t.rangeBase = 5 + (MAX_RANGE - 5) * (1.0 - fadeProgress);
            
            // Color shifts from Orange (ffaa00) to Red (ff0000)
            const r = 1.0;
            const g = 0.66 * (1.0 - fadeProgress); // 0.66 is approx 0xaa / 0xff
            const b = 0;
            
            t.color.setRGB(r, g, b);
            game.player.light.color.copy(t.color);
            
            // Notify user when fading starts
            if (t.turnsActive === t.maxTurns + 1) {
                logMessage('Your torch is flickering and fading...', 'torch');
            }
        }
    }
}

function movePlayerForward() {
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
function movePlayerBackward() {
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
function rotatePlayer(direction) {
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
function waitTurn() {
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
function playerAttack() {
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

// Monster tries to attack player if adjacent
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
            logMessage(`The ${monster.type} hits you for ${monster.attackPower} damage!`, 'player-hit');
            
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

// Log a message to the screen
function logMessage(text, type = 'normal') {
    const logElement = document.getElementById('message-log');
    if (!logElement) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = text;
    
    logElement.appendChild(entry);
    
    // Remove old messages if too many
    while (logElement.children.length > 8) {
        logElement.removeChild(logElement.firstChild);
    }
}

// Update health display
function updateHealthDisplay() {
    const healthElement = document.getElementById('health');
    if (healthElement) {
        const healthPercent = (game.player.health / game.player.maxHealth) * 100;
        healthElement.textContent = `Health: ${game.player.health}/${game.player.maxHealth}`;
        
        // Color based on health
        if (healthPercent > 60) {
            healthElement.style.color = '#0f0';
        } else if (healthPercent > 30) {
            healthElement.style.color = '#ff0';
        } else {
            healthElement.style.color = '#f00';
        }
    }
}

// Game over
function gameOver() {
    const gameOverElement = document.getElementById('game-over');
    if (gameOverElement) {
        gameOverElement.style.display = 'block';
    }
    game.player.canMove = false;
}

// Check collision with walls and monsters
function checkCollision(position) {
    const playerRadius = 0.3;
    
    // Check wall collisions
    for (let wall of game.dungeon.walls) {
        const dx = position.x - wall.position.x;
        const dz = position.z - wall.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const minDistance = wall.size / 2 + playerRadius;
        
        if (Math.abs(dx) < minDistance && Math.abs(dz) < minDistance) {
            return 'wall';
        }
    }
    
    // Check door collisions (only if door is closed)
    const cellSize = game.dungeon.cellSize;
    const playerGridX = Math.floor(position.x / cellSize);
    const playerGridZ = Math.floor(position.z / cellSize);
    
    for (let door of game.doors) {
        if (!door.isOpen && door.gridX === playerGridX && door.gridY === playerGridZ) {
            return 'door';
        }
    }
    
    // Check monster collisions
    for (let monster of game.monsters) {
        // Check if player is trying to move into the same grid cell as a monster
        if (playerGridX === monster.gridX && playerGridZ === monster.gridY) {
            return 'monster';
        }
        
        // Also check actual distance for smoother collision
        const dx = position.x - monster.mesh.position.x;
        const dz = position.z - monster.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const minDistance = 0.8; // Monster collision radius
        
        if (distance < minDistance) {
            return 'monster';
        }
    }
    
    return null;
}

// Update player movement
function updatePlayer(deltaTime) {
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
        const wobbleX = Math.sin(time * 1.5) * 0.05;
        const wobbleY = Math.cos(time * 2.3) * 0.05;
        const wobbleZ = Math.sin(time * 3.7) * 0.05;
        
        game.player.light.position.copy(game.player.position);
        game.player.light.position.x += wobbleX;
        game.player.light.position.y += wobbleY;
        game.player.light.position.z += wobbleZ;
    } else if (game.player.light) {
        game.player.light.position.copy(game.player.position);
    }

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

// Handle window resize
function onWindowResize() {
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = game.clock.getDelta();
    
    updatePlayer(deltaTime);
    updateMonsters(deltaTime);
    updateCritters(deltaTime);
    updateTreasures(deltaTime);
    updateDecorations();
    updateFloatingLabels();
    updateDebugWindow();
    
    game.renderer.render(game.scene, game.camera);
}

// Start the game
init();
