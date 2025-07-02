import { useNodeContext } from '@/contexts/node-context';
import { getConnectedEdges, useReactFlow } from '@xyflow/react';

interface UseOutputNodeConnectionResult {
  isConnected: boolean;
  isProcessing: boolean;
  isOutputAvailable: boolean;
  connectedAgentIds: Set<string>;
}

/**
 * Custom hook to manage output node connection state and availability
 * 
 * This hook encapsulates all the logic needed for output nodes to:
 * - Check if they're connected to the portfolio manager through agent nodes
 * - Show "Processing..." only when connected agents are running
 * - Show output data only when connected and data is available
 * 
 * @param nodeId - The ID of the output node
 * @returns Object containing connection state, processing status, and output availability
 * 
 * @example
 * ```typescript
 * // In any output node component:
 * export function MyOutputNode({ id, ...props }: NodeProps<MyOutputNode>) {
 *   const { outputNodeData } = useNodeContext();
 *   const { isProcessing, isOutputAvailable } = useOutputNodeConnection(id);
 *   
 *   return (
 *     <NodeShell {...props}>
 *       {isProcessing ? (
 *         <Button disabled>Processing...</Button>
 *       ) : (
 *         <Button disabled={!isOutputAvailable}>View Output</Button>
 *       )}
 *     </NodeShell>
 *   );
 * }
 * ```
 */
export function useOutputNodeConnection(nodeId: string): UseOutputNodeConnectionResult {
  const { outputNodeData, agentNodeData } = useNodeContext();
  const { getNodes, getEdges } = useReactFlow();
  
  // Get all agent IDs that are connected to this output node through the portfolio manager
  const getConnectedAgentIds = (): Set<string> => {
    const nodes = getNodes();
    const edges = getEdges();
    const connectedEdges = getConnectedEdges(nodes, edges);
    
    // Find the portfolio manager node
    const portfolioManagerNode = nodes.find(node => node.type === 'portfolio-manager-node');
    if (!portfolioManagerNode) return new Set<string>();
    
    // Get all agents directly connected to portfolio manager
    const portfolioConnectedAgentIds = new Set<string>();
    connectedEdges.forEach(edge => {
      if (edge.source === portfolioManagerNode.id) {
        const targetNode = nodes.find(node => node.id === edge.target);
        if (targetNode?.type === 'agent-node') {
          portfolioConnectedAgentIds.add(edge.target);
        }
      }
    });
    
    // Filter to only agents that also connect to this output node
    const agentsConnectedToThisOutput = new Set<string>();
    connectedEdges.forEach(edge => {
      if (edge.target === nodeId) {
        const sourceNode = nodes.find(node => node.id === edge.source);
        if (sourceNode?.type === 'agent-node' && portfolioConnectedAgentIds.has(edge.source)) {
          agentsConnectedToThisOutput.add(edge.source);
        }
      }
    });
    
    return agentsConnectedToThisOutput;
  };
  
  const connectedAgentIds = getConnectedAgentIds();
  
  // Check if this node is connected to the portfolio manager (has connected agents)
  const isConnected = connectedAgentIds.size > 0;
  
  // Check if any connected agent is in progress
  const isProcessing = Array.from(connectedAgentIds).some(agentId => 
    agentNodeData[agentId]?.status === 'IN_PROGRESS'
  );
  
  // Only show as available if connected to portfolio manager AND has output data
  const isOutputAvailable = !!outputNodeData && isConnected;
  
  return {
    isConnected,
    isProcessing,
    isOutputAvailable,
    connectedAgentIds,
  };
} 