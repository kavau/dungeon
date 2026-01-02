import { game } from './state.js';
import { 
    movePlayerForward, 
    movePlayerBackward, 
    rotatePlayer, 
    waitTurn, 
    playerAttack, 
    interactWithDoor 
} from './player.js';
import { 
    showDescriptions, 
    hideDescriptions, 
    updateDebugArrows 
} from './ui.js';

export function setupControls() {
    // Keyboard controls - discrete movement
    document.addEventListener('keydown', (e) => {
        // Handle intro screen
        if (!game.started) {
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
                interactWithDoor();
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
            updateDebugArrows();
        }
        if (e.key === 'd' || e.key === 'D') {
            game.controls.debugMode = !game.controls.debugMode;
            const debugWindow = document.getElementById('debug-window');
            if (debugWindow) {
                debugWindow.style.display = game.controls.debugMode ? 'block' : 'none';
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
