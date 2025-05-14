import { type NodeProps } from '@xyflow/react';
import { Bot } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNodeContext } from '@/contexts/node-context';
import { type TextOutputNode } from '../types';
import { NodeShell } from './node-shell';

export function TextOutputNode({
  data,
  selected,
  id,
  isConnectable,
}: NodeProps<TextOutputNode>) {  
  const { outputNodeData, agentNodeData } = useNodeContext();
  const [showOutput, setShowOutput] = useState(false);
  
  const isOutputAvailable = !!outputNodeData && agentNodeData.output?.status === 'COMPLETE';

  const handleViewOutput = () => {
    setShowOutput(true);
  }

  const formatJSON = (json: any) => {
    return JSON.stringify(json, null, 2);
  }

  return (
    <>
      <NodeShell
        id={id}
        selected={selected}
        isConnectable={isConnectable}
        icon={<Bot className="h-5 w-5" />}
        name={data.name || "Output"}
        description={data.description}
        hasRightHandle={false}
      >
        <CardContent className="p-0">
          <div className="border-t border-border p-3">
            <div className="flex flex-col gap-2">
              <div className="text-subtitle text-muted-foreground flex items-center gap-1">
                Results
              </div>
              <div className="flex gap-2">
                <Button 
                  size="icon" 
                  variant="secondary"
                  className="w-full flex-shrink-0 transition-all duration-200 hover:bg-primary hover:text-primary-foreground active:scale-95"
                  onClick={handleViewOutput}
                  disabled={!isOutputAvailable}
                >
                 View Output
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </NodeShell>

      <Dialog open={showOutput} onOpenChange={setShowOutput}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis Results</DialogTitle>
          </DialogHeader>
          
          {outputNodeData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2">Trading Decisions</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  {formatJSON(outputNodeData.decisions)}
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-2">Analyst Signals</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  {formatJSON(outputNodeData.analyst_signals)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
