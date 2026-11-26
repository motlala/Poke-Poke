/* ============================================================
   THƯƠNG HỘI: thương nhân ghé theo lịch, hàng hiếm & đổi nguyên liệu
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const MERCHANTS = {
    'caravan-of-rare': {
      id: 'caravan-of-rare', name: 'Báu Vật Lữ Hành', title: 'Thương nhân sa mạc',
      icon: '🐫', color: '#ffd86b', weekdays: [1, 3, 5],
      regionIds: ['desert', 'volcano', 'pal-lava'],
      quote: 'Đồ hiếm không bán cho người thường — nhưng nguyên liệu thì ta trả giá cao.',
      buys: ['sand', 'stone', 'relic'],
      goods: [
        { offerId: 'celestial', kind: 'item', id: 'celestialball', qty: 2, price: 9600, minLevel: 18 },
        { offerId: 'master', kind: 'item', id: 'masterball', qty: 1, price: 18000, minLevel: 25 },
        { offerId: 'origin', kind: 'item', id: 'origin-shard', qty: 1, price: 24000, minLevel: 30 },
        { offerId: 'clover-ring', kind: 'equipment', baseId: 'clover-ring', qty: 1, price: 32000, minLevel: 30, opts: { highLuck: true } },
        { offerId: 'infinity', kind: 'trainer', itemId: 'infinity-charm', qty: 1, price: 52000, minLevel: 35 }
      ],
      trades: [
        { offerId: 'brooch', give: { coins: 18000, materials: { relic: 24, crystal: 12 } },
          out: { equipment: [{ baseId: 'four-leaf-brooch', highLuck: true }] }, minLevel: 35 }
      ]
    },
    'forest-trapper': {
      id: 'forest-trapper', name: 'Thợ Săn Rừng Sâu', title: 'Thương nhân rừng rậm',
      icon: '🦊', color: '#4ade80', weekdays: [0, 2, 4],
      regionIds: ['forest', 'digi-forest', 'lake'],
      quote: 'Rừng cho ta mọi thứ, chỉ cần biết đào đúng chỗ.',
      buys: ['seed', 'leather', 'feather'],
      goods: [
        { offerId: 'shiny-charm', kind: 'item', id: 'shiny-charm', qty: 1, price: 22000, minLevel: 22 },
        { offerId: 'lucky-clover', kind: 'item', id: 'lucky-clover', qty: 3, price: 5400, minLevel: 12 },
        { offerId: 'goldenrazz', kind: 'item', id: 'goldenrazz', qty: 5, price: 2400, minLevel: 10 },
        { offerId: 'armor', kind: 'item', id: 'armor-shard', qty: 1, price: 21000, minLevel: 28 },
        { offerId: 'titan', kind: 'trainer', itemId: 'titan-glove', qty: 1, price: 34000, minLevel: 30 }
      ],
      trades: [
        { offerId: 'lucky-pack', give: { coins: 8000, materials: { seed: 30, leather: 20 } },
          out: { equipment: [{ baseId: 'lucky-pack', highLuck: true }] }, minLevel: 24 }
      ]
    },
    'ocean-trader': {
      id: 'ocean-trader', name: 'Thương Nhân Biển Đông', title: 'Thương nhân hải cảng',
      icon: '🐋', color: '#38bdf8', weekdays: [1, 4, 6],
      regionIds: ['beach', 'lake', 'pal-isles'],
      quote: 'Sò điệp biết giữ bí mật, còn tôi biết giữ giá tốt.',
      buys: ['shell', 'ice', 'feather'],
      goods: [
        { offerId: 'master-sea', kind: 'item', id: 'masterball', qty: 1, price: 16000, minLevel: 25 },
        { offerId: 'star-badge', kind: 'item', id: 'star-badge', qty: 1, price: 15000, minLevel: 20 },
        { offerId: 'aura', kind: 'item', id: 'aura-core', qty: 1, price: 20000, minLevel: 26 },
        { offerId: 'storm-amulet', kind: 'equipment', baseId: 'storm-amulet', qty: 1, price: 18000, minLevel: 24 },
        { offerId: 'phoenix', kind: 'trainer', itemId: 'phoenix-feather', qty: 1, price: 48000, minLevel: 34 }
      ],
      trades: [
        { offerId: 'giganta', give: { coins: 14000, materials: { shell: 28, ice: 16 } },
          out: { items: { 'giganta-core': 1 } }, minLevel: 26 }
      ]
    },
    'temple-envoy': {
      id: 'temple-envoy', name: 'Sứ Giả Điện Trời', title: 'Thương nhân đền cổ',
      icon: '⚡', color: '#c084fc', weekdays: [0, 2, 5],
      regionIds: ['city', 'temple', 'digi-city', 'digi-temple', 'snow', 'pal-tundra'],
      quote: 'Cổ vật không có giá — nhưng ta vẫn phải sống.',
      buys: ['crystal', 'relic', 'ember'],
      goods: [
        { offerId: 'ultra-ring', kind: 'item', id: 'ultra-ring', qty: 1, price: 21000, minLevel: 28 },
        { offerId: 'serum', kind: 'item', id: 'mutation-serum', qty: 2, price: 9000, minLevel: 15 },
        { offerId: 'exp-max', kind: 'item', id: 'exp-max', qty: 2, price: 21000, minLevel: 18 },
        { offerId: 'clover-ring-temple', kind: 'equipment', baseId: 'clover-ring', qty: 1, price: 36000, minLevel: 32 },
        { offerId: 'fate', kind: 'trainer', itemId: 'fate-dice', qty: 1, price: 56000, minLevel: 36 }
      ],
      trades: [
        { offerId: 'cosmic', give: { coins: 22000, materials: { crystal: 25, relic: 18 } },
          out: { trainerItems: ['cosmic-core'] }, minLevel: 36 }
      ]
    }
  };

  function weekdayOf(dayKey) {
    const parts = String(dayKey || PG.todayKey()).split('-').map(Number);
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1).getDay();
  }

  function merchantFor(regionId, dayKey) {
    const key = dayKey || PG.todayKey();
    const wd = weekdayOf(key);
    const pool = Object.keys(MERCHANTS).filter(id => {
      const m = MERCHANTS[id];
      return m.weekdays.indexOf(wd) >= 0 && m.regionIds.indexOf(regionId) >= 0;
    });
    if (!pool.length) return null;
    const seed = key + ':' + regionId;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    return MERCHANTS[pool[Math.abs(h) % pool.length]];
  }

  PG.MERCHANTS = MERCHANTS;
  PG.MERCHANT_ORDER = Object.keys(MERCHANTS);
  PG.merchantFor = merchantFor;
})();
