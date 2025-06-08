import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';

const SYSTEM_PROMPT = `你是一位热情洋溢、经验丰富的英语口语老师，深受学生喜爱！你的任务是根据提供的语音分析API响应数据，为学生制定一个生动、简洁、针对性的英语口语提升计划。

API数据包含学生的口语文本、发音准确性（AccuracyScore）、流利度（FluencyScore）、完整度（CompletenessScore）、总体发音得分（PronScore），以及每个单词、音节和音素的发音评估。

请深入分析数据，找出学生在发音、流利度或语调方面的关键问题，以亲切、鼓励且充满活力的英语老师口吻，提出3-4条具体、可操作的改进建议。

计划应简洁（100字以内），用生动的语言激励学生，包含实用练习方法，确保学生感到被支持并跃跃欲试。避免枯燥的术语，用类比或有趣的表达让建议更吸引人！

请用中文回答。`;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      );
    }

    const { azureResponse } = await request.json();

    if (!azureResponse) {
      return NextResponse.json(
        { error: 'Azure response data is required' },
        { status: 400 }
      );
    }

    // 初始化OpenAI客户端，配置为使用DeepSeek API
    const openai = new OpenAI({
      baseURL: DEEPSEEK_API_URL,
      apiKey: DEEPSEEK_API_KEY
    });

    // 调用DeepSeek API
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `API数据：${JSON.stringify(azureResponse, null, 2)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const aiAnalysis = completion.choices?.[0]?.message?.content;

    if (!aiAnalysis) {
      throw new Error('No analysis content received from DeepSeek');
    }

    return NextResponse.json({
      success: true,
      analysis: aiAnalysis,
      model: 'deepseek-chat'
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    
    // 返回一个备用的分析结果
    const fallbackAnalysis = `嘿，语言探索者！🌟 虽然AI老师暂时在休息，但我依然要为你点赞！

💡 **继续练习**：保持每天录音的好习惯，语言就像肌肉，越练越强！
🎯 **专注发音**：挑选几个挑战词汇，重复练习直到完美！
🎵 **模仿跟读**：找你喜欢的英语内容，像学歌一样跟着唱！
✨ **保持自信**：每一次开口都是进步，你已经在正确的道路上了！

记住，流利英语不是一日建成的城堡，而是每日积累的美丽花园！🌸`;

    return NextResponse.json({
      success: true,
      analysis: fallbackAnalysis,
      model: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 