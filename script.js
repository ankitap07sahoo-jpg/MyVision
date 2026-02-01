document.addEventListener('DOMContentLoaded', () => {

    
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li a'); // Select anchors

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            // Toggle Nav
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

    
    const form = document.getElementById('appointmentForm');

    if (form) {
        form.addEventListener('submit', (e) => {
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
                    input.style.borderColor = '#ddd'; // reset to default
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

                
                setTimeout(() => {
                    alert(`Thank you, ${name.value}! Your appointment request has been sent successfully. We will contact you at ${phone.value} shortly.`);
                    form.reset();
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }, 1500);
            }
        });
    }
});
