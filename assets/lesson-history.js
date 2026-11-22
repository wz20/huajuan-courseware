// Keep a snapshot at each teaching action. Camera and hover state live in the view.
function createLessonHistory(initialState, reduce) {
  let frames = [structuredClone(initialState)];
  let index = 0;

  function read() {
    return structuredClone(frames[index]);
  }

  function move(step) {
    index = Math.max(0, Math.min(frames.length - 1, index + step));
    return read();
  }

  function act(action) {
    const next = reduce(read(), action);
    // An unavailable action leaves the current frame and its redo path intact.
    if (next === undefined) return read();
    frames = frames.slice(0, index + 1);
    frames.push(structuredClone(next));
    index++;
    return read();
  }

  function reset() {
    frames = frames.slice(0, 1);
    index = 0;
    return read();
  }

  return {
    read, act, back: () => move(-1), forward: () => move(1), reset,
    get canBack() { return index > 0; },
    get canForward() { return index + 1 < frames.length; }
  };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { createLessonHistory };
