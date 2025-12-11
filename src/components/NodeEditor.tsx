import React from 'react';
import { useTree } from '@/context/TreeContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Tag, FileText, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconOptions = [
  { value: 'folder', label: '📁 文件夹' },
  { value: 'file-text', label: '📄 文档' },
  { value: 'code', label: '💻 代码' },
  { value: 'server', label: '🖥️ 服务器' },
  { value: 'database', label: '🗄️ 数据库' },
  { value: 'book', label: '📚 书籍' },
  { value: 'lightbulb', label: '💡 想法' },
];

export const NodeEditor: React.FC = () => {
  const { selectedNode, updateNode } = useTree();
  const [newTag, setNewTag] = React.useState('');

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

  const handleAddTag = () => {
    if (newTag.trim() && !selectedNode.tags?.includes(newTag.trim())) {
      updateNode(selectedNode.id, {
        tags: [...(selectedNode.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateNode(selectedNode.id, {
      tags: selectedNode.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {selectedNode.type === 'category' ? (
            <Folder className="h-5 w-5 text-primary" />
          ) : (
            <FileText className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">编辑节点</h3>
          <p className="text-xs text-muted-foreground">ID: {selectedNode.id}</p>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          节点标题
        </Label>
        <Input
          id="title"
          value={selectedNode.title}
          onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })}
          placeholder="输入节点标题"
          className="bg-background"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          描述
        </Label>
        <Textarea
          id="description"
          value={selectedNode.description || ''}
          onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
          placeholder="输入节点描述..."
          rows={3}
          className="bg-background resize-none"
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">节点类型</Label>
        <Select
          value={selectedNode.type}
          onValueChange={(value: 'category' | 'item') =>
            updateNode(selectedNode.id, { type: value })
          }
        >
          <SelectTrigger className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">📁 分类目录</SelectItem>
            <SelectItem value="item">📄 知识条目</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Icon */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">图标</Label>
        <Select
          value={selectedNode.icon || 'file-text'}
          onValueChange={(value) => updateNode(selectedNode.id, { icon: value })}
        >
          <SelectTrigger className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {iconOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          标签
        </Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="添加标签..."
            className="bg-background"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <Button onClick={handleAddTag} size="sm">
            添加
          </Button>
        </div>
        {selectedNode.tags && selectedNode.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedNode.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
