import { ModelSelector, type ModelItem } from '@/components/ui/llm-selector';
import { getConnectedEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { Bot, Loader2, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNodeContext } from '@/contexts/node-context';
import { api } from '@/services/api';
import { type TextInputNode } from '../types';
import { NodeShell } from './node-shell';

// Define models directly to avoid import path issues
const apiModels: ModelItem[] = [
  {
    "display_name": "claude-3.5-haiku",
    "model_name": "claude-3-5-haiku-latest",
    "provider": "Anthropic"
  },
  {
    "display_name": "claude-3.7-sonnet",
    "model_name": "claude-3-7-sonnet-latest",
    "provider": "Anthropic"
  },
  {
    "display_name": "deepseek-r1",
    "model_name": "deepseek-reasoner",
    "provider": "DeepSeek"
  },
  {
    "display_name": "deepseek-v3",
    "model_name": "deepseek-chat",
    "provider": "DeepSeek"
  },
  {
    "display_name": "gemini-2.0-flash",
    "model_name": "gemini-2.0-flash",
    "provider": "Gemini"
  },
  {
    "display_name": "gemini-2.5-pro",
    "model_name": "gemini-2.5-pro-exp-03-25",
    "provider": "Gemini"
  },
  {
    "display_name": "llama-4-scout-17b",
    "model_name": "meta-llama/llama-4-scout-17b-16e-instruct",
    "provider": "Groq"
  },
  {
    "display_name": "llama-4-maverick-17b",
    "model_name": "meta-llama/llama-4-maverick-17b-128e-instruct",
    "provider": "Groq"
  },
  {
    "display_name": "gpt-4.5",
    "model_name": "gpt-4.5-preview",
    "provider": "OpenAI"
  },
  {
    "display_name": "gpt-4o",
    "model_name": "gpt-4o",
    "provider": "OpenAI"
  },
  {
    "display_name": "o3",
    "model_name": "o3",
    "provider": "OpenAI"
  },
  {
    "display_name": "o4-mini",
    "model_name": "o4-mini",
    "provider": "OpenAI"
  }
];

// Find the GPT-4o model to use as default
const defaultModel = apiModels.find(model => model.model_name === "gpt-4o") || null;

export function TextInputNode({
  data,
  selected,
  id,
  isConnectable,
}: NodeProps<TextInputNode>) {
  const [tickers, setTickers] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(defaultModel);
  const nodeContext = useNodeContext();
  const { resetAllNodes, agentNodeData } = nodeContext;
  const { getNodes, getEdges } = useReactFlow();
  const abortControllerRef = useRef<(() => void) | null>(null);
  
  // Check if any agent is in progress
  const isProcessing = Object.values(agentNodeData).some(
    agent => agent.status === 'IN_PROGRESS'
  );
  
  // Clean up SSE connection on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current();
      }
    };
  }, []);
  
  const handleTickersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTickers(e.target.value);
  };

  const handlePlay = () => {
    // First, reset all nodes to IDLE
    resetAllNodes();
    
    // Clean up any existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current();
    }
    
    // Call the backend API with SSE
    const tickerList = tickers.split(',').map(t => t.trim());
    
    // Get the nodes and edges
    const nodes = getNodes();
    const edges = getEdges();
    const connectedEdges = getConnectedEdges(nodes, edges);
    
    // Get all nodes that are agents and are connected in the flow
    const selectedAgents = new Set<string>();
    
    // First, collect all the target node IDs from connected edges
    const connectedNodeIds = new Set<string>();
    connectedEdges.forEach(edge => {
      if (edge.source === id) {
        connectedNodeIds.add(edge.target);
      }
    });
    
    // Then filter for nodes that are agents
    nodes.forEach(node => {
      if (node.type === 'agent-node' && connectedNodeIds.has(node.id)) {
        selectedAgents.add(node.id);
      }
    });
        
    abortControllerRef.current = api.runHedgeFund(
      {
        tickers: tickerList,
        selected_agents: Array.from(selectedAgents),
        model_name: selectedModel?.model_name || undefined,
        model_provider: selectedModel?.provider as any || undefined,
      },
      // Pass the node status context to the API
      nodeContext
    );
  };

  return (
    <NodeShell
      id={id}
      selected={selected}
      isConnectable={isConnectable}
      icon={<Bot className="h-5 w-5" />}
      name={data.name || "Custom Component"}
      description={data.description}
      hasLeftHandle={false}
    >
      <CardContent className="p-0">
        <div className="border-t border-border p-3">
          <div className="flex flex-col gap-4">
            {/* Tickers Input */}
            <div className="flex flex-col gap-2">
              <div className="text-subtitle text-muted-foreground flex items-center gap-1">
                Tickers
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter tickers"
                  value={tickers}
                  onChange={handleTickersChange}
                />
                <Button 
                  size="icon" 
                  variant="secondary"
                  className="flex-shrink-0 transition-all duration-200 hover:bg-primary hover:text-primary-foreground active:scale-95"
                  onClick={handlePlay}
                  disabled={isProcessing || !tickers.trim()}
                >
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Model Selector */}
            <div className="flex flex-col gap-2">
              <div className="text-subtitle text-muted-foreground flex items-center gap-1">
                Model
              </div>
              <ModelSelector
                models={apiModels}
                value={selectedModel?.model_name || ""}
                onChange={setSelectedModel}
                placeholder="Select a model..."
              />
            </div>
          </div>
        </div>
      </CardContent>
    </NodeShell>
  );
}
