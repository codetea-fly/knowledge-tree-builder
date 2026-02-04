import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  FileText,
  GripVertical,
} from 'lucide-react';
import { 
  BackgroundConfig, 
  BackgroundFileConfig, 
  createDefaultBackgroundFile,
} from '@/types/workflow';

interface BackgroundConfigEditorProps {
  config: BackgroundConfig | undefined;
  onChange: (config: BackgroundConfig) => void;
}

export const BackgroundConfigEditor: React.FC<BackgroundConfigEditorProps> = ({
  config,
  onChange,
}) => {
  const currentConfig: BackgroundConfig = config || {
    description: '',
    requiredFiles: [],
  };

  const handleDescriptionChange = (description: string) => {
    onChange({
      ...currentConfig,
      description,
    });
  };

  const handleAddFile = () => {
    onChange({
      ...currentConfig,
      requiredFiles: [...currentConfig.requiredFiles, createDefaultBackgroundFile()],
    });
  };

  const handleUpdateFile = (index: number, updates: Partial<BackgroundFileConfig>) => {
    const newFiles = [...currentConfig.requiredFiles];
    newFiles[index] = { ...newFiles[index], ...updates };
    onChange({
      ...currentConfig,
      requiredFiles: newFiles,
    });
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = currentConfig.requiredFiles.filter((_, i) => i !== index);
    onChange({
      ...currentConfig,
      requiredFiles: newFiles,
    });
  };

  const handleFileTypesChange = (index: number, value: string) => {
    const fileTypes = value
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);
    handleUpdateFile(index, { fileTypes });
  };

  return (
    <div className="space-y-4">
      {/* 背景描述 */}
      <div>
        <Label className="text-xs text-muted-foreground">审核背景说明</Label>
        <Textarea
          value={currentConfig.description || ''}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="描述本次审核的背景信息，说明审核目的和要求..."
          className="text-sm min-h-[60px] resize-none bg-background mt-1"
        />
      </div>

      {/* 需要上传的文件 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">需要上传的文件</Label>
          <Button variant="outline" size="sm" onClick={handleAddFile} className="h-7">
            <Plus className="h-3 w-3 mr-1" />
            添加文件要求
          </Button>
        </div>

        {currentConfig.requiredFiles.length === 0 ? (
          <div className="text-center py-4 bg-muted/30 rounded-lg border border-dashed">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">暂无文件要求</p>
            <p className="text-xs text-muted-foreground">点击上方按钮添加需要用户上传的文件</p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentConfig.requiredFiles.map((file, index) => (
              <Card key={file.id} className="bg-muted/30">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 mt-2 text-muted-foreground/50 cursor-grab" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={file.label}
                          onChange={(e) => handleUpdateFile(index, { label: e.target.value })}
                          placeholder="文件名称，如：程序文件"
                          className="h-8 text-sm flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Input
                        value={file.description || ''}
                        onChange={(e) => handleUpdateFile(index, { description: e.target.value })}
                        placeholder="文件说明（可选）"
                        className="h-8 text-sm"
                      />
                      
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Input
                            value={file.fileTypes?.join(', ') || ''}
                            onChange={(e) => handleFileTypesChange(index, e.target.value)}
                            placeholder="允许的文件类型，如：pdf, docx"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={file.required}
                            onCheckedChange={(checked) => handleUpdateFile(index, { required: checked })}
                            id={`file-required-${file.id}`}
                          />
                          <Label htmlFor={`file-required-${file.id}`} className="text-xs">
                            必填
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundConfigEditor;
