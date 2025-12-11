import React, { createContext, useContext, useState, useCallback } from 'react';
import { KnowledgeNode, TreeContextType } from '@/types/knowledge';

const TreeContext = createContext<TreeContextType | null>(null);

const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const initialTree: KnowledgeNode[] = [
  {
    id: 'root_1',
    title: '知识库根节点',
    description: '这是知识库的根节点，点击编辑或拖拽排序',
    type: 'category',
    icon: 'folder',
    tags: ['根目录'],
    children: [
      {
        id: 'cat_1',
        title: '前端开发',
        description: '前端开发相关知识',
        type: 'category',
        icon: 'code',
        children: [
          {
            id: 'item_1',
            title: 'React 基础',
            description: 'React 框架入门指南',
            type: 'item',
            icon: 'file-text',
            tags: ['React', '入门'],
          },
          {
            id: 'item_2',
            title: 'TypeScript 进阶',
            description: 'TypeScript 高级特性详解',
            type: 'item',
            icon: 'file-text',
            tags: ['TypeScript', '进阶'],
          },
        ],
      },
      {
        id: 'cat_2',
        title: '后端开发',
        description: '后端开发相关知识',
        type: 'category',
        icon: 'server',
        children: [],
      },
    ],
  },
];

export const TreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tree, setTree] = useState<KnowledgeNode[]>(initialTree);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

  const findAndUpdate = useCallback(
    (nodes: KnowledgeNode[], id: string, updates: Partial<KnowledgeNode>): KnowledgeNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          const updated = { ...node, ...updates };
          if (selectedNode?.id === id) {
            setSelectedNode(updated);
          }
          return updated;
        }
        if (node.children) {
          return { ...node, children: findAndUpdate(node.children, id, updates) };
        }
        return node;
      });
    },
    [selectedNode]
  );

  const updateNode = useCallback(
    (id: string, updates: Partial<KnowledgeNode>) => {
      setTree((prev) => findAndUpdate(prev, id, updates));
    },
    [findAndUpdate]
  );

  const findParentAndAddChild = useCallback(
    (nodes: KnowledgeNode[], parentId: string | null, newNode: KnowledgeNode): KnowledgeNode[] => {
      if (parentId === null) {
        return [...nodes, newNode];
      }
      return nodes.map((node) => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...(node.children || []), newNode],
          };
        }
        if (node.children) {
          return { ...node, children: findParentAndAddChild(node.children, parentId, newNode) };
        }
        return node;
      });
    },
    []
  );

  const addNode = useCallback(
    (parentId: string | null) => {
      const newNode: KnowledgeNode = {
        id: generateId(),
        title: '新节点',
        description: '',
        type: parentId ? 'item' : 'category',
        icon: parentId ? 'file-text' : 'folder',
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };
      setTree((prev) => findParentAndAddChild(prev, parentId, newNode));
      setSelectedNode(newNode);
    },
    [findParentAndAddChild]
  );

  const deleteNodeRecursive = useCallback(
    (nodes: KnowledgeNode[], id: string): KnowledgeNode[] => {
      return nodes
        .filter((node) => node.id !== id)
        .map((node) => ({
          ...node,
          children: node.children ? deleteNodeRecursive(node.children, id) : undefined,
        }));
    },
    []
  );

  const deleteNode = useCallback(
    (id: string) => {
      setTree((prev) => deleteNodeRecursive(prev, id));
      if (selectedNode?.id === id) {
        setSelectedNode(null);
      }
    },
    [deleteNodeRecursive, selectedNode]
  );

  const moveNode = useCallback(
    (nodeId: string, targetParentId: string | null, targetIndex: number) => {
      let movedNode: KnowledgeNode | null = null;

      const removeNode = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
        return nodes
          .filter((node) => {
            if (node.id === nodeId) {
              movedNode = node;
              return false;
            }
            return true;
          })
          .map((node) => ({
            ...node,
            children: node.children ? removeNode(node.children) : undefined,
          }));
      };

      const insertNode = (
        nodes: KnowledgeNode[],
        parentId: string | null,
        index: number,
        nodeToInsert: KnowledgeNode
      ): KnowledgeNode[] => {
        if (parentId === null) {
          const newNodes = [...nodes];
          newNodes.splice(index, 0, nodeToInsert);
          return newNodes;
        }
        return nodes.map((node) => {
          if (node.id === parentId) {
            const children = [...(node.children || [])];
            children.splice(index, 0, nodeToInsert);
            return { ...node, children };
          }
          if (node.children) {
            return { ...node, children: insertNode(node.children, parentId, index, nodeToInsert) };
          }
          return node;
        });
      };

      setTree((prev) => {
        const afterRemoval = removeNode(prev);
        if (movedNode) {
          return insertNode(afterRemoval, targetParentId, targetIndex, movedNode);
        }
        return afterRemoval;
      });
    },
    []
  );

  return (
    <TreeContext.Provider
      value={{
        selectedNode,
        setSelectedNode,
        updateNode,
        addNode,
        deleteNode,
        moveNode,
        tree,
        setTree,
      } as TreeContextType & { tree: KnowledgeNode[]; setTree: React.Dispatch<React.SetStateAction<KnowledgeNode[]>> }}
    >
      {children}
    </TreeContext.Provider>
  );
};

export const useTree = () => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTree must be used within a TreeProvider');
  }
  return context as TreeContextType & { tree: KnowledgeNode[]; setTree: React.Dispatch<React.SetStateAction<KnowledgeNode[]>> };
};
