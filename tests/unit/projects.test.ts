import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { PROJECT_GROUPS, PROJECTS } from '@/content/profile';
import { needsVpn } from '@/lib/projects';

describe('правило про VPN', () => {
  it('пометка ровно у mindforge и fizkulture', () => {
    expect(PROJECTS.filter((p) => needsVpn(p.url)).map((p) => p.id)).toEqual([
      'mindforge',
      'fizkulture',
    ]);
  });

  it('смотрит на домен, а не на подстроку адреса', () => {
    expect(needsVpn('https://demo.vercel.app/lesson')).toBe(true);
    expect(needsVpn('https://vercel.app/')).toBe(false);
    expect(needsVpn('https://demo.vercel.app.example.com/')).toBe(false);
    expect(needsVpn('https://example.com/demo.vercel.app')).toBe(false);
  });
});

describe('список проектов', () => {
  it('шесть проектов, id не повторяются и годятся для якоря', () => {
    const ids = PROJECTS.map((p) => p.id);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z-]*$/);
  });

  it('адреса и репозитории по https', () => {
    for (const { url, repo } of PROJECTS) {
      expect(new URL(url).protocol).toBe('https:');
      if (repo) expect(new URL(repo).protocol).toBe('https:');
    }
  });

  it('ссылки «Код» нет только у приватных mindforge и fizkulture', () => {
    expect(PROJECTS.filter((p) => !p.repo).map((p) => p.id)).toEqual(['mindforge', 'fizkulture']);
  });

  it('в каждой группе есть проект, у каждого есть презентация и стек', () => {
    for (const group of PROJECT_GROUPS) {
      expect(PROJECTS.some((p) => p.group === group)).toBe(true);
    }
    for (const { about, stack } of PROJECTS) {
      expect(about.length).toBeGreaterThan(0);
      expect(stack.length).toBeGreaterThan(0);
    }
  });

  it('у каждого есть строка анонса, alt скрина и сам файл скрина', () => {
    for (const { id, headline, shot } of PROJECTS) {
      expect(headline.length).toBeGreaterThan(0);
      expect(shot.length).toBeGreaterThan(0);
      expect(existsSync(`src/assets/projects/${id}.webp`)).toBe(true);
    }
  });

  it('llms.txt называет каждый проект и его адрес', () => {
    const llms = readFileSync('public/llms.txt', 'utf8');
    for (const { title, url, repo } of PROJECTS) {
      expect(llms).toContain(title);
      expect(llms).toContain(url);
      if (repo) expect(llms).toContain(repo);
    }
  });
});
