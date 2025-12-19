document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    initializeNavigation();
    initializeLanguage();
    handleMobileView();
});

function initializeSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const savedState = localStorage.getItem('sidebarState');

    if (savedState === 'collapsed') {
        document.body.classList.add('sidebar-collapsed');
    } else {
        document.body.classList.remove('sidebar-collapsed');
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            document.body.classList.toggle('sidebar-collapsed');
            
            const currentState = document.body.classList.contains('sidebar-collapsed') ? 'collapsed' : 'expanded';
            localStorage.setItem('sidebarState', currentState);
        });
    }
}

function initializeNavigation() {
    const currentPath = window.location.pathname;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
            link.closest('.nav-item').classList.add('active');
        }
    });

    // document.querySelectorAll('a[href*="/logout"]').forEach(link => {
    //     link.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
    //             localStorage.removeItem('authToken');
    //             sessionStorage.clear();
    //             window.location.href = '/auth/logout';
    //         }
    //     });
    // });

    const pageLinks = document.querySelectorAll('.nav-item a[href]:not([href*="logout"])');
    pageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('/') && !href.startsWith('//')) {
                e.preventDefault();
                document.body.classList.add('page-loading');
                setTimeout(() => {
                    window.location.href = href;
                }, 150);
            }
        });
    });

    const navTabs = document.querySelectorAll('.sidebar a[data-target], .sidebar-logo-container a[data-target]');
    navTabs.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            if (!targetId) return;

            document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
            const targetPage = document.getElementById(targetId);
            if (targetPage) targetPage.classList.add('active');

            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            const navItem = this.closest('.nav-item');
            if (navItem) navItem.classList.add('active');
        });
    });
}

async function initializeLanguage() {
    const savedLang = localStorage.getItem('language') || 'vi';
    await changeLanguage(savedLang);

    const trigger = document.getElementById('language-trigger');
    const dropdown = document.getElementById('language-dropdown-menu');

    if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = item.getAttribute('data-lang');
                changeLanguage(lang);
                dropdown.classList.remove('active');
            });
        });

        window.addEventListener('click', () => dropdown.classList.remove('active'));
    }
}

async function changeLanguage(lang) {
    try {
        const response = await fetch(`/lang/${lang}.json`);
        if (!response.ok) throw new Error("Language file not found");
        
        const translations = await response.json();
        
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.getAttribute('data-i18n-key');
            if (translations[key]) {
                if (el.tagName === 'INPUT') el.placeholder = translations[key];
                else el.innerText = translations[key];
            }
        });

        const currentFlag = document.getElementById('current-flag');
        const currentLang = document.getElementById('current-lang');
        if (currentFlag) {
            currentFlag.src = lang === 'vi' ? 'https://upload.wikimedia.org/wikipedia/commons/2/21/Flag_of_Vietnam.svg' : 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Flag_of_the_United_Kingdom_%281-2%29.svg/1200px-Flag_of_the_United_Kingdom_%281-2%29.svg.png';
            if (currentLang) currentLang.innerText = lang === 'vi' ? 'VN' : 'EN';
        }

        localStorage.setItem('language', lang);
    } catch (error) {
        console.error(error);
    }
}

function handleMobileView() {
    function checkWidth() {
        if (window.innerWidth <= 768) {
            document.body.classList.add('sidebar-collapsed');
        }
    }
    
    if (!localStorage.getItem('sidebarState')) {
        checkWidth();
    }
    
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
             document.body.classList.add('sidebar-collapsed');
        }
    });
}

window.submitComplaint = async function(event) {
    event.preventDefault();

    const form = document.getElementById('complaint-form');
    const btn = document.getElementById('btn-submit-complaint');
    const originalText = btn.innerText;

    btn.innerText = "Processing...";
    btn.disabled = true;

    const formData = {
        monHoc: document.getElementById('mon-hoc').value,
        maMonHoc: document.getElementById('ma-mon-hoc').value,
        noiDung: document.getElementById('noi-dung').value
    };

    try {
        const response = await fetch('/student/send-complaint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            form.style.display = 'none';
            document.getElementById('thank-you-message').style.display = 'block';
            form.reset();
        } else {
            alert(result.message);
        }

    } catch (error) {
        console.error(error);
        alert("Server connection error");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

window.resetComplaintForm = function() {
    document.getElementById('thank-you-message').style.display = 'none';
    document.getElementById('complaint-form').style.display = 'block';
};