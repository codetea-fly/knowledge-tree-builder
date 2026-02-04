import React, { useState, useCallback } from 'react';
import { WorkflowStep } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, File, X, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileParseUIProps {
  step: WorkflowStep;
  onSubmit: (data: unknown) => void;
  onUseMock: () => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export const FileParseUI: React.FC<FileParseUIProps> = ({ step, onSubmit, onUseMock }) => {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const config = step.checkConfig;
  const acceptedTypes = config?.fileTypes || ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // TODO: 这里预留真实文件上传逻辑
    // 实际实现时，应该：
    // 1. 将文件上传到存储服务
    // 2. 获取文件URL
    // 3. 将URL传递给onSubmit
    
    onSubmit({
      file: selectedFile,
      uploadedAt: new Date().toISOString(),
      // url: 'https://storage.example.com/...' // 真实URL
    });
    
    setIsUploading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{step.name}</CardTitle>
        <CardDescription>
          {step.description || '请上传需要解析的文件'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 拖拽上传区域 */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
            isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            selectedFile && 'border-green-500 bg-green-50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`file-input-${step.id}`)?.click()}
        >
          <input
            id={`file-input-${step.id}`}
            type="file"
            className="hidden"
            accept={acceptedTypes.map(t => `.${t}`).join(',')}
            onChange={handleFileSelect}
          />
          
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="text-left">
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                拖拽文件到此处或点击选择
              </p>
              <p className="text-xs text-muted-foreground">
                支持格式: {acceptedTypes.join(', ')}
              </p>
            </>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <File className="h-4 w-4 mr-2" />
                提交文件
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onUseMock}>
            使用Mock数据
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
