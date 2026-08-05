import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../styles/tour.css';

const TOURS = {};
let listeners = [];
let activeDriver = null;
let activeOnKey = null;

function cleanupActive() {
  if (activeDriver) {
    if (activeOnKey) document.removeEventListener('keydown', activeOnKey, true);
    try { activeDriver.destroy(); } catch { /* already destroyed */ }
    activeDriver = null;
    activeOnKey = null;
  }
}

export function registerTour(routePath, steps) {
  TOURS[routePath] = steps;
  listeners.forEach(fn => fn());
}

export function onTourRegistered(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

export function hasTour(routePath) {
  return Boolean(TOURS[routePath]?.length);
}

export function startTour(routePath) {
  const steps = TOURS[routePath];
  if (!steps?.length) return false;

  const disponibles = steps.filter(s => !s.optional || (s.element && document.querySelector(s.element)));
  if (!disponibles.length) return false;

  cleanupActive();

  const driverObj = driver({
    showProgress: true,
    animate: true,
    popoverClass: 'kamex-tour',
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Atrás',
    doneBtnText: 'Listo',
    progressText: '{{current}} de {{total}}',
    steps: disponibles.map(s => ({
      element: s.element || undefined,
      popover: {
        title: s.title,
        description: s.description,
        side: s.side || 'bottom',
        align: s.align || 'start',
        ...(s.click ? {
          onNextClick: (el, _step, opts) => {
            el?.click();
            setTimeout(() => opts.driver.moveNext(), s.clickDelay ?? 280);
          },
        } : {}),
        // A diferencia de `click` (que clickea el propio elemento resaltado,
        // ej. para abrir un modal), estos clickean OTRO elemento — para casos
        // donde el siguiente/anterior paso vive detrás de un tab que hay que
        // cambiar primero (ej. tour de /pos en mobile: Buscar ↔ Venta).
        ...(s.beforeNext ? {
          onNextClick: (_el, _step, opts) => {
            document.querySelector(s.beforeNext)?.click();
            setTimeout(() => opts.driver.moveNext(), s.clickDelay ?? 280);
          },
        } : {}),
        ...(s.beforePrev ? {
          onPrevClick: (_el, _step, opts) => {
            document.querySelector(s.beforePrev)?.click();
            setTimeout(() => opts.driver.movePrevious(), s.clickDelay ?? 280);
          },
        } : {}),
      },
    })),
  });

  driverObj.drive();

  const onKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const isLast = driverObj.isLastStep();
      const activeStep = driverObj.getActiveStep();
      const opts = { config: driverObj.getConfig(), state: driverObj.getState(), driver: driverObj };
      // Misma prioridad que usa driver.js internamente para su botón "Siguiente/Listo":
      // onDoneClick solo aplica en el último paso; onNextClick se revisa siempre
      // (el último paso de cada tour suele tener `click: true` para cerrar el modal
      // real, no un onDoneClick separado) — si acá llamáramos moveNext()/destroy()
      // directo nos saltaríamos ese click y el modal quedaría abierto.
      const doneHandler = isLast ? activeStep?.popover?.onDoneClick : undefined;
      const nextHandler = activeStep?.popover?.onNextClick;
      if (doneHandler) {
        doneHandler(driverObj.getActiveElement(), activeStep, opts);
      } else if (nextHandler) {
        nextHandler(driverObj.getActiveElement(), activeStep, opts);
      } else if (isLast) {
        driverObj.destroy();
      } else {
        driverObj.moveNext();
      }
    } else if (e.key === 'Escape') {
      driverObj.destroy();
    }
  };
  document.addEventListener('keydown', onKey, true);
  activeDriver = driverObj;
  activeOnKey = onKey;
  const origDestroy = driverObj.destroy.bind(driverObj);
  driverObj.destroy = () => {
    document.removeEventListener('keydown', onKey, true);
    activeDriver = null;
    activeOnKey = null;
    origDestroy();
  };

  return true;
}
