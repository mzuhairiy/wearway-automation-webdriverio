import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ConfigParser } from '@wdio/config/node';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRoot } from '../config/environment.js';

for (const platform of ['android', 'ios']) {
  const parser = new ConfigParser(resolve(projectRoot, `config/wdio.${platform}.conf.ts`), {});
  await parser.initialize();
  const configuration = parser.getConfig();
  const capabilities = parser.getCapabilities();
  assert(Array.isArray(capabilities) && capabilities.length === 1);
  const capability = capabilities[0];
  assert(capability && 'appium:automationName' in capability);
  assert.equal(capability['appium:automationName'], 'Flutter');
  assert.equal(configuration.maxInstances, 1);
  for (const suite of ['smoke', 'navigation', 'authentication', 'diagnostics']) {
    const suiteParser = new ConfigParser(resolve(projectRoot, `config/wdio.${platform}.conf.ts`), { suite: [suite] });
    await suiteParser.initialize();
    const specs = suiteParser.getSpecs();
    assert(specs.length > 0, `${platform}/${suite} has no specs`);
    assert(specs.flat().every((spec) => existsSync(spec.startsWith('file:') ? fileURLToPath(spec) : spec)));
  }
  console.log(`PASS ${platform}: WDIO parser, capabilities and suite paths (no device session)`);
}
