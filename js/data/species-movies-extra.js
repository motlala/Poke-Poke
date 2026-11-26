/* ============================================================
   POKÉMON TRONG PHIM — ĐỢT BỔ SUNG (dex 9393-9422)
   Các dạng điện ảnh chính thức (Mega, Nguyên Thủy, mũ Pikachu,
   bạn đồng hành của Team Rocket/Ash/Iris...). Artwork được ánh xạ
   qua artDex tới PokéAPI bởi bản finalize/phụ trợ.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  PG.addSpecies([
    /* ---------- Huyền thoại / thần thoại điện ảnh ---------- */
    [9393, 'Mewtwo Mega X', ['psychic', 'fighting'], [106, 190, 100, 154, 100, 130], 'legendary', 'temple,city', null,
      { id: 'film-mewtwo-mega-x', desc: 'Mewtwo chuyển hóa sang dạng Mega X trong phim, cơ thể phủ giáp và sức mạnh cơ bắp vượt trội.', artDex: 10043, size: 'large' }],
    [9394, 'Mewtwo Mega Y', ['psychic'], [106, 150, 70, 194, 120, 140], 'legendary', 'temple,city', null,
      { id: 'film-mewtwo-mega-y', desc: 'Dạng Mega Y xuất hiện trong phim Genesect, năng lực tâm linh dội ra như một cơn bão.', artDex: 10044, size: 'large' }],
    [9395, 'Giratina Hình Nguyên Thủy', ['ghost', 'dragon'], [150, 115, 120, 125, 120, 90], 'legendary', 'temple,cave', null,
      { id: 'film-giratina-origin', desc: 'Hình dạng thật của Giratina trong phim Giratina và Chiến binh Bầu Trời, cuộn mình như một con rồng ma.', artDex: 10007, size: 'large' }],
    [9396, 'Kyogre Nguyên Thủy', ['water'], [100, 150, 90, 180, 160, 90], 'legendary', 'temple,beach', null,
      { id: 'film-kyogre-primal', desc: 'Kyogre lấy lại vóc dáng nguyên thủy, sóng nước bao phủ cả vùng biển trong phim.', artDex: 10077, size: 'large' }],
    [9397, 'Groudon Nguyên Thủy', ['ground', 'fire'], [100, 180, 160, 150, 90, 90], 'legendary', 'temple,desert', null,
      { id: 'film-groudon-primal', desc: 'Groudon nguyên bản với lớp vỏ nung chảy, từng bước làm khô cạn cả lục địa.', artDex: 10078, size: 'large' }],
    [9398, 'Rayquaza Mega', ['dragon', 'flying'], [105, 215, 115, 125, 95, 145], 'legendary', 'temple', null,
      { id: 'film-rayquaza-mega', desc: 'Rồng tầng ozone hóa Mega, luồng năng lượng xanh chạy dọc thân khi bảo vệ bầu trời.', artDex: 10079, size: 'large' }],
    [9399, 'Latias Mega', ['psychic', 'dragon'], [80, 100, 120, 140, 150, 110], 'legendary', 'temple', null,
      { id: 'film-latias-mega', desc: 'Latias trong bộ giáp Mega, lồng ngực phản chiếu ánh sáng như một tấm gương.', artDex: 10062, size: 'large' }],
    [9400, 'Latios Mega', ['psychic', 'dragon'], [80, 130, 100, 160, 120, 110], 'legendary', 'temple', null,
      { id: 'film-latios-mega', desc: 'Latios hóa Mega với lớp giáp xanh dương, bay song hành cùng người chị trong phim.', artDex: 10063, size: 'large' }],

    /* ---------- Mega từng xuất hiện trong anime / phim ---------- */
    [9401, 'Lucario Mega', ['fighting', 'steel'], [80, 145, 88, 140, 70, 112], 'legendary', 'temple,cave', null,
      { id: 'film-lucario-mega', desc: 'Lucario bộc phát toàn bộ Aura, lớp lông hóa giáp và dẫn truyền sức mạnh tâm linh.', artDex: 10059 }],
    [9402, 'Blaziken Mega', ['fire', 'fighting'], [80, 160, 80, 130, 80, 100], 'legendary', 'volcano,city', null,
      { id: 'film-blaziken-mega', desc: 'Chiến binh lửa hóa Mega, ngọn lửa quấn quanh chân như những cánh đuôi rực cháy.', artDex: 10050 }],
    [9403, 'Gyarados Mega', ['water', 'dark'], [95, 155, 109, 70, 130, 81], 'legendary', 'lake,beach', null,
      { id: 'film-gyarados-mega', desc: 'Gyarados hóa Mega với bộ râu đen và vảy đỏ, cơn thịnh nộ trở nên đáng sợ hơn.', artDex: 10041, size: 'large' }],
    [9404, 'Ampharos Mega', ['electric', 'dragon'], [90, 95, 105, 165, 110, 45], 'legendary', 'forest,city', null,
      { id: 'film-ampharos-mega', desc: 'Ampharos mang trong mình năng lượng rồng, tia sét từ antenna chạy khắp cơ thể.', artDex: 10045 }],
    [9405, 'Abomasnow Mega', ['grass', 'ice'], [90, 132, 105, 132, 105, 30], 'legendary', 'snow,forest', null,
      { id: 'film-abomasnow-mega', desc: 'Khổng lồ tuyết hóa Mega, vòng lông quanh eo bung ra thành những cánh băng sắc.', artDex: 10060, size: 'large' }],
    [9406, 'Lopunny Mega', ['normal', 'fighting'], [65, 136, 94, 54, 96, 135], 'legendary', 'city,forest', null,
      { id: 'film-lopunny-mega', desc: 'Dạng Mega của Lopunny với đôi tai dài hóa thành vũ khí, chuyển sang hệ Giác đấu.', artDex: 10088 }],
    [9407, 'Beedrill Mega', ['bug', 'poison'], [65, 150, 40, 15, 80, 145], 'legendary', 'forest', null,
      { id: 'film-beedrill-mega', desc: 'Bọ ong hóa Mega, hai ngòi độc dài hơn và sải cánh sắc như lưỡi dao.', artDex: 10090 }],
    [9408, 'Pidgeot Mega', ['normal', 'flying'], [83, 80, 80, 135, 80, 121], 'legendary', 'forest,city', null,
      { id: 'film-pidgeot-mega', desc: 'Pidgeot hóa Mega, bộ lông trên đỉnh đầu xòe ra như vương miện giữa cơn gió.', artDex: 10073 }],

    /* ---------- Pikachu mũ phiên bản điện ảnh / anime ---------- */
    [9409, 'Pikachu Mũ Nguyên Thủy', ['electric'], [35, 55, 40, 50, 50, 90], 'rare', 'forest,city', null,
      { id: 'film-pikachu-original-cap', desc: 'Pikachu đội chiếc mũ nguyên bản, biểu tượng của những chuyến phiêu lưu đầu tiên.', artDex: 10094, size: 'small' }],
    [9410, 'Pikachu Mũ Hoenn', ['electric'], [35, 55, 40, 50, 50, 90], 'rare', 'forest,beach', null,
      { id: 'film-pikachu-hoenn-cap', desc: 'Chiếc mũ vùng Hoenn theo chân Pikachu qua những trận đấu ngoài biển xanh.', artDex: 10095, size: 'small' }],
    [9411, 'Pikachu Mũ Sinnoh', ['electric'], [35, 55, 40, 50, 50, 90], 'rare', 'forest,snow', null,
      { id: 'film-pikachu-sinnoh-cap', desc: 'Pikachu đội mũ Sinnoh, gợi nhớ hành trình đến những vùng đất tuyết phủ.', artDex: 10096, size: 'small' }],
    [9412, 'Pikachu Mũ Unova', ['electric'], [35, 55, 40, 50, 50, 90], 'rare', 'forest,city', null,
      { id: 'film-pikachu-unova-cap', desc: 'Chiếc mũ Unova sắc trắng đen, đồng hành cùng Pikachu trong các phim vùng mới.', artDex: 10097, size: 'small' }],
    [9413, 'Pikachu Mũ Kalos', ['electric'], [35, 55, 40, 50, 50, 90], 'rare', 'forest,city', null,
      { id: 'film-pikachu-kalos-cap', desc: 'Pikachu trong chiếc mũ Kalos, sắc đỏ nổi bật giữa phố phường và rừng cây.', artDex: 10098, size: 'small' }],
    [9414, 'Pikachu Mũ Alola', ['electric'], [35, 55, 40, 50, 50, 90], 'rare', 'beach,forest', null,
      { id: 'film-pikachu-alola-cap', desc: 'Mũ Alola theo phong cách quần đảo, Pikachu vừa lướt sóng vừa phóng điện.', artDex: 10099, size: 'small' }],
    [9415, 'Pikachu Mũ Đối Tác', ['electric'], [35, 55, 40, 50, 50, 90], 'rare', 'city,forest', null,
      { id: 'film-pikachu-partner-cap', desc: 'Chiếc mũ bạn đồng hành, biểu tượng cho sợi dây gắn kết giữa Pikachu và huấn luyện viên.', artDex: 10148, size: 'small' }],

    /* ---------- Bạn đồng hành còn lại ----------
       9419 Cacnea giữ lại: artwork không trùng loài nào khác trong game. */
    [9419, 'Cacnea James', ['grass'], [50, 85, 40, 85, 40, 35], 'rare', 'desert,forest', null,
      { id: 'film-cacnea-james', desc: 'Cacnea của James, loài xương rồng nhỏ ôm chặt lấy cậu mỗi khi kế hoạch thất bại.', artDex: 331, size: 'small' }],

    /* ---------- Dạng đặc biệt khác ----------
       Bỏ 9416/9417/9418/9420/9421 (Meowth/Wobbuffet/Arbok/Hydreigon/Mimikyu
       bản phim): artwork trùng loài chính thức nên chỉ giữ lại 1 con. */

    [9422, 'Zygarde Hoàn Hảo', ['dragon', 'ground'], [108, 216, 121, 91, 95, 95], 'legendary', 'temple,cave', null,
      { id: 'film-zygarde-complete', desc: 'Zygarde hợp nhất mọi tế bào thành dạng hoàn hảo, canh giữ trật tự của cả vùng đất.', artDex: 10120, size: 'large' }]
  ]);
})();
