import { Flow } from '@/components/flow';
import { useFlowContext } from '@/contexts/flow-context';
import { useNodeContext } from '@/contexts/node-context';
import { useTabsContext } from '@/contexts/tabs-context';
import { clearAllNodeStates, setNodeInternalState, setCurrentFlowId as setNodeStateFlowId } from '@/hooks/use-node-state';
import { cn } from '@/lib/utils';
import { flowService } from '@/services/flow-service';
import { Flow as FlowType } from '@/types/flow';
import { useEffect } from 'react';

interface FlowTabContentProps {
  flow: FlowType;
  className?: string;
}

export function FlowTabContent({ flow, className }: FlowTabContentProps) {
  const { loadFlow } = useFlowContext();
  const { importNodeContextData, resetAllNodes } = useNodeContext();
  const { activeTabId } = useTabsContext();

  // Enhanced load function that restores both use-node-state and node context data
  const loadFlowWithCompleteState = async (flowToLoad: FlowType) => {
    try {
      // First, set the flow ID for node state isolation
      setNodeStateFlowId(flowToLoad.id.toString());
      
      // Clear all existing node states
      clearAllNodeStates();
      
      // Clear all node context data for current flow
      resetAllNodes();

      // Load the flow using the basic context function (handles React Flow state)
      await loadFlow(flowToLoad);

      // Then restore internal states for each node (use-node-state data)
      if (flowToLoad.nodes) {
        flowToLoad.nodes.forEach((node: any) => {
          if (node.data?.internal_state) {
            setNodeInternalState(node.id, node.data.internal_state);
          }
        });
      }
      
      // Finally, restore node context data (runtime data: agent status, messages, output data)
      if (flowToLoad.data?.nodeContextData) {
        importNodeContextData(flowToLoad.data.nodeContextData);
      }

      console.log('Flow tab loaded with complete state restoration:', flowToLoad.name);
    } catch (error) {
      console.error('Failed to load flow with complete state:', error);
      throw error;
    }
  };

  // Fetch the latest flow state when this tab becomes active
  useEffect(() => {
    const isThisTabActive = activeTabId === `flow-${flow.id}`;
    
    if (isThisTabActive) {
      const fetchAndLoadFlow = async () => {
        try {
          // Fetch the latest flow data from the backend
          const latestFlow = await flowService.getFlow(flow.id);
          // Load the fresh flow data with complete state restoration
          await loadFlowWithCompleteState(latestFlow);
        } catch (error) {
          console.error('Failed to fetch latest flow state:', error);
          // Fallback to loading the cached flow data with complete state restoration
          await loadFlowWithCompleteState(flow);
        }
      };

      fetchAndLoadFlow();
    }
  }, [activeTabId, flow.id, flow, loadFlow, importNodeContextData, resetAllNodes]);

  return (
    <div className={cn("h-full w-full", className)}>
      <Flow />
    </div>
  );
} 