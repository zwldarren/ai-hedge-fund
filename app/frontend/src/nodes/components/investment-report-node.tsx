import { type NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { useState } from 'react';

import { CardContent } from '@/components/ui/card';
import { useNodeContext } from '@/contexts/node-context';
import { useOutputNodeConnection } from '@/hooks/use-output-node-connection';
import { type InvestmentReportNode } from '../types';
import { InvestmentReportDialog } from './investment-report-dialog';
import { NodeShell } from './node-shell';
import { OutputNodeStatus } from './output-node-status';

export function InvestmentReportNode({
  data,
  selected,
  id,
  isConnectable,
}: NodeProps<InvestmentReportNode>) {  
  const { outputNodeData } = useNodeContext();
  const [showOutput, setShowOutput] = useState(false);
  
  // Use the custom hook for connection logic
  const { isProcessing, isOutputAvailable, isConnected, connectedAgentIds } = useOutputNodeConnection(id);
  const status = isProcessing ? 'IN_PROGRESS' : 'IDLE';

  const handleViewOutput = () => {
    setShowOutput(true);
  }

  return (
    <>
      <NodeShell
        id={id}
        selected={selected}
        isConnectable={isConnectable}
        icon={<FileText className="h-5 w-5" />}
        name={data.name || "Investment Report"}
        description={data.description}
        hasRightHandle={false}
        status={status}
      >
        <CardContent className="p-0">
          <div className="border-t border-border p-3">
            <div className="flex flex-col gap-2">
              <div className="text-subtitle text-muted-foreground flex items-center gap-1">
                Results
              </div>
              
              <OutputNodeStatus
                isProcessing={isProcessing}
                isOutputAvailable={isOutputAvailable}
                isConnected={isConnected}
                onViewOutput={handleViewOutput}
              />
            </div>
          </div>
        </CardContent>
      </NodeShell>
      <InvestmentReportDialog 
        isOpen={showOutput} 
        onOpenChange={setShowOutput} 
        outputNodeData={outputNodeData} 
        connectedAgentIds={connectedAgentIds}
      />
    </>
  );
}
