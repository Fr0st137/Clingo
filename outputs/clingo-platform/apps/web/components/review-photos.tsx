export function ReviewPhotos({ images }: { images?: Array<{ id: string; label: string; url?: string }> }) {
  if (!images?.length) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{images.filter(image => image.url).map(image => <a key={image.id} href={image.url} target="_blank" rel="noreferrer"><img alt={image.label} src={image.url} loading="lazy" className="h-[80px] w-[110px] rounded-xl border border-[#e6edf3] object-cover" /></a>)}</div>;
}
