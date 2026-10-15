import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const form = document.querySelector('#profile-form');
const pageStatus = document.querySelector('#page-status');
const profileStatus = document.querySelector('#profile-status');
const emailInput = document.querySelector('#profile-email');
const displayNameInput = document.querySelector('#display-name');
const bioInput = document.querySelector('#bio');
const websiteInput = document.querySelector('#website');
const saveButton = document.querySelector('#save-profile');
const createdAt = document.querySelector('#created-at');

function setStatus(element, text, isError = false) {
  element.textContent = text;
  element.dataset.error = String(isError);
}

function redirectToLogin() {
  window.location.replace('./index.html?auth=login');
}

function setFormData(profile, email) {
  emailInput.value = email || '';
  displayNameInput.value = profile.display_name || '';
  bioInput.value = profile.bio || '';
  websiteInput.value = profile.website || '';
  const date = new Date(profile.created_at);
  createdAt.textContent = `Compte créé le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date)}.`;
}

const { data: { session }, error: sessionError } = await supabase.auth.getSession();
if (sessionError) {
  setStatus(pageStatus, sessionError.message, true);
} else if (!session) {
  redirectToLogin();
} else {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, bio, website, created_at')
    .eq('id', session.user.id)
    .single();

  if (error) {
    setStatus(pageStatus, 'Impossible de charger votre profil. Réessayez plus tard.', true);
  } else {
    setFormData(profile, session.user.email);
    pageStatus.hidden = true;
    form.hidden = false;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    setStatus(profileStatus, 'Enregistrement…');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayNameInput.value.trim(),
        bio: bioInput.value.trim(),
        website: websiteInput.value.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    saveButton.disabled = false;
    setStatus(profileStatus, updateError ? 'Impossible d’enregistrer le profil.' : 'Profil enregistré.', Boolean(updateError));
  });

  document.querySelector('#sign-out').addEventListener('click', async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setStatus(profileStatus, 'Impossible de fermer la session.', true);
    } else {
      redirectToLogin();
    }
  });
}