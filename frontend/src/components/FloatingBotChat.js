// src/components/FloatingBotChat.js
import React, { useState, useContext, useRef, useEffect } from 'react';
import { Button, InputGroup, Form, Spinner, Badge } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import './FloatingBotChat.css';

const AI_NAME = "Chef Quân AI";

/* =========================================================
 * 1) TIỆN ÍCH NLP (Giữ nguyên)
 * =======================================================*/
const rmDiacritics = (s = "") =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

const norm = (s = "") => rmDiacritics(s.toLowerCase()).trim();

const anyMatch = (text, arr) => arr.some(k => norm(text).includes(norm(k)));
const regexTest = (text, re) => re.test(norm(text));

/* =========================================================
 * 2) BỘ NHỚ SỞ THÍCH (Giữ nguyên)
 * =======================================================*/
const DEFAULT_PREFS = {
  diet: 'tuy_chon',
  spicy: 'vua',
  unit: 'C',
};
const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem('chef_prefs')) || DEFAULT_PREFS; } catch { return DEFAULT_PREFS; }
};
const savePrefs = (prefs) => localStorage.setItem('chef_prefs', JSON.stringify(prefs));

/* =========================================================
 * 3) CƠ SỞ KIẾN THỨC MỞ RỘNG (Giữ nguyên)
 * =======================================================*/

// KB 1: KỸ THUẬT NẤU ĂN
const TECH_TIPS = {
    dao: {
        keywords: ['dao','thái','cắt','băm','knife','chop','dice','mince', 'móng vuốt', 'mong vuot'],
        answer: "Giữ dao thật sắc và dùng kỹ thuật \"móng vuốt\" (knuckle guard) để bảo vệ ngón tay. Luôn lau khô dao ngay sau khi rửa để tránh gỉ sét."
    },
    xao: {
        keywords: ['xào','stir fry','xao gion','không ra nước', 'ko ra nuoc'],
        answer: "Bí quyết xào lửa lớn (high heat), chảo thật nóng, và nguyên liệu phải thật ráo nước. Cho dầu sau khi chảo nóng để hạn chế dính."
    },
    nau_bun_pho: {
        keywords: ['phở','bún','nuoc dung','nước dùng trong','xuong','bone broth'],
        answer: "Nước dùng trong là do xương được rửa sạch, chần sơ (blanch) qua nước sôi, rửa lại lần nữa rồi mới hầm lửa nhỏ (simmer). Thường xuyên hớt bọt và nướng hành/gừng trước khi cho vào."
    },
    umami: {
        keywords: ['umami','ngon','dam da','vị ngọt thịt', 'vi ngot thit'],
        answer: "Tăng umami (vị ngon/đậm đà) tự nhiên bằng nấm (nhất là nấm hương), cà chua cô đặc (tomato paste), nước mắm/tương đậu nành (soy sauce) chất lượng, hoặc một chút phô mai Parmesan cho món Âu."
    },
    sot: {
        keywords: ['sốt','soup','hầm','ham','pan sauce'],
        answer: "Cách làm sốt/súp nền: xào thơm rau củ (hành, tỏi, cần tây...), khử rượu (deglaze) nếu có, thêm nước dùng (stock) và đun sôi, sau đó hạ nhỏ lửa (simmer) cho sánh lại."
    },
    blanching: {
        keywords: ['chần','tran','blanch'],
        answer: "Chần (Blanching) là trụng nhanh rau củ trong nước sôi rồi vớt ngay ra bát nước đá. Kỹ thuật này giúp rau giữ màu xanh đẹp, giòn và giảm mùi hăng."
    },
    resting_meat: {
        keywords: ['nghỉ thịt','nghi thit','rest meat', 'steak'],
        answer: "Sau khi nướng/áp chảo, thịt (đặc biệt là steak) cần được 'nghỉ' 5-10 phút trước khi cắt. Điều này giúp các thớ cơ thư giãn và giữ lại nước ép, làm thịt mềm và mọng nước hơn."
    },
    deglazing: {
        keywords: ['deglaze','khử','khu','làm sạch chảo'],
        answer: "Deglazing (khử) là kỹ thuật đổ chất lỏng (rượu, nước dùng, giấm) vào chảo nóng sau khi áp chảo thịt để hòa tan các mảng cháy (fond) dính dưới đáy chảo. Đây là 'vàng' để làm nước sốt cực ngon."
    },
    emulsifying: {
        keywords: ['nhũ hóa','nhu hoa','emulsify','sốt mayonnaise','sot mayo'],
        answer: "Nhũ hóa là quá trình kết hợp hai chất lỏng không hòa tan (như dầu và giấm). Bí quyết là thêm dầu TỪNG CHÚT MỘT vào giấm/trứng trong khi đánh liên tục (bằng phới hoặc máy xay)."
    },
    proofing_yeast: {
        keywords: ['kích hoạt men','kich hoat men','proof yeast','men nở','men no'],
        answer: "Kích hoạt men (nếu dùng men khô) là hòa men với nước ấm (không nóng, khoảng 40-45°C) và một chút đường, để 5-10 phút. Nếu men sủi bọt như gạch cua nghĩa là men còn sống và hoạt động tốt."
    }
};

// KB 2: THAY THẾ NGUYÊN LIỆU
const SUBSTITUTIONS = [
  { from: ['bơ lạt','butter','bo lat'], to: ['dầu ô liu','dầu dừa'], note: 'Khi làm bánh quy, thay bơ bằng dầu có thể làm bánh mềm hơn và hương vị thay đổi nhẹ.' },
  { from: ['sữa tươi','milk','sua tuoi'], to: ['sữa hạnh nhân','sữa yến mạch','sữa đậu nành'], note: 'Hợp với người ăn chay hoặc không dung nạp lactose; cần điều chỉnh lượng đường nếu sữa hạt có đường.' },
  { from: ['kem tươi','whipping cream','kem tuoi'], to: ['sữa đặc + sữa tươi (tỷ lệ 3:1)'], note: 'Chỉ dùng tạm cho sốt/đồ uống, KHÔNG THỂ đánh bông để làm kem trang trí.' },
  { from: ['nước mắm','nuoc mam'], to: ['muối + chút nước tương (soy sauce) + nấm hương'], note: 'Thay thế hương vị mặn–umami gần đúng cho các món chay.' },
  { from: ['buttermilk'], to: ['1 cốc sữa tươi + 1 muỗng canh nước cốt chanh (hoặc giấm)'], note: 'Để 5-10 phút cho sữa hơi đặc lại. Dùng làm bánh (pancakes, gà rán) rất ngon.' },
  { from: ['trứng (làm bánh)','trung (lam banh)','egg substitute'], to: ['1/4 cốc chuối nghiền', '1 muỗng hạt chia + 3 muỗng nước (để 10 phút)'], note: 'Dùng thay thế 1 quả trứng để tạo độ kết dính/ẩm, nhưng kết cấu bánh sẽ khác.' },
  { from: ['bột bắp','bot bap','cornstarch'], to: ['bột năng','bột khoai tây (potato starch)'], note: 'Dùng làm sệt (thickener) cho các món xào hoặc súp, tỷ lệ 1:1.' },
  { from: ['rượu vang (nấu ăn)','ruou vang'], to: ['nước dùng (stock) + chút giấm rượu'], note: 'Dùng thay thế khi cần deglaze chảo mà không muốn dùng cồn, thêm chút acid (giấm) để cân bằng vị.' }
];

// KB 3: CÔNG THỨC NHANH
const QUICK_RECIPES = {
  'aglio e olio': {
    keywords: ['aglio e olio','mì ý tỏi ớt','my y toi ot','spaghetti toi ot'],
    for: 2,
    ingredients: ['200g spaghetti','4-5 tép tỏi lát','2–3 muỗng canh dầu ô liu (Extra Virgin)','ớt khô vụn (tùy cay)','muối','tiêu','mùi tây băm (parsley)'],
    steps: ['Luộc mì al dente trong nước muối (như nước biển). GIỮ LẠI 1 CHÉN NƯỚC LUỘC MÌ.','Phi nhẹ tỏi với dầu (lửa nhỏ–vừa) đến vàng nhạt, cho ớt khô (cẩn thận cháy).','Tắt bếp, cho 1–2 muỗng nước luộc mì vào chảo (đây là bí quyết), cho mì vào, đảo đều. Tinh bột trong nước luộc mì sẽ làm sốt sánh lại.','Nêm muối, tiêu, rắc mùi tây, trộn và dùng nóng.'],
    tips: 'Đừng để tỏi cháy đen sẽ đắng. Nước luộc mì là chìa khóa của món này.'
  },
  'steak': {
    keywords: ['steak','bò bít tết','bo bit tet','ap chao bo','áp chảo bò'],
    for: 1,
    ingredients: ['1 miếng steak (ribeye/striploin) dày 2–3cm','muối hạt','tiêu','bơ lạt','2 tép tỏi đập dập','1 nhánh lá thyme/rosemary'],
    steps: ['Lau thịt THẬT KHÔ, ướp muối tiêu 2 mặt (trước 20–40 phút nếu có thể).','Chảo GANG RẤT NÓNG, cho chút dầu. Áp chảo 2–3 phút mỗi mặt (medium rare tùy độ dày).','Hạ lửa, thêm bơ + tỏi + thảo mộc, nghiêng chảo, rưới bơ nóng (arrosage) lên mặt thịt 30–60 giây.','QUAN TRỌNG: Cho thịt ra thớt, để thịt "nghỉ" 5–10 phút rồi mới cắt.'],
    tips: 'Nhiệt tâm lõi Medium rare ~52–55°C. Nghỉ thịt giúp thịt mọng nước, không bị chảy máu ồ ạt khi cắt.'
  },
  'tteokbokki': {
    keywords: ['tteokbokki','tokbokki','bánh gạo cay','banh gao cay'],
    for: 2,
    ingredients: ['300g bánh gạo (tteok)','200ml nước/ nước dùng cá cơm','1–1.5 muỗng gochujang (tương ớt HQ)','1 muỗng gochugaru (bột ớt HQ)','1 muỗng đường','nước tương','chả cá (eomuk)','hành lá'],
    steps: ['Hòa nước với gochujang, gochugaru, đường, chút nước tương trong chảo.','Cho bánh gạo vào, đun sôi rồi hạ nhỏ lửa, đảo đều tay đến khi sốt bắt đầu sệt.','Thêm chả cá (cắt miếng vừa ăn), nấu thêm 1–2 phút.','Tắt bếp, rắc hành lá. (Có thể thêm trứng luộc).'],
    tips: 'Muốn ít cay: giảm bột ớt (gochugaru), tăng đường một chút. Gochujang là bắt buộc.'
  },
  'bun cha': {
    keywords: ['bún chả','bun cha','thịt nướng','thit nuong'],
    for: 2,
    ingredients: ['300g thịt ba chỉ (chả miếng) / nạc vai (chả băm)','bún tươi','rau sống (xà lách, tía tô, kinh giới...)','đồ chua (đu đủ, cà rốt)','Nước mắm pha: 1 mắm + 1 đường + 1 chanh/giấm + 4-5 nước (tùy khẩu vị), tỏi, ớt băm'],
    steps: ['Ướp thịt (nước mắm, đường, tỏi, hành tím băm, tiêu, chút dầu hào) 20–40 phút.','Nướng than (ngon nhất) hoặc nồi chiên không dầu (airfryer) đến khi xém cạnh.','Pha nước mắm chua ngọt (công thức trên), nêm nếm cho vừa vị, thêm tỏi ớt.','Ăn kèm bún, rau sống, đồ chua, chấm nước mắm (có thể làm nóng nước mắm).'],
    tips: 'Cân bằng 5 vị: mặn (mắm) – ngọt (đường) – chua (chanh) – cay (ớt) – umami (mắm/thịt).'
  },
  'pho bo co ban': {
    keywords: ['phở bò','pho bo','pho'],
    for: 4,
    ingredients: ['1.5kg xương ống bò','500g nạm/ bắp (để nấu chín)','thịt thăn (để thái tái)','bánh phở','1 củ hành tây, 1 củ gừng (NƯỚNG CHÁY XÉM)','Gia vị khô: quế, hồi, đinh hương, thảo quả (rang thơm, bỏ túi lọc)','nước mắm, muối, đường phèn'],
    steps: ['Xương rửa sạch, chần sơ nước sôi (blanch), rửa lại thật sạch.','Hầm xương lửa nhỏ (simmer) 3–6h, hớt bọt thường xuyên.','Cho hành gừng nướng, túi gia vị khô vào nồi hầm 1 tiếng cuối.','Nêm nước mắm + muối + chút đường phèn cho vừa vị.','Trụng bánh phở, thái thịt (chín/tái), chan nước dùng, thêm hành lá, ngò gai.'],
    tips: 'Nước dùng TRONG là do chần xương kỹ, lửa nhỏ (không sôi sùng sục) và hớt bọt đều tay.'
  },
  'trung chien': {
    keywords: ['trứng chiên','trung chien','scrambled eggs','trứng khuấy','trung khuay'],
    for: 1,
    ingredients: ['2-3 quả trứng','1 muỗng canh sữa tươi/kem tươi','1 muỗng bơ lạt','muối, tiêu'],
    steps: ['Đánh trứng, sữa, muối, tiêu (KHÔNG đánh quá kỹ, chỉ cần hòa quyện).','Chảo KHÔNG QUÁ NÓNG, cho bơ vào tan chảy (không để bơ cháy).','Đổ trứng vào, lửa VỪA-NHỎ. Dùng phới (spatula) đẩy trứng từ ngoài vào trong liên tục.','Khi trứng còn hơi ướt (khoảng 80% chín), TẮT BẾP. Nhiệt dư trong chảo sẽ làm trứng chín hoàn hảo.','Dùng ngay khi còn nóng, trứng sẽ rất mềm và mượt (creamy).'],
    tips: 'Bí quyết là lửa nhỏ và lấy ra sớm. Nếu thích kiểu trứng chiên Việt Nam (khô, vàng) thì đánh trứng kỹ với nước mắm, chiên lửa lớn hơn.'
  },
  'carbonara': {
    keywords: ['carbonara','mì ý kem trứng','my y kem trung'],
    for: 2,
    ingredients: ['200g spaghetti','100g thịt ba rọi xông khói (pancetta/guanciale hoặc bacon)','2 lòng đỏ trứng','30g phô mai Pecorino/Parmesan (bào nhuyễn)','Tiêu đen (rất nhiều)'],
    steps: ['Luộc mì (giữ lại nước luộc).','Cắt thịt, áp chảo cho ra mỡ, vàng giòn. Tắt bếp.','Đánh lòng đỏ + phô mai + tiêu.','Cho mì đã luộc vào chảo thịt (vẫn đang tắt bếp), thêm 1-2 muỗng nước luộc mì, trộn đều.','QUAN TRỌNG: Đổ hỗn hợp trứng-phô mai vào chảo, TRỘN NHANH TAY. Hơi nóng còn lại của mì và chảo sẽ làm trứng chín thành sốt kem (KHÔNG BẬT BẾP, nếu không trứng sẽ bị vón cục!).','Thêm phô mai, thêm tiêu. Dùng ngay.'],
    tips: 'Carbonara truyền thống KHÔNG dùng kem tươi (cream). Độ béo ngậy đến từ lòng đỏ trứng và phô mai.'
  },
  'nuoc cham': {
    keywords: ['nước chấm','nuoc cham','nước mắm chua ngọt','nuoc mam chua ngot','dipping sauce'],
    for: 1,
    ingredients: ['1 muỗng đường','1 muỗng chanh/giấm','1 muỗng nước mắm ngon','4-5 muỗng nước lọc (điều chỉnh)','Tỏi, Ớt (băm nhuyễn)'],
    steps: ['Hòa tan đường với nước lọc và chanh/giấm trước.','Cho nước mắm vào khuấy đều.','Tỏi ớt băm nhuyễn cho vào SAU CÙNG (bí quyết để tỏi ớt nổi lên trên).','Nêm nếm lại cho vừa khẩu vị (mặn-ngọt-chua-cay cân bằng).'],
    tips: 'Đây là tỷ lệ "vàng" cơ bản, có thể gia giảm tùy món ăn (ví dụ: bún chả cần nhạt hơn, bánh xèo cần ngọt hơn).'
  }
};

// KB 4: ĐỊNH NGHĨA THUẬT NGỮ
const GLOSSARY = {
    mirepoix: {
        keywords: ['mirepoix'],
        answer: "Là hỗn hợp rau củ cơ bản của ẩm thực Pháp, dùng để tạo nền hương vị (aromatic base) cho súp, sốt, hầm. Tỷ lệ cổ điển là 2 hành tây : 1 cà rốt : 1 cần tây, tất cả thái hạt lựu và xào chậm với bơ/dầu."
    },
    julienne: {
        keywords: ['julienne','thái sợi','thai soi','thái chỉ','thai chi'],
        answer: "Là kỹ thuật thái rau củ (thường là cà rốt, dưa chuột...) thành các sợi mỏng và đều nhau, giống như que diêm (kích thước khoảng 3mm x 3mm x 5cm)."
    },
    blanch: {
        keywords: ['blanch','chần','tran'],
        answer: "Là kỹ thuật trụng nhanh thực phẩm (thường là rau củ) trong nước sôi, sau đó làm lạnh ngay lập tức trong nước đá. Giúp giữ màu sắc, độ giòn và loại bỏ vị hăng."
    },
    sear: {
        keywords: ['sear','áp chảo','ap chao','áp nhiệt','ap nhiet'],
        answer: "Là kỹ thuật áp chảo nhanh một miếng thịt/cá trên chảo RẤT NÓNG với ít dầu để tạo một lớp vỏ màu nâu vàng đẹp mắt (phản ứng Maillard), giúp tăng hương vị và khóa ẩm bên trong."
    },
    deglaze: {
        keywords: ['deglaze','khử','khu'],
        answer: "Là kỹ thuật đổ chất lỏng (rượu, nước dùng, giấm) vào chảo nóng sau khi 'sear' thịt để hòa tan các mảng cháy (fond) dính dưới đáy chảo. Đây là nền tảng để làm nước sốt (pan sauce) cực ngon."
    },
    emulsify: {
        keywords: ['emulsify','nhũ hóa','nhu hoa'],
        answer: "Là quá trình kết hợp hai chất lỏng không hòa tan (như dầu và giấm/nước) thành một hỗn hợp đồng nhất, mịn (ví dụ: sốt mayonnaise, sốt vinaigrette). Thường cần một chất xúc tác (emulsifier) như lòng đỏ trứng hoặc mù tạt."
    },
    roux: {
        keywords: ['roux','sốt nền','sot nen'],
        answer: "Là hỗn hợp bột mì và chất béo (thường là bơ) được nấu chín, dùng làm chất làm đặc (thickener) chính cho các loại sốt cổ điển của Pháp (như sốt Béchamel)."
    },
    mother_sauce: {
        keywords: ['mother sauce','sốt mẹ','sot me'],
        answer: "Là 5 loại sốt nền tảng của ẩm thực Pháp, từ đó có thể tạo ra hàng trăm loại sốt con (daughter sauces). Chúng bao gồm: Béchamel (sữa + roux), Velouté (nước dùng trắng + roux), Espagnole (nước dùng nâu + roux), Hollandaise (trứng + bơ), và Tomato (cà chua)."
    },
    al_dente: {
        keywords: ['al dente','mì ý','my y'],
        answer: "Trong tiếng Ý nghĩa là \"còn răng\" (to the tooth). Đây là trạng thái hoàn hảo khi luộc mì ống (pasta): mì đã chín nhưng vẫn còn hơi dai ở tâm, không bị nhũn."
    },
    sous_vide: {
        keywords: ['sous vide','su-vít','su vit'],
        answer: "Là kỹ thuật nấu chậm ở nhiệt độ thấp và chính xác. Thực phẩm được cho vào túi hút chân không (sous-vide) và ngâm trong nồi nước được kiểm soát nhiệt độ (ví dụ: 60°C trong 2 giờ). Kết quả là món ăn chín đều hoàn hảo từ trong ra ngoài."
    }
};

// KB 5: KHOA HỌC THỰC PHẨM (Tại sao?)
const FOOD_SCIENCE = {
    why_brown_meat: {
        keywords: ['maillard','tại sao thịt nâu','tai sao thit nau','vỏ vàng','vo vang'],
        answer: "Lớp vỏ nâu vàng khi áp chảo thịt (phản ứng Maillard) xảy ra ở nhiệt độ cao (trên 140°C). Đây là phản ứng hóa học giữa đường và axit amin, tạo ra hàng trăm hợp chất hương vị mới, khiến món ăn thơm và ngon hơn rất nhiều so với luộc."
    },
    why_rest_meat: {
        keywords: ['tại sao nghỉ thịt','tai sao nghi thit','why rest meat'],
        answer: "Khi nấu ở nhiệt độ cao, các thớ cơ của thịt co lại, đẩy nước ép vào tâm. Nếu cắt ngay, nước ép sẽ ồ ạt chảy ra. 'Nghỉ' thịt 5-10 phút cho phép các thớ cơ thư giãn và tái hấp thụ lại nước ép, giúp thịt mềm, mọng nước và ngon hơn."
    },
    why_knead_dough: {
        keywords: ['tại sao nhào bột','tai sao nhao bot','why knead dough','gluten'],
        answer: "Nhào bột (kneading) giúp phát triển mạng lưới gluten (một loại protein trong bột mì). Mạng lưới gluten này tạo độ đàn hồi, 'khung xương' cho bánh, giúp giữ lại khí CO2 do men tạo ra, khiến bánh mì có thể nở xốp và có kết cấu dai."
    },
    why_add_acid: {
        keywords: ['acid','chua','giấm','chanh','giam','chanh'],
        answer: "Axit (chanh, giấm, rượu...) đóng vai trò cân bằng (balance) hương vị. Trong món ăn nhiều dầu mỡ (như thịt kho, bò bít tết), một chút vị chua sẽ giúp 'cắt' vị béo, làm món ăn thanh và đỡ ngán hơn."
    }
};

// KB 6: KẾT HỢP HƯƠNG VỊ
const FLAVOR_PAIRINGS = {
    rosemary: {
        keywords: ['hương thảo','huong thao','rosemary'],
        answer: "Hương thảo (Rosemary) rất nồng, hợp với các món cần nấu lâu hoặc có vị mạnh như: Cừu (lamb), Bò (beef), Khoai tây nướng, Gà nướng, và các loại súp hầm."
    },
    basil: {
        keywords: ['húng quế','hung que','basil'],
        answer: "Húng quế (Basil) có 2 loại chính: Húng quế Tây (sweet basil) hợp với ẩm thực Ý (Cà chua, phô mai, sốt Pesto). Húng quế Việt (thường gọi là húng chó) hợp ăn kèm phở, bún chả."
    },
    ginger: {
        keywords: ['gừng','gung','ginger'],
        answer: "Gừng (Ginger) là nền tảng của ẩm thực Á. Hợp nhất với Gà (luộc, kho), các món cá (để khử tanh), và các món xào (với tỏi, nước tương)."
    },
    fish: {
        keywords: ['cá','ca','fish'],
        answer: "Các loại thảo mộc/gia vị hợp với cá: Thì là (dill - kinh điển nhất), Chanh (lemon), Mùi tây (parsley), hoặc Gừng/Riềng (cho món Á)."
    },
    chocolate: {
        keywords: ['sô cô la','so co la','chocolate'],
        answer: "Sô cô la (Chocolate) hợp với: Cam (orange), Cà phê (coffee), Bạc hà (mint), Dâu tây (strawberry), và một chút muối (salt) để tăng vị đậm đà."
    }
};

// KB 7: HỒ SƠ ẨM THỰC
const CUISINE_PROFILES = {
    vietnamese: {
        keywords: ['việt nam','viet nam','vietnamese'],
        answer: "Ẩm thực Việt Nam chú trọng sự CÂN BẰNG (balance) của 5 vị (mặn, ngọt, chua, cay, đắng), sử dụng nhiều rau thơm tươi và nước mắm làm cốt lõi. Đặc trưng là các món nước (phở, bún) và các món cuốn (gỏi cuốn)."
    },
    italian: {
        keywords: ['ý','y','italian'],
        answer: "Ẩm thực Ý tôn vinh sự ĐƠN GIẢN và NGUYÊN LIỆU CHẤT LƯỢNG. Họ tập trung vào các nguyên liệu cốt lõi như cà chua, dầu ô liu, tỏi, phô mai, và mì ống (pasta). Ít khi trộn lẫn quá nhiều hương vị."
    },
    japanese: {
        keywords: ['nhật','nhat','japanese'],
        answer: "Ẩm thực Nhật (Washoku) đề cao sự TINH TẾ, hương vị TỰ NHIÊN của nguyên liệu và cách TRÌNH BÀY theo mùa. Nền tảng là gạo, cá tươi (sushi/sashimi) và vị umami từ dashi (nước dùng rong biển/cá bào)."
    },
    french: {
        keywords: ['pháp','phap','french'],
        answer: "Ẩm thực Pháp là nền tảng của cuisine Âu châu, nổi tiếng với KỸ THUẬT phức tạp (như 5 loại 'sốt mẹ'), sử dụng nhiều Bơ (butter), Kem (cream) và Rượu vang (wine) trong nấu nướng."
    },
    mexican: {
        keywords: ['mexico','mexican'],
        answer: "Ẩm thực Mexico nổi bật với hương vị ĐẬM ĐÀ, CAY và phức hợp. Nguyên liệu chủ đạo là Ngô (corn - làm bánh tortilla), Đậu (beans), Ớt (chiles), và Bơ (avocado - làm guacamole)."
    }
};

// KB 8: TỪ KHÓA ĐIỀU HƯỚNG Ý ĐỊNH
const GREET_KW = ['hello','xin chao','chao','hi','alo','yo'];
const THANKS_KW = ['cam on','cảm ơn','thank','tks','hay qua'];
const BYE_KW = ['tam biet','bye','chao nhe','hẹn gặp'];
const RECIPE_KW = ['công thức','cong thuc','nấu món','nau mon','làm món','lam mon','how to make','recipe for'];
const PANTRY_KW = ['toi co','tôi có','còn thừa','trong bếp','nguyen lieu','co...lam gi'];
const DEFINE_KW = ['là gì','la gi','what is','nghĩa là','nghia la','define','dinh nghia'];
const TECHNIQUE_KW = ['làm sao','lam sao','cách','cach','how to','bi quyet','mẹo','meo'];
const SCIENCE_KW = ['tại sao','tai sao','why does','vì sao','vi sao'];
const PAIRING_KW = ['hợp với','hop voi','goes with','ăn với','an voi','kết hợp','ket hop'];
const SUB_KW = ['thay thế','thay the','substitute','thay cho','thay bằng','thay bang'];
const CONVERT_KW = ['đổi','doi','sang C','sang F','convert', 'bao nhieu do', 'bao nhiêu độ'];
const CUISINE_KW = ['ẩm thực','am thuc','đồ ăn','do an','phong cách','style of'];

/* =========================================================
 * 4) CÁC HÀM TÌM KIẾM TRONG KB (Giữ nguyên)
 * =======================================================*/
// (Các hàm findDefinition, findTechnique, v.v... giữ nguyên)
const findDefinition = (normText) => {
    for (const [key, data] of Object.entries(GLOSSARY)) {
        if (anyMatch(normText, data.keywords)) return `[Định nghĩa] ${key.toUpperCase()}:\n${data.answer}`;
    }
    return null;
};
const findTechnique = (normText) => {
    for (const [key, data] of Object.entries(TECH_TIPS)) {
        if (anyMatch(normText, data.keywords)) return `[Kỹ thuật] ${key.toUpperCase()}:\n${data.answer}`;
    }
    return null;
};
const findScience = (normText) => {
    for (const [key, data] of Object.entries(FOOD_SCIENCE)) {
        if (anyMatch(normText, data.keywords)) return `[Khoa học] ${data.answer}`;
    }
    return null;
};
const findPairing = (normText) => {
    for (const [key, data] of Object.entries(FLAVOR_PAIRINGS)) {
        if (anyMatch(normText, data.keywords)) return `[Kết hợp] ${data.answer}`;
    }
    return null;
};
const findCuisine = (normText) => {
    for (const [key, data] of Object.entries(CUISINE_PROFILES)) {
        if (anyMatch(normText, data.keywords)) return `[Ẩm thực] ${data.answer}`;
    }
    return null;
};
const parseScale = (text) => {
  const mPeople = norm(text).match(/(cho|khau phan|phan) +(\d{1,2})/);
  if (mPeople) return { people: parseInt(mPeople[2], 10) };
  const mTimes = norm(text).match(/(gap|x) +(\d{1,2})/);
  if (mTimes) return { times: parseInt(mTimes[2], 10) };
  return null;
};
const scaleList = (arr, ratio) =>
  arr.map(line => line.replace(/(\d+([.,]\d+)?)(?=\s?(g|kg|ml|l|muong|muong canh|muong cafe|tsp|tbsp|teaspoon|tablespoon|trai|tep|cai|gram|grams|ml|lit|l))/ig,
    (m) => {
      const num = parseFloat(m.replace(',', '.'));
      const scaled = Math.round((num * ratio + Number.EPSILON) * 10) / 10;
      return ('' + scaled).replace('.', ',');
    })
  );
const convertTemp = (text, prefs) => {
  const c = norm(text).match(/(\d{2,3})\s*c\b/);
  const f = norm(text).match(/(\d{3})\s*f\b/);

  if (c && anyMatch(text, ['F','fahrenheit','độ F','sang F'])) {
    const C = parseInt(c[1],10);
    const F = Math.round((C * 9/5) + 32);
    return `🌡️ ${C}°C ≈ ${F}°F.`;
  }
  if (f && anyMatch(text, ['C','celsius','độ C','sang C'])) {
    const Fv = parseInt(f[1],10);
    const Cc = Math.round((Fv - 32) * 5/9);
    return `🌡️ ${Fv}°F ≈ ${Cc}°C.`;
  }
  if (anyMatch(text, ['nướng bánh','banh','cookies','biscuit'])) {
    return `🔧 Gợi ý nhiệt nướng bánh: 170–190°C (338–374°F) tùy công thức. Luôn làm nóng lò trước 10–15 phút.`;
  }
  return null;
};
const pantrySuggest = (text, prefs) => {
  if (!anyMatch(text, PANTRY_KW)) return null;
  const itemsRaw = text.split(/toi co|tôi có|còn thừa|trong bếp|nguyên liệu|nguyen lieu/ig).pop() || '';
  const items = itemsRaw.split(/[,.;-]/).map(s=>norm(s).trim()).filter(Boolean);

  let ideas = [];
  const has = (kw) => items.some(x => x.includes(norm(kw)));

  if (has('trung') && has('ca chua')) ideas.push('🍳 Trứng chiên cà chua kiểu nhanh (nêm thêm chút nước mắm + hành).');
  if (has('mi') || has('spaghetti')) ideas.push('🍝 Aglio e olio/ mì xào tỏi ớt 5–10 phút.');
  if (has('gao') && has('trung')) ideas.push('🍚 Cơm chiên trứng (thêm xì dầu, hành lá, tiêu).');
  if (has('uc ga') || has('ga')) ideas.push('🍗 Gà áp chảo sốt bơ tỏi; hoặc nồi chiên không dầu 12–15’ ở 180–190°C.');
  if (has('bacon') || has('trung') || has('thit xong khoi')) ideas.push('🥓 Mì Carbonara (nếu có thêm phô mai).');
  if (has('banh mi') || has('bread')) ideas.push('🥪 Sandwich kẹp bơ, trứng ốp la.');
  
  if (prefs.diet === 'an_chay') {
    ideas = ideas.filter(x => !x.includes('Gà') && !x.includes('gà') && !x.includes('bacon'));
    ideas.unshift('🥗 Rau củ xào tỏi + đậu hũ sốt xì dầu.');
  }

  if (ideas.length === 0) return `Tôi chưa có gợi ý nhanh cho các nguyên liệu: ${items.join(', ')}. Thử hỏi công thức khác xem?`;
  return `[Gợi ý nhanh] Từ nguyên liệu của bạn:\n- ${ideas.join('\n- ')}`;
};
const findSubstitutions = (text) => {
  for (const s of SUBSTITUTIONS) {
    if (s.from.some(f => norm(text).includes(norm(f)))) {
      return `[Thay thế] Cho “${s.from[0]}”:\n${s.to.join(' / ')}. \nLưu ý: ${s.note}`;
    }
  }
  return null;
};
const recipeByName = (text, prefs) => {
  const found = Object.values(QUICK_RECIPES).find(r => anyMatch(text, r.keywords));
  if (!found) return null;

  const r = found;
  const scale = parseScale(text);
  let ratio = 1;
  if (scale?.people) ratio = Math.max(0.5, scale.people / r.for);
  if (scale?.times) ratio = Math.max(0.5, scale.times);
  const ing = ratio !== 1 ? scaleList(r.ingredients, ratio) : r.ingredients;
  const spicyNote = (prefs.spicy === 'nhat') ? '\n• Điều chỉnh cay: giảm ớt/bột ớt, tăng đường 5–10%.' :
                    (prefs.spicy === 'cay')  ? '\n• Bạn thích cay: tăng ớt/bột ớt 20–30%.' : '';

  return [
    `👨‍🍳 ${r.keywords[0].toUpperCase()} (Khẩu phần gốc: ${r.for})`,
    `Nguyên liệu${ratio!==1 ? ` (đã scale x${(Math.round(ratio*10)/10)})`: ''}:`,
    ...ing.map(i => `• ${i}`),
    `\nCác bước:`,
    ...r.steps.map((s,i)=>`${i+1}. ${s}`),
    `\nMẹo: ${r.tips}${spicyNote}`
  ].join('\n');
};
const greet = (text, user) => `Chào ${user?.full_name || 'bạn'}! Tôi là ${AI_NAME}. Bạn muốn nấu món gì hôm nay? (Gõ /help để xem mẹo)`;
const helpSlash = (text) => {
  const cmd = text.trim();
  if (cmd.startsWith('/set')) {
    const kvPairs = cmd.replace('/set','').trim().split(/\s+/);
    const changes = [];
    let prefs = loadPrefs();
    kvPairs.forEach(pair => {
      const [k,v] = pair.split('=');
      if (!k || !v) return;
      if (k==='spicy' && ['nhẹ','nhe','vừa','vua','cay'].includes(norm(v))) {
        prefs.spicy = (norm(v).startsWith('nhe')) ? 'nhat' : (norm(v)==='cay' ? 'cay' : 'vua');
        changes.push(`độ cay=${prefs.spicy}`);
      }
      if (k==='diet' && ['an_chay','keto','it_duong','khong_gluten','tuy_chon'].includes(norm(v))) {
        prefs.diet = norm(v);
        changes.push(`ăn kiêng=${prefs.diet}`);
      }
      if (k==='unit' && ['c','f'].includes(norm(v))) {
        prefs.unit = norm(v).toUpperCase();
        changes.push(`đơn vị=${prefs.unit}`);
      }
    });
    savePrefs(prefs);
    return `Đã cập nhật: ${changes.join(', ') || 'không có thay đổi hợp lệ.'}\nVí dụ lệnh: /set spicy=nhẹ | /set diet=an_chay`;
  }
  if (cmd.startsWith('/help')) {
    return [
      '🧭 Lệnh hữu ích:',
      '• /help — xem trợ giúp',
      '• /set spicy=cay — (nhẹ, vừa, cay)',
      '• /set diet=an_chay — (keto, it_duong, tuy_chon...)',
      '• /set unit=F — (C hoặc F)',
      '\n💡 Mẹo hỏi:',
      '• "công thức carbonara cho 3 người"',
      '• "200C sang F?"',
      '• "tôi có trứng, mì, cà chua"',
      '• "mirepoix là gì?"',
      '• "tại sao phải nghỉ thịt?"',
      '• "thay bơ bằng gì?"',
      '• "bí quyết xào giòn"',
      '• "ẩm thực ý"'
    ].join('\n');
  }
  return 'Lệnh không hợp lệ. Gõ /help để xem hướng dẫn.';
};
const fallbackSearch = (normText, prefs) => {
    const r = recipeByName(normText, prefs);
    if (r) return r;
    const d = findDefinition(normText);
    if (d) return d;
    const t = findTechnique(normText);
    if (t) return t;
    const s = findScience(normText);
    if (s) return s;
    const p = findPairing(normText);
    if (p) return p;
    const sub = findSubstitutions(normText);
    if (sub) return sub;
    const c = findCuisine(normText);
    if (c) return c;
    return null; 
}


/* =========================================================
 * 5) BỘ NÃO TRUNG TÂM (smartAnswer) - (Giữ nguyên)
 * =======================================================*/
const smartAnswer = (text, user) => {
  const prefs = loadPrefs();
  const normText = norm(text);

  // 1. Ưu tiên cao: Lệnh slash
  if (text.startsWith('/')) return helpSlash(text);

  // 2. Hội thoại cơ bản
  if (anyMatch(normText, GREET_KW)) return greet(text, user);
  if (anyMatch(normText, THANKS_KW)) return 'Rất vui được hỗ trợ! Cần gì cứ gọi tôi nhé. 👨‍🍳';
  if (anyMatch(normText, BYE_KW)) return 'Hẹn gặp lại ở gian bếp! 🔥';

  // 3. Định tuyến ý định (Intent Routing)
  if (anyMatch(normText, PANTRY_KW)) {
      return pantrySuggest(text, prefs);
  }
  if (anyMatch(normText, RECIPE_KW)) {
      const r = recipeByName(text, prefs);
      if (r) return r;
  }
  if (anyMatch(normText, CONVERT_KW)) {
      const t = convertTemp(text, prefs);
      if (t) return t;
  }
  if (anyMatch(normText, DEFINE_KW)) {
      const d = findDefinition(normText);
      if (d) return d;
  }
  if (anyMatch(normText, SCIENCE_KW)) {
      const s = findScience(normText);
      if (s) return s;
  }
  if (anyMatch(normText, PAIRING_KW)) {
      const p = findPairing(normText);
      if (p) return p;
  }
  if (anyMatch(normText, SUB_KW)) {
      const sub = findSubstitutions(normText);
      if (sub) return sub;
  }
  if (anyMatch(normText, TECHNIQUE_KW)) {
      const tech = findTechnique(normText);
      if (tech) return tech;
  }
  if (anyMatch(normText, CUISINE_KW)) {
      const c = findCuisine(normText);
      if (c) return c;
  }

  // 4. Tìm kiếm Fallback
  const fallback = fallbackSearch(normText, prefs);
  if (fallback) return fallback;

  // 5. Trả lời khi không hiểu
  return [
    'Tôi chưa hiểu rõ yêu cầu này. 😅',
    'Bạn có thể thử:',
    '• Gõ /help để xem ví dụ.',
    '• Hỏi cụ thể hơn, ví dụ: "Mirepoix là gì?", "Công thức carbonara", "Tại sao phải nghỉ thịt?".',
  ].join('\n');
};

/* =========================================================
 * 6) UI CHIP GỢI Ý (Giữ nguyên)
 * =======================================================*/
const SUGGESTION_CHIPS = [
  'Công thức Carbonara',
  'Mirepoix là gì?',
  '200C sang F?',
  'Tôi có trứng, mì',
  'Bí quyết xào giòn',
  '/help'
];

/* =========================================================
 * 7) COMPONENT (ĐÃ THAY ĐỔI)
 * =======================================================*/
const FloatingBotChat = ({ courseId }) => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Chào khi mở lần đầu
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        sender: 'bot',
        content:
          `Xin chào ${user?.full_name || 'bạn'}, tôi là ${AI_NAME}! 👨‍🍳\n` +
          `• Gõ /help để xem lệnh nhanh\n` +
          `• Hỏi tôi bất cứ điều gì về ẩm thực!`,
        time: new Date().toLocaleTimeString('vi-VN')
      }]);
    }
  }, [isOpen, messages.length, user]);

  // Theo dõi thay đổi prefs từ localStorage (khi dùng /set)
  useEffect(() => {
    const h = () => setPrefs(loadPrefs());
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);

  const pushBot = (text) => setMessages(prev => [...prev, {
    id: Date.now() + Math.random(),
    sender: 'bot',
    content: text,
    time: new Date().toLocaleTimeString('vi-VN')
  }]);

  const handleChip = (text) => {
    if (isTyping) return;
    setInput(text);
    setTimeout(() => {
      handleSend({ preventDefault: () => {} });
    }, 10);
  };
  
  const handleSend = (e) => {
    e.preventDefault();
    const trimInput = input.trim();
    if (!trimInput || isTyping) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: trimInput,
      time: new Date().toLocaleTimeString('vi-VN')
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botText = smartAnswer(trimInput, user);
      if (trimInput.startsWith('/set')) setPrefs(loadPrefs());

      pushBot(botText);

      if (anyMatch(norm(trimInput), RECIPE_KW) || (Object.values(QUICK_RECIPES).some(r => anyMatch(trimInput, r.keywords)))) {
        pushBot('Bạn có muốn tôi scale khẩu phần (ví dụ: "cho 4 người") hoặc tìm món thay thế (ví dụ: "thay bơ bằng gì") không?');
      }

      setIsTyping(false);
    }, 700 + Math.random() * 600);
  };

  // === THAY ĐỔI: Bỏ `fontFamily` trong `pre` ===
  const Message = ({ msg }) => (
    <div className={`chat-message ${msg.sender}`}>
        {/* THÊM MỚI: Avatar */}
        <div className="chat-avatar">
            {msg.sender === 'bot' ? 'AI' : (user?.full_name?.substring(0, 1) || 'B')}
        </div>
        <div className='message-content'>
            {msg.sender === 'bot' && <Badge bg="success" className="me-2">{AI_NAME}</Badge>}
            {/* THAY ĐỔI: Bỏ style font `monospace` */}
            <pre style={{whiteSpace:'pre-wrap', margin:0, fontFamily: 'inherit'}}>
                {msg.content}
            </pre>
            <span className='time'>{msg.time}</span>
        </div>
    </div>
  );


  return (
    <>
      {/* Floating Icon Toggle */}
      <Button className="floating-chat-icon" variant="primary" onClick={() => setIsOpen(!isOpen)}>
        <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
      </Button>

      {/* Chat Window */}
      <div className={`chat-window-bot ${isOpen ? 'open' : ''}`}>
        <div className="chat-header-bot d-flex justify-content-between align-items-center">
          <div>
            <p className="m-0">{AI_NAME}</p>
            <small style={{color: 'rgba(255, 255, 255, 0.8)'}}>
                {`unit:${prefs.unit} | spicy:${prefs.spicy} | diet:${prefs.diet}`}
            </small>
          </div>
          {/* === THAY ĐỔI: Khối này đã bị xóa khỏi header === */}
        </div>
        
        {/* === THÊM MỚI: Thanh gợi ý === */}
        <div className="chat-suggestion-bar">
            {SUGGESTION_CHIPS.map((c,i)=>(
              <Button key={i} size="sm" variant="outline-primary" className="suggestion-chip" onClick={()=>handleChip(c)}>
                {c}
              </Button>
            ))}
        </div>
        {/* === KẾT THÚC THÊM MỚI === */}

        <div className="chat-body-bot">
          {messages.map(msg => <Message key={msg.id} msg={msg} />)}
          {isTyping && <div className="typing-indicator">Chef Quân AI đang trả lời... <Spinner animation="grow" size="sm" /></div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer-bot">
          <Form onSubmit={handleSend}>
            <InputGroup>
              <Form.Control
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isTyping ? "Đang chờ phản hồi..." : "Hỏi về công thức, kỹ thuật... (gõ /help)"}
                disabled={isTyping || !user}
                onKeyPress={(e) => { e.key === 'Enter' && handleSend(e); }}
              />
              <Button variant="primary" type="submit" disabled={isTyping || !user}>
                <i className="bi bi-send-fill"></i>
              </Button>
            </InputGroup>
            {!user && <small className="text-danger">Vui lòng đăng nhập để sử dụng AI Chatbot.</small>}
          </Form>
        </div>
      </div>
    </>
  );
};

export default FloatingBotChat;