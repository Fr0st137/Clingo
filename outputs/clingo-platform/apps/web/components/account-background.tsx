const accountBackground = [
  "radial-gradient(ellipse 1280px 520px at 50% 18%, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.54) 48%, rgba(255,255,255,0) 74%)",
  "radial-gradient(ellipse 1120px 360px at 50% 84%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.58) 48%, rgba(255,255,255,0) 76%)",
  "radial-gradient(ellipse 540px 300px at 50% 18%, rgba(231,228,236,0.34) 0%, rgba(231,228,236,0.16) 42%, rgba(231,228,236,0) 72%)",
  "radial-gradient(ellipse 720px 760px at 0% 22%, rgba(187,220,255,0.66) 0%, rgba(218,236,255,0.42) 44%, rgba(255,255,255,0) 74%)",
  "radial-gradient(ellipse 720px 760px at 100% 22%, rgba(187,220,255,0.62) 0%, rgba(218,236,255,0.40) 44%, rgba(255,255,255,0) 74%)",
  "linear-gradient(180deg, #eaf4ff 0%, #f4f9ff 40%, #ffffff 100%)"
].join(", ");

export function AccountBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-1/2 top-px h-[911px] w-[1920px] -translate-x-1/2 overflow-hidden"
      data-figma-node="3934:6652"
      style={{ background: accountBackground, backgroundColor: "#f4f9ff" }}
    />
  );
}
