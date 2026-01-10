import { createTorch } from '../entities/items.js';
import { MONSTER_TYPES } from '../entities/monsterTypes.js';

export function createMonsterVisuals(type) {
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
            // Cave salamander - realistic
            // Low to ground, curved body, tail, splayed legs
            body = new THREE.Group();
            
            const skinColor = 0xff5500;
            const spotColor = 0xffff00;
            
            const skinMat = new THREE.MeshStandardMaterial({ 
                color: skinColor, 
                roughness: 0.4, // Wet skin
                metalness: 0.0
            });
            
            // Main Torso (Ellipsoid)
            const torso = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 8, 8),
                skinMat
            );
            torso.scale.set(0.7, 0.5, 1.8);
            torso.position.y = 0.12;
            body.add(torso);
            
            // Head
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.15, 0.35);
            
            const headGeom = new THREE.SphereGeometry(0.12, 8, 8);
            headGeom.scale(1, 0.6, 1.3);
            const head = new THREE.Mesh(headGeom, skinMat);
            headGroup.add(head);
            
            // Eyes
            const eyeGeom = new THREE.SphereGeometry(0.04, 4, 4);
            const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.0 });
            
            const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
            leftEye.position.set(-0.08, 0.08, 0.05);
            headGroup.add(leftEye);
            
            const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
            rightEye.position.set(0.08, 0.08, 0.05);
            headGroup.add(rightEye);
            
            body.add(headGroup);
            
            // Tail (Curved)
            const tailGroup = new THREE.Group();
            tailGroup.position.set(0, 0.12, -0.3);
            
            const tailSeg1 = new THREE.Mesh(
                new THREE.ConeGeometry(0.1, 0.4, 8),
                skinMat
            );
            tailSeg1.rotation.x = -Math.PI / 2;
            tailSeg1.position.z = -0.15;
            tailGroup.add(tailSeg1);
            
            const tailSeg2 = new THREE.Mesh(
                new THREE.ConeGeometry(0.06, 0.4, 8),
                skinMat
            );
            tailSeg2.rotation.x = -Math.PI / 2;
            tailSeg2.rotation.y = 0.4; // Curve right
            tailSeg2.position.set(0.1, 0, -0.5);
            tailGroup.add(tailSeg2);
            
            body.add(tailGroup);
            
            // Legs
            const createLeg = (x, z, flipX) => {
                const legGroup = new THREE.Group();
                legGroup.position.set(x, 0.12, z);
                
                // Upper leg
                const thigh = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.03, 0.04, 0.2, 4), 
                    skinMat
                );
                thigh.rotation.z = flipX ? -1.0 : 1.0;
                thigh.position.set(flipX ? 0.08 : -0.08, 0.05, 0);
                
                // Lower leg / Foot
                const foot = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.03, 0.15, 4),
                    skinMat
                );
                foot.position.set(flipX ? 0.15 : -0.15, -0.05, 0);
                
                legGroup.add(thigh);
                legGroup.add(foot);
                
                // Random leg variance
                legGroup.rotation.y = (Math.random() - 0.5) * 0.5;
                
                return legGroup;
            };
            
            body.add(createLeg(-0.15, 0.2, false));  // Front Left
            body.add(createLeg(0.15, 0.2, true));    // Front Right
            body.add(createLeg(-0.15, -0.15, false)); // Back Left
            body.add(createLeg(0.15, -0.15, true));  // Back Right
            
            // Spots (Emissive)
            const spotMat = new THREE.MeshStandardMaterial({ 
                color: spotColor, 
                emissive: spotColor,
                emissiveIntensity: 0.5
            });
            
            const spotGeom = new THREE.SphereGeometry(0.03, 4, 4);
            
            const spot1 = new THREE.Mesh(spotGeom, spotMat);
            spot1.position.set(0.05, 0.21, 0.1);
            body.add(spot1);
            
            const spot2 = new THREE.Mesh(spotGeom, spotMat);
            spot2.position.set(-0.04, 0.21, -0.1);
            body.add(spot2);
            
            const spot3 = new THREE.Mesh(spotGeom, spotMat);
            spot3.position.set(0, 0.2, -0.25);
            body.add(spot3);

            monsterGroup.position.y = 0; 
            speed = 0.5;
            moveChance = 0.8;
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
            
            // Eyes (only visible when aggressive)
            const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
            const mimicEye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
            mimicEye1.position.set(-0.15, 0.35, 0.3);
            mimicEye1.visible = false;  // Hidden by default
            const mimicEye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
            mimicEye2.position.set(0.15, 0.35, 0.3);
            mimicEye2.visible = false;  // Hidden by default
            
            // Mouth with fangs (only visible when aggressive)
            const mouthGroup = new THREE.Group();
            const mouthGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.05);
            const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x330000 });
            const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
            mouth.position.set(0, 0.2, 0.3);
            
            // Fangs (teeth) - improved alignment and direction
            const fangGeometry = new THREE.ConeGeometry(0.03, 0.12, 4);
            const fangMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            // Small fangs (lid front rim)
            const numFangs = 5;
            for (let i = 0; i < numFangs; i++) {
                const fang = new THREE.Mesh(fangGeometry, fangMaterial);
                // Arc along the lid rim
                const t = i / (numFangs - 1);
                const x = -0.24 + t * 0.48;
                const z = 0.26;
                const y = -0.07;
                fang.position.set(x, y, z);
                // Point toward mouth center
                fang.rotation.set(Math.PI * 0.92, 0, (t - 0.5) * 0.3);
                mimicLid.add(fang);
            }
            // Large fangs (top and bottom rows)
            const bigFangGeometry = new THREE.ConeGeometry(0.06, 0.22, 6);
            // Top row (lid rim, pointing down)
            const numTopFangs = 6;
            for (let i = 0; i < numTopFangs; i++) {
                const fang = new THREE.Mesh(bigFangGeometry, fangMaterial);
                // Arc along the lid rim
                const t = i / (numTopFangs - 1);
                const x = -0.27 + t * 0.54;
                const z = 0.23;
                const y = -0.075;
                fang.position.set(x, y, z);
                // Point toward mouth center
                fang.rotation.set(Math.PI * 0.97, 0, (t - 0.5) * 0.35);
                mimicLid.add(fang);
            }
            // Bottom row (mouth rim, pointing up)
            const numBottomFangs = 6;
            for (let i = 0; i < numBottomFangs; i++) {
                const fang = new THREE.Mesh(bigFangGeometry, fangMaterial);
                // Arc along the chest base rim
                const t = i / (numBottomFangs - 1);
                const x = -0.27 + t * 0.54;
                const z = 0.23;
                const y = 0.025;
                fang.position.set(x, y, z);
                // Point toward mouth center
                fang.rotation.set(-Math.PI * 0.97, 0, (t - 0.5) * 0.35);
                mouth.add(fang);
            }
            // Move eyes to above the lid, not in the maw
            mimicEye1.position.set(-0.13, 0.48, 0.18);
            mimicEye2.position.set(0.13, 0.48, 0.18);
            
            mouthGroup.add(mouth);
            mouthGroup.visible = false;  // Hidden by default
            
            body.add(mimicBody);
            body.add(mimicLid);
            body.add(mimicTrim);
            body.add(mimicEye1);
            body.add(mimicEye2);
            body.add(mouthGroup);
            
            // Store references for later visibility control
            body.userData.mimicEye1 = mimicEye1;
            body.userData.mimicEye2 = mimicEye2;
            body.userData.mimicMouth = mouthGroup;
            body.userData.mimicLid = mimicLid;
            // Store references to all fangs for aggro visibility
            body.userData.mimicTopFangs = [];
            body.userData.mimicBottomFangs = [];
            mimicLid.children.forEach(child => {
                if (child.geometry && child.geometry.type === 'ConeGeometry') body.userData.mimicTopFangs.push(child);
            });
            mouth.children.forEach(child => {
                if (child.geometry && child.geometry.type === 'ConeGeometry') body.userData.mimicBottomFangs.push(child);
            });
            
            monsterGroup.position.y = 0.3;
            speed = 0.6;
            moveChance = 0.05; // Mimics barely move when disguised
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

            // Troll scale factor
            const trollScale = 2.1;

            // Massive hunched body
            const trollBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5 * trollScale, 0.55 * trollScale, 1.4 * trollScale, 10),
                trollMaterial
            );
            trollBody.position.y = 0.3 * trollScale;
            trollBody.rotation.z = Math.PI / 12;
            body.add(trollBody);

            // Large head
            const trollHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.35 * trollScale, 12, 12),
                trollMaterial
            );
            trollHead.position.set(-0.15 * trollScale, 1.05 * trollScale, 0);
            body.add(trollHead);

            // Eyes (bulging and red)
            const trollEyeGeometry = new THREE.SphereGeometry(0.08 * trollScale, 8, 8);
            const trollEyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.7
            });
            const trollLeftEye = new THREE.Mesh(trollEyeGeometry, trollEyeMaterial);
            trollLeftEye.position.set(-0.25 * trollScale, 1.05 * trollScale, 0.38 * trollScale);
            const trollRightEye = new THREE.Mesh(trollEyeGeometry, trollEyeMaterial);
            trollRightEye.position.set(-0.05 * trollScale, 1.05 * trollScale, 0.38 * trollScale);
            body.add(trollLeftEye);
            body.add(trollRightEye);

            // Large mouth with teeth
            const mouth = new THREE.Mesh(
                new THREE.BoxGeometry(0.25 * trollScale, 0.08 * trollScale, 0.1 * trollScale),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            mouth.position.set(-0.15 * trollScale, 0.85 * trollScale, 0.38 * trollScale);
            body.add(mouth);

            // Tusks
            const tuskMaterial = new THREE.MeshStandardMaterial({ color: 0xffffdd });
            for (let i = 0; i < 4; i++) {
                const tusk = new THREE.Mesh(
                    new THREE.BoxGeometry(0.04 * trollScale, 0.1 * trollScale, 0.04 * trollScale),
                    tuskMaterial
                );
                tusk.position.set((-0.22 + i * 0.08) * trollScale, 0.9 * trollScale, 0.42 * trollScale);
                body.add(tusk);
            }

            // Long arms
            const trollArmMaterial = new THREE.MeshStandardMaterial({ color: 0x667755, roughness: 0.95 });
            const trollLeftArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15 * trollScale, 0.12 * trollScale, 0.9 * trollScale, 10),
                trollArmMaterial
            );
            trollLeftArm.position.set(-0.6 * trollScale, 0.3 * trollScale, 0);
            trollLeftArm.rotation.z = Math.PI / 4;
            body.add(trollLeftArm);

            const trollRightArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15 * trollScale, 0.12 * trollScale, 0.9 * trollScale, 10),
                trollArmMaterial
            );
            trollRightArm.position.set(0.6 * trollScale, 0.3 * trollScale, 0);
            trollRightArm.rotation.z = -Math.PI / 4;
            body.add(trollRightArm);

            // Huge hands
            const trollHandGeometry = new THREE.SphereGeometry(0.18 * trollScale, 10, 10);
            const trollLeftHand = new THREE.Mesh(trollHandGeometry, trollArmMaterial);
            trollLeftHand.position.set(-0.9 * trollScale, -0.1 * trollScale, 0);
            trollLeftHand.scale.set(1.2, 0.8, 1.5);
            const trollRightHand = new THREE.Mesh(trollHandGeometry, trollArmMaterial);
            trollRightHand.position.set(0.9 * trollScale, -0.1 * trollScale, 0);
            trollRightHand.scale.set(1.2, 0.8, 1.5);
            body.add(trollLeftHand);
            body.add(trollRightHand);

            // Thick legs
            const trollLegMaterial = new THREE.MeshStandardMaterial({ color: 0x445533, roughness: 0.95 });
            const trollLeftLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18 * trollScale, 0.16 * trollScale, 0.6 * trollScale, 10),
                trollLegMaterial
            );
            trollLeftLeg.position.set(-0.2 * trollScale, -0.6 * trollScale, 0);
            const trollRightLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18 * trollScale, 0.16 * trollScale, 0.6 * trollScale, 10),
                trollLegMaterial
            );
            trollRightLeg.position.set(0.2 * trollScale, -0.6 * trollScale, 0);
            body.add(trollLeftLeg);
            body.add(trollRightLeg);

            // Raise the troll so feet are on the ground
            monsterGroup.position.y = 0.9 * trollScale;
            speed = 0.7;
            moveChance = 0.55;
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

            // Make the serpent bigger
            const serpentScale = 1.7;

            // Serpent body - coiled segments
            const segments = 12;
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2 * 1.5;
                const radius = (0.3 + (i / segments) * 0.2) * serpentScale;
                const segment = new THREE.Mesh(
                    new THREE.SphereGeometry((0.12 - (i * 0.006)) * serpentScale, 10, 10),
                    i % 2 === 0 ? serpentMaterial : scaleMaterial
                );
                segment.position.set(
                    Math.cos(angle) * radius,
                    0.01 + (i / segments) * 0.3 * serpentScale,
                    Math.sin(angle) * radius
                );
                segment.scale.set(1, 0.8, 1.2);
                body.add(segment);
            }

            // Head
            const serpentHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.18 * serpentScale, 12, 12),
                serpentMaterial
            );
            serpentHead.position.set(0.4 * serpentScale, 0.18 * serpentScale, 0);
            serpentHead.scale.set(1.3, 1, 1.5);
            body.add(serpentHead);

            // Snout
            const snout = new THREE.Mesh(
                new THREE.ConeGeometry(0.1 * serpentScale, 0.15 * serpentScale, 8),
                new THREE.MeshStandardMaterial({ color: 0x113300 })
            );
            snout.rotation.z = -Math.PI / 2;
            snout.position.set(0.52 * serpentScale, 0.18 * serpentScale, 0);
            body.add(snout);

            // Fangs
            const fangMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const serpentLeftFang = new THREE.Mesh(
                new THREE.ConeGeometry(0.02 * serpentScale, 0.12 * serpentScale, 6),
                fangMaterial
            );
            serpentLeftFang.position.set(0.55 * serpentScale, 0.15 * serpentScale, -0.06 * serpentScale);
            serpentLeftFang.rotation.x = Math.PI;
            const serpentRightFang = new THREE.Mesh(
                new THREE.ConeGeometry(0.02 * serpentScale, 0.12 * serpentScale, 6),
                fangMaterial
            );
            serpentRightFang.position.set(0.55 * serpentScale, 0.15 * serpentScale, 0.06 * serpentScale);
            serpentRightFang.rotation.x = Math.PI;
            body.add(serpentLeftFang);
            body.add(serpentRightFang);

            // Eyes
            const serpentEyeGeometry = new THREE.SphereGeometry(0.04 * serpentScale, 8, 8);
            const serpentEyeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffff00,
                emissive: 0xaaaa00,
                emissiveIntensity: 0.5
            });
            const serpentLeftEye = new THREE.Mesh(serpentEyeGeometry, serpentEyeMaterial);
            serpentLeftEye.position.set(0.48 * serpentScale, 0.22 * serpentScale, -0.12 * serpentScale);
            const serpentRightEye = new THREE.Mesh(serpentEyeGeometry, serpentEyeMaterial);
            serpentRightEye.position.set(0.48 * serpentScale, 0.22 * serpentScale, 0.12 * serpentScale);
            body.add(serpentLeftEye);
            body.add(serpentRightEye);

            // Forked tongue
            const tongue = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01 * serpentScale, 0.01 * serpentScale, 0.25 * serpentScale, 4),
                new THREE.MeshStandardMaterial({ color: 0xff0000 })
            );
            tongue.rotation.z = -Math.PI / 2;
            tongue.position.set(0.65 * serpentScale, 0.18 * serpentScale, 0);
            body.add(tongue);

            // Lower the serpent to sit flush with the ground
            // Find the minimum y among all body children
            let minY = Infinity;
            body.children.forEach(child => {
                if (child.position && child.position.y < minY) minY = child.position.y;
            });
            // Offset so the lowest part is at y=0
            monsterGroup.position.y = -minY;
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
    // User requested Jellies to cast shadows, so removed from exclusion
    if (type !== MONSTER_TYPES.GHOST && type !== MONSTER_TYPES.WRAITH && type !== MONSTER_TYPES.CUBE) {
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
    
    return {
        mesh: monsterGroup,
        body: body,
        speed: speed,
        moveChance: moveChance
    };
}
