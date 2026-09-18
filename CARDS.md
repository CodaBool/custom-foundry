# notes on gameplay
- can monologue to get the inner monologue of a target
  - each player gets one monologue token. play your monologue token on another player. That character must immediately reveal their innermost thoughts and feelings through an inner monologue. Can either be pointed: "Who does he really love?" or as for their present thoughts and feelings.
- rumors
  - made during rumour and scandal phase
- inner conflict (game cuts these for one-shot though)
- sets define desire -> relationship
  - everyone must have taken and given 1 relationship
  
- rom com
  - desire: 1, relationship 24, role: meddler, family: peerage
  - desire: 3, relationship 36, role: new arrival, family: ill-reputed
  - desire: 5, relationship 28, role: socialite, family: old money
  - desire: 7, relationship 25, role: heir, family: new money
  - desire: 11, relationship 27, role: cornerstone, family: clergy
  - desire: 16, relationship 31, role: hedonist, family: humble origins
- farce
  - desire: 9, relationship 30, role: meddler, family: new money
  - desire: 3, relationship 29, role: hedonist, family: foreign
  - desire: 19, relationship 28, role: socialite, family: military
  - desire: 7, relationship 25, role: heir, family: old money
  - desire: 20, relationship 35, role: careerist, family: take sibling's
  - desire: 5, relationship 23, role: dependant, family: humble origins
- drama
  - desire: 2, relationship 26, role: dependant, family: foreign
  - desire: 8, relationship 24, role: dowager, family: , family: peerage
  - desire: 18, relationship 25, role: careerist, family: military 
  - desire: 4, relationship 28, role: heir, family: new money 
  - desire: 16, relationship 31, role: hedonist, family: humble origins
  - desire: 1, relationship 29, role: meddler, family: old money
  
  
desires: 1,2,3,4,5,7,8,9,11,16,18,19,20 [missing 6 AGREE, 10 AGREE, 12 AGREE, 13 AGREE, 14 DISAGREE, 15 DISAGREE, 17 MILD DISAGREE, 21 AGREE, 22 AGREE]
relationship: 23,24,25,26,27,28,29,30,31,35,36 [32 MILD AGREE, 33 AGREE, 34 AGREE]
roles: meddler, new arrival, socialite, heir, cornerstone, hedonist, careerist, dependant, dowager [missing tutor]
family: peerage, ill-reputed, old money, new money, clergy, humble origins, foreign, military [all]



---
# open
customFoundry.relationships.open()

# clear
customFoundry.relationships.open()

# inspect
customFoundry.relationships.open()


---

# changes
- do not show any potential takers who are not currently online. You can remove their online/offline status text
- the user doesn't need to see the relationship or desire number. Just remove that from the UI.
- remove text "Claimed cards disappear for everyone"
- some relationships are too long descriptions for the size of the card. Increase the size of the card to contain it. Same for desire
- change "Select to reveal public site" to "Select to see more"
