// Pickup time slots. Rwanda is UTC+2 all year, so Kigali time is simple arithmetic.
const OFFSET = 2 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const STEP_MIN = 15;

export function isOpenNow(hours, now = Date.now()) {
  const h = new Date(now + OFFSET).getUTCHours();
  return h >= hours.openHour && h < hours.closeHour;
}

// 15-minute slots from today and tomorrow, starting at least `leadMin` minutes from now
export function buildSlots(hours, now = Date.now(), leadMin = 15) {
  const dayStart = Math.floor((now + OFFSET) / DAY) * DAY;
  const slots = [];
  for (let d = 0; d < 2; d++) {
    for (let m = hours.openHour * 60; m < hours.closeHour * 60; m += STEP_MIN) {
      const real = dayStart + d * DAY + m * 60000 - OFFSET;
      if (real < now + leadMin * 60000) continue;
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      slots.push({ value: new Date(real).toISOString(), label: `${d === 0 ? 'Today' : 'Tomorrow'} ${hh}:${mm}` });
    }
  }
  return slots;
}