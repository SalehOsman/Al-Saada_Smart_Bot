import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  ignores: [
    'dist',
    'node_modules',
    'coverage',
    '.nuxt',
    '.output',
    '.temp',
    '!.github',
    'specs/**/*.md',
  ],
}, {
  rules: {
    // Custom rules can be added here
  },
})
