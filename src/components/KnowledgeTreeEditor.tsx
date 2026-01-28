import React, { useState, useEffect } from 'react';
import { TreeProvider, useTree } from '@/context/TreeContext';
import { ProcessDomainNode } from '@/components/TreeNode';
import { NodeEditor } from '@/components/NodeEditor';
import { JsonPreview } from '@/components/JsonPreview';
import { ChatInterface } from '@/components/ChatInterface';
import { ConfigSidebar } from '@/components/ConfigSidebar';
import { TemplateConfig, TemplateConfigData, defaultTemplateConfigData } from '@/components/TemplateConfig';
import { PlaceholderConfig } from '@/components/PlaceholderConfig';
import { WorkflowConfig } from '@/components/WorkflowConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Plus,
  TreeDeciduous,
  Settings,
  Code,
  PanelLeftClose,
  PanelLeft,
  FileJson,
  MessageSquare,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { KnowledgeTree } from '@/types/knowledge';

const TreePanel: React.FC = () => {
  const { tree, setTree } = useTree();
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [savingRemote, setSavingRemote] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const handleFetchRemote = async () => {
    try {
      setLoadingRemote(true);
      const res = await fetch('/knowledge/get');
      if (!res.ok) {
        throw new Error(`加载失败: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      const remote = Array.isArray(data?.knowledge) ? data.knowledge[0] : data?.knowledge;
      if (!remote) {
        throw new Error('返回数据中缺少 knowledge');
      }
      setTree(remote as KnowledgeTree);
      toast.success('已从本地 API 加载配置');
    } catch (err) {
      console.error(err);
      toast.error('加载知识树配置失败');
    } finally {
      setLoadingRemote(false);
    }
  };

  const handleSaveRemote = async () => {
    try {
      setSavingRemote(true);
      const res = await fetch('/knowledge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: JSON.stringify(tree) }),
      });
      if (!res.ok) {
        throw new Error(`保存失败: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (data?.result === 'OK') {
        toast.success('知识树配置已保存');
      } else {
        toast.error('保存失败：返回结果异常');
      }
    } catch (err) {
      console.error(err);
      toast.error('保存知识树配置失败');
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

  const handleAddProcessDomain = () => {
    setTree((prev) => ({
      ...prev,
      process_domains: [
        ...prev.process_domains,
        {
          name: '新过程域',
          type: 'ISO 9000过程组',
          query: '',
          charpter: '',
          related_domains: [],
        },
      ],
    }));
  };

  const handleDeleteProcessDomain = (index: number) => {
    setTree((prev) => ({
      ...prev,
      process_domains: prev.process_domains.filter((_, i) => i !== index),
    }));
  };

  const handleAddRelatedDomain = (pdIndex: number) => {
    setTree((prev) => {
      const newDomains = [...prev.process_domains];
      newDomains[pdIndex] = {
        ...newDomains[pdIndex],
        related_domains: [
          ...newDomains[pdIndex].related_domains,
          {
            name: '新关联域',
            type: '企业过程域',
            file: '',
            file_path: '',
            query: false,
            related_domains: [],
          },
        ],
      };
      return { ...prev, process_domains: newDomains };
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Root File Info + actions */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">根配置</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchRemote}
              disabled={loadingRemote || savingRemote}
            >
              {loadingRemote ? '加载中...' : '从本地 API 加载'}
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRemote}
              disabled={loadingRemote || savingRemote}
            >
              {savingRemote ? '保存中...' : '保存到本地 API'}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">文件名 (file)</Label>
            <Input
              value={tree.file}
              onChange={(e) => setTree((prev) => ({ ...prev, file: e.target.value }))}
              placeholder="如: GJB9001C"
              className="h-8 text-sm bg-background"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">文件路径 (file_path)</Label>
            <Input
              value={tree.file_path}
              onChange={(e) => setTree((prev) => ({ ...prev, file_path: e.target.value }))}
              placeholder="输入文件路径"
              className="h-8 text-sm bg-background"
            />
          </div>
        </div>
      </div>

      {/* Tree Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TreeDeciduous className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">过程域 (process_domains)</h2>
        </div>
        <Button size="sm" onClick={handleAddProcessDomain}>
          <Plus className="h-4 w-4 mr-1.5" />
          添加
        </Button>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-2">
        {tree.process_domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <TreeDeciduous className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">暂无过程域</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleAddProcessDomain}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加过程域
            </Button>
          </div>
        ) : (
          tree.process_domains.map((pd, index) => (
            <ProcessDomainNode
              key={index}
              node={pd}
              index={index}
              onDelete={() => handleDeleteProcessDomain(index)}
              onAddRelated={() => handleAddRelatedDomain(index)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// 知识树配置面板（包含树 + 编辑器）
const KnowledgeTreeConfigPanel: React.FC = () => {
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Tree */}
      <div className="w-[380px] border-r border-border bg-card flex flex-col shrink-0">
        <TreePanel />
      </div>

      {/* Right Panel - Editor & JSON */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          rightPanelCollapsed && 'w-12'
        )}
      >
        {/* Toggle Button */}
        <div className="flex items-center gap-2 p-2 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          >
            {rightPanelCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
          {!rightPanelCollapsed && (
            <span className="text-sm font-medium text-muted-foreground">
              节点编辑 & JSON 预览
            </span>
          )}
        </div>

        {!rightPanelCollapsed && (
          <Tabs defaultValue="editor" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-card px-4">
              <TabsTrigger value="editor" className="gap-2">
                <Settings className="h-4 w-4" />
                节点编辑
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <Code className="h-4 w-4" />
                JSON 输出
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex-1 m-0 overflow-auto bg-card">
              <NodeEditor />
            </TabsContent>
            <TabsContent value="json" className="flex-1 m-0 overflow-hidden bg-card">
              <JsonPreview />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

const EditorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'chat'>('config');
  const [activeConfigId, setActiveConfigId] = useState('knowledge-tree');
  const [templateConfigData, setTemplateConfigData] = useState<TemplateConfigData>(defaultTemplateConfigData);

  const renderConfigContent = () => {
    switch (activeConfigId) {
      case 'knowledge-tree':
        return <KnowledgeTreeConfigPanel />;
      case 'review-workflow':
        return (
          <div className="flex-1 bg-card overflow-hidden">
            <WorkflowConfig />
          </div>
        );
      case 'template':
        return (
          <div className="flex-1 bg-card">
            <TemplateConfig value={templateConfigData} onChange={setTemplateConfigData} />
          </div>
        );
      case 'data-source':
        return (
          <PlaceholderConfig
            configId="data-source"
            title="数据源配置"
            description="配置外部数据源连接，如数据库、API等"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation - 主模式切换 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <TreeDeciduous className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">知识库配置与AI对话</span>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={(v) => {
            if (v === 'review') {
              // 不更新 activeTab，让 Link 导航处理
            } else {
              setActiveTab(v as 'config' | 'chat');
            }
          }}>
            <TabsList>
              <TabsTrigger value="config" className="gap-2">
                <Settings className="h-4 w-4" />
                配置中心
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                AI 对话
              </TabsTrigger>
              <TabsTrigger value="review" asChild>
                <Link to="/review" className="gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  进入审查
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="w-[140px]" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'config' ? (
          <>
            {/* Config Sidebar */}
            <ConfigSidebar
              activeConfigId={activeConfigId}
              onConfigSelect={setActiveConfigId}
            />
            {/* Config Content */}
            {renderConfigContent()}
          </>
        ) : (
          /* Chat Interface */
          <div className="flex-1">
            <ChatInterface />
          </div>
        )}
      </div>
    </div>
  );
};

export const KnowledgeTreeEditor: React.FC = () => {
  return (
    <TreeProvider>
      <EditorContent />
    </TreeProvider>
  );
};
