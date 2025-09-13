import { getDesertHeightAt, getSnowHeightAt } from "./PerlinNoise.js";

function generateChunkHeights(chunkX, chunkY, size, resolution, heightFunction) {
  const vertices = new Float32Array(resolution * resolution);
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const d = getDeltaCoord(x, y, chunkX, chunkY, size, resolution);
      vertices[x * resolution + y] = heightFunction(d.x, d.y);
    }
  }
  return vertices;
}

function getDeltaCoord(x, y, chunkX, chunkY, size, resolution) {
  let d = { x: 0, y: 0 };
  d.x = (chunkX + y / (resolution - 1)) * size - size / 2;
  d.y = (chunkY + x / (resolution - 1)) * size - size / 2;
  return d;
}

function generateGradientNormals(chunkX, chunkY, size, resolution, heights, heightFunction) {
  const normals = new Float32Array(resolution * resolution * 3);
  const scale = size / (resolution - 1);

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const i = y * resolution + x;

      let hL;
      if (x > 0) {
        hL = heights[i - 1];
      } else {
        const d = getDeltaCoord(y, x - 1, chunkX, chunkY, size, resolution);
        hL = heightFunction(d.x, d.y);
      }

      let hR;
      if (x < resolution - 1) {
        hR = heights[i + 1];
      } else {
        const d = getDeltaCoord(y, x + 1, chunkX, chunkY, size, resolution);
        hR = heightFunction(d.x, d.y);
      }

      let hD;
      if (y > 0) {
        hD = heights[i - resolution];
      } else {
        const d = getDeltaCoord(y - 1, x, chunkX, chunkY, size, resolution);
        hD = heightFunction(d.x, d.y);
      }

      let hU;
      if (y < resolution - 1) {
        hU = heights[i + resolution];
      } else {
        const d = getDeltaCoord(y + 1, x, chunkX, chunkY, size, resolution);
        hU = heightFunction(d.x, d.y);
      }

      // Central differences (scaled by world spacing)
      const dx = (hR - hL) / (2 * scale);
      const dy = (hU - hD) / (2 * scale);

      // Gradient normal
      let nx = -dx;
      let ny = -dy;
      let nz = 2.0;

      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      normals[i * 3] = nx;
      normals[i * 3 + 1] = ny;
      normals[i * 3 + 2] = nz;
    }
  }

  return normals;
}

onmessage = (e) => {
  const { chunkX, chunkY, size, resolution, terrainType } = e.data; // unpack input
  let heightFunction;
  switch(terrainType) {
      case "DESERT": heightFunction = getDesertHeightAt; break;
      case "SNOW": heightFunction = getSnowHeightAt; break;
      // case "MOON": heightFunction = getMoonHeightAt; break;
      default: heightFunction = (x, z) => 0;
  } 

  const heights = generateChunkHeights(chunkX, chunkY, size, resolution, heightFunction);
  const normals = generateGradientNormals(chunkX, chunkY, size, resolution, heights, heightFunction);
  postMessage({ chunkX, chunkY, size, resolution, terrainType, heights, normals }, [heights.buffer, normals.buffer]); // [list] is uses to transfert ownership of the data
}
