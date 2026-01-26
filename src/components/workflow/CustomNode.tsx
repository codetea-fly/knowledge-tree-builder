import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
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
import { WorkflowNodeData } from '@/types/workflow';

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

interface CustomNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

export const CustomNode: React.FC<CustomNodeProps> = memo(({ data, selected }) => {
  const Icon = data.icon ? iconMap[data.icon] || FileText : FileText;

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg shadow-md min-w-[160px] max-w-[200px]',
        'bg-card border-2 transition-all duration-200',
        selected ? 'ring-2 ring-primary ring-offset-2' : ''
      )}
      style={{ borderColor: data.color }}
    >
      {/* 输入锚点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      <div className="flex items-center gap-2">
        <div
          className="p-1.5 rounded"
          style={{ backgroundColor: `${data.color}20` }}
        >
          <Icon className="h-4 w-4" style={{ color: data.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {data.label}
          </div>
          {data.description && (
            <div className="text-xs text-muted-foreground truncate">
              {data.description}
            </div>
          )}
        </div>
      </div>

      {/* 输出锚点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
