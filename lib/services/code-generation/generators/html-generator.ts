import { GeneratedPage, GenerationOptions } from '../types';
import { FlowStructure, PageStructure } from '../parsers/flow-analyzer';
import { pageTemplate } from '../templates/page-templates';

export class HTMLGenerator {
  async generatePages(
    flowStructure: FlowStructure,
    options: GenerationOptions
  ): Promise<GeneratedPage[]> {
    const pages: GeneratedPage[] = [];

    for (const pageStructure of flowStructure.pages) {
      const page = await this.generatePage(pageStructure, flowStructure, options);
      pages.push(page);
    }

    return pages;
  }

  private async generatePage(
    pageStructure: PageStructure,
    flowStructure: FlowStructure,
    options: GenerationOptions
  ): Promise<GeneratedPage> {
    const { node } = pageStructure;
    const pageName = this.sanitizeName(node.title);
    
    // 生成页面HTML
    const html = pageTemplate({
      id: node.id,
      title: node.title,
      components: node.components,
      language: options.language,
      styling: options.styling,
      navigation: this.generateNavigation(pageStructure, flowStructure, options),
      content: this.generateContent(node, options),
      scripts: this.generatePageScripts(pageStructure, options)
    });

    return {
      id: node.id,
      name: pageName,
      html,
      route: `/${pageName.toLowerCase()}`,
      components: node.components.map(c => c.id)
    };
  }

  private generateNavigation(
    pageStructure: PageStructure,
    flowStructure: FlowStructure,
    options: GenerationOptions
  ): string {
    const navItems: string[] = [];
    
    // 添加主页面链接
    for (const mainPageId of flowStructure.navigation.mainPages) {
      const page = flowStructure.pages.find(p => p.id === mainPageId);
      if (page) {
        const active = page.id === pageStructure.id ? 'active' : '';
        navItems.push(
          `<a href="/${this.sanitizeName(page.node.title).toLowerCase()}" class="nav-link ${active}">
            ${page.node.title}
          </a>`
        );
      }
    }

    return `
      <nav class="navigation">
        <div class="nav-brand">
          ${options.language === 'zh' ? '应用导航' : 'App Navigation'}
        </div>
        <div class="nav-items">
          ${navItems.join('\n')}
        </div>
      </nav>
    `;
  }

  private generateContent(node: any, options: GenerationOptions): string {
    const components: string[] = [];

    // 如果没有解析到组件，根据节点类型和内容生成默认组件
    if (node.components.length === 0) {
      // 基于节点标题和内容推断组件
      if (node.title.includes(options.language === 'zh' ? '登录' : 'login') || 
          node.content?.includes(options.language === 'zh' ? '登录' : 'login')) {
        components.push(this.generateLoginForm(node, options));
      } else if (node.title.includes(options.language === 'zh' ? '列表' : 'list') ||
                 node.content?.includes(options.language === 'zh' ? '列表' : 'list')) {
        components.push(this.generateDefaultList(node, options));
      } else if (node.title.includes(options.language === 'zh' ? '详情' : 'detail') ||
                 node.content?.includes(options.language === 'zh' ? '详情' : 'detail')) {
        components.push(this.generateDetailCard(node, options));
      } else {
        // 默认生成一个包含节点内容的卡片
        components.push(this.generateContentCard(node, options));
      }
    } else {
      // 使用解析到的组件
      for (const component of node.components) {
        components.push(this.generateComponent(component, options));
      }
    }

    return `
      <main class="main-content">
        <div class="container">
          <h1 class="page-title">${node.title}</h1>
          <div class="components-container">
            ${components.join('\n')}
          </div>
        </div>
      </main>
    `;
  }

  private generateLoginForm(node: any, options: GenerationOptions): string {
    return `
      <form class="form-component login-form">
        <h3>${options.language === 'zh' ? '用户登录' : 'User Login'}</h3>
        <div class="form-fields">
          <div class="form-group">
            <label for="username">${options.language === 'zh' ? '用户名' : 'Username'}</label>
            <input type="text" id="username" name="username" class="form-control" required 
              placeholder="${options.language === 'zh' ? '请输入用户名' : 'Enter username'}" />
          </div>
          <div class="form-group">
            <label for="password">${options.language === 'zh' ? '密码' : 'Password'}</label>
            <input type="password" id="password" name="password" class="form-control" required 
              placeholder="${options.language === 'zh' ? '请输入密码' : 'Enter password'}" />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" name="remember" />
              <span>${options.language === 'zh' ? '记住我' : 'Remember me'}</span>
            </label>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block">
          ${options.language === 'zh' ? '登录' : 'Login'}
        </button>
        <div class="form-footer">
          <a href="#" class="link">${options.language === 'zh' ? '忘记密码？' : 'Forgot password?'}</a>
        </div>
      </form>
    `;
  }

  private generateDefaultList(node: any, options: GenerationOptions): string {
    return `
      <div class="list-component">
        <h3>${node.title}</h3>
        <div class="list-items">
          ${[1, 2, 3, 4, 5].map(i => `
            <div class="list-item">
              <div class="list-item-content">
                <h4>${options.language === 'zh' ? `项目 ${i}` : `Item ${i}`}</h4>
                <p>${options.language === 'zh' ? `这是项目 ${i} 的描述信息` : `This is the description for item ${i}`}</p>
              </div>
              <div class="list-item-actions">
                <button class="btn btn-sm btn-default">
                  ${options.language === 'zh' ? '查看' : 'View'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private generateDetailCard(node: any, options: GenerationOptions): string {
    return `
      <div class="detail-card">
        <div class="card-header">
          <h3>${node.title}</h3>
        </div>
        <div class="card-body">
          <div class="detail-content">
            ${node.content ? `<p>${node.content}</p>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn btn-primary">
              ${options.language === 'zh' ? '编辑' : 'Edit'}
            </button>
            <button class="btn btn-default">
              ${options.language === 'zh' ? '返回' : 'Back'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private generateContentCard(node: any, options: GenerationOptions): string {
    return `
      <div class="content-card">
        <div class="card-body">
          <div class="content">
            ${node.content ? node.content.split('\n').map((line: string) => `<p>${line}</p>`).join('') : ''}
          </div>
        </div>
      </div>
    `;
  }

  private generateComponent(component: any, options: GenerationOptions): string {
    const componentGenerators: Record<string, (comp: any, opts: any) => string> = {
      form: this.generateForm,
      list: this.generateList,
      card: this.generateCard,
      button: this.generateButton,
      input: this.generateInput,
      table: this.generateTable,
      navigation: this.generateNav,
      header: this.generateHeader,
      footer: this.generateFooter
    };

    const generator = componentGenerators[component.type] || this.generateCard;
    return generator.call(this, component, options);
  }

  private generateForm(component: any, options: GenerationOptions): string {
    const fields = component.properties?.fields || [];
    let fieldsHtml = '';
    
    if (fields.length > 0) {
      fieldsHtml = fields.map((field: any) => `
        <div class="form-group">
          <label for="${component.id}-${field.name}">${field.name}</label>
          <input 
            type="${field.type}" 
            id="${component.id}-${field.name}" 
            name="${field.name}"
            class="form-control"
            ${field.required ? 'required' : ''}
            placeholder="${options.language === 'zh' ? `请输入${field.name}` : `Enter ${field.name}`}"
          />
        </div>
      `).join('');
    } else {
      // 如果没有预定义字段，根据名称推断
      if (component.name.includes(options.language === 'zh' ? '登录' : 'login')) {
        fieldsHtml = `
          <div class="form-group">
            <label for="${component.id}-username">${options.language === 'zh' ? '用户名' : 'Username'}</label>
            <input type="text" id="${component.id}-username" name="username" class="form-control" required 
              placeholder="${options.language === 'zh' ? '请输入用户名' : 'Enter username'}" />
          </div>
          <div class="form-group">
            <label for="${component.id}-password">${options.language === 'zh' ? '密码' : 'Password'}</label>
            <input type="password" id="${component.id}-password" name="password" class="form-control" required 
              placeholder="${options.language === 'zh' ? '请输入密码' : 'Enter password'}" />
          </div>
        `;
      }
    }
    
    return `
      <form id="${component.id}" class="form-component">
        <h3>${component.name}</h3>
        <div class="form-fields">
          ${fieldsHtml}
        </div>
        <button type="submit" class="btn btn-primary">
          ${options.language === 'zh' ? '提交' : 'Submit'}
        </button>
      </form>
    `;
  }

  private generateList(component: any, options: GenerationOptions): string {
    return `
      <div id="${component.id}" class="list-component">
        <h3>${component.name}</h3>
        <ul class="list">
          <li class="list-item">${options.language === 'zh' ? '列表项 1' : 'List Item 1'}</li>
          <li class="list-item">${options.language === 'zh' ? '列表项 2' : 'List Item 2'}</li>
          <li class="list-item">${options.language === 'zh' ? '列表项 3' : 'List Item 3'}</li>
        </ul>
      </div>
    `;
  }

  private generateCard(component: any, options: GenerationOptions): string {
    return `
      <div id="${component.id}" class="card-component">
        <div class="card-header">
          <h3>${component.name}</h3>
        </div>
        <div class="card-body">
          <p>${options.language === 'zh' ? '卡片内容' : 'Card content'}</p>
        </div>
      </div>
    `;
  }

  private generateButton(component: any, options: GenerationOptions): string {
    return `
      <button id="${component.id}" class="btn btn-default">
        ${component.name}
      </button>
    `;
  }

  private generateInput(component: any, options: GenerationOptions): string {
    return `
      <div class="input-group">
        <label for="${component.id}">${component.name}</label>
        <input id="${component.id}" type="text" class="form-input" />
      </div>
    `;
  }

  private generateTable(component: any, options: GenerationOptions): string {
    return `
      <div id="${component.id}" class="table-component">
        <h3>${component.name}</h3>
        <table class="table">
          <thead>
            <tr>
              <th>${options.language === 'zh' ? '列1' : 'Column 1'}</th>
              <th>${options.language === 'zh' ? '列2' : 'Column 2'}</th>
              <th>${options.language === 'zh' ? '列3' : 'Column 3'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${options.language === 'zh' ? '数据1' : 'Data 1'}</td>
              <td>${options.language === 'zh' ? '数据2' : 'Data 2'}</td>
              <td>${options.language === 'zh' ? '数据3' : 'Data 3'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  private generateNav(component: any, options: GenerationOptions): string {
    return this.generateCard(component, options);
  }

  private generateHeader(component: any, options: GenerationOptions): string {
    return `
      <header id="${component.id}" class="header-component">
        <h2>${component.name}</h2>
      </header>
    `;
  }

  private generateFooter(component: any, options: GenerationOptions): string {
    return `
      <footer id="${component.id}" class="footer-component">
        <p>${component.name}</p>
        <p>${options.language === 'zh' ? '© 2025 版权所有' : '© 2025 All rights reserved'}</p>
      </footer>
    `;
  }

  private generatePageScripts(pageStructure: PageStructure, options: GenerationOptions): string {
    const scripts: string[] = [];

    // 为每个用户动作生成脚本
    for (const action of pageStructure.node.actions) {
      scripts.push(`
        // ${action.id}
        document.addEventListener('${action.trigger}', function(e) {
          // ${options.language === 'zh' ? '处理动作' : 'Handle action'}: ${action.action}
          console.log('Action triggered:', '${action.action}');
        });
      `);
    }

    return scripts.join('\n');
  }

  private sanitizeName(name: string): string {
    return name
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);
  }
}