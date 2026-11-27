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
              month. Country and city come from the address, which is then discarded. Nothing is sold or shared, and
              there are no advertising trackers.
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
