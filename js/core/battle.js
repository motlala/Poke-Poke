/* ============================================================
   HỆ THỐNG CHIẾN ĐẤU
   Trainer / Gym / Raid / Giải đấu — theo lượt, AI, trạng thái, đặc tính
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const F = PG.Formulas;

  const STATUS_INFO = {
    burn:      { name: 'Bỏng',      icon: '🔥', color: '#f97316' },
    poison:    { name: 'Độc',       icon: '☠️', color: '#a855f7' },
    toxic:     { name: 'Độc nặng',  icon: '🧪', color: '#7c3aed' },
    paralysis: { name: 'Tê liệt',   icon: '⚡', color: '#facc15' },
    sleep:     { name: 'Ngủ',       icon: '💤', color: '#60a5fa' },
    freeze:    { name: 'Đóng băng', icon: '❄️', color: '#7dd3fc' },
    confusion: { name: 'Bối rối',   icon: '💫', color: '#f472b6' },
    fear:      { name: 'Sợ hãi',    icon: '😱', color: '#c084fc' },
    leech:     { name: 'Hút máu',   icon: '🌱', color: '#4ade80' }
  };

  const DIFFICULTY = {
    easy:   { luck: 15,  dodge: 0.01, ai: 1, iv: 8 },
    medium: { luck: 60,  dodge: 0.025, ai: 2, iv: 14 },
    hard:   { luck: 120, dodge: 0.045, ai: 3, iv: 20 },
    boss:   { luck: 190, dodge: 0.06, ai: 3, iv: 28 }
  };

  function statusImmunity(types, status) {
    if (status === 'burn' && types.includes('fire')) return true;
    if (status === 'paralysis' && types.includes('electric')) return true;
    if ((status === 'poison' || status === 'toxic') && (types.includes('poison') || types.includes('steel'))) return true;
    if (status === 'freeze' && types.includes('ice')) return true;
    return false;
  }

  function makeCombatant(p, side, opts) {
    const o = opts || {};
    const sp = PG.SPECIES[p.speciesId];
    // Dùng chung công thức với màn hình chi tiết để tổng chỉ số hiển thị khớp trận đấu.
    const stats = PG.battleStats(p);
    let maxHp = stats.hp;
    const mapFullHp = maxHp; // HP tối đa trên bản đồ (trước cộng chỉ số Huấn luyện viên)
    let hp = typeof p.hp === 'number' ? p.hp : maxHp;
    if (o.fullHp) hp = maxHp;
    hp = PG.clamp(hp, 0, maxHp);

    const state = PG.getState();
    let luck = p.luckBattle || 0;
    let luckFx;
    let dodgeBonus = 0;
    let trainerTypeBoost = {};
    if (side === 'player') {
      const b = PG.trainerBonuses(state);
      trainerTypeBoost = Object.assign({}, b.totals.typeBoost || {});
      luck = b.totals.luck || 0;
      luckFx = b.luckFx;
      dodgeBonus = (b.totals.dodge || 0) / 100 + (luckFx.dodge || 0);
      // Chỉ số Huấn luyện viên (cấp + vật phẩm gắn) cộng trực tiếp vào Pokémon.
      let changed = false;
      for (const k of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
        const v = b.totals[k] || 0;
        if (v) { stats[k] = Math.max(1, stats[k] + v); changed = true; }
      }
      if (changed) {
        maxHp = stats.hp;
        // Đã hồi đầy trên bản đồ thì vào trận cũng phải đầy (theo HP mới).
        const fullOnMap = typeof p.hp === 'number' && p.hp >= mapFullHp - 0.5;
        hp = fullOnMap ? maxHp : PG.clamp(typeof p.hp === 'number' ? p.hp : maxHp, 0, maxHp);
        if (o.fullHp) hp = maxHp;
      }
    } else {
      const d = DIFFICULTY[o.difficulty || 'medium'] || DIFFICULTY.medium;
      luck = o.luck !== undefined ? o.luck : d.luck;
      luckFx = PG.luckEffects(luck, 1);
      dodgeBonus = d.dodge + (luckFx.dodge || 0);

      // Trainer / Gym / đối trọng: nhân HP như Raid nhưng cho cả đội.
      const hpMult = Math.max(1, Number(o.hpMult) || 1);
      if (hpMult !== 1) {
        maxHp = Math.max(1, Math.floor(maxHp * hpMult));
        stats.hp = maxHp;
        hp = o.fullHp ? maxHp : PG.clamp(hp, 0, maxHp);
      }
      // Đối trọng dùng một phần chỉ số HP của Huấn luyện viên người chơi.
      if (o.mirrorPlayerHp) {
        const totals = (PG.trainerBonuses(state).totals) || {};
        const playerHp = Math.max(0, Math.round(totals.hp || 0));
        const bonus = Math.min(Math.round(maxHp * 0.8), Math.round(playerHp * 0.6));
        if (bonus > 0) { maxHp += bonus; stats.hp = maxHp; hp = maxHp; }
      }
    }

    // Save cũ cũng nhận chiêu riêng / chiêu tiến hóa của loài hiện tại.
    if (PG.syncSpeciesMoves) PG.syncSpeciesMoves(p, true);
    const baseLuckFx = Object.assign({}, luckFx);
    const baseDodgeBonus = dodgeBonus;
    const moves = (p.moves || []).map(m => {
      const mid = m.id || m;
      const max = PG.maxPp(mid, 1);
      const cur = p.pp && p.pp[mid] !== undefined ? p.pp[mid] : max;
      return { id: mid, pp: Math.max(0, cur), maxPp: max };
    });
    if (!moves.length) moves.push({ id: 'tackle', pp: 35, maxPp: 35 });

    const c = {
      side, p, speciesId: p.speciesId, name: p.nickname || sp.name,
      level: p.level, types: PG.getTypes(p), stats, maxHp, hp,
      stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 },
      status: p.status || null, statusTurns: p.statusTurns || 0, toxicCounter: 1,
      ability: p.ability, heldItem: p.heldItem || null,
      heldDur: p.heldDur === undefined ? null : p.heldDur, mutations: p.mutations || [],
      luck, luckFx, dodgeBonus,
      typeBoost: trainerTypeBoost,
      baseLuck: luck, baseLuckFx, baseDodgeBonus, luckDecay: 1, critFloor: 0.0625,
      moves, fainted: hp <= 0,
      focusSashUsed: false, sitrusUsed: false, critBlocked: false,
      recharge: false, flinched: false,
      glitchSwapped: false,
      // Hệ Lỗi đổi hệ sau mỗi lượt, kể cả khi đã rời hệ Lỗi trong trận.
      typeShiftActive: false,
      typeShiftStat: null,
      isBoss: !!o.isBoss
    };

    if (c.mutations.includes('glitch')) {
      const keys = ['atk', 'def', 'spa', 'spd', 'spe'];
      const a = PG.pick(keys);
      let bb = PG.pick(keys);
      let guard = 0;
      while (bb === a && guard++ < 10) bb = PG.pick(keys);
      const tmp = c.stats[a];
      c.stats[a] = c.stats[bb];
      c.stats[bb] = tmp;
      c.glitchSwapped = true;
    }
    return c;
  }

  function sync(c) {
    if (!c || !c.p) return;
    c.p.hp = Math.max(0, Math.round(c.hp));
    c.p.status = c.status;
    c.p.statusTurns = c.statusTurns;
    if (c.p.pp) for (const m of c.moves) c.p.pp[m.id] = m.pp;
    c.fainted = c.hp <= 0;
  }

  function syncAll(b) {
    for (const c of b.player.team) sync(c);
    for (const c of b.enemy.team) sync(c);
  }

  /* ---------------- LOG / EVENT ---------------- */
  function log(b, text, tone) {
    const entry = { turn: b.turn, text, tone: tone || 'normal', at: Date.now() };
    b.log.push(entry);
    if (b.log.length > 250) b.log.splice(0, b.log.length - 250);
    return { type: 'text', text, tone: entry.tone };
  }
  function push(events, b, text, tone) {
    const e = log(b, text, tone);
    events.push(e);
    return e;
  }

  /* ---------------- TRẠNG THÁI ---------------- */
  function applyStatus(b, target, status, events, opts) {
    const o = opts || {};
    if (!target || target.hp <= 0) return false;
    if (target.status) return false;
    if (target.ability === 'overcoat') {
      push(events, b, target.name + ' Áo Khoác chặn trạng thái!', 'muted');
      return false;
    }
    if (statusImmunity(target.types, status)) {
      push(events, b, target.name + ' miễn nhiễm ' + (STATUS_INFO[status] || { name: status }).name + '.', 'muted');
      return false;
    }
    target.status = status;
    target.statusTurns = status === 'sleep' ? PG.randInt(2, 4)
      : status === 'confusion' ? PG.randInt(2, 4)
      : status === 'fear' ? PG.randInt(2, 3) : 0;
    target.toxicCounter = 1;
    sync(target);
    const info = STATUS_INFO[status] || { name: status, icon: '❔' };
    events.push({ type: 'status', side: target.side, status, uid: target.p && target.p.uid, text: target.name + ' bị ' + info.name + '!' });
    push(events, b, target.name + ' bị ' + info.name + '!', 'status');
    return true;
  }

  /** Đặc tính mới tự thêm trạng thái phụ cho chiêu cùng hệ. */
  function abilityBonusStatus(attacker, move) {
    if (!attacker || !attacker.ability || !move) return null;
    const ab = attacker.ability;
    const t = move.type;
    if (ab === 'molten-core' && t === 'fire') return { id: 'burn', chance: 25 };
    if (ab === 'storm-caller' && t === 'electric') return { id: 'paralysis', chance: 15 };
    if (ab === 'venom-gland' && t === 'poison') return { id: 'toxic', chance: 25 };
    if (ab === 'night-terror' && t === 'dark') return { id: 'fear', chance: 20 };
    if (ab === 'dream-weaver' && ['psychic', 'ghost', 'fairy'].indexOf(t) >= 0) return { id: 'confusion', chance: 15 };
    return null;
  }

  function tryAbilityStatus(b, attacker, defender, statusId, chance, events) {
    if (!defender || defender.hp <= 0 || defender.status || !statusId || !PG.STATUS_INFO[statusId]) return;
    let c = chance;
    if (attacker.ability === 'serene-grace') c = Math.min(100, c * 2);
    if (defender.ability === 'overcoat' || (c < 100 && defender.ability === 'shield-dust')) {
      push(events, b, defender.name + ' chặn hiệu ứng phụ từ đặc tính!', 'muted');
      return;
    }
    if (Math.random() * 100 < c) applyStatus(b, defender, statusId, events);
  }

  function changeStage(b, target, stat, delta, events) {
    if (!target || target.hp <= 0) return;
    const before = target.stages[stat] || 0;
    target.stages[stat] = PG.clamp(before + delta, -6, 6);
    if (target.stages[stat] === before) {
      push(events, b, target.name + ' không thể thay đổi thêm.', 'muted');
      return;
    }
    events.push({ type: 'stat', side: target.side, uid: target.p && target.p.uid, stat, delta: target.stages[stat] - before, stage: target.stages[stat] });
    const statNames = { atk: 'Tấn công', def: 'Phòng thủ', spa: 'TC đặc biệt', spd: 'PT đặc biệt', spe: 'Tốc độ', accuracy: 'Chính xác', evasion: 'Né tránh' };
    push(events, b, target.name + ': ' + statNames[stat] + ' ' + (delta > 0 ? 'tăng' : 'giảm') + ' ' + Math.abs(delta) + ' bậc!', delta > 0 ? 'buff' : 'debuff');
  }

  function heal(b, target, amount, events, label) {
    if (!target || target.hp <= 0) return 0;
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + Math.max(1, Math.round(amount)));
    sync(target);
    const healed = target.hp - before;
    if (healed > 0) {
      events.push({ type: 'heal', side: target.side, uid: target.p && target.p.uid, amount: healed, hpAfter: target.hp, maxHp: target.maxHp });
      push(events, b, (label || target.name) + ' hồi ' + healed + ' HP.', 'heal');
    }
    return healed;
  }

  /* ---------------- SÁT THƯƠNG ---------------- */
  function dealDamage(b, target, amount, events, opts) {
    const o = opts || {};
    if (!target || target.hp <= 0 || amount <= 0) return 0;
    let dmg = Math.max(1, Math.round(amount));

    // Đánh yếu để bắt: KHÔNG ép giữ 1 HP. Quá đà thì mục tiêu ngất và mất cơ hội bắt.
    if (o.result && o.result.crit && target.mutations && target.mutations.includes('crystal') && !target.critBlocked) {
      target.critBlocked = true;
      dmg = Math.max(1, Math.floor(dmg / 1.5));
      push(events, b, 'Pha Lê chặn đòn chí mạng!', 'muted');
    }
    if (dmg >= target.hp) {
      if (target.ability === 'sturdy' && target.hp === target.maxHp) {
        dmg = target.hp - 1;
        push(events, b, target.name + ' Kiên Cố — sống sót với 1 HP!', 'buff');
      } else if (target.heldItem === 'focus-sash' && PG.heldEffects(target) && target.hp === target.maxHp && !target.focusSashUsed) {
        target.focusSashUsed = true;
        dmg = target.hp - 1;
        push(events, b, target.name + ' Đai Tập Trung — sống sót với 1 HP!', 'buff');
      }
    }
    target.hp = Math.max(0, target.hp - dmg);
    sync(target);
    events.push({
      type: 'damage', side: target.side, uid: target.p && target.p.uid, amount: dmg, hpAfter: target.hp, maxHp: target.maxHp,
      crit: !!o.crit, effectiveness: o.effectiveness === undefined ? 1 : o.effectiveness,
      fracture: !!o.fracture, source: o.source || null
    });
    if (target.hp <= 0) {
      target.status = null;
      target.fainted = true;
      sync(target);
      events.push({ type: 'faint', side: target.side, uid: target.p && target.p.uid, name: target.name, level: target.level });
      push(events, b, target.name + ' đã ngất!', 'faint');
    }
    return dmg;
  }

  function effText(mult) {
    const label = PG.effectivenessLabel(mult);
    if (mult >= 2) return label.text + '!';
    if (mult === 0) return label.text + '...';
    if (mult < 1) return label.text + '...';
    return '';
  }

  /* ---------------- DÙNG CHIÊU ---------------- */
  function moveOf(c, index) {
    const entry = c.moves[index];
    if (!entry) return null;
    return { entry, move: PG.getMove(entry.id) };
  }

  function pickStruggle(c) {
    return { entry: { id: 'struggle', pp: 1, maxPp: 1 }, move: PG.getMove('struggle') };
  }

  function chooseMoveIndex(c) {
    for (let i = 0; i < c.moves.length; i++) {
      if (c.moves[i].pp > 0) {
        const mv = PG.getMove(c.moves[i].id);
        if (mv && mv.power > 0) return i;
      }
    }
    for (let i = 0; i < c.moves.length; i++) if (c.moves[i].pp > 0) return i;
    return -1;
  }

  function attemptStatusMove(b, attacker, defender, move, events) {
    if (move.accuracy !== null && move.accuracy !== undefined) {
      const acc = F.accuracyChance(move, attacker, defender, { weather: b.weather });
      if (Math.random() * 100 >= acc) {
        push(events, b, attacker.name + ' dùng ' + move.name + ' nhưng trượt!', 'muted');
        return;
      }
    }
    push(events, b, attacker.name + ' dùng ' + move.name + '!', 'move');
    applyMoveEffects(b, attacker, defender, move, events, 0);
  }

  function applyMoveEffects(b, attacker, defender, move, events, damageDealt, opts) {
    const eff = move.effect;
    if (!eff) return;
    const o = opts || {};
    const serene = attacker.ability === 'serene-grace';

    if (eff.heal && attacker.hp > 0 && !o.skipDrain) {
      heal(b, attacker, attacker.maxHp * eff.heal, events, attacker.name + ' hồi phục');
    }
    if (eff.drain && damageDealt > 0 && attacker.hp > 0 && !o.skipDrain) {
      heal(b, attacker, damageDealt * eff.drain, events, attacker.name + ' hút sinh lực');
    }
    if (eff.recoil && damageDealt > 0 && attacker.hp > 0 && !o.skipDrain) {
      const rec = Math.max(1, Math.floor(damageDealt * eff.recoil));
      dealDamage(b, attacker, rec, events, { source: 'recoil' });
      push(events, b, attacker.name + ' chịu ' + rec + ' sát thương phản lực.', 'muted');
    }
    if (eff.status) {
      let chance = eff.status.chance === undefined ? 100 : eff.status.chance;
      if (serene) chance = Math.min(100, chance * 2);
      if (defender.ability === 'overcoat' || (chance < 100 && defender.ability === 'shield-dust')) {
        push(events, b, defender.name + (defender.ability === 'overcoat' ? ' Áo Khoác' : ' Bụi Khiên') + ' chặn hiệu ứng phụ!', 'muted');
      } else if (Math.random() * 100 < chance) {
        applyStatus(b, defender, eff.status.id, events);
      }
    }
    if (eff.stat) {
      const s = eff.stat;
      const chance = s.chance === undefined ? 100 : s.chance;
      if (Math.random() * 100 < chance) {
        const target = s.target === 'self' ? attacker : defender;
        changeStage(b, target, s.stat, s.stages, events);
        if (s.also) changeStage(b, target, s.also.stat, s.also.stages, events);
      }
    }
    if (eff.flinch) {
      let chance = eff.flinch;
      if (serene) chance *= 2;
      if (defender.ability === 'overcoat' || (chance < 100 && defender.ability === 'shield-dust')) {
        push(events, b, defender.name + (defender.ability === 'overcoat' ? ' Áo Khoác' : ' Bụi Khiên') + ' chặn hiệu ứng phụ!', 'muted');
      } else if (Math.random() * 100 < chance) {
        defender.flinched = true;
      }
    }

    /* ---------- ĐẶC TÍNH MỚI ---------- */
    const bonusStatus = abilityBonusStatus(attacker, move);
    if (bonusStatus) tryAbilityStatus(b, attacker, defender, bonusStatus.id, bonusStatus.chance, events);
    if (attacker.ability === 'frostbite' && move.type === 'ice' && defender.hp > 0 && Math.random() < 0.25) {
      changeStage(b, defender, 'spe', -1, events);
    }
    if (attacker.ability === 'hive-mind' && move.type === 'bug' && defender.hp > 0 && Math.random() < 0.2) {
      changeStage(b, defender, 'def', -1, events);
    }
    if (attacker.ability === 'sky-step' && move.type === 'flying' && defender.hp > 0 && Math.random() < 0.15) {
      defender.flinched = true;
    }
  }

  /** Đặc tính kích hoạt SAU khi lượt chiêu kết thúc (kể cả chiêu trạng thái). */
  function applyPostMoveAbilities(b, attacker, events) {
    if (!attacker || attacker.hp <= 0) return;
    // Đặc tính là tên gọi, nhưng hành vi là của hệ Lỗi: mọi loài hệ Lỗi đều đổi,
    // bất kể đặc tính nào được roll lúc tạo. Cờ giữ hiệu ứng suốt trận.
    const isGlitch = !!attacker.typeShiftActive ||
      (attacker.types || []).indexOf('glitch') >= 0 || attacker.ability === 'glitch-shift';
    if (!isGlitch) return;
    const cfg = PG.TYPE_SPECIAL.glitch || {};
    let pool = (cfg.shiftPool || []).filter(t => PG.TYPES[t] && t !== 'glitch');
    if (!pool.length) pool = PG.TYPE_ORDER.filter(t => PG.TYPES[t] && t !== 'glitch' && t !== 'neutral' && t !== 'celestial');
    const current = (attacker.types || [])[0];
    const choices = pool.filter(t => t !== current);
    const next = PG.pick(choices.length ? choices : pool);
    if (!next) return;
    attacker.types = [next];
    attacker.typeShiftActive = true;

    // Kế thừa toàn bộ hệ mới: chiêu, đặc tính và thiên hướng chỉ số.
    if (cfg.inheritTypeKit !== false) {
      const kit = (PG.TYPE_MOVES[next] || [])
        .filter(row => PG.MOVES[row[0]])
        .sort((a, b2) => b2[1] - a[1])
        .slice(0, 4)
        .map(row => {
          const id = row[0];
          const max = PG.maxPp(id, 1);
          return { id, pp: max, maxPp: max };
        });
      if (kit.length) attacker.moves = kit;

      const abs = (PG.TYPE_ABILITIES[next] || []).filter(a => PG.ABILITIES[a]);
      if (abs.length) attacker.ability = PG.pick(abs);

      const bias = cfg.statBias && cfg.statBias[next];
      if (bias && attacker.stages) {
        const old = attacker.typeShiftStat;
        if (old && old !== bias && attacker.stages[old] > 0) {
          changeStage(b, attacker, old, -attacker.stages[old], events);
        }
        if (!(attacker.stages[bias] > 0)) changeStage(b, attacker, bias, 1, events);
        attacker.typeShiftStat = bias;
      }
    }

    events.push({
      type: 'type', side: attacker.side, uid: attacker.p && attacker.p.uid,
      types: attacker.types.slice(), ability: attacker.ability,
      moves: attacker.moves.map(m => m.id)
    });
    push(events, b, attacker.name + ' gặp Lỗi Hệ Thống — đổi sang hệ ' + PG.TYPES[next].name +
      ', dùng chiêu và đặc tính của hệ ' + PG.TYPES[next].name + '!', 'muted');
  }

  /** Thực thi lượt của một bên. Trả về true nếu đã hành động. */
  function executeMoveTurn(b, side, moveIndex, events) {
    const c = b[side].team[b[side].active];
    const foeSide = side === 'player' ? 'enemy' : 'player';
    const foe = b[foeSide].team[b[foeSide].active];
    if (!c || !foe || c.hp <= 0 || foe.hp <= 0 || b.over) return false;

    // Hồi chiêu
    if (c.recharge) {
      c.recharge = false;
      push(events, b, c.name + ' đang nạp lại năng lượng...', 'muted');
      return false;
    }
    // Tập Trung: tự thoát Sợ hãi / Bối rối trước khi xét mất lượt.
    if (c.ability === 'inner-focus' && (c.status === 'fear' || c.status === 'confusion')) {
      c.status = null; sync(c);
      events.push({ type: 'status', side, status: null });
      push(events, b, c.name + ' Tập Trung — thoát trạng thái!', 'buff');
    }
    // Trạng thái ngăn hành động
    if (c.status === 'sleep') {
      if (c.statusTurns > 0) c.statusTurns--;
      if (c.statusTurns <= 0) {
        c.status = null; sync(c);
        events.push({ type: 'status', side, status: null });
        push(events, b, c.name + ' đã tỉnh giấc!', 'buff');
      } else {
        push(events, b, c.name + ' đang ngủ say...', 'muted');
        return false;
      }
    }
    if (c.status === 'freeze') {
      if (Math.random() < 0.2) {
        c.status = null; sync(c);
        events.push({ type: 'status', side, status: null });
        push(events, b, c.name + ' đã tan băng!', 'buff');
      } else {
        push(events, b, c.name + ' bị đóng băng, không thể cử động!', 'muted');
        return false;
      }
    }
    if (c.status === 'paralysis' && Math.random() < 0.25) {
      push(events, b, c.name + ' bị tê liệt, không thể cử động!', 'muted');
      return false;
    }
    if (c.status === 'fear' && Math.random() < 0.25) {
      push(events, b, c.name + ' run sợ, không dám tấn công!', 'muted');
      return false;
    }
    if (c.flinched) {
      c.flinched = false;
      push(events, b, c.name + ' bị choáng, mất lượt!', 'muted');
      return false;
    }
    if (c.status === 'confusion') {
      if (c.statusTurns > 0) c.statusTurns--;
      if (c.statusTurns <= 0) {
        c.status = null; sync(c);
        events.push({ type: 'status', side, status: null });
        push(events, b, c.name + ' đã hết bối rối.', 'buff');
      } else if (Math.random() < 0.33) {
        const selfDmg = Math.max(1, Math.floor(c.maxHp / 12 + c.level));
        push(events, b, c.name + ' bối rối tự đánh mình!', 'muted');
        dealDamage(b, c, selfDmg, events, { source: 'confusion' });
        return false;
      }
    }

    let picked = moveOf(c, moveIndex);
    if (!picked || picked.entry.pp <= 0) {
      const idx = chooseMoveIndex(c);
      if (idx < 0) picked = pickStruggle(c);
      else picked = moveOf(c, idx);
    }
    if (!picked) return false;
    const { entry, move } = picked;
    if (entry.id !== 'struggle') entry.pp = Math.max(0, entry.pp - 1);
    if (c.p && c.p.pp && entry.id !== 'struggle') c.p.pp[entry.id] = entry.pp;

    const hits = move.effect && move.effect.multihit ? PG.randInt(move.effect.multihit[0], move.effect.multihit[1]) : 1;
    events.push({
      type: 'move', side, moveId: move.id, moveName: move.name, moveType: move.type,
      category: move.category || 'physical',
      contact: !!(move.flags && move.flags.contact),
      multihit: hits > 1, hits,
      targetSide: foe.side, uid: c.p && c.p.uid
    });
    if (move.category === 'status') {
      attemptStatusMove(b, c, foe, move, events);
      applyPostMoveAbilities(b, c, events);
      return true;
    }

    let powerMult = 1;
    if (move.flags && move.flags.doubleIfPoisoned && (foe.status === 'poison' || foe.status === 'toxic')) powerMult *= 2;
    if (move.flags && move.flags.doubleIfStatus && foe.status) powerMult *= 2;
    push(events, b, c.name + ' dùng ' + move.name + '!' + (hits > 1 ? ' (x' + hits + ')' : ''), 'move');

    let total = 0;
    for (let h = 0; h < hits; h++) {
      if (foe.hp <= 0 || c.hp <= 0) break;
      const res = F.attack(c, foe, move, { weather: b.weather, powerMult, move });
      if (res.miss) {
        push(events, b, 'Đòn đánh trượt!', 'muted');
        events.push({ type: 'miss', side, uid: c.p && c.p.uid, name: c.name, moveType: move.type, targetSide: foe.side });
        break;
      }
      if (res.dodged) {
        push(events, b, foe.name + ' đã né đòn!', 'muted');
        events.push({ type: 'dodge', side: foe.side, uid: foe.p && foe.p.uid, name: foe.name, moveType: move.type, attackerSide: side });
        if (side === 'enemy') {
          const st = PG.getState();
          st.stats.dodges = (st.stats.dodges || 0) + 1;
          PG.questProgress('dodge', 1);
        }
        break;
      }
      if (res.immune) {
        push(events, b, res.texts[0] || 'Không có tác dụng...', 'muted');
        break;
      }
      if (res.absorbed) {
        if (res.absorbPct) heal(b, foe, foe.maxHp * res.absorbPct, events, foe.name + ' hấp thụ');
        push(events, b, res.texts[0] || 'Hấp thụ đòn đánh!', 'muted');
        break;
      }
      if (res.fracture) push(events, b, res.texts[0], 'crit');
      const dealt = dealDamage(b, foe, res.damage, events, {
        crit: res.crit, effectiveness: res.effectiveness, fracture: res.fracture, source: side
      });
      total += dealt;
      if (res.crit) {
        push(events, b, 'Chí mạng!', 'crit');
        if (side === 'player') {
          const st = PG.getState();
          st.stats.crits = (st.stats.crits || 0) + 1;
        }
      }
      const et = effText(res.effectiveness);
      if (et) push(events, b, et, res.effectiveness >= 2 ? 'super' : 'weak');
      if (foe.hp <= 0) break;
      // Hiệu ứng phụ chỉ 1 lần (hút máu / phản lực xử lý sau vòng lặp)
      if (h === 0) applyMoveEffects(b, c, foe, move, events, dealt, { skipDrain: true });
    }

    // Hút máu / phản lực cho toàn bộ đòn
    if (move.effect) {
      if (move.effect.drain && total > 0) heal(b, c, total * move.effect.drain, events, c.name + ' hút sinh lực');
      if (move.effect.recoil && total > 0 && c.hp > 0) {
        const rec = Math.max(1, Math.floor(total * move.effect.recoil));
        dealDamage(b, c, rec, events, { source: 'recoil' });
        push(events, b, c.name + ' chịu ' + rec + ' sát thương phản lực.', 'muted');
      }
    }
    // Hồi/phản lực từ đặc tính mới (chỉ áp dụng khi đòn có sát thương).
    let abilityDrain = 0;
    if (c.ability === 'verdant-heart' && move.type === 'grass') abilityDrain = 0.15;
    if (c.ability === 'deep-current' && move.type === 'water') abilityDrain = 0.1;
    if (abilityDrain && total > 0) heal(b, c, total * abilityDrain, events, c.name + ' hồi nhờ đặc tính');
    if (c.ability === 'dragon-heart' && move.type === 'dragon' && total > 0 && c.hp > 0) {
      const rec = Math.max(1, Math.floor(total * 0.1));
      dealDamage(b, c, rec, events, { source: 'recoil' });
      push(events, b, c.name + ' chịu ' + rec + ' sát thương do Tim Rồng.', 'muted');
    }
    if (c.heldItem === 'life-orb' && PG.heldEffects(c) && total > 0 && c.hp > 0) {
      dealDamage(b, c, Math.max(1, Math.floor(c.maxHp * 0.1)), events, { source: 'life-orb' });
      push(events, b, c.name + ' mất HP vì Cầu Sinh Mệnh.', 'muted');
    }
    if (move.flags && move.flags.recharge) {
      c.recharge = true;
      push(events, b, c.name + ' phải nạp lại ở lượt sau.', 'muted');
    }
    // Moxie
    if (foe.hp <= 0 && c.ability === 'moxie' && c.hp > 0) {
      changeStage(b, c, 'atk', 1, events);
    }
    applyPostMoveAbilities(b, c, events);
    return true;
  }

  /* ---------------- AI ---------------- */
  function aiChooseAction(b) {
    const e = b.enemy.team[b.enemy.active];
    const p = b.player.team[b.player.active];
    if (!e || !p || e.hp <= 0) return { type: 'move', index: 0 };
    const diff = DIFFICULTY[b.difficulty || 'medium'] || DIFFICULTY.medium;
    const usable = [];
    for (let i = 0; i < e.moves.length; i++) {
      if (e.moves[i].pp <= 0) continue;
      const mv = PG.getMove(e.moves[i].id);
      if (!mv) continue;
      let score = 0;
      if (mv.category === 'status') {
        if (mv.effect && mv.effect.heal) score = e.hp / e.maxHp < 0.4 ? 180 : 10;
        else if (mv.effect && mv.effect.status && !p.status) {
          score = 60;
          if (mv.effect.status.id === 'sleep') score += 45;
          if (mv.effect.status.id === 'toxic') score += 25;
          if (mv.effect.status.id === 'paralysis') score += 20;
        } else if (mv.effect && mv.effect.stat) {
          const targetSelf = mv.effect.stat.target === 'self';
          if (targetSelf && b.turn <= 3) score = 70;
          else if (!targetSelf) score = p.hp / p.maxHp > 0.7 ? 25 : 10;
          else score = 8;
        } else score = 5;
        score *= (mv.accuracy === null ? 1 : (mv.accuracy || 100) / 100);
      } else {
        const dmg = F.estimate(e, p, mv, { weather: b.weather });
        score = dmg * 3;
        if (dmg >= p.hp) score += 500;
        if (p.hp / p.maxHp < 0.3) score += 40;
        if (mv.effect && mv.effect.status && !p.status) score += 15;
      }
      score *= 0.85 + Math.random() * 0.3;
      usable.push({ index: i, score, move: mv });
    }
    if (!usable.length) return { type: 'move', index: -1, struggle: true };
    usable.sort((a, c) => c.score - a.score);
    let choice;
    if (diff.ai <= 1) choice = usable[Math.floor(Math.random() * Math.min(3, usable.length))];
    else if (diff.ai === 2) choice = usable[Math.floor(Math.random() * Math.min(2, usable.length))];
    else choice = usable[0];
    return { type: 'move', index: choice.index, moveName: choice.move.name };
  }

  function quickClaw(c) {
    if (c.heldItem !== 'quick-claw' || !PG.heldEffects(c)) return false;
    return Math.random() < 0.2;
  }

  function actionPriority(action, c) {
    if (action.type !== 'move') return 6;
    const picked = moveOf(c, action.index);
    if (!picked) return 0;
    return picked.move.priority || 0;
  }

  function decideOrder(b, playerAction, enemyAction) {
    const p = b.player.team[b.player.active];
    const e = b.enemy.team[b.enemy.active];
    let pp = actionPriority(playerAction, p);
    let ep = actionPriority(enemyAction, e);
    if (quickClaw(p)) { pp += 3; if (b._orderEvents) push(b._orderEvents, b, p.name + ' kích hoạt Vuốt Nhanh!', 'buff'); }
    if (quickClaw(e)) ep += 3;
    if (pp !== ep) return pp > ep ? 'player' : 'enemy';
    const ps = F.speedOf(p, b.weather);
    const es = F.speedOf(e, b.weather);
    if (ps !== es) return ps > es ? 'player' : 'enemy';
    return Math.random() < 0.5 ? 'player' : 'enemy';
  }

  /* ---------------- LƯỢT ---------------- */
  function takeTurn(b, playerAction) {
    const events = [];
    b._orderEvents = events;
    if (!b || b.over) return { ok: false, events, msg: 'Trận đấu đã kết thúc.' };
    const active = b.player.team[b.player.active];
    if (!active || active.hp <= 0) {
      return { ok: false, events, msg: 'Pokémon của bạn đã ngất. Hãy chọn Pokémon khác.', needSwitch: true };
    }

    if (playerAction.type === 'switch') {
      return doSwitch(b, playerAction.index, events);
    }
    if (playerAction.type === 'item') {
      return doItem(b, playerAction.itemId, playerAction.targetUid, events);
    }
    if (playerAction.type === 'flee') {
      push(events, b, 'Bạn đã rút lui khỏi trận đấu.', 'muted');
      finishBattle(b, 'enemy', events, { forfeit: true });
      return { ok: true, events, battle: b };
    }

    const enemyAction = aiChooseAction(b);
    if (enemyAction.type !== 'move') return { ok: false, events, msg: 'AI lỗi.' };
    const first = decideOrder(b, playerAction, enemyAction);
    b._orderEvents = null;

    const playerMoveIdx = playerAction.index;
    const enemyMoveIdx = enemyAction.index;

    function act(side) {
      const c = b[side].team[b[side].active];
      const foeSide = side === 'player' ? 'enemy' : 'player';
      const foe = b[foeSide].team[b[foeSide].active];
      if (!c || !foe || c.hp <= 0 || foe.hp <= 0 || b.over) return;
      const idx = side === 'player' ? playerMoveIdx : enemyMoveIdx;
      executeMoveTurn(b, side, idx, events);
    }

    if (first === 'player') { act('player'); act('enemy'); }
    else { act('enemy'); act('player'); }

    if (!b.over) endTurn(b, events);
    return { ok: true, events, battle: b, needSwitch: !!b.awaitingSwitch };
  }

  function doSwitch(b, index, events) {
    const forced = b.awaitingSwitch;
    const team = b.player.team;
    if (index === undefined || index === null) {
      // chọn người kế tiếp đầu tiên còn sống
      index = team.findIndex(c => c.hp > 0 && c !== team[b.player.active]);
    }
    if (index < 0 || index >= team.length) return { ok: false, events, msg: 'Vị trí không hợp lệ.' };
    const next = team[index];
    if (!next || next.hp <= 0) return { ok: false, events, msg: 'Pokémon này đã ngất.' };
    if (index === b.player.active && !forced) return { ok: false, events, msg: 'Đang ra sân rồi.' };
    const old = team[b.player.active];
    if (old && old !== next) {
      if (old.ability === 'natural-cure' && old.status) {
        old.status = null; sync(old);
      }
      if (old.ability === 'regenerator' && old.hp > 0) heal(b, old, old.maxHp / 3, events, old.name + ' Tái Sinh');
      old.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 };
    }
    b.player.active = index;
    b.awaitingSwitch = false;
    b.participants.add(next.p?.uid || '');
    events.push({ type: 'switch', side: 'player', name: next.name, index });
    push(events, b, 'Bạn tung ' + next.name + ' ra sân!', 'switch');
    const foe = b.enemy.team[b.enemy.active];
    if (next.ability === 'intimidate' && foe && foe.hp > 0) {
      changeStage(b, foe, 'atk', -1, events);
    }
    sync(next);
    if (forced) {
      return { ok: true, events, battle: b, forced: true };
    }
    // Đổi Pokémon tự nguyện tốn lượt: đối thủ được đánh
    if (!b.over && foe && foe.hp > 0 && next.hp > 0) {
      const enemyAction = aiChooseAction(b);
      executeMoveTurn(b, 'enemy', enemyAction.index, events);
    }
    if (!b.over) endTurn(b, events);
    return { ok: true, events, battle: b, needSwitch: !!b.awaitingSwitch };
  }

  function doItem(b, itemId, targetUid, events) {
    const info = PG.MEDICINES[itemId];
    if (!info) return { ok: false, events, msg: 'Vật phẩm không dùng được trong trận.' };
    const state = PG.getState();
    if ((state.bag[itemId] || 0) < 1) return { ok: false, events, msg: 'Không còn vật phẩm.' };
    let target = b.player.team.find(c => c.p && c.p.uid === targetUid) || b.player.team[b.player.active];
    if (!target) return { ok: false, events, msg: 'Không tìm thấy Pokémon.' };
    if (info.stamina) return { ok: false, events, msg: 'Không thể dùng trong trận.' };
    if (info.revive) {
      if (target.hp > 0) return { ok: false, events, msg: 'Pokémon chưa ngất.' };
      target.hp = Math.max(1, Math.round(target.maxHp * info.revive));
      target.status = null;
      target.fainted = false;
      sync(target);
      events.push({ type: 'heal', side: target.side, amount: target.hp, hpAfter: target.hp, maxHp: target.maxHp });
      push(events, b, 'Dùng ' + info.name + ': ' + target.name + ' hồi sinh!', 'heal');
    } else if (info.heal) {
      if (target.hp <= 0) return { ok: false, events, msg: 'Cần Revive trước.' };
      if (target.hp >= target.maxHp) return { ok: false, events, msg: 'HP đã đầy.' };
      heal(b, target, info.heal, events, info.name);
      push(events, b, 'Dùng ' + info.name + ' cho ' + target.name + '.', 'heal');
    } else if (info.cure) {
      if (!target.status) return { ok: false, events, msg: 'Không có trạng thái xấu.' };
      target.status = null; sync(target);
      events.push({ type: 'status', side: target.side, status: null });
      push(events, b, 'Dùng ' + info.name + ': ' + target.name + ' được chữa trị.', 'heal');
    } else return { ok: false, events, msg: 'Vật phẩm không có tác dụng.' };

    PG.removeItem(itemId, 1);
    const foe = b.enemy.team[b.enemy.active];
    if (!b.over && foe && foe.hp > 0) {
      const enemyAction = aiChooseAction(b);
      executeMoveTurn(b, 'enemy', enemyAction.index, events);
    }
    if (!b.over) endTurn(b, events);
    return { ok: true, events, battle: b, needSwitch: !!b.awaitingSwitch };
  }

  /* ---------------- SUY GIẢM MAY MẮN / CHÍ MẠNG THEO LƯỢT ---------------- */
  const LUCK_DECAY_PER_TURN = 0.08;

  function decayBattleLuck(b, events) {
    if (!b) return;
    b.decay = Math.round(Math.max(0, (b.decay === undefined ? 1 : b.decay) - LUCK_DECAY_PER_TURN) * 100) / 100;
    for (const side of ['player', 'enemy']) {
      for (const c of (b[side] && b[side].team) || []) {
        c.luckDecay = b.decay;
        c.luckFx = PG.decayLuckEffects(c.baseLuckFx || c.luckFx, b.decay);
        c.dodgeBonus = (c.baseDodgeBonus || 0) * b.decay;
        c.luck = (c.baseLuck || 0) * b.decay;
        c.critFloor = 0.0625 * b.decay;
      }
    }
    if (events && b.decay === 0.4) push(events, b, 'May mắn và tỉ lệ chí mạng đang suy giảm dần theo từng lượt.', 'muted');
    if (events && b.decay === 0) push(events, b, 'May mắn đã cạn — chí mạng và né tránh về 0.', 'muted');
  }

  /* ---------------- CUỐI LƯỢT ---------------- */
  function endTurn(b, events) {
    const sides = ['player', 'enemy'];
    for (const side of sides) {
      const c = b[side].team[b[side].active];
      if (!c || c.hp <= 0) continue;
      const foeSide = side === 'player' ? 'enemy' : 'player';
      const foe = b[foeSide].team[b[foeSide].active];

      if (c.status === 'burn') {
        dealDamage(b, c, Math.max(1, Math.floor(c.maxHp / 16)), events, { source: 'burn' });
        push(events, b, c.name + ' bị bỏng, mất HP.', 'status');
      } else if (c.status === 'poison') {
        dealDamage(b, c, Math.max(1, Math.floor(c.maxHp / 8)), events, { source: 'poison' });
        push(events, b, c.name + ' bị độc, mất HP.', 'status');
      } else if (c.status === 'toxic') {
        const dmg = Math.max(1, Math.floor(c.maxHp * c.toxicCounter / 16));
        c.toxicCounter = Math.min(15, c.toxicCounter + 1);
        dealDamage(b, c, dmg, events, { source: 'toxic' });
        push(events, b, c.name + ' bị độc nặng, mất ' + dmg + ' HP.', 'status');
      }
      if (c.status === 'leech' && foe && foe.hp > 0 && c.hp > 0) {
        const dmg = Math.max(1, Math.floor(c.maxHp / 8));
        dealDamage(b, c, dmg, events, { source: 'leech' });
        heal(b, foe, dmg, events, foe.name + ' hút sinh lực');
      }
      const held = PG.heldEffects(c);
      if (c.heldItem === 'leftovers' && held && c.hp > 0) heal(b, c, Math.floor(c.maxHp / 16), events, c.name + ' (Thức Ăn Thừa)');
      if (c.heldItem === 'oran-berry' && held && !c.sitrusUsed && c.hp > 0 && c.hp <= c.maxHp / 2) {
        c.sitrusUsed = true; heal(b, c, 10, events, c.name + ' (Quả Oran)');
      }
      if (c.heldItem === 'sitrus-berry' && held && !c.sitrusUsed && c.hp > 0 && c.hp <= c.maxHp / 2) {
        c.sitrusUsed = true; heal(b, c, c.maxHp * 0.25, events, c.name + ' (Quả Sitrus)');
      }
      if (c.ability === 'speed-boost' && c.hp > 0) changeStage(b, c, 'spe', 1, events);
      if (c.ability === 'solar-power' && b.weather === 'sunny' && c.hp > 0) {
        dealDamage(b, c, Math.max(1, Math.floor(c.maxHp / 8)), events, { source: 'solar-power' });
        push(events, b, c.name + ' mất HP vì Năng Lượng Mặt Trời.', 'muted');
      }
      c.flinched = false;
    }

    if (b.weather === 'sandstorm') {
      for (const side of sides) {
        const c = b[side].team[b[side].active];
        if (!c || c.hp <= 0) continue;
        if (c.types.includes('rock') || c.types.includes('ground') || c.types.includes('steel')) continue;
        dealDamage(b, c, Math.max(1, Math.floor(c.maxHp / 16)), events, { source: 'sandstorm' });
        push(events, b, c.name + ' bị bão cát cào xước.', 'muted');
      }
    }

    decayBattleLuck(b, events);
    b.turn++;
    resolveFaints(b, events);
  }

  function resolveFaints(b, events) {
    const p = b.player.team[b.player.active];
    const e = b.enemy.team[b.enemy.active];

    if (e && e.hp <= 0) {
      const next = b.enemy.team.findIndex(c => c.hp > 0);
      if (next >= 0) {
        b.enemy.active = next;
        const nc = b.enemy.team[next];
        events.push({ type: 'switch', side: 'enemy', name: nc.name, index: next });
        push(events, b, 'Đối thủ tung ' + nc.name + ' ra sân!', 'switch');
        const pl = b.player.team[b.player.active];
        if (nc.ability === 'intimidate' && pl && pl.hp > 0) changeStage(b, pl, 'atk', -1, events);
      }
    }
    if (p && p.hp <= 0) {
      const next = b.player.team.findIndex(c => c.hp > 0);
      if (next >= 0) {
        b.awaitingSwitch = true;
        push(events, b, 'Hãy chọn Pokémon tiếp theo!', 'warn');
      }
    }

    const playerAlive = b.player.team.some(c => c.hp > 0);
    const enemyAlive = b.enemy.team.some(c => c.hp > 0);
    // Đánh yếu để bắt: quá đà làm mục tiêu ngất -> đánh dấu, KHÔNG cho bắt lại.
    if (b.type === 'wild' && !enemyAlive) b.targetDown = true;
    if (!enemyAlive && !playerAlive) finishBattle(b, 'draw', events);
    else if (!enemyAlive) finishBattle(b, 'player', events);
    else if (!playerAlive) finishBattle(b, 'enemy', events);
  }

  /* ---------------- KẾT THÚC ---------------- */
  function scaleReward(r, mult) {
    return {
      coins: r.coins ? Math.round(r.coins * mult) : 0,
      xp: r.xp ? Math.round(r.xp * mult) : 0,
      stardust: r.stardust ? Math.round(r.stardust * mult) : 0,
      diamonds: r.diamonds ? Math.round(r.diamonds * mult) : 0,
      items: mult >= 1 ? (r.items || null) : null,
      materials: mult >= 1 ? (r.materials || null) : null
    };
  }

  /**
   * Thưởng ngẫu nhiên sau thắng trainer: luôn có bóng + tiền, thêm quả/thuốc,
   * vật liệu, bụi sao và đôi khi trang bị. Cấp vùng càng cao thưởng càng tốt.
   * Trả về bản sao — không đụng vào dữ liệu tĩnh trong regions.js.
   */
  function rollTrainerLoot(reward, region) {
    const src = reward || {};
    const out = Object.assign({}, src);
    const items = Object.assign({}, src.items || {});
    const materials = Object.assign({}, src.materials || {});
    const bonus = {};
    const team = (region && region.trainer && region.trainer.team) || [];
    const lv = team.length ? team[0][1] : 5;
    const tier = lv >= 45 ? 3 : lv >= 25 ? 2 : lv >= 12 ? 1 : 0;

    function addItem(id, n) { items[id] = (items[id] || 0) + n; bonus[id] = true; }
    function addMat(id, n) { materials[id] = (materials[id] || 0) + n; bonus[id] = true; }

    const balls = [['pokeball', 3], ['greatball', 3], ['ultraball', 3], ['celestialball', 2]];
    const ball = balls[Math.min(3, tier + (PG.chance(0.25) ? 1 : 0))];
    addItem(ball[0], ball[1]);

    out.coins = (out.coins || 0) + 80 + tier * 180 + PG.randInt(0, 60 + tier * 120);
    out.stardust = (out.stardust || 0) + 40 + tier * 80 + PG.randInt(0, 40 + tier * 60);

    const consumables = ['potion', 'superpotion', 'hyperpotion', 'razz', 'nanab', 'goldenrazz'];
    if (PG.chance(0.8)) {
      addItem(PG.pick(consumables.slice(0, Math.min(consumables.length, 3 + tier))), 1 + (tier >= 2 ? 1 : 0));
    }
    const mats = tier >= 2 ? ['crystal', 'relic', 'stone', 'leather'] : ['stone', 'leather', 'shell', 'seed'];
    if (PG.chance(0.7)) addMat(PG.pick(mats), 2 + tier);
    // Mảnh Tinh Thể Vỡ hiếm: thắng trainer lâu lâu mới rớt (5–15,5% theo cấp vùng).
    if (PG.chance(0.05 + tier * 0.035)) addItem('crystal-shard', 1);

    if (tier >= 1 && PG.chance(0.1 + tier * 0.04)) {
      const gear = ['lucky-cap', 'explorer-boots', 'angler-hat', 'city-jacket', 'explorer-goggles'];
      out.equipment = [].concat(out.equipment || [], [{ baseId: PG.pick(gear) }]);
    }

    out.items = Object.keys(items).length ? items : null;
    out.materials = Object.keys(materials).length ? materials : null;
    return { reward: out, bonus: bonus };
  }

  /** Mòn vật phẩm cầm tay sau mỗi trận; sửa lại bằng Xu theo khấu hao. */
  function wearHeldItems(b, lines) {
    const state = PG.getState();
    const wear = Math.min(6, 2 + Math.floor((b.turn || 1) / 3));
    for (const uid of b.participants || []) {
      const p = state.pokemon.find(x => x.uid === uid);
      const item = p && PG.heldEffects(p);
      if (!item || !item.durability) continue;
      const cur = typeof p.heldDur === 'number' ? p.heldDur : item.durability;
      p.heldDur = Math.max(0, cur - wear);
      if (p.heldDur === 0 && cur > 0) lines.push(item.name + ' đã mòn hết — hãy sửa trong Hồ sơ Pokémon.');
    }
  }

  function finishBattle(b, winner, events, opts) {
    if (b.over) return;
    b.over = true;
    b.winner = winner;
    const o = opts || {};
    const state = PG.getState();
    const lines = [];
    syncAll(b);
    wearHeldItems(b, lines);

    if (winner === 'player') {
      state.stats.battlesWon = (state.stats.battlesWon || 0) + 1;
      // Tái đấu trainer/huấn luyện viên lang thang trong ngày: không quà, không XP,
      // nhưng vẫn ghi nhận chiến thắng và vẫn đánh dấu đã đấu để reset ngày hôm sau.
      const noReward = !!b.noReward;
      if (!noReward) PG.questProgress('battle_win', 1);

      // Thưởng cấu hình
      if (!noReward && b.reward) {
        const got = PG.grantReward(b.reward);
        for (const g of got) lines.push(g);
      }

      // XP cho Pokémon tham gia CHỈ khi thắng trận đấu thật sự.
      // Đánh yếu hoang dã (kể cả khi quá đà làm mục tiêu ngất) KHÔNG thưởng XP đội hình.
      if (!noReward && b.type !== 'wild' && !b.targetDown) {
        const enemyLevels = b.enemy.team.reduce((a, c) => a + c.level, 0);
        const baseXp = Math.round((30 + enemyLevels * 4) * (b.type === 'raid' ? 2 : 1));
        for (const c of b.player.team) {
          if (!c.p || !b.participants.has(c.p.uid)) continue;
          let xp = baseXp;
          if (c.heldItem === 'lucky-egg' && PG.heldEffects(c)) xp = Math.round(xp * 1.5);
          const levels = PG.addPokemonXp(c.p, xp);
          lines.push(c.name + ' +' + xp + ' XP' + (levels ? ' (Lên cấp ' + c.p.level + '!)' : ''));
        }
      }

      // Gym
      if (b.type === 'gym') {
        if (!state.badges.includes(b.regionId)) {
          state.badges.push(b.regionId);
          state.stats.gyms = state.badges.length;
          lines.push('Nhận ' + b.gym.badge + ' ' + b.gym.badgeIcon + '!');
        }
        const dd = ensureDailyDefeats(state);
        dd.gyms[b.regionId] = true;
        PG.questProgress('gym', 1);
      }
      if (b.type === 'trainer') {
        const dd = ensureDailyDefeats(state);
        if (b.roaming) dd.roaming = true;
        else if (b.zoneTrainer) {
          // Khu HLV reset theo chu kỳ 30 phút, không dùng quà 1 lần/ngày của HLV vùng.
          if (PG.ensureTrainerZone) PG.ensureTrainerZone(true);
          const tz = state.trainerZone || (state.trainerZone = { cycleKey: null, defeated: {} });
          tz.cycleKey = PG.trainerZoneCycle ? PG.trainerZoneCycle() : tz.cycleKey;
          tz.defeated[b.zoneTrainer.key] = tz.cycleKey;
          lines.push('Đã thắng ' + b.title + '. Quà khu HLV làm mới sau 30 phút.');
        } else dd.trainers[b.regionId] = true;
      }
      if (b.type === 'raid') {
        state.stats.raidsWon = (state.stats.raidsWon || 0) + 1;
        if (state.events.active && state.events.active.id === 'raid') {
          PG.addItem('celestialball', 1);
          lines.push('+1 Thiên Cầu (Giờ Raid)');
        }
        // Pokémon GO: hạ Boss xong nhận vài bóng chứa để bắt chính con Boss đó.
        const raidBalls = 3 + Math.min(3, Math.floor((b.raid && b.raid.hpMult ? b.raid.hpMult : 5) / 3));
        PG.addItem('raid-ball', raidBalls);
        lines.push('+' + raidBalls + ' Bóng Raid để bắt Boss!');
        const bossC = b.enemy.team[0];
        const caught = PG.createPokemon(bossC.speciesId, Math.max(20, bossC.level), {
          minIV: 20, source: 'raid', perfectIV: false,
          shinyBoost: 0.01, luck: PG.trainerBonuses(state).luckFx.raw
        });
        caught.hp = Math.max(1, Math.floor(PG.getStats(caught).hp * 0.25));
        b.catchEncounter = {
          pokemon: caught, regionId: b.regionId, weather: b.weather, isNight: PG.isNight(),
          throws: 0, startedAt: Date.now(), caught: false, fled: false, source: 'raid',
          legendary: !!(PG.SPECIES[caught.speciesId] && PG.SPECIES[caught.speciesId].rarity === 'legendary')
        };
        lines.push('Bạn có thể ném Bóng Raid bắt ' + caught.name + '!');
      }
      if (b.roaming) {
        state.roamingTrainer = null;
        state.roamingCooldownAt = Date.now() + PG.randInt(25, 45) * 60000;
        lines.push(noReward
          ? 'Huấn luyện viên lang thang rời đi (tái đấu hôm nay không có quà).'
          : 'Huấn luyện viên lang thang rời đi và để lại toàn bộ quà rớt!');
      }
      // Hoàn thành toàn bộ thử thách của vùng: thưởng một lần, lưu trong save.
      if (!b.roaming && !b.zoneTrainer && (b.type === 'trainer' || b.type === 'gym' || b.type === 'raid')) {
        const cleared = PG.markRegionChallenge(b.regionId, b.type);
        if (cleared) {
          lines.push('🎁 Đã vượt qua mọi thử thách tại ' + PG.REGIONS[b.regionId].name + '!');
          for (const g of cleared.lines) lines.push(g);
        }
      }
    } else {
      // Thua / hòa
      // Giải đấu đã thu phí tham gia: không phạt 5% khi thua.
      if (!o.forfeit && b.type !== 'wild' && b.type !== 'tournament') {
        const penalty = Math.min(state.player.coins, Math.round(state.player.coins * 0.05));
        if (penalty > 0) { state.player.coins -= penalty; lines.push('-' + PG.fmt(penalty) + ' Xu (thua trận)'); }
      }
      // Hồi phục đội sau thất bại
      for (const p of state.pokemon) {
        if (b.player.team.some(c => c.p && c.p.uid === p.uid)) {
          p.hp = PG.getStats(p).hp;
          p.status = null;
        }
      }
      lines.push('Đội của bạn đã được hồi phục tại Trung Tâm.');
    }

    b.rewardLines = lines;
    PG.saveState(true);
    events.push({ type: 'end', winner, lines, forfeit: !!o.forfeit, battleType: b.type });
  }

  function ensureDailyDefeats(state) {
    const today = PG.todayKey();
    if (!state.dailyDefeats || state.dailyDefeats.date !== today) {
      state.dailyDefeats = { date: today, trainers: {}, gyms: {}, roaming: false };
    }
    if (typeof state.dailyDefeats.roaming !== 'boolean') state.dailyDefeats.roaming = false;
    return state.dailyDefeats;
  }

  /* ---------------- KHỞI TẠO TRẬN ---------------- */
  function playerReadyTeam(state, limit, uids) {
    const cap = PG.clamp(Math.round(Number(limit) || 6), 1, 6);
    const mons = [];
    const push = p => { if (p && p.hp > 0 && mons.length < cap) mons.push(p); };

    // Ưu tiên các uid do người chơi chọn trước trận (trận lang thang 3/6 con).
    if (Array.isArray(uids)) for (const uid of uids) push(state.pokemon.find(p => p.uid === uid));
    if (!mons.length) for (const uid of state.team) push(state.pokemon.find(p => p.uid === uid));
    if (!mons.length) {
      // nếu đội trống, lấy tối đa 3 Pokémon còn sống trong kho
      for (const p of state.pokemon) {
        push(p);
        if (mons.length >= Math.min(3, cap)) break;
      }
    }
    return mons.slice(0, cap);
  }

  function baseBattle(type, opts) {
    const state = PG.getState();
    const team = playerReadyTeam(state, opts.playerTeamSize, opts.playerTeamUids);
    if (!team.length) return { ok: false, msg: 'Không có Pokémon nào còn HP. Hãy hồi phục đội trước!' };
    const b = {
      id: PG.uid('battle'), type,
      regionId: opts.regionId || state.region,
      weather: PG.weatherFor(state, opts.regionId || state.region),
      difficulty: opts.difficulty || 'medium',
      title: opts.title || 'Trận đấu',
      subtitle: opts.subtitle || '',
      player: { team: team.map(p => makeCombatant(p, 'player', {})), active: 0 },
      enemy: { team: opts.enemyMons.map(p => makeCombatant(p, 'enemy', {
        fullHp: opts.fullHpEnemy !== false, difficulty: opts.difficulty, luck: opts.luck, isBoss: !!opts.isBoss,
        hpMult: opts.enemyHpMult, mirrorPlayerHp: !!opts.mirrorPlayerHp
      })), active: 0 },
      turn: 1, decay: 1, log: [], over: false, winner: null, awaitingSwitch: false,
      reward: opts.reward || null, trainer: opts.trainer || null,
      gym: opts.gym || null, raid: opts.raid || null,
      isGym: type === 'gym', isRaid: type === 'raid', isRoaming: !!opts.roaming,
      trainerId: opts.trainerId || null,
      enemyHpMult: opts.enemyHpMult || 1, mirrorPlayerHp: !!opts.mirrorPlayerHp,
      playerTeamSize: team.length,
      participants: new Set(team.map(p => p.uid)),
      startedAt: Date.now()
    };
    const events = [];
    push(events, b, opts.introText || ('Trận đấu bắt đầu! ' + (opts.subtitle || '')), 'info');
    if (b.player.team[0].ability === 'intimidate') changeStage(b, b.enemy.team[0], 'atk', -1, events);
    if (b.enemy.team[0].ability === 'intimidate') changeStage(b, b.player.team[0], 'atk', -1, events);
    b.introEvents = events;
    PG.saveState(true);
    return { ok: true, battle: b, events };
  }

  /** Vật phẩm cầm tay của trainer/gym: NPC không hao mòn, chỉ buff trong trận. */
  function withHeldItems(mons, ids) {
    const list = (ids || []).filter(id => PG.HELD_ITEMS[id]);
    if (!list.length) return mons;
    return mons.map((p, i) => {
      p.heldItem = list[i % list.length];
      p.heldDur = null;
      return p;
    });
  }

  function startTrainer(regionId) {
    const state = PG.getState();
    const region = PG.REGIONS[regionId] || PG.getRegion(regionId);
    if (!PG.isRegionUnlocked(state, regionId)) return { ok: false, msg: 'Vùng này chưa mở khóa.' };
    const t = region.trainer;
    const mons = withHeldItems(
      t.team.map(([sid, lv]) => PG.createPokemon(sid, lv, { minIV: 12, source: 'trainer' })),
      t.heldItems
    );
    const dd = ensureDailyDefeats(state);
    const done = !!dd.trainers[regionId];
    // Mỗi trainer chỉ thưởng 1 lần/ngày. Tái đấu trong ngày vẫn được đấu nhưng không nhận quà.
    const rolled = done ? null : rollTrainerLoot(t.reward, region);
    const r = baseBattle('trainer', {
      regionId, difficulty: t.difficulty, enemyMons: mons, trainer: t,
      enemyHpMult: t.hpMult, mirrorPlayerHp: !!t.mirrorPlayerHp, trainerId: regionId,
      title: t.name, subtitle: region.name + ' • ' + t.title,
      reward: rolled ? rolled.reward : null,
      introText: t.name + ': “' + t.quote + '”'
    });
    if (r.ok) {
      r.battle.noReward = done;
      if (rolled) r.battle.bonusIds = rolled.bonus;
      r.battle.rewardNote = done
        ? 'Tái đấu hôm nay: không nhận quà. Quà sẽ reset vào ngày mai.'
        : 'Thắng trận đầu trong ngày: thưởng đầy đủ + quà ngẫu nhiên!';
    }
    return r;
  }

  /** Khu HLV: nhiều đối thủ nhỏ mỗi vùng, quà reset sau mỗi chu kỳ 30 phút. */
  function startZoneTrainer(regionId, index) {
    const state = PG.getState();
    if (PG.ensureTrainerZone) PG.ensureTrainerZone(true);
    const zone = PG.TRAINER_ZONE && PG.TRAINER_ZONE[regionId];
    const def = zone && zone.trainers[Number(index) || 0];
    if (!def) return { ok: false, msg: 'Không tìm thấy huấn luyện viên này.' };
    if (!PG.isRegionUnlocked(state, regionId)) return { ok: false, msg: 'Vùng này chưa mở khóa.' };
    const region = PG.getRegion(regionId);
    const mons = withHeldItems(
      def.team.map(([sid, lv]) => PG.createPokemon(sid, lv, { minIV: 12, source: 'zone-trainer' })),
      def.heldItems
    );
    const cycle = PG.trainerZoneCycle ? PG.trainerZoneCycle() : 0;
    const done = !!(state.trainerZone && state.trainerZone.defeated && state.trainerZone.defeated[def.id]);
    const rolled = done ? null : rollTrainerLoot(def.reward, { trainer: { team: def.team } });
    const r = baseBattle('trainer', {
      regionId, difficulty: def.difficulty, enemyMons: mons, trainer: def,
      enemyHpMult: def.hpMult, trainerId: def.id,
      title: def.name, subtitle: region.name + ' • ' + def.title,
      reward: rolled ? rolled.reward : null,
      introText: def.name + ': “' + def.quote + '”'
    });
    if (r.ok) {
      r.battle.zoneTrainer = { key: def.id, cycle, regionId, index: Number(index) || 0 };
      r.battle.noReward = done;
      if (rolled) r.battle.bonusIds = rolled.bonus;
      r.battle.rewardNote = done
        ? 'Đã thắng HLV này trong chu kỳ 30 phút — tái đấu không nhận quà.'
        : 'Thắng để nhận Xu, bóng, thuốc và nguyên liệu theo vùng. Quà reset sau 30 phút!';
    }
    return r;
  }

  /** Trận đấu với huấn luyện viên lang thang đang xuất hiện trên bản đồ. */
  function startRoamingTrainer(o) {
    const opts = o || {};
    const state = PG.getState();
    const rt = state.roamingTrainer;
    if (!rt || !(rt.expiresAt > Date.now())) {
      state.roamingTrainer = null;
      return { ok: false, msg: 'Không còn huấn luyện viên lang thang nào. Hãy đi dạo để gặp người mới!' };
    }
    const mons = withHeldItems(
      (rt.team || []).map(([sid, lv]) => PG.createPokemon(sid, lv, { minIV: 14, source: 'roaming' })),
      rt.heldItems
    );
    if (!mons.length) return { ok: false, msg: 'Đối thủ chưa có đội hình.' };
    const size = PG.clamp(rt.teamSize || mons.length || 3, 1, 6);
    const dd = ensureDailyDefeats(state);
    const done = !!dd.roaming;
    const rolled = done ? null : rollTrainerLoot(rt.reward, { trainer: rt });
    const r = baseBattle('trainer', {
      regionId: rt.regionId, difficulty: rt.difficulty, enemyMons: mons, trainer: rt,
      playerTeamSize: size, playerTeamUids: opts.uids || null,
      enemyHpMult: rt.hpMult, mirrorPlayerHp: !!rt.mirrorPlayerHp,
      trainerId: rt.templateId || rt.id, roaming: true,
      title: rt.name, subtitle: (rt.avatar || '🧑‍🎤') + ' • ' + rt.title,
      reward: rolled ? rolled.reward : null,
      introText: rt.name + ': “' + rt.quote + '”'
    });
    if (r.ok) {
      r.battle.roaming = true;
      r.battle.noReward = done;
      if (rolled) r.battle.bonusIds = rolled.bonus;
      r.battle.rewardNote = done
        ? 'Đã thắng huấn luyện viên lang thang hôm nay — tái đấu không có quà.'
        : 'Thắng trận để nhận bóng, túi trị thương, trang bị, vàng và đôi khi Mảnh Tinh Thể Vỡ!';
    }
    return r;
  }

  function startGym(regionId) {
    const state = PG.getState();
    const region = PG.REGIONS[regionId] || PG.getRegion(regionId);
    if (!PG.isRegionUnlocked(state, regionId)) return { ok: false, msg: 'Vùng này chưa mở khóa.' };
    const g = region.gym;
    const mons = withHeldItems(
      g.team.map(([sid, lv]) => PG.createPokemon(sid, lv, { minIV: 18, source: 'gym' })),
      g.heldItems
    );
    const hasBadge = state.badges.includes(regionId);
    const reward = hasBadge ? scaleReward(g.reward, 0.35) : g.reward;
    const r = baseBattle('gym', {
      regionId, difficulty: g.difficulty, enemyMons: mons, gym: g,
      enemyHpMult: g.hpMult, mirrorPlayerHp: !!g.mirrorPlayerHp, trainerId: regionId,
      title: 'Gym ' + region.name, subtitle: g.leader + ' • ' + g.title,
      reward,
      introText: g.leader + ': “' + g.quote + '”'
    });
    if (r.ok) {
      r.battle.rewardNote = hasBadge ? 'Bạn đã có ' + g.badge + '. Thưởng huấn luyện 35%.' : 'Phần thưởng lần đầu: ' + g.badge + ' ' + g.badgeIcon + '!';
    }
    return r;
  }

  function startRaid(regionId) {
    const state = PG.getState();
    const region = PG.REGIONS[regionId] || PG.getRegion(regionId);
    if (!PG.isRegionUnlocked(state, regionId)) return { ok: false, msg: 'Vùng này chưa mở khóa.' };
    if ((state.bag['raid-pass'] || 0) < 1) return { ok: false, msg: 'Cần 1 Vé Raid. Chế tạo từ Than Hồng + Vỏ Sò.' };
    PG.removeItem('raid-pass', 1);
    const rd = region.raid;
    const boss = PG.createPokemon(rd.boss, rd.level, { perfectIV: true, source: 'raid', forceShiny: false });
    const r = baseBattle('raid', {
      regionId, difficulty: 'boss', enemyMons: [boss], raid: rd,
      title: rd.name, subtitle: 'Raid Boss • ' + region.name,
      reward: rd.reward, isBoss: true, luck: DIFFICULTY.boss.luck,
      introText: 'Boss Raid ' + rd.name + ' xuất hiện!'
    });
    if (!r.ok) { PG.addItem('raid-pass', 1); return r; }
    const bc = r.battle.enemy.team[0];
    bc.maxHp = Math.floor(bc.maxHp * (rd.hpMult || 5));
    bc.hp = bc.maxHp;
    bc.stats.hp = bc.maxHp;
    bc.isBoss = true;
    r.battle.rewardNote = 'Boss có ' + PG.fmt(bc.maxHp) + ' HP. Hạ gục để nhận thưởng và vài Bóng Raid bắt Boss!';
    return r;
  }

  /** Trận đấu của Giải Đấu — đối thủ do PG.Tournament tạo sẵn. */
  function startTournament(o) {
    const state = PG.getState();
    const opts = o || {};
    const team = (opts.team || []).map(([sid, lv]) => PG.createPokemon(sid, lv, {
      minIV: opts.minIV || 12, source: 'tournament'
    }));
    if (!team.length) return { ok: false, msg: 'Đối thủ giải đấu không có đội hình.' };
    const r = baseBattle('tournament', {
      regionId: state.region, difficulty: opts.difficulty || 'medium',
      enemyHpMult: opts.hpMult || 1,
      enemyMons: team, title: opts.title || 'Giải Đấu Đấu Trường',
      subtitle: (opts.roundName || '') + (opts.avatar ? ' • ' + opts.avatar + ' ' + opts.name : ''),
      reward: opts.reward || null, introText: opts.introText || ''
    });
    if (r.ok) {
      r.battle.tournament = { runUid: opts.runUid, roundIndex: opts.roundIndex || 0 };
      r.battle.rewardNote = 'Thắng vòng này để nhận thưởng và tiến tiếp. Thua sẽ bị loại khỏi giải.';
    }
    return r;
  }

  /** Trận đánh yếu Pokémon hoang dã: kế thừa HP hiện tại, có thể quá đà làm mục tiêu ngất. */
  function startWild(encounter) {
    if (!encounter || !encounter.pokemon || !PG.SPECIES[encounter.pokemon.speciesId]) {
      return { ok: false, msg: 'Không có Pokémon hoang dã để đánh.' };
    }
    const p = encounter.pokemon;
    if (!(p.hp > 1)) return { ok: false, msg: 'Pokémon đã quá yếu, hãy ném bóng ngay!' };
    const sp = PG.SPECIES[p.speciesId];
    const r = baseBattle('wild', {
      regionId: encounter.regionId, difficulty: 'easy', enemyMons: [p], fullHpEnemy: false,
      title: 'Đánh yếu ' + sp.name,
      subtitle: 'Làm yếu để tăng tỉ lệ bắt • Cẩn thận: quá đà sẽ làm nó ngất và mất cơ hội bắt',
      introText: 'Bạn tung đội vào trận để làm yếu ' + sp.name + ' trước khi ném bóng — đừng đánh quá tay!'
    });
    if (r.ok) {
      r.battle.wildEncounter = encounter;
      r.battle.rewardNote = 'Đánh tới khi HP thấp rồi bấm “Bắt ngay” để quay lại ném bóng.';
    }
    return r;
  }

  /** Kết thúc trận đánh yếu, đồng bộ HP/trạng thái về encounter để quay lại màn hình bắt. */
  function finishWild(b) {
    if (!b || b.type !== 'wild') return { ok: false, msg: 'Không có trận đánh yếu nào đang diễn ra.' };
    if (b.targetDown || !(b.enemy && b.enemy.team[0] && b.enemy.team[0].hp > 0)) {
      return { ok: false, msg: 'Mục tiêu đã ngất do quá đà — không thể bắt. Hãy tìm con khác!' };
    }
    b.over = true;
    b.winner = 'player';
    const lines = [];
    syncAll(b);
    wearHeldItems(b, lines);
    PG.saveState(true);
    return { ok: true, battle: b, lines };
  }

  /* ---------------- TIỆN ÍCH ---------------- */
  /* Hồi cả đội: cần tiêu hao bình hồi phục.
     - 1 Bình Hồi Phục Nhanh (teampotion) hồi toàn đội.
     - Hoặc Potion cho từng Pokémon cần hồi.
     Trả về object để UI báo rõ lý do khi không đủ bình. */
  function healTeam(opts) {
    const o = opts || {};
    const state = PG.getState();
    const wounded = (state.pokemon || []).filter(p => p && (p.hp < PG.getStats(p).hp || p.status));
    if (!wounded.length) return { ok: true, count: 0, used: null, qty: 0, msg: 'Đội đã khỏe mạnh, không cần dùng bình.' };

    let used = null, qty = 0;
    if (!o.free) {
      const hasQuick = (state.bag.teampotion || 0) > 0;
      const potions = state.bag.potion || 0;
      if (o.consume === 'teampotion' || (hasQuick && !o.consume)) {
        used = 'teampotion'; qty = 1;
      } else if (o.consume === 'potion' || (!o.consume && potions >= wounded.length)) {
        used = 'potion'; qty = wounded.length;
      } else {
        return {
          ok: false, count: 0, used: null, qty: 0,
          msg: 'Cần ' + wounded.length + ' Potion hoặc 1 Bình Hồi Phục Nhanh để hồi cả đội (đang có ' +
            potions + ' Potion' + (hasQuick ? ' + 1 bình nhanh' : '') + ').'
        };
      }
    }
    for (const p of wounded) {
      p.hp = PG.getStats(p).hp;
      p.status = null;
      p.statusTurns = 0;
      if (p.pp) for (const mid of Object.keys(p.pp)) p.pp[mid] = PG.maxPp(mid, 1);
    }
    if (used) PG.removeItem(used, qty);

    // Trận cũ (đang hiện kết quả) giữ bản sao HP cũ: xóa nó để lần vào đấu
    // trường tiếp theo tạo trận mới từ HP vừa hồi trên bản đồ.
    if (PG.ui && PG.ui.flow && PG.ui.flow.battle) {
      PG.ui.flow.battle = null;
      if (PG.ui.closeModal) PG.ui.closeModal();
    }
    PG.saveState(true);
    const name = used ? (PG.itemInfo(used).name || used) : '';
    return {
      ok: true, count: wounded.length, used, qty,
      msg: 'Đã hồi phục ' + wounded.length + ' Pokémon' + (name ? ' bằng ' + name + ' ×' + qty : '') + '!'
    };
  }

  function availableTrainer(regionId) {
    const state = PG.getState();
    const dd = ensureDailyDefeats(state);
    return !dd.trainers[regionId];
  }
  function hasBadge(regionId) {
    return PG.getState().badges.includes(regionId);
  }

  PG.STATUS_INFO = STATUS_INFO;
  PG.DIFFICULTY = DIFFICULTY;
  PG.Battle = {
    STATUS_INFO, DIFFICULTY,
    startTrainer, startZoneTrainer, startRoamingTrainer, startGym, startRaid, startTournament, startWild, finishWild,
    takeTurn, doSwitch, doItem, aiChooseAction, decideOrder,
    finishBattle, healTeam, availableTrainer, hasBadge,
    scaleReward, rollTrainerLoot, makeCombatant, syncAll,
    decayBattleLuck, LUCK_DECAY_PER_TURN, statusImmunity
  };
})();
