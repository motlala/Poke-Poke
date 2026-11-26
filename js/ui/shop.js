/* ============================================================
   CHỢ: cửa hàng hằng ngày, quầy may mắn, chợ người chơi, bán đồ
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  function tab() {
    const t = ui.flow.shopTab || 'daily';
    return t === 'npc' ? 'market' : t; // tab NPC cũ giờ gộp vào chợ chung
  }
  function st() { return PG.getState(); }

  function timeLeft(ts) {
    const ms = Math.max(0, ts - Date.now());
    const m = Math.ceil(ms / 60000);
    if (m <= 1) return 'dưới 1 phút';
    return m + ' phút';
  }

  function giftStock() {
    return ((st().giftBoxShop || {}).stock || []).filter(x => x && !x.sold);
  }

  function tabsHtml() {
    const list = [
      { id: 'daily', label: '🛒 Cửa Hàng', badge: st().shop.stock.filter(x => x.sold < x.qty).length },
      { id: 'gift', label: '🎁 Hộp Quà', badge: giftStock().length || null },
      { id: 'items', label: '🎁 Vật Phẩm', badge: null },
      { id: 'trainer', label: '🧬 Vật Phẩm HLV', badge: (st().trainerShop.stock || []).filter(x => !x.sold).length },
      { id: 'market', label: '🏷️ Chợ Pokémon', badge: (PG.getMarketListings ? PG.getMarketListings() : []).length },
      { id: 'merchant', label: '🧳 Thương Hội', badge: ((st().merchant || {}).stock || []).filter(x => x.sold < x.qty).length },
      { id: 'sell', label: '🪙 Bán Đồ', badge: null }
    ];
    return '<div class="segmented segmented--wide">' + list.map(t =>
      '<button class="segmented__btn' + (tab() === t.id ? ' is-active' : '') + '" data-act="shop-tab" data-tab="' + t.id + '">' +
      t.label + (t.badge ? ' <span class="seg-badge">' + t.badge + '</span>' : '') + '</button>').join('') + '</div>';
  }

  function stockCard(entry) {
    const isEq = entry.kind === 'equipment';
    const info = isEq ? null : PG.itemInfo(entry.id);
    const base = isEq ? PG.EQUIPMENT_BASES[entry.baseId] : null;
    const rarity = isEq && base ? PG.RARITY[base.rarity] : null;
    const left = entry.qty - entry.sold;
    const soldOut = left <= 0;
    const discount = st().shop.discount || 1;
    const name = isEq ? (base ? base.name : entry.baseId) : info.name;
    const icon = isEq ? (base ? base.icon : '🧥') : info.icon;
    const kindLabel = isEq ? 'Trang bị ' + rarity.name : ({
      ball: 'Bóng', berry: 'Quả', medicine: 'Thuốc', exp: 'EXP', key: 'Đặc biệt', bait: 'Mồi', rod: 'Cần câu', tm: 'TM', held: 'Cầm tay', stone: 'Đá tiến hóa', material: 'Nguyên liệu'
    }[info.kind] || 'Vật phẩm');
    return '<div class="shop-card' + (soldOut ? ' is-soldout' : '') + (isEq ? ' shop-card--eq' : '') + '">' +
      '<div class="shop-card__top">' +
        '<span class="shop-card__icon" style="--ic:' + (isEq ? rarity.color : info.color) + '">' + icon + '</span>' +
        '<span class="shop-card__flags"><span class="pill pill--sm">' + kindLabel + '</span>' +
          (discount < 1 ? '<span class="pill pill--sm pill--sale">-20%</span>' : '') + '</span>' +
      '</div>' +
      '<strong class="shop-card__name">' + esc(name) + '</strong>' +
      '<p class="shop-card__desc">' + esc(isEq ? (base ? base.desc : '') : info.desc) + '</p>' +
      '<div class="shop-card__bottom">' +
        '<span class="shop-card__price">🪙 ' + PG.fmt(entry.price) + '</span>' +
        '<span class="shop-card__left">' + (soldOut ? 'Đã bán hết' : 'Còn ' + left) + '</span>' +
      '</div>' +
      (soldOut ? '<button class="btn btn--ghost btn--sm btn--block" disabled>Hết hàng</button>' :
        '<div class="shop-card__buy">' +
          '<button class="btn btn--primary btn--sm" data-act="shop-buy" data-uid="' + entry.uid + '" data-qty="1">Mua 1</button>' +
          (left > 1 && !isEq ? '<button class="btn btn--ghost btn--sm" data-act="shop-buy" data-uid="' + entry.uid + '" data-qty="5">Mua 5</button>' : '') +
        '</div>') +
    '</div>';
  }

  function dailyPanel() {
    const state = st();
    const shop = state.shop;
    const active = state.events.active;
    return '<section class="panel shop-main">' +
      '<div class="panel__head"><h3 class="panel__title">Hàng Hôm Nay</h3>' +
        '<span class="muted small">Làm mới sau 00:00 • Túi ' + PG.bagCount() + '/' + PG.bagCapacity() + '</span></div>' +
      (active && active.id === 'discount' ? '<div class="alert alert--gold">🏷️ ' + esc(active.desc) + '</div>' : '') +
      (giftStock().length ? '<div class="alert alert--gold">🎁 <b>Chợ vừa nhập ' + giftStock().length + ' hộp quà bí ẩn!</b> Gói rẻ / trung / cao, nội dung bí mật — may mắn lời ngon, xui thì lỗ nhẹ. ' +
        '<button class="btn btn--gold btn--sm" data-act="shop-tab" data-tab="gift">Xem Hộp Quà</button></div>' : '') +
      '<div class="shop-grid">' + shop.stock.map(stockCard).join('') + '</div>' +
    '</section>';
  }

  function giftCard(entry) {
    const def = PG.giftBoxDef(entry.boxId) || {
      name: 'Hộp Quà', icon: '🎁', color: '#fcd34d', tier: 'cheap', desc: ''
    };
    const soldOut = !!entry.sold;
    const tierLabel = { cheap: 'Gói Rẻ', medium: 'Gói Trung', high: 'Gói Cao' }[def.tier] || 'Gói Quà';
    return '<div class="shop-card shop-card--gift gift-card--' + def.tier + (soldOut ? ' is-soldout' : '') +
        '" style="--ic:' + def.color + '">' +
      '<div class="shop-card__top"><span class="shop-card__icon">' + def.icon + '</span>' +
        '<span class="shop-card__flags"><span class="pill pill--sm">' + tierLabel + '</span></span></div>' +
      '<strong class="shop-card__name">' + esc(def.name) + '</strong>' +
      '<p class="shop-card__desc">' + esc(def.desc) + '</p>' +
      '<div class="shop-card__bottom"><span class="shop-card__price">🪙 ' + PG.fmt(entry.price) + '</span>' +
        '<span class="shop-card__left">' + (soldOut ? 'Đã mở' : 'Bí mật') + '</span></div>' +
      (soldOut ? '<button class="btn btn--ghost btn--sm btn--block" disabled>Đã mở</button>' :
        '<button class="btn btn--primary btn--sm btn--block" data-act="gift-buy" data-uid="' + entry.uid + '">🎁 Mua & Mở</button>') +
    '</div>';
  }

  function giftPanel() {
    const shop = st().giftBoxShop || { stock: [], nextAt: Date.now() };
    const stock = shop.stock || [];
    const left = giftStock().length;
    const next = timeLeft(shop.nextAt || Date.now());
    return '<section class="panel shop-main gift-shop">' +
      '<div class="panel__head"><h3 class="panel__title">🎁 Hộp Quà Bí Ẩn</h3>' +
        '<span class="muted small">Làm mới sau ' + next + ' • ' + left + ' hộp còn lại</span></div>' +
      '<div class="alert alert--gold">🍀 Gói giá <b>rẻ / trung / cao</b> xuất hiện ngẫu nhiên mỗi 15 phút. Giá niêm yết cố định, còn giá trị bên trong là bí mật: may mắn lời gấp đôi, xui thì lỗ nhẹ.</div>' +
      (stock.length ? '<div class="shop-grid gift-grid">' + stock.map(giftCard).join('') + '</div>' :
        '<div class="empty-state"><b>Chu kỳ này chợ không nhập hộp quà.</b>' +
          '<p class="muted small">Hẹn gặp bạn ở lượt làm mới tiếp theo (' + next + ').</p></div>') +
    '</section>';
  }

  function catalogCard(id) {
    const info = PG.itemInfo(id);
    const label = ({
      ball: 'Bóng', berry: 'Quả', bait: 'Mồi', rod: 'Cần câu', held: 'Cầm tay',
      exp: 'EXP', medicine: 'Thuốc', stone: 'Đá tiến hóa', material: 'Nguyên liệu', key: 'Đặc biệt'
    }[info.kind] || 'Vật phẩm');
    return '<div class="shop-card shop-card--catalog">' +
      '<div class="shop-card__top">' +
        '<span class="shop-card__icon" style="--ic:' + (info.color || '#888') + '">' + (info.icon || '❓') + '</span>' +
        '<span class="shop-card__flags"><span class="pill pill--sm">' + label + '</span></span>' +
      '</div>' +
      '<strong class="shop-card__name">' + esc(info.name) + '</strong>' +
      '<p class="shop-card__desc">' + esc(info.desc || '') + '</p>' +
      '<div class="shop-card__bottom"><span class="shop-card__price">🪙 ' + PG.fmt(info.price) + '</span>' +
        '<span class="shop-card__left">Túi ' + (st().bag[id] || 0) + '</span></div>' +
      '<div class="shop-card__buy">' +
        '<button class="btn btn--primary btn--sm" data-act="catalog-buy" data-id="' + id + '" data-qty="1">Mua 1</button>' +
        (id === 'exp-max' ? '' : '<button class="btn btn--ghost btn--sm" data-act="catalog-buy" data-id="' + id + '" data-qty="5">Mua 5</button>') +
      '</div>' +
    '</div>';
  }

  function eggPanel() {
    const def = PG.EGG_TYPES && PG.EGG_TYPES.random;
    if (!def) return '';
    const owned = (st().eggs || []).length;
    const full = owned >= 9;
    return '<div class="catalog-group catalog-group--egg">' +
      '<div class="catalog-group__head"><h4>🥚 Trứng Ngẫu Nhiên</h4>' +
        '<span class="muted small">Chỉ bán trứng random • đang có ' + owned + '/9 trứng</span></div>' +
      '<div class="egg-shop">' +
        '<button class="egg-buy egg-buy--random" data-act="buy-egg"' + (full ? ' disabled' : '') +
          ' title="' + esc(def.desc || '') + '">' +
          '<span>🥚 ' + esc(def.name) + ' • ' + def.km + ' km</span>' +
          '<small>🪙 ' + PG.fmt(def.price) + ' Xu</small></button>' +
        '<p class="muted small">Nở ra một loài bất kỳ trong bể trứng. Cần <b>Lò Ấp</b> để bắt đầu ấp ' +
          '(mua ở nhóm Nhu yếu phẩm bên dưới). Trứng đã mua nở trong tab Trứng ở trang chủ.</p>' +
      '</div></div>';
  }

  function catalogPanel() {
    const groups = [
      ['essentials', '🧰 Nhu yếu phẩm', 'Tất cả bóng, quả, thuốc, mồi câu, EXP và nguyên liệu — luôn có sẵn, không chờ làm mới.'],
      ['held', '💪 Vật phẩm cầm tay', 'Gắn riêng cho từng Pokémon. Chỉ số có giá trị âm lẫn dương; đồ mòn hết phải sửa bằng Xu.'],
      ['exp', '🔹 Exp nâng cấp', 'Lên cấp không giới hạn. Mỗi cấp cộng ngẫu nhiên vĩnh viễn vào một chỉ số.'],
      ['heal', '🧪 Hồi phục', 'Thuốc, hồi sinh và nước tăng lực. Pokémon cũng tự hồi 1 HP mỗi 30 giây.'],
      ['stone', '💎 Đá & Lõi Tiến Hóa', 'Đá tiến hóa cổ điển lẫn lõi Mega / Gigantamax / Awakened cho dạng mới.']
    ];
    return '<section class="panel shop-main">' +
      '<div class="panel__head"><h3 class="panel__title">🎁 Cửa Hàng Vật Phẩm</h3>' +
        '<span class="muted small">Giá cố định • Túi ' + PG.bagCount() + '/' + PG.bagCapacity() + '</span></div>' +
      eggPanel() +
      groups.map(([key, title, desc]) => {
        const ids = (PG.CATALOG[key] || []).filter(id => PG.itemInfo(id).kind !== 'misc');
        return '<div class="catalog-group">' +
          '<div class="catalog-group__head"><h4>' + title + '</h4><span class="muted small">' + esc(desc) + '</span></div>' +
          '<div class="shop-grid">' + ids.map(catalogCard).join('') + '</div></div>';
      }).join('') +
    '</section>';
  }

  function statChips(stats) {
    const meta = PG.TRAINER_STAT_META || {};
    return Object.entries(stats || {}).map(([k, v]) => {
      const m = meta[k] || { name: k, icon: '•', suffix: '' };
      return '<span class="pill pill--sm">+' + PG.fmt(v) + m.suffix + ' ' + esc(m.name) + '</span>';
    }).join('');
  }

  function trainerShopPanel() {
    const state = st();
    const shop = state.trainerShop;
    const totals = PG.trainerBonuses(state).totals;
    const owned = state.player.trainerItems || [];
    const leftMs = Math.max(0, (shop.nextAt || 0) - Date.now());
    const resetIn = leftMs ? Math.max(1, Math.ceil(leftMs / 60000)) + ' phút' : 'đang làm mới';
    return '<section class="panel shop-main">' +
      '<div class="panel__head"><h3 class="panel__title">🧬 Quầy Vật Phẩm Huấn Luyện Viên</h3>' +
        '<span class="badge">🔄 5 món / 30 phút • ' + (shop.stock || []).filter(x => !x.sold).length + '/' + (shop.stock || []).length + ' chưa gắn</span></div>' +
      '<p class="muted">Mỗi 30 phút quầy đổi <b>5 món mới</b> (làm mới sau <b>' + resetIn + '</b>). Mua rồi là <b>gắn vĩnh viễn</b> vào Huấn luyện viên, cộng trực tiếp vào chỉ số chiến đấu, may mắn và thể lực. Chỉ số <b>không có trần</b>.</p>' +
      '<div class="trainer-shop-grid">' + (shop.stock || []).map(entry => {
        const def = PG.TRAINER_ITEMS[entry.itemId];
        if (!def) return '';
        const rarity = PG.RARITY[def.rarity] || PG.RARITY.common;
        return '<div class="trainer-card' + (entry.sold ? ' is-soldout' : '') + '" style="--rc:' + rarity.color + ';--rg:' + rarity.glow + '">' +
          '<div class="trainer-card__glow"></div>' +
          '<span class="trainer-card__icon">' + def.icon + '</span>' +
          '<span class="pill pill--sm" style="color:' + rarity.color + '">' + rarity.name + '</span>' +
          '<strong>' + esc(def.name) + '</strong>' +
          '<p class="muted small">' + esc(def.desc) + '</p>' +
          '<div class="trainer-card__stats">' + statChips(def.stats) + '</div>' +
          '<span class="trainer-card__price">🪙 ' + PG.fmt(entry.price) + '</span>' +
          (entry.sold ? '<button class="btn btn--ghost btn--sm btn--block" disabled>Đã gắn</button>' :
            '<button class="btn btn--gold btn--sm btn--block" data-act="trainer-shop-buy" data-uid="' + entry.uid + '">Mua &amp; gắn</button>') +
          '</div>';
      }).join('') + '</div>' +
      '<div class="panel__divider"></div>' +
      '<h4 class="mini-title">📊 Chỉ số Huấn luyện viên hiện tại</h4>' +
      ui.trainerStatsHtml(totals) +
      '<h4 class="mini-title">🎖️ Vật phẩm đã gắn (' + owned.length + ')</h4>' +
      (owned.length ? '<div class="trainer-owned">' + owned.map(it => {
        const def = PG.TRAINER_ITEMS[it.itemId];
        const rarity = PG.RARITY[it.rarity] || PG.RARITY.common;
        return '<span class="pill" style="color:' + rarity.color + '">' + (def ? def.icon : '🎖️') + ' ' + esc(it.name || (def && def.name) || it.itemId) + '</span>';
      }).join('') + '</div>' : '<p class="muted small">Chưa gắn vật phẩm nào. Quầy mỗi 30 phút mở 5 món ngẫu nhiên; đồ đã mua không bao giờ mất.</p>') +
    '</section>';
  }

  function merchantOfferLabel(entry) {
    if (entry.kind === 'item' || entry.kind === 'material') {
      const info = PG.itemInfo(entry.id);
      return (info.icon || '📦') + ' ' + esc(info.name);
    }
    if (entry.kind === 'equipment') {
      const base = PG.EQUIPMENT_BASES[entry.baseId] || {};
      return (base.icon || '🧥') + ' ' + esc(base.name || entry.baseId);
    }
    if (entry.kind === 'trainer') {
      const def = PG.TRAINER_ITEMS[entry.itemId] || {};
      return (def.icon || '🎖️') + ' ' + esc(def.name || entry.itemId);
    }
    return '🎁 Giao dịch';
  }

  function merchantGiveHtml(give) {
    if (!give) return '';
    const parts = [];
    if (give.coins) parts.push('🪙 ' + PG.fmt(give.coins) + ' Xu');
    for (const [id, n] of Object.entries(give.materials || {})) parts.push((PG.itemInfo(id).icon || '📦') + ' ' + n + ' ' + esc(PG.itemInfo(id).name));
    return parts.join(' • ');
  }

  function merchantOutHtml(out) {
    if (!out) return '';
    const parts = [];
    if (out.coins) parts.push('🪙 ' + PG.fmt(out.coins));
    if (out.stardust) parts.push('✨ ' + PG.fmt(out.stardust));
    if (out.items) for (const [id, n] of Object.entries(out.items)) parts.push('+' + n + ' ' + esc(PG.itemInfo(id).name));
    if (out.materials) for (const [id, n] of Object.entries(out.materials)) parts.push('+' + n + ' ' + esc(PG.itemInfo(id).name));
    if (out.trainerItems) for (const id of out.trainerItems) parts.push('🎖️ ' + esc((PG.TRAINER_ITEMS[id] || {}).name || id));
    if (out.equipment) for (const s of [].concat(out.equipment)) parts.push('🧥 ' + esc((PG.EQUIPMENT_BASES[s.baseId || s] || {}).name || (s.baseId || s)));
    return parts.join(' • ');
  }

  function merchantPanel() {
    const state = st();
    const data = PG.getMerchantOffers ? PG.getMerchantOffers() : { stock: [], merchant: null, buys: [] };
    const merchant = data.merchant;
    const region = PG.REGIONS[state.region] || {};
    const stock = data.stock || [];
    const buys = data.buys || [];
    const goods = stock.filter(x => x.kind !== 'trade' && x.kind !== 'request');
    const trades = stock.filter(x => x.kind === 'trade');
    const requests = stock.filter(x => x.kind === 'request' && PG.MATERIALS[x.id]);
    const ownedMats = Object.keys(state.materials || {}).filter(id => (state.materials[id] || 0) > 0 && PG.MATERIALS[id]);
    return '<section class="panel shop-main merchant-panel">' +
      '<div class="panel__head"><h3 class="panel__title">' + (merchant ? merchant.icon + ' ' + esc(merchant.name) : '🧳 Thương Hội') + '</h3>' +
        '<span class="badge">' + (merchant ? esc(region.name || state.region) : 'Không có thương nhân hôm nay') + '</span></div>' +
      (merchant ?
        '<div class="merchant-quote" style="--mc:' + (merchant.color || '#ffd86b') + '">' + esc(merchant.name) + ': “' + esc(merchant.quote) + '”</div>' :
        '<div class="alert">Thương nhân sẽ ghé lại vào ngày mai. Hẹn gặp bạn ở các vùng khác!</div>') +
      '<p class="muted small">Hàng hiếm giá cao, nhưng ' + (merchant ? esc(merchant.title) : 'thương nhân') + ' trả giá tốt cho nguyên liệu ở vùng này. Mua rẻ ở vùng này, bán giá cao ở vùng khác để kiếm lời.</p>' +
      '<h4 class="mini-title">💎 Hàng hiếm</h4>' +
      (goods.length ? '<div class="shop-grid">' + goods.map(entry => {
        const left = Math.max(0, (entry.qty || 1) - (entry.sold || 0));
        return '<div class="shop-card' + (left <= 0 ? ' is-soldout' : '') + '">' +
          '<span class="shop-card__icon">' + merchantOfferLabel(entry).split(' ')[0] + '</span>' +
          '<strong>' + merchantOfferLabel(entry).split(' ').slice(1).join(' ') + '</strong>' +
          '<span class="pill pill--sm">' + (entry.kind === 'equipment' ? 'Trang bị' : entry.kind === 'trainer' ? 'Vật phẩm HLV' : entry.kind === 'material' ? 'Nguyên liệu' : 'Vật phẩm') + '</span>' +
          '<span class="muted small">Còn ' + left + '/' + (entry.qty || 1) + (entry.minLevel > 1 ? ' • Yêu cầu Lv.' + entry.minLevel : '') + '</span>' +
          '<span class="shop-card__price">🪙 ' + PG.fmt(entry.price) + '</span>' +
          (left > 0 ? '<button class="btn btn--gold btn--sm btn--block" data-act="merchant-buy" data-uid="' + entry.uid + '">Mua</button>' :
            '<button class="btn btn--ghost btn--sm btn--block" disabled>Đã bán hết</button>') +
          '</div>';
      }).join('') + '</div>' : '<p class="muted small">Thương nhân không có hàng phù hợp với cấp độ của bạn.</p>') +
      (trades.length ? '<div class="panel__divider"></div><h4 class="mini-title">🔁 Đổi nguyên liệu</h4><div class="shop-grid">' + trades.map(entry => {
        const left = Math.max(0, (entry.qty || 1) - (entry.sold || 0));
        return '<div class="shop-card' + (left <= 0 ? ' is-soldout' : '') + '">' +
          '<span class="shop-card__icon">🎁</span><strong>Giao dịch đặc biệt</strong>' +
          '<p class="muted small">Đưa: ' + merchantGiveHtml(entry.give) + '</p>' +
          '<p class="muted small">Nhận: ' + merchantOutHtml(entry.out) + '</p>' +
          (left > 0 ? '<button class="btn btn--primary btn--sm btn--block" data-act="merchant-trade" data-uid="' + entry.uid + '">Đổi</button>' :
            '<button class="btn btn--ghost btn--sm btn--block" disabled>Đã đổi</button>') +
          '</div>';
      }).join('') + '</div>' : '') +
      (requests.length ? '<div class="panel__divider"></div>' +
        '<h4 class="mini-title">📢 Đơn cần gấp — trả giá cao</h4>' +
        '<p class="muted small">' + esc((requests[0].note || 'Thương nhân cần nguyên liệu gấp, trả cao hơn chợ.')) + '</p>' +
        '<div class="shop-grid">' + requests.map(entry => {
          const info = PG.MATERIALS[entry.id];
          const left = Math.max(0, (entry.qty || 1) - (entry.sold || 0));
          const normal = PG.materialSellPrice(entry.id, state.region);
          return '<div class="shop-card merchant-request' + (left <= 0 ? ' is-soldout' : '') + '">' +
            '<span class="shop-card__icon">' + ui.itemIcon(entry.id, 'md') + '</span>' +
            '<strong>' + esc(info.name) + '</strong>' +
            '<span class="pill pill--sm pill--gold">Cao hơn ' + Math.round((entry.price / Math.max(1, normal) - 1) * 100) + '%</span>' +
            '<span class="muted small">Cần ' + left + '/' + (entry.qty || 1) + ' cái • bạn có ' + (state.materials[entry.id] || 0) + '</span>' +
            '<span class="shop-card__price">🪙 ' + PG.fmt(entry.price) + '/cái</span>' +
            (left > 0 ? '<span class="shop-card__buy">' +
              '<button class="btn btn--gold btn--sm" data-act="merchant-fulfill" data-uid="' + entry.uid + '" data-qty="1">Giao 1</button>' +
              '<button class="btn btn--ghost btn--sm" data-act="merchant-fulfill" data-uid="' + entry.uid + '" data-qty="' + Math.min(left, state.materials[entry.id] || 0) + '">Giao hết</button></span>' :
              '<button class="btn btn--ghost btn--sm btn--block" disabled>Đã giao đủ</button>') +
          '</div>';
        }).join('') + '</div>' : '') +
      '<div class="panel__divider"></div>' +
      '<h4 class="mini-title">🪨 Thu mua nguyên liệu</h4>' +
      (ownedMats.length ? '<div class="sell-grid">' + ownedMats.map(id => {
        const info = PG.MATERIALS[id];
        const price = PG.materialSellPrice(id, state.region);
        const wanted = !buys.length || buys.includes(id);
        return '<div class="sell-card">' + ui.itemIcon(id, 'md') +
          '<span class="sell-card__body"><strong>' + esc(info.name) + '</strong>' +
            '<small>x' + state.materials[id] + ' • ' + (wanted ? 'Thu mua ' + PG.fmt(price) + ' Xu/cái' : 'Không thu mua') + '</small></span>' +
          '<span class="sell-card__actions">' +
            '<button class="btn btn--ghost btn--sm" ' + (wanted ? 'data-act="merchant-sell-mat" data-id="' + id + '" data-qty="1"' : 'disabled') + '>Bán 1</button>' +
            '<button class="btn btn--ghost btn--sm" ' + (wanted ? 'data-act="merchant-sell-mat" data-id="' + id + '" data-qty="' + state.materials[id] + '"' : 'disabled') + '>Hết</button>' +
          '</span></div>';
      }).join('') + '</div>' : '<p class="muted small">Bạn không có nguyên liệu để bán.</p>') +
      '<p class="muted small">Lần ghé tiếp theo sau ' + timeLeft(data.nextAt || Date.now()) + '.</p>' +
    '</section>';
  }

  function marketRow(row) {
    if (row.source === 'npc') {
      const sp = PG.SPECIES[row.speciesId];
      if (!sp) return '';
      const rar = (PG.RARITY[sp.rarity] || PG.RARITY.common);
      return '<div class="market-row market-row--npc" style="--rc:' + rar.color + '">' +
        '<span class="market-row__sprite">' + ui.spriteHtml(sp, { size: 'sm' }) + '</span>' +
        '<span class="market-row__body"><strong>' + esc(sp.name) + '</strong>' +
          '<small>Lv.' + row.level + ' • IV tối thiểu ' + row.minIV + (row.shiny ? ' • ✨ Shiny' : '') + '</small>' +
          '<span class="market-source">🛍️ NPC</span>' +
          '<span class="pill pill--sm">' + esc(rar.name) + '</span>' +
        '</span>' +
        '<span class="market-row__price">🪙 ' + PG.fmt(row.price) + '</span>' +
        '<button class="btn btn--primary btn--sm" data-act="npc-buy" data-uid="' + row.uid + '">Mua</button>' +
      '</div>';
    }
    const p = row.pokemon;
    const sp = PG.SPECIES[p.speciesId];
    if (!sp) return '';
    return '<div class="market-row market-row--player">' +
      '<span class="market-row__sprite">' + ui.spriteHtml(p, { size: 'sm' }) + '</span>' +
      '<span class="market-row__body"><strong>' + esc(sp.name) + '</strong>' +
        '<small>Lv.' + p.level + ' • CP ' + PG.fmt(PG.cpOf(p)) + ' • ' + PG.qualityOf(p).name + '</small>' +
        '<small class="muted">Sẽ bán sau ~' + timeLeft(row.soldAt) + '</small>' +
        '<span class="market-source">🏷️ Người chơi</span>' +
      '</span>' +
      '<span class="market-row__price">🪙 ' + PG.fmt(row.price) + '</span>' +
      '<button class="btn btn--ghost btn--sm" data-act="market-cancel" data-uid="' + row.uid + '">Hủy</button>' +
    '</div>';
  }

  function marketPanel() {
    const state = st();
    const history = state.market.history || [];
    const rows = PG.getMarketListings ? PG.getMarketListings() : [];
    const npcCount = rows.filter(r => r.source === 'npc').length;
    const myCount = rows.filter(r => r.source === 'player').length;
    return '<div class="market-layout">' +
      '<section class="panel shop-main">' +
        '<div class="panel__head"><h3 class="panel__title">🏷️ Chợ Pokémon</h3>' +
          '<span class="badge">NPC ' + npcCount + ' • Bạn ' + myCount + '</span></div>' +
        '<p class="muted small">Chợ chung: nhà buôn “Công Tử Bạc” cập nhật hàng mỗi 20 phút (làm mới sau ' +
          timeLeft(state.npcShop.nextAt) + '), còn tin của bạn sẽ được NPC mua sau vài phút. Giá do người bán tự đặt; tin giá càng cao, NPC càng chần chừ hơn.</p>' +
        (rows.length ? '<div class="market-list">' + rows.map(marketRow).join('') + '</div>' :
          '<div class="empty-state empty-state--sm"><div class="empty-state__icon">🏷️</div><h3>Chợ đang trống</h3><p class="muted">Mở Kho Pokémon và chọn “Đăng bán” để treo Pokémon lên chợ.</p></div>') +
        '<div class="panel__divider"></div>' +
        '<button class="btn btn--ghost btn--sm" data-act="go" data-view="box">📦 Đăng bán Pokémon từ Kho</button>' +
      '</section>' +
      '<aside class="panel market-side">' +
        '<div class="panel__head"><h3 class="panel__title">Lịch Sử Bán</h3></div>' +
        (history.length ? history.map(h => '<div class="market-history"><span>' + esc(h.name) + '</span><b>+🪙 ' + PG.fmt(h.price) + '</b></div>').join('') :
          '<p class="muted small">Chưa bán được Pokémon nào qua chợ.</p>') +
        '<div class="panel__divider"></div>' +
        '<h4 class="mini-title">Giá tham khảo</h4>' +
        '<p class="muted small">Pokémon phổ biến: 150 – 2.000 Xu<br>Hiếm: 1.000 – 10.000 Xu<br>Huyền thoại: 10.000+ Xu<br>Shiny cộng thêm ~12.000 Xu.</p>' +
      '</aside>' +
    '</div>';
  }

  // Giữ lại hàm cũ làm alias cho các lời gọi cũ (ví dụ tab 'npc' từ save UI).
  function npcShopPanel() { return marketPanel(); }

  function sellPanel() {
    const state = st();
    const bagIds = Object.keys(state.bag).filter(id => {
      const info = PG.itemInfo(id);
      return (state.bag[id] || 0) > 0 && info.kind !== 'key' && info.kind !== 'misc' && info.price > 0;
    });
    const matIds = Object.keys(state.materials).filter(id => (state.materials[id] || 0) > 0 && PG.MATERIALS[id]);
    return '<div class="sell-layout">' +
      '<section class="panel shop-main">' +
        '<div class="panel__head"><h3 class="panel__title">🎒 Bán Vật Phẩm</h3><span class="muted small">Giá bằng 50% giá gốc</span></div>' +
        (bagIds.length ? '<div class="sell-grid">' + bagIds.map(id => {
          const info = PG.itemInfo(id);
          const price = Math.max(1, Math.round((info.price || 0) * 0.5));
          return '<div class="sell-card">' + ui.itemIcon(id, 'md') +
            '<span class="sell-card__body"><strong>' + esc(info.name) + '</strong><small>x' + state.bag[id] + ' • Bán được ' + PG.fmt(price) + ' Xu/cái</small></span>' +
            '<span class="sell-card__actions">' +
              '<button class="btn btn--ghost btn--sm" data-act="sell-bag" data-id="' + id + '" data-qty="1">Bán 1</button>' +
              '<button class="btn btn--ghost btn--sm" data-act="sell-bag" data-id="' + id + '" data-qty="' + state.bag[id] + '">Hết</button>' +
            '</span></div>';
        }).join('') + '</div>' : '<p class="muted">Túi không có vật phẩm nào có thể bán.</p>') +
        (state.bag['bag-upgrade'] ? '<div class="panel__divider"></div><div class="upgrade-line"><div><strong>🎒 Nâng Cấp Túi</strong><small>Bạn có ' + state.bag['bag-upgrade'] + ' vật phẩm. Dùng để +50 sức chứa.</small></div><button class="btn btn--primary btn--sm" data-act="use-bag-upgrade">Sử dụng</button></div>' : '') +
      '</section>' +
      '<section class="panel shop-main">' +
        '<div class="panel__head"><h3 class="panel__title">🪨 Bán Nguyên Liệu</h3><span class="muted small">Giá bằng 60% giá gốc</span></div>' +
        (matIds.length ? '<div class="sell-grid">' + matIds.map(id => {
          const info = PG.MATERIALS[id];
          const price = PG.materialSellPrice ? PG.materialSellPrice(id, state.region) : Math.max(1, Math.round((info.price || 10) * 0.6));
          return '<div class="sell-card">' + ui.itemIcon(id, 'md') +
            '<span class="sell-card__body"><strong>' + esc(info.name) + '</strong><small>x' + state.materials[id] + ' • Bán được ' + PG.fmt(price) + ' Xu/cái</small></span>' +
            '<span class="sell-card__actions">' +
              '<button class="btn btn--ghost btn--sm" data-act="sell-mat" data-id="' + id + '" data-qty="1">Bán 1</button>' +
              '<button class="btn btn--ghost btn--sm" data-act="sell-mat" data-id="' + id + '" data-qty="' + state.materials[id] + '">Hết</button>' +
            '</span></div>';
        }).join('') + '</div>' : '<p class="muted">Chưa có nguyên liệu nào.</p>') +
      '</section>' +
    '</div>';
  }

  ui.views.shop = function () {
    const state = st();
    return '<div class="shop-page">' +
      '<div class="page-head">' +
        '<div><p class="eyebrow">Kinh tế • Giao thương</p><h1>🛒 Chợ Pokémon</h1>' +
          '<p class="muted">Mua bán vật phẩm, săn trang bị may mắn và treo Pokémon lên chợ.</p></div>' +
        '<div class="page-wallet">' +
          '<span class="pill pill--gold">🪙 ' + PG.fmt(state.player.coins) + ' Xu</span>' +
          '<span class="pill">✨ ' + PG.fmt(state.player.stardust) + ' Bụi Sao</span>' +
          '<span class="pill">💎 ' + PG.fmt(state.player.diamonds) + '</span>' +
        '</div>' +
      '</div>' +
      tabsHtml() +
      (tab() === 'daily' ? dailyPanel() : tab() === 'gift' ? giftPanel() : tab() === 'items' ? catalogPanel() : tab() === 'trainer' ? trainerShopPanel() : tab() === 'market' ? marketPanel() : tab() === 'merchant' ? merchantPanel() : sellPanel()) +
    '</div>';
  };

  /* ---------------- ACTIONS ---------------- */
  ui.actions['shop-tab'] = function (el) {
    ui.flow.shopTab = el.dataset.tab;
    ui.render();
  };

  ui.actions['go-egg-shop'] = function () {
    ui.flow.shopTab = 'items';
    ui.go('shop');
  };

  ui.actions['buy-egg'] = function () {
    const res = PG.buyEgg();
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('buy'); ui.refreshTopbar(); ui.render(); }
    else PG.Audio.play('error');
  };

  ui.actions['shop-buy'] = function (el) {
    const res = PG.buyShopItem(el.dataset.uid, Number(el.dataset.qty) || 1);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('buy'); ui.refreshTopbar(); ui.render(); }
    else PG.Audio.play('error');
  };

  ui.actions['gift-buy'] = function (el) {
    const res = PG.buyGiftBox(el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (!res.ok) { PG.Audio.play('error'); return; }
    PG.Audio.play('reward');
    ui.refreshTopbar();
    ui.render();
    const info = res.dealInfo;
    const pct = Math.round((res.ratio - 1) * 100);
    ui.modal({
      title: '🎁 Mở Hộp Quà!',
      body: '<div class="reward-reveal gift-reveal">' +
        '<div class="reward-reveal__icon">🎁</div>' +
        '<h3 class="gift-deal--' + res.deal + '">' + info.icon + ' ' + esc(info.name) + '</h3>' +
        '<div class="reward-reveal__stats">' + res.lines.map(x => '<span class="pill pill--gold">' + esc(x) + '</span>').join('') + '</div>' +
        '<div class="gift-value">Giá hộp <b>🪙 ' + PG.fmt(res.price) + '</b> → Giá trị nhận <b>🪙 ' + PG.fmt(res.value) + '</b> ' +
          '<span class="pill pill--sm ' + (pct >= 0 ? 'pill--gold' : '') + '">' + (pct >= 0 ? '+' : '') + pct + '%</span></div>' +
        '<p class="muted small">May mắn từ trang bị HLV làm tăng tỉ lệ hộp lời.</p></div>',
      footer: '<button class="btn btn--primary" data-act="close-modal">Tuyệt vời!</button>',
      size: 'sm'
    });
  };

  ui.actions['catalog-buy'] = function (el) {
    const res = PG.buyCatalogItem(el.dataset.id, Number(el.dataset.qty) || 1);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('buy'); ui.refreshTopbar(); ui.render(); }
    else PG.Audio.play('error');
  };

  ui.actions['trainer-shop-buy'] = function (el) {
    const res = PG.buyTrainerItem(el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (!res.ok) { PG.Audio.play('error'); return; }
    PG.Audio.play('shiny');
    ui.refreshTopbar();
    ui.render();
    const rarity = PG.RARITY[res.item.rarity] || PG.RARITY.common;
    ui.modal({
      title: '🎖️ Đã gắn vật phẩm!',
      body: '<div class="reward-reveal">' +
        '<div class="reward-reveal__icon">' + res.item.icon + '</div>' +
        '<h3 style="color:' + rarity.color + '">' + esc(res.item.name) + '</h3>' +
        '<div class="reward-reveal__stats">' + statChips(res.item.stats) + '</div>' +
        '<p class="muted small">Đã cộng vĩnh viễn vào chỉ số Huấn luyện viên. Mua thêm để tăng tiếp, không giới hạn!</p></div>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Đóng</button><button class="btn btn--primary" data-act="go" data-view="profile">Xem Chỉ Số</button>',
      size: 'sm'
    });
  };

  function merchantRewardModal(res) {
    if (!res || !res.rewards || !res.rewards.length || !(res.equipment || res.trainerItem || res.trade)) return;
    ui.modal({
      title: '🎁 Giao dịch thành công!',
      body: '<div class="reward-reveal"><div class="reward-reveal__icon">🧳</div>' +
        '<h3>' + esc(res.msg) + '</h3>' +
        '<div class="reward-reveal__stats">' + res.rewards.map(x => '<span class="pill pill--gold">' + esc(x) + '</span>').join('') + '</div></div>',
      footer: '<button class="btn btn--primary" data-act="close-modal">Tuyệt vời</button>',
      size: 'sm'
    });
  }

  ui.actions['merchant-buy'] = function (el) {
    const res = PG.buyMerchantOffer(el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (!res.ok) { PG.Audio.play('error'); return; }
    PG.Audio.play(res.equipment || res.trainerItem ? 'shiny' : 'buy');
    ui.refreshTopbar();
    ui.render();
    merchantRewardModal(res);
  };

  ui.actions['merchant-sell-mat'] = function (el) {
    const res = PG.sellMaterialToMerchant(el.dataset.id, Number(el.dataset.qty) || 1);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('coin'); ui.refreshTopbar(); ui.render(); }
    else PG.Audio.play('error');
  };

  ui.actions['merchant-fulfill'] = function (el) {
    const res = PG.fulfillMerchantRequest(el.dataset.uid, Number(el.dataset.qty) || 1);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('coin'); ui.refreshTopbar(); ui.render(); }
    else PG.Audio.play('error');
  };

  ui.actions['merchant-trade'] = function (el) {
    const res = PG.tradeWithMerchant(el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (!res.ok) { PG.Audio.play('error'); return; }
    PG.Audio.play('reward');
    ui.refreshTopbar();
    ui.render();
    merchantRewardModal(res);
  };

  ui.actions['npc-buy'] = function (el) {
    const res = PG.buyNpcPokemon(el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (!res.ok) { PG.Audio.play('error'); return; }
    const p = res.pokemon;
    const sp = PG.SPECIES[p.speciesId];
    PG.Audio.play(p.shiny || sp.rarity === 'legendary' ? 'shiny' : 'reward');
    ui.refreshTopbar();
    ui.render();
    ui.modal({
      title: '🛍️ Chào sân!',
      body: '<div class="reward-reveal">' +
        '<div class="reward-reveal__icon">' + ui.spriteHtml(p, { size: 'lg' }) + '</div>' +
        '<h3>' + esc(sp.name) + (p.shiny ? ' ✨' : '') + '</h3>' +
        '<div>' + ui.typeChips(sp.types) + '</div>' +
        '<p class="muted">Lv.' + p.level + ' • ' + PG.qualityOf(p).name + ' • CP ' + PG.fmt(PG.cpOf(p)) + '</p>' +
        '<p class="muted small">Đã thêm vào Kho Pokémon' + (st().team.includes(p.uid) ? ' và đội' : '') + '.</p></div>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Đóng</button><button class="btn btn--primary" data-act="open-pokemon" data-uid="' + p.uid + '">Xem Pokémon</button>',
      size: 'sm'
    });
  };

  ui.actions['market-buy-npc'] = function (el) { ui.actions['npc-buy'](el); };

  ui.actions['market-cancel'] = function (el) {
    const res = PG.cancelListing(el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) ui.render();
  };

  ui.actions['sell-bag'] = function (el) {
    const res = PG.sellBagItem(el.dataset.id, Number(el.dataset.qty) || 1);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('coin'); ui.refreshTopbar(); ui.render(); }
  };

  ui.actions['sell-mat'] = function (el) {
    const res = PG.sellMaterial(el.dataset.id, Number(el.dataset.qty) || 1);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('coin'); ui.refreshTopbar(); ui.render(); }
  };

  ui.actions['use-bag-upgrade'] = function () {
    const res = PG.useBagUpgrade();
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) ui.render();
  };
})();
