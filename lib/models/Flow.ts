import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IFlow extends Document {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  metadata?: {
    language?: string;
    generatedFrom?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const FlowSchema = new Schema<IFlow>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    nodes: {
      type: Array,
      default: [],
      required: true,
    },
    edges: {
      type: Array,
      default: [],
      required: true,
    },
    metadata: {
      language: {
        type: String,
        default: 'en',
      },
      generatedFrom: {
        type: String,
      },
      tags: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    collection: 'flows',
  }
);

// Compound index for efficient user queries
FlowSchema.index({ userId: 1, updatedAt: -1 });
FlowSchema.index({ userId: 1, createdAt: -1 });

// Text index for search functionality
FlowSchema.index({ name: 'text', description: 'text' });

// Define interface for static methods
interface IFlowModel extends Model<IFlow> {
  findByUserId(userId: string): Promise<IFlow[]>;
  findRecentFlows(userId: string, limit?: number): Promise<IFlow[]>;
}

// Static methods
FlowSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ updatedAt: -1 });
};

FlowSchema.statics.findRecentFlows = function(userId: string, limit = 10) {
  return this.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(limit);
};

// Instance methods
FlowSchema.methods.updateContent = function(nodes: any[], edges: any[]) {
  this.nodes = nodes;
  this.edges = edges;
  return this.save();
};

// Prevent model recompilation in development
const Flow = (mongoose.models.Flow as IFlowModel) || mongoose.model<IFlow, IFlowModel>('Flow', FlowSchema);

export default Flow;