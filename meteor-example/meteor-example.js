if (Meteor.isClient) {
  Template.main.events({
    // Render locally on the client by calling Rimu.render() directly.
    'click #render-on-client': function() {
      var source = $('#source').val();
      var html = Rimu.render(source, {safeMode: 1});
      $('#preview').html(html);
      $('#html').text(html);
    },

    // Render on the server with an RPC to Meteor.methods.render_rimu().
    'click #render-on-server': function() {
      var source = $('#source').val();
      Meteor.call('render_rimu', source, function(error, html) {
        $('#preview').html(html);
        $('#html').text(html);
      });
    },

    // Reset input and outputs.
    'click #reset': function() {
      $('#source').val('Enter _Rimu Markup_ here.');
      $('#preview').html('');
      $('#html').text('');
    }
  });
}

if (Meteor.isServer) {
  Meteor.methods({
    // Render Rimu source returning the rendered HTML to the client.
    render_rimu: function(source) {
      return Rimu.render(source, {safeMode: 1});
    }
  });
}
