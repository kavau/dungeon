// Game state
export const game = {
    started: false,
    paused: false,
    won: false,
    showingLevelScreen: false,
    cheatMode: false,
    isTransitioning: false,
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
        attackPower: 20,
        hasAmulet: false,
        amuletActive: false
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
        width: 30,
        height: 30,
        cellSize: 4,
        walls: [],
        wallMeshes: [],
        level: 5
    },
    doors: [],
    monsters: [],
    critters: [],
    treasures: [],
    decorations: [],
    
    // Journal State
    journal: {
        collectedPages: [] // Array of IDs
    },

    wealth: 0,
    clock: new THREE.Clock(),
    raycaster: new THREE.Raycaster()
};

// Dungeon map (0 = walkable, 1 = wall)
// Initialize with 40x40 walls
export let dungeonMap = Array(40).fill().map(() => Array(40).fill(1));
