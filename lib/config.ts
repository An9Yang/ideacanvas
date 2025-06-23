import { useSettingsStore } from './stores/settings-store';
import { configService, AI_CONFIG, APP_CONFIG, COMMON_EXTERNAL_SERVICES, NODE_TYPES, NODE_COLORS } from './config/index';

// Re-export from config/index for backward compatibility
export { configService, AI_CONFIG, APP_CONFIG, COMMON_EXTERNAL_SERVICES, NODE_TYPES, NODE_COLORS };

/**
 * Legacy config object for backward compatibility
 * @deprecated Use configService from './config/index' instead
 */
export const config = {
  openai: {
    get apiKey() {
      return useSettingsStore.getState().openAIKey || process.env.AZURE_OPENAI_API_KEY || '';
    },
    get endpoint() {
      return configService.getAzureConfig().endpoint;
    },
    get deploymentName() {
      return configService.getAzureConfig().deploymentName;
    },
    get apiVersion() {
      return configService.getAzureConfig().apiVersion;
    },
    get modelName() {
      return configService.getAzureConfig().deploymentName;
    }
  }
};

export function validateConfig() {
  const validation = configService.validateConfig();
  if (!validation.isValid) {
    throw new Error(validation.errors.join('; '));
  }
  return true;
}