import React, { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { NodeLibrary } from './NodeLibrary';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { WorkflowNodeData } from '@/types/workflow';

export const WorkflowConfigurator: React.FC = () => {
  const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null);

  const handleNodeSelect = useCallback((node: Node<WorkflowNodeData> | null) => {
    setSelectedNode(node);
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, data: Partial<WorkflowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...data },
          };
        }
        return node;
      })
    );

    // 同步更新 selectedNode
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode((prev) =>
        prev ? { ...prev, data: { ...prev.data, ...data } } : null
      );
    }
  }, [selectedNode]);

  return (
    <div className="h-full flex flex-col">
      {/* 页面标题 */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <h1 className="text-xl font-bold text-foreground">审查流程配置器</h1>
        <p className="text-sm text-muted-foreground mt-1">
          可视化配置、拖拽式设计、实时预览
        </p>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：节点库 */}
        <NodeLibrary />

        {/* 中间：流程画布 */}
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          onNodeSelect={handleNodeSelect}
          onNodeUpdate={handleNodeUpdate}
        />

        {/* 右侧：节点配置 */}
        <NodeConfigPanel
          selectedNode={selectedNode}
          onNodeUpdate={handleNodeUpdate}
        />
      </div>
    </div>
  );
};
