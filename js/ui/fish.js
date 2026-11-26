/* ============================================================
   CÂU CÁ: chọn điểm, thả câu, giật cần, kéo cá
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  function st() { return PG.getState(); }
  function clearTimer() {
    if (ui.flow.fishTimer) { clearInterval(ui.flow.fishTimer); ui.flow.fishTimer = null; }
  }

  function baitBar() {
    const state = st();
    const active = PG.Fishing.currentBait(state);
    const owned = Object.keys(PG.BAITS).filter(id => (state.bag[id] || 0) > 0);
    return '<section class="panel fish-baits">' +
      '<div class="panel__head"><h3 class="panel__title">🪱 Mồi Câu</h3>' +
        (active ? '<span class="badge badge--gold">' + active.info.icon + ' ' + active.info.name + ' • ' + active.uses + ' lượt</span>' : '<span class="muted small">Chưa dùng mồi</span>') + '</div>' +
      (owned.length ? '<div class="bait-row">' + owned.map(id => {
        const bait = PG.BAITS[id];
        const on = active && active.id === id;
        return '<button class="bait-chip' + (on ? ' is-active' : '') + '" data-act="fish-bait" data-id="' + id + '">' +
          '<span>' + bait.icon + '</span><strong>' + bait.name + '</strong><small>x' + state.bag[id] + ' • ' + bait.uses + ' lượt</small></button>';
      }).join('') + '</div>' : '<p class="muted small">Bắt buộc phải có mồi mới câu được. Mua ở <b>Chợ → Vật Phẩm</b> hoặc chế tạo trong Công Xưởng.</p>') +
      (active ? '<p class="muted small">Mồi tự động tiêu hao 1 lượt mỗi lần thả câu.</p>' : '') +
    '</section>';
  }

  function resultPanel() {
    const result = ui.flow.fishResult;
    if (!result) return '';
    if (result.kind === 'fail') {
      return '<div class="fish-result fish-result--fail"><div class="fish-result__icon">🎣</div>' +
        '<div class="fish-result__body"><strong>Tiếc quá!</strong><p>' + esc(result.msg) + '</p></div>' +
        '<button class="btn btn--ghost btn--sm" data-act="fish-result-clear">Thử lại</button></div>';
    }
    if (result.kind === 'item') {
      return '<div class="fish-result fish-result--item"><div class="fish-result__icon">' + result.item.icon + '</div>' +
        '<div class="fish-result__body"><strong>Câu được vật phẩm!</strong><p>' + esc(result.item.name) + ' ×' + result.item.qty + '</p>' +
        (result.bonus ? '<p class="small gold">' + esc(result.bonus) + '</p>' : '') + '</div>' +
        '<button class="btn btn--ghost btn--sm" data-act="fish-result-clear">Câu tiếp</button></div>';
    }
    const p = result.pokemon;
    const sp = PG.SPECIES[p.speciesId];
    const q = PG.qualityOf(p);
    return '<div class="fish-result fish-result--catch' + (p.shiny ? ' is-shiny' : '') + (result.golden ? ' is-golden' : '') + '">' +
      '<div class="fish-result__sprite">' + ui.spriteHtml(p, { size: 'lg', badges: p.shiny ? '✨' : '' }) + '</div>' +
      '<div class="fish-result__body"><span class="eyebrow">' + (result.golden ? '✨ Cá Hoàng Kim!' : 'Câu được Pokémon!') + '</span><strong>' + esc(sp.name) + '</strong>' +
        '<p>Lv.' + p.level + ' • CP ' + PG.fmt(PG.cpOf(p)) + ' • ' + q.name + ' ' + ui.stars(q.stars) + '</p>' +
        ui.mutationBadges(p) +
        '<p class="small muted">' + (result.rewards && result.rewards.length ? result.rewards.join(' • ') : 'Đã thêm vào Kho Pokémon.') + '</p>' +
        (result.bonus ? '<p class="small gold">' + esc(result.bonus) + '</p>' : '') +
      '</div>' +
      '<div class="fish-result__actions"><button class="btn btn--ghost btn--sm" data-act="fish-result-clear">Câu tiếp</button>' +
        '<button class="btn btn--primary btn--sm" data-act="go" data-view="box">Mở Kho</button></div>' +
    '</div>';
  }

  function rodStrip() {
    const state = st();
    const rod = PG.RODS[state.fishing.rod] || PG.RODS.bamboo;
    return '<span class="pill" style="color:' + rod.color + '">' + rod.icon + ' ' + rod.name + ' +' + (state.fishing.rodLevel || 0) + '</span>';
  }

  function homeScreen() {
    const state = st();
    const rod = PG.RODS[state.fishing.rod] || PG.RODS.bamboo;
    const spots = [];
    for (const rid of PG.REGION_ORDER) {
      const spot = PG.Fishing.spotOf(rid);
      if (spot) spots.push(spot);
    }
    const hasBait = !!PG.Fishing.currentBait(state) || (PG.Fishing.ownedBaitIds(state).length > 0);
    return '<div class="fish-home">' +
      '<div class="page-head">' +
        '<div><p class="eyebrow">Câu cá • Thư giãn</p><h1>🎣 Bến Câu Cá</h1>' +
          '<p class="muted">Thả câu, giật đúng lúc và giữ kim trong vùng sáng để kéo cá lên bờ.</p></div>' +
        '<div class="page-wallet">' + rodStrip() +
          '<span class="pill">🔥 Chuỗi ' + (state.fishing.streak || 0) + '</span>' +
          '<span class="pill">🏆 Kỷ lục ' + (state.fishing.best || 0) + '</span></div>' +
      '</div>' +
      resultPanel() +
      '<div class="fish-layout">' +
        '<section class="panel fish-spots">' +
          '<div class="panel__head"><h3 class="panel__title">📍 Điểm Câu</h3><span class="badge">' + PG.Fishing.COST + ' ⚡ / lần</span></div>' +
          '<div class="spot-grid">' + spots.map(spot => {
            const region = PG.REGIONS[spot.regionId];
            const unlocked = PG.isRegionUnlocked(state, spot.regionId);
            const rodOk = (rod.deep || 0) >= spot.minRod;
            const needRod = Object.values(PG.RODS).find(r => (r.deep || 0) >= spot.minRod);
            const pool = spot.pool.filter(id => PG.SPECIES[id]).slice(0, 6);
            return '<div class="spot-card' + (!unlocked || !rodOk ? ' is-locked' : '') + '">' +
              '<div class="spot-card__head"><span class="spot-card__emoji">' + spot.emoji + '</span>' +
                '<div><strong>' + esc(spot.name) + '</strong><small>' + region.emoji + ' ' + region.name + ' • ' + (unlocked ? 'Đã mở' : 'Cần Lv.' + region.unlock.level) + '</small></div></div>' +
              '<div class="spot-card__pool">' + pool.map(id => ui.spriteHtml(PG.SPECIES[id], { size: 'xs' })).join('') + '</div>' +
              '<div class="spot-card__meta"><span>🎋 Độ sâu ' + spot.minRod + '/3</span><span>🍀 Hiếm x' + spot.rarityBonus + '</span></div>' +
              '<button class="btn ' + (unlocked && rodOk && hasBait ? 'btn--primary' : 'btn--ghost') + ' btn--sm btn--block" data-act="fish-cast" data-region="' + spot.regionId + '"' +
                (unlocked && rodOk && hasBait ? '' : ' disabled') + '>' +
                (!unlocked ? '🔒 Chưa mở khóa' : !rodOk ? '🎣 Cần ' + (needRod ? needRod.name : 'cần tốt hơn') : !hasBait ? '🪱 Cần mua mồi' : 'Thả câu') + '</button>' +
            '</div>';
          }).join('') + '</div>' +
        '</section>' +
        '<aside class="fish-side">' + baitBar() +
          '<section class="panel fish-tips"><h3 class="panel__title">💡 Mẹo câu cá</h3>' +
            '<ul class="tips-list">' +
              '<li>Khi cá cắn, bạn có <b>1,1 giây</b> để giật cần. Đừng vội!</li>' +
              '<li>Nhấn <b>KÉO</b> khi kim nằm trong vùng sáng. Càng gần tâm càng được nhiều điểm.</li>' +
              '<li>Chuỗi câu thành công tăng nhẹ tỉ lệ Shiny. Trượt sẽ đặt lại chuỗi.</li>' +
              '<li>Mồi hiếm và cần câu tốt giúp gặp Pokémon quý ở vùng nước sâu.</li>' +
            '</ul>' +
          '</section>' +
          '<section class="panel fish-aquarium"><div class="panel__head"><h3 class="panel__title">🐠 Bể Cá</h3>' +
            '<span class="badge">' + (state.fishing.aquarium || []).length + ' loài</span></div>' +
            ((state.fishing.aquarium || []).length ? '<div class="aquarium-strip">' + state.fishing.aquarium.slice(0, 12).map(id => PG.SPECIES[id] ? '<span class="aqua-mon">' + ui.spriteHtml(PG.SPECIES[id], { size: 'xs' }) + '<small>' + PG.SPECIES[id].name + '</small></span>' : '').join('') + '</div>' :
              '<p class="muted small">Bắt Pokémon bằng câu cá để thêm vào bể sưu tầm.</p>') +
          '</section>' +
        '</aside>' +
      '</div>' +
    '</div>';
  }

  function activeScreen(session) {
    const state = st();
    const spot = session.spot;
    const rod = PG.RODS[session.rod] || PG.RODS.bamboo;
    const phase = session.phase;
    let stage = '';
    if (phase === 'waiting') {
      stage = '<div class="fish-wait">' +
        '<div class="fish-float"><span class="fish-float__bob">🎣</span><span class="fish-ripple"></span></div>' +
        '<h2>Đang chờ cá...</h2><p class="muted">Theo dõi phao. Khi có tiếng "cạch", giật cần ngay!</p>' +
        '<button class="btn btn--ghost fish-action" data-act="fish-strike">Giật cần</button>' +
      '</div>';
    } else if (phase === 'bite') {
      stage = '<div class="fish-bite">' +
        '<div class="fish-bite__icon">❗</div><h2>CÁ CẮN CÂU!</h2><p>Giật cần ngay!</p>' +
        '<div class="bite-timer"><span id="fish-bite-count" style="width:100%"></span></div>' +
        '<button class="btn btn--gold fish-action fish-action--big" data-act="fish-strike">GIẬT CẦN!</button>' +
      '</div>';
    } else if (phase === 'reeling') {
      const center = PG.Fishing.zoneCenterAt(session, Date.now());
      const width = session.reel.zoneWidth;
      const rareHint = session.targetRarity && session.targetRarity !== 'common'
        ? ' Cá ' + esc(session.targetRarityName || 'quý') + ': vùng sáng hẹp hơn.' : '';
      stage = '<div class="fish-reel">' +
        '<div class="reel-head"><span>Kéo cá lên!</span><span id="fish-timer">20.0s</span></div>' +
        '<div class="reel-meter"><div class="reel-zone" id="fish-zone" style="left:' + (center - width / 2) + '%;width:' + width + '%"></div>' +
          '<div class="reel-marker" id="fish-marker" style="left:30%"></div></div>' +
        '<div class="reel-progress"><div class="reel-progress__fill" id="fish-progress" style="width:' + session.progress + '%"></div>' +
          '<span class="reel-progress__label" id="fish-progress-label">' + session.progress + '%</span></div>' +
        '<button class="btn btn--primary fish-action fish-action--big" data-act="fish-reel">KÉO!</button>' +
        '<p class="reel-feedback" id="fish-feedback">Nhấn khi kim nằm trong vùng sáng.' + rareHint + '</p>' +
      '</div>';
    }
    return '<div class="fish-active">' +
      '<div class="fish-active__head">' +
        '<button class="btn btn--ghost btn--sm" data-act="fish-cancel">← Rời bến</button>' +
        '<div class="fish-active__title"><span>' + spot.emoji + '</span><div><strong>' + esc(spot.name) + '</strong>' +
          '<small>' + rod.icon + ' ' + rod.name + ' +' + session.rodLevel + (session.bait ? ' • ' + session.bait.icon + ' ' + session.bait.name : '') + '</small></div></div>' +
        '<span class="pill">' + (state.fishing.streak || 0) + ' 🔥</span>' +
      '</div>' +
      '<div class="fish-water weather-bg--' + (PG.weatherFor(state, session.regionId) || 'clear') + '">' +
        '<div class="fish-water__sky"></div><div class="fish-water__surface"></div><div class="fish-water__deep"></div>' +
        '<div class="fish-stage">' + stage + '</div>' +
      '</div>' +
      '<div class="fish-active__foot"><p class="muted small">Nhấn giật đúng lúc khi cá cắn. Sau đó kéo thanh kim vào vùng sáng và nhấn KÉO.</p>' +
        '<button class="btn btn--ghost btn--sm" data-act="fish-cancel">Thu cần</button></div>' +
    '</div>';
  }

  ui.views.fish = function () {
    const session = ui.flow.fishSession;
    return '<div class="fish-page">' + (session && session.phase !== 'done' ? activeScreen(session) : homeScreen()) + '</div>';
  };

  /* ---------------- POLLING ---------------- */
  function updateReelUI(session, p) {
    const zone = document.getElementById('fish-zone');
    if (zone && typeof p.zoneCenter === 'number') {
      const width = p.zoneWidth || session.reel.zoneWidth;
      zone.style.left = (p.zoneCenter - width / 2) + '%';
    }
    const marker = document.getElementById('fish-marker');
    if (marker) marker.style.left = p.marker + '%';
    const bar = document.getElementById('fish-progress');
    if (bar) bar.style.width = p.progress + '%';
    const label = document.getElementById('fish-progress-label');
    if (label) label.textContent = p.progress + '%';
    const timer = document.getElementById('fish-timer');
    if (timer) timer.textContent = Math.max(0, (p.until - Date.now()) / 1000).toFixed(1) + 's';
    const biteBar = document.getElementById('fish-bite-count');
    if (biteBar && session.phase === 'bite') {
      const left = Math.max(0, session.biteAt + session.biteWindow - Date.now());
      biteBar.style.width = Math.max(0, Math.min(100, left / session.biteWindow * 100)) + '%';
    }
  }

  function finish(p) {
    clearTimer();
    ui.flow.fishSession = null;
    ui.flow.fishPhase = null;
    ui.flow.fishResult = p.result;
    const kind = p.result && p.result.kind;
    PG.Audio.play(kind === 'fail' ? 'fail' : kind === 'pokemon' ? 'catch' : 'reward');
    ui.render();
  }

  function tick() {
    const session = ui.flow.fishSession;
    if (!session || ui.current !== 'fish') { clearTimer(); return; }
    const p = PG.Fishing.poll(session);
    if (p.phase === 'done') { finish(p); return; }
    if (p.phase !== ui.flow.fishPhase) {
      ui.flow.fishPhase = p.phase;
      if (p.phase === 'bite') PG.Audio.play('fishBite');
      ui.render();
      return;
    }
    if (p.phase === 'reeling' || p.phase === 'bite') updateReelUI(session, p);
  }

  ui.mounted.fish = function () {
    if (ui.current !== 'fish') return;
    clearTimer();
    if (!ui.flow.fishSession) return;
    ui.flow.fishPhase = ui.flow.fishSession.phase;
    ui.flow.fishTimer = setInterval(tick, 85);
  };

  /* ---------------- ACTIONS ---------------- */
  ui.actions['fish-cast'] = function (el) {
    if (ui.flow.fishSession) { ui.toast('Bạn đang câu rồi.', 'warn'); return; }
    const res = PG.Fishing.cast(el.dataset.region);
    if (!res.ok) { ui.toast(res.msg, 'error'); PG.Audio.play('error'); return; }
    ui.flow.fishSession = res.session;
    ui.flow.fishPhase = 'waiting';
    ui.flow.fishResult = null;
    PG.Audio.play('splash');
    ui.refreshTopbar();
    ui.render();
  };

  ui.actions['fish-strike'] = function () {
    const session = ui.flow.fishSession;
    if (!session) return;
    const res = PG.Fishing.strike(session);
    if (!res.ok) { ui.toast(res.msg, 'warn'); PG.Audio.play('error'); return; }
    ui.flow.fishPhase = 'reeling';
    PG.Audio.play('splash');
    ui.render();
  };

  ui.actions['fish-reel'] = function () {
    const session = ui.flow.fishSession;
    if (!session) return;
    const res = PG.Fishing.reel(session);
    if (res.done) {
      finish(res);
      return;
    }
    const fb = document.getElementById('fish-feedback');
    if (fb) {
      fb.textContent = res.msg;
      fb.className = 'reel-feedback ' + (res.hit ? 'is-hit' : 'is-miss');
    }
    PG.Audio.play(res.hit ? (res.perfect ? 'reelHit' : 'reelTick') : 'reelFail');
    const bar = document.getElementById('fish-progress');
    if (bar) bar.style.width = res.progress + '%';
    const label = document.getElementById('fish-progress-label');
    if (label) label.textContent = res.progress + '%';
    if (res.hit) {
      const meter = document.querySelector('.reel-meter');
      if (meter) {
        meter.classList.remove('is-perfect');
        void meter.offsetWidth;
        meter.classList.add('is-perfect');
        setTimeout(() => meter.classList.remove('is-perfect'), 350);
      }
    }
  };

  ui.actions['fish-cancel'] = function () {
    const session = ui.flow.fishSession;
    if (!session) { ui.render(); return; }
    ui.confirm('Thu cần?', 'Bạn sẽ bỏ lượt câu này và mất chuỗi thành công. Thể lực đã tiêu hao sẽ không được hoàn lại.', function () {
      PG.Fishing.abandon(session);
      clearTimer();
      ui.flow.fishSession = null;
      ui.flow.fishPhase = null;
      ui.flow.fishResult = { kind: 'fail', msg: 'Bạn đã thu cần.' };
      ui.render();
    }, { danger: true, okText: 'Thu cần' });
  };

  ui.actions['fish-result-clear'] = function () {
    ui.flow.fishResult = null;
    ui.render();
  };

  ui.actions['fish-bait'] = function (el) {
    const res = PG.startBait(el.dataset.id);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('click'); ui.render(); }
  };
})();
