/* ============================================================
   PHÒNG NGHIÊN CỨU: đổi tính cách / đặc tính NGẪU NHIÊN
   bằng Mảnh Tinh Thể Vỡ (người chơi không chọn kết quả)
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG;
  const ui = PG.ui = PG.ui || {};
  const esc = PG.esc;

  function state() { return PG.getState(); }

  function chosenPokemon() {
    const st = state();
    ui.flow.research = ui.flow.research || { uid: null, lastNature: null, lastAbility: null };
    const mons = st.pokemon.slice().sort((a, b) => PG.cpOf(b) - PG.cpOf(a));
    const p = mons.find(x => x.uid === ui.flow.research.uid) || mons[0] || null;
    if (p) ui.flow.research.uid = p.uid;
    return p;
  }

  function natureLabel(id) {
    const n = PG.NATURES[id];
    if (!n) return id;
    if (!n.plus) return n.name;
    return n.name + ' (' + PG.STAT_NAMES[n.plus] + '↑ ' + PG.STAT_NAMES[n.minus] + '↓)';
  }

  ui.views.research = function () {
    const st = state();
    const shards = st.bag['crystal-shard'] || 0;
    const p = chosenPokemon();
    const mons = st.pokemon.slice().sort((a, b) => PG.cpOf(b) - PG.cpOf(a));

    if (!p) {
      return '<section class="panel research-empty"><div class="panel__head"><h3 class="panel__title">🔬 Phòng Nghiên Cứu</h3></div>' +
        '<p class="muted">Chưa có Pokémon nào trong kho. Hãy đi bắt hoặc nở trứng để có đối tượng nghiên cứu.</p></section>';
    }

    const sp = PG.SPECIES[p.speciesId];
    const nature = PG.NATURES[p.nature] || PG.NATURES.hardy;
    const ability = PG.ABILITIES[p.ability] || { name: p.ability, desc: '' };
    const natureCount = (PG.NATURE_KEYS || Object.keys(PG.NATURES)).filter(k => PG.NATURES[k] && k !== p.nature).length;
    const abilityPool = PG.researchAbilityPool(p);
    const abilityCount = abilityPool.filter(a => a !== p.ability).length;
    const monOptions = mons.map(m =>
      '<option value="' + esc(m.uid) + '"' + (m.uid === p.uid ? ' selected' : '') + '>' +
      esc((m.nickname || PG.SPECIES[m.speciesId].name) + ' · Lv.' + m.level + ' · CP ' + PG.fmt(PG.cpOf(m))) + '</option>').join('');
    const last = ui.flow.research.lastUid === p.uid ? ui.flow.research.lastResult : null;

    return '<section class="panel research-hero">' +
        '<div class="panel__head"><h3 class="panel__title">🔬 Phòng Nghiên Cứu</h3>' +
          '<span class="research-shard">💠 Mảnh Tinh Thể Vỡ: <b>' + shards + '</b></span></div>' +
        '<p class="muted small">Mỗi lần thí nghiệm tốn <b>1 Mảnh</b> và <b>kết quả hoàn toàn ngẫu nhiên</b> — không chọn được tính cách hay đặc tính nhận được. ' +
          'Mảnh hiếm rớt từ thắng Huấn luyện viên, vô địch giải đấu, hoặc nhặt được rất hiếm khi đi dạo.</p>' +
        '<label class="field research-field"><span>Pokémon thí nghiệm</span>' +
          '<select class="select" id="research-pokemon">' + monOptions + '</select></label>' +
        '<button class="btn btn--ghost btn--sm research-pick" data-act="research-pick">Chọn Pokémon này</button>' +
        '<div class="research-current">' + ui.spriteHtml(p, { size: 'sm' }) +
          '<div><strong>' + esc(p.nickname || sp.name) + '</strong><small>#' + String(sp.dex).padStart(3, '0') + ' • Lv.' + p.level +
          ' • Hiện tại: ' + esc(nature.name) + ' / ' + esc(ability.name) + (p.hiddenAbility ? ' (Ẩn)' : '') + '</small></div></div>' +
        (last ? '<div class="research-result"><span>🎲 Lần trước: </span>' + esc(last) + '</div>' : '') +
      '</section>' +

      '<div class="research-grid">' +
        '<section class="panel research-card">' +
          '<div class="panel__head"><h3 class="panel__title">🧠 Thí Nghiệm Tính Cách</h3></div>' +
          '<p class="muted small">Máy sẽ <b>ngẫu nhiên</b> một trong ' + natureCount + ' tính cách mới (khác với hiện tại). ' +
            'Tính cách đổi hệ số ±10% của chỉ số; chỉ số trong kho và trận đấu cập nhật ngay.</p>' +
          '<div class="research-pool">Tính cách hiện tại: <b>' + esc(natureLabel(p.nature)) + '</b> · Kết quả mới: <b>??? 🎲</b></div>' +
          '<button class="btn btn--challenge research-go" data-act="research-nature"' + (shards < 1 ? ' disabled' : '') + '>💠 Bỏ Mảnh vào máy (Ngẫu nhiên)</button>' +
        '</section>' +

        '<section class="panel research-card">' +
          '<div class="panel__head"><h3 class="panel__title">✨ Thí Nghiệm Đặc Tính</h3></div>' +
          '<p class="muted small">Máy sẽ <b>ngẫu nhiên</b> một trong ' + abilityCount + ' đặc tính mới (ưu tiên 70% đặc tính cùng hệ). ' +
            'Hiệu ứng áp dụng ngay trong chiến đấu.</p>' +
          '<div class="research-pool">Đặc tính hiện tại: <b>' + esc(ability.name) + '</b> · Kết quả mới: <b>??? 🎲</b></div>' +
          '<button class="btn btn--challenge research-go" data-act="research-ability"' + (shards < 1 ? ' disabled' : '') + '>💠 Bỏ Mảnh vào máy (Ngẫu nhiên)</button>' +
        '</section>' +
      '</div>' +

      '<section class="panel research-note">' +
        '<div class="panel__head"><h3 class="panel__title">📚 Ghi Chú Thí Nghiệm</h3></div>' +
        '<p class="muted small">Đặc tính cùng hệ dễ phát huy: Thích ứng (cùng hệ +20%), Sức Mạnh Thuần (chiêu có hiệu ứng +30%), ' +
          'Đá Rắn / Bộ Lọc (giảm 25% đòn khắc hệ), Đa Tầng (giảm nửa sát thương khi đầy HP), Tập Trung, Áo Khoác, Giáp Chiến, Bơi Lội, Kính Màu, Mỏ Lớn và Vuốt Cứng.</p>' +
      '</section>';
  };

  ui.actions['research-pick'] = function () {
    const sel = document.getElementById('research-pokemon');
    if (!sel) return;
    ui.flow.research = ui.flow.research || {};
    ui.flow.research.uid = sel.value;
    ui.flow.research.lastUid = null;
    ui.flow.research.lastResult = null;
    ui.render();
  };

  function runResearch(kind) {
    const uid = ui.flow.research && ui.flow.research.uid;
    const p = state().pokemon.find(x => x.uid === uid);
    const before = p ? (kind === 'nature' ? p.nature : p.ability) : null;
    const res = PG.researchRandom(uid, kind);
    ui.toast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) {
      PG.Audio.play('buy');
      const after = kind === 'nature' ? PG.NATURES[res.value].name : PG.ABILITIES[res.value].name;
      const old = kind === 'nature' ? ((PG.NATURES[before] || {}).name || before) : ((PG.ABILITIES[before] || {}).name || before);
      ui.flow.research.lastUid = uid;
      ui.flow.research.lastResult = esc(old) + ' → <b>' + esc(after) + '</b>';
      ui.render();
    }
  }

  ui.actions['research-nature'] = function () { runResearch('nature'); };
  ui.actions['research-ability'] = function () { runResearch('ability'); };
})();
