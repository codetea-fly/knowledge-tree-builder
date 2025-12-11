import React, { useState } from 'react';
import { useTree } from '@/context/TreeContext';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { KnowledgeTree } from '@/types/knowledge';

export const JsonPreview: React.FC = () => {
  const { tree, setTree } = useTree();
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(tree, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast.success('JSON 已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('JSON 文件已下载');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text) as KnowledgeTree;
          if (data.file !== undefined && data.process_domains !== undefined) {
            setTree(data);
            toast.success('JSON 文件已导入');
          } else {
            toast.error('JSON 格式不正确，需要包含 file 和 process_domains 字段');
          }
        } catch {
          toast.error('无效的 JSON 文件');
        }
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">JSON 预览</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-1.5" />
            导入
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1.5" />
            下载
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 mr-1.5 text-success" />
            ) : (
              <Copy className="h-4 w-4 mr-1.5" />
            )}
            {copied ? '已复制' : '复制'}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs font-mono text-muted-foreground bg-muted/50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
};
