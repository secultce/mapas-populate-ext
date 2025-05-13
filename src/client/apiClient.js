import { getCurrentTabUrl } from './browserClient';
import MapasSDK from "../MapasSDK";

async function getSdkClient() {
  const instanceUrl = (await getCurrentTabUrl()).origin;

  if ('https://mapacultural.secult.ce.gov.br' === instanceUrl) {
    const msg = 'Instância sem permissão para usar extensão.';
    alert(msg);
    throw new Error(msg);
  }

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

  for (const agent of agents) {
    try {
      const response = await sdkClient.apiPost( '/inscricoes', {
        opportunityId: opportunity,
        ownerId: agent,
        category: '',
        status: 1,
      });

      if (!response.id) {
        throw Error();
      }

      createdRegistrations.push(response);

      sdkClient.apiPost( '/inscricoes/send/' + response.id)
        .catch(_ => {});
    } catch (e) {
      fails.push(agent);
    }
  }

  return { fails, createdRegistrations };
}
