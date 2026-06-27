type PageHeadingProps = {
  title: string;
  description: string;
};

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <header className="pb-5 md:h-[90px] md:pb-0 md:pt-[21px]">
      <h2 className="text-[22px] font-bold leading-5 text-clingo-ink">{title}</h2>
      <p className="mt-[13px] max-w-[560px] text-[14px] leading-5 text-clingo-muted">{description}</p>
    </header>
  );
}
