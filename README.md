 # Camper Website

 ## Login/Sign-up:

 * Sign-up laeds to a payment page were you have to pay Rupees 20 to see all the posted campgrounds.

 * Payments functionality is implemented using Stripe API(Testing Card Number: 4242 4242 4242 4242, Expiration Date: Any valid date).
 If signed up as admin, then no need to pay.

 * User can also reset password using registered e-mail address, which is implemented using nodemailer.


 
 ## Campgrounds Index and Show page:

 * Here you can post a new campground, use fuzzy search to look for a campground.
 * Owner can only edit or delete a campground.

 * A profile page for a particular user is also made, which contains all the information related to him.

 * A user can also follow another user by visiting the profile page of the person who posted a particular campground, so that he is notified whenever that person posts a campground. Notifications can be seen on Navbar, can see all the previous notifications on notification page.

 * Campground show page also provides user with location of that place implemented using Mapbox API.

 * A registered user can also add a review, and rating, can also like a campground and can see the names of the users who liked that campground.

 * Owner can only update or delete his/her campground or reviews, and a single user can post a single review.
