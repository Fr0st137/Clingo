export const figmaBackgroundSrc = "/clingo-homepage/assets/backgrounds/background-clingo-home.svg";

export function FigmaBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-1/2 top-0 h-[911px] w-[1920px] -translate-x-1/2 overflow-hidden"
      data-name="Background"
      data-node-id="3934:6652"
    >
      <img
        alt=""
        className="absolute inset-0 h-full w-full max-w-none"
        decoding="async"
        fetchPriority="high"
        src={figmaBackgroundSrc}
      />
    </div>
  );
}
