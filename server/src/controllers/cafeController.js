import { CAFE } from '../config/cafe.js';
import {
  SIZE_PRICES, MILK_SURCHARGE, SYRUPS, SYRUP_PUMP_PRICE, EXTRA_SHOT_PRICE,
  MAX_SYRUP_PUMPS, MAX_EXTRA_SHOTS, PUNCH_TARGET, POINTS_PER_RWF,
} from '../config/pricing.js';
import { isOpenAt } from '../utils/time.js';

// Mobile money USSD codes. {number} and {amount} are filled in by the app for each order.
// The numbers come from .env (MTN_PAY_NUMBER, AIRTEL_PAY_NUMBER), read on every request.
function getPayment() {
  return {
    mtn: { label: 'MTN MoMo', number: process.env.MTN_PAY_NUMBER || '', ussd: '*182*1*1*{number}*{amount}#' },
    airtel: { label: 'Airtel Money', number: process.env.AIRTEL_PAY_NUMBER || '', ussd: '*182*1*2*{number}*{amount}#' },
  };
}

// Public info the client needs: café details, drink options and loyalty rules.
export const getCafe = (_req, res) => {
  res.json({
    cafe: { ...CAFE, payment: getPayment() },
    openNow: isOpenAt(new Date()),
    options: {
      sizes: SIZE_PRICES,
      milks: MILK_SURCHARGE,
      syrups: SYRUPS,
      syrupPumpPrice: SYRUP_PUMP_PRICE,
      extraShotPrice: EXTRA_SHOT_PRICE,
      maxSyrupPumps: MAX_SYRUP_PUMPS,
      maxExtraShots: MAX_EXTRA_SHOTS,
    },
    loyalty: { punchTarget: PUNCH_TARGET, rwfPerPoint: POINTS_PER_RWF },
  });
};