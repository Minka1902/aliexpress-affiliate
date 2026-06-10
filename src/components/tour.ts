"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// Re-runnable product tour. Steps target [data-tour] elements that exist on the page.
export function startTour(labels: { next: string; done: string }) {
  const steps = [
    { selector: '[data-tour="search"]', title: "Search & paste", text: "Paste an AliExpress link here to get your affiliate link." },
    { selector: '[data-tour="link"]', title: "Link generator", text: "Convert single or multiple links at once." },
    { selector: '[data-tour="cart"]', title: "Cart", text: "Add eligible products; run the AI safety + deals check before you buy." },
    { selector: '[data-tour="wishlist"]', title: "Wishlist", text: "Ineligible products go here; we re-check them every time you log in." },
    { selector: '[data-tour="dashboard"]', title: "Dashboard", text: "See your order value, shipping times and recommendations." },
  ].filter((s) => typeof document !== "undefined" && document.querySelector(s.selector));

  const d = driver({
    showProgress: true,
    nextBtnText: labels.next,
    doneBtnText: labels.done,
    prevBtnText: "←",
    steps: steps.map((s) => ({
      element: s.selector,
      popover: { title: s.title, description: s.text },
    })),
  });
  d.drive();
}
