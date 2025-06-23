import { BlobServiceClient, StorageSharedKeyCredential, ContainerClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

export interface FlowData {
  id: string;
  userId: string;
  name: string;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private initialized = false;

  constructor() {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'ideacanvas-flows';

    if (!accountName || !accountKey) {
      console.warn('Azure Storage credentials not configured');
      return;
    }

    try {
      const credential = new StorageSharedKeyCredential(accountName, accountKey);
      this.blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        credential
      );
      this.containerClient = this.blobServiceClient.getContainerClient(containerName);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Azure Storage:', error);
    }
  }

  /**
   * Ensure container exists
   */
  private async ensureContainer(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Azure Storage not initialized');
    }

    const exists = await this.containerClient.exists();
    if (!exists) {
      await this.containerClient.create({
        access: 'container', // Public read access for blobs
      });
    }
  }

  /**
   * Save flow data to Azure Blob Storage
   */
  async saveFlow(userId: string, flowData: Partial<FlowData>): Promise<FlowData> {
    await this.ensureContainer();

    const flow: FlowData = {
      id: flowData.id || uuidv4(),
      userId,
      name: flowData.name || `Flow ${new Date().toLocaleDateString()}`,
      nodes: flowData.nodes || [],
      edges: flowData.edges || [],
      createdAt: flowData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const blobName = `${userId}/${flow.id}.json`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    const content = JSON.stringify(flow, null, 2);
    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/json',
      },
      metadata: {
        userId,
        flowId: flow.id,
        name: flow.name,
      },
    });

    return flow;
  }

  /**
   * Get flow by ID
   */
  async getFlow(userId: string, flowId: string): Promise<FlowData | null> {
    await this.ensureContainer();

    const blobName = `${userId}/${flowId}.json`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    try {
      const downloadResponse = await blockBlobClient.download(0);
      const content = await this.streamToString(downloadResponse.readableStreamBody!);
      return JSON.parse(content);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all flows for a user
   */
  async listFlows(userId: string): Promise<FlowData[]> {
    await this.ensureContainer();

    const flows: FlowData[] = [];
    const prefix = `${userId}/`;

    // List blobs with prefix
    for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
      if (blob.name.endsWith('.json')) {
        const blockBlobClient = this.containerClient.getBlockBlobClient(blob.name);
        try {
          const downloadResponse = await blockBlobClient.download(0);
          const content = await this.streamToString(downloadResponse.readableStreamBody!);
          flows.push(JSON.parse(content));
        } catch (error) {
          console.error(`Failed to read flow ${blob.name}:`, error);
        }
      }
    }

    // Sort by updatedAt descending
    return flows.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Delete flow
   */
  async deleteFlow(userId: string, flowId: string): Promise<boolean> {
    await this.ensureContainer();

    const blobName = `${userId}/${flowId}.json`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    try {
      await blockBlobClient.delete();
      return true;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Convert stream to string
   */
  private async streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      readableStream.on('error', reject);
    });
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const azureStorageService = new AzureStorageService();