import * as THREE from "three";

// Function to create a parametric geometry
export function createParametricGeometry(func, widthSegments, heightSegments) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];

  for (let i = 0; i <= widthSegments; i++) {
    for (let j = 0; j <= heightSegments; j++) {
      const uv = new THREE.Vector2(i / widthSegments, j / heightSegments);
      const vertex = func(uv.x, uv.y);
      vertices.push(vertex.x, vertex.y, vertex.z);
      uvs.push(uv.x, uv.y);
    }
  }

  for (let i = 0; i < widthSegments; i++) {
    for (let j = 0; j < heightSegments; j++) {
      const a = i * (heightSegments + 1) + j;
      const b = (i + 1) * (heightSegments + 1) + j;
      const c = (i + 1) * (heightSegments + 1) + (j + 1);
      const d = i * (heightSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

  return geometry;
}
