// ============================================================
// FORGE PET — Mobiliário e decoração 3D (primitives)
// ============================================================
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { FURNITURE } from "../data/content";
import { addCollider, boxCollider } from "./collision";

const M = (color: string, rough = 0.8) => new THREE.MeshStandardMaterial({ color, roughness: rough });

export default function Furniture({ id, x, z, rot = 0, ghost = false }: { id: string; x: number; z: number; rot?: number; ghost?: boolean }) {
  const info = FURNITURE.find((f) => f.id === id);
  const g = useRef<THREE.Group>(null);
  useEffect(() => {
    if (ghost || !info) return;
    const c = boxCollider(x, z, info.w, info.d);
    addCollider(c);
    return () => {
      // colisões estáticas são recarregadas ao trocar de cena; não remove individualmente
      void c;
    };
  }, [x, z, id, ghost, info]);
  if (!info) return null;
  const opacity = ghost ? 0.55 : 1;
  const mats = (mat: THREE.Material) => {
    if (!ghost) return mat;
    const m = mat.clone();
    m.transparent = true;
    m.opacity = opacity;
    return m;
  };
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]} ref={g}>
      <FurnitureBody id={id} mats={mats} />
    </group>
  );
}

function FurnitureBody({ id, mats }: { id: string; mats: (m: THREE.Material) => THREE.Material }) {
  switch (id) {
    case "sofa":
      return (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow material={mats(M("#7e57c2"))}>
            <boxGeometry args={[2.4, 0.5, 1]} />
          </mesh>
          <mesh position={[0, 0.65, -0.42]} material={mats(M("#673ab7"))}>
            <boxGeometry args={[2.4, 0.6, 0.25]} />
          </mesh>
          <mesh position={[-1.1, 0.6, 0]} material={mats(M("#673ab7"))}>
            <boxGeometry args={[0.25, 0.7, 1]} />
          </mesh>
          <mesh position={[1.1, 0.6, 0]} material={mats(M("#673ab7"))}>
            <boxGeometry args={[0.25, 0.7, 1]} />
          </mesh>
          <mesh position={[0, 0.55, 0.05]} material={mats(M("#b39ddb"))}>
            <boxGeometry args={[2.1, 0.18, 0.8]} />
          </mesh>
        </group>
      );
    case "tv":
      return (
        <group>
          <mesh position={[0, 0.3, 0]} material={mats(M("#37474f"))}>
            <boxGeometry args={[1.5, 0.6, 0.4]} />
          </mesh>
          <mesh position={[0, 0.85, 0]} material={mats(M("#263238", 0.4))}>
            <boxGeometry args={[1.5, 0.95, 0.12]} />
          </mesh>
          <mesh position={[0, 0.85, 0.07]}>
            <boxGeometry args={[1.35, 0.8, 0.02]} />
            <meshStandardMaterial color="#4fc3f7" emissive="#29b6f6" emissiveIntensity={0.7} />
          </mesh>
        </group>
      );
    case "table":
      return (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow material={mats(M("#a1887f"))}>
            <cylinderGeometry args={[0.7, 0.7, 0.08, 16]} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos((i / 4) * Math.PI * 2) * 0.5, 0.27, Math.sin((i / 4) * Math.PI * 2) * 0.5]} material={mats(M("#8d6e63"))}>
              <cylinderGeometry args={[0.05, 0.05, 0.55, 8]} />
            </mesh>
          ))}
        </group>
      );
    case "rug":
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={mats(M("#e57373"))}>
          <boxGeometry args={[2.6, 1.8, 0.04]} />
        </mesh>
      );
    case "lamp":
      return (
        <group>
          <mesh position={[0, 0.35, 0]} material={mats(M("#8d6e63"))}>
            <cylinderGeometry args={[0.06, 0.09, 0.7, 8]} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <sphereGeometry args={[0.28, 12, 10]} />
            <meshStandardMaterial color="#fff59d" emissive="#ffe082" emissiveIntensity={0.9} />
          </mesh>
          <pointLight position={[0, 0.85, 0]} intensity={0.6} distance={5} color="#ffe082" />
        </group>
      );
    case "arcade":
      return (
        <group>
          <mesh position={[0, 0.7, 0]} castShadow material={mats(M("#283593"))}>
            <boxGeometry args={[1.1, 1.4, 0.8]} />
          </mesh>
          <mesh position={[0, 1.15, 0.42]}>
            <boxGeometry args={[0.8, 0.6, 0.05]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00b8d4" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, 0.55, 0.42]} material={mats(M("#ff4081"))}>
            <boxGeometry args={[0.5, 0.15, 0.06]} />
          </mesh>
        </group>
      );
    case "bed":
      return (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow material={mats(M("#8d6e63"))}>
            <boxGeometry args={[2.1, 0.5, 1.5]} />
          </mesh>
          <mesh position={[0, 0.56, 0]} material={mats(M("#e1f5fe"))}>
            <boxGeometry args={[2, 0.18, 1.4]} />
          </mesh>
          <mesh position={[-0.65, 0.66, -0.3]} material={mats(M("#ffffff"))}>
            <boxGeometry args={[0.6, 0.14, 0.5]} />
          </mesh>
          <mesh position={[1.0, 0.65, 0]} material={mats(M("#90caf9"))}>
            <boxGeometry args={[0.15, 0.5, 1.4]} />
          </mesh>
        </group>
      );
    case "wardrobe":
      return (
        <group>
          <mesh position={[0, 1, 0]} castShadow material={mats(M("#a1887f"))}>
            <boxGeometry args={[1.7, 2, 0.65]} />
          </mesh>
          <mesh position={[0, 1, 0.34]} material={mats(M("#8d6e63"))}>
            <boxGeometry args={[0.78, 1.85, 0.04]} />
          </mesh>
          <mesh position={[0.42, 1, 0.37]} material={mats(M("#ffd54f"))}>
            <sphereGeometry args={[0.04, 8, 8]} />
          </mesh>
        </group>
      );
    case "fridge":
      return (
        <group>
          <mesh position={[0, 0.95, 0]} castShadow material={mats(M("#cfd8dc", 0.35))}>
            <boxGeometry args={[1, 1.9, 0.85]} />
          </mesh>
          <mesh position={[0.3, 1.2, 0.44]} material={mats(M("#90a4ae"))}>
            <boxGeometry args={[0.05, 0.4, 0.05]} />
          </mesh>
          <mesh position={[0.3, 0.6, 0.44]} material={mats(M("#90a4ae"))}>
            <boxGeometry args={[0.05, 0.25, 0.05]} />
          </mesh>
          <mesh position={[-0.3, 1.1, 0.44]}>
            <boxGeometry args={[0.35, 0.3, 0.02]} />
            <meshStandardMaterial color="#a5d6a7" emissive="#66bb6a" emissiveIntensity={0.4} />
          </mesh>
        </group>
      );
    case "kitchenTable":
      return (
        <group>
          <mesh position={[0, 0.75, 0]} castShadow material={mats(M("#ffffff"))}>
            <boxGeometry args={[1.5, 0.08, 0.9]} />
          </mesh>
          {[[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].map(([px, pz]) => (
            <mesh key={`${px}${pz}`} position={[px, 0.37, pz]} material={mats(M("#b0bec5"))}>
              <boxGeometry args={[0.08, 0.75, 0.08]} />
            </mesh>
          ))}
          <mesh position={[0, 0.85, 0]} material={mats(M("#ef5350"))}>
            <cylinderGeometry args={[0.12, 0.1, 0.12, 10]} />
          </mesh>
        </group>
      );
    case "tub":
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow material={mats(M("#e3f2fd", 0.35))}>
            <cylinderGeometry args={[0.9, 0.75, 0.7, 18, 1, true]} />
          </mesh>
          <mesh position={[0, 0.62, 0]} material={mats(M("#90caf9", 0.2))}>
            <cylinderGeometry args={[0.85, 0.85, 0.06, 18]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} material={mats(M("#bbdefb"))}>
            <cylinderGeometry args={[0.75, 0.8, 0.15, 18]} />
          </mesh>
        </group>
      );
    case "sink":
      return (
        <group>
          <mesh position={[0, 0.45, 0]} castShadow material={mats(M("#eceff1", 0.3))}>
            <boxGeometry args={[1.1, 0.9, 0.6]} />
          </mesh>
          <mesh position={[0, 0.75, 0.32]} material={mats(M("#90a4ae"))}>
            <cylinderGeometry args={[0.03, 0.03, 0.35, 8]} />
          </mesh>
        </group>
      );
    case "bench":
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow material={mats(M("#8d6e63"))}>
            <boxGeometry args={[1.8, 0.12, 0.55]} />
          </mesh>
          <mesh position={[0, 0.65, -0.24]} material={mats(M("#795548"))}>
            <boxGeometry args={[1.8, 0.45, 0.1]} />
          </mesh>
          {[[-0.75, 0], [0.75, 0]].map(([px]) => (
            <mesh key={px} position={[px, 0.17, 0]} material={mats(M("#5d4037"))}>
              <boxGeometry args={[0.12, 0.35, 0.5]} />
            </mesh>
          ))}
        </group>
      );
    case "tree":
      return (
        <group>
          <mesh position={[0, 0.9, 0]} castShadow material={mats(M("#6d4c41"))}>
            <cylinderGeometry args={[0.18, 0.26, 1.8, 8]} />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow material={mats(M("#66bb6a"))}>
            <sphereGeometry args={[1.1, 12, 10]} />
          </mesh>
          <mesh position={[0.5, 1.8, 0.3]} material={mats(M("#81c784"))}>
            <sphereGeometry args={[0.7, 10, 8]} />
          </mesh>
        </group>
      );
    case "flowers":
      return (
        <group>
          {[-0.4, 0, 0.4].map((px, i) => (
            <group key={i} position={[px, 0, (i % 2) * 0.3 - 0.15]}>
              <mesh position={[0, 0.2, 0]} material={mats(M("#43a047"))}>
                <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
              </mesh>
              <mesh position={[0, 0.45, 0]}>
                <sphereGeometry args={[0.09, 8, 8]} />
                <meshStandardMaterial color={["#ff8a80", "#ffd54f", "#ce93d8"][i]} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "fountain":
      return (
        <group>
          <mesh position={[0, 0.25, 0]} material={mats(M("#b0bec5"))}>
            <cylinderGeometry args={[1.5, 1.6, 0.5, 16]} />
          </mesh>
          <mesh position={[0, 0.3, 0]} material={mats(M("#4fc3f7", 0.2))}>
            <cylinderGeometry args={[1.3, 1.3, 0.1, 16]} />
          </mesh>
          <mesh position={[0, 0.7, 0]} material={mats(M("#b0bec5"))}>
            <cylinderGeometry args={[0.25, 0.35, 0.5, 10]} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <sphereGeometry args={[0.3, 10, 8]} />
            <meshStandardMaterial color="#4fc3f7" emissive="#29b6f6" emissiveIntensity={0.5} transparent opacity={0.85} />
          </mesh>
        </group>
      );
    case "clock":
      return (
        <group>
          <mesh position={[0, 1.6, 0]} material={mats(M("#a1887f"))}>
            <boxGeometry args={[0.4, 1.2, 0.15]} />
          </mesh>
          <mesh position={[0, 1.75, 0.09]}>
            <cylinderGeometry args={[0.18, 0.18, 0.04, 14]} />
            <meshStandardMaterial color="#fff8e1" />
          </mesh>
        </group>
      );
    case "painting":
      return (
        <group>
          <mesh position={[0, 1.7, 0]} material={mats(M("#ffd54f"))}>
            <boxGeometry args={[1.2, 0.9, 0.08]} />
          </mesh>
          <mesh position={[0, 1.7, 0.05]}>
            <boxGeometry args={[1, 0.7, 0.02]} />
            <meshStandardMaterial color={["#4fc3f7", "#ff8a65", "#aed581"][id.length % 3]} />
          </mesh>
        </group>
      );
    case "shelf":
      return (
        <group>
          {[0.9, 1.4, 1.9].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={mats(M("#8d6e63"))}>
              <boxGeometry args={[1.4, 0.06, 0.35]} />
            </mesh>
          ))}
          <mesh position={[-0.7, 1.35, 0]} material={mats(M("#5d4037"))}>
            <boxGeometry args={[0.08, 1, 0.35]} />
          </mesh>
          <mesh position={[0.7, 1.35, 0]} material={mats(M("#5d4037"))}>
            <boxGeometry args={[0.08, 1, 0.35]} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[-0.4 + i * 0.3, 1.98, 0]} material={mats(M(["#e53935", "#1e88e5", "#43a047"][i]))}>
              <boxGeometry args={[0.18, 0.28, 0.25]} />
            </mesh>
          ))}
        </group>
      );
    case "trophy":
      return (
        <group>
          <mesh position={[0, 0.75, 0]}>
            <sphereGeometry args={[0.28, 12, 10]} />
            <meshStandardMaterial color="#ffd54f" metalness={0.8} roughness={0.2} emissive="#ff8f00" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.3, 0]} material={mats(M("#8d6e63"))}>
            <boxGeometry args={[0.3, 0.4, 0.3]} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

// ---------- Decoração de jardim/exterior ----------
export function GardenTree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={[s, s, s]}>
      <mesh position={[0, 0.9, 0]} castShadow material={M("#6d4c41")}>
        <cylinderGeometry args={[0.2, 0.3, 1.8, 8]} />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow material={M("#43a047")}>
        <sphereGeometry args={[1.2, 12, 10]} />
      </mesh>
      <mesh position={[0.6, 1.9, 0.3]} material={M("#66bb6a")}>
        <sphereGeometry args={[0.75, 10, 8]} />
      </mesh>
    </group>
  );
}

export function Fence({ x, z, rot = 0, len = 4 }: { x: number; z: number; rot?: number; len?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {Array.from({ length: Math.floor(len / 0.8) }).map((_, i) => (
        <mesh key={i} position={[-len / 2 + i * 0.8 + 0.4, 0.5, 0]} material={M("#8d6e63")}>
          <boxGeometry args={[0.12, 1, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, 0.75, 0]} material={M("#a1887f")}>
        <boxGeometry args={[len, 0.1, 0.06]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} material={M("#a1887f")}>
        <boxGeometry args={[len, 0.1, 0.06]} />
      </mesh>
    </group>
  );
}

export function BenchSimple({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow material={M("#8d6e63")}>
        <boxGeometry args={[1.6, 0.12, 0.5]} />
      </mesh>
      <mesh position={[0, 0.62, -0.22]} material={M("#795548")}>
        <boxGeometry args={[1.6, 0.4, 0.08]} />
      </mesh>
    </group>
  );
}

export function LampPost({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    const night = state.clock.elapsedTime;
    void night;
    if (ref.current) {
      const s = useForgeNight();
      ref.current.intensity = s ? 0.9 : 0;
    }
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.4, 0]} material={M("#37474f")}>
        <cylinderGeometry args={[0.06, 0.09, 2.8, 8]} />
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial color="#fff59d" emissive="#ffe082" emissiveIntensity={1} />
      </mesh>
      <pointLight ref={ref} position={[0, 2.8, 0]} distance={8} color="#ffe082" intensity={0} />
    </group>
  );
}

// pequeno helper para ler noite
import { useForge } from "../state/store";
function useForgeNight() {
  return useForge((s) => {
    const h = s.time.hour;
    return h < 6 || h >= 19;
  });
}
