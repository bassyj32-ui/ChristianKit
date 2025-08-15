import { describe, it, expect } from 'vitest'
import { capitalize, truncate, slugify } from './stringUtils'

describe('stringUtils', () => {
  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('world')).toBe('World')
    })

    it('handles empty string', () => {
      expect(capitalize('')).toBe('')
    })

    it('handles single character', () => {
      expect(capitalize('a')).toBe('A')
    })
  })

  describe('truncate', () => {
    it('truncates string to specified length', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...')
      expect(truncate('Short', 10)).toBe('Short')
    })

    it('handles empty string', () => {
      expect(truncate('', 5)).toBe('')
    })
  })

  describe('slugify', () => {
    it('converts string to URL-friendly slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('User Name 123')).toBe('user-name-123')
    })

    it('handles special characters', () => {
      expect(slugify('Hello@World!')).toBe('helloworld')
    })
  })
})





import { capitalize, truncate, slugify } from './stringUtils'

describe('stringUtils', () => {
  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('world')).toBe('World')
    })

    it('handles empty string', () => {
      expect(capitalize('')).toBe('')
    })

    it('handles single character', () => {
      expect(capitalize('a')).toBe('A')
    })
  })

  describe('truncate', () => {
    it('truncates string to specified length', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...')
      expect(truncate('Short', 10)).toBe('Short')
    })

    it('handles empty string', () => {
      expect(truncate('', 5)).toBe('')
    })
  })

  describe('slugify', () => {
    it('converts string to URL-friendly slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('User Name 123')).toBe('user-name-123')
    })

    it('handles special characters', () => {
      expect(slugify('Hello@World!')).toBe('helloworld')
    })
  })
})





