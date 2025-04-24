const svg = d3.select('#chart'),
      margin = { top: 50, right: 60, bottom: 80, left: 60 },
      width = +svg.attr('width') - margin.left - margin.right,
      height = +svg.attr('height') - margin.top - margin.bottom;

const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

const stressMap = { 'Low': 1, 'Medium': 2, 'High': 3 };

let allData;
let currentFilter = 'all';

d3.csv('../data/student_performance_large_dataset.csv').then(data => {
  allData = data;
  updateChart('all');
});

function updateChart(genderFilter) {
  // Update button appearance
  d3.selectAll('.btn').classed('active', false)
    .style('box-shadow', 'none')
    .style('opacity', '1');
  
  d3.select(`.btn-${genderFilter === 'all' ? 'all' : genderFilter.toLowerCase()}`)
    .classed('active', true)
    .style('box-shadow', '0 0 5px #000 inset')
    .style('opacity', '0.9');
    
  currentFilter = genderFilter;
  
  g.selectAll('*').remove();

  let filtered = (genderFilter === 'all') ? allData : allData.filter(d => d.Gender === genderFilter);

  const nested = Array.from(
    d3.rollup(
      filtered,
      v => ({
        avgScore: d3.mean(v, d => +d['Exam_Score (%)']),
        avgStress: d3.mean(v, d => stressMap[d.Self_Reported_Stress_Level])
      }),
      d => d.Preferred_Learning_Style
    ),
    ([learningStyle, vals]) => ({ learningStyle, ...vals })
  );

  const x = d3.scaleBand()
      .domain(nested.map(d => d.learningStyle))
      .range([0, width])
      .padding(0.2);

  const y0 = d3.scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height, 0]);

  const y1 = d3.scaleLinear()
      .domain([1, 3])
      .nice()
      .range([height, 0]);

  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
      .attr('transform', 'rotate(-20)')
      .style('text-anchor', 'end');

  g.append('g')
    .attr('class', 'y-axis-score')
    .call(d3.axisLeft(y0));

  g.append('g')
    .attr('class', 'y-axis-stress')
    .attr('transform', `translate(${width},0)`)
    .call(d3.axisRight(y1).ticks(3));

  svg.selectAll('.axis-label').remove();

  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', margin.left + width / 2)
    .attr('y', margin.top + height + 60)
    .attr('text-anchor', 'middle')
    .text('Preferred Learning Style');

  svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', - (margin.top + height / 2))
    .attr('y', margin.left - 40)
    .attr('text-anchor', 'middle')
    .text('Average Exam Score (%)');

  svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', - (margin.top + height / 2))
    .attr('y', margin.left + width + 40)  // Increased spacing
    .attr('text-anchor', 'middle')
    .text('Average Stress Level');

  const barColor = genderFilter === 'Male' ? 'blue' : genderFilter === 'Female' ? 'crimson' : 'purple';

  g.selectAll('.bar')
    .data(nested)
    .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.learningStyle))
      .attr('y', d => y0(d.avgScore))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y0(d.avgScore))
      .attr('fill', barColor);

  // Add bar value labels
  g.selectAll('.bar-label')
    .data(nested)
    .enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => x(d.learningStyle) + x.bandwidth() / 2)
      .attr('y', d => y0(d.avgScore) - 5)
      .attr('text-anchor', 'middle')
      .text(d => d.avgScore.toFixed(1));

  const line = d3.line()
    .x(d => x(d.learningStyle) + x.bandwidth() / 2)
    .y(d => y1(d.avgStress));

  g.append('path')
    .datum(nested)
    .attr('class', 'line')
    .attr('d', line);

  g.selectAll('.circle')
    .data(nested)
    .enter().append('circle')
      .attr('class', 'circle')
      .attr('cx', d => x(d.learningStyle) + x.bandwidth() / 2)
      .attr('cy', d => y1(d.avgStress))
      .attr('r', 4);
      
  // Add stress point value labels
  g.selectAll('.stress-label')
    .data(nested)
    .enter().append('text')
      .attr('class', 'stress-label')
      .attr('x', d => x(d.learningStyle) + x.bandwidth() / 2)
      .attr('y', d => y1(d.avgStress) - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', 'tomato')
      .text(d => d.avgStress.toFixed(2));

  const legend = svg.selectAll('.legend').data([1]);
  const legendEnter = legend.enter().append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${margin.left + 10},${margin.top - 30})`);

  legendEnter.append('rect')
    .attr('x', 0).attr('width', 15).attr('height', 15)
    .attr('fill', barColor);
  legendEnter.append('text')
    .attr('x', 20).attr('y', 12)
    .text('Avg Exam Score');

  legendEnter.append('line')
    .attr('x1', 120).attr('x2', 135).attr('y1', 8).attr('y2', 8)
    .attr('stroke', 'tomato').attr('stroke-width', 2);
  legendEnter.append('text')
    .attr('x', 140).attr('y', 12)
    .text('Avg Stress Level');
}