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
  private baseUrl = '/api/flows';
  private userId = 'default-user'; // TODO: Get from auth

  /**
   * Set user ID for requests
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Get headers for requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-user-id': this.userId,
    };
  }

  /**
   * Save flow to cloud
   */
  async saveFlow(flow: { name?: string; nodes: any[]; edges: any[] }): Promise<CloudFlow> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(flow),
      });

      if (!response.ok) {
        throw new Error(`Failed to save flow: ${response.statusText}`);
      }

      const data = await response.json();
      return data.flow;
    } catch (error) {
      console.error('Failed to save flow to cloud:', error);
      throw error;
    }
  }

  /**
   * Update existing flow
   */
  async updateFlow(id: string, flow: { name?: string; nodes?: any[]; edges?: any[] }): Promise<CloudFlow> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(flow),
      });

      if (!response.ok) {
        throw new Error(`Failed to update flow: ${response.statusText}`);
      }

      const data = await response.json();
      return data.flow;
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
      const response = await fetch(`${this.baseUrl}/${id}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get flow: ${response.statusText}`);
      }

      const data = await response.json();
      return data.flow;
    } catch (error) {
      console.error('Failed to get flow:', error);
      throw error;
    }
  }

  /**
   * List all flows
   */
  async listFlows(): Promise<CloudFlow[]> {
    try {
      const response = await fetch(this.baseUrl, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to list flows: ${response.statusText}`);
      }

      const data = await response.json();
      return data.flows || [];
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
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        throw new Error(`Failed to delete flow: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete flow:', error);
      throw error;
    }
  }

  /**
   * Check if cloud storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'HEAD',
        headers: this.getHeaders(),
      });
      return response.ok || response.status === 405; // HEAD might not be allowed
    } catch {
      return false;
    }
  }
}

export const cloudStorageService = new CloudStorageService();