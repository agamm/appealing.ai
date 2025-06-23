import Link from "next/link"

export default function LegalPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow px-4 py-12">
        <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-extralight text-gray-900 hover:text-gray-700 transition-colors">
            Appealing.ai
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Legal Terms</h1>
        
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Terms of Service</h2>
            <p className="text-gray-600 mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-700 mb-4">
              By using Appealing.ai, you agree to these terms. Appealing.ai is a domain name search and discovery tool. 
              We help you find available domain names but do not register domains on your behalf.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Use of Service</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Our service is provided "as is" without warranties of any kind</li>
              <li>Domain availability information may not be 100% accurate due to timing and registrar differences</li>
              <li>We do not guarantee that a domain shown as available can be successfully registered</li>
              <li>Users are responsible for verifying domain availability with their chosen registrar</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All content on Appealing.ai, including the AI-powered domain generation technology, is owned by Appealing.ai 
              or its licensors. Users may not copy, modify, or distribute our content without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Affiliate Disclosure</h2>
            <p className="text-gray-700 mb-4">
              Appealing.ai participates in affiliate programs with domain registrars. We may earn commissions 
              from purchases made through our affiliate links. This does not affect the price you pay for domains.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              Appealing.ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
              resulting from your use or inability to use the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
            <p className="text-gray-700">
              For legal inquiries, please contact us at legal@appealing.ai
            </p>
          </section>
        </div>
        </div>
      </div>
      
      <footer className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 justify-center">
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Home
            </Link>
            <span className="text-sm text-gray-400">•</span>
            <Link 
              href="/faq" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              FAQ
            </Link>
            <span className="text-sm text-gray-400">•</span>
            <Link 
              href="/privacy" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}