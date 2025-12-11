import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KnowledgeNode } from '@/types/knowledge';
import { useTree } from '@/context/TreeContext';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  GripVertical,
  Plus,
  Trash2,
  Code,
  Server,
  Database,
  Book,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, React.ElementType> = {
  folder: Folder,
  'folder-open': FolderOpen,
  'file-text': FileText,
  code: Code,
  server: Server,
  database: Database,
  book: Book,
  lightbulb: Lightbulb,
};

interface TreeNodeProps {
  node: KnowledgeNode;
  depth: number;
  parentId: string | null;
}

export const TreeNodeComponent: React.FC<TreeNodeProps> = ({ node, depth, parentId }) => {
  const { selectedNode, setSelectedNode, addNode, deleteNode } = useTree();
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNode?.id === node.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: {
      type: 'tree-node',
      node,
      parentId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = iconMap[node.icon || 'file-text'] || FileText;
  const FolderIcon = isExpanded ? FolderOpen : Folder;

  return (
    <div ref={setNodeRef} style={style} className={cn('animate-fade-in', isDragging && 'opacity-50')}>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-200',
          'hover:bg-tree-hover',
          isSelected && 'bg-tree-selected border border-primary/30'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => setSelectedNode(node)}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Expand/Collapse */}
        {node.type === 'category' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Icon */}
        {node.type === 'category' ? (
          <FolderIcon className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <IconComponent className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        {/* Title */}
        <span className="flex-1 text-sm font-medium truncate">{node.title}</span>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.type === 'category' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                addNode(node.id);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(node.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 border-l-2 border-dashed border-tree-line"
            style={{ marginLeft: `${depth * 20 + 20}px` }}
          />
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              parentId={node.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
