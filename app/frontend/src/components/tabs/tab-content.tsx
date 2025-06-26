import { useTabsContext } from '@/contexts/tabs-context';
import { cn } from '@/lib/utils';
import { FileText, FolderOpen } from 'lucide-react';

interface TabContentProps {
  className?: string;
}

export function TabContent({ className }: TabContentProps) {
  const { tabs, activeTabId } = useTabsContext();

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  if (!activeTab) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center bg-background text-muted-foreground",
        className
      )}>
        <div className="text-center space-y-4">
          <FolderOpen size={48} className="mx-auto text-muted-foreground/50" />
          <div>
            <div className="text-xl font-medium mb-2">Welcome to AI Hedge Fund</div>
            <div className="text-sm max-w-md">
              Click on a flow from the left sidebar to open it in a tab, or click the settings icon to configure your preferences.
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
            <FileText size={14} />
            <span>Flows open in tabs</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 bg-background overflow-hidden", className)}>
      {activeTab.content}
    </div>
  );
} 