function HowToSection() {
  return (
    <div className="text-center text-gray-500 text-sm py-6 font-light space-y-3">
      <div>Anything in <span className="text-purple-600 font-semibold">( )</span> is sent to AI to generate words:</div>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="text-xs font-mono">
          <div className="flex items-center justify-center gap-1 text-gray-600">
            <span>fire</span>
            <span className="text-purple-600 font-semibold">(animals)</span>
            <span>.com</span>
          </div>
        </div>
        <div className="text-gray-400 text-xs animate-pulse">↓</div>
        <div className="text-xs font-mono space-y-1 text-gray-700">
          <div>firedog.com</div>
          <div>firetiger.com</div>
          <div>firewolf.com</div>
          <div className="text-gray-400">...</div>
        </div>
      </div>
    </div>
  )
}

export { HowToSection }