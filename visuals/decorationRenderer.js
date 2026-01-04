import { game, dungeonMap } from '../state.js';

export function createDecorationVisuals(type, gridX, gridY) {
    const cellSize = game.dungeon.cellSize;
    const decorationGroup = new THREE.Group();
    decorationGroup.userData.type = 'decoration';
    decorationGroup.userData.decorationType = type.name;
    
    switch (type.name) {
        case 'puddle': {
            // Irregular puddle shape
            const points = [];
            const numPoints = 10 + Math.floor(Math.random() * 6);
            const radius = 0.8 + Math.random() * 0.8;
            
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const r = radius * (0.7 + Math.random() * 0.6);
                points.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
            }
            
            const shape = new THREE.Shape(points);
            const geometry = new THREE.ShapeGeometry(shape);
            
            // Water material with reflection
            const material = new THREE.MeshStandardMaterial({
                color: 0x112233,
                roughness: 0.1,
                metalness: 0.8,
                transparent: true,
                opacity: 0.8
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.02; // Slightly above floor
            
            decorationGroup.add(mesh);
            break;
        }
        
        case 'spider_web': {
            // Create web in corner or between walls
            const size = 1.5 + Math.random();
            const geometry = new THREE.PlaneGeometry(size, size);
            
            // Procedural web texture
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
            ctx.lineWidth = 1;
            
            // Radial lines
            const centerX = 64;
            const centerY = 64;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + Math.cos(angle) * 60, centerY + Math.sin(angle) * 60);
                ctx.stroke();
            }
            
            // Spiral lines
            for (let r = 10; r < 60; r += 10) {
                ctx.beginPath();
                for (let i = 0; i <= 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * (r + (Math.random() - 0.5) * 5);
                    const y = centerY + Math.sin(angle) * (r + (Math.random() - 0.5) * 5);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Random rotation and position
            mesh.rotation.y = Math.random() * Math.PI;
            mesh.rotation.x = Math.random() * 0.5;
            mesh.position.y = 2 + Math.random();
            
            decorationGroup.add(mesh);
            break;
        }
        
        case 'stalactite': {
            // Hanging from ceiling
            const height = 0.5 + Math.random() * 1.5;
            const radius = 0.1 + Math.random() * 0.2;
            const geometry = new THREE.ConeGeometry(radius, height, 6);
            const material = new THREE.MeshStandardMaterial({
                color: 0x555555,
                roughness: 0.8
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = 4 - height / 2; // Ceiling height is 4
            mesh.rotation.x = Math.PI; // Point down
            
            decorationGroup.add(mesh);
            break;
        }
        
        case 'stalagmite': {
            // Rising from floor
            const height = 0.5 + Math.random() * 1.0;
            const radius = 0.1 + Math.random() * 0.2;
            const geometry = new THREE.ConeGeometry(radius, height, 6);
            const material = new THREE.MeshStandardMaterial({
                color: 0x555555,
                roughness: 0.8
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = height / 2;
            
            decorationGroup.add(mesh);
            break;
        }
        
        case 'bone_pile': {
            // Pile of bones
            const numBones = 3 + Math.floor(Math.random() * 5);
            const material = new THREE.MeshStandardMaterial({
                color: 0xdddddd,
                roughness: 0.6
            });
            
            for (let i = 0; i < numBones; i++) {
                const length = 0.3 + Math.random() * 0.3;
                const geometry = new THREE.CylinderGeometry(0.03, 0.03, length, 4);
                const bone = new THREE.Mesh(geometry, material);
                
                bone.position.x = (Math.random() - 0.5) * 0.5;
                bone.position.z = (Math.random() - 0.5) * 0.5;
                bone.position.y = 0.05;
                
                bone.rotation.x = Math.PI / 2;
                bone.rotation.z = Math.random() * Math.PI;
                
                decorationGroup.add(bone);
            }
            
            // Maybe a skull?
            if (Math.random() < 0.3) {
                const skullGeom = new THREE.SphereGeometry(0.1, 8, 8);
                const skull = new THREE.Mesh(skullGeom, material);
                skull.position.y = 0.1;
                decorationGroup.add(skull);
            }
            break;
        }
        
        case 'mushrooms': {
            // Cluster of glowing mushrooms
            const numMushrooms = 3 + Math.floor(Math.random() * 7);
            
            // Add a central light for the cluster
            // Increased distance from 5 to 10 to illuminate further
            const clusterLight = new THREE.PointLight(0x44ff44, 1.5, 10);
            clusterLight.position.set(0, 0.5, 0);
            decorationGroup.add(clusterLight);
            
            // Store reference for culling
            decorationGroup.userData.light = clusterLight;
            
            for (let i = 0; i < numMushrooms; i++) {
                const height = 0.1 + Math.random() * 0.2;
                const capRadius = 0.05 + Math.random() * 0.1;
                
                // Stem
                const stemGeom = new THREE.CylinderGeometry(0.02, 0.03, height, 4);
                const stemMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
                const stem = new THREE.Mesh(stemGeom, stemMat);
                
                const offsetX = (Math.random() - 0.5) * 0.6;
                const offsetZ = (Math.random() - 0.5) * 0.6;
                
                stem.position.set(offsetX, height / 2, offsetZ);
                
                // Cap
                const capGeom = new THREE.SphereGeometry(capRadius, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
                const capMat = new THREE.MeshStandardMaterial({
                    color: 0x44ff44,
                    emissive: 0x228822,
                    emissiveIntensity: 0.8,
                    roughness: 0.3
                });
                const cap = new THREE.Mesh(capGeom, capMat);
                cap.position.y = height / 2;
                stem.add(cap);
                
                decorationGroup.add(stem);
            }
            break;
        }
        
        case 'moss_patch': {
            // Determine placement: Floor, Ceiling, or Wall
            // Preference: Wall > Ceiling > Floor
            
            const neighbors = [
                { x: 0, y: -1, type: 'wall', rot: 0, pos: {x:0, y:cellSize/2, z:-cellSize/2 + 0.05} }, // North Wall
                { x: 1, y: 0, type: 'wall', rot: -Math.PI/2, pos: {x:cellSize/2 - 0.05, y:cellSize/2, z:0} }, // East Wall
                { x: 0, y: 1, type: 'wall', rot: Math.PI, pos: {x:0, y:cellSize/2, z:cellSize/2 - 0.05} }, // South Wall
                { x: -1, y: 0, type: 'wall', rot: Math.PI/2, pos: {x:-cellSize/2 + 0.05, y:cellSize/2, z:0} } // West Wall
            ];
            
            const validWalls = [];
            for(let n of neighbors) {
                const nx = gridX + n.x;
                const ny = gridY + n.y;
                if(nx >= 0 && nx < game.dungeon.width && ny >= 0 && ny < game.dungeon.height) {
                    if(dungeonMap[ny][nx] === 1) { // Wall
                        validWalls.push(n);
                    }
                }
            }
            
            let placement = 'floor';
            let selectedWall = null;
            
            // Adjusted probabilities for better distribution
            if (validWalls.length > 0) {
                // If walls are nearby: 60% Wall, 20% Floor, 20% Ceiling
                const r = Math.random();
                if (r < 0.6) {
                    placement = 'wall';
                    selectedWall = validWalls[Math.floor(Math.random() * validWalls.length)];
                } else if (r < 0.8) {
                    placement = 'floor';
                } else {
                    placement = 'ceiling';
                }
            } else {
                // Open space: 50% Floor, 50% Ceiling
                // (Previously was 10% Floor, 90% Ceiling)
                if (Math.random() < 0.5) {
                    placement = 'floor';
                } else {
                    placement = 'ceiling';
                }
            }
            
            // Create a cluster of moss patches instead of one big circle
            const mossGroup = new THREE.Group();
            
            // Base position/rotation setup
            if (placement === 'wall') {
                mossGroup.rotation.y = selectedWall.rot;
                mossGroup.position.copy(selectedWall.pos);
                mossGroup.position.y = Math.random() * 3.0 + 0.5;
            } else if (placement === 'ceiling') {
                mossGroup.rotation.x = Math.PI / 2;
                mossGroup.position.y = 3.95; 
            } else {
                mossGroup.rotation.x = -Math.PI / 2;
                mossGroup.position.y = 0.02;
            }
            
            decorationGroup.add(mossGroup);

            // Generate 5-12 small patches for organic look
            const numPatches = 5 + Math.floor(Math.random() * 8);
            
            for (let i = 0; i < numPatches; i++) {
                const radius = 0.1 + Math.random() * 0.25;
                // Irregular circle (using low segments makes it look more jagged)
                const segments = 5 + Math.floor(Math.random() * 4); 
                const geometry = new THREE.CircleGeometry(radius, segments);
                
                // Varying shades of green/teal
                const g = 150 + Math.floor(Math.random() * 105);
                const b = 50 + Math.floor(Math.random() * 100);
                const color = new THREE.Color(`rgb(50, ${g}, ${b})`);
                
                const material = new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.3 + Math.random() * 0.3, // Softer glow
                    roughness: 1.0,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.5 + Math.random() * 0.4
                });
                
                const patch = new THREE.Mesh(geometry, material);
                
                // Random offset within a larger area
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 0.6;
                patch.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, i * 0.01);
                
                // Random rotation for irregularity
                patch.rotation.z = Math.random() * Math.PI * 2;
                
                mossGroup.add(patch);
            }

            // Add soft glow light (Reduced intensity)
            const light = new THREE.PointLight(0x66ff88, 0.5, 5);
            light.position.copy(mossGroup.position);
            
            // Move light slightly away from surface
            if (placement === 'wall') {
                const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), mossGroup.rotation.y);
                light.position.add(normal.multiplyScalar(0.3));
            } else if (placement === 'ceiling') {
                light.position.y -= 0.3;
            } else {
                light.position.y += 0.3;
            }
            
            decorationGroup.add(light);
            
            // Store reference for culling
            decorationGroup.userData.light = light;
            break;
        }

        case 'wall_inscription': {
            // Mysterious writing on the wall
            const messages = [
                // Warnings
                "TURN BACK",
                "THEY ARE WATCHING",
                "NO ESCAPE",
                "DEATH WAITS AHEAD",
                "QUIET OR DIE",
                "BEWARE THE SHADOWS",
                "LIGHT FADES FAST",
                "DONT SLEEP",
                "HUNGRY DARKNESS",
                "IT SEES YOU",
                
                // Madness
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
                const inscriptionData = {
                    type: type,
                    mesh: inscription,
                    debugArrow: arrowGroup,
                    gridX: gridX,
                    gridY: gridY
                };
                
                // Return early since we added directly to scene
                return { mesh: inscription, isInscription: true, data: inscriptionData };
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
            const boneMat = new THREE.MeshStandardMaterial({ color: 0x887766 }); // Darker bone
            const armorMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.7 }); // Darker, rusty armor
            
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
            
            // Scale up to make them more prominent
            bodyGroup.scale.set(2.5, 2.5, 2.5);

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
        'puddle',
        'spider_web',
        'moss_patch',
        'wall_inscription'
    ];
    
    if (type.name && !noShadowDecorations.includes(type.name)) {
        decorationGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    return {
        mesh: decorationGroup,
        debugArrow: decorationGroup.userData.debugArrow
    };
}

// Spawn decorations throughout the dungeon
