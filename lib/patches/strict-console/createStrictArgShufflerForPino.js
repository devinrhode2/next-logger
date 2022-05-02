/** @return {import('../../types').strictArgShuffler} */
const createStrictArgShufflerForPino = (
  /**
   * Other methods are not supported YET
   *
   * Having the consoleMethod will be key to supporting other methods in the future.
   *
   * @type {import('../../types').supportedConsoleMethods}
   */
  consoleMethod,
) => {
  // This is immediately returned below.
  // Placing type here improves type error/underline inside vscode.
  /** @type {import('../../types').strictArgShuffler} */
  const strictArgShuffler = (
    /** @type {any[]} */
    ...args
  ) => {
    let [label, data, ...restArgs] = args
    // Sample: Add support for `console.group`:
    // if (consoleMethod === 'group') return ['group start: ' + label]

    // This code probably isn't necessary, something really smells, but
    // It's pretty harmless, if you aren't taking performance into account
    if (
      Array.isArray(label) &&
      data === undefined &&
      restArgs.length === 0
    ) {
      // It's actually an arg array.
      // originalConsole.debug(
      //   '[next-logger] createStrictArgShuffler: unpacked arg array:',
      //   ...args,
      // )
      ;[label, data, ...restArgs] = label

      if (
        Array.isArray(label) &&
        data === undefined &&
        restArgs.length === 0
      ) {
        // originalConsole.debug(
        //   '[next-logger] createStrictArgShuffler: unpacked arg array (again):',
        //   ...args,
        // )
        ;[label, data, ...restArgs] = label
      }
    }

    // Enable if debugging, disabled for performance reasons:
    // Object.values(
    //   require('next/dist/build/output/log').prefixes,
    // ).forEach((prefix) => {
    //   if (label === prefix) {
    //     throw new Error(
    //       '[next-logger] your next.js patch is not working, probably cause you used yarn link. Use yalc link instead',
    //     )
    //   }
    // })

    // handle `label`
    if (typeof label !== 'string') {
      if (
        typeof label === 'object' &&
        typeof label.message === 'string' &&
        data === undefined &&
        restArgs.length === 0
      ) {
        // its a non-crashing exception: console.error(new Error())
        const originalObject = label
        data = originalObject
        label = originalObject.message
        return [data, label]
      } else {
        originalConsole.warn(
          `[next-logger] createStrictArgShuffler: first console arg must be a string or Error (it's currently a ${typeof label}) to ensure logs are easy to search and filter, assuming logMethod hook will handle this:`,
          ...args,
        )
        // @ts-expect-error - let this be handled by logMethod hook
        return [...args]
      }
    }

    // TODO: add condition, only check this if `applicationinsights.Configuration[something related to internal logging being enabled]`
    if (label.startsWith('ApplicationInsights:')) {
      originalConsole.log(label, data, ...restArgs)
      return undefined // no-op??
    }

    // handle `data`
    if (
      Array.isArray(data) &&
      data.every((datum) => typeof datum === 'string')
    ) {
      data = data.join(', ')
    }
    if (typeof data === 'function') {
      data = data.toString()
    }
    if (typeof data === 'string') {
      label += ` ${data}`
      data = undefined
    }

    // handle `args`
    if (typeof restArgs !== 'undefined') {
      if (
        restArgs.every(
          (arg) => typeof arg === 'string',
        )
      ) {
        label += restArgs.join(' ')
      } else {
        originalConsole.warn(
          '[next-logger] createStrictArgShuffler: only two args are supported, assuming logMethod hook will handle this:',
          ...args,
        )
        // @ts-expect-error - let this be handled by logMethod hook
        return [...args]
      }
    }

    // label the label (kind of for debugging, but may be nice in general)
    label = `console.${consoleMethod}: ${label}`

    if (data === undefined) {
      return [label]
    } else {
      // reverse order of args for Pino:
      // If first arg provided to pino is an object,
      // It will be serialized
      return [data, label]
    }
  }
  return strictArgShuffler
}

module.exports = { createStrictArgShufflerForPino }