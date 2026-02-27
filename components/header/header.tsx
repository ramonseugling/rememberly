import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-1xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent inline-block">
              My Forever Dates
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="link"
              size="icon"
              className="rounded-2xl hover:bg-destructive/10 hover:text-destructive"
            >
              <User className="w-5 h-5" />
            </Button>
            <Button
              variant="link"
              size="icon"
              className="rounded-2xl hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
