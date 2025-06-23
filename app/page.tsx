import DomainGenerator from "../domain-generator"

export default function Page() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <h1 className="text-5xl font-extralight tracking-tight text-gray-900">Appealing.ai</h1>
        <p className="text-gray-500 text-center max-w-md font-light text-lg">
          Ready to find a really good domain name?
        </p>
        <DomainGenerator />
      </main>
    </div>
  )
}
