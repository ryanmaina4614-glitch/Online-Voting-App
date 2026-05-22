# VoteSecure

VoteSecure is a comprehensive, secure, and transparent online voting platform designed specifically for schools, universities, and clubs to conduct digital elections with ease and integrity.

## Key Features

- **Secure Authentication**: Integrated with Firebase Authentication to ensure that only authorized users can vote.
- **Election Management**: Admins can create and configure elections with specific start, end, and campaign periods.
- **Multimedia Campaigning**: Candidates can showcase their manifestos through text, images, audio, and video content that is securely managed and duration-locked.
- **Real-time Analytics**: Built-in dashboards allow users to view voter turnout statistics and results with dynamic, interactive charts.
- **Role-Based Access Control**: Clearly defined roles for voters, managers, and admins to ensure platform security.

## Technologies Used

- **Frontend**: React (18+), Vite, Tailwind CSS, Motion (Animations)
- **Backend/Database**: Firebase (Firestore, Auth)
- **Visualization**: Recharts (for turnout/results visualization)
- **Language**: TypeScript

## Project Structure

- `/src/components/`: Modular React components for the user interface, including dashboards, forms, and charting utilities.
- `/src/services/`: Firebase service configurations and utility functions.
- `/firestore.rules`: Security rules for the Firestore database, ensuring authorized data access and modifications.

---

*This application is managed and previewed through Google AI Studio, Ryan Maina and Alex Gachuhi.*
