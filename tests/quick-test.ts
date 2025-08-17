#!/usr/bin/env ts-node

/**
 * 快速测试脚本
 * 用于日常开发中的快速验证
 */

import { sanitizeJSON, validateJSON } from '../lib/utils/error-handler';

const quickTests = [
  {
    name: '基础JSON解析',
    test: () => {
      const input = '{"nodes":[{"id":"n1","data":{"label":"Test"}}]}';
      const result = validateJSON(sanitizeJSON(input));
      console.assert(result.nodes.length === 1, 'Should have 1 node');
    }
  },
  {
    name: '控制字符处理',
    test: () => {
      const input = '{"nodes":[{"id":"n1","data":{"label":"Line1\nLine2\tTab"}}]}';
      const result = validateJSON(sanitizeJSON(input));
      console.assert(result.nodes[0].data.label.includes('Line1'), 'Should preserve content');
    }
  },
  {
    name: '中文字符处理',
    test: () => {
      const input = '{"nodes":[{"id":"n1","data":{"label":"测试中文"}}]}';
      const result = validateJSON(sanitizeJSON(input));
      console.assert(result.nodes[0].data.label === '测试中文', 'Should preserve Chinese');
    }
  },
  {
    name: 'Markdown清理',
    test: () => {
      const input = '```json\n{"nodes":[{"id":"n1","data":{"label":"Test"}}]}\n```';
      const result = validateJSON(sanitizeJSON(input));
      console.assert(result.nodes.length === 1, 'Should clean markdown');
    }
  },
  {
    name: '格式错误恢复',
    test: () => {
      const input = '{"nodes":[{"id":"n1","data":{"label":"Test",},}],}';
      const result = validateJSON(sanitizeJSON(input));
      console.assert(result.nodes.length === 1, 'Should fix trailing commas');
    }
  }
];

console.log('🚀 运行快速测试...\n');

let passed = 0;
let failed = 0;

quickTests.forEach(({ name, test }) => {
  try {
    test();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败`);

if (failed > 0) {
  process.exit(1);
}