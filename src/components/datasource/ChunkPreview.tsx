import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Upload, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { ChunkingConfig, ChunkPreviewItem } from '@/types/rag';
import { cn } from '@/lib/utils';

const SAMPLE_TEXT = `第一章 质量管理体系总要求

1.1 组织应按照本标准的要求建立质量管理体系，形成文件，加以实施和保持，并持续改进其有效性。组织应识别质量管理体系所需的过程及其在整个组织中的应用。

1.2 组织应确定这些过程的顺序和相互作用，确定为确保这些过程的有效运行和控制所需的准则和方法。确保可以获得必要的资源和信息，以支持这些过程的运行和对这些过程的监视。

第二章 管理职责

2.1 最高管理者应通过以下活动，对其建立、实施质量管理体系并持续改进其有效性的承诺提供证据：向组织传达满足顾客要求和法律法规要求的重要性。

2.2 制定质量方针和质量目标。进行管理评审，确保资源的获得。最高管理者应以增强顾客满意为目的，确保顾客要求得到确定并予以满足。

第三章 资源管理

3.1 组织应确定并提供以下方面所需的资源：实施、保持质量管理体系并持续改进其有效性。通过满足顾客要求，增强顾客满意。

3.2 基于适当的教育、培训、技能和经验，从事影响产品质量工作的人员应是能够胜任的。组织应确定从事影响产品质量工作的人员所必要的能力。`;

// Simple chunking simulator
function simulateChunking(text: string, config: ChunkingConfig): ChunkPreviewItem[] {
  const { chunkSize, chunkOverlap, method } = config;
  const chunks: ChunkPreviewItem[] = [];

  if (method === 'paragraph') {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    let currentChunk = '';
    let idx = 0;

    for (const para of paragraphs) {
      if (currentChunk && (currentChunk.length + para.length) > chunkSize) {
        chunks.push({
          index: idx++,
          content: currentChunk.trim(),
          charCount: currentChunk.trim().length,
          tokenEstimate: Math.ceil(currentChunk.trim().length / 1.5),
        });
        // overlap: keep last part
        currentChunk = currentChunk.slice(-chunkOverlap) + '\n\n' + para;
      } else {
        currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
      }
    }
    if (currentChunk.trim()) {
      chunks.push({
        index: idx,
        content: currentChunk.trim(),
        charCount: currentChunk.trim().length,
        tokenEstimate: Math.ceil(currentChunk.trim().length / 1.5),
      });
    }
  } else {
    // Fixed size / recursive
    let start = 0;
    let idx = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const content = text.slice(start, end);
      chunks.push({
        index: idx++,
        content,
        charCount: content.length,
        tokenEstimate: Math.ceil(content.length / 1.5),
        overlapStart: start > 0 ? 0 : undefined,
      });
      start = end - chunkOverlap;
      if (start >= text.length) break;
      if (end === text.length) break;
    }
  }

  return chunks;
}

interface ChunkPreviewProps {
  chunkingConfig: ChunkingConfig;
}

export const ChunkPreviewPanel: React.FC<ChunkPreviewProps> = ({ chunkingConfig }) => {
  const [sourceText, setSourceText] = useState(SAMPLE_TEXT);
  const [showSource, setShowSource] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());

  const chunks = useMemo(() => simulateChunking(sourceText, chunkingConfig), [sourceText, chunkingConfig]);

  const toggleChunk = (idx: number) => {
    setExpandedChunks(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  // Color palette for chunks
  const chunkColors = [
    'bg-primary/10 border-primary/30',
    'bg-accent/10 border-accent/30',
    'bg-warning/10 border-warning/30',
    'bg-destructive/10 border-destructive/30',
    'bg-success/10 border-success/30',
    'bg-secondary border-secondary-foreground/20',
  ];

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            切片预览
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {chunks.length} 个切片
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowSource(!showSource)}
            >
              <FileText className="h-3 w-3 mr-1" />
              {showSource ? '隐藏原文' : '编辑原文'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Source text editor */}
        {showSource && (
          <Textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="粘贴或输入文本以预览切片效果..."
            className="text-xs font-mono h-32"
          />
        )}

        {/* Stats */}
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span>原文: {sourceText.length} 字符</span>
          <span>切片数: {chunks.length}</span>
          <span>平均大小: {chunks.length ? Math.round(chunks.reduce((s, c) => s + c.charCount, 0) / chunks.length) : 0} 字符</span>
        </div>

        {/* Visual chunk map */}
        <div className="flex gap-0.5 h-6 rounded overflow-hidden border border-border">
          {chunks.map((chunk, i) => (
            <div
              key={i}
              className={cn(
                'h-full transition-all cursor-pointer hover:opacity-80',
                chunkColors[i % chunkColors.length].split(' ')[0],
                expandedChunks.has(i) && 'ring-2 ring-primary'
              )}
              style={{ flex: chunk.charCount }}
              onClick={() => toggleChunk(i)}
              title={`切片 ${i + 1}: ${chunk.charCount} 字符`}
            />
          ))}
        </div>

        {/* Chunk list */}
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-1.5">
            {chunks.map((chunk, i) => {
              const isExpanded = expandedChunks.has(i);
              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-md border p-2 cursor-pointer transition-all',
                    chunkColors[i % chunkColors.length],
                  )}
                  onClick={() => toggleChunk(i)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] h-4">
                        #{i + 1}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {chunk.charCount} 字符 · ~{chunk.tokenEstimate} tokens
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                  {isExpanded ? (
                    <div className="mt-2 text-xs font-mono whitespace-pre-wrap text-foreground/80 leading-relaxed max-h-40 overflow-auto">
                      {chunk.content}
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] text-muted-foreground truncate">
                      {chunk.content.slice(0, 80)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
