import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

export type NodeStatus = 'IDLE' | 'IN_PROGRESS' | 'COMPLETE' | 'ERROR';

interface NodeState {
  [nodeId: string]: NodeStatus;
}

interface NodeStatusContextType {
  nodeStates: NodeState;
  updateNode: (nodeId: string, status: NodeStatus) => void;
  updateNodes: (nodeIds: string[], status: NodeStatus) => void;
  resetAllNodes: () => void;
}

const NodeStatusContext = createContext<NodeStatusContextType | undefined>(undefined);

export function NodeStatusProvider({ children }: { children: ReactNode }) {
  const [nodeStates, setNodeStates] = useState<NodeState>({});

  const updateNode = useCallback((nodeId: string, status: NodeStatus) => {
    setNodeStates((prevStates) => ({
      ...prevStates,
      [nodeId]: status,
    }));
  }, []);

  const updateNodes = useCallback((nodeIds: string[], status: NodeStatus) => {
    setNodeStates((prevStates) => {
      const newStates = { ...prevStates };
      nodeIds.forEach((id) => {
        newStates[id] = status;
      });
      return newStates;
    });
  }, []);

  const resetAllNodes = useCallback(() => {
    setNodeStates({});
  }, []);

  return (
    <NodeStatusContext.Provider
      value={{
        nodeStates,
        updateNode,
        updateNodes,
        resetAllNodes,
      }}
    >
      {children}
    </NodeStatusContext.Provider>
  );
}

export function useNodeStatus() {
  const context = useContext(NodeStatusContext);
  
  if (context === undefined) {
    throw new Error('useNodeStatus must be used within a NodeStatusProvider');
  }
  
  return context;
} 