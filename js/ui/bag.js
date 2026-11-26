/* ============================================================
   TÚI ĐỒ: xem mọi vật phẩm Huấn luyện viên đang có
   Chỉ đọc state — không đổi cấu trúc save, dễ thêm nhóm mới.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  const GROUPS = [
    { id: 'all', label: 'Tất cả', icon: '✨' },
    { id: 'ball', label: 'Bóng', icon: '🔴' },
    { id: 'heal', label: 'Hồi phục', icon: '💊' },
    { id: 'material', label: 'Nguyên liệu', icon: '🪨' },
    { id: 'evolve', label: 'Tiến hóa & TM', icon: '💎' },
    { id: 'gear', label: 'Trang bị', icon: '🧥' },
    { id: 'special', label: 'Đặc biệt', icon: '🌟' },
    { id: 'egg', label: 'Trứng', icon: '🥚' },
    { id: 'fossil', label: 'Hóa thạch', icon: '🦴' }
  ];

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function groupOfKind(kind) {
    if (kind === 'ball') return 'ball';
    if (kind === 'berry' || kind === 'medicine') return 'heal';
    if (kind === 'material') return 'material';
    if (kind === 'stone' || kind === 'tm') return 'evolve';
    if (kind === 'held') return 'gear';
    return 'special';
  }

  function sellActions(id, qty, info) {
    if (id === 'bag-upgrade') return '<button class="btn btn--ghost btn--sm" data-act="use-bag-upgrade">Dùng</button>';
    if (info.kind === 'key' || info.kind === 'misc' || !(info.price > 0)) return '';
    return '<button class="btn btn--ghost btn--sm" data-act="sell-bag" data-id="' + esc(id) + '" data-qty="1">Bán 1</button>' +
      (qty > 1 ? '<button class="btn btn--ghost btn--sm" data-act="sell-bag" data-id="' + esc(id) + '" data-qty="' + qty + '">Hết</button>' : '');
  }

  function collect() {
    const st = PG.getState();
    const out = [];

    for (const [id, raw] of Object.entries(st.bag || {})) {
      const qty = Number(raw) || 0;
      if (qty <= 0) continue;
      const info = PG.itemInfo(id) || {};
      out.push({
        id, name: info.name || id, desc: info.desc || '', qty,
        group: groupOfKind(info.kind), icon: ui.itemIcon(id, 'md'),
        actions: sellActions(id, qty, info)
      });
    }

    for (const [id, raw] of Object.entries(st.materials || {})) {
      const qty = Number(raw) || 0;
      if (qty <= 0) continue;
      const info = PG.MATERIALS[id] || PG.itemInfo(id) || {};
      out.push({
        id, name: info.name || id, desc: info.desc || 'Nguyên liệu chế tạo.', qty,
        group: 'material', icon: ui.itemIcon(id, 'md'),
        actions: '<button class="btn btn--ghost btn--sm" data-act="sell-mat" data-id="' + esc(id) + '" data-qty="1">Bán 1</button>'
      });
    }

    for (const [type, raw] of Object.entries(st.candies || {})) {
      const qty = Number(raw) || 0;
      if (qty <= 0) continue;
      const t = PG.TYPES[type];
      out.push({
        id: 'candy-' + type, name: 'Kẹo ' + (t ? t.name : type), qty, group: 'heal',
        desc: 'Tăng chỉ số cho Pokémon hệ ' + (t ? t.name : type) + '.',
        icon: '<span class="item-icon item-icon--md" style="--ic:' + (t ? t.color : '#f472b6') + '">🍬</span>'
      });
    }

    const fish = st.fishing || {};
    for (const [id, raw] of Object.entries(fish.baits || {})) {
      const qty = Number(raw) || 0;
      if (qty <= 0) continue;
      const info = PG.BAITS[id] || PG.itemInfo(id) || {};
      out.push({ id: 'bait-' + id, name: info.name || id, desc: info.desc || 'Mồi câu cá.', qty, group: 'special', icon: ui.itemIcon(id, 'md') });
    }
    if (fish.rod) {
      const info = PG.RODS[fish.rod] || PG.itemInfo(fish.rod) || {};
      out.push({
        id: 'rod-' + fish.rod, name: info.name || fish.rod, desc: info.desc || 'Cần câu đang dùng.',
        qty: 1, group: 'special', icon: ui.itemIcon(fish.rod, 'md'),
        meta: fish.rodLevel ? 'Cấp ' + fish.rodLevel : ''
      });
    }

    for (const item of (st.equipment && st.equipment.inventory) || []) {
      if (!item) continue;
      const base = PG.getEquipBase ? PG.getEquipBase(item) : null;
      const rarity = PG.RARITY && PG.RARITY[item.rarity];
      out.push({
        id: item.uid || 'eq', name: PG.equipName ? PG.equipName(item) : (base ? base.name : 'Trang bị'),
        desc: base ? base.desc || '' : '', qty: 1, group: 'gear',
        icon: '<span class="item-icon item-icon--md" style="--ic:' + (rarity ? rarity.color : '#94a3b8') + '">' + (base ? base.icon || '🧥' : '🧥') + '</span>',
        meta: (rarity ? rarity.name : '') + (item.plus ? ' • +' + item.plus : ''),
        actions: '<button class="btn btn--ghost btn--sm" data-act="go" data-view="equip">Xem</button>'
      });
    }

    for (const item of st.player.trainerItems || []) {
      if (!item) continue;
      const def = PG.TRAINER_ITEMS && PG.TRAINER_ITEMS[item.itemId];
      out.push({
        id: item.uid || item.itemId || 'tritem', name: item.name || (def && def.name) || 'Vật phẩm HLV',
        desc: def && def.desc ? def.desc : 'Vật phẩm gắn vĩnh viễn cho Huấn luyện viên.', qty: 1, group: 'special',
        icon: '<span class="item-icon item-icon--md" style="--ic:#fbbf24">' + (item.icon || (def && def.icon) || '🌟') + '</span>',
        meta: def && def.rarity && PG.RARITY && PG.RARITY[def.rarity] ? PG.RARITY[def.rarity].name : ''
      });
    }

    const eggReady = (st.eggs || []).filter(e => e && e.ready && !e.hatched).length;
    const eggWalking = (st.eggs || []).filter(e => e && !e.ready && e.incubating).length;
    if (eggReady || eggWalking) {
      out.push({
        id: 'eggs', name: 'Trứng', desc: 'Ấp bằng cách đi bộ, sau đó nở trong Kho Pokémon.',
        qty: eggReady + eggWalking, group: 'egg',
        icon: '<span class="item-icon item-icon--md" style="--ic:#f8fafc">🥚</span>',
        meta: (eggReady ? eggReady + ' sẵn sàng' : '') + (eggWalking ? (eggReady ? ' • ' : '') + eggWalking + ' đang ấp' : ''),
        actions: '<button class="btn btn--ghost btn--sm" data-act="go" data-view="box">Xem</button>'
      });
    }

    for (const [id, raw] of Object.entries((st.fossils && st.fossils.inventory) || {})) {
      const qty = Number(raw) || 0;
      if (qty <= 0) continue;
      const def = PG.FOSSILS && PG.FOSSILS[id];
      out.push({
        id: 'fossil-' + id, name: def ? def.name : id, desc: def ? 'Phục chế thành ' + ((PG.SPECIES[def.speciesId] || {}).name || def.speciesId) + '.' : '',
        qty, group: 'fossil',
        icon: '<span class="item-icon item-icon--md" style="--ic:#d6b47c">' + (def ? def.icon || '🦴' : '🦴') + '</span>',
        actions: '<button class="btn btn--ghost btn--sm" data-act="go" data-view="fossil">Xem</button>'
      });
    }

    return out;
  }

  function bagFilter() {
    ui.flow.bagFilter = ui.flow.bagFilter || 'all';
    return ui.flow.bagFilter;
  }

  function card(o) {
    return '<article class="bag-card" data-group="' + o.group + '" data-search="' + esc(norm(o.name + ' ' + o.desc + ' ' + (o.meta || ''))) + '">' +
      '<span class="bag-card__icon">' + o.icon + '</span>' +
      '<span class="bag-card__body"><strong>' + esc(o.name) + '</strong>' +
        '<small>' + esc(o.desc || '—') + '</small>' +
        (o.meta ? '<small class="bag-card__meta">' + esc(o.meta) + '</small>' : '') +
      '</span>' +
      '<span class="bag-card__qty">×' + o.qty + '</span>' +
      (o.actions ? '<span class="bag-card__acts">' + o.actions + '</span>' : '') +
    '</article>';
  }

  ui.views.bag = function () {
    const st = PG.getState();
    const all = collect();
    const f = bagFilter();
    const counts = {};
    for (const o of all) counts[o.group] = (counts[o.group] || 0) + o.qty;
    const shown = f === 'all' ? all : all.filter(o => o.group === f);
    const used = PG.bagCount ? PG.bagCount() : Object.keys(st.bag || {}).reduce((n, id) => n + (st.bag[id] || 0), 0);
    const cap = PG.bagCapacity ? PG.bagCapacity() : 0;
    const pct = cap > 0 ? Math.min(100, Math.round(used / cap * 100)) : 0;

    const chips = GROUPS.map(g => {
      const n = g.id === 'all' ? all.reduce((s, o) => s + o.qty, 0) : (counts[g.id] || 0);
      return '<button class="filter-chip' + (f === g.id ? ' is-active' : '') + '" data-act="bag-filter" data-group="' + g.id + '">' +
        g.icon + ' ' + g.label + ' (' + n + ')</button>';
    }).join('');

    const sections = GROUPS.filter(g => g.id !== 'all').map(g => {
      const rows = shown.filter(o => o.group === g.id);
      if (!rows.length) return '';
      return '<section class="panel bag-panel">' +
        '<div class="panel__head"><h3 class="panel__title">' + g.icon + ' ' + g.label + '</h3>' +
          '<span class="muted small">' + rows.reduce((s, o) => s + o.qty, 0) + ' cái</span></div>' +
        '<div class="bag-grid">' + rows.map(card).join('') + '</div>' +
      '</section>';
    }).join('');

    return '<div class="bag-page">' +
      '<div class="page-head">' +
        '<div><p class="eyebrow">Hành lý • Sưu tầm</p><h1>🎒 Túi Đồ Huấn Luyện Viên</h1>' +
          '<p class="muted">Xem toàn bộ vật phẩm, nguyên liệu, trang bị và trứng bạn đang có.</p></div>' +
        '<div class="page-wallet"><span class="pill">🎒 ' + used + ' / ' + (cap || '∞') + ' ô</span></div>' +
      '</div>' +
      '<div class="panel bag-capacity"><div class="bag-capacity__top"><strong>Sức chứa túi</strong><span class="muted small">' + pct + '%</span></div>' +
        '<div class="bag-capacity__bar"><span style="width:' + pct + '%"></span></div></div>' +
      '<div class="bag-toolbar panel">' +
        '<div class="bag-toolbar__search">🔍<input id="bag-search" placeholder="Tìm vật phẩm..." autocomplete="off"></div>' +
        '<div class="bag-chips">' + chips + '</div>' +
      '</div>' +
      (shown.length ? sections : '<div class="empty-state"><div class="empty-state__icon">🎒</div><h3>Túi đang trống</h3>' +
        '<p class="muted">Đi chợ, đào hóa thạch hoặc săn trang bị để có thêm đồ.</p></div>') +
    '</div>';
  };

  ui.mounted.bag = function (host) {
    const root = host || document;
    const input = root.querySelector('#bag-search') || document.getElementById('bag-search');
    if (!input) return;
    input.addEventListener('input', function () {
      const q = norm(this.value.trim());
      const cards = root.querySelectorAll('.bag-card');
      let visible = 0;
      for (const el of cards) {
        const ok = (el.dataset.search || '').indexOf(q) >= 0;
        el.style.display = ok ? '' : 'none';
        if (ok) visible++;
      }
      for (const panel of root.querySelectorAll('.bag-panel')) {
        const any = Array.prototype.some.call(panel.querySelectorAll('.bag-card'), el => el.style.display !== 'none');
        panel.style.display = any ? '' : 'none';
      }
      const empty = root.querySelector('.bag-page > .empty-state');
      if (empty) empty.style.display = visible ? 'none' : '';
    });
  };

  ui.actions['bag-filter'] = function (el) {
    ui.flow.bagFilter = el.dataset.group || 'all';
    ui.render();
  };
})();
