# AccountaBuddy

**AccountaBuddy: Motivation that calls you**

## Table of Contents
- [Inspiration](#inspiration)
- [What it Does](#what-it-does)
- [How We Built It](#how-we-built-it)
- [Challenges We Ran Into](#challenges-we-ran-into)
- [Accomplishments that We're Proud Of](#accomplishments-that-were-proud-of)
- [What We Learned](#what-we-learned)
- [What's Next for AccountaBuddy](#whats-next-for-accountabuddy)
- [Setup and Installation](#setup-and-installation)

---

## Inspiration
As college students, staying motivated to complete tasks can be a struggle. We realized that sometimes, a little external encouragement can make all the difference. AccountaBuddy is designed to provide that extra push by acting as a personal accountability assistant, helping users stay organized, prioritize tasks, and stay on track with friendly, AI-powered reminders. Instead of relying solely on willpower, AccountaBuddy becomes your supportive partner in getting things done.

## What it Does
AccountaBuddy is a collaborative AI accountability assistant that does more than just remind you of your to-do list. Users can:
- Create an account and add tasks with scheduled check-in times.
- Receive calls from AccountaBuddy at the scheduled times to check on their progress.
- If a task is completed, AccountaBuddy celebrates the achievement. If not, it helps users identify any obstacles and suggests ways to get back on track.
- Organize and prioritize tasks interactively, breaking down vague goals into actionable steps.

AccountaBuddy goes beyond reminders—it's a true collaborator that helps users turn plans into action.

## How We Built It
With just the two of us, we combined several technologies to bring AccountaBuddy to life:
- **Frontend**: Built with JavaScript, React, and Next.js to create a simple, responsive user interface.
- **Backend**: Used Prisma to manage our user and task database.
- **Voice Calls**: Integrated bland.ai to enable real-time calls that check in on user progress.
- **AI Logic**: Leveraged ChatGPT to provide a conversational experience and personalized support.

Together, these tools enable AccountaBuddy to assist users in staying organized, prioritizing tasks, and achieving their goals.

## Challenges We Ran Into
As a two-person team, managing the technical complexity of this project was challenging. Key obstacles included:
- **React State Management**: Handling real-time updates to lists and task data, which required an in-depth understanding of React’s component lifecycle.
- **API Coordination**: Integrating multiple APIs (ChatGPT, bland.ai, and our backend) to ensure smooth, real-time interactions.
- **Background Processing**: Managing scheduled calls and reminders required careful handling of asynchronous processes.

Each of these challenges tested our problem-solving skills, but overcoming them was immensely rewarding.

## Accomplishments that We're Proud Of
We’re proud to have taken on a project of this scale with just two people. Some of our biggest achievements include:
- **Successfully Integrating Real-Time AI Calls**: Combining bland.ai and ChatGPT to create a seamless, interactive experience.
- **Creating a True Accountability Partner**: AccountaBuddy doesn’t just remind users; it actively engages with them to help prioritize and organize tasks, making it a supportive productivity tool.
- **Building a Reliable Background System**: Developing a background processing system to handle scheduled calls and reminders, providing a smooth user experience.

## What We Learned
This project taught us a lot about:
- **React Lifecycle Management**: Understanding and effectively managing state in a dynamic app.
- **API Integration**: Working with multiple APIs and learning best practices for handling errors and optimizing data flow.
- **Collaboration**: As a small team, we each took on multiple roles, from frontend and backend development to project management and API integration.

## What's Next for AccountaBuddy
Our future plans for AccountaBuddy include:
1. **Stripe Integration**: To offer AccountaBuddy as a subscription-based service.
2. **Real-Time Voice Interactions**: Expanding the assistant’s capabilities with live conversational interactions powered by ChatGPT, allowing users and the AI to collaborate in real time.
3. **Enhanced Productivity Features**: We aim to evolve AccountaBuddy into a comprehensive productivity tool that helps users not only stay accountable but also actively supports them in reaching their goals.

## Setup and Installation

To run AccountaBuddy locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/AccountaBuddy.git
   cd AccountaBuddy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the environment variables:**
   - You will need API keys for bland.ai and ChatGPT to enable voice calls and conversation logic.
   - Set up a `.env` file in the root directory and add your API keys:
     ```plaintext
     BLAND_AI_API_KEY=your_bland_ai_key
     CHATGPT_API_KEY=your_chatgpt_key
     ```

4. **Run the app:**
   ```bash
   npm run dev
   ```

5. **Visit the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser to see AccountaBuddy in action.