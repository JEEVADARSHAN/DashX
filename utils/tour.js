document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("dashx_tour_done", (res) => {
        if (!res.dashx_tour_done) {
            startDashxTour();
        }
    });
});

function startDashxTour() {
    const tour = new Shepherd.Tour({
        defaultStepOptions: {
            cancelIcon: {
                enabled: true
            },
            scrollTo: { behavior: 'smooth', block: 'center' },
            classes: 'shepherd-theme-arrows custom-shepherd-style',
        },
        useModalOverlay: true
    });

    // -------- INTRO SLIDES (3 Total) -------- //

    tour.addStep({
        id: "intro-1",
        title: "<div style='width:100%'><img style='width: 365px; border-radius: 16px;' src=../assets/onboarding/s1.jpg /><h2>Welcome to DashX</h2></div>",
        text: withPagination(`
            <p><strong>DashX</strong> turns your new tab into a powerful, distraction free workspace. Designed for speed, focus, and full personalization.</p>
        `, 1, 3),
        buttons: [
            {
                text: "Next",
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: "intro-2",
        title: "<div style='width:100%'><img style='width: 365px; border-radius: 16px;' src=../assets/onboarding/s2.jpg /><h2>One Dashboard.<br> Total Control.</h2></div>",
        text: withPagination(`
            <p>Quickly access bookmarks, tasks, widgets, and tools, all from a clean, high-performance dashboard.</p>
        `, 2, 3),
        buttons: [
            {
                text: "Back",
                action: tour.back
            },
            {
                text: "Next",
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: "intro-3",
        title: "<div style='width:100%'><img style='width: 365px; border-radius: 16px;' src=../assets/onboarding/s3.webp /><h2>Private by Design</h2></div>",
        text: withPagination(`
            <p>No logins. No tracking. DashX stores everything your notes, settings, and layouts securely in your browser.</p>
        `, 3, 3),
        buttons: [
            {
                text: "Back",
                action: tour.back
            },
            {
                text: "Start Tour",
                action: tour.next
            }
        ]
    });

    // -------- FEATURE TOUR -------- //

    tour.addStep({
        id: "dashboard-bar",
        title: "Quick Access Bar",
        text: withPagination(`
            <p>Pin your most used websites and tools for instant access. Think of it as your personal launch pad.</p>
        `, 1, 6),
        beforeShowPromise: () => {
            const toggles = document.querySelectorAll('.drawer-toggle');
            toggles.forEach(toggle => {
                if (toggle.checked) toggle.click();
            });
            return new Promise(resolve => setTimeout(resolve, 400));
        },
        attachTo: {
            element: ".app-container",
            on: "top"
        },
        buttons: [
            {
                text: "Back",
                action: tour.back
            },
            {
                text: "Next",
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: "widgets-overview",
        title: "Live Widgets",
        text: withPagination(`
            <p>Stay up to date with personalized, glanceable information with real-time widgets like weather, notes, and tasks right on your dashboard.</p>
        `, 2, 6),
        beforeShowPromise: () => {
            return new Promise((resolve) => {
                const toggles = document.querySelectorAll('.drawer-toggle');
                toggles.forEach(toggle => {
                    if (toggle.checked) toggle.click();
                });
                setTimeout(resolve, 400);
            });
        },
        attachTo: {
            element: ".weather-widget",
            on: "right"
        },
        buttons: [
            {
                text: "Back",
                action: tour.back
            },
            {
                text: "Next",
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: "app-drawer-step",
        title: "Quick Launch Panel",
        text: withPagination(`
            <p>Access your favorite websites from one place. Browse and launch shortcuts using the Quick Launch Panel.</p>
        `, 3, 6),
        beforeShowPromise: openDrawerIfClosed('#toggle-app-drawer'),
        attachTo: {
            element: "#app-drawer",
        },
        buttons: [
            {
                text: "Back",
                action: tour.back
            },
            {
                text: "Next",
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: "settings-panel",
        title: "Control Panel",
        text: withPagination(`
            <p>Customize your experience adjust themes, transparency, fonts, and layout to match your style.</p>
        `, 4, 6),
        beforeShowPromise: openDrawerIfClosed('#toggle-settings-drawer'),
        attachTo: {
            element: "#settings-content",
            on: "left"
        },
        buttons: [
            {
                text: "Back",
                action: tour.back
            },
            {
                text: "Next",
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: "wallpaper-picker",
        title: "Wallpaper Picker",
        text: withPagination(`
            <p>Set your vibe. Choose from built-in backgrounds or upload your own to create your perfect workspace.</p>
        `, 5, 6),
        attachTo: {
            element: ".thumb-wrapper",
            on: "bottom"
        },
        buttons: [
            {
                text: "Back",
                action: tour.back
            },
            {
                text: "Next",
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: "done-step",
        title: "You're Ready!",
        text: withPagination(`
            <p>You're ready to explore DashX. Enjoy a clean, fast, and fully customizable new tab experience built around you.</p>
        `, 6, 6),
        buttons: [
            {
                text: "Back",
                action: tour.back
            },
            {
                text: "Finish",
                action: tour.complete
            }
        ]
    });

    // Set tour completion flag
    tour.on("complete", () => {
        chrome.storage.local.set({ dashx_tour_done: true });
    });

    tour.on("cancel", () => {
        chrome.storage.local.set({ dashx_tour_done: true });
    });

    tour.start();
}

// ------- Utility Functions ------- //

function withPagination(content, currentStep, totalSteps) {
    let dots = '';
    for (let i = 1; i <= totalSteps; i++) {
        dots += `<span class="pagination-dot ${i === currentStep ? 'active' : ''}"></span>`;
    }

    return `
        <div class="shepherd-text-content">
            ${content}
        </div>
        <div class="shepherd-pagination-dots">
            ${dots}
        </div>
    `;
}

function openDrawerIfClosed(toggleSelector) {
    return () => {
        return new Promise((resolve) => {
            const toggle = document.querySelector(toggleSelector);
            if (toggle && !toggle.checked) {
                toggle.click();
            }
            setTimeout(resolve, 400); // Allow drawer animation
        });
    };
}
