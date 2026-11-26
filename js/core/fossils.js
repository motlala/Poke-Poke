/* ============================================================
   HÓA THẠCH: đào tìm, phục chế theo thời gian thực, nhận Pokémon
   Không dùng setInterval: mọi mốc thời gian đều là timestamp tuyệt đối.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};
  const api = PG.Fossil = PG.Fossil || {};

  const DIG_COST = 8;
  const SIZE = 6;
  const MAX_PROBES = 8;
  const SURGE_ID = 'fossil-surge';
  const SURGE_MULT = 0.6;
  const sessions = new Map();

  const SITES = [
    {
      id: 'cave', name: 'Hang Động Cổ', icon: '🕳️', regionId: 'cave',
      desc: 'Tầng đá ẩm và tinh thể phát sáng, nơi giữ nguyên vỏ ốc và giáp cổ.'
    },
    {
      id: 'desert', name: 'Sa Mạc Hóa Thạch', icon: '🏜️', regionId: 'desert',
      desc: 'Cát chảy lấp đầy những bộ xương cổ, càng đào sâu càng gần bầu trời xưa.'
    },
    {
      id: 'volcano', name: 'Tro Núi Lửa', icon: '🌋', regionId: 'volcano',
      desc: 'Dung nham nguội bọc lấy hóa thạch, giữ chúng lại qua hàng triệu năm.'
    }
  ];

  /** Đảm bảo state.fossils tồn tại ngay cả với save cũ (parent sẽ thêm default). */
  function data() {
    const state = PG.getState && PG.getState();
    if (!state) return null;
    if (!state.fossils || typeof state.fossils !== 'object' || Array.isArray(state.fossils)) state.fossils = {};
    const f = state.fossils;
    if (!f.inventory || typeof f.inventory !== 'object' || Array.isArray(f.inventory)) f.inventory = {};
    if (!Array.isArray(f.restoring)) f.restoring = [];
    if (!Array.isArray(f.ready)) f.ready = [];
    if (!f.stats || typeof f.stats !== 'object' || Array.isArray(f.stats)) f.stats = {};
    if (typeof f.stats.dug !== 'number') f.stats.dug = 0;
    if (typeof f.stats.restored !== 'number') f.stats.restored = 0;
    if (!state.stats || typeof state.stats !== 'object') state.stats = {};
    if (typeof state.stats.fossilsRestored !== 'number') state.stats.fossilsRestored = 0;
    return state;
  }

  function siteOf(siteId) {
    return SITES.find(s => s.id === siteId) || null;
  }

  function isSurge() {
    const state = PG.getState && PG.getState();
    const active = state && state.events && state.events.active;
    return !!active && active.id === SURGE_ID;
  }

  function poolOf(siteId) {
    return (PG.FOSSIL_ORDER || []).map(id => PG.FOSSILS[id]).filter(f => f && f.site === siteId);
  }

  function chebyshev(a, b) {
    const ar = Math.floor(a / SIZE), ac = a % SIZE;
    const br = Math.floor(b / SIZE), bc = b % SIZE;
    return Math.max(Math.abs(ar - br), Math.abs(ac - bc));
  }

  function randomTarget() {
    return Math.floor(Math.random() * SIZE * SIZE);
  }

  function giveFossil(state, fossilId) {
    state.fossils.inventory[fossilId] = (state.fossils.inventory[fossilId] || 0) + 1;
  }

  function activeSessionsCount() {
    let n = 0;
    sessions.forEach(s => { if (s && !s.found) n++; });
    return n;
  }

  /* ---------------- THÔNG TIN MỎ ---------------- */
  api.sites = function () {
    return SITES.map(s => Object.assign({}, s));
  };

  /* ---------------- ĐÀO ---------------- */
  api.canDig = function (siteId) {
    const state = data();
    const site = siteOf(siteId);
    if (!site) return { ok: false, msg: 'Địa điểm không hợp lệ.', cost: DIG_COST };
    if (!state) return { ok: false, msg: 'Chưa tải được dữ liệu game.', cost: DIG_COST };
    if (PG.isRegionUnlocked && !PG.isRegionUnlocked(state, site.regionId)) {
      const region = PG.REGIONS[site.regionId];
      return { ok: false, msg: 'Chưa mở khóa ' + ((region && region.name) || 'vùng này') + '.', cost: DIG_COST };
    }
    if ((state.player.stamina || 0) < DIG_COST) {
      return { ok: false, msg: 'Cần ' + DIG_COST + ' Thể lực để đào.', cost: DIG_COST };
    }
    return { ok: true, msg: '', cost: DIG_COST, site };
  };

  api.startDig = function (siteId) {
    const check = api.canDig(siteId);
    if (!check.ok) return { ok: false, session: null, msg: check.msg, cost: check.cost };
    const state = data();
    const pool = poolOf(siteId);
    if (!pool.length) return { ok: false, session: null, msg: 'Mỏ này hiện không có hóa thạch.', cost: check.cost };
    if (!PG.spendStamina(check.cost)) {
      return { ok: false, session: null, msg: 'Không đủ Thể lực.', cost: check.cost };
    }

    const fossil = PG.weightedPick ? PG.weightedPick(pool, f => f.weight || 1) : PG.pick(pool);
    const session = {
      id: PG.uid('fossil-dig'),
      siteId,
      size: SIZE,
      target: randomTarget(),
      probes: 0,
      found: false,
      result: null,
      fossilId: fossil.id,
      lastCell: null,
      lastDistance: null,
      probed: []
    };
    sessions.set(session.id, session);
    PG.saveState(true);
    return { ok: true, session, cost: check.cost, msg: 'Bắt đầu đào. Hãy dò từng ô một!' };
  };

  api.probe = function (sessionId, cellIndex) {
    const session = sessions.get(sessionId);
    if (!session) {
      return { ok: false, hit: false, distance: null, found: false, done: true, msg: 'Phiên đào đã kết thúc.' };
    }
    if (session.found) {
      return {
        ok: false, hit: false, distance: 0, found: true, done: true,
        result: session.result, msg: 'Bạn đã đào được hóa thạch ở mỏ này.'
      };
    }
    const cell = Number(cellIndex);
    if (!Number.isInteger(cell) || cell < 0 || cell >= SIZE * SIZE) {
      return { ok: false, hit: false, distance: null, found: false, done: false, msg: 'Ô đào không hợp lệ.' };
    }
    if (session.probed.indexOf(cell) >= 0) {
      return {
        ok: false, hit: false, distance: session.lastDistance, found: false, done: false,
        msg: 'Ô này đã đào rồi, hãy thử ô khác.'
      };
    }

    session.probed.push(cell);
    session.probes++;
    const hit = cell === session.target;
    const distance = chebyshev(cell, session.target);
    session.lastCell = cell;
    session.lastDistance = distance;

    let found = false;
    // Trúng ô mục tiêu hoặc đã đào đủ 8 lần thì chắc chắn lộ diện.
    if (hit || session.probes >= MAX_PROBES) {
      found = true;
      session.found = true;
      const state = data();
      const def = PG.FOSSILS[session.fossilId];
      if (state) {
        giveFossil(state, session.fossilId);
        state.fossils.stats.dug = (state.fossils.stats.dug || 0) + 1;
        if (PG.questProgress) PG.questProgress('fossil_dig', 1);
      }
      session.result = {
        fossilId: session.fossilId,
        name: def ? def.name : session.fossilId,
        icon: def ? def.icon : '🦴',
        cell: session.target,
        probes: session.probes
      };
      PG.saveState(true);
    }

    let msg;
    if (found) {
      msg = (hit ? 'Đào trúng! ' : 'Đào đủ ' + MAX_PROBES + ' lần, hóa thạch lộ diện! ') +
        'Bạn tìm thấy ' + (session.result ? session.result.name : 'hóa thạch') + '.';
    } else if (distance <= 1) {
      msg = 'Rất gần rồi! Chỉ còn ' + distance + ' ô thôi.';
    } else if (distance <= 2) {
      msg = 'Gần rồi! Cách ' + distance + ' ô.';
    } else if (distance <= 3) {
      msg = 'Hơi xa, cách ' + distance + ' ô.';
    } else {
      msg = 'Xa lắm, cách ' + distance + ' ô.';
    }

    return {
      ok: true, hit, distance, found, done: found, msg,
      result: session.result, probes: session.probes, lastCell: cell
    };
  };

  api.cancelDig = function (sessionId) {
    const had = sessions.delete(sessionId);
    return { ok: true, msg: had ? 'Đã bỏ lượt đào.' : 'Không có phiên đào để hủy.' };
  };

  api.getSession = function (sessionId) {
    return sessions.get(sessionId) || null;
  };

  api.activeSessions = activeSessionsCount;

  /* ---------------- PHỤC CHẾ ---------------- */
  api.canRestore = function (fossilId) {
    const state = data();
    const def = PG.FOSSILS[fossilId];
    if (!state) return { ok: false, msg: 'Chưa tải được dữ liệu game.' };
    if (!def) return { ok: false, msg: 'Hóa thạch không tồn tại.' };
    if ((state.fossils.inventory[fossilId] || 0) < 1) return { ok: false, msg: 'Bạn không có hóa thạch này.' };
    for (const [mid, n] of Object.entries(def.restoreMaterials || {})) {
      if (!PG.MATERIALS[mid]) return { ok: false, msg: 'Nguyên liệu không hợp lệ: ' + mid };
      if ((state.materials[mid] || 0) < n) {
        return { ok: false, msg: 'Thiếu ' + PG.itemInfo(mid).name + ' (cần ' + n + ').' };
      }
    }
    const coins = def.restoreCoins || 0;
    if ((state.player.coins || 0) < coins) {
      return { ok: false, msg: 'Không đủ Xu (cần ' + PG.fmt(coins) + ').' };
    }
    return { ok: true, msg: '', cost: { coins, materials: def.restoreMaterials || {} } };
  };

  api.startRestore = function (fossilId) {
    const check = api.canRestore(fossilId);
    if (!check.ok) return { ok: false, entry: null, msg: check.msg };
    const state = data();
    const def = PG.FOSSILS[fossilId];
    state.fossils.inventory[fossilId] -= 1;
    if (state.fossils.inventory[fossilId] <= 0) delete state.fossils.inventory[fossilId];
    for (const [mid, n] of Object.entries(def.restoreMaterials || {})) PG.removeMaterial(mid, n);
    state.player.coins = Math.max(0, (state.player.coins || 0) - (def.restoreCoins || 0));

    const boosted = isSurge();
    const durationMs = Math.max(1000, Math.round((def.restoreMs || 5 * 60000) * (boosted ? SURGE_MULT : 1)));
    const now = Date.now();
    const entry = {
      uid: PG.uid('fossil-restore'),
      fossilId,
      startedAt: now,
      readyAt: now + durationMs,
      durationMs,
      boosted
    };
    state.fossils.restoring.push(entry);
    PG.saveState(true);
    return {
      ok: true, entry,
      msg: 'Đã đưa ' + def.name + ' vào phòng phục chế' + (boosted ? ' (sự kiện tăng tốc 40%)' : '') +
        '. Xong sau ' + (PG.relTime ? PG.relTime(durationMs) : Math.round(durationMs / 60000) + ' phút') + '.'
    };
  };

  api.tick = function () {
    const state = data();
    if (!state) return 0;
    const now = Date.now();
    const remaining = [];
    const moved = [];
    for (const entry of state.fossils.restoring) {
      if (!entry || typeof entry !== 'object') continue;
      if ((entry.readyAt || 0) <= now) moved.push(entry);
      else remaining.push(entry);
    }
    if (!moved.length) return 0;
    state.fossils.restoring = remaining;
    for (const entry of moved) {
      if (!state.fossils.ready.some(r => r && r.uid === entry.uid)) state.fossils.ready.push(entry);
    }
    PG.saveState(true);
    return moved.length;
  };

  api.claim = function (uid) {
    const state = data();
    if (!state) return { ok: false, pokemon: null, rewards: null, msg: 'Chưa tải được dữ liệu game.' };
    const idx = state.fossils.ready.findIndex(e => e && e.uid === uid);
    if (idx < 0) return { ok: false, pokemon: null, rewards: null, msg: 'Không tìm thấy hóa thạch đã phục chế.' };
    const entry = state.fossils.ready[idx];
    const def = PG.FOSSILS[entry.fossilId];
    if (!def || !PG.SPECIES[def.speciesId]) {
      return { ok: false, pokemon: null, rewards: null, msg: 'Loài hóa thạch không hợp lệ.' };
    }

    const site = siteOf(def.site);
    const region = site && PG.REGIONS[site.regionId];
    const level = Math.max(5, Math.min(state.player.level || 5, (region && region.unlock && region.unlock.level) || 5));
    const pokemon = PG.createPokemon(def.speciesId, level, { minIV: 10, source: 'fossil' });
    state.pokemon.push(pokemon);
    if (!Array.isArray(state.team)) state.team = [];
    if (state.team.length < 6) state.team.push(pokemon.uid);

    let rewards = null;
    if (PG.addCatchRewards) rewards = PG.addCatchRewards(state, pokemon, { candyMult: 1 });
    if (PG.recordDex) PG.recordDex(def.speciesId, 'caught');
    state.fossils.stats.restored = (state.fossils.stats.restored || 0) + 1;
    state.stats.fossilsRestored = (state.stats.fossilsRestored || 0) + 1;
    if (PG.questProgress) PG.questProgress('fossil_restore', 1);

    state.fossils.ready.splice(idx, 1);
    PG.saveState(true);
    return {
      ok: true, pokemon, rewards,
      msg: PG.SPECIES[def.speciesId].name + ' đã sống lại và vào Kho Pokémon!'
    };
  };

  /* ---------------- BÁN (tùy chọn) ---------------- */
  api.sell = function (fossilId) {
    const state = data();
    const def = PG.FOSSILS[fossilId];
    if (!state) return { ok: false, msg: 'Chưa tải được dữ liệu game.' };
    if (!def) return { ok: false, msg: 'Hóa thạch không tồn tại.' };
    if ((state.fossils.inventory[fossilId] || 0) < 1) return { ok: false, msg: 'Bạn không có hóa thạch này.' };
    const price = def.sellCoins || Math.round((def.restoreCoins || 500) * 0.35);
    state.fossils.inventory[fossilId] -= 1;
    if (state.fossils.inventory[fossilId] <= 0) delete state.fossils.inventory[fossilId];
    PG.addCoins(price);
    PG.saveState(true);
    return { ok: true, coins: price, msg: 'Bán ' + def.name + ' được ' + PG.fmt(price) + ' Xu.' };
  };

  api.DIG_COST = DIG_COST;
  api.SIZE = SIZE;
  api.MAX_PROBES = MAX_PROBES;
  api.SURGE_ID = SURGE_ID;
  api.SURGE_MULT = SURGE_MULT;
})();
