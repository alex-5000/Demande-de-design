# Graphic Design Request Form

A bilingual (French/English) web form for submitting graphic design requests with email integration.

## Features

- Bilingual interface (French/English)
- Form validation with error messages
- Dynamic material type selection with date ranges
- Email submission with CC support
- Responsive design

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation Steps

1. Install dependencies:
```bash
npm install
```

2. (Optional) Configure email settings:
   - Copy `.env.example` to `.env`
   - Configure your email provider settings (see configuration section below)
   - If no email is configured, the form will still submit successfully but emails won't be sent

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Email Configuration

### For Development (No Email Setup Required)

The server works in development mode without email configuration. Form submissions will be logged but no emails will be sent. This is useful for testing the form workflow.

### For Production (Gmail or Other Providers)

#### Using Gmail with App Password

1. Enable 2-factor authentication on your Google Account
2. Generate an app-specific password at https://myaccount.google.com/apppasswords
3. Create a `.env` file based on `.env.example`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=your-email@gmail.com
PORT=3000
NODE_ENV=production
```

#### Using Other Email Providers

Configure the appropriate SMTP settings for your provider.

## Usage

1. Fill out the form with required information
2. Select material types and provide distribution dates
3. Add text content in French and English
4. Optionally add approvers (CC recipients)
5. Click "Submit" or "Soumettre"
6. Form will be submitted to `alexandre.rochon@cfp-psc.gc.ca` with CC to additional approvers if provided

## API Endpoints

### POST /api/submit-form

Submits the graphic design request form.

**Request Body:**
```json
{
  "title": "string",
  "requesterName": "string",
  "requesterEmail": "string",
  "context": "string",
  "deliveryDate": "YYYY-MM-DD",
  "priority": "low|medium|high|urgent",
  "options": "single|multiple",
  "guidelines": "string",
  "language": "fr|en",
  "materialDates": {
    "material": {
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD"
    }
  },
  "materialsList": ["string"],
  "textContent": {
    "titleFr": "string",
    "textFr": "string",
    "titleEn": "string",
    "textEn": "string"
  },
  "ccEmails": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Votre formulaire a été soumis avec succès..."
}
```

### GET /api/health

Health check endpoint to verify server is running.

## Development

### Troubleshooting

- **Form not submitting?** Check browser console for error messages
- **Email not being sent?** Ensure email configuration is correct and credentials are valid
- **Port already in use?** Change PORT in `.env` file or set environment variable

## License

ISC
