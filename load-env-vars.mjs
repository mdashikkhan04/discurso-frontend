import fs from 'fs';
import yaml from 'js-yaml';
import os from 'os';
import { execSync } from 'child_process';

// Path to your apphosting.yaml file
const yamlPath = './apphosting.yaml';

try {
  // Load and parse the YAML file
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const parsedYaml = yaml.load(yamlContent);

  // Ensure the `env` section exists
  if (!parsedYaml.env || !Array.isArray(parsedYaml.env)) {
    console.error('No "env" section found in apphosting.yaml.');
    process.exit(1);
  }

  // Determine the command based on the operating system
  const isWindows = os.platform() === 'win32';

  // Export each variable
  parsedYaml.env.forEach((envVar) => {
    if (envVar.variable && (envVar.value || envVar.secret)) {
      const varName = envVar.variable;
      const varValue = envVar.value || envVar.secret;

      try {
        if (isWindows) {
          // Use "set" command on Windows
          execSync(`set ${varName}=${varValue}`, { stdio: 'inherit' });
        } else {
          // Use "export" command on Unix-like systems
          execSync(`export ${varName}="${varValue}"`, { stdio: 'inherit' });
        }
        //////console.log(`Set ${varName}=${varValue}`);
      } catch (error) {
        console.error(`Failed to set variable ${varName}:`, error.message);
      }
    } else {
      console.warn(`Skipping invalid or missing entry: ${JSON.stringify(envVar)}`);
    }
  });
} catch (err) {
  console.error('Failed to load or parse apphosting.yaml:', err);
  process.exit(1);
}
ro