/**
 * @file module-create.ts
 * @module scripts/module-create
 *
 * Developer CLI tool for scaffolding new bot modules.
 * Automates directory creation, configuration generation, and Prisma schema integration.
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import inquirer from 'inquirer'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

/**
 * Main command entry point for module scaffolding.
 * Supports both interactive (prompt-based) and non-interactive modes.
 *
 * @example
 * ```bash
 * npm run module:create my-feature -- --non-interactive --name="My Feature"
 * ```
 */
async function main() {
  // eslint-disable-next-line node/prefer-global/process
  const slugArg = process.argv[2]

  // Support for non-interactive mode via arguments (Issue D1 / Testing)
  // eslint-disable-next-line node/prefer-global/process
  const isNonInteractive = process.argv.includes('--non-interactive')

  let slug = slugArg
  if (!isNonInteractive) {
    const response = await inquirer.prompt([
      {
        type: 'input',
        name: 'slug',
        message: 'Enter module slug (lowercase, hyphen-separated):',
        default: slugArg,
        validate: (input) => {
          if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input))
            return true
          return 'Invalid slug format. Must be lowercase, hyphen-separated (e.g., "fuel-entry").'
        },
      },
    ])
    slug = response.slug
  }
  else if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    console.error('Error: Slug must be provided and valid in non-interactive mode.')
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1)
  }

  // eslint-disable-next-line node/prefer-global/process
  const moduleDir = path.join(process.cwd(), 'modules', slug)
  if (fs.existsSync(moduleDir)) {
    console.error(`Error: Module directory already exists at ${moduleDir}`)
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1)
  }

  const prisma = new PrismaClient()

  try {
    let name, nameEn, sectionSlug, icon, includeEdit, includeHooks

    if (isNonInteractive) {
      // eslint-disable-next-line node/prefer-global/process
      name = process.argv.find(a => a.startsWith('--name='))?.split('=')[1] || `${slug}-name`
      // eslint-disable-next-line node/prefer-global/process
      nameEn = process.argv.find(a => a.startsWith('--nameEn='))?.split('=')[1] || `${slug}-name-en`
      // eslint-disable-next-line node/prefer-global/process
      sectionSlug = process.argv.find(a => a.startsWith('--sectionSlug='))?.split('=')[1] || 'operations'
      // eslint-disable-next-line node/prefer-global/process
      icon = process.argv.find(a => a.startsWith('--icon='))?.split('=')[1] || '📦'
      // eslint-disable-next-line node/prefer-global/process
      includeEdit = process.argv.includes('--includeEdit')
      // eslint-disable-next-line node/prefer-global/process
      includeHooks = process.argv.includes('--includeHooks')
    }
    else {
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter Arabic display name (i18n key):',
          default: `${slug}-name`,
        },
        {
          type: 'input',
          name: 'nameEn',
          message: 'Enter English display name (i18n key):',
          default: `${slug}-name-en`,
        },
        {
          type: 'input',
          name: 'icon',
          message: 'Enter emoji icon:',
          default: '📦',
        },
        {
          type: 'confirm',
          name: 'includeEdit',
          message: 'Include edit flow?',
          default: false,
        },
        {
          type: 'confirm',
          name: 'includeHooks',
          message: 'Include lifecycle hooks?',
          default: false,
        },
      ])
      name = response.name
      nameEn = response.nameEn
      icon = response.icon
      includeEdit = response.includeEdit
      includeHooks = response.includeHooks

      // --- Hierarchical Section Selection (FR-002, FR-003, FR-004) ---
      console.log('\n📂 Selecting Section Hierarchy...')

      // 1. Select Main Section
      const mainSections = await prisma.section.findMany({
        where: { parentId: null },
        orderBy: { name: 'asc' },
      })

      const mainSectionChoices = [
        ...mainSections.map(s => ({ name: `${s.icon} ${s.name} (${s.slug})`, value: s })),
        new inquirer.Separator(),
        { name: '➕ Create New Main Section', value: 'CREATE_NEW' },
      ]

      const { mainSelection } = await inquirer.prompt([
        {
          type: 'list',
          name: 'mainSelection',
          message: 'Choose Main Section:',
          choices: mainSectionChoices,
        },
      ])

      let selectedMainSection
      if (mainSelection === 'CREATE_NEW') {
        selectedMainSection = await createNewSectionPrompt(prisma, null)
      }
      else {
        selectedMainSection = mainSelection
      }

      // 2. Select Sub-section
      const subSections = await prisma.section.findMany({
        where: { parentId: selectedMainSection.id },
        orderBy: { name: 'asc' },
      })

      const subSectionChoices = [
        ...subSections.map(s => ({ name: `${s.icon} ${s.name} (${s.slug})`, value: s })),
        new inquirer.Separator(),
        { name: '➕ Create New Sub-section', value: 'CREATE_NEW' },
        { name: '⏭️ Skip (Place directly in Main Section)', value: 'SKIP' },
      ]

      const { subSelection } = await inquirer.prompt([
        {
          type: 'list',
          name: 'subSelection',
          message: `Choose Sub-section for "${selectedMainSection.name}":`,
          choices: subSectionChoices,
        },
      ])

      let finalSection
      if (subSelection === 'CREATE_NEW') {
        finalSection = await createNewSectionPrompt(prisma, selectedMainSection.id)
      }
      else if (subSelection === 'SKIP') {
        finalSection = selectedMainSection
      }
      else {
        finalSection = subSelection
      }

      sectionSlug = finalSection.slug
      console.log(`✅ Selected section: ${finalSection.icon} ${finalSection.name} (${finalSection.slug})\n`)
    }

    console.log(`Scaffolding module "${slug}"...`)

    // Create directories
    fs.mkdirSync(moduleDir, { recursive: true })
    fs.mkdirSync(path.join(moduleDir, 'locales'), { recursive: true })
    fs.mkdirSync(path.join(moduleDir, 'tests'), { recursive: true })

    // 1. config.ts
    const configTemplate = `import { defineModule } from '@al-saada/module-kit';
import { Role } from '@prisma/client';
import { add${slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Conversation } from './add.conversation.js';
${includeEdit ? `import { edit${slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Conversation } from './edit.conversation.js';` : ''}

export default defineModule({
  slug: '${slug}',
  sectionSlug: '${sectionSlug}',
  name: '${name}',
  nameEn: '${nameEn}',
  icon: '${icon}',
  permissions: {
    view: [Role.ADMIN, Role.EMPLOYEE, Role.SUPER_ADMIN],
    create: [Role.ADMIN, Role.EMPLOYEE],
    edit: [Role.ADMIN],
    delete: [Role.SUPER_ADMIN],
  },
  addEntryPoint: add${slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Conversation,
  ${includeEdit ? `editEntryPoint: edit${slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Conversation,` : ''}
});
`
    fs.writeFileSync(path.join(moduleDir, 'config.ts'), configTemplate)

    // 2. add.conversation.ts
    const addConvTemplate = `import { Conversation } from '@grammyjs/conversations';
import { BotContext, validate, confirm, save } from '@al-saada/module-kit';

export async function add${slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Conversation(conversation: Conversation<BotContext>, ctx: BotContext) {
  const data: any = {};
  
  // Example step:
  // data.amount = await validate(conversation, ctx, {
  //   field: 'amount',
  //   promptKey: '${slug}.prompt.amount',
  //   errorKey: '${slug}.error.amount',
  //   validator: (val) => !isNaN(Number(val)),
  //   formatter: (val) => Number(val),
  // });

  await ctx.reply('Draft conversation for ${slug} initiated.');
}
`
    fs.writeFileSync(path.join(moduleDir, 'add.conversation.ts'), addConvTemplate)

    // 3. edit.conversation.ts
    if (includeEdit) {
      const editConvTemplate = `import { Conversation } from '@grammyjs/conversations';
import { BotContext, validate, confirm, save } from '@al-saada/module-kit';

export async function edit${slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Conversation(conversation: Conversation<BotContext>, ctx: BotContext) {
  await ctx.reply('Edit conversation for ${slug} initiated.');
}
`
      fs.writeFileSync(path.join(moduleDir, 'edit.conversation.ts'), editConvTemplate)
    }

    // 4. hooks.ts
    if (includeHooks) {
      const hooksTemplate = `export async function onModuleLoad() {
  // Logic to run when module is loaded
}
`
      fs.writeFileSync(path.join(moduleDir, 'hooks.ts'), hooksTemplate)
    }

    // 5. schema.prisma
    const schemaTemplate = `// ${slug} module schema
// model ${slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')} {
//   id        String   @id @default(cuid())
//   createdAt DateTime @default(now())
// }
`
    fs.writeFileSync(path.join(moduleDir, 'schema.prisma'), schemaTemplate)

    // 6. locales
    fs.writeFileSync(path.join(moduleDir, 'locales', 'ar.ftl'), `# ${slug} Arabic translations\n${slug}-name = ${name}\n`)
    fs.writeFileSync(path.join(moduleDir, 'locales', 'en.ftl'), `# ${slug} English translations\n${slug}-name = ${nameEn}\n`)

    // 7. tests
    const testTemplate = `import { describe, it, expect } from 'vitest';

describe('${slug} flow', () => {
  it('should complete the flow successfully', () => {
    expect(true).toBe(true);
  });
});
`
    fs.writeFileSync(path.join(moduleDir, 'tests', 'flow.test.ts'), testTemplate)

    // 8. package.json (required for monorepo workspaces)
    const packageJsonTemplate = JSON.stringify({
      name: `@al-saada/module-${slug}`,
      version: '0.0.1',
      private: true,
      type: 'module',
      dependencies: {
        '@al-saada/module-kit': 'workspace:*',
      },
    }, null, 2)
    fs.writeFileSync(path.join(moduleDir, 'package.json'), packageJsonTemplate)

    // Copy schema to prisma/schema/modules/
    // eslint-disable-next-line node/prefer-global/process
    const targetSchemaPath = path.join(process.cwd(), 'prisma', 'schema', 'modules', `${slug}.prisma`)
    fs.copyFileSync(path.join(moduleDir, 'schema.prisma'), targetSchemaPath)

    console.log('Running prisma generate...')
    execSync('npx prisma generate', { stdio: 'inherit' })

    console.log(`\n✅ Module "${slug}" scaffolded successfully at modules/${slug}/`)
    console.log(`🔗 Schema copied to prisma/schema/modules/${slug}.prisma`)
  }
  catch (error) {
    console.error('Error during scaffolding:', error)
  }
  finally {
    await prisma.$disconnect()
  }
}

main()

/**
 * Prompts the developer to create a new section in the database.
 */
async function createNewSectionPrompt(prisma: PrismaClient, parentId: string | null) {
  const type = parentId ? 'Sub-section' : 'Main Section'
  console.log(`\n✨ Creating New ${type}...`)

  const response = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: `Enter ${type} Arabic name (display text):`,
      validate: input => input.length > 0 || 'Name is required.',
    },
    {
      type: 'input',
      name: 'nameEn',
      message: `Enter ${type} English name (display text):`,
      validate: input => input.length > 0 || 'English name is required.',
    },
    {
      type: 'input',
      name: 'slug',
      message: `Enter ${type} slug (lowercase, hyphen-separated):`,
      validate: async (input) => {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input))
          return 'Invalid slug format.'
        const existing = await prisma.section.findUnique({ where: { slug: input } })
        if (existing)
          return `Slug "${input}" is already taken.`
        return true
      },
    },
    {
      type: 'input',
      name: 'icon',
      message: `Enter ${type} emoji icon:`,
      default: parentId ? '🔹' : '📁',
    },
  ])

  const section = await prisma.section.create({
    data: {
      slug: response.slug,
      name: response.name,
      nameEn: response.nameEn,
      icon: response.icon,
      parentId,
      orderIndex: 0,
    },
  })

  console.log(`✅ ${type} "${section.name}" created successfully.`)
  return section
}
