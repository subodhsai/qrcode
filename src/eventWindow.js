// 7:30 PM–11:30 PM Asia/Kolkata on 4 October 2026 (UTC+05:30).
export const EVENT_OPENS_AT = Date.UTC(2026, 9, 4, 14, 0, 0);
export const EVENT_CLOSES_AT = Date.UTC(2026, 9, 4, 18, 0, 0);

export function getEventWindowState(now = Date.now()) {
  if (now < EVENT_OPENS_AT) return 'locked';
  if (now >= EVENT_CLOSES_AT) return 'closed';
  return 'active';
}
