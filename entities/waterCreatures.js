import { game, dungeonMap } from '../state.js';

const creatures = [];
game.waterCreatures = creatures;

export function clearWaterCreatures() {
    creatures.forEach(c => game.scene.remove(c.mesh));
    creatures.length = 0;
}

export function spawnWaterCreatures() {
    // Clear existing creatures
    clearWaterCreatures();

    const cellSize = game.dungeon.cellSize;

    for (let y = 0; y < game.dungeon.height; y++) {
        for (let x = 0; x < game.dungeon.width; x++) {
            if (dungeonMap[y][x] === 2) {
                // Chance for Fish (Shadows)
                if (Math.random() < 0.4) {
                    spawnFish(x, y, cellSize);
                }
                // Chance for Jellyfish (Fluorescent)
                if (Math.random() < 0.15) {
                    spawnJellyfish(x, y, cellSize);
                }
                // Chance for Algae (Bioluminescent)
                if (Math.random() < 0.3) {
                    spawnAlgae(x, y, cellSize);
                }
            }
        }
    }
}

function spawnFish(gx, gy, cellSize) {
    // Simple dark oval shadow
    const geometry = new THREE.CircleGeometry(0.15, 8);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0.7, // Increased opacity
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Random position within cell
    const wx = gx * cellSize + Math.random() * cellSize;
    const wz = gy * cellSize + Math.random() * cellSize;
    
    mesh.position.set(wx, 0.15, wz); // Just below water surface (0.2)
    mesh.rotation.x = -Math.PI / 2; // Flat
    mesh.scale.set(1.5, 0.6, 1); // Elongate to look like a fish
    
    game.scene.add(mesh);
    
    creatures.push({
        type: 'fish',
        mesh: mesh,
        velocity: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(0.015),
        changeDirTimer: Math.random() * 100
    });
}

function spawnAlgae(gx, gy, cellSize) {
    // Create a cluster of glowing particles
    const numParticles = 3 + Math.floor(Math.random() * 5);
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for(let i=0; i<numParticles; i++) {
        // Random offset within cell
        const ox = (Math.random() - 0.5) * cellSize * 0.8;
        const oz = (Math.random() - 0.5) * cellSize * 0.8;
        positions.push(ox, 0, oz);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0x00ffaa,
        size: 0.05,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const points = new THREE.Points(geometry, material);
    
    const wx = gx * cellSize + cellSize / 2;
    const wz = gy * cellSize + cellSize / 2;
    
    points.position.set(wx, 0.21, wz); // Just above water surface
    
    game.scene.add(points);
    
    creatures.push({
        type: 'algae',
        mesh: points,
        timeOffset: Math.random() * 100
    });
}

function spawnJellyfish(gx, gy, cellSize) {
    // Glowing sphere
    const geometry = new THREE.SphereGeometry(0.12, 8, 6);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x88ffff, 
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        transparent: true, 
        opacity: 0.6,
        roughness: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const wx = gx * cellSize + Math.random() * cellSize;
    const wz = gy * cellSize + Math.random() * cellSize;
    
    mesh.position.set(wx, 0.15, wz);
    
    game.scene.add(mesh);
    
    creatures.push({
        type: 'jellyfish',
        mesh: mesh,
        baseY: 0.15,
        offset: Math.random() * Math.PI * 2,
        velocity: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(0.003)
    });
}

export function updateWaterCreatures(deltaTime) {
    const cellSize = game.dungeon.cellSize;
    const time = Date.now() * 0.001;
    const playerPos = game.player.position;
    const cullDistSq = 25 * 25; // Cull lights beyond 25 units

    creatures.forEach(c => {
        if (c.type === 'fish') {
            // Move
            c.mesh.position.add(c.velocity);
            
            // Rotate to face direction
            const angle = Math.atan2(c.velocity.z, c.velocity.x);
            c.mesh.rotation.z = angle; 

            // Change direction randomly
            c.changeDirTimer--;
            if (c.changeDirTimer <= 0) {
                const speed = 0.01 + Math.random() * 0.01;
                c.velocity.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(speed);
                c.changeDirTimer = Math.random() * 200 + 50;
            }
            
            // Check bounds
            const gx = Math.floor(c.mesh.position.x / cellSize);
            const gy = Math.floor(c.mesh.position.z / cellSize);
            
            if (gx < 0 || gx >= game.dungeon.width || gy < 0 || gy >= game.dungeon.height || dungeonMap[gy][gx] !== 2) {
                c.velocity.negate();
                c.mesh.position.add(c.velocity);
                c.mesh.position.add(c.velocity);
                c.changeDirTimer = 50; // Don't change immediately again
            }
        } else if (c.type === 'jellyfish') {
            // Bobbing
            c.mesh.position.y = c.baseY + Math.sin(time * 1.5 + c.offset) * 0.05;
            
            // Drift
            c.mesh.position.add(c.velocity);
            
            // Bounds
            const gx = Math.floor(c.mesh.position.x / cellSize);
            const gy = Math.floor(c.mesh.position.z / cellSize);
            
            if (gx < 0 || gx >= game.dungeon.width || gy < 0 || gy >= game.dungeon.height || dungeonMap[gy][gx] !== 2) {
                c.velocity.negate();
                c.mesh.position.add(c.velocity);
            }
        } else if (c.type === 'algae') {
            // Twinkle effect
            const brightness = 0.4 + Math.sin(time * 2 + c.timeOffset) * 0.2;
            c.mesh.material.opacity = brightness;
        }
    });
}
