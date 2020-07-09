const data = [
    {
      country: "China",
      percentage: 35.2,
      value: 32,
      color: "#dfd3c3"
    },
    {
      country: "India",
      percentage: 5.3,
      value: 10,
      color: "#0fc9e7"
    },
    {
      country: "Japan",
      percentage: 5.3,
      value: 10,
      color: "#0fc9e7"
    },
    {
      country: "Europe",
      percentage: 7.5,
      value: 15,
      color: "#3186b2"
    },
    {
      country: "Russia",
      percentage: 17.5,
      value: 10,
      color: "#3185a7"
    },
    {
      country: "USA",
      percentage: 29.8,
      value: 28,
      color: "#4756ca"
    },
  ];
// retrieve the svg in which to plot the viz
const svg = d3
  .select('svg');

// identify the dimensions of the viewBox to establish the svg canvas
const viewBox = svg.attr('viewBox');
const regexViewBox = /\d+ \d+ (\d+) (\d+)/;

const [, viewBoxWidth, viewBoxHeight] = viewBox.match(regexViewBox).map(item => Number.parseInt(item, 10));

// with the margin convention include a group element translated within the svg canvas
const margin = {
  top: 42,
  right: 5,
  bottom: 42,
  left: 5,
};
// compute the width and height of the actual viz from the viewBox dimensions and considering the margins
// this to later work with width and height attributes directly through the width and height variables
const width = viewBoxWidth - (margin.left + margin.right);
const height = viewBoxHeight - (margin.top + margin.bottom);

// compute the radius as half the minor size between the width and height
const radius = Math.min(width, height) / 2.2;
// initialize a variable to have the multiple elements share the same stroke-width property
const strokeWidth = 10;

const group = svg
  .append('g')
  .attr('transform', `translate(${margin.left} ${margin.top})`);


// DEFAULT CIRCLE
// circle used as a background for the colored donut chart
// add a group to center the circle in the canvas (this to rotate the circle from the center)
const groupDefault = group
  .append('g')
  .attr('transform', `translate(${width / 2} ${height / 2})`);

// append the circle showing only the stroke
groupDefault
  .append('circle')
  .attr('cx', 0)
  .attr('cy', 0)
  .attr('r', radius)
  .attr('transform', 'rotate(-90)')
  .attr('fill', 'none')
  .attr('stroke', 'hsla(0, 0%, 0%, 0.00')
  .attr('stroke-width', strokeWidth)
  .attr('stroke-linecap', 'round')
  // hide the stroke of the circle using the radius
  // this to compute the circumference of the shape
  .attr('stroke-dasharray', radius * 3.14 * 2)
  .attr('stroke-dashoffset', radius * 3.14 * 2)

// COLORED CIRCLES
// pie function to compute the arcs
const pie = d3
  .pie()
  .sort(null)
  .padAngle(0.054)
  // use either the value or the percentage in the dataset
  .value(d => d.value);

// arc function to create the d attributes for the path elements
const arc = d3
  .arc()
  // have the arc overlaid on top of the stroke of the circle
  .innerRadius(radius)
  .outerRadius(radius);

/* for each data point include the following structure
g             // wrapping all arcs
  g           // wrapping each arc
    arc       // actual shape
    line      // connecting line
    text      // text label
  g
    arc
    ...
*/
// wrapping group, horizontally centered
const groupArcs = group
  .append('g')
  .attr('transform', `translate(${width / 2} ${height / 2})`);

const groupsArcs = groupArcs
  .selectAll('g')
  .data(pie(data))
  .enter()
  .append('g');

// include the arcs specifying the stroke with the same width of the circle element
groupsArcs
  .append('path')
  .attr('d', arc)
  .attr('fill', 'none')
  .attr('stroke', d => d.data.color)
  .attr('stroke-width', strokeWidth * 1.35)
  // hide the segments by applying a stroke-dasharray/stroke-dashoffset equal to the circle circumference
  // ! the length of the element varies, and it considered afterwords
  // for certain the paths are less than the circumference of the entire circle
  .attr('stroke-dasharray', radius * 3.14 * 2)
  .attr('stroke-dashoffset', radius * 3.14 * 2);

// include line elements visually connecting the text labels with the arcs
groupsArcs
  .append('line')
  .attr('x1', 0)
  .attr('x2', (d) => {
    const [x] = arc.centroid(d);
    return x > 0 ? '25' : '-25';
  })
  .attr('y1', 0)
  .attr('y2', 0)
  .attr('stroke', "grey")
  .attr('stroke-width', 1)
  .attr('transform', (d) => {
    const [x, y] = arc.centroid(d);
    const offset = x > 0 ? 20 : -20;
    return `translate(${x + offset} ${y})`;
  })
  .attr('stroke-dasharray', 25)
  .attr('stroke-dashoffset', 25);

// include text elements associated with the arcs
groupsArcs
  .append('text')
  .attr('x', 0)
  .attr('y', 0)
  .attr('font-size', 8)
  .attr('text-anchor', (d) => {
    const [x] = arc.centroid(d);
    return x > 0 ? 'start' : 'end';
  })
  .attr('transform', (d) => {
    const [x, y] = arc.centroid(d);
    const offset = x > 0 ? 55 : -55;
    return `translate(${x + offset} ${y})`;
  })
  .html(({ data: d }) => `
    <tspan x="0" opacity="0.75">${d.country}</tspan><tspan x="0" dy="15" font-size="12">${d.percentage}% | ${d.value}</tspan>
  `)
  .style('visibility', 'hidden')

// TRANSITIONS
// once the elements are set up
// draw the stroke of the larger circle element
groupDefault
  .select('circle')
  .transition()
  .ease(d3.easeExp)
  .delay(200)
  .duration(300)
  // once the transition is complete
  // draw the smaller strokes one after the other
  .on('end', () => {
    // immediately set the stroke-dasharray and stroke-dashoffset properties to match the length of the path elements
    // using vanilla JavaScript
    const paths = document.querySelectorAll('svg g g path');
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.setAttribute('stroke-dasharray', length);
      path.setAttribute('stroke-dashoffset', length);
    });

    const duration = 700;
    // transition the path elements to stroke-dashoffset 0
    d3
      .selectAll('svg g g path')
      .transition()
      .ease(d3.easeLinear)
      .delay((d, i) => i * duration)
      .duration(duration)
      .attr('stroke-dashoffset', 0);

    // transition the line elements elements to stroke-dashoffset 0
    d3
      .selectAll('svg g g line')
      .transition()
      .ease(d3.easeLinear)
      .delay((d, i) => i * duration + duration / 2.5)
      .duration(duration / 3)
      .attr('stroke-dashoffset', 0)
      .attr('stroke-dasharray', 1.5)
      .style("opacity", 0.7);


    // transition the text elements to opacity 1 and visibility visible
    d3
      .selectAll('svg g g text')
      .transition()
      .ease(d3.easeLinear)
      .delay((d, i) => i * duration + duration / 2)
      .duration(duration / 2)
      .style('visibility', 'visible')
  });