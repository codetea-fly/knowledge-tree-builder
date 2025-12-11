import React from 'react';
import { useTree } from '@/context/TreeContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ProcessDomain, RelatedDomain } from '@/types/knowledge';
import { Folder, Link, FileText } from 'lucide-react';

const isProcessDomain = (node: ProcessDomain | RelatedDomain): node is ProcessDomain => {
  return 'charpter' in node;
};

export const NodeEditor: React.FC = () => {
  const { selectedNode, tree, setTree } = useTree();

  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">选择一个节点</h3>
        <p className="text-sm text-muted-foreground">
          点击左侧树状结构中的节点来编辑其内容
        </p>
      </div>
    );
  }

  const { node, path } = selectedNode;
  const isPD = isProcessDomain(node);

  const updateNodeField = (field: string, value: string | boolean) => {
    const newTree = JSON.parse(JSON.stringify(tree));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pathParts = path.match(/(\w+)\[(\d+)\]|\w+/g) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = newTree;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const match = part.match(/(\w+)\[(\d+)\]/);
      if (match) {
        current = current[match[1]][parseInt(match[2])];
      } else {
        current = current[part];
      }
    }
    
    const lastPart = pathParts[pathParts.length - 1];
    const lastMatch = lastPart.match(/(\w+)\[(\d+)\]/);
    if (lastMatch) {
      current[lastMatch[1]][parseInt(lastMatch[2])][field] = value;
    } else {
      current[lastPart][field] = value;
    }
    
    setTree(newTree);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {isPD ? (
            <Folder className="h-5 w-5 text-primary" />
          ) : (
            <Link className="h-5 w-5 text-accent" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            {isPD ? '编辑过程域' : '编辑关联域'}
          </h3>
          <p className="text-xs text-muted-foreground">路径: {path}</p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          名称 (name)
        </Label>
        <Input
          id="name"
          value={node.name}
          onChange={(e) => updateNodeField('name', e.target.value)}
          placeholder="输入名称"
          className="bg-background"
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium">
          类型 (type)
        </Label>
        <Input
          id="type"
          value={node.type}
          onChange={(e) => updateNodeField('type', e.target.value)}
          placeholder="如: ISO 9000过程组"
          className="bg-background"
        />
      </div>

      {/* Chapter (only for ProcessDomain) */}
      {isPD && (
        <div className="space-y-2">
          <Label htmlFor="charpter" className="text-sm font-medium">
            章节 (charpter)
          </Label>
          <Input
            id="charpter"
            value={(node as ProcessDomain).charpter}
            onChange={(e) => updateNodeField('charpter', e.target.value)}
            placeholder="如: 8.7"
            className="bg-background"
          />
        </div>
      )}

      {/* Query */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">查询条件 (query)</Label>
        <div className="flex items-center gap-3">
          <Switch
            checked={typeof node.query === 'string'}
            onCheckedChange={(checked) => {
              if (checked) {
                updateNodeField('query', '');
              } else {
                updateNodeField('query', false);
              }
            }}
          />
          <span className="text-sm text-muted-foreground">
            {typeof node.query === 'string' ? '使用查询字符串' : '禁用查询'}
          </span>
        </div>
        {typeof node.query === 'string' && (
          <Input
            value={node.query}
            onChange={(e) => updateNodeField('query', e.target.value)}
            placeholder="输入查询关键词"
            className="bg-background mt-2"
          />
        )}
      </div>

      {/* File (only for RelatedDomain) */}
      {!isPD && (
        <>
          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-medium">
              文件名 (file)
            </Label>
            <Input
              id="file"
              value={(node as RelatedDomain).file}
              onChange={(e) => updateNodeField('file', e.target.value)}
              placeholder="如: GJB 571A-2024"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_path" className="text-sm font-medium">
              文件路径 (file_path)
            </Label>
            <Input
              id="file_path"
              value={(node as RelatedDomain).file_path}
              onChange={(e) => updateNodeField('file_path', e.target.value)}
              placeholder="输入完整文件路径"
              className="bg-background"
            />
          </div>
        </>
      )}
    </div>
  );
};
