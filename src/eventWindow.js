 // 5:30 PM–11:00 PM IST on 10 October 2026.
export const EVENT_OPENS_AT = Date.UTC(2026, 9, 10, 12, 0, 0);
export const EVENT_CLOSES_AT = Date.UTC(2026, 9, 10, 17, 30, 0);

export function getEventWindowState(now = Date.now()) {
  if (now < EVENT_OPENS_AT) return 'locked';
  if (now >= EVENT_CLOSES_AT) return 'closed';
  return 'active';
}
