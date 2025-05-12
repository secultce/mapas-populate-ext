import 'choices.js/public/assets/styles/choices.css';

import Choices from "choices.js";
import { getCurrentTabUrl } from "../client/browserClient";
import {createRegistrations, fetchAgents} from "../client/apiClient";

document.addEventListener('DOMContentLoaded', async () => {
  const url = await getCurrentTabUrl();
  if (url.pathname.includes('/oportunidade/')) {
    document.querySelector('[name=opportunity]').value = url.pathname.split('oportunidade/')[1];
  }
});

const SELECT_AGENTS = document.querySelector('select[name^=agents]');
const choices = new Choices(SELECT_AGENTS, {
  placeholderValue: 'Digite para pesquisar agentes...',
  searchPlaceholderValue: 'Digite para pesquisar agentes...',
  removeItemButton: true,
  searchFloor: 2, // Mínimo de caracteres para iniciar a busca
  noResultsText: 'Nenhum resultado encontrado',
  noChoicesText: 'Digite para buscar',
  itemSelectText: '',
  shouldSort: false,
  searchResultLimit: 10,
  searchChoices: false, // Desativa busca local, usaremos a API
  callbackOnCreateTemplates: function(template) {
    return {
      choice: (classNames, data) => {
        return template(`
          <div class="${classNames.item} ${classNames.itemChoice} ${
            data.disabled ? classNames.itemDisabled : classNames.itemSelectable
          }" data-select-text="${this.config.itemSelectText}" data-choice ${
            data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable'
          } data-id="${data.id}" data-value="${data.value}" ${
            data.groupId > 0 ? 'role="treeitem"' : 'role="option"'
          }>
            <img src="${data.customProperties.avatarUrl}" style="width: 48px" alt="avatar">
            ${data.label}
          </div>
        `);
      }
    };
  }
});

let requestTimeoutId = null;

SELECT_AGENTS.addEventListener('search', async event => {
  const query = event.detail.value;
  clearTimeout(requestTimeoutId);

  if (query.length < 2) return;

  requestTimeoutId = setTimeout(async () => {
    const results = await fetchAgents(query);
    const items = results.map(item => ({
      ...item,
      customProperties: {
        avatarUrl: item['@files:avatar.avatarSmall']?.url ?? '',
      },
    }));

    choices.setChoices(items, 'id', 'name', true);
  }, 1000);
});

const BUTTON_ADD_REGISTRATION = document.getElementById('add-registration');
BUTTON_ADD_REGISTRATION.addEventListener('click', async () => {
  const opportunityId = document.querySelector('[name=opportunity]').value;
  let agents = choices.getValue(true);

  if (agents.length === 0) {
    agents = document.querySelector('input[name=agents]').value.split(',');
  }

  const response = await createRegistrations(opportunityId, agents);
  console.log(response);
});
