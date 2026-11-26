/* ============================================================
   CHIÊU ĐẶC TRƯNG — NEXUS ANIMA ĐỢT 3 (dex 9643-9662)
   Mỗi chiêu lấy từ Battle Skill chính thức trên hna.wiki.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const M = (id, name, type, category, power, accuracy, pp, extra) => Object.assign({
    id, name, type, category, power, accuracy, pp,
    priority: 0, critBoost: 0, flags: {}, effect: null,
    desc: '', signature: true
  }, extra || {});

  const MOVES = {
    anima_savage_charge: M('anima_savage_charge', 'Cú Húc Gấu Dữ', 'normal', 'physical', 120, 95, 10,
      { effect: { recoil: 0.25 }, desc: 'Hugglebeary lao tới ôm lấy đối thủ rồi húc tung.' }),
    anima_baggle_toss: M('anima_baggle_toss', 'Túi Đất Quăng', 'ground', 'physical', 100, 95, 15,
      { effect: { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 35 } }, desc: 'Baggle quăng chiếc túi đất làm đối thủ trượt chân.' }),
    anima_sturm_sonata: M('anima_sturm_sonata', 'Khúc Sonata Bão Táp', 'water', 'special', 125, 90, 8,
      { effect: { status: { id: 'confusion', chance: 40 } }, desc: 'Umpurrella mở ô và chơi khúc nhạc mưa làm đối thủ bối rối.' }),
    anima_acrobatic_diving: M('anima_acrobatic_diving', 'Nhào Lặn Múa', 'water', 'physical', 115, 95, 10,
      { effect: { stat: { target: 'self', stat: 'spe', stages: 1, chance: 50 } }, desc: 'Sharkalaka nhào lặn từ trên không rồi lao xuống như tên.' }),
    anima_leaf_shower: M('anima_leaf_shower', 'Mưa Lá Xuyên Kẽ', 'flying', 'special', 105, 95, 12,
      { effect: { multihit: [2, 3] }, desc: 'Ugglewing rung cánh thả cơn mưa lá sắc like dao.' }),
    anima_forgetful_strike: M('anima_forgetful_strike', 'Cú Đánh Đãng Trí', 'steel', 'physical', 110, 90, 10,
      { effect: { stat: { target: 'foe', stat: 'spa', stages: -1, chance: 50 } }, desc: 'Goldfogey quên chiêu cũ rồi bất ngờ giáng cú thép.' }),
    anima_wavebreaker: M('anima_wavebreaker', 'Hành Trình Phá Sóng', 'water', 'special', 125, 95, 8,
      { effect: { status: { id: 'paralysis', chance: 30 } }, desc: 'Mariminnow gõ nhịp marimba, sóng nước ập tới làm đối thủ tê liệt.' }),
    anima_wastelands: M('anima_wastelands', 'Hoang Địa Bào Tử', 'poison', 'special', 110, 90, 10,
      { effect: { status: { id: 'toxic', chance: 45 } }, desc: 'Muscimmon phủ bào tử độc khắp vùng đất hoang.' }),
    anima_photosynthesis: M('anima_photosynthesis', 'Quang Hợp', 'grass', 'status', 0, null, 10,
      { effect: { heal: 0.5, stat: { target: 'self', stat: 'spa', stages: 1 } }, desc: 'Sunspottie hấp ánh nắng để hồi phục và tăng sức mạnh.' }),
    anima_crazy_pumpkin: M('anima_crazy_pumpkin', 'Bí Ngô Điên Cuồng', 'ghost', 'physical', 120, 95, 10,
      { effect: { drain: 0.4 }, desc: 'Pumpkimp cười man ríu rồi hút sinh lực đối thủ.' }),
    anima_carbonation_bomb: M('anima_carbonation_bomb', 'Bom Cacbon', 'ground', 'physical', 115, 95, 10,
      { effect: { stat: { target: 'foe', stat: 'def', stages: -1, chance: 40 } }, desc: 'Jerboranj bắn quả ga nổ làm vỡ phòng thủ.' }),
    anima_starlight_support: M('anima_starlight_support', 'Ánh Sao Hỗ Trợ', 'fire', 'status', 0, null, 10,
      { effect: { heal: 0.35, stat: { target: 'self', stat: 'spa', stages: 1, also: { stat: 'spd', stages: 1 } } },
        desc: 'Sootsie đỡ lấy ánh sao, hồi phục và tăng toàn diện.' }),
    anima_purifying_lesson: M('anima_purifying_lesson', 'Bài Học Tinh Khiết', 'grass', 'status', 0, null, 10,
      { effect: { heal: 0.4, stat: { target: 'foe', stat: 'atk', stages: -1 } }, desc: 'Broomba quét sạch tạp chất, làm đối thủ yếu đi.' }),
    anima_gluttonous_spirit: M('anima_gluttonous_spirit', 'Linh Hồn Tham Ăn', 'dark', 'special', 125, 95, 8,
      { effect: { drain: 0.6 }, desc: 'Famishade nuốt lấy sức sống của đối thủ để no lâu.' }),
    anima_moveable_feast: M('anima_moveable_feast', 'Bữa Tiệc Di Động', 'normal', 'physical', 115, 95, 10,
      { effect: { heal: 0.25 }, desc: 'Hoggit vừa đào vừa ăn, hồi phục sau mỗi cú húc.' }),
    anima_everlasting_flames: M('anima_everlasting_flames', 'Ngọn Lửa Vĩnh Cửu', 'fire', 'special', 140, 90, 5,
      { effect: { status: { id: 'burn', chance: 50 } }, desc: 'Fyrklor đốt cháy mãi không tắt, thiêu rụi đối thủ.' }),
    anima_white_wind: M('anima_white_wind', 'Gió Trắng Xoáy', 'flying', 'special', 115, 95, 10,
      { effect: { stat: { target: 'foe', stat: 'accuracy', stages: -1, chance: 40 } }, desc: 'Seroplumanth xoáy lông trắng làm đối thủ trượt đòn.' }),
    anima_bloodrain_night: M('anima_bloodrain_night', 'Đêm Mưa Máu', 'dark', 'special', 130, 90, 8,
      { effect: { status: { id: 'fear', chance: 35 } }, desc: 'Mesmerith gọi dơi bay qua cơn mưa máu, khiến đối thủ sợ hãi.' }),
    anima_inkclouds: M('anima_inkclouds', 'Mây Mực Dưới Móng', 'water', 'physical', 120, 95, 10,
      { effect: { stat: { target: 'foe', stat: 'evasion', stages: -1, chance: 40 } }, desc: 'Atragasus phủ mực đen làm đối thủ lộ rõ chân tướng.' }),
    anima_biggest_bubble: M('anima_biggest_bubble', 'Bong Bóng Lớn Nhất', 'fairy', 'special', 110, 95, 10,
      { effect: { status: { id: 'sleep', chance: 35 } }, desc: 'Shampoco bọc đối thủ trong bong bóng xà phòng mềm mại.' })
  };

  Object.assign(PG.MOVES, MOVES);

  const BIND = {
    'cross-anima-hugglebeary': 'anima_savage_charge',
    'cross-anima-baggle': 'anima_baggle_toss',
    'cross-anima-umpurrella': 'anima_sturm_sonata',
    'cross-anima-sharkalaka': 'anima_acrobatic_diving',
    'cross-anima-ugglewing': 'anima_leaf_shower',
    'cross-anima-goldfogey': 'anima_forgetful_strike',
    'cross-anima-mariminnow': 'anima_wavebreaker',
    'cross-anima-muscimmon': 'anima_wastelands',
    'cross-anima-sunspottie': 'anima_photosynthesis',
    'cross-anima-pumpkimp': 'anima_crazy_pumpkin',
    'cross-anima-jerboranj': 'anima_carbonation_bomb',
    'cross-anima-sootsie': 'anima_starlight_support',
    'cross-anima-broomba': 'anima_purifying_lesson',
    'cross-anima-famishade': 'anima_gluttonous_spirit',
    'cross-anima-hoggit': 'anima_moveable_feast',
    'cross-anima-fyrklor': 'anima_everlasting_flames',
    'cross-anima-seroplumanth': 'anima_white_wind',
    'cross-anima-mesmerith': 'anima_bloodrain_night',
    'cross-anima-atragasus': 'anima_inkclouds',
    'cross-anima-shampoco': 'anima_biggest_bubble'
  };
  const S = PG.SPECIATURE_BY_SPECIES || (PG.SPECIATURE_BY_SPECIES = {});
  Object.keys(BIND).forEach(function (id) { S[id] = [BIND[id]]; });
  PG.NEXUS_ANIMA20C_MOVES = MOVES;
  PG.NEXUS_ANIMA20C_SIGNATURES = BIND;
})();
