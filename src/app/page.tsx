import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Gift,
  Leaf,
  MapPin,
  Milk,
  ShieldCheck,
  Sprout,
  Star,
  Store,
  Shirt,
  Ticket,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonClass } from "@/components/common/button";
import { CtaBand, HeroCtas } from "@/components/landing/auth-ctas";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingLeaderboard } from "@/components/landing/landing-leaderboard";
import { PhoneMockup } from "@/components/landing/phone-mockup";

const FEATURES = [
  { icon: Leaf, title: "Recycle bottles", body: "Use designated recycling bins around Dili.", tone: "bg-green-100 text-green-600" },
  { icon: Star, title: "Earn points", body: "Earn 1–3 points for each verified report.", tone: "bg-gold-100 text-gold-500" },
  { icon: Gift, title: "Future rewards", body: "Use points for vouchers and benefits — coming soon.", tone: "bg-blue-100 text-blue-600" },
  { icon: Sprout, title: "A cleaner Timor", body: "Help keep Dili clean and protect our environment.", tone: "bg-teal-100 text-teal-600" },
];

const STEPS = [
  { icon: MapPin, title: "Find a bin", body: "Open the map and choose a designated BotleValor bin near you." },
  { icon: Camera, title: "Recycle a bottle", body: "At the bin, take one photo showing your hand, the bottle and the bin." },
  { icon: BadgeCheck, title: "Verify", body: "We check your location and photo evidence for the selected bin." },
  { icon: Star, title: "Earn points", body: "Each verified report earns 1–3 points: 1 point per bottle, up to 3." },
];

const REWARD_TYPES = [
  { icon: Ticket, title: "Vouchers", body: "Discounts and store credit." },
  { icon: Store, title: "Partner offers", body: "Offers from future local partners." },
  { icon: Shirt, title: "Merchandise", body: "Reusable BotleValor items." },
  { icon: Sprout, title: "Community", body: "Turn points into tree planting." },
];

const PILLARS = [
  { icon: Milk, title: "Cleaner city", body: "More bottles recycled, less plastic on our streets, rivers and beaches.", tone: "bg-blue-100 text-blue-600" },
  { icon: Users, title: "Stronger community", body: "Small actions from everyone add up to a big impact.", tone: "bg-teal-100 text-teal-600" },
  { icon: Leaf, title: "Sustainable future", body: "A greener and healthier Timor-Leste for the next generation.", tone: "bg-green-100 text-green-600" },
];

export default function LandingPage() {
  return (
    <div id="top" className="bg-white">
      <LandingHeader />

      <main id="main-content">
        {/* Hero */}
        <section className="relative overflow-hidden" aria-labelledby="hero-title">
          <div className="absolute inset-0">
            <Image
              src="/images/bg-image.png"
              alt=""
              fill
              loading="eager"
              sizes="100vw"
              className="object-cover object-[70%_center]"
            />
            <div className="absolute inset-0 bg-linear-to-b from-white/95 via-white/85 to-white/40 lg:bg-linear-to-r lg:from-white lg:via-white/85 lg:to-white/0" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-white to-transparent" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:pb-20 lg:pt-14">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-green-100/80 px-4 py-1.5 text-sm font-semibold text-green-800">
                <Leaf className="size-4" aria-hidden /> A Cleaner Dili, A Brighter Tomorrow
              </p>
              <h1 id="hero-title" className="mt-5 text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
                Recycle Today.
                <br />
                <span className="text-green-600">Earn Tomorrow.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-ink-soft sm:text-xl">
                <strong className="font-semibold text-navy-900">BotleValor</strong> rewards you for recycling plastic
                bottles at designated bins around Dili. Small actions create a cleaner city and a healthier future for
                Timor-Leste.
              </p>
              <HeroCtas />

              <ul className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {FEATURES.map(({ icon: Icon, title, body, tone }) => (
                  <li key={title}>
                    <span className={`flex size-14 items-center justify-center rounded-full ${tone}`}>
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <h2 className="mt-3 text-base font-bold">{title}</h2>
                    <p className="mt-1 text-sm text-ink-soft">{body}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden justify-center sm:flex lg:justify-end lg:pr-8">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 bg-linear-to-b from-white to-blue-50 py-16 lg:py-24" aria-labelledby="how-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-green-700">How it works</p>
              <h2 id="how-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Four simple steps from bottle to points
              </h2>
            </div>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="card relative p-6">
                  <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-blue-100">{i + 1}</span>
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Bins */}
        <section id="bins" className="scroll-mt-20 py-16 lg:py-24" aria-labelledby="bins-title">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="relative aspect-[4/3] overflow-hidden rounded-panel shadow-raised">
              <Image
                src="/images/botle_bin.jpeg"
                alt="A large fish-shaped wire cage for collecting plastic bottles on the Dili waterfront"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 shadow-card">
                <MapPin className="size-5 text-green-600" aria-hidden />
                <span className="text-sm font-semibold text-navy-900">Designated bins around Dili</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-green-700">Recycle bins</p>
              <h2 id="bins-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Find a designated bin on the map
              </h2>
              <p className="mt-4 text-lg text-ink-soft">
                BotleValor bins accept plastic bottles today, with more materials planned later. The interactive
                OpenStreetMap view shows each bin&apos;s name, photo and location, and gives you walking directions.
              </p>
              <p className="mt-3 rounded-xl border border-dashed border-violet-600/30 bg-violet-50 px-4 py-3 text-sm text-ink-soft">
                The first BotleValor bin is in front of Palacio do Governo, Dili. More bins will be added as the programme grows.
              </p>
              <Link href="/bins" className={buttonClass({ size: "lg", className: "mt-6" })}>
                Explore the bin map <ArrowRight className="size-5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* Rewards */}
        <section id="rewards" className="scroll-mt-20 bg-linear-to-b from-gold-50/60 to-white py-16 lg:py-24" aria-labelledby="rewards-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-gold-600">Rewards</p>
              <h2 id="rewards-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Points today, rewards tomorrow
              </h2>
              <p className="mt-4 text-lg text-ink-soft">
                Each verified report earns 1–3 points, and rewards start from 500 points. Reward redemption is coming
                soon — these are the kinds of rewards we&apos;re planning.
              </p>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {REWARD_TYPES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="card flex items-start gap-4 p-5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-600">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{body}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-subtle">Coming soon</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Leaderboard (live, by points) */}
        <LandingLeaderboard />

        {/* Impact / community */}
        <section id="about" className="scroll-mt-20 py-16 lg:py-24" aria-labelledby="about-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-green-700">About BotleValor</p>
              <h2 id="about-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Built for Dili, powered by community
              </h2>
            </div>
            <ul className="card mt-10 grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {PILLARS.map(({ icon: Icon, title, body, tone }) => (
                <li key={title} className="flex items-start gap-4 p-6">
                  <span className={`flex size-14 shrink-0 items-center justify-center rounded-full ${tone}`}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="relative mt-16 overflow-hidden rounded-panel bg-linear-to-br from-green-600 to-green-800 px-6 py-10 text-white sm:px-12">
              <div className="relative z-10 max-w-xl">
                <CtaBand />
              </div>
              <Leaf className="absolute -bottom-10 -right-6 size-64 text-white/10" aria-hidden />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-canvas">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <BrandLogo size="sm" href="#top" />
          <p className="flex items-start gap-2 text-sm text-muted md:max-w-md">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden />
            Points have no monetary value. Reward redemption is coming soon.
          </p>
          <p className="text-sm text-muted">© 2026 BotleValor · Dili, Timor-Leste</p>
        </div>
      </footer>
    </div>
  );
}
