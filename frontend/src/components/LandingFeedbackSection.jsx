import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react'
import { siteAPI } from '../services/api'
import { getPublicLang } from '../utils/landingRoutes'

export default function LandingFeedbackSection({ t, lang: langProp }) {
  const { pathname } = useLocation()
  const lang = langProp ?? getPublicLang(pathname)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await siteAPI.submitFeedback({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        message: message.trim(),
        page: pathname,
        lang,
      })
      setDone(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setError(err.response?.data?.message || t.feedbackError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="saran" className="py-16 sm:py-24 px-4 sm:px-6 lp-section-alt">
      <div className="max-w-3xl mx-auto lp-animate-in">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold lp-badge rounded-full px-3 py-1.5 mb-4">
            <MessageSquare size={14} />
            {t.feedbackBadge}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold lp-hero-title break-words">{t.feedbackTitle}</h2>
          <p className="mt-3 lp-muted text-sm sm:text-base max-w-xl mx-auto break-words">{t.feedbackSubtitle}</p>
        </div>

        {done ? (
          <div className="lp-feedback-success rounded-2xl p-6 sm:p-8 text-center">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-3" />
            <p className="font-semibold lp-hero-title">{t.feedbackThanksTitle}</p>
            <p className="mt-2 text-sm lp-muted break-words">{t.feedbackThanksText}</p>
            <button
              type="button"
              onClick={() => setDone(false)}
              className="mt-5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {t.feedbackSendAnother}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="lp-feedback-form rounded-2xl p-5 sm:p-8 space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 break-words">
                {error}
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label htmlFor="fb-name" className="lp-feedback-label">{t.feedbackName}</label>
                <input
                  id="fb-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.feedbackNamePlaceholder}
                  maxLength={120}
                  className="lp-feedback-input w-full"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="fb-email" className="lp-feedback-label">{t.feedbackEmail}</label>
                <input
                  id="fb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.feedbackEmailPlaceholder}
                  maxLength={254}
                  className="lp-feedback-input w-full"
                />
              </div>
            </div>
            <div className="min-w-0">
              <label htmlFor="fb-message" className="lp-feedback-label">{t.feedbackMessage}</label>
              <textarea
                id="fb-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.feedbackMessagePlaceholder}
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                className="lp-feedback-input w-full resize-y min-h-[120px]"
              />
              <p className="mt-1 text-xs lp-subtle text-right">{message.length}/2000</p>
            </div>
            <button
              type="submit"
              disabled={submitting || message.trim().length < 10}
              className="lp-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 font-medium px-6 py-3 rounded-xl disabled:opacity-50"
            >
              <Send size={16} />
              {submitting ? t.feedbackSending : t.feedbackSubmit}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
