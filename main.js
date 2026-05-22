async function fetchCbrText(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('CBR request failed');
    return response.text();
  } catch (error) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('CBR proxy request failed');
    return response.text();
  }
}

function toggleNews(button) {
  const card = button.closest('.news-card');
  const isOpen = card.classList.toggle('open');
  button.textContent = isOpen ? 'Скрыть' : 'Показать полностью';
}

async function initCurrencyPage() {
  const rateNode = document.querySelector('[data-rate]');
  if (!rateNode) return;

  const rubInput = document.querySelector('#rub');
  const usdInput = document.querySelector('#usd');
  const status = document.querySelector('#rate-status');
  let rate = 0;

  try {
    const xmlText = await fetchCbrText('https://www.cbr.ru/scripts/XML_daily.asp');
    const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
    const usd = [...xml.querySelectorAll('Valute')].find((node) => node.querySelector('CharCode').textContent === 'USD');
    rate = Number(usd.querySelector('Value').textContent.replace(',', '.')) / Number(usd.querySelector('Nominal').textContent);
    rateNode.textContent = rate.toFixed(4);
    status.textContent = `Курс Банка России на ${xml.documentElement.getAttribute('Date')}`;
  } catch (error) {
    rate = 90;
    rateNode.textContent = rate.toFixed(4);
    status.textContent = 'Не удалось загрузить курс Банка России, показан резервный пример.';
  }

  const fromRub = () => {
    usdInput.value = rubInput.value ? (Number(rubInput.value) / rate).toFixed(2) : '';
  };
  const toRub = () => {
    rubInput.value = usdInput.value ? (Number(usdInput.value) * rate).toFixed(2) : '';
  };

  rubInput.addEventListener('input', fromRub);
  usdInput.addEventListener('input', toRub);
  buildChart();
}

async function buildChart() {
  const chart = document.querySelector('#usd-chart');
  const details = document.querySelector('#chart-details');
  if (!chart) return;

  chart.textContent = 'Загрузка истории курса Банка России...';
  details.textContent = 'Данные загружаются с официального XML-интерфейса cbr.ru.';

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 35);
  const formatDate = (date) => date.toLocaleDateString('ru-RU');
  const url = `https://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=${formatDate(start)}&date_req2=${formatDate(end)}&VAL_NM_RQ=R01235`;

  let values = [];

  try {
    const xmlText = await fetchCbrText(url);
    const xml = new DOMParser().parseFromString(xmlText, 'application/xml');

    values = [...xml.querySelectorAll('Record')].map((record) => ({
      date: record.getAttribute('Date'),
      value: Number(record.querySelector('Value').textContent.replace(',', '.')) / Number(record.querySelector('Nominal').textContent),
    }));
  } catch (error) {
    values = [];
  }

  chart.textContent = '';

  if (!values.length) {
    details.textContent = 'Не удалось загрузить историю курса Банка России.';
    return;
  }

  const min = Math.min(...values.map((item) => item.value));
  const max = Math.max(...values.map((item) => item.value));

  values.forEach((item) => {
    const bar = document.createElement('button');
    bar.className = 'bar';
    bar.style.height = `${80 + ((item.value - min) / (max - min)) * 180}px`;
    bar.title = `${item.date}: ${item.value.toFixed(4)}`;
    bar.addEventListener('click', () => {
      document.querySelectorAll('.bar').forEach((node) => node.classList.remove('active'));
      bar.classList.add('active');
      details.textContent = `${item.date}: ${item.value.toFixed(4)} руб. за 1 USD`;
    });
    chart.appendChild(bar);
  });

  details.textContent = `Загружено ${values.length} значений курса Банка России за период не менее месяца. Выберите столбец на диаграмме.`;
}

document.addEventListener('DOMContentLoaded', initCurrencyPage);
