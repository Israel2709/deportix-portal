import { apiPatch } from './api';
import type { TeamEditPatch } from './team-edits';
import type { ApiResource, Team } from './types';

export async function patchTeamApi(teamId: string, patch: TeamEditPatch): Promise<Team> {
  const response = await apiPatch<ApiResource<Team>>(
    `/v1/teams/${encodeURIComponent(teamId)}`,
    patch,
  );
  return response.data;
}
