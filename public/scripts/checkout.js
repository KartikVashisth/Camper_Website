var displayError = document.getElementById("card-errors");
  function errorHandler(err){
    //changeLoadingState(false);
    displayError.textContent = err;
  }
  var orderData = {
    items: [{ id: "yelpcamp-subscription-fee" }],
    currency: "inr"
  };
  var stripe = Stripe('pk_test_0nSI3mitc7fryLn84595rjAM00TF7mXFAi');
  var elements = stripe.elements();

  // Set up Stripe.js and Elements to use in checkout form
  var style = {
    base: {
      color: "#32325d",
    }
  };

  var card = elements.create("card", { style: style });
  card.mount("#card-element");

  card.addEventListener('change', function(event) {
    if (event.error) {
      errorHandler(event.error.message);
    } else {
      errorHandler('');
    }
  });

  var form = document.getElementById('payment-form');

  form.addEventListener('submit', function(ev) {
    ev.preventDefault();
    stripe.createPaymentMethod("card", card).then(function(result) {
      if (result.error) {
        errorHandler(result.error.message);
      } else {
        orderData.paymentMethodId = result.paymentMethod.id;
        return fetch("/pay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(orderData)
        });
      }
    })
    .then(function(result) {
      return result.json();
    })
    .then(function(response) {
      if (response.error) {
        errorHandler(response.error);
      } else {
        //redirect to /campgrounds with query string that envokes 
        //a success flash message
        //changeLoadingState(false);
        window.location.href = "/campgrounds?paid=true";
      }
    }).catch(function(err){
      errorHandler(err.error);
    });
  });
var h = document.getElementById("submit");
h.addEventListener('click', function(){
  var c = document.getElementById('wait');
  c.textContent = 'Wait for 10 seconds';
}, false);
// Show a spinner on payment submission
/*function changeLoadingState(isLoading) {
  if (isLoading) {
    document.querySelector("button").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("button").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
};*/