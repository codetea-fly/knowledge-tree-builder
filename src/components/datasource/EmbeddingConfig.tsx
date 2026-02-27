import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';
import { EmbeddingConfig as EmbeddingConfigType, EMBEDDING_MODELS, EmbeddingProvider } from '@/types/rag';

interface EmbeddingConfigProps {
  value: EmbeddingConfigType;
  onChange: (value: EmbeddingConfigType) => void;
  onDimensionChange?: (dim: number) => void;
}

export const EmbeddingConfigPanel: React.FC<EmbeddingConfigProps> = ({ value, onChange, onDimensionChange }) => {
  const currentProvider = EMBEDDING_MODELS.find(p => p.provider === value.provider);
  const currentModel = currentProvider?.models.find(m => m.id === value.modelId);

  const handleProviderChange = (provider: EmbeddingProvider) => {
    const providerInfo = EMBEDDING_MODELS.find(p => p.provider === provider);
    const firstModel = providerInfo?.models[0];
    const dim = firstModel?.dimension ?? 768;
    onChange({
      ...value,
      provider,
      modelId: firstModel?.id ?? '',
      dimension: dim,
    });
    onDimensionChange?.(dim);
  };

  const handleModelChange = (modelId: string) => {
    const model = currentProvider?.models.find(m => m.id === modelId);
    const dim = model?.dimension ?? value.dimension;
    onChange({
      ...value,
      modelId,
      dimension: dim,
    });
    onDimensionChange?.(dim);
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Embedding 模型
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">模型供应商</Label>
          <Select value={value.provider} onValueChange={handleProviderChange}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMBEDDING_MODELS.map(p => (
                <SelectItem key={p.provider} value={p.provider}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">模型</Label>
          <Select value={value.modelId} onValueChange={handleModelChange}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentProvider?.models.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <span>{m.name}</span>
                    <Badge variant="outline" className="text-[10px] h-4">
                      {m.dimension}d
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">向量维度</Label>
            <Input
              type="number"
              value={value.dimension}
              onChange={(e) => {
                const dim = parseInt(e.target.value) || 768;
                onChange({ ...value, dimension: dim });
                onDimensionChange?.(dim);
              }}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">批处理大小</Label>
            <Input
              type="number"
              value={value.batchSize}
              onChange={(e) => onChange({ ...value, batchSize: parseInt(e.target.value) || 32 })}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Custom endpoint */}
        {value.provider === 'custom' && (
          <>
            <div>
              <Label className="text-xs">API 端点</Label>
              <Input
                value={value.apiEndpoint || ''}
                onChange={(e) => onChange({ ...value, apiEndpoint: e.target.value })}
                placeholder="https://your-embedding-api.com/v1/embeddings"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">API Key</Label>
              <Input
                type="password"
                value={value.apiKey || ''}
                onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
                placeholder="输入 API Key"
                className="h-8 text-sm"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
