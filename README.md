# YEP or NOPE

A chat-style oracle that answers any question with exactly one verdict: **Yep** or **Nope**.

Inspired by the call-and-response hook of E-40's "Choices (Yup)" (2014, *Sharp On All 4 Corners: Corner 1*),
where questions get fired off rapid-style and answered with a decisive yup or nope.

## How the verdict works

The yep/nope axis is not generic good-vs-bad. It follows the value system the song actually runs on:

- **Yep** - loyalty, hustle, getting money, staying solid, having heart, being fly, real craft
- **Nope** - snitching, hating, laziness, being broke on purpose, folding, being soft or fake

`app/api/verdict/route.js` encodes that as a system prompt against an OpenRouter model, with a
keyword heuristic fallback so the site still rules on things if the model call fails.

## The artwork

40 reaction images (20 yep, 20 nope), generated with `google/gemini-2.5-flash-image` (nano-banana)
via OpenRouter. One base character is generated first and then fed back as a vision reference on
every subsequent call, which is what keeps the same character across all 40 poses.

The character is an AI-generated original cartoon caricature. It is not a depiction of any real person.

## Local scripts

```bash
npm run images     # regenerate the 40 reaction images (needs OR_KEY_PATH)
npm run manifest   # rebuild lib/images.js from whatever is in public/e40
npm run build
```

## Env

| Name | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | Server-side key for the verdict classifier |

Unofficial fan parody. Not affiliated with E-40 or Sick Wid It Records.
