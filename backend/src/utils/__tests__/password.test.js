import { hashPassword, comparePassword } from '../password.js'
import bcrypt from 'bcryptjs'

jest.mock('bcryptjs')

describe('Password Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      bcrypt.hash.mockResolvedValue('hashed-password')

      const result = await hashPassword('plainpassword')

      expect(result).toBe('hashed-password')
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10)
    })

    it('should use correct bcrypt rounds', async () => {
      bcrypt.hash.mockResolvedValue('hashed')

      await hashPassword('password')

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10)
    })

    it('should handle hashing errors', async () => {
      bcrypt.hash.mockRejectedValue(new Error('Hash error'))

      try {
        await hashPassword('password')
      } catch (e) {
        expect(e.message).toContain('Hash error')
      }
    })
  })

  describe('comparePassword', () => {
    it('should compare matching passwords', async () => {
      bcrypt.compare.mockResolvedValue(true)

      const result = await comparePassword('plainpassword', 'hashed-password')

      expect(result).toBe(true)
      expect(bcrypt.compare).toHaveBeenCalledWith('plainpassword', 'hashed-password')
    })

    it('should return false for non-matching passwords', async () => {
      bcrypt.compare.mockResolvedValue(false)

      const result = await comparePassword('wrong', 'hashed')

      expect(result).toBe(false)
    })

    it('should handle comparison errors', async () => {
      bcrypt.compare.mockRejectedValue(new Error('Compare error'))

      try {
        await comparePassword('password', 'hash')
      } catch (e) {
        expect(e.message).toContain('Compare error')
      }
    })
  })
})
