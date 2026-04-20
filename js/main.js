// ============================================================
// SwiftCourier — main.js
// One shared JS file for all pages.
// Sections are clearly labelled so you can navigate easily.
// All dummy data and old commented code has been removed.
// ============================================================


// ============================================================
// SECTION 1: SHARED HELPER FUNCTIONS
// Used across multiple pages for form validation
// ============================================================

// Checks that a text input is not empty
// Returns true if valid, false if not — and shows/hides error message
function validateRequired(input, errorSpan, message) {
  if (input.value.trim() === '') {
    input.classList.add('invalid')
    errorSpan.textContent = message
    return false
  } else {
    input.classList.remove('invalid')
    errorSpan.textContent = ''
    return true
  }
}

// Checks that a <select> dropdown has something chosen (not the blank default)
function validateSelect(select, errorSpan, message) {
  if (select.value === '') {
    select.classList.add('invalid')
    errorSpan.textContent = message
    return false
  } else {
    select.classList.remove('invalid')
    errorSpan.textContent = ''
    return true
  }
}

// Checks that an email input is not empty AND matches a basic email pattern
function validateEmail(input, errorSpan) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (input.value.trim() === '') {
    input.classList.add('invalid')
    errorSpan.textContent = 'Email is required.'
    return false
  } else if (!emailPattern.test(input.value.trim())) {
    input.classList.add('invalid')
    errorSpan.textContent = 'Please enter a valid email address.'
    return false
  } else {
    input.classList.remove('invalid')
    errorSpan.textContent = ''
    return true
  }
}

// Returns the correct CSS badge class for a given parcel status string
// Used by search parcel, update status, clerk dashboard, and reports pages
function getStatusBadgeClass(status) {
  const classes = {
    'Registered': 'badge-pending',
    'Dispatched': 'badge-transit',
    'In Transit': 'badge-transit',
    'Arrived':    'badge-arrived',
    'Collected':  'badge-arrived',
  }
  return classes[status] || 'badge-pending'
}

// Gets initials from a full name — e.g. "Grace Wanjiku" → "GW"
// Must be a global function (not inside an if block) because the clerk
// table uses onclick="editClerk(0)" in its HTML template strings,
// and those inline handlers need global access
function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
}


// ============================================================
// SECTION 2: ACTION DROPDOWN (··· buttons)
// Used on Manage Users, Offices & Routes pages
// ============================================================

// Tracks whether we've already added the global close-on-click listener
// This prevents stacking the same listener every time a table re-renders
let _dropdownListenerAdded = false

// Wires up all ··· action buttons so clicking them opens/closes their dropdown
// Call this after every render that produces action buttons
function attachActionDropdowns() {
  document.querySelectorAll('.actions-wrapper').forEach(function (wrapper) {
    // Clone the button to remove any old event listeners before adding new ones
    // This prevents the same click being handled multiple times after re-renders
    const btn    = wrapper.querySelector('.btn-actions')
    if (!btn) return
    const newBtn = btn.cloneNode(true)
    btn.parentNode.replaceChild(newBtn, btn)

    newBtn.addEventListener('click', function (e) {
      // stopPropagation prevents the document-level listener from immediately closing it
      e.stopPropagation()

      // Close any other open dropdowns first
      document.querySelectorAll('.actions-wrapper.open').forEach(function (other) {
        if (other !== wrapper) other.classList.remove('open')
      })

      // Toggle this dropdown open or closed
      wrapper.classList.toggle('open')
    })
  })

  // Add the document-level listener only once — clicking anywhere closes all dropdowns
  if (!_dropdownListenerAdded) {
    document.addEventListener('click', function () {
      document.querySelectorAll('.actions-wrapper.open').forEach(function (w) {
        w.classList.remove('open')
      })
    })
    _dropdownListenerAdded = true
  }
}

// ── Inline onclick handlers for action buttons ──
// These MUST be attached to window because the table template strings use
// onclick="editClerk(0)" — the browser looks for global functions for inline handlers

window.editClerk = function (index) {
  // We store the clerk data in the _clerksData array defined in the Manage Users section
  // This is accessible here because it's declared with let at the module level
  const clerk = _clerksData[index]
  if (!clerk) return
  // Open the edit modal and pre-fill it with this clerk's current data
  openEditClerkModal(clerk)
}

window.deactivateClerk = function (index) {
  const clerk = _clerksData[index]
  if (!clerk) return
  if (confirm('Are you sure you want to deactivate ' + clerk.name + '?\nThey will no longer be able to log in.')) {
    deleteClerkFromBackend(clerk.user_id, clerk.name)
  }
}

window.editOffice = function (index) {
  const office = _officesData[index]
  if (!office) return
  const modal = document.getElementById('editOfficeModal')
  if (!modal) return
  document.getElementById('editOfficeId').value       = office.office_id
  document.getElementById('editOfficeName').value     = office.office_name
  document.getElementById('editOfficeLocation').value = office.location || ''
  modal.classList.remove('modal-hidden')
}

window.deactivateOffice = function (index) {
  const office = _officesData[index]
  if (!office) return
  if (confirm('Delete office "' + office.office_name + '"?\nThis cannot be undone.')) {
    deleteOfficeFromBackend(office.office_id, office.office_name)
  }
}

window.editRoute = function (index) {
  const route = _routesData[index]
  if (!route) return
  const modal = document.getElementById('editRouteModal')
  if (!modal) return
  document.getElementById('editRouteId').value = route.route_id
  // Load real offices into both dropdowns, then pre-select current values
  loadOfficesIntoEditRouteModal().then(() => {
    document.getElementById('editRouteOrigin').value      = route.origin_office_id
    document.getElementById('editRouteDestination').value = route.destination_office_id
  })
  document.getElementById('editRouteDistance').value  = route.distance_km  || ''
  document.getElementById('editRouteBasePrice').value = route.base_price   || ''
  document.getElementById('editRoutePerKg').value     = route.price_per_kg || ''
  modal.classList.remove('modal-hidden')
}

window.deactivateRoute = function (index) {
  const route = _routesData[index]
  if (!route) return
  if (confirm('Delete route "' + route.origin_name + ' → ' + route.destination_name + '"?\nThis cannot be undone.')) {
    deleteRouteFromBackend(route.route_id)
  }
}

// Module-level arrays so the window.edit* functions above can access them
// They are populated when each page loads its data from the backend
let _clerksData  = []
let _officesData = []
let _routesData  = []

// ============================================================
// SECTION 3: LOGIN PAGE (index.html)
// ============================================================

// Show/hide password toggle on login page
const toggleBtn   = document.getElementById('toggle-password')
const passwordInput = document.getElementById('password')

if (toggleBtn) {
  toggleBtn.addEventListener('click', function () {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text'
      toggleBtn.textContent = 'Hide'
    } else {
      passwordInput.type = 'password'
      toggleBtn.textContent = 'Show'
    }
  })
}

// Login form — sends email and password to the backend API
// On success, saves the JWT token and user info to sessionStorage, then redirects
const loginForm = document.getElementById('loginForm')

if (loginForm) {
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault()

    const email    = document.getElementById('email')
    const password = document.getElementById('password')
    const role     = document.getElementById('role')

    const emailError    = document.getElementById('email-error')
    const passwordError = document.getElementById('password-error')
    const roleError     = document.getElementById('role-error')

    // Clear previous error messages before re-validating
    emailError.textContent    = ''
    passwordError.textContent = ''
    roleError.textContent     = ''

    // Basic frontend validation before hitting the server
    let valid = true
    if (!email.value.trim())  { emailError.textContent    = 'Email is required.';          valid = false }
    if (!password.value.trim()) { passwordError.textContent = 'Password is required.';     valid = false }
    if (!role.value)            { roleError.textContent    = 'Please select a role.';       valid = false }
    if (!valid) return

    try {
      // POST /api/auth/login — the backend checks credentials and returns a JWT token
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    email.value.trim(),
          password: password.value
        })
      })

      const data = await response.json()

      if (response.ok) {

        // Check the role selected on the form matches what's stored in the database
        // if (data.role !== role.value) {
        //   emailError.textContent = 'Role does not match this account.'
        //   return
        // }
        // Normalize both roles to lowercase to avoid "Admin" vs "admin" issues
        const dbRole = data.role.toLowerCase();
        const selectedRole = role.value.toLowerCase();

        // Check if both are "admin" or "administrator"
        const isAdminMatch = (dbRole === 'admin' || dbRole === 'administrator') && 
                            (selectedRole === 'admin' || selectedRole === 'administrator');

        if (dbRole !== selectedRole && !isAdminMatch) {
          emailError.textContent = 'Role does not match this account.'
          return
        }

        // Save everything to sessionStorage — other pages read these values
        sessionStorage.setItem('userEmail', data.email)
        sessionStorage.setItem('userRole',  data.role)
        sessionStorage.setItem('userName',  data.name)
        sessionStorage.setItem('token',     data.token)
        // We also save the office_id to sessionStorage because it's needed for registering parcels and showing office-specific stats on the clerk dashboard
        sessionStorage.setItem('userOfficeId', data.office_id)

        // Redirect to the correct dashboard based on role
        if (dbRole === 'clerk') {
          window.location.href = 'dashboard-clerk.html'
        } else {
          window.location.href = 'dashboard-admin.html'
        }

      } else {
        emailError.textContent = data.message || 'Login failed. Please try again.'
      }

    } catch (error) {
      console.error('Login error:', error)
      emailError.textContent = 'Cannot connect to server. Make sure the backend is running.'
    }
  })
}


// ============================================================
// SECTION 4: SHARED SIDEBAR (all post-login pages)
// Shows logged-in user info, handles logout and mobile hamburger
// ============================================================

// Display the logged-in user's email and role in the sidebar footer
const sidebarName = document.getElementById('sidebar-name')
const sidebarRole = document.getElementById('sidebar-role')

if (sidebarName) {
  const email = sessionStorage.getItem('userEmail')
  const role  = sessionStorage.getItem('userRole')

  sidebarName.textContent = email || 'User'
  sidebarRole.textContent = (role === 'admin') ? 'Administrator' : 'Clerk'

  // Update the avatar circle initial and colour
  const avatarEl = document.querySelector('.user-avatar')
  if (avatarEl) {
    avatarEl.textContent            = (role === 'admin') ? 'A' : 'C'
    avatarEl.style.backgroundColor  = 'var(--yellow)'
  }
}

// Logout button — clears sessionStorage and returns to login page
const logoutBtn = document.getElementById('logoutBtn')
if (logoutBtn) {
  logoutBtn.addEventListener('click', function () {
    sessionStorage.clear()
    window.location.href = 'index.html'
  })
}

// Mobile hamburger button — slides sidebar in from the left
const hamburgerBtn = document.getElementById('hamburgerBtn')
const sidebar      = document.querySelector('.sidebar')
const overlay      = document.getElementById('sidebarOverlay')

if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', function () {
    sidebar.classList.add('sidebar-open')
    overlay.classList.add('active')
  })
  overlay.addEventListener('click', function () {
    sidebar.classList.remove('sidebar-open')
    overlay.classList.remove('active')
  })
}


// ============================================================
// SECTION 5: CLERK DASHBOARD (dashboard-clerk.html)
// Loads real stat numbers and live feed table from the backend
// ============================================================

async function loadClerkDashboard() {
  // Only run on the clerk dashboard — identified by the stat grid without the admin chart canvas
  const statsGrid = document.querySelector('.stats-grid')
  const isClerkDash = statsGrid && !document.getElementById('parcelVolumeChart')
  if (!isClerkDash) return

  try {
    const token = sessionStorage.getItem('token')

    // use the clerk specific endpoint that returns only the data needed for the clerk dashboard
     const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/clerk/stats', {
      headers: { 'Authorization': 'Bearer ' + token }
    })

    if (!response.ok) return
    const data = await response.json()

    // Update the 4 stat card values
    // querySelectorAll gives us all .stat-value elements in order
    const statValues = document.querySelectorAll('.stat-card .stat-value')
    if (statValues.length >= 4) {
      statValues[0].textContent = data.stats.total_parcels
      statValues[1].textContent = 'KES ' + Number(data.stats.total_revenue).toLocaleString()
      statValues[2].textContent = data.stats.pending_count
      statValues[3].textContent = data.stats.arrived_count
    }

    // Update the Live Feed table with the 5 most recent parcels
    const feedTbody = document.querySelector('.data-table tbody')
    if (feedTbody && data.parcels.length > 0) {
      feedTbody.innerHTML = data.parcels.map(row => `
        <tr>
          <td>${row.tracking_number}</td>
          <td>${row.sender_name}</td>
          <td>${row.receiver_name}</td>
          <td>${row.origin_office} → ${row.destination_office}</td>
          <td><span class="badge ${getStatusBadgeClass(row.current_status)}">${row.current_status}</span></td>
        </tr>
      `).join('')
    }

  } catch (error) {
    // If fetch fails (e.g. server down), the placeholder HTML stays — that's fine
    console.log('Clerk dashboard: could not load live data', error)
  }
}

loadClerkDashboard()


// ============================================================
// SECTION 6: REGISTER PARCEL (register-parcel.html)
// Form that creates a new parcel in the database
// ============================================================

const registerForm = document.getElementById('registerParcelForm')

if (registerForm) {

  // Real-time cost estimator — updates as clerk types weight or changes destination
  const weightInput = document.getElementById('parcel-weight')
  const destOffice  = document.getElementById('destination-office')
  const costDisplay = document.getElementById('estimatedCost')

   // Store routes fetched from the backend so we can look up pricing
  let availableRoutes = []

  // Load real routes from the backend, filtered to start from the clerk's office
  async function loadDestinationRoutes() {
    try {
      const token        = sessionStorage.getItem('token')
      const clerkOfficeId = sessionStorage.getItem('userOfficeId')

      // GET all routes, then filter to those starting from clerk's office
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/routes', {
        headers: { 'Authorization': 'Bearer ' + token }
      })

      if (!response.ok) return

      const allRoutes = await response.json()

      // Only show routes where origin matches the clerk's office
      availableRoutes = allRoutes.filter(r => String(r.origin_office_id) === String(clerkOfficeId))

      // Build the dropdown options from the filtered routes
      if (destOffice) {
        if (availableRoutes.length === 0) {
          destOffice.innerHTML = '<option value="">No routes from your office yet</option>'
        } else {
          destOffice.innerHTML = '<option value="">-- Select destination --</option>' +
            availableRoutes.map(r => `
              <option value="${r.destination_office_id}">
                ${r.origin_name} → ${r.destination_name}
              </option>
            `).join('')
        }
      }
    } catch (error) {
      console.error('Load routes error:', error)
    }
  }

  // When destination changes, look up the route's base price and update cost display
  function updateCost() {
    const weight  = parseFloat(weightInput.value) || 0
    const destId  = destOffice ? destOffice.value : ''

    // Find the selected route in our fetched routes array
    const route = availableRoutes.find(r => String(r.destination_office_id) === String(destId))

    if (route && route.base_price) {
      const total = parseFloat(route.base_price) + (weight * parseFloat(route.price_per_kg || 0))
      if (costDisplay) costDisplay.textContent = 'KES ' + total.toLocaleString()
    } else {
      if (costDisplay) costDisplay.textContent = 'KES 0'
    }
  }
  if (weightInput) weightInput.addEventListener('input', updateCost)
  if (destOffice)  destOffice.addEventListener('change', updateCost)

  // Load routes when page opens
  loadDestinationRoutes()
  

  registerForm.addEventListener('submit', async function (event) {
    event.preventDefault()

    const senderName    = document.getElementById('sender-name')
    const senderPhone   = document.getElementById('sender-phone')
    const senderId      = document.getElementById('sender-id')
    const receiverName  = document.getElementById('receiver-name')
    const receiverPhone = document.getElementById('receiver-phone')
    const destination   = document.getElementById('destination-office')
    const description   = document.getElementById('parcel-description')
    const weight        = document.getElementById('parcel-weight')

    // Validate every field — .every(Boolean) means ALL must pass
    const ok = [
      validateRequired(senderName,    document.getElementById('sender-name-error'),        'Sender name is required.'),
      validateRequired(senderPhone,   document.getElementById('sender-phone-error'),       'Sender phone is required.'),
      validateRequired(senderId,      document.getElementById('sender-id-error'),          'ID number is required.'),
      validateRequired(receiverName,  document.getElementById('receiver-name-error'),      'Receiver name is required.'),
      validateRequired(receiverPhone, document.getElementById('receiver-phone-error'),     'Receiver phone is required.'),
      validateSelect(destination,     document.getElementById('destination-office-error'), 'Please select a destination office.'),
      validateRequired(description,   document.getElementById('parcel-description-error'), 'Description is required.'),
      validateRequired(weight,        document.getElementById('parcel-weight-error'),      'Weight is required.'),
    ].every(Boolean)

    if (!ok) return

    try {
      const token = sessionStorage.getItem('token')

      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/parcels', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          sender_name:           senderName.value.trim(),
          sender_phone:          senderPhone.value.trim(),
          sender_id_number:      senderId.value.trim(),
          receiver_name:         receiverName.value.trim(),
          receiver_phone:        receiverPhone.value.trim(),
          // destination is now the actual office_id from the database
          destination_office_id: parseInt(destination.value),
          description:           description.value.trim(),
          weight:                parseFloat(weight.value)
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Show success screen with the tracking number generated by the backend
        document.getElementById('generatedTracking').textContent = data.tracking_number
        registerForm.style.display = 'none'
        document.getElementById('successCard').style.display = 'block'
      } else {
        document.getElementById('sender-name-error').textContent = data.message || 'Registration failed.'
      }

    } catch (error) {
      console.error('Register parcel error:', error)
      document.getElementById('sender-name-error').textContent = 'Cannot connect to server.'
    }
  })

  // Copy tracking number to clipboard
  const copyBtn = document.getElementById('copyTrackingBtn')
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const tracking = document.getElementById('generatedTracking').textContent
      navigator.clipboard.writeText(tracking)
      copyBtn.textContent = 'Copied!'
      setTimeout(() => { copyBtn.textContent = 'Copy Number' }, 2000)
    })
  }

  // After success — show button to go to Record Payment directly
  const goToPaymentBtn = document.getElementById('goToPaymentBtn')
  if (goToPaymentBtn) {
    goToPaymentBtn.addEventListener('click', function () {
      // Pass tracking number via sessionStorage so record-payment page can pre-fill it
      const tracking = document.getElementById('generatedTracking').textContent
      sessionStorage.setItem('pendingPaymentTracking', tracking)
      window.location.href = 'record-payment.html'
    })
  }


  // Register Another button — resets form and hides success screen
  const registerAnotherBtn = document.getElementById('registerAnotherBtn')
  if (registerAnotherBtn) {
    registerAnotherBtn.addEventListener('click', function () {
      registerForm.reset()
      registerForm.style.display = 'block'
      document.getElementById('successCard').style.display = 'none'
      if (costDisplay) costDisplay.textContent = 'KES 0'
      loadDestinationRoutes() // reload routes for fresh form
    })
  }
}


// ============================================================
// SECTION 7: SEARCH PARCEL (search-parcel.html)
// Looks up a parcel by tracking number and shows its full history
// ============================================================

const searchBtn = document.getElementById('searchBtn')

if (searchBtn) {

  async function runSearch() {
    const query      = document.getElementById('searchInput').value.trim().toUpperCase()
    const resultsDiv = document.getElementById('searchResults')
    const notFound   = document.getElementById('notFound')

    resultsDiv.style.display = 'none'
    notFound.style.display   = 'none'

    if (!query) return

    try {
      const token = sessionStorage.getItem('token')

      // GET /api/parcels/:tracking_number — returns parcel + status history
      const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/parcels/${query}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })

      const data = await response.json()

      if (response.ok) {
        const p = data.parcel

        // Populate the shipment details card
        document.getElementById('result-tracking').textContent    = p.tracking_number
        document.getElementById('result-sender').textContent      = p.sender_name
        document.getElementById('result-receiver').textContent    = p.receiver_name
        document.getElementById('result-origin').textContent      = p.origin_office
        document.getElementById('result-destination').textContent = p.destination_office
        document.getElementById('result-weight').textContent      = p.weight + ' kg'
        document.getElementById('result-cost').textContent        = 'KES ' + Number(p.amount_charged).toLocaleString()

        // Set status badge with correct colour
        const statusEl = document.getElementById('result-status')
        if (statusEl) {
          statusEl.textContent = p.current_status
          statusEl.className   = 'badge ' + getStatusBadgeClass(p.current_status)
        }

        // Build the tracking timeline from the status history array
        // Each entry is one status change logged to parcel_status_history in the DB
        const timelineEl = document.getElementById('trackingTimeline')
        if (timelineEl) {
         timelineEl.textContent = '' // clear previous results safely

        if (data.history.length > 0) {
          data.history.forEach(entry => {
            // Build each element as a real DOM node, not a string
            const entryDiv   = document.createElement('div')
            entryDiv.className = 'timeline-entry'

            const dot = document.createElement('div')
            dot.className = 'timeline-dot'

            const content = document.createElement('div')
            content.className = 'timeline-content'

            const statusP = document.createElement('p')
            statusP.className   = 'timeline-status'
            statusP.textContent = entry.status || ''  // textContent never executes HTML

            const noteP = document.createElement('p')
            noteP.className   = 'timeline-note'
            noteP.textContent = entry.notes || ''

            const dateP = document.createElement('p')
            dateP.className   = 'timeline-date'
            dateP.textContent = new Date(entry.updated_at).toLocaleString()

            content.appendChild(statusP)
            content.appendChild(noteP)
            content.appendChild(dateP)
            entryDiv.appendChild(dot)
            entryDiv.appendChild(content)
            timelineEl.appendChild(entryDiv)
          })
        } else {
          const msg = document.createElement('p')
          msg.style.color    = 'var(--muted)'
          msg.style.fontSize = '0.85rem'
          msg.textContent    = 'No history recorded yet.'
          timelineEl.appendChild(msg)
        }

        resultsDiv.style.display = 'block'

      } else {
        notFound.style.display = 'block'
      }

    } }catch (error) {
      console.error('Search error:', error)
      notFound.style.display = 'block'
    }
  }

  searchBtn.addEventListener('click', runSearch)

  document.getElementById('searchInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') runSearch()
  })

  // Recent search pill buttons — fill the input and run search automatically
  document.querySelectorAll('.pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      document.getElementById('searchInput').value = this.getAttribute('data-tracking')
      runSearch()
    })
  })
}


// ============================================================
// SECTION 8: UPDATE PARCEL STATUS (update-status.html)
// Finds a parcel, shows its current status, lets clerk update it
// ============================================================

const statusSearchBtn = document.getElementById('statusSearchBtn')

if (statusSearchBtn) {

  // Stores the tracking number of the parcel currently shown
  // Used when the confirm button is clicked to know which parcel to update
  let currentTracking = null

  async function findParcelForStatus() {
    const query         = document.getElementById('statusSearchInput').value.trim().toUpperCase()
    const updateSection = document.getElementById('updateSection')
    const notFound      = document.getElementById('updateNotFound')
    const successDiv    = document.getElementById('updateSuccess')

    // Reset all three panels before each new search
    updateSection.style.display = 'none'
    notFound.style.display      = 'none'
    successDiv.style.display    = 'none'

    if (!query) return

    try {
      const token = sessionStorage.getItem('token')

      // Reuse the search endpoint — same data we need
      const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/parcels/${query}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })

      const data = await response.json()

      if (response.ok) {
        // Save tracking number for the confirm button to use later
        currentTracking = data.parcel.tracking_number

        document.getElementById('upd-tracking').textContent = data.parcel.tracking_number
        document.getElementById('upd-sender').textContent   = data.parcel.sender_name
        document.getElementById('upd-receiver').textContent = data.parcel.receiver_name

        // Show current status as a coloured badge
        const currentStatusEl = document.getElementById('upd-current-status')
        if (currentStatusEl) {
          currentStatusEl.textContent = data.parcel.current_status
          currentStatusEl.className   = 'badge ' + getStatusBadgeClass(data.parcel.current_status)
        }

        updateSection.style.display = 'block'

      } else {
        notFound.style.display = 'block'
      }

    } catch (error) {
      console.error('Find parcel for status error:', error)
      notFound.style.display = 'block'
    }
  }

  statusSearchBtn.addEventListener('click', findParcelForStatus)

  document.getElementById('statusSearchInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') findParcelForStatus()
  })

  // Confirm Status Update button
  const confirmStatusBtn = document.getElementById('confirmStatusBtn')
  if (confirmStatusBtn) {
    confirmStatusBtn.addEventListener('click', async function () {
      const newStatus = document.getElementById('newStatusSelect')
      const notes     = document.getElementById('statusNotes')
      const statusErr = document.getElementById('newStatus-error')

      const ok = validateSelect(newStatus, statusErr, 'Please select a new status.')
      if (!ok) return

      try {
        const token = sessionStorage.getItem('token')

        // PUT /api/parcels/:tracking_number/status
        const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/parcels/${currentTracking}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            status: newStatus.value,
            notes:  notes ? notes.value.trim() : ''
          })
        })
        // --- ADD THIS SECTION HERE ---
        if (response.status === 402) {
        // If payment is required, show the modal instead of an error message
        showPaymentModal(currentTracking)
        return
        } // ------------------------------

        const data = await response.json()

        if (response.ok) {
          document.getElementById('updateSection').style.display = 'none'
          document.getElementById('updateSuccess').style.display = 'block'

          // Show the new status in the success message if the element exists
          const successStatus = document.getElementById('success-new-status')
          if (successStatus) successStatus.textContent = newStatus.value

        } else {
          statusErr.textContent = data.message || 'Update failed.'
        }

      } catch (error) {
        console.error('Update status error:', error)
      }
    })
  }

  // Update Another button — resets page so clerk can search again
  const updateAnotherBtn = document.getElementById('updateAnotherBtn')
  if (updateAnotherBtn) {
    updateAnotherBtn.addEventListener('click', function () {
      document.getElementById('statusSearchInput').value      = ''
      document.getElementById('updateSuccess').style.display  = 'none'
      document.getElementById('updateSection').style.display  = 'none'
      document.getElementById('updateNotFound').style.display = 'none'
      currentTracking = null
    })
  }
  // --- Modal Helpers ---
  function showPaymentModal(tracking) {
      const modal = document.getElementById('paymentModal');
      const payBtn = document.getElementById('goToPaymentBtn');
      if (modal && payBtn) {
          modal.style.display = 'flex';
          payBtn.onclick = () => {
              // Redirect to record payment page with the tracking number in URL
              window.location.href = `record-payment.html?tracking=${tracking}`;
          };
      }
  }

  // Make closePaymentModal available to the "Cancel" button
  window.closePaymentModal = function() {
      const modal = document.getElementById('paymentModal');
      if (modal) modal.style.display = 'none';
  }
}


// ============================================================
// SECTION 9: RECORD PAYMENT (record-payment.html)
// Finds a parcel, shows its cost, then records payment against it
// ============================================================

const paymentSearchBtn = document.getElementById('paymentSearchBtn')

if (paymentSearchBtn) {

  // ── START OF AUTO-FILL LOGIC ──
  const paymentSearchInput = document.getElementById('paymentSearchInput');
  const pendingTracking = sessionStorage.getItem('pendingPaymentTracking');

  if (paymentSearchInput && pendingTracking) {
    // 1. Fill the input with the tracking number from registration
    paymentSearchInput.value = pendingTracking;

    // 2. Clear it so it doesn't auto-fill again on a manual refresh
    sessionStorage.removeItem('pendingPaymentTracking');

    // 3. Trigger the search function automatically
    // We delay slightly to ensure the page is fully ready
    setTimeout(() => {
        findParcelForPayment();
    }, 100);
  }
  // ── END OF AUTO-FILL LOGIC ──

  async function findParcelForPayment() {
    const query          = document.getElementById('paymentSearchInput').value.trim().toUpperCase()
    const paymentSection = document.getElementById('paymentSection')
    const notFound       = document.getElementById('paymentNotFound')
    const successDiv     = document.getElementById('paymentSuccess')

    paymentSection.style.display = 'none'
    notFound.style.display       = 'none'
    successDiv.style.display     = 'none'

    if (!query) return

    try {
      const token = sessionStorage.getItem('token')

      // GET /api/payments/parcel/:tracking_number — returns parcel summary for payment form
      const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/payments/parcel/${query}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })

      const data = await response.json()

      if (response.ok) {
        document.getElementById('pay-tracking').textContent = data.tracking_number
        document.getElementById('pay-sender').textContent   = data.sender_name
        document.getElementById('pay-route').textContent    = data.destination_office
        document.getElementById('pay-cost').textContent     = 'KES ' + Number(data.amount_charged).toLocaleString()
        document.getElementById('pay-status').textContent   = data.payment_status

        paymentSection.style.display = 'block'

      } else {
        notFound.style.display = 'block'
      }

    } catch (error) {
      console.error('Payment search error:', error)
      notFound.style.display = 'block'
    }
  }

  paymentSearchBtn.addEventListener('click', findParcelForPayment)

  document.getElementById('paymentSearchInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') findParcelForPayment()
  })

  // Show/hide the M-Pesa reference field based on payment method selected
  const paymentMethodSelect = document.getElementById('paymentMethod')
  if (paymentMethodSelect) {
    paymentMethodSelect.addEventListener('change', function () {
      const mpesaGroup = document.getElementById('mpesaRefGroup')
      if (mpesaGroup) {
        mpesaGroup.style.display = (this.value === 'mpesa') ? 'block' : 'none'
      }
    })
  }

  // Confirm Payment button — saves payment to the database
  const confirmPaymentBtn = document.getElementById('confirmPaymentBtn')
  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', async function () {
      const method    = document.getElementById('paymentMethod')
      const amount    = document.getElementById('amountPaid')
      const mpesaRef  = document.getElementById('mpesaRef')
      const methodErr = document.getElementById('paymentMethod-error')
      const amountErr = document.getElementById('amountPaid-error')
      const mpesaErr  = document.getElementById('mpesaRef-error')

      const methodOk = validateSelect(method, methodErr, 'Please select a payment method.')
      const amountOk = validateRequired(amount, amountErr, 'Please enter the amount paid.')

      let mpesaOk = true
      if (method.value === 'mpesa') {
        mpesaOk = validateRequired(mpesaRef, mpesaErr, 'M-Pesa reference is required.')
      }

      if (!methodOk || !amountOk || !mpesaOk) return

      try {
        const token           = sessionStorage.getItem('token')
        const tracking_number = document.getElementById('pay-tracking').textContent

        // POST /api/payments — saves the payment record to the database
        const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            tracking_number,
            amount:         parseFloat(amount.value),
            payment_method: method.value,
            mpesa_ref:      mpesaRef ? mpesaRef.value.trim() : ''
          })
        })

        const data = await response.json()

        if (response.ok) {
          document.getElementById('paymentSection').style.display  = 'none'
          document.getElementById('paymentSuccess').style.display  = 'block'
          document.getElementById('success-pay-tracking').textContent = tracking_number
          document.getElementById('success-pay-amount').textContent   = 'KES ' + Number(amount.value).toLocaleString()
          document.getElementById('success-pay-method').textContent   = method.options[method.selectedIndex].text
        } else {
          methodErr.textContent = data.message || 'Payment failed.'
        }

      } catch (error) {
        console.error('Payment error:', error)
      }
    })
  }

  // Record Another button — resets the payment form
  const recordAnotherBtn = document.getElementById('recordAnotherBtn')
  if (recordAnotherBtn) {
    recordAnotherBtn.addEventListener('click', function () {
      document.getElementById('paymentSearchInput').value     = ''
      document.getElementById('paymentSuccess').style.display = 'none'
      document.getElementById('paymentSection').style.display = 'none'
      document.getElementById('paymentMethod').value          = ''
      document.getElementById('amountPaid').value             = ''
      if (document.getElementById('mpesaRef'))      document.getElementById('mpesaRef').value = ''
      const mpesaGroup = document.getElementById('mpesaRefGroup')
      if (mpesaGroup) mpesaGroup.style.display = 'none'
    })
  }
}


// ============================================================
// SECTION 10: ADMIN DASHBOARD (dashboard-admin.html)
// Real stat cards + parcel volume chart + revenue chart + top clerks table
// ============================================================

const parcelCanvas = document.getElementById('parcelVolumeChart')

if (parcelCanvas) {

  async function loadAdminDashboard() {
    try {
      const token = sessionStorage.getItem('token')

      // Fetch the 4 summary numbers for the stat cards
      const statsRes = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/stats', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      const stats = await statsRes.json()

      // Update stat cards — selected by position (nth-child)
      // The cards appear in this order: Total Parcels, Revenue, Active Clerks, Active Offices
      const statCards = document.querySelectorAll('.stats-grid .stat-card')
      if (statCards.length >= 4) {
        statCards[0].querySelector('.stat-value').textContent = stats.total_parcels.toLocaleString()
        statCards[1].querySelector('.stat-value').textContent = 'KES ' + Number(stats.total_revenue).toLocaleString()
        statCards[2].querySelector('.stat-value').textContent = stats.active_clerks
        statCards[3].querySelector('.stat-value').textContent = stats.active_offices
      }

      // Fetch parcel data for charts and top clerks table
      const reportsRes = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/reports', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      const reportsData = await reportsRes.json()

      // ── Chart 1: Parcel Volume by date ──
      // Count how many parcels were created on each date
      const dateCounts = {}
      reportsData.parcels.forEach(parcel => {
        const date = new Date(parcel.created_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short'
        })
        dateCounts[date] = (dateCounts[date] || 0) + 1
      })

      new Chart(parcelCanvas, {
        type: 'bar',
        data: {
          labels: Object.keys(dateCounts),
          datasets: [{
            label: 'Parcels',
            data:  Object.values(dateCounts),
            backgroundColor: '#0f172a',
            borderRadius: 4,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      })

      // ── Chart 2: Revenue by destination office ──
      // Revenue here means amount_charged on parcels (billed amount)
      // Once all parcels have payments recorded, this will equal actual payments
      const officeRevenue = {}
      reportsData.parcels.forEach(parcel => {
        const office = parcel.destination_office
        const amount = parseFloat(parcel.amount_charged) || 0
        officeRevenue[office] = (officeRevenue[office] || 0) + amount
      })

      const revenueCanvas = document.getElementById('revenueRouteChart')
      if (revenueCanvas && Object.keys(officeRevenue).length > 0) {
        new Chart(revenueCanvas, {
          type: 'bar',
          data: {
            labels: Object.keys(officeRevenue),
            datasets: [{
              label: 'Billed Amount (KES)',
              data:  Object.values(officeRevenue),
              backgroundColor: '#0f172a',
              borderRadius: 4,
            }]
          },
          options: {
            indexAxis: 'y',  // horizontal bar chart
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, grid: { color: '#f1f5f9' } },
              y: { grid: { display: false } }
            }
          }
        })
      }

      // ── Top Performing Clerks table ──
      // Count parcels registered by each clerk name, sort descending, show top 5
     const clerkStats = {}
      reportsData.parcels.forEach(parcel => {
        const clerk = parcel.registered_by
        if (!clerkStats[clerk]) {
          clerkStats[clerk] = { count: 0, revenue: 0 }
        }
        clerkStats[clerk].count += 1
        // If your parcel data has an 'amount' or 'price' field, add it here:
        clerkStats[clerk].revenue += parseFloat(parcel.amount_paid || 0) 
      })

      const sortedClerks = Object.entries(clerkStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
      //fetch to get real clerks details
      let clerkDetails = []
      try {
        const clerkRes = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/clerks', {
          headers: { 'Authorization': 'Bearer ' + token }
        })
        if (clerkRes.ok) clerkDetails = await clerkRes.json()
      } catch (e) {
        console.log('Could not fetch clerk details for table')
      }
      
      const clerksTableBody = document.querySelector('.data-table tbody')
    if (clerksTableBody && sortedClerks.length > 0) {
      clerksTableBody.innerHTML = sortedClerks.map(([name, stats], index) => {
        const clerkInfo = clerkDetails.find(c => c.name === name)
        const officeName = clerkInfo ? (clerkInfo.office_name || '—') : '—'
        
        return `
          <tr>
            <td><span class="rank-badge ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}">#${index + 1}</span></td>
            <td>${name}</td>
            <td>${officeName}</td>
            <td>${stats.count}</td>
            <td>KES ${stats.revenue.toLocaleString()}</td> 
          </tr>
        `
      }).join('')

    }} catch (error) {
      console.error('Admin dashboard error:', error)
    }
  }

  loadAdminDashboard()
}


// ============================================================
// SECTION 11: MANAGE USERS (manage-users.html)
// Shows real clerks from the database, supports add + edit + deactivate
// ============================================================

const clerksTableBodyEl = document.getElementById('clerksTableBody')

if (clerksTableBodyEl) {

  // ── Load clerks from the backend ──
  async function loadClerks() {
    try {
      const token    = sessionStorage.getItem('token')
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/clerks', {
        headers: { 'Authorization': 'Bearer ' + token }
      })

      if (!response.ok) throw new Error('Failed to load clerks')

      // Store in module-level array so window.editClerk and window.deactivateClerk can access it
      _clerksData = await response.json()

      renderClerksTable(_clerksData)
      updateClerkStats(_clerksData)

    } catch (error) {
      console.error('Load clerks error:', error)
      clerksTableBodyEl.innerHTML = `
        <tr><td colspan="6" style="text-align:center;color:var(--error);padding:32px;">
          Could not load clerks. Make sure the server is running.
        </td></tr>`
    }
  }

  // ── Render the clerks table ──
  function renderClerksTable(data) {
    if (data.length === 0) {
      clerksTableBodyEl.innerHTML = `
        <tr><td colspan="6" style="text-align:center;color:var(--muted);padding:32px;">
          No clerks found.
        </td></tr>`
      return
    }

    clerksTableBodyEl.innerHTML = data.map((clerk, index) => `
      <tr>
        <td>
          <div class="clerk-name-row">
            <div class="clerk-avatar">${getInitials(clerk.name)}</div>
            <div class="clerk-name-cell">
              <strong>${clerk.name}</strong>
              <span class="clerk-joined">
                Joined ${new Date(clerk.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </td>
        <td>${clerk.email}</td>
        <td>${clerk.office_name || '—'}</td>
        <td><span class="badge badge-active">Active</span></td>
        <td>—</td>
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
    `).join('')

    // Wire up the ··· dropdown buttons after rendering
    attachActionDropdowns()
  }

  // ── Update the 3 stat cards at the top of the page ──
  function updateClerkStats(data) {
    const totalEl   = document.getElementById('totalClerksCount')
    const activeEl  = document.getElementById('activeClerksCount')
    const pendingEl = document.getElementById('pendingClerksCount')

    if (totalEl)   totalEl.textContent   = data.length
    if (activeEl)  activeEl.textContent  = data.length
    if (pendingEl) pendingEl.textContent = 0
  }

  // ── Live search — filters table as clerk types ──
  const clerkSearchInput = document.getElementById('clerkSearchInput')
  if (clerkSearchInput) {
    clerkSearchInput.addEventListener('input', function () {
      const query    = this.value.toLowerCase()
      const filtered = _clerksData.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.office_name || '').toLowerCase().includes(query)
      )
      renderClerksTable(filtered)
    })
  }

  // ── Load offices into the modal dropdown ──
  // So it shows real offices from the database, not hardcoded options
  async function loadOfficesForDropdown(selectId) {
    try {
      const token    = sessionStorage.getItem('token')
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/offices', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      const offices = await response.json()
      const select  = document.getElementById(selectId)
      if (select) {
        select.innerHTML = '<option value="">Select office</option>' +
          offices.map(o => `<option value="${o.office_id}">${o.office_name}</option>`).join('')
      }
    } catch (error) {
      console.error('Load offices for dropdown error:', error)
    }
  }

  // ── ADD CLERK MODAL ──
  const addClerkModal    = document.getElementById('addClerkModal')
  const openModalBtn     = document.getElementById('openAddClerkModal')
  const closeModalBtn    = document.getElementById('closeAddClerkModal')
  const cancelModalBtn   = document.getElementById('cancelAddClerk')

  function closeAddModal() {
    addClerkModal.classList.add('modal-hidden')
    // Clear all error messages and form fields
    document.getElementById('newClerkName').value   = ''
    document.getElementById('newClerkEmail').value  = ''
    document.getElementById('newClerkOffice').value = ''
    const passEl = document.getElementById('newClerkPassword')
    if (passEl) passEl.value = ''
    ;['newClerkName-error', 'newClerkEmail-error', 'newClerkOffice-error', 'newClerkPassword-error'].forEach(id => {
      const el = document.getElementById(id)
      if (el) el.textContent = ''
    })
  }

  if (openModalBtn) {
    openModalBtn.addEventListener('click', function () {
      addClerkModal.classList.remove('modal-hidden')
      loadOfficesForDropdown('newClerkOffice')  // load real offices each time modal opens
    })
  }
  if (closeModalBtn)  closeModalBtn.addEventListener('click',  closeAddModal)
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeAddModal)
  if (addClerkModal)  addClerkModal.addEventListener('click', e => { if (e.target === addClerkModal) closeAddModal() })

  // Submit the new clerk form — creates clerk account in the database
  const submitAddClerk = document.getElementById('submitAddClerk')
  if (submitAddClerk) {
    submitAddClerk.addEventListener('click', async function () {
      const nameInput   = document.getElementById('newClerkName')
      const emailInput  = document.getElementById('newClerkEmail')
      const officeInput = document.getElementById('newClerkOffice')
      const passInput   = document.getElementById('newClerkPassword')

      const nameOk   = validateRequired(nameInput,  document.getElementById('newClerkName-error'),   'Name is required.')
      const emailOk  = validateEmail(emailInput,    document.getElementById('newClerkEmail-error'))
      const officeOk = validateSelect(officeInput,  document.getElementById('newClerkOffice-error'),  'Please select an office.')
      const passOk   = passInput ? validateRequired(passInput, document.getElementById('newClerkPassword-error'), 'Password is required.') : true

      if (!nameOk || !emailOk || !officeOk || !passOk) return

      try {
        const token = sessionStorage.getItem('token')

        // POST /api/admin/clerks — creates the clerk account
        const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/clerks', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            name:      nameInput.value.trim(),
            email:     emailInput.value.trim(),
            password:  passInput ? passInput.value : 'password123',
            office_id: parseInt(officeInput.value)
          })
        })

        const data = await response.json()

        if (response.ok) {
          await loadClerks()  // reload table to show the new clerk
          closeAddModal()
        } else {
          document.getElementById('newClerkEmail-error').textContent = data.message || 'Failed to create clerk.'
        }

      } catch (error) {
        console.error('Create clerk error:', error)
      }
    })
  }

  // ── EDIT CLERK MODAL ──
  // openEditClerkModal is called by window.editClerk when the ··· → Edit is clicked
  function openEditClerkModal(clerk) {
    const editModal = document.getElementById('editClerkModal')
    if (!editModal) {
      // If the edit modal doesn't exist in the HTML yet, show instructions
      alert('Edit clerk modal not found in HTML.\nAdd the editClerkModal HTML (see instructions).')
      return
    }

    // Pre-fill the edit form with the clerk's current data
    document.getElementById('editClerkId').value   = clerk.user_id
    document.getElementById('editClerkName').value = clerk.name
    const editClerkEmailInput = document.getElementById('editClerkEmail')
    if (editClerkEmailInput) {
      editClerkEmailInput.value = clerk.email
    }

    // Load offices into the edit modal dropdown and select current one
    loadOfficesForDropdown('editClerkOffice').then(() => {
      const officeSelect = document.getElementById('editClerkOffice')
      if (officeSelect && clerk.office_id) {
        officeSelect.value = clerk.office_id
      }
    })

    editModal.classList.remove('modal-hidden')
  }

  // Save edit clerk changes
  const saveEditClerk = document.getElementById('saveEditClerk')
  if (saveEditClerk) {
    saveEditClerk.addEventListener('click', async function () {
      const clerkId   = document.getElementById('editClerkId').value
      const nameInput = document.getElementById('editClerkName')
      const officeInput = document.getElementById('editClerkOffice')

      const nameOk   = validateRequired(nameInput,  document.getElementById('editClerkName-error'),  'Name is required.')
      const officeOk = validateSelect(officeInput,  document.getElementById('editClerkOffice-error'), 'Please select an office.')

      if (!nameOk || !officeOk) return

      try {
        const token = sessionStorage.getItem('token')

        // PUT /api/admin/clerks/:id — update the clerk (backend endpoint to add)
        const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/admin/clerks/${clerkId}`, {
          method: 'PUT',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            name:      nameInput.value.trim(),
            office_id: parseInt(officeInput.value)
          })
        })

        const data = await response.json()

        if (response.ok) {
          document.getElementById('editClerkModal').classList.add('modal-hidden')
          await loadClerks()  // reload to show updated data
        } else {
          document.getElementById('editClerkName-error').textContent = data.message || 'Update failed.'
        }

      } catch (error) {
        console.error('Edit clerk error:', error)
      }
    })
  }

  // Close edit modal
  const closeEditClerk  = document.getElementById('closeEditClerkModal')
  const cancelEditClerk = document.getElementById('cancelEditClerk')
  const editClerkModal  = document.getElementById('editClerkModal')

  if (closeEditClerk)  closeEditClerk.addEventListener('click',  () => editClerkModal.classList.add('modal-hidden'))
  if (cancelEditClerk) cancelEditClerk.addEventListener('click', () => editClerkModal.classList.add('modal-hidden'))
  if (editClerkModal)  editClerkModal.addEventListener('click', e => { if (e.target === editClerkModal) editClerkModal.classList.add('modal-hidden') })

  // ── DELETE / DEACTIVATE CLERK ──
  // deleteClerkFromBackend is called by window.deactivateClerk
  async function deleteClerkFromBackend(userId, name) {
    try {
      const token = sessionStorage.getItem('token')

      // DELETE /api/admin/clerks/:id — remove the clerk (backend endpoint to add)
      const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/admin/clerks/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      })

      if (response.ok) {
        alert(name + ' has been deactivated.')
        await loadClerks()  // reload to remove from table
      } else {
        const data = await response.json()
        alert('Could not deactivate: ' + (data.message || 'Server error'))
      }

    } catch (error) {
      console.error('Deactivate clerk error:', error)
      alert('Could not connect to server.')
    }
  }

  // Start loading on page open
  loadClerks()
}


// ============================================================
// SECTION 12: OFFICES & ROUTES (offices-routes.html)
// Shows office cards and routes table from the database
// Supports adding new offices and routes through modals
// ============================================================

const officesGrid = document.getElementById('officesGrid')

if (officesGrid) {

  // ── Load and render offices ──
  async function loadOffices() {
    try {
      const token    = sessionStorage.getItem('token')
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/offices', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      _officesData = await response.json()
      renderOffices(_officesData)
    } catch (error) {
      console.error('Load offices error:', error)
    }
  }

  function renderOffices(data) {
    const officeCountEl = document.getElementById('officeCount')

    if (data.length === 0) {
      officesGrid.innerHTML = `<p style="color:var(--muted);">No offices yet. Add your first office.</p>`
      if (officeCountEl) officeCountEl.textContent = '0 offices'
      return
    }

    if (officeCountEl) officeCountEl.textContent = `${data.length} office${data.length === 1 ? '' : 's'} across Kenya`

    officesGrid.innerHTML = data.map((office, index) => `
      <div class="office-card">
        <div class="office-card-top">
          <div>
            <p class="office-card-name">${office.office_name}</p>
            <span class="badge badge-office-active">active</span>
          </div>
          <div class="actions-wrapper" data-index="${index}">
            <button class="btn-actions">···</button>
            <div class="actions-dropdown">
              <button onclick="editOffice(${index})">✏️ Edit</button>
              <button class="danger" onclick="deactivateOffice(${index})">🗑️ Delete</button>
            </div>
          </div>
        </div>
        <p class="office-detail">📍 ${office.location}</p>
        <hr class="office-divider" />
        <p class="office-clerks">${office.clerk_count} clerk${office.clerk_count == 1 ? '' : 's'} assigned</p>
      </div>
    `).join('')

    attachActionDropdowns()
  }

  // ── Load and render routes ──
  async function loadRoutes() {
    try {
      const token    = sessionStorage.getItem('token')
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/routes', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      if (response.ok) {
        _routesData = await response.json()
        renderRoutes(_routesData)
      }
    } catch (error) {
      console.error('Load routes error:', error)
    }
  }

  function renderRoutes(data) {
    const tbody   = document.getElementById('routesTableBody')
    const countEl = document.getElementById('routeCount')
    if (!tbody) return

    if (data.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px;">
          No routes yet. Click "+ Add Route" to add your first route.
        </td></tr>`
      if (countEl) countEl.textContent = '0 routes configured'
      return
    }

    tbody.innerHTML = data.map((route, index) => `
      <tr>
        <td>${route.origin_name} → ${route.destination_name}</td>
        <td style="color:var(--muted)">${route.distance_km || '—'} km</td>
        <td>KES ${Number(route.base_price || 0).toLocaleString()}</td>
        <td>KES ${route.price_per_kg || '—'}</td>
        <td><span class="badge badge-active">active</span></td>
        <td>
          <div class="actions-wrapper" data-index="${index}">
            <button class="btn-actions">···</button>
            <div class="actions-dropdown">
              <button onclick="editRoute(${index})">✏️ Edit</button>
              <button class="danger" onclick="deactivateRoute(${index})">🗑️ Delete</button>
            </div>
          </div>
        </td>
      </tr>
    `).join('')

    if (countEl) countEl.textContent = `${data.length} active routes configured`
    attachActionDropdowns()
  }

  // ── Tab switching: Offices / Routes ──
  const tabOffices   = document.getElementById('tabOffices')
  const tabRoutes    = document.getElementById('tabRoutes')
  const panelOffices = document.getElementById('panelOffices')
  const panelRoutes  = document.getElementById('panelRoutes')

  if (tabOffices) {
    tabOffices.addEventListener('click', function () {
      panelOffices.style.display = 'block'
      panelRoutes.style.display  = 'none'
      tabOffices.classList.add('tab-active')
      tabRoutes.classList.remove('tab-active')
    })
  }

  if (tabRoutes) {
    tabRoutes.addEventListener('click', function () {
      panelOffices.style.display = 'none'
      panelRoutes.style.display  = 'block'
      tabRoutes.classList.add('tab-active')
      tabOffices.classList.remove('tab-active')
      loadRoutes()  // load routes fresh when tab is clicked
    })
  }

  // ── ADD OFFICE MODAL ──
  const officeModal     = document.getElementById('addOfficeModal')
  const openOfficeBtn   = document.getElementById('openAddOfficeModal')
  const closeOfficeBtn  = document.getElementById('closeAddOfficeModal')
  const cancelOfficeBtn = document.getElementById('cancelAddOffice')

  function closeOfficeModal() {
    if (officeModal) officeModal.classList.add('modal-hidden')
    const n = document.getElementById('officeName')
    const a = document.getElementById('officeAddress')
    if (n) n.value = ''
    if (a) a.value = ''
  }

  if (openOfficeBtn)   openOfficeBtn.addEventListener('click',   () => officeModal.classList.remove('modal-hidden'))
  if (closeOfficeBtn)  closeOfficeBtn.addEventListener('click',  closeOfficeModal)
  if (cancelOfficeBtn) cancelOfficeBtn.addEventListener('click', closeOfficeModal)
  if (officeModal)     officeModal.addEventListener('click', e => { if (e.target === officeModal) closeOfficeModal() })

  const submitOfficeBtn = document.getElementById('submitAddOffice')
  if (submitOfficeBtn) {
    submitOfficeBtn.addEventListener('click', async function () {
      const nameInput    = document.getElementById('officeName')
      const addressInput = document.getElementById('officeAddress')

      const nameOk    = validateRequired(nameInput,    document.getElementById('officeName-error'),    'Office name is required.')
      const addressOk = validateRequired(addressInput, document.getElementById('officeAddress-error'), 'Location is required.')

      if (!nameOk || !addressOk) return

      try {
        const token = sessionStorage.getItem('token')

        const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/offices', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            office_name: nameInput.value.trim(),
            location:    addressInput.value.trim()
          })
        })

        const data = await response.json()

        if (response.ok) {
          await loadOffices()
          closeOfficeModal()
        } else {
          document.getElementById('officeName-error').textContent = data.message || 'Failed to create office.'
        }

      } catch (error) {
        console.error('Create office error:', error)
      }
    })
  }

  // ── ADD ROUTE MODAL ──
  const routeModal     = document.getElementById('addRouteModal')
  const openRouteBtn   = document.getElementById('openAddRouteModal')
  const closeRouteBtn  = document.getElementById('closeAddRouteModal')
  const cancelRouteBtn = document.getElementById('cancelAddRoute')

  function closeRouteModal() {
    if (routeModal) routeModal.classList.add('modal-hidden')
  }

  // Load real offices into both route origin and destination dropdowns
  async function loadOfficesIntoRouteModal() {
    try {
      const token    = sessionStorage.getItem('token')
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/offices', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      const offices = await response.json()
      const options = '<option value="">Select</option>' +
        offices.map(o => `<option value="${o.office_id}">${o.office_name}</option>`).join('')

      const originSel = document.getElementById('routeOrigin')
      const destSel   = document.getElementById('routeDestination')
      if (originSel) originSel.innerHTML = options
      if (destSel)   destSel.innerHTML   = options
    } catch (error) {
      console.error('Load offices for route modal error:', error)
    }
  }

  if (openRouteBtn) {
    openRouteBtn.addEventListener('click', function () {
      routeModal.classList.remove('modal-hidden')
      loadOfficesIntoRouteModal()
    })
  }
  if (closeRouteBtn)  closeRouteBtn.addEventListener('click',  closeRouteModal)
  if (cancelRouteBtn) cancelRouteBtn.addEventListener('click', closeRouteModal)
  if (routeModal)     routeModal.addEventListener('click', e => { if (e.target === routeModal) closeRouteModal() })

  const submitRouteBtn = document.getElementById('submitAddRoute')
  if (submitRouteBtn) {
    submitRouteBtn.addEventListener('click', async function () {
      const origin      = document.getElementById('routeOrigin')
      const destination = document.getElementById('routeDestination')
      const distance    = document.getElementById('routeDistance')
      const basePrice   = document.getElementById('routeBasePrice')
      const perKg       = document.getElementById('routePerKg')

      const originOk  = validateSelect(origin,      document.getElementById('routeOrigin-error'),      'Select an origin.')
      const destOk    = validateSelect(destination, document.getElementById('routeDestination-error'), 'Select a destination.')
      const distOk    = validateRequired(distance,  document.getElementById('routeDistance-error'),    'Distance is required.')
      const priceOk   = validateRequired(basePrice, document.getElementById('routeBasePrice-error'),   'Base price is required.')
      const kgOk      = validateRequired(perKg,     document.getElementById('routePerKg-error'),       'Price per kg is required.')

      if (!originOk || !destOk || !distOk || !priceOk || !kgOk) return

      try {
        const token = sessionStorage.getItem('token')

        const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/routes', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            origin_office_id:      parseInt(origin.value),
            destination_office_id: parseInt(destination.value),
            distance_km:           parseFloat(distance.value),
            base_price:            parseFloat(basePrice.value),
            price_per_kg:          parseFloat(perKg.value)
          })
        })

        const data = await response.json()

        if (response.ok) {
          // Switch to routes tab and reload
          if (panelOffices) panelOffices.style.display = 'none'
          if (panelRoutes)  panelRoutes.style.display  = 'block'
          if (tabRoutes)    tabRoutes.classList.add('tab-active')
          if (tabOffices)   tabOffices.classList.remove('tab-active')
          await loadRoutes()
          closeRouteModal()
        } else {
          document.getElementById('routeOrigin-error').textContent = data.message || 'Failed to create route.'
        }

      } catch (error) {
        console.error('Create route error:', error)
      }
    })
  }

  // Load offices on page start
  loadOffices()

  // ── EDIT OFFICE MODAL ──
  const editOfficeModal    = document.getElementById('editOfficeModal')
  const closeEditOfficeBtn = document.getElementById('closeEditOfficeModal')
  const cancelEditOfficeBtn= document.getElementById('cancelEditOffice')

  function closeEditOfficeModal() {
    if (editOfficeModal) editOfficeModal.classList.add('modal-hidden')
  }

  if (closeEditOfficeBtn)  closeEditOfficeBtn.addEventListener('click',  closeEditOfficeModal)
  if (cancelEditOfficeBtn) cancelEditOfficeBtn.addEventListener('click', closeEditOfficeModal)
  if (editOfficeModal)     editOfficeModal.addEventListener('click', e => { if (e.target === editOfficeModal) closeEditOfficeModal() })

  const saveEditOfficeBtn = document.getElementById('saveEditOffice')
  if (saveEditOfficeBtn) {
    saveEditOfficeBtn.addEventListener('click', async function () {
      const nameInput     = document.getElementById('editOfficeName')
      const locationInput = document.getElementById('editOfficeLocation')
      const officeId      = document.getElementById('editOfficeId').value

      const nameOk     = validateRequired(nameInput,     document.getElementById('editOfficeName-error'),     'Office name is required.')
      const locationOk = validateRequired(locationInput, document.getElementById('editOfficeLocation-error'), 'Location is required.')

      if (!nameOk || !locationOk) return

      try {
        const token = sessionStorage.getItem('token')
        const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/admin/offices/${officeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            office_name: nameInput.value.trim(),
            location:    locationInput.value.trim()
          })
        })

        const data = await response.json()
        if (response.ok) {
          closeEditOfficeModal()
          await loadOffices()
        } else {
          document.getElementById('editOfficeName-error').textContent = data.message || 'Update failed.'
        }
      } catch (error) {
        console.error('Edit office error:', error)
      }
    })
  }

  // ── DELETE OFFICE ──
  async function deleteOfficeFromBackend(officeId, officeName) {
    try {
      const token = sessionStorage.getItem('token')
      const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/admin/offices/${officeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      })

      const data = await response.json()
      if (response.ok) {
        alert(officeName + ' has been deleted.')
        await loadOffices()
      } else {
        alert('Could not delete: ' + (data.message || 'Server error'))
      }
    } catch (error) {
      console.error('Delete office error:', error)
      alert('Could not connect to server.')
    }
  }

  // ── EDIT ROUTE MODAL ──
  const editRouteModal    = document.getElementById('editRouteModal')
  const closeEditRouteBtn = document.getElementById('closeEditRouteModal')
  const cancelEditRouteBtn= document.getElementById('cancelEditRoute')

  function closeEditRouteModal() {
    if (editRouteModal) editRouteModal.classList.add('modal-hidden')
  }

  // Loads real offices into the edit-route modal selects
  async function loadOfficesIntoEditRouteModal() {
    try {
      const token    = sessionStorage.getItem('token')
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/offices', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      const offices = await response.json()
      const options = '<option value="">Select</option>' +
        offices.map(o => `<option value="${o.office_id}">${o.office_name}</option>`).join('')

      const originSel = document.getElementById('editRouteOrigin')
      const destSel   = document.getElementById('editRouteDestination')
      if (originSel) originSel.innerHTML = options
      if (destSel)   destSel.innerHTML   = options
    } catch (error) {
      console.error('Load offices for edit route modal error:', error)
    }
  }

  if (closeEditRouteBtn)  closeEditRouteBtn.addEventListener('click',  closeEditRouteModal)
  if (cancelEditRouteBtn) cancelEditRouteBtn.addEventListener('click', closeEditRouteModal)
  if (editRouteModal)     editRouteModal.addEventListener('click', e => { if (e.target === editRouteModal) closeEditRouteModal() })

  const saveEditRouteBtn = document.getElementById('saveEditRoute')
  if (saveEditRouteBtn) {
    saveEditRouteBtn.addEventListener('click', async function () {
      const origin      = document.getElementById('editRouteOrigin')
      const destination = document.getElementById('editRouteDestination')
      const distance    = document.getElementById('editRouteDistance')
      const basePrice   = document.getElementById('editRouteBasePrice')
      const perKg       = document.getElementById('editRoutePerKg')
      const routeId     = document.getElementById('editRouteId').value

      const originOk  = validateSelect(origin,      document.getElementById('editRouteOrigin-error'),      'Select an origin.')
      const destOk    = validateSelect(destination, document.getElementById('editRouteDestination-error'), 'Select a destination.')
      const distOk    = validateRequired(distance,  document.getElementById('editRouteDistance-error'),    'Distance is required.')
      const priceOk   = validateRequired(basePrice, document.getElementById('editRouteBasePrice-error'),   'Base price is required.')
      const kgOk      = validateRequired(perKg,     document.getElementById('editRoutePerKg-error'),       'Price per kg is required.')

      if (!originOk || !destOk || !distOk || !priceOk || !kgOk) return

      try {
        const token = sessionStorage.getItem('token')
        const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/admin/routes/${routeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            origin_office_id:      parseInt(origin.value),
            destination_office_id: parseInt(destination.value),
            distance_km:           parseFloat(distance.value),
            base_price:            parseFloat(basePrice.value),
            price_per_kg:          parseFloat(perKg.value)
          })
        })

        const data = await response.json()
        if (response.ok) {
          closeEditRouteModal()
          await loadRoutes()
        } else {
          document.getElementById('editRouteOrigin-error').textContent = data.message || 'Update failed.'
        }
      } catch (error) {
        console.error('Edit route error:', error)
      }
    })
  }

  // ── DELETE ROUTE ──
  async function deleteRouteFromBackend(routeId) {
    try {
      const token = sessionStorage.getItem('token')
      const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/admin/routes/${routeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      })

      if (response.ok) {
        alert('Route deleted.')
        await loadRoutes()
      } else {
        const data = await response.json()
        alert('Could not delete: ' + (data.message || 'Server error'))
      }
    } catch (error) {
      console.error('Delete route error:', error)
      alert('Could not connect to server.')
    }
  }
}


// ============================================================
// SECTION 13: REPORTS (reports.html)
// Filter form that fetches real data from backend and shows manifest table
// ============================================================

const generateBtn = document.getElementById('generateReportBtn')

if (generateBtn) {
  // 1. Load real offices into the filter
  async function loadOfficeFilter() {
    try {
      const token = sessionStorage.getItem('token')
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/offices', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      const offices = await response.json()
      const select = document.getElementById('filterOffice')
      if (select) {
        select.innerHTML = '<option value="">All Offices</option>' +
          offices.map(o => `<option value="${o.office_id}">${o.office_name}</option>`).join('')
      }
    } catch (error) { console.error('Load office filter error:', error) }
  }

  // 2. Load real clerks into the filter
  async function loadClerksForFilter() {
    try {
      const token = sessionStorage.getItem('token')
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/admin/clerks', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      const clerks = await response.json()
      const select = document.getElementById('filterClerk')
      if (select) {
        select.innerHTML = '<option value="">All Clerks</option>' +
          clerks.map(c => `<option value="${c.name}">${c.name}</option>`).join('')
      }
    } catch (error) { console.error('Load clerks filter error:', error) }
  }

  // 3. THE REPAIRED GENERATE FUNCTION
  async function generateReport() {
    const startDate = document.getElementById('filterStartDate').value
    const endDate = document.getElementById('filterEndDate').value

    // Validation
    if (!startDate || !endDate) {
      alert('Please select both a start date and an end date.')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date.')
      return
    }

    try {
      const token = sessionStorage.getItem('token')
      const officeEl = document.getElementById('filterOffice')
      const clerkEl = document.getElementById('filterClerk')
      const office_id = officeEl ? officeEl.value : ''
      const clerkName = clerkEl ? clerkEl.value : ''

      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (office_id) params.append('office_id', office_id)

      const response = await fetch(`https://digital-matatu-courier-project.onrender.com/api/admin/reports?${params.toString()}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })

      if (!response.ok) throw new Error('Report fetch failed')
      const data = await response.json()

      let displayParcels = data.parcels
      if (clerkName) {
        displayParcels = data.parcels.filter(p => p.registered_by === clerkName)
      }

      // Update stats
      const s = data.summary
      document.getElementById('rpt-parcels').textContent = displayParcels.length
      document.getElementById('rpt-revenue').textContent = 'KES ' + Number(s.total_revenue).toLocaleString()
      document.getElementById('rpt-arrived').textContent = displayParcels.filter(p => p.current_status === 'Arrived' || p.current_status === 'Collected').length
      document.getElementById('rpt-clerks').textContent = new Set(displayParcels.map(p => p.registered_by)).size

      // Render table
      const tbody = document.getElementById('manifestTableBody')
      tbody.innerHTML = displayParcels.length === 0 
        ? '<tr><td colspan="8" style="text-align:center;padding:32px;">No records found.</td></tr>'
        : displayParcels.map(row => `
            <tr>
              <td>${row.tracking_number}</td>
              <td>${row.sender_name}</td>
              <td>${row.receiver_name}</td>
              <td>${row.origin_office} → ${row.destination_office}</td>
              <td><span class="badge ${getStatusBadgeClass(row.current_status)}">${row.current_status}</span></td>
              <td>KES ${Number(row.amount_charged).toLocaleString()}</td>
              <td>${row.registered_by}</td>
              <td>${new Date(row.created_at).toLocaleDateString('en-GB')}</td>
            </tr>`).join('')

      document.getElementById('reportResults').style.display = 'block'
    } catch (error) { console.error('Reports error:', error) }
  }

  generateBtn.addEventListener('click', generateReport)

  // 4. Export Handlers
  const exportPdf = document.getElementById('exportPdfBtn')
  const exportXls = document.getElementById('exportExcelBtn')
  const downloadBtn = document.getElementById('downloadManifestBtn')

  if (exportPdf) {
    exportPdf.addEventListener('click', () => {
      if (document.getElementById('reportResults').style.display === 'none') return alert('Generate a report first.')
      window.print()
    })
  }

  if (exportXls) {
    exportXls.addEventListener('click', () => {
      const tbody = document.getElementById('manifestTableBody')
      if (!tbody || tbody.children.length === 0) return alert('Generate a report first.')
      const headers = ['Tracking ID', 'Sender', 'Receiver', 'Route', 'Status', 'Amount', 'Clerk', 'Date']
      const rows = Array.from(tbody.querySelectorAll('tr')).map(tr => 
        Array.from(tr.querySelectorAll('td')).map(td => '"' + td.textContent.trim().replace(/"/g, '""') + '"').join(',')
      )
      const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `report-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    })
  }

  if (downloadBtn) downloadBtn.addEventListener('click', () => exportXls && exportXls.click())

  loadOfficeFilter()
  loadClerksForFilter()
}
// ============================================================
// SECTION 14: CHANGE PASSWORD (dashboard-clerk.html)
// ============================================================

const changePasswordBtn = document.getElementById('changePasswordBtn')
if (changePasswordBtn) {
  changePasswordBtn.addEventListener('click', () => {
    document.getElementById('changePasswordModal').classList.remove('modal-hidden')
  })
}

const closeChangePwd  = document.getElementById('closeChangePassword')
const cancelChangePwd = document.getElementById('cancelChangePassword')
if (closeChangePwd)  closeChangePwd.addEventListener('click',  () => document.getElementById('changePasswordModal').classList.add('modal-hidden'))
if (cancelChangePwd) cancelChangePwd.addEventListener('click', () => document.getElementById('changePasswordModal').classList.add('modal-hidden'))

const submitChangePwd = document.getElementById('submitChangePassword')
if (submitChangePwd) {
  submitChangePwd.addEventListener('click', async function () {
    const current = document.getElementById('currentPassword')
    const newPwd  = document.getElementById('newPassword')
    const confirm = document.getElementById('confirmPassword')
    const currErr = document.getElementById('currentPassword-error')
    const newErr  = document.getElementById('newPassword-error')
    const confErr = document.getElementById('confirmPassword-error')

    currErr.textContent = ''
    newErr.textContent  = ''
    confErr.textContent = ''

    let valid = true
    if (!current.value)             { currErr.textContent = 'Current password is required.';        valid = false }
    if (newPwd.value.length < 8)    { newErr.textContent  = 'Must be at least 8 characters.';       valid = false }
    if (newPwd.value !== confirm.value) { confErr.textContent = 'Passwords do not match.';          valid = false }
    if (!valid) return

    try {
      const token    = sessionStorage.getItem('token')
      const response = await fetch('https://digital-matatu-courier-project.onrender.com/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ currentPassword: current.value, newPassword: newPwd.value })
      })
      const data = await response.json()
      if (response.ok) {
        alert('Password changed successfully!')
        document.getElementById('changePasswordModal').classList.add('modal-hidden')
        current.value = ''; newPwd.value = ''; confirm.value = ''
      } else {
        currErr.textContent = data.message || 'Update failed.'
      }
    } catch (error) {
      console.error('Change password error:', error)
    }
  })
}