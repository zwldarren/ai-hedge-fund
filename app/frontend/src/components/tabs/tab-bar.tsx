import { Button } from '@/components/ui/button';
import { useTabsContext } from '@/contexts/tabs-context';
import { cn } from '@/lib/utils';
import { FileText, Layout, Settings, X } from 'lucide-react';
import { ReactNode, useState } from 'react';

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
  const { tabs, activeTabId, setActiveTab, closeTab, reorderTabs } = useTabsContext();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (tabs.length === 0) {
    return null;
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for some browsers
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderTabs(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={cn(
      "flex items-center bg-panel border-b border-ramp-grey-900 overflow-x-auto",
      className
    )}>
      <div className="flex items-center min-w-0">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 border-r border-ramp-grey-900 cursor-pointer transition-all min-w-0 max-w-48 select-none",
              activeTabId === tab.id 
                ? "bg-background text-foreground border-b-2 border-blue-400" 
                : "bg-panel text-muted-foreground hover:bg-ramp-grey-700",
              draggedIndex === index && "opacity-50 scale-95",
              dragOverIndex === index && "bg-ramp-grey-600 transform scale-105",
              "hover:cursor-grab active:cursor-grabbing"
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
              onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking close button
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