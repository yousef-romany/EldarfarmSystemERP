# Testing Guide for Mawashi Manager ERP

This document provides guidance on testing your ERP system using Jest, React Testing Library, and TestSprite.

## Test Setup

The project is configured with:
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **jest-mock-extended** - Advanced mocking capabilities
- **TestSprite** - AI-powered test generation (MCP configured)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- barn.actions.test.ts
```

## Test Structure

```
src/__tests__/
├── actions/          # Unit tests for server actions
│   ├── barn.actions.test.ts
│   └── livestock.actions.test.ts
├── api/             # Integration tests for API routes
│   └── barns.route.test.ts
├── components/      # Component tests
│   └── page-header.test.tsx
├── mocks/           # Mock utilities
│   └── prisma.ts
└── utils/           # Test helpers
    └── test-helpers.ts
```

## Writing Tests

### Server Action Tests

Server actions require mocking:
1. Prisma client
2. Next.js session
3. Next.js cache revalidation
4. Next.js navigation

Example pattern:

```typescript
// Mock dependencies first (before imports)
jest.mock('@/lib/prisma', () => ({
  prisma: {
    barn: {
      create: jest.fn(),
      update: jest.fn(),
      // ... other methods
    },
  },
}))

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('REDIRECT')
  }),
}))

// Then import modules
import { createBarn } from '@/lib/actions/barn.actions'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const prismaMock = prisma as jest.Mocked<typeof prisma>

describe('Barn Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSession as jest.Mock).mockResolvedValue({
      isLoggedIn: true,
      user: {
        id: 'user-1',
        permissions: { barns: { add: true } },
      },
    })
  })

  it('should create a barn successfully', async () => {
    prismaMock.barn.create.mockResolvedValue(/* mock data */)
    // ... rest of test
  })
})
```

### API Route Tests

API routes require the Node environment and NextResponse mocking:

```typescript
/**
 * @jest-environment node
 */

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))

import { GET } from '@/app/api/barns/route'
import { NextResponse } from 'next/server'

const mockJson = NextResponse.json as jest.Mock
```

### Component Tests

Component tests use React Testing Library:

```typescript
import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/page-header'

describe('PageHeader', () => {
  it('should render the title', () => {
    render(<PageHeader title="Test Page" />)

    const heading = screen.getByRole('heading', { name: 'Test Page' })
    expect(heading).toBeInTheDocument()
  })
})
```

## Using TestSprite for Test Generation

TestSprite is configured as an MCP server with your API key. You can use it to generate tests automatically.

### Manual Test Generation Pattern

While TestSprite's MCP integration is configured, you can also follow the established patterns to create tests manually:

1. **Identify the module to test** (server action, API route, or component)
2. **Set up appropriate mocks** based on dependencies
3. **Write test cases** covering:
   - Happy path (success scenarios)
   - Error cases
   - Validation failures
   - Permission checks
   - Edge cases

### Test Coverage Goals

Current coverage for tested modules:
- **barn.actions.ts**: 78.57% statement coverage
- **livestock.actions.ts**: 79.45% statement coverage
- **barns API route**: 100% coverage
- **PageHeader component**: 100% coverage

### Recommended Tests to Add

1. **Server Actions** (High Priority)
   - [ ] purchase.actions.ts
   - [ ] sale.actions.ts
   - [ ] expense.actions.ts
   - [ ] contribution.actions.ts
   - [ ] vow.actions.ts
   - [ ] user.actions.ts
   - [ ] auth.actions.ts

2. **API Routes** (Medium Priority)
   - [ ] /api/livestock
   - [ ] /api/sales
   - [ ] /api/purchases
   - [ ] /api/reports/*

3. **Components** (Medium Priority)
   - [ ] Layout components (Header, Sidebar)
   - [ ] Form components
   - [ ] Table components

4. **Utility Functions** (Low Priority)
   - [ ] lib/utils.ts
   - [ ] lib/permissions.ts

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset mocks
- Don't rely on test execution order

### 2. Descriptive Test Names
```typescript
// Good
it('should prevent deletion of barn with livestock', async () => {})

// Bad
it('test delete', async () => {})
```

### 3. Arrange-Act-Assert Pattern
```typescript
it('should create a barn successfully', async () => {
  // Arrange
  const mockBarn = { id: 'barn-1', name: 'Test Barn' }
  prismaMock.barn.create.mockResolvedValue(mockBarn)

  // Act
  const formData = new FormData()
  formData.append('name', 'Test Barn')
  const result = await createBarn({}, formData)

  // Assert
  expect(result.success).toBe(true)
  expect(prismaMock.barn.create).toHaveBeenCalled()
})
```

### 4. Test Edge Cases
- Empty data
- Invalid data
- Missing permissions
- Database errors
- Race conditions

### 5. Keep Tests Simple
- One concept per test
- Avoid complex logic in tests
- Make failures obvious

## Continuous Integration

Add this to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test -- --coverage --ci

- name: Check coverage thresholds
  run: npm run test:coverage
```

## Troubleshooting

### Common Issues

**Issue**: Prisma mock not working
**Solution**: Ensure mocks are defined before imports and use the correct export name (`prisma`, not `default`)

**Issue**: Next.js APIs not available in tests
**Solution**: Add appropriate environment comment (`@jest-environment node` or `@jest-environment jsdom`)

**Issue**: Tests timing out
**Solution**: Check for unresolved promises, missing mocks, or actual database calls

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [TestSprite Documentation](https://testsprite.com/docs)
- [Testing Next.js Applications](https://nextjs.org/docs/testing)

## Coverage Report

View detailed coverage reports in `coverage/lcov-report/index.html` after running:

```bash
npm run test:coverage
```

## Test Metrics

Current status:
- ✅ 26 tests passing
- ✅ 4 test suites
- ✅ ~79% coverage on tested modules
- ⏱️ ~2s test execution time

Target goals:
- 🎯 80%+ statement coverage
- 🎯 75%+ branch coverage
- 🎯 50+ total tests
- 🎯 Test execution under 10s
