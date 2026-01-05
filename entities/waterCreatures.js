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

let jellyfishMaterials = null;

function getJellyfishMaterials() {
    if (jellyfishMaterials) return jellyfishMaterials;

    // Custom shader logic for water line
    const onBeforeCompile = (shader) => {
        shader.uniforms.waterLevel = { value: 0.2 };
        
        shader.vertexShader = `
            varying vec3 vPosWorld;
            ${shader.vertexShader}
        `.replace(
            '#include <worldpos_vertex>',
            `
            #include <worldpos_vertex>
            vPosWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
            `
        );

        shader.fragmentShader = `
            varying vec3 vPosWorld;
            uniform float waterLevel;
            ${shader.fragmentShader}
        `.replace(
            '#include <color_fragment>',
            `
            #include <color_fragment>
            
            // Sharp transition at water level
            float isAboveWater = step(waterLevel, vPosWorld.y);
            
            if (isAboveWater < 0.5) {
                // Underwater: Dark Blue tint and reduced opacity
                diffuseColor.rgb *= vec3(0.2, 0.5, 0.8);
                diffuseColor.a *= 0.6;
            }
            `
        ).replace(
            '#include <emissivemap_fragment>',
            `
            #include <emissivemap_fragment>
            // Dim emissive underwater
            if (vPosWorld.y < waterLevel) {
                totalEmissiveRadiance *= 0.2;
            }
            `
        );
    };

    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0x88ffff, 
        emissive: 0x00ffff,
        emissiveIntensity: 0.6,
        transparent: true, 
        opacity: 0.9,
        roughness: 0.2,
        depthWrite: false
    });
    bodyMat.onBeforeCompile = onBeforeCompile;

    // Tentacles use same base color but will be darkened by shader
    const tentacleMat = new THREE.MeshStandardMaterial({ 
        color: 0x88ffff, 
        emissive: 0x00ffff,
        emissiveIntensity: 0.6,
        transparent: true, 
        opacity: 0.9,
        roughness: 0.4,
        depthWrite: false
    });
    tentacleMat.onBeforeCompile = onBeforeCompile;
    
    jellyfishMaterials = { body: bodyMat, tentacles: tentacleMat };
    return jellyfishMaterials;
}

function spawnJellyfish(gx, gy, cellSize) {
    const group = new THREE.Group();
    const materials = getJellyfishMaterials();

    // Jellyfish Bell (Dome shape)
    // thetaLength = 2.2 creates a bell shape (extends slightly past hemisphere)
    const geometry = new THREE.SphereGeometry(0.14, 16, 16, 0, Math.PI * 2, 0, 2.0);
    
    // Scale to squash it slightly vertically but keep it dome-like
    geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 0.7, 1));
    
    // Rotate so opening faces down (default sphere pole is up Y)
    // Actually sphere creates vertices from top (0,r,0) down. 
    // We want the top to be up. theta 0 is top. theta 2.0 is past equator.
    // So it looks like a mushroom cap. Perfect.
    // Origin is at 0,0,0 (center of sphere). The cap sits at the top.
    
    const body = new THREE.Mesh(geometry, materials.body);
    group.add(body);
    
    // Inner organs/Oral arms (Glowy center things)
    const innerGeom = new THREE.CylinderGeometry(0.0, 0.04, 0.15, 8);
    innerGeom.translate(0, -0.05, 0);
    const inner = new THREE.Mesh(innerGeom, materials.body); // Use body mat for glow
    group.add(inner);

    // Tentacles (Marginal tentacles hanging from the rim)
    const tentacles = [];
    const tentacleCount = 8;
    
    // Wavy tentacles with more segments for curvature
    const tentacleGeom = new THREE.CylinderGeometry(0.008, 0.001, 0.45, 4, 12);
    tentacleGeom.translate(0, -0.225, 0); // Pivot at top
    
    // Add static wave shape to geometry
    const pos = tentacleGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const u = Math.abs(y) / 0.45; // 0 (top) to 1 (tip)
        const wave = Math.sin(u * Math.PI * 2.5) * 0.03 * u; // Scale wave by u so top is anchored
        pos.setX(i, pos.getX(i) + wave);
    }
    tentacleGeom.computeVertexNormals();
    
    // Calculate rim radius based on sphere geometry
    // radius = 0.14. At theta = 2.0 rads (approx 114 deg).
    // R_rim = 0.14 * sin(2.0) = 0.14 * 0.9 = ~0.126
    // Y_rim = 0.14 * cos(2.0) = 0.14 * -0.41 = ~-0.057
    // Scaled Y by 0.7 => Y_rim = -0.04
    
    const rimRadius = 0.12;
    const rimY = -0.04;

    for(let i=0; i<tentacleCount; i++) {
        const tentacle = new THREE.Mesh(tentacleGeom, materials.tentacles);
        const angle = (i / tentacleCount) * Math.PI * 2;
        
        tentacle.position.set(
            Math.cos(angle) * rimRadius,
            rimY,
            Math.sin(angle) * rimRadius
        );
        
        // Random initial rotation/phase
        tentacle.rotation.x = (Math.random() - 0.5) * 0.3;
        tentacle.rotation.z = (Math.random() - 0.5) * 0.3;
        
        tentacles.push({
            mesh: tentacle,
            baseRotX: tentacle.rotation.x,
            baseRotZ: tentacle.rotation.z,
            phaseOffset: Math.random() * Math.PI * 2
        });
        
        group.add(tentacle);
    }
    
    const wx = gx * cellSize + Math.random() * cellSize;
    const wz = gy * cellSize + Math.random() * cellSize;
    
    // Higher base position so top sticks out
    // Top of bell is approx +0.1 (0.14 * 0.7)
    // Water level is 0.2
    // We want LowestTop > 0.2
    // Bob amplitude is 0.04
    // If BaseY = 0.18 -> MinY = 0.14 -> Top = 0.24 (> 0.2). Good.
    
    group.position.set(wx, 0.18, wz);
    
    game.scene.add(group);
    
    creatures.push({
        type: 'jellyfish',
        mesh: group,
        tentacles: tentacles,
        baseY: 0.18,
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
            // Irregular Bobbing
            // 1. Constant small surface bobbing
            const smallBob = Math.sin(time * 1.5 + c.offset) * 0.02;
            
            // 2. Occasional deep dive
            // Slow cycle: dips below -0.4 roughly 30% of the time
            const slowCycle = Math.sin(time * 0.25 + c.offset * 1.3);
            const dipFactor = Math.min(0, slowCycle + 0.4); 
            // dipFactor goes from 0 down to -0.6 (when sin is -1)
            const deepDip = dipFactor * 0.35; // Max dip approx -0.21
            
            c.mesh.position.y = c.baseY + smallBob + deepDip;
            
            // Drift
            c.mesh.position.add(c.velocity);
            
            // Animate tentacles
            if (c.tentacles) {
                c.tentacles.forEach(t => {
                    // Waving motion
                    t.mesh.rotation.x = t.baseRotX + Math.sin(time * 3 + t.phaseOffset) * 0.2;
                    t.mesh.rotation.z = t.baseRotZ + Math.cos(time * 2.5 + t.phaseOffset) * 0.2;
                    
                    // Scale pulsing (propulsion look)
                    const pulse = 1.0 + Math.sin(time * 3 + c.offset) * 0.1;
                    t.mesh.scale.y = pulse;
                });
            }
            
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
