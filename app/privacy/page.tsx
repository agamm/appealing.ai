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
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Non-Personally Identifying Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Referring website</li>
              <li>Date and time of visit</li>
              <li>Pages viewed</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Potentially Personally Identifying Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>IP addresses (to determine approximate geographic location)</li>
              <li>Domain search queries (temporarily processed, not permanently stored)</li>
            </ul>

            <p className="text-gray-700 mt-4">
              <strong>Important:</strong> We do not require account creation or collect names, email addresses, or other personal information to use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Information</h2>
            <p className="text-gray-700 mb-4">We use the collected information for:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Providing and improving the domain search service</li>
              <li>Understanding how visitors use our service</li>
              <li>Monitoring and analyzing trends, usage, and activities</li>
              <li>Detecting and preventing abusive behavior</li>
              <li>Improving our AI domain generation algorithms</li>
              <li>Keeping the service safe and secure</li>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Sharing</h2>
            <p className="text-gray-700 mb-4">We take your privacy seriously and limit data sharing:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>We will not rent or sell your information to third parties</li>
              <li>We only share information with employees and contractors who need it to provide services and have agreed to keep it confidential</li>
              <li>We may disclose information when required by law, such as in response to subpoenas, court orders, or government requests</li>
              <li>We may share information to protect our rights, property, or safety, or that of our users or the public</li>
            </ul>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We do not retain potentially personally-identifying information longer than necessary. Specifically:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Domain search queries are processed in real-time and not stored</li>
              <li>IP addresses in logs are retained for up to 30 days for security purposes</li>
              <li>Aggregated analytics data may be retained indefinitely</li>
              <li>Rate limiting data is stored locally in your browser and expires after 24 hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookies and Local Storage</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and local storage to identify and track visitors and their usage of our service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Local storage for rate limiting (stored in your browser only)</li>
              <li>Session cookies for basic functionality</li>
              <li>Analytics cookies to understand usage patterns</li>
            </ul>
            <p className="text-gray-700 mt-4">
              You can refuse cookies by adjusting your browser settings. Note that some features may not function properly without cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-4">
              We take all measures reasonably necessary to protect against unauthorized access, use, alteration, or destruction of potentially personally-identifying information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>All data transmission is encrypted using HTTPS</li>
              <li>We use strong passwords and multi-factor authentication for all internal systems</li>
              <li>Access to user information is restricted to authorized personnel only</li>
              <li>We regularly review and update our security practices</li>
            </ul>
            <p className="text-gray-700 mt-4">
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Policy Changes</h2>
            <p className="text-gray-700 mb-4">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
            </p>
            <p className="text-gray-700">
              We encourage you to review this privacy policy periodically for any changes. Your continued use of our service after any modifications indicates your acceptance of the updated policy.
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