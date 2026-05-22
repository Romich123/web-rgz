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
    const response = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
    const data = await response.json();
    const usd = data.Valute.USD;
    rate = usd.Value / usd.Nominal;
    rateNode.textContent = rate.toFixed(4);
    status.textContent = `Курс ЦБ РФ на ${new Date(data.Date).toLocaleDateString('ru-RU')}`;
  } catch (error) {
    rate = 90;
    rateNode.textContent = rate.toFixed(4);
    status.textContent = 'Не удалось загрузить курс, показан резервный пример.';
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

function buildChart() {
  const chart = document.querySelector('#usd-chart');
  const details = document.querySelector('#chart-details');
  if (!chart) return;

  const base = 90.4;
  const values = Array.from({ length: 34 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (33 - index));
    const value = base + Math.sin(index / 3) * 2.4 + index * 0.035;
    return { date, value: Number(value.toFixed(4)) };
  });

  const min = Math.min(...values.map((item) => item.value));
  const max = Math.max(...values.map((item) => item.value));

  values.forEach((item) => {
    const bar = document.createElement('button');
    bar.className = 'bar';
    bar.style.height = `${80 + ((item.value - min) / (max - min)) * 180}px`;
    bar.title = `${item.date.toLocaleDateString('ru-RU')}: ${item.value}`;
    bar.addEventListener('click', () => {
      document.querySelectorAll('.bar').forEach((node) => node.classList.remove('active'));
      bar.classList.add('active');
      details.textContent = `${item.date.toLocaleDateString('ru-RU')}: ${item.value} руб. за 1 USD`;
    });
    chart.appendChild(bar);
  });
}

document.addEventListener('DOMContentLoaded', initCurrencyPage);
