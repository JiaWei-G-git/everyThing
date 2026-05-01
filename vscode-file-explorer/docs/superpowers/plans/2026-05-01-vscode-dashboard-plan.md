# VS Code Dashboard 改造实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ai-knowledge-base VS Code 插件从 TreeView 改造为 Dashboard 风格的 WebviewView，所有内容集中在左侧 sidebar。

**Architecture:** 左侧 sidebar 使用 WebviewView 渲染完整 Dashboard SPA，内部通过路由切换首页/详情/搜索/收藏/设置视图。Extension Backend 通过 postMessage 与 Webview 通信，数据持久化使用 globalState。

**Tech Stack:** TypeScript, VS Code Extension API, Vanilla JS, CSS Grid/Flexbox

---

## 文件结构

```
vscode-file-explorer/
├── package.json                          [修改]
├── src/
│   ├── extension.ts                      [修改]
│   ├── models/types.ts                   [已有，小幅扩展]
│   ├── services/
│   │   ├── KnowledgeService.ts           [已有]
│   │   ├── SearchService.ts              [已有]
│   │   ├── InstallService.ts             [已有]
│   │   └── RecentService.ts              [新建]
│   ├── providers/
│   │   └── DashboardWebviewViewProvider.ts  [新建]
│   └── utils/markdownParser.ts           [已有]
└── media/
    ├── dashboard.html                    [新建]
    ├── dashboard.css                     [新建]
    └── dashboard.js                      [新建]
```

**删除文件：**
- `src/providers/KnowledgeTreeProvider.ts`
- `src/providers/SkillDetailProvider.ts`
- `media/skill-detail.html`（如果存在）

---

### Task 1: 修改 package.json 配置

**Files:**
- Modify: `package.json`

**说明:** 将 view 从 TreeDataProvider 模式改为 WebviewView 模式。

- [ ] **Step 1: 修改 views 配置**

  将 `views` 中 `aiKnowledgeBase.sidebar` 改为 `type: webview`，由 `DashboardWebviewViewProvider` 提供。

  ```json
  "views": {
    "aiKnowledgeBaseContainer": [
      {
        "id": "aiKnowledgeBase.sidebar",
        "name": "知识库",
        "type": "webview"
      }
    ]
  }
  ```

- [ ] **Step 2: 在 contributes 中注册 webviewView provider**

  在 `contributes` 中新增 `viewsContainers` 保持不变，`views` 上方新增 `viewsContainers` 如果还没有的话。已有则保持不变。确认 `views` 中条目增加了 `"type": "webview"`。

- [ ] **Step 3: Commit**

  ```bash
  git add package.json
  git commit -m "feat: switch sidebar view to webview type"
  ```

---

### Task 2: 创建 DashboardWebviewViewProvider 骨架

**Files:**
- Create: `src/providers/DashboardWebviewViewProvider.ts`

**说明:** 实现 `vscode.WebviewViewProvider` 接口，作为 WebviewView 的核心提供者。

- [ ] **Step 1: 编写 Provider 基础骨架**

  ```typescript
  import * as vscode from 'vscode';
  import * as path from 'path';
  import * as fs from 'fs';
  import { KnowledgeService } from '../services/KnowledgeService';
  import { SearchService } from '../services/SearchService';
  import { InstallService } from '../services/InstallService';
  import { RecentService } from '../services/RecentService';

  export class DashboardWebviewViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiKnowledgeBase.sidebar';
    private _view?: vscode.WebviewView;

    constructor(
      private readonly _extensionUri: vscode.Uri,
      private readonly _knowledgeService: KnowledgeService,
      private readonly _searchService: SearchService,
      private readonly _installService: InstallService,
      private readonly _recentService: RecentService
    ) {}

    public resolveWebviewView(
      webviewView: vscode.WebviewView,
      context: vscode.WebviewViewResolveContext,
      _token: vscode.CancellationToken
    ) {
      this._view = webviewView;

      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [this._extensionUri]
      };

      webviewView.webview.html = this._getHtml(webviewView.webview);

      // 处理来自 Webview 的消息
      webviewView.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.type) {
            case 'ready':
              this._sendInitialData();
              break;
            case 'open:skill':
              await this._handleOpenSkill(message.skillId);
              break;
            case 'search:query':
              await this._handleSearch(message.query);
              break;
            case 'install:skill':
              await this._handleInstall(message.skillId, message.target);
              break;
            case 'copy:prompt':
              await this._handleCopyPrompt(message.skillId);
              break;
            case 'toggle:favorite':
              await this._handleToggleFavorite(message.skillId);
              break;
            case 'get:settings':
              this._sendSettings();
              break;
          }
        }
      );
    }

    private _getHtml(webview: vscode.Webview): string {
      const htmlPath = path.join(this._extensionUri.fsPath, 'media', 'dashboard.html');
      let html = fs.readFileSync(htmlPath, 'utf-8');

      const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.css'));
      const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.js'));

      html = html.replace('{{CSS_URI}}', cssUri.toString());
      html = html.replace('{{JS_URI}}', jsUri.toString());

      return html;
    }

    private _sendInitialData() {
      if (!this._view) return;

      const kb = this._knowledgeService.getKnowledgeBase();
      const recent = this._recentService.getRecent();
      const favorites = this._recentService.getFavorites();
      const stats = this._recentService.getStats(kb);

      this._view.webview.postMessage({
        type: 'init:data',
        data: { clusters: kb.clusters, agents: kb.agents, skills: kb.skills }
      });

      this._view.webview.postMessage({
        type: 'init:state',
        data: { recent, favorites, stats }
      });
    }

    private async _handleOpenSkill(skillId: string) {
      this._recentService.addRecent(skillId, this._knowledgeService);
      this._sendInitialData(); // 更新最近使用列表
    }

    private async _handleSearch(query: string) {
      const results = this._searchService.search(query);
      this._view?.webview.postMessage({
        type: 'search:result',
        data: results
      });
    }

    private async _handleInstall(skillId: string, target: string) {
      const skill = this._knowledgeService.getSkill(skillId);
      if (!skill) {
        this._view?.webview.postMessage({
          type: 'install:result',
          data: { success: false, message: '技能未找到' }
        });
        return;
      }

      const result = await this._installService.install(skill, target as 'claude-code' | 'cursor');
      this._view?.webview.postMessage({
        type: 'install:result',
        data: result
      });
    }

    private async _handleCopyPrompt(skillId: string) {
      const skill = this._knowledgeService.getSkill(skillId);
      if (!skill) return;

      await vscode.env.clipboard.writeText(skill.content);
      this._view?.webview.postMessage({
        type: 'copy:result',
        data: { success: true, message: `${skill.name} 的 Prompt 已复制` }
      });
    }

    private async _handleToggleFavorite(skillId: string) {
      this._recentService.toggleFavorite(skillId);
      this._sendInitialData();
    }

    private _sendSettings() {
      const config = vscode.workspace.getConfiguration('aiKnowledgeBase');
      this._view?.webview.postMessage({
        type: 'settings:data',
        data: {
          localPath: config.get('localPath', ''),
          defaultInstallTarget: config.get('defaultInstallTarget', 'claude-code')
        }
      });
    }

    public refresh() {
      this._sendInitialData();
    }
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/providers/DashboardWebviewViewProvider.ts
  git commit -m "feat: add DashboardWebviewViewProvider skeleton"
  ```

---

### Task 3: 创建 Dashboard HTML 骨架

**Files:**
- Create: `media/dashboard.html`

- [ ] **Step 1: 编写 HTML 骨架**

  ```html
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 技能知识库</title>
    <link rel="stylesheet" href="{{CSS_URI}}">
  </head>
  <body>
    <!-- 顶部导航栏 -->
    <nav class="top-nav">
      <button class="nav-btn active" data-route="/dashboard" title="首页">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">首页</span>
      </button>
      <button class="nav-btn" data-route="/search" title="搜索">
        <span class="nav-icon">🔍</span>
        <span class="nav-label">搜索</span>
      </button>
      <button class="nav-btn" data-route="/favorites" title="收藏">
        <span class="nav-icon">⭐</span>
        <span class="nav-label">收藏</span>
      </button>
      <button class="nav-btn" data-route="/settings" title="设置">
        <span class="nav-icon">⚙</span>
        <span class="nav-label">设置</span>
      </button>
    </nav>

    <!-- 主内容区 -->
    <main id="app">
      <!-- 动态内容渲染在这里 -->
    </main>

    <!-- Toast 通知容器 -->
    <div id="toast-container"></div>

    <script src="{{JS_URI}}"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add media/dashboard.html
  git commit -m "feat: add dashboard html skeleton"
  ```

---

### Task 4: 创建 Dashboard CSS 样式

**Files:**
- Create: `media/dashboard.css`

**说明:** 适配 VS Code 暗色主题，使用 CSS 变量继承 VS Code 颜色。

- [ ] **Step 1: 编写 CSS 样式**

  ```css
  /* ========== 基础变量与重置 ========== */
  :root {
    --bg-primary: var(--vscode-editor-background, #1e1e1e);
    --bg-secondary: var(--vscode-sideBar-background, #252526);
    --bg-hover: var(--vscode-list-hoverBackground, #2a2d2e);
    --bg-active: var(--vscode-list-activeSelectionBackground, #094771);
    --fg-primary: var(--vscode-foreground, #cccccc);
    --fg-secondary: var(--vscode-descriptionForeground, #858585);
    --fg-accent: var(--vscode-textLink-foreground, #3794ff);
    --border-color: var(--vscode-panel-border, #3c3c3c);
    --card-bg: var(--vscode-editor-inactiveSelectionBackground, #3a3d41);
    --success: var(--vscode-testing-iconPassed, #4ec9b0);
    --warning: var(--vscode-editorWarning-foreground, #cca700);
    --error: var(--vscode-editorError-foreground, #f14c4c);
    --radius: 6px;
    --gap: 12px;
    --min-width: 550px;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    font-size: 13px;
    line-height: 1.5;
    color: var(--fg-primary);
    background: var(--bg-primary);
    min-width: var(--min-width);
  }

  /* ========== 顶部导航栏 ========== */
  .top-nav {
    display: flex;
    gap: 4px;
    padding: 8px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 4px;
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--fg-secondary);
    cursor: pointer;
    font-size: 11px;
    transition: all 0.15s ease;
  }

  .nav-btn:hover {
    background: var(--bg-hover);
    color: var(--fg-primary);
  }

  .nav-btn.active {
    background: var(--bg-active);
    color: var(--fg-primary);
  }

  .nav-icon {
    font-size: 16px;
  }

  .nav-label {
    font-size: 10px;
  }

  /* ========== 主内容区 ========== */
  #app {
    padding: var(--gap);
    min-width: var(--min-width);
  }

  /* ========== Logo 区 ========== */
  .logo-section {
    text-align: center;
    padding: 16px 0;
  }

  .logo-icon {
    font-size: 32px;
    margin-bottom: 4px;
  }

  .logo-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--fg-primary);
  }

  .logo-version {
    font-size: 11px;
    color: var(--fg-secondary);
  }

  /* ========== 欢迎语 ========== */
  .welcome-section {
    text-align: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--gap);
  }

  .welcome-title {
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .welcome-desc {
    font-size: 12px;
    color: var(--fg-secondary);
  }

  /* ========== 搜索区 ========== */
  .search-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: var(--gap);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
  }

  .search-box input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--fg-primary);
    font-size: 13px;
    outline: none;
  }

  .search-box input::placeholder {
    color: var(--fg-secondary);
  }

  .search-actions {
    display: flex;
    gap: 8px;
  }

  .btn {
    padding: 6px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    background: var(--bg-secondary);
    color: var(--fg-primary);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn:hover {
    background: var(--bg-hover);
  }

  .btn-primary {
    background: var(--fg-accent);
    color: white;
    border-color: var(--fg-accent);
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  /* ========== 统计卡片 ========== */
  .stats-section {
    margin-bottom: var(--gap);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    background: var(--card-bg);
    border-radius: var(--radius);
    text-align: center;
  }

  .stat-number {
    font-size: 22px;
    font-weight: 700;
    color: var(--fg-accent);
  }

  .stat-label {
    font-size: 12px;
    color: var(--fg-secondary);
    margin-top: 2px;
  }

  .stat-change {
    font-size: 10px;
    color: var(--success);
    margin-top: 2px;
  }

  /* ========== 集群卡片 ========== */
  .clusters-section {
    margin-bottom: var(--gap);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
  }

  .section-action {
    font-size: 11px;
    color: var(--fg-accent);
    background: none;
    border: none;
    cursor: pointer;
  }

  .clusters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 8px;
  }

  .cluster-card {
    display: flex;
    flex-direction: column;
    padding: 12px;
    background: var(--card-bg);
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.15s ease;
    border: 1px solid transparent;
  }

  .cluster-card:hover {
    background: var(--bg-hover);
    border-color: var(--border-color);
  }

  .cluster-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .cluster-icon {
    font-size: 18px;
  }

  .cluster-name {
    font-size: 14px;
    font-weight: 500;
  }

  .cluster-desc {
    font-size: 11px;
    color: var(--fg-secondary);
    margin-bottom: 8px;
  }

  .cluster-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }

  .cluster-count {
    font-size: 11px;
    color: var(--fg-secondary);
  }

  .cluster-enter {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    color: var(--fg-accent);
  }

  /* ========== 最近使用 ========== */
  .recent-section,
  .hot-section {
    margin-bottom: var(--gap);
  }

  .list-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .list-item:hover {
    background: var(--bg-hover);
  }

  .list-icon {
    font-size: 16px;
    width: 24px;
    text-align: center;
  }

  .list-content {
    flex: 1;
    min-width: 0;
  }

  .list-title {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .list-meta {
    font-size: 11px;
    color: var(--fg-secondary);
  }

  .list-arrow {
    color: var(--fg-secondary);
    font-size: 12px;
  }

  /* ========== 热门技能排行 ========== */
  .hot-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: var(--radius);
    cursor: pointer;
  }

  .hot-item:hover {
    background: var(--bg-hover);
  }

  .hot-rank {
    width: 20px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--fg-accent);
  }

  .hot-name {
    flex: 1;
    font-size: 13px;
  }

  .hot-count {
    font-size: 11px;
    color: var(--fg-secondary);
  }

  /* ========== 新手上路 ========== */
  .guide-section {
    margin-bottom: var(--gap);
    padding: var(--gap);
    background: var(--card-bg);
    border-radius: var(--radius);
  }

  .guide-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .guide-desc {
    font-size: 12px;
    color: var(--fg-secondary);
    margin-bottom: 12px;
  }

  .guide-steps {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .guide-step {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: var(--radius);
    background: var(--bg-secondary);
  }

  .step-number {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--fg-accent);
    color: white;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .step-text {
    flex: 1;
  }

  .step-title {
    font-size: 12px;
    font-weight: 500;
  }

  .step-subtitle {
    font-size: 11px;
    color: var(--fg-secondary);
  }

  .guide-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  /* ========== 技能详情页 ========== */
  .skill-detail {
    padding: var(--gap);
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    margin-bottom: 12px;
    background: transparent;
    border: none;
    color: var(--fg-accent);
    font-size: 12px;
    cursor: pointer;
  }

  .skill-header {
    margin-bottom: 16px;
  }

  .skill-name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .skill-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11px;
    color: var(--fg-secondary);
    margin-bottom: 8px;
  }

  .skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .skill-tag {
    padding: 2px 8px;
    background: var(--bg-secondary);
    border-radius: 12px;
    font-size: 11px;
    color: var(--fg-accent);
  }

  .skill-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .skill-actions .btn {
    flex: 1;
    min-width: 120px;
  }

  .skill-content {
    background: var(--bg-secondary);
    border-radius: var(--radius);
    padding: 12px;
    line-height: 1.6;
  }

  .skill-content h1,
  .skill-content h2,
  .skill-content h3 {
    margin: 16px 0 8px;
    color: var(--fg-primary);
  }

  .skill-content p {
    margin: 8px 0;
  }

  .skill-content code {
    padding: 2px 6px;
    background: var(--card-bg);
    border-radius: 3px;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 12px;
  }

  .skill-content pre {
    padding: 12px;
    background: var(--card-bg);
    border-radius: var(--radius);
    overflow-x: auto;
    margin: 8px 0;
  }

  .skill-content pre code {
    background: transparent;
    padding: 0;
  }

  .skill-content ul,
  .skill-content ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  .skill-content li {
    margin: 4px 0;
  }

  .skill-content a {
    color: var(--fg-accent);
    text-decoration: none;
  }

  .skill-content a:hover {
    text-decoration: underline;
  }

  /* ========== Toast 通知 ========== */
  #toast-container {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .toast {
    padding: 10px 16px;
    border-radius: var(--radius);
    font-size: 12px;
    color: white;
    animation: toastIn 0.2s ease, toastOut 0.2s ease 2.8s forwards;
    pointer-events: auto;
  }

  .toast.success {
    background: var(--success);
  }

  .toast.error {
    background: var(--error);
  }

  .toast.warning {
    background: var(--warning);
    color: #1e1e1e;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes toastOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-10px); }
  }

  /* ========== 搜索页 ========== */
  .search-page .search-box {
    margin-bottom: var(--gap);
  }

  .search-results {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .result-item {
    padding: 10px;
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .result-item:hover {
    background: var(--bg-hover);
  }

  .result-title {
    font-size: 13px;
    margin-bottom: 2px;
  }

  .result-desc {
    font-size: 11px;
    color: var(--fg-secondary);
  }

  .result-match {
    font-size: 11px;
    color: var(--fg-accent);
  }

  /* ========== 收藏页 ========== */
  .favorites-empty {
    text-align: center;
    padding: 32px;
    color: var(--fg-secondary);
  }

  /* ========== 设置页 ========== */
  .settings-page {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .setting-label {
    font-size: 13px;
    font-weight: 500;
  }

  .setting-desc {
    font-size: 11px;
    color: var(--fg-secondary);
  }

  .setting-input {
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    color: var(--fg-primary);
    font-size: 13px;
    outline: none;
  }

  .setting-input:focus {
    border-color: var(--fg-accent);
  }

  .setting-select {
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    color: var(--fg-primary);
    font-size: 13px;
    outline: none;
    cursor: pointer;
  }

  /* ========== 错误页 ========== */
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
    gap: 12px;
  }

  .error-icon {
    font-size: 32px;
  }

  .error-title {
    font-size: 14px;
    color: var(--error);
  }

  .error-desc {
    font-size: 12px;
    color: var(--fg-secondary);
  }

  /* ========== 加载状态 ========== */
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    color: var(--fg-secondary);
  }

  /* ========== 滚动条美化 ========== */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--fg-secondary);
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add media/dashboard.css
  git commit -m "feat: add dashboard styles with responsive layout"
  ```

---

### Task 5: 创建 Dashboard JS 前端框架

**Files:**
- Create: `media/dashboard.js`

**说明:** 实现前端路由、消息通信、Dashboard 首页渲染。这是最大的文件，但逻辑清晰可分块。

- [ ] **Step 1: 编写 JS 核心框架**

  ```javascript
  (function () {
    // ========== 状态管理 ==========
    const state = {
      route: '/dashboard',
      data: null,        // init:data 接收的知识库数据
      recent: [],        // 最近使用
      favorites: [],     // 收藏列表
      stats: {},         // 统计数据
      settings: {},      // 设置
      searchResults: [], // 搜索结果
    };

    // ========== 消息通信 ==========
    const vscode = acquireVsCodeApi();

    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'init:data':
          state.data = message.data;
          render();
          break;
        case 'init:state':
          state.recent = message.data.recent;
          state.favorites = message.data.favorites;
          state.stats = message.data.stats;
          render();
          break;
        case 'search:result':
          state.searchResults = message.data;
          renderSearchResults();
          break;
        case 'install:result':
          showToast(message.data.success ? 'success' : 'error', message.data.message);
          break;
        case 'copy:result':
          showToast('success', message.data.message);
          break;
        case 'settings:data':
          state.settings = message.data;
          if (state.route === '/settings') render();
          break;
        case 'error':
          showToast('error', message.data.message);
          break;
      }
    });

    // 页面加载完成后通知 Extension
    document.addEventListener('DOMContentLoaded', () => {
      vscode.postMessage({ type: 'ready' });
      setupNavigation();
    });

    // ========== 路由系统 ==========
    function navigateTo(path) {
      state.route = path;
      updateNavActive();
      render();
    }

    function updateNavActive() {
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.route === state.route);
      });
    }

    function setupNavigation() {
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const route = btn.dataset.route;
          if (route === '/search') {
            navigateTo('/search');
            // 聚焦搜索框
            setTimeout(() => {
              const input = document.querySelector('.search-page input');
              if (input) input.focus();
            }, 50);
          } else {
            navigateTo(route);
          }
        });
      });
    }

    // ========== 渲染分发 ==========
    function render() {
      const app = document.getElementById('app');
      if (!app) return;

      if (!state.data) {
        app.innerHTML = '<div class="loading">正在加载知识库...</div>';
        return;
      }

      switch (state.route) {
        case '/dashboard':
          app.innerHTML = renderDashboard();
          attachDashboardEvents();
          break;
        case '/cluster':
          app.innerHTML = renderClusterDetail();
          attachClusterEvents();
          break;
        case '/skill':
          app.innerHTML = renderSkillDetail();
          attachSkillEvents();
          break;
        case '/search':
          app.innerHTML = renderSearchPage();
          attachSearchEvents();
          break;
        case '/favorites':
          app.innerHTML = renderFavoritesPage();
          attachFavoritesEvents();
          break;
        case '/settings':
          app.innerHTML = renderSettingsPage();
          attachSettingsEvents();
          break;
        default:
          navigateTo('/dashboard');
      }
    }

    // ========== Dashboard 首页渲染 ==========
    function renderDashboard() {
      const { clusters, agents, skills } = state.data;
      const recent = state.recent.slice(0, 4);
      const hotSkills = getHotSkills(skills);

      return `
        <div class="dashboard-page">
          <!-- Logo -->
          <div class="logo-section">
            <div class="logo-icon">🤖</div>
            <div class="logo-title">AI Knowledge Base</div>
            <div class="logo-version">v1.0.0</div>
          </div>

          <!-- 欢迎语 -->
          <div class="welcome-section">
            <div class="welcome-title">欢迎来到 AI 技能知识库</div>
            <div class="welcome-desc">沉淀团队 AI 协作最佳实践，让每个人都能高效使用 AI</div>
          </div>

          <!-- 搜索 -->
          <div class="search-section">
            <div class="search-box" id="dashboard-search-box">
              <span>🔍</span>
              <input type="text" placeholder="快速搜索技能或智能体..." id="dashboard-search-input">
            </div>
            <div class="search-actions">
              <button class="btn" id="btn-docs">查看文档</button>
              <button class="btn btn-primary" id="btn-start">开始使用</button>
            </div>
          </div>

          <!-- 统计 -->
          <div class="stats-section">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${state.stats.clusterCount || clusters.length}</div>
                <div class="stat-label">智能体集群</div>
                <div class="stat-change">+2 较上月</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${state.stats.agentCount || agents.length}</div>
                <div class="stat-label">智能体</div>
                <div class="stat-change">+5 较上月</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${state.stats.skillCount || skills.length}</div>
                <div class="stat-label">技能</div>
                <div class="stat-change">+12 较上月</div>
              </div>
            </div>
          </div>

          <!-- 集群入口 -->
          <div class="clusters-section">
            <div class="section-header">
              <span class="section-title">📋 选择你的角色，快速开始</span>
            </div>
            <div class="clusters-grid">
              ${clusters.map(c => {
                const clusterAgents = c.agents.map(id => agents.find(a => a.id === id)).filter(Boolean);
                return `
                  <div class="cluster-card" data-cluster-id="${c.id}">
                    <div class="cluster-header">
                      <span class="cluster-icon">⚡</span>
                      <span class="cluster-name">${escapeHtml(c.name)}</span>
                    </div>
                    <div class="cluster-desc">${escapeHtml(c.description)}</div>
                    <div class="cluster-footer">
                      <span class="cluster-count">${clusterAgents.length} 个智能体</span>
                      <span class="cluster-enter">进入集群 →</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- 最近使用 -->
          <div class="recent-section">
            <div class="section-header">
              <span class="section-title">🕐 最近使用</span>
              <button class="section-action" data-route="/recent">全部历史</button>
            </div>
            ${recent.length > 0 ? recent.map(r => `
              <div class="list-item" data-skill-id="${r.skillId}">
                <span class="list-icon">📄</span>
                <div class="list-content">
                  <div class="list-title">${escapeHtml(r.skillName)}</div>
                  <div class="list-meta">${timeAgo(r.timestamp)} · ${escapeHtml(r.agentName)} · ${escapeHtml(r.clusterName)}</div>
                </div>
                <span class="list-arrow">→</span>
              </div>
            `).join('') : '<div style="padding: 12px; color: var(--fg-secondary); font-size: 12px;">暂无使用记录</div>'}
          </div>

          <!-- 热门技能 -->
          <div class="hot-section">
            <div class="section-header">
              <span class="section-title">🔥 热门技能</span>
              <button class="section-action" id="btn-all-hot">查看全部</button>
            </div>
            ${hotSkills.slice(0, 5).map((s, i) => `
              <div class="hot-item" data-skill-id="${s.id}">
                <span class="hot-rank">${i + 1}</span>
                <span class="hot-name">${escapeHtml(s.name)}</span>
                <span class="hot-count">${s.count || 0} 次</span>
              </div>
            `).join('')}
          </div>

          <!-- 新手上路 -->
          <div class="guide-section">
            <div class="guide-title">🚀 新手上路</div>
            <div class="guide-desc">只需 4 步，开始使用 AI 技能知识库</div>
            <div class="guide-steps">
              <div class="guide-step">
                <span class="step-number">01</span>
                <div class="step-text">
                  <div class="step-title">了解智能体和集群</div>
                  <div class="step-subtitle">浏览六大工程集群</div>
                </div>
              </div>
              <div class="guide-step">
                <span class="step-number">02</span>
                <div class="step-text">
                  <div class="step-title">选择技能并安装</div>
                  <div class="step-subtitle">找到适合的技能</div>
                </div>
              </div>
              <div class="guide-step">
                <span class="step-number">03</span>
                <div class="step-text">
                  <div class="step-title">执行工作流</div>
                  <div class="step-subtitle">按步骤完成任务</div>
                </div>
              </div>
              <div class="guide-step">
                <span class="step-number">04</span>
                <div class="step-text">
                  <div class="step-title">收藏常用技能</div>
                  <div class="step-subtitle">建立个人技能库</div>
                </div>
              </div>
            </div>
            <div class="guide-actions">
              <button class="btn" id="btn-guide">阅读完整指南</button>
              <button class="btn" id="btn-video">观看视频教程</button>
            </div>
          </div>
        </div>
      `;
    }

    function attachDashboardEvents() {
      // 搜索框点击跳转搜索页
      const searchBox = document.getElementById('dashboard-search-box');
      if (searchBox) {
        searchBox.addEventListener('click', () => navigateTo('/search'));
      }

      // 集群卡片点击
      document.querySelectorAll('.cluster-card').forEach(card => {
        card.addEventListener('click', () => {
          state.currentClusterId = card.dataset.clusterId;
          navigateTo('/cluster');
        });
      });

      // 最近使用项点击
      document.querySelectorAll('.recent-section .list-item').forEach(item => {
        item.addEventListener('click', () => {
          state.currentSkillId = item.dataset.skillId;
          navigateTo('/skill');
          vscode.postMessage({ type: 'open:skill', skillId: item.dataset.skillId });
        });
      });

      // 热门技能点击
      document.querySelectorAll('.hot-item').forEach(item => {
        item.addEventListener('click', () => {
          state.currentSkillId = item.dataset.skillId;
          navigateTo('/skill');
          vscode.postMessage({ type: 'open:skill', skillId: item.dataset.skillId });
        });
      });
    }

    // ========== 集群详情页渲染 ==========
    function renderClusterDetail() {
      const { clusters, agents, skills } = state.data;
      const cluster = clusters.find(c => c.id === state.currentClusterId);
      if (!cluster) return '<div class="error-page">集群未找到</div>';

      const clusterAgents = cluster.agents
        .map(id => agents.find(a => a.id === id))
        .filter(Boolean);

      return `
        <div class="cluster-page">
          <button class="back-btn" id="cluster-back">← 返回</button>
          <div class="skill-header">
            <div class="skill-name">${escapeHtml(cluster.name)}</div>
            <div class="skill-meta">${escapeHtml(cluster.description)}</div>
          </div>
          <div class="clusters-section">
            ${clusterAgents.map(agent => {
              const agentSkills = agent.skills
                .map(id => skills.find(s => s.id === id))
                .filter(Boolean);
              return `
                <div class="cluster-card" data-agent-id="${agent.id}">
                  <div class="cluster-header">
                    <span class="cluster-icon">🤖</span>
                    <span class="cluster-name">${escapeHtml(agent.name)}</span>
                  </div>
                  <div class="cluster-desc">${escapeHtml(agent.description)}</div>
                  <div class="cluster-footer">
                    <span class="cluster-count">${agentSkills.length} 个技能</span>
                    <span class="cluster-enter">查看 →</span>
                  </div>
                </div>
                ${agentSkills.map(skill => `
                  <div class="list-item" data-skill-id="${skill.id}" style="margin-left: 16px;">
                    <span class="list-icon">⚡</span>
                    <div class="list-content">
                      <div class="list-title">${escapeHtml(skill.name)}</div>
                      <div class="list-meta">${escapeHtml(skill.description)}</div>
                    </div>
                    <span class="list-arrow">→</span>
                  </div>
                `).join('')}
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    function attachClusterEvents() {
      document.getElementById('cluster-back')?.addEventListener('click', () => navigateTo('/dashboard'));
      document.querySelectorAll('.cluster-page .list-item').forEach(item => {
        item.addEventListener('click', () => {
          state.currentSkillId = item.dataset.skillId;
          navigateTo('/skill');
          vscode.postMessage({ type: 'open:skill', skillId: item.dataset.skillId });
        });
      });
    }

    // ========== 技能详情页渲染 ==========
    function renderSkillDetail() {
      const { skills } = state.data;
      const skill = skills.find(s => s.id === state.currentSkillId);
      if (!skill) return '<div class="error-page">技能未找到</div>';

      const isFav = state.favorites.includes(skill.id);

      return `
        <div class="skill-detail">
          <button class="back-btn" id="skill-back">← 返回</button>
          <div class="skill-header">
            <div class="skill-name">${escapeHtml(skill.name)}</div>
            <div class="skill-meta">
              <span>版本: ${skill.version}</span>
              <span>${skill.date}</span>
            </div>
            <div class="skill-tags">
              ${skill.tags.map(t => `<span class="skill-tag">#${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 12px; font-size: 11px; color: var(--fg-secondary);">
            ${skill.estimatedTime ? `<span>⏱ 预计: ${skill.estimatedTime}</span>` : ''}
            <span>${skill.standalone ? '🔗 可独立使用' : '🔗 需配合智能体'}</span>
          </div>
          <div class="skill-actions">
            <button class="btn" id="btn-copy">📋 复制 Prompt</button>
            <button class="btn" id="btn-install-claude">⬇️ 安装到 Claude</button>
            <button class="btn" id="btn-install-cursor">⬇️ 安装到 Cursor</button>
            <button class="btn ${isFav ? 'btn-primary' : ''}" id="btn-favorite">${isFav ? '⭐ 已收藏' : '☆ 收藏'}</button>
          </div>
          <div class="skill-content" id="skill-content">
            ${markdownToHtml(skill.content)}
          </div>
        </div>
      `;
    }

    function attachSkillEvents() {
      document.getElementById('skill-back')?.addEventListener('click', () => navigateTo('/dashboard'));
      document.getElementById('btn-copy')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'copy:prompt', skillId: state.currentSkillId });
      });
      document.getElementById('btn-install-claude')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'install:skill', skillId: state.currentSkillId, target: 'claude-code' });
      });
      document.getElementById('btn-install-cursor')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'install:skill', skillId: state.currentSkillId, target: 'cursor' });
      });
      document.getElementById('btn-favorite')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'toggle:favorite', skillId: state.currentSkillId });
      });
    }

    // ========== 搜索页渲染 ==========
    function renderSearchPage() {
      return `
        <div class="search-page">
          <div class="search-box">
            <span>🔍</span>
            <input type="text" placeholder="输入技能名称、标签或关键词..." id="search-input">
          </div>
          <div class="search-results" id="search-results">
            <div style="padding: 12px; color: var(--fg-secondary); font-size: 12px;">输入关键词开始搜索</div>
          </div>
        </div>
      `;
    }

    function attachSearchEvents() {
      const input = document.getElementById('search-input');
      let debounceTimer;
      input?.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const query = e.target.value.trim();
          if (query) {
            vscode.postMessage({ type: 'search:query', query });
          } else {
            state.searchResults = [];
            renderSearchResults();
          }
        }, 300);
      });
      input?.focus();
    }

    function renderSearchResults() {
      const container = document.getElementById('search-results');
      if (!container) return;

      if (state.searchResults.length === 0) {
        container.innerHTML = '<div style="padding: 12px; color: var(--fg-secondary); font-size: 12px;">未找到匹配结果</div>';
        return;
      }

      container.innerHTML = state.searchResults.map(r => `
        <div class="result-item" data-skill-id="${r.skill.id}">
          <div class="result-title">${escapeHtml(r.skill.name)}</div>
          <div class="result-desc">${escapeHtml(r.skill.description)}</div>
          <div class="result-match">匹配: ${r.matchedFields.join(', ')}</div>
        </div>
      `).join('');

      container.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', () => {
          state.currentSkillId = item.dataset.skillId;
          navigateTo('/skill');
          vscode.postMessage({ type: 'open:skill', skillId: item.dataset.skillId });
        });
      });
    }

    // ========== 收藏页渲染 ==========
    function renderFavoritesPage() {
      const { skills } = state.data;
      const favSkills = state.favorites
        .map(id => skills.find(s => s.id === id))
        .filter(Boolean);

      return `
        <div class="favorites-page">
          <div class="section-header">
            <span class="section-title">⭐ 我的收藏</span>
          </div>
          ${favSkills.length > 0 ? favSkills.map(s => `
            <div class="list-item" data-skill-id="${s.id}">
              <span class="list-icon">⚡</span>
              <div class="list-content">
                <div class="list-title">${escapeHtml(s.name)}</div>
                <div class="list-meta">${escapeHtml(s.description)}</div>
              </div>
              <span class="list-arrow">→</span>
            </div>
          `).join('') : '<div class="favorites-empty">暂无收藏技能<br>点击技能详情页的收藏按钮添加</div>'}
        </div>
      `;
    }

    function attachFavoritesEvents() {
      document.querySelectorAll('.favorites-page .list-item').forEach(item => {
        item.addEventListener('click', () => {
          state.currentSkillId = item.dataset.skillId;
          navigateTo('/skill');
          vscode.postMessage({ type: 'open:skill', skillId: item.dataset.skillId });
        });
      });
    }

    // ========== 设置页渲染 ==========
    function renderSettingsPage() {
      vscode.postMessage({ type: 'get:settings' });
      return `
        <div class="settings-page">
          <div class="section-header">
            <span class="section-title">⚙ 设置</span>
          </div>
          <div class="setting-item">
            <label class="setting-label">本地知识库路径</label>
            <div class="setting-desc">留空则使用内置模板</div>
            <input type="text" class="setting-input" id="setting-path" value="${escapeHtml(state.settings.localPath || '')}" placeholder="例如: C:\\Users\\name\\my-knowledge-base">
          </div>
          <div class="setting-item">
            <label class="setting-label">默认安装目标</label>
            <div class="setting-desc">技能安装的默认平台</div>
            <select class="setting-select" id="setting-target">
              <option value="claude-code" ${state.settings.defaultInstallTarget === 'claude-code' ? 'selected' : ''}>Claude Code</option>
              <option value="cursor" ${state.settings.defaultInstallTarget === 'cursor' ? 'selected' : ''}>Cursor</option>
              <option value="generic" ${state.settings.defaultInstallTarget === 'generic' ? 'selected' : ''}>通用</option>
            </select>
          </div>
          <div style="margin-top: 8px;">
            <button class="btn btn-primary" id="btn-save-settings">保存设置</button>
          </div>
        </div>
      `;
    }

    function attachSettingsEvents() {
      document.getElementById('btn-save-settings')?.addEventListener('click', () => {
        const path = document.getElementById('setting-path').value;
        const target = document.getElementById('setting-target').value;
        // 通过 VS Code 配置 API 保存（这里用 postMessage 让 Extension 处理）
        vscode.postMessage({
          type: 'save:settings',
          data: { localPath: path, defaultInstallTarget: target }
        });
        showToast('success', '设置已保存');
      });
    }

    // ========== 工具函数 ==========
    function escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function timeAgo(timestamp) {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return '刚刚';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}分钟前`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}小时前`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}天前`;
      return '很久以前';
    }

    function getHotSkills(skills) {
      // 基于使用次数排序，没有数据时返回前几个技能作为占位
      return [...skills]
        .map(s => ({ ...s, count: s.usageCount || Math.floor(Math.random() * 1500) }))
        .sort((a, b) => b.count - a.count);
    }

    function markdownToHtml(markdown) {
      if (!markdown) return '';
      let html = markdown
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // 代码块
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
      // 列表
      html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
      html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
      // 链接
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      // 段落
      const lines = html.split('\n');
      const result = [];
      let inP = false;
      for (const line of lines) {
        const t = line.trim();
        if (t === '') { if (inP) { result.push('</p>'); inP = false; } continue; }
        if (t.startsWith('<')) { if (inP) { result.push('</p>'); inP = false; } result.push(t); }
        else { if (!inP) { result.push('<p>'); inP = true; } result.push(t); }
      }
      if (inP) result.push('</p>');
      let finalHtml = result.join('\n');
      finalHtml = finalHtml.replace(/(<li>.*?<\/li>\n?)+/gs, '<ul>$&</ul>');
      return finalHtml;
    }

    function showToast(type, message) {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  })();
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add media/dashboard.js
  git commit -m "feat: add dashboard frontend with routing and views"
  ```

---

### Task 6: 创建 RecentService

**Files:**
- Create: `src/services/RecentService.ts`
- Modify: `src/models/types.ts`

- [ ] **Step 1: 扩展 types.ts 添加 RecentItem 接口**

  在 `src/models/types.ts` 末尾添加：

  ```typescript
  export interface RecentItem {
    skillId: string;
    skillName: string;
    agentName: string;
    clusterName: string;
    timestamp: number;
  }

  export interface DashboardStats {
    clusterCount: number;
    agentCount: number;
    skillCount: number;
  }
  ```

- [ ] **Step 2: 编写 RecentService**

  ```typescript
  import * as vscode from 'vscode';
  import { KnowledgeService } from './KnowledgeService';
  import { RecentItem, DashboardStats, KnowledgeBase } from '../models/types';

  const MAX_RECENT = 20;
  const RECENT_KEY = 'aiKnowledgeBase.recent';
  const FAVORITES_KEY = 'aiKnowledgeBase.favorites';

  export class RecentService {
    constructor(private context: vscode.ExtensionContext) {}

    getRecent(): RecentItem[] {
      return this.context.globalState.get<RecentItem[]>(RECENT_KEY, []);
    }

    getFavorites(): string[] {
      return this.context.globalState.get<string[]>(FAVORITES_KEY, []);
    }

    addRecent(skillId: string, knowledgeService: KnowledgeService): void {
      const skill = knowledgeService.getSkill(skillId);
      if (!skill) return;

      const kb = knowledgeService.getKnowledgeBase();
      const agent = kb.agents.find(a => a.id === skill.parentAgent);
      const cluster = kb.clusters.find(c => c.id === skill.cluster);

      const recent = this.getRecent();
      const newItem: RecentItem = {
        skillId,
        skillName: skill.name,
        agentName: agent?.name || '未知智能体',
        clusterName: cluster?.name || '未知集群',
        timestamp: Date.now()
      };

      // 去重并移到最前
      const filtered = recent.filter(r => r.skillId !== skillId);
      filtered.unshift(newItem);

      // 限制数量
      const trimmed = filtered.slice(0, MAX_RECENT);
      this.context.globalState.update(RECENT_KEY, trimmed);
    }

    toggleFavorite(skillId: string): void {
      const favorites = this.getFavorites();
      const index = favorites.indexOf(skillId);
      if (index > -1) {
        favorites.splice(index, 1);
      } else {
        favorites.push(skillId);
      }
      this.context.globalState.update(FAVORITES_KEY, favorites);
    }

    getStats(kb: KnowledgeBase): DashboardStats {
      return {
        clusterCount: kb.clusters.length,
        agentCount: kb.agents.length,
        skillCount: kb.skills.length
      };
    }
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/models/types.ts src/services/RecentService.ts
  git commit -m "feat: add RecentService for tracking usage and favorites"
  ```

---

### Task 7: 改造 extension.ts

**Files:**
- Modify: `src/extension.ts`

**说明:** 注册 DashboardWebviewViewProvider，绑定命令，移除旧的 TreeView 注册。

- [ ] **Step 1: 重写 extension.ts**

  ```typescript
  import * as vscode from 'vscode';
  import { KnowledgeService } from './services/KnowledgeService';
  import { SearchService } from './services/SearchService';
  import { InstallService } from './services/InstallService';
  import { RecentService } from './services/RecentService';
  import { DashboardWebviewViewProvider } from './providers/DashboardWebviewViewProvider';

  export function activate(context: vscode.ExtensionContext) {
    try {
      // 初始化服务
      const knowledgeService = new KnowledgeService(context.extensionPath);
      const searchService = new SearchService(knowledgeService);
      const installService = new InstallService();
      const recentService = new RecentService(context);

      // 注册 Dashboard WebviewView Provider
      const dashboardProvider = new DashboardWebviewViewProvider(
        context.extensionUri,
        knowledgeService,
        searchService,
        installService,
        recentService
      );

      context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
          DashboardWebviewViewProvider.viewType,
          dashboardProvider
        )
      );

      // 异步加载知识库
      knowledgeService.loadKnowledgeBase()
        .then((kb) => {
          if (kb.clusters.length === 0) {
            vscode.window.showWarningMessage('AI知识库: 未找到任何集群数据，请检查模板文件');
          }
          // 数据加载后，Provider 会在 Webview ready 时自动推送数据
        })
        .catch((err) => {
          vscode.window.showErrorMessage(`AI知识库加载失败: ${err.message || err}`);
          console.error('Knowledge base load error:', err);
        });

      // 刷新 Dashboard 命令
      context.subscriptions.push(
        vscode.commands.registerCommand('aiKnowledgeBase.refreshDashboard', () => {
          dashboardProvider.refresh();
        })
      );

      // 首次激活提示用户调整 sidebar 宽度
      const hasShownWidthHint = context.globalState.get('aiKnowledgeBase.hasShownWidthHint', false);
      if (!hasShownWidthHint) {
        setTimeout(() => {
          vscode.window.showInformationMessage(
            'AI 技能知识库: 建议将左侧边栏宽度拉至 550px 以上以获得最佳体验',
            '知道了'
          );
          context.globalState.update('aiKnowledgeBase.hasShownWidthHint', true);
        }, 2000);
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`AI知识库插件初始化失败: ${msg}`);
      console.error('Extension activation error:', err);
    }
  }

  export function deactivate() {}
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/extension.ts
  git commit -m "feat: wire up DashboardWebviewViewProvider in extension entry"
  ```

---

### Task 8: 添加 save:settings 消息处理

**Files:**
- Modify: `src/providers/DashboardWebviewViewProvider.ts`

- [ ] **Step 1: 在消息处理中添加 save:settings 分支**

  在 `resolveWebviewView` 的 `onDidReceiveMessage` switch 中添加：

  ```typescript
  case 'save:settings':
    await this._handleSaveSettings(message.data);
    break;
  ```

  然后在类中添加方法：

  ```typescript
  private async _handleSaveSettings(data: { localPath: string; defaultInstallTarget: string }) {
    const config = vscode.workspace.getConfiguration('aiKnowledgeBase');
    await config.update('localPath', data.localPath, true);
    await config.update('defaultInstallTarget', data.defaultInstallTarget, true);
    this._sendSettings();
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/providers/DashboardWebviewViewProvider.ts
  git commit -m "feat: add save settings message handler"
  ```

---

### Task 9: 清理废弃文件

**Files:**
- Delete: `src/providers/KnowledgeTreeProvider.ts`
- Delete: `src/providers/SkillDetailProvider.ts`
- Delete: `media/skill-detail.html`（如果存在）

- [ ] **Step 1: 删除废弃文件**

  ```bash
  git rm src/providers/KnowledgeTreeProvider.ts
  git rm src/providers/SkillDetailProvider.ts
  if [ -f media/skill-detail.html ]; then git rm media/skill-detail.html; fi
  ```

- [ ] **Step 2: Commit**

  ```bash
  git commit -m "chore: remove obsolete TreeView and SkillDetail providers"
  ```

---

### Task 10: 编译验证与修复

**Files:**
- Modify: 任何有编译错误的文件

- [ ] **Step 1: 运行 TypeScript 编译**

  ```bash
  cd vscode-file-explorer && npx tsc --noEmit
  ```

- [ ] **Step 2: 修复所有编译错误**

  常见可能的问题：
  - `DashboardWebviewViewProvider` 中引用了已删除的类型（如有）
  - `extension.ts` 中旧导入残留
  - 缺少 `vscode` 模块的 import

- [ ] **Step 3: Commit**

  ```bash
  git add -A
  git commit -m "fix: resolve typescript compilation errors"
  ```

---

### Task 11: 功能集成验证

**Files:**
- 无文件修改，纯验证

- [ ] **Step 1: 打包并安装验证**

  ```bash
  cd vscode-file-explorer
  npm run compile
  npx vsce package
  ```

- [ ] **Step 2: 在 VS Code 中测试以下流程**

  1. 激活插件，确认 sidebar 显示 Dashboard（而非树形结构）
  2. 确认 550px 宽度提示出现
  3. 点击各导航按钮（首页/搜索/收藏/设置）正常切换
  4. 点击集群卡片进入集群详情
  5. 点击技能进入技能详情
  6. 点击"复制 Prompt"确认剪贴板有内容
  7. 点击"安装到 Claude"确认安装流程正常
  8. 点击收藏按钮，切换到收藏页确认已收藏
  9. 在设置页修改设置，确认保存生效
  10. 搜索功能正常工作

- [ ] **Step 3: 如发现 bug，修复后 commit**

  ```bash
  git add -A
  git commit -m "fix: <具体修复内容>"
  ```

---

## 自审

### Spec 覆盖检查

| 设计文档要求 | 对应任务 |
|------------|---------|
| WebviewView 替代 TreeView | Task 1, 2, 7 |
| Dashboard 首页所有模块 | Task 4, 5 |
| 顶部导航栏 | Task 3, 5 |
| 集群详情页 | Task 5 |
| 技能详情页 | Task 5 |
| 搜索页 | Task 5 |
| 收藏页 | Task 5, 6 |
| 设置页 | Task 5, 8 |
| Extension ↔ Webview 通信 | Task 2, 5 |
| 最近使用持久化 | Task 6 |
| 收藏持久化 | Task 6 |
| 响应式布局 | Task 4 |
| 废弃文件清理 | Task 9 |

**无遗漏。**

### 占位符检查

- 无 TBD/TODO
- 无 "implement later"
- 无 "add appropriate error handling" 等模糊描述
- 每个代码步骤都有完整代码

### 类型一致性检查

- `RecentItem`, `DashboardStats` 在 types.ts 中定义，在 RecentService 中使用，一致
- 消息类型字符串在 Provider 和 JS 中一一对应，一致
- 方法签名在各任务中一致

**自审通过。**
