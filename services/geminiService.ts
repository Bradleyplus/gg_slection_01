
import { GoogleGenAI } from "@google/genai";

// 兼容性修复：在没有构建工具的环境下 process 可能未定义
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  } catch {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() || '' });

export const generateIcebreaker = async (studentName: string) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key not found");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一个幽默风趣的课堂老师。现在你随机点到了学生“${studentName}”。请为他生成一个有趣的破冰挑战或是一个令人惊喜的小问题。要求：中文，字数20字以内，轻松愉快，适合课堂氛围。直接返回挑战内容即可。`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    return response.text?.trim() || "今天你最期待学到什么知识？";
  } catch (error) {
    console.error("Gemini Error:", error);
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
};
