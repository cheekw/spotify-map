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
  drawLegend(color, svg);

  // draws the map
  drawMap(color, svg, tooltip);
}

function drawMap(color, svg, tooltip) {
  let path = d3.geoPath();

  d3.csv("./data/artist_ranks.csv").then(rankData => {
    let ranks = {};
    for (let i = 0; i < rankData.length; i++) {
      ranks[rankData[i]['State']] = rankData[i];
    }
    d3.json("./data/us-state-names.json").then(states => {
      d3.json("./data/us-map.json").then(us => {
        svg.append("g")
          .attr("class", "states")
          .selectAll("path")
          .data(topojson.feature(us, us.objects.states).features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("class", (d) => {
            if (isNotDC(d.id)) {
              return states[parseInt(d.id)][0];
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
              // TODO: add animation on click

            }
          })
          .on("mousemove", (d) => {
            if (isNotDC(d.id)) {
              tooltip.transition()
                .duration(200)
                .style("opacity", .9);
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
      });
    });
  });
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

  svg.append("g")
    .attr("transform", "translate(600,40)")
    .call(legend);
}