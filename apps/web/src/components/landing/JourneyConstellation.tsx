export default function JourneyConstellation() {
  return (
    <div className="relative">
      {/* Desktop Version - Image Display */}
      <div className="hidden md:block">
        <section
          className="relative overflow-hidden rounded-[28px] border border-white/10 p-0"
          style={{
            background: 'linear-gradient(180deg, #f7f9fc 0%, #eef3f9 62%, #ecf1f7 100%)',
            boxShadow: '0 0 72px rgba(0,0,0,0.45)',
          }}
        >
          {/* Subtle decorative blur elements behind */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-36 w-[560px] -translate-x-1/2 bg-[#D4AF37]/8 blur-[65px]" />
            <div className="absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-blue-500/8 blur-[80px]" />
            <div className="absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-500/8 blur-[80px]" />
          </div>

          {/* Image Container with Perfect Border Alignment */}
          <div className="relative z-10 w-full">
            <img
              src="/images/investment-journey.jpg"
              alt="Wealthspot Investment Journey - From Opportunity Discovery to Deal Execution"
              className="w-full h-auto block"
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>
        </section>
      </div>

      {/* Mobile Version - Responsive Image */}
      <div className="md:hidden">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-0 backdrop-blur-sm">
          <img
            src="/images/investment-journey.jpg"
            alt="Wealthspot Investment Journey - From Opportunity Discovery to Deal Execution"
            className="w-full h-auto block"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </section>
      </div>
    </div>
  )
}
