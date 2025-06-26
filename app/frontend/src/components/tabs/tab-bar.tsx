import { Button } from '@/components/ui/button';
import { useTabsContext } from '@/contexts/tabs-context';
import { cn } from '@/lib/utils';
import { FileText, Layout, Settings, X } from 'lucide-react';
import { ReactNode } from 'react';

interface TabBarProps {
  className?: string;
}

// Get icon for tab type
const getTabIcon = (type: string): ReactNode => {
  switch (type) {
    case 'flow':
      return <FileText size={14} />;
    case 'settings':
      return <Settings size={14} />;
    default:
      return <Layout size={14} />;
  }
};

export function TabBar({ className }: TabBarProps) {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabsContext();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center bg-panel border-b border-ramp-grey-900 overflow-x-auto",
      className
    )}>
      <div className="flex items-center min-w-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 border-r border-ramp-grey-900 cursor-pointer transition-colors min-w-0 max-w-48",
              activeTabId === tab.id 
                ? "bg-background text-foreground border-b-2 border-blue-400" 
                : "bg-panel text-muted-foreground hover:bg-ramp-grey-700"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {/* Tab Icon */}
            <div className={cn(
              "flex-shrink-0",
              activeTabId === tab.id ? "text-blue-400" : "text-muted-foreground"
            )}>
              {getTabIcon(tab.type)}
            </div>

            {/* Tab Title */}
            <span className="text-sm font-medium truncate min-w-0">
              {tab.title}
            </span>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-4 w-4 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-ramp-grey-600 transition-opacity",
                activeTabId === tab.id && "opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              title="Close tab"
            >
              <X size={12} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 