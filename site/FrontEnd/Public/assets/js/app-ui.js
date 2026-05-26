const themeStorageKey = "gamescore-theme";

function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";

    document.body.classList.toggle("lightMode", nextTheme === "light");
    localStorage.setItem(themeStorageKey, nextTheme);

    document.querySelectorAll(".brightnessControl").forEach((button) => {
        button.textContent = nextTheme === "light" ? "Dark mode" : "Light mode";
        button.setAttribute("aria-pressed", String(nextTheme === "light"));
    });
}

function createBrightnessControl() {
    const nav = document.querySelector(".auth-nav");

    if (!nav || nav.querySelector(".brightnessControl")) {
        return;
    }

    const savedTheme = localStorage.getItem(themeStorageKey) || "dark";
    const button = document.createElement("button");
    button.className = "brightnessControl";
    button.type = "button";
    button.setAttribute("aria-label", "Changer le theme du site");

    nav.prepend(button);

    applyTheme(savedTheme);
    button.addEventListener("click", () => {
        const currentTheme = document.body.classList.contains("lightMode") ? "light" : "dark";
        applyTheme(currentTheme === "light" ? "dark" : "light");
    });
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

function setupContactForm() {
    const form = document.querySelector("[data-contact-form]");

    if (!form) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const message = form.querySelector("[data-contact-message]");

        if (message) {
            message.textContent = "Message ready to send. Backend connection comes next.";
        }
    });
}

createBrightnessControl();
setupAuthSlider();
setupContactForm();
