import connectDB from '@/lib/db/mongodb';
import Flow, { IFlow } from '@/lib/models/Flow';
import { CloudFlow } from './cloud-storage.service';

class MongoDBStorageService {
  /**
   * Ensure database connection
   */
  private async ensureConnection() {
    const conn = await connectDB();
    if (!conn) {
      throw new Error('MongoDB connection not available');
    }
    return conn;
  }

  /**
   * Convert MongoDB document to CloudFlow format
   */
  private toCloudFlow(doc: IFlow): CloudFlow {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      name: doc.name,
      nodes: doc.nodes,
      edges: doc.edges,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  /**
   * Save a new flow
   */
  async saveFlow(userId: string, flowData: {
    name?: string;
    nodes: any[];
    edges: any[];
    description?: string;
    metadata?: any;
  }): Promise<CloudFlow> {
    await this.ensureConnection();

    const flow = new Flow({
      userId,
      name: flowData.name || `Flow ${new Date().toLocaleDateString()}`,
      description: flowData.description,
      nodes: flowData.nodes,
      edges: flowData.edges,
      metadata: flowData.metadata,
    });

    const savedFlow = await flow.save();
    return this.toCloudFlow(savedFlow);
  }

  /**
   * Update an existing flow
   */
  async updateFlow(userId: string, flowId: string, updates: {
    name?: string;
    nodes?: any[];
    edges?: any[];
    description?: string;
    metadata?: any;
  }): Promise<CloudFlow | null> {
    await this.ensureConnection();

    const flow = await Flow.findOneAndUpdate(
      { _id: flowId, userId },
      { 
        $set: {
          ...updates,
          updatedAt: new Date(),
        }
      },
      { new: true }
    );

    return flow ? this.toCloudFlow(flow) : null;
  }

  /**
   * Get a flow by ID
   */
  async getFlow(userId: string, flowId: string): Promise<CloudFlow | null> {
    await this.ensureConnection();

    const flow = await Flow.findOne({ _id: flowId, userId });
    return flow ? this.toCloudFlow(flow) : null;
  }

  /**
   * List all flows for a user
   */
  async listFlows(userId: string, limit = 50): Promise<CloudFlow[]> {
    await this.ensureConnection();

    const flows = await Flow.findRecentFlows(userId, limit);
    return flows.map((flow: IFlow) => this.toCloudFlow(flow));
  }

  /**
   * Delete a flow
   */
  async deleteFlow(userId: string, flowId: string): Promise<boolean> {
    await this.ensureConnection();

    const result = await Flow.deleteOne({ _id: flowId, userId });
    return result.deletedCount > 0;
  }

  /**
   * Search flows by name or description
   */
  async searchFlows(userId: string, query: string): Promise<CloudFlow[]> {
    await this.ensureConnection();

    const flows = await Flow.find({
      userId,
      $text: { $search: query }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(20);

    return flows.map((flow: IFlow) => this.toCloudFlow(flow));
  }

  /**
   * Get flows by tags
   */
  async getFlowsByTags(userId: string, tags: string[]): Promise<CloudFlow[]> {
    await this.ensureConnection();

    const flows = await Flow.find({
      userId,
      'metadata.tags': { $in: tags }
    }).sort({ updatedAt: -1 });

    return flows.map((flow: IFlow) => this.toCloudFlow(flow));
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const conn = await connectDB();
      return conn !== null;
    } catch {
      return false;
    }
  }
}

export const mongoDBStorageService = new MongoDBStorageService();