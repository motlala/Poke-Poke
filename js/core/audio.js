/* ============================================================
   ÂM THANH WEB AUDIO — tổng hợp, không cần file ngoài
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  let ctx = null;
  let master = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.22;
        master.connect(ctx.destination);
      } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function isEnabled() {
    const st = PG.getState && PG.getState();
    return !st || !st.settings || st.settings.sound !== false;
  }

  function tone(freq, dur, type, vol, slideTo, delay, dest) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol || 0.2), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(dest || master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, filterFreq, delay, type) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type || 'lowpass';
    filter.frequency.setValueAtTime(filterFreq || 900, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, (filterFreq || 900) * 0.35), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.0002, vol || 0.15), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  const SFX = {
    click() { tone(620, 0.05, 'square', 0.08); },
    /* Nhẹ hơn click — dùng cho mọi nút/tab để không chồng lấn với âm sự kiện. */
    tap() { tone(880, 0.028, 'square', 0.035); },
    /* Chuyển trang / mở menu / đổi tab. */
    page() { tone(520, 0.07, 'sine', 0.055, 760); tone(760, 0.06, 'sine', 0.04, null, 0.06); },
    tab() { tone(700, 0.035, 'triangle', 0.05); tone(920, 0.045, 'triangle', 0.035, null, 0.035); },
    /* Các hoạt động trước đây gọi tên không tồn tại → chỉ phát tiếng click. */
    craft() { noise(0.08, 0.1, 900); tone(660, 0.08, 'square', 0.075); tone(880, 0.12, 'triangle', 0.075, null, 0.1); },
    equip() { noise(0.09, 0.08, 2200, 0, 'highpass'); tone(300, 0.05, 'square', 0.07); tone(920, 0.12, 'triangle', 0.075, null, 0.08); },
    trap() { noise(0.12, 0.1, 500); tone(420, 0.08, 'square', 0.07, 260); tone(700, 0.09, 'triangle', 0.065, null, 0.12); },
    /* Chọn vùng / lưu game / bùng nổ. */
    region() { tone(392, 0.12, 'sine', 0.075); tone(523.25, 0.12, 'sine', 0.075, null, 0.1); tone(783.99, 0.18, 'triangle', 0.085, null, 0.2); },
    save() { tone(880, 0.05, 'sine', 0.055); tone(1174.66, 0.075, 'sine', 0.055, null, 0.055); },
    outbreak() { tone(660, 0.1, 'square', 0.09); tone(880, 0.1, 'square', 0.09, null, 0.14); tone(660, 0.1, 'square', 0.09, null, 0.28); },
    open() { tone(420, 0.12, 'sine', 0.1, 720); },
    close() { tone(600, 0.1, 'sine', 0.08, 320); },
    error() { tone(180, 0.14, 'sawtooth', 0.12); tone(140, 0.16, 'sawtooth', 0.1, 120, 0.12); },
    throw() { noise(0.22, 0.12, 1600, 0, 'highpass'); tone(300, 0.18, 'sine', 0.08, 900); },
    splash() { noise(0.3, 0.16, 700, 0, 'lowpass'); tone(500, 0.15, 'sine', 0.06, 200); },
    shake() { tone(240, 0.07, 'triangle', 0.1); noise(0.05, 0.06, 1200); },
    catch() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.16, 'triangle', 0.16, null, i * 0.09));
      noise(0.25, 0.08, 3000, 0.1, 'highpass');
    },
    fail() { tone(320, 0.18, 'sawtooth', 0.12, 180); tone(180, 0.25, 'sawtooth', 0.1, 90, 0.15); },
    hit() { noise(0.16, 0.2, 1200); tone(140, 0.12, 'square', 0.12, 70); },
    crit() { noise(0.22, 0.25, 2400); tone(880, 0.18, 'square', 0.14, 300); tone(1200, 0.1, 'triangle', 0.1, 600, 0.05); },
    faint() { tone(440, 0.5, 'triangle', 0.14, 80); },
    heal() { [392, 523.25, 659.25].forEach((f, i) => tone(f, 0.14, 'sine', 0.12, null, i * 0.08)); },
    status() { tone(300, 0.18, 'triangle', 0.1, 420); },
    coin() { tone(1318.5, 0.07, 'square', 0.1); tone(1760, 0.1, 'square', 0.1, null, 0.07); },
    buy() { tone(880, 0.08, 'triangle', 0.1); tone(1174.66, 0.12, 'triangle', 0.1, null, 0.08); },
    reward() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.2, 'triangle', 0.13, null, i * 0.07)); },
    fishBite() { tone(880, 0.06, 'square', 0.14); tone(1046.5, 0.08, 'square', 0.14, null, 0.08); },
    reelTick() { tone(720, 0.035, 'square', 0.06); },
    reelHit() { tone(980, 0.09, 'triangle', 0.13, 1320); },
    reelFail() { tone(220, 0.12, 'sawtooth', 0.1, 160); },
    win() {
      [523.25, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.22, 'triangle', 0.15, null, i * 0.11));
      noise(0.4, 0.05, 4000, 0.2, 'highpass');
    },
    lose() { [392, 349.23, 311.13, 261.63].forEach((f, i) => tone(f, 0.32, 'triangle', 0.12, null, i * 0.16)); },
    levelup() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.18, 'sine', 0.14, null, i * 0.06)); },
    evolve() { [659.25, 783.99, 987.77, 1318.5, 1567.98].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, null, i * 0.1)); },
    shiny() { [1046.5, 1318.5, 1567.98, 2093].forEach((f, i) => tone(f, 0.2, 'sine', 0.1, null, i * 0.07)); noise(0.4, 0.05, 5000, 0, 'highpass'); },
    quest() { [783.99, 987.77, 1174.66].forEach((f, i) => tone(f, 0.16, 'triangle', 0.13, null, i * 0.09)); }
  };

  function play(name) {
    if (!isEnabled()) return;
    if (!ensure()) return;
    try { (SFX[name] || SFX.click)(); } catch (e) { /* bỏ qua lỗi audio */ }
  }

  function setEnabled(v) {
    const st = PG.getState && PG.getState();
    if (st && st.settings) {
      st.settings.sound = !!v;
      PG.saveState && PG.saveState(true);
    }
    if (v) play('click');
  }

  /* Trình duyệt chỉ cho WebAudio chạy sau một thao tác của người dùng.
     Lần chạm/phím đầu tiên sẽ "mở khóa" AudioContext (kể cả khi render đã tạo sẵn). */
  function unlockAudio() {
    const c = ensure();
    if (!c) return;
    if (c.state === 'running') {
      document.removeEventListener('pointerdown', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    }
  }
  document.addEventListener('pointerdown', unlockAudio, { passive: true });
  document.addEventListener('keydown', unlockAudio);

  PG.Audio = {
    play, setEnabled, isEnabled,
    names: Object.keys(SFX),
    get ctx() { return ctx; }
  };
})();
