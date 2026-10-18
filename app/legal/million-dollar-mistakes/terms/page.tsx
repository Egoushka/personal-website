import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";

const description = "Terms of use for the Million Dollar Mistakes publishing tool, a private YouTube API client.";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Terms of use: Million Dollar Mistakes publishing tool",
    description,
    path: "/legal/million-dollar-mistakes/terms/",
  }),
  robots: { index: false },
};

const a = (href: string, text: string) => (
  <a className="link" href={href} rel="noopener noreferrer">
    {text}
  </a>
);

/** Terms for the API client that uploads to and reads analytics of my own YouTube channel. */
export default function Terms() {
  return (
    <LegalPage
      title="Terms of use: Million Dollar Mistakes publishing tool"
      effective="2026-10-18"
      sections={[
        {
          heading: "Who may use it",
          body: (
            <p>
              The Million Dollar Mistakes publishing tool is a private program for its owner, {site.name}, to
              publish to and measure the owner&apos;s own YouTube channel. It is not offered to anyone else.
            </p>
          ),
        },
        {
          heading: "YouTube Terms of Service",
          body: (
            <p>
              The tool uses YouTube API Services. By using it you agree to be bound by the{" "}
              {a("https://www.youtube.com/t/terms", "YouTube Terms of Service")}.
            </p>
          ),
        },
        {
          heading: "Content",
          body: (
            <p>
              The owner is responsible for every video the tool uploads, including that it follows YouTube&apos;s
              Community Guidelines and discloses altered or synthetic content where YouTube requires it.
            </p>
          ),
        },
        {
          heading: "Privacy",
          body: (
            <p>
              What the tool accesses and keeps is described in its{" "}
              <Link className="link" prefetch={false} href="/legal/million-dollar-mistakes/privacy/">
                privacy policy
              </Link>
              .
            </p>
          ),
        },
        {
          heading: "No warranty",
          body: <p>The tool is provided as is, without warranty of any kind.</p>,
        },
        {
          heading: "Contact",
          body: <p>Questions go to {a(`mailto:${site.email}`, site.email)}.</p>,
        },
      ]}
    />
  );
}
