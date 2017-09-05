'use strict'

module.exports = {
  flags: 'random [max=1] [min=0]',
  params: [
    { type: 'number', desc: 'Desired ceiling' },
    { type: 'number', desc: 'Desired floor' }
  ],
  desc: 'Get pseudo-random number',
  setup: sywac => sywac.check(argv => {
    if (isNaN(argv.min)) argv.min = 0
    if (isNaN(argv.max)) argv.max = 1
  }),
  run: (argv, context) => {
    let precision = 5
    let r = Math.random()
    if (argv.max !== 1 && argv.min) {
      precision = 0
      r = Math.floor(r * (argv.max - argv.min + 1)) + argv.min
    } else if (argv.max !== 1) {
      precision = 0
      r = Math.floor(r * (argv.max + 1))
    }
    context.output = r.toFixed(precision)
  }
}
