/**
 * @jest-environment node
 */

// Mock Prisma client first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    barn: {
      findMany: jest.fn(),
    },
  },
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))

import { GET } from '@/app/api/barns/route'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const prismaMock = prisma as jest.Mocked<typeof prisma>
const mockJson = NextResponse.json as jest.Mock

describe('/api/barns', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockJson.mockImplementation((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    }))
  })

  describe('GET', () => {
    it('should return all barns ordered by name', async () => {
      const mockBarns = [
        {
          id: 'barn-1',
          name: 'Barn A',
          capacity: 100,
          currentOccupancy: 50,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'barn-2',
          name: 'Barn B',
          capacity: 150,
          currentOccupancy: 75,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ]

      prismaMock.barn.findMany.mockResolvedValue(mockBarns)

      const mockRequest = {} as Request
      const response = await GET(mockRequest)

      expect(prismaMock.barn.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      })

      expect(mockJson).toHaveBeenCalledWith(mockBarns)

      const data = await response.json()
      expect(data).toEqual(mockBarns)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('Barn A')
    })

    it('should return empty array when no barns exist', async () => {
      prismaMock.barn.findMany.mockResolvedValue([])

      const mockRequest = {} as Request
      const response = await GET(mockRequest)

      const data = await response.json()
      expect(data).toEqual([])
      expect(data).toHaveLength(0)
    })

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database connection failed')
      prismaMock.barn.findMany.mockRejectedValue(mockError)

      const mockRequest = {} as Request
      const response = await GET(mockRequest)

      expect(response.status).toBe(500)
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Failed to fetch barns' },
        { status: 500 }
      )
    })
  })
})
