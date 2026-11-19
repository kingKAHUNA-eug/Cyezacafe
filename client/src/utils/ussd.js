// Fills the {number} and {amount} placeholders of a USSD template that comes from the server,
// e.g. '*182*1*1*{number}*{amount}#'  ->  '*182*1*1*0788123456*4500#'
export function buildUssd(template, number, amount) {
  const digits = String(number || '').replace(/\D/g, '');
  return template.replace('{number}', digits).replace('{amount}', String(Math.round(Number(amount) || 0)));
}

// The # at the end must be written as %23, otherwise the phone's dialer drops it.
export const telHref = (ussd) => `tel:${ussd.replace(/#/g, '%23')}`;