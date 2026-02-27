// ============ 向量数据库配置 ============

export type VectorDBType = 'milvus' | 'qdrant' | 'weaviate' | 'chroma' | 'faiss' | 'pgvector';

export interface VectorDBTypeInfo {
  type: VectorDBType;
  label: string;
  description: string;
  icon: string;
  defaultPort: number;
}

export const VECTOR_DB_TYPES: VectorDBTypeInfo[] = [
  { type: 'milvus', label: 'Milvus', description: '高性能分布式向量数据库，适合大规模生产环境', icon: 'Database', defaultPort: 19530 },
  { type: 'qdrant', label: 'Qdrant', description: '高效的向量相似度搜索引擎，支持过滤', icon: 'Search', defaultPort: 6333 },
  { type: 'weaviate', label: 'Weaviate', description: '开源向量搜索引擎，支持 GraphQL', icon: 'Globe', defaultPort: 8080 },
  { type: 'chroma', label: 'Chroma', description: '轻量级嵌入式向量数据库，适合开发和原型', icon: 'Palette', defaultPort: 8000 },
  { type: 'faiss', label: 'FAISS', description: 'Facebook 开源的高效相似性搜索库', icon: 'Cpu', defaultPort: 0 },
  { type: 'pgvector', label: 'PGVector', description: 'PostgreSQL 向量扩展，与现有 PG 集成', icon: 'Table', defaultPort: 5432 },
];

export interface VectorDBConfig {
  type: VectorDBType;
  host: string;
  port: number;
  apiKey?: string;
  collection: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dot_product';
}

export const createDefaultVectorDBConfig = (): VectorDBConfig => ({
  type: 'milvus',
  host: 'localhost',
  port: 19530,
  collection: 'knowledge_base',
  dimension: 768,
  metric: 'cosine',
});

// ============ 切片方法配置 ============

export type ChunkMethod =
  | 'fixed_size'        // 固定大小切片
  | 'recursive'         // 递归字符分割
  | 'paragraph'         // 按段落分割
  | 'sentence'          // 按句子分割
  | 'semantic'          // 语义分割
  | 'markdown_header'   // Markdown 标题分割
  | 'html_section';     // HTML 节分割

export interface ChunkMethodInfo {
  method: ChunkMethod;
  label: string;
  description: string;
  icon: string;
}

export const CHUNK_METHODS: ChunkMethodInfo[] = [
  { method: 'fixed_size', label: '固定大小', description: '按固定字符数或Token数切片，简单高效', icon: 'Scissors' },
  { method: 'recursive', label: '递归分割', description: '递归按分隔符分割，保留语义完整性（推荐）', icon: 'GitFork' },
  { method: 'paragraph', label: '段落分割', description: '按段落自然分界切片，适合结构化文档', icon: 'AlignLeft' },
  { method: 'sentence', label: '句子分割', description: '按句子边界切分，适合精细检索', icon: 'Type' },
  { method: 'semantic', label: '语义分割', description: '基于Embedding语义相似度自动分割', icon: 'Brain' },
  { method: 'markdown_header', label: 'Markdown标题', description: '按Markdown标题层级分割', icon: 'Hash' },
  { method: 'html_section', label: 'HTML节分割', description: '按HTML标签结构分割', icon: 'Code' },
];

export interface ChunkingConfig {
  method: ChunkMethod;
  chunkSize: number;         // 切片大小（字符数或Token数）
  chunkOverlap: number;      // 重叠大小
  sizeUnit: 'chars' | 'tokens';
  separators?: string[];     // 自定义分隔符（递归分割时使用）
  // 语义分割参数
  semanticThreshold?: number; // 语义相似度阈值
  // 通用
  cleanWhitespace: boolean;
  removeHeaders: boolean;
}

export const createDefaultChunkingConfig = (): ChunkingConfig => ({
  method: 'recursive',
  chunkSize: 500,
  chunkOverlap: 50,
  sizeUnit: 'chars',
  separators: ['\\n\\n', '\\n', '。', '！', '？', '.', '!', '?', ' '],
  cleanWhitespace: true,
  removeHeaders: false,
});

// ============ 切片预览 ============

export interface ChunkPreviewItem {
  index: number;
  content: string;
  charCount: number;
  tokenEstimate: number;
  overlapStart?: number; // 重叠开始位置（字符索引）
}

// ============ Embedding 模型配置 ============

export type EmbeddingProvider = 'openai' | 'bge' | 'jina' | 'cohere' | 'm3e' | 'custom';

export interface EmbeddingModelInfo {
  provider: EmbeddingProvider;
  label: string;
  models: { id: string; name: string; dimension: number }[];
}

export const EMBEDDING_MODELS: EmbeddingModelInfo[] = [
  {
    provider: 'openai',
    label: 'OpenAI',
    models: [
      { id: 'text-embedding-3-large', name: 'text-embedding-3-large', dimension: 3072 },
      { id: 'text-embedding-3-small', name: 'text-embedding-3-small', dimension: 1536 },
      { id: 'text-embedding-ada-002', name: 'text-embedding-ada-002', dimension: 1536 },
    ],
  },
  {
    provider: 'bge',
    label: 'BGE (BAAI)',
    models: [
      { id: 'bge-large-zh-v1.5', name: 'BGE-Large-ZH v1.5', dimension: 1024 },
      { id: 'bge-base-zh-v1.5', name: 'BGE-Base-ZH v1.5', dimension: 768 },
      { id: 'bge-small-zh-v1.5', name: 'BGE-Small-ZH v1.5', dimension: 512 },
      { id: 'bge-m3', name: 'BGE-M3 (多语言)', dimension: 1024 },
    ],
  },
  {
    provider: 'jina',
    label: 'Jina AI',
    models: [
      { id: 'jina-embeddings-v3', name: 'Jina Embeddings v3', dimension: 1024 },
      { id: 'jina-embeddings-v2-base-zh', name: 'Jina v2 Base (中文)', dimension: 768 },
    ],
  },
  {
    provider: 'cohere',
    label: 'Cohere',
    models: [
      { id: 'embed-multilingual-v3.0', name: 'Embed Multilingual v3', dimension: 1024 },
      { id: 'embed-english-v3.0', name: 'Embed English v3', dimension: 1024 },
    ],
  },
  {
    provider: 'm3e',
    label: 'M3E (国产)',
    models: [
      { id: 'm3e-large', name: 'M3E-Large', dimension: 1024 },
      { id: 'm3e-base', name: 'M3E-Base', dimension: 768 },
    ],
  },
  {
    provider: 'custom',
    label: '自定义模型',
    models: [
      { id: 'custom', name: '自定义Embedding端点', dimension: 768 },
    ],
  },
];

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  modelId: string;
  dimension: number;
  apiEndpoint?: string;  // 自定义端点
  apiKey?: string;
  batchSize: number;
}

export const createDefaultEmbeddingConfig = (): EmbeddingConfig => ({
  provider: 'bge',
  modelId: 'bge-base-zh-v1.5',
  dimension: 768,
  batchSize: 32,
});

// ============ 重排序配置 ============

export type RerankMethod = 'none' | 'bm25' | 'bge_reranker' | 'cohere_rerank' | 'cross_encoder' | 'rrf';

export interface RerankMethodInfo {
  method: RerankMethod;
  label: string;
  description: string;
}

export const RERANK_METHODS: RerankMethodInfo[] = [
  { method: 'none', label: '不使用', description: '直接使用向量相似度排序' },
  { method: 'bm25', label: 'BM25', description: '经典文本检索算法，基于词频统计的稀疏检索' },
  { method: 'bge_reranker', label: 'BGE-Reranker', description: 'BAAI 出品的跨编码器重排序模型，中文效果优秀' },
  { method: 'cohere_rerank', label: 'Cohere Rerank', description: 'Cohere 的商业重排序 API，多语言支持' },
  { method: 'cross_encoder', label: 'Cross-Encoder', description: '自定义交叉编码器模型，精度最高但较慢' },
  { method: 'rrf', label: 'RRF 融合', description: 'Reciprocal Rank Fusion，融合多路召回结果' },
];

export interface RerankConfig {
  method: RerankMethod;
  topK: number;
  // BM25 参数
  bm25K1?: number;
  bm25B?: number;
  // 模型重排序参数
  rerankModelEndpoint?: string;
  rerankModelApiKey?: string;
  // RRF 参数
  rrfK?: number;
  // 通用
  scoreThreshold?: number;
}

export const createDefaultRerankConfig = (): RerankConfig => ({
  method: 'bge_reranker',
  topK: 5,
  scoreThreshold: 0.3,
});

// ============ 完整RAG配置 ============

export interface RAGConfig {
  vectorDB: VectorDBConfig;
  chunking: ChunkingConfig;
  embedding: EmbeddingConfig;
  rerank: RerankConfig;
}

export const createDefaultRAGConfig = (): RAGConfig => ({
  vectorDB: createDefaultVectorDBConfig(),
  chunking: createDefaultChunkingConfig(),
  embedding: createDefaultEmbeddingConfig(),
  rerank: createDefaultRerankConfig(),
});
