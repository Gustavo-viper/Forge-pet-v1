// ============================================================
// FORGE PET — Cena principal: casa, jardim, parque, veterinária,
// florestas, praia, cidade + controlador do pet + ciclo dia/noite
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useForge } from "../state/store";
import PetModel from "./PetModel";
import Furniture, { GardenTree, Fence, BenchSimple, LampPost } from "./Furniture";
import { clearColliders, addCollider, resolveCollisions, boxCollider, setDynamicColliders } from "./collision";
import { input, pollKeyboard, consumeJump, consumeInteract } from "./input";
import { setInteract } from "./interact";
import { sound } from "../audio/sound";

// ---------- Cores da casa ----------
const WALL = "#f3e9d2";
const FLOOR = "#c9a06c";
const FLOOR2 = "#b98d5e";
const GRASS = "#7ec850";
const SAND = "#f2e2b8";

function wall(x: number, z: number, w: number, d: number, h = 4, color = WALL) {
  return (
    <group>
      <mesh position={[x, h / 2, z]} castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color, roughness: 0.9 })}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh position={[x, h + 0.08, z]} material={new THREE.MeshStandardMaterial({ color: "#8d6e63", roughness: 0.8 })}>
        <boxGeometry args={[w + 0.15, 0.16, d + 0.15]} />
      </mesh>
    </group>
  );
}

function window4(x: number, z: number, rotY: number) {
  return (
    <group position={[x, 2.1, z]} rotation={[0, rotY, 0]}>
      <mesh>
        <boxGeometry args={[1.4, 1.1, 0.08]} />
        <meshStandardMaterial color="#b3e5fc" emissive="#4fc3f7" emissiveIntensity={0.25} roughness={0.2} />
      </mesh>
      <mesh material={new THREE.MeshStandardMaterial({ color: "#8d6e63" })}>
        <boxGeometry args={[1.55, 0.1, 0.1]} />
      </mesh>
    </group>
  );
}

// ---------- Controlador do pet ----------
function PetRig() {
  const groupRef = useRef<THREE.Group>(null);
  const pos = useRef({ x: -5, z: 4 });
  const vy = useRef(0);
  const y = useRef(0);
  const rotY = useRef(0);
  const grounded = useRef(true);
  const aiTarget = useRef<{ x: number; z: number } | null>(null);
  const aiTimer = useRef(0);
  const stepT = useRef(0);
  const lastStorePos = useRef({ x: -5, z: 4 });
  const lastArea = useRef("casa");
  const [anim, setAnim] = useState("idle");
  const animRef = useRef("idle");
  const areaRef = useRef("casa");

  const roster = useForge((s) => s.roster);
  const activePet = useForge((s) => s.activePet);
  const sleeping = useForge((s) => s.sleeping);
  const aiMode = useForge((s) => s.aiMode);
  const sick = useForge((s) => s.sick);
  const placeCount = useForge((s) => s.placed.length);

  useEffect(() => { clearColliders(); }, []);
  // remove colisão do portão do parque se bloqueado — tratado no frame
  useEffect(() => { void placeCount; }, [placeCount]);

  useFrame((state, dt) => {
    const s = useForge.getState();
    const pet = roster[activePet];
    if (!pet) return;
    dt = Math.min(dt, 0.05);

    // ----- input -----
    pollKeyboard();
    let mx = input.mx, mz = input.mz;
    const running = input.run || s.settings.sensitivity > 1.5;

    // ----- IA -----
    if (aiMode && !sleeping && mx === 0 && mz === 0) {
      aiTimer.current -= dt;
      if (aiTimer.current <= 0 || !aiTarget.current) {
        aiTimer.current = 2.5 + Math.random() * 2;
        const n = s.needs;
        const spots = [
          { x: 9.3, z: 1, w: n.hunger < 45 },   // geladeira
          { x: 5, z: 4.5, w: n.thirst < 45 },   // mesa água
          { x: -8, z: -6, w: n.sleep < 35 || n.energy < 30 }, // cama
          { x: -8, z: 6, w: n.happiness < 45 }, // bola
          { x: 0, z: 16, w: false },            // fonte jardim
          { x: -5 + Math.random() * 10, z: 2 + Math.random() * 4, w: false },
        ];
        const hungry = spots.filter((sp) => sp.w);
        aiTarget.current = hungry.length
          ? { x: hungry[Math.floor(Math.random() * hungry.length)].x, z: hungry[Math.floor(Math.random() * hungry.length)].z }
          : { x: -8 + Math.random() * 16, z: -6 + Math.random() * 12 };
      }
      const dx = aiTarget.current.x - pos.current.x;
      const dz = aiTarget.current.z - pos.current.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.6) { mx = dx / d; mz = dz / d; }
      else { aiTarget.current = null; mx = 0; mz = 0; }
    }

    // ----- movimento (câmera relativo) -----
    const moving = mx !== 0 || mz !== 0;
    let speed = 0;
    if (moving && !sleeping) {
      speed = running ? 5.4 : 2.7;
  const camera = state.camera;
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      fwd.y = 0; fwd.normalize();
      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).negate();
      const dir = new THREE.Vector3()
        .addScaledVector(fwd, -mz)
        .addScaledVector(right, mx)
        .normalize();
      const targetRot = Math.atan2(dir.x, dir.z);
      let diff = targetRot - rotY.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      rotY.current += diff * Math.min(1, dt * 10);
      const nx = pos.current.x + dir.x * speed * dt;
      const nz = pos.current.z + dir.z * speed * dt;
      const [rx, rz] = resolveCollisions(nx, nz, 0.35);
      const moved = Math.hypot(rx - pos.current.x, rz - pos.current.z);
      s.stats.distance += moved;
      pos.current.x = rx; pos.current.z = rz;

      // pulo
      if (consumeJump() && grounded.current) { vy.current = 5.6; grounded.current = false; sound.jump(); }
    }
    // gravidade
    if (!grounded.current) {
      vy.current -= 15 * dt;
      y.current += vy.current * dt;
      if (y.current <= 0) { y.current = 0; vy.current = 0; grounded.current = true; }
    }

    // ----- animação efetiva -----
    const tempAnims = ["eat", "drink", "bath", "play", "sit", "happy", "sad", "tired", "sick"];
    let eff = animRef.current;
    if (sleeping) eff = "sleep";
    else if (tempAnims.includes(s.anim) && Date.now() < s.animUntil) eff = s.anim;
    else if (moving) eff = running ? "run" : "walk";
    else eff = "idle";
    if (eff !== animRef.current) { animRef.current = eff; setAnim(eff); }

    // ----- sons de passo -----
    if (moving && grounded.current) {
      stepT.current -= dt * (running ? 1.6 : 1);
      if (stepT.current <= 0) { stepT.current = 0.34; sound.step(); }
    }

    // ----- posição no store (节流) -----
    const now = performance.now();
    if (now - (PetRig as unknown as { _t?: number })._t! > 120) {
      (PetRig as unknown as { _t?: number })._t = now;
      useForge.getState().setPetPos(pos.current.x, pos.current.z);
      void lastStorePos;
    }

    // ----- área / caminhada -----
    const area = detectArea(pos.current.x, pos.current.z);
    if (area !== lastArea.current) {
      lastArea.current = area;
      areaRef.current = area;
      useForge.getState().walkArea(area);
    }

    // ----- interações por proximidade -----
    const inter = nearestInteract(pos.current.x, pos.current.z);
    setInteract(inter ?? { label: "", icon: "", action: null });
    if (consumeInteract() && inter) inter.action();

    // ----- decoração: fantasma segue o pet -----
    const dt2 = useForge.getState().decorTarget;
    if (dt2) {
      const fx = pos.current.x + Math.sin(rotY.current) * 1.6;
      const fz = pos.current.z + Math.cos(rotY.current) * 1.6;
      const [rx2, rz2] = resolveCollisions(fx, fz, 0.6);
      useForge.getState().updateDecorPos(rx2, rz2);
    }

    // ----- colisões dinâmicas (móveis colocados) -----
    const dyn = useForge.getState().placed.map((p) => {
      const info = getFurnitureSize(p.id);
      return boxCollider(p.x, p.z, info[0], info[1]);
    });
    setDynamicColliders(dyn);

    // ----- aplicar transformação -----
    if (groupRef.current) {
      groupRef.current.position.set(pos.current.x, y.current, pos.current.z);
      groupRef.current.rotation.y = rotY.current;
    }
    void sick;
  });

  const pet = roster[activePet];
  if (!pet) return null;
  return (
    <group ref={groupRef}>
      <PetModel
        species={pet.species}
        fur={pet.fur}
        belly={pet.belly}
        ear={pet.ear}
        eye={pet.eye}
        clothes={pet.clothes}
        anim={anim}
        moving={anim === "walk" || anim === "run"}
        speed={anim === "run" ? 1 : 0.5}
        sick={sick}
      />
    </group>
  );
}

// ---------- utilidades de área ----------
function detectArea(x: number, z: number): string {
  if (x > -10 && x < 10 && z > -8 && z < 8) return "casa";
  if (x > -13 && x < 13 && z > 8 && z < 24) return "jardim";
  if (x > 16 && x < 22 && z > -2 && z < 8) return "veterinaria";
  if (x > -22 && x < 22 && z > 24 && z < 46) return "parque";
  if (x > -38 && x < -14 && z > 8 && z < 32) return "floresta";
  if (x > 18 && x < 42 && z > 8 && z < 32) return "praia";
  if (x > -42 && x < -18 && z > -22 && z < 2) return "cidade";
  return "jardim";
}

const FURNI_SIZES: Record<string, [number, number]> = {
  sofa: [2.4, 1], tv: [1.5, 0.4], table: [1.4, 1.4], rug: [2.6, 1.8], lamp: [0.5, 0.5],
  arcade: [1.1, 0.8], bed: [2.1, 1.4], wardrobe: [1.7, 0.6], fridge: [1, 0.85], kitchenTable: [1.5, 0.9],
  tub: [1.7, 0.8], sink: [1.1, 0.55], bench: [1.8, 0.55], tree: [1, 1], flowers: [1, 1], fountain: [2.8, 2.8],
  clock: [0.4, 0.14], painting: [1.2, 0.08], shelf: [1.4, 0.3], trophy: [0.5, 0.5],
};
function getFurnitureSize(id: string): [number, number] {
  return FURNI_SIZES[id] ?? [1, 1];
}

// ---------- interativos ----------
interface Inter { x: number; z: number; r: number; label: string; icon: string; action: () => void }

function useInteractables() {
  return useMemo<Inter[]>(() => {
    const st = () => useForge.getState();
    return [
      { x: 9.3, z: 1, r: 1.7, label: "Abrir Geladeira", icon: "🍎", action: () => st().openPanel("food") },
      { x: 5, z: 4.5, r: 1.7, label: "Beber água", icon: "💧", action: () => st().drink() },
      { x: 8, z: -6, r: 2.1, label: "Tomar banho", icon: "🛁", action: () => st().startBath() },
      { x: -8, z: -6, r: 2.2, label: "Dormir", icon: "😴", action: () => st().toggleSleep() },
      { x: -6.5, z: 5, r: 2, label: "Relaxar no sofá", icon: "🛋️", action: () => st().watchTV() },
      { x: -2, z: 7.45, r: 1.9, label: "Assistir TV", icon: "📺", action: () => st().watchTV() },
      { x: -1.5, z: -7.3, r: 1.8, label: "Guarda-Roupa", icon: "👕", action: () => st().openPanel("wardrobe") },
      { x: 9.55, z: -2, r: 1.7, label: "Espelho", icon: "🪞", action: () => st().openPanel("customize") },
      { x: -0.5, z: 7.2, r: 2, label: "Jogar Arcade", icon: "🕹️", action: () => st().openPanel("minigames") },
      { x: -8, z: 6, r: 1.6, label: "Brincar com bola", icon: "🏀", action: () => st().playToy("ball") },
      { x: 0, z: 16, r: 2.2, label: "Brincar na fonte", icon: "⛲", action: () => st().playToy("ball2") },
      { x: -5, z: 13, r: 1.6, label: "Descansar no banco", icon: "🧘", action: () => st().watchTV() },
      { x: 18, z: 4.6, r: 2.3, label: "Clínica Veterinária", icon: "🏥", action: () => {
        const s2 = st();
        if (s2.sick) s2.heal();
        else s2.notifyMsg("🏥", s2.settings.lang === "pt" ? "Tudo em ordem! Volte se o pet passar mal." : "All good!");
      } },
      { x: 0, z: 34, r: 2.3, label: "Brincar na fonte do parque", icon: "🎾", action: () => st().playToy("frisbee") },
    ];
  }, []);
}

function nearestInteract(x: number, z: number): Inter | null {
  const list = useInteractablesCache();
  let best: Inter | null = null;
  let bd = Infinity;
  for (const it of list) {
    const d = Math.hypot(it.x - x, it.z - z);
    if (d < it.r && d < bd) { bd = d; best = it; }
  }
  return best;
}

let _interCache: Inter[] = [];
function useInteractablesCache() {
  const list = useInteractables();
  if (list !== _interCache) _interCache = list;
  return _interCache;
}

// ---------- Cena ----------
export default function House() {
  const time = useForge((s) => s.time);
  const weather = useForge((s) => s.weather);
  const sleeping = useForge((s) => s.sleeping);
  const placed = useForge((s) => s.placed);
  const decorTarget = useForge((s) => s.decorTarget);
  const level = useForge((s) => s.level);
  const area = useForge((s) => s.area);
  const unlocked = useForge((s) => s.unlockedAreas);
  const settings = useForge((s) => s.settings);

  // colisões estáticas
  useEffect(() => {
    clearColliders();
    // paredes
    addCollider({ minX: -10.15, maxX: -1, minZ: 7.85, maxZ: 8.15 });
    addCollider({ minX: 1, maxX: 10.15, minZ: 7.85, maxZ: 8.15 });
    addCollider({ minX: -10.15, maxX: 10.15, minZ: -8.15, maxZ: -7.85 });
    addCollider({ minX: -10.15, maxX: -9.85, minZ: -8, maxZ: 8 });
    addCollider({ minX: 9.85, maxX: 10.15, minZ: -8, maxZ: 8 });
    addCollider({ minX: -0.15, maxX: 0.15, minZ: -8, maxZ: -4.5 });
    addCollider({ minX: -0.15, maxX: 0.15, minZ: -3.5, maxZ: 3.5 });
    addCollider({ minX: -0.15, maxX: 0.15, minZ: 4.5, maxZ: 8 });
    addCollider({ minX: -10, maxX: -5.5, minZ: -0.15, maxZ: 0.15 });
    addCollider({ minX: -4.5, maxX: 4.5, minZ: -0.15, maxZ: 0.15 });
    addCollider({ minX: 5.5, maxX: 10, minZ: -0.15, maxZ: 0.15 });
    // grade do jardim (portão da casa aberto em x -1..1)
    addCollider({ minX: -13, maxX: -1.3, minZ: 23.85, maxZ: 24.15 });
    addCollider({ minX: 1.3, maxX: 13, minZ: 23.85, maxZ: 24.15 });
    // portão do parque (bloqueado até nível 3)
    if (level < 3) {
      addCollider({ minX: -1.3, maxX: 1.3, minZ: 23.85, maxZ: 24.15 });
    }
    // veterinária
    addCollider({ minX: 15.6, maxX: 20.4, minZ: -0.2, maxZ: 3.8 });
    // floresta/praia/cidade (limites suaves)
    addCollider({ minX: -38.2, maxX: -13.8, minZ: 8, maxZ: 32 });
    addCollider({ minX: 13.8, maxX: 42.2, minZ: 8, maxZ: 32 });
    addCollider({ minX: -38, maxX: -13.8, minZ: 32.2, maxZ: 32.6 });
    void unlocked;
  }, [level, unlocked]);

  // música por área
  useEffect(() => {
    sound.playMusic(area === "casa" ? "casa" : area === "parque" ? "parque" : "jardim");
    return () => sound.stopMusic();
  }, [area]);

  const hour = time.hour;
  const sunA = ((hour - 6) / 12) * Math.PI;
  const sunH = Math.sin(sunA);
  const isNight = hour < 6 || hour >= 19.5;
  const isDusk = !isNight && sunH < 0.25;

  const skyColor = useMemo(() => {
    if (isNight) return new THREE.Color("#0b1026");
    if (isDusk) return new THREE.Color("#ff9a76").lerp(new THREE.Color("#7ec8ff"), sunH / 0.25);
    return new THREE.Color("#7ec8ff");
  }, [isNight, isDusk, sunH]);

  return (
    <group>
      {/* céu */}
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, 30, 90]} />

      {/* sol / lua */}
      <directionalLight
        position={[Math.cos(sunA) * 30, Math.max(6, sunH * 35), 12]}
        intensity={isNight ? 0.25 : weather === "rain" ? 0.5 : 1.4}
        color={isDusk ? "#ffb27a" : "#fff4e0"}
        castShadow={settings.quality !== "low"}
        shadow-mapSize-width={settings.quality === "high" ? 2048 : 1024}
        shadow-mapSize-height={settings.quality === "high" ? 2048 : 1024}
        shadow-camera-left={-45} shadow-camera-right={45}
        shadow-camera-top={45} shadow-camera-bottom={-45}
        shadow-camera-far={100}
      />
      <ambientLight intensity={isNight ? 0.35 : weather === "cloud" || weather === "rain" ? 0.55 : 0.7} color={isNight ? "#8fa3d9" : "#ffe9d6"} />
      <hemisphereLight args={[isNight ? "#334" : "#bfe3ff", isNight ? "#112" : "#7ec850", isNight ? 0.3 : 0.5]} />
      {sleeping && <pointLight position={[0, 3, 0]} intensity={0.4} color="#8fa3ff" distance={14} />}

      {/* estrelas */}
      {isNight && <Stars />}

      {/* chão gigante */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 12]} receiveShadow>
        <planeGeometry args={[140, 120]} />
        <meshStandardMaterial color={GRASS} roughness={1} />
      </mesh>

      {/* --- casa --- */}
      <group>
        {/* piso */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 16]} />
          <meshStandardMaterial color={FLOOR} roughness={0.9} />
        </mesh>
        {/* divisórias de piso */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[19.6, 15.6]} />
          <meshStandardMaterial color={FLOOR2} roughness={0.9} transparent opacity={0.35} />
        </mesh>

        {/* paredes */}
        {wall(-5.5, 8, 9, 0.3)}
        {wall(5.5, 8, 9, 0.3)}
        {wall(0, -8, 20.3, 0.3)}
        {wall(-10, 0, 0.3, 16.3)}
        {wall(10, 0, 0.3, 16.3)}
        {wall(0, -6.25, 0.3, 3.5)}
        {wall(0, 0, 0.3, 7)}
        {wall(0, 6.25, 0.3, 3.5)}
        {wall(-7.75, 0, 4.5, 0.3)}
        {wall(0, 0, 9, 0.3)}
        {wall(7.75, 0, 4.5, 0.3)}

        {/* janelas */}
        {window4(-5, 8.1, 0)}
        {window4(5, 8.1, 0)}
        {window4(-10.1, 4, Math.PI / 2)}
        {window4(10.1, -4, -Math.PI / 2)}

        {/* porta da frente */}
        <mesh position={[0, 1.4, 8.16]}>
          <boxGeometry args={[1.9, 2.8, 0.1]} />
          <meshStandardMaterial color="#8d6e63" roughness={0.7} />
        </mesh>

        {/* SALA */}
        <Furniture id="rug" x={-5} z={4} />
        <Furniture id="sofa" x={-6.5} z={5} rot={Math.PI} />
        <Furniture id="tv" x={-2} z={7.45} />
        <Furniture id="table" x={-5} z={2.2} />
        <Furniture id="lamp" x={-8.5} z={2.5} />
        <Furniture id="arcade" x={-0.5} z={7.2} rot={Math.PI} />
        <Furniture id="plant" x={-9.3} z={7.3} />
        {/* QUARTO */}
        <Furniture id="bed" x={-8} z={-6} />
        <Furniture id="wardrobe" x={-1.5} z={-7.3} />
        <Furniture id="rug" x={-5} z={-3.5} />
        {/* COZINHA */}
        <Furniture id="fridge" x={9.3} z={1} rot={-Math.PI / 2} />
        <Furniture id="kitchenTable" x={5} z={4.5} />
        <Furniture id="sink" x={9.3} z={6.5} rot={-Math.PI / 2} />
        {/* BANHEIRO */}
        <Furniture id="tub" x={8} z={-6} />
        <Furniture id="sink" x={9.3} z={-7.3} rot={-Math.PI / 2} />
        <Furniture id="painting" x={-4} z={-7.85} />
      </group>

      {/* --- jardim --- */}
      <group>
        <Fence x={-7} z={8} len={12} />
        <Fence x={7} z={8} len={12} />
        <Fence x={-13} z={16} rot={Math.PI / 2} len={16} />
        <Fence x={13} z={16} rot={Math.PI / 2} len={16} />
        <Fence x={-7} z={24} len={12} />
        <Fence x={7} z={24} len={12} />
        <GardenTree x={-8} z={12} />
        <GardenTree x={8} z={12} />
        <GardenTree x={-9} z={20} s={0.8} />
        <GardenTree x={9} z={20} s={0.8} />
        <Furniture id="fountain" x={0} z={16} />
        <Furniture id="bench" x={-5} z={13} />
        <Furniture id="bench" x={5} z={13} />
        <Furniture id="flowers" x={-3} z={11} />
        <Furniture id="flowers" x={4} z={19} />
        <Furniture id="flowers" x={-6} z={18} />
        <LampPost x={-4} z={10} />
        <LampPost x={4} z={10} />
        <LampPost x={0} z={22} />
        {/* bola de brincar */}
        <mesh position={[3, 0.25, 15]}>
          <sphereGeometry args={[0.25, 12, 10]} />
          <meshStandardMaterial color="#ff7043" roughness={0.5} />
        </mesh>
      </group>

      {/* --- parque --- */}
      <group>
        <Fence x={-11.5} z={24} len={21} />
        <Fence x={11.5} z={24} len={21} />
        <Fence x={-22} z={35} rot={Math.PI / 2} len={22} />
        <Fence x={22} z={35} rot={Math.PI / 2} len={22} />
        <Fence x={-11.5} z={46} len={21} />
        <Fence x={11.5} z={46} len={21} />
        {/* lago */}
        <mesh position={[-10, 0.03, 34]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[4, 24]} />
          <meshStandardMaterial color="#4fc3f7" roughness={0.15} />
        </mesh>
        <Furniture id="fountain" x={0} z={34} />
        <BenchSimple x={6} z={30} rot={0.4} />
        <BenchSimple x={6} z={38} rot={-0.4} />
        <BenchSimple x={-4} z={40} />
        <GardenTree x={-16} z={28} s={1.3} />
        <GardenTree x={16} z={28} s={1.3} />
        <GardenTree x={-17} z={42} s={1.1} />
        <GardenTree x={17} z={42} s={1.1} />
        <GardenTree x={12} z={44} s={0.9} />
        <Furniture id="flowers" x={-8} z={42} />
        <Furniture id="flowers" x={9} z={42} />
        <LampPost x={-8} z={26} />
        <LampPost x={8} z={26} />
        <LampPost x={0} z={44} />
        {/* playground: escorrega */}
        <group position={[10, 0, 34]}>
          <mesh position={[0, 0.75, 0]} castShadow material={new THREE.MeshStandardMaterial({ color: "#ef5350" })}>
            <boxGeometry args={[0.15, 1.5, 2.4]} />
          </mesh>
          <mesh position={[0.55, 0.35, 0.6]} rotation={[0, 0.5, 0.35]} material={new THREE.MeshStandardMaterial({ color: "#ffca28" })}>
            <boxGeometry args={[0.6, 0.08, 2.2]} />
          </mesh>
          <mesh position={[-0.5, 0.75, 0]} castShadow material={new THREE.MeshStandardMaterial({ color: "#42a5f5" })}>
            <boxGeometry args={[1, 1.5, 0.15]} />
          </mesh>
        </group>
        {/* outras pets */}
        <WanderPet x={-14} z={32} species="dog" fur="#c8a27a" />
        <WanderPet x={14} z={40} species="cat" fur="#90caf9" />
      </group>

      {/* --- veterinária --- */}
      <group position={[18, 0, 2]}>
        <mesh position={[0, 1.5, 0]} castShadow material={new THREE.MeshStandardMaterial({ color: "#eceff1", roughness: 0.8 })}>
          <boxGeometry args={[5, 3, 4]} />
        </mesh>
        <mesh position={[0, 3.1, 0]} material={new THREE.MeshStandardMaterial({ color: "#b0bec5" })}>
          <boxGeometry args={[5.3, 0.25, 4.3]} />
        </mesh>
        {/* cruz vermelha */}
        <mesh position={[0, 2, 2.02]}>
          <boxGeometry args={[0.7, 0.22, 0.06]} />
          <meshStandardMaterial color="#ef5350" emissive="#ef5350" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 2, 2.02]}>
          <boxGeometry args={[0.22, 0.7, 0.06]} />
          <meshStandardMaterial color="#ef5350" emissive="#ef5350" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 1.1, 2.02]}>
          <boxGeometry args={[1.2, 2.2, 0.08]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
      </group>

      {/* --- floresta --- */}
      <group position={[-26, 0, 20]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[12, 24]} />
          <meshStandardMaterial color="#4e9a3d" roughness={1} />
        </mesh>
        {[-6, -2, 3, 7, -8, 5, 9].map((px, i) => (
          <GardenTree key={i} x={px} z={(i % 3) * 4 - 4} s={1.1 + (i % 3) * 0.2} />
        ))}
      </group>

      {/* --- praia --- */}
      <group position={[30, 0, 20]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[12, 24]} />
          <meshStandardMaterial color={SAND} roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, -10]}>
          <circleGeometry args={[14, 24]} />
          <meshStandardMaterial color="#4fc3f7" roughness={0.15} />
        </mesh>
        {[[-6, 4], [6, 4], [0, 8]].map(([px, pz], i) => (
          <group key={i} position={[px, 0, pz]} rotation={[0, i * 1.2, 0]}>
            <mesh position={[0, 1.4, 0]} material={new THREE.MeshStandardMaterial({ color: "#8d6e63" })}>
              <cylinderGeometry args={[0.12, 0.18, 2.8, 8]} />
            </mesh>
            <mesh position={[0.5, 2.8, 0]} material={new THREE.MeshStandardMaterial({ color: "#43a047" })}>
              <sphereGeometry args={[0.9, 10, 8]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* --- cidade --- */}
      <group position={[-30, 0, -10]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[11, 24]} />
          <meshStandardMaterial color="#90a4ae" roughness={0.95} />
        </mesh>
        {[[-6, -4], [0, -6], [6, -3], [-4, 4], [5, 5]].map(([px, pz], i) => (
          <group key={i} position={[px, 0, pz]}>
            <mesh position={[0, 1.5 + (i % 3), 0]} castShadow material={new THREE.MeshStandardMaterial({ color: ["#b0bec5", "#cfd8dc", "#a1887f"][i % 3], roughness: 0.9 })}>
              <boxGeometry args={[2.4, 3 + (i % 3) * 1.5, 2.4]} />
            </mesh>
            <mesh position={[0, 3.4 + (i % 3) * 1.5, 0]} material={new THREE.MeshStandardMaterial({ color: "#78909c" })}>
              <boxGeometry args={[2.7, 0.2, 2.7]} />
            </mesh>
          </group>
        ))}
        <LampPost x={-3} z={0} />
        <LampPost x={3} z={0} />
      </group>

      {/* móveis colocados pelo jogador */}
      {placed.map((p) => (
        <Furniture key={p.uid} id={p.id} x={p.x} z={p.z} rot={p.rot} />
      ))}

      {/* fantasma de decoração */}
      {decorTarget && (
        <group>
          <Furniture id={decorTarget.id} x={decorTarget.x} z={decorTarget.z} rot={decorTarget.rot} ghost />
          <mesh position={[decorTarget.x, 0.05, decorTarget.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.05, 24]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* pet */}
      <PetRig />

      {/* clima */}
      <Weather />

      {/* controles de câmera */}
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 1, 0]}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.9 * settings.sensitivity}
      />
      <CameraRig />
    </group>
  );
}

// ---------- Câmera segue o pet ----------
function CameraRig() {
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3 } | null;
  const pos = useForge((s) => s.pos);
  useFrame(() => {
    if (controls) {
      controls.target.lerp(new THREE.Vector3(pos.x, 1, pos.z), 0.15);
    }
  });
  return null;
}

// ---------- Estrelas ----------
function Stars() {
  const ref = useRef<THREE.Points>(null);
  const pts = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 200; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 60 + Math.random() * 30;
      arr.push(Math.cos(a) * r, 25 + Math.random() * 30, Math.sin(a) * r);
    }
    return new Float32Array(arr);
  }, []);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.005;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.35} color="#ffffff" sizeAttenuation />
    </points>
  );
}

// ---------- Clima ----------
function Weather() {
  const weather = useForge((s) => s.weather);
  const rainRef = useRef<THREE.Points>(null);
  const snowRef = useRef<THREE.Points>(null);
  const cloudRef = useRef<THREE.Group>(null);

  const rain = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 400; i++) arr.push((Math.random() - 0.5) * 80, Math.random() * 25, (Math.random() - 0.5) * 80 + 15);
    return new Float32Array(arr);
  }, []);
  const snow = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 300; i++) arr.push((Math.random() - 0.5) * 80, Math.random() * 25, (Math.random() - 0.5) * 80 + 15);
    return new Float32Array(arr);
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (rainRef.current) {
      const pos = rainRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - dt * 22;
        if (y < 0) y = 25;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      rainRef.current.position.set(0, 0, 15);
    }
    if (snowRef.current) {
      const pos = snowRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - dt * 2.5;
        if (y < 0) y = 25;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(t + i) * dt * 0.5);
      }
      pos.needsUpdate = true;
      snowRef.current.position.set(0, 0, 15);
    }
    if (cloudRef.current) {
      cloudRef.current.children.forEach((c, i) => {
        c.position.x = ((c.position.x + dt * (1 + i * 0.3)) % 90) - 45;
      });
    }
  });

  return (
    <group>
      {weather === "rain" && (
        <points ref={rainRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[rain, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.12} color="#a5c8ff" transparent opacity={0.7} />
        </points>
      )}
      {weather === "snow" && (
        <points ref={snowRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[snow, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.22} color="#ffffff" transparent opacity={0.9} />
        </points>
      )}
      {(weather === "cloud" || weather === "rain") && (
        <group ref={cloudRef} position={[0, 22, 10]}>
          {[-20, -5, 10, 25].map((x, i) => (
            <group key={i} position={[x, (i % 2) * 2, 0]}>
              {[0, 1, 2].map((j) => (
                <mesh key={j} position={[j * 2 - 2, (j % 2) * 0.8, 0]}>
                  <sphereGeometry args={[2.2, 10, 8]} />
                  <meshStandardMaterial color="#cfd8e8" transparent opacity={0.85} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

// ---------- Pets que vagam ----------
function WanderPet({ x, z, species, fur }: { x: number; z: number; species: "dog" | "cat"; fur: string }) {
  const ref = useRef<THREE.Group>(null);
  const target = useRef({ x, z });
  const t = useRef(0);
  useFrame((state, dt) => {
    t.current -= dt;
    if (t.current <= 0) {
      t.current = 3 + Math.random() * 3;
      target.current = { x: x + (Math.random() - 0.5) * 8, z: z + (Math.random() - 0.5) * 8 };
    }
    if (!ref.current) return;
    const g = ref.current;
    const dx = target.current.x - g.position.x;
    const dz = target.current.z - g.position.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.4) {
      g.position.x += (dx / d) * dt * 1.2;
      g.position.z += (dz / d) * dt * 1.2;
      g.rotation.y = Math.atan2(dx, dz);
    }
    g.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 5 + x)) * 0.06;
  });
  return (
    <group ref={ref} position={[x, 0, z]}>
      <PetModel species={species} fur={fur} belly="#ffffff" ear={fur} eye="#3e2723" clothes={{ hat: null, shirt: null, acc: null }} anim="idle" moving speed={0} sick={false} scale={0.85} />
    </group>
  );
}

// ---------- Canvas principal ----------
export function GameCanvas() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 4, 3], fov: 50 }}>
      <House />
    </Canvas>
  );
}

