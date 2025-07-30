# IdeaCanvas 应用生成流程说明

## 概述

IdeaCanvas 采用**两步式流程**来帮助非技术用户创建应用：

### 第一步：流程图生成（Flow Generation）
用户通过自然语言描述需求，AI 生成可视化的流程图。

### 第二步：代码生成（Code Generation）
基于确认的流程图，生成实际的 Web 应用代码。

## 详细流程

### 1. 流程图生成阶段

**输入**：
- 用户在输入框中用中文或英文描述应用需求
- 例如："创建一个用户登录系统，包含注册、登录、密码找回功能"

**处理**：
- AI 分析需求，识别关键功能模块
- 生成节点（Node）和连接（Edge）
- 节点类型包括：
  - 产品节点（白色）：核心功能
  - 外部节点（蓝色）：外部集成
  - 上下文节点（黄色）：辅助信息
  - 文档节点（绿色）：说明文档

**输出**：
- 可视化的流程图
- 用户可以：
  - 拖拽调整节点位置
  - 编辑节点内容
  - 添加或删除连接
  - 保存流程图

### 2. 代码生成阶段

**触发**：
- 用户点击工具栏中的"生成应用"按钮

**处理流程**：
1. **节点解析**（Node Parsing）
   - 分析每个节点的内容
   - 识别 UI 组件（表单、列表、按钮等）
   - 提取数据模型
   - 识别用户操作

2. **流程分析**（Flow Analysis）
   - 分析节点之间的关系
   - 确定页面导航结构
   - 识别数据流向

3. **代码生成**（Code Generation）
   - HTML：生成页面结构和组件
   - CSS：生成样式（支持 Tailwind、Bootstrap 或自定义）
   - JavaScript：生成交互逻辑
   - API 文档：生成 OpenAPI 格式的接口文档

**输出**：
- 预览窗口显示生成的应用
- 可切换查看不同代码文件
- 可下载完整项目 ZIP 包

## 生成内容示例

### 基于节点内容的智能生成

如果节点标题或内容包含"登录"，系统会自动生成：
```html
<form class="form-component login-form">
  <h3>用户登录</h3>
  <div class="form-fields">
    <div class="form-group">
      <label for="username">用户名</label>
      <input type="text" id="username" name="username" required />
    </div>
    <div class="form-group">
      <label for="password">密码</label>
      <input type="password" id="password" name="password" required />
    </div>
  </div>
  <button type="submit" class="btn btn-primary">登录</button>
</form>
```

### 项目结构

下载的 ZIP 包包含：
```
project/
├── index.html          # 应用首页
├── login.html          # 登录页面
├── dashboard.html      # 仪表板页面
├── styles.css          # 主样式文件
├── components.css      # 组件样式（可选）
├── app.js              # 主应用逻辑
├── api-client.js       # API 客户端
├── utils.js            # 工具函数
├── api-documentation.json   # API 文档（JSON）
├── api-documentation.html   # API 文档（HTML）
├── README.md           # 项目说明
└── package.json        # 项目配置
```

## 预览模式的限制

在预览模式下：
- 表单提交被禁用（显示提示信息）
- 页面导航被禁用（显示提示信息）
- 外部脚本不会加载
- 这是为了安全和性能考虑

## 最佳实践

1. **流程图设计**：
   - 每个节点专注一个功能
   - 节点描述要清晰具体
   - 合理组织节点关系

2. **代码生成**：
   - 先预览确认效果
   - 检查生成的代码结构
   - 根据需要调整选项（语言、样式框架等）

3. **后续开发**：
   - 下载的代码可以直接运行
   - 可以在此基础上继续开发
   - 建议使用版本控制系统管理代码

## 常见问题

**Q: 为什么预览中看不到样式？**
A: 预览使用内联样式，可能与实际效果略有差异。下载后的完整项目会包含所有样式文件。

**Q: 生成的代码可以直接部署吗？**
A: 生成的是静态 HTML/CSS/JS 文件，可以直接部署到任何静态网站托管服务。

**Q: 如何添加后端功能？**
A: 生成的代码包含 API 客户端和文档，您可以根据 API 规范实现后端服务。