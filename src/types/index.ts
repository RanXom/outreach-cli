// Ocean.io service
export interface OceanCompany {
  domain: string | undefined;
}

// Prospeo service
export interface DiscoveredProspect {
  name: string;
  title: string;
  linkedinUrl: string;
}

interface ProspeoPersonPayload {
  person_id: string;
  full_name: string | null;
  current_job_title: string | null;
  linkedin_url: string | null;
}

interface ProspeoCompanyPayload {
  name: string;
  domain: string;
}

export interface ProspeoSearchResponse {
  error: boolean;
  free?: boolean;
  results?: Array<{
    person: ProspeoPersonPayload;
    company?: ProspeoCompanyPayload;
  }>;
}

// Eazyreach service
export interface AuthTokenResponse {
  status: string;
  auth_token: string;
  id: string;
}

interface EmailRecord {
  email: string;
  verification: "verified" | "probable";
  source?: string;
}

export interface LinkedinEmailsResponse {
  status: string;
  emails: EmailRecord[];
}

// Brevo service
export interface MessageVersion {
  to: Array<{ name: string; email: string }>;
  params: {
    firstName: string;
    company: string;
  };
  subject: string;
}

export interface BrevoBatchResponse {
  messageIds: string[];
}

export interface Contact {
  name: string;
  title: string;
  company: string;
  email: string;
}
