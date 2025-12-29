import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  try {
    // 优先从 window.process 获取（我们在 index.html 中注入的）
    const env = (window as any).process?.env || (typeof process !== 'undefined' ? process.env : null);
    return env?.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const apiKey = getApiKey();
// 只有在 Key 存在时才初始化 SDK
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateIcebreaker = async (studentName: string) => {
  // 如果 AI 不可用，直接返回本地预设题库，确保 100% 不黑屏
  if (!ai || !apiKey) {
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
    console.warn("AI Service unavailable, using fallback.");
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
    "如果你要给全班推荐一首歌，你会选哪首？",
    "模仿一个你最喜欢的动画角色！",
    "如果可以穿越到过去，你最想去哪个朝代？"
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}