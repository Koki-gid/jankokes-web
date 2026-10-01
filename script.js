// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navMobile = document.getElementById('navMobile');

if (navToggle && navMobile) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMobile.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navMobile.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMobile.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Contact form: Google Apps Script (tabulka + e-mail z Gmailu) a záloha ve Web3Forms
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzijlvcr6xOObYkLgeaEVG6DMkNxizsRp6Za1JyOJr1DO3xX-GkJudHrA3vOfsJ3EmN/exec';
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Odesílám...';
    status.textContent = '';
    status.className = 'form-status';

    const formData = new FormData(form);
    if (!formData.get('zdroj')) formData.set('zdroj', location.pathname);

    const toGoogle = fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      body: new URLSearchParams(formData),
    }).then(() => true).catch(() => false);

    const toWeb3Forms = fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' },
    }).then((r) => r.json()).then((r) => !!r.success).catch(() => false);

    // Úspěch hned, jakmile potvrdí kterákoli cesta (Google bývá pomalejší, dojede i po zavření stránky).
    const ok = await new Promise((resolve) => {
      let pending = 2;
      const done = (v) => { if (v) resolve(true); else if (--pending === 0) resolve(false); };
      toGoogle.then(done);
      toWeb3Forms.then(done);
    });

    if (ok) {
      status.textContent = '✅ Děkuji, zpráva odešla! Ozvu se vám do 24 hodin.';
      status.classList.add('success');
      form.reset();
    } else {
      status.textContent = 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu nebo mi napište přímo na jankokes.ai@gmail.com.';
      status.classList.add('error');
    }
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
