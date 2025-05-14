import { type NodeProps } from '@xyflow/react';
import { Bot } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { useNodeContext } from '@/contexts/node-context';
import { type TextOutputNode } from '../types';
import { NodeShell } from './node-shell';

export function TextOutputNode({
  data,
  selected,
  id,
  isConnectable,
}: NodeProps<TextOutputNode>) {
  const nodeStatusContext = useNodeContext();
  const { updateNode } = nodeStatusContext;
  
  const handleViewOutput = () => {
    console.log('View Output');
  }

  return (
    <NodeShell
      id={id}
      selected={selected}
      isConnectable={isConnectable}
      icon={<Bot className="h-5 w-5" />}
      name={data.name || "Custom Component"}
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
                disabled={false}
              >
               View Output
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </NodeShell>
  );
}
