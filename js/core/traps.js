/* ============================================================
   BẪY & TRẠI SĂN (IDLE)
   Đặt bẫy / trại ở một vùng, chọn mồi theo hệ. Kết quả được quay sẵn
   lúc đặt (ngẫu nhiên nhưng cố định theo uid), thời gian chạy theo
   Date.now() nên vẫn đếm khi đã thoát game. Quay lại là thu hoạch.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};
  const HOUR = 60 * 60 * 1000;
  const MAX_ACTIVE = 3;

  const BAIT_MATERIAL = {
    normal: 'seed', fire: 'ember', water: 'shell', electric: 'crystal',
    grass: 'seed', ice: 'ice', fighting: 'leather', poison: 'sand',
    ground: 'sand', flying: 'feather', psychic: 'crystal', bug: 'seed',
    rock: 'stone', ghost: 'relic', dragon: 'relic', dark: 'leather',
    steel: 'stone', fairy: 'feather'
  };
  const RARE_BAIT = { dragon: 1, dark: 1, ghost: 1, psychic: 1 };

  const BAITS = {};
  for (const type of PG.TYPE_ORDER) {
    if (!BAIT_MATERIAL[type]) continue;
    const info = PG.TYPES[type];
    BAITS[type] = {
      id: type, name: info.name, icon: info.icon, color: info.color,
      material: BAIT_MATERIAL[type],
      cost: RARE_BAIT[type] ? 260 : 150
    };
  }

  const KINDS = {
    trap: {
      id: 'trap', name: 'Bẫy', icon: '🪤', hours: [1, 3, 5],
      slots: { 1: 2, 3: 3, 5: 4 }, chance: 0.62,
      coinPerHour: 120, mats: { leather: 1 }
    },
    camp: {
      id: 'camp', name: 'Trại săn', icon: '🏕️', hours: [4, 6, 8],
      slots: { 4: 4, 6: 6, 8: 8 }, chance: 0.78,
      coinPerHour: 320, mats: { leather: 2, stone: 2 }
    }
  };

  function stateOf() { return PG.getState(); }
  function traps(s) {
    if (!Array.isArray(s.idleTraps)) s.idleTraps = [];
    return s.idleTraps;
  }
  function seedFrom(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function pickWeighted(items, weightFn, rand) {
    let total = 0;
    for (const it of items) total += Math.max(0, weightFn(it));
    if (total <= 0) return items.length ? items[0] : null;
    let r = rand() * total;
    for (const it of items) {
      r -= Math.max(0, weightFn(it));
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }
  function rollInt(rand, min, max) {
    return min + Math.floor(rand() * (max - min + 1));
  }

  /* Quay sẵn danh sách Pokémon sẽ dính bẫy / đến ăn mồi. */
  function rollCatches(entry) {
    const rand = PG.mulberry32(seedFrom(entry.uid + entry.baitType + entry.regionId + entry.durationMs));
    const region = PG.REGIONS[entry.regionId] || {};
    const regionLevel = Math.max(2, (region.unlock && region.unlock.level) || 2);
    const pool = [];
    for (const id of PG.DEX_ORDER) {
      const sp = PG.SPECIES[id];
      if (!sp || !sp.habitats.includes(entry.regionId)) continue;
      if (PG.TRUE_LEGENDARIES.includes(id) || sp.rarity === 'legendary') continue;
      const match = sp.types.includes(entry.baitType);
      // Đa số là loài cùng hệ mồi, thỉnh thoảng có loài khác ghé ăn.
      if (!match && rand() > 0.22) continue;
      pool.push({ id, sp, match });
    }
    const kind = KINDS[entry.kind];
    const slots = kind.slots[entry.hours] || kind.slots[entry.hours[0]] || 2;
    const out = [];
    for (let i = 0; i < slots; i++) {
      if (rand() > kind.chance) continue;
      const picked = pickWeighted(pool, x => (x.sp.spawnWeight || 10) * (x.match ? 5 : 1) * (x.sp.rarity === 'rare' ? 0.65 : 1), rand);
      if (!picked) continue;
      out.push({
        speciesId: picked.id,
        level: PG.clamp(regionLevel + rollInt(rand, 0, 4), 2, 60),
        shiny: rand() < 0.012
      });
    }
    if (!out.length && pool.length) {
      out.push({ speciesId: pool[0].id, level: PG.clamp(regionLevel + 1, 2, 60), shiny: false });
    }
    return out;
  }

  function place(kindId, regionId, baitType, hours) {
    const s = stateOf();
    if (!s) return { ok: false, msg: 'Chưa tải dữ liệu.' };
    const kind = KINDS[kindId];
    const bait = BAITS[baitType];
    if (!kind) return { ok: false, msg: 'Loại bẫy không hợp lệ.' };
    if (!PG.REGIONS[regionId]) return { ok: false, msg: 'Vùng không hợp lệ.' };
    // Chỉ đặt được bẫy/mồi ở vùng đất đã mở khóa.
    if (!PG.isRegionUnlocked(s, regionId)) {
      return { ok: false, msg: 'Vùng ' + PG.REGIONS[regionId].name + ' chưa mở khóa. Hãy mở vùng này trước khi đặt bẫy.' };
    }
    if (!bait) return { ok: false, msg: 'Mồi không hợp lệ.' };
    hours = Number(hours);
    if (kind.hours.indexOf(hours) < 0) return { ok: false, msg: 'Thời gian không hợp lệ.' };
    const all = traps(s);
    const active = all.filter(e => e && e.status === 'active');
    if (active.length >= MAX_ACTIVE) return { ok: false, msg: 'Tối đa ' + MAX_ACTIVE + ' bẫy/trại cùng lúc. Hãy thu hoạch trước.' };
    if (active.some(e => e.regionId === regionId)) return { ok: false, msg: 'Vùng này đã có bẫy/trại đang chạy.' };

    const cost = Math.round(hours * kind.coinPerHour);
    const mats = Object.assign({}, kind.mats);
    mats[bait.material] = (mats[bait.material] || 0) + 1;
    if ((s.player.coins || 0) < cost) return { ok: false, msg: 'Cần ' + PG.fmt(cost) + ' Xu để đặt ' + kind.name + '.' };
    for (const mid of Object.keys(mats)) {
      if ((s.materials[mid] || 0) < mats[mid]) {
        return { ok: false, msg: 'Thiếu ' + (PG.MATERIALS[mid] ? PG.MATERIALS[mid].name : mid) + ' ×' + mats[mid] + ' để đặt mồi.' };
      }
    }
    PG.addCoins(-cost);
    for (const mid of Object.keys(mats)) PG.removeMaterial(mid, mats[mid]);

    const now = Date.now();
    const durationMs = hours * HOUR;
    const entry = {
      uid: PG.uid('trap'), kind: kindId, regionId, baitType,
      startedAt: now, endsAt: now + durationMs, durationMs, hours,
      status: 'active', cost, mats,
      rewardCoins: Math.round(hours * (kindId === 'camp' ? 70 : 35)),
      rewardMats: { [bait.material]: kindId === 'camp' ? 3 : 1 },
      catches: []
    };
    entry.catches = rollCatches(entry);
    all.unshift(entry);
    PG.saveState(true);
    return { ok: true, entry, msg: 'Đã đặt ' + kind.name + ' tại ' + PG.REGIONS[regionId].name + '. Quay lại sau ' + hours + ' giờ để thu hoạch!' };
  }

  function tick() {
    const s = stateOf();
    if (!s) return 0;
    const all = traps(s);
    const now = Date.now();
    let changed = 0;
    for (const e of all) {
      if (e && e.status === 'active' && (e.endsAt || 0) <= now) { e.status = 'ready'; changed++; }
    }
    if (changed) PG.saveState(true);
    return changed;
  }

  function claim(uid) {
    const s = stateOf();
    if (!s) return { ok: false, msg: 'Chưa tải dữ liệu.' };
    const all = traps(s);
    const idx = all.findIndex(e => e && e.uid === uid && e.status === 'ready');
    if (idx < 0) return { ok: false, msg: 'Bẫy chưa sẵn sàng hoặc không tồn tại.' };
    const e = all[idx];
    const free = PG.bagCapacity() - PG.bagCount();
    if (free < (e.catches || []).length) {
      return { ok: false, msg: 'Túi không đủ chỗ (cần ' + (e.catches || []).length + ' ô).' };
    }
    const caught = [];
    for (const c of (e.catches || [])) {
      if (!PG.SPECIES[c.speciesId]) continue;
      const p = PG.createPokemon(c.speciesId, c.level, { source: 'trap', forceShiny: !!c.shiny });
      s.pokemon.push(p);
      PG.addCatchRewards(s, p, {});
      caught.push(p);
    }
    PG.addCoins(e.rewardCoins || 0);
    for (const mid of Object.keys(e.rewardMats || {})) PG.addMaterial(mid, e.rewardMats[mid]);
    all.splice(idx, 1);
    PG.saveState(true);
    const names = caught.map(p => PG.SPECIES[p.speciesId].name).join(', ');
    return {
      ok: true, caught,
      msg: 'Thu hoạch được ' + caught.length + ' Pokémon' + (names ? ': ' + names : '') +
        ' + ' + PG.fmt(e.rewardCoins || 0) + ' Xu!'
    };
  }

  function claimAll() {
    const s = stateOf();
    if (!s) return { ok: false, msg: 'Chưa tải dữ liệu.', claimed: 0 };
    const ready = traps(s).filter(e => e && e.status === 'ready').map(e => e.uid);
    let ok = 0, last = '';
    for (const uid of ready) {
      const r = claim(uid);
      if (r.ok) ok++; else last = r.msg;
    }
    return { ok: ok > 0, claimed: ok, msg: ok ? 'Đã thu hoạch ' + ok + ' bẫy/trại!' : (last || 'Không có bẫy nào sẵn sàng.') };
  }

  function cancel(uid) {
    const s = stateOf();
    if (!s) return { ok: false, msg: 'Chưa tải dữ liệu.' };
    const all = traps(s);
    const idx = all.findIndex(e => e && e.uid === uid && e.status === 'active');
    if (idx < 0) return { ok: false, msg: 'Không tìm thấy bẫy đang chạy.' };
    const e = all[idx];
    PG.addCoins(Math.floor((e.cost || 0) / 2));
    all.splice(idx, 1);
    PG.saveState(true);
    return { ok: true, msg: 'Đã dỡ bẫy, hoàn lại một nửa Xu.' };
  }

  function fmtRemain(ms) {
    if (!(ms > 0)) return 'Sẵn sàng!';
    const h = Math.floor(ms / HOUR);
    const m = Math.floor((ms % HOUR) / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return h ? h + 'g ' + m + 'p' : m ? m + 'p ' + sec + 's' : sec + 's';
  }

  PG.Traps = { BAITS, KINDS, MAX_ACTIVE, HOUR, place, tick, claim, claimAll, cancel, fmtRemain };
})();
