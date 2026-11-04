import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReactOverlay } from './react/ReactOverlay';
import { startOfficeApp } from './three/OfficeApp';

const gameContainer = document.getElementById('game-container');
if (gameContainer) {
  gameContainer.style.position = 'absolute';
  gameContainer.style.inset = '0';
  gameContainer.style.overflow = 'hidden';
  startOfficeApp(gameContainer).catch((err) => {
    console.error('[PRIM8] Failed to start 3D office', err);
  });
}

const uiRoot = document.getElementById('ui-overlay');
if (uiRoot) {
  ReactDOM.createRoot(uiRoot).render(
    <React.StrictMode>
      <ReactOverlay />
    </React.StrictMode>,
  );
}
