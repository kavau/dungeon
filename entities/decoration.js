import { game, dungeonMap } from '../state.js';

export const DECORATION_TYPES = {
    PUDDLE: { name: 'puddle', probability: 0.05 },
    SPIDER_WEB: { name: 'spider_web', probability: 0.05 },
    STALACTITE: { name: 'stalactite', probability: 0.04 },
    STALAGMITE: { name: 'stalagmite', probability: 0.04 },
    BONE_PILE: { name: 'bone_pile', probability: 0.03 },
    MUSHROOMS: { name: 'mushrooms', probability: 0.03 },
    MOSS_PATCH: { name: 'moss_patch', probability: 0.04 },
    WALL_INSCRIPTION: { name: 'wall_inscription', probability: 0.02 },
    WYRM_CARCASS: { name: 'wyrm_carcass', probability: 0 }, // Special, spawned manually
    DEAD_ADVENTURER: { name: 'dead_adventurer', probability: 0 }, // Special
    LADDER: { name: 'ladder', probability: 0 } // Special
};

export function createDecoration(gridX, gridY, type) {
    const cellSize = game.dungeon.cellSize;
    const worldX = gridX * cellSize + cellSize / 2;
    const worldZ = gridY * cellSize + cellSize / 2;
    
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
                    emissiveIntensity: 0.5,
                    roughness: 0.3
                });
                const cap = new THREE.Mesh(capGeom, capMat);
                cap.position.y = height / 2;
                stem.add(cap);
                
                decorationGroup.add(stem);
                
                // Add point light for glow
                if (i === 0) {
                    const light = new THREE.PointLight(0x44ff44, 0.5, 2);
                    light.position.set(offsetX, 0.2, offsetZ);
                    decorationGroup.add(light);
                }
            }
            break;
        }
        
        case 'moss_patch': {
            // Flat mossy patch
            const radius = 0.5 + Math.random() * 0.5;
            const geometry = new THREE.CircleGeometry(radius, 8);
            const material = new THREE.MeshStandardMaterial({
                color: 0x225522,
                roughness: 1.0,
                side: THREE.DoubleSide
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.01;
            
            decorationGroup.add(mesh);
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
export function spawnDecorations() {
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
export function updateDecorations() {
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

export function spawnGlowWorms() {
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
export function createGlowWorm(gridX, gridY) {
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
export function updateCritters(deltaTime) {
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
export function tryMoveCritter(critter) {
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
