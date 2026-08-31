"use strict";

window.initializeClingoHomepage = function(root, navigate, images = {}) {
  const controller = new AbortController();
  const listen = (target, type, callback, options = {}) => target.addEventListener(type, callback, { ...(typeof options === "boolean" ? { capture: options } : options), signal: controller.signal });
﻿"use strict";

document.documentElement.classList.add("js");

const serviceTrigger = root.querySelector("[data-service-trigger]");
const serviceMenu = root.querySelector(".home-page__search-field-menu--service");
const serviceValue = root.querySelector("[data-service-value]");
const serviceOptions = root.querySelectorAll("[data-service-option]");
const areaOptionsRoot = root.querySelector("[data-area-options]");
const areaTrigger = root.querySelector("[data-area-trigger]");
const areaMenu = root.querySelector(".home-page__search-field-menu--area");
const areaInput = root.querySelector("[data-area-input]");
const areaSizer = root.querySelector("[data-area-sizer]");
const areaUnit = root.querySelector("[data-area-unit]");
const locationMenu = root.querySelector(".home-page__search-field-menu--location");
const locationTrigger = root.querySelector("[data-location-trigger]");
const locationInput = root.querySelector("[data-location-input]");
const locationClear = root.querySelector("[data-location-clear]");
const locationPrimaryLabel = root.querySelector("[data-location-primary-label]");
const locationQueryLabel = root.querySelector("[data-location-query-label]");
const locationOptions = root.querySelectorAll("[data-location-option]");
const addonToggle = root.querySelector("[data-addon-toggle]");
const addonTotal = root.querySelector("[data-addon-total]");
const searchSubmit = root.querySelector("[data-search-submit]");
const searchShell = root.querySelector(".home-page__search-shell");
const addonsPanel = root.querySelector("[data-addons-panel]");
const addonsGrid = root.querySelector("[data-addons-grid]");
const notificationsMenu = root.querySelector("[data-notifications-menu]");
const notificationsTitle = root.querySelector(".header-not-login__notifications-title");
const notificationsText = root.querySelector(".header-not-login__notifications-text");
const headerElement = root.querySelector(".header-not-login");
const headerMobileToggle = root.querySelector("[data-header-mobile-toggle]");
const headerMobileBackdrop = root.querySelector("[data-header-mobile-backdrop]");
const headerMobileMenu = root.querySelector("[data-header-mobile-menu]");
let setNotificationsOpen = () => {};
let refreshAreaFieldState = () => {};

const addonItems = [
  { id: "mycie-okien", title: "Mycie okien", icon: "/clingo-homepage/assets/icons/addon-mycie-okien.png", quantity: 0 },
  { id: "lodowka", title: "Czyszczenie lodówki", icon: "/clingo-homepage/assets/icons/addon-lodowka.png", quantity: 0 },
  { id: "naczynia", title: "Mycie naczyń", icon: "/clingo-homepage/assets/icons/addon-naczynia.png", quantity: 0 },
  { id: "piekarnik", title: "Mycie piekarnika", icon: "/clingo-homepage/assets/icons/addon-piekarnik.png", quantity: 0 },
  { id: "okap", title: "Mycie okapu", icon: "/clingo-homepage/assets/icons/addon-okap.png", quantity: 0 },
  { id: "mikrofalowka", title: "Mycie mikrofalówki", icon: "/clingo-homepage/assets/icons/addon-mikrofalowka.png", quantity: 0 },
  { id: "prasowanie-1", title: "Prasowanie", icon: "/clingo-homepage/assets/icons/addon-prasowanie.png", quantity: 0 },
  { id: "szafa", title: "Sprzątanie i mycie wnętrza szafy", icon: "/clingo-homepage/assets/icons/addon-szafa.png", quantity: 0 },
  { id: "szafki", title: "Sprzątanie wnętrza szafek", icon: "/clingo-homepage/assets/icons/addon-szafki.png", quantity: 0 },
  { id: "kuweta", title: "Sprzątanie kuwety", icon: "/clingo-homepage/assets/icons/addon-kuweta.png", quantity: 0 },
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
  locationInput.placeholder = hasLocationValue ? "" : "Miejsce objęte usługą";
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
        <img class="home-page__addon-icon" src="${images[item.icon] || item.icon}" loading="lazy" decoding="async" alt="">
      </div>
      <p class="home-page__addon-title">${safeTitle}</p>
      <button class="home-page__addon-action" type="button">Wybierz</button>
      <div class="home-page__addon-counter">
        <button class="home-page__addon-counter-button home-page__addon-counter-button--minus" type="button" aria-label="Zmniejsz ilość"></button>
        <span class="home-page__addon-counter-value">${item.quantity}</span>
        <span class="home-page__addon-counter-unit">szt.</span>
        <button class="home-page__addon-counter-button home-page__addon-counter-button--plus" type="button" aria-label="Zwiększ ilość"></button>
      </div>
    `;

    const chooseButton = card.querySelector(".home-page__addon-action");
    const minusButton = card.querySelector(".home-page__addon-counter-button--minus");
    const plusButton = card.querySelector(".home-page__addon-counter-button--plus");

    const activateAddon = () => {
      item.quantity = 1;
      renderAddons();
    };

    listen(card, "click", () => {
      if (item.quantity === 0) {
        activateAddon();
        return;
      }

      item.quantity = 0;
      renderAddons();
    });

    listen(chooseButton, "click", (event) => {
      event.stopPropagation();
      activateAddon();
    });

    listen(minusButton, "click", (event) => {
      event.stopPropagation();
      item.quantity = Math.max(0, item.quantity - 1);
      renderAddons();
    });

    listen(plusButton, "click", (event) => {
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
  listen(addonToggle, "click", (event) => {
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
  listen(searchSubmit, "click", () => {
    navigate("/tablica-ogloszen");
  });
}

if (addonToggle && addonsPanel && searchShell) {
  listen(document, "click", (event) => {
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
  listen(headerMobileToggle, "click", (event) => {
    event.stopPropagation();
    setNotificationsOpen(false);
    const willOpen = !headerElement.classList.contains("is-mobile-menu-open");
    setHeaderMobileMenuOpen(willOpen);
  });

  if (headerMobileBackdrop) {
    listen(headerMobileBackdrop, "click", () => {
      setHeaderMobileMenuOpen(false);
    });
  }

  listen(document, "click", (event) => {
    if (!headerElement.contains(event.target)) {
      setHeaderMobileMenuOpen(false);
    }
  });

  listen(window, "resize", () => {
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
      text: "Zaloguj się, aby otrzymywać powiadomienia o zamówieniach, statusach i promocjach."
    },
    favorites: {
      title: "Ulubione",
      text: "Zaloguj się i twórz listę ulubionych, aby łatwo wracać do najciekawszych propozycji."
    },
    chat: {
      title: "Chat",
      text: "Zaloguj się, aby korzystać z chatu i łatwo komunikować się z usługodawcami."
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

    listen(button, "click", (event) => {
      event.stopPropagation();
      closeSearchDropdowns();
      const isSamePanel = notificationsMenu.classList.contains("is-open")
        && notificationsMenu.dataset.panelType === panelType;

      setNotificationsOpen(!isSamePanel, panelType);
    });
  });

  listen(document, "click", (event) => {
    if (!notificationsMenu.contains(event.target)) {
      setNotificationsOpen(false);
    }
  });

  setNotificationsOpen(false, notificationsMenu.dataset.panelType || "notification");
}

if (serviceTrigger && serviceMenu && serviceValue && serviceOptions.length > 0) {
  let selectedServiceValue = null;

  const renderServiceValue = () => {
    serviceValue.textContent = selectedServiceValue || "Rodzaj usługi";
    serviceValue.style.color = selectedServiceValue ? "#2e3b4c" : "#7c8691";
  };

  listen(serviceTrigger, "click", (event) => {
    event.stopPropagation();
    setNotificationsOpen(false);
    const shouldOpen = !serviceMenu.classList.contains("is-open");

    serviceMenu.classList.remove("is-open");

    collapseAreaMenuState();

    if (locationMenu && locationInput) {
      const hasLocationValue = locationInput.value.trim() !== "";
      locationMenu.classList.remove("is-open");
      locationMenu.classList.toggle("has-value", hasLocationValue);
      locationInput.placeholder = hasLocationValue ? "" : "Miejsce objęte usługą";
      locationInput.style.color = hasLocationValue ? "#2e3b4c" : "#7c8691";
      locationInput.blur();
    }

    if (shouldOpen) {
      serviceMenu.classList.add("is-open");
    }
  });

  for (const option of serviceOptions) {
    listen(option, "click", (event) => {
      event.stopPropagation();
      selectedServiceValue = option.dataset.serviceOption || option.textContent || "";

      for (const item of serviceOptions) {
        item.classList.toggle("is-selected", item === option);
      }

      renderServiceValue();
      serviceMenu.classList.remove("is-open");

      if (option.textContent && option.textContent.includes("Mieszkań i domów")) {
        setAddonsPanelOpen(true);
      } else {
        setAddonsPanelOpen(false);
      }
    });
  }

  listen(document, "click", (event) => {
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
  areaOptionsRoot.replaceChildren();
  const values = [];
  const squareMeters = "m\u00B2";
  let selectedAreaValue = null;

  const syncAreaInputWidth = () => {
    if (!root.isConnected || controller.signal.aborted) return;
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

    listen(option, "click", () => {
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

  listen(areaTrigger, "click", (event) => {
    if (event.target === areaInput) {
      return;
    }

    openAreaMenu();
    areaInput.focus();
  });

  listen(areaInput, "focus", () => {
    openAreaMenu();
    selectAreaInputValue();
  });

  listen(areaInput, "click", () => {
    selectAreaInputValue();
  });

  listen(areaInput, "input", () => {
    const digitsOnly = areaInput.value.replace(/\D/g, "");
    areaInput.value = digitsOnly;
    selectedAreaValue = digitsOnly === "" ? null : Number.parseInt(digitsOnly, 10);
    renderAreaField();

    for (const option of areaOptionsRoot.querySelectorAll(".home-page__search-area-option")) {
      option.classList.toggle("is-selected", option.dataset.value === String(selectedAreaValue));
    }
  });

  listen(document, "click", (event) => {
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

  listen(window, "load", syncAreaInputWidth, { once: true });

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
  const defaultLocationText = "Miejsce objęte usługą";
  const resolvedLocationText = "Floriańska 48, Warszawa, Polska";
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

  listen(locationTrigger, "click", (event) => {
    if (event.target === locationClear || locationClear.contains(event.target)) {
      return;
    }

    openLocationMenu();
    locationInput.focus();
  });

  listen(locationInput, "focus", () => {
    openLocationMenu();
  });

  listen(locationInput, "input", () => {
    selectedLocationValue = "";
    renderLocationField();
  });

  listen(locationClear, "click", (event) => {
    event.stopPropagation();
    selectedLocationValue = "";
    locationInput.value = "";
    renderLocationField();

    if (locationMenu.classList.contains("is-open")) {
      locationInput.focus();
    }
  });

  for (const option of locationOptions) {
    listen(option, "click", (event) => {
      event.stopPropagation();
      commitLocationSelection();
    });
  }

  listen(document, "click", (event) => {
    if (!locationMenu.contains(event.target)) {
      closeLocationMenu();
    }
  });

  renderLocationField();
}

  return () => {
    controller.abort();
    document.body.classList.remove("addons-open", "notifications-open");
  };
};

if (!document.querySelector("[data-clingo-homepage]")) {
  window.initializeClingoHomepage(document, href => { window.location.href = href; });
}
