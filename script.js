document.getElementById("year").textContent = new Date().getFullYear();

function yearsSince(dateStr) {
  const start = new Date(dateStr);
  const now = new Date();
  const years = (now - start) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(years * 10) / 10;
}

document.querySelectorAll("[data-start]").forEach((el) => {
  const years = yearsSince(el.dataset.start);
  el.textContent = el.id === "years-exp" ? `${years}+` : `${years}`;
});

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

renderInrConversions();
