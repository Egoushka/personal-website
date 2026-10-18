import type { Metadata } from "next";
import React from "react";
import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";

const description =
  "What the Million Dollar Mistakes publishing tool reads from YouTube, why, where it keeps it, and how to revoke its access.";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Privacy policy: Million Dollar Mistakes publishing tool",
    description,
    path: "/legal/million-dollar-mistakes/privacy/",
  }),
  robots: { index: false },
};

const a = (href: string, text: string) => (
  <a className="link" href={href} rel="noopener noreferrer">
    {text}
  </a>
);

/** Privacy policy for the API client that uploads to and reads analytics of my own YouTube channel. */
export default function Privacy() {
  return (
    <LegalPage
      title="Privacy policy: Million Dollar Mistakes publishing tool"
      effective="2026-10-18"
      sections={[
        {
          heading: "What this tool is",
          body: (
            <>
              <p>
                The Million Dollar Mistakes publishing tool is a private program run by {site.name}. It uploads
                short videos to the YouTube channel Million Dollar Mistakes (@MillionDollarOops), which the same
                person owns, and reads that channel&apos;s analytics to decide which videos to make next.
              </p>
              <p>
                It has one user, its owner. It has no sign-up, no web interface and no access to anyone
                else&apos;s account.
              </p>
            </>
          ),
        },
        {
          heading: "YouTube API Services",
          body: (
            <p>
              This tool uses YouTube API Services. By using it you agree to the{" "}
              {a("https://www.youtube.com/t/terms", "YouTube Terms of Service")}. Google&apos;s handling of data is
              described in the {a("https://policies.google.com/privacy", "Google Privacy Policy")}.
            </p>
          ),
        },
        {
          heading: "What it accesses and why",
          body: (
            <>
              <p>With the owner&apos;s authorization, the tool accesses only the owner&apos;s own channel:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Uploads:</strong> the video file, title, description and visibility the owner prepared,
                  sent to the channel through the YouTube Data API.
                </li>
                <li>
                  <strong>Channel and video details:</strong> the channel&apos;s ID and title, and the ID, title and
                  publish date of each of its videos.
                </li>
                <li>
                  <strong>Analytics:</strong> per-video totals from the YouTube Analytics API: views, engaged
                  views, watch time, average view duration and percentage, likes, comments, shares, subscribers
                  gained and lost, estimated revenue, and the audience retention curve.
                </li>
              </ul>
              <p>
                Analytics are aggregate numbers. The tool never receives the identity or personal information of
                any viewer.
              </p>
            </>
          ),
        },
        {
          heading: "Where it is stored",
          body: (
            <>
              <p>
                The authorization token is stored on the owner&apos;s own computer, in a file only the owner&apos;s
                user account can read. Analytics are stored in a private repository the owner controls, and are
                used only to compare the owner&apos;s own videos.
              </p>
              <p>
                Nothing is sold, shared with third parties, or used for advertising. The tool sets no cookies and
                collects no device information.
              </p>
            </>
          ),
        },
        {
          heading: "How long it is kept",
          body: (
            <p>
              Analytics are refreshed while the authorization is active. If the authorization is revoked, stored
              analytics and the token are deleted within 30 days.
            </p>
          ),
        },
        {
          heading: "Revoking access and deleting data",
          body: (
            <>
              <p>
                Access can be revoked at any time on the{" "}
                {a("https://security.google.com/settings/security/permissions", "Google security settings page")}.
              </p>
              <p>
                To ask for any stored data to be deleted, write to{" "}
                {a(`mailto:${site.email}`, site.email)}.
              </p>
            </>
          ),
        },
        {
          heading: "Changes",
          body: <p>A change to this policy is published on this page with a new effective date.</p>,
        },
      ]}
    />
  );
}
