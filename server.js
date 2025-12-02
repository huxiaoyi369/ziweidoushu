/**
 * Backend Server - DeepSeek Implementation
 * 
 * This file handles requests from the Mini Program and forwards them to the DeepSeek API.
 * 
 * Dependencies: express, openai, body-parser
 */

const express = require('express');
const OpenAI = require('openai');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Initialize DeepSeek (via OpenAI SDK)
// WARNING: Replace with your actual DeepSeek API Key
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-a5f9b2b36a3b4d13ab5556d9251f4b4e' // TODO: User to replace this
});

// Helper for Chat Completion
async function callDeepSeek(systemInstruction, userPrompt) {
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userPrompt }
            ],
            model: "deepseek-chat",
            temperature: 1.3 // Higher creativity for fortune telling
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("DeepSeek API Error:", error);
        throw error;
    }
}

// --- Scenario 4: Fortune Telling (Primary) ---
const SYSTEM_INSTRUCTION_FORTUNE = `
You are an expert I Ching and BaZi master. 
Your Goal: Analyze the user's name and birth date to provide a comprehensive, professional BaZi report.
Instructions:
1. Language: Output MUST be in Simplified Chinese (zh-CN).
2. Tone: Professional, traditional, detailed.
3. Structure: Output ONLY valid JSON.
{
  "user_name": "Name",
  "overall_poem": "A 2-sentence poetic summary.",
  "user_info": {
    "solar_date": "YYYY年MM月DD日 HH时",
    "lunar_date": "YYYY年MM月DD日 HH时"
  },
  "ming_ge": {
    "type": "e.g. 正官格",
    "traits": "Detailed traits description."
  },
  "bazi_chart": {
    "headers": ["年根", "月苗", "日花", "时果"],
    "pillars": [
      { 
        "name": "年柱", "gan": "天干", "zhi": "地支", 
        "hidden_gan": "藏干", "shishen": "十神", "wangshuai": "衰旺", "nayin": "纳音",
        "shensha": ["神煞1", "神煞2"]
      },
      { "name": "月柱", "gan": "...", "zhi": "...", "hidden_gan": "...", "shishen": "...", "wangshuai": "...", "nayin": "...", "shensha": [] },
      { "name": "日柱", "gan": "...", "zhi": "...", "hidden_gan": "...", "shishen": "...", "wangshuai": "...", "nayin": "...", "shensha": [] },
      { "name": "时柱", "gan": "...", "zhi": "...", "hidden_gan": "...", "shishen": "...", "wangshuai": "...", "nayin": "...", "shensha": [] }
    ]
  },
  "meta_info": {
    "taiyuan": "胎元", "minggong": "命宫", "taisui": "太岁", "wenchang": "文昌位", "benmingfo": "本命佛", "fuyuan": "命主福元"
  },
  "wuxing": {
    "chart": [
      { "label": "八字", "values": ["干支", "干支", "干支", "干支"] },
      { "label": "五行", "values": ["行行", "行行", "行行", "行行"] }
    ],
    "counts": [
      { "name": "木", "count": 1 }, { "name": "火", "count": 1 }, { "name": "土", "count": 1 }, { "name": "金", "count": 1 }, { "name": "水", "count": 1 }
    ],
    "analysis": "Detailed analysis of scores and Joy God (喜用神)."
  },
  "personality": {
    "zodiac": "生肖",
    "poem": "生肖诗",
    "desc": "Detailed personality description."
  },
  "career": {
    "desc": "Suitable careers.",
    "note": "Tips."
  },
  "guiren": {
    "zodiac": "Zodiac noble people.",
    "tianyi": "Tianyi noble people."
  }
}
`;

app.post('/api/fortune', async (req, res) => {
    try {
        const { name, gender, birthDate, birthTime, type } = req.body;

        let prompt = "";
        let systemInstruction = SYSTEM_INSTRUCTION_FORTUNE;

        if (type === 'ziwei') {
            systemInstruction = `
            You are an expert in Zi Wei Dou Shu (Purple Star Astrology).
            Your Goal: Generate a complete 12-Palace Chart and analysis.
            Instructions:
            1. Language: Simplified Chinese (zh-CN).
            2. Structure: Output ONLY valid JSON.
            {
              "type": "ziwei",
              "user_name": "Name",
              "overall_poem": "Poetic summary.",
              "palace_grid": [
                { "name": "命宫", "major_stars": ["紫微"], "minor_stars": ["文昌"], "analysis": "Detailed analysis..." },
                { "name": "兄弟", "major_stars": ["天机"], "minor_stars": [], "analysis": "..." },
                ... (Total 12 palaces in standard order)
              ]
            }
            `;
            prompt = `Generate Zi Wei Dou Shu Chart for: ${name}, ${gender}, ${birthDate} ${birthTime}`;
        } else {
            // Default BaZi
            prompt = `Analyze BaZi Fortune for: ${name}, ${gender}, ${birthDate} ${birthTime}`;
        }

        const text = await callDeepSeek(systemInstruction, prompt);

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        res.json(JSON.parse(jsonStr));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "AI processing failed" });
    }
});

// --- Legacy Endpoints (Optional, kept for reference) ---
// ... (You can add Explore/Plan endpoints here if needed, following the same pattern)

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
