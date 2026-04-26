/**
 * Public review submission page.
 * Customers reach this via a link the business owner sends from the mobile app.
 * Hebrew RTL, no auth — the token in the URL is the credential.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ReviewContext {
  business: { name: string; logoUrl: string | null; slug: string };
  customer: { firstName: string; lastName: string };
  appointment: {
    startAt: string;
    service: { name: string } | null;
    staff: { name: string } | null;
  };
  alreadySubmitted: boolean;
  rating?: number | null;
  comment?: string | null;
  submittedAt?: string | null;
}

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [ctx, setCtx] = useState<ReviewContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/reviews/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setCtx(d);
      })
      .catch(() => setError('שגיאה בטעינת חוות הדעת'));
  }, [token]);

  async function submit() {
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/reviews/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const d = await res.json();
      if (d.error) {
        setError(d.error);
      } else {
        setDone(true);
      }
    } catch {
      setError('שגיאה בשליחה');
    }
    setSubmitting(false);
  }

  if (error) {
    return (
      <main className="rtl-page">
        <div className="card">
          <h1>שגיאה</h1>
          <p className="muted">{error}</p>
        </div>
        <Style />
      </main>
    );
  }

  if (!ctx) {
    return (
      <main className="rtl-page">
        <div className="card">
          <p className="muted">טוען…</p>
        </div>
        <Style />
      </main>
    );
  }

  if (ctx.alreadySubmitted || done) {
    return (
      <main className="rtl-page">
        <div className="card">
          <div className="checkmark">✓</div>
          <h1>תודה על חוות הדעת!</h1>
          <p className="muted">המשוב שלך עזר ל{ctx.business.name} להשתפר.</p>
        </div>
        <Style />
      </main>
    );
  }

  const apptDate = new Date(ctx.appointment.startAt).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="rtl-page">
      <div className="card">
        {ctx.business.logoUrl && (
          <img src={ctx.business.logoUrl} alt={ctx.business.name} className="logo" />
        )}
        <h1>{ctx.business.name}</h1>
        <p className="muted">
          היי {ctx.customer.firstName}, איך היה?
        </p>
        <div className="ctxBox">
          {ctx.appointment.service?.name && (
            <div>{ctx.appointment.service.name}</div>
          )}
          {ctx.appointment.staff?.name && (
            <div className="muted">{ctx.appointment.staff.name}</div>
          )}
          <div className="muted">{apptDate}</div>
        </div>

        <div className="stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`star ${n <= rating ? 'active' : ''}`}
              onClick={() => setRating(n)}
              aria-label={`${n} כוכבים`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="comment"
          placeholder="ספר/י לנו עוד (אופציונלי)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />

        <button
          type="button"
          className="submit"
          disabled={rating < 1 || submitting}
          onClick={submit}
        >
          {submitting ? 'שולח...' : 'שליחת חוות דעת'}
        </button>
      </div>
      <Style />
    </main>
  );
}

function Style() {
  return (
    <style jsx global>{`
      html, body { margin: 0; padding: 0; background: #f7f7f8; font-family: 'Noto Sans Hebrew', system-ui, sans-serif; }
      .rtl-page {
        direction: rtl;
        min-height: 100vh;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 32px 16px;
      }
      .card {
        background: #fff;
        border-radius: 24px;
        padding: 32px 24px;
        max-width: 440px;
        width: 100%;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,.05);
      }
      .card h1 { color: #0F172A; font-size: 22px; margin: 8px 0 6px; font-weight: 700; }
      .muted { color: #64748B; font-size: 14px; margin: 0; }
      .logo { width: 64px; height: 64px; border-radius: 16px; object-fit: cover; margin-bottom: 8px; }
      .ctxBox { background: #F7F7F8; border-radius: 12px; padding: 12px; margin: 16px 0 24px; font-size: 14px; }
      .ctxBox > div { padding: 2px 0; }
      .stars { display: flex; flex-direction: row-reverse; justify-content: center; gap: 4px; margin: 8px 0 20px; }
      .star { background: none; border: none; font-size: 36px; color: #E5E7EB; cursor: pointer; padding: 4px; transition: transform .1s; }
      .star:hover { transform: scale(1.1); }
      .star.active { color: #FBBF24; }
      .comment {
        width: 100%;
        box-sizing: border-box;
        background: #F7F7F8;
        border: 1px solid #E5E7EB;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 15px;
        font-family: inherit;
        resize: vertical;
        text-align: right;
        direction: rtl;
        margin-bottom: 16px;
      }
      .submit {
        width: 100%;
        background: #4F46E5;
        color: #fff;
        border: none;
        border-radius: 13px;
        padding: 16px;
        font-size: 16px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
      }
      .submit:disabled { opacity: .4; cursor: not-allowed; }
      .checkmark {
        width: 64px; height: 64px; border-radius: 32px;
        background: #DCFCE7; color: #166534;
        display: flex; align-items: center; justify-content: center;
        font-size: 32px; margin: 0 auto 12px;
      }
    `}</style>
  );
}
