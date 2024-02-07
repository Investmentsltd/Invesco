const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
const nodemailer = require('nodemailer');


const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  insecureAuth: true,
});



// POST endpoint to handle admin login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return res.status(500).send('Internal Server Error');
    }
    connection.query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password],
      (err, results) => {
        connection.release(); // Release the connection after the query
        if (err) {
          console.error('Error fetching user:', err);
          return res.status(500).send('Internal Server Error');
        }
        if (results.length === 0) {
          return res.status(401).send('Invalid username or password');
        }
        // Redirect to dashboard upon successful login
        res.redirect('/dashboard.html');
      }
    );
  });
});

// Function to generate a random alphanumeric code
function generateReferenceCode(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Function to insert a reference code into the database
function insertReferenceCode(code) {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
    }

    connection.query(
      'INSERT INTO reference_code (code) VALUES (?)',
      [code],
      (err, results) => {
        connection.release(); // Release the connection after the query
        if (err) {
          console.error('Error inserting reference code:', err);
          return;
        }
        console.log('Reference code inserted:', code);
      }
    );
  });
}

// Define a POST endpoint to handle the button press
app.post('/generate-reference-code', (req, res) => {
  // Generate the reference code
  const referenceCode = generateReferenceCode(8);

  // Insert the reference code into the database
  insertReferenceCode(referenceCode);

  // Send the reference code back as a response
  res.send(referenceCode);

  // Respond with a success message
  res.send('Reference code generated and inserted successfully');
});


// POST endpoint to handle login with reference ID
app.post('/login/reference', (req, res) => {
  const { referenceId } = req.body;
  
  // Query the database to check if the reference ID exists
  pool.query(
    'SELECT * FROM reference_code WHERE code = ?',
    [referenceId],
    (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        res.status(500).send('Internal Server Error');
        return;
      }
      
      // Check if reference ID exists
      if (results.length === 0) {
        res.status(401).send('Invalid reference ID');
        return;
      }

      // Reference ID is valid, set up session or return success response
      // For example, you can set up a session and redirect the user to the dashboard
      
      res.redirect('/report.html');
    }
  );
});


// Function to send confirmation email
function sendConfirmationEmail(name, email) {
  // Create a Nodemailer transporter
  let transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: 'cisaonlinereport@hotmail.com', // Your email address
      pass: 'Samuelfelicia@2002' // Your email password
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false // Ignore SSL certificate validation errors
    }
  });
  

  // HTML content for the email
  let htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="./css/mail.css">
    <title>CISA Confirmation Mail</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');
  
      *{
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        font-family: 'Poppins', sans-serif;
      }
  
      body{
        background-color: rgb(0, 78, 162);
      }
  
      .subnav{
        text-align: center;
        font-size: 12px;
        height: 2rem;
        background-color: rgb(0, 78, 162);
        color: white;
        padding: 0.5rem 1.5rem;
        display: flex;
        gap: 5rem;
        font-size: 70%;
      }
  
      .subnav img{
        width: 1.7rem;
      }
  
      nav{
        text-align: left;
        padding: 0.5rem 1.5rem;
        display: flex;
        justify-content: space-between;
    
        color: white;
     
      }
  
      nav .logo{
        display: flex;
        gap: 0.5rem;
      }
  
      nav .logo img{
        width: 3rem;
      }
      nav .logo p{
        font-size: 12.5px;
        font-weight: bold;
        color: white;
      }
  
      .container{
        padding: 2rem;
      }
  
      .text{
        background-color: white;
        padding: 2rem;
      }
    </style>
  </head>
  <body>
    <div class="subnav">
      <div class="cisa"><img src="./css/images/2560px-Flag_of_the_United_States.svg.png" alt=""></div>
      <p>An official media of the United States</p>
    </div>
  
    <nav>
      <div class="logo"><img src="./css/images/Seal_of_Cybersecurity_and_Infrastructure_Security_Agency.svg" alt=""><p>CYBERSECURITY & <br> INFRASTRUCTURE <br> SECURITY </p></div>
      <img src="./css/images/ntas_03_noadvisories.svg" alt="" style="width: 5rem;">
    </nav>
    <br>
    <div class="container">
      <div class="text">
              <h2>Confirmation mail for, ${name}!: Submission of Cyber Attack Report Form</h2><br>
  
        This is to confirm that we have received your submission of the Cyber Attack Report Form (CARF). Thank you for taking the time to report the incident to us. <br><br>
  
        Your report is crucial in helping us understand and address cyber threats effectively. Our team of experts will review the information provided and take appropriate actions to mitigate any potential risks. <br><br>
  
        Please be assured that all information submitted will be treated confidentially and in accordance with our strict security protocols. <br><br>
  
        Due to security reasons, If you know other victims please have them visit our website at <a href="">CISAonline</a> or copy this link and share to them ...... and request for a private Reference Id to submit their testimony. <br><br>
  
        Thank you again for your cooperation.
  
        Best regards,
      </div><br>
      <h6 style="text-align: center;">All rights reserved.</h6>
    </div>
  
  </body>
  </html>
  `;

  // Email content
  let mailOptions = {
    from: 'cisaonlinereport@hotmail.com', // Sender address
    to: email, // Recipient address
    subject: 'Confirmation Email', // Subject line
    html: htmlContent // HTML content of the email
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending confirmation email:', error);
    } else {
      console.log('Confirmation email sent:', info.response);
    }
  });
}

// Handle form submission
app.post('/submit-form', (req, res) => {
  // Extract form data
  const { reporter_name, email, incidentType, incidentDetails } = req.body;

  // Insert form data into the database
  pool.query(
    'INSERT INTO cybersecurityform (reporter_name, email, incident_type, incident_details) VALUES (?, ?, ?, ?)',
    [reporter_name, email, incidentType, incidentDetails],
    (error, results) => {
      if (error) {
        console.error('Error inserting data into the database:', error);
        res.status(500).send('Internal Server Error');
      } else {
        // Send confirmation email
        sendConfirmationEmail(reporter_name, email);
        // Send confirmation response to the client
        res.send('Report submitted successfully! Expect a feedback in your provided email address within 24 hours.');
      }
    }
  );
});


// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
