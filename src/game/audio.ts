/**
 * LITE - Áudio 100% procedural via Web Audio API (sem arquivos externos).
 * Passos, água, vento, pássaros, ataques, interface e música ambiente.
 */
type Bus = "master" | "music" | "sfx";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private gains: Record<Bus, GainNode> | null = null;
  private musicTimer: number | null = null;
  private ambientNodes: AudioNode[] = [];
  volumes = { master: 0.7, music: 0.5, sfx: 0.8 };
  enabled = true;

  /** Deve ser chamado após um gesto do usuário (regra dos navegadores) */
  start() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = this.volumes.master;
    master.connect(ctx.destination);
    const music = ctx.createGain();
    music.gain.value = this.volumes.music;
    music.connect(master);
    const sfx = ctx.createGain();
    sfx.gain.value = this.volumes.sfx;
    sfx.connect(master);
    this.gains = { master, music, sfx };
    this.startAmbient();
    this.startMusic();
  }

  setVolume(bus: Bus, v: number) {
    this.volumes[bus] = v;
    if (this.gains) this.gains[bus].gain.value = v;
  }

  private noiseBuffer(dur = 1) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /** Vento contínuo + água (filtros sobre ruído branco) */
  private startAmbient() {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(3);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(filter).connect(g).connect(this.gains!.sfx);
    src.start();
    this.windGain = g;
    this.ambientNodes.push(src, filter, g);

    // Água ambiente (ganho controlado pela proximidade)
    const wsrc = ctx.createBufferSource();
    wsrc.buffer = this.noiseBuffer(3);
    wsrc.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = "lowpass";
    wf.frequency.value = 900;
    const wg = ctx.createGain();
    wg.gain.value = 0;
    wsrc.connect(wf).connect(wg).connect(this.gains!.sfx);
    wsrc.start();
    this.waterGain = wg;

    // Pássaros esporádicos
    this.birdTimer = window.setInterval(() => {
      if (Math.random() < 0.5) this.bird();
    }, 4200);
  }

  private windGain: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private birdTimer: number | null = null;

  setWaterProximity(v: number) {
    if (this.waterGain) this.waterGain.gain.value = 0.09 * v;
  }
  setWindStrength(v: number) {
    if (this.windGain) this.windGain.gain.value = 0.03 + v * 0.05;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol = 0.2, slide = 0) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), ctx.currentTime + dur);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(this.gains!.sfx);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  }

  private burst(freq: number, dur: number, vol: number, type: BiquadFilterType = "bandpass") {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const s = ctx.createBufferSource();
    s.buffer = this.noiseBuffer(0.4);
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    s.connect(f).connect(g).connect(this.gains!.sfx);
    s.start();
    s.stop(ctx.currentTime + dur);
  }

  step(onSand = false) {
    this.burst(onSand ? 1500 : 700, 0.12, 0.14);
  }
  splash() {
    this.burst(1100, 0.35, 0.25, "lowpass");
  }
  jump() {
    this.tone(420, 0.16, "triangle", 0.18, 320);
  }
  land() {
    this.burst(300, 0.14, 0.2, "lowpass");
  }
  attack() {
    this.tone(880, 0.12, "sawtooth", 0.12, -520);
    this.burst(2600, 0.1, 0.12);
  }
  hit() {
    this.tone(180, 0.22, "square", 0.16, -90);
  }
  damage() {
    this.tone(220, 0.3, "sawtooth", 0.2, -140);
  }
  ui() {
    this.tone(1320, 0.07, "square", 0.08);
  }
  pickup() {
    this.tone(880, 0.09, "square", 0.12);
    window.setTimeout(() => this.tone(1320, 0.12, "square", 0.12), 80);
  }
  quest() {
    [523, 659, 784, 1046].forEach((f, i) => window.setTimeout(() => this.tone(f, 0.18, "triangle", 0.14), i * 110));
  }
  bird() {
    if (!this.ctx || !this.enabled) return;
    const base = 1600 + Math.random() * 900;
    this.tone(base, 0.09, "sine", 0.05, 500);
    window.setTimeout(() => this.tone(base * 1.2, 0.08, "sine", 0.045, -300), 120);
  }

  /** Música ambiente alegre, gerada por uma escala pentatônica */
  private startMusic() {
    const scale = [523.25, 587.33,659.25, 783.99, 880, 1046.5];
    const bass = [130.81, 146.83, 164.81, 196];
    let i = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.enabled || !this.gains) return;
      const ctx = this.ctx;
      const note = scale[Math.floor(Math.random() * scale.length)];
      const play = (f: number, dur: number, vol: number, type: OscillatorType) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
        o.connect(g).connect(this.gains!.music);
        o.start();
        o.stop(ctx.currentTime + dur + 0.05);
      };
      play(note, 0.55, 0.08, "triangle");
      if (i % 4 === 0) play(bass[(i / 4) % bass.length], 1.1, 0.06, "sine");
      i++;
    }, 480);
  }

  dispose() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    if (this.birdTimer) clearInterval(this.birdTimer);
    this.ambientNodes = [];
    void this.ctx?.close();
    this.ctx = null;
  }
}
