/* ============================================================
   HONKAI: NEXUS ANIMA — ĐỢT 3 (dex 9643-9662)
   20 Anima bổ sung, artwork thật từ hna.wiki, nền trong suốt 256×256.
   Dex / id / tên / ảnh / hệ / tổ hợp vùng sống không trùng các loài cũ.
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  PG.addSpecies([
    [9643, 'Hugglebeary', ['normal', 'fighting'], [90, 100, 85, 65, 75, 65], 'common', 'beach,forest', null,
      { id: 'cross-anima-hugglebeary', desc: 'Anima gấu ôm lấy đối thủ rồi lao tới bằng cú húc gấu dữ dội.' }],
    [9644, 'Baggle', ['normal', 'ground'], [85, 90, 80, 70, 70, 60], 'common', 'cave,lake', null,
      { id: 'cross-anima-baggle', desc: 'Anima chiếc túi biết đi, chứa đầy cát và đất trong bụng.' }],
    [9645, 'Umpurrella', ['water', 'fairy'], [80, 85, 75, 100, 90, 80], 'rare', 'desert,temple', null,
      { id: 'cross-anima-umpurrella', desc: 'Anima mèo mang ô, mở ô ra tạo màn mưa ngọc chói lóa.' }],
    [9646, 'Sharkalaka', ['water', 'dragon'], [95, 115, 90, 85, 85, 95], 'legendary', 'snow,beach', null,
      { id: 'cross-anima-sharkalaka', desc: 'Anima cá mập nhảy múa trên sóng, lao xuống từ trên không như rồng biển.' }],
    [9647, 'Ugglewing', ['flying', 'bug'], [70, 85, 65, 80, 70, 110], 'common', 'city,beach', null,
      { id: 'cross-anima-ugglewing', desc: 'Anima cánh mềm rung liên hồi, lướt qua tán lá bằng cơn gió nhỏ.' }],
    [9648, 'Goldfogey', ['steel', 'psychic'], [100, 95, 110, 90, 95, 45], 'rare', 'volcano,temple', null,
      { id: 'cross-anima-goldfogey', desc: 'Anima cụ già mạ vàng, đãng trí nhưng nhớ từng cú đánh của đối thủ.' }],
    [9649, 'Mariminnow', ['water', 'psychic'], [75, 90, 70, 105, 85, 85], 'rare', 'pal-lava,forest', null,
      { id: 'cross-anima-mariminnow', desc: 'Anima cá marimba, gõ nhịp sóng nước làm đối thủ mất phương hướng.' }],
    [9650, 'Muscimmon', ['grass', 'poison'], [85, 80, 85, 100, 90, 55], 'common', 'pal-tundra,digi-forest', null,
      { id: 'cross-anima-muscimmon', desc: 'Anima nấm hoang dã, phun bào tử độc làm đối thủ ngủ mê trong hoang địa.' }],
    [9651, 'Sunspottie', ['fire', 'grass'], [80, 95, 70, 100, 85, 75], 'rare', 'digi-city,beach', null,
      { id: 'cross-anima-sunspottie', desc: 'Anima đốm nắng, quang hợp rồi phóng tia lửa nóng bỏng.' }],
    [9652, 'Pumpkimp', ['grass', 'ghost'], [90, 100, 85, 95, 85, 60], 'rare', 'pal-isles,lake', null,
      { id: 'cross-anima-pumpkimp', desc: 'Anima bí ngô quái đản, gọi hồn đêm để cười nhạo đối thủ.' }],
    [9653, 'Jerboranj', ['normal', 'ground'], [75, 95, 65, 60, 65, 120], 'common', 'digi-forest,city', null,
      { id: 'cross-anima-jerboranj', desc: 'Anima chuột nhảy, bắn ga làm cú đáp xuống nổ tung như bom.' }],
    [9654, 'Sootsie', ['fire', 'dark'], [75, 100, 70, 95, 80, 90], 'rare', 'digi-temple,lake', null,
      { id: 'cross-anima-sootsie', desc: 'Anima đốm bồ hóng, phát sáng trong bóng tối và đỡ lấy ngôi sao.' }],
    [9655, 'Broomba', ['flying', 'grass'], [70, 80, 65, 85, 80, 100], 'common', 'pallet,desert', null,
      { id: 'cross-anima-broomba', desc: 'Anima chổi biết bay, quét sạch bụi và tinh khiết hóa chiến trường.' }],
    [9656, 'Famishade', ['ghost', 'dark'], [85, 110, 75, 105, 85, 85], 'legendary', 'viridian,temple', null,
      { id: 'cross-anima-famishade', desc: 'Anima bóng ma đói khát, nuốt lấy sức sống của đối thủ mỗi lần tấn công.' }],
    [9657, 'Hoggit', ['ground', 'normal'], [110, 105, 100, 60, 70, 50], 'common', 'cerulean,forest', null,
      { id: 'cross-anima-hoggit', desc: 'Anima lợn rừng đào bới, húc tung đất đá trước mặt.' }],
    [9658, 'Fyrklor', ['fire', 'dragon'], [100, 125, 95, 110, 95, 80], 'legendary', 'vermilion,temple', null,
      { id: 'cross-anima-fyrklor', desc: 'Anima vuốt lửa, đốt cháy vĩnh cửu bằng ngọn lửa không bao giờ tắt.' }],
    [9659, 'Seroplumanth', ['flying', 'fairy'], [85, 95, 75, 100, 90, 100], 'rare', 'celadon,lake', null,
      { id: 'cross-anima-seroplumanth', desc: 'Anima lông trắng xoáy thành cơn gió, làm đối thủ bay khỏi sân.' }],
    [9660, 'Mesmerith', ['psychic', 'dark'], [80, 90, 75, 120, 100, 90], 'legendary', 'indigo,beach', null,
      { id: 'cross-anima-mesmerith', desc: 'Anima thôi miên, biến những con dơi thành cơn mưa máu trong đêm.' }],
    [9661, 'Atragasus', ['water', 'dark'], [95, 110, 90, 105, 90, 85], 'rare', 'cave,desert', null,
      { id: 'cross-anima-atragasus', desc: 'Anima ngựa mực, phủ màn đen xung quanh móng guốc trước khi đá.' }],
    [9662, 'Shampoco', ['water', 'fairy'], [80, 85, 70, 110, 100, 95], 'common', 'snow,viridian', null,
      { id: 'cross-anima-shampoco', desc: 'Anima bọt xà phòng khổng lồ, bọc đối thủ trong bong bóng lấp lánh.' }]
  ]);
})();
