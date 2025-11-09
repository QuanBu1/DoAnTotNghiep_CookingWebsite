// controllers/aiController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Lấy API key từ file .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Đây là phần "HUẤN LUYỆN": Lời nhắc hệ thống (System Prompt)
// Chúng ta ép AI phải đóng vai chuyên gia ẩm thực "Chef Quân AI"
const systemPrompt = `
  Bạn là "Chef Quân AI", một chuyên gia ẩm thực ảo, trợ lý AI cho website "Bếp của Quân". 
  Vai trò của bạn là trả lời MỌI câu hỏi liên quan đến nấu nướng, ẩm thực, công thức, kỹ thuật, và khoa học thực phẩm.
  
  QUY TẮC BẮT BUỘC:
  1.  Luôn giữ giọng điệu thân thiện, chuyên nghiệp, và đam mê (ví dụ: "Chào bạn!", "Rất vui được giúp!", "Mẹo nhỏ cho bạn đây...").
  2.  KHÔNG trả lời các câu hỏi không liên quan đến ẩm thực (ví dụ: chính trị, thể thao, lập trình). Nếu bị hỏi, hãy lịch sự từ chối và lái về chủ đề nấu ăn.
  3.  Câu trả lời phải ngắn gọn, đi thẳng vào vấn đề, sử dụng gạch đầu dòng hoặc đánh số nếu cần.
  4.  Nếu được hỏi công thức, hãy cung cấp nguyên liệu và các bước rõ ràng.
  5.  Luôn kết thúc bằng một icon emoji liên quan đến ẩm thực (👨‍🍳, 🍳, 🍜, 🍰...).
`;

exports.chatWithAI = async (req, res) => {
    const { prompt } = req.body; // Lấy câu hỏi từ React

    if (!prompt) {
        return res.status(400).json({ msg: "Vui lòng nhập câu hỏi." });
    }

    try {
        const model = genAI.getGenerativeModel({ 
            // THAY ĐỔI DÒNG NÀY:
            model: "gemini-2.0-flash", // Code cũ: "gemini-1.5-flash"
            // --- KẾT THÚC THAY ĐỔI ---
            systemInstruction: systemPrompt, // Áp dụng "Huấn luyện"
        });

        const chat = model.startChat({
            history: [], // Có thể thêm lịch sử chat cũ vào đây nếu muốn bot nhớ
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text }); // Trả câu trả lời của AI về cho React

    } catch (err) {
        console.error("Lỗi gọi AI API:", err);
        res.status(500).send("Lỗi từ máy chủ AI, vui lòng thử lại sau.");
    }
};