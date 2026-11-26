/* ============================================================
   DỮ LIỆU META: TÍNH CÁCH, ĐẶC TÍNH, ĐỘT BIẾN, NHIỆM VỤ, THÀNH TỰU
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  /* ---------------- TÍNH CÁCH (25) ---------------- */
  const NATURES = {
    hardy:   { name: 'Cứng Cỏi',    plus: null,  minus: null,  vi: 'Trung tính, không thay đổi chỉ số.' },
    lonely:  { name: 'Đơn Độc',     plus: 'atk', minus: 'def',  vi: '+10% Tấn công, -10% Phòng thủ.' },
    brave:   { name: 'Dũng Cảm',    plus: 'atk', minus: 'spe',  vi: '+10% Tấn công, -10% Tốc độ.' },
    adamant: { name: 'Kiên Định',   plus: 'atk', minus: 'spa',  vi: '+10% Tấn công, -10% Tấn công đặc biệt.' },
    naughty: { name: 'Tinh Nghịch', plus: 'atk', minus: 'spd',  vi: '+10% Tấn công, -10% Phòng thủ đặc biệt.' },
    bold:    { name: 'Táo Bạo',     plus: 'def', minus: 'atk',  vi: '+10% Phòng thủ, -10% Tấn công.' },
    docile:  { name: 'Nhu Mì',      plus: null,  minus: null,  vi: 'Trung tính, không thay đổi chỉ số.' },
    relaxed: { name: 'Thư Thái',    plus: 'def', minus: 'spe',  vi: '+10% Phòng thủ, -10% Tốc độ.' },
    impish:  { name: 'Tinh Quái',   plus: 'def', minus: 'spa',  vi: '+10% Phòng thủ, -10% Tấn công đặc biệt.' },
    lax:     { name: 'Lơ Đãng',     plus: 'def', minus: 'spd',  vi: '+10% Phòng thủ, -10% Phòng thủ đặc biệt.' },
    timid:   { name: 'Nhút Nhát',   plus: 'spe', minus: 'atk',  vi: '+10% Tốc độ, -10% Tấn công.' },
    hasty:   { name: 'Vội Vàng',    plus: 'spe', minus: 'def',  vi: '+10% Tốc độ, -10% Phòng thủ.' },
    serious: { name: 'Nghiêm Túc',  plus: null,  minus: null,  vi: 'Trung tính, không thay đổi chỉ số.' },
    jolly:   { name: 'Vui Vẻ',      plus: 'spe', minus: 'spa',  vi: '+10% Tốc độ, -10% Tấn công đặc biệt.' },
    naive:   { name: 'Ngây Thơ',    plus: 'spe', minus: 'spd',  vi: '+10% Tốc độ, -10% Phòng thủ đặc biệt.' },
    modest:  { name: 'Khiêm Tốn',   plus: 'spa', minus: 'atk',  vi: '+10% Tấn công đặc biệt, -10% Tấn công.' },
    mild:    { name: 'Dịu Dàng',    plus: 'spa', minus: 'def',  vi: '+10% Tấn công đặc biệt, -10% Phòng thủ.' },
    quiet:   { name: 'Trầm Lặng',   plus: 'spa', minus: 'spe',  vi: '+10% Tấn công đặc biệt, -10% Tốc độ.' },
    bashful: { name: 'E Thẹn',      plus: null,  minus: null,  vi: 'Trung tính, không thay đổi chỉ số.' },
    rash:    { name: 'Nóng Nảy',    plus: 'spa', minus: 'spd',  vi: '+10% Tấn công đặc biệt, -10% Phòng thủ đặc biệt.' },
    calm:    { name: 'Điềm Tĩnh',   plus: 'spd', minus: 'atk',  vi: '+10% Phòng thủ đặc biệt, -10% Tấn công.' },
    gentle:  { name: 'Hiền Lành',   plus: 'spd', minus: 'def',  vi: '+10% Phòng thủ đặc biệt, -10% Phòng thủ.' },
    sassy:   { name: 'Bướng Bỉnh',  plus: 'spd', minus: 'spe',  vi: '+10% Phòng thủ đặc biệt, -10% Tốc độ.' },
    careful: { name: 'Cẩn Trọng',   plus: 'spd', minus: 'spa',  vi: '+10% Phòng thủ đặc biệt, -10% Tấn công đặc biệt.' },
    quirky:  { name: 'Kỳ Quặc',     plus: null,  minus: null,  vi: 'Trung tính, không thay đổi chỉ số.' }
  };

  /* ---------------- ĐẶC TÍNH ---------------- */
  const ABILITIES = {
    overgrow:     { name: 'Cỏ Dại',        desc: 'Chiêu Cỏ mạnh +20% khi HP dưới 1/3.' },
    blaze:        { name: 'Ngọn Lửa',      desc: 'Chiêu Lửa mạnh +20% khi HP dưới 1/3.' },
    torrent:      { name: 'Thủy Triều',    desc: 'Chiêu Nước mạnh +20% khi HP dưới 1/3.' },
    swarm:        { name: 'Bầy Đàn',       desc: 'Chiêu Bọ mạnh +20% khi HP dưới 1/3.' },
    static:       { name: 'Tĩnh Điện',     desc: '30% gây Tê liệt khi bị đòn vật lý chạm vào.' },
    intimidate:   { name: 'Uy Hiếp',       desc: 'Giảm 1 bậc Tấn công đối thủ khi ra sân.' },
    levitate:     { name: 'Lơ Lửng',       desc: 'Miễn nhiễm hoàn toàn chiêu Đất.' },
    sturdy:       { name: 'Kiên Cố',       desc: 'Sống sót với 1 HP nếu đầy máu và bị đòn chí mạng.' },
    'speed-boost':{ name: 'Tăng Tốc',      desc: 'Mỗi lượt tăng 1 bậc Tốc độ.' },
    guts:         { name: 'Gan Dạ',        desc: 'Tấn công +50% khi đang bị trạng thái xấu.' },
    'natural-cure':{ name: 'Thanh Lọc',    desc: 'Hồi phục trạng thái khi đổi Pokémon.' },
    immunity:     { name: 'Miễn Dịch',    desc: 'Không bao giờ bị Độc.' },
    'water-absorb':{ name: 'Hút Nước',     desc: 'Miễn nhiễm chiêu Nước và hồi 25% HP.' },
    'flash-fire': { name: 'Bắt Lửa',       desc: 'Miễn nhiễm chiêu Lửa, chiêu Lửa của mình mạnh hơn.' },
    'thick-fat':  { name: 'Mỡ Dày',        desc: 'Giảm 50% sát thương từ Lửa và Băng.' },
    'serene-grace':{ name: 'Duyên Dáng',   desc: 'Tỉ lệ hiệu ứng phụ của chiêu tăng gấp đôi.' },
    technician:   { name: 'Kỹ Thuật',      desc: 'Chiêu có sức mạnh ≤ 60 tăng 50% sát thương.' },
    sniper:       { name: 'Bắn Tỉa',       desc: 'Sát thương chí mạng x2.25 thay vì x1.5.' },
    moxie:        { name: 'Hung Hãn',      desc: 'Hạ gục đối thủ thì tăng 1 bậc Tấn công.' },
    'shield-dust':{ name: 'Bụi Khiên',     desc: 'Miễn nhiễm hiệu ứng phụ từ chiêu của đối thủ.' },
    regenerator:  { name: 'Tái Sinh',      desc: 'Hồi 1/3 HP khi đổi ra khỏi sân.' },
    chlorophyll:  { name: 'Diệp Lục',      desc: 'Tốc độ x2 khi trời nắng.' },
    'sand-veil':  { name: 'Màn Cát',       desc: 'Tăng Né đáng kể trong bão cát.' },
    'snow-cloak': { name: 'Áo Tuyết',      desc: 'Tăng Né đáng kể khi trời tuyết.' },
    'lucky-charm':{ name: 'Bùa May',       desc: '+10 May mắn cho cả đội.' },
    'run-away':   { name: 'Chạy Trốn',     desc: 'Luôn chạy thoát khỏi Pokémon hoang dã.' },
    pressure:     { name: 'Áp Lực',        desc: 'Đối thủ tốn thêm 1 PP cho mỗi chiêu.' },
    'wonder-guard':{ name: 'Khiên Thần',   desc: 'Chỉ bị sát thương bởi đòn khắc hệ.' },
    'solar-power':{ name: 'Năng Lượng Mặt Trời', desc: 'Trời nắng: Tấn công đặc biệt +50%, mất 1/8 HP mỗi lượt.' },
    adaptability: { name: 'Thích Ứng',       desc: 'Chiêu cùng hệ mạnh thêm 20% (STAB 1.8x).' },
    'sheer-force':{ name: 'Sức Mạnh Thuần',  desc: 'Chiêu có hiệu ứng phụ mạnh thêm 30%.' },
    'solid-rock': { name: 'Đá Rắn',          desc: 'Giảm 25% sát thương từ đòn khắc hệ.' },
    filter:       { name: 'Bộ Lọc',          desc: 'Giảm 25% sát thương từ đòn khắc hệ.' },
    multiscale:   { name: 'Đa Tầng',         desc: 'Còn đầy HP thì nhận một nửa sát thương.' },
    'tinted-lens':{ name: 'Kính Màu',        desc: 'Đòn không hiệu quả gấp đôi sát thương.' },
    'swift-swim': { name: 'Bơi Lội',         desc: 'Tốc độ x2 khi trời mưa.' },
    'battle-armor':{ name: 'Giáp Chiến',     desc: 'Không thể bị chí mạng.' },
    'inner-focus':{ name: 'Tập Trung',       desc: 'Miễn nhiễm Sợ hãi và Bối rối.' },
    'big-pecks':  { name: 'Mỏ Lớn',          desc: 'Phòng thủ +10%.' },
    'tough-claws':{ name: 'Vuốt Cứng',       desc: 'Tấn công +10%.' },
    overcoat:     { name: 'Áo Khoác',        desc: 'Miễn nhiễm trạng thái và choáng từ chiêu đối thủ.' },
    'glitch-shift':{ name: 'Lỗi Hệ Thống',   desc: 'Sau mỗi lượt tấn công, đổi sang một hệ khác và dùng chiêu/đặc tính của hệ đó.' }
  };

  /* Hồ đặc tính theo hệ (dùng để gán tự động cho loài) */
  const TYPE_ABILITIES = {
    normal: ['run-away', 'serene-grace', 'sheer-force', 'technician', 'tough-claws'],
    fire: ['blaze', 'flash-fire', 'multiscale', 'solar-power'],
    water: ['torrent', 'water-absorb', 'swift-swim', 'regenerator'],
    electric: ['static', 'speed-boost', 'adaptability', 'lucky-charm'],
    grass: ['overgrow', 'chlorophyll', 'adaptability', 'regenerator'],
    ice: ['snow-cloak', 'thick-fat', 'multiscale', 'sturdy'],
    fighting: ['guts', 'moxie', 'sheer-force', 'intimidate'],
    poison: ['immunity', 'shield-dust', 'filter', 'pressure'],
    ground: ['sand-veil', 'sturdy', 'solid-rock', 'moxie'],
    flying: ['speed-boost', 'serene-grace', 'big-pecks', 'pressure'],
    psychic: ['serene-grace', 'natural-cure', 'inner-focus', 'levitate', 'tinted-lens'],
    bug: ['swarm', 'technician', 'adaptability', 'shield-dust'],
    rock: ['sturdy', 'sand-veil', 'solid-rock', 'moxie'],
    ghost: ['levitate', 'pressure', 'multiscale', 'natural-cure'],
    dragon: ['moxie', 'sniper', 'adaptability', 'intimidate'],
    dark: ['moxie', 'sniper', 'inner-focus', 'pressure'],
    steel: ['sturdy', 'technician', 'battle-armor', 'regenerator'],
    fairy: ['serene-grace', 'natural-cure', 'filter', 'lucky-charm'],
    neutral: ['wonder-guard', 'natural-cure', 'multiscale', 'serene-grace'],
    celestial: ['wonder-guard', 'pressure', 'multiscale', 'speed-boost'],
    quantum: ['levitate', 'speed-boost', 'adaptability', 'wonder-guard'],
    glitch: ['glitch-shift', 'speed-boost', 'adaptability', 'serene-grace']
  };

  /* ---------------- ĐỘT BIẾN ---------------- */
  const MUTATIONS = {
    shiny: {
      id: 'shiny', name: 'Shiny', badge: '✨', color: '#FFD86B', chance: 0.005,
      stackable: true, desc: 'Dạng đặc biệt đổi màu lấp lánh. Có thể kết hợp với mọi đột biến khác.',
      statMod: {}, battle: {}
    },
    shadow: {
      id: 'shadow', name: 'Bóng Tối', badge: '🌑', color: '#9B59F5', chance: 0.018,
      desc: 'Tấn công +20%, phòng thủ -20%. Hào quang tím. Có thể Thanh Tẩy.',
      statMod: { atk: 1.2, spa: 1.2, def: 0.8, spd: 0.8 }, battle: {}
    },
    alpha: {
      id: 'alpha', name: 'Khổng Lồ', badge: '🐾', color: '#FF7A59', chance: 0.012,
      desc: 'HP và chỉ số +25%, Tốc độ -10%. Kích thước XL. Rất hiếm ở vùng khắc nghiệt.',
      statMod: { hp: 1.25, atk: 1.25, def: 1.25, spa: 1.25, spd: 1.25, spe: 0.9 }, battle: { size: 'XL' }
    },
    mini: {
      id: 'mini', name: 'Mini', badge: '🐜', color: '#6BE3A4', chance: 0.02,
      desc: 'HP -15%, Né đòn +5%. Kích thước XXS.',
      statMod: { hp: 0.85 }, battle: { dodge: 0.05, size: 'XXS' }
    },
    elemental: {
      id: 'elemental', name: 'Nguyên Tố Hóa', badge: '🌋', color: '#FF9E3D', chance: 0.03,
      desc: 'Nhiễm hệ của vùng đang ở, thêm hệ đó vào Pokémon. Chỉ một số loài có thể.',
      statMod: {}, battle: {}
    },
    crystal: {
      id: 'crystal', name: 'Pha Lê', badge: '💎', color: '#7DF9FF', chance: 0.007,
      desc: 'Chỉ số cân bằng tối ưu. Mỗi trận 1 lần chống chí mạng.',
      statMod: { def: 1.1, spd: 1.1 }, battle: { blockCritOnce: true }
    },
    glitch: {
      id: 'glitch', name: 'Hỗn Loạn', badge: '👾', color: '#FF4FD8', chance: 0.005,
      desc: 'Hai chỉ số ngẫu nhiên hoán đổi mỗi trận. Hiệu ứng nhiễu hình.',
      statMod: {}, battle: { glitchSwap: true }
    },
    'celestial-aura': {
      id: 'celestial-aura', name: 'Thiên Quang', badge: '🌟', color: '#FFE9A3', chance: 0.002,
      desc: 'Chỉ dành cho Pokémon huyền thoại. Hào quang Thiên giới, chỉ số +10%.',
      statMod: { hp: 1.1, atk: 1.1, def: 1.1, spa: 1.1, spd: 1.1, spe: 1.1 }, battle: {}
    },
    rainbow: {
      id: 'rainbow', name: 'Cầu Vồng', badge: '🌈', color: '#F0ABFC', chance: 0.0012, aura: 'rainbow',
      desc: 'Hào quang bảy sắc. Hiếm hơn Thiên Quang, toàn bộ chỉ số +10%.',
      statMod: { hp: 1.1, atk: 1.1, def: 1.1, spa: 1.1, spd: 1.1, spe: 1.1 }, battle: {}
    },
    devil: {
      id: 'devil', name: 'Ác Quỷ', badge: '😈', color: '#FF4D6D', chance: 0.0006, aura: 'devil',
      desc: 'Hào quang đỏ rực, hiếm nhất. Tấn công +20%, phòng thủ +14%, tốc độ +16%.',
      statMod: { hp: 1.12, atk: 1.2, def: 1.14, spa: 1.2, spd: 1.14, spe: 1.16 }, battle: {}
    }
  };

  const SIZE_TABLE = {
    XXS: { name: 'XXS', scale: 0.62, hp: 0.9, bonus: 'Né +2%', weight: 3 },
    XS:  { name: 'XS',  scale: 0.8,  hp: 0.96, bonus: '', weight: 12 },
    M:   { name: 'M',   scale: 1,    hp: 1, bonus: '', weight: 70 },
    XL:  { name: 'XL',  scale: 1.22, hp: 1.06, bonus: 'HP +6%', weight: 12 },
    XXL: { name: 'XXL', scale: 1.48, hp: 1.12, bonus: 'HP +12%', weight: 3 }
  };

  const QUALITY = [
    { min: 0,   name: 'Thường',    color: '#8b95a7', stars: 0 },
    { min: 40,  name: 'Tốt',       color: '#5fd17a', stars: 1 },
    { min: 80,  name: 'Tốt',       color: '#5fd17a', stars: 2 },
    { min: 120, name: 'Xuất sắc',  color: '#58b6ff', stars: 3 },
    { min: 160, name: 'Hoàn hảo',  color: '#ffd86b', stars: 4 }
  ];

  /* ---------------- NHIỆM VỤ ---------------- */
  const QUEST_TEMPLATES = {
    daily: [
      { id: 'catch_any', type: 'catch_any', targets: [5, 8, 10], reward: { coins: 300, stardust: 150 }, icon: '🎯', text: n => 'Bắt ' + n + ' Pokémon' },
      { id: 'catch_type', type: 'catch_type', targets: [3, 5], reward: { coins: 350, stardust: 200 }, icon: '🧭', text: (n, q) => 'Bắt ' + n + ' Pokémon hệ ' + (q ? q.typeName : 'ngẫu nhiên') },
      { id: 'walk_km', type: 'walk_km', targets: [2, 3, 5], reward: { coins: 250, stardust: 100 }, icon: '👟', text: n => 'Đi bộ ' + n + ' km' },
      { id: 'evolve', type: 'evolve', targets: [1], reward: { coins: 500, stardust: 250 }, icon: '🧬', text: n => 'Tiến hóa ' + n + ' Pokémon' },
      { id: 'battle_win', type: 'battle_win', targets: [2, 3], reward: { coins: 400, stardust: 180 }, icon: '⚔️', text: n => 'Thắng ' + n + ' trận đấu' },
      { id: 'dodge', type: 'dodge', targets: [3, 5], reward: { coins: 450, stardust: 220 }, icon: '💨', text: n => 'Né ' + n + ' đòn trong các trận đấu' },
      { id: 'excellent', type: 'excellent', targets: [3, 5], reward: { coins: 400, stardust: 160 }, icon: '🎯', text: n => 'Ném Tuyệt vời ' + n + ' lần' },
      { id: 'fish', type: 'fish', targets: [3, 5], reward: { coins: 350, stardust: 180 }, icon: '🎣', text: n => 'Câu được ' + n + ' Pokémon/thứ' },
      { id: 'power_up', type: 'power_up', targets: [2, 3], reward: { coins: 350, stardust: 100 }, icon: '⬆️', text: n => 'Nâng cấp Pokémon ' + n + ' lần' },
      { id: 'use_berry', type: 'use_berry', targets: [2, 4], reward: { coins: 250, stardust: 120 }, icon: '🍇', text: n => 'Dùng ' + n + ' quả để bắt' },
      { id: 'fossil_dig', type: 'fossil_dig', targets: [1, 2], reward: { coins: 400, stardust: 200 }, icon: '🦴', text: n => 'Đào được ' + n + ' hóa thạch' }
    ],
    weekly: [
      { id: 'catch_any', type: 'catch_any', targets: [30, 50], reward: { coins: 2500, stardust: 1200, diamonds: 2 }, icon: '🎯', text: n => 'Bắt ' + n + ' Pokémon' },
      { id: 'walk_km', type: 'walk_km', targets: [15, 25], reward: { coins: 2000, stardust: 1000 }, icon: '👟', text: n => 'Đi bộ ' + n + ' km' },
      { id: 'battle_win', type: 'battle_win', targets: [8, 15], reward: { coins: 3000, stardust: 1500, diamonds: 2 }, icon: '⚔️', text: n => 'Thắng ' + n + ' trận' },
      { id: 'catch_rare', type: 'catch_rare', targets: [5, 10], reward: { coins: 3000, stardust: 1500, diamonds: 3 }, icon: '💠', text: n => 'Bắt ' + n + ' Pokémon hiếm trở lên' },
      { id: 'fish', type: 'fish', targets: [10, 20], reward: { coins: 2200, stardust: 1100 }, icon: '🎣', text: n => 'Câu được ' + n + ' lần' },
      { id: 'hatch', type: 'hatch', targets: [2, 4], reward: { coins: 2500, stardust: 1300, diamonds: 2 }, icon: '🥚', text: n => 'Ấp ' + n + ' quả trứng' },
      { id: 'evolve', type: 'evolve', targets: [2, 3], reward: { coins: 2800, stardust: 1400 }, icon: '🧬', text: n => 'Tiến hóa ' + n + ' Pokémon' },
      { id: 'fossil_restore', type: 'fossil_restore', targets: [1, 2], reward: { coins: 2200, stardust: 1100, diamonds: 1 }, icon: '🦴', text: n => 'Phục hồi ' + n + ' hóa thạch' }
    ]
  };

  /* ---------------- THÀNH TỰU ---------------- */
  const ACHIEVEMENTS = [
    { id: 'catches', name: 'Thợ Săn', desc: 'Bắt Pokémon', icon: '🎯', stat: 'catches', tiers: [10, 100, 500], rewards: [{ coins: 500 }, { coins: 3000, diamonds: 1 }, { coins: 12000, diamonds: 5 }] },
    { id: 'km', name: 'Lữ Khách', desc: 'Đi bộ tích lũy', icon: '👟', stat: 'km', tiers: [10, 100, 500], rewards: [{ coins: 500 }, { coins: 3000, diamonds: 1 }, { coins: 12000, diamonds: 5 }] },
    { id: 'species', name: 'Nhà Sưu Tầm', desc: 'Số loài đã bắt', icon: '📕', stat: 'speciesCaught', tiers: [10, 50, 100], rewards: [{ coins: 800, diamonds: 1 }, { coins: 5000, diamonds: 3 }, { coins: 20000, diamonds: 10 }] },
    { id: 'shinies', name: 'Ánh Sáng Kỳ Diệu', desc: 'Bắt Shiny', icon: '✨', stat: 'shinies', tiers: [1, 5, 20], rewards: [{ diamonds: 2 }, { diamonds: 6 }, { diamonds: 20 }] },
    { id: 'gyms', name: 'Bậc Thầy Gym', desc: 'Huy hiệu Gym', icon: '🏅', stat: 'gyms', tiers: [1, 4, 8], rewards: [{ coins: 1500 }, { coins: 6000, diamonds: 3 }, { coins: 20000, diamonds: 8 }] },
    { id: 'fish', name: 'Ngư Dân', desc: 'Câu cá thành công', icon: '🎣', stat: 'fishCaught', tiers: [10, 50, 200], rewards: [{ coins: 600 }, { coins: 3500, diamonds: 1 }, { coins: 15000, diamonds: 6 }] },
    { id: 'tournament', name: 'Giải Đấu', desc: 'Thắng trận giải đấu chuyên biệt', icon: '🏆', stat: 'tournamentWins', tiers: [1, 10, 30], rewards: [{ coins: 800 }, { coins: 5000, diamonds: 2 }, { coins: 20000, diamonds: 8 }] },
    { id: 'eggs', name: 'Nhà Ấp Trứng', desc: 'Trứng đã nở', icon: '🥚', stat: 'eggsHatched', tiers: [1, 10, 50], rewards: [{ coins: 500 }, { coins: 4000, diamonds: 2 }, { coins: 15000, diamonds: 6 }] },
    { id: 'evolutions', name: 'Tiến Hóa', desc: 'Pokémon đã tiến hóa', icon: '🧬', stat: 'evolutions', tiers: [1, 10, 50], rewards: [{ coins: 600 }, { coins: 4000, diamonds: 1 }, { coins: 15000, diamonds: 5 }] },
    { id: 'crits', name: 'Đòn Chí Mạng', desc: 'Chí mạng nhờ May mắn', icon: '💥', stat: 'crits', tiers: [10, 100, 500], rewards: [{ coins: 600 }, { coins: 4000 }, { coins: 15000, diamonds: 4 }] },
    { id: 'dodges', name: 'Bóng Ma', desc: 'Né đòn nhờ May mắn', icon: '💨', stat: 'dodges', tiers: [10, 100, 500], rewards: [{ coins: 600 }, { coins: 4000 }, { coins: 15000, diamonds: 4 }] },
    { id: 'raids', name: 'Săn Boss', desc: 'Hạ Boss Raid', icon: '👹', stat: 'raidsWon', tiers: [1, 10, 50], rewards: [{ coins: 1000, diamonds: 1 }, { coins: 6000, diamonds: 4 }, { coins: 22000, diamonds: 12 }] },
    { id: 'fossils', name: 'Nhà Cổ Sinh Vật', desc: 'Hóa thạch đã phục hồi', icon: '🦴', stat: 'fossilsRestored', tiers: [1, 5, 20], rewards: [{ coins: 800, diamonds: 1 }, { coins: 4000, diamonds: 2 }, { coins: 15000, diamonds: 6 }] }
  ];

  /* ---------------- SỰ KIỆN ---------------- */
  const EVENT_POOL = [
    { id: 'spotlight', name: 'Giờ Cao Điểm', icon: '🔦', desc: 'Tăng mạnh tỉ lệ xuất hiện Pokémon hệ {type} trong 24 giờ.', color: '#58b6ff' },
    { id: 'community', name: 'Ngày Cộng Đồng', icon: '🎉', desc: 'Pokémon {species} xuất hiện dày đặc, Shiny dễ hơn trong 24 giờ.', color: '#ff8fc7' },
    { id: 'lucky', name: 'Ngày May Mắn', icon: '🍀', desc: 'Hiệu lực May mắn tăng x1.5 trong 24 giờ.', color: '#6be3a4' },
    { id: 'discount', name: 'Chợ Giảm Giá', icon: '🏷️', desc: 'Toàn bộ cửa hàng giảm 20% trong 24 giờ.', color: '#ffd86b' },
    { id: 'raid', name: 'Giờ Raid', icon: '👹', desc: 'Boss Raid xuất hiện mạnh hơn, thưởng thêm 1 Thiên Cầu.', color: '#ff7a59' },
    { id: 'golden-hour', name: 'Giờ Vàng', icon: '🌟', desc: 'Pokémon hiếm xuất hiện nhiều hơn và Bụi Sao thưởng tăng x1.5 trong 24 giờ.', color: '#ffd86b' },
    { id: 'fossil-surge', name: 'Bùng Nổ Hóa Thạch', icon: '🦴', desc: 'Hóa thạch xuất hiện dày hơn và phục hồi nhanh hơn trong 24 giờ.', color: '#d2b48c' },
    { id: 'fishing-festival', name: 'Lễ Hội Câu Cá', icon: '🎣', desc: 'Cá cắn lâu hơn, cá Nước/Rồng nhiều hơn, có thể cắm Cá Hoàng Kim Shiny và thưởng đậm.', color: '#58b6ff' }
  ];

  const LOGIN_REWARDS = [
    { day: 1, coins: 300, items: { pokeball: 5 } },
    { day: 2, coins: 500, items: { razz: 2 } },
    { day: 3, coins: 700, items: { greatball: 3 }, stardust: 200 },
    { day: 4, coins: 900, items: { potion: 3 } },
    { day: 5, coins: 1200, items: { ultraball: 2 }, stardust: 300 },
    { day: 6, coins: 1500, items: { revive: 2, razz: 3 }, diamonds: 1 },
    { day: 7, coins: 2500, items: { celestialball: 1, incubator: 1 }, stardust: 800, diamonds: 2 }
  ];

  PG.NATURES = NATURES;
  PG.NATURE_KEYS = Object.keys(NATURES);
  PG.ABILITIES = ABILITIES;
  PG.TYPE_ABILITIES = TYPE_ABILITIES;
  PG.MUTATIONS = MUTATIONS;
  PG.MUTATION_KEYS = Object.keys(MUTATIONS);
  PG.SIZE_TABLE = SIZE_TABLE;
  PG.QUALITY = QUALITY;
  PG.QUEST_TEMPLATES = QUEST_TEMPLATES;
  PG.ACHIEVEMENTS = ACHIEVEMENTS;
  PG.EVENT_POOL = EVENT_POOL;
  PG.LOGIN_REWARDS = LOGIN_REWARDS;
})();
