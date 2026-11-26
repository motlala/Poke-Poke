/* ============================================================
   POKÉMON CHÍNH THỨC BỔ SUNG — ĐỢT 5 (dex game 9783-9882)
   100 loài Gen 3/4 chưa có trong game; hệ + chỉ số thật từ PokéAPI,
   artwork thật official-artwork (artDex = dex quốc tế tương ứng).
   ============================================================ */
(function () {
  'use strict';
  const PG = window.PG = window.PG || {};

  const E = (artDex, desc) => ({ id: 'sp100a-' + artDex, artDex, desc });

  PG.addSpecies([
    [9783, 'Granbull', ['fairy'], [90, 120, 75, 60, 60, 45], 'common', 'forest,city', null,
      E(210, 'Granbull là Pokémon hệ Tiên rải bụi phép sáng rực.')],

    [9784, 'Slugma', ['fire'], [40, 40, 40, 70, 40, 20], 'common', 'volcano,desert', null,
      E(218, 'Slugma là Pokémon hệ Lửa phun lửa từ miệng khi bị ép sát.')],

    [9785, 'Magcargo', ['fire', 'rock'], [60, 50, 120, 90, 80, 30], 'common', 'volcano,desert', null,
      E(219, 'Magcargo là Pokémon hệ Lửa/Đá mang lõi nhiệt không bao giờ nguội.')],

    [9786, 'Delibird', ['ice', 'flying'], [45, 55, 45, 65, 45, 75], 'common', 'snow,pal-tundra', null,
      E(225, 'Delibird là Pokémon hệ Băng/Bay bọc cơ thể bằng lớp băng dày.')],

    [9787, 'Phanpy', ['ground'], [90, 60, 60, 40, 40, 40], 'common', 'cave,desert', null,
      E(231, 'Phanpy là Pokémon hệ Đất đập đất gây rung chuyển.')],

    [9788, 'Stantler', ['normal'], [73, 95, 62, 85, 65, 85], 'common', 'forest,city', null,
      E(234, 'Stantler là Pokémon hệ Thường xoay người cực nhanh để né đòn.')],

    [9789, 'Tyrogue', ['fighting'], [35, 35, 35, 35, 35, 35], 'common', 'city,viridian', null,
      E(236, 'Tyrogue là Pokémon hệ Giác đấu đấm liên tục bằng nắm đấm cứng.')],

    [9790, 'Smoochum', ['ice', 'psychic'], [45, 30, 15, 85, 65, 65], 'common', 'snow,pal-tundra', null,
      E(238, 'Smoochum là Pokémon hệ Băng/Siêu linh hạ nhiệt độ quanh mình xuống mức đóng băng.')],

    [9791, 'Elekid', ['electric'], [45, 63, 37, 65, 55, 95], 'common', 'city,vermilion', null,
      E(239, 'Elekid là Pokémon hệ Điện chạy nhanh hơn cả tia chớp.')],

    [9792, 'Magby', ['fire'], [45, 75, 37, 70, 55, 83], 'common', 'volcano,desert', null,
      E(240, 'Magby là Pokémon hệ Lửa ung đốt đối thủ bằng hơi nóng rực.')],

    [9793, 'Poochyena', ['dark'], [35, 55, 35, 30, 30, 35], 'common', 'cave,temple', ['sp100a-262', 18],
      E(261, 'Poochyena là Pokémon hệ Bóng tối phản đòn từ bóng tối.')],

    [9794, 'Mightyena', ['dark'], [70, 90, 70, 60, 60, 70], 'rare', 'cave,temple', null,
      E(262, 'Mightyena là Pokémon hệ Bóng tối làm đối phương hoang mang bằng ảo giác.')],

    [9795, 'Zigzagoon', ['normal'], [38, 30, 41, 30, 41, 60], 'common', 'forest,city', null,
      E(263, 'Zigzagoon là Pokémon hệ Thường sấn tới bằng cú húc trực diện.')],

    [9796, 'Wurmple', ['bug'], [45, 45, 35, 20, 30, 20], 'common', 'forest,pallet', ['sp100a-266', 7],
      E(265, 'Wurmple là Pokémon hệ Bọ đập cánh liên hồi gây hoa mắt.')],

    [9797, 'Silcoon', ['bug'], [50, 35, 55, 25, 25, 15], 'common', 'forest,pallet', ['sp100a-267', 10],
      E(266, 'Silcoon là Pokémon hệ Bọ cắn giữ chặt dù đối thủ to hơn.')],

    [9798, 'Beautifly', ['bug', 'flying'], [60, 70, 50, 100, 50, 65], 'rare', 'forest,pallet', null,
      E(267, 'Beautifly là Pokémon hệ Bọ/Bay phun tơ để khống chế chuyển động.')],

    [9799, 'Cascoon', ['bug'], [50, 35, 55, 25, 25, 15], 'common', 'forest,pallet', ['sp100a-269', 10],
      E(268, 'Cascoon là Pokémon hệ Bọ đập cánh liên hồi gây hoa mắt.')],

    [9800, 'Dustox', ['bug', 'poison'], [60, 50, 70, 50, 90, 65], 'rare', 'forest,pallet', null,
      E(269, 'Dustox là Pokémon hệ Bọ/Độc cắn giữ chặt dù đối thủ to hơn.')],

    [9801, 'Lotad', ['water', 'grass'], [40, 30, 30, 40, 50, 30], 'common', 'beach,lake', ['sp100a-271', 14],
      E(270, 'Lotad là Pokémon hệ Nước/Cỏ bắn vòi nước áp lực cao.')],

    [9802, 'Lombre', ['water', 'grass'], [60, 50, 50, 60, 70, 50], 'common', 'beach,lake', ['sp100a-272', 16],
      E(271, 'Lombre là Pokémon hệ Nước/Cỏ lướt qua mặt nước như trượt trên gương.')],

    [9803, 'Ludicolo', ['water', 'grass'], [80, 70, 70, 90, 100, 70], 'rare', 'beach,lake', null,
      E(272, 'Ludicolo là Pokémon hệ Nước/Cỏ hấp hơi ẩm để hồi sức giữa trận.')],

    [9804, 'Seedot', ['grass'], [40, 40, 50, 30, 30, 30], 'common', 'forest,pallet', ['sp100a-274', 14],
      E(273, 'Seedot là Pokémon hệ Cỏ quấn đối thủ bằng dây leo.')],

    [9805, 'Nuzleaf', ['grass', 'dark'], [70, 70, 40, 60, 40, 60], 'rare', 'forest,pallet', null,
      E(274, 'Nuzleaf là Pokémon hệ Cỏ/Bóng tối hút nắng để hồi phục từng lượt.')],

    [9806, 'Taillow', ['normal', 'flying'], [40, 55, 30, 30, 30, 85], 'common', 'forest,beach', ['sp100a-277', 22],
      E(276, 'Taillow là Pokémon hệ Thường/Bay xoay người cực nhanh để né đòn.')],

    [9807, 'Swellow', ['normal', 'flying'], [60, 85, 60, 75, 50, 125], 'rare', 'forest,beach', null,
      E(277, 'Swellow là Pokémon hệ Thường/Bay sấn tới bằng cú húc trực diện.')],

    [9808, 'Wingull', ['water', 'flying'], [40, 30, 30, 55, 30, 85], 'common', 'beach,lake', ['sp100a-279', 25],
      E(278, 'Wingull là Pokémon hệ Nước/Bay lướt qua mặt nước như trượt trên gương.')],

    [9809, 'Pelipper', ['water', 'flying'], [60, 50, 100, 95, 70, 65], 'rare', 'beach,lake', null,
      E(279, 'Pelipper là Pokémon hệ Nước/Bay hấp hơi ẩm để hồi sức giữa trận.')],

    [9810, 'Surskit', ['bug', 'water'], [40, 30, 32, 50, 52, 65], 'common', 'beach,lake', null,
      E(283, 'Surskit là Pokémon hệ Bọ/Nước phun tơ để khống chế chuyển động.')],

    [9811, 'Masquerain', ['bug', 'flying'], [70, 60, 62, 100, 82, 80], 'common', 'forest,pallet', null,
      E(284, 'Masquerain là Pokémon hệ Bọ/Bay đập cánh liên hồi gây hoa mắt.')],

    [9812, 'Shroomish', ['grass'], [60, 40, 60, 40, 60, 35], 'common', 'forest,pallet', ['sp100a-286', 23],
      E(285, 'Shroomish là Pokémon hệ Cỏ rải hạt giống gây bất ngờ.')],

    [9813, 'Breloom', ['grass', 'fighting'], [60, 130, 80, 60, 60, 70], 'rare', 'forest,pallet', null,
      E(286, 'Breloom là Pokémon hệ Cỏ/Giác đấu quấn đối thủ bằng dây leo.')],

    [9814, 'Slakoth', ['normal'], [60, 60, 60, 35, 35, 30], 'common', 'forest,city', ['sp100a-288', 18],
      E(287, 'Slakoth là Pokémon hệ Thường giữ nhịp trận bằng tiếng kêu dõng dạc.')],

    [9815, 'Vigoroth', ['normal'], [80, 80, 80, 55, 55, 90], 'common', 'forest,city', ['sp100a-289', 36],
      E(288, 'Vigoroth là Pokémon hệ Thường xoay người cực nhanh để né đòn.')],

    [9816, 'Slaking', ['normal'], [150, 160, 100, 95, 65, 100], 'rare', 'forest,city', null,
      E(289, 'Slaking là Pokémon hệ Thường sấn tới bằng cú húc trực diện.')],

    [9817, 'Nincada', ['bug', 'ground'], [31, 45, 90, 30, 30, 40], 'common', 'forest,pallet', ['sp100a-291', 20],
      E(290, 'Nincada là Pokémon hệ Bọ/Đất đập cánh liên hồi gây hoa mắt.')],

    [9818, 'Ninjask', ['bug', 'flying'], [61, 90, 45, 50, 50, 160], 'rare', 'forest,pallet', null,
      E(291, 'Ninjask là Pokémon hệ Bọ/Bay cắn giữ chặt dù đối thủ to hơn.')],

    [9819, 'Shedinja', ['bug', 'ghost'], [1, 90, 45, 30, 30, 40], 'rare', 'forest,pallet', null,
      E(292, 'Shedinja là Pokémon hệ Bọ/Ma phun tơ để khống chế chuyển động.')],

    [9820, 'Whismur', ['normal'], [64, 51, 23, 51, 23, 28], 'common', 'forest,city', ['sp100a-294', 20],
      E(293, 'Whismur là Pokémon hệ Thường giữ nhịp trận bằng tiếng kêu dõng dạc.')],

    [9821, 'Loudred', ['normal'], [84, 71, 43, 71, 43, 48], 'common', 'forest,city', ['sp100a-295', 40],
      E(294, 'Loudred là Pokémon hệ Thường xoay người cực nhanh để né đòn.')],

    [9822, 'Exploud', ['normal'], [104, 91, 63, 91, 73, 68], 'rare', 'forest,city', null,
      E(295, 'Exploud là Pokémon hệ Thường sấn tới bằng cú húc trực diện.')],

    [9823, 'Makuhita', ['fighting'], [72, 60, 30, 20, 30, 25], 'common', 'city,viridian', null,
      E(296, 'Makuhita là Pokémon hệ Giác đấu đọc chuyển động đối thủ để phản đòn.')],

    [9824, 'Azurill', ['normal', 'fairy'], [50, 20, 40, 20, 40, 20], 'common', 'forest,city', null,
      E(298, 'Azurill là Pokémon hệ Thường/Tiên xoay người cực nhanh để né đòn.')],

    [9825, 'Skitty', ['normal'], [50, 45, 45, 35, 35, 50], 'common', 'forest,city', ['sp100a-301', 33],
      E(300, 'Skitty là Pokémon hệ Thường sấn tới bằng cú húc trực diện.')],

    [9826, 'Delcatty', ['normal'], [70, 65, 65, 55, 55, 90], 'rare', 'forest,city', null,
      E(301, 'Delcatty là Pokémon hệ Thường giữ nhịp trận bằng tiếng kêu dõng dạc.')],

    [9827, 'Aron', ['steel', 'rock'], [50, 70, 100, 40, 40, 30], 'common', 'cave,desert', ['sp100a-305', 32],
      E(304, 'Aron là Pokémon hệ Thép/Đá hấp thụ sắt để tự sửa vết thương.')],

    [9828, 'Lairon', ['steel', 'rock'], [60, 90, 140, 50, 50, 40], 'rare', 'cave,desert', null,
      E(305, 'Lairon là Pokémon hệ Thép/Đá chắn đòn bằng lớp giáp kim loại.')],

    [9829, 'Meditite', ['fighting', 'psychic'], [30, 40, 55, 40, 55, 60], 'common', 'city,cerulean', null,
      E(307, 'Meditite là Pokémon hệ Giác đấu/Siêu linh đọc chuyển động đối thủ để phản đòn.')],

    [9830, 'Plusle', ['electric'], [60, 50, 40, 85, 75, 95], 'common', 'city,vermilion', null,
      E(311, 'Plusle là Pokémon hệ Điện chạy nhanh hơn cả tia chớp.')],

    [9831, 'Minun', ['electric'], [60, 40, 50, 75, 85, 95], 'common', 'city,vermilion', null,
      E(312, 'Minun là Pokémon hệ Điện phóng điện từ má và đuôi.')],

    [9832, 'Volbeat', ['bug'], [65, 73, 75, 47, 85, 85], 'common', 'forest,pallet', null,
      E(313, 'Volbeat là Pokémon hệ Bọ đập cánh liên hồi gây hoa mắt.')],

    [9833, 'Illumise', ['bug'], [65, 47, 75, 73, 85, 85], 'common', 'forest,pallet', null,
      E(314, 'Illumise là Pokémon hệ Bọ cắn giữ chặt dù đối thủ to hơn.')],

    [9834, 'Gulpin', ['poison'], [70, 43, 53, 43, 53, 40], 'common', 'cave,viridian', ['sp100a-317', 26],
      E(316, 'Gulpin là Pokémon hệ Độc tiết chất độc từ nanh và đuôi.')],

    [9835, 'Swalot', ['poison'], [100, 73, 83, 73, 83, 55], 'rare', 'cave,viridian', null,
      E(317, 'Swalot là Pokémon hệ Độc lại gần rồi châm đầu độc đối phương.')],

    [9836, 'Wailmer', ['water'], [130, 70, 35, 70, 35, 60], 'common', 'beach,lake', null,
      E(320, 'Wailmer là Pokémon hệ Nước hấp hơi ẩm để hồi sức giữa trận.')],

    [9837, 'Numel', ['fire', 'ground'], [60, 60, 40, 65, 45, 35], 'common', 'volcano,desert', ['sp100a-323', 35],
      E(322, 'Numel là Pokémon hệ Lửa/Đất ung đốt đối thủ bằng hơi nóng rực.')],

    [9838, 'Camerupt', ['fire', 'ground'], [70, 100, 70, 105, 75, 40], 'rare', 'volcano,desert', null,
      E(323, 'Camerupt là Pokémon hệ Lửa/Đất phun lửa từ miệng khi bị ép sát.')],

    [9839, 'Spoink', ['psychic'], [60, 25, 35, 70, 80, 60], 'common', 'city,cerulean', ['sp100a-326', 32],
      E(325, 'Spoink là Pokémon hệ Siêu linh tạo ảo ảnh khiến đòn tấn công trượt đi.')],

    [9840, 'Grumpig', ['psychic'], [80, 45, 65, 90, 110, 80], 'rare', 'city,cerulean', null,
      E(326, 'Grumpig là Pokémon hệ Siêu linh đọc ý định đối thủ trước khi hành động.')],

    [9841, 'Spinda', ['normal'], [60, 60, 60, 60, 60, 60], 'common', 'forest,city', null,
      E(327, 'Spinda là Pokémon hệ Thường giữ nhịp trận bằng tiếng kêu dõng dạc.')],

    [9842, 'Trapinch', ['ground'], [45, 100, 45, 45, 45, 10], 'common', 'cave,desert', ['sp100a-329', 35],
      E(328, 'Trapinch là Pokémon hệ Đất đi xuyên lòng đất để áp sát đối thủ.')],

    [9843, 'Vibrava', ['ground', 'dragon'], [50, 70, 50, 50, 50, 70], 'rare', 'indigo,digi-temple', null,
      E(329, 'Vibrava là Pokémon hệ Đất/Rồng đào đất tạo làn bụi che mắt.')],

    [9844, 'Cacnea', ['grass'], [50, 85, 40, 85, 40, 35], 'common', 'forest,pallet', ['sp100a-332', 32],
      E(331, 'Cacnea là Pokémon hệ Cỏ hút nắng để hồi phục từng lượt.')],

    [9845, 'Cacturne', ['grass', 'dark'], [70, 115, 60, 115, 60, 55], 'rare', 'forest,pallet', null,
      E(332, 'Cacturne là Pokémon hệ Cỏ/Bóng tối rải hạt giống gây bất ngờ.')],

    [9846, 'Zangoose', ['normal'], [73, 115, 60, 60, 60, 90], 'common', 'forest,city', null,
      E(335, 'Zangoose là Pokémon hệ Thường sấn tới bằng cú húc trực diện.')],

    [9847, 'Seviper', ['poison'], [73, 100, 60, 100, 60, 65], 'common', 'cave,viridian', null,
      E(336, 'Seviper là Pokémon hệ Độc lại gần rồi châm đầu độc đối phương.')],

    [9848, 'Lunatone', ['rock', 'psychic'], [90, 55, 65, 95, 85, 70], 'common', 'city,cerulean', null,
      E(337, 'Lunatone là Pokémon hệ Đá/Siêu linh đứng im rồi đáp xuống cực mạnh.')],

    [9849, 'Solrock', ['rock', 'psychic'], [90, 95, 85, 55, 65, 70], 'common', 'city,cerulean', null,
      E(338, 'Solrock là Pokémon hệ Đá/Siêu linh bọc mình trong lớp đá cứng.')],

    [9850, 'Barboach', ['water', 'ground'], [50, 48, 43, 46, 41, 60], 'common', 'beach,lake', ['sp100a-340', 30],
      E(339, 'Barboach là Pokémon hệ Nước/Đất lướt qua mặt nước như trượt trên gương.')],

    [9851, 'Whiscash', ['water', 'ground'], [110, 78, 73, 76, 71, 60], 'rare', 'beach,lake', null,
      E(340, 'Whiscash là Pokémon hệ Nước/Đất hấp hơi ẩm để hồi sức giữa trận.')],

    [9852, 'Corphish', ['water'], [43, 80, 65, 50, 35, 35], 'common', 'beach,lake', ['sp100a-342', 30],
      E(341, 'Corphish là Pokémon hệ Nước bắn vòi nước áp lực cao.')],

    [9853, 'Crawdaunt', ['water', 'dark'], [63, 120, 85, 90, 55, 55], 'rare', 'beach,lake', null,
      E(342, 'Crawdaunt là Pokémon hệ Nước/Bóng tối lướt qua mặt nước như trượt trên gương.')],

    [9854, 'Baltoy', ['ground', 'psychic'], [40, 40, 55, 40, 70, 55], 'common', 'city,cerulean', ['sp100a-344', 36],
      E(343, 'Baltoy là Pokémon hệ Đất/Siêu linh đi xuyên lòng đất để áp sát đối thủ.')],

    [9855, 'Claydol', ['ground', 'psychic'], [60, 70, 105, 70, 120, 75], 'rare', 'city,cerulean', null,
      E(344, 'Claydol là Pokémon hệ Đất/Siêu linh đào đất tạo làn bụi che mắt.')],

    [9856, 'Lileep', ['rock', 'grass'], [66, 41, 77, 61, 87, 23], 'common', 'forest,pallet', ['sp100a-346', 40],
      E(345, 'Lileep là Pokémon hệ Đá/Cỏ ném mảnh đá từ khoảng cách xa.')],

    [9857, 'Cradily', ['rock', 'grass'], [86, 81, 97, 81, 107, 43], 'rare', 'forest,pallet', null,
      E(346, 'Cradily là Pokémon hệ Đá/Cỏ đứng im rồi đáp xuống cực mạnh.')],

    [9858, 'Anorith', ['rock', 'bug'], [45, 95, 50, 40, 50, 75], 'common', 'forest,pallet', ['sp100a-348', 40],
      E(347, 'Anorith là Pokémon hệ Đá/Bọ bọc mình trong lớp đá cứng.')],

    [9859, 'Armaldo', ['rock', 'bug'], [75, 125, 100, 70, 80, 45], 'rare', 'forest,pallet', null,
      E(348, 'Armaldo là Pokémon hệ Đá/Bọ ném mảnh đá từ khoảng cách xa.')],

    [9860, 'Kecleon', ['normal'], [60, 90, 70, 60, 120, 40], 'common', 'forest,city', null,
      E(352, 'Kecleon là Pokémon hệ Thường xoay người cực nhanh để né đòn.')],

    [9861, 'Shuppet', ['ghost'], [44, 75, 35, 63, 33, 45], 'common', 'cave,temple', ['sp100a-354', 37],
      E(353, 'Shuppet là Pokémon hệ Ma lướt qua bóng tối để né đòn.')],

    [9862, 'Banette', ['ghost'], [64, 115, 65, 83, 63, 65], 'rare', 'cave,temple', null,
      E(354, 'Banette là Pokémon hệ Ma hút sinh khí đối phương mỗi lượt.')],

    [9863, 'Duskull', ['ghost'], [20, 40, 90, 30, 90, 25], 'common', 'cave,temple', null,
      E(355, 'Duskull là Pokémon hệ Ma xuất hiện và biến mất vô định.')],

    [9864, 'Tropius', ['grass', 'flying'], [99, 68, 83, 72, 87, 51], 'common', 'forest,pallet', null,
      E(357, 'Tropius là Pokémon hệ Cỏ/Bay quấn đối thủ bằng dây leo.')],

    [9865, 'Chimecho', ['psychic'], [75, 50, 80, 95, 90, 65], 'common', 'city,cerulean', null,
      E(358, 'Chimecho là Pokémon hệ Siêu linh dùng sóng tâm linh đẩy lùi kẻ địch.')],

    [9866, 'Wynaut', ['psychic'], [95, 23, 48, 23, 48, 23], 'common', 'city,cerulean', null,
      E(360, 'Wynaut là Pokémon hệ Siêu linh tạo ảo ảnh khiến đòn tấn công trượt đi.')],

    [9867, 'Clamperl', ['water'], [35, 64, 85, 74, 55, 32], 'common', 'beach,lake', ['sp100a-367', 35],
      E(366, 'Clamperl là Pokémon hệ Nước bắn vòi nước áp lực cao.')],

    [9868, 'Huntail', ['water'], [55, 104, 105, 94, 75, 52], 'rare', 'beach,lake', null,
      E(367, 'Huntail là Pokémon hệ Nước lướt qua mặt nước như trượt trên gương.')],

    [9869, 'Gorebyss', ['water'], [55, 84, 105, 114, 75, 52], 'rare', 'beach,lake', null,
      E(368, 'Gorebyss là Pokémon hệ Nước hấp hơi ẩm để hồi sức giữa trận.')],

    [9870, 'Relicanth', ['water', 'rock'], [100, 90, 130, 45, 65, 55], 'common', 'beach,lake', null,
      E(369, 'Relicanth là Pokémon hệ Nước/Đá bắn vòi nước áp lực cao.')],

    [9871, 'Luvdisc', ['water'], [43, 30, 55, 40, 65, 97], 'common', 'beach,lake', null,
      E(370, 'Luvdisc là Pokémon hệ Nước lướt qua mặt nước như trượt trên gương.')],

    [9872, 'Shelgon', ['dragon'], [65, 95, 100, 60, 50, 50], 'common', 'indigo,digi-temple', null,
      E(372, 'Shelgon là Pokémon hệ Rồng vươn cánh bao phủ toàn sân đấu.')],

    [9873, 'Grotle', ['grass'], [75, 89, 85, 55, 65, 36], 'common', 'forest,pallet', ['sp100a-389', 32],
      E(388, 'Grotle là Pokémon hệ Cỏ quấn đối thủ bằng dây leo.')],

    [9874, 'Torterra', ['grass', 'ground'], [95, 109, 105, 75, 85, 56], 'rare', 'forest,pallet', null,
      E(389, 'Torterra là Pokémon hệ Cỏ/Đất hút nắng để hồi phục từng lượt.')],

    [9875, 'Monferno', ['fire', 'fighting'], [64, 78, 52, 78, 52, 81], 'common', 'volcano,desert', ['sp100a-392', 36],
      E(391, 'Monferno là Pokémon hệ Lửa/Giác đấu mang lõi nhiệt không bao giờ nguội.')],

    [9876, 'Infernape', ['fire', 'fighting'], [76, 104, 71, 104, 71, 108], 'rare', 'volcano,desert', null,
      E(392, 'Infernape là Pokémon hệ Lửa/Giác đấu ung đốt đối thủ bằng hơi nóng rực.')],

    [9877, 'Prinplup', ['water'], [64, 66, 68, 81, 76, 50], 'common', 'beach,lake', null,
      E(394, 'Prinplup là Pokémon hệ Nước lướt qua mặt nước như trượt trên gương.')],

    [9878, 'Starly', ['normal', 'flying'], [40, 55, 30, 30, 30, 60], 'common', 'forest,beach', ['sp100a-397', 14],
      E(396, 'Starly là Pokémon hệ Thường/Bay xoay người cực nhanh để né đòn.')],

    [9879, 'Staravia', ['normal', 'flying'], [55, 75, 50, 40, 40, 80], 'common', 'forest,beach', ['sp100a-398', 34],
      E(397, 'Staravia là Pokémon hệ Thường/Bay sấn tới bằng cú húc trực diện.')],

    [9880, 'Staraptor', ['normal', 'flying'], [85, 120, 70, 50, 60, 100], 'rare', 'forest,beach', null,
      E(398, 'Staraptor là Pokémon hệ Thường/Bay giữ nhịp trận bằng tiếng kêu dõng dạc.')],

    [9881, 'Kricketot', ['bug'], [37, 25, 41, 25, 41, 25], 'common', 'forest,pallet', ['sp100a-402', 24],
      E(401, 'Kricketot là Pokémon hệ Bọ cắn giữ chặt dù đối thủ to hơn.')],

    [9882, 'Kricketune', ['bug'], [77, 85, 51, 55, 51, 65], 'rare', 'forest,pallet', null,
      E(402, 'Kricketune là Pokémon hệ Bọ phun tơ để khống chế chuyển động.')]
  ]);
})();
