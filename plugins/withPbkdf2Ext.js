const { withProjectBuildGradle } = require('expo/config-plugins');

const COMPILE_SDK = 35;
const BUILD_TOOLS = '35.0.0';

function ensurePbkdf2ExtProps(gradleContents) {
  const compileLine = `set('Pbkdf2_compileSdkVersion', ${COMPILE_SDK})`;
  const toolsLine = `set('Pbkdf2_buildToolsVersion', '${BUILD_TOOLS}')`;

  let contents = gradleContents;

  // Replace existing lines anywhere
  contents = contents.replace(/set\(['"]Pbkdf2_compileSdkVersion['"],\s*[^\)]+\)/g, compileLine);
  contents = contents.replace(/set\(['"]Pbkdf2_buildToolsVersion['"],\s*[^\)]+\)/g, toolsLine);

  const hasCompile = /Pbkdf2_compileSdkVersion/.test(contents);
  const hasTools = /Pbkdf2_buildToolsVersion/.test(contents);
  const hasExtBlock = /(^|\n)ext\s*\{[\s\S]*?\n\}/m.test(contents);

  if (hasExtBlock) {
    if (!hasCompile) {
      contents = contents.replace(/ext\s*\{/, (m) => `${m}\n    ${compileLine}`);
    }
    if (!hasTools) {
      contents = contents.replace(/ext\s*\{/, (m) => `${m}\n    ${toolsLine}`);
    }
  } else {
    const extBlock = [
      'ext {',
      `    ${compileLine}`,
      `    ${toolsLine}`,
      '}',
      '',
    ].join('\n');
    contents = `${contents}\n${extBlock}`;
  }

  return contents;
}

const withPbkdf2Ext = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const original = config.modResults.contents;
    config.modResults.contents = ensurePbkdf2ExtProps(original);
    return config;
  });
};

module.exports = withPbkdf2Ext;


