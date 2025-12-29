
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  try {
    // 浏览器安全检查：优先检查 window.process 或直接检查 process 是否存在
    const env = (typeof window !== 'undefined' && (window as any).process?.env) 
                || (typeof process !== 'undefined' ? process.env : null);
    
    return env?.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const apiKey = getApiKey();
// 使用占位符初始化以防止 SDK 内部错误，实际逻辑会通过 apiKey 长度判断是否启用 AI
const ai = new GoogleGenAI({ apiKey: apiKey || 'NO_KEY_PROVIDED' });

export const generateIcebreaker = async (studentName: string) => {
  // 如果没有有效 Key，直接进入本地趣味库模式
  if (!apiKey || apiKey === 'NO_KEY_PROVIDED') {
    return getFallbackChallenge();
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一个幽默风趣的老师。现在随机点到了学生“${studentName}”。请为他生成一个有趣的破冰挑战或问题。要求：中文，字数20字以内，适合课堂氛围。直接返回挑战内容即可。`,
      config: { 
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text?.trim() || getFallbackChallenge();
  } catch (error) {
    console.warn("Gemini Service is unavailable (Network or Config issue). Switching to local deck.");
    return getFallbackChallenge();
  }
};

function getFallbackChallenge() {
  const fallbacks = [
    "分享一下你最近看的一本书吧！",
    "如果你有超能力，你最想拥有哪一个？",
    "分享一个你最近学到的有趣冷知识。",
    "用三个词描述你今天的心情！",
    "如果你现在可以瞬间移动，你想去哪里？",
    "描述一下你手机里最后一张照片拍了什么？",
    "说出一件本周让你感到很有成就感的小事。",
    "如果你要给全班推荐一首歌，你会选哪首？"
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
