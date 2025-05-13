import 'choices.js/public/assets/styles/choices.css';

import Choices from "choices.js";
import { getCurrentTabUrl } from "../client/browserClient";
import {createRegistrations, fetchAgents} from "../client/apiClient";

document.addEventListener('DOMContentLoaded', async () => {
  const url = await getCurrentTabUrl();
  if (url.pathname.includes('/oportunidade/')) {
    document.querySelector('[name=opportunity]').value = url.pathname
      .split('oportunidade/')[1]
      .replace('/', '');
  }

  const AGENTS = [
    124120, // draulio.brasil@secult.ce.gov.br
    123167, // francisco.oliveira@secult.ce.gov.br
    140414, // jaime.aguiar@secult.ce.gov.br
    141768, // jefferson.dourado@secult.ce.gov.br
    134378, // ronny.john@secult.ce.gov.br
    113581, // yasmine.maciel@secult.ce.gov.br
    136538, // ronnyjohnti@gmail.com
    77431,  // yasminemaciel02@gmail.com
    114697, // yasminemaciel7@gmail.com
    140290, // your.email+fakedata14277@gmail.com
    147159, // your.email+fakedata26967@gmail.com
    133693, // your.email+fakedata28127@gmail.com
    140291, // your.email+fakedata28214@gmail.com
    124543, // your.email+fakedata29875@gmail.com
    147545, // your.email+fakedata32740@gmail.com
    140180, // your.email+fakedata42366@gmail.com
    140590, // your.email+fakedata45744@gmail.com
    147548, // your.email+fakedata52989@gmail.com
    147547, // your.email+fakedata89246@gmail.com
    124546, // your.email+fakedata91370@gmail.com
  ];

  document.querySelector('input[name="agents"]').value = AGENTS.join(',');
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

  const result = await createRegistrations(opportunityId, agents);
  renderResult(result);
});

const renderResult = result => {
  const REGISTRATIONS_TABLE = document.getElementById('registrations');

  for (const registration of result.createdRegistrations) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><a href="${registration.singleUrl}" target="_blank">${registration.number} (id: ${registration.id})</a></td>`
      + `<td><a href="${registration.owner.singleUrl}" target="_blank">${registration.owner.name}</a></td>`;

    REGISTRATIONS_TABLE.children[0].appendChild(tr);
  }

  document.querySelector('output').innerText = result.fails.join(', ');
}
