const SCROLL_CONTAINER_SELECTOR = "[data-app-scroll-container]";

let lockCount = 0;
let savedScrollTop = 0;

function getScrollContainer(): HTMLElement | null {
  const element = document.querySelector(SCROLL_CONTAINER_SELECTOR);
  return element instanceof HTMLElement ? element : null;
}

function isTouchDevice(): boolean {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

export function lockAppScroll(shouldLock: boolean): void {
  if (!isTouchDevice()) return;

  const container = getScrollContainer();
  if (!container) return;

  if (shouldLock) {
    lockCount += 1;
    if (lockCount > 1) return;

    savedScrollTop = container.scrollTop;
    container.dataset.scrollLocked = "true";
    container.style.overflow = "hidden";
    container.style.touchAction = "none";
    container.style.overscrollBehavior = "none";
    return;
  }

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  container.style.overflow = "";
  container.style.touchAction = "";
  container.style.overscrollBehavior = "";
  delete container.dataset.scrollLocked;
  container.scrollTop = savedScrollTop;
}
