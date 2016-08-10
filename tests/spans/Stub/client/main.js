import { Template } from 'meteor/templating';
//import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Session.set("counter", [{ index: 0, value: "one" }, { index: 1, value: "two" }])

Template.rows.helpers({
  counter() {
    return Session.get("counter")
    // Template.instance().counter.get();
  },
});

Template.rows.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    //instance.counter.set(instance.counter.get() + 1);
    var counter = Session.get("counter")
    var total = counter.length
    var ii
    
    for (ii = 0; ii < total; ii += 1) {
      counter[ii].index += 1
    }
    Session.set("counter", counter)
  },
});
