import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Building2 } from 'lucide-react';
import WLogo3D from '@/components/ui/WLogo3D';

interface SharePostcardProps {
  title: string;
  tenure?: string;
  minEntry?: string;
  coverImage?: string;
  city?: string;
  url: string;
}

export const SharePostcard = forwardRef<HTMLDivElement, SharePostcardProps>(({
  title, tenure, minEntry, coverImage, city, url
}, ref) => {
  return (
    // Fluid responsive wrapper using container queries
    <div 
      ref={ref}
      className="relative flex flex-col justify-end bg-slate-950 text-white overflow-hidden w-full aspect-[1200/630] @container"
    >
      {/* Outer Border wrapper to hide edges */}
      <div className="absolute inset-0 border-[0.66cqi] border-slate-950 z-[60] pointer-events-none" />
      
      {/* Inner Elegant Gold Border */}
      <div className="absolute inset-[0.66cqi] border-[0.16cqi] border-[#D4AF37]/80 z-50 rounded-[0.3cqi] shadow-[inset_0_0_2.5cqi_rgba(212,175,55,0.15)] pointer-events-none" />

      {/* Background Image with slight scale to fit inside borders nicely */}
      <div className="absolute inset-[0.66cqi] overflow-hidden rounded-[0.3cqi] bg-slate-900">
        {coverImage ? (
          <img src={`https://wsrv.nl/?url=${encodeURIComponent(coverImage)}`} alt={title} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
             <Building2 className="w-[16cqi] h-[16cqi] opacity-20" />
          </div>
        )}
        
        {/* Dark elegant gradients - Stronger at the bottom to prevent text overlap */}
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent opacity-100 pointer-events-none" />
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        {/* Subtle gold radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.15),_transparent_40%)] pointer-events-none" />
      </div>

      {/* Top Branding */}
      <div className="absolute top-[4cqi] left-[4.66cqi] z-50 flex items-center gap-[0.66cqi]">
        <div className="w-[6.66cqi] h-[6.66cqi] flex items-center justify-center">
          <WLogo3D size="100%" light={true} />
        </div>
        <div className="flex flex-col">
          <p className="text-white font-serif font-bold text-[3.33cqi] leading-none tracking-wide">
            Wealth<span className="text-[#D4AF37]">Spot</span>
          </p>
          <p className="text-white/70 text-[1.08cqi] font-semibold tracking-[0.2em] leading-none mt-[0.3cqi]">
            Research. Evaluate. Invest.
          </p>
          <div className="h-px w-[4cqi] bg-[#D4AF37]/50 mt-[0.8cqi]" />
        </div>
      </div>

      {/* Shield Certified Badge */}
      <div className="absolute top-[4cqi] right-[4.66cqi] z-50 flex items-center gap-[0.66cqi] bg-slate-900/80 border border-[#D4AF37]/40 px-[1.33cqi] py-[0.66cqi] rounded-full backdrop-blur-md shadow-[0_0_1.25cqi_rgba(212,175,55,0.2)]">
        <div className="w-[0.66cqi] h-[0.66cqi] rounded-full bg-[#D4AF37] shadow-[0_0_0.66cqi_rgba(212,175,55,0.8)]" />
        <span className="text-[#D4AF37] text-[1cqi] font-bold uppercase tracking-widest">Shield Certified</span>
      </div>

      {/* Bottom Content Area */}
      <div className="relative z-50 mx-[3.33cqi] mb-[3.33cqi] p-[3.33cqi] flex items-end justify-between w-[calc(100%-6.66cqi)] bg-slate-950/70 backdrop-blur-2xl border border-white/10 rounded-[1.33cqi] shadow-[0_1.33cqi_4cqi_rgba(0,0,0,0.5)]">
        <div className="flex-1 pr-[4cqi] max-w-[70cqi]">
          {city && (
            <div className="flex items-center gap-[0.83cqi] mb-[1.33cqi]">
              <div className="w-[2.66cqi] h-px bg-[#D4AF37]" />
              <div className="text-[#D4AF37] font-bold tracking-widest uppercase text-[1.16cqi] drop-shadow-md">{city}</div>
            </div>
          )}
          <h1 className="text-[5.5cqi] font-display font-bold leading-tight mb-[3.33cqi] text-white drop-shadow-[0_0.33cqi_0.66cqi_rgba(0,0,0,0.6)] line-clamp-2" style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif' }}>
            {title}
          </h1>

          {/* Metrics Grid */}
          <div className="flex items-center gap-[4cqi] bg-white/5 p-[2cqi] rounded-[0.9cqi] border border-white/10 relative overflow-hidden inline-flex">
            <div className="relative z-10">
              <p className="text-[0.9cqi] font-bold uppercase tracking-[0.15em] text-[#D4AF37] mb-[0.33cqi] opacity-90">Tenure</p>
              <p className="font-display text-[3.33cqi] font-bold text-white drop-shadow-md" style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif' }}>{tenure ?? 'TBD'}</p>
            </div>

            <div className="w-px h-[4cqi] bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent relative z-10"></div>

            <div className="relative z-10">
              <p className="text-[0.9cqi] font-bold uppercase tracking-[0.15em] text-[#D4AF37] mb-[0.33cqi] opacity-90">Min. Entry</p>
              <p className="font-display text-[3.33cqi] font-bold text-white drop-shadow-md" style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif' }}>{minEntry ?? 'TBD'}</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center bg-white/95 p-[1.33cqi] rounded-[0.9cqi] shadow-[0_1.66cqi_3.33cqi_rgba(0,0,0,0.6)] border-[0.25cqi] border-[#D4AF37] shrink-0 relative z-50">
          <div className="w-[10cqi] h-[10cqi]">
            <QRCodeSVG value={url} style={{ width: '100%', height: '100%' }} level="H" includeMargin={false} fgColor="#0f172a" />
          </div>
          <div className="w-full h-px bg-slate-200 mt-[1cqi] mb-[0.66cqi]" />
          <p className="text-slate-900 text-[0.75cqi] font-bold uppercase tracking-[0.2em] text-center w-full">
            Scan to View<br/>Investment
          </p>
        </div>
      </div>
    </div>
  );
});

SharePostcard.displayName = 'SharePostcard';

