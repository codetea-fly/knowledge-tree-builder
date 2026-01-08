import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Save, Building2, ListTree, RefreshCw, Loader2 } from 'lucide-react';
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
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [savingRemote, setSavingRemote] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // 本地存储 key
  const TEMPLATE_STORAGE_KEY = 'knowledge-tree-builder:template-config';

  // 从本地存储加载
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TemplateConfigData;
        if (parsed && typeof parsed === 'object') {
          onChange(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load template config from localStorage', e);
    }
  }, []);

  // 保存到本地存储
  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save template config to localStorage', e);
    }
  }, [value]);

  // 从远程 API 加载
  const handleFetchRemote = async () => {
    try {
      setLoadingRemote(true);
      const res = await fetch('/template/get');
      if (!res.ok) {
        throw new Error(`加载失败: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      // 假设返回格式为 { background: string, structure: string, replace: string }
      const remote = data?.background || data?.structure || data?.replace ? {
        organizationBackground: data.background || '',
        documentStructure: data.structure || '',
        termReplacement: data.replace || '',
      } : null;
      
      if (remote && (remote.organizationBackground || remote.documentStructure || remote.termReplacement)) {
        onChange(remote);
        toast.success('已从本地 API 加载模板配置');
      } else {
        // 内容为空，使用默认值
        onChange(defaultTemplateConfigData);
        toast.warning('远程配置为空，已使用默认配置');
      }
    } catch (err) {
      console.error(err);
      // 加载失败，使用默认值
      onChange(defaultTemplateConfigData);
      toast.warning('加载模板配置失败，已使用默认配置');
    } finally {
      setLoadingRemote(false);
    }
  };

  // 保存到远程 API
  const handleSaveRemote = async () => {
    try {
      setSavingRemote(true);
      const res = await fetch('/template/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: "",
          background: value.organizationBackground,
          structure: value.documentStructure,
          replace: value.termReplacement,
        }),
      });
      if (!res.ok) {
        throw new Error(`保存失败: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (data?.result === 'OK' || res.ok) {
        toast.success('模板配置已保存到本地 API');
      } else {
        toast.error('保存失败：返回结果异常');
      }
    } catch (err) {
      console.error(err);
      toast.error('保存模板配置失败');
    } finally {
      setSavingRemote(false);
    }
  };

  // 初次进入时自动从本地 API 拉取配置
  useEffect(() => {
    if (!initialLoaded) {
      setInitialLoaded(true);
      handleFetchRemote();
    }
  }, [initialLoaded]);

  const handleSave = async () => {
    try {
      setSavingRemote(true);
      // 先保存到本地存储
      try {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(value));
      } catch (e) {
        console.error('Failed to save template config to localStorage', e);
      }
      
      // 然后保存到远程 API
      const res = await fetch('/template/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: "",
          background: value.organizationBackground,
          structure: value.documentStructure,
          replace: value.termReplacement,
        }),
      });
      if (!res.ok) {
        throw new Error(`保存失败: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (data?.result === 'OK' || res.ok) {
        toast.success('模板配置已保存');
      } else {
        toast.error('保存失败：返回结果异常');
      }
    } catch (err) {
      console.error(err);
      toast.error('保存模板配置失败');
    } finally {
      setSavingRemote(false);
    }
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
        <Button 
          onClick={handleSave} 
          disabled={savingRemote}
          className="w-full gap-2"
        >
          {savingRemote ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
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
