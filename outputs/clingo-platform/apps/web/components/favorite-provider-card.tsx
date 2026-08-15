const favoriteAssets = {
  arrow: "/figma-assets/favorite-arrow.svg",
  check: "/figma-assets/favorite-check.svg",
  heart: "/figma-assets/favorite-heart.svg",
  logo: "/figma-assets/favorite-stepapp.png",
  star: "/figma-assets/favorite-star.svg"
};

export type FavoriteProviderData = {
  id: string;
  name: string;
  completedServices: number;
  rating: number;
  reviews: number;
  experience: string;
};

export function FavoriteProviderCard({ provider }: { provider: FavoriteProviderData }) {
  return (
    <article
      className="flex h-[142px] w-[745px] flex-col items-start overflow-hidden rounded-[20px] border border-[#e6edf3] bg-white shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)]"
      data-name="Ogłoszenie na tablicy"
      data-node-id="5296:9375"
    >
      <div className="flex w-full items-start justify-between overflow-hidden p-[15px]" data-node-id="5296:9376">
        <div className="flex items-center gap-[20px] overflow-hidden" data-node-id="5296:9377">
          <div
            className="relative h-[74px] w-[74px] shrink-0 rounded-[99px] bg-[#ffd6e6] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.15)]"
            data-node-id="5296:9410"
          >
            <img
              alt=""
              className="absolute left-[5.12%] top-[37.14%] h-[24.84%] w-[89.28%] max-w-none"
              src={favoriteAssets.logo}
            />
          </div>

          <div className="flex flex-col items-start gap-[5px] overflow-hidden pt-[5px]" data-node-id="5296:9379">
            <div className="flex items-center gap-[10px] overflow-hidden" data-node-id="5296:9380">
              <h3 className="m-0 whitespace-nowrap text-[16px] font-bold leading-normal text-[#2e3b4c]">
                {provider.name}
              </h3>
              <div className="flex items-center justify-center gap-[8px] py-[4px]" data-node-id="5296:9394">
                <img alt="" className="h-[14px] w-[14px]" src={favoriteAssets.check} />
                <span className="whitespace-nowrap text-[14px] font-normal leading-normal text-[#2e3b4c]">
                  {provider.completedServices} Wykonanych usług
                </span>
              </div>
            </div>

            <div className="flex items-center gap-[5px] pt-px" data-node-id="5296:9411">
              <div className="flex h-[24px] w-[18px] items-center justify-center">
                <img alt="" className="h-[14px] w-[16px]" src={favoriteAssets.star} />
              </div>
              <span className="h-[24px] w-[25px] text-[14px] font-semibold leading-[24px] text-[#2e3b4c]">
                {provider.rating.toFixed(1)}
              </span>
              <a className="whitespace-nowrap text-[14px] font-normal leading-[24px] text-[#0079de]" href="#">
                ({provider.reviews} ocen)
              </a>
              <span className="whitespace-nowrap text-[14px] font-normal leading-[24px] text-[#2e3b4c]">
                Doświadczenie: {provider.experience}
              </span>
            </div>
          </div>
        </div>

        <button
          aria-label="Ulubione"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-[30px] border border-[#e6edf3] bg-[#f9fafb] p-[11px]"
          data-name="Ikona Ulubione"
          data-node-id="5296:9407"
        >
          <img alt="" className="h-[14px] w-[14px]" src={favoriteAssets.heart} />
        </button>
      </div>

      <a
        className="flex w-full items-center justify-between overflow-hidden border-t border-[#e6edf3] px-[15px] py-[10px]"
        data-node-id="5296:9399"
        href={`/profil-ogloszeniowy/${provider.id}`}
      >
        <span className="whitespace-nowrap text-[12px] font-normal leading-normal text-[#9ca3af]">
          Zamów usługę
        </span>
        <span className="flex items-center justify-center rounded-[30px] px-[10px] py-[2px]">
          <img alt="" className="h-[14px] w-[14px]" src={favoriteAssets.arrow} />
        </span>
      </a>
    </article>
  );
}
