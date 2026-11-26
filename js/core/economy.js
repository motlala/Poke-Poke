/* ============================================================
   KINH TẾ: CHỢ, BÁN, CHẾ TẠO, NÂNG CẤP, KHẮC MAY MẮN
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  let pendingEnchant = null;

  function countOwned(id) {
    const state = PG.getState();
    return (state.bag[id] || 0) + (state.materials[id] || 0);
  }
  function consumeOwned(id, n) {
    const state = PG.getState();
    let left = n;
    const fromMat = Math.min(left, state.materials[id] || 0);
    if (fromMat) { state.materials[id] -= fromMat; if (state.materials[id] <= 0) delete state.materials[id]; left -= fromMat; }
    if (left > 0) {
      const fromBag = Math.min(left, state.bag[id] || 0);
      state.bag[id] -= fromBag; if (state.bag[id] <= 0) delete state.bag[id];
      left -= fromBag;
    }
    return left === 0;
  }

  function buyShopItem(uid, qty) {
    const state = PG.getState();
    const entry = state.shop.stock.find(x => x.uid === uid);
    if (!entry) return { ok: false, msg: 'Mặt hàng không tồn tại.' };
    if (entry.sold >= entry.qty) return { ok: false, msg: 'Đã bán hết.' };
    qty = entry.kind === 'equipment' ? 1 : Math.max(1, Math.min(entry.qty - entry.sold, Math.floor(qty || 1)));
    const total = entry.price * qty;
    if (state.player.coins < total) return { ok: false, msg: 'Không đủ Xu (cần ' + PG.fmt(total) + ').' };
    if (entry.kind === 'item' && PG.bagCount() + qty > PG.bagCapacity()) return { ok: false, msg: 'Túi đã đầy. Nâng cấp ba lô hoặc bán bớt.' };
    state.player.coins -= total;
    entry.sold += qty;
    if (entry.kind === 'equipment') {
      const item = PG.rollEquipment(entry.baseId);
      state.equipment.inventory.push(item);
      PG.saveState(true);
      return { ok: true, msg: 'Mua ' + PG.equipName(item) + ' thành công!', equipment: item };
    }
    PG.addItem(entry.id, qty);
    PG.saveState(true);
    return { ok: true, msg: 'Mua ' + qty + ' ' + PG.itemInfo(entry.id).name + ' thành công!' };
  }

  function buyLucky(uid) {
    const state = PG.getState();
    const entry = state.shop.lucky.find(x => x.uid === uid);
    if (!entry) return { ok: false, msg: 'Không tìm thấy.' };
    if (entry.sold) return { ok: false, msg: 'Đã bán.' };
    if (state.player.coins < entry.price) return { ok: false, msg: 'Không đủ Xu.' };
    state.player.coins -= entry.price;
    entry.sold = true;
    state.equipment.inventory.push(entry.item);
    PG.saveState(true);
    return { ok: true, msg: 'Mua ' + PG.equipName(entry.item) + ' thành công!', equipment: entry.item };
  }

  function sellBagItem(id, qty) {
    const state = PG.getState();
    qty = Math.max(1, qty || 1);
    const info = PG.itemInfo(id);
    if (info.kind === 'key' || info.kind === 'misc') return { ok: false, msg: 'Không thể bán vật phẩm này.' };
    const price = Math.max(1, Math.round((info.price || 0) * 0.5));
    if ((state.bag[id] || 0) < qty) return { ok: false, msg: 'Không đủ số lượng.' };
    PG.removeItem(id, qty);
    PG.addCoins(price * qty);
    PG.saveState(true);
    return { ok: true, msg: 'Bán ' + qty + ' ' + info.name + ' được ' + PG.fmt(price * qty) + ' Xu.' };
  }

  function materialBuyPrice(id, regionId) {
    const base = (PG.MATERIALS[id] || {}).price || 10;
    const market = PG.getRegionMarket ? PG.getRegionMarket(regionId || PG.getState().region) : { materialBuy: {} };
    const mult = market.materialBuy[id] || market.materialBuy._ || 1.25;
    return Math.max(1, Math.round(base * mult));
  }

  function materialSellPrice(id, regionId) {
    const base = (PG.MATERIALS[id] || {}).price || 10;
    const market = PG.getRegionMarket ? PG.getRegionMarket(regionId || PG.getState().region) : { materialSell: {} };
    const mult = market.materialSell[id] || market.materialSell._ || 0.55;
    return Math.max(1, Math.round(base * mult));
  }

  function sellMaterial(id, qty) {
    const state = PG.getState();
    qty = Math.max(1, qty || 1);
    const info = PG.MATERIALS[id];
    if (!info) return { ok: false, msg: 'Không phải nguyên liệu.' };
    if ((state.materials[id] || 0) < qty) return { ok: false, msg: 'Không đủ số lượng.' };
    PG.removeMaterial(id, qty);
    const price = materialSellPrice(id, state.region) * qty;
    PG.addCoins(price);
    PG.saveState(true);
    return { ok: true, msg: 'Bán ' + qty + ' ' + info.name + ' được ' + PG.fmt(price) + ' Xu.' };
  }

  /* ---------------- THƯƠNG HỘI ---------------- */
  function merchantOfferName(entry) {
    if (!entry) return 'Hàng hóa';
    if (entry.kind === 'item') return PG.itemInfo(entry.id).name;
    if (entry.kind === 'material') return PG.itemInfo(entry.id).name;
    if (entry.kind === 'equipment') return (PG.EQUIPMENT_BASES[entry.baseId] || {}).name || entry.baseId;
    if (entry.kind === 'trainer') return (PG.TRAINER_ITEMS[entry.itemId] || {}).name || entry.itemId;
    return 'Đổi chác';
  }

  function buyMerchantOffer(uid) {
    if (PG.ensureMerchant) PG.ensureMerchant(true);
    const state = PG.getState();
    const shop = state.merchant || {};
    const entry = (shop.stock || []).find(x => x.uid === uid);
    if (!entry || entry.kind === 'trade' || entry.kind === 'request') return { ok: false, msg: 'Không tìm thấy mặt hàng.' };
    if (entry.sold >= entry.qty) return { ok: false, msg: 'Thương nhân đã bán hết mặt hàng này.' };
    const total = entry.price || 0;
    if (state.player.coins < total) return { ok: false, msg: 'Không đủ Xu (cần ' + PG.fmt(total) + ').' };
    if ((entry.kind === 'item') && PG.bagCount() + 1 > PG.bagCapacity()) return { ok: false, msg: 'Túi đã đầy.' };
    state.player.coins -= total;
    entry.sold += 1;
    let reward = null;
    let name = merchantOfferName(entry);
    if (entry.kind === 'item') {
      PG.addItem(entry.id, 1);
    } else if (entry.kind === 'material') {
      PG.addMaterial(entry.id, entry.qty || 1);
      name = (entry.qty || 1) + ' ' + name;
    } else if (entry.kind === 'equipment') {
      reward = { equipment: Object.assign({ baseId: entry.baseId }, entry.opts || {}) };
      const got = PG.grantReward(reward);
      PG.saveState(true);
      return { ok: true, msg: 'Mua ' + name + ' thành công!', rewards: got, equipment: true };
    } else if (entry.kind === 'trainer') {
      reward = { trainerItems: [entry.itemId] };
      const got = PG.grantReward(reward);
      PG.saveState(true);
      return { ok: true, msg: 'Mua ' + name + ' thành công!', rewards: got, trainerItem: true };
    }
    PG.saveState(true);
    return { ok: true, msg: 'Mua ' + name + ' thành công!', rewards: ['+' + name] };
  }

  /** Bán nguyên liệu cho đơn hàng cần gấp của thương nhân (giá cao hơn chợ). */
  function fulfillMerchantRequest(uid, qty) {
    PG.ensureMerchant && PG.ensureMerchant(true);
    const state = PG.getState();
    const entry = ((state.merchant || {}).stock || []).find(x => x.uid === uid && x.kind === 'request');
    if (!entry) return { ok: false, msg: 'Đơn hàng này đã kết thúc.' };
    const left = Math.max(0, (entry.qty || 1) - (entry.sold || 0));
    if (left <= 0) return { ok: false, msg: 'Đơn hàng này đã được giao đủ.' };
    qty = Math.max(1, Math.min(left, qty || 1));
    const info = PG.MATERIALS[entry.id];
    if (!info) return { ok: false, msg: 'Nguyên liệu không hợp lệ.' };
    if ((state.materials[entry.id] || 0) < qty) {
      return { ok: false, msg: 'Không đủ ' + info.name + ' (cần ' + qty + ').' };
    }
    const price = Math.max(1, entry.price || 0) * qty;
    PG.removeMaterial(entry.id, qty);
    PG.addCoins(price);
    entry.sold = (entry.sold || 0) + qty;
    PG.saveState(true);
    return {
      ok: true, qty, unit: entry.price, total: price,
      msg: 'Giao ' + qty + ' ' + info.name + ' cho thương nhân, nhận ' + PG.fmt(price) + ' Xu (giá cao)!'
    };
  }

  function sellMaterialToMerchant(id, qty) {
    PG.ensureMerchant && PG.ensureMerchant(true);
    const state = PG.getState();
    qty = Math.max(1, qty || 1);
    const info = PG.MATERIALS[id];
    if (!info) return { ok: false, msg: 'Không phải nguyên liệu.' };
    const merchant = PG.MERCHANTS[(state.merchant || {}).merchantId];
    if (merchant && merchant.buys && merchant.buys.length && !merchant.buys.includes(id)) {
      return { ok: false, msg: merchant.name + ' không thu mua ' + info.name + '.' };
    }
    if ((state.materials[id] || 0) < qty) return { ok: false, msg: 'Không đủ số lượng.' };
    const price = materialSellPrice(id, state.region) * qty;
    PG.removeMaterial(id, qty);
    PG.addCoins(price);
    PG.saveState(true);
    return { ok: true, msg: 'Bán ' + qty + ' ' + info.name + ' cho thương nhân được ' + PG.fmt(price) + ' Xu.' };
  }

  function tradeWithMerchant(uid) {
    if (PG.ensureMerchant) PG.ensureMerchant(true);
    const state = PG.getState();
    const entry = ((state.merchant || {}).stock || []).find(x => x.uid === uid && x.kind === 'trade');
    if (!entry) return { ok: false, msg: 'Không tìm thấy giao dịch.' };
    if (entry.sold >= entry.qty) return { ok: false, msg: 'Giao dịch này đã kết thúc.' };
    const give = entry.give || {};
    const coins = give.coins || 0;
    if (state.player.coins < coins) return { ok: false, msg: 'Không đủ Xu (cần ' + PG.fmt(coins) + ').' };
    for (const [mid, n] of Object.entries(give.materials || {})) {
      if (!PG.MATERIALS[mid] || countOwned(mid) < n) return { ok: false, msg: 'Không đủ ' + PG.itemInfo(mid).name + ' (cần ' + n + ').' };
    }
    state.player.coins -= coins;
    for (const [mid, n] of Object.entries(give.materials || {})) consumeOwned(mid, n);
    const got = PG.grantReward(entry.out || {});
    entry.sold += 1;
    PG.saveState(true);
    return { ok: true, msg: 'Đổi thành công! ' + got.join(', '), rewards: got, trade: true };
  }

  function getMerchantOffers() {
    if (PG.ensureMerchant) PG.ensureMerchant(true);
    const state = PG.getState();
    const visit = PG.getMerchantVisit ? PG.getMerchantVisit() : null;
    return {
      merchant: visit && visit.merchant,
      region: state.region,
      stock: (state.merchant && state.merchant.stock) || [],
      nextAt: visit && visit.nextAt,
      buys: (visit && visit.merchant && visit.merchant.buys) || []
    };
  }

  function pokemonSellValue(p) {
    const sp = PG.SPECIES[p.speciesId];
    const rarityMul = sp.rarity === 'legendary' ? 6 : sp.rarity === 'rare' ? 2.2 : 1;
    let value = (PG.cpOf(p) * 0.9 + p.level * 30 + PG.ivPercent(p) * 4) * rarityMul;
    if (p.shiny) value += 12000;
    for (const m of p.mutations || []) {
      if (m === 'shiny') continue;
      value += { shadow: 3000, alpha: 5000, mini: 2000, crystal: 8000, glitch: 4000, 'celestial-aura': 15000, rainbow: 22000, devil: 40000, elemental: 2500 }[m] || 2000;
    }
    return Math.max(150, Math.round(value));
  }

  function sellPokemon(uid) {
    const state = PG.getState();
    const idx = state.pokemon.findIndex(p => p.uid === uid);
    if (idx < 0) return { ok: false, msg: 'Không tìm thấy Pokémon.' };
    const p = state.pokemon[idx];
    if (state.team.includes(uid) || state.buddy === uid) return { ok: false, msg: 'Không thể bán Pokémon trong đội hoặc bạn đồng hành.' };
    if (p.favorite) return { ok: false, msg: 'Pokémon yêu thích không thể bán.' };
    if (state.pokemon.length <= 1) return { ok: false, msg: 'Không thể bán Pokémon cuối cùng.' };
    const value = pokemonSellValue(p);
    const candy = PG.SPECIES[p.speciesId].rarity === 'legendary' ? 10 : PG.SPECIES[p.speciesId].rarity === 'rare' ? 4 : 2;
    state.pokemon.splice(idx, 1);
    PG.addCoins(value);
    PG.addCandy(state, p.speciesId, candy);
    PG.saveState(true);
    return { ok: true, msg: 'Bán ' + PG.SPECIES[p.speciesId].name + ' được ' + PG.fmt(value) + ' Xu và ' + candy + ' Kẹo.' };
  }

  function transferPokemon(uid) {
    const state = PG.getState();
    const idx = state.pokemon.findIndex(p => p.uid === uid);
    if (idx < 0) return { ok: false, msg: 'Không tìm thấy Pokémon.' };
    const p = state.pokemon[idx];
    if (state.team.includes(uid) || state.buddy === uid) return { ok: false, msg: 'Không thể chuyển nhượng Pokémon trong đội hoặc bạn đồng hành.' };
    if (p.favorite) return { ok: false, msg: 'Pokémon yêu thích không thể chuyển nhượng.' };
    if (state.pokemon.length <= 1) return { ok: false, msg: 'Không thể chuyển nhượng Pokémon cuối cùng.' };
    const sp = PG.SPECIES[p.speciesId];
    const candy = sp.rarity === 'legendary' ? 8 : sp.rarity === 'rare' ? 3 : 1;
    const dust = 50 + p.level * 5;
    state.pokemon.splice(idx, 1);
    PG.addCandy(state, p.speciesId, candy);
    PG.addStardust(dust);
    PG.saveState(true);
    return { ok: true, msg: 'Chuyển nhượng ' + sp.name + ': +' + candy + ' Kẹo, +' + dust + ' Bụi Sao.' };
  }

  /* ---------------- DÙNG VẬT PHẨM ---------------- */
  function useMedicine(id, pokemonUid) {
    const state = PG.getState();
    const info = PG.MEDICINES[id];
    if (!info) return { ok: false, msg: 'Không phải thuốc.' };
    if ((state.bag[id] || 0) < 1) return { ok: false, msg: 'Không có ' + info.name + '.' };
    if (info.teamHeal) {
      const r = PG.Battle.healTeam({ consume: 'teampotion' });
      return { ok: r.ok, msg: r.msg };
    }
    if (info.stamina) {
      const got = PG.restoreStamina(info.stamina);
      if (got <= 0) return { ok: false, msg: 'Thể lực đã đầy.' };
      PG.removeItem(id, 1);
      PG.saveState(true);
      return { ok: true, msg: 'Hồi ' + got + ' Thể lực.' };
    }
    const p = state.pokemon.find(x => x.uid === pokemonUid);
    if (!p) return { ok: false, msg: 'Chọn Pokémon để dùng thuốc.' };
    const maxHp = PG.getStats(p).hp;
    if (info.revive) {
      if (p.hp > 0) return { ok: false, msg: 'Pokémon chưa ngất.' };
      p.hp = Math.max(1, Math.round(maxHp * info.revive));
      p.status = null;
      p.statusTurns = 0;
      PG.removeItem(id, 1);
      PG.saveState(true);
      return { ok: true, msg: PG.SPECIES[p.speciesId].name + ' đã hồi sinh!' };
    }
    let msg = '';
    if (info.heal) {
      if (p.hp <= 0) return { ok: false, msg: 'Pokémon đã ngất, cần Revive trước.' };
      if (p.hp < maxHp) {
        const before = p.hp;
        p.hp = Math.min(maxHp, p.hp + info.heal);
        msg = 'Hồi ' + (p.hp - before) + ' HP';
      }
    }
    if (info.cure && p.status) {
      p.status = null;
      p.statusTurns = 0;
      msg += (msg ? ' và ' : '') + 'chữa trạng thái';
    }
    if (!msg) return { ok: false, msg: info.heal && !info.cure ? 'HP đã đầy.' : 'Không có trạng thái xấu.' };
    PG.removeItem(id, 1);
    PG.saveState(true);
    return { ok: true, msg: msg + ' cho ' + PG.SPECIES[p.speciesId].name + '.' };
  }

  /** Mua vật phẩm theo danh mục cố định (giá niêm yết, không random ngày). */
  function buyCatalogItem(id, qty) {
    const state = PG.getState();
    const info = PG.itemInfo(id);
    const inCatalog = Object.keys(PG.CATALOG || {}).some(k => PG.CATALOG[k].includes(id));
    if (!inCatalog || info.kind === 'misc') return { ok: false, msg: 'Mặt hàng không tồn tại.' };
    qty = Math.max(1, Math.floor(qty || 1));
    const total = Math.max(1, Math.round(info.price || 100)) * qty;
    if (state.player.coins < total) return { ok: false, msg: 'Không đủ Xu (cần ' + PG.fmt(total) + ').' };
    if (PG.bagCount() + qty > PG.bagCapacity()) return { ok: false, msg: 'Túi đã đầy, hãy bán bớt đồ.' };
    state.player.coins -= total;
    PG.addItem(id, qty);
    PG.saveState(true);
    return { ok: true, msg: 'Mua ' + qty + ' ' + info.name + ' thành công!' };
  }

  /** Mua trứng ngẫu nhiên. Chỉ có một loại; tham số typeId giữ lại để tương thích save/UI cũ. */
  function buyEgg() {
    const def = PG.EGG_TYPES && PG.EGG_TYPES.random;
    if (!def) return { ok: false, msg: 'Cửa hàng trứng chưa sẵn sàng.' };
    const state = PG.getState();
    if (state.player.coins < def.price) {
      return { ok: false, msg: 'Không đủ Xu (cần ' + PG.fmt(def.price) + ').' };
    }
    if ((state.eggs || []).length >= 9) return { ok: false, msg: 'Tối đa 9 trứng trong kho. Hãy ấp hoặc nở bớt.' };
    state.player.coins -= def.price;
    const egg = PG.addEgg(def.km, true);
    PG.saveState(true);
    return {
      ok: true, egg,
      msg: 'Đã mua ' + def.name + ' (' + def.km + ' km)' +
        (egg.incubating ? ' — đang ấp' : ' — cần Lò Ấp để ấp') + '!'
    };
  }

  /* ---------- HỘP QUÀ BÍ ẨN: may mắn quyết định lời / lỗ ---------- */
  function giftBoxValue(reward) {
    let v = 0;
    if (reward.coins) v += reward.coins;
    if (reward.stardust) v += Math.round(reward.stardust * 0.25);
    if (reward.diamonds) v += reward.diamonds * 25;
    if (reward.items) for (const [id, n] of Object.entries(reward.items)) v += Math.max(1, PG.itemInfo(id).price || 1) * n;
    if (reward.materials) for (const [id, n] of Object.entries(reward.materials)) v += Math.max(1, Math.round((PG.itemInfo(id).price || 50) * 0.55)) * n;
    if (reward.equipment) for (const spec of [].concat(reward.equipment)) {
      const baseId = typeof spec === 'string' ? spec : spec && spec.baseId;
      const base = PG.EQUIPMENT_BASES[baseId];
      if (base) v += (PG.RARITY[base.rarity] || {}).price || 500;
    }
    if (reward.trainerItems) v += 1500 * [].concat(reward.trainerItems).length;
    return Math.round(v);
  }

  /** Quay nội dung hộp. may mắn (luckFx) dịch xác suất lời lên, xác suất lỗ xuống. */
  function rollGiftBoxReward(entry) {
    const def = PG.giftBoxDef && PG.giftBoxDef(entry.boxId);
    if (!def) return null;
    const state = PG.getState();
    const fx = (PG.trainerBonuses(state) || {}).luckFx || {};
    const luckBonus = PG.clamp(((fx.effective || 0) - 60) / 1200, 0, 0.18);
    const roll = Math.random();
    const goodChance = 0.24 + luckBonus;
    const badChance = Math.max(0.08, 0.30 - luckBonus * 0.6);
    let deal, mult;
    if (roll < goodChance) { deal = 'good'; mult = PG.rand(1.45, 2.35); }
    else if (roll < goodChance + badChance) { deal = 'bad'; mult = PG.rand(0.38, 0.78); }
    else { deal = 'fair'; mult = PG.rand(0.95, 1.22); }
    const target = Math.max(50, Math.round(entry.price * mult));

    const catalogIds = Array.from(new Set([].concat(
      (PG.CATALOG && PG.CATALOG.essentials) || [],
      (PG.CATALOG && PG.CATALOG.held) || [],
      (PG.CATALOG && PG.CATALOG.stone) || [],
      (PG.CATALOG && PG.CATALOG.exp) || []
    )));
    const pool = catalogIds.filter(id => {
      const info = PG.itemInfo(id);
      return info.kind !== 'misc' && info.price >= def.itemMin && info.price <= def.itemMax;
    });
    const reward = { items: {} };
    let used = 0;
    for (let i = 0; i < Math.max(1, def.items || 1) && pool.length; i++) {
      const room = Math.max(1, target - used);
      const fit = pool.filter(id => (PG.itemInfo(id).price || 1) <= room * 0.92);
      const pickPool = fit.length ? fit : pool.filter(id => (PG.itemInfo(id).price || 1) <= target * 0.92);
      if (!pickPool.length) break;
      const id = PG.pick(pickPool);
      reward.items[id] = (reward.items[id] || 0) + 1;
      used += PG.itemInfo(id).price || 1;
    }
    if (def.tier === 'high' && PG.chance(0.22 + luckBonus)) {
      const bases = Object.keys(PG.EQUIPMENT_BASES || {});
      if (bases.length) {
        const baseId = PG.pick(bases);
        const base = PG.EQUIPMENT_BASES[baseId];
        reward.equipment = [{ baseId: baseId }];
        used += (PG.RARITY[base.rarity] || {}).price || 500;
      }
    }
    const coins = Math.max(0, target - used);
    if (coins) reward.coins = coins;
    if (def.tier !== 'cheap' && PG.chance(0.5)) {
      reward.stardust = PG.randInt(30, 180) * (def.tier === 'high' ? 3 : 1);
    }
    return { reward: reward, deal: deal, mult: mult, target: target };
  }

  /** Mua + mở ngay hộp quà. Giá trừ trước, nội dung random theo may mắn. */
  function buyGiftBox(uid) {
    const state = PG.getState();
    if (PG.ensureGiftBoxShop) PG.ensureGiftBoxShop(true);
    const shop = state.giftBoxShop || {};
    const entry = (shop.stock || []).find(x => x.uid === uid);
    if (!entry) return { ok: false, msg: 'Hộp quà này đã hết hạn.' };
    if (entry.sold) return { ok: false, msg: 'Hộp quà này đã được mua.' };
    if (state.player.coins < entry.price) return { ok: false, msg: 'Không đủ Xu (cần ' + PG.fmt(entry.price) + ').' };
    if (PG.bagCount() + 4 > PG.bagCapacity()) return { ok: false, msg: 'Túi gần đầy, hãy bán bớt đồ trước khi mở quà.' };
    const roll = rollGiftBoxReward(entry);
    if (!roll) return { ok: false, msg: 'Hộp quà không hợp lệ.' };
    state.player.coins -= entry.price;
    entry.sold = true;
    const coinsBefore = state.player.coins;
    const dustBefore = state.player.stardust;
    const lines = PG.grantReward(roll.reward) || [];
    const bonusGain = (state.player.coins - coinsBefore) + Math.round((state.player.stardust - dustBefore) * 0.25);
    const value = giftBoxValue(roll.reward) - (roll.reward.coins || 0) -
      Math.round((roll.reward.stardust || 0) * 0.25) + bonusGain;
    const ratio = value / Math.max(1, entry.price);
    const dealInfo = {
      good: { icon: '🍀', name: 'May mắn — lời ngon!', tone: 'gold' },
      fair: { icon: '⚖️', name: 'Vừa vặn — gần hòa vốn', tone: 'info' },
      bad: { icon: '😥', name: 'Xui — lỗ nhẹ', tone: 'warn' }
    }[roll.deal];
    PG.saveState(true);
    return {
      ok: true, def: PG.giftBoxDef(entry.boxId), reward: roll.reward, lines: lines,
      price: entry.price, value: value, ratio: ratio, deal: roll.deal, dealInfo: dealInfo,
      msg: dealInfo.icon + ' ' + dealInfo.name + ' — nhận quà trị giá ' + PG.fmt(value) + ' Xu (giá ' + PG.fmt(entry.price) + ').'
    };
  }

  /** Dùng Exp tiêu hao: lên cấp vô hạn, mỗi cấp cộng ngẫu nhiên 1 cột chỉ số. */
  function useExpItem(id, pokemonUid) {
    const state = PG.getState();
    const info = PG.EXP_ITEMS[id];
    if (!info) return { ok: false, msg: 'Không phải Exp.' };
    if ((state.bag[id] || 0) < 1) return { ok: false, msg: 'Không có ' + info.name + '.' };
    const p = state.pokemon.find(x => x.uid === pokemonUid);
    if (!p) return { ok: false, msg: 'Chọn Pokémon để dùng Exp.' };
    const from = p.level;
    const levels = PG.addPokemonXp(p, info.amount, { cap: Infinity });
    PG.removeItem(id, 1);
    PG.saveState(true);
    return {
      ok: true, levels: levels,
      msg: levels
        ? 'Lên cấp ' + from + ' → ' + p.level + '! ' + levels + ' chỉ số ngẫu nhiên đã tăng.'
        : '+' + PG.fmt(info.amount) + ' EXP (cần ' + PG.fmt(PG.xpToNext(p)) + ' để lên cấp).'
    };
  }

  /** Giá sửa vật phẩm cầm tay theo độ khấu hao. */
  function heldRepairCost(pokemonUid) {
    const state = PG.getState();
    const p = state.pokemon.find(x => x.uid === pokemonUid);
    const item = p && p.heldItem && PG.HELD_ITEMS[p.heldItem];
    if (!item || !item.durability) return 0;
    const cur = typeof p.heldDur === 'number' ? p.heldDur : item.durability;
    if (cur >= item.durability) return 0;
    return Math.max(1, Math.round((item.durability - cur) / item.durability * (item.price || 100) * 0.75));
  }

  function repairHeldItem(pokemonUid) {
    const state = PG.getState();
    const p = state.pokemon.find(x => x.uid === pokemonUid);
    const item = p && p.heldItem && PG.HELD_ITEMS[p.heldItem];
    if (!item || !item.durability) return { ok: false, msg: 'Vật phẩm này không cần sửa.' };
    const cost = heldRepairCost(pokemonUid);
    if (!cost) return { ok: false, msg: 'Vật phẩm còn nguyên vẹn.' };
    if (state.player.coins < cost) return { ok: false, msg: 'Không đủ Xu (cần ' + PG.fmt(cost) + ').' };
    state.player.coins -= cost;
    p.heldDur = item.durability;
    PG.saveState(true);
    return { ok: true, cost: cost, msg: 'Đã sửa ' + item.name + ' với ' + PG.fmt(cost) + ' Xu.' };
  }

  function useBagUpgrade() {
    const state = PG.getState();
    if ((state.bag['bag-upgrade'] || 0) < 1) return { ok: false, msg: 'Không có Nâng Cấp Túi.' };
    PG.removeItem('bag-upgrade', 1);
    state.player.bagBonus = (state.player.bagBonus || 0) + 50;
    PG.saveState(true);
    return { ok: true, msg: 'Sức chứa túi tăng thêm 50 (tổng ' + PG.bagCapacity() + ').' };
  }

  function assignHeldItem(pokemonUid, itemId) {
    const state = PG.getState();
    if (!PG.HELD_ITEMS[itemId]) return { ok: false, msg: 'Không phải vật phẩm cầm tay.' };
    if ((state.bag[itemId] || 0) < 1) return { ok: false, msg: 'Không có vật phẩm này.' };
    const p = state.pokemon.find(x => x.uid === pokemonUid);
    if (!p) return { ok: false, msg: 'Không tìm thấy Pokémon.' };
    if (p.heldItem) PG.addItem(p.heldItem, 1);
    PG.removeItem(itemId, 1);
    p.heldItem = itemId;
    p.heldDur = PG.HELD_ITEMS[itemId].durability || null;
    PG.saveState(true);
    return { ok: true, msg: PG.SPECIES[p.speciesId].name + ' đang cầm ' + PG.HELD_ITEMS[itemId].name + '.' };
  }
  function removeHeldItem(pokemonUid) {
    const state = PG.getState();
    const p = state.pokemon.find(x => x.uid === pokemonUid);
    if (!p || !p.heldItem) return { ok: false, msg: 'Không có vật phẩm cầm tay.' };
    PG.addItem(p.heldItem, 1);
    p.heldItem = null;
    p.heldDur = null;
    PG.saveState(true);
    return { ok: true, msg: 'Đã tháo vật phẩm cầm tay.' };
  }

  /* ---------------- TRANG BỊ ---------------- */
  function equipItem(uid) {
    const state = PG.getState();
    const idx = state.equipment.inventory.findIndex(i => i.uid === uid);
    if (idx < 0) return { ok: false, msg: 'Không tìm thấy trang bị.' };
    const item = state.equipment.inventory[idx];
    const base = PG.getEquipBase(item);
    if (!base) return { ok: false, msg: 'Trang bị lỗi.' };
    const old = state.equipment.equipped[base.slot];
    state.equipment.inventory.splice(idx, 1);
    if (old) state.equipment.inventory.push(old);
    state.equipment.equipped[base.slot] = item;
    state.player.staminaMax = PG.staminaMax();
    PG.saveState(true);
    return { ok: true, msg: 'Đã trang bị ' + PG.equipName(item) + '.' };
  }
  function unequipSlot(slot) {
    const state = PG.getState();
    const item = state.equipment.equipped[slot];
    if (!item) return { ok: false, msg: 'Ô trống.' };
    state.equipment.inventory.push(item);
    state.equipment.equipped[slot] = null;
    state.player.staminaMax = PG.staminaMax();
    PG.saveState(true);
    return { ok: true, msg: 'Đã tháo ' + PG.equipName(item) + '.' };
  }

  function upgradeEquipment(uid, useProtection) {
    const state = PG.getState();
    let item = state.equipment.inventory.find(i => i.uid === uid);
    if (!item) {
      for (const s of PG.SLOTS) {
        const e = state.equipment.equipped[s.id];
        if (e && e.uid === uid) { item = e; break; }
      }
    }
    if (!item) return { ok: false, msg: 'Không tìm thấy trang bị.' };
    if ((item.plus || 0) >= PG.EQUIPMENT_MAX_PLUS) return { ok: false, msg: 'Đã đạt cấp tối đa +' + PG.EQUIPMENT_MAX_PLUS + '.' };
    const cost = PG.upgradeCost(item);
    if (state.player.coins < cost.coins) return { ok: false, msg: 'Không đủ Xu.' };
    for (const [mid, n] of Object.entries(cost.mats)) {
      if (countOwned(mid) < n) return { ok: false, msg: 'Thiếu ' + PG.itemInfo(mid).name + ' (cần ' + n + ').' };
    }
    if (useProtection && (state.bag['protection-charm'] || 0) < 1) return { ok: false, msg: 'Không có Bùa Bảo Vệ.' };
    state.player.coins -= cost.coins;
    for (const [mid, n] of Object.entries(cost.mats)) consumeOwned(mid, n);
    if (useProtection) PG.removeItem('protection-charm', 1);
    const fail = PG.chance(PG.upgradeFailChance(item.plus || 0));
    if (fail) {
      let downgraded = false;
      if (!useProtection && (item.plus || 0) > 0 && PG.chance(0.5)) { item.plus--; downgraded = true; }
      PG.saveState(true);
      return { ok: false, msg: 'Nâng cấp thất bại!' + (useProtection ? ' Bùa đã bảo vệ trang bị.' : downgraded ? ' Trang bị tụt xuống +' + item.plus + '.' : ' Trang bị giữ nguyên.') };
    }
    item.plus = (item.plus || 0) + 1;
    PG.saveState(true);
    return { ok: true, msg: 'Nâng cấp thành công! ' + PG.equipName(item) };
  }

  /** Nâng cấp bằng cách hiến tế một món đồ trong kho. Món hiến tế luôn mất;
   *  tỉ lệ lên/tụt cấp dựa trên giá trị (độ hiếm, +, may mắn) của món đó. */
  function sacrificeUpgrade(targetUid, offeringUid) {
    const state = PG.getState();
    const inv = state.equipment.inventory;
    let target = inv.find(i => i.uid === targetUid);
    if (!target) {
      for (const s of PG.SLOTS) {
        const e = state.equipment.equipped[s.id];
        if (e && e.uid === targetUid) { target = e; break; }
      }
    }
    if (!target) return { ok: false, msg: 'Không tìm thấy trang bị cần nâng cấp.' };
    if (!targetUid || targetUid === offeringUid) return { ok: false, msg: 'Không thể hiến tế chính nó.' };
    if ((target.plus || 0) >= PG.EQUIPMENT_MAX_PLUS) {
      return { ok: false, msg: 'Đã đạt cấp tối đa +' + PG.EQUIPMENT_MAX_PLUS + '.' };
    }
    const idx = inv.findIndex(i => i.uid === offeringUid);
    if (idx < 0) return { ok: false, msg: 'Chọn một món đồ trong kho để hiến tế.' };
    const offering = inv[idx];
    const chance = PG.sacrificeChance(target, offering);
    const worth = PG.equipmentWorth(offering);
    inv.splice(idx, 1);
    const success = PG.chance(chance);
    const before = target.plus || 0;
    if (success) target.plus = Math.min(PG.EQUIPMENT_MAX_PLUS, before + 1);
    else target.plus = Math.max(0, before - 1);
    PG.saveState(true);
    return {
      ok: true, success, chance, before, after: target.plus, worth,
      msg: success
        ? '🔥 Hiến tế ' + PG.equipName(offering) + ' (trị giá ' + PG.fmt(worth) + '): ' + PG.equipName(target) + ' lên +' + target.plus + '!'
        : '💔 Hiến tế ' + PG.equipName(offering) + ' thất bại: ' + PG.equipName(target) + ' tụt xuống +' + target.plus + '.'
    };
  }

  function prepareEnchant(uid, locks) {
    const state = PG.getState();
    let item = state.equipment.inventory.find(i => i.uid === uid);
    if (!item) {
      for (const s of PG.SLOTS) {
        const e = state.equipment.equipped[s.id];
        if (e && e.uid === uid) { item = e; break; }
      }
    }
    if (!item) return { ok: false, msg: 'Không tìm thấy trang bị.' };
    if ((item.enchantCount || 0) >= 5) return { ok: false, msg: 'Trang bị đã khắc tối đa 5 lần.' };
    const lockList = (locks || []).filter(k => k !== 'luck');
    const cost = PG.enchantCost(item);
    cost.clovers += lockList.length;
    if (state.player.coins < cost.coins) return { ok: false, msg: 'Không đủ Xu.' };
    if ((state.bag['lucky-clover'] || 0) < cost.clovers) return { ok: false, msg: 'Cần ' + cost.clovers + ' Đá Cỏ Bốn Lá.' };
    const [lo, hi] = PG.luckRange(item.rarity);
    const base = PG.getEquipBase(item);
    const newLuck = Math.max(0, Math.round(PG.rand(lo, hi) + (base.baseStats.luck || 0) * 0.7));
    const newStats = Object.assign({}, item.stats);
    const statKeys = ['heat', 'cold', 'sand', 'stamina', 'bag', 'rareFind', 'accuracy', 'speed', 'dodge'];
    const available = statKeys.filter(k => !lockList.includes(k));
    const changedKey = available.length ? PG.pick(available) : null;
    if (changedKey) {
      const baseVal = base.baseStats[changedKey] || 0;
      const range = Math.max(2, Math.round(2 + (PG.RARITY[item.rarity].luck[1] || 5) * 0.5));
      newStats[changedKey] = Math.max(0, Math.round(baseVal * PG.rand(0.7, 1.35) + PG.rand(-range, range)));
    }
    pendingEnchant = { uid, oldLuck: item.luck, newLuck, oldStats: PG.deepClone(item.stats), newStats, cost, locked: lockList };
    return { ok: true, preview: pendingEnchant, item };
  }

  function applyEnchant() {
    if (!pendingEnchant) return { ok: false, msg: 'Không có kết quả khắc.' };
    const state = PG.getState();
    let item = state.equipment.inventory.find(i => i.uid === pendingEnchant.uid);
    if (!item) {
      for (const s of PG.SLOTS) {
        const e = state.equipment.equipped[s.id];
        if (e && e.uid === pendingEnchant.uid) { item = e; break; }
      }
    }
    if (!item) return { ok: false, msg: 'Không tìm thấy trang bị.' };
    const p = pendingEnchant;
    if (state.player.coins < p.cost.coins || (state.bag['lucky-clover'] || 0) < p.cost.clovers) {
      pendingEnchant = null;
      return { ok: false, msg: 'Tài nguyên đã thay đổi, không đủ để khắc.' };
    }
    state.player.coins -= p.cost.coins;
    PG.removeItem('lucky-clover', p.cost.clovers);
    item.luck = p.newLuck;
    item.stats = PG.deepClone(p.newStats);
    item.enchantCount = (item.enchantCount || 0) + 1;
    pendingEnchant = null;
    PG.saveState(true);
    return { ok: true, msg: 'Khắc May mắn thành công! Luck mới: ' + item.luck };
  }
  function cancelEnchant() { pendingEnchant = null; return { ok: true }; }
  function getPendingEnchant() { return pendingEnchant; }

  /** Khắc hệ cho trang bị: chọn 1 hệ, chiêu cùng hệ gây thêm sát thương khi mặc. */
  function engraveEquipment(uid, type) {
    const state = PG.getState();
    let item = state.equipment.inventory.find(i => i.uid === uid);
    if (!item) {
      for (const s of PG.SLOTS) {
        const e = state.equipment.equipped[s.id];
        if (e && e.uid === uid) { item = e; break; }
      }
    }
    if (!item) return { ok: false, msg: 'Không tìm thấy trang bị.' };
    if (!PG.TYPES || !PG.TYPES[type]) return { ok: false, msg: 'Hệ không hợp lệ.' };
    if (item.element === type) return { ok: false, msg: 'Trang bị đã khắc hệ này rồi.' };
    const cost = PG.engraveCost(item);
    if (state.player.coins < cost.coins) return { ok: false, msg: 'Không đủ Xu để khắc hệ.' };
    for (const [id, n] of Object.entries(cost.mats)) {
      if (n && countOwned(id) < n) return { ok: false, msg: 'Thiếu ' + PG.itemInfo(id).name + ' (cần ' + n + ').' };
    }
    state.player.coins -= cost.coins;
    for (const [id, n] of Object.entries(cost.mats)) if (n) consumeOwned(id, n);
    item.element = type;
    PG.saveState(true);
    return { ok: true, msg: 'Đã khắc hệ ' + PG.TYPES[type].icon + ' ' + PG.TYPES[type].name + ' (+' +
      Math.round((PG.elementBoost(item) - 1) * 100) + '% sát thương hệ này).' };
  }

  /* ---------------- CHẾ TẠO ---------------- */
  function canCraft(recipe) {
    const state = PG.getState();
    if (state.player.level < recipe.unlock) return { ok: false, msg: 'Cần cấp ' + recipe.unlock };
    if (state.player.coins < recipe.coins) return { ok: false, msg: 'Không đủ Xu' };
    for (const [id, n] of Object.entries(recipe.mats)) {
      if (countOwned(id) < n) return { ok: false, msg: 'Thiếu ' + PG.itemInfo(id).name + ' (' + countOwned(id) + '/' + n + ')' };
    }
    return { ok: true };
  }

  function craftRecipe(recipeId) {
    const state = PG.getState();
    const recipe = PG.RECIPES[recipeId];
    if (!recipe) return { ok: false, msg: 'Công thức không tồn tại.' };
    const check = canCraft(recipe);
    if (!check.ok) return check;
    state.player.coins -= recipe.coins;
    for (const [id, n] of Object.entries(recipe.mats)) consumeOwned(id, n);
    let msg = 'Chế tạo thành công: ' + recipe.name;
    if (recipe.out.equipment) {
      const item = PG.rollEquipment(recipe.out.equipment);
      state.equipment.inventory.push(item);
      msg += ' (' + PG.equipName(item) + ')';
    } else {
      for (const [id, n] of Object.entries(recipe.out)) {
        if (id === 'equipment') continue;
        PG.addItem(id, n);
        msg += ' x' + n;
      }
    }
    PG.saveState(true);
    return { ok: true, msg };
  }

  function buyRod(rodId) {
    const state = PG.getState();
    const rod = PG.RODS[rodId];
    if (!rod) return { ok: false, msg: 'Cần câu không tồn tại.' };
    if (state.fishing.rod === rodId) return { ok: false, msg: 'Đang dùng cần này.' };
    if (state.player.coins < rod.price) return { ok: false, msg: 'Không đủ Xu.' };
    state.player.coins -= rod.price;
    state.fishing.rod = rodId;
    state.fishing.rodLevel = 0;
    PG.saveState(true);
    return { ok: true, msg: 'Đã mua ' + rod.name + '!' };
  }

  function upgradeRod() {
    const state = PG.getState();
    if ((state.fishing.rodLevel || 0) >= 10) return { ok: false, msg: 'Cần câu đã đạt +10.' };
    const cost = PG.rodUpgradeCost(state.fishing.rodLevel || 0);
    if (state.player.coins < cost.coins) return { ok: false, msg: 'Không đủ Xu.' };
    for (const [id, n] of Object.entries(cost.mats)) if (countOwned(id) < n) return { ok: false, msg: 'Thiếu ' + PG.itemInfo(id).name };
    state.player.coins -= cost.coins;
    for (const [id, n] of Object.entries(cost.mats)) consumeOwned(id, n);
    state.fishing.rodLevel = (state.fishing.rodLevel || 0) + 1;
    PG.saveState(true);
    return { ok: true, msg: 'Nâng cấp cần câu lên +' + state.fishing.rodLevel + '!' };
  }

  function startBait(id) {
    const state = PG.getState();
    const bait = PG.BAITS[id];
    if (!bait) return { ok: false, msg: 'Mồi không hợp lệ.' };
    if ((state.bag[id] || 0) < 1) return { ok: false, msg: 'Không có mồi này.' };
    PG.removeItem(id, 1);
    state.fishing.activeBait = { id, uses: bait.uses };
    PG.saveState(true);
    return { ok: true, msg: 'Đã dùng ' + bait.name + ' (' + bait.uses + ' lượt).' };
  }

  function randomEquipmentDrop(state, opts) {
    const o = opts || {};
    const fx = PG.trainerBonuses(state).luckFx;
    const bonus = Math.min(2, (fx.effective || 0) * 0.01);
    const roll = Math.random() * 100;
    let rarity = 'common';
    if (roll < 1.2 + bonus) rarity = 'legendary';
    else if (roll < 8 + bonus * 2) rarity = 'epic';
    else if (roll < 30 + bonus * 3) rarity = 'rare';
    if (o.rarity) rarity = o.rarity;
    const bases = Object.keys(PG.EQUIPMENT_BASES).filter(id => PG.EQUIPMENT_BASES[id].rarity === rarity);
    if (!bases.length) return null;
    const item = PG.rollEquipment(PG.pick(bases), { highLuck: o.highLuck });
    state.equipment.inventory.push(item);
    return item;
  }

  /** Tạo và cất một món trang bị vào kho (dùng cho thưởng giải đấu, sự kiện…). */
  function grantEquipment(baseId, opts) {
    const o = opts || {};
    if (typeof baseId !== 'string' || !PG.EQUIPMENT_BASES[baseId]) return null;
    const item = PG.rollEquipment(baseId, o);
    if (!item) return null;
    const st = PG.getState();
    if (!st || !st.equipment) return null;
    st.equipment.inventory.push(item);
    return item;
  }

  function equipmentSellValue(item) {
    const base = PG.getEquipBase(item);
    if (!base) return 100;
    return Math.round(PG.RARITY[base.rarity].price * 0.45 + (item.plus || 0) * 250 + (item.luck || 0) * 30);
  }
  function sellEquipment(uid) {
    const state = PG.getState();
    const idx = state.equipment.inventory.findIndex(i => i.uid === uid);
    if (idx < 0) return { ok: false, msg: 'Trang bị đang mặc, hãy tháo trước.' };
    const item = state.equipment.inventory[idx];
    const value = equipmentSellValue(item);
    state.equipment.inventory.splice(idx, 1);
    PG.addCoins(value);
    PG.saveState(true);
    return { ok: true, msg: 'Bán ' + PG.equipName(item) + ' được ' + PG.fmt(value) + ' Xu.' };
  }

  /** Mua vật phẩm Huấn luyện viên: gắn vĩnh viễn vào player.trainerItems. */
  function buyTrainerItem(uid) {
    const state = PG.getState();
    const entry = (state.trainerShop && state.trainerShop.stock || []).find(x => x.uid === uid);
    if (!entry) return { ok: false, msg: 'Mặt hàng không tồn tại.' };
    if (entry.sold) return { ok: false, msg: 'Đã bán.' };
    if (!PG.TRAINER_ITEMS[entry.itemId]) return { ok: false, msg: 'Vật phẩm không hợp lệ.' };
    if (state.player.coins < entry.price) return { ok: false, msg: 'Không đủ Xu (cần ' + PG.fmt(entry.price) + ').' };
    const item = PG.rollTrainerItem(entry.itemId);
    if (!item) return { ok: false, msg: 'Không thể tạo vật phẩm.' };
    state.player.coins -= entry.price;
    entry.sold = true;
    state.player.trainerItems = state.player.trainerItems || [];
    state.player.trainerItems.push(item);
    PG.saveState(true);
    return { ok: true, msg: 'Đã gắn ' + item.name + ' cho Huấn luyện viên!', item };
  }

  /** Mua Pokémon từ NPC. Không tính vào stats bắt thường nhưng vẫn ghi Pokédex. */
  function buyNpcPokemon(uid) {
    const state = PG.getState();
    PG.ensureNpcShop(true);
    const entry = (state.npcShop && state.npcShop.stock || []).find(x => x.uid === uid);
    if (!entry) return { ok: false, msg: 'Pokémon không còn trong quầy.' };
    if (entry.sold) return { ok: false, msg: 'Đã bán.' };
    if (!PG.SPECIES[entry.speciesId]) return { ok: false, msg: 'Loài không hợp lệ.' };
    if (state.player.coins < entry.price) return { ok: false, msg: 'Không đủ Xu (cần ' + PG.fmt(entry.price) + ').' };
    const p = PG.createPokemon(entry.speciesId, entry.level, {
      minIV: entry.minIV || 5,
      forceShiny: !!entry.shiny,
      source: 'npc'
    });
    state.player.coins -= entry.price;
    entry.sold = true;
    state.pokemon.push(p);
    if (state.team.length < 6) state.team.push(p.uid);
    PG.recordDex(p.speciesId, 'caught');
    PG.saveState(true);
    return { ok: true, msg: 'Chúc mừng! Bạn đã mua được ' + PG.SPECIES[p.speciesId].name + '.', pokemon: p };
  }

  PG.countOwned = countOwned;
  PG.consumeOwned = consumeOwned;
  PG.buyShopItem = buyShopItem;
  PG.buyLucky = buyLucky;
  PG.buyTrainerItem = buyTrainerItem;
  PG.buyNpcPokemon = buyNpcPokemon;
  PG.sellBagItem = sellBagItem;
  PG.sellMaterial = sellMaterial;
  PG.pokemonSellValue = pokemonSellValue;
  PG.sellPokemon = sellPokemon;
  PG.transferPokemon = transferPokemon;
  PG.useMedicine = useMedicine;
  PG.buyCatalogItem = buyCatalogItem;
  PG.buyEgg = buyEgg;
  PG.giftBoxValue = giftBoxValue;
  PG.rollGiftBoxReward = rollGiftBoxReward;
  PG.buyGiftBox = buyGiftBox;
  PG.useExpItem = useExpItem;
  PG.heldRepairCost = heldRepairCost;
  PG.repairHeldItem = repairHeldItem;
  PG.useBagUpgrade = useBagUpgrade;
  PG.assignHeldItem = assignHeldItem;
  PG.removeHeldItem = removeHeldItem;
  PG.equipItem = equipItem;
  PG.unequipSlot = unequipSlot;
  PG.upgradeEquipment = upgradeEquipment;
  PG.sacrificeUpgrade = sacrificeUpgrade;
  PG.prepareEnchant = prepareEnchant;
  PG.applyEnchant = applyEnchant;
  PG.cancelEnchant = cancelEnchant;
  PG.getPendingEnchant = getPendingEnchant;
  PG.engraveEquipment = engraveEquipment;
  PG.canCraft = canCraft;
  PG.craftRecipe = craftRecipe;
  PG.buyRod = buyRod;
  PG.upgradeRod = upgradeRod;
  PG.startBait = startBait;
  PG.randomEquipmentDrop = randomEquipmentDrop;
  PG.grantEquipment = grantEquipment;
  PG.materialBuyPrice = materialBuyPrice;
  PG.materialSellPrice = materialSellPrice;
  PG.buyMerchantOffer = buyMerchantOffer;
  PG.sellMaterialToMerchant = sellMaterialToMerchant;
  PG.fulfillMerchantRequest = fulfillMerchantRequest;
  PG.tradeWithMerchant = tradeWithMerchant;
  PG.getMerchantOffers = getMerchantOffers;
  PG.equipmentSellValue = equipmentSellValue;
  PG.sellEquipment = sellEquipment;
})();
