# Paper Agent

一个基于 Next.js 和 React Flow 的智能流程图生成工具。

## 功能特点

- 🤖 智能生成流程图
- 🎨 美观的用户界面
- 📱 响应式设计
- 🔄 实时预览
- 💾 自动保存
- 🔍 智能搜索

## 技术栈

- Next.js 15.1.7
- React 18.2.0
- React Flow
- TypeScript
- Tailwind CSS

## 开始使用

### 环境要求

- Node.js 18+
- npm 9+

### 安装

```bash
# 克隆项目
git clone [项目地址]

# 安装依赖
npm install

# 创建环境配置
cp .env.example .env
```

### 配置

在 `.env` 文件中配置以下环境变量：

```env
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_API_VERSION=your_api_version
```

### 运行

```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

## 使用说明

1. 在输入框中输入你想要生成流程图的文本描述
2. 点击生成按钮
3. 等待 AI 生成流程图
4. 可以拖拽节点调整位置
5. 可以编辑节点内容
6. 自动保存所有修改

## 项目结构

```
├── app/            # Next.js 应用目录
├── components/     # React 组件
├── lib/           # 工具库和服务
│   ├── services/  # 服务层
│   ├── stores/    # 状态管理
│   ├── types/     # 类型定义
│   └── utils/     # 工具函数
└── scripts/       # 脚本文件
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 提交 Pull Request

## 许可证

MIT License
