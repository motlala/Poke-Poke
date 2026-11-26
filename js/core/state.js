/* ============================================================
   TRẠNG THÁI GAME, LƯU / TẢI, NGÀY MỚI, NHIỆM VỤ, CHỢ
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const SAVE_KEY = 'bat-pokemon-save-v1';
  const STAMINA_REGEN_MS = 25000;
  const HP_REGEN_MS = 30000;
  const TRAINER_SHOP_MS = 30 * 60 * 1000;
  const TRAINER_SHOP_SIZE = 5; // quầy vật phẩm Huấn luyện viên: 10 phút
  const NPC_SHOP_MS = 20 * 60 * 1000;     // quầy NPC bán Pokémon: 20 phút
  const GIFTBOX_MS = 15 * 60 * 1000;      // hộp quà bí ẩn: làm mới 15 phút / lúc có thể vắng
  const GIFTBOX_SIZE = 3;                 // tối đa 3 hộp / chu kỳ
  const OUTBREAK_MS = 5 * 60 * 1000;      // bùng nổ: 1 vùng / 1 loài trong 5 phút

  const STARTERS = ['bulbasaur', 'charmander', 'squirtle', 'eevee'];

  /* Loài phim bị bỏ vì artwork trùng hệt loài chính thức. Save cũ được chuyển
     sang loài gốc tương ứng để không mất Pokémon / tiến độ Pokédex. */
  const REMOVED_SPECIES = {
    'film-meowth-rocket': 'meowth',
    'film-wobbuffet-rocket': 'wobbuffet',
    'film-arbok-jessie': 'arbok',
    'film-hydreigon-iris': 'hydreigon',
    'film-mimikyu-busted': 'mimikyu'
  };
  /* 16 bản thiết kế Anima 0.3.0 trùng tên với Anima gốc đã bị gỡ khỏi game. */
  const REMOVED_ANIMA20D = new Set([
    'cross-anima-bunmareen-beta', 'cross-anima-camcorgi-beta', 'cross-anima-damasque-beta',
    'cross-anima-donubi-beta', 'cross-anima-faeflux-beta', 'cross-anima-hoppelon-beta',
    'cross-anima-hugglebeary-beta', 'cross-anima-inkicorn-beta', 'cross-anima-inkifoal-beta',
    'cross-anima-lumehart-beta', 'cross-anima-lumeridon-beta', 'cross-anima-mesmerith-beta',
    'cross-anima-mushgloomini-beta', 'cross-anima-nomnom-beta', 'cross-anima-pomparrot-beta',
    'cross-anima-pupanoo-beta'
  ]);
  /* Pokeyugi / Yu-Gi-Oh! và 16 Anima trùng tên đã bị gỡ khỏi game: save cũ có
     thể chứa stub/archive cross-ygo-* hoặc cross-anima-*-beta. Lọc bỏ hết trước
     khi các bước lọc theo PG.SPECIES chạy, để kho, đội, bạn đồng hành, chợ và
     Pokédex không còn tham chiếu hỏng. */
  function isRemovedId(id) {
    if (typeof id !== 'string') return false;
    if (id.indexOf('cross-ygo-') === 0 || REMOVED_ANIMA20D.has(id)) return true;
    // Anima cũ có thể dùng id không có đuôi "-beta": coi mọi cross-anima-*
    // không còn trong dex hiện tại là dữ liệu đã bị gỡ.
    return id.indexOf('cross-anima-') === 0 && !!PG.SPECIES && !PG.SPECIES[id];
  }
  function dropRemovedYgo(target) {
    const removedUids = new Set();
    if (Array.isArray(target.pokemon)) {
      target.pokemon = target.pokemon.filter(p => {
        if (p && isRemovedId(p.speciesId)) {
          if (p.uid) removedUids.add(p.uid);
          return false;
        }
        return true;
      });
    }
    const dex = target.pokedex;
    if (dex) {
      for (const key of ['seen', 'caught']) {
        const book = dex[key];
        if (!book || typeof book !== 'object') continue;
        for (const id of Object.keys(book)) if (isRemovedId(id)) delete book[id];
      }
    }
    if (target.market && Array.isArray(target.market.listings)) {
      target.market.listings = target.market.listings.filter(l => !(l && l.pokemon &&
        (isRemovedId(l.pokemon.speciesId) || (l.pokemon.uid && removedUids.has(l.pokemon.uid)))));
    }
    if (target.npcShop && Array.isArray(target.npcShop.stock)) {
      target.npcShop.stock = target.npcShop.stock.filter(e => !(e && isRemovedId(e.speciesId)));
    }
    if (Array.isArray(target.team)) target.team = target.team.filter(uid => !removedUids.has(uid));
    if (target.buddy && removedUids.has(target.buddy)) target.buddy = null;
    if (target.roamingTrainer && Array.isArray(target.roamingTrainer.team)) {
      target.roamingTrainer.team = target.roamingTrainer.team.filter(e => !(Array.isArray(e) && isRemovedId(e[0])));
      if (!target.roamingTrainer.team.length) target.roamingTrainer = null;
    }
  }

  function normalizeRemovedSpecies(target) {
    if (!target || typeof target !== 'object') return;
    dropRemovedYgo(target);
    for (const p of target.pokemon || []) {
      if (p && REMOVED_SPECIES[p.speciesId]) p.speciesId = REMOVED_SPECIES[p.speciesId];
    }
    const dex = target.pokedex;
    if (dex) {
      for (const key of ['seen', 'caught']) {
        const book = dex[key];
        if (!book || typeof book !== 'object') continue;
        for (const old of Object.keys(REMOVED_SPECIES)) {
          if (!(old in book)) continue;
          const nw = REMOVED_SPECIES[old];
          book[nw] = Math.max(Number(book[nw]) || 0, Number(book[old]) || 0);
          delete book[old];
        }
      }
    }
  }

  function defaultState() {
    const now = Date.now();
    return {
      version: 1,
      createdAt: now,
      lastSeen: now,
      lastTick: now,
      player: {
        name: 'Huấn Luyện Viên', level: 1, xp: 0,
        coins: 1500, stardust: 500, diamonds: 5,
        stamina: 100, staminaMax: 100, lastStaminaTs: now, lastHpRegenTs: now,
        avatar: '🧑‍🎤', starterChosen: false, bagBonus: 0, trainerItems: []
      },
      badges: [],
      unlockedRegions: ['forest'],
      region: 'forest',
      weather: {},
      weatherDate: null,
      bag: { pokeball: 20, greatball: 5, razz: 3, potion: 3, incubator: 1 },
      materials: { leather: 2, stone: 2, feather: 1, crystal: 0, seed: 2, shell: 1, ember: 0, ice: 0, sand: 0, relic: 0 },
      candies: {},
      pokemon: [],
      pokedex: { seen: {}, caught: {} },
      team: [],
      buddy: null,
      buddyProgress: 0,
      eggs: [],
      equipment: {
        inventory: [],
        equipped: { hat: null, shirt: null, shoes: null, gloves: null, glasses: null, backpack: null, accessory: null }
      },
      shop: { date: null, stock: [], lucky: [], discount: 0 },
      giftBoxShop: { cycleKey: null, stock: [], nextAt: null },
      trainerShop: { cycleKey: null, stock: [], nextAt: null },
      trainerZone: { cycleKey: null, defeated: {} },
      npcShop: { cycleKey: null, stock: [], nextAt: null },
      market: { listings: [], history: [] },
      merchant: {
        cycleKey: null, visitKey: null, region: null, merchantId: null,
        nextAt: null, stock: [], lastVisit: null, visits: {}, history: []
      },
      quests: { dailyDate: null, weeklyDate: null, daily: [], weekly: [], claimedDaily: 0, claimedWeekly: 0 },
      login: { lastClaim: null, streak: 0 },
      redeemedCodes: {},
      achievements: {},
      stats: {
        catches: 0, km: 0, shinies: 0, gyms: 0, fishCaught: 0,
        eggsHatched: 0, evolutions: 0, crits: 0, dodges: 0, raidsWon: 0, powerUps: 0,
        throws: 0, excellent: 0, great: 0, nice: 0, berriesUsed: 0, battlesWon: 0,
        tournamentRuns: 0, tournamentWins: 0, tournamentBest: 0, tournamentElo: 1000,
        catchesByType: {}, legendariesCaught: 0, celestialFractures: 0, fossilsRestored: 0
      },
      settings: { sound: true, fast: false, auto: false, particles: true, reduceMotion: false },
      events: { date: null, active: null },
      raid: null,
      dailyDefeats: { date: null, trainers: {}, gyms: {} },
      regionChallenges: {},
      roamingTrainer: null,
      roamingCooldownAt: 0,
      tournament: {
        uid: null, status: 'idle', round: -1, wins: 0, feePaid: 0,
        tierId: 'rookie', tierName: 'Giải Tân Thủ',
        opponents: [], results: [], bonusLines: [], history: [], claimed: false,
        daily: { date: null, ran: false, claimed: false, tierId: null }
      },
      fishing: { rod: 'bamboo', rodLevel: 0, baits: {}, streak: 0, best: 0, catches: 0, aquarium: [], total: 0 },
      fossils: { inventory: {}, restoring: [], ready: [], stats: { dug: 0, restored: 0 } },
      // Bẫy & trại săn: chạy theo thời gian thực, kể cả khi đã thoát game.
      idleTraps: [],
      lab: { attempts: 0, successes: 0 },
      distance: { total: 0 },
      achievementsSeen: {},
      lastSave: null
    };
  }

  function mergeDefaults(target, def) {
    if (Array.isArray(def)) return Array.isArray(target) ? target : PG.deepClone(def);
    if (def && typeof def === 'object') {
      const out = (target && typeof target === 'object' && !Array.isArray(target)) ? target : {};
      for (const k of Object.keys(def)) {
        if (!(k in out)) out[k] = PG.deepClone(def[k]);
        else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k])) out[k] = mergeDefaults(out[k], def[k]);
      }
      return out;
    }
    return target === undefined ? def : target;
  }

  let state = null;

  /** Chuẩn hóa trang bị save cũ: cấp nâng cấp nằm trong 0..+15. */
  function normalizeEquipment(s) {
    if (!s || !s.equipment) return;
    const fix = it => {
      if (!it || !PG.getEquipBase(it)) return it;
      it.plus = Math.max(0, Math.min(PG.EQUIPMENT_MAX_PLUS || 15, Math.round(Number(it.plus) || 0)));
      if (it.element && !(PG.TYPES && PG.TYPES[it.element])) it.element = null;
      return it;
    };
    s.equipment.inventory = (s.equipment.inventory || []).filter(it => it && PG.getEquipBase(it)).map(fix);
    for (const slot of PG.SLOTS) {
      const it = s.equipment.equipped[slot.id];
      if (it && !PG.getEquipBase(it)) s.equipment.equipped[slot.id] = null;
      else if (it) fix(it);
    }
  }

  function load() {
    const def = defaultState();
    let saved = PG.store.get(SAVE_KEY, null);
    if (!saved || typeof saved !== 'object') {
      state = def;
    } else {
      state = mergeDefaults(saved, def);
    }
    // Dữ liệu cũ: bổ sung + gộp loài trùng ảnh về bản gốc
    if (!state.player.staminaMax) state.player.staminaMax = 100;
    // Đấu trường PvP cũ đã bị xóa; không giữ lại dữ liệu Elo trong save.
    delete state.pvp;
    normalizeRemovedSpecies(state);
    state.pokemon = (state.pokemon || []).filter(p => p && PG.SPECIES[p.speciesId]);
    // Save cũ/hỏng có thể thiếu mutations: chuẩn hóa để badge/aura không lỗi.
    for (const p of state.pokemon) if (!Array.isArray(p.mutations)) p.mutations = [];
    state.team = (state.team || []).filter(id => state.pokemon.some(p => p.uid === id));
    if (state.buddy && !state.pokemon.some(p => p.uid === state.buddy)) state.buddy = null;
    normalizeEquipment(state);
    normalizeEggs(state);
    // Save cũ chưa có hóa thạch: mergeDefaults đã thêm, đây là lớp bảo vệ nếu dữ liệu hỏng.
    const fd = defaultState().fossils;
    if (!state.fossils || typeof state.fossils !== 'object') state.fossils = fd;
    if (!state.fossils.inventory || typeof state.fossils.inventory !== 'object') state.fossils.inventory = {};
    if (!Array.isArray(state.fossils.restoring)) state.fossils.restoring = [];
    if (!Array.isArray(state.fossils.ready)) state.fossils.ready = [];
    if (!state.fossils.stats || typeof state.fossils.stats !== 'object') state.fossils.stats = { dug: 0, restored: 0 };
    if (!Array.isArray(state.idleTraps)) state.idleTraps = [];
    if (!state.regionChallenges || typeof state.regionChallenges !== 'object') state.regionChallenges = {};
    if (state.roamingTrainer && !(state.roamingTrainer.expiresAt > Date.now())) state.roamingTrainer = null;
    if (typeof state.roamingCooldownAt !== 'number') state.roamingCooldownAt = 0;
    ensureDaily(true);
    ensureTrainerShop(true);
    ensureGiftBoxShop(true);
    ensureTrainerZone(true);
    ensureNpcShop(true);
    ensureMerchant(true);
    tickStamina(true);
    tickHeal(true);
    processMarket(true);
    checkAchievements();
    applyMotionSettings();
    return state;
  }

  function getState() { return state; }

  /** Cài đặt giảm chuyển động / tắt hạt: giữ màu & nhãn, chỉ bỏ animation. */
  function applyMotionSettings() {
    if (typeof document === 'undefined' || !document.body || !document.body.classList ||
        typeof document.body.classList.toggle !== 'function') return;
    const s = state && state.settings;
    document.body.classList.toggle('motion-reduced', !!(s && (s.reduceMotion || s.particles === false)));
  }

  function save(silent) {
    if (!state) return;
    state.lastSave = Date.now();
    state.lastSeen = Date.now();
    const ok = PG.store.set(SAVE_KEY, state);
    if (!silent && PG.toast) PG.toast(ok ? 'Đã lưu game' : 'Không lưu được (bộ nhớ đầy?)', ok ? 'success' : 'error');
    return ok;
  }

  function exportSave() {
    const data = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(data)));
  }

  function importSave(str) {
    try {
      const json = decodeURIComponent(escape(atob(str.trim())));
      const parsed = JSON.parse(json);
      if (!parsed || !parsed.player) throw new Error('Dữ liệu không hợp lệ');
      const def = defaultState();
      state = mergeDefaults(parsed, def);
      normalizeRemovedSpecies(state);
      normalizeEquipment(state);
      normalizeEggs(state);
      state.pokemon = (state.pokemon || []).filter(p => p && PG.SPECIES[p.speciesId]);
      state.team = (state.team || []).filter(id => state.pokemon.some(p => p.uid === id));
      if (state.buddy && !state.pokemon.some(p => p.uid === state.buddy)) state.buddy = null;
      if (!Array.isArray(state.idleTraps)) state.idleTraps = [];
      if (!state.regionChallenges || typeof state.regionChallenges !== 'object') state.regionChallenges = {};
      if (state.roamingTrainer && !(state.roamingTrainer.expiresAt > Date.now())) state.roamingTrainer = null;
      if (typeof state.roamingCooldownAt !== 'number') state.roamingCooldownAt = 0;
      ensureDaily(true);
      ensureTrainerShop(true);
      ensureGiftBoxShop(true);
      ensureNpcShop(true);
      ensureMerchant(true);
      processMarket(true);
      tickStamina(true);
      tickHeal(true);
      applyMotionSettings();
      save(true);
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  }

  function reset() {
    PG.store.remove(SAVE_KEY);
    state = defaultState();
    ensureDaily(true);
    ensureTrainerShop(true);
    ensureGiftBoxShop(true);
    ensureTrainerZone(true);
    ensureNpcShop(true);
    ensureMerchant(true);
    applyMotionSettings();
    save(true);
    return state;
  }

  /* ---------------- THỂ LỰC ---------------- */
  function staminaMax() {
    const bonus = PG.trainerBonuses(state).totals.stamina || 0;
    return 100 + bonus;
  }
  function tickStamina(silent) {
    const now = Date.now();
    const max = staminaMax();
    state.player.staminaMax = max;
    const elapsed = now - (state.player.lastStaminaTs || now);
    if (elapsed >= STAMINA_REGEN_MS) {
      const gained = Math.floor(elapsed / STAMINA_REGEN_MS);
      const before = state.player.stamina;
      state.player.stamina = Math.min(max, state.player.stamina + gained);
      state.player.lastStaminaTs += gained * STAMINA_REGEN_MS;
      if (state.player.stamina >= max) state.player.lastStaminaTs = now;
      if (!silent && state.player.stamina > before) PG.ui && PG.ui.refreshTopbar && PG.ui.refreshTopbar();
      return state.player.stamina - before;
    }
    if (state.player.stamina > max) state.player.stamina = max;
    return 0;
  }
  function staminaNextIn() {
    if (state.player.stamina >= staminaMax()) return 0;
    const elapsed = Date.now() - state.player.lastStaminaTs;
    return Math.max(0, STAMINA_REGEN_MS - (elapsed % STAMINA_REGEN_MS));
  }
  function spendStamina(n) {
    if (state.player.stamina < n) return false;
    state.player.stamina -= n;
    return true;
  }
  function restoreStamina(n) {
    const max = staminaMax();
    const before = state.player.stamina;
    state.player.stamina = Math.min(max, state.player.stamina + n);
    return state.player.stamina - before;
  }

  /* ---------------- HỒI HP TỰ NHIÊN ---------------- */
  /** 1 HP / 30 giây cho mọi Pokémon còn sống; Pokémon ngất (0 HP) không tự hồi sinh. */
  function tickHeal(silent) {
    const now = Date.now();
    const last = state.player.lastHpRegenTs || now;
    const elapsed = now - last;
    if (elapsed < HP_REGEN_MS) return 0;
    const steps = Math.floor(elapsed / HP_REGEN_MS);
    let healed = 0;
    for (const p of state.pokemon || []) {
      if (!p || !(p.hp > 0)) continue;
      const max = PG.getStats(p).hp;
      if (p.hp >= max) continue;
      p.hp = Math.min(max, p.hp + steps);
      healed += steps;
    }
    state.player.lastHpRegenTs = last + steps * HP_REGEN_MS;
    // Lưu lại để HP đã hồi trên bản đồ vẫn còn khi vào đấu trường / reload.
    if (healed > 0) save(true);
    if (healed > 0 && !silent && PG.ui && PG.ui.render) PG.ui.render();
    return healed;
  }

  /* ---------------- VÍ / TÚI ---------------- */
  function addItem(id, n) {
    state.bag[id] = (state.bag[id] || 0) + (n || 1);
  }
  function removeItem(id, n) {
    if ((state.bag[id] || 0) < (n || 1)) return false;
    state.bag[id] -= (n || 1);
    if (state.bag[id] <= 0) delete state.bag[id];
    return true;
  }
  function addMaterial(id, n) {
    state.materials[id] = (state.materials[id] || 0) + (n || 1);
  }
  function removeMaterial(id, n) {
    if ((state.materials[id] || 0) < (n || 1)) return false;
    state.materials[id] -= (n || 1);
    if (state.materials[id] <= 0) delete state.materials[id];
    return true;
  }
  function bagCapacity() {
    return 300 + (PG.trainerBonuses(state).totals.bag || 0) * 3 + (state.player.bagBonus || 0);
  }
  function bagCount() {
    let n = 0;
    for (const v of Object.values(state.bag)) n += v;
    for (const v of Object.values(state.materials)) n += v;
    return n;
  }
  function addCoins(n) { state.player.coins = Math.max(0, state.player.coins + n); }
  function addStardust(n) { state.player.stardust = Math.max(0, state.player.stardust + n); }
  function addDiamonds(n) { state.player.diamonds = Math.max(0, state.player.diamonds + n); }

  function grantReward(reward) {
    const got = [];
    if (!reward) return got;
    // Giờ Vàng: thưởng Xu/Bụi Sao tăng 50% cho mọi nguồn thưởng dùng chung.
    const goldMult = state.events.active && state.events.active.id === 'golden-hour' ? 1.5 : 1;
    if (reward.coins) { const n = Math.round(reward.coins * goldMult); addCoins(n); got.push('+' + PG.fmt(n) + ' Xu'); }
    if (reward.stardust) { const n = Math.round(reward.stardust * goldMult); addStardust(n); got.push('+' + PG.fmt(n) + ' Bụi Sao'); }
    if (reward.diamonds) { addDiamonds(reward.diamonds); got.push('+' + reward.diamonds + ' Kim Cương'); }
    if (reward.items) for (const [id, n] of Object.entries(reward.items)) { addItem(id, n); got.push('+' + n + ' ' + PG.itemInfo(id).name); }
    if (reward.materials) for (const [id, n] of Object.entries(reward.materials)) { addMaterial(id, n); got.push('+' + n + ' ' + PG.itemInfo(id).name); }
    if (reward.candies) for (const [fam, n] of Object.entries(reward.candies)) { state.candies[fam] = (state.candies[fam] || 0) + n; got.push('+' + n + ' Kẹo'); }
    if (reward.equipment) {
      for (const spec of [].concat(reward.equipment)) {
        if (!spec) continue;
        const baseId = typeof spec === 'string' ? spec : spec.baseId;
        const item = PG.grantEquipment && PG.grantEquipment(baseId, spec);
        if (item) {
          const base = PG.getEquipBase(item);
          const rar = (PG.RARITY[base.rarity] || {}).name || base.rarity;
          got.push('🎁 ' + PG.equipName(item) + ' (' + rar + ')');
        }
      }
    }
    if (reward.trainerItems) {
      for (const spec of [].concat(reward.trainerItems)) {
        const itemId = typeof spec === 'string' ? spec : spec && spec.itemId;
        const item = PG.rollTrainerItem && PG.rollTrainerItem(itemId);
        if (item) {
          state.player.trainerItems = state.player.trainerItems || [];
          state.player.trainerItems.push(item);
          got.push('🎖️ ' + item.name);
        }
      }
    }
    if (reward.xp) { const lv = PG.addPlayerXp(state, reward.xp); got.push('+' + reward.xp + ' XP' + (lv ? ' (Lên cấp ' + state.player.level + '!)' : '')); }
    return got;
  }

  /* ---------------- HOÀN THÀNH THỬ THÁCH VÙNG ---------------- */
  function regionChallengeStatus(regionId) {
    const rid = regionId || state.region;
    const flags = (state.regionChallenges && state.regionChallenges[rid]) || {};
    const kinds = (PG.REGION_CHALLENGE_KINDS || ['trainer', 'gym', 'raid']).slice();
    const done = kinds.filter(k => !!flags[k]);
    return {
      regionId: rid, kinds, flags: Object.assign({}, flags), done, total: kinds.length,
      cleared: done.length === kinds.length, claimed: !!flags.rewardClaimed
    };
  }

  function checkRegionClear(regionId) {
    const st = regionChallengeStatus(regionId);
    if (!PG.REGIONS[st.regionId] || !st.cleared || st.claimed) return null;
    state.regionChallenges = state.regionChallenges || {};
    const rec = state.regionChallenges[st.regionId] = state.regionChallenges[st.regionId] || {};
    rec.rewardClaimed = true;
    const reward = (PG.REGION_CLEAR_REWARDS || {})[st.regionId];
    return { regionId: st.regionId, reward: reward || {}, lines: grantReward(reward || {}) };
  }

  function markRegionChallenge(regionId, kind) {
    const kinds = PG.REGION_CHALLENGE_KINDS || ['trainer', 'gym', 'raid'];
    if (!PG.REGIONS[regionId] || kinds.indexOf(kind) < 0) return null;
    state.regionChallenges = state.regionChallenges || {};
    const rec = state.regionChallenges[regionId] = state.regionChallenges[regionId] || {};
    rec[kind] = true;
    return checkRegionClear(regionId);
  }

  /* ---------------- POKÉDEX ---------------- */
  function recordDex(speciesId, kind) {
    if (!state.pokedex.seen[speciesId]) state.pokedex.seen[speciesId] = Date.now();
    if (kind === 'caught') {
      if (!state.pokedex.caught[speciesId]) state.pokedex.caught[speciesId] = Date.now();
    }
    state.stats.speciesCaught = Object.keys(state.pokedex.caught).length;
    state.stats.gyms = state.badges.length;
  }
  function dexCounts() {
    return { seen: Object.keys(state.pokedex.seen).length, caught: Object.keys(state.pokedex.caught).length, total: PG.DEX_ORDER.length };
  }

  /* ---------------- THỜI TIẾT / SỰ KIỆN / NGÀY ---------------- */
  function rollWeather() {
    state.weather = {};
    for (const rid of PG.REGION_ORDER) {
      const r = PG.REGIONS[rid];
      state.weather[rid] = PG.pick(r.weatherPool);
    }
    state.weatherDate = PG.todayKey();
  }

  function rollEvent() {
    const date = PG.todayKey();
    const rnd = PG.mulberry32([...date].reduce((a, c) => a + c.charCodeAt(0), 0) * 7919);
    const ev = PG.EVENT_POOL[Math.floor(rnd() * PG.EVENT_POOL.length)];
    const active = { id: ev.id, name: ev.name, icon: ev.icon, desc: ev.desc, color: ev.color, date, endsAt: new Date().setHours(23, 59, 59, 999) };
    if (ev.id === 'spotlight') {
      active.type = PG.pick(PG.TYPE_ORDER.filter(t => !['quantum', 'celestial', 'neutral'].includes(t)));
      active.typeName = PG.TYPES[active.type].name;
      active.desc = 'Tỉ lệ xuất hiện Pokémon hệ ' + active.typeName + ' tăng mạnh trong 24 giờ.';
    }
    if (ev.id === 'community') {
      const pool = PG.DEX_ORDER.filter(id => PG.SPECIES[id].rarity !== 'legendary' && !['neutral', 'celestial'].includes(PG.SPECIES[id].types[0]));
      active.species = PG.pick(pool);
      active.speciesName = PG.SPECIES[active.species].name;
      active.desc = active.speciesName + ' xuất hiện dày đặc và dễ Shiny hơn trong 24 giờ.';
    }
    state.events = { date, active };
  }

  /* Bùng nổ: mỗi 5 phút chọn ngẫu nhiên 1 vùng BẤT KỲ (kể cả vùng chưa mở)
     và 1 loài sinh sống ở vùng đó. Loài bùng nổ cũng có thể xuất hiện ở mọi
     vùng khác, nên người chơi luôn bắt được dù chưa đi tới vùng gốc. */
  function rollOutbreak(silent) {
    const key = Math.floor(Date.now() / OUTBREAK_MS);
    const old = state.events.outbreak;
    if (old && old.cycleKey === key && PG.SPECIES[old.speciesId]) return false;
    const regions = (PG.REGION_ORDER || []).filter(rid => !!PG.REGIONS[rid]);
    if (!regions.length) {
      if (state.events.outbreak) { state.events.outbreak = null; save(true); }
      return false;
    }
    const regionId = PG.pick(regions);
    const pool = PG.DEX_ORDER.filter(id => {
      const sp = PG.SPECIES[id];
      return sp && sp.habitats.includes(regionId) && sp.rarity !== 'legendary' && !PG.TRUE_LEGENDARIES.includes(id);
    });
    // Ưu tiên loài hợp thời tiết hiện tại ~50% (vẫn luôn có fallback để test ổn định).
    const weather = PG.weatherFor(state, regionId);
    const favored = pool.filter(id => PG.weatherSpeciesOf && PG.weatherSpeciesOf(id, weather));
    const pickPool = favored.length && Math.random() < 0.5 ? favored : pool;
    const speciesId = PG.pick(pickPool.length ? pickPool : PG.DEX_ORDER);
    const sp = PG.SPECIES[speciesId];
    const type = (sp.types && sp.types[0]) || 'normal';
    state.events.outbreak = {
      cycleKey: key, regionId, regionName: (PG.REGIONS[regionId] || {}).name || regionId,
      speciesId, speciesName: sp.name, color: (PG.TYPES[type] || {}).color || '#fb7185',
      startedAt: key * OUTBREAK_MS, endsAt: (key + 1) * OUTBREAK_MS
    };
    save(true);
    if (!silent && PG.ui && PG.ui.toast) {
      PG.ui.toast('⚠️ Bùng nổ! ' + sp.name + ' đang xuất hiện dày đặc tại ' +
        ((PG.REGIONS[regionId] || {}).name || regionId) + ' trong 5 phút — vùng chưa mở thì chưa đi tới được.', 'gold', 5000);
    }
    return true;
  }

  function generateShop() {
    const date = PG.todayKey();
    const stock = [];
    const baseList = PG.SHOP_BASE.filter(id => (PG.itemInfo(id).unlock || 1) <= state.player.level + 2);
    const count = 9;
    const used = new Set();
    for (let i = 0; i < count; i++) {
      let id = PG.pick(baseList);
      let guard = 0;
      while (used.has(id) && guard++ < 20) id = PG.pick(baseList);
      used.add(id);
      const info = PG.itemInfo(id);
      let qty = info.kind === 'ball' ? PG.randInt(5, 20) : PG.randInt(1, 5);
      if (id === 'masterball') qty = 1;
      if (id === 'incubator') qty = PG.randInt(1, 3);
      stock.push({ uid: PG.uid('shop'), kind: 'item', id, qty, sold: 0, price: shopPrice(id, info.price || 100) });
    }
    // TM
    const tmIds = Object.keys(PG.TMS).filter(id => (PG.TMS[id].price || 1200) <= 2500 + state.player.level * 150);
    if (tmIds.length) {
      const tm = PG.pick(tmIds);
      stock.push({ uid: PG.uid('shop'), kind: 'item', id: tm, qty: 1, sold: 0, price: shopPrice(tm, PG.TMS[tm].price) });
    }
    // Đá tiến hóa
    const stoneIds = Object.keys(PG.STONES);
    const stone = PG.pick(stoneIds);
    stock.push({ uid: PG.uid('shop'), kind: 'item', id: stone, qty: PG.randInt(1, 2), sold: 0, price: shopPrice(stone, PG.STONES[stone].price) });
    // Trang bị
    const eqBase = PG.pick(Object.keys(PG.EQUIPMENT_BASES).filter(id => PG.EQUIPMENT_BASES[id].rarity !== 'legendary'));
    stock.push({ uid: PG.uid('shop'), kind: 'equipment', baseId: eqBase, qty: 1, sold: 0, price: shopPrice(eqBase, PG.RARITY[PG.EQUIPMENT_BASES[eqBase].rarity].price) });

    // Quầy may mắn cũ đã được thay bằng Quầy Vật Phẩm Huấn Luyện Viên (xem ensureTrainerShop).
    const discount = state.events.active && state.events.active.id === 'discount' ? 0.8 : 1;
    state.shop = { date, stock, lucky: [], discount };
  }

  function shopPrice(id, basePrice) {
    const date = state.shop && state.shop.date ? state.shop.date : PG.todayKey();
    let h = 0;
    const key = date + id;
    for (let i = 0; i < key.length; i++) h = ((h << 5) - h + key.charCodeAt(i)) | 0;
    const fluct = 0.88 + (Math.abs(h) % 25) / 100; // 0.88 - 1.12
    const discount = state.events.active && state.events.active.id === 'discount' ? 0.8 : 1;
    return Math.max(1, Math.round(basePrice * fluct * discount));
  }

  function ensureDaily(silent) {
    const today = PG.todayKey();
    let changed = false;
    if (state.weatherDate !== today) { rollWeather(); changed = true; }
    if (state.events.date !== today) { rollEvent(); changed = true; }
    if (state.shop.date !== today) { generateShop(); changed = true; }
    if (state.quests.dailyDate !== today) { generateQuests('daily'); changed = true; }
    if (state.quests.weeklyDate !== PG.weekKey()) { generateQuests('weekly'); changed = true; }
    // Mỗi trainer / HLV lang thang chỉ cho quà 1 lần/ngày: reset khi sang ngày mới.
    if (!state.dailyDefeats || state.dailyDefeats.date !== today) {
      state.dailyDefeats = { date: today, trainers: {}, gyms: {}, roaming: false };
      changed = true;
    }
    if (rollOutbreak(true)) changed = true;
    if (changed) save(true);
    return changed;
  }

  /* ---------------- QUẦY VẬT PHẨM HUẤN LUYỆN VIÊN (5 MÓN / 30 PHÚT) ---------------- */
  function cycleKey(ms) { return Math.floor(Date.now() / ms); }

  function hashUnit(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return (Math.abs(h) % 1000) / 1000;
  }

  /* Giá cố định theo từng vật phẩm: dù quầy xoay theo chu kỳ 30 phút,
     cùng một món luôn giữ nguyên giá để người chơi không bị "đổi giá". */
  function trainerShopPrice(cycleOrId, maybeId) {
    const itemId = maybeId || cycleOrId;
    const def = PG.TRAINER_ITEMS[itemId];
    if (!def) return 0;
    const rarity = PG.RARITY[def.rarity] || PG.RARITY.common;
    const base = rarity.price + PG.trainerItemPower(def) * 220 + 600;
    return Math.round(base * (0.86 + hashUnit('quay-hlv:' + itemId) * 0.34));
  }

  /** Chọn 5 món bằng hàm băm của chu kỳ: cùng chu kỳ thì ra cùng danh sách,
      reload trang hay render lại không làm mất mặt hàng đang định mua. */
  function generateTrainerShop() {
    const cycle = cycleKey(TRAINER_SHOP_MS);
    const defs = PG.TRAINER_ITEMS || {};
    const bias = { common: 0, rare: 0.12, epic: 0.24, legendary: 0.36 };
    const cap = { common: 2, rare: 2, epic: 2, legendary: 1 };
    const ranked = Object.keys(defs)
      .map(id => ({ id, score: hashUnit(cycle + '|' + id) + (bias[defs[id].rarity] || 0) }))
      .sort((a, b) => b.score - a.score);
    const picked = [];
    const used = {};
    for (const row of ranked) {
      const rarity = defs[row.id].rarity;
      if ((used[rarity] || 0) >= (cap[rarity] || 2)) continue;
      used[rarity] = (used[rarity] || 0) + 1;
      picked.push(row.id);
      if (picked.length >= TRAINER_SHOP_SIZE) break;
    }
    for (const row of ranked) {
      if (picked.length >= TRAINER_SHOP_SIZE) break;
      if (picked.indexOf(row.id) < 0) picked.push(row.id);
    }
    state.trainerShop = {
      cycleKey: cycle,
      nextAt: (cycle + 1) * TRAINER_SHOP_MS,
      size: TRAINER_SHOP_SIZE,
      stock: picked.map(itemId => ({
        uid: 'trshop-' + cycle + '-' + itemId,
        itemId,
        price: trainerShopPrice(itemId),
        sold: false
      }))
    };
  }

  function ensureTrainerShop(silent) {
    const cycle = cycleKey(TRAINER_SHOP_MS);
    const shop = state.trainerShop || (state.trainerShop = { cycleKey: null, stock: [], nextAt: null });
    const stock = shop.stock || [];
    if (shop.cycleKey !== cycle || stock.length !== TRAINER_SHOP_SIZE ||
        stock.some(x => !x || !PG.TRAINER_ITEMS[x.itemId] || typeof x.price !== 'number')) {
      generateTrainerShop();
      save(true);
      if (!silent && PG.ui && PG.ui.toast) PG.ui.toast('Quầy HLV đã làm mới: 5 món mới, chu kỳ 30 phút!', 'gold');
      return true;
    }
    return false;
  }

  /* ---------------- HỘP QUÀ BÍ ẨN (15 PHÚT / CHU KỲ) ----------------
     Dùng hash theo chu kỳ để danh sách ổn định trong một chu kỳ nhưng vẫn
     đổi ngẫu nhiên ở chu kỳ sau. Có chu kỳ không nhập hộp (≈30%). */
  function generateGiftBoxShop(cycle) {
    const key = typeof cycle === 'number' ? cycle : cycleKey(GIFTBOX_MS);
    const level = state.player && state.player.level || 1;
    const pool = (PG.GIFT_BOXES || []).filter(b => (b.minLevel || 1) <= level + 3);
    const stock = [];
    if (pool.length && hashUnit('gift-appear-' + key) < 0.7) {
      const count = 1 + Math.floor(hashUnit('gift-count-' + key) * GIFTBOX_SIZE);
      for (let i = 0; i < count; i++) {
        const def = pool[Math.floor(hashUnit('gift-kind-' + key + '-' + i) * pool.length)];
        stock.push({
          uid: 'gift-' + key + '-' + i,
          boxId: def.id, tier: def.tier,
          price: Math.round(def.price * (0.88 + hashUnit('gift-price-' + key + '-' + i) * 0.24)),
          sold: false
        });
      }
    }
    state.giftBoxShop = { cycleKey: key, stock: stock, nextAt: (key + 1) * GIFTBOX_MS };
  }

  function ensureGiftBoxShop(silent) {
    const key = cycleKey(GIFTBOX_MS);
    const shop = state.giftBoxShop || (state.giftBoxShop = { cycleKey: null, stock: [], nextAt: null });
    if (!Array.isArray(shop.stock)) shop.stock = [];
    const stale = shop.cycleKey !== key || shop.stock.some(x =>
      !x || !PG.giftBoxDef(x.boxId) || typeof x.price !== 'number');
    if (!stale) {
      shop.nextAt = (key + 1) * GIFTBOX_MS;
      return false;
    }
    generateGiftBoxShop(key);
    save(true);
    if (!silent && PG.ui && PG.ui.toast && state.giftBoxShop.stock.length) {
      PG.ui.toast('🎁 Chợ vừa nhập hộp quà bí ẩn — nhanh tay trước khi hết hạn!', 'gold', 4500);
    }
    return true;
  }

  /* Khu HLV: thắng mỗi người 1 lần / chu kỳ 30 phút. Sang chu kỳ mới thì
     xóa danh sách đã thắng; save cũ thiếu field vẫn chạy bình thường. */
  function ensureTrainerZone(silent) {
    const cycle = PG.trainerZoneCycle ? PG.trainerZoneCycle() : cycleKey(30 * 60 * 1000);
    const tz = state.trainerZone || (state.trainerZone = { cycleKey: null, defeated: {} });
    if (!tz.defeated || typeof tz.defeated !== 'object' || Array.isArray(tz.defeated)) tz.defeated = {};
    if (tz.cycleKey !== cycle) {
      tz.cycleKey = cycle;
      tz.defeated = {};
      save(true);
      return true;
    }
    return false;
  }

  /* ---------------- QUẦY NPC BÁN POKÉMON (20 PHÚT) ---------------- */
  function npcPokemonPrice(seed, speciesId, level) {
    const sp = PG.SPECIES[speciesId];
    if (!sp) return 0;
    const base = { common: 900, rare: 4200, legendary: 26000 }[sp.rarity] || 900;
    const bst = sp.base.reduce((a, b) => a + b, 0);
    const variance = 0.78 + hashUnit(seed + ':' + speciesId) * 0.56; // 0.78 - 1.34
    return Math.max(150, Math.round(base * (1 + level * 0.035 + bst / 2200) * variance / 10) * 10);
  }

  function generateNpcShop(key) {
    const cycle = key === undefined ? cycleKey(NPC_SHOP_MS) : key;
    const seed = 'npc' + cycle;
    const rarityPool = [
      { id: 'common', w: 62 }, { id: 'rare', w: 30 }, { id: 'legendary', w: 8 }
    ];
    const stock = [];
    const used = new Set();
    for (let i = 0; i < 6; i++) {
      let speciesId = null;
      let rarity = 'common';
      for (let guard = 0; guard < 25; guard++) {
        rarity = PG.weightedPick(rarityPool, x => x.w).id;
        const pool = PG.DEX_ORDER.filter(id => PG.SPECIES[id].rarity === rarity);
        const candidate = PG.pick(pool);
        if (!used.has(candidate)) { speciesId = candidate; break; }
      }
      if (!speciesId) speciesId = PG.pick(PG.DEX_ORDER);
      used.add(speciesId);
      const sp = PG.SPECIES[speciesId];
      rarity = sp.rarity;
      const level = rarity === 'legendary' ? PG.randInt(40, 70) : rarity === 'rare' ? PG.randInt(18, 45) : PG.randInt(5, 25);
      const multiplier = 0.78 + hashUnit(seed + ':' + speciesId) * 0.56;
      const price = npcPokemonPrice(seed, speciesId, level);
      stock.push({
        uid: PG.uid('npcshop'), speciesId, level, rarity, price,
        minIV: rarity === 'legendary' ? 20 : rarity === 'rare' ? 12 : 5,
        shiny: PG.chance(rarity === 'legendary' ? 0.05 : 0.02),
        deal: multiplier < 0.92 ? 'cheap' : multiplier > 1.12 ? 'pricey' : 'fair',
        sold: false
      });
    }
    state.npcShop = {
      cycleKey: cycle, stock,
      nextAt: (cycle + 1) * NPC_SHOP_MS
    };
  }

  function ensureNpcShop(silent) {
    const key = cycleKey(NPC_SHOP_MS);
    const shop = state.npcShop || (state.npcShop = { cycleKey: null, stock: [], nextAt: null });
    if (shop.cycleKey !== key || !shop.stock || !shop.stock.length) {
      generateNpcShop(key);
      save(true);
      if (!silent && PG.ui && PG.ui.toast) PG.ui.toast('NPC đã cập nhật Pokémon để bán!', 'gold');
      return true;
    }
    shop.nextAt = (key + 1) * NPC_SHOP_MS;
    return false;
  }

  /* ---------------- THƯƠNG HỘI: ghé theo ngày & vùng ---------------- */
  function merchantVisitKey(dayKey, regionId) { return String(dayKey) + ':' + String(regionId); }

  function merchantPrice(seed, def) {
    if (def.price) return Math.round(def.price * (0.92 + hashUnit(seed + ':' + (def.offerId || def.id || def.baseId)) * 0.16));
    if (def.kind === 'material') {
      const qty = def.qty || 1;
      return (PG.materialBuyPrice ? PG.materialBuyPrice(def.id, state.region) : Math.max(1, (PG.MATERIALS[def.id] || {}).price || 10)) * qty;
    }
    return 0;
  }

  function generateMerchantStock(visitKey, regionId, merchantId) {
    const merchant = PG.MERCHANTS[merchantId] || PG.MERCHANT_ORDER.map(id => PG.MERCHANTS[id]).find(m => !m.regionIds || m.regionIds.includes(regionId));
    const stock = [];
    const seed = visitKey + ':' + merchantId + ':' + regionId;
    const level = state.player.level;
    if (merchant) {
      for (const g of (merchant.goods || [])) {
        if (g.minLevel && level < g.minLevel) continue;
        if (g.regionIds && !g.regionIds.includes(regionId)) continue;
        const kind = g.kind || 'item';
        const entry = {
          uid: PG.uid('mch'), offerId: g.offerId || kind + '-' + (g.id || g.baseId || g.itemId),
          kind, qty: g.qty || 1, sold: 0, price: merchantPrice(seed, g), minLevel: g.minLevel || 1,
          note: g.note || ''
        };
        if (kind === 'item' || kind === 'material') entry.id = g.id;
        if (kind === 'equipment') entry.baseId = g.baseId;
        if (kind === 'trainer') entry.itemId = g.itemId;
        if (g.opts) entry.opts = g.opts;
        stock.push(entry);
      }
      for (const t of (merchant.trades || [])) {
        if (t.minLevel && level < t.minLevel) continue;
        stock.push({
          uid: PG.uid('mch'), offerId: t.offerId || 'trade', kind: 'trade', qty: 1, sold: 0, price: 0,
          minLevel: t.minLevel || 1, give: t.give, out: t.out, note: t.note || ''
        });
      }
    }
    if (!stock.length) {
      for (const mid of (merchant && merchant.buys) || ['stone', 'shell', 'seed']) {
        if (!PG.MATERIALS[mid]) continue;
        stock.push({ uid: PG.uid('mch'), offerId: 'buy-' + mid, kind: 'material', id: mid, qty: 3, sold: 0, price: merchantPrice(seed, { kind: 'material', id: mid, qty: 3, offerId: 'buy-' + mid }) });
      }
    }
    /* Lâu lâu thương nhân gửi đơn cần gấp nguyên liệu: trả cao hơn bán ngoài
       (1,6–2,1 lần giá thu mua thường). Cố định theo lượt ghé để không đổi
       khi render lại. */
    const wanted = ((merchant && merchant.buys) || []).filter(mid => PG.MATERIALS[mid]);
    if (wanted.length && hashUnit(seed + ':request') < 0.68) {
      const mid = wanted[Math.floor(hashUnit(seed + ':request-mat') * wanted.length) % wanted.length];
      const base = PG.materialSellPrice ? PG.materialSellPrice(mid, regionId) : Math.max(1, (PG.MATERIALS[mid].price || 10));
      const unit = Math.max(2, Math.round(base * (1.6 + hashUnit(seed + ':request-price') * 0.5)));
      stock.push({
        uid: PG.uid('mch'), offerId: 'request-' + mid, kind: 'request', id: mid,
        qty: 2 + Math.floor(hashUnit(seed + ':request-qty') * 3), sold: 0, price: unit,
        minLevel: 1, note: merchant.name + ' cần gấp ' + PG.MATERIALS[mid].name + ', trả giá cao hơn chợ.'
      });
    }
    const visit = {
      region: regionId, merchantId, stock, lastVisit: Date.now(),
      nextAt: Date.now() + 24 * 60 * 60 * 1000, isNew: true
    };
    state.merchant.visits[visitKey] = visit;
    state.merchant.history.unshift({ at: visit.lastVisit, region: regionId, merchantId, offerCount: stock.length });
    state.merchant.history = state.merchant.history.slice(0, 20);
    return visit;
  }

  function ensureMerchant(silent) {
    const shop = state.merchant || (state.merchant = { cycleKey: null, visitKey: null, region: null, merchantId: null, nextAt: null, stock: [], lastVisit: null, visits: {}, history: [] });
    if (!shop.visits || typeof shop.visits !== 'object') shop.visits = {};
    if (!Array.isArray(shop.history)) shop.history = [];
    const day = PG.todayKey();
    const region = state.region;
    const merchant = PG.merchantFor ? PG.merchantFor(region, day) : null;
    const key = merchantVisitKey(day, region);
    if (!merchant) {
      shop.cycleKey = day;
      shop.visitKey = null;
      shop.region = region;
      shop.merchantId = null;
      shop.stock = [];
      shop.nextAt = new Date().setHours(23, 59, 59, 999);
      return false;
    }
    let visit = shop.visits[key];
    let isNew = false;
    if (!visit || visit.merchantId !== merchant.id || !Array.isArray(visit.stock) || !visit.stock.length) {
      visit = generateMerchantStock(key, region, merchant.id);
      isNew = true;
      save(true);
      if (!silent && PG.ui && PG.ui.toast) PG.ui.toast('🌳 ' + merchant.name + ' đã ghé ' + (PG.REGIONS[region] || {}).name + '!', 'gold');
    }
    visit.isNew = false;
    shop.cycleKey = day;
    shop.visitKey = key;
    shop.region = region;
    shop.merchantId = merchant.id;
    shop.stock = visit.stock;
    shop.lastVisit = visit.lastVisit;
    shop.nextAt = visit.nextAt;
    return isNew;
  }

  function getMerchantVisit() {
    const shop = state.merchant;
    if (!shop) return null;
    return {
      merchant: PG.MERCHANTS[shop.merchantId] || null,
      region: shop.region,
      visitKey: shop.visitKey,
      stock: shop.stock || [],
      nextAt: shop.nextAt,
      lastVisit: shop.lastVisit,
      history: shop.history || []
    };
  }

  function generateQuests(kind) {
    const templates = PG.shuffle(PG.QUEST_TEMPLATES[kind]);
    const count = kind === 'daily' ? 4 : 3;
    const quests = [];
    for (let i = 0; i < count; i++) {
      const t = templates[i % templates.length];
      const target = PG.pick(t.targets);
      const q = {
        uid: PG.uid('q'), template: t.id, type: t.type, target,
        progress: 0, claimed: false, icon: t.icon,
        reward: t.reward, text: '', meta: {}
      };
      if (t.type === 'catch_type') {
        q.meta.type = PG.pick(PG.TYPE_ORDER.filter(x => !['quantum', 'celestial'].includes(x)));
        q.meta.typeName = PG.TYPES[q.meta.type].name;
        q.text = t.text(target, q.meta);
      } else {
        q.text = t.text(target);
      }
      quests.push(q);
    }
    if (kind === 'daily') {
      state.quests.dailyDate = PG.todayKey();
      state.quests.daily = quests;
      state.quests.claimedDaily = 0;
    } else {
      state.quests.weeklyDate = PG.weekKey();
      state.quests.weekly = quests;
      state.quests.claimedWeekly = 0;
    }
  }

  function questProgress(type, amount, meta) {
    if (!state) return;
    const all = [...(state.quests.daily || []), ...(state.quests.weekly || [])];
    for (const q of all) {
      if (q.claimed) continue;
      if (q.type !== type) continue;
      if (q.type === 'catch_type' && meta && meta.type && meta.type !== q.meta.type) continue;
      if (q.type === 'catch_rare' && meta && meta.rarity === 'common') continue;
      q.progress = Math.min(q.target, q.progress + amount);
    }
  }

  function claimQuest(kind, uid) {
    const list = kind === 'daily' ? state.quests.daily : state.quests.weekly;
    const q = list.find(x => x.uid === uid);
    if (!q) return { ok: false, msg: 'Không tìm thấy nhiệm vụ.' };
    if (q.claimed) return { ok: false, msg: 'Đã nhận thưởng rồi.' };
    if (q.progress < q.target) return { ok: false, msg: 'Chưa hoàn thành nhiệm vụ.' };
    q.claimed = true;
    const got = grantReward(q.reward);
    if (kind === 'daily') state.quests.claimedDaily++;
    else state.quests.claimedWeekly++;
    save(true);
    return { ok: true, msg: 'Nhận thưởng: ' + got.join(', ') };
  }

  /* ---------------- THÀNH TỰU ---------------- */
  function achievementTier(ach) {
    const v = state.stats[ach.stat] || 0;
    let tier = -1;
    for (let i = 0; i < ach.tiers.length; i++) if (v >= ach.tiers[i]) tier = i;
    return tier;
  }
  function claimedTier(ach) {
    return state.achievements[ach.id] === undefined ? -1 : state.achievements[ach.id];
  }
  function checkAchievements() {
    state.stats.speciesCaught = Object.keys(state.pokedex.caught).length;
    state.stats.gyms = state.badges.length;
    const newly = [];
    for (const ach of PG.ACHIEVEMENTS) {
      const tier = achievementTier(ach);
      const claimed = claimedTier(ach);
      if (tier > claimed) newly.push({ ach, tier });
    }
    return newly;
  }
  function claimAchievement(id) {
    const ach = PG.ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return { ok: false };
    const tier = achievementTier(ach);
    const claimed = claimedTier(ach);
    if (tier <= claimed) return { ok: false, msg: 'Chưa đạt mốc mới.' };
    state.achievements[id] = tier;
    const got = grantReward(ach.rewards[tier]);
    save(true);
    return { ok: true, msg: 'Thành tựu ' + ach.name + ' cấp ' + ['Đồng', 'Bạc', 'Vàng'][tier] + ': ' + got.join(', ') };
  }

  /* ---------------- ĐĂNG NHẬP ---------------- */
  function canClaimLogin() {
    return state.login.lastClaim !== PG.todayKey();
  }
  function claimLogin() {
    if (!canClaimLogin()) return { ok: false, msg: 'Hôm nay đã nhận rồi.' };
    const yesterday = new Date(Date.now() - 86400000);
    const yKey = yesterday.getFullYear() + '-' + PG.pad(yesterday.getMonth() + 1) + '-' + PG.pad(yesterday.getDate());
    if (state.login.lastClaim === yKey) state.login.streak = Math.min(7, state.login.streak + 1);
    else state.login.streak = 1;
    state.login.lastClaim = PG.todayKey();
    const r = PG.LOGIN_REWARDS[state.login.streak - 1];
    const got = grantReward(r);
    save(true);
    return { ok: true, msg: 'Chuỗi ' + state.login.streak + ' ngày: ' + got.join(', ') };
  }

  /* ---------------- MÃ QUÀ ---------------- */
  const GIFT_CODES = {
    motkiki: { coins: 10000, diamonds: 100, legendary: true, label: 'motkiki' },
    dio: { coins: 100000, diamonds: 500, label: 'Dio' },
    niggest: { coins: 0, diamonds: 0, trainerLevel: 30, label: 'niggest' },
    motlala: { coins: 0, diamonds: 0, items: { potion: 50, revive: 5, razz: 20 }, label: 'motlala' }
  };
  // Quà cần hiện số đầy đủ (100.000), không rút gọn thành 100K như PG.fmt.
  const giftFmt = n => Math.round(n || 0).toLocaleString('vi-VN');

  function redeemCode(raw) {
    const key = String(raw || '').trim().toLowerCase();
    const def = GIFT_CODES[key];
    if (!def) return { ok: false, msg: 'Mã không hợp lệ.' };
    state.redeemedCodes = state.redeemedCodes || {};
    if (state.redeemedCodes[key]) return { ok: false, msg: 'Mã này đã được sử dụng.' };

    // Cộng trực tiếp để không bị nhân hệ số Giờ Vàng như grantReward().
    addCoins(def.coins);
    addDiamonds(def.diamonds);

    // Quà vật phẩm: cộng thẳng vào túi, không bị nhân hệ số sự kiện.
    for (const [itemId, qty] of Object.entries(def.items || {})) addItem(itemId, qty);

    let pokemon = null;
    if (def.legendary) {
      const pool = (PG.TRUE_LEGENDARIES || []).filter(id => PG.SPECIES[id]);
      if (!pool.length) return { ok: false, msg: 'Chưa có Pokémon huyền thoại để tặng.' };
      const sid = PG.pick(pool);
      pokemon = PG.createPokemon(sid, PG.randInt(45, 55), { minIV: 15, source: 'gift' });
      state.pokemon.push(pokemon);
      if (state.team.length < 6) state.team.push(pokemon.uid);
      PG.recordDex(sid, 'caught');
      state.stats.legendariesCaught = (state.stats.legendariesCaught || 0) + 1;
    }

    // Mã nâng cấp HLV: dùng addPlayerXp để đi đúng đường lên cấp (HP/thể lực
    // được tính lại), không hạ cấp nếu người chơi đã vượt mức mã cho.
    let leveledTo = 0;
    if (def.trainerLevel && state.player.level < def.trainerLevel) {
      let guard = 0;
      while (state.player.level < def.trainerLevel && guard++ < 200) {
        PG.addPlayerXp(state, PG.playerXpNeeded(state.player.level));
      }
      state.player.level = Math.max(state.player.level, def.trainerLevel);
      state.player.staminaMax = 100 + PG.trainerBonuses(state).totals.stamina;
      state.player.stamina = state.player.staminaMax;
      leveledTo = state.player.level;
    }

    state.redeemedCodes[key] = { at: Date.now() };
    save(true);
    const parts = ['+' + giftFmt(def.coins || 0) + ' Xu', '+' + giftFmt(def.diamonds || 0) + ' Kim Cương'];
    for (const [itemId, qty] of Object.entries(def.items || {})) {
      const info = PG.itemInfo(itemId);
      parts.push(qty + ' ' + (info && info.name ? info.name : itemId));
    }
    if (pokemon) parts.push('1 Pokémon huyền thoại');
    if (leveledTo) parts.push('HLV lên cấp ' + leveledTo);
    return {
      ok: true,
      msg: 'Nhận mã thành công: ' + parts.join(', ') + '!',
      reward: def,
      pokemon,
      leveledTo
    };
  }

  /* ---------------- KHOẢNG CÁCH / TRỨNG / BẠN ĐỒNG HÀNH ---------------- */
  function addDistance(km) {
    state.distance.total += km;
    state.stats.km = (state.stats.km || 0) + km;
    questProgress('walk_km', km);
    let eggReady = [];
    for (const egg of state.eggs) {
      if (egg.incubating && !egg.ready) {
        egg.walked = Math.min(egg.km, (egg.walked || 0) + km);
        if (egg.walked >= egg.km) { egg.ready = true; eggReady.push(egg); }
      }
    }
    let buddyCandy = 0;
    if (state.buddy) {
      const bp = state.pokemon.find(p => p.uid === state.buddy);
      if (bp) {
        const need = buddyKm(bp);
        state.buddyProgress += km;
        while (state.buddyProgress >= need) {
          state.buddyProgress -= need;
          PG.addCandy(state, bp.speciesId, 1);
          buddyCandy++;
        }
      }
    }
    return { eggReady, buddyCandy };
  }
  function buddyKm(p) {
    const sp = PG.SPECIES[p.speciesId];
    return sp.rarity === 'legendary' ? 5 : sp.rarity === 'rare' ? 3 : 1;
  }
  function addEgg(km, autoIncubate) {
    const def = PG.EGG_TYPES && PG.EGG_TYPES.random ? PG.EGG_TYPES.random : {};
    const egg = {
      uid: PG.uid('egg'), km: km || def.km || 2, walked: 0,
      incubating: false, ready: false, acquiredAt: Date.now(),
      type: 'random'
    };
    if (autoIncubate !== false && (state.bag.incubator || 0) > 0) {
      removeItem('incubator', 1);
      egg.incubating = true;
    }
    state.eggs.push(egg);
    return egg;
  }
  function normalizeEggs(s) {
    if (!Array.isArray(s.eggs)) s.eggs = [];
    for (const egg of s.eggs) {
      if (!egg || typeof egg !== 'object') continue;
      // Save cũ có thể chứa trứng chọn hệ: chuyển hết về trứng random.
      egg.type = 'random';
      egg.km = (PG.EGG_TYPES && PG.EGG_TYPES.random && PG.EGG_TYPES.random.km) || 2;
      egg.walked = Number(egg.walked) || 0;
    }
  }
  function startEgg(uid) {
    const egg = state.eggs.find(e => e.uid === uid);
    if (!egg) return { ok: false, msg: 'Không tìm thấy trứng.' };
    if (egg.incubating) return { ok: false, msg: 'Trứng đang ấp rồi.' };
    if ((state.bag.incubator || 0) < 1) return { ok: false, msg: 'Cần Lò Ấp. Mua ở Chợ hoặc chế tạo.' };
    removeItem('incubator', 1);
    egg.incubating = true;
    save(true);
    return { ok: true, msg: 'Bắt đầu ấp trứng ' + egg.km + 'km!' };
  }
  function hatchEgg(uid, luckFx) {
    const egg = state.eggs.find(e => e.uid === uid);
    if (!egg || !egg.ready) return { ok: false, msg: 'Trứng chưa nở.' };
    const def = PG.EGG_TYPES && PG.EGG_TYPES.random;
    const pool = (def && def.pool && def.pool.length ? def.pool : null) ||
      PG.EGG_POOLS[egg.km] || PG.EGG_POOLS[2];
    const sid = PG.weightedPick(pool, id => {
      const sp = PG.SPECIES[id];
      if (!sp) return 0;
      return sp.rarity === 'legendary' ? 2 : sp.rarity === 'rare' ? 14 : 40;
    });
    const p = PG.createPokemon(sid, PG.randInt(5, 15), {
      minIV: 10, shinyBoost: 0.002 + (luckFx ? luckFx.shiny : 0),
      source: 'egg', luck: luckFx ? luckFx.raw : 0
    });
    state.pokemon.push(p);
    state.eggs = state.eggs.filter(e => e.uid !== uid);
    state.stats.eggsHatched = (state.stats.eggsHatched || 0) + 1;
    questProgress('hatch', 1);
    recordDex(sid, 'caught');
    save(true);
    return { ok: true, pokemon: p };
  }

  /* ---------------- CHỢ NGƯỜI CHƠI ---------------- */
  function listOnMarket(uid, price) {
    const idx = state.pokemon.findIndex(p => p.uid === uid);
    if (idx < 0) return { ok: false, msg: 'Không tìm thấy Pokémon.' };
    if (state.team.includes(uid) || state.buddy === uid) return { ok: false, msg: 'Không thể bán Pokémon trong đội hoặc bạn đồng hành.' };
    const p = state.pokemon[idx];
    if (p.favorite) return { ok: false, msg: 'Pokémon yêu thích không thể bán.' };
    if (price < 100) return { ok: false, msg: 'Giá tối thiểu 100 Xu.' };
    state.pokemon.splice(idx, 1);
    const listing = {
      uid: PG.uid('mkt'), pokemon: p, price,
      listedAt: Date.now(), soldAt: Date.now() + PG.randInt(2, 12) * 60000,
      status: 'active'
    };
    state.market.listings.push(listing);
    save(true);
    return { ok: true, msg: 'Đã đăng bán ' + PG.SPECIES[p.speciesId].name + ' với giá ' + PG.fmt(price) + ' Xu. NPC sẽ mua trong vài phút.' };
  }
  function cancelListing(uid) {
    const idx = state.market.listings.findIndex(l => l.uid === uid);
    if (idx < 0) return { ok: false, msg: 'Không tìm thấy tin đăng.' };
    const l = state.market.listings[idx];
    state.pokemon.push(l.pokemon);
    state.market.listings.splice(idx, 1);
    save(true);
    return { ok: true, msg: 'Đã hủy tin đăng, Pokémon trở về Kho.' };
  }
  function processMarket(silent) {
    const now = Date.now();
    const tick = Math.floor(now / 15000);
    const sold = [];
    for (const l of state.market.listings) {
      if (l.status !== 'active' || now < l.soldAt) continue;
      // NPC mua với xác suất giảm dần theo giá: tin giá cao có thể lâu hơn vài phút.
      // hashUnit theo uid + tick để cùng một lượt kiểm tra không bị random lại khi tải lại game.
      const chance = Math.max(0.25, Math.min(0.9, 0.9 - l.price / 60000));
      if (hashUnit(l.uid + ':' + tick) > chance) continue;
      l.status = 'sold';
      addCoins(l.price);
      state.market.history.unshift({ name: PG.SPECIES[l.pokemon.speciesId].name, price: l.price, at: now });
      sold.push(l);
      if (!silent && PG.toast) PG.toast('NPC đã mua ' + PG.SPECIES[l.pokemon.speciesId].name + ' với giá ' + PG.fmt(l.price) + ' Xu!', 'success');
    }
    state.market.listings = state.market.listings.filter(l => l.status !== 'sold');
    state.market.history = state.market.history.slice(0, 20);
    if (sold.length) save(true);
    return sold;
  }

  /** Gộp hai nguồn chợ thành một danh sách cho giao diện: tin người chơi + hàng NPC. */
  function getMarketListings() {
    const rows = [];
    for (const l of state.market.listings || []) {
      if (l.status !== 'active') continue;
      rows.push({
        source: 'player', uid: l.uid, pokemon: l.pokemon, price: l.price,
        soldAt: l.soldAt, listedAt: l.listedAt
      });
    }
    for (const e of (state.npcShop && state.npcShop.stock) || []) {
      if (e.sold || !PG.SPECIES[e.speciesId]) continue;
      rows.push({
        source: 'npc', uid: e.uid, speciesId: e.speciesId, level: e.level,
        rarity: e.rarity, price: e.price, minIV: e.minIV, shiny: e.shiny,
        deal: e.deal
      });
    }
    return rows;
  }

  /* ---------------- STARTER ---------------- */
  function chooseStarter(speciesId) {
    if (state.player.starterChosen) return { ok: false };
    if (!STARTERS.includes(speciesId)) return { ok: false, msg: 'Không hợp lệ.' };
    const p = PG.createPokemon(speciesId, 5, { minIV: 15, source: 'starter', perfectIV: false });
    state.pokemon.push(p);
    state.team = [p.uid];
    state.buddy = p.uid;
    state.player.starterChosen = true;
    recordDex(speciesId, 'caught');
    save(true);
    return { ok: true, pokemon: p };
  }

  PG.SAVE_KEY = SAVE_KEY;
  PG.STARTERS = STARTERS;
  PG.REMOVED_SPECIES = REMOVED_SPECIES;
  PG.REMOVED_ANIMA20D = REMOVED_ANIMA20D;
  PG.defaultState = defaultState;
  PG.mergeDefaults = (saved, def) => mergeDefaults(saved, def || defaultState());
  PG.loadState = load;
  PG.getState = getState;
  PG.applyMotionSettings = applyMotionSettings;
  PG.saveState = save;
  PG.exportSave = exportSave;
  PG.importSave = importSave;
  PG.resetState = reset;
  PG.tickStamina = tickStamina;
  PG.tickHeal = tickHeal;
  PG.staminaMax = staminaMax;
  PG.staminaNextIn = staminaNextIn;
  PG.spendStamina = spendStamina;
  PG.restoreStamina = restoreStamina;
  PG.addItem = addItem;
  PG.removeItem = removeItem;
  PG.addMaterial = addMaterial;
  PG.removeMaterial = removeMaterial;
  PG.bagCount = bagCount;
  PG.bagCapacity = bagCapacity;
  PG.addCoins = addCoins;
  PG.addStardust = addStardust;
  PG.addDiamonds = addDiamonds;
  PG.grantReward = grantReward;
  PG.regionChallengeStatus = regionChallengeStatus;
  PG.checkRegionClear = checkRegionClear;
  PG.markRegionChallenge = markRegionChallenge;
  PG.recordDex = recordDex;
  PG.dexCounts = dexCounts;
  PG.ensureDaily = ensureDaily;
  PG.rollOutbreak = rollOutbreak;
  PG.OUTBREAK_MS = OUTBREAK_MS;
  PG.generateShop = generateShop;
  PG.shopPrice = shopPrice;
  PG.ensureTrainerShop = ensureTrainerShop;
  PG.GIFTBOX_MS = GIFTBOX_MS;
  PG.GIFTBOX_SIZE = GIFTBOX_SIZE;
  PG.generateGiftBoxShop = generateGiftBoxShop;
  PG.ensureGiftBoxShop = ensureGiftBoxShop;
  PG.ensureTrainerZone = ensureTrainerZone;
  PG.generateTrainerShop = generateTrainerShop;
  PG.trainerShopPrice = trainerShopPrice;
  PG.ensureNpcShop = ensureNpcShop;
  PG.generateNpcShop = generateNpcShop;
  PG.npcPokemonPrice = npcPokemonPrice;
  PG.TRAINER_SHOP_MS = TRAINER_SHOP_MS;
  PG.TRAINER_SHOP_SIZE = TRAINER_SHOP_SIZE;
  PG.NPC_SHOP_MS = NPC_SHOP_MS;
  PG.ensureMerchant = ensureMerchant;
  PG.generateMerchantStock = generateMerchantStock;
  PG.getMerchantVisit = getMerchantVisit;
  PG.questProgress = questProgress;
  PG.claimQuest = claimQuest;
  PG.achievementTier = achievementTier;
  PG.claimedTier = claimedTier;
  PG.checkAchievements = checkAchievements;
  PG.claimAchievement = claimAchievement;
  PG.canClaimLogin = canClaimLogin;
  PG.claimLogin = claimLogin;
  PG.GIFT_CODES = GIFT_CODES;
  PG.redeemCode = redeemCode;
  PG.addDistance = addDistance;
  PG.buddyKm = buddyKm;
  PG.addEgg = addEgg;
  PG.startEgg = startEgg;
  PG.hatchEgg = hatchEgg;
  PG.listOnMarket = listOnMarket;
  PG.cancelListing = cancelListing;
  PG.processMarket = processMarket;
  PG.getMarketListings = getMarketListings;
  PG.chooseStarter = chooseStarter;
})();
