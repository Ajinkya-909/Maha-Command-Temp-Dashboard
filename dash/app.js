/* ==========================================================================
   Konkan Crisis & Social Media Dashboard - Application Logic
   Engineered for Mobile Precision & Desktop Visual Excellence
   ========================================================================== */

let dist = 'All';
let filterType = 'all';
let searchQuery = '';
let evId = 'all';
let viewMode = window.innerWidth <= 768 ? 'cards' : 'table';
let charts = {};
let filtersOpen = false;
let insightExpanded = true;

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const MET = EVENTS.map(metrics);

// Filter events by district, type, and search query
function inView() {
  return EVENTS.filter(e => {
    const matchDist = dist === 'All' || e.district === dist;
    const matchType = filterType === 'all' || e.type === filterType;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || 
      e.title.toLowerCase().includes(q) || 
      e.district.toLowerCase().includes(q) || 
      e.cat.toLowerCase().includes(q) || 
      e.date.toLowerCase().includes(q);
    return matchDist && matchType && matchSearch;
  });
}

const best = (m, f, low) => m.reduce((a, b) => (low ? f(b) < f(a) : f(b) > f(a)) ? b : a);

// Aggregates platform metrics over a list of events
function agg(list) {
  if (!list.length) list = EVENTS;
  return PLATFORMS.map((pl, i) => {
    const ms = list.map(e => MET[e.id][i]);
    const m = k => Math.round(avg(ms.map(x => x[k])));
    return {
      name: pl.n,
      color: pl.c,
      speed: m('speed'),
      reach: m('reach'),
      trust: m('trust'),
      mis: avg(ms.map(x => x.mis)),
      phase: [0, 1, 2].map(k => Math.round(avg(ms.map(x => x.phase[k])))),
      sent: [0, 1, 2].map(k => Math.round(avg(ms.map(x => x.sent[k]))))
    };
  });
}

function chip(m, i) {
  return `<span class="chip" style="background:${PLATFORMS[i].c}">${PLATFORMS[i].n}</span>`;
}

// Setup DOM elements and listeners
function setup() {
  // Setup district tabs with counts
  const t = $('#tabs');
  t.innerHTML = '';
  ['All', ...DISTRICTS].forEach(d => {
    const count = d === 'All' ? EVENTS.length : EVENTS.filter(e => e.district === d).length;
    const b = document.createElement('button');
    b.className = 'tab';
    b.innerHTML = `<span>${d === 'All' ? 'All' : d}</span><span class="tab-count">${count}</span>`;
    b.setAttribute('role', 'tab');
    b.dataset.d = d;
    b.onclick = () => {
      dist = d;
      evId = 'all';
      render();
    };
    t.appendChild(b);
  });

  // Mobile filters toggle button
  const toggleFiltersBtn = $('#toggleFiltersBtn');
  const filtersExpandable = $('#filtersExpandable');
  if (toggleFiltersBtn && filtersExpandable) {
    toggleFiltersBtn.onclick = () => {
      filtersOpen = !filtersOpen;
      filtersExpandable.classList.toggle('open', filtersOpen);
      toggleFiltersBtn.classList.toggle('active', filtersOpen);
      toggleFiltersBtn.setAttribute('aria-expanded', filtersOpen);
    };
  }

  // Type pills
  $$('.pill-btn').forEach(btn => {
    btn.onclick = () => {
      $$('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterType = btn.dataset.type;
      evId = 'all';
      render();
    };
  });

  // Search input
  const sInput = $('#searchInput');
  const clearSBtn = $('#clearSearchBtn');
  sInput.oninput = e => {
    searchQuery = e.target.value;
    clearSBtn.hidden = !searchQuery;
    evId = 'all';
    render();
  };
  clearSBtn.onclick = () => {
    searchQuery = '';
    sInput.value = '';
    clearSBtn.hidden = true;
    render();
  };

  // Event dropdown selector
  $('#eventSel').onchange = e => {
    evId = e.target.value;
    render();
  };

  // Reset Event button
  $('#resetEventBtn').onclick = () => {
    evId = 'all';
    render();
  };
  $('#inspectClearBtn').onclick = () => {
    evId = 'all';
    render();
  };

  // Reset All Filters buttons
  const resetAll = () => {
    dist = 'All';
    filterType = 'all';
    searchQuery = '';
    evId = 'all';
    sInput.value = '';
    clearSBtn.hidden = true;
    $$('.pill-btn').forEach(b => b.classList.toggle('active', b.dataset.type === 'all'));
    render();
  };
  $('#resetAllFiltersBtn').onclick = resetAll;
  $('#clearAllFiltersFromEmpty').onclick = resetAll;

  // View toggle buttons (Cards vs Table)
  $('#btnCardsView').onclick = () => {
    viewMode = 'cards';
    updateViewModeDisplay();
  };
  $('#btnTableView').onclick = () => {
    viewMode = 'table';
    updateViewModeDisplay();
  };

  // Methodology banner toggle
  const infoBtn = $('#toggleInfoBtn');
  const infoBanner = $('#methodologyBanner');
  const closeInfoBtn = $('#closeInfoBtn');
  if (infoBtn && infoBanner) {
    infoBtn.onclick = () => {
      const isHidden = infoBanner.hidden;
      infoBanner.hidden = !isHidden;
      infoBtn.setAttribute('aria-expanded', isHidden);
    };
    closeInfoBtn.onclick = () => {
      infoBanner.hidden = true;
      infoBtn.setAttribute('aria-expanded', 'false');
    };
  }

  // Insight card collapse/expand toggle
  const insightHeader = $('#insightHeader');
  const insightContent = $('#insightContent');
  const insightToggleText = $('#insightToggleText');
  const insightToggleIcon = $('#insightToggleIcon');
  if (insightHeader && insightContent) {
    insightHeader.onclick = () => {
      insightExpanded = !insightExpanded;
      insightContent.classList.toggle('collapsed', !insightExpanded);
      if (insightToggleText) insightToggleText.textContent = insightExpanded ? 'Hide' : 'Show';
      if (insightToggleIcon) insightToggleIcon.style.transform = insightExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    };
  }

  // Floating button scroll to top
  const floatBtn = $('#floatingTopBtn');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      floatBtn.classList.add('visible');
    } else {
      floatBtn.classList.remove('visible');
    }
  });
  floatBtn.onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Window resize handler with debounce
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const list = inView();
      renderCharts(agg(evId === 'all' ? list : [EVENTS[evId]]));
    }, 200);
  });

  // Chart defaults with crisp high-contrast fonts
  Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  Chart.defaults.color = '#334155';

  updateViewModeDisplay();
  render();
}

function updateViewModeDisplay() {
  $('#btnCardsView').classList.toggle('active', viewMode === 'cards');
  $('#btnTableView').classList.toggle('active', viewMode === 'table');
  $('#eventCards').style.display = viewMode === 'cards' ? 'grid' : 'none';
  $('#eventTableWrap').style.display = viewMode === 'table' ? 'block' : 'none';
}

function render() {
  // Update active district tab
  $$('.tab').forEach(b => {
    const isSelected = b.dataset.d === dist;
    b.setAttribute('aria-selected', isSelected);
    if (isSelected && b.scrollIntoView) {
      b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });

  const list = inView();
  const sel = $('#eventSel');
  
  // Populate event dropdown
  sel.innerHTML = `<option value="all">All Events (${list.length})</option>` +
    list.map(e => `<option value="${e.id}">${e.date} • ${e.district}: ${e.title.slice(0, 55)}...</option>`).join('');

  if (evId !== 'all' && !list.find(e => e.id == evId)) {
    evId = 'all';
  }
  sel.value = evId;

  // Toggle Clear Event button
  const hasSpecificEvent = evId !== 'all';
  $('#resetEventBtn').hidden = !hasSpecificEvent;

  // Update inspection banner
  const inspectBanner = $('#inspectBanner');
  if (hasSpecificEvent) {
    inspectBanner.hidden = false;
    $('#inspectTitle').textContent = `${EVENTS[evId].district} (${EVENTS[evId].date}): ${EVENTS[evId].title}`;
  } else {
    inspectBanner.hidden = true;
  }

  // Active filter status summary
  const hasFiltersApplied = dist !== 'All' || filterType !== 'all' || searchQuery.trim() !== '' || hasSpecificEvent;
  $('#resetAllFiltersBtn').hidden = !hasFiltersApplied;
  
  let statusText = `Showing <b>${list.length}</b> events`;
  if (dist !== 'All') statusText += ` in <b>${dist}</b>`;
  if (filterType !== 'all') statusText += ` • <i>${TYPES[filterType]}</i>`;
  if (searchQuery.trim()) statusText += ` • search: "${searchQuery.trim()}"`;
  if (hasSpecificEvent) statusText += ` • <b>Focused</b>`;
  $('#filterStatusText').innerHTML = statusText;

  // Check empty state
  const noEvents = list.length === 0;
  $('#noEventsMessage').hidden = !noEvents;
  $('#eventCards').hidden = noEvents;
  $('#eventTableWrap').hidden = noEvents;

  // Aggregation data for KPIs, Insight and Charts
  const focus = hasSpecificEvent ? [EVENTS[evId]] : (noEvents ? EVENTS : list);
  const m = agg(focus);
  const label = hasSpecificEvent 
    ? EVENTS[evId].title 
    : (dist === 'All' ? `all ${list.length} regional events` : `${list.length} events in ${dist}`);

  // 1. Render KPI Cards
  const fast = best(m, x => x.speed, true);
  const trust = best(m, x => x.trust);
  const reach = best(m, x => x.reach);
  const mis = best(m, x => x.mis);
  const totalMis = m.reduce((a, b) => a + b.mis, 0) || 1;

  const kp = [
    { title: 'Fastest Source', val: fast.name, desc: `${fast.speed}m lead time`, color: fast.color, icon: '⚡' },
    { title: 'Highest Trust', val: trust.name, desc: `${trust.trust}% confirmed`, color: trust.color, icon: '🛡️' },
    { title: 'Widest Reach', val: reach.name, desc: `Score ${reach.reach} / 100`, color: reach.color, icon: '📢' },
    { title: 'Unverified Risk', val: mis.name, desc: `${Math.round(mis.mis / totalMis * 100)}% exposure`, color: mis.color, icon: '⚠️' }
  ];

  $('#kpis').innerHTML = kp.map(k => `
    <div class="kpi" style="--c:${k.color}">
      <div class="kpi-header">
        <span class="l">${k.title}</span>
        <span class="kpi-icon">${k.icon}</span>
      </div>
      <div class="v">${k.val}</div>
      <div class="d">
        <span class="d-badge" style="color:${k.color}">●</span>
        <span>${k.desc}</span>
      </div>
    </div>
  `).join('');

  // 2. Render Insight Alert
  const x = m[0]; // Twitter/X
  const neg = best(m, s => s.sent[0]);
  $('#insightTitle').textContent = hasSpecificEvent ? `${EVENTS[evId].district}: ${EVENTS[evId].title.slice(0, 45)}...` : label;
  $('#insightContent').innerHTML = `
    <ul>
      <li><b>${fast.name}</b> broke news earliest (~${fast.speed}m latency), but only <b>${fast.trust}%</b> of early claims were confirmed accurate.</li>
      <li><b>${trust.name}</b> led factual reliability (<b>${trust.trust}%</b> verified), but reached a smaller audience (reach index: <b>${trust.reach}</b>).</li>
      <li>Viral volume concentrated on <b>${x.name}</b> (reach <b>${x.reach}</b>), which also carried <b>${Math.round(x.mis / totalMis * 100)}%</b> of unverified rumors.</li>
      <li>Most critical public reaction registered on <b>${neg.name}</b> with <b>${neg.sent[0]}%</b> negative responses.</li>
    </ul>
  `;

  // 3. Render Charts
  renderCharts(m);

  // 4. Render Event Cards (Smartphone-friendly)
  $('#eventCards').innerHTML = list.map(e => {
    const mm = MET[e.id];
    const f = best(mm, a => a.speed, true);
    const t = best(mm, a => a.trust);
    const r = best(mm, a => a.reach);
    const isSelected = evId == e.id;

    return `
      <div class="event-card-item ${isSelected ? 'selected' : ''}" data-id="${e.id}" role="button" tabindex="0">
        <div class="event-card-top">
          <span class="event-date-chip">${e.date}</span>
          <div class="event-badges-wrap">
            <span class="badge-district">${e.district}</span>
            <span class="badge-type">${TYPES[e.type]}</span>
          </div>
        </div>
        <h3 class="event-card-title">${e.title}</h3>
        <div class="event-card-metrics">
          <div class="metric-pill">
            <span class="metric-pill-label">⚡ Fastest</span>
            <span class="metric-pill-val" style="background:${f.color}">${f.name}</span>
          </div>
          <div class="metric-pill">
            <span class="metric-pill-label">🛡️ Trusted</span>
            <span class="metric-pill-val" style="background:${t.color}">${t.name}</span>
          </div>
          <div class="metric-pill">
            <span class="metric-pill-label">📢 Reach</span>
            <span class="metric-pill-val" style="background:${r.color}">${r.name}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 5. Render Desktop Table
  const tb = $('#tbl tbody');
  tb.innerHTML = list.map(e => {
    const mm = MET[e.id];
    const f = best(mm, a => a.speed, true);
    const t = best(mm, a => a.trust);
    const r = best(mm, a => a.reach);
    const idx = a => mm.indexOf(a);
    const isSelected = evId == e.id;

    return `
      <tr tabindex="0" data-id="${e.id}" class="${isSelected ? 'on' : ''}">
        <td><strong>${e.date}</strong></td>
        <td><span class="badge-district">${e.district}</span></td>
        <td>${e.title}</td>
        <td><span class="badge-type">${TYPES[e.type]}</span></td>
        <td>${chip(f, idx(f))}</td>
        <td>${chip(t, idx(t))}</td>
        <td>${chip(r, idx(r))}</td>
      </tr>
    `;
  }).join('');

  // Click handler for card or row selection
  const selectEvent = id => {
    evId = evId == id ? 'all' : id;
    render();
    if (window.innerWidth <= 768) {
      $('#mainContent').scrollIntoView({ behavior: 'smooth' });
    }
  };

  $$('.event-card-item').forEach(card => {
    card.onclick = () => selectEvent(card.dataset.id);
    card.onkeydown = e => { if (e.key === 'Enter') selectEvent(card.dataset.id); };
  });

  tb.querySelectorAll('tr').forEach(r => {
    r.onclick = () => selectEvent(r.dataset.id);
    r.onkeydown = e => { if (e.key === 'Enter') selectEvent(r.dataset.id); };
  });
}

function renderCharts(m) {
  const isMobile = window.innerWidth <= 768;
  const tickFontSize = isMobile ? 11 : 12;

  // 1. First Post Speed Bar Chart (Horizontal)
  mk('cSpeed', 'bar', {
    labels: m.map(a => a.name),
    datasets: [{
      data: m.map(a => a.speed),
      backgroundColor: m.map(a => a.color),
      borderRadius: 5,
      barThickness: isMobile ? 16 : 22
    }]
  }, {
    indexAxis: 'y',
    layout: { padding: { left: 4, right: 14, top: 4, bottom: 4 } },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.raw} min to first post` } }
    },
    scales: {
      x: {
        title: { display: true, text: 'Minutes (Lower = Faster)', font: { size: 11, weight: '600' } },
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: tickFontSize } }
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: tickFontSize, weight: '700' }, color: '#0f172a' }
      }
    }
  });

  // 2. Reach and Trust: HORIZONTAL on Mobile, Grouped Vertical on Desktop
  // Solves the problem where 10 vertical bars caused platform labels to collide on phones!
  const rtIndexAxis = isMobile ? 'y' : 'x';
  mk('cRT', 'bar', {
    labels: m.map(a => a.name),
    datasets: [
      {
        label: 'Reach (0-100)',
        data: m.map(a => a.reach),
        backgroundColor: '#7fb8c2',
        borderRadius: 4,
        barThickness: isMobile ? 10 : 16
      },
      {
        label: 'Trust (% Confirmed)',
        data: m.map(a => a.trust),
        backgroundColor: '#0b6e7f',
        borderRadius: 4,
        barThickness: isMobile ? 10 : 16
      }
    ]
  }, {
    indexAxis: rtIndexAxis,
    layout: { padding: { left: 4, right: 14, top: 4, bottom: 4 } },
    scales: isMobile ? {
      x: { max: 100, beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: tickFontSize } } },
      y: { grid: { display: false }, ticks: { font: { size: tickFontSize, weight: '700' }, color: '#0f172a' } }
    } : {
      y: { max: 100, beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: tickFontSize } } },
      x: { grid: { display: false }, ticks: { font: { size: tickFontSize, weight: '600' } } }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, padding: 10, font: { size: tickFontSize } }
      }
    }
  });

  // 3. Activity Phase Line Chart
  mk('cPhase', 'line', {
    labels: ['Before / Warning', 'Incident Peak', 'Aftermath'],
    datasets: m.map(a => ({
      label: a.name,
      data: a.phase,
      borderColor: a.color,
      backgroundColor: a.color,
      tension: 0.35,
      borderWidth: isMobile ? 2.5 : 3,
      pointRadius: isMobile ? 4 : 5
    }))
  }, {
    layout: { padding: { left: 4, right: 14, top: 4, bottom: 4 } },
    scales: {
      y: {
        max: 100,
        beginAtZero: true,
        title: { display: true, text: 'Relative Volume', font: { size: 11, weight: '600' } },
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: tickFontSize } }
      },
      x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: tickFontSize, weight: '600' } } }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, padding: 8, font: { size: isMobile ? 10 : 12 } }
      }
    }
  });

  // 4. Public Tone Horizontal Stacked Bar Chart
  mk('cSent', 'bar', {
    labels: m.map(a => a.name),
    datasets: [
      { label: 'Critical / Alarmed', data: m.map(a => a.sent[0]), backgroundColor: '#dc2626', borderRadius: { topLeft: 4, bottomLeft: 4 } },
      { label: 'Neutral', data: m.map(a => a.sent[1]), backgroundColor: '#94a3b8' },
      { label: 'Positive', data: m.map(a => a.sent[2]), backgroundColor: '#16a34a', borderRadius: { topRight: 4, bottomRight: 4 } }
    ]
  }, {
    indexAxis: 'y',
    layout: { padding: { left: 4, right: 14, top: 4, bottom: 4 } },
    scales: {
      x: { stacked: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { font: { size: tickFontSize } } },
      y: { stacked: true, grid: { display: false }, ticks: { font: { size: tickFontSize, weight: '700' }, color: '#0f172a' } }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, padding: 8, font: { size: tickFontSize } }
      },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}%` } }
    }
  });

  // 5. Misinformation Exposure Doughnut Chart
  mk('cMis', 'doughnut', {
    labels: m.map(a => a.name),
    datasets: [{
      data: m.map(a => Math.round(a.mis * 10) / 10),
      backgroundColor: m.map(a => a.color),
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  }, {
    cutout: isMobile ? '50%' : '56%',
    layout: { padding: 8 },
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'right',
        labels: { boxWidth: 11, padding: isMobile ? 6 : 10, font: { size: isMobile ? 11 : 12 } }
      },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} exposure index` } }
    }
  });
}

function mk(id, type, data, opt) {
  if (charts[id]) charts[id].destroy();
  const el = $('#' + id);
  if (!el) return;
  charts[id] = new Chart(el, {
    type,
    data,
    options: Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 }
    }, opt)
  });
}

// Initialize on DOM Ready
setup();
