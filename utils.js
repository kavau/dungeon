import { game } from './state.js';

// Utility functions

export function getDifficultyText(difficulty) {
    if (difficulty <= 2) return 'Trivial';
    if (difficulty <= 4) return 'Easy';
    if (difficulty <= 6) return 'Medium';
    if (difficulty <= 8) return 'Hard';
    if (difficulty <= 10) return 'Very Hard';
    return 'Extreme';
}

// Check if object is visible from player's position
export function isObjectVisible(objectPos) {
    const result = isObjectVisibleDebug(objectPos);
    return result.visible;
}

// Debug version that returns detailed visibility info
export function isObjectVisibleDebug(objectPos) {
    let maxDistance = 25; // Default fallback
    
    // Use torch range if available
    if (game.player.torch) {
        maxDistance = game.player.torch.rangeBase;
        // If torch is out/very low, visibility is minimal
        if (game.player.light && !game.player.light.visible) maxDistance = 0.5;
    }
    
    // Calculate distance
    const dx = objectPos.x - game.player.position.x;
    const dz = objectPos.z - game.player.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance > maxDistance) {
        return { visible: false, reason: 'too far', distance };
    }
    
    // Get the camera's forward direction vector
    const cameraDirection = new THREE.Vector3();
    game.camera.getWorldDirection(cameraDirection);
    
    // Direction from player to object
    const toObject = new THREE.Vector3(dx, 0, dz).normalize();
    
    // Calculate the dot product (cosine of angle between vectors)
    const dotProduct = cameraDirection.dot(toObject);
    
    // Convert to angle for debugging
    const angleDiff = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
    
    // Check field of view - dot product > 0 means less than 90 degrees
    // For ~100 degree FOV, we need cos(50 degrees) ≈ 0.64
    const minDotProduct = Math.cos(Math.PI / 1.8); // ~100 degree field of view
    if (dotProduct < minDotProduct) {
        return { visible: false, reason: 'outside FOV', distance, angleDiff, dotProduct };
    }
    
    // Check line of sight - raycast to see if blocked by walls
    const direction = new THREE.Vector3(dx, 0, dz).normalize();
    game.raycaster.set(game.player.position, direction);
    
    const intersects = game.raycaster.intersectObjects(game.dungeon.wallMeshes);
    
    // If there's an intersection closer than the object, it's blocked
    if (intersects.length > 0 && intersects[0].distance < distance - 0.5) {
        return { visible: false, reason: 'blocked by wall', distance, wallDistance: intersects[0].distance };
    }
    
    return { visible: true, reason: 'visible', distance, dotProduct };
}

// Convert 3D position to 2D screen coordinates
export function get2DPosition(position3D) {
    const vector = position3D.clone();
    vector.project(game.camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    return { x, y, visible: vector.z < 1 };
}
