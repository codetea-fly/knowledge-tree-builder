export interface RelatedDomain {
  name: string;
  type: string;
  file: string;
  file_path: string;
  query: string | false;
  related_domains: RelatedDomain[];
}

export interface ProcessDomain {
  name: string;
  type: string;
  query: string | false;
  charpter: string;
  related_domains: RelatedDomain[];
}

export interface KnowledgeTree {
  file: string;
  file_path: string;
  process_domains: ProcessDomain[];
}

export type KnowledgeNode = ProcessDomain | RelatedDomain;

export interface TreeContextType {
  tree: KnowledgeTree;
  setTree: React.Dispatch<React.SetStateAction<KnowledgeTree>>;
  selectedNode: { node: KnowledgeNode; path: string } | null;
  setSelectedNode: React.Dispatch<React.SetStateAction<{ node: KnowledgeNode; path: string } | null>>;
  addRelatedDomainByPath: (path: string) => void;
  deleteRelatedDomainByPath: (path: string) => void;
}
