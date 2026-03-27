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
    registerForm.addEventListener("submit", function(event){
        event.preventDefault(); //prevent default form submission
        //grabing all inputs
        const senderName     = document.getElementById("sender-name");
        const senderPhone    = document.getElementById("sender-phone");
        const senderLocation = document.getElementById("sender-location");
        const receiverName     = document.getElementById("receiver-name");
        const receiverPhone    = document.getElementById("receiver-phone");
        const receiverLocation = document.getElementById("receiver-location");
        const description    = document.getElementById("parcel-description");
        const weight         = document.getElementById("parcel-weight");
        const route          = document.getElementById("parcel-route");
        const payment        = document.getElementById("parcel-payment");

        //validate all field
        //use an array to track if all validations pass
        const ok= [
            validateRequired(senderName,  document.getElementById("sender-name-error"), "Sender name is required."),
            validateRequired(senderPhone,    document.getElementById("sender-phone-error"),    "Sender phone is required."),
            validateRequired(senderLocation, document.getElementById("sender-location-error"), "Sender location is required."),
            validateRequired(receiverName,     document.getElementById("receiver-name-error"),     "Receiver name is required."),
            validateRequired(receiverPhone,    document.getElementById("receiver-phone-error"),    "Receiver phone is required."),
            validateRequired(receiverLocation, document.getElementById("receiver-location-error"), "Receiver location is required."),
            validateRequired(description, document.getElementById("parcel-description-error"), "Description is required."),
            validateRequired(weight,      document.getElementById("parcel-weight-error"),      "Weight is required."),
            validateSelect(route,   document.getElementById("parcel-route-error"),   "Please select a route."),
            validateSelect(payment, document.getElementById("parcel-payment-error"), "Please select a payment method."),
            ].every(Boolean); //check if all validations passed

        if(ok){
            //generate a random tracking number(for now)
            const tracking= "PKG-"+
            Math.floor(1000 + Math.random()* 9000)+ "-" +
            Math.floor(1000 + Math.random()* 9000);

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
