const brightnessStorageKey = "gamescore-brightness";

function applyBrightness(value) {
    const parsedValue = Number(value);
    const brightness = Number.isNaN(parsedValue) ? 100 : Math.max(60, Math.min(140, parsedValue));
    const root = document.documentElement;

    if (brightness >= 100) {
        root.style.setProperty("--brightness-overlay-color", "#ffffff");
        root.style.setProperty("--brightness-overlay-opacity", ((brightness - 100) / 40 * 0.18).toFixed(3));
    } else {
        root.style.setProperty("--brightness-overlay-color", "#000000");
        root.style.setProperty("--brightness-overlay-opacity", ((100 - brightness) / 40 * 0.45).toFixed(3));
    }

    localStorage.setItem(brightnessStorageKey, String(brightness));
}

function createBrightnessControl() {
    const nav = document.querySelector(".auth-nav");

    if (!nav || nav.querySelector(".brightnessControl")) {
        return;
    }

    const savedValue = localStorage.getItem(brightnessStorageKey) || "100";
    const wrapper = document.createElement("div");
    wrapper.className = "brightnessControl";
    wrapper.innerHTML = `
        <label for="site-brightness">Light</label>
        <input id="site-brightness" type="range" min="60" max="140" value="${savedValue}" aria-label="Luminosite du site">
    `;

    nav.prepend(wrapper);

    const input = wrapper.querySelector("input");
    applyBrightness(input.value);
    input.addEventListener("input", () => applyBrightness(input.value));
}

function setupAuthSlider() {
    const authPanel = document.querySelector(".authPanel");

    if (!authPanel) {
        return;
    }

    document.querySelectorAll("[data-auth-mode]").forEach((button) => {
        button.addEventListener("click", () => {
            const mode = button.getAttribute("data-auth-mode");
            authPanel.classList.toggle("registerMode", mode === "register");
        });
    });
}

createBrightnessControl();
setupAuthSlider();
