# IdeaCanvas 测试套件使用指南

## 概述

本测试套件提供了全面的测试工具，用于验证 IdeaCanvas 系统在各种情况下的稳定性和可靠性。

## 测试类型

### 1. 快速测试
适用于日常开发中的快速验证。

```bash
# 运行快速测试
npx ts-node tests/quick-test.ts
```

### 2. 系统功能测试
测试所有核心功能和边缘情况。

```bash
# 运行系统测试
npx ts-node tests/run-tests.ts
```

### 3. 综合测试
包含功能测试、错误恢复测试、压力测试等。

```bash
# 确保开发服务器运行中
npm run dev

# 在另一个终端运行综合测试
npx ts-node tests/comprehensive-test.ts
```

## 测试内容详解

### JSON 解析测试
- 控制字符处理（\n, \r, \t 等）
- Unicode 字符处理
- 特殊字符转义
- 格式错误恢复

### 错误恢复测试
- HTTP 错误响应（401, 403, 429, 500）
- 网络超时
- 格式错误的响应
- 存储配额错误

### 压力测试
- 并发请求测试
- 递增负载测试
- 峰值负载测试
- 内存泄漏检测

### 边缘情况测试
- 空输入
- 超长输入
- 特殊字符输入
- 恶意输入（XSS, SQL注入尝试）

## 测试数据

所有测试用例和边缘情况数据存储在 `fixtures/edge-cases.json` 中，可以根据需要修改或添加新的测试场景。

## 测试结果

测试结果会自动保存到 `tests/results/` 目录中，包含：
- 详细的测试报告
- 性能指标
- 错误日志
- 改进建议

## 常见问题处理

### 1. JSON 解析错误频繁出现
检查以下几点：
- AI 提示词是否明确要求转义控制字符
- `sanitizeJSON` 函数是否正确处理所有边缘情况
- 错误日志中的具体位置和字符

### 2. 压力测试失败
可能的原因：
- API 速率限制
- 服务器资源不足
- 网络延迟

解决方案：
- 降低并发数
- 增加请求间隔
- 优化服务器配置

### 3. 错误恢复测试失败
确保：
- 错误处理逻辑完整
- 用户友好的错误信息
- 适当的重试机制

## 持续集成

建议在 CI/CD 流程中加入以下测试：

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npx ts-node tests/quick-test.ts
      - run: npx ts-node tests/run-tests.ts
```

## 性能基准

根据测试结果，系统应满足以下基准：

- JSON 解析: < 100ms（100个节点）
- API 响应: < 3s（正常负载）
- 并发处理: 支持至少 10 个并发请求
- 错误恢复: 所有错误场景都有适当处理
- 内存使用: 无明显内存泄漏

## 添加新测试

1. 在 `edge-cases.json` 中添加测试数据
2. 在相应的测试文件中添加测试逻辑
3. 运行测试验证
4. 更新文档

## 测试驱动开发

建议采用以下流程：
1. 先写测试用例
2. 运行测试（应该失败）
3. 实现功能
4. 运行测试（应该通过）
5. 重构代码
6. 确保测试仍然通过