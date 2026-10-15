import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const dialog = document.querySelector('#auth-dialog');
const trigger = document.querySelector('#auth-trigger');
const form = document.querySelector('#auth-form');
const formView = document.querySelector('#auth-form-view');
const accountView = document.querySelector('#auth-account');
const title = document.querySelector('#auth-title');
const nameField = document.querySelector('#auth-name-field');
const nameInput = document.querySelector('#auth-name');
const emailInput = document.querySelector('#auth-email');
const passwordInput = document.querySelector('#auth-password');
const submitButton = document.querySelector('#auth-submit');
const message = document.querySelector('#auth-message');
const accountName = document.querySelector('#auth-account-name');
const accountEmail = document.querySelector('#auth-account-email');
const accountMessage = document.querySelector('#auth-account-message');
const modeButtons = [...document.querySelectorAll('[data-auth-mode]')];

let mode = 'login';

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.dataset.error = String(isError);
}

function setMode(nextMode) {
  mode = nextMode;
  const isSignup = mode === 'signup';
  nameField.hidden = !isSignup;
  nameInput.required = isSignup;
  passwordInput.autocomplete = isSignup ? 'new-password' : 'current-password';
  title.textContent = isSignup ? 'Créer un compte' : 'Connexion';
  submitButton.textContent = isSignup ? 'Créer mon compte' : 'Se connecter';
  modeButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.authMode === mode));
  });
  setMessage(message, '');
}

function renderSession(session) {
  const user = session?.user;
  formView.hidden = Boolean(user);
  accountView.hidden = !user;
  trigger.textContent = user ? 'Mon compte' : 'Connexion';
  if (user) {
    accountName.textContent = user.user_metadata?.display_name || 'Mon compte';
    accountEmail.textContent = user.email || '';
    setMessage(accountMessage, '');
  }
}

trigger.addEventListener('click', () => dialog.showModal());
document.querySelector('#auth-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.authMode));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  setMessage(message, mode === 'signup' ? 'Création du compte…' : 'Connexion…');

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const result = mode === 'signup'
    ? await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: nameInput.value.trim() } },
    })
    : await supabase.auth.signInWithPassword({ email, password });

  submitButton.disabled = false;
  if (result.error) {
    setMessage(message, result.error.message, true);
    return;
  }

  if (mode === 'signup' && !result.data.session) {
    setMessage(message, 'Compte créé. Consultez votre boîte mail pour confirmer votre adresse.');
    return;
  }

  dialog.close();
});

document.querySelector('#auth-sign-out').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  setMessage(accountMessage, error ? error.message : 'Vous êtes déconnecté.', Boolean(error));
  if (!error) dialog.close();
});

supabase.auth.onAuthStateChange((_event, session) => renderSession(session));
const { data: { session } } = await supabase.auth.getSession();
renderSession(session);