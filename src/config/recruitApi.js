export const RECRUIT_API_BASE = 'http://121.40.175.162:3100';

export const DEFAULT_RECIPIENT_NAME = '李哲乐';

export const DEFAULT_OPEN_ID = 'ou_79664ae0f2a5c43a42afeee7407632e3';

/** @deprecated use DEFAULT_OPEN_ID */
export const DEMO_OPEN_ID = DEFAULT_OPEN_ID;

export function buildRecipientPayload(openId) {
  const trimmed = openId?.trim();
  return trimmed ? { openId: trimmed } : {};
}
