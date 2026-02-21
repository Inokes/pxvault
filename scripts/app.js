/* ========================================================= */
/* markdown application */
/* ========================================================= */

class MarkdownApp {
  constructor() {
    /* dom references */
    this.content = document.getElementById("markdown-content");
    this.overlay = document.getElementById("rofi-overlay");
    this.searchInput = document.getElementById("rofi-search");
    this.resultsList = document.getElementById("rofi-results");
    this.openButton = document.getElementById("rofi-open");
    this.loadingScreen = document.getElementById("loading-screen");

    this.profilePic = document.getElementById("profile-pic");
    this.profileMenu = document.getElementById("profile-menu");

    /* state */
    this.indexPath = "md/index.json";
    this.cache = new Map();
    this.posts = [];
    this.filtered = [];
    this.selectedIndex = 0;
  }

  /* --------------------------- */
  /* initialization */
  /* --------------------------- */

  async init() {
    this.setupFade();
    this.setupProfile();
    this.setupRofi();

    this.posts = await this.loadIndex();
    await this.preloadNormalPosts(this.posts);
    await this.preloadSpecial();

    this.hideLoader();
  }

  /* --------------------------- */
  /* ui setup */
  /* --------------------------- */

  setupFade() {
    window.addEventListener("load", () => {
      document.body.classList.add("fade-loaded");
    });
  }

  setupProfile() {
    if (!this.profilePic || !this.profileMenu) return;

    this.profilePic.addEventListener("click", () => {
      this.profileMenu.classList.toggle("active");
    });

    this.profileMenu.addEventListener("click", (e) => {
      const route = e.target.dataset.route;
      if (!route) return;

      if (route === "home") {
        location.reload(); // brute force but reliable
      } else {
        this.loadSpecial(route);
      }
    });
  }

  setupRofi() {
    if (!this.openButton || !this.overlay) return;

    this.openButton.addEventListener("click", () => this.openMenu());
    this.searchInput?.addEventListener("input", () => this.filterPosts());
    document.addEventListener("keydown", (e) => this.handleKeys(e));
  }

  /* --------------------------- */
  /* data loading */
  /* --------------------------- */

  async loadIndex() {
    const res = await fetch(this.indexPath);
    return await res.json();
  }

  async preloadNormalPosts(posts) {
    await Promise.all(
      posts.map(async (post) => {
        const res = await fetch(`md/${post.file}`);
        const text = await res.text();
        this.cache.set(post.file, text);
      })
    );
  }

  async preloadSpecial() {
    const files = ["about.md", "contact.md", "interests.md"];

    await Promise.all(
      files.map(async (file) => {
        const res = await fetch(`md/special/${file}`);
        const text = await res.text();
        this.cache.set(file, text);
      })
    );
  }

  /* --------------------------- */
  /* rofi logic */
  /* --------------------------- */

  openMenu() {
    this.overlay.classList.remove("rofi-hidden");
    this.searchInput?.focus();

    this.filtered = this.posts;
    this.selectedIndex = 0;
    this.renderResults();
  }

  closeMenu() {
    this.overlay.classList.add("rofi-hidden");
    if (this.searchInput) this.searchInput.value = "";
  }

  filterPosts() {
    const q = this.searchInput.value.toLowerCase();

    this.filtered = this.posts.filter((p) =>
      p.title.toLowerCase().includes(q)
    );

    this.selectedIndex = 0;
    this.renderResults();
  }

  renderResults() {
    if (!this.resultsList) return;

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
    if (!this.overlay || this.overlay.classList.contains("rofi-hidden")) return;
    if (!this.filtered.length) return; // prevents modulo by zero nonsense

    if (e.key === "Escape") this.closeMenu();

    if (e.key === "ArrowDown") {
      this.selectedIndex =
        (this.selectedIndex + 1) % this.filtered.length;
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

  /* --------------------------- */
  /* markdown rendering */
  /* --------------------------- */

  loadPost(file) {
    const md = this.cache.get(file);
    if (!md || !this.content) return;

    this.content.innerHTML = marked.parse(md);
    window.scrollTo({ top: 0 });
  }

  loadSpecial(name) {
    const file = `${name}.md`;
    const md = this.cache.get(file);
    if (!md || !this.content) return;

    this.content.innerHTML = marked.parse(md);
    window.scrollTo({ top: 0 });
  }

  /* --------------------------- */
  /* loader */
  /* --------------------------- */

  hideLoader() {
    this.loadingScreen?.classList.add("hidden");
  }
}


/* ========================================================= */
/* review slider */
/* ========================================================= */

class ReviewSlider {
  constructor() {
    this.track = document.getElementById("reviews-track");
    this.slides = document.querySelectorAll(".review");
    this.index = 0;
    this.total = this.slides.length;

    if (!this.track || !this.total) return;

    this.start();
  }

  next() {
    this.index = (this.index + 1) % this.total;
    this.track.style.transform = `translateX(-${this.index * 100}%)`;
  }

  start() {
    setInterval(() => this.next(), 4000);
  }
}


/* ========================================================= */
/* conway's game of life background */
/* ========================================================= */

class GameOfLifeBackground {
  constructor() {
    this.canvas = document.getElementById("bg-life");
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");

    this.cellSize = 12;
    this.aliveColor = "#3c3836";
    this.deadColor = "#32302f";

    this.resize();
    this.initGrid();

    window.addEventListener("resize", () => {
      this.resize();
      this.initGrid(); // resets world but acceptable
    });

    this.loop();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.cols = Math.floor(this.canvas.width / this.cellSize);
    this.rows = Math.floor(this.canvas.height / this.cellSize);
  }

  initGrid() {
    this.grid = [];
    this.nextGrid = [];

    for (let y = 0; y < this.rows; y++) {
      this.grid[y] = [];
      this.nextGrid[y] = [];

      for (let x = 0; x < this.cols; x++) {
        this.grid[y][x] = Math.random() > 0.7 ? 1 : 0;
        this.nextGrid[y][x] = 0;
      }
    }
  }

  getNeighbors(x, y) {
    let sum = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = (x + dx + this.cols) % this.cols;
        const ny = (y + dy + this.rows) % this.rows;

        sum += this.grid[ny][nx];
      }
    }

    return sum;
  }

  update() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const alive = this.grid[y][x];
        const neighbors = this.getNeighbors(x, y);

        if (alive && (neighbors < 2 || neighbors > 3)) {
          this.nextGrid[y][x] = 0;
        } else if (!alive && neighbors === 3) {
          this.nextGrid[y][x] = 1;
        } else {
          this.nextGrid[y][x] = alive;
        }
      }
    }

    [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x]) {
          this.ctx.fillStyle = this.aliveColor;
          this.ctx.fillRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize - 1,
            this.cellSize - 1
          );
        }
      }
    }
  }

  loop() {
    this.update();
    this.draw();
    setTimeout(() => this.loop(), 120);
  }
}


/* ========================================================= */
/* profile picture randomizer */
/* ========================================================= */

const TOTAL_PROFILE_IMAGES = 9;

function setRandomProfilePicture() {
  const img = document.getElementById("profile-pic");
  if (!img) return;

  const random = Math.floor(Math.random() * TOTAL_PROFILE_IMAGES) + 1;
  img.src = `assets/p${random}.png`;
}


/* ========================================================= */
/* bootstrap */
/* ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setRandomProfilePicture();

  const app = new MarkdownApp();
  app.init();

  new ReviewSlider();
  new GameOfLifeBackground();
});