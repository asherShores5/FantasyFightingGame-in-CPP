// Terminal renderer (spec §8). The ONLY module that touches the DOM. Handles typewriter
// printing with a queue, fast-forward on keypress, scrollback, the prompt/input line, command
// history, and an awaitable input() the game loop drives. Rendering is decoupled from logic.

const SPEEDS = { slow: 28, normal: 12, fast: 4, instant: 0 }; // ms per char

export class Terminal {
  constructor(root, { speed = 'normal' } = {}) {
    this.root = root;
    this.output = root.querySelector('[data-output]');
    this.inputEl = root.querySelector('[data-input]');
    this.promptEl = root.querySelector('[data-prompt]');
    this.speedMs = SPEEDS[speed] ?? SPEEDS.normal;

    this.printing = false;
    this.fastForward = false;
    this.history = [];
    this.historyIdx = -1;
    this._inputResolver = null;

    this._wireInput();
  }

  setSpeed(speed) {
    this.speedMs = SPEEDS[speed] ?? this.speedMs;
  }

  // ---- printing --------------------------------------------------------------

  // Print one or more lines (string | string[]) with the typewriter effect.
  async print(lines, cls = '') {
    const arr = Array.isArray(lines) ? lines : [lines];
    for (const line of arr) {
      await this._typeLine(String(line), cls);
    }
  }

  // Print instantly (no typewriter) — used for HUD blocks and menus that should snap in.
  printInstant(lines, cls = '') {
    const arr = Array.isArray(lines) ? lines : [lines];
    for (const line of arr) {
      const div = document.createElement('div');
      div.className = `line ${cls}`.trim();
      div.textContent = line === '' ? ' ' : line;
      this.output.appendChild(div);
    }
    this._scroll();
  }

  async _typeLine(text, cls) {
    const div = document.createElement('div');
    div.className = `line ${cls}`.trim();
    this.output.appendChild(div);

    if (this.speedMs === 0) {
      div.textContent = text === '' ? ' ' : text;
      this._scroll();
      return;
    }
    if (text === '') {
      div.innerHTML = ' ';
      this._scroll();
      return;
    }

    this.printing = true;
    for (let i = 0; i < text.length; i++) {
      div.textContent = text.slice(0, i + 1);
      this._scroll();
      if (this.fastForward) {
        div.textContent = text;
        break;
      }
      await this._sleep(this.speedMs);
    }
    this.printing = false;
    this.fastForward = false;
  }

  _sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  _scroll() {
    this.output.scrollTop = this.output.scrollHeight;
  }

  clear() {
    this.output.innerHTML = '';
  }

  // ---- input -----------------------------------------------------------------

  // Awaitable: resolves with the user's typed/entered line.
  input(promptText = 'elaria>') {
    this.promptEl.textContent = promptText;
    this.inputEl.disabled = false;
    this.inputEl.focus();
    return new Promise((resolve) => {
      this._inputResolver = resolve;
    });
  }

  _wireInput() {
    this.inputEl.addEventListener('keydown', (e) => {
      // Fast-forward an in-progress print with any key.
      if (this.printing) {
        this.fastForward = true;
        return;
      }
      if (e.key === 'Enter') {
        const value = this.inputEl.value.trim();
        this._echo(value);
        if (value) {
          this.history.push(value);
          this.historyIdx = this.history.length;
        }
        this.inputEl.value = '';
        const resolve = this._inputResolver;
        this._inputResolver = null;
        if (resolve) resolve(value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.history.length && this.historyIdx > 0) {
          this.historyIdx -= 1;
          this.inputEl.value = this.history[this.historyIdx];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIdx < this.history.length - 1) {
          this.historyIdx += 1;
          this.inputEl.value = this.history[this.historyIdx];
        } else {
          this.historyIdx = this.history.length;
          this.inputEl.value = '';
        }
      }
    });

    // Keep focus on the input when clicking anywhere on the screen.
    this.root.addEventListener('click', () => {
      if (!this.inputEl.disabled) this.inputEl.focus();
    });
  }

  _echo(value) {
    const div = document.createElement('div');
    div.className = 'line echo';
    div.textContent = `${this.promptEl.textContent} ${value}`;
    this.output.appendChild(div);
    this._scroll();
  }
}
