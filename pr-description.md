# 升级 Azure OpenAI SDK 并修复 JSON 验证问题

## 更改内容

### 1. 升级 Azure OpenAI 集成
- 修复了 Azure OpenAI 参数配置
  - 使用 `max_completion_tokens` 替代 `max_tokens`
  - 移除不支持的参数（temperature、presence_penalty、frequency_penalty）
  - 增加 token 限制以支持更长的响应

### 2. 增强错误处理和日志
- 添加了更多调试日志
  - 记录 Azure OpenAI 配置信息
  - 记录 AI 响应详情
  - 记录 JSON 验证错误
- 改进了错误处理机制
  - 移动 APIError 类到独立的类型文件
  - 增强了错误消息的可读性

### 3. 优化代码结构
- 创建了 `lib/types/error.ts` 文件
- 重构了错误处理逻辑
- 优化了代码组织

## 测试结果
- ✅ 成功生成完整的流程图数据
  - 9 个节点（上下文、产品、外部服务）
  - 8 个连接边
  - 包含详细的描述和交互逻辑
- ✅ JSON 验证通过
- ✅ 错误处理正常工作

## 影响范围
- `/app/api/generate-flow/route.ts`
- `/lib/config/azure-openai.ts`
- `/lib/utils/error-handler.ts`
- `/lib/types/error.ts`（新文件）

## 后续工作
- [ ] 考虑添加更多单元测试
- [ ] 考虑优化 token 使用效率
- [ ] 监控生产环境的性能表现
