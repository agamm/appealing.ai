import { GITHUB_URL, OPENROUTER_KEYS_URL, VERCEL_DEPLOY_URL } from "@/lib/links"
import { GitHubIcon } from "@/components/github-icon"

// The self-host call-to-action. Shown on /deploy, and on the homepage whenever
// the deployment has no OpenRouter key (a public showcase) — see lib/config.ts.
export function RunYourOwn() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Run your own copy</h1>
      <p className="text-gray-600 mb-8">Self-host Swooper with your own keys.</p>

      <p className="text-sm text-gray-500 font-light mt-2">
        Swooper is open source. Deploy your own instance with your own{" "}
        <a href={OPENROUTER_KEYS_URL} target="_blank" rel="noopener noreferrer" className="text-gray-700 underline underline-offset-2 hover:text-gray-900 transition-colors">OpenRouter</a>{" "}
        key — you only pay for your own usage.
      </p>
      <ol className="text-sm text-gray-500 font-light mt-3 space-y-1 list-decimal list-inside">
        <li>Grab a free key at <a href={OPENROUTER_KEYS_URL} target="_blank" rel="noopener noreferrer" className="text-gray-700 underline underline-offset-2 hover:text-gray-900 transition-colors">openrouter.ai/keys</a>.</li>
        <li>Click deploy and paste your key when prompted.</li>
        <li>That&apos;s it — your instance, your credits.</li>
      </ol>
      <div className="flex flex-wrap items-center gap-4 mt-5">
        <a href={VERCEL_DEPLOY_URL} target="_blank" rel="noopener noreferrer" aria-label="Deploy with Vercel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://vercel.com/button" alt="Deploy with Vercel" height={32} className="h-8" />
        </a>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <GitHubIcon className="w-4 h-4" /> View on GitHub
        </a>
      </div>
    </div>
  )
}
