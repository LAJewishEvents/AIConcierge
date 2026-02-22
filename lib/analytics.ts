export type AnalyticsEvent =
  | { name: "view"; props: { page: string } }
  | { name: "import_ics"; props: { ok: boolean; count?: number } }
  | { name: "open_event"; props: { id: string } }
  | { name: "ask"; props: { mode: string; chars: number } };

export function track(evt: AnalyticsEvent) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[analytics]", evt.name, evt.props);
  }
}
