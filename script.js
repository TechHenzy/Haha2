// Main JavaScript file for CBL Bank Flasher
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the application
  initApp()

  // Common elements across pages
  const menuToggle = document.querySelector(".menu-toggle")
  const navLinks = document.querySelector(".nav-links")
  const togglePasswordBtns = document.querySelectorAll(".toggle-password")
  const logoutBtn = document.getElementById("logout-btn")
  const headerLogoutBtn = document.getElementById("header-logout-btn")
  const userDropdown = document.getElementById("user-dropdown")

  // Page-specific elements
  const registerForm = document.getElementById("register-form")
  const loginForm = document.getElementById("login-form")
  const sidebarToggle = document.getElementById("sidebar-toggle")
  const sidebar = document.querySelector(".sidebar")
  const dashboardMain = document.querySelector(".dashboard-main")
  const viewButtons = document.querySelectorAll(".view-btn")
  const receiptTemplates = document.getElementById("receipt-templates")
  const getAuthCodeBtn = document.getElementById("get-auth-code")
  const authModal = document.getElementById("auth-modal")
  const howToModal = document.getElementById("how-to-modal")
  const howToGetCodeBtn = document.getElementById("how-to-get-code")
  const verifyCodeBtn = document.getElementById("verify-code")
  const closeModalBtns = document.querySelectorAll(".close-modal")
  const previewBtn = document.getElementById("preview-btn")
  const generateBtn = document.getElementById("generate-btn")
  const receiptForm = document.getElementById("receipt-form")
  const successModal = document.getElementById("success-modal")
  const createAnotherBtn = document.getElementById("create-another")
  const viewHistoryBtn = document.getElementById("view-history")
  const profileTabBtns = document.querySelectorAll(".tab-btn")
  const registerErrorEl = document.getElementById("register-error")
  const loginErrorEl = document.getElementById("login-error")

  // Common event listeners
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active")
    })
  }

  if (togglePasswordBtns) {
    togglePasswordBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const passwordInput = this.previousElementSibling
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
        passwordInput.setAttribute("type", type)
        this.classList.toggle("fa-eye")
        this.classList.toggle("fa-eye-slash")
      })
    })
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })
  }

  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })
  }

  if (userDropdown) {
    userDropdown.addEventListener("click", () => {
      const dropdownMenu = userDropdown.querySelector(".dropdown-menu")
      dropdownMenu.classList.toggle("active")
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!userDropdown.contains(e.target)) {
        const dropdownMenu = userDropdown.querySelector(".dropdown-menu")
        if (dropdownMenu && dropdownMenu.classList.contains("active")) {
          dropdownMenu.classList.remove("active")
        }
      }
    })
  }

  // Page-specific event listeners
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()
      handleRegister()
    })
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      handleLogin()
    })
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active")
      if (dashboardMain) {
        dashboardMain.classList.toggle("expanded")
      }
    })
  }

  if (viewButtons) {
    viewButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const view = this.getAttribute("data-view")
        viewButtons.forEach((b) => b.classList.remove("active"))
        this.classList.add("active")

        if (receiptTemplates) {
          if (view === "grid") {
            receiptTemplates.classList.add("grid-view")
            receiptTemplates.classList.remove("list-view")
          } else {
            receiptTemplates.classList.add("list-view")
            receiptTemplates.classList.remove("grid-view")
          }
        }
      })
    })
  }

  if (getAuthCodeBtn) {
    getAuthCodeBtn.addEventListener("click", () => {
      showModal(authModal)
    })
  }

  if (howToGetCodeBtn) {
    howToGetCodeBtn.addEventListener("click", () => {
      hideModal(authModal)
      showModal(howToModal)
    })
  }

  if (verifyCodeBtn) {
    verifyCodeBtn.addEventListener("click", () => {
      verifyAuthCode()
    })
  }

  if (closeModalBtns) {
    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const modal = this.closest(".modal")
        hideModal(modal)
      })
    })
  }

  if (previewBtn) {
    previewBtn.addEventListener("click", () => {
      previewReceipt()
    })
  }

  if (receiptForm) {
    receiptForm.addEventListener("submit", (e) => {
      e.preventDefault()
      generateAndSendReceipt()
    })
  }

  if (createAnotherBtn) {
    createAnotherBtn.addEventListener("click", () => {
      hideModal(successModal)
      window.location.href = "dashboard.html"
    })
  }

  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener("click", () => {
      hideModal(successModal)
      window.location.href = "history.html"
    })
  }

  if (profileTabBtns) {
    profileTabBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const tabId = this.getAttribute("data-tab")

        // Remove active class from all tabs and content
        profileTabBtns.forEach((b) => b.classList.remove("active"))
        document.querySelectorAll(".tab-content").forEach((content) => {
          content.classList.remove("active")
        })

        // Add active class to clicked tab and corresponding content
        this.classList.add("active")
        document.getElementById(`${tabId}-tab`).classList.add("active")
      })
    })
  }

  // Window click event to close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      hideModal(e.target)
    }
  })

  // Initialize the application
  function initApp() {
    const currentUser = getCurrentUser()

    // If we're on a protected page and user is not logged in, redirect to login
    if (isProtectedPage() && !currentUser) {
      window.location.href = "login.html"
      return
    }

    // If user is logged in and we're on dashboard or related pages
    if (currentUser && isProtectedPage()) {
      updateUserInterface(currentUser)

      // If we're on the dashboard page, load receipt templates
      if (window.location.pathname.includes("dashboard.html")) {
        loadReceiptTemplates()
      }

      // If we're on the receipt generator page, load template details
      if (window.location.pathname.includes("receipt-generator.html")) {
        loadTemplateDetails()
      }

      // If we're on the profile page, load profile details
      if (window.location.pathname.includes("profile.html")) {
        loadProfileDetails(currentUser)
      }
    }
  }

  // Check if current page is a protected page (requires login)
  function isProtectedPage() {
    const protectedPages = [
      "dashboard.html",
      "receipt-generator.html",
      "history.html",
      "settings.html",
      "support.html",
      "profile.html",
    ]
    return protectedPages.some((page) => window.location.pathname.includes(page))
  }

  // Get current logged in user from localStorage
  function getCurrentUser() {
    const userJson = localStorage.getItem("currentUser")
    return userJson ? JSON.parse(userJson) : null
  }

  // Update user interface with user data
  function updateUserInterface(user) {
    // Update sidebar user info
    const userNameElements = document.querySelectorAll("#user-name, #header-username, #welcome-name")
    const userEmailElements = document.querySelectorAll("#user-email")

    userNameElements.forEach((el) => {
      if (el) el.textContent = user.fullname
    })

    userEmailElements.forEach((el) => {
      if (el) el.textContent = user.email
    })

    // Update auth status
    const authStatusText = document.getElementById("auth-status-text")
    const authBadge = document.querySelector(".auth-badge")

    if (authStatusText && authBadge) {
      if (user.isAuthenticated) {
        authStatusText.textContent = "Pro User"
        authBadge.classList.remove("unauthorized")
        authBadge.classList.add("authorized")
        authBadge.innerHTML = '<i class="fas fa-check"></i><span>Pro User</span>'
      } else {
        authStatusText.textContent = "Unauthorized"
        authBadge.classList.remove("authorized")
        authBadge.classList.add("unauthorized")
        authBadge.innerHTML = '<i class="fas fa-lock"></i><span>Unauthorized</span>'
      }
    }
  }

  // Load profile details
  function loadProfileDetails(user) {
    // Update profile information
    const profileNameEl = document.getElementById("profile-name")
    const profileEmailEl = document.getElementById("profile-email")
    const profileEmailFieldEl = document.getElementById("profile-email-field")
    const profileFullnameEl = document.getElementById("profile-fullname")
    const profileMemberSinceEl = document.getElementById("profile-member-since")
    const profileTotalReceiptsEl = document.getElementById("profile-total-receipts")
    const profileEmailsSentEl = document.getElementById("profile-emails-sent")
    const profileLastActivityEl = document.getElementById("profile-last-activity")
    const profileStatusEl = document.getElementById("profile-status")
    const currentPlanFreeEl = document.getElementById("current-plan-free")
    const currentPlanProEl = document.getElementById("current-plan-pro")
    const authCodeDisplayEl = document.getElementById("auth-code-display")

    if (profileNameEl) profileNameEl.textContent = user.fullname
    if (profileEmailEl) profileEmailEl.textContent = user.email
    if (profileEmailFieldEl) profileEmailFieldEl.textContent = user.email
    if (profileFullnameEl) profileFullnameEl.textContent = user.fullname

    if (profileMemberSinceEl) {
      const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"
      profileMemberSinceEl.textContent = memberSince
    }

    if (profileTotalReceiptsEl) profileTotalReceiptsEl.textContent = user.receipts ? user.receipts.length : 0
    if (profileEmailsSentEl) profileEmailsSentEl.textContent = user.emailsSent || 0
    if (profileLastActivityEl) profileLastActivityEl.textContent = "Today" // For demo purposes

    if (profileStatusEl) {
      if (user.isAuthenticated) {
        profileStatusEl.innerHTML = `
          <div class="status-badge authorized">
            <i class="fas fa-check"></i>
            <span>Pro User</span>
          </div>
        `
      } else {
        profileStatusEl.innerHTML = `
          <div class="status-badge unauthorized">
            <i class="fas fa-lock"></i>
            <span>Unauthorized</span>
          </div>
        `
      }
    }

    // Update subscription information
    if (currentPlanFreeEl && currentPlanProEl) {
      if (user.isAuthenticated) {
        currentPlanFreeEl.classList.add("hidden")
        currentPlanProEl.classList.remove("hidden")
        if (authCodeDisplayEl) authCodeDisplayEl.textContent = user.authCode || "********"
      } else {
        currentPlanFreeEl.classList.remove("hidden")
        currentPlanProEl.classList.add("hidden")
      }
    }
  }

  // Handle user registration
  function handleRegister() {
    const fullname = document.getElementById("fullname").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirm-password").value
    const registerErrorEl = document.getElementById("register-error")

    // Clear previous error messages
    if (registerErrorEl) registerErrorEl.textContent = ""

    // Basic validation
    if (!fullname || !email || !password) {
      if (registerErrorEl) registerErrorEl.textContent = "Please fill in all required fields"
      return
    }

    if (password !== confirmPassword) {
      if (registerErrorEl) registerErrorEl.textContent = "Passwords do not match"
      return
    }

    // Show loading state
    const submitBtn = registerForm.querySelector("button[type='submit']")
    const originalBtnText = submitBtn.textContent
    submitBtn.innerHTML = '<div class="loading-spinner"></div>'
    submitBtn.disabled = true

    // Send data to server
    fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullname,
        email,
        password,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Reset button state
        submitBtn.innerHTML = originalBtnText
        submitBtn.disabled = false

        if (data.error) {
          if (registerErrorEl) registerErrorEl.textContent = data.error
        } else {
          // Save user to localStorage and redirect
          localStorage.setItem("currentUser", JSON.stringify(data.user))
          window.location.href = "dashboard.html"
        }
      })
      .catch((error) => {
        // Reset button state
        submitBtn.innerHTML = originalBtnText
        submitBtn.disabled = false

        console.error("Error:", error)
        if (registerErrorEl) registerErrorEl.textContent = "Registration failed. Please try again."
      })
  }

  // Handle user login
  function handleLogin() {
    const email = document.getElementById("login-email").value
    const password = document.getElementById("login-password").value
    const loginErrorEl = document.getElementById("login-error")

    // Clear previous error messages
    if (loginErrorEl) loginErrorEl.textContent = ""

    // Basic validation
    if (!email || !password) {
      if (loginErrorEl) loginErrorEl.textContent = "Please enter both email and password"
      return
    }

    // Show loading state
    const submitBtn = loginForm.querySelector("button[type='submit']")
    const originalBtnText = submitBtn.textContent
    submitBtn.innerHTML = '<div class="loading-spinner"></div>'
    submitBtn.disabled = true

    // Send data to server
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Reset button state
        submitBtn.innerHTML = originalBtnText
        submitBtn.disabled = false

        if (data.error) {
          if (loginErrorEl) loginErrorEl.textContent = data.error
        } else {
          // Save user to localStorage and redirect
          localStorage.setItem("currentUser", JSON.stringify(data.user))
          window.location.href = "dashboard.html"
        }
      })
      .catch((error) => {
        // Reset button state
        submitBtn.innerHTML = originalBtnText
        submitBtn.disabled = false

        console.error("Error:", error)
        if (loginErrorEl) loginErrorEl.textContent = "Login failed. Please try again."
      })
  }

  // Handle user logout
  function logout() {
    // Clear user data from localStorage
    localStorage.removeItem("currentUser")

    // Redirect to login page
    window.location.href = "login.html"
  }

  // Load receipt templates on dashboard
  function loadReceiptTemplates() {
    const templatesContainer = document.getElementById("receipt-templates")
    if (!templatesContainer) return

    // Show loading state
    templatesContainer.innerHTML =
      '<div style="text-align: center; padding: 50px;"><div class="loading-spinner" style="margin: 0 auto;"></div><p style="margin-top: 20px;">Loading templates...</p></div>'

    // Fetch templates from server
    fetch("/api/templates")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          templatesContainer.innerHTML = `<div style="text-align: center; padding: 50px;"><p style="color: var(--danger-color);">${data.error}</p></div>`
          return
        }

        const templates = data.templates || [
          {
            id: 1,
            name: "PalmPay Receipt",
            description: "Generate a PalmPay receipt with customizable amount and recipient.",
            bank: "PalmPay",
            image: "images/palmpay.png",
            free: true,
          },
          {
            id: 2,
            name: "Westpac Payment",
            description: "Generate a Westpac bank payment receipt with customizable amount and recipient.",
            bank: "Westpac",
            image: "images/westpac.png",
            free: false,
          },
          {
            id: 3,
            name: "Chase Bank Transfer",
            description: "Create a Chase Bank transfer confirmation with detailed transaction information.",
            bank: "Chase",
            image: "images/chase.png",
            free: false,
          },
          {
            id: 4,
            name: "Bank of America Transfer",
            description: "Generate a Bank of America transfer receipt with account details and confirmation number.",
            bank: "Bank of America",
            image: "images/bankofamerica.png",
            free: false,
          },
          {
            id: 5,
            name: "ICICI Bank Payment",
            description: "Create an ICICI Bank payment receipt with IMPS transfer details and reference ID.",
            bank: "ICICI",
            image: "images/icici.png",
            free: false,
          },
          {
            id: 6,
            name: "MoneyGram Transfer",
            description: "Generate a MoneyGram international money transfer receipt with reference number.",
            bank: "MoneyGram",
            image: "images/moneygram.png",
            free: false,
          },
          {
            id: 7,
            name: "PayPal Payment",
            description: "Create a PayPal payment confirmation receipt with transaction details and fees.",
            bank: "PayPal",
            image: "images/paypal.png",
            free: false,
          },
          {
            id: 8,
            name: "Zelle Transfer",
            description: "Generate a Zelle money transfer receipt with recipient details.",
            bank: "Zelle",
            image: "images/zelle.png",
            free: false,
          },
          {
            id: 9,
            name: "Cash App Payment",
            description: "Create a Cash App payment receipt with transaction details.",
            bank: "Cash App",
            image: "images/cashapp.png",
            free: false,
          },
          {
            id: 10,
            name: "UBA Bank Transfer",
            description: "Generate a UBA Bank transfer receipt with account details and transaction ID.",
            bank: "UBA",
            image: "images/uba.png",
            free: false,
          },
        ]

        // Get current user to check authentication status
        const currentUser = getCurrentUser()
        const isAuthenticated = currentUser && currentUser.isAuthenticated

        // Clear container
        templatesContainer.innerHTML = ""

        // Create template cards
        templates.forEach((template) => {
          // Check if template is locked
          const isLocked = !template.free && !isAuthenticated

          const templateCard = document.createElement("div")
          templateCard.className = "template-card"
          templateCard.innerHTML = `
            <div class="template-image">
              <img src="${template.image}" alt="${template.name}" onerror="this.src='https://via.placeholder.com/300x180?text=${template.bank}'">
              <div class="template-bank">${template.bank}</div>
              ${isLocked ? '<div class="template-lock"><i class="fas fa-lock"></i></div>' : ""}
            </div>
            <div class="template-content">
              <h3>${template.name}</h3>
              <p>${template.description}</p>
              <div class="template-actions">
                <a href="${isLocked ? "#" : "receipt-generator.html?template=" + template.id}" class="btn-use-template ${isLocked ? "disabled" : ""}" ${isLocked ? "onclick=\"event.preventDefault(); alert('Please authenticate to use this template.');\"" : ""}>
                  ${isLocked ? "Locked" : "Use Template"}
                </a>
                <button class="btn-preview" onclick="previewTemplateModal(${template.id})">Preview</button>
              </div>
            </div>
          `

          templatesContainer.appendChild(templateCard)
        })

        // Add CSS for locked templates
        const style = document.createElement("style")
        style.textContent = `
          .template-lock {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .template-lock i {
            font-size: 40px;
            color: white;
          }
          .btn-use-template.disabled {
            background-color: var(--gray-color);
            cursor: not-allowed;
          }
          .hidden {
            display: none;
          }
        `
        document.head.appendChild(style)

        // Update stats
        updateDashboardStats(currentUser)
      })
      .catch((error) => {
        console.error("Error:", error)
        templatesContainer.innerHTML = `<div style="text-align: center; padding: 50px;"><p style="color: var(--danger-color);">Failed to load templates. Please try again.</p></div>`
      })
  }

  // Update dashboard statistics
  function updateDashboardStats(user) {
    const totalReceiptsEl = document.getElementById("total-receipts")
    const emailsSentEl = document.getElementById("emails-sent")
    const memberSinceEl = document.getElementById("member-since")

    if (totalReceiptsEl) {
      totalReceiptsEl.textContent = user.receipts ? user.receipts.length : 0
    }

    if (emailsSentEl) {
      emailsSentEl.textContent = user.emailsSent || 0
    }

    if (memberSinceEl && user.createdAt) {
      const date = new Date(user.createdAt)
      memberSinceEl.textContent = date.toLocaleDateString()
    }
  }

  // Load template details on receipt generator page
  function loadTemplateDetails() {
    // Get template ID from URL
    const urlParams = new URLSearchParams(window.location.search)
    const templateId = urlParams.get("template")

    if (!templateId) {
      window.location.href = "dashboard.html"
      return
    }

    // Show loading state
    const formHeader = document.querySelector(".form-header")
    if (formHeader) {
      formHeader.innerHTML =
        '<div style="text-align: center; padding: 20px;"><div class="loading-spinner" style="margin: 0 auto;"></div><p style="margin-top: 20px;">Loading template...</p></div>'
    }

    // Fetch template details from server
    fetch(`/api/templates?id=${templateId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          if (formHeader) {
            formHeader.innerHTML = `<div style="text-align: center; padding: 20px;"><p style="color: var(--danger-color);">${data.error}</p></div>`
          }
          return
        }

        const template = data.template || {
          id: templateId,
          name: "Receipt Template",
          bank: "Bank",
          free: true,
        }

        // Check if user is authenticated for non-free templates
        const currentUser = getCurrentUser()
        const isAuthenticated = currentUser && currentUser.isAuthenticated

        if (!template.free && !isAuthenticated) {
          alert("You need to authenticate to use this template.")
          window.location.href = "dashboard.html"
          return
        }

        // Update page with template details
        const templateNameEl = document.getElementById("receipt-template-name")
        const templateIdInput = document.getElementById("template-id")

        if (templateNameEl) {
          templateNameEl.textContent = template.name
        }

        if (templateIdInput) {
          templateIdInput.value = template.id
        }

        // Restore form header
        if (formHeader) {
          formHeader.innerHTML = `
            <h2>Customize Your ${template.bank} Receipt</h2>
            <p>Fill in the details below to generate your receipt</p>
          `
        }

        // Set default date to today
        const dateInput = document.getElementById("date")
        if (dateInput) {
          const today = new Date().toISOString().split("T")[0]
          dateInput.value = today
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        if (formHeader) {
          formHeader.innerHTML = `<div style="text-align: center; padding: 20px;"><p style="color: var(--danger-color);">Failed to load template. Please try again.</p></div>`
        }
      })
  }

  // Show a modal
  function showModal(modal) {
    if (modal) {
      modal.classList.add("active")
    }
  }

  // Hide a modal
  function hideModal(modal) {
    if (modal) {
      modal.classList.remove("active")
    }
  }

  // Verify authentication code
  function verifyAuthCode() {
    const codeInput = document.getElementById("auth-code")
    if (!codeInput || !codeInput.value.trim()) {
      alert("Please enter an authentication code")
      return
    }

    const code = codeInput.value.trim()
    const currentUser = getCurrentUser()

    if (!currentUser) {
      alert("You need to be logged in to verify an authentication code.")
      return
    }

    // Show loading state
    const verifyBtn = document.getElementById("verify-code")
    const originalBtnText = verifyBtn.textContent
    verifyBtn.innerHTML = '<div class="loading-spinner"></div>'
    verifyBtn.disabled = true

    // Send verification request to server
    fetch("/api/verify-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        userId: currentUser.id,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Reset button state
        verifyBtn.innerHTML = originalBtnText
        verifyBtn.disabled = false

        if (data.error) {
          alert(data.error)
          return
        }

        // Update user authentication status
        localStorage.setItem("currentUser", JSON.stringify(data.user))

        // Update UI
        updateUserInterface(data.user)

        // Hide modal
        hideModal(authModal)

        // Reload templates
        loadReceiptTemplates()

        // Show success message
        alert("Authentication successful! You now have access to all templates.")
      })
      .catch((error) => {
        // Reset button state
        verifyBtn.innerHTML = originalBtnText
        verifyBtn.disabled = false

        console.error("Error:", error)
        alert("Failed to verify authentication code. Please try again.")
      })
  }

  // Preview receipt
  function previewReceipt() {
    const form = document.getElementById("receipt-form")
    const previewContainer = document.getElementById("preview-container")

    if (!form || !previewContainer) return

    // Get form data
    const templateId = form.elements["template-id"].value
    const receiverName = form.elements["receiver-name"].value
    const receiverAccount = form.elements["receiver-account"].value
    const amount = form.elements["amount"].value
    const date = form.elements["date"].value
    const time = form.elements["time"].value
    const reference = form.elements["reference"].value || generateRandomReference()
    const notes = form.elements["notes"].value
    const buttonText = form.elements["button-text"].value
    const buttonLink = form.elements["button-link"].value
    const status = form.elements["status"].value

    // Basic validation
    if (!receiverName || !amount) {
      alert("Please fill in at least the receiver name and amount")
      return
    }

    // Generate receipt HTML based on template
    let receiptHtml = ""

    // Different HTML for different templates
    switch (Number.parseInt(templateId)) {
      case 1: // PalmPay - Updated to match the screenshot exactly
        receiptHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="padding: 15px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0;">
              <div style="font-size: 24px; color: #333;">
                <i class="fas fa-arrow-left"></i>
              </div>
              <div style="font-size: 18px; font-weight: 600; color: #333;">Transaction Details</div>
              <div style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #333;">
                <i class="fas fa-question"></i>
              </div>
            </div>
            
            <!-- Bank Logo -->
            <div style="display: flex; justify-content: center; padding: 20px 0;">
              <div style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background-color: #fff; border: 1px solid #eee;">
                <img src="images/uba.png" alt="UBA Logo" style="width: 80%; height: 80%; object-fit: contain;" onerror="this.src='https://via.placeholder.com/60x60?text=UBA'">
              </div>
            </div>
            
            <!-- Recipient -->
            <div style="text-align: center; padding: 0 20px;">
              <div style="font-size: 16px; color: #666; margin-bottom: 5px;">To</div>
              <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 15px;">${receiverName.toUpperCase()}</div>
            </div>
            
            <!-- Amount -->
            <div style="text-align: center; padding: 0 20px 15px;">
              <div style="font-size: 36px; font-weight: 700; color: #333; margin-bottom: 10px;">₦ ${Number.parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              
              <!-- Status -->
              <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 15px;">
                <div style="width: 24px; height: 24px; background-color: #4caf50; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">✓</div>
                <div style="font-size: 16px; color: #4caf50; font-weight: 500;">Successful</div>
              </div>
              
              <!-- Safeguard -->
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; background-color: #f8f9fa; padding: 12px; margin: 0 20px 15px; border-radius: 8px;">
                <div style="width: 24px; height: 24px; background-color: #6c5ce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                  <i class="fas fa-shield-alt"></i>
                </div>
                <div style="font-size: 14px; color: #333;">Fast Transfer Safeguard</div>
                <div style="font-size: 14px; color: #6c5ce7; font-weight: 500; margin-left: 5px;">Completed</div>
                <div style="color: #6c5ce7; margin-left: auto;">
                  <i class="fas fa-chevron-right"></i>
                </div>
              </div>
            </div>
            
            <!-- Transfer Details -->
            <div style="padding: 0 20px;">
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="font-size: 16px; color: #666;">Transfer Amount</div>
                <div style="font-size: 16px; color: #333; font-weight: 500;">₦ ${Number.parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="font-size: 16px; color: #666;">Fee</div>
                <div style="font-size: 16px; color: #333; font-weight: 500;">₦ 0.00 <span style="text-decoration: line-through; color: #999; margin-left: 5px;">₦ 10.00</span></div>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="font-size: 16px; color: #666;">Payment Amount</div>
                <div style="font-size: 16px; color: #333; font-weight: 500;">₦ ${Number.parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
            
            <!-- Recipient Details -->
            <div style="padding: 15px 20px; background-color: #f8f9fa; border-top: 1px solid #f0f0f0;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <div style="font-size: 16px; color: #666;">Recipient</div>
                <div style="font-size: 16px; color: #333; font-weight: 500; text-align: right;">${receiverName.toUpperCase()}</div>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <div style="font-size: 16px; color: #666;"></div>
                <div style="font-size: 16px; color: #333; font-weight: 500; text-align: right;">United Bank For Africa | ${receiverAccount}</div>
              </div>
            </div>
            
            <!-- Session ID -->
            <div style="padding: 15px 20px; background-color: #f8f9fa; border-top: 1px solid #f0f0f0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="font-size: 16px; color: #666;">Session ID</div>
                <div style="font-size: 16px; color: #333; font-weight: 500; display: flex; align-items: center; gap: 5px;">
                  10003325050714272302006299558
                  <i class="fas fa-copy" style="color: #999; cursor: pointer;"></i>
                </div>
              </div>
              
              <div style="font-size: 14px; color: #666; line-height: 1.5; margin-bottom: 10px;">
                If the recipient account is not credited within 5 minutes, please use the Session ID to 
                <span style="color: #6c5ce7; font-weight: 500;">contact the recipient bank.<i class="fas fa-phone" style="color: #6c5ce7; margin-left: 5px;"></i></span>
              </div>
            </div>
            
            <!-- Transaction Details -->
            <div style="padding: 15px 20px; background-color: #f8f9fa; border-top: 1px solid #f0f0f0;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <div style="font-size: 16px; color: #666;">Completion Time</div>
                <div style="font-size: 16px; color: #333; font-weight: 500; text-align: right;">May 07, 2025 3:27:24 PM</div>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <div style="font-size: 16px; color: #666;">Transaction ID</div>
                <div style="font-size: 16px; color: #333; font-weight: 500; text-align: right; display: flex; align-items: center; gap: 5px;">
                  ${reference}
                  <i class="fas fa-copy" style="color: #999; cursor: pointer;"></i>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <div style="font-size: 16px; color: #666;">Application</div>
                <div style="font-size: 16px; color: #333; font-weight: 500; text-align: right;">PalmPay</div>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <div style="font-size: 16px; color: #666;">Payment Type</div>
                <div style="font-size: 16px; color: #333; font-weight: 500; text-align: right;">Money Transfer - Bank account</div>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <div style="font-size: 16px; color: #666;">Payment Method</div>
                <div style="font-size: 16px; color: #333; font-weight: 500; text-align: right;">CashBox</div>
              </div>
            </div>
            
            ${
              buttonText && buttonLink
                ? `
                <div style="padding: 15px 20px; text-align: center; border-top: 1px solid #f0f0f0;">
                  <a href="${buttonLink}" style="display: inline-block; background-color: #6c5ce7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; width: 100%; text-align: center;">
                    ${buttonText}
                  </a>
                </div>
                `
                : ""
            }

            <!-- Action Buttons -->
            <div style="display: flex; justify-content: space-around; padding: 20px; border-top: 1px solid #f0f0f0;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; color: #6c5ce7;">
                <i class="far fa-file-alt" style="font-size: 24px;"></i>
                <span style="font-size: 14px;">View Receipt</span>
              </div>
              
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; color: #6c5ce7;">
                <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                <span style="font-size: 14px;">Report a Dispute</span>
              </div>
            </div>
            
            <!-- Bottom Navigation -->
            <div style="display: flex; justify-content: space-around; padding: 15px 0; background-color: #f8f9fa; border-top: 1px solid #f0f0f0;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 5px; color: #999;">
                <i class="fas fa-bars" style="font-size: 20px;"></i>
                <span style="font-size: 12px;">Menu</span>
              </div>
              
              <div style="display: flex; flex-direction: column; align-items: center; gap: 5px; color: #333;">
                <i class="fas fa-circle" style="font-size: 20px;"></i>
                <span style="font-size: 12px;">Home</span>
              </div>
              
              <div style="display: flex; flex-direction: column; align-items: center; gap: 5px; color: #999;">
                <i class="fas fa-history" style="font-size: 20px;"></i>
                <span style="font-size: 12px;">History</span>
              </div>
            </div>
          </div>
        `
        break

      case 2: // Westpac
        receiptHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <div style="padding: 20px; text-align: center;">
              <img src="images/westpac.png" alt="Westpac Logo" style="max-width: 150px;" onerror="this.src='https://via.placeholder.com/150x50?text=Westpac'">
            </div>
            <div style="padding: 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: ${status === "successful" ? "#4CAF50" : status === "pending" ? "#FFC107" : "#F44336"}; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 40px;">${status === "successful" ? "✓" : status === "pending" ? "!" : "✕"}</span>
              </div>
              <h2 style="margin-top: 20px; color: #333;">Sent</h2>
              <p style="font-size: 24px; margin: 10px 0; color: #333;">We've sent $${Number.parseFloat(amount).toFixed(2)} to ${receiverName}</p>
              <p style="color: #666; margin-bottom: 30px;">They should have this Osko payment within a minute!</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px;">
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">Payment details</span>
                <span style="color: #333; font-weight: bold;">${reference}</span>
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">Date</span>
                <span style="color: #333;">${date}</span>
              </p>
              ${
                receiverAccount
                  ? `
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">Account</span>
                <span style="color: #333;">${receiverAccount}</span>
              </p>`
                  : ""
              }
            </div>
          </div>
        `
        break

      case 3: // Chase
        receiptHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #2c3e50; padding: 20px; text-align: center; color: white;">
              <h2>Payment ${status === "successful" ? "Completed" : status === "pending" ? "Scheduled" : "Rejected"}</h2>
            </div>
            <div style="background-color: #fff; padding: 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #fff; border: 3px solid ${status === "successful" ? "#4CAF50" : status === "pending" ? "#FFC107" : "#F44336"}; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="color: ${status === "successful" ? "#4CAF50" : status === "pending" ? "#FFC107" : "#F44336"}; font-size: 40px;">${status === "successful" ? "✓" : status === "pending" ? "!" : "✕"}</span>
              </div>
              <h2 style="margin-top: 20px; color: #333;">Thank you for your payment</h2>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px;">
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">Confirmation number:</span>
                <span style="color: #333; font-weight: bold;">${reference}</span>
              </p>
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">Payment amount:</span>
                <span style="color: #333; font-weight: bold;">$${Number.parseFloat(amount).toFixed(2)}</span>
              </p>
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">Payment date:</span>
                <span style="color: #333;">${date}</span>
              </p>
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">From account:</span>
                <span style="color: #333;">JPMORGAN CHASE BANK, NA (...0248)</span>
              </p>
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">To account:</span>
                <span style="color: #333;">${receiverName} (${receiverAccount ? "..." + receiverAccount.slice(-4) : "...8668"})</span>
              </p>
            </div>
          </div>
        `
        break

      case 4: // Bank of America
        receiptHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #012169; padding: 20px; text-align: center; color: white;">
              <h2>Transfer Details</h2>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #fff; border: 3px solid #4CAF50; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="color: #4CAF50; font-size: 40px;">✓</span>
              </div>
              <h2 style="margin-top: 20px; color: #333;">Your transfer is confirmed</h2>
            </div>
            <div style="padding: 20px;">
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666;">From</p>
                <p style="margin: 0; font-weight: bold;">Advantage Savings - 3740</p>
                <p style="margin: 0; color: #666;">Available balance $1,076.45</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666;">To</p>
                <p style="margin: 0; font-weight: bold;">BankAmericard Platinum Plus Mastercard - 5271</p>
                <p style="margin: 0; color: #666;">Current balance $220.90</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666;">Amount</p>
                <p style="margin: 0; font-weight: bold;">$${Number.parseFloat(amount).toFixed(2)}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666;">Date</p>
                <p style="margin: 0; font-weight: bold;">${new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666;">Confirmation #</p>
                <p style="margin: 0; font-weight: bold;">${reference}</p>
              </div>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9; font-size: 12px; color: #666;">
              <p>Please make sure there are sufficient funds in the account from which you are transferring money in order to avoid a possible fee. For details, refer to your account agreement and applicable fee schedule.</p>
            </div>
          </div>
        `
        break

      case 5: // ICICI
        receiptHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <div style="padding: 20px; text-align: center; border-bottom: 1px solid #eee;">
              <img src="images/icici.png" alt="ICICI Bank Logo" style="max-width: 150px;" onerror="this.src='https://via.placeholder.com/150x50?text=ICICI'">
            </div>
            <div style="padding: 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #fff; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="color: #4CAF50; font-size: 40px;">✓</span>
              </div>
              <h2 style="margin-top: 20px; color: #333;">Transfer Successful</h2>
            </div>
            <div style="padding: 0 20px 20px;">
              <div style="border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px;">
                <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span style="color: #666;">Reference ID</span>
                  <span style="color: #333; font-weight: bold;">xxxxxxxxxx</span>
                </p>
                <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span style="color: #666;">Mode</span>
                  <span style="color: #333; font-weight: bold;">IMPS</span>
                </p>
              </div>
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">Paid To</span>
              </p>
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">Account number</span>
                <span style="color: #333; font-weight: bold;">${receiverAccount || "xxxxxxxxxx"}</span>
              </p>
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">Amount</span>
                <span style="color: #333; font-weight: bold;">$${Number.parseFloat(amount).toFixed(3)}</span>
              </p>
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">On</span>
                <span style="color: #333; font-weight: bold;">${date}</span>
              </p>
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">From Account</span>
                <span style="color: #333; font-weight: bold;">xxxxxxxxxx64</span>
              </p>
              <p style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span style="color: #666;">Remarks</span>
                <span style="color: #333; font-weight: bold;">NA...</span>
              </p>
            </div>
            <div style="padding: 20px; background-color: #f9f9fa; text-align: center; border-top: 1px dashed #ccc;">
              <p style="margin: 0; color: #666;">Tip: want to share the successfully Payment with benefits..</p>
              <p style="margin: 0; color: #666;">Use the icon right..</p>
              <div style="background-color: #f5f5dc; padding: 10px; margin-top: 10px; border-radius: 5px; display: inline-block;">
                <span style="font-weight: bold; color: #333;">DONE. ✓</span>
              </div>
            </div>
          </div>
        `
        break

      case 6: // MoneyGram
        receiptHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <div style="padding: 20px; text-align: center; background-color: #f5f5f5;">
              <div style="width: 60px; height: 60px; background-color: #ccc; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold;">
                EG
              </div>
            </div>
            <div style="padding: 20px; text-align: center; border-bottom: 1px solid #eee;">
              <img src="images/moneygram.png" alt="MoneyGram Logo" style="max-width: 200px; margin-bottom: 20px;" onerror="this.src='https://via.placeholder.com/200x50?text=MoneyGram'">
              <h2 style="margin: 20px 0; color: #333; font-size: 24px;">Money from ${receiverName} is on the way!</h2>
            </div>
            <div style="padding: 20px;">
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">REFERENCE NO.</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold;">${reference}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">SENT TO</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold;">${receiverName}, Honduras</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">AMOUNT</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold;">${Number.parseFloat(amount).toFixed(2)} HNL</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">RECEIVE OPTION</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold;">Bank Account •••• ${receiverAccount || "4196"}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">DATE PREPARED</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold;">${new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} EST</p>
              </div>
            </div>
            <div style="padding: 20px; text-align: center;">
              <button style="background-color: #d9534f; color: white; border: none; padding: 15px 30px; border-radius: 30px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%;">
                <span style="margin-right: 10px;">↑</span> Share and Save Receipt
              </button>
            </div>
            <div style="padding: 20px; border-top: 1px solid #eee;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Send Amount</span>
                <span>${Number.parseFloat(amount).toFixed(2)} USD</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Fees</span>
                <span>1.99 USD</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
                <span>Total Cost</span>
                <span>${(Number.parseFloat(amount) + 1.99).toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        `
        break

      case 7: // PayPal
        receiptHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #00A884; color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <div style="padding: 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #00A884; font-size: 40px;">✓</span>
              </div>
              <h2 style="margin: 0 0 20px; font-size: 28px;">You sent $${Number.parseFloat(amount).toFixed(2)} to ${receiverName}</h2>
              <p style="margin: 0; font-size: 16px;">We'll let ${receiverName} know right away that you sent money. You can see the details in your Activity in case you need them later.</p>
            </div>
            <div style="background-color: white; color: #333; padding: 20px;">
              <p style="margin: 0 0 20px; color: #666; font-size: 18px; font-weight: bold;">YOU'RE PAYING</p>
              <div style="border-bottom: 1px solid #eee; margin-bottom: 15px;"></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="font-size: 18px;">Amount</span>
                <span style="font-size: 18px; font-weight: bold;">$${Number.parseFloat(amount).toFixed(2)} USD</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="font-size: 18px;">Fee</span>
                <span style="font-size: 18px; font-weight: bold;">$0.50 USD</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold;">
                <span style="font-size: 18px;">Total</span>
                <span style="font-size: 18px;">$${(Number.parseFloat(amount) + 0.5).toFixed(2)} USD</span>
              </div>
              <div style="border-bottom: 1px solid #eee; margin-bottom: 15px;"></div>
              <p style="margin: 0 0 20px; color: #666; font-size: 18px; font-weight: bold;">DOMINIKA RECEIVES</p>
              <div style="border-bottom: 1px solid #eee; margin-bottom: 15px;"></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="font-size: 18px;">Amount</span>
                <span style="font-size: 18px; font-weight: bold;">$${Number.parseFloat(amount).toFixed(2)} USD</span>
              </div>
            </div>
            <div style="background-color: white; padding: 20px; display: flex; justify-content: space-between;">
              <button style="background-color: white; color: #00A884; border: 1px solid #00A884; padding: 15px 0; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; width: 48%;">
                Done
              </button>
              <button style="background-color: #00A884; color: white; border: none; padding: 15px 0; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; width: 48%;">
                Send More
              </button>
            </div>
          </div>
        `
        break

      case 8: // Zelle
        receiptHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <div style="padding: 20px; text-align: center; color: #666;">
              <h2>Review & Send</h2>
            </div>
            <div style="padding: 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #ccc; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 40px;">
                D
              </div>
              <div style="position: absolute; margin-top: -20px; margin-left: 60px; background-color: #6b31aa; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold;">
                Z
              </div>
            </div>
            <div style="padding: 20px; text-align: center;">
              <h2 style="margin: 0; font-size: 28px; color: #333;">Send $${Number.parseFloat(amount).toFixed(2)}</h2>
              <p style="margin: 20px 0; color: #666; font-size: 18px;">to</p>
              <h3 style="margin: 0; font-size: 24px; color: #333;">${receiverName}</h3>
              <p style="margin: 10px 0; color: #666; font-size: 16px;">${receiverAccount || "(928) 303-3816"}</p>
              <p style="margin: 10px 0; color: #666; font-size: 16px;">Enrolled with Zelle® as DEBRA GERACI</p>
            </div>
            <div style="padding: 20px; text-align: center; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
              <p style="margin: 0; color: #0066cc; font-size: 18px; font-weight: bold;">Rent</p>
            </div>
            <div style="padding: 20px; text-align: left;">
              <p style="margin: 0 0 20px; color: #333; font-size: 16px;">Make sure you're sending to someone you trust, and their information is correct. Money is typically available in their account in minutes.</p>
              <p style="margin: 0; color: #333; font-size: 16px; font-weight: bold;">Once you've sent money, you can't cancel it.</p>
            </div>
            <div style="padding: 20px; display: flex; justify-content: space-between; border-top: 1px solid #eee;">
              <button style="background-color: white; color: #0066cc; border: none; padding: 15px 0; font-size: 16px; font-weight: bold; cursor: pointer; width: 48%;">
                CANCEL
              </button>
              <button style="background-color: #0a3d7e; color: white; border: none; padding: 15px 0; border-radius: 30px; font-size: 16px; font-weight: bold; cursor: pointer; width: 48%;">
                SEND
              </button>
            </div>
          </div>
        `
        break

      case 9: // Cash App
        receiptHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #1e2124; color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <div style="padding: 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #4CAF50; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 40px;">✓</span>
              </div>
              <h2 style="margin: 0 0 20px; font-size: 28px;">Thank you for your payment</h2>
              <p style="margin: 0; font-size: 36px; font-weight: bold;">$${Number.parseFloat(amount).toFixed(2)}</p>
            </div>
            <div style="background-color: #2a2d30; padding: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="font-size: 18px;">Cashback Bonus® Amount</span>
                <span style="font-size: 18px; font-weight: bold;">$0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="font-size: 18px;">Bank Payment Amount</span>
                <span style="font-size: 18px; font-weight: bold;">$${Number.parseFloat(amount).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="font-size: 18px;">Total Payment Amount</span>
                <span style="font-size: 18px; font-weight: bold;">$${Number.parseFloat(amount).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="font-size: 18px;">Payment Date</span>
                <span style="font-size: 18px;">${new Date(date).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="font-size: 18px;">Payment Source</span>
                <span style="font-size: 18px;">Checking</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="font-size: 18px;">Routing Number</span>
                <span style="font-size: 18px;">011900254</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="font-size: 18px;">Confirmation Number</span>
                <span style="font-size: 18px;">${reference || "D25B-5MM4-QGPQ"}</span>
              </div>
            </div>
          </div>
        `
        break

      case 10: // UBA Bank
        receiptHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #d20a11; padding: 20px; text-align: center; color: white;">
              <img src="images/uba.png" alt="UBA Logo" style="max-width: 100px; margin-bottom: 10px;" onerror="this.src='https://via.placeholder.com/100x50?text=UBA'">
              <h2>Transfer Confirmation</h2>
            </div>
            <div style="padding: 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #f0f0f0; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #d20a11; font-size: 40px;">✓</span>
              </div>
              <h2 style="margin: 0 0 10px; font-size: 24px; color: #333;">Transfer Successful</h2>
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #333;">₦${Number.parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p style="margin: 10px 0 20px; color: #666;">has been sent to ${receiverName}</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px;">
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">RECIPIENT</p>
                <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold;">${receiverName}</p>
                <p style="margin: 5px 0 0; font-size: 14px;">${receiverAccount || "2314431651"}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">AMOUNT</p>
                <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold;">₦${Number.parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">DATE</p>
                <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold;">${new Date(date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">TRANSACTION ID</p>
                <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold;">${reference || "UBATRANS123456789"}</p>
              </div>
            </div>
            <div style="padding: 20px; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 12px;">Thank you for banking with UBA</p>
            </div>
          </div>
        `
        break

      default:
        receiptHtml = `<p>Template not found</p>`
    }

    // Display receipt HTML in preview container
    previewContainer.innerHTML = receiptHtml
  }

  // Generate a random reference number
  function generateRandomReference() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  // Generate and send receipt
  function generateAndSendReceipt() {
    const form = document.getElementById("receipt-form")
    const successModal = document.getElementById("success-modal")
    const successEmailEl = document.getElementById("success-email")

    if (!form || !successModal) return

    // Get form data
    const templateId = form.elements["template-id"].value
    const receiverName = form.elements["receiver-name"].value
    const receiverAccount = form.elements["receiver-account"].value
    const amount = form.elements["amount"].value
    const date = form.elements["date"].value
    const time = form.elements["time"].value
    const reference = form.elements["reference"].value || generateRandomReference()
    const notes = form.elements["notes"].value
    const buttonText = form.elements["button-text"].value
    const buttonLink = form.elements["button-link"].value
    const status = form.elements["status"].value
    const recipientEmail = form.elements["recipient-email"].value
    const currentUser = getCurrentUser()
    const userId = currentUser ? currentUser.id : null

    // Basic validation
    if (!receiverName || !amount || !recipientEmail) {
      alert("Please fill in at least the receiver name, amount, and recipient email")
      return
    }

    // Show loading state
    const submitBtn = form.querySelector("button[type='submit']")
    const originalBtnText = submitBtn.textContent
    submitBtn.innerHTML = '<div class="loading-spinner"></div>'
    submitBtn.disabled = true

    // Update success email display
    if (successEmailEl) {
      successEmailEl.textContent = recipientEmail
    }

    // Send data to server
    fetch("/api/generate-receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateId,
        receiverName,
        receiverAccount,
        amount,
        date,
        time,
        reference,
        notes,
        buttonText,
        buttonLink,
        status,
        recipientEmail,
        userId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Reset button state
        submitBtn.innerHTML = originalBtnText
        submitBtn.disabled = false

        if (data.error) {
          alert(data.error)
          return
        }

        // Show success modal
        showModal(successModal)
      })
      .catch((error) => {
        // Reset button state
        submitBtn.innerHTML = originalBtnText
        submitBtn.disabled = false

        console.error("Error:", error)
        alert("Failed to generate and send receipt. Please try again.")
      })
  }

  // Make functions available globally for onclick handlers
  window.previewTemplateModal = (templateId) => {
    alert("Template preview coming soon!")
  }
})
