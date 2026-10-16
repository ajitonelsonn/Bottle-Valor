import Image from "next/image";
import { BarChart3, Camera, Gift, Leaf, MapPin, Milk } from "lucide-react";
import { PointsCoin } from "@/components/common/points-coin";

/** Illustrative phone preview of the app (decorative, example values). */
export function PhoneMockup() {
  return (
    <div
      role="img"
      aria-label="Preview of the BotleValor app showing an example points balance and quick actions"
      className="relative mx-auto w-[16.5rem] rotate-[4deg] rounded-[2.6rem] border-[10px] border-navy-950 bg-white shadow-raised sm:w-[18rem]"
    >
      <div className="absolute left-1/2 top-0 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-navy-950" />
      <div className="rounded-[2rem] bg-linear-to-b from-white to-blue-50 px-4 pb-5 pt-8">
        <div className="flex flex-col items-center">
          <Image src="/images/logo-mark.png" alt="" width={46} height={43} className="logo-blend" style={{ width: 46, height: "auto" }} />
          <p className="mt-1 font-display text-xl font-extrabold">
            <span className="text-navy-800">Botle</span>
            <span className="text-green-600">Valor</span>
          </p>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-green-50 p-3">
          <PointsCoin size={40} />
          <div>
            <p className="text-[10px] font-semibold text-ink-soft">Your points</p>
            <p className="font-display text-2xl font-extrabold leading-none text-navy-950">21</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 text-center text-[11px] font-semibold text-ink-soft">
          <span className="flex flex-col items-center gap-1 rounded-2xl bg-green-50 py-3">
            <Camera className="size-5 text-green-600" aria-hidden /> Recycle Now
          </span>
          <span className="flex flex-col items-center gap-1 rounded-2xl bg-blue-50 py-3">
            <MapPin className="size-5 text-blue-600" aria-hidden /> Find Bins
          </span>
          <span className="flex flex-col items-center gap-1 rounded-2xl bg-gold-50 py-3">
            <Gift className="size-5 text-gold-500" aria-hidden /> Rewards
          </span>
          <span className="flex flex-col items-center gap-1 rounded-2xl bg-violet-50 py-3">
            <BarChart3 className="size-5 text-violet-600" aria-hidden /> History
          </span>
        </div>
        <p className="mt-4 text-xs font-bold text-navy-900">Your impact</p>
        <div className="mt-2 flex justify-between text-[11px] text-ink-soft">
          <span className="flex items-center gap-1.5">
            <Milk className="size-4 text-blue-600" aria-hidden />
            <span>
              <strong className="block text-sm text-navy-900">22</strong>bottles
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Leaf className="size-4 text-green-600" aria-hidden />
            <span>
              <strong className="block text-sm text-navy-900">0.55 kg</strong>plastic
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
