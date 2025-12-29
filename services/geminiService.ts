
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  try {
    // 安全地检查环境变量，避免在浏览器直接访问 process 报错
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  } catch {
    return '';
  }
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey: apiKey || 'REPLACE_WITH_KEY' });

export const generateIcebreaker = async (studentName: string) => {
  if (!apiKey) return getFallbackChallenge();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一个幽默风趣的老师。现在随机点到了学生“${studentName}”。请为他生成一个有趣的破冰挑战或问题。要求：中文，字数20字以内，适合课堂氛围。直接返回挑战内容即可。`,
      config: { temperature: 0.8 }
    });
    return response.text?.trim() || getFallbackChallenge();
  } catch (error) {
    console.error("Gemini Error:", error);
    return getFallbackChallenge();
  }
};

function getFallbackChallenge() {
  const fallbacks = [
    "分享一下你最近看的一本书吧！",
    "如果你有超能力，你最想拥有哪一个？",
    "分享一个你最近学到的有趣冷知识。",
    "用三个词描述你今天的心情！",
    "如果你现在可以瞬间移动，你想去哪里？"
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
