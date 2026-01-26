import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  TreeDeciduous,
  Settings,
  FileText,
  Database,
  Plus,
  Workflow,
  LucideIcon,
} from 'lucide-react';

export interface ConfigItem {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

// 预设的配置项列表 - 可扩展
export const CONFIG_ITEMS: ConfigItem[] = [
  {
    id: 'knowledge-tree',
    name: '知识树配置',
    icon: TreeDeciduous,
    description: '配置知识库的树状结构',
  },
  {
    id: 'template',
    name: '模板配置',
    icon: FileText,
    description: '配置输出模板格式',
  },
  {
    id: 'workflow',
    name: '审查流程配置',
    icon: Workflow,
    description: '可视化配置审查流程',
  },
  {
    id: 'data-source',
    name: '数据源配置',
    icon: Database,
    description: '配置外部数据源连接',
  },
];

interface ConfigSidebarProps {
  activeConfigId: string;
  onConfigSelect: (configId: string) => void;
}

export const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  activeConfigId,
  onConfigSelect,
}) => {
  return (
    <div className="w-[200px] border-r border-border bg-muted/30 flex flex-col shrink-0">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm text-foreground">配置项</span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {CONFIG_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeConfigId === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-2 h-auto py-2 px-3',
                  isActive && 'bg-primary/10 text-primary'
                )}
                onClick={() => onConfigSelect(item.id)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-medium">{item.name}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-border">
        <Button variant="outline" size="sm" className="w-full gap-2" disabled>
          <Plus className="h-4 w-4" />
          添加配置项
        </Button>
      </div>
    </div>
  );
};
