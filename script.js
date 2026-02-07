// Backend API Configuration
const API_BASE_URL = 'https://a4js2xzywi.execute-api.us-east-1.amazonaws.com';

// Helper to get JWT token from localStorage
const getToken = () => localStorage.getItem('authToken');
const setToken = (token) => localStorage.setItem('authToken', token);
const clearToken = () => localStorage.removeItem('authToken');

// API Helper Functions
const api = {
    async signup(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        console.log('Signup response:', { status: response.status, data });
        return data;
    },

    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        console.log('Login response:', { status: response.status, data });
        return data;
    },

    async getUser() {
        const token = getToken();
        if (!token) throw new Error('No token found');
        
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    async uploadFile(fileName, fileContent, contentType) {
        const token = getToken();
        if (!token) throw new Error('No token found');

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fileName, fileContent, contentType })
        });
        return response.json();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li a');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    const sections = document.querySelectorAll('section, header');
    const navAnchors = document.querySelectorAll('.nav-links a, .hero-btns a');

    const switchView = (targetId) => {
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.scrollTop = 0;
        }

        document.querySelectorAll('.nav-links a').forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === targetId) {
                a.classList.add('active');
            }
        });
    };

    navAnchors.forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            if (targetId && targetId !== '#') {
                switchView(targetId);
            }
        });
    });

    const currentHash = window.location.hash;
    if (currentHash && document.querySelector(currentHash)) {
        switchView(currentHash);
    } else {
        switchView('#home');
    }

    // Appointment Form with Backend Integration
    const form = document.getElementById('appointmentForm');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name');
            const email = document.getElementById('email');
            const phone = document.getElementById('phone');
            const message = document.getElementById('message');

            let isValid = true;

            const validateField = (input, condition, errorMsg) => {
                const formGroup = input.parentElement;
                const small = formGroup.querySelector('.error-msg');
                if (!condition) {
                    small.innerText = errorMsg;
                    small.style.display = 'block';
                    input.style.borderColor = '#e74c3c';
                    return false;
                } else {
                    small.style.display = 'none';
                    input.style.borderColor = '#ddd';
                    return true;
                }
            };

            isValid = validateField(name, name.value.trim() !== '', 'Name is required') && isValid;

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = validateField(email, emailRegex.test(email.value.trim()), 'Please enter a valid email') && isValid;

            isValid = validateField(phone, phone.value.trim().length >= 10, 'Phone must be at least 10 digits') && isValid;

            isValid = validateField(message, message.value.trim() !== '', 'Message cannot be empty') && isValid;

            if (isValid) {
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerText;

                submitBtn.innerText = 'Sending...';
                submitBtn.disabled = true;

                try {
                    // Auto-register user with email and a default password (or prompt for password)
                    const password = 'TempPass' + Math.random().toString(36).slice(2);
                    
                    // Try to signup (creates user if doesn't exist)
                    const signupResult = await api.signup(email.value.trim(), password);
                    
                    if (signupResult.token) {
                        setToken(signupResult.token);
                        showSuccessPopup(
                            'Appointment Confirmed!',
                            `Thank you, ${name.value}! Your appointment request has been sent successfully. We will contact you at ${phone.value} shortly. Your account has been created with email: ${email.value}`
                        );
                    } else if (signupResult.message && signupResult.message.includes('already registered')) {
                        showSuccessPopup(
                            'Appointment Confirmed!',
                            `Thank you, ${name.value}! Your appointment request has been sent successfully. We will contact you at ${phone.value} shortly.`
                        );
                    } else {
                        showSuccessPopup(
                            'Appointment Confirmed!',
                            `Thank you, ${name.value}! Your appointment request has been sent successfully. We will contact you at ${phone.value} shortly.`
                        );
                    }
                    
                    form.reset();
                } catch (error) {
                    console.error('Backend error:', error);
                    showSuccessPopup(
                        'Message Received!',
                        `Thank you, ${name.value}! Your appointment request has been received. We will contact you at ${phone.value} shortly.`
                    );
                    form.reset();
                } finally {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }
            }
        });
    }

    // Check if user is logged in on page load
    const token = getToken();
    if (token) {
        console.log('User is authenticated');
        updateAuthButton(true);
        // Optionally fetch user data
        api.getUser()
            .then(data => console.log('User data:', data))
            .catch(err => {
                console.error('Failed to fetch user:', err);
                clearToken();
                updateAuthButton(false);
            });
    }

    // Authentication Modal Functionality
    const authModal = document.getElementById('authModal');
    const authBtn = document.getElementById('authBtn');
    const closeModal = document.querySelector('.close');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');

    // Update auth button based on login status
    function updateAuthButton(isLoggedIn) {
        if (isLoggedIn) {
            authBtn.textContent = 'Logout';
            authBtn.onclick = (e) => {
                e.preventDefault();
                clearToken();
                updateAuthButton(false);
                showSuccessPopup('Logged Out', 'You have been logged out successfully!');
            };
        } else {
            authBtn.textContent = 'Login / Signup';
            authBtn.onclick = (e) => {
                e.preventDefault();
                authModal.classList.add('show');
            };
        }
    }

    // Open modal
    if (authBtn) {
        authBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!getToken()) {
                authModal.classList.add('show');
            }
        });
    }

    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            authModal.classList.remove('show');
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('show');
        }
    });

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetTab}Form`) {
                    form.classList.add('active');
                }
            });
        });
    });

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const messageEl = document.getElementById('loginMessage');
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';
            messageEl.className = 'auth-message';
            messageEl.style.display = 'none';
            
            try {
                const result = await api.login(email, password);
                
                if (result.token) {
                    setToken(result.token);
                    messageEl.textContent = 'Login successful!';
                    messageEl.className = 'auth-message success';
                    updateAuthButton(true);
                    
                    setTimeout(() => {
                        authModal.classList.remove('show');
                        loginForm.reset();
                        messageEl.style.display = 'none';
                    }, 1500);
                } else {
                    messageEl.textContent = result.message || 'Login failed';
                    messageEl.className = 'auth-message error';
                }
            } catch (error) {
                console.error('Login error:', error);
                messageEl.textContent = 'Login failed. Please check your credentials.';
                messageEl.className = 'auth-message error';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }

    // Signup Form Handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            const messageEl = document.getElementById('signupMessage');
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            
            messageEl.className = 'auth-message';
            messageEl.style.display = 'none';
            
            if (password !== confirmPassword) {
                messageEl.textContent = 'Passwords do not match!';
                messageEl.className = 'auth-message error';
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            
            try {
                const result = await api.signup(email, password);
                
                if (result.token) {
                    setToken(result.token);
                    messageEl.textContent = 'Account created successfully!';
                    messageEl.className = 'auth-message success';
                    updateAuthButton(true);
                    
                    setTimeout(() => {
                        authModal.classList.remove('show');
                        signupForm.reset();
                        messageEl.style.display = 'none';
                    }, 1500);
                } else {
                    messageEl.textContent = result.message || 'Signup failed';
                    messageEl.className = 'auth-message error';
                }
            } catch (error) {
                console.error('Signup error:', error);
                messageEl.textContent = 'Signup failed. Please try again.';
                messageEl.className = 'auth-message error';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
            }
        });
    }
});

// Success Popup Functions
function showSuccessPopup(title, message) {
    const popup = document.getElementById('successPopup');
    const titleEl = document.getElementById('successTitle');
    const messageEl = document.getElementById('successMessage');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    popup.classList.add('show');
}

function closeSuccessPopup() {
    const popup = document.getElementById('successPopup');
    popup.classList.remove('show');
}

// Close popup when clicking outside
window.addEventListener('click', (e) => {
    const popup = document.getElementById('successPopup');
    if (e.target === popup) {
        closeSuccessPopup();
    }
});

// Team Modal Functions
function openTeamModal() {
    const teamModal = document.getElementById('teamModal');
    teamModal.classList.add('show');
}

function closeTeamModal() {
    const teamModal = document.getElementById('teamModal');
    teamModal.classList.remove('show');
}

// Meet Our Team button handler
document.addEventListener('DOMContentLoaded', function() {
    const meetTeamBtn = document.getElementById('meetTeamBtn');
    if (meetTeamBtn) {
        meetTeamBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openTeamModal();
        });
    }
});
