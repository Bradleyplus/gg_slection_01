
import { GoogleGenAI } from "@google/genai";

// 彻底解决浏览器端 process 未定义的报错
const getSafeApiKey = () => {
  try {
    // 优先检查全局 process 对象
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {}
  return '';
};

const apiKey = getSafeApiKey();
const ai = new GoogleGenAI({ apiKey: apiKey });

export const generateIcebreaker = async (studentName: string) => {
  if (!apiKey) {
    console.warn("API_KEY 未配置，切换至本地随机题库模式");
    return getFallbackChallenge();
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一个幽默风趣的课堂老师。现在你随机点到了学生“${studentName}”。请为他生成一个有趣的破冰挑战或是一个令人惊喜的小问题。要求：中文，字数20字以内，轻松愉快，适合课堂氛围。直接返回挑战内容即可。`,
      config: {
        temperature: 0.8,
      }
    });

    return response.text?.trim() || getFallbackChallenge();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return getFallbackChallenge();
  }
};

function getFallbackChallenge() {
  const fallbacks = [
    "分享一下你最近看的一本书或电影吧！",
    "如果你有超能力，你最想拥有哪一个？",
    "分享一个你最近学到的有趣冷知识。",
    "你觉得最实用的技能是什么？",
    "如果你现在可以瞬间移动，你想去哪里？",
    "用三个词描述你今天的心情！"
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
