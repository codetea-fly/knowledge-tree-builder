import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { RerankConfig as RerankConfigType, RERANK_METHODS, RerankMethod } from '@/types/rag';
import { cn } from '@/lib/utils';

interface RerankConfigProps {
  value: RerankConfigType;
  onChange: (value: RerankConfigType) => void;
}

export const RerankConfigPanel: React.FC<RerankConfigProps> = ({ value, onChange }) => {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-primary" />
          重排序方法
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Method selection */}
        <div className="space-y-1.5">
          {RERANK_METHODS.map((m) => {
            const isSelected = value.method === m.method;
            return (
              <button
                key={m.method}
                onClick={() => onChange({ ...value, method: m.method })}
                className={cn(
                  'w-full flex items-start gap-2 p-2 rounded-md border text-left transition-all text-xs',
                  'hover:bg-muted/50',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border'
                )}
              >
                <div className="flex-1">
                  <div className={cn('font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                    {m.label}
                  </div>
                  <div className="text-muted-foreground text-[10px] mt-0.5">{m.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {value.method !== 'none' && (
          <>
            {/* Top K */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">返回 Top-K</Label>
                <Badge variant="secondary" className="text-[10px]">{value.topK}</Badge>
              </div>
              <Slider
                value={[value.topK]}
                onValueChange={([v]) => onChange({ ...value, topK: v })}
                min={1}
                max={20}
                step={1}
              />
            </div>

            {/* Score threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">分数阈值</Label>
                <Badge variant="secondary" className="text-[10px]">{value.scoreThreshold ?? 0.3}</Badge>
              </div>
              <Slider
                value={[value.scoreThreshold ?? 0.3]}
                onValueChange={([v]) => onChange({ ...value, scoreThreshold: v })}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          </>
        )}

        {/* BM25 params */}
        {value.method === 'bm25' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">k1 参数</Label>
              <Input
                type="number"
                value={value.bm25K1 ?? 1.5}
                onChange={(e) => onChange({ ...value, bm25K1: parseFloat(e.target.value) || 1.5 })}
                className="h-8 text-sm"
                step={0.1}
              />
            </div>
            <div>
              <Label className="text-xs">b 参数</Label>
              <Input
                type="number"
                value={value.bm25B ?? 0.75}
                onChange={(e) => onChange({ ...value, bm25B: parseFloat(e.target.value) || 0.75 })}
                className="h-8 text-sm"
                step={0.05}
              />
            </div>
          </div>
        )}

        {/* Model reranker params */}
        {(value.method === 'bge_reranker' || value.method === 'cohere_rerank' || value.method === 'cross_encoder') && (
          <>
            <div>
              <Label className="text-xs">模型端点</Label>
              <Input
                value={value.rerankModelEndpoint || ''}
                onChange={(e) => onChange({ ...value, rerankModelEndpoint: e.target.value })}
                placeholder="https://your-reranker-api/v1/rerank"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">API Key</Label>
              <Input
                type="password"
                value={value.rerankModelApiKey || ''}
                onChange={(e) => onChange({ ...value, rerankModelApiKey: e.target.value })}
                placeholder="输入 API Key"
                className="h-8 text-sm"
              />
            </div>
          </>
        )}

        {/* RRF params */}
        {value.method === 'rrf' && (
          <div>
            <Label className="text-xs">RRF K 常数</Label>
            <Input
              type="number"
              value={value.rrfK ?? 60}
              onChange={(e) => onChange({ ...value, rrfK: parseInt(e.target.value) || 60 })}
              className="h-8 text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
