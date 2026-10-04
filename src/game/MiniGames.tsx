// ============================================================
// FORGE PET — Minijogos 3D
// 1) Coletor de Moedas  2) Corrida  3) Acertar Alvos
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useForge } from "../state/store";
import PetModel from "./PetModel";
import { input, pollKeyboard, consumeJump } from "./input";
import { clearColliders, addCollider } from "./collision";
import { setMiniHud } from "./miniHud";
import { sound } from "../audio/sound";

// ---------- controlador compartilhado ----------
function MiniPet({ groupRef, onJump }: { groupRef: React.RefObject<THREE.Group | null>; onJump?: () => void }) {
  const pos = useRef({ x: 0, z: 0 });
  const y = useRef(0);
  const vy = useRef(0);
  const rotY = useRef(0);
  const grounded = useRef(true);
  const [anim, setAnim] = useState("idle");
  const animRef = useRef("idle");

  useEffect(() => {
    clearColliders();
    addCollider({ minX: -14, maxX: 14, minZ: -14, maxZ: 14 });
    return () => clearColliders();
  }, []);

  useFrame((state, dt) => {
    pollKeyboard();
    let mx = input.mx, mz = input.mz;
    const moving = mx !== 0 || mz !== 0;
    if (moving) {
      const camera = state.camera;
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      fwd.y = 0; fwd.normalize();
      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).negate();
      const dir = new THREE.Vector3().addScaledVector(fwd, -mz).addScaledVector(right, mx).normalize();
      const targetRot = Math.atan2(dir.x, dir.z);
      let diff = targetRot - rotY.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      rotY.current += diff * Math.min(1, dt * 10);
      const speed = input.run ? 6 : 3.2;
      pos.current.x += dir.x * speed * dt;
      pos.current.z += dir.z * speed * dt;
      if (consumeJump() && grounded.current) { vy.current = 6; grounded.current = false; onJump?.(); sound.jump(); }
    }
    if (!grounded.current) {
      vy.current -= 15 * dt;
      y.current += vy.current * dt;
      if (y.current <= 0) { y.current = 0; vy.current = 0; grounded.current = true; }
    }
    let eff = animRef.current;
    if (moving) eff = input.run ? "run" : "walk";
    else eff = "idle";
    if (eff !== animRef.current) { animRef.current = eff; setAnim(eff); }
    if (groupRef.current) groupRef.current.position.set(pos.current.x, y.current, pos.current.z);
    if (groupRef.current) groupRef.current.rotation.y = rotY.current;
  });

  const roster = useForge((s) => s.roster);
  const activePet = useForge((s) => s.activePet);
  const pet = roster[activePet];
  if (!pet) return null;
  return (
    <group ref={groupRef}>
      <PetModel species={pet.species} fur={pet.fur} belly={pet.belly} ear={pet.ear} eye={pet.eye} clothes={pet.clothes} anim={anim} moving speed={input.run ? 1 : 0.5} sick={false} />
    </group>
  );
}

function MiniCamera({ pos }: { pos: React.MutableRefObject<{ x: number; z: number }> }) {
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3 } | null;
  useFrame(() => {
    if (controls) controls.target.lerp(new THREE.Vector3(pos.current.x, 1, pos.current.z), 0.2);
  });
  return null;
}

// ---------- Jogo 1: Coletor de Moedas ----------
function CoinCollector() {
  const groupRef = useRef<THREE.Group>(null);
  const pos = useRef({ x: 0, z: 0 });
  const [coins, setCoins] = useState<{ id: number; x: number; z: number }[]>([]);
  const [, setScore] = useState(0);
  const [, setTime] = useState(45);
  const [over, setOver] = useState(false);
  const coinsRef = useRef(coins);
  coinsRef.current = coins;
  const scoreRef = useRef(0);
  const idRef = useRef(1);

  useEffect(() => {
    sound.gameStart();
    setMiniHud({ label: "Coletor de Moedas" });
    const initial = Array.from({ length: 5 }, () => ({ id: idRef.current++, x: (Math.random() - 0.5) * 22, z: (Math.random() - 0.5) * 22 }));
    setCoins(initial);
    const timer = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setOver(true);
          setMiniHud({ over: true });
          sound.gameEnd();
          finish(scoreRef.current);
          return 0;
        }
        setMiniHud({ time: t - 1 });
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (over) return;
    setCoins((cs) => {
      const hit = cs.find((c) => Math.hypot(c.x - pos.current.x, c.z - pos.current.z) < 1);
      if (hit) {
        scoreRef.current++;
        setScore(scoreRef.current);
        sound.coin();
        addXPmine(3);
        return [...cs.filter((c) => c.id !== hit.id), { id: idRef.current++, x: (Math.random() - 0.5) * 22, z: (Math.random() - 0.5) * 22 }];
      }
      return cs;
    });
  });

  useFrame(() => { pos.current = { x: groupRef.current?.position.x ?? 0, z: groupRef.current?.position.z ?? 0 }; });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#5fbf6a" roughness={1} />
      </mesh>
      {[-15, 15].map((x) => (
        <mesh key={x} position={[x, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[30, 2]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
      ))}
      {[1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[-12 + i * 5, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[30, 2]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
      ))}
      {coins.map((c) => (
        <group key={c.id} position={[c.x, 0.7, c.z]}>
          <mesh>
            <cylinderGeometry args={[0.35, 0.35, 0.08, 16]} />
            <meshStandardMaterial color="#ffd54f" metalness={0.7} roughness={0.3} emissive="#ff8f00" emissiveIntensity={0.35} />
          </mesh>
        </group>
      ))}
      <MiniPet groupRef={groupRef} />
      <MiniCamera pos={pos} />
      <OrbitControls makeDefault enablePan={false} minDistance={4} maxDistance={14} maxPolarAngle={Math.PI / 2.2} target={[0, 1, 0]} enableDamping />
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 14, 6]} intensity={1.3} castShadow />
    </group>
  );
}

function addXPmine(n: number) {
  useForge.getState().addXP(n);
}

function finish(score: number) {
  const s = useForge.getState();
  const coins = score * 5;
  s.addCoins(coins);
  s.stats.games++;
  if (score >= 8) { s.stats.wins++; s.notifyMsg("🏆", "Você venceu o Coletor!"); }
  s.notifyMsg("🪙", `Coletor: +${coins} moedas`);
  sound.success();
}

// ---------- Jogo 2: Corrida ----------
function RaceGame() {
  const groupRef = useRef<THREE.Group>(null);
  const pos = useRef({ x: 0, z: 0 });
  const y = useRef(0);
  const vy = useRef(0);
  const grounded = useRef(true);
  const [, setTime] = useState(0);
  const [, setOver] = useState(false);
  const [stumble, setStumble] = useState(0);
  const hurdles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ z: 8 + i * 5.5, x: (i % 3 - 1) * 2.2 })), []);
  const hurdlesRef = useRef(hurdles);
  const timeRef = useRef(0);
  const overRef = useRef(false);

  useEffect(() => {
    sound.gameStart();
    clearColliders();
    return () => clearColliders();
  }, []);

  useFrame((state, dt) => {
    if (overRef.current) return;
    dt = Math.min(dt, 0.05);
    timeRef.current += dt;
    setTime(timeRef.current);
    const speed = 8 - stumble * 5;
    pos.current.z += speed * dt;
    // pulo
    if (consumeJump() && grounded.current) { vy.current = 6.4; grounded.current = false; sound.jump(); }
    if (!grounded.current) {
      vy.current -= 15 * dt;
      y.current += vy.current * dt;
      if (y.current <= 0) { y.current = 0; vy.current = 0; grounded.current = true; }
    }
    // colisão com barreiras
    for (const h of hurdlesRef.current) {
      if (Math.abs(h.z - pos.current.z) < 0.6 && Math.abs(h.x - pos.current.x) < 0.7 && y.current < 0.55) {
        if (stumble <= 0) { setStumble(1); sound.hurt(); }
      }
    }
    setStumble((s) => Math.max(0, s - dt * 1.5));
    // fim
    if (pos.current.z >= 8 + 14 * 5.5 + 4) {
      overRef.current = true;
      setOver(true);
      sound.gameEnd();
      finishRace(timeRef.current);
    }
    if (groupRef.current) {
      groupRef.current.position.set(pos.current.x, y.current, pos.current.z);
      groupRef.current.rotation.y = Math.PI;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 18) * 0.04 * (stumble > 0 ? 3 : 1);
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 45]} receiveShadow>
        <planeGeometry args={[16, 110]} />
        <meshStandardMaterial color="#e8c98a" roughness={1} />
      </mesh>
      {[-7, 7].map((x) => (
        <mesh key={x} position={[x, 0.5, 45]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[110, 1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* linha de chegada */}
      <mesh position={[0, 0.06, 8 + 14 * 5.5 + 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 1.6]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
      {hurdles.map((h, i) => (
        <group key={i} position={[h.x, 0, h.z]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.9, 0.7, 0.35]} />
            <meshStandardMaterial color={i % 2 ? "#ef5350" : "#42a5f5"} />
          </mesh>
        </group>
      ))}
      {/* galhos decorativos */}
      {Array.from({ length: 10 }).map((_, i) => (
        <group key={i} position={[i % 2 ? 9 : -9, 0, i * 11]}>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.8, 8, 8]} />
            <meshStandardMaterial color="#43a047" />
          </mesh>
        </group>
      ))}
      <group ref={groupRef} />
      <MiniPet groupRef={groupRef} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 14, 6]} intensity={1.3} castShadow />
      <OrbitControls makeDefault enablePan={false} minDistance={5} maxDistance={12} maxPolarAngle={Math.PI / 2.2} target={[0, 1, 0]} enableDamping />
    </group>
  );
}

function finishRace(time: number) {
  const s = useForge.getState();
  const coins = Math.max(20, Math.round(140 - time * 4));
  s.addCoins(coins);
  s.addXP(40);
  s.stats.games++;
  if (time < 18) { s.stats.wins++; s.notifyMsg("🏆", "Você venceu a Corrida!"); }
  s.notifyMsg("🏁", `Corrida: ${time.toFixed(1)}s — +${coins} moedas`);
  sound.success();
}

// ---------- Jogo 3: Alvos ----------
function TargetsGame() {
  const [targets, setTargets] = useState<{ id: number; hole: number; up: boolean }[]>([]);
  const [, setScore] = useState(0);
  const [, setTime] = useState(40);
  const [, setOver] = useState(false);
  const scoreRef = useRef(0);
  const idRef = useRef(1);

  useEffect(() => {
    sound.gameStart();
    const iv = setInterval(() => {
      setTargets((ts) => {
        const next = ts.filter((t) => t.up);
        if (next.length < 3 && Math.random() < 0.75) {
          const hole = Math.floor(Math.random() * 9);
          if (!next.find((t) => t.hole === hole)) next.push({ id: idRef.current++, hole, up: true });
        }
        return next;
      });
    }, 650);
    const timer = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(timer);
          clearInterval(iv);
          setOver(true);
          sound.gameEnd();
          finishTargets(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { clearInterval(iv); clearInterval(timer); };
  }, []);

  const hit = (id: number) => {
    setTargets((ts) => ts.filter((t) => t.id !== id));
    scoreRef.current++;
    setScore(scoreRef.current);
    sound.pop();
  };

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#5fbf6a" roughness={1} />
      </mesh>
      {/* parede de alvos */}
      <mesh position={[0, 1.5, -6]}>
        <boxGeometry args={[10, 3.4, 0.4]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = (col - 1) * 2.6, y = 0.9 + row * 1.1;
        const t = targets.find((tt) => tt.hole === i);
        return (
          <group key={i} position={[x, y, -5.7]}>
            <mesh>
              <cylinderGeometry args={[0.55, 0.55, 0.1, 16]} />
              <meshStandardMaterial color="#3e2723" />
            </mesh>
            {t && (
              <group position={[0, 0, 0.15]}>
                <mesh onClick={() => hit(t.id)} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "default")}>
                  <cylinderGeometry args={[0.45, 0.45, 0.12, 16]} />
                  <meshStandardMaterial color="#ef5350" emissive="#c62828" emissiveIntensity={0.4} />
                </mesh>
                <mesh position={[0, 0, 0.08]}>
                  <cylinderGeometry args={[0.2, 0.2, 0.13, 12]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 12, 8]} intensity={1.2} castShadow />
      <OrbitControls makeDefault enablePan={false} minDistance={5} maxDistance={16} target={[0, 1.2, 0]} enableDamping />
    </group>
  );
}

function finishTargets(score: number) {
  const s = useForge.getState();
  const coins = score * 4;
  s.addCoins(coins);
  s.addXP(score * 3);
  s.stats.games++;
  if (score >= 12) { s.stats.wins++; s.notifyMsg("🏆", "Você é um atirador de elite!"); }
  s.notifyMsg("🎯", `Alvos: +${coins} moedas`);
  sound.success();
}

// ---------- Canvas + HUD ----------
export function MiniGameCanvas({ type }: { type: "collector" | "race" | "targets" }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 6, 10], fov: 50 }}>
      {type === "collector" && <CoinCollector />}
      {type === "race" && <RaceGame />}
      {type === "targets" && <TargetsGame />}
    </Canvas>
  );
}
