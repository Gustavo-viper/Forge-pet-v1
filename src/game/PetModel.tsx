// ============================================================
// FORGE PET — Modelo 3D do pet (procedural, primitives)
// Coelho estilizado + variantes (cachorro, gato, hamster, raposa,
// panda, dragão, unicórnio). Animações procedurais, expressões
// faciais e roupas/acessórios 3D.
// ============================================================
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { SpeciesId } from "../data/content";
import type { Clothes } from "../state/store";

export interface PetModelProps {
  species: SpeciesId;
  fur: string;
  belly: string;
  ear: string;
  eye: string;
  clothes: Clothes;
  anim: string;
  moving: boolean;
  speed: number; // 0..1
  sick: boolean;
  scale?: number;
  speak?: string | null;
  foodEmoji?: string | null;
  bubbleKey?: number;
}

interface Pose {
  rootY: number;
  rootRotX: number;
  rootSpin: number;
  earDroop: number;
  headNod: number;
  headTilt: number;
  legSwing: number;
  armSwing: number;
  mouthOpen: number;
  squat: number;
  hop: number;
}

function targetPose(anim: string, moving: boolean, speed: number, t: number): Pose {
  const base: Pose = {
    rootY: 0, rootRotX: 0, rootSpin: 0, earDroop: 0,
    headNod: 0, headTilt: 0, legSwing: 0, armSwing: 0,
    mouthOpen: 0, squat: 0, hop: 0,
  };
  const hopSpeed = speed > 0.6 ? 9 : 6;
  switch (anim) {
    case "walk":
    case "run": {
      base.hop = Math.abs(Math.sin(t * hopSpeed)) * (speed > 0.6 ? 0.3 : 0.16);
      base.legSwing = Math.sin(t * hopSpeed) * 0.7;
      base.armSwing = Math.sin(t * hopSpeed + Math.PI) * 0.5;
      base.rootRotX = speed > 0.6 ? 0.12 : 0.04;
      base.earDroop = 0.25;
      break;
    }
    case "jump":
      base.legSwing = 0.9; base.armSwing = -0.8; base.earDroop = -0.3; break;
    case "sit":
      base.squat = 0.32; base.legSwing = 1.5; base.headTilt = 0.06; break;
    case "lie":
    case "sleep":
      base.rootRotX = -1.15; base.squat = 0.5; base.earDroop = 0.8;
      base.headNod = Math.sin(t * 1.6) * 0.05; break;
    case "eat":
      base.headNod = Math.abs(Math.sin(t * 10)) * 0.5; base.mouthOpen = 0.8; break;
    case "drink":
      base.headTilt = 0.7; base.headNod = Math.sin(t * 4) * 0.1; break;
    case "bath":
      base.headTilt = 0.35; base.rootRotX = 0.08;
      base.headNod = Math.sin(t * 6) * 0.12; break;
    case "play":
      base.hop = Math.abs(Math.sin(t * 8)) * 0.35;
      base.rootSpin = t * 3;
      base.legSwing = Math.sin(t * 8) * 0.8; break;
    case "dance":
      base.rootSpin = Math.sin(t * 2.4) * 0.6;
      base.hop = Math.abs(Math.sin(t * 6)) * 0.12;
      base.armSwing = Math.sin(t * 6) * 1.2;
      base.headTilt = Math.sin(t * 3) * 0.2; break;
    case "happy":
      base.hop = Math.abs(Math.sin(t * 7)) * 0.4;
      base.rootSpin = t * 2.2;
      base.earDroop = -0.35; break;
    case "sad":
      base.earDroop = 0.9; base.headNod = 0.25; base.squat = 0.1; break;
    case "tired":
      base.earDroop = 0.5; base.headNod = 0.15 + Math.sin(t * 1.2) * 0.05;
      base.mouthOpen = Math.max(0, Math.sin(t * 0.8)) * 0.5; break;
    case "sick":
      base.earDroop = 0.7; base.headNod = 0.2;
      base.rootRotX = Math.sin(t * 14) * 0.02; break;
    default: { // idle
      base.headNod = Math.sin(t * 1.8) * 0.05;
      base.headTilt = Math.sin(t * 0.7) * 0.08;
      base.earDroop = 0.1 + Math.sin(t * 2.2) * 0.08;
    }
  }
  if (moving && (anim === "idle")) {
    base.hop = Math.abs(Math.sin(t * 5)) * 0.12;
    base.legSwing = Math.sin(t * 5) * 0.4;
  }
  return base;
}

export default function PetModel(props: PetModelProps) {
  const {
    species, fur, belly, ear, eye, clothes,
    anim, moving, speed, sick, scale = 1, speak, foodEmoji, bubbleKey = 0,
  } = props;

  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Group>(null);
  const earRRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<THREE.Group>(null);
  const eyeRRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const smileRef = useRef<THREE.Mesh>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);
  const legLRef = useRef<THREE.Mesh>(null);
  const legRRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const hatRef = useRef<THREE.Group>(null);
  const wingsRef = useRef<THREE.Group>(null);

  const pose = useRef<Pose>(targetPose("idle", false, 0, 0));
  const hopPhase = useRef(0);
  const blinkT = useRef(2);
  const blink = useRef(0);

  const isLongEared = species === "rabbit";
  const isRoundEared = species === "hamster" || species === "panda";
  const isPointy = species === "cat" || species === "fox" || species === "unicorn";
  const isDog = species === "dog";
  const isDragon = species === "dragon";
  const isUnicorn = species === "unicorn";
  const chubby = species === "hamster" ? 1.25 : species === "panda" ? 1.15 : 1;

  const blushColor = "#ff9db0";

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    //眨眼
    blinkT.current -= dt;
    if (blinkT.current <= 0) { blink.current = 1; blinkT.current = 2 + Math.random() * 3; }
    if (blink.current > 0) blink.current = Math.max(0, blink.current - dt * 7);

    const tgt = targetPose(anim, moving, speed, t);
    const p = pose.current;
    const k = Math.min(1, dt * 8);
    (Object.keys(tgt) as (keyof Pose)[]).forEach((key) => {
      p[key] += (tgt[key] - p[key]) * k;
    });

    // hop acumulado para fase suave
    if (moving) hopPhase.current += dt * (4 + speed * 6);

    const g = groupRef.current;
    if (g) {
      g.position.y = p.rootY + p.hop;
      g.rotation.x = p.rootRotX;
      g.rotation.y = p.rootSpin;
    }
    if (bodyRef.current) {
      const breathe = 1 + Math.sin(t * (anim === "sleep" ? 1.4 : 3)) * (anim === "sleep" ? 0.035 : 0.02);
      bodyRef.current.scale.set(breathe, 1 / breathe, breathe);
    }
    if (headRef.current) {
      headRef.current.rotation.x = p.headNod;
      headRef.current.rotation.z = p.headTilt;
    }
    const droop = p.earDroop;
    if (earLRef.current) earLRef.current.rotation.z = 0.18 + droop * 0.9 + Math.sin(t * 2.1) * 0.05;
    if (earRRef.current) earRRef.current.rotation.z = -0.18 - droop * 0.9 - Math.sin(t * 2.3) * 0.05;
    if (legLRef.current) legLRef.current.rotation.x = p.legSwing;
    if (legRRef.current) legRRef.current.rotation.x = -p.legSwing;
    if (armLRef.current) armLRef.current.rotation.x = p.armSwing;
    if (armRRef.current) armRRef.current.rotation.x = -p.armSwing;
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(t * (moving ? 10 : 3)) * 0.4;
    if (mouthRef.current) {
      mouthRef.current.scale.set(1, 0.5 + p.mouthOpen * 1.6, 1);
      (mouthRef.current.material as THREE.MeshStandardMaterial).opacity = 0.9;
    }
    if (smileRef.current) smileRef.current.visible = anim === "happy" || anim === "play" || anim === "dance";
    const eyeScale = blink.current > 0 ? 0.08 : 1;
    if (eyeLRef.current) eyeLRef.current.scale.y = eyeScale;
    if (eyeRRef.current) eyeRRef.current.scale.y = eyeScale;
    if (hatRef.current) hatRef.current.rotation.y = Math.sin(t * 1.5) * 0.08;
    if (wingsRef.current) {
      wingsRef.current.children.forEach((w, i) => {
        w.rotation.y = (i === 0 ? 1 : -1) * (0.5 + Math.sin(t * (anim === "fly" ? 12 : 4)) * 0.45);
      });
    }
  });

  const furMat = useMemo(() => new THREE.MeshStandardMaterial({ color: fur, roughness: 0.85 }), [fur]);
  const bellyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: belly, roughness: 0.9 }), [belly]);
  const earMat = useMemo(() => new THREE.MeshStandardMaterial({ color: ear, roughness: 0.8 }), [ear]);
  const eyeWhiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3 }), []);
  const pupilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: eye, roughness: 0.2 }), [eye]);
  const noseMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ff8fa3", roughness: 0.5 }), []);
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7a3b3b", roughness: 0.6 }), []);

  const bodyY = 0.62;

  return (
    <group ref={groupRef} scale={[scale * chubby, scale, scale * chubby]}>
      {/* sombra */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      {/* corpo */}
      <mesh ref={bodyRef} position={[0, bodyY, 0]} castShadow material={furMat}>
        <sphereGeometry args={[0.5, 24, 20]} />
      </mesh>
      <mesh position={[0, bodyY - 0.08, 0.28]} material={bellyMat}>
        <sphereGeometry args={[0.32, 18, 14]} />
      </mesh>

      {/* cauda */}
      <mesh ref={tailRef} position={[0, bodyY + 0.05, -0.48]} material={bellyMat}>
        <sphereGeometry args={[0.16, 12, 10]} />
      </mesh>

      {/* pernas */}
      <mesh ref={legLRef} position={[-0.24, 0.22, 0.12]} castShadow material={furMat}>
        <capsuleGeometry args={[0.12, 0.22, 4, 10]} />
      </mesh>
      <mesh ref={legRRef} position={[0.24, 0.22, 0.12]} castShadow material={furMat}>
        <capsuleGeometry args={[0.12, 0.22, 4, 10]} />
      </mesh>
      {/* patinhas */}
      <mesh position={[-0.24, 0.06, 0.16]} material={bellyMat}>
        <sphereGeometry args={[0.13, 10, 8]} />
      </mesh>
      <mesh position={[0.24, 0.06, 0.16]} material={bellyMat}>
        <sphereGeometry args={[0.13, 10, 8]} />
      </mesh>

      {/* braços */}
      <mesh ref={armLRef} position={[-0.46, bodyY + 0.05, 0.05]} castShadow material={furMat}>
        <capsuleGeometry args={[0.1, 0.24, 4, 10]} />
      </mesh>
      <mesh ref={armRRef} position={[0.46, bodyY + 0.05, 0.05]} castShadow material={furMat}>
        <capsuleGeometry args={[0.1, 0.24, 4, 10]} />
      </mesh>

      {/* cabeça */}
      <group ref={headRef} position={[0, bodyY + 0.52, 0.06]}>
        <mesh castShadow material={furMat}>
          <sphereGeometry args={[0.42, 24, 20]} />
        </mesh>
        <mesh position={[0, -0.05, 0.3]} material={bellyMat}>
          <sphereGeometry args={[0.24, 16, 12]} />
        </mesh>

        {/* olhos */}
        <group ref={eyeLRef} position={[-0.17, 0.08, 0.34]}>
          <mesh material={eyeWhiteMat}>
            <sphereGeometry args={[0.1, 14, 12]} />
          </mesh>
          <mesh position={[0, 0, 0.055]} material={pupilMat}>
            <sphereGeometry args={[0.055, 12, 10]} />
          </mesh>
          <mesh position={[0.02, 0.025, 0.095]} material={eyeWhiteMat}>
            <sphereGeometry args={[0.018, 8, 8]} />
          </mesh>
        </group>
        <group ref={eyeRRef} position={[0.17, 0.08, 0.34]}>
          <mesh material={eyeWhiteMat}>
            <sphereGeometry args={[0.1, 14, 12]} />
          </mesh>
          <mesh position={[0, 0, 0.055]} material={pupilMat}>
            <sphereGeometry args={[0.055, 12, 10]} />
          </mesh>
          <mesh position={[0.02, 0.025, 0.095]} material={eyeWhiteMat}>
            <sphereGeometry args={[0.018, 8, 8]} />
          </mesh>
        </group>

        {/* bochechas */}
        <mesh position={[-0.3, -0.06, 0.22]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color={blushColor} transparent opacity={anim === "happy" || anim === "play" ? 0.75 : 0.35} />
        </mesh>
        <mesh position={[0.3, -0.06, 0.22]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color={blushColor} transparent opacity={anim === "happy" || anim === "play" ? 0.75 : 0.35} />
        </mesh>

        {/* nariz + boca */}
        <mesh position={[0, -0.02, 0.52]} material={noseMat}>
          <sphereGeometry args={[0.05, 10, 8]} />
        </mesh>
        <mesh ref={mouthRef} position={[0, -0.12, 0.48]} material={mouthMat}>
          <sphereGeometry args={[0.045, 10, 8]} />
        </mesh>
        <mesh ref={smileRef} position={[0, -0.1, 0.47]} rotation={[Math.PI / 2, 0, 0]} material={mouthMat}>
          <torusGeometry args={[0.07, 0.016, 8, 14, Math.PI]} />
        </mesh>

        {/* orelhas */}
        {isLongEared && (
          <>
            <group ref={earLRef} position={[-0.2, 0.32, -0.02]}>
              <mesh position={[0, 0.32, 0]} castShadow material={furMat}>
                <capsuleGeometry args={[0.09, 0.42, 4, 10]} />
              </mesh>
              <mesh position={[0, 0.32, 0.05]} material={earMat}>
                <capsuleGeometry args={[0.05, 0.32, 4, 8]} />
              </mesh>
            </group>
            <group ref={earRRef} position={[0.2, 0.32, -0.02]}>
              <mesh position={[0, 0.32, 0]} castShadow material={furMat}>
                <capsuleGeometry args={[0.09, 0.42, 4, 10]} />
              </mesh>
              <mesh position={[0, 0.32, 0.05]} material={earMat}>
                <capsuleGeometry args={[0.05, 0.32, 4, 8]} />
              </mesh>
            </group>
          </>
        )}
        {isRoundEared && (
          <>
            <group ref={earLRef} position={[-0.3, 0.3, 0]}>
              <mesh castShadow material={isPandaLike(species) ? pupilMat : furMat}>
                <sphereGeometry args={[0.14, 12, 10]} />
              </mesh>
            </group>
            <group ref={earRRef} position={[0.3, 0.3, 0]}>
              <mesh castShadow material={isPandaLike(species) ? pupilMat : furMat}>
                <sphereGeometry args={[0.14, 12, 10]} />
              </mesh>
            </group>
          </>
        )}
        {(isPointy || isDog || isDragon) && (
          <>
            <group ref={earLRef} position={[-0.26, 0.3, 0]}>
              <mesh castShadow material={furMat} rotation={[0, 0, 0.3]}>
                <coneGeometry args={[0.12, 0.34, 4]} />
              </mesh>
            </group>
            <group ref={earRRef} position={[0.26, 0.3, 0]}>
              <mesh castShadow material={furMat} rotation={[0, 0, -0.3]}>
                <coneGeometry args={[0.12, 0.34, 4]} />
              </mesh>
            </group>
          </>
        )}
        {isDog && (
          <group ref={earLRef} position={[-0.34, 0.12, 0.08]}>
            <mesh castShadow material={furMat} scale={[1, 1.4, 0.5]} position={[0, -0.12, 0]}>
              <sphereGeometry args={[0.13, 12, 10]} />
            </mesh>
          </group>
        )}
        {isDog && (
          <group ref={earRRef} position={[0.34, 0.12, 0.08]}>
            <mesh castShadow material={furMat} scale={[1, 1.4, 0.5]} position={[0, -0.12, 0]}>
              <sphereGeometry args={[0.13, 12, 10]} />
            </mesh>
          </group>
        )}

        {/* chifres / chifre mágico */}
        {isDragon && (
          <>
            <mesh position={[-0.16, 0.42, -0.05]} rotation={[0.4, 0, 0.3]} material={mouthMat}>
              <coneGeometry args={[0.05, 0.24, 6]} />
            </mesh>
            <mesh position={[0.16, 0.42, -0.05]} rotation={[0.4, 0, -0.3]} material={mouthMat}>
              <coneGeometry args={[0.05, 0.24, 6]} />
            </mesh>
          </>
        )}
        {isUnicorn && (
          <mesh position={[0, 0.55, 0.1]} rotation={[0.35, 0, 0]} material={new THREE.MeshStandardMaterial({ color: "#ffd9ec", emissive: "#ff9de2", emissiveIntensity: 0.4, roughness: 0.3 })}>
            <coneGeometry args={[0.07, 0.5, 8]} />
          </mesh>
        )}

        {/* roupas */}
        {clothes.shirt && (
          <mesh position={[0, bodyY - 0.28, 0.02]} material={shirtMat(clothes.shirt)}>
            <sphereGeometry args={[0.52, 18, 14]} />
          </mesh>
        )}
        {clothes.hat && (
          <group ref={hatRef} position={[0, 0.42, 0.02]}>
            <HatMesh id={clothes.hat} furMat={furMat} />
          </group>
        )}
        {clothes.acc === "glasses" && (
          <group position={[0, 0.08, 0.42]}>
            <mesh material={new THREE.MeshStandardMaterial({ color: "#222", roughness: 0.2, metalness: 0.6 })}>
              <torusGeometry args={[0.11, 0.015, 8, 16]} />
            </mesh>
            <mesh position={[0.34, 0, 0]} material={new THREE.MeshStandardMaterial({ color: "#222", roughness: 0.2, metalness: 0.6 })}>
              <torusGeometry args={[0.11, 0.015, 8, 16]} />
            </mesh>
            <mesh position={[0.17, 0, 0]} material={new THREE.MeshStandardMaterial({ color: "#222", roughness: 0.2, metalness: 0.6 })}>
              <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
            </mesh>
          </group>
        )}
        {clothes.acc === "bow" && (
          <group position={[0.28, 0.28, 0.05]} rotation={[0, 0, -0.4]}>
            <mesh material={new THREE.MeshStandardMaterial({ color: "#ff6b9d", roughness: 0.5 })}>
              <coneGeometry args={[0.07, 0.14, 4]} />
            </mesh>
            <mesh position={[0.1, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={new THREE.MeshStandardMaterial({ color: "#ff6b9d", roughness: 0.5 })}>
              <coneGeometry args={[0.07, 0.14, 4]} />
            </mesh>
          </group>
        )}
        {clothes.acc === "collar" && (
          <mesh position={[0, -0.32, 0.12]} rotation={[0.4, 0, 0]} material={new THREE.MeshStandardMaterial({ color: "#c0392b", roughness: 0.4 })}>
            <torusGeometry args={[0.2, 0.035, 8, 18]} />
          </mesh>
        )}
        {clothes.acc === "halo" && (
          <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2.3, 0, 0]} material={new THREE.MeshStandardMaterial({ color: "#ffe082", emissive: "#ffca28", emissiveIntensity: 0.8, roughness: 0.3 })}>
            <torusGeometry args={[0.16, 0.025, 8, 20]} />
          </mesh>
        )}
        {clothes.acc === "wings" && (
          <group ref={wingsRef} position={[0, bodyY + 0.1, -0.4]}>
            <mesh position={[-0.25, 0.1, 0]} rotation={[0, 0.5, 0.3]} material={new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.85, roughness: 0.4 })} scale={[1, 1.4, 0.15]}>
              <sphereGeometry args={[0.28, 12, 10]} />
            </mesh>
            <mesh position={[0.25, 0.1, 0]} rotation={[0, -0.5, -0.3]} material={new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.85, roughness: 0.4 })} scale={[1, 1.4, 0.15]}>
              <sphereGeometry args={[0.28, 12, 10]} />
            </mesh>
          </group>
        )}
      </group>

      {/* bolhas de banho */}
      {anim === "bath" && <BathBubbles />}

      {/* fala */}
      {speak && (
        <Html position={[0, 2.1, 0]} center distanceFactor={9} zIndexRange={[20, 0]}>
          <div key={bubbleKey} className="speech anim-pop rounded-2xl border border-white/20 bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-slate-800 shadow-xl" style={{ fontFamily: "Nunito, sans-serif" }}>
            {speak}
            <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 bg-white/95" />
          </div>
        </Html>
      )}
      {anim === "sleep" && (
        <Html position={[0.6, 1.6, 0]} center distanceFactor={9} zIndexRange={[20, 0]}>
          <div style={{ fontFamily: "Fredoka, sans-serif" }} className="anim-float text-sm font-bold text-sky-300">
            <span className="inline-block anim-bubble">Z</span>
            <span className="inline-block anim-bubble" style={{ animationDelay: "0.3s" }}>z</span>
            <span className="inline-block anim-bubble" style={{ animationDelay: "0.6s" }}>z</span>
          </div>
        </Html>
      )}
      {foodEmoji && anim === "eat" && (
        <Html position={[0, 1.9, 0.6]} center distanceFactor={9} zIndexRange={[20, 0]}>
          <div className="anim-float text-2xl">{foodEmoji}</div>
        </Html>
      )}
      {sick && (
        <Html position={[0.4, 1.7, 0]} center distanceFactor={9} zIndexRange={[20, 0]}>
          <div className="anim-float text-base">🤒</div>
        </Html>
      )}
    </group>
  );
}

function isPandaLike(s: SpeciesId) { return s === "panda"; }

function shirtMat(id: string) {
  const colors: Record<string, string> = {
    tshirt: "#4fc3f7", hoodie: "#ff8a65", jacket: "#7e57c2",
  };
  return new THREE.MeshStandardMaterial({ color: colors[id] ?? "#888", roughness: 0.8 });
}

function HatMesh({ id, furMat }: { id: string; furMat: THREE.Material }) {
  void furMat;
  if (id === "cap") {
    return (
      <group>
        <mesh material={new THREE.MeshStandardMaterial({ color: "#ef5350", roughness: 0.6 })}>
          <sphereGeometry args={[0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0, 0.2]} material={new THREE.MeshStandardMaterial({ color: "#c62828", roughness: 0.6 })}>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 14]} />
        </mesh>
      </group>
    );
  }
  if (id === "straw") {
    return (
      <group>
        <mesh material={new THREE.MeshStandardMaterial({ color: "#ffe082", roughness: 0.8 })}>
          <coneGeometry args={[0.2, 0.22, 12]} />
        </mesh>
        <mesh position={[0, -0.08, 0.06]} material={new THREE.MeshStandardMaterial({ color: "#ffca28", roughness: 0.8 })}>
          <cylinderGeometry args={[0.38, 0.38, 0.04, 16]} />
        </mesh>
      </group>
    );
  }
  if (id === "helmet") {
    return (
      <group>
        <mesh material={new THREE.MeshStandardMaterial({ color: "#90a4ae", metalness: 0.6, roughness: 0.35 })}>
          <sphereGeometry args={[0.26, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
        </mesh>
        <mesh position={[0, 0.02, 0.16]} material={new THREE.MeshStandardMaterial({ color: "#263238", metalness: 0.4, roughness: 0.2 })}>
          <boxGeometry args={[0.3, 0.08, 0.05]} />
        </mesh>
      </group>
    );
  }
  if (id === "crown") {
    return (
      <group>
        <mesh material={new THREE.MeshStandardMaterial({ color: "#ffd54f", metalness: 0.7, roughness: 0.25, emissive: "#ff8f00", emissiveIntensity: 0.25 })}>
          <cylinderGeometry args={[0.24, 0.26, 0.16, 6]} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.2, 0.12, Math.sin((i / 5) * Math.PI * 2) * 0.2]} material={new THREE.MeshStandardMaterial({ color: "#ffd54f", metalness: 0.7, roughness: 0.25 })}>
            <coneGeometry args={[0.05, 0.12, 4]} />
          </mesh>
        ))}
        <mesh position={[0, 0.02, 0.24]} material={new THREE.MeshStandardMaterial({ color: "#ef5350", roughness: 0.3 })}>
          <sphereGeometry args={[0.04, 8, 8]} />
        </mesh>
      </group>
    );
  }
  return null;
}

function BathBubbles() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      const ph = (t * 0.7 + i * 0.37) % 1;
      c.position.y = ph * 0.9;
      const s = (1 - ph) * 0.9 + 0.1;
      c.scale.setScalar(s);
      ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.7 * (1 - ph);
    });
  });
  return (
    <group ref={ref}>
      {[-0.4, 0.4, -0.2, 0.2, 0].map((x, i) => (
        <mesh key={i} position={[x, 0.2, (i % 2) * 0.3 - 0.15]}>
          <sphereGeometry args={[0.08 + (i % 3) * 0.03, 8, 8]} />
          <meshStandardMaterial color="#b3e5fc" transparent opacity={0.6} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}
