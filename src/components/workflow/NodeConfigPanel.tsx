import React from 'react';
import { Node } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, FileText, Users, AlertTriangle } from 'lucide-react';
import { WorkflowNodeData, WORKFLOW_STAGES, INTERACTION_TYPE_NODES } from '@/types/workflow';

interface NodeConfigPanelProps {
  selectedNode: Node<WorkflowNodeData> | null;
  onNodeUpdate: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNode,
  onNodeUpdate,
}) => {
  if (!selectedNode) {
    return (
      <div className="w-[300px] border-l border-border bg-muted/30 flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">节点配置</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">选择一个节点进行配置</p>
          </div>
        </div>
      </div>
    );
  }

  const nodeData = selectedNode.data;

  const handleChange = (field: keyof WorkflowNodeData, value: any) => {
    onNodeUpdate(selectedNode.id, { [field]: value });
  };

  return (
    <div className="w-[300px] border-l border-border bg-muted/30 flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: nodeData.color }}
          />
          <h2 className="font-semibold text-foreground">节点配置</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{nodeData.label}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* 通用配置 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Settings className="h-4 w-4" />
              通用配置
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">节点名称</Label>
                <Input
                  value={nodeData.label}
                  onChange={(e) => handleChange('label', e.target.value)}
                  placeholder="输入节点名称"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">节点描述</Label>
                <Textarea
                  value={nodeData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="输入节点描述"
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">所属阶段</Label>
                <Select
                  value={nodeData.stage || ''}
                  onValueChange={(value) => handleChange('stage', value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="选择阶段" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOW_STAGES.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* 检查项专用配置 */}
          {nodeData.nodeType === 'check-category' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4" />
                检查项配置
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">交互方式</Label>
                  <Select
                    value={nodeData.interactionType || ''}
                    onValueChange={(value) => handleChange('interactionType', value)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="选择交互方式" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERACTION_TYPE_NODES.map((item) => (
                        <SelectItem key={item.id} value={item.interactionType!}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">校验规则</Label>
                  <Textarea
                    value={nodeData.validationRule || ''}
                    onChange={(e) => handleChange('validationRule', e.target.value)}
                    placeholder="如：关键字标准规定"
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">参考文档</Label>
                  <Input
                    value={nodeData.referenceDoc || ''}
                    onChange={(e) => handleChange('referenceDoc', e.target.value)}
                    placeholder="关联程序文件、作业指导书等"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">是否必填</Label>
                  <Switch
                    checked={nodeData.isRequired || false}
                    onCheckedChange={(checked) => handleChange('isRequired', checked)}
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* 错误处理配置 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AlertTriangle className="h-4 w-4" />
              错误处理
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">错误处理逻辑</Label>
              <Textarea
                value={nodeData.errorHandling || ''}
                onChange={(e) => handleChange('errorHandling', e.target.value)}
                placeholder="如：不合格品处置流程"
                className="min-h-[60px] text-sm resize-none"
              />
            </div>
          </div>

          <Separator />

          {/* 审批配置 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4" />
              审批配置
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">审批角色/部门</Label>
              <Input
                value={nodeData.approvalRole || ''}
                onChange={(e) => handleChange('approvalRole', e.target.value)}
                placeholder="如：质量部门主管"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
