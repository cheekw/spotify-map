'use-strict';

// map size
let width = 960,
  height = 600

window.onload = function () {
  // adding svg
  svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // add tooltip
  let tooltip = drawTooltip();

  // define color scales
  let color = scaleColors();

  // draws the map legend
  let legend = drawLegend(color, svg);

  // draws the map
  drawMap(color, svg, tooltip, legend);
}

// draws the entire choropleth map
function drawMap(color, svg, tooltip, legend) {
  let path = d3.geoPath();
  d3.csv("./data/artist_ranks.csv").then(rankData => getStates(rankData))
    .then(ranks => {
      d3.json("./data/us-state-names.json").then(states => {
        d3.json("./data/us-map.json").then(us => {
          drawChoropleth(color, svg, tooltip, path, ranks, states, us, legend);
          unfadeMap(legend);
        });
      });
    });
}

// adds the choropleth map
function drawChoropleth(color, svg, tooltip, path, ranks, states, us, legend) {
  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", (d) => {
      if (isNotDC(d.id)) {
        return "states " + states[parseInt(d.id)][0];
      }
    })
    .style('stroke-width', "1")
    .style('stroke', "#fff")
    .style("fill", (d) => {
      if (isNotDC(d.id)) {
        return color(ranks[states[parseInt(d.id)][0]]['US Rank']);
      }
    })
    .on("click", (d) => {
      if (isNotDC(d.id)) {
        fadeAnimation(states, d.id, legend);
      }
    })
    .on("mousemove", (d) => {
      if (isNotDC(d.id)) {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip.html(
          "<b>" + "State: " + states[parseInt(d.id)][1] + "</b>" + "<br/>" +
          "Artist: " + ranks[states[parseInt(d.id)][0]]['Name'] + "<br/>" +
          "US Rank: " + ranks[states[parseInt(d.id)][0]]['US Rank'] + "<br/>" +
          "State Rank: " + ranks[states[parseInt(d.id)][0]]['State Rank']
        )
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY + 25) + "px");
      }
    })
    .on("mouseout", (d) => {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
  svg.append("path")
    .attr("class", "state-borders")
    .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => { return a !== b; })));
}

function getStates(rankData) {
  let ranks = {};
  for (let i = 0; i < rankData.length; i++) {
    ranks[rankData[i]['State']] = rankData[i];
  }
  return ranks
}

// unfades the map
function unfadeMap(legend) {
  d3.select("html").on("click", () => {
    let outside = d3.selectAll(".states").filter(equalToEventTarget).empty();
    if (outside) {
      unfadeAnimation(legend);
    }
  });
}

// gets current click target
function equalToEventTarget() {
  return this == d3.event.target;
}

// creates animtion
function fadeAnimation(states, id, legend) {
  for (stateId in states) {
    if (states[stateId][0] != states[parseInt(id)][0]) {
      d3.select("." + states[stateId][0])
        .transition()
        .style("opacity", 0.1);
    }
  }
  d3.select("." + states[parseInt(id)][0])
    .transition()
    .style("opacity", 1);
  legend.transition().style("opacity", 0.1);
}

// creates unfade animation
function unfadeAnimation(legend) {
  d3.selectAll(".states")
    .transition()
    .style("opacity", 1);
  legend.transition()
    .style("opacity", 1);
}

// gets rank dictionary from an array, converting the state into a key
function getRanks(rankData) {
  let ranks = {};
  for (let i = 0; i < rankData.length; i++) {
    ranks[rankData[i]['State']] = rankData[i];
  }
  return ranks;
}

// checks that the ANSI id is not the District of Coumbia
function isNotDC(id) {
  return id != "11"
}

// function to scale colors based on rank
function scaleColors() {
  return d3.scaleQuantize().domain([0, 270])
    .range(d3.schemeBlues[9]);
}

// adds the tooltip to html
function drawTooltip() {
  return d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
}

// draws the map legend
function drawLegend(color, svg) {
  let legend = g => {
    let x = d3.scaleLinear()
      .domain(color.domain())
      .rangeRound([0, 270]).nice()

    g.selectAll("rect")
      .data(color.range().map(d => color.invertExtent(d)))
      .join("rect")
      .attr("height", 8)
      .attr("x", d => x(d[0]))
      .attr("width", d => x(d[1]) - x(d[0]))
      .attr("fill", d => color(d[0]));

    g.append("text")
      .attr("class", "caption")
      .attr("x", x.range()[0])
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text("Artist US Ranking");

    g.append("text")
      .attr("x", x.range()[x.length])
      .attr("y", 22)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .text("+");

    g.call(d3.axisBottom(x)
      .tickSize(13)
      .tickFormat(d3.format("d"))
      .tickValues([1, 30, 60, 90, 120, 150, 180, 210, 240, 270]))
      .select(".domain")
      .remove()
  }

  return svg.append("g")
    .attr("transform", "translate(600,40)")
    .call(legend);
}