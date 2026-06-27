const ellipses = [
  { name: "Ellipse 17 large", className: "left-[160px] top-[-37px] h-[703px] w-[1600px] bg-[#edf5ff]/80 blur-[42px]" },
  { name: "Ellipse 17 inner", className: "left-[310px] top-[85px] h-[460px] w-[1300px] bg-white/70 blur-[36px]" },
  { name: "Ellipse 19 right", className: "left-[1690px] top-[333px] h-[785px] w-[459px] bg-[#d5eaff]/75 blur-[34px]" },
  { name: "Ellipse 20 bottom left", className: "left-[555px] top-[726px] h-[260px] w-[278px] bg-white/85 blur-[28px]" },
  { name: "Ellipse 22 bottom right", className: "left-[1221px] top-[669px] h-[260px] w-[278px] bg-white/85 blur-[28px]" },
  { name: "Ellipse 19 top far right", className: "left-[1826px] top-[-280px] h-[559px] w-[263px] bg-[#cfe6ff]/70 blur-[32px]" },
  { name: "Ellipse 18 center", className: "left-[621px] top-[131px] h-[263px] w-[559px] bg-white/65 blur-[30px]" },
  { name: "Ellipse 18 top far left", className: "left-[-198px] top-[-309px] h-[559px] w-[263px] bg-[#cfe6ff]/70 blur-[32px]" },
  { name: "Ellipse 19 upper right", className: "left-[1630px] top-[-132px] h-[319px] w-[181px] bg-[#d7ebff]/75 blur-[30px]" },
  { name: "Ellipse 25 upper mid right", className: "left-[1374px] top-[-29px] h-[155px] w-[181px] bg-white/65 blur-[28px]" },
  { name: "Ellipse 23 upper left", className: "left-[129px] top-[-134px] h-[319px] w-[319px] bg-[#d8ecff]/70 blur-[34px]" },
  { name: "Ellipse 24 left", className: "left-[53px] top-[232px] h-[319px] w-[319px] bg-[#d8ecff]/72 blur-[34px]" }
];

export function FigmaBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-1/2 top-0 h-[911px] w-[1920px] -translate-x-1/2 overflow-hidden">
      <div className="absolute inset-0 bg-[#f4f9ff]" />
      <div className="absolute inset-x-0 top-[60px] h-[852px] bg-[#eaf4ff]" />
      {ellipses.map((ellipse) => (
        <div className={`absolute rounded-full ${ellipse.className}`} key={ellipse.name} />
      ))}
      <div className="absolute inset-x-0 top-[60px] h-[44px] bg-white/30 blur-[18px]" />
    </div>
  );
}
