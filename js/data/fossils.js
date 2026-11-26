/* ============================================================
   HÓA THẠCH: dữ liệu mỏ, hóa thạch và chi phí phục chế
   (mọi tên loài dùng ở đây đều có trong PG.SPECIES,
    mọi nguyên liệu đều có trong PG.MATERIALS)
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};
  const MIN = 60 * 1000;

  const FOSSILS = {
    /* ---------------- Hang Động ---------------- */
    ammonite: {
      id: 'ammonite', name: 'Ốc Xoắn Cổ Đại', site: 'cave', speciesId: 'omanyte',
      rarity: 'common', weight: 40,
      restoreMaterials: { stone: 3, shell: 2 }, restoreCoins: 700, restoreMs: 5 * MIN,
      sellCoins: 180, icon: '🐚',
      desc: 'Vỏ xoắn ốc in hằn trong đá vôi, còn giữ dấu vết của sinh vật biển cổ.'
    },
    trilobite: {
      id: 'trilobite', name: 'Ba Thùy Đá', site: 'cave', speciesId: 'kabuto',
      rarity: 'common', weight: 34,
      restoreMaterials: { stone: 4, shell: 1 }, restoreCoins: 800, restoreMs: 6 * MIN,
      sellCoins: 200, icon: '🪨',
      desc: 'Giáp chia ba thùy, mắt lồi nhấp nháy dưới ánh đèn tinh thể.'
    },
    'spiral-shell': {
      id: 'spiral-shell', name: 'Ốc Xoắn Tinh Thể', site: 'cave', speciesId: 'omastar',
      rarity: 'rare', weight: 16,
      restoreMaterials: { stone: 5, crystal: 2 }, restoreCoins: 1600, restoreMs: 12 * MIN,
      sellCoins: 420, icon: '🔷',
      desc: 'Vỏ xoắn phủ tinh thể, gân guốc nhô ra như những gai cổ hóa thạch.'
    },
    'ancient-claw': {
      id: 'ancient-claw', name: 'Vuốt Cổ Trong Đá', site: 'cave', speciesId: 'kabutops',
      rarity: 'rare', weight: 10,
      restoreMaterials: { stone: 6, crystal: 2, shell: 2 }, restoreCoins: 1900, restoreMs: 14 * MIN,
      sellCoins: 500, icon: '🗿',
      desc: 'Mảnh giáp và vuốt sắc nằm sâu trong tầng đá, rất khó tách nguyên vẹn.'
    },

    /* ---------------- Sa Mạc ---------------- */
    'dune-shell': {
      id: 'dune-shell', name: 'Vỏ Ốc Cát Chảy', site: 'desert', speciesId: 'omanyte',
      rarity: 'common', weight: 42,
      restoreMaterials: { sand: 4, stone: 2 }, restoreCoins: 900, restoreMs: 7 * MIN,
      sellCoins: 220, icon: '⏳',
      desc: 'Vỏ hóa thạch bị cát mài nhẵn, lấp lánh những hạt thạch anh li ti.'
    },
    'sand-blade': {
      id: 'sand-blade', name: 'Lưỡi Mai Sa Mạc', site: 'desert', speciesId: 'kabutops',
      rarity: 'rare', weight: 22,
      restoreMaterials: { sand: 6, stone: 3, shell: 1 }, restoreCoins: 2000, restoreMs: 15 * MIN,
      sellCoins: 520, icon: '🪞',
      desc: 'Phiến giáp sắc như lưỡi dao, chôn dưới đụn cát từ hàng triệu năm trước.'
    },
    'fossil-wing': {
      id: 'fossil-wing', name: 'Cánh Cổ Vỡ Nham', site: 'desert', speciesId: 'aerodactyl',
      rarity: 'legendary', weight: 8,
      restoreMaterials: { sand: 8, crystal: 3, relic: 1 }, restoreCoins: 3200, restoreMs: 20 * MIN,
      sellCoins: 900, icon: '🦅',
      desc: 'Mảnh cánh và răng hóa thạch cực hiếm, từng thuộc về kẻ thống trị bầu trời cổ.'
    },

    /* ---------------- Núi Lửa ---------------- */
    'ember-shell': {
      id: 'ember-shell', name: 'Ốc Xoắn Tro Nóng', site: 'volcano', speciesId: 'omastar',
      rarity: 'rare', weight: 36,
      restoreMaterials: { ember: 4, stone: 3 }, restoreCoins: 1400, restoreMs: 10 * MIN,
      sellCoins: 360, icon: '🔥',
      desc: 'Vỏ xoắn bị nung thành màu đỏ au, vẫn ấm khi vừa đào lên.'
    },
    'magma-trilobite': {
      id: 'magma-trilobite', name: 'Ba Thùy Dung Nham', site: 'volcano', speciesId: 'kabuto',
      rarity: 'common', weight: 30,
      restoreMaterials: { ember: 3, stone: 4 }, restoreCoins: 1100, restoreMs: 9 * MIN,
      sellCoins: 300, icon: '🌋',
      desc: 'Giáp ba thùy in trong dung nham nguội, giữ nguyên hình dáng kỳ lạ.'
    },
    'ash-wing': {
      id: 'ash-wing', name: 'Cánh Cổ Tro Tàn', site: 'volcano', speciesId: 'aerodactyl',
      rarity: 'legendary', weight: 10,
      restoreMaterials: { ember: 7, crystal: 3, relic: 1 }, restoreCoins: 3000, restoreMs: 18 * MIN,
      sellCoins: 850, icon: '🦴',
      desc: 'Xương cánh hóa đá trong lớp tro dày, chỉ còn lại ở những tầng sâu nhất.'
    }
  };

  PG.FOSSILS = FOSSILS;
  PG.FOSSIL_ORDER = Object.keys(FOSSILS);
})();
