const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

const state = {
  products: [],
  filtered: []
};

const els = {
  rows: document.getElementById('productRows'),
  search: document.getElementById('searchInput'),
  category: document.getElementById('categoryFilter'),
  updateNote: document.getElementById('update-note'),
  disclaimer: document.getElementById('disclaimer'),
  metricProducts: document.getElementById('metric-products'),
  metricDrops: document.getElementById('metric-drops'),
  metricRises: document.getElementById('metric-rises'),
  metricUpdated: document.getElementById('metric-updated')
};

fetch('data/products.json')
  .then((response) => response.json())
  .then((data) => {
    state.products = data.products;
    state.filtered = data.products;
    hydrateSummary(data);
    populateCategories(data.products);
    renderRows(data.products);
    bindControls();
  })
  .catch(() => {
    els.rows.innerHTML = '<tr><td colspan="6" class="empty-state">Unable to load the product data.</td></tr>';
  });

function hydrateSummary(data) {
  const rises = data.products.filter((p) => p.weeklyChange > 0).length;
  const drops = data.products.filter((p) => p.weeklyChange < 0).length;
  els.metricProducts.textContent = data.site.productCount;
  els.metricDrops.textContent = drops;
  els.metricRises.textContent = rises;
  els.metricUpdated.textContent = formatDate(data.site.lastUpdated);
  els.updateNote.textContent = `Latest update: ${formatDate(data.site.lastUpdated)} • Next Monday refresh: ${formatDate(data.site.nextUpdate)}`;
  els.disclaimer.textContent = data.site.disclaimer;
}

function populateCategories(products) {
  const categories = [...new Set(products.map((p) => p.category))].sort();
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    els.category.appendChild(option);
  });
}

function bindControls() {
  const applyFilters = () => {
    const query = els.search.value.trim().toLowerCase();
    const category = els.category.value;

    state.filtered = state.products.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || product.category === category;
      return matchesQuery && matchesCategory;
    });

    renderRows(state.filtered);
  };

  els.search.addEventListener('input', applyFilters);
  els.category.addEventListener('change', applyFilters);
}

function renderRows(products) {
  if (!products.length) {
    els.rows.innerHTML = '<tr><td colspan="6" class="empty-state">No products match this filter.</td></tr>';
    return;
  }

  els.rows.innerHTML = products.map((product) => {
    const trend = weeklyBadge(product.weeklyChange);
    return `
      <tr>
        <td>
          <div class="product-name">${product.name}</div>
        </td>
        <td>${product.category}</td>
        <td class="price">${currency.format(product.currentPrice)}</td>
        <td>${trend}</td>
        <td class="price">${currency.format(product.lowPrice52w)}</td>
        <td class="price">${currency.format(product.highPrice52w)}</td>
      </tr>
    `;
  }).join('');
}

function weeklyBadge(change) {
  if (change > 0) {
    return `<span class="badge badge--up">▲ ${currency.format(change)}</span>`;
  }
  if (change < 0) {
    return `<span class="badge badge--down">▼ ${currency.format(Math.abs(change))}</span>`;
  }
  return '<span class="badge badge--flat">• No change</span>';
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}