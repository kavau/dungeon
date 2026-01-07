# Game Design: The Dungeon of the Awakening

## 1. Overview
**Genre**: 3D Procedural Dungeon Crawler  
**Platform**: Web (Three.js)  
**Perspective**: First/Third Person (Isometric/Top-Down hybrid)  
**Control Style**: Grid-based, Turn-based movement

---

## 2. Scenario & Setting
The game takes place in a deep, procedural dungeon known as the "Sunken Citadel". The player wakes up in the depths of the dungeon with no memory of how they got there.

### Narrative Delivery
The story is unravelled through **Journal Pages** scattered across the levels. These pages detail the descent of a party (Alaric, Thorne, Elara) into madness.

*   **Ambiguity**: It is deliberately left unclear whether these pages belong to a separate, earlier expedition, or if they are the forgotten memories of the player's own party.
*   **The Awakening**: On the start screen, the player speculates that the bodies found nearby might be their former companions, hinting at a tragic past they cannot recall.

### Level Progression
The dungeon consists of distinct thematic layers. The player starts at the bottom and must climb out:
1.  **Level 5: The Deep Caves** - The deepest point (Start). Abstract geometry, floating islands, alien lighting. Contains the "Wyrm Carcass".
2.  **Level 4: The Catacombs** - A vast city of the dead. Dusty, dry, filled with tombs. Inhabitants: Skeletons, Ghosts, Shadows.
3.  **Level 3: The Sunken Temple** - remnants of a forgotten religion. Golden idols, strangely preserved. Inhabitants: Cultists, Wraiths, Mimics.
4.  **Level 2: The Sewers** - Ancient drainage system. Wet, slimy, claustrophobic. Inhabitants: Slimes, Jellies, Serpents.
5.  **Level 1: The Ruins** - Near-surface structures reclaimed by nature. Roots, cracked stone. Inhabitants: Rats, Bandits, Spiders. (Escape)

---

## 3. Core Objectives
1.  **Ascend**: Find the ladder/exit in each procedurally generated level to climb upwards to the next level (from Level 5 to Level 1).
2.  **Survive**: Manage Health (HP) and Light resources.
3.  **Collect**:
    *   **Wealth**: Gold coins, gems, chests (Score).
    *   **Lore**: Collect all Journal Pages to understand the fate of the previous adventurers.
    *   **Survival Items**: Fresh Torches.

---

## 4. Key Mechanics

### Light & Darkness (The Torch System)
*   **The Mechanic**: The player has a torch that provides dynamic light.
*   **Decay**: The torch burns out over time (turns). As it dims:
    *   Light radius decreases.
    *   Light intensity/brightness decreases.
    *   Color shifts (e.g., orange to dull red).
*   **Replenishment**: Player must find **Fresh Torches** (loot drops or treasure) to reset the timer.
*   **Environmental Light**: Some areas have bioluminescence (Mushrooms, Moss) to provide faint guidance in the dark.

### Turn-Based Gameplay
*   Movement is on a grid.
*   Enemies move only when the player moves.
*   Fast-paced but strategic thinking required.

### Procedural Generation
*   **Dungeon Layout**: Walls, floors, and ceilings are generated using 3D noise (Simplex/Perlin) to create uneven, organic terrain (cave-like or ruined).
*   **Decorations**: Stalactites, stalagmites, puddles, webs, and debris are placed procedurally based on room geometry (e.g., webs in corners, puddles in dips).

---

## 5. Entities & Obstacles

### The Player
*   **Attributes**: 
    *   Health (Hearts)
    *   Wealth (Gold score)
    *   Torch State (Intensity/Range)
*   **Actions**: Move, Strafe, Interact (Doors), Attack (Bump).

### Monsters
*   **Behaviors**: 
    *   Chase player.
    *   Idle animations (bobbing, breathing).
    *   Attack on contact.
*   **Types**: 
    *   *Low Level*: Rat, Bat, Spider.
    *   *Mid Level*: Goblin, Skeleton, Slime, Jelly.
    *   *High Level*: Ghost, Wraith, Cultist, Mimic.
    *   *Boss/Unique*: Wyrm (Carcass).

### Terrain Obstacles
*   **Walls**: Block movement.
*   **Water/Puddles**: May slow movement or be impassable (deep water).
*   **Doors**: Must be opened (interactive).
*   **Uneven Ground**: Aesthetic challenge, but entities must strictly adhere to the floor height (no floating or sinking).

---

## 6. Current Implementation Status vs. Plan
*   [x] **Rendering**: 3D Three.js renderer with dynamic lighting and shadows.
*   [x] **Terrain**: Procedural floor/ceiling noise implemented.
*   [x] **Entities**: Monitors and Treasures spawn and align to floor height.
*   [x] **Lighting**: Torch decay and flicker system active.
*   [x] **Levels**: Configs for Levels 1-5 exist.
*   [ ] **Combat Depth**: Combat is currently simple bump-to-kill. (Potential improvement: Weapons, Stats).
*   [ ] **Inventory**: Only gold and torch tracking. No inventory for keys/potions.
*   [ ] **End Game**: Current win condition is escaping Level 1. Planned: A special narrative twist or final challenge at the surface.

---
