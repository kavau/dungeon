// Game state
export const game = {
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
export const dungeonMap = [
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
