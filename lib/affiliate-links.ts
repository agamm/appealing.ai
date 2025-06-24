export function generateNamecheapAffiliateLink(domain: string): string {
  const baseUrl = "https://www.qksrv.net/links/101473094/type/am/sid/4055157/https://www.namecheap.com/domains/registration/results/?domain=";
  return baseUrl + encodeURIComponent(domain);
}