/* ============================================================
   CÔNG THỨC CHẾ TẠO
   mats: vật phẩm/nguyên liệu tiêu hao (id -> số lượng)
   out:  vật phẩm nhận được
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const R = (id, name, icon, category, out, mats, coins, desc, unlock) => ({
    id, name, icon, category, out, mats, coins: coins || 0, desc: desc || '', unlock: unlock || 1
  });

  const RECIPES = {
    /* ---------- BÓNG ---------- */
    greatball:   R('greatball', 'Great Ball', '🔵', 'ball', { greatball: 1 }, { pokeball: 2, stone: 2 }, 100, 'Nâng cấp Poké Ball thành Great Ball.', 4),
    ultraball:   R('ultraball', 'Ultra Ball', '🟡', 'ball', { ultraball: 1 }, { greatball: 2, crystal: 3 }, 400, 'Nâng cấp Great Ball thành Ultra Ball.', 9),
    netball:     R('netball', 'Net Ball', '🟢', 'ball', { netball: 1 }, { pokeball: 2, seed: 2 }, 300, 'Bóng chuyên bắt hệ Nước / Bọ.', 6),
    duskball:    R('duskball', 'Dusk Ball', '⚫', 'ball', { duskball: 1 }, { pokeball: 2, crystal: 2 }, 300, 'Bóng mạnh trong hang tối / ban đêm.', 6),
    timerball:   R('timerball', 'Timer Ball', '⏱️', 'ball', { timerball: 1 }, { pokeball: 2, feather: 2 }, 300, 'Càng lâu càng mạnh.', 8),
    quickball:   R('quickball', 'Quick Ball', '⚡', 'ball', { quickball: 1 }, { pokeball: 2, sand: 2 }, 300, 'Mạnh ở lượt ném đầu.', 8),
    healball:    R('healball', 'Heal Ball', '💗', 'ball', { healball: 1 }, { pokeball: 2, seed: 2, shell: 1 }, 250, 'Hồi HP sau khi bắt.', 5),
    celestialball:R('celestialball', 'Thiên Cầu', '🌟', 'ball', { celestialball: 1 }, { ultraball: 2, relic: 3, crystal: 1 }, 2000, 'Bóng đặc biệt bắt được hệ Thiên.', 20),
    masterball:  R('masterball', 'Master Ball', '🟣', 'ball', { masterball: 1 }, { ultraball: 5, crystal: 5, relic: 5 }, 10000, 'Bóng bắt chắc chắn. Cực hiếm.', 30),

    /* ---------- QUẢ ---------- */
    razz:        R('razz', 'Razz Berry', '🍓', 'berry', { razz: 1 }, { seed: 2 }, 50, 'Tăng tỉ lệ bắt.', 1),
    nanab:       R('nanab', 'Nanab Berry', '🍌', 'berry', { nanab: 1 }, { seed: 2, shell: 1 }, 50, 'Làm Pokémon đứng yên.', 1),
    pinap:       R('pinap', 'Pinap Berry', '🍍', 'berry', { pinap: 1 }, { seed: 2, leather: 1 }, 80, 'Nhân đôi Kẹo.', 1),
    goldenrazz:  R('goldenrazz', 'Golden Razz', '🌟', 'berry', { goldenrazz: 1 }, { razz: 3, crystal: 1 }, 200, 'Tăng mạnh tỉ lệ bắt.', 10),
    silverpinap: R('silverpinap', 'Silver Pinap', '🥈', 'berry', { silverpinap: 1 }, { pinap: 2, crystal: 1 }, 250, 'Tăng tỉ lệ bắt và x3 Kẹo.', 12),
    sweetberry:   R('sweetberry', 'Berry Ngọt', '🍒', 'berry', { sweetberry: 1 }, { razz: 1, seed: 2, shell: 1 }, 150, 'Tăng thiện cảm và tỉ lệ bắt.', 3),
    sunberry:     R('sunberry', 'Berry Nắng', '🍊', 'berry', { sunberry: 1 }, { sweetberry: 2, ember: 1, crystal: 1 }, 350, 'Tăng thiện cảm nhiều hơn Berry Ngọt.', 8),
    harmonyberry: R('harmonyberry', 'Berry Hòa Hợp', '🍑', 'berry', { harmonyberry: 1 }, { sunberry: 2, feather: 2, crystal: 2 }, 600, 'Berry cao cấp: thiện cảm và bắt cực tốt.', 12),

    /* ---------- THUỐC ---------- */
    potion:      R('potion', 'Potion', '🧪', 'medicine', { potion: 1 }, { seed: 2 }, 50, 'Hồi 20 HP.', 1),
    superpotion: R('superpotion', 'Super Potion', '🧴', 'medicine', { superpotion: 1 }, { potion: 2, shell: 1 }, 100, 'Hồi 60 HP.', 4),
    hyperpotion: R('hyperpotion', 'Hyper Potion', '🍶', 'medicine', { hyperpotion: 1 }, { superpotion: 2, crystal: 1 }, 300, 'Hồi 150 HP.', 10),
    revive:      R('revive', 'Revive', '💫', 'medicine', { revive: 1 }, { crystal: 1, shell: 2 }, 300, 'Hồi sinh với 50% HP.', 8),
    maxpotion:   R('maxpotion', 'Max Potion', '💚', 'medicine', { maxpotion: 1 }, { hyperpotion: 2, crystal: 2, shell: 1 }, 700, 'Hồi đầy HP cho một Pokémon.', 16),
    maxrevive:   R('maxrevive', 'Max Revive', '🌠', 'medicine', { maxrevive: 1 }, { revive: 2, crystal: 3, relic: 1 }, 1400, 'Hồi sinh với đầy HP.', 18),
    fullheal:    R('fullheal', 'Full Heal', '🧼', 'medicine', { fullheal: 1 }, { potion: 1, seed: 2, crystal: 1 }, 250, 'Chữa mọi trạng thái bất thường.', 6),
    fullrestore: R('fullrestore', 'Full Restore', '💖', 'medicine', { fullrestore: 1 }, { maxpotion: 1, fullheal: 2, crystal: 2 }, 1600, 'Hồi đầy HP và chữa trạng thái.', 20),
    teampotion:  R('teampotion', 'Bình Hồi Phục Nhanh', '🧰', 'medicine', { teampotion: 1 }, { potion: 4, shell: 2, crystal: 1 }, 900, 'Hồi đầy HP và chữa trạng thái cho cả đội.', 14),
    energy:      R('energy', 'Nước Tăng Lực', '🥤', 'medicine', { energy: 1 }, { seed: 2, shell: 1 }, 120, 'Hồi 30 Thể lực.', 3),
    energyplus:  R('energyplus', 'Nước Tăng Lực Cao Cấp', '🧃', 'medicine', { energyplus: 1 }, { energy: 2, crystal: 2, feather: 1 }, 500, 'Hồi đầy Thể lực.', 10),

    /* ---------- NGUYÊN LIỆU QUÝ ---------- */
    'lucky-clover':    R('lucky-clover', 'Đá Cỏ Bốn Lá', '🍀', 'special', { 'lucky-clover': 1 }, { feather: 3, crystal: 1 }, 500, 'Dùng khắc May mắn trang bị.', 5),
    'protection-charm':R('protection-charm', 'Bùa Bảo Vệ', '🧿', 'special', { 'protection-charm': 1 }, { shell: 3, crystal: 1 }, 500, 'Bảo vệ trang bị khi nâng cấp thất bại.', 5),
    incubator:         R('incubator', 'Lò Ấp', '🧫', 'special', { incubator: 1 }, { leather: 2, crystal: 2 }, 300, 'Cần để ấp trứng.', 2),
    'temple-key':      R('temple-key', 'Chìa Khóa Đền Cổ', '🗝️', 'special', { 'temple-key': 1 }, { relic: 3, crystal: 2 }, 2000, 'Triệu hồi huyền thoại tại Đền Cổ.', 20),
    'raid-pass':       R('raid-pass', 'Vé Raid', '🎟️', 'special', { 'raid-pass': 1 }, { ember: 2, shell: 2 }, 500, 'Mở trận Boss Raid.', 10),
    'mutation-serum':  R('mutation-serum', 'Chất Đột Biến', '🧬', 'special', { 'mutation-serum': 1 }, { crystal: 3, relic: 2 }, 2000, 'Thử đột biến cho Pokémon.', 15),
    'bag-upgrade':     R('bag-upgrade', 'Nâng Cấp Túi', '🎒', 'special', { 'bag-upgrade': 1 }, { leather: 5, feather: 3 }, 1000, '+50 sức chứa túi.', 8),
    'shiny-charm':     R('shiny-charm', 'Bùa Shiny', '✨', 'special', { 'shiny-charm': 1 }, { 'lucky-clover': 2, relic: 2, crystal: 4 }, 6000, 'Tăng nhẹ tỉ lệ gặp Shiny vĩnh viễn.', 22),
    'crystal-shard':   R('crystal-shard', 'Mảnh Tinh Thể Vỡ', '💠', 'special', { 'crystal-shard': 1 }, { crystal: 6, relic: 1 }, 2500, 'Đổi tính cách / đặc tính tại Phòng Nghiên Cứu.', 12),

    /* ---------- KINH NGHIỆM ---------- */
    'exp-small':  R('exp-small', 'Exp Nhỏ', '🔹', 'special', { 'exp-small': 1 }, { dust: 30, seed: 1 }, 200, 'Đóng gói Bụi Sao thành +100 EXP.', 3),
    'exp-medium': R('exp-medium', 'Exp Trung Bình', '🔷', 'special', { 'exp-medium': 1 }, { 'exp-small': 4, crystal: 2 }, 700, 'Gói EXP cỡ trung, +600 EXP.', 9),
    'exp-large':  R('exp-large', 'Exp Lớn', '💠', 'special', { 'exp-large': 1 }, { 'exp-medium': 4, relic: 1 }, 2600, 'Gói EXP lớn, +3.000 EXP.', 16),
    'exp-max':    R('exp-max', 'Exp Cực Đại', '🌟', 'special', { 'exp-max': 1 }, { 'exp-large': 4, relic: 3, crystal: 5 }, 9000, 'Gói EXP cực đại, +15.000 EXP.', 26),

    /* ---------- ĐÁ TIẾN HÓA ---------- */
    'fire-stone':    R('fire-stone', 'Đá Lửa', '🔥', 'stone', { 'fire-stone': 1 }, { ember: 3, stone: 1 }, 1000, 'Tiến hóa Pokémon hệ Lửa.', 8),
    'water-stone':   R('water-stone', 'Đá Nước', '💧', 'stone', { 'water-stone': 1 }, { shell: 3, crystal: 1 }, 1000, 'Tiến hóa Pokémon hệ Nước.', 8),
    'thunder-stone': R('thunder-stone', 'Đá Sấm', '⚡', 'stone', { 'thunder-stone': 1 }, { crystal: 2, stone: 2 }, 1000, 'Tiến hóa Pokémon hệ Điện.', 8),
    'leaf-stone':    R('leaf-stone', 'Đá Lá', '🌿', 'stone', { 'leaf-stone': 1 }, { seed: 3, stone: 1 }, 1000, 'Tiến hóa Pokémon hệ Cỏ.', 8),
    'moon-stone':    R('moon-stone', 'Đá Mặt Trăng', '🌙', 'stone', { 'moon-stone': 1 }, { crystal: 2, feather: 2 }, 1200, 'Tiến hóa Pokémon hệ Tiên.', 10),
    'ice-stone':     R('ice-stone', 'Đá Băng', '❄️', 'stone', { 'ice-stone': 1 }, { ice: 3, crystal: 1 }, 1200, 'Tiến hóa Pokémon hệ Băng.', 12),
    'dusk-stone':    R('dusk-stone', 'Đá Hoàng Hôn', '🌆', 'stone', { 'dusk-stone': 1 }, { crystal: 2, ember: 2 }, 1200, 'Tiến hóa Pokémon bóng đêm.', 12),
    'sun-stone':     R('sun-stone', 'Đá Mặt Trời', '☀️', 'stone', { 'sun-stone': 1 }, { crystal: 3, ember: 2 }, 1600, 'Tiến hóa trong ánh sáng mặt trời.', 12),
    'fairy-stone':   R('fairy-stone', 'Đá Tiên', '✨', 'stone', { 'fairy-stone': 1 }, { crystal: 3, feather: 3 }, 1800, 'Tiến hóa Pokémon hệ Tiên.', 14),
    'metal-coat':    R('metal-coat', 'Áo Kim Loại', '⚙️', 'stone', { 'metal-coat': 1 }, { stone: 6, crystal: 2 }, 2200, 'Tiến hóa Onix / Scyther.', 14),
    'dragon-scale':  R('dragon-scale', 'Vảy Rồng', '🐉', 'stone', { 'dragon-scale': 1 }, { relic: 2, crystal: 4, ember: 2 }, 3000, 'Tiến hóa Seadra thành Kingdra.', 18),
    'protector':     R('protector', 'Khiên Bảo Vệ', '🛡️', 'stone', { 'protector': 1 }, { relic: 2, stone: 6, crystal: 2 }, 3000, 'Tiến hóa Rhydon thành Rhyperior.', 18),
    'prism-scale':   R('prism-scale', 'Vảy Lăng Kính', '🌈', 'stone', { 'prism-scale': 1 }, { relic: 2, crystal: 4, shell: 4 }, 3000, 'Tiến hóa Feebas thành Milotic.', 18),
    'razor-claw':    R('razor-claw', 'Vuốt Sắc', '🗡️', 'stone', { 'razor-claw': 1 }, { stone: 5, feather: 4, crystal: 2 }, 2500, 'Tiến hóa bằng vuốt sắc lạnh.', 16),
    'mega-stone-x':  R('mega-stone-x', 'Đá Mega X', '🔶', 'stone', { 'mega-stone-x': 1 }, { relic: 4, ember: 6, crystal: 6 }, 9000, 'Kích hoạt Mega X của Charizard.', 24),
    'mega-stone-y':  R('mega-stone-y', 'Đá Mega Y', '🔷', 'stone', { 'mega-stone-y': 1 }, { relic: 4, feather: 6, crystal: 6 }, 9000, 'Kích hoạt Mega Y của Charizard.', 24),
    'mega-stone-v':  R('mega-stone-v', 'Đá Mega V', '🟢', 'stone', { 'mega-stone-v': 1 }, { relic: 4, seed: 8, crystal: 6 }, 9000, 'Kích hoạt Mega Venusaur.', 24),
    'mega-stone-g':  R('mega-stone-g', 'Đá Mega G', '🟣', 'stone', { 'mega-stone-g': 1 }, { relic: 4, crystal: 8, ember: 4 }, 9000, 'Kích hoạt Mega Gengar / Garchomp.', 24),
    'mega-stone-t':  R('mega-stone-t', 'Đá Mega T', '🟤', 'stone', { 'mega-stone-t': 1 }, { relic: 5, stone: 8, crystal: 4 }, 9000, 'Kích hoạt Mega Tyranitar.', 24),
    'mega-stone-a':  R('mega-stone-a', 'Đá Mega A', '⚫', 'stone', { 'mega-stone-a': 1 }, { relic: 4, feather: 8, crystal: 5 }, 9000, 'Kích hoạt Mega Altaria / Absol.', 24),
    'giganta-core':  R('giganta-core', 'Lõi Gigantamax', '🌀', 'stone', { 'giganta-core': 1 }, { relic: 6, crystal: 10, ember: 8 }, 12000, 'Lõi năng lượng cho dạng khổng lồ.', 28),
    'aura-core':     R('aura-core', 'Lõi Aura', '💠', 'stone', { 'aura-core': 1 }, { relic: 5, crystal: 10, feather: 6 }, 12000, 'Đánh thức aura bên trong Lucario.', 28),
    'armor-shard':   R('armor-shard', 'Mảnh Giáp Sinh Học', '🛡️', 'stone', { 'armor-shard': 1 }, { relic: 6, crystal: 8, stone: 10 }, 15000, 'Lắp dạng giáp cho Mewtwo / Lapras.', 30),
    'origin-shard':  R('origin-shard', 'Mảnh Nguyên Thủy', '🌌', 'stone', { 'origin-shard': 1 }, { relic: 8, crystal: 10, feather: 8 }, 18000, 'Đưa Eevee về dạng nguyên thủy.', 32),
    'star-badge':    R('star-badge', 'Huy Hiệu Rockstar', '🎸', 'stone', { 'star-badge': 1 }, { relic: 4, crystal: 8, feather: 6, ember: 4 }, 10000, 'Biến Pikachu thành ngôi sao sân khấu.', 24),
    'ultra-ring':    R('ultra-ring', 'Vòng Ultra', '💫', 'stone', { 'ultra-ring': 1 }, { relic: 6, crystal: 10, feather: 6 }, 14000, 'Hợp nhất mọi dạng thiết bị của Rotom.', 28),

    /* ---------- TRANG BỊ ---------- */
    'explorer-hat':    R('explorer-hat', 'Mũ Thám Hiểm', '🤠', 'equipment', { equipment: 'explorer-hat' }, { leather: 4, feather: 2 }, 400, 'Chế trang bị Thám Hiểm.', 3),
    'explorer-jacket': R('explorer-jacket', 'Áo Thám Hiểm', '🧥', 'equipment', { equipment: 'explorer-jacket' }, { leather: 6, feather: 3 }, 600, 'Chế trang bị Thám Hiểm.', 3),
    'explorer-boots':  R('explorer-boots', 'Giày Thám Hiểm', '🥾', 'equipment', { equipment: 'explorer-boots' }, { leather: 5, stone: 2 }, 500, 'Chế trang bị Thám Hiểm.', 3),
    'explorer-pack':   R('explorer-pack', 'Ba Lô Thám Hiểm', '🎒', 'equipment', { equipment: 'explorer-pack' }, { leather: 8, feather: 2 }, 700, 'Chế trang bị Thám Hiểm.', 5),
    'angler-hat':      R('angler-hat', 'Mũ Câu Cá', '👒', 'equipment', { equipment: 'angler-hat' }, { seed: 3, feather: 2 }, 300, 'Chế trang bị Câu Cá.', 3),
    'angler-vest':     R('angler-vest', 'Áo Phao', '🦺', 'equipment', { equipment: 'angler-vest' }, { leather: 3, shell: 2 }, 400, 'Chế trang bị Câu Cá.', 3),
    'angler-gloves':   R('angler-gloves', 'Găng Tay Câu', '🧤', 'equipment', { equipment: 'angler-gloves' }, { leather: 2, shell: 2 }, 300, 'Chế trang bị Câu Cá.', 3),
    'blaze-helm':      R('blaze-helm', 'Mũ Hỏa Diệm', '⛑️', 'equipment', { equipment: 'blaze-helm' }, { ember: 4, leather: 2 }, 800, 'Chế trang bị Hỏa Diệm.', 10),
    'blaze-armor':     R('blaze-armor', 'Áo Hỏa Diệm', '🦺', 'equipment', { equipment: 'blaze-armor' }, { ember: 6, stone: 3 }, 1200, 'Chế trang bị Hỏa Diệm.', 10),
    'frost-hood':      R('frost-hood', 'Mũ Băng Giá', '🎿', 'equipment', { equipment: 'frost-hood' }, { ice: 4, leather: 2 }, 800, 'Chế trang bị Băng Giá.', 14),
    'frost-coat':      R('frost-coat', 'Áo Băng Giá', '🧥', 'equipment', { equipment: 'frost-coat' }, { ice: 6, feather: 3 }, 1200, 'Chế trang bị Băng Giá.', 14),
    'storm-cap':       R('storm-cap', 'Mũ Bão Cát', '🥽', 'equipment', { equipment: 'storm-cap' }, { sand: 5, feather: 3 }, 1000, 'Chế trang bị Bão Tố.', 12),
    'storm-cloak':     R('storm-cloak', 'Áo Bão Cát', '🥼', 'equipment', { equipment: 'storm-cloak' }, { sand: 6, leather: 3 }, 1100, 'Chế trang bị Bão Tố.', 12),
    'lucky-cap':       R('lucky-cap', 'Mũ May Mắn', '🧢', 'equipment', { equipment: 'lucky-cap' }, { feather: 5, 'lucky-clover': 1 }, 1500, 'Chế trang bị May Mắn.', 10),
    'wind-shoes':      R('wind-shoes', 'Giày Gió', '👟', 'equipment', { equipment: 'wind-shoes' }, { feather: 6, crystal: 2 }, 2000, 'Chế trang bị May Mắn.', 12),
    'camera-glasses':  R('camera-glasses', 'Kính Săn Ảnh', '📷', 'equipment', { equipment: 'camera-glasses' }, { crystal: 3, feather: 4 }, 2200, 'Chế trang bị May Mắn.', 14),
    'clover-ring':     R('clover-ring', 'Nhẫn Cỏ Bốn Lá', '💍', 'equipment', { equipment: 'clover-ring' }, { 'lucky-clover': 3, relic: 2, crystal: 3 }, 8000, 'Chế trang bị Huyền Thoại.', 20),
    'four-leaf-brooch':R('four-leaf-brooch', 'Trâm Cỏ Bốn Lá', '🍀', 'equipment', { equipment: 'four-leaf-brooch' }, { 'lucky-clover': 5, relic: 3, crystal: 4 }, 12000, 'Chế trang bị Huyền Thoại.', 24),

    /* ---------- TRANG BỊ VÔ ĐỊCH / THẦN THOẠI (endgame) ---------- */
    'champion-crown':    R('champion-crown', 'Miện Vô Địch', '👑', 'equipment', { equipment: 'champion-crown' }, { relic: 4, crystal: 6, feather: 6 }, 16000, 'Chế trang bị Bộ Vô Địch.', 40),
    'champion-robe':     R('champion-robe', 'Áo Choàng Vô Địch', '🥋', 'equipment', { equipment: 'champion-robe' }, { relic: 5, leather: 12, crystal: 5 }, 18000, 'Chế trang bị Bộ Vô Địch.', 40),
    'champion-boots':    R('champion-boots', 'Giày Vô Địch', '🥾', 'equipment', { equipment: 'champion-boots' }, { relic: 3, feather: 8, crystal: 4 }, 15000, 'Chế trang bị Bộ Vô Địch.', 38),
    'champion-gauntlets':R('champion-gauntlets', 'Găng Vô Địch', '🥊', 'equipment', { equipment: 'champion-gauntlets' }, { relic: 3, leather: 8, ember: 6 }, 15000, 'Chế trang bị Bộ Vô Địch.', 38),
    'champion-scope':    R('champion-scope', 'Kính Vô Địch', '🔭', 'equipment', { equipment: 'champion-scope' }, { relic: 4, crystal: 8, feather: 4 }, 16000, 'Chế trang bị Bộ Vô Địch.', 40),
    'champion-pack':     R('champion-pack', 'Ba Lô Vô Địch', '🎒', 'equipment', { equipment: 'champion-pack' }, { relic: 4, leather: 15, feather: 6 }, 17000, 'Chế trang bị Bộ Vô Địch.', 40),
    'champion-belt':     R('champion-belt', 'Đai Vô Địch', '🏆', 'equipment', { equipment: 'champion-belt' }, { relic: 8, crystal: 10, 'lucky-clover': 4 }, 30000, 'Chế trang bị Bộ Vô Địch.', 45),
    'mythic-halo':       R('mythic-halo', 'Hào Quang Thần Thoại', '😇', 'equipment', { equipment: 'mythic-halo' }, { relic: 10, crystal: 12, 'lucky-clover': 3 }, 40000, 'Chế trang bị Bộ Thần Thoại.', 50),
    'mythic-shroud':     R('mythic-shroud', 'Áo Choàng Thần Thoại', '🌌', 'equipment', { equipment: 'mythic-shroud' }, { relic: 10, leather: 20, crystal: 10 }, 40000, 'Chế trang bị Bộ Thần Thoại.', 50),
    'mythic-eye':        R('mythic-eye', 'Mắt Thần Thoại', '👁️', 'equipment', { equipment: 'mythic-eye' }, { relic: 8, crystal: 14, feather: 10 }, 38000, 'Chế trang bị Bộ Thần Thoại.', 50),
    'mythic-core':       R('mythic-core', 'Lõi Thần Thoại', '💠', 'equipment', { equipment: 'mythic-core' }, { relic: 12, crystal: 16, ember: 10 }, 50000, 'Chế trang bị Bộ Thần Thoại.', 52)
  };

  function rodUpgradeCost(level) {
    const n = level + 1;
    return {
      coins: Math.round(600 * Math.pow(n, 1.5)),
      mats: { shell: 2 + level, stone: 1 + Math.floor(level / 2) }
    };
  }

  PG.RECIPES = RECIPES;
  PG.RECIPE_LIST = Object.values(RECIPES);
  PG.rodUpgradeCost = rodUpgradeCost;
})();
