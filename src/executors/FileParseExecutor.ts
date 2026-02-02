import { BaseStepExecutor, StepExecutionContext, StepExecutionOutput } from '@/types/stepExecutor';
import { CheckItemConfig, StepType } from '@/types/workflow';
import { stepApiClient } from '@/services/stepApiClient';
import { FileParseRequest } from '@/types/stepApi';

export class FileParseExecutor extends BaseStepExecutor<CheckItemConfig> {
  readonly stepType: StepType = 'file_parse';
  
  async execute(context: StepExecutionContext): Promise<StepExecutionOutput> {
    const config = context.step.checkConfig;
    
    this.log(context, 'info', '开始文件解析步骤');
    this.updateProgress(context, 0, '等待文件上传...');
    
    // 构建API请求
    const apiRequest: Omit<FileParseRequest, 'stepType'> = {
      stepId: context.step.id,
      workflowId: context.workflowId,
      sessionId: context.sharedData.sessionId as string || crypto.randomUUID(),
      context: context.sharedData,
    };
    
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
    
    // 添加文件信息到请求
    const fileInput = context.userInput as { name: string; type: string; size: number; url?: string };
    apiRequest.file = {
      id: crypto.randomUUID(),
      name: fileInput.name || 'unknown',
      type: fileInput.type || 'application/octet-stream',
      size: fileInput.size || 0,
      url: fileInput.url,
    };
    
    // 添加解析选项
    apiRequest.parseOptions = {
      extractText: true,
      extractTables: config?.parseRules?.includes('table'),
      extractImages: config?.parseRules?.includes('image'),
      enableOcr: config?.parseRules?.includes('ocr'),
    };
    
    this.updateProgress(context, 30, '正在调用文件解析接口...');
    
    try {
      // 调用后端API
      const response = await stepApiClient.fileParse(apiRequest);
      
      this.updateProgress(context, 100, '文件解析完成');
      
      if (response.success && response.data?.success) {
        this.log(context, 'info', '文件解析成功');
        return this.createSuccessOutput('文件解析成功', response.data.data);
      } else {
        // 检查是否需要用户操作
        if (response.data?.requiresUserAction) {
          return {
            success: false,
            message: response.data.message,
            requiresUserAction: true,
            userActionConfig: response.data.userActionConfig,
          };
        }
        
        this.log(context, 'error', `文件解析失败: ${response.message}`);
        return this.createErrorOutput('文件解析失败', response.message);
      }
    } catch (error) {
      this.log(context, 'error', `API调用失败: ${error}`);
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
}
