/** Parity with workflow-mobile app/client/tasks.tsx calendar strip geometry. */
export const TASK_STRIP_DAY_ITEM_WIDTH = 50;
export const TASK_STRIP_DAY_CELL_WIDTH = 42;
export const TASK_STRIP_PADDING_RIGHT = 16;

export function taskStripScrollToSelectedX(
  idx: number,
  viewportWidth: number,
  daysCount: number,
): number {
  const stride = TASK_STRIP_DAY_ITEM_WIDTH;
  const contentWidth =
    daysCount * stride - (stride - TASK_STRIP_DAY_CELL_WIDTH) + TASK_STRIP_PADDING_RIGHT;
  const centerInContent = idx * stride + TASK_STRIP_DAY_CELL_WIDTH / 2;
  const target = centerInContent - viewportWidth / 2;
  const maxScroll = Math.max(0, contentWidth - viewportWidth);
  return Math.max(0, Math.min(maxScroll, target));
}

export function taskStripVisibleIndex(scrollLeft: number, viewportWidth: number): number {
  return Math.max(0, Math.round((scrollLeft + viewportWidth / 2) / TASK_STRIP_DAY_ITEM_WIDTH));
}

export function scrollTaskStripToIndex(
  el: HTMLDivElement,
  idx: number,
  daysCount: number,
  behavior: ScrollBehavior = "smooth",
): void {
  const run = () => {
    const width = el.clientWidth;
    if (width <= 0) {
      requestAnimationFrame(run);
      return;
    }
    el.scrollTo({
      left: taskStripScrollToSelectedX(idx, width, daysCount),
      behavior,
    });
  };
  requestAnimationFrame(run);
}
