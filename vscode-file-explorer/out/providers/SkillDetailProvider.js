"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillDetailProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class SkillDetailProvider {
    static createOrShow(extensionUri, knowledgeService, skillId) {
        const column = vscode.ViewColumn.One;
        if (SkillDetailProvider.currentPanel) {
            SkillDetailProvider.currentPanel._panel.reveal(column);
            SkillDetailProvider.currentPanel.update(knowledgeService, skillId);
            return;
        }
        const panel = vscode.window.createWebviewPanel('skillDetail', '技能详情', column, {
            enableScripts: true,
            localResourceRoots: [extensionUri]
        });
        SkillDetailProvider.currentPanel = new SkillDetailProvider(panel, extensionUri, knowledgeService, skillId);
    }
    constructor(panel, extensionUri, knowledgeService, skillId) {
        this.extensionUri = extensionUri;
        this.knowledgeService = knowledgeService;
        this._disposables = [];
        this._panel = panel;
        this.update(knowledgeService, skillId);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    update(knowledgeService, skillId) {
        const skill = knowledgeService.getSkill(skillId);
        if (!skill) {
            this._panel.webview.html = '<p>技能未找到</p>';
            return;
        }
        this._panel.title = skill.name;
        this._panel.webview.html = this.getHtml(skill);
    }
    getHtml(skill) {
        const htmlPath = path.join(this.extensionUri.fsPath, 'media', 'skill-detail.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');
        // 替换占位符
        html = html.replace('{{SKILL_NAME}}', skill.name);
        html = html.replace('{{SKILL_DESCRIPTION}}', skill.description);
        html = html.replace('{{VERSION}}', skill.version);
        html = html.replace('{{DATE}}', skill.date);
        html = html.replace('{{TAGS}}', skill.tags.map((t) => `#${t}`).join(' '));
        html = html.replace('{{STANDALONE}}', skill.standalone ? '可独立使用' : '需配合智能体');
        html = html.replace('{{ESTIMATED_TIME}}', skill.estimatedTime || '-');
        html = html.replace('{{CONTENT}}', this.markdownToHtml(skill.content));
        return html;
    }
    markdownToHtml(markdown) {
        // 简化版 Markdown 转 HTML
        let html = markdown
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        // 代码块（先处理，避免被其他规则影响）
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        // 行内代码
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        // 标题
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        // 粗体、斜体
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // 无序列表
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        // 有序列表
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        // 链接
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        // 段落（简单处理）
        const lines = html.split('\n');
        const result = [];
        let inParagraph = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === '') {
                if (inParagraph) {
                    result.push('</p>');
                    inParagraph = false;
                }
                continue;
            }
            if (trimmed.startsWith('<')) {
                if (inParagraph) {
                    result.push('</p>');
                    inParagraph = false;
                }
                result.push(trimmed);
            }
            else {
                if (!inParagraph) {
                    result.push('<p>');
                    inParagraph = true;
                }
                result.push(trimmed);
            }
        }
        if (inParagraph) {
            result.push('</p>');
        }
        // 包裹列表
        let finalHtml = result.join('\n');
        finalHtml = finalHtml.replace(/(<li>.*?<\/li>\n?)+/gs, '<ul>$&</ul>');
        return finalHtml;
    }
    dispose() {
        SkillDetailProvider.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x)
                x.dispose();
        }
    }
}
exports.SkillDetailProvider = SkillDetailProvider;
//# sourceMappingURL=SkillDetailProvider.js.map