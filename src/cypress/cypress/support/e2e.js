// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// This is to handle an error not specific to the tests that is due to an issue with the Wordpress Elementor cached files
const knownIgnoredErrors = [
  'chunkloaderror: loading chunk 357 failed',
  'text-editor.2c35aafbe5bf0e127950.bundle.min.js',
  '8ced3627811cd25f73f2440439665c5903f0.js'
]

Cypress.env('knownIgnoredErrors', knownIgnoredErrors)

Cypress.on('uncaught:exception', (err) => {
  const message = err.message || ''
  const stack = err.stack || ''

  const normalizedMessage = message.toLowerCase()
  const normalizedStack = stack.toLowerCase()

  const isKnownBrokenElementorChunk = knownIgnoredErrors.some((knownError) => {
    return normalizedMessage.includes(knownError) || normalizedStack.includes(knownError)
  })

  if (isKnownBrokenElementorChunk) {
    return false
  }

  return true
})
