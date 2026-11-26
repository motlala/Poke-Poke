/* ============================================================
   MỞ RỘNG KỸ NĂNG THEO HỆ + CHIÊU KẾT HỢP ĐA HỆ
   - Mỗi hệ nhận thêm nhiều chiêu thật, có hiệu ứng đã được
     battle.js / formulas.js hỗ trợ (Bỏng, Độc, Tê liệt, hút máu...).
   - Pokémon 2 hệ học thêm 1 chiêu PHỐI HỢP của đúng 2 hệ đó.
     Chiêu phối hợp lấy hệ số khắc tốt nhất của 2 hệ và được
     cộng sát thương khi người dùng thực sự mang cả 2 hệ.
   - Đặc tính mới đều có hiệu ứng thật trong formulas.js / battle.js.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  function M(id, name, type, category, power, accuracy, pp, extra) {
    return Object.assign({
      id, name, type, category, power, accuracy, pp,
      priority: 0, critBoost: 0, flags: {}, effect: null, desc: ''
    }, extra || {});
  }

  /* ---------- CHIÊU MỚI CHO TỪNG HỆ ---------- */
  /* [id, tên, hệ, nhóm, sức mạnh, chính xác, PP, cấp học, hiệu ứng] */
  const ADDED = [
    ['skill_normal_barrage', 'Mưa Đấm', 'normal', 'physical', 65, 100, 15, 12, { effect: { multihit: [2, 2] }, flags: { contact: true } }],
    ['skill_normal_focus_pulse', 'Đòn Tâm Điểm', 'normal', 'special', 80, 100, 15, 30, { flags: { sureHit: true, noDodge: true } }],
    ['skill_normal_guard_break', 'Bẻ Gãy Khiên', 'normal', 'physical', 90, 95, 10, 36, { flags: { contact: true }, effect: { stat: { target: 'foe', stat: 'def', stages: -1, chance: 50 } } }],

    ['skill_fire_ember_storm', 'Bão Than Hồng', 'fire', 'special', 70, 100, 15, 16, { effect: { status: { id: 'burn', chance: 20 } } }],
    ['skill_fire_blaze_kick', 'Cú Đá Lửa', 'fire', 'physical', 85, 95, 12, 26, { flags: { contact: true }, effect: { flinch: 20 } }],
    ['skill_fire_solar_fire', 'Lửa Mặt Trời', 'fire', 'special', 105, 95, 8, 40, { effect: { heal: 0.2 } }],

    ['skill_water_tidal_whip', 'Roi Sóng Triều', 'water', 'physical', 75, 100, 15, 18, { flags: { contact: true }, effect: { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 30 } } }],
    ['skill_water_mist_shield', 'Làn Sương Che Chở', 'water', 'status', 0, null, 15, 24, { effect: { heal: 0.3, stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } } }],
    ['skill_water_deep_surge', 'Sóng Ngầm', 'water', 'special', 100, 95, 10, 38, { effect: { flinch: 25 } }],

    ['skill_electric_spark_chain', 'Xích Sét', 'electric', 'special', 70, 100, 15, 16, { effect: { status: { id: 'paralysis', chance: 20 } } }],
    ['skill_electric_flash_step', 'Bước Chớp', 'electric', 'physical', 65, 100, 15, 20, { priority: 1, flags: { contact: true } }],
    ['skill_electric_thunder_field', 'Bão Sét', 'electric', 'special', 105, 90, 8, 42, { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 30 } } }],

    ['skill_grass_bloom_edge', 'Rìa Cánh Hoa', 'grass', 'physical', 75, 100, 15, 18, { flags: { contact: true }, effect: { drain: 0.3 } }],
    ['skill_grass_spore_veil', 'Màn Bào Tử', 'grass', 'status', 0, 90, 12, 24, { effect: { status: { id: 'sleep', chance: 60 } } }],
    ['skill_grass_forest_oath', 'Lời Thề Rừng Sâu', 'grass', 'special', 105, 95, 8, 40, { effect: { heal: 0.25 } }],

    ['skill_ice_frost_lance', 'Lạnh Thấu Xương', 'ice', 'physical', 80, 100, 12, 20, { effect: { status: { id: 'freeze', chance: 15 } } }],
    ['skill_ice_snow_guard', 'Khiên Tuyết', 'ice', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } } }],
    ['skill_ice_glacier_crush', 'Nghiến Nát Băng', 'ice', 'physical', 110, 90, 8, 42, { flags: { contact: true }, effect: { flinch: 25 } }],

    ['skill_fighting_rising_fist', 'Đấm Vươn Cao', 'fighting', 'physical', 75, 100, 15, 18, { flags: { contact: true }, effect: { stat: { target: 'self', stat: 'atk', stages: 1, chance: 30 } } }],
    ['skill_fighting_wave_kick', 'Cú Đá Sóng', 'fighting', 'physical', 90, 95, 10, 30, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['skill_fighting_spirit_guard', 'Ý Chí Bất Khuất', 'fighting', 'status', 0, null, 12, 26, { effect: { stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } } }],

    ['skill_poison_corpse_breath', 'Hơi Thở Thối Rữa', 'poison', 'special', 70, 100, 15, 18, { effect: { status: { id: 'toxic', chance: 25 } } }],
    ['skill_poison_acid_lance', 'Mũi Axit Ăn Mòn', 'poison', 'physical', 85, 95, 12, 28, { effect: { stat: { target: 'foe', stat: 'def', stages: -1, chance: 40 } } }],
    ['skill_poison_venom_burst', 'Tung Nọc Độc', 'poison', 'special', 105, 95, 8, 40, { effect: { status: { id: 'poison', chance: 35 } } }],

    ['skill_ground_dust_devil', 'Cơn Bụi Mù', 'ground', 'special', 70, 100, 15, 16, { effect: { stat: { target: 'foe', stat: 'accuracy', stages: -1, chance: 40 } } }],
    ['skill_ground_terra_slam', 'Cú Đập Đất', 'ground', 'physical', 95, 95, 10, 32, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['skill_ground_quake_wall', 'Bức Tường Đất', 'ground', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } } }],

    ['skill_flying_sky_dive', 'Bổ Nhào Từ Trời', 'flying', 'physical', 85, 95, 12, 24, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['skill_flying_wind_blade', 'Lưỡi Gió', 'flying', 'special', 75, 100, 15, 18, { critBoost: 1 }],
    ['skill_flying_soar_heal', 'Bay Lượn Hồi Sức', 'flying', 'status', 0, null, 15, 26, { effect: { heal: 0.3, stat: { target: 'self', stat: 'spe', stages: 1 } } }],

    ['skill_psychic_brain_wave', 'Sóng Tâm Thức', 'psychic', 'special', 75, 100, 15, 18, { effect: { status: { id: 'confusion', chance: 20 } } }],
    ['skill_psychic_future_edge', 'Lưỡi Tương Lai', 'psychic', 'special', 100, 95, 10, 36, { priority: 1 }],
    ['skill_psychic_mental_guard', 'Khiên Tâm Trí', 'psychic', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'spd', stages: 1, also: { stat: 'def', stages: 1 } } } }],

    ['skill_bug_blade_storm', 'Bão Lưỡi Dao', 'bug', 'physical', 70, 100, 15, 18, { flags: { contact: true }, effect: { multihit: [2, 3] } }],
    ['skill_bug_web_sling', 'Bắn Tơ', 'bug', 'status', 0, 95, 15, 22, { effect: { stat: { target: 'foe', stat: 'spe', stages: -2 } } }],
    ['skill_bug_swarm_crush', 'Nghiến Nát', 'bug', 'physical', 100, 95, 10, 38, { flags: { contact: true }, effect: { stat: { target: 'self', stat: 'atk', stages: 1, chance: 30 } } }],

    ['skill_rock_shard_storm', 'Mưa Đá', 'rock', 'physical', 70, 100, 15, 18, { effect: { multihit: [2, 2] } }],
    ['skill_rock_boulder_roll', 'Cú Lăn Đá', 'rock', 'physical', 95, 90, 10, 32, { flags: { contact: true }, effect: { flinch: 30 } }],
    ['skill_rock_stone_skin', 'Da Đá', 'rock', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'def', stages: 2 } } }],

    ['skill_ghost_soul_drain', 'Hút Hồn', 'ghost', 'special', 75, 100, 15, 18, { effect: { drain: 0.5 } }],
    ['skill_ghost_night_claw', 'Vuốt Trong Đêm', 'ghost', 'physical', 85, 100, 12, 28, { critBoost: 1, flags: { contact: true } }],
    ['skill_ghost_phantom_veil', 'Làn Sương Ma', 'ghost', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'evasion', stages: 1, also: { stat: 'def', stages: 1 } } } }],

    ['skill_dragon_flame_whip', 'Roi Lửa Rồng', 'dragon', 'special', 85, 100, 12, 24, { effect: { status: { id: 'burn', chance: 20 } } }],
    ['skill_dragon_wing_slam', 'Cú Đập Cánh Rồng', 'dragon', 'physical', 95, 95, 10, 34, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['skill_dragon_ancient_roar', 'Tiếng Gầm Cổ Đại', 'dragon', 'status', 0, null, 12, 30, { effect: { stat: { target: 'foe', stat: 'atk', stages: -1, also: { stat: 'spd', stages: -1 } } } }],

    ['skill_dark_shadow_grab', 'Tóm Lấy Bóng Tối', 'dark', 'physical', 75, 100, 15, 18, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['skill_dark_night_blade', 'Lưỡi Dao Đêm', 'dark', 'special', 95, 100, 10, 34, { critBoost: 1 }],
    ['skill_dark_curse_mark', 'Dấu Nguyền Rủa', 'dark', 'status', 0, 90, 12, 24, { effect: { status: { id: 'fear', chance: 60 } } }],

    ['skill_steel_gear_crush', 'Nghiến Bánh Răng', 'steel', 'physical', 85, 100, 12, 24, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['skill_steel_magnet_pulse', 'Xung Lực Từ', 'steel', 'special', 75, 100, 15, 18, { effect: { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 30 } } }],
    ['skill_steel_alloy_guard', 'Khiên Hợp Kim', 'steel', 'status', 0, null, 15, 26, { effect: { stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } } }],

    ['skill_fairy_star_dust', 'Bụi Sao', 'fairy', 'special', 75, 100, 15, 18, { effect: { stat: { target: 'self', stat: 'spa', stages: 1, chance: 30 } } }],
    ['skill_fairy_charm_burst', 'Bùng Phép Mê Hoặc', 'fairy', 'physical', 85, 100, 12, 26, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['skill_fairy_moon_veil', 'Màn Sương Trăng', 'fairy', 'status', 0, null, 15, 24, { effect: { heal: 0.3, stat: { target: 'self', stat: 'spd', stages: 1 } } }],

    ['skill_neutral_pure_strike', 'Đòn Thuần Khiết', 'neutral', 'physical', 85, 100, 12, 24, { flags: { sureHit: true, noDodge: true } }],
    ['skill_neutral_balance_field', 'Vùng Cân Bằng', 'neutral', 'status', 0, null, 15, 26, { effect: { stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } } }],
    ['skill_celestial_star_arrow', 'Mũi Tên Sao', 'celestial', 'special', 85, 100, 12, 24, { flags: { sureHit: true, noDodge: true } }],
    ['skill_celestial_halo_heal', 'Hào Quang Hồi Sinh', 'celestial', 'status', 0, null, 15, 26, { effect: { heal: 0.4 } }],
    ['skill_quantum_phase_shift', 'Chuyển Pha', 'quantum', 'special', 75, 100, 15, 22, { flags: { sureHit: true, noDodge: true } }],
    ['skill_quantum_paradox', 'Nghịch Lý Thời Gian', 'quantum', 'status', 0, 90, 12, 26, { effect: { status: { id: 'confusion', chance: 70 } } }],
    ['skill_glitch_corrupt_byte', 'Byte Hư Hỏng', 'glitch', 'special', 75, 100, 15, 22, { effect: { status: { id: 'confusion', chance: 25 } } }],
    ['skill_glitch_reboot', 'Khởi Động Lại', 'glitch', 'status', 0, null, 15, 26, { effect: { heal: 0.35, stat: { target: 'self', stat: 'def', stages: 1 } } }],

    ['skill_normal_keen_scan', 'Soi Xét', 'normal', 'special', 60, null, 20, 14, { flags: { sureHit: true, noDodge: true }, effect: { stat: { target: 'foe', stat: 'def', stages: -1 } } }],
    ['skill_fire_ash_fall', 'Mưa Tro', 'fire', 'special', 60, 100, 20, 12, { effect: { status: { id: 'burn', chance: 20 } } }],
    ['skill_water_ripple', 'Gợn Sóng', 'water', 'special', 60, 100, 20, 12, { effect: { flinch: 20 } }],
    ['skill_electric_volt_bite', 'Cú Cắn Sét', 'electric', 'physical', 70, 100, 15, 18, { flags: { contact: true }, effect: { status: { id: 'paralysis', chance: 20 } } }],
    ['skill_grass_leaf_cutter', 'Lưỡi Lá', 'grass', 'physical', 70, 100, 15, 16, { flags: { contact: true }, critBoost: 1 }],
    ['skill_ice_ice_shard', 'Mảnh Băng', 'ice', 'physical', 40, 100, 25, 12, { priority: 1 }],
    ['skill_fighting_guard_break', 'Phá Vệ Tuyến', 'fighting', 'physical', 70, 100, 15, 20, { flags: { contact: true }, effect: { stat: { target: 'foe', stat: 'def', stages: -1 } } }],
    ['skill_poison_sting', 'Ngòi Độc', 'poison', 'physical', 65, 100, 20, 14, { flags: { contact: true }, effect: { status: { id: 'poison', chance: 30 } } }],
    ['skill_ground_sand_slam', 'Cú Tạt Cát', 'ground', 'special', 65, 100, 20, 14, { effect: { stat: { target: 'foe', stat: 'accuracy', stages: -1 } } }],
    ['skill_flying_gust', 'Lốc Gió', 'flying', 'special', 60, null, 20, 12, { flags: { sureHit: true, noDodge: true } }],
    ['skill_psychic_foresight', 'Linh Cảm Tiên Tri', 'psychic', 'status', 0, null, 15, 20, { effect: { stat: { target: 'self', stat: 'spa', stages: 1, also: { stat: 'spe', stages: 1 } } } }],
    ['skill_bug_pin', 'Đâm Liên Hồi', 'bug', 'physical', 40, 100, 20, 14, { flags: { contact: true }, effect: { multihit: [2, 3] } }],
    ['skill_rock_pebble', 'Hòn Sỏi Bay', 'rock', 'physical', 60, 100, 20, 14, { effect: { flinch: 20 } }],
    ['skill_ghost_wisp', 'Đốm Lửa Ma', 'ghost', 'special', 65, 100, 20, 14, { effect: { status: { id: 'burn', chance: 20 } } }],
    ['skill_dragon_breath', 'Hơi Thở Rồng', 'dragon', 'special', 75, 100, 15, 20, { effect: { status: { id: 'burn', chance: 20 } } }],
    ['skill_steel_iron_head', 'Đầu Thép', 'steel', 'physical', 80, 100, 12, 22, { flags: { contact: true }, effect: { flinch: 20 } }],
    ['skill_fairy_glitter', 'Ánh Lấp Lánh', 'fairy', 'special', 65, 100, 20, 14, { effect: { stat: { target: 'self', stat: 'spa', stages: 1, chance: 30 } } }],
    ['skill_neutral_pure_beam', 'Tia Sáng Thuần Khiết', 'neutral', 'special', 85, null, 12, 24, { flags: { sureHit: true, noDodge: true } }],
    ['skill_celestial_star_guard', 'Khiên Sao', 'celestial', 'status', 0, null, 15, 24, { effect: { heal: 0.3, stat: { target: 'self', stat: 'def', stages: 1 } } }],
    ['skill_quantum_void_step', 'Bước Qua Khoảng Không', 'quantum', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'evasion', stages: 1, also: { stat: 'spe', stages: 1 } } } }],
    ['skill_glitch_error_pulse', 'Xung Lỗi Hệ Thống', 'glitch', 'special', 70, 100, 15, 20, { effect: { status: { id: 'confusion', chance: 30 } } }],

    ['skill_normal_quick_jab', 'Cú Đâm Nhanh', 'normal', 'physical', 40, 100, 30, 10, { priority: 1, flags: { contact: true } }],
    ['skill_normal_body_slam', 'Cú Đập Người', 'normal', 'physical', 85, 100, 15, 28, { flags: { contact: true }, effect: { flinch: 20 } }],
    ['skill_fire_flame_wheel', 'Vòng Lửa', 'fire', 'physical', 80, 95, 12, 26, { flags: { contact: true }, effect: { status: { id: 'burn', chance: 20 } } }],
    ['skill_fire_heat_wave', 'Sóng Nhiệt', 'fire', 'special', 75, 100, 15, 20, { effect: { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 30 } } }],
    ['skill_water_aqua_tail', 'Đuôi Nước', 'water', 'physical', 80, 100, 12, 24, { flags: { contact: true }, effect: { flinch: 20 } }],
    ['skill_water_rain_dance', 'Vũ Điệu Mưa', 'water', 'status', 0, null, 15, 22, { effect: { heal: 0.25, stat: { target: 'self', stat: 'spd', stages: 1 } } }],
    ['skill_electric_spark_fist', 'Cú Đấm Tia Sét', 'electric', 'physical', 80, 100, 12, 24, { flags: { contact: true }, effect: { flinch: 20 } }],
    ['skill_electric_thunder_wave', 'Sóng Sấm', 'electric', 'special', 80, 100, 15, 24, { effect: { status: { id: 'paralysis', chance: 20 } } }],
    ['skill_grass_needle_leaf', 'Lá Như Kim', 'grass', 'physical', 60, 100, 20, 14, { flags: { contact: true }, effect: { multihit: [2, 3] } }],
    ['skill_grass_growth_pulse', 'Sức Sống Mới', 'grass', 'status', 0, null, 15, 22, { effect: { heal: 0.3, stat: { target: 'self', stat: 'spa', stages: 1 } } }],
    ['skill_ice_ice_breath', 'Hơi Thở Băng', 'ice', 'special', 70, 100, 15, 18, { effect: { status: { id: 'freeze', chance: 15 } } }],
    ['skill_ice_frost_field', 'Cánh Đồng Băng', 'ice', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'def', stages: 2 } } }],
    ['skill_fighting_knee_strike', 'Cú Đá Gối', 'fighting', 'physical', 85, 95, 12, 26, { flags: { contact: true }, effect: { flinch: 30 } }],
    ['skill_fighting_war_cry', 'Tiếng Hét Chiến Trường', 'fighting', 'status', 0, null, 12, 24, { effect: { stat: { target: 'self', stat: 'atk', stages: 2 } } }],
    ['skill_poison_acid_spray', 'Phun Axit', 'poison', 'special', 75, 100, 15, 18, { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 40 } } }],
    ['skill_poison_miasma', 'Làn Khí Độc', 'poison', 'status', 0, 90, 12, 24, { effect: { status: { id: 'toxic', chance: 50 } } }],
    ['skill_ground_mud_shot', 'Bắn Bùn', 'ground', 'special', 60, 100, 20, 14, { effect: { stat: { target: 'foe', stat: 'accuracy', stages: -1 } } }],
    ['skill_ground_land_wave', 'Sóng Đất', 'ground', 'physical', 90, 95, 10, 30, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['skill_flying_wind_cutter', 'Gió Sắc', 'flying', 'special', 70, 100, 15, 18, { critBoost: 1 }],
    ['skill_flying_tailwind', 'Gió Đuôi', 'flying', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'spe', stages: 2 } } }],
    ['skill_psychic_mental_shot', 'Viên Đạn Tâm Thức', 'psychic', 'special', 70, 100, 15, 18, { effect: { flinch: 20 } }],
    ['skill_psychic_reflect_guard', 'Gương Phản Chiếu', 'psychic', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'spd', stages: 2 } } }],
    ['skill_bug_horn_attack', 'Cú Húc Sừng', 'bug', 'physical', 75, 100, 15, 18, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['skill_bug_spore_cloud', 'Đám Mây Bào Tử', 'bug', 'status', 0, 90, 12, 22, { effect: { status: { id: 'sleep', chance: 50 } } }],
    ['skill_rock_rock_throw', 'Ném Đá', 'rock', 'physical', 60, 100, 20, 14, { effect: { flinch: 30 } }],
    ['skill_rock_sandstorm', 'Bão Cát', 'rock', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } } }],
    ['skill_ghost_shadow_punch', 'Cú Đấm Bóng Tối', 'ghost', 'physical', 80, 100, 12, 24, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['skill_ghost_curse_eye', 'Ánh Mắt Nguyền Rủa', 'ghost', 'status', 0, 90, 12, 24, { effect: { status: { id: 'fear', chance: 50 } } }],
    ['skill_dragon_dragon_dance', 'Vũ Điệu Rồng', 'dragon', 'status', 0, null, 15, 24, { effect: { stat: { target: 'self', stat: 'atk', stages: 1, also: { stat: 'spe', stages: 1 } } } }],
    ['skill_dark_black_claw', 'Vuốt Bóng Tối', 'dark', 'physical', 80, 100, 12, 24, { flags: { contact: true }, critBoost: 1 }],
    ['skill_steel_iron_spin', 'Vòng Xoay Thép', 'steel', 'physical', 70, 100, 15, 18, { flags: { contact: true }, effect: { stat: { target: 'self', stat: 'def', stages: 1, chance: 30 } } }],
    ['skill_fairy_sparkle_shot', 'Tia Lấp Lánh', 'fairy', 'special', 70, 100, 15, 18, { effect: { stat: { target: 'self', stat: 'spa', stages: 1, chance: 30 } } }],
    ['skill_neutral_origin_pulse', 'Xung Lực Khởi Nguyên', 'neutral', 'special', 90, null, 10, 28, { flags: { sureHit: true, noDodge: true } }],
    ['skill_celestial_aurora', 'Cực Quang', 'celestial', 'special', 95, 100, 10, 28, { effect: { heal: 0.2 } }],
    ['skill_quantum_phase_blade', 'Lưỡi Dao Pha', 'quantum', 'special', 85, 100, 12, 24, { flags: { sureHit: true, noDodge: true } }],
    ['skill_glitch_null_byte', 'Byte Vô Hiệu', 'glitch', 'status', 0, null, 12, 22, { effect: { status: { id: 'confusion', chance: 60 } } }]
  ];

  const addedMoves = {};
  for (const row of ADDED) {
    const extra = row[8] || {};
    extra.desc = extra.desc || (row[1] + ' — kỹ năng hệ ' + (PG.TYPES[row[2]] ? PG.TYPES[row[2]].name : row[2]) + '.');
    addedMoves[row[0]] = M(row[0], row[1], row[2], row[3], row[4], row[5], row[6], extra);
    if (!PG.TYPE_MOVES[row[2]]) PG.TYPE_MOVES[row[2]] = [];
    PG.TYPE_MOVES[row[2]].push([row[0], row[7]]);
  }
  Object.assign(PG.MOVES, addedMoves);

  /* ---------- CHIÊU PHỐI HỢP HAI HỆ ---------- */
  /* [hệ A, hệ B, id, tên, nhóm, power, accuracy, pp, hiệu ứng] */
  const COMBOS = [
    ['fire', 'water', 'combo_steam_burst', 'Sóng Hơi Nóng', 'special', 100, 95, 10, { effect: { status: { id: 'burn', chance: 20 }, stat: { target: 'foe', stat: 'spe', stages: -1, chance: 30 } } }],
    ['fire', 'grass', 'combo_wildfire', 'Cháy Rừng', 'special', 105, 95, 10, { effect: { status: { id: 'burn', chance: 25 }, drain: 0.3 } }],
    ['fire', 'flying', 'combo_flame_wing', 'Cánh Lửa', 'physical', 100, 95, 10, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['fire', 'dragon', 'combo_dragon_fire', 'Lửa Rồng', 'special', 115, 90, 8, { effect: { status: { id: 'burn', chance: 30 } } }],
    ['fire', 'ground', 'combo_magma_fist', 'Cú Đấm Magma', 'physical', 110, 95, 8, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['fire', 'steel', 'combo_hot_steel', 'Thép Nung', 'physical', 105, 95, 10, { effect: { stat: { target: 'foe', stat: 'def', stages: -1, chance: 40 } } }],
    ['fire', 'ghost', 'combo_soul_flame', 'Ngọn Lửa Linh Hồn', 'special', 105, 95, 10, { effect: { status: { id: 'burn', chance: 25 }, drain: 0.3 } }],
    ['fire', 'celestial', 'combo_holy_flame', 'Thiên Hỏa', 'special', 120, 95, 5, { effect: { status: { id: 'burn', chance: 30 } } }],

    ['water', 'ice', 'combo_tidal_frost', 'Băng Triều', 'special', 100, 95, 10, { effect: { status: { id: 'freeze', chance: 20 } } }],
    ['water', 'flying', 'combo_wave_wing', 'Cánh Sóng', 'physical', 95, 95, 10, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['water', 'grass', 'combo_bloom_tide', 'Sóng Hoa Triều', 'special', 100, 95, 10, { effect: { drain: 0.4 } }],
    ['water', 'ground', 'combo_mud_wave', 'Sóng Bùn', 'physical', 100, 95, 10, { effect: { stat: { target: 'foe', stat: 'accuracy', stages: -1, chance: 40 } } }],
    ['water', 'electric', 'combo_volt_tide', 'Triều Sét', 'special', 100, 95, 10, { effect: { status: { id: 'paralysis', chance: 25 } } }],
    ['water', 'psychic', 'combo_mind_wave', 'Sóng Ảo Ảnh', 'special', 100, 95, 10, { effect: { status: { id: 'confusion', chance: 25 } } }],
    ['water', 'fairy', 'combo_fairy_wave', 'Sóng Tiên', 'special', 100, 95, 10, { effect: { drain: 0.3 } }],
    ['water', 'celestial', 'combo_holy_tide', 'Triều Thiên Giới', 'special', 120, 95, 5, { effect: { heal: 0.3 } }],

    ['electric', 'flying', 'combo_sky_bolt', 'Sét Gió', 'special', 100, 95, 10, { effect: { status: { id: 'paralysis', chance: 25 } } }],
    ['electric', 'ice', 'combo_ice_bolt', 'Sét Băng', 'physical', 100, 95, 10, { effect: { flinch: 25 } }],
    ['electric', 'fighting', 'combo_thunder_fist', 'Cú Đấm Sét', 'physical', 110, 95, 8, { flags: { contact: true }, effect: { status: { id: 'paralysis', chance: 25 } } }],
    ['electric', 'dark', 'combo_shadow_bolt', 'Sét Trong Bóng Tối', 'special', 100, 95, 10, { effect: { flinch: 25 } }],
    ['electric', 'dragon', 'combo_dragon_bolt', 'Sét Rồng', 'special', 115, 90, 8, { effect: { status: { id: 'paralysis', chance: 30 } } }],

    ['grass', 'poison', 'combo_toxic_bloom', 'Hoa Độc', 'special', 100, 95, 10, { effect: { status: { id: 'toxic', chance: 30 } } }],
    ['grass', 'bug', 'combo_forest_swarm', 'Bầy Bọ Trong Rừng', 'physical', 95, 95, 10, { flags: { contact: true }, effect: { drain: 0.3 } }],
    ['grass', 'flying', 'combo_leaf_flight', 'Lá Bay Trong Gió', 'special', 95, 95, 10, { effect: { flinch: 25 } }],
    ['grass', 'psychic', 'combo_forest_mind', 'Tâm Hồn Rừng Sâu', 'special', 100, 95, 10, { effect: { heal: 0.25 } }],
    ['grass', 'ground', 'combo_root_hold', 'Rễ Bám Đất', 'physical', 100, 95, 10, { effect: { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 40 } } }],
    ['grass', 'fairy', 'combo_fairy_garden', 'Vườn Tiên', 'special', 100, 95, 10, { effect: { heal: 0.3 } }],

    ['ice', 'ground', 'combo_frozen_earth', 'Đất Đóng Băng', 'physical', 105, 95, 8, { effect: { flinch: 25 } }],
    ['ice', 'psychic', 'combo_frozen_mind', 'Tâm Trí Đóng Băng', 'special', 100, 95, 10, { effect: { status: { id: 'freeze', chance: 20 } } }],
    ['ice', 'dragon', 'combo_ice_dragon', 'Rồng Băng', 'special', 115, 90, 8, { effect: { status: { id: 'freeze', chance: 25 } } }],
    ['ice', 'ghost', 'combo_ghost_frost', 'Băng Ma', 'special', 105, 95, 10, { effect: { status: { id: 'freeze', chance: 20 } } }],

    ['fighting', 'dark', 'combo_shadow_fist', 'Đấm Trong Bóng Tối', 'physical', 110, 95, 8, { flags: { contact: true }, effect: { flinch: 30 } }],
    ['fighting', 'steel', 'combo_iron_fist', 'Cú Đấm Thép', 'physical', 110, 95, 8, { flags: { contact: true }, effect: { stat: { target: 'self', stat: 'atk', stages: 1, chance: 30 } } }],
    ['fighting', 'ground', 'combo_earth_fist', 'Cú Đấm Đất', 'physical', 110, 95, 8, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['fighting', 'flying', 'combo_sky_kick', 'Cú Đá Giữa Trời', 'physical', 105, 95, 10, { flags: { contact: true }, effect: { flinch: 30 } }],

    ['poison', 'dark', 'combo_toxic_shadow', 'Độc Trong Bóng Tối', 'special', 100, 95, 10, { effect: { status: { id: 'toxic', chance: 30 } } }],
    ['poison', 'bug', 'combo_poison_swarm', 'Bầy Bọ Độc', 'physical', 95, 95, 10, { flags: { contact: true }, effect: { status: { id: 'toxic', chance: 30 } } }],
    ['poison', 'ground', 'combo_poison_mud', 'Bùn Nhiễm Độc', 'special', 100, 95, 10, { effect: { status: { id: 'poison', chance: 40 } } }],
    ['poison', 'psychic', 'combo_toxic_mind', 'Tâm Trí Nhiễm Độc', 'special', 100, 95, 10, { effect: { status: { id: 'confusion', chance: 30 } } }],

    ['ground', 'rock', 'combo_stone_earth', 'Đá Từ Lòng Đất', 'physical', 115, 90, 8, { effect: { flinch: 30 } }],
    ['ground', 'dragon', 'combo_sand_dragon', 'Rồng Cát', 'special', 110, 95, 8, { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 30 } } }],
    ['rock', 'dragon', 'combo_stone_dragon', 'Rồng Đá', 'physical', 115, 90, 8, { effect: { flinch: 30 } }],
    ['rock', 'steel', 'combo_steel_stone', 'Đá Thép', 'physical', 110, 95, 8, { effect: { stat: { target: 'self', stat: 'def', stages: 1, chance: 30 } } }],

    ['ghost', 'dark', 'combo_night_soul', 'Linh Hồn Bóng Đêm', 'special', 110, 95, 8, { effect: { status: { id: 'fear', chance: 25 } } }],
    ['ghost', 'psychic', 'combo_soul_mind', 'Tâm Hồn', 'special', 105, 95, 10, { effect: { status: { id: 'confusion', chance: 30 } } }],
    ['ghost', 'dragon', 'combo_spectral_dragon', 'Rồng Linh Hồn', 'special', 115, 90, 8, { effect: { drain: 0.3 } }],

    ['dragon', 'flying', 'combo_sky_dragon', 'Rồng Trên Trời', 'physical', 110, 95, 8, { flags: { contact: true }, effect: { flinch: 30 } }],
    ['dragon', 'fairy', 'combo_fairy_dragon', 'Rồng Tiên', 'special', 110, 95, 8, { effect: { heal: 0.25 } }],
    ['dragon', 'celestial', 'combo_holy_dragon', 'Rồng Thiên Giới', 'special', 125, 90, 5, { effect: { flinch: 30 } }],

    ['dark', 'fairy', 'combo_dark_fairy', 'Tiên Trong Bóng Tối', 'special', 100, 95, 10, { effect: { status: { id: 'fear', chance: 25 } } }],
    ['dark', 'psychic', 'combo_dark_mind', 'Tâm Trí U Tối', 'special', 105, 95, 10, { effect: { status: { id: 'confusion', chance: 30 } } }],
    ['dark', 'steel', 'combo_dark_steel', 'Thép Trong Đêm', 'physical', 110, 95, 8, { flags: { contact: true }, effect: { flinch: 25 } }],

    ['steel', 'fairy', 'combo_steel_fairy', 'Thép Của Tiên', 'physical', 105, 95, 10, { effect: { stat: { target: 'self', stat: 'def', stages: 1, chance: 30 } } }],
    ['steel', 'psychic', 'combo_steel_mind', 'Tâm Thép', 'special', 105, 95, 10, { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 30 } } }],
    ['fairy', 'flying', 'combo_fairy_flight', 'Tiên Bay Trên Trời', 'special', 100, 95, 10, { effect: { flinch: 25 } }],

    ['celestial', 'psychic', 'combo_holy_mind', 'Tâm Thiên Giới', 'special', 120, 95, 5, { effect: { status: { id: 'confusion', chance: 30 } } }],
    ['celestial', 'dark', 'combo_holy_shadow', 'Bóng Tối Thiên Giới', 'special', 120, 95, 5, { effect: { status: { id: 'fear', chance: 25 } } }],
    ['neutral', 'normal', 'combo_pure_balance', 'Cân Bằng Hoàn Hảo', 'physical', 95, 100, 10, { flags: { sureHit: true, noDodge: true } }],
    ['neutral', 'fire', 'combo_neutral_flame', 'Lửa Cân Bằng', 'special', 100, 100, 10, { flags: { sureHit: true, noDodge: true }, effect: { status: { id: 'burn', chance: 20 } } }],

    ['fire', 'bug', 'combo_ember_swarm', 'Bầy Lửa', 'special', 100, 95, 10, { effect: { status: { id: 'burn', chance: 25 } } }],
    ['water', 'bug', 'combo_tide_swarm', 'Bầy Theo Sóng', 'physical', 95, 95, 10, { flags: { contact: true }, effect: { drain: 0.3 } }],
    ['electric', 'grass', 'combo_volt_bloom', 'Hoa Trong Sét', 'special', 100, 95, 10, { effect: { status: { id: 'paralysis', chance: 25 }, drain: 0.25 } }],
    ['ice', 'fighting', 'combo_frost_fist', 'Cú Đấm Băng', 'physical', 110, 95, 8, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['poison', 'steel', 'combo_toxic_alloy', 'Hợp Kim Độc', 'physical', 105, 95, 10, { flags: { contact: true }, effect: { status: { id: 'toxic', chance: 25 } } }],
    ['rock', 'ghost', 'combo_gravestone', 'Bia Đá', 'special', 110, 95, 8, { effect: { status: { id: 'fear', chance: 25 } } }],
    ['dark', 'ground', 'combo_dark_earth', 'Đất Trong Bóng Tối', 'physical', 110, 95, 8, { flags: { contact: true }, effect: { flinch: 25 } }],
    ['fairy', 'psychic', 'combo_fairy_mind', 'Tâm Hồn Tiên', 'special', 105, 95, 10, { effect: { status: { id: 'confusion', chance: 25 }, heal: 0.2 } }],
    ['celestial', 'quantum', 'combo_holy_phase', 'Dịch Pha Thiên Giới', 'special', 120, 95, 5, { flags: { sureHit: true, noDodge: true } }],
    ['glitch', 'quantum', 'combo_glitch_paradox', 'Nghịch Lý Hệ Thống', 'special', 110, 95, 8, { effect: { status: { id: 'confusion', chance: 40 } } }]
  ];

  function comboKey(a, b) {
    return [a, b].slice().sort().join('|');
  }

  const comboMoves = {};
  const dualSkills = {};
  for (const row of COMBOS) {
    const extra = row[8] || {};
    extra.flags = Object.assign({}, extra.flags, { combo: [row[0], row[1]] });
    extra.desc = extra.desc || ('Kết hợp sức mạnh ' + (PG.TYPES[row[0]] || {}).name + ' và ' + (PG.TYPES[row[1]] || {}).name + '. Lấy hệ khắc tốt nhất, cộng thêm sát thương khi người dùng mang đúng cả 2 hệ.');
    comboMoves[row[2]] = M(row[2], row[3], row[0], row[4], row[5], row[6], row[7], extra);
    dualSkills[comboKey(row[0], row[1])] = row[2];
  }
  Object.assign(PG.MOVES, comboMoves);
  PG.DUAL_SKILLS = Object.assign({}, PG.DUAL_SKILLS || {}, dualSkills);
  PG.COMBO_MOVES = Object.assign({}, PG.COMBO_MOVES || {}, comboMoves);
  PG.comboKeyForTypes = function (types) {
    if (!types || types.length !== 2) return '';
    return comboKey(types[0], types[1]);
  };
  PG.isDualTypeExempt = function (sp) {
    return !!sp && (sp.types || []).some(function (t) {
      const special = PG.TYPE_SPECIAL && PG.TYPE_SPECIAL[t];
      return !!(special && special.singleTypeOnly);
    });
  };

  /* ---------- ĐẶC TÍNH MỚI (đều có hiệu ứng thật) ---------- */
  Object.assign(PG.ABILITIES, {
    'molten-core': { name: 'Lõi Nóng Chảy', desc: 'Chiêu Lửa mạnh +15% và có thêm 25% gây Bỏng.' },
    'deep-current': { name: 'Dòng Triều Sâu', desc: 'Chiêu Nước hồi thêm 10% sát thương gây ra.' },
    'storm-caller': { name: 'Gọi Sét', desc: 'Chiêu Điện mạnh +15% và có thêm 15% gây Tê liệt.' },
    'verdant-heart': { name: 'Trái Tim Xanh', desc: 'Chiêu Cỏ hồi thêm 15% sát thương gây ra.' },
    frostbite: { name: 'Sương Giá', desc: 'Chiêu Băng có 25% giảm 1 bậc Tốc độ đối thủ.' },
    'iron-fist': { name: 'Nắm Đấm Thép', desc: 'Chiêu cận chiến hệ Giác đấu/Thép mạnh +15%.' },
    'venom-gland': { name: 'Tuyến Độc', desc: 'Chiêu Độc có thêm 25% gây Độc nặng.' },
    'dune-rider': { name: 'Kẻ Cưỡi Cát', desc: 'Chiêu Đất/Đá mạnh +15% khi có bão cát.' },
    'sky-step': { name: 'Bước Trên Không', desc: 'Chiêu Bay có thêm 15% làm đối thủ giật mình.' },
    'dream-weaver': { name: 'Dệt Mộng', desc: 'Chiêu Tâm linh/Ma/Tiên có thêm 15% gây Bối rối.' },
    'hive-mind': { name: 'Ý Thức Bầy Đàn', desc: 'Chiêu Bọ có 20% giảm 1 bậc Phòng thủ đối thủ.' },
    'dragon-heart': { name: 'Tim Rồng', desc: 'Chiêu Rồng mạnh +10% nhưng nhận 10% sát thương phản lực.' },
    'night-terror': { name: 'Kinh Hãi Đêm', desc: 'Chiêu Bóng tối có thêm 20% gây Sợ hãi.' },
    'chrome-skin': { name: 'Da Crôm', desc: 'Giảm 20% sát thương vật lý nhận vào.' },
    'fairy-ward': { name: 'Khiên Tiên', desc: 'Giảm 20% sát thương đặc biệt nhận vào.' },
    'dual-current': { name: 'Hợp Thể Song Hệ', desc: 'Chiêu thuộc một trong 2 hệ của Pokémon mạnh +10% (dùng được với chiêu phối hợp).' }
  });

  const ABILITY_POOL = {
    normal: ['dual-current'], fire: ['molten-core', 'dual-current'], water: ['deep-current', 'dual-current'],
    electric: ['storm-caller', 'dual-current'], grass: ['verdant-heart', 'dual-current'],
    ice: ['frostbite', 'dual-current'], fighting: ['iron-fist', 'dual-current'],
    poison: ['venom-gland', 'dual-current'], ground: ['dune-rider', 'dual-current'],
    flying: ['sky-step', 'dual-current'], psychic: ['dream-weaver', 'dual-current'],
    bug: ['hive-mind', 'dual-current'], rock: ['dune-rider', 'dual-current'],
    ghost: ['dream-weaver', 'dual-current'], dragon: ['dragon-heart', 'dual-current'],
    dark: ['night-terror', 'dual-current'], steel: ['iron-fist', 'chrome-skin', 'dual-current'],
    fairy: ['fairy-ward', 'dual-current'], neutral: ['dual-current'],
    celestial: ['dual-current'], quantum: ['dual-current'], glitch: ['dual-current']
  };
  for (const type of Object.keys(ABILITY_POOL)) {
    if (!PG.TYPE_ABILITIES[type]) PG.TYPE_ABILITIES[type] = [];
    for (const id of ABILITY_POOL[type]) {
      if (PG.ABILITIES[id] && PG.TYPE_ABILITIES[type].indexOf(id) < 0) PG.TYPE_ABILITIES[type].push(id);
    }
  }

  PG.SKILLS_EXPANSION = {
    typeMoves: addedMoves,
    comboMoves,
    dualSkills,
    abilities: PG.ABILITIES,
    counts: {
      typeMoves: Object.keys(addedMoves).length,
      comboMoves: Object.keys(comboMoves).length,
      abilities: Object.keys(ABILITY_POOL).reduce((n, t) => n + ABILITY_POOL[t].length, 0)
    }
  };
})();
