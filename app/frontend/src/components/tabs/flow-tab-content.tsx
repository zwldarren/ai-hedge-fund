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

  // Load the flow when this tab becomes active (always load to ensure consistency)
  useEffect(() => {
    const isThisTabActive = activeTabId === `flow-${flow.id}`;
    
    if (isThisTabActive) {
      // Always load the flow when this tab is active to ensure proper state
      // This handles cases where we switch from non-flow tabs (like Settings)
      loadFlow(flow);
    }
  }, [activeTabId, flow, loadFlow]);

  return (
    <div className={cn("h-full w-full", className)}>
      <Flow />
    </div>
  );
} 