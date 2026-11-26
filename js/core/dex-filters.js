/* ============================================================
   POKÉDEX — BỘ LỌC DÙNG CHUNG
   Dùng cho cả bảng lọc khi render lẫn ô tìm kiếm trực tiếp,
   để hai chế độ lọc không bao giờ lệch nhau.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const GROUP_LABELS = {
    official: 'Chính thức',
    fanmade: 'Fan-made',
    movie: 'Điện ảnh',
    crossover: 'Crossover'
  };
  const GROUP_ALIASES = {
    official: 'official', 'chinh thuc': 'official', 'chính thức': 'official',
    fanmade: 'fanmade', 'fan-made': 'fanmade', 'fan made': 'fanmade',
    movie: 'movie', 'dien anh': 'movie', 'điện ảnh': 'movie', film: 'movie',
    crossover: 'crossover', cross: 'crossover'
  };
  const EMPTY_VALUES = ['', 'all', 'any', '*', '-', '--', 'none', 'tất cả', 'tat ca',
    'all types', 'all regions', 'all species'];
  const GEN_ALIASES = { fanmade: 'Fan-made', movie: 'Điện ảnh', crossover: 'Crossover' };

  function text(v) {
    if (v === null || v === undefined) return '';
    return (typeof v === 'string' ? v : String(v)).trim();
  }

  /** Khóa so khớp: thường hóa hoa/đ thường, bỏ dấu tiếng Việt. */
  function key(v) {
    return text(v).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  }

  /** Giá trị rỗng / placeholder ("all", "Tất cả", ...) được coi như không lọc. */
  function clean(v) {
    const raw = text(v);
    return EMPTY_VALUES.indexOf(key(raw)) >= 0 ? '' : raw;
  }

  function dexOf(sp) {
    const n = Number(sp && sp.dex);
    return Number.isFinite(n) ? n : 0;
  }

  /** Nhóm dex ổn định: official | fanmade | movie | crossover. */
  function dexGroupOf(sp) {
    const d = dexOf(sp);
    if (d >= 8800 && d <= 9199) return 'fanmade';
    if ((d >= 9200 && d <= 9250) || (d >= 9393 && d <= 9422)) return 'movie';
    if ((d >= 9251 && d <= 9392) || (d >= 9423 && d <= 9662) || (d >= 9713 && d <= 9716) || (d >= 9911 && d <= 9927)) return 'crossover';
    return 'official';
  }

  function dexGroupLabel(group) {
    return GROUP_LABELS[group] || group || '';
  }

  /** Thế hệ hiển thị: Gen 1..9 cho dex chính thức, nhãn riêng cho các nhóm khác. */
  function dexGenOf(sp) {
    const group = dexGroupOf(sp);
    if (group === 'fanmade') return 'Fan-made';
    if (group === 'movie') return 'Điện ảnh';
    if (group === 'crossover') return 'Crossover';
    const d = dexOf(sp);
    if (d <= 151) return 'Gen 1';
    if (d <= 251) return 'Gen 2';
    if (d <= 386) return 'Gen 3';
    if (d <= 493) return 'Gen 4';
    if (d <= 649) return 'Gen 5';
    if (d <= 721) return 'Gen 6';
    if (d <= 809) return 'Gen 7';
    if (d <= 905) return 'Gen 8';
    return 'Gen 9';
  }

  function groupKey(v) {
    return GROUP_ALIASES[key(v)] || '';
  }

  function yesNo(v) {
    const k = key(v);
    if (k === 'yes' || k === 'co' || k === 'true' || k === '1' || k === 'mythical') return 'yes';
    if (k === 'no' || k === 'khong' || k === 'false' || k === '0' || k === 'normal') return 'no';
    return '';
  }

  function regionKey(v) {
    const raw = clean(v);
    if (!raw) return '';
    const wanted = key(raw);
    const regions = PG.REGIONS || {};
    for (const id of Object.keys(regions)) {
      if (key(id) === wanted || key(regions[id] && regions[id].name) === wanted) return id;
    }
    return raw;
  }

  function rarityKey(v) {
    const k = key(clean(v));
    if (k === 'pho bien' || k === 'thuong') return 'common';
    if (k === 'hiem') return 'rare';
    if (k === 'huyen thoai' || k === 'legend') return 'legendary';
    return k;
  }

  function sameGen(a, b) {
    return key(a).replace(/[^a-z0-9]/g, '') === key(b).replace(/[^a-z0-9]/g, '');
  }

  /**
   * Kiểm tra một loài có khớp toàn bộ bộ lọc hay không.
   * @param {object|string} sp đối tượng loài (hoặc id loài trong PG.SPECIES)
   * @param {object} filters q/type/status/region/rarity/mythical/group/gen
   * @param {object} [state] mặc định lấy từ PG.getState()
   */
  function dexMatches(sp, filters, state) {
    if (typeof sp === 'string') sp = PG.SPECIES[sp];
    if (!sp) return false;
    const f = filters || {};
    const st = state || (PG.getState && PG.getState()) || {};
    const dex = st.pokedex || {};
    const seen = dex.seen || {};
    const caught = dex.caught || {};

    const q = key(clean(f.q));
    if (q) {
      const haystack = key(sp.name) + ' ' + key(sp.desc);
      if (haystack.indexOf(q) < 0) return false;
    }

    const type = key(clean(f.type));
    if (type) {
      const ok = (sp.types || []).some(function (t) {
        if (key(t) === type) return true;
        const info = (PG.TYPES || {})[t];
        return !!info && key(info.name) === type;
      });
      if (!ok) return false;
    }

    const status = key(clean(f.status));
    if (status === 'caught' && !caught[sp.id]) return false;
    if (status === 'seen' && !seen[sp.id]) return false;
    if (status === 'missing' && caught[sp.id]) return false;

    const region = regionKey(f.region);
    if (region && !(sp.habitats || []).some(h => key(h) === key(region))) return false;

    // Khi chọn vùng, chỉ hệ của vùng đó được phép xuất hiện — kể cả khi người chơi
    // gõ tên một hệ khác vào ô tìm kiếm hoặc bấm vào thanh hệ từ chế độ "Tất cả".
    const regionTypes = region && PG.typesForRegion ? PG.typesForRegion(region) : null;
    if (regionTypes) {
      if (type && !regionTypes.some(t => key(t) === type || key((PG.TYPES[t] || {}).name) === type)) return false;
      if (!(sp.types || []).some(t => regionTypes.indexOf(t) >= 0)) return false;
    }

    const rarity = rarityKey(f.rarity);
    if (rarity && key(sp.rarity) !== rarity) return false;

    const mythical = yesNo(f.mythical);
    if (mythical === 'yes' && !sp.mythical) return false;
    if (mythical === 'no' && sp.mythical) return false;

    const group = groupKey(f.group);
    if (group && dexGroupOf(sp) !== group) return false;

    const gen = clean(f.gen);
    if (gen) {
      const wanted = GEN_ALIASES[groupKey(gen)] || gen;
      if (!sameGen(wanted, dexGenOf(sp))) return false;
    }

    return true;
  }

  PG.dexGroupOf = dexGroupOf;
  PG.dexGroupLabel = dexGroupLabel;
  PG.dexGenOf = dexGenOf;
  PG.regionKey = regionKey;
  PG.dexMatches = dexMatches;
})();
