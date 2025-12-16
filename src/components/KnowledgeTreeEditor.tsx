import React, { useState } from 'react';
import { TreeProvider, useTree } from '@/context/TreeContext';
import { ProcessDomainNode } from '@/components/TreeNode';
import { NodeEditor } from '@/components/NodeEditor';
import { JsonPreview } from '@/components/JsonPreview';
import { ChatInterface } from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  TreeDeciduous,
  Settings,
  Code,
  PanelLeftClose,
  PanelLeft,
  FileJson,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TreePanel: React.FC = () => {
  const { tree, setTree } = useTree();

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
      {/* Root File Info */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          <FileJson className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">根配置</span>
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

const EditorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'chat'>('config');
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation - 主模式切换 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <TreeDeciduous className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">知识库配置与AI对话</span>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'config' | 'chat')}>
          <TabsList>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              树配置
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              AI 对话
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="w-[140px]" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'config' ? (
          <>
            {/* Left Panel - Tree */}
            <div className="w-[420px] border-r border-border bg-card flex flex-col shrink-0">
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
