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
  const { loadFlow } = useFlowContext();
  const { activeTabId } = useTabsContext();

  // Load the flow when this tab becomes active (using the flow data already in the tab)
  useEffect(() => {
    const isThisTabActive = activeTabId === `flow-${flow.id}`;
    
    if (isThisTabActive) {
      // Load the flow data that's already in the tab (fresh data comes from handleOpenFlowInTab)
      loadFlow(flow);
    }
  }, [activeTabId, flow, loadFlow]);

  return (
    <div className={cn("h-full w-full", className)}>
      <Flow />
    </div>
  );
} 