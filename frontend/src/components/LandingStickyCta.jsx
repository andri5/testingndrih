import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function LandingStickyCta({ label }) {
  return (
    <div className="lp-sticky-cta md:hidden" aria-hidden={false}>
      <Link to="/register" className="lp-sticky-cta__btn">
        <span>{label}</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
