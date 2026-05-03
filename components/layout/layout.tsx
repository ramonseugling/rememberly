import { useState } from 'react';
import { AddEventModal } from '@/components/add-event-modal/add-event-modal';
import { AppHeader } from '@/components/app-header/app-header';
import { AppSidebar } from '@/components/app-sidebar/app-sidebar';
import { BirthdayModal } from '@/components/birthday-modal/birthday-modal';
import { BottomNav } from '@/components/bottom-nav/bottom-nav';
import { CreateGroupModal } from '@/components/create-group-modal/create-group-modal';
import { Header } from '@/components/header/header';

interface User {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
}

interface LayoutProps {
  children: React.ReactNode;
  user?: User | null;
  hideHeader?: boolean;
  variant?: 'app' | 'landing';
}

export const Layout = ({
  children,
  user,
  hideHeader,
  variant = 'landing',
}: LayoutProps) => {
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  if (variant === 'app' && user) {
    return (
      <div className="relative min-h-screen gradient-soft">
        <div className="flex">
          <AppSidebar />

          <div className="flex flex-1 flex-col min-h-screen">
            <AppHeader user={user} />
            <main className="flex-1 flex flex-col pb-20 lg:pb-0">
              {children}
            </main>
          </div>
        </div>

        <BottomNav
          onAddEventClick={() => setAddEventOpen(true)}
          onCreateGroupClick={() => setCreateGroupOpen(true)}
        />

        <AddEventModal open={addEventOpen} onOpenChange={setAddEventOpen} />
        <CreateGroupModal
          open={createGroupOpen}
          onOpenChange={setCreateGroupOpen}
        />
        <BirthdayModal open={user.birth_day === null} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen gradient-soft flex-col">
      {!hideHeader && <Header user={user} />}
      <main className="flex-1 flex flex-col">{children}</main>
      <BirthdayModal open={!!user && user.birth_day === null} />
    </div>
  );
};
