/* ============================================================
   TRANG BỊ, BỘ TRANG BỊ, NÂNG CẤP, KHẮC MAY MẮN, KHẮC HỆ
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const SLOTS = [
    { id: 'hat', name: 'Mũ', icon: '🎩' },
    { id: 'shirt', name: 'Áo', icon: '👕' },
    { id: 'shoes', name: 'Giày', icon: '👟' },
    { id: 'gloves', name: 'Găng tay', icon: '🧤' },
    { id: 'glasses', name: 'Kính', icon: '🕶️' },
    { id: 'backpack', name: 'Ba lô', icon: '🎒' },
    { id: 'accessory', name: 'Phụ kiện', icon: '💍' }
  ];

  const RARITY = {
    common:    { id: 'common', name: 'Thường', color: '#94a3b8', glow: 'rgba(148,163,184,.35)', luck: [0, 5],   price: 500,  weight: 62 },
    rare:      { id: 'rare', name: 'Hiếm', color: '#38bdf8', glow: 'rgba(56,189,248,.4)',  luck: [2, 12],  price: 1500, weight: 25 },
    epic:      { id: 'epic', name: 'Sử thi', color: '#c084fc', glow: 'rgba(192,132,252,.45)', luck: [6, 22],  price: 4000, weight: 9 },
    legendary: { id: 'legendary', name: 'Huyền thoại', color: '#ffd86b', glow: 'rgba(255,216,107,.5)', luck: [15, 35], price: 10000, weight: 4 }
  };
  const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

  const SETS = {
    lucky: {
      name: 'Bộ Cỏ Bốn Lá', icon: '🍀', color: '#6be3a4',
      desc: 'Bộ trang bị của người được may mắn phù hộ.',
      bonus3: { luck: 8, dodge: 2 }, bonus4: { luck: 15, guaranteedDodge: 1, dodge: 3 }
    },
    explorer: {
      name: 'Bộ Thám Hiểm', icon: '🧭', color: '#fbbf24',
      desc: 'Dành cho những nhà thám hiểm bền bỉ.',
      bonus3: { stamina: 15, bag: 5 }, bonus4: { rareFind: 8, accuracy: 5, stamina: 10 }
    },
    angler: {
      name: 'Bộ Câu Cá', icon: '🎣', color: '#38bdf8',
      desc: 'Trang bị của ngư dân chuyên nghiệp.',
      bonus3: { luck: 3, fishingPower: 8 }, bonus4: { rareFind: 10, accuracy: 5, fishingPower: 12 }
    },
    blaze: {
      name: 'Bộ Hỏa Diệm', icon: '🔥', color: '#f97316',
      desc: 'Chế từ da và tro của núi lửa.',
      bonus3: { heat: 20 }, bonus4: { heat: 15, typeBoost: { fire: 1.1 } }
    },
    frost: {
      name: 'Bộ Băng Giá', icon: '❄️', color: '#7dd3fc',
      desc: 'Kết tinh từ băng vĩnh cửu trên đỉnh núi.',
      bonus3: { cold: 20 }, bonus4: { cold: 15, typeBoost: { ice: 1.1 } }
    },
    storm: {
      name: 'Bộ Bão Tố', icon: '🌪️', color: '#fde68a',
      desc: 'Chống chọi với bão cát sa mạc.',
      bonus3: { sand: 18 }, bonus4: { sand: 12, typeBoost: { rock: 1.1, ground: 1.1 } }
    },
    city: {
      name: 'Bộ Đô Thị', icon: '🏙️', color: '#c084fc',
      desc: 'Phong cách đường phố, nhanh và tiện dụng.',
      bonus3: { bag: 5, speed: 3 }, bonus4: { accuracy: 6, luck: 3 }
    },
    champion: {
      name: 'Bộ Vô Địch', icon: '🏆', color: '#ffd166',
      desc: 'Bộ trang bị của nhà vô địch Liên Minh — đủ 7 món mở mốc thưởng cuối.',
      bonus3: { hp: 40, atk: 8, def: 8 },
      bonus4: { hp: 60, spa: 10, spd: 10, crit: 5 },
      bonus7: { hp: 120, atk: 15, def: 15, spa: 15, spd: 15, spe: 15, crit: 8 }
    },
    mythic: {
      name: 'Bộ Thần Thoại', icon: '🌌', color: '#c084fc',
      desc: 'Trang bị kết tinh từ năng lượng thần thoại, cộng thẳng chỉ số trận đấu.',
      bonus3: { hp: 50, spa: 12, spd: 12 },
      bonus4: { hp: 80, spa: 20, spd: 20, crit: 6, typeBoost: { celestial: 1.1, quantum: 1.1 } }
    }
  };

  const B = (id, name, slot, rarity, set, icon, baseStats, desc) => ({
    id, name, slot, rarity, set, icon, baseStats: baseStats || {}, desc: desc || ''
  });

  const EQUIPMENT_BASES = {
    /* MŨ */
    'explorer-hat':    B('explorer-hat', 'Mũ Thám Hiểm', 'hat', 'rare', 'explorer', '🤠', { stamina: 8, bag: 3, rareFind: 2 }, 'Chiếc mũ của nhà thám hiểm kỳ cựu.'),
    'lucky-cap':       B('lucky-cap', 'Mũ May Mắn', 'hat', 'epic', 'lucky', '🧢', { luck: 6, rareFind: 4, stamina: 3 }, 'Mũ có thêu hình cỏ bốn lá.'),
    'angler-hat':      B('angler-hat', 'Mũ Câu Cá', 'hat', 'common', 'angler', '👒', { stamina: 4, accuracy: 2 }, 'Che nắng, che mưa khi câu cá.'),
    'blaze-helm':      B('blaze-helm', 'Mũ Hỏa Diệm', 'hat', 'rare', 'blaze', '⛑️', { heat: 15, stamina: 5 }, 'Chịu được sức nóng của dung nham.'),
    'frost-hood':      B('frost-hood', 'Mũ Băng Giá', 'hat', 'rare', 'frost', '🎿', { cold: 15, stamina: 4 }, 'Giữ ấm trong bão tuyết.'),
    'storm-cap':       B('storm-cap', 'Mũ Bão Cát', 'hat', 'epic', 'storm', '🥽', { sand: 18, accuracy: 3 }, 'Kính chắn cát tích hợp.'),
    'city-cap':        B('city-cap', 'Mũ Đường Phố', 'hat', 'common', 'city', '🧢', { bag: 4, rareFind: 2 }, 'Mũ lưỡi trai thời thượng.'),
    'sun-hat':         B('sun-hat', 'Mũ Rộng Vành', 'hat', 'common', 'explorer', '👒', { heat: 8, stamina: 3 }, 'Che nắng hiệu quả.'),
    'champion-crown':  B('champion-crown', 'Miện Vô Địch', 'hat', 'legendary', 'champion', '👑', { hp: 18, spa: 8, crit: 3 }, 'Miện của nhà vô địch, tỏa sáng khi vào trận.'),
    'mythic-halo':     B('mythic-halo', 'Hào Quang Thần Thoại', 'hat', 'legendary', 'mythic', '😇', { hp: 20, spa: 14, spd: 10 }, 'Vầng sáng chỉ người được thần linh chọn mới thấy.'),

    /* ÁO */
    'explorer-jacket': B('explorer-jacket', 'Áo Thám Hiểm', 'shirt', 'rare', 'explorer', '🧥', { stamina: 12, bag: 5 }, 'Nhiều túi tiện lợi.'),
    'angler-vest':     B('angler-vest', 'Áo Phao', 'shirt', 'common', 'angler', '🦺', { stamina: 6, bag: 3 }, 'Áo phao nhẹ, nổi tốt.'),
    'blaze-armor':     B('blaze-armor', 'Áo Hỏa Diệm', 'shirt', 'epic', 'blaze', '🦺', { heat: 25, stamina: 10 }, 'Áo giáp chịu nhiệt.'),
    'frost-coat':      B('frost-coat', 'Áo Băng Giá', 'shirt', 'epic', 'frost', '🧥', { cold: 25, stamina: 10 }, 'Lớp lông dày chống lạnh.'),
    'lucky-shirt':     B('lucky-shirt', 'Áo May Mắn', 'shirt', 'rare', 'lucky', '👕', { luck: 4, rareFind: 3, stamina: 4 }, 'May mắn đến từ những điều nhỏ bé.'),
    'storm-cloak':     B('storm-cloak', 'Áo Bão Cát', 'shirt', 'rare', 'storm', '🥼', { sand: 15, stamina: 6 }, 'Vải chống cát.'),
    'city-jacket':     B('city-jacket', 'Áo Khoác Đô Thị', 'shirt', 'common', 'city', '🧥', { bag: 5, rareFind: 2 }, 'Phong cách và tiện dụng.'),
    'champion-robe':   B('champion-robe', 'Áo Choàng Vô Địch', 'shirt', 'legendary', 'champion', '🥋', { hp: 14, def: 10, spd: 8 }, 'Lớp vải dệt từ sợi vô địch, bền hơn cả giáp.'),
    'mythic-shroud':   B('mythic-shroud', 'Áo Choàng Thần Thoại', 'shirt', 'legendary', 'mythic', '🌌', { hp: 24, def: 12, spd: 12 }, 'Dệt từ ánh sao, nhẹ như không mặc gì.'),

    /* GIÀY */
    'wind-shoes':      B('wind-shoes', 'Giày Gió', 'shoes', 'epic', 'lucky', '👟', { luck: 7, speed: 8, dodge: 2 }, 'Nhẹ như gió, bước đi uyển chuyển.'),
    'explorer-boots':  B('explorer-boots', 'Giày Thám Hiểm', 'shoes', 'rare', 'explorer', '🥾', { stamina: 10, bag: 3 }, 'Bền bỉ trên mọi địa hình.'),
    'angler-boots':    B('angler-boots', 'Ủng Câu Cá', 'shoes', 'common', 'angler', '🥾', { stamina: 5, accuracy: 2 }, 'Không sợ nước.'),
    'blaze-boots':     B('blaze-boots', 'Giày Hỏa Diệm', 'shoes', 'rare', 'blaze', '🥾', { heat: 12, speed: 4 }, 'Đế chống nóng.'),
    'frost-boots':     B('frost-boots', 'Giày Băng Giá', 'shoes', 'rare', 'frost', '🥾', { cold: 12, stamina: 4 }, 'Bám tuyết cực tốt.'),
    'storm-boots':     B('storm-boots', 'Giày Bão Cát', 'shoes', 'epic', 'storm', '🥾', { sand: 20, stamina: 5 }, 'Không bị lún cát.'),
    'city-sneakers':   B('city-sneakers', 'Sneaker Đô Thị', 'shoes', 'rare', 'city', '👟', { speed: 6, bag: 4 }, 'Sneaker phiên bản giới hạn.'),
    'champion-boots':  B('champion-boots', 'Giày Vô Địch', 'shoes', 'legendary', 'champion', '🥾', { spe: 12, dodge: 2, hp: 8 }, 'Bước chân của nhà vô địch không bao giờ chậm lại.'),

    /* GĂNG TAY */
    'angler-gloves':   B('angler-gloves', 'Găng Tay Câu', 'gloves', 'common', 'angler', '🧤', { accuracy: 3, stamina: 4 }, 'Chống trượt khi kéo cần.'),
    'explorer-gloves': B('explorer-gloves', 'Găng Thám Hiểm', 'gloves', 'rare', 'explorer', '🧤', { bag: 6, stamina: 5 }, 'Bảo vệ đôi tay.'),
    'lucky-gloves':    B('lucky-gloves', 'Găng May Mắn', 'gloves', 'epic', 'lucky', '🧤', { luck: 7, accuracy: 3 }, 'Chạm vào đâu, may mắn ở đó.'),
    'blaze-gloves':    B('blaze-gloves', 'Găng Hỏa Diệm', 'gloves', 'rare', 'blaze', '🧤', { heat: 14, accuracy: 2 }, 'Chịu nhiệt cực tốt.'),
    'frost-gloves':    B('frost-gloves', 'Găng Băng Giá', 'gloves', 'rare', 'frost', '🧤', { cold: 14, accuracy: 2 }, 'Giữ ấm đôi tay.'),
    'storm-gloves':    B('storm-gloves', 'Găng Bão Cát', 'gloves', 'rare', 'storm', '🧤', { sand: 16, accuracy: 3 }, 'Chống cát hiệu quả.'),
    'champion-gauntlets': B('champion-gauntlets', 'Găng Vô Địch', 'gloves', 'legendary', 'champion', '🥊', { atk: 12, accuracy: 3 }, 'Mỗi cú đấm đều chuẩn xác như đã tập cả đời.'),

    /* KÍNH */
    'camera-glasses':  B('camera-glasses', 'Kính Săn Ảnh', 'glasses', 'epic', 'lucky', '📷', { luck: 10, accuracy: 6, rareFind: 6 }, 'Nhìn thấu khoảnh khắc hoàn hảo.'),
    'explorer-goggles':B('explorer-goggles', 'Kính Thám Hiểm', 'glasses', 'rare', 'explorer', '🥽', { rareFind: 6, accuracy: 3 }, 'Nhìn rõ trong mọi điều kiện.'),
    'blaze-goggles':   B('blaze-goggles', 'Kính Hỏa Diệm', 'glasses', 'rare', 'blaze', '🥽', { heat: 10, accuracy: 3 }, 'Chống tro bụi.'),
    'frost-goggles':   B('frost-goggles', 'Kính Băng Giá', 'glasses', 'rare', 'frost', '🥽', { cold: 10, accuracy: 3 }, 'Chống lóa tuyết.'),
    'storm-goggles':   B('storm-goggles', 'Kính Bão Cát', 'glasses', 'epic', 'storm', '🥽', { sand: 18, accuracy: 5 }, 'Chắn cát tuyệt đối.'),
    'city-glasses':    B('city-glasses', 'Kính Đô Thị', 'glasses', 'common', 'city', '🕶️', { accuracy: 2, rareFind: 3 }, 'Phong cách không lẫn vào đâu.'),
    'champion-scope':  B('champion-scope', 'Kính Vô Địch', 'glasses', 'legendary', 'champion', '🔭', { accuracy: 6, crit: 4 }, 'Nhìn thấy điểm yếu trước cả khi đối thủ ra đòn.'),
    'mythic-eye':      B('mythic-eye', 'Mắt Thần Thoại', 'glasses', 'legendary', 'mythic', '👁️', { spa: 8, accuracy: 8, crit: 5 }, 'Con mắt nhìn xuyên qua cả không gian.'),

    /* BA LÔ */
    'explorer-pack':   B('explorer-pack', 'Ba Lô Thám Hiểm', 'backpack', 'rare', 'explorer', '🎒', { bag: 12, stamina: 8 }, 'Chứa được cả thế giới.'),
    'lucky-pack':      B('lucky-pack', 'Ba Lô May Mắn', 'backpack', 'epic', 'lucky', '🎒', { luck: 5, bag: 8, rareFind: 4 }, 'Ngăn bí mật chứa đầy điều may mắn.'),
    'angler-pack':     B('angler-pack', 'Túi Câu Cá', 'backpack', 'common', 'angler', '🎒', { bag: 6, stamina: 4 }, 'Đựng mồi và chiến lợi phẩm.'),
    'blaze-pack':      B('blaze-pack', 'Ba Lô Hỏa Diệm', 'backpack', 'rare', 'blaze', '🎒', { heat: 12, bag: 6 }, 'Chống cháy.'),
    'frost-pack':      B('frost-pack', 'Ba Lô Băng Giá', 'backpack', 'rare', 'frost', '🎒', { cold: 12, bag: 6 }, 'Giữ đồ khô ráo.'),
    'storm-pack':      B('storm-pack', 'Ba Lô Bão Cát', 'backpack', 'epic', 'storm', '🎒', { sand: 16, bag: 8 }, 'Kín cát tuyệt đối.'),
    'city-pack':       B('city-pack', 'Ba Lô Đô Thị', 'backpack', 'common', 'city', '🎒', { bag: 8, rareFind: 2 }, 'Nhiều ngăn tiện lợi.'),
    'champion-pack':   B('champion-pack', 'Ba Lô Vô Địch', 'backpack', 'legendary', 'champion', '🎒', { bag: 15, stamina: 15 }, 'Đựng đủ đồ cho cả một giải đấu dài.'),

    /* PHỤ KIỆN */
    'clover-ring':     B('clover-ring', 'Nhẫn Cỏ Bốn Lá', 'accessory', 'legendary', 'lucky', '💍', { luck: 18, dodge: 4, rareFind: 6 }, 'Chiếc nhẫn của vận may tuyệt đối.'),
    'four-leaf-brooch':B('four-leaf-brooch', 'Trâm Cỏ Bốn Lá', 'accessory', 'legendary', 'lucky', '🍀', { luck: 22, dodge: 3, accuracy: 3 }, 'Truyền thuyết kể rằng ai đeo nó sẽ không bao giờ thua.'),
    'lucky-charm':     B('lucky-charm', 'Bùa May Mắn', 'accessory', 'epic', 'lucky', '🧿', { luck: 10, rareFind: 5 }, 'Bùa hộ mệnh của ngư dân.'),
    'explorer-charm':  B('explorer-charm', 'Bùa Thám Hiểm', 'accessory', 'rare', 'explorer', '🧭', { stamina: 8, bag: 4 }, 'La bàn cổ chỉ đường.'),
    'angler-charm':    B('angler-charm', 'Bùa Câu Cá', 'accessory', 'common', 'angler', '🪝', { accuracy: 3, luck: 2 }, 'Lưỡi câu may mắn.'),
    'blaze-amulet':    B('blaze-amulet', 'Bùa Hỏa Diệm', 'accessory', 'rare', 'blaze', '🔥', { heat: 12, luck: 3 }, 'Tro của phượng hoàng.'),
    'frost-amulet':    B('frost-amulet', 'Bùa Băng Giá', 'accessory', 'rare', 'frost', '❄️', { cold: 12, luck: 3 }, 'Tinh thể băng vĩnh cửu.'),
    'storm-amulet':    B('storm-amulet', 'Bùa Bão Cát', 'accessory', 'epic', 'storm', '🌪️', { sand: 18, luck: 5 }, 'Mảnh đá sa mạc cổ.'),
    'city-watch':      B('city-watch', 'Đồng Hồ Đô Thị', 'accessory', 'rare', 'city', '⌚', { speed: 5, accuracy: 2 }, 'Đồng hồ thông minh phiên bản giới hạn.'),
    'champion-belt':   B('champion-belt', 'Đai Vô Địch', 'accessory', 'legendary', 'champion', '🏆', { hp: 20, atk: 6, def: 6, spa: 6, spd: 6, spe: 6 }, 'Chiếc đai chỉ trao cho người đứng đầu Liên Minh.'),
    'mythic-core':     B('mythic-core', 'Lõi Thần Thoại', 'accessory', 'legendary', 'mythic', '💠', { spa: 18, atk: 10, crit: 4 }, 'Lõi năng lượng của một vị thần cổ đại.')
  };

  const STAT_META = {
    hp:       { name: 'HP tối đa', icon: '❤️', suffix: '' },
    atk:      { name: 'Tấn công', icon: '⚔️', suffix: '' },
    def:      { name: 'Phòng thủ', icon: '🛡️', suffix: '' },
    spa:      { name: 'TC đặc biệt', icon: '🔮', suffix: '' },
    spd:      { name: 'PT đặc biệt', icon: '🥋', suffix: '' },
    spe:      { name: 'Tốc độ trận', icon: '💨', suffix: '' },
    crit:     { name: 'Chí mạng', icon: '💥', suffix: '%' },
    heat:     { name: 'Chống nóng', icon: '🔥', suffix: '' },
    cold:     { name: 'Chống lạnh', icon: '❄️', suffix: '' },
    sand:     { name: 'Chống bão cát', icon: '🌪️', suffix: '' },
    stamina:  { name: 'Thể lực tối đa', icon: '💪', suffix: '' },
    bag:      { name: 'Sức chứa túi', icon: '🎒', suffix: '' },
    rareFind: { name: 'Gặp loài hiếm', icon: '🍀', suffix: '%' },
    accuracy: { name: 'Chính xác ném', icon: '🎯', suffix: '%' },
    speed:    { name: 'Tốc độ', icon: '⚡', suffix: '' },
    dodge:    { name: 'Né đòn', icon: '💨', suffix: '%' },
    luck:     { name: 'May mắn', icon: '✨', suffix: '' },
    fishingPower: { name: 'Lực kéo câu', icon: '🎣', suffix: '%' }
  };

  const UPGRADE_MATS = ['stone', 'leather', 'feather', 'crystal', 'seed', 'ember', 'ice', 'sand'];

  function upgradeCost(item) {
    const plus = item.plus || 0;
    const n = plus + 1;
    return {
      coins: Math.round(250 * Math.pow(n, 1.6)),
      mats: {
        [UPGRADE_MATS[plus % UPGRADE_MATS.length]]: 2 + plus * 2,
        stone: 1 + Math.floor(plus / 2)
      }
    };
  }
  const EQUIPMENT_MAX_PLUS = 15;

  function upgradeFailChance(plus) {
    if (plus <= 5) return 0;
    return ({ 6: 0.15, 7: 0.25, 8: 0.38, 9: 0.52, 10: 0.65,
      11: 0.70, 12: 0.76, 13: 0.82, 14: 0.88, 15: 0.92 }[plus] || 0);
  }

  /** Giá trị tương đối của một món đồ: dùng để tính tỉ lệ hiến tế. */
  function equipmentWorth(item) {
    if (!item) return 0;
    const base = getBase(item);
    const rarity = RARITY[(item.rarity || (base && base.rarity)) || 'common'] || RARITY.common;
    return Math.round(rarity.price + (item.plus || 0) * 320 + (item.luck || 0) * 25);
  }

  /** Hiến tế món giá trị càng cao thì tỉ lệ lên cấp càng cao; càng lên cao càng khó. */
  function sacrificeChance(target, offering) {
    const ratio = equipmentWorth(offering) / Math.max(1, equipmentWorth(target));
    const chance = 0.5 + Math.min(0.34, ratio * 0.16) - (target && target.plus ? target.plus * 0.018 : 0);
    return Math.max(0.18, Math.min(0.92, Math.round(chance * 100) / 100));
  }
  function enchantCost(item) {
    return { coins: 500 + (item.enchantCount || 0) * 400, clovers: 1 + Math.floor((item.enchantCount || 0) / 2) };
  }
  function luckRange(rarity) { return RARITY[rarity] ? RARITY[rarity].luck : [0, 5]; }

  /** Khắc hệ: cộng sát thương cho chiêu cùng hệ. Trang bị càng + thì hệ cộng càng mạnh. */
  function elementBoost(item) {
    return 1.1 + Math.min(0.05, Math.floor((item.plus || 0) / 3) * 0.01);
  }
  function engraveCost(item) {
    const high = item.rarity === 'epic' || item.rarity === 'legendary';
    return {
      coins: 1200 + (item.plus || 0) * 150,
      mats: { crystal: 1, relic: high ? 1 : 0 }
    };
  }

  function rollEquipment(baseId, opts) {
    const base = EQUIPMENT_BASES[baseId];
    if (!base) return null;
    const o = opts || {};
    const rarity = base.rarity;
    const [lo, hi] = luckRange(rarity);
    let luck = Math.round(PG.rand(lo, hi) + (base.baseStats.luck || 0) * 0.8);
    if (o.highLuck) luck = Math.round(hi * PG.rand(0.75, 1.05) + (base.baseStats.luck || 0) * 0.6);
    const stats = {};
    for (const [k, v] of Object.entries(base.baseStats)) {
      if (k === 'luck') continue;
      stats[k] = Math.max(0, Math.round(v * PG.rand(0.88, 1.12)));
    }
    return {
      uid: PG.uid('eq'), baseId, rarity, plus: o.plus || 0,
      luck: Math.max(0, luck), stats,
      enchantCount: 0, element: o.element || null, locks: {}, createdAt: Date.now()
    };
  }

  function getBase(item) { return EQUIPMENT_BASES[item.baseId] || null; }

  /** Cộng dồn chỉ số trang bị đang mặc + set bonus */
  function aggregateEquipment(equipped) {
    const totals = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, crit: 0, heat: 0, cold: 0, sand: 0, stamina: 0, bag: 0, rareFind: 0, accuracy: 0, speed: 0, dodge: 0, luck: 0, fishingPower: 0, guaranteedDodge: 0, typeBoost: {} };
    const setCounts = {};
    const items = [];
    for (const slot of SLOTS) {
      const it = equipped[slot.id];
      if (!it) continue;
      const base = getBase(it);
      if (!base) continue;
      items.push(it);
      setCounts[base.set] = (setCounts[base.set] || 0) + 1;
      const mult = 1 + (it.plus || 0) * 0.04;
      for (const [k, v] of Object.entries(it.stats || {})) {
        if (totals[k] !== undefined) totals[k] += Math.round(v * mult);
      }
      totals.luck += (it.luck || 0) + (it.plus >= 3 ? 1 : 0) + (it.plus >= 6 ? 1 : 0) +
        (it.plus >= 9 ? 1 : 0) + (it.plus >= 12 ? 1 : 0) + (it.plus >= 15 ? 2 : 0);
      // Khắc hệ cộng dồn với set bonus, áp dụng trực tiếp vào sát thương chiêu cùng hệ.
      if (it.element && PG.TYPES && PG.TYPES[it.element]) {
        totals.typeBoost[it.element] = (totals.typeBoost[it.element] || 1) * elementBoost(it);
      }
    }
    const activeSets = [];
    for (const [sid, count] of Object.entries(setCounts)) {
      if (count >= 3 && SETS[sid]) {
        const set = SETS[sid];
        const maxTier = set.bonus7 ? 7 : 4;
        const tier = count >= maxTier ? maxTier : count >= 4 ? 4 : 3;
        const bonus = tier === 7 ? set.bonus7 : tier === 4 ? set.bonus4 : set.bonus3;
        activeSets.push({ id: sid, count, tier, bonus });
        for (const [k, v] of Object.entries(bonus)) {
          if (k === 'typeBoost') {
            for (const [t, m] of Object.entries(v)) totals.typeBoost[t] = (totals.typeBoost[t] || 1) * m;
          } else if (totals[k] !== undefined) totals[k] += v;
        }
      }
    }
    return { totals, activeSets, items, setCounts };
  }

  function itemDisplayName(it) {
    const base = getBase(it);
    if (!base) return 'Trang bị';
    return base.name + (it.plus ? ' +' + it.plus : '');
  }

  PG.SLOTS = SLOTS;
  PG.RARITY = RARITY;
  PG.RARITY_ORDER = RARITY_ORDER;
  PG.SETS = SETS;
  PG.EQUIPMENT_BASES = EQUIPMENT_BASES;
  PG.STAT_META = STAT_META;
  PG.UPGRADE_MATS = UPGRADE_MATS;
  PG.EQUIPMENT_MAX_PLUS = EQUIPMENT_MAX_PLUS;
  PG.upgradeCost = upgradeCost;
  PG.upgradeFailChance = upgradeFailChance;
  PG.equipmentWorth = equipmentWorth;
  PG.sacrificeChance = sacrificeChance;
  PG.enchantCost = enchantCost;
  PG.engraveCost = engraveCost;
  PG.elementBoost = elementBoost;
  PG.luckRange = luckRange;
  PG.rollEquipment = rollEquipment;
  PG.getEquipBase = getBase;
  PG.aggregateEquipment = aggregateEquipment;
  PG.equipName = itemDisplayName;
})();
