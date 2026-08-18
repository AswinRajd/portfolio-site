document.getElementById("year").textContent = new Date().getFullYear();

function yearsSince(dateStr) {
  const start = new Date(dateStr);
  const now = new Date();
  const years = (now - start) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(years * 10) / 10;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function boldMarkdown(str) {
  return escapeHtml(str).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderHero(hero) {
  const years = yearsSince(hero.experienceStartDate);
  document.getElementById("hero-content").innerHTML = `
    <img class="avatar" src="${hero.photo}" alt="${escapeHtml(hero.name)}">
    <h1>${escapeHtml(hero.name)}</h1>
    <p class="title">${escapeHtml(hero.title)}</p>
    <p class="lede">${years}+ ${escapeHtml(hero.ledeSuffix)}</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="mailto:${hero.email}">Email me</a>
      <a class="btn btn-secondary" href="${hero.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
    </div>
  `;
  return years;
}

function renderAbout(about, years) {
  document.getElementById("about-content").innerHTML = `
    <img class="about-photo" src="${about.photo}" alt="${escapeHtml(about.photoAlt)}">
    <p>${escapeHtml(about.textBefore)} ${years} ${escapeHtml(about.textAfter)}</p>
  `;
}

function renderSkills(skills) {
  document.getElementById("skills-content").innerHTML = skills.map((group) => `
    <div class="skill-card">
      <h3>${escapeHtml(group.title)}</h3>
      <ul class="tags">
        ${group.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}
      </ul>
    </div>
  `).join("");
}

function renderExperience(experience) {
  document.getElementById("experience-content").innerHTML = experience.map((job) => `
    <div class="timeline-item">
      <div class="timeline-header">
        <h3>${escapeHtml(job.role)}</h3>
        <span class="timeline-meta">${escapeHtml(job.meta)}</span>
      </div>
      <ul>
        ${job.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
      </ul>
    </div>
  `).join("");
}

function renderAchievements(achievements) {
  document.getElementById("achievements-content").innerHTML = achievements.map((item) => {
    if (item.type === "stat") {
      return `
        <div class="achievement-card highlight">
          <span class="stat" data-eur="${item.eur}">€${Math.round(item.eur).toLocaleString("en-US")}</span>
          <span class="stat-inr"></span>
          <p>${escapeHtml(item.text)}</p>
        </div>
      `;
    }
    return `
      <div class="achievement-card">
        <p>${boldMarkdown(item.text)}</p>
      </div>
    `;
  }).join("");
}

function renderEducation(education) {
  document.getElementById("education-content").innerHTML = education.map((item) => `
    <li>
      <span class="edu-year">${escapeHtml(item.year)}</span>
      <span>${escapeHtml(item.text)}</span>
    </li>
  `).join("");
}

function renderContact(contact) {
  document.getElementById("contact-intro").textContent = contact.intro;
  document.getElementById("contact-content").innerHTML = `
    <a class="contact-item" href="mailto:${contact.email}">${escapeHtml(contact.email)}</a>
    <a class="contact-item" href="tel:${contact.phone.replace(/\s+/g, "")}">${escapeHtml(contact.phone)}</a>
    <a class="contact-item" href="${contact.linkedin}" target="_blank" rel="noopener">linkedin.com/in/aswin-raj-d</a>
    <span class="contact-item">${escapeHtml(contact.location)}</span>
  `;
}

function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  const storedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", initialTheme);

  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
}

function setupRevealAnimations() {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}

async function renderInrConversions() {
  const statEls = document.querySelectorAll(".stat[data-eur]");
  if (!statEls.length) return;

  const CACHE_KEY = "eurInrRate";
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  let rate;

  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      rate = cached.rate;
    } else {
      const res = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=INR");
      const data = await res.json();
      rate = data.rates.INR;
      localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, fetchedAt: Date.now() }));
    }
  } catch (err) {
    return;
  }

  if (!rate) return;

  statEls.forEach((el) => {
    const eurAmount = parseFloat(el.dataset.eur);
    const inrAmount = Math.round(eurAmount * rate);
    const inrText = "≈ ₹" + inrAmount.toLocaleString("en-IN");
    const inrEl = el.nextElementSibling;
    if (inrEl && inrEl.classList.contains("stat-inr")) {
      inrEl.textContent = inrText;
    }
  });
}

function setupActiveNavHighlight() {
  const navLinks = Array.from(document.querySelectorAll(".nav nav a[href^='#']"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
  };

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

async function init() {
  const res = await fetch("content/content.json");
  const data = await res.json();

  const years = renderHero(data.hero);
  renderAbout(data.about, years);
  renderSkills(data.skills);
  renderExperience(data.experience);
  renderAchievements(data.achievements);
  renderEducation(data.education);
  renderContact(data.contact);

  setupThemeToggle();
  setupRevealAnimations();
  setupActiveNavHighlight();
  renderInrConversions();
}

init();
