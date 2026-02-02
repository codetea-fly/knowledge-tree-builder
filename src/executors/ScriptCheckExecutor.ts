import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType } from '@/types/workflow';
import { stepApiClient } from '@/services/stepApiClient';
import { ScriptCheckRequest } from '@/types/stepApi';

export class ScriptCheckExecutor extends BaseStepExecutor<CheckItemConfig> {
  readonly stepType: StepType = 'script_check';
  
  async execute(context: StepExecutionContext): Promise<StepExecutionOutput> {
    const config = context.step.checkConfig;
    
    this.log(context, 'info', '开始脚本检查步骤');
    this.updateProgress(context, 0, '准备执行脚本...');
    
    // 获取脚本配置
    const scriptContent = config?.scriptContent;
    const scriptLanguage = config?.scriptLanguage || 'javascript';
    
    if (!scriptContent || scriptContent.trim() === '') {
      return this.createErrorOutput('配置错误', '脚本内容为空');
    }
    
    // 构建API请求
    const apiRequest: Omit<ScriptCheckRequest, 'stepType'> = {
      stepId: context.step.id,
      workflowId: context.workflowId,
      sessionId: context.sharedData.sessionId as string || crypto.randomUUID(),
      context: context.sharedData,
      script: {
        content: scriptContent,
        language: scriptLanguage as 'javascript' | 'python' | 'sql',
      },
      executionParams: {
        timeout: config?.scriptTimeout || 30000,
        memoryLimit: config?.memoryLimit || 128,
        inputData: context.previousResult?.data,
      },
    };
    
    this.updateProgress(context, 30, `正在执行 ${scriptLanguage} 脚本...`);
    
    try {
      // 调用后端API
      const response = await stepApiClient.scriptCheck(apiRequest);
      
      this.updateProgress(context, 100, '脚本执行完成');
      
      if (response.success && response.data?.success) {
        this.log(context, 'info', '脚本检查通过');
        return this.createSuccessOutput('脚本检查通过', response.data.data);
      } else {
        this.log(context, 'warn', `脚本检查未通过: ${response.message}`);
        return this.createErrorOutput('脚本检查未通过', response.message);
      }
    } catch (error) {
      this.log(context, 'error', `脚本执行出错: ${error}`);
      return this.createErrorOutput('脚本执行出错', String(error));
    }
  }
  
  validateConfig(config: CheckItemConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.scriptContent || config.scriptContent.trim() === '') {
      errors.push('脚本内容不能为空');
    }
    
    if (config.scriptLanguage && !['javascript', 'python', 'sql'].includes(config.scriptLanguage)) {
      errors.push('脚本语言只支持 javascript、python 或 sql');
    }
    
    // 基本的语法检查（仅对 JavaScript）
    if (config.scriptLanguage === 'javascript' || !config.scriptLanguage) {
      try {
        // 尝试解析脚本，检查基本语法
        new Function(config.scriptContent || '');
      } catch (e) {
        errors.push(`JavaScript 语法错误: ${e}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  getUIComponentName(): string {
    return 'ScriptCheckUI';
  }
  
  getDescription(): string {
    return '执行自定义脚本进行自动化检查，支持 JavaScript、Python 和 SQL';
  }
}
