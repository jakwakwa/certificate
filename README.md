# Share Certificate Generator

This project is a web-based tool for generating and downloading official share certificates. It provides a high-quality visual preview in the browser and allows users to export the certificate as a vector-based PDF.

## Features

- **Visual Preview**: Real-time rendering of the share certificate in the browser.
- **PDF Export**: Generate high-quality, printable PDFs using `jspdf` and `svg2pdf.js`.
- **Interactivity**: Toggle a "CANCELED" watermark overlay.
- **Responsive Design**: Professional layout optimized for web and print.

## Tech Stack

- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Standard CSS
- **PDF Generation**: `jspdf` & `svg2pdf.js`

## Getting Started

### Prerequisites

Ensure you have one of the following installed:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Bun](https://bun.sh/) (This project contains a `bun.lock` file)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd certificate
   ```

2. **Install dependencies**:
   ```bash
   # If using npm
   npm install

   # If using bun
   bun install
   ```

### Running Locally

To start the development server and view the certificate:

```bash
# If using npm
npm run dev

# If using bun
bun run dev
```

Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173` or similar).

### Building for Production

To create a static production build:

```bash
# If using npm
npm run build

# If using bun
bun run build
```

The build artifacts will be generated in the `dist` directory, ready for deployment.

## Customization

The certificate content is structured directly within `index.html`. To customize the certificate data, edit the text content in `index.html`. The TypeScript logic (`src/main.ts`) dynamically reads these values from the DOM to generate the PDF, ensuring the downloaded file matches the preview.

### Editable Sections in `index.html`:

1.  **Company Details**: Edit `header` and `.title-section` for the company name and registration number.
2.  **Share Amount**: Update `.amount-number` and `.amount-text` for the number of shares.
3.  **Shareholder**: Modify the `.issued-to-name` element.
4.  **Certificate Details**: Update the `.certificate-details` block for ID, Certificate No, Class, and Date.
5.  **Signatories**: Change the names and titles in the `footer` -> `.signatures-wrapper` section.

## Certificate Requirements Guide

The following checklist outlines the standard requirements for a valid share certificate, as implemented in this project:

1. **The company’s name**
   - [x] As registered with the Companies and Intellectual Property Commission (CIPC).

2. **The company’s registration number**
   - [x] Included in the header section.

3. **The name of the shareholder**
   - [x] The full name of the person or entity in whose favour the certificate is issued.

4. **The number and class of shares**
   - [x] Example: “100 Ordinary Shares” or “50 Preference Shares.”

5. **The issue date of the certificate**
   - [x] A distinctive number or range of numbers identifying the specific shares (if applicable).

6. **An authorised signature or seal**
   - [x] The certificate must be signed by at least one director or an authorised officer of the company.
   - [x] Includes a digital representation of the company seal.