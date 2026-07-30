export function formatRelativeTime(updatedAt: number | null): string {
  if (!updatedAt) return "belum pernah diubah";

  const diffMs = Date.now() - updatedAt;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "diubah baru saja";
  if (diffMinutes < 60) return `diubah ${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `diubah ${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  return `diubah ${diffDays} hari lalu`;
}
