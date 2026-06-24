export class Router {
  constructor() {
    this.routes = {};
    this.currentPage = 'editor';
    window.addEventListener('hashchange', () => this.resolve());
  }
  addRoute(hash, pageId) { this.routes[hash] = pageId; }
  navigate(hash) { window.location.hash = hash; }
  resolve() {
    const hash = window.location.hash.slice(1) || 'editor';
    const pageId = this.routes[hash] || 'editor';
    this.showPage(pageId);
    this.currentPage = pageId;
  }
  showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const nav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (nav) nav.classList.add('active');
  }
}
