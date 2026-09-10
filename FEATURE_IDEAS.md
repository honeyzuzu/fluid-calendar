# Sunnie feature ideas

Your space to dump thoughts about what Sunnie could become. Fragments, wish lists, annoyances, and examples are all welcome. Nothing here needs to be fully thought through, prioritized, or promised for implementation.

This is a repository planning document, separate from Sunnie's in-app Brain Dump that creates personal tasks. Keep private calendar information and credentials out of this file.

## Raw brain dump

<!-- Add your ideas below as simple bullets. No template required. -->

- Make the entry page a more fun daily welcome experience, especially on mobile. Instead of always opening on the static “Welcome to Sunnie / Plan your day” screen, opening Sunnie fresh for the day could begin a Sunsama-style daily planning ritual.

  - Consider a mandatory morning “gate”: a focused, step-by-step flow that must be completed before using the rest of the planner.
  - Review yesterday’s unfinished tasks and explicitly decide what to do with each one.
  - Eventually pull in actionable work from places such as email and Slack, but do not make those integrations part of the first version.
  - Assign a time estimate to every task chosen for the day.
  - Decide how strict this should feel in friendly, private Sunnie: truly unskippable like Sunsama, or firm while still allowing an emergency exit.
  - Inspiration: [Upbase’s Sunsama review](https://upbase.io/blog/sunsama-review/), [Sunsama’s official daily planning guide](https://www.sunsama.com/blog/the-official-daily-planning-guide), [ClickUp’s Sunsama vs. Motion comparison](https://clickup.com/blog/sunsama-vs-motion/), and [this Sunsama walkthrough](https://www.youtube.com/watch?v=R4OHJWPwsVM&t=444).

- Add an end-of-day shutdown ritual at the user’s chosen log-off time.

  - Send an optional notification that it is time to wrap up.
  - Review what the user achieved.
  - Let them briefly journal obstacles or anything still on their mind.
  - Explicitly clear, move, or defer unfinished work so they can end the day without carrying the whole list into the evening.
  - Inspiration: [this Sunsama walkthrough](https://www.youtube.com/watch?v=R4OHJWPwsVM&t=444) and [Upbase’s Sunsama review](https://upbase.io/blog/sunsama-review/).

- Explore a four-day stale-task cleanup. If a task is postponed or rolled forward for four consecutive days, move it out of the active daily view into an archive/backlog so low-priority work cannot become an overwhelming pile. Never delete it automatically. The user should be able to recover it easily if it still matters. Work out how this should interact with Sunnie’s existing weekly rollover count and gentle three-week prompt.

- Add more celebrations and create a stronger early “aha!” moment. Celebrate meaningful progress during onboarding and daily planning, not only task completion. The eventual unification of calendars, tasks, and optional sources such as email or Slack could become that moment: scattered work suddenly feels organized in one warm, clear place. Do not require or prioritize every integration just to deliver the first version. Inspiration: [this product walkthrough](https://www.youtube.com/watch?v=N_Cy3gpHE58).

- Use optimistic UI for fast, direct interactions wherever recovery is safe. For example, when a task is dragged onto the calendar, let it snap into place immediately while the save and provider sync happen in the background. If the request fails, gracefully restore the previous position and show a clear, friendly error. Apply the same pattern to other common actions where it makes Sunnie feel immediate without hiding failures or risking lost changes.

## Ideas we're fleshing out

<!-- Move an idea here when you want to discuss it. Preserve the original thought. -->

When useful, explore:

- **Original thought:** What you want, in your own words.
- **Why it matters:** The annoyance or experience you want to improve.
- **What it could feel like:** A concrete example of using it in Sunnie.
- **Open questions:** Decisions we still need to talk through.
- **Small first version:** The smallest useful version to try.
- **Later possibilities:** Extras that can wait.

We can fill these in together. A rough bullet is enough to begin.

## Ready for a future session

<!-- Link fleshed-out ideas here once you've chosen their scope. Add a matching task to @TODO.md when implementation is selected. -->

## Implemented or parked

<!-- Keep the original idea and add its outcome: a commit/task link if implemented, or a short reason if parked. -->

- **Original thought:** Add a clear daily-capacity meter during planning. Compare meetings plus estimated task time with the user’s available workday rather than quietly allowing an unrealistic plan. Shift the meter from a comfortable color to amber and then red, with a direct prompt such as “You’re planning more than fits today. What would you like to move?” Help the user move work to another day until the plan fits, without making the tone feel shameful.
  - **Implemented:** Plan now compares task estimates and non-overlapping timed commitments from enabled calendars with the selected day’s configured working hours. The meter moves from green to amber to coral and gives gentle guidance when the plan is nearly full or over capacity. All-day events, cancelled events, and mirrored task blocks are not double-counted; non-working days remain intentionally open-ended.

See [the current work queue](@TODO.md) for selected tasks and [AGENTS.md](AGENTS.md) for existing features.
