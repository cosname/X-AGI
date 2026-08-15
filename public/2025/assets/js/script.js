document.addEventListener("DOMContentLoaded", function() {
    const navbar = document.querySelector('.navbar');

    // 只在有导航栏时执行
    if (navbar) {
        window.addEventListener('scroll', function() {
            // 当页面滚动超过一屏（或一个较小的值，如50px）时，添加scrolled类
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 根据当前页面URL设置导航栏的active状态
    const currentLocation = window.location.href;
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

    navLinks.forEach(link => {
        if (link.href === currentLocation) {
            // 移除所有链接的active类
            navLinks.forEach(l => l.classList.remove('active'));
            // 为当前页面链接添加active类
            link.classList.add('active');
        }
    });
    // One-time attention pulse for desktop register button (navbar right)
    try {
        const desktop = window.matchMedia('(min-width: 992px)').matches;
        if (desktop) {
            const regBtn = document.querySelector('.btn.btn-register.d-none.d-lg-flex');
            const heroBtn = document.querySelector('.btn-new-register') || document.querySelector('.hero-vertical .btn-hero-register');
            const nudgedReg = localStorage.getItem('registerBtnNudged');
            if (nudgedReg !== '1') {
                if (regBtn) {
                    regBtn.classList.add('attn');
                    regBtn.addEventListener('animationend', () => {
                        regBtn.classList.remove('attn');
                        localStorage.setItem('registerBtnNudged', '1');
                    }, { once: true });
                } else if (heroBtn) {
                    heroBtn.classList.add('attn');
                    heroBtn.addEventListener('animationend', () => {
                        heroBtn.classList.remove('attn');
                        localStorage.setItem('registerBtnNudged', '1');
                    }, { once: true });
                }
            }
        }
    } catch (e) { /* noop */ }
        // Add a short attention pulse to the mobile hamburger on first visit
        const toggler = document.querySelector('.navbar-toggler');
        const isMobile = window.matchMedia('(max-width: 991.98px)').matches;
        try {
            const nudged = localStorage.getItem('togglerNudged');
            if (toggler && isMobile && nudged !== '1') {
                toggler.classList.add('attn');
                toggler.addEventListener('animationend', () => {
                    toggler.classList.remove('attn');
                    localStorage.setItem('togglerNudged', '1');
                }, { once: true });
            }
        } catch (e) {
            // noop if storage unavailable
        }
});

document.addEventListener('DOMContentLoaded', function() {
    // Controlled two-line header: split at first '&' for non-home page headers
    try {
        document.querySelectorAll('.page-header .header-content h1').forEach(h1 => {
            if (h1.querySelector('.h1-first')) return; // already processed
            const raw = (h1.textContent || '').trim();
            const m = raw.match(/^(.*?&)\s*(.+)$/);
            if (m && m[1] && m[2]) {
                const first = m[1].trim();
                const second = m[2].trim();
                h1.innerHTML = `<span class="h1-first">${first}</span> <span class=\"h1-second\">${second}</span>`;
            }
        });
    } catch (e) { /* noop */ }
});

document.addEventListener('DOMContentLoaded', function() {
    // Stabilize navbar on mobile: lock body scroll to preserve position when menu is open
    const navCollapse = document.getElementById('navbarNav');
    if (navCollapse) {
        navCollapse.addEventListener('show.bs.collapse', function () {
            // Only mark nav-open; avoid fixed-body which can hide the bar/address bar interactions
            document.body.classList.add('nav-open');
        });
        navCollapse.addEventListener('hidden.bs.collapse', function () {
            document.body.classList.remove('nav-open');
            // No need to restore fixed positioning; keep scroll position naturally
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // 让展开箭头状态与 Bootstrap 折叠组件真实状态保持同步
    const togglers = document.querySelectorAll('.session-speaker[data-bs-target]');

    togglers.forEach(toggler => {
        const targetSelector = toggler.getAttribute('data-bs-target');
        const target = document.querySelector(targetSelector);
        if (!target) return;

        const syncArrow = () => {
            if (target.classList.contains('show')) {
                toggler.classList.add('expanded');
            } else {
                toggler.classList.remove('expanded');
            }
        };

        // 初始化箭头方向
        syncArrow();

    // 在折叠/展开开始时立即同步箭头，提升响应速度
    target.addEventListener('show.bs.collapse', () => toggler.classList.add('expanded'));
    target.addEventListener('hide.bs.collapse', () => toggler.classList.remove('expanded'));
    // 结束时再兜底同步一次，防止异常导致状态不同步
    target.addEventListener('shown.bs.collapse', syncArrow);
    target.addEventListener('hidden.bs.collapse', syncArrow);
    });
});


// --- Schedule Page Scrolling ---
document.addEventListener('DOMContentLoaded', function() {
    const scheduleTabsContainer = document.querySelector('.schedule-tabs');
    if (scheduleTabsContainer) {
        const scheduleTabs = scheduleTabsContainer.querySelectorAll('.nav-link');

        scheduleTabs.forEach(tab => {
            tab.addEventListener('click', function(event) {
                // If this is the expand-all control, let its own handler manage and skip filter switching
                if (this.getAttribute('data-role') === 'expand-toggle') {
                    return; // expand-all has its own handler below
                }
                event.preventDefault();

                // Update active class
                scheduleTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                // Scroll to target
                const targetSelector = this.getAttribute('data-target');
                const targetElement = document.querySelector(targetSelector);

                if (targetElement) {
                    const navbarHeight = document.querySelector('.navbar').offsetHeight;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navbarHeight - 20; // 20px extra space

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    // Expand/Collapse all talks on schedule page
    const expandAllBtn = document.getElementById('expandAllTalks');
    if (expandAllBtn) {
        let expanded = false;
        const updateButtonLabel = () => {
            expandAllBtn.textContent = expanded ? '收起全部演讲' : '展开全部演讲';
            // also reflect active style like tabs without interfering with filter state
            if (expanded) expandAllBtn.classList.add('active'); else expandAllBtn.classList.remove('active');
        };
        updateButtonLabel();

        expandAllBtn.addEventListener('click', function(event) {
            event.preventDefault();
            const collapses = document.querySelectorAll('.session-list .collapse');
            collapses.forEach(el => {
                const bsCollapse = bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
                if (!expanded) {
                    bsCollapse.show();
                } else {
                    bsCollapse.hide();
                }
            });
            expanded = !expanded;
            updateButtonLabel();

            // sync arrow state for all togglers
            document.querySelectorAll('.session-speaker[data-bs-target]').forEach(toggler => {
                const target = document.querySelector(toggler.getAttribute('data-bs-target'));
                if (target) {
                    if (expanded) toggler.classList.add('expanded'); else toggler.classList.remove('expanded');
                }
            });
        });
    }
});
