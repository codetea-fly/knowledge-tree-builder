import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Shield,
  FileText,
  Link,
  Search,
  History,
  PenTool,
  FileSearch,
  MessageCircle,
  CheckSquare,
  GitBranch,
  Code,
  LucideIcon,
} from 'lucide-react';
import {
  CHECK_CATEGORY_NODES,
  INTERACTION_TYPE_NODES,
  NodeLibraryItem,
} from '@/types/workflow';

const iconMap: Record<string, LucideIcon> = {
  Shield,
  FileText,
  Link,
  Search,
  History,
  PenTool,
  FileSearch,
  MessageCircle,
  CheckSquare,
  GitBranch,
  Code,
};

interface DraggableNodeProps {
  item: NodeLibraryItem;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ item }) => {
  const Icon = iconMap[item.icon] || FileText;

  const onDragStart = (event: React.DragEvent, nodeData: NodeLibraryItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing',
        'border border-border bg-card hover:bg-accent/50 transition-colors',
        'select-none'
      )}
      style={{ borderLeftColor: item.color, borderLeftWidth: 4 }}
    >
      <div
        className="p-2 rounded-md"
        style={{ backgroundColor: `${item.color}20` }}
      >
        <Icon className="h-4 w-4" style={{ color: item.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {item.label}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {item.description}
        </div>
      </div>
    </div>
  );
};

interface NodeGroupProps {
  title: string;
  items: NodeLibraryItem[];
}

const NodeGroup: React.FC<NodeGroupProps> = ({ title, items }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <DraggableNode key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export const NodeLibrary: React.FC = () => {
  return (
    <div className="w-[260px] border-r border-border bg-muted/30 flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">节点库</h2>
        <p className="text-xs text-muted-foreground mt-1">
          拖拽节点到画布中
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <NodeGroup title="检查项类别" items={CHECK_CATEGORY_NODES} />
          <NodeGroup title="交互方式" items={INTERACTION_TYPE_NODES} />
        </div>
      </ScrollArea>
    </div>
  );
};
