/* ============================================================
   TRANG CHỦ: BẢN ĐỒ, VÙNG ĐẤT, HÀNH ĐỘNG
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  function particles(kind, n) {
    let out = '<div class="particles particles--' + kind + '" aria-hidden="true">';
    for (let i = 0; i < n; i++) {
      const left = (i * 37 + 11) % 100;
      const delay = ((i * 13) % 90) / 10;
      const dur = 5 + ((i * 7) % 60) / 10;
      const size = 2 + (i % 4);
      out += '<span style="--x:' + left + '%;--d:' + delay + 's;--t:' + dur + 's;--s:' + size + 'px"></span>';
    }
    return out + '</div>';
  }

  function weatherChip(state, regionId) {
    const wid = PG.weatherFor(state, regionId);
    const w = PG.WEATHERS[wid] || PG.WEATHERS.clear;
    const hint = PG.weatherSpawnHint ? PG.weatherSpawnHint(wid) : '';
    const title = w.desc + (hint ? ' • ' + hint : '');
    return '<span class="weather-chip" style="--wc:' + w.color + '" title="' + PG.esc(title) + '">' + w.icon + ' ' + w.name + '</span>';
  }

  function hazardChip(region, state) {
    if (!region.hazard) return '';
    const pen = PG.hazardPenalty(state, region);
    return '<span class="hazard-chip' + (pen.protected ? ' is-safe' : '') + '" title="' + (pen.protected ? 'Trang bị đủ để chống lại' : 'Thiếu trang bị — tốn thêm thể lực') + '">' +
      region.hazard.icon + ' ' + region.hazard.name + (pen.protected ? ' ✓' : ' +' + pen.extra + ' TL') + '</span>';
  }

  /** Bản đồ chọn vùng: bấm một điểm để xem chi tiết, rồi bấm "Đến vùng này". */
  function regionMap(state) {
    const posOf = PG.regionMapPoint || function () { return null; };
    const wanted = ui.flow.mapRegion && PG.REGIONS[ui.flow.mapRegion] ? ui.flow.mapRegion : state.region;
    const pickedId = PG.REGIONS[wanted] ? wanted : 'forest';
    const r = PG.REGIONS[pickedId];
    const unlocked = PG.isRegionUnlocked(state, pickedId);
    const active = state.region === pickedId;
    const earned = state.badges.includes(pickedId);
    const ob = outbreakOf(state);
    const weather = PG.WEATHERS[PG.weatherFor(state, pickedId)] || {};

    const routes = (PG.REGION_MAP_ROUTES || []).map(pair => {
      const a = posOf(pair[0]);
      const b = posOf(pair[1]);
      if (!a || !b) return '';
      const lit = pair[0] === pickedId || pair[1] === pickedId;
      return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"' +
        (lit ? ' class="is-lit"' : '') + ' />';
    }).join('');

    const nodes = PG.REGION_ORDER.map(id => {
      const p = posOf(id);
      if (!p) return '';
      const reg = PG.REGIONS[id];
      const open = PG.isRegionUnlocked(state, id);
      const hasOb = !!ob && ob.regionId === id;
      return '<button class="world-map__node region-card--' + reg.bg +
          (id === pickedId ? ' is-picked' : '') + (state.region === id ? ' is-active' : '') +
          (open ? '' : ' is-locked') + (hasOb ? ' has-outbreak' : '') + '"' +
          ' style="left:' + p.left + '%;top:' + p.top + '%"' +
          ' data-act="map-region-pick" data-id="' + id + '"' +
          (open ? '' : ' aria-disabled="true"') +
          ' title="' + esc(reg.name) + (open ? '' : ' — chưa mở') + '">' +
          '<span class="world-map__pin">' + reg.emoji + '</span>' +
          '<span class="world-map__label">' + esc(reg.name) + '</span>' +
          (state.badges.includes(id) && reg.gym ? '<span class="world-map__badge">' + reg.gym.badgeIcon + '</span>' : '') +
          (open ? '' : '<span class="world-map__lock">🔒</span>') +
          (hasOb ? '<span class="world-map__alert">⚠️</span>' : '') +
        '</button>';
    }).join('');

    const featured = (r.featured || []).filter(id => PG.SPECIES[id]).slice(0, 4).map(id =>
      '<button class="mini-mon" data-act="open-species" data-id="' + id + '" title="' + esc(PG.SPECIES[id].name) + '">' +
        ui.spriteHtml(PG.SPECIES[id], { size: 'xs' }) + '<small>' + esc(PG.SPECIES[id].name) + '</small></button>'
    ).join('');

    return '<section class="panel world-map-panel">' +
      '<div class="panel__head"><h3 class="panel__title">🗺️ Bản Đồ Vùng Đất</h3>' +
        '<span class="muted small">Chọn một điểm trên bản đồ, rồi bấm “Đến vùng này”</span></div>' +
      '<div class="world-map-layout">' +
        '<div class="world-map-scroll"><div class="world-map region-bg--' + r.bg + '" id="world-map">' +
          '<div class="world-map__terrain"></div>' +
          '<svg class="world-map__routes" viewBox="0 0 120 70" preserveAspectRatio="none" aria-hidden="true">' + routes + '</svg>' +
          nodes +
          '<span class="world-map__compass">N ↑</span>' +
          '<span class="world-map__legend">🟢 đã mở • 🔒 chưa mở • ⚠️ bùng nổ</span>' +
        '</div></div>' +
        '<aside class="world-map__detail region-card--' + r.bg + '">' +
          '<div class="world-map__detail-top">' +
            '<span class="world-map__detail-emoji">' + r.emoji + '</span>' +
            '<div><small>' + (active ? '📍 Bạn đang ở đây' : '🎯 Điểm đã chọn') + '</small>' +
              '<h4>' + esc(r.name) + '</h4></div>' +
            (earned && r.gym ? '<span class="world-map__badge">' + r.gym.badgeIcon + '</span>' : '') +
          '</div>' +
          '<p class="world-map__desc">' + esc(r.desc || r.subtitle || '') + '</p>' +
          '<div class="world-map__types">' + (r.types || []).map(t => PG.typeChip(t, true)).join('') + '</div>' +
          '<div class="world-map__meta"><span>' + (weather.icon || '🌤️') + ' ' + esc(weather.name || 'Trời Quang') + '</span>' +
            '<span>Cấp ' + r.unlock.level + '</span><span>' + r.unlock.badges + ' huy hiệu</span></div>' +
          (featured ? '<div class="world-map__featured"><span class="muted small">Có thể gặp:</span>' + featured + '</div>' : '') +
          (unlocked
            ? '<button class="btn btn--primary btn--block" data-act="map-region-go" data-id="' + pickedId + '">' +
                (active ? '✔ Đang ở ' + esc(r.name) : '➜ Đến ' + esc(r.name)) + '</button>'
            : '<p class="world-map__locked">🔒 Cần Cấp ' + r.unlock.level + ' và ' + r.unlock.badges + ' huy hiệu để mở vùng này.</p>' +
              '<button class="btn btn--ghost btn--block" disabled>Chưa mở khóa</button>') +
        '</aside>' +
      '</div>' +
    '</section>';
  }

  function teamStrip(state) {
    let slots = '';
    for (let i = 0; i < 6; i++) {
      const uid = state.team[i];
      const p = uid ? state.pokemon.find(x => x.uid === uid) : null;
      if (p) {
        const sp = PG.SPECIES[p.speciesId];
        const max = PG.getStats(p).hp;
        slots += '<button class="team-slot' + (p.hp <= 0 ? ' is-fainted' : '') + '" data-act="open-pokemon" data-uid="' + p.uid + '" title="' + PG.esc(sp.name) + '">' +
          '<span class="team-slot__sprite">' + ui.spriteHtml(p, { size: 'sm' }) + '</span>' +
          '<span class="team-slot__lv">' + p.level + '</span>' +
          '<span class="team-slot__hp">' + ui.bar(p.hp, max, 'bar--hp') + '</span>' +
          '</button>';
      } else {
        slots += '<button class="team-slot team-slot--empty" data-act="go" data-view="box" title="Thêm Pokémon">＋</button>';
      }
    }
    return '<div class="team-strip">' + slots + '</div>';
  }

  function questMini(state) {
    const qs = (state.quests.daily || []).slice(0, 3);
    if (!qs.length) return '<p class="muted">Chưa có nhiệm vụ hôm nay.</p>';
    return qs.map(q => {
      const pct = Math.min(100, q.progress / q.target * 100);
      return '<div class="quest-mini' + (q.claimed ? ' is-done' : '') + '">' +
        '<span class="quest-mini__icon">' + q.icon + '</span>' +
        '<div class="quest-mini__body"><div class="quest-mini__text">' + PG.esc(q.text) + '</div>' +
        '<div class="quest-mini__bar"><span style="width:' + pct + '%"></span></div></div>' +
        '<span class="quest-mini__num">' + q.progress + '/' + q.target + '</span></div>';
    }).join('') + '<button class="btn btn--ghost btn--sm btn--block" data-act="go" data-view="quests">Xem tất cả nhiệm vụ</button>';
  }

  function eventCard(state) {
    const ev = state.events.active;
    if (!ev) return '';
    return '<section class="panel event-card" style="--ev:' + (ev.color || '#60a5fa') + '">' +
      '<div class="event-card__head"><span class="event-card__icon">' + ev.icon + '</span>' +
      '<div><div class="event-card__name">' + ev.name + '</div><div class="event-card__time">Hôm nay • còn ' + Math.max(1, Math.ceil((ev.endsAt - Date.now()) / 3600000)) + ' giờ</div></div></div>' +
      '<p class="event-card__desc">' + ev.desc + '</p>' +
      '</section>';
  }

  function outbreakOf(state) {
    const ob = state.events && state.events.outbreak;
    return ob && ob.endsAt > Date.now() && PG.SPECIES[ob.speciesId] ? ob : null;
  }
  function outbreakMinutes(ob) {
    return Math.max(1, Math.ceil((ob.endsAt - Date.now()) / 60000));
  }
  function outbreakSky(state, regionId) {
    const ob = outbreakOf(state);
    if (!ob || ob.regionId !== regionId) return '';
    return '<div class="outbreak-sky" style="--ob:' + (ob.color || '#fb7185') + '" aria-hidden="true">' +
        '<span class="outbreak-sky__flare"></span><span class="outbreak-sky__rays"></span>' +
      '</div>';
  }

  /** Thông báo đặt NGOÀI .hero để đè lên viền khung thay vì bị overflow cắt. */
  function roamingOf(state) {
    const rt = state.roamingTrainer;
    return rt && rt.expiresAt > Date.now() ? rt : null;
  }
  function roamingMinutes(rt) {
    return Math.max(1, Math.ceil((rt.expiresAt - Date.now()) / 60000));
  }
  function roamingLootText(rt) {
    const rw = rt.reward || {};
    const parts = [PG.fmt(rw.coins || 0) + ' Xu'];
    for (const [id, n] of Object.entries(rw.items || {})) {
      const info = PG.itemInfo(id);
      parts.push((info && info.name ? info.name : id) + ' x' + n);
    }
    if ((rw.equipment || []).length) parts.push('1 trang bị');
    if (rw.diamonds) parts.push(rw.diamonds + ' 💎');
    return parts.join(' • ');
  }
  function roamingBanner(state) {
    const rt = roamingOf(state);
    if (!rt) return '';
    return '<div class="roaming-alert" role="status">' +
      '<span class="roaming-alert__icon">' + (rt.avatar || '🧑‍🎤') + '</span>' +
      '<span class="roaming-alert__text"><b>HUẤN LUYỆN VIÊN THÁCH ĐẤU</b>' +
        '<small>' + esc(rt.name) + ' tại ' + esc((PG.REGIONS[rt.regionId] || {}).name || rt.regionId) + ' • thắng để nhận quà rớt</small></span>' +
      '<span class="roaming-alert__timer">' + roamingMinutes(rt) + 'p</span>' +
      '<button class="btn btn--challenge btn--sm roaming-alert__btn" data-act="challenge-roaming">Đối mặt</button>' +
      '</div>';
  }
  function roamingCard(state) {
    const rt = roamingOf(state);
    if (!rt) return '';
    return '<section class="panel roaming-card">' +
      '<div class="panel__head"><h3 class="panel__title">🎯 Thách đấu lang thang</h3><span class="badge">' + roamingMinutes(rt) + 'p</span></div>' +
      '<div class="roaming-card__row">' +
        '<span class="roaming-card__sprite">' + (rt.avatar || '🧑‍🎤') + '</span>' +
        '<span class="roaming-card__info"><strong>' + esc(rt.name) + '</strong>' +
          '<small>' + esc(rt.title) + ' • ' + rt.team.length + ' Pokémon</small></span>' +
      '</div>' +
      '<p class="roaming-card__loot">🎁 ' + esc(roamingLootText(rt)) + '</p>' +
      '<button class="btn btn--challenge btn--sm btn--block" data-act="challenge-roaming">Nhận lời thách đấu</button>' +
      '</section>';
  }

  function outbreakBanner(state) {
    const ob = outbreakOf(state);
    if (!ob) return '';
    const sourceUnlocked = PG.isRegionUnlocked(state, ob.regionId);
    return '<div class="outbreak-alert' + (sourceUnlocked ? '' : ' is-locked-source') + '" style="--ob:' + (ob.color || '#fb7185') + '" role="status">' +
      '<span class="outbreak-alert__pulse">⚠️</span>' +
      '<span class="outbreak-alert__text"><b>BÙNG NỔ POKÉMON</b>' +
        '<span>“' + esc(ob.speciesName) + '” xuất hiện nhiều ở vùng <b>' + esc(ob.regionName) + '</b>' +
          (sourceUnlocked ? '' : ' • 🔒 vùng này chưa mở nên chưa đi tới được') + '</span></span>' +
      '<span class="outbreak-alert__timer">' + outbreakMinutes(ob) + 'p</span>' +
    '</div>';
  }
  function outbreakCard(state) {
    const ob = outbreakOf(state);
    if (!ob) return '';
    const sp = PG.SPECIES[ob.speciesId];
    const sourceUnlocked = PG.isRegionUnlocked(state, ob.regionId);
    const sourceName = (PG.REGIONS[ob.regionId] || {}).name || ob.regionName;
    return '<section class="panel outbreak-card' + (sourceUnlocked ? '' : ' is-locked-source') + '" style="--ob:' + (ob.color || '#fb7185') + '">' +
      '<div class="outbreak-card__head"><span class="outbreak-card__icon">⚠️</span>' +
        '<div><div class="outbreak-card__name">Bùng nổ Pokémon</div>' +
        '<div class="outbreak-card__time">Còn ' + outbreakMinutes(ob) + ' phút</div></div></div>' +
      '<div class="outbreak-card__body">' +
        '<span class="outbreak-card__sprite">' + ui.spriteHtml(sp, { size: 'sm' }) + '</span>' +
        '<div><strong>' + esc(ob.speciesName) + '</strong>' +
          '<p class="muted small">“' + esc(ob.speciesName) + '” xuất hiện nhiều ở vùng <b>' + esc(ob.regionName) + '</b>. ' +
            (sourceUnlocked ? 'Bấm “Đi tới” để đến vùng đang bùng nổ.' : '🔒 Vùng này chưa mở nên nút “Đi tới” bị khóa.') + '</p></div>' +
      '</div>' +
      '<div class="outbreak-card__actions">' +
        (sourceUnlocked
          ? '<button class="btn btn--ghost btn--sm" data-act="select-region" data-id="' + esc(ob.regionId) + '">Đi tới ' + esc(sourceName) + '</button>'
          : '<button class="btn btn--ghost btn--sm" disabled aria-disabled="true" title="Vùng chưa mở — không bấm được">🔒 ' + esc(sourceName) + ' chưa mở</button>') +
        '<button class="btn btn--primary btn--sm" data-act="walk">Đi dạo tìm ngay</button>' +
      '</div>' +
      '</section>';
  }

  function eggCard(state) {
    const eggs = state.eggs || [];
    const ready = eggs.filter(e => e.ready);
    let body = '';
    if (!eggs.length) {
      body = '<p class="muted small">Chưa có trứng. Mua trứng ngẫu nhiên trong Chợ → 🎁 Vật Phẩm.</p>';
    } else {
      for (const egg of eggs.slice(0, 3)) {
        const pct = Math.min(100, (egg.walked / egg.km) * 100);
        const def = PG.EGG_TYPES && PG.EGG_TYPES.random ? PG.EGG_TYPES.random : {};
        body += '<div class="egg-row" style="--ec:' + esc(def.color || '#fbbf24') + '">' +
          '<span class="egg-row__icon">' + (egg.ready ? '🐣' : egg.incubating ? esc(def.icon || '🥚') : '⚪') + '</span>' +
          '<div class="egg-row__body"><div class="egg-row__label">' + esc(def.name || 'Trứng Ngẫu Nhiên') + ' • ' +
          (egg.ready ? 'Sẵn sàng nở!' : egg.incubating ? 'Đang ấp • ' + egg.walked.toFixed(1) + '/' + egg.km + ' km' : 'Chưa ấp • ' + egg.km + ' km') + '</div>' +
          '<div class="quest-mini__bar"><span style="width:' + pct + '%"></span></div></div>' +
          (egg.ready ? '<button class="btn btn--gold btn--sm" data-act="hatch-egg" data-uid="' + egg.uid + '">Nở</button>' :
            (!egg.incubating ? '<button class="btn btn--ghost btn--sm" data-act="start-egg" data-uid="' + egg.uid + '">Ấp</button>' : '')) +
          '</div>';
      }
      if (ready.length) body += '<p class="small gold">' + ready.length + ' trứng đã sẵn sàng!</p>';
    }
    return '<section class="panel egg-card">' +
      '<div class="panel__head"><h3 class="panel__title">🥚 Trứng</h3><span class="badge">' + eggs.length + '</span></div>' +
      body +
      '<button class="btn btn--ghost btn--sm btn--block" data-act="go-egg-shop">Mua trứng trong Chợ</button>' +
      '<button class="btn btn--ghost btn--sm btn--block" data-act="go" data-view="box">Mở Kho</button></section>';
  }

  function buddyCard(state) {
    const p = state.buddy ? state.pokemon.find(x => x.uid === state.buddy) : null;
    if (!p) {
      return '<section class="panel buddy-card">' +
        '<div class="panel__head"><h3 class="panel__title">🧭 Bạn Đồng Hành</h3></div>' +
        '<p class="muted small">Chọn một Pokémon trong Kho để cùng đi dạo và nhận Kẹo.</p>' +
        '<button class="btn btn--ghost btn--sm btn--block" data-act="go" data-view="box">Chọn bạn đồng hành</button></section>';
    }
    const sp = PG.SPECIES[p.speciesId];
    const need = PG.buddyKm(p);
    const pct = Math.min(100, (state.buddyProgress / need) * 100);
    return '<section class="panel buddy-card">' +
      '<div class="panel__head"><h3 class="panel__title">🧭 Bạn Đồng Hành</h3><span class="badge">' + need + ' km / Kẹo</span></div>' +
      '<button class="buddy-card__row" data-act="open-pokemon" data-uid="' + p.uid + '">' +
        '<span class="buddy-card__sprite">' + ui.spriteHtml(p, { size: 'md' }) + '</span>' +
        '<span class="buddy-card__info"><strong>' + esc(sp.name) + '</strong>' +
        '<small>Lv.' + p.level + ' • ' + PG.esc(p.nature ? PG.NATURES[p.nature].name : '') + '</small>' +
        '<span class="quest-mini__bar"><span style="width:' + pct + '%"></span></span>' +
        '<small class="muted">' + state.buddyProgress.toFixed(1) + '/' + need + ' km</small></span>' +
      '</button></section>';
  }

  function loginBanner(state) {
    if (!PG.canClaimLogin()) return '';
    const streak = state.login.streak || 0;
    const next = PG.LOGIN_REWARDS[Math.min(6, streak)];
    return '<button class="login-banner" data-act="claim-login">' +
      '<span class="login-banner__icon">🎁</span>' +
      '<span class="login-banner__body"><strong>Điểm danh hằng ngày</strong>' +
      '<small>Chuỗi ' + streak + ' ngày • Nhận ' + next.coins + ' Xu' + (next.items ? ' + vật phẩm' : '') + '</small></span>' +
      '<span class="login-banner__cta">Nhận</span></button>';
  }

  function regionClearTeaser(state, region) {
    const st = PG.regionChallengeStatus(region.id);
    const rw = (PG.REGION_CLEAR_REWARDS || {})[region.id] || {};
    const labels = { trainer: 'Trainer', gym: 'Gym', raid: 'Raid' };
    const icons = { trainer: '🧑‍🌾', gym: '🏟️', raid: '👹' };
    const steps = st.kinds.map(k =>
      '<span class="region-clear__step' + (st.flags[k] ? ' is-done' : '') + '">' +
        icons[k] + ' ' + labels[k] + (st.flags[k] ? ' ✓' : '') + '</span>').join('');
    const reward = [];
    if (rw.coins) reward.push(PG.fmt(rw.coins) + ' Xu');
    if (rw.diamonds) reward.push(rw.diamonds + ' 💎');
    if (rw.stardust) reward.push(PG.fmt(rw.stardust) + ' Bụi Sao');
    return '<div class="region-clear' + (st.claimed ? ' is-claimed' : '') + '">' +
      '<div class="region-clear__head">🎁 Thưởng hoàn thành vùng ' + region.name +
        ' <span>' + st.done.length + '/' + st.total + '</span></div>' +
      '<div class="region-clear__steps">' + steps + '</div>' +
      '<div class="region-clear__reward">' + (st.claimed ? 'Đã nhận phần thưởng ✓' : reward.join(' • ')) + '</div>' +
      '</div>';
  }

  function battleTeaser(state, region) {
    const trainerDone = !PG.Battle.availableTrainer(region.id);
    const hasBadge = state.badges.includes(region.id);
    const t = region.trainer, g = region.gym, raid = region.raid;
    return '<section class="panel battle-teasers">' +
      '<div class="panel__head"><h3 class="panel__title">⚔️ Thử thách tại ' + region.name + '</h3><span class="muted small">' + region.subtitle + '</span></div>' +
      regionClearTeaser(state, region) +
      '<div class="teaser-grid">' +
        '<div class="teaser teaser--trainer">' +
          '<div class="teaser__icon">🧑‍🌾</div><div class="teaser__body"><strong>' + esc(t.name) + '</strong><small>' + esc(t.title) + ' • ' + t.team.length + ' Pokémon</small></div>' +
          '<button class="btn btn--challenge btn--sm" data-act="start-battle" data-kind="trainer" data-region="' + region.id + '">' + (trainerDone ? 'Tái đấu' : 'Đấu') + '</button>' +
        '</div>' +
        '<div class="teaser teaser--gym">' +
          '<div class="teaser__icon">🏟️</div><div class="teaser__body"><strong>' + esc(g.leader) + '</strong><small>' + esc(g.title) + ' • ' + g.team.length + ' Pokémon</small></div>' +
          '<button class="btn btn--challenge btn--sm" data-act="start-battle" data-kind="gym" data-region="' + region.id + '">' + (hasBadge ? 'Tái đấu' : 'Thách đấu') + '</button>' +
        '</div>' +
        '<div class="teaser teaser--raid">' +
          '<div class="teaser__icon">👹</div><div class="teaser__body"><strong>' + esc(raid.name) + '</strong><small>Lv.' + raid.level + ' • ' + PG.fmt(raid.reward.coins) + ' Xu • Vé: ' + (state.bag['raid-pass'] || 0) + '</small></div>' +
          '<button class="btn btn--challenge btn--sm" data-act="start-battle" data-kind="raid" data-region="' + region.id + '">Raid</button>' +
        '</div>' +
        (region.id === 'temple' ? '<div class="teaser teaser--legend">' +
          '<div class="teaser__icon">🌟</div><div class="teaser__body"><strong>Triệu hồi Huyền Thoại</strong><small>Chìa khóa: ' + (state.bag['temple-key'] || 0) + '</small></div>' +
          '<button class="btn btn--gold btn--sm" data-act="summon-legendary">Triệu hồi</button></div>' : '') +
      '</div></section>';
  }

  ui.views.home = function () {
    const state = PG.getState();
    const region = PG.REGIONS[state.region] || PG.REGIONS.forest;
    const weather = PG.WEATHERS[PG.weatherFor(state, region.id)] || PG.WEATHERS.clear;
    const hazard = PG.hazardPenalty(state, region);
    const cost = region.staminaCost + hazard.extra;
    const time = PG.timeLabel();
    const locked = !PG.isRegionUnlocked(state, region.id);
    const spot = region.fishing;
    const maxStam = PG.staminaMax();

    return '<div class="home">' +
      '<section class="home-head">' +
        '<div><p class="eyebrow">' + time + ' • ' + weather.name + '</p></div>' +
        '<div class="home-head__right">' + loginBanner(state) +
          '<div class="quick-pills">' +
            '<span class="pill pill--gold">🏅 ' + state.badges.length + '/' + PG.REGION_ORDER.length + ' huy hiệu</span>' +
            '<span class="pill">📕 ' + PG.dexCounts().caught + '/' + PG.dexCounts().total + ' loài</span>' +
            '<span class="pill">👟 ' + PG.fmtKm(state.stats.km || 0) + '</span>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<div class="home-grid">' +
        '<div class="home-main">' +
          roamingBanner(state) +
          outbreakBanner(state) +
          '<section class="hero region-bg--' + region.bg + '" data-region="' + region.id + '">' +
            particles(region.particles, 16) +
            outbreakSky(state, region.id) +
            '<div class="hero__overlay"></div>' +
            '<div class="hero__content">' +
              '<div class="hero__badges">' +
                '<span class="hero__emoji">' + region.emoji + '</span>' +
                weatherChip(state, region.id) + hazardChip(region, state) +
                '<span class="hero__time">' + (PG.isNight() ? '🌙 Ban đêm' : '☀️ Ban ngày') + '</span>' +
              '</div>' +
              '<h2 class="hero__name">' + region.name + '</h2>' +
              '<p class="hero__sub">' + region.subtitle + ' — ' + region.desc + '</p>' +
              '<div class="hero__types">' + region.types.map(t => PG.typeChip(t)).join('') + '</div>' +
              '<div class="hero__actions">' +
                (locked
                  ? '<div class="hero__locked">🔒 Cần Cấp ' + region.unlock.level + ' và ' + region.unlock.badges + ' huy hiệu để mở khóa.</div>'
                  : '<button class="btn btn--primary btn--lg hero__walk" data-act="walk">' +
                      '<span class="hero__walk-icon">👟</span><span>Đi Dạo</span><small>-' + cost + ' ⚡</small></button>' +
                    (spot ? '<button class="btn btn--ghost btn--lg" data-act="go" data-view="fish">🎣 Câu Cá</button>' : '') +
                    '<button class="btn btn--ghost" data-act="go" data-view="fossil">🦴 Hóa Thạch</button>' +
                    '<button class="btn btn--ghost" data-act="go" data-view="battle">⚔️ Đấu Trường</button>') +
              '</div>' +
              '<div class="hero__stamina">' +
                '<div class="hero__stamina-bar">' + ui.bar(state.player.stamina, maxStam, 'bar--stamina') + '</div>' +
                '<span>' + state.player.stamina + '/' + maxStam + ' Thể lực</span>' +
                (state.player.stamina < maxStam ? '<span class="muted">• hồi sau ' + Math.ceil(PG.staminaNextIn() / 1000) + 's</span>' : '') +
              '</div>' +
              '<div class="hero__featured">' +
                '<span class="muted small">Có thể gặp:</span>' +
                region.featured.slice(0, 5).map(id => {
                  const sp = PG.SPECIES[id];
                  return sp ? '<button class="mini-mon" data-act="open-species" data-id="' + id + '" title="' + esc(sp.name) + '">' + ui.spriteHtml(sp, { size: 'xs' }) + '<small>' + sp.name + '</small></button>' : '';
                }).join('') +
              '</div>' +
            '</div>' +
          '</section>' +

          battleTeaser(state, region) +

          '<section class="panel">' +
            regionMap(state) +
          '</section>' +
        '</div>' +

        '<aside class="home-side">' +
          roamingCard(state) +
          outbreakCard(state) +
          eventCard(state) +
          '<section class="panel team-panel">' +
            '<div class="panel__head"><h3 class="panel__title">⚔️ Đội Hình</h3><span class="badge">' + state.team.length + '/6</span></div>' +
            teamStrip(state) +
            '<div class="team-panel__actions">' +
              '<button class="btn btn--ghost btn--sm" data-act="heal-team" title="Dùng 1 Bình Hồi Phục Nhanh hoặc Potion cho từng Pokémon">🏥 Hồi phục</button>' +
              '<button class="btn btn--ghost btn--sm" data-act="go" data-view="box">Quản lý</button>' +
            '</div>' +
          '</section>' +
          buddyCard(state) +
          eggCard(state) +
          '<section class="panel">' +
            '<div class="panel__head"><h3 class="panel__title">📋 Nhiệm Vụ Hôm Nay</h3><span class="badge">' + (state.quests.daily || []).filter(q => q.progress >= q.target && !q.claimed).length + ' mới</span></div>' +
            questMini(state) +
          '</section>' +
        '</aside>' +
      '</div>' +
    '</div>';
  };

  /* ---------------- ACTIONS ---------------- */
  ui.actions['select-region'] = function (el) {
    const id = el.dataset.id;
    const state = PG.getState();
    if (!PG.isRegionUnlocked(state, id)) {
      const r = PG.REGIONS[id];
      ui.toast('Cần Cấp ' + r.unlock.level + ' và ' + r.unlock.badges + ' huy hiệu để mở ' + r.name + '.', 'warn');
      return;
    }
    state.region = id;
    ui.flow.mapRegion = id;
    PG.saveState(true);
    ui.render();
  };

  ui.actions['map-region-pick'] = function (el) {
    const id = el.dataset.id;
    if (!PG.REGIONS[id]) return;
    ui.flow.mapRegion = id;
    if (PG.Audio) PG.Audio.play('tab');
    // Chỉ đổi điểm đang chọn — không cuộn trang, bản đồ vẫn nguyên tại chỗ.
    ui.render({ keepScroll: true });
  };

  ui.actions['map-region-go'] = function (el) {
    const id = el.dataset.id;
    const state = PG.getState();
    if (!PG.REGIONS[id]) return;
    if (!PG.isRegionUnlocked(state, id)) {
      const r = PG.REGIONS[id];
      ui.toast('Cần Cấp ' + r.unlock.level + ' và ' + r.unlock.badges + ' huy hiệu để mở ' + r.name + '.', 'warn');
      return;
    }
    // Đổi vùng ngay tại bản đồ: giữ cuộn để thấy rõ điểm sáng và hiệu ứng đi tới.
    state.region = id;
    ui.flow.mapRegion = id;
    PG.saveState(true);
    ui.render({ keepScroll: true });
    const settings = state.settings;
    const calm = (settings && (settings.reduceMotion || settings.particles === false)) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const map = document.getElementById('world-map');
    if (map && !calm) {
      map.classList.add('is-traveling');
      setTimeout(function () { map.classList.remove('is-traveling'); }, 720);
    }
    const detail = document.querySelector('.world-map__detail');
    if (detail) {
      detail.classList.add('is-arrived');
      setTimeout(function () { detail.classList.remove('is-arrived'); }, 1200);
    }
    ui.toast('Đã đến ' + PG.REGIONS[id].name + '!', 'success');
  };

  ui.actions['walk'] = function () {
    const state = PG.getState();
    const res = PG.walk(state.region);
    if (!res.ok) { ui.toast(res.msg, 'error'); PG.Audio.play('error'); return; }
    PG.Audio.play('splash');
    if (res.trainerChallenge) ui.toast('Một huấn luyện viên đang thách đấu bạn — xem trang chủ!', 'warn');
    if (res.encounter) {
      ui.flow.encounter = res.encounter;
      ui.go('catch');
      return;
    }
    const parts = [];
    parts.push('<div class="walk-stat"><span>👟</span><strong>+' + res.km + ' km</strong><small>Đã đi dạo</small></div>');
    parts.push('<div class="walk-stat"><span>⚡</span><strong>-' + res.cost + '</strong><small>Thể lực</small></div>');
    if (res.found) {
      const info = PG.itemInfo(res.found.id);
      parts.push('<div class="walk-stat"><span>' + info.icon + '</span><strong>+' + res.found.qty + '</strong><small>' + info.name + '</small></div>');
    }
    if (res.buddyCandy) parts.push('<div class="walk-stat"><span>🍬</span><strong>+' + res.buddyCandy + '</strong><small>Kẹo bạn đồng hành</small></div>');
    if (res.eggReady && res.eggReady.length) parts.push('<div class="walk-stat"><span>🥚</span><strong>' + res.eggReady.length + '</strong><small>Trứng chín!</small></div>');
    const lv = PG.addPlayerXp(state, 15 + Math.round(res.km * 6));
    if (lv) parts.push('<div class="walk-stat"><span>⭐</span><strong>Lên cấp ' + state.player.level + '!</strong><small>Huấn luyện viên</small></div>');
    PG.saveState(true);
    ui.refreshTopbar();
    ui.modal({
      title: 'Chuyến đi hoàn tất',
      subtitle: 'Bạn đã đi ' + res.km + ' km quanh ' + PG.REGIONS[state.region].name + '.',
      body: '<div class="walk-grid">' + parts.join('') + '</div>' +
        (res.eggReady && res.eggReady.length ? '<p class="gold">🥚 Có trứng đã sẵn sàng nở! Kiểm tra mục Trứng ở trang chủ.</p>' : '') +
        (res.found ? '' : '<p class="muted small">Không tìm thấy gì đặc biệt lần này. Hãy thử lại!</p>'),
      footer: '<button class="btn btn--ghost" data-act="close-modal">Đóng</button><button class="btn btn--primary" data-act="walk-again">Đi tiếp</button>'
    });
  };

  ui.actions['walk-again'] = function () {
    ui.closeModal();
    ui.actions['walk']();
  };

  ui.actions['challenge-roaming'] = function () {
    // Đội hình đối thủ 3 hay 6 con → cho chọn đúng số đó trước khi vào trận.
    if (ui.actions['roaming-team-select']) ui.actions['roaming-team-select']();
    else {
      const res = PG.Battle.startRoamingTrainer();
      if (!res.ok) { ui.toast(res.msg, 'error'); PG.Audio.play('error'); return; }
      ui.flow.battle = res.battle;
      ui.flow.battleBusy = false;
      ui.flow.battleFast = PG.getState().settings.fast;
      PG.Audio.play('open');
      ui.go('battle');
      if (res.events && res.events.length && ui.playBattleEvents) ui.playBattleEvents(res.events, function () { });
    }
  };

  ui.actions['hatch-egg'] = function (el) {
    const state = PG.getState();
    const fx = PG.trainerBonuses(state).luckFx;
    const res = PG.hatchEgg(el.dataset.uid, fx);
    if (!res.ok) { ui.toast(res.msg, 'error'); return; }
    const p = res.pokemon;
    if (state.team.length < 6) state.team.push(p.uid);
    PG.saveState(true);
    PG.Audio.play('reward');
    ui.modal({
      title: '🥚 Trứng đã nở!',
      subtitle: PG.SPECIES[p.speciesId].name + ' chào đời!',
      body: '<div class="hatch-result">' + ui.spriteHtml(p, { size: 'lg' }) +
        '<div><h3>' + PG.SPECIES[p.speciesId].name + '</h3>' + ui.typeChips(PG.SPECIES[p.speciesId].types) +
        '<p class="muted">Lv.' + p.level + ' • CP ' + PG.fmt(PG.cpOf(p)) + ' • ' + PG.qualityOf(p).name + '</p>' +
        ui.mutationBadges(p) + '</div></div>',
      footer: '<button class="btn btn--primary" data-act="close-modal">Tuyệt vời!</button>'
    });
    ui.render();
  };

  ui.actions['start-egg'] = function (el) {
    const r = PG.startEgg(el.dataset.uid);
    ui.toast(r.msg, r.ok ? 'success' : 'error');
    ui.render();
  };


  ui.actions['summon-legendary'] = function () {
    const r = PG.summonLegendary();
    if (!r.ok) { ui.toast(r.msg, 'error'); return; }
    ui.flow.encounter = r.encounter;
    PG.Audio.play('shiny');
    ui.go('catch');
  };
})();
