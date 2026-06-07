// When LANDING_ONLY is true, the deployment shows the "Run your own copy" page
// instead of the live tool, and the AI search routes refuse to run.
//
// It turns on automatically when there is NO OpenRouter key — so a public
// showcase (e.g. swooper.vercel.app) with the key removed becomes a static
// landing page and can never spend the owner's credits. You can also force it
// on with NEXT_PUBLIC_LANDING_ONLY=true even when a key is present.
//
// Self-hosters who set OPENROUTER_API_KEY get the full, working app by default.
export const LANDING_ONLY =
  process.env.NEXT_PUBLIC_LANDING_ONLY === 'true' || !process.env.OPENROUTER_API_KEY
