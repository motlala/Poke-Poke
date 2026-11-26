/* ============================================================
   CHIÊU THỨC (MOVES)
   Thêm chiêu mới: thêm object vào MOVES + gán vào TYPE_MOVES
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const M = (id, name, type, category, power, accuracy, pp, extra) => Object.assign({
    id, name, type, category, power, accuracy, pp,
    priority: 0, critBoost: 0, flags: {}, effect: null,
    desc: ''
  }, extra || {});

  const MOVES = {
    /* ---------- THƯỜNG ---------- */
    tackle: M('tackle', 'Đâm Lao', 'normal', 'physical', 40, 100, 35, { flags: { contact: true } }),
    scratch: M('scratch', 'Cào Cấu', 'normal', 'physical', 40, 100, 35, { flags: { contact: true } }),
    quick_attack: M('quick_attack', 'Đánh Nhanh', 'normal', 'physical', 40, 100, 30, { priority: 1, flags: { contact: true } }),
    body_slam: M('body_slam', 'Đè Bẹp', 'normal', 'physical', 85, 100, 15, { flags: { contact: true }, effect: { status: { id: 'paralysis', chance: 30 } } }),
    swift: M('swift', 'Sao Băng', 'normal', 'special', 60, 100, 20, { flags: { sureHit: true, noDodge: true } }),
    hyper_beam: M('hyper_beam', 'Siêu Quang', 'normal', 'special', 150, 90, 5, { flags: { recharge: true } }),
    growl: M('growl', 'Gầm Gừ', 'normal', 'status', 0, 100, 40, { effect: { stat: { target: 'foe', stat: 'atk', stages: -1 } } }),
    scary_face: M('scary_face', 'Mặt Đáng Sợ', 'normal', 'status', 0, 100, 10, { effect: { stat: { target: 'foe', stat: 'spe', stages: -2 } } }),
    recover: M('recover', 'Hồi Phục', 'normal', 'status', 0, null, 10, { effect: { heal: 0.5 } }),

    /* ---------- LỬA ---------- */
    ember: M('ember', 'Tia Lửa', 'fire', 'special', 40, 100, 25, { effect: { status: { id: 'burn', chance: 10 } } }),
    fire_fang: M('fire_fang', 'Nanh Lửa', 'fire', 'physical', 65, 95, 15, { flags: { contact: true }, effect: { status: { id: 'burn', chance: 10 }, flinch: 10 } }),
    flamethrower: M('flamethrower', 'Phun Lửa', 'fire', 'special', 90, 100, 15, { effect: { status: { id: 'burn', chance: 10 } } }),
    will_o_wisp: M('will_o_wisp', 'Lửa Ma Trơi', 'fire', 'status', 0, 85, 15, { effect: { status: { id: 'burn', chance: 100 } } }),
    flare_blitz: M('flare_blitz', 'Lao Lửa', 'fire', 'physical', 120, 100, 15, { flags: { contact: true }, effect: { recoil: 0.33, status: { id: 'burn', chance: 10 } } }),
    fire_spin: M('fire_spin', 'Xoáy Lửa', 'fire', 'special', 45, 85, 25, { effect: { status: { id: 'burn', chance: 15 } } }),

    /* ---------- NƯỚC ---------- */
    water_gun: M('water_gun', 'Súng Nước', 'water', 'special', 40, 100, 25),
    bubble_beam: M('bubble_beam', 'Tia Bong Bóng', 'water', 'special', 65, 100, 20, { effect: { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 30 } } }),
    surf: M('surf', 'Sóng Thần', 'water', 'special', 90, 100, 15),
    hydro_pump: M('hydro_pump', 'Bơm Nước', 'water', 'special', 110, 80, 5),
    aqua_jet: M('aqua_jet', 'Phóng Nước', 'water', 'physical', 40, 100, 20, { priority: 1, flags: { contact: true } }),
    waterfall: M('waterfall', 'Thác Nước', 'water', 'physical', 80, 100, 15, { effect: { flinch: 20 } }),
    aqua_ring: M('aqua_ring', 'Vòng Nước', 'water', 'status', 0, null, 20, { effect: { heal: 0.25 } }),

    /* ---------- ĐIỆN ---------- */
    thunder_shock: M('thunder_shock', 'Sốc Điện', 'electric', 'special', 40, 100, 30, { effect: { status: { id: 'paralysis', chance: 10 } } }),
    thunderbolt: M('thunderbolt', 'Sét Đánh', 'electric', 'special', 90, 100, 15, { effect: { status: { id: 'paralysis', chance: 10 } } }),
    thunder_wave: M('thunder_wave', 'Sóng Điện', 'electric', 'status', 0, 90, 20, { effect: { status: { id: 'paralysis', chance: 100 } } }),
    nuzzle: M('nuzzle', 'Cọ Xát', 'electric', 'physical', 20, 100, 20, { flags: { contact: true }, effect: { status: { id: 'paralysis', chance: 100 } } }),
    volt_tackle: M('volt_tackle', 'Điện Lao', 'electric', 'physical', 120, 100, 15, { flags: { contact: true }, effect: { recoil: 0.33, status: { id: 'paralysis', chance: 10 } } }),
    shock_wave: M('shock_wave', 'Sóng Xung Kích', 'electric', 'special', 60, null, 20, { flags: { sureHit: true, noDodge: true } }),

    /* ---------- CỎ ---------- */
    vine_whip: M('vine_whip', 'Roi Dây', 'grass', 'physical', 45, 100, 25, { flags: { contact: true } }),
    razor_leaf: M('razor_leaf', 'Lá Sắc', 'grass', 'physical', 55, 95, 25, { critBoost: 1 }),
    giga_drain: M('giga_drain', 'Hút Sinh Lực', 'grass', 'special', 75, 100, 10, { effect: { drain: 0.5 } }),
    solar_beam: M('solar_beam', 'Tia Mặt Trời', 'grass', 'special', 120, 100, 10, { flags: { charge: true } }),
    sleep_powder: M('sleep_powder', 'Phấn Ngủ', 'grass', 'status', 0, 75, 15, { effect: { status: { id: 'sleep', chance: 100 } } }),
    leech_seed: M('leech_seed', 'Hạt Hút Máu', 'grass', 'status', 0, 90, 10, { effect: { status: { id: 'leech', chance: 100 } } }),

    /* ---------- BĂNG ---------- */
    ice_shard: M('ice_shard', 'Mảnh Băng', 'ice', 'physical', 40, 100, 30, { priority: 1 }),
    ice_beam: M('ice_beam', 'Tia Băng', 'ice', 'special', 90, 100, 10, { effect: { status: { id: 'freeze', chance: 10 } } }),
    blizzard: M('blizzard', 'Bão Tuyết', 'ice', 'special', 110, 70, 5, { effect: { status: { id: 'freeze', chance: 10 } } }),
    frost_breath: M('frost_breath', 'Hơi Lạnh', 'ice', 'special', 60, 90, 15, { flags: { alwaysCrit: true } }),
    aurora_veil: M('aurora_veil', 'Màn Cực Quang', 'ice', 'status', 0, null, 20, { effect: { stat: { target: 'self', stat: 'def', stages: 2 } } }),

    /* ---------- GIÁC ĐẤU ---------- */
    karate_chop: M('karate_chop', 'Chặt Tay', 'fighting', 'physical', 50, 100, 25, { critBoost: 1, flags: { contact: true } }),
    brick_break: M('brick_break', 'Đấm Phá', 'fighting', 'physical', 75, 100, 15, { flags: { contact: true } }),
    close_combat: M('close_combat', 'Cận Chiến', 'fighting', 'physical', 120, 100, 5, { flags: { contact: true }, effect: { stat: { target: 'self', stat: 'def', stages: -1 } } }),
    dynamic_punch: M('dynamic_punch', 'Đấm Động', 'fighting', 'physical', 100, 50, 5, { flags: { contact: true }, effect: { status: { id: 'confusion', chance: 100 } } }),
    bulk_up: M('bulk_up', 'Tăng Lực', 'fighting', 'status', 0, null, 20, { effect: { stat: { target: 'self', stat: 'atk', stages: 1, also: { stat: 'def', stages: 1 } } } }),

    /* ---------- ĐỘC ---------- */
    poison_sting: M('poison_sting', 'Ngòi Độc', 'poison', 'physical', 15, 100, 35, { effect: { status: { id: 'poison', chance: 30 } } }),
    acid_spray: M('acid_spray', 'Phun Axit', 'poison', 'special', 40, 100, 20, { effect: { stat: { target: 'foe', stat: 'spd', stages: -2, chance: 100 } } }),
    sludge_bomb: M('sludge_bomb', 'Bom Bùn', 'poison', 'special', 90, 100, 10, { effect: { status: { id: 'poison', chance: 30 } } }),
    toxic: M('toxic', 'Độc Tố', 'poison', 'status', 0, 90, 10, { effect: { status: { id: 'toxic', chance: 100 } } }),
    venoshock: M('venoshock', 'Độc Kích', 'poison', 'special', 65, 100, 10, { flags: { doubleIfPoisoned: true } }),

    /* ---------- ĐẤT ---------- */
    mud_slap: M('mud_slap', 'Bùn Bắn', 'ground', 'special', 20, 100, 10, { effect: { stat: { target: 'foe', stat: 'accuracy', stages: -1 } } }),
    bulldoze: M('bulldoze', 'Ủi Đất', 'ground', 'physical', 60, 100, 20, { effect: { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 100 } } }),
    earthquake: M('earthquake', 'Động Đất', 'ground', 'physical', 100, 100, 10),
    earth_power: M('earth_power', 'Sức Mạnh Đất', 'ground', 'special', 90, 100, 10, { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 10 } } }),
    sand_tomb: M('sand_tomb', 'Mộ Cát', 'ground', 'physical', 35, 85, 15, { effect: { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 100 } } }),

    /* ---------- BAY ---------- */
    gust: M('gust', 'Gió Thốc', 'flying', 'special', 40, 100, 35),
    wing_attack: M('wing_attack', 'Đập Cánh', 'flying', 'physical', 60, 100, 35, { flags: { contact: true } }),
    aerial_ace: M('aerial_ace', 'Đòn Trên Không', 'flying', 'physical', 60, null, 20, { flags: { sureHit: true, noDodge: true, contact: true } }),
    brave_bird: M('brave_bird', 'Chim Dũng Cảm', 'flying', 'physical', 120, 100, 15, { flags: { contact: true }, effect: { recoil: 0.33 } }),
    roost: M('roost', 'Đậu Tổ', 'flying', 'status', 0, null, 10, { effect: { heal: 0.5 } }),
    air_cutter: M('air_cutter', 'Dao Gió', 'flying', 'special', 60, 95, 25, { effect: { flinch: 30 } }),

    /* ---------- SIÊU LINH ---------- */
    confusion: M('confusion', 'Bối Rối', 'psychic', 'special', 50, 100, 25, { effect: { status: { id: 'confusion', chance: 10 } } }),
    psybeam: M('psybeam', 'Tia Tâm Linh', 'psychic', 'special', 65, 100, 20, { effect: { status: { id: 'confusion', chance: 10 } } }),
    psychic: M('psychic', 'Tâm Linh', 'psychic', 'special', 90, 100, 10, { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 10 } } }),
    psyshock: M('psyshock', 'Sốc Tâm Trí', 'psychic', 'special', 80, 100, 10, { flags: { physicalDef: true } }),
    hypnosis: M('hypnosis', 'Thôi Miên', 'psychic', 'status', 0, 60, 20, { effect: { status: { id: 'sleep', chance: 100 } } }),
    calm_mind: M('calm_mind', 'Tĩnh Tâm', 'psychic', 'status', 0, null, 20, { effect: { stat: { target: 'self', stat: 'spa', stages: 1, also: { stat: 'spd', stages: 1 } } } }),

    /* ---------- BỌ ---------- */
    bug_bite: M('bug_bite', 'Cắn Bọ', 'bug', 'physical', 60, 100, 20, { flags: { contact: true } }),
    x_scissor: M('x_scissor', 'Kéo Chữ X', 'bug', 'physical', 80, 100, 15, { flags: { contact: true } }),
    signal_beam: M('signal_beam', 'Tia Tín Hiệu', 'bug', 'special', 75, 100, 15, { effect: { status: { id: 'confusion', chance: 10 } } }),
    string_shot: M('string_shot', 'Bắn Tơ', 'bug', 'status', 0, 95, 40, { effect: { stat: { target: 'foe', stat: 'spe', stages: -2 } } }),
    fury_cutter: M('fury_cutter', 'Dao Cắt', 'bug', 'physical', 40, 95, 20, { flags: { contact: true } }),

    /* ---------- ĐÁ ---------- */
    rock_throw: M('rock_throw', 'Ném Đá', 'rock', 'physical', 50, 90, 15),
    rock_slide: M('rock_slide', 'Lở Đá', 'rock', 'physical', 75, 90, 10, { effect: { flinch: 30 } }),
    stone_edge: M('stone_edge', 'Rìa Đá', 'rock', 'physical', 100, 80, 5, { critBoost: 1 }),
    ancient_power: M('ancient_power', 'Sức Mạnh Cổ', 'rock', 'special', 60, 100, 5, { effect: { stat: { target: 'self', stat: 'atk', stages: 1, chance: 10, also: { stat: 'def', stages: 1 } } } }),
    stealth_rock: M('stealth_rock', 'Bẫy Đá', 'rock', 'status', 0, null, 20, { effect: { stat: { target: 'foe', stat: 'spe', stages: -1 } } }),

    /* ---------- MA ---------- */
    lick: M('lick', 'Liếm', 'ghost', 'physical', 30, 100, 30, { effect: { status: { id: 'paralysis', chance: 30 } } }),
    shadow_claw: M('shadow_claw', 'Vuốt Bóng', 'ghost', 'physical', 70, 100, 15, { critBoost: 1, flags: { contact: true } }),
    shadow_ball: M('shadow_ball', 'Cầu Bóng Tối', 'ghost', 'special', 80, 100, 15, { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 20 } } }),
    hex: M('hex', 'Lời Nguyền', 'ghost', 'special', 65, 100, 10, { flags: { doubleIfStatus: true } }),
    shadow_sneak: M('shadow_sneak', 'Bóng Lén', 'ghost', 'physical', 40, 100, 30, { priority: 1, flags: { contact: true } }),

    /* ---------- RỒNG ---------- */
    dragon_breath: M('dragon_breath', 'Hơi Thở Rồng', 'dragon', 'special', 60, 100, 20, { effect: { status: { id: 'paralysis', chance: 30 } } }),
    dragon_claw: M('dragon_claw', 'Vuốt Rồng', 'dragon', 'physical', 80, 100, 15, { flags: { contact: true } }),
    dragon_pulse: M('dragon_pulse', 'Xung Rồng', 'dragon', 'special', 85, 100, 10),
    draco_meteor: M('draco_meteor', 'Thiên Thạch Rồng', 'dragon', 'special', 130, 90, 5, { effect: { stat: { target: 'self', stat: 'spa', stages: -2 } } }),
    dragon_dance: M('dragon_dance', 'Vũ Điệu Rồng', 'dragon', 'status', 0, null, 20, { effect: { stat: { target: 'self', stat: 'atk', stages: 1, also: { stat: 'spe', stages: 1 } } } }),

    /* ---------- BÓNG TỐI ---------- */
    bite: M('bite', 'Cắn', 'dark', 'physical', 60, 100, 25, { flags: { contact: true }, effect: { flinch: 30 } }),
    crunch: M('crunch', 'Nghiến', 'dark', 'physical', 80, 100, 15, { flags: { contact: true }, effect: { stat: { target: 'foe', stat: 'def', stages: -1, chance: 20 } } }),
    dark_pulse: M('dark_pulse', 'Xung Bóng Tối', 'dark', 'special', 80, 100, 15, { effect: { flinch: 20 } }),
    nasty_plot: M('nasty_plot', 'Âm Mưu', 'dark', 'status', 0, null, 20, { effect: { stat: { target: 'self', stat: 'spa', stages: 2 } } }),
    sucker_punch: M('sucker_punch', 'Đấm Lén', 'dark', 'physical', 70, 100, 5, { priority: 1, flags: { contact: true } }),
    scary_roar: M('scary_roar', 'Tiếng Gầm Kinh Hoàng', 'dark', 'status', 0, 100, 10, { effect: { status: { id: 'fear', chance: 100 } } }),

    /* ---------- THÉP ---------- */
    metal_claw: M('metal_claw', 'Vuốt Kim Loại', 'steel', 'physical', 50, 95, 35, { flags: { contact: true }, effect: { stat: { target: 'self', stat: 'atk', stages: 1, chance: 10 } } }),
    bullet_punch: M('bullet_punch', 'Đấm Đạn', 'steel', 'physical', 40, 100, 30, { priority: 1, flags: { contact: true } }),
    iron_head: M('iron_head', 'Đầu Thép', 'steel', 'physical', 80, 100, 15, { flags: { contact: true }, effect: { flinch: 30 } }),
    flash_cannon: M('flash_cannon', 'Pháo Sáng', 'steel', 'special', 80, 100, 10, { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 10 } } }),
    iron_defense: M('iron_defense', 'Phòng Thủ Thép', 'steel', 'status', 0, null, 15, { effect: { stat: { target: 'self', stat: 'def', stages: 2 } } }),

    /* ---------- TIÊN ---------- */
    fairy_wind: M('fairy_wind', 'Gió Tiên', 'fairy', 'special', 40, 100, 30),
    draining_kiss: M('draining_kiss', 'Nụ Hôn Hút Máu', 'fairy', 'special', 50, 100, 10, { effect: { drain: 0.75 } }),
    moonblast: M('moonblast', 'Ánh Trăng', 'fairy', 'special', 95, 100, 15, { effect: { stat: { target: 'foe', stat: 'spa', stages: -1, chance: 30 } } }),
    dazzling_gleam: M('dazzling_gleam', 'Lấp Lánh', 'fairy', 'special', 80, 100, 10),
    charm: M('charm', 'Mê Hoặc', 'fairy', 'status', 0, 100, 20, { effect: { stat: { target: 'foe', stat: 'atk', stages: -2 } } }),

    /* ---------- VÔ HỆ ---------- */
    balance_strike: M('balance_strike', 'Đòn Cân Bằng', 'neutral', 'physical', 75, 100, 20, { flags: { contact: true } }),
    void_pulse: M('void_pulse', 'Xung Hư Không', 'neutral', 'special', 85, 100, 15),
    null_shield: M('null_shield', 'Khiên Vô Cực', 'neutral', 'status', 0, null, 15, { effect: { stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } } }),

    /* ---------- THIÊN ---------- */
    celestial_ray: M('celestial_ray', 'Tia Thiên Giới', 'celestial', 'special', 95, 100, 10),
    starfall: M('starfall', 'Sao Rơi', 'celestial', 'physical', 100, 95, 10, { effect: { flinch: 20 } }),
    heaven_blessing: M('heaven_blessing', 'Thiên Phúc', 'celestial', 'status', 0, null, 10, { effect: { heal: 0.5, stat: { target: 'self', stat: 'spa', stages: 1 } } }),
    judgment: M('judgment', 'Phán Xét', 'celestial', 'special', 120, 90, 5, { critBoost: 1 }),

    /* ---------- LƯỢNG TỬ (dự phòng) ---------- */
    quantum_flux: M('quantum_flux', 'Biến Thiên Lượng Tử', 'quantum', 'special', 80, 100, 15),
    entangle: M('entangle', 'Rối Lượng Tử', 'quantum', 'status', 0, 90, 10, { effect: { status: { id: 'confusion', chance: 100 } } }),

    /* ---------- LỖI (hệ bất ổn) ---------- */
    glitch_byte: M('glitch_byte', 'Byte Lệch', 'glitch', 'special', 65, 100, 15,
      { flags: { sureHit: true, noDodge: true }, desc: 'Một byte dữ liệu bị sai, đòn luôn trúng mục tiêu.' }),
    error_pulse: M('error_pulse', 'Xung Lỗi', 'glitch', 'special', 90, 95, 10,
      { effect: { status: { id: 'confusion', chance: 30 } }, desc: 'Xung nhiễu làm đối thủ rối loạn.' }),
    system_crash: M('system_crash', 'Sụp Hệ Thống', 'glitch', 'special', 130, 90, 5,
      { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 50 } }, desc: 'Đòn kết liễu làm sụp đủ hệ thống phòng thủ.' }),
    patch_up: M('patch_up', 'Vá Lỗi', 'glitch', 'status', 0, null, 10,
      { effect: { heal: 0.3, stat: { target: 'self', stat: 'def', stages: 1 } }, desc: 'Tự vá lại một phần dữ liệu bị hỏng.' }),

    /* ---------- KHÁC ---------- */
    struggle: M('struggle', 'Vùng Vẫy', 'neutral', 'physical', 50, null, 1, { flags: { contact: true, noDodge: true, struggle: true }, effect: { recoil: 0.25 } })
  };

  /* Chiêu theo hệ + cấp độ (dùng để tự tạo learnset) */
  const TYPE_MOVES = {
    normal:   [['tackle', 1], ['quick_attack', 8], ['swift', 16], ['body_slam', 24], ['hyper_beam', 42], ['recover', 34]],
    fire:     [['ember', 1], ['fire_spin', 10], ['fire_fang', 18], ['flamethrower', 28], ['will_o_wisp', 20], ['flare_blitz', 40]],
    water:    [['water_gun', 1], ['bubble_beam', 12], ['aqua_jet', 16], ['waterfall', 26], ['surf', 30], ['hydro_pump', 42]],
    electric: [['thunder_shock', 1], ['nuzzle', 8], ['shock_wave', 16], ['thunder_wave', 20], ['thunderbolt', 28], ['volt_tackle', 40]],
    grass:    [['vine_whip', 1], ['razor_leaf', 12], ['leech_seed', 18], ['giga_drain', 26], ['sleep_powder', 22], ['solar_beam', 38]],
    ice:      [['ice_shard', 1], ['frost_breath', 12], ['aurora_veil', 20], ['ice_beam', 28], ['blizzard', 40]],
    fighting: [['karate_chop', 1], ['brick_break', 16], ['bulk_up', 20], ['dynamic_punch', 30], ['close_combat', 40]],
    poison:   [['poison_sting', 1], ['acid_spray', 12], ['toxic', 20], ['venoshock', 24], ['sludge_bomb', 30]],
    ground:   [['mud_slap', 1], ['sand_tomb', 12], ['bulldoze', 18], ['earth_power', 28], ['earthquake', 36]],
    flying:   [['gust', 1], ['wing_attack', 10], ['air_cutter', 16], ['aerial_ace', 20], ['roost', 26], ['brave_bird', 38]],
    psychic:  [['confusion', 1], ['psybeam', 14], ['hypnosis', 18], ['calm_mind', 22], ['psyshock', 28], ['psychic', 34]],
    bug:      [['fury_cutter', 1], ['string_shot', 8], ['bug_bite', 14], ['signal_beam', 24], ['x_scissor', 30]],
    rock:     [['rock_throw', 1], ['ancient_power', 12], ['rock_slide', 20], ['stealth_rock', 24], ['stone_edge', 34]],
    ghost:    [['lick', 1], ['shadow_sneak', 10], ['hex', 18], ['shadow_claw', 24], ['shadow_ball', 30]],
    dragon:   [['dragon_breath', 1], ['dragon_claw', 16], ['dragon_dance', 22], ['dragon_pulse', 28], ['draco_meteor', 42]],
    dark:     [['bite', 1], ['scary_roar', 10], ['sucker_punch', 18], ['dark_pulse', 26], ['crunch', 30], ['nasty_plot', 34]],
    steel:    [['metal_claw', 1], ['bullet_punch', 12], ['iron_defense', 18], ['iron_head', 26], ['flash_cannon', 32]],
    fairy:    [['fairy_wind', 1], ['charm', 10], ['draining_kiss', 16], ['dazzling_gleam', 26], ['moonblast', 34]],
    neutral:  [['balance_strike', 1], ['null_shield', 14], ['void_pulse', 26]],
    celestial:[['celestial_ray', 1], ['heaven_blessing', 14], ['starfall', 24], ['judgment', 36]],
    quantum:  [['quantum_flux', 1], ['entangle', 14]],
    glitch:   [['glitch_byte', 1], ['patch_up', 14], ['error_pulse', 24], ['system_crash', 38]]
  };

  /* Tuyệt kỹ theo hệ */
  const ULTIMATES = {
    normal:   { name: 'Tuyệt Kỹ: Bão Sao', type: 'normal', category: 'special', power: 140, accuracy: 100, desc: 'Trút cơn bão sao không thể né.' , flags:{sureHit:true,noDodge:true} },
    fire:     { name: 'Tuyệt Kỹ: Hỏa Ngục', type: 'fire', category: 'special', power: 150, accuracy: 95, desc: 'Thiêu rụi đối thủ, 30% gây Bỏng.', effect:{status:{id:'burn',chance:30}} },
    water:    { name: 'Tuyệt Kỹ: Đại Hồng Thủy', type: 'water', category: 'special', power: 150, accuracy: 95, desc: 'Nhấn chìm tất cả.' },
    electric: { name: 'Tuyệt Kỹ: Lôi Thần Giáng', type: 'electric', category: 'special', power: 150, accuracy: 95, desc: '30% gây Tê liệt.', effect:{status:{id:'paralysis',chance:30}} },
    grass:    { name: 'Tuyệt Kỹ: Rừng Thiêng', type: 'grass', category: 'special', power: 145, accuracy: 100, desc: 'Hút 50% sát thương thành HP.', effect:{drain:.5} },
    ice:      { name: 'Tuyệt Kỹ: Kỷ Băng Hà', type: 'ice', category: 'special', power: 150, accuracy: 90, desc: '20% gây Đóng băng.', effect:{status:{id:'freeze',chance:20}} },
    fighting: { name: 'Tuyệt Kỹ: Vạn Quyền', type: 'fighting', category: 'physical', power: 150, accuracy: 95, desc: 'Tỉ lệ chí mạng cao.', critBoost: 1 },
    poison:   { name: 'Tuyệt Kỹ: Tử Độc', type: 'poison', category: 'special', power: 145, accuracy: 95, desc: '40% gây Độc nặng.', effect:{status:{id:'toxic',chance:40}} },
    ground:   { name: 'Tuyệt Kỹ: Địa Tâm', type: 'ground', category: 'physical', power: 150, accuracy: 95, desc: 'Rung chuyển địa tâm.' },
    flying:   { name: 'Tuyệt Kỹ: Thiên Vũ', type: 'flying', category: 'physical', power: 150, accuracy: 95, desc: '25% làm đối thủ Sợ hãi.', effect:{flinch:25} },
    psychic:  { name: 'Tuyệt Kỹ: Đại Não', type: 'psychic', category: 'special', power: 150, accuracy: 95, desc: '25% gây Rối loạn.', effect:{status:{id:'confusion',chance:25}} },
    bug:      { name: 'Tuyệt Kỹ: Bầy Bọ', type: 'bug', category: 'physical', power: 145, accuracy: 100, desc: 'Tấn công 2 lần.', effect:{multihit:[2,2]} },
    rock:     { name: 'Tuyệt Kỹ: Thiên Thạch', type: 'rock', category: 'physical', power: 150, accuracy: 90, desc: '20% làm Sợ hãi.', effect:{flinch:20} },
    ghost:    { name: 'Tuyệt Kỹ: U Linh', type: 'ghost', category: 'special', power: 150, accuracy: 100, desc: 'Không thể né.', flags:{sureHit:true,noDodge:true} },
    dragon:   { name: 'Tuyệt Kỹ: Long Thần', type: 'dragon', category: 'special', power: 150, accuracy: 95, desc: 'Sức mạnh rồng cổ đại.' },
    dark:     { name: 'Tuyệt Kỹ: Hắc Nguyệt', type: 'dark', category: 'physical', power: 150, accuracy: 95, desc: 'Tỉ lệ chí mạng cao.', critBoost: 1 },
    steel:    { name: 'Tuyệt Kỹ: Thiên Kim', type: 'steel', category: 'physical', power: 150, accuracy: 95, desc: '30% làm Sợ hãi.', effect:{flinch:30} },
    fairy:    { name: 'Tuyệt Kỹ: Nguyệt Quang', type: 'fairy', category: 'special', power: 150, accuracy: 95, desc: 'Hút 30% sát thương.', effect:{drain:.3} },
    neutral:  { name: 'Tuyệt Kỹ: Cân Bằng Tuyệt Đối', type: 'neutral', category: 'special', power: 145, accuracy: 100, desc: 'Bỏ qua mọi khắc chế, không thể né.', flags:{sureHit:true,noDodge:true} },
    celestial:{ name: 'Tuyệt Kỹ: Thiên Phạt', type: 'celestial', category: 'special', power: 160, accuracy: 95, desc: 'Quyền năng của Thiên Giới.', critBoost: 1 },
    quantum:  { name: 'Tuyệt Kỹ: Sụp Đổ Lượng Tử', type: 'quantum', category: 'special', power: 150, accuracy: 95, desc: 'Dự phòng.' },
    glitch:   { name: 'Tuyệt Kỹ: Đè Bẹp Lỗi Hệ Thống', type: 'glitch', category: 'special', power: 150, accuracy: 95,
      desc: 'Lỗi nghiêm trọng khiến hệ phòng thủ của đối phương bị ghi đè.', effect: { status: { id: 'confusion', chance: 25 } } }
  };

  function getMove(id) { return MOVES[id] || MOVES.tackle; }

  function movesForTypes(types, level) {
    const learned = [];
    const seen = new Set();
    for (const t of types) {
      for (const [mid, lv] of (TYPE_MOVES[t] || [])) {
        if (lv <= level && !seen.has(mid)) {
          seen.add(mid);
          learned.push({ id: mid, level: lv });
        }
      }
    }
    return learned.sort((a, b) => a.level - b.level);
  }

  PG.MOVES = MOVES;
  PG.TYPE_MOVES = TYPE_MOVES;
  PG.ULTIMATES = ULTIMATES;
  PG.getMove = getMove;
  PG.movesForTypes = movesForTypes;
})();
