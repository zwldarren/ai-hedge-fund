import { Flow } from '@/types/flow';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

// Define tab types
export type TabType = 'flow' | 'settings';

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  content: ReactNode;
  // For flow tabs
  flow?: Flow;
  // For other tabs (settings, etc.)
  metadata?: Record<string, any>;
}

interface TabsContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Omit<Tab, 'id'> & { id?: string }) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  closeAllTabs: () => void;
  isTabOpen: (identifier: string, type: TabType) => boolean;
  getTabByIdentifier: (identifier: string, type: TabType) => Tab | undefined;
}

const TabsContext = createContext<TabsContextType | null>(null);

export function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within a TabsProvider');
  }
  return context;
}

interface TabsProviderProps {
  children: ReactNode;
}

export function TabsProvider({ children }: TabsProviderProps) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Generate unique tab ID
  const generateTabId = useCallback((type: TabType, identifier?: string): string => {
    if (type === 'flow' && identifier) {
      return `flow-${identifier}`;
    }
    if (type === 'settings') {
      return 'settings';
    }
    return `${type}-${Date.now()}`;
  }, []);

  // Check if a tab is already open
  const isTabOpen = useCallback((identifier: string, type: TabType): boolean => {
    const tabId = generateTabId(type, identifier);
    return tabs.some(tab => tab.id === tabId);
  }, [tabs, generateTabId]);

  // Get tab by identifier
  const getTabByIdentifier = useCallback((identifier: string, type: TabType): Tab | undefined => {
    const tabId = generateTabId(type, identifier);
    return tabs.find(tab => tab.id === tabId);
  }, [tabs, generateTabId]);

  // Open a new tab or focus existing one
  const openTab = useCallback((tabData: Omit<Tab, 'id'> & { id?: string }) => {
    const tabId = tabData.id || generateTabId(tabData.type, 
      tabData.type === 'flow' && tabData.flow ? tabData.flow.id.toString() : undefined
    );

    setTabs(prevTabs => {
      // Check if tab already exists
      const existingTabIndex = prevTabs.findIndex(tab => tab.id === tabId);
      
      if (existingTabIndex !== -1) {
        // Tab exists, just update it and focus
        const updatedTabs = [...prevTabs];
        updatedTabs[existingTabIndex] = { ...tabData, id: tabId };
        setActiveTabId(tabId);
        return updatedTabs;
      } else {
        // Create new tab
        const newTab: Tab = { ...tabData, id: tabId };
        setActiveTabId(tabId);
        return [...prevTabs, newTab];
      }
    });
  }, [generateTabId]);

  // Close a tab
  const closeTab = useCallback((tabId: string) => {
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      
      // If closing active tab, set new active tab
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          // Find the index of the closed tab
          const closedIndex = prevTabs.findIndex(tab => tab.id === tabId);
          // Try to activate the tab to the right, or the last tab if closing the last one
          const newActiveIndex = closedIndex < newTabs.length ? closedIndex : newTabs.length - 1;
          setActiveTabId(newTabs[newActiveIndex]?.id || null);
        } else {
          setActiveTabId(null);
        }
      }
      
      return newTabs;
    });
  }, [activeTabId]);

  // Set active tab
  const setActiveTab = useCallback((tabId: string) => {
    if (tabs.some(tab => tab.id === tabId)) {
      setActiveTabId(tabId);
    }
  }, [tabs]);

  // Close all tabs
  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

  const value = {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    setActiveTab,
    closeAllTabs,
    isTabOpen,
    getTabByIdentifier,
  };

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
} 