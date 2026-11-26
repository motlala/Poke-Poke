/* ============================================================
   TRANG BỊ: 7 ô, bộ trang bị, nâng cấp, khắc may mắn
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  function st() { return PG.getState(); }
  function findItem(uid) {
    const state = st();
    let item = state.equipment.inventory.find(i => i.uid === uid);
    if (item) return { item, equipped: false };
    for (const slot of PG.SLOTS) {
      const eq = state.equipment.equipped[slot.id];
      if (eq && eq.uid === uid) return { item: eq, equipped: true };
    }
    return null;
  }
  function statRows(item, compare) {
    const base = PG.getEquipBase(item);
    if (!base) return '';
    const keys = Object.keys(PG.STAT_META).filter(k => k !== 'luck' && ((item.stats && item.stats[k]) || (base.baseStats && base.baseStats[k])));
    if (!keys.length) return '<p class="muted small">Trang bị này không có chỉ số phụ.</p>';
    return '<div class="equip-stats">' + keys.map(k => {
      const meta = PG.STAT_META[k];
      const v = (item.stats && item.stats[k]) || 0;
      const old = compare ? (compare.stats && compare.stats[k]) || 0 : null;
      const delta = old !== null && v !== old ? '<span class="equip-stat__delta ' + (v > old ? 'up' : 'down') + '">' + (v > old ? '+' : '') + (v - old) + '</span>' : '';
      return '<div class="equip-stat"><span class="equip-stat__name">' + meta.icon + ' ' + meta.name + '</span>' +
        '<b>' + v + meta.suffix + '</b>' + delta + '</div>';
    }).join('') + '</div>';
  }

  function slotCard(slot) {
    const item = st().equipment.equipped[slot.id];
    if (!item) {
      return '<div class="equip-slot equip-slot--empty"><span class="equip-slot__icon">' + slot.icon + '</span>' +
        '<span class="equip-slot__name">' + slot.name + '</span><small>Trống</small></div>';
    }
    const base = PG.getEquipBase(item);
    const rarity = PG.RARITY[base.rarity];
    return '<button class="equip-slot" data-act="equip-open" data-uid="' + item.uid + '" style="--rc:' + rarity.color + ';--rg:' + rarity.glow + '">' +
      '<span class="equip-slot__badge">' + slot.icon + '</span>' +
      '<span class="equip-slot__icon">' + base.icon + '</span>' +
      '<span class="equip-slot__name">' + esc(base.name) + (item.plus ? ' <b>+' + item.plus + '</b>' : '') + '</span>' +
      '<span class="equip-slot__meta"><span style="color:' + rarity.color + '">' + rarity.name + '</span> • ✨' + item.luck + '</span>' +
      '<span class="equip-slot__unequip" data-act="equip-unequip" data-slot="' + slot.id + '" title="Tháo">✕</span>' +
    '</button>';
  }

  function setPanel() {
    const agg = PG.trainerBonuses(st());
    const rows = Object.keys(PG.SETS).map(id => {
      const set = PG.SETS[id];
      const count = agg.setCounts[id] || 0;
      if (!count) return '';
      const max = set.bonus7 ? 7 : 4;
      const tier = count >= max ? max : count >= 4 ? 4 : count >= 3 ? 3 : 0;
      const bonus = tier === 7 ? set.bonus7 : tier === 4 ? set.bonus4 : tier === 3 ? set.bonus3 : null;
      const bonusText = bonus ? Object.entries(bonus).map(([k, v]) => {
        if (k === 'typeBoost') return Object.entries(v).map(([t, m]) => '+' + Math.round((m - 1) * 100) + '% ' + PG.TYPES[t].name).join(' ');
        const meta = PG.STAT_META[k] || { name: k, icon: '', suffix: '' };
        return meta.icon + ' +' + v + meta.suffix + ' ' + meta.name;
      }).join(' • ') : '';
      return '<div class="set-row' + (tier ? ' is-active' : '') + '" style="--sc:' + set.color + '">' +
        '<span class="set-row__icon">' + set.icon + '</span>' +
        '<div class="set-row__body"><strong>' + set.name + ' <span class="set-row__count">' + count + '/' + max + '</span></strong>' +
          '<small>' + (tier ? 'Kích hoạt ' + tier + ' món: ' + bonusText : 'Mặc 3 món để kích hoạt bộ.') + '</small>' +
          '<div class="set-row__pips">' + Array.from({ length: max }, (_, i) => i + 1).map(i => '<span class="' + (count >= i ? 'on' : '') + '"></span>').join('') + '</div></div>' +
      '</div>';
    }).filter(Boolean).join('');
    return '<section class="panel equip-sets">' +
      '<div class="panel__head"><h3 class="panel__title">🎨 Bộ Trang Bị</h3><span class="badge">' + agg.activeSets.length + ' bộ kích hoạt</span></div>' +
      (rows || '<p class="muted small">Chưa mặc trang bị nào. Mở kho bên dưới và trang bị để bắt đầu.</p>') +
    '</section>';
  }

  function totalsPanel() {
    const agg = PG.trainerBonuses(st());
    const fx = agg.luckFx;
    const t = agg.totals;
    const keys = ['atk', 'def', 'spa', 'spd', 'spe', 'hp', 'luck', 'crit', 'dodge', 'accuracy', 'rareFind', 'stamina', 'bag', 'speed', 'heat', 'cold', 'sand', 'fishingPower'];
    return '<section class="panel equip-totals">' +
      '<div class="panel__head"><h3 class="panel__title">📊 Chỉ Số Tổng</h3><span class="badge">May mắn hiệu dụng ' + fx.effective + '</span></div>' +
      '<div class="luck-hero"><div class="luck-hero__orb">🍀</div><div><strong>✨ May mắn ' + t.luck + '</strong>' +
        '<small>Chí mạng ' + Math.round(fx.crit * 100) + '% • Né đòn ' + Math.round(fx.dodge * 100) + '% • Shiny +' + Math.round(fx.shiny * 1000) / 10 + '%</small></div></div>' +
      '<div class="totals-grid">' + keys.filter(k => k !== 'luck').map(k => {
        const meta = (PG.TRAINER_STAT_META && PG.TRAINER_STAT_META[k]) || PG.STAT_META[k];
        if (!meta) return '';
        return '<div class="total-chip"><span>' + meta.icon + '</span><div><small>' + meta.name + '</small><b>' + PG.fmt(t[k] || 0) + meta.suffix + '</b></div></div>';
      }).join('') + '</div>' +
      '<p class="muted small">May mắn giúp tăng Chí mạng, Né đòn và tỉ lệ gặp Shiny / loài hiếm. Trang bị +3, +6, +9 còn được cộng thêm May mắn.</p>' +
    '</section>';
  }

  /** Sơ đồ khắc hệ: hệ nào đang được cộng sát thương + khắc chế của từng hệ. */
  function elementChartPanel() {
    const agg = PG.trainerBonuses(st());
    const boosts = agg.totals.typeBoost || {};
    const engraved = (agg.items || []).filter(it => it.element && PG.TYPES[it.element]);
    const cells = (PG.TYPE_ORDER || Object.keys(PG.TYPES || {})).map(t => {
      const def = PG.TYPES[t];
      const mult = boosts[t] || 1;
      const strong = Object.entries((PG.OFFENSE && PG.OFFENSE[t]) || {})
        .filter(([, m]) => m > 1).slice(0, 3).map(([d]) => PG.TYPES[d] ? PG.TYPES[d].icon : d).join('');
      const weak = Object.entries((PG.OFFENSE && PG.OFFENSE[t]) || {})
        .filter(([, m]) => m < 1 && m > 0).slice(0, 3).map(([d]) => PG.TYPES[d] ? PG.TYPES[d].icon : d).join('');
      return '<div class="element-cell' + (mult > 1 ? ' is-on' : '') + '" style="--tc:' + def.color + '" title="' +
        esc(def.name + ' • mạnh: ' + (strong || '—') + ' • yếu: ' + (weak || '—')) + '">' +
        '<span class="element-cell__icon">' + def.icon + '</span><span class="element-cell__name">' + esc(def.name) + '</span>' +
        '<b class="element-cell__boost">' + (mult > 1 ? '+' + Math.round((mult - 1) * 100) + '%' : '—') + '</b>' +
        '</div>';
    }).join('');
    return '<section class="panel element-chart">' +
      '<div class="panel__head"><h3 class="panel__title">🔮 Sơ Đồ Khắc Hệ</h3><span class="badge">' + engraved.length + ' hệ đang cộng</span></div>' +
      (engraved.length ? '<p class="muted small">Đang khắc: ' + engraved.map(it =>
        PG.TYPES[it.element].icon + ' ' + PG.TYPES[it.element].name + ' +' + Math.round((PG.elementBoost(it) - 1) * 100) + '%').join(' • ') + '</p>' :
        '<p class="muted small">Chưa có trang bị khắc hệ. Mở một món trong kho → <b>🔮 Khắc Hệ</b> để cộng sát thương cho chiêu cùng hệ.</p>') +
      '<div class="element-chart__grid">' + cells + '</div>' +
      '<p class="muted small">Icon trên mỗi ô là hệ bị khắc chế / kháng lại. % là tổng cộng từ khắc hệ và bộ trang bị, áp dụng trực tiếp vào sát thương chiêu cùng hệ.</p>' +
    '</section>';
  }

  function inventoryPanel() {
    const state = st();
    const filter = ui.flow.equipFilter || 'all';
    let list = state.equipment.inventory.slice();
    list.sort((a, b) => {
      const ra = PG.RARITY_ORDER.indexOf(a.rarity), rb = PG.RARITY_ORDER.indexOf(b.rarity);
      if (ra !== rb) return rb - ra;
      return (b.plus || 0) - (a.plus || 0) || (b.luck || 0) - (a.luck || 0);
    });
    if (filter !== 'all') list = list.filter(i => {
      const base = PG.getEquipBase(i);
      return base && base.slot === filter;
    });
    const chips = '<div class="chip-row">' +
      '<button class="filter-chip' + (filter === 'all' ? ' is-active' : '') + '" data-act="equip-filter" data-slot="all">Tất cả (' + state.equipment.inventory.length + ')</button>' +
      PG.SLOTS.map(s => '<button class="filter-chip' + (filter === s.id ? ' is-active' : '') + '" data-act="equip-filter" data-slot="' + s.id + '">' + s.icon + ' ' + s.name + '</button>').join('') +
      '</div>';
    return '<section class="panel equip-inventory">' +
      '<div class="panel__head"><h3 class="panel__title">🎒 Kho Trang Bị</h3><span class="muted small">' + state.equipment.inventory.length + ' món</span></div>' +
      chips +
      (list.length ? '<div class="equip-grid">' + list.map(item => {
        const base = PG.getEquipBase(item);
        if (!base) return '';
        const rarity = PG.RARITY[base.rarity];
        return '<button class="equip-card" data-act="equip-open" data-uid="' + item.uid + '" style="--rc:' + rarity.color + ';--rg:' + rarity.glow + '">' +
          '<span class="equip-card__rarity">' + rarity.name + '</span>' +
          '<span class="equip-card__icon">' + base.icon + '</span>' +
          '<strong class="equip-card__name">' + esc(base.name) + (item.plus ? ' +' + item.plus : '') + '</strong>' +
          '<span class="equip-card__slot">' + (PG.SLOTS.find(s => s.id === base.slot) || {}).icon + ' ' + (PG.SLOTS.find(s => s.id === base.slot) || {}).name + '</span>' +
          '<span class="equip-card__stats">✨ ' + item.luck + (item.enchantCount ? ' • 🌀' + item.enchantCount : '') +
            (item.element && PG.TYPES[item.element] ? ' • 🔮' + PG.TYPES[item.element].icon : '') + '</span>' +
        '</button>';
      }).join('') + '</div>' : '<div class="empty-state empty-state--sm"><div class="empty-state__icon">🧥</div><h3>Kho trống</h3><p class="muted">Mua trang bị ở Chợ, chế tạo hoặc chiến thắng trận đấu để nhận.</p></div>') +
    '</section>';
  }

  ui.views.equip = function () {
    const state = st();
    return '<div class="equip-page">' +
      '<div class="page-head">' +
        '<div><p class="eyebrow">Trang bị • May mắn</p><h1>🧥 Trang Bị Huấn Luyện Viên</h1>' +
          '<p class="muted">7 ô trang bị, 9 bộ sưu tập (Bộ Vô Địch có thưởng đủ 7 món), nâng cấp tới +15 và khắc May mắn.</p></div>' +
        '<div class="page-wallet"><span class="pill pill--gold">🪙 ' + PG.fmt(state.player.coins) + '</span>' +
          '<span class="pill">🍀 ' + (state.bag['lucky-clover'] || 0) + ' Cỏ</span>' +
          '<span class="pill">🧿 ' + (state.bag['protection-charm'] || 0) + ' Bùa</span></div>' +
      '</div>' +
      '<div class="equip-layout">' +
        '<section class="panel equip-doll">' +
          '<div class="panel__head"><h3 class="panel__title">👤 Trang Bị Đang Mặc</h3><span class="badge">' + PG.trainerBonuses(state).items.length + '/7</span></div>' +
          '<div class="equip-slots">' + PG.SLOTS.map(slotCard).join('') + '</div>' +
        '</section>' +
        '<div class="equip-side">' + totalsPanel() + setPanel() + elementChartPanel() + '</div>' +
      '</div>' +
      inventoryPanel() +
    '</div>';
  };

  /* ---------------- DETAIL ---------------- */
  function openItem(uid) {
    const found = findItem(uid);
    if (!found) { ui.closeModal(); ui.toast('Trang bị không còn trong kho.', 'error'); return; }
    const item = found.item;
    const base = PG.getEquipBase(item);
    const rarity = PG.RARITY[base.rarity];
    const slot = PG.SLOTS.find(s => s.id === base.slot);
    const cost = PG.upgradeCost(item);
    const fail = PG.upgradeFailChance(item.plus || 0);
    const enchant = PG.enchantCost(item);
    const hasProtect = (st().bag['protection-charm'] || 0) > 0;
    const canUp = (item.plus || 0) < PG.EQUIPMENT_MAX_PLUS;
    const spare = st().equipment.inventory.filter(i => i.uid !== item.uid).length;
    ui.modal({
      title: '<span style="color:' + rarity.color + '">' + base.icon + ' ' + esc(base.name) + (item.plus ? ' +' + item.plus : '') + '</span>',
      subtitle: rarity.name + ' • ' + slot.name + ' • ' + (found.equipped ? 'Đang mặc' : 'Trong kho'),
      body: '<div class="equip-detail" style="--rc:' + rarity.color + ';--rg:' + rarity.glow + '">' +
        '<div class="equip-detail__hero">' +
          '<div class="equip-detail__icon">' + base.icon + '<span class="equip-detail__plus">+' + (item.plus || 0) + '</span></div>' +
          '<div class="equip-detail__meta"><p>' + esc(base.desc) + '</p>' +
            '<div class="equip-luck">✨ May mắn <b>' + item.luck + '</b>' + (item.enchantCount ? ' <small>(đã khắc ' + item.enchantCount + '/5)</small>' : '') + '</div>' +
            '<div class="equip-tags"><span class="pill pill--sm">' + PG.SETS[base.set].icon + ' ' + PG.SETS[base.set].name + '</span>' +
            '<span class="pill pill--sm">' + rarity.name + '</span>' +
            (item.element && PG.TYPES[item.element] ? '<span class="pill pill--sm">🔮 ' + PG.TYPES[item.element].icon + ' ' + PG.TYPES[item.element].name + ' +' + Math.round((PG.elementBoost(item) - 1) * 100) + '%</span>' : '') +
            '</div></div>' +
        '</div>' +
        '<h4 class="mini-title">Chỉ số</h4>' + statRows(item) +
        '<div class="equip-actions">' +
          '<button class="btn ' + (found.equipped ? 'btn--ghost' : 'btn--primary') + '" data-act="' + (found.equipped ? 'equip-unequip' : 'equip-equip') + '" ' +
            (found.equipped ? 'data-slot="' + base.slot + '"' : 'data-uid="' + item.uid + '"') + '>' +
            (found.equipped ? 'Tháo ra' : 'Trang bị') + '</button>' +
          (canUp ? '<button class="btn btn--primary" data-act="equip-upgrade" data-uid="' + item.uid + '">⬆️ Nâng cấp (' + PG.fmt(cost.coins) + ' Xu)</button>' : '<span class="pill">Đã +' + PG.EQUIPMENT_MAX_PLUS + '</span>') +
          (canUp && spare ? '<button class="btn btn--gold" data-act="equip-sacrifice" data-uid="' + item.uid + '">🔥 Hiến tế nâng cấp</button>' : '') +
          '<button class="btn btn--challenge" data-act="equip-engrave" data-uid="' + item.uid + '">🔮 Khắc Hệ' + (item.element ? ' (đổi)' : '') + '</button>' +
          '<button class="btn btn--ghost" data-act="equip-enchant" data-uid="' + item.uid + '"' + ((item.enchantCount || 0) >= 5 ? ' disabled' : '') + '>🌀 Khắc May mắn</button>' +
          (!found.equipped ? '<button class="btn btn--danger" data-act="equip-sell" data-uid="' + item.uid + '">Bán (' + PG.fmt(PG.equipmentSellValue(item)) + ' Xu)</button>' : '') +
        '</div>' +
        (canUp ? '<div class="upgrade-info"><p class="muted small">Nâng cấp cần 🪙 ' + PG.fmt(cost.coins) + ' + ' +
          Object.entries(cost.mats).map(([id, n]) => PG.itemInfo(id).icon + ' ' + n + ' ' + PG.itemInfo(id).name + ' (có ' + PG.countOwned(id) + ')').join(', ') +
          '</p>' + (fail > 0 ? '<p class="small ' + (hasProtect ? 'muted' : 'warn-text') + '">⚠️ Tỉ lệ thất bại ' + Math.round(fail * 100) + '%' + (item.plus > 0 ? ', có thể tụt cấp.' : '.') +
            (hasProtect ? ' <label class="check-inline"><input type="checkbox" id="equip-protect" checked> Dùng Bùa Bảo Vệ (' + st().bag['protection-charm'] + ')</label>' : ' Không có Bùa Bảo Vệ.') + '</p>' : '') + '</div>' : '') +
      '</div>',
      size: 'md',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Đóng</button>' +
        '<button class="btn btn--primary" data-act="go" data-view="craft">🛠️ Chế thêm</button>'
    });
  }

  ui.actions['equip-open'] = function (el) { openItem(el.dataset.uid); };

  ui.actions['equip-equip'] = function (el) {
    const res = PG.equipItem(el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('equip'); ui.refreshTopbar(); ui.render(); openItem(el.dataset.uid); }
  };

  ui.actions['equip-unequip'] = function (el, e) {
    e.stopPropagation();
    const res = PG.unequipSlot(el.dataset.slot);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { ui.refreshTopbar(); ui.render(); }
  };

  ui.actions['equip-upgrade'] = function (el) {
    const protectEl = document.getElementById('equip-protect');
    const useProtect = !!(protectEl && protectEl.checked);
    const res = PG.upgradeEquipment(el.dataset.uid, useProtect);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    PG.Audio.play(res.ok ? 'levelup' : 'error');
    if (res.ok) {
      ui.refreshTopbar();
      ui.render();
      openItem(el.dataset.uid);
    }
  };

  /* ---------------- HIẾN TẾ NÂNG CẤP (+15) ---------------- */
  ui.actions['equip-sacrifice'] = function (el) {
    const uid = el.dataset.uid;
    const found = findItem(uid);
    if (!found) return;
    const item = found.item;
    const inv = st().equipment.inventory.filter(i => i.uid !== uid);
    if (!inv.length) { ui.toast('Kho không còn món nào để hiến tế.', 'error'); return; }
    const body = '<div class="sacrifice-box">' +
      '<p class="muted small">Chọn một món trong kho làm tế phẩm — món đó <b>mất ngay</b>. Giá trị càng cao ' +
      '(độ hiếm, cấp +, may mắn) thì tỉ lệ lên <b>+' + ((item.plus || 0) + 1) + '</b> càng tốt; ' +
      'nếu hỏng, ' + esc(PG.equipName(item)) + ' sẽ tụt 1 cấp (không dưới +0).</p>' +
      '<div class="sacrifice-list">' + inv.map(i => {
        const b = PG.getEquipBase(i);
        if (!b) return '';
        const rar = PG.RARITY[i.rarity || b.rarity] || PG.RARITY.common;
        const chance = PG.sacrificeChance(item, i);
        return '<button class="sacrifice-item" data-act="equip-sacrifice-do" data-target="' + uid + '" data-offering="' + i.uid + '">' +
          '<span class="sacrifice-item__icon" style="--rc:' + rar.color + '">' + b.icon + '</span>' +
          '<span class="sacrifice-item__body"><strong>' + esc(PG.equipName(i)) + '</strong>' +
            '<small>' + esc(rar.name) + ' • trị giá 🪙 ' + PG.fmt(PG.equipmentWorth(i)) + '</small></span>' +
          '<span class="pill pill--sm' + (chance >= 0.7 ? ' pill--gold' : '') + '">' + Math.round(chance * 100) + '% lên</span>' +
        '</button>';
      }).join('') + '</div></div>';
    ui.modal({
      title: '🔥 Hiến tế nâng cấp',
      subtitle: PG.equipName(item) + ' • đang +' + (item.plus || 0) + ' / +' + PG.EQUIPMENT_MAX_PLUS,
      body, size: 'md',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Đóng</button>'
    });
  };

  ui.actions['equip-sacrifice-do'] = function (el) {
    const res = PG.sacrificeUpgrade(el.dataset.target, el.dataset.offering);
    ui.toast(res.msg, res.success ? 'success' : 'error');
    PG.Audio.play(res.success ? 'levelup' : 'error');
    if (res.ok) {
      ui.render();
      openItem(el.dataset.target);
    }
  };

  ui.actions['equip-sell'] = function (el) {
    ui.confirm('Bán trang bị?', 'Bạn sẽ nhận ' + PG.fmt(PG.equipmentSellValue(findItem(el.dataset.uid).item)) + ' Xu. Thao tác không thể hoàn tác.', function () {
      const res = PG.sellEquipment(el.dataset.uid);
      ui.toast(res.msg, res.ok ? 'success' : 'error');
      if (res.ok) { ui.closeModal(); ui.refreshTopbar(); ui.render(); }
    }, { danger: true, okText: 'Bán' });
  };

  /* ---------------- KHẮC HỆ ---------------- */
  function engravePicker(uid) {
    const item = findItem(uid);
    if (!item) return;
    const cost = PG.engraveCost(item.item);
    const types = (PG.TYPE_ORDER || Object.keys(PG.TYPES)).map(t => {
      const def = PG.TYPES[t];
      const strong = Object.entries((PG.OFFENSE && PG.OFFENSE[t]) || {}).filter(([, m]) => m > 1)
        .map(([d]) => PG.TYPES[d] ? PG.TYPES[d].icon : '').join('');
      return '<button class="engrave-type' + (item.item.element === t ? ' is-current' : '') + '" data-act="equip-engrave-pick" ' +
        'data-uid="' + uid + '" data-type="' + t + '" style="--tc:' + def.color + '">' +
        '<span class="engrave-type__icon">' + def.icon + '</span><strong>' + esc(def.name) + '</strong>' +
        '<small>' + (strong ? 'Khắc: ' + strong : 'Không khắc hệ nào') + (item.item.element === t ? ' • đang dùng' : '') + '</small></button>';
    }).join('');
    ui.modal({
      title: '🔮 Khắc Hệ',
      subtitle: 'Chiêu cùng hệ sẽ gây thêm ' + Math.round((PG.elementBoost(item.item) - 1) * 100) + '% sát thương khi mặc món này.',
      body: '<div class="engrave-box"><p class="muted small">Chi phí: 🪙 ' + PG.fmt(cost.coins) + ' + ' +
        Object.entries(cost.mats).filter(([, n]) => n).map(([id, n]) => PG.itemInfo(id).icon + ' ' + n + ' ' + PG.itemInfo(id).name + ' (có ' + PG.countOwned(id) + ')').join(', ') +
        '. Khắc lại hệ khác sẽ thay hệ cũ.</p><div class="engrave-grid">' + types + '</div></div>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>',
      size: 'md'
    });
  }

  ui.actions['equip-engrave'] = function (el) { engravePicker(el.dataset.uid); };

  ui.actions['equip-engrave-pick'] = function (el) {
    const uid = el.dataset.uid, type = el.dataset.type;
    const item = findItem(uid);
    if (!item || !PG.TYPES[type]) return;
    const cost = PG.engraveCost(item.item);
    ui.modal({
      title: '🔮 Xác Nhận Khắc Hệ',
      subtitle: PG.TYPES[type].icon + ' ' + PG.TYPES[type].name,
      body: '<div class="engrave-confirm"><p>Đổi hệ của <b>' + esc(PG.equipName(item.item)) + '</b> thành <b>' + PG.TYPES[type].icon + ' ' + PG.TYPES[type].name + '</b>.</p>' +
        '<p class="muted small">Hiệu ứng: chiêu hệ ' + PG.TYPES[type].name + ' +' + Math.round((PG.elementBoost(item.item) - 1) * 100) + '% sát thương trong trận đấu.</p>' +
        '<p class="muted small">Chi phí: 🪙 ' + PG.fmt(cost.coins) + (Object.entries(cost.mats).filter(([, n]) => n).length ?
          ' + ' + Object.entries(cost.mats).filter(([, n]) => n).map(([id, n]) => PG.itemInfo(id).icon + ' ' + n).join(' + ') : '') + '</p></div>',
      footer: '<button class="btn btn--ghost" data-act="equip-engrave-back" data-uid="' + uid + '">← Chọn hệ khác</button>' +
        '<button class="btn btn--challenge" data-act="equip-engrave-do" data-uid="' + uid + '" data-type="' + type + '">Khắc ngay</button>',
      size: 'sm'
    });
  };

  ui.actions['equip-engrave-back'] = function (el) { engravePicker(el.dataset.uid); };

  ui.actions['equip-engrave-do'] = function (el) {
    const res = PG.engraveEquipment(el.dataset.uid, el.dataset.type);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('shiny'); ui.refreshTopbar(); ui.render(); openItem(el.dataset.uid); }
  };

  /* ---------------- ENCHANT ---------------- */
  ui.actions['equip-enchant'] = function (el) {
    const uid = el.dataset.uid;
    const found = findItem(uid);
    if (!found) return;
    ui.flow.enchantLocks = ui.flow.enchantLocks || [];
    const item = found.item;
    const cost = PG.enchantCost(item);
    const statKeys = ['heat', 'cold', 'sand', 'stamina', 'bag', 'rareFind', 'accuracy', 'speed', 'dodge'];
    const body = '<div class="enchant-box">' +
      '<p class="muted">Khắc lại sẽ thay đổi <b>May mắn</b> và <b>một chỉ số phụ</b>. Khóa chỉ số để giữ nguyên, mỗi khóa tốn thêm 1 Cỏ.</p>' +
      '<div class="enchant-current"><span>✨ May mắn hiện tại</span><b>' + item.luck + '</b></div>' +
      '<h4 class="mini-title">Khóa chỉ số</h4>' +
      '<div class="enchant-locks">' + statKeys.map(k => {
        const meta = PG.STAT_META[k];
        const on = (ui.flow.enchantLocks || []).includes(k);
        return '<button class="enchant-lock' + (on ? ' is-on' : '') + '" data-act="equip-lock" data-key="' + k + '">' + meta.icon + ' ' + meta.name + '</button>';
      }).join('') + '</div>' +
      '<div class="enchant-cost"><span>Chi phí</span><b>🪙 ' + PG.fmt(cost.coins + (ui.flow.enchantLocks || []).length * 0) + ' + 🍀 ' + cost.clovers + '</b></div>' +
      '<p class="muted small">Bạn có 🍀 ' + (st().bag['lucky-clover'] || 0) + ' Cỏ Bốn Lá. May mắn càng cao càng quý!</p>' +
    '</div>';
    ui.modal({
      title: '🌀 Khắc May Mắn',
      subtitle: 'Trang bị có thể khắc tối đa 5 lần.',
      body,
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>' +
        '<button class="btn btn--gold" data-act="equip-enchant-roll" data-uid="' + uid + '">Khắc ngay</button>',
      size: 'md'
    });
  };

  ui.actions['equip-lock'] = function (el) {
    const key = el.dataset.key;
    ui.flow.enchantLocks = ui.flow.enchantLocks || [];
    const idx = ui.flow.enchantLocks.indexOf(key);
    if (idx >= 0) ui.flow.enchantLocks.splice(idx, 1);
    else ui.flow.enchantLocks.push(key);
    el.classList.toggle('is-on');
  };

  function statCompareRows(oldStats, newStats) {
    const keys = ['heat', 'cold', 'sand', 'stamina', 'bag', 'rareFind', 'accuracy', 'speed', 'dodge'];
    return '<div class="enchant-compare">' + keys.map(k => {
      const meta = PG.STAT_META[k];
      const a = oldStats[k] || 0, b = newStats[k] || 0;
      if (!a && !b) return '';
      return '<div class="enchant-compare__row' + (a !== b ? ' is-changed' : '') + '"><span>' + meta.icon + ' ' + meta.name + '</span>' +
        '<b class="' + (b > a ? 'up' : b < a ? 'down' : '') + '">' + a + ' → ' + b + '</b></div>';
    }).join('') + '</div>';
  }

  ui.actions['equip-enchant-roll'] = function (el) {
    const locks = ui.flow.enchantLocks || [];
    const res = PG.prepareEnchant(el.dataset.uid, locks);
    if (!res.ok) { ui.toast(res.msg, 'error'); return; }
    const p = res.preview;
    ui.modal({
      title: '🌀 Kết Quả Khắc',
      subtitle: 'Xem trước thay đổi trước khi xác nhận.',
      body: '<div class="enchant-preview">' +
        '<div class="enchant-luck"><span>✨ May mắn</span><b class="' + (p.newLuck >= p.oldLuck ? 'up' : 'down') + '">' + p.oldLuck + ' → ' + p.newLuck + '</b></div>' +
        statCompareRows(p.oldStats, p.newStats) +
        '<p class="muted small">Chi phí: 🪙 ' + PG.fmt(p.cost.coins) + ' + 🍀 ' + p.cost.clovers + ' Cỏ Bốn Lá.</p>' +
      '</div>',
      footer: '<button class="btn btn--ghost" data-act="equip-enchant-cancel" data-uid="' + el.dataset.uid + '">Bỏ</button>' +
        '<button class="btn btn--gold" data-act="equip-enchant-apply" data-uid="' + el.dataset.uid + '">Xác nhận khắc</button>',
      size: 'sm'
    });
  };

  ui.actions['equip-enchant-apply'] = function (el) {
    const res = PG.applyEnchant();
    if (!res.ok) { ui.toast(res.msg, 'error'); return; }
    ui.flow.enchantLocks = [];
    PG.Audio.play('shiny');
    ui.toast(res.msg, 'success');
    ui.refreshTopbar();
    ui.render();
    openItem(el.dataset.uid);
  };

  ui.actions['equip-enchant-cancel'] = function (el) {
    PG.cancelEnchant();
    ui.flow.enchantLocks = [];
    openItem(el.dataset.uid);
  };

  ui.actions['equip-filter'] = function (el) {
    ui.flow.equipFilter = el.dataset.slot;
    ui.render();
  };
})();
