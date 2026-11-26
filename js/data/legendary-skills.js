/* ============================================================
   TUYỆT KỸ RIÊNG CHO HUYỀN THOẠI / THẦN THOẠI
   Mỗi loài huyền thoại chưa có chiêu có tên riêng sẽ nhận một chiêu
   mang tên và id riêng, hiệu ứng theo hệ. Dùng dữ liệu có sẵn nên
   không cần sửa tay hàng trăm loài.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};
  const S = PG.SPECIATURE_BY_SPECIES || (PG.SPECIATURE_BY_SPECIES = {});

  const SUFFIX = {
    normal: 'Chưởng Thuần', fire: 'Hỏa Thần', water: 'Triều Thần',
    electric: 'Sét Thần', grass: 'Mộc Thần', ice: 'Băng Thần',
    fighting: 'Quyền Thần', poison: 'Độc Thần', ground: 'Địa Thần',
    flying: 'Phong Thần', psychic: 'Tâm Thần', bug: 'Bầy Thần',
    rock: 'Thạch Thần', ghost: 'Hồn Thần', dragon: 'Long Thần',
    dark: 'Ám Thần', steel: 'Thép Thần', fairy: 'Tiên Thần',
    neutral: 'Khởi Nguyên', celestial: 'Thiên Thần', quantum: 'Lượng Tử',
    glitch: 'Lỗi Thực Tại'
  };

  const EFFECT = {
    fire: { status: { id: 'burn', chance: 30 } },
    water: { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 30 } },
    electric: { status: { id: 'paralysis', chance: 25 } },
    grass: { drain: 0.4 },
    ice: { status: { id: 'freeze', chance: 20 } },
    fighting: { stat: { target: 'self', stat: 'atk', stages: 1, chance: 40 } },
    poison: { status: { id: 'toxic', chance: 30 } },
    ground: { stat: { target: 'foe', stat: 'accuracy', stages: -1, chance: 40 } },
    flying: { flinch: 30 },
    psychic: { status: { id: 'confusion', chance: 30 } },
    bug: { drain: 0.35 },
    rock: { flinch: 30 },
    ghost: { drain: 0.5 },
    dragon: { status: { id: 'burn', chance: 25 } },
    dark: { status: { id: 'fear', chance: 25 } },
    steel: { stat: { target: 'self', stat: 'def', stages: 1, chance: 40 } },
    fairy: { heal: 0.25 },
    neutral: { flags: { sureHit: true, noDodge: true } },
    celestial: { heal: 0.3 },
    quantum: { status: { id: 'confusion', chance: 40 } },
    glitch: { status: { id: 'confusion', chance: 40 } }
  };

  function slug(id) {
    return String(id).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  function hasNamedMove(list) {
    return (list || []).some(m => m && !/^(ult_|combo_)/.test(m));
  }

  let created = 0;
  const bySpecies = {};
  for (const id of (PG.DEX_ORDER || [])) {
    const sp = PG.SPECIES[id];
    if (!sp || !(sp.rarity === 'legendary' || sp.mythical)) continue;
    const current = (S[id] || []).slice();
    if (hasNamedMove(current)) continue;
    const type = sp.types[0] || 'normal';
    if (!PG.TYPES[type]) continue;
    const moveId = 'leg_' + slug(id);
    if (PG.MOVES[moveId]) { S[id] = current.concat([moveId]); continue; }
    const ult = PG.MOVES['ult_' + type] || {};
    const extra = Object.assign({}, EFFECT[type] || {});
    const flagEffect = extra.flags;
    delete extra.flags;
    PG.MOVES[moveId] = {
      id: moveId,
      name: sp.name + ' · ' + (SUFFIX[type] || 'Tuyệt Kỹ'),
      type,
      category: ult.category || 'special',
      power: sp.mythical ? 110 : 115,
      accuracy: 95,
      pp: 6,
      priority: 0,
      critBoost: type === 'fighting' || type === 'dark' || type === 'bug' ? 1 : 0,
      flags: Object.assign({ signature: true }, flagEffect || {}),
      effect: Object.keys(extra).length ? extra : null,
      signature: true,
      desc: 'Tuyệt Kỹ riêng của ' + sp.name + ' — sức mạnh hệ ' + (PG.TYPES[type].name || type) + '.'
    };
    S[id] = current.concat([moveId]);
    bySpecies[id] = moveId;
    created++;
  }

  PG.LEGENDARY_SKILLS = { count: created, bySpecies };
})();
