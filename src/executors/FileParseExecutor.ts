import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType } from '@/types/workflow';

export class FileParseExecutor extends BaseStepExecutor<CheckItemConfig> {
  readonly stepType: StepType = 'file_parse';
  
  async execute(context: StepExecutionContext): Promise<StepExecutionOutput> {
    const config = context.step.checkConfig;
    
    this.log(context, 'info', '开始文件解析步骤');
    this.updateProgress(context, 0, '等待文件上传...');
    
    // 如果没有用户输入，请求上传文件
    if (!context.userInput) {
      return this.createUserActionOutput('请上传需要解析的文件', {
        type: 'file',
        title: '上传文件',
        description: config?.fileTypes 
          ? `支持的文件类型: ${config.fileTypes.join(', ')}`
          : '请上传文件',
        required: true,
      });
    }
    
    this.updateProgress(context, 30, '正在解析文件...');
    
    try {
      // 这里是实际的文件解析逻辑
      const parseResult = await this.parseFile(context.userInput, config);
      
      this.updateProgress(context, 100, '文件解析完成');
      this.log(context, 'info', '文件解析成功');
      
      return this.createSuccessOutput('文件解析成功', parseResult);
    } catch (error) {
      this.log(context, 'error', `文件解析失败: ${error}`);
      return this.createErrorOutput('文件解析失败', String(error));
    }
  }
  
  validateConfig(config: CheckItemConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 文件类型配置是可选的，但如果配置了需要是有效的数组
    if (config.fileTypes && !Array.isArray(config.fileTypes)) {
      errors.push('文件类型配置必须是数组');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  getUIComponentName(): string {
    return 'FileParseUI';
  }
  
  getDescription(): string {
    return '解析上传的文件，提取文件内容和结构信息';
  }
  
  // 私有方法：实际的文件解析逻辑
  private async parseFile(
    fileInput: unknown, 
    config?: CheckItemConfig
  ): Promise<{ fileName: string; content: string; metadata: Record<string, unknown> }> {
    // 模拟文件解析过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 实际实现时，这里会根据文件类型调用不同的解析器
    // 例如：PDF解析器、Word解析器、Excel解析器等
    
    return {
      fileName: 'example.pdf',
      content: '解析后的文件内容...',
      metadata: {
        pageCount: 10,
        parseRules: config?.parseRules,
      },
    };
  }
}
