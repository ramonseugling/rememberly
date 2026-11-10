import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
  children: React.ReactNode;
}

// Renders the photo when available; children are the initials/icon fallback.
export const Avatar = ({ src, alt, className, children }: AvatarProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn(className, 'overflow-hidden')}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
};
