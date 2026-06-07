// Ocean.io service
export interface OceanCompany {
  domain: string | undefined;
  name?: string;
  companySize?: string;
  primaryCountry?: string;
  industries?: string[];
}

// Prospeo service
export interface DiscoveredProspect {
  name: string;
  title: string;
  linkedinUrl: string;
  company?: string;
  companyDomain?: string;
}

export interface ProspeoPersonPayload {
  person_id?: string;
  full_name: string | null;
  current_job_title: string | null;
  linkedin_url: string | null;
}

export interface ProspeoCompanyPayload {
  name: string;
  domain: string;
}

export interface ProspeoSearchResponse {
  error: boolean;
  error_code?: string;
  filter_error?: string;
  free?: boolean;
  results?: Array<{
    person: ProspeoPersonPayload;
    company?: ProspeoCompanyPayload;
  }>;
  pagination?: {
    current_page: number;
    per_page: number;
    total_page: number;
    total_count: number;
  };
}

// Eazyreach service
export interface AuthTokenResponse {
  affectedRows?: number;
  authToken: string;
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
