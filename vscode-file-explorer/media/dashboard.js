(function () {
  const state = {
    route: '/dashboard',
    data: null,
    recent: [],
    favorites: [],
    stats: {},
    usageStats: { skillUsage: {}, scenarioUsage: {}, lastUsed: 0 },
    topScenarios: [],
    viewMode: 'role',
    scenarios: [],
    settings: {},
    searchResults: [],
    currentClusterId: null,
    currentSkillId: null,
  };

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
        state.usageStats = message.data.usageStats || state.usageStats;
        state.topScenarios = message.data.topScenarios || [];
        state.viewMode = message.data.viewMode || 'role';
        render();
        break;
      case 'scenarios:data':
        state.scenarios = message.data;
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

  document.addEventListener('DOMContentLoaded', () => {
    vscode.postMessage({ type: 'ready' });
    setupNavigation();
  });

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

  function renderDashboard() {
    const { clusters, agents, skills } = state.data;
    const recent = state.recent.slice(0, 4);

    return `
      <div class="dashboard-page">
        <div class="logo-section">
          <div class="logo-icon">🤖</div>
          <div class="logo-title">AI Knowledge Base</div>
          <div class="logo-version">v1.0.0</div>
        </div>
        <div class="welcome-section">
          <div class="welcome-title">欢迎来到 AI 技能知识库</div>
          <div class="welcome-desc">沉淀团队 AI 协作最佳实践，让每个人都能高效使用 AI</div>
        </div>
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
            <div class="stat-card">
              <div class="stat-number">${state.stats.scenarioCount || 8}</div>
              <div class="stat-label">场景</div>
            </div>
          </div>
        </div>

        <div class="view-mode-tabs">
          <button class="view-mode-btn ${state.viewMode === 'role' ? 'active' : ''}" data-mode="role">
            <span>🏷️</span> 按角色浏览
          </button>
          <button class="view-mode-btn ${state.viewMode === 'scenario' ? 'active' : ''}" data-mode="scenario">
            <span>🎯</span> 按场景浏览
          </button>
        </div>

        <div class="view-mode-content">
          ${state.viewMode === 'role'
            ? renderRoleView(clusters, agents, skills)
            : renderScenarioView(skills)
          }
        </div>
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
        ${renderQuickCreate()}
        ${renderMyTopScenarios()}
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

  function renderRoleView(clusters, agents, skills) {
    // 开发工程集群永远排第一
    const sortedClusters = [...clusters].sort((a, b) => {
      if (a.id === '03-开发工程') return -1;
      if (b.id === '03-开发工程') return 1;
      return a.id.localeCompare(b.id);
    });

    return `
      <div class="clusters-section">
        <div class="section-header">
          <span class="section-title">📋 选择你的角色，快速开始</span>
        </div>
        <div class="clusters-grid">
          ${sortedClusters.map(c => {
            const clusterAgents = c.agents.map(id => agents.find(a => a.id === id)).filter(Boolean);
            const clusterSkills = c.skills.map(id => skills.find(s => s.id === id)).filter(Boolean);
            return `
              <div class="cluster-card" data-cluster-id="${c.id}">
                <div class="cluster-header">
                  <span class="cluster-icon">⚡</span>
                  <span class="cluster-name">${escapeHtml(c.name)}</span>
                  ${c.id === '03-开发工程' ? '<span class="cluster-badge">核心</span>' : ''}
                </div>
                <div class="cluster-desc">${escapeHtml(c.description)}</div>
                <div class="cluster-footer">
                  <span class="cluster-count">${clusterAgents.length} 个智能体 · ${clusterSkills.length} 个技能</span>
                  <span class="cluster-enter">进入 →</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderScenarioView(skills) {
    const scenarios = state.scenarios.length > 0 ? state.scenarios : [
      { id: 'write-doc', name: '写文档', icon: '📝', description: '周报、会议纪要、项目材料、测试报告' },
      { id: 'troubleshoot', name: '查故障', icon: '🔧', description: '排查、巡检、日志分析' },
      { id: 'write-code', name: '写代码', icon: '💻', description: '生成、Review、Bug 定位' },
      { id: 'data-work', name: '搞数据', icon: '🗄️', description: 'SQL、报表、迁移、清理' },
      { id: 'design', name: '做设计', icon: '📐', description: '原型、数模、架构、接口' },
      { id: 'manage-project', name: '管项目', icon: '📊', description: '计划、跟踪、汇报' },
      { id: 'test-quality', name: '测试质量', icon: '✅', description: '用例、审查、验证' },
      { id: 'knowledge', name: '知识检索', icon: '📚', description: '问答、文档整理' }
    ];

    return `
      <div class="scenarios-section">
        <div class="section-header">
          <span class="section-title">💡 你在做什么？选择一个场景开始</span>
        </div>
        <div class="scenarios-grid">
          ${scenarios.map(s => {
            const skillCount = skills.filter(skill =>
              (skill.scenarioTags || []).some(t => t.toLowerCase() === s.id.toLowerCase() || t === s.name)
            ).length;
            return `
              <div class="scenario-card" data-scenario-id="${s.id}">
                <div class="scenario-icon">${s.icon}</div>
                <div class="scenario-name">${escapeHtml(s.name)}</div>
                <div class="scenario-desc">${escapeHtml(s.description)}</div>
                <div class="scenario-count">${skillCount} 个技能</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderQuickCreate() {
    return `
      <div class="quick-create-section">
        <div class="section-header">
          <span class="section-title">⚡ 快速创建</span>
        </div>
        <div class="quick-create-grid">
          <div class="quick-create-card" data-action="写周报">
            <div class="quick-create-icon">📝</div>
            <div class="quick-create-name">写周报</div>
            <div class="quick-create-desc">一键生成工作周报</div>
          </div>
          <div class="quick-create-card" data-action="会议纪要">
            <div class="quick-create-icon">📋</div>
            <div class="quick-create-name">会议纪要</div>
            <div class="quick-create-desc">整理会议要点</div>
          </div>
          <div class="quick-create-card" data-action="项目材料">
            <div class="quick-create-icon">📁</div>
            <div class="quick-create-name">项目材料</div>
            <div class="quick-create-desc">生成项目交付文档</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMyTopScenarios() {
    const topScenarios = state.topScenarios || [];
    if (topScenarios.length === 0) {
      return '';
    }

    return `
      <div class="top-scenarios-section">
        <div class="section-header">
          <span class="section-title">🔥 我的常用场景</span>
        </div>
        <div class="top-scenarios-list">
          ${topScenarios.map((s, i) => `
            <div class="top-scenario-item" data-scenario-id="${s.id}">
              <span class="top-scenario-rank">${i + 1}</span>
              <span class="top-scenario-name">${escapeHtml(s.name)}</span>
              <span class="top-scenario-count">${s.count} 次</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function attachDashboardEvents() {
    const searchBox = document.getElementById('dashboard-search-box');
    if (searchBox) searchBox.addEventListener('click', () => navigateTo('/search'));

    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        state.viewMode = mode;
        vscode.postMessage({ type: 'switch:viewMode', mode });
        render();
      });
    });

    document.querySelectorAll('.cluster-card').forEach(card => {
      card.addEventListener('click', () => {
        state.currentClusterId = card.dataset.clusterId;
        navigateTo('/cluster');
      });
    });

    document.querySelectorAll('.recent-section .list-item').forEach(item => {
      item.addEventListener('click', () => {
        state.currentSkillId = item.dataset.skillId;
        navigateTo('/skill');
        vscode.postMessage({ type: 'open:skill', skillId: item.dataset.skillId });
      });
    });

    document.querySelectorAll('.scenario-card').forEach(card => {
      card.addEventListener('click', () => {
        const scenarioId = card.dataset.scenarioId;
        vscode.postMessage({ type: 'track:scenario', scenarioId });
        showToast('info', `场景「${card.querySelector('.scenario-name')?.textContent || scenarioId}」详情页待实施`);
      });
    });

    document.querySelectorAll('.quick-create-card').forEach(card => {
      card.addEventListener('click', () => {
        const action = card.dataset.action;
        showToast('info', `${action} 功能即将推出`);
      });
    });

    document.querySelectorAll('.top-scenario-item').forEach(item => {
      item.addEventListener('click', () => {
        const scenarioId = item.dataset.scenarioId;
        vscode.postMessage({ type: 'track:scenario', scenarioId });
      });
    });
  }

  function renderClusterDetail() {
    const { clusters, agents, skills } = state.data;
    const cluster = clusters.find(c => c.id === state.currentClusterId);
    if (!cluster) return '<div class="error-page">集群未找到</div>';

    const clusterAgents = cluster.agents.map(id => agents.find(a => a.id === id)).filter(Boolean);

    return `
      <div class="cluster-page">
        <button class="back-btn" id="cluster-back">← 返回</button>
        <div class="skill-header">
          <div class="skill-name">${escapeHtml(cluster.name)}</div>
          <div class="skill-meta">${escapeHtml(cluster.description)}</div>
        </div>
        <div class="clusters-section">
          ${clusterAgents.map(agent => {
            const agentSkills = agent.skills.map(id => skills.find(s => s.id === id)).filter(Boolean);
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

  function renderSkillDetail() {
    const { skills } = state.data;
    const skill = skills.find(s => s.id === state.currentSkillId);
    if (!skill) return '<div class="error-page">技能未找到</div>';

    const isFav = state.favorites.includes(skill.id);
    const isChecklist = skill.type === 'checklist';
    const scenarioTags = skill.scenarioTags || [];

    return `
      <div class="skill-detail">
        <button class="back-btn" id="skill-back">← 返回</button>
        <div class="skill-header">
          <div class="skill-name">${escapeHtml(skill.name)}</div>
          <div class="skill-meta">
            <span>版本: ${skill.version}</span>
            <span>${skill.date}</span>
            ${isChecklist ? '<span class="skill-type-badge">📋 检查清单</span>' : ''}
          </div>
          <div class="skill-tags">
            ${skill.tags.map(t => `<span class="skill-tag">#${escapeHtml(t)}</span>`).join('')}
            ${scenarioTags.map(t => `<span class="skill-tag scenario-tag">${escapeHtml(t)}</span>`).join('')}
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
          ${isChecklist ? renderChecklist(skill.content) : markdownToHtml(skill.content)}
        </div>
      </div>
    `;
  }

  function renderChecklist(content) {
    if (!content) return '';

    const lines = content.split('\n');
    const steps = [];
    let currentStep = null;

    for (const line of lines) {
      const stepMatch = line.match(/^##\s+(.+)$/);
      if (stepMatch) {
        if (currentStep) steps.push(currentStep);
        currentStep = { title: stepMatch[1].trim(), items: [] };
        continue;
      }

      const itemMatch = line.match(/^-\s*\[([ x])\]\s*(.+)$/);
      if (itemMatch && currentStep) {
        currentStep.items.push({
          checked: itemMatch[1] === 'x',
          text: itemMatch[2].trim()
        });
      }
    }
    if (currentStep) steps.push(currentStep);

    if (steps.length === 0) {
      return '<div class="checklist-empty">⚠️ 未识别到检查清单步骤（需要 ## 标题 + - [ ] 项格式）</div>';
    }

    const totalItems = steps.reduce((sum, s) => sum + s.items.length, 0);
    const checkedItems = steps.reduce((sum, s) => sum + s.items.filter(i => i.checked).length, 0);
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    return `
      <div class="checklist-container">
        <div class="checklist-progress">
          <div class="checklist-progress-bar">
            <div class="checklist-progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="checklist-progress-text">${progress}% (${checkedItems}/${totalItems})</div>
        </div>
        ${steps.map((step, stepIndex) => `
          <div class="checklist-step">
            <div class="checklist-step-header">
              <span class="checklist-step-toggle">▶</span>
              <span class="checklist-step-title">${escapeHtml(step.title)}</span>
              <span class="checklist-step-count">${step.items.filter(i => i.checked).length}/${step.items.length}</span>
            </div>
            <div class="checklist-step-content">
              ${step.items.map((item, itemIndex) => `
                <label class="checklist-item">
                  <input type="checkbox" class="checklist-checkbox"
                    data-step="${stepIndex}" data-item="${itemIndex}"
                    ${item.checked ? 'checked' : ''}>
                  <span class="checklist-item-text">${escapeHtml(item.text)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
        ${progress === 100 && totalItems > 0 ? '<div class="checklist-complete">✅ 全部完成</div>' : ''}
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

    // 检查清单交互
    document.querySelectorAll('.checklist-step-header').forEach(header => {
      header.addEventListener('click', () => {
        const step = header.closest('.checklist-step');
        const content = step.querySelector('.checklist-step-content');
        const toggle = header.querySelector('.checklist-step-toggle');
        const isExpanded = content.style.display !== 'none';
        content.style.display = isExpanded ? 'none' : 'block';
        toggle.textContent = isExpanded ? '▶' : '▼';
      });
    });

    document.querySelectorAll('.checklist-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        // v0.2.0：仅更新 UI，不持久化
        updateChecklistProgress();
      });
    });

    // 默认展开第一个或仍有未勾选项的步骤
    document.querySelectorAll('.checklist-step').forEach((step, index) => {
      const content = step.querySelector('.checklist-step-content');
      const toggle = step.querySelector('.checklist-step-toggle');
      const hasUnchecked = step.querySelectorAll('.checklist-checkbox:not(:checked)').length > 0;
      if (index === 0 || hasUnchecked) {
        content.style.display = 'block';
        toggle.textContent = '▼';
      } else {
        content.style.display = 'none';
        toggle.textContent = '▶';
      }
    });
  }

  function updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    const total = checkboxes.length;
    const checked = document.querySelectorAll('.checklist-checkbox:checked').length;
    const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

    const fill = document.querySelector('.checklist-progress-fill');
    const text = document.querySelector('.checklist-progress-text');
    if (fill) fill.style.width = `${progress}%`;
    if (text) text.textContent = `${progress}% (${checked}/${total})`;

    document.querySelectorAll('.checklist-step').forEach(step => {
      const stepCheckboxes = step.querySelectorAll('.checklist-checkbox');
      const stepChecked = step.querySelectorAll('.checklist-checkbox:checked').length;
      const countEl = step.querySelector('.checklist-step-count');
      if (countEl) countEl.textContent = `${stepChecked}/${stepCheckboxes.length}`;
    });

    const container = document.querySelector('.checklist-container');
    let completeEl = container?.querySelector('.checklist-complete');
    if (progress === 100 && total > 0) {
      if (!completeEl) {
        completeEl = document.createElement('div');
        completeEl.className = 'checklist-complete';
        completeEl.textContent = '✅ 全部完成';
        container?.appendChild(completeEl);
      }
    } else if (completeEl) {
      completeEl.remove();
    }
  }

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

  function renderFavoritesPage() {
    const { skills } = state.data;
    const favSkills = state.favorites.map(id => skills.find(s => s.id === id)).filter(Boolean);

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

  function renderSettingsPage() {
    vscode.postMessage({ type: 'get:settings' });
    return `
      <div class="settings-page">
        <div class="section-header">
          <span class="section-title">⚙ 设置</span>
        </div>

        <div class="setting-group">
          <div class="setting-group-title">基础设置</div>
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
        </div>

        <div class="setting-group">
          <div class="setting-group-title">📦 行业知识包</div>
          <div class="setting-desc">加载行业专属的智能体和技能</div>
          <div id="industry-packages-list">
            <div class="industry-package-item">
              <div class="industry-package-info">
                <div class="industry-package-name">☑️ 电力行业 <span class="industry-package-version">v1.0.0</span></div>
                <div class="industry-package-meta">3 个集群 · 12 个技能（示例占位，待 Task 10 接通）</div>
              </div>
              <button class="btn industry-package-btn" disabled>禁用</button>
            </div>
          </div>
          <div style="margin-top: 8px;">
            <button class="btn" id="btn-add-industry">
              <span>+</span> 添加行业知识包
            </button>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-group-title">📥 批量导入</div>
          <div class="setting-desc">从目录或 JSON 导入扩展层 Skill</div>
          <div style="margin-top: 8px;">
            <button class="btn" id="btn-import-skills">
              <span>📂</span> 选择导入目录
            </button>
          </div>
        </div>

        <div style="margin-top: 16px;">
          <button class="btn btn-primary" id="btn-save-settings">保存设置</button>
        </div>
      </div>
    `;
  }

  function attachSettingsEvents() {
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      const path = document.getElementById('setting-path').value;
      const target = document.getElementById('setting-target').value;
      vscode.postMessage({
        type: 'save:settings',
        data: { localPath: path, defaultInstallTarget: target }
      });
      showToast('success', '设置已保存');
    });

    document.getElementById('btn-add-industry')?.addEventListener('click', () => {
      showToast('info', '添加行业知识包功能即将推出（待 Task 10 接通）');
    });

    document.getElementById('btn-import-skills')?.addEventListener('click', () => {
      showToast('info', '批量导入功能即将推出');
    });
  }

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

    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

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
