# VoteSecure

VoteSecure is a comprehensive, secure, and transparent online voting platform designed specifically for schools, universities, and clubs to conduct digital elections with ease and integrity.

## Key Features

- **Secure Authentication**: Integrated with Firebase Authentication to ensure that only authorized users can vote.
- **Dynamic Internationalization & Multi-Language Support (i18n)**: Fully globalized platform sporting real-time local translation toggles for English (en), Kiswahili (sw), Oluganda (lg), and Français (fr).
- **Cryptographic PDF Receipt Generation**: Allows voters to downlaod a secure, printable, tamper-evident digital receipt of their ballot, containing the zero-knowledge receipt verification token, candidate privacy masks, and UTC timestamps.
- **Election Management**: Admins can create and configure elections with specific start, end, and campaign periods.
- **Multimedia Campaigning**: Candidates can showcase their manifestos through text, images, audio, and video content that is securely managed and duration-locked.
- **Real-time Analytics**: Built-in dashboards allow users to view voter turnout statistics and results with dynamic, interactive charts.
- **Role-Based Access Control**: Clearly defined roles for voters, managers, and admins to ensure platform security.

## Technologies Used

- **Frontend**: React (18+), Vite, Tailwind CSS, Motion (Animations)
- **Backend/Database**: Firebase (Firestore, Auth)
- **Visualization**: Recharts (for turnout/results visualization)
- **PDF Generation**: jsPDF (for client-side cryptographically signed ballot receipts)
- **Language & Globalization**: TypeScript, Custom lightweight i18n Translation Engine

## Project Structure

- `/src/components/`: Modular React components for the user interface, including dashboards, forms, and charting utilities.
- `/src/services/`: Firebase service configurations and utility functions.
- `/firestore.rules`: Security rules for the Firestore database, ensuring authorized data access and modifications.

## 🎨 Visual Identity & Brand Symbolism

The customized flat-vector **VoteSecure Logo** symbolizes the absolute triad of secure voting systems:
- **The Shield Overlay**: Stands for the rock-solid security protocols, ensuring absolute prevention of unauthorized actions.
- **The Dynamic Checkmark**: Represents user choice, prompt delivery, and the democratic casting of ballots.
- **The deep Indigo gradients**: Portray corporate trust, modern technology, and user interface elegance.

## 💻 How to Run the System on a PC

Running VoteSecure locally on your own machine is straightforward. Follow these instructions:

### Prerequisites

Make sure you have the following installed on your computer:
1. **Node.js** (v18.0.0 or higher recommended) - [Download Node.js](https://nodejs.org/)
2. **npm** (usually bundled automatically with Node.js)

### Installation Steps

1. **Download/Clone the Repository**
   Download the project files to your local machine into a folder of your choosing.

2. **Open Terminal & Navigate**
   Open your preferred terminal app (Command Prompt, PowerShell, or Git Bash on Windows; Terminal on macOS/Linux) and navigate to the project directory:
   ```bash
   cd path/to/votesecure
   ```

3. **Install Dependencies**
   Run the following command to download all required frontend and utility packages:
   ```bash
   npm install
   ```

4. **Synchronize Environment Variables**
   - Copy the `.env.example` file to a new file named `.env` in the root folder:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and configure your keys if necessary. Keep in mind that for full functional sandbox demoing, default environment configurations are already embedded.

5. **Start the Local Development Server**
   Spin up the Vite development server with hot-reloading:
   ```bash
   npm run dev
   ```

6. **Access the App**
   Open your web browser and go to:
   ```
   http://localhost:3000
   ```

---

*This application is managed and previewed through Google AI Studio, Ryan Maina and Alex Gachuhi.*
