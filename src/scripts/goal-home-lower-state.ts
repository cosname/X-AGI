export type ScheduleFilters = {
  date: string;
  category: string;
};

export type ScheduleFilterable = {
  date: string;
  category: string;
};

export type InitializationDataset = {
  [name: string]: string | undefined;
};

export function claimInitialization(dataset: InitializationDataset, key: string) {
  if (dataset[key] === 'true') return false;
  dataset[key] = 'true';
  return true;
}

export function releaseInitialization(dataset: InitializationDataset, key: string) {
  delete dataset[key];
}

export function wrapGalleryIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export function galleryMovement(
  requestedIndex: number,
  length: number,
  reducedMotion: boolean,
) {
  return {
    targetIndex: wrapGalleryIndex(requestedIndex, length),
    moveInstantly: reducedMotion || requestedIndex < 0 || requestedIndex >= length,
  };
}

export function nearestSlideIndex(offsets: readonly number[], scrollLeft: number) {
  if (offsets.length === 0) return 0;

  return offsets.reduce((nearest, offset, index) => (
    Math.abs(offset - scrollLeft) < Math.abs(offsets[nearest] - scrollLeft)
      ? index
      : nearest
  ), 0);
}

export function formatGalleryStatus(index: number, total: number) {
  return `第 ${index + 1} 张，共 ${total} 张`;
}

export function matchesScheduleFilters(
  item: ScheduleFilterable,
  filters: ScheduleFilters,
) {
  const dateMatches = filters.date === 'all' || item.date === filters.date;
  const categoryMatches = filters.category === 'all' || item.category === filters.category;
  return dateMatches && categoryMatches;
}

export function countVisibleScheduleItems(
  items: readonly ScheduleFilterable[],
  filters: ScheduleFilters,
) {
  return items.filter((item) => matchesScheduleFilters(item, filters)).length;
}

export function formatScheduleStatus(visibleCount: number) {
  return visibleCount > 0
    ? `当前显示 ${visibleCount} 项安排`
    : '当前筛选下暂无安排';
}
