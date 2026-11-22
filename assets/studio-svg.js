/* huajuan-courseware Studio SVG Helper (isometric blocks, flow paths, sequence lifelines, bitfields, mini plots) */
window.StudioSVG = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function isoBox({ x, y, w = 88, d = 54, h = 28, fillTop = '#a9c5e8', fillLeft = '#89aad3', fillRight = '#6e90bb', stroke = '#1c1917', label = '', sub = '', badge = '', meter = null, active = false, id = '' }) {
    const hw = w * 0.5, hh = d * 0.5;
    const pTop = `${x},${y - hh} ${x + hw},${y} ${x},${y + hh} ${x - hw},${y}`;
    const pLeft = `${x - hw},${y} ${x},${y + hh} ${x},${y + hh + h} ${x - hw},${y + h}`;
    const pRight = `${x},${y + hh} ${x + hw},${y} ${x + hw},${y + h} ${x},${y + hh + h}`;
    const strokeW = active ? 2.8 : 1.7;
    const glow = active ? `<polygon points="${pTop}" fill="none" stroke="var(--secondary, #e8692b)" stroke-width="5" opacity="0.35"/>` : '';
    const meterSvg = meter === null ? '' : `
      <rect x="${x - 24}" y="${y - hh - 20}" width="48" height="12" rx="6" fill="var(--surface-2, #fff)" stroke="${stroke}" stroke-width="1.2"/>
      <rect x="${x - 22}" y="${y - hh - 18}" width="${Math.max(4, Math.min(44, Math.round(44 * meter)))}" height="8" rx="4" fill="${meter > 0.8 ? '#dc2626' : '#16a34a'}"/>`;
    const badgeSvg = badge ? `
      <rect x="${x - 36}" y="${y + hh + h + 6}" width="72" height="18" rx="9" fill="var(--surface, #fff)" stroke="${stroke}" stroke-width="1.2"/>
      <text x="${x}" y="${y + hh + h + 18}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${stroke}">${esc(badge)}</text>` : '';
    return `
      <g class="st-iso-node" ${id ? `data-node-id="${esc(id)}" style="cursor:pointer"` : ''}>
        ${glow}
        <polygon points="${pLeft}" fill="${fillLeft}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
        <polygon points="${pRight}" fill="${fillRight}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
        <polygon points="${pTop}" fill="${fillTop}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
        <text x="${x}" y="${y - 2}" text-anchor="middle" font-size="12.5" font-weight="800" fill="${stroke}">${esc(label)}</text>
        ${sub ? `<text x="${x}" y="${y + 13}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${stroke}" opacity="0.8">${esc(sub)}</text>` : ''}
        ${meterSvg}
        ${badgeSvg}
      </g>`;
  }

  function flowPath({ points, color = '#0f766e', dashed = false, packetT = null, packetLabel = '', active = true, width = 2.4 }) {
    if (!points || points.length < 2) return '';
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
    let packetSvg = '';
    if (packetT !== null && packetT >= 0 && packetT <= 1) {
      // Piecewise linear interpolation along segments
      const segs = [];
      let totalLen = 0;
      for (let i = 1; i < points.length; i++) {
        const len = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
        segs.push({ a: points[i - 1], b: points[i], len });
        totalLen += len;
      }
      let target = packetT * totalLen;
      let px = points[0][0], py = points[0][1];
      for (const s of segs) {
        if (target <= s.len || s === segs[segs.length - 1]) {
          const r = s.len > 0 ? target / s.len : 0;
          px = s.a[0] + (s.b[0] - s.a[0]) * r;
          py = s.a[1] + (s.b[1] - s.a[1]) * r;
          break;
        }
        target -= s.len;
      }
      packetSvg = `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="${color}" stroke="#ffffff" stroke-width="2"/>`;
      if (packetLabel) {
        packetSvg += `<g transform="translate(${px.toFixed(1)}, ${(py - 18).toFixed(1)})">
          <rect x="-34" y="-10" width="68" height="16" rx="8" fill="${color}" stroke="#ffffff" stroke-width="1"/>
          <text x="0" y="1" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff" font-family="monospace">${esc(packetLabel)}</text>
        </g>`;
      }
    }
    return `
      <g opacity="${active ? 1 : 0.35}">
        <path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${dashed ? 'stroke-dasharray="6 4"' : ''}/>
        ${packetSvg}
      </g>`;
  }

  function renderSequenceDiagram(container, { actors = [], bands = [], activeStep = -1, activeEventId = null, onSelectEvent = null }) {
    const padX = 76;
    const width = Math.max(640, actors.length * 130 + 60);
    const stepX = actors.length > 1 ? (width - padX * 2) / (actors.length - 1) : 0;
    const actorX = new Map(actors.map((a, i) => [a.id, padX + i * stepX]));

    let curY = 58;
    const bandBlocks = [];
    const arrowRows = [];
    for (let bi = 0; bi < bands.length; bi++) {
      const band = bands[bi];
      const topY = curY;
      curY += 24;
      const isCur = bi === activeStep;
      for (const ev of band.events) {
        const y = curY + 14;
        arrowRows.push({ ev, y, bandIdx: bi });
        curY += 34;
      }
      curY += 8;
      bandBlocks.push({ band, bi, topY, h: curY - topY, isCur });
      curY += 8;
    }
    const totalH = Math.max(300, curY + 24);

    const bandsSvg = bandBlocks.map(b => `
      <rect x="12" y="${b.topY}" width="${width - 24}" height="${b.h}" rx="8"
        fill="${b.isCur ? 'var(--accent-soft)' : 'var(--surface)'}"
        stroke="${b.isCur ? 'var(--accent)' : 'var(--line)'}" stroke-width="${b.isCur ? 1.8 : 1}"/>
      <text x="22" y="${b.topY + 16}" font-size="11" font-weight="800" fill="${b.isCur ? 'var(--accent)' : 'var(--muted)'}">${esc(b.band.title)}</text>`).join('');

    const lifelinesSvg = actors.map(a => {
      const x = actorX.get(a.id);
      return `
        <line x1="${x}" y1="42" x2="${x}" y2="${totalH - 12}" stroke="var(--line-strong)" stroke-width="1.4" stroke-dasharray="4 4"/>
        <rect x="${x - 50}" y="10" width="100" height="28" rx="7" fill="var(--surface-2)" stroke="var(--ink)" stroke-width="1.4"/>
        <text x="${x}" y="28" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--ink-strong)">${esc(a.label)}</text>`;
    }).join('');

    const arrowsSvg = arrowRows.map(({ ev, y }) => {
      const x1 = actorX.get(ev.from) ?? padX;
      const x2 = actorX.get(ev.to) ?? padX;
      const active = ev.id === activeEventId;
      const dir = x2 >= x1 ? 1 : -1;
      const selfLoop = x1 === x2;
      const color = ev.color || 'var(--accent)';
      const lineSvg = selfLoop
        ? `<path d="M${x1},${y - 6} C${x1 + 42},${y - 6} ${x1 + 42},${y + 10} ${x1 + 6},${y + 10}" fill="none" stroke="${color}" stroke-width="${active ? 2.8 : 1.8}"/>`
        : `<line x1="${x1}" y1="${y}" x2="${x2 - dir * 8}" y2="${y}" stroke="${color}" stroke-width="${active ? 2.8 : 1.8}"/>
           <polygon points="${x2},${y} ${x2 - dir * 9},${y - 4.5} ${x2 - dir * 9},${y + 4.5}" fill="${color}"/>`;
      const midX = selfLoop ? x1 + 46 : (x1 + x2) / 2;
      return `
        <g class="st-seq-ev" data-event-id="${esc(ev.id)}" style="cursor:pointer">
          ${active ? `<rect x="18" y="${y - 16}" width="${width - 36}" height="28" rx="6" fill="var(--secondary-soft)" opacity="0.65"/>` : ''}
          ${lineSvg}
          <rect x="${midX - 78}" y="${y - 14}" width="156" height="17" rx="5" fill="var(--surface-2)" stroke="${active ? color : 'var(--line)'}" stroke-width="1"/>
          <text x="${midX}" y="${y - 2}" text-anchor="middle" font-size="10.5" font-weight="700" font-family="monospace" fill="var(--ink-strong)">${esc(ev.label)}</text>
        </g>`;
    }).join('');

    container.innerHTML = `<svg viewBox="0 0 ${width} ${totalH}" style="width:100%;height:auto;min-height:100%;display:block">${bandsSvg}${lifelinesSvg}${arrowsSvg}</svg>`;
    if (onSelectEvent) {
      container.querySelectorAll('[data-event-id]').forEach(el => {
        el.addEventListener('click', () => onSelectEvent(el.dataset.eventId));
      });
    }
  }

  function renderBitfieldBar(container, { fields = [], activeField = null, onSelect = null }) {
    const total = fields.reduce((s, f) => s + (f.bits || 1), 0) || 1;
    const bar = document.createElement('div');
    bar.className = 'st-bitfield-bar';
    for (const f of fields) {
      const seg = document.createElement('button');
      seg.type = 'button';
      seg.className = 'st-bit-seg' + (f.name === activeField ? ' active' : '');
      seg.style.width = `${(f.bits / total * 100).toFixed(2)}%`;
      seg.style.background = f.bg || 'var(--steel)';
      seg.style.color = f.ink || 'var(--steel-ink)';
      seg.textContent = `${f.name} (${f.bits}b)`;
      seg.title = `${f.name}: ${f.value ?? ''} — ${f.desc || ''}`;
      seg.addEventListener('click', () => onSelect?.(f));
      bar.appendChild(seg);
    }
    container.replaceChildren(bar);
  }

  function renderMiniPlot(containerOrOpts, maybeOpts) {
    const hasContainer = containerOrOpts && typeof containerOrOpts === 'object' && ('innerHTML' in containerOrOpts || 'tagName' in containerOrOpts);
    const container = hasContainer ? containerOrOpts : null;
    const opts = (hasContainer ? maybeOpts : containerOrOpts) || {};
    const rawPoints = opts.points || (Array.isArray(opts.values) ? opts.values.map((v, i) => [i, v]) : []);
    const {
      cursorX = null,
      dangerFrom = null,
      xLabel = '',
      yLabel = '',
      title = opts.label || '',
      color = 'var(--accent)'
    } = opts;
    const points = rawPoints.length ? rawPoints : [[0, 0], [1, 0]];
    const W = 280, H = 140, padL = 34, padR = 12, padT = 22, padB = 24;
    const cw = W - padL - padR, ch = H - padT - padB;
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const minX = opts.minX ?? Math.min(...xs, 0), maxX = opts.maxX ?? Math.max(...xs, 1);
    const minY = opts.min ?? Math.min(...ys, 0), maxY = opts.max ?? Math.max(...ys, 1);
    const sx = x => padL + ((x - minX) / (maxX - minX || 1)) * cw;
    const sy = y => padT + ch - ((y - minY) / (maxY - minY || 1)) * ch;
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ');
    const dangerSvg = dangerFrom !== null
      ? `<rect x="${sx(dangerFrom).toFixed(1)}" y="${padT}" width="${(W - padR - sx(dangerFrom)).toFixed(1)}" height="${ch}" fill="var(--bad)" opacity="0.14"/>`
      : '';
    const zeroY = minY < 0 && maxY > 0
      ? `<line x1="${padL}" y1="${sy(0).toFixed(1)}" x2="${W - padR}" y2="${sy(0).toFixed(1)}" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="3 3"/>`
      : '';
    let dotSvg = '';
    if (cursorX !== null && points.length) {
      const nearest = points.reduce((best, p) => Math.abs(p[0] - cursorX) < Math.abs(best[0] - cursorX) ? p : best, points[0]);
      dotSvg = `<circle cx="${sx(nearest[0]).toFixed(1)}" cy="${sy(nearest[1]).toFixed(1)}" r="4.5" fill="var(--secondary)" stroke="#fff" stroke-width="1.5"/>`;
    }
    const svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
      ${dangerSvg}
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + ch}" stroke="var(--line-strong)" stroke-width="1.2"/>
      <line x1="${padL}" y1="${padT + ch}" x2="${W - padR}" y2="${padT + ch}" stroke="var(--line-strong)" stroke-width="1.2"/>
      ${zeroY}
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
      ${dotSvg}
      <text x="${padL}" y="14" font-size="11" font-weight="700" fill="var(--ink-strong)">${esc(title)}</text>
      <text x="${W - padR}" y="${H - 5}" text-anchor="end" font-size="10" fill="var(--muted)">${esc(xLabel)}</text>
      <text x="4" y="${padT + 8}" font-size="10" fill="var(--muted)">${esc(yLabel)}</text>
    </svg>`;
    if (container) container.innerHTML = svg;
    return svg;
  }

  return { isoBox, flowPath, renderSequenceDiagram, renderBitfieldBar, renderMiniPlot };
})();
