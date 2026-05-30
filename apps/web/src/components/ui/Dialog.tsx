/**
 * Dialog — accessible modal dialog built on HTML <dialog>.
 *
 * Features:
 *   - Native <dialog> element (backdrip click + Esc to close)
 *   - Keyboard focus trap handled by browser natively
 *   - ARIA: role="dialog", aria-modal, aria-labelledby
 *   - Animated entrance/exit via CSS transitions
 *   - Sizes: sm | md | lg | full
 */

import { X } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react';

export type DialogSize = 'sm' | 'md' | 'lg' | 'full';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: DialogSize;
  /** Hide the built-in close (×) button */
  hideClose?: boolean;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-full m-4',
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  hideClose = false,
  children,
  footer,
  className = '',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync open state with the native dialog element
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // Sync close events (Esc key, backdrop click) back to parent
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handleClose = () => onClose();
    el.addEventListener('close', handleClose);
    return () => el.removeEventListener('close', handleClose);
  }, [onClose]);

  // Close on backdrop click disabled per requirement
  const handleBackdropClick = (_e: React.MouseEvent<HTMLDialogElement>) => {
    // Backdrop click disabled
  };

  // Each dialog instance needs its own unique id; if two modals share
  // `id="dialog-title"` and both mount, the duplicate breaks aria-labelledby.
  const titleId = useId();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-modal="true"
      onClick={handleBackdropClick}
      className={[
        // Native dialog reset
        'bg-transparent p-0 m-0 max-h-[100dvh] max-w-none w-full h-full',
        // Backdrop overlay
        'backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        // Centre the panel
        'flex items-center justify-center',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ border: 'none' }}
    >
      {/* Scrollable panel */}
      <div
        role="document"
        className={[
          'relative w-full mx-4 my-auto max-h-[90dvh] overflow-y-auto',
          'bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl',
          'flex flex-col',
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description || !hideClose) && (
          <div className="flex items-start justify-between gap-3 p-6 pb-4 shrink-0">
            <div className="min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="text-base font-semibold text-white leading-snug"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-white/50 mt-1">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 pb-4 flex-1 min-h-0">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 pt-2 border-t border-white/[0.08] shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
