/* huajuan-courseware Studio Orchestrator v2
 * Unifies Archetype A (Flow Stepper), B (3D Workbench + Code), C (Procedural), D (Protocol/Trace Inspector)
 */
window.StudioApp = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function mount(config, hooks) {
    const rootEl = document.body;
    const theme = config.theme || 'warm-drafting';
    let scheme = config.colorScheme || (theme === 'blueprint' ? 'dark' : 'light');
    rootEl.dataset.theme = theme;
    rootEl.dataset.colorScheme = scheme;

    const modules = config.modules || [];
    let activeModId = modules[0]?.id || 'default';
    let completed = new Set();
    let playing = false;
    let playTimer = null;
    let speed = 1;
    let activeTab = 0;

    // Build deterministic studio skeleton
    rootEl.innerHTML = `
      <div class="st-app">
        <header class="st-topbar">
          <div class="st-brand">
            <button type="button" class="st-btn st-mobile-nav-btn" id="st-nav-toggle" aria-label="课程目录">☰</button>
            <div class="st-brand-badge">${esc(config.badge || '课')}</div>
            <div class="st-brand-title">
              <b>${esc(config.title)}</b>
              <small>${esc(config.subtitle || '探索 · 观察 · 动手验证')}</small>
            </div>
          </div>
          <div class="st-top-actions">
            <div class="st-progress-pill" aria-label="学习进度">
              <span id="st-prog-label">0 / ${modules.length}</span>
              <div class="st-progress-track"><div class="st-progress-fill" id="st-prog-fill" style="width:0%"></div></div>
            </div>
            <button type="button" class="st-btn" id="st-scheme-btn" title="切换浅色/深色主题">${scheme === 'dark' ? '☀ 浅色' : '☾ 深色'}</button>
            <button type="button" class="st-btn" id="st-reset-all" title="重置本节实验">↺ 重置</button>
          </div>
        </header>

        <div class="st-body ${modules.length <= 1 ? 'no-left' : ''}" id="st-body">
          ${modules.length > 1 ? `
          <aside class="st-sidebar" id="st-sidebar" aria-label="课程模块目录">
            <div class="st-sidebar-head">
              <span>课程章节</span>
              <span id="st-sidebar-count">${modules.length} 节</span>
            </div>
            <div class="st-sidebar-list" id="st-sidebar-list"></div>
            <div class="st-sidebar-foot" id="st-sidebar-foot">${esc(config.limit || '离线交互教学模型')}</div>
          </aside>` : ''}

          <main class="st-center">
            <div class="st-lesson-banner">
              <div>
                <h1 id="st-mod-title">${esc(config.title)}</h1>
                <p id="st-mod-question">${esc(config.question || '')}</p>
              </div>
              <div class="st-pills-row" id="st-banner-pills"></div>
            </div>

            <div class="st-stage-wrap ${config.stageBg || 'bg-iso-grid'}">
              <div class="st-stage-hud">
                <div class="st-kpi-chips" id="st-kpis"></div>
                <div class="st-pills-row">
                  <div class="st-stage-views" id="st-stage-views"></div>
                  <div class="st-pills-row" id="st-transport"></div>
                </div>
              </div>
              <div class="st-viewport-shell">
                <div class="st-viewport" id="st-viewport"></div>
                <div class="st-pip-card" id="st-pip" hidden>
                  <div class="st-pip-head">
                    <span id="st-pip-title">原理图 / 数据流</span>
                    <button type="button" class="st-cam-btn" id="st-pip-close" aria-label="关闭浮窗">✕</button>
                  </div>
                  <div class="st-pip-body" id="st-pip-body"></div>
                </div>
              </div>
            </div>

            <div class="st-bottom-dock" id="st-bottom-dock"></div>
          </main>

          <aside class="st-inspector" aria-label="交互检查器与说明">
            <div class="st-tabs" id="st-tabs"></div>
            <div class="st-inspector-scroll" id="st-inspector-body"></div>
            <div class="st-code-card" id="st-code-card" hidden>
              <div class="st-code-head">
                <span id="st-code-title">指令与参数试试看</span>
                <div class="st-pills-row">
                  <button type="button" class="st-btn primary" id="st-code-run">▶ 运行</button>
                  <button type="button" class="st-btn" id="st-code-step">单步</button>
                </div>
              </div>
              <div class="st-code-lines" id="st-code-lines"></div>
              <div class="st-monitor" id="st-monitor" hidden></div>
            </div>
          </aside>
        </div>
      </div>`;

    const byId = id => document.getElementById(id);

    // Theme switch
    byId('st-scheme-btn').addEventListener('click', () => {
      scheme = scheme === 'dark' ? 'light' : 'dark';
      rootEl.dataset.colorScheme = scheme;
      byId('st-scheme-btn').textContent = scheme === 'dark' ? '☀ 浅色' : '☾ 深色';
      hooks.onSchemeChange?.(scheme);
    });

    // Mobile drawer
    const navBtn = byId('st-nav-toggle');
    const sidebar = byId('st-sidebar');
    if (navBtn && sidebar) {
      navBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    byId('st-pip-close').addEventListener('click', () => {
      byId('st-pip').hidden = true;
    });

    byId('st-reset-all').addEventListener('click', () => {
      stopPlay();
      hooks.onReset?.(activeModId);
    });

    function updateProgress() {
      const done = completed.size;
      const total = Math.max(1, modules.length);
      byId('st-prog-label').textContent = `${done} / ${total}`;
      byId('st-prog-fill').style.width = `${Math.round(done / total * 100)}%`;
      renderSidebar();
    }

    function markComplete(modId) {
      if (!completed.has(modId)) {
        completed.add(modId);
        updateProgress();
      }
    }

    function renderSidebar() {
      const list = byId('st-sidebar-list');
      if (!list) return;
      list.replaceChildren();
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'st-nav-item' + (m.id === activeModId ? ' active' : '');
        const isDone = completed.has(m.id);
        btn.innerHTML = `
          <div class="st-nav-item-top">
            <span>${i + 1}. ${esc(m.title)}</span>
            <span class="st-check-dot ${isDone ? 'done' : ''}">${isDone ? '✓' : ''}</span>
          </div>
          <small>${esc(m.shortDesc || m.question || '')}</small>`;
        btn.addEventListener('click', () => {
          selectModule(m.id);
          sidebar?.classList.remove('open');
        });
        list.appendChild(btn);
      }
    }

    function selectModule(modId) {
      stopPlay();
      activeModId = modId;
      activeTab = 0;
      const mod = modules.find(m => m.id === modId) || modules[0];
      if (mod) {
        byId('st-mod-title').textContent = mod.title;
        byId('st-mod-question').textContent = mod.question || '';
      }
      renderSidebar();
      hooks.onSelectModule?.(modId, api);
    }

    function setKPIs(items = []) {
      const wrap = byId('st-kpis');
      wrap.replaceChildren();
      for (const it of items) {
        const div = document.createElement('div');
        div.className = 'st-kpi';
        if (it.level) div.dataset.level = it.level;
        div.innerHTML = `<small>${esc(it.label)}</small><b>${esc(it.value)}</b>`;
        wrap.appendChild(div);
      }
    }

    function setBannerPills(pills = []) {
      const wrap = byId('st-banner-pills');
      wrap.replaceChildren();
      for (const p of pills) {
        const sp = document.createElement('span');
        sp.className = `st-pill ${p.tone || ''}`;
        sp.textContent = p.text;
        wrap.appendChild(sp);
      }
    }

    function setStageViews(views = [], activeViewId, onSwitch) {
      const wrap = byId('st-stage-views');
      wrap.replaceChildren();
      if (!views.length) { wrap.style.display = 'none'; return; }
      wrap.style.display = 'inline-flex';
      for (const v of views) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'st-view-btn' + (v.id === activeViewId ? ' active' : '');
        b.textContent = v.label;
        b.addEventListener('click', () => onSwitch?.(v.id));
        wrap.appendChild(b);
      }
    }

    function setTransport({ show = true, canBack = false, canNext = true, onBack, onNext, onStepPlay, onTogglePlay }) {
      const wrap = byId('st-transport');
      wrap.replaceChildren();
      if (!show) return;
      const mk = (txt, fn, primary = false, disabled = false) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'st-btn' + (primary ? ' primary' : '');
        b.textContent = txt;
        b.disabled = disabled;
        b.addEventListener('click', fn);
        return b;
      };
      if (onBack) wrap.appendChild(mk('← 上一步', onBack, false, !canBack));
      if (onTogglePlay) wrap.appendChild(mk(playing ? '⏸ 暂停' : '▶ 演示', () => {
        if (playing) stopPlay();
        else startPlay(onStepPlay || onNext);
        onTogglePlay(playing);
      }, false, false));
      if (onNext) wrap.appendChild(mk('下一步 →', onNext, true, !canNext));
    }

    function startPlay(stepFn) {
      stopPlay();
      if (!stepFn) return;
      playing = true;
      playTimer = setInterval(() => {
        const keepGoing = stepFn();
        if (keepGoing === false) stopPlay();
      }, Math.round(1350 / speed));
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        clearInterval(playTimer);
        playTimer = null;
      }
    }

    function setPiP({ visible = false, title = '原理图', html = '', onMount = null }) {
      const pip = byId('st-pip');
      pip.hidden = !visible;
      if (!visible) return;
      byId('st-pip-title').textContent = title;
      const body = byId('st-pip-body');
      body.innerHTML = html;
      onMount?.(body);
    }

    function setTabs(tabList = [], currentIdx = activeTab, onChange) {
      activeTab = Math.max(0, Math.min(tabList.length - 1, currentIdx));
      const bar = byId('st-tabs');
      bar.replaceChildren();
      tabList.forEach((t, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'st-tab' + (idx === activeTab ? ' active' : '');
        btn.textContent = t.label;
        btn.addEventListener('click', () => {
          activeTab = idx;
          setTabs(tabList, idx, onChange);
          onChange?.(idx, t);
        });
        bar.appendChild(btn);
      });
      const body = byId('st-inspector-body');
      const cur = tabList[activeTab];
      if (!cur) { body.innerHTML = ''; return; }
      if (typeof cur.render === 'function') {
        body.innerHTML = '';
        cur.render(body);
      } else {
        body.innerHTML = cur.html || '';
      }
    }

    function setCodePanel({ visible = false, title = '动手试试', lines = [], activeLine = -1, monitor = '', onParamClick, onRun, onStep }) {
      const card = byId('st-code-card');
      card.hidden = !visible;
      if (!visible) return;
      byId('st-code-title').textContent = title;
      const runBtn = byId('st-code-run');
      const stepBtn = byId('st-code-step');
      runBtn.onclick = () => onRun?.();
      stepBtn.onclick = () => onStep?.();

      const linesWrap = byId('st-code-lines');
      linesWrap.replaceChildren();
      lines.forEach((line, idx) => {
        const row = document.createElement('div');
        row.className = 'st-code-line' + (idx === activeLine ? ' active' : '');
        const ln = document.createElement('span');
        ln.className = 'st-code-ln';
        ln.textContent = String(idx + 1);
        row.appendChild(ln);

        const content = document.createElement('span');
        // Tokenize clickable `[paramKey:label]` or `[token]` syntax cleanly without eval
        const text = typeof line === 'string' ? line : (line.text || '');
        const parts = text.split(/(\{\{[^}]+\}\})/g);
        for (const pt of parts) {
          if (pt.startsWith('{{') && pt.endsWith('}}')) {
            const inner = pt.slice(2, -2);
            const [key, disp] = inner.split(':');
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'st-code-chip';
            chip.textContent = disp || key;
            chip.title = '点击切换参数';
            chip.addEventListener('click', () => onParamClick?.(key));
            content.appendChild(chip);
          } else {
            content.appendChild(document.createTextNode(pt));
          }
        }
        row.appendChild(content);
        linesWrap.appendChild(row);
      });

      const monEl = byId('st-monitor');
      if (monitor) {
        monEl.hidden = false;
        monEl.textContent = monitor;
      } else {
        monEl.hidden = true;
      }
    }

    function setBottomDock({ mode = 'stepper', steps = [], currentStep = 0, onStepClick, traces = [], activeTraceId, onTraceClick, extraEl }) {
      const dock = byId('st-bottom-dock');
      dock.replaceChildren();

      if (extraEl) dock.appendChild(extraEl);

      if (mode === 'stepper' || mode === 'both') {
        const bar = document.createElement('div');
        bar.className = 'st-stepper';
        steps.forEach((s, idx) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'st-step-node' + (idx < currentStep ? ' done' : '') + (idx === currentStep ? ' active' : '');
          b.innerHTML = `<span class="num">${idx < currentStep ? '✓' : idx + 1}</span><span>${esc(s.label || s.title)}</span>`;
          b.addEventListener('click', () => onStepClick?.(idx));
          bar.appendChild(b);
        });
        dock.appendChild(bar);
      }

      if ((mode === 'trace' || mode === 'both') && traces.length) {
        const wrap = document.createElement('div');
        wrap.className = 'st-trace-wrap';
        const rowsHtml = traces.map(r => `
          <tr data-trace-id="${esc(r.id)}" class="${r.id === activeTraceId ? 'active' : ''}">
            <td>${esc(r.no)}</td>
            <td>${esc(r.cycle)}</td>
            <td>${esc(r.src)}</td>
            <td>${esc(r.dst)}</td>
            <td>${esc(r.stage)}</td>
            <td>${esc(r.info)}</td>
            <td>${esc(r.val || '')}</td>
          </tr>`).join('');
        wrap.innerHTML = `
          <table class="st-trace-table">
            <thead><tr><th>#</th><th>周期</th><th>源</th><th>目的</th><th>阶段</th><th>动作详情</th><th>值</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>`;
        wrap.querySelectorAll('tr[data-trace-id]').forEach(tr => {
          tr.addEventListener('click', () => onTraceClick?.(tr.dataset.traceId));
        });
        dock.appendChild(wrap);
        const activeTr = wrap.querySelector('tr.active');
        if (activeTr) wrap.scrollTop = Math.max(0, activeTr.offsetTop - 42);
      }

      if (mode === 'modules') {
        const strip = document.createElement('div');
        strip.className = 'st-lesson-strip';
        modules.forEach((m, idx) => {
          const c = document.createElement('button');
          c.type = 'button';
          c.className = 'st-lesson-card' + (m.id === activeModId ? ' active' : '');
          const isDone = completed.has(m.id);
          c.innerHTML = `
            <div class="st-lesson-thumb">${esc(m.icon || (idx + 1))}</div>
            <div style="min-width:0;flex:1">
              <div style="font-weight:700;font-size:13px;display:flex;justify-content:space-between;gap:6px">
                <span>${idx + 1}. ${esc(m.title)}</span>
                ${isDone ? '<span style="color:var(--good)">✓</span>' : ''}
              </div>
              <small style="color:var(--muted);font-size:11.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.shortDesc || '')}</small>
            </div>`;
          c.addEventListener('click', () => selectModule(m.id));
          strip.appendChild(c);
        });
        dock.appendChild(strip);
      }
    }

    // Keyboard shortcuts (ignored while editing inside inputs)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') hooks.onKey?.('next');
      else if (e.key === 'ArrowLeft') hooks.onKey?.('prev');
      else if (e.key === ' ') { e.preventDefault(); hooks.onKey?.('space'); }
      else if (e.key === 'r' || e.key === 'R') hooks.onReset?.(activeModId);
      else if (e.key === 'q' || e.key === 'Q') hooks.onKey?.('rotL');
      else if (e.key === 'e' || e.key === 'E') hooks.onKey?.('rotR');
    });

    const api = {
      viewport: () => byId('st-viewport'),
      scheme: () => scheme,
      activeModuleId: () => activeModId,
      selectModule,
      markComplete,
      setKPIs,
      setBannerPills,
      setStageViews,
      setTransport,
      setPiP,
      setTabs,
      setCodePanel,
      setBottomDock,
      stopPlay,
      esc
    };

    renderSidebar();
    updateProgress();
    Promise.resolve().then(() => selectModule(activeModId));
    return api;
  }

  return { mount, esc };
})();
