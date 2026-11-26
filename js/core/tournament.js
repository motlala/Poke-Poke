/* ============================================================
   GIẢI ĐẤU CHUYÊN BIỆT — 3 bảng theo sức mạnh, mỗi ngày 1 lượt
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  /* Giải càng cao: yêu cầu đội mạnh hơn, phí vào cao hơn, thưởng cao hơn.
     Mỗi người chơi chỉ thi đấu 1 giải / ngày; quà được đặt lại lúc sang ngày. */
  const TIERS = [
    {
      id: 'rookie', name: 'Giải Tân Thủ', icon: '🌱', color: '#4ade80',
      fee: 500, minAvgLevel: 8, minBestCp: 260, needBadges: 0, levelBonus: 0,
      rounds: [
        { name: 'Vòng 1', short: 'V1', count: 1, difficulty: 'easy', minIV: 6, reward: { coins: 350, stardust: 60, equipment: { baseId: 'angler-hat' } } },
        { name: 'Vòng 2', short: 'V2', count: 2, difficulty: 'easy', minIV: 10, reward: { coins: 650, stardust: 120, equipment: { baseId: 'city-jacket' } } },
        { name: 'Chung kết', short: 'CK', count: 3, difficulty: 'medium', minIV: 14, reward: { coins: 1100, stardust: 220, xp: 100, equipment: { baseId: 'explorer-boots' } } }
      ],
      champion: { coins: 1800, stardust: 400, items: { 'exp-medium': 2, 'crystal-shard': 1 }, equipment: { baseId: 'clover-ring' } }
    },
    {
      id: 'pro', name: 'Giải Chuyên Nghiệp', icon: '⚔️', color: '#38bdf8',
      fee: 3500, minAvgLevel: 25, minBestCp: 900, needBadges: 1, levelBonus: 8,
      rounds: [
        { name: 'Vòng 1', short: 'V1', count: 2, difficulty: 'medium', minIV: 12, reward: { coins: 1600, stardust: 300, equipment: { baseId: 'city-jacket' } } },
        { name: 'Vòng 2', short: 'V2', count: 3, difficulty: 'medium', minIV: 16, reward: { coins: 2600, stardust: 520, xp: 180, equipment: { baseId: 'explorer-boots' } } },
        { name: 'Tứ kết', short: 'Tứ', count: 3, difficulty: 'hard', minIV: 20, reward: { coins: 3800, stardust: 780, diamonds: 1, equipment: { baseId: 'explorer-goggles' } } },
        { name: 'Chung kết', short: 'CK', count: 3, difficulty: 'hard', minIV: 24, reward: { coins: 6200, stardust: 1200, diamonds: 2, equipment: { baseId: 'lucky-cap', highLuck: true } } }
      ],
      champion: { coins: 9000, diamonds: 3, stardust: 1800, items: { 'exp-large': 1, maxrevive: 2, 'crystal-shard': 2 }, equipment: { baseId: 'clover-ring', highLuck: true, plus: 1 } }
    },
    {
      id: 'master', name: 'Giải Huyền Thoại', icon: '👑', color: '#fbbf24',
      fee: 15000, minAvgLevel: 45, minBestCp: 2200, needBadges: 3, levelBonus: 18,
      rounds: [
        { name: 'Vòng 1', short: 'V1', count: 3, difficulty: 'hard', minIV: 20, reward: { coins: 6000, stardust: 1100, equipment: { baseId: 'explorer-goggles' } } },
        { name: 'Vòng 2', short: 'V2', count: 3, difficulty: 'hard', minIV: 24, reward: { coins: 9000, stardust: 1600, diamonds: 1, equipment: { baseId: 'lucky-cap', highLuck: true } } },
        { name: 'Tứ kết', short: 'Tứ', count: 3, difficulty: 'boss', minIV: 27, reward: { coins: 13000, stardust: 2400, diamonds: 2, equipment: { baseId: 'clover-ring', highLuck: true } } },
        { name: 'Bán kết', short: 'Bán', count: 3, difficulty: 'boss', minIV: 30, reward: { coins: 19000, stardust: 3400, diamonds: 3, items: { 'exp-max': 1 } } },
        { name: 'Chung kết', short: 'CK', count: 3, difficulty: 'boss', minIV: 33, reward: { coins: 30000, stardust: 5200, diamonds: 4, items: { 'exp-max': 2 } } }
      ],
      champion: { coins: 45000, diamonds: 8, stardust: 8000, items: { 'exp-max': 3, maxrevive: 5, 'crystal-shard': 3 }, equipment: { baseId: 'clover-ring', highLuck: true, plus: 2 } }
    }
  ];

  // Alias cũ để các lời gọi / save cũ không vỡ.
  const ENTRY_FEE = TIERS[0].fee;
  const ROUNDS = TIERS[2].rounds;
  const CHAMPION_BONUS = TIERS[2].champion;

  const NAMES = [
    ['Bích Huyền', '🧙‍♀️'], ['Sắt Thủ', '🛡️'], ['Bão Táp', '🌪️'], ['Lửa Rừng', '🔥'],
    ['Sương Đêm', '🌙'], ['Thạch Linh', '🗿'], ['Sóng Xanh', '🌊'], ['Tinh Quang', '⭐'],
    ['Gió Bấc', '❄️'], ['Kim Cương', '💎'], ['Hổ Vằn', '🐯'], ['Mây Tênh', '☁️']
  ];
  const TITLES = ['Chiến binh mới nổi', 'HLV kỳ cựu', 'Kẻ thách đấu', 'Cao thủ hệ lửa', 'Người giữ đền', 'Nhà vô địch năm ngoái'];

  /* ---------- ELO ĐẤU TRƯỜNG ----------
     Thắng vòng nào cũng cộng Elo; thua bị trừ. Elo càng cao thì đối thủ ở
     giải sau càng nhỉnh hơn một chút (cấp / IV / HP), không vọt vô hạn. */
  const ELO_START = 1000, ELO_MIN = 100, ELO_MAX = 3000, ELO_K = 32;
  const TIER_ELO = { rookie: 950, pro: 1200, master: 1500 };
  const ELO_RANKS = [
    { min: 2000, name: 'Huyền Thoại Đấu Trường', icon: '👑' },
    { min: 1700, name: 'Đại Cao Thủ', icon: '💎' },
    { min: 1500, name: 'Cao Thủ', icon: '🔥' },
    { min: 1300, name: 'Chuyên Gia', icon: '⚔️' },
    { min: 1100, name: 'Thách Đấu', icon: '🛡️' },
    { min: 0, name: 'Tân Thủ', icon: '🌱' }
  ];

  function eloOf() {
    const s = PG.getState();
    const v = s.stats && s.stats.tournamentElo;
    return typeof v === 'number' && isFinite(v) ? v : ELO_START;
  }
  function eloRank(elo) {
    const value = typeof elo === 'number' ? elo : eloOf();
    return ELO_RANKS.find(r => value >= r.min) || ELO_RANKS[ELO_RANKS.length - 1];
  }
  function eloExpected(elo, tierId, roundIndex) {
    const base = TIER_ELO[tierId] !== undefined ? TIER_ELO[tierId] : TIER_ELO.rookie;
    return 1 / (1 + Math.pow(10, (base + (roundIndex || 0) * 25 - (elo || eloOf())) / 400));
  }
  /** Điểm Elo sau một vòng: thắng = 1, hòa = 0.5, thua = 0. */
  function eloDelta(win, tierId, roundIndex, draw) {
    const current = eloOf();
    const actual = draw ? 0.5 : (win ? 1 : 0);
    return Math.round(ELO_K * (actual - eloExpected(current, tierId, roundIndex)));
  }
  /** Elo cao giúp đối thủ nhỉnh lên, nhưng có trần để không vọt vô hạn. */
  function eloBoost() {
    const over = Math.max(0, eloOf() - ELO_START);
    return {
      levels: PG.clamp(Math.floor(over / 300), 0, 5),
      iv: PG.clamp(Math.floor(over / 250), 0, 8),
      hpMult: 1 + PG.clamp(over / 12000, 0, 0.15)
    };
  }
  function eloBoostText() {
    const b = eloBoost();
    const parts = [];
    if (b.levels) parts.push('+' + b.levels + ' cấp');
    if (b.iv) parts.push('IV +' + b.iv);
    if (b.hpMult > 1) parts.push('HP ×' + b.hpMult.toFixed(2));
    return parts.length ? parts.join(' • ') : 'chưa có';
  }
  function eloRecommendedTier() {
    const e = eloOf();
    return e >= 1450 ? 'master' : e >= 1150 ? 'pro' : 'rookie';
  }
  function setElo(value) {
    const s = PG.getState();
    if (!s.stats) s.stats = {};
    s.stats.tournamentElo = PG.clamp(Math.round(Number(value) || ELO_START), ELO_MIN, ELO_MAX);
    return s.stats.tournamentElo;
  }

  function tierOf(id) {
    return TIERS.find(t => t.id === id) || TIERS[0];
  }
  function freshRun() {
    return {
      uid: null, status: 'idle', round: -1, wins: 0, feePaid: 0,
      tierId: TIERS[0].id, tierName: TIERS[0].name,
      opponents: [], results: [], bonusLines: [], history: [],
      claimed: false,
      daily: { date: null, ran: false, claimed: false, tierId: null }
    };
  }

  function stateOf() {
    const s = PG.getState();
    if (!s.tournament) s.tournament = freshRun();
    if (!s.tournament.daily) s.tournament.daily = freshRun().daily;
    if (!s.stats) s.stats = {};
    if (typeof s.stats.tournamentElo !== 'number' || !isFinite(s.stats.tournamentElo)) {
      s.stats.tournamentElo = ELO_START;
    }
    return s;
  }

  /** Quà giải đấu đặt lại mỗi ngày; mỗi ngày chỉ được thi đấu 1 lần. */
  function ensureDaily() {
    const s = stateOf();
    const today = PG.todayKey();
    const d = s.tournament.daily;
    if (d.date !== today) {
      // Giải đang dở qua đêm bị coi là bỏ cuộc; lượt và quà ngày mới mở lại.
      const prev = s.tournament;
      if (prev && prev.status === 'running') {
        prev.status = 'forfeited';
        prev.history.unshift({
          at: Date.now(), rounds: prev.wins || 0, champion: false, fee: prev.feePaid || 0,
          tierId: prev.tierId, tierName: prev.tierName, uid: prev.uid, forfeited: true, expired: true
        });
        prev.history = prev.history.slice(0, 12);
      }
      s.tournament.daily = { date: today, ran: false, claimed: false, tierId: null };
      return true;
    }
    return false;
  }

  function pool(tier) {
    const t = tier || TIERS[2];
    return PG.DEX_ORDER.filter(id => {
      const sp = PG.SPECIES[id];
      if (!sp || sp.mythical) return false;
      if (t.id === 'rookie' && sp.rarity === 'legendary') return false;
      return true;
    });
  }

  function makeOpponents(seed, tier) {
    const t = tier || TIERS[0];
    const candidates = pool(t);
    const used = new Set();
    const boost = eloBoost();
    const baseLv = PG.clamp((PG.getState().player.level || 1) + 2 + t.levelBonus + boost.levels, 5, 95);
    return t.rounds.map((cfg, i) => {
      const who = NAMES[(seed + i * 3) % NAMES.length];
      const team = [];
      for (let k = 0; k < cfg.count; k++) {
        let sid = null;
        for (let guard = 0; guard < 30; guard++) {
          const candidate = PG.pick(candidates);
          if (!used.has(candidate)) { sid = candidate; break; }
        }
        if (!sid) sid = PG.pick(candidates);
        used.add(sid);
        team.push([sid, PG.clamp(baseLv + i * 2 + k, 5, 95)]);
      }
      return {
        name: who[0], avatar: who[1],
        title: TITLES[(seed + i) % TITLES.length],
        team: team, difficulty: cfg.difficulty,
        minIV: PG.clamp(cfg.minIV + boost.iv, 0, 31),
        hpMult: boost.hpMult,
        rating: Math.round((TIER_ELO[t.id] || TIER_ELO.rookie) + i * 25 + boost.levels * 10),
        reward: Object.assign({}, cfg.reward),
        roundIndex: i, roundName: cfg.name
      };
    });
  }

  function teamStrength() {
    const s = stateOf();
    const mons = s.team.map(uid => s.pokemon.find(p => p.uid === uid)).filter(p => p && p.hp > 0);
    if (!mons.length) return { avgLevel: 0, bestCp: 0, count: 0 };
    const avgLevel = Math.round(mons.reduce((a, p) => a + p.level, 0) / mons.length);
    const bestCp = Math.max.apply(null, mons.map(p => PG.cpOf(p)));
    return { avgLevel, bestCp, count: mons.length };
  }

  function requirementText(t) {
    return 'Cấp TB đội ≥ ' + t.minAvgLevel + ' • CP cao nhất ≥ ' + PG.fmt(t.minBestCp) +
      (t.needBadges ? ' • ≥ ' + t.needBadges + ' huy hiệu' : '');
  }

  function canEnter(tierId) {
    ensureDaily();
    const s = stateOf();
    const t = tierOf(tierId);
    const daily = s.tournament.daily;
    if (daily.ran) return { ok: false, msg: 'Hôm nay bạn đã thi đấu giải đấu. Quà và lượt đấu sẽ đặt lại sang ngày mới.' };
    if (s.tournament.status === 'running') return { ok: false, msg: 'Bạn đang tham gia một giải đấu. Hãy đấu tiếp hoặc bỏ cuộc.' };
    if (s.player.coins < t.fee) return { ok: false, msg: 'Không đủ Xu để đăng ký ' + t.name + ' (cần ' + PG.fmt(t.fee) + ').' };
    if (!s.team.length) return { ok: false, msg: 'Chưa có đội hình. Hãy chọn Pokémon trong Kho trước!' };
    const str = teamStrength();
    if (str.count === 0) return { ok: false, msg: 'Đội không còn Pokémon nào tỉnh táo. Hãy hồi phục trước khi đăng ký!' };
    if (str.avgLevel < t.minAvgLevel) return { ok: false, msg: t.name + ' yêu cầu cấp trung bình ≥ ' + t.minAvgLevel + ' (đội bạn: ' + str.avgLevel + ').' };
    if (str.bestCp < t.minBestCp) return { ok: false, msg: t.name + ' yêu cầu CP cao nhất ≥ ' + PG.fmt(t.minBestCp) + ' (đội bạn: ' + PG.fmt(str.bestCp) + ').' };
    if ((s.badges || []).length < t.needBadges) return { ok: false, msg: t.name + ' yêu cầu ít nhất ' + t.needBadges + ' huy hiệu.' };
    return { ok: true, msg: 'Đủ điều kiện tham gia ' + t.name + '!' };
  }

  /** Đăng ký: trừ phí theo giải, tạo lịch đấu riêng, khóa 1 lượt/ngày. */
  function startRun(tierId) {
    const state = stateOf();
    ensureDaily();
    const t = tierOf(tierId);
    const check = canEnter(t.id);
    if (!check.ok) return check;

    state.player.coins -= t.fee;
    const uid = PG.uid('tmt');
    const seed = PG.randInt(0, NAMES.length * 7);
    const next = freshRun();
    next.history = (state.tournament.history || []).slice(0, 12);
    next.uid = uid;
    next.status = 'running';
    next.round = 0;
    next.feePaid = t.fee;
    next.tierId = t.id;
    next.tierName = t.name;
    next.opponents = makeOpponents(seed, t);
    next.daily = { date: PG.todayKey(), ran: true, claimed: false, tierId: t.id };
    state.tournament = next;
    PG.saveState(true);
    return { ok: true, run: next, msg: 'Đã đăng ký ' + t.name + '! Phí ' + PG.fmt(t.fee) + ' Xu. ' + next.opponents.length + ' vòng chờ bạn.' };
  }

  function currentOpponent() {
    const run = stateOf().tournament;
    if (!run || run.status !== 'running') return null;
    return run.opponents[run.round] || null;
  }

  function startNextRound() {
    const state = stateOf();
    const run = state.tournament;
    const foe = currentOpponent();
    if (!foe) return { ok: false, msg: 'Không còn vòng nào để đấu. Đăng ký giải mới nhé!' };
    const res = PG.Battle.startTournament({
      runUid: run.uid, roundIndex: run.round,
      name: foe.name, avatar: foe.avatar, title: foe.title,
      roundName: foe.roundName, difficulty: foe.difficulty,
      team: foe.team, minIV: foe.minIV, reward: foe.reward,
      hpMult: foe.hpMult || 1,
      introText: foe.avatar + ' ' + foe.name + ' (“' + foe.title + '”): “' + foe.roundName + ' — bắt đầu!”'
    });
    if (!res.ok) return res;
    res.msg = foe.roundName + ': ' + foe.name + ' đang chờ bạn!';
    return res;
  }

  function markDaily(run) {
    const d = stateOf().tournament.daily;
    d.date = PG.todayKey();
    d.ran = true;
    d.claimed = true;
    d.tierId = run.tierId;
  }

  /** Cập nhật nhánh đấu sau trận. Thưởng vòng đã được trả trong battle. */
  function recordResult(battle) {
    if (!battle || !battle.tournament || battle.tournamentRecorded) return { ok: false };
    battle.tournamentRecorded = true;
    const state = stateOf();
    const run = state.tournament;
    if (!run || run.status !== 'running' || run.uid !== battle.tournament.runUid) return { ok: false };

    const idx = PG.clamp(battle.tournament.roundIndex || 0, 0, run.opponents.length - 1);
    const win = battle.winner === 'player';
    const draw = battle.winner === 'draw';
    const opponent = run.opponents[idx];
    const eloBefore = eloOf();
    const delta = eloDelta(win, run.tierId, idx, draw);
    const eloAfter = setElo(eloBefore + delta);
    const rank = eloRank(eloAfter);
    const eloLine = '🏅 Elo ' + (delta >= 0 ? '+' : '') + delta + ' → ' + eloAfter + ' (' + rank.icon + ' ' + rank.name + ')';
    run.results.push({ round: idx, roundName: opponent ? opponent.roundName : 'Vòng ' + (idx + 1), win: win, at: Date.now(), eloDelta: delta });

    let finished = false;
    let msg = '';
    const tier = tierOf(run.tierId);
    if (win) {
      run.wins = idx + 1;
      state.stats.tournamentWins = (state.stats.tournamentWins || 0) + 1;
      if (idx + 1 >= run.opponents.length) {
        run.status = 'won';
        run.claimed = true;
        run.bonusLines = PG.grantReward(tier.champion);
        msg = '🏆 Vô địch ' + tier.name + '! Thưởng thêm: ' + run.bonusLines.join(', ');
        finished = true;
      } else {
        run.round = idx + 1;
        msg = '✔️ Thắng ' + opponent.roundName + '! Tiến vào ' + run.opponents[run.round].roundName + '.';
      }
    } else {
      run.status = 'lost';
      msg = battle.winner === 'draw'
        ? '🤝 Hòa — bạn bị loại khỏi giải.'
        : '💀 Bị loại tại ' + (opponent ? opponent.roundName : 'vòng ' + (idx + 1)) + '.';
      finished = true;
    }
    msg += ' ' + eloLine;

    if (finished) {
      markDaily(run);
      state.stats.tournamentRuns = (state.stats.tournamentRuns || 0) + 1;
      state.stats.tournamentBest = Math.max(state.stats.tournamentBest || 0, run.wins);
      run.history.unshift({
        at: Date.now(), rounds: run.wins, champion: run.status === 'won',
        fee: run.feePaid, tierId: run.tierId, tierName: run.tierName, uid: run.uid,
        eloBefore: eloBefore, eloAfter: eloAfter, eloDelta: delta
      });
      run.history = run.history.slice(0, 12);
    }
    battle.tournamentResult = { win: win, finished: finished, msg: msg };
    PG.saveState(true);
    return Object.assign({ ok: true }, battle.tournamentResult);
  }

  function abandon() {
    const state = stateOf();
    const run = state.tournament;
    if (!run || run.status !== 'running') return { ok: false, msg: 'Không có giải đang tham gia.' };
    run.status = 'forfeited';
    markDaily(run);
    const eloBefore = eloOf();
    const delta = -Math.max(1, Math.round(Math.abs(eloDelta(false, run.tierId, Math.max(0, run.wins - 1))) / 2));
    const eloAfter = setElo(eloBefore + delta);
    state.stats.tournamentRuns = (state.stats.tournamentRuns || 0) + 1;
    state.stats.tournamentBest = Math.max(state.stats.tournamentBest || 0, run.wins);
    run.history.unshift({
      at: Date.now(), rounds: run.wins, champion: false, fee: run.feePaid,
      tierId: run.tierId, tierName: run.tierName, uid: run.uid, forfeited: true,
      eloBefore: eloBefore, eloAfter: eloAfter, eloDelta: delta
    });
    run.history = run.history.slice(0, 12);
    PG.saveState(true);
    return { ok: true, msg: 'Đã bỏ cuộc giải đấu. Phí không hoàn lại • Elo ' + delta + ' → ' + eloAfter + '.' };
  }

  function reset() {
    const state = stateOf();
    const history = (state.tournament.history || []).slice();
    state.tournament = freshRun();
    state.tournament.history = history;
    setElo(ELO_START);
    PG.saveState(true);
    return { ok: true, msg: 'Đã đặt lại giải đấu • Elo về ' + ELO_START + '.' };
  }

  PG.Tournament = {
    TIERS, ENTRY_FEE, ROUNDS, CHAMPION_BONUS,
    ELO_START, ELO_RANKS,
    freshRun, tierOf, requirementText, teamStrength, canEnter, ensureDaily,
    eloOf, eloRank, eloDelta, eloExpected, eloBoost, eloBoostText,
    eloRecommendedTier, setElo,
    startRun, currentOpponent, startNextRound,
    recordResult, abandon, reset
  };
})();
