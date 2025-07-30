import { UIComponent, UserAction, DataField, APICall, ValidationRule } from '../types';

export class ContentExtractor {
  private chinesePatterns = {
    uiComponents: /(?:包含|显示|展示|输入框|按钮|表单|列表|卡片|表格)(.*?)(?:；|。|\n)/g,
    dataFields: /(?:字段|数据|信息|属性)[:：](.*?)(?:；|。|\n)/g,
    userActions: /(?:用户)?(?:点击|提交|选择|输入|删除|编辑)(.*?)(?:；|。|\n)/g,
    apiCalls: /(?:API|接口|请求|调用|后端)[:：]?(.*?)(?:；|。|\n)/g,
    validation: /(?:验证|校验|检查|格式)[:：]?(.*?)(?:；|。|\n)/g
  };

  private englishPatterns = {
    uiComponents: /(?:includes?|contains?|displays?|shows?|input|button|form|list|card|table)(.*?)(?:;|\.|\n)/gi,
    dataFields: /(?:fields?|data|information|properties?)[:：](.*?)(?:;|\.|\n)/gi,
    userActions: /(?:user\s)?(?:clicks?|submits?|selects?|enters?|deletes?|edits?)(.*?)(?:;|\.|\n)/gi,
    apiCalls: /(?:API|endpoint|request|calls?)[:：]?(.*?)(?:;|\.|\n)/gi,
    validation: /(?:validates?|checks?|verif(?:y|ies)|format)(.*?)(?:;|\.|\n)/gi
  };

  async extractComponents(content: string, language: 'zh' | 'en'): Promise<UIComponent[]> {
    // 直接使用更智能的默认组件提取
    // 因为正则匹配对于自然语言描述的节点内容效果不好
    return this.extractDefaultComponents(content, language);
  }

  async extractActions(content: string, language: 'zh' | 'en'): Promise<UserAction[]> {
    const patterns = language === 'zh' ? this.chinesePatterns : this.englishPatterns;
    const actions: UserAction[] = [];
    let match;
    let id = 0;

    const regex = new RegExp(patterns.userActions);
    while ((match = regex.exec(content)) !== null) {
      const actionText = match[0].trim();
      const action = this.parseAction(actionText, language, id++);
      if (action) {
        actions.push(action);
      }
    }

    return actions;
  }

  async extractDataModel(content: string, language: 'zh' | 'en'): Promise<DataField[]> {
    const patterns = language === 'zh' ? this.chinesePatterns : this.englishPatterns;
    const fields: DataField[] = [];
    let match;

    const regex = new RegExp(patterns.dataFields);
    while ((match = regex.exec(content)) !== null) {
      const fieldsText = match[1].trim();
      const parsedFields = this.parseDataFields(fieldsText, language);
      fields.push(...parsedFields);
    }

    return fields;
  }

  async extractAPICalls(content: string, language: 'zh' | 'en'): Promise<APICall[]> {
    const patterns = language === 'zh' ? this.chinesePatterns : this.englishPatterns;
    const apiCalls: APICall[] = [];
    let match;
    let id = 0;

    const regex = new RegExp(patterns.apiCalls);
    while ((match = regex.exec(content)) !== null) {
      const apiText = match[1].trim();
      const apiCall = this.parseAPICall(apiText, language, id++);
      if (apiCall) {
        apiCalls.push(apiCall);
      }
    }

    return apiCalls;
  }

  private parseComponent(text: string, language: 'zh' | 'en', id: number): UIComponent | null {
    const componentTypeMap = {
      zh: {
        '输入框': 'input',
        '按钮': 'button',
        '表单': 'form',
        '列表': 'list',
        '卡片': 'card',
        '表格': 'table',
        '导航': 'navigation',
        '头部': 'header',
        '底部': 'footer',
        '登录': 'form',
        '注册': 'form',
        '搜索': 'form',
        '商品': 'card',
        '产品': 'card',
        '用户': 'list',
        '订单': 'table',
        '数据': 'table'
      },
      en: {
        'input': 'input',
        'button': 'button',
        'form': 'form',
        'list': 'list',
        'card': 'card',
        'table': 'table',
        'navigation': 'navigation',
        'header': 'header',
        'footer': 'footer',
        'login': 'form',
        'register': 'form',
        'search': 'form',
        'product': 'card',
        'user': 'list',
        'order': 'table',
        'data': 'table'
      }
    };

    const typeMap = componentTypeMap[language];
    let componentType: any = 'card'; // default
    let name = text;
    let properties: any = {};

    // 识别组件类型
    for (const [key, value] of Object.entries(typeMap)) {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        componentType = value;
        name = text.trim();
        break;
      }
    }

    // 根据内容推断更多属性
    if (componentType === 'form' && text.includes(language === 'zh' ? '登录' : 'login')) {
      properties.fields = [
        { name: language === 'zh' ? '用户名' : 'username', type: 'text', required: true },
        { name: language === 'zh' ? '密码' : 'password', type: 'password', required: true }
      ];
    }

    if (componentType === 'input') {
      // 推断输入框类型
      if (text.includes(language === 'zh' ? '密码' : 'password')) {
        properties.inputType = 'password';
      } else if (text.includes(language === 'zh' ? '邮箱' : 'email')) {
        properties.inputType = 'email';
      } else if (text.includes(language === 'zh' ? '数字' : 'number')) {
        properties.inputType = 'number';
      } else {
        properties.inputType = 'text';
      }
    }

    return {
      id: `component-${id}`,
      type: componentType,
      name,
      properties
    };
  }

  private parseAction(text: string, language: 'zh' | 'en', id: number): UserAction | null {
    const triggerMap = {
      zh: {
        '点击': 'click',
        '提交': 'submit',
        '选择': 'change',
        '输入': 'change',
        '加载': 'load'
      },
      en: {
        'click': 'click',
        'submit': 'submit',
        'select': 'change',
        'enter': 'change',
        'load': 'load'
      }
    };

    const actionMap = {
      zh: {
        '跳转': 'navigate',
        '调用': 'api-call',
        '更新': 'update-data',
        '验证': 'validate',
        '提示': 'show-message'
      },
      en: {
        'navigate': 'navigate',
        'call': 'api-call',
        'update': 'update-data',
        'validate': 'validate',
        'show': 'show-message'
      }
    };

    let trigger: any = 'click';
    let action: any = 'navigate';

    const triggers = triggerMap[language];
    const actions = actionMap[language];

    for (const [key, value] of Object.entries(triggers)) {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        trigger = value;
        break;
      }
    }

    for (const [key, value] of Object.entries(actions)) {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        action = value;
        break;
      }
    }

    return {
      id: `action-${id}`,
      trigger,
      target: '',
      action
    };
  }

  private parseDataFields(text: string, language: 'zh' | 'en'): DataField[] {
    const fields: DataField[] = [];
    const fieldTexts = text.split(/[,，、]/);

    for (const fieldText of fieldTexts) {
      const trimmed = fieldText.trim();
      if (trimmed) {
        fields.push({
          name: this.convertToFieldName(trimmed, language),
          type: this.inferFieldType(trimmed, language),
          required: this.inferRequired(trimmed, language),
          validation: []
        });
      }
    }

    return fields;
  }

  private parseAPICall(text: string, language: 'zh' | 'en', id: number): APICall | null {
    const methodMap = {
      zh: {
        '获取': 'GET',
        '查询': 'GET',
        '提交': 'POST',
        '创建': 'POST',
        '更新': 'PUT',
        '修改': 'PUT',
        '删除': 'DELETE'
      },
      en: {
        'get': 'GET',
        'fetch': 'GET',
        'post': 'POST',
        'create': 'POST',
        'update': 'PUT',
        'put': 'PUT',
        'delete': 'DELETE'
      }
    };

    let method: any = 'GET';
    const methods = methodMap[language];

    for (const [key, value] of Object.entries(methods)) {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        method = value;
        break;
      }
    }

    return {
      id: `api-${id}`,
      method,
      endpoint: `/api/${this.extractEndpointName(text, language)}`,
      parameters: {}
    };
  }

  private extractDefaultComponents(content: string, language: 'zh' | 'en'): UIComponent[] {
    const components: UIComponent[] = [];
    let componentId = 0;
    
    // 更智能的内容分析
    const lines = content.split('\n');
    const contentLower = content.toLowerCase();
    
    // 检查用户相关功能
    if (contentLower.includes(language === 'zh' ? '注册' : 'register') || 
        contentLower.includes(language === 'zh' ? '用户注册' : 'user registration')) {
      components.push({
        id: `component-${componentId++}`,
        type: 'form',
        name: language === 'zh' ? '用户注册表单' : 'User Registration Form',
        properties: {
          fields: [
            { name: language === 'zh' ? '用户名' : 'username', type: 'text', required: true },
            { name: language === 'zh' ? '邮箱' : 'email', type: 'email', required: true },
            { name: language === 'zh' ? '密码' : 'password', type: 'password', required: true },
            { name: language === 'zh' ? '确认密码' : 'confirm password', type: 'password', required: true }
          ]
        }
      });
    }
    
    if (contentLower.includes(language === 'zh' ? '登录' : 'login') || 
        contentLower.includes(language === 'zh' ? '用户登录' : 'user login')) {
      components.push({
        id: `component-${componentId++}`,
        type: 'form',
        name: language === 'zh' ? '用户登录表单' : 'User Login Form',
        properties: {
          fields: [
            { name: language === 'zh' ? '用户名/邮箱' : 'username/email', type: 'text', required: true },
            { name: language === 'zh' ? '密码' : 'password', type: 'password', required: true }
          ]
        }
      });
    }
    
    if (contentLower.includes(language === 'zh' ? '密码重置' : 'password reset') || 
        contentLower.includes(language === 'zh' ? '忘记密码' : 'forgot password')) {
      components.push({
        id: `component-${componentId++}`,
        type: 'form',
        name: language === 'zh' ? '密码重置表单' : 'Password Reset Form',
        properties: {
          fields: [
            { name: language === 'zh' ? '邮箱' : 'email', type: 'email', required: true }
          ]
        }
      });
    }

    // 检查商品/产品相关功能
    if (contentLower.includes(language === 'zh' ? '商品' : 'product') || 
        contentLower.includes(language === 'zh' ? '产品' : 'product') ||
        contentLower.includes(language === 'zh' ? '列表' : 'list')) {
      components.push({
        id: `component-${componentId++}`,
        type: 'list',
        name: language === 'zh' ? '商品列表' : 'Product List',
        properties: {
          items: [
            { field: language === 'zh' ? '商品图片' : 'product image', type: 'image' },
            { field: language === 'zh' ? '商品名称' : 'product name', type: 'text' },
            { field: language === 'zh' ? '商品价格' : 'price', type: 'number' },
            { field: language === 'zh' ? '操作' : 'actions', type: 'buttons' }
          ]
        }
      });
    }
    
    // 检查用户资料相关
    if (contentLower.includes(language === 'zh' ? '资料' : 'profile') || 
        contentLower.includes(language === 'zh' ? '编辑' : 'edit')) {
      components.push({
        id: `component-${componentId++}`,
        type: 'form',
        name: language === 'zh' ? '用户资料编辑' : 'User Profile Edit',
        properties: {
          fields: [
            { name: language === 'zh' ? '昵称' : 'nickname', type: 'text' },
            { name: language === 'zh' ? '邮箱' : 'email', type: 'email' },
            { name: language === 'zh' ? '手机' : 'phone', type: 'tel' },
            { name: language === 'zh' ? '简介' : 'bio', type: 'textarea' }
          ]
        }
      });
    }

    // 如果还是没有组件，基于内容创建一个合适的默认组件
    if (components.length === 0) {
      // 分析内容中的列表项
      const hasListItems = lines.some(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
      
      if (hasListItems) {
        components.push({
          id: `component-${componentId++}`,
          type: 'list',
          name: language === 'zh' ? '功能列表' : 'Feature List',
          properties: {
            items: lines
              .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
              .map(line => line.replace(/^[-•]\s*/, '').trim())
          }
        });
      } else {
        // 默认卡片
        components.push({
          id: `component-${componentId++}`,
          type: 'card',
          name: lines[0] || (language === 'zh' ? '内容卡片' : 'Content Card'),
          properties: {
            content: content
          }
        });
      }
    }

    return components;
  }

  private convertToFieldName(text: string, language: 'zh' | 'en'): string {
    // 移除特殊字符，转换为合法的字段名
    const cleaned = text.replace(/[^\w\u4e00-\u9fa5]/g, '');
    
    // 如果是中文，尝试转换为拼音或保持原样
    if (language === 'zh') {
      // 这里应该使用拼音库，暂时简单处理
      return cleaned.toLowerCase();
    }
    
    return cleaned.replace(/\s+/g, '_').toLowerCase();
  }

  private inferFieldType(text: string, language: 'zh' | 'en'): 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' {
    const typeHints = {
      zh: {
        number: ['数量', '价格', '金额', '数字', '编号'],
        date: ['日期', '时间', '生日'],
        boolean: ['是否', '开关', '状态'],
        array: ['列表', '数组', '多个'],
        object: ['对象', '详情', '信息']
      },
      en: {
        number: ['number', 'price', 'amount', 'count', 'quantity'],
        date: ['date', 'time', 'birthday'],
        boolean: ['is', 'has', 'enabled', 'status'],
        array: ['list', 'array', 'multiple'],
        object: ['object', 'details', 'info']
      }
    };

    const hints = typeHints[language];
    const lowerText = text.toLowerCase();

    for (const [type, keywords] of Object.entries(hints)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return type as any;
      }
    }

    return 'string';
  }

  private inferRequired(text: string, language: 'zh' | 'en'): boolean {
    const requiredHints = language === 'zh' 
      ? ['必填', '必需', '必须', '需要']
      : ['required', 'mandatory', 'must', 'need'];
    
    return requiredHints.some(hint => text.toLowerCase().includes(hint));
  }

  private extractEndpointName(text: string, language: 'zh' | 'en'): string {
    // 简单提取端点名称
    const words = text.split(/\s+/);
    const relevantWord = words.find(word => 
      !['API', '接口', 'endpoint', 'call', '调用'].includes(word)
    );
    
    return relevantWord ? relevantWord.toLowerCase() : 'endpoint';
  }
}