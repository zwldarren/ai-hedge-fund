import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

export type NodeStatus = 'IDLE' | 'IN_PROGRESS' | 'COMPLETE' | 'ERROR';

// Message history item
export interface MessageItem {
  timestamp: string;
  message: string;
  ticker: string | null;
}

// Node state structure
export interface NodeData {
  status: NodeStatus;
  ticker: string | null;
  message: string;
  lastUpdated: number;
  messages: MessageItem[];
  timestamp?: string;
}

// Default node state
const DEFAULT_NODE_STATE: NodeData = {
  status: 'IDLE',
  ticker: null,
  message: '',
  messages: [],
  lastUpdated: Date.now()
};

interface NodeContextType {
  nodeStates: Record<string, NodeData>;
  updateNode: (nodeId: string, data: Partial<NodeData> | NodeStatus) => void;
  updateNodes: (nodeIds: string[], status: NodeStatus) => void;
  resetAllNodes: () => void;
}

const NodeContext = createContext<NodeContextType | undefined>(undefined);

export function NodeProvider({ children }: { children: ReactNode }) {
  const [nodeStates, setNodeStates] = useState<Record<string, NodeData>>({});

  const updateNode = useCallback((nodeId: string, data: Partial<NodeData> | NodeStatus) => {
    // Handle string status shorthand (just passing a status string)
    if (typeof data === 'string') {
      setNodeStates(prev => {
        const existingNode = prev[nodeId] || { ...DEFAULT_NODE_STATE };
        return {
          ...prev,
          [nodeId]: {
            ...existingNode,
            status: data,
            lastUpdated: Date.now()
          }
        };
      });
      return;
    }

    // Handle data object - full update
    setNodeStates(prev => {
      const existingNode = prev[nodeId] || { ...DEFAULT_NODE_STATE };
      const newMessages = [...existingNode.messages];
      
      // Add message to history if it's new
      if (data.message && data.message !== existingNode.message) {
        newMessages.push({
          timestamp: data.timestamp || new Date().toISOString(),
          message: data.message,
          ticker: data.ticker || existingNode.ticker
        });
      }
      
      return {
        ...prev,
        [nodeId]: {
          ...existingNode,
          ...data,
          messages: newMessages,
          lastUpdated: Date.now()
        }
      };
    });
  }, []);

  const updateNodes = useCallback((nodeIds: string[], status: NodeStatus) => {
    if (nodeIds.length === 0) return;
    
    setNodeStates(prev => {
      const newStates = { ...prev };
      
      nodeIds.forEach(id => {
        newStates[id] = {
          ...(newStates[id] || { ...DEFAULT_NODE_STATE }),
          status,
          lastUpdated: Date.now()
        };
      });
      
      return newStates;
    });
  }, []);

  const resetAllNodes = useCallback(() => setNodeStates({}), []);

  return (
    <NodeContext.Provider
      value={{
        nodeStates,
        updateNode,
        updateNodes,
        resetAllNodes,
      }}
    >
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