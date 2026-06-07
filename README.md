<div align="center">

# Outreach CLI

![Status](https://img.shields.io/badge/status-active-success)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Axios](https://img.shields.io/badge/Axios-1.7+-blue)
![Vitest](https://img.shields.io/badge/Vitest-1.6+-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

Outreach CLI is a lightweight, fully automated command-line utility designed to orchestrate top-of-funnel outbound campaigns. Built with Node.js and TypeScript, it connects multiple data enrichment APIs to construct a seamless pipeline from seed domain to dispatched email.

</div>

## Overview

The application is designed to operate autonomously with zero manual intervention required until the final safety checkpoint. By providing a single seed domain, the CLI will:

1. Source lookalike companies.
2. Identify target decision-makers (C-Level and VP).
3. Resolve verified B2B email addresses.
4. Dispatch personalized, transactional email batches.

## Features

- **Lookalike Discovery:** Integrates with the Ocean.io API to identify companies sharing similar firmographic traits with the provided seed domain.
- **Decision-Maker Sourcing:** Utilizes the Prospeo API to locate key executives within target organizations.
- **Email Resolution:** Leverages the Prospeo's Enrich Person API to resolve LinkedIn profiles to verified corporate email addresses.
- **Automated Dispatch:** Uses Brevo (Sendinblue) to execute batch email dispatch using dynamically injected templates.
- **Resilient Architecture:** Implements robust error handling, cross-stage data deduplication (using strict `Set` evaluations), and payload chunking (respecting Brevo's 1,000 recipient per-request limit) to ensure API stability and preserve credits.

## Technology Stack

- **Runtime:** Node.js (ESM)
- **Language:** TypeScript
- **HTTP Client:** Axios
- **Testing Framework:** Vitest

## Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended). You will also require active API credentials for the integrated services:

- Ocean.io API Token
- Prospeo API Token
- Brevo API Key

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/RanXom/outreach-cli.git
   cd outreach-cli
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Global Link (Optional):**
   To execute the CLI system-wide without prefixing `npm run`, compile the TypeScript source and link the executable:
   ```bash
   npm run build
   sudo npm link
   ```

## Configuration

The application relies on environment variables for secure credential management. Create a `.env` file in the project root:

```env
OCEANIO_API_TOKEN="your_ocean_token_here"
PROSPEO_API_TOKEN="your_prospeo_token_here"
EAZYREACH_CLIENT_ID="your_eazyreach_id"             # Not needed unless using Eazyreach for fetching email
EAZYREACH_CLIENT_SECRET="your_eazyreach_secret"     # Not needed unless using Eazyreach for fetching email
BREVO_API_KEY="your_brevo_api_key_here"
```

## Usage

If the package is linked globally, execute the pipeline by passing the target seed domain:

```bash
outreach-cli <company.domain>
```

Alternatively, use the local npm script:

```bash
npm start <company.domain>
```

### Example Execution

```text
:: Starting pipeline for subspace.money

:: Sourcing lookalike companies via Ocean.io...
   Utterbond Inc (utterbond.com)
   Rekart (rekart.io)
 -> 2 companies

:: Finding decision-makers via Prospeo...
   Tyler Durden, Chief Executive Officer at Fight Club Inc
 -> 1 prospects

:: Resolving work emails...
   Tyler Durden -> tyler@fc.com
 -> 1/1 resolved

:: Outreach preview (1 recipients)

   Name                    Title                       Company             Email
   --------------------------------------------------------------------------------------------------
   Tyler Durden            Chief Executive Officer     Fight Club Inc      tyler@fc.com

:: Send 1 email(s)? [y/N]
```

## Testing

The repository includes a comprehensive test suite covering data transformation, deduplication logic, and resilience strategies. All network requests are mocked to ensure zero impact on API quotas during testing.

```bash
npm test
```

## License

This project is licensed under the MIT License.
