(function () {
  // Scroll reveal
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // 3D tilt on service cards
  const onMove = (e) => {
    const card = e.target.closest && e.target.closest('[data-tilt]');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(700px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg) translateY(0) scale(1.02)`;
  };
  const onLeave = (e) => {
    const card = e.target.closest && e.target.closest('[data-tilt]');
    if (!card) return;
    card.style.transform = 'translateY(0)';
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseleave', onLeave, true);

  // FAQ accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const btn = item.querySelector('.faq-q');
    const answer = item.querySelector('.faq-a');
    if (!btn || !answer) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // Fecha os demais (comportamento de acordeão)
      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // Esteiras infinitas (marquee): selos de confiança + resultados
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const builders = [];

  const setupMarquee = (track) => {
    const marquee = track.parentElement;
    const baseHTML = track.innerHTML; // conjunto original de itens
    const speed = parseFloat(track.getAttribute('data-speed')) || 55; // px/s

    const build = () => {
      // Reset pro estado original antes de recalcular
      track.classList.remove('is-animating');
      track.style.animationDuration = '';
      track.innerHTML = baseHTML;
      if (prefersReduced.matches) return;

      const originals = Array.from(track.children);
      const appendCopy = (node) => {
        const clone = node.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      };

      // 1) Repete o conjunto até ultrapassar a largura visível (sem buracos em telas largas)
      let guard = 0;
      while (track.scrollWidth < marquee.offsetWidth && guard < 30) {
        originals.forEach(appendCopy);
        guard++;
      }

      // 2) Largura de um "conjunto" já preenchido = distância exata do loop
      const setWidth = track.scrollWidth;

      // 3) Duplica o conjunto inteiro uma vez -> translateX(-50%) emenda perfeita
      Array.from(track.children).forEach(appendCopy);

      // 4) Duração proporcional à largura => velocidade constante em qualquer tela
      track.style.animationDuration = (setWidth / speed) + 's';
      track.classList.add('is-animating');
    };

    // Pausa ao segurar o dedo (touch) quando a esteira marca data-touch-pause
    if (marquee.hasAttribute('data-touch-pause')) {
      const pause = () => track.classList.add('is-touch-paused');
      const resume = () => track.classList.remove('is-touch-paused');
      marquee.addEventListener('touchstart', pause, { passive: true });
      marquee.addEventListener('touchend', resume);
      marquee.addEventListener('touchcancel', resume);
    }

    builders.push(build);
  };

  document.querySelectorAll('.marquee-track').forEach(setupMarquee);

  if (builders.length) {
    const buildAll = () => builders.forEach((fn) => fn());

    // Aguarda as fontes pra medir a largura real dos textos (evita "pulos")
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(buildAll);
    } else {
      buildAll();
    }

    // Reconstrói (com debounce) ao redimensionar pra manter o preenchimento
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildAll, 200);
    });
    if (prefersReduced.addEventListener) {
      prefersReduced.addEventListener('change', buildAll);
    }
  }
})();
