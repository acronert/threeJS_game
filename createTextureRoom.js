import * as THREE from "three";

let cube_1, cube_2, cube_3, cube_4, cube_5;

function createCubes() {
    const loader = new THREE.TextureLoader();
    const rock_color = loader.load('Rock058_1K-JPG/Rock058_1K-JPG_Color.jpg');
    const rock_normal = loader.load('Rock058_1K-JPG/Rock058_1K-JPG_NormalGL.jpg');
    const rock_displacement = loader.load('Rock058_1K-JPG/Rock058_1K-JPG_Displacement.jpg');
    const rock_roughness = loader.load('Rock058_1K-JPG/Rock058_1K-JPG_Roughness.jpg');
    const rock_ambientOcclusion = loader.load('Rock058_1K-JPG/Rock058_1K-JPG_AmbientOcclusion.jpg');

    
    {
        // Color
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            map: rock_color,
        })
        cube_1 = new THREE.Mesh(geometry, material);
        cube_1.castShadow = true;
        cube_1.position.set(0, 1.5, -6);
    }
    {
        // Color + NM
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            map: rock_color,
            normalMap: rock_normal,
            normalScale: new THREE.Vector2(2, 2),
    
        })
        cube_2 = new THREE.Mesh(geometry, material);
        cube_2.castShadow = true;
        cube_2.position.set(0, 1.5, -3);
    }
    {
        // Color + NM + RP
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            map: rock_color,
            normalMap: rock_normal,
            normalScale: new THREE.Vector2(2, 2),
            roughnessMap: rock_roughness
        })
        cube_3 = new THREE.Mesh(geometry, material);
        cube_3.castShadow = true;
        cube_3.position.set(0, 1.5, 0);
    }
    {
        // Color + NM + RP + AO
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            map: rock_color,
            normalMap: rock_normal,
            normalScale: new THREE.Vector2(2, 2),
            roughnessMap: rock_roughness,
            aoMap: rock_ambientOcclusion
        })
        cube_4 = new THREE.Mesh(geometry, material);
        cube_4.castShadow = true;
        cube_4.position.set(0, 1.5, 3);
    }
    {
        // Color + NM + RP + AO + DM
        const geometry = new THREE.BoxGeometry(1, 1, 1, 100, 100, 100);
        const material = new THREE.MeshStandardMaterial({
            map: rock_color,
            normalMap: rock_normal,
            normalScale: new THREE.Vector2(2, 2),
            roughnessMap: rock_roughness,
            aoMap: rock_ambientOcclusion,
            displacementMap: rock_displacement,
            displacementScale: 0.1,
            displacementBias: -0.1
        })
        cube_5 = new THREE.Mesh(geometry, material);
        cube_5.castShadow = true;
        cube_5.position.set(0, 1.5, 6);
    }
    return { cube_1, cube_2, cube_3, cube_4, cube_5 };
}

function createFloor() {

    const loader = new THREE.TextureLoader();
    const plank_color = loader.load('Planks037B_1K-JPG/Planks037B_1K-JPG_Color.jpg');
    const plank_normal = loader.load('Planks037B_1K-JPG/Planks037B_1K-JPG_NormalGL.jpg');
    const plank_roughness = loader.load('Planks037B_1K-JPG/Planks037B_1K-JPG_Roughness.jpg');
    const plank_ambientOcclusion = loader.load('Planks037B_1K-JPG/Planks037B_1K-JPG_AmbientOcclusion.jpg');

    const size = 20;

    [plank_color, plank_normal, plank_roughness, plank_ambientOcclusion].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(size / 4, size / 4);
    });

    const floorGeometry = new THREE.PlaneGeometry(size, size);
    const floorMaterial = new THREE.MeshStandardMaterial({
        map: plank_color,
        normalMap: plank_normal,
        normalScale: new THREE.Vector2(2, 2),
        roughnessMap: plank_roughness,
        aoMap: plank_ambientOcclusion
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;

    floor.receiveShadow = true;

    return (floor);
}

function createWalls() {
    const group = new THREE.Group();

    const loader = new THREE.TextureLoader();
    const tile_color = loader.load('Tiles073_1K-JPG/Tiles073_1K-JPG_Color.jpg');
    const tile_normal = loader.load('Tiles073_1K-JPG/Tiles073_1K-JPG_NormalGL.jpg');
    const tile_displacement = loader.load('Tiles073_1K-JPG/Tiles073_1K-JPG_Displacement.jpg');
    const tile_roughness = loader.load('Tiles073_1K-JPG/Tiles073_1K-JPG_Roughness.jpg');
    const tile_ambientOcclusion = loader.load('Tiles073_1K-JPG/Tiles073_1K-JPG_AmbientOcclusion.jpg');

    const wallWidth = 20;
    const wallHeight = 5;

    [tile_color, tile_normal, tile_displacement, tile_roughness, tile_ambientOcclusion].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(wallWidth / 5, wallHeight / 5); 
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: tile_color,
        normalMap: tile_normal,
        normalScale: new THREE.Vector2(1, 1),
        // displacementMap: tile_displacement,
        // displacementScale: 0.05,
        // displacementBias: 0,
        roughnessMap: tile_roughness,
        aoMap: tile_ambientOcclusion
    });
    const wallGeometry = new THREE.PlaneGeometry(wallWidth, wallHeight);
    // const wallGeometry = new THREE.PlaneGeometry(wallWidth, wallHeight, 1000, 250);

    // Back wall
    const wallBack = new THREE.Mesh(wallGeometry, wallMaterial);
    wallBack.position.set(0, wallHeight/2, -wallWidth/2);
    wallBack.receiveShadow = true;
    wallBack.castShadow = true;
    group.add(wallBack);
    
    // Front wall
    const wallFront = new THREE.Mesh(wallGeometry, wallMaterial);
    wallFront.position.set(0, wallHeight/2, wallWidth/2);
    wallFront.rotation.y = Math.PI;
    wallFront.receiveShadow = true;
    wallFront.castShadow = true;
    group.add(wallFront);

    // Left wall
    const wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
    wallLeft.position.set(-wallWidth/2, wallHeight/2, 0);
    wallLeft.rotation.y = Math.PI / 2;
    wallLeft.receiveShadow = true;
    wallLeft.castShadow = true;
    group.add(wallLeft);

    // Right wall
    const wallRight = new THREE.Mesh(wallGeometry, wallMaterial);
    wallRight.position.set(wallWidth/2, wallHeight/2, 0);
    wallRight.rotation.y = -Math.PI / 2;
    wallRight.receiveShadow = true;
    wallRight.castShadow = true;
    group.add(wallRight);

    return (group);
}

export function createTextureRoom() {

    const group = new THREE.Group();

    const { cube_1, cube_2, cube_3, cube_4, cube_5 } = createCubes();
    group.add(cube_1, cube_2, cube_3, cube_4, cube_5);

    const walls = createWalls();
    group.add(walls);

    const floor = createFloor();
    group.add(floor);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    group.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    
    group.add( directionalLight );


    const pointLight = new THREE.PointLight(0xffaaaa, 15, 1000);
    pointLight.position.set(-2.5, 5, -2.5);
    group.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xaaffaa, 15, 1000);
    pointLight2.position.set(-2.5, 5, 2.5);
    group.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xaaaaff, 15, 1000);
    pointLight3.position.set(-9, 5, 9);
    group.add(pointLight3);

    return { group };
}

export function updateRoom() {
    cube_1.rotation.x += 0.005;
    cube_1.rotation.y += 0.005;
    cube_2.rotation.x += 0.005;
    cube_2.rotation.y += 0.005;
    cube_3.rotation.x += 0.005;
    cube_3.rotation.y += 0.005;
    cube_4.rotation.x += 0.005;
    cube_4.rotation.y += 0.005;
    cube_5.rotation.x += 0.005;
    cube_5.rotation.y += 0.005;
}