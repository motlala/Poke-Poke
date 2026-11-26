/* ============================================================
   KIỂM THỬ DỮ LIỆU & CÔNG THỨC — gõ PG.runTests() trong Console
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;

  function runTests() {
    const results = [];
    function check(name, fn) {
      try {
        const detail = fn();
        if (detail === false) results.push({ name, pass: false, detail: 'Trả về false' });
        else results.push({ name, pass: true, detail: typeof detail === 'string' ? detail : '' });
      } catch (err) {
        results.push({ name, pass: false, detail: err.message });
      }
    }

    /** Chạy kiểm tra có ghi state rồi khôi phục lại đúng save hiện tại. */
    function withTempSave(fn) {
      const snap = PG.exportSave();
      try {
        return fn();
      } finally {
        const back = PG.importSave(snap);
        if (!back.ok) throw new Error('Không khôi phục được save sau kiểm tra: ' + back.msg);
      }
    }

    /* ---------- HỆ ---------- */
    check('Có đủ 22 hệ', () => {
      if (PG.TYPE_ORDER.length !== 22) throw new Error('TYPE_ORDER = ' + PG.TYPE_ORDER.length);
      const missing = PG.TYPE_ORDER.filter(t => !PG.TYPES[t]);
      if (missing.length) throw new Error('Thiếu: ' + missing.join(', '));
      return PG.TYPE_ORDER.length + ' hệ';
    });

    check('Bảng hệ cơ bản đúng', () => {
      const cases = [
        ['fire', ['grass'], 2], ['water', ['fire'], 2], ['electric', ['ground'], 0],
        ['normal', ['ghost'], 0], ['ghost', ['normal'], 0], ['dragon', ['fairy'], 0]
      ];
      for (const [atk, def, exp] of cases) {
        const got = PG.getMultiplier(atk, def);
        if (got !== exp) throw new Error(atk + ' → ' + def + ': ' + got + ' (mong đợi ' + exp + ')');
      }
      return '6 trường hợp chuẩn';
    });

    check('Thiên / Vô Hệ / Lượng Tử', () => {
      if (PG.getMultiplier('neutral', ['fire']) !== 1) throw new Error('Vô Hệ tấn công phải x1');
      if (PG.getMultiplier('fire', ['neutral']) !== 1) throw new Error('Vô Hệ phòng thủ phải x1');
      if (PG.getMultiplier('celestial', ['water']) !== 2) throw new Error('Thiên tấn công phải x2');
      if (PG.getMultiplier('celestial', ['neutral']) !== 1) throw new Error('Thiên đánh Vô Hệ phải x1');
      if (PG.getMultiplier('celestial', ['celestial']) !== 1) throw new Error('Thiên đánh Thiên phải x1');
      if (PG.getMultiplier('celestial', ['quantum']) !== 2) throw new Error('Thiên đánh Lượng Tử phải x2');
      if (PG.getMultiplier('quantum', ['fire']) !== 1) throw new Error('Lượng Tử tấn công phải x1');
      if (PG.getMultiplier('fire', ['quantum']) !== 1) throw new Error('Lượng Tử phòng thủ phải x1');
      if (PG.getMultiplier('glitch', ['fire']) !== 1) throw new Error('Lỗi tấn công phải x1');
      if (PG.getMultiplier('fire', ['glitch']) !== 1) throw new Error('Lỗi phòng thủ phải x1');
      return 'Đúng cấu hình';
    });

    /* ---------- LOÀI ---------- */
    check('Có ít nhất 60 loài', () => {
      if (PG.DEX_ORDER.length < 60) throw new Error('Chỉ có ' + PG.DEX_ORDER.length);
      return PG.DEX_ORDER.length + ' loài';
    });

    check('Mỗi hệ có đủ loài (Lỗi tối thiểu 2, Lượng Tử 0)', () => {
      const bad = [];
      for (const t of PG.TYPE_ORDER) {
        const n = PG.speciesByType(t).length;
        if (t === 'quantum') { if (n !== 0) bad.push('Lượng Tử phải 0, đang ' + n); continue; }
        if (n < (t === 'glitch' ? 2 : 3)) bad.push(t + ': ' + n);
      }
      if (bad.length) throw new Error(bad.join('; '));
      return 'Đá: ' + PG.speciesByType('rock').length + ' loài';
    });

    check('Đá có tối thiểu 6 loài', () => {
      const n = PG.speciesByType('rock').length;
      if (n < 6) throw new Error('Chỉ có ' + n);
      return n + ' loài hệ Đá';
    });

    check('Vô Hệ / Thiên / Lỗi chỉ đơn hệ', () => {
      const bad = PG.DEX_ORDER.filter(id => {
        const t = PG.SPECIES[id].types;
        return t.some(x => PG.TYPE_SPECIAL[x] && PG.TYPE_SPECIAL[x].singleTypeOnly) && t.length > 1;
      });
      if (bad.length) throw new Error(bad.join(', '));
      return 'Không có loài ghép hệ đặc biệt';
    });

    check('Dữ liệu loài hợp lệ', () => {
      const errs = PG.validateSpecies();
      if (errs.length) throw new Error(errs.slice(0, 5).join(' | '));
      return PG.DEX_ORDER.length + ' loài hợp lệ';
    });

    check('Chuỗi tiến hóa hợp lệ', () => {
      const errs = [];
      for (const id of PG.DEX_ORDER) {
        const sp = PG.SPECIES[id];
        if (!sp.evo) continue;
        const branches = Array.isArray(sp.evo[0]) ? sp.evo : [sp.evo];
        for (const e of branches) {
          if (!PG.SPECIES[e[0]]) errs.push(id + ' → ' + e[0]);
          if (!Number.isFinite(e[1]) || e[1] < 0) errs.push(id + ': kẹo không hợp lệ');
        }
      }
      if (errs.length) throw new Error(errs.slice(0, 6).join(', '));
      return 'Tất cả nhánh tiến hóa tồn tại';
    });

    check('Vùng sống hợp lệ', () => {
      const bad = [];
      for (const id of PG.DEX_ORDER) {
        for (const h of PG.SPECIES[id].habitats) if (!PG.REGIONS[h]) bad.push(id + ':' + h);
      }
      if (bad.length) throw new Error(bad.slice(0, 6).join(', '));
      return 'Tất cả vùng sống tồn tại';
    });

    check('Đặc tính & chỉ số đầy đủ', () => {
      for (const id of PG.DEX_ORDER) {
        const sp = PG.SPECIES[id];
        if (!sp.abilities || sp.abilities.length < 2 || !sp.hiddenAbility) throw new Error(id + ' thiếu đặc tính');
        if (!sp.catchRate && sp.catchRate !== 0) throw new Error(id + ' thiếu catchRate');
        if (!(sp.base && sp.base.length === 6)) throw new Error(id + ' thiếu base stats');
      }
      return 'Đủ 3 đặc tính / loài';
    });

    check('DEX_ORDER đúng thứ tự', () => {
      for (let i = 1; i < PG.DEX_ORDER.length; i++) {
        if (PG.SPECIES[PG.DEX_ORDER[i]].dex < PG.SPECIES[PG.DEX_ORDER[i - 1]].dex) return 'Sai thứ tự tại ' + PG.DEX_ORDER[i];
      }
      return 'Đã sắp xếp';
    });

    /* ---------- CHIÊU THỨC ---------- */
    check('Chiêu thức hợp lệ', () => {
      for (const [id, mv] of Object.entries(PG.MOVES)) {
        if (!PG.TYPES[mv.type]) throw new Error(id + ' sai hệ ' + mv.type);
        if (!['physical', 'special', 'status'].includes(mv.category)) throw new Error(id + ' sai nhóm ' + mv.category);
        if (mv.power !== undefined && (mv.power < 0 || mv.power > 300)) throw new Error(id + ' power bất thường');
      }
      return Object.keys(PG.MOVES).length + ' chiêu';
    });

    check('Mỗi loài có chiêu thức', () => {
      for (const id of PG.DEX_ORDER) {
        const list = PG.movesForTypes(PG.SPECIES[id].types, 50);
        if (!list.length) throw new Error(id + ' không có chiêu');
        for (const m of list) if (!PG.MOVES[m.id]) throw new Error(id + ' thiếu chiêu ' + m.id);
      }
      return 'Tất cả loài đều có chiêu';
    });

    check('TM trỏ tới chiêu tồn tại', () => {
      for (const [id, tm] of Object.entries(PG.TMS)) {
        if (!PG.MOVES[tm.move]) throw new Error(id + ' → ' + tm.move);
      }
      return Object.keys(PG.TMS).length + ' TM';
    });

    /* ---------- TẠO POKÉMON ---------- */
    check('createPokemon hoạt động', () => {
      for (const id of ['bulbasaur', 'charmander', 'pikachu', 'mew', 'magikarp']) {
        const p = PG.createPokemon(id, 20, { minIV: 5 });
        if (p.speciesId !== id) throw new Error('Sai loài');
        if (!p.moves.length || p.moves.length > 4) throw new Error(id + ' số chiêu ' + p.moves.length);
        if (p.hp <= 0) throw new Error(id + ' HP <= 0');
        for (const k of PG.STAT_KEYS) {
          if (p.ivs[k] < 0 || p.ivs[k] > 31) throw new Error(id + ' IV ' + k + ' = ' + p.ivs[k]);
        }
        const stats = PG.getStats(p);
        if (stats.hp <= 0) throw new Error(id + ' stats.hp <= 0');
      }
      return '5 loài mẫu';
    });

    check('CP và phẩm chất hợp lệ', () => {
      const p = PG.createPokemon('garchomp', 50, { perfectIV: true });
      const cp = PG.cpOf(p);
      if (!(cp > 0)) throw new Error('CP = ' + cp);
      if (PG.ivTotal(p) !== 186) throw new Error('IV tổng = ' + PG.ivTotal(p));
      if (PG.qualityOf(p).stars !== 4) throw new Error('Phẩm chất hoàn hảo phải 4 sao');
      return 'CP ' + cp + ' • IV 186';
    });

    /* ---------- CÔNG THỨC CHIẾN ĐẤU ---------- */
    function combatant(types) {
      return {
        name: 'Test', level: 50, speciesId: types.includes('grass') ? 'venusaur' : 'charizard',
        types: types, stats: { hp: 200, atk: 120, def: 100, spa: 120, spd: 100, spe: 100 },
        stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 },
        hp: 200, maxHp: 200, mutations: [], status: null, ability: null, heldItem: null
      };
    }

    check('Công thức sát thương chạy', () => {
      const atk = combatant(['fire']);
      const def = combatant(['grass']);
      const move = PG.MOVES.ember;
      const res = PG.Formulas.attack(atk, def, move, { noRandom: true, weather: 'clear' });
      if (res.damage <= 0) throw new Error('Sát thương = ' + res.damage);
      if (res.effectiveness !== 2) throw new Error('Hệ số = ' + res.effectiveness);
      return 'Ember vào Cỏ: ' + res.damage + ' sát thương (x2)';
    });

    check('Chí mạng nhân sát thương', () => {
      const atk = combatant(['fire']);
      const def = combatant(['water']);
      const move = PG.MOVES.ember;
      const normal = PG.Formulas.attack(atk, def, move, { noRandom: true, forceCrit: false, weather: 'clear' });
      const crit = PG.Formulas.attack(atk, def, move, { noRandom: true, forceCrit: true, weather: 'clear' });
      if (crit.damage <= normal.damage) throw new Error(normal.damage + ' → ' + crit.damage);
      return normal.damage + ' → ' + crit.damage;
    });

    check('Thiên Khắc nhân đôi / x3', () => {
      const atk = combatant(['fire']);
      atk.luck = 0;
      const def = combatant(['celestial']);
      const res2 = PG.Formulas.attack(atk, def, PG.MOVES.ember, { noRandom: true, forceFracture: true, forceX3: false });
      if (!res2.fracture || res2.effectiveness !== 2) throw new Error('Thiên Khắc x2 lỗi: ' + res2.effectiveness);
      const res3 = PG.Formulas.attack(atk, def, PG.MOVES.ember, { noRandom: true, forceFracture: true, forceX3: true });
      if (!res3.fractureX3 || res3.effectiveness !== 3) throw new Error('Thiên Khắc x3 lỗi: ' + res3.effectiveness);
      return 'x2 và x3 đúng';
    });

    check('Vô Hệ miễn nhiễm Thiên Khắc', () => {
      const atk = combatant(['fire']);
      const def = combatant(['neutral']);
      const res = PG.Formulas.attack(atk, def, PG.MOVES.ember, { noRandom: true, forceFracture: true });
      if (res.fracture) throw new Error('Vô Hệ không được kích hoạt Thiên Khắc');
      if (res.effectiveness !== 1) throw new Error('Hệ số = ' + res.effectiveness);
      return 'Đúng: x1, không nứt';
    });

    /* ---------- BẮT / BÓNG ---------- */
    check('Tỉ lệ bắt nằm trong biên', () => {
      const state = PG.defaultState();
      const p = PG.createPokemon('bulbasaur', 10);
      p.hp = Math.floor(PG.getStats(p).hp / 2);
      const enc = { pokemon: p, regionId: 'forest', isNight: false, throws: 0 };
      const c = PG.catchChance(enc, 'pokeball', 'nice', 'razz', state);
      if (!(c >= 0.05 && c <= 0.98)) throw new Error('Tỉ lệ = ' + c);
      return Math.round(c * 100) + '%';
    });

    check('Đánh càng thấp máu, tỉ lệ bắt tăng rõ rệt', () => {
      const state = PG.defaultState();
      const p = PG.createPokemon('bulbasaur', 20);
      const maxHp = PG.getStats(p).hp;
      const enc = { pokemon: p, regionId: 'forest', isNight: false, throws: 0 };
      const chanceAt = pct => {
        p.hp = Math.max(1, Math.round(maxHp * pct));
        return PG.catchChance(enc, 'pokeball', 'hit', null, state);
      };
      const full = chanceAt(1);
      const oneHit = chanceAt(0.9);
      const half = chanceAt(0.5);
      const low = chanceAt(0.04);
      if (!(oneHit > full * 1.04)) throw new Error('Một phát đầu chưa tăng tỉ lệ: ' + full + ' → ' + oneHit);
      if (!(half > oneHit * 1.4)) throw new Error('HP giữa chưa khác biệt: ' + oneHit + ' → ' + half);
      if (!(low > half * 1.4 && low / full >= 2.2)) throw new Error('HP thấp chưa tăng mạnh: ' + full + ' → ' + low);
      return Math.round(full * 100) + '% → ' + Math.round(half * 100) + '% → ' + Math.round(low * 100) + '%';
    });

    check('Hệ Thiên cần bóng đặc biệt', () => {
      const state = PG.defaultState();
      const p = PG.createPokemon('mew', 50);
      const enc = { pokemon: p, regionId: 'temple', isNight: false, throws: 0 };
      if (PG.catchChance(enc, 'pokeball', 'hit', null, state) !== 0) throw new Error('Poké Ball không được bắt hệ Thiên');
      const c = PG.catchChance(enc, 'ultraball', 'hit', null, state);
      if (!(c > 0)) throw new Error('Ultra Ball phải bắt được hệ Thiên');
      return 'Ultra Ball: ' + Math.round(c * 100) + '%';
    });

    check('Hệ số bóng đặc biệt', () => {
      const water = PG.SPECIES.magikarp;
      if (PG.ballMultiplier('netball', water) !== 3) throw new Error('Net Ball vs Nước phải x3');
      if (PG.ballMultiplier('quickball', water, { throws: 0 }) !== 4) throw new Error('Quick Ball lượt đầu phải x4');
      if (PG.ballMultiplier('quickball', water, { throws: 2 }) !== 1.2) throw new Error('Quick Ball lượt sau phải x1.2');
      return 'Đúng';
    });

    /* ---------- VẬT PHẨM / CHẾ TẠO ---------- */
    check('itemInfo hoạt động', () => {
      for (const id of ['pokeball', 'razz', 'potion', 'stone', 'fire-stone', 'bamboo', 'worm', 'leftovers', 'raid-pass']) {
        const info = PG.itemInfo(id);
        if (!info.name || info.kind === 'misc') throw new Error(id + ' không nhận diện được');
      }
      return 'Các loại vật phẩm chính OK';
    });

    check('Công thức chế tạo hợp lệ', () => {
      for (const [id, r] of Object.entries(PG.RECIPES)) {
        if (r.out.equipment && !PG.EQUIPMENT_BASES[r.out.equipment]) throw new Error(id + ' trang bị đích không tồn tại');
        for (const matId of Object.keys(r.mats)) {
          if (PG.itemInfo(matId).kind === 'misc' && !PG.MATERIALS[matId]) throw new Error(id + ' nguyên liệu lạ ' + matId);
        }
        for (const outId of Object.keys(r.out)) {
          if (outId !== 'equipment' && PG.itemInfo(outId).kind === 'misc') throw new Error(id + ' đầu ra lạ ' + outId);
        }
      }
      return Object.keys(PG.RECIPES).length + ' công thức';
    });

    check('Cửa hàng & trứng hợp lệ', () => {
      for (const id of PG.SHOP_BASE) if (PG.itemInfo(id).kind === 'misc') throw new Error('Shop lạ: ' + id);
      for (const [km, pool] of Object.entries(PG.EGG_POOLS)) {
        for (const id of pool) if (!PG.SPECIES[id]) throw new Error('Trứng ' + km + 'km: ' + id);
      }
      return PG.SHOP_BASE.length + ' món shop • ' + Object.keys(PG.EGG_POOLS).length + ' bể trứng';
    });

    check('Trang bị & bộ trang bị hợp lệ', () => {
      const slotIds = PG.SLOTS.map(s => s.id);
      for (const [id, base] of Object.entries(PG.EQUIPMENT_BASES)) {
        if (!slotIds.includes(base.slot)) throw new Error(id + ' sai ô ' + base.slot);
        if (!PG.RARITY[base.rarity]) throw new Error(id + ' sai độ hiếm');
        if (!PG.SETS[base.set]) throw new Error(id + ' sai bộ ' + base.set);
      }
      return Object.keys(PG.EQUIPMENT_BASES).length + ' trang bị • ' + PG.SLOTS.length + ' ô';
    });

    check('rollEquipment & tổng hợp chỉ số', () => {
      const item = PG.rollEquipment('clover-ring', { highLuck: true });
      if (!item || item.baseId !== 'clover-ring' || !item.uid) throw new Error('Roll lỗi');
      const equipped = { hat: null, shirt: null, shoes: null, gloves: null, glasses: null, backpack: null, accessory: item };
      const agg = PG.aggregateEquipment(equipped);
      if (!(agg.totals.luck > 0)) throw new Error('Luck = ' + agg.totals.luck);
      if (!agg.items.length) throw new Error('Không gom được trang bị');
      return 'Luck ' + agg.totals.luck;
    });

    check('Nâng cấp hiến tế: tối đa +15, lên/tụt theo giá trị tế phẩm', () => {
      const chance0 = PG.chance;
      try {
        return withTempSave(() => {
          if (PG.EQUIPMENT_MAX_PLUS !== 15) throw new Error('Trần nâng cấp không phải +15');
          const st = PG.getState();
          const target = PG.rollEquipment('clover-ring', { plus: 0 });
          const cheap = PG.rollEquipment('explorer-hat', { plus: 0 });
          const pricey = PG.rollEquipment('clover-ring', { plus: 6 });
          st.equipment.inventory = [target, cheap, pricey];
          if (!(PG.sacrificeChance(target, pricey) > PG.sacrificeChance(target, cheap))) {
            throw new Error('Tế phẩm giá trị cao không tăng tỉ lệ lên cấp');
          }
          if (PG.sacrificeChance(target, cheap) >= 1) throw new Error('Tỉ lệ lên cấp không có giới hạn');

          PG.chance = () => true;
          const up = PG.sacrificeUpgrade(target.uid, cheap.uid);
          if (!up.ok || !up.success || target.plus !== 1) throw new Error('Hiến tế lên cấp sai: ' + (up.msg || ''));
          if (st.equipment.inventory.some(i => i.uid === cheap.uid)) throw new Error('Không tiêu hóa tế phẩm');

          PG.chance = () => false;
          const down = PG.sacrificeUpgrade(target.uid, pricey.uid);
          if (!down.ok || down.success || target.plus !== 0) throw new Error('Hiến tế thất bại không tụt cấp');
          if (st.equipment.inventory.some(i => i.uid === pricey.uid)) throw new Error('Tế phẩm thất bại vẫn còn trong kho');
          if (PG.sacrificeUpgrade(target.uid, target.uid).ok) throw new Error('Cho hiến tế chính nó');

          target.plus = PG.EQUIPMENT_MAX_PLUS;
          if (PG.sacrificeUpgrade(target.uid, pricey.uid).ok) throw new Error('Vượt quá +15');
          if (!(PG.upgradeFailChance(15) > PG.upgradeFailChance(6))) throw new Error('Tỉ lệ hỏng không tăng theo cấp');
          const before = target.plus;
          const noOffering = PG.sacrificeUpgrade(target.uid, 'not-exist');
          if (noOffering.ok || target.plus !== before) throw new Error('Lỗi hiến tế vẫn làm đổi cấp');
          return '+' + PG.EQUIPMENT_MAX_PLUS + ' • ' + Math.round(PG.sacrificeChance(PG.rollEquipment('clover-ring'), cheap) * 100) + '% → ' +
            Math.round(PG.sacrificeChance(PG.rollEquipment('clover-ring'), pricey) * 100) + '%';
        });
      } finally {
        PG.chance = chance0;
      }
    });

    /* ---------- VẬT PHẨM CẦM TAY / EXP / HỒI PHỤC ---------- */
    check('Danh mục shop mới hợp lệ', () => {
      let n = 0;
      for (const cat of ['essentials', 'held', 'exp', 'heal']) {
        const ids = PG.CATALOG && PG.CATALOG[cat];
        if (!ids || !ids.length) throw new Error('Thiếu danh mục ' + cat);
        for (const id of ids) {
          if (PG.itemInfo(id).kind === 'misc') throw new Error(cat + ' lạ: ' + id);
          n++;
        }
      }
      if (!PG.EXP_ITEMS['exp-max'] || PG.EXP_ITEMS['exp-max'].amount <= 0) throw new Error('Exp cực đại lỗi');
      return n + ' mặt hàng cố định';
    });

    check('Hộp quà bí ẩn: 3 gói giá, chu kỳ 15 phút, may mắn lời / xui lỗ', () => {
      const boxes = PG.GIFT_BOXES || [];
      if (boxes.length !== 3) throw new Error('Không đủ 3 gói quà');
      const prices = boxes.map(b => b.price);
      if (!(prices[0] < prices[1] && prices[1] < prices[2])) throw new Error('Giá gói không tăng dần');
      for (const b of boxes) {
        if (!PG.giftBoxDef(b.id) || PG.giftBoxDef(b.tier) !== b) throw new Error('Thiếu định nghĩa ' + b.id);
      }
      withTempSave(() => {
        const s = PG.getState();
        PG.addCoins(200000);
        if (!PG.GIFTBOX_MS || PG.GIFTBOX_MS !== 15 * 60 * 1000) throw new Error('Chu kỳ hộp quà sai');
        PG.ensureGiftBoxShop(true);
        const shop = s.giftBoxShop;
        if (!shop || typeof shop.cycleKey !== 'number' || !Array.isArray(shop.stock)) throw new Error('State hộp quà sai');
        const snapshot = JSON.stringify(shop.stock);
        shop.cycleKey = -1;
        PG.ensureGiftBoxShop(true);
        if (JSON.stringify(s.giftBoxShop.stock) !== snapshot) throw new Error('Cùng chu kỳ mà stock đổi');
        const entry = s.giftBoxShop.stock.find(x => !x.sold);
        if (!entry) throw new Error('Chu kỳ này không có hộp để test');
        const coinsBefore = s.player.coins;
        const original = Math.random;
        let good, bad;
        try {
          Math.random = () => 0.01;
          entry.sold = false;
          good = PG.buyGiftBox(entry.uid);
          Math.random = () => 0.4;
          let other = s.giftBoxShop.stock.find(x => !x.sold);
          if (!other) {
            s.giftBoxShop.cycleKey = -1;
            PG.ensureGiftBoxShop(true);
            other = s.giftBoxShop.stock.find(x => !x.sold);
          }
          if (!other) throw new Error('Không có hộp thứ 2 để test');
          bad = PG.buyGiftBox(other.uid);
        } finally { Math.random = original; }
        if (!good.ok || !bad.ok) throw new Error('Mở hộp thất bại: ' + (good.msg || '') + ' ' + (bad.msg || ''));
        if (good.deal !== 'good' || bad.deal !== 'bad') throw new Error('Phân loại may/xui sai: ' + good.deal + '/' + bad.deal);
        if (!(good.value > good.price)) throw new Error('Hộp may mắn không lời');
        if (!(bad.value < bad.price)) throw new Error('Hộp xui không lỗ');
        if (s.player.coins >= coinsBefore) throw new Error('Không trừ Xu khi mua hộp');
        if (PG.buyGiftBox(entry.uid).ok) throw new Error('Cho mua lại hộp đã mở');
      });
      return '3 gói ' + prices.map(PG.fmt).join('/') + ' Xu • 15 phút • may lời / xui lỗ';
    });

    check('Vật phẩm cầm tay đổi chác & độ bền', () => {
      const p = PG.createPokemon('bulbasaur', 20, { perfectIV: true });
      // So sánh trực tiếp có/không có đồ để không phụ thuộc chỉ số HLV ngẫu nhiên.
      p.heldItem = null; p.heldDur = null;
      const plain = PG.battleStats(p);
      p.heldItem = 'power-band'; p.heldDur = 90;
      const live = PG.battleStats(p);
      if (live.atk !== plain.atk + 5 || live.def !== plain.def - 2) {
        throw new Error('ATK/DEF không đúng: ' + live.atk + '/' + live.def +
          ' (cần ' + (plain.atk + 5) + '/' + (plain.def - 2) + ')');
      }
      p.heldDur = 0;
      if (PG.heldEffects(p)) throw new Error('Đồ hỏng vẫn còn tác dụng');
      const broken = PG.battleStats(p);
      if (broken.atk !== plain.atk || broken.def !== plain.def) throw new Error('Đồ hỏng vẫn cộng chỉ số');
      return 'ATK +5 / DEF -2, hỏng thì mất hiệu lực';
    });

    check('Exp lên cấp vô hạn & cộng chỉ số ngẫu nhiên', () => {
      const p = PG.createPokemon('bulbasaur', 100, { perfectIV: true });
      p.xp = 0;
      const sum = x => Object.values(x || {}).reduce((a, b) => a + b, 0);
      const before = sum(p.bonusStats);
      const levels = PG.addPokemonXp(p, 500000, { cap: Infinity });
      if (p.level <= 100) throw new Error('Vẫn bị chặn ở cấp 100');
      if (levels < 1 || sum(p.bonusStats) - before < levels) throw new Error('Không cộng đủ chỉ số ngẫu nhiên');
      return 'Lv.100 → ' + p.level + ' • +' + levels + ' chỉ số';
    });

    check('Vật phẩm cộng sát thương theo Bỏng / Độc', () => {
      const base = combatant(['normal']);
      const foe = combatant(['normal']);
      const normal = PG.Formulas.attack(base, foe, PG.MOVES.tackle, { noRandom: true, weather: 'clear' });
      base.heldItem = 'burn-claw'; base.heldDur = 70;
      foe.status = 'burn';
      const boosted = PG.Formulas.attack(base, foe, PG.MOVES.tackle, { noRandom: true, weather: 'clear' });
      if (!(boosted.damage > normal.damage)) throw new Error(normal.damage + ' → ' + boosted.damage);
      return normal.damage + ' → ' + boosted.damage + ' sát thương';
    });

    check('API đánh yếu & hồi HP tự nhiên tồn tại', () => {
      if (typeof PG.Battle.startWild !== 'function' || typeof PG.Battle.finishWild !== 'function') throw new Error('Thiếu startWild/finishWild');
      if (typeof PG.tickHeal !== 'function') throw new Error('Thiếu tickHeal');
      if (typeof PG.useExpItem !== 'function' || typeof PG.repairHeldItem !== 'function') throw new Error('Thiếu API vật phẩm');
      return 'Đầy đủ';
    });

    /* ---------- LOÀI MỚI / QUẦY HLV / NPC ---------- */
    check('Loài mới, thần thoại & dạng tiến hóa mở rộng', () => {
      if (PG.DEX_ORDER.length < 300) throw new Error('Chỉ có ' + PG.DEX_ORDER.length + ' loài');
      if (!PG.MYTHICALS || PG.MYTHICALS.length < 5) throw new Error('Thiếu loài thần thoại');
      if (!PG.SPECIES['mega-charizard-x'] || !PG.SPECIES['gokuchu'] || !PG.SPECIES['omega-pika']) throw new Error('Thiếu loài mới');
      const cz = PG.SPECIES.charizard;
      if (!Array.isArray(cz.evo) || !Array.isArray(cz.evo[0])) throw new Error('Charizard chưa có nhánh tiến hóa');
      if (!cz.evo.some(e => e[0] === 'mega-charizard-x')) throw new Error('Thiếu nhánh Mega Charizard X');
      if (!PG.STONES['mega-stone-x'] || !PG.STONES['giganta-core']) throw new Error('Thiếu đá tiến hóa mới');
      return PG.DEX_ORDER.length + ' loài • ' + PG.MYTHICALS.length + ' thần thoại';
    });

    check('Quầy HLV: 5 món ngẫu nhiên, reset 30 phút, đồ đã mua giữ lại', () => {
      if (PG.TRAINER_SHOP_MS !== 1800000 || PG.TRAINER_SHOP_SIZE !== 5) throw new Error('Chu kỳ/số món quầy HLV sai');
      if (typeof PG.buyTrainerItem !== 'function' || typeof PG.ensureTrainerShop !== 'function') throw new Error('Thiếu API quầy HLV');
      return withTempSave(() => {
        PG.ensureTrainerShop(true);
        const shop = PG.getState().trainerShop;
        if (!shop.stock || shop.stock.length !== 5) throw new Error('Quầy HLV phải có đúng 5 món');
        if (shop.cycleKey !== Math.floor(Date.now() / PG.TRAINER_SHOP_MS)) throw new Error('Chu kỳ quầy HLV sai');
        if (!(shop.nextAt > Date.now())) throw new Error('Thiếu thời điểm làm mới quầy HLV');
        const idsBefore = shop.stock.map(x => x.itemId).join(',');
        const pricesBefore = shop.stock.map(x => x.price).join(',');
        PG.ensureTrainerShop(true);
        const same = PG.getState().trainerShop;
        if (same.stock.map(x => x.itemId).join(',') !== idsBefore ||
            same.stock.map(x => x.price).join(',') !== pricesBefore) {
          throw new Error('Cùng chu kỳ mà quầy HLV lại đổi món/giá');
        }
        PG.addCoins(200000);
        const buy = PG.buyTrainerItem(same.stock[0].uid);
        if (!buy.ok) throw new Error('Mua vật phẩm HLV thất bại: ' + buy.msg);
        const owned = PG.getState().player.trainerItems.length;
        // Ép sang chu kỳ mới: món cũ phải biến mất khỏi quầy nhưng vẫn gắn trên HLV.
        PG.getState().trainerShop.cycleKey = -1;
        PG.ensureTrainerShop(true);
        const next = PG.getState().trainerShop;
        if (next.cycleKey === -1 || next.stock.length !== 5) throw new Error('Quầy HLV không reset sau 30 phút');
        if (PG.getState().player.trainerItems.length !== owned) throw new Error('Mất vật phẩm HLV đã mua sau khi reset');
        const item = PG.rollTrainerItem('power-glove');
        if (!item || !item.stats.atk) throw new Error('Roll vật phẩm HLV lỗi');
        const agg = PG.aggregateTrainerItems([item]);
        if (!(agg.totals.atk > 0)) throw new Error('Không cộng ATK');
        if (!(PG.trainerShopPrice('infinity-charm') > 0)) throw new Error('Giá quầy HLV sai');
        return 'ATK +' + agg.totals.atk + ' • 5 món / 30 phút • giữ ' + owned + ' món đã mua';
      });
    });

    check('Thêm công thức chế tạo cần thiết', () => {
      const n = Object.keys(PG.RECIPES).length;
      if (n < 90) throw new Error('Số công thức chưa đủ (' + n + ')');
      for (const must of ['maxpotion', 'fullrestore', 'exp-max', 'sun-stone', 'mega-stone-x', 'shiny-charm']) {
        const r = PG.RECIPES[must];
        if (!r) throw new Error('Thiếu công thức ' + must);
        for (const id of Object.keys(r.out)) {
          if (id === 'equipment') continue;
          if (PG.itemInfo(id).kind === 'misc') throw new Error('Công thức ' + must + ' trả vật phẩm không tồn tại');
        }
      }
      return n + ' công thức';
    });

    check('NPC bán Pokémon làm mới 20 phút', () => {
      if (PG.NPC_SHOP_MS !== 1200000) throw new Error('Chu kỳ NPC sai');
      if (typeof PG.buyNpcPokemon !== 'function' || typeof PG.ensureNpcShop !== 'function') throw new Error('Thiếu API quầy NPC');
      const cheap = PG.npcPokemonPrice('npc0', 'rattata', 10);
      const pricey = PG.npcPokemonPrice('npc1', 'rattata', 10);
      if (cheap <= 0 || pricey <= 0 || cheap === pricey) throw new Error('Giá NPC không chênh lệch');
      return 'Rattata ' + cheap + ' / ' + pricey + ' Xu';
    });

    check('Chợ gộp NPC + người chơi', () => {
      if (typeof PG.getMarketListings !== 'function') throw new Error('Thiếu PG.getMarketListings');
      if (typeof PG.processMarket !== 'function') throw new Error('Thiếu PG.processMarket');
      const rows = PG.getMarketListings();
      if (!Array.isArray(rows)) throw new Error('Danh sách chợ sai định dạng');
      if (!rows.every(r => r.source === 'npc' || r.source === 'player')) throw new Error('Nguồn chợ không hợp lệ');
      const ids = new Set(rows.map(r => r.uid));
      if (ids.size !== rows.length) throw new Error('UID chợ bị trùng');
      return rows.length + ' tin chợ (NPC + người chơi)';
    });

    check('Cấp HLV không kẹt ở 50, chỉ số nền HLV = 0', () => {
      const fake = {
        player: { level: 50, xp: PG.playerXpNeeded(50) * 2, trainerItems: [] },
        equipment: { equipped: {} },
        events: { active: null }
      };
      const gained = PG.addPlayerXp(fake, 0);
      if (fake.player.level <= 50 || gained < 1) throw new Error('Vẫn chặn cấp 50');
      const base = PG.trainerBonuses(fake).totals;
      if (base.hp !== 0 || base.atk !== 0 || base.def !== 0 || base.luck !== 0) {
        throw new Error('Chỉ số nền HLV chưa về 0');
      }
      fake.player.trainerItems = [PG.rollTrainerItem('power-glove')];
      const geared = PG.trainerBonuses(fake).totals;
      if (!(geared.atk > 0)) throw new Error('Mua đồ HLV không cộng chỉ số');
      return 'Lv.50 → ' + fake.player.level + ' • nền 0 • ATK +' + geared.atk;
    });

    check('Fanmade có ảnh thật, không rơi về icon', () => {
      const map = PG.FAN_SPRITE_IDS || {};
      if (Object.keys(map).length < 170) throw new Error('Chỉ ánh xạ ' + Object.keys(map).length + ' loài');
      for (const dex of [9001, 9040, 8801, 8812, 9101, 9122]) {
        const sp = PG.DEX_ORDER.map(id => PG.SPECIES[id]).find(x => x.dex === dex);
        if (!sp) throw new Error('Thiếu loài ' + dex);
        const sid = PG.spriteIdFor(sp);
        if (!sid || Number(sid) === dex) throw new Error('Loài ' + dex + ' chưa có ảnh riêng');
        if (!/^\d+$/.test(String(sid))) throw new Error('Sprite id lạ: ' + sid);
      }
      if (PG.spriteUrl({ dex: 9001 }).includes('/9001.png')) throw new Error('Vẫn dùng dex fan cho URL ảnh');
      return Object.keys(map).length + ' loài có artwork thật';
    });

    check('Pokémon phim + crossover có ảnh riêng', () => {
      const movies = PG.DEX_ORDER.filter(id => {
        const d = PG.SPECIES[id].dex;
        return (d >= 9201 && d <= 9250) || (d >= 9393 && d <= 9422);
      });
      const crosses = PG.DEX_ORDER.filter(id => {
        const d = PG.SPECIES[id].dex;
        return ((d >= 9251 && d <= 9392) || (d >= 9423 && d <= 9662) || (d >= 9713 && d <= 9716) || (d >= 9911 && d <= 9927));
      });
      if (movies.length !== 75) throw new Error('Chỉ có ' + movies.length + '/75 loài điện ảnh');
      if (crosses.length !== 373) throw new Error('Chỉ có ' + crosses.length + '/373 loài crossover');
      const dexSet = new Set(PG.DEX_ORDER.map(id => PG.SPECIES[id].dex));
      if (dexSet.size !== PG.DEX_ORDER.length) throw new Error('Trùng dex');
      for (const id of movies.concat(crosses)) {
        const sp = PG.SPECIES[id];
        const url = PG.spriteUrl(sp);
        if (!url) throw new Error('Ảnh sai: ' + id);
        if (sp.dex >= 9251) {
          const prefix = (sp.dex >= 9393 && sp.dex <= 9422) ? 'images/movies/' : 'images/crossovers/';
          if (!url.startsWith(prefix)) throw new Error('Ảnh local sai: ' + id + ' → ' + url);
        }
      }
      for (const id of crosses) {
        const ov = PG.fanSpriteOverride(PG.SPECIES[id]);
        if (!ov || !/^images\/crossovers\/\d+\.png$/.test(ov)) throw new Error('Thiếu ảnh gốc: ' + id);
      }
      for (const d of [9251, 9332, 9333, 9362, 9363, 9392, 9423, 9452, 9453, 9502, 9503, 9552, 9553, 9582, 9613, 9642, 9662, 9713, 9716, 9911, 9927]) {
        const sp = PG.DEX_ORDER.map(id => PG.SPECIES[id]).find(x => x.dex === d);
        if (!sp || !/^images\/crossovers\/\d+\.png$/.test(PG.spriteUrl(sp))) throw new Error('Thiếu ảnh franchise: ' + d);
      }
      return movies.length + ' phim • ' + crosses.length + ' crossover • ' + Object.keys(PG.FAN_SPRITE_URLS).length + ' ảnh gốc • ' + PG.DEX_ORDER.length + ' tổng';
    });

    check('316 loài crossover/điện ảnh mới: dex/id/ảnh không trùng', () => {
      const ranges = [[9333, 9362], [9363, 9392], [9393, 9422], [9423, 9452], [9453, 9502], [9503, 9552], [9553, 9582], [9613, 9642], [9643, 9662], [9713, 9716], [9911, 9927]];
      const seenDex = new Set(), seenId = new Set(), seenName = new Set();
      let count = 0;
      for (const [from, to] of ranges) {
        for (let d = from; d <= to; d++) {
          const sp = PG.DEX_ORDER.map(id => PG.SPECIES[id]).find(x => x.dex === d);
          if (!sp) continue; // 9416/9417/9418/9420/9421 đã gộp vào loài chính thức cùng artwork
          if (seenDex.has(d) || seenId.has(sp.id) || seenName.has(sp.name)) throw new Error('Trùng loài ' + d + ':' + sp.id);
          seenDex.add(d); seenId.add(sp.id); seenName.add(sp.name);
          const url = PG.spriteUrl(sp);
          if (!url || !url.startsWith('images/')) throw new Error('Thiếu ảnh local ' + d);
          count++;
        }
      }
      if (count !== 316) throw new Error('Chỉ có ' + count + '/316 loài');
      for (const d of [9393, 9401, 9422]) {
        const sp = PG.DEX_ORDER.map(id => PG.SPECIES[id]).find(x => x.dex === d);
        if (!sp.artDex || PG.spriteUrl(sp) !== 'images/movies/' + d + '.png') throw new Error('artDex/ảnh sai: ' + d);
      }
      return count + ' loài • artwork local riêng, nền trong suốt';
    });

    check('50 Pokémon chính thức mới (9733-9782): id/ảnh/tên không trùng', () => {
      const byDex = {};
      for (const id of PG.DEX_ORDER) byDex[PG.SPECIES[id].dex] = PG.SPECIES[id];
      const ids = new Set(), names = new Set();
      for (let d = 9733; d <= 9782; d++) {
        const sp = byDex[d];
        if (!sp || !sp.artDex || !sp.id.startsWith('sp50c-')) throw new Error('Thiếu Pokémon chính thức ' + d);
        if (ids.has(sp.id) || names.has(sp.name)) throw new Error('Trùng loài chính thức mới: ' + d + ':' + sp.name);
        ids.add(sp.id); names.add(sp.name);
        if (!PG.spriteUrl(sp).includes('/official-artwork/' + sp.artDex + '.png')) throw new Error('Ảnh PokéAPI sai: ' + d);
        if (PG.dexGroupOf(sp) !== 'official') throw new Error('Nhóm dex sai: ' + sp.id);
        for (const h of sp.habitats) if (!PG.REGIONS[h]) throw new Error('Vùng sống sai: ' + sp.id + ':' + h);
      }
      if (Object.keys(PG.SPECIES).some(id => id.indexOf('cross-ygo-') === 0)) throw new Error('Vẫn còn lá Yu-Gi-Oh! trong dữ liệu');
      return '50 loài • artwork thật PokéAPI • nhóm Chính thức';
    });

    check('Loài trùng artwork đã gộp về bản gốc', () => {
      const map = PG.REMOVED_SPECIES || {};
      const ids = Object.keys(map);
      if (ids.length !== 5) throw new Error('Số loài gộp không đúng: ' + ids.length);
      for (const old of ids) {
        if (PG.SPECIES[old]) throw new Error('Vẫn còn loài trùng ' + old);
        if (!PG.SPECIES[map[old]]) throw new Error('Loài gốc không tồn tại: ' + map[old]);
      }
      return ids.length + ' loài phim trùng ảnh → loài chính thức';
    });

    check('Giải đấu chuyên biệt: 3 bảng, 1 lượt/ngày, quà reset', () => {
      // Cố định RNG để kiểm tra này không làm lệch chuỗi ngẫu nhiên của các test sau.
      const random0 = Math.random;
      Math.random = () => 0.5;
      try {
        return withTempSave(() => {
        if (!PG.Tournament || typeof PG.Tournament.startRun !== 'function') throw new Error('Thiếu PG.Tournament');
        if (typeof PG.Battle.startTournament !== 'function') throw new Error('Thiếu Battle.startTournament');
        const T = PG.Tournament;
        const tiers = T.TIERS || [];
        if (tiers.length !== 3) throw new Error('Không đủ 3 bảng giải');
        const specs = [];
        for (let i = 0; i < tiers.length; i++) {
          const t = tiers[i];
          if (!(t.fee > 0)) throw new Error(t.name + ' phí sai');
          if (!t.rounds || t.rounds.length < 3) throw new Error(t.name + ' ít vòng');
          for (const r of t.rounds) if (!r.reward || !r.reward.coins) throw new Error(t.name + ' thiếu thưởng ' + r.name);
          if (!(t.champion && t.champion.coins > t.fee * 2)) throw new Error(t.name + ' thưởng vô địch quá nhỏ');
          if (i > 0) {
            const prev = tiers[i - 1];
            if (!(t.fee > prev.fee)) throw new Error(t.name + ' phí không tăng dần');
            if (!(t.minAvgLevel > prev.minAvgLevel)) throw new Error(t.name + ' yêu cầu cấp không tăng');
            if (!(t.minBestCp > prev.minBestCp)) throw new Error(t.name + ' yêu cầu CP không tăng');
            if (!(t.champion.coins > prev.champion.coins)) throw new Error(t.name + ' thưởng không tăng');
          }
          for (const r of t.rounds) if (r.reward.equipment) specs.push(r.reward.equipment);
          if (t.champion.equipment) specs.push(t.champion.equipment);
        }
        if (typeof PG.grantEquipment !== 'function') throw new Error('Thiếu PG.grantEquipment');
        for (const s of specs) {
          const base = PG.EQUIPMENT_BASES[s.baseId];
          if (!base || !PG.SLOTS.some(sl => sl.id === base.slot)) throw new Error('Trang bị thưởng sai: ' + s.baseId);
        }

        const run = T.freshRun();
        if (run.status !== 'idle' || run.wins !== 0 || run.opponents.length) throw new Error('Run khởi tạo sai');
        if (!run.daily || run.daily.ran) throw new Error('Lượt ngày khởi tạo sai');

        const s = PG.getState();
        s.player.coins = 200000;
        s.player.level = 80;
        s.badges = PG.REGION_ORDER.slice(0, 3);
        const p = PG.createPokemon('mewtwo', 90, { minIV: 31, perfectIV: true });
        s.pokemon.push(p);
        s.team = [p.uid];
        p.hp = PG.getStats(p).hp;

        const started = T.startRun('master');
        if (!started.ok) throw new Error('Không đăng ký được bảng cao: ' + started.msg);
        if (started.run.tierId !== 'master' || started.run.feePaid !== tiers[2].fee) throw new Error('Phí/tier giải sai');
        if (T.canEnter('rookie').ok) throw new Error('Cho đấu giải thứ 2 trong ngày');
        if (!T.currentOpponent() || !T.currentOpponent().team.length) throw new Error('Đối thủ giải rỗng');

        // Sang ngày mới: quà và lượt đấu được đặt lại.
        s.tournament.daily.date = '2000-01-01';
        if (!T.canEnter('rookie').ok) throw new Error('Lượt ngày mới không mở lại');
        T.ensureDaily();
        if (s.tournament.daily.ran || s.tournament.daily.claimed) throw new Error('Quà/lượt ngày không reset');

        return tiers.length + ' bảng • phí ' + tiers.map(t => PG.fmt(t.fee)).join('/') +
          ' Xu • CK ' + PG.fmt(tiers[2].champion.coins) + ' Xu • ' + specs.length + ' món trang bị';
        });
      } finally {
        Math.random = random0;
      }
    });

    check('Elo giải đấu: thắng cộng, thua trừ, Elo cao đối thủ mạnh hơn', () => {
      const T = PG.Tournament;
      if (!T || typeof T.eloOf !== 'function') throw new Error('Thiếu API Elo');
      let detail = '';
      withTempSave(() => {
        T.setElo(1000);
        if (T.eloOf() !== 1000) throw new Error('Elo khởi tạo sai');
        const win = T.eloDelta(true, 'rookie', 0);
        const lose = T.eloDelta(false, 'rookie', 0);
        if (!(win > 0 && lose < 0)) throw new Error('Chiều Elo sai: ' + win + '/' + lose);
        T.setElo(1000 + win);
        if (T.eloOf() !== 1000 + win) throw new Error('setElo không lưu');
        T.setElo(1000);
        const lowBoost = T.eloBoost();
        T.setElo(2400);
        const highBoost = T.eloBoost();
        if (!(highBoost.levels > lowBoost.levels || highBoost.iv > lowBoost.iv)) {
          throw new Error('Elo cao không tăng sức đối thủ');
        }
        if (!(highBoost.hpMult > 1 && highBoost.hpMult <= 1.15)) throw new Error('HP multiplier sai');
        const rank = T.eloRank(2400);
        if (!rank || !rank.name) throw new Error('Thiếu xếp hạng Elo');
        detail = 'Thắng +' + win + ' / thua ' + lose + ' • Elo 2400: +' + highBoost.levels +
          ' cấp, IV +' + highBoost.iv + ', HP ×' + highBoost.hpMult.toFixed(2);
      });
      return detail;
    });

    /* ---------- VÙNG / CÂU CÁ ---------- */
    check('21 vùng đất hợp lệ', () => {
      if (PG.REGION_ORDER.length !== 21) throw new Error('Có ' + PG.REGION_ORDER.length + ' vùng');
      for (const id of PG.REGION_ORDER) {
        const r = PG.REGIONS[id];
        if (!r) throw new Error('Thiếu ' + id);
        for (const [sid] of r.trainer.team) if (!PG.SPECIES[sid]) throw new Error(id + ' trainer: ' + sid);
        for (const [sid] of r.gym.team) if (!PG.SPECIES[sid]) throw new Error(id + ' gym: ' + sid);
        if (r.raid && !PG.SPECIES[r.raid.boss]) throw new Error(id + ' raid boss: ' + r.raid.boss);
        if (!PG.speciesByHabitat(id).length) throw new Error(id + ' không có Pokémon hoang dã');
      }
      return PG.REGION_ORDER.length + ' vùng • trainer/gym/raid OK';
    });

    check('6 vùng điện ảnh Kanto hợp lệ', () => {
      const ids = ['pallet', 'viridian', 'cerulean', 'vermilion', 'celadon', 'indigo'];
      let wild = 0;
      for (const id of ids) {
        const r = PG.REGIONS[id];
        if (!r || !PG.REGION_ORDER.includes(id)) throw new Error('Thiếu vùng ' + id);
        if (!r.weatherPool || !r.weatherPool.length) throw new Error(id + ' thiếu thời tiết');
        if (!r.drops || !r.drops.length) throw new Error(id + ' thiếu nguyên liệu');
        for (const pool of [r.trainer.team, r.gym.team]) {
          for (const [sid] of pool) if (!PG.SPECIES[sid]) throw new Error(id + ' đội: ' + sid);
        }
        if (!PG.SPECIES[r.raid.boss]) throw new Error(id + ' raid: ' + r.raid.boss);
        if (!PG.REGION_CLEAR_REWARDS[id]) throw new Error(id + ' thiếu thưởng dọn vùng');
        if (!PG.REGION_MARKETS[id]) throw new Error(id + ' thiếu bảng giá chợ');
        const n = PG.speciesByHabitat(id).length;
        if (!n) throw new Error(id + ' không có Pokémon hoang dã');
        wild += n;
      }
      return ids.length + ' vùng • ' + wild + ' loài hoang dã • thưởng/chợ đầy đủ';
    });

    check('Trainer thưởng bóng / tiền / đồ ngẫu nhiên', () => {
      if (typeof PG.Battle.rollTrainerLoot !== 'function') throw new Error('Thiếu rollTrainerLoot');
      let checked = 0;
      const balls = ['pokeball', 'greatball', 'ultraball', 'celestialball'];
      for (const id of PG.REGION_ORDER) {
        const r = PG.REGIONS[id];
        const rw = r.trainer.reward || {};
        if (!(rw.coins > 0) || !(rw.xp > 0)) throw new Error(id + ' trainer thưởng rỗng');
        const rolled = PG.Battle.rollTrainerLoot(rw, r);
        if (!(rolled.reward.coins > rw.coins)) throw new Error(id + ' không có tiền thưởng thêm');
        if (!Object.keys(rolled.reward.items || {}).some(k => balls.indexOf(k) >= 0)) throw new Error(id + ' thiếu bóng thưởng');
        for (const key of Object.keys(rolled.bonus || {})) {
          if (!rolled.reward.items[key] && !rolled.reward.materials[key]) throw new Error(id + ' bonus lạ: ' + key);
        }
        for (const iid of Object.keys(rolled.reward.items || {})) {
          if (PG.itemInfo(iid).kind === 'misc' && !PG.MATERIALS[iid]) throw new Error(id + ' item lạ: ' + iid);
        }
        for (const spec of [].concat(rolled.reward.equipment || [])) {
          if (!PG.EQUIPMENT_BASES[spec.baseId]) throw new Error(id + ' trang bị lạ: ' + spec.baseId);
        }
        if (rw.items && rolled.reward.items === rw.items) throw new Error(id + ' làm đổi dữ liệu gốc');
        checked++;
      }
      return checked + ' vùng • bóng/tiền đảm bảo + quà ngẫu nhiên';
    });

    check('50 Pokémon gốc bổ sung có artwork thật', () => {
      const dex = [13, 14, 124, 173, 174, 177, 178, 207, 209, 213, 216, 217, 226, 232, 233, 237, 241,
        253, 256, 259, 264, 275, 297, 306, 308, 315, 321, 324, 356, 371, 399, 400, 403, 405, 417, 427,
        490, 492, 530, 534, 553, 609, 612, 635, 663, 681, 745, 823, 887, 959];
      const byDex = {};
      for (const id of PG.DEX_ORDER) byDex[PG.SPECIES[id].dex] = PG.SPECIES[id];
      for (const d of dex) {
        const sp = byDex[d];
        if (!sp) throw new Error('Thiếu dex ' + d);
        const url = PG.spriteUrl(sp);
        if (!url || !url.includes('/' + d + '.png') || url.indexOf('images/') === 0) throw new Error('Ảnh sai dex ' + d);
      }
      if (!PG.SPECIES.manaphy.mythical || !PG.MYTHICALS.includes('manaphy')) throw new Error('Thiếu Manaphy thần thoại');
      return dex.length + ' dex thật • artwork PokéAPI';
    });

    check('Điểm câu cá hợp lệ', () => {
      const spots = PG.Fishing.allSpots();
      if (!spots.length) throw new Error('Không có điểm câu');
      for (const spot of spots) {
        if (!spot.pool.length) throw new Error(spot.id + ' pool rỗng');
        for (const id of spot.pool) if (!PG.SPECIES[id]) throw new Error(spot.id + ' có loài lạ ' + id);
        if (spot.minRod < 0 || spot.minRod > 3) throw new Error(spot.id + ' minRod lạ');
      }
      return spots.length + ' điểm câu';
    });

    check('Câu cá: đầu game dễ bắt, cá quý vùng hẹp nhưng có sàn', () => {
      const forest = PG.Fishing.spotOf('forest');
      const temple = PG.Fishing.spotOf('temple');
      if (!forest || !temple) throw new Error('Thiếu điểm câu mẫu');
      const easy = PG.Fishing.tuningFor(forest, 0, 'common', false);
      if (!easy.easyStart || easy.needed !== 3 || easy.zoneWidth < 26) {
        throw new Error('Cần tre ở vùng đầu chưa đủ dễ: ' + JSON.stringify(easy));
      }
      const rare = PG.Fishing.tuningFor(forest, 0, 'rare', false);
      const legendary = PG.Fishing.tuningFor(forest, 0, 'legendary', false);
      if (!(rare.zoneWidth < easy.zoneWidth && legendary.zoneWidth < rare.zoneWidth)) {
        throw new Error('Cá quý chưa có vùng sáng hẹp hơn');
      }
      if (legendary.zoneWidth < PG.Fishing.ZONE_MIN) throw new Error('Vùng sáng quý hẹp quá mức');
      const deep = PG.Fishing.tuningFor(temple, 0, 'common', false);
      if (deep.easyStart || deep.zoneWidth >= easy.zoneWidth || deep.speedBase <= easy.speedBase) {
        throw new Error('Vùng sâu chưa khó hơn vùng đầu');
      }
      const upgraded = PG.Fishing.tuningFor(temple, 6, 'legendary', true);
      if (upgraded.zoneWidth <= legendary.zoneWidth) throw new Error('Nâng cần không cải thiện vùng sáng');
      return 'Đầu game ' + easy.zoneWidth + '% / ' + easy.needed + ' nhịp • quý ' +
        legendary.zoneWidth + '% (sàn ' + PG.Fishing.ZONE_MIN + '%) • sâu ' + deep.zoneWidth + '%';
    });

    check('Thả câu: có pha chờ thật, không hiện cá cắn rồi tắt ngay', () => withTempSave(() => {
      const st = PG.getState();
      st.player.stamina = 100;
      st.bag.worm = 5; // mồi là điều kiện bắt buộc
      const cast = PG.Fishing.cast('forest');
      if (!cast.ok || !cast.session) throw new Error(cast.msg || 'Không thả câu được');
      const s = cast.session;
      if (s.phase !== 'waiting' || !(s.biteAt > s.castAt)) throw new Error('Cá cắn ngay khi thả câu');
      const early = PG.Fishing.poll(s, s.castAt + 1);
      if (early.phase !== 'waiting') throw new Error('Pha chờ bị bỏ qua');
      const bite = PG.Fishing.poll(s, s.biteAt + 1);
      if (bite.phase !== 'bite') throw new Error('Đến giờ cá vẫn không cắn');
      if (PG.Fishing.poll(s, s.biteAt + s.biteWindow + 50).phase !== 'done') {
        throw new Error('Quá hạn cá cắn không kết thúc');
      }
      return 'chờ ' + s.waitMs + 'ms rồi cá cắn • ' + s.biteWindow + 'ms để giật';
    }));

    check('Câu cá: vùng sáng trôi liên tục, không đứng yên tại giữa', () => withTempSave(() => {
      if (typeof PG.Fishing.zoneCenterAt !== 'function') throw new Error('Thiếu zoneCenterAt');
      const st = PG.getState();
      st.player.stamina = 100;
      st.bag.worm = 5; // mồi là điều kiện bắt buộc
      const cast = PG.Fishing.cast('forest');
      if (!cast.ok || !cast.session) throw new Error(cast.msg || 'Không thả câu được');
      const s = cast.session;
      const at0 = PG.Fishing.zoneCenterAt(s, s.castAt);
      const at1 = PG.Fishing.zoneCenterAt(s, s.castAt + 1500);
      const at2 = PG.Fishing.zoneCenterAt(s, s.castAt + 3000);
      if (Math.abs(at1 - at0) < 0.5 || Math.abs(at2 - at1) < 0.5) {
        throw new Error('Vùng sáng không đổi theo thời gian');
      }
      const half = s.reel.zoneWidth / 2;
      for (const v of [at0, at1, at2]) {
        if (v < half || v > 100 - half) throw new Error('Vùng sáng trôi ra ngoài thanh');
      }
      PG.Fishing.poll(s, s.biteAt + 1);
      if (!PG.Fishing.strike(s, s.biteAt + 1).ok) throw new Error('Không giật được cần');
      const p0 = PG.Fishing.poll(s, s.biteAt + 500);
      const p1 = PG.Fishing.poll(s, s.biteAt + 1800);
      if (p0.phase !== 'reeling' || typeof p0.zoneCenter !== 'number') {
        throw new Error('Poll pha kéo không trả tâm vùng sáng');
      }
      if (Math.abs(p1.zoneCenter - p0.zoneCenter) < 0.5) throw new Error('UI không thấy vùng sáng trôi');
      return 'tâm vùng ' + at0.toFixed(1) + '% → ' + at1.toFixed(1) + '% → ' + at2.toFixed(1) + '%';
    }));

    check('Câu cá bắt buộc phải có mồi, không có thì không thả câu được', () => withTempSave(() => {
      const st = PG.getState();
      st.player.stamina = 100;
      st.fishing.activeBait = null;
      st.bag = {};
      const blocked = PG.Fishing.cast('forest');
      if (blocked.ok) throw new Error('Không có mồi mà vẫn câu được');
      if (!/mồi/.test(blocked.msg || '')) throw new Error('Thiếu thông báo cần mồi');
      st.bag.worm = 1;
      const ok = PG.Fishing.cast('forest');
      if (!ok.ok || !ok.session) throw new Error(ok.msg || 'Có mồi mà vẫn không câu được');
      if ((st.bag.worm || 0) !== 0 && !st.fishing.activeBait) throw new Error('Mồi không được tiêu hao');
      return 'Chặn khi hết mồi • tự dùng mồi khi có trong túi';
    }));

    check('Bản đồ chọn vùng: đủ 21 điểm, đường nối hợp lệ', () => {
      if (!PG.REGION_MAP_ROUTES || !PG.REGION_MAP_ROUTES.length) throw new Error('Thiếu đường nối bản đồ');
      if (typeof PG.regionMapPoint !== 'function') throw new Error('Thiếu tọa độ bản đồ');
      const missing = PG.REGION_ORDER.filter(id => !PG.regionMapPoint(id));
      if (missing.length) throw new Error('Vùng không có điểm: ' + missing.join(', '));
      for (const pair of PG.REGION_MAP_ROUTES) {
        if (pair.length !== 2 || !PG.regionMapPoint(pair[0]) || !PG.regionMapPoint(pair[1])) {
          throw new Error('Đường nối sai: ' + pair.join('-'));
        }
      }
      const p = PG.regionMapPoint('forest');
      if (!(p.left > 0 && p.left < 100 && p.top > 0 && p.top < 100)) throw new Error('Tọa độ ngoài bản đồ');
      if (PG.ui && PG.ui.views && PG.ui.views.home) {
        const html = PG.ui.views.home();
        const styled = html.match(/style="left:[\d.]+%;top:[\d.]+%"[^>]*data-act="map-region-pick"/g) || [];
        if (styled.length !== PG.REGION_ORDER.length) {
          throw new Error('HTML bản đồ thiếu tọa độ dọc: ' + styled.length + '/' + PG.REGION_ORDER.length);
        }
      }
      return PG.REGION_ORDER.length + ' điểm • ' + PG.REGION_MAP_ROUTES.length + ' đường';
    });

    check('Pokédex tải dần 100 loài, bấm Xem thêm mới hiện tiếp', () => {
      if (!PG.ui || !PG.ui.views || !PG.ui.views.dex) throw new Error('Thiếu màn Pokédex');
      const oldFilters = PG.ui.flow.dexFilters;
      const oldLimit = PG.ui.flow.dexLimit;
      PG.ui.flow.dexFilters = Object.assign({}, oldFilters || {});
      PG.ui.flow.dexLimit = 100;
      const first = PG.ui.views.dex();
      const firstCards = (first.match(/<button class="dex-card/g) || []).length;
      if (firstCards !== 100) throw new Error('Lần đầu phải hiện 100, có ' + firstCards);
      if (!/data-act="dex-load-more"/.test(first)) throw new Error('Thiếu nút Xem thêm');
      PG.ui.flow.dexLimit = 200;
      const second = PG.ui.views.dex();
      const secondCards = (second.match(/<button class="dex-card/g) || []).length;
      if (secondCards !== 200) throw new Error('Sau Xem thêm phải hiện 200, có ' + secondCards);
      if (typeof PG.ui.actions['dex-load-more'] !== 'function') throw new Error('Thiếu action dex-load-more');
      PG.ui.flow.dexLimit = oldLimit;
      PG.ui.flow.dexFilters = oldFilters;
      return '100 → 200 • có nút Xem thêm';
    });

    check('Pokémon xuất hiện theo thời tiết (sunny/rain/snow/sandstorm/fog)', () => {
      const map = PG.WEATHER_SPAWNS;
      if (!map) throw new Error('Thiếu bảng loài theo thời tiết');
      for (const w of ['clear', 'sunny', 'rain', 'snow', 'sandstorm', 'fog']) {
        if (!Array.isArray(map[w]) || !map[w].length) throw new Error('Thiếu nhóm ' + w);
      }
      if (!PG.weatherSpeciesOf('squirtle', 'rain')) throw new Error('Squirtle phải theo mưa');
      if (PG.weatherSpeciesOf('squirtle', 'snow')) throw new Error('Squirtle không phải theo tuyết');
      if (!/Squirtle/.test(PG.weatherSpawnHint('rain') || '')) throw new Error('Thiếu gợi ý thời tiết');
      return Object.keys(map).length + ' thời tiết • ' + Object.values(map).reduce((n, a) => n + a.length, 0) + ' lượt gán';
    });

    check('Túi đồ riêng: xem vật phẩm đang có và không còn dòng bản quyền', () => {
      if (!PG.ui || !PG.ui.views || !PG.ui.views.bag) throw new Error('Thiếu màn Túi đồ');
      const html = PG.ui.views.bag();
      if (!/Túi Đồ Huấn Luyện Viên/.test(html)) throw new Error('Thiếu tiêu đề túi đồ');
      if (!/<article class="bag-card"/.test(html)) throw new Error('Túi không hiện vật phẩm nào');
      if (!/data-act="bag-filter"/.test(html)) throw new Error('Thiếu bộ lọc túi đồ');
      if (typeof PG.ui.actions['bag-filter'] !== 'function') throw new Error('Thiếu action bag-filter');
      const dexHtml = PG.ui.views.dex();
      if (/dex-credit|Nintendo|Pocketpair|hna\.wiki|thương mại/.test(dexHtml)) throw new Error('Dòng bản quyền vẫn còn trong Pokédex');
      return (html.match(/<article class="bag-card"/g) || []).length + ' nhóm vật phẩm • sạch credit';
    });

    check('Pokédex: chỉ số nền riêng, chỉ số cá thể trùng Kho', () => {
      if (!PG.ui || typeof PG.ui.statRows !== 'function' ||
          typeof PG.ui.speciesStatsHtml !== 'function' || typeof PG.ui.currentStatsLine !== 'function') {
        throw new Error('Thiếu helper chỉ số dùng chung');
      }
      const sp = PG.SPECIES.bulbasaur;
      const p = PG.createPokemon('bulbasaur', 37, { minIV: 20, source: 'test' });
      p.bonusStats = { hp: 4, atk: 3, def: 0, spa: 0, spd: 0, spe: 0 };
      const stats = PG.battleStats(p);
      const baseHtml = PG.ui.speciesStatsHtml(sp);
      const dexLine = PG.ui.currentStatsLine(p);
      const boxHtml = PG.ui.statRows(p);
      if (!/base-stat/.test(baseHtml)) throw new Error('Pokédex phải hiện chỉ số nền của loài');
      for (const v of sp.base) {
        if (baseHtml.indexOf('<b>' + v + '</b>') < 0) throw new Error('Thiếu chỉ số nền ' + v + ' trong Pokédex');
      }
      for (const k of PG.STAT_KEYS) {
        if (dexLine.indexOf('>' + stats[k] + '<') < 0) throw new Error('Pokédex sai chỉ số ' + k);
        if (boxHtml.indexOf('>' + stats[k] + '<') < 0) throw new Error('Kho sai chỉ số ' + k);
      }
      // Phần cộng thêm + đồ cầm tay chỉ được gộp thành một badge +N mỗi dòng.
      const extraCount = PG.STAT_KEYS.filter(k =>
        ((p.bonusStats[k] || 0) + (PG.heldStatDelta(p)[k] || 0)) > 0).length;
      if ((boxHtml.match(/class="stat-bonus"/g) || []).length !== extraCount) {
        throw new Error('Phần cộng thêm không được gộp thành một số duy nhất');
      }
      if (/stat-bonus--held/.test(boxHtml)) throw new Error('Vẫn còn badge cộng đồ cầm tay riêng');
      return 'Nền ' + PG.sum(sp.base) + ' • cá thể ' + PG.STAT_KEYS.map(k => k + ' ' + stats[k]).join(' / ') + ' • cộng gộp 1 badge';
    });

    check('Mở chi tiết Pokémon trong Kho render đủ chỉ số (không lỗi)', () => {
      if (!PG.ui || typeof PG.ui.actions['open-pokemon'] !== 'function') {
        throw new Error('Thiếu action open-pokemon');
      }
      return withTempSave(() => {
        const st = PG.getState();
        const p = PG.createPokemon('bulbasaur', 37, { source: 'test' });
        st.pokemon.push(p);
        const realModal = PG.ui.modal;
        let captured = null;
        PG.ui.modal = function (opts) { captured = opts; };
        try {
          PG.ui.actions['open-pokemon']({ dataset: { uid: p.uid } });
        } finally {
          PG.ui.modal = realModal;
        }
        if (!captured || !captured.body) throw new Error('Không mở được modal chi tiết');
        const rows = (captured.body.match(/class="stat-row"/g) || []).length;
        if (rows !== PG.STAT_KEYS.length) throw new Error('Chi tiết Kho thiếu dòng chỉ số: ' + rows);
        if (/undefined|NaN/.test(captured.body)) throw new Error('Chi tiết Kho có giá trị lỗi');
        return 'Render ' + rows + ' dòng chỉ số trong modal chi tiết';
      });
    });

    /* ---------- HỆ THỐNG KHÁC ---------- */
    check('API lõi tồn tại', () => {
      const apis = [
        ['Battle', 'startTrainer'], ['Battle', 'startGym'], ['Battle', 'startRaid'],
        ['Battle', 'startTournament'], ['Tournament', 'startRun'], ['Tournament', 'startNextRound'],
        ['Tournament', 'ensureDaily'], ['Tournament', 'teamStrength'],
        ['Tournament', 'recordResult'], ['Tournament', 'abandon'],
        ['Fishing', 'cast'], ['Fishing', 'poll'], ['Fishing', 'strike'], ['Fishing', 'reel'],
        ['Fossil', 'startDig'], ['Fossil', 'probe'], ['Fossil', 'startRestore'], ['Fossil', 'tick'], ['Fossil', 'claim'],
        ['Formulas', 'attack'], ['Audio', 'play']
      ];
      for (const [ns, fn] of apis) {
        if (!PG[ns] || typeof PG[ns][fn] !== 'function') throw new Error(ns + '.' + fn + ' thiếu');
      }
      return apis.length + ' API';
    });

    check('Âm thanh menu / hoạt động có đủ tên', () => {
      const need = ['click', 'tap', 'page', 'tab', 'open', 'close', 'region', 'save',
        'craft', 'equip', 'trap', 'outbreak', 'throw', 'catch', 'fail', 'reward',
        'levelup', 'evolve', 'shiny', 'quest', 'coin', 'buy', 'error', 'heal'];
      const have = PG.Audio.names || [];
      const missing = need.filter(n => !have.includes(n));
      if (missing.length) throw new Error('Thiếu âm: ' + missing.join(', '));
      return need.length + ' âm • click/tab/region/save/craft/equip';
    });

    check('Trạng thái mặc định đầy đủ', () => {
      const s = PG.defaultState();
      const keys = ['player', 'pokemon', 'team', 'bag', 'materials', 'equipment', 'shop', 'trainerShop', 'npcShop', 'market', 'merchant', 'fossils', 'quests', 'pokedex', 'stats', 'settings', 'tournament', 'fishing'];
      for (const k of keys) if (k !== 'pokemon' && k !== 'team' && !(k in s)) throw new Error('Thiếu ' + k);
      if ('pvp' in s) throw new Error('Đấu trường PvP cũ vẫn còn trong state');
      if (!s.tournament.daily || !('ran' in s.tournament.daily)) throw new Error('Thiếu lượt giải ngày');
      if (!PG.STARTERS.every(id => PG.SPECIES[id])) throw new Error('Starter không hợp lệ');
      if (s.player.coins <= 0) throw new Error('Xu khởi đầu <= 0');
      return 'Đủ ' + keys.length + ' nhóm dữ liệu';
    });

    check('Quest & thành tựu hợp lệ', () => {
      for (const kind of ['daily', 'weekly']) {
        const t = PG.QUEST_TEMPLATES[kind];
        if (!t || !t.length) throw new Error('Thiếu mẫu ' + kind);
        for (const q of t) {
          if (!q.targets.length || !q.reward) throw new Error(q.id + ' thiếu dữ liệu');
          if (typeof q.text(1) !== 'string') throw new Error(q.id + ' text lỗi');
        }
      }
      if (PG.ACHIEVEMENTS.length < 8) throw new Error('Quá ít thành tựu');
      return PG.QUEST_TEMPLATES.daily.length + ' daily • ' + PG.QUEST_TEMPLATES.weekly.length + ' weekly • ' + PG.ACHIEVEMENTS.length + ' thành tựu';
    });

    check('Đột biến / kích thước / tính cách', () => {
      for (const k of PG.MUTATION_KEYS) if (!PG.MUTATIONS[k].name) throw new Error('Đột biến ' + k);
      if (!PG.SIZE_TABLE.M || !PG.SIZE_TABLE.XXL) throw new Error('Thiếu kích thước');
      if (PG.NATURE_KEYS.length !== 25) throw new Error('Có ' + PG.NATURE_KEYS.length + ' tính cách');
      return PG.MUTATION_KEYS.length + ' đột biến • 25 tính cách';
    });

    check('Cầu Vồng / Ác Quỷ: càng hiếm chỉ số càng cao và có aura', () => {
      const rb = PG.MUTATIONS.rainbow, dv = PG.MUTATIONS.devil, aura = PG.MUTATIONS['celestial-aura'];
      if (!rb || !dv || !rb.aura || !dv.aura) throw new Error('Thiếu dạng hiếm hoặc aura');
      if (!(dv.chance < rb.chance && rb.chance < aura.chance)) throw new Error('Thứ tự độ hiếm sai');
      if (!PG.ui || typeof PG.ui.auraClassOf !== 'function') throw new Error('Thiếu helper aura');
      // Cố IV/tính cách để phép so sánh chỉ số chỉ phụ thuộc vào đột biến,
      // không bị IV/tínhách ngẫu nhiên lấn át độ chênh của Cầu Vồng / Ác Quỷ.
      const fixed = { perfectIV: true, nature: 'hardy' };
      const base = PG.createPokemon('bulbasaur', 50, fixed);
      const rainbow = PG.createPokemon('bulbasaur', 50, Object.assign({ forceMutation: 'rainbow' }, fixed));
      const devil = PG.createPokemon('bulbasaur', 50, Object.assign({ forceMutation: 'devil' }, fixed));
      if (!rainbow.mutations.includes('rainbow') || !devil.mutations.includes('devil')) throw new Error('Không gắn dạng hiếm');
      if (PG.ui.auraClassOf(rainbow) !== 'aura-rainbow' || PG.ui.auraClassOf(devil) !== 'aura-devil') throw new Error('Aura sai');
      const total = p => Object.values(PG.getStats(p)).reduce((a, b) => a + b, 0);
      if (!(total(devil) > total(rainbow) && total(rainbow) > total(base))) throw new Error('Chỉ số không tăng theo độ hiếm');
      if (!(PG.cpOf(devil) > PG.cpOf(rainbow) && PG.cpOf(rainbow) > PG.cpOf(base))) throw new Error('CP không tăng theo độ hiếm');
      return 'devil ' + PG.cpOf(devil) + ' > rainbow ' + PG.cpOf(rainbow) + ' > thường ' + PG.cpOf(base);
    });

    check('Lưu / xuất dữ liệu', () => {
      if (!PG.SAVE_KEY) throw new Error('Thiếu SAVE_KEY');
      if (typeof PG.exportSave !== 'function') throw new Error('Thiếu exportSave');
      if (typeof PG.importSave !== 'function') throw new Error('Thiếu importSave');
      return 'SAVE_KEY = ' + PG.SAVE_KEY;
    });

    /* ---------- THƯƠNG HỘI / POKÉDEX / BẮT / HÓA THẠCH / SỰ KIỆN ---------- */
    check('Thương hội: lịch ghé, hàng hiếm, giá theo vùng', () => {
      if (!PG.MERCHANT_ORDER || !PG.MERCHANT_ORDER.length) throw new Error('Không có thương nhân');
      for (const id of PG.MERCHANT_ORDER) {
        const m = PG.MERCHANTS[id];
        if (!m || !m.goods || !m.goods.length || !m.trades || !m.trades.length || !m.buys || !m.buys.length) {
          throw new Error(id + ' thiếu hàng / đổi chác / danh mục thu mua');
        }
        if (!m.weekdays || !m.weekdays.length || !m.regionIds || !m.regionIds.length) throw new Error(id + ' thiếu lịch ghé');
        for (const g of m.goods) {
          if (g.kind === 'item' || g.kind === 'material') {
            if (PG.itemInfo(g.id).kind === 'misc') throw new Error(id + ' hàng lạ: ' + g.id);
          } else if (g.kind === 'equipment') {
            if (!PG.EQUIPMENT_BASES[g.baseId]) throw new Error(id + ' trang bị lạ: ' + g.baseId);
          } else if (g.kind === 'trainer') {
            if (!PG.TRAINER_ITEMS[g.itemId]) throw new Error(id + ' đồ HLV lạ: ' + g.itemId);
          } else throw new Error(id + ' kind lạ: ' + g.kind);
        }
        for (const t of m.trades) {
          if (!t.give || !t.out) throw new Error(id + ' giao dịch thiếu dữ liệu');
          for (const mid of Object.keys(t.give.materials || {})) {
            if (!PG.MATERIALS[mid]) throw new Error(id + ' đổi nguyên liệu lạ: ' + mid);
          }
        }
      }
      if (!(PG.materialSellPrice('seed', 'lake') > PG.materialSellPrice('seed', 'forest'))) {
        throw new Error('Giá bán seed không khác nhau giữa Rừng và Hồ');
      }
      if (!(PG.materialBuyPrice('seed', 'lake') > PG.materialBuyPrice('seed', 'forest'))) {
        throw new Error('Giá mua seed không khác nhau giữa Rừng và Hồ');
      }
      return PG.MERCHANT_ORDER.length + ' thương nhân • ' + PG.REGION_ORDER.length + ' bảng giá vùng';
    });

    check('Thương hội: mua hiếm, đổi nguyên liệu, thu mua theo vùng', () => {
      return withTempSave(() => {
        const st = PG.getState();
        const day = PG.todayKey();
        let region = null, merchant = null;
        for (const rid of PG.REGION_ORDER) {
          const m = PG.merchantFor(rid, day);
          if (m) { region = rid; merchant = m; break; }
        }
        if (!merchant) throw new Error('Không có thương nhân nào ghé hôm nay');
        st.events.active = null;
        st.region = region;
        st.player.level = 50;
        st.player.coins = 500000;
        st.unlockedRegions = PG.REGION_ORDER.slice();
        const key = day + ':' + region;
        const visit = PG.generateMerchantStock(key, region, merchant.id);
        Object.assign(st.merchant, {
          cycleKey: day, visitKey: key, region, merchantId: merchant.id,
          stock: visit.stock, lastVisit: visit.lastVisit, nextAt: visit.nextAt
        });

        const offers = PG.getMerchantOffers();
        if (!offers.merchant || !offers.stock.length) throw new Error('Chưa tạo được lịch ghé');
        const buy = offers.stock.find(e => e.kind === 'item' && e.id);
        if (!buy) throw new Error('Không có mặt hàng để mua');
        const bagBefore = st.bag[buy.id] || 0;
        const coinsBefore = st.player.coins;
        const bought = PG.buyMerchantOffer(buy.uid);
        if (!bought.ok || (st.bag[buy.id] || 0) !== bagBefore + 1 || st.player.coins >= coinsBefore) {
          throw new Error('Mua hàng thương hội sai: ' + (bought.msg || ''));
        }

        const trade = offers.stock.find(e => e.kind === 'trade');
        if (trade) {
          st.player.coins = 500000;
          for (const [mid, n] of Object.entries((trade.give && trade.give.materials) || {})) st.materials[mid] = n + 2;
          const traded = PG.tradeWithMerchant(trade.uid);
          if (!traded.ok) throw new Error('Đổi chác thất bại: ' + traded.msg);
        }

        const sellId = merchant.buys[0];
        st.materials[sellId] = 10;
        const unit = PG.materialSellPrice(sellId, region);
        const coins2 = st.player.coins;
        const sold = PG.sellMaterialToMerchant(sellId, 2);
        if (!sold.ok || st.player.coins !== coins2 + unit * 2) throw new Error('Thu mua nguyên liệu sai giá');
        return region + ' • ' + merchant.name + ' • ' + offers.stock.length + ' ưu đãi';
      });
    });

    check('Thương hội: đơn cần gấp trả giá cao hơn chợ', () => {
      return withTempSave(() => {
        const st = PG.getState();
        const day = PG.todayKey();
        let found = null;
        for (const rid of PG.REGION_ORDER) {
          const m = PG.merchantFor(rid, day);
          if (!m) continue;
          const key = day + ':' + rid;
          const visit = PG.generateMerchantStock(key, rid, m.id);
          const req = (visit.stock || []).find(e => e.kind === 'request');
          if (req) { found = { key, rid, m, visit, req }; break; }
        }
        if (!found) throw new Error('Không có lượt ghé nào có đơn cần gấp');
        Object.assign(st.merchant, {
          cycleKey: day, visitKey: found.key, region: found.rid, merchantId: found.m.id,
          stock: found.visit.stock, lastVisit: found.visit.lastVisit, nextAt: found.visit.nextAt
        });
        const { req } = found;
        const unit = req.price;
        const normal = PG.materialSellPrice(req.id, found.rid);
        if (!(unit > normal)) throw new Error('Đơn cần gấp không cao hơn giá bán ngoài');
        if (!(unit < PG.materialBuyPrice(req.id, found.rid) * 1.6)) throw new Error('Đơn cần gấp quá đắt');

        st.materials[req.id] = req.qty;
        const coins0 = st.player.coins;
        const res = PG.fulfillMerchantRequest(req.uid, 1);
        if (!res.ok || st.player.coins !== coins0 + unit) throw new Error('Giao đơn sai tiền: ' + (res.msg || ''));
        if ((st.materials[req.id] || 0) !== req.qty - 1) throw new Error('Không trừ nguyên liệu đã giao');
        if (req.sold !== 1) throw new Error('Không ghi nhận đơn đã giao');
        if (PG.buyMerchantOffer(req.uid).ok) throw new Error('Đơn cần gấp bị mua như hàng thường');
        return found.m.name + ' • ' + PG.MATERIALS[req.id].name + ' ' + unit + ' Xu/cái (chợ ' + normal + ')';
      });
    });

    check('Bộ lọc Pokédex dùng chung cho render và tìm kiếm', () => {
      const byDex = d => PG.DEX_ORDER.map(id => PG.SPECIES[id]).find(s => s.dex === d);
      const official = byDex(1), fanmade = byDex(8801), movie = byDex(9393), cross = byDex(9333);
      if (!official || !fanmade || !movie || !cross) throw new Error('Thiếu loài mẫu của 4 nhóm dex');
      if (PG.dexGroupOf(official) !== 'official' || PG.dexGroupOf(fanmade) !== 'fanmade' ||
          PG.dexGroupOf(movie) !== 'movie' || PG.dexGroupOf(cross) !== 'crossover') {
        throw new Error('Phân nhóm dex sai');
      }
      if (PG.dexGenOf(official) !== 'Gen 1' || PG.dexGenOf(movie) !== 'Điện ảnh') throw new Error('Thế hệ sai');
      const st = PG.getState();
      if (!PG.dexMatches(official, { q: 'BULBA' }, st)) throw new Error('Tìm kiếm không bỏ dấu / hoa thường');
      if (!PG.dexMatches(movie, { group: 'dien anh' }, st)) throw new Error('Lọc nhóm điện ảnh sai');
      if (PG.dexMatches(official, { group: 'movie' }, st)) throw new Error('Lọc nhóm lệch');
      if (PG.dexMatches(official, { type: 'fire' }, st)) throw new Error('Lọc hệ lệch');
      if (!PG.dexMatches(official, { mythical: 'no' }, st)) throw new Error('Lọc thần thoại lệch');
      return '4 nhóm • q/type/status/region/rarity/mythical/group/gen';
    });

    check('Bắt Pokémon: trượt giữ trận, vỡ bóng có tỉ lệ bỏ chạy hoặc ném lại', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.bag.pokeball = 20;
        st.player.level = 50;
        const enc = PG.spawnEncounter('forest', { speciesId: 'bulbasaur', level: 5 });
        const before = st.bag.pokeball;
        const miss = PG.attemptCatch(enc, 'pokeball', 'miss', null);
        if (!miss.ok || !miss.missed || enc.fled || st.bag.pokeball !== before) throw new Error('Ném trượt vẫn tiêu bóng hoặc kết thúc trận');

        const realChance = PG.chance;
        // Lần 1: không bắt được, không bỏ chạy → vẫn ném tiếp được.
        PG.chance = () => false;
        try {
          const failed = PG.attemptCatch(enc, 'pokeball', 'hit', null);
          if (!failed.ok || failed.caught || failed.fled || enc.fled) throw new Error('Bóng vỡ phải cho ném tiếp');
          if (!(failed.fleeChance > 0 && failed.fleeChance < 1)) throw new Error('Thiếu tỉ lệ bỏ chạy');
          if (st.bag.pokeball !== before - 1) throw new Error('Bóng vỡ không trừ đúng 1 bóng');
          if (!PG.attemptCatch(enc, 'pokeball', 'hit', null).ok) throw new Error('Không cho ném lại khi Pokémon chưa bỏ đi');
        } finally { PG.chance = realChance; }

        // Lần 2: không bắt được và bỏ chạy (chance thứ 2 trả true).
        const enc2 = PG.spawnEncounter('forest', { speciesId: 'bulbasaur', level: 5 });
        let calls = 0;
        PG.chance = () => (++calls === 1 ? false : true);
        try {
          const fled = PG.attemptCatch(enc2, 'pokeball', 'hit', null);
          if (!fled.ok || fled.caught || !fled.fled || !enc2.fled) throw new Error('Bóng vỡ chưa đánh dấu bỏ chạy');
          if (PG.attemptCatch(enc2, 'pokeball', 'hit', null).ok) throw new Error('Vẫn cho ném lại sau khi Pokémon bỏ đi');
        } finally { PG.chance = realChance; }

        if (PG.ui.actions['catch-retry']) throw new Error('Không được có nút Ném lại trong kết quả');
        if (!PG.ui.actions['catch-continue'] || !PG.ui.actions['catch-walk']) throw new Error('Kết quả chỉ có Dừng lại / Đi kiếm bắt tiếp');
        return 'miss giữ trận • vỡ bóng: flee/stay • kết quả 2 nút';
      });
    });

    check('Hóa thạch: đào 6x6, phục chế theo thời gian, nhận Pokémon', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.unlockedRegions = PG.REGION_ORDER.slice();
        st.player.level = 50;
        st.player.stamina = 100;
        st.player.coins = 100000;
        st.events.active = null;
        const dig = PG.Fossil.startDig('cave');
        if (!dig.ok || !dig.session) throw new Error('Không bắt đầu được lượt đào: ' + dig.msg);
        const session = PG.Fossil.getSession(dig.session.id);
        if (!session || session.size !== 6) throw new Error('Bản đồ đào sai');
        const probe = PG.Fossil.probe(session.id, session.target);
        if (!probe.ok || !probe.found) throw new Error('Đào trúng ô mục tiêu mà không tìm thấy hóa thạch');
        const fid = session.fossilId;
        const def = PG.FOSSILS[fid];
        if (!def || !PG.SPECIES[def.speciesId]) throw new Error('Hóa thạch trỏ loài không tồn tại');
        if ((st.fossils.inventory[fid] || 0) < 1) throw new Error('Chưa cộng hóa thạch vào kho');

        for (const [mid, n] of Object.entries(def.restoreMaterials || {})) {
          if (!PG.MATERIALS[mid]) throw new Error('Nguyên liệu phục chế lạ: ' + mid);
          st.materials[mid] = (st.materials[mid] || 0) + n;
        }
        const restore = PG.Fossil.startRestore(fid);
        if (!restore.ok || !restore.entry || !restore.entry.readyAt) throw new Error('Không đưa vào phòng phục chế: ' + restore.msg);
        if (restore.entry.boosted) throw new Error('Phục chế bị tăng tốc dù không có sự kiện');

        st.fossils.restoring[0].readyAt = Date.now() - 1;
        if (PG.Fossil.tick() < 1) throw new Error('Tick không chuyển hóa thạch sang sẵn sàng');
        const ready = st.fossils.ready[0];
        if (!ready) throw new Error('Không có hóa thạch sẵn sàng để nhận');
        const countBefore = st.pokemon.length;
        const claimed = PG.Fossil.claim(ready.uid);
        if (!claimed.ok || !claimed.pokemon || claimed.pokemon.speciesId !== def.speciesId) throw new Error('Nhận Pokémon hóa thạch sai');
        if (st.pokemon.length !== countBefore + 1) throw new Error('Pokémon phục chế chưa vào kho');
        if ((st.stats.fossilsRestored || 0) < 1) throw new Error('Chưa ghi nhận thành tựu hóa thạch');
        return def.name + ' → ' + PG.SPECIES[def.speciesId].name + ' • tick/claim OK';
      });
    });

    check('Sự kiện xoay vòng: Giờ Vàng, Bùng Nổ, Hóa Thạch, Cá Hoàng Kim', () => {
      return withTempSave(() => {
        const ids = (PG.EVENT_POOL || []).map(e => e.id);
        for (const id of ['golden-hour', 'fossil-surge', 'fishing-festival']) {
          if (ids.indexOf(id) < 0) throw new Error('Thiếu sự kiện ' + id);
        }
        const st = PG.getState();
        st.events.active = null;
        let region = null, base = null, common = null, rare = null;
        for (const rid of PG.REGION_ORDER) {
          const pool = PG.regionSpawnPool(rid);
          const c = pool.find(e => PG.SPECIES[e.id].rarity === 'common');
          const r = pool.find(e => PG.SPECIES[e.id].rarity === 'rare');
          if (c && r) { region = rid; base = pool; common = c; rare = r; break; }
        }
        if (!region) throw new Error('Không có vùng để kiểm tra tỉ lệ hiếm');
        st.events.active = { id: 'golden-hour' };
        const gold = PG.regionSpawnPool(region);
        const cw = (gold.find(e => e.id === common.id) || {}).w || 0;
        const rw = (gold.find(e => e.id === rare.id) || {}).w || 0;
        if (!(cw < common.w * 0.9)) throw new Error('Giờ Vàng không giảm trọng số loài phổ biến');
        if (!(rw > rare.w * 1.3)) throw new Error('Giờ Vàng không tăng trọng số loài hiếm');

        const p = PG.createPokemon(rare.id, 5);
        st.events.active = null;
        const normal = PG.addCatchRewards(st, p, {});
        st.events.active = { id: 'golden-hour' };
        const boosted = PG.addCatchRewards(st, p, {});
        if (!(boosted.stardust > normal.stardust * 1.4)) throw new Error('Giờ Vàng không tăng Bụi Sao');

        st.events.active = { id: 'fossil-surge' };
        st.player.coins = 100000;
        st.fossils.inventory.ammonite = (st.fossils.inventory.ammonite || 0) + 1;
        for (const [mid, n] of Object.entries(PG.FOSSILS.ammonite.restoreMaterials)) st.materials[mid] = (st.materials[mid] || 0) + n;
        const surge = PG.Fossil.startRestore('ammonite');
        if (!surge.ok || !surge.entry.boosted || surge.entry.durationMs >= PG.FOSSILS.ammonite.restoreMs * 0.7) {
          throw new Error('Bùng Nổ Hóa Thạch không tăng tốc phục chế');
        }

        st.events.active = { id: 'fishing-festival' };
        st.unlockedRegions = PG.REGION_ORDER.slice();
        st.player.stamina = 100;
        st.bag = Object.assign({}, st.bag, { worm: 5 });
        const rod = PG.RODS[st.fishing.rod] || PG.RODS.bamboo;
        const spot = PG.Fishing.allSpots().find(s => (rod.deep || 0) >= (s.minRod || 0));
        if (!spot) throw new Error('Không có điểm câu phù hợp');
        const cast = PG.Fishing.cast(spot.regionId);
        if (!cast.ok || !cast.session.festival || cast.session.biteWindow <= PG.Fishing.BITE_WINDOW) {
          throw new Error('Lễ Hội Câu Cá không đổi thời gian cắn');
        }

        // Lễ hội: Cá Hoàng Kim Shiny, thưởng đậm hơn cá thường.
        const random0 = Math.random, chance0 = PG.chance;
        try {
          Math.random = () => 0.1;
          PG.chance = () => true;
          const golden = PG.Fishing.finishSuccess(cast.session, Date.now());
          if (!golden.ok || !golden.result.golden || !golden.result.pokemon.shiny) {
            throw new Error('Lễ hội không ra Cá Hoàng Kim Shiny');
          }
          if (!golden.result.bonus || golden.result.bonus.indexOf('Cá Hoàng Kim') < 0) {
            throw new Error('Cá Hoàng Kim không có thưởng riêng');
          }
          if (!(golden.result.pokemon.mutations || []).length) throw new Error('Cá Hoàng Kim không tăng đột biến');
        } finally {
          Math.random = random0;
          PG.chance = chance0;
        }

        // Bùng nổ: 1 vùng bất kỳ / 1 loài, đúng 5 phút, spawn cao hơn một chút.
        if (typeof PG.rollOutbreak !== 'function') throw new Error('Thiếu PG.rollOutbreak');
        st.events.outbreak = null;
        if (!PG.rollOutbreak(true)) throw new Error('Không tạo được bùng nổ');
        const ob = st.events.outbreak;
        if (!ob || !PG.SPECIES[ob.speciesId] || !PG.REGIONS[ob.regionId]) throw new Error('Bùng nổ sai vùng/loài');
        if (ob.endsAt - ob.startedAt !== PG.OUTBREAK_MS) throw new Error('Bùng nổ không đúng 5 phút');
        if (PG.OUTBREAK_MS !== 5 * 60 * 1000) throw new Error('Thời gian bùng nổ không phải 5 phút');
        if (!PG.REGION_ORDER.includes(ob.regionId)) throw new Error('Bùng nổ sai danh sách vùng');
        if (PG.rollOutbreak(true)) throw new Error('Bùng nổ đổi loài trong cùng chu kỳ');

        const boostedPool = PG.regionSpawnPool(ob.regionId);
        st.events.outbreak = null;
        const basePool = PG.regionSpawnPool(ob.regionId);
        st.events.outbreak = ob;
        const bw = (basePool.find(e => e.id === ob.speciesId) || {}).w || 0;
        const ow = (boostedPool.find(e => e.id === ob.speciesId) || {}).w || 0;
        const totalBase = basePool.reduce((a, e) => a + e.w, 0);
        if (!(bw > 0) || !(ow > bw * 2)) throw new Error('Bùng nổ không làm loài xuất hiện nhiều hơn');
        if (!(ow < bw * 6)) throw new Error('Bùng nổ làm loài xuất hiện quá áp đảo');
        const baseRatio = bw / totalBase;
        const obRatio = ow / (totalBase - bw + ow);
        // Trọng số tăng 2–6 lần nhưng tỉ lệ có trần 1, nên với vùng nhỏ
        // (loài gốc đã chiếm đa số) không thể đạt 2x. Chỉ kiểm tra tỉ lệ
        // tăng lên rõ rệt và không áp đảo hoàn toàn.
        if (!(obRatio > baseRatio && obRatio < baseRatio * 6)) {
          throw new Error('Tỉ lệ xuất hiện bùng nổ không nằm mức "cao hơn một chút"');
        }

        const mut0 = PG.chance;
        try {
          PG.chance = () => true;
          const boosted = PG.createPokemon(ob.speciesId, 5, { mutationBoost: 0.07 });
          if (!(boosted.mutations || []).length) throw new Error('Bùng nổ không tăng đột biến');
        } finally {
          PG.chance = mut0;
        }
        return '4 nhóm sự kiện • spawn/stardust/phục chế/Cá Hoàng Kim/bùng nổ';
      });
    });

    check('Nhiệm vụ & thành tựu hóa thạch', () => {
      const all = (PG.QUEST_TEMPLATES.daily || []).concat(PG.QUEST_TEMPLATES.weekly || []);
      for (const type of ['fossil_dig', 'fossil_restore']) {
        if (!all.some(q => q.type === type)) throw new Error('Thiếu nhiệm vụ ' + type);
      }
      if (!(PG.ACHIEVEMENTS || []).some(a => a.stat === 'fossilsRestored')) throw new Error('Thiếu thành tựu hóa thạch');
      return '2 nhiệm vụ • 1 thành tựu';
    });

    check('Bắt: bóng giảm nhẹ, bùng nổ/Shiny/đột biến khó bắt hơn', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.player.level = 20;
        if (!(PG.BALL_CATCH_TUNING > 0.9 && PG.BALL_CATCH_TUNING < 1)) throw new Error('Hệ số bóng chưa được giảm nhẹ');
        const enc = () => {
          // createPokemon có roll Shiny/đột biến ngẫu nhiên; dọn về trạng thái
          // kiểm soát để phép so sánh tỉ lệ bắt không bị nhiễu.
          const p = PG.createPokemon('bulbasaur', 10);
          p.shiny = false;
          p.mutations = [];
          p.primaryMutation = null;
          return { pokemon: p, regionId: 'forest', isNight: false, throws: 0, outbreak: false };
        };
        // Đặt HP SAU khi cờ đột biến/shiny đã cố định: đột biến đổi HP tối đa,
        // đặt HP trước khi gắn cờ làm tỉ lệ máu lệch và kết quả nhiễu ngẫu nhiên.
        const halfHp = e => { e.pokemon.hp = Math.floor(PG.getStats(e.pokemon).hp / 2); return e; };
        const normal = halfHp(enc());
        const base = PG.catchChance(normal, 'pokeball', 'hit', null, st);
        const ob = enc(); ob.outbreak = true; halfHp(ob);
        const shiny = enc(); shiny.pokemon.shiny = true; shiny.pokemon.mutations = ['shiny']; halfHp(shiny);
        const mut = enc(); mut.pokemon.mutations = ['alpha']; mut.pokemon.primaryMutation = 'alpha'; halfHp(mut);
        const obC = PG.catchChance(ob, 'pokeball', 'hit', null, st);
        const shC = PG.catchChance(shiny, 'pokeball', 'hit', null, st);
        const mutC = PG.catchChance(mut, 'pokeball', 'hit', null, st);
        const detail = 'base ' + base.toFixed(3) + ' • ob ' + obC.toFixed(3) + ' • shiny ' + shC.toFixed(3) + ' • mut ' + mutC.toFixed(3);
        if (!(obC < base && shC < base && mutC < base)) throw new Error('Bùng nổ/Shiny/đột biến vẫn dễ bắt như thường (' + detail + ')');
        if (!(obC > base * 0.6 && shC > base * 0.6)) throw new Error('Giảm tỉ lệ bắt quá mạnh (' + detail + ')');
        return 'Bóng x' + PG.BALL_CATCH_TUNING + ' • outbreak ' + Math.round(obC * 100) + '% / shiny ' + Math.round(shC * 100) + '% / thường ' + Math.round(base * 100) + '%';
      });
    });

    check('Thưởng một lần khi vượt qua mọi thử thách của vùng', () => {
      return withTempSave(() => {
        const st = PG.getState();
        const before = st.player.coins;
        const first = PG.regionChallengeStatus('forest');
        if (first.cleared || first.claimed) throw new Error('Trạng thái vùng chưa sạch');
        PG.markRegionChallenge('forest', 'trainer');
        PG.markRegionChallenge('forest', 'gym');
        const got = PG.markRegionChallenge('forest', 'raid');
        if (!got || !got.lines.length) throw new Error('Không nhận thưởng khi đủ 3 thử thách');
        if (!(st.player.coins > before)) throw new Error('Thưởng không cộng vàng');
        const after = PG.regionChallengeStatus('forest');
        if (!after.cleared || !after.claimed) throw new Error('Chưa lưu trạng thái đã nhận thưởng');
        if (PG.checkRegionClear('forest')) throw new Error('Phần thưởng bị nhận lại lần 2');
        return '3/3 thử thách • +' + PG.fmt(st.player.coins - before) + ' Xu';
      });
    });

    check('May mắn & chí mạng suy giảm dần về 0 trong trận', () => {
      const fx0 = PG.luckEffects(120, 1);
      const half = PG.decayLuckEffects(fx0, 0.5);
      const zero = PG.decayLuckEffects(fx0, 0);
      if (!(half.crit < fx0.crit && half.dodge < fx0.dodge)) throw new Error('Suy giảm không ảnh hưởng crit/né');
      if (zero.crit !== 0 || zero.dodge !== 0 || zero.effective !== 0) throw new Error('May mắn không về 0');
      const c = (luck) => ({
        baseLuckFx: fx0, luckFx: Object.assign({}, fx0), baseLuck: luck, luck,
        baseDodgeBonus: 0.02, dodgeBonus: 0.02, critFloor: 0.0625, luckDecay: 1
      });
      const b = {
        decay: 1, log: [],
        player: { team: [c(120)] }, enemy: { team: [c(60)] }
      };
      const beforeCrit = b.player.team[0].luckFx.crit;
      PG.Battle.decayBattleLuck(b, []);
      if (!(b.player.team[0].luckFx.crit < beforeCrit)) throw new Error('Lượt đầu chưa suy giảm');
      for (let i = 0; i < 13; i++) PG.Battle.decayBattleLuck(b, []);
      const ac = b.player.team[0];
      if (b.decay !== 0 || ac.luckFx.crit !== 0 || ac.luck !== 0 || ac.dodgeBonus !== 0 || ac.critFloor !== 0) {
        throw new Error('Sau nhiều lượt chưa về 0: decay=' + b.decay);
      }
      return 'Mỗi lượt -' + Math.round(PG.Battle.LUCK_DECAY_PER_TURN * 100) + '% • về 0 sau ' + Math.ceil(1 / PG.Battle.LUCK_DECAY_PER_TURN) + ' lượt';
    });

    check('Huấn luyện viên lang thang: thách đấu & rớt quà', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.roamingTrainer = null;
        st.roamingCooldownAt = 0;
        st.player.stamina = 100;
        const chance0 = PG.chance;
        try {
          PG.chance = () => true;
          PG.walk('forest');
        } finally { PG.chance = chance0; }
        const rt = st.roamingTrainer;
        if (!rt || !(rt.expiresAt > Date.now())) throw new Error('Đi dạo không tạo được thử thách lang thang');
        if (!rt.team.length || !(rt.reward.coins > 0) || !rt.reward.equipment.length || !Object.keys(rt.reward.items).length) {
          throw new Error('Quà rớt thiếu bóng / thuốc / đồ / vàng');
        }
        const own = PG.createPokemon('bulbasaur', 10);
        st.pokemon.push(own);
        st.team = [own.uid];
        const coins = st.player.coins;
        const res = PG.Battle.startRoamingTrainer();
        if (!res.ok || !res.battle.roaming) throw new Error('Không bắt đầu được trận lang thang');
        PG.Battle.finishBattle(res.battle, 'player', [], {});
        if (st.roamingTrainer) throw new Error('Đối thủ không rời đi sau khi thua');
        if (!(st.player.coins > coins)) throw new Error('Không nhận vàng từ đối thủ');
        return rt.name + ' • ' + rt.team.length + ' Pokémon • bóng/túi thuốc/trang bị/vàng';
      });
    });

    check('50 Pokémon đời mới: dex 906–955, ảnh thật, tiến hóa hợp lệ', () => {
      const newDex = Array.from({ length: 50 }, (_, i) => 906 + i);
      const found = PG.DEX_ORDER.map(id => PG.SPECIES[id]).filter(sp => newDex.indexOf(sp.dex) >= 0);
      if (found.length !== 50) throw new Error('Chỉ có ' + found.length + '/50 loài mới');
      const seen = new Set();
      for (const sp of found) {
        if (seen.has(sp.id)) throw new Error('ID trùng: ' + sp.id);
        seen.add(sp.id);
        if (!sp.habitats.length || sp.habitats.some(h => !PG.REGIONS[h])) throw new Error('Vùng sống sai: ' + sp.id);
        if (sp.evo) {
          const branches = Array.isArray(sp.evo[0]) ? sp.evo : [sp.evo];
          for (const e of branches) if (!PG.SPECIES[e[0]]) throw new Error('Tiến hóa sai: ' + sp.id + ' → ' + e[0]);
        }
        const url = PG.spriteUrl(sp);
        if (!/^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\//.test(url)) throw new Error('Ảnh không phải artwork thật: ' + sp.id);
      }
      return '50 loài • dex 906–955 • artwork PokéAPI';
    });

    check('50 Pokémon đời mới khác: dex 956–1006 (bỏ 959 đã có)', () => {
      const expected = [956, 957, 958].concat(Array.from({ length: 47 }, (_, i) => 960 + i));
      const found = expected.map(d => PG.DEX_ORDER.map(id => PG.SPECIES[id]).find(sp => sp && sp.dex === d));
      if (found.some(sp => !sp)) throw new Error('Thiếu loài mới trong dex 956–1006');
      const ids = new Set(), names = new Set();
      for (const sp of found) {
        if (ids.has(sp.id) || names.has(sp.name)) throw new Error('Trùng loài: ' + sp.id);
        ids.add(sp.id); names.add(sp.name);
        if (!sp.habitats.length || sp.habitats.some(h => !PG.REGIONS[h])) throw new Error('Vùng sống sai: ' + sp.id);
        const url = PG.spriteUrl(sp);
        if (!/^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\//.test(url)) throw new Error('Ảnh không phải artwork thật: ' + sp.id);
      }
      return '50 loài mới • tổng dex ' + PG.DEX_ORDER.length;
    });

    check('Bùng nổ có thể xuất hiện ở mọi vùng, kể cả vùng chưa mở', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.unlockedRegions = [];
        st.player.level = 1;
        st.badges = [];
        st.events.outbreak = null;
        if (!PG.rollOutbreak(true)) throw new Error('Không tạo được bùng nổ khi chưa mở vùng nào');
        const ob = st.events.outbreak;
        if (!ob || !PG.REGIONS[ob.regionId] || !PG.SPECIES[ob.speciesId]) throw new Error('Bùng nổ sai vùng/loài');
        // Loài đang bùng nổ phải xuất hiện ngay cả ở vùng đã mở khác.
        st.unlockedRegions = ['forest'];
        const other = PG.REGION_ORDER.find(r => r !== ob.regionId && PG.REGIONS[r]);
        const pool = PG.regionSpawnPool(other);
        if (!pool.some(e => e.id === ob.speciesId && e.w > 0)) throw new Error('Loài bùng nổ không xuất hiện ở vùng khác');
        return ob.regionName + ' → ' + other;
      });
    });

    check('Hồi đội hình cần bình hồi phục / Bình Hồi Phục Nhanh', () => {
      return withTempSave(() => {
        const st = PG.getState();
        const p = PG.createPokemon('bulbasaur', 5, {});
        st.pokemon = [p];
        p.hp = 1;
        p.status = 'burn';
        st.bag.potion = 0;
        st.bag.teampotion = 0;
        const fail = PG.Battle.healTeam();
        if (fail.ok) throw new Error('Hồi đội vẫn miễn phí khi không có bình');
        st.bag.teampotion = 1;
        const quick = PG.Battle.healTeam();
        if (!quick.ok || quick.count !== 1 || p.hp < PG.getStats(p).hp || p.status) throw new Error('Bình nhanh không hồi toàn đội');
        if ((st.bag.teampotion || 0) !== 0) throw new Error('Bình nhanh không bị tiêu hao');
        p.hp = 1;
        st.bag.potion = 1;
        const normal = PG.Battle.healTeam();
        if (!normal.ok || normal.used !== 'potion' || (st.bag.potion || 0) !== 0) throw new Error('Potion không được dùng để hồi đội');
        return '1 bình nhanh hoặc Potion/pokémon';
      });
    });

    check('HP hồi trên bản đồ có hiệu lực trong đấu trường', () => {
      return withTempSave(() => {
        const st = PG.getState();
        const p = PG.createPokemon('bulbasaur', 5, {});
        st.pokemon = [p];
        st.team = [p.uid];
        p.hp = 1;
        p.status = 'burn';
        st.bag.teampotion = 1;
        st.bag.potion = 0;
        st.unlockedRegions = ['forest'];
        st.dailyDefeats = { date: PG.todayKey(), trainers: {}, gyms: {} };
        PG.Battle.healTeam();
        const oldBattle = PG.ui && PG.ui.flow ? PG.ui.flow.battle : undefined;
        if (PG.ui) PG.ui.flow.battle = { over: true, player: { team: [] } };
        let r;
        try {
          r = PG.Battle.startTrainer('forest');
        } finally {
          if (PG.ui) PG.ui.flow.battle = oldBattle;
        }
        if (!r.ok) throw new Error(r.msg || 'Không tạo được trận');
        const c = r.battle.player.team.find(x => x.p.uid === p.uid);
        if (!c) throw new Error('Pokémon đã hồi không vào trận');
        if (c.hp < c.maxHp || c.status) throw new Error('Trận đấu vẫn dùng HP/trạng thái cũ');
        return 'HP đầy • không trạng thái';
      });
    });

    check('Bẫy & trại săn chạy offline và thu hoạch được Pokémon', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.player.coins = 100000;
        st.materials.leather = 20;
        st.materials.stone = 20;
        st.materials.seed = 20;
        st.idleTraps = [];
        const r = PG.Traps.place('trap', 'forest', 'grass', 1);
        if (!r.ok) throw new Error(r.msg);
        const e = r.entry;
        if (!e.catches || !e.catches.length) throw new Error('Bẫy không quay ra Pokémon');
        if (st.player.coins >= 100000) throw new Error('Không trừ Xu khi đặt bẫy');
        e.endsAt = Date.now() - 1;
        if (PG.Traps.tick() < 1) throw new Error('Bẫy không chuyển sang sẵn sàng sau thời gian thực');
        const before = st.pokemon.length;
        const got = PG.Traps.claim(e.uid);
        if (!got.ok || st.pokemon.length !== before + e.catches.length) throw new Error('Thu hoạch sai số Pokémon');
        if (st.idleTraps.some(x => x.uid === e.uid)) throw new Error('Bẫy đã thu hoạch vẫn còn');
        return e.catches.length + ' Pokémon sau 1 giờ';
      });
    });

    check('Bộ ba thần gió / sấm / đất: Tornadus, Thundurus, Landorus', () => {
      const byDex = {};
      for (const id of PG.DEX_ORDER) byDex[PG.SPECIES[id].dex] = PG.SPECIES[id];
      const expect = [
        [641, 'Tornadus', 'flying'],
        [642, 'Thundurus', 'electric'],
        [645, 'Landorus', 'ground']
      ];
      for (const [d, name, type] of expect) {
        const sp = byDex[d];
        if (!sp || sp.name !== name || sp.rarity !== 'legendary') throw new Error('Thiếu thần ' + name);
        if (!sp.types.includes(type)) throw new Error('Hệ sai: ' + name);
        const url = PG.spriteUrl(sp);
        if (!url.includes('/' + d + '.png') || url.indexOf('images/') === 0) throw new Error('Ảnh sai: ' + name);
      }
      if (byDex[643].name !== 'Reshiram') throw new Error('Dex 643 bị chiếm');
      return '641/642/645 • artwork PokéAPI thật';
    });

    check('30 Palworld mới: ảnh thật 256px, nhóm Crossover, không trùng', () => {
      const seen = new Set();
      const found = [];
      for (let d = 9423; d <= 9452; d++) {
        const sp = PG.DEX_ORDER.map(id => PG.SPECIES[id]).find(x => x.dex === d);
        if (!sp) throw new Error('Thiếu Pal dex ' + d);
        if (seen.has(sp.id) || seen.has(sp.name)) throw new Error('Trùng Pal ' + d);
        seen.add(sp.id); seen.add(sp.name);
        if (!/^cross-pal-/.test(sp.id)) throw new Error('ID sai: ' + sp.id);
        if (PG.dexGroupOf(sp) !== 'crossover') throw new Error('Nhóm sai: ' + sp.id);
        if (PG.spriteUrl(sp) !== 'images/crossovers/' + d + '.png') throw new Error('Ảnh local sai: ' + d);
        if (!PG.fanSpriteOverride(sp)) throw new Error('Thiếu ảnh gốc: ' + d);
        if (!sp.habitats.length || sp.habitats.some(h => !PG.REGIONS[h])) throw new Error('Vùng sống sai: ' + sp.id);
        found.push(sp);
      }
      return found.length + ' Pal • ' + Object.keys(PG.FAN_SPRITE_URLS).length + ' ảnh franchise';
    });

    check('50 Digimon phim/game mới: ảnh thật 256px, nhóm Crossover, không trùng', () => {
      const seen = new Set();
      const found = [];
      for (let d = 9453; d <= 9502; d++) {
        const sp = PG.DEX_ORDER.map(id => PG.SPECIES[id]).find(x => x.dex === d);
        if (!sp) throw new Error('Thiếu Digimon dex ' + d);
        if (seen.has(sp.id) || seen.has(sp.name)) throw new Error('Trùng Digimon ' + d);
        seen.add(sp.id); seen.add(sp.name);
        if (!/^cross-digi-/.test(sp.id)) throw new Error('ID sai: ' + sp.id);
        if (PG.dexGroupOf(sp) !== 'crossover') throw new Error('Nhóm sai: ' + sp.id);
        if (PG.spriteUrl(sp) !== 'images/crossovers/' + d + '.png') throw new Error('Ảnh local sai: ' + d);
        if (!PG.fanSpriteOverride(sp)) throw new Error('Thiếu ảnh gốc: ' + d);
        if (!sp.habitats.length || sp.habitats.some(h => !PG.REGIONS[h])) throw new Error('Vùng sống sai: ' + sp.id);
        found.push(sp);
      }
      return found.length + ' Digimon • ' + Object.keys(PG.FAN_SPRITE_URLS).length + ' ảnh franchise';
    });

    check('50 Palworld mới: ảnh thật 256px, chỉ số scale, nhóm Crossover, không trùng', () => {
      const seen = new Set();
      const found = [];
      for (let d = 9503; d <= 9552; d++) {
        const sp = PG.DEX_ORDER.map(id => PG.SPECIES[id]).find(x => x.dex === d);
        if (!sp) throw new Error('Thiếu Pal dex ' + d);
        if (seen.has(sp.id) || seen.has(sp.name)) throw new Error('Trùng Pal ' + d);
        seen.add(sp.id); seen.add(sp.name);
        if (!/^cross-pal-/.test(sp.id)) throw new Error('ID sai: ' + sp.id);
        if (PG.dexGroupOf(sp) !== 'crossover') throw new Error('Nhóm sai: ' + sp.id);
        if (PG.spriteUrl(sp) !== 'images/crossovers/' + d + '.png') throw new Error('Ảnh local sai: ' + d);
        if (!PG.fanSpriteOverride(sp)) throw new Error('Thiếu ảnh gốc: ' + d);
        const raw = sp.baseRaw || sp.base; // độ hiếm nhân thêm ở species-finalize, gốc vẫn phải scale
        if (raw.some(v => v > 170) || PG.sum(raw) > 800) throw new Error('Chỉ số chưa scale: ' + sp.id);
        if (!sp.habitats.length || sp.habitats.some(h => !PG.REGIONS[h])) throw new Error('Vùng sống sai: ' + sp.id);
        found.push(sp);
      }
      return found.length + ' Pal • ' + Object.keys(PG.FAN_SPRITE_URLS).length + ' ảnh franchise';
    });

    check('Bẫy/mồi chỉ đặt ở vùng đã mở khóa', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.unlockedRegions = ['forest'];
        st.player.level = 1;
        st.badges = [];
        st.idleTraps = [];
        const coins = st.player.coins;
        const locked = PG.REGION_ORDER.find(r => r !== 'forest' && !PG.isRegionUnlocked(st, r));
        if (!locked) throw new Error('Không có vùng khóa để kiểm tra');
        const fail = PG.Traps.place('trap', locked, 'grass', 1);
        if (fail.ok || !/chưa mở khóa/.test(fail.msg)) throw new Error('Vẫn đặt được bẫy ở vùng khóa');
        if ((st.idleTraps || []).length || st.player.coins !== coins) throw new Error('Đặt hỏng vẫn trừ tài nguyên');
        const ok = PG.Traps.place('trap', 'forest', 'grass', 1);
        if (!ok.ok) throw new Error(ok.msg || 'Không đặt được ở vùng đã mở');
        return 'khóa ' + PG.REGIONS[locked].name + ' • mở ' + PG.REGIONS.forest.name;
      });
    });

    check('Đồ ăn tăng thiện cảm & tỉ lệ thu phục', () => {
      return withTempSave(() => {
        const st = PG.getState();
        const p = PG.createPokemon('bulbasaur', 5);
        st.pokemon.push(p);
        st.team = [p.uid];
        st.bag.sweetberry = 1;
        const res = PG.feedBerry(p.uid, 'sweetberry');
        if (!res.ok || (p.friendship || 0) !== 12) throw new Error('Cho ăn không tăng 12 thiện cảm');
        if ((st.bag.sweetberry || 0) !== 0) throw new Error('Không tiêu hao quả đã ăn');
        const enc = { pokemon: p, regionId: 'forest', throws: 0 };
        const plain = PG.catchChance(enc, 'pokeball', 'hit', null, st);
        const fed = PG.catchChance(enc, 'pokeball', 'hit', 'sweetberry', st);
        if (!(fed > plain)) throw new Error('Berry Ngọt không tăng tỉ lệ bắt');
        return 'thiện cảm ' + p.friendship + '/100 • bắt ' + Math.round(plain * 100) + '% → ' + Math.round(fed * 100) + '%';
      });
    });

    check('Đồ cầm tay: tổng chỉ số hiển thị khớp trận đấu', () => {
      return withTempSave(() => {
        const st = PG.getState();
        const p = PG.createPokemon('bulbasaur', 20);
        st.pokemon.push(p);
        st.bag['power-band'] = 1;
        const base = PG.getStats(p);
        const res = PG.assignHeldItem(p.uid, 'power-band');
        if (!res.ok) throw new Error(res.msg);
        const final = PG.battleStats(p);
        const delta = PG.heldStatDelta(p);
        if (delta.atk !== 5 || delta.def !== -2) throw new Error('Delta sai: ' + JSON.stringify(delta));
        if (final.atk !== base.atk + 5 || final.def !== base.def - 2) throw new Error('Tổng chỉ số sai');
        PG.removeHeldItem(p.uid);
        if (PG.heldStatDelta(p).atk !== 0) throw new Error('Tháo đồ vẫn còn cộng chỉ số');
        return 'ATK +' + delta.atk + ' • DEF ' + delta.def + ' • tháo ra mất bonus';
      });
    });

    check('Phòng nghiên cứu ngẫu nhiên bằng Mảnh Tinh Thể', () => {
      return withTempSave(() => {
        const st = PG.getState();
        const p = PG.createPokemon('bulbasaur', 10);
        p.nature = 'hardy';
        p.ability = 'overgrow';
        st.pokemon.push(p);
        st.bag['crystal-shard'] = 3;
        if (!PG.researchAbilityPool(p).includes('multiscale')) throw new Error('Thiếu đặc tính mới trong pool');
        const beforeNature = p.nature, beforeAbility = p.ability;
        const n = PG.researchRandom(p.uid, 'nature');
        if (!n.ok || !n.value || p.nature === beforeNature || !PG.NATURES[p.nature]) throw new Error('Nghiên cứu tính cách không ngẫu nhiên');
        const a = PG.researchRandom(p.uid, 'ability');
        if (!a.ok || !a.value || p.ability === beforeAbility || !PG.ABILITIES[p.ability]) throw new Error('Nghiên cứu đặc tính không ngẫu nhiên');
        const a2 = PG.researchRandom(p.uid, 'ability');
        if (!a2.ok || p.ability === a.value) throw new Error('Lần nghiên cứu sau không đổi kết quả');
        if ((st.bag['crystal-shard'] || 0) !== 0) throw new Error('Không tiêu hao đúng 3 Mảnh');
        if (PG.researchRandom(p.uid, 'nature').ok) throw new Error('Hết Mảnh vẫn nghiên cứu được');
        return '3 Mảnh • ' + PG.NATURES[p.nature].name + ' / ' + PG.ABILITIES[p.ability].name;
      });
    });

    check('Huyền thoại có chiêu riêng theo cốt truyện / game', () => {
      const mewtwo = PG.createPokemon('mewtwo', 5);
      if (!PG.signatureFor('mewtwo').includes('psystrike')) throw new Error('Mewtwo thiếu Tâm Lực Xuyên Thấu');
      if (!mewtwo.learnedMoves.includes('psystrike') || !mewtwo.moves.some(m => m.id === 'psystrike')) throw new Error('Chiêu riêng chưa được học');
      const hooh = PG.createPokemon('ho-oh', 5);
      if (!hooh.learnedMoves.includes('sacred_fire')) throw new Error('Ho-Oh thiếu Lửa Thần Thánh');
      const fallback = PG.signatureFor('regirock');
      if (!fallback.length || !PG.MOVES[fallback[0]]) throw new Error('Huyền thoại dự phòng thiếu Tuyệt Kỹ');
      const movie = PG.createPokemon('film-mewtwo-mega-x', 5);
      if (!movie.learnedMoves.includes('psystrike')) throw new Error('Form phim không kế thừa chiêu riêng');
      return PG.MOVES.psystrike.name + ' • ' + PG.MOVES.sacred_fire.name + ' • dự phòng ' + PG.MOVES[fallback[0]].name;
    });

    check('Tiến hóa mở khóa chiêu mới (dạng cơ bản không có)', () => {
      return withTempSave(() => {
        const st = PG.getState();
        const base = PG.createPokemon('bulbasaur', 16);
        if (base.learnedMoves.includes('venom_bloom')) throw new Error('Bulbasaur đã biết chiêu của dạng tiến hóa');
        st.pokemon.push(base);
        st.candies[PG.SPECIES.bulbasaur.family] = 200;
        const opt = PG.evolutionOptions(base)[0];
        const res = PG.evolve(st, base, opt);
        if (!res.ok || !res.gained || !res.gained.includes('venom_bloom')) throw new Error(res.msg || 'Không mở khóa chiêu khi tiến hóa');
        if (!base.learnedMoves.includes('venom_bloom')) throw new Error('Chiêu mới không nằm trong danh sách đã học');
        if (!base.moves.some(m => m.id === 'venom_bloom')) throw new Error('Chiêu mới không được trang bị sau tiến hóa');
        return PG.SPECIES[base.speciesId].name + ' học ' + PG.MOVES.venom_bloom.name;
      });
    });

    check('Khắc hệ trang bị cộng sát thương chiêu cùng hệ', () => {
      return withTempSave(() => {
        const st = PG.getState();
        const item = PG.rollEquipment('angler-hat');
        if (!item) throw new Error('Không tạo được trang bị thử nghiệm');
        st.equipment.inventory.push(item);
        st.equipment.equipped.hat = item;
        st.player.coins = 100000;
        st.materials.crystal = 3;
        const r = PG.engraveEquipment(item.uid, 'fire');
        if (!r.ok) throw new Error(r.msg);
        if (PG.engraveEquipment(item.uid, 'fire').ok) throw new Error('Khắc trùng hệ vẫn được');
        const agg = PG.aggregateEquipment(st.equipment.equipped);
        if (!(agg.totals.typeBoost.fire > 1)) throw new Error('Sơ đồ không ghi nhận hệ đã khắc');
        const atk = combatant(['fire']), def = combatant(['grass']);
        const plain = PG.Formulas.attack(atk, def, PG.MOVES.ember, { noRandom: true, weather: 'clear' });
        atk.typeBoost = { fire: agg.totals.typeBoost.fire };
        const boosted = PG.Formulas.attack(atk, def, PG.MOVES.ember, { noRandom: true, weather: 'clear' });
        if (!(boosted.damage > plain.damage)) throw new Error('Khắc hệ không tăng sát thương');
        return '+' + Math.round((agg.totals.typeBoost.fire - 1) * 100) + '% • ' + plain.damage + ' → ' + boosted.damage;
      });
    });

    check('Hệ Lỗi có loài, đặc tính và chiêu riêng', () => {
      const glitch = PG.speciesByType('glitch');
      if (glitch.length < 2) throw new Error('Chỉ có ' + glitch.length + ' loài hệ Lỗi');
      for (const id of glitch) {
        const sp = PG.SPECIES[id];
        if (sp.types.length !== 1 || sp.types[0] !== 'glitch') {
          throw new Error(sp.name + ' không phải hệ Lỗi đơn: ' + sp.types.join('/'));
        }
        if (!sp.abilities.includes('glitch-shift') && sp.hiddenAbility !== 'glitch-shift') {
          throw new Error(sp.name + ' thiếu đặc tính Lỗi Hệ Thống');
        }
        if (!PG.MOVES['glitch_byte']) throw new Error('Thiếu chiêu hệ Lỗi');
      }
      const cfg = PG.TYPE_SPECIAL.glitch;
      if (!cfg || !cfg.shiftAfterMove || !cfg.shiftPool || cfg.shiftPool.length < 3) {
        throw new Error('Cấu hình đổi hệ sau lượt không hợp lệ');
      }
      return glitch.length + ' loài hệ Lỗi • ' + cfg.shiftPool.length + ' hệ có thể đổi';
    });

    check('84 loài Nexus Anima gốc có chiêu đặc trưng', () => {
      const ids = PG.DEX_ORDER.filter(id => {
        const d = PG.SPECIES[id].dex;
        return (d >= 9553 && d <= 9582) || (d >= 9613 && d <= 9662) || (d >= 9713 && d <= 9716);
      });
      if (ids.length !== 84) throw new Error('Chỉ có ' + ids.length + '/84 loài');
      const sigs = Object.assign({}, PG.NEXUS_ANIMA_SIGNATURES || {},
        PG.NEXUS_ANIMA20C_SIGNATURES || {}, PG.NEXUS_ANIMA20D_SIGNATURES || {});
      for (const id of ids) {
        const sp = PG.SPECIES[id];
        const mid = sigs[id];
        if (!mid || !PG.MOVES[mid]) throw new Error(sp.name + ' thiếu chiêu đặc trưng');
        if (PG.signatureFor(id).indexOf(mid) < 0) throw new Error(sp.name + ' không học được chiêu riêng');
        const learned = PG.movesForSpecies(id, 50).map(m => m.id);
        if (learned.indexOf(mid) < 0) throw new Error(sp.name + ' learnset thiếu chiêu riêng');
      }
      return ids.length + ' loài • mỗi loài 1 chiêu từ hna.wiki';
    });

    check('Hệ Lỗi đổi hệ sau mỗi lượt tấn công', () => {
      return withTempSave(() => {
        const st = PG.getState();
        // Không ép đặc tính: hành vi phải đến từ hệ, dù roll trúng đặc tính thường.
        const p = PG.createPokemon('cross-anima-corvariatio', 50);
        p.hp = p.hp || PG.battleStats(p).hp;
        st.pokemon.push(p); st.team = [p.uid];
        const foe = PG.createPokemon('blissey', 30);
        const r = PG.Battle.startWild({ pokemon: foe, regionId: 'forest' });
        if (!r.ok) throw new Error(r.msg);
        const b = r.battle;
        const before = b.player.team[0].types.slice();
        const turn = PG.Battle.takeTurn(b, { type: 'move', index: 0 });
        if (!turn.ok) throw new Error(turn.msg);
        const after = b.player.team[0].types.slice();
        if (after[0] === before[0]) throw new Error('Hệ không đổi sau lượt tấn công');
        if (after[0] === 'glitch' || after[0] === 'neutral' || after[0] === 'celestial') {
          throw new Error('Đổi sang hệ đặc biệt không hợp lệ: ' + after[0]);
        }
        const ev = turn.events.find(e => e.type === 'type' && e.side === 'player');
        if (!ev) throw new Error('Thiếu sự kiện đổi hệ cho UI');
        // Kế thừa chiêu / đặc tính của hệ mới.
        const kit = (PG.TYPE_MOVES[after[0]] || []).map(row => row[0]);
        const activeMoves = b.player.team[0].moves.map(m => m.id);
        if (!activeMoves.length || activeMoves.some(mid => kit.indexOf(mid) < 0)) {
          throw new Error('Không dùng chiêu của hệ ' + after[0] + ': ' + activeMoves.join(', '));
        }
        const gotAbility = b.player.team[0].ability;
        if ((PG.TYPE_ABILITIES[after[0]] || []).indexOf(gotAbility) < 0) {
          throw new Error('Không có đặc tính của hệ ' + after[0] + ': ' + gotAbility);
        }
        // Lượt thứ hai vẫn đổi dù hệ hiện tại không còn là Lỗi.
        if (!b.over && b.player.team[0].hp > 0) {
          const turn2 = PG.Battle.takeTurn(b, { type: 'move', index: 0 });
          // Nếu Pokémon ngất ở lượt hai thì không còn "sau lượt" để đổi hệ.
          if (turn2.ok && b.player.team[0].hp > 0 && b.player.team[0].types[0] === after[0]) {
            throw new Error('Lượt thứ hai không đổi hệ');
          }
        }
        return before.join('/') + ' → ' + after.join('/') + ' (ability: ' + p.ability + ')';
      });
    });

    /* ---------- RAID / KỸ NĂNG MỚI ---------- */
    check('Raid Boss đại diện đã khôi phục & vẫn thưởng Bóng Raid', () => {
      const bosses = {
        forest: 'venusaur', cave: 'tyranitar', beach: 'gyarados', snow: 'regice',
        city: 'magnezone', 'digi-city': 'cross-shadowbeak',
        'pal-isles': 'cross-relaxaurus-lux', viridian: 'beedrill', indigo: 'mewtwo',
        'pal-lava': 'cross-beelzebumon'
      };
      for (const rid of Object.keys(bosses)) {
        const raid = PG.REGIONS[rid] && PG.REGIONS[rid].raid;
        if (!raid || raid.boss !== bosses[rid]) throw new Error('Boss sai tại ' + rid + ': ' + (raid && raid.boss));
        if (!PG.SPECIES[raid.boss]) throw new Error('Boss không tồn tại: ' + raid.boss);
      }
      for (const rid of PG.REGION_ORDER) {
        const raid = PG.REGIONS[rid] && PG.REGIONS[rid].raid;
        if (!raid) continue;
        const balls = raid.reward && raid.reward.items && raid.reward.items['raid-ball'];
        if (!(balls > 0)) throw new Error(rid + ' không thưởng Bóng Raid');
        if (String(raid.boss).indexOf('cross-ygo-') === 0) throw new Error('Vẫn còn Boss Yu-Gi-Oh! tại ' + rid);
      }
      if (PG.CATALOG.essentials.indexOf('raid-ball') >= 0) throw new Error('Bóng Raid không được bán trong cửa hàng');
      if (!PG.BALLS['raid-ball'] || !PG.BALLS['raid-ball'].raidOnly) throw new Error('Thiếu Bóng Raid');
      if (!PG.BALLS['raid-ball'].desc.includes('Boss')) throw new Error('Mô tả Bóng Raid sai');
      return Object.keys(bosses).length + ' vùng Boss đại diện • Bóng Raid cho mọi raid';
    });

    check('Đánh quá tay làm mục tiêu ngất: không bắt được, không tốn bóng', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.bag['raid-ball'] = 1;
        const p = PG.createPokemon('bulbasaur', 5);
        p.hp = 0;
        const enc = { pokemon: p, regionId: 'forest', throws: 0 };
        const r = PG.attemptCatch(enc, 'raid-ball', 'hit', null);
        if (r.ok) throw new Error('Vẫn bắt được Pokémon đã ngất');
        if ((st.bag['raid-ball'] || 0) !== 1) throw new Error('Mất bóng dù không bắt được');
        p.hp = 1;
        const alive = PG.attemptCatch({ pokemon: p, regionId: 'forest', throws: 0 }, 'raid-ball', 'hit', null);
        if (!alive.ok) throw new Error('Bóng Raid không dùng được khi mục tiêu còn sống');
        return 'HP = 0 chặn bắt • Bóng Raid dùng được khi còn sống';
      });
    });

    check('Loài mới 9643-9927: Anima + Pokémon + crossover có ảnh riêng', () => {
      const byDex = {};
      for (const id of PG.DEX_ORDER) byDex[PG.SPECIES[id].dex] = PG.SPECIES[id];
      const animaSigs = Object.assign({}, PG.NEXUS_ANIMA20C_SIGNATURES || {}, PG.NEXUS_ANIMA20D_SIGNATURES || {});
      const animaDex = [];
      for (let d = 9643; d <= 9662; d++) animaDex.push(d);
      for (let d = 9713; d <= 9716; d++) animaDex.push(d);
      for (const d of animaDex) {
        const sp = byDex[d];
        if (!sp || !sp.id.startsWith('cross-anima-')) throw new Error('Thiếu Anima ' + d);
        if (!PG.spriteUrl(sp).startsWith('images/crossovers/')) throw new Error('Ảnh Anima sai: ' + d);
        const mid = animaSigs[sp.id];
        if (!mid || !PG.MOVES[mid] || PG.signatureFor(sp.id).indexOf(mid) < 0) throw new Error('Thiếu chiêu riêng: ' + sp.id);
        if (PG.movesForSpecies(sp.id, 50).every(m => m.id !== mid)) throw new Error('Learnset thiếu chiêu riêng: ' + sp.id);
      }
      let official = 0;
      for (const [from, to, prefix] of [[9663, 9712, 'sp50b-'], [9733, 9782, 'sp50c-'], [9783, 9882, 'sp100a-']]) {
        for (let d = from; d <= to; d++) {
          const sp = byDex[d];
          if (!sp || !sp.artDex || !sp.id.startsWith(prefix)) throw new Error('Thiếu Pokémon chính thức ' + d);
          if (!PG.spriteUrl(sp).includes('/official-artwork/' + sp.artDex + '.png')) throw new Error('Ảnh PokéAPI sai: ' + d);
          for (const h of sp.habitats) if (!PG.REGIONS[h]) throw new Error('Vùng sống sai: ' + sp.id + ':' + h);
          official++;
        }
      }
      const maxDex = Math.max.apply(null, Object.keys(byDex).map(Number));
      if (maxDex !== 9927) throw new Error('Dex cao nhất sai: ' + maxDex);
      return animaDex.length + ' Anima • ' + official + ' Pokémon • max dex ' + maxDex;
    });

    check('Kỹ năng hệ mới & chiêu phối hợp đa hệ có hiệu ứng thật', () => {
      const exp = PG.SKILLS_EXPANSION;
      if (!exp || exp.counts.typeMoves < 70 || exp.counts.comboMoves < 50) throw new Error('Số kỹ năng mới không đủ');
      const combo = PG.MOVES.combo_wildfire; // Lửa + Cỏ
      if (!combo || !PG.Formulas.comboTypesOf(combo)) throw new Error('Thiếu chiêu phối hợp Lửa/Cỏ');
      const comboFlair = PG.Formulas.moveFlair(combo);
      if (!comboFlair || comboFlair.kind !== 'combo' || comboFlair.types.join('|') !== 'fire|grass') {
        throw new Error('UI không nhận diện được nhãn chiêu phối hợp');
      }
      const sigFlair = PG.Formulas.moveFlair(PG.MOVES.anima_money_rain);
      if (!sigFlair || (sigFlair.kind !== 'signature' && sigFlair.kind !== 'world')) {
        throw new Error('UI không nhận diện được chiêu riêng');
      }
      const atk = combatant(['fire', 'grass']);
      const def = combatant(['water']);
      const eff = PG.Formulas.typeEffect('fire', atk, def, { move: combo });
      if (eff.mult !== 2) throw new Error('Chiêu phối hợp không lấy hệ khắc tốt nhất: ' + eff.mult);
      const bare = Object.assign({}, combo, { flags: {} });
      const withCombo = PG.Formulas.baseDamage(atk, def, combo, { weather: 'clear' }).base;
      const without = PG.Formulas.baseDamage(atk, def, bare, { weather: 'clear' }).base;
      if (!(withCombo > without)) throw new Error('Chiêu phối hợp không cộng sát thương khi mang đúng 2 hệ');
      const boosted = combatant(['fire']); boosted.ability = 'molten-core';
      const plain = combatant(['fire']);
      const strong = PG.Formulas.baseDamage(boosted, combatant(['grass']), PG.MOVES.ember, { weather: 'clear' }).base;
      const weak = PG.Formulas.baseDamage(plain, combatant(['grass']), PG.MOVES.ember, { weather: 'clear' }).base;
      if (!(strong > weak)) throw new Error('Đặc tính Lõi Nóng Chảy không tăng sát thương');
      let dualMons = 0;
      for (const id of PG.DEX_ORDER) {
        const sp = PG.SPECIES[id];
        if (sp.types.length !== 2) continue;
        const mid = PG.DUAL_SKILLS[PG.comboKeyForTypes(sp.types)];
        if (mid && PG.MOVES[mid] && PG.signatureFor(id).indexOf(mid) >= 0 &&
            PG.movesForSpecies(id, 50).some(m => m.id === mid)) dualMons++;
      }
      if (dualMons < 50) throw new Error('Chỉ có ' + dualMons + ' loài đa hệ học chiêu phối hợp');
      return exp.counts.typeMoves + ' chiêu hệ • ' + exp.counts.comboMoves + ' chiêu phối hợp • ' + dualMons + ' loài đa hệ';
    });

    check('Tuyệt kỹ có nhãn riêng & tiến hóa học chiêu mới', () => {
      const ult = PG.Formulas.moveFlair(PG.MOVES.ult_fire);
      if (!ult || ult.kind !== 'ultimate' || ult.badge !== 'Tuyệt Kỹ') throw new Error('UI không nhận diện Tuyệt Kỹ');
      if (!PG.MOVES.ult_fire || !PG.MOVES.ult_fire.power) throw new Error('Thiếu chiêu Tuyệt Kỹ Hỏa');
      const evolutionMoves = Object.values(PG.MOVES).filter(m => m.flags && m.flags.evolution);
      if (evolutionMoves.length < 200) throw new Error('Chiêu tiến hóa mới chưa đủ: ' + evolutionMoves.length);
      for (const id of ['butterfree', 'vaporeon', 'machamp', 'charizard']) {
        const sp = PG.SPECIES[id];
        if (!sp) continue;
        if (!(PG.EVOLUTION_MOVES_BY_SPECIES[id] || []).length &&
            !(PG.SPECIATURE_BY_SPECIES[id] || []).length) throw new Error(id + ' không có chiêu khi tiến hóa');
        if (!PG.movesForSpecies(id, 100).length) throw new Error(id + ' learnset rỗng');
      }
      const evoFlair = PG.Formulas.moveFlair(evolutionMoves[0]);
      if (!evoFlair || evoFlair.kind !== 'evolution') throw new Error('UI không nhận diện chiêu tiến hóa');
      return evolutionMoves.length + ' chiêu tiến hóa • nhãn Tuyệt Kỹ OK';
    });

    check('Chiêu thế giới crossover: đủ 4 thế giới, có hiệu ứng và học được', () => {
      const info = PG.CROSSOVER_WORLD_SKILLS;
      if (!info || info.count < 200) throw new Error('Chiêu thế giới chưa đủ: ' + (info && info.count));
      for (const w of ['palworld', 'digimon', 'movie', 'anima']) {
        if (info.byWorld[w] === undefined || !PG.WORLD_BADGES[w]) throw new Error('Thiếu thế giới ' + w);
      }
      if (!(info.byWorld.palworld > 50) || !(info.byWorld.digimon > 20)) throw new Error('Palworld/Digimon chưa được phủ chiêu');
      if (!(info.taggedAnima > 50)) throw new Error('Chiêu Nexus Anima chưa được gắn nhãn thế giới');
      for (const id of ['cross-agumon', 'cross-grizzbolt', 'film-pikachu-original-cap', 'cross-anima-moneytree']) {
        const sp = PG.SPECIES[id];
        if (!sp) continue;
        const sigs = PG.signatureFor(id).filter(m => PG.MOVES[m] && PG.MOVES[m].world);
        if (!sigs.length) throw new Error(id + ' không có chiêu thế giới');
        if (!PG.movesForSpecies(id, 50).some(m => m.id === sigs[0])) throw new Error(id + ' learnset thiếu chiêu thế giới');
        const flair = PG.Formulas.moveFlair(PG.MOVES[sigs[0]]);
        if (!flair || flair.kind !== 'world') throw new Error('UI không nhận diện chiêu thế giới');
      }
      const pal = PG.Formulas.moveFlair(PG.MOVES.pal_frost_fang);
      if (!pal || pal.world !== 'palworld' || pal.badge !== 'Palworld') throw new Error('Nhãn Palworld sai');
      if (PG.Formulas.moveFlair(PG.MOVES.ember)) throw new Error('Chiêu thường bị gắn nhãn riêng');
      return info.count + ' chiêu (' + info.generated + ' sinh mới, ' + info.handcrafted + ' cổ điển) • 4 thế giới';
    });

    check('17 Anima mới (9911-9927): ảnh thật, dex group, kỹ năng thế giới', () => {
      const byDex = {};
      for (const id of PG.DEX_ORDER) byDex[PG.SPECIES[id].dex] = PG.SPECIES[id];
      const seen = new Set();
      for (let d = 9911; d <= 9927; d++) {
        const sp = byDex[d];
        if (!sp) throw new Error('Thiếu loài mới ' + d);
        if (seen.has(sp.id) || seen.has(sp.name)) throw new Error('Trùng loài mới ' + d);
        seen.add(sp.id); seen.add(sp.name);
        if (!sp.id.startsWith('cross-anima-')) throw new Error('Anima sai id: ' + sp.id);
        if (!PG.spriteUrl(sp).startsWith('images/crossovers/' + d + '.png')) throw new Error('Ảnh local sai: ' + sp.id);
        if (PG.dexGroupOf(sp) !== 'crossover') throw new Error('Nhóm dex sai: ' + sp.id);
        const sigs = PG.signatureFor(sp.id).filter(m => PG.MOVES[m] && PG.MOVES[m].world);
        if (!sigs.length) throw new Error('Thiếu chiêu thế giới: ' + sp.id);
        if (!PG.movesForSpecies(sp.id, 50).some(m => m.id === sigs[0])) throw new Error('Learnset thiếu chiêu thế giới: ' + sp.id);
      }
      const mv = PG.MOVES.anima_twin_light;
      if (!mv) throw new Error('Thiếu chiêu thế giới anima_twin_light');
      const flair = PG.Formulas.moveFlair(mv);
      if (!flair || flair.kind !== 'world') throw new Error('Nhãn chiêu sai: anima_twin_light');
      return '17 Anima • ảnh 256px • chiêu thế giới riêng';
    });

    check('Huấn luyện viên tái đấu: không quà/XP, reset 1 lần/ngày', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.unlockedRegions = ['forest'];
        st.region = 'forest';
        st.player.level = 50;
        st.dailyDefeats = { date: PG.todayKey(), trainers: {}, gyms: {}, roaming: false };
        const own = PG.createPokemon('mewtwo', 100, {});
        st.pokemon = [own];
        st.team = [own.uid];
        st.buddy = own.uid;
        const first = PG.Battle.startTrainer('forest');
        if (!first.ok) throw new Error(first.msg);
        if (first.battle.noReward || !first.battle.reward) throw new Error('Trận đầu không được tính là tái đấu');
        const coins = st.player.coins, xp = own.xp || 0;
        PG.Battle.finishBattle(first.battle, 'player', [], {});
        if (!(st.player.coins > coins)) throw new Error('Trận đầu không nhận vàng');
        if (!st.dailyDefeats.trainers.forest) throw new Error('Không ghi nhận đã thắng trainer');
        const again = PG.Battle.startTrainer('forest');
        if (!again.ok) throw new Error(again.msg);
        if (!again.battle.noReward || again.battle.reward) throw new Error('Tái đấu vẫn có quà');
        const coins2 = st.player.coins, xp2 = own.xp || 0;
        PG.Battle.finishBattle(again.battle, 'player', [], {});
        if (st.player.coins !== coins2) throw new Error('Tái đấu vẫn nhận vàng');
        if ((own.xp || 0) !== xp2 || xp2 < xp) throw new Error('Tái đấu vẫn nhận XP');
        // Sang ngày mới: quà được reset.
        st.dailyDefeats.date = '2000-01-01';
        PG.ensureDaily(true);
        if (st.dailyDefeats.date !== PG.todayKey() || Object.keys(st.dailyDefeats.trainers).length) {
          throw new Error('Quà trainer không reset ngày mới');
        }
        const next = PG.Battle.startTrainer('forest');
        if (!next.ok || next.battle.noReward || !next.battle.reward) throw new Error('Ngày mới vẫn không có quà');
        return '1 lần/ngày • tái đấu 0 quà/0 XP • reset đúng ngày';
      });
    });

    check('Ấp trứng: chỉ bán trứng random tại Chợ → Vật Phẩm', () => {
      return withTempSave(() => {
        const types = PG.EGG_TYPES || {};
        const keys = Object.keys(types);
        if (keys.length !== 1 || !types.random) throw new Error('Vẫn còn trứng chọn hệ: ' + keys.join(', '));
        const def = types.random;
        if (def.type || def.km !== 2 || !def.price) throw new Error('Cấu hình trứng random sai');
        if (!Array.isArray(def.pool) || !def.pool.length || !def.pool.every(id => PG.SPECIES[id])) {
          throw new Error('Bể trứng random có loài sai');
        }
        const st = PG.getState();
        st.player.coins = 100000;
        st.bag.incubator = 2;
        st.eggs = [];
        const before = st.player.coins;
        const bought = PG.buyEgg();
        if (!bought.ok || bought.egg.type !== 'random' || bought.egg.km !== 2) throw new Error('Mua trứng random sai');
        if (st.player.coins !== before - def.price) throw new Error('Giá trứng không đúng');
        // Lệnh cũ có truyền hệ cũng phải trả về trứng random.
        const legacy = PG.buyEgg('water');
        if (!legacy.ok || legacy.egg.type !== 'random') throw new Error('Gọi buyEgg(typeId) vẫn tạo trứng hệ');
        // Save cũ chứa trứng chọn hệ được chuyển về random khi tải lại.
        st.eggs.push({ uid: PG.uid('egg'), type: 'water', km: 5, walked: 3, incubating: true, ready: false });
        const back = PG.importSave(PG.exportSave());
        if (!back.ok) throw new Error(back.msg);
        const loaded = PG.getState();
        if (loaded.eggs.some(e => e.type !== 'random' || e.km !== 2)) throw new Error('Trứng hệ cũ không được chuẩn hóa');
        loaded.bag.incubator = 0;
        const stored = PG.buyEgg();
        if (!stored.ok || stored.egg.incubating) throw new Error('Trứng cần Lò Ấp bị ấp sẵn');
        return def.price + ' Xu • 1 loại random • save cũ tự chuyển đổi';
      });
    });

    check('Save cũ chứa Yu-Gi-Oh! được lọc sạch khi tải lại', () => {
      return withTempSave(() => {
        const snap = PG.exportSave();
        const raw = JSON.parse(decodeURIComponent(escape(atob(snap))));
        const ygoId = 'cross-ygo-dark-magician';
        const ygo = PG.createPokemon('bulbasaur', 5, {});
        ygo.speciesId = ygoId;
        raw.pokemon = [ygo].concat(raw.pokemon || []);
        raw.team = [ygo.uid];
        raw.buddy = ygo.uid;
        raw.pokedex = raw.pokedex || { seen: {}, caught: {} };
        raw.pokedex.seen[ygoId] = 1;
        raw.pokedex.caught[ygoId] = 1;
        raw.market = raw.market || { listings: [], history: [] };
        raw.market.listings = [{ uid: 'mkt_test', pokemon: ygo, price: 500, listedAt: Date.now(), soldAt: Date.now() + 60000, status: 'active' }];
        raw.npcShop = raw.npcShop || { stock: [], lastRestock: Date.now() };
        raw.npcShop.stock = [{ uid: 'npc_test', speciesId: ygoId, level: 5, price: 500, sold: false }];
        raw.roamingTrainer = { name: 'Cũ', team: [[ygoId, 5]], reward: {}, expiresAt: Date.now() + 60000 };
        const back = PG.importSave(btoa(unescape(encodeURIComponent(JSON.stringify(raw)))));
        if (!back.ok) throw new Error(back.msg);
        const st = PG.getState();
        if (st.pokemon.some(p => p.speciesId === ygoId)) throw new Error('Vẫn còn Pokémon Yu-Gi-Oh!');
        if (st.pokedex.seen[ygoId] || st.pokedex.caught[ygoId]) throw new Error('Vẫn còn Pokédex Yu-Gi-Oh!');
        if (st.team.includes(ygo.uid) || st.buddy === ygo.uid) throw new Error('Đội/bạn đồng hành còn tham chiếu hỏng');
        if ((st.market.listings || []).some(l => l.pokemon && l.pokemon.speciesId === ygoId)) throw new Error('Chợ người chơi còn tin Yu-Gi-Oh!');
        if ((st.npcShop.stock || []).some(e => e.speciesId === ygoId)) throw new Error('Chợ NPC còn hàng Yu-Gi-Oh!');
        if (st.roamingTrainer && (st.roamingTrainer.team || []).some(e => e[0] === ygoId)) throw new Error('HLV lang thang còn đội Yu-Gi-Oh!');
        return 'kho/đội/bạn/chợ/Pokédex/HLV lang thang sạch';
      });
    });

    check('Hệ hiển thị/tìm kiếm theo vùng: Indigo & Celadon', () => {
      const same = (a, b) => Array.isArray(a) && a.length === b.length && a.every(x => b.indexOf(x) >= 0);
      const indigo = PG.typesForRegion('indigo');
      const celadon = PG.typesForRegion('celadon');
      if (!same(indigo, ['glitch', 'dragon', 'psychic'])) throw new Error('Indigo: ' + JSON.stringify(indigo));
      if (!same(celadon, ['psychic', 'grass', 'fighting', 'normal', 'fairy', 'fire', 'electric'])) {
        throw new Error('Celadon: ' + JSON.stringify(celadon));
      }
      const all = PG.DEX_ORDER.map(id => PG.SPECIES[id]);
      const inIndigo = all.filter(sp => (sp.habitats || []).includes('indigo'));
      const inCeladon = all.filter(sp => (sp.habitats || []).includes('celadon'));
      // Mỗi hệ khai báo của vùng phải có ít nhất một loài thật trong vùng đó.
      for (const t of indigo) {
        if (!inIndigo.some(sp => sp.types.includes(t))) throw new Error('Indigo thiếu loài hệ ' + t);
      }
      for (const t of celadon) {
        if (!inCeladon.some(sp => sp.types.includes(t))) throw new Error('Celadon thiếu loài hệ ' + t);
      }
      if (!inIndigo.some(sp => sp.types.some(t => indigo.includes(t)))) throw new Error('Indigo không có loài hợp lệ');
      const outside = inIndigo.find(sp => !sp.types.some(t => indigo.includes(t)));
      if (outside && PG.dexMatches(outside, { region: 'indigo' })) {
        throw new Error('Indigo vẫn trả loài hệ ngoài: ' + outside.id);
      }
      const inside = inIndigo.find(sp => sp.types.some(t => indigo.includes(t)));
      if (!PG.dexMatches(inside, { region: 'indigo' })) throw new Error('Indigo lọc sai loài hợp lệ');
      const otherType = inside.types.find(t => !indigo.includes(t));
      if (otherType && PG.dexMatches(inside, { region: 'indigo', type: otherType })) {
        throw new Error('Indigo vẫn trả hệ ' + otherType);
      }
      return 'Indigo ' + indigo.join('/') + ' • Celadon ' + celadon.join('/');
    });

    check('Save cũ chứa Anima 0.3.0 trùng tên được lọc sạch', () => {
      return withTempSave(() => {
        const snap = PG.exportSave();
        const raw = JSON.parse(decodeURIComponent(escape(atob(snap))));
        const removedId = 'cross-anima-faeflux-beta';
        const beta = PG.createPokemon('bulbasaur', 5, {});
        beta.speciesId = removedId;
        raw.pokemon = [beta].concat(raw.pokemon || []);
        raw.team = [beta.uid];
        raw.buddy = beta.uid;
        raw.pokedex = raw.pokedex || { seen: {}, caught: {} };
        raw.pokedex.seen[removedId] = 1;
        raw.pokedex.caught[removedId] = 1;
        raw.market = raw.market || { listings: [], history: [] };
        raw.market.listings = [{ uid: 'mkt_beta', pokemon: beta, price: 500, listedAt: Date.now(), status: 'active' }];
        raw.npcShop = raw.npcShop || { stock: [], lastRestock: Date.now() };
        raw.npcShop.stock = [{ uid: 'npc_beta', speciesId: removedId, level: 5, price: 500, sold: false }];
        raw.roamingTrainer = { name: 'Cũ', team: [[removedId, 5]], reward: {}, expiresAt: Date.now() + 60000 };
        const back = PG.importSave(btoa(unescape(encodeURIComponent(JSON.stringify(raw)))));
        if (!back.ok) throw new Error(back.msg);
        const st = PG.getState();
        if (st.pokemon.some(p => p.speciesId === removedId)) throw new Error('Vẫn còn Anima trùng tên trong kho');
        if (st.pokedex.seen[removedId] || st.pokedex.caught[removedId]) throw new Error('Vẫn còn Pokédex Anima trùng tên');
        if (st.team.includes(beta.uid) || st.buddy === beta.uid) throw new Error('Đội/bạn còn tham chiếu hỏng');
        if ((st.market.listings || []).some(l => l.pokemon && l.pokemon.speciesId === removedId)) throw new Error('Chợ còn tin Anima trùng tên');
        if ((st.npcShop.stock || []).some(e => e.speciesId === removedId)) throw new Error('Chợ NPC còn Anima trùng tên');
        if (st.roamingTrainer && (st.roamingTrainer.team || []).some(e => e[0] === removedId)) throw new Error('HLV lang thang còn Anima trùng tên');
        return PG.REMOVED_ANIMA20D.size + ' id bị gỡ • save cũ tự làm sạch';
      });
    });

    check('100 loài mới dex 9783-9882: id/tên/ảnh riêng, hệ & chỉ số thật', () => {
      const byDex = {};
      for (const id of PG.DEX_ORDER) byDex[PG.SPECIES[id].dex] = PG.SPECIES[id];
      const arts = new Set(), names = new Set();
      for (let d = 9783; d <= 9882; d++) {
        const sp = byDex[d];
        if (!sp || !sp.id.startsWith('sp100a-')) throw new Error('Thiếu loài mới ' + d);
        if (!sp.artDex || sp.artDex === d) throw new Error('Thiếu artDex thật: ' + sp.id);
        if (arts.has(sp.artDex)) throw new Error('Artwork trùng: ' + sp.artDex);
        arts.add(sp.artDex);
        const key = sp.name.toLowerCase();
        if (names.has(key)) throw new Error('Tên trùng: ' + sp.name);
        names.add(key);
        if (!PG.spriteUrl(sp).includes('/official-artwork/' + sp.artDex + '.png')) throw new Error('Ảnh sai: ' + sp.id);
        if (!sp.base || sp.base.length !== 6 || sp.base.some(n => !(n > 0))) throw new Error('Chỉ số sai: ' + sp.id);
        if (sp.types.some(t => !PG.TYPES[t])) throw new Error('Hệ sai: ' + sp.id);
        if (sp.habitats.some(h => !PG.REGIONS[h])) throw new Error('Vùng sai: ' + sp.id);
      }
      return '100 loài • ' + arts.size + ' artwork riêng • tên không trùng';
    });

    check('Độ hiếm chênh chỉ số rõ hơn: Phổ biến < Hiếm < Thần thoại < Huyền thoại', () => {
      const m = PG.RARITY_STAT_MULT;
      if (!(m.common < m.rare && m.rare < m.mythical && m.mythical < m.legendary)) throw new Error('Bậc nhân chỉ số sai');
      const tally = { common: [0, 0], rare: [0, 0], legendary: [0, 0] };
      for (const id of PG.DEX_ORDER) {
        const sp = PG.SPECIES[id];
        if (!sp.baseRaw || sp.baseRaw.length !== 6) throw new Error('Thiếu chỉ số gốc: ' + id);
        if (!(sp.statRarityMult >= 1 && sp.statRarityMult <= m.legendary)) throw new Error('Hệ số hiếm sai: ' + id);
        for (let i = 0; i < 6; i++) {
          const expect = Math.max(1, Math.round(sp.baseRaw[i] * sp.statRarityMult));
          if (sp.base[i] !== expect) throw new Error('Nhân chỉ số sai: ' + id);
        }
        const bucket = sp.rarity === 'legendary' ? 'legendary' : sp.rarity === 'rare' ? 'rare' : 'common';
        tally[bucket][0] += sp.base.reduce((a, b) => a + b, 0);
        tally[bucket][1]++;
      }
      const avg = k => tally[k][1] ? Math.round(tally[k][0] / tally[k][1]) : 0;
      if (!(avg('legendary') > avg('rare') && avg('rare') > avg('common'))) throw new Error('Tổng chỉ số trung bình chưa phân tầng');
      return 'x' + m.common + ' / x' + m.rare + ' / x' + m.mythical + ' / x' + m.legendary +
        ' • BST TB ' + avg('common') + ' → ' + avg('rare') + ' → ' + avg('legendary');
    });

    check('Mã quà motkiki: 10000 Xu + 100 Kim Cương + 1 huyền thoại, 1 lần/lưu', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.player.coins = 0;
        st.player.diamonds = 0;
        const count = st.pokemon.length;
        const r = PG.redeemCode(' MOTKIKI ');
        if (!r.ok) throw new Error(r.msg);
        if (st.player.coins !== 10000 || st.player.diamonds !== 100) throw new Error('Số Xu/Kim Cương sai');
        if (st.pokemon.length !== count + 1) throw new Error('Không nhận được Pokémon');
        const pool = PG.TRUE_LEGENDARIES.filter(id => PG.SPECIES[id]);
        if (!r.pokemon || !pool.includes(r.pokemon.speciesId)) throw new Error('Pokémon không phải huyền thoại');
        if (PG.redeemCode('motkiki').ok) throw new Error('Mã vẫn dùng lại được');
        const back = PG.importSave(PG.exportSave());
        if (!back.ok) throw new Error(back.msg);
        if (PG.redeemCode('motkiki').ok) throw new Error('Tải lại save vẫn dùng được mã');
        return '+10.000 Xu • +100 💎 • ' + PG.SPECIES[r.pokemon.speciesId].name + ' • chặn dùng lại';
      });
    });

    check('Mã quà dio: 100000 Xu + 500 Kim Cương, 1 lần/lưu, không kèm Pokémon', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.player.coins = 0;
        st.player.diamonds = 0;
        const count = st.pokemon.length;
        const r = PG.redeemCode(' DIO ');
        if (!r.ok) throw new Error(r.msg);
        if (st.player.coins !== 100000 || st.player.diamonds !== 500) throw new Error('Số Xu/Kim Cương sai');
        if (st.pokemon.length !== count || r.pokemon) throw new Error('Mã Dio không được tặng Pokémon');
        if (PG.redeemCode('dio').ok) throw new Error('Mã vẫn dùng lại được');
        const back = PG.importSave(PG.exportSave());
        if (!back.ok) throw new Error(back.msg);
        if (PG.redeemCode('dio').ok) throw new Error('Tải lại save vẫn dùng được mã');
        // Hai mã độc lập: đã dùng Dio vẫn có thể dùng motkiki.
        const m = PG.redeemCode('motkiki');
        if (!m.ok) throw new Error('Mã motkiki bị chặn bởi Dio');
        return '+100.000 Xu • +500 💎 • 2 mã độc lập';
      });
    });

    check('Mã quà motlala: 50 Potion + 5 Revive + 20 Razz Berry, 1 lần/lưu', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.bag = {};
        st.player.coins = 0;
        st.player.diamonds = 0;
        const count = st.pokemon.length;
        const r = PG.redeemCode(' MOTLALA ');
        if (!r.ok) throw new Error(r.msg);
        if (st.bag.potion !== 50 || st.bag.revive !== 5 || st.bag.razz !== 20) {
          throw new Error('Sai quà: ' + JSON.stringify(st.bag));
        }
        if (st.player.coins !== 0 || st.player.diamonds !== 0) throw new Error('Mã motlala không cho Xu/Kim Cương');
        if (st.pokemon.length !== count || r.pokemon) throw new Error('Mã motlala không kèm Pokémon');
        if (PG.redeemCode('motlala').ok) throw new Error('Mã vẫn dùng lại được');
        const back = PG.importSave(PG.exportSave());
        if (!back.ok) throw new Error(back.msg);
        if (PG.redeemCode('motlala').ok) throw new Error('Tải lại save vẫn dùng được mã');
        return '50 Potion • 5 Revive • 20 Razz • chặn dùng lại';
      });
    });

    check('Trainer/Gym 6 vùng Kanto: HP nhân theo HV, mang vật phẩm hợp lệ', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.player.level = 100;
        st.player.trainerItems = ['vitality-charm', 'heart-shard', 'god-armor'].map(id => PG.rollTrainerItem(id));
        st.unlockedRegions = ['pallet', 'viridian', 'cerulean', 'vermilion', 'celadon', 'indigo'];
        if (!(PG.trainerBonuses(st).totals.hp > 0)) throw new Error('Đồ HLV không cộng HP để đối trọng');
        if (!st.team.length || !st.pokemon.some(p => p.uid === st.team[0] && p.hp > 0)) {
          const p = PG.createPokemon('pikachu', 50, { minIV: 10, source: 'test' });
          st.pokemon.push(p);
          st.team.unshift(p.uid);
        }
        for (const rid of ['pallet', 'viridian', 'cerulean', 'vermilion', 'celadon', 'indigo']) {
          const r = PG.REGIONS[rid];
          for (const t of [r.trainer, r.gym]) {
            if (!t || !(t.hpMult >= 1)) throw new Error('hpMult sai: ' + rid);
            if (!Array.isArray(t.heldItems) || !t.heldItems.length) throw new Error('Thiếu vật phẩm: ' + rid);
            if (t.heldItems.some(id => !PG.HELD_ITEMS[id])) throw new Error('Vật phẩm không tồn tại: ' + rid);
          }
        }
        // Đối trọng hệ "gương": so sánh HP khi bật/tắt nhân theo chỉ số HV.
        const gym = PG.REGIONS.celadon.gym;
        const saved = gym.mirrorPlayerHp;
        // startGym sinh đội ngẫu nhiên; cố random để hai lần gọi cùng một đội,
        // phép so sánh HP mới phản ánh đúng cờ mirrorPlayerHp.
        const rnd0 = Math.random;
        try {
          Math.random = () => 0.5;
          gym.mirrorPlayerHp = false;
          const normal = PG.Battle.startGym('celadon');
          gym.mirrorPlayerHp = true;
          const mirrored = PG.Battle.startGym('celadon');
          if (!normal.ok || !mirrored.ok) throw new Error('Không mở được trận gym Celadon');
          const baseHp = normal.battle.enemy.team[0].maxHp;
          const mirrorHp = mirrored.battle.enemy.team[0].maxHp;
          if (mirrorHp <= baseHp) throw new Error('HP đối trọng không tăng theo HV: ' + baseHp + ' → ' + mirrorHp);
          if (!mirrored.battle.enemy.team.every(c => c.heldItem && PG.HELD_ITEMS[c.heldItem])) {
            throw new Error('Trainer không mang vật phẩm trong trận');
          }
          return '6 vùng cân bằng • Celadon ' + baseHp + ' → ' + mirrorHp + ' HP';
        } finally {
          gym.mirrorPlayerHp = saved;
          Math.random = rnd0;
        }
      });
    });

    check('HLV lang thang 3/6 con: chọn đúng đội, đổi Pokémon trong trận', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.player.level = 60;
        st.unlockedRegions = ['forest', 'celadon', 'indigo'];
        st.team = [];
        for (let i = 0; i < 6; i++) {
          const p = PG.createPokemon('pikachu', 50 + i, { minIV: 10, source: 'test' });
          st.pokemon.push(p);
          st.team.push(p.uid);
        }
        for (const [id, size] of [['prodigy', 3], ['counterpart', 6]]) {
          const t = (PG.ROAMING_TRAINERS || []).find(x => x.id === id);
          if (!t || t.teamSize !== size) throw new Error('Template lang thang sai: ' + id);
          if (!t.heldItems.length || t.heldItems.some(item => !PG.HELD_ITEMS[item])) throw new Error('Vật phẩm lang thang sai: ' + id);
          // Đổi Pokémon trong trận có thể bị địch đánh ngất; hồi đầy trước mỗi trận để test đúng số lượng.
          for (const p of st.pokemon) p.hp = PG.getStats(p).hp;
          st.roamingTrainer = PG.buildRoamingTrainer('celadon', t);
          if (!st.roamingTrainer || st.roamingTrainer.team.length !== size) throw new Error('Đội hình sai: ' + id);
          const res = PG.Battle.startRoamingTrainer({ uids: st.team.slice(0, size) });
          if (!res.ok) throw new Error(res.msg);
          const b = res.battle;
          if (b.player.team.length !== size || b.enemy.team.length !== size) throw new Error('Số Pokémon trận sai: ' + id);
          if (!b.isRoaming) throw new Error('Trận lang thang không được gắn cờ');
          if (!b.enemy.team.every(c => c.heldItem && PG.HELD_ITEMS[c.heldItem])) throw new Error('Địch không mang vật phẩm: ' + id);
          const sw = PG.Battle.doSwitch(b, 1, []);
          if (!sw.ok || b.player.active !== 1) throw new Error('Không đổi được Pokémon: ' + id);
        }
        return 'Thần Đồng 3 con • Đối Trọng 6 con • đổi đội trong trận OK';
      });
    });

    check('Pokémon hoang dã tăng chỉ số thật, HP khớp thanh máu', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.player.level = 100;
        const enc = PG.spawnEncounter('forest', { speciesId: 'bulbasaur', level: 20 });
        const p = enc.pokemon;
        const bonus = p.bonusStats || {};
        if (!(bonus.hp > 0)) throw new Error('HP hoang dã không tăng');
        for (const k of ['atk', 'def', 'spa', 'spd', 'spe']) {
          if (!(bonus[k] > 0)) throw new Error('Chỉ số ' + k + ' không tăng');
        }
        if (p.hp !== PG.getStats(p).hp) throw new Error('HP khởi tạo lệch chỉ số');
        return 'HP +' + bonus.hp + ' • 5 chỉ số +' + bonus.atk;
      });
    });

    check('Mã quà niggest: nâng HLV lên cấp 30, 1 lần/lưu, không hạ cấp', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.player.level = 1;
        st.player.xp = 0;
        st.player.coins = 500;
        st.player.diamonds = 3;
        const count = st.pokemon.length;
        const r = PG.redeemCode(' NIGGEST ');
        if (!r.ok) throw new Error(r.msg);
        if (st.player.level !== 30) throw new Error('Không lên cấp 30: ' + st.player.level);
        if (st.player.coins !== 500 || st.player.diamonds !== 3) throw new Error('Mã niggest không được cho Xu/Kim Cương');
        if (st.pokemon.length !== count || r.pokemon) throw new Error('Mã niggest không kèm Pokémon');
        if (st.player.stamina < 1 || st.player.staminaMax !== 100 + PG.trainerBonuses(st).totals.stamina) {
          throw new Error('Thể lực không khớp cấp mới');
        }
        if (PG.redeemCode('niggest').ok) throw new Error('Mã vẫn dùng lại được');
        const back = PG.importSave(PG.exportSave());
        if (!back.ok) throw new Error(back.msg);
        if (PG.redeemCode('niggest').ok) throw new Error('Tải lại save vẫn dùng được mã');
        return 'Lv.1 → 30 • không cho Xu/💎/Pokémon • chặn dùng lại';
      });
    });

    check('Mã quà được giấu trong giao diện hồ sơ', () => {
      const view = PG.ui && PG.ui.views && PG.ui.views.profile ? PG.ui.views.profile() : '';
      if (typeof view !== 'string' || !view) throw new Error('Không render được trang hồ sơ');
      const leaked = ['motkiki', 'niggest', 'dio', 'motlala'].filter(code =>
        new RegExp('\\b' + code + '\\b', 'i').test(view));
      if (leaked.length) throw new Error('Lộ mã trong UI: ' + leaked.join(', '));
      if (!/nhập mã bí mật/i.test(view)) throw new Error('Thiếu hướng dẫn nhập mã bí mật');
      return 'Không hiện mã trong hồ sơ và ô nhập';
    });

    check('Phong cách riêng cho chiêu/tuyệt kỹ, ổn định và đa dạng', () => {
      if (!PG.skillStyleOf || !PG.skillStyleDef) throw new Error('Thiếu hệ phong cách chiêu');
      if (!PG.SKILL_STYLE_IDS || PG.SKILL_STYLE_IDS.length < 8) throw new Error('Quá ít phong cách');
      for (const id of PG.SKILL_STYLE_IDS) {
        const def = PG.skillStyleDef(id);
        if (!def || !def.a || !def.b || !def.speed) throw new Error('Phong cách hỏng: ' + id);
      }
      const moves = ['psystrike', 'genesis_wave', 'v-create', 'bolt-strike', 'psybeam', 'tackle'];
      const seen = new Set();
      for (const id of moves) {
        const mv = PG.getMove(id);
        if (!mv) continue;
        const a = PG.skillStyleOf(mv, 'mewtwo');
        if (PG.SKILL_STYLE_IDS.indexOf(a) < 0) throw new Error('Phong cách lạ: ' + a);
        if (PG.skillStyleOf(mv, 'mewtwo') !== a) throw new Error('Phong cách không ổn định: ' + id);
        seen.add(a);
      }
      if (seen.size < 3) throw new Error('Chiêu khác nhau nhưng cùng một phong cách');
      return PG.SKILL_STYLE_IDS.length + ' phong cách • ' + seen.size + ' họa tiết mẫu';
    });

    check('Khu HLV: nhiều người/vùng, quà theo cấp vùng, reset 30 phút, tái đấu không quà', () => {
      return withTempSave(() => {
        const st = PG.getState();
        st.player.level = 100;
        st.unlockedRegions = PG.REGION_ORDER.slice();
        if (!st.team.length || !st.pokemon.some(p => p.uid === st.team[0])) {
          const p = PG.createPokemon('pikachu', 50, { minIV: 10, source: 'test' });
          st.pokemon.push(p);
          st.team.unshift(p.uid);
        }
        for (const p of st.pokemon) p.hp = PG.getStats(p).hp;
        if (!PG.TRAINER_ZONE || !Object.keys(PG.TRAINER_ZONE).length) throw new Error('Không có dữ liệu khu HLV');
        if (PG.TRAINER_ZONE_CYCLE_MS !== 30 * 60 * 1000) throw new Error('Chu kỳ reset không phải 30 phút');
        let total = 0;
        for (const rid of PG.REGION_ORDER) {
          const zone = PG.TRAINER_ZONE[rid];
          if (!zone || zone.trainers.length !== 4) throw new Error('Thiếu HLV ở ' + rid);
          for (const t of zone.trainers) {
            total++;
            if (t.team.length !== 3 || t.team.some(e => !PG.SPECIES[e[0]])) throw new Error('Đội HLV sai: ' + t.id);
            for (const [id, n] of Object.entries(t.reward.items)) if (!PG.itemInfo(id)) throw new Error('Vật phẩm lạ: ' + id);
            for (const [id, n] of Object.entries(t.reward.materials)) if (!PG.itemInfo(id)) throw new Error('Nguyên liệu lạ: ' + id);
          }
          if (zone.trainers[0].reward.coins >= zone.trainers[3].reward.coins) throw new Error('Quà không tăng theo HLV: ' + rid);
        }
        const first = PG.TRAINER_ZONE.forest.trainers[0];
        const deep = PG.TRAINER_ZONE[PG.REGION_ORDER[PG.REGION_ORDER.length - 1]].trainers[0];
        if (!(deep.reward.coins > first.reward.coins)) throw new Error('Quà vùng sâu không cao hơn vùng đầu');
        PG.ensureTrainerZone(true);
        const r = PG.Battle.startZoneTrainer('forest', 0);
        if (!r.ok) throw new Error(r.msg);
        if (!r.battle.zoneTrainer || r.battle.noReward || !r.battle.reward) throw new Error('Trận khu HLV sai');
        if (!/30 phút/.test(r.battle.rewardNote || '')) throw new Error('Thiếu thông báo reset 30 phút');
        st.trainerZone.defeated[first.id] = PG.trainerZoneCycle();
        const again = PG.Battle.startZoneTrainer('forest', 0);
        if (!again.ok || !again.battle.noReward || again.battle.reward) throw new Error('Tái đấu vẫn nhận quà');
        st.trainerZone.cycleKey = PG.trainerZoneCycle() - 1;
        PG.ensureTrainerZone(true);
        if (Object.keys(st.trainerZone.defeated).length || PG.isZoneTrainerDefeated(first.id)) {
          throw new Error('Sang chu kỳ mới không reset danh sách thắng');
        }
        const names = [];
        for (const rid of PG.REGION_ORDER) {
          for (const t of PG.TRAINER_ZONE[rid].trainers) names.push(t.name);
        }
        for (const need of ['Satoshi', 'Jotaro', 'Dio', 'Niggest']) {
          if (!names.includes(need)) throw new Error('Thiếu tên HLV anime: ' + need);
        }
        if (names.some(n => /[à-ỹÀ-Ỵ]/.test(n))) throw new Error('Tên HLV vẫn dùng tiếng Việt');
        return total + ' HLV • ' + PG.REGION_ORDER.length + ' vùng • reset 30p OK';
      });
    });

    /* ---------- KẾT QUẢ ---------- */
    const passed = results.filter(r => r.pass).length;
    const failed = results.length - passed;
    const out = { total: results.length, passed, failed, results };
    if (console.groupCollapsed) {
      console.groupCollapsed('%c🧪 PG.runTests(): ' + passed + '/' + results.length + ' đạt', 'color:#6be3a4;font-weight:bold');
    }
    for (const r of results) {
      if (r.pass) console.log('%c✓ ' + r.name + (r.detail ? ' — ' + r.detail : ''), 'color:#4ade80');
      else console.error('✗ ' + r.name + ' — ' + r.detail);
    }
    console.log(failed ? '❌ Có ' + failed + ' kiểm tra thất bại.' : '✅ Tất cả kiểm tra đều đạt!');
    if (console.groupEnd) console.groupEnd();
    return out;
  }

  PG.runTests = runTests;
  PG.test = runTests;
})();
