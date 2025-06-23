import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow px-4 py-12">
        <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-extralight text-gray-900 hover:text-gray-700 transition-colors">
            Appealing.ai
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <p className="text-gray-600 mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-700 mb-4">
              At Appealing.ai, we take your privacy seriously. This policy describes how we collect, use, and protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <p className="text-gray-700 mb-4">We collect minimal information to provide our service:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Domain search queries (temporarily processed, not stored)</li>
              <li>Basic analytics data (page views, general location)</li>
              <li>No personal information is required to use our service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Information</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>To provide domain availability checking</li>
              <li>To improve our AI domain generation algorithms</li>
              <li>To understand general usage patterns</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Domain Searches</h2>
            <p className="text-gray-700 mb-4 font-semibold">
              We do NOT store or track individual domain searches. We do NOT front-run domains. 
              Your searches are private and are not used to register domains before you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 mb-4">We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Domain registrar APIs for availability checking</li>
              <li>Analytics services for general usage statistics</li>
              <li>AI services for domain name generation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookies</h2>
            <p className="text-gray-700 mb-4">
              We use minimal cookies for basic functionality and analytics. No tracking cookies are used.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate security measures to protect against unauthorized access or disclosure of any data we process.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">
              Since we don&apos;t collect personal information, there&apos;s no personal data to access, modify, or delete. 
              You can use our service anonymously.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
            <p className="text-gray-700">
              For privacy-related questions, contact us at privacy@appealing.ai
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
              href="/legal" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Legal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}