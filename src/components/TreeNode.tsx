import React, { useState } from 'react';
import { ProcessDomain, RelatedDomain } from '@/types/knowledge';
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
  Link,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProcessNodeProps {
  node: ProcessDomain;
  index: number;
  onDelete: () => void;
  onAddRelated: () => void;
}

interface RelatedNodeProps {
  node: RelatedDomain;
  depth: number;
  path: string;
}

export const RelatedDomainNode: React.FC<RelatedNodeProps> = ({
  node,
  depth,
  path,
}) => {
  const { selectedNode, setSelectedNode, addRelatedDomainByPath, deleteRelatedDomainByPath } = useTree();
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.related_domains && node.related_domains.length > 0;
  const isSelected = selectedNode?.path === path;

  const handleAddChild = () => {
    addRelatedDomainByPath(path);
  };

  const handleDelete = () => {
    deleteRelatedDomainByPath(path);
  };

  return (
    <div className="animate-fade-in">
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-200',
          'hover:bg-tree-hover',
          isSelected && 'bg-tree-selected border border-primary/30'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => setSelectedNode({ node, path })}
      >
        <div className="opacity-0 group-hover:opacity-100 p-0.5 cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {hasChildren ? (
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

        <Link className="h-4 w-4 text-accent shrink-0" />
        <span className="flex-1 text-sm font-medium truncate">{node.name}</span>
        <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
          {node.type}
        </span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              handleAddChild();
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 border-l-2 border-dashed border-tree-line"
            style={{ marginLeft: `${depth * 20 + 20}px` }}
          />
          {node.related_domains.map((child, idx) => (
            <RelatedDomainNode
              key={`${path}.related_domains[${idx}]`}
              node={child}
              depth={depth + 1}
              path={`${path}.related_domains[${idx}]`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
export const ProcessDomainNode: React.FC<ProcessNodeProps> = ({
  node,
  index,
  onDelete,
  onAddRelated,
}) => {
  const { selectedNode, setSelectedNode } = useTree();
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.related_domains && node.related_domains.length > 0;
  const path = `process_domains[${index}]`;
  const isSelected = selectedNode?.path === path;

  return (
    <div className="animate-fade-in">
      <div
        className={cn(
          'group flex items-center gap-1 py-2 px-2 rounded-lg cursor-pointer transition-all duration-200',
          'hover:bg-tree-hover',
          isSelected && 'bg-tree-selected border border-primary/30'
        )}
        onClick={() => setSelectedNode({ node, path })}
      >
        <div className="opacity-0 group-hover:opacity-100 p-0.5 cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

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

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-primary shrink-0" />
        )}

        <span className="flex-1 text-sm font-semibold truncate">{node.name}</span>
        <span className="text-xs text-primary-foreground bg-primary px-1.5 py-0.5 rounded">
          {node.charpter}
        </span>
        <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded ml-1">
          {node.type}
        </span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onAddRelated();
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="relative ml-4">
          <div className="absolute left-4 top-0 bottom-0 border-l-2 border-dashed border-tree-line" />
          {node.related_domains.map((child, idx) => (
            <RelatedDomainNode
              key={`${path}.related_domains[${idx}]`}
              node={child}
              depth={1}
              path={`${path}.related_domains[${idx}]`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
