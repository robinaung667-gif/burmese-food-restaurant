const reserveButton = document.querySelector('.reserve-button');
const reservationForm = document.querySelector('#reserve');
const faloodaImage = document.querySelector('img[alt^="Colorful chilled falooda"]');
const reservationStorageKey = 'kaungSettReservations';
const supabaseUrl = 'https://opqhpseenlwunlrnkdwf.supabase.co';
const supabasePublishableKey = 'sb_publishable_hsIFeLuytJSZM8w-ksTjaw_gua7wD6w';
let loadedReservations = [];
const supabaseHeaders = {
  apikey: supabasePublishableKey,
  Authorization: `Bearer ${supabasePublishableKey}`,
  'Content-Type': 'application/json'
};
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
const normalizeReservation = (reservation) => ({ ...reservation, submittedAt: reservation.submittedAt || reservation.created_at || new Date().toISOString() });
const supabaseRequest = async (path, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { ...options, signal: controller.signal, headers: { ...supabaseHeaders, ...options.headers } });
    if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
    return response.status === 204 ? null : response.json();
  } finally {
    clearTimeout(timeout);
  }
};
const menuImages = {
  'Tea leaf salad': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Lahpet_thohk_%2820250315181751%29.jpg',
  'Ginger salad': 'Gingersalad.png',
  'Tofu fritters': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Ethnic_women_buying_fried_Tofu_%28April_2020%29.jpg',
  Mohinga: 'mohinga-hero.jpg',
  'Shan noodles': 'shannoodle.png',
  'Coconut noodles': 'Coconut.png'
};

document.querySelectorAll('.menu-item').forEach((item) => {
  const dishName = item.querySelector('h3')?.textContent.trim();
  const image = item.querySelector('img');
  if (image && menuImages[dishName]) {
    image.src = menuImages[dishName];
  }

  if (dishName === 'Tofu fritters') {
    image.src = 'tofuthoke.png';
    image.alt = 'Burmese tofu thoke salad with herbs and vegetables';
    item.querySelector('h3').textContent = 'Tofu Thoke';
    item.querySelector('p').textContent = 'Chickpea tofu, cabbage, tomato, onion, coriander, peanuts';

    const fritterItem = item.cloneNode(true);
    fritterItem.querySelector('img').src = 'tofufritters.png';
    fritterItem.querySelector('img').alt = 'Golden Burmese tofu fritters with tamarind dip';
    fritterItem.querySelector('h3').textContent = 'Tofu Fritters';
    fritterItem.querySelector('p').textContent = 'Crispy chickpea tofu, garlic, turmeric, scallion, tamarind dip';
    fritterItem.querySelector('strong').textContent = '$11';
    item.after(fritterItem);
  }
});

if (faloodaImage) {
  faloodaImage.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoIe5Umqq3F6dtH6RkExyW61_dHbdFxk5GmVkg9ohOjA&s=10';
}

const orderBar = document.querySelector('.order-bar');
const orderDrawer = document.querySelector('.order-drawer');
if (orderBar && orderDrawer) {
  const cart = new Map();
  const cartItems = orderDrawer.querySelector('.cart-items');
  const emptyState = orderDrawer.querySelector('.cart-empty');
  const totalElement = orderDrawer.querySelector('.cart-total strong');
  const barTotal = orderBar.querySelector('.order-total');
  const barCount = orderBar.querySelector('.order-count');
  orderDrawer.querySelector('.order-form .primary-button').innerHTML = 'Send order by email <span>↗</span>';

  document.querySelectorAll('.menu-item').forEach((item) => {
    const name = item.querySelector('h3')?.textContent.trim();
    const price = Number.parseFloat(item.querySelector('strong')?.textContent.replace('$', ''));
    if (!name || Number.isNaN(price)) return;
    const button = document.createElement('button');
    button.className = 'add-order';
    button.type = 'button';
    button.textContent = 'Add to order +';
    button.dataset.name = name;
    button.dataset.price = price;
    item.append(button);
  });

  const formatMoney = (value) => `$${value.toFixed(2)}`;
  const renderCart = () => {
    const entries = [...cart.values()];
    const count = entries.reduce((sum, item) => sum + item.quantity, 0);
    const total = entries.reduce((sum, item) => sum + item.price * item.quantity, 0);
    barCount.textContent = `${count} item${count === 1 ? '' : 's'}`;
    barTotal.textContent = formatMoney(total);
    totalElement.textContent = formatMoney(total);
    emptyState.hidden = entries.length > 0;
    cartItems.innerHTML = entries.map((item) => `<div class="cart-line" data-cart-name="${escapeHTML(item.name)}"><div><h3>${escapeHTML(item.name)}</h3><p>${formatMoney(item.price)} each</p></div><strong>${formatMoney(item.price * item.quantity)}</strong><div class="cart-controls"><button type="button" data-cart-action="decrease" aria-label="Remove one ${escapeHTML(item.name)}">−</button><span>${item.quantity}</span><button type="button" data-cart-action="increase" aria-label="Add one ${escapeHTML(item.name)}">+</button></div></div>`).join('');
  };

  document.addEventListener('click', (event) => {
    const addButton = event.target.closest('.add-order');
    if (addButton) {
      const name = addButton.dataset.name;
      const current = cart.get(name) || { name, price: Number(addButton.dataset.price), quantity: 0 };
      current.quantity += 1;
      cart.set(name, current);
      renderCart();
      orderDrawer.classList.add('is-open');
      orderDrawer.setAttribute('aria-hidden', 'false');
      document.querySelector('.drawer-backdrop').classList.add('is-open');
    }

    const control = event.target.closest('[data-cart-action]');
    if (control) {
      const line = control.closest('[data-cart-name]');
      const name = line.dataset.cartName;
      const item = cart.get(name);
      item.quantity += control.dataset.cartAction === 'increase' ? 1 : -1;
      if (item.quantity <= 0) cart.delete(name);
      renderCart();
    }
  });

  const closeDrawer = () => { orderDrawer.classList.remove('is-open'); orderDrawer.setAttribute('aria-hidden', 'true'); document.querySelector('.drawer-backdrop').classList.remove('is-open'); };
  orderBar.querySelector('.view-order').addEventListener('click', () => { orderDrawer.classList.add('is-open'); orderDrawer.setAttribute('aria-hidden', 'false'); document.querySelector('.drawer-backdrop').classList.add('is-open'); });
  orderDrawer.querySelector('.close-order').addEventListener('click', closeDrawer);
  document.querySelector('.drawer-backdrop').addEventListener('click', closeDrawer);
  orderDrawer.querySelector('.order-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!cart.size) { orderDrawer.querySelector('.order-message').textContent = 'Add at least one dish first.'; return; }
    const form = new FormData(event.currentTarget);
    const lines = [...cart.values()].map((item) => `${item.quantity} x ${item.name} - ${formatMoney(item.price * item.quantity)}`);
    const total = [...cart.values()].reduce((sum, item) => sum + item.price * item.quantity, 0);
    const message = [`Hello Kaung Sett, I would like to order:`, ...lines, `Total: ${formatMoney(total)}`, `Name: ${form.get('customer')}`, `Phone: ${form.get('phone')}`, `Notes: ${form.get('notes') || 'None'}`].join('\n');
    const subject = `New Kaung Sett order from ${form.get('customer')}`;
    window.location.href = `mailto:robinaung667@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    orderDrawer.querySelector('.order-message').textContent = 'Your email draft is ready to send.';
  });
  renderCart();
}

if (reserveButton && !reservationForm) {
  reserveButton.addEventListener('click', () => {
    reserveButton.innerHTML = 'Call us <span aria-hidden="true">+959 759 140 484</span>';
    reserveButton.setAttribute('href', 'tel:+959759140484');
  });
}

if (reservationForm instanceof HTMLFormElement) {
  reservationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = reservationForm.querySelector('.form-message');
    const formData = new FormData(reservationForm);
    const reservation = {
      id: Date.now().toString(),
      name: formData.get('name') || reservationForm.querySelector('#name')?.value.trim(),
      date: formData.get('date') || reservationForm.querySelector('#date')?.value,
      time: formData.get('time') || reservationForm.querySelector('#time')?.value,
      guests: formData.get('guests') || reservationForm.querySelector('#guests')?.value,
      status: 'New',
      submittedAt: new Date().toISOString()
    };
    const reservations = JSON.parse(localStorage.getItem(reservationStorageKey) || '[]');
    reservations.unshift(reservation);
    localStorage.setItem(reservationStorageKey, JSON.stringify(reservations));
    message.textContent = 'Request received. We will call shortly to confirm your table.';
    reservationForm.reset();
    try {
      await supabaseRequest('reservations', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ name: reservation.name, date: reservation.date, time: reservation.time, guests: reservation.guests, status: reservation.status }) });
    } catch (error) {
      message.textContent = 'Request saved. We will call shortly to confirm your table.';
    }
  });
}

const reservationList = document.querySelector('#reservation-list');
if (reservationList) {
  const getReservations = async () => {
    try {
      const reservations = await supabaseRequest('reservations?select=*');
      return { reservations: reservations.map(normalizeReservation).sort((first, second) => new Date(second.submittedAt) - new Date(first.submittedAt)), server: true };
    } catch (error) {
      const connectionError = error.name === 'AbortError' ? 'Supabase connection timed out' : 'Supabase connection unavailable';
      try {
        const response = await fetch(`reservations.json?refresh=${Date.now()}`);
        if (!response.ok) throw new Error('Could not load reservation file');
        return { reservations: await response.json(), server: false, connectionError };
      } catch (fileError) {
        return { reservations: JSON.parse(localStorage.getItem(reservationStorageKey) || '[]'), server: false, connectionError };
      }
    }
  };

  const renderReservations = async () => {
    const { reservations, server, connectionError } = await getReservations();
    loadedReservations = reservations;
    const count = document.querySelector('#reservation-count');
    if (count) count.textContent = `${reservations.length} request${reservations.length === 1 ? '' : 's'}${server ? '' : ' · device only'}`;
    reservationList.innerHTML = reservations.length ? reservations.map((reservation) => `<article class="request-card" data-id="${escapeHTML(reservation.id)}"><div class="request-top"><span class="request-status ${reservation.status === 'Confirmed' ? 'is-confirmed' : ''}">${escapeHTML(reservation.status)}</span><time>${escapeHTML(new Date(reservation.submittedAt).toLocaleString())}</time></div><h2>${escapeHTML(reservation.name)}</h2><p>${escapeHTML(reservation.date)} · ${escapeHTML(reservation.time)} · ${escapeHTML(reservation.guests)}</p><div class="request-actions"><button type="button" data-action="confirm">${reservation.status === 'Confirmed' ? 'Mark new' : 'Confirm'}</button><button type="button" data-action="delete">Delete</button></div></article>`).join('') : `<div class="empty-state"><strong>${escapeHTML(connectionError || 'No reservations yet')}</strong><span>${connectionError ? 'Check the Supabase project URL, key, and table policies.' : 'New requests from the website will appear here.'}</span></div>`;
  };

  reservationList.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    const card = event.target.closest('[data-id]');
    if (!button || !card) return;
    try {
      const method = button.dataset.action === 'delete' ? 'DELETE' : 'PATCH';
      const reservationId = encodeURIComponent(card.dataset.id);
      const body = method === 'PATCH' ? JSON.stringify({ status: card.querySelector('.request-status').textContent === 'Confirmed' ? 'New' : 'Confirmed' }) : undefined;
      await supabaseRequest(`reservations?id=eq.${reservationId}`, { method, headers: { Prefer: 'return=representation' }, body });
    } catch (error) {
      let reservations = JSON.parse(localStorage.getItem(reservationStorageKey) || '[]');
      if (button.dataset.action === 'delete') reservations = reservations.filter((reservation) => reservation.id !== card.dataset.id);
      if (button.dataset.action === 'confirm') reservations = reservations.map((reservation) => reservation.id === card.dataset.id ? { ...reservation, status: reservation.status === 'Confirmed' ? 'New' : 'Confirmed' } : reservation);
      localStorage.setItem(reservationStorageKey, JSON.stringify(reservations));
    }
    renderReservations();
  });

  document.querySelector('#clear-reservations')?.addEventListener('click', async () => {
    if (window.confirm('Delete all reservation requests?')) {
      try { await supabaseRequest('reservations?id=not.is.null', { method: 'DELETE' }); } catch (error) { localStorage.removeItem(reservationStorageKey); }
      renderReservations();
    }
  });

  document.querySelector('#export-reservations')?.addEventListener('click', () => {
    const csv = ['Name,Date,Time,Guests,Status,Submitted', ...loadedReservations.map((reservation) => [reservation.name, reservation.date, reservation.time, reservation.guests, reservation.status, reservation.submittedAt].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'kaung-sett-reservations.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  renderReservations();
  window.addEventListener('storage', (event) => {
    if (event.key === reservationStorageKey) renderReservations();
  });
  window.addEventListener('focus', renderReservations);
}
