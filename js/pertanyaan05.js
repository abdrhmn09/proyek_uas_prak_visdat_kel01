fetch("../navbar/Navbar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("navbar-container").innerHTML = data;
    markActiveNavLink();
    setupNavbarInteractions();
  })
  .catch((err) => console.error("Error mengambil navbar:", err));



d3.csv("/data/student_performance_large_dataset.csv").then(function(data) {
    let bins = {
      "0": [],
      "1–10": [],
      "11–20": []
    };
  
    data.forEach(d => {
      let courseCount = +d["Online_Courses_Completed"];
      let examScore = +d["Exam_Score (%)"];
  
      if (courseCount === 0) {
        bins["0"].push(examScore);
      } else if (courseCount <= 10) {
        bins["1–10"].push(examScore);
      } else if (courseCount <= 20) {
        bins["11–20"].push(examScore);
      }
      // Abaikan jika > 20
    });
  
    let avgData = Object.entries(bins).map(([key, scores]) => {
      let avg = scores.length ? d3.mean(scores) : 0;
      return { group: key, avgScore: avg };
    });
  
    const svg = d3.select("svg"),
          margin = { top: 40, right: 20, bottom: 50, left: 60 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;
  
    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const x = d3.scaleBand()
        .domain(avgData.map(d => d.group))
        .range([0, width])
        .padding(0.2);
  
    const y = d3.scaleLinear()
        .domain([0, d3.max(avgData, d => d.avgScore)])
        .nice()
        .range([height, 0]);
  
    chart.selectAll("rect")
      .data(avgData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.group))
      .attr("y", d => y(d.avgScore))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.avgScore));
  
    chart.selectAll("text.label")
      .data(avgData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.group) + x.bandwidth() / 2)
      .attr("y", d => y(d.avgScore) - 5)
      .attr("text-anchor", "middle")
      .text(d => d.avgScore.toFixed(2));
  
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
  
    chart.append("g")
        .call(d3.axisLeft(y));
  
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 35)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("Jumlah Kursus Online");
  
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left - 50)
        .attr("x", 0 - height / 2 - margin.top)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("Rata-rata Skor Ujian (%)");
  });
  