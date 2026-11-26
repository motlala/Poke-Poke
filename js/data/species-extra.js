/* ============================================================
   POKÉMON BỔ SUNG — CHUYÊN CHO CÂU CÁ & VÙNG NƯỚC
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  PG.addSpecies([
    [129, 'Magikarp', ['water'], [20, 10, 55, 15, 20, 80], 'common', 'lake,beach,vermilion', ['gyarados', 400, 20], { desc: 'Yếu ớt và hay nhảy lung tung, nhưng ẩn chứa tiềm năng tiến hóa phi thường.' }],
    [130, 'Gyarados', ['water', 'flying'], [95, 125, 79, 60, 100, 81], 'rare', 'lake,beach,vermilion', null, { size: 'large' }],
    [118, 'Goldeen', ['water'], [45, 67, 60, 35, 50, 63], 'common', 'lake,beach', ['seaking', 50, 33]],
    [119, 'Seaking', ['water'], [80, 92, 65, 65, 80, 68], 'rare', 'lake,beach'],
    [211, 'Qwilfish', ['water', 'poison'], [65, 95, 85, 55, 55, 85], 'rare', 'beach'],
    [349, 'Feebas', ['water'], [20, 15, 20, 10, 55, 80], 'rare', 'lake', ['milotic', 100, null, 'prism-scale'], { desc: 'Loài cá xấu xí sống ở vùng nước bẩn. Tiến hóa thành Milotic tuyệt đẹp.' }],
    [350, 'Milotic', ['water'], [95, 60, 79, 100, 125, 81], 'legendary', 'lake', null, { size: 'large' }],
    [223, 'Remoraid', ['water'], [35, 65, 35, 65, 35, 65], 'common', 'beach', ['octillery', 25, 25]],
    [224, 'Octillery', ['water'], [75, 105, 75, 105, 75, 45], 'rare', 'beach']
  ]);
})();
