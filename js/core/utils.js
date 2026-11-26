/* ============================================================
   TIỆN ÍCH CHUNG
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const chance = p => Math.random() < p;
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const weightedPick = (items, weightFn) => {
    let total = 0;
    for (const it of items) total += Math.max(0, weightFn(it));
    if (total <= 0) return pick(items);
    let r = Math.random() * total;
    for (const it of items) {
      r -= Math.max(0, weightFn(it));
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  };
  const uid = (prefix = 'id') => prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const pad = n => String(n).padStart(2, '0');
  const fmt = n => {
    if (n === undefined || n === null || isNaN(n)) return '0';
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1e5) return Math.round(n / 1e3) + 'K';
    return Math.round(n).toLocaleString('vi-VN');
  };
  const fmtKm = n => (Math.round(n * 10) / 10).toLocaleString('vi-VN') + ' km';
  const pct = n => Math.round(n * 100) + '%';
  const todayKey = () => {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  const weekKey = () => {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + pad(week);
  };
  const isNight = () => {
    const h = new Date().getHours();
    return h >= 19 || h < 6;
  };
  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'day';
    if (h >= 17 && h < 19) return 'evening';
    return 'night';
  };
  const timeLabel = () => ({ morning: 'Buổi sáng', day: 'Ban ngày', evening: 'Hoàng hôn', night: 'Ban đêm' }[timeOfDay()]);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s === undefined ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const deepClone = o => JSON.parse(JSON.stringify(o));
  const sum = arr => arr.reduce((a, b) => a + b, 0);

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (e) { console.warn('Không lưu được', e); return false; }
    },
    remove(key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  /** Kẹo theo loài (dùng chung tiến hóa) */
  function familyOf(speciesId) {
    const chain = PG.SPECIES[speciesId] && PG.SPECIES[speciesId].family;
    return chain || speciesId;
  }

  /* ------------------------------------------------------------
     Loài fan-made / crossover dùng dex riêng (8801+, 9001+, 9101+)
     nên PokeAPI không có ảnh trùng số. Ánh xạ sang artwork thật của
     loài tương tự để luôn hiện ảnh rõ nét thay vì icon dự phòng.
     ------------------------------------------------------------ */
  const FAN_SPRITE_IDS = {
    /* Fan-made / crossover */
    9001: 25, 9002: 26, 9003: 212, 9004: 248, 9005: 10034, 9006: 25,
    9007: 10059, 9008: 151, 9009: 254, 9010: 160, 9011: 137, 9012: 479,
    9013: 39, 9014: 474, 9015: 10034, 9016: 448, 9017: 470, 9018: 319,
    9019: 445, 9020: 681, 9021: 145, 9022: 778, 9023: 116, 9024: 323,
    9025: 10038, 9026: 492, 9027: 121, 9028: 407, 9029: 464, 9030: 197,
    9031: 143, 9032: 392, 9033: 10104, 9034: 330, 9035: 321, 9036: 212,
    9037: 97, 9038: 10033, 9039: 151, 9040: 25,
    /* Thần thoại / huyền thoại mới */
    8801: 384, 8802: 151, 8803: 250, 8804: 488, 8805: 145, 8806: 382,
    8807: 383, 8808: 487, 8809: 250, 8810: 377, 8811: 488, 8812: 483,
    /* Dạng tiến hóa kiểu anime */
    9101: 10034, 9102: 10035, 9103: 10033, 9104: 10197, 9105: 10038,
    9106: 10049, 9107: 10046, 9108: 10051, 9109: 10067, 9110: 10057,
    9111: 10059, 9112: 10058, 9113: 150, 9114: 149, 9115: 10206,
    9116: 131, 9117: 350, 9118: 10076, 9119: 637, 9120: 479,
    9121: 133, 9122: 25,
    /* Pokémon điện ảnh / dạng đặc biệt (9201-9250) */
    9201: 150, 9202: 150, 9203: 151, 9204: 249, 9205: 250,
    9206: 380, 9207: 381, 9208: 386, 9209: 10001, 9210: 10002, 9211: 10003,
    9212: 385, 9213: 384, 9214: 490, 9215: 491, 9216: 492, 9217: 10006,
    9218: 493, 9219: 494, 9220: 643, 9221: 644, 9222: 646, 9223: 10022, 9224: 10023,
    9225: 647, 9226: 10024, 9227: 648, 9228: 10018, 9229: 649,
    9230: 719, 9231: 10075, 9232: 720, 9233: 10086, 9234: 721,
    9235: 801, 9236: 10147, 9237: 802, 9238: 807, 9239: 808, 9240: 809, 9241: 10208,
    9242: 10117, 9243: 10116, 9244: 10160, 9245: 251, 9246: 244, 9247: 243,
    9248: 245, 9249: 144, 9250: 145,
    /* Crossover: fallback PokéAPI nếu ảnh game khác hỏng */
    9251: 131, 9252: 133, 9253: 54, 9254: 25, 9255: 197, 9256: 133,
    9257: 391, 9258: 131, 9259: 18, 9260: 197, 9261: 133,
    /* Palworld bổ sung (9262-9287) */
    9262: 4, 9263: 25, 9264: 54, 9265: 417, 9266: 152, 9267: 495, 9268: 25, 9269: 149,
    9270: 4, 9271: 18, 9272: 152, 9273: 54, 9274: 131, 9275: 149, 9276: 491, 9277: 468,
    9278: 4, 9279: 133, 9280: 143, 9281: 460, 9282: 182, 9283: 6, 9284: 491, 9285: 25,
    9286: 149, 9287: 495,
    /* Digimon bổ sung (9288-9302) */
    9288: 393, 9289: 214, 9290: 152, 9291: 468, 9292: 359, 9293: 6, 9294: 6, 9295: 460,
    9296: 149, 9297: 448, 9298: 282, 9299: 249, 9300: 491, 9301: 491, 9302: 468,
    /* Crossover đợt 2: Palworld 9303-9322, Digimon 9323-9332 */
    9303: 133, 9304: 16, 9305: 133, 9306: 18, 9307: 519, 9308: 197, 9309: 133, 9310: 34,
    9311: 197, 9312: 50, 9313: 234, 9314: 18, 9315: 149, 9316: 25, 9317: 320, 9318: 197,
    9319: 214, 9320: 197, 9321: 133, 9322: 18,
    9323: 468, 9324: 18, 9325: 6, 9326: 197, 9327: 133, 9328: 4, 9329: 6, 9330: 468,
    9331: 448, 9332: 448,
    /* Crossover đợt 3: fallback PokéAPI nếu ảnh franchise hỏng */
    9333: 179, 9334: 22, 9335: 640, 9336: 302, 9337: 570, 9338: 637, 9339: 530, 9340: 323,
    9341: 145, 9342: 471, 9343: 640, 9344: 302, 9345: 635, 9346: 330, 9347: 78, 9348: 148,
    9349: 6, 9350: 460, 9351: 381, 9352: 145, 9353: 135, 9354: 213, 9355: 194, 9356: 52,
    9357: 478, 9358: 182, 9359: 492, 9360: 214, 9361: 250, 9362: 328,
    9363: 133, 9364: 175, 9365: 10, 9366: 198, 9367: 442, 9368: 448, 9369: 62, 9370: 88,
    9371: 143, 9372: 106, 9373: 200, 9374: 448, 9375: 6, 9376: 149, 9377: 148, 9378: 130,
    9379: 123, 9380: 212, 9381: 652, 9382: 182, 9383: 75, 9384: 6, 9385: 635, 9386: 380,
    9387: 658, 9388: 302, 9389: 445, 9390: 130, 9391: 123, 9392: 383,
    /* Phim bổ sung: dùng artDex (xem spriteIdFor) */
    9393: 10043, 9394: 10044, 9395: 10007, 9396: 10077, 9397: 10078, 9398: 10079,
    9399: 10062, 9400: 10063, 9401: 10059, 9402: 10050, 9403: 10041, 9404: 10045,
    9405: 10060, 9406: 10088, 9407: 10090, 9408: 10073, 9409: 10094, 9410: 10095,
    9411: 10096, 9412: 10097, 9413: 10098, 9414: 10099, 9415: 10148, 9419: 331,
    9422: 10120,
    /* Palworld đợt 4: fallback PokéAPI nếu ảnh franchise hỏng */
    9423: 6, 9424: 646, 9425: 282, 9426: 460, 9427: 131, 9428: 143, 9429: 5,
    9430: 442, 9431: 224, 9432: 215, 9433: 21, 9434: 22, 9435: 359, 9436: 442,
    9437: 76, 9438: 148, 9439: 143, 9440: 148, 9441: 215, 9442: 197, 9443: 302,
    9444: 18, 9445: 131, 9446: 131, 9447: 234, 9448: 131, 9449: 215, 9450: 302,
    9451: 212, 9452: 381,
     9453: 145,
     9454: 149,
     9455: 131,
     9456: 131,
     9457: 25,
     9458: 25,
     9459: 35,
     9460: 54,
     9461: 95,
     9462: 149,
     9463: 131,
     9464: 95,
     9465: 131,
     9466: 131,
     9467: 468,
     9468: 133,
     9469: 249,
     9470: 244,
     9471: 468,
     9472: 197,
     9473: 302,
     9474: 130,
     9475: 448,
     9476: 149,
     9477: 131,
     9478: 149,
     9479: 83,
     9480: 120,
     9481: 448,
     9482: 262,
     9483: 448,
     9484: 448,
     9485: 6,
     9486: 131,
     9487: 6,
     9488: 448,
     9489: 428,
     9490: 448,
     9491: 448,
     9492: 167,
     9493: 105,
     9494: 468,
     9495: 6,
     9496: 6,
     9497: 448,
     9498: 6,
     9499: 131,
     9500: 448,
     9501: 468,
     9502: 448,
     9503: 104,
     9504: 147,
     9505: 25,
     9506: 10,
     9507: 197,
     9508: 1,
     9509: 1,
     9510: 133,
     9511: 133,
     9512: 54,
     9513: 133,
     9514: 10,
     9515: 87,
     9516: 133,
     9517: 197,
     9518: 25,
     9519: 133,
     9520: 74,
     9521: 1,
     9522: 133,
     9523: 104,
     9524: 104,
     9525: 133,
     9526: 10,
     9527: 104,
     9528: 5,
     9529: 197,
     9530: 133,
     9531: 133,
     9532: 87,
     9533: 5,
     9534: 54,
     9535: 133,
     9536: 54,
     9537: 25,
     9538: 1,
     9539: 87,
     9540: 197,
     9541: 147,
     9542: 25,
     9543: 197,
     9544: 54,
     9545: 133,
     9546: 5,
     9547: 133,
     9548: 1,
     9549: 197,
     9550: 1,
     9551: 1,
     9552: 1
  };

  /* Nexus Anima (9553-9582, 9613-9662, 9713-9716): ảnh local là nguồn chính,
     fallback PokéAPI chỉ dùng khi file local bị mất. */
  for (let d = 9553; d <= 9582; d++) FAN_SPRITE_IDS[d] = 1;
  for (let d = 9613; d <= 9662; d++) FAN_SPRITE_IDS[d] = 1;
  for (let d = 9713; d <= 9716; d++) FAN_SPRITE_IDS[d] = 1;
  /* Nexus Anima bổ sung 9911-9927: 17 portrait thật từ hna.wiki. */
  for (let d = 9911; d <= 9927; d++) FAN_SPRITE_IDS[d] = 1;


  /* Ảnh ngoài PokéAPI (Palworld / Digimon / các nguồn public khác).
     Dùng art gốc của từng franchise; nếu link hỏng vẫn có fallback PokéAPI. */
  const FAN_SPRITE_URLS = {};

  function apiSpriteUrl(id) {
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + id + '.png';
  }

  /* Ảnh crossover gốc từ Palworld Wiki / Wikimon. Ảnh đã được tải về và xử lý
     nền trong suốt + căn kích thước trong images/crossovers/, nên hiển thị
     y hệt artwork PokéAPI. URL gốc giữ lại làm dự phòng. */
  [
    [9251, 'https://palworld.wiki.gg/images/Chillet.png', 131],
    [9252, 'https://palworld.wiki.gg/images/Lamball.png', 133],
    [9253, 'https://palworld.wiki.gg/images/Pengullet.png', 54],
    [9254, 'https://palworld.wiki.gg/images/Jolthog.png', 25],
    [9255, 'https://palworld.wiki.gg/images/Daedream.png', 197],
    [9256, 'https://palworld.wiki.gg/images/Direhowl.png', 133],
    [9257, 'https://wikimon.net/images/7/72/Agumon.jpg', 391],
    [9258, 'https://wikimon.net/images/7/71/Gabumon.jpg', 131],
    [9259, 'https://wikimon.net/images/d/d8/Piyomon.jpg', 18],
    [9260, 'https://wikimon.net/images/9/95/Tailmon.jpg', 197],
    [9261, 'https://wikimon.net/images/7/7d/Patamon.jpg', 133],
    /* Palworld bổ sung */
    [9262, 'https://palworld.wiki.gg/images/Foxparks.png', 4],
    [9263, 'https://palworld.wiki.gg/images/Sparkit.png', 25],
    [9264, 'https://palworld.wiki.gg/images/Fuack.png', 54],
    [9265, 'https://palworld.wiki.gg/images/Lifmunk.png', 417],
    [9266, 'https://palworld.wiki.gg/images/Gumoss.png', 152],
    [9267, 'https://palworld.wiki.gg/images/Mossanda.png', 495],
    [9268, 'https://palworld.wiki.gg/images/Grizzbolt.png', 25],
    [9269, 'https://palworld.wiki.gg/images/Relaxaurus.png', 149],
    [9270, 'https://palworld.wiki.gg/images/Pyrin_Noct.png', 4],
    [9271, 'https://palworld.wiki.gg/images/Nitewing.png', 18],
    [9272, 'https://palworld.wiki.gg/images/Dinossom.png', 152],
    [9273, 'https://palworld.wiki.gg/images/Surfent.png', 54],
    [9274, 'https://palworld.wiki.gg/images/Penking.png', 131],
    [9275, 'https://palworld.wiki.gg/images/Jetragon.png', 149],
    [9276, 'https://palworld.wiki.gg/images/Necromus.png', 491],
    [9277, 'https://palworld.wiki.gg/images/Paladius.png', 468],
    [9278, 'https://palworld.wiki.gg/images/Pyrin.png', 4],
    [9279, 'https://palworld.wiki.gg/images/Kingpaca.png', 133],
    [9280, 'https://palworld.wiki.gg/images/Mammorest.png', 143],
    [9281, 'https://palworld.wiki.gg/images/Wumpo.png', 460],
    [9282, 'https://palworld.wiki.gg/images/Lyleen.png', 182],
    [9283, 'https://palworld.wiki.gg/images/Faleris.png', 6],
    [9284, 'https://palworld.wiki.gg/images/Shadowbeak.png', 491],
    [9285, 'https://palworld.wiki.gg/images/Jolthog_Cryst.png', 25],
    [9286, 'https://palworld.wiki.gg/images/Relaxaurus_Lux.png', 149],
    [9287, 'https://palworld.wiki.gg/images/Mossanda_Lux.png', 495],
    /* Digimon bổ sung */
    [9288, 'https://wikimon.net/images/9/9b/Gomamon.jpg', 393],
    [9289, 'https://wikimon.net/images/a/ac/Tentomon.jpg', 214],
    [9290, 'https://wikimon.net/images/6/61/Palmon.jpg', 152],
    [9291, 'https://wikimon.net/images/5/5a/Angewomon.jpg', 468],
    [9292, 'https://wikimon.net/images/5/57/Garurumon.jpg', 359],
    [9293, 'https://wikimon.net/images/6/6c/Greymon.jpg', 6],
    [9294, 'https://wikimon.net/images/d/d8/Metalgreymon.jpg', 6],
    [9295, 'https://wikimon.net/images/8/8f/Weregarurumon.jpg', 460],
    [9296, 'https://wikimon.net/images/5/5c/Imperialdramon.jpg', 149],
    [9297, 'https://wikimon.net/images/4/4d/Dukemon.jpg', 448],
    [9298, 'https://wikimon.net/images/a/a7/Sakuyamon.jpg', 282],
    [9299, 'https://wikimon.net/images/7/78/Omegamon.jpg', 249],
    [9300, 'https://wikimon.net/images/9/95/Diablomon.jpg', 491],
    [9301, 'https://wikimon.net/images/e/e5/Beelzebumon.jpg', 491],
    [9302, 'https://wikimon.net/images/7/75/Seraphimon.jpg', 468],
    /* Palworld đợt 2 */
    [9303, 'https://palworld.wiki.gg/images/Cattiva.png', 133],
    [9304, 'https://palworld.wiki.gg/images/Chikipi.png', 16],
    [9305, 'https://palworld.wiki.gg/images/Vixy.png', 133],
    [9306, 'https://palworld.wiki.gg/images/Celaray.png', 18],
    [9307, 'https://palworld.wiki.gg/images/Depresso.png', 519],
    [9308, 'https://palworld.wiki.gg/images/Hoocrates.png', 197],
    [9309, 'https://palworld.wiki.gg/images/Melpaca.png', 133],
    [9310, 'https://palworld.wiki.gg/images/Tanzee.png', 34],
    [9311, 'https://palworld.wiki.gg/images/Nox.png', 197],
    [9312, 'https://palworld.wiki.gg/images/Rushoar.png', 50],
    [9313, 'https://palworld.wiki.gg/images/Eikthyrdeer.png', 234],
    [9314, 'https://palworld.wiki.gg/images/Hangyu.png', 18],
    [9315, 'https://palworld.wiki.gg/images/Azurobe.png', 149],
    [9316, 'https://palworld.wiki.gg/images/Univolt.png', 25],
    [9317, 'https://palworld.wiki.gg/images/Gobfin.png', 320],
    [9318, 'https://palworld.wiki.gg/images/Loupmoon.png', 197],
    [9319, 'https://palworld.wiki.gg/images/Beegarde.png', 214],
    [9320, 'https://palworld.wiki.gg/images/Katress.png', 197],
    [9321, 'https://palworld.wiki.gg/images/Fenglope.png', 133],
    [9322, 'https://palworld.wiki.gg/images/Ragnahawk.png', 18],
    /* Digimon đợt 2 */
    [9323, 'https://wikimon.net/images/1/1b/Angemon.jpg', 468],
    [9324, 'https://wikimon.net/images/7/7f/Hawkmon.jpg', 18],
    [9325, 'https://wikimon.net/images/c/c5/Guilmon.jpg', 6],
    [9326, 'https://wikimon.net/images/4/46/Renamon.jpg', 197],
    [9327, 'https://wikimon.net/images/5/51/Terriermon.jpg', 133],
    [9328, 'https://wikimon.net/images/0/0b/Impmon.jpg', 4],
    [9329, 'https://wikimon.net/images/4/44/Shoutmon.jpg', 6],
    [9330, 'https://wikimon.net/images/1/15/Lucemon.jpg', 468],
    [9331, 'https://wikimon.net/images/2/29/Alphamon.jpg', 448],
    [9332, 'https://wikimon.net/images/6/6d/Magnamon.jpg', 448],
    /* Crossover đợt 3: Palworld 9333-9362, Digimon 9363-9392 */
    [9333, "https://palworld.wiki.gg/images/Woolipop_icon.png", 179], // Woolipop
    [9334, "https://palworld.wiki.gg/images/Galeclaw_icon.png", 22], // Galeclaw
    [9335, "https://palworld.wiki.gg/images/Bushi_icon.png", 640], // Bushi
    [9336, "https://palworld.wiki.gg/images/Omascul_icon.png", 302], // Omascul
    [9337, "https://palworld.wiki.gg/images/Leezpunk_icon.png", 570], // Leezpunk
    [9338, "https://palworld.wiki.gg/images/Flambelle_icon.png", 637], // Flambelle
    [9339, "https://palworld.wiki.gg/images/Vanwyrm_icon.png", 530], // Vanwyrm
    [9340, "https://palworld.wiki.gg/images/Reptyro_icon.png", 323], // Reptyro
    [9341, "https://palworld.wiki.gg/images/Dazzi_icon.png", 145], // Dazzi
    [9342, "https://palworld.wiki.gg/images/Cryolinx_icon.png", 471], // Cryolinx
    [9343, "https://palworld.wiki.gg/images/Verdash_icon.png", 640], // Verdash
    [9344, "https://palworld.wiki.gg/images/Menasting_icon.png", 302], // Menasting
    [9345, "https://palworld.wiki.gg/images/Astegon_icon.png", 635], // Astegon
    [9346, "https://palworld.wiki.gg/images/Quivern_icon.png", 330], // Quivern
    [9347, "https://palworld.wiki.gg/images/Frostallion_icon.png", 78], // Frostallion
    [9348, "https://palworld.wiki.gg/images/Jormuntide_icon.png", 148], // Jormuntide
    [9349, "https://palworld.wiki.gg/images/Jormuntide_Ignis_icon.png", 6], // Jormuntide Ignis
    [9350, "https://palworld.wiki.gg/images/Broncherry_icon.png", 460], // Broncherry
    [9351, "https://palworld.wiki.gg/images/Elphidran_icon.png", 381], // Elphidran
    [9352, "https://palworld.wiki.gg/images/Beakon_icon.png", 145], // Beakon
    [9353, "https://palworld.wiki.gg/images/Rayhound_icon.png", 135], // Rayhound
    [9354, "https://palworld.wiki.gg/images/Digtoise_icon.png", 213], // Digtoise
    [9355, "https://palworld.wiki.gg/images/Dumud_icon.png", 194], // Dumud
    [9356, "https://palworld.wiki.gg/images/Grintale_icon.png", 52], // Grintale
    [9357, "https://palworld.wiki.gg/images/Sibelyx_icon.png", 478], // Sibelyx
    [9358, "https://palworld.wiki.gg/images/Petallia_icon.png", 182], // Petallia
    [9359, "https://palworld.wiki.gg/images/Vaelet_icon.png", 492], // Vaelet
    [9360, "https://palworld.wiki.gg/images/Warsect_icon.png", 214], // Warsect
    [9361, "https://palworld.wiki.gg/images/Suzaku_icon.png", 250], // Suzaku
    [9362, "https://palworld.wiki.gg/images/Yakumo_icon.png", 328], // Yakumo
    [9363, "https://wikimon.net/images/6/6e/Koromon.jpg", 133], // Koromon
    [9364, "https://wikimon.net/images/e/ed/Botamon.jpg", 175], // Botamon
    [9365, "https://wikimon.net/images/1/11/Kunemon.jpg", 10], // Kunemon
    [9366, "https://wikimon.net/images/d/d4/Picodevimon.jpg", 198], // DemiDevimon
    [9367, "https://wikimon.net/images/2/29/Devimon.jpg", 442], // Devimon
    [9368, "https://wikimon.net/images/6/68/Leomon.jpg", 448], // Leomon
    [9369, "https://wikimon.net/images/2/25/Orgemon.jpg", 62], // Ogremon
    [9370, "https://wikimon.net/images/1/1f/Numemon.jpg", 88], // Numemon
    [9371, "https://wikimon.net/images/5/5f/Monzaemon.jpg", 143], // Monzaemon
    [9372, "https://wikimon.net/images/c/c4/Etemon.jpg", 106], // Etemon
    [9373, "https://wikimon.net/images/6/66/Vamdemon.jpg", 200], // Myotismon
    [9374, "https://wikimon.net/images/2/25/Metalgarurumon.jpg", 448], // MetalGarurumon
    [9375, "https://wikimon.net/images/9/94/Wargreymon.jpg", 6], // WarGreymon
    [9376, "https://wikimon.net/images/6/63/Airdramon.jpg", 149], // Airdramon
    [9377, "https://wikimon.net/images/4/49/Seadramon.jpg", 148], // Seadramon
    [9378, "https://wikimon.net/images/3/32/Megaseadramon.jpg", 130], // MegaSeadramon
    [9379, "https://wikimon.net/images/2/20/Kuwagamon.jpg", 123], // Kuwagamon
    [9380, "https://wikimon.net/images/6/61/Okuwamon.jpg", 212], // Okuwamon
    [9381, "https://wikimon.net/images/0/0f/Togemon.jpg", 652], // Togemon
    [9382, "https://wikimon.net/images/a/a8/Lilimon.jpg", 182], // Lillymon
    [9383, "https://wikimon.net/images/5/59/Golemon.jpg", 75], // Golemon
    [9384, "https://wikimon.net/images/1/1d/Geogreymon.jpg", 6], // GeoGreymon
    [9385, "https://wikimon.net/images/1/1f/Skullgreymon.jpg", 635], // SkullGreymon
    [9386, "https://wikimon.net/images/c/c1/Mugendramon.jpg", 380], // Machinedramon
    [9387, "https://wikimon.net/images/4/44/Piemon.jpg", 658], // Piedmon
    [9388, "https://wikimon.net/images/a/a1/Venomvamdemon.jpg", 302], // VenomMyotismon
    [9389, "https://wikimon.net/images/9/90/Shinegreymon.jpg", 445], // ShineGreymon
    [9390, "https://wikimon.net/images/1/18/Miragegaogamon.jpg", 130], // MirageGaogamon
    [9391, "https://wikimon.net/images/a/aa/Grankuwagamon.jpg", 123], // GranKuwagamon
    [9392, "https://wikimon.net/images/7/73/Susanoomon.jpg", 383], // Susanoomon
    /* Palworld đợt 4: artwork toàn thân từ Palworld Wiki (9423-9452) */
    [9423, "https://palworld.wiki.gg/images/Blazamut.png", 6], // Blazamut
    [9424, "https://palworld.wiki.gg/images/Frostallion_Noct.png", 646], // Frostallion Noct
    [9425, "https://palworld.wiki.gg/images/Lyleen_Noct.png", 282], // Lyleen Noct
    [9426, "https://palworld.wiki.gg/images/Wumpo_Botan.png", 460], // Wumpo Botan
    [9427, "https://palworld.wiki.gg/images/Kingpaca_Cryst.png", 131], // Kingpaca Cryst
    [9428, "https://palworld.wiki.gg/images/Mammorest_Cryst.png", 143], // Mammorest Cryst
    [9429, "https://palworld.wiki.gg/images/Incineram.png", 5], // Incineram
    [9430, "https://palworld.wiki.gg/images/Incineram_Noct.png", 442], // Incineram Noct
    [9431, "https://palworld.wiki.gg/images/Killamari.png", 224], // Killamari
    [9432, "https://palworld.wiki.gg/images/Mau.png", 215], // Mau
    [9433, "https://palworld.wiki.gg/images/Robinquill.png", 21], // Robinquill
    [9434, "https://palworld.wiki.gg/images/Robinquill_Terra.png", 22], // Robinquill Terra
    [9435, "https://palworld.wiki.gg/images/Maraith.png", 359], // Maraith
    [9436, "https://palworld.wiki.gg/images/Sootseer.png", 442], // Sootseer
    [9437, "https://palworld.wiki.gg/images/Knocklem.png", 76], // Knocklem
    [9438, "https://palworld.wiki.gg/images/Elphidran_Aqua.png", 148], // Elphidran Aqua
    [9439, "https://palworld.wiki.gg/images/Broncherry_Aqua.png", 143], // Broncherry Aqua
    [9440, "https://palworld.wiki.gg/images/Dinossom_Lux.png", 148], // Dinossom Lux
    [9441, "https://palworld.wiki.gg/images/Vanwyrm_Cryst.png", 215], // Vanwyrm Cryst
    [9442, "https://palworld.wiki.gg/images/Katress_Ignis.png", 197], // Katress Ignis
    [9443, "https://palworld.wiki.gg/images/Leezpunk_Ignis.png", 302], // Leezpunk Ignis
    [9444, "https://palworld.wiki.gg/images/Hangyu_Cryst.png", 18], // Hangyu Cryst
    [9445, "https://palworld.wiki.gg/images/Surfent_Terra.png", 131], // Surfent Terra
    [9446, "https://palworld.wiki.gg/images/Reptyro_Cryst.png", 131], // Reptyro Cryst
    [9447, "https://palworld.wiki.gg/images/Eikthyrdeer_Terra.png", 234], // Eikthyrdeer Terra
    [9448, "https://palworld.wiki.gg/images/Chillet_Ignis.png", 131], // Chillet Ignis
    [9449, "https://palworld.wiki.gg/images/Tombat.png", 215], // Tombat
    [9450, "https://palworld.wiki.gg/images/Menasting_Terra.png", 302], // Menasting Terra
    [9451, "https://palworld.wiki.gg/images/Warsect_Terra.png", 212], // Warsect Terra
    [9452, "https://palworld.wiki.gg/images/Quivern_Botan.png", 381], // Quivern Botan
    [9453, "https://wikimon.net/images/4/4a/Kabuterimon.jpg", 145], // Kabuterimon
    [9454, "https://wikimon.net/images/1/1f/Vdramon.jpg", 149], // V-dramon
    [9455, "https://wikimon.net/images/6/6b/Ulforcevdramon.jpg", 131], // Ulforce V-dramon
    [9456, "https://wikimon.net/images/6/69/Dynasmon.jpg", 131], // Dynasmon
    [9457, "https://wikimon.net/images/d/dc/Elecmon.jpg", 25], // Elecmon
    [9458, "https://wikimon.net/images/5/59/Tunomon.jpg", 25], // Tunomon
    [9459, "https://wikimon.net/images/a/a4/Pyocomon.jpg", 35], // Pyocomon
    [9460, "https://wikimon.net/images/7/73/Pukamon.jpg", 54], // Pukamon
    [9461, "https://wikimon.net/images/f/f4/Gottsumon.jpg", 95], // Gottsumon
    [9462, "https://wikimon.net/images/2/23/Vmon.jpg", 149], // V-mon
    [9463, "https://wikimon.net/images/7/77/Vikemon.jpg", 131], // Vikemon
    [9464, "https://wikimon.net/images/3/30/Armadimon.jpg", 95], // Armadimon
    [9465, "https://wikimon.net/images/4/45/Plesiomon.jpg", 131], // Plesiomon
    [9466, "https://wikimon.net/images/b/b1/Marinangemon.jpg", 131], // Marin Angemon
    [9467, "https://wikimon.net/images/6/6d/Holyangemon.jpg", 468], // Holy Angemon
    [9468, "https://wikimon.net/images/a/af/Lopmon.jpg", 133], // Lopmon
    [9469, "https://wikimon.net/images/1/1e/Chimairamon.jpg", 249], // Chimairamon
    [9470, "https://wikimon.net/images/c/ca/Belialvamdemon2.jpg", 244], // Belial Vamdemon
    [9471, "https://wikimon.net/images/8/8b/Dominimon.jpg", 468], // Dominimon
    [9472, "https://wikimon.net/images/7/79/Lilithmon.jpg", 197], // Lilithmon
    [9473, "https://wikimon.net/images/a/a4/Barbamon2.jpg", 302], // Barbamon
    [9474, "https://wikimon.net/images/4/42/Leviamon.jpg", 130], // Leviamon
    [9475, "https://wikimon.net/images/d/da/Gankoomon.jpg", 448], // Gankoomon
    [9476, "https://wikimon.net/images/a/af/Ouryumon.jpg", 149], // Ouryumon
    [9477, "https://wikimon.net/images/6/63/Metalseadramon.jpg", 131], // Metal Seadramon
    [9478, "https://wikimon.net/images/6/6a/Dorulumon.jpg", 149], // Dorulumon
    [9479, "https://wikimon.net/images/5/52/Ballistamon.jpg", 83], // Ballistamon
    [9480, "https://wikimon.net/images/4/41/Starmon.jpg", 120], // Starmon
    [9481, "https://wikimon.net/images/8/82/Cyberdramon.jpg", 448], // Cyberdramon
    [9482, "https://wikimon.net/images/2/24/Saintgalgomon2.jpg", 262], // Saint Galgomon
    [9483, "https://wikimon.net/images/c/c3/Omegamon_alter-b.jpg", 448], // Omegamon Alter-B
    [9484, "https://wikimon.net/images/c/cb/Imperialdramon_paladin.jpg", 448], // Imperialdramon Paladin Mode
    [9485, "https://wikimon.net/images/6/67/Shinegreymon_burst.jpg", 6], // Shine Greymon Burst Mode
    [9486, "https://wikimon.net/images/7/77/Gabumon_bondoffriendship.jpg", 131], // Gabumon Bond of Friendship
    [9487, "https://wikimon.net/images/5/50/Dukemon_crimson2.jpg", 6], // Dukemon Crimson Mode
    [9488, "https://wikimon.net/images/e/eb/Craniummon.jpg", 448], // Craniummon
    [9489, "https://wikimon.net/images/f/fd/Kuzuhamon.jpg", 428], // Kuzuhamon
    [9490, "https://wikimon.net/images/7/7f/Grandlocomon.jpg", 448], // Grand Locomon
    [9491, "https://wikimon.net/images/3/3e/Locomon2.jpg", 448], // Locomon
    [9492, "https://wikimon.net/images/6/6c/Archnemon.jpg", 167], // Archnemon
    [9493, "https://wikimon.net/images/1/14/Mummymon.jpg", 105], // Mummymon
    [9494, "https://wikimon.net/images/a/a6/Ofanimon.jpg", 468], // Ofanimon
    [9495, "https://wikimon.net/images/f/f4/Megidramon.jpg", 6], // Megidramon
    [9496, "https://wikimon.net/images/1/1d/Beelzebumon_blast.jpg", 6], // Beelzebumon Blast Mode
    [9497, "https://wikimon.net/images/2/23/Knightmon.jpg", 448], // Knightmon
    [9498, "https://wikimon.net/images/a/a2/Blackwargreymon.jpg", 6], // Black War Greymon
    [9499, "https://wikimon.net/images/4/42/Garurumon_black.jpg", 131], // Garurumon Black
    [9500, "https://wikimon.net/images/0/04/Omegamon_zwart.jpg", 448], // Omegamon Zwart
    [9501, "https://wikimon.net/images/0/0f/Omegamon_merciful.jpg", 468], // Omegamon Merciful Mode
    [9502, "https://wikimon.net/images/1/1c/Imperialdramon_fighter.jpg", 448], // Imperialdramon Fighter Mode
    [9503, "https://palworld.wiki.gg/images/Anubis.png", 104], // Anubis
    [9504, "https://palworld.wiki.gg/images/Blazamut Ryu.png", 147], // Blazamut Ryu
    [9505, "https://palworld.wiki.gg/images/Bushi Noct.png", 25], // Bushi Noct
    [9506, "https://palworld.wiki.gg/images/Blazehowl.png", 10], // Blazehowl
    [9507, "https://palworld.wiki.gg/images/Bellanoir.png", 197], // Bellanoir
    [9508, "https://palworld.wiki.gg/images/Bristla.png", 1], // Bristla
    [9509, "https://palworld.wiki.gg/images/Dark Mutant.png", 1], // Dark Mutant
    [9510, "https://palworld.wiki.gg/images/Caprity.png", 133], // Caprity
    [9511, "https://palworld.wiki.gg/images/Cawgnito.png", 133], // Cawgnito
    [9512, "https://palworld.wiki.gg/images/Boltmane.png", 54], // Boltmane
    [9513, "https://palworld.wiki.gg/images/Ribbuny.png", 133], // Ribbuny
    [9514, "https://palworld.wiki.gg/images/Cinnamoth.png", 10], // Cinnamoth
    [9515, "https://palworld.wiki.gg/images/Swee.png", 87], // Swee
    [9516, "https://palworld.wiki.gg/images/Cremis.png", 133], // Cremis
    [9517, "https://palworld.wiki.gg/images/Lunaris.png", 197], // Lunaris
    [9518, "https://palworld.wiki.gg/images/Fuack Ignis.png", 25], // Fuack Ignis
    [9519, "https://palworld.wiki.gg/images/Selyne.png", 133], // Selyne
    [9520, "https://palworld.wiki.gg/images/Gorirat Terra.png", 74], // Gorirat Terra
    [9521, "https://palworld.wiki.gg/images/Croajiro.png", 1], // Croajiro
    [9522, "https://palworld.wiki.gg/images/Dogen.png", 133], // Dogen
    [9523, "https://palworld.wiki.gg/images/Helzephyr Lux.png", 104], // Helzephyr Lux
    [9524, "https://palworld.wiki.gg/images/Wixen Noct.png", 104], // Wixen Noct
    [9525, "https://palworld.wiki.gg/images/Helzephyr.png", 133], // Helzephyr
    [9526, "https://palworld.wiki.gg/images/Elizabee.png", 10], // Elizabee
    [9527, "https://palworld.wiki.gg/images/Rooby.png", 104], // Rooby
    [9528, "https://palworld.wiki.gg/images/Lullu.png", 5], // Lullu
    [9529, "https://palworld.wiki.gg/images/Felbat.png", 197], // Felbat
    [9530, "https://palworld.wiki.gg/images/Orserk.png", 133], // Orserk
    [9531, "https://palworld.wiki.gg/images/Flopie.png", 133], // Flopie
    [9532, "https://palworld.wiki.gg/images/Foxcicle.png", 87], // Foxcicle
    [9533, "https://palworld.wiki.gg/images/Arsox.png", 5], // Arsox
    [9534, "https://palworld.wiki.gg/images/Dazemu.png", 54], // Dazemu
    [9535, "https://palworld.wiki.gg/images/Suzaku Aqua.png", 133], // Suzaku Aqua
    [9536, "https://palworld.wiki.gg/images/Fuddler.png", 54], // Fuddler
    [9537, "https://palworld.wiki.gg/images/Wixen.png", 25], // Wixen
    [9538, "https://palworld.wiki.gg/images/Dragostrophe.png", 1], // Dragostrophe
    [9539, "https://palworld.wiki.gg/images/Teafant.png", 87], // Teafant
    [9540, "https://palworld.wiki.gg/images/Kikit.png", 197], // Kikit
    [9541, "https://palworld.wiki.gg/images/Lovander.png", 147], // Lovander
    [9542, "https://palworld.wiki.gg/images/Gorirat.png", 25], // Gorirat
    [9543, "https://palworld.wiki.gg/images/Reindrix.png", 197], // Reindrix
    [9544, "https://palworld.wiki.gg/images/Kelpsea.png", 54], // Kelpsea
    [9545, "https://palworld.wiki.gg/images/Shroomer.png", 133], // Shroomer
    [9546, "https://palworld.wiki.gg/images/Kitsun.png", 5], // Kitsun
    [9547, "https://palworld.wiki.gg/images/Mozzarina.png", 133], // Mozzarina
    [9548, "https://palworld.wiki.gg/images/Mimog.png", 1], // Mimog
    [9549, "https://palworld.wiki.gg/images/Prixter.png", 197], // Prixter
    [9550, "https://palworld.wiki.gg/images/Tocotoco.png", 1], // Tocotoco
    [9551, "https://palworld.wiki.gg/images/Xenovader.png", 1], // Xenovader
    [9552, "https://palworld.wiki.gg/images/Xenogard.png", 1], // Xenogard
    /* Honkai: Nexus Anima — ảnh 1024px nền trong suốt từ hna.wiki */
    [9553, "https://cdn.hna.wiki/Puddlipup_Anima_Portrait.png", 1],
    [9554, "https://cdn.hna.wiki/Taileep_Anima_Portrait.png", 1],
    [9555, "https://cdn.hna.wiki/Batnyss_Anima_Portrait.png", 1],
    [9556, "https://cdn.hna.wiki/Bunmareen_Anima_Portrait.png", 1],
    [9557, "https://cdn.hna.wiki/Inkifoal_Anima_Portrait.png", 1],
    [9558, "https://cdn.hna.wiki/Cumulon_Anima_Portrait.png", 1],
    [9559, "https://cdn.hna.wiki/Apollinis_Anima_Portrait.png", 1],
    [9560, "https://cdn.hna.wiki/Felinoxie_Anima_Portrait.png", 1],
    [9561, "https://cdn.hna.wiki/Lumeridon_Anima_Portrait.png", 1],
    [9562, "https://cdn.hna.wiki/Inkicorn_Anima_Portrait.png", 1],
    [9563, "https://cdn.hna.wiki/Heartcease_Anima_Portrait.png", 1],
    [9564, "https://cdn.hna.wiki/Dragamour_Anima_Portrait.png", 1],
    [9565, "https://cdn.hna.wiki/Corvariatio_Anima_Portrait.png", 1],
    [9566, "https://cdn.hna.wiki/Vulberry_Anima_Portrait.png", 1],
    [9567, "https://cdn.hna.wiki/Noctumbra_Anima_Portrait.png", 1],
    [9568, "https://cdn.hna.wiki/Scorscythe_Anima_Portrait.png", 1],
    [9569, "https://cdn.hna.wiki/Mushgloomini_Anima_Portrait.png", 1],
    [9570, "https://cdn.hna.wiki/Faeflux_Anima_Portrait.png", 1],
    [9571, "https://cdn.hna.wiki/Lepinamel_Anima_Portrait.png", 1],
    [9572, "https://cdn.hna.wiki/Donubi_Anima_Portrait.png", 1],
    [9573, "https://cdn.hna.wiki/Olivesper_Anima_Portrait.png", 1],
    [9574, "https://cdn.hna.wiki/Squarel_Anima_Portrait.png", 1],
    [9575, "https://cdn.hna.wiki/Furrari_Anima_Portrait.png", 1],
    [9576, "https://cdn.hna.wiki/Magisdrake_Anima_Portrait.png", 1],
    [9577, "https://cdn.hna.wiki/Nomnom_Anima_Portrait.png", 1],
    [9578, "https://cdn.hna.wiki/Pupanoo_Anima_Portrait.png", 1],
    [9579, "https://cdn.hna.wiki/Bobabirb_Anima_Portrait.png", 1],
    [9580, "https://cdn.hna.wiki/Eggnok_Anima_Portrait.png", 1],
    [9581, "https://cdn.hna.wiki/Rosfurcate_Anima_Portrait.png", 1],
    [9582, "https://cdn.hna.wiki/Glampa_Anima_Portrait.png", 1],
    /* Nexus Anima đợt 2 (9613-9642) */
    [9613, "https://cdn.hna.wiki/Chowpownd_Anima_Portrait.png", 1],
    [9614, "https://cdn.hna.wiki/Damasque_Anima_Portrait.png", 1],
    [9615, "https://cdn.hna.wiki/Cublade_Anima_Portrait.png", 1],
    [9616, "https://cdn.hna.wiki/Marshalbird_Anima_Portrait.png", 1],
    [9617, "https://cdn.hna.wiki/Plumelune_Anima_Portrait.png", 1],
    [9618, "https://cdn.hna.wiki/Mimoo_Anima_Portrait.png", 1],
    [9619, "https://cdn.hna.wiki/Rimechime_Anima_Portrait.png", 1],
    [9620, "https://cdn.hna.wiki/Vixemourne_Anima_Portrait.png", 1],
    [9621, "https://cdn.hna.wiki/Bladehound_Anima_Portrait.png", 1],
    [9622, "https://cdn.hna.wiki/Eggluvs_Anima_Portrait.png", 1],
    [9623, "https://cdn.hna.wiki/Chimaura_Anima_Portrait.png", 1],
    [9624, "https://cdn.hna.wiki/Donnatallow_Anima_Portrait.png", 1],
    [9625, "https://cdn.hna.wiki/Frigull_Anima_Portrait.png", 1],
    [9626, "https://cdn.hna.wiki/Starspine_Anima_Portrait.png", 1],
    [9627, "https://cdn.hna.wiki/Camcorgi_Anima_Portrait.png", 1],
    [9628, "https://cdn.hna.wiki/Kaffiend_Anima_Portrait.png", 1],
    [9629, "https://cdn.hna.wiki/Foalhardy_Anima_Portrait.png", 1],
    [9630, "https://cdn.hna.wiki/Octopourri_Anima_Portrait.png", 1],
    [9631, "https://cdn.hna.wiki/Hoppelon_Anima_Portrait.png", 1],
    [9632, "https://cdn.hna.wiki/Cinechel_Anima_Portrait.png", 1],
    [9633, "https://cdn.hna.wiki/Catnapir_Anima_Portrait.png", 1],
    [9634, "https://cdn.hna.wiki/Framamba_Anima_Portrait.png", 1],
    [9635, "https://cdn.hna.wiki/Chocllamour_Anima_Portrait.png", 1],
    [9636, "https://cdn.hna.wiki/Capybunner_Anima_Portrait.png", 1],
    [9637, "https://cdn.hna.wiki/Waxula_Anima_Portrait.png", 1],
    [9638, "https://cdn.hna.wiki/Pomparrot_Anima_Portrait.png", 1],
    [9639, "https://cdn.hna.wiki/Hamburgoof_Anima_Portrait.png", 1],
    [9640, "https://cdn.hna.wiki/Magisaki_Anima_Portrait.png", 1],
    [9641, "https://cdn.hna.wiki/Beaubeanie_Anima_Portrait.png", 1],
    [9642, "https://cdn.hna.wiki/Lumehart_Anima_Portrait.png", 1],
    /* Nexus Anima đợt 3 (9643-9662) */
    [9643, "https://cdn.hna.wiki/Hugglebeary_Anima_Portrait.png", 1],
    [9644, "https://cdn.hna.wiki/Baggle_Anima_Portrait.png", 1],
    [9645, "https://cdn.hna.wiki/Umpurrella_Anima_Portrait.png", 1],
    [9646, "https://cdn.hna.wiki/Sharkalaka_Anima_Portrait.png", 1],
    [9647, "https://cdn.hna.wiki/Ugglewing_Anima_Portrait.png", 1],
    [9648, "https://cdn.hna.wiki/Goldfogey_Anima_Portrait.png", 1],
    [9649, "https://cdn.hna.wiki/Mariminnow_Anima_Portrait.png", 1],
    [9650, "https://cdn.hna.wiki/Muscimmon_Anima_Portrait.png", 1],
    [9651, "https://cdn.hna.wiki/Sunspottie_Anima_Portrait.png", 1],
    [9652, "https://cdn.hna.wiki/Pumpkimp_Anima_Portrait.png", 1],
    [9653, "https://cdn.hna.wiki/Jerboranj_Anima_Portrait.png", 1],
    [9654, "https://cdn.hna.wiki/Sootsie_Anima_Portrait.png", 1],
    [9655, "https://cdn.hna.wiki/Broomba_Anima_Portrait.png", 1],
    [9656, "https://cdn.hna.wiki/Famishade_Anima_Portrait.png", 1],
    [9657, "https://cdn.hna.wiki/Hoggit_Anima_Portrait.png", 1],
    [9658, "https://cdn.hna.wiki/Fyrklor_Anima_Portrait.png", 1],
    [9659, "https://cdn.hna.wiki/Seroplumanth_Anima_Portrait.png", 1],
    [9660, "https://cdn.hna.wiki/Mesmerith_Anima_Portrait.png", 1],
    [9661, "https://cdn.hna.wiki/Atragasus_Anima_Portrait.png", 1],
    [9662, "https://cdn.hna.wiki/Shampoco_Anima_Portrait.png", 1],
    /* Nexus Anima đợt 4 (9713-9716) — 4 portrait mới từ hna.wiki */
    [9713, "https://cdn.hna.wiki/Moneytree_Anima_Portrait.png", 1],
    [9714, "https://cdn.hna.wiki/Mr._Avocado_Anima_Portrait.png", 1],
    [9715, "https://cdn.hna.wiki/C%27locked_Anima_Portrait.png", 1],
    [9716, "https://cdn.hna.wiki/Derpydile_Anima_Portrait.png", 1],
    [9911, "https://cdn.hna.wiki/Bunmareen_Anima_Portrait_%280.3.0%29.png", 1],
    [9912, "https://cdn.hna.wiki/Camcorgi_Anima_Portrait_%280.3.0%29.png", 1],
    [9913, "https://cdn.hna.wiki/Damasque_Anima_Portrait_%280.3.0%29.png", 1],
    [9914, "https://cdn.hna.wiki/Donubi_Anima_Portrait_%280.3.0%29.png", 1],
    [9915, "https://cdn.hna.wiki/Faeflux_Anima_Portrait_%280.3.0%29.png", 1],
    [9916, "https://cdn.hna.wiki/Hoppelon_Anima_Portrait_%280.3.0%29.png", 1],
    [9917, "https://cdn.hna.wiki/Hugglebeary_Anima_Portrait_%280.3.0%29.png", 1],
    [9918, "https://cdn.hna.wiki/Inkicorn_Anima_Portrait_%280.3.0%29.png", 1],
    [9919, "https://cdn.hna.wiki/Inkifoal_Anima_Portrait_%280.3.0%29.png", 1],
    [9920, "https://cdn.hna.wiki/Lumehart_Anima_Portrait_%280.3.0%29.png", 1],
    [9921, "https://cdn.hna.wiki/Lumeridon_Anima_Portrait_%280.3.0%29.png", 1],
    [9922, "https://cdn.hna.wiki/Mesmerith_Anima_Portrait_%280.3.0%29.png", 1],
    [9923, "https://cdn.hna.wiki/Mushgloomini_Anima_Portrait_%280.3.0%29.png", 1],
    [9924, "https://cdn.hna.wiki/Nomnom_Anima_Portrait_%280.3.0%29.png", 1],
    [9925, "https://cdn.hna.wiki/Pomparrot_Anima_Portrait_%280.3.0%29.png", 1],
    [9926, "https://cdn.hna.wiki/Pupanoo_Anima_Portrait_%280.3.0%29.png", 1],
    [9927, "https://cdn.hna.wiki/Vixemourne_Anima_Portrait_%280.3.0%29.png", 1],
  ].forEach(function (row) {
    FAN_SPRITE_URLS[row[0]] = {
      normal: 'images/crossovers/' + row[0] + '.png',
      remote: row[1],
      fallback: apiSpriteUrl(row[2])
    };
  });

  /* Pokémon điện ảnh bổ sung (9393-9422, trừ 9416/9417/9418/9420/9421 đã bỏ trùng ảnh):
     artwork PokéAPI đã được tải về, xóa nền trắng và căn khung y hệt
     images/crossovers/, nên dùng chung cách xử lý với franchise khác. */
  [
    [9393, 10043, 150], [9394, 10044, 150], [9395, 10007, 487], [9396, 10077, 382],
    [9397, 10078, 383], [9398, 10079, 384], [9399, 10062, 380], [9400, 10063, 381],
    [9401, 10059, 448], [9402, 10050, 257], [9403, 10041, 130], [9404, 10045, 181],
    [9405, 10060, 460], [9406, 10088, 428], [9407, 10090, 15], [9408, 10073, 18],
    [9409, 10094, 25], [9410, 10095, 25], [9411, 10096, 25], [9412, 10097, 25],
    [9413, 10098, 25], [9414, 10099, 25], [9415, 10148, 25], [9419, 331, 331],
    [9422, 10120, 718]
  ].forEach(function (row) {
    FAN_SPRITE_URLS[row[0]] = {
      normal: 'images/movies/' + row[0] + '.png',
      remote: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + row[1] + '.png',
      fallback: apiSpriteUrl(row[2])
    };
  });

  function fanSpriteOverride(species, shiny) {
    if (!species) return null;
    const ov = FAN_SPRITE_URLS[Number(species.dex)];
    if (!ov) return null;
    return (shiny && ov.shiny) || ov.normal || null;
  }

  function spriteIdFor(species) {
    if (!species) return '';
    const dex = Number(species.dex);
    // artDex (dạng điện ảnh) được ưu tiên: Mega/form có artwork riêng trên PokéAPI.
    return species.artDex || FAN_SPRITE_IDS[dex] || species.dex || species.id || '';
  }

  function spriteUrl(species, shiny) {
    if (!species) return '';
    const override = fanSpriteOverride(species, shiny);
    if (override) return override;
    const id = spriteIdFor(species);
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' +
      (shiny ? 'shiny/' : '') + id + '.png';
  }
  function spriteFallback(species) {
    if (!species) return '';
    const override = FAN_SPRITE_URLS[Number(species.dex)];
    if (override) return override.fallback || override.normal || '';
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + spriteIdFor(species) + '.png';
  }

  function typeChip(type, small) {
    const t = PG.TYPES[type] || PG.TYPES.normal;
    return '<span class="type-chip' + (small ? ' type-chip--sm' : '') + '" style="--tc:' + t.color + ';--td:' + t.dark + '">' +
      '<span class="type-chip__icon">' + t.icon + '</span>' + t.name + '</span>';
  }

  function barHtml(value, max, cls) {
    const w = clamp((value / max) * 100, 0, 100);
    return '<div class="bar ' + (cls || '') + '"><span style="width:' + w + '%"></span></div>';
  }

  function parseQuery() {
    const q = new URLSearchParams(location.search);
    const o = {};
    q.forEach((v, k) => o[k] = v);
    return o;
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function relTime(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return s + ' giây';
    const m = Math.floor(s / 60);
    if (m < 60) return m + ' phút';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' giờ ' + (m % 60) + ' phút';
    return Math.floor(h / 24) + ' ngày';
  }

  PG.clamp = clamp;
  PG.rand = rand;
  PG.randInt = randInt;
  PG.pick = pick;
  PG.chance = chance;
  PG.shuffle = shuffle;
  PG.weightedPick = weightedPick;
  PG.uid = uid;
  PG.pad = pad;
  PG.fmt = fmt;
  PG.fmtKm = fmtKm;
  PG.pct = pct;
  PG.todayKey = todayKey;
  PG.weekKey = weekKey;
  PG.isNight = isNight;
  PG.timeOfDay = timeOfDay;
  PG.timeLabel = timeLabel;
  PG.wait = wait;
  PG.esc = esc;
  PG.deepClone = deepClone;
  PG.sum = sum;
  PG.mulberry32 = mulberry32;
  PG.store = store;
  PG.familyOf = familyOf;
  PG.spriteUrl = spriteUrl;
  PG.spriteFallback = spriteFallback;
  PG.spriteIdFor = spriteIdFor;
  PG.FAN_SPRITE_IDS = FAN_SPRITE_IDS;
  PG.FAN_SPRITE_URLS = FAN_SPRITE_URLS;
  PG.fanSpriteOverride = fanSpriteOverride;
  PG.typeChip = typeChip;
  PG.barHtml = barHtml;
  PG.parseQuery = parseQuery;
  PG.formatDate = formatDate;
  PG.relTime = relTime;
})();
