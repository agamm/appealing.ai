export function generateNamecheapAffiliateLink(domain: string): string {
  const affiliateId = "101473094"; // Replace with your Commission Junction affiliate ID
  const baseUrl = `http://www.anrdoezrs.net/links/${affiliateId}/type/dlg/https://www.namecheap.com/domains/registration/results.aspx?domain=`;
  return baseUrl + domain;
}