import Image from "next/image";
import Link from "next/link";

const SHOWCASE_SCREENS = [
  { src: "/screens/feed.png", alt: "Pod group feed showing friends' meals" },
  { src: "/screens/recap-reel.png", alt: "Auto-generated Pod recap reel" },
  { src: "/screens/roast-hype.png", alt: "AI roast or hype commentary on a meal" },
  { src: "/screens/wager-card.png", alt: "Pod wager receipt card" },
];

const FEATURES = [
  {
    tag: "Made to share",
    title: "Recap reels your Pod actually wants to post",
    description:
      "Every week Pod auto-cuts a highlight reel of your squad's wins, streaks, and chaos — ready to drop straight to Stories. No editing, no effort, just a reason to tag your friends.",
    image: "/screens/recap-reel.png",
    alt: "Pod recap reel screen",
  },
  {
    tag: "Brutally honest, painfully funny",
    title: "AI that roasts your 2am pizza and hypes your green smoothie",
    description:
      "Pod's AI commentary reacts to every log in real time — and your whole Pod sees it. It's the running joke that keeps people opening the app, screenshotting, and sending it to the group chat.",
    image: "/screens/roast-hype.png",
    alt: "AI roast or hype commentary screen",
  },
  {
    tag: "Skin in the game",
    title: "Put a wager on it",
    description:
      "Pods can stake bragging rights — or real stakes — on weekly goals. Wager receipts land in the feed automatically, turning accountability into the most-screenshotted feature in the app.",
    image: "/screens/wager-card.png",
    alt: "Pod wager receipt screen",
  },
  {
    tag: "Built on a streak you don't want to break",
    title: "Your whole squad celebrates when you don't quit",
    description:
      "Group streaks mean one slip doesn't end it alone — it ends it for everyone. That pressure (and the celebration when you hit a milestone together) is what keeps Pods logging in.",
    image: "/screens/streak-celebration.png",
    alt: "Group streak celebration screen",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-pod-cloud">
      {/* Hero */}
      <header className="bg-pod-ink px-4 pb-16 pt-8 text-white sm:pb-24 sm:pt-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-pod-yellow">
            Calorie tracking, but you're not alone
          </span>
          <h1 className="mt-6 max-w-xl font-display text-4xl font-bold leading-tight sm:text-5xl">
            Never log a meal alone again.
          </h1>
          <p className="mt-5 max-w-md text-lg text-white/70">
            Pod turns calorie tracking into a squad sport. Build a Pod with
            your friends, roast each other's meals, and stay accountable
            together — not alone with a streak counter.
          </p>
          <Link
            href="/signup"
            className="mt-8 w-full max-w-xs rounded-full bg-pod-coral px-8 py-4 text-center text-base font-semibold text-white shadow-lg shadow-pod-coral/30 transition hover:brightness-105 sm:w-auto"
          >
            Get early access 🔥
          </Link>
          <p className="mt-3 text-xs text-white/40">
            Free to join. Invite your Pod when we launch.
          </p>

          <div className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {SHOWCASE_SCREENS.map((screen) => (
              <div
                key={screen.src}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <Image
                  src={screen.src}
                  alt={screen.alt}
                  width={281}
                  height={384}
                  className="h-auto w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Social proof / stat strip */}
      <section className="bg-pod-coral px-4 py-5 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-8">
          <p className="text-sm font-semibold">
            🔥 Built for people who quit solo apps in week two
          </p>
          <p className="hidden text-sm font-semibold sm:block">•</p>
          <p className="text-sm font-semibold">
            🤝 You're 3x more likely to stick with a goal as a group
          </p>
        </div>
      </section>

      {/* Viral features */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-3xl font-bold text-pod-ink sm:text-4xl">
              The moments your Pod will actually post
            </h2>
            <p className="mt-3 text-pod-ink/60">
              We didn't build another tracker. We built the features your
              friends beg you to send them.
            </p>
          </div>

          <div className="mt-14 flex flex-col gap-16">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className={`flex flex-col items-center gap-8 sm:gap-12 ${
                  i % 2 === 1 ? "sm:flex-row-reverse" : "sm:flex-row"
                }`}
              >
                <div className="w-full max-w-[280px] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl shadow-black/5 sm:max-w-xs">
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    width={281}
                    height={384}
                    className="h-auto w-full"
                  />
                </div>
                <div className="max-w-md text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wide text-pod-teal">
                    {feature.tag}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-bold text-pod-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-pod-ink/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-pod-yellow px-4 py-16 sm:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="font-display text-3xl font-bold text-pod-ink sm:text-4xl">
            Your friends are waiting in the group chat.
          </h2>
          <p className="mt-3 max-w-md text-pod-ink/70">
            Get on the early access list and be the one who starts the Pod —
            not the one who gets added to it.
          </p>
          <Link
            href="/signup"
            className="mt-7 w-full max-w-xs rounded-full bg-pod-ink px-8 py-4 text-center text-base font-semibold text-white shadow-lg shadow-black/10 transition hover:brightness-110 sm:w-auto"
          >
            Get my invite 🔥
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-pod-ink px-4 py-8 text-center text-sm text-white/40">
        Pod — Never log alone.
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:hidden">
        <Link
          href="/signup"
          className="block w-full rounded-full bg-pod-coral py-3.5 text-center text-base font-semibold text-white"
        >
          Get early access 🔥
        </Link>
      </div>
      <div className="h-20 sm:hidden" />
    </div>
  );
}
