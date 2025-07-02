import {
  Background,
  ColorMode,
  Connection,
  Edge,
  MarkerType,
  NodeChange,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState
} from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import '@xyflow/react/dist/style.css';

import { useFlowContext } from '@/contexts/flow-context';
import { useEnhancedFlowActions } from '@/hooks/use-enhanced-flow-actions';
import { useFlowHistory } from '@/hooks/use-flow-history';
import { useFlowKeyboardShortcuts, useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useToastManager } from '@/hooks/use-toast-manager';
import { AppNode } from '@/nodes/types';
import { edgeTypes } from '../edges';
import { nodeTypes } from '../nodes';
import { TooltipProvider } from './ui/tooltip';

type FlowProps = {
  className?: string;
};

export function Flow({ className = '' }: FlowProps) {
  const [colorMode] = useState<ColorMode>('dark');
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const proOptions = { hideAttribution: true };
  
  // Get flow context for flow ID
  const { currentFlowId } = useFlowContext();
  
  // Get enhanced flow actions for complete state persistence
  const { saveCurrentFlowWithCompleteState } = useEnhancedFlowActions();
  
  // Get toast manager
  const { success, error } = useToastManager();

  // Initialize flow history (each flow maintains its own separate history)
  const { takeSnapshot, undo, redo, canUndo, canRedo, clearHistory } = useFlowHistory({ flowId: currentFlowId });

  // Create debounced auto-save function
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const autoSave = useCallback(async () => {
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!currentFlowId) return; // Only auto-save existing flows
      
      try {
        await saveCurrentFlowWithCompleteState();
        console.log('[Auto-save] Flow saved successfully');
      } catch (error) {
        console.error('[Auto-save] Failed to save flow:', error);
      }
    }, 1000); // 1 second debounce
  }, [currentFlowId, saveCurrentFlowWithCompleteState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Take initial snapshot when flow is initialized
  useEffect(() => {
    if (isInitialized && nodes.length === 0 && edges.length === 0) {
      takeSnapshot();
    }
  }, [isInitialized, takeSnapshot, nodes.length, edges.length]);

  // Take snapshot when nodes or edges change (debounced)
  useEffect(() => {
    if (!isInitialized) return;
    
    const timeoutId = setTimeout(() => {
      takeSnapshot();
    }, 500); // Debounce snapshots by 500ms

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, takeSnapshot, isInitialized]);

  // // Auto-save when nodes or edges change (debounced with longer delay)
  // useEffect(() => {
  //   if (!isInitialized) return;
    
  //   const timeoutId = setTimeout(async () => {
  //     try {
  //       await saveCurrentFlowWithCompleteState();
  //       // Don't show success toast for auto-save to avoid spam
  //     } catch (err) {
  //       // Only show error notifications for auto-save failures
  //       error('Auto-save failed', 'auto-save-error');
  //     }
  //   }, 1000); // Debounce auto-save by 1 second (longer than undo/redo)

  //   return () => clearTimeout(timeoutId);
  // }, [nodes, edges, saveCurrentFlowWithCompleteState, error, isInitialized]);

  // Connect keyboard shortcuts to save flow with toast
  useFlowKeyboardShortcuts(async () => {
    try {
      const savedFlow = await saveCurrentFlowWithCompleteState();
      if (savedFlow) {
        success(`"${savedFlow.name}" saved!`, 'flow-save');
      } else {
        error('Failed to save flow', 'flow-save-error');
      }
    } catch (err) {
      error('Failed to save flow', 'flow-save-error');
    }
  });

  // Add undo/redo keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'z',
        ctrlKey: true,
        metaKey: true,
        callback: undo,
        preventDefault: true,
      },
      {
        key: 'z',
        ctrlKey: true,
        metaKey: true,
        shiftKey: true,
        callback: redo,
        preventDefault: true,
      },
    ],
  });
  
  // Initialize the flow when it first renders
  const onInit = useCallback(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Connect two nodes with marker
  const onConnect = useCallback(
    (connection: Connection) => {
      // Create a new edge with a marker and unique ID
      const newEdge: Edge = {
        ...connection,
        id: `edge-${Date.now()}`, // Add unique ID
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      
      // Auto-save new connections immediately (structural change)
      if (currentFlowId) {
        // Clear any pending debounced saves and save immediately
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        
        // Use setTimeout to ensure the edge is added to state first
        setTimeout(async () => {
          try {
            await saveCurrentFlowWithCompleteState();
            console.log('[Auto-save] New connection saved immediately');
          } catch (error) {
            console.error('[Auto-save] Failed to save new connection:', error);
          }
        }, 100);
      }
    },
    [setEdges, currentFlowId, saveCurrentFlowWithCompleteState]
  );

  // Enhanced edges change handler with auto-save
  const handleEdgesChange = useCallback(async (changes: any[]) => {
    onEdgesChange(changes);
    console.log('[Auto-save] Edge changes detected:', changes);

    // Auto-save on edge structural changes
    const shouldAutoSave = changes.some(change => 
      change.type === 'add' || 
      change.type === 'remove'
      // Skip 'select' and 'replace' types
    );

    if (shouldAutoSave && currentFlowId) {
      // Edge changes are typically structural, so save immediately
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      try {
        await saveCurrentFlowWithCompleteState();
      } catch (error) {
        console.error('[Auto-save] Failed to save edge changes:', error);
      }
    }
  }, [onEdgesChange, currentFlowId, saveCurrentFlowWithCompleteState]);

  const handleNodesChange = useCallback(async (changes: NodeChange<AppNode>[]) => {
    onNodesChange(changes);

    // Only auto-save for specific change types to avoid excessive saves
    const shouldAutoSave = changes.some(change => 
      change.type === 'add' || 
      change.type === 'position' || 
      change.type === 'remove'
    );

    if (shouldAutoSave && currentFlowId) {
      // For structural changes (add/remove), save immediately
      // For position changes, use debounced save
      const hasStructuralChanges = changes.some(change => 
        change.type === 'add' || change.type === 'remove'
      );
      
      if (hasStructuralChanges) {
        // Clear debounced save and save immediately for structural changes
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        try {
          await saveCurrentFlowWithCompleteState();
        } catch (error) {
          console.error('[Auto-save] Failed to save structural changes:', error);
        }
      } else {
        // Use debounced save for position changes
        autoSave();
      }
    }
  }, [onNodesChange, currentFlowId, autoSave]);

  return (
    <div className={`w-full h-full ${className}`}>
      <TooltipProvider>
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          edges={edges}
          edgeTypes={edgeTypes}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          colorMode={colorMode}
          proOptions={proOptions}
        >
          <Background 
            gap={13}
            color="#666666"
            style={{ backgroundColor: '#0a0a0a' }}
          />
          {/* <CustomControls onReset={resetFlow} /> */}
        </ReactFlow>
      </TooltipProvider>
    </div>
  );
} 