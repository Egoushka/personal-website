import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Privacy",
    description: "What this site's analytics record, the one optional cookie, and how to remove it.",
    path: "/privacy/",
  }),
  robots: { index: false },
};

const mail = <a className="link" href={`mailto:${site.email}`}>{site.email}</a>;

/** The site's own privacy page. The per-product notices (Mira, Million Dollar Mistakes) stay separate. */
export default function Privacy() {
  return (
    <LegalPage
      title="Privacy"
      effective="2026-11-27"
      sections={[
        {
          heading: "What is recorded by default",
          body: (
            <p>
              Page views and a few actions (outbound and download clicks, how far you scroll, how long a page stays
              open, what you search for) in a self-hosted analytics tool. It sets no cookie and stores nothing in
              your browser. Visits are told apart by a hash of your network address and browser that changes every
              month. Country and city come from the address, which is then discarded. Nothing is sold, and nothing is
              shared except with the email service that delivers mail you ask for (see “The email list”). There are no
              advertising trackers. It also notes page speed, script errors and coarse facts about your browser (time zone, light or dark mode, screen width rounded to 100 px, connection type), and keeps anonymous recordings of how pages are used (clicks, scrolling and movement) with form fields masked, so I can see what confuses people.
            </p>
          ),
        },
        {
          heading: "The email list",
          body: (
            <p>
              If you subscribe, I keep your email address on my own server, and nothing else about you: I do not record
              your network address when you sign up. I send a confirmation first and mail you nothing until you click
              it. The mail goes out through an email-sending service (Resend), only to deliver it. Opens and link clicks
              in the mails are counted as totals, not per person. Every mail has an unsubscribe link, and you can
              export or delete your record there or by writing to {mail}. I rely on your consent, which the
              confirmation click records. The address stays until you delete it; if you only unsubscribe, I keep it marked
              as unsubscribed so you are not mailed again. It is never sold or used for anything but these mails.
            </p>
          ),
        },
        {
          heading: "The one optional cookie",
          body: (
            <p>
              The footer has a “Remember me” button. Only if you click it, the site sets a cookie named{" "}
              <code>visitor-id</code> holding a random number, for 13 months. It lets me see that the same person came
              back, across days and networks. It holds nothing about you, and it is first-party: no other site sees
              it. Without the click there is no cookie. A small card on your first visit asks once; “No thanks” is remembered in your browser’s local storage (a flag named <code>visitor-choice</code>) so it does not ask again.
            </p>
          ),
        },
        {
          heading: "Taking it back",
          body: (
            <p>
              Click “Forget me” in the footer to remove the cookie from your browser. Visits already recorded stay in
              the analytics tool, unlinked from you once the cookie is gone. To have them deleted, write to {mail}.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: <p>Yehor Hrabovskyi, {mail}.</p>,
        },
      ]}
    />
  );
}
