import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
}

export function SidebarItem({ 
  icon: Icon, 
  label, 
  onClick, 
  className, 
  isActive = false 
}: SidebarItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors duration-150",
        isActive ? "bg-ramp-grey-700 text-white" : "text-gray-300",
        isHovered ? "bg-ramp-grey-700" : "",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) {
          onClick();
        }
      }}
    >
      <div className="flex-shrink-0">
        <Icon size={16} className={isActive ? "text-white" : "text-gray-400"} />
      </div>
      <span className="truncate">{label}</span>
      
      {/* Drag handle with group-hover visibility */}
      <div className="ml-auto opacity-0 group-hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>
    </div>
  );
} 