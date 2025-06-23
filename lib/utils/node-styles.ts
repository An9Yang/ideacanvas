import { NodeType } from '@/lib/types/flow';

/**
 * Get node style based on node type
 */
export function getNodeStyle(type: NodeType): string {
  const styles: Record<NodeType, string> = {
    external: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
    context: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    guide: 'border-green-500 bg-green-50 dark:bg-green-950',
    document: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950',
    product: 'border-white bg-background'
  };
  
  return styles[type] || styles.product;
}

/**
 * Get handle style based on node type
 */
export function getHandleStyle(type: NodeType): React.CSSProperties {
  const colors: Record<NodeType, string> = {
    external: '#3b82f6', // blue-500
    context: '#eab308', // yellow-500
    guide: '#22c55e', // green-500
    document: '#10b981', // emerald-500
    product: 'var(--primary)'
  };
  
  return {
    backgroundColor: colors[type] || colors.product
  };
}