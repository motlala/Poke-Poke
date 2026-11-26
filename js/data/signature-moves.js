/* ============================================================
   CHIÊU ĐẶC TRƯNG HUYỀN THOẠI & CHIÊU MỞ KHÓA KHI TIẾN HÓA
   - Dựa trên cốt truyện / game gốc (Sacred Fire, Bolt Strike, V-create...)
   - Huyền thoại không có chiêu riêng được đặt tên thì dùng Tuyệt Kỹ theo hệ.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const M = (id, name, type, category, power, accuracy, pp, extra) => Object.assign({
    id, name, type, category, power, accuracy, pp,
    priority: 0, critBoost: 0, flags: {}, effect: null,
    desc: '', signature: true
  }, extra || {});

  /* ---------- CHIÊU ĐẶC TRƯNG THEO TRUYỆN / GAME ---------- */
  const SIGNATURE_MOVES = {
    psystrike: M('psystrike', 'Tâm Lực Xuyên Thấu', 'psychic', 'special', 100, 100, 10,
      { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 40 } }, desc: 'Mewtwo đọc tâm và xuyên thủng phòng thủ đối phương.' }),
    genesis_wave: M('genesis_wave', 'Sóng Khởi Nguyên', 'psychic', 'special', 100, 100, 10,
      { effect: { stat: { target: 'self', stat: 'spa', stages: 1, chance: 100 } }, desc: 'Sức mạnh của loài Pokémon đầu tiên.' }),
    sacred_fire: M('sacred_fire', 'Lửa Thần Thánh', 'fire', 'special', 120, 100, 5,
      { effect: { status: { id: 'burn', chance: 50 }, heal: 0.3 }, desc: 'Ngọn lửa của Ho-Oh thiêu rụi và hồi phục chính mình.' }),
    aeroblast: M('aeroblast', 'Khí Cầu Xoáy', 'flying', 'special', 120, 95, 5,
      { effect: { flinch: 30 }, desc: 'Luồng gió xoáy của Lugia, có thể làm đối thủ giật mình.' }),
    origin_pulse: M('origin_pulse', 'Dao Động Khởi Thủy', 'water', 'special', 130, 85, 5,
      { desc: 'Sóng nước nguyên thủy của Kyogre.' }),
    precipice_blades: M('precipice_blades', 'Lưỡi Vực Sâu', 'ground', 'physical', 130, 90, 5,
      { effect: { status: { id: 'burn', chance: 20 } }, desc: 'Groudon bóc tách mặt đất bằng lưỡi magma.' }),
    dragon_ascent: M('dragon_ascent', 'Thăng Long Phiệt', 'dragon', 'physical', 130, 95, 5,
      { effect: { drain: 0.3 }, desc: 'Rayquaza vút lên trời cao rồi lao xuống.' }),
    roar_of_time: M('roar_of_time', 'Gầm Gừ Thời Gian', 'steel', 'special', 120, 95, 5,
      { effect: { stat: { target: 'foe', stat: 'spe', stages: -2, chance: 50 } }, desc: 'Dialga điều khiển dòng chảy thời gian.' }),
    spatial_rend: M('spatial_rend', 'Xé Toạc Không Gian', 'water', 'special', 120, 95, 5,
      { effect: { flinch: 30 }, desc: 'Palkia bẻ cong không gian quanh đối thủ.' }),
    shadow_force: M('shadow_force', 'U Linh Phản Nghịch', 'ghost', 'physical', 130, 90, 5,
      { effect: { stat: { target: 'foe', stat: 'def', stages: -1, chance: 30 } }, desc: 'Giratina kéo đối thủ vào thế giới ngược.' }),
    blue_flare: M('blue_flare', 'Ngọn Lửa Xanh', 'fire', 'special', 140, 90, 5,
      { effect: { status: { id: 'burn', chance: 40 } }, desc: 'Ngọn lửa thuần khiết của Reshiram — cháy bằng sự thật.' }),
    bolt_strike: M('bolt_strike', 'Sét Tấn Công', 'electric', 'physical', 140, 90, 5,
      { effect: { status: { id: 'paralysis', chance: 40 } }, desc: 'Cú đấm sét của Zekrom — hiện thân của lý trí.' }),
    glaciate: M('glaciate', 'Sương Giá Cực Hàn', 'ice', 'special', 100, 90, 10,
      { effect: { stat: { target: 'foe', stat: 'spe', stages: -2, chance: 100 } }, desc: 'Kyurem đóng băng không khí, làm chậm đối thủ.' }),
    v_create: M('v_create', 'Hủy Diệt Tốc Độ', 'fire', 'physical', 140, 95, 5,
      { effect: { recoil: 0.2, status: { id: 'burn', chance: 20 } }, desc: 'Chiêu của Victini vốn dĩ quá mạnh nên chính nó cũng chịu phản lực.' }),
    wishing_star: M('wishing_star', 'Ngôi Sao Điều Ước', 'steel', 'special', 100, 100, 10,
      { effect: { heal: 0.4 }, desc: 'Jirachi ban điều ước cho người thuần khiết.' }),
    spacial_rend: M('spacial_rend', 'Xé Rách Chiều Không', 'psychic', 'special', 130, 90, 5,
      { effect: { stat: { target: 'foe', stat: 'spd', stages: -1, chance: 30 } }, desc: 'Deoxys điều khiển không gian ở cấp độ lượng tử.' }),
    dark_void: M('dark_void', 'Khoảng Không Đen Tối', 'dark', 'special', 110, 85, 5,
      { effect: { status: { id: 'sleep', chance: 35 } }, desc: 'Darkrai đưa đối thủ vào cơn ác mộng.' }),
    seed_flare: M('seed_flare', 'Chói Lửa Hạt Giống', 'grass', 'special', 120, 95, 5,
      { effect: { heal: 0.4 }, desc: 'Shaymin dùng sức sống của hoa để hồi phục.' }),
    aqua_heart: M('aqua_heart', 'Trái Tim Biển Cả', 'water', 'special', 100, 100, 10,
      { effect: { heal: 0.5 }, desc: 'Manaphy kết nối với biển cả để hồi sinh thể lực.' }),
    luster_purge: M('luster_purge', 'Thanh Trừng Rực Rỡ', 'dragon', 'special', 110, 95, 5,
      { effect: { stat: { target: 'foe', stat: 'spa', stages: -1, chance: 30 } }, desc: 'Latias / Latios dùng tinh thể để xóa hiệu ứng của đối phương.' }),
    time_rift: M('time_rift', 'Vết Nứt Thời Gian', 'celestial', 'special', 140, 95, 5,
      { effect: { flinch: 30 }, desc: 'Chronos xé toạc dòng thời gian.' }),
    aether_judgment: M('aether_judgment', 'Phán Xét Thượng Giới', 'celestial', 'special', 130, 95, 5,
      { critBoost: 1, desc: 'Aether Dragon mang quyền năng của tầng không trung.' }),
    void_rift: M('void_rift', 'Hố Đen Hư Vô', 'psychic', 'special', 130, 90, 5,
      { effect: { status: { id: 'confusion', chance: 30 } }, desc: 'Void Mew mở lối vào khoảng không trống rỗng.' }),
    moon_tide: M('moon_tide', 'Thủy Triều Nguyệt Quang', 'fairy', 'special', 120, 100, 5,
      { effect: { heal: 0.3 }, desc: 'Lunarae hòa mình vào ánh trăng để hồi phục.' }),
    ulforce_blade: M('ulforce_blade', 'Lưỡi Siêu Tốc', 'dragon', 'physical', 130, 95, 5,
      { priority: 1, desc: 'Ulforce Veedramon ra đòn trước nhờ sức mạnh tốc độ.' }),
    ryu_flame: M('ryu_flame', 'Hỏa Long Nhảy Múa', 'dragon', 'special', 130, 90, 5,
      { effect: { status: { id: 'burn', chance: 30 } }, desc: 'Blazamut Ryu thả lửa rồng xuống chiến trường.' })
  };

  /* ---------- CHIÊU MỞ KHÓA KHI TIẾN HÓA (không có ở dạng cơ bản) ---------- */
  const EVOLUTION_MOVES = {
    venom_bloom: M('venom_bloom', 'Nở Hoa Độc', 'poison', 'special', 80, 100, 10,
      { effect: { status: { id: 'poison', chance: 40 } }, desc: 'Ivysaur mở khóa khi tiến hóa.' }),
    frenzy_plant: M('frenzy_plant', 'Thực Vật Điên Cuồng', 'grass', 'special', 140, 90, 5,
      { flags: { recharge: true }, desc: 'Venusaur mở khóa khi tiến hóa.' }),
    flame_claw: M('flame_claw', 'Vuốt Lửa', 'fire', 'physical', 80, 100, 10,
      { flags: { contact: true }, effect: { status: { id: 'burn', chance: 30 } }, desc: 'Charmeleon mở khóa khi tiến hóa.' }),
    blaze_burst: M('blaze_burst', 'Bùng Nổ Lửa Rồng', 'fire', 'special', 135, 90, 5,
      { effect: { status: { id: 'burn', chance: 35 } }, desc: 'Charizard mở khóa khi tiến hóa.' }),
    iron_shell: M('iron_shell', 'Giáp Thép Vỏ Rùa', 'water', 'status', 0, null, 10,
      { effect: { heal: 0.4, stat: { target: 'self', stat: 'def', stages: 1 } }, desc: 'Wartortle mở khóa khi tiến hóa.' }),
    hydro_cannon: M('hydro_cannon', 'Đại Pháo Nước', 'water', 'special', 140, 90, 5,
      { effect: { recoil: 0.1 }, desc: 'Blastoise mở khóa khi tiến hóa.' }),
    volt_crusher: M('volt_crusher', 'Sét Nghiền', 'electric', 'physical', 120, 95, 5,
      { flags: { contact: true }, effect: { status: { id: 'paralysis', chance: 25 } }, desc: 'Raichu mở khóa khi tiến hóa.' }),
    psychic_edge: M('psychic_edge', 'Lưỡi Tâm Linh', 'psychic', 'special', 120, 95, 5,
      { critBoost: 1, desc: 'Kadabra / Alakazam mở khóa khi tiến hóa.' }),
    phantom_force: M('phantom_force', 'Lực Lượng Ma Quái', 'ghost', 'special', 120, 95, 5,
      { effect: { status: { id: 'confusion', chance: 25 } }, desc: 'Gengar mở khóa khi tiến hóa.' }),
    dragon_rush: M('dragon_rush', 'Lao Tới Rồng', 'dragon', 'physical', 120, 95, 5,
      { effect: { flinch: 30 }, desc: 'Dragonite mở khóa khi tiến hóa.' }),
    stone_crush: M('stone_crush', 'Nghiền Đá', 'rock', 'physical', 130, 90, 5,
      { effect: { flinch: 30 }, desc: 'Tyranitar mở khóa khi tiến hóa.' }),
    mega_drain: M('mega_drain', 'Hút Sống Cực Đại', 'grass', 'special', 120, 95, 5,
      { effect: { drain: 0.6 }, desc: 'Dạng tiến hóa cuối của dòng cỏ mở khóa.' })
  };

  Object.assign(PG.MOVES, SIGNATURE_MOVES, EVOLUTION_MOVES);

  /* Tuyệt Kỹ theo hệ thành chiêu thật để làm chiêu đặc trưng dự phòng cho huyền thoại. */
  const FALLBACK_MOVES = {};
  for (const [type, u] of Object.entries(PG.ULTIMATES || {})) {
    const id = 'ult_' + type;
    FALLBACK_MOVES[id] = M(id, u.name, u.type, u.category, u.power, u.accuracy, 8, {
      flags: u.flags || {}, effect: u.effect || null, critBoost: u.critBoost || 0,
      signature: true, desc: (u.desc || '') + ' (Chiêu riêng của huyền thoại.)'
    });
  }
  Object.assign(PG.MOVES, FALLBACK_MOVES);

  /* ---------- GÁN CHO LOÀI ---------- */
  const S = {};
  function bind(ids, moves) { for (const id of ids.split(/\s+/)) S[id] = moves; }
  bind('mewtwo film-mewtwo-normal film-mewtwo-armor film-mewtwo-mega-x film-mewtwo-mega-y', ['psystrike']);
  bind('mew film-mew', ['genesis_wave']);
  bind('arceus film-arceus', ['judgment']);
  bind('ho-oh', ['sacred_fire']);
  bind('lugia', ['aeroblast']);
  bind('kyogre film-kyogre-primal', ['origin_pulse']);
  bind('groudon film-groudon-primal', ['precipice_blades']);
  bind('rayquaza film-rayquaza film-rayquaza-mega', ['dragon_ascent']);
  bind('dialga', ['roar_of_time']);
  bind('palkia', ['spatial_rend']);
  bind('giratina', ['shadow_force']);
  bind('reshiram', ['blue_flare']);
  bind('zekrom', ['bolt_strike']);
  bind('kyurem', ['glaciate']);
  bind('victini', ['v_create']);
  bind('jirachi', ['wishing_star']);
  bind('deoxys', ['spacial_rend']);
  bind('darkrai', ['dark_void']);
  bind('shaymin', ['seed_flare']);
  bind('manaphy', ['aqua_heart']);
  bind('latias latios', ['luster_purge']);
  bind('chronos', ['time_rift']);
  bind('aether-dragon', ['aether_judgment']);
  bind('void-mew', ['void_rift']);
  bind('lunarae', ['moon_tide']);
  bind('cross-digi-ulforce-v-dramon', ['ulforce_blade']);
  bind('cross-pal-blazamut-ryu', ['ryu_flame']);

  const E = {
    ivysaur: ['venom_bloom'], venusaur: ['frenzy_plant'],
    charmeleon: ['flame_claw'], charizard: ['blaze_burst'],
    wartortle: ['iron_shell'], blastoise: ['hydro_cannon'],
    raichu: ['volt_crusher'],
    kadabra: ['psychic_edge'], alakazam: ['psychic_edge'],
    haunter: ['phantom_force'], gengar: ['phantom_force'],
    dragonite: ['dragon_rush'], tyranitar: ['stone_crush']
  };

  /** Chiêu riêng theo loài, kể cả Tuyệt Kỹ dự phòng cho huyền thoại chưa có tên riêng. */
  function signatureFor(speciesId) {
    const out = [];
    if (S[speciesId]) out.push.apply(out, S[speciesId]);
    const sp = PG.SPECIES && PG.SPECIES[speciesId];
    if (sp && (sp.rarity === 'legendary' || sp.mythical)) {
      const id = 'ult_' + (sp.types[0] || 'normal');
      if (PG.MOVES[id] && out.indexOf(id) < 0) out.push(id);
    }
    // Pokémon 2 hệ học thêm 1 chiêu phối hợp của đúng 2 hệ đó.
    if (sp && sp.types.length === 2 && !(PG.isDualTypeExempt && PG.isDualTypeExempt(sp))) {
      const pair = sp.types.slice().sort().join('|');
      const combo = PG.DUAL_SKILLS && PG.DUAL_SKILLS[pair];
      if (combo && PG.MOVES[combo] && out.indexOf(combo) < 0) out.push(combo);
    }
    return out;
  }

  /** Learnset đầy đủ của một loài: chiêu theo hệ + chiêu riêng + chiêu tiến hóa. */
  function movesForSpecies(speciesId, level) {
    const sp = PG.SPECIES && PG.SPECIES[speciesId];
    const lv = level === undefined ? 100 : level;
    if (!sp) return PG.movesForTypes([], lv);
    const list = PG.movesForTypes(sp.types, lv).map(m => ({ id: m.id, level: m.level }));
    const seen = new Set(list.map(m => m.id));
    for (const id of signatureFor(speciesId).concat(E[speciesId] || [])) {
      if (PG.MOVES[id] && !seen.has(id)) { seen.add(id); list.push({ id, level: 1 }); }
    }
    return list.sort((a, b) => a.level - b.level);
  }

  PG.SIGNATURE_MOVES = SIGNATURE_MOVES;
  PG.EVOLUTION_MOVES = EVOLUTION_MOVES;
  PG.SPECIATURE_BY_SPECIES = S;
  PG.EVOLUTION_MOVES_BY_SPECIES = E;
  PG.signatureFor = signatureFor;
  PG.movesForSpecies = movesForSpecies;
})();

