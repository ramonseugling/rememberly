import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bell, Heart, Link2, Users } from 'lucide-react';

const ORBIT_AVATARS = [
  {
    image: '/images/avatars/pink-avatar.png',
    alt: 'Avatar Ana',
    bg: 'from-rose-200 to-rose-300',
    badge: { day: '07', month: 'ABR' },
    position: 'top-12 left-1/4 -translate-x-1/2',
    fit: 'object-contain',
  },
  {
    image: '/images/avatars/yellow-avatar.png',
    alt: 'Avatar João',
    bg: 'from-amber-200 to-orange-300',
    badge: { day: '18', month: 'MAI' },
    position: 'top-12 right-1/4 translate-x-1/2',
    fit: 'object-cover',
  },
  {
    image: '/images/avatars/green-avatar.png',
    alt: 'Avatar Pedro',
    bg: 'from-emerald-200 to-emerald-300',
    badge: { day: '26', month: 'JUN' },
    position: 'bottom-12 left-1/4 -translate-x-1/2',
    fit: 'object-cover',
  },
  {
    image: '/images/avatars/purple-avatar.png',
    alt: 'Avatar Marina',
    bg: 'from-violet-200 to-purple-300',
    badge: { day: '10', month: 'AGO' },
    position: 'bottom-12 right-1/4 translate-x-1/2',
    fit: 'object-cover',
  },
];

const ORBIT_LINES = [
  { d: 'M 50 50 C 40 50, 25 35, 25 22' },
  { d: 'M 50 50 C 60 50, 75 35, 75 22' },
  { d: 'M 50 50 C 40 50, 25 65, 25 78' },
  { d: 'M 50 50 C 60 50, 75 65, 75 78' },
];

const GROUP_MEMBERS = [
  { name: 'Ana', date: '7 de Abril' },
  { name: 'João', date: '18 de Maio' },
  { name: 'Pedro', date: '26 de Junho' },
  { name: 'Marina', date: '10 de Agosto' },
];

export const GroupsSection = () => {
  return (
    <section
      id="groups"
      className="section-screen relative bg-landing flex flex-col justify-center overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-10 lg:py-14">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center md:text-left"
          >
            <span className="pill-brand mb-5">
              <Users className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="pill-brand-text">Grupos</span>
            </span>
            <h2 className="text-section-title font-heading font-bold tracking-tight mb-5">
              <span className="block text-foreground">Todo mundo</span>
              <span className="block text-brand-gradient">
                lembra de todo mundo
              </span>
            </h2>
            <p className="max-w-xl mx-auto md:mx-0 text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
              Crie um grupo, compartilhe o link e cada pessoa adiciona o próprio
              aniversário. Simples assim.
            </p>
            <div className="inline-flex items-center gap-3 text-sm text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Heart className="w-4 h-4 text-primary" aria-hidden="true" />
              </span>
              <span className="font-medium">
                Perfeito para amigos, família e colegas
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mx-auto w-full max-w-md lg:max-w-lg"
          >
            <div className="relative aspect-square w-full">
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {ORBIT_LINES.map((line, idx) => (
                  <path
                    key={idx}
                    d={line.d}
                    fill="none"
                    stroke="hsl(340, 80%, 65%)"
                    strokeOpacity="0.35"
                    strokeWidth="0.4"
                    strokeDasharray="1 1.5"
                    strokeLinecap="round"
                  />
                ))}
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-32 w-32 rounded-full bg-card shadow-soft flex items-center justify-center">
                  <Image
                    src="/images/brand/logo.svg"
                    alt=""
                    width={72}
                    height={72}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {ORBIT_AVATARS.map((avatar, idx) => (
                <motion.div
                  key={idx}
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4 + idx * 0.5,
                    ease: 'easeInOut',
                    delay: idx * 0.3,
                  }}
                  className={`absolute ${avatar.position} flex items-center gap-2`}
                >
                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${avatar.bg} shadow-soft border-4 border-card overflow-hidden`}
                  >
                    <Image
                      src={avatar.image}
                      alt={avatar.alt}
                      width={96}
                      height={96}
                      className={`h-full w-full ${avatar.fit}`}
                    />
                  </div>
                  <div className="rounded-2xl bg-card shadow-soft px-2.5 py-1.5 text-center">
                    <div className="text-base font-bold leading-none text-foreground">
                      {avatar.badge.day}
                    </div>
                    <div className="text-[10px] font-semibold text-muted-foreground tracking-wider">
                      {avatar.badge.month}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="relative -mt-4 rounded-3xl border border-border/60 bg-card shadow-soft p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <Users
                      className="w-5 h-5 text-primary"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-foreground leading-tight">
                      Família
                    </h3>
                    <p className="text-xs text-muted-foreground">6 membros</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-smooth"
                >
                  <Link2 className="w-3 h-3" aria-hidden="true" />
                  Convidar
                </button>
              </div>
              <ul className="space-y-2.5">
                {GROUP_MEMBERS.map((member) => (
                  <li
                    key={member.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {member.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          🎂 {member.date}
                        </p>
                      </div>
                    </div>
                    <Bell
                      className="w-4 h-4 text-primary/70"
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
