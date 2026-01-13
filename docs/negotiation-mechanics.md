# Negotiation Mechanics - Technical Documentation

This guide walks through the current negotiation experience in Discurso. It gives developers quick context, pointers into the code, and a feel for how the pieces fit together.

## Purpose
- Capture how Discurso currently orchestrates AI and P2P negotiations in a reader-friendly way.
- Connect UI behaviour, real-time sync, and persistence logic so future feature work and debugging have one handy place to check.
- Highlight the differences between AI-vs-human and human-vs-human rounds, including auto-finalisation, survey requirements, and transcript handling.

## Component Map

### Client React Surface
- `app/(inner)/negotiator/events/[eventId]/[roundId]/page.jsx` (`AgreementPage`): top-level page that loads data, manages UI state, and wires child components.
- `components/negotiation/EventViewHeader.jsx`: renders round timer, navigation, and flow controls.
- `components/negotiation/CasePanel.jsx`: presents the case instructions for the current side.
- `components/negotiation/ChatPanel.jsx` → `components/negotiation/ChatWindow.jsx`: chat experience for both AI and P2P rounds.
- `components/negotiation/AgreementPanel.jsx`: agreement editor plus status badges and AI offer view.
- `components/negotiation/SurveyOfSatisfaction.jsx`: SVI form shown after a deal.
- `components/TranscriptUpload.tsx`: modal upload when `inAppChat` is false.

### Shared Hooks & Utilities
- `hooks/useChatWindowState.js`: centralises chat state, message sending, Firestore subscriptions, and auto-finalisation logic.
- `lib/util.js`: hashing helpers for negotiation IDs, timer calculations, etc.

### Server Endpoints / Actions
- `app/api/data/events/[eventId]/[participantId]/route.js`: loads everything the page needs for a round, including historical negotiations.
- `app/api/data/results/[eventId]/[participantId]/route.js`: persists agreements, surveys, and AI auto-results.
- `actions/ai.js#getNegotiationResponse`: wraps the negotiation LLM flow.
- `actions/feedbacks.js`: generates SVI proxies for AI opponents and optional feedback.
- `lib/server/data/results.js`: `saveResult` and helpers that enforce persistence rules.
- `lib/server/data/practice.js`: builds negotiation IDs and fetches stored messages.
- `lib/client/data.js`: real-time Firestore listeners and P2P message senders.

### Firestore Collections
- `events`: round metadata (`startTime`, `endTime`, `aiSide`, `inAppChat`, matches, etc.).
- `cases`: parameter definitions and scoring formulas.
- `messages`: AI negotiation transcripts.
- `p2pMessages`: real-time chat between human teams.
- `results`: agreements, SVI data, and negotiation metadata.
- `feedback`: generated feedback after AI rounds.

## High-Level Lifecycle
1. **Initial render**: `AgreementPage` mounts, infers layout direction, and waits for `useUser`.
2. **Data fetch**: once the user is known, `fetchData()` calls `GET /api/data/events/{eventId}/{uid}?round={roundId}`.
3. **State priming**: response data populates local React state (case parameters, messages, existing results, timers, vsAI flag, `inAppChat` flag, etc.). Saved agreements hydrate `acase.params`, and stored survey answers flip `requiresSVI` off client-side.
4. **Real-time sync**: `useChatWindowState` subscribes to Firestore for P2P rounds (messages, agreements, conflicts) using the negotiation ID (`negId`).
5. **Interaction**: chat input, agreement editing, and survey submission flow through the handlers on `AgreementPage`.
6. **Persistence**: every save funnels through `handleSubmit` → `POST /api/data/results/...` → `saveResult`.
7. **Completion**: AI rounds redirect to feedback once SVI completes; P2P rounds show a “Congratulations” modal and optionally prompt for transcript upload when chat happened outside the app.

## Layout & Navigation
- **Direction**: `direction` becomes `"vertical"` on viewports < 1024px; otherwise `"horizontal"`. The layout adjuster runs on resize.
- **View flow**: `EventViewHeader` controls the `Negotiation → Agreement → Feedback` tabs. The flow can be locked by `requiresSVI`, unfinished deals (no `madeDeal` yet), or whenever no chat transcript exists—`EventViewHeader` hides the Feedback step until messages arrive (common for AI stalemates and external-chat rounds).
- **Agreement-only mode**: `?onlyAgreement=true` forces the Agreement + Survey stack. The page also auto-navigates here during:
  - AI timeouts (`handleAiAgreed(..., timedout=true)`),
  - AI rounds with a recorded outcome (deal or no-deal) that still owe the SVI,
  - P2P rounds with a saved agreement or no-deal result while SVI remains outstanding.
- **In-app vs external chat**: `isInAppChat` toggles whether chat input is shown. When false the user only sees the agreement form and, after finalisation, the transcript upload CTA.

## Data Retrieval & Initialisation
The event endpoint pieces together a round-specific payload:

- Checks access and round timing (returns `403` if the round hasn’t started).
- Picks the right case instructions for the participant’s language and side.
- Determines `vsAI` from `round.aiSide`.
- Locates both teams for the match. If the participant is skipped for the round (`participant.rounds` missing the index) the endpoint returns `null`.
- Fetches stored messages:
  - AI: grabs from `messages` via `getNegMessages`.
  - P2P: builds a deterministic negId with `makeP2PNegId` and reads `p2pMessages`.
- Pulls any saved result, plus the opponent’s result to pre-populate `madeDeal` and conflict flags.
- Detects `requiresSVI` (`case.relationRatio[0] > 0`) and `inAppChat`.
- Returns survey definition from `getRoundSurvey()` (7-point Likert scale).
- Supplies `aiParams` when the round is configured with custom AI behaviour.

On the client, `fetchData()`:
- Copies any stored agreement values into `acase.params` so editors show the saved state.
- Builds `formData` by merging survey definitions with stored answers.
- Calculates `hasAgreement`, `madeDeal`, `isAgreementFinal`, and `hasConflict`.
- Records `negId`, AI `stats` and `messages`, flips `isInAppChat` and transcript flags, and resets `requiresSVI` to `false` when stored survey answers already exist.

## AI Negotiation Flow (`vsAI = true`)

### Chat loop
- `ChatWindow` disables the deal gate and instead shows the AI offer box.
- Messages start with server history (`fetchedMessages`), normalised to `{role, content}`.
- Sending a message calls `handleSendMessage` → `getNegotiationResponse` with:
  - Current `negId`, case ID, user query, filtered message history, last offer (`stats.offer`), userId, AI side, and AI config.
- A typing indicator shows if the LLM takes >2 seconds.
- Responses update:
  - `messages` (with speech synthesis flags),
  - `stats` (offer values merged by `updateStats`),
  - Optional moderation flags (`indecent`),
  - `feedback` if the AI already prepared it,
  - `negId` if the server rotated the session token.
- `shouldEnd` triggers `handleAiAgreed` and locks the chat (`isEnded = true`).

### Offers & statistics
- `stats.offer` mirrors the case parameter IDs. The UI presents the latest offer, or “No offer yet”.
- `pendingOfferUpdate` queues updates so `AgreementPage` receives the latest offer via `onOffer`.

### Automatic finalisation
- `handleAiAgreed(params, overridden, timedout)` is invoked when:
  - The AI response sets `shouldEnd`,
  - The round timer expires (`roundEndTime` effect),
  - An instructor overrides the session.
- It reuses `handleSubmit` with `fromAI=true`, `hasMadeDeal=true`, and `timedout` when applicable.
- After a successful save the client marks `madeDeal=true`, `isAgreementFinal=true`, and prevents duplicate submissions.

### Result persistence
When `fromAI=true` the POST handler:
1. Saves the AI opponent’s result (`saveResult` with `teamId = data.aiTeamId`, `overridden` flag) and auto-generated SVI scores (`generateSurvey`, seeded with the client-sent `aiSide` so the model speaks from the right perspective).
2. Optionally generates feedback (`generateFeedback`) when `data.makeFeedback` is truthy (timeouts), again using `aiSide` to orient the LLM response.
3. Saves the human result and mirrors `madeDeal` / `final`.
4. `saveResult` auto-populates `participants`, cleans empty strings, and merges the new payload with any stored result—agreement/survey values are only replaced when the client explicitly sends them.

### Survey & feedback
- `requiresSVI` decides whether the survey is mandatory. Users must submit before the feedback tab unlocks.
- `handleSurveySubmit` saves the survey (without re-sending the agreement) and redirects to `/feedback`.
- `SurveyOfSatisfaction` disables inputs once the round timer elapses (`timeLeft === null`).

## P2P Negotiation Flow (`vsAI = false`)

### Negotiation ID & chat transport
- `makeP2PNegId(eventId, round, teamA, teamB)` hashes both team IDs and the round. Team ordering depends on side (`a` vs `b`) to keep IDs stable.
- `useChatWindowState` subscribes to `getCombinedSnapshot`, which streams:
  - Messages filtered by `negId` (or `eventId`/`round` during fallbacks),
  - Agreements from both teams,
  - Derived conflict objects.
- Chat input posts to `p2pMessages` via `sendP2PMessage` with `user.uid`, ensuring Firestore timestamps drive ordering.

### Deal declaration
- P2P users start by answering “Have you reached an agreement?”:
  - **No** → `handleMadeDeal(false)` saves a result with `madeDeal=false`, marks the agreement as final, and disables further editing.
  - **Yes** → toggles the agreement form on, and optionally calls `handleMadeDeal(true)` to store intent.
- Once a persisted `madeDeal` value exists the deal gate is hidden (`showDealInputs=false`); the refresh after a no-deal submission closes the prompt automatically.

### Agreement editing & submission
- `AgreementPanel` renders the case parameters with type-specific editors and tooltips.
- Submissions call `handleAgreementSubmit` → `handleSubmit` without survey data.
- `handleSubmit` refuses blank values unless the team explicitly recorded `madeDeal=false`. It copies `acase.params` into `{id: value}` and posts via the results API, including only the pieces that changed (agreement, survey, madeDeal) alongside `comment` and `final`. When every parameter carries a value but `madeDeal` is still unset, the helper automatically sets it to `true` before posting so deals never remain ambiguous.

### Real-time status badges
- `AgreementPanel` computes status from Firestore snapshots:
  - `No Agreements Yet`, `Waiting for Other Party`, `Other Party Submitted`, `Agreements Match`, or `Agreement Conflict Detected`.
- When the local team has a saved agreement, the panel auto-applies the stored values to `acase.params` so inputs reflect the persisted state.

### Conflict detection & auto-finalisation
- `getCombinedSnapshot` compares agreements when `case.agreeMatch === true`. A mismatch produces a conflict object with IDs for both results.
- `useChatWindowState` watches external agreements and, when both sides submitted non-empty agreements with no conflicts, neither result is final, and the team hasn't recorded `madeDeal=false`, automatically calls `finalizeAgreement(true)`. This performs a final save (skipping the confirmation dialog) and then flips `isAgreementFinal`.
- The hook guards against re-entrance using `isFinalizing`, ref flags, and existing `madeDeal` values.

### Result persistence
- `saveResult` filters out null/empty values, injects the team participants based on the saved team ID, and keeps prior agreements intact once a result is final.
- When a previous result exists:
  - Agreement values remain immutable if the stored result was final.
  - `madeDeal` is preserved if it was already set (prevents the client from undoing the opponent’s decision).
  - If the client omits agreement or survey data (or sends `null`), the server keeps the stored values unless the submission marks `madeDeal=false` (which intentionally clears the agreement).
- After the round end time `saveResult` freezes agreement/survey data unless an override is in progress.

### External chat & transcripts
- Events can disable the in-app chat (`inAppChat=false`). In that case `ChatWindow` hides the message composer and the Agreement view (or no-deal summary) prompts for a transcript upload once the result is finalised.
- `hasTranscript` checks for existing uploads so the UI can acknowledge completion.

### Wrap-up
- P2P survey submission (`handleSurveySubmit`) saves data, dismisses the modal, and leaves the user on the agreement screen (no feedback page).
- Upon completion the UI shows a congratulatory dialog instead of redirecting.

## Survey Handling
- Survey definitions arrive with each API payload. They map directly to 7-point selectors with descriptive anchors.
- Inputs are disabled when `timeLeft` is missing or zero, preventing edits after the round ends.
- `requiresSVI` gates navigation and messaging; the client flips it off when stored responses already exist, otherwise the survey stays mandatory but still available.

## Real-Time Synchronisation
`useChatWindowState` orchestrates subscriptions:

- **Messages**: For P2P rounds, `getCombinedSnapshot` streams `p2pMessages` sorted by timestamp. New messages are flagged with `shouldSpeak=true` to trigger optional speech synthesis.
- **Agreements**: Results are filtered by participant IDs (own team + opponents). Each snapshot updates state, flips `hasEnemyAgreement`, and surfaces latest `agreement` objects.
- **Conflicts**: Derived from the same result snapshot using the loaded case definition. The hook pushes conflict presence up to `AgreementPage` via `setHasConflict`.
- **Lifecycle**: Subscriptions are torn down on unmount or when `negId` changes. Automatic finalisation ensures listeners clear after results are final, but the hook also exposes `resetFinalizingState` in case the parent needs to reset.

## API and Persistence Details

### `GET /api/data/events/{eventId}/{participantId}?round={roundId}`
- Needs `negotiator` access; returns `401` otherwise.
- Outcomes:
  - **Active round**: full payload (case, messages, negId, results, stats, survey, flags, timers).
  - **Round not started**: `403` with `{ error: "Round has not started yet" }`.
  - **Event finished**: `eventEnded=true` plus historical rounds and aggregated feedback labels.
  - **Pre-start view**: when the round is locked but the event is visible, returns a preview without messages or negId.
  - **Past round view**: fetches the prior round’s data so negotiators can review outcomes.

### `POST /api/data/results/{eventId}/{participantId}`
- Needs `negotiator` access.
- Accepts payloads generated by `handleSubmit`:
  - Always includes `comment` and `final`, and then whichever of `agreement`, `survey`, `madeDeal`, or AI-specific flags (`fromAI`, `negId`, `aiTeamId`, `overridden`, `agreementSources`, `makeFeedback`) changed in that action.
- The endpoint calls `saveResult` twice for AI submissions (opponent + user).
- `saveResult` handles the following:
  - Clean string/number inputs (empty strings → removed).
  - Reuse stored result IDs to update existing documents.
  - Freeze agreements once `final=true`.
  - Attach `participants` based on team membership.
  - Respect round end times (post-deadline saves become read-only unless overridden).
  - Trigger proficiency recalculation for participants when a result becomes final.

## Data Model Reference

### P2P Message (`p2pMessages`)
```json
{
  "id": string,
  "negId": string,
  "content": string,
  "time": Timestamp,
  "userId": string,
  "eventId": string,
  "roundId": number
}
```
News messages may also include `senderId` for compatibility with older data.

### AI Message (`messages`)
```json
{
  "id": string,
  "negId": string,
  "role": "user" | "assistant",
  "content": string,
  "stats"?: {
    "score": number,
    "offer": Array<{ id: string, name: string, value: string | number }>
  },
  "decent": boolean,
  "time": number
}
```

### Result (`results`)
```json
{
  "id": string,
  "eventId": string,
  "round": number,
  "team": string,
  "participants": string[],
  "agreement": { [paramId: string]: string | number },
  "agreementSources"?: string[],
  "survey": { [fieldName: string]: string | number },
  "madeDeal": boolean | null,
  "final": boolean,
  "comment": string,
  "caseId": string,
  "negId"?: string,
  "fromAI"?: boolean,
  "overridden"?: boolean,
  "lastModified": number
}
```

### Agreement Conflict (derived)
```json
{
  "id": string,              // ownResultId-enemyResultId
  "eventId": string,
  "round": number,
  "ownResult": { id, team, agreement, madeDeal },
  "enemyResult": { id, team, agreement, madeDeal },
  "conflictType": "agreement_mismatch",
  "lastModified": number
}
```

### AI Offer Stats
```json
{
  "score": number,
  "offer": Array<{ id: string, name: string, value: string | number }>
}
```

## Guards, Validation, and Edge Cases
- `handleSubmit` skips saving when any parameter is blank (after trimming). Empty string text fields are invalid; number inputs are converted to floats.
- Setting `madeDeal=false` allows the form to remain empty but still finalises the result.
- When a round times out client-side, AI negotiations auto-submit the current offer and redirect to agreement-only mode with a toast.
- Opponent results are copied to the user (`madeDeal`, conflicts) so the UI shows consistent status even before the user saves.
- Survey inputs and the comment box disable automatically when `timeLeft` expires, preventing post-round edits.
- Navigation guards keep folks from jumping to feedback without submitting the survey when required.
- Subscriptions guard against stale data by reinitialising when `negId` changes and cancelling on unmount.

## Debugging Tips
- **Missing messages**: verify `negId` consistency between client and Firestore documents (`makeP2PNegId` ordering is side-sensitive).
- **Auto-finalisation**: check `agreements` snapshot contents, `conflicts.length`, and whether either result already has `final=true`.
- **Agreement not saving**: inspect API payload in the browser devtools (empty string values will be rejected). After post-round cut-off the server intentionally returns the stored agreement.
- **Conflicts**: confirm the case has `agreeMatch` set; without it conflicts are never emitted.
- **Feedback not showing**: ensure `generateFeedback` ran (`makeFeedback` must be true on AI timeout) and that the UI unlocked the feedback tab (`requiresSVI` must be satisfied).

## Summary
Discurso’s negotiation page orchestrates three major responsibilities: conversation, agreement capture, and reflective surveys. `AgreementPage` stitches these together by front-loading round data through a single API call, then layering Firestore real-time updates for P2P experiences. AI rounds rely on the actions layer to moderate, respond, and even auto-complete the opponent’s paperwork. P2P rounds emphasise synchronisation and safety: agreements auto-populate, conflicts are detected live, and finalisation is guarded but automated once both sides submit matching terms. Hopefully this walkthrough makes it easier to follow the flow and spot the places you might tweak or debug next.
