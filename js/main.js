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
const loginForm = document.getElementById("loginForm");
if(loginForm){
    loginForm.addEventListener("submit", function(event){
        event.preventDefault(); //prevent default form submission
        //grab all inputs and their errorSpans
        const email = document.getElementById("email");
        const emailError = document.getElementById("email-error");

        const password = document.getElementById("password");
        const passwordError = document.getElementById("password-error");

        const role = document.getElementById("role");
        const roleError = document.getElementById("role-error");
        //ran all validations
        const emailOk = validateEmail(email, emailError);
        const passwordOk= validateRequired(password, passwordError, "Password is required.");
        const roleOk = validateSelect(role, roleError, "Please select a role.");
        //it only proceeds if everything is okay
        if (emailOk && passwordOk && roleOk) {

      // ── Temporary login check (no database yet) ──
        const testAccounts = {
        "clerk@courier.com":  { password: "password123", role: "clerk" },
        "admin@courier.com":  { password: "password123", role: "admin"  }
        };

        const enteredEmail    = email.value.trim();
        const enteredPassword = password.value;
        const selectedRole    = role.value;

        const account = testAccounts[enteredEmail];

        // Check: does this email exist, does the password match, does the role match?
        if (
        account &&
        account.password === enteredPassword &&
        account.role === selectedRole
      ) {
        // ── sessionStorage — the sticky note ──
        // We save the user's email and role so other pages can read it
        // sessionStorage.setItem("key", "value") writes a value
        // sessionStorage.getItem("key") reads it back on another page
        sessionStorage.setItem("userEmail", enteredEmail);
        sessionStorage.setItem("userRole", selectedRole);

        // Send clerk to the clerk dashboard, admin to the admin dashboard
        if (selectedRole === "clerk") {
          window.location.href = "dashboard-clerk.html";
        } else {
          window.location.href = "dashboard-admin.html";
        }

      } else {
        // Credentials don't match — show a general error message
        // We put this on the email field's error span as a convenient spot
        emailError.textContent = "Invalid email, password, or role. Please try again.";
        email.classList.add("invalid");
      }
    }
  });
}
// dashboard to show user logged in information
const sidebarName = document.getElementById("sidebar-name");
const sidebarRole = document.getElementById("sidebar-role");

if(sidebarName){
    const email= sessionStorage.getItem("userEmail");
    const role = sessionStorage.getItem("userRole");

    sidebarName.textContent = email || "User";
    sidebarRole.textContent = role || "Clerk";
}
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
const registerForm = document.getElementById("registerParcelForm");
if(registerForm){
    // Auto-calculate estimated cost when weight or destination changes
    const weightInput = document.getElementById("parcel-weight");
    const destOffice  = document.getElementById("destination-office");
    const costDisplay = document.getElementById("estimatedCost");

    // Base prices per destination (hardcoded — backend will calculate properly later)
    const routePrices = {
      mombasa: { base: 500, perKg: 50 },
      kisumu:  { base: 400, perKg: 45 },
      nakuru:  { base: 250, perKg: 35 },
      eldoret: { base: 350, perKg: 40 },
      nyeri:   { base: 250, perKg: 35 },
    };

    // the function to calculate the cost
    function updateCost(){
      const weight = parseFloat(weightInput.value) || 0;
      const dest   = destOffice.value;
      if (dest && routePrices[dest]) {
        const price = routePrices[dest];
        const total = price.base + (weight * price.perKg);
        costDisplay.textContent = "KES " + total.toLocaleString();
      } else {
        costDisplay.textContent = "KES 0";
      }
    }

    weightInput.addEventListener("input", updateCost);
    destOffice.addEventListener("change", updateCost);

    registerForm.addEventListener("submit", function(event){
        event.preventDefault(); //prevent default form submission
        //grabing all inputs
        const senderName  = document.getElementById("sender-name");
        const senderPhone = document.getElementById("sender-phone");
        const senderId    = document.getElementById("sender-id");
        const receiverName  = document.getElementById("receiver-name");
        const receiverPhone = document.getElementById("receiver-phone");
        const destination   = document.getElementById("destination-office");
        const description   = document.getElementById("parcel-description");
        const weight        = document.getElementById("parcel-weight");

        //validate all field
        //use an array to track if all validations pass
        const ok= [
            validateRequired(senderName,  document.getElementById("sender-name-error"),  "Sender name is required."),
            validateRequired(senderPhone, document.getElementById("sender-phone-error"), "Sender phone is required."),
            validateRequired(senderId,    document.getElementById("sender-id-error"),    "ID number is required."),
            validateRequired(receiverName,  document.getElementById("receiver-name-error"),  "Receiver name is required."),
            validateRequired(receiverPhone, document.getElementById("receiver-phone-error"), "Receiver phone is required."),
            validateSelect(destination, document.getElementById("destination-office-error"), "Please select a destination office."),
            validateRequired(description, document.getElementById("parcel-description-error"), "Description is required."),
            validateRequired(weight,      document.getElementById("parcel-weight-error"),      "Weight is required."),
            ].every(Boolean); //check if all validations passed

        if(ok){
            //generate a random tracking number(for now)
            const year     = new Date().getFullYear();
            const tracking = "PKG-" + year + "-" + String(Math.floor(Math.random() * 9000) + 1000);

            //show the success card, hide the form
            document.getElementById("generatedTracking").textContent = tracking;
            registerForm.style.display = "none";
            document.getElementById("successCard").style.display = "block";  
        }
    });

    //copy tracking number to clipboard
    const copyBtn = document.getElementById("copyTrackingBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        const tracking = document.getElementById("generatedTracking").textContent;
        navigator.clipboard.writeText(tracking);
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy Number"; }, 2000);
      });
    }
    // Register another — show form again, hide success card
    const registerAnotherBtn = document.getElementById("registerAnotherBtn");
    if (registerAnotherBtn) {
      registerAnotherBtn.addEventListener("click", function () {
        registerForm.reset();
        registerForm.style.display = "block";
        document.getElementById("successCard").style.display = "none";
      });
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
