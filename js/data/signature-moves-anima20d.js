/* ============================================================
   CHIÊU ĐẶC TRƯNG — NEXUS ANIMA ĐỢT 4 (dex 9713-9716)
   Mỗi Anima có riêng một chiêu, lấy từ kỹ năng/đặc điểm trên hna.wiki.
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
    anima_money_rain: M('anima_money_rain', 'Mưa Tiền', 'normal', 'special', 105, 95, 10,
      { effect: { stat: { target: 'foe', stat: 'accuracy', stages: -1, chance: 40 } }, desc: 'Moneytree lắc cây, tiền rơi làm đối thủ mất tiêu điểm.' }),
    anima_guacamole_guard: M('anima_guacamole_guard', 'Giáp Guacamole', 'grass', 'status', 0, null, 10,
      { effect: { heal: 0.35, stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } }, desc: 'Mr. Avocado bọc mình trong lớp bơ mướt, hồi phục và dựng khiên.' }),
    anima_clock_lock: M('anima_clock_lock', 'Khóa Giờ', 'steel', 'physical', 110, 95, 10,
      { effect: { stat: { target: 'foe', stat: 'spe', stages: -2, chance: 50 } }, desc: "C'locked khóa nhịp trận đấu rồi tung cú chốt giờ." }),
    anima_derpy_charge: M('anima_derpy_charge', 'Húc Ngốc Nghếch', 'ground', 'physical', 120, 90, 10,
      { flags: { contact: true }, effect: { stat: { target: 'foe', stat: 'def', stages: -1, chance: 35 } }, desc: 'Derpydile lao tới bằng cú húc đất trời, vỡ cả phòng thủ.' })
  };

  Object.assign(PG.MOVES, MOVES);

  const BIND = {
    'cross-anima-moneytree': 'anima_money_rain',
    'cross-anima-mr-avocado': 'anima_guacamole_guard',
    'cross-anima-c-locked': 'anima_clock_lock',
    'cross-anima-derpydile': 'anima_derpy_charge'
  };
  const S = PG.SPECIATURE_BY_SPECIES || (PG.SPECIATURE_BY_SPECIES = {});
  Object.keys(BIND).forEach(function (id) { S[id] = [BIND[id]]; });
  PG.NEXUS_ANIMA20D_MOVES = MOVES;
  PG.NEXUS_ANIMA20D_SIGNATURES = BIND;
})();
