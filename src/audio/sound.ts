// ============================================================
// FORGE PET — Motor de áudio sintetizado (WebAudio)
// Sem arquivos externos: todos os sons são gerados por osciladores.
// ============================================================

type Ctx = AudioContext;

class SoundEngine {
  private ctx: Ctx | null = null;
  private sfxOn = true;
  private musicOn = true;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private currentSong = "";

  private ac(): Ctx | null {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  unlock() { this.ac(); }

  setSfx(v: boolean) { this.sfxOn = v; }
  setMusic(v: boolean) {
    this.musicOn = v;
    if (!v) this.stopMusic();
    else if (this.currentSong) this.playMusic(this.currentSong);
  }

  private tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.12, when = 0, slide = 0) {
    if (!this.sfxOn) return;
    const ctx = this.ac();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, vol = 0.1, when = 0, filterFreq = 1200) {
    if (!this.sfxOn) return;
    const ctx = this.ac();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t0);
  }

  // ---------- SFX ----------
  click() { this.tone(660, 0.08, "triangle", 0.08); }
  coin() { this.tone(880, 0.09, "square", 0.07); this.tone(1320, 0.16, "square", 0.06, 0.07); }
  eat() { this.noise(0.08, 0.12, 0, 900); this.noise(0.08, 0.1, 0.12, 700); }
  water() { this.tone(500, 0.3, "sine", 0.08, 0, 300); this.noise(0.25, 0.05, 0, 2000); }
  splash() { this.noise(0.4, 0.16, 0, 1500); this.tone(300, 0.25, "sine", 0.06, 0, -150); }
  jump() { this.tone(300, 0.18, "sine", 0.1, 0, 350); }
  pop() { this.tone(420, 0.1, "triangle", 0.1, 0, 200); }
  step() { this.noise(0.05, 0.05, 0, 600); }
  error() { this.tone(220, 0.18, "sawtooth", 0.07); this.tone(180, 0.22, "sawtooth", 0.07, 0.12); }
  success() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.14, "triangle", 0.09, i * 0.09)); }
  levelup() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, "square", 0.07, i * 0.08)); }
  achievement() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.2, "triangle", 0.08, i * 0.1)); }
  gameStart() { [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.12, "square", 0.07, i * 0.07)); }
  gameEnd() { [784, 659, 523, 392].forEach((f, i) => this.tone(f, 0.16, "square", 0.07, i * 0.09)); }
  hurt() { this.tone(200, 0.2, "sawtooth", 0.09, 0, -80); }

  // ---------- Música ----------
  private songs: Record<string, number[]> = {
    casa: [262, 330, 392, 523, 392, 330, 294, 330],
    jardim: [294, 370, 440, 587, 440, 370, 330, 294],
    parque: [330, 392, 494, 659, 494, 392, 440, 494],
    minigame: [523, 659, 784, 1047, 784, 659, 880, 1047],
    default: [262, 294, 330, 349, 392, 440, 494, 523],
  };

  playMusic(area: string) {
    this.currentSong = area;
    if (!this.musicOn) return;
    this.stopMusic();
    const song = this.songs[area] ?? this.songs.default;
    this.musicStep = 0;
    const ctx = this.ac();
    if (!ctx) return;
    const bpm = area === "minigame" ? 170 : 96;
    const stepMs = 60000 / bpm / 2;
    this.musicTimer = window.setInterval(() => {
      if (!this.musicOn) return;
      const freq = song[this.musicStep % song.length];
      this.musTone(freq, 0.22, 0.045);
      if (this.musicStep % 4 === 0) this.musTone(freq / 2, 0.3, 0.03);
      this.musicStep++;
    }, stepMs);
    void ctx;
  }

  private musTone(freq: number, dur: number, vol: number) {
    const ctx = this.ac();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const sound = new SoundEngine();
