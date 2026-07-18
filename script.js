const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The hero name is actually editable — press backspace to delete it,
  // type to write something random in its place. Refresh the page to reset it.
  (function editableHeroName(){
    const nameEl = document.getElementById('heroNameText');
    const FULL_NAME = 'Victor Skinderviken';
    const MAX_LEN = 40;
    let current = FULL_NAME;

    nameEl.textContent = current;

    document.addEventListener('keydown', (e) => {
      const active = document.activeElement;
      const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isTyping || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/') return; // reserved for quick search

      if (e.key === 'Backspace'){
        e.preventDefault();
        current = current.slice(0, -1);
        nameEl.textContent = current;
      } else if (e.key.length === 1 && current.length < MAX_LEN){
        e.preventDefault();
        current += e.key;
        nameEl.textContent = current;
      }
    });
  })();

  // Ambient network graph animation in the hero background
  (function initHeroCanvas(){
    const canvas = document.getElementById('heroCanvas');
    const ctx = canvas.getContext('2d');
    const hero = canvas.closest('header.hero');
    let width, height, dpr, nodes = [], packets = [];
    const NODE_COUNT = 42;
    const MAX_DIST = 130;
    const PALETTE = {
      dark: { teal: '79,209,197', amber: '245,166,35', lineAlpha: 0.3, nodeAlpha: 0.55 },
      light: { teal: '14,143,131', amber: '180,89,12', lineAlpha: 0.28, nodeAlpha: 0.6 },
    };
    function colors(){
      return document.documentElement.dataset.theme === 'light' ? PALETTE.light : PALETTE.dark;
    }

    function resize(){
      const rect = hero.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width; height = rect.height;
      canvas.width = width * dpr; canvas.height = height * dpr;
      canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeNodes(){
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
      }));
    }

    resize();
    makeNodes();
    window.addEventListener('resize', () => { resize(); makeNodes(); });

    function draw(){
      ctx.clearRect(0, 0, width, height);
      const { teal: TEAL, amber: AMBER, lineAlpha, nodeAlpha } = colors();
      const edges = [];

      if (!reduceMotion){
        nodes.forEach(n => {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
        });
      }

      for (let i = 0; i < nodes.length; i++){
        for (let j = i + 1; j < nodes.length; j++){
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST){
            const alpha = (1 - dist / MAX_DIST) * lineAlpha;
            ctx.strokeStyle = `rgba(${TEAL},${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
            edges.push({ a: nodes[i], b: nodes[j] });
          }
        }
      }

      if (!reduceMotion && edges.length && Math.random() < 0.012){
        const e = edges[Math.floor(Math.random() * edges.length)];
        packets.push({ a: e.a, b: e.b, t: 0, color: Math.random() < 0.7 ? TEAL : AMBER });
      }

      packets.forEach(p => {
        p.t += 0.018;
        const x = p.a.x + (p.b.x - p.a.x) * p.t;
        const y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.fillStyle = `rgba(${p.color},0.9)`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      packets = packets.filter(p => p.t < 1);

      nodes.forEach(n => {
        ctx.fillStyle = `rgba(${TEAL},${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (reduceMotion){
      draw();
      window.__redrawHeroCanvas = draw;
    } else {
      (function loop(){ draw(); requestAnimationFrame(loop); })();
    }
  })();


  // Uptime counter — years since starting in IT (Jul 2025 at Reitan)
  const STARTED = new Date("2025-07-01");
  const now = new Date();
  let years = now.getFullYear() - STARTED.getFullYear();
  const hasHadAnniversary = (now.getMonth() > STARTED.getMonth()) ||
    (now.getMonth() === STARTED.getMonth() && now.getDate() >= STARTED.getDate());
  if (!hasHadAnniversary) years -= 1;
  document.getElementById('uptimeYears').textContent = Math.max(years, 0) + "+";

  // Live nav clock
  // Light / dark theme toggle
  // Mobile nav dropdown
  const navHamburger = document.getElementById('navHamburger');
  const navLinksEl = document.getElementById('navLinks');
  navHamburger.addEventListener('click', () => {
    const isOpen = navLinksEl.classList.toggle('open');
    navHamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  navLinksEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinksEl.classList.remove('open');
      navHamburger.setAttribute('aria-expanded', 'false');
    });
  });

  const themeToggle = document.getElementById('themeToggle');
  const rootEl = document.documentElement;

  function applyTheme(theme){
    rootEl.dataset.theme = theme;
    themeToggle.textContent = theme === 'light' ? '\u263D dark' : '\u2600 light';
    try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
    if (window.__redrawHeroCanvas) window.__redrawHeroCanvas();
  }

  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('theme') || 'dark'; } catch (e) { /* ignore */ }
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    applyTheme(rootEl.dataset.theme === 'light' ? 'dark' : 'light');
  });

  const navClockText = document.getElementById('navClockText');
  function tickClock(){
    const d = new Date();
    navClockText.textContent = d.toLocaleTimeString([], { hour12: false });
  }
  tickClock();
  setInterval(tickClock, 1000);

  // Neofetch carousel
  const neofetchLabels = ["Ubuntu homelab", "Gentoo", "Arch Linux", "NixOS"];
  const track = document.getElementById('neofetchTrack');
  const dotsWrap = document.getElementById('carouselDots');
  const label = document.getElementById('carouselLabel');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const carousel = document.getElementById('neofetchCarousel');
  const neofetchViewport = document.querySelector('.neofetch-viewport');
  let slideIndex = 0;

  neofetchLabels.forEach((name, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to ' + name);
    dot.addEventListener('click', () => { goToSlide(i); if (typeof restartAutoplay === 'function') restartAutoplay(); });
    dotsWrap.appendChild(dot);
  });

  function updateCarouselHeight(){
    const activeSlide = track.children[slideIndex];
    if (activeSlide) neofetchViewport.style.height = activeSlide.scrollHeight + 'px';
  }

  function goToSlide(i){
    slideIndex = (i + neofetchLabels.length) % neofetchLabels.length;
    track.style.transform = 'translateX(-' + (slideIndex * 100) + '%)';
    label.textContent = neofetchLabels[slideIndex];
    [...dotsWrap.children].forEach((d, idx) => d.classList.toggle('active', idx === slideIndex));
    updateCarouselHeight();
  }

  updateCarouselHeight();
  window.addEventListener('resize', updateCarouselHeight);
  window.addEventListener('load', updateCarouselHeight);

  prevBtn.addEventListener('click', () => { goToSlide(slideIndex - 1); restartAutoplay(); });
  nextBtn.addEventListener('click', () => { goToSlide(slideIndex + 1); restartAutoplay(); });

  // Auto-scroll through the systems, pausing on hover/focus/touch
  let autoplayTimer = null;
  const AUTOPLAY_DELAY = 4500;

  function startAutoplay(){
    if (reduceMotion) return;
    stopAutoplay();
    autoplayTimer = setInterval(() => goToSlide(slideIndex + 1), AUTOPLAY_DELAY);
  }
  function stopAutoplay(){
    if (autoplayTimer){ clearInterval(autoplayTimer); autoplayTimer = null; }
  }
  function restartAutoplay(){ startAutoplay(); }

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);
  carousel.addEventListener('touchstart', stopAutoplay, { passive: true });

  startAutoplay();

  // Keyboard navigation for carousel
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft'){ e.preventDefault(); goToSlide(slideIndex - 1); restartAutoplay(); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); goToSlide(slideIndex + 1); restartAutoplay(); }
  });

  // Touch swipe for carousel
  let touchStartX = null;
  const viewport = carousel.querySelector('.neofetch-viewport');
  viewport.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40){ dx > 0 ? goToSlide(slideIndex - 1) : goToSlide(slideIndex + 1); restartAutoplay(); }
    touchStartX = null;
  });

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  // Copy email to clipboard
  const emailLink = document.getElementById('emailLink');
  const copiedToast = document.getElementById('copiedToast');
  emailLink.addEventListener('click', (e) => {
    if (navigator.clipboard) {
      e.preventDefault();
      navigator.clipboard.writeText('vicdal66@gmail.com').then(() => {
        copiedToast.classList.add('show');
        setTimeout(() => copiedToast.classList.remove('show'), 1500);
      }).catch(() => { window.location.href = 'mailto:vicdal66@gmail.com'; });
    }
  });

  // Interactive shell
  const shellOutput = document.getElementById('shellOutput');
  const shellInput = document.getElementById('shellInput');
  const shellHistory = [];
  let historyPos = -1;

  function printLine(text, cls){
    const p = document.createElement('p');
    p.className = 'shell-line ' + cls;
    p.textContent = text;
    shellOutput.appendChild(p);
    shellOutput.scrollTop = shellOutput.scrollHeight;
  }

  const sectionMap = {
    about: '#about', bio: '#about', whoami: '#about',
    experience: '#experience', work: '#experience', jobs: '#experience', job: '#experience',
    linux: '#linux', homelab: '#linux',
    projects: '#projects', project: '#projects',
    education: '#education', school: '#education',
    contact: '#contact',
  };

  function jumpTo(name){
    const key = (name || '').toLowerCase().replace(/\.(txt|md)$/, '').replace(/^\.?\//, '');
    const sel = sectionMap[key];
    if (!sel) return false;
    document.querySelector(sel).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    return true;
  }

  function runCommand(raw){
    const cmd = raw.trim();
    printLine(cmd, 'cmd');
    if (cmd === '') return;

    const [name, ...args] = cmd.split(/\s+/);
    const arg = args.join(' ');

    switch(name.toLowerCase()){
      case 'help':
        printLine('available commands:', 'out');
        printLine('  help        show this list', 'out');
        printLine('  whoami      who is browsing right now', 'out');
        printLine('  neofetch    quick system summary', 'out');
        printLine('  ls          list sections on this page', 'out');
        printLine('  cd <section>    jump to a section (about, experience, linux, projects, education, contact)', 'out');
        printLine('  cat about.txt   read a short bio (and jump there)', 'out');
        printLine('  contact     how to reach Victor', 'out');
        printLine('  date        current date and time', 'out');
        printLine('  clear       clear this terminal', 'out');
        break;
      case 'whoami':
        printLine('guest — poking around Victor\'s portfolio. hi 👋', 'out');
        break;
      case 'neofetch':
        printLine('victor@skinderviken.it', 'out');
        printLine('-----------------------', 'out');
        printLine('OS: skinderviken.it (vanilla k8s on Proxmox)', 'out');
        printLine('Role: Operation Technician @ Orange', 'out');
        printLine('Homelab: 2x Raspberry Pi 5 (vicx.no) + 3x Arch VMs (skinderviken.it)', 'out');
        printLine('Interests: Linux, homelabs, distro hopping', 'out');
        break;
      case 'ls':
        if (arg){
          if (jumpTo(arg)){ printLine('→ jumping to ' + arg, 'out'); }
          else { printLine('ls: cannot access \'' + arg + '\': No such file or directory', 'err'); }
        } else {
          printLine('about  experience  linux  projects  education  contact', 'out');
        }
        break;
      case 'cd':
        if (!arg){
          printLine('usage: cd <section>  (about, experience, linux, projects, education, contact)', 'out');
        } else if (jumpTo(arg)){
          printLine('→ jumping to ' + arg, 'out');
        } else {
          printLine('cd: ' + arg + ': No such directory', 'err');
        }
        break;
      case 'open':
        if (!arg){ printLine('usage: open <section>', 'out'); }
        else if (jumpTo(arg)){ printLine('→ jumping to ' + arg, 'out'); }
        else { printLine('open: ' + arg + ': No such section', 'err'); }
        break;
      case 'cat':
        if (!arg){
          printLine('usage: cat <file>', 'out');
        } else {
          const clean = arg.replace(/\.(txt|md)$/, '');
          if (clean === 'about'){
            printLine('24yo IT professional. E-business & IT background.', 'out');
            printLine('IT Technician @ Reitan -> Operation Technician @ Orange.', 'out');
            printLine('Runs a homelab, distro-hops for fun.', 'out');
            jumpTo('about');
          } else if (jumpTo(clean)){
            printLine('→ jumping to ' + clean, 'out');
          } else {
            printLine('cat: ' + arg + ': No such file or directory', 'err');
          }
        }
        break;
      case 'contact':
        printLine('email: vicdal66@gmail.com', 'out');
        printLine('github: github.com/VictorSkinderviken', 'out');
        printLine('linkedin: linkedin.com/in/victorskinderviken', 'out');
        break;
      case 'date':
        printLine(new Date().toString(), 'out');
        break;
      case 'pwd':
        printLine('/home/visitor', 'out');
        break;
      case 'clear':
        shellOutput.innerHTML = '';
        break;
      case 'sudo':
        printLine('Nice try. This incident has been reported to /dev/null.', 'err');
        break;
      case 'exit':
        printLine('nice try, this tab stays open', 'err');
        break;
      default:
        printLine(name + ': command not found — try \'help\'', 'err');
    }
  }

  shellInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter'){
      const val = shellInput.value;
      if (val.trim() !== ''){
        shellHistory.push(val);
        historyPos = shellHistory.length;
      }
      runCommand(val);
      shellInput.value = '';
    } else if (e.key === 'ArrowUp'){
      if (shellHistory.length === 0) return;
      e.preventDefault();
      historyPos = Math.max(0, historyPos - 1);
      shellInput.value = shellHistory[historyPos] || '';
    } else if (e.key === 'ArrowDown'){
      if (shellHistory.length === 0) return;
      e.preventDefault();
      historyPos = Math.min(shellHistory.length, historyPos + 1);
      shellInput.value = shellHistory[historyPos] || '';
    }
  });

  document.querySelector('.shell-term').addEventListener('click', () => shellInput.focus());

  // Command palette (Ctrl+K / Cmd+K / "/")
  const cmdkOverlay = document.getElementById('cmdkOverlay');
  const cmdkInput = document.getElementById('cmdkInput');
  const cmdkListEl = document.getElementById('cmdkList');
  const openSearchBtn = document.getElementById('openSearch');

  const cmdkCommands = [
    { label: 'About', hint: 'section', action: () => jumpTo('about') },
    { label: 'Experience', hint: 'section', action: () => jumpTo('experience') },
    { label: 'Linux & homelab', hint: 'section', action: () => jumpTo('linux') },
    { label: 'Projects', hint: 'section', action: () => jumpTo('projects') },
    { label: 'Education', hint: 'section', action: () => jumpTo('education') },
    { label: 'Contact', hint: 'section', action: () => jumpTo('contact') },
    { label: 'Poke around (terminal)', hint: 'section', action: () => document.querySelector('#shell').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }) },
    { label: 'Open GitHub', hint: '↗ github.com', action: () => window.open('https://github.com/VictorSkinderviken', '_blank') },
    { label: 'Open LinkedIn', hint: '↗ linkedin.com', action: () => window.open('https://www.linkedin.com/in/victorskinderviken', '_blank') },
    { label: 'Visit vicx.no', hint: '↗ live project', action: () => window.open('https://vicx.no', '_blank') },
    { label: 'Copy email', hint: 'vicdal66@gmail.com', action: () => { if (navigator.clipboard) navigator.clipboard.writeText('vicdal66@gmail.com'); } },
  ];

  let cmdkFiltered = cmdkCommands;
  let cmdkSelected = 0;

  function renderCmdkList(){
    cmdkListEl.innerHTML = '';
    if (!cmdkFiltered.length){
      const li = document.createElement('li');
      li.className = 'cmdk-empty';
      li.textContent = 'No matches — try another term';
      cmdkListEl.appendChild(li);
      return;
    }
    cmdkFiltered.forEach((c, i) => {
      const li = document.createElement('li');
      li.className = 'cmdk-item' + (i === cmdkSelected ? ' active' : '');
      const labelSpan = document.createElement('span');
      labelSpan.className = 'cmdk-label';
      labelSpan.textContent = c.label;
      const hintSpan = document.createElement('span');
      hintSpan.className = 'cmdk-hint';
      hintSpan.textContent = c.hint;
      li.appendChild(labelSpan);
      li.appendChild(hintSpan);
      li.addEventListener('mouseenter', () => { cmdkSelected = i; renderCmdkList(); });
      li.addEventListener('click', () => runCmdkSelection(c));
      cmdkListEl.appendChild(li);
    });
  }

  function runCmdkSelection(c){
    closeCmdk();
    c.action();
  }

  function openCmdk(){
    cmdkOverlay.hidden = false;
    requestAnimationFrame(() => cmdkOverlay.classList.add('open'));
    cmdkInput.value = '';
    cmdkFiltered = cmdkCommands;
    cmdkSelected = 0;
    renderCmdkList();
    cmdkInput.focus();
  }

  function closeCmdk(){
    cmdkOverlay.classList.remove('open');
    setTimeout(() => { cmdkOverlay.hidden = true; }, reduceMotion ? 0 : 150);
    openSearchBtn.focus();
  }

  cmdkInput.addEventListener('input', () => {
    const q = cmdkInput.value.toLowerCase().trim();
    cmdkFiltered = q ? cmdkCommands.filter(c => c.label.toLowerCase().includes(q)) : cmdkCommands;
    cmdkSelected = 0;
    renderCmdkList();
  });

  cmdkInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown'){
      e.preventDefault();
      cmdkSelected = Math.min(cmdkFiltered.length - 1, cmdkSelected + 1);
      renderCmdkList();
    } else if (e.key === 'ArrowUp'){
      e.preventDefault();
      cmdkSelected = Math.max(0, cmdkSelected - 1);
      renderCmdkList();
    } else if (e.key === 'Enter'){
      e.preventDefault();
      if (cmdkFiltered[cmdkSelected]) runCmdkSelection(cmdkFiltered[cmdkSelected]);
    } else if (e.key === 'Escape'){
      closeCmdk();
    }
  });

  openSearchBtn.addEventListener('click', openCmdk);
  cmdkOverlay.addEventListener('click', (e) => { if (e.target === cmdkOverlay) closeCmdk(); });

  document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)){
      e.preventDefault();
      openCmdk();
    } else if (e.key === '/' && !isTyping){
      e.preventDefault();
      openCmdk();
    }
  });
