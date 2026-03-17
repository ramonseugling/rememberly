import Image from 'next/image';

export const MockupSection = () => {
  return (
    <section className="py-10 sm:py-24 bg-muted/20 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 animate-fade-in">
          Tudo organizado para você
        </h2>
        <p className="text-center text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12 max-w-xl mx-auto">
          Veja como é simples visualizar e gerenciar suas datas importantes
        </p>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          {/* Desktop mockup — visible only on large screens */}
          <div className="hidden lg:block w-full max-w-4xl animate-fade-in">
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
                      myforeverdates.com/dates
                    </span>
                  </div>
                </div>
              </div>
              {/* Screen placeholder — replace with next/image screenshot */}
              <Image
                src="/mockups/mockup-desktop.jpeg"
                alt="App no desktop"
                width={1280}
                height={720}
                className="w-full"
              />
            </div>
          </div>

          {/* Mobile mockup */}
          <div className="w-64 sm:w-72 lg:shrink-0 animate-fade-in lg:-ml-16 lg:mt-12">
            <div className="rounded-[2.5rem] overflow-hidden shadow-float border-[5px] border-border/50 bg-white">
              {/* Dynamic island */}
              <div className="h-7 bg-muted/50 flex items-center justify-center">
                <div className="w-20 h-4 rounded-full bg-foreground/10" />
              </div>
              <Image
                src="/mockups/mockup-ios.jpeg"
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
    </section>
  );
};
