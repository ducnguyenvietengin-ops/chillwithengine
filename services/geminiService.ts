
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

export const getFinancialAdvice = async (state: AppState) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const totalSpent = state.transactions.reduce((acc, t) => acc + t.amount, 0);
  
  const prompt = `
    Bạn là một chuyên gia tư vấn tài chính cá nhân. Dựa trên dữ liệu sau, hãy đưa ra 3 lời khuyên ngắn gọn và thông minh bằng tiếng Việt:
    - Thu nhập tháng: ${state.income} VND
    - Tổng chi tiêu thực tế: ${totalSpent} VND
    - Các hạng mục ngân sách: ${state.categories.map(c => `${c.name} (${c.percentage}%)`).join(', ')}
    - Số lượng giao dịch: ${state.transactions.length}
    - Danh sách tài khoản: ${state.accounts.map(a => `${a.name}: ${a.balance} VND`).join(', ')}

    Yêu cầu:
    1. Phân tích xem chi tiêu có vượt quá hạn mức "Chi tiêu" không.
    2. Đề xuất cách tối ưu hóa dựa trên các quy tắc tài chính phổ biến.
    3. Giọng văn chuyên nghiệp, khích lệ.
    Phản hồi dưới định dạng Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "Không thể kết nối với chuyên gia AI lúc này. Hãy kiểm tra lại ngân sách của bạn!";
  }
};
