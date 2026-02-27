import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Database, Scissors, Layers, ArrowUpDown, Download, Upload } from 'lucide-react';
import { RAGConfig, createDefaultRAGConfig } from '@/types/rag';
import { VectorDBConfigPanel } from './VectorDBConfig';
import { ChunkingConfigPanel } from './ChunkingConfig';
import { ChunkPreviewPanel } from './ChunkPreview';
import { EmbeddingConfigPanel } from './EmbeddingConfig';
import { RerankConfigPanel } from './RerankConfig';

export const DataSourceConfig: React.FC = () => {
  const [config, setConfig] = useState<RAGConfig>(createDefaultRAGConfig);

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rag-config.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('RAG 配置已导出');
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as RAGConfig;
          setConfig(data);
          toast.success('RAG 配置已导入');
        } catch {
          toast.error('导入失败：JSON 格式无效');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">RAG 知识库配置</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImportJSON} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            导入
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            导出
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vectordb" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-card px-4 shrink-0">
          <TabsTrigger value="vectordb" className="gap-1.5 text-xs">
            <Database className="h-3.5 w-3.5" />
            向量数据库
          </TabsTrigger>
          <TabsTrigger value="chunking" className="gap-1.5 text-xs">
            <Scissors className="h-3.5 w-3.5" />
            切片配置
          </TabsTrigger>
          <TabsTrigger value="embedding" className="gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5" />
            Embedding
          </TabsTrigger>
          <TabsTrigger value="rerank" className="gap-1.5 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5" />
            重排序
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="vectordb" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <VectorDBConfigPanel
                  value={config.vectorDB}
                  onChange={(vectorDB) => setConfig(prev => ({ ...prev, vectorDB }))}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chunking" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <ChunkingConfigPanel
                  value={config.chunking}
                  onChange={(chunking) => setConfig(prev => ({ ...prev, chunking }))}
                />
                <ChunkPreviewPanel chunkingConfig={config.chunking} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="embedding" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <EmbeddingConfigPanel
                  value={config.embedding}
                  onChange={(embedding) => setConfig(prev => ({ ...prev, embedding }))}
                  onDimensionChange={(dim) => setConfig(prev => ({
                    ...prev,
                    vectorDB: { ...prev.vectorDB, dimension: dim },
                  }))}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rerank" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <RerankConfigPanel
                  value={config.rerank}
                  onChange={(rerank) => setConfig(prev => ({ ...prev, rerank }))}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
