/* ============================================================
   ĐI DẠO, SINH POKÉMON, NÉM BÓNG, TỈ LỆ BẮT
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;

  const THROW_QUALITY = {
    miss:      { id: 'miss', label: 'Trượt', mult: 0, xp: 0, color: '#ef4444' },
    hit:       { id: 'hit', label: 'Trúng', mult: 1, xp: 5, color: '#e2e8f0' },
    nice:      { id: 'nice', label: 'Tốt', mult: 1.1, xp: 15, color: '#4ade80' },
    great:     { id: 'great', label: 'Rất tốt', mult: 1.25, xp: 30, color: '#38bdf8' },
    excellent: { id: 'excellent', label: 'Tuyệt vời', mult: 1.45, xp: 60, color: '#fbbf24' }
  };

  const STATUS_CATCH = {
    sleep: 2.2, freeze: 2.2, paralysis: 1.6, poison: 1.25, toxic: 1.25,
    burn: 1.25, confusion: 1.1, fear: 1.1, leech: 1
  };

  // Giảm nhẹ hệ số mọi loại bóng (~4%) nhưng giữ nguyên ưu thế tương đối.
  const BALL_TUNING = 0.96;
  // Huấn luyện viên lang thang: xuất hiện lâu lâu, ở lại 15 phút.
  const ROAMING_MS = 15 * 60 * 1000;
  const ROAMING_CHANCE = 0.06;

  const WEATHER_TYPES = {
    sunny: ['fire', 'grass'],
    rain: ['water', 'electric'],
    snow: ['ice'],
    sandstorm: ['rock', 'ground', 'steel'],
    fog: ['ghost', 'psychic', 'dark', 'fairy'],
    clear: []
  };
  const NIGHT_TYPES = ['ghost', 'dark', 'psychic', 'fairy'];
  const DAY_TYPES = ['normal', 'grass', 'fire', 'water', 'flying'];

  function ballMultiplier(ballId, species, opts) {
    const o = opts || {};
    const ball = PG.BALLS[ballId];
    if (!ball) return 1;
    let mult = ball.mult;
    const types = species.types;
    if (ballId === 'netball' && (types.includes('water') || types.includes('bug'))) mult = 3;
    if (ballId === 'duskball' && (o.regionId === 'cave' || o.isNight)) mult = 3;
    if (ballId === 'quickball' && (o.throws || 0) === 0) mult = 4;
    if (ballId === 'timerball') mult = Math.min(3, 1.2 + (o.throws || 0) * 0.3);
    if (ballId === 'celestialball' && types.includes('celestial')) mult = 3;
    if (ballId === 'celestialball' && !types.includes('celestial')) mult = 1.5;
    // Bóng Raid: thưởng sau khi hạ Boss, tỉ lệ bắt rất cao khi dùng đúng Boss.
    if (ballId === 'raid-ball') {
      mult = o.source === 'raid' ? 4.5 : 2.5;
    }
    return mult;
  }

  function catchChance(encounter, ballId, qualityId, berryId, state) {
    const p = encounter.pokemon;
    const sp = PG.SPECIES[p.speciesId];
    const maxHp = PG.getStats(p).hp;
    const hpPct = PG.clamp(p.hp / maxHp, 0, 1);
    const ball = PG.BALLS[ballId];
    if (!ball) return 0;
    // Hệ Thiên chỉ bắt bằng Ultra trở lên / Thiên Cầu
    if (sp.types.includes('celestial') && !['ultraball', 'masterball', 'celestialball'].includes(ballId)) return 0;
    if (ballId === 'masterball') return 0.995;

    let chance = sp.catchRate;
    chance *= ballMultiplier(ballId, sp, {
      regionId: encounter.regionId, isNight: encounter.isNight, throws: encounter.throws,
      source: encounter.source
    }) * BALL_TUNING;
    // HP càng thấp tăng tỉ lệ bắt rõ rệt: đầy máu chỉ 32%, gần ngất gấp ~3 lần.
    // Dùng luỹ thừa để 1 phát đ đầu tiên cũng có khác biệt thấy được.
    chance *= 0.32 + 0.68 * Math.pow(1 - hpPct, 1.4);
    chance *= STATUS_CATCH[p.status] || 1;
    chance *= 1 + Math.min(0.35, (state.player.level - 1) * 0.007);
    const q = THROW_QUALITY[qualityId] || THROW_QUALITY.hit;
    chance *= q.mult;
    // Mọi quả có catchMult đều áp dụng được khi ném (kể cả Berry Ngọt/Nắng/Hòa Hợp).
    const berry = berryId ? PG.BERRIES[berryId] : null;
    if (berry && berry.catchMult) chance *= berry.catchMult;
    // Đội hình có thiện cảm cao hỗ trợ thu phục thêm tối đa 12%.
    const team = (state.team || []).map(uid => state.pokemon.find(x => x.uid === uid)).filter(Boolean);
    if (team.length) {
      const avgFriendship = team.reduce((sum, m) => sum + (m.friendship || 0), 0) / team.length;
      chance *= 1 + Math.min(0.12, avgFriendship / 100 * 0.12);
    }
    if (sp.rarity === 'rare') chance *= 0.9;
    if (sp.rarity === 'legendary') chance *= 0.72;
    // Bùng nổ xuất hiện dày hơn nhưng khó bắt hơn; Shiny/đột biến cũng khó bắt hơn.
    if (encounter.outbreak) chance *= 0.82;
    if (p.shiny) chance *= 0.78;
    if (p.mutations && p.mutations.length) chance *= Math.max(0.72, 1 - p.mutations.length * 0.1);
    const fx = PG.trainerBonuses(state).luckFx;
    chance *= 1 + Math.min(0.2, fx.effective * 0.0015);
    if (sp.types.includes('celestial')) chance *= 0.55;
    return PG.clamp(chance, 0.05, 0.98);
  }

  function ringColor(chance) {
    if (chance >= 0.6) return '#4ade80';
    if (chance >= 0.35) return '#facc15';
    if (chance >= 0.18) return '#fb923c';
    return '#ef4444';
  }

  function qualityFromScale(scale) {
    if (scale <= 0.42) return THROW_QUALITY.excellent;
    if (scale <= 0.6) return THROW_QUALITY.great;
    if (scale <= 0.8) return THROW_QUALITY.nice;
    return THROW_QUALITY.hit;
  }

  function regionSpawnPool(regionId, opts) {
    const o = opts || {};
    const region = PG.REGIONS[regionId];
    const night = PG.isNight();
    const weather = PG.weatherFor(PG.getState(), regionId);
    const weatherTypes = WEATHER_TYPES[weather] || [];
    const events = PG.getState().events || {};
    const event = events.active;
    const outbreak = events.outbreak;
    const fx = PG.trainerBonuses(PG.getState());
    const list = [];
    let outbreakIndex = -1;
    let outbreakBase = 0;
    let othersBase = 0;
    for (const id of PG.DEX_ORDER) {
      const sp = PG.SPECIES[id];
      // Loài đang bùng nổ xuất hiện ở MỌI vùng, kể cả vùng chưa mở khóa.
      const isOutbreakMon = !!(outbreak && id === outbreak.speciesId);
      if (!sp.habitats.includes(regionId) && !isOutbreakMon) continue;
      if (PG.TRUE_LEGENDARIES.includes(id) && !isOutbreakMon) continue;
      let w = sp.spawnWeight;
      if (sp.types.some(t => region.types.includes(t))) w *= 1.15;
      if (sp.types.some(t => weatherTypes.includes(t))) w *= 1.7;
      // Loài được gán riêng cho thời tiết hiện tại thì xuất hiện rõ rệt hơn.
      if (PG.weatherSpeciesOf && PG.weatherSpeciesOf(id, weather)) w *= 2.4;
      if (weather === 'rain' && sp.types.includes('fire')) w *= 0.55;
      if (weather === 'sunny' && sp.types.includes('water')) w *= 0.6;
      if (night && sp.types.some(t => NIGHT_TYPES.includes(t))) w *= 1.5;
      if (!night && sp.types.some(t => DAY_TYPES.includes(t))) w *= 1.25;
      if (region.featured && region.featured.includes(id)) w *= 2.2;
      // Trọng số gốc (chưa áp sự kiện) để tính hệ số bùng nổ ổn định.
      const baseW = w;
      if (event) {
        if (event.id === 'spotlight' && sp.types.includes(event.type)) w *= 3;
        if (event.id === 'community' && event.species === id) w *= 8;
        if (event.id === 'golden-hour') {
          if (sp.rarity === 'rare' || sp.rarity === 'legendary') w *= 1.35;
          if (sp.rarity === 'common') w *= 0.85;
        }
      }
      // Bùng nổ: chỉ đẩy nhẹ trọng số của 1 loài, các loài khác giữ nguyên.
      if (outbreak) {
        if (isOutbreakMon) { outbreakIndex = list.length; outbreakBase = baseW; }
        else if (regionId === outbreak.regionId) othersBase += baseW;
      }
      if (sp.rarity !== 'common') w *= 1 + Math.min(2.5, fx.totals.rareFind / 35);
      if (o.legendaryOnly && sp.rarity !== 'legendary') continue;
      if (!o.legendaryOnly && sp.rarity === 'legendary') w *= 0.8;
      list.push({ id, w });
    }
    if (outbreakIndex >= 0) {
      // Bùng nổ chỉ làm loài đó xuất hiện "cao hơn một chút" (≈3–4x), không áp đảo
      // toàn bộ vùng. Hệ số vẫn lấy từ trọng số GỐC nên Giờ Vàng / sự kiện khác
      // tiếp tục tăng/giảm đúng trọng số của chúng.
      const mult = PG.clamp(1 + othersBase / (Math.max(0.0001, outbreakBase) * 12), 2.5, 4.5);
      list[outbreakIndex].w *= mult;
    }
    if (!list.length) {
      // fallback
      for (const id of PG.DEX_ORDER) {
        const sp = PG.SPECIES[id];
        if (sp.habitats.includes(regionId) && !PG.TRUE_LEGENDARIES.includes(id)) list.push({ id, w: 1 });
      }
    }
    return list;
  }

  /** Cân bằng Pokémon hoang: cộng chỉ số thật vào bonusStats để HP/tỉ lệ bắt
      và trận đấu cùng dùng một bộ chỉ số (không làm lệch thanh máu). */
  function balanceWildStats(p) {
    const state = PG.getState();
    const totals = (PG.trainerBonuses(state) || {}).totals || {};
    const lv = p.level;
    const hpBonus = Math.round(PG.clamp((totals.hp || 0) * 0.55 + lv * 2, 0, 180));
    const otherBonus = Math.round(PG.clamp(
      ((totals.atk || 0) + (totals.def || 0)) * 0.22 + lv * 0.8, 0, 70));
    p.bonusStats = p.bonusStats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    p.bonusStats.hp = (p.bonusStats.hp || 0) + hpBonus;
    for (const k of ['atk', 'def', 'spa', 'spd', 'spe']) p.bonusStats[k] = (p.bonusStats[k] || 0) + otherBonus;
    p.hp = PG.getStats(p).hp;
    return p;
  }

  function spawnEncounter(regionId, opts) {
    const o = opts || {};
    const state = PG.getState();
    const region = PG.REGIONS[regionId];
    const pool = regionSpawnPool(regionId, o);
    const picked = PG.weightedPick(pool, x => x.w);
    const sid = o.speciesId || picked.id;
    const sp = PG.SPECIES[sid];
    const baseLv = Math.max(region.unlock.level, 2);
    let level = o.level || PG.clamp(baseLv + PG.randInt(-1, 3), 2, 60);
    if (sp.rarity === 'legendary') level += 3;
    const night = PG.isNight();
    const weather = PG.weatherFor(state, regionId);
    const harsh = !!region.hazard;
    const fx = PG.trainerBonuses(state).luckFx;
    let shinyBoost = 0;
    let mutationBoost = 0;
    const outbreak = state.events && state.events.outbreak;
    const isOutbreak = !!(outbreak && outbreak.speciesId === sid);
    if (state.events.active && state.events.active.id === 'community' && state.events.active.species === sid) shinyBoost += 0.006;
    if (isOutbreak) { shinyBoost += 0.012; mutationBoost += 0.07; }
    if (state.bag['shiny-charm']) shinyBoost += 0.002;
    const p = PG.createPokemon(sid, level, {
      luck: fx.raw,
      shinyBoost,
      mutationBoost,
      regionType: region.types[0],
      harshRegion: harsh,
      night,
      source: o.source || 'wild'
    });
    balanceWildStats(p);
    PG.recordDex(sid, 'seen');
    return {
      pokemon: p, regionId, weather, isNight: night,
      throws: 0, startedAt: Date.now(), caught: false, fled: false,
      source: o.source || 'walk', outbreak: isOutbreak,
      legendary: PG.TRUE_LEGENDARIES.includes(sid)
    };
  }

  function summonLegendary() {
    const state = PG.getState();
    if (!PG.isRegionUnlocked(state, 'temple')) return { ok: false, msg: 'Đền Cổ chưa mở khóa.' };
    if ((state.bag['temple-key'] || 0) < 1) return { ok: false, msg: 'Cần Chìa Khóa Đền Cổ. Chế tạo từ Cổ Vật hoặc nhận từ NPC Đền Cổ.' };
    PG.removeItem('temple-key', 1);
    const sid = PG.pick(PG.TRUE_LEGENDARIES.filter(id => PG.SPECIES[id]));
    const enc = spawnEncounter('temple', { speciesId: sid, level: PG.randInt(45, 55), source: 'summon', legendaryOnly: false });
    enc.legendary = true;
    return { ok: true, encounter: enc };
  }

  /** Tạo một thử thách lang thang ngẫu nhiên, đội hình theo vùng hiện tại. */
  function buildRoamingTrainer(regionId, template) {
    const region = PG.REGIONS[regionId] || PG.REGIONS.forest;
    const t = template || PG.pick(PG.ROAMING_TRAINERS || []);
    if (!t) return null;
    const now = Date.now();
    const lv = Math.max(2, (region.unlock && region.unlock.level ? region.unlock.level : 1) + PG.randInt(0, 4));
    let pool = (region.featured || []).filter(id => PG.SPECIES[id] && !PG.TRUE_LEGENDARIES.includes(id));
    if (!pool.length) {
      pool = PG.DEX_ORDER.filter(id => PG.SPECIES[id].habitats.includes(regionId) && !PG.TRUE_LEGENDARIES.includes(id));
    }
    const size = PG.clamp(Number(t.teamSize) || 3, 1, 6);
    const team = [];
    for (let i = 0; i < size && pool.length; i++) {
      team.push([pool[i % pool.length], Math.max(2, lv + i)]); // cycling nếu pool ngắn hơn đội hình
    }
    return {
      uid: PG.uid('roam'), templateId: t.id, regionId,
      name: t.name, title: t.title, avatar: t.avatar, quote: t.quote,
      difficulty: t.difficulty, team, teamSize: size,
      hpMult: t.hpMult, mirrorPlayerHp: !!t.mirrorPlayerHp,
      heldItems: (t.heldItems || []).slice(),
      reward: {
        coins: Math.round((400 + lv * 45) * PG.rand(0.9, 1.25)),
        xp: 60 + lv * 10,
        items: Object.assign({}, t.items || {}),
        diamonds: t.diamonds || 0,
        equipment: (t.equipment || []).length ? [PG.pick(t.equipment)] : []
      },
      spawnedAt: now, expiresAt: now + ROAMING_MS
    };
  }

  function walk(regionId) {
    const state = PG.getState();
    const region = PG.REGIONS[regionId];
    if (!PG.isRegionUnlocked(state, regionId)) return { ok: false, msg: 'Vùng này chưa mở khóa.' };
    const hazard = hazardPenalty(state, region);
    const cost = region.staminaCost + hazard.extra;
    if (state.player.stamina < cost) {
      return { ok: false, msg: 'Không đủ thể lực. Cần ' + cost + ' TL, bạn có ' + state.player.stamina + '. Hãy nghỉ ngơi hoặc dùng vật phẩm.' };
    }
    PG.spendStamina(cost);
    const now = Date.now();
    if (state.roamingTrainer && !(state.roamingTrainer.expiresAt > now)) state.roamingTrainer = null;
    let trainerChallenge = null;
    if (!state.roamingTrainer && now >= (state.roamingCooldownAt || 0) && PG.chance(ROAMING_CHANCE)) {
      state.roamingTrainer = buildRoamingTrainer(regionId);
      state.roamingCooldownAt = now + PG.randInt(25, 45) * 60000;
      trainerChallenge = state.roamingTrainer;
      // Lưu ngay để thử thách không mất khi đi dạo chuyển sang màn hình bắt Pokémon.
      PG.saveState(true);
    }
    const km = +(PG.rand(0.45, 1.35)).toFixed(2);
    const dist = PG.addDistance(km);
    let encounter = null;
    const encChance = regionId === 'temple' ? 0.42 : 0.55;
    if (PG.chance(encChance)) {
      encounter = spawnEncounter(regionId, { source: 'walk' });
    }
    let found = null;
    if (!encounter && PG.chance(0.32)) {
      const mat = PG.pick(region.drops);
      const qty = PG.randInt(1, 3);
      PG.addMaterial(mat, qty);
      found = { id: mat, qty };
    }
    if (!found && PG.chance(0.12)) {
      const ball = PG.pick(['pokeball', 'greatball', 'razz', 'potion']);
      PG.addItem(ball, 1);
      found = { id: ball, qty: 1 };
    }
    // Mảnh Tinh Thể Vỡ cực hiếm khi tìm kiếm; nguồn chính vẫn là thắng trainer/giải đấu.
    if (!found && PG.chance(0.025)) {
      PG.addItem('crystal-shard', 1);
      found = { id: 'crystal-shard', qty: 1 };
    }
    return {
      ok: true, km, cost, hazard, encounter, found, trainerChallenge,
      eggReady: dist.eggReady, buddyCandy: dist.buddyCandy,
      stamina: state.player.stamina
    };
  }

  function hazardPenalty(state, region) {
    if (!region.hazard) return { extra: 0, stat: 0, required: 0, protected: true };
    const stat = region.hazard.stat;
    const required = { heat: 25, cold: 25, sand: 30, curse: 15 }[stat] || 20;
    const totals = PG.trainerBonuses(state).totals;
    const value = totals[stat] || 0;
    if (value >= required) return { extra: 0, stat: value, required, protected: true };
    const extra = Math.max(1, Math.ceil(region.staminaCost * (1 - value / required) * 0.9));
    return { extra, stat: value, required, protected: false };
  }

  function addCatchRewards(state, p, opts) {
    const sp = PG.SPECIES[p.speciesId];
    const o = opts || {};
    const candyBase = sp.rarity === 'legendary' ? 10 : sp.rarity === 'rare' ? 5 : 3;
    const candyMult = o.candyMult || 1;
    const candy = Math.max(1, Math.round(candyBase * candyMult * (1 + p.level / 120)));
    PG.addCandy(state, p.speciesId, candy);
    const fx = PG.trainerBonuses(state).luckFx;
    const activeEvent = state.events && state.events.active;
    const eventStardustMult = activeEvent && activeEvent.id === 'golden-hour' ? 1.5 : 1;
    const stardust = Math.round((100 + p.level * 6 + (sp.rarity === 'legendary' ? 400 : sp.rarity === 'rare' ? 100 : 0)) * (1 + fx.effective * 0.002) * eventStardustMult);
    const xp = Math.round(25 + sp.base.reduce((a, b) => a + b, 0) / 8 + (o.qualityXp || 0) + (sp.rarity === 'legendary' ? 150 : sp.rarity === 'rare' ? 40 : 0));
    PG.addStardust(stardust);
    const lv = PG.addPlayerXp(state, xp);
    state.stats.catches++;
    for (const t of sp.types) state.stats.catchesByType[t] = (state.stats.catchesByType[t] || 0) + 1;
    if (p.shiny) state.stats.shinies++;
    if (PG.TRUE_LEGENDARIES.includes(p.speciesId)) state.stats.legendariesCaught = (state.stats.legendariesCaught || 0) + 1;
    PG.questProgress('catch_any', 1);
    PG.questProgress('catch_type', 1, { type: sp.types[0] });
    if (sp.rarity !== 'common') PG.questProgress('catch_rare', 1);
    PG.recordDex(p.speciesId, 'caught');
    return { candy, stardust, xp, playerLevel: state.player.level, levelUp: lv };
  }

  function attemptCatch(encounter, ballId, qualityId, berryId) {
    const state = PG.getState();
    if (!encounter || encounter.caught || encounter.fled) return { ok: false, msg: 'Không có Pokémon để bắt.' };
    // Quá damage làm mục tiêu ngất thì mất cơ hội bắt (không ép HP tối thiểu 1).
    if (!(encounter.pokemon.hp > 0)) return { ok: false, msg: PG.SPECIES[encounter.pokemon.speciesId].name + ' đã ngất, không thể bắt.' };
    if ((state.bag[ballId] || 0) < 1) return { ok: false, msg: 'Hết ' + PG.itemInfo(ballId).name + '.' };
    const q = THROW_QUALITY[qualityId] || THROW_QUALITY.hit;
    if (q.id === 'miss') {
      return { ok: true, missed: true, message: 'Ném trượt! Pokémon vẫn ở đó.' };
    }
    PG.removeItem(ballId, 1);
    const berry = berryId ? PG.BERRIES[berryId] : null;
    if (berryId) {
      PG.removeItem(berryId, 1);
      state.stats.berriesUsed = (state.stats.berriesUsed || 0) + 1;
      PG.questProgress('use_berry', 1);
    }
    const chance = catchChance(encounter, ballId, qualityId, berryId, state);
    encounter.throws++;
    state.stats.throws++;
    if (qualityId === 'excellent') state.stats.excellent++;
    else if (qualityId === 'great') state.stats.great++;
    else if (qualityId === 'nice') state.stats.nice++;
    if (qualityId === 'excellent') PG.questProgress('excellent', 1);
    const caught = ballId === 'masterball' ? true : PG.chance(chance);
    let shakes = 0;
    if (caught) {
      shakes = 3;
      encounter.caught = true;
      const p = encounter.pokemon;
      if (ballId === 'healball') { p.hp = PG.getStats(p).hp; p.status = null; }
      p.source = encounter.source;
      state.pokemon.push(p);
      if (state.team.length < 6) state.team.push(p.uid);
      const rewards = addCatchRewards(state, p, { candyMult: (berry && berry.candyMult) || 1, qualityXp: q.xp });
      PG.saveState(true);
      return { ok: true, caught: true, chance, shakes: 3, quality: q, pokemon: p, rewards, message: 'Bắt được ' + PG.SPECIES[p.speciesId].name + '!' };
    }
    shakes = PG.chance(0.35) ? 0 : PG.randInt(1, 2);
    const sp = PG.SPECIES[encounter.pokemon.speciesId];
    const hpPct = PG.clamp(encounter.pokemon.hp / PG.getStats(encounter.pokemon).hp, 0, 1);
    // Bóng vỡ không còn là "chắc chắn bỏ chạy": Pokémon có thể hoảng rồi trốn,
    // hoặc vẫn ở lại để người chơi ném tiếp (tỷ lệ cao hơn khi đã làm yếu máu).
    const fleeChance = PG.clamp(
      (sp.fleeRate || 0.08) * (1 + encounter.throws * 0.12) * (0.75 + hpPct * 0.55),
      0.03, 0.55
    );
    const fled = PG.chance(fleeChance);
    encounter.fled = fled;
    PG.saveState(true);
    return {
      ok: true, caught: false, chance, shakes, fled, fleeChance, quality: q,
      message: fled
        ? sp.name + ' đã bỏ chạy sau khi bóng vỡ!'
        : sp.name + ' thoát khỏi bóng nhưng vẫn ở lại. Ném tiếp nhé!'
    };
  }

  PG.THROW_QUALITY = THROW_QUALITY;
  PG.BALL_CATCH_TUNING = BALL_TUNING;
  PG.catchChance = catchChance;
  PG.ballMultiplier = ballMultiplier;
  PG.ringColor = ringColor;
  PG.qualityFromScale = qualityFromScale;
  PG.spawnEncounter = spawnEncounter;
  PG.summonLegendary = summonLegendary;
  PG.walk = walk;
  PG.hazardPenalty = hazardPenalty;
  PG.addCatchRewards = addCatchRewards;
  PG.attemptCatch = attemptCatch;
  PG.regionSpawnPool = regionSpawnPool;
  PG.ROAMING_MS = ROAMING_MS;
  PG.ROAMING_CHANCE = ROAMING_CHANCE;
  PG.buildRoamingTrainer = buildRoamingTrainer;
})();
