import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import inquirer from 'inquirer';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

async function main() {
  const slugArg = process.argv[2];
  
  const { slug } = await inquirer.prompt([
    {
      type: 'input',
      name: 'slug',
      message: 'Enter module slug (lowercase, hyphen-separated):',
      default: slugArg,
      validate: (input) => {
        if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input)) return true;
        return 'Invalid slug format. Must be lowercase, hyphen-separated (e.g., "fuel-entry").';
      }
    }
  ]);

  const moduleDir = path.join(process.cwd(), 'modules', slug);
  if (fs.existsSync(moduleDir)) {
    console.error(`Error: Module directory already exists at ${moduleDir}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  
  try {
    const { name, nameEn, sectionSlug, icon, includeEdit, includeHooks } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter Arabic display name (i18n key):',
        default: `${slug}-name`
      },
      {
        type: 'input',
        name: 'nameEn',
        message: 'Enter English display name (i18n key):',
        default: `${slug}-name-en`
      },
      {
        type: 'input',
        name: 'sectionSlug',
        message: 'Enter section slug (e.g., "operations"):',
        validate: async (input) => {
          const section = await prisma.section.findUnique({ where: { slug: input } });
          if (section) return true;
          return `Section "${input}" not found in database. Please ensure the section exists first.`;
        }
      },
      {
        type: 'input',
        name: 'icon',
        message: 'Enter emoji icon:',
        default: '📦'
      },
      {
        type: 'confirm',
        name: 'includeEdit',
        message: 'Include edit flow?',
        default: false
      },
      {
        type: 'confirm',
        name: 'includeHooks',
        message: 'Include lifecycle hooks?',
        default: false
      }
    ]);

    console.log(`Scaffolding module "${slug}"...`);

    // Create directories
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.mkdirSync(path.join(moduleDir, 'locales'), { recursive: true });
    fs.mkdirSync(path.join(moduleDir, 'tests'), { recursive: true });

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
`;
    fs.writeFileSync(path.join(moduleDir, 'config.ts'), configTemplate);

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
`;
    fs.writeFileSync(path.join(moduleDir, 'add.conversation.ts'), addConvTemplate);

    // 3. edit.conversation.ts
    if (includeEdit) {
      const editConvTemplate = `import { Conversation } from '@grammyjs/conversations';
import { BotContext, validate, confirm, save } from '@al-saada/module-kit';

export async function edit${slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Conversation(conversation: Conversation<BotContext>, ctx: BotContext) {
  await ctx.reply('Edit conversation for ${slug} initiated.');
}
`;
      fs.writeFileSync(path.join(moduleDir, 'edit.conversation.ts'), editConvTemplate);
    }

    // 4. hooks.ts
    if (includeHooks) {
      const hooksTemplate = `export async function onModuleLoad() {
  // Logic to run when module is loaded
}
`;
      fs.writeFileSync(path.join(moduleDir, 'hooks.ts'), hooksTemplate);
    }

    // 5. schema.prisma
    const schemaTemplate = `// ${slug} module schema
// model ${slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')} {
//   id        String   @id @default(cuid())
//   createdAt DateTime @default(now())
// }
`;
    fs.writeFileSync(path.join(moduleDir, 'schema.prisma'), schemaTemplate);

    // 6. locales
    fs.writeFileSync(path.join(moduleDir, 'locales', 'ar.ftl'), `# ${slug} Arabic translations\n${slug}-name = ${name}\n`);
    fs.writeFileSync(path.join(moduleDir, 'locales', 'en.ftl'), `# ${slug} English translations\n${slug}-name = ${nameEn}\n`);

    // 7. tests
    const testTemplate = `import { describe, it, expect } from 'vitest';

describe('${slug} flow', () => {
  it('should complete the flow successfully', () => {
    expect(true).toBe(true);
  });
});
`;
    fs.writeFileSync(path.join(moduleDir, 'tests', 'flow.test.ts'), testTemplate);

    // Copy schema to prisma/schema/modules/
    const targetSchemaPath = path.join(process.cwd(), 'prisma', 'schema', 'modules', `${slug}.prisma`);
    fs.copyFileSync(path.join(moduleDir, 'schema.prisma'), targetSchemaPath);

    console.log('Running prisma generate...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log(`\n✅ Module "${slug}" scaffolded successfully at modules/${slug}/`);
    console.log(`🔗 Schema copied to prisma/schema/modules/${slug}.prisma`);

  } catch (error) {
    console.error('Error during scaffolding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
