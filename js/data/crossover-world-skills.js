/* ============================================================
   CHIÊU RIÊNG TỪ CÁC THẾ GIỚI CROSSOVER
   - Palworld / Digimon / Pokémon điện ảnh / Honkai: Nexus Anima.
   - Những nhân vật tiêu biểu có chiêu lấy cảm hứng từ kỹ năng gốc
     (Pepper Breath, Icy Breath, tên lửa Jetragon, Holy Arrow...).
   - Các loài còn lại cũng nhận một chiêu riêng theo đúng thế giới
     của mình để Pokédex/chiến đấu không bị trống.
   - Mọi chiêu đều mang cờ `world` để UI dựng hiệu ứng riêng.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};
  const M = PG.MOVES;
  const S = PG.SPECIATURE_BY_SPECIES || (PG.SPECIATURE_BY_SPECIES = {});

  const WORLD_LABELS = {
    palworld: 'Palworld',
    digimon: 'Digimon',
    movie: 'Điện Ảnh',
    anima: 'Nexus Anima'
  };

  function make(id, name, type, category, power, accuracy, pp, world, extra) {
    return Object.assign({
      id, name, type, category, power, accuracy, pp,
      priority: 0, critBoost: 0, flags: { signature: true, world: world },
      effect: null, signature: true, world: world, desc: ''
    }, extra || {});
  }
  function slug(id) {
    return String(id).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  function bind(speciesId, moveId) {
    if (!PG.SPECIES[speciesId] || !M[moveId]) return false;
    const list = (S[speciesId] || []).slice();
    if (list.indexOf(moveId) < 0) list.push(moveId);
    S[speciesId] = list;
    return true;
  }

  /* ---------- CHIÊU CỔ ĐIỂN CỦA TỪNG THẾ GIỚI ---------- */
  const HANDCRAFTED = [
    /* Palworld */
    ['pal_frost_fang', 'Răng Băng Chillet', 'ice', 'physical', 92, 100, 15, 'palworld',
      { effect: { status: { id: 'freeze', chance: 22 } }, desc: 'Chillet quấn lông băng rồi cắn bằng hơi thở đông lạnh.' }, 'cross-chillet'],
    ['pal_wool_bounce', 'Lông Cừu Nhảy Múa', 'normal', 'status', 0, null, 10, 'palworld',
      { effect: { heal: 0.3, stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } }, desc: 'Lamball nảy lên với lông mềm, hồi sức và tăng né.' }, 'cross-lamball'],
    ['pal_penguin_cannon', 'Đại Bác Pengullet', 'water', 'physical', 102, 95, 10, 'palworld',
      { effect: { flinch: 30 }, desc: 'Pengullet nhảy vào nòng đại bác nước rồi bắn thẳng mục tiêu.' }, 'cross-pengullet'],
    ['pal_volt_fur', 'Sét Trong Lông', 'electric', 'special', 92, 100, 15, 'palworld',
      { effect: { status: { id: 'paralysis', chance: 28 } }, desc: 'Jolthog xả lượng điện tích tụ trong bộ lông.' }, 'cross-jolthog'],
    ['pal_dream_veil', 'Màn Mơ Daedream', 'psychic', 'special', 96, 95, 10, 'palworld',
      { effect: { status: { id: 'confusion', chance: 35 } }, desc: 'Daedream kéo đối thủ vào giấc mơ lơ lửng.' }, 'cross-daedream'],
    ['pal_thunder_laser', 'Tia Sét Grizzbolt', 'electric', 'special', 120, 95, 5, 'palworld',
      { effect: { status: { id: 'paralysis', chance: 35 } }, desc: 'Grizzbolt bắn chùm tia điện từ súng trên vai.' }, 'cross-grizzbolt'],
    ['pal_missile_barrage', 'Mưa Tên Lửa Jetragon', 'dragon', 'special', 132, 90, 5, 'palworld',
      { effect: { multihit: [2, 3] }, desc: 'Jetragon phóng liên tiếp tên lửa từ cánh sau.' }, 'cross-jetragon'],
    ['pal_eternal_blizzard', 'Băng Hà Vĩnh Cửu', 'ice', 'special', 125, 95, 5, 'palworld',
      { effect: { status: { id: 'freeze', chance: 30 } }, desc: 'Frostallion giáng cơn băng giá xuống toàn sân.' }, 'cross-pal-frostallion'],
    ['pal_vermilion_wing', 'Cánh Đỏ Suzaku', 'fire', 'special', 124, 95, 5, 'palworld',
      { effect: { status: { id: 'burn', chance: 35 }, heal: 0.15 }, desc: 'Suzaku vỗ cánh lửa hoàng hôn, vừa đốt vừa hồi sức.' }, 'cross-pal-suzaku'],
    ['pal_bloom_heal', 'Hoa Chữa Lành Lyleen', 'grass', 'status', 0, null, 10, 'palworld',
      { effect: { heal: 0.4, stat: { target: 'self', stat: 'spe', stages: 1 } }, desc: 'Lyleen gọi vườn hoa Pal để hồi phục và tăng tốc.' }, 'cross-lyleen'],
    ['pal_eclipse_charge', 'Bóng Tối Necromus', 'dark', 'physical', 120, 95, 5, 'palworld',
      { effect: { drain: 0.3 }, desc: 'Necromus lao tới trong bóng tối và hút sinh lực.' }, 'cross-necromus'],
    ['pal_dawn_shield', 'Bình Minh Paladius', 'fairy', 'status', 0, null, 10, 'palworld',
      { effect: { heal: 0.35, stat: { target: 'self', stat: 'def', stages: 1, also: { stat: 'spd', stages: 1 } } }, desc: 'Paladius dựng kết giới bình minh cho đồng minh.' }, 'cross-paladius'],
    ['pal_stone_fist', 'Nắm Đấm Anubis', 'steel', 'physical', 116, 95, 10, 'palworld',
      { effect: { stat: { target: 'foe', stat: 'def', stages: -1, chance: 40 } }, desc: 'Anubis đấm bằng nắm thép, làm vỡ phòng thủ.' }, 'cross-pal-anubis'],
    ['pal_magma_shell', 'Mai Núi Lửa', 'fire', 'physical', 112, 95, 10, 'palworld',
      { effect: { flinch: 30, status: { id: 'burn', chance: 25 } }, desc: 'Reptyro húc bằng mai nóng chảy.' }, 'cross-pal-reptyro'],

    /* Nexus Anima — thiết kế gốc lẫn bản 0.3.0 */
    ['anima_twin_light', 'Ánh Sáng Đôi', 'fairy', 'special', 124, 95, 5, 'anima',
      { effect: { heal: 0.2 }, desc: 'Lumeridon Mk.II kết tinh ánh sáng Nexus thành cặp tia.' }, 'cross-anima-lumeridon-mk-ii'],

    /* Digimon */
    ['digi_pepper_breath', 'Hơi Thở Ớt', 'fire', 'special', 92, 100, 15, 'digimon',
      { effect: { status: { id: 'burn', chance: 25 } }, desc: 'Agumon phun hơi nóng từ miệng — Pepper Breath.' }, 'cross-agumon'],
    ['digi_icy_breath', 'Hơi Thở Băng', 'ice', 'special', 92, 100, 15, 'digimon',
      { effect: { status: { id: 'freeze', chance: 22 } }, desc: 'Gabumon thở ra làn sương đóng băng.' }, 'cross-gabumon'],
    ['digi_holy_arrow', 'Mũi Tên Thánh', 'fairy', 'special', 112, 95, 10, 'digimon',
      { critBoost: 1, desc: 'Angemon bắn mũi tên ánh sáng từ cánh tay.' }, 'cross-angemon'],
    ['digi_fox_fire', 'Lửa Cáo Renamon', 'fire', 'special', 102, 95, 10, 'digimon',
      { effect: { status: { id: 'burn', chance: 30 } }, desc: 'Renamon triệu hồi ngọn lửa cáo tinh khôn.' }, 'cross-renamon'],
    ['digi_mega_claw', 'Vuốt Cơ Khí', 'steel', 'physical', 120, 95, 5, 'digimon',
      { effect: { stat: { target: 'foe', stat: 'def', stages: -1, chance: 40 } }, desc: 'Metalgreymon xé phòng thủ bằng vuốt kim loại.' }, 'cross-metalgreymon'],
    ['digi_giga_drill', 'Khoan Vực', 'ground', 'physical', 122, 95, 5, 'digimon',
      { effect: { flinch: 30 }, desc: 'Guilmon khoan xuống đất rồi bật lên dưới chân địch.' }, 'cross-guilmon'],
    ['digi_roaring_fire', 'Gầm Lửa Greymon', 'fire', 'physical', 116, 95, 10, 'digimon',
      { effect: { status: { id: 'burn', chance: 30 } }, desc: 'Greymon húc bằng sừng nóng đỏ.' }, 'cross-greymon'],
    ['digi_royal_knight', 'Thánh Kiếm Hiệp Sĩ', 'steel', 'physical', 130, 90, 5, 'digimon',
      { critBoost: 1, desc: 'Gallantmon giáng thánh kiếm từ bộ giáp hoàng gia.' }, 'cross-gallantmon'],
    ['digi_omega_force', 'Hợp Thể Tối Thượng', 'neutral', 'special', 140, 95, 5, 'digimon',
      { flags: { signature: true, world: 'digimon', sureHit: true, noDodge: true }, desc: 'Omnimon hợp sức mạnh của hai Digimon huyền thoại.' }, 'cross-omnimon'],
    ['digi_seraph_light', 'Ánh Sáng Seraph', 'fairy', 'special', 130, 95, 5, 'digimon',
      { effect: { heal: 0.25 }, desc: 'Seraphimon giải phóng mười cánh ánh sáng.' }, 'cross-seraphimon'],
    ['digi_virus_storm', 'Bão Virus', 'dark', 'special', 120, 95, 5, 'digimon',
      { effect: { status: { id: 'confusion', chance: 35 } }, desc: 'Diablomon phát tán dữ liệu virus vào tâm trí.' }, 'cross-diablomon'],
    ['digi_poison_chew', 'Cắn Độc Kunemon', 'poison', 'physical', 90, 100, 15, 'digimon',
      { effect: { status: { id: 'toxic', chance: 30 } }, desc: 'Kunemon cắn bằng hàm răng pha độc.' }, 'cross-digi-kunemon'],
    ['digi_vine_lash', 'Roi Dây Palmon', 'grass', 'special', 96, 100, 10, 'digimon',
      { effect: { drain: 0.3 }, desc: 'Palmon vung dây leo hút sống đối phương.' }, 'cross-palmon'],
    ['digi_thunder_blade', 'Lưỡi Sét Elecmon', 'electric', 'physical', 115, 95, 10, 'digimon',
      { effect: { status: { id: 'paralysis', chance: 25 } }, desc: 'Elecmon vung lưỡi sét từ tai sừng.' }, 'cross-digi-elecmon'],

    /* Điện ảnh */
    ['film_cap_volt', 'Sét Mũ Huyền Thoại', 'electric', 'special', 112, 100, 10, 'movie',
      { effect: { status: { id: 'paralysis', chance: 25 } }, desc: 'Chiếc mũ đặc trưng khuếch đại sét trên màn ảnh.' },
      'film-pikachu-original-cap film-pikachu-hoenn-cap film-pikachu-sinnoh-cap film-pikachu-unova-cap film-pikachu-kalos-cap film-pikachu-alola-cap film-pikachu-partner-cap'],
    ['film_james_thorn', 'Gai Sân Khấu Cacnea', 'grass', 'physical', 98, 100, 10, 'movie',
      { effect: { flinch: 30 }, desc: 'Cacnea của James tung đòn gai trước ống kính.' }, 'film-cacnea-james'],
    ['film_silver_scratch', 'Vuốt Màn Bạc', 'normal', 'physical', 118, 95, 8, 'movie',
      { critBoost: 1, desc: 'Cú vuốt để lại dư ảnh như một cảnh phim chậm.' },
      'film-mewtwo-normal film-mewtwo-armor film-mewtwo-mega-x film-mewtwo-mega-y'],
    ['film_primal_roar', 'Gầm Nguyên Thủy', 'dragon', 'special', 126, 95, 5, 'movie',
      { effect: { flinch: 30 }, desc: 'Tiếng gầm vang khỏi đại phim thời tiền sử.' },
      'film-groudon-primal film-kyogre-primal film-rayquaza-mega'],
    ['film_credit_fade', 'Kết Phim Huyền Thoại', 'celestial', 'special', 128, 95, 5, 'movie',
      { effect: { heal: 0.2 }, desc: 'Ánh sáng cuối phim bọc lấy Huyền Thoại và hồi sức.' },
      'film-lugia film-ho-oh film-arceus film-deoxys-normal film-deoxys-attack']
  ];

  const handcraftedCount = HANDCRAFTED.length;
  const bound = {};
  for (const row of HANDCRAFTED) {
    const move = make(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8]);
    M[move.id] = move;
    for (const sid of String(row[9] || '').split(/\s+/)) {
      if (sid && bind(sid, move.id)) bound[sid] = move.id;
    }
  }

  /* Anima đã có chiêu riêng từ các file trước: gắn nhãn thế giới để dùng FX riêng. */
  let taggedAnima = 0;
  for (const id of Object.keys(M)) {
    const mv = M[id];
    if (!/^anima_/.test(id) || mv.world) continue;
    mv.world = 'anima';
    mv.flags = Object.assign({}, mv.flags, { signature: true, world: 'anima' });
    mv.signature = true;
    taggedAnima++;
  }

  /* ---------- SINH CHIÊU CHO MỌI LOÀI CROSSOVER CÒN THIẾU ---------- */
  const STYLE = {
    palworld: ['Chưởng Pal', 'Kỹ Nghệ Sinh Tồn', 'Vũ Khí Pal', 'Bí Thuật Đảo Pal'],
    digimon: ['Kỹ Thuật Digi', 'Chiêu Thức Tiến Hóa', 'Dữ Liệu Bùng Nổ', 'Tinh Thần Digi'],
    movie: ['Khoảnh Khắc Điện Ảnh', 'Màn Cảnh Đặc Sắc', 'Ánh Đèn Sân Khấu'],
    anima: ['Nghệ Thuật Nexus', 'Dòng Chảy Anima', 'Phép Liên Kết']
  };
  const EFFECT = {
    normal: { flags: { sureHit: true } },
    fire: { status: { id: 'burn', chance: 30 } },
    water: { stat: { target: 'foe', stat: 'spe', stages: -1, chance: 30 } },
    electric: { status: { id: 'paralysis', chance: 25 } },
    grass: { drain: 0.4 },
    ice: { status: { id: 'freeze', chance: 20 } },
    fighting: { stat: { target: 'self', stat: 'atk', stages: 1, chance: 40 } },
    poison: { status: { id: 'toxic', chance: 30 } },
    ground: { stat: { target: 'foe', stat: 'accuracy', stages: -1, chance: 40 } },
    flying: { flinch: 30 },
    psychic: { status: { id: 'confusion', chance: 30 } },
    bug: { drain: 0.35 },
    rock: { flinch: 30 },
    ghost: { drain: 0.5 },
    dragon: { status: { id: 'burn', chance: 25 } },
    dark: { status: { id: 'fear', chance: 25 } },
    steel: { stat: { target: 'self', stat: 'def', stages: 1, chance: 40 } },
    fairy: { heal: 0.25 },
    celestial: { heal: 0.3 },
    quantum: { status: { id: 'confusion', chance: 40 } },
    glitch: { status: { id: 'confusion', chance: 40 } },
    neutral: { flags: { sureHit: true, noDodge: true } }
  };
  const POWER = { common: 88, rare: 98, mythical: 110, legendary: 120 };

  function worldOf(id, sp) {
    const desc = sp.desc || '';
    if (/^film-/.test(id)) return 'movie';
    if (/^cross-pal-/.test(id) || /^Pal\b/.test(desc)) return 'palworld';
    if (/^cross-digi-/.test(id) || /^Digimon\b/.test(desc)) return 'digimon';
    if (/^cross-anima-/.test(id) || /^Anima\b/.test(desc)) return 'anima';
    return null;
  }
  const byWorld = { palworld: 0, digimon: 0, movie: 0, anima: 0 };
  let generated = 0;
  // DEX_ORDER được thiết lập ở species-finalize.js (load sau file này), nên dùng SPECIES.
  const speciesIds = Object.keys(PG.SPECIES).sort((a, b) =>
    (PG.SPECIES[a].dex || 0) - (PG.SPECIES[b].dex || 0));
  for (const id of speciesIds) {
    const sp = PG.SPECIES[id];
    if (!sp) continue;
    const world = worldOf(id, sp);
    if (!world) continue;
    if ((S[id] || []).some(m => m && M[m] && M[m].world)) continue;
    const type = sp.types && sp.types[0] && PG.TYPES[sp.types[0]] ? sp.types[0] : 'normal';
    const moveId = 'world_' + world.slice(0, 3) + '_' + slug(id);
    if (M[moveId]) { bind(id, moveId); continue; }
    const raw = Object.assign({}, EFFECT[type] || {});
    const extraFlags = raw.flags;
    delete raw.flags;
    const style = STYLE[world];
    const move = make(moveId,
      sp.name + ' · ' + style[sp.dex % style.length],
      type,
      (sp.base && sp.base[1] > sp.base[3]) ? 'physical' : 'special',
      POWER[sp.rarity] || POWER.common,
      95, 10, world,
      {
        flags: Object.assign({ signature: true, world: world }, extraFlags || {}),
        critBoost: ['fighting', 'dark', 'bug'].indexOf(type) >= 0 ? 1 : 0,
        effect: Object.keys(raw).length ? raw : null,
        desc: sp.name + ' sử dụng sức mạnh đặc trưng của thế giới ' + WORLD_LABELS[world] + '.'
      });
    M[moveId] = move;
    bind(id, moveId);
    byWorld[world]++;
    generated++;
  }

  PG.CROSSOVER_WORLD_SKILLS = {
    count: generated + handcraftedCount,
    generated,
    handcrafted: handcraftedCount,
    taggedAnima,
    byWorld,
    worlds: WORLD_LABELS,
    signatures: bound
  };
})();
