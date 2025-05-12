import { getCurrentTabUrl } from './browserClient';
import MapasSDK from "../MapasSDK";

async function getSdkClient() {
  const instanceUrl = (await getCurrentTabUrl()).origin;

  return new MapasSDK(
    instanceUrl,
  );
}

export async function fetchAgents(query) {
  const sdkClient = await getSdkClient();
  return await sdkClient.apiGet( '/api/agent/find/', {
    '@keyword': query,
    '@order': 'createTimestamp DESC',
    '@select': 'id,name,emailPublico',
    '@files': '(avatar.avatarSmall):url',
  });
}

export async function createRegistrations(opportunity, agents) {
  const sdkClient = await getSdkClient();
  const fails = [];
  const createdRegistrations = [];

  console.log(agents);

  for (const agent of agents) {
    try {
      const response = await sdkClient.apiPost( '/inscricoes', {
        opportunityId: opportunity,
        ownerId: agent,
        category: '',
      });
      console.log(response);

      createdRegistrations.push({agent});
    } catch (e) {
      fails.push(agent);
    }
  }

  return { fails, createdRegistrations };
}
