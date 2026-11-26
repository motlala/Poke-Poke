/* ============================================================
   CHẾ TẠO: công thức, nâng cấp cần câu
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  function st() { return PG.getState(); }
  function tab() { return ui.flow.craftTab || 'all'; }

  const CATS = [
    { id: 'all', label: 'Tất cả', icon: '🛠️' },
    { id: 'ball', label: 'Bóng', icon: '⚪' },
    { id: 'berry', label: 'Quả', icon: '🍓' },
    { id: 'medicine', label: 'Thuốc', icon: '🧪' },
    { id: 'stone', label: 'Đá tiến hóa', icon: '💎' },
    { id: 'equipment', label: 'Trang bị', icon: '🧥' },
    { id: 'special', label: 'Đặc biệt', icon: '🌟' }
  ];

  function matsHtml(recipe) {
    return Object.entries(recipe.mats).map(([id, n]) => {
      const info = PG.itemInfo(id);
      const have = PG.countOwned(id);
      const ok = have >= n;
      return '<span class="craft-mat' + (ok ? ' is-ok' : ' is-missing') + '" title="' + esc(info.name) + '">' +
        '<span class="craft-mat__icon">' + info.icon + '</span>' +
        '<span class="craft-mat__count">' + have + '/' + n + '</span></span>';
    }).join('');
  }

  function recipeCard(recipe) {
    const state = st();
    const check = PG.canCraft(recipe);
    const locked = state.player.level < recipe.unlock;
    const outInfo = recipe.out.equipment ? PG.EQUIPMENT_BASES[recipe.out.equipment] : PG.itemInfo(Object.keys(recipe.out)[0]);
    const outName = recipe.out.equipment ? (PG.EQUIPMENT_BASES[recipe.out.equipment] || {}).name : outInfo.name;
    const outIcon = recipe.out.equipment ? (PG.EQUIPMENT_BASES[recipe.out.equipment] || {}).icon : outInfo.icon;
    const outQty = recipe.out.equipment ? 1 : Object.values(recipe.out)[0];
    return '<div class="craft-card' + (locked ? ' is-locked' : '') + (check.ok ? ' is-ready' : '') + '">' +
      '<div class="craft-card__head">' +
        '<span class="craft-card__icon">' + (outIcon || recipe.icon) + '</span>' +
        '<div><strong>' + esc(recipe.name) + (outQty > 1 ? ' ×' + outQty : '') + '</strong>' +
          '<small>' + esc(recipe.desc) + '</small></div>' +
      '</div>' +
      '<div class="craft-card__mats">' + matsHtml(recipe) +
        '<span class="craft-coin' + (state.player.coins >= recipe.coins ? ' is-ok' : ' is-missing') + '">🪙 ' + PG.fmt(recipe.coins) + '</span>' +
      '</div>' +
      (locked ? '<div class="craft-card__lock">🔒 Mở khóa ở cấp ' + recipe.unlock + '</div>' :
        '<button class="btn ' + (check.ok ? 'btn--primary' : 'btn--ghost') + ' btn--sm btn--block" data-act="craft-do" data-id="' + recipe.id + '"' + (check.ok ? '' : ' disabled') + '>' +
          (check.ok ? '🛠️ Chế tạo' : (check.msg || 'Thiếu nguyên liệu')) + '</button>') +
    '</div>';
  }

  function rodPanel() {
    const state = st();
    const rod = PG.RODS[state.fishing.rod] || PG.RODS.bamboo;
    const lv = state.fishing.rodLevel || 0;
    const cost = PG.rodUpgradeCost(lv);
    const canUp = lv < 10;
    const owned = Object.keys(PG.RODS).filter(id => id === state.fishing.rod);
    const otherRods = Object.keys(PG.RODS).filter(id => id !== state.fishing.rod);
    return '<section class="panel rod-panel">' +
      '<div class="panel__head"><h3 class="panel__title">🎣 Cần Câu</h3><span class="badge">+' + lv + ' / 10</span></div>' +
      '<div class="rod-hero">' +
        '<span class="rod-hero__icon" style="color:' + rod.color + '">' + rod.icon + '</span>' +
        '<div class="rod-hero__body"><strong>' + rod.name + ' +' + lv + '</strong>' +
          '<small>' + esc(rod.desc) + '</small>' +
          '<span class="rod-power">Lực kéo ' + Math.round(rod.power * 100) + '% • Độ sâu ' + rod.deep + '/3</span></div>' +
      '</div>' +
      (canUp ? '<div class="upgrade-line"><div><strong>Nâng cấp cần câu</strong><small>🪙 ' + PG.fmt(cost.coins) + ' + ' +
        Object.entries(cost.mats).map(([id, n]) => PG.itemInfo(id).icon + ' ' + n + ' (có ' + PG.countOwned(id) + ')').join(' • ') + '</small></div>' +
        '<button class="btn btn--primary btn--sm" data-act="rod-upgrade">Nâng cấp</button></div>' : '<p class="muted small">Cần câu đã đạt cấp tối đa.</p>') +
      (otherRods.length ? '<div class="rod-shop"><h4 class="mini-title">Mua cần tốt hơn</h4>' +
        otherRods.map(id => {
          const r = PG.RODS[id];
          if (r.deep <= rod.deep) return '';
          return '<div class="rod-row"><span style="color:' + r.color + '">' + r.icon + '</span>' +
            '<div class="rod-row__body"><strong>' + r.name + '</strong><small>' + esc(r.desc) + '</small></div>' +
            '<button class="btn btn--ghost btn--sm" data-act="rod-buy" data-id="' + id + '">🪙 ' + PG.fmt(r.price) + '</button></div>';
        }).join('') + '</div>' : '') +
      '<p class="muted small">Nâng cấp cần câu giúp vùng kéo rộng hơn, cá hiếm xuất hiện nhiều hơn và mở khóa vùng nước sâu.</p>' +
    '</section>';
  }

  ui.views.craft = function () {
    const state = st();
    const list = PG.RECIPE_LIST.filter(r => tab() === 'all' || r.category === tab());
    const ready = PG.RECIPE_LIST.filter(r => PG.canCraft(r).ok).length;
    return '<div class="craft-page">' +
      '<div class="page-head">' +
        '<div><p class="eyebrow">Xưởng • Nguyên liệu</p><h1>🛠️ Xưởng Chế Tạo</h1>' +
          '<p class="muted">Biến nguyên liệu thành bóng, thuốc, đá tiến hóa và trang bị quý.</p></div>' +
        '<div class="page-wallet"><span class="pill pill--gold">🪙 ' + PG.fmt(state.player.coins) + '</span>' +
          '<span class="pill">✅ ' + ready + ' công thức sẵn sàng</span></div>' +
      '</div>' +
      '<div class="craft-layout">' +
        '<div class="craft-main">' +
          '<div class="chip-row">' + CATS.map(c =>
            '<button class="filter-chip' + (tab() === c.id ? ' is-active' : '') + '" data-act="craft-tab" data-tab="' + c.id + '">' + c.icon + ' ' + c.label + '</button>').join('') +
          '</div>' +
          '<div class="craft-grid">' + (list.length ? list.map(recipeCard).join('') :
            '<div class="empty-state empty-state--sm"><div class="empty-state__icon">🛠️</div><h3>Chưa có công thức</h3><p class="muted">Danh mục này chưa có công thức nào.</p></div>') + '</div>' +
        '</div>' +
        '<aside class="craft-side">' + rodPanel() +
          '<section class="panel"><h3 class="panel__title">🪨 Nguyên Liệu</h3>' +
            '<div class="mat-list">' + Object.keys(PG.MATERIALS).filter(id => (state.materials[id] || 0) > 0).map(id => {
              const m = PG.MATERIALS[id];
              return '<div class="mat-row"><span>' + m.icon + '</span><strong>' + m.name + '</strong><b>×' + state.materials[id] + '</b></div>';
            }).join('') + '</div>' +
            '<p class="muted small">Nguyên liệu rơi khi đi dạo, chiến đấu, câu cá và làm nhiệm vụ.</p>' +
          '</section>' +
        '</aside>' +
      '</div>' +
    '</div>';
  };

  ui.actions['craft-tab'] = function (el) {
    ui.flow.craftTab = el.dataset.tab;
    ui.render();
  };

  ui.actions['craft-do'] = function (el) {
    const recipe = PG.RECIPES[el.dataset.id];
    if (!recipe) return;
    const res = PG.craftRecipe(recipe.id);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) {
      PG.Audio.play('craft');
      PG.questProgress('craft', 1);
      PG.saveState(true);
      ui.refreshTopbar();
      ui.render();
    } else PG.Audio.play('error');
  };

  ui.actions['rod-upgrade'] = function () {
    const res = PG.upgradeRod();
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('levelup'); ui.refreshTopbar(); ui.render(); }
  };

  ui.actions['rod-buy'] = function (el) {
    const rod = PG.RODS[el.dataset.id];
    ui.confirm('Mua ' + rod.name + '?', 'Bạn sẽ chi ' + PG.fmt(rod.price) + ' Xu. Cần câu cũ sẽ được thay thế (cấp nâng cấp đặt lại về 0).', function () {
      const res = PG.buyRod(el.dataset.id);
      ui.toast(res.msg, res.ok ? 'success' : 'error');
      if (res.ok) { PG.Audio.play('buy'); ui.closeModal(); ui.refreshTopbar(); ui.render(); }
    }, { okText: 'Mua' });
  };
})();
