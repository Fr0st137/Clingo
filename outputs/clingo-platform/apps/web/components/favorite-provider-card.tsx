import { ArrowRight, Check, Heart, Star } from "lucide-react";

export function FavoriteProviderCard() {
  return (
    <article className="relative min-h-[142px] w-full overflow-hidden rounded-xl border border-[#dce6f2] bg-white shadow-figma transition-all hover:-translate-y-0.5 hover:shadow-soft md:w-[745px]">
      <div className="flex min-h-[104px] items-center px-[15px]">
        <div className="grid h-[74px] w-[74px] place-items-center rounded-full bg-[#facce2] text-[14px] font-extrabold text-[#54236e]">
          stepapp
        </div>

        <div className="ml-5 flex h-[65px] flex-col justify-center">
          <div className="flex h-[25px] items-center gap-[10px]">
            <h3 className="text-[18px] font-bold leading-6 text-clingo-ink">Stepapp</h3>
            <Check className="h-[14px] w-[14px] text-clingo-blue" strokeWidth={2} />
            <span className="text-[12px] text-[#5c6f85]">166 Wykonanych usług</span>
          </div>

          <div className="mt-[10px] flex h-6 items-center gap-[6px] text-[13px] text-[#536479]">
            <Star className="h-[14px] w-[14px] fill-[#f5c542] text-[#f5c542]" strokeWidth={1.7} />
            <span className="font-semibold text-[#2d3c50]">4.0</span>
            <a className="text-clingo-blue" href="#">
              (27 ocen)
            </a>
            <span>Doświadczenie: 5 lata</span>
          </div>
        </div>

        <button className="ml-auto mr-[0px] grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[#f7f9fc] text-[#ed3d4d] transition-all hover:bg-[#fff0f2]">
          <Heart className="h-[14px] w-[14px] fill-current" strokeWidth={2} />
        </button>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 flex h-[38px] items-center justify-between border-t border-[#e4ebf4] px-[15px] text-[12px] text-[#7f8ea2]">
        <span>Zamów usługę</span>
        <ArrowRight className="h-[14px] w-[14px]" strokeWidth={1.8} />
      </footer>
    </article>
  );
}
