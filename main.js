import { game, dungeonMap } from './state.js';
import { generateDungeon, generateProceduralMap } from './dungeon.js';
import { setupControls } from './input.js';
import { updatePlayer } from './player.js';
import { updateMonsters } from './entities/monster.js';
import { updateCritters, updateDecorations } from './entities/decoration.js';
import { updateWaterCreatures } from './entities/waterCreatures.js';
import { updateTreasures } from './entities/items.js';
import { updateFloatingLabels, updateDebugWindow, updateHealthDisplay, updateWealthDisplay, updateMap, initSettings } from './ui.js';
import { setupLevel, updateSceneLights } from './gameLoop.js';

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
    game.scene.add(game.camera); // Add camera to scene

    // Create renderer
    game.renderer = new THREE.WebGLRenderer({ antialias: true });
    game.renderer.setSize(window.innerWidth, window.innerHeight);
    game.renderer.shadowMap.enabled = true;
    game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Enable tone mapping for eye adaptation simulation
    game.renderer.toneMapping = THREE.ReinhardToneMapping;
    game.renderer.toneMappingExposure = 1.0;

    document.body.appendChild(game.renderer.domElement);
    
    // Initialize settings UI
    initSettings();
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x000000, 0.0);
    game.scene.add(ambientLight);
    game.ambientLight = ambientLight; 
    
    // Player light (torch effect)
    const playerLight = new THREE.PointLight(0xffaa00, 2.0, 18);
    playerLight.position.set(0.3, -0.1, -0.2); 
    playerLight.castShadow = true;
    playerLight.shadow.bias = -0.0005;
    playerLight.shadow.mapSize.width = 2048;
    playerLight.shadow.mapSize.height = 2048;
    playerLight.shadow.camera.near = 0.1;
    game.camera.add(playerLight);
    game.player.light = playerLight;
    
    // Torch flicker properties
    game.player.torch = {
        intensityBase: 2.0,
        intensityVar: 0.3,
        rangeBase: 18,
        rangeVar: 1.0,
        timeOffset: Math.random() * 100,
        turnsActive: 0,
        maxTurns: 70,
        fadeTurns: 30,
        color: new THREE.Color(0xffaa00)
    };
    
    // Reset level to 5
    game.dungeon.level = 5;
    
    // Generate initial dungeon
    generateProceduralMap();
    generateDungeon();

    setupLevel();
    
    // Setup controls
    setupControls();
    
    // Initialize UI
    updateHealthDisplay();
    updateWealthDisplay();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start game loop
    // game.started = true; // Removed to allow intro screen to work
    animate();
}

function onWindowResize() {
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = game.clock.getDelta();
    
    if (game.started && !game.paused) {
        updatePlayer(deltaTime);
        updateMonsters(deltaTime);
        updateCritters(deltaTime);
        updateWaterCreatures(deltaTime);
        updateTreasures(deltaTime);
        updateDecorations();
        updateSceneLights();
        updateFloatingLabels();
        updateDebugWindow();
        updateMap();

        // Simulate eye adaptation
        if (!game.exposureSettings || game.exposureSettings.auto) {
            // If the environment is dark (torch low/off), increase exposure to see faint lights
            // If the environment is bright (torch on), decrease exposure to normal
            const torchIntensity = (game.player.light && game.player.light.visible) ? (game.player.torch.intensityBase || 0) : 0;
            
            // Target exposure: 1.0 when torch is bright (2.0), 3.0 when torch is out (0.0)
            // Clamp torch intensity to 0-2 range for calculation
            const clampedIntensity = Math.max(0, Math.min(2.0, torchIntensity));
            const targetExposure = 3.0 - clampedIntensity;
            
            // Smoothly interpolate current exposure to target
            const adaptationSpeed = 2.0; // Speed of eye adjustment
            game.renderer.toneMappingExposure = THREE.MathUtils.lerp(
                game.renderer.toneMappingExposure, 
                targetExposure, 
                deltaTime * adaptationSpeed
            );
        } else {
            // Manual exposure
            game.renderer.toneMappingExposure = game.exposureSettings.level;
        }
    }
    
    game.renderer.render(game.scene, game.camera);
}

init();
