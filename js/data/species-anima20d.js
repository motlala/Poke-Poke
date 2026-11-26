/* ============================================================
   HONKAI: NEXUS ANIMA — ĐỢT 4 (dex game 9713-9716)
   4 Anima mới, artwork thật từ hna.wiki, nền trong suốt 256×256
   tại images/crossovers/. Dex / id / tên / ảnh / hệ / vùng không trùng loài cũ.
   Các bản thiết kế 0.3.0 trùng tên Anima gốc đã bị gỡ bỏ.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  PG.addSpecies([
    [9713, 'Moneytree', ['normal', 'grass'], [80, 85, 75, 90, 80, 70], 'rare', 'city,pallet', null,
      { id: 'cross-anima-moneytree', desc: 'Anima cây tiền, lắc lá là tiền rơi xuống làm đối thủ phân tâm.' }],
    [9714, 'Mr. Avocado', ['grass', 'water'], [90, 80, 95, 75, 90, 55], 'common', 'forest,lake', null,
      { id: 'cross-anima-mr-avocado', desc: 'Anima quả bơ lịch lãm, bọc mình trong lớp guacamole mướt mà để chịu đòn.' }],
    [9715, "C'locked", ['steel', 'psychic'], [75, 95, 80, 105, 90, 110], 'rare', 'digi-city,celadon', null,
      { id: 'cross-anima-c-locked', desc: 'Anima đồng hồ khóa, khóa chặt nhịp trận đấu rồi tung cú chốt giờ.' }],
    [9716, 'Derpydile', ['ground', 'dragon'], [100, 105, 90, 70, 80, 65], 'rare', 'desert,pal-lava', null,
      { id: 'cross-anima-derpydile', desc: 'Anima cá sấu ngốc nghếch, lao tới bằng cú húc đất trời không kịp né.' }]
  ]);

  PG.NEXUS_ANIMA20D = true;
})();
