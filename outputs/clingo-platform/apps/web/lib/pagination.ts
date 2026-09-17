export const BOARD_PAGE_SIZE = 10;

export function paginate<T>(items: T[], requestedPage: number, pageSize = BOARD_PAGE_SIZE) {
  const safePageSize = Math.max(1, Math.trunc(pageSize));
  const totalPages = Math.ceil(items.length / safePageSize);
  const currentPage = totalPages === 0
    ? 0
    : Math.min(totalPages, Math.max(1, Math.trunc(requestedPage) || 1));
  const start = currentPage > 0 ? (currentPage - 1) * safePageSize : 0;

  return {
    currentPage,
    items: items.slice(start, start + safePageSize),
    totalItems: items.length,
    totalPages
  };
}

export function paginationSequence(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 4) [2, 3, 4, 5].forEach(page => pages.add(page));
  if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach(page => pages.add(page));
  }

  const ordered = [...pages].filter(page => page >= 1 && page <= totalPages).sort((first, second) => first - second);
  const sequence: Array<number | "ellipsis"> = [];

  ordered.forEach((page, index) => {
    if (index > 0 && page - ordered[index - 1] > 1) sequence.push("ellipsis");
    sequence.push(page);
  });

  return sequence;
}
