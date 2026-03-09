import antfu from '@antfu/eslint-config'
import jsdoc from 'eslint-plugin-jsdoc'

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
    '**/*.md',
    '.claude/**',
    '.gemini/**',
    '.opencode/**',
  ],
}, {
  // دمج إضافة JSDoc هنا
  plugins: {
    jsdoc,
  },
  rules: {
    // Custom rules can be added here

    // 1. فرض كتابة JSDoc للعناصر المُصدرة (Exported) فقط
    'jsdoc/require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: true,
        ArrowFunctionExpression: true,
        FunctionExpression: true,
        ClassDeclaration: true,
        MethodDefinition: true,
      },
      publicOnly: true, // تطبيق القاعدة على الأكواد المتاحة للاستخدام الخارجي فقط
    }],

    // 2. فرض وجود وصف (Description) في التوثيق
    'jsdoc/require-description': 'warn',

    // 3. إيقاف طلب تحديد الأنواع (Types) لأن TypeScript يقوم بهذه المهمة
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns-type': 'off',
  },
})
