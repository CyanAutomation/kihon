import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = join(__dirname, '../..');
const skillsRoot = join(root, '.agents/skills');
const skillDirectories = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(skillsRoot, entry.name, 'SKILL.md')))
  .map((entry) => entry.name)
  .sort();
const indexPath = join(skillsRoot, 'README.md');

function localMarkdownLinks(markdown: string): string[] {
  return [...markdown.matchAll(/\]\(([^)]+)\)/g)]
    .map((match) => match[1]?.split(/[\s#?]/, 1)[0] ?? '')
    .filter((target) => target.length > 0 && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target));
}

test('skills index links every local skill bundle', () => {
  assert.ok(existsSync(indexPath), 'the skills directory must have a README index');
  const index = readFileSync(indexPath, 'utf8');
  const links = localMarkdownLinks(index);

  for (const directory of skillDirectories) {
    assert.ok(links.includes(`${directory}/SKILL.md`), `the index must link ${directory}/SKILL.md`);
  }
});

test('Kihon skill and index links resolve to repository files', () => {
  const markdownFiles = [indexPath, ...skillDirectories
    .filter((directory) => directory.startsWith('kihon-'))
    .map((directory) => join(skillsRoot, directory, 'SKILL.md'))];

  for (const markdownFile of markdownFiles) {
    const markdown = readFileSync(markdownFile, 'utf8');
    for (const target of localMarkdownLinks(markdown)) {
      assert.ok(existsSync(resolve(dirname(markdownFile), target)), `${markdownFile} links to missing file ${target}`);
    }
  }
});
