import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/hooks/useShield', () => ({
  useDownloadAssessmentDocument: vi.fn(),
}))

import { ShieldDocLink } from '@/components/shield/ShieldDocLink'
import { useDownloadAssessmentDocument } from '@/hooks/useShield'

const OPP_ID = 'opp-123'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useDownloadAssessmentDocument).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as never)
})

describe('ShieldDocLink', () => {
  it('renders a lock icon and "EOI required" for locked documents', () => {
    render(
      <ShieldDocLink
        opportunityId={OPP_ID}
        doc={{
          id: 'doc-1',
          filename: 'title-deed.pdf',
          contentType: 'application/pdf',
          sizeBytes: 51200,
          url: null,
          locked: true,
        }}
      />,
    )
    expect(screen.getByText('title-deed.pdf')).toBeInTheDocument()
    expect(screen.getByText('EOI required')).toBeInTheDocument()
    // Should NOT render a clickable link
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders a download button for unlocked documents with a direct URL', () => {
    render(
      <ShieldDocLink
        opportunityId={OPP_ID}
        doc={{
          id: 'doc-2',
          filename: 'valuation.pdf',
          contentType: 'application/pdf',
          sizeBytes: 204800,
          url: 'https://cdn.example.com/valuation.pdf',
          locked: false,
        }}
      />,
    )
    const btn = screen.getByRole('button')
    expect(btn).toBeInTheDocument()
    expect(screen.getByText('valuation.pdf')).toBeInTheDocument()
    expect(screen.getByText('200 KB')).toBeInTheDocument()
  })

  it('falls back to "Document" label when filename is null', () => {
    render(
      <ShieldDocLink
        opportunityId={OPP_ID}
        doc={{
          id: 'doc-3',
          filename: null,
          contentType: null,
          sizeBytes: null,
          url: 'https://cdn.example.com/doc3',
          locked: false,
        }}
      />,
    )
    expect(screen.getByText('Document')).toBeInTheDocument()
  })

  it('hides size badge when sizeBytes is null', () => {
    render(
      <ShieldDocLink
        opportunityId={OPP_ID}
        doc={{
          id: 'doc-4',
          filename: 'report.pdf',
          contentType: 'application/pdf',
          sizeBytes: null,
          url: 'https://cdn.example.com/report.pdf',
          locked: false,
        }}
      />,
    )
    expect(screen.queryByText(/KB/)).not.toBeInTheDocument()
  })

  it('calls the download hook when no direct URL is present', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ url: 'https://signed.example.com/doc' })
    vi.mocked(useDownloadAssessmentDocument).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never)
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(
      <ShieldDocLink
        opportunityId={OPP_ID}
        doc={{
          id: 'doc-5',
          filename: 'evidence.pdf',
          contentType: 'application/pdf',
          sizeBytes: 10240,
          url: null,
          locked: false,
        }}
      />,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(mutateAsync).toHaveBeenCalledWith({
      opportunityId: OPP_ID,
      mediaId: 'doc-5',
    })

    windowOpen.mockRestore()
  })
})
