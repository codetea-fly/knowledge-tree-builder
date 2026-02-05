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
      // 审核背景与参考文件（用于大模型审核）
      reviewBackground: context.sharedData.reviewBackground as string | undefined,
      backgroundFiles: context.sharedData.backgroundFiles as FileParseRequest['backgroundFiles'],
      checkConfig: config ? {
        parseRules: config.parseRules,
        fileTypes: config.fileTypes,
      } : undefined,
    };
    
    // 如果没有用户输入，请求上传文件
    console.log('FileParseExecutor context.userInput:', context.userInput);
    if (!context.userInput) {
      console.log('FileParseExecutor: 没有用户输入，请求上传文件');
      return this.createUserActionOutput('请上传需要解析的文件', {
        type: 'file',
        title: '上传文件',
        description: config?.fileTypes 
          ? `支持的文件类型: ${config.fileTypes.join(', ')}`
          : '请上传文件',
        required: true,
      });
    }
    
    // 添加文件信息与文本内容到请求
    const fileInput = context.userInput as {
      file?: File;
      name?: string;
      type?: string;
      size?: number;
      url?: string;
      textContent?: string;
    };
    const realFile = fileInput.file; // 获取真实的 File 对象
    apiRequest.file = {
      id: crypto.randomUUID(),
      name: fileInput.name || realFile?.name || 'unknown',
      type: fileInput.type || realFile?.type || 'application/octet-stream',
      size: fileInput.size || realFile?.size || 0,
      url: fileInput.url,
    };
    if (fileInput.textContent) {
      apiRequest.textContent = fileInput.textContent;
    }
    
    // 添加解析选项
    apiRequest.parseOptions = {
      extractText: true,
      extractTables: config?.parseRules?.includes('table'),
      extractImages: config?.parseRules?.includes('image'),
      enableOcr: config?.parseRules?.includes('ocr'),
    };
    
    this.updateProgress(context, 30, '正在调用文件解析接口...');
    
    try {
      // 调用后端API，传递真实的 File 对象
      console.log("file_parse....", { apiRequest, realFile });
      const response = await stepApiClient.fileParse(apiRequest, realFile);
      console.log("file_parse response:", response);
      
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
        // 审核未通过时保留 auditResult 供 UI 展示
        const auditData = response.data?.data as { auditResult?: { passed: boolean; reason: string; details?: string } } | undefined;
        const outputData = auditData?.auditResult ? { auditResult: auditData.auditResult } : undefined;
        this.log(context, 'error', `文件解析失败: ${response.message}`);
        return {
          success: false,
          message: response.message,
          error: response.message,
          data: outputData,
        };
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
