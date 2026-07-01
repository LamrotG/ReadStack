import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HOW_STEPS = [
  {
    n: "01",
    icon: "📥",
    title: "Dump the pile",
    desc: "Paste a link or type a title. Your pile grows as fast as your curiosity — add anything, anytime.",
  },
  {
    n: "02",
    icon: "🎯",
    title: "Set a pace",
    desc: "Pick a daily unit and how many days a week. No algorithm — just your plan, in your own words.",
  },
  {
    n: "03",
    icon: "✅",
    title: "Check in",
    desc: "Log each session when you sit down to read. Watch the pile actually shrink. That's the whole thing.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is ReadStack free?",
    a: "Yes, ReadStack is free to use.",
  },
  {
    q: "What counts as a reading session?",
    a: "Whatever you decide. A check-in is just you saying you read today. No timers, no page tracking — just your word.",
  },
  {
    q: "Can I track books and articles together?",
    a: "Yes. Books, articles, posts, links — they all go in the same pile. Each item can have its own goal.",
  },
  {
    q: "What's the difference between Active and Paused?",
    a: "Active means you're currently working through it. Paused means you've set it aside for now but haven't given up on it.",
  },
  {
    q: "Is there a mobile app?",
    a: "ReadStack works in any browser on any device. A dedicated app may come later.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <h1 className="landing-headline">
          Save what you actually mean to read<br />
          and <em>Actually get through it</em>
        </h1>
        <p className="landing-sub">
          A to-do list built specifically for reading. Not a reader, not a social network.
          You dump the pile, set a pace, and check in when you do the work.
        </p>
        <div className="landing-cta-pair">
          <button
            className="btn btn-primary"
            style={{ fontSize: 15, padding: "11px 28px" }}
            onClick={() => navigate("/auth/signup")}
          >
            Get Started
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 15, padding: "11px 28px" }}
            onClick={() => navigate("/auth/login")}
          >
            Sign In
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how">
        <div className="landing-how-inner">
          <p className="landing-section-label">How it works</p>
          <h2 className="landing-section-title">Three steps, no friction</h2>
          <div className="landing-steps">
            {HOW_STEPS.map(s => (
              <div className="landing-step" key={s.n}>
                <span className="landing-step-icon">{s.icon}</span>
                <span className="landing-step-number">{s.n}</span>
                <h3 className="landing-step-title">{s.title}</h3>
                <p className="landing-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-faq">
        <div className="landing-faq-inner">
          <p className="landing-section-label">FAQ</p>
          <h2 className="landing-section-title">Common questions</h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div className="faq-item" key={i}>
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                  <span className="faq-chevron">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <p className="faq-answer">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
