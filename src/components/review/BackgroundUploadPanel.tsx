import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundConfig, BackgroundFileConfig } from '@/types/workflow';

interface BackgroundUploadPanelProps {
  config: BackgroundConfig;
  onComplete: (files: Record<string, UploadedFileInfo>) => void;
  onUseMock: () => void;
}

export interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export const BackgroundUploadPanel: React.FC<BackgroundUploadPanelProps> = ({
  config,
  onComplete,
  onUseMock,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFileInfo | null>>({});
  const [isUploading, setIsUploading] = useState(false);

  // 检查是否所有必填文件都已上传
  const allRequiredUploaded = config.requiredFiles
    .filter(f => f.required)
    .every(f => uploadedFiles[f.id]);

  const handleFileSelect = useCallback((fileConfig: BackgroundFileConfig, file: globalThis.File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileConfig.id]: {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // TODO: 实际上传文件到存储服务
    const result: Record<string, UploadedFileInfo> = {};
    for (const [id, info] of Object.entries(uploadedFiles)) {
      if (info) {
        result[id] = info;
      }
    }
    
    onComplete(result);
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
        <CardTitle className="text-base">审核背景资料</CardTitle>
        <CardDescription>
          {config.description || '请上传审核所需的背景文件'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 文件上传列表 */}
        <div className="space-y-3">
          {config.requiredFiles.map((fileConfig) => {
            const uploaded = uploadedFiles[fileConfig.id];
            const acceptTypes = fileConfig.fileTypes?.map(t => `.${t}`).join(',') || '*';
            
            return (
              <div
                key={fileConfig.id}
                className={cn(
                  'border rounded-lg p-4 transition-colors',
                  uploaded ? 'border-green-300 bg-green-50' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{fileConfig.label}</span>
                      {fileConfig.required && (
                        <Badge variant="secondary" className="text-xs">必填</Badge>
                      )}
                    </div>
                    {fileConfig.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fileConfig.description}
                      </p>
                    )}
                  </div>
                  {uploaded && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveFile(fileConfig.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {uploaded ? (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="truncate flex-1">{uploaded.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(uploaded.size)}
                    </span>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    <input
                      type="file"
                      className="hidden"
                      accept={acceptTypes}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(fileConfig, file);
                        e.target.value = '';
                      }}
                    />
                    <Upload className="h-4 w-4" />
                    <span>
                      点击选择文件
                      {fileConfig.fileTypes?.length ? (
                        <span className="text-xs ml-1">
                          ({fileConfig.fileTypes.join(', ')})
                        </span>
                      ) : null}
                    </span>
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {/* 未满足必填要求提示 */}
        {!allRequiredUploaded && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>请上传所有必填文件后再继续</span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!allRequiredUploaded || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <File className="h-4 w-4 mr-2" />
                确认并开始审核
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

export default BackgroundUploadPanel;
