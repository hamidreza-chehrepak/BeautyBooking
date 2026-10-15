
const themes = [
    { name: "Pink Neon", accent: "#ff087f", accent2: "#ff4fc3", glow: "#ff8bd1", pageBg: "#fff5fc", cardBg: "#ffffff", text: "#201333", muted: "#594d68", border: "#ffd2ec", heroA: "#fff45c", heroB: "#ff9ee8", footer: "#570c49", shadow: "rgba(255, 8, 127, 0.2)" },
    { name: "Electric Blue", accent: "#006bff", accent2: "#00d9ff", glow: "#63edff", pageBg: "#eafaff", cardBg: "#ffffff", text: "#092747", muted: "#345b78", border: "#a9eaff", heroA: "#d5ffff", heroB: "#8ce8ff", footer: "#062f66", shadow: "rgba(0, 107, 255, 0.2)" },
    { name: "Violet Neon", accent: "#8b16ff", accent2: "#ff39db", glow: "#d28aff", pageBg: "#fbf2ff", cardBg: "#ffffff", text: "#301047", muted: "#68477c", border: "#e5c2ff", heroA: "#f5d6ff", heroB: "#d7b5ff", footer: "#410c70", shadow: "rgba(139, 22, 255, 0.2)" },
    { name: "Citrus Pop", accent: "#ff4b00", accent2: "#ffae00", glow: "#ffdb55", pageBg: "#fffbea", cardBg: "#ffffff", text: "#382000", muted: "#76552c", border: "#ffe08a", heroA: "#fff86b", heroB: "#ffbb61", footer: "#803000", shadow: "rgba(255, 100, 0, 0.2)" },
    { name: "Lime Energy", accent: "#00a94f", accent2: "#a5ed00", glow: "#bfff63", pageBg: "#f5ffeb", cardBg: "#ffffff", text: "#103b22", muted: "#426b50", border: "#c8f49b", heroA: "#efff75", heroB: "#aaffb7", footer: "#07552e", shadow: "rgba(0, 169, 79, 0.2)" }
];

const EMAILJS_PUBLIC_KEY = "pkVAXqQC5wH3EYOd6";
const EMAILJS_SERVICE_ID = "service_grkxvmp";
const EMAILJS_TEMPLATE_ID = "template_6u7m5t2";
const OWNER_EMAIL = "hamidiumcharpak@gmail.com";

let currentTheme = 0;
let themeTimer;

function applyTheme(index) {
    currentTheme = (index + themes.length) % themes.length;
    const theme = themes[currentTheme];
    const root = document.documentElement;

    const variables = {
        "--accent": theme.accent,
        "--accent-2": theme.accent2,
        "--glow": theme.glow,
        "--page-bg": theme.pageBg,
        "--card-bg": theme.cardBg,
        "--text": theme.text,
        "--muted": theme.muted,
        "--border": theme.border,
        "--hero-a": theme.heroA,
        "--hero-b": theme.heroB,
        "--footer": theme.footer,
        "--shadow": theme.shadow
    };

    Object.entries(variables).forEach(([name, value]) => {
        root.style.setProperty(name, value);
    });

    const button = document.getElementById("theme-toggle");
    if (button) button.textContent = `🎨 ${theme.name} · Change`;
}

function restartTimer() {
    clearInterval(themeTimer);
    themeTimer = setInterval(() => applyTheme(currentTheme + 1), 10000);
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof emailjs !== "undefined") {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }

    const header = document.querySelector("header");
    if (header && !document.getElementById("theme-toggle")) {
        const button = document.createElement("button");
        button.id = "theme-toggle";
        button.className = "theme-button";
        button.type = "button";
        button.addEventListener("click", () => {
            applyTheme(currentTheme + 1);
            restartTimer();
        });

        const nav = header.querySelector("nav");
        if (nav) nav.appendChild(button);
        else header.appendChild(button);
    }

    applyTheme(0);
    restartTimer();

    document.querySelectorAll(".choose-service").forEach((button) => {
        button.addEventListener("click", () => {
            const select = document.getElementById("service");
            if (select) {
                select.value = button.dataset.service || "";
                document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    // Initialize the Persian calendar date picker.
    const dateDisplay = document.getElementById("booking-date-display");
    const dateInput = document.getElementById("booking-date");

    if (dateDisplay && dateInput) {
        if (typeof jQuery !== "undefined" &&
            typeof jQuery.fn.persianDatepicker === "function") {
            jQuery(dateDisplay).persianDatepicker({
                format: "YYYY/MM/DD",
                autoClose: true,
                initialValue: false,
                calendar: {
                    persian: {
                        locale: "en",
                        leapYearMode: "astronomical"
                    }
                },
                onSelect: function (unixDate) {
                    const selected = new Date(unixDate);
                    const year = selected.getFullYear();
                    const month = String(selected.getMonth() + 1).padStart(2, "0");
                    const day = String(selected.getDate()).padStart(2, "0");
                    dateInput.value = `${year}-${month}-${day}`;
                }
            });
        } else {
            dateDisplay.placeholder = "Calendar failed to load; refresh the page";
        }
    }

    const form = document.getElementById("booking-form");
    const message = document.getElementById("booking-message");

    if (!form || !message) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        if (!dateInput || !dateInput.value) {
            message.textContent = "Please select an appointment date from the Persian calendar.";
            return;
        }

        if (typeof emailjs === "undefined") {
            message.textContent = "Email service failed to load. Check your internet connection.";
            return;
        }

        const formData = new FormData(form);
        const params = {
            customer_name: formData.get("name") || "",
            customer_email: "",
            customer_phone: formData.get("phone") || "",
            booking_date: dateInput.value,
            booking_time: formData.get("time") || "",
            service_name: formData.get("service") || "",
            email: OWNER_EMAIL
        };

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        message.textContent = "Sending booking notification...";

        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
            message.textContent = "Booking notification sent successfully!";
            form.reset();
        } catch (error) {
            console.error("EmailJS error:", error);
            message.textContent = "Email could not be sent. Check your EmailJS template settings.";
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
});
