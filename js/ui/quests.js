/* ============================================================
   NHIỆM VỤ: hằng ngày, hằng tuần, thành tựu, đăng nhập
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui;
  const esc = PG.esc;

  function st() { return PG.getState(); }
  function tab() { return ui.flow.questTab || 'daily'; }

  function rewardText(reward) {
    const parts = [];
    if (reward.coins) parts.push('🪙 ' + PG.fmt(reward.coins));
    if (reward.stardust) parts.push('✨ ' + PG.fmt(reward.stardust));
    if (reward.diamonds) parts.push('💎 ' + reward.diamonds);
    if (reward.items) for (const [id, n] of Object.entries(reward.items)) parts.push(PG.itemInfo(id).icon + ' ' + n);
    return parts.join(' • ');
  }

  function questCard(q, kind) {
    const done = q.progress >= q.target;
    const pct = Math.min(100, Math.round(q.progress / q.target * 100));
    return '<div class="quest-card' + (q.claimed ? ' is-claimed' : '') + (done && !q.claimed ? ' is-done' : '') + '">' +
      '<span class="quest-card__icon">' + q.icon + '</span>' +
      '<div class="quest-card__body"><div class="quest-card__head"><strong>' + esc(q.text) + '</strong>' +
        '<span class="quest-card__count">' + Math.min(q.progress, q.target) + '/' + q.target + '</span></div>' +
        '<div class="quest-bar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="quest-card__foot"><span class="quest-reward">' + rewardText(q.reward) + '</span>' +
          (q.claimed ? '<span class="quest-claimed">✅ Đã nhận</span>' :
            done ? '<button class="btn btn--gold btn--sm" data-act="quest-claim" data-kind="' + kind + '" data-uid="' + q.uid + '">Nhận thưởng</button>' :
              '<span class="muted small">Đang thực hiện...</span>') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function questPanel(kind) {
    const state = st();
    const list = kind === 'daily' ? state.quests.daily : state.quests.weekly;
    const claimed = kind === 'daily' ? state.quests.claimedDaily : state.quests.claimedWeekly;
    const resetText = kind === 'daily' ? 'Làm mới lúc 00:00 mỗi ngày' : 'Làm mới vào thứ Hai hằng tuần';
    return '<section class="panel quests-main">' +
      '<div class="panel__head"><h3 class="panel__title">' + (kind === 'daily' ? '☀️ Nhiệm Vụ Ngày' : '📅 Nhiệm Vụ Tuần') + '</h3>' +
        '<span class="badge">' + claimed + '/' + list.length + ' đã nhận</span></div>' +
      '<p class="muted small">' + resetText + ' • Hoàn thành để nhận Xu, Bụi Sao và Kim Cương.</p>' +
      '<div class="quest-list">' + list.map(q => questCard(q, kind)).join('') + '</div>' +
    '</section>';
  }

  function achievementsPanel() {
    const state = st();
    return '<section class="panel achievements-panel">' +
      '<div class="panel__head"><h3 class="panel__title">🏆 Thành Tựu</h3>' +
        '<span class="badge">' + PG.ACHIEVEMENTS.filter(a => PG.achievementTier(a) > PG.claimedTier(a)).length + ' có thể nhận</span></div>' +
      '<div class="ach-grid">' + PG.ACHIEVEMENTS.map(ach => {
        const value = state.stats[ach.stat] || 0;
        const tier = PG.achievementTier(ach);
        const claimed = PG.claimedTier(ach);
        const canClaim = tier > claimed;
        const bestTier = Math.min(ach.tiers.length - 1, claimed + 1);
        const nextTarget = ach.tiers[Math.min(ach.tiers.length - 1, tier + 1)];
        const pct = Math.min(100, Math.round(value / ach.tiers[0] * 100));
        return '<div class="ach-card' + (canClaim ? ' is-claimable' : '') + (claimed >= ach.tiers.length - 1 ? ' is-max' : '') + '">' +
          '<span class="ach-card__icon">' + ach.icon + '</span>' +
          '<div class="ach-card__body"><strong>' + ach.name + '</strong><small>' + ach.desc + ': <b>' + PG.fmt(value) + '</b></small>' +
            '<div class="ach-tiers">' + ach.tiers.map((t, i) => '<span class="ach-tier' + (value >= t ? ' is-reached' : '') + (claimed >= i ? ' is-claimed' : '') + '">' + PG.fmt(t) + '</span>').join('') + '</div>' +
            '<div class="quest-bar"><span style="width:' + pct + '%"></span></div>' +
            '<div class="ach-card__foot"><span class="muted small">' + (tier >= 0 ? 'Đạt mốc ' + PG.fmt(ach.tiers[tier]) : 'Chưa đạt mốc nào') +
              (tier >= ach.tiers.length - 1 ? ' • Tối đa' : '') + '</span>' +
              (canClaim ? '<button class="btn btn--gold btn--sm" data-act="ach-claim" data-id="' + ach.id + '">Nhận ' + rewardText(ach.rewards[tier]) + '</button>' : '') + '</div>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>' +
    '</section>';
  }

  function loginPanel() {
    const state = st();
    const can = PG.canClaimLogin();
    const today = state.login.lastClaim === PG.todayKey();
    const streak = state.login.streak || 0;
    const nextIdx = can ? (streak >= 7 ? 6 : streak) : null;
    return '<section class="panel login-panel">' +
      '<div class="panel__head"><h3 class="panel__title">📆 Điểm Danh</h3><span class="badge">' + streak + ' ngày</span></div>' +
      '<p class="muted small">Đăng nhập mỗi ngày để nhận quà. Chuỗi 7 ngày có thưởng lớn!</p>' +
      '<div class="login-strip">' + PG.LOGIN_REWARDS.map((r, i) => {
        const done = today && i < streak;
        const current = can && i === nextIdx;
        return '<div class="login-day' + (done ? ' is-done' : '') + (current ? ' is-current' : '') + '">' +
          '<span class="login-day__label">Ngày ' + (i + 1) + '</span>' +
          '<span class="login-day__icon">' + (done ? '✅' : (r.items && r.items.celestialball ? '🌟' : r.items ? PG.itemInfo(Object.keys(r.items)[0]).icon : '🪙')) + '</span>' +
          '<small>' + rewardText(r) + '</small></div>';
      }).join('') + '</div>' +
      (can ? '<button class="btn btn--gold btn--block" data-act="claim-login">🎁 Nhận quà hôm nay</button>' :
        '<button class="btn btn--ghost btn--block" disabled>✅ Đã điểm danh hôm nay — quay lại ngày mai!</button>') +
    '</section>';
  }

  function eventPanel() {
    const state = st();
    const ev = state.events.active;
    if (!ev) return '';
    const hours = Math.max(0, Math.ceil((ev.endsAt - Date.now()) / 3600000));
    return '<section class="panel event-panel" style="--ec:' + (ev.color || '#ffd86b') + '">' +
      '<div class="event-panel__glow"></div>' +
      '<span class="event-panel__icon">' + ev.icon + '</span>' +
      '<div class="event-panel__body"><span class="eyebrow">Sự kiện hôm nay</span><h3>' + esc(ev.name) + '</h3><p>' + esc(ev.desc) + '</p></div>' +
      '<span class="pill">⏰ còn ~' + hours + ' giờ</span>' +
    '</section>';
  }

  ui.views.quests = function () {
    const state = st();
    const dailyDone = state.quests.daily.filter(q => q.claimed).length;
    return '<div class="quests-page">' +
      '<div class="page-head">' +
        '<div><p class="eyebrow">Mục tiêu • Phần thưởng</p><h1>📋 Nhiệm Vụ & Thành Tựu</h1>' +
          '<p class="muted">Hoàn thành nhiệm vụ mỗi ngày, chinh phục thành tựu và nhận quà điểm danh.</p></div>' +
        '<div class="page-wallet"><span class="pill pill--gold">📋 ' + dailyDone + '/' + state.quests.daily.length + ' nhiệm vụ ngày</span>' +
          '<span class="pill">🏆 ' + Object.keys(state.achievements).length + ' thành tựu</span></div>' +
      '</div>' +
      eventPanel() +
      '<div class="quests-layout">' +
        '<div class="quests-col">' +
          '<div class="segmented segmented--wide">' +
            '<button class="segmented__btn' + (tab() === 'daily' ? ' is-active' : '') + '" data-act="quest-tab" data-tab="daily">☀️ Hằng Ngày</button>' +
            '<button class="segmented__btn' + (tab() === 'weekly' ? ' is-active' : '') + '" data-act="quest-tab" data-tab="weekly">📅 Hằng Tuần</button>' +
          '</div>' +
          questPanel(tab()) +
        '</div>' +
        '<aside class="quests-side">' + loginPanel() + eventPanel() + '</aside>' +
      '</div>' +
      achievementsPanel() +
    '</div>';
  };

  ui.actions['quest-tab'] = function (el) {
    ui.flow.questTab = el.dataset.tab;
    ui.render();
  };

  ui.actions['quest-claim'] = function (el) {
    const res = PG.claimQuest(el.dataset.kind, el.dataset.uid);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('quest'); ui.refreshTopbar(); ui.render(); }
  };

  ui.actions['ach-claim'] = function (el) {
    const res = PG.claimAchievement(el.dataset.id);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) { PG.Audio.play('reward'); ui.refreshTopbar(); ui.render(); }
  };
})();
