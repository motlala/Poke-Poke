/* ============================================================
   HỒ SƠ: thống kê, huy hiệu, cài đặt, lưu / xuất / nhập game
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  function st() { return PG.getState(); }
  const giftFmt = n => Math.round(n || 0).toLocaleString('vi-VN');
  const AVATARS = [
    '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🚀', '👩‍🚀', '🥷', '🦊', '🐱',
    '🐉', '🤖', '👾', '🧙', '🦸', '🧑‍🍳', '🎃', '⭐',
    '🌟', '🔥', '💎', '⚡', '🌈', '🐼', '🦁', '🐸'
  ];

  function playtime() {
    const ms = Date.now() - st().createdAt;
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (days > 0) return days + ' ngày ' + hours + ' giờ';
    if (hours > 0) return hours + ' giờ ' + mins + ' phút';
    return mins + ' phút';
  }

  function statGrid() {
    const s = st().stats;
    const rows = [
      ['🎯', 'Pokémon đã bắt', PG.fmt(s.catches || 0)],
      ['👟', 'Quãng đường', PG.fmtKm(s.km || 0)],
      ['✨', 'Shiny', PG.fmt(s.shinies || 0)],
      ['📕', 'Loài sưu tầm', PG.fmt(s.speciesCaught || 0)],
      ['⚔️', 'Trận thắng', PG.fmt(s.battlesWon || 0)],
      ['🏅', 'Huy hiệu Gym', (st().badges.length) + '/' + PG.REGION_ORDER.length],
      ['🏆', 'Vòng giải cao nhất', PG.fmt(s.tournamentBest || 0)],
      ['🥇', 'Trận giải thắng', PG.fmt(s.tournamentWins || 0)],
      ['👹', 'Raid hạ gục', PG.fmt(s.raidsWon || 0)],
      ['🎣', 'Câu cá', PG.fmt(s.fishCaught || 0)],
      ['🥚', 'Trứng nở', PG.fmt(s.eggsHatched || 0)],
      ['🧬', 'Tiến hóa', PG.fmt(s.evolutions || 0)],
      ['⬆️', 'Nâng cấp', PG.fmt(s.powerUps || 0)],
      ['💥', 'Chí mạng', PG.fmt(s.crits || 0)],
      ['💨', 'Né đòn', PG.fmt(s.dodges || 0)],
      ['🎯', 'Ném Tuyệt vời', PG.fmt(s.excellent || 0)],
      ['🌌', 'Thiên Khắc', PG.fmt(s.celestialFractures || 0)]
    ];
    return '<div class="profile-stat-grid">' + rows.map(r =>
      '<div class="profile-stat"><span class="profile-stat__icon">' + r[0] + '</span>' +
      '<span class="profile-stat__body"><small>' + r[1] + '</small><b>' + r[2] + '</b></span></div>').join('') + '</div>';
  }

  function badgePanel() {
    const state = st();
    return '<section class="panel profile-badges"><div class="panel__head"><h3 class="panel__title">🏅 Huy Hiệu</h3>' +
      '<span class="badge">' + state.badges.length + '/' + PG.REGION_ORDER.length + '</span></div>' +
      '<div class="badge-grid">' + PG.REGION_ORDER.map(rid => {
        const r = PG.REGIONS[rid];
        const has = state.badges.includes(rid);
        return '<div class="gym-badge' + (has ? ' is-earned' : '') + '">' +
          '<span class="gym-badge__icon">' + (has ? r.gym.badgeIcon : '🔒') + '</span>' +
          '<div><strong>' + esc(r.gym.badge) + '</strong><small>' + esc(r.gym.leader) + ' • ' + r.name + '</small></div></div>';
      }).join('') + '</div></section>';
  }

  function teamPanel() {
    const state = st();
    const team = state.team.map(uid => state.pokemon.find(p => p.uid === uid)).filter(Boolean);
    return '<section class="panel profile-team"><div class="panel__head"><h3 class="panel__title">⚔️ Đội Hình</h3>' +
      '<button class="btn btn--ghost btn--sm" data-act="go" data-view="box">Quản lý</button></div>' +
      (team.length ? '<div class="profile-team-row">' + team.map(p => {
        const sp = PG.SPECIES[p.speciesId];
        return '<button class="profile-mon" data-act="open-pokemon" data-uid="' + p.uid + '">' + ui.spriteHtml(p, { size: 'md' }) +
          '<strong>' + esc(sp.name) + '</strong><small>Lv.' + p.level + ' • CP ' + PG.fmt(PG.cpOf(p)) + '</small></button>';
      }).join('') + '</div>' : '<p class="muted">Chưa có Pokémon trong đội.</p>') +
    '</section>';
  }

  function settingsPanel() {
    const s = st().settings;
    const items = [
      { key: 'sound', label: '🔊 Âm thanh', desc: 'Hiệu ứng âm thanh tổng hợp bằng WebAudio.' },
      { key: 'fast', label: '⏩ Chiến đấu nhanh', desc: 'Giảm thời gian chờ khi xem diễn biến trận đấu.' },
      { key: 'particles', label: '✨ Hiệu ứng hạt', desc: 'Bật hiệu ứng nền và hạt trang trí.' },
      { key: 'reduceMotion', label: '🛡️ Giảm chuyển động', desc: 'Hạn chế animation nếu bạn nhạy cảm với chuyển động.' }
    ];
    return '<section class="panel profile-settings"><div class="panel__head"><h3 class="panel__title">⚙️ Cài Đặt</h3></div>' +
      items.map(it => '<label class="setting-row"><div><strong>' + it.label + '</strong><small>' + it.desc + '</small></div>' +
        '<span class="switch"><input type="checkbox" data-change="profile-setting" data-key="' + it.key + '"' + (s[it.key] ? ' checked' : '') + '><span class="switch__track"></span></span></label>').join('') +
    '</section>';
  }

  function redeemPanel() {
    // Mã quà được giấu: chỉ người gửi mới biết nội dung, giao diện không gợi ý
    // mã nào đang hoạt động — kể cả trong placeholder của ô nhập.
    const usedCodes = st().redeemedCodes || {};
    const usedCount = Object.keys(usedCodes).length;
    return '<section class="panel profile-redeem"><div class="panel__head">' +
      '<h3 class="panel__title">🎁 Nhập Mã Quà</h3>' +
      '<span class="badge">' + usedCount + ' mã đã dùng</span></div>' +
      '<p class="muted small">Nhập mã bí mật bạn nhận được. Mỗi mã chỉ dùng được một lần trên bản lưu này.</p>' +
      '<button class="btn btn--gold btn--block" data-act="profile-redeem">🎟️ Nhập mã</button>' +
      '</section>';
  }

  function savePanel() {
    const state = st();
    return '<section class="panel profile-save"><div class="panel__head"><h3 class="panel__title">💾 Dữ Liệu</h3>' +
      '<span class="muted small">Tự động lưu trên máy</span></div>' +
      '<p class="muted small">Lần lưu cuối: ' + (state.lastSave ? PG.relTime(state.lastSave) : 'chưa lưu') + ' • Tạo lúc ' + PG.formatDate(state.createdAt) + '</p>' +
      '<div class="save-actions">' +
        '<button class="btn btn--primary btn--block" data-act="profile-save">💾 Lưu ngay</button>' +
        '<button class="btn btn--ghost btn--block" data-act="profile-export">📤 Xuất mã lưu</button>' +
        '<button class="btn btn--ghost btn--block" data-act="profile-import">📥 Nhập mã lưu</button>' +
        '<button class="btn btn--danger btn--block" data-act="profile-reset">🗑️ Xóa toàn bộ tiến trình</button>' +
      '</div>' +
      '<p class="muted small">Mã lưu là chuỗi Base64 chứa toàn bộ dữ liệu. Hãy sao lưu thường xuyên!</p>' +
    '</section>';
  }

  ui.views.profile = function () {
    const state = st();
    const p = state.player;
    const prog = PG.playerLevelProgress(state);
    const dex = PG.dexCounts();
    const bonuses = PG.trainerBonuses(state);
    const fx = bonuses.luckFx;
    return '<div class="profile-page">' +
      '<div class="profile-hero">' +
        '<div class="profile-hero__bg"></div>' +
        '<div class="profile-hero__avatar">' + p.avatar + '</div>' +
        '<div class="profile-hero__info"><span class="eyebrow">Huấn luyện viên</span>' +
          '<h1>' + esc(p.name) + '</h1>' +
          '<div class="profile-hero__tags"><span class="pill pill--gold">Cấp ' + p.level + '</span>' +
            '<span class="pill">⚔️ ' + PG.fmt(bonuses.totals.atk || 0) + '</span>' +
            '<span class="pill">🛡️ ' + PG.fmt(bonuses.totals.def || 0) + '</span>' +
            '<span class="pill">✨ May mắn ' + PG.fmt(bonuses.totals.luck || 0) + '</span>' +
            '<span class="pill">⏱️ ' + playtime() + '</span></div>' +
          '<div class="profile-xp"><div class="mini-bar mini-bar--xp"><span style="width:' + (prog.pct * 100) + '%"></span></div>' +
            '<small>' + PG.fmt(p.xp) + ' / ' + PG.fmt(prog.need) + ' XP</small></div>' +
        '</div>' +
        '<div class="profile-hero__actions">' +
          '<button class="btn btn--ghost btn--sm profile-hero__edit" data-act="profile-avatar">🖼️ Avatar</button>' +
          '<button class="btn btn--ghost btn--sm profile-hero__edit" data-act="profile-name">✏️ Đổi tên</button>' +
        '</div>' +
      '</div>' +
      '<div class="profile-summary">' +
        '<div class="summary-card"><span>📕</span><div><b>' + dex.caught + '</b><small>Pokédex</small></div></div>' +
        '<div class="summary-card"><span>🎒</span><div><b>' + state.pokemon.length + '</b><small>Pokémon</small></div></div>' +
        '<div class="summary-card"><span>🪙</span><div><b>' + PG.fmt(p.coins) + '</b><small>Xu</small></div></div>' +
        '<div class="summary-card"><span>💎</span><div><b>' + p.diamonds + '</b><small>Kim Cương</small></div></div>' +
        '<div class="summary-card"><span>⚡</span><div><b>' + p.stamina + '/' + PG.staminaMax() + '</b><small>Thể lực</small></div></div>' +
        '<div class="summary-card"><span>🏷️</span><div><b>' + state.market.listings.length + '</b><small>Tin đăng chợ</small></div></div>' +
      '</div>' +
      '<section class="panel profile-trainer">' +
        '<div class="panel__head"><h3 class="panel__title">🎖️ Chỉ Số Huấn Luyện Viên</h3>' +
          '<span class="badge">' + (p.level) + ' cấp • ' + (p.trainerItems || []).length + ' vật phẩm gắn</span></div>' +
        ui.trainerStatsHtml(bonuses.totals) +
        '<p class="muted small">Cấp độ và vật phẩm từ <b>Quầy Vật Phẩm HLV</b> cộng thẳng vào chỉ số này. Không có trần — cứ tiếp tục lên cấp và mua đồ để tăng mãi.</p>' +
      '</section>' +
      '<div class="profile-grid">' +
        '<div class="profile-main">' +
          '<section class="panel"><div class="panel__head"><h3 class="panel__title">📊 Thống Kê</h3>' +
            '<span class="badge">Tổng ' + PG.fmt(state.stats.catches || 0) + ' lần bắt</span></div>' + statGrid() + '</section>' +
          badgePanel() +
          teamPanel() +
        '</div>' +
        '<aside class="profile-side">' + settingsPanel() + redeemPanel() + savePanel() +
          '<section class="panel profile-about"><h3 class="panel__title">ℹ️ Về Trò Chơi</h3>' +
            '<p class="muted small"><b>Bắt Pokémon</b> — game bắt Pokémon nhập vai trên trình duyệt. Toàn bộ dữ liệu lưu cục bộ, không cần máy chủ.</p>' +
            '<p class="muted small">22 hệ • ' + PG.DEX_ORDER.length + ' loài • 9 vùng đất • 7 bộ trang bị • 8 dạng đột biến.</p>' +
            '<p class="muted small">Mẹo: mở Console và gõ <code>PG</code> để truy cập các hàm kiểm thử, hoặc <code>PG.runTests()</code> để chạy kiểm tra.</p>' +
          '</section>' +
        '</aside>' +
      '</div>' +
    '</div>';
  };

  ui.changes['profile-setting'] = function (el) {
    const key = el.dataset.key;
    const value = el.checked;
    st().settings[key] = value;
    if (key === 'sound') PG.Audio.setEnabled(value);
    PG.applyMotionSettings();
    PG.saveState(true);
    ui.toast('Đã ' + (value ? 'bật' : 'tắt') + ' cài đặt.', 'info');
  };

  ui.actions['profile-redeem'] = function () {
    ui.modal({
      title: '🎁 Nhập Mã Quà',
      subtitle: 'Mã quà là bí mật — nhập đúng mã bạn nhận được',
      body: '<label class="field"><span>Mã quà</span>' +
        '<input class="input redeem-input" id="redeem-code" maxlength="32" autocomplete="off" placeholder="Nhập mã bí mật..."></label>' +
        '<p class="muted small">Mỗi mã chỉ dùng được một lần trên bản lưu này.</p>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>' +
        '<button class="btn btn--gold" data-act="profile-redeem-submit">Nhận quà</button>',
      size: 'sm',
      onMount: function (panel) {
        const input = panel.querySelector('#redeem-code');
        if (!input) return;
        input.focus();
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') ui.actions['profile-redeem-submit']();
        });
      }
    });
  };

  ui.actions['profile-redeem-submit'] = function () {
    const input = document.getElementById('redeem-code');
    const res = PG.redeemCode(input && input.value);
    if (!res.ok) { ui.toast(res.msg, 'error'); return; }
    const p = res.pokemon;
    ui.closeModal();
    ui.refreshTopbar();
    ui.render(); // render() đã đóng modal — mở modal kết quả sau khi render.
    PG.Audio.play(p && p.shiny ? 'shiny' : 'reward');
    ui.toast(res.msg, 'success');
    ui.modal({
      title: '🎉 Đã nhận quà!',
      body: '<div class="reward-reveal"><div class="reward-reveal__icon">🎁</div>' +
        '<p><b>+' + giftFmt((res.reward && res.reward.coins) || 0) + ' Xu • +' +
          giftFmt((res.reward && res.reward.diamonds) || 0) + ' 💎 Kim Cương</b></p>' +
        (res.leveledTo ? '<p class="small gold">🎖️ Huấn luyện viên lên cấp ' + res.leveledTo + '!</p>' : '') +
        (p ? '<div>' + ui.spriteHtml(p, { size: 'md' }) + '</div>' +
          '<h3>' + esc(PG.SPECIES[p.speciesId].name) + ' Lv.' + p.level + '</h3>' +
          '<p class="muted small">Đã vào Kho Pokémon' +
          (st().team.indexOf(p.uid) >= 0 ? ' và đội hình.' : '.') + '</p>' : '') +
        '</div>',
      footer: '<button class="btn btn--primary" data-act="close-modal">Tuyệt!</button>',
      size: 'sm'
    });
  };

  ui.actions['profile-name'] = function () {
    const p = st().player;
    ui.modal({
      title: '✏️ Đổi tên huấn luyện viên',
      body: '<label class="field"><span>Tên mới (tối đa 18 ký tự)</span>' +
        '<input class="input" id="trainer-name" maxlength="18" value="' + esc(p.name) + '"></label>' +
        '<p class="muted small">Tên sẽ hiển thị trên thanh trên cùng và hồ sơ.</p>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>' +
        '<button class="btn btn--primary" data-act="profile-name-save">Lưu</button>',
      size: 'sm',
      onMount: function () { const i = document.getElementById('trainer-name'); if (i) { i.focus(); i.select(); } }
    });
  };

  ui.actions['profile-name-save'] = function () {
    const input = document.getElementById('trainer-name');
    const name = (input && input.value || '').trim().slice(0, 18);
    if (!name) { ui.toast('Tên không được để trống.', 'error'); return; }
    st().player.name = name;
    PG.saveState(true);
    ui.closeModal();
    ui.render();
    ui.refreshTopbar();
    ui.toast('Đã đổi tên huấn luyện viên!', 'success');
  };

  ui.actions['profile-avatar'] = function () {
    const current = st().player.avatar;
    ui.modal({
      title: '🖼️ Cá nhân hóa Avatar',
      subtitle: 'Chọn một biểu tượng hoặc dán emoji bất kỳ',
      body: '<div class="avatar-grid">' + AVATARS.map((a, i) =>
        '<label class="avatar-choice' + (a === current ? ' is-active' : '') + '">' +
          '<input type="radio" name="avatar-pick" value="' + esc(a) + '"' + (a === current ? ' checked' : '') + '>' +
          '<span>' + a + '</span></label>').join('') + '</div>' +
        '<label class="field"><span>Hoặc dán emoji riêng (tối đa 8 ký tự)</span>' +
          '<input class="input" id="avatar-custom" maxlength="16" placeholder="🐥"></label>' +
        '<p class="muted small">Avatar hiển thị ở thanh trên cùng và trang hồ sơ. Lưu ngay khi bấm Lưu.</p>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>' +
        '<button class="btn btn--primary" data-act="profile-avatar-save">Lưu avatar</button>',
      size: 'md',
      onMount: function (panel) {
        const choices = panel.querySelectorAll('input[name="avatar-pick"]');
        Array.prototype.forEach.call(choices, function (input) {
          input.addEventListener('change', function () {
            const custom = document.getElementById('avatar-custom');
            if (custom && input.checked) custom.value = '';
            Array.prototype.forEach.call(panel.querySelectorAll('.avatar-choice'), function (el) {
              el.classList.toggle('is-active', !!(input.checked && el.contains(input)));
            });
          });
        });
      }
    });
  };

  ui.actions['profile-avatar-save'] = function () {
    const custom = document.getElementById('avatar-custom');
    const picked = document.querySelector('input[name="avatar-pick"]:checked');
    const raw = (custom && custom.value || '').trim();
    const avatar = Array.from(raw || (picked && picked.value) || '').slice(0, 8).join('');
    if (!avatar) { ui.toast('Hãy chọn hoặc nhập một avatar.', 'error'); return; }
    st().player.avatar = avatar;
    PG.saveState(true);
    ui.closeModal();
    ui.render();
    ui.refreshTopbar();
    ui.toast('Đã đổi avatar!', 'success');
  };

  ui.actions['profile-save'] = function () {
    const ok = PG.saveState();
    if (ok) ui.toast('Đã lưu tiến trình!', 'success');
  };

  ui.actions['profile-export'] = function () {
    const code = PG.exportSave();
    ui.modal({
      title: '📤 Mã Lưu',
      subtitle: 'Sao chép chuỗi bên dưới và cất giữ an toàn. Dán vào ô Nhập mã lưu để khôi phục.',
      body: '<textarea class="input code-area" id="save-code" readonly>' + esc(code) + '</textarea>' +
        '<p class="muted small">Độ dài: ' + code.length + ' ký tự. Không chia sẻ mã nếu không muốn người khác chơi tiếp bản lưu của bạn.</p>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Đóng</button>' +
        '<button class="btn btn--primary" data-act="profile-copy-code">📋 Sao chép</button>',
      size: 'md',
      onMount: function () { const t = document.getElementById('save-code'); if (t) t.select(); }
    });
  };

  ui.actions['profile-copy-code'] = function () {
    const area = document.getElementById('save-code');
    if (!area) return;
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    if (!ok && navigator.clipboard) {
      navigator.clipboard.writeText(area.value).then(() => ui.toast('Đã sao chép mã lưu!', 'success')).catch(() => ui.toast('Không sao chép được, hãy chọn và Ctrl+C.', 'warn'));
      return;
    }
    ui.toast(ok ? 'Đã sao chép mã lưu!' : 'Hãy chọn toàn bộ và nhấn Ctrl+C.', ok ? 'success' : 'warn');
  };

  ui.actions['profile-import'] = function () {
    ui.modal({
      title: '📥 Nhập Mã Lưu',
      subtitle: 'Dán mã lưu đã sao chép. Dữ liệu hiện tại sẽ bị thay thế!',
      body: '<textarea class="input code-area" id="import-code" placeholder="Dán mã Base64 tại đây..."></textarea>' +
        '<p class="muted small">Hãy xuất bản lưu hiện tại trước khi nhập bản khác.</p>',
      footer: '<button class="btn btn--ghost" data-act="close-modal">Hủy</button>' +
        '<button class="btn btn--danger" data-act="profile-import-confirm">Nhập và thay thế</button>',
      size: 'md'
    });
  };

  ui.actions['profile-import-confirm'] = function () {
    const area = document.getElementById('import-code');
    if (!area || !area.value.trim()) { ui.toast('Hãy dán mã lưu.', 'error'); return; }
    const res = PG.importSave(area.value);
    if (!res.ok) { ui.toast('Mã lưu không hợp lệ: ' + res.msg, 'error'); return; }
    ui.closeModal();
    ui.toast('Nhập bản lưu thành công!', 'success');
    location.reload();
  };

  ui.actions['profile-reset'] = function () {
    ui.confirm('Xóa toàn bộ tiến trình?', 'Tất cả Pokémon, trang bị, tiền tệ và tiến độ sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác!', function () {
      ui.confirm('Xác nhận lần cuối', 'Bạn thực sự muốn xóa? Hãy chắc chắn đã xuất bản lưu nếu cần.', function () {
        PG.resetState();
        PG.saveState(true);
        location.reload();
      }, { danger: true, okText: 'Xóa vĩnh viễn' });
    }, { danger: true, okText: 'Tiếp tục' });
  };
})();
