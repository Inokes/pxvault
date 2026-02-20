class MarkdownApp {
  constructor() {
    this.content = document.getElementById("markdown-content");
    this.overlay = document.getElementById("rofi-overlay");
    this.searchInput = document.getElementById("rofi-search");
    this.resultsList = document.getElementById("rofi-results");
    this.openButton = document.getElementById("rofi-open");
    this.loadingScreen = document.getElementById("loading-screen");

    this.profilePic = document.getElementById("profile-pic");
    this.profileMenu = document.getElementById("profile-menu");

    this.indexPath = "md/index.json";
    this.cache = new Map();
    this.posts = [];
    this.filtered = [];
    this.selectedIndex = 0;
  }

  async init() {
    this.setupFade();
    this.setupProfile();
    this.setupRofi();
    this.posts = await this.loadIndex();
    await this.preloadNormalPosts(this.posts);
    await this.preloadSpecial();
    this.hideLoader();
  }

  setupFade() {
    window.addEventListener("load", () => {
      document.body.classList.add("fade-loaded");
    });
  }

  setupProfile() {
    this.profilePic.addEventListener("click", () => {
      this.profileMenu.classList.toggle("active");
    });

    this.profileMenu.addEventListener("click", e => {
      const route = e.target.dataset.route;
      if (!route) return;

      if (route === "home") {
        location.reload();
      } else {
        this.loadSpecial(route);
      }
    });
  }

  setupRofi() {
    this.openButton.addEventListener("click", () => this.openMenu());
    this.searchInput.addEventListener("input", () => this.filterPosts());
    document.addEventListener("keydown", e => this.handleKeys(e));
  }

  async loadIndex() {
    const res = await fetch(this.indexPath);
    return await res.json();
  }

  async preloadNormalPosts(posts) {
    await Promise.all(posts.map(async post => {
      const res = await fetch(`md/${post.file}`);
      const text = await res.text();
      this.cache.set(post.file, text);
    }));
  }

  async preloadSpecial() {
    const files = ["about.md", "contact.md", "interests.md"];
    await Promise.all(files.map(async file => {
      const res = await fetch(`md/special/${file}`);
      const text = await res.text();
      this.cache.set(file, text);
    }));
  }

  openMenu() {
    this.overlay.classList.remove("rofi-hidden");
    this.searchInput.focus();
    this.filtered = this.posts;
    this.renderResults();
  }

  closeMenu() {
    this.overlay.classList.add("rofi-hidden");
    this.searchInput.value = "";
  }

  filterPosts() {
    const q = this.searchInput.value.toLowerCase();
    this.filtered = this.posts.filter(p =>
      p.title.toLowerCase().includes(q)
    );
    this.selectedIndex = 0;
    this.renderResults();
  }

  renderResults() {
    this.resultsList.innerHTML = "";
    this.filtered.forEach((post, i) => {
      const li = document.createElement("li");
      li.textContent = post.title;
      if (i === this.selectedIndex) li.classList.add("active");
      li.onclick = () => {
        this.loadPost(post.file);
        this.closeMenu();
      };
      this.resultsList.appendChild(li);
    });
  }

  handleKeys(e) {
    if (this.overlay.classList.contains("rofi-hidden")) return;

    if (e.key === "Escape") this.closeMenu();
    if (e.key === "ArrowDown") {
      this.selectedIndex = (this.selectedIndex + 1) % this.filtered.length;
      this.renderResults();
    }
    if (e.key === "ArrowUp") {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.filtered.length) %
        this.filtered.length;
      this.renderResults();
    }
    if (e.key === "Enter") {
      const post = this.filtered[this.selectedIndex];
      if (post) {
        this.loadPost(post.file);
        this.closeMenu();
      }
    }
  }

  loadPost(file) {
    const md = this.cache.get(file);
    this.content.innerHTML = marked.parse(md);
    window.scrollTo({ top: 0 });
  }

  loadSpecial(name) {
    const file = `${name}.md`;
    const md = this.cache.get(file);
    if (!md) return;
    this.content.innerHTML = marked.parse(md);
    window.scrollTo({ top: 0 });
  }

  hideLoader() {
    this.loadingScreen.classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new MarkdownApp().init();
});