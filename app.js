(() => {
  'use strict';

  const docEl = document.documentElement;
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const clampIndex = (value) => Math.max(0, Math.min(total - 1, value));

  function indexFromHash() {
    const id = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!id) return 0;
    const index = slides.findIndex((slide) => slide.id === id);
    return index >= 0 ? index : 0;
  }

  function formatNumber(value) {
    return String(value).padStart(2, '0');
  }

  let current = 0;
  let sidebarOpen = false;
  let notesOpen = false;
  let bootTimer = null;
  let intTimer = null;

  const els = {
    progressBar: $('#progressBar'),
    currentNum: $('#currentNum'),
    totalNum: $('#totalNum'),
    currentSection: $('#currentSection'),
    sidebar: $('#sidebar'),
    sidebarNav: $('#sidebarNav'),
    sidebarClose: $('#sidebarClose'),
    sidebarCount: $('#sidebarCount'),
    backdrop: $('#backdrop'),
    menuBtn: $('#menuBtn'),
    overviewBtn: $('#overviewBtn'),
    overviewDialog: $('#overviewDialog'),
    overviewGrid: $('#overviewGrid'),
    notesBtn: $('#notesBtn'),
    notesDrawer: $('#notesDrawer'),
    notesBody: $('#notesBody'),
    notesClose: $('#notesClose'),
    notesSlideTitle: $('#notesSlideTitle'),
    fullscreenBtn: $('#fullscreenBtn'),
    helpDialog: $('#helpDialog'),
    prevBtn: $('#prevBtn'),
    nextBtn: $('#nextBtn'),
    deck: $('#main'),
    bootDetail: $('#bootDetail'),
    bootPlay: $('#bootPlay'),
    intDetail: $('#intDetail'),
    intPlay: $('#intPlay'),
    memDetail: $('#memDetail'),
    segInput: $('#segInput'),
    offInput: $('#offInput'),
    physOut: $('#physOut'),
    calcFormula: $('#calcFormula'),
    regDetail: $('#regDetail'),
    blockDetail: $('#blockDetail')
  };

  els.totalNum.textContent = total;
  if (els.sidebarCount) els.sidebarCount.textContent = `${total} diapositivas`;

  function buildNavigation() {
    let lastSection = null;
    let list = null;

    slides.forEach((slide, index) => {
      const section = slide.dataset.section || 'General';
      if (section !== lastSection) {
        const wrap = document.createElement('div');
        wrap.className = 'nav-section';
        const heading = document.createElement('h2');
        heading.textContent = section;
        list = document.createElement('div');
        wrap.append(heading, list);
        els.sidebarNav.append(wrap);
        lastSection = section;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-link';
      button.dataset.index = String(index);

      const number = document.createElement('span');
      number.className = 'nav-num';
      number.textContent = formatNumber(index + 1);

      const label = document.createElement('span');
      label.textContent = slide.dataset.title || `Diapositiva ${index + 1}`;

      button.append(number, label);
      button.addEventListener('click', () => {
        applySlide(index);
        closeSidebar(false);
        els.deck.focus({ preventScroll: true });
      });
      list.append(button);
    });
  }

  function buildOverview() {
    slides.forEach((slide, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'overview-item';

      const number = document.createElement('span');
      number.className = 'overview-num';
      number.textContent = formatNumber(index + 1);

      const title = document.createElement('strong');
      title.textContent = slide.dataset.title || `Diapositiva ${index + 1}`;

      const section = document.createElement('small');
      section.textContent = slide.dataset.section || '';

      button.append(number, title, section);
      button.addEventListener('click', () => {
        applySlide(index);
        els.overviewDialog.close();
      });
      els.overviewGrid.append(button);
    });
  }

  function updateNavigation(index) {
    $$('.nav-link').forEach((button) => {
      if (Number(button.dataset.index) === index) {
        button.setAttribute('aria-current', 'true');
      } else {
        button.removeAttribute('aria-current');
      }
    });
  }

  function updateNotes() {
    const slide = slides[current];
    const notes = slide.querySelector('.notes');
    els.notesBody.innerHTML = notes ? notes.innerHTML : '<p>Sin notas para esta diapositiva.</p>';
    els.notesSlideTitle.textContent = `${slide.dataset.section || ''} · ${slide.dataset.title || ''}`;
  }

  function stopBootPlay() {
    if (bootTimer) {
      clearInterval(bootTimer);
      bootTimer = null;
    }
    if (els.bootPlay) els.bootPlay.textContent = 'Recorrer automáticamente';
  }

  function stopIntPlay() {
    if (intTimer) {
      clearInterval(intTimer);
      intTimer = null;
    }
    if (els.intPlay) els.intPlay.textContent = 'Recorrer automáticamente';
  }

  function applySlide(index, options = {}) {
    const { push = true, initial = false } = options;
    const nextIndex = clampIndex(index);
    current = nextIndex;
    const slide = slides[current];

    slides.forEach((item, itemIndex) => {
      const active = itemIndex === current;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-hidden', active ? 'false' : 'true');
      if (active) {
        item.removeAttribute('inert');
      } else {
        item.setAttribute('inert', '');
      }
    });

    els.progressBar.style.width = `${((current + 1) / total) * 100}%`;
    els.currentNum.textContent = String(current + 1);
    els.currentSection.textContent = slide.dataset.section || 'Inicio';
    updateNavigation(current);
    updateNotes();

    if (!initial) slide.scrollTop = 0;
    stopBootPlay();
    stopIntPlay();

    if (push) {
      if (location.hash !== `#${slide.id}`) {
        history.pushState({ slide: current }, '', `#${slide.id}`);
      }
    } else if (initial) {
      if (location.hash !== `#${slide.id}`) {
        history.replaceState({ slide: current }, '', `#${slide.id}`);
      }
    }

  }

  function goToId(id) {
    const index = slides.findIndex((slide) => slide.id === id);
    if (index >= 0) applySlide(index);
  }

  function next() {
    if (current < total - 1) applySlide(current + 1);
  }

  function previous() {
    if (current > 0) applySlide(current - 1);
  }

  function openSidebar() {
    if (notesOpen) toggleNotes(false);
    sidebarOpen = true;
    els.sidebar.classList.add('is-open');
    els.sidebar.setAttribute('aria-hidden', 'false');
    els.sidebar.removeAttribute('inert');
    els.menuBtn.setAttribute('aria-expanded', 'true');
    els.backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    els.sidebarClose.focus({ preventScroll: true });
  }

  function closeSidebar(restoreFocus = true) {
    if (!sidebarOpen) return;
    sidebarOpen = false;
    els.sidebar.classList.remove('is-open');
    els.sidebar.setAttribute('aria-hidden', 'true');
    els.sidebar.setAttribute('inert', '');
    els.menuBtn.setAttribute('aria-expanded', 'false');
    els.backdrop.hidden = true;
    document.body.style.overflow = '';
    if (restoreFocus) els.menuBtn.focus({ preventScroll: true });
  }

  function toggleNotes(force) {
    notesOpen = typeof force === 'boolean' ? force : !notesOpen;
    els.notesDrawer.classList.toggle('is-open', notesOpen);
    els.notesDrawer.setAttribute('aria-hidden', String(!notesOpen));
    els.notesBtn.setAttribute('aria-pressed', String(notesOpen));

    if (notesOpen) {
      if (sidebarOpen) closeSidebar(false);
      els.notesDrawer.removeAttribute('inert');
      updateNotes();
      window.requestAnimationFrame(() => {
        if (notesOpen) els.notesClose.focus({ preventScroll: true });
      });
    } else {
      els.notesDrawer.setAttribute('inert', '');
      els.notesBtn.focus({ preventScroll: true });
    }
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await docEl.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      /* el navegador puede rechazar la solicitud */
    }
  }

  function bindMainEvents() {
    els.menuBtn.addEventListener('click', openSidebar);
    els.sidebarClose.addEventListener('click', () => closeSidebar(true));
    els.backdrop.addEventListener('click', () => closeSidebar(true));
    els.overviewBtn.addEventListener('click', () => els.overviewDialog.showModal());
    els.notesBtn.addEventListener('click', () => toggleNotes());
    els.notesClose.addEventListener('click', () => toggleNotes(false));
    els.fullscreenBtn.addEventListener('click', toggleFullscreen);
    els.prevBtn.addEventListener('click', previous);
    els.nextBtn.addEventListener('click', next);

    $$('[data-goto]').forEach((button) => {
      button.addEventListener('click', () => goToId(button.dataset.goto));
    });

    $$('[data-close]').forEach((button) => {
      button.addEventListener('click', () => {
        const dialog = button.closest('dialog');
        if (dialog) dialog.close();
      });
    });

    $$('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
      });
    });

    window.addEventListener('popstate', syncFromHash);
    window.addEventListener('hashchange', syncFromHash);

    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.key === ' ' || event.key === 'Enter') && target && target.closest('button, a')) return;
      if (document.querySelector('dialog[open]')) return;

      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          event.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          previous();
          break;
        case 'Home':
          event.preventDefault();
          applySlide(0);
          break;
        case 'End':
          event.preventDefault();
          applySlide(total - 1);
          break;
        case 'n':
        case 'N':
          event.preventDefault();
          toggleNotes();
          break;
        case 'o':
        case 'O':
          event.preventDefault();
          els.overviewDialog.showModal();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleFullscreen();
          break;
        case '?':
          event.preventDefault();
          els.helpDialog.showModal();
          break;
        case 'Escape':
          closeSidebar(true);
          if (notesOpen) toggleNotes(false);
          break;
        default:
          break;
      }
    });

    let touchStartX = null;
    let touchStartY = null;

    els.deck.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1) return;
      if (event.target.closest('.table-wrap, .code, .byte-scroll, .layout-scroll, .segmented, .int-flow, .flow-horizontal, input, button')) {
        touchStartX = null;
        return;
      }
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    els.deck.addEventListener('touchend', (event) => {
      if (touchStartX === null) return;
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      const deltaY = event.changedTouches[0].clientY - touchStartY;
      touchStartX = null;
      touchStartY = null;
      if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        if (deltaX < 0) next();
        else previous();
      }
    }, { passive: true });

    els.deck.addEventListener('touchcancel', () => {
      touchStartX = null;
      touchStartY = null;
    }, { passive: true });

    const sidebarFocusables = () => $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', els.sidebar)
      .filter((element) => !element.disabled && element.offsetParent !== null);

    els.sidebar.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const focusables = sidebarFocusables();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      els.fullscreenBtn.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
    });
  }

  function syncFromHash() {
    const index = indexFromHash();
    if (index !== current) applySlide(index, { push: false });
  }

  const bootSteps = [
    {
      tag: 'Firmware',
      title: 'BIOS / UEFI',
      text: 'El procesador ejecuta el firmware de la placa. El POST verifica RAM, CPU y dispositivos. La BIOS escribe la IVT en 00000h–003FFh con servicios básicos de pantalla, teclado y disco.'
    },
    {
      tag: 'Sector de arranque',
      title: 'MBR / VBR',
      text: 'La BIOS lee el sector de arranque (MBR o VBR) usando las interrupciones de disco de la IVT. Ese código localiza y carga el gestor de arranque o el kernel del sistema.'
    },
    {
      tag: 'Kernel',
      title: 'KERNEL.SYS',
      text: 'El kernel de FreeDOS se copia a RAM y toma el control. Reemplaza funciones de la BIOS por rutinas propias y actualiza la IVT con los servicios del sistema operativo.'
    },
    {
      tag: 'Configuración',
      title: 'FDCONFIG.SYS',
      text: 'El kernel lee la configuración: parámetros de memoria, drivers de bajo nivel y la directiva SHELL. Cada driver se instala y actualiza las entradas correspondientes de la IVT.'
    },
    {
      tag: 'Shell',
      title: 'COMMAND.COM + FDAUTO.BAT',
      text: 'Se lanza el intérprete de comandos (FreeCOM). FDAUTO.BAT configura PATH, teclado y programas TSR; estos se enganchan en la IVT para activarse ante su interrupción.'
    },
    {
      tag: 'Sistema listo',
      title: 'Prompt C:\\>',
      text: 'El sistema queda a la espera de órdenes. El kernel coordina las llamadas a través de la IVT definitiva y los TSR permanecen residentes e inactivos.'
    }
  ];

  function setBootStep(index) {
    const step = bootSteps[index];
    if (!step) return;
    $$('#bootFlow .flow-step').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.step) === index));
    });
    els.bootDetail.innerHTML = `<span class="detail-tag">${step.tag}</span><h3>${step.title}</h3><p>${step.text}</p>`;
  }

  function initBootWidget() {
    const buttons = $$('#bootFlow .flow-step');
    if (!buttons.length) return;
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        stopBootPlay();
        setBootStep(Number(button.dataset.step));
      });
    });
    els.bootPlay.addEventListener('click', () => {
      if (bootTimer) {
        stopBootPlay();
        return;
      }
      let step = 0;
      setBootStep(step);
      els.bootPlay.textContent = 'Detener';
      bootTimer = window.setInterval(() => {
        step += 1;
        if (step >= bootSteps.length) {
          stopBootPlay();
          setBootStep(bootSteps.length - 1);
          return;
        }
        setBootStep(step);
      }, 1600);
    });
    setBootStep(0);
  }

  const intSteps = [
    {
      tag: 'Paso 1',
      title: 'El programa prepara la llamada',
      text: 'El programa coloca en AH el número de función que necesita. Para crear un archivo usa 3Ch; los parámetros adicionales van en otros registros.'
    },
    {
      tag: 'Paso 2',
      title: 'AH = 3Ch',
      text: 'AH transporta el número de función. En este ejemplo, 3Ch significa “crear archivo”. El resto de los registros aporta parámetros como el nombre o los atributos.'
    },
    {
      tag: 'Paso 3',
      title: 'INT 21h',
      text: 'El programa ejecuta la instrucción INT 21h. Es una interrupción de software: el procesador detiene el código del programa y salta a la rutina indicada por la IVT.'
    },
    {
      tag: 'Paso 4',
      title: 'IVT[21h]',
      text: 'La entrada 21h de la IVT apunta al kernel de FreeDOS. La IVT ocupa los primeros 1 KB de RAM y contiene 256 entradas de 4 bytes (segmento:offset).'
    },
    {
      tag: 'Paso 5',
      title: 'El kernel ejecuta la rutina',
      text: 'El kernel realiza la operación sobre el disco: traduce la solicitud en acceso al hardware, usa sus drivers y deja el resultado en los registros.'
    },
    {
      tag: 'Paso 6',
      title: 'IRET',
      text: 'La instrucción IRET devuelve el control al programa. El programa continúa como si hubiera llamado a una función, pero sin cambio de nivel de privilegio.'
    }
  ];

  function setIntStep(index) {
    const step = intSteps[index];
    if (!step) return;
    $$('#intFlow .int-node').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.int) === index));
    });
    els.intDetail.innerHTML = `<span class="detail-tag">${step.tag}</span><h3>${step.title}</h3><p>${step.text}</p>`;
  }

  function initIntWidget() {
    const buttons = $$('#intFlow .int-node');
    if (!buttons.length) return;
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        stopIntPlay();
        setIntStep(Number(button.dataset.int));
      });
    });
    els.intPlay.addEventListener('click', () => {
      if (intTimer) {
        stopIntPlay();
        return;
      }
      let step = 0;
      setIntStep(step);
      els.intPlay.textContent = 'Detener';
      intTimer = window.setInterval(() => {
        step += 1;
        if (step >= intSteps.length) {
          stopIntPlay();
          setIntStep(intSteps.length - 1);
          return;
        }
        setIntStep(step);
      }, 1500);
    });
    setIntStep(0);
  }

  const memoryRegions = {
    conventional: {
      tag: 'Convencional',
      title: 'Primeros 640 KB',
      text: 'Es la memoria disponible para DOS y las aplicaciones. La zona que un programa DOS puede usar directamente.'
    },
    upper: {
      tag: 'Upper',
      title: 'De 640 KB a 1 MB',
      text: '384 KB reservados para memoria de video, BIOS y ROM de adaptadores. No es RAM libre continua; dentro quedan huecos utilizables.'
    },
    umb: {
      tag: 'UMB',
      title: 'Bloques de memoria superior',
      text: 'Son los huecos que quedan dentro de la zona upper. Se usan para cargar drivers y programas TSR y liberar memoria convencional.'
    },
    xms: {
      tag: 'XMS',
      title: 'Memoria extendida',
      text: 'Espacio por encima del primer megabyte. Se accede mediante un controlador especial como HIMEMX, que actúa como intermediario entre el procesador y esa memoria.'
    },
    ems: {
      tag: 'EMS',
      title: 'Memoria expandida',
      text: 'Actúa sobre la zona upper mediante una ventana paginada. Permite intercambiar páginas de memoria y ampliar la memoria disponible para ciertos programas.'
    }
  };

  function initMemoryWidget() {
    const buttons = $$('[data-region]');
    if (!buttons.length) return;
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const region = memoryRegions[button.dataset.region];
        if (!region) return;
        buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        els.memDetail.innerHTML = `<span class="detail-tag">${region.tag}</span><h3>${region.title}</h3><p>${region.text}</p>`;
      });
    });
  }

  function parseHex(value) {
    const clean = value.trim().replace(/^0x/i, '').replace(/h$/i, '').replace(/[^0-9a-f]/gi, '');
    if (!clean) return NaN;
    return parseInt(clean, 16);
  }

  function updateCalculator() {
    const segment = parseHex(els.segInput.value);
    const offset = parseHex(els.offInput.value);
    if (!Number.isFinite(segment) || !Number.isFinite(offset)) {
      els.physOut.textContent = '—';
      els.calcFormula.textContent = 'Ingresá valores hexadecimales.';
      return;
    }

    const segmentValue = segment & 0xffff;
    const offsetValue = offset & 0xffff;
    const address = (segmentValue * 0x10) + offsetValue;
    const addressHex = address.toString(16).toUpperCase().padStart(5, '0');
    const segmentHex = segmentValue.toString(16).toUpperCase().padStart(4, '0');
    const offsetHex = offsetValue.toString(16).toUpperCase().padStart(4, '0');

    els.physOut.textContent = `${addressHex}h`;
    els.calcFormula.innerHTML = `<code>(${segmentHex}h × 10h) + ${offsetHex}h = ${addressHex}h</code>`;
  }

  function initCalculator() {
    if (!els.segInput || !els.offInput) return;
    els.segInput.addEventListener('input', updateCalculator);
    els.offInput.addEventListener('input', updateCalculator);
    updateCalculator();
  }

  const registerData = {
    AX: {
      tag: 'AX · acumulador',
      title: 'Operaciones e interrupciones',
      text: 'Se usa en operaciones aritméticas y como registro principal de las interrupciones. En INT 21h, AH transporta el número de función. Se divide en AH (alto) y AL (bajo).'
    },
    BX: {
      tag: 'BX · base',
      title: 'Direccionamiento base',
      text: 'Se usa para colocar el puntero en un segmento determinado o marcar el inicio de una estructura. Se divide en BH y BL.'
    },
    CX: {
      tag: 'CX · contador',
      title: 'Repeticiones y bucles',
      text: 'Está pensado para contar repeticiones: bucles, desplazamientos y operaciones repetidas. Se divide en CH y CL.'
    },
    DX: {
      tag: 'DX · datos',
      title: 'Entrada/salida y multiplicación',
      text: 'Se usa en operaciones de entrada/salida y en multiplicación/división. En INT 21h/09h, DX apunta a la cadena que se quiere imprimir. Se divide en DH y DL.'
    },
    SP: {
      tag: 'SP · Stack Pointer',
      title: 'Puntero de pila',
      text: 'Apunta al tope de la pila. La pila funciona como LIFO: el último dato que entra es el primero que sale. No se divide en mitades de 8 bits.'
    },
    BP: {
      tag: 'BP · Base Pointer',
      title: 'Ancla de la pila',
      text: 'Permite apuntar a un lugar de la pila sin tener que extraer el dato con POP. Se usa para marcos de pila y parámetros.'
    },
    SI: {
      tag: 'SI · Source Index',
      title: 'Índice de origen',
      text: 'Apunta a la dirección de memoria física donde están los datos de origen en operaciones con cadenas.'
    },
    DI: {
      tag: 'DI · Destination Index',
      title: 'Índice de destino',
      text: 'Apunta a la dirección de memoria física de destino donde se guarda un resultado, una copia o datos nuevos.'
    }
  };

  function initRegisterWidget() {
    const buttons = $$('.reg[data-reg]');
    if (!buttons.length) return;
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const data = registerData[button.dataset.reg];
        if (!data) return;
        buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        els.regDetail.innerHTML = `<span class="detail-tag">${data.tag}</span><h3>${data.title}</h3><p>${data.text}</p>`;
      });
    });
  }

  const blockData = {
    mcb: {
      tag: 'MCB',
      title: 'Memory Control Block · 16 bytes',
      text: 'Es el “cartel” del kernel: indica dónde empieza el bloque, cuánto mide y dónde termina. También registra el PSP propietario y si es el último bloque (Z) o hay otro después (M).'
    },
    psp: {
      tag: 'PSP',
      title: 'Program Segment Prefix · 256 bytes',
      text: 'Es la cabecera del programa: instrucción de salida INT 20h, tope de memoria, entorno, cola de comandos y bloques de control de archivos. Por eso los .COM comienzan en 100h.'
    },
    program: {
      tag: 'Programa',
      title: 'Código, datos y pila',
      text: 'Es el cuerpo real de la aplicación. Ocupa el espacio que el programa necesite dentro del bloque asignado por el kernel.'
    }
  };

  function initBlockWidget() {
    const buttons = $$('.layout-block[data-block]');
    if (!buttons.length) return;
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const data = blockData[button.dataset.block];
        if (!data) return;
        buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        els.blockDetail.innerHTML = `<span class="detail-tag">${data.tag}</span><h3>${data.title}</h3><p>${data.text}</p>`;
      });
    });
  }

  function initToolTabs() {
    const tabs = $$('.tool-btn');
    const panels = {
      dosbox: $('#panelDosbox'),
      qemu: $('#panelQemu')
    };
    if (!tabs.length) return;

    const order = tabs.map((tab) => tab.dataset.tool);
    const select = (tool, moveFocus = false) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.tool === tool;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && moveFocus) tab.focus();
      });
      Object.entries(panels).forEach(([key, panel]) => {
        if (panel) panel.hidden = key !== tool;
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => select(tab.dataset.tool));
      tab.addEventListener('keydown', (event) => {
        const currentIndex = order.indexOf(tab.dataset.tool);
        if (currentIndex < 0) return;
        let nextIndex = null;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % order.length;
        if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + order.length) % order.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = order.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        select(order[nextIndex], true);
      });
    });

    select(order[0]);
  }

  function initVirtualizationTabs() {
    const tabs = $$('.seg-btn');
    const panels = {
      virtual: $('#panelVirtual'),
      emulator: $('#panelEmulator')
    };
    if (!tabs.length) return;

    const select = (mode) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.mode === mode;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      Object.entries(panels).forEach(([key, panel]) => {
        if (panel) panel.hidden = key !== mode;
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => select(tab.dataset.mode));
    });
  }

  buildNavigation();
  buildOverview();
  applySlide(indexFromHash(), { initial: true, push: false });
  bindMainEvents();
  initBootWidget();
  initIntWidget();
  initMemoryWidget();
  initCalculator();
  initRegisterWidget();
  initBlockWidget();
  initToolTabs();
  initVirtualizationTabs();

})();
