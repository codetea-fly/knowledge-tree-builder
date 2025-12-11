import React, { createContext, useContext, useState } from 'react';
import { KnowledgeTree, KnowledgeNode, TreeContextType } from '@/types/knowledge';

const TreeContext = createContext<TreeContextType | null>(null);

const initialTree: KnowledgeTree = {
  file: 'GJB9001C',
  file_path: '',
  process_domains: [
    {
      name: '不合格品控制',
      type: 'ISO 9000过程组',
      query: '不合格输出',
      charpter: '8.7',
      related_domains: [
        {
          name: '产品管理',
          type: '企业过程域',
          file: 'GJB 571A-2024',
          file_path: '',
          query: false,
          related_domains: [],
        },
      ],
    },
    {
      name: '采购',
      type: 'ISO 9000过程组',
      query: '采购',
      charpter: '8.4',
      related_domains: [],
    },
  ],
};

export const TreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tree, setTree] = useState<KnowledgeTree>(initialTree);
  const [selectedNode, setSelectedNode] = useState<{ node: KnowledgeNode; path: string } | null>(null);

  return (
    <TreeContext.Provider value={{ tree, setTree, selectedNode, setSelectedNode }}>
      {children}
    </TreeContext.Provider>
  );
};

export const useTree = () => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTree must be used within a TreeProvider');
  }
  return context;
};
