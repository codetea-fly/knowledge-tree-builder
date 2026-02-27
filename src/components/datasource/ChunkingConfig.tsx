import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Scissors } from 'lucide-react';
import { ChunkingConfig as ChunkingConfigType, CHUNK_METHODS, ChunkMethod } from '@/types/rag';
import { cn } from '@/lib/utils';

interface ChunkingConfigProps {
  value: ChunkingConfigType;
  onChange: (value: ChunkingConfigType) => void;
}

export const ChunkingConfigPanel: React.FC<ChunkingConfigProps> = ({ value, onChange }) => {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scissors className="h-4 w-4 text-primary" />
          切片方法配置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Method Selection */}
        <div>
          <Label className="text-xs mb-2 block">切片方法</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {CHUNK_METHODS.map((m) => {
              const isSelected = value.method === m.method;
              return (
                <button
                  key={m.method}
                  onClick={() => onChange({ ...value, method: m.method })}
                  className={cn(
                    'flex items-start gap-2 p-2 rounded-md border text-left transition-all text-xs',
                    'hover:bg-muted/50',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border'
                  )}
                >
                  <div>
                    <div className={cn('font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                      {m.label}
                    </div>
                    <div className="text-muted-foreground text-[10px] leading-tight mt-0.5">
                      {m.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chunk Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">切片大小</Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {value.chunkSize} {value.sizeUnit === 'chars' ? '字符' : 'Tokens'}
              </Badge>
              <Select value={value.sizeUnit} onValueChange={(v) => onChange({ ...value, sizeUnit: v as any })}>
                <SelectTrigger className="h-6 text-[10px] w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chars">字符</SelectItem>
                  <SelectItem value="tokens">Tokens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Slider
            value={[value.chunkSize]}
            onValueChange={([v]) => onChange({ ...value, chunkSize: v })}
            min={100}
            max={4000}
            step={50}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>100</span>
            <span>4000</span>
          </div>
        </div>

        {/* Overlap */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">重叠大小</Label>
            <Badge variant="secondary" className="text-[10px]">
              {value.chunkOverlap} {value.sizeUnit === 'chars' ? '字符' : 'Tokens'}
            </Badge>
          </div>
          <Slider
            value={[value.chunkOverlap]}
            onValueChange={([v]) => onChange({ ...value, chunkOverlap: v })}
            min={0}
            max={Math.min(value.chunkSize, 500)}
            step={10}
          />
        </div>

        {/* Separators for recursive */}
        {value.method === 'recursive' && (
          <div>
            <Label className="text-xs">分隔符列表（每行一个）</Label>
            <Textarea
              value={(value.separators || []).join('\n')}
              onChange={(e) => onChange({ ...value, separators: e.target.value.split('\n').filter(Boolean) })}
              placeholder={'\\n\\n\n\\n\n。\n.'}
              className="text-xs h-20 font-mono"
            />
          </div>
        )}

        {/* Semantic threshold */}
        {value.method === 'semantic' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">语义相似度阈值</Label>
              <Badge variant="secondary" className="text-[10px]">
                {value.semanticThreshold ?? 0.5}
              </Badge>
            </div>
            <Slider
              value={[value.semanticThreshold ?? 0.5]}
              onValueChange={([v]) => onChange({ ...value, semanticThreshold: v })}
              min={0.1}
              max={0.95}
              step={0.05}
            />
          </div>
        )}

        {/* Toggles */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">清理多余空白</Label>
          <Switch
            checked={value.cleanWhitespace}
            onCheckedChange={(v) => onChange({ ...value, cleanWhitespace: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">移除页眉页脚</Label>
          <Switch
            checked={value.removeHeaders}
            onCheckedChange={(v) => onChange({ ...value, removeHeaders: v })}
          />
        </div>
      </CardContent>
    </Card>
  );
};
