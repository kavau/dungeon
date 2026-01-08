import { game } from './state.js';
import { 
    movePlayerForward, 
    movePlayerBackward, 
    rotatePlayer, 
    strafeLeft,
    strafeRight,
    waitTurn, 
    playerAttack, 
    interact,
    toggleAmulet
} from './player.js';
import { 
    showDescriptions, 
    hideDescriptions, 
    updateDebugArrows,
    toggleMap,
    updateHealthDisplay,
    logMessage,
    toggleSettings,
    toggleManual,
    toggleJournal
} from './ui.js';
import { teleportToLevel, enterTestChamber } from './gameLoop.js';

export function setupControls() {
    // Keyboard controls - discrete movement
    document.addEventListener('keydown', (e) => {
        // Handle win screen
        if (game.won) {
            location.reload();
            return;
        }

        // Test Chamber (Ctrl + Alt + X)
        if (e.ctrlKey && e.altKey && (e.code === 'KeyX')) {
            enterTestChamber();
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
                game.cheatMode = false;
                game.player.maxHealth = 100;
                if (game.player.health > 100) game.player.health = 100;
                updateHealthDisplay();
                
                // Close map and debug window
                const mapOverlay = document.getElementById('map-overlay');
                if (mapOverlay) mapOverlay.style.display = 'none';
                
                game.controls.debugMode = false;
                const debugWindow = document.getElementById('debug-window');
                if (debugWindow) debugWindow.style.display = 'none';
            }

            // If on intro screen, start the game
            if (!game.started) {
                game.started = true;
                const introScreen = document.getElementById('intro-screen');
                if (introScreen) {
                    introScreen.style.display = 'none';
                }
            }
            return;
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

        // Handle level screen
        if (game.showingLevelScreen) {
            // Prevent accidental dismissal (e.g. holding the interaction key)
            if (game.levelScreenShownTime && Date.now() - game.levelScreenShownTime < 1000) {
                console.log("Ignoring key press during level screen cooldown");
                return;
            }

            // Ignore modifier keys alone
            if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
                return;
            }
            
            console.log("Dismissing level screen");
            game.showingLevelScreen = false;
            const levelScreen = document.getElementById('level-screen');
            if (levelScreen) {
                levelScreen.style.display = 'none';
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }

        // Toggle Settings
        if (e.code === 'KeyV') {
            toggleSettings();
            return;
        }

        // Toggle Manual
        if (e.code === 'KeyH') {
            toggleManual();
            return;
        }

        // Toggle Journal
        if (e.code === 'KeyJ' || e.key === 'j' || e.key === 'J') {
            toggleJournal();
            return;
        }
        
        // Escape closes UI
        if (e.code === 'Escape') {
             const journalOverlay = document.getElementById('journal-overlay');
             if (journalOverlay && journalOverlay.style.display === 'flex') {
                 toggleJournal();
                 return;
             }
             
             // Also close settings or manual if open?
             const manualScreen = document.getElementById('manual-screen');
             if (manualScreen && manualScreen.style.display === 'block') {
                 toggleManual();
                 return;
             }
             
             const settingsMenu = document.getElementById('settings-menu');
             if (settingsMenu && settingsMenu.style.display === 'block') {
                 toggleSettings();
                 return;
             }
        }

        if (!game.player.canMove) return;
        
        // Cheat Mode Controls
        if (game.cheatMode) {
            if (e.code === 'KeyC') {
                game.cheatMode = false;
                game.player.maxHealth = 100;
                if (game.player.health > 100) game.player.health = 100;
                updateHealthDisplay();
                
                // Close map and debug window
                const mapOverlay = document.getElementById('map-overlay');
                if (mapOverlay) mapOverlay.style.display = 'none';
                
                game.controls.debugMode = false;
                const debugWindow = document.getElementById('debug-window');
                if (debugWindow) debugWindow.style.display = 'none';
                
                return;
            }

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
                if (e.shiftKey) {
                    strafeLeft();
                } else {
                    rotatePlayer(-1);
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (e.shiftKey) {
                    strafeRight();
                } else {
                    rotatePlayer(1);
                }
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
            case 'KeyU':
                e.preventDefault();
                toggleAmulet();
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
            if (game.cheatMode || game.isTestChamber) {
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
