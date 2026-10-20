
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
const STORAGE_KEY = "beautybooking_appointments_v1";

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

function getAppointments() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Could not read appointments:", error);
        return [];
    }
}

function saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function renderAppointments(date = "", showAll = false) {
    const tableBody = document.getElementById("appointments-table-body");
    const countElement = document.getElementById("appointment-count");
    const slotsElement = document.getElementById("booked-slots-count");
    const scheduleMessage = document.getElementById("schedule-message");

    if (!tableBody) return;

    const allAppointments = getAppointments();
    const appointments = (showAll
        ? allAppointments
        : allAppointments.filter(item => item.date === date)
    ).sort((a, b) =>
        a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
    );

    if (countElement) countElement.textContent = appointments.length;

    if (slotsElement) {
        slotsElement.textContent = new Set(
            appointments.map(item => `${item.date}_${item.time}`)
        ).size;
    }

    if (appointments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">No appointments found for this selection.</td>
            </tr>`;
    } else {
        tableBody.innerHTML = appointments.map(item => `
            <tr>
                <td>${escapeHTML(item.time)}</td>
                <td>${escapeHTML(item.name)}</td>
                <td>${escapeHTML(item.phone)}</td>
                <td>${escapeHTML(item.service)}</td>
                <td>${escapeHTML(item.date)}</td>
            </tr>`
        ).join("");
    }

    if (scheduleMessage) {
        scheduleMessage.textContent = showAll
            ? `Showing all ${appointments.length} locally saved appointment(s).`
            : `Showing ${appointments.length} appointment(s) for ${date || "the selected date"}.`;
    }
}

function updateBookedTimes(date) {
    const timeSelect = document.getElementById("booking-time");
    if (!timeSelect) return;

    const selectedTime = timeSelect.value;
    const bookedTimes = new Set(
        getAppointments()
            .filter(item => item.date === date)
            .map(item => item.time)
    );

    Array.from(timeSelect.options).forEach(option => {
        if (!option.value) return;

        option.disabled = bookedTimes.has(option.value);
        option.textContent = option.textContent
            .replace(/ \(Booked\)$/, "");

        if (option.disabled) {
            option.textContent += " (Booked)";
        }
    });

    if (selectedTime && bookedTimes.has(selectedTime)) {
        timeSelect.value = "";
    }
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
        button.textContent = "🎨 Change Theme";

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

    document.querySelectorAll(".choose-service").forEach(button => {
        button.addEventListener("click", () => {
            const select = document.getElementById("service");

            if (select) {
                select.value = button.dataset.service || "";
                document.getElementById("booking")
                    ?.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    const dateDisplay = document.getElementById("booking-date-display");
    const dateInput = document.getElementById("booking-date");
    const scheduleDate = document.getElementById("schedule-date");
    const showAllButton = document.getElementById("show-all-appointments");

    if (scheduleDate) {
        scheduleDate.value = dateInput?.value || "";
        scheduleDate.addEventListener("change", () => {
            renderAppointments(scheduleDate.value);
        });
    }

    if (showAllButton) {
        showAllButton.addEventListener("click", () => {
            renderAppointments("", true);
        });
    }

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

                    if (scheduleDate) {
                        scheduleDate.value = dateInput.value;
                    }

                    updateBookedTimes(dateInput.value);
                    renderAppointments(dateInput.value);
                }
            });
        } else {
            dateDisplay.placeholder =
                "Calendar failed to load; refresh the page";
        }
    }

    const form = document.getElementById("booking-form");
    const message = document.getElementById("booking-message");

    updateBookedTimes(dateInput?.value || "");
    renderAppointments(scheduleDate?.value || "");

    if (!form || !message) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        if (!dateInput?.value) {
            message.textContent =
                "Please select an appointment date from the Persian calendar.";
            return;
        }

        if (typeof emailjs === "undefined") {
            message.textContent =
                "Email service failed to load. Check your internet connection.";
            return;
        }

        const formData = new FormData(form);

        const appointment = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: formData.get("name") || "",
            phone: formData.get("phone") || "",
            service: formData.get("service") || "",
            date: dateInput.value,
            time: formData.get("time") || ""
        };

        const appointments = getAppointments();

        const duplicate = appointments.some(item =>
            item.date === appointment.date &&
            item.time === appointment.time
        );

        if (duplicate) {
            message.textContent =
                "This time is already booked in this browser. Please choose another time.";
            updateBookedTimes(appointment.date);
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        message.textContent = "Sending booking notification...";

        const params = {
            customer_name: appointment.name,
            customer_email: "",
            customer_phone: appointment.phone,
            booking_date: appointment.date,
            booking_time: appointment.time,
            service_name: appointment.service,
            email: OWNER_EMAIL
        };

        try {
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                params
            );

            appointments.push(appointment);
            saveAppointments(appointments);

            message.textContent =
                "Booking notification sent and appointment saved in this browser.";

            form.reset();

            if (dateDisplay) dateDisplay.value = "";

            if (dateInput) dateInput.value = "";

            if (scheduleDate) scheduleDate.value = appointment.date;

            updateBookedTimes("");
            renderAppointments(appointment.date);
        } catch (error) {
            console.error("EmailJS error:", error);
            message.textContent =
                "Email could not be sent. The appointment was not saved.";
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
});
