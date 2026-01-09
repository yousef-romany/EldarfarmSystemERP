import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/page-header'

describe('PageHeader', () => {
  it('should render the title', () => {
    render(<PageHeader title="Test Page" />)

    const heading = screen.getByRole('heading', { name: 'Test Page' })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveClass('text-3xl', 'font-bold')
  })

  it('should render action button when provided', () => {
    const actionButton = <button>Add New</button>
    render(<PageHeader title="Test Page" action={actionButton} />)

    const button = screen.getByRole('button', { name: 'Add New' })
    expect(button).toBeInTheDocument()
  })

  it('should not render action div when action is not provided', () => {
    const { container } = render(<PageHeader title="Test Page" />)

    const heading = screen.getByRole('heading')
    expect(heading.nextSibling).toBeNull()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <PageHeader title="Test Page" className="custom-class" />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-class', 'flex', 'items-center', 'justify-between', 'mb-6')
  })

  it('should have proper dark mode classes', () => {
    render(<PageHeader title="Test Page" />)

    const heading = screen.getByRole('heading')
    expect(heading).toHaveClass('dark:text-gray-100')
  })

  it('should render multiple action elements', () => {
    const actions = (
      <>
        <button>Edit</button>
        <button>Delete</button>
      </>
    )
    render(<PageHeader title="Test Page" action={actions} />)

    const editButton = screen.getByRole('button', { name: 'Edit' })
    const deleteButton = screen.getByRole('button', { name: 'Delete' })

    expect(editButton).toBeInTheDocument()
    expect(deleteButton).toBeInTheDocument()
  })
})
