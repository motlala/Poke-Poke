/* ============================================================
   VẬT PHẨM
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const BALLS = {
    pokeball:       { name: 'Poké Ball', icon: '⚪', color: '#e74c3c', mult: 1.0, price: 100, unlock: 1, desc: 'Bóng cơ bản, bắt Pokémon thường.' },
    greatball:      { name: 'Great Ball', icon: '🔵', color: '#3b82f6', mult: 1.5, price: 300, unlock: 4, desc: 'Tỉ lệ bắt tốt hơn Poké Ball 50%.' },
    ultraball:      { name: 'Ultra Ball', icon: '🟡', color: '#f5c542', mult: 2.0, price: 800, unlock: 9, desc: 'Tỉ lệ bắt gấp đôi. Cần thiết để bắt hệ Thiên.' },
    masterball:     { name: 'Master Ball', icon: '🟣', color: '#a855f7', mult: 255, price: 12000, unlock: 25, desc: 'Bắt chắc chắn mọi Pokémon trừ hệ Thiên cần Thiên Cầu.' },
    netball:        { name: 'Net Ball', icon: '🟢', color: '#22c55e', mult: 1.5, price: 600, unlock: 6, desc: 'x3 khi bắt Pokémon hệ Nước hoặc Bọ.' },
    duskball:       { name: 'Dusk Ball', icon: '⚫', color: '#4c1d95', mult: 1.5, price: 600, unlock: 6, desc: 'x3 khi ở Hang Động hoặc ban đêm.' },
    timerball:      { name: 'Timer Ball', icon: '⏱️', color: '#f97316', mult: 1.2, price: 700, unlock: 8, desc: 'Càng nhiều lượt ném càng mạnh (tối đa x3).' },
    quickball:      { name: 'Quick Ball', icon: '⚡', color: '#eab308', mult: 1.2, price: 700, unlock: 8, desc: 'x4 nếu ném ngay lượt đầu tiên.' },
    healball:       { name: 'Heal Ball', icon: '💗', color: '#ec4899', mult: 1.4, price: 500, unlock: 5, desc: 'Hồi đầy HP và trạng thái sau khi bắt.' },
    celestialball:  { name: 'Thiên Cầu', icon: '🌟', color: '#ffd86b', mult: 2.5, price: 5000, unlock: 20, desc: 'Bóng đặc biệt chế từ nguyên liệu Đền Cổ. Bắt được hệ Thiên.' },
    'raid-ball':    { name: 'Bóng Raid', icon: '🎯', color: '#fbbf24', mult: 4.5, price: 5000, unlock: 999, raidOnly: true, desc: 'Bóng thưởng sau khi hạ Boss Raid. Tỉ lệ bắt cực cao, dùng để bắt chính Boss vừa bị đánh bại.' }
  };

  const BERRIES = {
    razz:         { name: 'Razz Berry', icon: '🍓', color: '#f472b6', price: 120, catchMult: 1.5, desc: 'Tăng 50% tỉ lệ bắt trong lần ném kế tiếp.' },
    nanab:        { name: 'Nanab Berry', icon: '🍌', color: '#facc15', price: 100, calm: true, desc: 'Làm Pokémon đứng yên, vòng thu nhỏ chậm hơn.' },
    pinap:        { name: 'Pinap Berry', icon: '🍍', color: '#84cc16', price: 150, candyMult: 2, desc: 'Nhân đôi Kẹo nhận được nếu bắt thành công.' },
    goldenrazz:   { name: 'Golden Razz', icon: '🌟', color: '#fbbf24', price: 500, catchMult: 2.5, desc: 'Tăng 150% tỉ lệ bắt. Rất quý.' },
    silverpinap:  { name: 'Silver Pinap', icon: '🥈', color: '#cbd5e1', price: 400, catchMult: 1.8, candyMult: 3, desc: 'Tăng 80% tỉ lệ bắt và x3 Kẹo.' },
    sweetberry:   { name: 'Berry Ngọt', icon: '🍒', color: '#fb7185', price: 250, catchMult: 1.7, friendship: 12, desc: 'Ăn tăng 12 thiện cảm và tăng 70% tỉ lệ bắt lần ném tới.' },
    sunberry:     { name: 'Berry Nắng', icon: '🍊', color: '#fbbf24', price: 450, catchMult: 2.2, friendship: 24, desc: 'Ăn tăng 24 thiện cảm và tăng 120% tỉ lệ bắt lần ném tới.' },
    harmonyberry: { name: 'Berry Hòa Hợp', icon: '🍑', color: '#f9a8d4', price: 700, catchMult: 2.6, friendship: 40, desc: 'Ăn tăng 40 thiện cảm và tăng 160% tỉ lệ bắt lần ném tới.' }
  };

  const MEDICINES = {
    potion:     { name: 'Potion', icon: '🧪', color: '#22c55e', price: 150, heal: 20, desc: 'Hồi 20 HP.' },
    superpotion:{ name: 'Super Potion', icon: '🧴', color: '#16a34a', price: 350, heal: 60, desc: 'Hồi 60 HP.' },
    hyperpotion:{ name: 'Hyper Potion', icon: '🍶', color: '#15803d', price: 700, heal: 150, desc: 'Hồi 150 HP.' },
    maxpotion:  { name: 'Max Potion', icon: '💚', color: '#10b981', price: 1200, heal: 9999, desc: 'Hồi đầy HP.' },
    revive:     { name: 'Revive', icon: '💫', color: '#fbbf24', price: 800, revive: 0.5, desc: 'Hồi sinh Pokémon ngất với 50% HP.' },
    maxrevive:  { name: 'Max Revive', icon: '🌠', color: '#f59e0b', price: 2000, revive: 1, desc: 'Hồi sinh Pokémon ngất với đầy HP.' },
    fullheal:   { name: 'Full Heal', icon: '🧼', color: '#38bdf8', price: 400, cure: true, desc: 'Chữa mọi trạng thái bất thường.' },
    fullrestore:{ name: 'Full Restore', icon: '💖', color: '#f472b6', price: 1600, heal: 9999, cure: true, desc: 'Hồi đầy HP và chữa mọi trạng thái.' },
    teampotion: { name: 'Bình Hồi Phục Nhanh', icon: '🧰', color: '#34d399', price: 900, teamHeal: true, desc: 'Chỉ với 1 bình: hồi đầy HP, chữa trạng thái cho TOÀN ĐỘI (tối đa 6 Pokémon).' },
    energy:     { name: 'Nước Tăng Lực', icon: '🥤', color: '#f97316', price: 300, stamina: 30, desc: 'Hồi 30 Thể lực.' },
    energyplus: { name: 'Nước Tăng Lực Cao Cấp', icon: '🧃', color: '#22c55e', price: 800, stamina: 100, desc: 'Hồi đầy Thể lực.' }
  };

  const MATERIALS = {
    leather: { name: 'Da Thú', icon: '🟫', color: '#a16207', price: 60, desc: 'Nguyên liệu chế trang bị, rơi ở Rừng Xanh / Sa Mạc.' },
    stone:   { name: 'Đá Thô', icon: '🪨', color: '#94a3b8', price: 60, desc: 'Nguyên liệu nâng cấp, rơi ở Hang Động / Núi Lửa.' },
    feather: { name: 'Lông Vũ', icon: '🪶', color: '#e2e8f0', price: 80, desc: 'Nguyên liệu may mắn, rơi ở Bờ Biển / Thành Phố.' },
    crystal: { name: 'Tinh Thể', icon: '🔷', color: '#7dd3fc', price: 120, desc: 'Nguyên liệu quý, rơi ở Núi Tuyết / Hang Động.' },
    seed:    { name: 'Hạt Giống', icon: '🌱', color: '#86efac', price: 50, desc: 'Nguyên liệu chế quả, rơi ở Rừng Xanh / Hồ Nước.' },
    shell:   { name: 'Vỏ Sò', icon: '🐚', color: '#fbcfe8', price: 90, desc: 'Bán được giá, rơi ở Bờ Biển và câu cá.' },
    ember:   { name: 'Than Hồng', icon: '🔥', color: '#fb923c', price: 90, desc: 'Nguyên liệu chế bóng/trang bị, rơi ở Núi Lửa.' },
    ice:     { name: 'Băng Tinh', icon: '🧊', color: '#bae6fd', price: 90, desc: 'Nguyên liệu chế trang bị, rơi ở Núi Tuyết.' },
    sand:    { name: 'Cát Thủy Tinh', icon: '⏳', color: '#fde68a', price: 70, desc: 'Nguyên liệu chế tạo, rơi ở Sa Mạc.' },
    relic:   { name: 'Cổ Vật', icon: '🏺', color: '#fcd34d', price: 250, desc: 'Nguyên liệu hiếm từ Đền Cổ. Dùng chế Thiên Cầu.' },
    dust:    { name: 'Bụi Sao', icon: '✨', color: '#fde68a', price: 0, desc: 'Tiền tệ nâng cấp Pokémon.' }
  };

  const STONES = {
    'fire-stone':    { name: 'Đá Lửa', icon: '🔥', color: '#f97316', price: 1500, desc: 'Tiến hóa Pokémon hệ Lửa.' },
    'water-stone':   { name: 'Đá Nước', icon: '💧', color: '#3b82f6', price: 1500, desc: 'Tiến hóa Pokémon hệ Nước.' },
    'thunder-stone': { name: 'Đá Sấm', icon: '⚡', color: '#facc15', price: 1500, desc: 'Tiến hóa Pokémon hệ Điện.' },
    'leaf-stone':    { name: 'Đá Lá', icon: '🌿', color: '#22c55e', price: 1500, desc: 'Tiến hóa Pokémon hệ Cỏ.' },
    'moon-stone':    { name: 'Đá Mặt Trăng', icon: '🌙', color: '#c4b5fd', price: 1800, desc: 'Tiến hóa Pokémon hệ Tiên / Thường.' },
    'sun-stone':     { name: 'Đá Mặt Trời', icon: '☀️', color: '#fbbf24', price: 1800, desc: 'Tiến hóa trong ánh sáng.' },
    'ice-stone':     { name: 'Đá Băng', icon: '❄️', color: '#7dd3fc', price: 1800, desc: 'Tiến hóa Pokémon hệ Băng.' },
    'fairy-stone':   { name: 'Đá Tiên', icon: '✨', color: '#f9a8d4', price: 2200, desc: 'Tiến hóa Pokémon hệ Tiên.' },
    'dusk-stone':    { name: 'Đá Hoàng Hôn', icon: '🌆', color: '#7c3aed', price: 2000, desc: 'Tiến hóa Pokémon bóng đêm.' },
    'metal-coat':    { name: 'Áo Kim Loại', icon: '⚙️', color: '#cbd5e1', price: 2500, desc: 'Tiến hóa Onix / Scyther.' },
    'dragon-scale':  { name: 'Vảy Rồng', icon: '🐉', color: '#818cf8', price: 3000, desc: 'Tiến hóa Seadra thành Kingdra.' },
    'protector':     { name: 'Khiên Bảo Vệ', icon: '🛡️', color: '#94a3b8', price: 3000, desc: 'Tiến hóa Rhydon thành Rhyperior.' },
    'prism-scale':   { name: 'Vảy Lăng Kính', icon: '🌈', color: '#f0abfc', price: 3000, desc: 'Tiến hóa Feebas thành Milotic.' },
    'razor-claw':    { name: 'Vuốt Sắc', icon: '🗡️', color: '#f472b6', price: 2500, desc: 'Tiến hóa Sneasel (không có trong bản này).' },
    /* Đá / lõi cho các dạng tiến hóa kiểu anime */
    'mega-stone-x':  { name: 'Đá Mega X', icon: '🔶', color: '#fb923c', price: 9000, desc: 'Kích hoạt dạng Mega X của Charizard.' },
    'mega-stone-y':  { name: 'Đá Mega Y', icon: '🔷', color: '#60a5fa', price: 9000, desc: 'Kích hoạt dạng Mega Y của Charizard.' },
    'mega-stone-v':  { name: 'Đá Mega V', icon: '🟢', color: '#4ade80', price: 9000, desc: 'Kích hoạt dạng Mega của Venusaur.' },
    'mega-stone-g':  { name: 'Đá Mega G', icon: '🟣', color: '#c084fc', price: 9000, desc: 'Kích hoạt dạng Mega của Gengar / Gardevoir / Garchomp.' },
    'mega-stone-t':  { name: 'Đá Mega T', icon: '🟤', color: '#d97706', price: 9000, desc: 'Kích hoạt dạng Mega của Tyranitar.' },
    'mega-stone-a':  { name: 'Đá Mega A', icon: '⚫', color: '#94a3b8', price: 9000, desc: 'Kích hoạt dạng Mega của Altaria / Absol.' },
    'giganta-core':  { name: 'Lõi Gigantamax', icon: '🌀', color: '#f87171', price: 12000, desc: 'Lõi năng lượng giúp Pokémon đạt dạng khổng lồ.' },
    'aura-core':     { name: 'Lõi Aura', icon: '💠', color: '#38bdf8', price: 12000, desc: 'Đánh thức toàn bộ aura bên trong Lucario.' },
    'armor-shard':   { name: 'Mảnh Giáp Sinh Học', icon: '🛡️', color: '#a3e635', price: 15000, desc: 'Lắp ráp dạng giáp cho Mewtwo và Lapras.' },
    'origin-shard':  { name: 'Mảnh Nguyên Thủy', icon: '🌌', color: '#f0abfc', price: 18000, desc: 'Đưa Eevee trở về dạng nguyên thủy.' },
    'star-badge':    { name: 'Huy Hiệu Rockstar', icon: '🎸', color: '#fbbf24', price: 10000, desc: 'Biến Pikachu thành ngôi sao sân khấu.' },
    'ultra-ring':    { name: 'Vòng Ultra', icon: '💫', color: '#f472b6', price: 14000, desc: 'Hợp nhất mọi dạng thiết bị của Rotom.' }
  };

  const RODS = {
    bamboo:    { name: 'Cần Tre', icon: '🎋', color: '#84cc16', price: 0, power: 1.0, deep: 0, desc: 'Cần câu khởi đầu. Chỉ câu được vùng nước nông.' },
    good:      { name: 'Cần Tốt', icon: '🎣', color: '#38bdf8', price: 2000, power: 1.18, deep: 1, desc: 'Mở khóa vùng nước sâu vừa, dây bền hơn.' },
    super:     { name: 'Cần Siêu', icon: '🛠️', color: '#a78bfa', price: 8000, power: 1.35, deep: 2, desc: 'Mở khóa vùng nước sâu, dễ kéo cá hiếm.' },
    legendary: { name: 'Cần Huyền Thoại', icon: '🔱', color: '#ffd86b', price: 25000, power: 1.6, deep: 3, desc: 'Mở khóa mọi vùng nước, lực kéo cực mạnh.' }
  };

  const BAITS = {
    worm:     { name: 'Giun Đất', icon: '🪱', color: '#a16207', price: 50, uses: 3, rare: 1.0, types: [], desc: 'Mồi cơ bản, 3 lượt dùng.' },
    dough:    { name: 'Bánh Mồi', icon: '🍞', color: '#fbbf24', price: 120, uses: 4, rare: 1.1, types: [], desc: 'Mồi thơm, 4 lượt dùng, tăng nhẹ cá hiếm.' },
    bright:   { name: 'Mồi Sáng', icon: '🔆', color: '#fde047', price: 180, uses: 4, rare: 1.15, types: ['electric', 'water'], desc: 'Thu hút Pokémon Điện / Nước phát sáng.' },
    fragrant: { name: 'Mồi Thơm', icon: '🌸', color: '#f9a8d4', price: 300, uses: 3, rare: 1.45, types: [], desc: 'Tăng mạnh tỉ lệ gặp loài hiếm.' },
    ice:      { name: 'Mồi Băng', icon: '🧊', color: '#7dd3fc', price: 250, uses: 3, rare: 1.3, types: ['ice', 'water'], desc: 'Thu hút Pokémon hệ Băng / Nước.' },
    dragon:   { name: 'Mồi Rồng', icon: '🐉', color: '#818cf8', price: 800, uses: 2, rare: 1.8, types: ['dragon'], desc: 'Cực hiếm. Thu hút Pokémon hệ Rồng.' }
  };

  const HELD_ITEMS = {
    'oran-berry':  { name: 'Quả Oran', icon: '🍒', color: '#ef4444', price: 200, desc: 'Hồi 10 HP khi HP dưới 50%.', battle: { healBelow: 0.5, heal: 10 } },
    'sitrus-berry':{ name: 'Quả Sitrus', icon: '🍊', color: '#f97316', price: 400, desc: 'Hồi 25% HP khi HP dưới 50%.', battle: { healBelow: 0.5, healPct: 0.25 } },
    'choice-band': { name: 'Băng Cổ Tay', icon: '💪', color: '#dc2626', price: 1200, desc: 'Tấn công +30%, Tốc độ -10%.', battle: { atk: 1.3, spe: 0.9 } },
    'leftovers':   { name: 'Thức Ăn Thừa', icon: '🍖', color: '#65a30d', price: 1400, desc: 'Hồi 1/16 HP mỗi lượt.', battle: { lefties: true } },
    'focus-sash':  { name: 'Đai Tập Trung', icon: '🎽', color: '#eab308', price: 1000, desc: 'Sống sót 1 HP một lần khi bị hạ gục từ đầy máu.', battle: { focusSash: true } },
    'scope-lens':  { name: 'Kính Ngắm', icon: '🔭', color: '#38bdf8', price: 1500, desc: '+12% tỉ lệ chí mạng.', battle: { crit: 0.12 } },
    'quick-claw':  { name: 'Vuốt Nhanh', icon: '🐾', color: '#a78bfa', price: 1300, desc: '20% đánh trước bất kể Tốc độ.', battle: { quickClaw: 0.2 } },
    'lucky-egg':   { name: 'Trứng May', icon: '🥚', color: '#fde68a', price: 2000, desc: '+50% XP nhận được sau trận.', battle: { xp: 1.5 } },
    'amulet-coin': { name: 'Đồng Xu Bùa', icon: '🪙', color: '#fbbf24', price: 2000, desc: '+50% Xu nhận được sau trận.', battle: { coins: 1.5 } },
    'life-orb':    { name: 'Cầu Sinh Mệnh', icon: '🔮', color: '#f43f5e', price: 1800, desc: 'Sát thương +25%, mất 10% HP mỗi đòn.', battle: { damage: 1.25, lifeOrb: true } },
    'assault-vest':{ name: 'Áo Giáp', icon: '🦺', color: '#64748b', price: 1600, desc: 'Phòng thủ đặc biệt +40%.', battle: { spd: 1.4 } },
    'silk-scarf':  { name: 'Khăn Lụa', icon: '🧣', color: '#f5f5f4', price: 900, desc: 'Chiêu Thường mạnh +20%.', battle: { typeBoost: { normal: 1.2 } } },
    'charcoal':    { name: 'Than Củi', icon: '🪵', color: '#57534e', price: 900, desc: 'Chiêu Lửa mạnh +20%.', battle: { typeBoost: { fire: 1.2 } } },
    'mystic-water':{ name: 'Nước Huyền', icon: '💧', color: '#3b82f6', price: 900, desc: 'Chiêu Nước mạnh +20%.', battle: { typeBoost: { water: 1.2 } } },
    'magnet':      { name: 'Nam Châm', icon: '🧲', color: '#ef4444', price: 900, desc: 'Chiêu Điện mạnh +20%.', battle: { typeBoost: { electric: 1.2 } } },
    'miracle-seed':{ name: 'Hạt Kỳ Diệu', icon: '🌱', color: '#22c55e', price: 900, desc: 'Chiêu Cỏ mạnh +20%.', battle: { typeBoost: { grass: 1.2 } } },
    'fairy-ribbon':{ name: 'Ruy Băng Tiên', icon: '🎀', color: '#f472b6', price: 950, desc: 'Chiêu Tiên mạnh +20%.', battle: { typeBoost: { fairy: 1.2 } } },
    'dragon-fang-charm':{ name: 'Nanh Rồng', icon: '🐉', color: '#818cf8', price: 950, desc: 'Chiêu Rồng mạnh +20%.', battle: { typeBoost: { dragon: 1.2 } } },
    'spell-tag':   { name: 'Bùa Phép', icon: '👻', color: '#a855f7', price: 950, desc: 'Chiêu Ma mạnh +20%.', battle: { typeBoost: { ghost: 1.2 } } },
    'black-belt':  { name: 'Đai Đen', icon: '🥋', color: '#dc2626', price: 950, desc: 'Chiêu Đấu mạnh +20%.', battle: { typeBoost: { fighting: 1.2 } } },
    'twisted-spoon':{ name: 'Thìa Xoắn', icon: '🥄', color: '#e879f9', price: 950, desc: 'Chiêu Siêu Năng mạnh +20%.', battle: { typeBoost: { psychic: 1.2 } } },
    'hard-stone':  { name: 'Đá Cứng', icon: '🪨', color: '#a8a29e', price: 950, desc: 'Chiêu Đá mạnh +20%.', battle: { typeBoost: { rock: 1.2 } } },
    'steel-plate': { name: 'Phiến Thép', icon: '⚙️', color: '#cbd5e1', price: 950, desc: 'Chiêu Thép mạnh +20%.', battle: { typeBoost: { steel: 1.2 } } },
    'earth-plate': { name: 'Phiến Đất', icon: '⛰️', color: '#b45309', price: 950, desc: 'Chiêu Đất mạnh +20%.', battle: { typeBoost: { ground: 1.2 } } },
    'sharp-beak':  { name: 'Mỏ Nhọn', icon: '🪶', color: '#a5b4fc', price: 950, desc: 'Chiêu Bay mạnh +20%.', battle: { typeBoost: { flying: 1.2 } } },
    'poison-barb': { name: 'Gai Độc', icon: '☠️', color: '#84cc16', price: 950, desc: 'Chiêu Độc mạnh +20%.', battle: { typeBoost: { poison: 1.2 } } },
    'snow-ball':   { name: 'Cầu Tuyết', icon: '❄️', color: '#bae6fd', price: 950, desc: 'Chiêu Băng mạnh +20%.', battle: { typeBoost: { ice: 1.2 } } },
    'silver-powder':{ name: 'Bột Bạc', icon: '🐛', color: '#a3e635', price: 950, desc: 'Chiêu Côn Trùng mạnh +20%.', battle: { typeBoost: { bug: 1.2 } } },

    /* Trang bị cầm tay cao cấp: đánh đổi chỉ số, có độ bền. */
    'giant-cape':  { name: 'Áo Choàng Khổng Lồ', icon: '🦸', color: '#f87171', price: 2100, durability: 80, desc: 'HP +20, Tốc độ -4.', stats: { hp: 20, spe: -4 } },
    'mind-crown':  { name: 'Vương Miện Trí Tuệ', icon: '👑', color: '#a78bfa', price: 2200, durability: 80, desc: 'TC đặc biệt +6, Tấn công -2.', stats: { spa: 6, atk: -2 } },
    'guard-badge': { name: 'Huy Hiệu Hộ Vệ', icon: '🛡️', color: '#94a3b8', price: 2200, durability: 80, desc: 'PT đặc biệt +6, Phòng thủ -2.', stats: { spd: 6, def: -2 } },
    'swift-charm': { name: 'Bùa Tốc Hành', icon: '💨', color: '#67e8f9', price: 2000, durability: 80, desc: 'Tốc độ +8, HP -6.', stats: { spe: 8, hp: -6 } },
    'duelist-glove':{ name: 'Găng Đấu Sĩ', icon: '🥊', color: '#fb923c', price: 2300, durability: 75, desc: 'ATK +6, Chí mạng +5%, DEF -2.', stats: { atk: 6, def: -2 }, battle: { crit: 0.05 } },
    'sniper-lens': { name: 'Ống Ngắm Bắn Tỉa', icon: '🎯', color: '#facc15', price: 2500, durability: 75, desc: 'Chí mạng +10%, Chính xác +4%, PT đặc biệt -2.', stats: { spd: -2 }, battle: { crit: 0.1, acc: 0.04 } },

    /* Vật phẩm cầm tay "đổi chác": cộng một chỉ số nhưng trừ chỉ số khác.
       stats: cộng trực tiếp vào chỉ số trận đấu.
       dot:  thêm sát thương khi đối phương đang Bỏng / Độc.
       durability: độ bền, mòn dần sau mỗi trận; sửa bằng Xu theo khấu hao. */
    'power-band':  { name: 'Băng Sức Mạnh', icon: '💪', color: '#ef4444', price: 1600, durability: 90, desc: 'ATK +5, DEF -2.', stats: { atk: 5, def: -2 } },
    'iron-plate':  { name: 'Tấm Thép', icon: '🛡️', color: '#94a3b8', price: 1500, durability: 90, desc: 'DEF +4, Tốc độ -3.', stats: { def: 4, spe: -3 } },
    'scope-rim':   { name: 'Viền Ngắm', icon: '🔭', color: '#38bdf8', price: 1800, durability: 80, desc: 'Chí mạng +8%, ATK -2.', stats: { atk: -2 }, battle: { crit: 0.08 } },
    'swift-shoes': { name: 'Giày Gió', icon: '👟', color: '#a78bfa', price: 1600, durability: 90, desc: 'Tốc độ +6, DEF -3.', stats: { spe: 6, def: -3 } },
    'vital-charm': { name: 'Bùa Sinh Lực', icon: '❤️', color: '#fb7185', price: 1700, durability: 80, desc: 'HP +8, ATK -2.', stats: { hp: 8, atk: -2 } },
    'precision-gem':{ name: 'Tinh Thể Chuẩn Xác', icon: '🎯', color: '#facc15', price: 1900, durability: 80, desc: 'Độ chính xác +6%, Tốc độ -2.', stats: { spe: -2 }, battle: { acc: 0.06 } },
    'burn-claw':   { name: 'Vuốt Rực', icon: '🔥', color: '#fb923c', price: 2000, durability: 70, desc: '+18% sát thương với mục tiêu đang Bỏng, SP.ATK -2.', stats: { spa: -2 }, dot: { burn: 0.18 } },
    'toxic-fang':  { name: 'Răng Độc', icon: '🐍', color: '#84cc16', price: 2000, durability: 70, desc: '+20% sát thương với mục tiêu đang Độc, DEF -3.', stats: { def: -3 }, dot: { poison: 0.2, toxic: 0.2 } },
    'guardian-shell':{ name: 'Giáp Hộ Vệ', icon: '🐚', color: '#7dd3fc', price: 2200, durability: 70, desc: 'DEF +6, SP.DEF +3, ATK -4.', stats: { def: 6, spd: 3, atk: -4 } },
    'berserk-ring':{ name: 'Nhẫn Cuồng Nộ', icon: '💍', color: '#f43f5e', price: 2600, durability: 60, desc: 'ATK +8, DEF -5, Tốc độ -2.', stats: { atk: 8, def: -5, spe: -2 } },
    'blaze-orb':   { name: 'Hỏa Cầu', icon: '🔆', color: '#f97316', price: 2400, durability: 60, desc: 'ATK +3, +14% sát thương với mục tiêu đang Bỏng, SP.DEF -4.', stats: { atk: 3, spd: -4 }, dot: { burn: 0.14 } },
    'venom-gland': { name: 'Tuyến Độc', icon: '🧪', color: '#22c55e', price: 2300, durability: 60, desc: 'Tốc độ +2, +22% sát thương với mục tiêu đang Độc, HP -3.', stats: { spe: 2, hp: -3 }, dot: { poison: 0.22, toxic: 0.22 } }
  };

  /* Exp tiêu hao: lên cấp không giới hạn, mỗi cấp cộng ngẫu nhiên 1 chỉ số. */
  const EXP_ITEMS = {
    'exp-small': { name: 'Exp Nhỏ', icon: '🔹', color: '#38bdf8', price: 400, amount: 100, desc: '+100 EXP. Mỗi cấp cộng ngẫu nhiên 1 chỉ số.' },
    'exp-medium':{ name: 'Exp Trung Bình', icon: '🔷', color: '#60a5fa', price: 1200, amount: 600, desc: '+600 EXP. Mỗi cấp cộng ngẫu nhiên 1 chỉ số.' },
    'exp-large': { name: 'Exp Lớn', icon: '💠', color: '#818cf8', price: 4000, amount: 3000, desc: '+3.000 EXP. Mỗi cấp cộng ngẫu nhiên 1 chỉ số.' },
    'exp-max':   { name: 'Exp Cực Đại', icon: '🌟', color: '#fde047', price: 14000, amount: 15000, desc: '+15.000 EXP. Mỗi cấp cộng ngẫu nhiên 1 chỉ số.' }
  };

  /* TM: mua ở chợ / rơi từ boss */
  const TM_MOVES = [
    'flamethrower', 'ice_beam', 'thunderbolt', 'surf', 'earthquake', 'psychic', 'shadow_ball',
    'dragon_claw', 'crunch', 'iron_head', 'moonblast', 'close_combat', 'energy_ball', 'sludge_bomb',
    'brave_bird', 'stone_edge', 'x_scissor', 'dark_pulse', 'flash_cannon', 'solar_beam'
  ].filter(id => PG.MOVES[id]);

  const TMS = {};
  TM_MOVES.forEach((mid, i) => {
    const mv = PG.MOVES[mid];
    TMS['tm-' + mid] = {
      name: 'TM ' + mv.name, icon: '💿', color: PG.TYPES[mv.type].color, price: 1200 + (i % 4) * 300,
      move: mid, desc: 'Dạy chiêu ' + mv.name + ' (' + PG.TYPES[mv.type].name + ').'
    };
  });

  const KEY_ITEMS = {
    'temple-key':      { name: 'Chìa Khóa Đền Cổ', icon: '🗝️', color: '#fcd34d', price: 0, desc: 'Dùng để triệu hồi Pokémon huyền thoại tại Đền Cổ.' },
    'raid-pass':       { name: 'Vé Raid', icon: '🎟️', color: '#f472b6', price: 800, desc: 'Mở một trận Boss Raid.' },
    'mutation-serum':  { name: 'Chất Đột Biến', icon: '🧬', color: '#a855f7', price: 5000, desc: 'Thử đột biến cho một Pokémon tại Phòng Nghiên Cứu.' },
    'lucky-clover':    { name: 'Đá Cỏ Bốn Lá', icon: '🍀', color: '#22c55e', price: 3000, desc: 'Nguyên liệu khắc May mắn cho trang bị.' },
    'protection-charm':{ name: 'Bùa Bảo Vệ', icon: '🧿', color: '#38bdf8', price: 2500, desc: 'Bảo vệ trang bị khỏi tụt cấp khi nâng cấp thất bại.' },
    incubator:         { name: 'Lò Ấp', icon: '🧫', color: '#fb923c', price: 1500, desc: 'Cần để ấp trứng. Dùng một lần mỗi trứng.' },
    'shiny-charm':     { name: 'Bùa Shiny', icon: '✨', color: '#ffd86b', price: 15000, desc: 'Tăng nhẹ tỉ lệ gặp Shiny vĩnh viễn.' },
    'bag-upgrade':     { name: 'Nâng Cấp Túi', icon: '🎒', color: '#a16207', price: 3000, desc: '+50 sức chứa túi.' },
    'crystal-shard':   { name: 'Mảnh Tinh Thể Vỡ', icon: '💠', color: '#67e8f9', price: 0, desc: 'Hiếm. Dùng tại Phòng Nghiên Cứu để đổi tính cách hoặc đặc tính.' }
  };

  const EGG_POOLS = {
    2:  ['bulbasaur', 'charmander', 'squirtle', 'caterpie', 'pidgey', 'pikachu', 'oddish', 'meowth', 'growlithe', 'poliwag', 'abra', 'machop', 'geodude', 'magikarp', 'goldeen', 'marill', 'wooper', 'swinub', 'snorunt', 'spheal', 'clefairy', 'eevee'],
    5:  ['ivysaur', 'charmeleon', 'wartortle', 'butterfree', 'pikachu', 'vulpix', 'growlithe', 'slowpoke', 'magnemite', 'gastly', 'onix', 'rhyhorn', 'horsea', 'staryu', 'scyther', 'lapras', 'eevee', 'houndour', 'larvitar', 'ralts', 'beldum', 'gible', 'riolu', 'zorua', 'larvesta', 'mimikyu', 'feebas'],
    10: ['venusaur', 'charizard', 'blastoise', 'snorlax', 'lapras', 'gyarados', 'milotic', 'dragonite', 'tyranitar', 'metagross', 'garchomp', 'volcarona', 'lucario', 'gardevoir']
  };

  /* 🥚 Chỉ bán một loại trứng: random. Mua trong tab 🎁 Vật Phẩm của Chợ. */
  const EGG_TYPES = {};
  EGG_TYPES.random = {
    id: 'random', name: 'Trứng Ngẫu Nhiên', icon: '🥚', type: null,
    price: 600, km: 2, desc: 'Nở ra bất kỳ loài nào trong bể trứng. Mua tại Chợ → 🎁 Vật Phẩm.',
    color: '#fbbf24'
  };
  EGG_TYPES.random.pool = Array.from(new Set(Object.values(EGG_POOLS).reduce((a, b) => a.concat(b), [])))
    .filter(id => PG.SPECIES[id]);

  const SHOP_BASE = [
    'pokeball', 'greatball', 'ultraball', 'netball', 'duskball', 'timerball', 'quickball', 'healball',
    'razz', 'nanab', 'pinap', 'sweetberry', 'sunberry', 'harmonyberry', 'potion', 'superpotion', 'hyperpotion', 'maxpotion', 'revive', 'maxrevive', 'fullheal', 'fullrestore',
    'energy', 'energyplus', 'exp-small', 'exp-medium', 'exp-large',
    'incubator', 'worm', 'dough', 'fragrant', 'ice', 'dragon', 'lucky-clover', 'protection-charm'
  ];

  /* Danh mục cố định trong cửa hàng vật phẩm Pokémon (không phụ thuộc lượt random ngày). */
  const CATALOG = {
    /* Nhu yếu phẩm: luôn bán đủ, không phụ thuộc lượt random hằng ngày. */
    essentials: Array.from(new Set([
      ...Object.keys(BALLS).filter(id => !BALLS[id].raidOnly), ...Object.keys(BERRIES), ...Object.keys(BAITS),
      ...Object.keys(RODS), ...Object.keys(MEDICINES), ...Object.keys(EXP_ITEMS),
      ...Object.keys(MATERIALS),
      'incubator', 'lucky-clover', 'protection-charm', 'raid-pass', 'mutation-serum'
    ])),
    held: [
      'power-band', 'iron-plate', 'scope-rim', 'swift-shoes', 'vital-charm', 'precision-gem',
      'burn-claw', 'toxic-fang', 'guardian-shell', 'berserk-ring', 'blaze-orb', 'venom-gland',
      'choice-band', 'scope-lens', 'leftovers', 'focus-sash', 'quick-claw', 'life-orb',
      'lucky-egg', 'amulet-coin', 'silk-scarf', 'charcoal', 'mystic-water', 'magnet', 'miracle-seed',
      'fairy-ribbon', 'dragon-fang-charm', 'spell-tag', 'black-belt', 'twisted-spoon', 'hard-stone',
      'steel-plate', 'earth-plate', 'sharp-beak', 'poison-barb', 'snow-ball', 'silver-powder',
      'giant-cape', 'mind-crown', 'guard-badge', 'swift-charm', 'duelist-glove', 'sniper-lens'
    ],
    exp: ['exp-small', 'exp-medium', 'exp-large', 'exp-max'],
    heal: ['potion', 'teampotion', 'superpotion', 'hyperpotion', 'maxpotion', 'revive', 'maxrevive', 'fullheal', 'fullrestore', 'energy', 'energyplus'],
    stone: [
      'fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone', 'sun-stone', 'ice-stone',
      'fairy-stone', 'dusk-stone', 'metal-coat', 'dragon-scale', 'protector', 'prism-scale', 'razor-claw',
      'mega-stone-x', 'mega-stone-y', 'mega-stone-v', 'mega-stone-g', 'mega-stone-t', 'mega-stone-a',
      'giganta-core', 'aura-core', 'armor-shard', 'origin-shard', 'star-badge', 'ultra-ring'
    ]
  };

  PG.BALLS = BALLS;
  PG.BERRIES = BERRIES;
  PG.MEDICINES = MEDICINES;
  PG.MATERIALS = MATERIALS;
  PG.STONES = STONES;
  PG.RODS = RODS;
  PG.BAITS = BAITS;
  PG.HELD_ITEMS = HELD_ITEMS;
  PG.EXP_ITEMS = EXP_ITEMS;
  PG.TMS = TMS;
  PG.KEY_ITEMS = KEY_ITEMS;
  PG.EGG_POOLS = EGG_POOLS;
  PG.EGG_TYPES = EGG_TYPES;
  PG.SHOP_BASE = SHOP_BASE;
  PG.CATALOG = CATALOG;

  /* ---------- HỘP QUÀ BÍ ẨN (xuất hiện ngẫu nhiên trong Chợ) ----------
     Mỗi hộp là một gói giá rẻ / trung / cao. Giá niêm yết cố định theo tier,
     còn giá trị bên trong dao động theo may mắn: có hộp lời, có hộp lỗ. */
  const GIFT_BOXES = [
    {
      id: 'cheap', tier: 'cheap', name: 'Hộp Quà Bình Dân', icon: '🎁', color: '#86efac',
      price: 400, minLevel: 1, itemMin: 150, itemMax: 900, items: 1,
      desc: 'Gói rẻ — thường là bóng, mồi, thuốc hoặc quả. May mắn có thể lời gấp đôi.'
    },
    {
      id: 'medium', tier: 'medium', name: 'Hộp Quà Trung Cấp', icon: '🎁', color: '#7dd3fc',
      price: 1800, minLevel: 8, itemMin: 700, itemMax: 3200, items: 2,
      desc: 'Gói trung — vài món giá trị vừa, thỉnh thoảng kèm Exp hoặc đồ cầm tay.'
    },
    {
      id: 'high', tier: 'high', name: 'Hộp Quà Cao Cấp', icon: '🎁', color: '#fcd34d',
      price: 6000, minLevel: 18, itemMin: 2200, itemMax: 12000, items: 3,
      desc: 'Gói cao — nhiều món đắt giá, có cơ hội kèm trang bị hiếm.'
    }
  ];
  const GIFT_BOX_BY_ID = {};
  GIFT_BOXES.forEach(b => { GIFT_BOX_BY_ID[b.id] = b; GIFT_BOX_BY_ID[b.tier] = b; });
  PG.GIFT_BOXES = GIFT_BOXES;
  PG.giftBoxDef = function (id) { return GIFT_BOX_BY_ID[id] || null; };

  PG.itemInfo = function (id) {
    if (BALLS[id]) return Object.assign({ id, kind: 'ball' }, BALLS[id]);
    if (BERRIES[id]) return Object.assign({ id, kind: 'berry' }, BERRIES[id]);
    if (MEDICINES[id]) return Object.assign({ id, kind: 'medicine' }, MEDICINES[id]);
    if (MATERIALS[id]) return Object.assign({ id, kind: 'material' }, MATERIALS[id]);
    if (STONES[id]) return Object.assign({ id, kind: 'stone' }, STONES[id]);
    if (RODS[id]) return Object.assign({ id, kind: 'rod' }, RODS[id]);
    if (BAITS[id]) return Object.assign({ id, kind: 'bait' }, BAITS[id]);
    if (HELD_ITEMS[id]) return Object.assign({ id, kind: 'held' }, HELD_ITEMS[id]);
    if (EXP_ITEMS[id]) return Object.assign({ id, kind: 'exp' }, EXP_ITEMS[id]);
    if (TMS[id]) return Object.assign({ id, kind: 'tm' }, TMS[id]);
    if (KEY_ITEMS[id]) return Object.assign({ id, kind: 'key' }, KEY_ITEMS[id]);
    if (id && id.startsWith('tm-') && PG.MOVES[id.slice(3)]) {
      const mv = PG.MOVES[id.slice(3)];
      return { id, kind: 'tm', name: 'TM ' + mv.name, icon: '💿', color: PG.TYPES[mv.type].color, move: id.slice(3), price: 1500, desc: 'Dạy chiêu ' + mv.name + '.' };
    }
    return { id, name: id, icon: '❓', color: '#888', kind: 'misc', desc: '' };
  };

  /** Vật phẩm cầm tay chỉ có tác dụng khi còn độ bền (đồ cũ không có durability thì luôn dùng được). */
  PG.heldEffects = function (holder) {
    const id = holder && holder.heldItem;
    const item = id && HELD_ITEMS[id];
    if (!item) return null;
    if (item.durability && typeof holder.heldDur === 'number' && holder.heldDur <= 0) return null;
    return item;
  };
})();
