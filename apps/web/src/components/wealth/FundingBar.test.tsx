import { render } from '@testing-library/react'
import FundingBar from './FundingBar'

describe('FundingBar', () => {
  it('sets aria-valuenow to correct funding percentage', () => {
    const { container } = render(<FundingBar raised={500_000} target={1_000_000} />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar).toBeInTheDocument()
    expect(bar?.getAttribute('aria-valuenow')).toBe('50')
  })

  it('clamps percentage at 100 when raised exceeds target', () => {
    const { container } = render(<FundingBar raised={1_200_000} target={1_000_000} />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(Number(bar?.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(100)
  })

  it('renders 0% when both raised and target are 0', () => {
    const { container } = render(<FundingBar raised={0} target={0} />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar?.getAttribute('aria-valuenow')).toBe('0')
  })

  it('renders loading skeleton and hides progressbar when isLoading is true', () => {
    const { container } = render(<FundingBar raised={0} target={100} isLoading />)
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
    expect(container.querySelector('.skeleton')).not.toBeNull()
  })

  it('shows percentage text by default', () => {
    const { getByText } = render(<FundingBar raised={250_000} target={1_000_000} />)
    expect(getByText('25% Funded')).toBeInTheDocument()
  })

  it('hides percentage text when showPercent is false', () => {
    const { queryByText } = render(
      <FundingBar raised={250_000} target={1_000_000} showPercent={false} showAmount={false} />
    )
    expect(queryByText(/Funded/)).toBeNull()
  })
})
