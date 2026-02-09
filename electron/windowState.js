const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const stateFile = path.join(app.getPath('userData'), 'window-state.json');

const defaultState = {
  width: 1280,
  height: 720,
  x: undefined,
  y: undefined,
  isFullScreen: true,
  isMaximized: false
};

function loadWindowState() {
  try {
    if (fs.existsSync(stateFile)) {
      const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      return { ...defaultState, ...data };
    }
  } catch (e) {
    // Ignore errors, use defaults
  }
  return { ...defaultState };
}

function saveWindowState(win) {
  if (!win) return;

  const state = {
    isFullScreen: win.isFullScreen(),
    isMaximized: win.isMaximized(),
  };

  // Only save bounds if not fullscreen/maximized
  if (!state.isFullScreen && !state.isMaximized) {
    const bounds = win.getBounds();
    state.width = bounds.width;
    state.height = bounds.height;
    state.x = bounds.x;
    state.y = bounds.y;
  }

  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch (e) {
    // Ignore write errors
  }
}

module.exports = { loadWindowState, saveWindowState, defaultState };
