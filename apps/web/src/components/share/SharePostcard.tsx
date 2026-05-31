import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Building2 } from 'lucide-react';
import WLogo3D from '@/components/ui/WLogo3D';

interface SharePostcardProps {
  title: string;
  targetIRR?: string;
  tenure?: string;
  minEntry?: string;
  coverImage?: string;
  city?: string;
  url: string;
}

export const SharePostcard = forwardRef<HTMLDivElement, SharePostcardProps>(({
  title, targetIRR, tenure, minEntry, coverImage, city, url
}, ref) => {
  return (
    // The wrapper must have a fixed size for the postcard (1200x630 is standard Open Graph size)
    <div 
      ref={ref}
      style={{ width: '1200px', height: '630px' }}
      className="relative flex flex-col justify-end bg-slate-900 text-white overflow-hidden"
    >
      {/* Background Image - Wrapped in a CORS proxy to bypass R2 blocking */}
      {coverImage ? (
        <img src={`https://corsproxy.io/?${encodeURIComponent(coverImage)}`} alt={title} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
           <Building2 className="w-48 h-48 opacity-20" />
        </div>
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

      {/* Top Branding */}
      <div className="absolute top-10 left-12 flex items-center gap-3">
        <WLogo3D size={64} light={true} />
        <div className="flex flex-col">
          <span className="text-4xl font-bold tracking-tight text-white leading-none" style={{ fontFamily: 'Constantia, Cambria, Georgia, serif' }}>
            Wealth<span className="text-[#D4AF37]">Spot</span>
          </span>
          <span className="text-[14px] font-semibold uppercase tracking-[0.25em] text-white/80 mt-1">
            Private Wealth Access
          </span>
        </div>
      </div>

      {/* Bottom Content Area */}
      <div className="relative z-10 px-12 pb-12 flex items-end justify-between w-full">
        <div className="flex-1 pr-10">
          {city && <div className="text-[#D4AF37] font-bold tracking-widest uppercase text-lg mb-4">{city}</div>}
          <h1 className="text-6xl font-display font-bold leading-tight mb-8 drop-shadow-lg text-white">
            {title}
          </h1>

          {/* Metrics Grid */}
          <div className="flex items-center gap-16 backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20 inline-flex shadow-2xl">
            {targetIRR && (
              <>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Target IRR</p>
                  <p className="font-display text-4xl font-bold text-white">{targetIRR}</p>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
              </>
            )}
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Tenure</p>
              <p className="font-display text-4xl font-bold text-white">{tenure ?? 'TBD'}</p>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Min. Entry</p>
              <p className="font-display text-4xl font-bold text-white">{minEntry ?? 'TBD'}</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center bg-white p-4 rounded-2xl shadow-2xl shrink-0">
          <QRCodeSVG value={url} size={140} level="H" includeMargin={false} />
          <p className="text-slate-800 text-xs font-bold uppercase tracking-wider mt-3 text-center w-full">
            Scan to view<br/>opportunity
          </p>
        </div>
      </div>
    </div>
  );
});

SharePostcard.displayName = 'SharePostcard';
