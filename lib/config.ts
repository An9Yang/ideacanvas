import { useSettingsStore } from './stores/settings-store';

export const config = {
  openai: {
    get apiKey() {
      return useSettingsStore.getState().openAIKey;
    },
    get endpoint() {
      return 'https://y7948-m7dkvj9c-swedencentral.openai.azure.com/';
    },
    get deploymentName() {
      return 'gpt-4.5-preview';
    },
    get apiVersion() {
      return '2024-04-01-preview';
    },
    get modelName() {
      return 'gpt-4.5-preview';
    }
  }
};

export function validateConfig() {
  if (!config.openai.apiKey) {
    throw new Error('请在设置中添加您的Azure OpenAI API密钥后再继续。');
  }
  return true;
}