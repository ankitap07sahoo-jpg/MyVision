/**
 * Frontend Cognito Authentication Module
 * 
 * This module provides client-side integration with Cognito-based authentication
 * while maintaining compatibility with the existing UI.
 * 
 * Simply replace the existing API calls with cognito API calls
 * to switch to Cognito authentication.
 */

// Backend API Configuration (Update this to your Cognito endpoints)
const COGNITO_API_BASE_URL = 'https://a4js2xzywi.execute-api.us-east-1.amazonaws.com';

// Token management
const getToken = () => localStorage.getItem('authToken');
const setToken = (token) => localStorage.setItem('authToken', token);
const clearToken = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
};
const setTokens = (accessToken, idToken, refreshToken) => {
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('refreshToken', refreshToken);
};

/**
 * Cognito API Helper Functions
 * 
 * These functions call your Cognito-based backend endpoints
 * and handle responses in a format compatible with your existing UI
 */
const cognitoAPI = {
    /**
     * Sign up a new user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<object>} - Signup response
     */
    async signup(email, password) {
        try {
            const response = await fetch(`${COGNITO_API_BASE_URL}/auth/cognito-signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            console.log('Cognito Signup response:', { status: response.status, data });
            
            return { 
                ...data, 
                status: response.status, 
                ok: response.ok 
            };
        } catch (error) {
            console.error('Cognito Signup error:', error);
            return {
                ok: false,
                status: 500,
                message: 'Network error during signup'
            };
        }
    },

    /**
     * Log in an existing user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<object>} - Login response with tokens
     */
    async login(email, password) {
        try {
            const response = await fetch(`${COGNITO_API_BASE_URL}/auth/cognito-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            console.log('Cognito Login response:', { status: response.status, data });
            
            // Store tokens on successful login
            if (response.ok && data.token) {
                setTokens(data.token, data.idToken, data.refreshToken);
            }
            
            return { 
                ...data, 
                status: response.status, 
                ok: response.ok 
            };
        } catch (error) {
            console.error('Cognito Login error:', error);
            return {
                ok: false,
                status: 500,
                message: 'Network error during login'
            };
        }
    },

    /**
     * Verify email with OTP code
     * @param {string} email - User's email
     * @param {string} otp - Verification code
     * @returns {Promise<object>} - Verification response
     */
    async verifyEmail(email, otp) {
        try {
            const response = await fetch(`${COGNITO_API_BASE_URL}/auth/cognito-verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            
            const data = await response.json();
            console.log('Cognito Verify Email response:', { status: response.status, data });
            
            return { 
                ...data, 
                status: response.status, 
                ok: response.ok 
            };
        } catch (error) {
            console.error('Cognito Verify Email error:', error);
            return {
                ok: false,
                status: 500,
                message: 'Network error during verification'
            };
        }
    },

    /**
     * Resend verification code
     * @param {string} email - User's email
     * @returns {Promise<object>} - Resend response
     */
    async resendCode(email) {
        try {
            const response = await fetch(`${COGNITO_API_BASE_URL}/auth/cognito-resend-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            console.log('Cognito Resend Code response:', { status: response.status, data });
            
            return { 
                ...data, 
                status: response.status, 
                ok: response.ok 
            };
        } catch (error) {
            console.error('Cognito Resend Code error:', error);
            return {
                ok: false,
                status: 500,
                message: 'Network error while resending code'
            };
        }
    },

    /**
     * Get current user information
     * @returns {Promise<object>} - User data
     */
    async getUser() {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No token found');
            }
            
            const response = await fetch(`${COGNITO_API_BASE_URL}/cognito-user`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Token might be expired, try to refresh
                if (response.status === 401) {
                    const refreshed = await this.refreshToken();
                    if (refreshed.ok) {
                        // Retry with new token
                        return this.getUser();
                    }
                }
                throw new Error(data.message || 'Failed to get user');
            }
            
            return data;
        } catch (error) {
            console.error('Cognito Get User error:', error);
            throw error;
        }
    },

    /**
     * Refresh access token using refresh token
     * @returns {Promise<object>} - New tokens
     */
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token found');
            }
            
            const response = await fetch(`${COGNITO_API_BASE_URL}/auth/cognito-refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            
            const data = await response.json();
            
            if (response.ok && data.token) {
                // Update tokens
                setTokens(data.token, data.idToken, refreshToken);
            }
            
            return { 
                ...data, 
                status: response.status, 
                ok: response.ok 
            };
        } catch (error) {
            console.error('Cognito Refresh Token error:', error);
            return {
                ok: false,
                status: 500,
                message: 'Failed to refresh token'
            };
        }
    },

    /**
     * Log out current user
     * @returns {Promise<object>} - Logout response
     */
    async logout() {
        try {
            const token = getToken();
            
            const response = await fetch(`${COGNITO_API_BASE_URL}/auth/cognito-logout`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Clear local tokens regardless of response
            clearToken();
            
            const data = await response.json();
            return { 
                ...data, 
                status: response.status, 
                ok: response.ok 
            };
        } catch (error) {
            console.error('Cognito Logout error:', error);
            // Clear tokens even on error
            clearToken();
            return {
                ok: true,
                status: 200,
                message: 'Logged out'
            };
        }
    }
};

/**
 * Auto-refresh token before expiration
 * Set up automatic token refresh 5 minutes before expiration
 */
function setupAutoRefresh() {
    const expiresIn = 60; // Cognito default: 60 minutes
    const refreshBeforeExpiry = 5; // Refresh 5 minutes before expiration
    const refreshInterval = (expiresIn - refreshBeforeExpiry) * 60 * 1000;
    
    setInterval(async () => {
        const token = getToken();
        if (token) {
            console.log('Auto-refreshing token...');
            const result = await cognitoAPI.refreshToken();
            if (!result.ok) {
                console.error('Auto-refresh failed, logging out...');
                await cognitoAPI.logout();
                // Redirect to login if needed
                window.location.reload();
            }
        }
    }, refreshInterval);
}

// Initialize auto-refresh if user is logged in
if (getToken()) {
    setupAutoRefresh();
}

/**
 * Usage Instructions:
 * 
 * To switch from custom auth to Cognito auth, simply replace:
 * 
 * OLD:
 * const result = await api.signup(email, password);
 * 
 * NEW:
 * const result = await cognitoAPI.signup(email, password);
 * 
 * The response format is identical, so no other changes needed!
 * 
 * Similarly for other methods:
 * - api.login() → cognitoAPI.login()
 * - api.getUser() → cognitoAPI.getUser()
 * - etc.
 */

// Export for use in your application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { cognitoAPI, getToken, setToken, clearToken };
}
