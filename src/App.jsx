/**
 * @fileoverview App — root component.
 *
 * Manages:
 *  - light / dark theme (persisted in localStorage)
 *  - active mode: 'demo' | 'quiz'
 */

import { useState, useEffect } from 'react';
import DemoMode from './components/DemoMode.jsx';
import QuizMode from './components/QuizMode.jsx';

/** Read stored theme or default to system preference */
function getInitialTheme() {
  const stored = localStorage.getItem('fde-theme');
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [mode,  setMode]  = useState('demo'); // 'demo' | 'quiz'

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fde-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => t === 'light' ? 'dark' : 'light');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-header__title">
          <span>Fetch</span> — Decode — Execute Cycle
        </h1>

        <div className="app-header__controls">
          {/* Mode tabs */}
          <nav className="mode-tabs" role="tablist" aria-label="Application mode">
            <button
              role="tab"
              aria-selected={mode === 'demo'}
              className={`mode-tab ${mode === 'demo' ? 'mode-tab--active' : ''}`}
              onClick={() => setMode('demo')}
            >
              Demo
            </button>
            <button
              role="tab"
              aria-selected={mode === 'quiz'}
              className={`mode-tab tab--quiz ${mode === 'quiz' ? 'mode-tab--active' : ''}`}
              onClick={() => setMode('quiz')}
            >
              Quiz
            </button>
          </nav>

          {/* Theme toggle */}
          <label className="theme-toggle" aria-label="Toggle dark mode">
            ☀
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={toggleTheme}
              aria-label="Dark mode"
            />
            🌙
          </label>
        </div>
      </header>

      <main className="app-main">
        {mode === 'demo'
          ? <DemoMode  onSwitchToQuiz={() => setMode('quiz')} />
          : <QuizMode  onSwitchToDemo={() => setMode('demo')} />
        }
      </main>
    </div>
  );
}
