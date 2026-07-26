// Circular Habit Tracker Controller - Next.js Synced Client Engine

// State Management
const state = {
    currentDate: new Date(),
    habits: [],
    logs: {}, // Format: { "YYYY-MM-DD-habitId": "done" | "partial" | "not-done" | "exempt" }
    quote: "Discipline equals freedom.",
    theme: "dark"
};

// Dynamic Daily Discipline Quotes (31 quotes, one for each day of the month)
const DISCIPLINE_QUOTES = [
    "Discipline equals freedom. — Jocko Willink",
    "He who overcomes himself is the mightiest warrior. — Lao Tzu",
    "We are what we repeatedly do. Excellence, then, is not an act, but a habit. — Aristotle",
    "First we make our habits, then our habits make us. — John Dryden",
    "The successful warrior is the average man, with laser-like focus. — Bruce Lee",
    "Self-discipline is the master key to riches. — Napoleon Hill",
    "It is not that we have a short time to live, but that we waste a lot of it. — Seneca",
    "You have power over your mind - not outside events. Realize this, and you will find strength. — Marcus Aurelius",
    "Discipline is the bridge between goals and accomplishment. — Jim Rohn",
    "The only bad workout is the one that didn't happen. — Unknown",
    "He who has a why to live can bear almost any how. — Friedrich Nietzsche",
    "Don't count the days, make the days count. — Muhammad Ali",
    "Discipline is choosing between what you want now and what you want most. — Abraham Lincoln",
    "We must all suffer one of two things: the pain of discipline or the pain of regret. — Jim Rohn",
    "It never gets easier, you just get better. — Greg LeMond",
    "Suffering is the true test of life. — David Goggins",
    "The secret of getting ahead is getting started. — Mark Twain",
    "If you do not master self-discipline, you will master nothing. — Napoleon Hill",
    "The best revenge is to be unlike him who performed the injury. — Marcus Aurelius",
    "Conquer yourself rather than the world. — René Descartes",
    "Discipline is the soul of an army. It makes small numbers formidable. — George Washington",
    "You must do the things you think you cannot do. — Eleanor Roosevelt",
    "A disciplined mind leads to happiness, and an undisciplined mind leads to suffering. — Buddha",
    "Great things are done by a series of small things brought together. — Vincent Van Gogh",
    "The price of excellence is discipline. The cost of mediocrity is disappointment. — William Arthur Ward",
    "The critical ingredient is getting off your butt and doing something. — Nolan Bushnell",
    "Success is nothing more than a few simple disciplines, practiced every day. — Jim Rohn",
    "The master has failed more times than the beginner has even tried. — Stephen McCranie",
    "Action is the foundational key to all success. — Pablo Picasso",
    "You do not rise to the level of your goals. You fall to the level of your systems. — James Clear",
    "Discipline is the standard. Freedom is the reward. — Jocko Willink"
];

// Preset colors (Gradients and solid hexes)
const COLOR_PRESETS = [
    { id: 1, name: "Sunset Orange", solid: "#ff6b6b" },
    { id: 2, name: "Sky Blue", solid: "#3bc9db" },
    { id: 3, name: "Forest Emerald", solid: "#51cf66" },
    { id: 4, name: "Sunshine Gold", solid: "#fcc419" },
    { id: 5, name: "Orchid Purple", solid: "#cc5de8" },
    { id: 6, name: "Coral Amber", solid: "#ff922b" },
    { id: 7, name: "Teal Mint", solid: "#20c997" },
    { id: 8, name: "Royal Violet", solid: "#845ef7" },
    { id: 9, name: "Pastel Rose", solid: "#f783ac" },
    { id: 10, name: "Indigo Wave", solid: "#748ffc" }
];

// Debounce helper for background database synchronization
let syncTimeout = null;

// Drag-to-fill state: painting a habit's existing status across the wedges dragged over
let wedgeDragOrigin = null; // { habitId, status }
let wedgeDragMoved = false;
let wedgeDragTouched = null; // Map<logKey, status>, collected during the drag and committed on release
function triggerCloudSync() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
        try {
            const payload = {
                habits: state.habits,
                logs: state.logs,
                quote: state.quote
            };
            const response = await fetch('/api/habits/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                console.log('Cloud sync complete: habits and logs backed up.');
            }
        } catch (e) {
            console.warn('Network issue during background cloud sync, data is preserved locally:', e);
        }
    }, 1500); // 1.5 seconds debounce
}

// Load state from local storage
function loadFromLocalStorage() {
    try {
        const savedHabits = localStorage.getItem("cht_habits");
        const savedLogs = localStorage.getItem("cht_logs");
        const savedQuote = localStorage.getItem("cht_quote");
        const savedTheme = localStorage.getItem("cht_theme");

        if (savedHabits) state.habits = JSON.parse(savedHabits);
        if (savedLogs) state.logs = JSON.parse(savedLogs);
        if (savedQuote) state.quote = savedQuote;
        if (savedTheme) {
            state.theme = savedTheme;
            document.documentElement.setAttribute("data-theme", state.theme);
            updateThemeIcons();
        }
    } catch (e) {
        console.error("Failed to load from localStorage:", e);
    }
}

// Save state to local storage and queue cloud sync
function saveToLocalStorage() {
    try {
        localStorage.setItem("cht_habits", JSON.stringify(state.habits));
        localStorage.setItem("cht_logs", JSON.stringify(state.logs));
        localStorage.setItem("cht_quote", state.quote);
        localStorage.setItem("cht_theme", state.theme);
        
        // Trigger sync
        triggerCloudSync();
    } catch (e) {
        console.error("Failed to save to localStorage:", e);
    }
}

// Setup initial pleasant habits if empty
function initializeDefaultHabits() {
    if (state.habits.length === 0) {
        state.habits = [
            { id: "h1", name: "Exercise", colorIndex: 1, active: true },
            { id: "h2", name: "Reading", colorIndex: 2, active: true },
            { id: "h3", name: "Meditation", colorIndex: 3, active: true },
            { id: "h4", name: "Hydration", colorIndex: 4, active: true },
            { id: "h5", name: "Sleep 8h", colorIndex: 5, active: true },
            { id: "h6", name: "Healthy Diet", colorIndex: 6, active: true },
            { id: "h7", name: "Journaling", colorIndex: 7, active: true },
            { id: "h8", name: "Coding", colorIndex: 8, active: true }
        ];
        saveToLocalStorage();
    }
}

// Setup Event Listeners for UI (Ensured to run once)
function setupEventListeners() {
    // Check if initialized
    if (window.chtInitialized) {
        console.log('Event listeners already active. Bypassing setup.');
        return;
    }
    window.chtInitialized = true;
    
    // Navigation
    document.getElementById("prev-month-btn").addEventListener("click", () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderApp();
    });
    
    document.getElementById("next-month-btn").addEventListener("click", () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderApp();
    });

    // Theme Toggle
    document.getElementById("theme-toggle").addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", state.theme);
        updateThemeIcons();
        saveToLocalStorage();
    });

    // Habit CRUD
    document.getElementById("add-habit-btn").addEventListener("click", () => {
        if (state.habits.length >= 10) {
            alert("You have reached the maximum limit of 10 habits to maintain a beautiful, readable layout.");
            return;
        }

        // Find the first color index from 1 to 10 that is NOT currently used by any active habit
        const usedColors = state.habits.map(h => h.colorIndex);
        let nextColorIndex = 1;
        for (let c = 1; c <= 10; c++) {
            if (!usedColors.includes(c)) {
                nextColorIndex = c;
                break;
            }
        }
        // If all 10 colors are already in use, default to safe rotation cycling
        if (usedColors.includes(nextColorIndex)) {
            nextColorIndex = (state.habits.length % 10) + 1;
        }

        const newId = "h" + Date.now();
        state.habits.push({
            id: newId,
            name: `Habit ${state.habits.length + 1}`,
            colorIndex: nextColorIndex,
            active: true
        });
        saveToLocalStorage();
        renderApp();
    });

    // Bulk Update Modal Events
    const bulkModal = document.getElementById("bulk-update-modal");
    document.getElementById("bulk-update-btn").addEventListener("click", () => {
        const habitSelect = document.getElementById("bulk-habit-select");
        habitSelect.innerHTML = "";
        state.habits.forEach(habit => {
            const opt = document.createElement("option");
            opt.value = habit.id;
            opt.innerText = habit.name;
            habitSelect.appendChild(opt);
        });

        document.getElementById("bulk-status-select").value = "done";
        document.getElementById("bulk-start-date").value = formatFullDateKey(new Date());
        document.getElementById("bulk-days-count").value = "5";

        bulkModal.classList.add("active");
    });

    document.getElementById("bulk-modal-close-btn").addEventListener("click", () => {
        bulkModal.classList.remove("active");
    });

    document.getElementById("bulk-apply-btn").addEventListener("click", () => {
        const habitId = document.getElementById("bulk-habit-select").value;
        const status = document.getElementById("bulk-status-select").value;
        const startDateStr = document.getElementById("bulk-start-date").value;
        const days = parseInt(document.getElementById("bulk-days-count").value, 10);

        if (!habitId || !startDateStr || !days || days < 1) {
            alert("Please pick a habit, a start date, and a valid number of days.");
            return;
        }

        const startDate = new Date(`${startDateStr}T00:00:00`);
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const logKey = `${formatFullDateKey(d)}-${habitId}`;
            if (status === "clear") {
                delete state.logs[logKey];
            } else {
                state.logs[logKey] = status;
            }
        }

        saveToLocalStorage();
        renderApp();
        bulkModal.classList.remove("active");
        alert(`Updated ${days} day(s) as "${status}".`);
    });

    // Modal Events
    const backupModal = document.getElementById("backup-modal");
    document.getElementById("backup-btn").addEventListener("click", () => {
        const fullBackup = {
            habits: state.habits,
            logs: state.logs,
            quote: state.quote
        };
        document.getElementById("backup-text").value = JSON.stringify(fullBackup, null, 2);
        backupModal.classList.add("active");
    });

    document.getElementById("modal-close-btn").addEventListener("click", () => {
        backupModal.classList.remove("active");
    });

    document.getElementById("copy-backup-btn").addEventListener("click", () => {
        const text = document.getElementById("backup-text");
        text.select();
        navigator.clipboard.writeText(text.value);
        alert("Backup copied to clipboard!");
    });

    document.getElementById("import-btn").addEventListener("click", () => {
        const importText = document.getElementById("import-input").value.trim();
        if (!importText) return;
        try {
            const data = JSON.parse(importText);
            if (data.habits && data.logs) {
                state.habits = data.habits;
                state.logs = data.logs;
                if (data.quote) state.quote = data.quote;
                saveToLocalStorage();
                renderApp();
                backupModal.classList.remove("active");
                document.getElementById("import-input").value = "";
                alert("Data successfully restored!");
            } else {
                alert("Invalid backup structure. Please ensure it has habits and logs fields.");
            }
        } catch (e) {
            alert("Failed to parse data. Make sure it is valid JSON.");
        }
    });

    // Print Events
    document.getElementById("print-blank-btn").addEventListener("click", () => {
        document.body.removeAttribute("data-print-mode");
        document.body.setAttribute("data-print-mode", "blank");
        renderHabitWheel(); // redraw print blank SVG
        
        // Defer 150ms to allow SVGs to re-render in print colors before dialog opens
        setTimeout(() => {
            window.print();
        }, 150);
    });

    document.getElementById("print-filled-btn").addEventListener("click", () => {
        document.body.removeAttribute("data-print-mode");
        document.body.setAttribute("data-print-mode", "filled");
        renderHabitWheel(); // redraw filled print SVG
        
        // Defer 150ms to allow SVGs to re-render in print colors before dialog opens
        setTimeout(() => {
            window.print();
        }, 150);
    });

    // Clean up print mode dynamically once user finishes or cancels printing
    window.addEventListener("afterprint", () => {
        document.body.removeAttribute("data-print-mode");
        renderApp();
    });

    // Tactile Floating Context Menu click handlers
    const contextMenu = document.getElementById("wedge-context-menu");
    if (contextMenu) {
        contextMenu.querySelectorAll(".context-btn-item").forEach(btn => {
            btn.addEventListener("click", () => {
                if (!activeWedgeInfo) return;
                const { dayKey, habitId } = activeWedgeInfo;
                const status = btn.getAttribute("data-status");
                const logKey = `${dayKey}-${habitId}`;

                if (status === "clear") {
                    delete state.logs[logKey];
                } else {
                    state.logs[logKey] = status;
                }

                saveToLocalStorage();
                renderApp();

                // Close context menu
                contextMenu.style.display = "none";
                contextMenu.classList.remove("active");
            });
        });
    }

    // Drag-to-fill: press on a wedge that already has a status, then drag across
    // other days in the same habit's ring to paint them with that same status.
    const wheelSvg = document.getElementById("habit-wheel-svg");
    if (wheelSvg) {
        wheelSvg.addEventListener("pointerdown", (event) => {
            if (document.body.hasAttribute("data-print-mode")) return;
            const wedgeEl = event.target.closest(".wheel-wedge");
            if (!wedgeEl) return;

            const { habitId, dayKey } = wedgeEl.dataset;
            const status = state.logs[`${dayKey}-${habitId}`];
            if (!status) return; // Nothing to propagate from an empty day

            wedgeDragOrigin = { habitId, status };
            wedgeDragMoved = false;
            wedgeDragTouched = new Map();

            // Touch input implicitly captures the pointer to this wedge; release it so
            // pointermove keeps reporting whichever wedge is actually under the finger.
            try {
                if (wedgeEl.hasPointerCapture && wedgeEl.hasPointerCapture(event.pointerId)) {
                    wedgeEl.releasePointerCapture(event.pointerId);
                }
            } catch (e) { /* no-op: capture release is best-effort */ }
        });

        wheelSvg.addEventListener("pointermove", (event) => {
            if (!wedgeDragOrigin) return;

            const target = document.elementFromPoint(event.clientX, event.clientY);
            const wedgeEl = target && target.closest && target.closest(".wheel-wedge");
            if (!wedgeEl || wedgeEl.dataset.habitId !== wedgeDragOrigin.habitId) return;

            const logKey = `${wedgeEl.dataset.dayKey}-${wedgeEl.dataset.habitId}`;
            if (wedgeDragTouched.has(logKey)) return;

            wedgeDragMoved = true;
            wedgeDragTouched.set(logKey, wedgeDragOrigin.status);
            styleWedgeForStatus(wedgeEl, wedgeDragOrigin.status);
        });

        const endWedgeDrag = () => {
            if (!wedgeDragOrigin) return;

            if (wedgeDragMoved && wedgeDragTouched.size > 0) {
                wedgeDragTouched.forEach((status, logKey) => {
                    state.logs[logKey] = status;
                });
                saveToLocalStorage();
                renderApp();
            }

            wedgeDragOrigin = null;
            wedgeDragMoved = false;
            wedgeDragTouched = null;
        };

        document.addEventListener("pointerup", endWedgeDrag);
        document.addEventListener("pointercancel", endWedgeDrag);
    }
}

// Update Theme Icons visually
function updateThemeIcons() {
    const sunIcon = document.querySelector(".sun-icon");
    const moonIcon = document.querySelector(".moon-icon");
    if (!sunIcon || !moonIcon) return;
    if (state.theme === "dark") {
        sunIcon.style.display = "none";
        moonIcon.style.display = "block";
    } else {
        sunIcon.style.display = "block";
        moonIcon.style.display = "none";
    }
}

// Master Render function
function renderApp() {
    renderHeaders();
    renderHabitPanel();
    renderHabitWheel();
    calculateStats();
}

// Render Month labels and basic text views
function renderHeaders() {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthStr = months[state.currentDate.getMonth()];
    const yearStr = state.currentDate.getFullYear();
    
    document.getElementById("month-display").innerText = `${monthStr} ${yearStr}`;
    document.getElementById("wheel-center-month-label").innerText = monthStr.substring(0, 3).toUpperCase();
    document.getElementById("wheel-center-year-label").innerText = yearStr;

    // Dynamically select quote based on real-world day of month (1 to 31)
    const realDayOfMonth = new Date().getDate(); // 1 to 31
    const dailyQuote = DISCIPLINE_QUOTES[realDayOfMonth - 1] || DISCIPLINE_QUOTES[0];
    state.quote = dailyQuote;
    
    document.getElementById("quote-display").innerText = dailyQuote;
    document.getElementById("print-quote-block").innerText = `"${dailyQuote}"`;
}

// Render Left Panel inputs and color triggers
function renderHabitPanel() {
    const container = document.getElementById("habit-list-container");
    if (!container) return;
    container.innerHTML = "";

    state.habits.forEach((habit, idx) => {
        const item = document.createElement("div");
        item.className = "habit-item";
        item.draggable = true;
        
        // Number Label in legend
        const numLabel = document.createElement("span");
        numLabel.className = "habit-number-label";
        numLabel.innerText = `${idx + 1}.`;
        
        // Color Indicator Bubble
        const indicator = document.createElement("div");
        indicator.className = "habit-color-indicator";
        indicator.style.background = `var(--color-${habit.colorIndex})`;
        indicator.title = "Click to change color";
        indicator.addEventListener("click", (e) => {
            showColorPicker(e, habit.id);
        });

        // Habit Name Input
        const input = document.createElement("input");
        input.type = "text";
        input.className = "habit-input";
        input.maxLength = 30; // Limit to 30 characters to maintain clean visual alignments
        input.value = habit.name;
        input.placeholder = `Habit ${idx + 1}`;
        input.addEventListener("input", (e) => {
            habit.name = e.target.value;
            saveToLocalStorage();
            renderHabitWheel();
        });

        // Habit Completion Percentage (Month aggregate)
        const pct = document.createElement("span");
        pct.className = "habit-percentage";
        const percentVal = getHabitMonthlyCompletion(habit.id);
        pct.innerText = `${percentVal}%`;

        // Action Toolbar (Delete button)
        const actions = document.createElement("div");
        actions.className = "habit-actions";
        
        const delBtn = document.createElement("button");
        delBtn.className = "btn btn-danger btn-sm";
        delBtn.innerHTML = `&times;`;
        delBtn.title = "Delete Habit";
        delBtn.style.padding = "2px 6px";
        delBtn.style.fontSize = "0.75rem";
        delBtn.style.borderRadius = "50%";
        delBtn.style.display = "inline-flex"; // Always show delete button so users can delete any habit at any time

        delBtn.addEventListener("click", () => {
            if (state.habits.length <= 1) {
                alert("You need to keep at least one habit to track!");
                return;
            }
            if (confirm(`Are you sure you want to delete "${habit.name}"? This will delete all completions associated with it.`)) {
                state.habits = state.habits.filter(h => h.id !== habit.id);
                // Clean orphan logs
                Object.keys(state.logs).forEach(key => {
                    if (key.endsWith(`-${habit.id}`)) {
                        delete state.logs[key];
                    }
                });
                saveToLocalStorage();
                renderApp();
            }
        });

        actions.appendChild(delBtn);

        item.appendChild(numLabel);
        item.appendChild(indicator);
        item.appendChild(input);
        item.appendChild(pct);
        item.appendChild(actions);

        // Drag and Drop Event Listeners
        item.addEventListener("dragstart", (e) => {
            item.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", idx);
        });

        item.addEventListener("dragend", () => {
            item.classList.remove("dragging");
            const allItems = container.querySelectorAll(".habit-item");
            allItems.forEach(i => i.classList.remove("drag-over"));
        });

        item.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            item.classList.add("drag-over");
        });

        item.addEventListener("dragleave", () => {
            item.classList.remove("drag-over");
        });

        item.addEventListener("drop", (e) => {
            e.preventDefault();
            item.classList.remove("drag-over");
            const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
            const toIdx = idx;

            if (fromIdx !== toIdx && !isNaN(fromIdx)) {
                // Reorder habits array
                const draggedHabit = state.habits.splice(fromIdx, 1)[0];
                state.habits.splice(toIdx, 0, draggedHabit);
                
                saveToLocalStorage();
                renderApp();
            }
        });

        container.appendChild(item);
    });
}

// Show Color Picker Popup
function showColorPicker(event, habitId) {
    const popup = document.getElementById("picker-popup");
    popup.innerHTML = "";
    
    COLOR_PRESETS.forEach(preset => {
        const option = document.createElement("div");
        option.className = "color-option";
        option.style.background = `var(--color-${preset.id})`;
        option.title = preset.name;
        option.addEventListener("click", () => {
            const habit = state.habits.find(h => h.id === habitId);
            if (habit) {
                habit.colorIndex = preset.id;
                saveToLocalStorage();
                renderApp();
            }
            popup.style.display = "none";
        });
        popup.appendChild(option);
    });

    // Position the popup
    const rect = event.target.getBoundingClientRect();
    popup.style.display = "grid";
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.top = `${rect.bottom + window.scrollY + 6}px`;

    // Click outside handler
    const closeHandler = (e) => {
        if (!popup.contains(e.target) && e.target !== event.target) {
            popup.style.display = "none";
            document.removeEventListener("click", closeHandler);
        }
    };
    setTimeout(() => {
        document.addEventListener("click", closeHandler);
    }, 50);
}

// Math Utility: Polar to Cartesian coords
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
    };
}

// Math Utility: Generate circular arc sector path
function describeWedgePath(x, y, innerRadius, outerRadius, startAngle, endAngle) {
    const startInner = polarToCartesian(x, y, innerRadius, startAngle);
    const endInner = polarToCartesian(x, y, innerRadius, endAngle);
    const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, endAngle);

    const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", startOuter.x, startOuter.y,
        "A", outerRadius, outerRadius, 0, arcSweep, 1, endOuter.x, endOuter.y,
        "L", endInner.x, endInner.y,
        "A", innerRadius, innerRadius, 0, arcSweep, 0, startInner.x, startInner.y,
        "Z"
    ].join(" ");
}

// Get number of days in active month
function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Apply the visual fill/glow for a given log status onto a wedge (non-printing view only)
function styleWedgeForStatus(wedge, logState) {
    wedge.setAttribute("class", `wheel-wedge ${logState ? "completed wedge-" + logState : ""}`);

    if (logState === "done") {
        wedge.style.fill = "#51cf66"; // Green
        wedge.style.setProperty("--glow-color", "#51cf66");
    } else if (logState === "partial") {
        wedge.style.fill = "#ffd43b"; // Yellow
        wedge.style.setProperty("--glow-color", "#ffd43b");
    } else if (logState === "not-done") {
        wedge.style.fill = "#ff6b6b"; // Red
        wedge.style.setProperty("--glow-color", "#ff6b6b");
    } else if (logState === "exempt") {
        wedge.style.fill = "#adb5bd"; // Grey
        wedge.style.setProperty("--glow-color", "#adb5bd");
    } else {
        wedge.style.fill = "var(--wheel-bg-inactive)";
        wedge.style.stroke = "var(--wheel-stroke-inactive)";
        wedge.style.strokeWidth = "0.5px";
        wedge.style.setProperty("--glow-color", "transparent");
    }
}

// Render the Interactive SVG Wheel
function renderHabitWheel() {
    const svg = document.getElementById("habit-wheel-svg");
    if (!svg) return;
    svg.innerHTML = "";

    const daysCount = getDaysInMonth(state.currentDate);
    const habitsCount = state.habits.length;

    if (habitsCount === 0) return;

    // Geometric Parameters
    const innerBoundRadius = 95;
    const outerBoundRadius = 255;
    const ringWidth = (outerBoundRadius - innerBoundRadius) / habitsCount;

    const totalSpanDegrees = 270;
    const startWheelAngle = -90;
    const degPerDay = totalSpanDegrees / daysCount;

    const isPrintBlank = document.body.getAttribute("data-print-mode") === "blank";
    const isPrinting = document.body.hasAttribute("data-print-mode");

    // 1. Draw Grid rays/spokes for the days
    for (let d = 0; d <= daysCount; d++) {
        const angle = startWheelAngle + d * degPerDay;
        const pStart = polarToCartesian(0, 0, innerBoundRadius - 4, angle);
        const pEnd = polarToCartesian(0, 0, outerBoundRadius + 4, angle);
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("class", "wheel-grid-ray");
        line.setAttribute("x1", pStart.x);
        line.setAttribute("y1", pStart.y);
        line.setAttribute("x2", pEnd.x);
        line.setAttribute("y2", pEnd.y);
        if (isPrinting) {
            line.style.stroke = "#000";
            line.style.strokeWidth = "1.2px";
        }
        svg.appendChild(line);

        // Add day labels (outer boundary)
        if (d < daysCount) {
            const midAngle = angle + (degPerDay / 2);
            const pLabel = polarToCartesian(0, 0, outerBoundRadius + 15, midAngle);
            
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("class", "wheel-label");
            label.setAttribute("transform", `translate(${pLabel.x}, ${pLabel.y})`);
            label.setAttribute("x", 0);
            label.setAttribute("y", 0);
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("dominant-baseline", "central");
            label.textContent = d + 1;
            if (isPrinting) {
                label.style.fill = "#000";
                label.style.fontWeight = "800";
            }
            svg.appendChild(label);
        }
    }

    // 2. Draw Wedges (grid cells) for each Habit and Day
    state.habits.forEach((habit, hIdx) => {
        const rOuter = outerBoundRadius - hIdx * ringWidth;
        const rInner = rOuter - ringWidth;
        const rMid = (rOuter + rInner) / 2;

        // Draw the circular grid background rings
        const gridRing = document.createElementNS("http://www.w3.org/2000/svg", "path");
        gridRing.setAttribute("class", "wheel-grid-ring");
        gridRing.setAttribute("d", [
            "M", 0, -rOuter,
            "A", rOuter, rOuter, 0, 1, 1, -rOuter, 0
        ].join(" "));
        if (isPrinting) {
            gridRing.style.stroke = "#000";
            gridRing.style.strokeWidth = "1.2px";
        }
        svg.appendChild(gridRing);

        // Render each daily wedge for this habit
        for (let d = 1; d <= daysCount; d++) {
            const angleStart = startWheelAngle + (d - 1) * degPerDay;
            const angleEnd = startWheelAngle + d * degPerDay;

            const pathData = describeWedgePath(0, 0, rInner + 1.2, rOuter - 1.2, angleStart + 0.6, angleEnd - 0.6);

            const wedge = document.createElementNS("http://www.w3.org/2000/svg", "path");
            wedge.setAttribute("d", pathData);
            
            const dayKey = formatDateKey(state.currentDate, d);
            const logKey = `${dayKey}-${habit.id}`;
            const logState = state.logs[logKey]; // undefined, "done", "partial", "not-done", "exempt"

            wedge.dataset.dayKey = dayKey;
            wedge.dataset.habitId = habit.id;

            wedge.setAttribute("class", `wheel-wedge ${logState ? "completed wedge-" + logState : ""}`);

            if (isPrinting) {
                wedge.style.fill = "none";
                wedge.style.stroke = "#000";
                wedge.style.strokeWidth = "1px";

                // If printing pre-filled tracker, color the wedge appropriately!
                if (!isPrintBlank && logState) {
                    wedge.setAttribute("class", `wheel-wedge completed wedge-${logState}`);
                }
            } else {
                styleWedgeForStatus(wedge, logState);
            }

            // Click handling to open our gorgeous tactile floating context menu
            wedge.addEventListener("click", (event) => {
                if (isPrinting) return;
                event.stopPropagation(); // prevent immediate click-away close
                openWedgeContextMenu(event, dayKey, habit.id, logState);
            });

            svg.appendChild(wedge);
        }

        // 3. Draw Legend lines & checkboxes INSIDE the SVG for PRINTING!
        const lineY = -rMid;
        
        const legLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        legLine.setAttribute("class", "wheel-legend-line");
        legLine.setAttribute("y1", lineY);
        legLine.setAttribute("x2", 0);
        legLine.setAttribute("y2", lineY);
        
        if (isPrintBlank) {
            legLine.setAttribute("x1", -240);
            legLine.style.strokeDasharray = "none";
            legLine.style.stroke = "#000";
            legLine.style.strokeWidth = "1.5px";
        } else {
            legLine.setAttribute("x1", -120);
            legLine.style.strokeDasharray = "2,3";
        }
        svg.appendChild(legLine);

        // Habit numbering + text in SVG
        const legText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        legText.setAttribute("x", -260);
        legText.setAttribute("y", lineY + 3);
        legText.setAttribute("fill", isPrinting ? "#000" : "var(--text-primary)");
        legText.style.fontSize = "10px";
        legText.style.fontFamily = "inherit";
        legText.style.fontWeight = "800";
        
        // If printing a blank page, make the habit name text completely blank so users can write custom names
        legText.textContent = isPrintBlank ? `${hIdx + 1}. ` : `${hIdx + 1}. ${habit.name}`;
        svg.appendChild(legText);

        // Small decorative indicator matching the habit color
        if (!isPrinting) {
            const legDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            legDot.setAttribute("cx", -75);
            legDot.setAttribute("cy", lineY);
            legDot.setAttribute("r", 4);
            legDot.setAttribute("fill", `var(--c-solid-${habit.colorIndex})`);
            svg.appendChild(legDot);
        }
    });

    // Draw bottom boundary capping grid ring (innermost boundary)
    const innerGridRing = document.createElementNS("http://www.w3.org/2000/svg", "path");
    innerGridRing.setAttribute("class", "wheel-grid-ring");
    innerGridRing.setAttribute("d", [
        "M", 0, -innerBoundRadius,
        "A", innerBoundRadius, innerBoundRadius, 0, 1, 1, -innerBoundRadius, 0
    ].join(" "));
    if (isPrinting) {
        innerGridRing.style.stroke = "#000";
        innerGridRing.style.strokeWidth = "1.2px";
    }
    svg.appendChild(innerGridRing);
}

// Date helper: Format YYYY-MM-DD
function formatDateKey(date, day) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
}

// Date helper: Format YYYY-MM-DD directly from a Date's own year/month/day (crosses month/year boundaries safely)
function formatFullDateKey(date) {
    return formatDateKey(date, date.getDate());
}

// Calculate monthly completion rate for a specific habit (done=1, partial=0.5, exempt=no penalty)
function getHabitMonthlyCompletion(habitId) {
    const daysCount = getDaysInMonth(state.currentDate);
    let scoreSum = 0;
    let exemptDays = 0;
    
    for (let d = 1; d <= daysCount; d++) {
        const dayKey = formatDateKey(state.currentDate, d);
        const logVal = state.logs[`${dayKey}-${habitId}`];
        if (logVal === "done") {
            scoreSum += 1;
        } else if (logVal === "partial") {
            scoreSum += 0.5;
        } else if (logVal === "exempt") {
            exemptDays++;
        }
    }
    
    const effectiveDays = daysCount - exemptDays;
    return effectiveDays > 0 ? Math.round((scoreSum / effectiveDays) * 100) : 0;
}

// Calculate dashboard analytics
function calculateStats() {
    const today = new Date();
    const daysCount = getDaysInMonth(state.currentDate);
    const habitsCount = state.habits.length;
    
    let doneCount = 0;
    let partialCount = 0;
    let notDoneCount = 0;
    let exemptCount = 0;

    // Iterate over active month
    for (let d = 1; d <= daysCount; d++) {
        const dayKey = formatDateKey(state.currentDate, d);
        state.habits.forEach(habit => {
            const logVal = state.logs[`${dayKey}-${habit.id}`];
            if (logVal === "done") {
                doneCount++;
            } else if (logVal === "partial") {
                partialCount++;
            } else if (logVal === "not-done") {
                notDoneCount++;
            } else if (logVal === "exempt") {
                exemptCount++;
            }
        });
    }

    // Set metric count values in elements
    document.getElementById("stats-done-count").innerText = doneCount;
    document.getElementById("stats-partial-count").innerText = partialCount;
    document.getElementById("stats-not-done-count").innerText = notDoneCount;
    document.getElementById("stats-exempt-count").innerText = exemptCount;

    // Score computation: done=1, partial=0.5, exempt=no penalty
    const totalPossibleSlots = daysCount * habitsCount;
    const effectiveSlots = totalPossibleSlots - exemptCount;
    const scoreSum = doneCount + (0.5 * partialCount);
    const scorePercent = effectiveSlots > 0 ? Math.round((scoreSum / effectiveSlots) * 100) : 0;
    document.getElementById("stats-completion-rate").innerText = `${scorePercent}%`;

    // Calculate Today's absolute progress in center text
    let todayDone = 0;
    let todayPartial = 0;
    let todayExempt = 0;
    const todayDayNum = today.getDate();
    const todayFormattedKey = formatDateKey(today, todayDayNum);
    
    const isCurrentMonth = state.currentDate.getMonth() === today.getMonth() && state.currentDate.getFullYear() === today.getFullYear();
    
    if (isCurrentMonth) {
        state.habits.forEach(habit => {
            const logVal = state.logs[`${todayFormattedKey}-${habit.id}`];
            if (logVal === "done") {
                todayDone++;
            } else if (logVal === "partial") {
                todayPartial++;
            } else if (logVal === "exempt") {
                todayExempt++;
            }
        });
        const effectiveTodayHabits = habitsCount - todayExempt;
        const todayScoreSum = todayDone + (0.5 * todayPartial);
        const todayRate = effectiveTodayHabits > 0 ? Math.round((todayScoreSum / effectiveTodayHabits) * 100) : 0;
        
        document.getElementById("wheel-center-percentage").innerText = `${todayRate}%`;
        document.querySelector(".wheel-center-label").innerText = "Score Today";
    } else {
        document.getElementById("wheel-center-percentage").innerText = `${scorePercent}%`;
        document.querySelector(".wheel-center-label").innerText = "Monthly Score";
    }

    // Calculate Streaks
    const bestStreak = calculateLongestActiveStreak();
    document.getElementById("stats-best-streak").innerText = `${bestStreak}d`;
}

// Streak computation logic: active days with done/partial logs
function calculateLongestActiveStreak() {
    const activeDates = new Set();
    Object.keys(state.logs).forEach(key => {
        const logVal = state.logs[key];
        if (logVal === "done" || logVal === "partial") {
            const dateStr = key.substring(0, 10);
            activeDates.add(dateStr);
        }
    });

    const sortedDates = Array.from(activeDates).sort((a, b) => new Date(a) - new Date(b));

    if (sortedDates.length === 0) return 0;

    let longest = 0;
    let current = 0;
    let prevDate = null;

    sortedDates.forEach(dateStr => {
        const currDate = new Date(dateStr);
        if (prevDate === null) {
            current = 1;
        } else {
            const diffTime = Math.abs(currDate - prevDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                current++;
            } else if (diffDays > 1) {
                if (current > longest) longest = current;
                current = 1;
            }
        }
        prevDate = currDate;
    });

    return Math.max(longest, current);
}

// Active logging state pointer
let activeWedgeInfo = null;

// Opens context menu positioned perfectly next to finger/cursor
function openWedgeContextMenu(event, dayKey, habitId, currentStatus) {
    const menu = document.getElementById("wedge-context-menu");
    if (!menu) return;

    activeWedgeInfo = { dayKey, habitId };

    // Highlight current status actively
    menu.querySelectorAll(".context-btn-item").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-status") === (currentStatus || "clear")) {
            btn.classList.add("active");
        }
    });

    // Display it to calculate dimensions
    menu.style.display = "flex";
    
    // Defer height reading for dynamic alignment
    setTimeout(() => {
        menu.classList.add("active");
        
        const menuWidth = menu.offsetWidth || 230;
        const menuHeight = menu.offsetHeight || 50;

        let left = event.pageX - (menuWidth / 2);
        let top = event.pageY - menuHeight - 16; // 16px above touch position

        // Boundaries check
        if (left < 10) left = 10;
        if (left + menuWidth > window.innerWidth - 10) left = window.innerWidth - menuWidth - 10;
        if (top < 10) top = event.pageY + 16; // flip below if overflows top

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
    }, 0);

    // Click outside hook to automatically close
    const closeHandler = (e) => {
        if (!menu.contains(e.target)) {
            menu.style.display = "none";
            menu.classList.remove("active");
            document.removeEventListener("click", closeHandler);
        }
    };

    setTimeout(() => {
        document.addEventListener("click", closeHandler);
    }, 60);
}

// Export a reload global handle for React integration
window.chtReloadAndRender = () => {
    loadFromLocalStorage();
    renderApp();
};

// Initial run
loadFromLocalStorage();
initializeDefaultHabits();
setupEventListeners();
renderApp();
