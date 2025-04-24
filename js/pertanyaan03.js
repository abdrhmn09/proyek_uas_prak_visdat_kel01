const margin = {top: 60, right: 20, bottom: 60, left: 60},
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#heatmap")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

d3.csv("data/student_performance_large_dataset.csv").then(data => {
  data.forEach(d => {
    d.SocialMediaHours = +d["Time_Spent_on_Social_Media (hours/week)"];
    d.ExamScore = +d["Exam_Score (%)"];
  });

  const genderFilter = document.getElementById("genderFilter");

  function updateHeatmap(selectedGender) {
    const filteredData = selectedGender === "all" ? data : data.filter(d => d.Gender === selectedGender);

    const xBins = 8, yBins = 8;
    const xExtent = d3.extent(filteredData, d => d.SocialMediaHours);
    const yExtent = [0, 100];

    const xScale = d3.scaleLinear().domain(xExtent).range([0, width]);
    const yScale = d3.scaleLinear().domain(yExtent).range([height, 0]);

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateYlOrRd)
      .domain([90, 50]); // lebih rendah lebih gelap

    const bins = [];
    for (let i = 0; i < xBins; i++) {
      for (let j = 0; j < yBins; j++) {
        bins.push({
          x0: xExtent[0] + i * (xExtent[1] - xExtent[0]) / xBins,
          x1: xExtent[0] + (i + 1) * (xExtent[1] - xExtent[0]) / xBins,
          y0: j * 100 / yBins,
          y1: (j + 1) * 100 / yBins,
          values: []
        });
      }
    }

    filteredData.forEach(d => {
      const bin = bins.find(b =>
        d.SocialMediaHours >= b.x0 && d.SocialMediaHours < b.x1 &&
        d.ExamScore >= b.y0 && d.ExamScore < b.y1
      );
      if (bin) bin.values.push(d.ExamScore);
    });

    bins.forEach(b => {
      b.avg = b.values.length ? d3.mean(b.values) : 0;
    });

    svg.selectAll("rect").remove();
    svg.selectAll("text.avg-label").remove();
    svg.selectAll("g.axis").remove();
    svg.selectAll("g.legendGroup").remove();

    svg.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.x0))
      .attr("y", d => yScale(d.y1))
      .attr("width", d => xScale(d.x1) - xScale(d.x0))
      .attr("height", d => yScale(d.y0) - yScale(d.y1))
      .attr("fill", d => d.avg ? colorScale(d.avg) : "#eee")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(
          `Waktu: ${d.x0.toFixed(1)}-${d.x1.toFixed(1)} jam/minggu<br>
           Nilai: ${d.y0.toFixed(0)}-${d.y1.toFixed(0)}<br>
           Rata-rata: ${d.avg ? d.avg.toFixed(1) : 'N/A'}`
        )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

    svg.selectAll("text.avg-label")
      .data(bins)
      .enter()
      .append("text")
      .attr("class", "avg-label")
      .attr("x", d => (xScale(d.x0) + xScale(d.x1)) / 2)
      .attr("y", d => (yScale(d.y0) + yScale(d.y1)) / 2 + 4)
      .text(d => d.avg ? d.avg.toFixed(0) : "")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", d => d.avg ? (d.avg < 60 ? "#fff" : "#333") : "none");

    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(6));

    svg.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(yScale).ticks(5));

    // Label sumbu X
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .style("font-size", "13px")
      .text("Waktu Media Sosial (jam/minggu)");

    // Label sumbu Y
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -35)
      .style("font-size", "13px")
      .text("Nilai Ujian (%)");

    // Legend
    const legendWidth = 200;
    const legendHeight = 10;
    const legendGroup = svg.append("g")
      .attr("class", "legendGroup")
      .attr("transform", `translate(${width - legendWidth - 20},${-50})`);

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient").attr("id", "linear-gradient");

    linearGradient.selectAll("stop")
      .data(colorScale.ticks(5).map((t, i, n) => ({
        offset: `${100 * i / (n.length - 1)}%`,
        color: colorScale(t)
      })))
      .enter()
      .append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    legendGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#linear-gradient)");

    const legendScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5);

    legendGroup.append("g")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(legendAxis)
      .select(".domain").remove();
  }

  genderFilter.addEventListener("change", () => {
    updateHeatmap(genderFilter.value);
  });

  updateHeatmap("all");
});
