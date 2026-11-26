/* ============================================================
   POKÉDEX: 21 hệ, bộ lọc, chi tiết loài, chuỗi tiến hóa
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  const DEFAULT_FILTERS = {
    q: '', type: '', status: 'all', region: '', rarity: '', mythical: 'all',
    group: '', gen: '', sort: 'dex'
  };
  const DEX_PAGE = 100;

  function dexFilters() {
    ui.flow.dexFilters = Object.assign({}, DEFAULT_FILTERS, ui.flow.dexFilters || {});
    return ui.flow.dexFilters;
  }

  /** Dùng chung cho render và tìm kiếm trực tiếp để hai chế độ lọc không lệch nhau. */
  function matches(sp, f) {
    if (PG.dexMatches) return PG.dexMatches(sp, f, PG.getState());
    // Phòng trường hợp core/dex-filters.js chưa được tải: giữ hành vi cũ.
    const st = PG.getState();
    const q = String(f.q || '').trim().toLowerCase();
    if (!sp) return false;
    if (f.type && !(sp.types || []).includes(f.type)) return false;
    if (f.status === 'caught' && !st.pokedex.caught[sp.id]) return false;
    if (f.status === 'seen' && !st.pokedex.seen[sp.id]) return false;
    if (f.status === 'missing' && st.pokedex.caught[sp.id]) return false;
    return !q || String(sp.name).toLowerCase().includes(q) || String(sp.desc || '').toLowerCase().includes(q);
  }

  /** Vùng đang lọc: dùng chung bộ nhận diện với core/dex-filters.js. */
  function regionOf(f) {
    return PG.regionKey ? PG.regionKey(f.region) : String(f.region || '');
  }

  /** Chỉ hệ của vùng được chọn mới xuất hiện trên thanh hệ và trong kết quả. */
  function allowedTypes(f) {
    const region = regionOf(f);
    const list = region && PG.typesForRegion ? PG.typesForRegion(region) : null;
    return list && list.length ? list : PG.TYPE_ORDER.slice();
  }

  /** Tập loài nền (bỏ q/type/trạng thái) để đếm tổng theo vùng mà không bị lệch khi bấm hệ. */
  function scopeIds(f) {
    const scope = Object.assign({}, f, {
      q: '', type: '', status: 'all', rarity: '', mythical: 'all', group: '', gen: ''
    });
    return dexIds().filter(id => matches(PG.SPECIES[id], scope));
  }

  function sortList(ids, f) {
    const rank = { common: 0, rare: 1, legendary: 2 };
    const out = ids.slice();
    const sort = String(f.sort || 'dex');
    if (sort === 'dex-desc') {
      out.sort((a, b) => PG.SPECIES[b].dex - PG.SPECIES[a].dex);
    } else if (sort === 'name' || sort === 'name-asc') {
      out.sort((a, b) => String(PG.SPECIES[a].name).localeCompare(String(PG.SPECIES[b].name), 'vi'));
    } else if (sort === 'rarity' || sort === 'rarity-desc') {
      out.sort((a, b) => (rank[PG.SPECIES[b].rarity] || 0) - (rank[PG.SPECIES[a].rarity] || 0) ||
        PG.SPECIES[a].dex - PG.SPECIES[b].dex);
    }
    return out;
  }

  function selectOptions(options, current, allLabel) {
    let html = allLabel === undefined || allLabel === null ? '' :
      '<option value=""' + (!current ? ' selected' : '') + '>' + esc(allLabel) + '</option>';
    for (const [value, label] of options) {
      html += '<option value="' + esc(value) + '"' + (String(current) === String(value) ? ' selected' : '') + '>' +
        esc(label) + '</option>';
    }
    return html;
  }

  function filterBarHtml(f) {
    const regions = (PG.REGION_ORDER || Object.keys(PG.REGIONS || {})).map(id => [id, (PG.REGIONS[id] || {}).name || id]);
    const rarities = [['common', 'Phổ biến'], ['rare', 'Hiếm'], ['legendary', 'Huyền thoại']];
    const mythical = [['all', 'Tất cả'], ['yes', 'Có'], ['no', 'Không']];
    const groups = ['official', 'fanmade', 'movie', 'crossover'].map(id =>
      [id, PG.dexGroupLabel ? PG.dexGroupLabel(id) : id]);
    const gens = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ['Gen ' + n, 'Gen ' + n])
      .concat([['Fan-made', 'Fan-made'], ['Điện ảnh', 'Điện ảnh'], ['Crossover', 'Crossover']]);
    const sorts = [['dex', 'Dex tăng'], ['dex-desc', 'Dex giảm'], ['name', 'Tên A-Z'], ['rarity', 'Độ hiếm']];
    const field = (label, key, options, allLabel) =>
      '<label class="dex-filter"><span class="dex-filter__label">' + esc(label) + '</span>' +
        '<select class="select dex-filter__select" data-act="dex-filter-change" data-key="' + key + '">' +
        selectOptions(options, f[key], allLabel) + '</select></label>';

    return '<div class="dex-filter-bar">' +
      field('Vùng', 'region', regions, 'Tất cả') +
      field('Hiếm', 'rarity', rarities, 'Tất cả') +
      field('Thần thoại', 'mythical', mythical) +
      field('Nhóm', 'group', groups, 'Tất cả') +
      field('Thế hệ', 'gen', gens, 'Tất cả') +
      field('Sắp xếp', 'sort', sorts) +
      '<button class="btn btn--ghost btn--sm dex-filter__reset" data-act="dex-reset-filters">🧹 Xóa bộ lọc</button>' +
      '</div>';
  }
  function dexIds() {
    return PG.DEX_ORDER.slice();
  }
  function counts(f) {
    const st = PG.getState();
    const ids = scopeIds(f || dexFilters());
    return {
      seen: ids.filter(id => st.pokedex.seen[id]).length,
      caught: ids.filter(id => st.pokedex.caught[id]).length,
      total: ids.length
    };
  }
  function ownedOf(sid) {
    return PG.getState().pokemon.filter(p => p.speciesId === sid);
  }
  function caughtOf(sid) { return !!PG.getState().pokedex.caught[sid]; }
  function seenOf(sid) { return !!PG.getState().pokedex.seen[sid]; }

  function typeStats(f) {
    const rows = [];
    const allowed = new Set(scopeIds(f));
    for (const t of allowedTypes(f)) {
      const ids = PG.speciesByType(t).filter(id => allowed.has(id));
      const caught = ids.filter(caughtOf).length;
      rows.push({ t, ids, caught });
    }
    return rows;
  }

  function speciesCard(sid) {
    const sp = PG.SPECIES[sid];
    const caught = caughtOf(sid);
    const seen = seenOf(sid);
    const count = ownedOf(sid).length;
    return '<button class="dex-card' + (caught ? ' is-caught' : seen ? ' is-seen' : '') + (sp.mythical ? ' is-mythical' : '') + (/^cross-/.test(sp.id) ? ' is-crossover' : '') +
      '" style="' + ui.cardVars(sp) + '" data-act="open-species" data-id="' + sid + '">' +
      '<span class="dex-card__top"><span class="dex-no">#' + String(sp.dex).padStart(3, '0') + '</span>' +
        '<span class="dex-card__state">' + (caught ? (count > 1 ? '×' + count : '✓') : seen ? '👁' : '·') + '</span></span>' +
      '<span class="dex-card__sprite">' + ui.spriteHtml(sp, { size: 'md', shiny: false }) + '</span>' +
      '<span class="dex-card__name">' + esc(sp.name) + '</span>' +
      '<span class="dex-card__types">' + ui.typeChips(sp.types, true) + '</span>' +
      '<span class="dex-card__rarity rarity-' + sp.rarity + '">' + (sp.mythical ? '✦ Thần thoại' : sp.rarity === 'legendary' ? '★ Huyền thoại' : sp.rarity === 'rare' ? '◆ Hiếm' : '● Phổ biến') + '</span>' +
      '</button>';
  }

  ui.views.dex = function () {
    const st = PG.getState();
    const f = dexFilters();
    const c = counts(f);
    const stats = typeStats(f);
    const types = allowedTypes(f);
    const region = regionOf(f);
    let list = sortList(dexIds().filter(id => matches(PG.SPECIES[id], f)), f);
    const limit = ui.flow.dexLimit || DEX_PAGE;
    const visible = list.slice(0, limit);
    const remaining = list.length - visible.length;

    const typeBar = stats.map(s => {
      const pct = s.ids.length ? Math.round(s.caught / s.ids.length * 100) : 0;
      return '<button class="type-progress' + (f.type === s.t ? ' is-active' : '') + '" data-act="dex-filter-type" data-type="' + s.t + '" style="--tc:' + PG.TYPES[s.t].color + '">' +
        '<span class="type-progress__chip">' + PG.TYPES[s.t].icon + '</span>' +
        '<span class="type-progress__body"><span class="type-progress__name">' + PG.TYPES[s.t].name + '</span>' +
          '<span class="type-progress__bar"><span style="width:' + pct + '%"></span></span></span>' +
        '<span class="type-progress__num">' + s.caught + '/' + s.ids.length + '</span></button>';
    }).join('');

    return '<div class="dex-page">' +
      '<div class="page-head">' +
        '<div><p class="eyebrow">Sưu tầm • ' + types.length + ' hệ' + (region ? ' • ' + esc((PG.REGIONS[region] || {}).name || region) : '') + '</p><h1>📕 Pokédex</h1>' +
          '<p class="muted">Đã bắt <b class="gold">' + c.caught + '</b> / ' + c.total + ' loài • Đã thấy ' + c.seen + ' loài.</p></div>' +
        '<div class="dex-progress-card">' +
          '<div class="dex-ring" style="--p:' + Math.round(c.caught / c.total * 100) + '%"><span>' + Math.round(c.caught / c.total * 100) + '%</span></div>' +
          '<div class="dex-progress-card__meta"><strong>' + c.caught + ' / ' + c.total + '</strong><small>Hoàn thành Pokédex</small>' +
            '<button class="btn btn--ghost btn--sm" data-act="go" data-view="box">Đi bắt thêm</button></div>' +
        '</div>' +
      '</div>' +

      (st.events.active && st.events.active.id === 'community' ? '<div class="alert alert--pink">🎉 ' + esc(st.events.active.desc) + '</div>' : '') +
      (st.events.active && st.events.active.id === 'spotlight' ? '<div class="alert alert--blue">🔦 ' + esc(st.events.active.desc) + '</div>' : '') +

      '<section class="panel dex-types">' +
        '<div class="panel__head"><h3 class="panel__title">🧪 Tiến độ theo hệ</h3>' +
          '<button class="btn btn--ghost btn--sm" data-act="dex-filter-type" data-type="">Tất cả</button></div>' +
        '<div class="type-progress-grid">' + typeBar + '</div>' +
        (region ? '<p class="muted small">🌍 Đang lọc vùng <b>' + esc((PG.REGIONS[region] || {}).name || region) + '</b>: chỉ các hệ "' +
          types.map(t => esc((PG.TYPES[t] || {}).name || t)).join(', ') + '" được hiển thị và tìm kiếm.</p>' :
          '<p class="muted small">Hệ <b>Lượng Tử</b> là hệ đặc biệt đang được cấu hình cho tương lai — chưa có loài nào thuộc hệ này (0 loài).</p>') +
      '</section>' +

      '<div class="dex-toolbar panel">' +
        '<div class="box-toolbar__search">🔍<input id="dex-search" placeholder="Tìm tên hoặc mô tả..." value="' + esc(f.q) + '" autocomplete="off"></div>' +
        '<div class="segmented">' +
          '<button class="segmented__btn' + (f.status === 'all' ? ' is-active' : '') + '" data-act="dex-status" data-status="all">Tất cả</button>' +
          '<button class="segmented__btn' + (f.status === 'caught' ? ' is-active' : '') + '" data-act="dex-status" data-status="caught">Đã bắt</button>' +
          '<button class="segmented__btn' + (f.status === 'seen' ? ' is-active' : '') + '" data-act="dex-status" data-status="seen">Đã thấy</button>' +
          '<button class="segmented__btn' + (f.status === 'missing' ? ' is-active' : '') + '" data-act="dex-status" data-status="missing">Chưa có</button>' +
        '</div>' +
        (f.type ? '<button class="btn btn--ghost btn--sm" data-act="dex-filter-type" data-type="">✕ Bỏ lọc ' + PG.TYPES[f.type].name + '</button>' : '') +
      '</div>' +

      filterBarHtml(f) +
      '<p class="dex-count">Hiện <b>' + visible.length + '</b> / ' + list.length + ' loài</p>' +

      '<div class="dex-grid" id="dex-grid">' +
        (visible.length ? visible.map(speciesCard).join('') :
          '<div class="empty-state empty-state--sm"><div class="empty-state__icon">' + (f.type === 'quantum' ? '🌌' : '🔍') + '</div><h3>' +
            (f.type === 'quantum' ? 'Hệ Lượng Tử đang chờ' : 'Không tìm thấy loài nào') + '</h3><p class="muted">' +
            (f.type === 'quantum' ? 'Quantum là hệ placeholder đã được cấu hình trong bảng hệ, bộ lọc và nhãn hệ — nhưng chưa có loài nào được thêm vào.' : 'Thử từ khóa hoặc bộ lọc khác.') + '</p></div>') +
      '</div>' +
      (remaining > 0 ? '<div class="dex-more">' +
        '<button class="btn btn--primary" data-act="dex-load-more">Xem thêm ' + Math.min(DEX_PAGE, remaining) + '</button>' +
        '<span class="muted small">Đang hiện ' + visible.length + ' / ' + list.length + ' loài</span>' +
      '</div>' : '') +
    '</div>';
  };

  ui.mounted.dex = function (host) {
    const root = host || document;
    const input = root.querySelector('#dex-search') || document.getElementById('dex-search');
    if (input) {
      let searchTimer = null;
      input.addEventListener('input', function () {
        const value = this.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          if (ui.current !== 'dex') return;
          const f = dexFilters();
          f.q = value.trim().toLowerCase();
          ui.flow.dexLimit = DEX_PAGE;
          ui.render();
          const next = document.getElementById('dex-search');
          if (next) {
            next.focus();
            next.setSelectionRange(next.value.length, next.value.length);
          }
        }, 120);
      });
    }

    // select dùng data-act (không phải data-change): tự bắt change và chặn click
    // để bộ lọc không đổi khi mới mở danh sách chọn.
    for (const sel of root.querySelectorAll('select[data-act="dex-filter-change"]')) {
      sel.addEventListener('click', e => e.stopPropagation());
      sel.addEventListener('change', function () {
        const fn = ui.actions['dex-filter-change'];
        if (fn) fn(this);
      });
    }
  };

  ui.actions['dex-filter-change'] = function (el) {
    const key = el.dataset.key;
    if (!key || key === 'q' || !(key in DEFAULT_FILTERS)) return;
    const f = dexFilters();
    f[key] = String(el.value === undefined || el.value === null ? '' : el.value);
    // Đổi vùng thì bỏ lọc hệ cũ: hệ đó có thể không còn thuộc vùng mới.
    if (key === 'region' && f.type && allowedTypes(f).indexOf(f.type) < 0) f.type = '';
    ui.flow.dexLimit = DEX_PAGE;
    ui.render();
  };

  ui.actions['dex-reset-filters'] = function () {
    ui.flow.dexFilters = Object.assign({}, DEFAULT_FILTERS);
    ui.flow.dexLimit = DEX_PAGE;
    ui.render();
  };

  ui.actions['dex-filter-type'] = function (el) {
    const f = dexFilters();
    f.type = el.dataset.type || '';
    ui.flow.dexLimit = DEX_PAGE;
    ui.render();
  };
  ui.actions['dex-status'] = function (el) {
    dexFilters().status = el.dataset.status;
    ui.flow.dexLimit = DEX_PAGE;
    ui.render();
  };

  ui.actions['dex-load-more'] = function () {
    ui.flow.dexLimit = (ui.flow.dexLimit || DEX_PAGE) + DEX_PAGE;
    ui.render();
  };

  /* ---------------- SPECIES DETAIL ---------------- */
  function familyOf(sp) {
    return PG.DEX_ORDER.filter(id => PG.SPECIES[id].family === sp.family)
      .sort((a, b) => PG.SPECIES[a].stage - PG.SPECIES[b].stage || PG.SPECIES[a].dex - PG.SPECIES[b].dex);
  }

  function familyHtml(sp) {
    const fam = familyOf(sp);
    const byStage = {};
    for (const id of fam) {
      const s = PG.SPECIES[id];
      (byStage[s.stage] || (byStage[s.stage] = [])).push(s);
    }
    const stages = Object.keys(byStage).map(Number).sort((a, b) => a - b);
    let out = '<div class="family-chain">';
    stages.forEach((stage, index) => {
      out += '<div class="family-stage">' + byStage[stage].map(s => {
        const owned = ownedOf(s.id).length;
        return '<button class="family-node' + (caughtOf(s.id) ? ' is-caught' : '') + (s.id === sp.id ? ' is-current' : '') + '" data-act="open-species" data-id="' + s.id + '">' +
          ui.spriteHtml(s, { size: 'sm' }) +
          '<span><strong>' + esc(s.name) + '</strong><small>' + (owned ? '×' + owned : caughtOf(s.id) ? 'Đã bắt' : 'Chưa bắt') + '</small></span></button>';
      }).join('') + '</div>';
      if (index < stages.length - 1) out += '<span class="family-arrow">→</span>';
    });
    return out + '</div>';
  }

  /** Chỉ số nền của loài: hiển thị bình thường, không cộng level/IV/đồ. */
  function baseStats(sp) {
    const names = ['HP', 'Tấn công', 'Phòng thủ', 'TC đặc biệt', 'PT đặc biệt', 'Tốc độ'];
    return sp.base.map((v, i) => '<div class="base-stat"><span>' + names[i] + '</span><b>' + v + '</b></div>').join('');
  }
  ui.speciesStatsHtml = baseStats;

  /**
   * Dòng tóm tắt chỉ số cá thể đang có: dùng chung con số với màn Kho,
   * phần cộng thêm/đồ cầm tay gộp thành một +N duy nhất, không xếp dấu "+".
   */
  function currentStatsLine(p) {
    if (!p) return '';
    const stats = PG.battleStats(p);
    const delta = PG.heldStatDelta(p);
    return PG.STAT_KEYS.map(k => {
      const extra = ((p.bonusStats && p.bonusStats[k]) || 0) + (delta[k] || 0);
      return PG.STAT_NAMES[k] + ' <b>' + stats[k] + '</b>' + (extra ? '<em>+' + extra + '</em>' : '');
    }).join(' • ');
  }
  ui.currentStatsLine = currentStatsLine;

  function movesFor(sp) {
    // Learnset đầy đủ: chiêu riêng / tuyệt kỹ / combo / chiêu mới khi tiến hóa, rồi chiêu hệ.
    const seen = new Set();
    const list = [];
    const learned = PG.movesForSpecies
      ? PG.movesForSpecies(sp.id, 50)
      : PG.movesForTypes(sp.types, 50);
    for (const m of learned) {
      if (!m || !m.id || seen.has(m.id) || !PG.MOVES[m.id]) continue;
      seen.add(m.id);
      list.push(m);
      if (list.length >= 10) break;
    }
    return list.map(m => {
      const mv = PG.getMove(m.id);
      if (!mv) return '';
      const t = PG.TYPES[mv.type];
      const flair = PG.Formulas && PG.Formulas.moveFlair ? PG.Formulas.moveFlair(mv) : null;
      const t2 = flair && flair.kind === 'combo' && flair.types[1] ? PG.TYPES[flair.types[1]] : null;
      const styleId = PG.skillStyleOf ? PG.skillStyleOf(mv, sp && sp.id) : null;
      const flairIcon = { ultimate: '🌟', evolution: '⬆️', world: '🌌', signature: '✦' };
      const tag = flair ? (flair.kind === 'combo'
        ? (flair.types || []).map(x => (PG.TYPES[x] || {}).icon || '').join('') + ' ' + esc(flair.badge)
        : (flairIcon[flair.kind] || '✦') + ' ' + esc(flair.badge)) : '';
      return '<span class="move-pill' + (flair ? ' move-pill--' + flair.kind : '') + '"' +
        (flair && flair.world ? ' data-world="' + flair.world + '"' : '') +
        (styleId ? ' data-skill-style="' + styleId + '"' : '') +
        ' style="--mt:' + t.color + (t2 ? ';--mt2:' + t2.color : '') + '">' +
        t.icon + ' ' + esc(mv.name) + (mv.power ? ' <b>' + mv.power + '</b>' : '') +
        (tag ? '<i class="move-pill__tag">' + tag + '</i>' : '') + '</span>';
    }).join('');
  }

  ui.actions['open-species'] = function (el) {
    const sp = PG.SPECIES[el.dataset.id];
    if (!sp) return;
    const st = PG.getState();
    const owned = ownedOf(sp.id);
    const best = owned.slice().sort((a, b) => PG.cpOf(b) - PG.cpOf(a))[0];
    const ab1 = PG.ABILITIES[sp.abilities[0]];
    const ab2 = PG.ABILITIES[sp.abilities[1]];
    const hidden = PG.ABILITIES[sp.hiddenAbility];
    const isQuantum = sp.types.includes('quantum');
    ui.modal({
      title: ui.spriteHtml(sp, { size: 'xs' }) + ' ' + esc(sp.name),
      subtitle: 'Pokédex #' + String(sp.dex).padStart(3, '0') + ' • ' + (sp.mythical ? 'Thần thoại' : sp.rarity === 'legendary' ? 'Huyền thoại' : sp.rarity) + (caughtOf(sp.id) ? ' • Đã bắt' : ' • Chưa bắt'),
      body: '<div class="species-detail">' +
        '<div class="species-hero">' +
          '<div class="species-hero__sprite">' + ui.spriteHtml(sp, { size: 'xl' }) + '</div>' +
          '<div class="species-hero__info">' +
            '<div class="species-hero__name">' + esc(sp.name) + '</div>' +
            '<div>' + ui.typeChips(sp.types) + '</div>' +
            '<p class="species-desc">' + esc(sp.desc) + '</p>' +
            '<div class="species-meta">' +
              '<span class="pill">' + (sp.heightBase || '?') + ' m</span>' +
              '<span class="pill">' + (sp.weightBase || '?') + ' kg</span>' +
              '<span class="pill">Tỉ lệ bắt ' + Math.round((sp.catchRate || 0) * 100) + '%</span>' +
              '<span class="pill">Bỏ chạy ' + Math.round((sp.fleeRate || 0) * 100) + '%</span>' +
            '</div>' +
            (isQuantum ? '<div class="alert alert--purple">🌌 Hệ Lượng Tử là placeholder đã được cấu hình: tấn công và phòng thủ đều x1, nhận x2 từ hệ Thiên. Chưa có loài nào thuộc hệ này.</div>' : '') +
             (sp.types.indexOf('glitch') >= 0 ? '<div class="alert alert--purple">👾 Hệ Lỗi là hệ đơn: đánh và bị đánh đều x1. Sau mỗi lượt tấn công, Pokémon đổi sang một hệ khác và dùng chiêu, đặc tính cùng thiên hướng chỉ số của hệ mới cho đến hết trận.</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="species-columns">' +
          '<section><h4>📊 Chỉ số cơ bản</h4>' + baseStats(sp) +
            '<p class="muted small">Tổng: <b>' + PG.sum(sp.base) + '</b> • Nguồn: ' + (sp.habitats.map(h => PG.REGIONS[h] ? PG.REGIONS[h].name : h).join(', ') || '—') + '</p>' +
            (best
              ? '<p class="muted small"><b>Chỉ số cá thể đang có</b> (Lv.' + best.level + '): ' + currentStatsLine(best) +
                '<br>Cùng cách tính với Kho Pokémon • IV tổng <b>' + PG.ivTotal(best) + '/186</b> (' + PG.ivPercent(best) + '%) • CP <b>' + PG.fmt(PG.cpOf(best)) + '</b></p>'
              : '') +
          '</section>' +
          '<section><h4>🧬 Đặc tính</h4>' +
            '<div class="ability-row"><strong>' + ab1.name + '</strong><small>' + ab1.desc + '</small></div>' +
            '<div class="ability-row"><strong>' + ab2.name + '</strong><small>' + ab2.desc + '</small></div>' +
            '<div class="ability-row is-hidden"><strong>' + hidden.name + ' (Ẩn)</strong><small>' + hidden.desc + '</small></div>' +
            '<div class="species-breed"><span>Nhóm trứng: ' + esc(sp.family) + '</span>' +
              (best ? '<span>CP tốt nhất của bạn: <b>' + PG.fmt(PG.cpOf(best)) + '</b> (Lv.' + best.level + ')</span>' : '') + '</div>' +
          '</section>' +
        '</div>' +
        '<section class="species-section"><h4>🧬 Chuỗi tiến hóa</h4>' + familyHtml(sp) + '</section>' +
        '<section class="species-section"><h4>⚔️ Chiêu thức tiêu biểu</h4><div class="move-pills">' + (movesFor(sp) || '<span class="muted">—</span>') + '</div></section>' +
        (owned.length ? '<section class="species-section"><h4>📦 Bạn đang sở hữu</h4><div class="owned-strip">' +
          owned.slice(0, 8).map(p => '<button class="owned-mon" data-act="open-pokemon" data-uid="' + p.uid + '">' + ui.spriteHtml(p, { size: 'sm' }) + '<small>Lv.' + p.level + '</small></button>').join('') +
          (owned.length > 8 ? '<span class="muted small">+' + (owned.length - 8) + '</span>' : '') + '</div></section>' : '') +
      '</div>',
      size: 'lg',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Đóng</button>' +
        (caughtOf(sp.id) ? '<button class="btn btn--primary" data-act="go" data-view="box">Mở Kho</button>' : '')
    });
  };
})();
