export const config = {
  openai: {
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  },
};

export function validateConfig() {
  if (!config.openai.apiKey) {
    throw new Error('AZURE_OPENAI_API_KEY is not set');
  }
  if (!config.openai.endpoint) {
    throw new Error('AZURE_OPENAI_ENDPOINT is not set');
  }
  if (!config.openai.deploymentName) {
    throw new Error('AZURE_OPENAI_DEPLOYMENT_NAME is not set');
  }
  if (!config.openai.apiVersion) {
    throw new Error('AZURE_OPENAI_API_VERSION is not set');
  }
}
