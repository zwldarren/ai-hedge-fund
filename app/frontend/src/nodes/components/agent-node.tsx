import { type NodeProps } from '@xyflow/react';
import { Bot } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CardContent } from '@/components/ui/card';
import { ModelSelector } from '@/components/ui/llm-selector';
import { useNodeContext } from '@/contexts/node-context';
import { apiModels, ModelItem } from '@/data/models';
import { cn } from '@/lib/utils';
import { type AgentNode } from '../types';
import { getStatusColor } from '../utils';
import { AgentOutputDialog } from './agent-output-dialog';
import { NodeShell } from './node-shell';

// Default model - gpt-4o as requested
const DEFAULT_MODEL: ModelItem = {
  model_name: 'gpt-4o',
  provider: 'OpenAI',
  display_name: 'GPT-4o'
};

export function AgentNode({
  data,
  selected,
  id,
  isConnectable,
}: NodeProps<AgentNode>) {
  const { agentNodeData, setAgentModel, getAgentModel } = useNodeContext();
  const nodeData = agentNodeData[id] || { 
    status: 'IDLE', 
    ticker: null, 
    message: '', 
    messages: [],
    lastUpdated: 0
  };
  const status = nodeData.status;
  const isInProgress = status === 'IN_PROGRESS';
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get the current model for this agent, or use default
  const currentModel = getAgentModel(id) || DEFAULT_MODEL;
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(currentModel);

  // Update the node context when the model changes
  useEffect(() => {
    if (selectedModel) {
      setAgentModel(id, selectedModel);
    }
  }, [selectedModel, id, setAgentModel]);

  // Initialize with default model if none is set
  useEffect(() => {
    if (!getAgentModel(id)) {
      setAgentModel(id, DEFAULT_MODEL);
      setSelectedModel(DEFAULT_MODEL);
    }
  }, [id, getAgentModel, setAgentModel]);

  const handleModelChange = (model: ModelItem | null) => {
    setSelectedModel(model);
  };

  return (
    <NodeShell
      id={id}
      selected={selected}
      isConnectable={isConnectable}
      icon={<Bot className="h-5 w-5" />}
      iconColor={getStatusColor(status)}
      name={data.name || "Agent"}
      description={data.description}
      status={status}
    >
      <CardContent className="p-0">
        <div className="border-t border-border p-3">
          <div className="flex flex-col gap-2">
            <div className="text-subtitle text-muted-foreground flex items-center gap-1">
              Status
            </div>

            <div className={cn(
              "text-foreground text-xs rounded p-2",
              isInProgress ? "gradient-animation" : getStatusColor(status)
            )}>
              <span className="capitalize">{status.toLowerCase().replace(/_/g, ' ')}</span>
            </div>
            
            {nodeData.message && (
              <div className="text-foreground text-subtitle">
                {nodeData.message}
                {nodeData.ticker && <span className="ml-1">({nodeData.ticker})</span>}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <div className="text-subtitle text-muted-foreground flex items-center gap-1">
                Model
              </div>
              <ModelSelector
                models={apiModels}
                value={selectedModel?.model_name || ""}
                onChange={handleModelChange}
                placeholder="Select a model..."
              />
            </div>
          </div>
        </div>
        <AgentOutputDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          name={data.name || "Agent"}
          nodeId={id}
        />
      </CardContent>
    </NodeShell>
  );
}
