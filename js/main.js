import { App } from './app.js';
import { Router } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  const router = new Router();

  router.addRoute('editor', 'editor');
  router.addRoute('ai-chat', 'ai-chat');
  router.addRoute('templates', 'templates');
  router.addRoute('library', 'library');
  router.addRoute('settings', 'settings');

  app.router = router;
  app.init();

  if (!window.location.hash) window.location.hash = 'editor';
  router.resolve();

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate(item.dataset.page);
      document.getElementById('sidebar')?.classList.remove('open');
    });
  });

  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });
  }
  document.getElementById('closeSidebar')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
  });

  document.getElementById('runAIbtn')?.addEventListener('click', () => {
    const code = document.getElementById('codeEditor')?.value;
    if (code) {
      document.getElementById('chatInput').value = 'Improve this Luau script and add comments:\n\n```luau\n' + code + '\n```';
    }
    router.navigate('ai-chat');
    setTimeout(() => document.getElementById('chatInput')?.focus(), 300);
  });

  document.getElementById('downloadBtn')?.addEventListener('click', () => {
    const code = document.getElementById('codeEditor')?.value;
    const name = document.getElementById('fileName')?.textContent || 'script.luau';
    if (!code) return;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    a.click(); URL.revokeObjectURL(url);
    app.showToast('⬇ Downloaded: ' + name);
  });

  document.getElementById('copyBtn')?.addEventListener('click', () => {
    const code = document.getElementById('codeEditor')?.value;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      app.showToast('📋 Copied to clipboard');
    });
  });

  document.getElementById('insertToEditorBtn')?.addEventListener('click', () => {
    const code = document.getElementById('previewContent')?.textContent;
    if (!code || code.startsWith('-- AI-generated')) return;
    document.getElementById('codeEditor').value = code;
    document.getElementById('lineNumbers').textContent = Array.from({length: code.split('\n').length}, (_, i) => i + 1).join('\n');
    app.saveScript('AI_Generated_' + Date.now(), code);
    app.showToast('📝 Script inserted to editor');
  });

  document.getElementById('copyScriptBtn')?.addEventListener('click', () => {
    const code = document.getElementById('previewContent')?.textContent;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      app.showToast('📋 Script copied');
    });
  });

  document.getElementById('clearPreviewBtn')?.addEventListener('click', () => {
    document.getElementById('previewContent').textContent = '-- AI-generated script will appear here\n-- Describe what you want in the chat';
  });

  document.getElementById('clearLibBtn')?.addEventListener('click', () => {
    if (confirm('Clear all saved scripts?')) {
      app.scripts = [];
      localStorage.setItem('luauScripts', '[]');
      app.renderLibrary();
      app.showToast('🗑 Library cleared');
    }
  });

  document.getElementById('formatBtn')?.addEventListener('click', () => {
    const editor = document.getElementById('codeEditor');
    if (!editor) return;
    let code = editor.value;
    code = code.replace(/\t/g, '    ');
    code = code.replace(/\s+$/, '');
    editor.value = code;
    document.getElementById('lineNumbers').textContent = Array.from({length: code.split('\n').length}, (_, i) => i + 1).join('\n');
    app.showToast('✨ Formatted');
  });

  document.getElementById('modelSelect')?.addEventListener('change', function() {
    app.model = this.value;
  });

  document.getElementById('apiKeyInput')?.addEventListener('change', function() {
    app.apiKey = this.value;
  });
});
