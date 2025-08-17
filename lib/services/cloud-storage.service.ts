export interface CloudFlow {
  id: string;
  userId: string;
  name: string;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

class CloudStorageService {
  private userId = 'default-user'; // TODO: Get from auth
  private baseUrl = '/api/flows';

  /**
   * Set user ID for requests
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Save flow via API
   */
  async saveFlow(flow: { name?: string; nodes: any[]; edges: any[] }): Promise<CloudFlow> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          ...flow,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save flow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to save flow:', error);
      // Fallback to local-only flow
      return this.generateLocalFlow(flow);
    }
  }

  /**
   * Update existing flow
   */
  async updateFlow(id: string, flow: { name?: string; nodes?: any[]; edges?: any[] }): Promise<CloudFlow> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          ...flow,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update flow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update flow:', error);
      throw error;
    }
  }

  /**
   * Get flow by ID
   */
  async getFlow(id: string): Promise<CloudFlow | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}?userId=${this.userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get flow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get flow:', error);
      return null;
    }
  }

  /**
   * List all flows
   */
  async listFlows(): Promise<CloudFlow[]> {
    try {
      const response = await fetch(`${this.baseUrl}?userId=${this.userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to list flows: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to list flows:', error);
      return [];
    }
  }

  /**
   * Delete flow
   */
  async deleteFlow(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}?userId=${this.userId}`, {
        method: 'DELETE',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to delete flow:', error);
      return false;
    }
  }

  /**
   * Check if cloud storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate a local-only flow (fallback)
   */
  private generateLocalFlow(flow: { name?: string; nodes: any[]; edges: any[] }): CloudFlow {
    return {
      id: `local-${Date.now()}`,
      userId: this.userId,
      name: flow.name || `Flow ${new Date().toLocaleDateString()}`,
      nodes: flow.nodes,
      edges: flow.edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const cloudStorageService = new CloudStorageService();