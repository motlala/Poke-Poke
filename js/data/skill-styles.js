/* ============================================================
   PHONG CÁCH HIỆU ỨNG RIÊNG CHO CHIÊU / TUYỆT KỸ
   Mỗi chiêu (đặc biệt chiêu riêng, tuyệt kỹ của từng loài) được gán
   một "họa tiết" ổn định: lửa, băng, sét, lá, vực, quang, tinh,
   sóng âm, cơ khí, ảo ảnh. Chỉ đổi lớp CSS — không đụng sát thương.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const STYLES = [
    { id: 'ember',    name: 'Lửa',     a: '#fb7185', b: '#f97316', c: '#fde68a', speed: '1.9s' },
    { id: 'frost',    name: 'Băng',    a: '#bae6fd', b: '#38bdf8', c: '#e0f2fe', speed: '2.8s' },
    { id: 'storm',    name: 'Sét',     a: '#facc15', b: '#a78bfa', c: '#fef08a', speed: '1.5s' },
    { id: 'verdant',  name: 'Lá',      a: '#86efac', b: '#22c55e', c: '#d9f99d', speed: '3.1s' },
    { id: 'abyss',    name: 'Vực',     a: '#67e8f9', b: '#7e22ce', c: '#c4b5fd', speed: '2.5s' },
    { id: 'radiance', name: 'Quang',   a: '#fde68a', b: '#fbbf24', c: '#fff7ed', speed: '2.2s' },
    { id: 'astral',   name: 'Tinh',    a: '#c4b5fd', b: '#818cf8', c: '#f5f3ff', speed: '3.4s' },
    { id: 'harmonic', name: 'Sóng',    a: '#f9a8d4', b: '#ec4899', c: '#fdf2f8', speed: '2.0s' },
    { id: 'mech',     name: 'Cơ khí',  a: '#cbd5e1', b: '#64748b', c: '#f8fafc', speed: '1.7s' },
    { id: 'phantom',  name: 'Ảo ảnh',  a: '#d8b4fe', b: '#6d28d9', c: '#f3e8ff', speed: '2.9s' }
  ];
  const IDS = STYLES.map(s => s.id);

  // Hệ quyết định "họ" họa tiết; băm trên id chiêu + loài để hai tuyệt kỹ
  // cùng hệ nhưng của hai con vẫn khác nhau.
  const BY_TYPE = {
    normal: ['radiance', 'mech', 'ember'],
    fire: ['ember', 'radiance', 'astral'],
    water: ['abyss', 'frost', 'harmonic'],
    electric: ['storm', 'mech', 'astral'],
    grass: ['verdant', 'harmonic', 'phantom'],
    ice: ['frost', 'astral', 'radiance'],
    fighting: ['ember', 'mech', 'storm'],
    poison: ['abyss', 'verdant', 'phantom'],
    ground: ['ember', 'mech', 'abyss'],
    flying: ['astral', 'storm', 'frost'],
    psychic: ['astral', 'harmonic', 'phantom'],
    bug: ['verdant', 'abyss', 'mech'],
    rock: ['mech', 'ember', 'frost'],
    ghost: ['phantom', 'abyss', 'astral'],
    dragon: ['astral', 'ember', 'abyss'],
    dark: ['phantom', 'abyss', 'storm'],
    steel: ['mech', 'radiance', 'frost'],
    fairy: ['radiance', 'harmonic', 'verdant'],
    neutral: ['radiance', 'astral', 'mech'],
    celestial: ['radiance', 'astral', 'frost'],
    quantum: ['astral', 'mech', 'abyss'],
    glitch: ['phantom', 'mech', 'storm']
  };
  const BY_WORLD = {
    palworld: ['mech', 'storm', 'frost'],
    digimon: ['astral', 'radiance', 'ember'],
    movie: ['radiance', 'phantom', 'harmonic'],
    anima: ['verdant', 'harmonic', 'astral']
  };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0);
  }

  /** Trả về id họa tiết ổn định cho một chiêu (và optionally loài dùng chiêu). */
  function skillStyleOf(move, speciesId) {
    if (!move) return 'astral';
    const flair = PG.Formulas && PG.Formulas.moveFlair ? PG.Formulas.moveFlair(move) : null;
    const world = flair && flair.world;
    const pool = (world && BY_WORLD[world]) || BY_TYPE[move.type] || ['astral', 'radiance', 'phantom'];
    const seed = hash(String(move.id || move.name || '') + '|' + String(speciesId || '') + '|' + String(world || ''));
    return pool[seed % pool.length];
  }

  function skillStyleDef(id) {
    return STYLES.find(s => s.id === id) || STYLES[6];
  }

  PG.SKILL_STYLES = STYLES;
  PG.SKILL_STYLE_IDS = IDS;
  PG.skillStyleOf = skillStyleOf;
  PG.skillStyleDef = skillStyleDef;
})();
