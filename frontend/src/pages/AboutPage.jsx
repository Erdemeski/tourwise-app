import React from 'react'

export default function AboutPage() {
  return (
    <div className="min-h-screen relative isolate bg-white dark:bg-[rgb(22,26,29)] px-6 py-24 sm:py-32 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
      >
        <div
          style={{
            clipPath:
              'polygon(85% 40%, 100% 55%, 100% 30%, 90% 10%, 85% 5%, 78% 25%, 65% 60%, 55% 70%, 50% 65%, 48% 35%, 30% 80%, 0% 70%, 20% 100%, 30% 78%, 80% 95%, 90% 110%, 95% 130%, 98% 145%, 100% 160%, 100% 200%)',
          }}
          className="relative left-[calc(50%-5rem)] aspect-[1155/678] w-[48rem] -translate-x-1/2 rotate-[25deg] bg-gradient-to-tr from-[#f728a7] to-[#99d40e] opacity-40 sm:left-[calc(50%-20rem)] sm:w-[80rem] animate-pulse"
        />
      </div>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl">
          About Us
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          We work to be with you in your best memories...
        </p>
        <div className="mt-8 flex justify-center">
        </div>
      </div>
    </div>
  )
};