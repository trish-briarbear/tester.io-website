(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────────────────────────────── */
  const TOTAL_FRAMES = 121;
  const FRAME_PATH   = (n) => `product/frames/frame_${String(n).padStart(4,'0')}.jpg`;

  /* ── CANVAS SCRUB SETUP ─────────────────────────────────────────────────── */
  const canvas  = document.getElementById('scrub-canvas');
  const ctx     = canvas.getContext('2d');
  const frames  = new Array(TOTAL_FRAMES);
  let   loaded  = 0;
  let   curIdx  = 0;

  function drawFrame(idx) {
    idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(idx)));
    if (!frames[idx] || !frames[idx].complete) return;
    const cw = canvas.width, ch = canvas.height;
    const iw = frames[idx].naturalWidth  || cw;
    const ih = frames[idx].naturalHeight || ch;
    const scale = Math.max(cw / iw, ch / ih) * 0.92;
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(frames[idx], dx, dy, dw, dh);
    curIdx = idx;
  }

  /* ── FRAME PRELOAD ──────────────────────────────────────────────────────── */
  const loader  = document.getElementById('loader');
  const ldFill  = document.getElementById('ld-fill');
  const ldPct   = document.getElementById('ld-pct');

  function preloadFrames(onDone) {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i + 1);
      img.onload = img.onerror = () => {
        loaded++;
        const pct = Math.floor((loaded / TOTAL_FRAMES) * 100);
        ldFill.style.width = pct + '%';
        ldPct.textContent  = pct + '%';
        if (loaded === TOTAL_FRAMES) {
          drawFrame(0);
          startHeroBoomerang();
          onDone();
        }
      };
      frames[i] = img;
    }
  }

  /* ── HERO BOOMERANG ─────────────────────────────────────────────────────── */
  function startHeroBoomerang() {
    const heroCanvas = document.getElementById('hero-canvas');
    if (!heroCanvas) return;
    const hCtx = heroCanvas.getContext('2d');

    function resizeHero() {
      heroCanvas.width  = heroCanvas.offsetWidth  || window.innerWidth;
      heroCanvas.height = heroCanvas.offsetHeight || window.innerHeight;
    }
    resizeHero();
    window.addEventListener('resize', resizeHero);

    function drawHeroFrame(idx) {
      const img = frames[idx];
      if (!img || !img.complete) return;
      const cw = heroCanvas.width, ch = heroCanvas.height;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale, dh = ih * scale;
      hCtx.clearRect(0, 0, cw, ch);
      hCtx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    const FPS      = 24;
    const INTERVAL = 1000 / FPS;
    let heroIdx    = 0;
    let heroDir    = 1;
    let lastTs     = 0;

    function loop(ts) {
      requestAnimationFrame(loop);
      if (ts - lastTs < INTERVAL) return;
      lastTs = ts;
      drawHeroFrame(heroIdx);
      heroIdx += heroDir;
      if (heroIdx >= TOTAL_FRAMES - 1) { heroIdx = TOTAL_FRAMES - 1; heroDir = -1; }
      if (heroIdx <= 0)                { heroIdx = 0;                 heroDir =  1; }
    }

    requestAnimationFrame(loop);
  }

  /* ── MAIN ────────────────────────────────────────────────────────────────── */
  preloadFrames(function () {
    ldFill.style.width = '100%';
    ldPct.textContent  = '100%';
    setTimeout(() => {
      loader.classList.add('out');
      initApp();
    }, 480);
  });

  function initApp() {

    /* Lenis smooth scroll */
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    /* ── Hero entrance ──────────────────────────────────────────────────── */
    gsap.timeline({ delay: 0.25 })
      .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      .to('.hwi', { y: '0%', duration: 1.05, ease: 'power4.out', stagger: 0.13 }, '-=0.4')
      .to('.hero-tag',   { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5')
      .to('.scroll-ind', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3');


    /* ── Canvas resize handler ──────────────────────────────────────────── */
    function resizeCanvas() {
      canvas.width  = canvas.offsetWidth  || 1280;
      canvas.height = canvas.offsetHeight || 720;
      drawFrame(curIdx);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    /* ── Canvas fade-in from black as features section enters view ──────── */
    gsap.set(canvas, { opacity: 0 });
    gsap.to(canvas, {
      opacity: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#features-bg',
        start: 'top 85%',
        end: 'top top',
        scrub: 1,
      }
    });

    /* ── Scroll-driven frame scrub ──────────────────────────────────────── */
    const scrollCont = document.getElementById('scroll-container');

    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate(self) {
        const p = self.progress;
        let frameIdx;
        if (p <= 0.5) {
          /* forward: 0→(TOTAL-1) as progress goes 0→0.5 */
          frameIdx = (p / 0.5) * (TOTAL_FRAMES - 1);
        } else {
          /* reverse: (TOTAL-1)→0 as progress goes 0.5→1.0 */
          frameIdx = ((1 - p) / 0.5) * (TOTAL_FRAMES - 1);
        }
        drawFrame(frameIdx);
      }
    });

    /* ── Dark overlay for stats section ───────────────────────────────── */
    const darkOv = document.getElementById('dark-overlay');

    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top', end: 'bottom bottom',
      scrub: true,
      onUpdate(self) {
        const p = self.progress;
        const sE = 0.54, sL = 0.68, fr = 0.03;
        let ov = 0;
        if      (p >= sE - fr && p < sE)       ov = (p - (sE - fr)) / fr;
        else if (p >= sE && p < sL)             ov = 0.9;
        else if (p >= sL && p <= sL + fr)       ov = 0.9 * (1 - (p - sL) / fr);
        darkOv.style.opacity = ov;
      }
    });

    /* ── Scroll sections ───────────────────────────────────────────────── */
    document.querySelectorAll('.ss').forEach((sec) => {
      const eP     = parseFloat(sec.dataset.enter) / 100;
      const lP     = parseFloat(sec.dataset.leave) / 100;
      const persist = sec.dataset.persist === 'true';
      const anim   = sec.dataset.anim;

      // Position each section so it appears at ~85% down the viewport when it
      // enters — consistent across screen sizes (fixes mobile where early sections
      // used to appear near the top of the screen, making them easy to miss).
      const H_cont   = scrollCont.offsetHeight;
      const H_view   = window.innerHeight;
      const targetVP = 0.85 * H_view;
      sec.style.top  = (targetVP + eP * (H_cont - H_view)) + 'px';

      const kids = sec.querySelectorAll(
        '.sec-label,.sec-head,.sec-body,.sec-note,.stat,.cta-head,.cta-sub,.cta-btn,.cta-ghost'
      );

      const tl = gsap.timeline({ paused: true });
      switch (anim) {
        case 'slide-left':
          tl.from(kids, { x: -90, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out' }); break;
        case 'slide-right':
          tl.from(kids, { x:  90, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out' }); break;
        case 'scale-up':
          tl.from(kids, { scale: 0.82, opacity: 0, stagger: 0.12, duration: 1.0, ease: 'power2.out' }); break;
        case 'rotate-in':
          tl.from(kids, { y: 44, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out' }); break;
        case 'stagger-up':
          tl.from(kids, { y: 64, opacity: 0, stagger: 0.15, duration: 0.85, ease: 'power3.out' }); break;
        case 'clip-reveal':
          tl.from(kids, { clipPath: 'inset(100% 0 0 0)', opacity: 0, stagger: 0.15, duration: 1.2, ease: 'power4.inOut' }); break;
        default:
          tl.from(kids, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out' });
      }

      // Shared exit: all sections slide out to the right, matching "Your Body. Decoded."
      const tlOut = gsap.timeline({ paused: true });
      tlOut.to(kids, { x: 90, opacity: 0, stagger: 0.08, duration: 0.65, ease: 'power3.in' });

      // Scroll-up thresholds: section appears near top (~20 % down) and
      // disappears when it drifts past the middle (~55 % down).
      const scrollDist = H_cont - H_view;
      const eP_up = Math.min(eP + (0.65 * H_view / scrollDist), 0.995);
      const lP_up = eP + (0.30 * H_view / scrollDist);

      let wasIn    = false;
      let prevP    = 0;
      let trackedDir = 1; // 1 = down, -1 = up

      ScrollTrigger.create({
        trigger: scrollCont,
        start: 'top top', end: 'bottom bottom',
        scrub: false,
        onUpdate(self) {
          const p     = self.progress;
          const delta = p - prevP;

          // Only update tracked direction when there is meaningful movement
          // (dead-zone of 0.002 filters Lenis micro-oscillations at rest).
          if (Math.abs(delta) > 0.002) {
            trackedDir = delta > 0 ? 1 : -1;
            prevP = p;
          }

          const in_ = trackedDir > 0
            ? (p >= eP  && p <= lP)
            : (p >= lP_up && p <= eP_up);

          if (in_ && !wasIn) {
            wasIn = true;
            tlOut.pause();
            // Only reset x — tlOut always ends at x:90 but scale-up /
            // stagger-up entry animations never touch x, so without this
            // reset kids would appear offset right on re-entry.
            // Opacity is intentionally NOT reset here: calling gsap.set
            // inside a rAF tick renders immediately this frame, then
            // tl's from-state sets opacity back to 0 next frame — that
            // one-frame difference is exactly what was causing the blink.
            gsap.set(kids, { x: 0 });
            gsap.set(sec, { opacity: 1 });
            sec.classList.add('active');
            tl.timeScale(1).restart();
          } else if (!in_ && wasIn && !persist) {
            wasIn = false;
            sec.classList.remove('active');
            tl.pause();
            // No snap here — tlOut starts from kids' current state so the
            // exit is smooth regardless of where the entry was interrupted.
            // Snapping opacity to 1 first was the source of the blink.
            tlOut.restart().then(() => {
              // Guard against a re-entry that happened before tlOut finished.
              if (!wasIn) gsap.set(sec, { opacity: 0 });
            });
          } else if (persist && p > lP) {
            gsap.set(sec, { opacity: 1 });
          }
        }
      });
    });

    /* ── Counters ──────────────────────────────────────────────────────── */
    document.querySelectorAll('.stat-num').forEach((el) => {
      const target = parseFloat(el.dataset.val);
      const dec    = parseInt(el.dataset.dec || '0');
      ScrollTrigger.create({
        trigger: el.closest('.ss'),
        start: 'top 85%',
        once: true,
        onEnter() {
          gsap.fromTo(el,
            { textContent: 0 },
            {
              textContent: target, duration: 2, ease: 'power1.out',
              snap: { textContent: dec === 0 ? 1 : 0.1 },
              onUpdate() { el.textContent = parseFloat(el.textContent).toFixed(dec); },
            }
          );
        }
      });
    });

  }

})();
