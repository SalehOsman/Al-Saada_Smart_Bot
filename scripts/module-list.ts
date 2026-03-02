import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const modulesDir = path.join(process.cwd(), 'modules');
  
  if (!fs.existsSync(modulesDir)) {
    console.log('No modules directory found.');
    return;
  }

  const moduleFolders = fs.readdirSync(modulesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (moduleFolders.length === 0) {
    console.log('No modules found in modules/ directory.');
    return;
  }

  console.log(`\nDiscovered ${moduleFolders.length} module(s):\n`);

  const results = [];

  for (const folder of moduleFolders) {
    const configPath = path.join(modulesDir, folder, 'config.ts');
    const status = {
      slug: folder,
      name: '-',
      section: '-',
      icon: '-',
      status: '❌ Missing config.ts'
    };

    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        
        const nameMatch = content.match(/name:\s*['"](.+?)['"]/);
        const sectionMatch = content.match(/sectionSlug:\s*['"](.+?)['"]/);
        const iconMatch = content.match(/icon:\s*['"](.+?)['"]/);

        status.name = nameMatch ? nameMatch[1] : 'Unknown';
        status.section = sectionMatch ? sectionMatch[1] : 'Unknown';
        status.icon = iconMatch ? iconMatch[1] : '-';
        status.status = '✅ Found';
      } catch (error: any) {
        status.status = `❌ Error: ${error.message}`;
      }
    }

    results.push(status);
  }

  console.table(results);
}

main();
