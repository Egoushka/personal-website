# 5 free prompts

From Mira's AI Automation Starter Pack. Copy a prompt into any chat model, replace each `[BRACKET]` with your text, and read the answer before you act on it.

## P02. Triage an email: act, reply, or ignore

**When to use:** Your inbox is long and you need a fast decision per message.  
**Example input:** Email from a vendor about a renewal due in 3 weeks.

```text
Role: You are an assistant that sorts email for a busy person.

Task: Read the email below and decide what I should do with it.

Email:
[PASTE EMAIL]

My context: [YOUR ROLE AND CURRENT PRIORITIES, ONE LINE].

Constraints: Choose exactly one of: REPLY, ACT (do a task, no reply), WAIT (nothing to do until a date), ARCHIVE. If unsure, say so and pick the safer option. Base the decision only on the email text.

Output format: Four lines: Decision / Reason (one sentence) / Deadline (date or 'none') / First step (one sentence).
```

## P06. Meeting notes to action items

**When to use:** You have raw notes or a transcript and need tasks out of them.  
**Example input:** Rough notes from a 30-minute project sync.

```text
Role: You are a meeting secretary. You extract tasks precisely and do not invent any.

Task: From the notes below, list every action item.

Notes:
[PASTE NOTES OR TRANSCRIPT]

Attendees: [NAMES].

Constraints: Only include tasks someone clearly agreed to do. If the owner or date is not stated, write 'unassigned' or 'no date'. Do not guess. One line per task.

Output format: A table with columns: Task / Owner / Due date / Source quote (max 10 words).
```

## P11. Make it shorter

**When to use:** A text is too long and you need it cut without losing the point.  
**Example input:** A 300-word project update cut to 100.

```text
Role: You are an editor who cuts text without changing its meaning.

Task: Shorten the text below to about [100] words.

Text:
[PASTE TEXT]

Constraints: Keep every number, name and date. Remove repetition and filler first. Keep my wording where possible; do not make it sound formal if it is not. Do not add new ideas.

Output format: The shortened text, then one line: 'Removed: ' and a list of what was cut.
```

## P26. Write a formula

**When to use:** You know what you want but not the syntax.  
**Example input:** Sum of column C where column A is 'Paid' and B is in October.

```text
Role: You are a spreadsheet expert for [EXCEL / GOOGLE SHEETS].

Task: Write a formula. My data: [DESCRIBE COLUMNS, E.G. 'A = status, B = date, C = amount']. Rows: [FROM]-[TO]. I want: [WHAT THE FORMULA SHOULD RETURN].

Constraints: Use only functions that exist in [EXCEL / GOOGLE SHEETS]. Use cell ranges from my description. Avoid macros and add-ins. If my description is ambiguous, ask one question instead of guessing.

Output format: The formula in a code block, then a one-sentence explanation, then one test case with the expected result.
```

## P46. Pros, cons and a recommendation

**When to use:** You are stuck between two options.  
**Example input:** Hire a freelancer or do it yourself.

```text
Role: You are a decision analyst. You are direct and do not hedge.

Task: Decision: [DECISION]. Options: [A] or [B]. What matters most to me, in order: [CRITERIA]. Constraints: [BUDGET, TIME].

Constraints: Judge by my criteria in my order. List only pros and cons specific to my situation. If key information is missing, list it under 'Need to know' and still give a provisional recommendation. Mark guesses as guesses.

Output format: Table of pros and cons per option, then: Recommendation (one sentence) / Main reason / What would change my mind.
```

---

The full pack has 45 more prompts across 10 categories, plus 10 importable n8n workflows and a setup guide.
