const parcels = {
  "PKG-2024-0001": {
    tracking: "PKG-2024-0001",
    sender: "James Otieno",
    receiver: "Amina Hassan",
    route: "Nairobi → Mombasa",
    status: "In Transit",
    payment: "M-Pesa",
    timeline: ["Registered", "Dispatched", "In Transit"]
  },
  "PKG-2024-0002": {
    tracking: "PKG-2024-0002",
    sender: "Grace Wanjiku",
    receiver: "Peter Mutua",
    route: "Nairobi → Kisumu",
    status: "Arrived",
    payment: "Cash",
    timeline: ["Registered", "Dispatched", "In Transit", "Arrived at Destination"]
  },
  "PKG-2024-0003": {
    tracking: "PKG-2024-0003",
    sender: "Samuel Kipchoge",
    receiver: "Fatuma Ali",
    route: "Nakuru → Nairobi",
    status: "Pending",
    payment: "Bank Transfer",
    timeline: ["Registered"]
  }
};
//=========helper functions===============
//checks that input is not empty
function validateRequired(input, errorSpan, message){
    if(input.value.trim() === ""){
        input.classList.add("invalid");
        errorSpan.textContent =message;
        return false;
    }else{
        input.classList.remove("invalid");
        errorSpan.textContent = "";
        return true;    
    }
}
//checks a select has something chosen
function validateSelect(select, errorSpan, message){
    if(select.value === ""){
        select.classList.add("invalid");
        errorSpan.textContent = message;
        return false;
    }else{
        select.classList.remove("invalid");
        errorSpan.textContent = "";
        return true;    
    }
    }
//cheks a value matches the basic email pattern
function validateEmail(input, errorSpan){
    const emailPattern= /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(input.value.trim() === ""){
        input.classList.add("invalid");
        errorSpan.textContent = "Email is required.";
        return false;
    }else if(!emailPattern.test(input.value.trim())){
        input.classList.add("invalid");
        errorSpan.textContent = "Please enter a valid email address.";
        return false;
    }else{
        input.classList.remove("invalid");
        errorSpan.textContent = "";
        return true;    
    }
}
//show/hide toggle for password field
const toggleBtn = document.getElementById("toggle-password");
const passwordInput = document.getElementById("password");
//when button is clicked toggle between showing and hiding the password
if(toggleBtn){
    toggleBtn.addEventListener("click", function(){
        //if currently hidden show text
        if(passwordInput.type === "password"){
            passwordInput.type = "text";
            toggleBtn.textContent = "Hide";
        }else{
            passwordInput.type= "password";
            toggleBtn.textContent = "Show";
        }
    });
}
//================main form validations================
//=====LOGIN FORM==========
// loginForm validation and submission handling
// const loginForm = document.getElementById("loginForm");
// if(loginForm){
//     loginForm.addEventListener("submit", function(event){
//         event.preventDefault(); //prevent default form submission
//         //grab all inputs and their errorSpans
//         const email = document.getElementById("email");
//         const emailError = document.getElementById("email-error");

//         const password = document.getElementById("password");
//         const passwordError = document.getElementById("password-error");

//         const role = document.getElementById("role");
//         const roleError = document.getElementById("role-error");
//         //ran all validations
//         const emailOk = validateEmail(email, emailError);
//         const passwordOk= validateRequired(password, passwordError, "Password is required.");
//         const roleOk = validateSelect(role, roleError, "Please select a role.");
//         //it only proceeds if everything is okay
//         if (emailOk && passwordOk && roleOk) {

//       // ── Temporary login check (no database yet) ──
//         const testAccounts = {
//         "clerk@courier.com":  { password: "password123", role: "clerk" },
//         "admin@courier.com":  { password: "password123", role: "admin"  }
//         };

//         const enteredEmail    = email.value.trim();
//         const enteredPassword = password.value;
//         const selectedRole    = role.value;

//         const account = testAccounts[enteredEmail];

//         // Check: does this email exist, does the password match, does the role match?
//         if (
//         account &&
//         account.password === enteredPassword &&
//         account.role === selectedRole
//       ) {
//         // ── sessionStorage — the sticky note ──
//         // We save the user's email and role so other pages can read it
//         // sessionStorage.setItem("key", "value") writes a value
//         // sessionStorage.getItem("key") reads it back on another page
//         sessionStorage.setItem("userEmail", enteredEmail);
//         sessionStorage.setItem("userRole", selectedRole);

//         // Send clerk to the clerk dashboard, admin to the admin dashboard
//         if (selectedRole === "clerk") {
//           window.location.href = "dashboard-clerk.html";
//         } else {
//           window.location.href = "dashboard-admin.html";
//         }

//       } else {
//         // Credentials don't match — show a general error message
//         // We put this on the email field's error span as a convenient spot
//         emailError.textContent = "Invalid email, password, or role. Please try again.";
//         email.classList.add("invalid");
//       }
//     }
//   });
// }
// ── Login ──
const loginForm = document.getElementById('loginForm')

if (loginForm) {

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault()

    // Get the form field values
    const email    = document.getElementById('email')
    const password = document.getElementById('password')
    const role     = document.getElementById('role')

    // Get the error span elements
    const emailError    = document.getElementById('email-error')
    const passwordError = document.getElementById('password-error')
    const roleError     = document.getElementById('role-error')

    // Clear previous errors before validating again
    emailError.textContent    = ''
    passwordError.textContent = ''
    roleError.textContent     = ''

    // Basic frontend validation — check fields aren't empty before sending to server
    let valid = true
    if (!email.value.trim()) {
      emailError.textContent = 'Email is required.'
      valid = false
    }
    if (!password.value.trim()) {
      passwordError.textContent = 'Password is required.'
      valid = false
    }
    if (!role.value) {
      roleError.textContent = 'Please select a role.'
      valid = false
    }
    if (!valid) return

    try {
      // fetch() sends an HTTP request to your backend API
      // 'await' means: wait here until the server responds before continuing
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // tells server we're sending JSON
        },
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value
        })
      })

      // response.json() reads the response body and parses it as JSON
      const data = await response.json()

      if (response.ok) {
        // response.ok means status 200 — login succeeded

        // Check that the role selected on the form matches what's in the database
        if (data.role !== role.value) {
          emailError.textContent = 'Role does not match this account.'
          return
        }

        // Save user info to sessionStorage — same as before, other pages read this
        sessionStorage.setItem('userEmail', data.email)
        sessionStorage.setItem('userRole', data.role)
        sessionStorage.setItem('userName', data.name)

        // Save the JWT token — we'll send this with every future API request
        sessionStorage.setItem('token', data.token)

        // Redirect based on role
        if (data.role === 'clerk') {
          window.location.href = 'dashboard-clerk.html'
        } else {
          window.location.href = 'dashboard-admin.html'
        }

      } else {
        // Server returned an error (401 wrong password, etc)
        emailError.textContent = data.message || 'Login failed. Please try again.'
      }

    } catch (error) {
      // This catches network errors — e.g. if the server isn't running
      console.error('Login error:', error)
      emailError.textContent = 'Cannot connect to server. Make sure the backend is running.'
    }
  })
}


// dashboard to show user logged in information
// ── Sidebar user info ──
const sidebarName = document.getElementById("sidebar-name");
const sidebarRole = document.getElementById("sidebar-role");

if (sidebarName) {
  // Read from sessionStorage — set at login
  const email = sessionStorage.getItem("userEmail");
  const role  = sessionStorage.getItem("userRole");

  sidebarName.textContent = email || "User";

  // Show role label properly
  sidebarRole.textContent = (role === "admin") ? "Administrator" : "Clerk";

  // Update avatar initial — now inside the block so 'role' exists here
  const avatarEl = document.querySelector(".user-avatar");
  if (avatarEl) {
    avatarEl.textContent = (role === "admin") ? "A" : "C";
    avatarEl.style.backgroundColor = "var(--yellow)";
  }
}
// // ── Route protection — runs on every page ──
// // Check that someone is actually logged in
// const loggedInRole  = sessionStorage.getItem("userRole");
// const loggedInEmail = sessionStorage.getItem("userEmail");

// // If no session exists at all, send back to login
// if (!loggedInEmail) {
//   window.location.href = "index.html";
// }

// // If a clerk somehow lands on an admin page, redirect them
// const isAdminPage = document.body.classList.contains("admin-page");
// if (isAdminPage && loggedInRole !== "admin") {
//   window.location.href = "dashboard-clerk.html";
// }
const logoutBtn = document.getElementById("logoutBtn");
if(logoutBtn){
    logoutBtn.addEventListener("click", function(){
        // Clear the session storage to "log out" the user
        sessionStorage.clear();
        // Redirect back to the login page
        window.location.href = "index.html";
    });

}
//============
// ── Mobile sidebar toggle ──
const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("sidebarOverlay");

if (hamburgerBtn) {
  // Open sidebar when hamburger is clicked
  hamburgerBtn.addEventListener("click", function () {
    sidebar.classList.add("sidebar-open");
    overlay.classList.add("active");
  });

  // Close sidebar when overlay (dim area) is clicked
  overlay.addEventListener("click", function () {
    sidebar.classList.remove("sidebar-open");
    overlay.classList.remove("active");
  });
}
//========REGISTER PARCEL FORM==========
// const registerForm = document.getElementById("registerParcelForm");
// if(registerForm){
//     // Auto-calculate estimated cost when weight or destination changes
//     const weightInput = document.getElementById("parcel-weight");
//     const destOffice  = document.getElementById("destination-office");
//     const costDisplay = document.getElementById("estimatedCost");

//     // Base prices per destination (hardcoded — backend will calculate properly later)
//     const routePrices = {
//       mombasa: { base: 500, perKg: 50 },
//       kisumu:  { base: 400, perKg: 45 },
//       nakuru:  { base: 250, perKg: 35 },
//       eldoret: { base: 350, perKg: 40 },
//       nyeri:   { base: 250, perKg: 35 },
//     };

//     // the function to calculate the cost
//     function updateCost(){
//       const weight = parseFloat(weightInput.value) || 0;
//       const dest   = destOffice.value;
//       if (dest && routePrices[dest]) {
//         const price = routePrices[dest];
//         const total = price.base + (weight * price.perKg);
//         costDisplay.textContent = "KES " + total.toLocaleString();
//       } else {
//         costDisplay.textContent = "KES 0";
//       }
//     }

//     weightInput.addEventListener("input", updateCost);
//     destOffice.addEventListener("change", updateCost);

//     registerForm.addEventListener("submit", function(event){
//         event.preventDefault(); //prevent default form submission
//         //grabing all inputs
//         const senderName  = document.getElementById("sender-name");
//         const senderPhone = document.getElementById("sender-phone");
//         const senderId    = document.getElementById("sender-id");
//         const receiverName  = document.getElementById("receiver-name");
//         const receiverPhone = document.getElementById("receiver-phone");
//         const destination   = document.getElementById("destination-office");
//         const description   = document.getElementById("parcel-description");
//         const weight        = document.getElementById("parcel-weight");

//         //validate all field
//         //use an array to track if all validations pass
//         const ok= [
//             validateRequired(senderName,  document.getElementById("sender-name-error"),  "Sender name is required."),
//             validateRequired(senderPhone, document.getElementById("sender-phone-error"), "Sender phone is required."),
//             validateRequired(senderId,    document.getElementById("sender-id-error"),    "ID number is required."),
//             validateRequired(receiverName,  document.getElementById("receiver-name-error"),  "Receiver name is required."),
//             validateRequired(receiverPhone, document.getElementById("receiver-phone-error"), "Receiver phone is required."),
//             validateSelect(destination, document.getElementById("destination-office-error"), "Please select a destination office."),
//             validateRequired(description, document.getElementById("parcel-description-error"), "Description is required."),
//             validateRequired(weight,      document.getElementById("parcel-weight-error"),      "Weight is required."),
//             ].every(Boolean); //check if all validations passed

//         if(ok){
//             //generate a random tracking number(for now)
//             const year     = new Date().getFullYear();
//             const tracking = "PKG-" + year + "-" + String(Math.floor(Math.random() * 9000) + 1000);

//             //show the success card, hide the form
//             document.getElementById("generatedTracking").textContent = tracking;
//             registerForm.style.display = "none";
//             document.getElementById("successCard").style.display = "block";  
//         }
//     });
// //fix
//     //copy tracking number to clipboard
//     const copyBtn = document.getElementById("copyTrackingBtn");
//     if (copyBtn) {
//       copyBtn.addEventListener("click", function () {
//         const tracking = document.getElementById("generatedTracking").textContent;
//         navigator.clipboard.writeText(tracking);
//         copyBtn.textContent = "Copied!";
//         setTimeout(() => { copyBtn.textContent = "Copy Number"; }, 2000);
//       });
//     }
//     // Register another — show form again, hide success card
//     const registerAnotherBtn = document.getElementById("registerAnotherBtn");
//     if (registerAnotherBtn) {
//       registerAnotherBtn.addEventListener("click", function () {
//         registerForm.reset();
//         registerForm.style.display = "block";
//         document.getElementById("successCard").style.display = "none";
//       });
//     }
// }  
// ── Register Parcel ──
const registerForm = document.getElementById('registerParcelForm')

if (registerForm) {

  // Cost calculator — runs when weight or destination changes
  // This still works on the frontend without hitting the backend
  const weightInput = document.getElementById('parcel-weight')
  const destOffice  = document.getElementById('destination-office')
  const costDisplay = document.getElementById('estimatedCost')

  const routePrices = {
    mombasa: { base: 500, perKg: 50 },
    kisumu:  { base: 400, perKg: 45 },
    nakuru:  { base: 250, perKg: 35 },
    eldoret: { base: 350, perKg: 40 },
    nyeri:   { base: 250, perKg: 35 },
  }

  function updateCost() {
    const weight = parseFloat(weightInput.value) || 0
    const dest   = destOffice.value
    if (dest && routePrices[dest]) {
      const price = routePrices[dest]
      const total = price.base + (weight * price.perKg)
      costDisplay.textContent = 'KES ' + total.toLocaleString()
    } else {
      costDisplay.textContent = 'KES 0'
    }
  }

  weightInput.addEventListener('input', updateCost)
  destOffice.addEventListener('change', updateCost)

  // Form submission — sends real data to backend API
  registerForm.addEventListener('submit', async function (event) {
    event.preventDefault()

    // Get all form field elements
    const senderName    = document.getElementById('sender-name')
    const senderPhone   = document.getElementById('sender-phone')
    const senderId      = document.getElementById('sender-id')
    const receiverName  = document.getElementById('receiver-name')
    const receiverPhone = document.getElementById('receiver-phone')
    const destination   = document.getElementById('destination-office')
    const description   = document.getElementById('parcel-description')
    const weight        = document.getElementById('parcel-weight')

    // Validate all fields using your existing helper functions
    const ok = [
      validateRequired(senderName,    document.getElementById('sender-name-error'),       'Sender name is required.'),
      validateRequired(senderPhone,   document.getElementById('sender-phone-error'),      'Sender phone is required.'),
      validateRequired(senderId,      document.getElementById('sender-id-error'),         'ID number is required.'),
      validateRequired(receiverName,  document.getElementById('receiver-name-error'),     'Receiver name is required.'),
      validateRequired(receiverPhone, document.getElementById('receiver-phone-error'),    'Receiver phone is required.'),
      validateSelect(destination,     document.getElementById('destination-office-error'),'Please select a destination office.'),
      validateRequired(description,   document.getElementById('parcel-description-error'),'Description is required.'),
      validateRequired(weight,        document.getElementById('parcel-weight-error'),     'Weight is required.'),
    ].every(Boolean)

    if (!ok) return

    // Map dropdown value to office_id in database
    // These match the offices we have in the DB
    const officeIdMap = {
      mombasa: 1,
      kisumu:  1,
      nakuru:  1,
      eldoret: 1,
      nyeri:   1,
    }

    try {
      // Get the token saved at login — needed to prove user is logged in
      const token = sessionStorage.getItem('token')

      // Send POST request to backend with all parcel data
      const response = await fetch('http://localhost:5000/api/parcels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token  // attach token so backend accepts it
        },
        body: JSON.stringify({
          sender_name:           senderName.value.trim(),
          sender_phone:          senderPhone.value.trim(),
          sender_id_number:      senderId.value.trim(),
          receiver_name:         receiverName.value.trim(),
          receiver_phone:        receiverPhone.value.trim(),
          destination_office_id: officeIdMap[destination.value] || 1,
          description:           description.value.trim(),
          weight:                parseFloat(weight.value)
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Show the success screen with the real tracking number from the database
        document.getElementById('generatedTracking').textContent = data.tracking_number
        registerForm.style.display = 'none'
        document.getElementById('successCard').style.display = 'block'
      } else {
        // Show error from server
        document.getElementById('sender-name-error').textContent = data.message || 'Registration failed.'
      }

    } catch (error) {
      console.error('Register parcel error:', error)
      document.getElementById('sender-name-error').textContent = 'Cannot connect to server.'
    }
  })

  // Copy tracking number button
  const copyBtn = document.getElementById('copyTrackingBtn')
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const tracking = document.getElementById('generatedTracking').textContent
      navigator.clipboard.writeText(tracking)
      copyBtn.textContent = 'Copied!'
      setTimeout(() => { copyBtn.textContent = 'Copy Number' }, 2000)
    })
  }

  // Register another parcel — reset the form
  const registerAnotherBtn = document.getElementById('registerAnotherBtn')
  if (registerAnotherBtn) {
    registerAnotherBtn.addEventListener('click', function () {
      registerForm.reset()
      costDisplay.textContent = 'KES 0'
      registerForm.style.display = 'block'
      document.getElementById('successCard').style.display = 'none'
    })
  }
}

// ==============search parcel page===================
// The five steps in order — used to mark which are completed/active
const allSteps = [
  "Registered",
  "Dispatched",
  "In Transit",
  "Arrived at Destination",
  "Delivered"
];

function runSearch(trackingNo) {
  const query = trackingNo.trim().toUpperCase();
  const parcel = parcels[query];
  const resultsDiv = document.getElementById("searchResults");
  const notFoundDiv = document.getElementById("notFound");

  if (!resultsDiv) return; // not on search page

  if (parcel) {
    // Fill in the detail rows
    document.getElementById("res-tracking").textContent = parcel.tracking;
    document.getElementById("res-sender").textContent   = parcel.sender;
    document.getElementById("res-receiver").textContent = parcel.receiver;
    document.getElementById("res-route").textContent    = parcel.route;
    document.getElementById("res-status").textContent   = parcel.status;
    document.getElementById("res-payment").textContent  = parcel.payment;

    // Update timeline dots — completed, active, or upcoming
    const items = document.querySelectorAll(".timeline-item");
    items.forEach(function (item, index) {
      const stepName = allSteps[index];
      item.classList.remove("completed", "active");
      if (parcel.timeline.includes(stepName)) {
        // Last step in the array is "active" (current), rest are completed
        const lastStep = parcel.timeline[parcel.timeline.length - 1];
        if (stepName === lastStep) {
          item.classList.add("active");
        } else {
          item.classList.add("completed");
        }
      }
    });

    resultsDiv.style.display = "block";
    notFoundDiv.style.display = "none";
  } else {
    resultsDiv.style.display = "none";
    notFoundDiv.style.display = "block";
  }
}

const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
  searchBtn.addEventListener("click", function () {
    const query = document.getElementById("searchInput").value;
    runSearch(query);
  });

  // Also search when Enter is pressed in the input
  document.getElementById("searchInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") runSearch(this.value);
  });

  // Pill buttons fill the search box and run automatically
  document.querySelectorAll(".pill").forEach(function (pill) {
    pill.addEventListener("click", function () {
      const tracking = this.getAttribute("data-tracking");
      document.getElementById("searchInput").value = tracking;
      runSearch(tracking);
    });
  });
}
// ── ==============Update Status============= ──

const statusSearchBtn = document.getElementById("statusSearchBtn");

if (statusSearchBtn) {
  document.getElementById("statusSearchInput")
     .addEventListener("keydown", function(e) {
       if (e.key === "Enter") statusSearchBtn.click();
     });
  statusSearchBtn.addEventListener("click", function () {
    const query = document.getElementById("statusSearchInput").value.trim().toUpperCase();
    const parcel = parcels[query];

    const updateSection  = document.getElementById("updateSection");
    const notFound       = document.getElementById("updateNotFound");
    const successDiv     = document.getElementById("updateSuccess");

    successDiv.style.display = "none";
    notFound.style.display = "none";

    if (parcel) {
      document.getElementById("upd-tracking").textContent       = parcel.tracking;
      document.getElementById("upd-sender").textContent         = parcel.sender;
      document.getElementById("upd-route").textContent          = parcel.route;
      document.getElementById("upd-current-status").textContent = parcel.status;

      updateSection.style.display = "block";
      notFound.style.display      = "none";
    } else {
      updateSection.style.display = "none";
      notFound.style.display      = "block";
    }
  });
}

const confirmUpdateBtn = document.getElementById("confirmUpdateBtn");

if (confirmUpdateBtn) {
  confirmUpdateBtn.addEventListener("click", function () {
    const newStatus  = document.getElementById("newStatus");
    const errorSpan  = document.getElementById("newStatus-error");
    const isValid    = validateSelect(newStatus, errorSpan, "Please select a new status.");

    if (isValid) {
      const tracking = document.getElementById("upd-tracking").textContent;

      // Update the fake data so search page reflects the change
      if (parcels[tracking]) {
        parcels[tracking].status = newStatus.value;
      }

      document.getElementById("success-tracking").textContent = tracking;
      document.getElementById("success-status").textContent   = newStatus.value;

      document.getElementById("updateSection").style.display  = "none";
      document.getElementById("updateSuccess").style.display  = "block";
    }
  });
}

const updateAnotherBtn = document.getElementById("updateAnotherBtn");
if (updateAnotherBtn) {
  updateAnotherBtn.addEventListener("click", function () {
    document.getElementById("statusSearchInput").value      = "";
    document.getElementById("updateSuccess").style.display  = "none";
    document.getElementById("updateSection").style.display  = "none";
    document.getElementById("updateNotFound").style.display = "none";
  });
}

// ── Record Payment ──
//shares parcels data used by the others

const paymentSearchBtn = document.getElementById("paymentSearchBtn");

if (paymentSearchBtn) {

  paymentSearchBtn.addEventListener("click", function () {
    const query   = document.getElementById("paymentSearchInput").value.trim().toUpperCase();
    const parcel  = parcels[query];

    const paymentSection  = document.getElementById("paymentSection");
    const notFound        = document.getElementById("paymentNotFound");
    const successDiv      = document.getElementById("paymentSuccess");

    // Reset all states first
    paymentSection.style.display = "none";
    notFound.style.display       = "none";
    successDiv.style.display     = "none";

    if (parcel) {
      document.getElementById("pay-tracking").textContent    = parcel.tracking;
      document.getElementById("pay-sender").textContent      = parcel.sender;
      document.getElementById("pay-route").textContent       = parcel.route;
      document.getElementById("pay-cost").textContent        = parcel.cost;
      document.getElementById("pay-status").textContent      = parcel.paymentStatus;

      paymentSection.style.display = "block";
    } else {
      notFound.style.display = "block";
    }
  });

  // Enter key support
  document.getElementById("paymentSearchInput")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") paymentSearchBtn.click();
    });

  // Show/hide M-Pesa reference field based on payment method
  const paymentMethodSelect = document.getElementById("paymentMethod");
  if (paymentMethodSelect) {
    paymentMethodSelect.addEventListener("change", function () {
      const mpesaGroup = document.getElementById("mpesaRefGroup");
      mpesaGroup.style.display = this.value === "mpesa" ? "block" : "none";
    });
  }

  // Confirm payment
  const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener("click", function () {
      const method     = document.getElementById("paymentMethod");
      const amount     = document.getElementById("amountPaid");
      const mpesaRef   = document.getElementById("mpesaRef");
      const methodErr  = document.getElementById("paymentMethod-error");
      const amountErr  = document.getElementById("amountPaid-error");
      const mpesaErr   = document.getElementById("mpesaRef-error");

      const methodOk = validateSelect(method, methodErr, "Please select a payment method.");
      const amountOk = validateRequired(amount, amountErr, "Please enter the amount paid.");

      // Only validate M-Pesa ref if M-Pesa is selected
      let mpesaOk = true;
      if (method.value === "mpesa") {
        mpesaOk = validateRequired(mpesaRef, mpesaErr, "M-Pesa reference is required.");
      }

      if (methodOk && amountOk && mpesaOk) {
        const tracking = document.getElementById("pay-tracking").textContent;

        // Update the dummy data so other pages reflect the change
        if (parcels[tracking]) {
          parcels[tracking].paymentStatus = "Paid";
          parcels[tracking].paymentMethod = method.value;
        }

        document.getElementById("success-pay-tracking").textContent = tracking;
        document.getElementById("success-pay-amount").textContent   = "KES " + Number(amount.value).toLocaleString();
        document.getElementById("success-pay-method").textContent   = method.options[method.selectedIndex].text;

        document.getElementById("paymentSection").style.display  = "none";
        document.getElementById("paymentSuccess").style.display  = "block";
      }
    });
  }

  // Record another — reset everything
  const recordAnotherBtn = document.getElementById("recordAnotherBtn");
  if (recordAnotherBtn) {
    recordAnotherBtn.addEventListener("click", function () {
      document.getElementById("paymentSearchInput").value      = "";
      document.getElementById("paymentSuccess").style.display  = "none";
      document.getElementById("paymentSection").style.display  = "none";
      document.getElementById("paymentMethod").value           = "";
      document.getElementById("amountPaid").value              = "";
      document.getElementById("mpesaRef").value                = "";
      document.getElementById("mpesaRefGroup").style.display   = "none";
    });
  }
}
//==========ADMIN PAGESSSSSS=================
// ── Admin Dashboard Charts ──
const parcelCanvas = document.getElementById("parcelVolumeChart");

if (parcelCanvas) {

  // --- Chart 1: 30-Day Parcel Volume (scatter/dot chart) ---
  // When backend is connected, this data will come from an API call instead
  const parcelData = [
    {x: 3,  y: 110}, {x: 5,  y: 140}, {x: 7,  y: 132},
    {x: 9,  y: 165}, {x: 11, y: 158}, {x: 13, y: 172},
    {x: 15, y: 195}, {x: 17, y: 168}, {x: 19, y: 160},
    {x: 21, y: 200}, {x: 23, y: 190}, {x: 25, y: 210},
    {x: 27, y: 185}, {x: 29, y: 248}
  ];

  new Chart(parcelCanvas, {
    type: "scatter",      // scatter = individual dots, no connecting lines
    data: {
      datasets: [{
        label: "Parcels",
        data: parcelData,
        backgroundColor: "#0f172a",  // dot colour — navy
        pointRadius: 6,              // size of each dot
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }   // hide the legend — label not needed here
      },
      scales: {
        x: {
          title: { display: true, text: "Day of March" },
          grid: { color: "#f1f5f9" } // very light grid lines
        },
        y: {
          beginAtZero: true,
          grid: { color: "#f1f5f9" }
        }
      }
    }
  });
  // --- Chart 2: Revenue by Route (horizontal bar chart) ---

  const revenueCanvas = document.getElementById("revenueRouteChart");
  new Chart(revenueCanvas, {
    type: "bar",        // bar chart
    data: {
      // Route labels on the left side (indexAxis: "y" makes it horizontal)
      labels: ["NRB→MBA", "NRB→KSM", "NRB→ELD", "NRB→NKR", "NRB→NYR", "Other"],
      datasets: [{
        label: "Revenue (KES)",
        // Numbers matching each label above
        data: [580000, 420000, 310000, 270000, 220000, 180000],
        backgroundColor: "#0f172a",  // navy bars
        borderRadius: 4,             // slightly rounded bar ends
      }]
    },
    options: {
      indexAxis: "y",   // THIS makes it horizontal — bars go left to right
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#f1f5f9" }
        },
        y: {
          grid: { display: false }  // no horizontal grid lines needed
        }
      }
    }
  });
}
//==================Manage Users Page===================
// ── Manage Users ──

// Fake clerk data — same idea as parcels object.
// When backend is ready, this comes from a fetch() call to your API instead.
const clerks = [
  { id: 1, name: "Jane Mwangi",   email: "jane.mwangi@swift.co.ke",   office: "Nairobi Central",  status: "Active",  parcels: 1245, joined: "Jan 15, 2024" },
  { id: 2, name: "Peter Ochieng", email: "peter.ochieng@swift.co.ke", office: "Mombasa Central", status: "Active",  parcels: 987,  joined: "Feb 3, 2024"  },
  { id: 3, name: "Grace Wambui",  email: "grace.wambui@swift.co.ke",  office: "Kisumu Main",     status: "Active",  parcels: 1532, joined: "Dec 10, 2023" },
  { id: 4, name: "David Kimani",  email: "david.kimani@swift.co.ke",  office: "Eldoret Hub",     status: "Active",  parcels: 654,  joined: "Mar 1, 2024"  },
  { id: 5, name: "Mary Akinyi",   email: "mary.akinyi@swift.co.ke",   office: "Nakuru Office",   status: "Pending", parcels: 0,    joined: "Mar 10, 2024" },
  { id: 6, name: "Ali Hassan",    email: "ali.hassan@swift.co.ke",    office: "Nyeri Branch",    status: "Active",  parcels: 312,  joined: "Nov 20, 2023" },
];

// Helper: get initials from a full name e.g. "Jane Mwangi" → "JM"
function getInitials(name) {
  return name.split(" ").map(part => part[0]).join("").toUpperCase();
}
function editClerk(index) {
  alert("Edit clerk: " + clerks[index].name);
}

function deactivateClerk(index) {
  if (confirm("Deactivate " + clerks[index].name + "?")) {
    clerks[index].status = "Inactive";
    renderClerksTable(clerks);
    updateClerkStats();
  }
}

// Build and display the clerks table rows from the clerks array
// Takes a filtered array so the same function works for search results too
function renderClerksTable(data) {
  const tbody = document.getElementById("clerksTableBody");
  if (!tbody) return;

  // If no results, show a message row
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:32px;">No clerks found.</td></tr>`;
    return;
  }

  // Build one table row (<tr>) for each clerk object
  tbody.innerHTML = data.map((clerk,index) => `
    <tr>
      <td>
        <div class="clerk-name-row">
          <div class="clerk-avatar">${getInitials(clerk.name)}</div>
          <div class="clerk-name-cell">
            <strong>${clerk.name}</strong>
            <span class="clerk-joined">Joined ${clerk.joined}</span>
          </div>
        </div>
      </td>
      <td>${clerk.email}</td>
      <td>${clerk.office}</td>
      <td>
        <!-- Badge class changes based on status value -->
        <span class="badge ${clerk.status === "Active" ? "badge-active" : "badge-pending"}">
          ${clerk.status}
        </span>
      </td>
      <td>${clerk.parcels.toLocaleString()}</td>
      <td>
        <div class="actions-wrapper" data-index="${index}">
          <button class="btn-actions">···</button>
          <div class="actions-dropdown">
            <button onclick="editClerk(${index})">✏️ Edit</button>
            <button class="danger" onclick="deactivateClerk(${index})">🚫 Deactivate</button>
          </div>
        </div>
      </td>
    </tr>
  `).join(""); // .join("") turns the array of strings into one big string
  attachActionDropdowns(); // re-attach dropdown listeners after rendering
}

// Update the 3 summary stat numbers at the top of the page
function updateClerkStats() {
  const totalEl   = document.getElementById("totalClerksCount");
  const activeEl  = document.getElementById("activeClerksCount");
  const pendingEl = document.getElementById("pendingClerksCount");
  if (!totalEl) return;

  totalEl.textContent   = clerks.length;
  activeEl.textContent  = clerks.filter(c => c.status === "Active").length;
  pendingEl.textContent = clerks.filter(c => c.status === "Pending").length;
}

// Run on page load if this is the manage-users page
const clerksTableBody = document.getElementById("clerksTableBody");
if (clerksTableBody) {
  renderClerksTable(clerks);
  updateClerkStats();

  // ── Live search — filters rows as you type ──
  const clerkSearchInput = document.getElementById("clerkSearchInput");
  clerkSearchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase(); // lowercase so search isn't case-sensitive

    // Keep only clerks whose name, email, or office contains the search text
    const filtered = clerks.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.office.toLowerCase().includes(query)
    );

    renderClerksTable(filtered);
  });

  // ── Modal open/close ──

  const modal          = document.getElementById("addClerkModal");
  const openModalBtn   = document.getElementById("openAddClerkModal");
  const closeModalBtn  = document.getElementById("closeAddClerkModal");
  const cancelModalBtn = document.getElementById("cancelAddClerk");

  // Show modal — remove the modal-hidden class
  openModalBtn.addEventListener("click", function () {
    modal.classList.remove("modal-hidden");
  });

  // Hide modal — add the modal-hidden class back
  function closeModal() {
    modal.classList.add("modal-hidden");
    // Clear any error messages from a previous failed attempt
    document.getElementById("newClerkName-error").textContent  = "";
    document.getElementById("newClerkEmail-error").textContent = "";
    document.getElementById("newClerkOffice-error").textContent = "";
  }

  closeModalBtn.addEventListener("click", closeModal);
  cancelModalBtn.addEventListener("click", closeModal);

  // Also close if user clicks the dark overlay outside the box
  modal.addEventListener("click", function (e) {
    // e.target is whatever element was clicked
    // If it's the overlay itself (not the box inside), close
    if (e.target === modal) closeModal();
  });

  // ── Submit new clerk ──
  document.getElementById("submitAddClerk").addEventListener("click", function () {
    const nameInput   = document.getElementById("newClerkName");
    const emailInput  = document.getElementById("newClerkEmail");
    const officeInput = document.getElementById("newClerkOffice");

    const nameOk   = validateRequired(nameInput,   document.getElementById("newClerkName-error"),   "Name is required.");
    const emailOk  = validateEmail(emailInput,     document.getElementById("newClerkEmail-error"));
    const officeOk = validateSelect(officeInput,   document.getElementById("newClerkOffice-error"),  "Please select an office.");

    if (nameOk && emailOk && officeOk) {
      // Create a new clerk object and push it into the clerks array
      const newClerk = {
        id:      clerks.length + 1,
        name:    nameInput.value.trim(),
        email:   emailInput.value.trim(),
        office:  officeInput.value,
        status:  "Pending",   // new clerks start as Pending
        parcels: 0,
        joined:  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      };

      clerks.push(newClerk); // add to the array

      // Re-render table and stats to show the new clerk
      renderClerksTable(clerks);
      updateClerkStats();

      // Reset the form fields and close the modal
      nameInput.value  = "";
      emailInput.value = "";
      officeInput.value = "";
      closeModal();
    }
  });
}
// ── Offices & Routes ──
// ── Shared: open/close action dropdowns ──
// Called after every render so new rows get listeners too
let documentClickListenerAdded= false; // flag to ensure we only add the document click listener once
function attachActionDropdowns() {
  document.querySelectorAll(".actions-wrapper").forEach(function(wrapper) {
    const btn = wrapper.querySelector(".btn-actions");
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", function(e) {
      e.stopPropagation(); // stop click bubbling to document — prevents instant close

      // Close any other open dropdowns first
      document.querySelectorAll(".actions-wrapper.open").forEach(function(other) {
        if (other !== wrapper) other.classList.remove("open");
      });

      // Toggle this one open/closed
      wrapper.classList.toggle("open");
    });
  });

  // Clicking anywhere else on the page closes all dropdowns
  // Only add the document-level close listener once
  if (!documentClickListenerAdded) {
    document.addEventListener("click", function() {
      document.querySelectorAll(".actions-wrapper.open").forEach(function(w) {
        w.classList.remove("open");
      });
    });
    documentClickListenerAdded = true;
  }
}

// ── Route action handlers ──
function editRoute(index) {
  // For now just alert — when backend is connected this opens a pre-filled modal
  alert("Edit route: " + routes[index].origin + " → " + routes[index].destination);
}

function deactivateRoute(index) {
  if (confirm("Deactivate this route?")) {
    routes[index].status = "inactive";
    renderRoutes(); // re-render to reflect the change
  }
}

// ── Office action handlers ──
function editOffice(index) {
  alert("Edit office: " + offices[index].name);
}

function toggleOfficeStatus(index) {
  // Toggle between active and inactive
  offices[index].status = offices[index].status === "active" ? "inactive" : "active";
  renderOffices(); // re-render cards to show new status
}

// Fake office data
const offices = [
  { id: 1, name: "Nairobi Central", status: "active", address: "Moi Avenue, Nairobi",           phone: "+254 20 123 4567", email: "nairobi@swift.co.ke",  clerks: 8 },
  { id: 2, name: "Mombasa Central", status: "active", address: "Digo Road, Mombasa",             phone: "+254 41 234 5678", email: "mombasa@swift.co.ke",  clerks: 5 },
  { id: 3, name: "Kisumu Main",     status: "active", address: "Oginga Odinga Street, Kisumu",   phone: "+254 57 345 6789", email: "kisumu@swift.co.ke",   clerks: 4 },
  { id: 4, name: "Eldoret Hub",     status: "active", address: "Uganda Road, Eldoret",           phone: "+254 53 456 7890", email: "eldoret@swift.co.ke",  clerks: 3 },
  { id: 5, name: "Nakuru Office",   status: "active", address: "Kenyatta Avenue, Nakuru",        phone: "+254 51 567 8901", email: "nakuru@swift.co.ke",   clerks: 3 },
  { id: 6, name: "Nyeri Branch",    status: "inactive", address: "Kimathi Street, Nyeri",        phone: "+254 61 678 9012", email: "nyeri@swift.co.ke",    clerks: 0 },
];

// Fake routes data
const routes = [
  { origin: "Nairobi Central", destination: "Mombasa Central", distance: 485, basePrice: 500, perKg: 50, status: "active" },
  { origin: "Nairobi Central", destination: "Kisumu Main",     distance: 352, basePrice: 400, perKg: 45, status: "active" },
  { origin: "Nairobi Central", destination: "Eldoret Hub",     distance: 312, basePrice: 350, perKg: 40, status: "active" },
  { origin: "Nairobi Central", destination: "Nakuru Office",   distance: 160, basePrice: 250, perKg: 35, status: "active" },
  { origin: "Nairobi Central", destination: "Nyeri Branch",    distance: 154, basePrice: 250, perKg: 35, status: "active" },
  { origin: "Mombasa Central", destination: "Nairobi Central", distance: 485, basePrice: 500, perKg: 50, status: "active" },
  { origin: "Kisumu Main",     destination: "Nairobi Central", distance: 352, basePrice: 400, perKg: 45, status: "active" },
];

// Build the office cards from the offices array
function renderOffices() {
  const grid = document.getElementById("officesGrid");
  if (!grid) return;

  grid.innerHTML = offices.map((office, index) => `
    <div class="office-card">
      <div class="office-card-top">
        <div>
          <p class="office-card-name">${office.name}</p>
          <span class="badge ${office.status === "active" ? "badge-office-active" : "badge-office-inactive"}">
            ${office.status}
          </span>
        </div>
        <!-- Actions dropdown on office card -->
        <div class="actions-wrapper" data-index="${index}">
          <button class="btn-actions">···</button>
          <div class="actions-dropdown">
            <button onclick="editOffice(${index})">✏️ Edit</button>
            <button class="danger" onclick="toggleOfficeStatus(${index})">
              ${office.status === "active" ? "🚫 Deactivate" : "✅ Activate"}
            </button>
          </div>
        </div>
      </div>
      <p class="office-detail">📍 ${office.address}</p>
      <p class="office-detail">📞 ${office.phone}</p>
      <p class="office-detail">✉️ ${office.email}</p>
      <hr class="office-divider" />
      <p class="office-clerks">${office.clerks} clerks assigned</p>
    </div>
  `).join("");

  attachActionDropdowns();
}

// Build the routes table from the routes array
function renderRoutes() {
  const tbody = document.getElementById("routesTableBody");
  if (!tbody) return;

  tbody.innerHTML = routes.map((route, index) => `
    <tr>
      <td>${route.origin} → ${route.destination}</td>
      <td style="color:var(--muted)">${route.distance} km</td>
      <td>KES ${route.basePrice.toLocaleString()}</td>
      <td>KES ${route.perKg}</td>
      <td><span class="badge badge-active">active</span></td>
      <td>
        <!-- Wrapper div handles the open/close toggle -->
        <div class="actions-wrapper" data-index="${index}">
          <button class="btn-actions">···</button>
          <div class="actions-dropdown">
            <button onclick="editRoute(${index})">✏️ Edit</button>
            <button class="danger" onclick="deactivateRoute(${index})">🚫 Deactivate</button>
          </div>
        </div>
      </td>
    </tr>
  `).join("");

  const countEl = document.getElementById("routeCount");
  if (countEl) countEl.textContent = `${routes.length} active routes configured`;

  // Attach click listeners to all ··· buttons after rendering
  attachActionDropdowns();
}

// Only run this code if we're on the offices-routes page
const officesGrid = document.getElementById("officesGrid");
if (officesGrid) {
  renderOffices();
  renderRoutes();

  // ── Tab switching ──
  // When you click Offices tab: show offices panel, hide routes panel (and vice versa)
  const tabOffices   = document.getElementById("tabOffices");
  const tabRoutes    = document.getElementById("tabRoutes");
  const panelOffices = document.getElementById("panelOffices");
  const panelRoutes  = document.getElementById("panelRoutes");

  tabOffices.addEventListener("click", function () {
    // Show offices, hide routes
    panelOffices.style.display = "block";
    panelRoutes.style.display  = "none";
    // Move the active style to this tab
    tabOffices.classList.add("tab-active");
    tabRoutes.classList.remove("tab-active");
  });

  tabRoutes.addEventListener("click", function () {
    // Show routes, hide offices
    panelOffices.style.display = "none";
    panelRoutes.style.display  = "block";
    tabRoutes.classList.add("tab-active");
    tabOffices.classList.remove("tab-active");
  });

  // ── Office modal ──
  const officeModal = document.getElementById("addOfficeModal");

  function openOfficeModal()  { officeModal.classList.remove("modal-hidden"); }
  function closeOfficeModal() { officeModal.classList.add("modal-hidden"); }

  document.getElementById("openAddOfficeModal").addEventListener("click", openOfficeModal);
  document.getElementById("closeAddOfficeModal").addEventListener("click", closeOfficeModal);
  document.getElementById("cancelAddOffice").addEventListener("click", closeOfficeModal);
  officeModal.addEventListener("click", e => { if (e.target === officeModal) closeOfficeModal(); });

  document.getElementById("submitAddOffice").addEventListener("click", function () {
    const name    = document.getElementById("officeName");
    const address = document.getElementById("officeAddress");
    const phone   = document.getElementById("officePhone");
    const email   = document.getElementById("officeEmail");

    const ok = [
      validateRequired(name,    document.getElementById("officeName-error"),    "Office name is required."),
      validateRequired(address, document.getElementById("officeAddress-error"), "Address is required."),
      validateRequired(phone,   document.getElementById("officePhone-error"),   "Phone is required."),
      validateEmail(email,      document.getElementById("officeEmail-error")),
    ].every(Boolean);

    if (ok) {
      // Add the new office to the array and re-render
      offices.push({
        id: offices.length + 1,
        name: name.value.trim(),
        address: address.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim(),
        status: "active",
        clerks: 0
      });
      renderOffices();
      // Reset fields
      [name, address, phone, email].forEach(i => i.value = "");
      closeOfficeModal();
    }
  });

  // ── Route modal ──
  const routeModal = document.getElementById("addRouteModal");

  function openRouteModal()  { routeModal.classList.remove("modal-hidden"); }
  function closeRouteModal() { routeModal.classList.add("modal-hidden"); }

  document.getElementById("openAddRouteModal").addEventListener("click", openRouteModal);
  document.getElementById("closeAddRouteModal").addEventListener("click", closeRouteModal);
  document.getElementById("cancelAddRoute").addEventListener("click", closeRouteModal);
  routeModal.addEventListener("click", e => { if (e.target === routeModal) closeRouteModal(); });

  document.getElementById("submitAddRoute").addEventListener("click", function () {
    const origin      = document.getElementById("routeOrigin");
    const destination = document.getElementById("routeDestination");
    const distance    = document.getElementById("routeDistance");
    const basePrice   = document.getElementById("routeBasePrice");
    const perKg       = document.getElementById("routePerKg");

    const ok = [
      validateSelect(origin,      document.getElementById("routeOrigin-error"),      "Select an origin."),
      validateSelect(destination, document.getElementById("routeDestination-error"), "Select a destination."),
      validateRequired(distance,  document.getElementById("routeDistance-error"),    "Distance is required."),
      validateRequired(basePrice, document.getElementById("routeBasePrice-error"),   "Base price is required."),
      validateRequired(perKg,     document.getElementById("routePerKg-error"),       "Price per kg is required."),
    ].every(Boolean);

    if (ok) {
      routes.push({
        origin:      origin.value,
        destination: destination.value,
        distance:    Number(distance.value),
        basePrice:   Number(basePrice.value),
        perKg:       Number(perKg.value),
        status:      "active"
      });
      renderRoutes();
      [distance, basePrice, perKg].forEach(i => i.value = "");
      origin.value = ""; destination.value = "";
      closeRouteModal();
    }
  });
}
// ── Reports ──

// Fake manifest data — represents individual parcel records for a given date range.
// When backend is connected, this comes from a fetch() to your reports API endpoint.
const manifestData = [
  { tracking: "PKG-2024-0892", sender: "John Kamau",   receiver: "Mary Wanjiku",  route: "NRB → MBA", status: "Arrived",    amount: 850,  clerk: "Jane Mwangi",   date: "Mar 14, 2024" },
  { tracking: "PKG-2024-0891", sender: "Ali Hassan",   receiver: "Grace Otieno",  route: "NRB → KSM", status: "Dispatched", amount: 620,  clerk: "Peter Ochieng", date: "Mar 14, 2024" },
  { tracking: "PKG-2024-0890", sender: "Peter Njoroge", receiver: "Fatuma Ali",   route: "NRB → ELD", status: "In Transit", amount: 720,  clerk: "Grace Wambui",  date: "Mar 14, 2024" },
  { tracking: "PKG-2024-0889", sender: "Grace Muthoni", receiver: "David Ouma",   route: "NKR → NRB", status: "Arrived",    amount: 400,  clerk: "David Kimani",  date: "Mar 14, 2024" },
  { tracking: "PKG-2024-0888", sender: "Samuel Weru",  receiver: "Amina Yusuf",   route: "NRB → MBA", status: "Arrived",    amount: 950,  clerk: "Jane Mwangi",   date: "Mar 14, 2024" },
  { tracking: "PKG-2024-0887", sender: "Mary Achieng", receiver: "Peter Mutua",   route: "NRB → KSM", status: "Registered", amount: 580,  clerk: "Peter Ochieng", date: "Mar 14, 2024" },
  { tracking: "PKG-2024-0886", sender: "James Otieno", receiver: "Sarah Kamau",   route: "NRB → NKR", status: "Arrived",    amount: 300,  clerk: "Jane Mwangi",   date: "Mar 14, 2024" },
  { tracking: "PKG-2024-0885", sender: "Wanjiku Mwai", receiver: "Hassan Ali",    route: "NRB → NYR", status: "Arrived",    amount: 280,  clerk: "Grace Wambui",  date: "Mar 14, 2024" },
];

// Map status values to badge CSS classes — same badges used across the whole app
const statusBadgeClass = {
  "Arrived":    "badge-arrived",
  "Dispatched": "badge-transit",
  "In Transit": "badge-transit",
  "Registered": "badge-pending",
};

// Build the manifest table from data array
function renderManifest(data) {
  const tbody = document.getElementById("manifestTableBody");
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px;">No records found for selected filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(row => `
    <tr>
      <td>${row.tracking}</td>
      <td>${row.sender}</td>
      <td>${row.receiver}</td>
      <td>${row.route}</td>
      <td><span class="badge ${statusBadgeClass[row.status] || "badge-pending"}">${row.status}</span></td>
      <td>KES ${row.amount.toLocaleString()}</td>
      <td>${row.clerk}</td>
      <td>${row.date}</td>
    </tr>
  `).join("");
}

// Calculate and display the 4 summary stat cards from a data set
function renderReportStats(data) {
  const totalParcels  = data.length;
  const totalRevenue  = data.reduce((sum, row) => sum + row.amount, 0); // add up all amounts
  const arrivedCount  = data.filter(row => row.status === "Arrived").length;
  // Count unique clerks in this data set using Set (Set removes duplicates automatically)
  const uniqueClerks  = new Set(data.map(row => row.clerk)).size;

  document.getElementById("rpt-parcels").textContent = totalParcels;
  document.getElementById("rpt-revenue").textContent = "KES " + totalRevenue.toLocaleString();
  document.getElementById("rpt-arrived").textContent = arrivedCount;
  document.getElementById("rpt-clerks").textContent  = uniqueClerks;
}

// Only run on the reports page
const generateBtn = document.getElementById("generateReportBtn");
if (generateBtn) {

  generateBtn.addEventListener("click", function () {
    // Read filter values
    const startDate    = document.getElementById("filterStartDate").value;
    const endDate      = document.getElementById("filterEndDate").value;
    const officeFilter = document.getElementById("filterOffice").value.toLowerCase();
    const clerkFilter  = document.getElementById("filterClerk").value.toLowerCase();

    // Filter the manifest data based on what was selected
    // For now we filter by clerk name since our fake data has no real dates
    // When backend is connected, date filtering happens in the SQL query instead
    let filtered = manifestData;

    if (clerkFilter) {
      filtered = filtered.filter(row => row.clerk.toLowerCase().includes(clerkFilter));
    }

    // Show the results section (it starts hidden)
    document.getElementById("reportResults").style.display = "block";

    // Update the subtitle below the manifest title
    const subtitle = document.getElementById("manifestSubtitle");
    subtitle.textContent = `Showing ${filtered.length} parcels${startDate ? " from " + startDate : ""}${endDate ? " to " + endDate : ""}`;

    renderManifest(filtered);
    renderReportStats(filtered);
  });

  // Export buttons — in a real app these would generate a file.
  // For now they show a simple alert. Backend will handle actual file generation.
  document.getElementById("exportPdfBtn").addEventListener("click", function () {
    alert("PDF export will be available once the backend is connected.");
  });

  document.getElementById("exportExcelBtn").addEventListener("click", function () {
    alert("Excel export will be available once the backend is connected.");
  });

  document.getElementById("downloadManifestBtn").addEventListener("click", function () {
    alert("Download will be available once the backend is connected.");
  });
}
