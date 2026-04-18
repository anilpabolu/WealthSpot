import { describe, expect, it } from 'vitest'
import {
  panSchema,
  reraNumberSchema,
  emailSchema,
  indianPhoneSchema,
  investmentAmountSchema,
  propertyFilterSchema,
  investmentInitiateSchema,
  referralCodeSchema,
  signupSchema,
  bankVerificationSchema,
} from '@/lib/validators'

describe('panSchema', () => {
  it('accepts valid PAN', () => {
    expect(panSchema.parse('abcde1234f')).toBe('ABCDE1234F')
  })

  it('uppercases input', () => {
    expect(panSchema.parse('abcde1234f')).toBe('ABCDE1234F')
  })

  it.each(['', 'ABC', '12345', 'ABCDE12345', 'ABCDE1234', '1BCDE1234F'])(
    'rejects invalid PAN: %s',
    (val) => {
      expect(() => panSchema.parse(val)).toThrow()
    }
  )
})

describe('reraNumberSchema', () => {
  it('accepts valid RERA number', () => {
    expect(reraNumberSchema.parse('P52100001234')).toBe('P52100001234')
  })

  it('rejects too short', () => {
    expect(() => reraNumberSchema.parse('AB')).toThrow()
  })

  it('rejects too long (>100)', () => {
    expect(() => reraNumberSchema.parse('A'.repeat(101))).toThrow()
  })
})

describe('emailSchema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.parse('user@example.com')).toBe('user@example.com')
  })

  it.each(['', 'notanemail', '@missing.com', 'user@', 'user@.com'])(
    'rejects invalid email: %s',
    (val) => {
      expect(() => emailSchema.parse(val)).toThrow()
    }
  )

  it('rejects email longer than 255 chars', () => {
    expect(() => emailSchema.parse(`${'a'.repeat(250)}@b.com`)).toThrow()
  })
})

describe('indianPhoneSchema', () => {
  it.each(['9876543210', '6000000000', '7123456789'])(
    'accepts valid Indian phone: %s',
    (val) => {
      expect(indianPhoneSchema.parse(val)).toBe(val)
    }
  )

  it.each(['', '1234567890', '5876543210', '987654321', '98765432101', 'abcdefghij'])(
    'rejects invalid phone: %s',
    (val) => {
      expect(() => indianPhoneSchema.parse(val)).toThrow()
    }
  )
})

describe('investmentAmountSchema', () => {
  it('accepts amount >= 10000', () => {
    expect(investmentAmountSchema.parse('10000')).toBe('10000')
    expect(investmentAmountSchema.parse('500000')).toBe('500000')
  })

  it('rejects amount below 10000', () => {
    expect(() => investmentAmountSchema.parse('9999')).toThrow(/Minimum/)
  })

  it('rejects non-numeric string', () => {
    expect(() => investmentAmountSchema.parse('abc')).toThrow()
  })
})

describe('propertyFilterSchema', () => {
  it('returns defaults for empty input', () => {
    const result = propertyFilterSchema.parse({})
    expect(result.sort).toBe('featured_first')
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('accepts valid filters', () => {
    const result = propertyFilterSchema.parse({
      status: 'live',
      city: 'Mumbai',
      assetType: 'commercial',
      minXirr: 12,
      sort: 'xirr_desc',
      page: 2,
      limit: 10,
    })
    expect(result.status).toBe('live')
    expect(result.city).toBe('Mumbai')
    expect(result.page).toBe(2)
  })

  it('rejects invalid status', () => {
    expect(() => propertyFilterSchema.parse({ status: 'invalid' })).toThrow()
  })

  it('rejects invalid assetType', () => {
    expect(() => propertyFilterSchema.parse({ assetType: 'unknown' })).toThrow()
  })

  it('rejects minXirr > 100', () => {
    expect(() => propertyFilterSchema.parse({ minXirr: 101 })).toThrow()
  })

  it('rejects limit > 50', () => {
    expect(() => propertyFilterSchema.parse({ limit: 51 })).toThrow()
  })

  it('rejects limit < 1', () => {
    expect(() => propertyFilterSchema.parse({ limit: 0 })).toThrow()
  })
})

describe('investmentInitiateSchema', () => {
  const valid = {
    propertyId: '550e8400-e29b-41d4-a716-446655440000',
    amount: 50000,
  }

  it('accepts valid initiation', () => {
    const result = investmentInitiateSchema.parse(valid)
    expect(result.propertyId).toBe(valid.propertyId)
    expect(result.useCredits).toBe(false)
  })

  it('rejects non-uuid propertyId', () => {
    expect(() =>
      investmentInitiateSchema.parse({ ...valid, propertyId: 'not-a-uuid' })
    ).toThrow()
  })

  it('rejects amount below 10000', () => {
    expect(() =>
      investmentInitiateSchema.parse({ ...valid, amount: 5000 })
    ).toThrow()
  })

  it('rejects negative amount', () => {
    expect(() =>
      investmentInitiateSchema.parse({ ...valid, amount: -1 })
    ).toThrow()
  })
})

describe('referralCodeSchema', () => {
  it.each(['ABCD1234', 'A1B2C3', 'XY12AB78'])(
    'accepts valid code: %s',
    (val) => {
      expect(referralCodeSchema.parse(val)).toBe(val)
    }
  )

  it.each(['', 'abc', 'AB$1234', 'ABCDE12345'])(
    'rejects invalid code: %s',
    (val) => {
      expect(() => referralCodeSchema.parse(val)).toThrow()
    }
  )
})

describe('signupSchema', () => {
  const valid = {
    fullName: 'Anil Kumar',
    email: 'anil@example.com',
    dpdpConsent: true as const,
  }

  it('accepts valid signup', () => {
    const result = signupSchema.parse(valid)
    expect(result.fullName).toBe('Anil Kumar')
  })

  it('rejects missing consent', () => {
    expect(() =>
      signupSchema.parse({ ...valid, dpdpConsent: false })
    ).toThrow(/Terms/)
  })

  it('rejects name too short', () => {
    expect(() =>
      signupSchema.parse({ ...valid, fullName: 'A' })
    ).toThrow()
  })

  it('rejects name too long', () => {
    expect(() =>
      signupSchema.parse({ ...valid, fullName: 'A'.repeat(101) })
    ).toThrow()
  })
})

describe('bankVerificationSchema', () => {
  const valid = {
    accountNumber: '123456789012',
    ifscCode: 'HDFC0001234',
    accountHolderName: 'Anil Kumar',
  }

  it('accepts valid bank details', () => {
    const result = bankVerificationSchema.parse(valid)
    expect(result.ifscCode).toBe('HDFC0001234')
  })

  it('rejects short account number', () => {
    expect(() =>
      bankVerificationSchema.parse({ ...valid, accountNumber: '12345678' })
    ).toThrow()
  })

  it('rejects long account number', () => {
    expect(() =>
      bankVerificationSchema.parse({ ...valid, accountNumber: '1234567890123456789' })
    ).toThrow()
  })

  it.each(['hdfc0001234', 'HDFC1001234', 'ABC0001', '12340001234'])(
    'rejects invalid IFSC: %s',
    (ifscCode) => {
      expect(() =>
        bankVerificationSchema.parse({ ...valid, ifscCode })
      ).toThrow()
    }
  )

  it('rejects short account holder name', () => {
    expect(() =>
      bankVerificationSchema.parse({ ...valid, accountHolderName: 'A' })
    ).toThrow()
  })
})
