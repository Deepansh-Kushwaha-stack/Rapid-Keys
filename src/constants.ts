export const TYPING_TEXTS = [
  "Mastering the art of touch typing is a journey of muscle memory and focus. By keeping your fingers on the home row, you unlock the potential for incredible speed and accuracy. Every keystroke becomes second nature as you transition from looking at the keys to feeling the rhythm of the language flowing through your fingertips.",
  "The QWERTY keyboard layout was originally designed for mechanical typewriters to prevent clashing keys. Today, it remains the global standard for digital communication. Learning to navigate this layout efficiently is the first step toward becoming a proficient digital citizen in our fast-paced, information-driven world.",
  "Speed is often the most visible metric of a great typist, but accuracy is the true foundation of excellence. A high words-per-minute count means little if the text is riddled with errors. True mastery comes when you can maintain a steady pace while keeping your mistake count near zero, ensuring your thoughts are translated perfectly to the screen.",
  "Ergonomics play a vital role in long-term typing health. Maintaining a neutral wrist position and taking regular breaks can prevent strain and improve your overall performance. A comfortable setup allows you to focus entirely on the text, turning the act of typing into a seamless extension of your creative process.",
  "The history of typing spans from the early mechanical inventions of the nineteenth century to the sophisticated mechanical and membrane switches of today. Each era has brought new innovations that have shaped how we interact with technology, making the keyboard one of the most enduring and essential tools ever created.",
  "Competitive typing has grown into a global phenomenon, with enthusiasts pushing the boundaries of human performance. Top typists can exceed two hundred words per minute, demonstrating a level of coordination and focus that is truly inspiring. Whether for work or play, improving your typing skills is a rewarding endeavor.",
  "Programming requires a unique kind of typing skill, often involving special characters and complex syntax. Developing a high level of comfort with the keyboard allows developers to focus on logic and problem-solving rather than searching for symbols. Efficiency at the keys translates directly to productivity in the world of software development.",
  "Digital literacy begins with the ability to communicate effectively through text. In an age where most of our interactions happen behind a screen, being a fast and accurate typist is a superpower. It allows you to express your ideas clearly and respond to others with the speed that modern communication demands.",
  "The feeling of a high-quality mechanical keyboard is unmatched for many enthusiasts. The tactile feedback and audible click of each switch provide a satisfying sensory experience that can make even the most mundane typing tasks feel like a joy. Choosing the right switches is a personal journey of finding the perfect balance of sound and feel.",
  "Practice is the only way to truly improve your typing speed. Consistency is key; even ten minutes of dedicated practice each day can lead to significant improvements over time. By challenging yourself with different texts and focusing on your weak points, you can steadily climb the leaderboard and achieve your goals.",
  "Accuracy is not just about avoiding typos; it is about building confidence. When you know you can hit every key correctly without looking, your mind is free to wander and explore new ideas. This mental freedom is one of the greatest benefits of becoming a proficient touch typist.",
  "The evolution of the keyboard continues with the rise of virtual and haptic interfaces. While touchscreens have changed how we type on the go, the physical keyboard remains the king of productivity. Its tactile nature and fixed layout provide a level of speed and reliability that virtual keys have yet to fully replicate.",
  "Typing is a form of digital craftsmanship. Each word you type is a brick in the wall of your digital legacy. Whether you are writing a novel, coding an app, or simply chatting with friends, the quality of your typing reflects the care and attention you put into your work.",
  "The rhythm of typing can be almost meditative. When you find your flow, the sound of the keys becomes a steady beat that accompanies your thoughts. This state of flow is where your best work happens, and a high level of typing proficiency is the key that unlocks it.",
  "Learning to type without looking at the keyboard is a transformative experience. It changes your relationship with your computer, making it feel less like a machine and more like a part of yourself. This connection is what allows you to work at the speed of thought, bringing your ideas to life with effortless grace."
];

export const getRandomText = (excludeText?: string) => {
  if (TYPING_TEXTS.length <= 1) return TYPING_TEXTS[0];
  
  let newText = TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)];
  while (newText === excludeText) {
    newText = TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)];
  }
  return newText;
};
