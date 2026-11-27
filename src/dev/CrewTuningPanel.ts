import { CREW_ARCHETYPES } from '../entities/CharacterCatalog';
import {
  ART_FIELDS,
  MOVEMENT_FIELDS,
  ROOM_FIELDS,
  WALL_FIELDS,
  getDefaultCrewTuning,
  readCrewTuning,
  type CrewMember,
  type CrewTuning,
  type NumberField,
} from './CrewTuning';
import './crewTuning.css';

interface TuningPanelActions {
  readonly gravity: number;
  apply(tuning: CrewTuning): void;
  restart(): void;
  setEditing(editing: boolean): void;
  resize(): void;
}

const MEMBER_NAMES: Record<CrewMember, string> = {
  pilot: 'Pilot',
  brute: 'Brute',
  tinkerer: 'Tinkerer',
};

export function mountCrewTuningPanel(actions: TuningPanelActions): () => void {
  const defaults = getDefaultCrewTuning(actions.gravity);
  let tuning = defaults;
  let member: CrewMember = 'pilot';
  let page = 'movement';

  const panel = document.createElement('aside');
  panel.id = 'crew-tuning';
  panel.className = 'crew-tuning';
  panel.setAttribute('aria-labelledby', 'crew-tuning-title');

  const title = document.createElement('h1');
  title.id = 'crew-tuning-title';
  title.textContent = 'Crew Tuning';
  const note = document.createElement('p');
  note.textContent =
    'Edits apply live in this tab. Save a preset to share your settings.';

  const status = document.createElement('p');
  status.className = 'crew-tuning-status';
  status.setAttribute('role', 'status');

  function apply(next: CrewTuning, message = 'Applied') {
    actions.apply(next);
    tuning = next;
    status.textContent = message;
  }

  const memberSelect = document.createElement('select');
  for (const id of CREW_ARCHETYPES) {
    memberSelect.add(new Option(MEMBER_NAMES[id], id));
  }
  memberSelect.addEventListener('change', () => {
    member = CREW_ARCHETYPES[memberSelect.selectedIndex] ?? 'pilot';
    renderFields();
  });
  const pageSelect = document.createElement('select');
  pageSelect.add(new Option('Movement', 'movement'));
  pageSelect.add(new Option('Animation & alignment', 'animation'));
  pageSelect.add(new Option('Room & mechanisms', 'room'));
  pageSelect.addEventListener('change', () => {
    page = pageSelect.value;
    renderFields();
  });

  const memberControl = labeled('Character', memberSelect);
  const filters = document.createElement('div');
  filters.className = 'crew-tuning-filters';
  filters.append(labeled('Settings', pageSelect), memberControl);

  const fields = document.createElement('div');
  fields.className = 'crew-tuning-fields';

  function renderFields() {
    fields.replaceChildren();
    memberControl.hidden = page === 'room';
    if (page === 'room') {
      fields.append(
        settingsGroup('Room & mechanisms', tuning.room, ROOM_FIELDS, (room) => {
          apply({ ...tuning, room });
        }),
      );
      return;
    }
    if (page === 'animation') {
      const artMember = member;
      const pose = tuning.art[artMember];
      if (pose === undefined) {
        const hint = document.createElement('p');
        hint.textContent = `${MEMBER_NAMES[artMember]} uses placeholder art in this lab.`;
        fields.append(hint);
      } else {
        fields.append(
          settingsGroup('Sprite', pose, ART_FIELDS, (art) => {
            apply({ ...tuning, art: { ...tuning.art, [artMember]: art } });
          }),
        );
      }
      return;
    }
    const moveMember = member;
    const movement = tuning.movement[moveMember];
    fields.append(
      settingsGroup('Movement', movement, MOVEMENT_FIELDS, (values) => {
        apply({
          ...tuning,
          movement: {
            ...tuning.movement,
            [moveMember]: {
              ...tuning.movement[moveMember],
              ...values,
              wallMovement: tuning.movement[moveMember].wallMovement,
            },
          },
        });
      }),
    );
    if (movement.wallMovement !== undefined) {
      fields.append(
        settingsGroup(
          'Wall movement',
          movement.wallMovement,
          WALL_FIELDS,
          (wallMovement) => {
            apply({
              ...tuning,
              movement: {
                ...tuning.movement,
                [moveMember]: { ...tuning.movement[moveMember], wallMovement },
              },
            });
          },
        ),
      );
    }
  }

  const loadInput = document.createElement('input');
  loadInput.type = 'file';
  loadInput.accept = 'application/json,.json';
  loadInput.hidden = true;
  loadInput.addEventListener('change', async () => {
    const file = loadInput.files?.[0];
    loadInput.value = '';
    if (file === undefined) return;
    try {
      const next = readCrewTuning(await file.text(), defaults);
      apply(next, 'Preset loaded');
      renderFields();
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : 'Could not load preset';
    }
  });

  const actionsRow = document.createElement('div');
  actionsRow.className = 'crew-tuning-actions';
  actionsRow.append(
    button('Restart room', () => {
      actions.restart();
      focusGame();
      status.textContent = 'Room restarted with current settings';
    }),
    button('Restore defaults', () => {
      apply(defaults, 'Defaults restored');
      renderFields();
    }),
    button('Save preset', () => {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(tuning, null, 2) + '\n'], {
          type: 'application/json',
        }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'crew-abilities-tuning.json';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = 'Preset downloaded';
    }),
    button('Load preset', () => loadInput.click()),
    loadInput,
  );

  function focusGame() {
    const canvas = document.querySelector('#game canvas');
    if (canvas instanceof HTMLCanvasElement) {
      canvas.tabIndex = -1;
      canvas.focus();
    }
  }

  const toggle = button('Tuning panel', () => setOpen(panel.hidden));
  toggle.setAttribute('aria-controls', panel.id);

  function setOpen(open: boolean) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('crew-tuning-open', open);
    actions.resize();
    if (!open) focusGame();
  }

  panel.addEventListener('focusin', () => actions.setEditing(true));
  panel.addEventListener('focusout', (event) => {
    if (
      !(event.relatedTarget instanceof Node) ||
      !panel.contains(event.relatedTarget)
    ) {
      actions.setEditing(false);
    }
  });

  const heading = document.createElement('div');
  heading.className = 'crew-tuning-heading';
  heading.append(
    title,
    button('Hide', () => setOpen(false)),
  );
  panel.append(heading, note, filters, fields, actionsRow, status);
  renderFields();
  document.querySelector('#lab-nav')?.append(toggle);
  document.body.append(panel);
  setOpen(true);

  return () => {
    actions.setEditing(false);
    document.body.classList.remove('crew-tuning-open');
    panel.remove();
    toggle.remove();
  };
}

function settingsGroup<T extends object>(
  title: string,
  values: T,
  definitions: readonly NumberField<T>[],
  update: (values: T) => void,
): HTMLFieldSetElement {
  const group = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = title;
  group.append(legend);
  let current = values;
  for (const { key, label, min, max, step } of definitions) {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(values[key]);
    input.addEventListener('change', () => {
      const value = input.valueAsNumber;
      if (!Number.isFinite(value) || value < min || value > max) {
        input.value = String(current[key]);
        return;
      }
      current = { ...current, [key]: value };
      update(current);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        input.blur();
      }
    });
    group.append(labeled(label, input));
  }
  return group;
}

function labeled(title: string, control: HTMLElement): HTMLLabelElement {
  const label = document.createElement('label');
  const caption = document.createElement('span');
  caption.textContent = title;
  control.setAttribute('aria-label', title);
  label.append(caption, control);
  return label;
}

function button(title: string, action: () => void): HTMLButtonElement {
  const result = document.createElement('button');
  result.type = 'button';
  result.textContent = title;
  result.addEventListener('click', action);
  return result;
}
