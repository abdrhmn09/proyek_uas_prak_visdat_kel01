fetch("../navbar/Navbar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("navbar-container").innerHTML = data;
    markActiveNavLink();
    setupNavbarInteractions();
  })
  .catch((err) => console.error("Error mengambil navbar:", err));


const margin = { top: 50, right: 30, bottom: 80, left: 130 },
width = 700 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

const svg = d3.select("#heatmap")
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0);

d3.csv("/data/student_performance_large_dataset.csv").then(rawData => {
const features = [
"Study_Hours_per_Week",
"Online_Courses_Completed",
"Assignment_Completion_Rate (%)",
"Exam_Score (%)",
"Attendance_Rate (%)",
"Time_Spent_on_Social_Media (hours/week)",
"Sleep_Hours_per_Night"
];

const stressLevels = ["Low", "Medium", "High"];

let heatmapData = [];

stressLevels.forEach(stressLevel => {
const filteredData = rawData.filter(d => d["Self_Reported_Stress_Level"] === stressLevel);
features.forEach(feature => {
  const averageValue = d3.mean(filteredData, d => +d[feature]);
  heatmapData.push({
    stressLevel: stressLevel,
    feature: feature,
    value: averageValue
  });
});
});

const xScale = d3.scaleBand()
.range([0, width])
.domain(features)
.padding(0.05);

const yScale = d3.scaleBand()
.range([0, height])
.domain(stressLevels)
.padding(0.05);

const colorScale = d3.scaleSequential()
.interpolator(d3.interpolateYlGnBu)
.domain([0, d3.max(heatmapData, d => d.value)]);

svg.append("g")
.attr("transform", `translate(0,${height})`)
.call(d3.axisBottom(xScale))
.selectAll("text")
.attr("transform", "translate(-10,0)rotate(-45)")
.style("text-anchor", "end");

svg.append("g")
.call(d3.axisLeft(yScale));

svg.selectAll()
.data(heatmapData)
.enter()
.append("rect")
.attr("x", d => xScale(d.feature))
.attr("y", d => yScale(d.stressLevel))
.attr("width", xScale.bandwidth())
.attr("height", yScale.bandwidth())
.style("fill", d => colorScale(d.value))
.on("mouseover", (event, d) => {
  tooltip.transition().duration(200).style("opacity", 0.9);
  tooltip.html(
    `Stress Level: <b>${d.stressLevel}</b><br>
     Fitur: <b>${d.feature}</b><br>
     Rata-rata: <b>${d.value.toFixed(2)}</b>`
  )
  .style("left", (event.pageX + 10) + "px")
  .style("top", (event.pageY - 28) + "px");
})
.on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

const defs = svg.append("defs");
const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");

linearGradient.selectAll("stop")
.data(colorScale.ticks(10).map((t, i, n) => ({
  offset: `${100 * i / (n.length - 1)}%`,
  color: colorScale(t)
})))
.enter()
.append("stop")
.attr("offset", d => d.offset)
.attr("stop-color", d => d.color);

const legendWidth = 200;
const legendHeight = 10;

const legendGroup = svg.append("g")
.attr("transform", `translate(${width - legendWidth - 50}, -30)`);

legendGroup.append("rect")
.attr("width", legendWidth)
.attr("height", legendHeight)
.style("fill", "url(#legend-gradient)");

const legendScale = d3.scaleLinear()
.domain(colorScale.domain())
.range([0, legendWidth]);

const legendAxis = d3.axisBottom(legendScale).ticks(5);

legendGroup.append("g")
.attr("transform", `translate(0,${legendHeight})`)
.call(legendAxis)
.select(".domain").remove();
});
