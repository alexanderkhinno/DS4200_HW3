// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const margin = {top: 20, right: 20, bottom: 60, left: 60};
    const width = 500 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select('#boxplot').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    // Get unique age groups and convert Set to array
    const ageGroups = [...new Set(data.map(d => d.AgeGroup))];
    const xScale = d3.scaleBand()
        .domain(ageGroups)
        .range([0, width])
        .padding(0.2);
    
    // Y scale for Likes - using min and max of the data
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Likes)])
        .range([height, 0]);

    // Add scales - draw the axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale));
    
    svg.append('g')
        .call(d3.axisLeft(yScale));


    // Add x-axis label
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text("Age Group");
    
    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Likes");
    
    
    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min = d3.min(values); 
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const max = d3.max(values);
        const iqr = q3 - q1;
        const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
        const upperWhisker = Math.min(max, q3 + 1.5 * iqr);
        return {min, q1, median, q3, max, lowerWhisker, upperWhisker};
    };

    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.AgeGroup);

    quantilesByGroups.forEach((quantiles, AgeGroup) => {
        const xPos = xScale(AgeGroup);
        const boxWidth = xScale.bandwidth();
        const centerX = xPos + boxWidth / 2;

        // Draw vertical lines (whiskers)
        // Lower whisker
        svg.append("line")
            .attr("x1", centerX)
            .attr("x2", centerX)
            .attr("y1", yScale(quantiles.lowerWhisker))
            .attr("y2", yScale(quantiles.q1))
            .attr("stroke", "black")
            .attr("stroke-width", 2);
        
        // Upper whisker
        svg.append("line")
            .attr("x1", centerX)
            .attr("x2", centerX)
            .attr("y1", yScale(quantiles.q3))
            .attr("y2", yScale(quantiles.upperWhisker))
            .attr("stroke", "black")
            .attr("stroke-width", 2);

        // Draw box
        svg.append("rect")
            .attr("x", xPos + boxWidth * 0.25)
            .attr("width", boxWidth * 0.5)
            .attr("y", yScale(quantiles.q3))
            .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
            .attr("fill", "lightblue")
            .attr("stroke", "black")
            .attr("stroke-width", 2);

        // Draw median line
        svg.append("line")
            .attr("x1", xPos + boxWidth * 0.25)
            .attr("x2", xPos + boxWidth * 0.75)
            .attr("y1", yScale(quantiles.median))
            .attr("y2", yScale(quantiles.median))
            .attr("stroke", "black")
            .attr("stroke-width", 2);
                
    });

    // Process data to create socialMediaAvg.csv
    // Calculate average likes by Platform and PostType
    const avgData = d3.rollup(
        data,
        v => d3.mean(v, d => d.Likes), // Calculate average likes
        d => d.Platform,   // Group by Platform
        d => d.PostType    // Sub-group by PostType
    );

    // Convert to array format: [{Platform, PostType, AvgLikes}]
    const avgArray = [];
    avgData.forEach((postTypes, platform) => {
        postTypes.forEach((avgLikes, postType) => {
            avgArray.push({
                Platform: platform,
                PostType: postType,
                AvgLikes: avgLikes.toFixed(2) // Round to 2 decimal places
            });
        });
    });

    // Create the bar plot using the data directly (no need to load from CSV)
    createBarPlot(avgArray);

    // Process data to create socialMediaTime data (Date and average likes)
    const timeData = d3.rollup(
        data,
        v => d3.mean(v, d => d.Likes), // Calculate average likes per date
        d => d.Date  // Group by Date
    );

    // Convert to array format and sort by date
    const timeArray = [];
    timeData.forEach((avgLikes, date) => {
        timeArray.push({
            Date: date,
            AvgLikes: avgLikes.toFixed(2)
        });
    });

    // Sort by date (extract date portion for sorting)
    timeArray.sort((a, b) => {
        const dateA = new Date(a.Date.split(' ')[0]);
        const dateB = new Date(b.Date.split(' ')[0]);
        return dateA - dateB;
    });

    // Create the line plot using the data directly
    createLinePlot(timeArray);
});

// Function to create the bar plot
function createBarPlot(data) {
    // Data already has numeric AvgLikes, but ensure it's a number
    data.forEach(function(d) {
        d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    const margin = {top: 20, right: 150, bottom: 60, left: 60};
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select('#barplot').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define four scales
    // Scale x0 is for the platform, which divide the whole scale into 4 parts
    // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
    // Recommend to add more spaces for the y scale for the legend
    // Also need a color scale for the post type

    const platforms = [...new Set(data.map(d => d.Platform))];
    const postTypes = [...new Set(data.map(d => d.PostType))];
    
    const x0 = d3.scaleBand()
        .domain(platforms)
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(postTypes)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.PostType))])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    
         
    // Add scales x0 and y
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x0));
    
    svg.append('g')
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text("Platform");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Average Number of Likes");


  // Group container for bars
    const barGroups = svg.selectAll("bar")
      .data(platforms)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d)},0)`);

  // Draw bars
    barGroups.selectAll("rect")
        .data(d => {
            // Get all post types for this platform
            return postTypes.map(postType => {
                const entry = data.find(item => item.Platform === d && item.PostType === postType);
                return entry || {Platform: d, PostType: postType, AvgLikes: 0};
            });
        })
        .enter()
        .append("rect")
        .attr("x", d => x1(d.PostType))
        .attr("y", d => y(d.AvgLikes))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.AvgLikes))
        .attr("fill", d => color(d.PostType));

    // Add the legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 140}, ${margin.top})`);

    const types = [...new Set(data.map(d => d.PostType))];
 
    types.forEach((type, i) => {

    // Alread have the text information for the legend. 
    // Now add a small square/rect bar next to the text with different color.
      const legendRow = legend.append("g")
          .attr("transform", `translate(0, ${i * 20})`);
      
      legendRow.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", color(type));
      
      legendRow.append("text")
          .attr("x", 20)
          .attr("y", 12)
          .text(type)
          .attr("alignment-baseline", "middle");
    });
}

// Function to create the line plot
function createLinePlot(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    const margin = {top: 20, right: 20, bottom: 60, left: 60};
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select('#lineplot').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    // Parse dates if needed, or use ordinal scale for dates
    const dates = [...new Set(data.map(d => d.Date))].sort();
    const xScale = d3.scalePoint()
        .domain(dates)
        .range([0, width])
        .padding(0.5);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .range([height, 0]);

    // Draw the axis, you can rotate the text in the x-axis here
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");
    
    svg.append('g')
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text("Date");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Average Number of Likes");

    // Draw the line and path. Remember to use curveNatural.
    const line = d3.line()
        .x(d => xScale(d.Date))
        .y(d => yScale(d.AvgLikes))
        .curve(d3.curveNatural);
    
    svg.append("path")
        .datum(data.sort((a, b) => dates.indexOf(a.Date) - dates.indexOf(b.Date)))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);
}
