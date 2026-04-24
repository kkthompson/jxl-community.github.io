(function () {
  let newsData = [];
  let categories = [];
  let currentTabIndex = 0;
  let currentTagFilter = null;
  let currentAuthorFilter = null;
  let currentPublicationFilter = null;

  function getAuthors(item) {
    const authors = item.Author;
    if (Array.isArray(authors)) return authors.map((name) => (name || '').trim()).filter(Boolean);
    if (typeof authors === 'string') return [(authors || '').trim()].filter(Boolean);
    return [];
  }

  function getFilteredData(category, tag, author, publication) {
    const items = newsData[category] || [];
    if (tag) return items.filter((item) => item.Tags && item.Tags.includes(tag));
    if (author) return items.filter((item) => getAuthors(item).some((name) => name.trim() === author.trim()));
    if (publication) return items.filter((item) => (item.Publication || '').trim() === publication.trim());
    return items;
  }

  function getCount(category) {
    return getFilteredData(category, currentTagFilter, currentAuthorFilter, currentPublicationFilter).length;
  }

  function readStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const tagParam = params.get('tag');
    const authorParam = params.get('author');
    const publicationParam = params.get('publication');
    let index = 0;
    if (tabParam && categories.indexOf(tabParam) >= 0) {
      index = categories.indexOf(tabParam);
    }
    return { tabIndex: index, tag: tagParam || null, author: authorParam || null, publication: publicationParam || null };
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (categories[currentTabIndex]) params.set('tab', categories[currentTabIndex]);
    if (currentTagFilter) params.set('tag', currentTagFilter);
    if (currentAuthorFilter) params.set('author', currentAuthorFilter);
    if (currentPublicationFilter) params.set('publication', currentPublicationFilter);
    const query = params.toString();
    const url = query ? window.location.pathname + '?' + query : window.location.pathname;
    window.history.pushState(
      {
        tabIndex: currentTabIndex,
        tag: currentTagFilter,
        author: currentAuthorFilter,
        publication: currentPublicationFilter,
      },
      '',
      url,
    );
  }

  function updateFilterBar() {
    const bar = document.getElementById('filter-bar');
    const typeEl = document.getElementById('filter-type-label');
    const valueEl = document.getElementById('filter-value');
    if (!bar || !typeEl || !valueEl) return;

    if (currentTagFilter) {
      bar.style.display = 'flex';
      typeEl.textContent = 'tag = ';
      valueEl.textContent = currentTagFilter;
    } else if (currentAuthorFilter) {
      bar.style.display = 'flex';
      typeEl.textContent = 'author = ';
      valueEl.textContent = currentAuthorFilter;
    } else if (currentPublicationFilter) {
      bar.style.display = 'flex';
      typeEl.textContent = 'publication = ';
      valueEl.textContent = currentPublicationFilter;
    } else {
      bar.style.display = 'none';
    }
  }

  function createTabs() {
    const tabBar = document.getElementById('tab-bar');
    if (!tabBar) return;

    tabBar.innerHTML = '<div class="selector"></div>';
    categories.forEach((category, index) => {
      const count = getCount(category);
      const tab = document.createElement('a');
      tab.href = '#';
      tab.setAttribute('data-index', String(index));

      const labelSpan = document.createElement('span');
      labelSpan.className = 'tab-label';
      labelSpan.textContent = category;

      const countSpan = document.createElement('span');
      countSpan.className = 'tab-count';
      countSpan.textContent = ' (' + count + ')';

      tab.appendChild(labelSpan);
      tab.appendChild(countSpan);
      tab.onclick = (event) => {
        event.preventDefault();
        switchTab(index, true);
      };
      tabBar.appendChild(tab);
    });
  }

  function setTagFilter(tag) {
    currentTagFilter = tag;
    currentAuthorFilter = null;
    currentPublicationFilter = null;
    updateUrl();
    updateFilterBar();
    createTabs();
    switchTab(currentTabIndex, false);
  }

  function setAuthorFilter(author) {
    currentTagFilter = null;
    currentAuthorFilter = author;
    currentPublicationFilter = null;
    updateUrl();
    updateFilterBar();
    createTabs();
    switchTab(currentTabIndex, false);
  }

  function setPublicationFilter(publication) {
    currentTagFilter = null;
    currentAuthorFilter = null;
    currentPublicationFilter = publication;
    updateUrl();
    updateFilterBar();
    createTabs();
    switchTab(currentTabIndex, false);
  }

  function clearFilter() {
    currentTagFilter = null;
    currentAuthorFilter = null;
    currentPublicationFilter = null;
    updateUrl();
    updateFilterBar();
    createTabs();
    switchTab(currentTabIndex, false);
  }

  function switchTab(index, updateHistory) {
    currentTabIndex = index;
    if (updateHistory) updateUrl();

    const tabs = document.querySelectorAll('.tabs a');
    tabs.forEach((tab, tabIndex) => {
      tab.classList.toggle('active', tabIndex === index);
    });

    const selector = document.querySelector('.selector');
    const activeTab = tabs[index];
    if (selector && activeTab) {
      selector.style.width = activeTab.offsetWidth + 'px';
      selector.style.left = activeTab.offsetLeft + 'px';
    }

    const content = document.getElementById('news-content');
    if (!content) return;

    content.classList.add('fade-out');
    setTimeout(() => {
      displayNews(categories[index]);
      content.classList.remove('fade-out');
    }, 300);
  }

  function formatDate(dateString) {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthOnly = /^\d{4}-\d{2}$/.test(String(dateString).trim());
    if (monthOnly) {
      const date = new Date(dateString);
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${month} ${year}`;
    }
    const date = new Date(dateString);
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const day = date.getDate();
    if (isNaN(day)) {
      return `${month} ${year}`;
    }
    return `${month} ${day}, ${year}`;
  }

  function sortNewsByDate(newsArray) {
    return [...newsArray].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  function displayNews(category) {
    const newsContent = document.getElementById('news-content');
    if (!newsContent) return;

    newsContent.innerHTML = '';
    const filteredData = getFilteredData(category, currentTagFilter, currentAuthorFilter, currentPublicationFilter);
    const sortedData = sortNewsByDate(filteredData);

    sortedData.forEach((item) => {
      const newsItem = document.createElement('div');
      newsItem.className = 'news-item';

      const headingLink = document.createElement('a');
      headingLink.href = item.link;
      headingLink.className = 'news-item-heading-link';
      headingLink.target = '_blank';
      headingLink.rel = 'noopener noreferrer';

      const title = document.createElement('h3');
      title.className = 'news-item-title';
      title.textContent = item.title || item.Title;
      headingLink.appendChild(title);
      newsItem.appendChild(headingLink);

      const byline = document.createElement('div');
      byline.className = 'news-item-byline';
      const authors = getAuthors(item);
      const publication = (item.Publication || '').trim();
      const dateStr = formatDate(item.date);

      if (authors.length > 0) {
        authors.forEach((name, index) => {
          if (index > 0) byline.appendChild(document.createTextNode(', '));
          const authorLink = document.createElement('a');
          authorLink.href = '#';
          authorLink.textContent = name;
          authorLink.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            setAuthorFilter(name);
          };
          byline.appendChild(authorLink);
        });
      }

      if (publication) {
        if (authors.length > 0) byline.appendChild(document.createTextNode(', '));
        const pubLink = document.createElement('a');
        pubLink.href = '#';
        pubLink.textContent = publication;
        pubLink.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          setPublicationFilter(publication);
        };
        byline.appendChild(pubLink);
      }

      if (authors.length > 0 || publication) byline.appendChild(document.createTextNode(' (' + dateStr + ')'));
      else byline.appendChild(document.createTextNode(dateStr));
      newsItem.appendChild(byline);

      const details = document.createElement('div');
      details.className = 'news-item-details';

      const summary = document.createElement('p');
      summary.className = 'news-item-summary';
      summary.textContent = item.Summary;
      details.appendChild(summary);

      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'news-item-tags';
      (item.Tags || []).forEach((tagText) => {
        const tag = document.createElement('a');
        tag.href = '#';
        tag.className = 'news-item-tag';
        tag.textContent = tagText;
        tag.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          setTagFilter(tagText);
        };
        tagsContainer.appendChild(tag);
      });

      details.appendChild(tagsContainer);
      newsItem.appendChild(details);
      newsContent.appendChild(newsItem);
    });
  }

  function loadNews() {
    fetch('JPEG-XL_News.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        newsData = data;
        for (const category in newsData) {
          newsData[category] = sortNewsByDate(newsData[category]);
        }
        categories = Object.keys(newsData);

        const state = readStateFromUrl();
        currentTabIndex = state.tabIndex;
        currentTagFilter = state.tag;
        currentAuthorFilter = state.author;
        currentPublicationFilter = state.publication;

        const loading = document.getElementById('loading');
        const tabBar = document.getElementById('tab-bar');
        if (loading) loading.style.display = 'none';
        if (tabBar) tabBar.style.display = 'inline-block';

        createTabs();
        switchTab(currentTabIndex, false);
        updateFilterBar();

        const clearButton = document.getElementById('filter-clear');
        if (clearButton) {
          clearButton.onclick = (event) => {
            event.preventDefault();
            clearFilter();
          };
        }

        const tagSidebar = document.getElementById('tag-sidebar');
        if (tagSidebar) {
          tagSidebar.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const link = target.closest('a[data-tag]');
            if (!link) return;

            event.preventDefault();
            setTagFilter(link.getAttribute('data-tag'));
            const toggle = document.getElementById('tag-menu-toggle');
            if (toggle && window.matchMedia('(max-width: 900px)').matches) toggle.checked = false;
          });
        }
      })
      .catch((error) => {
        console.error('Error fetching JSON:', error);
        const loading = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        if (loading) loading.style.display = 'none';
        if (errorElement) {
          errorElement.textContent = 'Failed to load news data. Please try again later.';
          errorElement.style.display = 'block';
        }
      });
  }

  window.addEventListener('popstate', () => {
    const state = readStateFromUrl();
    currentTabIndex = state.tabIndex;
    currentTagFilter = state.tag;
    currentAuthorFilter = state.author;
    currentPublicationFilter = state.publication;
    updateFilterBar();
    createTabs();
    switchTab(currentTabIndex, false);
  });

  window.addEventListener('load', loadNews);
})();
