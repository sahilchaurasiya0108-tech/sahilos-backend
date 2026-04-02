/**
 * generateFunNotification
 * Returns a random Zomato/Duolingo-style notification object.
 */

const FUN_NOTIFICATIONS = {
  motivation: [
    { title: "Still here? 👀", message: "Your tasks are doing push-ups waiting for you 💪" },
    { title: "Rise and grind 🌅", message: "Your future self called. They said 'please, just start.'" },
    { title: "Plot twist incoming 🎬", message: "What if today was the day you actually finished that task?" },
    { title: "No pressure 🙃", message: "Your goals aren't going anywhere. Neither are you apparently." },
    { title: "Legend behavior 🏆", message: "You opened SahilOS. That's already progress 🫡" },
    { title: "Big brain move 🧠", message: "Planning to plan later? Peak productivity strategy." },
  ],
  roasting: [
    { title: "We need to talk 📞", message: "Productivity called… you didn't pick up 📞" },
    { title: "Oof 😬", message: "Your habits are on life support 😵‍💫 Please visit." },
    { title: "Not judging, but… 👀", message: "Future you is judging current you at an alarming rate." },
    { title: "Missing person alert 🚨", message: "Your habit streak was last seen 2 days ago. If found, please return." },
    { title: "Gentle reminder 🪦", message: "Your to-do list has aged like milk, not wine." },
    { title: "Math check ➗", message: "You have 24 hours in a day. SahilOS gets 0. Interesting choice." },
  ],
  productivity_humor: [
    { title: "Life update 📬", message: "Your tasks are staring at you 👀 Blink twice if you need help." },
    { title: "Existential check-in 🌌", message: "The tasks you avoid today become the regrets you carry tomorrow. No pressure." },
    { title: "Hot take 🌶️", message: "Checking SahilOS once a day keeps the chaos away. Allegedly." },
    { title: "Plot armor activated 🛡️", message: "Main characters finish their tasks. Just saying." },
    { title: "Science fact 🔬", message: "Studies show that people who open SahilOS are 100% cooler. (n=1, self-reported)" },
    { title: "True story 📖", message: "Your habits miss you 💔 They've been waiting by the door all day." },
  ],
  ai_personality: [
    { title: "AI observation 🤖", message: "I've noticed you haven't logged anything today. Suspicious activity detected." },
    { title: "System alert 🚨", message: "Your future self has filed a formal complaint. Resolution required ASAP." },
    { title: "Data insight 📊", message: "Correlation found: days you use SahilOS = days you feel like a functioning adult." },
    { title: "Processing… 💭", message: "Calculating your productivity score… error: insufficient data. Please do something." },
    { title: "AI wisdom 🧘", message: "Your future self says hello 🚀 and also 'what are you waiting for?'" },
    { title: "Neural network speaking 🕸️", message: "I ran 1000 simulations. In all of them, the version of you that logs habits wins." },
  ],
  seasonal: [
    { title: "New day, new you? 🌞", message: "Another day, another chance to pretend you're organized 🗂️" },
    { title: "Evening check-in 🌙", message: "How'd today go? Be honest. SahilOS is a judgment-free zone. Mostly." },
    { title: "Midday nudge ☀️", message: "Half the day is gone. The other half is full of potential. Allegedly." },
    { title: "Monday energy ⚡", message: "It's a new week! Time to make last week's you look like an amateur." },
    { title: "Friday feelings 🎉", message: "Week almost done! Did you do the things? Some of the things? Any of the things?" },
  ],
};

const ALL_NOTIFICATIONS = Object.values(FUN_NOTIFICATIONS).flat();

/**
 * @returns {{ title: string, message: string, type: 'fun', category: 'fun' }}
 */
function generateFunNotification(category = null) {
  let pool = ALL_NOTIFICATIONS;

  if (category && FUN_NOTIFICATIONS[category]) {
    pool = FUN_NOTIFICATIONS[category];
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    ...picked,
    type: "fun",
    category: "fun",
  };
}

/**
 * Get fun notifications by time of day
 */
function generateTimeAwareFunNotification() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return generateFunNotification("seasonal"); // morning
  if (hour >= 12 && hour < 17) return generateFunNotification("productivity_humor"); // afternoon
  if (hour >= 17 && hour < 21) return generateFunNotification("roasting"); // evening
  return generateFunNotification("ai_personality"); // night
}

module.exports = { generateFunNotification, generateTimeAwareFunNotification, FUN_NOTIFICATIONS };
