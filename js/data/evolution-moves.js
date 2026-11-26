/* ============================================================
   CHIÊU MỚI KHI TIẾN HÓA
   - Mọi loài đích của một nhánh tiến hóa mà chưa có chiêu riêng
     sẽ nhận một chiêu mang tên chính nó, hệ theo loại, hiệu ứng
     theo hệ và sức mạnh theo chỉ số nền.
   - Dùng PG.EVOLUTION_MOVES_BY_SPECIES nên syncSpeciesMoves() tự
     dạy chiêu ngay sau khi tiến hóa (kể cả save cũ).
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const S = PG.SPECIATURE_BY_SPECIES || (PG.SPECIATURE_BY_SPECIES = {});
  const E = PG.EVOLUTION_MOVES_BY_SPECIES || (PG.EVOLUTION_MOVES_BY_SPECIES = {});

  const SUFFIX = {
    normal:  ['Chưởng Thuần', 'Vòng Sao', 'Áp Đảo'],
    fire:    ['Hỏa Phấn', 'Ngọn Lửa Mới', 'Lửa Thức Tỉnh'],
    water:   ['Triều Mới', 'Sóng Cuộn', 'Nước Xoáy'],
    electric:['Sét Bừng', 'Điện Giật', 'Tia Chớp'],
    grass:   ['Mộc Phấn', 'Rừng Trỗi', 'Lá Xanimate'],
    ice:     ['Băng Phấn', 'Sương Giá', 'Kỷ Băng'],
    fighting:['Quyền Mới', 'Cú Đấm Chí Mạng', 'Vạn Quyền'],
    poison:  ['Độc Phấn', 'Hơi Độc', 'Tử Hà'],
    ground:  ['Địa Chấn', 'Cát Bốc', 'Lòng Đất'],
    flying:  ['Phong Vũ', 'Cánh Gió', 'Bay Cao'],
    psychic: ['Tâm Chưởng', 'Tâm Linh', 'Ý Chí'],
    bug:     ['Bầy Bọ', 'Vỏ Mới', 'Côn Trùng'],
    rock:    ['Thạch Chưởng', 'Đá Rơi', 'Vách Đá'],
    ghost:   ['Hồn Ưu', 'Bóng Ma', 'U Linh'],
    dragon:  ['Long Vũ', 'Rồng Trỗi', 'Hơi Rồng'],
    dark:    ['Ám Ảnh', 'Bóng Đêm', 'Hắc Phác'],
    steel:   ['Thép Chưởng', 'Kim Loại', 'Giáp Mới'],
    fairy:   ['Tiên Phấn', 'Ánh Trăng', 'Nguyệt Hoa'],
    neutral: ['Khởi Nguyên', 'Cân Bằng', 'Vô Cực'],
    celestial:['Thiên Quang', 'Thần Phạt', 'Ánh Thiên'],
    quantum: ['Lượng Tử', 'Sụp Đổ', 'Xoắn Lượng Tử'],
    glitch:  ['Lỗi Hệ Thống', 'Ghi Đè', 'Đoạn Mạch']
  };

  const EFFECT = {
    normal:   { flags: { sureHit: true, noDodge: true } },
    fire:     { status: { id: 'burn', chance: 30 } },
    water:    { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 30 } },
    electric: { status: { id: 'paralysis', chance: 25 } },
    grass:    { drain: 0.4 },
    ice:      { status: { id: 'freeze', chance: 20 } },
    fighting: { stat: { target: 'self', stat: 'atk', stages: 1, chance: 40 } },
    poison:   { status: { id: 'toxic', chance: 30 } },
    ground:   { stat: { target: 'foe', stat: 'accuracy', stages: -1, chance: 40 } },
    flying:   { flinch: 30 },
    psychic:  { status: { id: 'confusion', chance: 25 } },
    bug:      { multihit: [2, 2] },
    rock:     { flinch: 30 },
    ghost:    { drain: 0.45 },
    dragon:   { status: { id: 'burn', chance: 25 } },
    dark:     { status: { id: 'fear', chance: 25 } },
    steel:    { stat: { target: 'self', stat: 'def', stages: 1, chance: 40 } },
    fairy:    { heal: 0.25 },
    neutral:  { flags: { sureHit: true, noDodge: true } },
    celestial:{ heal: 0.3 },
    quantum:  { status: { id: 'confusion', chance: 40 } },
    glitch:   { status: { id: 'confusion', chance: 40 } }
  };

  function slug(id) {
    return String(id).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function hasNamedMove(id) {
    return (S[id] || []).some(m => m && !/^(ult_|combo_)/.test(m));
  }

  /** Một loài có thể là đích của nhiều nhánh: chỉ cần tạo chiêu một lần. */
  const targets = new Set();
  for (const id of (PG.DEX_ORDER || [])) {
    const sp = PG.SPECIES[id];
    if (!sp || !sp.evo) continue;
    const branches = Array.isArray(sp.evo[0]) ? sp.evo : [sp.evo];
    for (const branch of branches) {
      const next = branch && branch[0];
      if (next && PG.SPECIES[next]) targets.add(next);
    }
  }

  let created = 0;
  for (const id of targets) {
    if (E[id] && E[id].length || hasNamedMove(id)) continue;
    const sp = PG.SPECIES[id];
    const type = (sp.types || [])[0] || 'normal';
    const pool = SUFFIX[type] || SUFFIX.normal;
    const suffix = pool[(Number(sp.dex) || 0) % pool.length];
    const base = sp.base || [80, 80, 80, 80, 80, 80];
    const atk = Number(base[1]) || 80;
    const spa = Number(base[3]) || 80;
    const category = (atk >= spa) ? 'physical' : 'special';
    const total = base.slice(0, 6).reduce((a, n) => a + (Number(n) || 0), 0);
    const multihit = !!(EFFECT[type] || {}).multihit;
    const power = Math.max(70, Math.min(125,
      Math.round((90 + (total - 400) / 12) * (multihit ? 0.6 : 1))));
    const extra = Object.assign({}, EFFECT[type] || {});
    const flags = Object.assign({ evolution: true }, extra.flags || {});
    delete extra.flags;
    const moveId = 'evo_' + sp.dex + '_' + slug(id);
    if (PG.MOVES[moveId]) continue;

    PG.MOVES[moveId] = {
      id: moveId,
      name: sp.name + ' · ' + suffix,
      type, category, power, accuracy: 95, pp: 8,
      priority: 0, critBoost: category === 'physical' ? 0 : 0,
      flags,
      effect: Object.keys(extra).length ? extra : null,
      desc: 'Chiêu mới mở khóa khi ' + sp.name + ' tiến hóa.',
      signature: true
    };
    E[id] = [moveId];
    created++;
  }

  PG.EVOLUTION_MOVE_COUNT = created;
})();
