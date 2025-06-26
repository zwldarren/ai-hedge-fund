import { Flow } from '@/components/flow';
import { useFlowContext } from '@/contexts/flow-context';
import { useTabsContext } from '@/contexts/tabs-context';
import { cn } from '@/lib/utils';
import { Flow as FlowType } from '@/types/flow';
import { useEffect } from 'react';

interface FlowTabContentProps {
  flow: FlowType;
  className?: string;
}

export function FlowTabContent({ flow, className }: FlowTabContentProps) {
  const { loadFlow, currentFlowId } = useFlowContext();
  const { activeTabId, openTab } = useTabsContext();

  // Load the flow when this tab becomes active (only if it's not already loaded)
  useEffect(() => {
    const isThisTabActive = activeTabId === `flow-${flow.id}`;
    const isFlowNotLoaded = currentFlowId !== flow.id;
    
    if (isThisTabActive && isFlowNotLoaded) {
      loadFlow(flow);
    }
  }, [activeTabId, flow, currentFlowId, loadFlow]);

  // Update the tab title if the flow name changes
  useEffect(() => {
    const isThisTabActive = activeTabId === `flow-${flow.id}`;
    if (isThisTabActive && currentFlowId === flow.id) {
      openTab({
        type: 'flow',
        title: flow.name,
        flow: flow,
        content: <FlowTabContent flow={flow} />,
      });
    }
  }, [flow.name, activeTabId, currentFlowId, flow, openTab]);

  return (
    <div className={cn("h-full w-full", className)}>
      <Flow />
    </div>
  );
} 