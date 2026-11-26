/* ============================================================
   VẬT PHẨM HUẤN LUYỆN VIÊN — gắn vĩnh viễn, tăng chỉ số không giới hạn
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const STAT_META = {
    hp:        { name: 'HP tối đa', icon: '❤️', suffix: '', combat: true },
    atk:       { name: 'Tấn công', icon: '⚔️', suffix: '', combat: true },
    def:       { name: 'Phòng thủ', icon: '🛡️', suffix: '', combat: true },
    spa:       { name: 'TC đặc biệt', icon: '🔮', suffix: '', combat: true },
    spd:       { name: 'PT đặc biệt', icon: '🥋', suffix: '', combat: true },
    spe:       { name: 'Tốc độ', icon: '💨', suffix: '', combat: true },
    luck:      { name: 'May mắn', icon: '✨', suffix: '' },
    crit:      { name: 'Chí mạng', icon: '💥', suffix: '%' },
    dodge:     { name: 'Né đòn', icon: '🍃', suffix: '%' },
    accuracy:  { name: 'Chính xác', icon: '🎯', suffix: '%' },
    stamina:   { name: 'Thể lực tối đa', icon: '⚡', suffix: '' },
    bag:       { name: 'Sức chứa túi', icon: '🎒', suffix: '' },
    rareFind:  { name: 'Gặp loài hiếm', icon: '🍀', suffix: '%' }
  };

  const I = (id, name, icon, rarity, stats, desc) => ({ id, name, icon, rarity, stats, desc });

  const TRAINER_ITEMS = {
    /* Thường */
    'training-bands':  I('training-bands', 'Băng Tập Luyện', '🎽', 'common', { atk: 3 }, 'Băng tay vải cũ, nhưng cú đấm trở nên chắc chắn hơn.'),
    'guard-wrap':      I('guard-wrap', 'Quấn Tay Bảo Vệ', '🧣', 'common', { def: 3 }, 'Lớp vải dày giúp chuyển hướng cú đánh.'),
    'focus-glasses':   I('focus-glasses', 'Kính Tập Trung', '👓', 'common', { accuracy: 3 }, 'Đeo vào là mọi cử động đều rõ ràng hơn.'),
    'lucky-coin':      I('lucky-coin', 'Đồng Xu May Mắn', '🪙', 'common', { luck: 4 }, 'Đồng xu cũ được cho là mang lại vận may.'),
    'runner-shoes':    I('runner-shoes', 'Giày Chạy Bộ', '👟', 'common', { spe: 4 }, 'Đế giày nhẹ, bước chân nhanh hơn.'),
    'stamina-belt':    I('stamina-belt', 'Thắt Lưng Thể Lực', '🪢', 'common', { stamina: 10 }, 'Thắt chặt lại để đi được đường dài hơn.'),
    'pocket-pack':     I('pocket-pack', 'Túi Nhỏ Gọn', '👝', 'common', { bag: 4 }, 'Thêm vài ngăn nhỏ vào ba lô.'),
    'energy-band':     I('energy-band', 'Băng Đeo Năng Lượng', '🎗️', 'common', { spe: 3, stamina: 6 }, 'Dây đeo giữ nhịp bước, đi xa không hụt hơi.'),
    'lucky-talisman':  I('lucky-talisman', 'Bùa May Nhỏ', '🎴', 'common', { luck: 5 }, 'Tấm bùa giấy cũ, mang theo là gặp chuyện lành.'),
    /* Hiếm */
    'power-glove':     I('power-glove', 'Găng Tay Sức Mạnh', '🧤', 'rare', { atk: 8 }, 'Găng tay truyền sức mạnh thẳng vào cơ bắp.'),
    'iron-vest':       I('iron-vest', 'Áo Giáp Sắt', '🦺', 'rare', { def: 9 }, 'Áo giáp mỏng nhưng cực kỳ bền.'),
    'mind-gem':        I('mind-gem', 'Tinh Thể Tâm Trí', '🔮', 'rare', { spa: 8 }, 'Tăng cường khả năng điều khiển năng lượng đặc biệt.'),
    'shield-ring':     I('shield-ring', 'Nhẫn Khiên', '💍', 'rare', { spd: 8 }, 'Vòng kim loại phát ra một lớp màng bảo vệ.'),
    'swift-boots':     I('swift-boots', 'Ống Bằng Gió', '🥾', 'rare', { spe: 9 }, 'Giày làm từ lông chim, tăng tốc độ di chuyển.'),
    'vitality-charm':  I('vitality-charm', 'Bùa Sinh Lực', '❤️', 'rare', { hp: 28 }, 'Sức sống dâng tràn khi cầm bùa này.'),
    'clover-charm':    I('clover-charm', 'Bùa Cỏ Bốn Lá', '🍀', 'rare', { luck: 11 }, 'May mắn được tích tụ từ những cánh cỏ hiếm.'),
    'aim-scope':       I('aim-scope', 'Kính Ngắm Huấn Luyện', '🔭', 'rare', { accuracy: 7 }, 'Giúp ném bóng và ra chiêu chính xác hơn.'),
    'dodge-cloak':     I('dodge-cloak', 'Áo Choàng Lá', '🍃', 'rare', { dodge: 5 }, 'Áo choàng làm từ lá khiến chuyển động trở nên khó đoán.'),
    'finder-lens':     I('finder-lens', 'Kính Tìm Kiếm', '🔎', 'rare', { rareFind: 7 }, 'Soi được dấu vết của những loài hiếm.'),
    'spirit-incense':  I('spirit-incense', 'Trầm Hương Tâm Trí', '🕯️', 'rare', { spa: 10, spd: 4 }, 'Khói trầm giúp tập trung vào dòng năng lượng đặc biệt.'),
    'tough-hide':      I('tough-hide', 'Da Dày Rugged', '🦔', 'rare', { def: 10, hp: 12 }, 'Lớp da dày cản được cả va chạm lẫn mất máu.'),
    /* Sử thi */
    'titan-glove':     I('titan-glove', 'Găng Tay Khổng Lồ', '🥊', 'epic', { atk: 17 }, 'Găng tay của một nhà đấu vật huyền thoại.'),
    'fortress-plate':  I('fortress-plate', 'Giáp Pháo Đài', '🛡️', 'epic', { def: 18 }, 'Tấm giáp từng chắn được một cơn bão cát.'),
    'arcane-core':     I('arcane-core', 'Lõi Huyền Bí', '💠', 'epic', { spa: 16, spd: 9 }, 'Lõi năng lượng cường hóa cả tấn công lẫn phòng thủ đặc biệt.'),
    'thunder-shoes':   I('thunder-shoes', 'Giày Sấm Sét', '⚡', 'epic', { spe: 18 }, 'Mỗi bước chân để lại một tia điện.'),
    'heart-shard':     I('heart-shard', 'Mảnh Trái Tim', '💖', 'epic', { hp: 60 }, 'Mảnh tim cổ tăng sức bền toàn cơ thể.'),
    'star-medal':      I('star-medal', 'Huy Chương Sao', '🌟', 'epic', { luck: 24 }, 'Huy chương trao cho người chiến thắng trong đêm sao.'),
    'eagle-eye':       I('eagle-eye', 'Mắt Đại Bàng', '🦅', 'epic', { accuracy: 13, dodge: 4 }, 'Tầm nhìn sắc bén, né tránh cũng khéo hơn.'),
    'treasure-map':    I('treasure-map', 'Bản Đồ Kho Báu', '🗺️', 'epic', { rareFind: 15, bag: 6 }, 'Dẫn tới những nơi có loài hiếm xuất hiện.'),
    'titan-stamina':   I('titan-stamina', 'Thắt Lưng Khổng Lồ', '🍖', 'epic', { stamina: 28 }, 'Đi cả ngày mà không mệt.'),
    'astral-compass':  I('astral-compass', 'La Bàn Tinh Quang', '🧭', 'epic', { rareFind: 18, luck: 12 }, 'Kim la bàn luôn chỉ về loài hiếm đang ẩn.'),
    'fury-sigil':      I('fury-sigil', 'Ấn Bạo Phát', '🔥', 'epic', { atk: 15, crit: 5 }, 'Ấn tích khơi dậy cú đánh chí mạng.'),
    /* Huyền thoại */
    'dragon-fang':     I('dragon-fang', 'Ngà Rồng', '🐲', 'legendary', { atk: 34, def: 12 }, 'Ngà rồng cường hóa sức mạnh thể chất.'),
    'god-armor':       I('god-armor', 'Giáp Thần', '🪶', 'legendary', { def: 36, hp: 90 }, 'Bộ giáp của những người giữ đền cổ.'),
    'cosmic-core':     I('cosmic-core', 'Lõi Vũ Trụ', '🌠', 'legendary', { spa: 38, spd: 28 }, 'Năng lượng vũ trụ chảy khắp cơ thể.'),
    'speed-of-light':  I('speed-of-light', 'Bóng Chớp', '🌩️', 'legendary', { spe: 42 }, 'Nhanh đến mức để lại dư ảnh phía sau.'),
    'infinity-charm':  I('infinity-charm', 'Bùa Vô Hạn', '♾️', 'legendary', { luck: 55 }, 'May mắn không có điểm dừng.'),
    'phoenix-feather': I('phoenix-feather', 'Lông Phượng Hoàng', '🔥', 'legendary', { hp: 130, luck: 22 }, 'Lông phượng hoàng ban cho sức sống và vận may.'),
    'fate-dice':       I('fate-dice', 'Xí Ngầu Định Mệnh', '🎲', 'legendary', { luck: 35, crit: 8, dodge: 7 }, 'Xí ngầu luôn nghiêng về phía bạn.'),
    'world-tree':      I('world-tree', 'Hạt Cây Thế Giới', '🌳', 'legendary', { atk: 28, def: 28, hp: 110, stamina: 45 }, 'Hạt giống từ cây thế giới, cường hóa toàn diện.'),
    'eclipse-eye':     I('eclipse-eye', 'Mắt Nhật Thực', '🌘', 'legendary', { accuracy: 18, crit: 12, dodge: 10 }, 'Ánh sáng nhật thực soi rõ điểm yếu và lẫn đi vết tích.'),
    'titan-heart':     I('titan-heart', 'Trái Tim Khổng Lồ', '💓', 'legendary', { hp: 150, def: 20 }, 'Trái tim của người khổng lồ, chịu được mọi đòn thương.')
  };

  function itemPower(item) {
    const stats = item.stats || {};
    return Object.entries(stats).reduce((a, [k, v]) => a + v * (k === 'hp' || k === 'stamina' ? 0.25 : 1), 0);
  }

  function rollTrainerItem(itemId) {
    const def = TRAINER_ITEMS[itemId];
    if (!def) return null;
    const stats = {};
    for (const [k, v] of Object.entries(def.stats)) {
      stats[k] = Math.max(1, Math.round(v * PG.rand(0.9, 1.15)));
    }
    return {
      uid: PG.uid('tritem'), itemId, rarity: def.rarity, stats,
      name: def.name, icon: def.icon, acquiredAt: Date.now()
    };
  }

  function aggregateTrainerItems(items) {
    const totals = {};
    const out = [];
    for (const it of items || []) {
      if (!it || !TRAINER_ITEMS[it.itemId]) continue;
      out.push(it);
      for (const [k, v] of Object.entries(it.stats || {})) totals[k] = (totals[k] || 0) + v;
    }
    return { totals, items: out };
  }

  /** Chỉ số nền của Huấn luyện viên luôn bằng 0: mọi giá trị chỉ đến từ
      vật phẩm đã mua/gắn. Cấp HLV vẫn tăng tự do nhưng không tự cộng chỉ số. */
  function trainerBaseStats() {
    return {
      hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0,
      luck: 0, crit: 0, dodge: 0, accuracy: 0,
      stamina: 0, bag: 0, rareFind: 0
    };
  }

  PG.TRAINER_STAT_META = STAT_META;
  PG.TRAINER_ITEMS = TRAINER_ITEMS;
  PG.trainerItemPower = itemPower;
  PG.rollTrainerItem = rollTrainerItem;
  PG.aggregateTrainerItems = aggregateTrainerItems;
  PG.trainerBaseStats = trainerBaseStats;
})();
