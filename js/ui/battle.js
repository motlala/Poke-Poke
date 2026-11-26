/* ============================================================
   MÀN HÌNH CHIẾN ĐẤU: đấu trainer/gym/raid/giải đấu, đổi đội, dùng túi
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  const STAT_LABEL = { atk: 'Tấn công', def: 'Phòng thủ', spa: 'TC đặc biệt', spd: 'PT đặc biệt', spe: 'Tốc độ', accuracy: 'Chính xác', evasion: 'Né tránh' };

  function b() { return ui.flow.battle; }
  let lastMove = null;
  let skillFlashTimer = 0;

  /** Nhãn hiển thị cho chiêu riêng / chiêu phối hợp đa hệ. */
  function flairOf(mv) {
    return PG.Formulas && PG.Formulas.moveFlair ? PG.Formulas.moveFlair(mv) : null;
  }
  function flairTag(flair) {
    if (!flair) return '';
    if (flair.kind === 'combo') {
      const icons = (flair.types || []).map(t => (PG.TYPES[t] || {}).icon || '').join('');
      return icons + ' ' + esc(flair.badge);
    }
    if (flair.kind === 'ultimate') return '🌟 ' + esc(flair.badge);
    if (flair.kind === 'evolution') return '⬆️ ' + esc(flair.badge);
    if (flair.kind === 'world') return '🌌 ' + esc(flair.badge);
    return '✦ ' + esc(flair.badge);
  }
  function activeOf(side) {
    const bb = b();
    if (!bb) return null;
    return bb[side].team[bb[side].active];
  }
  function hpPct(c) { return c ? PG.clamp((c.hp / c.maxHp) * 100, 0, 100) : 0; }
  function hpClass(c) {
    const p = hpPct(c);
    if (p <= 20) return 'is-low';
    if (p <= 50) return 'is-mid';
    return '';
  }
  function statusChip(c) {
    if (!c || !c.status) return '';
    const info = PG.STATUS_INFO[c.status];
    if (!info) return '';
    return '<span class="status-badge" style="--sc:' + info.color + '">' + info.icon + ' ' + info.name + '</span>';
  }
  function stageArrows(c) {
    let out = '';
    for (const [k, v] of Object.entries(c.stages || {})) {
      if (!v) continue;
      out += '<span class="stage-tag ' + (v > 0 ? 'up' : 'down') + '" title="' + STAT_LABEL[k] + '">' + STAT_LABEL[k].slice(0, 2) + (v > 0 ? '+' : '') + v + '</span>';
    }
    return out;
  }

  function combatantCard(c, side) {
    const isEnemy = side === 'enemy';
    const sp = PG.SPECIES[c.speciesId];
    // Hệ Lỗi đổi trong trận: ưu tiên hệ hiện tại của combatant.
    const types = (c.types && c.types.length ? c.types : PG.getTypes(c.p));
    const aura = ui.auraClassOf && c.p ? ui.auraClassOf(c.p) : '';
    const auraBadges = ((c.p && c.p.mutations) || []).filter(m => m === 'rainbow' || m === 'devil')
      .map(m => '<span class="combatant__aura-badge" style="--mc:' + PG.MUTATIONS[m].color + '">' + PG.MUTATIONS[m].badge + ' ' + PG.MUTATIONS[m].name + '</span>').join('');
    return '<div class="combatant combatant--' + side + (aura ? ' ' + aura : '') + (c.hp <= 0 ? ' is-fainted' : '') + '" data-uid="' + (c.p && c.p.uid || '') + '" data-side="' + side + '">' +
      '<div class="combatant__plate">' +
        '<div class="combatant__head">' +
          '<span class="combatant__name">' + esc(c.name) + '</span>' +
          '<span class="combatant__lv">Lv.' + c.level + '</span>' +
        '</div>' +
        '<div class="combatant__meta">' + ui.typeChips(types, true) + auraBadges + (c.heldItem ? '<span class="held-dot" title="' + esc(PG.itemInfo(c.heldItem).name) + '">' + PG.itemInfo(c.heldItem).icon + '</span>' : '') + '</div>' +
        '<div class="hp-line">' +
          '<div class="hp-bar' + (hpClass(c) ? ' ' + hpClass(c) : '') + '"><span class="hp-fill" style="width:' + hpPct(c) + '%"></span></div>' +
          '<span class="hp-label"><b class="hp-number">' + Math.max(0, Math.round(c.hp)) + '</b>/' + c.maxHp + '</span>' +
        '</div>' +
        '<div class="combatant__status">' + statusChip(c) + stageArrows(c) + '</div>' +
      '</div>' +
      '<div class="combatant__sprite">' + ui.spriteHtml(c.p, { size: isEnemy ? 'lg' : 'xl', cls: isEnemy ? 'sprite--enemy' : 'sprite--ally' }) + '</div>' +
      '</div>';
  }

  function moveButtons(c) {
    if (!c) return '';
    let out = '';
    for (let i = 0; i < 4; i++) {
      const entry = c.moves[i];
      if (!entry) {
        out += '<div class="move-btn is-empty"></div>';
        continue;
      }
      const mv = PG.getMove(entry.id);
      if (!mv) { out += '<div class="move-btn is-empty"></div>'; continue; }
      const t = PG.TYPES[mv.type];
      const flair = flairOf(mv);
      const secondType = flair && flair.kind === 'combo' && flair.types[1] ? PG.TYPES[flair.types[1]] : null;
      const styleId = PG.skillStyleOf ? PG.skillStyleOf(mv, c.speciesId) : null;
      const ppPct = entry.pp / Math.max(1, entry.maxPp);
      out += '<button class="move-btn' + (entry.pp <= 0 ? ' is-disabled' : '') +
        (flair ? ' move-btn--' + flair.kind : '') + '" data-act="battle-move" data-index="' + i + '"' +
        (flair && flair.world ? ' data-world="' + flair.world + '"' : '') +
        (styleId ? ' data-skill-style="' + styleId + '"' : '') +
        (entry.pp <= 0 ? ' disabled' : '') + ' style="--mt:' + t.color + ';--mtd:' + t.dark +
        (secondType ? ';--mt2:' + secondType.color : '') + '">' +
        '<span class="move-btn__top"><span class="move-btn__type">' + t.icon + ' ' + t.name + '</span>' +
          '<span class="move-btn__tags">' +
            (flair ? '<span class="move-btn__badge">' + flairTag(flair) + '</span>' : '') +
            '<span class="move-btn__cat">' + (mv.category === 'physical' ? 'Vật lý' : mv.category === 'special' ? 'Đặc biệt' : 'Trạng thái') + '</span>' +
          '</span></span>' +
        '<span class="move-btn__name">' + esc(mv.name) + '</span>' +
        '<span class="move-btn__bottom"><span class="move-btn__power">' + (mv.power ? '⚡ ' + mv.power : '✨ Hỗ trợ') + '</span>' +
          '<span class="move-btn__pp">' + entry.pp + '/' + entry.maxPp + '</span></span>' +
        '<span class="move-btn__ppbar"><span style="width:' + (ppPct * 100) + '%"></span></span>' +
        '</button>';
    }
    return out;
  }

  function teamDots(battle) {
    let out = '<div class="battle-team">';
    for (let i = 0; i < battle.player.team.length; i++) {
      const c = battle.player.team[i];
      out += '<span class="battle-team__dot' + (c.hp <= 0 ? ' is-dead' : '') + (i === battle.player.active ? ' is-active' : '') + '" title="' + esc(c.name) + ' (' + Math.max(0, Math.round(c.hp)) + ' HP)">' +
        '<span>' + (PG.SPECIES[c.speciesId] ? PG.TYPES[PG.SPECIES[c.speciesId].types[0]].icon : '●') + '</span></span>';
    }
    out += '</div>';
    const padTo = Math.max(battle.player.team.length, battle.enemy.team.length);
    for (let i = battle.player.team.length; i < padTo; i++) out += '<span class="battle-team__dot is-empty"></span>';
    return out;
  }

  function logHtml(battle) {
    const entries = battle.log.slice(-16);
    return entries.map(e => '<div class="battle-log__line tone-' + e.tone + '">' + esc(e.text) + '</div>').join('');
  }

  function battleScreen(battle) {
    const p = activeOf('player');
    const e = activeOf('enemy');
    const weather = PG.WEATHERS[battle.weather] || PG.WEATHERS.clear;
    const busy = ui.flow.battleBusy;
    const isBoss = e && e.isBoss;
    const region = PG.REGIONS[battle.regionId] || (PG.getRegion && PG.getRegion(battle.regionId)) || null;
    const arenaBg = (region && region.bg) || 'forest';
    const arenaMode = ['gym', 'tournament', 'raid', 'trainer', 'wild'].includes(battle.type) ? battle.type : 'wild';
    // Hiệu ứng vào sân chỉ chạy lần đầu tiên của mỗi trận, không chạy lại mỗi lượt.
    const fresh = ui.flow._arenaBattle !== battle;
    ui.flow._arenaBattle = battle;
    return '<div class="battle-screen weather-bg--' + (battle.weather || 'clear') +
        ' arena-bg--' + arenaBg + ' arena-mode--' + arenaMode + '">' +
      '<div class="battle-scene">' +
        '<div class="battle-scene__sky"></div>' +
        '<div class="battle-scene__ambient" aria-hidden="true"><span></span><span></span><span></span><span></span></div>' +
        '<div class="battle-scene__scenery" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>' +
        '<div class="battle-scene__mode" aria-hidden="true"></div>' +
        '<div class="battle-scene__ground"></div>' +
        (fresh ? '<div class="battle-map-fx" aria-hidden="true">' +
          '<span class="battle-map-fx__grid"></span><span class="battle-map-fx__sweep"></span>' +
          '<span class="battle-map-fx__ping"></span></div>' : '') +
        (region ? '<div class="battle-region">' + region.emoji + ' ' + esc(region.name) + '</div>' : '') +
        '<div class="battle-weather">' + weather.icon + ' ' + weather.name + '</div>' +
        '<div class="battle-turn">Lượt ' + battle.turn + '</div>' +
        '<div class="battle-enemy' + (isBoss ? ' is-boss' : '') + '">' + (e ? combatantCard(e, 'enemy') : '') + '</div>' +
        '<div class="battle-player">' + (p ? combatantCard(p, 'player') : '') + '</div>' +
        '<div class="battle-fx" id="battle-fx"></div>' +
      '</div>' +
      '<div class="battle-bottom">' +
        '<div class="battle-log" id="battle-log">' + logHtml(battle) + '</div>' +
        '<div class="battle-console">' +
          '<div class="battle-console__top">' +
            '<div class="battle-console__trainer"><span>' + (battle.type === 'wild' ? '🌿' : battle.type === 'tournament' ? '🏆' : battle.type === 'raid' ? '👹' : battle.type === 'gym' ? '🏟️' : '🧑‍🌾') + '</span>' +
              '<div><strong>' + esc(battle.title) + '</strong><small>' + esc(battle.subtitle || '') + '</small></div></div>' +
            '<div class="battle-console__meta">' + teamDots(battle) +
              '<button class="icon-btn icon-btn--sm" data-act="battle-fast" title="Tua nhanh">' + (ui.flow.battleFast ? '⏩' : '▶️') + '</button>' +
              '<button class="icon-btn icon-btn--sm" data-act="battle-flee" title="Bỏ chạy">🏃</button>' +
            '</div>' +
          '</div>' +
          '<div class="moves-grid' + (busy ? ' is-busy' : '') + '">' + (p ? moveButtons(p) : '') + '</div>' +
          '<div class="battle-tools">' +
            '<button class="tool-btn" data-act="battle-switch" ' + (busy ? 'disabled' : '') + '><span>🔄</span>Đổi Pokémon</button>' +
            '<button class="tool-btn" data-act="battle-bag" ' + (busy ? 'disabled' : '') + '><span>🎒</span>Túi đồ</button>' +
            (battle.type === 'wild'
              ? '<button class="tool-btn tool-btn--gold" data-act="battle-catch"' + (busy ? ' disabled' : '') + '><span>🎯</span>Bắt ngay</button>'
              : '<button class="tool-btn" data-act="battle-flee" ' + (busy ? 'disabled' : '') + '><span>🏃</span>Bỏ chạy</button>') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function teamPreview(battle) {
    return battle.player.team.map((c, i) => {
      const sp = PG.SPECIES[c.speciesId];
      return '<span class="vs-mon' + (c.hp <= 0 ? ' is-dead' : '') + '">' + ui.spriteHtml(c.p, { size: 'xs' }) + '<small>' + esc(sp ? sp.name : c.name) + '</small></span>';
    }).join('');
  }

  function arenaHome() {
    const state = PG.getState();
    const region = PG.REGIONS[state.region] || PG.REGIONS.forest;
    const t = region.trainer, g = region.gym, rd = region.raid;
    const trainerDone = !PG.Battle.availableTrainer(region.id);
    const hasBadge = PG.Battle.hasBadge(region.id);
    const ready = state.team.filter(uid => {
      const p = state.pokemon.find(x => x.uid === uid);
      return p && p.hp > 0;
    });
    const bankHtml = lobbyCard(region, t, g, rd, trainerDone, hasBadge, state);
    return '<div class="battle-lobby">' +
      '<div class="page-head">' +
        '<div><p class="eyebrow">Đấu trường khu vực</p><h1>⚔️ Trung Tâm Chiến Đấu</h1>' +
        '<p class="muted">Rèn luyện đội hình, hạ gục Gym Leader và chinh phục Raid Boss.</p></div>' +
        '<div class="lobby-actions">' +
          '<span class="pill">🏆 ' + PG.fmt(state.stats.tournamentBest || 0) + ' vòng giải cao nhất</span>' +
          '<button class="btn btn--ghost btn--sm" data-act="heal-team">🏥 Hồi phục đội</button>' +
        '</div>' +
      '</div>' +

      (ready.length ? '' : '<div class="alert alert--warn">Đội của bạn không còn Pokémon nào tỉnh táo. Hãy hồi phục tại trung tâm hoặc dùng thuốc!</div>') +

      '<div class="lobby-grid">' +
        '<section class="panel lobby-main">' +
          '<div class="panel__head"><h3 class="panel__title">' + region.emoji + ' ' + region.name + '</h3><span class="badge">' + ready.length + '/' + state.team.length + ' sẵn sàng</span></div>' +
          '<div class="lobby-region">' +
            '<div class="lobby-region__bg region-bg--' + region.bg + '"></div>' +
            '<div class="lobby-region__team">' + (ready.length ? ready.map(uid => { const p = state.pokemon.find(x => x.uid === uid); return ui.spriteHtml(p, { size: 'md' }); }).join('') : '<span class="muted">Chưa có đội hình</span>') + '</div>' +
            '<div class="lobby-region__info"><strong>' + region.subtitle + '</strong><small>Thời tiết: ' + (PG.WEATHERS[PG.weatherFor(state, region.id)] || {}).name + '</small></div>' +
          '</div>' +
          '<div class="lobby-cards">' + bankHtml + '</div>' +
        '</section>' +

        '<aside class="lobby-side">' +
          '<section class="panel tournament-lobby">' +
            '<div class="panel__head"><h3 class="panel__title">🏆 Giải Đấu Chuyên Biệt</h3><span class="badge">1 lượt / ngày</span></div>' +
            '<p class="muted small">Ba bảng Tân Thủ, Chuyên Nghiệp và Huyền Thoại. Bảng càng cao yêu cầu đội càng mạnh, phí và thưởng càng lớn. Quà đặt lại mỗi ngày.</p>' +
            '<div class="tmt-tier-mini">' + PG.Tournament.TIERS.map(t =>
              '<span class="pill pill--sm" style="color:' + t.color + '">' + t.icon + ' ' + esc(t.name) + ' • ' + PG.fmt(t.fee) + ' Xu</span>').join('') + '</div>' +
            '<button class="btn btn--gold btn--sm btn--block" data-act="go" data-view="tournament">Vào bảng đấu</button>' +
          '</section>' +
          '<section class="panel tips-panel">' +
            '<h3 class="panel__title">💡 Bí kíp chiến đấu</h3>' +
            '<ul class="tips-list">' +
              '<li><b>May mắn</b> tăng tỉ lệ chí mạng và né đòn — trang bị có Luck rất quý.</li>' +
              '<li>Hệ <b>Thiên</b> có thể kích hoạt <b>THIÊN KHẮC</b>, nhân đôi hoặc x3 sát thương nhận vào.</li>' +
              '<li>Đổi Pokémon đúng lúc để tránh đòn khắc hệ và kích hoạt đặc tính như <b>Tái Sinh</b>.</li>' +
              '<li>Trang bị <b>Bộ Cỏ Bốn Lá</b> cho cả đội để nhận thêm Luck và Né đòn.</li>' +
            '</ul>' +
          '</section>' +
        '</aside>' +
      '</div>' +
    '</div>';
  }

  function lobbyCard(region, t, g, rd, trainerDone, hasBadge, state) {
    return '<div class="lobby-card lobby-card--trainer">' +
        '<div class="lobby-card__icon">🧑‍🌾</div>' +
        '<div class="lobby-card__body"><div class="lobby-card__tag">Trainer</div><strong>' + esc(t.name) + '</strong>' +
          '<small>' + esc(t.title) + ' • ' + t.team.length + ' Pokémon</small>' +
          '<div class="lobby-card__team">' + t.team.map(([sid]) => PG.SPECIES[sid] ? PG.TYPES[PG.SPECIES[sid].types[0]].icon : '?').join(' ') + '</div></div>' +
        '<button class="btn btn--challenge btn--sm" data-act="start-battle" data-kind="trainer" data-region="' + region.id + '">' + (trainerDone ? 'Tái đấu' : 'Thử thách') + '</button>' +
      '</div>' +
      '<div class="lobby-card lobby-card--gym">' +
        '<div class="lobby-card__icon">🏟️</div>' +
        '<div class="lobby-card__body"><div class="lobby-card__tag">Gym Leader</div><strong>' + esc(g.leader) + '</strong>' +
          '<small>' + esc(g.title) + ' • ' + g.team.length + ' Pokémon</small>' +
          '<div class="lobby-card__team">' + g.team.map(([sid]) => PG.SPECIES[sid] ? PG.TYPES[PG.SPECIES[sid].types[0]].icon : '?').join(' ') + '</div></div>' +
        '<button class="btn btn--challenge btn--sm" data-act="start-battle" data-kind="gym" data-region="' + region.id + '">' + (hasBadge ? 'Tái đấu' : 'Thách đấu') + '</button>' +
      '</div>' +
      '<div class="lobby-card lobby-card--raid">' +
        '<div class="lobby-card__icon">👹</div>' +
        '<div class="lobby-card__body"><div class="lobby-card__tag">Raid Boss</div><strong>' + esc(rd.name) + '</strong>' +
          '<small>Lv.' + rd.level + ' • ' + PG.fmt(rd.reward.coins) + ' Xu • Vé: ' + (state.bag['raid-pass'] || 0) + '</small>' +
          '<div class="lobby-card__team">' + ui.spriteHtml(PG.SPECIES[rd.boss], { size: 'xs' }) + ' <span class="muted small">HP x' + (rd.hpMult || 5) + '</span></div></div>' +
        '<button class="btn btn--challenge btn--sm" data-act="start-battle" data-kind="raid" data-region="' + region.id + '">Raid</button>' +
      '</div>';
  }

  ui.views.battle = function () {
    const battle = b();
    // Giữ sân đấu trong lúc phát lại hiệu ứng dù trận đã kết thúc — không "out ra" sớm.
    if (battle && (!battle.over || (ui.flow.battleBusy && ui.flow.battlePlayback))) return battleScreen(battle);
    return arenaHome();
  };

  ui.mounted.battle = function (root) {
    if (b()) {
      const log = document.getElementById('battle-log');
      if (log) log.scrollTop = log.scrollHeight;
    }
  };

  /* ---------------- KHỞI CHIẾN ---------------- */
  ui.actions['start-battle'] = function (el) {
    const kind = el.dataset.kind;
    const region = el.dataset.region;
    let res;
    if (kind === 'trainer') res = PG.Battle.startTrainer(region);
    else if (kind === 'gym') res = PG.Battle.startGym(region);
    else res = PG.Battle.startRaid(region);
    if (!res.ok) { ui.toast(res.msg, 'error'); PG.Audio.play('error'); return; }
    ui.flow.battle = res.battle;
    ui.flow.battleBusy = false;
    ui.flow.battleFast = PG.getState().settings.fast;
    PG.Audio.play('open');
    ui.render();
    if (res.events && res.events.length) playEvents(res.events, function () { });
  };

  /** Trận lang thang: đối thủ ra 3 hay 6 thì người chơi ra đúng số đó. */
  function startRoamingNow(uids) {
    const res = PG.Battle.startRoamingTrainer({ uids: uids || null });
    if (!res.ok) { ui.toast(res.msg, 'error'); PG.Audio.play('error'); return; }
    ui.closeModal();
    ui.flow.battle = res.battle;
    ui.flow.battleBusy = false;
    ui.flow.battleFast = PG.getState().settings.fast;
    PG.Audio.play('open');
    ui.render();
    if (res.events && res.events.length && ui.playBattleEvents) ui.playBattleEvents(res.events, function () { });
  }

  ui.actions['roaming-team-select'] = function () {
    const state = PG.getState();
    const rt = state.roamingTrainer;
    if (!rt || !(rt.expiresAt > Date.now())) { ui.toast('Không còn thử thách lang thang.', 'error'); return; }
    const size = PG.clamp(rt.teamSize || (rt.team || []).length || 3, 1, 6);
    const ready = state.team.map(uid => state.pokemon.find(p => p.uid === uid)).filter(p => p && p.hp > 0);
    if (ready.length <= size) { startRoamingNow(null); return; }
    ui.modal({
      title: 'Chọn đội ' + size + ' Pokémon',
      subtitle: 'Trận này dùng đúng ' + size + ' Pokémon — trong trận vẫn đổi được.',
      body: '<p class="muted small">Đối thủ mang ' + size + ' Pokémon. Chọn đúng ' + size + ' từ đội của bạn.</p>' +
        '<div class="switch-grid">' + ready.map((p, i) =>
          '<label class="switch-card"><input type="checkbox" class="roam-pick" value="' + esc(p.uid) + '"' +
          (i < size ? ' checked' : '') + '>' + ui.spriteHtml(p, { size: 'md' }) +
          '<span class="switch-card__body"><strong>' + esc(p.nickname || PG.SPECIES[p.speciesId].name) +
          '</strong><small>Lv.' + p.level + ' • ' + Math.round(p.hp) + ' HP</small></span></label>').join('') + '</div>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>' +
        '<button class="btn btn--primary" data-act="roaming-team-confirm" data-size="' + size + '">Đấu ' + size + ' con</button>',
      size: 'md'
    });
  };

  ui.actions['roaming-team-confirm'] = function (el) {
    const size = Number(el.dataset.size) || 6;
    const uids = Array.from(document.querySelectorAll('.roam-pick:checked')).map(x => x.value).slice(0, size);
    if (uids.length !== size) { ui.toast('Hãy chọn đúng ' + size + ' Pokémon.', 'warn'); return; }
    startRoamingNow(uids);
  };

  ui.actions['battle-fast'] = function () {
    ui.flow.battleFast = !ui.flow.battleFast;
    ui.render();
  };

  /* ---------------- HÀNH ĐỘNG ---------------- */
  function afterAction(res) {
    const bb = b();
    if (!res.ok) {
      ui.toast(res.msg, res.needSwitch ? 'warn' : 'error');
      if (res.needSwitch || (bb && bb.awaitingSwitch)) promptSwitch(true);
      return;
    }
    // Không render lại ngay: render lúc này sẽ cho HP về số cuối trước khi chiêu địch
    // kịp hiện banner/log. Giữ DOM cũ, khóa nút, để playEvents tự cập nhật HP theo sự kiện.
    ui.flow.battleBusy = true;
    ui.flow.battlePlayback = true;
    const grid = document.querySelector('.moves-grid');
    if (grid) grid.classList.add('is-busy');
    document.querySelectorAll('.moves-grid button, .battle-tools button, [data-act="battle-fast"], [data-act="battle-flee"]')
      .forEach(el => { el.disabled = true; });
    playEvents(res.events || [], function () {
      ui.flow.battleBusy = false;
      ui.flow.battlePlayback = false;
      const battle = b();
      if (!battle) return;
      if (battle.over) {
        if (battle.tournament && PG.Tournament) {
          battle.tournamentResult = PG.Tournament.recordResult(battle);
          ui.refreshTopbar();
        }
        showEnd(battle);
        return;
      }
      if (battle.awaitingSwitch) {
        ui.render();
        promptSwitch(true);
        return;
      }
      ui.render();
    });
  }

  ui.actions['battle-move'] = function (el) {
    if (ui.flow.battleBusy) return;
    const idx = Number(el.dataset.index);
    const battle = b();
    if (!battle) return;
    afterAction(PG.Battle.takeTurn(battle, { type: 'move', index: idx }));
  };

  ui.actions['battle-switch'] = function () {
    promptSwitch(false);
  };

  ui.actions['battle-switch-choose'] = function (el) {
    const idx = Number(el.dataset.index);
    ui.closeModal();
    const battle = b();
    if (!battle) return;
    afterAction(PG.Battle.doSwitch(battle, idx, []));
  };

  ui.actions['battle-bag'] = function () {
    const state = PG.getState();
    const battle = b();
    if (!battle) return;
    const usable = Object.keys(PG.MEDICINES).filter(id => (state.bag[id] || 0) > 0);
    if (!usable.length) { ui.toast('Bạn không có thuốc nào có thể dùng trong trận.', 'warn'); return; }
    const active = activeOf('player');
    const body = '<div class="battle-bag-list">' + usable.map(id => {
      const info = PG.MEDICINES[id];
      if (info.stamina) return '';
      return '<button class="battle-bag-item" data-act="battle-item" data-id="' + id + '">' +
        ui.itemIcon(id, 'md') +
        '<span class="battle-bag-item__body"><strong>' + esc(info.name) + ' <b>x' + state.bag[id] + '</b></strong><small>' + esc(info.desc) + '</small></span>' +
        (info.revive ? '<span class="btn btn--ghost btn--sm">Dùng</span>' : active && active.hp <= 0 ? '<span class="muted small">Cần Revive</span>' : '<span class="btn btn--ghost btn--sm">Dùng</span>') +
        '</button>';
    }).join('') + '</div>';
    ui.modal({
      title: '🎒 Túi đồ', subtitle: 'Dùng thuốc cho Pokémon đang ra sân (' + (active ? esc(active.name) : '') + ')',
      body, size: 'md'
    });
  };

  ui.actions['battle-item'] = function (el) {
    ui.closeModal();
    const battle = b();
    const active = activeOf('player');
    if (!battle || !active) return;
    afterAction(PG.Battle.doItem(battle, el.dataset.id, active.p && active.p.uid, []));
  };

  ui.actions['battle-flee'] = function () {
    if (ui.flow.battleBusy) return;
    const battle = b();
    if (!battle || battle.over) return;
    if (battle.type === 'wild') {
      ui.confirm('Kết thúc đánh yếu?', 'HP đã giảm sẽ được giữ lại để bạn quay ra ném bóng.', function () {
        ui.actions['battle-catch']();
      }, { okText: 'Quay lại bắt', danger: false });
      return;
    }
    ui.confirm('Bỏ chạy?', 'Bạn sẽ thua trận này và mất một phần Xu. Riêng Gym/Raid, bạn có thể thử lại sau.', function () {
      afterAction(PG.Battle.takeTurn(battle, { type: 'flee' }));
    }, { okText: 'Bỏ chạy', danger: true });
  };

  ui.actions['battle-catch'] = function () {
    const battle = b();
    if (!battle || battle.type !== 'wild') return;
    const enc = battle.wildEncounter || ui.flow.encounter;
    const res = PG.Battle.finishWild(battle);
    if (!res.ok) { ui.toast(res.msg, 'error'); return; }
    ui.closeModal();
    ui.flow.encounter = enc;
    ui.flow.battle = null;
    ui.flow.battleBusy = false;
    PG.Audio.play('throw');
    ui.toast('Đã làm yếu ' + PG.SPECIES[enc.pokemon.speciesId].name + ' — ném bóng ngay!', 'gold');
    ui.go('catch');
  };

  function promptSwitch(forced) {
    const battle = b();
    if (!battle) return;
    const team = battle.player.team;
    const cards = team.map((c, i) => {
      const sp = PG.SPECIES[c.speciesId];
      return '<button class="switch-card' + (c.hp <= 0 ? ' is-dead' : '') + (i === battle.player.active ? ' is-active' : '') + '" data-act="battle-switch-choose" data-index="' + i + '"' + (c.hp <= 0 ? ' disabled' : '') + '>' +
        ui.spriteHtml(c.p, { size: 'md' }) +
        '<span class="switch-card__body"><strong>' + esc(c.name) + '</strong><small>Lv.' + c.level + ' • ' + Math.max(0, Math.round(c.hp)) + '/' + c.maxHp + ' HP</small>' +
          ui.bar(c.hp, c.maxHp, 'bar--hp') + ui.typeChips(sp.types, true) + '</span>' +
        '</button>';
    }).join('');
    ui.modal({
      title: forced ? 'Chọn Pokémon tiếp theo' : '🔄 Đổi Pokémon',
      subtitle: forced ? 'Pokémon đang ra sân đã ngất. Hãy chọn một Pokémon khác!' : 'Đổi Pokémon sẽ tốn lượt — đối thủ được tấn công trước.',
      body: '<div class="switch-grid">' + cards + '</div>',
      size: 'md',
      closable: !forced
    });
  }

  /* ---------------- PLAYBACK ---------------- */
  function fxLife() { return ui.flow.battleFast ? 260 : 950; }
  function fxColor(type) {
    const t = type && PG.TYPES[type];
    return t ? t.color : '#ffd166';
  }
  function fxPoint(card, x, y) {
    const scene = document.querySelector('.battle-scene');
    if (!card || !scene) return null;
    const r = card.getBoundingClientRect();
    const s = scene.getBoundingClientRect();
    return {
      x: r.left - s.left + r.width * (x === undefined ? 0.5 : x),
      y: r.top - s.top + r.height * (y === undefined ? 0.42 : y)
    };
  }
  function fxTypeKey(type) {
    return type && PG.TYPES[type] ? type : 'normal';
  }

  /**
   * Hiệu ứng va chạm riêng theo hệ: mỗi hệ có hình hạt, màu, quầng và nhịp
   * khác nhau (lửa bén, nước bắn, điện giật, băng vỡ, ma tan, rồng xoáy…).
   */
  function spawnTypeImpact(card, type, strong) {
    const fx = document.getElementById('battle-fx');
    const p = fxPoint(card, 0.5, 0.48);
    if (!fx || !p) return;
    const t = fxTypeKey(type);
    const el = document.createElement('span');
    el.className = 'fx-type fx-type--' + t + (strong ? ' is-strong' : '');
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    el.style.setProperty('--fx-color', fxColor(t));
    el.style.setProperty('--fx-dur', (ui.flow.battleFast ? 260 : 760) + 'ms');
    const count = strong ? 16 : 11;
    for (let i = 0; i < count; i++) {
      const part = document.createElement('i');
      part.style.setProperty('--a', (i * (360 / count) + (i % 4) * 6) + 'deg');
      part.style.setProperty('--d', (strong ? 46 : 34) + (i % 4) * 9 + 'px');
      part.style.setProperty('--delay', ((i % 6) * 17) + 'ms');
      part.style.setProperty('--s', (0.62 + (i % 3) * 0.22).toFixed(2));
      el.appendChild(part);
    }
    fx.appendChild(el);
    setTimeout(() => el.remove(), ui.flow.battleFast ? 320 : 840);
  }

  function damageType(ev) {
    if (ev.source === 'player' || ev.source === 'enemy') return lastMove ? lastMove.type : 'normal';
    if (ev.source === 'burn' || ev.source === 'solar-power') return 'fire';
    if (ev.source === 'poison' || ev.source === 'toxic') return 'poison';
    if (ev.source === 'leech') return 'grass';
    if (ev.source === 'sandstorm') return 'rock';
    if (ev.source === 'recoil') return 'fighting';
    if (ev.source === 'life-orb' || ev.source === 'confusion') return 'psychic';
    return 'normal';
  }

  function spawnBeam(ev) {
    const fx = document.getElementById('battle-fx');
    if (!fx) return;
    const fromCard = document.querySelector('.combatant--' + ev.side);
    const toCard = document.querySelector('.combatant--' + (ev.side === 'player' ? 'enemy' : 'player'));
    const a = fxPoint(fromCard), z = fxPoint(toCard);
    if (!a || !z) return;
    const dx = z.x - a.x, dy = z.y - a.y;
    const len = Math.hypot(dx, dy);
    const el = document.createElement('span');
    el.className = 'fx-beam fx-beam--' + ev.side + ' fx-type--' + fxTypeKey(ev.moveType);
    el.style.left = a.x + 'px';
    el.style.top = a.y + 'px';
    el.style.width = Math.max(40, len) + 'px';
    el.style.setProperty('--fx-rot', Math.atan2(dy, dx) + 'rad');
    el.style.setProperty('--fx-color', fxColor(ev.moveType));
    el.style.setProperty('--fx-dur', (ui.flow.battleFast ? 240 : 520) + 'ms');
    fx.appendChild(el);
    setTimeout(() => el.remove(), ui.flow.battleFast ? 260 : 560);
  }
  function spawnBurst(card, kind, color) {
    const fx = document.getElementById('battle-fx');
    const p = fxPoint(card);
    if (!fx || !p) return;
    const el = document.createElement('span');
    el.className = 'fx-burst' + (kind ? ' is-' + kind : '');
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    el.style.setProperty('--fx-color', color || '#ffd166');
    el.style.setProperty('--fx-dur', (ui.flow.battleFast ? 240 : 620) + 'ms');
    for (let i = 0; i < 9; i++) {
      const dot = document.createElement('i');
      dot.style.setProperty('--a', (i * 40 - 20) + 'deg');
      dot.style.setProperty('--r', (18 + (i % 3) * 11) + 'px');
      el.appendChild(dot);
    }
    fx.appendChild(el);
    setTimeout(() => el.remove(), ui.flow.battleFast ? 260 : 660);
  }

  /**
   * Phóng chiêu: vòng bung tại người dùng → quả cầu có đuôi → tóe sáng khi chạm.
   * Phong cách chiêu (--sk-a/b/c) tự động thừa hưởng từ #battle-fx.
   */
  function spawnProjectile(ev, index, styleId) {
    const fx = document.getElementById('battle-fx');
    if (!fx) return;
    const fromCard = document.querySelector('.combatant--' + ev.side);
    const toCard = document.querySelector('.combatant--' + (ev.side === 'player' ? 'enemy' : 'player'));
    const a = fxPoint(fromCard), z = fxPoint(toCard);
    if (!a || !z) return;
    const multi = Number.isInteger(index);
    const dur = ui.flow.battleFast ? 220 : 440;
    const delay = multi ? (ui.flow.battleFast ? index * 28 : index * 95) : 0;
    const type = fxTypeKey(ev.moveType);
    const color = fxColor(ev.moveType);
    const dx = (z.x - a.x) + 'px';
    const dy = (z.y - a.y) + 'px';
    const rot = Math.atan2(z.y - a.y, z.x - a.x) + 'rad';
    const extras = [];

    // Vòng sáng bung ra từ chỗ chiêu được phóng.
    const launch = document.createElement('span');
    launch.className = 'fx-launch fx-launch--' + ev.side + ' fx-type--' + type;
    launch.style.left = a.x + 'px';
    launch.style.top = a.y + 'px';
    launch.style.setProperty('--fx-color', color);
    launch.style.setProperty('--fx-dur', (ui.flow.battleFast ? 200 : 400) + 'ms');
    launch.style.animationDelay = delay + 'ms';
    if (styleId) launch.dataset.skillStyle = styleId;
    fx.appendChild(launch);
    extras.push(launch);

    // Đuôi sao chổi bay cùng quả cầu (dài hơn, mờ dần).
    const comet = document.createElement('span');
    comet.className = 'fx-comet fx-comet--' + ev.side + ' fx-type--' + type;
    comet.style.left = a.x + 'px';
    comet.style.top = a.y + 'px';
    comet.style.setProperty('--dx', dx);
    comet.style.setProperty('--dy', dy);
    comet.style.setProperty('--fx-rot', rot);
    comet.style.setProperty('--fx-color', color);
    comet.style.setProperty('--fx-dur', dur + 'ms');
    comet.style.animationDelay = delay + 'ms';
    if (styleId) comet.dataset.skillStyle = styleId;
    fx.appendChild(comet);
    extras.push(comet);

    // Quả cầu chính.
    const el = document.createElement('span');
    el.className = 'fx-projectile fx-projectile--' + ev.side + ' fx-type--' + type +
      (multi ? ' is-multi' : '') + ' is-launch';
    el.style.left = a.x + 'px';
    el.style.top = a.y + 'px';
    el.style.setProperty('--dx', dx);
    el.style.setProperty('--dy', dy);
    el.style.setProperty('--fx-color', color);
    el.style.setProperty('--fx-dur', dur + 'ms');
    el.style.animationDelay = delay + 'ms';
    if (styleId) el.dataset.skillStyle = styleId;
    fx.appendChild(el);
    extras.push(el);

    // Tóe sáng đúng lúc quả cầu chạm mục tiêu.
    const impact = document.createElement('span');
    impact.className = 'fx-impact fx-type--' + type;
    impact.style.left = z.x + 'px';
    impact.style.top = z.y + 'px';
    impact.style.setProperty('--fx-color', color);
    impact.style.setProperty('--fx-dur', (ui.flow.battleFast ? 200 : 420) + 'ms');
    impact.style.animationDelay = (delay + dur - 60) + 'ms';
    if (styleId) impact.dataset.skillStyle = styleId;
    fx.appendChild(impact);
    extras.push(impact);

    setTimeout(() => extras.forEach(x => x.remove()), dur + delay + (ui.flow.battleFast ? 260 : 520));
  }

  /** Đòn tiếp xúc: vệt cào chéo ngay tại mục tiêu, không dùng quả cầu. */
  function spawnSlash(card, color, index, type) {
    const fx = document.getElementById('battle-fx');
    const p = fxPoint(card);
    if (!fx || !p) return;
    const dur = ui.flow.battleFast ? 220 : 430;
    const delay = Number.isInteger(index) ? (ui.flow.battleFast ? index * 28 : index * 95) : 0;
    const el = document.createElement('span');
    el.className = 'fx-slash' + ' fx-type--' + fxTypeKey(type) + (Number.isInteger(index) ? ' is-multi' : '');
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    el.style.setProperty('--fx-color', color || '#ffd166');
    el.style.setProperty('--fx-dur', dur + 'ms');
    el.style.animationDelay = delay + 'ms';
    fx.appendChild(el);
    setTimeout(() => el.remove(), dur + delay + (ui.flow.battleFast ? 40 : 80));
  }

  /** Chiêu trạng thái: vòng phát sáng bao quanh mục tiêu, khác đòn sát thương. */
  function spawnAura(card, color, type) {
    const fx = document.getElementById('battle-fx');
    const p = fxPoint(card, 0.5, 0.5);
    if (!fx || !p) return;
    const el = document.createElement('span');
    el.className = 'fx-aura fx-type--' + fxTypeKey(type);
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    el.style.setProperty('--fx-color', color || '#a78bfa');
    el.style.setProperty('--fx-dur', (ui.flow.battleFast ? 260 : 620) + 'ms');
    fx.appendChild(el);
    setTimeout(() => el.remove(), ui.flow.battleFast ? 300 : 680);
  }

  /** Vệt chéo tại chỗ né/trượt — khác hẳn hiệu ứng trúng đòn. */
  function spawnSwoosh(card, color) {
    const fx = document.getElementById('battle-fx');
    const p = fxPoint(card);
    if (!fx || !p) return;
    const el = document.createElement('span');
    el.className = 'fx-swoosh';
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    el.style.setProperty('--fx-color', color || '#a5f3fc');
    el.style.setProperty('--fx-dur', (ui.flow.battleFast ? 260 : 560) + 'ms');
    fx.appendChild(el);
    setTimeout(() => el.remove(), ui.flow.battleFast ? 280 : 600);
  }

  /** Ảnh mờ đuôi cho động tác né: sprite thật được nhân bản, không phải icon chung. */
  function spawnGhosts(card, dir) {
    const fx = document.getElementById('battle-fx');
    const scene = document.querySelector('.battle-scene');
    const sprite = card && card.querySelector('.combatant__sprite .sprite');
    if (!fx || !scene || !sprite) return;
    const r = sprite.getBoundingClientRect(), s = scene.getBoundingClientRect();
    for (let i = 0; i < 3; i++) {
      const ghost = sprite.cloneNode(false);
      ghost.removeAttribute('id');
      ghost.className = 'fx-ghost';
      ghost.style.left = (r.left - s.left) + 'px';
      ghost.style.top = (r.top - s.top) + 'px';
      ghost.style.width = r.width + 'px';
      ghost.style.height = r.height + 'px';
      ghost.style.setProperty('--gx', ((dir || 1) * (18 + i * 16)) + 'px');
      ghost.style.setProperty('--fx-dur', (ui.flow.battleFast ? 220 : 460) + 'ms');
      ghost.style.animationDelay = (i * 45) + 'ms';
      fx.appendChild(ghost);
      setTimeout(() => ghost.remove(), (ui.flow.battleFast ? 260 : 520) + i * 45);
    }
  }

  function pulseCard(card, cls, ms) {
    if (!card) return;
    card.classList.add(cls);
    setTimeout(() => card.classList.remove(cls), ms);
  }

  function floatText(card, text, cls, life) {
    if (!card) return;
    const fx = document.getElementById('battle-fx');
    if (!fx) return;
    const rect = card.getBoundingClientRect();
    const scene = document.querySelector('.battle-scene');
    if (!scene) return;
    const srect = scene.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'float-text ' + (cls || '');
    el.textContent = text;
    el.style.left = (rect.left - srect.left + rect.width / 2) + 'px';
    el.style.top = (rect.top - srect.top + rect.height * 0.35) + 'px';
    el.style.setProperty('--fx-dur', (life || fxLife()) + 'ms');
    fx.appendChild(el);
    setTimeout(() => el.remove(), life || fxLife());
  }

  function cardOf(uid) {
    if (!uid) return null;
    return document.querySelector('.combatant[data-uid="' + uid + '"]');
  }

  function updateHp(card, hp, maxHp) {
    if (!card) return;
    const pct = PG.clamp(hp / maxHp * 100, 0, 100);
    const fill = card.querySelector('.hp-fill');
    const num = card.querySelector('.hp-number');
    const bar = card.querySelector('.hp-bar');
    if (fill) fill.style.width = pct + '%';
    if (num) num.textContent = Math.max(0, Math.round(hp));
    if (bar) {
      bar.classList.toggle('is-low', pct <= 20);
      bar.classList.toggle('is-mid', pct > 20 && pct <= 50);
    }
    card.classList.toggle('is-fainted', hp <= 0);
  }

  function addStatus(card, status) {
    if (!card) return;
    const host = card.querySelector('.combatant__status');
    if (!host) return;
    const old = host.querySelector('.status-badge');
    if (old) old.remove();
    if (status) {
      const info = PG.STATUS_INFO[status];
      if (info) {
        const span = document.createElement('span');
        span.className = 'status-badge';
        span.style.setProperty('--sc', info.color);
        span.textContent = info.icon + ' ' + info.name;
        host.appendChild(span);
      }
    }
  }

  function playEvents(events, done) {
    const battle = b();
    if (!battle) { done && done(); return; }
    lastMove = null;
    let i = 0;
    const fast = !!ui.flow.battleFast;
    const step = () => {
      if (!b()) { done && done(); return; }
      if (i >= events.length) { done && done(); return; }
      const ev = events[i++];
      const isEnd = ev.type === 'end';
      const delay = handleEvent(ev, fast);
      // finishBattle luôn đẩy 'end' cuối cùng: hiện bảng thắng/thua ngay tại sự kiện này,
      // không chờ thêm 300ms rồi mới gọi done().
      if (isEnd) { done && done(); return; }
      setTimeout(step, delay);
    };
    step();
  }

  function handleEvent(ev, fast) {
    const battle = b();
    if (!battle) return 0;
    const log = document.getElementById('battle-log');
    const card = cardOf(ev.uid);
    const base = fast ? 35 : 1;
    switch (ev.type) {
      case 'text':
        if (log) {
          const div = document.createElement('div');
          div.className = 'battle-log__line tone-' + ev.tone;
          div.textContent = ev.text;
          log.appendChild(div);
          log.scrollTop = log.scrollHeight;
        }
        return (ev.tone === 'move' || ev.tone === 'crit' ? 380 : 260) * base;
      case 'move': {
        const type = fxTypeKey(ev.moveType);
        lastMove = { type, category: ev.category, contact: !!ev.contact };
        const usedMove = PG.getMove(ev.moveId);
        const flair = flairOf(usedMove);
        const actorP = ev.uid && PG.getState().pokemon.find(p => p.uid === ev.uid);
        const styleId = PG.skillStyleOf && usedMove ? PG.skillStyleOf(usedMove, actorP && actorP.speciesId) : null;
        // Giữ nhãn chiêu riêng/combo suốt trận để FX sau đó cũng nhận diện được.
        const fxLayer = document.getElementById('battle-fx');
        if (fxLayer) {
          fxLayer.dataset.flair = flair ? flair.kind : '';
          if (styleId) fxLayer.dataset.skillStyle = styleId;
          else delete fxLayer.dataset.skillStyle;
        }
        const banner = document.createElement('div');
        banner.className = 'move-banner fx-type--' + type + (flair ? ' is-' + flair.kind : '');
        // Tách nhãn ra span riêng để nâng cấp FX mà không làm mất chữ khi giảm chuyển động.
        banner.innerHTML =
          '<span class="move-banner__label">' + esc(ev.moveName) + (ev.multihit ? ' ×' + (ev.hits || 2) : '') + '</span>' +
          (flair ? '<span class="move-banner__tag">' + flairTag(flair) + '</span>' : '') +
          '<i class="move-banner__trail" aria-hidden="true"></i>';
        banner.style.setProperty('--fx-color', fxColor(ev.moveType));
        if (styleId) banner.dataset.skillStyle = styleId;
        if (flair) {
          banner.dataset.tag = flairTag(flair);
          if (flair.kind === 'combo' && flair.types[1]) {
            banner.style.setProperty('--fx-color2', (PG.TYPES[flair.types[1]] || {}).color || '#fff');
          }
          if (flair.world) banner.dataset.world = flair.world;
        }
        banner.classList.add(ev.category === 'status' ? 'is-status' : ev.contact ? 'is-contact' : 'is-special');
        const scene = document.querySelector('.battle-scene');
        if (scene) {
          scene.appendChild(banner);
          setTimeout(() => banner.remove(), ui.flow.battleFast ? 260 : 700);
          // Sóng năng lượng lan khắp nền sân cho chiêu có nhãn riêng.
          if (flair || styleId) {
            scene.dataset.skillFlair = flair ? flair.kind : 'normal';
            if (styleId) scene.dataset.skillStyle = styleId;
            if (flair && flair.world) scene.dataset.skillWorld = flair.world;
            scene.classList.add('is-skill-flash');
            clearTimeout(skillFlashTimer);
            skillFlashTimer = setTimeout(function () {
              scene.classList.remove('is-skill-flash');
              delete scene.dataset.skillFlair;
              delete scene.dataset.skillStyle;
              delete scene.dataset.skillWorld;
            }, ui.flow.battleFast ? 260 : 620);
          }
        }

        const attacker = document.querySelector('.combatant--' + ev.side);
        const target = document.querySelector('.combatant--' + (ev.side === 'player' ? 'enemy' : 'player'));
        const color = fxColor(ev.moveType);
        if (ev.category === 'status') {
          spawnAura(target, color, type);
          pulseCard(attacker, 'is-casting', ui.flow.battleFast ? 180 : 420);
        } else {
          pulseCard(attacker, 'is-attacking', ui.flow.battleFast ? 200 : 340);
          const bursts = ev.multihit ? Math.min(3, Math.max(2, ev.hits || 2)) : 1;
          for (let k = 0; k < bursts; k++) {
            if (ev.contact) spawnSlash(target, color, ev.multihit ? k : undefined, type);
            else {
              if (!ev.multihit) spawnBeam(ev);
              spawnProjectile(ev, ev.multihit ? k : undefined, styleId);
            }
          }
        }
        PG.Audio.play('click');
        return 300 * base;
      }
      case 'dodge': {
        const target = cardOf(ev.uid) || document.querySelector('.combatant--' + ev.side);
        const dir = ev.side === 'player' ? -1 : 1;
        pulseCard(target, 'is-dodging', ui.flow.battleFast ? 220 : 520);
        spawnGhosts(target, dir);
        spawnSwoosh(target, fxColor(ev.moveType));
        floatText(target, 'NÉ!', 'fx-callout dodge', ui.flow.battleFast ? 320 : 900);
        PG.Audio.play('click');
        return 420 * base;
      }
      case 'miss': {
        const attacker = cardOf(ev.uid) || document.querySelector('.combatant--' + ev.side);
        const target = document.querySelector('.combatant--' + ev.targetSide);
        pulseCard(attacker, 'is-missing', ui.flow.battleFast ? 200 : 340);
        spawnSwoosh(target, fxColor(ev.moveType));
        floatText(target, 'TRƯỢT!', 'fx-callout miss', ui.flow.battleFast ? 320 : 900);
        return 340 * base;
      }
      case 'damage': {
        updateHp(card, ev.hpAfter, ev.maxHp);
        floatText(card, '-' + ev.amount, ev.crit ? 'dmg crit' : 'dmg');
        if (card) {
          card.classList.add('is-hit');
          setTimeout(() => card.classList.remove('is-hit'), ui.flow.battleFast ? 200 : 320);
        }
        const eff = Number(ev.effectiveness || 1);
        if (eff > 1) floatText(card, 'SIÊU HIỆU QUẢ!', 'fx-callout super', ui.flow.battleFast ? 320 : 1100);
        else if (eff > 0 && eff < 1) floatText(card, 'Không hiệu quả…', 'fx-callout weak', ui.flow.battleFast ? 320 : 1100);
        if (ev.fracture) floatText(card, 'THIÊN KHẮC!', 'fx-callout fracture', ui.flow.battleFast ? 320 : 1200);
        const dmgType = damageType(ev);
        spawnBurst(card, ev.crit ? 'crit' : eff > 1 ? 'super' : 'hit', ev.fracture ? '#c084fc' : ev.crit ? '#ffd166' : fxColor(dmgType));
        spawnTypeImpact(card, dmgType, ev.crit || eff > 1 || !!ev.fracture);
        PG.Audio.play(ev.crit ? 'crit' : 'hit');
        return 330 * base;
      }
      case 'heal':
        updateHp(card, ev.hpAfter, ev.maxHp);
        floatText(card, '+' + ev.amount, 'heal');
        spawnBurst(card, 'heal', '#4ade80');
        PG.Audio.play('heal');
        return 280 * base;
      case 'faint':
        if (card) card.classList.add('is-fainted', 'is-fainting');
        floatText(card, 'NGẤT!', 'faint');
        spawnBurst(card, 'faint', '#f87171');
        PG.Audio.play('faint');
        return 520 * base;
      case 'status':
        if (card) {
          addStatus(card, ev.status);
          if (ev.status) {
            floatText(card, (PG.STATUS_INFO[ev.status] || {}).name || ev.status, 'status-txt');
            spawnBurst(card, 'status', (PG.STATUS_INFO[ev.status] || {}).color || '#a78bfa');
          }
        }
        return 250 * base;
      case 'stat': {
        const label = STAT_LABEL[ev.stat] || ev.stat;
        if (card) floatText(card, label + (ev.delta > 0 ? ' ↑' : ' ↓') + (Math.abs(ev.delta) > 1 ? ' x' + Math.abs(ev.delta) : ''), ev.delta > 0 ? 'buff' : 'debuff');
        return 220 * base;
      }
      case 'type': {
        const meta = card && card.querySelector('.combatant__meta');
        if (meta && Array.isArray(ev.types)) {
          const active = battle[ev.side] && battle[ev.side].team[battle[ev.side].active];
          let html = ui.typeChips(ev.types, true);
          if (active && active.heldItem) {
            html += '<span class="held-dot" title="' + esc(PG.itemInfo(active.heldItem).name) + '">' + PG.itemInfo(active.heldItem).icon + '</span>';
          }
          meta.innerHTML = html;
          floatText(card, 'ĐỔI HỆ!', 'fx-callout super', ui.flow.battleFast ? 320 : 900);
        }
        return 300 * base;
      }
      case 'switch': {
        const scene = document.querySelector('.battle-scene');
        if (scene) {
          scene.classList.add('switch-flash');
          setTimeout(() => scene.classList.remove('switch-flash'), ui.flow.battleFast ? 220 : 420);
        }
        return 320 * base;
      }
      case 'end':
        return 0;
      default:
        return 80 * base;
    }
  }

  function lootTilesHtml(battle) {
    if (!battle || battle.winner !== 'player' || !battle.reward) return '';
    const rw = battle.reward;
    const bonus = battle.bonusIds || {};
    const tiles = [];
    function add(icon, label, sub, isBonus) {
      tiles.push('<div class="battle-loot__tile' + (isBonus ? ' is-bonus' : '') + '">' +
        '<span class="battle-loot__icon">' + icon + '</span>' +
        '<span class="battle-loot__label">' + esc(label) + '</span>' +
        '<small>' + esc(sub || '') + '</small></div>');
    }
    if (rw.coins) add('🪙', '+' + PG.fmt(rw.coins) + ' Xu', 'Tiền thưởng');
    if (rw.stardust) add('✨', '+' + PG.fmt(rw.stardust), 'Bụi Sao');
    if (rw.diamonds) add('💎', '+' + rw.diamonds, 'Kim Cương');
    for (const [id, n] of Object.entries(rw.items || {})) {
      const info = PG.itemInfo(id) || {};
      add(info.icon || '📦', '+' + n + ' ' + (info.name || id), info.kind === 'ball' ? 'Bóng' : 'Vật phẩm', !!bonus[id]);
    }
    for (const [id, n] of Object.entries(rw.materials || {})) {
      const info = PG.itemInfo(id) || {};
      add(info.icon || '🧱', '+' + n + ' ' + (info.name || id), 'Vật liệu', !!bonus[id]);
    }
    for (const spec of [].concat(rw.equipment || [])) {
      const base = PG.EQUIPMENT_BASES && PG.EQUIPMENT_BASES[spec.baseId];
      if (base) add(base.icon || '🎁', base.name, 'Trang bị', true);
    }
    if (!tiles.length) return '';
    return '<div class="battle-loot">' +
      '<div class="battle-loot__title">🎁 Chiến lợi phẩm' +
        (Object.keys(bonus).length ? ' <span class="battle-loot__badge">CÓ QUÀ NGẪU NHIÊN</span>' : '') + '</div>' +
      '<div class="battle-loot__grid">' + tiles.join('') + '</div></div>';
  }

  function showEnd(battle) {
    const win = battle.winner === 'player';
    const draw = battle.winner === 'draw';
    const down = !!battle.targetDown;
    const title = battle.type === 'wild'
      ? (down ? '💀 Đánh quá tay!' : '🌿 Kết thúc đánh yếu')
      : win ? '🏆 Chiến thắng!' : draw ? '🤝 Hòa!' : '💀 Thất bại';
    const lines = (battle.rewardLines || []).map(l => '<li>' + esc(l) + '</li>').join('');
    const forced = draw ? '' : '';
    PG.Audio.play(win ? 'win' : 'lose');
    ui.modal({
      title,
      subtitle: battle.title + ' • ' + (battle.type === 'wild'
        ? (down ? 'Mục tiêu đã ngất, mất cơ hội bắt và không nhận XP' : 'Mục tiêu còn sống, sẵn sàng ném bóng')
        : battle.winner === 'player' ? 'Bạn đã thắng' : battle.winner === 'draw' ? 'Không ai thắng' : 'Bạn đã thua'),
      body: '<div class="battle-result ' + (win ? 'is-win' : '') + '">' +
        '<div class="battle-result__icon">' + (win ? '🏆' : draw ? '🤝' : '💀') + '</div>' +
        '<div class="battle-result__lines">' +
          (lines ? '<ul>' + lines + '</ul>' : '<p class="muted">Không có phần thưởng lần này.</p>') +
          (battle.rewardNote ? '<div class="alert alert--gold">' + esc(battle.rewardNote) + '</div>' : '') +
          (battle.tournamentResult && battle.tournamentResult.msg ? '<div class="alert alert--gold">' + esc(battle.tournamentResult.msg) + '</div>' : '') +
        '</div>' +
        lootTilesHtml(battle) +
      '</div>' + forced +
      (battle.type === 'wild' && down ? '<div class="alert">⚠️ Bạn đã đánh quá tay. Pokémon hoang dã ngất và biến mất — hãy tìm con khác. Trận đánh yếu không thưởng XP cho đội hình.</div>' : '') +
      (battle.type === 'raid' && win && battle.catchEncounter ? '<div class="alert alert--gold">👹 Boss đã bị hạ! Bạn nhận được Bóng Raid để bắt ' + esc(PG.SPECIES[battle.catchEncounter.pokemon.speciesId].name) + '.</div>' : ''),
      footer: battle.type === 'wild'
        ? (down
          ? '<button class="btn btn--ghost" data-act="battle-leave">Rời đi tìm con khác</button>'
          : '<button class="btn btn--primary" data-act="battle-catch">🎯 Quay lại bắt</button>')
        : '<button class="btn btn--ghost" data-act="battle-leave">' + (battle.type === 'tournament' ? 'Về giải đấu' : 'Rời đấu trường') + '</button>' +
          (battle.type === 'raid' && win && battle.catchEncounter ? '<button class="btn btn--gold" data-act="battle-catch-boss">🎯 Bắt Boss</button>' : '') +
          (battle.type === 'tournament'
            ? '<button class="btn btn--primary" data-act="battle-again">' + (battle.tournamentResult && battle.tournamentResult.finished ? 'Về bảng giải' : 'Vào vòng tiếp') + '</button>'
            : (win && battle.type === 'raid' ? '' : '<button class="btn btn--primary" data-act="battle-again">Đấu tiếp</button>')),
      closable: false,
      size: 'md'
    });
    ui.refreshTopbar();
  }

  ui.actions['battle-leave'] = function () {
    const previous = b();
    ui.closeModal();
    ui.flow.battle = null;
    ui.flow.battleBusy = false;
    // Mục tiêu hoang dã đã ngất do quá đà: xóa encounter, không cho quay lại bắt.
    if (previous && previous.type === 'wild' && previous.targetDown) ui.flow.encounter = null;
    ui.render();
  };

  ui.actions['battle-again'] = function () {
    const previous = b();
    const tournamentRun = previous && previous.tournament && PG.Tournament && PG.Tournament.currentOpponent();
    ui.closeModal();
    ui.flow.battle = null;
    ui.flow.battleBusy = false;
    ui.render();
    // Ở giải đấu: nút chính đẩy người chơi thẳng vào vòng tiếp theo.
    if (tournamentRun && previous.tournamentResult && !previous.tournamentResult.finished) {
      ui.actions['tournament-next']();
    }
  };

  ui.actions['battle-catch-boss'] = function () {
    const battle = b();
    if (!battle || !battle.catchEncounter) return;
    ui.closeModal();
    ui.flow.encounter = battle.catchEncounter;
    ui.flow.battle = null;
    ui.flow.battleBusy = false;
    ui.go('catch');
  };

  /* ---------------- KẾT THÚC ---------------- */
  ui.actions['battle-heal'] = function () {
    const r = PG.Battle.healTeam();
    ui.toast(r.msg, r.ok ? 'success' : 'error');
    if (r.ok && r.count) PG.Audio.play('heal');
    ui.render();
  };

  ui.playBattleEvents = playEvents;
})();
