export interface KnowledgeNode {
  id: string;
  title: string;
  description?: string;
  type: 'category' | 'item';
  icon?: string;
  tags?: string[];
  children?: KnowledgeNode[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    author?: string;
  };
}

export interface TreeContextType {
  selectedNode: KnowledgeNode | null;
  setSelectedNode: (node: KnowledgeNode | null) => void;
  updateNode: (id: string, updates: Partial<KnowledgeNode>) => void;
  addNode: (parentId: string | null) => void;
  deleteNode: (id: string) => void;
  moveNode: (nodeId: string, targetParentId: string | null, targetIndex: number) => void;
}
