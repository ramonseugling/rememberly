import { useRef } from 'react';
import AutoScroll from 'embla-carousel-auto-scroll';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import type { UpcomingHighlight } from '@/lib/types';
import { NextGroupDateCard } from './next-group-date-card';

interface NextGroupDatesCarouselProps {
  highlights: UpcomingHighlight[];
}

function renderCard(h: UpcomingHighlight) {
  return <NextGroupDateCard member={h.member} groups={h.groups} />;
}

function highlightKey(h: UpcomingHighlight) {
  return `${h.member.name}-${h.member.birth_day}-${h.member.birth_month}`;
}

export const NextGroupDatesCarousel = ({
  highlights,
}: NextGroupDatesCarouselProps) => {
  const autoScroll = useRef(
    AutoScroll({
      speed: 0.8,
      startDelay: 0,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  if (highlights.length === 1) {
    return <div className="mb-6">{renderCard(highlights[0])}</div>;
  }

  if (highlights.length === 2) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {highlights.map((h) => (
          <div key={highlightKey(h)}>{renderCard(h)}</div>
        ))}
      </div>
    );
  }

  return (
    <Carousel
      plugins={[autoScroll.current]}
      opts={{ loop: true, align: 'start' }}
      className="mb-6"
      onPointerDownCapture={() => autoScroll.current.stop()}
    >
      <CarouselContent>
        {highlights.map((h) => (
          <CarouselItem
            key={highlightKey(h)}
            className="md:basis-1/2 lg:basis-1/3"
          >
            {renderCard(h)}
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};
