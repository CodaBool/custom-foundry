export const MISSING_DESIRES = Object.freeze([6, 10, 12, 13, 21, 22])
export const MISSING_RELATIONSHIPS = Object.freeze([28, 30, 32, 33, 34])

export const DESIRES = Object.freeze([
  {
    "id": 1,
    "flavor": "What is right to be done cannot be done too soon",
    "desire": "Restore your reputation and be forgiven by your former friend",
    "description": "Once you enjoyed the pleasures of friendly company and good opinion until in a single instant, your mad passions led you to throw it all away. In one rash act you wronged another deeply and plunged yourself into interminable disrepute. Now all you seek is to bury your past, regain your good name, and find forgiveness.",
    "instructions": "Create and spread a rumor about what you did.",
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic"
  },
  {
    "id": 2,
    "flavor": "They were as strangers; worse than strangers for they could never become acquainted",
    "desire": "Convince your parent to accept you as their legitimate child, and declare your relation to all the world.",
    "description": "Though biology dictates that a child requires two parents, you have never beheld evidence of more than one. Born out of wedlock, your wealthier and more powerful progenitor refused to acknowledge you from an early age. Now the time has come for a family reunion. And, be it by charm, favours or less savoury means, you will find a way to have them acknowledge you as their own progeny.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "complex, age"
  },
  {
    "id": 3,
    "flavor": "Selfishness must always be forgiven you know, because there is no hope of a cure",
    "desire": "Receive proposals from or make successful proposals to at least two eligible individuals. Marry one and discreetly farewell the other.",
    "description": "People in this world are so unreliable. Even the most faithful of affections are quickly cast aside when a wealthier target comes into view. You have realised the folly of putting your hopes in but one place. The careful hunter checks all their snares—and only the finest morsel is cooked and eaten for dinner.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic"
  },
  {
    "id": 4,
    "flavor": "Our scars make us know that our past was real",
    "desire": "Take revenge on your rival for stealing what you love.",
    "description": "There’s but one thing you’ve loved  in this world. For a brief and shining moment, you thought it would be yours. Until your enemy intervened, and your chance at it withered like a rose in the winter time. You’ve been patiently waiting for your moment of revenge. Now, it’s finally here, and you couldn’t be more ready.",
    "instructions": "Work with the player of your rival to establish what they took from you.",
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "complex"
  },
  {
    "id": 5,
    "flavor": "A large income is the best recipe for happiness I ever heard of",
    "desire": "Come into substantial wealth, while ensuring your reputation stays absolutely impeccable.",
    "description": "You’ve always had a taste for luxury—be it grand balls, expensive clothing, or the race track. Now your debts are severe, and the time to pay is approaching. You need money fast. You can’t let anyone know your true situation however, as your good opinion and the help you receive from others would both be lost. You have to find a way to fix this without a stain on your name.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic"
  },
  {
    "id": 6,
    "flavor": "I always deserve the best treatment because I never put up with any other",
    "desire": "Disinherit your elder sibling.",
    "description": "Fie be the tradition that the first born inherits all, and the younger siblings are left without a penny. Your elder sibling is nothing but a fool, who would soon lead the estate to ruin. You must convince your parents to cut them out of the will, and name you as sole heir. You just need one scandal, betrayal, or ill-advised relationship to change their mind. After all, they’ve always liked you better.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": "Create a parent as a mandatory connection.",
    "difficulty": "basic"
  },
  {
    "id": 7,
    "flavor": "There are people, who the more you do for them, the less they will do for themselves",
    "desire": "Orchestrate at least one marriage between people of your choosing.",
    "description": "Love is a beautiful and tender thing, and an advantageous marriage is a financial and practical triumph. Of course, you see neither of these things in your immediate future, but that doesn’t mean you cannot involve yourself in their delights. There are so many people in your circles eminently suitable for each other. It is your pleasure—no, your duty—to help them along.",
    "instructions": "After the first novel chapter, decide on two potential couples and share these with the Facilitator. Your desire is to see one or both happily married.",
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic"
  },
  {
    "id": 8,
    "flavor": "What is right to be done cannot be done too soon",
    "desire": "Restore your family name, and resume your place in society.",
    "description": "Ten years ago, a huge scandal erupted that sent ripples of shame and outrage through local society. Your family were the ones to blame. They fled from the area, leaving the ancestral home empty. Now you’re back to restore your family’s reputation, and resume your place at the forefront of local society. The only problem is not everyone here is happy about it.",
    "instructions": "Create and spread two negative rumours about your family, and the scandal they caused.",
    "publicKnowledge": "The scandal your family caused.",
    "connection": null,
    "difficulty": "complex"
  },
  {
    "id": 9,
    "flavor": "Marriage is indeed a manoeuvring business",
    "desire": "Bolster your love interest’s reputation, and then win your parent’s permission to marry them.",
    "description": "In an ideal world, one is not dependent on the permission of one’s parents to pursue their deepest and most ardent affections. But sadly this is not an ideal world, and if you want to wed without losing that sweet inheritance, you’ll need permission from mummy and daddy. And of course, pleasing them means choosing a spouse with a completely impeccable reputation. In today’s world of endless gossip, this is no easy task.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": "Create a parent as a mandatory connection",
    "difficulty": "basic"
  },
  {
    "id": 10,
    "flavor": "A large income is the best recipe for happiness I ever heard of",
    "desire": "Enter into a marriage with someone who truly loves you— without revealing your hidden wealth.",
    "description": "You always thought yours was to be a humble lot in life for one born of the gentry. In fact, you liked it that way—free from the constraints of rank and social expectation. However, recently an unexpected inheritance has bestowed a vast fortune upon you. Your wealth is not yet known. But when word gets out, you will be plagued with false fortune seekers with but one motive. Before word spreads, you must find someone to marry who loves you for who you are, not your money.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic"
  },
  {
    "id": 11,
    "flavor": "There are people, who the more you do for them, the less they will do for themselves",
    "desire": "Protect your younger sibling from all ill, and make sure they marry who you choose.",
    "description": "Ever since your parents passed away, the world has been a cold, harsh place for you and your younger sibling. Fortunately, your parents left you, the eldest, with a generous income. But you have no guide on how to avoid the immoral and ill-meaning. Your younger sibling is naive, innocent, vulnerable. It is therefore your job to decide who they should marry, and arrange the match.",
    "instructions": "After the first novel chapter, decide who your younger sibling should marry—and protect them from all other advances.",
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic"
  },
  {
    "id": 12,
    "flavor": "A large income is the best recipe for happiness I ever heard of",
    "desire": "Appear to court your intended, while becoming secretly engaged to the object of your affections.",
    "description": "To live on less than £300 a year is frankly impossible. And yet, you cannot bring yourself to be one of those pathetic creatures who marries for money. Your aunt has told you she will pass to you her vast inheritance—if you agree to marry the person she has chosen. Fortunately, she has not long left. You must make her think you are following her plan, and secure your inheritance while secretly becoming engaged to the person you really love.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": "Create your aunt as a mandatory connection.",
    "difficulty": "complex"
  },
  {
    "id": 13,
    "flavor": "Our scars make us know that our past was real",
    "desire": "Get your inheritance back.",
    "description": "Three years ago, you did something that shocked your family so much, they disinherited you and disowned you. Now you’re back—ostensibly to make amends—but really to claim what’s rightfully yours. But how to make mummy and daddy love you again?",
    "instructions": "Create and spread a rumour about what you did.",
    "publicKnowledge": "You were disinherited.",
    "connection": "If you do not have the parent relationship card, create one as a mandatory connection.",
    "difficulty": "basic"
  },
  {
    "id": 14,
    "flavor": "Our scars make us know that our past was real",
    "desire": "Turn your enemy’s connections against them.",
    "description": "For years, you have lived in the shadow of another. You watched as they received the undeserved benefits of wealth, privilege and connection, while you were coldly overlooked. You suffered as the things you prized were taken from you, and given to them. No longer. Now is the time to correct the past’s mistakes. You are ready, willing, and able to turn the tables so emphatically, that they can never be turned back.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic"
  },
  {
    "id": 15,
    "flavor": "There are people, who the more you do for them, the less they will do for themselves",
    "desire": "Save your family from financial ruin so you can break off your engagement.",
    "description": "The irresponsible actions of your spendthrift family have left you all in dire financial straits. And you are the one to suffer for it! Your father refused to sell the family estate; instead he arranged your engagement to some insufferable rich person. You must act before you find yourself married. Sort out your family’s financial problems—whether by selling the estate or marrying off a more willing sibling—then call off the engagement post-haste.",
    "instructions": null,
    "publicKnowledge": "You are engaged",
    "connection": null,
    "difficulty": "complex"
  },
  {
    "id": 16,
    "flavor": "Marriage is indeed a manoeuvring business",
    "desire": "Marry your secret fiancé.",
    "description": "Three years ago, you and another were struck by Cupid’s arrow. You fell desperately in love, and became secretly engaged. You did not dare to tell your families as they would never approve of the match. Now it’s three years later, and the love that overcame your fiancé seems to be rapidly fading. This cannot be! The wedding must go ahead! Not only because of your feelings—but also a much more important reason— your fiancé is your only chance for position, status and rank you could never otherwise hope to achieve.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic"
  },
  {
    "id": 17,
    "flavor": "Selfishness must always be forgiven you know, because there is no hope of a cure",
    "desire": "Best or humiliate your cousin in every matter, and win your uncle’s inheritance.",
    "description": "Your uncle has recently turned his mind to settling his affairs. As he has no children of his own, his substantial inheritance can fall to only one of two parties. Yourself, or your infuriatingly perfect cousin. This wealth will elevate you from among the poorest of your peers to among the richest. Your cousin may have bested you many times prior. But from this day forth they shall never best you hence.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": "Create your uncle as a mandatory connection.",
    "difficulty": "basic"
  },
  {
    "id": 18,
    "flavor": "They were as strangers; worse than strangers for they could never become acquainted",
    "desire": "Determine your love’s true feelings, and re-establish your engagement.",
    "description": "Five years ago, you fell deeply in love with another in what was deemed an unsuitable match. You became secretly engaged. But your friends and family convinced you to break it off—and so you did. It was a decision you have regretted every day since. Now you find them once again among your circle of acquaintance. You must know, do they still feel the same way you do? And if they do, would they ever agree to re-establish your union— this time, for good?",
    "instructions": null,
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic"
  },
  {
    "id": 19,
    "flavor": "What is right to be done cannot be done too soon",
    "desire": "Break up the relationship between the object of your affection and their paramour.",
    "description": "The love you feel has burned strongly for years, and yet you have never acted upon it. There had been no moment. Your inaction proved almost fatal— it appears the one you love has now become enamoured with another. Well, you can no longer sit idly by and watch your chance at happiness slip away. You must divide the pair by any means possible.",
    "instructions": "If your relationship card is rivals, establish who the object of your affection is.",
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "complex"
  },
  {
    "id": 20,
    "flavor": "Marriage is indeed a manoeuvring business",
    "desire": "Marry in such a way as to impress your patron and win their support. between the object of your affection and their paramour.",
    "description": "But two years ago now, you would consider yourself doomed never to live the distinguished life of the genteel to which you aspire. Then you met your patron. For reasons that remain their own, they have agreed to gift you such support in your career and art as might elevate your rank. As a show of devotion they naturally require you to settle yourself in marriage to a person of whom they wholly approve.",
    "instructions": "Show this desire card to your patron.",
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic"
  },
  {
    "id": 21,
    "flavor": "Marriage is indeed a manoeuvring business",
    "desire": "Marry your child to somebody tremendously rich or of the peerage.",
    "description": "What, pray tell, is the purpose of having children if they aren’t to be of any use? No, no, your children are by far your best asset and you intend to utilise them fully, regardless of their own designs. They simply must marry in an advantageous manner; it’s a matter of common decency to all the family. And if they won’t, a few sharp words about their inheritance or current allowance ought to persuade them.",
    "instructions": null,
    "publicKnowledge": null,
    "connection": null,
    "difficulty": "basic, age"
  },
  {
    "id": 22,
    "flavor": "Our scars make us know that our past was real",
    "desire": "Reunite the feuding families, through marriage or inheritance.",
    "description": "Your family is trapped in a bitter feud, caught in an endless struggle with another family in town. In your grandparents’ day, the two sides worked together for the betterment of both. Until one day, a quarrel divided two families forever. Yet such a thing is preposterous— this antagonism threatens the fortunes and future of both families. You must find a way to end the feud before it destroys your inheritance.",
    "instructions": null,
    "publicKnowledge": "The existence of the feud, and who it is between, is well known in the local town.",
    "connection": null,
    "difficulty": "complex"
  }
])

export const RELATIONSHIPS = Object.freeze([
  {
    "id": 23,
    "publicRelationship": "Best of Friends",
    "publicDescription": "The giver and taker of this card are the most intimate companions, and longstanding friends",
    "privateRelationship": "Best of Friends",
    "privateDescription": "The giver and taker of this card are the most intimate companions, longstanding friends, and are well disposed to help with each other’s plans and endeavours."
  },
  {
    "id": 24,
    "publicRelationship": "Former Friend",
    "publicDescription": "The giver and taker of this card were former friends, until the giver’s cruel actions ended the relationship abruptly.",
    "privateRelationship": "Former Friend",
    "privateDescription": "The giver of this card wronged the taker painfully, and completely."
  },
  {
    "id": 25,
    "publicRelationship": "Friends",
    "publicDescription": "The giver and taker of this card are longstanding acquaintances. They still visit on the rare occasion.",
    "privateRelationship": "Old Flame",
    "privateDescription": "The giver and taker of this card are old flames. They had a romance once, and while the raging fire of their feelings has quietened, the spark never truly dies."
  },
  {
    "id": 26,
    "publicRelationship": "Old Family Friend",
    "publicDescription": "The giver and taker of this card are old family friends. Years ago, their families were quite well acquainted. But since the giver’s youth they have rarely corresponded.",
    "privateRelationship": "Parent & Child",
    "privateDescription": "The giver of this card is the illegitimate child of the taker. The taker rejected their child from birth to avoid scandal and disrepute to their family and name. The taker has not laid eyes on their child since their infancy."
  },
  {
    "id": 27,
    "publicRelationship": "Siblings",
    "publicDescription": "The taker of this card is the sibling of the giver. The giver will determine who is older and who is younger.",
    "privateRelationship": "Siblings",
    "privateDescription": "The taker of this card is the sibling of the giver. The giver will determine who is older and who is younger."
  },
  {
    "id": 28,
    "publicRelationship": "Rival",
    "publicDescription": "The giver and taker of this card are rivals.",
    "privateRelationship": "Rival",
    "privateDescription": "The giver and taker of this card are rivals. For the taker, this may be a trivial rivalry— for the giver, it is certainly a bitter one."
  },
  {
    "id": 29,
    "publicRelationship": "Relation",
    "publicDescription": "Though not in the same immediate family, the giver and the taker of this card are relations. One is the cousin, aunt, uncle, niece, or nephew of the other. The giver will determine their relationship.",
    "privateRelationship": "Relation",
    "privateDescription": "Though not in the same immediate family, the giver and the taker of this card are relations. One is the cousin, aunt, uncle, niece, or nephew of the other. The giver will determine their relationship."
  },
  {
    "id": 30,
    "publicRelationship": "Object of Affection",
    "publicDescription": "The giver of this card is clearly in love with the taker.",
    "privateRelationship": "Object of Affection",
    "privateDescription": "The giver of this card is clearly in love with the taker. Whether the taker chooses to reciprocate this affection is entirely up to them."
  },
  {
    "id": 31,
    "publicRelationship": "Acquaintances",
    "publicDescription": "The giver and taker of this card became friends during a season in London three years ago.",
    "privateRelationship": "Secret Fiancés",
    "privateDescription": "The giver and taker of this card have been secretly engaged for years, despite the disapproval of one of their families. While the giver wishes to go ahead, the taker has become reluctant. The taker is higher in social status or wealthier than the giver."
  },
  {
    "id": 32,
    "publicRelationship": "Intended",
    "publicDescription": "The giver and taker of this card are publicly engaged or betrothed.",
    "privateRelationship": "Intended",
    "privateDescription": "The giver and taker of this card are publicly engaged or betrothed."
  },
  {
    "id": 33,
    "publicRelationship": "Parent & Child",
    "publicDescription": "The giver of this card is the parent or guardian of the taker.",
    "privateRelationship": "Parent & Child",
    "privateDescription": "The giver of this card is the parent or guardian of the taker."
  },
  {
    "id": 34,
    "publicRelationship": "Child & Parent",
    "publicDescription": "The giver of this card is the child or ward of the taker.",
    "privateRelationship": "Child & Parent",
    "privateDescription": "The giver of this card is the child or ward of the taker."
  },
  {
    "id": 35,
    "publicRelationship": "Patron",
    "publicDescription": "The taker of this card is the patron of the giver.",
    "privateRelationship": "Patron",
    "privateDescription": "The taker of this card is the patron of the giver, for now. What the giver must do to maintain such a relationship we will discover."
  },
  {
    "id": 36,
    "publicRelationship": "Mentor",
    "publicDescription": "The taker of this card is the mentor of the giver. The giver is their protégé.",
    "privateRelationship": "Mentor",
    "privateDescription": "The taker of this card is the mentor of the giver. The giver is their protégé."
  }
])

export function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function getAvailableDesires() {
  return DESIRES.filter(card => !MISSING_DESIRES.includes(card.id))
}

export function getAvailableRelationships(claimedIds = []) {
  const claimed = new Set([...claimedIds].map(Number))
  return RELATIONSHIPS.filter(
    card =>
      !MISSING_RELATIONSHIPS.includes(card.id) &&
      !claimed.has(card.id),
  )
}
