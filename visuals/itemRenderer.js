export function createTreasureVisuals(type) {
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

        case 'amulet':
            // The Strange Amulet - pulsating purple gem on a chain
            
            // Chain (Torus)
            const chain = new THREE.Mesh(
                new THREE.TorusGeometry(0.2, 0.02, 8, 16),
                new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.4 })
            );
            // chain.rotation.x = Math.PI / 2; // Using default orientation relative to group
            treasureGroup.add(chain);
            
            // Amulet Setting
            const setting = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8),
                new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 1.0, roughness: 0.3 })
            );
            setting.rotation.x = Math.PI / 2;
            setting.position.y = -0.2; // Hanging down
            treasureGroup.add(setting);
            
            // The Gem
            const amuletGem = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.08, 0),
                new THREE.MeshStandardMaterial({ 
                    color: 0x9933ff, 
                    emissive: 0x9933ff,
                    emissiveIntensity: 0.8,
                    metalness: 0.9,
                    roughness: 0.1
                })
            );
            amuletGem.rotation.x = Math.PI / 2;
            amuletGem.position.y = -0.2;
            amuletGem.position.z = 0.03;
            amuletGem.scale.set(1, 0.5, 1);
            treasureGroup.add(amuletGem);
            
            // Corruption particles/glow (PointLight)
            const amuletLight = new THREE.PointLight(0x9933ff, 1.0, 3);
            amuletLight.position.y = -0.2;
            amuletLight.position.z = 0.1;
            treasureGroup.add(amuletLight);
            
            treasureGroup.userData.isAmulet = true;
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

        case 'journal_page':
            // Parchment page
            const pageGeom = new THREE.PlaneGeometry(0.5, 0.7);
            
            // Create parchment texture dynamically
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            
            // Background
            ctx.fillStyle = '#fcf5e5';
            ctx.fillRect(0, 0, 128, 128);
            
            // Text lines - "scribbles"
            ctx.fillStyle = '#654321';
            for(let i=10; i<120; i+=10) {
                // Irregular lines
                ctx.beginPath();
                ctx.moveTo(10, i);
                ctx.lineTo(110 + (Math.random()-0.5)*10, i);
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            const pageTex = new THREE.CanvasTexture(canvas);
            
            const pageMat = new THREE.MeshStandardMaterial({ 
                map: pageTex,
                side: THREE.DoubleSide,
                roughness: 0.9,
                color: 0xffffff
            });
            
            const pageMesh = new THREE.Mesh(pageGeom, pageMat);
            
            // Orient somewhat flat but tilted
            pageMesh.rotation.x = -Math.PI / 2 + 0.2; 
            treasureGroup.add(pageMesh);
            break;
    }
    
    // Enable shadows for treasures
    // User requested Gems to cast shadows, so enabled for all
    treasureGroup.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return treasureGroup;
}

// Update treasures (animation and pickup)
export function updateTreasures(deltaTime) {
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
export function collectTreasure(treasure, index) {
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
export function spawnTreasures() {
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
                // Weighted random selection based on level
                const rand = Math.random();
                let treasureType;
                const level = game.dungeon.level || 1;

                // Default probabilities (Level 1)
                let pChest = 0.15;
                let pCoin = 0.50; // Cumulative (0.15 + 0.35)
                let pTrinket = 0.75; // Cumulative (0.50 + 0.25)
                // Remainder is Gem

                switch(level) {
                    case 2: // Sewers - More junk, less gold
                        pChest = 0.10;
                        pCoin = 0.30;
                        pTrinket = 0.80;
                        break;
                    case 3: // Temple - High wealth
                        pChest = 0.25;
                        pCoin = 0.60;
                        pTrinket = 0.70;
                        break;
                    case 4: // Catacombs - Ancient trinkets and gems
                        pChest = 0.15;
                        pCoin = 0.35;
                        pTrinket = 0.65;
                        break;
                    case 5: // Caves - Raw gems, less manufactured goods
                        pChest = 0.05;
                        pCoin = 0.20;
                        pTrinket = 0.40;
                        break;
                }

                if (rand < pChest) {
                    treasureType = TREASURE_TYPES.CHEST;
                } else if (rand < pCoin) {
                    treasureType = TREASURE_TYPES.GOLD_COIN;
                } else if (rand < pTrinket) {
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

export function createTorch() {
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
