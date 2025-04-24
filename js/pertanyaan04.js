fetch("../navbar/Navbar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("navbar-container").innerHTML = data;
    markActiveNavLink();
    setupNavbarInteractions();
  })
  .catch((err) => console.error("Error mengambil navbar:", err));


// Data mahasiswa yang sama dengan yang Anda berikan
const rawData = [
    {"Study_Hours_per_Week":48,"Online_Courses_Completed":14,"Assignment_Completion_Rate (%)":100,"Exam_Score (%)":69,"Attendance_Rate (%)":66,"Time_Spent_on_Social_Media (hours/week)":9,"Sleep_Hours_per_Night":8,"Self_Reported_Stress_Level":"High"},
    {"Study_Hours_per_Week":30,"Online_Courses_Completed":20,"Assignment_Completion_Rate (%)":71,"Exam_Score (%)":40,"Attendance_Rate (%)":57,"Time_Spent_on_Social_Media (hours/week)":28,"Sleep_Hours_per_Night":8,"Self_Reported_Stress_Level":"Medium"},
    {"Study_Hours_per_Week":47,"Online_Courses_Completed":11,"Assignment_Completion_Rate (%)":60,"Exam_Score (%)":43,"Attendance_Rate (%)":79,"Time_Spent_on_Social_Media (hours/week)":13,"Sleep_Hours_per_Night":7,"Self_Reported_Stress_Level":"Low"},
    // Contoh data tambahan untuk memperlihatkan pola yang lebih jelas
    {"Study_Hours_per_Week":52,"Online_Courses_Completed":18,"Assignment_Completion_Rate (%)":95,"Exam_Score (%)":75,"Attendance_Rate (%)":70,"Time_Spent_on_Social_Media (hours/week)":7,"Sleep_Hours_per_Night":6,"Self_Reported_Stress_Level":"High"},
    {"Study_Hours_per_Week":25,"Online_Courses_Completed":8,"Assignment_Completion_Rate (%)":65,"Exam_Score (%)":50,"Attendance_Rate (%)":60,"Time_Spent_on_Social_Media (hours/week)":20,"Sleep_Hours_per_Night":7,"Self_Reported_Stress_Level":"Medium"},
    {"Study_Hours_per_Week":35,"Online_Courses_Completed":5,"Assignment_Completion_Rate (%)":80,"Exam_Score (%)":65,"Attendance_Rate (%)":85,"Time_Spent_on_Social_Media (hours/week)":12,"Sleep_Hours_per_Night":8,"Self_Reported_Stress_Level":"Low"}
  ];
  
  // Variabel yang ingin dianalisis korelasi
  const features = [
    "Study_Hours_per_Week", 
    "Online_Courses_Completed", 
    "Assignment_Completion_Rate (%)", 
    "Exam_Score (%)", 
    "Attendance_Rate (%)", 
    "Time_Spent_on_Social_Media (hours/week)", 
    "Sleep_Hours_per_Night"
  ];
  
  // Menghitung rata-rata nilai untuk setiap variabel berdasarkan tingkat stres
  const stressLevels = ["Low", "Medium", "High"];
  
  // Membuat dataset untuk heatmap
  let heatmapData = [];
  
  stressLevels.forEach(stressLevel => {
    const filteredData = rawData.filter(d => d.Self_Reported_Stress_Level === stressLevel);
    
    features.forEach(feature => {
      const averageValue = d3.mean(filteredData, d => +d[feature]);
      heatmapData.push({
        stressLevel: stressLevel,
        feature: feature,
        value: averageValue
      });
    });
  });
  
  // Konfigurasi heatmap
  const margin = { top: 50, right: 100, bottom: 100, left: 250 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
  
  // Membuat SVG
  const svg = d3.select("#heatmap")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Membuat skala untuk sumbu x dan y
  const x = d3.scaleBand()
    .domain(stressLevels)
    .range([0, width])
    .padding(0.05);
  
  const y = d3.scaleBand()
    .domain(features)
    .range([0, height])
    .padding(0.05);
  
  // Membuat sumbu x dan y
  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisTop(x))
    .selectAll("text")
      .style("text-anchor", "middle")
      .style("font-weight", "bold");
  
  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y))
    .selectAll("text")
      .call(function(t) {
        t.each(function(d) {
          const self = d3.select(this);
          const text = d;
          // Potong nama variabel jika terlalu panjang
          const shortText = text.length > 25 ? text.substring(0, 25) + "..." : text;
          self.text(shortText);
        });
      });
  
  // Menghitung nilai min dan max untuk skala warna
  const minValue = d3.min(heatmapData, d => d.value);
  const maxValue = d3.max(heatmapData, d => d.value);
  
  // Skala warna untuk heatmap
  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateBlues)
    .domain([minValue, maxValue]);
  
  // Membuat tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  
  // Membuat sel heatmap
  svg.selectAll("rect")
    .data(heatmapData)
    .enter()
    .append("rect")
      .attr("class", "cell")
      .attr("x", d => x(d.stressLevel))
      .attr("y", d => y(d.feature))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => colorScale(d.value))
      .on("mouseover", function(event, d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`${d.feature}<br>Stress Level: ${d.stressLevel}<br>Value: ${d.value.toFixed(2)}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        d3.select(this)
          .style("stroke", "black")
          .style("stroke-width", 2);
      })
      .on("mouseout", function() {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
        d3.select(this)
          .style("stroke", "none");
      });
  
  // Menambahkan teks nilai pada setiap sel
  svg.selectAll("text.value")
    .data(heatmapData)
    .enter()
    .append("text")
      .attr("class", "value")
      .attr("x", d => x(d.stressLevel) + x.bandwidth() / 2)
      .attr("y", d => y(d.feature) + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .text(d => d.value.toFixed(1))
      .style("font-size", "11px")
      .style("fill", d => colorScale(d.value) === "#ffffff" ? "black" : 
        (d3.hsl(colorScale(d.value)).l < 0.5 ? "white" : "black"));
  
  // Menambahkan legenda
  const legendWidth = 20;
  const legendHeight = height;
  
  const legendScale = d3.scaleSequential()
    .interpolator(d3.interpolateBlues)
    .domain([minValue, maxValue]);
  
  const defs = svg.append("defs");
  
  const linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%");
  
  // Membuat gradient untuk legenda
  linearGradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.1))
    .enter()
    .append("stop")
    .attr("offset", d => d)
    .attr("stop-color", d => legendScale(d * (maxValue - minValue) + minValue));
  
  // Menambahkan legenda
  const legend = svg.append("g")
    .attr("transform", `translate(${width + 40}, 0)`);
  
  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#linear-gradient)");
  
  // Menambahkan skala untuk legenda
  const legendAxis = d3.axisRight()
    .scale(d3.scaleLinear().domain([minValue, maxValue]).range([legendHeight, 0]))
    .ticks(5);
  
  legend.append("g")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);
  
  // Menambahkan judul legenda
  legend.append("text")
    .attr("class", "legend-title")
    .attr("x", 0)
    .attr("y", -10)
    .text("Value");
  
  // Menambahkan judul chart
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Average Values by Stress Level");
  