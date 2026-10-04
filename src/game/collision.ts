// ============================================================
// FORGE PET — Sistema de colisões (AABB)
// ============================================================
export interface AABB { minX: number; maxX: number; minZ: number; maxZ: number; }

const staticColliders: AABB[] = [];
const dynamicColliders: AABB[] = [];

export function clearColliders() {
  staticColliders.length = 0;
}

export function addCollider(c: AABB) {
  staticColliders.push(c);
}

export function setDynamicColliders(list: AABB[]) {
  dynamicColliders.length = 0;
  dynamicColliders.push(...list);
}

/** resolve posição do pet (raio r) contra todos os colliders */
export function resolveCollisions(x: number, z: number, r: number): [number, number] {
  let nx = x, nz = z;
  const all = staticColliders.concat(dynamicColliders);
  for (let iter = 0; iter < 2; iter++) {
    for (const c of all) {
      const closestX = Math.max(c.minX, Math.min(nx, c.maxX));
      const closestZ = Math.max(c.minZ, Math.min(nz, c.maxZ));
      const dx = nx - closestX;
      const dz = nz - closestZ;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        const d = Math.sqrt(d2);
        if (d < 1e-6) {
          // dentro do collider: empurra para a borda mais próxima
          const left = nx - c.minX, right = c.maxX - nx, top = nz - c.minZ, bottom = c.maxZ - nz;
          const m = Math.min(left, right, top, bottom);
          if (m === left) nx = c.minX - r;
          else if (m === right) nx = c.maxX + r;
          else if (m === top) nz = c.minZ - r;
          else nz = c.maxZ + r;
        } else {
          const push = (r - d) / d;
          nx += dx * push;
          nz += dz * push;
        }
      }
    }
  }
  return [nx, nz];
}

export function boxCollider(cx: number, cz: number, w: number, d: number): AABB {
  return { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 };
}
