// Mock Prisma client first (must be before any imports that use it)
jest.mock('@/lib/prisma', () => ({
  prisma: {
    livestock: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    barn: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    log: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
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

import { updateLivestock, deleteLivestock } from '@/lib/actions/livestock.actions'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const prismaMock = prisma as jest.Mocked<typeof prisma>

describe('Livestock Actions', () => {
  const mockSession = {
    isLoggedIn: true,
    user: {
      id: 'user-1',
      permissions: {
        livestock: {
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

  describe('updateLivestock', () => {
    const mockLivestock = {
      id: 'livestock-1',
      tagId: 'TAG-001',
      barnId: 'barn-1',
      quantity: null,
      cost: 1000,
      weight: 50,
      age: 12,
      breed: 'Test Breed',
      livestockTypeId: 'type-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      purchaseId: null,
      vowId: null,
      status: 'ACTIVE' as const,
    }

    it('should update an individual livestock successfully', async () => {
      const mockBarn = {
        id: 'barn-1',
        name: 'Test Barn',
        capacity: 100,
        currentOccupancy: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.livestock.findUnique.mockResolvedValue(mockLivestock)
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          barn: {
            findUnique: jest.fn().mockResolvedValue(mockBarn),
            update: jest.fn().mockResolvedValue(mockBarn),
          },
          livestock: {
            update: jest.fn().mockResolvedValue(mockLivestock),
          },
          log: {
            create: jest.fn().mockResolvedValue({}),
          },
        })
      })

      const formData = new FormData()
      formData.append('entryDate', '2024-01-01')
      formData.append('cost', '1000')
      formData.append('registrationType', 'individual')
      formData.append('tagId', 'TAG-001')
      formData.append('livestockTypeId', 'type-1')
      formData.append('breed', 'Test Breed')
      formData.append('weight', '50')
      formData.append('age', '12')
      formData.append('barnId', 'barn-1')

      const result = await updateLivestock('livestock-1', {}, formData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('تم تعديل بيانات الماشية بنجاح!')
    })

    it('should update a batch livestock successfully', async () => {
      const mockBatchLivestock = {
        ...mockLivestock,
        tagId: null,
        quantity: 10,
      }

      prismaMock.livestock.findUnique.mockResolvedValue(mockBatchLivestock)
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          barn: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'barn-1',
              capacity: 100,
              currentOccupancy: 10,
            }),
            update: jest.fn(),
          },
          livestock: {
            update: jest.fn().mockResolvedValue(mockBatchLivestock),
          },
          log: {
            create: jest.fn(),
          },
        })
      })

      const formData = new FormData()
      formData.append('entryDate', '2024-01-01')
      formData.append('cost', '10000')
      formData.append('registrationType', 'batch')
      formData.append('quantity', '10')
      formData.append('livestockTypeId', 'type-1')
      formData.append('breed', 'Test Breed')
      formData.append('weight', '50')
      formData.append('age', '12')
      formData.append('barnId', 'barn-1')

      const result = await updateLivestock('livestock-1', {}, formData)

      expect(result.success).toBe(true)
    })

    it('should return validation error when tagId is missing for individual livestock', async () => {
      const formData = new FormData()
      formData.append('entryDate', '2024-01-01')
      formData.append('cost', '1000')
      formData.append('registrationType', 'individual')
      formData.append('tagId', '')
      formData.append('livestockTypeId', 'type-1')
      formData.append('weight', '50')
      formData.append('age', '12')
      formData.append('barnId', 'barn-1')

      const result = await updateLivestock('livestock-1', {}, formData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.tagId).toBeDefined()
    })

    it('should return validation error when quantity is missing for batch', async () => {
      const formData = new FormData()
      formData.append('entryDate', '2024-01-01')
      formData.append('cost', '1000')
      formData.append('registrationType', 'batch')
      formData.append('livestockTypeId', 'type-1')
      formData.append('weight', '50')
      formData.append('age', '12')
      formData.append('barnId', 'barn-1')

      const result = await updateLivestock('livestock-1', {}, formData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.quantity).toBeDefined()
    })

    it('should deny access when user lacks permissions', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        ...mockSession,
        user: {
          ...mockSession.user,
          permissions: {
            livestock: {
              edit: false,
            },
          },
        },
      })

      const formData = new FormData()
      formData.append('entryDate', '2024-01-01')
      formData.append('cost', '1000')
      formData.append('registrationType', 'individual')
      formData.append('tagId', 'TAG-001')
      formData.append('livestockTypeId', 'type-1')
      formData.append('weight', '50')
      formData.append('age', '12')
      formData.append('barnId', 'barn-1')

      const result = await updateLivestock('livestock-1', {}, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('ليس لديك الصلاحية لتعديل المواشي.')
    })

    it('should return error when livestock not found', async () => {
      prismaMock.livestock.findUnique.mockResolvedValue(null)

      const formData = new FormData()
      formData.append('entryDate', '2024-01-01')
      formData.append('cost', '1000')
      formData.append('registrationType', 'individual')
      formData.append('tagId', 'TAG-001')
      formData.append('livestockTypeId', 'type-1')
      formData.append('weight', '50')
      formData.append('age', '12')
      formData.append('barnId', 'barn-1')

      const result = await updateLivestock('livestock-1', {}, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('الحيوان غير موجود.')
    })
  })

  describe('deleteLivestock', () => {
    it('should delete opening balance livestock successfully', async () => {
      const mockLivestock = {
        id: 'livestock-1',
        tagId: 'TAG-001',
        barnId: 'barn-1',
        quantity: null,
        purchaseId: null,
        vowId: null,
        sales: [],
      }

      prismaMock.livestock.findUnique.mockResolvedValue(mockLivestock as any)
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          barn: {
            update: jest.fn(),
          },
          livestock: {
            delete: jest.fn(),
          },
          log: {
            create: jest.fn(),
          },
        })
      })

      const result = await deleteLivestock('livestock-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('تم حذف الماشية بنجاح.')
    })

    it('should prevent deletion of livestock from purchase/vow', async () => {
      const mockLivestock = {
        id: 'livestock-1',
        tagId: 'TAG-001',
        barnId: 'barn-1',
        purchaseId: 'purchase-1',
        vowId: null,
        sales: [],
      }

      prismaMock.livestock.findUnique.mockResolvedValue(mockLivestock as any)

      const result = await deleteLivestock('livestock-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('لا يمكن حذف الماشية من هنا، يجب حذفها من سجل الشراء أو النذر الأصلي.')
    })

    it('should prevent deletion of livestock involved in sales', async () => {
      const mockLivestock = {
        id: 'livestock-1',
        tagId: 'TAG-001',
        barnId: 'barn-1',
        purchaseId: null,
        vowId: null,
        sales: [{ id: 'sale-1' }],
      }

      prismaMock.livestock.findUnique.mockResolvedValue(mockLivestock as any)

      const result = await deleteLivestock('livestock-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('لا يمكن الحذف. هذا الحيوان مرتبط بعملية بيع. يرجى إلغاء البيع أولاً.')
    })

    it('should deny access when user lacks permissions', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        ...mockSession,
        user: {
          ...mockSession.user,
          permissions: {
            livestock: {
              delete: false,
            },
          },
        },
      })

      const result = await deleteLivestock('livestock-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('ليس لديك الصلاحية لحذف المواشي.')
    })

    it('should return error when livestock not found', async () => {
      prismaMock.livestock.findUnique.mockResolvedValue(null)

      const result = await deleteLivestock('livestock-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('الماشية غير موجودة.')
    })
  })
})
