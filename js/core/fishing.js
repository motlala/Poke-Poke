/* ============================================================
   CÂU CÁ: chờ cá cắn → giật → giữ kim trong vùng → nhận thưởng
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;

  const COST = 4;
  const BITE_WINDOW = 1100;
  const REEL_TIME = 20000;
  // Sàn vùng sáng để cá quý vẫn bắt được, dù vùng sau khó hơn.
  const ZONE_MIN = 16;
  const RARE_ZONE_PENALTY = { common: 0, rare: 4, mythical: 6, legendary: 8 };
  const RARITY_LABEL = { common: 'Phổ biến', rare: 'Hiếm', mythical: 'Thần thoại', legendary: 'Huyền thoại' };

  /** Độ khó kéo cá: đầu game rộng/chậm hơn, vùng sâu & cá quý hẹp hơn. */
  function tuningFor(spot, rodLevel, rarity, hasBait) {
    const lv = rodLevel || 0;
    const depth = (spot && spot.minRod) || 0;
    const easyStart = lv <= 1 && depth <= 1;
    const rarePenalty = RARE_ZONE_PENALTY[rarity] || 0;
    return {
      easyStart,
      rarePenalty,
      needed: easyStart ? 3 : 4,
      zoneWidth: PG.clamp(24 + lv * 1.8 + (hasBait ? 2.5 : 0) - depth - rarePenalty +
        (easyStart ? 3 : 0), ZONE_MIN, 40),
      speedBase: 1.85 + depth * 0.1 - lv * 0.04
    };
  }

  function spotOf(regionId) {
    const r = PG.REGIONS[regionId];
    return r && r.fishing ? Object.assign({ regionId, regionName: r.name }, r.fishing) : null;
  }

  function allSpots() {
    const out = [];
    for (const rid of PG.REGION_ORDER) {
      const sp = spotOf(rid);
      if (sp) out.push(sp);
    }
    return out;
  }

  function rodOf(state) {
    return PG.RODS[state.fishing.rod] || PG.RODS.bamboo;
  }

  function ownedBaitIds(state) {
    return Object.keys(PG.BAITS).filter(id => (state.bag[id] || 0) > 0);
  }

  function canFish(regionId) {
    const state = PG.getState();
    const spot = spotOf(regionId);
    if (!spot) return { ok: false, msg: 'Vùng này không có điểm câu.' };
    if (!PG.isRegionUnlocked(state, regionId)) return { ok: false, msg: 'Vùng này chưa mở khóa.' };
    const rod = rodOf(state);
    if ((rod.deep || 0) < spot.minRod) {
      const needed = Object.values(PG.RODS).find(r => (r.deep || 0) >= spot.minRod);
      return { ok: false, msg: 'Cần ' + (needed ? needed.name : 'cần tốt hơn') + ' để câu ở đây.' };
    }
    // Không có mồi thì không thả câu được — mồi là điều kiện bắt buộc.
    if (!currentBait(state) && !ownedBaitIds(state).length) {
      return { ok: false, msg: 'Không có mồi: hãy mua ở Chợ → Vật Phẩm hoặc chế tạo trước khi câu.' };
    }
    if (state.player.stamina < COST) return { ok: false, msg: 'Cần ' + COST + ' Thể lực để câu.' };
    return { ok: true, spot, rod };
  }

  function currentBait(state) {
    const ab = state.fishing.activeBait;
    if (!ab || !ab.id || (ab.uses || 0) <= 0 || !PG.BAITS[ab.id]) return null;
    return { id: ab.id, info: PG.BAITS[ab.id], uses: ab.uses };
  }

  function cast(regionId) {
    const check = canFish(regionId);
    if (!check.ok) return check;
    const state = PG.getState();
    const spot = check.spot;
    const rod = check.rod;
    if (!PG.spendStamina(COST)) return { ok: false, msg: 'Không đủ Thể lực.' };

    let bait = currentBait(state);
    if (!bait) {
      // Đã có mồi trong túi nhưng chưa chọn: tự dùng mồi đầu tiên để câu ngay.
      const first = ownedBaitIds(state)[0];
      if (!first) return { ok: false, msg: 'Không có mồi: hãy mua ở Chợ → Vật Phẩm hoặc chế tạo.' };
      const started = PG.startBait(first);
      if (!started.ok) return started;
      bait = currentBait(state);
      if (!bait) return { ok: false, msg: 'Không thể dùng mồi lúc này.' };
    }
    bait.uses -= 1;
    state.fishing.activeBait.uses = bait.uses;
    if (bait.uses <= 0) delete state.fishing.activeBait;

    const luckFx = PG.trainerBonuses(state).luckFx;
    const rarityBonus = (spot.rarityBonus || 1) * (rod.power || 1) * (bait ? (bait.info.rare || 1) : 1) *
      (1 + Math.min(0.5, (luckFx.effective || 0) * 0.004));
    const rodLevel = state.fishing.rodLevel || 0;
    // Lễ hội Câu Cá: cắn lâu hơn, chờ ngắn hơn, cá hiếm xuất hiện nhiều hơn.
    const festival = !!(state.events.active && state.events.active.id === 'fishing-festival');

    // Chọn con cá trước khi kéo để vùng sáng phản ánh đúng độ hiếm của nó.
    const rollCtx = {
      spot,
      rarityBonus: rarityBonus * (festival ? 1.5 : 1),
      bait: bait ? { id: bait.id } : null,
      festival
    };
    const targetId = pickSpecies(rollCtx, festival ? ['water', 'dragon'] : null);
    const targetSp = PG.SPECIES[targetId] || {};
    const targetRarity = targetSp.rarity || 'common';
    const tune = tuningFor(spot, rodLevel, targetRarity, !!bait);

    const now = Date.now();
    const waitMs = PG.randInt(900, 2800);
    const session = {
      id: PG.uid('fish'),
      regionId,
      spot,
      rod: state.fishing.rod,
      rodLevel,
      bait: bait ? { id: bait.id, name: bait.info.name, icon: bait.info.icon } : null,
      rarityBonus,
      phase: 'waiting',
      castAt: now,
      waitMs,
      biteAt: now + waitMs,
      biteWindow: BITE_WINDOW,
      reelStart: 0,
      reelEnd: 0,
      expiresAt: 0,
      progress: 0,
      hits: 0,
      misses: 0,
      needed: tune.needed,
      easyStart: tune.easyStart,
      targetSpecies: targetId,
      targetRarity,
      targetRarityName: RARITY_LABEL[targetRarity] || 'Phổ biến',
      result: null,
      failReason: '',
      reel: {
        zoneCenter: PG.rand(30, 70),
        zoneWidth: tune.zoneWidth,
        speed: PG.clamp(tune.speedBase + PG.rand(0, 0.4), 1.1, 2.6),
        phase: PG.rand(0, Math.PI * 2),
        // Vùng sáng trôi chậm qua lại; tốc độ riêng, không khớp nhịp kim.
        zoneSpeed: PG.clamp(tune.speedBase * 0.42, 0.5, 1.15),
        zonePhase: PG.rand(0, Math.PI * 2)
      }
    };
    if (festival) {
      session.festival = true;
      session.biteWindow = Math.round(BITE_WINDOW * 1.6);
      session.waitMs = Math.round(session.waitMs * 0.7);
      session.rarityBonus *= 1.5;
      session.biteAt = now + session.waitMs;
    }
    PG.questProgress('fish_cast', 1);
    PG.saveState(true);
    return { ok: true, session, spot, rod, cost: COST, bait: session.bait };
  }

  function markerAt(session, now) {
    if (!session || session.phase !== 'reeling') return 50;
    const t = (now - session.reelStart) / 1000;
    const raw = Math.sin(t * session.reel.speed + session.reel.phase);
    return 50 + raw * 48;
  }

  /** Tâm vùng sáng trôi qua lại theo thời gian; độ rộng giữ nguyên. */
  function zoneCenterAt(session, now) {
    if (!session || !session.reel) return 50;
    const half = (session.reel.zoneWidth || 24) / 2;
    const swing = Math.max(5, 44 - half);
    // Luôn tính từ lúc thả câu để vùng sáng không giật khi chuyển sang kéo cần.
    const from = session.castAt || Date.now();
    const t = Math.max(0, ((now || Date.now()) - from) / 1000);
    const raw = Math.sin(t * (session.reel.zoneSpeed || 0.7) + (session.reel.zonePhase || 0));
    return PG.clamp(50 + raw * swing, half + 2, 100 - half - 2);
  }

  /** Kiểm tra trạng thái hiện tại (UI gọi mỗi ~100ms) */
  function poll(session, now) {
    now = now || Date.now();
    if (!session || session.phase === 'done') return { phase: 'done', result: session && session.result };
    if (session.phase === 'waiting' && now >= session.biteAt) {
      session.phase = 'bite';
      return { phase: 'bite', until: session.biteAt + session.biteWindow };
    }
    if (session.phase === 'bite' && now > session.biteAt + session.biteWindow) {
      session.phase = 'done';
      session.failReason = 'Cá đã bỏ mồi! Bạn giật cần quá muộn.';
      session.result = { kind: 'fail', msg: session.failReason };
      resetStreak();
      PG.saveState(true);
      return { phase: 'done', result: session.result, failed: true };
    }
    if (session.phase === 'reeling') {
      if (now >= session.expiresAt) {
        session.phase = 'done';
        session.failReason = 'Dây câu đứt! Bạn không kéo kịp.';
        session.result = { kind: 'fail', msg: session.failReason };
        resetStreak();
        PG.saveState(true);
        return { phase: 'done', result: session.result, failed: true };
      }
      return {
        phase: 'reeling', marker: markerAt(session, now),
        zoneCenter: zoneCenterAt(session, now), zoneWidth: session.reel.zoneWidth,
        progress: session.progress, until: session.expiresAt
      };
    }
    return { phase: session.phase, until: session.biteAt };
  }

  function resetStreak() {
    const state = PG.getState();
    state.fishing.streak = 0;
  }

  /** Người chơi giật cần */
  function strike(session, now) {
    now = now || Date.now();
    if (!session) return { ok: false, msg: 'Chưa thả câu.' };
    if (session.phase === 'waiting') {
      if (now < session.biteAt - 200) return { ok: false, msg: 'Chưa có gì cắn câu...' };
      return { ok: false, msg: 'Kiên nhẫn...' };
    }
    if (session.phase === 'bite') {
      if (now > session.biteAt + session.biteWindow) {
        return { ok: false, msg: 'Quá muộn rồi!' };
      }
      session.phase = 'reeling';
      session.reelStart = now;
      session.expiresAt = now + REEL_TIME;
      return { ok: true, phase: 'reeling', session };
    }
    if (session.phase === 'reeling') return { ok: true, phase: 'reeling', session };
    return { ok: false, msg: 'Đã kết thúc.' };
  }

  /** Kéo cần một nhịp — trả về kết quả nhịp */
  function reel(session, now) {
    now = now || Date.now();
    if (!session || session.phase !== 'reeling') return { ok: false, msg: 'Chưa vào pha kéo.' };
    if (now >= session.expiresAt) {
      const p = poll(session, now);
      return { ok: false, done: true, result: p.result, msg: 'Hết giờ!' };
    }
    const marker = markerAt(session, now);
    const zoneCenter = zoneCenterAt(session, now);
    const diff = Math.abs(marker - zoneCenter);
    const half = session.reel.zoneWidth / 2;
    if (diff <= half) {
      const perfect = diff <= Math.max(3, half * 0.22);
      const gain = session.easyStart ? (perfect ? 42 : 36) : (perfect ? 34 : 27);
      session.hits++;
      session.progress = Math.min(100, session.progress + gain);
      const finished = session.progress >= 100 || session.hits >= session.needed + 1;
      if (finished) return finishSuccess(session, now);
      return {
        ok: true, hit: true, perfect, marker, zoneCenter, progress: session.progress,
        hits: session.hits, msg: (perfect ? 'HOÀN HẢO! +' : 'Trúng! +') + gain
      };
    }
    const loss = session.easyStart ? 7 : 11;
    session.misses++;
    session.progress = Math.max(0, session.progress - loss);
    if (session.progress <= 0 && session.misses >= 5) {
      session.phase = 'done';
      session.failReason = 'Cá vùng vẫy thoát mất!';
      session.result = { kind: 'fail', msg: session.failReason };
      resetStreak();
      PG.saveState(true);
      return { ok: false, done: true, result: session.result, msg: session.failReason };
    }
    return { ok: true, hit: false, marker, zoneCenter, progress: session.progress, msg: 'Trượt! -' + loss };
  }

  /* ---------------- PHẦN THƯỞNG ---------------- */
  function pickSpecies(session, preferTypes) {
    const state = PG.getState();
    const pool = [];
    for (const id of session.spot.pool) {
      const sp = PG.SPECIES[id];
      if (!sp) continue;
      let w = sp.rarity === 'legendary' ? 2 : sp.rarity === 'rare' ? 16 : 42;
      if (sp.rarity !== 'common') w *= session.rarityBonus;
      if (PG.weatherSpeciesOf && PG.weatherSpeciesOf(id, PG.weatherFor(state, session.regionId))) w *= 2;
      if (session.bait && session.bait.id === 'dragon' && sp.types.includes('dragon')) w *= 4;
      if (session.bait && session.bait.id === 'ice' && sp.types.includes('ice')) w *= 2.5;
      if (state.events.active && state.events.active.id === 'spotlight' && sp.types.includes(state.events.active.type)) w *= 2;
      if (session.festival && sp.types.includes('water')) w *= 1.4;
      pool.push({ id, w });
    }
    if (!pool.length) return PG.pick(PG.DEX_ORDER.filter(id => !PG.TRUE_LEGENDARIES.includes(id)));
    if (preferTypes && preferTypes.length) {
      const favored = pool.filter(x => (PG.SPECIES[x.id].types || []).some(t => preferTypes.includes(t)));
      if (favored.length) return PG.weightedPick(favored, x => x.w).id;
    }
    return PG.weightedPick(pool, x => x.w).id;
  }

  function pickItem(session) {
    const state = PG.getState();
    const roll = Math.random();
    let pool = session.spot.treasure || [];
    if (roll < 0.35) pool = session.spot.junk || pool;
    if (!pool.length) pool = ['shell'];
    const id = PG.pick(pool);
    const info = PG.itemInfo(id);
    const qty = PG.randInt(1, 3);
    if (info.kind === 'material') PG.addMaterial(id, qty);
    else if (info.kind === 'misc') PG.addMaterial(id, qty);
    else PG.addItem(id, qty);
    return { id, qty, name: info.name, icon: info.icon, kind: info.kind };
  }

  function finishSuccess(session, now) {
    const state = PG.getState();
    session.phase = 'done';
    session.reelEnd = now;
    const roll = Math.random();
    const speciesChance = 0.74 + Math.min(0.1, (session.rarityBonus - 1) * 0.12);
    // Lễ hội Câu Cá: có thể cắm được Cá Hoàng Kim (Shiny, hệ Nước/Rồng, thưởng đậm).
    const golden = !!(session.festival && roll < speciesChance && PG.chance(0.12));
    let result;
    if (roll < speciesChance) {
      // Dùng con đã chọn lúc thả câu để vùng sáng khớp với cá thực nhận.
      let sid = session.targetSpecies && PG.SPECIES[session.targetSpecies]
        ? session.targetSpecies : pickSpecies(session);
      let sp = PG.SPECIES[sid];
      if (golden && !(sp.types || []).some(t => t === 'water' || t === 'dragon')) {
        sid = pickSpecies(session, ['water', 'dragon']);
        sp = PG.SPECIES[sid];
      }
      const region = PG.REGIONS[session.regionId];
      let level = PG.clamp((region.unlock.level || 1) + PG.randInt(-2, 4), 2, 60);
      if (sp.rarity === 'legendary') level += 4;
      const luckFx = PG.trainerBonuses(state).luckFx;
      const p = PG.createPokemon(sid, level, {
        minIV: 6, source: 'fishing', luck: luckFx.raw,
        shinyBoost: Math.min(0.006, (state.fishing.streak || 0) * 0.0004),
        forceShiny: golden,
        mutationBoost: golden ? 0.08 : 0,
        fishingStreak: state.fishing.streak || 0,
        regionType: 'water', night: PG.isNight()
      });
      p.hp = PG.getStats(p).hp;
      state.pokemon.push(p);
      if (state.team.length < 6) state.team.push(p.uid);
      const rewards = PG.addCatchRewards(state, p, { qualityXp: 40, candyMult: 1 });
      PG.recordDex(sid, 'caught');
      result = { kind: 'pokemon', pokemon: p, rewards, golden, name: golden ? '✨ Cá Hoàng Kim ' + sp.name : sp.name };
    } else {
      const item = pickItem(session);
      result = { kind: 'item', item, name: item.name };
    }

    state.fishing.streak = (state.fishing.streak || 0) + 1;
    state.fishing.best = Math.max(state.fishing.best || 0, state.fishing.streak);
    state.fishing.catches = (state.fishing.catches || 0) + 1;
    state.fishing.total = (state.fishing.total || 0) + 1;
    state.stats.fishCaught = (state.stats.fishCaught || 0) + 1;
    if (result.kind === 'pokemon') {
      state.fishing.aquarium = state.fishing.aquarium || [];
      if (!state.fishing.aquarium.includes(result.pokemon.speciesId)) state.fishing.aquarium.push(result.pokemon.speciesId);
    }
    PG.questProgress('fish', 1);
    if (session.festival) {
      const bonusCoins = golden ? 620 : 120;
      const bonusDust = golden ? 380 : 80;
      PG.addCoins(bonusCoins);
      PG.addStardust(bonusDust);
      result.bonus = '🎉 Lễ hội' + (golden ? ' • Cá Hoàng Kim' : '') + ': +' + bonusCoins + ' Xu, +' + bonusDust + ' Bụi Sao';
    }
    PG.saveState(true);
    session.result = result;
    return { ok: true, hit: true, done: true, result, progress: 100, msg: 'Câu thành công!' };
  }

  function abandon(session) {
    if (!session || session.phase === 'done') return;
    session.phase = 'done';
    session.result = { kind: 'fail', msg: 'Bạn đã thu cần.' };
    resetStreak();
    PG.saveState(true);
  }

  function sellValueOfCatch(result) {
    if (!result) return 0;
    if (result.kind === 'pokemon') return PG.pokemonSellValue(result.pokemon);
    if (result.kind === 'item') {
      const info = PG.itemInfo(result.item.id);
      return Math.max(1, Math.round((info.price || 10) * 0.5)) * result.item.qty;
    }
    return 0;
  }

  PG.Fishing = {
    COST, BITE_WINDOW, REEL_TIME, ZONE_MIN,
    spotOf, allSpots, rodOf, canFish, currentBait, ownedBaitIds, tuningFor,
    cast, poll, strike, reel, markerAt, zoneCenterAt, abandon,
    pickSpecies, pickItem, finishSuccess, sellValueOfCatch
  };
})();
