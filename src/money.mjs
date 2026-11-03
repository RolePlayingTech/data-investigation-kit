/**
 * Exact integer-cent (BigInt) financial arithmetic & formatting.
 * Prevents IEEE-754 floating-point drift across sums, shares, and medians.
 */

export function toCents(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`Non-finite numeric value: ${value}`);
    return BigInt(Math.round(value * 100));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/[,\s_]/g, '');
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      throw new TypeError(`Invalid monetary string: "${value}"`);
    }
    const neg = trimmed.startsWith('-');
    const unsigned = neg ? trimmed.slice(1) : trimmed;
    const [whole, frac = ''] = unsigned.split('.');
    const fracPadded = (frac + '000').slice(0, 3);
    let cents = BigInt(whole) * 100n + BigInt(fracPadded.slice(0, 2));
    if (Number(fracPadded[2]) >= 5) cents += 1n;
    return neg ? -cents : cents;
  }
  throw new TypeError(`Unsupported monetary input type: ${typeof value}`);
}

export function sumCents(values) {
  let total = 0n;
  for (const v of values) {
    if (v !== null && v !== undefined) total += toCents(v);
  }
  return total;
}

export function centsToNumber(cents) {
  return Number(cents) / 100;
}

/**
 * Half-up rounding of `numerator / denominator` scaled by `10^decimals`.
 */
export function ratioScaled(numerator, denominator, decimals = 1) {
  const num = BigInt(numerator);
  const den = BigInt(denominator);
  if (den === 0n) return 0n;
  const scale = 10n ** BigInt(decimals);
  const neg = (num < 0n) !== (den < 0n);
  const a = num < 0n ? -num : num;
  const b = den < 0n ? -den : den;
  const twiceQuot = (a * scale * 2n) / b;
  const rounded = (twiceQuot + 1n) / 2n;
  return neg ? -rounded : rounded;
}

export function formatScaled(scaledInt, decimals = 1, decimalSep = '.') {
  const s = BigInt(scaledInt);
  const neg = s < 0n;
  const abs = neg ? -s : s;
  if (decimals <= 0) return `${neg ? '-' : ''}${abs.toString()}`;
  const str = abs.toString().padStart(decimals + 1, '0');
  const head = str.slice(0, -decimals);
  const tail = str.slice(-decimals);
  return `${neg ? '-' : ''}${head}${decimalSep}${tail}`;
}

export function pctString(part, whole, decimals = 1, decimalSep = '.') {
  if (BigInt(whole) === 0n) return formatScaled(0n, decimals, decimalSep);
  const scaled = ratioScaled(BigInt(part) * 100n, BigInt(whole), decimals);
  return formatScaled(scaled, decimals, decimalSep);
}

export function medianCents(values) {
  const arr = values
    .filter((v) => v !== null && v !== undefined)
    .map((v) => toCents(v))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  if (arr.length === 0) return 0n;
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 1) return arr[mid];
  const sum = arr[mid - 1] + arr[mid];
  return (sum * 2n + 2n) / 4n; // half-up midpoint in cents
}

export function medianInt(values, decimals = 1, decimalSep = '.') {
  const arr = values
    .filter((v) => typeof v === 'number' && Number.isFinite(v))
    .slice()
    .sort((a, b) => a - b);
  if (arr.length === 0) return '0';
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 1) return String(arr[mid]);
  const sum = arr[mid - 1] + arr[mid];
  if (sum % 2 === 0) return String(sum / 2);
  const scaled = ratioScaled(sum, 2, decimals);
  return formatScaled(scaled, decimals, decimalSep);
}

export function formatMillions(cents, { decimals = 2, currency = 'USD', decimalSep = '.' } = {}) {
  // 1 million units = 100,000,000 cents
  const scaled = ratioScaled(toCents(cents), 100_000_000n, decimals);
  const num = formatScaled(scaled, decimals, decimalSep);
  return currency ? `${num}M ${currency}` : `${num}M`;
}

export function formatThousands(cents, { decimals = 1, currency = 'USD', decimalSep = '.' } = {}) {
  // 1 thousand units = 100,000 cents
  const scaled = ratioScaled(toCents(cents), 100_000n, decimals);
  const num = formatScaled(scaled, decimals, decimalSep);
  return currency ? `${num}k ${currency}` : `${num}k`;
}

export function formatExactCurrency(cents, { currency = 'USD', showDecimals = false } = {}) {
  const c = toCents(cents);
  const neg = c < 0n;
  const abs = neg ? -c : c;
  if (!showDecimals) {
    const wholeUnits = (abs * 2n + 100n) / 200n;
    const grouped = wholeUnits.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${neg ? '-' : ''}${grouped}${currency ? ` ${currency}` : ''}`;
  }
  const whole = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${neg ? '-' : ''}${whole}.${frac}${currency ? ` ${currency}` : ''}`;
}
