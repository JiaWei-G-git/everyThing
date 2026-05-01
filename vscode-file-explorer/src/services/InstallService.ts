import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Skill } from '../models/types';

export type InstallTarget = 'claude-code' | 'cursor' | 'generic';

export interface InstallResult {
  success: boolean;
  message: string;
  path?: string;
}

export class InstallService {
  public async install(skill: Skill, target: InstallTarget): Promise<InstallResult> {
    switch (target) {
      case 'claude-code':
        return this.installToClaudeCode(skill);
      case 'cursor':
        return this.installToCursor(skill);
      case 'generic':
        return this.copyToClipboard(skill.content);
      default:
        return { success: false, message: '未知安装目标' };
    }
  }

  private async installToClaudeCode(skill: Skill): Promise<InstallResult> {
    // 检测 Claude Code 全局技能目录
    const homeDir = os.homedir();
    const globalPath = path.join(homeDir, '.claude', 'skills');

    if (fs.existsSync(globalPath)) {
      return this.copySkillFile(skill, globalPath, 'Claude Code');
    }

    // 检测项目级技能目录
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const projectPath = path.join(workspaceFolders[0].uri.fsPath, '.claude', 'skills');
      if (fs.existsSync(projectPath)) {
        return this.copySkillFile(skill, projectPath, 'Claude Code');
      }
    }

    // 未检测到安装路径，提供手动选项
    return {
      success: false,
      message: '未检测到 Claude Code 安装路径',
      path: path.join(homeDir, '.claude', 'skills', `${skill.id}.md`)
    };
  }

  private async installToCursor(skill: Skill): Promise<InstallResult> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return {
        success: false,
        message: '未打开工作区，无法安装到 Cursor',
        path: '.cursor/rules/'
      };
    }

    const projectRoot = workspaceFolders[0].uri.fsPath;
    const cursorRulesPath = path.join(projectRoot, '.cursor', 'rules');

    if (fs.existsSync(cursorRulesPath)) {
      return this.copySkillFile(skill, cursorRulesPath, 'Cursor');
    }

    // 检查 .cursorrules 文件
    const cursorrulesPath = path.join(projectRoot, '.cursorrules');
    if (fs.existsSync(cursorrulesPath)) {
      return {
        success: false,
        message: '检测到 .cursorrules 文件，请手动追加内容',
        path: cursorrulesPath
      };
    }

    return {
      success: false,
      message: '未检测到 Cursor 配置',
      path: path.join(projectRoot, '.cursor', 'rules')
    };
  }

  private async copySkillFile(skill: Skill, targetDir: string, platform: string): Promise<InstallResult> {
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = path.join(targetDir, `${skill.id}.md`);
      fs.writeFileSync(targetPath, skill.content, 'utf-8');

      return {
        success: true,
        message: `${skill.name} 已安装到 ${platform}`,
        path: targetPath
      };
    } catch (error) {
      return {
        success: false,
        message: `安装失败: ${error}`,
        path: targetDir
      };
    }
  }

  private async copyToClipboard(content: string): Promise<InstallResult> {
    await vscode.env.clipboard.writeText(content);
    return {
      success: true,
      message: '技能内容已复制到剪贴板'
    };
  }

  public async promptManualInstall(skill: Skill, targetPath: string): Promise<void> {
    const selection = await vscode.window.showQuickPick(
      [
        { label: '$(clippy) 复制文件路径', value: 'path', description: targetPath },
        { label: '$(clippy) 复制文件内容', value: 'content', description: '复制技能完整内容' },
        { label: '$(folder-opened) 选择安装目录...', value: 'browse', description: '手动选择目标文件夹' }
      ],
      { placeHolder: '未检测到自动安装路径，请选择操作' }
    );

    if (!selection) return;

    switch (selection.value) {
      case 'path':
        await vscode.env.clipboard.writeText(targetPath);
        vscode.window.showInformationMessage('文件路径已复制');
        break;
      case 'content':
        await vscode.env.clipboard.writeText(skill.content);
        vscode.window.showInformationMessage('文件内容已复制');
        break;
      case 'browse':
        const uri = await vscode.window.showOpenDialog({
          canSelectFolders: true,
          canSelectFiles: false,
          openLabel: '选择安装目录'
        });
        if (uri && uri[0]) {
          const result = await this.copySkillFile(skill, uri[0].fsPath, '自定义');
          if (result.success) {
            vscode.window.showInformationMessage(result.message);
          } else {
            vscode.window.showErrorMessage(result.message);
          }
        }
        break;
    }
  }
}
