/** Сайты на *.vercel.app из России могут открываться только через VPN: у таких проектов пометка. */
export function needsVpn(url: string): boolean {
  return new URL(url).hostname.endsWith('.vercel.app');
}
