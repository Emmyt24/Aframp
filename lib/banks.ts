/**
 * Nigerian bank codes for the cash-out form.
 *
 * STOPGAP: the backend has no `/banks` endpoint, so this list is hardcoded.
 * Paystack exposes the authoritative list at `GET /bank?country=nigeria` and
 * validates the code server-side when creating a transfer recipient — a wrong
 * code here fails the payout rather than misdirecting it, but the list should
 * be replaced by a proxied live fetch before this goes near real merchants.
 */
export interface Bank {
  code: string
  name: string
}

export const BANKS: Bank[] = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '999992', name: 'OPay' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
]
