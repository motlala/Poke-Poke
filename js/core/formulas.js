/* ============================================================
   CÔNG THỨC CHIẾN ĐẤU
   Thứ tự xử lý bắt buộc: CHÍNH XÁC → NÉ → CHÍ MẠNG → SÁT THƯƠNG
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;

  const STAGE_KEYS = ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];

  /** Hệ số bậc chỉ số: +1 = 1.5, -1 = 0.67 ... giới hạn -6..+6 */
  function stageMultiplier(stage) {
    const s = PG.clamp(stage || 0, -6, 6);
    return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
  }

  function ensureStages(c) {
    if (!c.stages) c.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 };
    return c.stages;
  }

  /** Chỉ số hiệu dụng sau bậc + trạng thái */
  function effectiveStat(c, key) {
    let v = (c.stats && c.stats[key]) || 1;
    ensureStages(c);
    v *= stageMultiplier(c.stages[key] || 0);
    if (key === 'spe' && c.status === 'paralysis') v *= 0.5;
    return Math.max(1, Math.floor(v));
  }

  /** Tốc độ dùng để xác định thứ tự đánh (tính cả đặc tính thời tiết) */
  function speedOf(c, weather) {
    let v = effectiveStat(c, 'spe');
    if (c.ability === 'chlorophyll' && weather === 'sunny') v *= 2;
    if (c.ability === 'swift-swim' && weather === 'rain') v *= 2;
    return Math.max(1, Math.floor(v));
  }

  function luckFxOf(c) {
    if (c.luckFx) return c.luckFx;
    return PG.luckEffects(c.luck || 0, c.eventMult || 1);
  }

  /* ---------------- 1. CHÍNH XÁC ---------------- */
  function accuracyChance(move, attacker, defender, ctx) {
    if (!move) return 100;
    if (move.flags && move.flags.sureHit) return 100;
    if (move.accuracy === null || move.accuracy === undefined) return 100;
    let acc = move.accuracy;
    ensureStages(attacker);
    ensureStages(defender);
    const stage = (attacker.stages.accuracy || 0) - (defender.stages.evasion || 0);
    acc *= stageMultiplier(stage);
    const weather = ctx && ctx.weather;
    if (weather === 'fog') acc -= 10;
    if (defender.ability === 'sand-veil' && weather === 'sandstorm') acc -= 12;
    if (defender.ability === 'snow-cloak' && weather === 'snow') acc -= 12;
    if (attacker.status === 'fear') acc -= 8;
    const held = PG.heldEffects(attacker);
    if (held && held.battle && held.battle.acc) acc += held.battle.acc * 100;
    if (attacker.side === 'player' && PG.getState && PG.getState()) {
      acc += PG.trainerBonuses(PG.getState()).totals.accuracy || 0;
    }
    return PG.clamp(Math.round(acc), 5, 100);
  }

  /* ---------------- 2. NÉ ---------------- */
  function dodgeChance(attacker, defender, move, ctx) {
    if (!move) return 0;
    if (move.flags && (move.flags.noDodge || move.flags.sureHit)) return 0;
    if (defender.status === 'sleep' || defender.status === 'freeze') return 0;
    let d = defender.dodgeBonus || 0;
    const fx = luckFxOf(defender);
    d += (fx.dodge || 0);
    if (defender.mutations && defender.mutations.includes('mini')) d += 0.05;
    if (defender.ability === 'sand-veil' && ctx && ctx.weather === 'sandstorm') d += 0.08;
    if (defender.ability === 'snow-cloak' && ctx && ctx.weather === 'snow') d += 0.08;
    if (ctx && ctx.weather === 'fog') d += 0.03;
    return PG.clamp(d, 0, 0.75);
  }

  /* ---------------- 3. CHÍ MẠNG ---------------- */
  function critChance(attacker, defender, move, ctx) {
    if (!move || move.category === 'status') return 0;
    if (move.flags && move.flags.alwaysCrit) return 1;
    const fx = luckFxOf(attacker);
    // Trong trận đấu, nền chí mạng và phần đến từ may mắn suy giảm dần về 0.
    const floor = (attacker && attacker.critFloor !== undefined) ? attacker.critFloor : 0.0625;
    let c = Math.max(floor, fx.crit || floor);
    c += (move.critBoost || 0) * 0.08;
    const held = PG.heldEffects(attacker);
    if (held && held.battle && held.battle.crit) c += held.battle.crit;
    if (attacker.ability === 'sniper') c += 0.04;
    if (attacker.mutations && attacker.mutations.includes('crystal')) c += 0.03;
    if (attacker.side === 'player' && PG.getState && PG.getState()) {
      const decay = (attacker && attacker.luckDecay !== undefined) ? attacker.luckDecay : 1;
      c += ((PG.trainerBonuses(PG.getState()).totals.crit || 0) * decay) / 100;
    }
    if (defender.ability === 'battle-armor') c = 0;
    return PG.clamp(c, 0, 0.85);
  }

  function critMultiplier(attacker) {
    if (attacker && attacker.ability === 'sniper') return 2.25;
    return 1.5;
  }

  /* ---------------- 4. SÁT THƯƠNG ---------------- */
  /** Hệ số khắc hệ, bao gồm THIÊN KHẮC khi thủ là hệ Thiên */
  function typeEffect(attackType, attacker, defender, ctx) {
    const types = defender.types || [];
    let mult = PG.getMultiplier(attackType, types);
    // Chiêu phối hợp lấy hệ số khắc tốt nhất trong 2 hệ (vd. Lửa/Cỏ đánh Nước = x2).
    const combo = comboTypesOf(ctx && ctx.move);
    if (combo) {
      for (const t of combo) mult = Math.max(mult, PG.getMultiplier(t, types));
    }
    let fracture = false;
    let fractureX3 = false;
    if (types.includes('celestial') && attackType !== 'celestial' && attackType !== 'neutral' && mult > 0) {
      const luck = (attacker && attacker.luck) || 0;
      const fChance = PG.celestialFractureChance(luck);
      if ((ctx && ctx.forceFracture) || (!ctx || !ctx.noRandom) && Math.random() < fChance) {
        fracture = true;
        const x3Chance = PG.celestialX3Chance(luck);
        fractureX3 = (ctx && ctx.forceX3) || ((!ctx || !ctx.noRandom) && Math.random() < x3Chance);
        mult *= fractureX3 ? 3 : 2;
      }
    }
    return { mult, fracture, fractureX3 };
  }

  function weatherMod(type, weather) {
    if (!weather || weather === 'clear') return 1;
    if (weather === 'sunny') {
      if (type === 'fire') return 1.5;
      if (type === 'water') return 0.5;
    }
    if (weather === 'rain') {
      if (type === 'water') return 1.5;
      if (type === 'fire') return 0.5;
    }
    if (weather === 'snow' && type === 'ice') return 1.5;
    if (weather === 'sandstorm' && ['rock', 'ground', 'steel'].includes(type)) return 1.25;
    if (weather === 'fog' && ['ghost', 'psychic', 'dark', 'fairy'].includes(type)) return 1.15;
    return 1;
  }

  function heldTypeBoost(c, type) {
    let mult = 1;
    // Trang bị khắc hệ của Huấn luyện viên (cộng dồn với đồ cầm tay).
    const engraved = c && c.typeBoost && c.typeBoost[type];
    if (engraved) mult *= engraved;
    const item = PG.heldEffects(c);
    if (item && item.battle && item.battle.typeBoost) mult *= (item.battle.typeBoost[type] || 1);
    return mult;
  }

  /** Vật phẩm cầm tay cộng thêm sát thương khi đối phương đang Bỏng / Độc. */
  function heldDotBonus(attacker, defender) {
    const item = PG.heldEffects(attacker);
    if (!item || !item.dot || !defender || !defender.status) return 1;
    return 1 + (item.dot[defender.status] || 0);
  }

  /** Phòng thủ đặc tính mới: Đá Rắn/Bộ Lọc giảm đòn khắc hệ, Đa Tầng giảm đòn đầu. */
  function abilityDamageMod(defender, effectiveness) {
    let mod = 1;
    if (!defender || !defender.ability) return mod;
    if ((defender.ability === 'solid-rock' || defender.ability === 'filter') && effectiveness > 1) mod *= 0.75;
    if (defender.ability === 'multiscale' && defender.maxHp && defender.hp >= defender.maxHp) mod *= 0.5;
    return mod;
  }

  function abilityTypeGuard(defender, moveType, ctx) {
    if (defender.ability === 'levitate' && moveType === 'ground') return { immune: true, text: 'Lơ Lửng — miễn nhiễm đòn Đất!' };
    if (defender.ability === 'water-absorb' && moveType === 'water') return { absorb: true, pct: 0.25, text: 'Hút Nước — hồi HP!' };
    if (defender.ability === 'flash-fire' && moveType === 'fire') return { absorb: true, pct: 0, text: 'Bắt Lửa — miễn nhiễm!' };
    if (defender.ability === 'wonder-guard' && !defender.types.includes('neutral') && !defender.types.includes('celestial')) {
      const eff = PG.getMultiplier(moveType, defender.types);
      if (eff <= 1) return { immune: true, text: 'Khiên Thần — chỉ đòn khắc hệ mới gây sát thương!' };
    }
    return null;
  }

  /** Chiêu phối hợp mang cờ combo = [hệ A, hệ B]. */
  function comboTypesOf(move) {
    const combo = move && move.flags && move.flags.combo;
    if (!Array.isArray(combo) || combo.length < 2) return null;
    const types = combo.filter(t => PG.TYPES && PG.TYPES[t]);
    return types.length >= 2 ? types : null;
  }

  const WORLD_BADGES = {
    palworld: 'Palworld', digimon: 'Digimon', movie: 'Điện Ảnh', anima: 'Nexus Anima'
  };

  /** Dùng chung cho UI: combo > tuyệt kỹ > tiến hóa > chiêu thế giới > chiêu riêng. */
  function moveFlair(move) {
    const combo = comboTypesOf(move);
    if (combo) return { kind: 'combo', types: combo, badge: 'Phối hợp' };
    if (move && ((move.id && /^ult_/.test(move.id)) || (move.flags && move.flags.ultimate))) {
      return { kind: 'ultimate', types: null, badge: 'Tuyệt Kỹ' };
    }
    if (move && move.flags && move.flags.evolution) {
      return { kind: 'evolution', types: null, badge: 'Tiến hóa' };
    }
    if (move && (move.world || (move.flags && move.flags.world))) {
      const world = move.world || move.flags.world;
      return { kind: 'world', world, types: null, badge: WORLD_BADGES[world] || 'Thế Giới' };
    }
    if (move && move.signature) return { kind: 'signature', types: null, badge: 'Chiêu riêng' };
    return null;
  }
  PG.WORLD_BADGES = WORLD_BADGES;

  /** Đặc tính mới cộng sát thương theo hệ / điều kiện. */
  function abilityPowerMod(attacker, move, ctx) {
    if (!attacker || !attacker.ability || !move) return 1;
    const ab = attacker.ability;
    const type = move.type;
    let mod = 1;
    if (ab === 'molten-core' && type === 'fire') mod *= 1.15;
    if (ab === 'storm-caller' && type === 'electric') mod *= 1.15;
    if (ab === 'verdant-heart' && type === 'grass') mod *= 1.1;
    if (ab === 'deep-current' && type === 'water') mod *= 1.1;
    if (ab === 'iron-fist' && move.flags && move.flags.contact && (type === 'fighting' || type === 'steel')) mod *= 1.15;
    if (ab === 'dune-rider' && (type === 'ground' || type === 'rock') && ctx && ctx.weather === 'sandstorm') mod *= 1.15;
    if (ab === 'dragon-heart' && type === 'dragon') mod *= 1.1;
    // Hợp thể song hệ: chỉ cộng khi đòn thuộc đúng một trong 2 hệ đang mang.
    if (ab === 'dual-current' && (attacker.types || []).length === 2 && (attacker.types || []).indexOf(type) >= 0) mod *= 1.1;
    return mod;
  }

  /** Phòng thủ theo loại đòn của đặc tính mới. */
  function abilityDefenseMod(defender, move) {
    if (!defender || !defender.ability || !move) return 1;
    let mod = 1;
    if (defender.ability === 'chrome-skin' && move.category === 'physical') mod *= 0.8;
    if (defender.ability === 'fairy-ward' && move.category === 'special') mod *= 0.8;
    return mod;
  }

  function baseDamage(attacker, defender, move, ctx) {
    const physical = move.category === 'physical';
    const useDef = move.flags && move.flags.physicalDef ? 'def' : (physical ? 'def' : 'spd');
    let A = effectiveStat(attacker, physical ? 'atk' : 'spa');
    let D = effectiveStat(defender, useDef);
    let power = (move.power || 0) * ((ctx && ctx.powerMult) || 1);
    power *= abilityPowerMod(attacker, move, ctx);

    // Chiêu phối hợp chỉ bùng sức khi người dùng thực sự mang cả 2 hệ.
    const combo = comboTypesOf(move);
    if (combo && (attacker.types || []).length === 2 && combo.every(t => (attacker.types || []).indexOf(t) >= 0)) {
      power *= 1.15;
    }

    if (attacker.ability === 'technician' && power <= 60) power *= 1.5;
    if (attacker.ability === 'sheer-force' && move.effect) power *= 1.3;
    if (attacker.ability === 'guts' && attacker.status && physical) A *= 1.5;
    if (attacker.ability === 'solar-power' && ctx.weather === 'sunny' && !physical) A *= 1.5;
    if (attacker.status === 'burn' && physical) A *= 0.5;
    if (attacker.status === 'fear' && physical) A *= 0.9;

    const stabTypes = ['overgrow:grass', 'blaze:fire', 'torrent:water', 'swarm:bug'];
    for (const pair of stabTypes) {
      const [ab, type] = pair.split(':');
      if (attacker.ability === ab && move.type === type && attacker.hp / attacker.maxHp <= 1 / 3) {
        power *= 1.2;
        break;
      }
    }

    let base = Math.floor(Math.floor(((2 * attacker.level) / 5 + 2) * power * A / Math.max(1, D)) / 50) + 2;
    let stab = (attacker.types || []).includes(move.type) ? 1.5 : 1;
    if (attacker.ability === 'adaptability' && (attacker.types || []).includes(move.type)) stab = 1.8;
    if (attacker.mutations && attacker.mutations.includes('celestial-aura') && move.type === 'celestial') stab = 1.75;
    let weather = weatherMod(move.type, ctx.weather);
    let thickFat = defender.ability === 'thick-fat' && (move.type === 'fire' || move.type === 'ice') ? 0.5 : 1;
    let abilityDef = abilityDefenseMod(defender, move);
    let typeBoost = heldTypeBoost(attacker, move.type);
    const heldFx = PG.heldEffects(attacker);
    let lifeOrb = heldFx && heldFx.battle && heldFx.battle.damage ? heldFx.battle.damage : 1;
    return { base, stab, weather, thickFat, abilityDef, typeBoost, lifeOrb };
  }

  /**
   * Tính một đòn tấn công hoàn chỉnh.
   * Trả về: { miss, dodged, crit, damage, effectiveness, fracture, text[] }
   */
  function attack(attacker, defender, move, ctx) {
    const c = ctx || {};
    const result = {
      miss: false, dodged: false, crit: false, damage: 0,
      effectiveness: 1, fracture: false, fractureX3: false,
      immune: false, absorbed: false, texts: [], move,
      accuracyChance: 100, dodgeChance: 0, critChance: 0
    };
    if (!move || move.category === 'status') {
      result.statusMove = true;
      return result;
    }
    if (attacker.status === 'sleep' || attacker.status === 'freeze') {
      result.miss = true;
      result.blockedByStatus = attacker.status;
      return result;
    }

    // 1) CHÍNH XÁC
    const acc = accuracyChance(move, attacker, defender, c);
    result.accuracyChance = acc;
    if (!c.noRandom && Math.random() * 100 >= acc) {
      result.miss = true;
      result.texts.push('Đòn đánh trượt!');
      return result;
    }

    // 2) NÉ
    const dodge = dodgeChance(attacker, defender, move, c);
    result.dodgeChance = dodge;
    if (!c.noRandom && Math.random() < dodge) {
      result.dodged = true;
      result.texts.push('Đối thủ đã né đòn!');
      return result;
    }

    // 3) CHÍ MẠNG
    const cc = critChance(attacker, defender, move, c);
    result.critChance = cc;
    result.crit = move.flags && move.flags.alwaysCrit ? true : (!c.noRandom ? Math.random() < cc : (c.forceCrit || false));
    if (c.forceCrit === false) result.crit = false;

    // 4) SÁT THƯƠNG
    const combo = comboTypesOf(move);
    let guard = abilityTypeGuard(defender, move.type, c);
    if (combo && combo.length > 1) {
      // Chiêu phối hợp chỉ bị chặn nếu CẢ 2 hệ đều bị miễn nhiễm/hấp thụ.
      const guards = combo.map(t => abilityTypeGuard(defender, t, c));
      const blockers = guards.filter(g => g && (g.immune || g.absorb));
      guard = blockers.length === combo.length ? blockers[0] : null;
    }
    if (guard && guard.immune) {
      result.immune = true;
      result.effectiveness = 0;
      result.texts.push(guard.text);
      return result;
    }
    if (guard && guard.absorb) {
      result.absorbed = true;
      result.effectiveness = 0;
      result.absorbPct = guard.pct;
      result.texts.push(guard.text);
      return result;
    }

    const typeCtx = Object.assign({}, c, { move });
    const eff = typeEffect(move.type, attacker, defender, typeCtx);
    result.effectiveness = eff.mult;
    result.fracture = eff.fracture;
    result.fractureX3 = eff.fractureX3;
    if (eff.mult === 0) {
      result.immune = true;
      result.texts.push('Không có tác dụng...');
      return result;
    }
    if (eff.fracture) {
      result.texts.push('THIÊN KHẮC! Sát thương x' + (eff.fractureX3 ? 3 : 2) + '!');
    }

    const parts = baseDamage(attacker, defender, move, c);
    let critMult = result.crit ? critMultiplier(attacker) : 1;
    let rand = c.noRandom ? 0.925 : (0.85 + Math.random() * 0.15);
    let dmg = parts.base * parts.stab * eff.mult * parts.weather * critMult *
      parts.thickFat * parts.abilityDef * parts.typeBoost * parts.lifeOrb * rand * heldDotBonus(attacker, defender) *
      abilityDamageMod(defender, eff.mult);

    if ((attacker.ability === 'tinted-lens') && eff.mult < 1) dmg *= 2;
    if (attacker.status === 'burn' && move.category === 'physical') { /* đã giảm A */ }
    dmg = Math.max(1, Math.floor(dmg));
    result.damage = dmg;
    result.parts = parts;
    return result;
  }

  /** Ước lượng sát thương trung bình dùng cho AI / gợi ý UI (không random) */
  function estimate(attacker, defender, move, ctx) {
    if (!move || move.category === 'status') return 0;
    const c = Object.assign({}, ctx || {}, { noRandom: true, forceCrit: false, forceFracture: false });
    const acc = accuracyChance(move, attacker, defender, c) / 100;
    const dodge = dodgeChance(attacker, defender, move, c);
    const combo = comboTypesOf(move);
    let guard = abilityTypeGuard(defender, move.type, c);
    if (combo && combo.length > 1) {
      const guards = combo.map(t => abilityTypeGuard(defender, t, c));
      const blockers = guards.filter(g => g && (g.immune || g.absorb));
      guard = blockers.length === combo.length ? blockers[0] : null;
    }
    if (guard && (guard.immune || guard.absorb)) return 0;
    const eff = typeEffect(move.type, attacker, defender, Object.assign({}, c, { move }));
    if (eff.mult === 0) return 0;
    const parts = baseDamage(attacker, defender, move, c);
    const dmg = Math.max(1, Math.floor(parts.base * parts.stab * eff.mult * parts.weather *
      parts.thickFat * parts.abilityDef * parts.typeBoost * parts.lifeOrb * heldDotBonus(attacker, defender) *
      abilityDamageMod(defender, eff.mult) * 0.925));
    return Math.floor(dmg * acc * (1 - dodge));
  }

  PG.Formulas = {
    STAGE_KEYS, stageMultiplier, effectiveStat, speedOf, luckFxOf,
    accuracyChance, dodgeChance, critChance, critMultiplier,
    typeEffect, weatherMod, comboTypesOf, moveFlair, baseDamage, attack, estimate
  };
  // Alias tiện dụng
  PG.calcAttack = attack;
})();
