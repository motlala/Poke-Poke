/* ============================================================
   KHU HUẤN LUYỆN VIÊN — nhiều HLV nhỏ ở mỗi vùng.
   Mỗi người thưởng Xu / bóng / thuốc / nguyên liệu theo cấp vùng;
   danh sách thắng reset theo chu kỳ 30 phút (không cần sang ngày).
   Chỉ định nghĩa dữ liệu + tiện ích chu kỳ, không đụng luật trận đấu.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const CYCLE_MS = 30 * 60 * 1000;
  const SETS = [
    {
      titles: ['Trận đầu tay', 'Học hỏi từ rừng', 'Khám phá bước đầu', 'Đối thủ đầu tiên'],
      avatars: ['🧒', '🧑‍🎤', '👧', '🧑‍🌾']
    },
    {
      titles: ['Giao lưu vùng', 'Tìm kiếm thử thách', 'Không lùi bước', 'Chiến thuật cơ bản'],
      avatars: ['🧑‍✈️', '🥾', '👩‍🚀', '🧑‍🔬']
    },
    {
      titles: ['Kinh nghiệm thực chiến', 'Bảo vệ quê hương', 'Thử tài người mới', 'Đối thủ đáng gờm'],
      avatars: ['🧔', '🥷', '🏅', '🧑‍🏫']
    },
    {
      titles: ['Đỉnh cao quyền năng', 'Đối trọng cuối cùng', 'Không chấp nhận yếu đuối', 'Trận cuối của khu'],
      avatars: ['🦸', '🧙', '🌟', '👑']
    }
  ];

  /* Tên HLV lấy từ các nhân vật Nhật / phương Tây quen thuộc. Mỗi vùng lấy
     một đoạn khác nhau của danh sách nên 21 khu không trùng bộ 4 người. */
  const NAMES = [
    'Satoshi', 'Kasumi', 'Takeshi', 'Ash', 'Misty', 'Brock',
    'Jotaro', 'Dio', 'Joseph', 'Giorno', 'Bucciarati', 'Jonathan',
    'Naruto', 'Sasuke', 'Sakura', 'Kakashi', 'Minato',
    'Goku', 'Vegeta', 'Gohan', 'Piccolo', 'Luffy', 'Zoro', 'Nami', 'Sanji',
    'Gojo', 'Itadori', 'Fushiguro', 'Kugisaki', 'Tanjiro', 'Nezuko', 'Zenitsu', 'Inosuke',
    'Gon', 'Killua', 'Kurapika', 'Leorio', 'Natsu', 'Lucy', 'Gray', 'Erza',
    'Ichigo', 'Rukia', 'Renji', 'Byakuya', 'Saitama', 'Genos', 'Todoroki', 'Bakugo',
    'Deku', 'Edward', 'Alphonse', 'Roy', 'Winry', 'Light', 'Near', 'Mello',
    'Niggest', 'Joker', 'Akira', 'Haru', 'Yuuki', 'Sora', 'Riku', 'Kairi'
  ];
  function nameFor(region, tier, i) {
    const idx = PG.REGION_ORDER.indexOf(region.id);
    const start = ((idx < 0 ? 0 : idx) * 7 + tier * 3 + i) % NAMES.length;
    return NAMES[(start + NAMES.length) % NAMES.length];
  }
  const QUOTES = [
    'Cậu mới phải không? Thử một trận nhé!',
    'Đi ngang qua đây... dám đấu một trận không?',
    'Tôi luyện đội này suốt một thời gian dài!',
    'Thắng được tôi thì cậu đáng mặt huấn luyện viên!'
  ];
  const MAT_BY_TYPE = {
    grass: 'seed', bug: 'leather', normal: 'leather', fairy: 'feather', fire: 'ember',
    water: 'shell', ice: 'ice', electric: 'crystal', rock: 'stone', ground: 'sand',
    steel: 'stone', psychic: 'crystal', ghost: 'relic', dragon: 'relic', dark: 'relic',
    fighting: 'leather', poison: 'seed', flying: 'feather', celestial: 'relic',
    quantum: 'crystal', glitch: 'crystal', neutral: 'stone'
  };
  const BALLS = ['pokeball', 'greatball', 'ultraball', 'celestialball'];
  const MEDS = ['potion', 'superpotion', 'hyperpotion', 'maxpotion'];

  function tierOf(region) {
    const gymLv = region.gym && region.gym.team && region.gym.team[0] ? region.gym.team[0][1] : 0;
    const trLv = region.trainer && region.trainer.team && region.trainer.team[0] ? region.trainer.team[0][1] : 0;
    const lv = gymLv || trLv || (region.unlock && region.unlock.level) || 5;
    return lv <= 14 ? 0 : lv <= 30 ? 1 : lv <= 48 ? 2 : 3;
  }

  function poolFor(region) {
    const pool = [];
    const push = id => { if (PG.SPECIES[id] && pool.indexOf(id) < 0) pool.push(id); };
    (region.featured || []).forEach(push);
    ((region.trainer && region.trainer.team) || []).forEach(e => push(e && e[0]));
    ((region.gym && region.gym.team) || []).forEach(e => push(e && e[0]));
    (region.fishing && region.fishing.pool || []).forEach(push);
    ['pidgey', 'rattata', 'magikarp', 'eevee'].forEach(push);
    return pool;
  }

  function zoneFor(region) {
    const tier = tierOf(region);
    const set = SETS[tier];
    const pool = poolFor(region);
    const gymLv = region.gym && region.gym.team && region.gym.team[0] ? Number(region.gym.team[0][1]) : 0;
    const baseLv = Math.max(2, Math.round(((region.unlock && region.unlock.level || 1) + gymLv) / 2) - 2);
    const mat = MAT_BY_TYPE[(region.types || [])[0]] || (region.drops || [])[0] || 'stone';
    const alt = (region.drops || [])[1] || 'leather';
    return {
      regionId: region.id,
      regionName: region.name,
      emoji: region.emoji || '🎖️',
      tier,
      trainers: set.titles.map((title, i) => {
        const team = [0, 1, 2].map(k => [pool[(i * 3 + k) % pool.length], baseLv + i * 2 + k]);
        const reward = {
          coins: Math.round((260 + tier * 420 + i * 110) * (1 + i * 0.1)),
          xp: 55 + tier * 85 + i * 22,
          stardust: 30 + tier * 70 + i * 15,
          items: {},
          materials: {}
        };
        reward.items[BALLS[Math.min(3, tier)]] = 1 + Math.min(2, tier);
        reward.items[MEDS[Math.min(3, tier)]] = 1 + (tier >= 2 ? 1 : 0);
        reward.materials[mat] = 2 + tier + i;
        if (i >= 2) reward.materials[alt] = 1 + tier;
        if (tier >= 2) reward.diamonds = tier - 1 + (i === 3 ? 1 : 0);
        return {
          id: region.id + '-zone-' + i,
          name: nameFor(region, tier, i),
          title,
          avatar: set.avatars[i],
          quote: QUOTES[i],
          difficulty: tier === 0 ? 'easy' : tier === 1 ? 'medium' : tier === 2 ? 'hard' : 'boss',
          hpMult: Number((1.06 + tier * 0.09 + i * 0.03).toFixed(2)),
          team,
          heldItems: tier >= 2 ? ['oran-berry', 'sitrus-berry'] : tier >= 1 ? ['oran-berry'] : [],
          reward
        };
      })
    };
  }

  const ZONE = {};
  for (const rid of (PG.REGION_ORDER || [])) {
    const region = PG.REGIONS[rid];
    if (region) ZONE[rid] = zoneFor(region);
  }

  function cycleAt(ms) { return Math.floor(ms / CYCLE_MS); }
  function cycle() { return cycleAt(Date.now()); }
  function nextAt() { return (cycle() + 1) * CYCLE_MS; }
  function keyOf(regionId, index) { return regionId + '-zone-' + index; }
  function isDefeated(key) {
    const s = PG.getState && PG.getState();
    const tz = s && s.trainerZone;
    if (!tz || tz.cycleKey !== cycle()) return false;
    return !!((tz.defeated || {})[key]);
  }

  PG.TRAINER_ZONE = ZONE;
  PG.TRAINER_ZONE_CYCLE_MS = CYCLE_MS;
  PG.trainerZoneOf = zoneFor;
  PG.trainerZoneCycle = cycle;
  PG.trainerZoneCycleAt = cycleAt;
  PG.trainerZoneNextAt = nextAt;
  PG.trainerZoneKey = keyOf;
  PG.isZoneTrainerDefeated = isDefeated;
})();
