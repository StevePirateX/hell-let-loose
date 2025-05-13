// Initialize data
const distance = [];
const allies_german = [];
const ussr = [];
const great_britain = [];

let markers = [];
let currentFilter;

var mil_alliesgerman = 0;
var mil_ussr = 0;
var mil_greatbritain = 0;

// Store added markers
let markerCount = 0;
const colors = ['#FF3B30', '#34C759', '#00ffde', '#FF9500', '#AF52DE', '#fff200'];

// Set up chart
const layout = {
    title: 'Artillery MIL Settings by Distance',
    xaxis: { title: {text: 'Distance (m)', font: { color: '#fff'}}, range: [100, 1600] },
    yaxis: { title: 'MIL Setting', range: [0, 1600] },
    hovermode: 'x',
    margin: {l: 60, r: 30, t: 60, b: 60},
    autosize: true
};

const darkLayout = {
    paper_bgcolor: '#121212',  // Dark background for entire chart area
    plot_bgcolor: '#1e1e1e',   // Dark background for plot area
    font: { color: '#ffffff' }, // White text
    xaxis: {
        title: {text: 'Distance (m)'},
        range: [100, 1600],
        gridcolor: '#333333',    // Darker grid lines
        linecolor: '#444444',
        zerolinecolor: '#333333'
    },
    yaxis: {
        title: {text: 'MIL'},
        gridcolor: '#333333',
        linecolor: '#444444',
        zerolinecolor: '#333333',
        autorange: true,
        rangemode: 'normal',
        range: [undefined, undefined]
    },
    title: { font: { color: '#ffffff' } }
};

// Chart lines
const traces = [
    {
        x: distance,
        y: allies_german,
        name: 'Allies/German',
        hovertemplate: 'Distance: %{x:.0f}m<br>MIL: %{y:.0f}<extra></extra>'
    },
    {
        x: distance,
        y: ussr,
        name: 'USSR',
        hovertemplate: 'Distance: %{x:.0f}m<br>MIL: %{y:.0f}<extra></extra>'
    },
    {
        x: distance,
        y: great_britain,
        name: 'Great Britain',
        hovertemplate: 'Distance: %{x:.0f}m<br>MIL: %{y:.0f}<extra></extra>'
    }
];

document.addEventListener('DOMContentLoaded', function() {
    // Now we can safely access DOM elements
    currentFilter = document.getElementById('nationFilter').value;

    // Set up event listeners
    const input = document.getElementById("distanceInput");
    input.addEventListener("keypress", function(event) {
        if (event.key === "Enter" || event.keyCode === 13) {
            update_data();
        }
    });

    // Handle mobile "Done" button
    input.addEventListener("change", function() {
        if (document.activeElement === input) {
            update_data();
        }
    });

// 3. For when the keyboard is dismissed (blur)
    input.addEventListener("blur", function() {
        if (input.value && !isNaN(input.value)) {
            update_data();
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        Plotly.Plots.resize('chart');
    });

    // Rest of your initialization code...
    Plotly.newPlot('chart', traces, { ...layout, ...darkLayout });
});



function update_data() {
    currentFilter = document.getElementById('nationFilter').value;
    filterNations();
    addMarker();
    // Caused issues on mobile
    //input.select()
}

// Calculate MILs
function get_allies_german_mil(distance) {
    return -89 * distance / 375 + 379562/379;
}

function get_ussr_mil(distance) {
    return -16 * distance / 75 + 3424/3;
}

function get_great_britain_mil(distance) {
    return -133 * distance / 750 + 8261/15;
}

// Generate data points (same formulas as your Python code)
for (let d = 100; d <= 1600; d++) {
    distance.push(d);
    allies_german.push(get_allies_german_mil(d));
    ussr.push(get_ussr_mil(d));
    great_britain.push(get_great_britain_mil(d));
}



// Add marker function
function addMarker() {
    const inputDist = parseInt(document.getElementById('distanceInput').value);

    if (isNaN(inputDist) || inputDist < 100 || inputDist > 1600) {
        alert('Please enter a distance between 100-1600m');
        return;
    }

    mil_alliesgerman = get_allies_german_mil(inputDist);
    mil_ussr = get_ussr_mil(inputDist);
    mil_greatbritain = get_great_britain_mil(inputDist);

    // Find closest data point
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < distance.length; i++) {
        const diff = Math.abs(distance[i] - inputDist);
        if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
        }
    }

    // Get MIL values
    const alliesMIL = Math.round(allies_german[closestIdx]);
    const ussrMIL = Math.round(ussr[closestIdx]);
    const gbMIL = Math.round(great_britain[closestIdx]);

    // Display results based on current filter
    updateResultsTable(alliesMIL, ussrMIL, gbMIL);

    // Create marker object
    const color = colors[markers.length % colors.length];
    const marker = {
        distance: inputDist,
        color: color,
        alliesMIL: alliesMIL,
        ussrMIL: ussrMIL,
        gbMIL: gbMIL
    };

    // Add to markers array
    markers.push(marker);

    // Redraw all markers
    drawAllMarkers();
}

function drawAllMarkers() {
    const chartDiv = document.getElementById('chart');
    const shapes = [];
    const annotations = [];

    // Get the current visibility state from the chart
    const visibleTraces = [];
    chartDiv.data.forEach(trace => {
        if (trace.visible === undefined || trace.visible === true || trace.visible === 'true') {
            visibleTraces.push(trace.name);
        }
    });

    markers.forEach((marker, index) => {
        // Add vertical line
        shapes.push({
            type: 'line',
            x0: marker.distance,
            x1: marker.distance,
            y0: 0,
            y1: Math.max(marker.alliesMIL, marker.ussrMIL, marker.gbMIL),
            line: {
                color: marker.color,
                width: 2,
                dash: 'dash'
            }
        });

        // Add intercept annotations for visible traces
        if (visibleTraces.includes('Allies/German')) {
            annotations.push({
                x: marker.distance,
                y: marker.alliesMIL + 50,
                xref: 'x',
                yref: 'y',
                text: `<b>${marker.alliesMIL}</b>`,
                showarrow: false,
                bgcolor: 'rgba(79, 195, 247, 0.7)',
                bordercolor: '#4fc3f7',
                borderwidth: 1,
                borderpad: 4,
                font: { size: 16 }
            });
        }

        if (visibleTraces.includes('USSR')) {
            annotations.push({
                x: marker.distance,
                y: marker.ussrMIL + 50,
                xref: 'x',
                yref: 'y',
                text: `<b>${marker.ussrMIL}</b>`,
                showarrow: false,
                bgcolor: 'rgba(255, 138, 101, 0.7)',
                bordercolor: '#ff8a65',
                borderwidth: 1,
                borderpad: 4,
                font: { size: 16 }
            });
        }

        if (visibleTraces.includes('Great Britain')) {
            annotations.push({
                x: marker.distance,
                y: marker.gbMIL + 50,
                xref: 'x',
                yref: 'y',
                text: `<b>${marker.gbMIL}</b>`,
                showarrow: false,
                bgcolor: 'rgba(129, 199, 132, 0.7)',
                bordercolor: '#81c784',
                borderwidth: 1,
                borderpad: 4,
                font: { size: 16 }
            });
        }

        // Add distance label
        annotations.push({
            x: marker.distance,
            y: 1,
            yref: 'paper',
            text: `${marker.distance}m`,
            showarrow: false,
            font: {
                color: marker.color,
                size: 14
            }
        });
    });

    Plotly.relayout('chart', {
        shapes: shapes,
        annotations: annotations
    });
}

// Clear markers function
function clearMarkers() {
    markers = []
    Plotly.relayout('chart', {
        shapes: [],
        annotations: []
    });
    document.getElementById('results').innerHTML = '';
}

// Filter nations function
function filterNations() {
    currentFilter = document.getElementById('nationFilter').value;
    const chartDiv = document.getElementById('chart');

    const newTraces = chartDiv.data.map(trace => {
        return {
            ...trace,
            visible: currentFilter === 'ALL' || trace.name === currentFilter
        };
    });

    Plotly.react('chart', newTraces, chartDiv.layout);

    updateResultsTable();
    drawAllMarkers(); // Redraw markers with new filter
}

// Update results table based on current filter
function updateResultsTable() {
    if (markers.length === 0) {
        document.getElementById('results').innerHTML = '';
        return;
    }

    // Get the most recent marker
    const lastMarker = markers[markers.length - 1];

    let tableHTML = '<table><thead><tr>';
    let bodyHTML = '<tbody><tr>';

    if (currentFilter === 'ALL' || currentFilter === 'Allies/German') {
        tableHTML += '<th>Allies/German</th>';
        bodyHTML += `<td>${lastMarker.alliesMIL}</td>`;
    }

    if (currentFilter === 'ALL' || currentFilter === 'USSR') {
        tableHTML += '<th>USSR</th>';
        bodyHTML += `<td>${lastMarker.ussrMIL}</td>`;
    }

    if (currentFilter === 'ALL' || currentFilter === 'Great Britain') {
        tableHTML += '<th>Great Britain</th>';
        bodyHTML += `<td>${lastMarker.gbMIL}</td>`;
    }

    tableHTML += '</tr></thead>' + bodyHTML + '</tr></tbody></table>';
    document.getElementById('results').innerHTML = tableHTML;
}