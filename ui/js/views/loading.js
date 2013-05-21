 PC.LoadingView = Backbone.View.extend({
        template: _.template($("#loadingTemplate").html()),

        initialize: function() {
            this.$el.html(this.template());

        }

    });
