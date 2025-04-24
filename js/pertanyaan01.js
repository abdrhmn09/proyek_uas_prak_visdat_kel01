const margin = { top: 30, right: 30, bottom: 60, left: 100 };
const width = 600 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

const svg = d3.select('#box-plot')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

let stats = {}, sampleSizes = {};
const levels = ['Low', 'Medium', 'High'];
const colorScale = d3.scaleOrdinal()
  .domain(levels)
  .range(['#ffb3b3', '#ff6666', '#cc0000']);

function drawAllBoxes() {
  svg.selectAll('*').remove();

  const y = d3.scaleBand().domain(levels).range([0, height]).padding(0.4);
  const x = d3.scaleLinear().domain([0, 100]).range([0, width]);

  svg.append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('x', -margin.left + 10)
    .attr('y', -10)
    .attr('fill', 'black')
    .attr('text-anchor', 'start')
    .style('font-weight', 'bold')
    .text('Stress Level');

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-weight', 'bold')
    .text('Exam Score');

  levels.forEach(level => {
    const s = stats[level];

    svg.append('rect')
      .attr('y', y(level))
      .attr('x', x(s.q1))
      .attr('width', x(s.q3) - x(s.q1))
      .attr('height', y.bandwidth())
      .attr('fill', colorScale(level))
      .attr('stroke', '#000');

    svg.append('line')
      .attr('x1', x(s.median))
      .attr('x2', x(s.median))
      .attr('y1', y(level))
      .attr('y2', y(level) + y.bandwidth())
      .attr('stroke', '#000')
      .style('stroke-width', '2px');

    svg.append('line').attr('x1', x(s.min)).attr('x2', x(s.q1)).attr('y1', y(level) + y.bandwidth()/2).attr('y2', y(level) + y.bandwidth()/2).attr('stroke', '#000');
    svg.append('line').attr('x1', x(s.min)).attr('x2', x(s.min)).attr('y1', y(level)).attr('y2', y(level) + y.bandwidth()).attr('stroke', '#000');
    svg.append('line').attr('x1', x(s.q3)).attr('x2', x(s.max)).attr('y1', y(level) + y.bandwidth()/2).attr('y2', y(level) + y.bandwidth()/2).attr('stroke', '#000');
    svg.append('line').attr('x1', x(s.max)).attr('x2', x(s.max)).attr('y1', y(level)).attr('y2', y(level) + y.bandwidth()).attr('stroke', '#000');

    svg.append('rect')
      .attr('x', x(+s.mean) - 5)
      .attr('y', y(level) + y.bandwidth()/2 - 5)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', 'orange')
      .attr('stroke', '#000');
  });
}

function renderTable() {
  const c = d3.select('#stats-summary');
  c.html('');
  const table = c.append('table');

  const header = ['Stress Level', 'N', 'Min', 'Q1', 'Median', 'Q3', 'Max', 'Mean'];
  table.append('thead').append('tr')
    .selectAll('th')
    .data(header)
    .enter().append('th').text(d => d);

  const tbody = table.append('tbody');
  levels.forEach(level => {
    const s = stats[level];
    const row = tbody.append('tr');
    const data = [level, sampleSizes[level], s.min, s.q1, s.median, s.q3, s.max, s.mean];
    row.selectAll('td').data(data).enter().append('td').text(d => d);
  });
}

d3.csv('../data/student_performance_large_dataset.csv').then(data => {
  data.forEach(d => d['Exam_Score (%)'] = +d['Exam_Score (%)']);

  levels.forEach(level => {
    const group = data.filter(d => d.Self_Reported_Stress_Level === level);
    const scores = group.map(d => d['Exam_Score (%)']).sort(d3.ascending);

    sampleSizes[level] = group.length;
    stats[level] = {
      min: d3.min(scores),
      q1: d3.quantile(scores, 0.25),
      median: d3.quantile(scores, 0.5),
      q3: d3.quantile(scores, 0.75),
      max: d3.max(scores),
      mean: d3.mean(scores).toFixed(2)
    };
  });

  drawAllBoxes();
  renderTable();
});