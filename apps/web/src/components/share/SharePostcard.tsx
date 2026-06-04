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
      style={{ width: '1200px', height: '630px', boxSizing: 'border-box' }}
      className="relative flex flex-col justify-end bg-slate-950 text-white overflow-hidden p-6"
    >
      {/* Outer Border wrapper to hide edges */}
      <div className="absolute inset-0 border-[8px] border-slate-950 z-[60] pointer-events-none" />
      
      {/* Inner Elegant Gold Border */}
      <div className="absolute inset-2 border-[2px] border-[#D4AF37]/80 z-50 rounded-sm shadow-[inset_0_0_30px_rgba(212,175,55,0.15)] pointer-events-none" />

      {/* Background Image with slight scale to fit inside borders nicely */}
      <div className="absolute inset-2 overflow-hidden rounded-sm bg-slate-900">
        {coverImage ? (
          <img src={`https://wsrv.nl/?url=${encodeURIComponent(coverImage)}`} alt={title} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
             <Building2 className="w-48 h-48 opacity-20" />
          </div>
        )}
        
        {/* Dark elegant gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent opacity-90" />
        {/* Subtle gold radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.15),_transparent_40%)]" />
      </div>

      {/* Top Branding */}
      <div className="absolute top-12 left-14 z-50 flex items-center gap-2">
        <WLogo3D size={80} light={true} />
        <div className="flex flex-col">
          <p className="text-white font-serif font-bold text-[40px] leading-none tracking-wide">
            Wealth<span className="text-[#D4AF37]">Spot</span>
          </p>
          <p className="text-white/70 text-[13px] font-semibold tracking-[0.2em] leading-none mt-1">
            Research. Evaluate. Invest.
          </p>
          <div className="h-px w-12 bg-[#D4AF37]/50 mt-2.5" />
        </div>
      </div>

      {/* Shield Certified Badge */}
      <div className="absolute top-12 right-14 z-50 flex items-center gap-2 bg-slate-900/80 border border-[#D4AF37]/40 px-4 py-2 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.2)]">
        <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
        <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Shield Certified</span>
      </div>

      {/* Bottom Content Area */}
      <div className="relative z-50 px-10 pb-8 flex items-end justify-between w-full">
        <div className="flex-1 pr-12">
          {city && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#D4AF37]" />
              <div className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm drop-shadow-md">{city}</div>
            </div>
          )}
          <h1 className="text-7xl font-display font-bold leading-tight mb-10 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] max-w-[800px]" style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif' }}>
            {title}
          </h1>

          {/* Metrics Grid */}
          <div className="flex items-center gap-12 backdrop-blur-xl bg-slate-900/60 p-8 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden inline-flex">
            {/* Glossy highlight effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none" />
            
            {targetIRR && (
              <div className="relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#D4AF37] mb-2 opacity-90">Target IRR</p>
                <p className="font-display text-5xl font-bold text-white drop-shadow-md" style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif' }}>{targetIRR}</p>
              </div>
            )}

            {targetIRR && <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent relative z-10"></div>}

            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#D4AF37] mb-2 opacity-90">Tenure</p>
              <p className="font-display text-5xl font-bold text-white drop-shadow-md" style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif' }}>{tenure ?? 'TBD'}</p>
            </div>

            <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent relative z-10"></div>

            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#D4AF37] mb-2 opacity-90">Min. Entry</p>
              <p className="font-display text-5xl font-bold text-white drop-shadow-md" style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif' }}>{minEntry ?? 'TBD'}</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center bg-white/95 p-5 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] border-[3px] border-[#D4AF37] shrink-0 transform -rotate-1 relative z-50">
          <QRCodeSVG value={url} size={150} level="H" includeMargin={false} fgColor="#0f172a" />
          <div className="w-full h-px bg-slate-200 mt-4 mb-3" />
          <p className="text-slate-900 text-[10px] font-bold uppercase tracking-[0.2em] text-center w-full">
            Scan to View<br/>Investment
          </p>
        </div>
      </div>
    </div>
  );
});

SharePostcard.displayName = 'SharePostcard';
