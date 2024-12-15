const BarChart = {
  template: `
    <div class="chart bar-chart">
      <svg ref="svg" class="chart-svg">
        <v-axis
          v-if="svg"
          ref="axisX"
          orient="bottom"
          class="axis-x"
          :scale="scaleX"
          :config="axisConfig"
        ></v-axis>
        <v-axis
          v-if="svg"
          ref="axisY"
          orient="left"
          class="axis-y"
          :scale="scaleY"
          :config="axisConfig"
        ></v-axis>
      </svg>
    </div>`,

  props: {
    data: { type: Array, required: true },
    keyCol: { type: String, required: true },
    valCol: { type: String, required: true },
    minVal: { type: Number, default: 0 },
    maxVal: { type: Number, default: 0 },
    color: { type: String, default: "steelblue" },
    filters: { type: Object, default: () => ({}) },
    config: { type: Object, default: () => ({}) },
  },

  data() {
    return {
      svg: null,
      size: null,

      scaleX: null,
      scaleY: null,

      padding: {
        x: 50,
        y: 40,
        inner: 0.05,
        outer: 0.1,
      },
    };
  },

  created() {
    this.scaleX = d3.scaleBand();
    this.scaleY = d3.scaleLinear();

    if (this.config.padding) {
      console.log("Padding exists");

      for (let p in this.config.padding) {
        this.padding[p] = this.config.padding[p];
      }
    }
  },

  mounted() {
    console.log("BarChart mounted");
    console.log(this.svg ? "SVG exists" : "SVG does not exist");

    this.svg = d3
      .select(this.$refs.svg)
      .attr("width", this.config.width || 500)
      .attr("height", this.config.height || 300);

    console.log(this.svg ? "SVG exists" : "SVG does not exist");

    this.updateSize();
    this.updateScales();
    this.render();

    this.resizeHandler = debounce(() => {
      this.updateSize();
      this.updateScales();
      this.render();
    }, 100);

    window.addEventListener("resize", this.resizeHandler);

    // this.$nextTick(() => {
    //   // this.config.width = 888;
    // });

    // console.log(this.$refs.svg.attributes["width"].value);
  },

  beforeDestroy() {
    window.removeEventListener("resize", this.resizeHandler);
  },

  methods: {
    render() {
      console.log("Rendering BarChart");
      console.log(this.keys.length);

      this.svg
        .selectAll("rect.bar-chart-rect")
        .data(this.sortedData)
        .join("rect")
        .classed("chart-rect bar-chart-rect", true)
        .attr("x", (d) => this.scaleX(d[this.keyCol]))
        .attr("y", (d) => this.scaleY(d[this.valCol]))
        .attr("width", this.scaleX.bandwidth())
        .attr(
          "height",
          (d) => this.size.height - this.scaleY(d[this.valCol]) - this.padding.y
        )
        .attr("fill", this.color);
    },

    updateSize() {
      this.size = this.svg.node().getBoundingClientRect();
      console.log(this.size);
    },

    updateScales() {
      console.log("Updating scales");
      console.log(this.padding.outer);

      this.scaleX
        .domain(this.keys)
        .rangeRound([this.padding.x, this.size.width - this.padding.x])
        .paddingInner(this.padding.inner)
        .paddingOuter(this.padding.outer);

      this.scaleY
        .domain([this.minVal, this.maxVal])
        .range([this.size.height - this.padding.y, this.padding.y]);

      console.log(this.scaleX.domain());
      console.log(this.scaleX.range());
    },
  },

  computed: {
    sortedData() {
      let sorted = [...this.data].sort((a, b) => b[this.valCol] - a[this.valCol]);

      return filterCountries(sorted)
        .concat(sorted[0])  // Add the highest value to the end
        .sort((a, b) => b[this.valCol] - a[this.valCol]); // Sort again
    },

    keys() {
      return this.sortedData.map((d) => d[this.keyCol]);
    },

    axisConfig() {
      return {
        width: this.size.width,
        height: this.size.height,
        padding: this.padding,
      };
    },
  },

  watch: {
    data: {
      deep: true,
      handler() {
        this.updateScales();

        this.$refs.axisX.update();
        this.$refs.axisY.update();

        this.render();
      },
    },

    config: {
      deep: true,
      handler() {
        this.render();
      },
    },
  },
};