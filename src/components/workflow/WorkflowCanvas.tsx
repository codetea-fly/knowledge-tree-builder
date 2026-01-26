import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Save,
  Upload,
  Download,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { CustomNode } from './CustomNode';
import { NodeLibraryItem, WorkflowNodeData, WORKFLOW_STAGES } from '@/types/workflow';

const nodeTypes = {
  custom: CustomNode,
};

interface WorkflowCanvasProps {
  onNodeSelect: (node: Node<WorkflowNodeData> | null) => void;
  onNodeUpdate: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node<WorkflowNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  onNodeSelect,
  onNodeUpdate,
  nodes,
  edges,
  setNodes,
  setEdges,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: 'hsl(var(--primary))' },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const data = event.dataTransfer.getData('application/reactflow');

      if (!data || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      const nodeData: NodeLibraryItem = JSON.parse(data);

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node<WorkflowNodeData> = {
        id: `${nodeData.id}-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: nodeData.label,
          description: nodeData.description,
          nodeType: nodeData.type,
          category: nodeData.category,
          interactionType: nodeData.interactionType,
          color: nodeData.color,
          icon: nodeData.icon,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      toast.success(`已添加节点: ${nodeData.label}`);
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!previewMode) {
        onNodeSelect(node as Node<WorkflowNodeData>);
      }
    },
    [onNodeSelect, previewMode]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const handleSave = () => {
    const flowData = {
      nodes,
      edges,
      savedAt: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `workflow-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('流程已保存');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.nodes && data.edges) {
              setNodes(data.nodes);
              setEdges(data.edges);
              toast.success('流程已导入');
            }
          } catch (error) {
            toast.error('导入失败：文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    onNodeSelect(null);
    toast.success('画布已清空');
  };

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full relative">
      <ReactFlow
        nodes={nodes as any}
        edges={edges}
        onNodesChange={(changes) => {
          setNodes((nds) => {
            let result = [...nds];
            changes.forEach((change) => {
              if (change.type === 'position' && change.position) {
                const nodeIndex = result.findIndex((n) => n.id === change.id);
                if (nodeIndex !== -1) {
                  result[nodeIndex] = {
                    ...result[nodeIndex],
                    position: change.position,
                  };
                }
              } else if (change.type === 'remove') {
                result = result.filter((n) => n.id !== change.id);
              } else if (change.type === 'select') {
                const nodeIndex = result.findIndex((n) => n.id === change.id);
                if (nodeIndex !== -1) {
                  result[nodeIndex] = {
                    ...result[nodeIndex],
                    selected: change.selected,
                  };
                }
              }
            });
            return result;
          });
        }}
        onEdgesChange={(changes) => {
          setEdges((eds) => {
            let result = [...eds];
            changes.forEach((change) => {
              if (change.type === 'remove') {
                result = result.filter((e) => e.id !== change.id);
              }
            });
            return result;
          });
        }}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable={!previewMode}
        nodesConnectable={!previewMode}
        elementsSelectable={!previewMode}
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-card !border-border"
        />

        {/* 工具栏 */}
        <Panel position="top-right" className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-1.5"
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4" />
                退出预览
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                预览模式
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport} className="gap-1.5">
            <Upload className="h-4 w-4" />
            导入
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5">
            <Download className="h-4 w-4" />
            导出
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" />
            保存流程
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            清空
          </Button>
        </Panel>

        {/* 阶段标签 */}
        <Panel position="top-left" className="flex gap-2 flex-wrap max-w-[600px]">
          {WORKFLOW_STAGES.map((stage) => (
            <div
              key={stage.id}
              className="px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: stage.color,
                borderColor: stage.color,
              }}
            >
              {stage.label}
            </div>
          ))}
        </Panel>
      </ReactFlow>
    </div>
  );
};
