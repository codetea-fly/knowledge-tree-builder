import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Database, Search, Globe, Palette, Cpu, Table } from 'lucide-react';
import { VectorDBConfig as VectorDBConfigType, VECTOR_DB_TYPES, VectorDBType } from '@/types/rag';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Database, Search, Globe, Palette, Cpu, Table,
};

interface VectorDBConfigProps {
  value: VectorDBConfigType;
  onChange: (value: VectorDBConfigType) => void;
}

export const VectorDBConfigPanel: React.FC<VectorDBConfigProps> = ({ value, onChange }) => {
  const handleTypeChange = (type: VectorDBType) => {
    const dbInfo = VECTOR_DB_TYPES.find(d => d.type === type);
    onChange({
      ...value,
      type,
      port: dbInfo?.defaultPort ?? value.port,
    });
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          向量数据库连接
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* DB Type Selection */}
        <div className="grid grid-cols-3 gap-2">
          {VECTOR_DB_TYPES.map((db) => {
            const Icon = iconMap[db.icon] || Database;
            const isSelected = value.type === db.type;
            return (
              <button
                key={db.type}
                onClick={() => handleTypeChange(db.type)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all',
                  'hover:bg-muted/50',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border'
                )}
              >
                <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-xs font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                  {db.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected DB description */}
        <p className="text-xs text-muted-foreground">
          {VECTOR_DB_TYPES.find(d => d.type === value.type)?.description}
        </p>

        {/* Connection params */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">主机地址</Label>
            <Input
              value={value.host}
              onChange={(e) => onChange({ ...value, host: e.target.value })}
              placeholder="localhost"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">端口</Label>
            <Input
              type="number"
              value={value.port}
              onChange={(e) => onChange({ ...value, port: parseInt(e.target.value) || 0 })}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">API Key（可选）</Label>
          <Input
            type="password"
            value={value.apiKey || ''}
            onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
            placeholder="输入 API Key"
            className="h-8 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">集合名称</Label>
            <Input
              value={value.collection}
              onChange={(e) => onChange({ ...value, collection: e.target.value })}
              placeholder="knowledge_base"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">向量维度</Label>
            <Input
              type="number"
              value={value.dimension}
              onChange={(e) => onChange({ ...value, dimension: parseInt(e.target.value) || 768 })}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">距离度量</Label>
          <Select value={value.metric} onValueChange={(v) => onChange({ ...value, metric: v as any })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cosine">余弦相似度 (Cosine)</SelectItem>
              <SelectItem value="euclidean">欧氏距离 (Euclidean)</SelectItem>
              <SelectItem value="dot_product">点积 (Dot Product)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
