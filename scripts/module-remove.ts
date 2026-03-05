import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import inquirer from 'inquirer'

async function main() {
  // eslint-disable-next-line node/prefer-global/process
  const slugArg = process.argv[2]

  if (!slugArg) {
    console.error('Error: Please provide a module slug.')
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1)
  }

  // eslint-disable-next-line node/prefer-global/process
  const moduleDir = path.join(process.cwd(), 'modules', slugArg)
  // eslint-disable-next-line node/prefer-global/process
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema', 'modules', `${slugArg}.prisma`)

  if (!fs.existsSync(moduleDir)) {
    console.error(`Error: Module "${slugArg}" not found at modules/${slugArg}`)
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1)
  }

  console.log(`\n⚠️  Removing module "${slugArg}"...`)
  console.log(`📁 Directory: modules/${slugArg}`)
  if (fs.existsSync(schemaPath)) {
    console.log(`🔗 Schema: prisma/schema/modules/${slugArg}.prisma`)
  }

  // Ignore value since it is already validated via validate function
  await inquirer.prompt([
    {
      type: 'input',
      name: 'confirmSlug',
      message: `To confirm deletion, please type the module slug "${slugArg}":`,
      validate: (input) => {
        if (input === slugArg)
          return true
        return `Incorrect slug. Please type "${slugArg}" or press Ctrl+C to cancel.`
      },
    },
  ])

  console.log(`\nDeleting module "${slugArg}"...`)

  // Delete module directory
  fs.rmSync(moduleDir, { recursive: true, force: true })

  // Delete schema snippet
  if (fs.existsSync(schemaPath)) {
    fs.unlinkSync(schemaPath)
  }

  console.log('Running prisma generate...')
  try {
    execSync('npx prisma generate', { stdio: 'inherit' })
  }
  catch {
    console.warn('Warning: prisma generate failed. You may need to run it manually.')
  }

  console.log(`\n✅ Module "${slugArg}" removed successfully.`)
  console.log('⚠️  Note: Database tables were NOT dropped. You must manually delete them and run prisma migrate.')
}

main()
