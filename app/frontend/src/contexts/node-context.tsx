import { LanguageModel } from '@/data/models';
import { getCurrentFlowId } from '@/hooks/use-node-state';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

export type NodeStatus = 'IDLE' | 'IN_PROGRESS' | 'COMPLETE' | 'ERROR';

// Message history item
export interface MessageItem {
  timestamp: string;
  message: string;
  ticker: string | null;
  analysis: Record<string, string>;
}

// Agent node state structure
export interface AgentNodeData {
  status: NodeStatus;
  ticker: string | null;
  message: string;
  lastUpdated: number;
  messages: MessageItem[];
  timestamp?: string;
  analysis: string | null;
}

// Data structure for the output node data (from complete event)
export interface OutputNodeData {
  decisions: Record<string, any>;
  analyst_signals: Record<string, any>;
}

// Default agent node state
const DEFAULT_AGENT_NODE_STATE: AgentNodeData = {
  status: 'IDLE',
  ticker: null,
  message: '',
  messages: [],
  lastUpdated: Date.now(),
  analysis: null,
};

// Helper function to create flow-aware composite keys
function createCompositeKey(nodeId: string): string {
  const flowId = getCurrentFlowId();
  return flowId ? `${flowId}:${nodeId}` : nodeId;
}

interface NodeContextType {
  agentNodeData: Record<string, AgentNodeData>;
  outputNodeData: OutputNodeData | null;
  agentModels: Record<string, LanguageModel | null>;
  updateAgentNode: (nodeId: string, data: Partial<AgentNodeData> | NodeStatus) => void;
  updateAgentNodes: (nodeIds: string[], status: NodeStatus) => void;
  setOutputNodeData: (data: OutputNodeData) => void;
  setAgentModel: (nodeId: string, model: LanguageModel | null) => void;
  getAgentModel: (nodeId: string) => LanguageModel | null;
  getAllAgentModels: () => Record<string, LanguageModel | null>;
  resetAllNodes: () => void;
  exportNodeContextData: () => {
    agentNodeData: Record<string, AgentNodeData>;
    outputNodeData: OutputNodeData | null;
  };
  importNodeContextData: (data: {
    agentNodeData?: Record<string, AgentNodeData>;
    outputNodeData?: OutputNodeData | null;
  }) => void;
}

const NodeContext = createContext<NodeContextType | undefined>(undefined);

export function NodeProvider({ children }: { children: ReactNode }) {
  // Use composite keys for flow-aware agent node data storage
  const [agentNodeData, setAgentNodeData] = useState<Record<string, AgentNodeData>>({});
  // Flow-aware output node data storage
  const [outputNodeData, setOutputNodeData] = useState<Record<string, OutputNodeData>>({});
  // Agent models also need to be flow-aware to maintain model selections per flow
  const [agentModels, setAgentModels] = useState<Record<string, LanguageModel | null>>({});

  const updateAgentNode = useCallback((nodeId: string, data: Partial<AgentNodeData> | NodeStatus) => {
    const compositeKey = createCompositeKey(nodeId);
    
    // Handle string status shorthand (just passing a status string)
    if (typeof data === 'string') {
      setAgentNodeData(prev => {
        const existingNode = prev[compositeKey] || { ...DEFAULT_AGENT_NODE_STATE };
        return {
          ...prev,
          [compositeKey]: {
            ...existingNode,
            status: data,
            lastUpdated: Date.now()
          }
        };
      });
      return;
    }

    // Handle data object - full update
    setAgentNodeData(prev => {
      const existingNode = prev[compositeKey] || { ...DEFAULT_AGENT_NODE_STATE };
      const newMessages = [...existingNode.messages];
      
      // Add message to history if it's new based on timestamp
      if (data.message && data.timestamp !== existingNode.timestamp) {
        // Get the reasoning for the current ticker if available
        const ticker = data.ticker || null;

        const messageItem: MessageItem = {
          timestamp: data.timestamp || new Date().toISOString(),
          message: data.message,
          ticker: ticker,
          analysis: {} as Record<string, string>,
        }

        // Add analysis for ticker to messageItem if ticker is not null
        if (ticker && data.analysis) {
          messageItem.analysis[ticker] = data.analysis;
        }

        newMessages.push(messageItem);
      }
      
      return {
        ...prev,
        [compositeKey]: {
          ...existingNode,
          ...data,
          messages: newMessages,
          lastUpdated: Date.now()
        }
      };
    });
  }, []);

  const updateAgentNodes = useCallback((nodeIds: string[], status: NodeStatus) => {
    if (nodeIds.length === 0) return;
    
    setAgentNodeData(prev => {
      const newStates = { ...prev };
      
      nodeIds.forEach(id => {
        const compositeKey = createCompositeKey(id);
        newStates[compositeKey] = {
          ...(newStates[compositeKey] || { ...DEFAULT_AGENT_NODE_STATE }),
          status,
          lastUpdated: Date.now()
        };
      });
      
      return newStates;
    });
  }, []);

  const setAgentModel = useCallback((nodeId: string, model: LanguageModel | null) => {
    const compositeKey = createCompositeKey(nodeId);
    
    setAgentModels(prev => {
      if (model === null) {
        // Remove the agent model if setting to null
        const { [compositeKey]: removed, ...rest } = prev;
        return rest;
      } else {
        // Set the agent model
        return {
          ...prev,
          [compositeKey]: model
        };
      }
    });
  }, []);

  const getAgentModel = useCallback((nodeId: string): LanguageModel | null => {
    const compositeKey = createCompositeKey(nodeId);
    return agentModels[compositeKey] || null;
  }, [agentModels]);

  const getAllAgentModels = useCallback((): Record<string, LanguageModel | null> => {
    // Return only models for the current flow
    const currentFlowId = getCurrentFlowId();
    if (!currentFlowId) {
      // If no flow ID, return models without flow prefix (backward compatibility)
      return Object.fromEntries(
        Object.entries(agentModels).filter(([key]) => !key.includes(':'))
      );
    }
    
    const flowPrefix = `${currentFlowId}:`;
    const currentFlowModels: Record<string, LanguageModel | null> = {};
    
    Object.entries(agentModels).forEach(([compositeKey, model]) => {
      if (compositeKey.startsWith(flowPrefix)) {
        const nodeId = compositeKey.substring(flowPrefix.length);
        currentFlowModels[nodeId] = model;
      }
    });
    
    return currentFlowModels;
  }, [agentModels]);

  const setOutputNodeDataForCurrentFlow = useCallback((data: OutputNodeData) => {
    const currentFlowId = getCurrentFlowId();
    if (!currentFlowId) {
      // If no flow ID, use 'default' as key for backward compatibility
      setOutputNodeData(prev => ({ ...prev, 'default': data }));
    } else {
      setOutputNodeData(prev => ({ ...prev, [currentFlowId]: data }));
    }
  }, []);

  const resetAllNodes = useCallback(() => {
    // Clear all agent data for current flow only
    const currentFlowId = getCurrentFlowId();
    if (!currentFlowId) {
      // If no flow ID, clear all data (backward compatibility)
      setAgentNodeData({});
      setOutputNodeData({});
    } else {
      // Clear only data for current flow
      const flowPrefix = `${currentFlowId}:`;
      setAgentNodeData(prev => {
        const newData: Record<string, AgentNodeData> = {};
        Object.entries(prev).forEach(([key, value]) => {
          if (!key.startsWith(flowPrefix)) {
            newData[key] = value;
          }
        });
        return newData;
      });
      
      // Clear output data for current flow
      setOutputNodeData(prev => {
        const { [currentFlowId]: removed, ...rest } = prev;
        return rest;
      });
    }
    
    // Note: We don't reset agentModels here as users would want to keep their model selections
  }, []);

  // Export node context data for persistence
  const exportNodeContextData = useCallback(() => {
    const currentFlowId = getCurrentFlowId();
    
    // Export agent data for current flow
    const currentFlowAgentData: Record<string, AgentNodeData> = {};
    const flowPrefix = currentFlowId ? `${currentFlowId}:` : '';
    
    Object.entries(agentNodeData).forEach(([compositeKey, data]) => {
      if (currentFlowId) {
        if (compositeKey.startsWith(flowPrefix)) {
          const nodeId = compositeKey.substring(flowPrefix.length);
          currentFlowAgentData[nodeId] = data;
        }
      } else {
        // If no flow ID, export data without flow prefix (backward compatibility)
        if (!compositeKey.includes(':')) {
          currentFlowAgentData[compositeKey] = data;
        }
      }
    });

    // Export output data for current flow
    const currentFlowOutputData = currentFlowId 
      ? outputNodeData[currentFlowId] || null
      : outputNodeData['default'] || null;

    return {
      agentNodeData: currentFlowAgentData,
      outputNodeData: currentFlowOutputData,
    };
  }, [agentNodeData, outputNodeData]);

  // Import node context data from persistence
  const importNodeContextData = useCallback((data: {
    agentNodeData?: Record<string, AgentNodeData>;
    outputNodeData?: OutputNodeData | null;
  }) => {
    const currentFlowId = getCurrentFlowId();
    
    // Import agent data
    if (data.agentNodeData) {
      Object.entries(data.agentNodeData).forEach(([nodeId, nodeData]) => {
        const compositeKey = createCompositeKey(nodeId);
        setAgentNodeData(prev => ({
          ...prev,
          [compositeKey]: nodeData,
        }));
      });
    }

    // Import output data
    if (data.outputNodeData) {
      if (currentFlowId) {
        setOutputNodeData(prev => ({
          ...prev,
          [currentFlowId]: data.outputNodeData!,
        }));
      } else {
        setOutputNodeData(prev => ({
          ...prev,
          'default': data.outputNodeData!,
        }));
      }
    }
  }, []);

  // Modified to return flow-aware data
  const contextValue = {
    get agentNodeData() {
      // Return only agent data for the current flow, mapped back to simple node IDs
      const currentFlowId = getCurrentFlowId();
      if (!currentFlowId) {
        // If no flow ID, return data without flow prefix (backward compatibility)
        return Object.fromEntries(
          Object.entries(agentNodeData).filter(([key]) => !key.includes(':'))
        );
      }
      
      const flowPrefix = `${currentFlowId}:`;
      const currentFlowData: Record<string, AgentNodeData> = {};
      
      Object.entries(agentNodeData).forEach(([compositeKey, data]) => {
        if (compositeKey.startsWith(flowPrefix)) {
          const nodeId = compositeKey.substring(flowPrefix.length);
          currentFlowData[nodeId] = data;
        }
      });
      
      return currentFlowData;
    },
    get outputNodeData() {
      // Return output data for the current flow only
      const currentFlowId = getCurrentFlowId();
      if (!currentFlowId) {
        // If no flow ID, return 'default' data for backward compatibility
        return outputNodeData['default'] || null;
      }
      
      return outputNodeData[currentFlowId] || null;
    },
    agentModels,
    updateAgentNode,
    updateAgentNodes,
    setOutputNodeData: setOutputNodeDataForCurrentFlow,
    setAgentModel,
    getAgentModel,
    getAllAgentModels,
    resetAllNodes,
    exportNodeContextData,
    importNodeContextData,
  };

  return (
    <NodeContext.Provider value={contextValue}>
      {children}
    </NodeContext.Provider>
  );
}

export function useNodeContext() {
  const context = useContext(NodeContext);
  
  if (context === undefined) {
    throw new Error('useNodeContext must be used within a NodeProvider');
  }
  
  return context;
} 