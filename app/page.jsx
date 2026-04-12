'use client';
import { useState } from 'react';

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [token, setToken] = useState('');
  const [disposableError, setDisposableError] = useState('');
  const [duplicateError, setDuplicateError] = useState('');
  const [formError, setFormError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setDisposableError('');
    setDuplicateError('');
    setLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (json.status === 'ok') {
        setSuccess({ nom: data.nom });
        setToken(json.token || '');
      }
      else if (json.status === 'disposable') setDisposableError(data.email);
      else if (json.status === 'duplicate') setDuplicateError(data.email);
      else setFormError(json.message || 'Une erreur est survenue.');
    } catch {
      setFormError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className="card">
        {success ? (
          <>
            <div className="ornament">◆ ◆ ◆</div>
            <div className="eyebrow">Accès Confirmé</div>
            <h1>Votre guide <em>vous attend</em></h1>
            <div className="divider"><span></span></div>
            <p className="success">
              Merci <strong>{success.nom}</strong>. Votre guide exclusif vous attend.
            </p>
            <a href={`/api/ebook?t=${encodeURIComponent(token)}`} className="btn-gold">Télécharger le guide</a>
            <p className="footer-note">Document envoyé également à votre adresse email</p>
          </>
        ) : (
          <>
            <div className="ornament">◆ ◆ ◆</div>
            <div className="eyebrow">Édition Limitée</div>
            <h1>Le guide des <em>événements d'exception</em></h1>
            <p className="lead">
              Découvrez les secrets d'une organisation événementielle de prestige.
              Un guide confidentiel réservé aux organisateurs exigeants.
            </p>
            <div className="divider"><span></span></div>
            {formError && <div className="error">{formError}</div>}
            <form onSubmit={handleSubmit} autoComplete="on">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }}
                aria-hidden="true"
              />
              <label>Nom & Prénom</label>
              <input name="nom" required maxLength={120} placeholder="Votre identité" />
              <label>Adresse email</label>
              <input type="email" name="email" required maxLength={254} placeholder="vous@domaine.com" />
              <label>Téléphone</label>
              <input name="telephone" required maxLength={20} placeholder="+33 ..." />
              <label>Secteur d'activité</label>
              <input name="domaine" required maxLength={120} placeholder="Votre domaine professionnel" />
              <button type="submit" disabled={loading}>
                {loading ? 'Envoi en cours…' : 'Recevoir le guide'}
              </button>
            </form>
            <p className="footer-note">Vos informations restent strictement confidentielles</p>
          </>
        )}
      </main>

      {disposableError && (
        <Dialog onClose={() => setDisposableError('')}>
          <div className="icon">◆ ◆ ◆</div>
          <h2>Adresse non acceptée</h2>
          <p>Pour préserver la qualité de notre audience, nous n'acceptons que les adresses professionnelles ou personnelles reconnues.</p>
          <div className="mail">{disposableError}</div>
          <p>Merci d'utiliser votre email <strong style={{ color: 'var(--gold)' }}>professionnel</strong> ou une adresse Gmail, Outlook, iCloud…</p>
          <button onClick={() => setDisposableError('')}>Réessayer</button>
        </Dialog>
      )}

      {duplicateError && (
        <Dialog onClose={() => setDuplicateError('')}>
          <div className="icon">◆ ◆ ◆</div>
          <h2>Adresse déjà utilisée</h2>
          <p>Cette adresse email a déjà été enregistrée pour recevoir notre guide exclusif.</p>
          <div className="mail">{duplicateError}</div>
          <p>Merci d'utiliser une <strong style={{ color: 'var(--gold)' }}>autre adresse email</strong> pour poursuivre.</p>
          <button onClick={() => setDuplicateError('')}>Réessayer</button>
        </Dialog>
      )}
    </>
  );
}

function Dialog({ children, onClose }) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dlg">{children}</div>
      </div>
    </div>
  );
}
