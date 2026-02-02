import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType } from '@/types/workflow';

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
    
    this.updateProgress(context, 30, `正在执行 ${scriptLanguage} 脚本...`);
    
    try {
      // 执行脚本
      const result = await this.executeScript(scriptContent, scriptLanguage, context);
      
      this.updateProgress(context, 100, '脚本执行完成');
      
      if (result.success) {
        this.log(context, 'info', '脚本检查通过');
        return this.createSuccessOutput('脚本检查通过', result.data);
      } else {
        this.log(context, 'warn', `脚本检查未通过: ${result.error}`);
        return this.createErrorOutput('脚本检查未通过', result.error);
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
    
    if (config.scriptLanguage && !['javascript', 'python'].includes(config.scriptLanguage)) {
      errors.push('脚本语言只支持 javascript 或 python');
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
    return '执行自定义脚本进行自动化检查，支持 JavaScript 和 Python';
  }
  
  // 私有方法：执行脚本
  private async executeScript(
    scriptContent: string,
    language: 'javascript' | 'python',
    context: StepExecutionContext
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    // 模拟脚本执行延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (language === 'javascript') {
      return this.executeJavaScript(scriptContent, context);
    } else if (language === 'python') {
      return this.executePython(scriptContent, context);
    }
    
    return { success: false, error: `不支持的脚本语言: ${language}` };
  }
  
  private executeJavaScript(
    scriptContent: string,
    context: StepExecutionContext
  ): { success: boolean; data?: unknown; error?: string } {
    try {
      // 创建安全的执行环境
      const sandbox = {
        // 提供给脚本的上下文数据
        context: {
          stepName: context.step.name,
          workflowName: context.workflowName,
          sharedData: context.sharedData,
          previousResult: context.previousResult,
        },
        // 工具函数
        log: (msg: string) => this.log(context, 'info', `[Script] ${msg}`),
        console: {
          log: (msg: string) => this.log(context, 'info', `[Script] ${msg}`),
          warn: (msg: string) => this.log(context, 'warn', `[Script] ${msg}`),
          error: (msg: string) => this.log(context, 'error', `[Script] ${msg}`),
        },
      };
      
      // 创建函数并执行
      const fn = new Function(
        ...Object.keys(sandbox),
        `"use strict";\n${scriptContent}`
      );
      
      const result = fn(...Object.values(sandbox));
      
      // 根据返回值判断结果
      if (typeof result === 'boolean') {
        return { 
          success: result, 
          data: { returnValue: result },
          error: result ? undefined : '脚本返回 false',
        };
      }
      
      if (typeof result === 'object' && result !== null) {
        if ('success' in result) {
          return {
            success: Boolean(result.success),
            data: result.data || result,
            error: result.error || (result.success ? undefined : '检查未通过'),
          };
        }
      }
      
      // 默认返回成功
      return { success: true, data: { returnValue: result } };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  
  private executePython(
    scriptContent: string,
    _context: StepExecutionContext
  ): { success: boolean; data?: unknown; error?: string } {
    // Python 脚本执行需要后端支持
    // 这里只是模拟实现
    console.log('Python script to execute:', scriptContent);
    
    return {
      success: false,
      error: 'Python 脚本执行需要后端支持，当前环境暂不支持',
    };
  }
}
