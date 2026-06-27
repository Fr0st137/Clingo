"use strict";

document.documentElement.classList.add("js");

const serviceTrigger = document.querySelector("[data-service-trigger]");
const serviceMenu = document.querySelector(".home-page__search-field-menu--service");
const serviceValue = document.querySelector("[data-service-value]");
const serviceOptions = document.querySelectorAll("[data-service-option]");
const areaOptionsRoot = document.querySelector("[data-area-options]");
const areaTrigger = document.querySelector("[data-area-trigger]");
const areaMenu = document.querySelector(".home-page__search-field-menu--area");
const areaInput = document.querySelector("[data-area-input]");
const areaSizer = document.querySelector("[data-area-sizer]");
const areaUnit = document.querySelector("[data-area-unit]");
const locationMenu = document.querySelector(".home-page__search-field-menu--location");
const locationTrigger = document.querySelector("[data-location-trigger]");
const locationInput = document.querySelector("[data-location-input]");
const locationClear = document.querySelector("[data-location-clear]");
const locationPrimaryLabel = document.querySelector("[data-location-primary-label]");
const locationQueryLabel = document.querySelector("[data-location-query-label]");
const locationOptions = document.querySelectorAll("[data-location-option]");
const addonToggle = document.querySelector("[data-addon-toggle]");
const addonTotal = document.querySelector("[data-addon-total]");
const searchSubmit = document.querySelector("[data-search-submit]");
const searchShell = document.querySelector(".home-page__search-shell");
const addonsPanel = document.querySelector("[data-addons-panel]");
const addonsGrid = document.querySelector("[data-addons-grid]");
const notificationsMenu = document.querySelector("[data-notifications-menu]");
const notificationsTitle = document.querySelector(".header-not-login__notifications-title");
const notificationsText = document.querySelector(".header-not-login__notifications-text");
const headerElement = document.querySelector(".header-not-login");
const headerMobileToggle = document.querySelector("[data-header-mobile-toggle]");
const headerMobileBackdrop = document.querySelector("[data-header-mobile-backdrop]");
const headerMobileMenu = document.querySelector("[data-header-mobile-menu]");
let setNotificationsOpen = () => {};
let refreshAreaFieldState = () => {};

const addonItems = [
  { id: "mycie-okien", title: "Mycie okien", icon: "/clingo-homepage/assets/icons/addon-mycie-okien.png", quantity: 0 },
  { id: "lodowka", title: "Czyszczenie lodĂłwki", icon: "/clingo-homepage/assets/icons/addon-lodowka.png", quantity: 0 },
  { id: "naczynia", title: "Mycie naczyĹ„", icon: "/clingo-homepage/assets/icons/addon-naczynia.png", quantity: 0 },
  { id: "piekarnik", title: "Mycie piekarnika", icon: "/clingo-homepage/assets/icons/addon-piekarnik.png", quantity: 0 },
  { id: "okap", title: "Mycie okapu", icon: "/clingo-homepage/assets/icons/addon-okap.png", quantity: 0 },
  { id: "mikrofalowka", title: "Mycie mikrofalĂłwki", icon: "/clingo-homepage/assets/icons/addon-mikrofalowka.png", quantity: 0 },
  { id: "prasowanie-1", title: "Prasowanie", icon: "/clingo-homepage/assets/icons/addon-prasowanie.png", quantity: 0 },
  { id: "szafa", title: "SprzÄ…tanie i mycie wnÄ™trza szafy", icon: "/clingo-homepage/assets/icons/addon-szafa.png", quantity: 0 },
  { id: "szafki", title: "SprzÄ…tanie wnÄ™trza szafek", icon: "/clingo-homepage/assets/icons/addon-szafki.png", quantity: 0 },
  { id: "kuweta", title: "SprzÄ…tanie kuwety", icon: "/clingo-homepage/assets/icons/addon-kuweta.png", quantity: 0 },
  { id: "prasowanie-2", title: "Prasowanie", icon: "/clingo-homepage/assets/icons/addon-prasowanie.png", quantity: 0 }
];

const getAddonTotal = () =>
  addonItems.reduce((sum, item) => sum + item.quantity, 0);

const setAddonsPanelOpen = (isOpen) => {
  if (!addonsPanel) {
    return;
  }

  addonsPanel.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("addons-open", isOpen);
};

const collapseAreaMenuState = () => {
  if (!areaMenu) {
    return;
  }

  areaMenu.classList.remove("is-open");
  refreshAreaFieldState();
};

const collapseLocationMenuState = () => {
  if (!locationMenu || !locationInput) {
    return;
  }

  const hasLocationValue = locationInput.value.trim() !== "";
  locationMenu.classList.remove("is-open");
  locationMenu.classList.toggle("has-value", hasLocationValue);
  locationInput.placeholder = hasLocationValue ? "" : "Miejsce objÄ™te usĹ‚ugÄ…";
  locationInput.style.color = hasLocationValue ? "#2e3b4c" : "#7c8691";
  locationInput.blur();
};

const closeSearchDropdowns = () => {
  if (serviceMenu) {
    serviceMenu.classList.remove("is-open");
  }

  collapseAreaMenuState();
  collapseLocationMenuState();
};

const setHeaderMobileMenuOpen = (isOpen) => {
  if (!headerElement || !headerMobileToggle) {
    return;
  }

  headerElement.classList.toggle("is-mobile-menu-open", isOpen);
  headerMobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
};

const renderAddons = () => {
  if (!addonsGrid || !addonTotal) {
    return;
  }

  addonTotal.textContent = String(getAddonTotal());
  addonsGrid.innerHTML = "";

  for (const item of addonItems) {
    const card = document.createElement("article");
    card.className = "home-page__addon-card";
    if (item.quantity > 0) {
      card.classList.add("is-active");
    }

    const safeTitle = item.title.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

    card.innerHTML = `
      <span class="home-page__addon-check" aria-hidden="true">
        <img src="/clingo-homepage/assets/icons/check.svg" alt="">
      </span>
      <div class="home-page__addon-icon-shell">
        <img class="home-page__addon-icon" src="${item.icon}" alt="">
      </div>
      <p class="home-page__addon-title">${safeTitle}</p>
      <button class="home-page__addon-action" type="button">Wybierz</button>
      <div class="home-page__addon-counter">
        <button class="home-page__addon-counter-button home-page__addon-counter-button--minus" type="button" aria-label="Zmniejsz iloĹ›Ä‡"></button>
        <span class="home-page__addon-counter-value">${item.quantity}</span>
        <span class="home-page__addon-counter-unit">szt.</span>
        <button class="home-page__addon-counter-button home-page__addon-counter-button--plus" type="button" aria-label="ZwiÄ™ksz iloĹ›Ä‡"></button>
      </div>
    `;

    const chooseButton = card.querySelector(".home-page__addon-action");
    const minusButton = card.querySelector(".home-page__addon-counter-button--minus");
    const plusButton = card.querySelector(".home-page__addon-counter-button--plus");

    const activateAddon = () => {
      item.quantity = 1;
      renderAddons();
    };

    card.addEventListener("click", () => {
      if (item.quantity === 0) {
        activateAddon();
        return;
      }

      item.quantity = 0;
      renderAddons();
    });

    chooseButton.addEventListener("click", (event) => {
      event.stopPropagation();
      activateAddon();
    });

    minusButton.addEventListener("click", (event) => {
      event.stopPropagation();
      item.quantity = Math.max(0, item.quantity - 1);
      renderAddons();
    });

    plusButton.addEventListener("click", (event) => {
      event.stopPropagation();
      item.quantity = Math.min(50, item.quantity + 1);
      renderAddons();
    });

    addonsGrid.append(card);
  }
};

if (addonsGrid && addonTotal) {
  renderAddons();
  setAddonsPanelOpen(false);
}

if (addonToggle) {
  addonToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setNotificationsOpen(false);

    if (!addonsPanel) {
      return;
    }

    const willOpen = !addonsPanel.classList.contains("is-open");
    setAddonsPanelOpen(willOpen);
  });
}

if (searchSubmit) {
  searchSubmit.addEventListener("click", () => {
    window.location.href = "/tablica-ogloszen";
  });
}

if (addonToggle && addonsPanel && searchShell) {
  document.addEventListener("click", (event) => {
    const clickedTarget = event.target;

    if (!(clickedTarget instanceof Node)) {
      return;
    }

    if (!addonsPanel.classList.contains("is-open")) {
      return;
    }

    if (
      addonsPanel.contains(clickedTarget)
      || searchShell.contains(clickedTarget)
      || addonToggle.contains(clickedTarget)
    ) {
      return;
    }

    setAddonsPanelOpen(false);
  }, true);
}

if (headerElement && headerMobileToggle && headerMobileMenu) {
  headerMobileToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setNotificationsOpen(false);
    const willOpen = !headerElement.classList.contains("is-mobile-menu-open");
    setHeaderMobileMenuOpen(willOpen);
  });

  if (headerMobileBackdrop) {
    headerMobileBackdrop.addEventListener("click", () => {
      setHeaderMobileMenuOpen(false);
    });
  }

  document.addEventListener("click", (event) => {
    if (!headerElement.contains(event.target)) {
      setHeaderMobileMenuOpen(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 992) {
      setHeaderMobileMenuOpen(false);
    }
  });

  setHeaderMobileMenuOpen(false);
}
if (notificationsMenu) {
  const notificationButtons = Array.from(
    notificationsMenu.querySelectorAll(".header-not-login__notifications-icons .header-not-login__icon-button")
  );

  const panelContentByType = {
    notification: {
      title: "Powiadomienia",
      text: "Zaloguj siÄ™, aby otrzymywaÄ‡ powiadomienia o zamĂłwieniach, statusach i promocjach."
    },
    favorites: {
      title: "Ulubione",
      text: "Zaloguj siÄ™ i twĂłrz listÄ™ ulubionych, aby Ĺ‚atwo wracaÄ‡ do najciekawszych propozycji."
    },
    chat: {
      title: "Chat",
      text: "Zaloguj siÄ™, aby korzystaÄ‡ z chatu i Ĺ‚atwo komunikowaÄ‡ siÄ™ z usĹ‚ugodawcami."
    }
  };

  setNotificationsOpen = (isOpen, panelType = notificationsMenu.dataset.panelType || "notification") => {
    notificationsMenu.dataset.panelType = panelType;
    notificationsMenu.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("notifications-open", isOpen);

    if (notificationsTitle && notificationsText && panelContentByType[panelType]) {
      notificationsTitle.textContent = panelContentByType[panelType].title;
      notificationsText.textContent = panelContentByType[panelType].text;
    }

    notificationButtons.forEach((button) => {
      const buttonType = button.dataset.headerPanelTrigger || "chat";
      const isExpanded = isOpen && buttonType === panelType;
      button.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    });
  };

  notificationButtons.forEach((button, index) => {
    const panelType = button.dataset.headerPanelTrigger || (index === 2 ? "chat" : "notification");

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      closeSearchDropdowns();
      const isSamePanel = notificationsMenu.classList.contains("is-open")
        && notificationsMenu.dataset.panelType === panelType;

      setNotificationsOpen(!isSamePanel, panelType);
    });
  });

  document.addEventListener("click", (event) => {
    if (!notificationsMenu.contains(event.target)) {
      setNotificationsOpen(false);
    }
  });

  setNotificationsOpen(false, notificationsMenu.dataset.panelType || "notification");
}

if (serviceTrigger && serviceMenu && serviceValue && serviceOptions.length > 0) {
  let selectedServiceValue = null;

  const renderServiceValue = () => {
    serviceValue.textContent = selectedServiceValue || "Rodzaj usĹ‚ugi";
    serviceValue.style.color = selectedServiceValue ? "#2e3b4c" : "#7c8691";
  };

  serviceTrigger.addEventListener("click", (event) => {
    event.stopPropagation();
    setNotificationsOpen(false);
    const shouldOpen = !serviceMenu.classList.contains("is-open");

    serviceMenu.classList.remove("is-open");

    collapseAreaMenuState();

    if (locationMenu && locationInput) {
      const hasLocationValue = locationInput.value.trim() !== "";
      locationMenu.classList.remove("is-open");
      locationMenu.classList.toggle("has-value", hasLocationValue);
      locationInput.placeholder = hasLocationValue ? "" : "Miejsce objÄ™te usĹ‚ugÄ…";
      locationInput.style.color = hasLocationValue ? "#2e3b4c" : "#7c8691";
      locationInput.blur();
    }

    if (shouldOpen) {
      serviceMenu.classList.add("is-open");
    }
  });

  for (const option of serviceOptions) {
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      selectedServiceValue = option.dataset.serviceOption || option.textContent || "";

      for (const item of serviceOptions) {
        item.classList.toggle("is-selected", item === option);
      }

      renderServiceValue();
      serviceMenu.classList.remove("is-open");

      if (option.textContent && option.textContent.includes("MieszkaĹ„ i domĂłw")) {
        setAddonsPanelOpen(true);
      } else {
        setAddonsPanelOpen(false);
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (!serviceMenu.contains(event.target)) {
      serviceMenu.classList.remove("is-open");
    }
  });

  for (const item of serviceOptions) {
    item.classList.remove("is-selected");
  }

  renderServiceValue();
}

if (areaOptionsRoot && areaTrigger && areaMenu && areaInput && areaSizer && areaUnit) {
  const values = [];
  const squareMeters = "m\u00B2";
  let selectedAreaValue = null;

  const syncAreaInputWidth = () => {
    const sample = areaInput.value || areaInput.placeholder || "0";
    areaSizer.textContent = sample;
    const measuredWidth = Math.ceil(areaSizer.getBoundingClientRect().width);
    areaInput.style.width = `${Math.max(measuredWidth, 1)}px`;
  };

  for (let value = 5; value <= 1000; value += 5) {
    values.push(value);
  }

  const renderAreaField = () => {
    if (selectedAreaValue === null) {
      areaInput.value = "";
      areaInput.placeholder = areaMenu.classList.contains("is-open") ? "" : "np. 80";
      areaInput.style.color = areaMenu.classList.contains("is-open") ? "#2e3b4c" : "#7c8691";
      areaUnit.textContent = squareMeters;
      areaUnit.style.color = "#7c8691";
      syncAreaInputWidth();
      return;
    }

    areaInput.value = String(selectedAreaValue);
    areaInput.placeholder = "";
    areaInput.style.color = "#2e3b4c";
    areaUnit.textContent = squareMeters;
    areaUnit.style.color = "#2e3b4c";
    syncAreaInputWidth();
  };

  refreshAreaFieldState = () => {
    renderAreaField();
    areaInput.blur();
  };

  const selectAreaValue = (value) => {
    selectedAreaValue = value;
    renderAreaField();

    for (const option of areaOptionsRoot.querySelectorAll(".home-page__search-area-option")) {
      option.classList.toggle("is-selected", option.dataset.value === String(value));
    }
  };

  const scrollToSelected = () => {
    const selected = areaOptionsRoot.querySelector(".home-page__search-area-option.is-selected");

    if (!selected) {
      areaOptionsRoot.scrollTop = 0;
      return;
    }

    const optionTop = selected.offsetTop;
    const optionHeight = selected.offsetHeight;
    const viewTop = areaOptionsRoot.scrollTop;
    const viewBottom = viewTop + areaOptionsRoot.clientHeight;

    if (optionTop < viewTop || optionTop + optionHeight > viewBottom) {
      areaOptionsRoot.scrollTop = optionTop - areaOptionsRoot.clientHeight / 2 + optionHeight / 2;
    }
  };

  for (const value of values) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "home-page__search-area-option";
    option.dataset.value = String(value);
    option.textContent = `${value} ${squareMeters}`;

    option.addEventListener("click", () => {
      selectAreaValue(value);
      areaMenu.classList.remove("is-open");
      renderAreaField();
      areaInput.blur();
    });

    areaOptionsRoot.append(option);
  }

  const openAreaMenu = () => {
    setNotificationsOpen(false);

    if (serviceMenu) {
      serviceMenu.classList.remove("is-open");
    }

    areaMenu.classList.add("is-open");
    scrollToSelected();
    renderAreaField();
  };

  const selectAreaInputValue = () => {
    if (areaInput.value.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      areaInput.setSelectionRange(0, areaInput.value.length);
    });
  };

  areaTrigger.addEventListener("click", (event) => {
    if (event.target === areaInput) {
      return;
    }

    openAreaMenu();
    areaInput.focus();
  });

  areaInput.addEventListener("focus", () => {
    openAreaMenu();
    selectAreaInputValue();
  });

  areaInput.addEventListener("click", () => {
    selectAreaInputValue();
  });

  areaInput.addEventListener("input", () => {
    const digitsOnly = areaInput.value.replace(/\D/g, "");
    areaInput.value = digitsOnly;
    selectedAreaValue = digitsOnly === "" ? null : Number.parseInt(digitsOnly, 10);
    renderAreaField();

    for (const option of areaOptionsRoot.querySelectorAll(".home-page__search-area-option")) {
      option.classList.toggle("is-selected", option.dataset.value === String(selectedAreaValue));
    }
  });

  document.addEventListener("click", (event) => {
    if (!areaMenu.contains(event.target)) {
      areaMenu.classList.remove("is-open");
      renderAreaField();
    }
  });

  renderAreaField();

  requestAnimationFrame(() => {
    syncAreaInputWidth();

    requestAnimationFrame(() => {
      syncAreaInputWidth();
    });
  });

  window.addEventListener("load", syncAreaInputWidth, { once: true });

  if (document.fonts && typeof document.fonts.ready?.then === "function") {
    document.fonts.ready.then(() => {
      syncAreaInputWidth();
    });
  }
}

if (
  locationMenu &&
  locationTrigger &&
  locationInput &&
  locationClear &&
  locationPrimaryLabel &&
  locationQueryLabel &&
  locationOptions.length > 0
) {
  const defaultLocationText = "Miejsce objÄ™te usĹ‚ugÄ…";
  const resolvedLocationText = "FloriaĹ„ska 48, Warszawa, Polska";
  let selectedLocationValue = "";

  const renderLocationField = () => {
    const isOpen = locationMenu.classList.contains("is-open");
    const currentValue = locationInput.value.trim();
    const hasValue = selectedLocationValue !== "" || currentValue !== "";
    const queryText = currentValue || "adres";

    locationMenu.classList.toggle("has-value", hasValue);
    locationInput.placeholder = isOpen ? "" : defaultLocationText;
    locationInput.style.color = hasValue || isOpen ? "#2e3b4c" : "#7c8691";
    locationPrimaryLabel.textContent = resolvedLocationText;
    locationQueryLabel.textContent = `Wyszukaj ${queryText}`;
  };

  const openLocationMenu = () => {
    setNotificationsOpen(false);

    if (serviceMenu) {
      serviceMenu.classList.remove("is-open");
    }

    collapseAreaMenuState();

    locationMenu.classList.add("is-open");
    renderLocationField();
  };

  const closeLocationMenu = () => {
    locationMenu.classList.remove("is-open");

    if (selectedLocationValue !== "") {
      locationInput.value = selectedLocationValue;
    }

    renderLocationField();
  };

  const commitLocationSelection = () => {
    selectedLocationValue = resolvedLocationText;
    locationInput.value = selectedLocationValue;
    closeLocationMenu();
  };

  locationTrigger.addEventListener("click", (event) => {
    if (event.target === locationClear || locationClear.contains(event.target)) {
      return;
    }

    openLocationMenu();
    locationInput.focus();
  });

  locationInput.addEventListener("focus", () => {
    openLocationMenu();
  });

  locationInput.addEventListener("input", () => {
    selectedLocationValue = "";
    renderLocationField();
  });

  locationClear.addEventListener("click", (event) => {
    event.stopPropagation();
    selectedLocationValue = "";
    locationInput.value = "";
    renderLocationField();

    if (locationMenu.classList.contains("is-open")) {
      locationInput.focus();
    }
  });

  for (const option of locationOptions) {
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      commitLocationSelection();
    });
  }

  document.addEventListener("click", (event) => {
    if (!locationMenu.contains(event.target)) {
      closeLocationMenu();
    }
  });

  renderLocationField();
}
