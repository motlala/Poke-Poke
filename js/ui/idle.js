/* ============================================================
   GIAO DIỆN BẪY & TRẠI SĂN (IDLE)
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  function unlockedRegions() {
    const s = PG.getState();
    return (PG.REGION_ORDER || []).filter(r => PG.isRegionUnlocked(s, r));
  }
  function form() {
    const open = unlockedRegions();
    const first = open[0] || 'forest';
    if (!ui.flow.trapForm) {
      ui.flow.trapForm = {
        kind: 'trap',
        regionId: open.includes(PG.getState().region) ? PG.getState().region : first,
        baitType: 'grass',
        hours: 3
      };
    }
    // Nếu vùng đang chọn bị khóa thì tự chuyển về vùng đầu tiên đã mở.
    if (!open.includes(ui.flow.trapForm.regionId)) ui.flow.trapForm.regionId = first;
    return ui.flow.trapForm;
  }
  function costOf(f) {
    const kind = PG.Traps.KINDS[f.kind];
    const bait = PG.Traps.BAITS[f.baitType];
    const mats = Object.assign({}, kind.mats);
    mats[bait.material] = (mats[bait.material] || 0) + 1;
    return { coins: Math.round(f.hours * kind.coinPerHour), mats: mats };
  }
  function options(items, selected, label) {
    return items.map(x => '<option value="' + esc(x.value) + '"' + (x.value === selected ? ' selected' : '') + '>' +
      esc(label(x)) + '</option>').join('');
  }
  function entryCard(e, now) {
    const kind = PG.Traps.KINDS[e.kind] || PG.Traps.KINDS.trap;
    const region = PG.REGIONS[e.regionId] || { name: e.regionId };
    const bait = PG.Traps.BAITS[e.baitType] || { name: e.baitType, icon: '✨' };
    const ready = e.status === 'ready' || (e.endsAt || 0) <= now;
    const pct = ready ? 100 : PG.clamp((now - e.startedAt) / Math.max(1, e.endsAt - e.startedAt) * 100, 0, 100);
    const loot = ready ? (e.catches || []).map(c => {
      const sp = PG.SPECIES[c.speciesId];
      return '<span class="trap-loot" title="' + esc(sp ? sp.name : c.speciesId) + ' Lv.' + c.level + '">' +
        ui.spriteHtml({ speciesId: c.speciesId, shiny: c.shiny }, { size: 'xs' }) +
        '<small>' + esc(sp ? sp.name : c.speciesId) + '</small>' +
        (c.shiny ? '<b>✨</b>' : '') + '</span>';
    }).join('') : '';
    return '<article class="trap-entry' + (ready ? ' is-ready' : '') + '">' +
      '<div class="trap-entry__head">' +
        '<span class="trap-entry__icon">' + kind.icon + '</span>' +
        '<div><h4>' + kind.name + ' · ' + esc(region.name) + '</h4>' +
        '<p class="muted small">Mồi ' + bait.icon + ' ' + esc(bait.name) + ' • ' + e.hours + ' giờ • ' +
        (e.catches || []).length + ' Pokémon</p></div>' +
        '<span class="trap-entry__status">' + (ready ? 'Sẵn sàng' : 'Đang chạy') + '</span>' +
      '</div>' +
      '<div class="trap-progress" data-trap-bar="' + e.uid + '"><span style="width:' + pct.toFixed(1) + '%"></span></div>' +
      '<div class="trap-entry__foot">' +
        '<span class="trap-entry__timer" data-trap-timer="' + e.uid + '">' + PG.Traps.fmtRemain((e.endsAt || 0) - now) + '</span>' +
        (ready
          ? '<button class="btn btn--primary btn--sm" data-act="trap-claim" data-uid="' + e.uid + '">🎁 Thu hoạch</button>'
          : '<button class="btn btn--ghost btn--sm" data-act="trap-cancel" data-uid="' + e.uid + '">Dỡ bẫy (+50%)</button>') +
      '</div>' +
      (ready ? '<div class="trap-entry__loot">' + (loot || '<span class="muted small">Không có Pokémon</span>') + '</div>' : '') +
    '</article>';
  }

  ui.views.idle = function () {
    PG.Traps.tick();
    const s = PG.getState();
    const f = form();
    const all = (s.idleTraps || []).slice();
    const active = all.filter(e => e.status === 'active' && e.endsAt > Date.now());
    const ready = all.filter(e => e.status === 'ready' || e.endsAt <= Date.now());
    const cost = costOf(f);
    const kind = PG.Traps.KINDS[f.kind];
    const bait = PG.Traps.BAITS[f.baitType];
    const regionOptions = unlockedRegions().map(r => ({ value: r, label: PG.REGIONS[r].name }));
    const baitOptions = Object.keys(PG.Traps.BAITS).map(t => ({ value: t, label: PG.Traps.BAITS[t].icon + ' ' + PG.Traps.BAITS[t].name }));

    return '<div class="idle-page">' +
      '<section class="panel idle-hero">' +
        '<div class="idle-hero__icon">🪤</div>' +
        '<div><h2>Bẫy &amp; Trại săn</h2>' +
        '<p class="muted">Đặt bẫy hoặc trại ở một vùng, chọn mồi theo hệ. Thời gian chạy ngay cả khi bạn thoát game — ' +
        'quay lại sau 1–8 giờ để thu hoạch Pokémon!</p></div>' +
        '<span class="badge">' + active.length + '/' + PG.Traps.MAX_ACTIVE + ' đang chạy</span>' +
      '</section>' +

      '<section class="panel trap-setup">' +
        '<div class="panel__head"><h3 class="panel__title">⚙️ Đặt bẫy mới</h3></div>' +
        '<div class="trap-setup__grid">' +
          '<label>Loại<select class="select" data-change="trap-field" data-field="kind">' +
            options(Object.keys(PG.Traps.KINDS).map(k => ({ value: k, label: PG.Traps.KINDS[k].icon + ' ' + PG.Traps.KINDS[k].name })), f.kind, x => x.label) +
          '</select></label>' +
          '<label>Vùng<select class="select" data-change="trap-field" data-field="regionId">' +
            options(regionOptions, f.regionId, x => x.label) +
          '</select></label>' +
          '<label>Mồi theo hệ<select class="select" data-change="trap-field" data-field="baitType">' +
            options(baitOptions, f.baitType, x => x.label) +
          '</select></label>' +
          '<label>Thời gian<select class="select" data-change="trap-field" data-field="hours">' +
            options(kind.hours.map(h => ({ value: String(h), label: h + ' giờ' })), String(f.hours), x => x.label) +
          '</select></label>' +
        '</div>' +
        '<div class="trap-setup__cost">' +
          '<span>💰 ' + PG.fmt(cost.coins) + ' Xu</span>' +
          Object.keys(cost.mats).map(m => '<span>' + (PG.MATERIALS[m] ? PG.MATERIALS[m].icon : '•') + ' ' +
            (PG.MATERIALS[m] ? PG.MATERIALS[m].name : m) + ' ×' + cost.mats[m] + '</span>').join('') +
        '</div>' +
        '<p class="muted small">' + kind.icon + ' ' + kind.name + ' giữ tối đa ' +
          (kind.slots[f.hours] || kind.slots[kind.hours[0]]) + ' Pokémon; mồi ' + bait.icon + ' ' + bait.name +
          ' thu hút loài hệ ' + bait.name + ' mạnh hơn. Không biết chắc loài nào — thu hoạch mới biết!</p>' +
        '<button class="btn btn--primary btn--block" data-act="trap-place">🪤 Đặt ' + kind.name + '</button>' +
      '</section>' +

      (ready.length ? '<section class="panel trap-ready">' +
        '<div class="panel__head"><h3 class="panel__title">🎁 Sẵn sàng thu hoạch</h3>' +
          '<button class="btn btn--gold btn--sm" data-act="trap-claim-all">Thu tất cả</button></div>' +
        ready.map(e => entryCard(e, Date.now())).join('') +
      '</section>' : '') +

      '<section class="panel trap-active">' +
        '<div class="panel__head"><h3 class="panel__title">⏳ Đang chạy</h3></div>' +
        (active.length ? active.map(e => entryCard(e, Date.now())).join('') :
          '<p class="muted small">Chưa có bẫy nào. Đặt một cái ở trên để bắt đầu!</p>') +
      '</section>' +
    '</div>';
  };

  ui.mounted.idle = function () {
    if (ui.flow.trapTimer) clearInterval(ui.flow.trapTimer);
    function update() {
      const now = Date.now();
      const list = (PG.getState().idleTraps || []);
      ui.$all('[data-trap-timer]').forEach(el => {
        const e = list.find(x => x.uid === el.dataset.trapTimer);
        if (e) el.textContent = PG.Traps.fmtRemain((e.endsAt || 0) - now);
      });
      ui.$all('[data-trap-bar]').forEach(el => {
        const e = list.find(x => x.uid === el.dataset.trapBar);
        if (!e) return;
        const pct = PG.clamp((now - e.startedAt) / Math.max(1, e.endsAt - e.startedAt) * 100, 0, 100);
        el.firstElementChild.style.width = pct.toFixed(1) + '%';
      });
    }
    update();
    ui.flow.trapTimer = setInterval(function () {
      if (ui.current !== 'idle') { clearInterval(ui.flow.trapTimer); ui.flow.trapTimer = null; return; }
      if (PG.Traps.tick() > 0) { ui.render(); return; }
      update();
    }, 1000);
  };

  ui.changes['trap-field'] = function (el) {
    const f = form();
    const field = el.dataset.field;
    let value = el.value;
    if (field === 'hours') value = Number(value);
    f[field] = value;
    if (field === 'kind') {
      const kind = PG.Traps.KINDS[f.kind];
      if (kind.hours.indexOf(f.hours) < 0) f.hours = kind.hours[0];
    }
    ui.render();
  };

  ui.actions['trap-place'] = function () {
    const f = form();
    const h = Number(f.hours);
    const r = PG.Traps.place(f.kind, f.regionId, f.baitType, h);
    ui.toast(r.msg, r.ok ? 'success' : 'error', r.ok ? 4200 : 3200);
    if (r.ok) PG.Audio.play('reward');
    ui.refreshTopbar();
    ui.render();
  };
  ui.actions['trap-claim'] = function (el) {
    const r = PG.Traps.claim(el.dataset.uid);
    ui.toast(r.msg, r.ok ? 'success' : 'error', r.ok ? 5200 : 3200);
    if (r.ok) PG.Audio.play('reward');
    ui.refreshTopbar();
    ui.render();
  };
  ui.actions['trap-claim-all'] = function () {
    const r = PG.Traps.claimAll();
    ui.toast(r.msg, r.ok ? 'success' : 'warn', 4200);
    if (r.ok) PG.Audio.play('reward');
    ui.refreshTopbar();
    ui.render();
  };
  ui.actions['trap-cancel'] = function (el) {
    ui.confirm('Dỡ bẫy?', 'Bạn sẽ nhận lại một nửa Xu đã đặt.', function () {
      const r = PG.Traps.cancel(el.dataset.uid);
      ui.toast(r.msg, r.ok ? 'success' : 'error');
      ui.refreshTopbar();
      ui.render();
    });
  };
})();
