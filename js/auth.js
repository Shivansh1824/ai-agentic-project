import { supabase } from './supabase.js';

// DOM Elements utility
const el = (id) => document.getElementById(id);

// UI Helpers
const showError = (message) => {
  const errorContainer = el('error-container');
  if (errorContainer) {
    errorContainer.innerHTML = `<div class="alert alert-error">${message}</div>`;
    errorContainer.classList.remove('hidden');
  }
};

const showSuccess = (message) => {
  const errorContainer = el('error-container');
  if (errorContainer) {
    errorContainer.innerHTML = `<div class="alert alert-success">${message}</div>`;
    errorContainer.classList.remove('hidden');
  }
};

const clearMessages = () => {
  const errorContainer = el('error-container');
  if (errorContainer) {
    errorContainer.innerHTML = '';
    errorContainer.classList.add('hidden');
  }
};

const setLoading = (buttonId, isLoading) => {
  const btn = el(buttonId);
  if (btn) {
    if (isLoading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }
};

// --- AUTHENTICATION LOGIC ---

// Login
export const handleLogin = async (e) => {
  e.preventDefault();
  clearMessages();
  setLoading('login-btn', true);

  const email = el('email').value;
  const password = el('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  setLoading('login-btn', false);

  if (error) {
    showError(error.message);
  } else {
    // Redirect to dashboard on success
    window.location.href = 'dashboard.html';
  }
};

// Signup
export const handleSignup = async (e) => {
  e.preventDefault();
  clearMessages();
  setLoading('signup-btn', true);

  const email = el('email').value;
  const password = el('password').value;
  const confirmPassword = el('confirm-password').value;

  if (password !== confirmPassword) {
    showError("Passwords do not match");
    setLoading('signup-btn', false);
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  setLoading('signup-btn', false);

  if (error) {
    showError(error.message);
  } else {
    showSuccess("Registration successful! You can now log in.");
    // Optionally redirect after a delay
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }
};

// Reset Password Request
export const handleResetPassword = async (e) => {
  e.preventDefault();
  clearMessages();
  setLoading('reset-btn', true);

  const email = el('email').value;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html',
  });

  setLoading('reset-btn', false);

  if (error) {
    showError(error.message);
  } else {
    showSuccess("Password reset email sent! Check your inbox.");
  }
};

// Logout
export const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error logging out:', error.message);
  } else {
    window.location.href = 'index.html';
  }
};

// --- ROUTE PROTECTION & SESSION MANAGEMENT ---

export const checkAuthStatus = async (requireAuth = false) => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  const currentPath = window.location.pathname;
  const isAuthPage = currentPath.endsWith('index.html') || 
                     currentPath.endsWith('signup.html') || 
                     currentPath.endsWith('forgot-password.html') ||
                     currentPath === '/' || currentPath === '';

  if (requireAuth && !session) {
    // Protected route, no session
    window.location.href = 'index.html';
  } else if (isAuthPage && session) {
    // Auth page, already logged in
    window.location.href = 'dashboard.html';
  }

  // Update UI if user email element exists
  if (session && el('user-email')) {
    el('user-email').textContent = session.user.email;
  }

  // Setup auth state listener
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' && requireAuth) {
      window.location.href = 'index.html';
    } else if (event === 'SIGNED_IN' && isAuthPage) {
      window.location.href = 'dashboard.html';
    }
  });

  return session;
};

// Bind events on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = el('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const signupForm = el('signup-form');
  if (signupForm) signupForm.addEventListener('submit', handleSignup);

  const resetForm = el('reset-form');
  if (resetForm) resetForm.addEventListener('submit', handleResetPassword);

  const logoutBtn = el('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
});
