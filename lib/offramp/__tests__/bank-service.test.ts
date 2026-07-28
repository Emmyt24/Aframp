import {
  NIGERIAN_BANKS,
  fetchBanks,
  verifyAccountNumber,
  saveAccount,
  getSavedAccounts,
  deleteSavedAccount,
  checkRateLimit,
  SAVED_ACCOUNTS_STORAGE_KEY,
} from '@/lib/offramp/bank-service'

// ─── localStorage mock ───────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value }),
    removeItem: jest.fn((key: string) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

beforeEach(() => {
  localStorageMock.clear()
  jest.clearAllMocks()
})

// ─── NIGERIAN_BANKS ───────────────────────────────────────────────────────────
describe('NIGERIAN_BANKS', () => {
  it('has 15 banks', () => {
    expect(NIGERIAN_BANKS).toHaveLength(15)
  })

  it('each bank has id, name, and code', () => {
    NIGERIAN_BANKS.forEach((bank) => {
      expect(bank).toHaveProperty('id')
      expect(bank).toHaveProperty('name')
      expect(bank).toHaveProperty('code')
    })
  })

  it('contains Access Bank with code 044', () => {
    const accessBank = NIGERIAN_BANKS.find((b) => b.name === 'Access Bank')
    expect(accessBank).toBeDefined()
    expect(accessBank?.code).toBe('044')
  })

  it('contains Kuda Bank', () => {
    expect(NIGERIAN_BANKS.some((b) => b.name === 'Kuda Bank')).toBe(true)
  })
})

// ─── fetchBanks ───────────────────────────────────────────────────────────────
describe('fetchBanks', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('returns the full list of Nigerian banks', async () => {
    const promise = fetchBanks()
    jest.runAllTimers()
    const banks = await promise
    expect(banks).toEqual(NIGERIAN_BANKS)
    expect(banks).toHaveLength(15)
  })
})

// ─── verifyAccountNumber ──────────────────────────────────────────────────────
describe('verifyAccountNumber', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('returns CHUKWUEMEKA OKAFOR for account 0123456789', async () => {
    const promise = verifyAccountNumber('044', '0123456789')
    jest.runAllTimers()
    const name = await promise
    expect(name).toBe('CHUKWUEMEKA OKAFOR')
  })

  it('returns JOHN DOE for any other 10-digit account', async () => {
    const promise = verifyAccountNumber('058', '1234567890')
    jest.runAllTimers()
    const name = await promise
    expect(name).toBe('JOHN DOE')
  })

  it('throws for account numbers shorter than 10 digits', async () => {
    const promise = verifyAccountNumber('044', '12345')
    jest.runAllTimers()
    await expect(promise).rejects.toThrow('Invalid account number or verification failed')
  })

  it('throws for account numbers longer than 10 digits', async () => {
    const promise = verifyAccountNumber('044', '12345678901')
    jest.runAllTimers()
    await expect(promise).rejects.toThrow()
  })
})

// ─── saveAccount / getSavedAccounts / deleteSavedAccount ─────────────────────
describe('saveAccount', () => {
  it('saves a new account and returns it with an id', () => {
    const account = {
      bankName: 'Access Bank',
      bankCode: '044',
      accountNumber: '0123456789',
      accountName: 'CHUKWUEMEKA OKAFOR',
    }
    const saved = saveAccount(account)
    expect(saved.id).toBeDefined()
    expect(saved.bankName).toBe('Access Bank')
    expect(saved.accountNumber).toBe('0123456789')
  })

  it('persists accounts to localStorage', () => {
    const account = {
      bankName: 'GTBank',
      bankCode: '058',
      accountNumber: '1234567890',
      accountName: 'JOHN DOE',
    }
    saveAccount(account)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      SAVED_ACCOUNTS_STORAGE_KEY,
      expect.any(String)
    )
  })

  it('deduplicates by accountNumber + bankCode', () => {
    const account = {
      bankName: 'Access Bank',
      bankCode: '044',
      accountNumber: '0123456789',
      accountName: 'CHUKWUEMEKA OKAFOR',
    }
    saveAccount(account)
    saveAccount(account)
    const accounts = getSavedAccounts()
    const matches = accounts.filter(
      (a) => a.accountNumber === '0123456789' && a.bankCode === '044'
    )
    expect(matches).toHaveLength(1)
  })

  it('keeps at most 5 accounts', () => {
    for (let i = 0; i < 7; i++) {
      saveAccount({
        bankName: `Bank ${i}`,
        bankCode: `00${i}`,
        accountNumber: `123456789${i}`,
        accountName: `USER ${i}`,
      })
    }
    const accounts = getSavedAccounts()
    expect(accounts.length).toBeLessThanOrEqual(5)
  })
})

describe('getSavedAccounts', () => {
  it('returns empty array when nothing saved', () => {
    expect(getSavedAccounts()).toEqual([])
  })

  it('returns saved accounts', () => {
    saveAccount({
      bankName: 'Zenith Bank',
      bankCode: '057',
      accountNumber: '0000000001',
      accountName: 'TEST USER',
    })
    const accounts = getSavedAccounts()
    expect(accounts).toHaveLength(1)
    expect(accounts[0].bankName).toBe('Zenith Bank')
  })
})

describe('deleteSavedAccount', () => {
  it('removes account by id', () => {
    const saved = saveAccount({
      bankName: 'Fidelity Bank',
      bankCode: '070',
      accountNumber: '0000000002',
      accountName: 'DELETE ME',
    })
    deleteSavedAccount(saved.id)
    const accounts = getSavedAccounts()
    expect(accounts.find((a) => a.id === saved.id)).toBeUndefined()
  })

  it('does nothing when id does not exist', () => {
    saveAccount({
      bankName: 'UBA',
      bankCode: '033',
      accountNumber: '0000000003',
      accountName: 'KEEP ME',
    })
    deleteSavedAccount('non-existent-id')
    expect(getSavedAccounts()).toHaveLength(1)
  })
})

// ─── checkRateLimit ───────────────────────────────────────────────────────────
describe('checkRateLimit', () => {
  it('allows first 5 attempts', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit()).toBe(true)
    }
  })

  it('blocks 6th attempt within an hour', () => {
    for (let i = 0; i < 5; i++) checkRateLimit()
    expect(checkRateLimit()).toBe(false)
  })

  it('resets after an hour', () => {
    // Pre-fill with old timestamps (> 1 hour ago)
    const oldTimestamps = Array.from({ length: 5 }, (_, i) => Date.now() - 3_600_001 - i)
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(oldTimestamps))
    expect(checkRateLimit()).toBe(true)
  })
})
