// Mock Prisma client first (must be before any imports that use it)
jest.mock('@/lib/prisma', () => ({
  prisma: {
    barn: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    log: {
      create: jest.fn(),
    },
  },
}))

// Mock the session module
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}))

// Mock Next.js cache revalidation
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('REDIRECT')
  }),
}))

import { createBarn, updateBarn, deleteBarn } from '@/lib/actions/barn.actions'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const prismaMock = prisma as jest.Mocked<typeof prisma>

describe('Barn Actions', () => {
  const mockSession = {
    isLoggedIn: true,
    user: {
      id: 'user-1',
      permissions: {
        barns: {
          add: true,
          edit: true,
          delete: true,
        },
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('createBarn', () => {
    it('should create a barn successfully with valid data', async () => {
      const mockBarn = {
        id: 'barn-1',
        name: 'Test Barn',
        capacity: 100,
        currentOccupancy: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.barn.create.mockResolvedValue(mockBarn)
      prismaMock.log.create.mockResolvedValue({} as any)

      const formData = new FormData()
      formData.append('name', 'Test Barn')
      formData.append('capacity', '100')

      const result = await createBarn({}, formData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('تم إضافة العنبر بنجاح!')
      expect(prismaMock.barn.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Barn',
          capacity: 100,
          currentOccupancy: 0,
        },
      })
      expect(prismaMock.log.create).toHaveBeenCalled()
    })

    it('should return validation errors for invalid data', async () => {
      const formData = new FormData()
      formData.append('name', '')
      formData.append('capacity', '-10')

      const result = await createBarn({}, formData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.name).toBeDefined()
    })

    it('should deny access when user lacks permissions', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        ...mockSession,
        user: {
          ...mockSession.user,
          permissions: {
            barns: {
              add: false,
              edit: false,
              delete: false,
            },
          },
        },
      })

      const formData = new FormData()
      formData.append('name', 'Test Barn')
      formData.append('capacity', '100')

      const result = await createBarn({}, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('ليس لديك الصلاحية لإضافة عنابر.')
    })
  })

  describe('updateBarn', () => {
    it('should update a barn successfully', async () => {
      const mockBarn = {
        id: 'barn-1',
        name: 'Updated Barn',
        capacity: 150,
        currentOccupancy: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.barn.update.mockResolvedValue(mockBarn)
      prismaMock.log.create.mockResolvedValue({} as any)

      const formData = new FormData()
      formData.append('name', 'Updated Barn')
      formData.append('capacity', '150')

      const result = await updateBarn('barn-1', {}, formData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('تم تعديل العنبر بنجاح!')
    })
  })

  describe('deleteBarn', () => {
    it('should delete an empty barn successfully', async () => {
      const mockBarn = {
        id: 'barn-1',
        name: 'Test Barn',
        capacity: 100,
        currentOccupancy: 0,
        livestock: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.barn.findUnique.mockResolvedValue(mockBarn)
      prismaMock.barn.delete.mockResolvedValue(mockBarn)
      prismaMock.log.create.mockResolvedValue({} as any)

      const result = await deleteBarn('barn-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('تم حذف العنبر بنجاح!')
    })

    it('should prevent deletion of barn with livestock', async () => {
      const mockBarn = {
        id: 'barn-1',
        name: 'Test Barn',
        capacity: 100,
        currentOccupancy: 1,
        livestock: [{ id: 'livestock-1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.barn.findUnique.mockResolvedValue(mockBarn as any)

      const result = await deleteBarn('barn-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('لا يمكن حذف العنبر لأنه يحتوي على مواشٍ. يرجى نقل المواشي أولاً.')
    })
  })
})
