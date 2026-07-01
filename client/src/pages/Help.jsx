import { useState } from "react";

const FAQ = [
  {
    q: "How do I add something to my pile?",
    a: "On your dashboard, use the 'Add to Pile' box at the top of the Pile tab. Paste a link or type a title. Expand for description, type, and link fields.",
  },
  {
    q: "What's the difference between Active and Paused?",
    a: "Active means you're currently working through an item. Paused means you've set it aside for now but haven't given up on it. Both live in the Active tab, in separate sections.",
  },
  {
    q: "How do I set a reading goal?",
    a: "Click any item in your Pile to open it, then click 'Set goal & start'. You'll pick a unit (pages, minutes, chapters) and how many days per week you want to read it.",
  },
  {
    q: "How do I check in?",
    a: "Open any Active item by clicking it. You'll see a 'Check in today' button in the modal. Each check-in counts as one day toward your weekly goal.",
  },
  {
    q: "What does archiving do?",
    a: "Archiving removes an item from your active pile without deleting it. Archived items live in the Archive tab and can be unarchived at any time.",
  },
  {
    q: "Can I edit an item after adding it?",
    a: "Yes. Click any item card to open it. All fields (title, description, type, link, source note) are editable right in the modal. Changes autosave on blur, or hit Save to save immediately.",
  },
  {
    q: "How do I change my username or avatar?",
    a: "Click your avatar in the top-right corner of the dashboard and choose 'Profile settings'.",
  },
  {
    q: "Is my data private?",
    a: "Your reading list is private by default. Reviews can be marked public or private when you write them.",
  },
];

export default function Help() {
  const [open, setOpen] = useState(null);

  return (
    <div className="static-page">
      <div className="static-page-inner">
        <h1 className="static-page-title">Help</h1>
        <div className="faq-list">
          {FAQ.map((item, i) => (
            <div className="faq-item" key={i}>
              <button
                className="faq-question"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {item.q}
                <span className="faq-chevron">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <p className="faq-answer">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
