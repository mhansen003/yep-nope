"use client";

import { useEffect, useRef, useState } from "react";
import { YUP_IMAGES, NOPE_IMAGES } from "../lib/images";

const CHIPS = [
  "Ever told on a homie?",
  "Should I quit my job and go all in?",
  "Is pineapple on pizza acceptable?",
  "Stock rims on a scraper?",
  "Am I a boss?",
  "Is it cool to text back three days later?",
];

const OPENER = {
  who: "him",
  kind: "text",
  text: "Everybody got choices. Ask me one thing and I'll tell you yep or nope. I don't do maybe.",
};

// Walks a shuffled copy of each pool so you see all 20 before any repeat.
function makeDealer(pool) {
  let deck = [];
  return () => {
    if (!deck.length) deck = [...pool].sort(() => Math.random() - 0.5);
    return deck.pop();
  };
}

export default function Page() {
  const [messages, setMessages] = useState([OPENER]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const feedEnd = useRef(null);
  const dealers = useRef(null);

  if (!dealers.current) {
    dealers.current = {
      yup: makeDealer(YUP_IMAGES),
      nope: makeDealer(NOPE_IMAGES),
    };
  }

  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  async function ask(question) {
    const q = question.trim();
    if (!q || thinking) return;
    setDraft("");
    setMessages((m) => [...m, { who: "me", kind: "text", text: q }]);
    setThinking(true);

    // Hold the typing dots for a beat even on a fast response - the pause is
    // most of the joke.
    const [result] = await Promise.all([
      fetch("/api/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      })
        .then((r) => r.json())
        .catch(() => ({
          verdict: "nope",
          line: "Connection folded under pressure. Try me again.",
        })),
      new Promise((r) => setTimeout(r, 850)),
    ]);

    const verdict = result.verdict === "nope" ? "nope" : "yup";
    setThinking(false);
    setMessages((m) => [
      ...m,
      {
        who: "him",
        kind: "verdict",
        verdict,
        line: result.line,
        img: dealers.current[verdict](),
      },
    ]);
  }

  return (
    <div className="shell">
      <header className="top">
        <h1 className="wordmark">
          <span className="y">Yep</span>
          <span className="slash">or</span>
          <span className="n">Nope</span>
        </h1>
        <p className="tag">Everybody got choices</p>
      </header>

      <main className="feed">
        {messages.map((m, i) =>
          m.kind === "verdict" ? (
            <div className="row him" key={i}>
              <div className={`card ${m.verdict}`}>
                <div className="frame">
                  <img
                    src={m.img}
                    alt={m.verdict === "yup" ? "Approving" : "Disapproving"}
                    width="768"
                    height="768"
                  />
                  <span className={`stamp ${m.verdict}`}>
                    {m.verdict === "yup" ? "Yep" : "Nope"}
                  </span>
                </div>
                <p className="line">{m.line}</p>
              </div>
            </div>
          ) : (
            <div className={`row ${m.who}`} key={i}>
              <div className="bubble">{m.text}</div>
            </div>
          )
        )}

        {thinking && (
          <div className="row him">
            <div className="bubble">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        )}
        <div ref={feedEnd} />
      </main>

      {messages.length === 1 && (
        <div className="chips">
          {CHIPS.map((c) => (
            <button className="chip" key={c} onClick={() => ask(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask me something..."
          maxLength={300}
          autoFocus
          aria-label="Your question"
        />
        <button type="submit" disabled={thinking || !draft.trim()}>
          Ask
        </button>
      </form>

      <footer className="foot">
        Inspired by the call-and-response of E-40&apos;s &ldquo;Choices
        (Yup)&rdquo; (2014). Unofficial fan parody. Artwork is an
        AI-generated original cartoon character, not a depiction of any real
        person.
      </footer>
    </div>
  );
}
