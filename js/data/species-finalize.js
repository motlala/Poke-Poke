/* ============================================================
   HOÀN THIỆN DỮ LIỆU LOÀI: CHUỖI TIẾN HÓA, TỈ LỆ, ĐẶC TÍNH
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const S = PG.SPECIES;
  const ids = Object.keys(S);

  // Bản đồ tiến hóa ngược
  const prevo = {};
  for (const id of ids) {
    const sp = S[id];
    if (!sp.evo) continue;
    const branches = Array.isArray(sp.evo[0]) ? sp.evo : [sp.evo];
    for (const e of branches) {
      if (!prevo[e[0]]) prevo[e[0]] = id;
    }
  }

  function rootOf(id) {
    let cur = id, guard = 0;
    while (prevo[cur] && guard++ < 10) cur = prevo[cur];
    return cur;
  }

  /* Chênh chỉ số theo độ hiếm: tăng nhẹ để các hạng cảm nhận rõ hơn mà không lấn át hệ/chiêu.
     Thần thoại là cờ đi kèm, nên chỉ áp dụng khi hạng đó chưa cao hơn. */
  const RARITY_STAT_MULT = { common: 1, rare: 1.08, mythical: 1.14, legendary: 1.2 };

  for (const id of ids) {
    const sp = S[id];
    sp.family = rootOf(id);
    sp.isFinal = !sp.evo;
    sp.stage = 1;
    let p = prevo[id], g = 0;
    while (p && g++ < 10) { sp.stage++; p = prevo[p]; }

    // Giữ bản gốc để tra cứu/kiểm tra; bst và mọi chỉ số phía sau dùng bản đã nhân.
    sp.baseRaw = sp.base.slice();
    let mult = RARITY_STAT_MULT[sp.rarity] || RARITY_STAT_MULT.common;
    if (sp.mythical && mult < RARITY_STAT_MULT.mythical) mult = RARITY_STAT_MULT.mythical;
    sp.statRarityMult = mult;
    if (mult !== 1) sp.base = sp.base.map(v => Math.max(1, Math.round(v * mult)));

    const bst = sp.base.reduce((a, b) => a + b, 0);
    const rarityBase = { common: 0.78, rare: 0.52, legendary: 0.2 }[sp.rarity] || 0.55;
    const bstPenalty = Math.max(0, bst - 330) * 0.0003;
    if (sp.catchRate === undefined) {
      sp.catchRate = PG.clamp(rarityBase - bstPenalty, sp.rarity === 'legendary' ? 0.08 : 0.16, 0.92);
    }
    if (sp.fleeRate === undefined) {
      sp.fleeRate = PG.clamp(({ common: 0.055, rare: 0.1, legendary: 0.16 }[sp.rarity] || 0.08) + bst * 0.00012, 0.02, 0.32);
    }
    if (!sp.ultLevel) sp.ultLevel = sp.rarity === 'legendary' ? 35 : (sp.isFinal ? 45 : 50);
    if (!sp.genderRatio) sp.genderRatio = 0.5;

    // Đặc tính: 2 thường + 1 ẩn
    const pool = [];
    for (const t of sp.types) {
      for (const a of (PG.TYPE_ABILITIES[t] || [])) if (!pool.includes(a)) pool.push(a);
    }
    while (pool.length < 3) pool.push('serene-grace');
    // Hệ Lỗi luôn có đặc tính đặc trưng trong 3 slot, dù đứng sau hệ còn lại.
    if (sp.types.includes('glitch') && PG.ABILITIES['glitch-shift']) {
      const idx = pool.indexOf('glitch-shift');
      if (idx < 0) pool.splice(2, 0, 'glitch-shift');
      else if (idx > 2) { pool.splice(idx, 1); pool.splice(2, 0, 'glitch-shift'); }
    }
    sp.abilities = [pool[0], pool[1]];
    sp.hiddenAbility = pool[2];

    if (sp.rarity === 'legendary') sp.canElemental = false;

    // Kích thước cơ bản
    if (!sp.size) sp.size = sp.rarity === 'legendary' ? 'large' : (bst < 260 ? 'small' : 'medium');
    const sizeMul = { small: 0.7, medium: 1, large: 1.45 }[sp.size] || 1;
    sp.heightBase = +((0.4 + bst / 380) * sizeMul).toFixed(2);
    sp.weightBase = +((2 + bst / 18) * sizeMul * sizeMul).toFixed(1);

    // Trọng số spawn
    sp.spawnWeight = sp.rarity === 'legendary' ? 1.1 : sp.rarity === 'rare' ? 20 : 100;
    if (sp.isFinal) sp.spawnWeight *= 0.55;

    // Mô tả
    if (!sp.desc) {
      const tn = sp.types.map(t => PG.TYPES[t].name).join(' / ');
      const flavor = {
        common: 'Loài phổ biến, dễ gặp khi đi dạo.',
        rare: 'Loài quý hiếm, chỉ xuất hiện trong những điều kiện đặc biệt.',
        legendary: 'Loài huyền thoại với sức mạnh phi thường.'
      }[sp.rarity];
      sp.desc = sp.name + ' — Pokémon hệ ' + tn + '. ' + flavor;
    }
  }

  PG.RARITY_STAT_MULT = RARITY_STAT_MULT;
  PG.DEX_ORDER = ids.slice().sort((a, b) => S[a].dex - S[b].dex);
  PG.getSpecies = id => S[id] || null;
  PG.speciesByType = type => ids.filter(id => S[id].types.includes(type));
  PG.speciesByHabitat = habitat => ids.filter(id => S[id].habitats.includes(habitat));

  // Kiểm tra dữ liệu
  PG.validateSpecies = function () {
    const errors = [];
    for (const id of ids) {
      const sp = S[id];
      if (!sp.types.length || sp.types.length > 2) errors.push(id + ': số hệ không hợp lệ');
      if (sp.types.some(t => PG.TYPE_SPECIAL[t] && PG.TYPE_SPECIAL[t].singleTypeOnly) && sp.types.length > 1) {
        errors.push(id + ': hệ đơn đặc biệt không được ghép kép');
      }
      if (sp.types.some(t => !PG.TYPES[t])) errors.push(id + ': hệ không tồn tại');
      if (!sp.habitats.length) errors.push(id + ': thiếu vùng sống');
    }
    return errors;
  };
})();
