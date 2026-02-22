export function formatWhen(startISO?: string, tzLabel = "PST") {
  if (!startISO) return "TBD";
  const d = new Date(startISO);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  try{
    return `${new Intl.DateTimeFormat("en-US", opts).format(d)} • ${tzLabel}`;
  }catch{
    return d.toLocaleString();
  }
}
