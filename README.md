# 3D Maze Game (Three.js)

## Maze

### Data Structure
- **Graph-based layout**
  - Nodes = intersections / dead ends
  - Edges = corridors (with properties: length, orientation, type, portal, etc.)
  - Use adjacency list for flexibility (non-euclidean connections, dynamic regeneration)
- Possible extensions:
  - Chunked graph for streaming (large/infinite mazes)
  - Markovian corridor generation (probability-based branching)

### Generation
- Corridors are generated **lazily**:
  - If a corridor is visible in the player’s FOV → generate node/edge
  - If corridor leaves FOV → despawn or mutate on reappearance (non-persistent maze)
- Control parameters:
  - Max visible depth (to avoid infinite generation)
  - Corridor length distribution
  - Random vs. rule-based branching

---

## Player

### Controls
- WASD / Arrow keys for movement
- Mouse for camera orientation (first-person view)
- Optional sprint / crouch

### Collision
- Bounding box or capsule collider
- Collision against corridor walls
- Prevent clipping through geometry
- Future: physics-based movement (jumping, sliding)

---

## Rendering

### Visual Effects
- **Fog**: hide distant corridors, make regeneration seamless
- **Grain / noise**: add analog / surreal vibe
- **Lighting**: atmospheric point lights or torches in corridors
- **Postprocessing ideas**:
  - Bloom
  - Color grading
  - Chromatic aberration (to reinforce non-euclidean feel)

---

## Next Steps
1. Implement basic `MazeGraph` class with nodes & edges
2. Generate initial corridor in front of player
3. Add player movement (simple FPS controls)
4. Add collision detection with corridor walls
5. Implement lazy corridor generation when looking around
6. Add fog + grain shader for atmosphere
