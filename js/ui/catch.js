/* ============================================================
   MÀN HÌNH BẮT POKÉMON: vòng thu nhỏ, vuốt/nhả để ném
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  /* ---------- Hiệu ứng bổ sung (thuần trang trí, không đổi luồng bắt) ---------- */
  function fxAllowed() {
    const s = PG.getState && PG.getState();
    if (s && s.settings && (s.settings.reduceMotion || s.settings.particles === false)) return false;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  }
  function catchFx(host, kind, count) {
    if (!host || !fxAllowed()) return null;
    const layer = document.createElement('div');
    layer.className = 'catch-fx catch-fx--' + kind;
    layer.setAttribute('aria-hidden', 'true');
    layer.style.setProperty('--fx-x', '50%');
    layer.style.setProperty('--fx-y', kind === 'throw' ? '42%' : '54%');
    const add = (cls, setup) => {
      const el = document.createElement('i');
      el.className = cls;
      if (setup) setup(el);
      layer.appendChild(el);
      return el;
    };

    if (kind === 'throw') add('catch-fx__arc');
    if (kind === 'shake') {
      add('catch-fx__ring');
      add('catch-fx__ring', el => el.style.setProperty('--fx-delay', '180ms'));
      add('catch-fx__shock');
    }
    if (kind === 'caught') {
      add('catch-fx__core');
      add('catch-fx__shock');
      add('catch-fx__ring');
      add('catch-fx__ring', el => el.style.setProperty('--fx-delay', '220ms'));
      for (let i = 0; i < 12; i++) {
        add('catch-fx__ray', el => {
          el.style.setProperty('--fx-angle', (i * 30) + 'deg');
          el.style.setProperty('--fx-delay', (i * 18) + 'ms');
        });
      }
    }
    if (kind === 'break') {
      add('catch-fx__shock');
      for (let i = 0; i < 6; i++) {
        add('catch-fx__ray', el => {
          el.style.setProperty('--fx-angle', (i * 60 + 15) + 'deg');
          el.style.setProperty('--fx-delay', (i * 25) + 'ms');
        });
      }
    }

    for (let i = 0; i < count; i++) {
      const s = add('catch-fx__spark');
      const near = kind === 'caught' || kind === 'shake' || kind === 'break';
      s.style.setProperty('--fx-x', (near ? 22 + Math.random() * 56 : 6 + Math.random() * 88).toFixed(1) + '%');
      s.style.setProperty('--fx-y', (near ? 30 + Math.random() * 44 : 14 + Math.random() * 70).toFixed(1) + '%');
      s.style.setProperty('--fx-dx', Math.round((Math.random() - .5) * 150) + 'px');
      s.style.setProperty('--fx-dy', Math.round(-40 - Math.random() * 120) + 'px');
      s.style.setProperty('--fx-d', Math.round(520 + Math.random() * 620) + 'ms');
      s.style.setProperty('--fx-s', (0.6 + Math.random() * 1.4).toFixed(2));
    }
    host.appendChild(layer);
    setTimeout(() => layer.remove(), 1600);
    return layer;
  }

  let ringRAF = 0;
  let currentScale = 1;
  let busy = false;

  function ownedBalls() {
    const st = PG.getState();
    return Object.keys(PG.BALLS).filter(id => (st.bag[id] || 0) > 0);
  }
  function defaultBall() {
    const st = PG.getState();
    if (ui.flow.catchBall && (st.bag[ui.flow.catchBall] || 0) > 0) return ui.flow.catchBall;
    const pref = ['raid-ball', 'masterball', 'celestialball', 'ultraball', 'greatball', 'pokeball', 'netball', 'duskball', 'quickball', 'timerball', 'healball'];
    for (const id of pref) if ((st.bag[id] || 0) > 0) return id;
    return ownedBalls()[0] || 'pokeball';
  }
  function chanceFor(qualityId) {
    const enc = ui.flow.encounter;
    if (!enc) return 0;
    return PG.catchChance(enc, defaultBall(), qualityId || 'hit', enc.berry || null, PG.getState());
  }
  function chanceText() {
    const q = PG.qualityFromScale(currentScale);
    const c = chanceFor(q.id);
    return { pct: Math.round(c * 100), color: PG.ringColor(c), quality: q };
  }

  function ballRow() {
    const st = PG.getState();
    const balls = ownedBalls();
    if (!balls.length) return '<p class="muted small">Bạn không còn bóng nào. Hãy mua ở Chợ hoặc chế tạo.</p>';
    return balls.map(id => {
      const info = PG.BALLS[id];
      return '<button class="ball-choice' + (id === defaultBall() ? ' is-active' : '') + '" data-act="select-ball" data-id="' + id + '" title="' + esc(info.desc) + '">' +
        '<span class="ball-choice__icon" style="--bc:' + info.color + '">' + ui.ballArt(id, 'xs') + '</span>' +
        '<span class="ball-choice__name">' + info.name + '</span>' +
        '<span class="ball-choice__count">x' + st.bag[id] + '</span></button>';
    }).join('');
  }

  function berryRow() {
    const st = PG.getState();
    const enc = ui.flow.encounter;
    const list = Object.keys(PG.BERRIES).filter(id => (st.bag[id] || 0) > 0);
    if (!list.length) return '<span class="muted small">Không có quả nào.</span>';
    return list.map(id => {
      const info = PG.BERRIES[id];
      return '<button class="berry-choice' + (enc.berry === id ? ' is-active' : '') + '" data-act="select-berry" data-id="' + id + '" title="' + esc(info.desc) + '">' +
        '<span>' + info.icon + '</span><small>' + info.name.replace(' Berry', '') + '</small><b>x' + st.bag[id] + '</b></button>';
    }).join('');
  }

  ui.views.catch = function () {
    const state = PG.getState();
    const enc = ui.flow.encounter;
    if (!enc) {
      return '<div class="empty-state"><div class="empty-state__icon">🌿</div><h2>Chưa có Pokémon nào</h2>' +
        '<p class="muted">Hãy đi dạo ở một vùng đất để tìm Pokémon hoang dã.</p>' +
        '<button class="btn btn--primary" data-act="go" data-view="home">Về bản đồ</button></div>';
    }
    const p = enc.pokemon;
    const sp = PG.SPECIES[p.speciesId];
    const region = PG.REGIONS[enc.regionId] || PG.REGIONS.forest;
    const q = chanceText();
    const qq = PG.qualityOf(p);
    const weather = PG.WEATHERS[enc.weather] || PG.WEATHERS.clear;
    const maxHp = PG.getStats(p).hp;
    const hpPct = PG.clamp(p.hp / maxHp * 100, 0, 100);
    const readyCount = state.pokemon.filter(m => m.hp > 0).length;

    return '<div class="catch">' +
      '<div class="catch-top">' +
        '<button class="btn btn--ghost btn--sm" data-act="flee-encounter">← Bỏ đi</button>' +
        '<div class="catch-top__meta">' +
          '<span class="pill">' + region.emoji + ' ' + region.name + '</span>' +
          '<span class="pill">' + weather.icon + ' ' + weather.name + '</span>' +
          '<span class="pill">' + (enc.isNight ? '🌙' : '☀️') + '</span>' +
        '</div>' +
        '<span class="pill pill--gold">' + (enc.legendary ? '🌟 Huyền thoại' : enc.source === 'raid' ? '👹 Boss' : '🌿 Hoang dã') + '</span>' +
      '</div>' +

      '<div class="catch-scene region-bg--' + region.bg + '" id="catch-stage">' +
        '<div class="catch-scene__vignette"></div>' +
        '<div class="catch-scene__info">' +
          '<div class="catch-mon-name">' + esc(sp.name) + ' <span class="catch-mon-lv">Lv.' + p.level + '</span></div>' +
          '<div class="catch-mon-sub">' + ui.typeChips(sp.types) + ' <span class="pill pill--sm">CP ' + PG.fmt(PG.cpOf(p)) + '</span> <span class="pill pill--sm">' + qq.name + ' ' + ui.stars(qq.stars) + '</span></div>' +
          '<div class="catch-hp"><div class="hp-bar' + (hpPct <= 25 ? ' is-low' : hpPct <= 50 ? ' is-mid' : '') + '"><span class="hp-fill" style="width:' + hpPct + '%"></span></div><small>' + Math.max(0, Math.round(p.hp)) + '/' + maxHp + ' HP</small></div>' +
          ui.mutationBadges(p) +
        '</div>' +
        '<div class="catch-mon-wrap" id="catch-mon">' +
          '<div class="catch-shadow"></div>' +
          ui.spriteHtml(p, { size: 'xl', badges: p.shiny ? '✨' : '' }) +
          '<div class="catch-ring" id="catch-ring"><span></span></div>' +
        '</div>' +
        '<div class="catch-chance" id="catch-chance" style="--cc:' + q.color + '">' +
          '<span class="catch-chance__num">' + q.pct + '%</span><small>Tỉ lệ bắt</small></div>' +
        '<div class="catch-ball" id="catch-ball">' +
          '<span class="catch-ball__icon">' + ui.ballArt(defaultBall(), 'lg') + '</span>' +
        '</div>' +
        '<div class="capture-ball" id="capture-ball" aria-hidden="true"></div>' +
        '<div class="catch-hint" id="catch-hint">Giữ chuột / chạm và <b>nhả</b> khi vòng nhỏ nhất để ném!</div>' +
        '<div class="catch-quality" id="catch-quality"></div>' +
      '</div>' +

      '<div class="catch-controls">' +
        '<div class="catch-controls__section catch-weaken">' +
          '<div class="catch-controls__head"><span>⚔️ Đánh yếu</span><span class="muted small">HP càng thấp, tỉ lệ bắt càng cao</span></div>' +
          '<button class="btn btn--gold btn--sm btn--block" data-act="battle-weaken"' + (p.hp <= 1 || !readyCount ? ' disabled' : '') + '>' +
            (readyCount ? '⚔️ Cho Pokémon đánh yếu ' + esc(sp.name) : '🏥 Không có Pokémon để đánh') + '</button>' +
        '</div>' +
        '<div class="catch-controls__section">' +
          '<div class="catch-controls__head"><span>⚪ Bóng</span><span class="muted small">Chọn bóng để ném</span></div>' +
          '<div class="ball-row">' + ballRow() + '</div>' +
        '</div>' +
        '<div class="catch-controls__section">' +
          '<div class="catch-controls__head"><span>🍓 Quả</span><span class="muted small">Dùng cho lần ném kế tiếp</span></div>' +
          '<div class="berry-row">' + berryRow() + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  /** Nhãn chất lượng ném là một node riêng cho MỖI lần ném: không bao giờ dính sang lần sau. */
  function popQuality(stage, q) {
    if (!stage || !q) return;
    const badge = document.createElement('div');
    badge.className = 'catch-quality__pop';
    badge.dataset.quality = q.id;
    badge.textContent = q.label;
    badge.style.setProperty('--q-color', q.color);
    stage.appendChild(badge);
    const remove = function () { if (badge.parentNode) badge.parentNode.removeChild(badge); };
    badge.addEventListener('animationend', remove, { once: true });
    // Fallback khi trình duyệt giảm motion không phát animationend.
    setTimeout(remove, 1100);
  }

  function clearQuality() {
    const el = document.getElementById('catch-quality');
    if (!el) return;
    el.textContent = '';
    el.removeAttribute('data-quality');
    el.style.color = '';
    el.style.removeProperty('--q-color');
  }

  ui.mounted.catch = function (root) {
    const enc = ui.flow.encounter;
    if (!enc) return;
    if (enc.caught || enc.fled) return;
    if (ui.flow.catchBusy) return;
    busy = false;
    const stage = document.getElementById('catch-stage');
    const ring = document.getElementById('catch-ring');
    const chanceEl = document.getElementById('catch-chance');
    const hint = document.getElementById('catch-hint');
    if (!stage || !ring) return;
    currentScale = 1;

    let downX = 0, downY = 0, downAt = 0, dragging = false, moved = false;
    const start = performance.now();

    function updateChance() {
      const q = chanceText();
      if (chanceEl) {
        chanceEl.style.setProperty('--cc', q.color);
        chanceEl.querySelector('.catch-chance__num').textContent = q.pct + '%';
      }
      return q;
    }

    function tick(now) {
      if (!document.getElementById('catch-ring') || busy) return;
      const t = ((now - start) % 1600) / 1600;
      const wave = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      currentScale = 0.4 + wave * 1.1;
      ring.style.transform = 'scale(' + currentScale.toFixed(3) + ')';
      const q = chanceText();
      ring.style.setProperty('--rc', q.color);
      if (chanceEl) {
        chanceEl.style.setProperty('--cc', q.color);
        const num = chanceEl.querySelector('.catch-chance__num');
        if (num) num.textContent = q.pct + '%';
      }
      ringRAF = requestAnimationFrame(tick);
    }
    cancelAnimationFrame(ringRAF);
    ringRAF = requestAnimationFrame(tick);

    function onDown(e) {
      if (busy) return;
      if (e.target.closest('[data-act]')) return;
      dragging = true;
      moved = false;
      downX = e.clientX; downY = e.clientY; downAt = performance.now();
      stage.classList.add('is-charging');
      if (hint) hint.textContent = 'Nhả để ném!';
      if (e.pointerType) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
    }
    function onMove(e) {
      if (!dragging || busy) return;
      const dy = e.clientY - downY;
      const dx = e.clientX - downX;
      if (Math.abs(dy) > 12 || Math.abs(dx) > 12) moved = true;
      const ball = document.getElementById('catch-ball');
      if (ball) {
        ball.style.transform = 'translate(' + (dx * 0.35) + 'px,' + (dy * 0.35) + 'px)';
      }
      if (dy > 90 && hint) hint.textContent = 'Thả xuống để hủy...';
      else if (hint) hint.textContent = moved ? 'Nhả để ném!' : 'Giữ và nhả khi vòng nhỏ nhất!';
    }
    function onUp(e) {
      if (!dragging || busy) return;
      dragging = false;
      stage.classList.remove('is-charging');
      const ball = document.getElementById('catch-ball');
      if (ball) ball.style.transform = '';
      const dy = e.clientY - downY;
      const dt = performance.now() - downAt;
      if (dy > 100) {
        if (hint) hint.textContent = 'Đã hủy ném. Thử lại nào!';
        return;
      }
      if (!ownedBalls().length) {
        ui.toast('Bạn không còn bóng nào!', 'error');
        return;
      }
      throwBall();
    }
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', () => { dragging = false; stage.classList.remove('is-charging'); });

    function throwBall() {
      const enc2 = ui.flow.encounter;
      if (!enc2 || busy) return;
      busy = true;
      ui.flow.catchBusy = true;
      cancelAnimationFrame(ringRAF);
      const quality = PG.qualityFromScale(currentScale);
      const ballId = defaultBall();
      const stageEl = document.getElementById('catch-stage');
      const hintEl = document.getElementById('catch-hint');
      clearQuality();
      popQuality(stageEl, quality);
      if (hintEl) hintEl.textContent = 'Đang ném…';
      if (stageEl) {
        stageEl.style.setProperty('--q-color', quality.color);
        const fly = document.createElement('div');
        fly.className = 'thrown-ball fly-quality-' + quality.id;
        fly.innerHTML = ui.ballArt(ballId, 'sm');
        stageEl.appendChild(fly);
        const dropFly = function () { if (fly.parentNode) fly.parentNode.removeChild(fly); };
        fly.addEventListener('animationend', dropFly, { once: true });
        setTimeout(dropFly, 520);
        catchFx(stageEl, 'throw', 10);
      }
      PG.Audio.play('throw');

      // Chờ bóng bay tới Pokémon (~500ms) rồi mới xử lý va chạm / thu nhỏ sprite.
      setTimeout(() => {
        const res = PG.attemptCatch(enc2, ballId, quality.id, enc2.berry || null);
        if (!res.ok) {
          busy = false;
          ui.flow.catchBusy = false;
          ui.toast(res.msg || 'Không thể ném.', 'error');
          ui.render();
          return;
        }
        enc2.berry = null;
        if (res.missed) {
          PG.Audio.play('fail');
          ui.toast(res.message || 'Ném trượt! Pokémon vẫn ở đó.', 'warn');
          busy = false;
          ui.flow.catchBusy = false;
          ui.render();
          return;
        }
        const stageNow = document.getElementById('catch-stage');
        const captureBall = document.getElementById('capture-ball');
        // Bóng đã chạm Pokémon: sprite lúc này mới biến mất, capture-ball lên ngay tại chỗ.
        if (stageNow) stageNow.classList.add('is-impact', 'is-thrown');
        if (captureBall) {
          captureBall.innerHTML = ui.ballArt(ballId, 'lg');
          captureBall.classList.add('is-active');
        }

        // Ba lần rung "xoay qua lại" như trong phim, bất kể kết quả.
        let i = 0;
        function shakeNext() {
          if (i >= 3) {
            setTimeout(() => resolveThrow(res, quality), 400);
            return;
          }
          i++;
          PG.Audio.play('shake');
          if (captureBall) {
            captureBall.classList.remove('shake');
            void captureBall.offsetWidth;
            captureBall.classList.add('shake');
          }
          catchFx(stageNow || document.getElementById('catch-stage'), 'shake', 5);
          setTimeout(shakeNext, 460);
        }
        setTimeout(shakeNext, 480);
      }, 520);
    }

    function resolveThrow(res, quality) {
      const stageNow = document.getElementById('catch-stage');
      const captureBall = document.getElementById('capture-ball');
      if (res.caught) {
        if (captureBall) captureBall.classList.add('is-caught');
        if (stageNow) stageNow.classList.add('is-caught');
        catchFx(stageNow, 'caught', 26);
        setTimeout(() => showResult(res, quality), 520);
      } else if (res.fled) {
        if (captureBall) captureBall.classList.add('break-out');
        if (stageNow) stageNow.classList.add('is-fled');
        catchFx(stageNow, 'break', 20);
        setTimeout(() => showResult(res, quality), 560);
      } else {
        if (captureBall) captureBall.classList.add('break-out');
        if (stageNow) stageNow.classList.add('is-broken-out');
        catchFx(stageNow, 'break', 16);
        setTimeout(() => showResult(res, quality), 560);
      }
    }

    // Cập nhật nhãn chất lượng theo vòng
    const qualityTimer = setInterval(() => {
      if (busy || !document.getElementById('catch-quality')) { clearInterval(qualityTimer); return; }
      const q = PG.qualityFromScale(currentScale);
      const el = document.getElementById('catch-quality');
      if (el) {
        el.textContent = q.id === 'hit' ? '' : q.label;
        el.style.color = q.color;
      }
    }, 80);
  };

  function showResult(res, quality) {
    // Người dùng có thể đã rời màn hình trong lúc bóng đang lắc.
    if (!document.getElementById('catch-stage')) {
      busy = false;
      ui.flow.catchBusy = false;
      return;
    }
    const enc = ui.flow.encounter;
    busy = false;
    ui.flow.catchBusy = false;
    const p = enc ? enc.pokemon : null;
    if (!p) { ui.go('home'); return; }
    const sp = PG.SPECIES[p.speciesId];
    if (res.caught) {
      PG.Audio.play(p.shiny ? 'shiny' : 'catch');
      const keptBall = ui.flow.catchBall && PG.BALLS[ui.flow.catchBall] ? ui.flow.catchBall : defaultBall();
      const ballInfo = PG.BALLS[keptBall] || PG.BALLS.pokeball;
      const r = res.rewards || {};
      const lines = [];
      if (r.candy) lines.push('<span>🍬 +' + r.candy + ' Kẹo</span>');
      if (r.stardust) lines.push('<span>✨ +' + PG.fmt(r.stardust) + ' Bụi Sao</span>');
      if (r.xp) lines.push('<span>⭐ +' + r.xp + ' XP</span>');
      if (r.levelUp) lines.push('<span class="gold">🎉 Lên cấp ' + r.playerLevel + '!</span>');
      ui.modal({
        title: 'Bắt được ' + sp.name + '!',
        subtitle: quality.label + ' • ' + Math.round(res.chance * 100) + '% • ' + (p.shiny ? '✨ SHINY!' : PG.qualityOf(p).name),
        body: '<div class="catch-result-card">' +
          '<div class="catch-result-card__sprite">' + ui.spriteHtml(p, { size: 'lg' }) + '</div>' +
          '<div class="catch-result-card__info">' +
            '<h3>' + esc(sp.name) + ' <small>Lv.' + p.level + '</small></h3>' +
            ui.typeChips(sp.types) + ui.mutationBadges(p) +
            '<p class="muted">CP ' + PG.fmt(PG.cpOf(p)) + ' • ' + PG.qualityOf(p).name + ' ' + ui.stars(PG.qualityOf(p).stars) + '</p>' +
            '<div class="reward-lines">' + lines.join('') + '</div>' +
          '</div></div>' +
          '<div class="catch-collected" style="--ball-col:' + esc(ballInfo.color || '#f87171') + '">' +
            '<span class="catch-collected__ball">' + ui.ballArt(keptBall, 'lg') + '</span>' +
            '<span class="catch-collected__meta"><b>Đã chứa trong ' + esc(ballInfo.name) + '</b>' +
              '<span class="catch-collected__tag">✔ An toàn trong bóng</span></span>' +
          '</div>' +
          '<p class="muted small">Pokémon đã được thêm vào Kho' + (PG.getState().team.includes(p.uid) ? ' và đội hình.' : '.') + '</p>',
        footer: '<button class="btn btn--ghost catch-ux__btn" data-act="catch-continue">Dừng lại</button>' +
          '<button class="btn btn--primary catch-ux__btn" data-act="catch-walk">Đi kiếm bắt tiếp</button>',
        closable: false,
        onMount: function (panel) {
          if (!panel) return;
          panel.style.position = 'relative';
          panel.style.overflow = 'hidden';
          catchFx(panel, 'caught', 18);
        }
      });
      ui.refreshTopbar();
    } else if (!res.fled) {
      // Pokémon thoát bóng nhưng vẫn đứng đó: không mở modal kết quả, dựng lại
      // vòng ném ngay để người chơi tiếp tục. Modal chỉ dành cho lúc bỏ chạy,
      // với đúng 2 lựa chọn: Dừng lại / Đi kiếm bắt tiếp.
      PG.Audio.play('fail');
      const fleePct = Math.round((res.fleeChance || 0) * 100);
      ui.toast('Bóng vỡ! ' + sp.name + ' vẫn ở lại — ném tiếp nhé (bỏ chạy ' + fleePct + '%).', 'warn', 2800);
      currentScale = 1;
      ui.render();
      return;
    } else {
      PG.Audio.play('fail');
      ui.modal({
        title: 'Bóng vỡ! ' + sp.name + ' đã bỏ chạy!',
        subtitle: 'Bóng đã vỡ và Pokémon đã trốn mất.',
        body: '<div class="catch-fail is-fled">' +
          '<div class="catch-fail__sprite">' + ui.spriteHtml(p, { size: 'md' }) + '</div>' +
          '<p class="muted">Bóng đã vỡ, ' + esc(sp.name) + ' đã bỏ chạy mất. Hãy đi kiếm Pokémon khác để bắt tiếp.</p>' +
          '</div>',
        footer: '<button class="btn btn--ghost catch-ux__btn" data-act="catch-continue">Dừng lại</button>' +
          '<button class="btn btn--primary catch-ux__btn" data-act="catch-walk">Đi kiếm bắt tiếp</button>',
        closable: false
      });
      ui.refreshTopbar();
    }
    // Không gọi ui.render() ở đây: render() xóa modal vừa mở và dựng lại
    // màn hình bắt, khiến Pokémon trong kết quả bị "đứng yên".
  }

  /* ---------------- ACTIONS ---------------- */
  ui.actions['battle-weaken'] = function () {
    const enc = ui.flow.encounter;
    const state = PG.getState();
    if (!enc || enc.caught || enc.fled) return;
    if (!state.pokemon.some(m => m.hp > 0)) {
      ui.toast('Không có Pokémon nào còn sức để đánh. Hãy hồi phục đội!', 'warn');
      return;
    }
    const res = PG.Battle.startWild(enc);
    if (!res.ok) { ui.toast(res.msg, 'error'); PG.Audio.play('error'); return; }
    cancelAnimationFrame(ringRAF);
    ui.flow.battle = res.battle;
    ui.flow.battleBusy = false;
    ui.flow.battleFast = state.settings.fast;
    PG.Audio.play('open');
    ui.go('battle');
  };

  ui.actions['select-ball'] = function (el) {
    ui.flow.catchBall = el.dataset.id;
    for (const b of ui.$all('.ball-choice')) b.classList.toggle('is-active', b.dataset.id === ui.flow.catchBall);
    const ball = document.getElementById('catch-ball');
    if (ball) ball.querySelector('.catch-ball__icon').innerHTML = ui.ballArt(ui.flow.catchBall, 'lg');
    const chanceEl = document.getElementById('catch-chance');
    if (chanceEl) {
      const q = chanceText();
      chanceEl.style.setProperty('--cc', q.color);
      chanceEl.querySelector('.catch-chance__num').textContent = q.pct + '%';
    }
  };

  ui.actions['select-berry'] = function (el) {
    const enc = ui.flow.encounter;
    if (!enc) return;
    enc.berry = enc.berry === el.dataset.id ? null : el.dataset.id;
    for (const b of ui.$all('.berry-choice')) b.classList.toggle('is-active', b.dataset.id === enc.berry);
    const chanceEl = document.getElementById('catch-chance');
    if (chanceEl) {
      const q = chanceText();
      chanceEl.style.setProperty('--cc', q.color);
      chanceEl.querySelector('.catch-chance__num').textContent = q.pct + '%';
    }
    if (enc.berry) ui.toast('Đã chọn ' + PG.BERRIES[enc.berry].name + ' cho lần ném tới.', 'info', 1800);
  };

  ui.actions['catch-continue'] = function () {
    ui.closeModal();
    ui.flow.encounter = null;
    ui.go('home');
  };

  ui.actions['catch-walk'] = function () {
    ui.closeModal();
    ui.flow.encounter = null;
    ui.go('home');
    setTimeout(() => { ui.actions['walk'](); }, 200);
  };

  ui.actions['flee-encounter'] = function () {
    if (!ui.flow.encounter) { ui.go('home'); return; }
    ui.confirm('Bỏ đi?', 'Pokémon này sẽ biến mất và bạn không nhận được gì.', function () {
      ui.flow.encounter = null;
      ui.go('home');
    }, { okText: 'Bỏ đi', danger: true });
  };
})();
