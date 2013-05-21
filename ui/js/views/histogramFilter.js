   PC.HistogramFilterView = Backbone.View.extend({
        template: _.template($("#queryFilterHistogramTemplate").html()),

        initialize: function(histOptions){
            this.config = histOptions.config;
            //need to take care of default options if some aren't specified
            if(this.config.selwidth == null){ this.config.selwidth = 60; }
            if(this.config.selectbarw == null){ this.config.selectbarw = 10;}
            if(this.config.textinputclass == null) { this.config.textinputclass = "input-small";}
            if(this.config.axislabelfontsize == null) { this.config.axislabelfontsize = "12px";}
            if(this.config.labelSize == null){this.config.labelSize = "14px";}
            if(this.config.axisfontsize == null) { this.config.axisfontsize = "12px";}
            this.$el.html(this.template(histOptions.config));
            this.formatCount = d3.format(" ,.2f");

        },

        events:{
            'filterChange': "updateFilterValues"
        },

       updateFilterValues: function(item,data){
           this.filterStart = data.startValue;
           this.filterEnd = data.endValue;
             $("#" + this.config.startId).val(this.formatCount(data.startValue));
             $("#" + this.config.endId).val(this.formatCount(data.endValue));

        },

        render: function() {

            var gv = this;
            var data = this.model;
            if(data == null || data.length < 1){

                return;
            }
            var maxPosValueX = d3.max(data);


            if(this.config.initialstart == null) { this.config.initialstart = 0;}
            if(this.config.initialend == null) { this.config.initialend = maxPosValueX;}
            this.filterStart = this.config.initialstart;
            this.filterEnd = this.config.initialend;

            var margin = {top: 10, right: 10, bottom: 30, left: 50},
                width = this.config.width - margin.left - margin.right,
                height = this.config.height - margin.top - margin.bottom;
            var selwidth = this.config.selwidth,
                selheight = height,
                selectbarw = this.config.selectbarw;


            var x = d3.scale.linear()
            .domain([0, maxPosValueX])
            .range([0, width]);

            var data = d3.layout.histogram()
                .bins(x.ticks(100))
                (data);

            var y = d3.scale.linear()
                .domain([0,d3.max(data, function(d) { return d.y;})])
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");


            var chart = d3.select(this.el).append('svg')
            .attr("width", width + margin.left + margin.right )
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

             var bar = chart.selectAll(".bar")
                 .data(data)
                 .enter().append("g")
                 .attr("class", "bar")
                 .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

            bar.append("rect")
                .attr("x", 1)
                .attr("width", x(data[0].dx) - 1)
                .attr("height", 0)
                .attr("y", function(d) { return height - y(d.y); })
               .transition()
                .duration(1500)
                .attr("y", 0)
                .attr("height", function(d) { return height - y(d.y); });



            chart.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0,0)")
                .attr("style","font:" + this.config.axisfontsize + " sans-serif;")
                .call(yAxis)
                .append("text")
                .attr("style","font:" + this.config.axislabelfontsize + " sans-serif;")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" +  (-margin.left+10) + "," + height/2 + "),rotate(-90)")
                .text(this.config.yAxis_Label);

             chart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                 .attr("style","font:" + this.config.axisfontsize + " sans-serif;")
                .call(xAxis)
                 .append("text")
                 .attr("style","font:" + this.config.axislabelfontsize + " sans-serif;")
                 .attr("text-anchor","middle")
                 .attr("transform","translate("+width/2 + "," + margin.bottom +")")
                 .text(this.config.xAxis_Label);


            //now need to add the selection bars - essentially a rectangle with movable ends
            var drag = d3.behavior.drag()
            .origin(Object)
            .on("drag", dragmove);

            var dragleft = d3.behavior.drag()
            .origin(Object)
            .on("drag",ldragresize);

            var dragright = d3.behavior.drag()
            .origin(Object)
            .on("drag",rdragresize);


            var selstart = x(this.config.initialstart);
            var selend = x(this.config.initialend);

            var selectg = chart.append("g")
                .data([{x:selstart, y:0}]);

            selwidth = selend-selstart;

            var dragrect = selectg.append("rect")
            .attr("id", "active")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y;})
            .attr("height", selheight)
            .attr("width", selwidth)
            .attr("fill", "#999999")
            .attr("fill-opacity", .25)
            .attr("cursor", "move")
            .call(drag);

            var dragbarleft = selectg.append("rect")
            .attr("x", function(d) { return d.x;})
            .attr("y", function(d) { return d.y;})
            .attr("id", "dragleft")
            .attr("height", selheight)
            .attr("width", selectbarw)
            .attr("fill", "#f8991c")
            .attr("fill-opacity", .5)
            .attr("cursor", "ew-resize")
            .call(dragleft);

            var dragbarright = selectg.append("rect")
            .attr("x", function(d) { return d.x + selwidth - selectbarw;})
            .attr("y", function(d) { return d.y;})
            .attr("id", "dragright")
            .attr("height", selheight)
            .attr("width", selectbarw)
            .attr("fill", "#f8991c")
            .attr("fill-opacity", .5)
            .attr("cursor", "ew-resize")
            .call(dragright);



        function ldragresize(d){
               var oldx = d.x;
                d.x = Math.max(0, Math.min(d.x + selwidth, d3.event.x));
                selwidth = selwidth + (oldx - d.x);
                dragbarleft
                .attr("x", function(d) { return d.x;});

                dragrect
                .attr("x", function(d) { return d.x; })
                .attr("width", selwidth);

            $(gv.el).trigger('filterChange',{startValue:x.invert(dragbarleft.attr("x")), endValue: x.invert(parseFloat(dragbarleft.attr("x")) + selwidth)} );

        };

        function rdragresize(d){
                var dragx = Math.max(d.x +selectbarw, Math.min(width, d.x + selwidth + d3.event.dx));
                selwidth = dragx - d.x;
                dragbarright
                    .attr("x", dragx);
                dragrect
                    .attr("width", selwidth);

             $(gv.el).trigger('filterChange',{startValue:x.invert(d.x), endValue: x.invert(dragx + selectbarw)} );

        };

        function dragmove(d){

             d.x = Math.max(0, Math.min(width-selwidth, d3.event.x))
             dragrect
                    .attr("x", d.x);
             dragbarleft
                    .attr("x", function(d) { return d.x; });
             dragbarright
                    .attr("x", function(d) { return d.x + selwidth;});


             $(gv.el).trigger('filterChange',{startValue:x.invert(dragbarleft.attr("x")), endValue: x.invert(parseFloat(dragbarright.attr("x")) + parseFloat(selectbarw))} );

        };

            this.$("#" + this.config.startId).blur(function(event){

                selwidth = parseFloat(dragbarright.attr("x")) + parseFloat(selectbarw) - parseFloat(x(this.value));
                dragbarleft
                .attr("x", x(this.value));

                dragrect
                .attr("x", x(this.value))
                .attr("width",selwidth);



                $(gv.el).trigger('filterChange',{startValue:this.value, endValue: parseFloat(this.value) + x.invert(selwidth)} );

            });

            this.$("#" + this.config.endId).blur(function(event){

                selwidth = parseFloat(x(this.value)) - parseFloat(dragbarleft.attr("x"));
                dragbarright
                .attr("x", parseFloat(x(this.value)) - parseFloat(selectbarw));

                dragrect
                .attr("width",selwidth);

                $(gv.el).trigger('filterChange',{startValue:x.invert(dragbarleft.attr("x")), endValue: this.value} );

            });

            //initialize the values
            this.$("#" + this.config.startId).val(this.formatCount(this.config.initialstart));
            this.$("#" + this.config.endId).val(this.formatCount(this.config.initialend));

            return this;
        }

    });

