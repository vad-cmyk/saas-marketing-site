import { supabase } from './supabase';

export type ProposalItem = {
  name: string;
  description: string | null;
  category: string;
  colour: string | null;
  dimensions: string;
  quantity: number;
  photos: string[];
};

export type ProposalOrganization = {
  name: string;
  logo_url: string | null;
  brand_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

export type Proposal = {
  property_address: string;
  client_name: string | null;
  stage_date: string | null;
  notes: string | null;
  organization: ProposalOrganization;
  items: ProposalItem[];
};

export async function getProposal(token: string): Promise<Proposal | null> {
  const { data, error } = await supabase.rpc('proposal_by_token', { p_token: token });
  if (error) throw error;
  return (data as Proposal | null) ?? null;
}
