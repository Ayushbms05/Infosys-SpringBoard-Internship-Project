/**
 * theme.js — Shared AksharGyan Landing Theme Engine
 * Enforces the single unified landing page light theme across the application.
 */

function applyTheme() {
  const root = document.documentElement.style;

  // Single Landing Theme Color Tokens
  root.setProperty('--color-primary', '#6366f1');
  root.setProperty('--color-primary-dark', '#4f46e5');
  root.setProperty('--color-primary-light', '#818cf8');
  root.setProperty('--color-accent', '#10b981');
  root.setProperty('--color-bg-deep', '#f8fafc');
  root.setProperty('--color-bg-surface', '#ffffff');

  if (!document.body.classList.contains('light-theme')) {
    document.body.classList.add('light-theme');
  }

  const darkProps = [
    '--color-text-primary', '--color-text-secondary', '--color-text-muted',
    '--color-bg-card', '--color-bg-card-solid', '--color-bg-card-hover',
    '--color-bg-input', '--color-bg-input-focus', '--color-border',
    '--shadow-card', '--glass-bg', '--glass-border'
  ];
  darkProps.forEach(p => root.removeProperty(p));

  document.body.style.transition = "background-color 0.4s ease, color 0.4s ease";
}

document.addEventListener("DOMContentLoaded", function() {
  applyTheme();
});