/* ============================================================
   POKÉMON — PHẦN 1 (Kanto / Johto)
   Thêm loài mới: dùng S(dex, tên, [hệ...], [hp,atk,def,spa,spd,spe],
   độ hiếm, vùng sống, tiến hóa, tuỳ chọn)
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};
  PG.SPECIES = PG.SPECIES || {};

  function S(dex, name, types, base, rarity, habitats, evo, extra) {
    const id = (extra && extra.id) || name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const sp = {
      id, dex, name, types, base, rarity,
      habitats: String(habitats || '').split(',').filter(Boolean),
      evo: evo || null,
      catchRate: extra && extra.catchRate,
      fleeRate: extra && extra.fleeRate,
      ultLevel: extra && extra.ultLevel,
      canElemental: extra && extra.canElemental !== undefined ? extra.canElemental : true,
      genderRatio: extra && extra.genderRatio,
      size: extra && extra.size,
      desc: extra && extra.desc,
      // Dạng điện ảnh dùng artwork riêng của PokéAPI (form/Mega), không phải dex phim.
      artDex: extra && extra.artDex,
      mythical: !!(extra && extra.mythical)
    };
    PG.SPECIES[id] = sp;
    return sp;
  }
  PG.addSpecies = list => { list.forEach(args => S.apply(null, args)); };
  PG.S = S;

  PG.addSpecies([
    /* ================= KHỞI ĐẦU ================= */
    [1, 'Bulbasaur', ['grass', 'poison'], [45, 49, 49, 65, 65, 45], 'common', 'forest,pallet', ['ivysaur', 25, 16]],
    [2, 'Ivysaur', ['grass', 'poison'], [60, 62, 63, 80, 80, 60], 'rare', 'forest', ['venusaur', 100, 32]],
    [3, 'Venusaur', ['grass', 'poison'], [80, 82, 83, 100, 100, 80], 'rare', 'forest,celadon'],
    [4, 'Charmander', ['fire'], [39, 52, 43, 60, 50, 65], 'common', 'volcano,pallet', ['charmeleon', 25, 16]],
    [5, 'Charmeleon', ['fire'], [58, 64, 58, 80, 65, 80], 'rare', 'volcano', ['charizard', 100, 36]],
    [6, 'Charizard', ['fire', 'flying'], [78, 84, 78, 109, 85, 100], 'rare', 'volcano,indigo'],
    [7, 'Squirtle', ['water'], [44, 48, 65, 50, 64, 43], 'common', 'beach,pallet', ['wartortle', 25, 16]],
    [8, 'Wartortle', ['water'], [59, 63, 80, 65, 80, 58], 'rare', 'beach,cerulean', ['blastoise', 100, 36]],
    [9, 'Blastoise', ['water'], [79, 83, 100, 85, 105, 78], 'rare', 'beach,indigo'],

    /* ================= BỌ ================= */
    [10, 'Caterpie', ['bug'], [45, 30, 35, 20, 20, 45], 'common', 'forest,viridian', ['metapod', 12, 7]],
    [11, 'Metapod', ['bug'], [50, 20, 55, 25, 25, 30], 'common', 'forest,viridian', ['butterfree', 50, 10]],
    [12, 'Butterfree', ['bug', 'flying'], [60, 45, 50, 90, 80, 70], 'rare', 'forest'],

    /* ================= CHIM / THƯỜNG ================= */
    [16, 'Pidgey', ['normal', 'flying'], [40, 45, 40, 35, 35, 56], 'common', 'forest,city', ['pidgeotto', 12, 18]],
    [17, 'Pidgeotto', ['normal', 'flying'], [63, 60, 55, 50, 50, 71], 'rare', 'forest,city', ['pidgeot', 50, 36]],
    [18, 'Pidgeot', ['normal', 'flying'], [83, 80, 75, 70, 70, 101], 'rare', 'forest,city'],
    [52, 'Meowth', ['normal'], [40, 45, 35, 40, 40, 90], 'common', 'city', ['persian', 50, 28]],
    [53, 'Persian', ['normal'], [65, 70, 60, 65, 65, 115], 'rare', 'city'],
    [83, "Farfetch'd", ['normal', 'flying'], [52, 90, 55, 58, 62, 60], 'common', 'forest,city', null, { id: 'farfetchd' }],
    [143, 'Snorlax', ['normal'], [160, 110, 65, 65, 110, 30], 'rare', 'forest,city'],
    [132, 'Ditto', ['neutral'], [48, 48, 48, 48, 48, 48], 'rare', 'city', null, { canElemental: false }],
    [133, 'Eevee', ['normal'], [55, 55, 50, 45, 65, 55], 'rare', 'city,forest,pallet', [
      ['vaporeon', 25, null, 'water-stone'], ['jolteon', 25, null, 'thunder-stone'],
      ['flareon', 25, null, 'fire-stone'], ['espeon', 25, null, 'day'],
      ['umbreon', 25, null, 'night'], ['leafeon', 25, null, 'leaf-stone'],
      ['glaceon', 25, null, 'ice-stone'], ['sylveon', 25, null, 'fairy-stone']
    ]],
    [134, 'Vaporeon', ['water'], [130, 65, 60, 110, 95, 65], 'rare', 'beach,lake'],
    [135, 'Jolteon', ['electric'], [65, 65, 60, 110, 95, 130], 'rare', 'city'],
    [136, 'Flareon', ['fire'], [65, 130, 60, 95, 110, 65], 'rare', 'volcano'],
    [196, 'Espeon', ['psychic'], [65, 65, 60, 130, 95, 110], 'rare', 'city'],
    [197, 'Umbreon', ['dark'], [95, 65, 110, 60, 130, 65], 'rare', 'city,cave'],
    [470, 'Leafeon', ['grass'], [65, 110, 130, 60, 65, 95], 'rare', 'forest'],
    [471, 'Glaceon', ['ice'], [65, 60, 110, 130, 95, 65], 'rare', 'snow'],
    [700, 'Sylveon', ['fairy'], [95, 65, 65, 110, 130, 60], 'rare', 'city,forest'],
    [137, 'Porygon', ['neutral'], [65, 60, 70, 85, 75, 40], 'rare', 'city', null, { canElemental: false }],

    /* ================= ĐIỆN ================= */
    [25, 'Pikachu', ['electric'], [35, 55, 40, 50, 50, 90], 'rare', 'forest,city,pallet', ['raichu', 50, null, 'thunder-stone']],
    [26, 'Raichu', ['electric'], [60, 90, 55, 90, 80, 110], 'rare', 'city'],
    [81, 'Magnemite', ['electric', 'steel'], [25, 35, 70, 95, 55, 45], 'common', 'city,cave', ['magneton', 25, 30]],
    [82, 'Magneton', ['electric', 'steel'], [50, 60, 95, 120, 70, 70], 'rare', 'city,cave', ['magnezone', 100, 45]],
    [462, 'Magnezone', ['electric', 'steel'], [70, 70, 115, 130, 90, 60], 'rare', 'city'],

    /* ================= ĐẤT / ĐÁ ================= */
    [27, 'Sandshrew', ['ground'], [50, 75, 85, 20, 30, 40], 'common', 'desert', ['sandslash', 50, 22]],
    [28, 'Sandslash', ['ground'], [75, 100, 110, 45, 55, 65], 'rare', 'desert'],
    [74, 'Geodude', ['rock', 'ground'], [40, 80, 100, 30, 30, 20], 'common', 'cave,volcano,desert,snow', ['graveler', 25, 25]],
    [75, 'Graveler', ['rock', 'ground'], [55, 95, 115, 45, 45, 35], 'rare', 'cave,volcano,desert,snow', ['golem', 100, 40]],
    [76, 'Golem', ['rock', 'ground'], [80, 120, 130, 55, 65, 45], 'rare', 'cave,volcano,desert,snow'],
    [95, 'Onix', ['rock', 'ground'], [35, 45, 160, 30, 45, 70], 'rare', 'cave,desert,snow', ['steelix', 50, null, 'metal-coat']],
    [208, 'Steelix', ['steel', 'ground'], [75, 85, 200, 55, 65, 30], 'rare', 'cave,desert,snow'],
    [111, 'Rhyhorn', ['ground', 'rock'], [80, 85, 95, 30, 30, 25], 'common', 'desert,volcano', ['rhydon', 50, 42]],
    [112, 'Rhydon', ['ground', 'rock'], [105, 130, 120, 45, 45, 40], 'rare', 'desert,volcano', ['rhyperior', 100, null, 'protector']],
    [464, 'Rhyperior', ['ground', 'rock'], [115, 140, 130, 55, 55, 40], 'rare', 'desert,volcano'],
    [246, 'Larvitar', ['rock', 'ground'], [50, 64, 50, 45, 50, 41], 'rare', 'cave,desert', ['pupitar', 25, 30]],
    [247, 'Pupitar', ['rock', 'ground'], [70, 84, 70, 65, 70, 51], 'rare', 'cave,desert', ['tyranitar', 100, 55]],
    [248, 'Tyranitar', ['rock', 'dark'], [100, 134, 110, 95, 100, 61], 'legendary', 'cave,desert'],
    [142, 'Aerodactyl', ['rock', 'flying'], [80, 105, 65, 60, 75, 130], 'legendary', 'desert,snow'],
    [185, 'Sudowoodo', ['rock'], [70, 100, 115, 30, 65, 30], 'rare', 'forest,desert'],
    [222, 'Corsola', ['water', 'rock'], [65, 55, 95, 65, 95, 35], 'rare', 'beach'],
    [299, 'Nosepass', ['rock'], [30, 45, 135, 45, 90, 30], 'common', 'cave', ['probopass', 50, 40]],
    [476, 'Probopass', ['rock', 'steel'], [60, 55, 145, 75, 150, 40], 'rare', 'cave'],

    /* ================= NƯỚC ================= */
    [72, 'Tentacool', ['water', 'poison'], [40, 40, 35, 50, 100, 70], 'common', 'beach', ['tentacruel', 50, 30]],
    [73, 'Tentacruel', ['water', 'poison'], [80, 70, 65, 80, 120, 100], 'rare', 'beach'],
    [60, 'Poliwag', ['water'], [40, 50, 40, 40, 40, 90], 'common', 'lake', ['poliwhirl', 25, 25]],
    [61, 'Poliwhirl', ['water'], [65, 65, 65, 50, 50, 90], 'rare', 'lake', ['poliwrath', 100, null, 'water-stone']],
    [62, 'Poliwrath', ['water', 'fighting'], [90, 95, 95, 70, 90, 70], 'rare', 'lake'],
    [79, 'Slowpoke', ['water', 'psychic'], [90, 65, 65, 40, 40, 15], 'common', 'lake,beach', ['slowbro', 50, 37]],
    [80, 'Slowbro', ['water', 'psychic'], [95, 75, 110, 100, 80, 30], 'rare', 'lake,beach'],
    [116, 'Horsea', ['water'], [30, 40, 70, 70, 25, 60], 'common', 'beach,lake', ['seadra', 25, 32]],
    [117, 'Seadra', ['water'], [55, 65, 95, 95, 45, 85], 'rare', 'beach,lake', ['kingdra', 100, null, 'dragon-scale']],
    [230, 'Kingdra', ['water', 'dragon'], [75, 95, 95, 95, 95, 85], 'rare', 'beach,lake'],
    [120, 'Staryu', ['water'], [30, 45, 55, 70, 55, 85], 'common', 'beach,cerulean', ['starmie', 50, null, 'water-stone']],
    [121, 'Starmie', ['water', 'psychic'], [60, 75, 85, 100, 85, 115], 'rare', 'beach,cerulean'],
    [131, 'Lapras', ['water', 'ice'], [130, 85, 80, 85, 95, 60], 'legendary', 'beach,lake,snow,cerulean'],
    [170, 'Chinchou', ['water', 'electric'], [75, 38, 38, 56, 56, 67], 'common', 'beach', ['lanturn', 50, 27]],
    [171, 'Lanturn', ['water', 'electric'], [125, 58, 58, 76, 76, 67], 'rare', 'beach'],
    [183, 'Marill', ['water', 'fairy'], [70, 20, 50, 20, 50, 40], 'common', 'lake', ['azumarill', 25, 18]],
    [184, 'Azumarill', ['water', 'fairy'], [100, 50, 80, 60, 80, 50], 'rare', 'lake'],
    [194, 'Wooper', ['water', 'ground'], [55, 45, 45, 25, 25, 15], 'common', 'lake', ['quagsire', 25, 20]],
    [195, 'Quagsire', ['water', 'ground'], [95, 85, 85, 65, 65, 35], 'rare', 'lake'],
    [318, 'Carvanha', ['water', 'dark'], [45, 90, 20, 65, 20, 65], 'common', 'beach', ['sharpedo', 50, 30]],
    [319, 'Sharpedo', ['water', 'dark'], [70, 120, 40, 95, 40, 95], 'rare', 'beach'],

    /* ================= CỎ / ĐỘC ================= */
    [43, 'Oddish', ['grass', 'poison'], [45, 50, 55, 75, 65, 30], 'common', 'forest', ['gloom', 25, 21]],
    [44, 'Gloom', ['grass', 'poison'], [60, 65, 70, 85, 75, 40], 'rare', 'forest', ['vileplume', 100, null, 'leaf-stone']],
    [45, 'Vileplume', ['grass', 'poison'], [75, 80, 85, 110, 90, 50], 'rare', 'forest'],

    /* ================= LỬA ================= */
    [37, 'Vulpix', ['fire'], [38, 41, 40, 50, 65, 65], 'common', 'volcano', ['ninetales', 50, null, 'fire-stone']],
    [38, 'Ninetales', ['fire'], [73, 76, 75, 81, 100, 100], 'rare', 'volcano'],
    [58, 'Growlithe', ['fire'], [55, 70, 45, 70, 50, 60], 'common', 'volcano', ['arcanine', 50, null, 'fire-stone']],
    [59, 'Arcanine', ['fire'], [90, 110, 80, 100, 80, 95], 'rare', 'volcano'],
    [228, 'Houndour', ['fire', 'dark'], [45, 60, 30, 80, 50, 65], 'common', 'volcano', ['houndoom', 50, 24]],
    [229, 'Houndoom', ['fire', 'dark'], [75, 90, 50, 110, 80, 95], 'rare', 'volcano'],

    /* ================= LINH TINH ================= */
    [39, 'Jigglypuff', ['normal', 'fairy'], [115, 45, 20, 45, 25, 20], 'common', 'forest,city', ['wigglytuff', 50, null, 'moon-stone']],
    [40, 'Wigglytuff', ['normal', 'fairy'], [140, 70, 45, 85, 50, 45], 'rare', 'city'],
    [35, 'Clefairy', ['fairy'], [70, 45, 48, 60, 65, 35], 'rare', 'forest,city', ['clefable', 50, null, 'moon-stone']],
    [36, 'Clefable', ['fairy'], [95, 70, 73, 95, 90, 60], 'rare', 'forest,city'],
    [122, 'Mr. Mime', ['psychic', 'fairy'], [40, 45, 65, 100, 120, 90], 'rare', 'city,celadon', null, { id: 'mr-mime' }],
    [303, 'Mawile', ['steel', 'fairy'], [50, 85, 85, 55, 55, 50], 'rare', 'cave,city'],

    /* ================= MA / SIÊU LINH ================= */
    [41, 'Zubat', ['poison', 'flying'], [40, 45, 35, 30, 40, 55], 'common', 'cave', ['golbat', 25, 22]],
    [42, 'Golbat', ['poison', 'flying'], [75, 80, 70, 65, 75, 90], 'rare', 'cave', ['crobat', 100, 40]],
    [169, 'Crobat', ['poison', 'flying'], [85, 90, 80, 70, 80, 130], 'rare', 'cave'],
    [63, 'Abra', ['psychic'], [25, 20, 15, 105, 55, 90], 'rare', 'city,cave,celadon', ['kadabra', 25, 16]],
    [64, 'Kadabra', ['psychic'], [40, 35, 30, 120, 70, 105], 'rare', 'city,cave', ['alakazam', 100, 36]],
    [65, 'Alakazam', ['psychic'], [55, 50, 45, 135, 95, 120], 'rare', 'city'],
    [92, 'Gastly', ['ghost', 'poison'], [30, 35, 30, 100, 35, 80], 'common', 'cave', ['haunter', 25, 25]],
    [93, 'Haunter', ['ghost', 'poison'], [45, 50, 45, 115, 55, 95], 'rare', 'cave', ['gengar', 100, 40]],
    [94, 'Gengar', ['ghost', 'poison'], [60, 65, 60, 130, 75, 110], 'rare', 'cave'],
    [200, 'Misdreavus', ['ghost'], [60, 60, 60, 85, 85, 85], 'rare', 'cave', ['mismagius', 50, null, 'dusk-stone']],
    [429, 'Mismagius', ['ghost'], [60, 60, 60, 105, 105, 105], 'rare', 'cave'],
    [198, 'Murkrow', ['dark', 'flying'], [60, 85, 42, 85, 42, 91], 'common', 'city,cave', ['honchkrow', 50, null, 'dusk-stone']],
    [430, 'Honchkrow', ['dark', 'flying'], [100, 125, 52, 105, 52, 71], 'rare', 'city,cave'],
    [359, 'Absol', ['dark'], [65, 130, 60, 75, 60, 75], 'rare', 'cave,snow'],
    [778, 'Mimikyu', ['ghost', 'fairy'], [55, 90, 80, 50, 105, 96], 'rare', 'cave'],

    /* ================= CHIẾN BINH ================= */
    [66, 'Machop', ['fighting'], [70, 80, 50, 35, 35, 35], 'common', 'cave', ['machoke', 25, 28]],
    [67, 'Machoke', ['fighting'], [80, 100, 70, 50, 60, 45], 'rare', 'cave', ['machamp', 100, 42]],
    [68, 'Machamp', ['fighting'], [90, 130, 80, 65, 85, 55], 'rare', 'cave,celadon'],
    [106, 'Hitmonlee', ['fighting'], [50, 120, 53, 35, 110, 87], 'rare', 'cave'],
    [447, 'Riolu', ['fighting'], [40, 70, 40, 35, 40, 60], 'rare', 'cave', ['lucario', 50, 30, 'day']],
    [448, 'Lucario', ['fighting', 'steel'], [70, 110, 70, 115, 70, 90], 'rare', 'cave'],
    [453, 'Croagunk', ['poison', 'fighting'], [48, 61, 40, 61, 40, 50], 'common', 'cave,lake', ['toxicroak', 50, 37]],
    [454, 'Toxicroak', ['poison', 'fighting'], [83, 106, 65, 86, 65, 85], 'rare', 'cave,lake'],

    /* ================= BĂNG ================= */
    [220, 'Swinub', ['ice', 'ground'], [50, 50, 40, 30, 30, 50], 'common', 'snow', ['piloswine', 25, 33]],
    [221, 'Piloswine', ['ice', 'ground'], [100, 100, 80, 60, 60, 50], 'rare', 'snow', ['mamoswine', 100, 45]],
    [473, 'Mamoswine', ['ice', 'ground'], [110, 130, 80, 70, 60, 80], 'rare', 'snow'],
    [361, 'Snorunt', ['ice'], [50, 50, 50, 50, 50, 50], 'common', 'snow', ['glalie', 50, 42]],
    [362, 'Glalie', ['ice'], [80, 80, 80, 80, 80, 80], 'rare', 'snow'],
    [363, 'Spheal', ['water', 'ice'], [70, 40, 50, 55, 50, 25], 'common', 'snow', ['sealeo', 25, 32]],
    [364, 'Sealeo', ['water', 'ice'], [90, 60, 70, 75, 70, 45], 'rare', 'snow', ['walrein', 100, 44]],
    [365, 'Walrein', ['water', 'ice'], [110, 80, 90, 95, 90, 65], 'rare', 'snow'],
    [461, 'Weavile', ['dark', 'ice'], [70, 120, 65, 45, 85, 125], 'rare', 'snow'],

    /* ================= RỒNG ================= */
    [147, 'Dratini', ['dragon'], [41, 64, 45, 50, 50, 50], 'rare', 'lake', ['dragonair', 25, 30]],
    [148, 'Dragonair', ['dragon'], [61, 84, 65, 70, 70, 70], 'rare', 'lake', ['dragonite', 100, 55]],
    [149, 'Dragonite', ['dragon', 'flying'], [91, 134, 95, 100, 100, 80], 'legendary', 'lake,indigo'],
    [443, 'Gible', ['dragon', 'ground'], [58, 70, 45, 40, 45, 42], 'rare', 'desert,cave', ['gabite', 25, 24]],
    [444, 'Gabite', ['dragon', 'ground'], [68, 90, 65, 50, 55, 82], 'rare', 'desert,cave', ['garchomp', 100, 48]],
    [445, 'Garchomp', ['dragon', 'ground'], [108, 130, 95, 80, 85, 102], 'legendary', 'desert'],

    /* ================= KHÁC ================= */
    [123, 'Scyther', ['bug', 'flying'], [70, 110, 80, 55, 80, 105], 'rare', 'forest', ['scizor', 50, null, 'metal-coat']],
    [212, 'Scizor', ['bug', 'steel'], [70, 130, 100, 55, 80, 65], 'rare', 'forest'],
    [235, 'Smeargle', ['neutral'], [55, 20, 35, 20, 45, 75], 'rare', 'city', null, { canElemental: false }],
    [351, 'Castform', ['neutral'], [70, 70, 70, 70, 70, 70], 'rare', 'city', null, { canElemental: false }],
    [636, 'Larvesta', ['bug', 'fire'], [55, 85, 55, 50, 55, 60], 'rare', 'volcano', ['volcarona', 100, 59]],
    [637, 'Volcarona', ['bug', 'fire'], [85, 60, 65, 135, 105, 100], 'legendary', 'volcano'],
    [570, 'Zorua', ['dark'], [40, 65, 40, 80, 40, 65], 'rare', 'city', ['zoroark', 50, 30]],
    [571, 'Zoroark', ['dark'], [60, 105, 60, 120, 60, 105], 'rare', 'city'],
    [479, 'Rotom', ['electric', 'ghost'], [50, 50, 77, 95, 77, 91], 'rare', 'city'],

    /* ================= HUYỀN THOẠI ================= */
    [151, 'Mew', ['celestial'], [100, 100, 100, 100, 100, 100], 'legendary', 'temple,indigo', null, { canElemental: false, size: 'small', desc: 'Sinh vật huyền bí mang gen của mọi loài Pokémon. Hào quang Thiên giới bao phủ quanh nó.' }],
    [385, 'Jirachi', ['celestial'], [100, 100, 100, 100, 100, 100], 'legendary', 'temple', null, { canElemental: false, size: 'small', desc: 'Pokémon ước nguyện, chỉ thức giấc mỗi nghìn năm. Ai chạm vào nó sẽ có một điều ước.' }],
    [493, 'Arceus', ['celestial'], [120, 120, 120, 120, 120, 120], 'legendary', 'temple', null, { canElemental: false, size: 'large', desc: 'Đấng sáng tạo của vũ trụ Pokémon. Sức mạnh Thiên giới của nó không hệ nào sánh được.' }],
    [494, 'Victini', ['celestial'], [100, 100, 100, 100, 100, 100], 'legendary', 'temple', null, { canElemental: false, size: 'small', desc: 'Pokémon chiến thắng, mang lại may mắn tuyệt đối cho người huấn luyện.' }],
    [250, 'Ho-Oh', ['fire', 'flying'], [106, 130, 90, 110, 154, 90], 'legendary', 'temple', null, { canElemental: false, size: 'large' }],
    [249, 'Lugia', ['psychic', 'flying'], [106, 90, 130, 90, 154, 110], 'legendary', 'temple', null, { canElemental: false, size: 'large' }],
    [243, 'Raikou', ['electric'], [90, 85, 75, 115, 100, 115], 'legendary', 'temple,forest', null, { canElemental: false }],
    [244, 'Entei', ['fire'], [115, 115, 85, 90, 75, 100], 'legendary', 'temple,volcano', null, { canElemental: false }],
    [245, 'Suicune', ['water'], [100, 75, 115, 90, 115, 85], 'legendary', 'temple,lake', null, { canElemental: false }],
    [251, 'Celebi', ['grass', 'psychic'], [100, 100, 100, 100, 100, 100], 'legendary', 'temple,forest', null, { canElemental: false, size: 'small' }],
    [377, 'Regirock', ['rock'], [80, 100, 200, 50, 100, 50], 'legendary', 'temple,cave', null, { canElemental: false }],
    [378, 'Regice', ['ice'], [80, 50, 100, 100, 200, 50], 'legendary', 'temple,snow', null, { canElemental: false }],
    [379, 'Registeel', ['steel'], [80, 75, 150, 75, 150, 50], 'legendary', 'temple,cave', null, { canElemental: false }],
    [380, 'Latias', ['dragon', 'psychic'], [80, 80, 90, 110, 130, 110], 'legendary', 'temple', null, { canElemental: false }],
    [381, 'Latios', ['dragon', 'psychic'], [80, 90, 80, 130, 110, 110], 'legendary', 'temple', null, { canElemental: false }],
    [384, 'Rayquaza', ['dragon', 'flying'], [105, 150, 90, 150, 90, 95], 'legendary', 'temple', null, { canElemental: false, size: 'large' }],

    /* ================= HOENN ================= */
    [280, 'Ralts', ['psychic', 'fairy'], [28, 25, 25, 45, 35, 40], 'rare', 'city,forest', ['kirlia', 25, 20]],
    [281, 'Kirlia', ['psychic', 'fairy'], [38, 35, 35, 65, 55, 50], 'rare', 'city,forest', ['gardevoir', 100, 30]],
    [282, 'Gardevoir', ['psychic', 'fairy'], [68, 65, 65, 125, 115, 80], 'rare', 'city,forest'],
    [309, 'Electrike', ['electric'], [40, 45, 40, 65, 40, 65], 'common', 'city', ['manectric', 50, 26]],
    [310, 'Manectric', ['electric'], [70, 75, 60, 105, 60, 105], 'rare', 'city'],
    [333, 'Swablu', ['normal', 'flying'], [45, 40, 60, 40, 75, 50], 'common', 'snow,forest', ['altaria', 50, 35]],
    [334, 'Altaria', ['dragon', 'flying'], [75, 70, 90, 70, 105, 80], 'rare', 'snow'],
    [374, 'Beldum', ['steel', 'psychic'], [40, 55, 80, 35, 60, 30], 'rare', 'cave', ['metang', 25, 20]],
    [375, 'Metang', ['steel', 'psychic'], [60, 75, 100, 55, 80, 50], 'rare', 'cave', ['metagross', 100, 45]],
    [376, 'Metagross', ['steel', 'psychic'], [80, 135, 130, 95, 90, 70], 'legendary', 'cave']
  ]);
})();
