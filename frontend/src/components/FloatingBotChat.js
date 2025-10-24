// src/components/FloatingBotChat.js
import React, { useState, useContext, useRef, useEffect } from 'react';
import { Button, InputGroup, Form, Spinner, Badge } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import './FloatingBotChat.css';

const AI_NAME = "Chef Quân AI";

/* =========================================================
 * 1) TIỆN ÍCH NLP NHẸ: chuẩn hóa TV, tách token, so khớp
 * =======================================================*/
const rmDiacritics = (s = "") =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

const norm = (s = "") => rmDiacritics(s.toLowerCase()).trim();

const anyMatch = (text, arr) => arr.some(k => norm(text).includes(norm(k)));
const regexTest = (text, re) => re.test(norm(text));

/* =========================================================
 * 2) BỘ NHỚ SỞ THÍCH (localStorage)
 * =======================================================*/
const DEFAULT_PREFS = {
  diet: 'tuy_chon',        // tuy_chon | an_chay | keto | it_duong | khong_gluten
  spicy: 'vua',            // nhat | vua | cay
  unit: 'C',               // C | F
};
const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem('chef_prefs')) || DEFAULT_PREFS; } catch { return DEFAULT_PREFS; }
};
const savePrefs = (prefs) => localStorage.setItem('chef_prefs', JSON.stringify(prefs));

/* =========================================================
 * 3) CƠ SỞ KIẾN THỨC RÚT GỌN
 * =======================================================*/
const TECH_TIPS = {
  dao: "Giữ dao thật sắc và dùng kỹ thuật \"móng vuốt\" để bảo vệ ngón tay. Lau khô dao ngay sau khi rửa.",
  xao: "Xào lửa lớn, chảo thật nóng, nguyên liệu ráo nước. Cho dầu sau khi chảo nóng để hạn chế dính.",
  nau_bun_pho: "Nước dùng trong là do xương rửa sạch, chần sơ, hầm lửa nhỏ, thường xuyên hớt bọt và nướng hành gừng trước khi cho vào.",
  umami: "Tăng umami bằng nấm, cà chua cô đặc, nước mắm/ tương đậu nành chất lượng, hoặc chút phô mai Parmesan cho món Âu.",
  sot: "Làm sốt: xào thơm hành–tỏi–cần tây (mirepoix), khử rượu (nếu có), thêm nước dùng và đun sôi rồi hạ nhỏ lửa cho sánh.",
};

const SUBSTITUTIONS = [
  { from: ['bơ lạt','butter'], to: ['dầu ô liu','dầu dừa'], note: 'Bánh quy mềm hơn, hương vị thay đổi nhẹ.' },
  { from: ['sữa tươi','milk'], to: ['sữa hạnh nhân','sữa yến mạch'], note: 'Ít béo sữa, hợp ăn chay; cần điều chỉnh đường.' },
  { from: ['kem tươi','whipping cream'], to: ['sữa đặc + sữa tươi (3:1)'], note: 'Chỉ dùng tạm cho sốt/đồ uống, không đánh bông.' },
  { from: ['nước mắm'], to: ['muối + chút nước tương + nấm hương'], note: 'Thay thế hương mặn–umami gần đúng cho món chay.' },
];

const QUICK_RECIPES = {
  'aglio e olio': {
    for: 2,
    ingredients: [
      '200g spaghetti','4 tép tỏi lát','2–3 muỗng canh dầu ô liu',
      'ớt khô vụn (tùy cay)','muối','tiêu','mùi tây băm'
    ],
    steps: [
      'Luộc mì al dente trong nước muối.',
      'Phi nhẹ tỏi với dầu (lửa nhỏ–vừa) đến vàng nhạt, cho ớt khô.',
      'Cho 1–2 muỗng nước luộc mì vào chảo, cho mì, đảo đều, nêm muối tiêu.',
      'Rắc mùi tây, trộn và dùng nóng.'
    ],
    tips: 'Đừng để tỏi cháy đen sẽ đắng. Có thể thêm tôm/ thịt xông khói.'
  },
  'steak': {
    for: 2,
    ingredients: [
      '2 miếng steak 2–3cm','muối hạt','tiêu','bơ lạt','tỏi đập dập','lá thyme/rosemary'
    ],
    steps: [
      'Lau khô thịt, ướp muối tiêu trước 20–40 phút.',
      'Áp chảo rất nóng 2–3 phút mỗi mặt (medium rare tùy độ dày).',
      'Thêm bơ+tỏi+thảo mộc, rưới bơ nóng lên mặt thịt 30–60 giây.',
      'Nghỉ thịt 5–10 phút rồi cắt.'
    ],
    tips: 'Nhiệt tâm lõi Medium rare ~52–55°C. Nghỉ thịt giúp mọng nước.'
  },
  'tteokbokki': {
    for: 2,
    ingredients: [
      '300g bánh gạo','200ml nước/ nước dùng','1–1.5 muỗng gochujang',
      '1 muỗng tương ớt/ bột ớt Hàn','1 muỗng đường','nước tương','chả cá','hành lá'
    ],
    steps: [
      'Hòa nước với gochujang, tương ớt/bột ớt, đường, chút nước tương.',
      'Cho bánh gạo, đun sôi rồi hạ nhỏ lửa, đảo đến khi sệt.',
      'Thêm chả cá, nấu 1–2 phút, tắt bếp, rắc hành lá.'
    ],
    tips: 'Muốn ít cay: giảm bột ớt, tăng đường một chút.'
  },
  'bun cha': {
    for: 2,
    ingredients: [
      '300g thịt ba chỉ/ nạc vai','bún tươi','rau sống','đồ chua',
      'nước mắm pha: nước mắm+nước+đường+chanh+tỏi ớt'
    ],
    steps: [
      'Ướp thịt (nước mắm, đường, tỏi, hành tím, tiêu) 20–40 phút.',
      'Nướng than/airfryer đến xém cạnh.',
      'Pha nước mắm chua ngọt, thêm tỏi ớt.',
      'Ăn kèm bún, rau sống, đồ chua, chấm nước mắm.'
    ],
    tips: 'Cân bằng 5 vị: mặn–ngọt–chua–cay–umami.'
  },
  'pho bo co ban': {
    for: 4,
    ingredients: [
      '1.5kg xương ống bò','500g nạm/ bắp','bánh phở','hành tây, gừng (nướng cháy xém)',
      'quế, hồi, đinh hương','nước mắm, muối, đường phèn'
    ],
    steps: [
      'Xương rửa sạch, chần sơ, rửa lại.',
      'Hầm xương lửa nhỏ 3–6h, hớt bọt thường xuyên.',
      'Cho hành gừng nướng, quế hồi đinh hương (rang thơm) vào nồi.',
      'Nêm nước mắm + muối + chút đường phèn; trụng bánh phở, thái thịt mỏng, chan nước dùng.'
    ],
    tips: 'Trong nước dùng là do chần xương kỹ, lửa nhỏ và hớt bọt đều tay.'
  },
};

/* =========================================================
 * 4) NLP Ý ĐỊNH & XỬ LÝ TRẢ LỜI
 * =======================================================*/
const parseScale = (text) => {
  // bắt các cụm “cho 2 người”, “khẩu phần 3”, “gấp đôi/x3/ x 4”
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
  // “200C bao nhieu F”, “400F sang C”
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
  // nếu người dùng hỏi “nướng bánh bao nhiêu độ”, gợi ý range
  if (anyMatch(text, ['nướng bánh','banh','cookies','biscuit'])) {
    return `🔧 Gợi ý nhiệt nướng bánh quy: 170–190°C (338–374°F) tùy công thức & lò. Luôn làm nóng lò trước 10–15 phút.`;
  }
  return null;
};

const pantrySuggest = (text, prefs) => {
  // Bắt cụm “tôi có trứng, cà chua, mì… làm gì được?”
  if (!anyMatch(text, ['toi co','tôi có','còn thừa','trong bếp','nguyen lieu'])) return null;
  const itemsRaw = text.split(/toi co|tôi có|còn thừa|trong bếp|nguyên liệu|nguyen lieu/ig).pop() || '';
  const items = itemsRaw.split(/[,.;-]/).map(s=>norm(s).trim()).filter(Boolean);

  let ideas = [];
  const has = (kw) => items.some(x => x.includes(norm(kw)));

  if (has('trung') && has('ca chua')) ideas.push('🍳 Trứng chiên cà chua kiểu nhanh (nêm thêm chút nước mắm + hành).');
  if (has('mi') || has('spaghetti')) ideas.push('🍝 Aglio e olio/ mì xào tỏi ớt 5–10 phút.');
  if (has('gao') && has('trung')) ideas.push('🍚 Cơm chiên trứng (thêm xì dầu, hành lá, tiêu).');
  if (has('uc ga') || has('ga')) ideas.push('🍗 Gà áp chảo sốt bơ tỏi; hoặc nồi chiên không dầu 12–15’ ở 180–190°C.');

  if (prefs.diet === 'an_chay') {
    ideas = ideas.filter(x => !x.includes('Gà') && !x.includes('gà'));
    ideas.unshift('🥗 Rau củ xào tỏi + đậu hũ sốt xì dầu.');
  }

  if (ideas.length === 0) return null;
  return `Gợi ý nhanh từ nguyên liệu bạn có:\n- ${ideas.join('\n- ')}`;
};

const findSubstitutions = (text) => {
  for (const s of SUBSTITUTIONS) {
    if (s.from.some(f => norm(text).includes(norm(f)))) {
      return `Thay thế gợi ý cho “${s.from[0]}”: ${s.to.join(' / ')}. Lưu ý: ${s.note}`;
    }
  }
  return null;
};

const recipeByName = (text, prefs) => {
  const keys = Object.keys(QUICK_RECIPES);
  const found = keys.find(k => norm(text).includes(norm(k)) || regexTest(text, new RegExp(`\\b${norm(k).replace(/\s+/g,'\\s+')}\\b`)));
  if (!found) return null;

  const r = QUICK_RECIPES[found];
  // scale theo people hoặc times
  const scale = parseScale(text);
  let ratio = 1;
  if (scale?.people) ratio = Math.max(0.5, scale.people / r.for);
  if (scale?.times) ratio = Math.max(0.5, scale.times);

  const ing = ratio !== 1 ? scaleList(r.ingredients, ratio) : r.ingredients;

  // điều chỉnh cay theo prefs
  const spicyNote = (prefs.spicy === 'nhat') ? '\n• Điều chỉnh cay: giảm ớt/bột ớt, tăng đường 5–10%.' :
                    (prefs.spicy === 'cay')  ? '\n• Bạn thích cay: tăng ớt/bột ớt 20–30%.' : '';

  return [
    `👨‍🍳 ${found.toUpperCase()} (khẩu phần gốc: ${r.for})`,
    `Nguyên liệu${ratio!==1 ? ` (đã scale x${(Math.round(ratio*10)/10)})`: ''}:`,
    ...ing.map(i => `• ${i}`),
    `\nCác bước:`,
    ...r.steps.map((s,i)=>`${i+1}. ${s}`),
    `\nMẹo: ${r.tips}${spicyNote}`
  ].join('\n');
};

const greet = (text, user) => {
  if (anyMatch(text, ['hello','xin chao','chao','hi','alo','yo'])) {
    return `Chào ${user?.full_name || 'bạn'}! Tôi là ${AI_NAME}. Bạn muốn nấu món gì hôm nay?`;
  }
  return null;
};

const thanksOrBye = (text) => {
  if (anyMatch(text, ['cam on','cảm ơn','thank','tks'])) return 'Rất vui được hỗ trợ! Cần gì cứ gọi tôi nhé. 👨‍🍳';
  if (anyMatch(text, ['tam biet','bye','chao nhe','hẹn gặp'])) return 'Hẹn gặp lại ở gian bếp! 🔥';
  return null;
};

const techniqueQ = (text) => {
  if (anyMatch(text, ['dao','thai','cat','bam'])) return TECH_TIPS.dao;
  if (anyMatch(text, ['xao','stir fry'])) return TECH_TIPS.xao;
  if (anyMatch(text, ['pho','nuoc dung','xuong'])) return TECH_TIPS.nau_bun_pho;
  if (anyMatch(text, ['umami','ngon','dam da'])) return TECH_TIPS.umami;
  if (anyMatch(text, ['sot','soup','hầm','ham'])) return TECH_TIPS.sot;
  return null;
};

const helpSlash = (text) => {
  if (!text.startsWith('/')) return null;
  const cmd = text.trim();

  if (cmd.startsWith('/set')) {
    // /set spicy=nhẹ | /set diet=an_chay | /set unit=F
    const kvPairs = cmd.replace('/set','').trim().split(/\s+/);
    const changes = [];
    let prefs = loadPrefs();

    kvPairs.forEach(pair => {
      const [k,v] = pair.split('=');
      if (!k || !v) return;
      if (k==='spicy' && ['nhẹ','nhe','vừa','vua','cay'].includes(norm(v))) {
        prefs.spicy = (norm(v).startsWith('nhe')) ? 'nhat' : (norm(v)==='cay' ? 'cay' : 'vua');
        changes.push(`spicy=${prefs.spicy}`);
      }
      if (k==='diet' && ['an_chay','keto','it_duong','khong_gluten','tuy_chon'].includes(norm(v))) {
        prefs.diet = norm(v);
        changes.push(`diet=${prefs.diet}`);
      }
      if (k==='unit' && ['c','f'].includes(norm(v))) {
        prefs.unit = norm(v).toUpperCase();
        changes.push(`unit=${prefs.unit}`);
      }
    });

    savePrefs(prefs);
    return `Đã cập nhật: ${changes.join(', ') || 'không có thay đổi hợp lệ.'}\nVí dụ lệnh: /set spicy=nhẹ  |  /set diet=an_chay  |  /set unit=F`;
  }

  if (cmd.startsWith('/help')) {
    return [
      '🧭 Lệnh hữu ích:',
      '• /help — xem trợ giúp',
      '• /set spicy=nhẹ|vừa|cay — thiết lập độ cay',
      '• /set diet=an_chay|keto|it_duong|khong_gluten|tuy_chon — chế độ ăn',
      '• /set unit=C|F — đơn vị nhiệt độ',
      '• Hỏi “200C sang F?” để đổi nhiệt.',
      '• Hỏi “aglio e olio cho 3 người” để scale khẩu phần.',
      '• Hỏi “tôi có trứng, mì, cà chua…” để gợi ý món.',
    ].join('\n');
  }

  return 'Lệnh không hợp lệ. Gõ /help để xem hướng dẫn.';
};

const smartAnswer = (text, user) => {
  const prefs = loadPrefs();

  // 1) Slash command
  const slash = helpSlash(text);
  if (slash) return slash;

  // 2) Chào hỏi / cảm ơn / tạm biệt
  const g = greet(text, user);
  if (g) return g;
  const tb = thanksOrBye(text);
  if (tb) return tb;

  // 3) Chuyển đổi nhiệt / nhiệt độ nướng
  const temp = convertTemp(text, prefs);
  if (temp) return temp;

  // 4) Công thức theo tên + scale
  const rcp = recipeByName(text, prefs);
  if (rcp) return rcp;

  // 5) Gợi ý theo nguyên liệu trong bếp
  const pantry = pantrySuggest(text, prefs);
  if (pantry) return pantry;

  // 6) Thay thế nguyên liệu
  const sub = findSubstitutions(text);
  if (sub) return sub;

  // 7) Câu hỏi kỹ thuật bếp
  const tech = techniqueQ(text);
  if (tech) return tech;

  // 8) Fallback thân thiện
  return [
    'Tôi chưa hiểu rõ yêu cầu. Bạn có thể:',
    '• Gõ /help để xem ví dụ lệnh.',
    '• Hỏi “aglio e olio cho 2 người”, “200C sang F?”, “tôi có trứng, mì… làm gì được?”.',
    '• Hoặc nêu món/ kỹ thuật bạn quan tâm (ví dụ: “bí quyết xào giòn”, “nấu nước dùng phở trong”).'
  ].join('\n');
};

/* =========================================================
 * 5) UI CHIP GỢI Ý NHANH
 * =======================================================*/
const SUGGESTION_CHIPS = [
  'Aglio e olio cho 2 người',
  '200C sang F?',
  'Tôi có trứng, mì, cà chua',
  'Bí quyết xào giòn mà không ra nước',
  'Thay bơ bằng gì khi làm bánh?',
  '/help'
];

/* =========================================================
 * 6) COMPONENT
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
          `• Ví dụ: “aglio e olio cho 3 người”, “200C sang F?”, “tôi có trứng, mì… làm gì được?”`,
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
      handleSend(new Event('submit'));
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
      // nếu là /set thì sync prefs UI ngay
      if (trimInput.startsWith('/set')) setPrefs(loadPrefs());

      pushBot(botText);

      // gợi ý tiếp theo thông minh nhỏ
      if (anyMatch(trimInput, ['aglio','steak','tteok','bun cha','pho'])) {
        pushBot('Bạn có muốn tôi scale khẩu phần khác hoặc gợi ý món ăn kèm không?');
      } else if (anyMatch(trimInput, ['200c','f?','fahrenheit','celsius'])) {
        pushBot('Mẹo nướng: luôn làm nóng lò 10–15 phút và đặt khay giữa lò để nhiệt đều.');
      }

      setIsTyping(false);
    }, 700 + Math.random() * 600);
  };

  const Message = ({ msg }) => (
    <div className={`chat-message ${msg.sender}`}>
      <div className='message-content'>
        {msg.sender === 'bot' && <Badge bg="success" className="me-2">{AI_NAME}</Badge>}
        {/* Giữ xuống dòng bằng <pre> để hiển thị danh sách đẹp */}
        <pre style={{whiteSpace:'pre-wrap', margin:0}}>{msg.content}</pre>
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
            <small className='text-muted'>Trợ lý Ẩm thực AI • {`unit:${prefs.unit} • spicy:${prefs.spicy} • diet:${prefs.diet}`}</small>
          </div>
          <div className="d-none d-sm-block">
            {SUGGESTION_CHIPS.map((c,i)=>(
              <Button key={i} size="sm" variant="outline-light" className="ms-2" onClick={()=>handleChip(c)}>
                {c}
              </Button>
            ))}
          </div>
        </div>

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
                placeholder={isTyping ? "Đang chờ phản hồi..." : "Hỏi về công thức, kỹ thuật, mẹo... (gõ /help để xem lệnh)"}
                disabled={isTyping || !user}
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
