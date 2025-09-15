import * as THREE from "three";

export function createBeachBallMesh(radius = 1) {
    const geometry = new THREE.SphereGeometry(radius, 32, 16);

    // red, yellow, green, blue, white
    const colors = [0xff0000, 0xffff00, 0x00ff00, 0x0000ff, 0xffffff];

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.5,
        metalness: 0,
    });

    // Assign vertex colors to create stripes
    const colorAttr = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        const u = geometry.attributes.uv.getX(i); // 0 to 1 around sphere
        const colorIndex = Math.floor(u * colors.length) % colors.length;
        const color = new THREE.Color(colors[colorIndex]);
        colorAttr[i * 3] = color.r;
        colorAttr[i * 3 + 1] = color.g;
        colorAttr[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));

    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
}
