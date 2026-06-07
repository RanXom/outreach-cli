#!/usr/bin/env node
import readline from "node:readline";
import { fetchLookalikes } from "./services/oceanService.js";
import { findDecisionMakers } from "./services/prospeoService.js";
import { fetchEmails } from "./services/eazyreachService.js";
import { sendBatchOutreach } from "./services/brevoService.js";
import { Contact, OceanCompany, DiscoveredProspect } from "./types/index.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, resolve));

const die = (msg: string): never => {
  console.error(`error: ${msg}`);
  rl.close();
  process.exit(1);
};

const col = (str: string, width: number): string => {
  if (str.length > width - 1) return str.substring(0, width - 3) + ".. ";
  return str + " ".repeat(width - str.length);
};

const main = async (): Promise<void> => {
  const seedDomain = process.argv[2];

  if (!seedDomain) {
    console.log("usage: outreach-cli <company.domain>");
    console.log("");
    console.log("  Automated cold-outreach pipeline.");
    console.log("  Finds lookalike companies, discovers decision-makers,");
    console.log("  resolves work emails, and sends personalized outreach.");
    rl.close();
    process.exit(1);
  }

  console.log("");
  console.log(`:: Starting pipeline for ${seedDomain}`);

  // ── Ocean.io ──────────────────────────────────────────────

  console.log("");
  console.log(":: Sourcing lookalike companies via Ocean.io...");

  const companies: OceanCompany[] = await fetchLookalikes(seedDomain).catch(
    (err) => die(err.message),
  );

  if (companies.length === 0) {
    console.log("   no lookalike companies found -- nothing to do");
    rl.close();
    return;
  }

  for (const c of companies) {
    const label = c.name ? `${c.name} (${c.domain})` : c.domain;
    console.log(`   ${label}`);
  }
  console.log(` -> ${companies.length} companies`);

  // ── Prospeo ───────────────────────────────────────────────

  console.log("");
  console.log(":: Finding decision-makers via Prospeo...");

  const domains = companies
    .map((c) => c.domain)
    .filter((d): d is string => !!d);

  const prospects: DiscoveredProspect[] = await findDecisionMakers(
    domains,
  ).catch((err) => die(err.message));

  if (prospects.length === 0) {
    console.log("   no decision-makers found -- nothing to do");
    rl.close();
    return;
  }

  for (const p of prospects) {
    const at = p.company || p.companyDomain || "";
    console.log(`   ${p.name}, ${p.title}${at ? ` at ${at}` : ""}`);
  }
  console.log(` -> ${prospects.length} prospects`);

  // ── Eazyreach ─────────────────────────────────────────────

  console.log("");
  console.log(":: Resolving work emails via Eazyreach...");

  const contacts: Contact[] = [];
  let failed = 0;

  for (const prospect of prospects) {
    const email = await fetchEmails(prospect.linkedinUrl);

    if (email) {
      contacts.push({
        name: prospect.name,
        title: prospect.title,
        company: prospect.company || prospect.companyDomain || seedDomain,
        email,
      });
      console.log(`   ${prospect.name} -> ${email}`);
    } else {
      failed++;
    }
  }

  const resolvedMsg = `${contacts.length}/${prospects.length} resolved`;
  const failedMsg = failed > 0 ? ` (${failed} unresolvable)` : "";
  console.log(` -> ${resolvedMsg}${failedMsg}`);

  if (contacts.length === 0) {
    console.log("   no emails resolved -- nothing to send");
    rl.close();
    return;
  }

  // ── !Safety checkpoint! ──────────────────────────────────────────────

  console.log("");
  console.log(`:: Outreach preview (${contacts.length} recipients)`);
  console.log("");

  const w = { name: 24, title: 28, company: 20 };
  const rule = "-".repeat(w.name + w.title + w.company + 26);

  console.log(
    `   ${col("Name", w.name)}${col("Title", w.title)}${col("Company", w.company)}Email`,
  );
  console.log(`   ${rule}`);

  for (const c of contacts) {
    console.log(
      `   ${col(c.name, w.name)}${col(c.title, w.title)}${col(c.company, w.company)}${c.email}`,
    );
  }

  console.log("");
  const answer = await ask(`:: Send ${contacts.length} email(s)? [y/N] `);

  if (answer.trim().toLowerCase() !== "y") {
    console.log(" -> aborted, no emails sent");
    rl.close();
    return;
  }

  // ── Brevo ─────────────────────────────────────────────────

  console.log("");
  console.log(":: Dispatching outreach via Brevo...");

  const messageIds: string[] = await sendBatchOutreach(contacts).catch((err) =>
    die(err.message),
  );
  console.log(` -> ${messageIds.length} email(s) sent`);

  console.log("");
  console.log(":: Done.");
  console.log("");
  rl.close();
};

main().catch((err) => {
  console.error(`fatal: ${err.message}`);
  rl.close();
  process.exit(1);
});
