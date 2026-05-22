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

async function buildChart() {
  const chart = document.querySelector('#usd-chart');
  const details = document.querySelector('#chart-details');
  if (!chart) return;

  chart.textContent = 'Загрузка истории курса ЦБ...';
  details.textContent = 'Данные загружаются из архива cbr-xml-daily.ru.';

  const dates = Array.from({ length: 35 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (34 - index));
    return date;
  });

  const values = [];

  for (const date of dates) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const url = `https://www.cbr-xml-daily.ru/archive/${year}/${month}/${day}/daily_json.js`;

    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      const usd = data.Valute && data.Valute.USD;
      if (!usd) continue;

      values.push({
        date,
        value: Number((usd.Value / usd.Nominal).toFixed(4)),
      });
    } catch (error) {
      continue;
    }
  }

  chart.textContent = '';

  if (values.length < 30) {
    details.textContent = 'Не удалось загрузить достаточную историю курса ЦБ за месяц.';
    return;
  }

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

  details.textContent = `Загружено ${values.length} значений курса ЦБ за последний месяц. Выберите столбец на диаграмме.`;
}

document.addEventListener('DOMContentLoaded', initCurrencyPage);
