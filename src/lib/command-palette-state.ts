export function shouldShowCommandEmptyState(
  search: string,
  commandCount: number
): boolean {
  return search.trim().length > 0 && commandCount === 0;
}
