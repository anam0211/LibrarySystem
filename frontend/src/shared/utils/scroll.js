function getPublicTopbarOffset() {
  const topbar = document.querySelector(".public-topbar");

  if (!(topbar instanceof HTMLElement)) {
    return 0;
  }

  return topbar.getBoundingClientRect().height;
}

export function scrollToElement(target, { behavior = "smooth", extraOffset = 16 } = {}) {
  const element = typeof target === "string" ? document.querySelector(target) : target;

  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const offset = getPublicTopbarOffset() + extraOffset;
  const top = Math.max(0, window.scrollY + element.getBoundingClientRect().top - offset);

  window.scrollTo({
    top,
    behavior
  });

  return true;
}

export function scrollToTop(behavior = "auto") {
  window.scrollTo({
    top: 0,
    behavior
  });
}
