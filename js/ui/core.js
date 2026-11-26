/* ============================================================
   UI LÕI: routing, topbar, modal, toast, component dùng chung
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui = PG.ui || {};

  ui.views = {};
  ui.mounted = {};
  ui.actions = {};
  ui.changes = {};
  ui.current = 'home';
  ui.params = {};
  ui.flow = { encounter: null, battle: null, busy: false, fish: null, catchBusy: false };
  ui.modalStack = [];
  ui.ready = false;

  const NAV = [
    { id: 'home', label: 'Bản Đồ', icon: '🗺️' },
    { id: 'box', label: 'Kho Pokémon', icon: '📦' },
    { id: 'bag', label: 'Túi Đồ', icon: '🎒' },
    { id: 'battle', label: 'Đấu Trường', icon: '⚔️' },
    { id: 'trainerzone', label: 'Khu HLV', icon: '🎖️' },
    { id: 'tournament', label: 'Giải Đấu', icon: '🏆' },
    { id: 'fish', label: 'Câu Cá', icon: '🎣' },
    { id: 'fossil', label: 'Hóa Thạch', icon: '🦴' },
    { id: 'idle', label: 'Bẫy & Trại', icon: '🪤' },
    { id: 'shop', label: 'Chợ', icon: '🛒' },
    { id: 'equip', label: 'Trang Bị', icon: '🧥' },
    { id: 'craft', label: 'Chế Tạo', icon: '🛠️' },
    { id: 'research', label: 'Nghiên Cứu', icon: '🔬' },
    { id: 'dex', label: 'Pokédex', icon: '📕' },
    { id: 'quests', label: 'Nhiệm Vụ', icon: '📋' },
    { id: 'profile', label: 'Hồ Sơ', icon: '👤' }
  ];
  const MOBILE_MAIN = ['home', 'box', 'battle', 'fish'];
  const MOBILE_MORE = ['bag', 'tournament', 'trainerzone', 'fossil', 'idle', 'shop', 'equip', 'craft', 'research', 'dex', 'quests', 'profile'];
  ui.NAV = NAV;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return PG.esc(s); }

  /* ---------------- TOPBAR / NAV ---------------- */
  function resourceHtml(id, icon, value, label, tone) {
    return '<div class="resource resource--' + (tone || 'default') + '" title="' + esc(label) + '">' +
      '<span class="resource__icon">' + icon + '</span>' +
      '<span class="resource__value" id="' + id + '">' + value + '</span></div>';
  }

  function topbarHtml() {
    const st = PG.getState();
    const p = st.player;
    const prog = PG.playerLevelProgress(st);
    const staminaPct = Math.round((p.stamina / PG.staminaMax()) * 100);
    return '<div class="topbar__left">' +
      '<button class="icon-btn topbar__menu" data-act="open-more" aria-label="Mở menu">☰</button>' +
      '<div class="trainer-chip">' +
        '<div class="avatar avatar--sm">' + p.avatar + '</div>' +
        '<div class="trainer-chip__info">' +
          '<div class="trainer-chip__name">' + esc(p.name) + '</div>' +
          '<div class="trainer-chip__lv">Cấp ' + p.level + ' <span class="trainer-chip__xp">' + PG.fmt(p.xp) + '/' + PG.fmt(prog.need) + ' XP</span></div>' +
          '<div class="mini-bar mini-bar--xp"><span style="width:' + (prog.pct * 100) + '%"></span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="topbar__right">' +
      resourceHtml('res-coins', '🪙', PG.fmt(p.coins), 'Xu', 'gold') +
      resourceHtml('res-stardust', '✨', PG.fmt(p.stardust), 'Bụi Sao', 'teal') +
      resourceHtml('res-diamonds', '💎', PG.fmt(p.diamonds), 'Kim Cương', 'violet') +
      '<div class="resource resource--stamina" title="Thể lực">' +
        '<span class="resource__icon">⚡</span>' +
        '<span class="resource__value"><span id="res-stamina">' + p.stamina + '</span><span class="resource__sub">/' + PG.staminaMax() + '</span></span>' +
        '<div class="stamina-ring" style="--p:' + staminaPct + '%"><span></span></div>' +
      '</div>' +
      '<button class="icon-btn" data-act="toggle-sound" id="btn-sound" aria-label="Âm thanh">' + (st.settings.sound ? '🔊' : '🔇') + '</button>' +
    '</div>';
  }

  function sidebarHtml() {
    let nav = '';
    for (const item of NAV) {
      nav += '<button class="nav-item" data-act="go" data-view="' + item.id + '" data-nav="' + item.id + '">' +
        '<span class="nav-item__icon">' + item.icon + '</span><span class="nav-item__label">' + item.label + '</span>' +
        '<span class="nav-item__dot"></span></button>';
    }
    const st = PG.getState();
    return '<div class="brand">' +
        '<div class="brand__orb">⚡</div>' +
        '<div class="brand__text"><strong>BẮT</strong><span>POKÉMON</span></div>' +
      '</div>' +
      '<div class="sidebar__sub">Sưu tầm • Chiến đấu</div>' +
      '<nav class="nav">' + nav + '</nav>' +
      '<div class="sidebar__foot">' +
        '<div class="sidebar__badges">' + (st.badges.length ? st.badges.map(id => PG.REGIONS[id] ? '<span title="' + esc(PG.REGIONS[id].gym.badge) + '">' + PG.REGIONS[id].gym.badgeIcon + '</span>' : '').join('') : '<span class="muted">Chưa có huy hiệu</span>') + '</div>' +
        '<div class="sidebar__hint">Dữ liệu tự lưu trên máy</div>' +
      '</div>';
  }

  function bottomNavHtml() {
    let html = '';
    for (const id of MOBILE_MAIN) {
      const item = NAV.find(n => n.id === id);
      html += '<button class="bottom-nav__item" data-act="go" data-view="' + id + '" data-nav="' + id + '">' +
        '<span>' + item.icon + '</span><small>' + item.label + '</small></button>';
    }
    html += '<button class="bottom-nav__item" data-act="open-more"><span>⋯</span><small>Thêm</small></button>';
    return html;
  }

  function refreshTopbar() {
    if (!ui.ready) return;
    const st = PG.getState();
    const p = st.player;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('res-coins', PG.fmt(p.coins));
    set('res-stardust', PG.fmt(p.stardust));
    set('res-diamonds', PG.fmt(p.diamonds));
    set('res-stamina', p.stamina);
    const maxEl = document.querySelector('.resource--stamina .resource__sub');
    if (maxEl) maxEl.textContent = '/' + PG.staminaMax();
    const ring = document.querySelector('.stamina-ring');
    if (ring) ring.style.setProperty('--p', Math.round((p.stamina / PG.staminaMax()) * 100) + '%');
    const sound = document.getElementById('btn-sound');
    if (sound) sound.textContent = st.settings.sound ? '🔊' : '🔇';
    const name = document.querySelector('.trainer-chip__name');
    if (name) name.textContent = p.name;
    const lv = document.querySelector('.trainer-chip__lv');
    if (lv) {
      const prog = PG.playerLevelProgress(st);
      lv.innerHTML = 'Cấp ' + p.level + ' <span class="trainer-chip__xp">' + PG.fmt(p.xp) + '/' + PG.fmt(prog.need) + ' XP</span>';
      const bar = document.querySelector('.mini-bar--xp span');
      if (bar) bar.style.width = (prog.pct * 100) + '%';
    }
  }

  function updateNav() {
    for (const el of $all('[data-nav]')) {
      const on = el.dataset.nav === ui.current || (ui.current === 'catch' && el.dataset.nav === 'home');
      el.classList.toggle('is-active', on);
    }
    const title = document.getElementById('view-title');
    if (title) {
      const item = NAV.find(n => n.id === ui.current);
      title.textContent = item ? item.label : (ui.current === 'catch' ? 'Bắt Pokémon' : ui.current === 'battle' ? 'Trận Đấu' : 'Bắt Pokémon');
    }
  }

  /* ---------------- SPRITE ---------------- */
  function speciesOf(p) {
    if (!p) return null;
    if (p.speciesId) return PG.SPECIES[p.speciesId];
    if (p.id && PG.SPECIES[p.id]) return PG.SPECIES[p.id];
    return null;
  }
  /** Dạng hiếm tỏa aura: devil > rainbow (devil hiếm hơn nên được ưu tiên). */
  function auraClassOf(p) {
    const list = (p && p.mutations) || [];
    if (list.indexOf('devil') >= 0) return 'aura-devil';
    if (list.indexOf('rainbow') >= 0) return 'aura-rainbow';
    return '';
  }
  ui.auraClassOf = auraClassOf;

  function spriteHtml(p, opts) {
    const o = opts || {};
    const sp = speciesOf(p);
    if (!sp) return '<span class="sprite-emoji">❓</span>';
    const shiny = o.shiny !== undefined ? o.shiny : !!(p && p.shiny);
    const cls = ['sprite-box'];
    if (o.size) cls.push('sprite-box--' + o.size);
    if (shiny) cls.push('is-shiny');
    const aura = auraClassOf(p);
    if (aura) cls.push(aura);
    if (o.cls) cls.push(o.cls);
    // Loài fan-made/crossover có ảnh thật (ánh xạ artwork), gắn mốc nhỏ để dễ nhận.
    if (sp.dex >= 8800 && (PG.fanSpriteOverride && PG.fanSpriteOverride(sp) || (PG.FAN_SPRITE_IDS && PG.FAN_SPRITE_IDS[sp.dex]))) cls.push('is-fan');
    // Crossover dùng art gốc của game/phim, trình bày riêng — không giống sprite Pokémon.
    const isCross = /^cross-/.test(sp.id || '');
    if (isCross) cls.push('is-crossover');
    const src = PG.spriteUrl(sp, shiny);
    const emoji = (PG.TYPES[sp.types[0]] || { icon: '🐾' }).icon;
    return '<span class="' + cls.join(' ') + '" data-species="' + sp.id + '">' +
      '<img class="sprite" src="' + src + '" alt="' + esc(sp.name) + '" loading="lazy" draggable="false" ' +
      'onerror="PG.ui.spriteError(this)" data-emoji="' + emoji + '">' +
      '<span class="sprite-emoji" aria-hidden="true">' + emoji + '</span>' +
      (o.badges ? '<span class="sprite-box__badges">' + o.badges + '</span>' : '') +
      '</span>';
  }
  ui.spriteError = function (img) {
    const box = img.closest('.sprite-box');
    const sp = box ? PG.SPECIES[box.dataset.species] : null;
    if (!img.dataset.fallback && sp) {
      img.dataset.fallback = '1';
      img.src = PG.spriteFallback(sp);
      return;
    }
    img.style.display = 'none';
    if (box) box.classList.add('sprite-box--fallback');
  };

  function typeChips(types, small) {
    return '<span class="type-chips">' + (types || []).map(t => PG.typeChip(t, small)).join('') + '</span>';
  }

  function mutationBadges(p) {
    if (!p || !p.mutations || !p.mutations.length) return '';
    return '<span class="mutation-badges">' + p.mutations.map(m => {
      const def = PG.MUTATIONS[m];
      if (!def) return '';
      return '<span class="mutation-badge" style="--mc:' + def.color + '" title="' + esc(def.desc) + '">' + def.badge + ' ' + def.name + '</span>';
    }).join('') + '</span>';
  }

  function stars(n) {
    let out = '';
    for (let i = 0; i < 4; i++) out += '<span class="star' + (i < n ? ' on' : '') + '">★</span>';
    return '<span class="stars">' + out + '</span>';
  }

  function bar(value, max, cls) {
    const pct = max > 0 ? PG.clamp(value / max, 0, 1) * 100 : 0;
    return '<div class="bar ' + (cls || '') + '"><span style="width:' + pct + '%"></span></div>';
  }

  /** Bảng chỉ số Huấn luyện viên — giá trị không bị giới hạn. */
  function trainerStatsHtml(totals, compact) {
    const meta = PG.TRAINER_STAT_META || {};
    const keys = compact
      ? ['hp', 'atk', 'def', 'spa', 'spd', 'spe', 'luck', 'crit', 'dodge', 'accuracy']
      : Object.keys(meta);
    return '<div class="trainer-stats' + (compact ? ' trainer-stats--compact' : '') + '">' +
      keys.map(k => {
        const m = meta[k] || { name: k, icon: '•', suffix: '' };
        const value = (totals && totals[k]) || 0;
        return '<div class="trainer-stat"><span>' + m.icon + '</span><div><small>' + esc(m.name) + '</small><b>' + PG.fmt(value) + m.suffix + '</b></div></div>';
      }).join('') + '</div>';
  }

  /** Poké Ball kiểu anime: nửa đỏ/xanh trên, nửa trắng dưới, dải đen, nút giữa. */
  function ballArt(id, size) {
    const info = PG.BALLS[id] || PG.BALLS.pokeball;
    const theme = id && PG.BALLS[id] ? id : 'pokeball';
    return '<span class="ball-art ball-art--' + theme + (size ? ' ball-art--' + size : '') + '"' +
      ' style="--ball-accent:' + (info.color || '#e74c3c') + '" title="' + esc(info.name) + '" aria-label="' + esc(info.name) + '">' +
      '<span class="ball-art__top"></span><span class="ball-art__bottom"></span>' +
      '<span class="ball-art__band"></span><span class="ball-art__button"></span></span>';
  }

  function itemIcon(id, size) {
    const info = PG.itemInfo(id);
    if (info.kind === 'ball') return ballArt(id, size === 'sm' ? 'xs' : size === 'lg' ? 'lg' : 'sm');
    return '<span class="item-icon item-icon--' + (size || 'md') + '" style="--ic:' + (info.color || '#888') + '" title="' + esc(info.name) + '">' + (info.icon || '❓') + '</span>';
  }

  function itemName(id) {
    return PG.itemInfo(id).name;
  }

  function statusBadge(status) {
    if (!status) return '';
    const info = PG.STATUS_INFO[status] || { name: status, icon: '❔', color: '#94a3b8' };
    return '<span class="status-badge" style="--sc:' + info.color + '">' + info.icon + ' ' + info.name + '</span>';
  }

  function cardVars(sp) {
    const t1 = PG.TYPES[sp.types[0]] || PG.TYPES.normal;
    const t2 = PG.TYPES[sp.types[1] || sp.types[0]] || t1;
    const rc = sp.rarity === 'legendary' ? '#ffd166' : sp.rarity === 'rare' ? '#6d8cff' : '#94a3b8';
    return '--t1:' + t1.color + ';--t2:' + t2.color + ';--rc:' + rc;
  }

  function pokeCard(p, opts) {
    const o = opts || {};
    const sp = PG.SPECIES[p.speciesId];
    if (!sp) return '';
    const q = PG.qualityOf(p);
    const inTeam = PG.getState().team.includes(p.uid);
    const isBuddy = PG.getState().buddy === p.uid;
    const aura = auraClassOf(p);
    return '<button class="poke-card rarity-' + sp.rarity + (sp.mythical ? ' is-mythical' : '') + (/^cross-/.test(sp.id) ? ' is-crossover' : '') +
      (p.shiny ? ' is-shiny' : '') + (aura ? ' ' + aura : '') + (o.selected ? ' is-selected' : '') +
      '" style="' + cardVars(sp) + '" data-act="open-pokemon" data-uid="' + p.uid + '">' +
      '<span class="poke-card__top">' +
        '<span class="dex-no">#' + String(sp.dex).padStart(3, '0') + '</span>' +
        '<span class="poke-card__flags">' + (isBuddy ? '🧭' : '') + (inTeam ? '⚔️' : '') + (p.favorite ? '❤️' : '') + '</span>' +
      '</span>' +
      '<span class="poke-card__sprite">' + spriteHtml(p, { badges: p.shiny ? '✨' : '' }) + '</span>' +
      '<span class="poke-card__name">' + esc(sp.name) + '</span>' +
      '<span class="poke-card__sub">Lv.' + p.level + ' • CP ' + PG.fmt(PG.cpOf(p)) + ' • ' + stars(q.stars) + '</span>' +
      '<span class="poke-card__types">' + typeChips(sp.types, true) + '</span>' +
      ((p.mutations || []).length ? '<span class="poke-card__mut">' + p.mutations.map(m => PG.MUTATIONS[m] ? PG.MUTATIONS[m].badge : '').join(' ') + '</span>' : '') +
      '</button>';
  }

  /* ---------------- MODAL / TOAST ---------------- */
  function modal(opts) {
    const o = opts || {};
    const root = document.getElementById('modal-root');
    if (!root) return;
    const panel = document.createElement('div');
    panel.className = 'modal__panel modal__panel--' + (o.size || 'md');
    panel.innerHTML =
      '<div class="modal__head">' +
        '<div><h2 class="modal__title">' + (o.title || '') + '</h2>' +
        (o.subtitle ? '<p class="modal__subtitle">' + o.subtitle + '</p>' : '') + '</div>' +
        (o.closable === false ? '' : '<button class="icon-btn" data-act="close-modal" aria-label="Đóng">✕</button>') +
      '</div>' +
      '<div class="modal__body">' + (o.body || '') + '</div>' +
      (o.footer ? '<div class="modal__foot">' + o.footer + '</div>' : '');
    root.innerHTML = '';
    const backdrop = document.createElement('div');
    backdrop.className = 'modal__backdrop';
    backdrop.appendChild(panel);
    root.appendChild(backdrop);
    document.body.classList.add('modal-open');
    // Escape/backdrop không được đóng modal kết quả bắt (phải bấm nút hợp lệ).
    ui.modalLocked = o.closable === false;
    if (o.closable !== false) {
      backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
    }
    PG.Audio.play('open');
    if (o.onMount) o.onMount(panel);
    return panel;
  }

  function clearModal() {
    const root = document.getElementById('modal-root');
    if (root && root.innerHTML) root.innerHTML = '';
    document.body.classList.remove('modal-open');
    ui.modalStack = [];
    ui.modalLocked = false;
  }

  function closeModal() {
    clearModal();
    PG.Audio.play('close');
  }

  function confirmDialog(title, text, onYes, opts) {
    const o = opts || {};
    const id = 'cf' + Date.now() + Math.floor(Math.random() * 999);
    ui.actions['confirm-' + id] = function () {
      closeModal();
      delete ui.actions['confirm-' + id];
      onYes();
    };
    modal({
      title,
      body: '<p class="confirm-text">' + text + '</p>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">' + (o.cancelText || 'Hủy') + '</button>' +
        '<button class="btn ' + (o.danger ? 'btn--danger' : 'btn--primary') + '" data-act="confirm-' + id + '">' + (o.okText || 'Đồng ý') + '</button>',
      size: 'sm'
    });
  }

  function toast(msg, type, ms) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'info');
    const icons = { success: '✅', error: '⛔', info: 'ℹ️', warn: '⚠️', gold: '✨' };
    el.innerHTML = '<span class="toast__icon">' + (icons[type] || 'ℹ️') + '</span><span class="toast__text">' + esc(msg) + '</span>';
    root.appendChild(el);
    while (root.children.length > 4) root.removeChild(root.firstChild);
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 320); }, ms || 3000);
  }

  /* ---------------- ROUTING ---------------- */
  function go(view, params) {
    ui.params = params || {};
    if (ui.current === view) {
      render({ resetScroll: true });
      return;
    }
    ui.current = view;
    if (location.hash !== '#/' + view) {
      history.replaceState(null, '', '#/' + view);
    }
    render({ resetScroll: true });
  }

  function render(opts) {
    if (!ui.ready) return;
    // Mặc định render tại chỗ (toast, nhận quà, lọc...) giữ nguyên vị trí cuộn.
    // Chỉ chuyển màn hình thật (go/hashchange/boot) mới truyền resetScroll.
    const resetScroll = !!(opts && opts.resetScroll);
    const keepScroll = !(opts && opts.keepScroll === false) && !resetScroll;
    const savedScroll = keepScroll && typeof window.scrollY === 'number' ? window.scrollY : 0;
    const st = PG.getState();
    if (!st) return;
    // Mọi lần đổi màn hình đều đóng modal cũ: không còn cảnh bấm xong
    // phải tự đóng modal thì nội dung mới hiện ra.
    clearModal();
    PG.ensureDaily(true);
    PG.ensureTrainerShop(true);
    if (PG.ensureGiftBoxShop) PG.ensureGiftBoxShop(true);
    if (PG.ensureTrainerZone) PG.ensureTrainerZone(true);
    PG.ensureNpcShop(true);
    if (PG.ensureMerchant) PG.ensureMerchant(true);
    PG.processMarket(true);
    PG.tickStamina(true);
    const viewFn = ui.views[ui.current];
    if (!viewFn) { ui.current = 'home'; }
    const host = document.getElementById('view');
    if (!host) return;
    const html = (ui.views[ui.current] || ui.views.home)(ui.params || {});
    host.innerHTML = html;
    host.className = 'view view--' + ui.current;
    updateNav();
    refreshTopbar();
    if (keepScroll) {
      // Render tại chỗ: giữ nguyên vị trí cuộn, không kéo lên đầu trang.
      const root = document.documentElement;
      const previous = root && root.style ? root.style.scrollBehavior : '';
      if (root && root.style) root.style.scrollBehavior = 'auto';
      window.scrollTo(0, savedScroll);
      if (root && root.style) root.style.scrollBehavior = previous;
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const mount = ui.mounted[ui.current];
    if (mount) {
      try { mount(host); } catch (e) { console.error('Mount lỗi', e); }
    }
    ui.modalStack = [];
    if (PG.Audio && st.settings.sound) PG.Audio.play('open');
  }

  function openMore() {
    const items = MOBILE_MORE.map(id => {
      const item = NAV.find(n => n.id === id);
      return '<button class="more-tile" data-act="go" data-view="' + id + '"><span>' + item.icon + '</span><strong>' + item.label + '</strong></button>';
    }).join('');
    modal({
      title: 'Danh Mục',
      subtitle: 'Chọn màn hình bạn muốn mở',
      body: '<div class="more-grid">' + items + '</div>' +
        '<div class="more-extra">' +
          '<button class="btn btn--ghost btn--block" data-act="save">💾 Lưu game</button>' +
          '<button class="btn btn--ghost btn--block" data-act="heal-team">🏥 Hồi phục đội</button>' +
        '</div>',
      size: 'sm'
    });
  }

  /* ---------------- ACTION CHUNG ---------------- */
  ui.actions['go'] = function (el) { go(el.dataset.view); };
  ui.actions['close-modal'] = closeModal;
  ui.actions['open-more'] = openMore;
  ui.actions['toggle-sound'] = function () {
    const st = PG.getState();
    PG.Audio.setEnabled(!st.settings.sound);
    refreshTopbar();
    toast(st.settings.sound ? 'Đã bật âm thanh' : 'Đã tắt âm thanh', 'info');
  };
  ui.actions['save'] = function () {
    if (PG.saveState()) toast('Đã lưu tiến trình!', 'success');
    closeModal();
  };
  ui.actions['heal-team'] = function () {
    const r = PG.Battle.healTeam();
    refreshTopbar();
    toast(r.msg, r.ok ? 'success' : 'error');
    render();
  };
  ui.actions['claim-login'] = function () {
    const r = PG.claimLogin();
    toast(r.msg, r.ok ? 'success' : 'error');
    if (r.ok) PG.Audio.play('reward');
    render();
  };
  ui.actions['choose-starter'] = function (el) {
    const r = PG.chooseStarter(el.dataset.id);
    if (!r.ok) { toast(r.msg || 'Không thể chọn.', 'error'); return; }
    closeModal();
    PG.Audio.play('reward');
    toast('Chào mừng ' + PG.SPECIES[r.pokemon.speciesId].name + '!', 'success');
    ui.ready = true;
    go('home');
  };

  ui.showStarter = function () {
    const cards = PG.STARTERS.map(id => {
      const sp = PG.SPECIES[id];
      return '<button class="starter-card" data-act="choose-starter" data-id="' + id + '">' +
        '<span class="starter-card__sprite">' + spriteHtml(sp, { size: 'lg' }) + '</span>' +
        '<strong>' + sp.name + '</strong>' +
        '<span class="starter-card__types">' + typeChips(sp.types) + '</span>' +
        '<span class="starter-card__desc">' + esc(sp.desc) + '</span>' +
        '</button>';
    }).join('');
    modal({
      title: 'Chọn Pokémon Đồng Hành',
      subtitle: 'Mỗi hành trình bắt đầu từ một người bạn. Hãy chọn thật kỹ!',
      body: '<div class="starter-grid">' + cards + '</div>',
      size: 'lg', closable: false
    });
  };

  /* ---------------- TIỆN ÍCH UI ---------------- */
  ui.$ = $;
  ui.$all = $all;
  ui.esc = esc;
  ui.topbarHtml = topbarHtml;
  ui.sidebarHtml = sidebarHtml;
  ui.bottomNavHtml = bottomNavHtml;
  ui.refreshTopbar = refreshTopbar;
  ui.updateNav = updateNav;
  ui.go = go;
  ui.render = render;
  ui.modal = modal;
  ui.closeModal = closeModal;
  ui.clearModal = clearModal;
  ui.confirm = confirmDialog;
  ui.toast = toast;
  ui.spriteHtml = spriteHtml;
  ui.sprite = spriteHtml;
  ui.cardVars = cardVars;
  ui.typeChips = typeChips;
  ui.mutationBadges = mutationBadges;
  ui.stars = stars;
  ui.bar = bar;
  ui.itemIcon = itemIcon;
  ui.ballArt = ballArt;
  ui.trainerStatsHtml = trainerStatsHtml;
  ui.itemName = itemName;
  ui.statusBadge = statusBadge;
  ui.pokeCard = pokeCard;
  ui.openMore = openMore;

  /* ---------------- GLOBAL EVENTS ---------------- */
  /* Âm cho menu/tab và các nút chưa có tiếng riêng. Danh sách SKIP là các action
     đã tự play('...') trong handler — tránh phát hai tiếng cùng lúc. */
  const CLICK_SOUNDS = {
    'open-more': 'page',
    'shop-tab': 'tab', 'craft-tab': 'tab', 'quest-tab': 'tab', 'equip-filter': 'tab',
    'tournament-select-tier': 'tab', 'dex-status': 'tab', 'dex-filter-type': 'tab',
    'dex-filter-change': 'tab', 'dex-reset-filters': 'tab',
    'select-region': 'region', 'save': 'save', 'heal-team': 'heal',
    'profile-save': 'save', 'profile-name-save': 'save',
    'save-nickname': 'save', 'moves-save': 'save'
  };
  const SKIP_CLICK_SOUND = new Set([
    'go', 'close-modal', 'toggle-sound', 'walk', 'walk-again', 'challenge-roaming',
    'start-battle', 'battle-weaken', 'battle-catch', 'battle-move', 'battle-item',
    'battle-switch', 'battle-heal', 'fish-cast', 'fish-strike', 'fish-bait',
    'fossil-dig', 'fossil-probe', 'fossil-start-restore', 'fossil-claim', 'fossil-sell',
    'fossil-cancel-dig', 'shop-buy', 'gift-buy', 'catalog-buy', 'trainer-shop-buy', 'merchant-buy',
    'merchant-sell-mat', 'merchant-fulfill', 'merchant-trade', 'npc-buy', 'sell-bag',
    'sell-mat', 'craft-do', 'rod-buy', 'rod-upgrade', 'equip-upgrade',
    'equip-sacrifice-do', 'equip-enchant-apply', 'equip-equip', 'held-repair',
    'power-up', 'exp-use', 'medicine-use', 'evolve', 'claim-login', 'choose-starter',
    'ach-claim', 'quest-claim', 'hatch-egg', 'summon-legendary', 'trap-place',
    'trap-claim', 'trap-claim-all', 'tournament-start', 'tournament-next',
    'catch-continue', 'catch-walk', 'select-ball', 'select-berry',
    'profile-redeem-submit'
  ]);

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ui.actions[el.dataset.act];
    if (!fn) return;
    e.preventDefault();
    const act = el.dataset.act;
    if (PG.Audio) {
      const named = CLICK_SOUNDS[act];
      if (named) PG.Audio.play(named);
      else if (!SKIP_CLICK_SOUND.has(act)) PG.Audio.play('tap');
    }
    try { fn(el, e); } catch (err) {
      console.error('Action lỗi:', act, err);
      toast('Có lỗi xảy ra: ' + err.message, 'error');
    }
  });

  document.addEventListener('change', function (e) {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const fn = ui.changes[el.dataset.change];
    if (fn) { try { fn(el, e); } catch (err) { console.error(err); } }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !ui.modalLocked) closeModal();
  });

  window.addEventListener('hashchange', function () {
    const v = location.hash.replace(/^#\/?/, '') || 'home';
    if (v !== ui.current && ui.views[v]) {
      ui.current = v;
      ui.params = {};
      render({ resetScroll: true });
    }
  });
})();
