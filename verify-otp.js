// Backend API Configuration
const API_BASE_URL = 'https://a4js2xzywi.execute-api.us-east-1.amazonaws.com';

// Get email from URL params or localStorage
const urlParams = new URLSearchParams(window.location.search);
const userEmail = urlParams.get('email') || localStorage.getItem('verifyEmail') || 'your email';

// Display email
document.getElementById('emailDisplay').textContent = userEmail;

// Get all OTP input boxes
const otpInputs = document.querySelectorAll('.otp-input');
const verifyBtn = document.getElementById('verifyBtn');
const resendBtn = document.getElementById('resendBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const errorText = document.getElementById('errorText');

// Auto-focus first input on load
window.addEventListener('load', () => {
    otpInputs[0].focus();
});

// Handle OTP input with auto-focus and backspace
otpInputs.forEach((input, index) => {
    // Handle input
    input.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // Only allow numbers
        if (!/^\d$/.test(value) && value !== '') {
            e.target.value = '';
            return;
        }
        
        // Remove error styling
        input.classList.remove('error');
        hideError();
        
        // Move to next input if value is entered
        if (value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
        
        // Check if all inputs are filled
        checkIfComplete();
    });
    
    // Handle keydown for backspace
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            if (!input.value && index > 0) {
                // Move to previous input if current is empty
                otpInputs[index - 1].focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            otpInputs[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });
    
    // Handle paste
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        // Only process if it's a 6-digit number
        if (/^\d{6}$/.test(pastedData)) {
            pastedData.split('').forEach((char, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = char;
                }
            });
            otpInputs[5].focus();
            checkIfComplete();
        }
    });
});

// Check if all inputs are filled
function checkIfComplete() {
    const allFilled = Array.from(otpInputs).every(input => input.value !== '');
    verifyBtn.disabled = !allFilled;
}

// Get OTP value
function getOtpValue() {
    return Array.from(otpInputs).map(input => input.value).join('');
}

// Clear OTP inputs
function clearOtp() {
    otpInputs.forEach(input => {
        input.value = '';
        input.classList.remove('error', 'success');
    });
    otpInputs[0].focus();
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    successMessage.style.display = 'none';
    
    // Add error styling to inputs
    otpInputs.forEach(input => input.classList.add('error'));
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Show success message
function showSuccess() {
    successMessage.style.display = 'flex';
    errorMessage.style.display = 'none';
    
    // Add success styling to inputs
    otpInputs.forEach(input => input.classList.add('success'));
}

// Verify OTP
async function verifyOtp() {
    const otp = getOtpValue();
    
    if (otp.length !== 6) {
        showError('Please enter all 6 digits');
        return;
    }
    
    // Show loading state
    verifyBtn.disabled = true;
    document.getElementById('verifyBtnText').style.display = 'none';
    document.getElementById('verifyLoader').style.display = 'inline-block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/cognito-verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                otp: otp
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success
            showSuccess();
            
            // Store token if provided
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            
            // Clear verify email from storage
            localStorage.removeItem('verifyEmail');
            
            // Redirect to home page after 2 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } else {
            // Error from server
            showError(data.message || 'Invalid OTP. Please try again.');
            clearOtp();
        }
        
    } catch (error) {
        console.error('Verification error:', error);
        showError('Network error. Please try again.');
        clearOtp();
    } finally {
        // Reset button state
        document.getElementById('verifyBtnText').style.display = 'inline';
        document.getElementById('verifyLoader').style.display = 'none';
        verifyBtn.disabled = false;
    }
}

// Resend OTP
async function resendOtp() {
    resendBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/cognito-resend-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success feedback
            hideError();
            clearOtp();
            
            // Start countdown timer
            startResendTimer();
            
            // Show temporary success message
            const originalText = resendBtn.querySelector('#resendBtnText').textContent;
            resendBtn.querySelector('#resendBtnText').textContent = '✓ Code Sent!';
            setTimeout(() => {
                resendBtn.querySelector('#resendBtnText').textContent = originalText;
            }, 2000);
            
        } else {
            showError(data.message || 'Failed to resend code. Please try again.');
        }
        
    } catch (error) {
        console.error('Resend error:', error);
        showError('Network error. Please try again.');
    }
}

// Countdown timer for resend button
function startResendTimer() {
    let timeLeft = 30;
    const timerText = document.getElementById('timerText');
    const countdown = document.getElementById('countdown');
    
    resendBtn.style.display = 'none';
    timerText.style.display = 'block';
    
    const timer = setInterval(() => {
        timeLeft--;
        countdown.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            resendBtn.style.display = 'inline-flex';
            resendBtn.disabled = false;
            timerText.style.display = 'none';
        }
    }, 1000);
}

// Event listeners
verifyBtn.addEventListener('click', verifyOtp);
resendBtn.addEventListener('click', resendOtp);

// Allow Enter key to submit
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !verifyBtn.disabled) {
        verifyOtp();
    }
});

// Start initial countdown if this is first visit
if (!sessionStorage.getItem('resendTimerStarted')) {
    sessionStorage.setItem('resendTimerStarted', 'true');
    startResendTimer();
}
