# AI 发音分析应用 🎙️

一个集成了 Azure Speech Service 和 DeepSeek AI 的智能发音分析应用。让 AI 自动检测您说的内容并提供专业的发音指导！

## 功能特点 ✨

- 🎤 **无目标句子录音**: 自然说话，Azure AI 自动检测您说的内容
- 📊 **详细发音分析**: 准确性、流利度、完整度等多维度评分
- 🧠 **AI 个性化指导**: DeepSeek AI 提供生动有趣的改进建议
- 📱 **响应式设计**: 支持手机和桌面设备
- 🎵 **实时波形显示**: 录音时的视觉反馈
- 🔄 **录音重播功能**: 可以播放和重新录制

## 快速开始 🚀

### 1. 环境要求

- Node.js 18+
- npm 或 yarn
- Azure Speech Service 订阅
- DeepSeek API 密钥

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量模板：

```bash
cp env.example .env.local
```

在 `.env.local` 中配置以下变量：

#### Azure Speech Service 配置

```
NEXT_PUBLIC_AZURE_SPEECH_KEY=your_azure_speech_service_key
NEXT_PUBLIC_AZURE_SPEECH_REGION=japaneast
```

#### DeepSeek API 配置

```
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

### 4. 启动应用

```bash
npm run dev
```

访问 http://localhost:3000 开始使用！

## 如何获取 API 密钥 🔑

### Azure Speech Service

1. 登录 [Azure Portal](https://portal.azure.com)
2. 创建 "Cognitive Services" 或 "Speech" 资源
3. 在资源页面获取 **Key** 和 **Region**
4. 推荐使用 `japaneast` 区域以获得最佳性能

### DeepSeek API

1. 访问 [DeepSeek 官网](https://api.deepseek.com)
2. 注册账号并获取 API 密钥
3. 确保账户有足够的配额

## 使用指南 📖

### 基本流程

1. **录音**: 点击"开始录音"按钮，自然说英语
2. **停止**: 完成录音后点击"停止录音"
3. **分析**: 点击"分析发音"等待结果
4. **查看结果**:
   - 检测到的文本
   - 发音评分
   - AI 个性化建议
   - 详细的单词分析

### 技术特点

- **无脚本评估**: 不需要预设目标句子，AI 自动检测您说的内容
- **实时处理**: Azure Speech SDK 直接在浏览器中处理音频
- **智能分析**: DeepSeek AI 根据发音数据生成个性化建议
- **多格式支持**: 自动处理不同的音频格式并转换为 WAV

## 技术架构 🏗️

```
前端 (Next.js + React)
├── 录音模块 (MediaRecorder API)
├── 音频处理 (AudioContext + WAV 转换)
├── Azure Speech SDK (浏览器端)
└── UI 展示 (Tailwind CSS + Framer Motion)

后端 API
├── /api/ai-analysis (OpenAI SDK + DeepSeek 集成)
└── 环境变量管理

外部服务
├── Azure Speech Service (发音评估)
└── DeepSeek API (AI 分析)
```

## 开发说明 🛠️

### 项目结构

```
├── app/
│   ├── page.tsx              # 主页面组件
│   ├── api/ai-analysis/      # DeepSeek API 端点
│   ├── layout.tsx            # 布局组件
│   └── globals.css           # 全局样式
├── public/                   # 静态资源
├── env.example              # 环境变量模板
├── package.json
├── tailwind.config.js       # Tailwind 配置
└── next.config.js           # Next.js 配置
```

### 主要依赖

- **Next.js 14**: React 框架
- **microsoft-cognitiveservices-speech-sdk**: Azure Speech SDK
- **openai**: OpenAI SDK (用于调用 DeepSeek API)
- **Tailwind CSS**: UI 样式
- **Framer Motion**: 动画效果
- **Lucide React**: 图标库

### 自定义配置

#### 修改 AI 提示词

在 `app/api/ai-analysis/route.ts` 中修改 `SYSTEM_PROMPT` 常量来自定义 AI 分析的风格和内容。

#### DeepSeek API 集成

应用使用 OpenAI SDK 来调用 DeepSeek API，代码示例：

```javascript
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: "deepseek-chat",
  messages: [
    /* ... */
  ],
});
```

#### 调整音频设置

在 `app/page.tsx` 的 `startRecording` 函数中可以修改音频录制参数：

```javascript
audio: {
  sampleRate: 16000,      // 采样率
  channelCount: 1,        // 单声道
  echoCancellation: true, // 回声消除
  noiseSuppression: true, // 噪声抑制
}
```

## 故障排除 🔧

### 常见问题

1. **录音权限**: 确保浏览器允许麦克风访问
2. **API 配置**: 检查环境变量是否正确设置
3. **网络问题**: 确保能访问 Azure 和 DeepSeek API
4. **音频格式**: 应用会自动处理格式转换

### 调试模式

启用调试模式查看详细日志：

```
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### API 限制

- Azure Speech Service: 按使用量计费
- DeepSeek API: 有请求频率限制，注意配额管理

## 贡献指南 🤝

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证 📄

MIT License

## 支持 💬

如有问题，请：

1. 查看文档
2. 提交 GitHub Issue
3. 检查控制台错误日志

---

**享受您的 AI 发音学习之旅！** 🌟
