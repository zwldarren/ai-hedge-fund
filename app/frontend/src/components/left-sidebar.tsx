import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bot,
  Brain,
  Code,
  Cog,
  Database,
  FileText,
  Link as LinkIcon,
  LucideIcon,
  MessageSquare,
  PanelLeft,
  Plus,
  Search,
  Type,
  Zap
} from 'lucide-react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { SidebarItem } from './sidebar-item';

interface LeftSidebarProps {
  children?: ReactNode;
  isCollapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onToggleCollapse: () => void;
}

// Define component items by group
interface ComponentItem {
  name: string;
  icon: LucideIcon;
}

interface ComponentGroup {
  name: string;
  icon: LucideIcon;
  iconColor: string;
  items: ComponentItem[];
}

export function LeftSidebar({
  isCollapsed,
  onToggleCollapse,
}: LeftSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(250); // Default width
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<string | null>('Chat Input');
  const [openGroups, setOpenGroups] = useState<string[]>([]); // Start with all groups collapsed
  const [isSearching, setIsSearching] = useState(false); // Track if search is active
  // Add a ref for tracking dragging state - updates synchronously unlike state
  const isDraggingRef = useRef(false);
  const minWidth = 200;
  const maxWidth = 500;

  // Define all component groups and items
  const componentGroups: ComponentGroup[] = [
    {
      name: "inputs",
      icon: ArrowDownToLine,
      iconColor: "text-blue-400",
      items: [
        { name: "Chat Input", icon: MessageSquare },
        { name: "Text Input", icon: Type },
        { name: "File Input", icon: FileText }
      ]
    },
    {
      name: "outputs",
      icon: ArrowUpFromLine,
      iconColor: "text-green-400",
      items: [
        { name: "Chat Output", icon: MessageSquare },
        { name: "Text Output", icon: Type },
        { name: "File Output", icon: FileText }
      ]
    },
    {
      name: "data",
      icon: Database,
      iconColor: "text-yellow-400",
      items: [
        { name: "Data Store", icon: Database },
        { name: "Vector Store", icon: LinkIcon }
      ]
    },
    {
      name: "processing",
      icon: Zap,
      iconColor: "text-purple-400",
      items: [
        { name: "Code Processor", icon: Code },
        { name: "Function", icon: Zap }
      ]
    },
    {
      name: "agents",
      icon: Bot,
      iconColor: "text-red-400",
      items: [
        { name: "Agent", icon: Bot },
        { name: "Memory", icon: Brain },
        { name: "Tools", icon: Cog }
      ]
    }
  ];

  // Filter groups and items based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return componentGroups;

    return componentGroups.map(group => {
      // Filter items within the group
      const filteredItems = group.items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Return group with filtered items
      return {
        ...group,
        items: filteredItems
      };
    }).filter(group => group.items.length > 0); // Only include groups with matching items
  }, [componentGroups, searchQuery]);

  // Handle manual resizing with mouse
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    // Set both the ref (for immediate use in mousemove) and state (for rendering)
    isDraggingRef.current = true;
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);
  };

  const handleMouseMove = (e: MouseEvent) => {
    // Use the ref value instead of state for checking
    if (!isDraggingRef.current) return;
    
    // Get sidebar's left position
    const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left || 0;
    
    // Calculate new width (limit between minWidth and maxWidth)
    const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - sidebarLeft));
    
    setWidth(newWidth);
  };

  const stopResize = () => {
    // Update both ref and state
    isDraggingRef.current = false;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResize);
  };

  // Handle item selection
  const handleItemClick = (itemName: string) => {
    setActiveItem(itemName);
    // Additional logic for handling component selection could go here
  };

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResize);
    };
  }, []); // Empty dependency array as we're using refs now

  // Handle search query changes
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      // Open all groups that have matching items
      setOpenGroups(filteredGroups.map(group => group.name));
    } else if (isSearching) {
      // Only reset groups when exiting search mode
      setIsSearching(false);
    }
  }, [searchQuery, filteredGroups]);

  // Handle accordion value changes
  const handleAccordionChange = (value: string[]) => {
    // Only update if we're not actively searching
    if (!searchQuery) {
      setOpenGroups(value);
    } else {
      // During search, we need to preserve expanded groups that have matches
      const matchingGroups = filteredGroups.map(group => group.name);
      // Keep all matching groups open while allowing manual toggling of others
      const newValue = value.filter(group => matchingGroups.includes(group));
      if (newValue.length < matchingGroups.length) {
        // If user is closing a search result group, allow that
        setOpenGroups(newValue);
      } else {
        // User is opening a new group during search
        setOpenGroups(value);
      }
    }
  };

  return (
    <div 
      ref={sidebarRef}
      className={cn(
        "h-full bg-ramp-grey-800 flex flex-col relative",
        isCollapsed ? "shadow-lg" : "",
        isDragging ? "select-none" : ""
      )}
      style={{ 
        width: `${width}px`,
        borderRight: isDragging ? 'none' : '1px solid var(--ramp-grey-900)' 
      }}
    >
      <div className="p-2 flex justify-between flex-shrink-0 items-center border-b border-ramp-grey-700">
        <span className="text-white text-sm font-medium ml-4">Components</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-ramp-grey-700"
            aria-label="Add new component"
          >
            <Plus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-6 w-6 text-white hover:bg-ramp-grey-700"
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={16} />
          </Button>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto text-white scrollbar-thin scrollbar-thumb-ramp-grey-700">
        <div className="px-2 py-2 sticky top-0 bg-ramp-grey-800 z-10">
          <div className="flex items-center rounded-md bg-ramp-grey-700 px-3 py-1">
            <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Search components..." 
              className="bg-transparent text-sm focus:outline-none text-white w-full placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="h-4 w-4 text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Button>
            )}
          </div>
        </div>
        
        <Accordion 
          type="multiple" 
          className="w-full" 
          value={openGroups} 
          onValueChange={handleAccordionChange}
        >
          {filteredGroups.map(group => (
            <AccordionItem key={group.name} value={group.name} className="border-none">
              <AccordionTrigger className="px-4 py-2 text-sm hover:bg-ramp-grey-700 hover:no-underline">
                <div className="flex items-center gap-2">
                  <group.icon size={16} className={group.iconColor} />
                  <span className="capitalize">{group.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="space-y-1">
                  {group.items.map(item => (
                    <SidebarItem 
                      key={item.name}
                      icon={item.icon} 
                      label={item.name} 
                      isActive={activeItem === item.name}
                      onClick={() => handleItemClick(item.name)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredGroups.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No components match your search
          </div>
        )}
      </div>
      
      {/* Resize handle - completely hidden during dragging */}
      {!isDragging && (
        <div 
          className="absolute top-0 right-0 h-full w-1 cursor-ew-resize transition-all duration-150 z-10"
          onMouseDown={startResize}
        />
      )}
    </div>
  );
} 