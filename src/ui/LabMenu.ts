import { getLabEntries } from '../levels/LevelCatalog';

export function showLabMenu(container: HTMLElement): void {
  container.setAttribute('aria-labelledby', 'lab-menu-title');
  container.classList.add('lab-menu');

  const title = document.createElement('h1');
  title.id = 'lab-menu-title';
  title.textContent = 'Puzzle Platformer';

  const intro = document.createElement('p');
  intro.textContent = 'Choose a play lab.';

  const list = document.createElement('ul');
  list.className = 'lab-list';
  for (const { id, name } of getLabEntries()) {
    const params: Record<string, string> = { level: id };
    if (id === 'relay-station') {
      params.scoutArt = '1';
      params.bruteArt = '1';
    }
    list.append(labLink(name, params));
  }
  list.append(
    labLink('Scout Animation Preview', {
      level: 'scout-brute-ranger-lab',
      scoutArt: '1',
    }),
    labLink('Brute Animation Preview', {
      level: 'scout-brute-ranger-lab',
      scoutArt: '1',
      bruteArt: '1',
    }),
  );

  container.replaceChildren(title, intro, list);
}

function labLink(name: string, params: Record<string, string>): HTMLLIElement {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = `?${new URLSearchParams(params)}`;
  link.textContent = name;
  item.append(link);
  return item;
}
