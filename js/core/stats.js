/* ============================================================
   CHỈ SỐ, CÁ THỂ, TIẾN HÓA, MAY MẮN
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;

  const GENDERLESS = new Set(['magnemite', 'magneton', 'magnezone', 'voltorb', 'electrode', 'porygon', 'porygon2', 'porygon-z', 'ditto', 'rotom', 'beldum', 'metang', 'metagross', 'mew', 'jirachi', 'arceus', 'victini', 'regirock', 'regice', 'registeel', 'castform', 'smeargle', 'cryogonal', 'golett', 'golurk']);
  const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const STAT_NAMES = { hp: 'HP', atk: 'Tấn công', def: 'Phòng thủ', spa: 'TC đặc biệt', spd: 'PT đặc biệt', spe: 'Tốc độ' };

  function randIV() { return PG.randInt(0, 31); }

  function rollSize() {
    const r = Math.random() * 100;
    if (r < 3) return 'XXS';
    if (r < 15) return 'XS';
    if (r < 85) return 'M';
    if (r < 97) return 'XL';
    return 'XXL';
  }

  function rollMutation(species, opts) {
    const o = opts || {};
    const luck = o.luck || 0;
    const eventBoost = o.shinyBoost || 0;
    let shinyChance = 0.005 + Math.min(0.003, luck * 0.00002) + eventBoost;
    if (o.shinyCharm) shinyChance += 0.002;
    if (o.fishingStreak) shinyChance += Math.min(0.004, o.fishingStreak * 0.0004);
    if (o.forceShiny) shinyChance = 1;
    const shiny = PG.chance(Math.min(0.025, shinyChance));

    let primary = null;
    const pool = [];
    const harsh = o.harshRegion;
    for (const key of PG.MUTATION_KEYS) {
      if (key === 'shiny') continue;
      const m = PG.MUTATIONS[key];
      if (key === 'elemental' && (!species.canElemental || !o.regionType)) continue;
      if (key === 'celestial-aura' && species.rarity !== 'legendary') continue;
      let w = m.chance * 100;
      if (key === 'alpha' && harsh) w *= 1.8;
      if (key === 'shadow' && o.night) w *= 1.4;
      if (key === 'crystal' && o.regionType === 'ice') w *= 1.3;
      if (key === 'glitch' && o.regionType === 'electric') w *= 1.4;
      pool.push({ key, w });
    }
    const mutationChance = PG.clamp(0.075 + (o.mutationBoost || 0), 0, 0.9);
    if (pool.length && PG.chance(mutationChance)) {
      primary = PG.weightedPick(pool, x => x.w).key;
    }
    if (o.forceMutation) primary = o.forceMutation;

    const mutations = [];
    if (shiny) mutations.push('shiny');
    if (primary) mutations.push(primary);
    return { shiny, primary, mutations };
  }

  function createPokemon(speciesId, level, opts) {
    const sp = PG.SPECIES[speciesId];
    if (!sp) throw new Error('Loài không tồn tại: ' + speciesId);
    const o = opts || {};
    const lv = PG.clamp(Math.round(level || 1), 1, 100);
    const ivs = {};
    for (const k of STAT_KEYS) {
      if (o.perfectIV) ivs[k] = 31;
      else if (o.minIV) ivs[k] = PG.randInt(o.minIV, 31);
      else ivs[k] = randIV();
    }
    const mut = rollMutation(sp, o);
    if (mut.primary === 'crystal') {
      for (const k of STAT_KEYS) ivs[k] = Math.max(ivs[k], 22);
    }
    const natureKey = o.nature || PG.pick(PG.NATURE_KEYS);
    const nature = PG.NATURES[natureKey];
    const hidden = PG.chance(0.05);
    const ability = hidden ? sp.hiddenAbility : PG.pick(sp.abilities);
    let size = rollSize();
    if (mut.primary === 'alpha') size = 'XL';
    if (mut.primary === 'mini') size = 'XXS';
    if (o.size) size = o.size;

    const sizeInfo = PG.SIZE_TABLE[size];
    const height = +(sp.heightBase * sizeInfo.scale * PG.rand(0.88, 1.12)).toFixed(2);
    const weight = +(sp.weightBase * Math.pow(sizeInfo.scale, 2.2) * PG.rand(0.85, 1.15)).toFixed(1);
    const gender = GENDERLESS.has(speciesId) ? 'none' : (Math.random() < sp.genderRatio ? 'male' : 'female');

    // Chiêu theo hệ + chiêu riêng huyền thoại + chiêu mở khóa theo loài tiến hóa.
    const learned = (PG.movesForSpecies ? PG.movesForSpecies(sp.id, lv) : PG.movesForTypes(sp.types, lv)).map(m => m.id);
    const uniqueLearned = [...new Set(learned)];
    const moves = pickStartingMoves(uniqueLearned, sp, lv);

    const potential = o.potential || PG.clamp(PG.randInt(55, 100) + (sp.rarity === 'legendary' ? 15 : 0), 40, 100);
    const p = {
      uid: PG.uid('pk'), speciesId, level: lv, xp: 0,
      ivs, nature: natureKey, ability, hiddenAbility: hidden,
      mutations: mut.mutations, shiny: mut.shiny, primaryMutation: mut.primary,
      elementalType: mut.primary === 'elemental' ? (o.regionType || null) : null,
      size, height, weight, gender,
      moves, learnedMoves: uniqueLearned,
      hp: 0, status: null, statusTurns: 0,
      heldItem: null, heldDur: null, friendship: 0, potential,
      bonusStats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      caughtAt: Date.now(), source: o.source || 'wild',
      favorite: false, notes: '',
      pp: {}
    };
    for (const mv of moves) p.pp[mv.id] = maxPp(mv.id, mv.level || 1);
    p.hp = getStats(p).hp;
    return p;
  }

  function pickStartingMoves(learned, sp, level) {
    const candidates = learned.slice();
    // Ưu tiên chiêu có sức mạnh, chọn 4 chiêu cuối (thường mạnh hơn)
    const chosen = [];
    const sorted = candidates.slice().sort((a, b) => {
      const ma = PG.getMove(a), mb = PG.getMove(b);
      return (mb.power || 0) - (ma.power || 0);
    });
    for (const id of sorted) {
      if (chosen.length >= 4) break;
      chosen.push(id);
    }
    if (!chosen.length) chosen.push('tackle');
    // đảm bảo có ít nhất 1 chiêu tấn công
    if (!chosen.some(id => (PG.getMove(id).power || 0) > 0)) chosen[0] = 'tackle';
    return chosen.map(id => ({ id, level: 1 }));
  }

  /** Đồng bộ chiêu riêng cho save cũ / sau tiến hóa; có thể thay chiêu yếu nhất nếu cần. */
  function syncSpeciesMoves(p, forceEquip) {
    if (!p || !PG.SPECIES[p.speciesId]) return [];
    p.learnedMoves = p.learnedMoves || [];
    p.moves = p.moves || [];
    p.pp = p.pp || {};
    const expected = (PG.movesForSpecies ? PG.movesForSpecies(p.speciesId, p.level || 1) : []).map(m => m.id);
    const added = [];
    for (const id of expected) {
      if (!p.learnedMoves.includes(id)) { p.learnedMoves.push(id); added.push(id); }
    }
    if (forceEquip && added.length) {
      const sorted = added.slice().sort((a, b) => movePower(b, 1) - movePower(a, 1));
      for (const id of sorted) {
        if ((PG.getMove(id).power || 0) <= 0) continue;
        if (p.moves.length < 4) {
          p.moves.push({ id, level: 1 });
          p.pp[id] = maxPp(id, 1);
          continue;
        }
        let weakIdx = -1, weak = Infinity;
        p.moves.forEach((m, i) => {
          const v = movePower(m.id, m.level || 1);
          if (v < weak) { weak = v; weakIdx = i; }
        });
        if (weakIdx >= 0 && movePower(id, 1) > weak + 10) {
          p.moves[weakIdx] = { id, level: 1 };
          p.pp[id] = maxPp(id, 1);
        }
      }
    }
    return added;
  }

  function movePower(moveId, moveLevel) {
    const m = PG.getMove(moveId);
    if (!m.power) return 0;
    return Math.round(m.power * (1 + 0.08 * ((moveLevel || 1) - 1)));
  }
  function moveAccuracy(moveId, moveLevel) {
    const m = PG.getMove(moveId);
    if (m.accuracy === null || m.accuracy === undefined) return null;
    return Math.min(100, m.accuracy + ((moveLevel || 1) - 1) * 3);
  }
  function maxPp(moveId, moveLevel) {
    const m = PG.getMove(moveId);
    return m.pp + ((moveLevel || 1) - 1) * 2;
  }

  function getTypes(p, opts) {
    const sp = PG.SPECIES[p.speciesId];
    let types = sp.types.slice();
    if (p.elementalType && !types.includes(p.elementalType)) types.push(p.elementalType);
    if (opts && opts.teraType) types = [opts.teraType];
    return types;
  }

  function natureMultiplier(p, stat) {
    const n = PG.NATURES[p.nature] || PG.NATURES.hardy;
    if (n.plus === stat) return 1.1;
    if (n.minus === stat) return 0.9;
    return 1;
  }

  function mutationStatMod(p, stat) {
    let mod = 1;
    for (const m of p.mutations || []) {
      const def = PG.MUTATIONS[m];
      if (def && def.statMod && def.statMod[stat] !== undefined) mod *= def.statMod[stat];
    }
    if (p.primaryMutation === 'elemental' && p.elementalType) mod *= 1.02;
    return mod;
  }

  function getStats(p, opts) {
    const sp = PG.SPECIES[p.speciesId];
    const o = opts || {};
    const out = {};
    for (const k of STAT_KEYS) {
      const base = sp.base[STAT_KEYS.indexOf(k)];
      const iv = p.ivs[k] || 0;
      let val;
      if (k === 'hp') {
        val = Math.floor((2 * base + iv) * p.level / 100) + p.level + 10;
      } else {
        val = Math.floor(((2 * base + iv) * p.level / 100 + 5) * natureMultiplier(p, k));
      }
      val = Math.floor(val * mutationStatMod(p, k));
      if (p.ability === 'big-pecks' && k === 'def') val = Math.floor(val * 1.1);
      if (p.ability === 'tough-claws' && k === 'atk') val = Math.floor(val * 1.1);
      const size = PG.SIZE_TABLE[p.size] || PG.SIZE_TABLE.M;
      if (k === 'hp') val = Math.floor(val * (size.hp || 1));
      if (p.bonusStats && p.bonusStats[k]) val += p.bonusStats[k];
      if (k === 'spe' && o.speedBonus) val += o.speedBonus;
      out[k] = Math.max(1, val);
    }
    return out;
  }

  /** Chỉ số thực tế trong trận đấu = chỉ số gốc + vật phẩm cầm tay (nếu còn tác dụng). */
  function battleStats(p) {
    const stats = getStats(p);
    const held = PG.heldEffects ? PG.heldEffects(p) : null;
    if (held && held.stats) {
      for (const k of STAT_KEYS) {
        if (held.stats[k]) stats[k] = Math.max(1, stats[k] + held.stats[k]);
      }
    }
    if (p.heldItem === 'choice-band' && held) { stats.atk = Math.floor(stats.atk * 1.3); stats.spe = Math.floor(stats.spe * 0.9); }
    if (p.heldItem === 'assault-vest' && held) { stats.spd = Math.floor(stats.spd * 1.4); }
    return stats;
  }

  /** Phần cộng/thay đổi do vật phẩm cầm tay (dùng để hiển thị tổng chỉ số). */
  function heldStatDelta(p) {
    const base = getStats(p), final = battleStats(p);
    const out = {};
    for (const k of STAT_KEYS) out[k] = final[k] - base[k];
    return out;
  }

  /** Thiện cảm (0-100): tăng khi cho ăn, cũng cộng nhẹ vào tỉ lệ bắt. */
  function increaseFriendship(p, amount) {
    if (!p) return 0;
    p.friendship = PG.clamp((Number(p.friendship) || 0) + Math.max(0, amount || 0), 0, 100);
    return p.friendship;
  }

  function feedBerry(uid, berryId) {
    const st = PG.getState();
    const p = st.pokemon.find(x => x.uid === uid);
    const berry = PG.BERRIES[berryId];
    if (!p) return { ok: false, msg: 'Pokémon không còn trong kho.' };
    if (!berry || !berry.friendship) return { ok: false, msg: 'Quả này không tăng thiện cảm.' };
    if ((st.bag[berryId] || 0) < 1) return { ok: false, msg: 'Hết ' + berry.name + '.' };
    if ((p.friendship || 0) >= 100) return { ok: false, msg: (p.nickname || PG.SPECIES[p.speciesId].name) + ' đã đạt thiện cảm tối đa.' };
    PG.removeItem(berryId, 1);
    const value = increaseFriendship(p, berry.friendship);
    PG.saveState(true);
    return { ok: true, msg: 'Đã cho ăn ' + berry.name + ' — thiện cảm ' + value + '/100.', value };
  }

  /* ---------------- PHÒNG NGHIÊN CỨU ---------------- */
  /** Đặc tính có thể gán: ưu tiên hệ của Pokémon, sau đó là mọi đặc tính đã biết. */
  function researchAbilityPool(p) {
    const pool = [];
    for (const t of getTypes(p)) {
      for (const a of (PG.TYPE_ABILITIES[t] || [])) if (PG.ABILITIES[a] && !pool.includes(a)) pool.push(a);
    }
    for (const a of Object.keys(PG.ABILITIES)) if (!pool.includes(a)) pool.push(a);
    return pool;
  }

  function researchChange(uid, kind, value) {
    const st = PG.getState();
    const p = st.pokemon.find(x => x.uid === uid);
    if (!p) return { ok: false, msg: 'Pokémon không còn trong kho.' };
    if ((st.bag['crystal-shard'] || 0) < 1) return { ok: false, msg: 'Cần 1 Mảnh Tinh Thể Vỡ.' };
    const name = p.nickname || PG.SPECIES[p.speciesId].name;
    if (kind === 'nature') {
      const n = PG.NATURES[value];
      if (!n) return { ok: false, msg: 'Tính cách không hợp lệ.' };
      if (p.nature === value) return { ok: false, msg: name + ' đã có tính cách này.' };
      PG.removeItem('crystal-shard', 1);
      p.nature = value;
      p.hp = PG.clamp(p.hp, 0, getStats(p).hp);
      PG.saveState(true);
      return { ok: true, msg: 'Đã đổi tính cách của ' + name + ' thành ' + n.name + ' (-1 Mảnh Tinh Thể Vỡ).' };
    }
    if (kind === 'ability') {
      const a = PG.ABILITIES[value];
      if (!a) return { ok: false, msg: 'Đặc tính không hợp lệ.' };
      if (p.ability === value) return { ok: false, msg: name + ' đã có đặc tính này.' };
      PG.removeItem('crystal-shard', 1);
      p.ability = value;
      const sp = PG.SPECIES[p.speciesId];
      p.hiddenAbility = !(sp.abilities || []).includes(value);
      p.hp = PG.clamp(p.hp, 0, getStats(p).hp);
      PG.saveState(true);
      return { ok: true, msg: 'Đã đổi đặc tính của ' + name + ' thành ' + a.name + ' (-1 Mảnh Tinh Thể Vỡ).' };
    }
    return { ok: false, msg: 'Chức năng nghiên cứu không hợp lệ.' };
  }

  /** Nghiên cứu luôn ngẫu nhiên: người chơi không chọn kết quả, chỉ bỏ Mảnh vào máy. */
  function researchRandom(uid, kind) {
    const st = PG.getState();
    const p = st.pokemon.find(x => x.uid === uid);
    if (!p) return { ok: false, msg: 'Pokémon không còn trong kho.' };
    let pool;
    if (kind === 'nature') {
      pool = (PG.NATURE_KEYS || Object.keys(PG.NATURES)).filter(k => PG.NATURES[k] && k !== p.nature);
    } else if (kind === 'ability') {
      const all = researchAbilityPool(p).filter(a => a !== p.ability);
      const sameType = [];
      for (const t of getTypes(p)) {
        for (const a of (PG.TYPE_ABILITIES[t] || [])) {
          if (PG.ABILITIES[a] && a !== p.ability && !sameType.includes(a)) sameType.push(a);
        }
      }
      // 70% rớt đặc tính cùng hệ (dễ phát huy), 30% lấy từ toàn bộ pool.
      pool = (sameType.length && PG.chance(0.7) ? sameType : all);
      if (!pool.length) pool = all;
    } else {
      return { ok: false, msg: 'Chức năng nghiên cứu không hợp lệ.' };
    }
    if (!pool.length) return { ok: false, msg: 'Không còn kết quả mới để nghiên cứu.' };
    const picked = PG.pick(pool);
    const res = researchChange(uid, kind, picked);
    if (!res.ok) return res;
    return { ok: true, value: picked, msg: 'Kết quả thí nghiệm: ' + res.msg };
  }

  function cpOf(p) {
    const s = getStats(p);
    const sum = s.atk + s.def + s.spa + s.spd + s.spe;
    return Math.max(10, Math.floor(sum * p.level * 0.075 + s.hp * 1.5));
  }

  function ivTotal(p) { return PG.sum(STAT_KEYS.map(k => p.ivs[k] || 0)); }
  function ivPercent(p) { return Math.round(ivTotal(p) / 186 * 100); }
  function qualityOf(p) {
    const t = ivTotal(p);
    let q = PG.QUALITY[0];
    for (const item of PG.QUALITY) if (t >= item.min) q = item;
    return q;
  }
  function starsOf(p) {
    const q = qualityOf(p);
    return q.stars;
  }

  function playerXpNeeded(level) { return Math.round(400 * Math.pow(level, 1.35)); }

  function addPlayerXp(state, amount) {
    state.player.xp += amount;
    let leveled = 0;
    while (state.player.xp >= playerXpNeeded(state.player.level)) {
      state.player.xp -= playerXpNeeded(state.player.level);
      state.player.level++;
      leveled++;
      state.player.staminaMax = 100 + trainerBonuses(state).totals.stamina;
    }
    return leveled;
  }

  /** Mỗi lần lên cấp cộng ngẫu nhiên vào một cột chỉ số — vĩnh viễn. */
  function grantRandomStat(p, amount) {
    if (!p) return null;
    if (!p.bonusStats || typeof p.bonusStats !== 'object') {
      p.bonusStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    }
    const key = PG.pick(STAT_KEYS);
    const gain = amount || (PG.chance(0.08) ? PG.randInt(4, 6) : PG.randInt(1, 3));
    p.bonusStats[key] = (p.bonusStats[key] || 0) + gain;
    return { key: key, gain: gain, name: STAT_NAMES[key] };
  }

  function addPokemonXp(p, amount, opts) {
    const o = opts || {};
    p.xp += amount;
    let gained = 0;
    // Mặc định không giới hạn cấp. opts.cap dùng cho các luồng muốn giữ giới hạn.
    const cap = o.cap === undefined ? Infinity : o.cap;
    let prevHp = getStats(p).hp;
    while (p.level < cap) {
      const need = xpToNext(p);
      if (p.xp < need) break;
      p.xp -= need;
      p.level++;
      gained++;
      grantRandomStat(p);
      const learnedNow = syncSpeciesMoves(p, false);
      if (learnedNow.length && p.moves.length < 4) {
        for (const mid of learnedNow) {
          if (!p.moves.some(m => m.id === mid)) {
            p.moves.push({ id: mid, level: 1 });
            p.pp[mid] = maxPp(mid, 1);
            if (p.moves.length >= 4) break;
          }
        }
      }
      const nextHp = getStats(p).hp;
      p.hp = Math.min(nextHp, p.hp + Math.max(5, nextHp - prevHp));
      prevHp = nextHp;
    }
    return gained;
  }

  function xpToNext(p) { return Math.round(80 * Math.pow(p.level, 1.3)); }

  function powerUpCost(p) {
    return { stardust: 100 + p.level * 22, candy: 1 + Math.floor(p.level / 12) };
  }

  function canPowerUp(state, p) {
    return !!p && p.level < Infinity;
  }

  function powerUp(state, p) {
    if (!canPowerUp(state, p)) return { ok: false, msg: 'Không thể nâng cấp Pokémon này.' };
    const cost = powerUpCost(p);
    if (state.player.stardust < cost.stardust) return { ok: false, msg: 'Không đủ Bụi Sao.' };
    const fam = PG.SPECIES[p.speciesId].family;
    if ((state.candies[fam] || 0) < cost.candy) return { ok: false, msg: 'Không đủ Kẹo ' + PG.SPECIES[p.speciesId].name + '.' };
    state.player.stardust -= cost.stardust;
    state.candies[fam] = (state.candies[fam] || 0) - cost.candy;
    const oldMax = getStats(p).hp;
    p.level++;
    grantRandomStat(p);
    const newMax = getStats(p).hp;
    p.hp = Math.min(newMax, p.hp + Math.max(5, newMax - oldMax));
    state.stats.powerUps = (state.stats.powerUps || 0) + 1;
    PG.questProgress('power_up', 1);
    return { ok: true, msg: 'Nâng cấp thành công! CP hiện tại: ' + cpOf(p) };
  }

  function evolutionOptions(p) {
    const sp = PG.SPECIES[p.speciesId];
    if (!sp.evo) return [];
    const branches = Array.isArray(sp.evo[0]) ? sp.evo : [sp.evo];
    return branches.map(e => ({
      to: e[0], candy: e[1], level: e[2] || null, condition: e[3] || null,
      species: PG.SPECIES[e[0]]
    })).filter(x => x.species);
  }

  function evoRequirementText(opt) {
    const parts = [];
    parts.push(opt.candy + ' Kẹo');
    if (opt.level) parts.push('Cấp ' + opt.level);
    if (opt.condition) {
      if (opt.condition === 'day') parts.push('Ban ngày');
      else if (opt.condition === 'night') parts.push('Ban đêm');
      else if (opt.condition.endsWith('-stone') || PG.STONES[opt.condition]) parts.push(PG.itemInfo(opt.condition).name);
      else parts.push(opt.condition);
    }
    return parts.join(' • ');
  }

  function canEvolve(state, p, opt) {
    if (p.level < (opt.level || 1)) return { ok: false, msg: 'Cần đạt cấp ' + opt.level };
    const fam = PG.SPECIES[p.speciesId].family;
    if ((state.candies[fam] || 0) < opt.candy) return { ok: false, msg: 'Cần ' + opt.candy + ' Kẹo (đang có ' + (state.candies[fam] || 0) + ')' };
    if (opt.condition === 'day' && PG.isNight()) return { ok: false, msg: 'Chỉ tiến hóa vào ban ngày.' };
    if (opt.condition === 'night' && !PG.isNight()) return { ok: false, msg: 'Chỉ tiến hóa vào ban đêm.' };
    if (opt.condition && PG.STONES[opt.condition]) {
      if ((state.bag[opt.condition] || 0) < 1) return { ok: false, msg: 'Cần ' + PG.itemInfo(opt.condition).name };
    }
    return { ok: true };
  }

  function evolve(state, p, opt) {
    const check = canEvolve(state, p, opt);
    if (!check.ok) return check;
    const oldSpecies = PG.SPECIES[p.speciesId];
    const fam = oldSpecies.family;
    state.candies[fam] = (state.candies[fam] || 0) - opt.candy;
    if (opt.condition && PG.STONES[opt.condition]) {
      state.bag[opt.condition] = (state.bag[opt.condition] || 0) - 1;
      if (state.bag[opt.condition] <= 0) delete state.bag[opt.condition];
    }
    const newSp = PG.SPECIES[opt.to];
    p.speciesId = opt.to;
    p.level = Math.max(p.level, opt.level || p.level);
    // Đặc tính: giữ nếu hợp lệ, nếu không đổi
    const validAbilities = [...newSp.abilities, newSp.hiddenAbility];
    if (!validAbilities.includes(p.ability)) p.ability = PG.pick(newSp.abilities);
    // Học chiêu mới: dạng tiến hóa có chiêu riêng mà dạng cơ bản không có.
    // Nếu đã đủ 4 chiêu, chiêu mạnh nhất sẽ thay chiêu yếu nhất để người chơi thấy rõ.
    const gained = syncSpeciesMoves(p, true);
    p.potential = Math.min(100, (p.potential || 80) + 5);
    const s = getStats(p);
    p.hp = s.hp;
    p.status = null;
    state.stats.evolutions = (state.stats.evolutions || 0) + 1;
    PG.questProgress('evolve', 1);
    PG.recordDex(opt.to, 'caught');
    const moveNames = [...new Set(gained.map(id => PG.getMove(id).name))];
    return { ok: true, gained, msg: oldSpecies.name + ' đã tiến hóa thành ' + newSp.name + '!' +
      (moveNames.length ? ' Học chiêu mới: ' + moveNames.join(', ') + '!' : '') };
  }

  function addCandy(state, speciesId, n) {
    const fam = PG.SPECIES[speciesId].family;
    state.candies[fam] = (state.candies[fam] || 0) + n;
    return state.candies[fam];
  }

  /* ---------------- MAY MẮN ---------------- */
  function effectiveLuck(luck, eventMult) {
    const raw = Math.max(0, luck) * (eventMult || 1);
    // Trần cũ (150) bị bỏ: may mắn có thể tăng vô hạn, hiệu dụng tiệm cận nhưng không bị kẹt cứng.
    return raw / (1 + raw / 1200);
  }
  function luckEffects(luck, eventMult) {
    const eff = effectiveLuck(luck, eventMult);
    return {
      raw: Math.round(luck * (eventMult || 1)),
      effective: Math.round(eff * 10) / 10,
      crit: PG.clamp(0.06 + eff * 0.003, 0, 0.85),
      dodge: PG.clamp(eff * 0.0025, 0, 0.75),
      rareDrop: 1 + eff * 0.006,
      shiny: Math.min(0.08, eff * 0.00003)
    };
  }

  /** Suy giảm may mắn theo từng lượt đấu: bắt đầu nguyên vẹn, tiến về 0. */
  function decayLuckEffects(fx, factor) {
    const f = PG.clamp(Number(factor) || 0, 0, 1);
    const out = Object.assign({}, fx || {});
    out.raw = Math.round((out.raw || 0) * f);
    out.effective = Math.round((out.effective || 0) * f * 10) / 10;
    out.crit = (out.crit || 0) * f;
    out.dodge = (out.dodge || 0) * f;
    out.rareDrop = 1 + ((out.rareDrop || 1) - 1) * f;
    out.shiny = (out.shiny || 0) * f;
    out.decay = f;
    return out;
  }

  function trainerBonuses(state) {
    const agg = PG.aggregateEquipment(state.equipment.equipped);
    const base = PG.trainerBaseStats ? PG.trainerBaseStats(state.player.level) : {};
    const tr = PG.aggregateTrainerItems ? PG.aggregateTrainerItems(state.player.trainerItems) : { totals: {}, items: [] };
    // Cộng dồn thay vì ghi đè: aggregateEquipment() khởi tạo nhiều key = 0.
    const totals = Object.assign({}, base);
    for (const [k, v] of Object.entries(agg.totals || {})) {
      if (k === 'typeBoost') { totals.typeBoost = Object.assign({}, v); continue; }
      totals[k] = (totals[k] || 0) + (Number(v) || 0);
    }
    for (const [k, v] of Object.entries(tr.totals || {})) totals[k] = (totals[k] || 0) + (Number(v) || 0);
    const eventMult = state.events && state.events.active && state.events.active.id === 'lucky' ? 1.5 : 1;
    const luck = totals.luck || 0;
    const fx = luckEffects(luck, eventMult);
    return Object.assign({}, agg, { totals, trainerItems: tr.items, luckFx: fx, eventMult });
  }

  function playerLevelProgress(state) {
    const need = playerXpNeeded(state.player.level);
    return { need, pct: Math.min(1, state.player.xp / need) };
  }

  PG.STAT_KEYS = STAT_KEYS;
  PG.STAT_NAMES = STAT_NAMES;
  PG.GENDERLESS = GENDERLESS;
  PG.createPokemon = createPokemon;
  PG.getStats = getStats;
  PG.battleStats = battleStats;
  PG.heldStatDelta = heldStatDelta;
  PG.increaseFriendship = increaseFriendship;
  PG.feedBerry = feedBerry;
  PG.researchAbilityPool = researchAbilityPool;
  PG.researchChange = researchChange;
  PG.researchRandom = researchRandom;
  PG.cpOf = cpOf;
  PG.ivTotal = ivTotal;
  PG.ivPercent = ivPercent;
  PG.qualityOf = qualityOf;
  PG.starsOf = starsOf;
  PG.getTypes = getTypes;
  PG.movePower = movePower;
  PG.syncSpeciesMoves = syncSpeciesMoves;
  PG.moveAccuracy = moveAccuracy;
  PG.maxPp = maxPp;
  PG.playerXpNeeded = playerXpNeeded;
  PG.addPlayerXp = addPlayerXp;
  PG.addPokemonXp = addPokemonXp;
  PG.grantRandomStat = grantRandomStat;
  PG.xpToNext = xpToNext;
  PG.powerUpCost = powerUpCost;
  PG.canPowerUp = canPowerUp;
  PG.powerUp = powerUp;
  PG.evolutionOptions = evolutionOptions;
  PG.evoRequirementText = evoRequirementText;
  PG.canEvolve = canEvolve;
  PG.evolve = evolve;
  PG.addCandy = addCandy;
  PG.effectiveLuck = effectiveLuck;
  PG.luckEffects = luckEffects;
  PG.decayLuckEffects = decayLuckEffects;
  PG.trainerBonuses = trainerBonuses;
  PG.playerLevelProgress = playerLevelProgress;
})();
