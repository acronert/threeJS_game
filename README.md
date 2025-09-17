# 🏜️ Sahara Desert Simulator (Three.js)

A desert simulation built with **Three.js**, featuring infinite chunk-based terrain generation, atmospheric effects, and experimental gameplay (drive a bouncing tire across the dunes).

- Rework tiretracks with decalGeometry: very laggy
- - actually not possible to preallocate decalGeometries, because I cant change the mesh on which to apply it. A solution would be for the chunk Manager to return an invisible "big Mesh" (2x2 chunksize), that is moved but not recreated, in order to always apply decals to it


- Frontend:
- - Menu
- - Switch vehicule button
- - cleaner look

plane sim:
- dynamically calculate AoA depending on speed vector and forward dir
AoA (alpha) affects drag and lift

- add vertical velocity to the HUD
- value box for altitude and speed
