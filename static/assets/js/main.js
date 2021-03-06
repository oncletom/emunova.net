'use strict';

const $ = (global.jQuery = require('jquery'));
require('bootstrap/transition');
require('bootstrap/collapse');
require('bootstrap/dropdown');

const DynamicSorter = require('./dynamic-sorter');
const RemoteContent = require('./rss/remote-content');
const SortTable = require('sorttable');
const searchClient = require('algoliasearch/lite');
const debounce = require('lodash.debounce');
const { generateStars: stars } = require('./ratings');

$('table.table-sortable').each((i, el) => SortTable.makeSortable(el));
$('form[data-target]').each((i, el) => {
  new DynamicSorter(el).registerEvents();
});
$('.rss-content').each((i, el) => {
  RemoteContent.create(el.getAttribute('data-source'), el);
});

const index = searchClient('C5SU6DIDX6', 'f2a531624b466c569e171f233c98ea3d', {
  protocol: 'https:'
}).initIndex('prod_games');

$('#topbar-search-input').on(
  'keyup',
  debounce(e => handleSearch(e.currentTarget.value), 150)
);

function handleSearch(query) {
  const $collapsibleSearch = $('#search-results-wrapper .collapse');
  const searchParams = {
    hitsPerPage: 12
  };

  index
    .search(query, searchParams)
    .then(response => {
      const itemsResults = response.hits.map(
        item =>
          `<div class="col-lg-4 col-sm-6">
          <a class="result-link" href="/${item.url}">
          	<span class="result-title">${item._highlightResult.title
              .value}</span>

          	<ul class="result-metadata">
          	  <li class="result-metadata__item result-metadata__item--system">${item
                .system.name}</li>
          	  <li class="result-metadata__item result-metadata__item--date">${item.released}</li>
          	  <li class="result-metadata__item result-metadata__item--rating">${stars(
                item.rating
              )}</li>
          	</ul>
          </a>
        </div>`
      );

      $('#search-results-wrapper .panel-body').html(itemsResults);
      return response.hits;
    })
    .then(hits => {
      if (query && hits.length && !$collapsibleSearch.hasClass('in')) {
        $collapsibleSearch.collapse('show');
      } else if (
        (!query || !hits.length) &&
        $collapsibleSearch.hasClass('in')
      ) {
        $collapsibleSearch.collapse('hide');
      }
    });
}
