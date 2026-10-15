// Policy data that changes over time. Keep it here so it is easy to update.
import { EU27 } from './countries.js';

// United States — Section 301 "forced labor" tariffs, effective 2026-07-24.
// They replaced the IEEPA tariffs (struck down by the Supreme Court on 2026-02-20) and the temporary Section 122 10% surcharge.
// Source: Morgan Lewis LawFlash, 27 Jul 2026 (and secondary trackers for the China / Vietnam / Thailand 12.5% tier).
export const US_RULES = {
  asOf: '2026-07-24',
  sourceUrl: 'https://www.morganlewis.com/pubs/2026/07/us-administration-rebuilds-global-tariff-program-under-section-301',
  // flat 10% additional duty
  tier10: ['AR', 'BD', 'KH', 'CA', 'EC', 'SV', 'GT', 'HN', 'IN', 'ID', 'JO', 'MY', 'MX', 'PK', 'LK', 'TT', 'GB'],
  // flat 12.5% additional duty (China, Vietnam, Thailand are named in public trackers; other investigated economies are also 12.5% but the full list is not embedded)
  tier125: ['CN', 'VN', 'TH'],
  // MFN + Section 301 combined is capped at 10%
  cap10: [...EU27, 'TW'],
  // MFN + Section 301 combined is capped at 12.5%
  cap125: ['JP', 'KR', 'CH'],
  // origins that get the "Column 2" (non-NTR) rate instead of the general rate
  nonNtr: ['RU', 'BY', 'CU', 'KP'],
};

// EU — standard VAT rates (reference only; verify with the European Commission / your customs broker).
export const EU_VAT = {
  AT: 20, BE: 21, BG: 20, HR: 25, CY: 19, CZ: 21, DK: 25, EE: 24, FI: 25.5, FR: 20, DE: 19, GR: 24,
  HU: 27, IE: 23, IT: 22, LV: 21, LT: 21, LU: 17, MT: 18, NL: 21, PL: 23, PT: 23, RO: 21, SK: 23,
  SI: 22, ES: 21, SE: 25,
};
export const EU_VAT_ASOF = '2026-06';

// EU temporary flat customs duty on low-value B2C parcels (from 2026-07-01 until the EU Customs Data Hub regime, ~2028).
export const EU_LOW_VALUE = { thresholdEur: 150, flatEur: 3, from: '2026-07-01' };
