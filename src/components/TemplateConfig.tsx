import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Save, Building2, ListTree, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export interface TemplateConfigData {
  organizationBackground: string;
  documentStructure: string;
  termReplacement: string;
}

interface TemplateConfigProps {
  value: TemplateConfigData;
  onChange: (data: TemplateConfigData) => void;
}

export const TemplateConfig: React.FC<TemplateConfigProps> = ({
  value,
  onChange,
}) => {
  const handleSave = () => {
    toast.success('模板配置已保存');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">模板配置</span>
        </div>
        <p className="text-xs text-muted-foreground">
          配置文档生成的模板参数
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* 组织背景 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="org-background" className="font-medium">组织背景</Label>
          </div>
          <Textarea
            id="org-background"
            value={value.organizationBackground}
            onChange={(e) => onChange({ ...value, organizationBackground: e.target.value })}
            placeholder="描述组织的背景信息，如公司简介、行业领域、业务范围等..."
            className="min-h-[120px] bg-background"
          />
          <p className="text-xs text-muted-foreground">
            用于AI理解组织上下文，生成更贴合实际的内容
          </p>
        </div>

        {/* 文档结构 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListTree className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="doc-structure" className="font-medium">文档结构</Label>
          </div>
          <Textarea
            id="doc-structure"
            value={value.documentStructure}
            onChange={(e) => onChange({ ...value, documentStructure: e.target.value })}
            placeholder="描述期望的文档结构，如章节划分、内容层级、格式要求等..."
            className="min-h-[120px] bg-background"
          />
          <p className="text-xs text-muted-foreground">
            定义生成文档的结构和格式规范
          </p>
        </div>

        {/* 术语替换 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="term-replace" className="font-medium">术语替换</Label>
          </div>
          <Textarea
            id="term-replace"
            value={value.termReplacement}
            onChange={(e) => onChange({ ...value, termReplacement: e.target.value })}
            placeholder="定义术语替换规则，如：&#10;原术语 -> 替换术语&#10;Product -> 产品&#10;Service -> 服务"
            className="min-h-[120px] bg-background font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            设置术语映射规则，确保文档术语一致性
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card">
        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="h-4 w-4" />
          保存配置
        </Button>
      </div>
    </div>
  );
};

export const defaultTemplateConfigData: TemplateConfigData = {
  organizationBackground: '',
  documentStructure: '',
  termReplacement: '',
};
