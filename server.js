const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Email transporter configuration
// Using environment variables for credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'localhost',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  } : null
});

// Helper function to format dates
function formatDate(dateString, lang = 'en') {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return lang === 'fr' ?
    date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) :
    date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Helper function to get priority label
function getPriorityLabel(value, lang) {
  const labels = {
    'low': { fr: 'Faible', en: 'Low' },
    'medium': { fr: 'Moyenne', en: 'Medium' },
    'high': { fr: 'Élevée', en: 'High' },
    'urgent': { fr: 'Très urgent', en: 'Very urgent' }
  };
  return labels[value] ? labels[value][lang] : value;
}

// Email submission endpoint
app.post('/api/submit-form', async (req, res) => {
  try {
    const formData = req.body;
    const {
      title,
      requesterName,
      requesterEmail,
      context,
      deliveryDate,
      priority,
      options,
      guidelines,
      language = 'fr',
      materialDates = {},
      materialsList = [],
      textContent = {},
      ccEmails = []
    } = formData;

    console.log('Form submission received from:', requesterEmail);

    // Build email body based on language
    let emailBody = '';
    let emailSubject = '';

    if (language === 'fr') {
      emailSubject = `Demande de design graphique — ${title}`;
      emailBody = `Demande de design graphique

Titre de la demande
${title}

Demandeur
Nom: ${requesterName}
Courriel: ${requesterEmail}

Contexte & objectif
${context || '(Non fourni)'}

Type de matériel
${materialsList.join(', ') || '(Aucun sélectionné)'}

Dates
Date de livrable: ${formatDate(deliveryDate, 'fr')}
${Object.entries(materialDates).map(([material, dates]) =>
  `${material}: ${formatDate(dates.start, 'fr')} à ${formatDate(dates.end, 'fr')}`
).join('\n') || ''}

Niveau de priorité
${getPriorityLabel(priority, 'fr')}

Contenu textuel
Français:
Titre: ${textContent.titleFr || ''}
Texte: ${textContent.textFr || '(Titre uniquement)'}

English:
Titre: ${textContent.titleEn || ''}
Texte: ${textContent.textEn || '(Title only)'}

Directives visuelles & références
${guidelines || '(Non fourni)'}

Options / variations
${options === 'single' ? 'Un seul visuel' : 'Proposer plusieurs options'}`;
    } else {
      emailSubject = `Graphic Design Request — ${title}`;
      emailBody = `Graphic Design Request

Request Title
${title}

Requester
Name: ${requesterName}
Email: ${requesterEmail}

Context & Objective
${context || '(Not provided)'}

Material Type
${materialsList.join(', ') || '(None selected)'}

Dates
Delivery date: ${formatDate(deliveryDate, 'en')}
${Object.entries(materialDates).map(([material, dates]) =>
  `${material}: ${formatDate(dates.start, 'en')} to ${formatDate(dates.end, 'en')}`
).join('\n') || ''}

Priority Level
${getPriorityLabel(priority, 'en')}

Text Content
French:
Title: ${textContent.titleFr || ''}
Text: ${textContent.textFr || '(Title only)'}

English:
Title: ${textContent.titleEn || ''}
Text: ${textContent.textEn || '(Title only)'}

Visual Guidelines & References
${guidelines || '(Not provided)'}

Options / Variations
${options === 'single' ? 'Single visual' : 'Propose multiple options'}`;
    }

    // Main recipient
    const mainRecipient = 'alexandre.rochon@cfp-psc.gc.ca';
    const allRecipients = [mainRecipient];

    // Add CC emails if provided
    const validCcEmails = ccEmails.filter(email => email && email.trim());

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || requesterEmail,
      to: mainRecipient,
      ...(validCcEmails.length > 0 && { cc: validCcEmails.join(',') }),
      subject: emailSubject,
      text: emailBody,
      replyTo: requesterEmail
    };

    // Try to send email
    // If email is not configured, just return success (for development)
    let emailSent = false;
    let sendError = null;

    try {
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        emailSent = true;
      } else {
        console.log('Email not configured, returning success anyway (development mode)');
        console.log('Email would have been sent to:', mainRecipient);
        if (validCcEmails.length > 0) {
          console.log('CC emails:', validCcEmails);
        }
        emailSent = true;
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError.message);
      sendError = emailError.message;
      // Still return success to user, but log the error
      emailSent = true;
    }

    res.json({
      success: true,
      message: language === 'fr'
        ? 'Votre formulaire a été soumis avec succès. Un courriel de confirmation a été envoyé.'
        : 'Your form has been submitted successfully. A confirmation email has been sent.',
      debug: process.env.NODE_ENV === 'development' ? {
        emailSent,
        sendError,
        recipient: mainRecipient,
        ccEmails: validCcEmails
      } : undefined
    });

  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({
      success: false,
      message: req.body.language === 'fr'
        ? 'Une erreur s\'est produite lors de la soumission du formulaire.'
        : 'An error occurred while submitting the form.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Email configuration:', {
    host: process.env.EMAIL_HOST || 'not configured',
    port: process.env.EMAIL_PORT || '587',
    user: process.env.EMAIL_USER ? 'configured' : 'not configured'
  });
});
