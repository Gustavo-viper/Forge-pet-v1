// ============================================================
// FORGE PET — Cena do menu principal (pet 3D idlando)
// ============================================================
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useForge } from "../state/store";
import PetModel from "./PetModel";
import { FUR_COLORS } from "../state/store";

export default function MenuScene() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.6, 5.2], fov: 42 }}>
      <color attach="background" args={["#131a33"]} />
      <fog attach="fog" args={["#131a33", 12, 30]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 8, 6]} intensity={1.6} castShadow />
      <pointLight position={[0, 2, -3]} intensity={0.8} color="#ff9de2" />
      <MenuPet />
      <FloatingHearts />
      <Podium />
      <OrbitControls makeDefault enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.8} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2.1} target={[0, 1, 0]} />
    </Canvas>
  );
}

function MenuPet() {
  const roster = useForge((s) => s.roster);
  const activePet = useForge((s) => s.activePet);
  const [anim, setAnim] = useState("idle");
  const t = useRef(0);
  const seq = useRef(["idle", "happy", "idle", "dance", "idle", "eat"]);
  const seqI = useRef(0);
  const timer = useRef(0);
  const pet = roster[activePet];

  useFrame((_, dt) => {
    timer.current -= dt;
    if (timer.current <= 0) {
      timer.current = 2.8;
      seqI.current = (seqI.current + 1) % seq.current.length;
      setAnim(seq.current[seqI.current]);
    }
    t.current += dt;
  });

  if (!pet) return null;
  return (
    <group position={[0, 0.55, 0]}>
      <PetModel
        species={pet.species}
        fur={pet.fur}
        belly={pet.belly}
        ear={pet.ear}
        eye={pet.eye}
        clothes={pet.clothes}
        anim={anim}
        moving={false}
        speed={0}
        sick={false}
      />
    </group>
  );
}

function Podium() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.51, 0]} receiveShadow>
        <circleGeometry args={[2.2, 32]} />
        <meshStandardMaterial color="#2a3358" roughness={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <ringGeometry args={[2.2, 2.35, 32]} />
        <meshBasicMaterial color="#ff8a3d" />
      </mesh>
      {/* chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1a2140" roughness={1} />
      </mesh>
      {/* pilares decorativos */}
      {[-3.4, 3.4].map((x) => (
        <group key={x} position={[x, 0, -2]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 3, 10]} />
            <meshStandardMaterial color="#2a3358" roughness={0.7} />
          </mesh>
          <mesh position={[0, 3.1, 0]}>
            <sphereGeometry args={[0.24, 10, 8]} />
            <meshStandardMaterial color="#ffd54f" emissive="#ff8f00" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function FloatingHearts() {
  const ref = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        a: (i / 7) * Math.PI * 2,
        r: 2.6 + (i % 3) * 0.5,
        y: 1 + (i % 4) * 0.5,
        s: 0.7 + (i % 3) * 0.2,
        c: ["#ff8a3d", "#ff5e7a", "#8b7cf6", "#3fd8c9"][i % 4],
      })),
    []
  );
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((c, i) => {
        c.position.y = items[i].y + Math.sin(state.clock.elapsedTime * 1.4 + i) * 0.25;
        c.rotation.y = state.clock.elapsedTime * 0.8 + i;
      });
    }
  });
  return (
    <group ref={ref}>
      {items.map((it, i) => (
        <mesh key={i} position={[Math.cos(it.a) * it.r, it.y, Math.sin(it.a) * it.r]} scale={it.s}>
          <octahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color={it.c} emissive={it.c} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export { FUR_COLORS };
