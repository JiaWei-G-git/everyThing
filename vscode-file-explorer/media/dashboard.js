(function () {
  const state = {
    route: '/dashboard',
    data: null,
    recent: [],
    favorites: [],
    stats: {},
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
    const hotSkills = getHotSkills(skills);

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
          </div>
        </div>
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
    const searchBox = document.getElementById('dashboard-search-box');
    if (searchBox) searchBox.addEventListener('click', () => navigateTo('/search'));

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

    document.querySelectorAll('.hot-item').forEach(item => {
      item.addEventListener('click', () => {
        state.currentSkillId = item.dataset.skillId;
        navigateTo('/skill');
        vscode.postMessage({ type: 'open:skill', skillId: item.dataset.skillId });
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
      vscode.postMessage({
        type: 'save:settings',
        data: { localPath: path, defaultInstallTarget: target }
      });
      showToast('success', '设置已保存');
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
