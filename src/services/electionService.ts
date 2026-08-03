import { requestJson, jsonRequestOptions, authHeader } from "./apiClient";

export interface Election {
  id: string;
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  active?: boolean;
  candidates?: Array<{ id: string; label: string }>;
}

export async function getElections(token: string | null): Promise<Election[]> {
  const headers = { ...(authHeader(token) as any) };
  const data = await requestJson<{ elections: Election[] }>(`/api/elections`, {
    headers,
  });
  return data.elections || [];
}

export async function castVote(
  token: string | null,
  payload: {
    electionId: string;
    candidateId: string;
    faceVerificationId?: string;
    anonymousVoterHash?: string;
  },
) {
  const headers = { ...(authHeader(token) as any), "Content-Type": "application/json" };
  const data = await requestJson<{ success: boolean; receipt?: any }>(`/api/vote`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return data;
}
