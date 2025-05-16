const http = require("http")
const fs = require("fs")
const path = require("path")
const nodemailer = require("nodemailer")
const { parse } = require("url")
const { parse: parseQuery } = require("querystring")
require("dotenv").config()

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = parse(req.url, true)
  const pathname = parsedUrl.pathname

  // Handle API requests
  if (pathname.startsWith("/api/")) {
    handleApiRequest(req, res, pathname)
    return
  }

  // Serve static files
  let filePath = "." + pathname
  if (filePath === "./") {
    filePath = "./landing.html"
  }

  const extname = String(path.extname(filePath)).toLowerCase()
  const contentType =
    {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
    }[extname] || "application/octet-stream"

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        // Page not found
        fs.readFile("./404.html", (error, content) => {
          if (error) {
            res.writeHead(404)
            res.end("404 Not Found")
          } else {
            res.writeHead(404, { "Content-Type": "text/html" })
            res.end(content, "utf-8")
          }
        })
      } else {
        // Server error
        res.writeHead(500)
        res.end(`Server Error: ${error.code}`)
      }
    } else {
      // Success
      res.writeHead(200, { "Content-Type": contentType })
      res.end(content, "utf-8")
    }
  })
})

// Handle API requests
function handleApiRequest(req, res, pathname) {
  res.setHeader("Content-Type", "application/json")

  // User registration
  if (pathname === "/api/register" && req.method === "POST") {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk.toString()
    })

    req.on("end", () => {
      try {
        const userData = JSON.parse(body)
        registerUser(userData, res)
      } catch (error) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: "Invalid JSON data" }))
      }
    })
  }

  // User login
  else if (pathname === "/api/login" && req.method === "POST") {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk.toString()
    })

    req.on("end", () => {
      try {
        const loginData = JSON.parse(body)
        loginUser(loginData, res)
      } catch (error) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: "Invalid JSON data" }))
      }
    })
  }

  // Verify auth code
  else if (pathname === "/api/verify-code" && req.method === "POST") {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk.toString()
    })

    req.on("end", () => {
      try {
        const { code, userId } = JSON.parse(body)
        verifyAuthCode(code, userId, res)
      } catch (error) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: "Invalid JSON data" }))
      }
    })
  }

  // Get receipt templates
  else if (pathname === "/api/templates" && req.method === "GET") {
    getReceiptTemplates(res)
  }

  // Generate and send receipt
  else if (pathname === "/api/generate-receipt" && req.method === "POST") {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk.toString()
    })

    req.on("end", () => {
      try {
        const receiptData = JSON.parse(body)
        generateAndSendReceipt(receiptData, res)
      } catch (error) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: "Invalid JSON data" }))
      }
    })
  }

  // Unknown API endpoint
  else {
    res.writeHead(404)
    res.end(JSON.stringify({ error: "API endpoint not found" }))
  }
}

// User registration function
function registerUser(userData, res) {
  const { fullname, email, password } = userData

  // Validate input
  if (!fullname || !email || !password) {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Missing required fields" }))
    return
  }

  // Read existing users
  fs.readFile("./users.json", "utf8", (err, data) => {
    if (err) {
      // If file doesn't exist, create it with empty users array
      if (err.code === "ENOENT") {
        const newUser = {
          id: Date.now().toString(),
          fullname,
          email,
          password, // In a real app, this should be hashed
          isAuthenticated: false,
          authCode: null,
          createdAt: new Date().toISOString(),
          receipts: [],
          emailsSent: 0,
        }

        fs.writeFile("./users.json", JSON.stringify({ users: [newUser] }, null, 2), (err) => {
          if (err) {
            res.writeHead(500)
            res.end(JSON.stringify({ error: "Server error" }))
            return
          }

          // Return success
          res.writeHead(201)
          res.end(
            JSON.stringify({
              message: "User registered successfully",
              user: {
                id: newUser.id,
                fullname: newUser.fullname,
                email: newUser.email,
                isAuthenticated: newUser.isAuthenticated,
              },
            }),
          )
        })
        return
      }

      res.writeHead(500)
      res.end(JSON.stringify({ error: "Server error" }))
      return
    }

    const users = JSON.parse(data).users

    // Check if user already exists
    if (users.some((user) => user.email === email)) {
      res.writeHead(409)
      res.end(JSON.stringify({ error: "User already exists" }))
      return
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      fullname,
      email,
      password, // In a real app, this should be hashed
      isAuthenticated: false,
      authCode: null,
      createdAt: new Date().toISOString(),
      receipts: [],
      emailsSent: 0,
    }

    // Add user to database
    users.push(newUser)

    // Save updated users
    fs.writeFile("./users.json", JSON.stringify({ users }, null, 2), (err) => {
      if (err) {
        res.writeHead(500)
        res.end(JSON.stringify({ error: "Server error" }))
        return
      }

      // Return success
      res.writeHead(201)
      res.end(
        JSON.stringify({
          message: "User registered successfully",
          user: {
            id: newUser.id,
            fullname: newUser.fullname,
            email: newUser.email,
            isAuthenticated: newUser.isAuthenticated,
          },
        }),
      )
    })
  })
}

// User login function
function loginUser(loginData, res) {
  const { email, password } = loginData

  // Validate input
  if (!email || !password) {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Missing email or password" }))
    return
  }

  // Read users
  fs.readFile("./users.json", "utf8", (err, data) => {
    if (err) {
      // If file doesn't exist, no users registered yet
      if (err.code === "ENOENT") {
        res.writeHead(401)
        res.end(JSON.stringify({ error: "Invalid email or password" }))
        return
      }

      res.writeHead(500)
      res.end(JSON.stringify({ error: "Server error" }))
      return
    }

    const users = JSON.parse(data).users

    // Find user
    const user = users.find((user) => user.email === email && user.password === password)

    if (!user) {
      res.writeHead(401)
      res.end(JSON.stringify({ error: "Invalid email or password" }))
      return
    }

    // Return user data
    res.writeHead(200)
    res.end(
      JSON.stringify({
        message: "Login successful",
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          isAuthenticated: user.isAuthenticated,
          receipts: user.receipts || [],
          emailsSent: user.emailsSent || 0,
        },
      }),
    )
  })
}

// Update the verifyAuthCode function to track used codes with users
function verifyAuthCode(code, userId, res) {
  // Validate input
  if (!code || !userId) {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Missing code or user ID" }))
    return
  }

  // Read auth codes
  fs.readFile("./auth-codes.json", "utf8", (err, authData) => {
    if (err) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: "Server error" }))
      return
    }

    const authCodes = JSON.parse(authData).codes

    // Check if code is valid
    if (!authCodes.includes(code)) {
      res.writeHead(401)
      res.end(JSON.stringify({ error: "Invalid authentication code" }))
      return
    }

    // Read users
    fs.readFile("./users.json", "utf8", (err, userData) => {
      if (err) {
        res.writeHead(500)
        res.end(JSON.stringify({ error: "Server error" }))
        return
      }

      const users = JSON.parse(userData).users

      // Find user
      const userIndex = users.findIndex((user) => user.id === userId)

      if (userIndex === -1) {
        res.writeHead(404)
        res.end(JSON.stringify({ error: "User not found" }))
        return
      }

      // Update user authentication status
      users[userIndex].isAuthenticated = true
      users[userIndex].authCode = code

      // Save updated users
      fs.writeFile("./users.json", JSON.stringify({ users }, null, 2), (err) => {
        if (err) {
          res.writeHead(500)
          res.end(JSON.stringify({ error: "Server error" }))
          return
        }

        // Remove used code from available codes
        const updatedAuthCodes = authCodes.filter((c) => c !== code)

        // Save updated auth codes
        fs.writeFile("./auth-codes.json", JSON.stringify({ codes: updatedAuthCodes }, null, 2), (err) => {
          if (err) {
            res.writeHead(500)
            res.end(JSON.stringify({ error: "Server error" }))
            return
          }

          // Return success
          res.writeHead(200)
          res.end(
            JSON.stringify({
              message: "Authentication successful",
              user: {
                id: users[userIndex].id,
                fullname: users[userIndex].fullname,
                email: users[userIndex].email,
                isAuthenticated: users[userIndex].isAuthenticated,
                receipts: users[userIndex].receipts || [],
                emailsSent: users[userIndex].emailsSent || 0,
              },
            }),
          )
        })
      })
    })
  })
}

// Get receipt templates function
function getReceiptTemplates(res) {
  fs.readFile("./templates.json", "utf8", (err, data) => {
    if (err) {
      // If file doesn't exist, return empty templates
      if (err.code === "ENOENT") {
        res.writeHead(200)
        res.end(JSON.stringify({ templates: [] }))
        return
      }

      res.writeHead(500)
      res.end(JSON.stringify({ error: "Server error" }))
      return
    }

    const templates = JSON.parse(data).templates

    res.writeHead(200)
    res.end(JSON.stringify({ templates }))
  })
}

// Configure nodemailer with environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Helper function to generate a random reference
function generateRandomReference() {
  return Math.random().toString(36).substring(2, 15).toUpperCase()
}

// Update the generateAndSendReceipt function to include bank logos in emails
function generateAndSendReceipt(receiptData, res) {
  const {
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
  } = receiptData

  // Validate input
  if (!templateId || !receiverName || !amount || !recipientEmail) {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Missing required fields" }))
    return
  }

  // Check if user has reached email limit
  if (userId) {
    fs.readFile("./users.json", "utf8", (err, userData) => {
      if (err) {
        res.writeHead(500)
        res.end(JSON.stringify({ error: "Server error" }))
        return
      }

      const users = JSON.parse(userData).users
      const userIndex = users.findIndex((user) => user.id === userId)

      if (userIndex === -1) {
        res.writeHead(404)
        res.end(JSON.stringify({ error: "User not found" }))
        return
      }

      // Check email limit
      const user = users[userIndex]
      const emailsSent = user.emailsSent || 0
      const emailLimit = 7 // 7 emails per user
      const lastEmailTime = user.lastEmailTime ? new Date(user.lastEmailTime) : null
      const currentTime = new Date()
      const sixHoursInMs = 6 * 60 * 60 * 1000 // 6 hours in milliseconds

      // Reset email count if 6 hours have passed since last email
      if (lastEmailTime && currentTime - lastEmailTime >= sixHoursInMs) {
        user.emailsSent = 0
      }

      // Check if user has reached email limit
      if (user.emailsSent >= emailLimit) {
        const timeLeft = lastEmailTime ? new Date(lastEmailTime.getTime() + sixHoursInMs) : null
        const timeLeftStr = timeLeft ? `You can send more emails after ${timeLeft.toLocaleTimeString()}` : ""
        res.writeHead(429)
        res.end(JSON.stringify({ error: `You have reached your email limit (${emailLimit} emails). ${timeLeftStr}` }))
        return
      }

      // Continue with sending email
      sendReceiptEmailHelper(templateId, receiptData, res, userId)
    })
  } else {
    // No user ID provided, continue with sending email
    sendReceiptEmailHelper(templateId, receiptData, res, userId)
  }
}

// New function to handle the actual email sending
function sendReceiptEmailHelper(templateId, receiptData, res, userId) {
  // Get template details
  fs.readFile("./templates.json", "utf8", (err, data) => {
    let template

    if (err) {
      // If file doesn't exist, use a default template
      template = {
        id: templateId,
        bank: "Bank",
        name: "Payment Receipt",
      }
    } else {
      const templates = JSON.parse(data).templates
      template = templates.find((t) => t.id == templateId)

      if (!template) {
        // If template not found, use a default template
        template = {
          id: templateId,
          bank: "Bank",
          name: "Payment Receipt",
        }
      }
    }

    // Generate HTML receipt based on template and user data
    const receiptHtml = generateReceiptHtml(template, {
      receiverName: receiptData.receiverName,
      receiverAccount: receiptData.receiverAccount,
      amount: receiptData.amount,
      date: receiptData.date || new Date().toISOString().split("T")[0],
      time: receiptData.time || new Date().toTimeString().split(" ")[0],
      reference: receiptData.reference || generateRandomReference(),
      notes: receiptData.notes,
      buttonText: receiptData.buttonText,
      buttonLink: receiptData.buttonLink,
      status: receiptData.status || "successful",
    })

    // Get bank logo path based on template
    let logoPath = ""
    switch (Number.parseInt(templateId)) {
      case 1:
        logoPath = "images/palmpay.png"
        break
      case 2:
        logoPath = "images/westpac.png"
        break
      case 3:
        logoPath = "images/chase.png"
        break
      case 4:
        logoPath = "images/bankofamerica.png"
        break
      case 5:
        logoPath = "images/icici.png"
        break
      case 6:
        logoPath = "images/moneygram.png"
        break
      case 7:
        logoPath = "images/paypal.png"
        break
      case 8:
        logoPath = "images/zelle.png"
        break
      case 9:
        logoPath = "images/cashapp.png"
        break
      case 10:
        logoPath = "images/uba.png"
        break
      case 11:
        logoPath = "images/citibank.png"
        break
      case 12:
        logoPath = "images/crypto.png"
        break
      default:
        logoPath = "images/logo.png"
    }

    // Check if logo file exists
    fs.access(logoPath, fs.constants.F_OK, (err) => {
      const attachments = []

      if (!err) {
        // Logo file exists, add it as an attachment
        attachments.push({
          filename: path.basename(logoPath),
          path: logoPath,
          cid: "banklogo", // Content ID for referencing in the HTML
        })
      }

      // Send email with receipt
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: receiptData.recipientEmail,
        subject: `${template.bank} Payment Receipt`,
        html: receiptHtml,
        attachments: attachments,
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email sending error:", error)
          res.writeHead(500)
          res.end(JSON.stringify({ error: "Failed to send email" }))
          return
        }

        // If userId provided, update user's receipts and emailsSent count
        if (userId) {
          updateUserReceipts(userId, {
            templateId,
            receiverName: receiptData.receiverName,
            receiverAccount: receiptData.receiverAccount,
            amount: receiptData.amount,
            date: receiptData.date,
            time: receiptData.time,
            reference: receiptData.reference,
            notes: receiptData.notes,
            buttonText: receiptData.buttonText,
            buttonLink: receiptData.buttonLink,
            status: receiptData.status,
            recipientEmail: receiptData.recipientEmail,
            sentAt: new Date().toISOString(),
          })
        }

        // Return success
        res.writeHead(200)
        res.end(
          JSON.stringify({
            message: "Receipt generated and sent successfully",
            receipt: {
              id: Date.now().toString(),
              templateId,
              receiverName: receiptData.receiverName,
              receiverAccount: receiptData.receiverAccount,
              amount: receiptData.amount,
              date: receiptData.date,
              time: receiptData.time,
              reference: receiptData.reference,
              notes: receiptData.notes,
              buttonText: receiptData.buttonText,
              buttonLink: receiptData.buttonLink,
              status: receiptData.status,
              recipientEmail: receiptData.recipientEmail,
              sentAt: new Date().toISOString(),
            },
          }),
        )
      })
    })
  })
}

// Update the updateUserReceipts function to track email limits
function updateUserReceipts(userId, receiptData) {
  fs.readFile("./users.json", "utf8", (err, data) => {
    if (err) return

    try {
      const users = JSON.parse(data).users
      const userIndex = users.findIndex((user) => user.id === userId)

      if (userIndex === -1) return

      // Add receipt to user's receipts
      if (!users[userIndex].receipts) {
        users[userIndex].receipts = []
      }

      users[userIndex].receipts.push({
        id: Date.now().toString(),
        ...receiptData,
      })

      // Increment emailsSent count
      users[userIndex].emailsSent = (users[userIndex].emailsSent || 0) + 1

      // Update last email time
      users[userIndex].lastEmailTime = new Date().toISOString()

      // Save updated users
      fs.writeFile("./users.json", JSON.stringify({ users }, null, 2), (err) => {
        if (err) console.error("Error updating user receipts:", err)
      })
    } catch (error) {
      console.error("Error parsing users data:", error)
    }
  })
}

// Update the generateReceiptHtml function to match the real receipt designs
// Find the generateReceiptHtml function and replace it with this updated version

function generateReceiptHtml(template, data) {
  // Different HTML templates based on bank/template type
  let html = ""

  // Common status text colors
  const statusColor = data.status === "successful" ? "#4CAF50" : data.status === "pending" ? "#FFC107" : "#F44336"

  // Common status text
  const statusText = data.status === "successful" ? "Successful" : data.status === "pending" ? "Pending" : "Rejected"

  switch (Number.parseInt(template.id)) {
    case 1: // PalmPay
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PalmPay Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            .receipt-container { max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
            .header { padding: 15px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
            .header .back-button { font-size: 24px; color: #333; }
            .header .title { font-size: 18px; font-weight: 600; color: #333; }
            .header .help-button { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #333; }
            .bank-logo { display: flex; justify-content: center; padding: 20px 0; }
            .bank-logo img { width: 60px; height: 60px; border-radius: 50%; object-fit: contain; }
            .recipient { text-align: center; padding: 0 20px; }
            .recipient .to-text { font-size: 16px; color: #666; margin-bottom: 5px; }
            .recipient .name { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 15px; }
            .amount-section { text-align: center; padding: 0 20px 15px; }
            .amount-section .amount { font-size: 36px; font-weight: 700; color: #333; margin-bottom: 10px; }
            .status { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 15px; }
            .status .status-icon { width: 24px; height: 24px; background-color: ${statusColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; }
            .status .status-text { font-size: 16px; color: ${statusColor}; font-weight: 500; }
            .safeguard { display: flex; align-items: center; justify-content: center; gap: 8px; background-color: #f8f9fa; padding: 12px; margin: 0 20px 15px; border-radius: 8px; }
            .safeguard .safeguard-icon { width: 24px; height: 24px; background-color: #6c5ce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; }
            .safeguard .safeguard-text { font-size: 14px; color: #333; }
            .safeguard .completed { color: #6c5ce7; font-weight: 500; margin-left: 5px; }
            .safeguard .arrow { color: #6c5ce7; margin-left: auto; }
            .details { padding: 0 20px; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
            .detail-row:last-child { border-bottom: none; }
            .detail-row .label { font-size: 16px; color: #666; }
            .detail-row .value { font-size: 16px; color: #333; font-weight: 500; text-align: right; }
            .detail-row .strikethrough { text-decoration: line-through; color: #999; margin-left: 5px; }
            .recipient-details { padding: 15px 20px; background-color: #f8f9fa; border-top: 1px solid #f0f0f0; }
            .recipient-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .recipient-row .label { font-size: 16px; color: #666; }
            .recipient-row .value { font-size: 16px; color: #333; font-weight: 500; text-align: right; }
            .session { padding: 15px 20px; background-color: #f8f9fa; border-top: 1px solid #f0f0f0; }
            .session-id { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .session-id .label { font-size: 16px; color: #666; }
            .session-id .value { font-size: 16px; color: #333; font-weight: 500; display: flex; align-items: center; gap: 5px; }
            .session-id .copy-icon { color: #999; cursor: pointer; }
            .session-note { font-size: 14px; color: #666; line-height: 1.5; margin-bottom: 10px; }
            .session-contact { color: #6c5ce7; font-weight: 500; }
            .session-contact .phone-icon { color: #6c5ce7; margin-left: 5px; }
            .transaction-details { padding: 15px 20px; background-color: #f8f9fa; border-top: 1px solid #f0f0f0; }
            .transaction-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .transaction-row .label { font-size: 16px; color: #666; }
            .transaction-row .value { font-size: 16px; color: #333; font-weight: 500; text-align: right; display: flex; align-items: center; gap: 5px; }
            .transaction-row .copy-icon { color: #999; cursor: pointer; }
            .actions { display: flex; justify-content: space-around; padding: 20px; border-top: 1px solid #f0f0f0; }
            .action-button { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #6c5ce7; }
            .action-button .action-icon { font-size: 24px; }
            .action-button .action-text { font-size: 14px; }
            .bottom-nav { display: flex; justify-content: space-around; padding: 15px 0; background-color: #f8f9fa; border-top: 1px solid #f0f0f0; }
            .nav-item { display: flex; flex-direction: column; align-items: center; gap: 5px; color: #999; }
            .nav-item.active { color: #333; }
            .nav-item .nav-icon { font-size: 20px; }
            .nav-item .nav-text { font-size: 12px; }
            .redirect-box { padding: 15px 20px; text-align: center; border-top: 1px solid #f0f0f0; }
            .redirect-button { display: inline-block; background-color: #6c5ce7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; width: 100%; text-align: center; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="back-button">&#8592;</div>
              <div class="title">Transaction Details</div>
              <div class="help-button">?</div>
            </div>
            
            <div class="bank-logo">
              <div style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background-color: #fff; border: 1px solid #eee;">
                <img src="cid:banklogo" alt="UBA Logo" style="width: 80%; height: 80%; object-fit: contain;">
              </div>
            </div>
            
            <div class="recipient">
              <div class="to-text">You have received from</div>
              <div class="name">${data.receiverName.toUpperCase()}</div>
            </div>
            
            <div class="amount-section">
              <div class="amount">₦ ${Number.parseFloat(data.amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              
              <div class="status">
                <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
                <div class="status-text">${statusText}</div>
              </div>
              
              <div class="safeguard">
                <div class="safeguard-icon">&#9658;</div>
                <div class="safeguard-text">Fast Transfer Safeguard</div>
                <div class="completed">Completed</div>
                <div class="arrow">&#8250;</div>
              </div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <div class="label">Transfer Amount</div>
                <div class="value">₦ ${Number.parseFloat(data.amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              
              <div class="detail-row">
                <div class="label">Fee</div>
                <div class="value">₦ 0.00 <span class="strikethrough">₦ 10.00</span></div>
              </div>
              
              <div class="detail-row">
                <div class="label">Payment Amount</div>
                <div class="value">₦ ${Number.parseFloat(data.amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
            
            <div class="recipient-details">
              <div class="recipient-row">
                <div class="label">Recipient</div>
                <div class="value">${data.receiverName.toUpperCase()}</div>
              </div>
              
              <div class="recipient-row">
                <div class="label"></div>
                <div class="value">United Bank For Africa | ${data.receiverAccount || "****1234"}</div>
              </div>
            </div>
            
            <div class="session">
              <div class="session-id">
                <div class="label">Session ID</div>
                <div class="value">
                  10003325050714272302006299558
                  <span class="copy-icon">&#128203;</span>
                </div>
              </div>
              
              <div class="session-note">
                If the recipient account is not credited within 5 minutes, please use the Session ID to 
                <span class="session-contact">contact the recipient bank.<span class="phone-icon">&#9742;</span></span>
              </div>
            </div>
            
            <div class="transaction-details">
              <div class="transaction-row">
                <div class="label">Completion Time</div>
                <div class="value">${new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</div>
              </div>
              
              <div class="transaction-row">
                <div class="label">Transaction ID</div>
                <div class="value">
                  ${data.reference}
                  <span class="copy-icon">&#128203;</span>
                </div>
              </div>
              
              <div class="transaction-row">
                <div class="label">Application</div>
                <div class="value">PalmPay</div>
              </div>
              
              <div class="transaction-row">
                <div class="label">Payment Type</div>
                <div class="value">Money Transfer - Bank account</div>
              </div>
              
              <div class="transaction-row">
                <div class="label">Payment Method</div>
                <div class="value">CashBox</div>
              </div>
            </div>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }

            <div class="actions">
              <div class="action-button">
                <div class="action-icon">&#128196;</div>
                <div class="action-text">View Receipt</div>
              </div>
              
              <div class="action-button">
                <div class="action-icon">&#9888;</div>
                <div class="action-text">Report a Dispute</div>
              </div>
            </div>
            
            <div class="bottom-nav">
              <div class="nav-item">
                <div class="nav-icon">&#9776;</div>
                <div class="nav-text">Menu</div>
              </div>
              
              <div class="nav-item active">
                <div class="nav-icon">&#9679;</div>
                <div class="nav-text">Home</div>
              </div>
              
              <div class="nav-item">
                <div class="nav-icon">&#8635;</div>
                <div class="nav-text">History</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
      break
    case 2: // Westpac
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Westpac Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fff; }
            .receipt-container { max-width: 600px; margin: 0 auto; }
            .status-section { text-align: center; padding: 40px 20px 20px; }
            .status-circle { width: 80px; height: 80px; background-color: ${statusColor}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .status-icon { color: white; font-size: 40px; font-weight: bold; }
            .status-title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .recipient-text { font-size: 18px; color: #333; margin-bottom: 10px; line-height: 1.4; }
            .subtitle { font-size: 16px; color: #666; margin-bottom: 30px; }
            .details-section { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; }
            .detail-label { color: #666; font-size: 16px; }
            .detail-value { color: #333; font-size: 16px; font-weight: 500; text-align: right; }
            .detail-value.highlight { color: #e63946; }
            .promo-section { background-color: #f0f8ff; padding: 20px; margin-top: 20px; border-radius: 8px; }
            .promo-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .promo-text { font-size: 14px; color: #333; }
            .redirect-box { padding: 20px; text-align: center; margin-top: 20px; }
            .redirect-button { display: inline-block; background-color: #e63946; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; width: 80%; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="status-section">
              <div class="status-circle">
                <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
              </div>
              <div class="status-title">Payment ${statusText}</div>
              <div class="recipient-text">You have received $${Number.parseFloat(data.amount).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from ${data.receiverName}</div>
              <div class="subtitle">The payment has been credited to your account</div>
            </div>
            
            <div class="details-section">
              <div class="detail-row">
                <div class="detail-label">Payment details</div>
                <div class="detail-value highlight">${data.reference}</div>
              </div>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 10px 0;">
              <div class="detail-row">
                <div class="detail-label">Date</div>
                <div class="detail-value">${data.date || new Date().toLocaleDateString()}</div>
              </div>
              ${
                data.receiverAccount
                  ? `
              <div class="detail-row">
                <div class="detail-label">Account</div>
                <div class="detail-value">${data.receiverAccount}</div>
              </div>`
                  : ""
              }
            </div>
            
            <div class="promo-section">
              <div class="promo-title">Need cash but don't have your card?</div>
              <div class="promo-text">You can use the Westpac App to get cash from any Westpac ATM.</div>
            </div>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }
          </div>
        </body>
        </html>
      `
      break
    case 3: // Chase
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chase Payment Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; color: #333; }
            .receipt-container { max-width: 600px; margin: 0 auto; background-color: #fff; }
            .header { padding: 20px; text-align: center; background-color: #f9f9f9; }
            .header-title { font-size: 24px; font-weight: normal; margin-bottom: 0; }
            .status-section { text-align: center; padding: 30px 20px; }
            .status-circle { width: 80px; height: 80px; border-radius: 50%; border: 2px solid ${statusColor}; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .status-icon { color: ${statusColor}; font-size: 40px; }
            .status-title { font-size: 24px; margin-bottom: 20px; }
            .details-section { padding: 0 20px 30px; }
            .detail-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f0f0f0; }
            .detail-label { color: #666; font-size: 16px; }
            .detail-value { color: #333; font-size: 16px; font-weight: 500; text-align: right; }
            .footer-text { padding: 20px; font-size: 14px; color: #666; line-height: 1.5; border-top: 1px solid #f0f0f0; }
            .redirect-box { padding: 20px; text-align: center; border-top: 1px solid #f0f0f0; }
            .redirect-button { display: inline-block; background-color: #117ACA; color: white; padding: 15px 0; border-radius: 5px; font-size: 16px; font-weight: bold; width: 100%; text-align: center; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1 class="header-title">Payment ${statusText}</h1>
            </div>
            
            <div class="status-section">
              <div class="status-circle">
                <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
              </div>
              <h2 class="status-title">You have received a payment</h2>
            </div>
            
            <div class="details-section">
              <div class="detail-row">
                <div class="detail-label">Confirmation number:</div>
                <div class="detail-value">${data.reference || "22021942000880"}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Payment amount:</div>
                <div class="detail-value">$${Number.parseFloat(data.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Payment date:</div>
                <div class="detail-value">${new Date(data.date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">From account:</div>
                <div class="detail-value">JPMORGAN CHASE BANK, NA (...0248)</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">To account:</div>
                <div class="detail-value">${data.receiverName} (${data.receiverAccount ? "..." + data.receiverAccount.slice(-4) : "...8668"})</div>
              </div>
            </div>
            
            <div class="footer-text">
              <p>This is an electronic payment confirmation. The funds have been credited to your account.</p>
            </div>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }
          </div>
        </body>
        </html>
      `
      break
    case 4: // Bank of America
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bank of America Transfer Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; color: #333; }
            .receipt-container { max-width: 600px; margin: 0 auto; background-color: #fff; }
            .header { padding: 20px; text-align: center; background-color: #dc1431; color: white; }
            .header-title { font-size: 24px; font-weight: normal; margin: 0; }
            .status-section { text-align: center; padding: 30px 20px; }
            .status-circle { width: 80px; height: 80px; border-radius: 50%; background-color: #f0f0f0; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .status-icon { color: ${statusColor}; font-size: 40px; }
            .status-title { font-size: 24px; margin-bottom: 10px; }
            .details-section { padding: 0 20px 30px; }
            .detail-group { margin-bottom: 20px; }
            .detail-label { color: #666; font-size: 14px; margin-bottom: 5px; }
            .detail-value { color: #333; font-size: 16px; font-weight: 500; margin-bottom: 5px; }
            .detail-subvalue { color: #666; font-size: 14px; }
            .footer-text { padding: 20px; font-size: 12px; color: #666; line-height: 1.5; background-color: #f9f9f9; }
            .redirect-box { padding: 20px; text-align: center; }
            .redirect-button { display: inline-block; background-color: #003366; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; width: 80%; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1 class="header-title">Transfer Details</h1>
            </div>
            
            <div class="status-section">
              <div class="status-circle">
                <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
              </div>
              <h2 class="status-title">Your transfer is ${data.status === "successful" ? "confirmed" : data.status === "pending" ? "pending" : "rejected"}</h2>
            </div>
            
            <div class="details-section">
              <div class="detail-group">
                <div class="detail-label">From</div>
                <div class="detail-value">${data.receiverName}</div>
                <div class="detail-subvalue">Advantage Savings - 3740</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">To</div>
                <div class="detail-value">Your Account</div>
                <div class="detail-subvalue">BankAmericard Platinum Plus Mastercard - 5271</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Amount</div>
                <div class="detail-value">$${Number.parseFloat(data.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Date</div>
                <div class="detail-value">${new Date(data.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Confirmation #</div>
                <div class="detail-value">${data.reference || "0186286595"}</div>
              </div>
            </div>
            
            <div class="footer-text">
              <p>This is an electronic notification of a deposit to your account. The funds have been credited and are available for use.</p>
            </div>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }
          </div>
        </body>
        </html>
      `
      break
    case 5: // ICICI
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ICICI Bank Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .receipt-container { max-width: 600px; margin: 0 auto; background-color: #fff; }
            .header { padding: 20px; text-align: center; }
            .header img { max-width: 200px; }
            .status-section { text-align: center; padding: 10px 20px 30px; }
            .status-circle { width: 60px; height: 60px; border-radius: 50%; border: 2px solid ${statusColor}; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; }
            .status-icon { color: ${statusColor}; font-size: 30px; }
            .status-title { font-size: 24px; margin-bottom: 20px; color: #333; }
            .divider { border-top: 1px dashed #ccc; margin: 0 20px; }
            .details-section { padding: 20px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .detail-label { color: #666; font-size: 16px; font-weight: bold; }
            .detail-value { color: #333; font-size: 16px; text-align: right; }
            .footer { padding: 20px; text-align: center; background-color: #f5f5f5; border-top: 1px dashed #ccc; }
            .footer-text { color: #666; font-size: 14px; margin-bottom: 15px; }
            .done-badge { display: inline-block; background-color: #f5f5dc; padding: 8px 20px; border-radius: 4px; color: #333; font-weight: bold; }
            .redirect-box { padding: 20px; text-align: center; background-color: #f5f5f5; border-top: 1px dashed #ccc; }
            .redirect-button { display: inline-block; background-color: #F58220; color: white; padding: 8px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; width: 80%; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <img src="cid:banklogo" alt="ICICI Bank Logo">
            </div>
            
            <div class="status-section">
              <div class="status-circle">
                <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
              </div>
              <h2 class="status-title">Transfer ${statusText}</h2>
            </div>
            
            <div class="divider"></div>
            
            <div class="details-section">
              <div class="detail-row">
                <div class="detail-label">Reference ID</div>
                <div class="detail-value">xxxxxxxxxx</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Mode</div>
                <div class="detail-value">IMPS</div>
              </div>
              
              <div class="divider"></div>
              
              <div class="detail-row" style="margin-top: 15px;">
                <div class="detail-label">Received From</div>
                <div class="detail-value">${data.receiverName}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Account number</div>
                <div class="detail-value">${data.receiverAccount || "xxxxxxxxxx"}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Amount</div>
                <div class="detail-value">$${Number.parseFloat(data.amount).toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">On</div>
                <div class="detail-value">${data.date}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">To Account</div>
                <div class="detail-value">xxxxxxxxxx64</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Remarks</div>
                <div class="detail-value">NA...</div>
              </div>
            </div>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }
          </div>
        </body>
        </html>
      `
      break
    case 6: // MoneyGram
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MoneyGram Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; }
            .receipt-container { max-width: 600px; margin: 0 auto; background-color: #fff; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
            .header { padding: 20px; text-align: center; background-color: #f5f5f5; }
            .avatar { width: 60px; height: 60px; background-color: #ccc; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; }
            .logo-section { padding: 20px; text-align: center; border-bottom: 1px solid #eee; }
            .logo-section img { max-width: 200px; margin-bottom: 20px; }
            .status-title { font-size: 24px; margin-bottom: 20px; color: #333; }
            .details-section { padding: 20px; }
            .detail-group { margin-bottom: 15px; }
            .detail-label { color: #666; font-size: 14px; text-transform: uppercase; margin-bottom: 5px; }
            .detail-value { color: #333; font-size: 18px; font-weight: bold; }
            .cost-section { padding: 20px; border-top: 1px solid #eee; }
            .cost-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .cost-label { color: #333; }
            .cost-value { color: #333; }
            .cost-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; color: white; background-color: ${statusColor}; }
            .redirect-box { padding: 20px; text-align: center; }
            .redirect-button { display: inline-block; background-color: #d9534f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; width: 100%; text-align: center; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="avatar">EG</div>
            </div>
            
            <div class="logo-section">
              <img src="cid:banklogo" alt="MoneyGram Logo">
              <div class="status-badge">${statusText}</div>
              <h2 class="status-title">You have received money from ${data.receiverName}</h2>
            </div>
            
            <div class="details-section">
              <div class="detail-group">
                <div class="detail-label">Reference No.</div>
                <div class="detail-value">${data.reference}</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Sent From</div>
                <div class="detail-value">${data.receiverName}, Honduras</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Amount</div>
                <div class="detail-value">${Number.parseFloat(data.amount).toFixed(2)} HNL</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Receive Option</div>
                <div class="detail-value">Bank Account •••• ${data.receiverAccount || "4196"}</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Date Prepared</div>
                <div class="detail-value">${new Date(data.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} EST</div>
              </div>
            </div>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }
            
            <div class="cost-section">
              <div class="cost-row">
                <span>Received Amount</span>
                <span>${Number.parseFloat(data.amount).toFixed(2)} USD</span>
              </div>
              <div class="cost-row">
                <span>Fees</span>
                <span>0.00 USD</span>
              </div>
              <div class="cost-total">
                <span>Total Amount</span>
                <span>${Number.parseFloat(data.amount).toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
      break
    case 7: // PayPal
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PayPal Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; }
            .receipt-container { max-width: 600px; margin: 0 auto; }
            .header { background-color: #00A884; color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .status-circle { width: 80px; height: 80px; background-color: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .status-icon { color: ${statusColor}; font-size: 40px; }
            .header-title { font-size: 28px; margin-bottom: 20px; }
            .header-subtitle { font-size: 16px; line-height: 1.5; }
            .details-section { background-color: white; padding: 20px; }
            .section-title { color: #666; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
            .divider { border-top: 1px solid #eee; margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .detail-label { font-size: 18px; }
            .detail-value { font-size: 18px; font-weight: bold; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; color: white; background-color: ${statusColor}; }
            .redirect-box { padding: 20px; text-align: center; background-color: white; }
            .redirect-button { display: inline-block; background-color: #00A884; color: white; padding: 15px 0; border-radius: 5px; font-size: 16px; font-weight: bold; width: 100%; text-align: center; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="status-circle">
                <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
              </div>
              <div class="status-badge">${statusText}</div>
              <h1 class="header-title">You've received $${Number.parseFloat(data.amount).toFixed(2)} from ${data.receiverName}</h1>
              <p class="header-subtitle">The money has been added to your PayPal balance. You can keep it in your balance or transfer it to your bank.</p>
            </div>
            
            <div class="details-section">
              <p class="section-title">TRANSACTION DETAILS</p>
              <div class="divider"></div>
              
              <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="detail-value">$${Number.parseFloat(data.amount).toFixed(2)} USD</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Fee</span>
                <span class="detail-value">$0.00 USD</span>
              </div>
              
              <div class="total-row">
                <span class="detail-label">Total</span>
                <span class="detail-value">$${Number.parseFloat(data.amount).toFixed(2)} USD</span>
              </div>
              
              <div class="divider"></div>
              <p class="section-title">SENDER INFORMATION</p>
              <div class="divider"></div>
              
              <div class="detail-row">
                <span class="detail-label">Name</span>
                <span class="detail-value">${data.receiverName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">${data.reference || "9AS12345XY123456Z"}</span>
              </div>
            </div>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }
          </div>
        </body>
        </html>
      `
      break
    case 8: // Zelle
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Zelle Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; }
            .receipt-container { max-width: 600px; margin: 0 auto; background-color: #fff; }
            .header { padding: 20px; text-align: center; color: #666; }
            .avatar-section { position: relative; text-align: center; padding: 20px 0; }
            .avatar { width: 80px; height: 80px; background-color: #ccc; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 40px; }
            .zelle-badge { position: absolute; top: 20px; left: 50%; margin-left: 20px; background-color: #6b31aa; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; }
            .amount-section { text-align: center; padding: 20px; }
            .amount-title { font-size: 28px; color: #333; margin-bottom: 0; }
            .to-text { margin: 20px 0; color: #666; font-size: 18px; }
            .recipient-name { font-size: 24px; color: #333; margin: 0; }
            .recipient-info { margin: 10px 0; color: #666; font-size: 16px; }
            .memo-section { padding: 20px; text-align: center; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
            .memo-text { margin: 0; color: #0066cc; font-size: 18px; font-weight: bold; }
            .info-section { padding: 20px; text-align: left; }
            .info-text { margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.5; }
            .warning-text { margin: 0; color: #333; font-size: 16px; font-weight: bold; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; color: white; background-color: ${statusColor}; }
            .redirect-box { padding: 20px; text-align: center; border-top: 1px solid #eee; }
            .redirect-button { display: inline-block; background-color: #0a3d7e; color: white; padding: 15px 0; border-radius: 30px; font-size: 16px; font-weight: bold; width: 100%; text-align: center; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h2>Payment Notification</h2>
            </div>
            
            <div class="avatar-section">
              <div class="avatar">D</div>
              <div class="zelle-badge">Z</div>
            </div>
            
            <div class="amount-section">
              <div class="status-badge">${statusText}</div>
              <h2 class="amount-title">You've received $${Number.parseFloat(data.amount).toFixed(2)}</h2>
              <p class="to-text">from</p>
              <h3 class="recipient-name">${data.receiverName}</h3>
              <p class="recipient-info">${data.receiverAccount || "(928) 303-3816"}</p>
              <p class="recipient-info">Sent via Zelle®</p>
            </div>
            
            <div class="memo-section">
              <p class="memo-text">Rent</p>
            </div>
            
            <div class="info-section">
              <p class="info-text">The money has been deposited into your account. This transaction will appear on your statement as a "Zelle payment".</p>
              <p class="warning-text">Transaction ID: ${data.reference || "ZL-12345678"}</p>
            </div>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }
          </div>
        </body>
        </html>
      `
      break
    case 9: // Cash App
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cash App Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1e2124; color: white; }
            .receipt-container { max-width: 600px; margin: 0 auto; }
            .header { padding: 30px 20px; text-align: center; }
            .status-circle { width: 80px; height: 80px; background-color: ${statusColor}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .status-icon { color: white; font-size: 40px; }
            .header-title { font-size: 28px; margin-bottom: 20px; }
            .amount { font-size: 36px; font-weight: bold; margin-bottom: 30px; }
            .details-section { background-color: #2a2d30; padding: 20px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .detail-label { font-size: 18px; }
            .detail-value { font-size: 18px; font-weight: bold; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; color: #1e2124; background-color: ${statusColor}; }
            .redirect-box { padding: 20px; text-align: center; }
            .redirect-button { display: inline-block; background-color: #00D632; color: white; padding: 15px 0; border-radius: 5px; font-size: 16px; font-weight: bold; width: 100%; text-align: center; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="status-circle">
                <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
              </div>
              <div class="status-badge">${statusText}</div>
              <h1 class="header-title">You've received a payment</h1>
              <div class="amount">$${Number.parseFloat(data.amount).toFixed(2)}</div>
            </div>
            
            <div class="details-section">
              <div class="detail-row">
                <span class="detail-label">From</span>
                <span class="detail-value">${data.receiverName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Payment Amount</span>
                <span class="detail-value">$${Number.parseFloat(data.amount).toFixed(2)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Total Received</span>
                <span class="detail-value">$${Number.parseFloat(data.amount).toFixed(2)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Payment Date</span>
                <span class="detail-value">${new Date(data.date).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Deposit To</span>
                <span class="detail-value">Cash Balance</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Confirmation Number</span>
                <span class="detail-value">${data.reference || "D25B-5MM4-QGPQ"}</span>
              </div>
            </div>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }
          </div>
        </body>
        </html>
      `
      break
    case 10: // UBA Bank
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>UBA Bank Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; }
            .receipt-container { max-width: 600px; margin: 0 auto; background-color: #fff; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
            .header { background-color: #d20a11; padding: 20px; text-align: center; color: white; }
            .header img { max-width: 100px; margin-bottom: 10px; }
            .header-title { font-size: 24px; margin: 0; }
            .status-section { text-align: center; padding: 20px; }
            .status-circle { width: 80px; height: 80px; background-color: #f0f0f0; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .status-icon { color: ${statusColor}; font-size: 40px; }
            .status-title { font-size: 24px; margin-bottom: 10px; color: #333; }
            .amount { font-size: 32px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .recipient-text { margin: 10px 0 20px; color: #666; }
            .details-section { background-color: #f9f9f9; padding: 20px; }
            .detail-group { margin-bottom: 15px; }
            .detail-label { color: #666; font-size: 14px; text-transform: uppercase; margin-bottom: 5px; }
            .detail-value { color: #333; font-size: 16px; font-weight: bold; }
            .footer { padding: 20px; text-align: center; }
            .footer-text { color: #666; font-size: 12px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; color: white; background-color: ${statusColor}; }
            .redirect-box { padding: 20px; text-align: center; }
            .redirect-button { display: inline-block; background-color: #d20a11; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; width: 80%; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <img src="cid:banklogo" alt="UBA Logo">
              <h1 class="header-title">Transfer Confirmation</h1>
            </div>
            
            <div class="status-section">
              <div class="status-circle">
                <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
              </div>
              <div class="status-badge">${statusText}</div>
              <h2 class="status-title">You have received</h2>
              <div class="amount">₦${Number.parseFloat(data.amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p class="recipient-text">from ${data.receiverName}</p>
            </div>
            
            <div class="details-section">
              <div class="detail-group">
                <div class="detail-label">Sender</div>
                <div class="detail-value">${data.receiverName}</div>
                <div class="detail-value">${data.receiverAccount || "2314431651"}</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Amount</div>
                <div class="detail-value">₦${Number.parseFloat(data.amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Date</div>
                <div class="detail-value">${new Date(data.date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Transaction ID</div>
                <div class="detail-value">${data.reference || "UBATRANS123456789"}</div>
              </div>
            </div>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }
          </div>
        </body>
        </html>
      `
      break
    case 11: // Citibank
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Citibank Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; }
            .receipt-container { max-width: 600px; margin: 0 auto; background-color: #fff; }
            .status-section { text-align: center; padding: 40px 20px; }
            .status-circle { width: 60px; height: 60px; border: 2px solid ${statusColor}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .status-icon { color: ${statusColor}; font-size: 30px; }
            .status-title { font-size: 24px; margin-bottom: 20px; color: #333; }
            .amount { font-size: 32px; font-weight: bold; color: #333; margin-bottom: 20px; }
            .description { color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px; text-align: center; }
            .reference { font-size: 16px; margin-bottom: 30px; }
            .logo-section { text-align: center; margin-bottom: 20px; }
            .logo-section img { max-width: 80px; }
            .status-message { color: #666; font-size: 16px; margin-bottom: 20px; }
            .disclaimer { color: #666; font-size: 14px; line-height: 1.5; text-align: center; margin-bottom: 20px; }
            .expected-time { color: #666; font-size: 14px; text-align: center; margin-bottom: 20px; }
            .transaction-note { color: #666; font-size: 14px; text-align: center; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; color: white; background-color: ${statusColor}; }
            .redirect-box { padding: 20px; text-align: center; }
            .redirect-button { display: inline-block; background-color: #003b7d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; width: 80%; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="status-section">
              <div class="status-circle">
                <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
              </div>
              <div class="status-badge">${statusText}</div>
              <h2 class="status-title">Wire Transfer Notification</h2>
              <p class="description">You have received</p>
              <div class="amount">$${Number.parseFloat(data.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p class="description">from ${data.receiverName}</p>
              <p class="reference">Reference Number: ${data.reference || "855686337939171"}</p>
              
              <div class="logo-section">
                <img src="cid:banklogo" alt="Citibank Logo">
              </div>
              
              <p class="status-message">Transaction status: ${statusText}</p>
              
              <p class="disclaimer">This is an electronic notification of a deposit to your account. The funds have been credited and are available for use.</p>
              
              ${
                data.buttonText && data.buttonLink
                  ? `
                  <div class="redirect-box">
                    <a href="${data.buttonLink}" class="redirect-button">
                      ${data.buttonText}
                    </a>
                  </div>
                  `
                  : ""
              }
            </div>
          </div>
        </body>
        </html>
      `
      break
    case 12: // Cryptocurrency/Bitcoin
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cryptocurrency Payment Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; }
            .receipt-container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 40px 20px; text-align: center; }
            .status-circle { width: 80px; height: 80px; background-color: #e6f7e6; border-radius: 50%; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; }
            .status-icon { color: ${statusColor}; font-size: 40px; }
            .status-title { font-size: 28px; margin-bottom: 30px; color: #333; }
            .amount { font-size: 36px; font-weight: bold; color: #333; margin-bottom: 20px; }
            .recipient-text { margin: 0 0 20px; color: #666; font-size: 18px; }
            .reference { font-size: 18px; margin-bottom: 30px; color: #666; }
            .date { font-size: 16px; color: #666; margin-bottom: 40px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; color: white; background-color: ${statusColor}; }
            .redirect-box { margin-top: 30px; }
            .redirect-button { display: inline-block; background-color: #6c5ce7; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; width: 100%; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="status-circle">
              <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
            </div>
            <div class="status-badge">${statusText}</div>
            <h2 class="status-title">You have received</h2>
            <div class="amount">$${Number.parseFloat(data.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p class="recipient-text">from</p>
            <p class="recipient-text">${data.receiverName || "Anonymous Sender"}</p>
            <p class="recipient-text">to wallet</p>
            <p class="recipient-text">${data.receiverAccount || "DABCNB64fa75NVMVO54FacWATMVU"}</p>
            <p class="reference">Ref: ${data.reference || "95885263"}</p>
            <p class="date">${new Date(data.date).toDateString()}</p>
            
            ${
              data.buttonText && data.buttonLink
                ? `
                <div class="redirect-box">
                  <a href="${data.buttonLink}" class="redirect-button">
                    ${data.buttonText}
                  </a>
                </div>
                `
                : ""
            }
          </div>
        </body>
        </html>
      `
      break
    default:
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Receipt</title>
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .receipt-container { max-width: 600px; margin: 0 auto; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { background-color: #ffffff; padding: 20px; }
            .status-circle { width: 100px; height: 100px; border-radius: 50%; margin: 20px auto; display: flex; align-items: center; justify-content: center; }
            .status-success { background-color: #4CAF50; }
            .status-pending { background-color: #FFC107; }
            .status-failed { background-color: #F44336; }
            .status-icon { color: white; font-size: 40px; font-weight: bold; }
            .amount { font-size: 36px; font-weight: bold; text-align: center; margin: 20px 0; }
            .recipient { font-size: 18px; text-align: center; margin-bottom: 30px; color: #666; }
            .details { border-top: 1px solid #eee; padding-top: 20px; }
            .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
            .detail-label { flex: 1; color: #666; }
            .detail-value { flex: 1; font-weight: bold; text-align: right; }
            .notes { margin-top: 20px; background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
            .notes-label { font-weight: bold; margin-bottom: 5px; }
            .notes-content { color: #666; }
            .redirect-box { margin-top: 30px; text-align: center; }
            .redirect-button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; width: 80%; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1>Payment Receipt</h1>
            </div>
            <div class="content">
              <div class="status-circle ${data.status === "successful" ? "status-success" : data.status === "pending" ? "status-pending" : "status-failed"}">
                <div class="status-icon">${data.status === "successful" ? "✓" : data.status === "pending" ? "!" : "✕"}</div>
              </div>
              <h2 style="text-align: center;">Payment ${statusText}</h2>
              <div class="amount">$${Number.parseFloat(data.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div class="recipient">You have received payment from ${data.receiverName}</div>
              
              <div class="details">
                <div class="detail-row">
                  <div class="detail-label">Reference Number</div>
                  <div class="detail-value">${data.reference}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Date</div>
                  <div class="detail-value">${data.date}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Time</div>
                  <div class="detail-value">${data.time}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Account Number</div>
                  <div class="detail-value">${data.receiverAccount || "N/A"}</div>
                </div>
              </div>
              
              ${
                data.notes
                  ? `
              <div class="notes">
                <div class="notes-label">Notes:</div>
                <div class="notes-content">${data.notes}</div>
              </div>
              `
                  : ""
              }
              
              ${
                data.buttonText && data.buttonLink
                  ? `
              <div class="redirect-box">
                <a href="${data.buttonLink}" class="redirect-button">${data.buttonText}</a>
              </div>
              `
                  : ""
              }
            </div>
          </div>
        </body>
        </html>
      `
  }

  return html
}

// Update the sendReceiptEmail function to include status icons
function sendReceiptEmailHelper(templateId, receiptData, res, userId) {
  // Get template details
  fs.readFile("./templates.json", "utf8", (err, data) => {
    let template

    if (err) {
      // If file doesn't exist, use a default template
      template = {
        id: templateId,
        bank: "Bank",
        name: "Payment Receipt",
      }
    } else {
      const templates = JSON.parse(data).templates
      template = templates.find((t) => t.id == templateId)

      if (!template) {
        // If template not found, use a default template
        template = {
          id: templateId,
          bank: "Bank",
          name: "Payment Receipt",
        }
      }
    }

    // Generate HTML receipt based on template and user data
    const receiptHtml = generateReceiptHtml(template, {
      receiverName: receiptData.receiverName,
      receiverAccount: receiptData.receiverAccount,
      amount: receiptData.amount,
      date: receiptData.date || new Date().toISOString().split("T")[0],
      time: receiptData.time || new Date().toTimeString().split(" ")[0],
      reference: receiptData.reference || generateRandomReference(),
      notes: receiptData.notes,
      buttonText: receiptData.buttonText,
      buttonLink: receiptData.buttonLink,
      status: receiptData.status || "successful",
    })

    // Get bank logo path based on template
    let logoPath = ""
    switch (Number.parseInt(templateId)) {
      case 1:
        logoPath = "images/palmpay.png"
        break
      case 2:
        logoPath = "images/westpac.png"
        break
      case 3:
        logoPath = "images/chase.png"
        break
      case 4:
        logoPath = "images/bankofamerica.png"
        break
      case 5:
        logoPath = "images/icici.png"
        break
      case 6:
        logoPath = "images/moneygram.png"
        break
      case 7:
        logoPath = "images/paypal.png"
        break
      case 8:
        logoPath = "images/zelle.png"
        break
      case 9:
        logoPath = "images/cashapp.png"
        break
      case 10:
        logoPath = "images/uba.png"
        break
      case 11:
        logoPath = "images/citibank.png"
        break
      case 12:
        logoPath = "images/crypto.png"
        break
      default:
        logoPath = "images/logo.png"
    }

    // Status icon paths
    const successIconPath = "images/success-icon.png"
    const pendingIconPath = "images/pending-icon.png"
    const rejectedIconPath = "images/rejected-icon.png"

    // Check if logo file exists
    fs.access(logoPath, fs.constants.F_OK, (err) => {
      const attachments = []

      if (!err) {
        // Logo file exists, add it as an attachment
        attachments.push({
          filename: path.basename(logoPath),
          path: logoPath,
          cid: "banklogo", // Content ID for referencing in the HTML
        })
      }

      // Add status icons based on status
      if (receiptData.status === "successful") {
        fs.access(successIconPath, fs.constants.F_OK, (err) => {
          if (!err) {
            attachments.push({
              filename: path.basename(successIconPath),
              path: successIconPath,
              cid: "success-icon",
            })
          }
        })
      } else if (receiptData.status === "pending") {
        fs.access(pendingIconPath, fs.constants.F_OK, (err) => {
          if (!err) {
            attachments.push({
              filename: path.basename(pendingIconPath),
              path: pendingIconPath,
              cid: "pending-icon",
            })
          }
        })
      } else {
        fs.access(rejectedIconPath, fs.constants.F_OK, (err) => {
          if (!err) {
            attachments.push({
              filename: path.basename(rejectedIconPath),
              path: rejectedIconPath,
              cid: "rejected-icon",
            })
          }
        })
      }

      // Send email with receipt
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: receiptData.recipientEmail,
        subject: `${template.bank} Payment Receipt`,
        html: receiptHtml,
        attachments: attachments,
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email sending error:", error)
          res.writeHead(500)
          res.end(JSON.stringify({ error: "Failed to send email" }))
          return
        }

        // If userId provided, update user's receipts and emailsSent count
        if (userId) {
          updateUserReceipts(userId, {
            templateId,
            receiverName: receiptData.receiverName,
            receiverAccount: receiptData.receiverAccount,
            amount: receiptData.amount,
            date: receiptData.date,
            time: receiptData.time,
            reference: receiptData.reference,
            notes: receiptData.notes,
            buttonText: receiptData.buttonText,
            buttonLink: receiptData.buttonLink,
            status: receiptData.status,
            recipientEmail: receiptData.recipientEmail,
            sentAt: new Date().toISOString(),
          })
        }

        // Return success
        res.writeHead(200)
        res.end(
          JSON.stringify({
            message: "Receipt generated and sent successfully",
            receipt: {
              id: Date.now().toString(),
              templateId,
              receiverName: receiptData.receiverName,
              receiverAccount: receiptData.receiverAccount,
              amount: receiptData.amount,
              date: receiptData.date,
              time: receiptData.time,
              reference: receiptData.reference,
              notes: receiptData.notes,
              buttonText: receiptData.buttonText,
              buttonLink: receiptData.buttonLink,
              status: receiptData.status,
              recipientEmail: receiptData.recipientEmail,
              sentAt: new Date().toISOString(),
            },
          }),
        )
      })
    })
  })
}

// Start the server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
