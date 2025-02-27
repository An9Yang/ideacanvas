import { Language } from '@/lib/i18n';
import { NodeType } from '@/lib/types/flow';

// 中英文产品功能节点标题通用映射
const titleMappings: Record<string, string> = {
  // 从英文到中文
  'User Authentication': '用户认证',
  'User Registration': '用户注册',
  'Login': '登录',
  'Dashboard': '仪表盘',
  'Profile Management': '个人资料管理',
  'Settings': '设置',
  'Notification System': '通知系统',
  'Admin Panel': '管理员面板',
  'Product Listing': '产品列表',
  'Product Details': '产品详情',
  'Shopping Cart': '购物车',
  'Checkout': '结账',
  'Payment Processing': '支付处理',
  'Order Management': '订单管理',
  'Search Functionality': '搜索功能',
  'Recommendation System': '推荐系统',
  'Feedback & Support': '反馈与支持',
  'Analytics Dashboard': '分析仪表盘',
  'User Management': '用户管理',
  'Content Management': '内容管理',
  'Messaging System': '消息系统',
  'File Upload': '文件上传',
  'Email Notifications': '邮件通知',
  'Social Sharing': '社交分享',
  'API Integration': 'API集成',
  'Mobile Responsiveness': '移动响应式设计',
  'Landing Page': '着陆页',
  'Home Page': '首页',
  'About Us': '关于我们',
  'Contact Page': '联系页面',
  'Blog': '博客',
  'FAQ': '常见问题',
  'Terms of Service': '服务条款',
  'Privacy Policy': '隐私政策',
  'Help Center': '帮助中心',
  'Community Forum': '社区论坛',
  'Live Chat': '在线聊天',
  'Wishlist': '愿望清单',
  'Reviews & Ratings': '评价与评分',
  'Social Login': '社交媒体登录',
  'Password Recovery': '密码恢复',
  'User Onboarding': '用户引导',
  'Data Visualization': '数据可视化',
  'Subscription Management': '订阅管理',
  'Multi-language Support': '多语言支持',
  'Theme Customization': '主题定制',
  'Push Notifications': '推送通知',
  'Inventory Management': '库存管理',
  'Category Navigation': '分类导航',
  'User Activity Feed': '用户动态流',
  'Account Settings': '账户设置',
  
  // 从中文到英文
  '用户认证': 'User Authentication',
  '用户注册': 'User Registration',
  '登录': 'Login',
  '仪表盘': 'Dashboard',
  '个人资料管理': 'Profile Management',
  '设置': 'Settings',
  '通知系统': 'Notification System',
  '管理员面板': 'Admin Panel',
  '产品列表': 'Product Listing',
  '产品详情': 'Product Details',
  '购物车': 'Shopping Cart',
  '结账': 'Checkout',
  '支付处理': 'Payment Processing',
  '订单管理': 'Order Management',
  '搜索功能': 'Search Functionality',
  '推荐系统': 'Recommendation System',
  '反馈与支持': 'Feedback & Support',
  '分析仪表盘': 'Analytics Dashboard',
  '用户管理': 'User Management',
  '内容管理': 'Content Management',
  '消息系统': 'Messaging System',
  '文件上传': 'File Upload',
  '邮件通知': 'Email Notifications',
  '社交分享': 'Social Sharing',
  'API集成': 'API Integration',
  '移动响应式设计': 'Mobile Responsiveness',
  '着陆页': 'Landing Page',
  '首页': 'Home Page',
  '关于我们': 'About Us',
  '联系页面': 'Contact Page',
  '博客': 'Blog',
  '常见问题': 'FAQ',
  '服务条款': 'Terms of Service',
  '隐私政策': 'Privacy Policy',
  '帮助中心': 'Help Center',
  '社区论坛': 'Community Forum',
  '在线聊天': 'Live Chat',
  '愿望清单': 'Wishlist',
  '评价与评分': 'Reviews & Ratings',
  '社交媒体登录': 'Social Login',
  '密码恢复': 'Password Recovery',
  '用户引导': 'User Onboarding',
  '数据可视化': 'Data Visualization',
  '订阅管理': 'Subscription Management',
  '多语言支持': 'Multi-language Support',
  '主题定制': 'Theme Customization',
  '推送通知': 'Push Notifications',
  '库存管理': 'Inventory Management',
  '分类导航': 'Category Navigation',
  '用户动态流': 'User Activity Feed',
  '账户设置': 'Account Settings'
};

/**
 * 根据当前语言返回合适的节点标题
 * @param title 原始标题
 * @param language 当前语言
 * @returns 翻译后的标题
 */
export function translateNodeTitle(title: string, language: Language): string {
  // 如果当前是英文，并且有中文标题的映射，返回英文标题
  if (language === 'en' && Object.values(titleMappings).includes(title)) {
    const englishTitle = Object.keys(titleMappings).find(key => titleMappings[key] === title);
    if (englishTitle) return englishTitle;
  }
  
  // 如果当前是中文，并且有英文标题的映射，返回中文标题
  if (language === 'zh' && Object.keys(titleMappings).includes(title)) {
    return titleMappings[title];
  }
  
  // 没有映射关系，返回原标题
  return title;
}

/**
 * 根据当前语言获取节点类型文本
 * @param type 节点类型
 * @param language 当前语言
 */
export function getNodeTypeText(type: NodeType, language: Language): string {
  const typeTexts = {
    zh: {
      product: '产品功能',
      external: '外部服务',
      context: '上下文信息',
      guide: '开发指南'
    },
    en: {
      product: 'Product Feature',
      external: 'External Service',
      context: 'Context Information',
      guide: 'Development Guide'
    }
  };
  
  return typeTexts[language][type] || typeTexts[language].product;
} 