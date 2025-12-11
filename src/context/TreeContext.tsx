import React, { createContext, useContext, useState, useCallback } from 'react';
import { KnowledgeTree, KnowledgeNode, TreeContextType, RelatedDomain } from '@/types/knowledge';

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

// Helper to update nested related_domains by path
const updateNestedRelatedDomains = (
  domains: RelatedDomain[],
  pathParts: string[],
  updater: (domains: RelatedDomain[]) => RelatedDomain[]
): RelatedDomain[] => {
  if (pathParts.length === 0) {
    return updater(domains);
  }
  
  const [current, ...rest] = pathParts;
  const index = parseInt(current, 10);
  
  return domains.map((d, i) => {
    if (i === index) {
      return {
        ...d,
        related_domains: updateNestedRelatedDomains(d.related_domains, rest, updater),
      };
    }
    return d;
  });
};

export const TreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tree, setTree] = useState<KnowledgeTree>(initialTree);
  const [selectedNode, setSelectedNode] = useState<{ node: KnowledgeNode; path: string } | null>(null);

  const addRelatedDomainByPath = useCallback((path: string) => {
    const newDomain: RelatedDomain = {
      name: '新关联域',
      type: '企业过程域',
      file: '',
      file_path: '',
      query: false,
      related_domains: [],
    };

    setTree((prev) => {
      // Parse path like "process_domains[0].related_domains[1].related_domains[0]"
      const match = path.match(/process_domains\[(\d+)\](.*)/);
      if (!match) return prev;

      const pdIndex = parseInt(match[1], 10);
      const restPath = match[2];

      const newDomains = [...prev.process_domains];
      const pd = { ...newDomains[pdIndex] };

      if (!restPath || restPath === '') {
        // Adding to process domain directly
        pd.related_domains = [...pd.related_domains, newDomain];
      } else {
        // Extract nested path indices
        const indices = [...restPath.matchAll(/\.related_domains\[(\d+)\]/g)].map(m => m[1]);
        pd.related_domains = updateNestedRelatedDomains(
          pd.related_domains,
          indices,
          (domains) => [...domains, newDomain]
        );
      }

      newDomains[pdIndex] = pd;
      return { ...prev, process_domains: newDomains };
    });
  }, []);

  const deleteRelatedDomainByPath = useCallback((path: string) => {
    setTree((prev) => {
      // Parse path like "process_domains[0].related_domains[1]"
      const match = path.match(/process_domains\[(\d+)\]\.related_domains\[(\d+)\](.*)/);
      if (!match) return prev;

      const pdIndex = parseInt(match[1], 10);
      const firstRelatedIndex = parseInt(match[2], 10);
      const restPath = match[3];

      const newDomains = [...prev.process_domains];
      const pd = { ...newDomains[pdIndex] };

      if (!restPath || restPath === '') {
        // Delete from process domain's related_domains
        pd.related_domains = pd.related_domains.filter((_, i) => i !== firstRelatedIndex);
      } else {
        // Need to delete from nested path
        const allMatches = [...path.matchAll(/\.related_domains\[(\d+)\]/g)];
        const indices = allMatches.slice(0, -1).map(m => m[1]); // All but last
        const deleteIndex = parseInt(allMatches[allMatches.length - 1][1], 10);
        
        pd.related_domains = updateNestedRelatedDomains(
          pd.related_domains,
          indices,
          (domains) => domains.filter((_, i) => i !== deleteIndex)
        );
      }

      newDomains[pdIndex] = pd;
      return { ...prev, process_domains: newDomains };
    });

    // Clear selection if deleted node was selected
    setSelectedNode((prev) => {
      if (prev && prev.path.startsWith(path)) {
        return null;
      }
      return prev;
    });
  }, []);

  return (
    <TreeContext.Provider value={{ 
      tree, 
      setTree, 
      selectedNode, 
      setSelectedNode,
      addRelatedDomainByPath,
      deleteRelatedDomainByPath,
    }}>
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
