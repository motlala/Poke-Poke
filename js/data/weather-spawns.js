/* ============================================================
   POKÉMON THEO THỜI TIẾT
   Thêm/bớt loài ở đây là xong: trọng số hoang dã, bùng nổ và câu cá
   đều dùng chung PG.weatherSpeciesOf(). Không đổi cấu trúc save.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const BY_WEATHER = {
    clear: ['pidgey', 'rattata', 'oddish', 'natu'],
    sunny: ['charmander', 'vulpix', 'growlithe', 'arcanine', 'flareon', 'charizard'],
    rain: ['squirtle', 'psyduck', 'poliwag', 'tentacool', 'lapras', 'gyarados', 'blastoise'],
    snow: ['seel', 'dewgong', 'jynx', 'snorunt', 'lapras'],
    sandstorm: ['sandshrew', 'sandslash', 'diglett', 'dugtrio', 'geodude', 'onix'],
    fog: ['gastly', 'haunter', 'gengar', 'umbreon', 'espeon']
  };

  PG.WEATHER_SPAWNS = BY_WEATHER;

  PG.weatherSpeciesOf = function (id, weather) {
    const list = BY_WEATHER[weather];
    return !!(list && list.indexOf(id) >= 0);
  };

  /** Dùng làm tooltip trên chip thời tiết để người chơi biết loài nào dễ gặp. */
  PG.weatherSpawnHint = function (weather) {
    const list = BY_WEATHER[weather] || [];
    const names = list.slice(0, 4).map(id => (PG.SPECIES[id] || {}).name).filter(Boolean);
    return names.length ? 'Loài dễ xuất hiện: ' + names.join(', ') + '.' : '';
  };
})();
