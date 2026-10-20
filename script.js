
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

const DAYS = [
    "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه",
    "چهارشنبه", "پنجشنبه", "جمعه"
];
const TIMES = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

let currentTheme = 0;
let themeTimer;
let selectedSlot = null;

function applyTheme(index) {
    currentTheme = (index + themes.length) % themes.length;
    const theme = themes[currentTheme];

    Object.entries({
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
    }).forEach(([name, value]) =>
        document.documentElement.style.setProperty(name, value)
    );

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

function saveAppointments(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[char]);
}

function getLineForService(service) {
    if (service.startsWith("Nail")) return "nail";
    if (service.startsWith("Massage")) return "massage";
    if (service.startsWith("Hair")) return "hair";
    if (service.startsWith("Skin")) return "skin";
    if (service.startsWith("Makeup")) return "makeup";
    return "";
}

function getDayIndex(dateString) {
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return -1;

    // JavaScript: Sunday=0. Persian week starts Saturday.
    return (date.getDay() + 1) % 7;
}

function getWeekDates() {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // Find Saturday of the current week.
    const offset = (today.getDay() + 1) % 7;
    today.setDate(today.getDate() - offset);

    return DAYS.map((_, index) => {
        const day = new Date(today);
        day.setDate(today.getDate() + index);
        return [
            day.getFullYear(),
            String(day.getMonth() + 1).padStart(2, "0"),
            String(day.getDate()).padStart(2, "0")
        ].join("-");
    });
}

function isSlotBooked(line, date, time) {
    return getAppointments().some(item =>
        item.line === line &&
        item.date === date &&
        item.time === time
    );
}

function renderWeeklySchedules() {
    const dates = getWeekDates();

    document.querySelectorAll(".weekly-line").forEach(card => {
        const line = card.dataset.line;
        const tbody = card.querySelector(".weekly-table-body");
        if (!tbody) return;

        tbody.innerHTML = TIMES.map(time => {
            const cells = dates.map((date, dayIndex) => {
                const booked = isSlotBooked(line, date, time);
                const selected = selectedSlot &&
                    selectedSlot.line === line &&
                    selectedSlot.date === date &&
                    selectedSlot.time === time;

                let className = booked ? "slot-booked" : "slot-available";
                let label = booked ? "رزرو شده" : "آزاد";

                if (selected) {
                    className += " slot-selected";
                    label = "انتخاب شما";
                }

                return `<td>
                    <button
                        type="button"
                        class="weekly-slot ${className}"
                        data-line="${line}"
                        data-date="${date}"
                        data-time="${time}"
                        ${booked ? "disabled" : ""}
                        aria-label="${DAYS[dayIndex]} ${date} ساعت ${time}: ${label}">
                        ${label}
                    </button>
                </td>`;
            }).join("");

            return `<tr><th scope="row">${time}</th>${cells}</tr>`;
        }).join("");
    });
}

function selectSlot(line, date, time) {
    if (isSlotBooked(line, date, time)) return;

    selectedSlot = { line, date, time };

    const dateInput = document.getElementById("booking-date");
    const timeSelect = document.getElementById("booking-time");
    const dateDisplay = document.getElementById("booking-date-display");
    const serviceSelect = document.getElementById("service");

    if (dateInput) dateInput.value = date;
    if (timeSelect) timeSelect.value = time;

    // Convert the selected Gregorian date to Persian for display.
    if (dateDisplay && typeof persianDate !== "undefined") {
        const parts = date.split("-").map(Number);
        dateDisplay.value = new persianDate([
            parts[0], parts[1] - 1, parts[2]
        ]).format("YYYY/MM/DD");
    }

    if (serviceSelect) {
        const matchingOption = Array.from(serviceSelect.options).find(option =>
            option.value && getLineForService(option.value) === line
        );
        if (matchingOption) serviceSelect.value = matchingOption.value;
    }

    renderWeeklySchedules();

    document.getElementById("booking")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function renderAppointments(date = "", showAll = false) {
    const tbody = document.getElementById("appointments-table-body");
    if (!tbody) return;

    const appointments = getAppointments()
        .filter(item => showAll || item.date === date)
        .sort((a, b) =>
            a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
        );

    const count = document.getElementById("appointment-count");
    const slots = document.getElementById("booked-slots-count");
    const message = document.getElementById("schedule-message");

    if (count) count.textContent = appointments.length;
    if (slots) {
        slots.textContent = new Set(
            appointments.map(item => `${item.line}_${item.date}_${item.time}`)
        ).size;
    }

    tbody.innerHTML = appointments.length
        ? appointments.map(item => `<tr>
            <td>${escapeHTML(item.time)}</td>
            <td>${escapeHTML(item.name)}</td>
            <td>${escapeHTML(item.phone)}</td>
            <td>${escapeHTML(item.service)}</td>
            <td>${escapeHTML(item.date)}</td>
        </tr>`).join("")
        : `<tr><td colspan="5">نوبتی برای نمایش وجود ندارد.</td></tr>`;

    if (message) {
        message.textContent = showAll
            ? `همه ${appointments.length} نوبت ذخیره‌شده نمایش داده شده‌اند.`
            : `تعداد نوبت‌های این تاریخ: ${appointments.length}`;
    }
}

function refreshSchedule() {
    renderWeeklySchedules();

    const date = document.getElementById("schedule-date")?.value || "";
    renderAppointments(date);
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
        button.textContent = "🎨 تغییر رنگ";

        button.addEventListener("click", () => {
            applyTheme(currentTheme + 1);
            restartTimer();
        });

        header.querySelector("nav")?.appendChild(button);
    }

    applyTheme(0);
    restartTimer();

    document.querySelectorAll(".choose-service").forEach(button => {
        button.addEventListener("click", () => {
            const service = document.getElementById("service");
            if (service) service.value = button.dataset.service || "";
            document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
        });
    });

    document.getElementById("weekly-schedules")?.addEventListener("click", event => {
        const button = event.target.closest(".weekly-slot");
        if (!button || button.disabled) return;

        selectSlot(button.dataset.line, button.dataset.date, button.dataset.time);
    });

    const dateDisplay = document.getElementById("booking-date-display");
    const dateInput = document.getElementById("booking-date");

    if (dateDisplay && dateInput &&
        typeof jQuery !== "undefined" &&
        typeof jQuery.fn.persianDatepicker === "function") {
        jQuery(dateDisplay).persianDatepicker({
            format: "YYYY/MM/DD",
            autoClose: true,
            initialValue: false,
            calendar: {
                persian: { locale: "en", leapYearMode: "astronomical" }
            },
            onSelect: function (unixDate) {
                const date = new Date(unixDate);
                dateInput.value = [
                    date.getFullYear(),
                    String(date.getMonth() + 1).padStart(2, "0"),
                    String(date.getDate()).padStart(2, "0")
                ].join("-");
            }
        });
    }

    const scheduleDate = document.getElementById("schedule-date");
    scheduleDate?.addEventListener("change", () =>
        renderAppointments(scheduleDate.value)
    );

    document.getElementById("show-all-appointments")?.addEventListener("click", () =>
        renderAppointments("", true)
    );

    renderWeeklySchedules();
    renderAppointments(scheduleDate?.value || "");

    const form = document.getElementById("booking-form");
    const message = document.getElementById("booking-message");

    form?.addEventListener("submit", async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const formData = new FormData(form);
        const service = String(formData.get("service") || "");
        const line = getLineForService(service);
        const date = dateInput?.value || "";
        const time = String(formData.get("time") || "");

        if (!line || !date || !time) {
            message.textContent = "لطفاً خدمات، تاریخ و ساعت را انتخاب کنید.";
            return;
        }

        if (isSlotBooked(line, date, time)) {
            message.textContent = "این ساعت قبلاً در این مرورگر رزرو شده است. ساعت دیگری انتخاب کنید.";
            refreshSchedule();
            return;
        }

        const appointment = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            line,
            name: String(formData.get("name") || ""),
            phone: String(formData.get("phone") || ""),
            service,
            date,
            time
        };

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        message.textContent = "در حال ارسال درخواست رزرو...";

        try {
            if (typeof emailjs === "undefined") {
                throw new Error("EmailJS is not available.");
            }

            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                customer_name: appointment.name,
                customer_email: "",
                customer_phone: appointment.phone,
                booking_date: appointment.date,
                booking_time: appointment.time,
                service_name: appointment.service,
                email: OWNER_EMAIL
            });

            const appointments = getAppointments();
            appointments.push(appointment);
            saveAppointments(appointments);

            message.textContent = "درخواست رزرو ارسال و در این مرورگر ذخیره شد.";
            form.reset();
            dateInput.value = "";
            if (dateDisplay) dateDisplay.value = "";
            selectedSlot = null;

            refreshSchedule();
        } catch (error) {
            console.error("Booking error:", error);
            message.textContent = "ارسال ایمیل ناموفق بود؛ نوبت در این نسخه ذخیره نشد.";
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
});
