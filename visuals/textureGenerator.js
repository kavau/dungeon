export function createFloorTexture(width, height, theme = {}) {
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const floorCtx = floorCanvas.getContext('2d');
    
    // Theme colors
    const baseColorHex = theme.floorBase || '#2a2a2a';
    const tileColorBase = theme.floorTile || 42;
    
    // Base fill
    floorCtx.fillStyle = baseColorHex;
    floorCtx.fillRect(0, 0, 512, 512);
    
    // Add stone tiles with variation
    if (theme.noTiles) {
        // Natural floor texture (noise)
        
        // 1. Base Noise
        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const val = Math.random();
            floorCtx.fillStyle = val < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
            floorCtx.fillRect(x, y, 2, 2);
        }
        
        // 2. Uneven ground (Large dark/light patches)
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = 50 + Math.random() * 100;
            const isDark = Math.random() < 0.6;
            
            const gradient = floorCtx.createRadialGradient(x, y, 0, x, y, radius);
            if (isDark) {
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            }
            floorCtx.fillStyle = gradient;
            floorCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }

        // 3. Cracks and Crevices
        floorCtx.strokeStyle = 'rgba(0,0,0,0.4)';
        floorCtx.lineWidth = 2;
        for (let i = 0; i < 15; i++) {
            const startX = Math.random() * 512;
            const startY = Math.random() * 512;
            floorCtx.beginPath();
            floorCtx.moveTo(startX, startY);
            
            let cx = startX;
            let cy = startY;
            const segments = 5 + Math.random() * 10;
            
            for(let j=0; j<segments; j++) {
                cx += (Math.random() - 0.5) * 40;
                cy += (Math.random() - 0.5) * 40;
                floorCtx.lineTo(cx, cy);
            }
            floorCtx.stroke();
        }
        
        // 4. Small stones/debris
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = 2 + Math.random() * 4;
            
            // Shadow
            floorCtx.fillStyle = 'rgba(0,0,0,0.5)';
            floorCtx.beginPath();
            floorCtx.arc(x + 1, y + 1, size, 0, Math.PI * 2);
            floorCtx.fill();
            
            // Stone
            floorCtx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            floorCtx.beginPath();
            floorCtx.arc(x, y, size, 0, Math.PI * 2);
            floorCtx.fill();
        }
    } else {
        const tileSize = 64;
        for (let y = 0; y < 512; y += tileSize) {
            for (let x = 0; x < 512; x += tileSize) {
                // Slight color variation per tile
                const variation = Math.floor(Math.random() * 20 - 10);
                
                // Parse base color if it's a number (grey scale) or handle hex
                let fillStyle;
                if (typeof tileColorBase === 'number') {
                    const c = Math.max(0, Math.min(255, tileColorBase + variation));
                    fillStyle = `rgb(${c}, ${c}, ${c})`;
                } else {
                    // Simple hex variation logic could go here, but for now assume grey if number
                    // If string, just use it
                    fillStyle = tileColorBase; 
                }
                
                floorCtx.fillStyle = fillStyle;
                floorCtx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
                
                // Add cracks and texture
                for (let i = 0; i < 15; i++) {
                    const px = x + Math.random() * tileSize;
                    const py = y + Math.random() * tileSize;
                    const size = 1 + Math.random() * 2;
                    const darkness = Math.floor(Math.random() * 30);
                    floorCtx.fillStyle = `rgba(0,0,0,0.2)`;
                    floorCtx.fillRect(px, py, size, size);
                }
                
                // Grout lines (darker)
                floorCtx.strokeStyle = 'rgba(0,0,0,0.5)';
                floorCtx.lineWidth = 2;
                floorCtx.strokeRect(x, y, tileSize, tileSize);
            }
        }
    }
    
    // Theme specific overlays
    if (theme.name === 'sewers') {
        // Green slime overlay
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = 10 + Math.random() * 30;
            const gradient = floorCtx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(50, 100, 50, 0.4)');
            gradient.addColorStop(1, 'rgba(50, 100, 50, 0)');
            floorCtx.fillStyle = gradient;
            floorCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
    }
    
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(width / 2, height / 2);
    return floorTexture;
}

export function createCeilingTexture(width, height, theme = {}) {
    const ceilingCanvas = document.createElement('canvas');
    ceilingCanvas.width = 512;
    ceilingCanvas.height = 512;
    const ceilingCtx = ceilingCanvas.getContext('2d');
    
    // Base color
    ceilingCtx.fillStyle = theme.ceilingBase || '#4a4a4a';
    ceilingCtx.fillRect(0, 0, 512, 512);
    
    // Add noise texture
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = 2 + Math.random() * 6;
        const shade = Math.floor(Math.random() * 60 + 30); 
        ceilingCtx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.1)`;
        ceilingCtx.beginPath();
        ceilingCtx.arc(x, y, size, 0, Math.PI * 2);
        ceilingCtx.fill();
    }
    
    const ceilingTexture = new THREE.CanvasTexture(ceilingCanvas);
    ceilingTexture.wrapS = THREE.RepeatWrapping;
    ceilingTexture.wrapT = THREE.RepeatWrapping;
    ceilingTexture.repeat.set(width / 2, height / 2);
    return ceilingTexture;
}

export function createWallTexture(theme = {}) {
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 512;
    wallCanvas.height = 512;
    const wallCtx = wallCanvas.getContext('2d');
    
    // Base stone wall color
    const baseWallColor = theme.wallBase || { r: 74, g: 63, b: 53 };
    wallCtx.fillStyle = `rgb(${baseWallColor.r}, ${baseWallColor.g}, ${baseWallColor.b})`;
    wallCtx.fillRect(0, 0, 512, 512);
    
    // Add rough stone blocks
    if (theme.noTiles) {
        // Natural rock wall texture
        
        // 1. Base Noise (High frequency)
        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const val = Math.random();
            wallCtx.fillStyle = val < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
            wallCtx.fillRect(x, y, 2, 2);
        }

        // 2. Horizontal Strata (Layered rock)
        for (let y = 0; y < 512; y += 10 + Math.random() * 30) {
            const height = 5 + Math.random() * 20;
            // Darker bands
            wallCtx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.2})`;
            wallCtx.fillRect(0, y, 512, height);
            
            // Thin cracks between strata
            if (Math.random() < 0.5) {
                wallCtx.fillStyle = 'rgba(0,0,0,0.4)';
                wallCtx.fillRect(0, y, 512, 1 + Math.random() * 2);
            }
        }
        
        // 3. Vertical Fissures (Jagged cracks)
        wallCtx.strokeStyle = 'rgba(0,0,0,0.6)';
        wallCtx.lineWidth = 2;
        for (let i = 0; i < 15; i++) {
            const startX = Math.random() * 512;
            const startY = Math.random() * 512;
            const length = 50 + Math.random() * 150;
            
            wallCtx.beginPath();
            wallCtx.moveTo(startX, startY);
            
            let cx = startX;
            let cy = startY;
            
            // Jagged line downwards
            for(let j=0; j<length; j+=5) {
                cx += (Math.random() - 0.5) * 8;
                cy += 5;
                wallCtx.lineTo(cx, cy);
            }
            wallCtx.stroke();
            
            // Add a faint shadow/highlight to give it depth
            wallCtx.strokeStyle = 'rgba(255,255,255,0.1)';
            wallCtx.beginPath();
            wallCtx.moveTo(startX + 2, startY);
            cx = startX + 2;
            cy = startY;
            for(let j=0; j<length; j+=5) {
                cx += (Math.random() - 0.5) * 8;
                cy += 5;
                wallCtx.lineTo(cx, cy);
            }
            wallCtx.stroke();
            wallCtx.strokeStyle = 'rgba(0,0,0,0.6)'; // Reset
        }

        // 4. Angular Rock Facets (Chipped stone look)
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = 10 + Math.random() * 30;
            
            // Randomly light or dark to simulate angled surfaces catching light
            const isHighlight = Math.random() > 0.5;
            wallCtx.fillStyle = isHighlight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)';
            
            wallCtx.beginPath();
            // Draw a random triangle/quad
            wallCtx.moveTo(x, y);
            wallCtx.lineTo(x + size, y + (Math.random() - 0.5) * 10);
            wallCtx.lineTo(x + size * 0.5, y + size);
            if (Math.random() > 0.5) {
                wallCtx.lineTo(x - size * 0.2, y + size * 0.8);
            }
            wallCtx.fill();
        }
    } else {
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
                    wallCtx.fillStyle = `rgba(0,0,0,0.3)`;
                    wallCtx.beginPath();
                    wallCtx.arc(px, py, size, 0, Math.PI * 2);
                    wallCtx.fill();
                }
                
                // Mortar lines (darker gaps between stones)
                wallCtx.strokeStyle = 'rgba(0,0,0,0.5)';
                wallCtx.lineWidth = 3;
                wallCtx.strokeRect(currentX, currentY, block.w, rowHeight);
                
                currentX += block.w;
            }
            currentY += rowHeight;
        }
    }
    
    // Add moss and weathering
    if (theme.mossy) {
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
    }

    if (theme.name === 'temple') {
        // Add gold trim
        wallCtx.strokeStyle = '#d4af37';
        wallCtx.lineWidth = 5;
        wallCtx.strokeRect(10, 10, 492, 492);
    }
    
    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    return wallTexture;
}

export function createWoodTexture() {
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
    return woodTexture;
}

export function createFrameTexture() {
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
    return frameTexture;
}

export function createPanelTexture() {
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
    return panelTexture;
}
