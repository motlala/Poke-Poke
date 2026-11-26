/* ============================================================
   BẢN ĐỒ CHỌN VÙNG — tọa độ các điểm và đường nối.
   Lưới 12 cột × 7 hàng: cột 1..11, hàng 1..6 (để có viền).
   Chỉ là dữ liệu trình bày; không đụng luật mở khóa / đi dạo.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const POS = {
    // Nhóm crossover / thế giới khác — phía Bắc bản đồ
    'pal-tundra': [1, 1], 'pal-lava': [3, 1], 'digi-city': [5, 1],
    'pal-isles': [7, 1], 'digi-forest': [9, 1], 'digi-temple': [11, 1],
    // Vùng gốc — trung tâm
    desert: [3, 2], snow: [5, 2], city: [7, 2], temple: [9, 2],
    forest: [2, 4], cave: [4, 4], beach: [6, 4], lake: [8, 4], volcano: [10, 4],
    // Kanto — phía Nam
    pallet: [1, 6], viridian: [3, 6], cerulean: [5, 6],
    vermilion: [7, 6], celadon: [9, 6], indigo: [11, 6]
  };

  const ROUTES = [
    ['pal-tundra', 'pal-lava'], ['pal-lava', 'digi-city'], ['digi-city', 'pal-isles'],
    ['pal-isles', 'digi-forest'], ['digi-forest', 'digi-temple'],
    ['digi-city', 'city'], ['digi-temple', 'temple'], ['pal-lava', 'volcano'],
    ['desert', 'snow'], ['snow', 'city'], ['city', 'temple'],
    ['forest', 'desert'], ['cave', 'snow'], ['lake', 'city'], ['volcano', 'desert'],
    ['forest', 'cave'], ['cave', 'beach'], ['beach', 'lake'], ['lake', 'volcano'],
    ['forest', 'viridian'], ['cave', 'pallet'], ['beach', 'cerulean'],
    ['lake', 'vermilion'], ['volcano', 'celadon'], ['temple', 'indigo'],
    ['pallet', 'viridian'], ['viridian', 'cerulean'], ['cerulean', 'vermilion'],
    ['vermilion', 'celadon'], ['celadon', 'indigo']
  ];

  PG.REGION_MAP_POS = POS;
  PG.REGION_MAP_ROUTES = ROUTES;
  PG.regionMapPoint = function (id) {
    const p = POS[id];
    return p ? { x: p[0] * 10, y: p[1] * 10, left: p[0] / 12 * 100, top: p[1] / 7 * 100 } : null;
  };
})();
