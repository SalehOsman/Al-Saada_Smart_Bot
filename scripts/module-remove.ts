import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import inquirer from 'inquirer';

async function main() {
  const slugArg = process.argv[2];
  
  if (!slugArg) {
    console.error('Error: Please provide a module slug.');
    process.exit(1);
  }

  const moduleDir = path.join(process.cwd(), 'modules', slugArg);
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema', 'modules', `${slugArg}.prisma`);

  if (!fs.existsSync(moduleDir)) {
    console.error(`Error: Module "${slugArg}" not found at modules/${slugArg}`);
    process.exit(1);
  }

  console.log(`\n⚠️  Removing module "${slugArg}"...`);
  console.log(`📁 Directory: modules/${slugArg}`);
  if (fs.existsSync(schemaPath)) {
    console.log(`🔗 Schema: prisma/schema/modules/${slugArg}.prisma`);
  }

  const { confirmSlug } = await inquirer.prompt([
    {
      type: 'input',
      name: 'confirmSlug',
      message: `To confirm deletion, please type the module slug "${slugArg}":`,
      validate: (input) => {
        if (input === slugArg) return true;
        return `Incorrect slug. Please type "${slugArg}" or press Ctrl+C to cancel.`;
      }
    }
  ]);

  console.log(`\nDeleting module "${slugArg}"...`);

  // Delete module directory
  fs.rmSync(moduleDir, { recursive: true, force: true });

  // Delete schema snippet
  if (fs.existsSync(schemaPath)) {
    fs.unlinkSync(schemaPath);
  }

  console.log('Running prisma generate...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Warning: prisma generate failed. You may need to run it manually.');
  }

  console.log(`\n✅ Module "${slugArg}" removed successfully.`);
  console.log('⚠️  Note: Database tables were NOT dropped. You must manually delete them and run prisma migrate.');
}

main();
