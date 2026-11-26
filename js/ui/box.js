/* ============================================================
   KHO POKÉMON: đội hình, chi tiết, nâng cấp, tiến hóa, chợ
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  function filters() {
    if (!ui.flow.boxFilters) ui.flow.boxFilters = { q: '', type: '', rarity: '', mut: '', sort: 'cp' };
    return ui.flow.boxFilters;
  }
  function state() { return PG.getState(); }
  function findP(uid) { return state().pokemon.find(p => p.uid === uid); }

  function sortList(list, sort) {
    const arr = list.slice();
    if (sort === 'cp') arr.sort((a, b) => PG.cpOf(b) - PG.cpOf(a));
    else if (sort === 'level') arr.sort((a, b) => b.level - a.level);
    else if (sort === 'quality') arr.sort((a, b) => PG.ivTotal(b) - PG.ivTotal(a));
    else if (sort === 'recent') arr.sort((a, b) => (b.caughtAt || 0) - (a.caughtAt || 0));
    else if (sort === 'dex') arr.sort((a, b) => PG.SPECIES[a.speciesId].dex - PG.SPECIES[b.speciesId].dex);
    return arr;
  }

  function match(p, f) {
    const sp = PG.SPECIES[p.speciesId];
    if (!sp) return false;
    if (f.q && !(sp.name.toLowerCase().includes(f.q) || (p.nickname || '').toLowerCase().includes(f.q))) return false;
    if (f.type && !sp.types.includes(f.type)) return false;
    if (f.rarity && sp.rarity !== f.rarity) return false;
    if (f.mut === 'shiny' && !p.shiny) return false;
    if (f.mut === 'mutated' && !(p.mutations || []).some(m => m !== 'shiny')) return false;
    return true;
  }

  function teamStrip() {
    const st = state();
    let out = '<div class="team-strip team-strip--box">';
    for (let i = 0; i < 6; i++) {
      const uid = st.team[i];
      const p = uid ? st.pokemon.find(x => x.uid === uid) : null;
      if (p) {
        const sp = PG.SPECIES[p.speciesId];
        const aura = ui.auraClassOf ? ui.auraClassOf(p) : '';
        out += '<button class="team-slot' + (aura ? ' ' + aura : '') + '" data-act="open-pokemon" data-uid="' + p.uid + '" title="' + esc(sp.name) + '">' +
          '<span class="team-slot__sprite">' + ui.spriteHtml(p, { size: 'sm' }) + '</span>' +
          '<span class="team-slot__lv">' + p.level + '</span>' +
          '<span class="team-slot__hp">' + ui.bar(p.hp, PG.getStats(p).hp, 'bar--hp') + '</span>' +
          '<span class="team-slot__remove" data-act="team-remove" data-uid="' + p.uid + '" title="Rời đội">✕</span>' +
          '</button>';
      } else {
        out += '<button class="team-slot team-slot--empty" data-act="go" data-view="box" title="Thêm Pokémon">＋</button>';
      }
    }
    out += '</div>';
    return out;
  }

  function eggsPanel() {
    const st = state();
    if (!st.eggs.length) return '';
    return '<section class="panel eggs-panel">' +
      '<div class="panel__head"><h3 class="panel__title">🥚 Trứng</h3><span class="badge">' + st.eggs.length + '</span></div>' +
      '<div class="egg-grid">' + st.eggs.map(egg => {
        const pct = Math.min(100, (egg.walked / egg.km) * 100);
        const def = (PG.EGG_TYPES || {})[egg.type] || PG.EGG_TYPES.random || {};
        const label = def.type ? (PG.TYPES[def.type] || {}).name || def.type : 'Random';
        return '<div class="egg-tile' + (egg.ready ? ' is-ready' : '') + '" style="--ec:' + esc(def.color || '#fbbf24') + '">' +
          '<span class="egg-tile__icon">' + (egg.ready ? '🐣' : esc(def.icon || '🥚')) + '</span>' +
          '<strong>' + egg.km + ' km • ' + esc(label) + '</strong>' +
          '<small>' + (egg.ready ? 'Sẵn sàng nở!' : egg.incubating ? 'Đang ấp ' + egg.walked.toFixed(1) + '/' + egg.km : 'Chưa ấp') + '</small>' +
          '<div class="quest-mini__bar"><span style="width:' + pct + '%"></span></div>' +
          (egg.ready ? '<button class="btn btn--gold btn--sm" data-act="hatch-egg" data-uid="' + egg.uid + '">Nở</button>' :
            !egg.incubating ? '<button class="btn btn--ghost btn--sm" data-act="start-egg" data-uid="' + egg.uid + '">Ấp</button>' : '') +
          '</div>';
      }).join('') + '</div></section>';
  }

  ui.views.box = function () {
    const st = state();
    const f = filters();
    const all = st.pokemon;
    const list = sortList(all.filter(p => match(p, f)), f.sort);
    const typeOptions = PG.TYPE_ORDER.map(t => '<option value="' + t + '"' + (f.type === t ? ' selected' : '') + '>' + PG.TYPES[t].icon + ' ' + PG.TYPES[t].name + '</option>').join('');
    const mutCount = all.filter(p => (p.mutations || []).some(m => m !== 'shiny')).length;
    return '<div class="box-page">' +
      '<div class="page-head">' +
        '<div><p class="eyebrow">Pokémon của bạn</p><h1>🎒 Kho Pokémon</h1>' +
          '<p class="muted">Quản lý đội hình, nâng cấp, tiến hóa và sưu tầm.</p></div>' +
        '<div class="box-stats">' +
          '<span class="pill">📦 ' + all.length + ' Pokémon</span>' +
          '<span class="pill pill--gold">✨ ' + all.filter(p => p.shiny).length + ' Shiny</span>' +
          '<span class="pill">🧬 ' + mutCount + ' Đột biến</span>' +
        '</div>' +
      '</div>' +

      '<section class="panel box-team-panel">' +
        '<div class="panel__head"><h3 class="panel__title">⚔️ Đội Hình</h3>' +
          '<span class="muted small">Tối đa 6 • Chạm để xem chi tiết</span>' +
          '<button class="btn btn--ghost btn--sm" data-act="heal-team">🏥 Hồi phục</button></div>' +
        teamStrip() +
      '</section>' +

      '<div class="box-toolbar panel">' +
        '<div class="box-toolbar__search">🔍<input id="box-search" placeholder="Tìm tên Pokémon..." value="' + esc(f.q) + '" autocomplete="off"></div>' +
        '<select class="select" data-change="box-filter-type"><option value="">Tất cả hệ</option>' + typeOptions + '</select>' +
        '<select class="select" data-change="box-filter-rarity">' +
          '<option value="">Mọi độ hiếm</option>' +
          '<option value="common"' + (f.rarity === 'common' ? ' selected' : '') + '>Phổ biến</option>' +
          '<option value="rare"' + (f.rarity === 'rare' ? ' selected' : '') + '>Hiếm</option>' +
          '<option value="legendary"' + (f.rarity === 'legendary' ? ' selected' : '') + '>Huyền thoại</option>' +
        '</select>' +
        '<select class="select" data-change="box-filter-mut">' +
          '<option value="">Mọi dạng</option>' +
          '<option value="shiny"' + (f.mut === 'shiny' ? ' selected' : '') + '>✨ Shiny</option>' +
          '<option value="mutated"' + (f.mut === 'mutated' ? ' selected' : '') + '>🧬 Đột biến</option>' +
        '</select>' +
        '<select class="select" data-change="box-sort">' +
          '<option value="cp"' + (f.sort === 'cp' ? ' selected' : '') + '>CP cao → thấp</option>' +
          '<option value="level"' + (f.sort === 'level' ? ' selected' : '') + '>Cấp cao → thấp</option>' +
          '<option value="quality"' + (f.sort === 'quality' ? ' selected' : '') + '>IV cao → thấp</option>' +
          '<option value="recent"' + (f.sort === 'recent' ? ' selected' : '') + '>Mới bắt</option>' +
          '<option value="dex"' + (f.sort === 'dex' ? ' selected' : '') + '>Số Pokédex</option>' +
        '</select>' +
      '</div>' +

      '<div class="box-grid" id="box-grid">' +
        (list.length ? list.map(p => '<div class="box-cell" data-uid="' + p.uid + '">' + ui.pokeCard(p) + '</div>').join('') :
          '<div class="empty-state empty-state--sm"><div class="empty-state__icon">📦</div><h3>Không tìm thấy Pokémon</h3><p class="muted">Thử đổi bộ lọc hoặc đi dạo để bắt thêm.</p></div>') +
      '</div>' +

      eggsPanel() +
    '</div>';
  };

  ui.mounted.box = function () {
    const input = document.getElementById('box-search');
    if (!input) return;
    input.addEventListener('input', function () {
      const f = filters();
      f.q = this.value.trim().toLowerCase();
      const st = state();
      for (const cell of ui.$all('.box-cell')) {
        const p = st.pokemon.find(x => x.uid === cell.dataset.uid);
        cell.style.display = p && match(p, f) ? '' : 'none';
      }
      const grid = document.getElementById('box-grid');
      if (grid) {
        const visible = ui.$all('.box-cell', grid).filter(c => c.style.display !== 'none').length;
        if (!visible && !document.getElementById('box-empty-dom')) {
          const empty = document.createElement('div');
          empty.id = 'box-empty-dom';
          empty.className = 'empty-state empty-state--sm';
          empty.innerHTML = '<div class="empty-state__icon">🔍</div><h3>Không tìm thấy</h3><p class="muted">Thử từ khóa khác.</p>';
          grid.appendChild(empty);
        } else if (visible) {
          const empty = document.getElementById('box-empty-dom');
          if (empty) empty.remove();
        }
      }
    });
  };

  /* ---------------- FILTER ACTIONS ---------------- */
  ui.changes['box-filter-type'] = function (el) { filters().type = el.value; ui.render(); };
  ui.changes['box-filter-rarity'] = function (el) { filters().rarity = el.value; ui.render(); };
  ui.changes['box-filter-mut'] = function (el) { filters().mut = el.value; ui.render(); };
  ui.changes['box-sort'] = function (el) { filters().sort = el.value; ui.render(); };

  /* ---------------- DETAIL ---------------- */
  /**
   * Chỉ số hiển thị: một con số duy nhất cho mỗi chỉ số, gồm cả điểm cộng
   * thêm và đồ cầm tay. Phần cộng gộp thành MỘT badge +N thay vì xếp nhiều
   * dấu "+" (dễ gây cảm giác cộng mãi không dừng).
   */
  function statRows(p) {
    const stats = PG.battleStats(p);
    const delta = PG.heldStatDelta(p);
    return PG.STAT_KEYS.map((k, i) => {
      const iv = p.ivs[k] || 0;
      const bonus = (p.bonusStats && p.bonusStats[k]) || 0;
      const heldDelta = delta[k] || 0;
      // Tổng phần cộng ngoài chỉ số nền của loài (IV/tính cách/level vẫn nằm
      // trong con số chính; chỉ gộp "điểm cộng thêm" + "đồ cầm tay").
      const extra = bonus + heldDelta;
      return '<div class="stat-row' + (heldDelta ? ' stat-row--held' : '') + '">' +
        '<span class="stat-row__name">' + PG.STAT_NAMES[k] +
          (extra ? ' <em class="stat-bonus" title="Gồm điểm cộng thêm và đồ cầm tay">+' + extra + '</em>' : '') +
          '</span>' +
        '<span class="stat-row__val">' + stats[k] + '</span>' +
        '<span class="stat-row__iv">IV ' + iv + '</span></div>';
    }).join('');
  }
  //Pokédex dùng chung cách tính này; giữ tên hàm local để màn Kho gọi được.
  ui.statRows = statRows;

  function moveRows(p) {
    if (!p.moves.length) return '<p class="muted small">Chưa có chiêu thức.</p>';
    return '<div class="move-list">' + p.moves.map(m => {
      const mv = PG.getMove(m.id);
      if (!mv) return '';
      const t = PG.TYPES[mv.type];
      return '<div class="move-row" style="--mt:' + t.color + '">' +
        '<span class="move-row__type">' + t.icon + '</span>' +
        '<span class="move-row__name">' + esc(mv.name) + '</span>' +
        '<span class="move-row__meta">' + t.name + ' • ' + (mv.power ? mv.power + ' PWR' : 'Hỗ trợ') + ' • ' + (p.pp[m.id] !== undefined ? p.pp[m.id] : PG.maxPp(m.id, 1)) + ' PP</span>' +
        '</div>';
    }).join('') + '</div>';
  }

  function evoRows(p) {
    const opts = PG.evolutionOptions(p);
    if (!opts.length) return '<p class="muted small">Loài này không có dạng tiến hóa.</p>';
    const st = state();
    const candy = st.candies[PG.SPECIES[p.speciesId].family] || 0;
    return '<div class="evo-list">' + opts.map(o => {
      const check = PG.canEvolve(st, p, o);
      return '<div class="evo-row">' +
        ui.spriteHtml(o.species, { size: 'sm' }) +
        '<span class="evo-row__body"><strong>' + esc(o.species.name) + '</strong>' +
          '<small>' + PG.evoRequirementText(o) + '</small>' +
          '<small class="' + (check.ok ? 'good' : 'muted') + '">' + (check.ok ? 'Đủ điều kiện!' : esc(check.msg || '')) + '</small></span>' +
        '<button class="btn ' + (check.ok ? 'btn--primary' : 'btn--ghost') + ' btn--sm" data-act="evolve" data-uid="' + p.uid + '" data-to="' + o.to + '" data-candy="' + o.candy + '" data-level="' + (o.level || '') + '" data-condition="' + (o.condition || '') + '"' + (check.ok ? '' : ' disabled') + '>Tiến hóa</button>' +
        '</div>';
    }).join('') + '</div>' +
      '<p class="muted small">Kẹo hiện có: 🍬 ' + candy + ' — dùng chung theo họ ' + esc(PG.SPECIES[PG.SPECIES[p.speciesId].family].name) + '.</p>';
  }

  function detailBody(p) {
    const sp = PG.SPECIES[p.speciesId];
    const q = PG.qualityOf(p);
    const st = state();
    const candy = st.candies[sp.family] || 0;
    const cost = PG.powerUpCost(p);
    const canPower = PG.canPowerUp(st, p);
    const inTeam = st.team.includes(p.uid);
    const isBuddy = st.buddy === p.uid;
    const ability = PG.ABILITIES[p.ability] || { name: p.ability, desc: '' };
    const nature = PG.NATURES[p.nature] || PG.NATURES.hardy;
    const held = p.heldItem ? PG.itemInfo(p.heldItem) : null;
    const heldBase = p.heldItem ? PG.HELD_ITEMS[p.heldItem] : null;
    const heldActive = !!PG.heldEffects(p);
    const heldMax = heldBase && heldBase.durability ? heldBase.durability : 0;
    const heldCur = heldMax ? (typeof p.heldDur === 'number' ? p.heldDur : heldMax) : 0;
    const repairCost = held ? PG.heldRepairCost(p.uid) : 0;
    const genderIcon = p.gender === 'male' ? '♂' : p.gender === 'female' ? '♀' : '⚲';
    return '<div class="detail">' +
      '<div class="detail__hero' + (p.shiny ? ' is-shiny' : '') + '">' +
        '<div class="detail__sprite">' + ui.spriteHtml(p, { size: 'xl', badges: p.shiny ? '✨' : '' }) + '</div>' +
        '<div class="detail__head">' +
          '<div class="detail__title"><h2>' + esc(p.nickname || sp.name) + '</h2>' +
            (p.nickname ? '<small class="muted">(' + esc(sp.name) + ')</small>' : '') +
            '<span class="dex-no">#' + String(sp.dex).padStart(3, '0') + '</span></div>' +
          '<div class="detail__types">' + ui.typeChips(sp.types) + '<span class="pill pill--sm">' + (p.gender === 'none' ? '⚲' : genderIcon) + '</span></div>' +
          '<div class="detail__tags">' +
            '<span class="pill">Lv.' + p.level + '</span>' +
            '<span class="pill pill--gold">CP ' + PG.fmt(PG.cpOf(p)) + '</span>' +
            '<span class="pill" style="color:' + q.color + '">' + q.name + ' ' + ui.stars(q.stars) + '</span>' +
            '<span class="pill">' + (PG.SIZE_TABLE[p.size] || {}).name + '</span>' +
            (p.favorite ? '<span class="pill">❤️ Yêu thích</span>' : '') +
          '</div>' +
          ui.mutationBadges(p) +
          '<div class="detail__quick">' +
            '<button class="btn ' + (inTeam ? 'btn--ghost' : 'btn--primary') + ' btn--sm" data-act="team-toggle" data-uid="' + p.uid + '">' + (inTeam ? '✕ Rời đội' : '⚔️ Vào đội') + '</button>' +
            '<button class="btn ' + (isBuddy ? 'btn--gold' : 'btn--ghost') + ' btn--sm" data-act="buddy-set" data-uid="' + p.uid + '">' + (isBuddy ? '🧭 Đang đồng hành' : '🧭 Chọn đồng hành') + '</button>' +
            '<button class="btn btn--ghost btn--sm" data-act="favorite-toggle" data-uid="' + p.uid + '">' + (p.favorite ? '💔 Bỏ thích' : '❤️ Yêu thích') + '</button>' +
            '<button class="btn btn--ghost btn--sm" data-act="feed-open" data-uid="' + p.uid + '">🍽️ Cho ăn</button>' +
            '<button class="btn btn--ghost btn--sm" data-act="rename-pokemon" data-uid="' + p.uid + '">✏️ Đổi tên</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="detail__grid">' +
        '<section class="detail__section">' +
          '<h4>📊 Chỉ số</h4>' + statRows(p) +
          '<p class="muted small">IV tổng: <b>' + PG.ivTotal(p) + '/186</b> (' + PG.ivPercent(p) + '%) • Tiềm năng: ' + (p.potential || 100) + '</p>' +
        '</section>' +
        '<section class="detail__section">' +
          '<h4>🧬 Thông tin</h4>' +
          '<div class="info-grid">' +
            '<div><span>Tính cách</span><strong>' + nature.name + '</strong><small>' + nature.vi + '</small></div>' +
            '<div><span>Đặc tính</span><strong>' + ability.name + (p.hiddenAbility ? ' (Ẩn)' : '') + '</strong><small>' + ability.desc + '</small></div>' +
            '<div><span>Kích thước</span><strong>' + (PG.SIZE_TABLE[p.size] || {}).name + '</strong><small>' + p.height + ' m • ' + p.weight + ' kg</small></div>' +
            '<div><span>Nguồn</span><strong>' + esc(p.source || 'wild') + '</strong><small>' + PG.formatDate(p.caughtAt) + '</small></div>' +
            '<div><span>Thiện cảm</span><strong>' + (p.friendship || 0) + '/100</strong><small>Cho ăn để tăng, hỗ trợ tỉ lệ thu phục.</small></div>' +
          '</div>' +
          '<div class="held-slot">' +
            '<span>Vật phẩm cầm tay</span>' +
            (held ? '<div class="held-current">' +
              '<div class="held-item is-static">' + ui.itemIcon(p.heldItem) +
                '<span><strong>' + esc(held.name) + '</strong><small>' + esc(held.desc || '') + '</small>' +
                  (heldMax && !heldActive ? '<small class="bad">Hỏng — không còn tác dụng</small>' : '') +
                '</span></div>' +
              (heldMax ? '<div class="held-dur"><div class="bar ' + (heldCur / heldMax <= 0.25 ? 'is-low' : '') + '"><span style="width:' + Math.round(heldCur / heldMax * 100) + '%"></span></div>' +
                '<small>Độ bền ' + heldCur + '/' + heldMax + '</small>' +
                (repairCost ? '<button class="btn btn--ghost btn--sm" data-act="held-repair" data-uid="' + p.uid + '">🔧 Sửa (' + PG.fmt(repairCost) + ' Xu)</button>' : '') +
                '</div>' : '') +
              '<button class="btn btn--ghost btn--sm" data-act="held-remove" data-uid="' + p.uid + '">Tháo ra</button>' +
              '</div>'
              : '<button class="btn btn--ghost btn--sm" data-act="held-open" data-uid="' + p.uid + '">+ Gắn vật phẩm</button>') +
          '</div>' +
        '</section>' +
      '</div>' +

      '<section class="detail__section"><h4>⚔️ Chiêu thức</h4>' + moveRows(p) +
        '<button class="btn btn--ghost btn--sm" data-act="moves-open" data-uid="' + p.uid + '">✏️ Thay đổi chiêu</button>' +
        (Object.keys(PG.TMS).some(id => (st.bag[id] || 0) > 0) ? '<button class="btn btn--ghost btn--sm" data-act="tm-open" data-uid="' + p.uid + '">💿 Dùng TM</button>' : '') +
      '</section>' +

      '<section class="detail__section"><h4>⬆️ Nâng cấp</h4>' +
        '<div class="upgrade-line">' +
          '<div><strong>Nâng cấp Pokémon</strong><small>+1 cấp • ' + PG.fmt(cost.stardust) + ' Bụi Sao + ' + cost.candy + ' Kẹo</small>' +
            '<small class="muted">Bạn có ✨ ' + PG.fmt(st.player.stardust) + ' • 🍬 ' + candy + '</small></div>' +
          '<button class="btn btn--primary btn--sm" data-act="power-up" data-uid="' + p.uid + '"' + (canPower ? '' : ' disabled') + '>Nâng cấp</button>' +
        '</div>' +
        '<p class="muted small">Không giới hạn cấp. Mỗi lần lên cấp cộng ngẫu nhiên vĩnh viễn vào một chỉ số.</p>' +
      '</section>' +

      '<section class="detail__section"><h4>🔹 Exp tiêu hao</h4>' +
        '<div class="upgrade-line">' +
          '<div><strong>Dùng Exp để lên cấp nhanh</strong><small>Exp Nhỏ → Cực Đại • ' + PG.fmt(PG.xpToNext(p)) + ' EXP để lên cấp tiếp theo</small>' +
            '<small class="muted">Cấp hiện tại: ' + p.level + ' • EXP: ' + PG.fmt(p.xp || 0) + '</small></div>' +
          '<button class="btn btn--gold btn--sm" data-act="exp-open" data-uid="' + p.uid + '">💠 Dùng Exp</button>' +
        '</div>' +
      '</section>' +

      '<section class="detail__section"><h4>🧬 Tiến hóa</h4>' + evoRows(p) + '</section>' +

      '<section class="detail__section detail__section--actions">' +
        '<h4>💠 Quản lý</h4>' +
        '<div class="detail__actions">' +
          '<button class="btn btn--ghost btn--sm" data-act="medicine-open" data-uid="' + p.uid + '">🧪 Dùng thuốc</button>' +
          '<button class="btn btn--ghost btn--sm" data-act="market-open" data-uid="' + p.uid + '">🏷️ Đăng bán</button>' +
          '<button class="btn btn--ghost btn--sm" data-act="sell-pokemon" data-uid="' + p.uid + '">🪙 Bán (' + PG.fmt(PG.pokemonSellValue(p)) + ' Xu)</button>' +
          '<button class="btn btn--ghost btn--sm" data-act="transfer-pokemon" data-uid="' + p.uid + '">🔄 Chuyển nhượng</button>' +
        '</div>' +
        '<p class="muted small">Không thể bán Pokémon trong đội, bạn đồng hành hoặc đã yêu thích.</p>' +
      '</section>' +
    '</div>';
  }

  function openDetail(uid) {
    const p = findP(uid);
    if (!p) { ui.closeModal(); ui.toast('Pokémon không còn trong kho.', 'error'); return; }
    const sp = PG.SPECIES[p.speciesId];
    ui.modal({
      title: ui.spriteHtml(p, { size: 'xs' }) + ' ' + esc(p.nickname || sp.name),
      subtitle: '#' + String(sp.dex).padStart(3, '0') + ' • ' + sp.rarity + ' • ' + (p.shiny ? 'Shiny' : 'Thường'),
      body: detailBody(p),
      size: 'lg'
    });
  }

  ui.actions['open-pokemon'] = function (el) { openDetail(el.dataset.uid); };

  /* ---------------- TEAM / BUDDY / FAVORITE ---------------- */
  function afterMutation(uid, msg, type) {
    PG.saveState(true);
    ui.refreshTopbar();
    if (msg) ui.toast(msg, type || 'success');
    const modalOpen = document.querySelector('#modal-root .modal__panel');
    if (modalOpen && uid) openDetail(uid);
    const view = document.getElementById('view');
    if (view && !modalOpen) ui.render();
  }

  ui.actions['team-toggle'] = function (el) {
    const st = state();
    const uid = el.dataset.uid;
    const p = findP(uid);
    if (!p) return;
    const idx = st.team.indexOf(uid);
    if (idx >= 0) st.team.splice(idx, 1);
    else {
      if (st.team.length >= 6) { ui.toast('Đội đã đủ 6 Pokémon. Hãy bỏ một Pokémon ra trước.', 'warn'); return; }
      st.team.push(uid);
    }
    afterMutation(uid, idx >= 0 ? 'Đã rời đội.' : 'Đã thêm vào đội!');
  };

  ui.actions['team-remove'] = function (el, e) {
    e.stopPropagation();
    const st = state();
    const uid = el.dataset.uid;
    st.team = st.team.filter(id => id !== uid);
    afterMutation(null, 'Đã rời đội.');
  };

  ui.actions['buddy-set'] = function (el) {
    const st = state();
    const uid = el.dataset.uid;
    const p = findP(uid);
    if (!p) return;
    if (st.buddy === uid) {
      st.buddy = null; st.buddyProgress = 0;
      afterMutation(uid, 'Đã bỏ bạn đồng hành.');
    } else {
      st.buddy = uid;
      st.buddyProgress = 0;
      afterMutation(uid, 'Bắt đầu đồng hành cùng ' + PG.SPECIES[p.speciesId].name + '!');
    }
  };

  ui.actions['favorite-toggle'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    p.favorite = !p.favorite;
    afterMutation(p.uid, p.favorite ? 'Đã thêm vào yêu thích.' : 'Đã bỏ yêu thích.');
  };

  /* ---------------- RENAME ---------------- */
  ui.actions['rename-pokemon'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    const sp = PG.SPECIES[p.speciesId];
    ui.modal({
      title: '✏️ Đổi tên',
      subtitle: 'Đặt biệt danh cho ' + esc(sp.name) + ' (tối đa 16 ký tự).',
      body: '<input class="input" id="nickname-input" maxlength="16" value="' + esc(p.nickname || '') + '" placeholder="' + esc(sp.name) + '">' +
        '<p class="muted small">Để trống để dùng tên gốc.</p>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>' +
        '<button class="btn btn--primary" data-act="save-nickname" data-uid="' + p.uid + '">Lưu</button>',
      size: 'sm',
      onMount: function () { const i = document.getElementById('nickname-input'); if (i) i.focus(); }
    });
  };

  ui.actions['save-nickname'] = function (el) {
    const p = findP(el.dataset.uid);
    const input = document.getElementById('nickname-input');
    if (!p || !input) return;
    p.nickname = input.value.trim().slice(0, 16) || null;
    afterMutation(p.uid, 'Đã đổi tên!');
  };

  /* ---------------- POWER UP / EVOLVE ---------------- */
  ui.actions['power-up'] = function (el) {
    const st = state();
    const p = findP(el.dataset.uid);
    if (!p) return;
    const res = PG.powerUp(st, p);
    if (!res.ok) { ui.toast(res.msg, 'error'); return; }
    PG.Audio.play('levelup');
    PG.saveState(true);
    afterMutation(p.uid, res.msg);
  };

  ui.actions['evolve'] = function (el) {
    const st = state();
    const p = findP(el.dataset.uid);
    if (!p) return;
    const sp = PG.SPECIES[p.speciesId];
    const opt = {
      to: el.dataset.to, candy: Number(el.dataset.candy),
      level: el.dataset.level ? Number(el.dataset.level) : null,
      condition: el.dataset.condition || null
    };
    const check = PG.canEvolve(st, p, opt);
    if (!check.ok) { ui.toast(check.msg, 'error'); return; }
    ui.confirm('Tiến hóa?', PG.SPECIES[p.speciesId].name + ' sẽ tiến hóa thành ' + PG.SPECIES[opt.to].name + '.', function () {
      const res = PG.evolve(st, p, opt);
      if (!res.ok) { ui.toast(res.msg, 'error'); return; }
      PG.Audio.play('evolve');
      afterMutation(p.uid, res.msg);
      const view = document.getElementById('view');
      if (view) ui.render();
    }, { okText: 'Tiến hóa' });
  };

  /* ---------------- MOVES ---------------- */
  ui.actions['moves-open'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    const sp = PG.SPECIES[p.speciesId];
    const known = new Set(p.moves.map(m => m.id));
    const learned = [...new Set([...(p.learnedMoves || []), ...p.moves.map(m => m.id)])];
    const rows = learned.map(id => {
      const mv = PG.getMove(id);
      if (!mv) return '';
      const t = PG.TYPES[mv.type];
      const on = known.has(id);
      return '<button class="move-option' + (on ? ' is-on' : '') + '" data-act="move-toggle" data-id="' + id + '" style="--mt:' + t.color + '">' +
        '<span class="move-option__name">' + t.icon + ' ' + esc(mv.name) + '</span>' +
        '<span class="move-option__meta">' + t.name + ' • ' + (mv.power ? mv.power + ' PWR' : 'Hỗ trợ') + ' • ' + (mv.accuracy || '—') + '%</span>' +
        '<span class="move-option__check">' + (on ? '✓' : '') + '</span></button>';
    }).join('');
    ui.modal({
      title: '⚔️ Chiêu thức của ' + esc(sp.name),
      subtitle: 'Chọn tối đa 4 chiêu. Các chiêu đã chọn sẽ dùng trong trận.',
      body: '<div class="move-options">' + (rows || '<p class="muted">Chưa học được chiêu nào.</p>') + '</div>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>' +
        '<button class="btn btn--primary" data-act="moves-save" data-uid="' + p.uid + '">Lưu chiêu</button>',
      size: 'md'
    });
  };

  ui.actions['move-toggle'] = function (el) {
    const on = ui.$all('.move-option.is-on');
    if (!el.classList.contains('is-on') && on.length >= 4) {
      ui.toast('Chỉ được chọn tối đa 4 chiêu.', 'warn');
      return;
    }
    el.classList.toggle('is-on');
    const check = el.querySelector('.move-option__check');
    if (check) check.textContent = el.classList.contains('is-on') ? '✓' : '';
  };

  ui.actions['moves-save'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    const ids = ui.$all('.move-option.is-on').map(x => x.dataset.id);
    if (!ids.length) { ui.toast('Phải chọn ít nhất 1 chiêu.', 'error'); return; }
    p.moves = ids.map(id => ({ id, level: 1 }));
    p.pp = {};
    for (const id of ids) p.pp[id] = PG.maxPp(id, 1);
    PG.saveState(true);
    ui.toast('Đã cập nhật chiêu thức!', 'success');
    openDetail(p.uid);
    const view = document.getElementById('view');
    if (view) ui.render();
  };

  /* ---------------- HELD ITEM / MEDICINE / TM ---------------- */
  ui.actions['held-open'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    const st = state();
    const ids = Object.keys(PG.HELD_ITEMS).filter(id => (st.bag[id] || 0) > 0);
    ui.modal({
      title: '🎒 Gắn vật phẩm cầm tay',
      subtitle: 'Vật phẩm sẽ phát huy tác dụng trong trận đấu.',
      body: ids.length ? '<div class="item-pick-grid">' + ids.map(id => {
        const info = PG.HELD_ITEMS[id];
        return '<button class="item-pick" data-act="held-assign" data-id="' + id + '" data-uid="' + p.uid + '">' +
          ui.itemIcon(id) + '<span><strong>' + esc(info.name) + ' <b>x' + st.bag[id] + '</b></strong><small>' + esc(info.desc) + '</small></span></button>';
      }).join('') + '</div>' : '<p class="muted">Bạn không có vật phẩm cầm tay nào. Chế tạo hoặc mua ở Chợ.</p>',
      size: 'md'
    });
  };

  /* Render trước rồi mở lại detail: nếu mở detail trước, ui.render() sẽ xóa modal. */
  function refreshHeldDetail(uid) {
    const view = document.getElementById('view');
    if (view) ui.render();
    openDetail(uid);
  }

  ui.actions['held-assign'] = function (el) {
    const res = PG.assignHeldItem(el.dataset.uid, el.dataset.id);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) refreshHeldDetail(el.dataset.uid);
  };

  ui.actions['held-remove'] = function (el) {
    const res = PG.removeHeldItem(el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) refreshHeldDetail(el.dataset.uid);
  };

  ui.actions['held-repair'] = function (el) {
    const res = PG.repairHeldItem(el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('buy'); ui.refreshTopbar(); refreshHeldDetail(el.dataset.uid); }
  };

  /* ---------------- CHO ĂN: TĂNG THIỆN CẢM / CATCH MULT ---------------- */
  ui.actions['feed-open'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    const st = state();
    const ids = Object.keys(PG.BERRIES).filter(id => PG.BERRIES[id].friendship && (st.bag[id] || 0) > 0);
    ui.modal({
      title: '🍽️ Cho ' + esc(p.nickname || PG.SPECIES[p.speciesId].name) + ' ăn',
      subtitle: 'Thiện cảm hiện tại: ' + (p.friendship || 0) + '/100 • Tối đa 100',
      body: ids.length ? '<div class="item-pick-grid">' + ids.map(id => {
        const info = PG.BERRIES[id];
        return '<button class="item-pick" data-act="feed-give" data-id="' + id + '" data-uid="' + p.uid + '">' +
          ui.itemIcon(id) + '<span><strong>' + esc(info.name) + ' <b>x' + st.bag[id] + '</b></strong><small>' + esc(info.desc) +
            ' <em class="stat-bonus--held">+' + info.friendship + ' thiện cảm</em></small></span></button>';
      }).join('') + '</div>' : '<p class="muted">Không có quả tăng thiện cảm. Mua ở Chợ hoặc nhặt khi đi dạo.</p>',
      size: 'md'
    });
  };

  ui.actions['feed-give'] = function (el) {
    const res = PG.feedBerry(el.dataset.uid, el.dataset.id);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('buy'); refreshHeldDetail(el.dataset.uid); }
  };

  ui.actions['exp-open'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    const st = state();
    const ids = Object.keys(PG.EXP_ITEMS).filter(id => (st.bag[id] || 0) > 0);
    ui.modal({
      title: '💠 Dùng Exp',
      subtitle: 'Chọn Exp cho ' + esc(PG.SPECIES[p.speciesId].name) + ' • Cấp ' + p.level,
      body: ids.length ? '<div class="item-pick-grid">' + ids.map(id => {
        const info = PG.EXP_ITEMS[id];
        return '<button class="item-pick" data-act="exp-use" data-id="' + id + '" data-uid="' + p.uid + '">' +
          ui.itemIcon(id) + '<span><strong>' + esc(info.name) + ' <b>x' + st.bag[id] + '</b></strong><small>' + esc(info.desc) + '</small></span></button>';
      }).join('') + '</div>' : '<p class="muted">Không có Exp trong túi. Mua ở Chợ → 🎁 Vật Phẩm.</p>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>',
      size: 'md'
    });
  };

  ui.actions['exp-use'] = function (el) {
    const res = PG.useExpItem(el.dataset.id, el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) {
      PG.Audio.play('levelup');
      ui.refreshTopbar();
      openDetail(el.dataset.uid);
      const v = document.getElementById('view');
      if (v) ui.render();
    }
  };

  ui.actions['medicine-open'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    const st = state();
    const ids = Object.keys(PG.MEDICINES).filter(id => (st.bag[id] || 0) > 0 && !PG.MEDICINES[id].stamina);
    ui.modal({
      title: '🧪 Dùng thuốc',
      subtitle: 'Chọn thuốc cho ' + esc(PG.SPECIES[p.speciesId].name) + '.',
      body: ids.length ? '<div class="item-pick-grid">' + ids.map(id => {
        const info = PG.MEDICINES[id];
        return '<button class="item-pick" data-act="medicine-use" data-id="' + id + '" data-uid="' + p.uid + '">' +
          ui.itemIcon(id) + '<span><strong>' + esc(info.name) + ' <b>x' + st.bag[id] + '</b></strong><small>' + esc(info.desc) + '</small></span></button>';
      }).join('') + '</div>' : '<p class="muted">Không có thuốc phù hợp trong túi.</p>',
      size: 'md'
    });
  };

  ui.actions['medicine-use'] = function (el) {
    const res = PG.useMedicine(el.dataset.id, el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('heal'); openDetail(el.dataset.uid); const v = document.getElementById('view'); if (v) ui.render(); }
  };

  ui.actions['tm-open'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    const st = state();
    const ids = Object.keys(PG.TMS).filter(id => (st.bag[id] || 0) > 0);
    ui.modal({
      title: '💿 Dùng TM',
      subtitle: 'Dạy một chiêu mới cho ' + esc(PG.SPECIES[p.speciesId].name) + '.',
      body: '<div class="item-pick-grid">' + ids.map(id => {
        const tm = PG.TMS[id];
        const mv = PG.getMove(tm.move);
        const known = (p.learnedMoves || []).includes(tm.move);
        return '<button class="item-pick" data-act="tm-use" data-id="' + id + '" data-uid="' + p.uid + '"' + (known ? ' disabled' : '') + '>' +
          ui.itemIcon(id) + '<span><strong>' + esc(tm.name) + ' <b>x' + st.bag[id] + '</b></strong><small>' + (known ? 'Đã học chiêu này' : 'Dạy ' + (mv ? mv.name : tm.move)) + '</small></span></button>';
      }).join('') + '</div>',
      size: 'md'
    });
  };

  ui.actions['tm-use'] = function (el) {
    const p = findP(el.dataset.uid);
    const st = state();
    const id = el.dataset.id;
    const tm = PG.TMS[id];
    if (!p || !tm) return;
    if ((st.bag[id] || 0) < 1) { ui.toast('Không còn TM này.', 'error'); return; }
    if (p.learnedMoves.includes(tm.move)) { ui.toast('Đã học chiêu này rồi.', 'warn'); return; }
    PG.removeItem(id, 1);
    p.learnedMoves.push(tm.move);
    if (p.moves.length < 4) {
      p.moves.push({ id: tm.move, level: 1 });
      p.pp[tm.move] = PG.maxPp(tm.move, 1);
    }
    PG.saveState(true);
    ui.toast('Đã dạy ' + (PG.getMove(tm.move) ? PG.getMove(tm.move).name : tm.move) + '!', 'success');
    openDetail(p.uid);
    const v = document.getElementById('view');
    if (v) ui.render();
  };

  /* ---------------- MARKET / SELL ---------------- */
  ui.actions['market-open'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    const st = state();
    if (st.team.includes(p.uid) || st.buddy === p.uid) { ui.toast('Không thể bán Pokémon trong đội hoặc đồng hành.', 'error'); return; }
    if (p.favorite) { ui.toast('Pokémon yêu thích không thể bán.', 'error'); return; }
    const suggested = Math.max(100, Math.round(PG.pokemonSellValue(p) * 1.4));
    ui.modal({
      title: '🏷️ Đăng bán ' + esc(PG.SPECIES[p.speciesId].name),
      subtitle: 'NPC sẽ mua trong vài phút. Giá tối thiểu 100 Xu.',
      body: '<div class="market-form">' +
        '<div class="market-form__mon">' + ui.spriteHtml(p, { size: 'md' }) + '<div><strong>' + esc(PG.SPECIES[p.speciesId].name) + '</strong><small>Lv.' + p.level + ' • CP ' + PG.fmt(PG.cpOf(p)) + ' • ' + PG.qualityOf(p).name + '</small></div></div>' +
        '<label class="field"><span>Giá bán (Xu)</span><input class="input" id="market-price" type="number" min="100" step="50" value="' + suggested + '"></label>' +
        '<p class="muted small">Gợi ý: ' + PG.fmt(suggested) + ' Xu • Giá bán lẻ: ' + PG.fmt(PG.pokemonSellValue(p)) + ' Xu. Giá cao hơn sẽ lâu bán hơn.</p>' +
      '</div>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>' +
        '<button class="btn btn--primary" data-act="market-confirm" data-uid="' + p.uid + '">Đăng bán</button>',
      size: 'sm'
    });
  };

  ui.actions['market-confirm'] = function (el) {
    const input = document.getElementById('market-price');
    const price = Math.max(100, Math.floor(Number(input && input.value) || 100));
    const res = PG.listOnMarket(el.dataset.uid, price);
    if (!res.ok) { ui.toast(res.msg, 'error'); return; }
    ui.closeModal();
    ui.toast(res.msg, 'success');
    ui.render();
  };

  ui.actions['sell-pokemon'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    ui.confirm('Bán Pokémon?', 'Bán ' + PG.SPECIES[p.speciesId].name + ' với giá ' + PG.fmt(PG.pokemonSellValue(p)) + ' Xu? Bạn cũng nhận được Kẹo.', function () {
      const res = PG.sellPokemon(p.uid);
      if (!res.ok) { ui.toast(res.msg, 'error'); return; }
      ui.closeModal(); ui.toast(res.msg, 'success'); ui.render();
    }, { danger: true, okText: 'Bán' });
  };

  ui.actions['transfer-pokemon'] = function (el) {
    const p = findP(el.dataset.uid);
    if (!p) return;
    ui.confirm('Chuyển nhượng?', 'Chuyển ' + PG.SPECIES[p.speciesId].name + ' để nhận Kẹo và Bụi Sao. Pokémon sẽ rời khỏi Kho.', function () {
      const res = PG.transferPokemon(p.uid);
      if (!res.ok) { ui.toast(res.msg, 'error'); return; }
      ui.closeModal(); ui.toast(res.msg, 'success'); ui.render();
    }, { danger: true, okText: 'Chuyển nhượng' });
  };
})();
