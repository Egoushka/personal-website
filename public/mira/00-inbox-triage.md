# 00 Inbox triage (free)

**What it does:** checks Gmail for new unread mail every minute, labels each email with one word (invoice, meeting,
newsletter, support, other) using a small AI model, and for invoice, meeting and support mail saves a short holding
reply as a draft in the same thread. It never sends and never deletes.

**Setup (10 minutes):**
1. Import `00-inbox-triage.json` (Workflows > Import from file).
2. Create a Gmail OAuth2 credential and pick it on "New email" and "Save draft (not sent)".
3. Create an Anthropic credential and pick it on "Anthropic Chat Model", or swap that node for "OpenAI Chat Model".
4. Change the signature in "Save draft (not sent)".
5. Send yourself a test invoice email, then check Executions and your Gmail Drafts. Activate the workflow.

**Customise:** edit the label list in "Pick a label" and the matching rules in "Route by label"; rewrite the
holding reply; add a Gmail "Add label" step after the switch if you want real Gmail labels (create the labels first).

**Limits:** the label only steers the routing; it is not applied as a Gmail label. One model call per email.
The holding reply is the same text for every routed email.

**Tested:** 2026-10-18, n8n 2.42.3, a test Gmail mailbox (invoice, meeting and urgent mails got drafts; a newsletter
got none).
