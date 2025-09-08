# 🏜️ Sahara Desert Simulator (Three.js)

A desert simulation built with **Three.js**, featuring infinite chunk-based terrain generation, atmospheric effects, and experimental gameplay (drive a bouncing tire across the dunes).

---

## ✨ Visual Effects (Planned / WIP)
- [ ] Heat haze / shimmering air near horizon
- [ ] Blinding sun effect (brightness adaptation when looking at sun, fades over time)
- [ ] Sun glare / bloom
- [ ] Shadow casting (sync second "sun" with HDRI skybox)
- [ ] Improved anti-aliasing (keep good performance)
- [ ] Mirage effects (refraction / distortion)
- [ ] Rocky hill textures blending

---

## ⚡ Performance / Rendering
- [ ] Asynchronous chunk mesh generation

---

## 🎮 Controls
- [ ] Splash screen / start menu with clean exit
- [ ] Settings menu (quality presets, chunk depth & resolution, toggle effects)
- [ ] Enter / exit the "rubber" (walking vs. tire mode)
- [ ] Jump:
  - ⌨️ Keyboard: `Space`
  - 📱 Mobile: shake phone (accelerometer)
- [ ] Switch camera view when controlling the rubber

---

## 🏁 Gameplay
- [ ] Add controllable **rubber (tire)**
- [ ] Input methods:
  - ⌨️ Keyboard
  - 📱 Touch
- [ ] Tire trail system
- [ ] Physics:
  - [ ] Velocity & acceleration on X/Y/Z
  - [ ] Bounces / rebounds
  - [ ] Freefall handling (disable input, spin tire)
- [ ] Camera modes:
  - [ ] First-person (inside tire)
  - [ ] Third-person follow
- [ ] Particles: dust trail behind tire
- [ ] Sound design:
  - Tire rolling on gravel
  - Bouncing impact ("yoga ball slap")

---

## 🛠️ Development Notes
- Add inline documentation for functions
- Explain design choices (why certain methods / optimizations are used)
