/* ============================================================
   KHỞI ĐỘNG: tải trạng thái, dựng khung, định tuyến, vòng lặp game
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;

  /** Bùng nổ được tạo lúc load (silent), báo lại một lần khi giao diện sẵn sàng. */
  function announceOutbreak() {
    const st = PG.getState();
    const ob = st && st.events && st.events.outbreak;
    if (!ob || !PG.SPECIES[ob.speciesId] || ob.endsAt <= Date.now() || ob.announced) return;
    ob.announced = true;
    ui.toast('⚠️ Bùng nổ! ' + ob.speciesName + ' đang xuất hiện dày đặc tại ' + ob.regionName + ' trong 5 phút!', 'gold', 5000);
  }

  function boot() {
    PG.loadState();
    const state = PG.getState();

    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('topbar');
    const bottomNav = document.getElementById('bottom-nav');
    if (sidebar) sidebar.innerHTML = ui.sidebarHtml();
    if (topbar) topbar.innerHTML = ui.topbarHtml();
    if (bottomNav) bottomNav.innerHTML = ui.bottomNavHtml();

    ui.ready = true;
    const hashView = location.hash.replace(/^#\/?/, '');
    if (hashView && ui.views[hashView]) ui.current = hashView;
    else if (location.hash !== '#/home') history.replaceState(null, '', '#/home');
    ui.render({ resetScroll: true });
    announceOutbreak();

    const splash = document.getElementById('splash');
    if (splash) {
      setTimeout(function () {
        splash.classList.add('is-hidden');
        setTimeout(() => splash.remove(), 500);
      }, 280);
    }

    if (!state.player.starterChosen) {
      setTimeout(function () { ui.showStarter(); }, 520);
    }

    startLoops();
    exposeDebugTools();
  }

  function startLoops() {
    // Hồi thể lực + đồng hồ
    setInterval(function () {
      if (!PG.getState()) return;
      const gained = PG.tickStamina(true);
      if (gained > 0) ui.refreshTopbar();
      const healed = PG.tickHeal(true);
      if (healed > 0 && ui.current === 'box') ui.render();
      // Hóa thạch dùng timestamp tuyệt đối: không phụ thuộc ensureDaily().
      if (PG.Fossil && PG.Fossil.tick && PG.Fossil.tick() > 0 && ui.current === 'fossil') ui.render();
      if (PG.Traps && PG.Traps.tick && PG.Traps.tick() > 0 && ui.current === 'idle') ui.render();
    }, 1000);

    // Chợ người chơi
    setInterval(function () {
      if (!PG.getState()) return;
      const sold = PG.processMarket(false);
      if (sold && sold.length) {
        ui.refreshTopbar();
        if (ui.current === 'shop' || ui.current === 'box') ui.render();
      }
    }, 15000);

    // Sang ngày mới
    setInterval(function () {
      if (!PG.getState()) return;
      let refreshed = PG.ensureDaily(true);
      if (PG.ensureTrainerShop(true)) refreshed = true;
      if (PG.ensureGiftBoxShop(true)) refreshed = true;
      if (PG.ensureNpcShop(true)) refreshed = true;
      if (PG.ensureMerchant(true)) refreshed = true;
      if (PG.Tournament && PG.Tournament.ensureDaily()) {
        refreshed = true;
        ui.toast('Giải đấu đã làm mới: quà và 1 lượt thi đấu mới cho ngày hôm nay!', 'gold', 4500);
      }
      if (refreshed) {
        ui.toast('Cửa hàng đã làm mới: quầy Huấn luyện viên 5 món / 30 phút, NPC Pokémon 20 phút, Thương Hội theo vùng.', 'gold', 4500);
        ui.refreshTopbar();
        ui.render();
      }
    }, 60000);

    // Tự động lưu
    setInterval(function () { if (PG.getState()) PG.saveState(true); }, 30000);

    window.addEventListener('beforeunload', function () {
      if (PG.getState()) PG.saveState(true);
    });
  }

  function exposeDebugTools() {
    function needState() {
      const s = PG.getState();
      if (!s) throw new Error('Game chưa tải xong.');
      return s;
    }
    function refresh() {
      if (!ui.ready) return;
      ui.refreshTopbar();
      ui.render();
      PG.saveState(true);
    }

    PG.debug = {
      coins: function (n) { PG.addCoins(Number(n) || 1000); refresh(); return PG.getState().player.coins; },
      stardust: function (n) { PG.addStardust(Number(n) || 1000); refresh(); return PG.getState().player.stardust; },
      diamonds: function (n) { PG.addDiamonds(Number(n) || 10); refresh(); return PG.getState().player.diamonds; },
      stamina: function (n) { PG.restoreStamina(Number(n) || 100); refresh(); return PG.getState().player.stamina; },
      level: function (n) {
        const s = needState();
        s.player.level = Math.max(1, Math.floor(Number(n) || 1));
        s.player.xp = 0;
        refresh();
        return s.player.level;
      },
      items: function (id, n) {
        const s = needState();
        if (!PG.itemInfo(id) || PG.itemInfo(id).kind === 'misc' && id !== 'dust') return 'Không có vật phẩm: ' + id;
        if (PG.MATERIALS[id]) PG.addMaterial(id, Number(n) || 10);
        else PG.addItem(id, Number(n) || 10);
        refresh();
        return PG.countOwned(id);
      },
      spawn: function (speciesId, level, shiny) {
        const s = needState();
        if (!PG.SPECIES[speciesId]) throw new Error('Loài không tồn tại: ' + speciesId);
        const p = PG.createPokemon(speciesId, Number(level) || 10, { forceShiny: !!shiny, minIV: 12, source: 'debug' });
        s.pokemon.push(p);
        if (s.team.length < 6) s.team.push(p.uid);
        PG.recordDex(speciesId, 'caught');
        refresh();
        return p;
      },
      encounter: function (speciesId, level) {
        if (!PG.SPECIES[speciesId]) throw new Error('Loài không tồn tại: ' + speciesId);
        const enc = PG.spawnEncounter(PG.getState().region, { speciesId: speciesId, level: Number(level) || 10 });
        ui.flow.encounter = enc;
        ui.go('catch');
        return enc;
      },
      equipment: function (baseId) {
        const s = needState();
        const item = PG.rollEquipment(baseId || 'clover-ring', { highLuck: true, plus: 3 });
        if (!item) throw new Error('Trang bị không tồn tại: ' + baseId);
        s.equipment.inventory.push(item);
        refresh();
        return item;
      },
      heal: function () { PG.Battle.healTeam(); refresh(); return 'Đã hồi phục đội.'; },
      save: function () { PG.saveState(true); return 'Đã lưu.'; }
    };

    PG.give = PG.debug.items;
    PG.spawn = PG.debug.spawn;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
