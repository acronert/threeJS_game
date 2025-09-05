# Sahara Desert To-Do

## Visual Effects
- Heat haze / shimmering air near horizon
- Blinding sun effect (brightens when looking at the sun, fades over time)
- Sun glare / bloom
- OK Fog for atmospheric depth
- Mirages (refraction/distortion effects)

## Terrain
- OK Procedural dunes with sharper edges
- OK Tweak Perlin noise / octaves for realistic dune shapes
- Blend terrain with rocky hills using a blend map
- Footprints / paths on sand (procedural algorithm needed)

## Textures
- OK Sand with ridges / fine details
- Rocky hills textures for blending
- Footprint texture or procedural path generation

## Objects
- Rocks / boulders placed across dunes

## Performance / Rendering
- OK Asynchronous chunk generation 
- Pre bake texture2D of perlin noise in GPU, and use them as displacement map
- rework order of chunk generation (spiral)
