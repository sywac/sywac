'use strict'

module.exports = {
  flags: 'build <services..>',
  desc: 'Pull branch and build/push images',
  paramsGroup: 'Build Arguments:',
  paramsDesc: 'One or more services to build',
  params: [
    { type: 'array:enum', choices: ['web', 'api', 'db'] }
  ],
  setup: sywac => {
    sywac
      .array('-t, --tag <tags..>', {
        group: 'Build Arguments:',
        desc: 'One or more tags to determine where images should be pushed'
      })
      .string('-b, -branch <branch>', {
        group: 'Repo Options:',
        desc: 'The branch to pull',
        required: true
      })
      .path('-p, --path <path>', {
        group: 'Repo Options:',
        desc: 'Path to repo on remote host',
        defaultValue: '/opt/repo'
      })
  },
  run: argv => {
    argv.buildCalled = true
  }
}
