// Load Meta only after explicit consent. Never include form contents in events.
(() => {
  const key = 'jk-marketing-consent-v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  let enabled = false;
  let initialized = false;
  let pageViewSent = false;
  let choice;
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (stored && Date.now() - stored.at < lifetime && ['granted', 'denied'].includes(stored.value)) choice = stored.value;
  } catch (_) { /* Unavailable storage means ask again on next visit. */ }

  const panel = document.createElement('section');
  panel.className = 'cookie-panel';
  panel.setAttribute('aria-label', 'Reklamní cookies');
  panel.innerHTML = '<h2>Pomůžeš mi měřit reklamu?</h2><p>S tvým souhlasem použiji Meta Pixel pro měření návštěv a odeslaných poptávek. Formulář funguje i bez něj. <a href="/ochrana-osobnich-udaju.html">Podrobnosti o soukromí</a></p><div class="cookie-actions"><button type="button" data-choice="denied">Odmítnout</button><button type="button" data-choice="granted">Povolit měření</button></div>';
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'cookie-settings';
  settings.textContent = 'Nastavení cookies';
  document.body.append(panel, settings);

  function enable() {
    enabled = true;
    if (!initialized) {
      initialized = true;
      const fbq = window.fbq = function () {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
        else fbq.queue.push(arguments);
      };
      window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      fbq('consent', 'grant');
      fbq('set', 'autoConfig', false, '1574056971188773');
      fbq('init', '1574056971188773');
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.append(script);
    } else window.fbq('consent', 'grant');
    if (!pageViewSent) {
      window.fbq('track', 'PageView');
      pageViewSent = true;
    }
  }

  function disable() {
    enabled = false;
    if (initialized) window.fbq('consent', 'revoke');
    for (const name of ['_fbp', '_fbc']) {
      for (const domain of ['', location.hostname, '.' + location.hostname, '.jankokes.cz']) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '');
      }
    }
  }

  panel.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
    choice = button.dataset.choice;
    try { localStorage.setItem(key, JSON.stringify({ value: choice, at: Date.now() })); } catch (_) {}
    if (choice === 'granted') enable(); else disable();
    panel.hidden = true;
    settings.hidden = false;
  }));
  settings.addEventListener('click', () => {
    panel.hidden = false;
    settings.hidden = true;
    panel.querySelector('button').focus();
  });
  document.addEventListener('secondmind:lead-confirmed', () => {
    if (enabled) window.fbq('track', 'Lead');
  });
  panel.hidden = !!choice;
  settings.hidden = !choice;
  if (choice === 'granted') enable();
})();
