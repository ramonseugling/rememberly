import Image from 'next/image';

export const MockupSection = () => {
  return (
    <section className="section-screen bg-landing flex flex-col justify-center overflow-hidden border-t border-border/40">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-10 lg:py-14">
        <div className="grid items-center gap-6 md:grid-cols-2 md:gap-8 lg:gap-12">
          {/* Left column — text */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left animate-fade-in">
            <h2 className="text-section-title font-heading font-bold tracking-tight mb-4 pb-2">
              <span className="block text-foreground">Nunca mais seja</span>
              <span className="block text-brand-gradient">
                pego de surpresa
              </span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl md:max-w-md">
              Veja rapidamente quem faz aniversário nos próximos dias.
            </p>
          </div>

          {/* Right column — mockups */}
          <div className="relative flex items-center justify-center">
            {/* Desktop mockup — visible only on large screens */}
            <div className="hidden lg:block w-full animate-fade-in">
              <div className="rounded-xl overflow-hidden shadow-float border border-border/40 bg-white">
                {/* Browser chrome */}
                <div className="h-9 bg-muted/60 flex items-center px-4 gap-2 border-b border-border/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                    <div className="w-3 h-3 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-5 rounded-full bg-background/80 border border-border/40 flex items-center px-3">
                      <span className="text-[10px] text-muted-foreground/60">
                        rememberly.com.br/dates
                      </span>
                    </div>
                  </div>
                </div>
                <Image
                  src="/mockups/mockup-desktop.png"
                  alt="App no desktop"
                  width={1280}
                  height={720}
                  className="w-full"
                />
              </div>
            </div>

            {/* Mobile mockup */}
            <div className="w-60 sm:w-72 md:w-56 lg:w-56 lg:shrink-0 animate-fade-in lg:absolute lg:-right-10 lg:-bottom-10">
              <div className="rounded-[2.5rem] overflow-hidden shadow-float border-[5px] border-border/50 bg-white">
                {/* Dynamic island */}
                <div className="h-7 bg-muted/50 flex items-center justify-center">
                  <div className="w-20 h-4 rounded-full bg-foreground/10" />
                </div>
                <Image
                  src="/mockups/mockup-native.png"
                  alt="App no iPhone"
                  width={430}
                  height={932}
                  className="w-full"
                />
                {/* Home bar */}
                <div className="h-6 bg-muted/30 flex items-center justify-center">
                  <div className="w-20 h-1 rounded-full bg-foreground/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
