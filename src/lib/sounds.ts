// Sound mute system
let _muted = false;
export const isSoundMuted = () => _muted;
export const setSoundMuted = (m: boolean) => { _muted = m; };

const audioCtx = () => new (window.AudioContext || (window as any).webkitAudioContext)();

export const playBallActiveSound = () => {
  if (_muted) return;
  try {
    const ctx = audioCtx();
    const notes = [587.33, 739.99, 880]; // D5, F#5, A5 ascending chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch (e) {}
};

export const playWinSound = () => {
  if (_muted) return;
  try {
    const ctx = audioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.value = 1046.5;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    }, 500);
  } catch (e) {}
};

export const playFailSound = () => {
  if (_muted) return;
  try {
    const ctx = audioCtx();
    const notes = [392, 349.23, 311.13, 261.63];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.35);
    });
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.value = 80;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }, 720);
  } catch (e) {}
};

export const playClickSound = () => {
  if (_muted) return;
  try {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
};

export const playHypeHorn = () => {
  if (_muted) return;
  try {
    const horn = new Audio("/sounds/ipl_horn.mp3");
    horn.volume = 0.6;
    horn.play();
    setTimeout(() => {
      let step = 0;
      const interval = setInterval(() => {
        step++;
        horn.volume = Math.max(0, 0.6 * (1 - step / 30));
        if (step >= 30) { clearInterval(interval); horn.pause(); horn.currentTime = 0; }
      }, 100);
    }, 3000);
  } catch (e) {}
};

// Match end celebration sound — triumphant ascending fanfare
export const playMatchWinSound = () => {
  if (_muted) return;
  try {
    const ctx = audioCtx();
    // Triumphant fanfare — C major chord arpeggio up to high C
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.6);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.6);
    });
    // Final sustained chord
    setTimeout(() => {
      [1046.5, 1318.5, 1568].forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.5);
      });
    }, 900);
  } catch (e) {}
};

// Match end loss sound — descending minor tones
export const playMatchLossSound = () => {
  if (_muted) return;
  try {
    const ctx = audioCtx();
    // Descending minor — sad trumpet-like
    const notes = [523.25, 493.88, 440, 392, 349.23, 311.13];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.14, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.5);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.5);
    });
    // Mournful low tone
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.value = 130.81;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    }, 1500);
  } catch (e) {}
};

// Innings break sound — dramatic pause transition
export const playInningsBreakSound = () => {
  if (_muted) return;
  try {
    const ctx = audioCtx();
    // Three ascending chords
    const chords = [
      [261.63, 329.63, 392],    // C major
      [293.66, 369.99, 440],    // D major
      [329.63, 415.30, 493.88], // E major
    ];
    chords.forEach((chord, ci) => {
      chord.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime + ci * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ci * 0.4 + 0.6);
        osc.start(ctx.currentTime + ci * 0.4);
        osc.stop(ctx.currentTime + ci * 0.4 + 0.6);
      });
    });
  } catch (e) {}
};
