import { game } from './state.js';
import { 
    movePlayerForward, 
    movePlayerBackward, 
    rotatePlayer, 
    waitTurn, 
    playerAttack, 
    interact 
} from './player.js';
import { 
    showDescriptions, 
    hideDescriptions, 
    updateDebugArrows,
    toggleMap,
    updateHealthDisplay,
    logMessage
} from './ui.js';
import { teleportToLevel } from './gameLoop.js';

export function setupControls() {
    // Keyboard controls - discrete movement
    document.addEventListener('keydown', (e) => {
        // Handle win screen
        if (game.won) {
            location.reload();
            return;
        }

        // Global Cheat Mode Toggle (Ctrl + Alt + C)
        if (e.ctrlKey && e.altKey && (e.code === 'KeyC')) {
            if (!game.cheatMode) {
                game.cheatMode = true;
                game.player.health = 10000;
                game.player.maxHealth = 10000;
                updateHealthDisplay();
                logMessage("CHEAT MODE ENABLED", "combat");
            } else {
                logMessage("CHEAT MODE ALREADY ACTIVE", "combat");
            }
        }

        // Handle intro screen
        if (!game.started) {
            // Ignore modifier keys alone to allow combinations
            if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
                return;
            }
            
            game.started = true;
            const introScreen = document.getElementById('intro-screen');
            if (introScreen) {
                introScreen.style.display = 'none';
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }

        if (!game.player.canMove) return;
        
        // Cheat Mode Controls
        if (game.cheatMode) {
            if (e.code === 'KeyL') {
                // Renew Torch
                game.player.torch.turnsActive = 0;
                game.player.torch.intensityBase = 2.0;
                game.player.torch.rangeBase = 18;
                game.player.torch.color.setHex(0xffaa00);
                game.player.light.color.copy(game.player.torch.color);
                game.player.light.visible = true;
                logMessage("Torch renewed!", "item");
                return;
            }
            
            if (e.code === 'KeyM') {
                toggleMap();
                return;
            }
            
            // Teleport (Shift + Number)
            if (e.shiftKey && e.code.startsWith('Digit')) {
                const level = parseInt(e.code.replace('Digit', ''));
                if (level >= 1 && level <= 5) {
                    teleportToLevel(level);
                    return;
                }
            }
        }

        switch(e.code) {
            case 'ArrowUp':
                e.preventDefault();
                movePlayerForward();
                break;
            case 'ArrowDown':
                e.preventDefault();
                movePlayerBackward();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                rotatePlayer(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                rotatePlayer(1);
                break;
            case 'Space':
                e.preventDefault();
                waitTurn();
                break;
            case 'KeyA':
                e.preventDefault();
                playerAttack();
                break;
            case 'KeyE':
                e.preventDefault();
                interact();
                break;
        }
    });
    
    // Alt key for showing descriptions
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Alt') {
            e.preventDefault();
            game.controls.altPressed = true;
            showDescriptions();
        }
        if (e.key === 'Shift') {
            e.preventDefault();
            game.controls.shiftPressed = true;
            if (game.cheatMode) {
                updateDebugArrows();
            }
        }
        if (e.key === 'd' || e.key === 'D') {
            if (game.cheatMode) {
                game.controls.debugMode = !game.controls.debugMode;
                const debugWindow = document.getElementById('debug-window');
                if (debugWindow) {
                    debugWindow.style.display = game.controls.debugMode ? 'block' : 'none';
                }
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            e.preventDefault();
            game.controls.altPressed = false;
            hideDescriptions();
        }
        if (e.key === 'Shift') {
            e.preventDefault();
            game.controls.shiftPressed = false;
            updateDebugArrows();
        }
    });
}
