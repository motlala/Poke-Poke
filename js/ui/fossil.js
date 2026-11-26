/* ============================================================
   HÓA THẠCH: mỏ đào, lưới dò tìm, kho hóa thạch, phòng phục chế
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui = PG.ui || {};
  const esc = PG.esc;
  const SIZE = (PG.Fossil && PG.Fossil.SIZE) || 6;
  const MAX = (PG.Fossil && PG.Fossil.MAX_PROBES) || 8;
  const SURGE_ID = (PG.Fossil && PG.Fossil.SURGE_ID) || 'fossil-surge';

  function st() { return PG.getState(); }
  function fossilDef(id) { return (PG.FOSSILS && PG.FOSSILS[id]) || null; }
  function siteDef(id) {
    return (PG.Fossil.sites() || []).find(s => s.id === id) || null;
  }
  function activeSession() { return ui.flow.fossil || null; }

  function cheb(a, b) {
    return Math.max(Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)), Math.abs((a % SIZE) - (b % SIZE)));
  }

  function clearTimer() {
    if (ui.flow.fossilTimer) { clearInterval(ui.flow.fossilTimer); ui.flow.fossilTimer = null; }
  }

  /* ---------------- GỢI Ý NHIỆT ---------------- */
  function hintFor(distance) {
    if (distance === 0) return 'Trúng đích! Hóa thạch đã lộ ra.';
    if (distance === 1) return 'Rất gần! Chỉ còn 1 ô thôi.';
    if (distance === 2) return 'Gần rồi! Cách 2 ô.';
    if (distance === 3) return 'Hơi xa — cách 3 ô.';
    return 'Xa lắm — cách ' + distance + ' ô.';
  }

  function hintClass(distance) {
    if (distance === null || distance === undefined) return '';
    if (distance === 0) return 'is-hot';
    if (distance === 1) return 'is-hot';
    if (distance === 2) return 'is-warm';
    if (distance === 3) return 'is-cool';
    return 'is-cold';
  }

  /** Màu của từng ô: ô càng gần ô vừa đào mà khoảng cách nhỏ hơn thì càng nóng. */
  function cellHeat(session, index) {
    const probed = (session.probed || []).indexOf(index) >= 0;
    if (session.found) return session.target === index ? 'is-found' : (probed ? 'is-dug' : 'is-dim');
    if (probed) return 'is-dug';
    if (session.lastCell === null || session.lastCell === undefined || session.lastDistance === null) return '';
    const d = cheb(index, session.lastCell);
    if (d < session.lastDistance) return 'is-hot';
    if (d === session.lastDistance) return 'is-warm';
    return 'is-cold';
  }

  /* ---------------- MỎ ---------------- */
  function sitesHtml() {
    const busy = !!activeSession() && !activeSession().found;
    return '<section class="panel fossil-sites">' +
      '<div class="panel__head"><h3 class="panel__title">📍 Địa Điểm Khai Quật</h3>' +
        '<span class="badge">' + (PG.Fossil.DIG_COST || 8) + ' ⚡ / lần</span></div>' +
      '<div class="fossil-site-grid">' + PG.Fossil.sites().map(site => {
        const check = PG.Fossil.canDig(site.id);
        const region = PG.REGIONS[site.regionId];
        const pool = (PG.FOSSIL_ORDER || []).filter(id => fossilDef(id) && fossilDef(id).site === site.id);
        const ok = check.ok && !busy;
        const label = busy ? 'Đang đào ở mỏ khác' : check.ok ? '⛏️ Bắt đầu đào' : (check.msg || 'Chưa mở khóa');
        return '<article class="fossil-site' + (ok ? '' : ' is-locked') + '">' +
          '<div class="fossil-site__head"><span class="fossil-site__icon">' + site.icon + '</span>' +
            '<div><strong>' + esc(site.name) + '</strong><small>' +
              (region ? region.emoji + ' ' + esc(region.name) : '') + '</small></div></div>' +
          '<p class="fossil-site__desc">' + esc(site.desc) + '</p>' +
          '<div class="fossil-site__pool">' + pool.slice(0, 5).map(id => {
            const def = fossilDef(id);
            return '<span title="' + esc(def.name) + '">' + def.icon + '</span>';
          }).join('') + '</div>' +
          '<button class="btn ' + (ok ? 'btn--primary' : 'btn--ghost') + ' btn--sm btn--block" ' +
            'data-act="fossil-dig" data-site="' + site.id + '"' + (ok ? '' : ' disabled') + '>' +
            esc(label) + '</button>' +
        '</article>';
      }).join('') + '</div>' +
    '</section>';
  }

  /* ---------------- LƯỚI ĐÀO ---------------- */
  function digHtml(session) {
    const site = siteDef(session.siteId);
    const def = fossilDef(session.fossilId);
    const probed = session.probed || [];
    const pct = Math.min(100, Math.round((session.probes || 0) / MAX * 100));
    let cells = '';
    for (let i = 0; i < SIZE * SIZE; i++) {
      const isProbed = probed.indexOf(i) >= 0;
      const cls = ['fossil-cell', cellHeat(session, i)];
      if (isProbed) cls.push('is-dug');
      let label = '';
      if (session.found && session.target === i) label = def ? def.icon : '🦴';
      else if (isProbed) label = '·';
      cells += '<button class="' + cls.join(' ') + '" data-act="fossil-probe" data-cell="' + i + '" ' +
        'title="Ô ' + (i + 1) + '"' + (isProbed || session.found ? ' disabled' : '') + '>' + label + '</button>';
    }

    const resultHtml = session.found
      ? '<div class="fossil-result"><span class="fossil-result__icon">' + (def ? def.icon : '🦴') + '</span>' +
          '<div class="fossil-result__body"><span class="eyebrow">Đào được rồi!</span>' +
            '<strong>' + esc(session.result ? session.result.name : (def ? def.name : 'Hóa thạch')) + '</strong>' +
            '<p>Đã thêm vào kho. Hãy đưa vào Phòng Phục Chế để hồi sinh Pokémon.</p></div>' +
          '<button class="btn btn--primary btn--sm" data-act="fossil-dig" data-site="' + session.siteId + '">Đào chỗ khác</button>' +
        '</div>'
      : '';

    const feedback = session.found
      ? 'Đã đào trúng ô số ' + (session.target + 1) + ' sau ' + session.probes + ' lần thử.'
      : (session.lastDistance === null || session.lastDistance === undefined
        ? 'Chọn một ô trong lưới để bắt đầu dò tìm.'
        : hintFor(session.lastDistance));

    return '<section class="panel fossil-dig">' +
      '<div class="panel__head"><h3 class="panel__title">⛏️ ' + esc(site ? site.name : 'Mỏ hóa thạch') + '</h3>' +
        '<span class="badge badge--gold" id="fossil-probe-count">' + (session.probes || 0) + '/' + MAX + ' lần đào</span></div>' +
      resultHtml +
      '<div class="fossil-progress"><span id="fossil-probe-bar" style="width:' + pct + '%"></span></div>' +
      '<div class="fossil-grid" id="fossil-grid">' + cells + '</div>' +
      '<p class="fossil-feedback ' + hintClass(session.lastDistance) + '" id="fossil-feedback">' + esc(feedback) + '</p>' +
      '<div class="fossil-dig__foot"><p class="muted small">Mỗi lần đào tốn ' + (PG.Fossil.DIG_COST || 8) +
        ' ⚡. Ô càng đỏ càng gần hóa thạch; ô xanh dương có thể loại bỏ.</p>' +
        '<button class="btn btn--ghost btn--sm" data-act="fossil-cancel-dig">Bỏ lượt đào</button></div>' +
    '</section>';
  }

  /* ---------------- KHO HÓA THẠCH ---------------- */
  function inventoryHtml() {
    const state = st();
    const inv = (state.fossils && state.fossils.inventory) || {};
    const ids = (PG.FOSSIL_ORDER || []).filter(id => (inv[id] || 0) > 0);
    const rows = ids.map(id => {
      const def = fossilDef(id);
      if (!def) return '';
      const check = PG.Fossil.canRestore(id);
      const site = siteDef(def.site);
      const species = PG.SPECIES[def.speciesId];
      const mats = Object.entries(def.restoreMaterials || {}).map(([mid, n]) => {
        const info = PG.MATERIALS[mid] || { icon: '❓', name: mid };
        const have = state.materials[mid] || 0;
        return '<span class="fossil-mat' + (have >= n ? ' is-ok' : ' is-miss') + '" title="' + esc(info.name) + '">' +
          info.icon + ' ' + have + '/' + n + '</span>';
      }).join('');
      const price = def.sellCoins || Math.round((def.restoreCoins || 500) * 0.35);
      return '<article class="fossil-item">' +
        '<div class="fossil-item__head"><span class="fossil-item__icon">' + def.icon + '</span>' +
          '<div class="fossil-item__title"><strong>' + esc(def.name) + ' <span class="fossil-item__qty">×' + inv[id] + '</span></strong>' +
            '<small>' + esc(site ? site.name : def.site) + ' • ' + esc(species ? species.name : def.speciesId) + '</small></div></div>' +
        '<div class="fossil-item__cost">' + mats +
          '<span class="fossil-mat' + ((state.player.coins || 0) >= (def.restoreCoins || 0) ? ' is-ok' : ' is-miss') + '">🪙 ' +
            PG.fmt(def.restoreCoins || 0) + '</span>' +
          '<span class="fossil-mat is-time">⏱️ ' + (PG.relTime ? PG.relTime(def.restoreMs || 300000) : '5 phút') + '</span>' +
        '</div>' +
        '<div class="fossil-item__actions">' +
          '<button class="btn ' + (check.ok ? 'btn--primary' : 'btn--ghost') + ' btn--sm" data-act="fossil-start-restore" data-id="' + id + '"' +
            (check.ok ? '' : ' title="' + esc(check.msg || '') + '" disabled') + '>🔬 Phục chế</button>' +
          '<button class="btn btn--ghost btn--sm" data-act="fossil-sell" data-id="' + id + '">Bán ' + PG.fmt(price) + ' Xu</button>' +
        '</div>' +
      '</article>';
    }).join('');

    return '<section class="panel fossil-inventory">' +
      '<div class="panel__head"><h3 class="panel__title">🦴 Kho Hóa Thạch</h3>' +
        '<span class="badge">' + ids.reduce((n, id) => n + (inv[id] || 0), 0) + ' viên</span></div>' +
      (rows || '<p class="muted small">Chưa có hóa thạch. Hãy đào ở một trong các địa điểm ở trên.</p>') +
    '</section>';
  }

  /* ---------------- PHÒNG PHỤC CHẾ ---------------- */
  function fmtRemain(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return (h > 0 ? h + ':' : '') + PG.pad(m) + ':' + PG.pad(s);
  }

  function restoreRoomHtml() {
    const state = st();
    const f = state.fossils || {};
    const now = Date.now();
    const rows = (f.restoring || []).map(entry => {
      const def = fossilDef(entry.fossilId);
      const left = Math.max(0, (entry.readyAt || 0) - now);
      const pct = PG.clamp((now - (entry.startedAt || now)) / Math.max(1, entry.durationMs || 1) * 100, 0, 100);
      return '<div class="fossil-restore-row">' +
        '<span class="fossil-restore-row__icon">' + (def ? def.icon : '🦴') + '</span>' +
        '<div class="fossil-restore-row__body"><strong>' + esc(def ? def.name : entry.fossilId) + '</strong>' +
          '<div class="fossil-restore-row__bar"><span data-fossil-bar="' + esc(entry.uid) + '" style="width:' + pct + '%"></span></div>' +
          '<small>Đang phục chế • <b data-fossil-timer="' + esc(entry.uid) + '">' + fmtRemain(left) + '</b>' +
            (entry.boosted ? ' • ⚡ tăng tốc' : '') + '</small></div>' +
      '</div>';
    }).join('');

    const ready = (f.ready || []).map(entry => {
      const def = fossilDef(entry.fossilId);
      const species = def && PG.SPECIES[def.speciesId];
      return '<div class="fossil-restore-row is-ready">' +
        '<span class="fossil-restore-row__icon">' + (def ? def.icon : '🦴') + '</span>' +
        '<div class="fossil-restore-row__body"><strong>' + esc(def ? def.name : entry.fossilId) + '</strong>' +
          '<small>Hoàn tất! ' + esc(species ? species.name : '') + ' sẵn sàng sống lại.</small></div>' +
        '<button class="btn btn--primary btn--sm" data-act="fossil-claim" data-uid="' + esc(entry.uid) + '">✨ Nhận</button>' +
      '</div>';
    }).join('');

    return '<section class="panel fossil-room">' +
      '<div class="panel__head"><h3 class="panel__title">🔬 Phòng Phục Chế</h3>' +
        '<span class="badge">' + (f.ready || []).length + ' sẵn sàng</span></div>' +
      (f.restoring && f.restoring.length ? '<div class="fossil-room__list">' + rows + '</div>' : '') +
      (f.ready && f.ready.length ? '<div class="fossil-room__list">' + ready + '</div>' : '') +
      (((!f.restoring || !f.restoring.length) && (!f.ready || !f.ready.length))
        ? '<p class="muted small">Phòng phục chế trống. Chọn một hóa thạch trong kho để bắt đầu.</p>'
        : '') +
    '</section>';
  }

  function tipsHtml() {
    const ev = st().events && st().events.active;
    const surge = ev && ev.id === SURGE_ID;
    return '<section class="panel fossil-tips">' +
      '<h3 class="panel__title">💡 Mẹo khai quật</h3>' +
      '<ul class="tips-list">' +
        '<li>Mỗi mỏ có thể ra nhiều loại hóa thạch; loại quý hiếm hơn thì phục chế lâu hơn.</li>' +
        '<li>Ưu tiên đào các ô <b>đỏ</b> gần ô vừa đào. Ô <b>xanh</b> nằm ngoài vùng có thể loại bỏ.</li>' +
        '<li>Đào đủ ' + MAX + ' lần chắc chắn tìm thấy hóa thạch, dù chưa trúng ô.</li>' +
        '<li>Thời gian phục chế chạy ngay cả khi bạn rời màn hình; quay lại để nhận Pokémon.</li>' +
      '</ul>' +
      (surge ? '<div class="fossil-surge">⚡ Sự kiện Hóa Thạch Bùng Nổ: phục chế nhanh hơn 40%.</div>' : '') +
    '</section>';
  }

  function statsHtml() {
    const state = st();
    const f = state.fossils || {};
    const inv = f.inventory || {};
    const total = Object.keys(inv).reduce((n, id) => n + (inv[id] || 0), 0);
    return '<span class="pill">⛏️ Đào: ' + ((f.stats && f.stats.dug) || 0) + '</span>' +
      '<span class="pill">🔬 Phục chế: ' + ((f.stats && f.stats.restored) || 0) + '</span>' +
      '<span class="pill">🦴 Tồn kho: ' + total + '</span>' +
      '<span class="pill">⚡ ' + (PG.Fossil.DIG_COST || 8) + ' thể lực/lần</span>';
  }

  ui.views.fossil = function () {
    const session = activeSession();
    return '<div class="fossil-page">' +
      '<div class="page-head">' +
        '<div><p class="eyebrow">Khảo cổ • Khai quật & phục chế</p>' +
          '<h1>🦴 Phòng Khai Quật Hóa Thạch</h1>' +
          '<p class="muted">Đào tìm hóa thạch trong lòng đất, rồi phục chế để đánh thức Pokémon cổ đại.</p></div>' +
        '<div class="page-wallet">' + statsHtml() + '</div>' +
      '</div>' +
      (session ? digHtml(session) : '') +
      '<div class="fossil-layout">' +
        '<div class="fossil-main">' + sitesHtml() + inventoryHtml() + '</div>' +
        '<aside class="fossil-side">' + restoreRoomHtml() + tipsHtml() + '</aside>' +
      '</div>' +
    '</div>';
  };

  /* ---------------- CẬP NHẬT TIMER KHÔNG RENDER LẠI ---------------- */
  function updateTimerDom() {
    if (ui.current !== 'fossil') return;
    if (PG.tickStamina) PG.tickStamina(true);
    ui.refreshTopbar();
    const f = st().fossils || {};
    const now = Date.now();
    ui.$all('[data-fossil-timer]').forEach(el => {
      const entry = (f.restoring || []).find(e => e && e.uid === el.dataset.fossilTimer);
      el.textContent = entry ? fmtRemain((entry.readyAt || 0) - now) : 'Xong';
    });
    ui.$all('[data-fossil-bar]').forEach(el => {
      const entry = (f.restoring || []).find(e => e && e.uid === el.dataset.fossilBar);
      if (!entry) return;
      const pct = PG.clamp((now - (entry.startedAt || now)) / Math.max(1, entry.durationMs || 1) * 100, 0, 100);
      el.style.width = pct + '%';
    });
  }

  function pollFossil() {
    if (ui.current !== 'fossil') { clearTimer(); return; }
    const moved = PG.Fossil.tick();
    if (moved > 0) { ui.render(); return; }
    updateTimerDom();
  }

  ui.mounted.fossil = function () {
    if (ui.current !== 'fossil') return;
    clearTimer();
    if (PG.Fossil.tick() > 0) { ui.render(); return; }
    updateTimerDom();
    ui.flow.fossilTimer = setInterval(pollFossil, 1000);
  };

  /* ---------------- ACTIONS ---------------- */
  ui.actions['fossil-dig'] = function (el) {
    const session = activeSession();
    if (session && !session.found) {
      ui.toast('Bạn đang đào ở mỏ khác. Hãy đào xong hoặc bỏ lượt.', 'warn');
      return;
    }
    const res = PG.Fossil.startDig(el.dataset.site);
    if (!res.ok) { ui.toast(res.msg || 'Không thể bắt đầu đào.', 'error'); PG.Audio.play('error'); return; }
    if (session) PG.Fossil.cancelDig(session.id);
    ui.flow.fossil = res.session;
    PG.Audio.play('click');
    ui.toast('Đã bắt đầu đào. Dò từng ô một nhé!', 'info');
    ui.refreshTopbar();
    ui.render();
  };

  function updateProbeDom(session, res) {
    const count = ui.$('#fossil-probe-count');
    if (count) count.textContent = session.probes + '/' + MAX + ' lần đào';
    const bar = ui.$('#fossil-probe-bar');
    if (bar) bar.style.width = Math.min(100, session.probes / MAX * 100) + '%';
    const fb = ui.$('#fossil-feedback');
    if (fb) {
      fb.textContent = res.msg;
      fb.className = 'fossil-feedback ' + hintClass(session.lastDistance);
    }
    ui.$all('#fossil-grid [data-cell]').forEach(cell => {
      const i = Number(cell.dataset.cell);
      const probed = (session.probed || []).indexOf(i) >= 0;
      cell.className = 'fossil-cell ' + cellHeat(session, i) + (probed ? ' is-dug' : '');
      cell.disabled = probed || !!session.found;
      if (session.found && session.target === i) {
        const def = fossilDef(session.fossilId);
        cell.textContent = def ? def.icon : '🦴';
      } else if (probed) cell.textContent = '·';
    });
  }

  ui.actions['fossil-probe'] = function (el) {
    const session = activeSession();
    if (!session) return;
    const res = PG.Fossil.probe(session.id, el.dataset.cell);
    if (!res.ok) {
      if (res.found) { ui.render(); return; }
      ui.toast(res.msg || 'Ô này không thể đào.', 'warn');
      return;
    }
    if (res.found) {
      PG.Audio.play('reward');
      ui.toast(res.msg, 'success');
      ui.refreshTopbar();
      ui.render();
      return;
    }
    PG.Audio.play(session.lastDistance <= 2 ? 'reelHit' : 'click');
    updateProbeDom(session, res);
    ui.refreshTopbar();
  };

  ui.actions['fossil-cancel-dig'] = function () {
    const session = activeSession();
    if (!session) { ui.render(); return; }
    ui.confirm('Bỏ lượt đào?', 'Bạn sẽ mất lượt đào này. Thể lực đã tiêu không được hoàn lại.', function () {
      PG.Fossil.cancelDig(session.id);
      ui.flow.fossil = null;
      PG.Audio.play('close');
      ui.toast('Đã bỏ lượt đào.', 'info');
      ui.render();
    }, { danger: true, okText: 'Bỏ lượt' });
  };

  ui.actions['fossil-start-restore'] = function (el) {
    const res = PG.Fossil.startRestore(el.dataset.id);
    ui.toast(res.msg || 'Không thể phục chế.', res.ok ? 'success' : 'error');
    if (!res.ok) { PG.Audio.play('error'); return; }
    PG.Audio.play('buy');
    ui.refreshTopbar();
    ui.render();
  };

  ui.actions['fossil-claim'] = function (el) {
    const res = PG.Fossil.claim(el.dataset.uid);
    ui.toast(res.msg || 'Không thể nhận Pokémon.', res.ok ? 'success' : 'error');
    if (!res.ok) { PG.Audio.play('error'); return; }
    PG.Audio.play(res.pokemon && res.pokemon.shiny ? 'shiny' : 'reward');
    if (res.rewards) {
      const r = res.rewards;
      ui.toast('Thưởng: +' + (r.candy || 0) + ' Kẹo • +' + PG.fmt(r.stardust || 0) + ' Bụi Sao • +' + (r.xp || 0) + ' XP', 'gold');
    }
    ui.refreshTopbar();
    ui.render();
  };

  ui.actions['fossil-sell'] = function (el) {
    const id = el.dataset.id;
    const def = fossilDef(id);
    if (!def) return;
    const price = def.sellCoins || Math.round((def.restoreCoins || 500) * 0.35);
    ui.confirm('Bán hóa thạch?', 'Bán ' + def.name + ' để lấy ' + PG.fmt(price) + ' Xu. Hóa thạch sẽ biến mất khỏi kho.', function () {
      const res = PG.Fossil.sell(id);
      ui.toast(res.msg || 'Không thể bán.', res.ok ? 'success' : 'error');
      if (!res.ok) { PG.Audio.play('error'); return; }
      PG.Audio.play('coin');
      ui.refreshTopbar();
      ui.render();
    }, { okText: 'Bán' });
  };
})();
