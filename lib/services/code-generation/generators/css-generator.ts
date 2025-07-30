import { StyleSheet, GenerationOptions } from '../types';
import { FlowStructure } from '../parsers/flow-analyzer';

export class CSSGenerator {
  async generateStyles(
    flowStructure: FlowStructure,
    options: GenerationOptions
  ): Promise<StyleSheet[]> {
    const styles: StyleSheet[] = [];

    // 生成主样式文件
    const mainStyles = await this.generateMainStyles(options);
    styles.push({
      name: 'styles.css',
      content: mainStyles
    });

    // 如果使用自定义样式，生成组件样式
    if (options.styling === 'custom') {
      const componentStyles = await this.generateComponentStyles(flowStructure, options);
      styles.push({
        name: 'components.css',
        content: componentStyles
      });
    }

    return styles;
  }

  private async generateMainStyles(options: GenerationOptions): Promise<string> {
    const baseStyles = this.getBaseStyles(options);
    const layoutStyles = this.getLayoutStyles(options);
    const componentBaseStyles = this.getComponentBaseStyles(options);

    return `${baseStyles}\n${layoutStyles}\n${componentBaseStyles}`;
  }

  private getBaseStyles(options: GenerationOptions): string {
    if (options.styling === 'tailwind') {
      return `
/* Tailwind CSS will be included via CDN */
@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
      `;
    }

    if (options.styling === 'bootstrap') {
      return `
/* Bootstrap CSS will be included via CDN */
@import url('https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css');
      `;
    }

    // Custom styles
    return `
/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #3b82f6;
  --secondary-color: #6b7280;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;
  --light-color: #f3f4f6;
  --dark-color: #111827;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

body {
  font-family: var(--font-family);
  line-height: 1.6;
  color: var(--dark-color);
  background-color: #ffffff;
}

h1, h2, h3, h4, h5, h6 {
  margin-bottom: 1rem;
  font-weight: 600;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
    `;
  }

  private getLayoutStyles(options: GenerationOptions): string {
    if (options.styling !== 'custom') {
      return '';
    }

    return `
/* Layout Styles */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.navigation {
  background-color: var(--dark-color);
  color: white;
  padding: 1rem 0;
  margin-bottom: 2rem;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
  display: inline-block;
  margin-right: 2rem;
}

.nav-items {
  display: inline-flex;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  text-decoration: none;
}

.nav-link.active {
  background-color: var(--primary-color);
}

.main-content {
  padding: 2rem 0;
}

.components-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}
    `;
  }

  private getComponentBaseStyles(options: GenerationOptions): string {
    if (options.styling !== 'custom') {
      return '';
    }

    return `
/* Component Base Styles */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn-default {
  background-color: var(--light-color);
  color: var(--dark-color);
  border: 1px solid #e5e7eb;
}

.btn-default:hover {
  background-color: #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.form-component {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto;
}

.form-component h3 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: var(--dark-color);
}

.form-fields {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-control,
.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: all 0.15s;
}

.form-control:focus,
.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control::placeholder,
.form-input::placeholder {
  color: #9ca3af;
}

.card-component {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1rem 1.5rem;
  background-color: var(--light-color);
  border-bottom: 1px solid #e5e7eb;
}

.card-body {
  padding: 1.5rem;
}

.list-component {
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list {
  list-style: none;
  margin-top: 1rem;
}

.list-item {
  padding: 0.75rem;
  border-bottom: 1px solid var(--light-color);
}

.list-item:last-child {
  border-bottom: none;
}

.table-component {
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.table th,
.table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--light-color);
}

.table th {
  font-weight: 600;
  background-color: var(--light-color);
}

.header-component {
  margin-bottom: 2rem;
}

.footer-component {
  margin-top: 4rem;
  padding: 2rem 0;
  border-top: 1px solid var(--light-color);
  text-align: center;
  color: var(--secondary-color);
}

/* Page Layout */
.page-title {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--dark-color);
}

/* Enhanced Form Styles */
.login-form {
  max-width: 360px;
}

.btn-block {
  width: 100%;
  display: block;
}

.form-footer {
  text-align: center;
  margin-top: 1rem;
}

.link {
  color: var(--primary-color);
  font-size: 0.875rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.checkbox-label input {
  margin-right: 0.5rem;
}

/* List Styles */
.list-items {
  space-y: 0.75rem;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
}

.list-item:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.list-item-content h4 {
  margin-bottom: 0.25rem;
  color: var(--dark-color);
}

.list-item-content p {
  color: var(--secondary-color);
  font-size: 0.875rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

/* Detail Card Styles */
.detail-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-content {
  margin-bottom: 1.5rem;
  line-height: 1.8;
}

.card-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Content Card */
.content-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.content-card .content p {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: #4b5563;
}
    `;
  }

  private async generateComponentStyles(
    flowStructure: FlowStructure,
    options: GenerationOptions
  ): Promise<string> {
    const componentStyles: string[] = [];

    // 为每个页面的组件生成特定样式
    for (const page of flowStructure.pages) {
      for (const component of page.node.components) {
        const style = this.generateComponentStyle(component, options);
        if (style) {
          componentStyles.push(style);
        }
      }
    }

    return componentStyles.join('\n\n');
  }

  private generateComponentStyle(component: any, options: GenerationOptions): string {
    // 这里可以根据组件的特定属性生成自定义样式
    if (component.properties && Object.keys(component.properties).length > 0) {
      return `
/* Custom styles for ${component.id} */
#${component.id} {
  /* Component-specific styles */
}
      `;
    }

    return '';
  }
}