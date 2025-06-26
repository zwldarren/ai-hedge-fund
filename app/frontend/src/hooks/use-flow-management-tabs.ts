import { useFlowContext } from '@/contexts/flow-context';
import { useTabsContext } from '@/contexts/tabs-context';
import {
    clearAllNodeStates,
    clearFlowNodeStates,
    getNodeInternalState,
    setNodeInternalState,
    setCurrentFlowId as setNodeStateFlowId
} from '@/hooks/use-node-state';
import { useToastManager } from '@/hooks/use-toast-manager';
import { flowService } from '@/services/flow-service';
import { TabService } from '@/services/tab-service';
import { Flow } from '@/types/flow';
import { useCallback, useEffect, useState } from 'react';

export interface UseFlowManagementTabsReturn {
  // State
  flows: Flow[];
  searchQuery: string;
  isLoading: boolean;
  openGroups: string[];
  createDialogOpen: boolean;
  
  // Computed values
  filteredFlows: Flow[];
  recentFlows: Flow[];
  templateFlows: Flow[];
  
  // Actions
  setSearchQuery: (query: string) => void;
  setOpenGroups: (groups: string[]) => void;
  setCreateDialogOpen: (open: boolean) => void;
  handleAccordionChange: (value: string[]) => void;
  handleCreateNewFlow: () => void;
  handleFlowCreated: (newFlow: Flow) => Promise<void>;
  handleSaveCurrentFlow: () => Promise<void>;
  handleOpenFlowInTab: (flow: Flow) => Promise<void>;
  handleDeleteFlow: (flow: Flow) => Promise<void>;
  handleRefresh: () => Promise<void>;
  
  // Internal functions (for testing/advanced use)
  loadFlows: () => Promise<void>;
  createDefaultFlow: () => Promise<void>;
}

export function useFlowManagementTabs(): UseFlowManagementTabsReturn {
  // Get flow context, tabs context, and toast manager
  const { saveCurrentFlow, loadFlow, reactFlowInstance } = useFlowContext();
  const { openTab, isTabOpen, closeTab, setActiveTab } = useTabsContext();
  const { success, error } = useToastManager();
  
  // State for flows
  const [flows, setFlows] = useState<Flow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['recent-flows']);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Enhanced save function that includes internal node states
  const saveCurrentFlowWithStates = useCallback(async (): Promise<Flow | null> => {
    try {
      // Get current nodes from React Flow
      const currentNodes = reactFlowInstance.getNodes();
      
      // Enhance nodes with internal states
      const nodesWithStates = currentNodes.map((node: any) => {
        const internalState = getNodeInternalState(node.id);
        return {
          ...node,
          data: {
            ...node.data,
            // Only add internal_state if there is actually state to save
            ...(internalState && Object.keys(internalState).length > 0 ? { internal_state: internalState } : {})
          }
        };
      });

      // Temporarily replace nodes in React Flow with enhanced nodes
      reactFlowInstance.setNodes(nodesWithStates);
      
      try {
        // Use the context's save function which handles currentFlowId properly
        const savedFlow = await saveCurrentFlow();
        return savedFlow;
      } finally {
        // Restore original nodes (without internal_state in React Flow)
        reactFlowInstance.setNodes(currentNodes);
      }
    } catch (err) {
      console.error('Failed to save flow with states:', err);
      return null;
    }
  }, [reactFlowInstance, saveCurrentFlow]);

  // Enhanced load function that restores internal node states
  const loadFlowWithStates = useCallback(async (flow: Flow) => {
    try {
      // First, set the flow ID for node state isolation
      setNodeStateFlowId(flow.id.toString());
      
      // Clear all existing node states
      clearAllNodeStates();

      // Load the flow using the context (this handles currentFlowId, currentFlowName, etc.)
      await loadFlow(flow);

      // Then restore internal states for each node
      if (flow.nodes) {
        flow.nodes.forEach((node: any) => {
          if (node.data?.internal_state) {
            setNodeInternalState(node.id, node.data.internal_state);
          }
        });
      }

      console.log('Flow loaded with internal states:', flow.name);
    } catch (error) {
      console.error('Failed to load flow with states:', error);
      throw error; // Re-throw to handle in calling function
    }
  }, [loadFlow]);

  // Create default flow for new users
  const createDefaultFlow = useCallback(async () => {
    try {
      console.log('Creating default flow for new user...');
      // Get current React Flow state, fallback to empty arrays if nothing exists
      const nodes = reactFlowInstance?.getNodes() || [];
      const edges = reactFlowInstance?.getEdges() || [];
      const viewport = reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 };
      
      const defaultFlow = await flowService.createDefaultFlow(nodes, edges, viewport);
      console.log('Default flow created:', defaultFlow);
      setFlows([defaultFlow]);
      
      // Open the default flow in a tab
      const tabData = TabService.createFlowTab(defaultFlow);
      openTab(tabData);
      
      console.log('Default flow opened in tab');
    } catch (error) {
      console.error('Failed to create default flow:', error);
    }
  }, [reactFlowInstance, openTab]);

  // Load flows from API
  const loadFlows = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading flows from API...');
      const flowsData = await flowService.getFlows();
      console.log('Loaded flows:', flowsData);
      setFlows(flowsData);
      
      // Don't automatically create or open tabs on startup
      // Let users explicitly open tabs by clicking on flows
      // Tabs will be restored from localStorage if they exist
      
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load flows on mount
  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  // Filter flows based on search query
  const filteredFlows = flows.filter(flow =>
    flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flow.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flow.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort flows by updated_at descending, then group them
  const sortedFlows = [...filteredFlows].sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at);
    const dateB = new Date(b.updated_at || b.created_at);
    return dateB.getTime() - dateA.getTime();
  });

  // Group flows
  const recentFlows = sortedFlows.filter(f => !f.is_template).slice(0, 10);
  const templateFlows = sortedFlows.filter(f => f.is_template);

  // Event handlers
  const handleAccordionChange = useCallback((value: string[]) => {
    setOpenGroups(value);
  }, []);

  const handleCreateNewFlow = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleFlowCreated = useCallback(async (newFlow: Flow) => {
    // Open the new flow in a tab
    const tabData = TabService.createFlowTab(newFlow);
    openTab(tabData);
    
    // Remember it
    localStorage.setItem('lastSelectedFlowId', newFlow.id.toString());
    
    // Refresh the flows list to show the new flow
    await loadFlows();
  }, [openTab, loadFlows]);

  const handleSaveCurrentFlow = useCallback(async () => {
    try {
      const savedFlow = await saveCurrentFlowWithStates();
      if (savedFlow) {
        // Remember the saved flow
        localStorage.setItem('lastSelectedFlowId', savedFlow.id.toString());
        // Refresh the flows list
        await loadFlows();
        success(`"${savedFlow.name}" saved!`, 'flow-save');
      } else {
        error('Failed to save flow', 'flow-save-error');
      }
    } catch (err) {
      console.error('Failed to save flow:', err);
      error('Failed to save flow', 'flow-save-error');
    }
  }, [saveCurrentFlowWithStates, loadFlows, success, error]);

  const handleOpenFlowInTab = useCallback(async (flow: Flow) => {
    try {
      // Check if tab is already open
      if (isTabOpen(flow.id.toString(), 'flow')) {
        // Tab exists, just focus it
        const tabId = `flow-${flow.id}`;
        setActiveTab(tabId);
        console.log('Flow tab already open, focusing:', flow.name);
        
        // Remember the selected flow
        localStorage.setItem('lastSelectedFlowId', flow.id.toString());
        return;
      }

      // Fetch the full flow data including nodes, edges, and viewport
      const fullFlow = await flowService.getFlow(flow.id);
      
      // Open in a new tab
      const tabData = TabService.createFlowTab(fullFlow);
      openTab(tabData);
      
      // Remember the selected flow
      localStorage.setItem('lastSelectedFlowId', flow.id.toString());
      console.log('Flow opened in tab:', fullFlow.name);
    } catch (error) {
      console.error('Failed to open flow in tab:', error);
    }
  }, [isTabOpen, openTab, setActiveTab]);

  const handleRefresh = useCallback(async () => {
    await loadFlows();
  }, [loadFlows]);

  const handleDeleteFlow = useCallback(async (flow: Flow) => {
    try {
      await flowService.deleteFlow(flow.id);
      
      // Close the tab if it's open
      const tabId = `flow-${flow.id}`;
      closeTab(tabId);
      
      // Clear node states for the deleted flow
      clearFlowNodeStates(flow.id.toString());
      
      // Remove from localStorage if it was the last selected
      const lastSelectedFlowId = localStorage.getItem('lastSelectedFlowId');
      if (lastSelectedFlowId === flow.id.toString()) {
        localStorage.removeItem('lastSelectedFlowId');
      }
      
      // Refresh the flows list
      await loadFlows();
    } catch (error) {
      console.error('Failed to delete flow:', error);
    }
  }, [loadFlows, closeTab]);

  return {
    // State
    flows,
    searchQuery,
    isLoading,
    openGroups,
    createDialogOpen,
    
    // Computed values
    filteredFlows,
    recentFlows,
    templateFlows,
    
    // Actions
    setSearchQuery,
    setOpenGroups,
    setCreateDialogOpen,
    handleAccordionChange,
    handleCreateNewFlow,
    handleFlowCreated,
    handleSaveCurrentFlow,
    handleOpenFlowInTab,
    handleDeleteFlow,
    handleRefresh,
    
    // Internal functions
    loadFlows,
    createDefaultFlow,
  };
} 