/* ============================================================
   DỮ LIỆU HỆ POKÉMON — 22 HỆ
   Muốn thêm hệ: thêm vào TYPES + OFFENSE_CHART + (tuỳ chọn) CELESTIAL
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const TYPES = {
    normal:    { id: 'normal',    name: 'Thường',     color: '#A8A77A', dark: '#6b6a4a', icon: '⚪', desc: 'Cân bằng, ổn định, miễn nhiễm đòn Ma.' },
    fire:      { id: 'fire',      name: 'Lửa',        color: '#F08030', dark: '#8f3d0c', icon: '🔥', desc: 'Thiêu đốt mãnh liệt, khắc Cỏ / Băng / Bọ / Thép.' },
    water:     { id: 'water',     name: 'Nước',       color: '#4A90D9', dark: '#1d4d80', icon: '💧', desc: 'Uyển chuyển, khắc Lửa / Đất / Đá.' },
    electric:  { id: 'electric',  name: 'Điện',       color: '#F7D02C', dark: '#7a6000', icon: '⚡', desc: 'Tốc độ ánh sáng, khắc Nước / Bay.' },
    grass:     { id: 'grass',     name: 'Cỏ',         color: '#5FBF5F', dark: '#2c6e2c', icon: '🌿', desc: 'Sinh trưởng, hút máu, khắc Nước / Đất / Đá.' },
    ice:       { id: 'ice',       name: 'Băng',       color: '#7AD7D7', dark: '#357c7c', icon: '❄️', desc: 'Đóng băng đối thủ, khắc Cỏ / Đất / Bay / Rồng.' },
    fighting:  { id: 'fighting',  name: 'Giác đấu',   color: '#C03028', dark: '#6d1611', icon: '🥊', desc: 'Sức mạnh thuần túy, khắc Thường / Băng / Đá / Bóng tối / Thép.' },
    poison:    { id: 'poison',    name: 'Độc',        color: '#A040A0', dark: '#5a1d5a', icon: '☠️', desc: 'Bào mòn theo thời gian, khắc Cỏ / Tiên.' },
    ground:    { id: 'ground',    name: 'Đất',        color: '#C9A227', dark: '#74600f', icon: '⛰️', desc: 'Miễn nhiễm Điện, khắc Lửa / Điện / Độc / Đá / Thép.' },
    flying:    { id: 'flying',    name: 'Bay',        color: '#9FA8F0', dark: '#4e589c', icon: '🕊️', desc: 'Tự do trên cao, khắc Cỏ / Giác đấu / Bọ.' },
    psychic:   { id: 'psychic',   name: 'Siêu linh',  color: '#E060A8', dark: '#8c2a5f', icon: '🔮', desc: 'Năng lực tâm trí, khắc Giác đấu / Độc.' },
    bug:       { id: 'bug',       name: 'Bọ',         color: '#A8B820', dark: '#5c660c', icon: '🐛', desc: 'Số đông và nhanh nhẹn, khắc Cỏ / Siêu linh / Bóng tối.' },
    rock:      { id: 'rock',      name: 'Đá',         color: '#B8A038', dark: '#6b5b16', icon: '🪨', desc: 'Phòng thủ kiên cố, khắc Lửa / Băng / Bay / Bọ.' },
    ghost:     { id: 'ghost',     name: 'Ma',         color: '#705898', dark: '#3c2d57', icon: '👻', desc: 'Bí ẩn, khắc Siêu linh / Ma, miễn nhiễm Thường.' },
    dragon:    { id: 'dragon',    name: 'Rồng',       color: '#7038F8', dark: '#3b1a8c', icon: '🐉', desc: 'Sức mạnh huyền thoại, khắc Rồng.' },
    dark:      { id: 'dark',      name: 'Bóng tối',   color: '#5A5366', dark: '#2d2835', icon: '🌑', desc: 'Tàn nhẫn, khắc Siêu linh / Ma.' },
    steel:     { id: 'steel',     name: 'Thép',       color: '#B8B8D0', dark: '#67677c', icon: '⚙️', desc: 'Phòng thủ tuyệt đối, khắc Băng / Đá / Tiên.' },
    fairy:     { id: 'fairy',     name: 'Tiên',       color: '#EE99AC', dark: '#9c4d61', icon: '✨', desc: 'Phép thuật thuần khiết, khắc Giác đấu / Rồng / Bóng tối.' },
    neutral:   { id: 'neutral',   name: 'Vô Hệ',      color: '#C7C7D9', dark: '#5e5e70', icon: '⚖️', desc: 'Cân bằng tuyệt đối: mọi đòn vào và ra đều x1. Chỉ tồn tại đơn hệ.' },
    celestial: { id: 'celestial', name: 'Thiên',      color: '#FFD86B', dark: '#7a5c00', icon: '🌟', desc: 'Siêu hiếm: khắc x2 mọi hệ trừ Vô Hệ và Thiên. Bị đánh có thể kích hoạt THIÊN KHẮC.' },
    quantum:   { id: 'quantum',   name: 'Lượng Tử',   color: '#7DF9FF', dark: '#1d7f86', icon: '⚛️', desc: 'Hệ dự phòng. Hiện tại đánh và bị đánh đều x1, chịu x2 từ Thiên.' },
    glitch:    { id: 'glitch',    name: 'Lỗi',        color: '#FF4FD8', dark: '#8c1d73', icon: '👾', desc: 'Hệ đơn bất ổn: đánh và bị đánh đều x1. Sau mỗi lượt, đổi sang một hệ khác và dùng chiêu/đặc tính của hệ đó.' }
  };

  const TYPE_ORDER = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy','neutral','celestial','quantum','glitch'];

  /* Bảng khắc chế khi TẤN CÔNG (mặc định x1) */
  const OFFENSE = {
    normal:   { rock: .5, steel: .5, ghost: 0 },
    fire:     { grass: 2, ice: 2, bug: 2, steel: 2, fire: .5, water: .5, rock: .5, dragon: .5 },
    water:    { fire: 2, ground: 2, rock: 2, water: .5, grass: .5, dragon: .5 },
    electric: { water: 2, flying: 2, electric: .5, grass: .5, dragon: .5, ground: 0 },
    grass:    { water: 2, ground: 2, rock: 2, fire: .5, grass: .5, poison: .5, flying: .5, bug: .5, dragon: .5, steel: .5 },
    ice:      { grass: 2, ground: 2, flying: 2, dragon: 2, fire: .5, water: .5, ice: .5, steel: .5 },
    fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: .5, flying: .5, psychic: .5, bug: .5, fairy: .5, ghost: 0 },
    poison:   { grass: 2, fairy: 2, poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0 },
    ground:   { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: .5, bug: .5, flying: 0 },
    flying:   { grass: 2, fighting: 2, bug: 2, electric: .5, rock: .5, steel: .5 },
    psychic:  { fighting: 2, poison: 2, psychic: .5, steel: .5, dark: 0 },
    bug:      { grass: 2, psychic: 2, dark: 2, fire: .5, fighting: .5, poison: .5, flying: .5, ghost: .5, steel: .5, fairy: .5 },
    rock:     { fire: 2, ice: 2, flying: 2, bug: 2, fighting: .5, ground: .5, steel: .5 },
    ghost:    { psychic: 2, ghost: 2, dark: .5, normal: 0 },
    dragon:   { dragon: 2, steel: .5, fairy: 0 },
    dark:     { psychic: 2, ghost: 2, fighting: .5, dark: .5, fairy: .5 },
    steel:    { ice: 2, rock: 2, fairy: 2, fire: .5, water: .5, electric: .5, steel: .5 },
    fairy:    { fighting: 2, dragon: 2, dark: 2, fire: .5, poison: .5, steel: .5 },
    neutral:  {},
    celestial:{},
    quantum:  {},
    glitch:   {} // Lỗi không có khắc chế cố định — hệ thay đổi sau mỗi lượt.
  };

  /* Cấu hình hệ đặc biệt */
  const SPECIAL = {
    neutral: {
      immuneToAll: true, // mọi đòn vào/ra x1
      singleTypeOnly: true
    },
    celestial: {
      attackAllExcept: ['neutral', 'celestial'], // x2 mọi hệ khác
      attackMultiplier: 2,
      singleTypeOnly: true,
      // THIÊN KHẮC khi bị đánh
      fractureBase: 0.08,
      fracturePerLuck: 0.0035,
      fractureMax: 0.5,
      fractureX3Base: 0.25,
      fractureX3Max: 0.45,
      fractureX3PerLuck: 0.0015,
      ballRequirement: ['ultra', 'celestial-ball', 'master']
    },
    quantum: {
      enabled: false, // bật khi có dữ liệu
      unstableMin: 0.5,
      unstableMax: 2
    },
    glitch: {
      enabled: true,
      singleTypeOnly: true, // Lỗi là hệ đơn, không ghép với hệ khác.
      shiftAfterMove: true,
      inheritTypeKit: true, // Khi đổi hệ, dùng chiêu + đặc tính + thiên hướng chỉ số của hệ mới.
      // Không gồm hệ đặc biệt để tránh lệch luồng Thiên / Vô Hệ / Lượng Tử.
      shiftPool: ['normal','fire','water','electric','grass','ice','fighting','poison',
        'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'],
      // Chỉ số được ưu tiên theo hệ sau khi biến đổi (+1 bậc, không cộng dồn).
      statBias: {
        normal: 'atk', fire: 'spa', water: 'spd', electric: 'spe', grass: 'spd', ice: 'spa',
        fighting: 'atk', poison: 'def', ground: 'atk', flying: 'spe', psychic: 'spa', bug: 'spe',
        rock: 'def', ghost: 'spa', dragon: 'spa', dark: 'atk', steel: 'def', fairy: 'spa'
      }
    }
  };

  /** Hệ số khắc chế cơ bản (chưa xử lý Thiên Khắc ngẫu nhiên). */
  function getMultiplier(attackType, defenderTypes) {
    const defs = Array.isArray(defenderTypes) ? defenderTypes : [defenderTypes];
    if (!attackType || !defs.length) return 1;
    if (attackType === 'neutral') return 1;
    if (defs.includes('neutral')) return 1;

    if (attackType === 'celestial') {
      // Thiên đánh mọi hệ x2, trừ Vô Hệ & Thiên
      return defs.every(t => t === 'celestial') ? 1 : (defs.includes('celestial') ? 1 : 2);
    }
    if (defs.includes('celestial')) return 1; // Thiên Khắc xử lý riêng trong battle

    let mult = 1;
    for (const d of defs) {
      if (d === 'neutral') continue;
      const row = OFFENSE[attackType] || {};
      mult *= (row[d] !== undefined ? row[d] : 1);
    }
    return mult;
  }

  /** Nhãn hiệu quả tiếng Việt */
  function effectivenessLabel(mult) {
    if (mult === 0) return { text: 'Không hiệu quả', tone: 'none' };
    if (mult >= 4) return { text: 'Cực kỳ hiệu quả', tone: 'ultra' };
    if (mult >= 2) return { text: 'Rất hiệu quả', tone: 'super' };
    if (mult > 1) return { text: 'Hơi hiệu quả', tone: 'good' };
    if (mult === 1) return { text: 'Bình thường', tone: 'normal' };
    return { text: 'Không hiệu quả', tone: 'weak' };
  }

  /** Cấu hình Thiên Khắc dành riêng cho console/tests */
  function celestialFractureChance(attackerLuck) {
    const c = SPECIAL.celestial;
    return PG.clamp(c.fractureBase + attackerLuck * c.fracturePerLuck, c.fractureBase, c.fractureMax);
  }
  function celestialX3Chance(attackerLuck) {
    const c = SPECIAL.celestial;
    return PG.clamp(c.fractureX3Base + attackerLuck * c.fractureX3PerLuck, c.fractureX3Base, c.fractureX3Max);
  }

  PG.TYPES = TYPES;
  PG.TYPE_ORDER = TYPE_ORDER;
  PG.OFFENSE = OFFENSE;
  PG.TYPE_SPECIAL = SPECIAL;
  PG.getMultiplier = getMultiplier;
  PG.effectivenessLabel = effectivenessLabel;
  PG.celestialFractureChance = celestialFractureChance;
  PG.celestialX3Chance = celestialX3Chance;
})();
