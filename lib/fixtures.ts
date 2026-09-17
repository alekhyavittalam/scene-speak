import type { Language, Lesson } from "@/lib/schemas";

export const sampleLessons: Record<Language, Lesson> = {
  hindi: {
    id: "sample-hindi-tumse-na-ho-payega",
    language: "hindi",
    original: "Tumse na ho payega.",
    naturalMeaning: "You're not going to be able to do this.",
    literalTranslation: "This will not be possible through you.",
    pronunciation: "TOOM-say naa ho paa-YAY-gaa",
    pronunciationLabel: "Pronunciation",
    toneLabels: ["Teasing", "Dismissive", "Context-sensitive"],
    toneExplanation: "Often delivered as playful trash talk between friends, but the same words can sound belittling when said seriously or by someone in authority.",
    whenToUse: "Joking with a close friend after they confidently attempt something they are famously bad at—especially when your tone makes the affection obvious.",
    whenNotToUse: "Avoid it when someone is genuinely struggling, asking for encouragement, or when you do not share an easy, teasing relationship.",
    vocabulary: [
      { term: "tumse", meaning: "from you / by you; implies your ability to do something" },
      { term: "na", meaning: "not; an informal spoken alternative to nahi here" },
      { term: "ho payega", meaning: "will be possible / will manage to happen" },
    ],
    similarExpression: { phrase: "Rehne do", meaning: "Leave it / don't bother", distinction: "This stops the attempt; it does not directly say the person is incapable." },
    quiz: [
      { id: "h-meaning", type: "meaning", prompt: "What does the speaker naturally mean?", options: ["You probably can't pull this off.", "You should try this later.", "You already did this well."], correctIndex: 0, explanation: "The phrase doubts the other person's ability, often playfully." },
      { id: "h-tone", type: "tone", prompt: "Which tone best fits a friendly use?", options: ["A formal compliment", "Playful, dismissive teasing", "A sincere apology"], correctIndex: 1, explanation: "Between close friends, it commonly works as teasing trash talk." },
      { id: "h-usage", type: "usage", prompt: "When is it safest to say this?", options: ["To a nervous colleague before a presentation", "To a stranger asking for help", "To a close friend attempting their famously terrible cooking"], correctIndex: 2, explanation: "Shared context and an affectionate tone make the teasing intent clear." },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  french: {
    id: "sample-french-laisse-tomber",
    language: "french",
    original: "Laisse tomber.",
    naturalMeaning: "Forget it, or let it go.",
    literalTranslation: "Let [it] fall.",
    pronunciation: "Less tom-BAY",
    pronunciationLabel: "Pronunciation",
    toneLabels: ["Casual", "Dismissive", "Resigned"],
    toneExplanation: "A very common conversational phrase. It can gently mean “don't worry about it,” or sharply mean “forget it,” depending on delivery.",
    whenToUse: "When a friend keeps worrying about a minor issue, or when you decide something is not worth pursuing anymore.",
    whenNotToUse: "Avoid a clipped delivery during a serious discussion; it can sound like you are shutting the other person down.",
    vocabulary: [
      { term: "laisse", meaning: "leave or let; informal singular command of laisser" },
      { term: "tomber", meaning: "to fall; together with laisse, forms an idiom" },
    ],
    similarExpression: { phrase: "C'est pas grave.", meaning: "It's no big deal.", distinction: "This reassures someone, while laisse tomber more directly tells them to drop the subject or effort." },
    quiz: [
      { id: "f-meaning", type: "meaning", prompt: "What does “Laisse tomber” usually mean in conversation?", options: ["Drop it / forget it.", "Be careful not to fall.", "Leave it on the floor."], correctIndex: 0, explanation: "The phrase is idiomatic; its natural meaning is to let the matter go." },
      { id: "f-tone", type: "tone", prompt: "How can the tone change its meaning?", options: ["It is always affectionate.", "It can sound reassuring or dismissive.", "It is only used formally."], correctIndex: 1, explanation: "Warm delivery can reassure, while a sharp delivery can shut down a conversation." },
      { id: "f-usage", type: "usage", prompt: "Which situation is a natural fit?", options: ["Greeting your manager", "Ordering at a bakery", "Telling a friend not to worry about a tiny mistake"], correctIndex: 2, explanation: "It naturally tells a friend to let a minor issue go." },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

export const samplePhrase: Record<Language, string> = {
  hindi: "Tumse na ho payega.",
  french: "Laisse tomber.",
};
