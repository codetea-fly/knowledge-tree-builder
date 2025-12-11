import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TreeProvider, useTree } from '@/context/TreeContext';
import { TreeNodeComponent } from '@/components/TreeNode';
import { NodeEditor } from '@/components/NodeEditor';
import { JsonPreview } from '@/components/JsonPreview';
import { KnowledgeNode } from '@/types/knowledge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  TreeDeciduous,
  Settings,
  Code,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const getAllNodeIds = (nodes: KnowledgeNode[]): string[] => {
  return nodes.flatMap((node) => [
    node.id,
    ...(node.children ? getAllNodeIds(node.children) : []),
  ]);
};

const TreePanel: React.FC = () => {
  const { tree, addNode } = useTree();
  const [activeNode, setActiveNode] = useState<KnowledgeNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveNode(active.data.current?.node || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveNode(null);
    // Drag and drop logic handled by dnd-kit
  };

  const allNodeIds = getAllNodeIds(tree);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TreeDeciduous className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">知识库结构</h2>
        </div>
        <Button size="sm" onClick={() => addNode(null)}>
          <Plus className="h-4 w-4 mr-1.5" />
          添加根节点
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allNodeIds} strategy={verticalListSortingStrategy}>
            {tree.map((node) => (
              <TreeNodeComponent key={node.id} node={node} depth={0} parentId={null} />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeNode && (
              <div className="bg-card border border-primary rounded-lg p-2 shadow-lg opacity-90">
                <span className="text-sm font-medium">{activeNode.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

const EditorContent: React.FC = () => {
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background">
      {/* Left Panel - Tree */}
      <div className="w-[400px] border-r border-border bg-card flex flex-col shrink-0">
        <TreePanel />
      </div>

      {/* Right Panel - Editor & JSON */}
      <div className={cn(
        'flex-1 flex flex-col transition-all duration-300',
        rightPanelCollapsed && 'w-12'
      )}>
        {/* Toggle Button */}
        <div className="flex items-center gap-2 p-2 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          >
            {rightPanelCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
          {!rightPanelCollapsed && (
            <span className="text-sm font-medium text-muted-foreground">
              节点编辑 & JSON 预览
            </span>
          )}
        </div>

        {!rightPanelCollapsed && (
          <Tabs defaultValue="editor" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-card px-4">
              <TabsTrigger value="editor" className="gap-2">
                <Settings className="h-4 w-4" />
                节点编辑
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <Code className="h-4 w-4" />
                JSON 输出
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex-1 m-0 overflow-auto bg-card">
              <NodeEditor />
            </TabsContent>
            <TabsContent value="json" className="flex-1 m-0 overflow-hidden bg-card">
              <JsonPreview />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export const KnowledgeTreeEditor: React.FC = () => {
  return (
    <TreeProvider>
      <EditorContent />
    </TreeProvider>
  );
};
