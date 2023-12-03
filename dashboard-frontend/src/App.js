import React, { Component } from "react";
import { Container, Row, Col } from "reactstrap";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardTitle, CardBody, CardText } from "reactstrap";
import moment from "moment";
import numeral from "numeral";
import cubejs from "@cubejs-client/core";
import "antd/dist/reset.css";
import { QueryRenderer } from "@cubejs-client/react";
import { Spin } from "antd";
import Chart from "chart.js/auto";
import { Line, Pie } from "react-chartjs-2";
import { useDeepCompareMemo } from "use-deep-compare";
import { Statistic, Table } from "antd";

const cubejsApi = cubejs(process.env.REACT_APP_CUBEJS_TOKEN, {
  apiUrl: process.env.REACT_APP_API_URL,
});

// const cubejsApi = cubejs(
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MDE1OTYzMTMsImV4cCI6MTcwMTY4MjcxM30.L_pfRTecw6Y8IgS89mWEzjeXFOJeJe04Q6ndGn921nE",
//   { apiUrl: "http://localhost:4000/cubejs-api/v1" }
// );

const numberFormatter = (item) => numeral(item).format("0,0");
const dateFormatter = (item) => moment(item).format("DD MMMM YYYY");

const renderSingleValue = (resultSet, key) => (
  <h1 height={300}>{numberFormatter(resultSet.chartPivot()[0][key])}</h1>
);

const COLORS_SERIES = [
  "#5b8ff9",
  "#5ad8a6",
  "#5e7092",
  "#f6bd18",
  "#6f5efa",
  "#6ec8ec",
  "#945fb9",
  "#ff9845",
  "#299796",
  "#fe99c3",
];
const PALE_COLORS_SERIES = [
  "#d7e3fd",
  "#daf5e9",
  "#d6dbe4",
  "#fdeecd",
  "#dad8fe",
  "#dbf1fa",
  "#e4d7ed",
  "#ffe5d2",
  "#cce5e4",
  "#ffe6f0",
];
const commonOptions = {
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
  },
  plugins: {
    legend: {
      position: "bottom",
    },
  },
  scales: {
    x: {
      ticks: {
        autoSkip: true,
        maxRotation: 0,
        padding: 12,
        minRotation: 0,
      },
    },
  },
};

const useDrilldownCallback = ({
  datasets,
  labels,
  onDrilldownRequested,
  pivotConfig,
}) => {
  return React.useCallback(
    (elements) => {
      if (elements.length <= 0) return;
      const { datasetIndex, index } = elements[0];
      const { yValues } = datasets[datasetIndex];
      const xValues = [labels[index]];

      if (typeof onDrilldownRequested === "function") {
        onDrilldownRequested(
          {
            xValues,
            yValues,
          },
          pivotConfig
        );
      }
    },
    [datasets, labels, onDrilldownRequested]
  );
};

const LineChartRenderer = ({
  resultSet,
  pivotConfig,
  onDrilldownRequested,
}) => {
  const datasets = useDeepCompareMemo(
    () =>
      resultSet.series(pivotConfig).map((s, index) => ({
        label: s.title,
        data: s.series.map((r) => r.value),
        yValues: [s.key],
        borderColor: COLORS_SERIES[index],
        pointRadius: 1,
        tension: 0.1,
        pointHoverRadius: 1,
        borderWidth: 2,
        tickWidth: 1,
        fill: false,
      })),
    [resultSet, pivotConfig]
  );
  const data = {
    labels: resultSet.categories(pivotConfig).map((c) => dateFormatter(c.x)),
    datasets,
  };
  const getElementAtEvent = useDrilldownCallback({
    datasets: data.datasets,
    labels: data.labels,
    pivotConfig,
    onDrilldownRequested,
  });
  return (
    <Line
      type="line"
      data={data}
      options={commonOptions}
      getElementAtEvent={getElementAtEvent}
    />
  );
};

const BarChartRenderer = ({ resultSet, pivotConfig, onDrilldownRequested }) => {
  const datasets = useDeepCompareMemo(
    () =>
      resultSet.series(pivotConfig).map((s, index) => ({
        label: s.title,
        data: s.series.map((r) => r.value),
        yValues: [s.key],
        backgroundColor: COLORS_SERIES[index],
        fill: false,
      })),
    [resultSet, pivotConfig]
  );
  const data = {
    labels: resultSet.categories(pivotConfig).map((c) => c.x),
    datasets,
  };
  const stacked = !(pivotConfig.x || []).includes("measures");
  const options = {
    ...commonOptions,
    scales: {
      x: { ...commonOptions.scales.x, stacked },
      y: { ...commonOptions.scales.y, stacked },
    },
  };
  const getElementAtEvent = useDrilldownCallback({
    datasets: data.datasets,
    labels: data.labels,
    onDrilldownRequested,
    pivotConfig,
  });
  return (
    <Bar
      type="bar"
      data={data}
      options={options}
      getElementAtEvent={getElementAtEvent}
    />
  );
};

const AreaChartRenderer = ({
  resultSet,
  pivotConfig,
  onDrilldownRequested,
}) => {
  const datasets = useDeepCompareMemo(
    () =>
      resultSet.series(pivotConfig).map((s, index) => ({
        label: s.title,
        data: s.series.map((r) => r.value),
        yValues: [s.key],
        pointRadius: 1,
        pointHoverRadius: 1,
        backgroundColor: PALE_COLORS_SERIES[index],
        borderWidth: 0,
        fill: true,
        tension: 0,
      })),
    [resultSet, pivotConfig]
  );
  const data = {
    labels: resultSet.categories(pivotConfig).map((c) => c.x),
    datasets,
  };
  const options = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        stacked: true,
      },
    },
  };
  const getElementAtEvent = useDrilldownCallback({
    datasets: data.datasets,
    labels: data.labels,
    pivotConfig,
    onDrilldownRequested,
  });
  return (
    <Line
      type="area"
      data={data}
      options={options}
      getElementAtEvent={getElementAtEvent}
    />
  );
};

const PieChartRenderer = ({ resultSet, pivotConfig, onDrilldownRequested }) => {
  const data = {
    labels: resultSet.categories(pivotConfig).map((c) => c.x),
    datasets: resultSet.series(pivotConfig).map((s) => ({
      label: s.title,
      data: s.series.map((r) => r.value),
      yValues: [s.key],
      backgroundColor: COLORS_SERIES,
      hoverBackgroundColor: COLORS_SERIES,
    })),
  };
  const getElementAtEvent = useDrilldownCallback({
    datasets: data.datasets,
    labels: data.labels,
    pivotConfig,
    onDrilldownRequested,
  });
  return (
    <Pie
      type="pie"
      data={data}
      options={commonOptions}
      getElementAtEvent={getElementAtEvent}
    />
  );
};

const formatTableData = (columns, data) => {
  function flatten(columns = []) {
    return columns.reduce((memo, column) => {
      if (column.children) {
        return [...memo, ...flatten(column.children)];
      }

      return [...memo, column];
    }, []);
  }

  const typeByIndex = flatten(columns).reduce((memo, column) => {
    return { ...memo, [column.dataIndex]: column };
  }, {});

  function formatValue(value, { type, format } = {}) {
    if (value == undefined) {
      return value;
    }

    if (type === "boolean") {
      if (typeof value === "boolean") {
        return value.toString();
      } else if (typeof value === "number") {
        return Boolean(value).toString();
      }

      return value;
    }

    if (type === "number" && format === "percent") {
      return [parseFloat(value).toFixed(2), "%"].join("");
    }

    return value.toString();
  }

  function format(row) {
    return Object.fromEntries(
      Object.entries(row).map(([dataIndex, value]) => {
        return [dataIndex, formatValue(value, typeByIndex[dataIndex])];
      })
    );
  }

  return data.map(format);
};

const TableRenderer = ({ resultSet, pivotConfig }) => {
  const [tableColumns, dataSource] = useDeepCompareMemo(() => {
    const columns = resultSet.tableColumns(pivotConfig);
    return [
      columns,
      formatTableData(columns, resultSet.tablePivot(pivotConfig)),
    ];
  }, [resultSet, pivotConfig]);
  return (
    <Table pagination={false} columns={tableColumns} dataSource={dataSource} />
  );
};

const renderChart = ({
  resultSet,
  error,
  pivotConfig,
  onDrilldownRequested,
  chartType,
}) => {
  if (error) {
    return <div>{error.toString()}</div>;
  }

  if (!resultSet) {
    return <Spin />;
  }
  if (chartType === "LineChart") {
    return (
      <LineChartRenderer
        resultSet={resultSet}
        pivotConfig={pivotConfig}
        onDrilldownRequested={onDrilldownRequested}
      />
    );
  } else if (chartType === "Table") {
    return (
      <TableRenderer
        resultSet={resultSet}
        pivotConfig={pivotConfig}
        onDrilldownRequested={onDrilldownRequested}
      />
    );
  } else if (chartType === "BarChart") {
    return (
      <BarChartRenderer
        resultSet={resultSet}
        pivotConfig={pivotConfig}
        onDrilldownRequested={onDrilldownRequested}
      />
    );
  } else if (chartType === "AreaChart") {
    return (
      <AreaChartRenderer
        resultSet={resultSet}
        pivotConfig={pivotConfig}
        onDrilldownRequested={onDrilldownRequested}
      />
    );
  } else if (chartType === "PieChart") {
    return (
      <PieChartRenderer
        resultSet={resultSet}
        pivotConfig={pivotConfig}
        onDrilldownRequested={onDrilldownRequested}
      />
    );
  }
};

const ChartRenderer = ({ query, title, chartType, x, y }) => {
  return (
    <Card>
      <CardBody>
        <CardTitle tag="h5">{title}</CardTitle>
        <CardText>
          <QueryRenderer
            query={query}
            cubejsApi={cubejsApi}
            resetResultSetOnChange={false}
            render={(props) =>
              renderChart({
                ...props,
                chartType: chartType,
                pivotConfig: {
                  x: [{ x }],
                  y: [{ y }],
                  fillMissingDates: true,
                  joinDateRange: true,
                },
              })
            }
          />
        </CardText>
      </CardBody>
    </Card>
  );
};

class App extends Component {
  render() {
    return (
      <Container fluid>
        {/* Old feature */}
        {/* <Row>
         <Col sm="4">
           <Chart
             cubejsApi={cubejsApi}
             title="Total Users"
             query={{ measures: ["Users.count"] }}
             render={resultSet => renderSingleValue(resultSet, "Users.count")}
           />
         </Col>
         <Col sm="4">
           <Chart
             cubejsApi={cubejsApi}
             title="Total Orders"
             query={{ measures: ["Orders.count"] }}
             render={resultSet => renderSingleValue(resultSet, "Orders.count")}
           />
         </Col>
         <Col sm="4">
           <Chart
             cubejsApi={cubejsApi}
             title="Shipped Orders"
             query={{
               measures: ["Orders.count"],
               filters: [
                 {
                   dimension: "Orders.status",
                   operator: "equals",
                   values: ["shipped"]
                 }
               ]
             }}
             render={resultSet => renderSingleValue(resultSet, "Orders.count")}
           />
         </Col>
       </Row>
       <br />
       <br />
       <Row>
         <Col sm="6">
           <Chart
             cubejsApi={cubejsApi}
             title="New Users Over Time"
             query={{
               measures: ["Users.count"],
               timeDimensions: [
                 {
                   dimension: "Users.createdAt",
                   dateRange: ["2017-01-01", "2018-12-31"],
                   granularity: "month"
                 }
               ]
             }}
             render={resultSet => (
               <ResponsiveContainer width="100%" height={300}>
                 <AreaChart data={resultSet.chartPivot()}>
                   <XAxis dataKey="category" tickFormatter={dateFormatter} />
                   <YAxis tickFormatter={numberFormatter} />
                   <Tooltip labelFormatter={dateFormatter} />
                   <Area
                     type="monotone"
                     dataKey="Users.count"
                     name="Users"
                     stroke="rgb(106, 110, 229)"
                     fill="rgba(106, 110, 229, .16)"
                   />
                 </AreaChart>
               </ResponsiveContainer>
             )}
           />
         </Col>
         <Col sm="6">
           <Chart
             cubejsApi={cubejsApi}
             title="Orders by Status Over time"
             query={{
               measures: ["Orders.count"],
               dimensions: ["Orders.status"],
               timeDimensions: [
                 {
                   dimension: "Orders.createdAt",
                   dateRange: ["2017-01-01", "2018-12-31"],
                   granularity: "month"
                 }
               ]
             }}
             render={resultSet => {
               return (
                 <ResponsiveContainer width="100%" height={300}>
                   <BarChart data={resultSet.chartPivot()}>
                     <XAxis tickFormatter={dateFormatter} dataKey="x" />
                     <YAxis tickFormatter={numberFormatter} />
                     <Bar
                       stackId="a"
                       dataKey="shipped, Orders.count"
                       name="Shipped"
                       fill="#7DB3FF"
                     />
                     <Bar
                       stackId="a"
                       dataKey="processing, Orders.count"
                       name="Processing"
                       fill="#49457B"
                     />
                     <Bar
                       stackId="a"
                       dataKey="completed, Orders.count"
                       name="Completed"
                       fill="#FF7C78"
                     />
                     <Legend />
                     <Tooltip />
                   </BarChart>
                 </ResponsiveContainer>
               );
             }}
           />
         </Col>
       </Row> */}
       {/* New features implemented*/}
        <Row>
          <Col sm="12">
            <ChartRenderer
              query={{
                measures: ["Orders.count"],
                timeDimensions: [
                  {
                    dimension: "Orders.createdAt",
                    granularity: "day",
                    dateRange: "Last month",
                  },
                ],
                order: {
                  "Orders.count": "desc",
                },
                dimensions: ["Orders.completedAt"],
              }}
              title="Completed orders last 30 days"
              chartType="LineChart"
              x={["Orders.completedAt", "Orders.createdAt.day"]}
              y={"measures"}
            />
          </Col>
        </Row>
        <br />
        <br />
        <Row>
          <Col sm="12">
            <ChartRenderer
              query={{
                measures: ["Users.count"],
                timeDimensions: [
                  {
                    dimension: "Users.createdAt",
                    granularity: "month",
                  },
                ],
                order: {
                  "Users.createdAt": "asc",
                },
              }}
              title={"New Users Over Time"}
              chartType="LineChart"
            />
          </Col>
        </Row>
        <Row>
          <Col sm="6">
            <ChartRenderer
              query={{ measures: ["Users.count"] }}
              title="Total Users"
              chartType="Table"
            />
          </Col>
        </Row>

        <br />
        <br />
        <Row>
        <Col sm="12">
            <ChartRenderer
              query={{
                "order": {
                  "Orders.createdAt": "asc"
                },
                "dimensions": [
                  "Orders.status"
                ],
                "measures": [
                  "Orders.count"
                ],
                "limit": 100,
                "timeDimensions": [
                  {
                    "dimension": "Orders.createdAt",
                    "granularity": "month"
                  }
                ]
              }}
              title="Order by Status Over Time"
              chartType="BarChart"
              x={[
                "Orders.status",
                "Orders.createdAt.month"
              ]}
              y={"measures"}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
