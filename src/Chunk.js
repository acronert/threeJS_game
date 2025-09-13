import * as THREE from "three";

export class Chunk {
  constructor(coord, size, resolution, heights, normals, material, terrainType) {
    this.coord = coord;
    this.size = size;
    this.terrainType = terrainType;

    const geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    const positions = geometry.attributes.position;

    // Set vertex height
    for (let i = 0; i < positions.count; i++)
      positions.setZ(i, heights[i]);
    positions.needsUpdate = true;

    // Set normals
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.attributes.normal.needsUpdate = true;

    // Place the chunk in world space
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(coord.x * size - size / 2, 0, coord.y * size - size / 2);

    this.mesh.receiveShadow = true;
  }

  getChildrenChunksKeys() {
    if (this.size == 32)
      return [];
    const keys = [];
    const childrenChunkOrigin = {
      x: this.coord.x * 2,
      y: this.coord.y * 2
    };
    const childrenChunkSize = this.size / 2;
    keys.push(`${childrenChunkOrigin.x},${childrenChunkOrigin.y},${childrenChunkSize},${this.terrainType}`);
    keys.push(`${childrenChunkOrigin.x+1},${childrenChunkOrigin.y},${childrenChunkSize},${this.terrainType}`);
    keys.push(`${childrenChunkOrigin.x},${childrenChunkOrigin.y+1},${childrenChunkSize},${this.terrainType}`);
    keys.push(`${childrenChunkOrigin.x+1},${childrenChunkOrigin.y+1},${childrenChunkSize},${this.terrainType}`);
    return keys;
  }

  getParentChunkKey() {
    const parentChunkPos = {
      x: (this.coord.x - (this.coord.x % 2)) / 2,
      y: (this.coord.y - (this.coord.y % 2)) / 2
    };
    const parentChunkSize = this.size * 2;
    return `${parentChunkPos.x},${parentChunkPos.y},${parentChunkSize},${this.terrainType}`;
  }

  addTo(scene) {
    // console.log(`ADD CHUNK [${this.coord.x}, ${this.coord.y}], size:${this.size}`)
    scene.add(this.mesh);
  }

  removeFrom(scene) {
    // console.log(`REMOVE CHUNK ${this.coord.x}, ${this.coord.y}, size:${this.size}`)
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
  }

  getMesh() {
    return this.mesh;
  }
}


////////////////////////////////////////////////////////////////////////////////


// import * as THREE from "three";

// export class Chunk {
//   constructor(coord, size, resolution, heights, normals, material) {
//     this.coord = coord;
//     this.size = size;

//     const geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
//     const positions = geometry.attributes.position;

//     // Set vertex height
//     for (let i = 0; i < positions.count; i++)
//       positions.setZ(i, heights[i]);
//     positions.needsUpdate = true;

//     // Set normals
//     geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
//     geometry.attributes.normal.needsUpdate = true;

//     // Place the chunk in world space
//     this.mesh = new THREE.Mesh(geometry, material);
//     this.mesh.rotation.x = -Math.PI / 2;
//     this.mesh.position.set(coord.x * size, 0, coord.y * size);

//     this.mesh.receiveShadow = true;
//   }

//   addTo(scene) {
//     scene.add(this.mesh);
//   }

//   removeFrom(scene) {
//     scene.remove(this.mesh);
//     this.mesh.geometry.dispose();
//   }

//   getMesh() {
//     return this.mesh;
//   }
// }
