/* ============================================================
   VÙNG ĐẤT, THỜI TIẾT, NPC, GYM, RAID, ĐIỂM CÂU
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const WEATHERS = {
    clear:     { name: 'Trời Quang', icon: '🌤️', color: '#7dd3fc', battle: 'none', desc: 'Không có hiệu ứng thời tiết.' },
    sunny:     { name: 'Nắng Gắt',   icon: '☀️', color: '#fbbf24', battle: 'sun', desc: 'Chiêu Lửa +50%, chiêu Nước -50%.' },
    rain:      { name: 'Mưa',        icon: '🌧️', color: '#60a5fa', battle: 'rain', desc: 'Chiêu Nước +50%, chiêu Lửa -50%.' },
    snow:      { name: 'Tuyết Rơi',  icon: '🌨️', color: '#bae6fd', battle: 'snow', desc: 'Chiêu Băng +50%.' },
    sandstorm: { name: 'Bão Cát',    icon: '🌪️', color: '#fde68a', battle: 'sand', desc: 'Chiêu Đá/Đất/Thép +25%, gây sát thương mỗi lượt.' },
    fog:       { name: 'Sương Mù',   icon: '🌫️', color: '#c4b5fd', battle: 'fog', desc: 'Độ chính xác giảm nhẹ, chiêu Ma/Siêu linh mạnh hơn.' }
  };

  const REGIONS = {
    forest: {
      id: 'forest', name: 'Rừng Xanh', emoji: '🌲', subtitle: 'Khu rừng nguyên sinh',
      desc: 'Những tán cây cổ thụ che khuất ánh nắng. Nơi sinh sống của nhiều loài Pokémon hệ Cỏ, Bọ và Tiên.',
      unlock: { level: 1, badges: 0 }, staminaCost: 6, hazard: null,
      types: ['grass', 'bug', 'normal', 'fairy'], weatherPool: ['sunny', 'rain', 'fog', 'clear'],
      particles: 'leaves', bg: 'forest', accent: '#5fbf5f',
      drops: ['leather', 'seed'], featured: ['pikachu', 'eevee', 'scyther', 'ralts'],
      trainer: {
        name: 'Kiểm Lâm Hùng', title: 'Người bảo vệ rừng', quote: 'Muốn đi qua rừng thì phải hiểu tiếng lá!',
        team: [['bulbasaur', 5], ['pidgey', 5], ['oddish', 6]], difficulty: 'medium',
        reward: { coins: 350, xp: 80, items: { pokeball: 3 } }
      },
      gym: {
        leader: 'Mộc Vân', title: 'Trưởng Gym Rừng Xanh', quote: 'Rễ cây kiên cường hơn ngươi tưởng!',
        team: [['ivysaur', 12], ['butterfree', 12], ['vileplume', 14]], difficulty: 'hard',
        badge: 'Huy hiệu Lá', badgeIcon: '🍃', reward: { coins: 1500, xp: 300, items: { greatball: 5, 'leaf-stone': 1 } }
      },
      raid: {
        boss: 'venusaur', level: 20, name: 'Venusaur Khổng Lồ', hpMult: 6,
        reward: { coins: 2000, items: { greatball: 5, 'tm-solar_beam': 1 }, stardust: 800 }
      },
      fishing: {
        id: 'forest-pond', name: 'Ao Rừng', emoji: '🪷', minRod: 0, rarityBonus: 1,
        pool: ['magikarp', 'goldeen', 'poliwag', 'slowpoke', 'marill', 'wooper', 'feebas', 'dratini']
      }
    },
    cave: {
      id: 'cave', name: 'Hang Động', emoji: '🕳️', subtitle: 'Mê cung dưới lòng đất',
      desc: 'Hang sâu tối om với những tinh thể phát sáng. Pokémon hệ Đá, Ma và Giác đấu trú ngụ.',
      unlock: { level: 4, badges: 0 }, staminaCost: 8, hazard: null,
      types: ['rock', 'ground', 'ghost', 'poison', 'fighting', 'dragon'], weatherPool: ['clear', 'fog', 'clear'],
      particles: 'dust', bg: 'cave', accent: '#94a3b8',
      drops: ['stone', 'crystal'], featured: ['gastly', 'larvitar', 'riolu', 'beldum', 'mimikyu'],
      trainer: {
        name: 'Thợ Mỏ Báu', title: 'Người tìm tinh thể', quote: 'Đá biết kể chuyện, nếu ngươi đủ kiên nhẫn nghe.',
        team: [['geodude', 8], ['machop', 9], ['zubat', 8]], difficulty: 'medium',
        reward: { coins: 450, xp: 120, items: { greatball: 3, stone: 5 } }
      },
      gym: {
        leader: 'Thạch Long', title: 'Trưởng Gym Hang Sâu', quote: 'Vững như đá, mạnh như long mạch!',
        team: [['graveler', 16], ['onix', 16], ['rhyhorn', 18], ['steelix', 20]], difficulty: 'hard',
        badge: 'Huy hiệu Đá', badgeIcon: '🪨', reward: { coins: 2500, xp: 500, items: { ultraball: 3, stone: 10, 'tm-earthquake': 1 } }
      },
      raid: {
        boss: 'tyranitar', level: 30, name: 'Tyranitar Hủy Diệt', hpMult: 7,
        reward: { coins: 3500, items: { ultraball: 5, crystal: 5 }, stardust: 1200 }
      },
      fishing: {
        id: 'cave-lake', name: 'Hồ Ngầm', emoji: '💧', minRod: 1, rarityBonus: 1.25,
        pool: ['magikarp', 'wooper', 'quagsire', 'tentacool', 'staryu', 'dratini', 'dragonair', 'feebas', 'milotic'],
        treasure: ['stone', 'crystal', 'relic'], junk: ['shell', 'leather']
      }
    },
    beach: {
      id: 'beach', name: 'Bờ Biển', emoji: '🏖️', subtitle: 'Sóng vỗ rì rào',
      desc: 'Bãi cát trắng trải dài, nơi những con sóng mang theo Pokémon hệ Nước và Bay.',
      unlock: { level: 6, badges: 1 }, staminaCost: 7, hazard: null,
      types: ['water', 'flying', 'rock'], weatherPool: ['sunny', 'rain', 'clear'],
      particles: 'waves', bg: 'beach', accent: '#38bdf8',
      drops: ['feather', 'shell'], featured: ['lapras', 'staryu', 'corsola', 'chinchou'],
      trainer: {
        name: 'Ngư Dân Tèo', title: 'Lão làng câu cá', quote: 'Biển rộng lắm, nhưng cá thì vẫn thích mồi của ta!',
        team: [['magikarp', 10], ['tentacool', 11], ['staryu', 11]], difficulty: 'medium',
        reward: { coins: 600, xp: 160, items: { netball: 3, razz: 2 } }
      },
      gym: {
        leader: 'Hải Vân', title: 'Trưởng Gym Hải Triều', quote: 'Sóng có thể vỗ mòn đá, ngươi có đủ kiên nhẫn không?',
        team: [['wartortle', 18], ['tentacruel', 19], ['starmie', 20], ['lapras', 22]], difficulty: 'hard',
        badge: 'Huy hiệu Sóng', badgeIcon: '🌊', reward: { coins: 3500, xp: 700, items: { ultraball: 4, 'water-stone': 1, 'tm-surf': 1 } }
      },
      raid: {
        boss: 'gyarados', level: 25, name: 'Gyarados Cuồng Nộ', hpMult: 6,
        reward: { coins: 3000, items: { netball: 5, shell: 10 }, stardust: 1000 }
      },
      fishing: {
        id: 'beach-pier', name: 'Bãi Câu Sóng Vỗ', emoji: '🌊', minRod: 0, rarityBonus: 1,
        pool: ['magikarp', 'goldeen', 'tentacool', 'staryu', 'chinchou', 'carvanha', 'qwilfish', 'remoraid', 'corsola', 'starmie', 'sharpedo', 'lanturn', 'lapras', 'gyarados'],
        treasure: ['shell', 'feather', 'stone'], junk: ['shell', 'sand']
      }
    },
    lake: {
      id: 'lake', name: 'Hồ Nước', emoji: '🌊', subtitle: 'Mặt hồ tĩnh lặng',
      desc: 'Hồ nước trong xanh phản chiếu bầu trời. Nơi lý tưởng để câu cá và tìm Pokémon hệ Nước.',
      unlock: { level: 8, badges: 2 }, staminaCost: 7, hazard: null,
      types: ['water', 'grass', 'fairy', 'psychic'], weatherPool: ['sunny', 'rain', 'fog', 'clear'],
      particles: 'fireflies', bg: 'lake', accent: '#22d3ee',
      drops: ['seed', 'shell'], featured: ['dratini', 'marill', 'wooper', 'slowpoke'],
      trainer: {
        name: 'Cô Câu Cá', title: 'Thần đồng câu cá', quote: 'Suỵt... cá đang cắn mồi!',
        team: [['poliwag', 12], ['marill', 13], ['wooper', 13]], difficulty: 'easy',
        reward: { coins: 550, xp: 150, items: { greatball: 3, dough: 2 } }
      },
      gym: {
        leader: 'Thủy Nguyệt', title: 'Trưởng Gym Tĩnh Hồ', quote: 'Mặt hồ phẳng lặng ẩn chứa dòng chảy xiết!',
        team: [['poliwhirl', 22], ['slowbro', 23], ['azumarill', 23], ['kingdra', 25]], difficulty: 'hard',
        badge: 'Huy hiệu Hồ', badgeIcon: '💧', reward: { coins: 4500, xp: 900, items: { ultraball: 4, 'dragon-scale': 1, 'tm-ice_beam': 1 } }
      },
      raid: {
        boss: 'milotic', level: 30, name: 'Milotic Huyền Ảo', hpMult: 6,
        reward: { coins: 4000, items: { greatball: 6, shell: 8 }, stardust: 1500 }
      },
      fishing: {
        id: 'lake-dock', name: 'Bến Thuyền Hồ', emoji: '🛶', minRod: 0, rarityBonus: 1.1,
        pool: ['magikarp', 'goldeen', 'poliwag', 'slowpoke', 'marill', 'wooper', 'staryu', 'feebas', 'dratini', 'dragonair', 'quagsire', 'azumarill', 'milotic', 'gyarados'],
        treasure: ['seed', 'shell', 'water-stone'], junk: ['seed', 'shell']
      }
    },
    volcano: {
      id: 'volcano', name: 'Núi Lửa', emoji: '🌋', subtitle: 'Đất trời rực lửa',
      desc: 'Dung nham chảy thành sông, tro bụi phủ kín bầu trời. Cần đồ chống nóng để đi lại.',
      unlock: { level: 10, badges: 3 }, staminaCost: 10, hazard: { id: 'heat', name: 'Nóng', stat: 'heat', icon: '🔥' },
      types: ['fire', 'rock', 'ground', 'poison'], weatherPool: ['sunny', 'clear', 'sandstorm'],
      particles: 'embers', bg: 'volcano', accent: '#f97316',
      drops: ['ember', 'stone'], featured: ['larvesta', 'charmander', 'houndour', 'growlithe'],
      trainer: {
        name: 'Thợ Rèn Lửa', title: 'Người rèn trong dung nham', quote: 'Lửa không chỉ để đốt, nó còn để rèn!',
        team: [['charmander', 15], ['growlithe', 16], ['houndour', 16]], difficulty: 'medium',
        reward: { coins: 800, xp: 240, items: { greatball: 4, ember: 5 } }
      },
      gym: {
        leader: 'Viêm Long', title: 'Trưởng Gym Hỏa Diệm', quote: 'Ngọn lửa của ta sẽ thiêu rụi mọi do dự!',
        team: [['charmeleon', 26], ['arcanine', 27], ['houndoom', 27], ['flareon', 29]], difficulty: 'hard',
        badge: 'Huy hiệu Lửa', badgeIcon: '🔥', reward: { coins: 6000, xp: 1400, items: { ultraball: 5, 'fire-stone': 1, 'tm-flamethrower': 1 } }
      },
      raid: {
        boss: 'charizard', level: 35, name: 'Charizard Thiêu Đốt', hpMult: 7,
        reward: { coins: 6000, items: { ultraball: 6, ember: 12 }, stardust: 2000 }
      },
      fishing: {
        id: 'hot-spring', name: 'Suối Nước Nóng', emoji: '♨️', minRod: 1, rarityBonus: 1.2,
        pool: ['magikarp', 'goldeen', 'chinchou', 'carvanha', 'qwilfish', 'remoraid', 'octillery', 'sharpedo', 'lanturn', 'gyarados'],
        treasure: ['ember', 'stone', 'fire-stone'], junk: ['stone', 'sand']
      }
    },
    desert: {
      id: 'desert', name: 'Sa Mạc', emoji: '🏜️', subtitle: 'Biển cát vô tận',
      desc: 'Những đụn cát nóng bỏng và bão cát bất chợt. Cần đồ chống bão cát để sinh tồn.',
      unlock: { level: 13, badges: 4 }, staminaCost: 11, hazard: { id: 'sand', name: 'Bão Cát', stat: 'sand', icon: '🌪️' },
      types: ['ground', 'rock', 'fire', 'flying', 'dragon'], weatherPool: ['sunny', 'sandstorm', 'clear'],
      particles: 'sand', bg: 'desert', accent: '#fbbf24',
      drops: ['sand', 'stone'], featured: ['gible', 'aerodactyl', 'rhyhorn', 'trapinch'],
      trainer: {
        name: 'Lữ Khách Sa Mạc', title: 'Người không bao giờ lạc', quote: 'Sa mạc không dễ chết người, thiếu nước mới chết.',
        team: [['sandshrew', 18], ['rhyhorn', 19], ['gible', 19]], difficulty: 'medium',
        reward: { coins: 1000, xp: 320, items: { ultraball: 2, sand: 8 } }
      },
      gym: {
        leader: 'Sa Vũ', title: 'Trưởng Gym Bão Cát', quote: 'Cát che mắt ngươi, còn ta thì thấy rõ mọi thứ!',
        team: [['sandslash', 30], ['rhydon', 31], ['gabite', 32], ['aerodactyl', 33]], difficulty: 'hard',
        badge: 'Huy hiệu Cát', badgeIcon: '🏜️', reward: { coins: 8000, xp: 1900, items: { ultraball: 6, 'tm-stone_edge': 1, sand: 15 } }
      },
      raid: {
        boss: 'garchomp', level: 40, name: 'Garchomp Sa Mạc', hpMult: 7,
        reward: { coins: 8000, items: { ultraball: 6, sand: 15 }, stardust: 2500 }
      },
      fishing: null
    },
    snow: {
      id: 'snow', name: 'Núi Tuyết', emoji: '🏔️', subtitle: 'Đỉnh băng vĩnh cửu',
      desc: 'Bão tuyết gào thét trên những đỉnh núi. Cần đồ chống lạnh để không mất thể lực.',
      unlock: { level: 16, badges: 5 }, staminaCost: 11, hazard: { id: 'cold', name: 'Lạnh', stat: 'cold', icon: '❄️' },
      types: ['ice', 'rock', 'steel', 'dragon'], weatherPool: ['snow', 'fog', 'clear'],
      particles: 'snow', bg: 'snow', accent: '#7dd3fc',
      drops: ['ice', 'crystal'], featured: ['swinub', 'snorunt', 'spheal', 'weavile'],
      trainer: {
        name: 'Nhà Leo Núi', title: 'Người chinh phục đỉnh băng', quote: 'Đỉnh núi không tha cho kẻ yếu tim.',
        team: [['swinub', 21], ['snorunt', 22], ['spheal', 22]], difficulty: 'medium',
        reward: { coins: 1200, xp: 400, items: { ultraball: 3, ice: 8 } }
      },
      gym: {
        leader: 'Tuyết Nga', title: 'Trưởng Gym Băng Phong', quote: 'Hãy để băng giá thanh tẩy sự yếu mềm của ngươi!',
        team: [['piloswine', 34], ['glalie', 35], ['walrein', 35], ['weavile', 37]], difficulty: 'hard',
        badge: 'Huy hiệu Băng', badgeIcon: '❄️', reward: { coins: 10000, xp: 2400, items: { ultraball: 8, 'ice-stone': 1, 'tm-ice_beam': 1 } }
      },
      raid: {
        boss: 'regice', level: 45, name: 'Regice Băng Giá', hpMult: 8,
        reward: { coins: 10000, items: { ultraball: 8, ice: 15 }, stardust: 3000 }
      },
      fishing: {
        id: 'ice-stream', name: 'Suối Băng', emoji: '🧊', minRod: 2, rarityBonus: 1.35,
        pool: ['magikarp', 'goldeen', 'spheal', 'sealeo', 'walrein', 'lapras', 'staryu', 'feebas', 'milotic', 'dratini', 'dragonair'],
        treasure: ['ice', 'crystal', 'ice-stone'], junk: ['ice', 'shell']
      }
    },
    city: {
      id: 'city', name: 'Thành Phố', emoji: '🏙️', subtitle: 'Thành phố không ngủ',
      desc: 'Ánh đèn neon và những con phố náo nhiệt. Pokémon hệ Điện, Siêu linh và Bóng tối ẩn mình.',
      unlock: { level: 18, badges: 6 }, staminaCost: 6, hazard: null,
      types: ['normal', 'electric', 'psychic', 'dark', 'poison', 'fairy'], weatherPool: ['sunny', 'rain', 'fog', 'clear'],
      particles: 'lights', bg: 'city', accent: '#c084fc',
      drops: ['feather', 'crystal'], featured: ['eevee', 'porygon', 'rotom', 'zorua', 'mimikyu'],
      trainer: {
        name: 'Công Tử Bạc', title: 'Tay chơi thành thị', quote: 'Pokémon xịn phải đi với người sành điệu!',
        team: [['meowth', 24], ['magnemite', 25], ['electrike', 25]], difficulty: 'medium',
        reward: { coins: 1500, xp: 500, items: { ultraball: 4, feather: 8 } }
      },
      gym: {
        leader: 'Điện Quang', title: 'Trưởng Gym Đô Thị', quote: 'Tốc độ là tất cả. Ngươi có theo kịp ánh sáng?',
        team: [['persian', 38], ['manectric', 39], ['magnezone', 40], ['rotom', 41]], difficulty: 'hard',
        badge: 'Huy hiệu Đô Thị', badgeIcon: '⚡', reward: { coins: 13000, xp: 3000, items: { ultraball: 10, 'thunder-stone': 1, 'tm-thunderbolt': 1 } }
      },
      raid: {
        boss: 'magnezone', level: 42, name: 'Magnezone Từ Trường', hpMult: 7,
        reward: { coins: 12000, items: { ultraball: 8, crystal: 12 }, stardust: 3200 }
      },
      fishing: null
    },
    temple: {
      id: 'temple', name: 'Đền Cổ', emoji: '🏛️', subtitle: 'Di tích của Thiên Giới',
      desc: 'Ngôi đền cổ kính giữa tầng mây, nơi những huyền thoại ngủ yên. Cần Chìa Khóa Đền Cổ để triệu hồi.',
      unlock: { level: 25, badges: 7 }, staminaCost: 14, hazard: { id: 'curse', name: 'Lời Nguyền', stat: 'curse', icon: '🌫️' },
      types: ['celestial', 'dragon', 'ghost', 'psychic', 'fairy'], weatherPool: ['fog', 'clear', 'snow'],
      particles: 'stars', bg: 'temple', accent: '#ffd86b',
      drops: ['relic', 'crystal'], featured: ['mimikyu', 'gardevoir', 'metagross', 'garchomp'],
      trainer: {
        name: 'Người Giữ Đền', title: 'Người canh giữ Thiên Giới', quote: 'Kẻ phàm trần không được bước vào thánh địa.',
        team: [['gardevoir', 45], ['metagross', 46], ['garchomp', 47]], difficulty: 'hard',
        reward: { coins: 5000, xp: 1200, items: { 'temple-key': 1, relic: 5 } }
      },
      gym: {
        leader: 'Thiên Sứ', title: 'Trưởng Gym Thiên Giới', quote: 'Thiên Giới không chấp nhận kẻ tầm thường!',
        team: [['latias', 50], ['latios', 50], ['rayquaza', 52]], difficulty: 'hard',
        badge: 'Huy hiệu Thiên', badgeIcon: '🌟', reward: { coins: 25000, xp: 6000, items: { 'celestialball': 3, relic: 20, diamonds: 5 } }
      },
      raid: {
        boss: 'arceus', level: 60, name: 'Arceus Phán Xét', hpMult: 10,
        reward: { coins: 30000, items: { 'celestialball': 5, relic: 25 }, stardust: 8000 }
      },
      fishing: {
        id: 'sacred-pond', name: 'Ao Thiêng', emoji: '✨', minRod: 3, rarityBonus: 1.8,
        pool: ['magikarp', 'goldeen', 'staryu', 'starmie', 'feebas', 'milotic', 'dratini', 'dragonair', 'lapras', 'gyarados'],
        treasure: ['relic', 'crystal', 'fairy-stone'], junk: ['relic']
      }
    },

    /* ---------------- VÙNG CROSSOVER MỚI ---------------- */
    'pal-tundra': {
      id: 'pal-tundra', name: 'Pal Tundra', emoji: '❄️', subtitle: 'Băng nguyên Palworld',
      desc: 'Vùng băng giá nơi các Pal hệ Băng và Rồng tụ họp. Gió lạnh thổi qua những tảng băng khổng lồ.',
      unlock: { level: 28, badges: 8 }, staminaCost: 12, hazard: { id: 'cold', name: 'Lạnh Cắt Da', stat: 'cold', icon: '❄️' },
      types: ['ice', 'dragon', 'normal'], weatherPool: ['snow', 'clear', 'fog'],
      particles: 'snow', bg: 'snow', accent: '#9dd6ff',
      drops: ['crystal', 'feather'], featured: ['cross-chillet', 'cross-pengullet', 'cross-fenglope', 'cross-hangyu', 'cross-wumpo'],
      trainer: {
        name: 'Thợ Săn Pal Bắc', title: 'Người đi săn vùng cực', quote: 'Băng giá không làm chậm ta!',
        team: [['cross-pengullet', 30], ['cross-chillet', 31], ['cross-fenglope', 32]], difficulty: 'hard',
        reward: { coins: 6000, xp: 1400, items: { ultraball: 8, potion: 5 } }
      },
      gym: {
        leader: 'Băng Tinh', title: 'Trưởng Gym Pal Tundra', quote: 'Hơi lạnh này đủ đóng băng cả ý chí!',
        team: [['cross-direhowl', 34], ['cross-wumpo', 34], ['cross-fenglope', 36]], difficulty: 'hard',
        badge: 'Huy hiệu Băng Pal', badgeIcon: '❄️', reward: { coins: 12000, xp: 2800, items: { ultraball: 10, crystal: 12 } }
      },
      raid: {
        boss: 'cross-jetragon', level: 42, name: 'Jetragon Băng Nguyên', hpMult: 8,
        reward: { coins: 16000, items: { ultraball: 12, relic: 10 }, stardust: 3200 }
      },
      fishing: {
        id: 'pal-ice-stream', name: 'Suối Băng Pal', emoji: '🧊', minRod: 1, rarityBonus: 1.4,
        pool: ['magikarp', 'goldeen', 'cross-pengullet', 'cross-fuack', 'cross-azurobe', 'cross-penking'],
        treasure: ['crystal', 'relic'], junk: ['shell']
      }
    },
    'pal-lava': {
      id: 'pal-lava', name: 'Pal Lava Rift', emoji: '🌋', subtitle: 'Hẻm núi lửa Palworld',
      desc: 'Hẻm núi bốc khói với dòng chảy dung nham. Những Pal hệ Lửa và Bóng tối cư ngụ nơi đây.',
      unlock: { level: 31, badges: 8 }, staminaCost: 13, hazard: { id: 'heat', name: 'Nóng Bỏng', stat: 'heat', icon: '🔥' },
      types: ['fire', 'dark', 'ground'], weatherPool: ['sunny', 'clear', 'sandstorm'],
      particles: 'embers', bg: 'volcano', accent: '#ff8a5c',
      drops: ['ember', 'stone'], featured: ['cross-foxparks', 'cross-pyrin', 'cross-ragnahawk', 'cross-guilmon', 'cross-faleris'],
      trainer: {
        name: 'Thợ Rèn Lửa', title: 'Người rèn vũ khí trong núi', quote: 'Lửa rèn nên thép, thép rèn nên chiến_bin!',
        team: [['cross-foxparks', 33], ['cross-pyrin', 34], ['cross-ragnahawk', 35]], difficulty: 'hard',
        reward: { coins: 6500, xp: 1500, items: { ultraball: 8, 'fire-stone': 1 } }
      },
      gym: {
        leader: 'Hỏa Diệm', title: 'Trưởng Gym Pal Lava', quote: 'Dung nham sẽ thiêu rụi mọi phòng thủ!',
        team: [['cross-faleris', 37], ['cross-ragnahawk', 37], ['cross-beelzebumon', 38]], difficulty: 'hard',
        badge: 'Huy hiệu Lửa Pal', badgeIcon: '🔥', reward: { coins: 13000, xp: 3000, items: { ultraball: 10, ember: 15 } }
      },
      raid: {
        boss: 'cross-beelzebumon', level: 44, name: 'Beelzebumon Dung Nham', hpMult: 8,
        reward: { coins: 17000, items: { ultraball: 12, relic: 10 }, stardust: 3400 }
      },
      fishing: null
    },
    'digi-city': {
      id: 'digi-city', name: 'Digi City', emoji: '🏙️', subtitle: 'Thành phố dữ liệu',
      desc: 'Thành phố tương lai nơi dữ liệu và điện năng hòa quyện. Digimon hệ Điện và Thép xuất hiện khắp nẻo đường.',
      unlock: { level: 34, badges: 9 }, staminaCost: 7, hazard: null,
      types: ['electric', 'steel', 'dark'], weatherPool: ['clear', 'rain', 'fog'],
      particles: 'lights', bg: 'city', accent: '#7dd3fc',
      drops: ['crystal', 'stone'], featured: ['cross-sparkit', 'cross-univolt', 'cross-katress', 'cross-guilmon', 'cross-shoutmon'],
      trainer: {
        name: 'Hacker Mặc Áo Khoác', title: 'Kẻ điều khiển mạng', quote: 'Mọi thứ đều có thể bị hack... kể cả cậu!',
        team: [['cross-sparkit', 36], ['cross-univolt', 37], ['cross-katress', 38]], difficulty: 'hard',
        reward: { coins: 7000, xp: 1700, items: { ultraball: 8, potion: 5 } }
      },
      gym: {
        leader: 'Điện Tử', title: 'Trưởng Gym Digi City', quote: 'Tốc độ của ta là tốc độ của ánh sáng!',
        team: [['cross-grizzbolt', 39], ['cross-univolt', 39], ['cross-mossanda-lux', 40]], difficulty: 'hard',
        badge: 'Huy hiệu Dữ Liệu', badgeIcon: '⚡', reward: { coins: 14000, xp: 3200, items: { ultraball: 10, crystal: 15 } }
      },
      raid: {
        boss: 'cross-shadowbeak', level: 46, name: 'Shadowbeak Mạng', hpMult: 8,
        reward: { coins: 18000, items: { ultraball: 12, relic: 12 }, stardust: 3600 }
      },
      fishing: null
    },
    'pal-isles': {
      id: 'pal-isles', name: 'Pal Isles', emoji: '🏝️', subtitle: 'Quần đảo Palworld',
      desc: 'Chuỗi đảo xanh với thác nước và bãi cát trắng. Pal hệ Nước và Băng bơi lội quanh năm.',
      unlock: { level: 37, badges: 10 }, staminaCost: 8, hazard: null,
      types: ['water', 'ice', 'flying'], weatherPool: ['rain', 'sunny', 'clear'],
      particles: 'waves', bg: 'beach', accent: '#67e8f9',
      drops: ['shell', 'leather'], featured: ['cross-surfent', 'cross-fuack', 'cross-celaray', 'cross-relaxaurus-lux', 'cross-azurobe'],
      trainer: {
        name: 'Thuyền Trưởng Đảo', title: 'Người dẫn đoàn thám hiểm', quote: 'Lên thuyền đi, gió đã thuận!',
        team: [['cross-fuack', 39], ['cross-surfent', 40], ['cross-celaray', 41]], difficulty: 'hard',
        reward: { coins: 7500, xp: 1800, items: { ultraball: 8, potion: 5 } }
      },
      gym: {
        leader: 'Thủy Triều', title: 'Trưởng Gym Pal Isles', quote: 'Sóng nước dập tan mọi rào cản!',
        team: [['cross-penking', 42], ['cross-azurobe', 42], ['cross-relaxaurus-lux', 43]], difficulty: 'hard',
        badge: 'Huy hiệu Sóng Pal', badgeIcon: '🌊', reward: { coins: 15000, xp: 3400, items: { ultraball: 10, shell: 15 } }
      },
      raid: {
        boss: 'cross-relaxaurus-lux', level: 48, name: 'Relaxaurus Lux Bão Sóng', hpMult: 8,
        reward: { coins: 19000, items: { ultraball: 12, relic: 12 }, stardust: 3800 }
      },
      fishing: {
        id: 'pal-coral-reef', name: 'Rạn San Hô Pal', emoji: '🐚', minRod: 1, rarityBonus: 1.5,
        pool: ['magikarp', 'goldeen', 'cross-fuack', 'cross-surfent', 'cross-celaray', 'cross-azurobe', 'cross-penking'],
        treasure: ['shell', 'crystal', 'relic'], junk: ['shell']
      }
    },
    'digi-forest': {
      id: 'digi-forest', name: 'Digi Grove', emoji: '🌳', subtitle: 'Rừng dữ liệu cổ',
      desc: 'Khu rừng nơi mọi dữ liệu mọc lên như lá cây. Digimon và Pal hệ Cỏ, Bọ cùng chung sống.',
      unlock: { level: 40, badges: 11 }, staminaCost: 9, hazard: null,
      types: ['grass', 'bug', 'fairy'], weatherPool: ['rain', 'sunny', 'fog'],
      particles: 'leaves', bg: 'forest', accent: '#86efac',
      drops: ['seed', 'leather'], featured: ['cross-lifmunk', 'cross-gumoss', 'cross-tanzee', 'cross-renamon', 'cross-hawkmon'],
      trainer: {
        name: 'Người Làm Vườn Số', title: 'Người chăm sóc rừng dữ liệu', quote: 'Cứ nhìn kỹ, dữ liệu cũng biết thở!',
        team: [['cross-tanzee', 42], ['cross-lifmunk', 43], ['cross-renamon', 44]], difficulty: 'hard',
        reward: { coins: 8000, xp: 1900, items: { ultraball: 8, potion: 5 } }
      },
      gym: {
        leader: 'Lục Diệp', title: 'Trưởng Gym Digi Grove', quote: 'Rễ dữ liệu bám chặt hơn thép!',
        team: [['cross-gumoss', 44], ['cross-beegarde', 44], ['cross-lyleen', 45]], difficulty: 'hard',
        badge: 'Huy hiệu Rễ Digi', badgeIcon: '🍃', reward: { coins: 16000, xp: 3600, items: { ultraball: 10, seed: 15 } }
      },
      raid: {
        boss: 'cross-lyleen', level: 50, name: 'Lyleen Ngàn Lá', hpMult: 8,
        reward: { coins: 20000, items: { ultraball: 12, relic: 12 }, stardust: 4000 }
      },
      fishing: {
        id: 'digi-grove-pond', name: 'Ao Rừng Digi', emoji: '🪷', minRod: 1, rarityBonus: 1.3,
        pool: ['magikarp', 'goldeen', 'cross-fuack', 'cross-gobfin', 'cross-tanzee', 'cross-lifmunk'],
        treasure: ['seed', 'crystal'], junk: ['shell']
      }
    },
    'digi-temple': {
      id: 'digi-temple', name: 'Digi Sanctum', emoji: '🛕', subtitle: 'Thánh địa Digimon',
      desc: 'Ngôi đền dữ liệu nơi những Digimon huyền thoại ngủ yên. Chỉ những huấn luyện viên tận tâm mới được bước vào.',
      unlock: { level: 45, badges: 12 }, staminaCost: 15, hazard: null,
      types: ['steel', 'fairy', 'psychic', 'dragon'], weatherPool: ['fog', 'clear', 'snow'],
      particles: 'stars', bg: 'temple', accent: '#c4b5fd',
      drops: ['relic', 'crystal'], featured: ['cross-angemon', 'cross-lucemon', 'cross-alphamon', 'cross-magnamon', 'cross-omnimon'],
      trainer: {
        name: 'Tu Sĩ Dữ Liệu', title: 'Người canh thánh địa số', quote: 'Bước vào đây, cậu phải chứng minh lòng tin.',
        team: [['cross-angemon', 46], ['cross-tailmon', 47], ['cross-lucemon', 48]], difficulty: 'hard',
        reward: { coins: 10000, xp: 2400, items: { ultraball: 10, relic: 8 } }
      },
      gym: {
        leader: 'Thánh Vệ', title: 'Trưởng Gym Digi Sanctum', quote: 'Ánh sáng của dữ liệu sẽ phán xét cậu!',
        team: [['cross-alphamon', 49], ['cross-magnamon', 49], ['cross-omnimon', 50]], difficulty: 'hard',
        badge: 'Huy hiệu Thánh Digi', badgeIcon: '💠', reward: { coins: 20000, xp: 4500, items: { 'celestialball': 3, relic: 20 } }
      },
      raid: {
        boss: 'cross-omnimon', level: 55, name: 'Omnimon Thánh Địa', hpMult: 10,
        reward: { coins: 26000, items: { 'celestialball': 4, relic: 25 }, stardust: 5000 }
      },
      fishing: null
    },
    /* 6 vùng điện ảnh Kanto — mở khóa sau các vùng crossover, theo thứ tự phim. */
    pallet: {
      id: 'pallet', name: 'Pallet · Quê Nhà', emoji: '🏡', subtitle: 'Ngôi làng khởi đầu trong phim',
      desc: 'Ngôi làng nhỏ nơi hành trình của Ash bắt đầu. Cả ba Pokémon khởi đầu cùng hiện diện nơi đây.',
      unlock: { level: 46, badges: 13 }, staminaCost: 8, hazard: null,
      types: ['grass', 'fire', 'water', 'normal'], weatherPool: ['sunny', 'clear', 'rain'],
      particles: 'fireflies', bg: 'forest', accent: '#86efac',
      drops: ['seed', 'leather'], featured: ['bulbasaur', 'charmander', 'squirtle', 'pikachu', 'eevee'],
      trainer: {
        name: 'Cậu Bạn Thời Thơ Ấu', title: 'Đấu lại từ thuở ban đầu', quote: 'Cậu còn nhớ trận ở sân nhà chứ?',
        team: [['pikachu', 47], ['eevee', 48], ['bulbasaur', 48]], difficulty: 'medium',
        hpMult: 1.4, heldItems: ['oran-berry'],
        reward: { coins: 11000, xp: 2600, items: { ultraball: 10, potion: 8 } }
      },
      gym: {
        leader: 'Giáo Sư Oak', title: 'Trưởng Gym Pallet', quote: 'Hành trình không kết thúc ở trang đầu tiên!',
        team: [['ivysaur', 50], ['charmeleon', 50], ['wartortle', 51]], difficulty: 'hard',
        hpMult: 1.8, heldItems: ['sitrus-berry', 'miracle-seed'],
        badge: 'Huy hiệu Khởi Đầu', badgeIcon: '🌱', reward: { coins: 22000, xp: 5000, items: { celestialball: 2, 'leaf-stone': 2 } }
      },
      raid: {
        boss: 'venusaur', level: 52, name: 'Venusaur Quê Nhà', hpMult: 8,
        reward: { coins: 28000, items: { celestialball: 3, seed: 20 }, stardust: 5600 }
      },
      fishing: {
        id: 'pallet-shore', name: 'Bãi Biển Pallet', emoji: '🏖️', minRod: 0, rarityBonus: 1.6,
        pool: ['magikarp', 'goldeen', 'poliwag', 'slowpoke', 'squirtle', 'wartortle'],
        treasure: ['seed', 'shell'], junk: ['shell']
      }
    },
    viridian: {
      id: 'viridian', name: 'Viridian · Cổng Xanh', emoji: '🌳', subtitle: 'Khu rừng của phim đầu tiên',
      desc: 'Rừng cổ thụ dẫn tới thành phố Viridian, nơi diễn ra nhiều màn đối đầu kinh điển trên màn ảnh.',
      unlock: { level: 47, badges: 14 }, staminaCost: 9, hazard: null,
      types: ['bug', 'poison', 'ground', 'fighting'], weatherPool: ['rain', 'fog', 'clear'],
      particles: 'leaves', bg: 'forest', accent: '#4ade80',
      drops: ['leather', 'seed'], featured: ['caterpie', 'metapod', 'weedle', 'kakuna', 'venonat'],
      trainer: {
        name: 'Người Giữ Rừng Viridian', title: 'Thách đấu giữa tán cây', quote: 'Muốn đi đường tắt? Phải thắng ta trước!',
        team: [['venonat', 48], ['kakuna', 49], ['metapod', 49]], difficulty: 'medium',
        hpMult: 1.4, heldItems: ['oran-berry'],
        reward: { coins: 12000, xp: 2800, items: { ultraball: 10, razz: 6 } }
      },
      gym: {
        leader: 'Giovanni', title: 'Trưởng Gym Viridian', quote: 'Sức mạnh được rèn qua những trận không khoan nhượng.',
        team: [['beedrill', 52], ['venomoth', 53], ['machamp', 54]], difficulty: 'hard',
        hpMult: 1.8, heldItems: ['sitrus-berry', 'black-belt'],
        badge: 'Huy hiệu Trái Đất', badgeIcon: '🌍', reward: { coins: 24000, xp: 5400, items: { celestialball: 2, stone: 15 } }
      },
      raid: {
        boss: 'beedrill', level: 55, name: 'Beedrill Bầy Đàn', hpMult: 9,
        reward: { coins: 30000, items: { celestialball: 3, stone: 15 }, stardust: 6000 }
      },
      fishing: null
    },
    cerulean: {
      id: 'cerulean', name: 'Cerulean · Hồ Xanh', emoji: '💧', subtitle: 'Hồ nước và tháp tâm linh',
      desc: 'Thành phố ven hồ nơi Mewtwo được tạo ra trong điện ảnh. Mặt nước phản chiếu cả bầu trời lẫn ký ức.',
      unlock: { level: 48, badges: 15 }, staminaCost: 9, hazard: null,
      types: ['water', 'psychic', 'ice'], weatherPool: ['rain', 'clear', 'snow'],
      particles: 'waves', bg: 'lake', accent: '#38bdf8',
      drops: ['shell', 'crystal'], featured: ['wartortle', 'staryu', 'starmie', 'lapras', 'psyduck'],
      trainer: {
        name: 'HLV Tháp Nước', title: 'Người canh hồ Cerulean', quote: 'Hồ này sâu hơn cái nhìn của cậu đấy!',
        team: [['psyduck', 49], ['staryu', 50], ['golduck', 51]], difficulty: 'medium',
        hpMult: 1.5, heldItems: ['oran-berry'],
        reward: { coins: 13000, xp: 3000, items: { netball: 10, shell: 10 } }
      },
      gym: {
        leader: 'Misty', title: 'Trưởng Gym Cerulean', quote: 'Đừng đánh giá một loài nước chỉ bằng vẻ ngoài!',
        team: [['golduck', 53], ['starmie', 54], ['lapras', 55]], difficulty: 'hard',
        hpMult: 2.0, heldItems: ['sitrus-berry', 'mystic-water'],
        badge: 'Huy hiệu Nước', badgeIcon: '💧', reward: { coins: 26000, xp: 5800, items: { celestialball: 2, netball: 10 } }
      },
      raid: {
        boss: 'lapras', level: 56, name: 'Lapras Hồ Xanh', hpMult: 9,
        reward: { coins: 32000, items: { celestialball: 3, 'prism-scale': 2 }, stardust: 6400 }
      },
      fishing: {
        id: 'cerulean-lake', name: 'Hồ Cerulean', emoji: '🎣', minRod: 1, rarityBonus: 1.5,
        pool: ['magikarp', 'goldeen', 'psyduck', 'staryu', 'wartortle', 'lapras'],
        treasure: ['shell', 'crystal'], junk: ['shell']
      }
    },
    vermilion: {
      id: 'vermilion', name: 'Vermilion · Bến Sét', emoji: '⚡', subtitle: 'Cảng biển điện giật',
      desc: 'Bến cảng sôi động với những cột tháp điện và tàu ra khơi. Gyarados thường lẩn ở lối vào.',
      unlock: { level: 49, badges: 16 }, staminaCost: 10, hazard: null,
      types: ['electric', 'water', 'fire'], weatherPool: ['clear', 'rain', 'fog'],
      particles: 'lights', bg: 'city', accent: '#fbbf24',
      drops: ['shell', 'ember'], featured: ['magikarp', 'gyarados', 'voltorb', 'electabuzz'],
      trainer: {
        name: 'Thủy Thủ Cảng', title: 'Người đi biển thách đấu', quote: 'Biển động thì mới có cá lớn!',
        team: [['voltorb', 50], ['magikarp', 50], ['electabuzz', 52]], difficulty: 'medium',
        hpMult: 1.5, heldItems: ['oran-berry'],
        reward: { coins: 14000, xp: 3200, items: { ultraball: 12, potion: 8 } }
      },
      gym: {
        leader: 'Lt. Surge', title: 'Trưởng Gym Vermilion', quote: 'Sét đánh còn nhanh hơn cả chớp mắt!',
        team: [['electrode', 54], ['electabuzz', 55], ['gyarados', 56]], difficulty: 'hard',
        hpMult: 2.0, heldItems: ['sitrus-berry', 'magnet'],
        badge: 'Huy hiệu Sét', badgeIcon: '⚡', reward: { coins: 28000, xp: 6200, items: { celestialball: 2, ultraball: 15 } }
      },
      raid: {
        boss: 'gyarados', level: 57, name: 'Gyarados Cảng Sét', hpMult: 9,
        reward: { coins: 34000, items: { celestialball: 3, shell: 20 }, stardust: 6800 }
      },
      fishing: {
        id: 'vermilion-port', name: 'Cảng Vermilion', emoji: '⚓', minRod: 1, rarityBonus: 1.4,
        pool: ['magikarp', 'gyarados', 'goldeen', 'voltorb', 'electabuzz', 'lapras'],
        treasure: ['shell', 'relic'], junk: ['shell']
      }
    },
    celadon: {
      id: 'celadon', name: 'Celadon · Phố Rực Rỡ', emoji: '🌆', subtitle: 'Gym lớn nhất và rạp chiếu phim',
      desc: 'Thành phố sáng đèn quanh năm, nơi những trận chiến trên màn ảnh được cả thành phố theo dõi.',
      unlock: { level: 50, badges: 17 }, staminaCost: 10, hazard: null,
      types: ['psychic', 'grass', 'fighting', 'normal', 'fairy', 'fire', 'electric'], weatherPool: ['clear', 'sunny', 'fog'],
      particles: 'lights', bg: 'city', accent: '#c084fc',
      drops: ['feather', 'leather'], featured: ['venusaur', 'mr-mime', 'abra', 'machamp', 'exeggcute'],
      trainer: {
        name: 'Khán Giả Rạp Chiếu', title: 'Người xem trận đấu cuối', quote: 'Màn hình lớn làm trận đấu căng hơn!',
        team: [['abra', 51], ['exeggcute', 51], ['mr-mime', 52], ['gengar', 52]], difficulty: 'medium',
        hpMult: 1.6, heldItems: ['sitrus-berry', 'twisted-spoon', 'scope-lens'],
        reward: { coins: 15000, xp: 3400, items: { ultraball: 12, goldenrazz: 2 } }
      },
      gym: {
        leader: 'Sabrina', title: 'Trưởng Gym Celadon', quote: 'Cậu nhìn thấy gì? Ta đã thấy trước rồi.',
        team: [['venusaur', 55], ['mr-mime', 56], ['alakazam', 57], ['gengar', 56]], difficulty: 'hard',
        hpMult: 2.2, mirrorPlayerHp: true,
        heldItems: ['leftovers', 'twisted-spoon', 'miracle-seed', 'focus-sash'],
        badge: 'Huy hiệu Tâm Linh', badgeIcon: '🔮', reward: { coins: 30000, xp: 6600, items: { celestialball: 3, masterball: 1 } }
      },
      raid: {
        boss: 'alakazam', level: 58, name: 'Alakazam Rạp Chiếu', hpMult: 9,
        reward: { coins: 36000, items: { celestialball: 4, masterball: 1 }, stardust: 7200 }
      },
      fishing: null
    },
    indigo: {
      id: 'indigo', name: 'Indigo · Đỉnh Liên Minh', emoji: '🏆', subtitle: 'Trận chiến cuối của điện ảnh',
      desc: 'Cao nguyên Indigo, nơi mọi hành trình trong phim hội tụ. Những huyền thoại chờ thử thách cuối cùng.',
      unlock: { level: 52, badges: 18 }, staminaCost: 12, hazard: null,
      types: ['glitch', 'dragon', 'psychic'], weatherPool: ['fog', 'clear', 'snow'],
      particles: 'stars', bg: 'temple', accent: '#fde68a',
      drops: ['relic', 'crystal'], featured: ['charizard', 'blastoise', 'dragonite', 'mew', 'mewtwo'],
      trainer: {
        name: 'Nhà Vô Địch Trở Lại', title: 'Thử lửa trước đỉnh cao', quote: 'Cậu đi xa rồi... nhưng chưa tới đây.',
        team: [['charizard', 56], ['blastoise', 56], ['dragonite', 57]], difficulty: 'hard',
        hpMult: 1.8, heldItems: ['sitrus-berry', 'charcoal', 'mystic-water', 'dragon-fang-charm'],
        reward: { coins: 18000, xp: 4000, items: { celestialball: 2, hyperpotion: 5 } }
      },
      gym: {
        leader: 'Champion Xanh', title: 'Trưởng Gym Indigo', quote: 'Trận cuối cùng không dành cho kẻ yếu!',
        team: [['dragonite', 60], ['mew', 60], ['mewtwo', 62], ['charizard', 61]], difficulty: 'hard',
        hpMult: 2.6, mirrorPlayerHp: true,
        heldItems: ['leftovers', 'dragon-fang-charm', 'twisted-spoon', 'focus-sash'],
        badge: 'Huy hiệu Liên Minh', badgeIcon: '🏆', reward: { coins: 36000, xp: 8000, items: { celestialball: 4, masterball: 1 } }
      },
      raid: {
        boss: 'mewtwo', level: 65, name: 'Mewtwo Đỉnh Indigo', hpMult: 12,
        reward: { coins: 42000, items: { celestialball: 5, 'prism-scale': 3 }, stardust: 9000 }
      },
      fishing: null
    }
  };

  /* Pokémon GO: mọi Raid Boss đều thưởng Bóng Raid để bắt chính con Boss.
     Boss của từng vùng giữ nguyên loài đại diện đã định nghĩa ở trên. */
  for (const regionId of Object.keys(REGIONS)) {
    const raid = REGIONS[regionId].raid;
    if (!raid || !raid.reward) continue;
    if (!raid.reward.items) raid.reward.items = {};
    raid.reward.items['raid-ball'] = 3 + Math.min(3, Math.floor((raid.hpMult || 5) / 3));
  }

  const REGION_ORDER = ['forest', 'cave', 'beach', 'lake', 'volcano', 'desert', 'snow', 'city', 'temple',
    'pal-tundra', 'pal-lava', 'digi-city', 'pal-isles', 'digi-forest', 'digi-temple',
    'pallet', 'viridian', 'cerulean', 'vermilion', 'celadon', 'indigo'];

  /* Giá nguyên liệu theo vùng: buy = giá người chơi mua, sell = giá thương nhân thu mua.
     Luôn sell < buy trong cùng vùng; chênh lệch giữa các vùng tạo cơ hội buôn bán. */
  const DEFAULT_REGION_MARKET = { materialBuy: { _: 1.25 }, materialSell: { _: 0.55 } };
  const REGION_MARKETS = {
    forest:      { materialBuy: { seed: 0.6, leather: 0.65, feather: 0.65 }, materialSell: { seed: 0.3, leather: 0.35, feather: 0.35 } },
    cave:        { materialBuy: { stone: 0.6, crystal: 0.7 }, materialSell: { stone: 0.35, crystal: 0.4 } },
    beach:       { materialBuy: { shell: 0.6, feather: 0.65, ice: 1.45 }, materialSell: { shell: 0.35, feather: 0.35, ice: 1.2 } },
    lake:        { materialBuy: { seed: 1.45, shell: 1.45, leather: 1.4 }, materialSell: { seed: 1.25, shell: 1.25, leather: 1.15 } },
    volcano:     { materialBuy: { stone: 0.6, ember: 0.6 }, materialSell: { stone: 0.35, ember: 0.35 } },
    desert:      { materialBuy: { sand: 0.55, leather: 0.65, stone: 1.45 }, materialSell: { sand: 0.3, leather: 0.35, stone: 1.2 } },
    snow:        { materialBuy: { ice: 0.6, crystal: 0.7 }, materialSell: { ice: 0.35, crystal: 0.4 } },
    city:        { materialBuy: { feather: 1.5, leather: 1.45, stone: 1.45, sand: 1.45, ember: 1.45 }, materialSell: { feather: 1.3, leather: 1.25, stone: 1.2, sand: 1.2, ember: 1.2 } },
    temple:      { materialBuy: { relic: 0.7, crystal: 0.7, sand: 1.5 }, materialSell: { relic: 0.4, crystal: 0.4, sand: 1.25 } },
    'pal-tundra':{ materialBuy: { ice: 0.6, crystal: 0.75 }, materialSell: { ice: 0.35, crystal: 0.4 } },
    'pal-lava':  { materialBuy: { ember: 0.6, stone: 0.7 }, materialSell: { ember: 0.35, stone: 0.4 } },
    'digi-city': { materialBuy: { feather: 1.5, relic: 1.55, crystal: 1.55, stone: 1.45 }, materialSell: { feather: 1.3, relic: 1.35, crystal: 1.35, stone: 1.2 } },
    'pal-isles': { materialBuy: { shell: 1.45, seed: 1.45, ice: 1.45 }, materialSell: { shell: 1.25, seed: 1.25, ice: 1.2 } },
    'digi-forest':{ materialBuy: { seed: 0.6, leather: 0.7 }, materialSell: { seed: 0.3, leather: 0.35 } },
    'digi-temple':{ materialBuy: { relic: 0.65, crystal: 0.7 }, materialSell: { relic: 0.4, crystal: 0.4 } },
    pallet:      { materialBuy: { seed: 0.6, shell: 0.65, leather: 0.65 }, materialSell: { seed: 0.3, shell: 0.35, leather: 0.35 } },
    viridian:    { materialBuy: { seed: 0.6, leather: 0.65, stone: 0.6 }, materialSell: { seed: 0.3, leather: 0.35, stone: 0.35 } },
    cerulean:    { materialBuy: { shell: 0.6, crystal: 0.7, ice: 0.6 }, materialSell: { shell: 0.35, crystal: 0.4, ice: 0.35 } },
    vermilion:   { materialBuy: { shell: 0.6, ember: 0.65, crystal: 1.5 }, materialSell: { shell: 0.35, ember: 0.35, crystal: 1.25 } },
    celadon:     { materialBuy: { feather: 1.5, leather: 1.45, relic: 1.5 }, materialSell: { feather: 1.3, leather: 1.25, relic: 1.25 } },
    indigo:      { materialBuy: { relic: 0.65, crystal: 0.7, ember: 1.45 }, materialSell: { relic: 0.4, crystal: 0.4, ember: 1.2 } }
  };

  function getRegionMarket(regionId) {
    const m = REGION_MARKETS[regionId] || DEFAULT_REGION_MARKET;
    return {
      materialBuy: Object.assign({}, DEFAULT_REGION_MARKET.materialBuy, m.materialBuy),
      materialSell: Object.assign({}, DEFAULT_REGION_MARKET.materialSell, m.materialSell)
    };
  }

  /** Hệ được phép hiển thị/tìm kiếm khi đang lọc theo một vùng.
      Trả về null nếu chưa chọn vùng hoặc vùng không có cấu hình hệ. */
  function typesForRegion(regionId) {
    const r = regionId && REGIONS[regionId];
    return r && Array.isArray(r.types) && r.types.length ? r.types.slice() : null;
  }
  const TRUE_LEGENDARIES = [
    'mew', 'jirachi', 'arceus', 'victini', 'ho-oh', 'lugia', 'raikou', 'entei', 'suicune',
    'celebi', 'regirock', 'regice', 'registeel', 'latias', 'latios', 'rayquaza',
    'articuno', 'zapdos', 'moltres', 'mewtwo',
    'aether-dragon', 'void-mew', 'solaris', 'lunarae', 'zeusbolt', 'leviathyss',
    'gaia-titan', 'flux-phantom', 'crystal-phoenix', 'cosmic-golem', 'dream-weaver',
    'chronos', 'rainbow-mew', 'omega-pika', 'kingzillar'
  ];

  const HAZARD_STATS = {
    heat: 'heat', cold: 'cold', sand: 'sand', curse: 'curse'
  };

  /* Thưởng một lần khi thắng đủ 3 thử thách (Trainer / Gym / Raid) của một vùng.
     Chỉnh số ở đây là xong — không cần sửa logic. */
  function clearReward(coins, stardust, diamonds, items, materials) {
    return { coins, stardust, diamonds, items: items || {}, materials: materials || {} };
  }
  const REGION_CLEAR_REWARDS = {
    forest:      clearReward(3000, 800, 2, { greatball: 5 }, {}),
    cave:        clearReward(4000, 1000, 2, { ultraball: 3, stone: 10 }, {}),
    beach:       clearReward(5000, 1200, 2, { netball: 5, shell: 10 }, {}),
    lake:        clearReward(6000, 1500, 3, { ultraball: 5, 'prism-scale': 1 }, {}),
    volcano:     clearReward(7500, 1800, 3, { ultraball: 5, hyperpotion: 3 }, { ember: 10 }),
    desert:      clearReward(9000, 2200, 3, { greatball: 10, hyperpotion: 3 }, { sand: 10 }),
    snow:        clearReward(11000, 2600, 4, { hyperpotion: 3 }, { ice: 10 }),
    city:        clearReward(13000, 3000, 4, { masterball: 1, potion: 5 }, {}),
    temple:      clearReward(16000, 4000, 5, { celestialball: 2 }, { relic: 5 }),
    'pal-tundra':clearReward(19000, 4500, 5, { celestialball: 2, hyperpotion: 5 }, { ice: 15 }),
    'pal-lava':  clearReward(22000, 5000, 6, { celestialball: 2, maxpotion: 3 }, { ember: 15 }),
    'digi-city': clearReward(25000, 6000, 6, { masterball: 1, ultraball: 10 }, {}),
    'pal-isles': clearReward(28000, 7000, 7, { celestialball: 3 }, { shell: 20 }),
    'digi-forest':clearReward(32000, 8000, 7, { masterball: 1, greatball: 20 }, {}),
    'digi-temple':clearReward(40000, 10000, 10, { celestialball: 5 }, { relic: 10 }),
    pallet:      clearReward(44000, 11000, 11, { celestialball: 5, ultraball: 20 }, { seed: 20 }),
    viridian:    clearReward(48000, 12000, 12, { celestialball: 5, masterball: 1 }, { stone: 20 }),
    cerulean:    clearReward(52000, 13000, 12, { celestialball: 6, netball: 20 }, { shell: 20 }),
    vermilion:   clearReward(56000, 14000, 13, { celestialball: 6, masterball: 1 }, { ember: 20 }),
    celadon:     clearReward(60000, 15000, 14, { celestialball: 7, masterball: 1 }, { crystal: 20 }),
    indigo:      clearReward(70000, 18000, 16, { celestialball: 10, masterball: 2 }, { relic: 25 })
  };

  /* Huấn luyện viên lang thang: thỉnh thoảng xuất hiện khi đi dạo.
     Quà rớt gồm bóng, túi trị thương, trang bị và vàng (xu). */
  const ROAMING_TRAINERS = [
    {
      id: 'scout', name: 'Huấn Luyện Viên Lang Thang', title: 'Thách đấu bất ngờ', avatar: '🧑‍🎤',
      quote: 'Đi ngang qua đây... cậu dám đấu một trận không?',
      difficulty: 'medium', teamSize: 3, hpMult: 1.3, heldItems: ['oran-berry'],
      items: { pokeball: 5, potion: 3 }, diamonds: 0,
      equipment: ['explorer-hat', 'lucky-shirt', 'wind-shoes']
    },
    {
      id: 'collector', name: 'Nhà Sưu Tầm Du Lịch', title: 'Tìm kiếm bạn đấu', avatar: '🧑‍🎨',
      quote: 'Tôi đi khắp nơi để tìm những huấn luyện viên giỏi!',
      difficulty: 'medium', teamSize: 3, hpMult: 1.4, heldItems: ['sitrus-berry'],
      items: { greatball: 4, superpotion: 2, razz: 3 }, diamonds: 1,
      equipment: ['lucky-cap', 'camera-glasses', 'lucky-gloves']
    },
    {
      id: 'veteran', name: 'Chiến Binh Kỳ Cựu', title: 'Thử lửa đội hình', avatar: '🥷',
      quote: 'Đội của cậu có đủ gan đối mặt với tôi không?',
      difficulty: 'hard', teamSize: 6, hpMult: 1.6,
      heldItems: ['leftovers', 'scope-lens', 'quick-claw', 'focus-sash'],
      items: { ultraball: 3, hyperpotion: 2, goldenrazz: 1 }, diamonds: 2,
      equipment: ['storm-cap', 'blaze-armor', 'city-sneakers']
    },
    {
      id: 'counterpart', name: 'HLV Đối Trọng', title: 'So găng bằng chính sức của bạn', avatar: '🪞',
      quote: 'Ta dùng một phần chỉ số của cậu — xem cậu có vượt được chính mình không!',
      difficulty: 'hard', teamSize: 6, hpMult: 1.8, mirrorPlayerHp: true,
      heldItems: ['sitrus-berry', 'leftovers', 'assault-vest', 'scope-lens', 'quick-claw', 'focus-sash'],
      items: { ultraball: 6, hyperpotion: 4 }, diamonds: 3,
      equipment: ['storm-cap', 'blaze-armor', 'city-sneakers']
    },
    {
      id: 'prodigy', name: 'Thần Tồng Trẻ', title: 'Thử thách 3 versus 3', avatar: '🧒',
      quote: 'Ba con thôi cũng đủ để thắng cậu!',
      difficulty: 'hard', teamSize: 3, hpMult: 1.7, mirrorPlayerHp: true,
      heldItems: ['choice-band', 'life-orb', 'focus-sash'],
      items: { greatball: 6, superpotion: 3, goldenrazz: 1 }, diamonds: 2,
      equipment: ['explorer-hat', 'lucky-shirt', 'wind-shoes']
    }
  ];

  function getRegion(id) { return REGIONS[id] || REGIONS.forest; }

  function isRegionUnlocked(state, regionId) {
    const r = REGIONS[regionId];
    if (!r) return false;
    if (state.unlockedRegions && state.unlockedRegions.includes(regionId)) return true;
    return state.player.level >= r.unlock.level && state.badges.length >= r.unlock.badges;
  }

  function weatherFor(state, regionId) {
    return state.weather && state.weather[regionId] ? state.weather[regionId] : 'clear';
  }

  PG.WEATHERS = WEATHERS;
  PG.REGIONS = REGIONS;
  PG.REGION_ORDER = REGION_ORDER;
  PG.REGION_MARKETS = REGION_MARKETS;
  PG.REGION_CLEAR_REWARDS = REGION_CLEAR_REWARDS;
  PG.REGION_CHALLENGE_KINDS = ['trainer', 'gym', 'raid'];
  PG.ROAMING_TRAINERS = ROAMING_TRAINERS;
  PG.getRegionMarket = getRegionMarket;
  PG.typesForRegion = typesForRegion;
  PG.TRUE_LEGENDARIES = TRUE_LEGENDARIES;
  PG.HAZARD_STATS = HAZARD_STATS;
  PG.getRegion = getRegion;
  PG.isRegionUnlocked = isRegionUnlocked;
  PG.weatherFor = weatherFor;
})();
