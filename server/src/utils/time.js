import { CAFE } from '../config/cafe.js';

// Rwanda is UTC+2 all year (no daylight saving).
const KIGALI_OFFSET_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function kigaliHour(date = new Date()) {
  return new Date(date.getTime() + KIGALI_OFFSET_MS).getUTCHours();
}

export function isOpenAt(date = new Date()) {
  const h = kigaliHour(date);
  return h >= CAFE.hours.openHour && h < CAFE.hours.closeHour;
}

export function startOfKigaliDay(date = new Date()) {
  const shifted = date.getTime() + KIGALI_OFFSET_MS;
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS - KIGALI_OFFSET_MS);
}